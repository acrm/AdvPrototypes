import React, { useState, useCallback, useEffect } from 'react'
import { GameState, Vector2, GameObject, Item } from '../types/game'
import { initializeMap, isSleeping, refreshSpawnZones } from '../systems/MapGenerator'
import { findPathWithObstacles, getRandomWalkablePosition, isPositionWalkable } from '../systems/Pathfinding'
import { DungeonCanvas } from './DungeonCanvas'
import { InfoPanel } from './InfoPanel'
import './DungeonGame.css'

export const DungeonGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { map, partyStartPosition } = initializeMap()
    return {
      map,
      party: {
        position: partyStartPosition,
        members: ['Warrior', 'Rogue', 'Cleric'],
        path: [],
        targetPosition: null,
        observedCreatures: new Map(),
        direction: -Math.PI / 2, // pointing up initially
        carriedItem: null,
      },
      selectedObject: null,
      gameTime: 0,
      cycleTime: 120, // Start at midday (cycle is 0-240)
      isMoving: false,
    }
  })

  const PICKUP_RADIUS = 30

  const distanceBetween = (a: Vector2, b: Vector2): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  const findNearbyItem = (items: Item[], position: Vector2, radius: number): Item | null => {
    const nearby = items.find((item) => distanceBetween(item.position, position) <= radius)
    return nearby || null
  }

  const interactWithItem = (state: GameState, item: Item): GameState => {
    // Pick up if close enough and inventory is empty
    if (!state.party.carriedItem && distanceBetween(state.party.position, item.position) <= PICKUP_RADIUS) {
      return {
        ...state,
        map: {
          ...state.map,
          items: state.map.items.filter((existingItem) => existingItem.id !== item.id),
        },
        party: {
          ...state.party,
          carriedItem: item,
          path: [],
          targetPosition: null,
        },
        isMoving: false,
        selectedObject: null,
      }
    }

    // Move toward item for pickup if it is not nearby
    const itemPath = findPathWithObstacles(
      state.party.position,
      item.position,
      state.map.objects,
      state.map.width,
      state.map.height
    )

    if (itemPath.length === 0) {
      return {
        ...state,
        isMoving: false,
        selectedObject: item,
      }
    }

    return {
      ...state,
      party: {
        ...state.party,
        path: itemPath,
        targetPosition: item.position,
      },
      isMoving: true,
      selectedObject: item,
    }
  }

  const dropCarriedItemAtPosition = (state: GameState, dropPosition: Vector2): GameState => {
    if (!state.party.carriedItem) {
      return state
    }

    if (!isPositionWalkable(dropPosition, state.map.objects)) {
      return state
    }

    const droppedItem: Item = {
      ...state.party.carriedItem,
      type: 'item',
      position: dropPosition,
    }

    return {
      ...state,
      map: {
        ...state.map,
        items: [...state.map.items, droppedItem],
      },
      party: {
        ...state.party,
        carriedItem: null,
      },
      selectedObject: droppedItem,
    }
  }

  // Update party position along path
  useEffect(() => {
    if (!gameState.isMoving) return

    const interval = setInterval(() => {
      setGameState((prev) => {
        const path = [...prev.party.path]
        if (path.length === 0) {
          return {
            ...prev,
            party: { ...prev.party, targetPosition: null },
            isMoving: false,
          }
        }

        const nextPos = path[0]
        const distance = Math.sqrt(
          Math.pow(nextPos.x - prev.party.position.x, 2) +
          Math.pow(nextPos.y - prev.party.position.y, 2)
        )

        // Speed: 2 pixels per frame
        const speed = 2
        if (distance < speed) {
          // Reached waypoint, remove it
          path.shift()
          if (path.length === 0) {
            // Reached target: stop, clear target, and auto-pick nearby item if possible
            let updatedMap = prev.map
            let carriedItem = prev.party.carriedItem

            if (!carriedItem) {
              const targetPosition = prev.party.targetPosition ?? nextPos
              const nearbyItem = findNearbyItem(prev.map.items, targetPosition, PICKUP_RADIUS)

              if (nearbyItem) {
                updatedMap = {
                  ...prev.map,
                  items: prev.map.items.filter((item) => item.id !== nearbyItem.id),
                }
                carriedItem = nearbyItem
              }
            }

            return {
              ...prev,
              map: updatedMap,
              party: {
                ...prev.party,
                position: nextPos,
                path: [],
                targetPosition: null,
                carriedItem,
              },
              isMoving: false,
              gameTime: prev.gameTime + 0.001,
            }
          }
        }

        // Move towards next waypoint
        const angle = Math.atan2(nextPos.y - prev.party.position.y, nextPos.x - prev.party.position.x)
        const newPos = {
          x: prev.party.position.x + Math.cos(angle) * speed,
          y: prev.party.position.y + Math.sin(angle) * speed,
        }

        return {
          ...prev,
          party: {
            ...prev.party,
            position: newPos,
            path,
            direction: angle,
          },
          gameTime: prev.gameTime + 0.001,
        }
      })
    }, 30)

    return () => clearInterval(interval)
  }, [gameState.isMoving])

  // Creature random movement and state updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        // Update cycle time (240 seconds = full cycle)
        const nextGameTime = prev.gameTime + 0.05
        const newCycleTime = (prev.cycleTime + 0.05) % 240

        const updatedCreatures = prev.map.creatures.map((creature) => {
          // Update creature state based on sleep schedule
          const shouldSleep = isSleeping(creature.sleepSchedule, newCycleTime)
          const newState: 'sleeping' | 'idle' | 'patrol' = shouldSleep
            ? 'sleeping'
            : (creature.waypoints.length > 0 ? 'patrol' : 'idle')

          // Sleeping creatures don't move
          if (newState === 'sleeping') {
            return {
              ...creature,
              state: newState,
              waypoints: [], // Clear waypoints when sleeping
            }
          }

          // If no waypoints, generate new ones using pathfinding
          if (creature.waypoints.length === 0) {
            // Idle behavior: rotate every 1-2 seconds
            if (prev.gameTime >= creature.nextIdleTurnAt) {
              const nextInterval = 1 + Math.random()
              return {
                ...creature,
                state: 'idle' as const,
                direction: Math.random() * Math.PI * 2,
                idleTurnInterval: nextInterval,
                nextIdleTurnAt: prev.gameTime + nextInterval,
              }
            }

            // Occasionally begin patrol route
            if (Math.random() > 0.01) {
              return {
                ...creature,
                state: 'idle' as const,
              }
            }

            // Generate a random walkable target position
            const randomTarget = getRandomWalkablePosition(
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )
            const newPath = findPathWithObstacles(
              creature.position,
              randomTarget,
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )

            return {
              ...creature,
              state: (newPath.length > 0 ? 'patrol' : 'idle') as 'patrol' | 'idle',
              waypoints: newPath,
            }
          }

          const target = creature.waypoints[0]
          const distance = Math.sqrt(
            Math.pow(target.x - creature.position.x, 2) +
            Math.pow(target.y - creature.position.y, 2)
          )

          // Reached waypoint, remove it
          if (distance < creature.speed * 2) {
            const newWaypoints = [...creature.waypoints]
            newWaypoints.shift()
            // If no more waypoints, will generate new path next iteration
            return { 
              ...creature, 
              state: (newWaypoints.length > 0 ? 'patrol' : 'idle') as 'patrol' | 'idle',
              waypoints: newWaypoints 
            }
          }

          // Move towards waypoint
          const angle = Math.atan2(target.y - creature.position.y, target.x - creature.position.x)
          const newPos = {
            x: creature.position.x + Math.cos(angle) * creature.speed,
            y: creature.position.y + Math.sin(angle) * creature.speed,
          }

          // Keep within map bounds
          newPos.x = Math.max(30, Math.min(prev.map.width - 30, newPos.x))
          newPos.y = Math.max(30, Math.min(prev.map.height - 30, newPos.y))

          // Safety guard: never enter wall cells
          if (!isPositionWalkable(newPos, prev.map.objects)) {
            return {
              ...creature,
              state: 'idle' as const,
              waypoints: [],
            }
          }

          return {
            ...creature,
            position: newPos,
            direction: angle,
            state: 'patrol' as const,
          }
        })

        const updatedMap = refreshSpawnZones(
          {
            ...prev.map,
            creatures: updatedCreatures,
          },
          nextGameTime,
          newCycleTime,
          prev.party.carriedItem
        )

        return {
          ...prev,
          map: updatedMap,
          gameTime: nextGameTime,
          cycleTime: newCycleTime,
        }
      })
    }, 50) // Update creatures every 50ms

    return () => clearInterval(interval)
  }, [])

  const handleCanvasClick = useCallback((clickPos: Vector2) => {
    setGameState((prev) => {
      // Check if click is on any object
      for (const obj of prev.map.objects) {
        if (isPointInRect(clickPos, obj)) {
          return { ...prev, selectedObject: obj }
        }
      }
      for (const creature of prev.map.creatures) {
        if (isPointInRect(clickPos, creature)) {
          // Update observations
          const newObservations = new Map(prev.party.observedCreatures)
          newObservations.set(creature.id, (newObservations.get(creature.id) || 0) + 1)
          return {
            ...prev,
            selectedObject: creature,
            party: { ...prev.party, observedCreatures: newObservations },
          }
        }
      }
      for (const item of prev.map.items) {
        if (isPointInRect(clickPos, item)) {
          return interactWithItem(prev, item)
        }
      }
      if (isPointInRect(clickPos, prev.map.artifact)) {
        return { ...prev, selectedObject: prev.map.artifact }
      }

      // Check if click is on party
      if (
        distanceBetween(clickPos, prev.party.position) < 30
      ) {
        // Drop carried item at party position
        if (prev.party.carriedItem) {
          return dropCarriedItemAtPosition(prev, prev.party.position)
        }

        // Show party info
        return { ...prev, selectedObject: null }
      }

      // Drop carried item to nearby clicked ground
      if (
        prev.party.carriedItem &&
        distanceBetween(clickPos, prev.party.position) <= PICKUP_RADIUS &&
        isPositionWalkable(clickPos, prev.map.objects)
      ) {
        return dropCarriedItemAtPosition(prev, clickPos)
      }

      // Otherwise, move party to clicked position
      const path = findPathWithObstacles(
        prev.party.position,
        clickPos,
        prev.map.objects,
        prev.map.width,
        prev.map.height
      )

      if (path.length === 0) {
        return {
          ...prev,
          party: {
            ...prev.party,
            path: [],
            targetPosition: null,
          },
          isMoving: false,
          selectedObject: null,
        }
      }

      return {
        ...prev,
        party: {
          ...prev.party,
          path,
          targetPosition: clickPos,
        },
        isMoving: true,
        selectedObject: null,
      }
    })
  }, [])

  const handlePickUpSelected = useCallback(() => {
    setGameState((prev) => {
      if (!prev.selectedObject || prev.selectedObject.type !== 'item') {
        return prev
      }

      const selectedItem = prev.map.items.find((item) => item.id === prev.selectedObject?.id)
      if (!selectedItem) {
        return prev
      }

      return interactWithItem(prev, selectedItem)
    })
  }, [])

  const handleDropCarried = useCallback(() => {
    setGameState((prev) => dropCarriedItemAtPosition(prev, prev.party.position))
  }, [])

  const isPointInRect = (point: Vector2, obj: GameObject): boolean => {
    return (
      point.x >= obj.position.x - obj.width / 2 &&
      point.x <= obj.position.x + obj.width / 2 &&
      point.y >= obj.position.y - obj.height / 2 &&
      point.y <= obj.position.y + obj.height / 2
    )
  }

  return (
    <div className="dungeon-game">
      <DungeonCanvas
        gameState={gameState}
        onCanvasClick={handleCanvasClick}
      />
      <InfoPanel
        selectedObject={gameState.selectedObject}
        party={gameState.party}
        cycleTime={gameState.cycleTime}
        canPickUpSelected={
          gameState.selectedObject?.type === 'item' && !gameState.party.carriedItem
        }
        canDropCarried={Boolean(gameState.party.carriedItem)}
        onPickUpSelected={handlePickUpSelected}
        onDropCarried={handleDropCarried}
      />
    </div>
  )
}
