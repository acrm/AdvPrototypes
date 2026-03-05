import React, { useState, useCallback, useEffect } from 'react'
import { GameState, Vector2, GameObject } from '../types/game'
import { initializeMap } from '../systems/MapGenerator'
import { findPathWithObstacles } from '../systems/Pathfinding'
import { DungeonCanvas } from './DungeonCanvas'
import { InfoPanel } from './InfoPanel'
import './DungeonGame.css'

export const DungeonGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    map: initializeMap(),
    party: {
      position: { x: 100, y: 100 },
      members: ['Warrior', 'Rogue', 'Cleric'],
      path: [],
      targetPosition: null,
      observedCreatures: new Map(),
      direction: -Math.PI / 2, // pointing up initially
    },
    selectedObject: null,
    gameTime: 0,
    isMoving: false,
  }))

  // Update party position along path
  useEffect(() => {
    if (!gameState.isMoving || gameState.party.path.length === 0) return

    const interval = setInterval(() => {
      setGameState((prev) => {
        const path = [...prev.party.path]
        if (path.length === 0) {
          return { ...prev, isMoving: false }
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
            // Reached target
            return {
              ...prev,
              party: { ...prev.party, path: [] },
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
          party: { ...prev.party, position: newPos, path, direction: angle },
          gameTime: prev.gameTime + 0.001,
        }
      })
    }, 30)

    return () => clearInterval(interval)
  }, [gameState.isMoving])

  // Creature random movement
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const updatedCreatures = prev.map.creatures.map((creature) => {
          // If no waypoints, generate new ones
          if (creature.waypoints.length === 0) {
            return {
              ...creature,
              waypoints: [
                {
                  x: Math.random() * (prev.map.width - 200) + 100,
                  y: Math.random() * (prev.map.height - 200) + 100,
                },
              ],
            }
          }

          const target = creature.waypoints[0]
          const distance = Math.sqrt(
            Math.pow(target.x - creature.position.x, 2) +
            Math.pow(target.y - creature.position.y, 2)
          )

          // Reached waypoint, remove it and add a new one
          if (distance < creature.speed * 2) {
            const newWaypoints = [...creature.waypoints]
            newWaypoints.shift()
            // Add new random waypoint
            newWaypoints.push({
              x: Math.random() * (prev.map.width - 200) + 100,
              y: Math.random() * (prev.map.height - 200) + 100,
            })
            return { ...creature, waypoints: newWaypoints }
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

          return {
            ...creature,
            position: newPos,
            direction: angle,
          }
        })

        return {
          ...prev,
          map: { ...prev.map, creatures: updatedCreatures },
          gameTime: prev.gameTime + 0.0005,
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
          return { ...prev, selectedObject: item }
        }
      }
      if (isPointInRect(clickPos, prev.map.artifact)) {
        return { ...prev, selectedObject: prev.map.artifact }
      }

      // Check if click is on party
      if (
        Math.sqrt(
          Math.pow(clickPos.x - prev.party.position.x, 2) +
          Math.pow(clickPos.y - prev.party.position.y, 2)
        ) < 30
      ) {
        // Show party info (selectedObject = "party" as a special marker)
        return { ...prev, selectedObject: null }
      }

      // Otherwise, move party to clicked position
      const path = findPathWithObstacles(
        prev.party.position,
        clickPos,
        prev.map.objects,
        prev.map.width,
        prev.map.height
      )
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
      />
    </div>
  )
}
