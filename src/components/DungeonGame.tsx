import React, { useState, useCallback, useEffect } from 'react'
import { GameState, Vector2, GameObject, Item, Food, Trap } from '../types/game'
import { initializeMap, isSleeping, refreshSpawnZones } from '../systems/MapGenerator'
import { findPathWithObstacles, getRandomWalkablePosition, isPositionWalkable } from '../systems/Pathfinding'
import { GAME_SETTINGS } from '../config/gameSettings'
import { DungeonCanvas } from './DungeonCanvas'
import { InfoPanel } from './InfoPanel'
import './DungeonGame.css'

const PLAYER_MOVEMENT_TICK_MS = GAME_SETTINGS.player.movementTickMs
const PLAYER_SPEED_PER_TICK = GAME_SETTINGS.player.speedPerTick
const PLAYER_INTERACTION_RADIUS = GAME_SETTINGS.player.interactionRadius
const PLAYER_PICKUP_RADIUS = GAME_SETTINGS.player.pickupRadius
const PLAYER_TIME_STEP = GAME_SETTINGS.player.timeStep
const CREATURE_TICK_MS = GAME_SETTINGS.cycle.creatureTickMs
const CYCLE_STEP = GAME_SETTINGS.cycle.creatureTimeStep
const CYCLE_DURATION_SECONDS = GAME_SETTINGS.cycle.durationSeconds
const NPC_PATROL_START_CHANCE = GAME_SETTINGS.npc.patrolStartChancePerTick
const NPC_WAYPOINT_REACH_MULTIPLIER = GAME_SETTINGS.npc.waypointReachDistanceMultiplier
const NPC_BOUNDARY_PADDING = GAME_SETTINGS.npc.mapBoundaryPadding
const [NPC_IDLE_TURN_MIN, NPC_IDLE_TURN_MAX] = GAME_SETTINGS.npc.idleTurnIntervalRange

type Carryable = Item | Food | Trap

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
      cycleTime: GAME_SETTINGS.cycle.initialCycleTime,
      isMoving: false,
    }
  })

  const distanceBetween = (a: Vector2, b: Vector2): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  const findNearbyCarryable = (
    items: Item[],
    foodList: Food[],
    traps: Trap[],
    position: Vector2,
    radius: number
  ): Carryable | null => {
    const carryables: Carryable[] = [...items, ...foodList, ...traps]
    let nearest: Carryable | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const candidate of carryables) {
      const distance = distanceBetween(candidate.position, position)
      if (distance <= radius && distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    }

    return nearest
  }

  const interactWithCarryable = (state: GameState, carryable: Carryable): GameState => {
    if (state.party.carriedItem) {
      return {
        ...state,
        selectedObject: carryable,
      }
    }

    // Pick up if close enough and inventory is empty
    if (distanceBetween(state.party.position, carryable.position) <= PLAYER_PICKUP_RADIUS) {
      const nextItems = carryable.type === 'item'
        ? state.map.items.filter((existingItem) => existingItem.id !== carryable.id)
        : state.map.items

      const nextFood = carryable.type === 'food'
        ? state.map.food.filter((existingFood) => existingFood.id !== carryable.id)
        : state.map.food

      const nextTraps = carryable.type === 'trap'
        ? state.map.traps.filter((existingTrap) => existingTrap.id !== carryable.id)
        : state.map.traps

      return {
        ...state,
        map: {
          ...state.map,
          items: nextItems,
          food: nextFood,
          traps: nextTraps,
        },
        party: {
          ...state.party,
          carriedItem: carryable,
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
      carryable.position,
      state.map.objects,
      state.map.width,
      state.map.height
    )

    if (itemPath.length === 0) {
      return {
        ...state,
        isMoving: false,
        selectedObject: carryable,
      }
    }

    return {
      ...state,
      party: {
        ...state.party,
        path: itemPath,
        targetPosition: carryable.position,
      },
      isMoving: true,
      selectedObject: carryable,
    }
  }

  const dropCarriedItemAtPosition = (state: GameState, dropPosition: Vector2): GameState => {
    if (!state.party.carriedItem) {
      return state
    }

    if (!isPositionWalkable(dropPosition, state.map.objects)) {
      return state
    }

    if (state.party.carriedItem.type === 'food') {
      const droppedFood: Food = {
        ...state.party.carriedItem,
        type: 'food',
        position: dropPosition,
      }

      return {
        ...state,
        map: {
          ...state.map,
          food: [...state.map.food, droppedFood],
        },
        party: {
          ...state.party,
          carriedItem: null,
        },
        selectedObject: droppedFood,
      }
    }

    if (state.party.carriedItem.type === 'trap') {
      const droppedTrap: Trap = {
        ...state.party.carriedItem,
        type: 'trap',
        position: dropPosition,
      }

      return {
        ...state,
        map: {
          ...state.map,
          traps: [...state.map.traps, droppedTrap],
        },
        party: {
          ...state.party,
          carriedItem: null,
        },
        selectedObject: droppedTrap,
      }
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

        const speed = PLAYER_SPEED_PER_TICK
        let movementOrigin = prev.party.position
        let reachedWaypoint: Vector2 | null = null

        // Consume waypoints already reached before calculating movement direction.
        while (path.length > 0) {
          const nextWaypoint = path[0]
          const distance = distanceBetween(nextWaypoint, movementOrigin)
          if (distance >= speed) {
            break
          }
          reachedWaypoint = nextWaypoint
          movementOrigin = nextWaypoint
          path.shift()
        }

        if (path.length === 0) {
          // Reached target: stop, clear target, and auto-pick nearby item if possible.
          let updatedMap = prev.map
          let carriedItem = prev.party.carriedItem
          const finalPosition = reachedWaypoint ?? movementOrigin

          if (!carriedItem) {
            const targetPosition = prev.party.targetPosition ?? finalPosition
            const nearbyCarryable = findNearbyCarryable(
              prev.map.items,
              prev.map.food,
              prev.map.traps,
              targetPosition,
              PLAYER_PICKUP_RADIUS
            )

            if (nearbyCarryable) {
              updatedMap = {
                ...prev.map,
                items: nearbyCarryable.type === 'item'
                  ? prev.map.items.filter((item) => item.id !== nearbyCarryable.id)
                  : prev.map.items,
                food: nearbyCarryable.type === 'food'
                  ? prev.map.food.filter((food) => food.id !== nearbyCarryable.id)
                  : prev.map.food,
                traps: nearbyCarryable.type === 'trap'
                  ? prev.map.traps.filter((trap) => trap.id !== nearbyCarryable.id)
                  : prev.map.traps,
              }
              carriedItem = nearbyCarryable
            }
          }

          return {
            ...prev,
            map: updatedMap,
            party: {
              ...prev.party,
              position: finalPosition,
              path: [],
              targetPosition: null,
              carriedItem,
            },
            isMoving: false,
            gameTime: prev.gameTime + PLAYER_TIME_STEP,
          }
        }

        const nextPos = path[0]
        const angle = Math.atan2(nextPos.y - movementOrigin.y, nextPos.x - movementOrigin.x)
        const newPos = {
          x: movementOrigin.x + Math.cos(angle) * speed,
          y: movementOrigin.y + Math.sin(angle) * speed,
        }

        return {
          ...prev,
          party: {
            ...prev.party,
            position: newPos,
            path,
            direction: angle,
          },
          gameTime: prev.gameTime + PLAYER_TIME_STEP,
        }
      })
    }, PLAYER_MOVEMENT_TICK_MS)

    return () => clearInterval(interval)
  }, [gameState.isMoving])

  // Creature random movement and state updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const nextGameTime = prev.gameTime + CYCLE_STEP
        const newCycleTime = (prev.cycleTime + CYCLE_STEP) % CYCLE_DURATION_SECONDS

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
            // Idle behavior: rotate every configured interval range.
            if (prev.gameTime >= creature.nextIdleTurnAt) {
              const nextInterval = NPC_IDLE_TURN_MIN + Math.random() * (NPC_IDLE_TURN_MAX - NPC_IDLE_TURN_MIN)
              return {
                ...creature,
                state: 'idle' as const,
                direction: Math.random() * Math.PI * 2,
                idleTurnInterval: nextInterval,
                nextIdleTurnAt: prev.gameTime + nextInterval,
              }
            }

            // Occasionally begin patrol route
            if (Math.random() > NPC_PATROL_START_CHANCE) {
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
          if (distance < creature.speed * NPC_WAYPOINT_REACH_MULTIPLIER) {
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
          newPos.x = Math.max(NPC_BOUNDARY_PADDING, Math.min(prev.map.width - NPC_BOUNDARY_PADDING, newPos.x))
          newPos.y = Math.max(NPC_BOUNDARY_PADDING, Math.min(prev.map.height - NPC_BOUNDARY_PADDING, newPos.y))

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
    }, CREATURE_TICK_MS)

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
          return { ...prev, selectedObject: item }
        }
      }
      for (const food of prev.map.food) {
        if (isPointInRect(clickPos, food)) {
          return { ...prev, selectedObject: food }
        }
      }
      for (const trap of prev.map.traps) {
        if (isPointInRect(clickPos, trap)) {
          return { ...prev, selectedObject: trap }
        }
      }
      if (isPointInRect(clickPos, prev.map.artifact)) {
        return { ...prev, selectedObject: prev.map.artifact }
      }

      // Check if click is on party
      if (
        distanceBetween(clickPos, prev.party.position) < PLAYER_INTERACTION_RADIUS
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
        distanceBetween(clickPos, prev.party.position) <= PLAYER_PICKUP_RADIUS &&
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
      if (
        !prev.selectedObject ||
        (prev.selectedObject.type !== 'item' && prev.selectedObject.type !== 'food' && prev.selectedObject.type !== 'trap')
      ) {
        return prev
      }

      const selectedCarryable = prev.selectedObject.type === 'item'
        ? prev.map.items.find((item) => item.id === prev.selectedObject?.id)
        : prev.selectedObject.type === 'food'
          ? prev.map.food.find((food) => food.id === prev.selectedObject?.id)
          : prev.map.traps.find((trap) => trap.id === prev.selectedObject?.id)

      if (!selectedCarryable) {
        return prev
      }

      return interactWithCarryable(prev, selectedCarryable)
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
          (
            gameState.selectedObject?.type === 'item' ||
            gameState.selectedObject?.type === 'food' ||
            gameState.selectedObject?.type === 'trap'
          ) &&
          !gameState.party.carriedItem
        }
        canDropCarried={Boolean(gameState.party.carriedItem)}
        onPickUpSelected={handlePickUpSelected}
        onDropCarried={handleDropCarried}
      />
    </div>
  )
}
