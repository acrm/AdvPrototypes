import React, { useRef, useEffect, useState } from 'react'
import { Creature, GameState, Vector2 } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'

const VIEWPORT_WIDTH = GAME_SETTINGS.world.viewportWidth
const VIEWPORT_HEIGHT = GAME_SETTINGS.world.viewportHeight

interface DungeonCanvasProps {
  gameState: GameState
  onCanvasClick: (pos: Vector2) => void
}

export const DungeonCanvas: React.FC<DungeonCanvasProps> = ({ gameState, onCanvasClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHoveringObject, setIsHoveringObject] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const camera = getCameraOffset(gameState, canvas.width, canvas.height)

    // Clear canvas
    ctx.fillStyle = '#0d100d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw large dungeon regions in screen space so the viewport stays fixed
    const tileSize = gameState.map.layoutCellSize
    const startCol = Math.max(0, Math.floor(camera.x / tileSize))
    const endCol = Math.min(Math.ceil((camera.x + canvas.width) / tileSize), Math.ceil(gameState.map.width / tileSize))
    const startRow = Math.max(0, Math.floor(camera.y / tileSize))
    const endRow = Math.min(Math.ceil((camera.y + canvas.height) / tileSize), Math.ceil(gameState.map.height / tileSize))

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const screenX = col * tileSize - camera.x
        const screenY = row * tileSize - camera.y
        ctx.fillStyle = (row + col) % 2 === 0 ? '#141914' : '#101510'
        ctx.fillRect(screenX, screenY, tileSize, tileSize)
        ctx.strokeStyle = '#1f291f'
        ctx.lineWidth = 1
        ctx.strokeRect(screenX, screenY, tileSize, tileSize)
      }
    }

    ctx.save()
    ctx.translate(-camera.x, -camera.y)

    drawExtractionZone(ctx, gameState)

    // Draw static objects (rectangles)
    for (const obj of gameState.map.objects) {
      ctx.fillStyle = obj.color
      ctx.fillRect(
        obj.position.x - obj.width / 2,
        obj.position.y - obj.height / 2,
        obj.width,
        obj.height
      )
    }

    // Draw items (circles)
    for (const item of gameState.map.items) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(item.position.x, item.position.y, item.width / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw food (small circles with outline)
    for (const food of gameState.map.food) {
      const radius = food.width / 2
      ctx.fillStyle = food.color
      ctx.beginPath()
      ctx.arc(food.position.x, food.position.y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw traps as diamonds.
    for (const trap of gameState.map.traps) {
      if (!isTrapVisible(trap)) {
        continue
      }

      drawTrap(ctx, trap)
    }

    // Draw artifact (highlight circle)
    const artifact = gameState.map.artifact
    ctx.fillStyle = artifact.color
    ctx.beginPath()
    ctx.arc(artifact.position.x, artifact.position.y, artifact.width / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw creatures (triangles)
    for (const creature of gameState.map.creatures) {
      // All creatures drawn as triangles (sleeping just don't rotate/move)
      drawTriangle(ctx, creature.position, creature.color, 15, creature.direction)
      drawCreatureConditionOverlay(ctx, creature)
      drawCreatureCarriedFood(ctx, creature)

      // Draw ALERT state visual (red aura)
      if (creature.alertUntil !== null && gameState.gameTime < creature.alertUntil) {
        ctx.strokeStyle = `rgba(255, 100, 100, ${Math.sin(gameState.gameTime * 6) * 0.3 + 0.5})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(creature.position.x, creature.position.y, 22, 0, Math.PI * 2)
        ctx.stroke()

        // Draw exclamation mark above ALERT creature
        ctx.save()
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = 'rgb(255, 100, 100)'
        ctx.textAlign = 'center'
        ctx.fillText('!', creature.position.x, creature.position.y - 25)
        ctx.restore()
      }

      if (gameState.selectedObject?.type === 'creature' && gameState.selectedObject.id === creature.id) {
        ctx.strokeStyle = '#f8f0c0'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(creature.position.x, creature.position.y, 18, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const selectedCreature = getSelectedCreature(gameState)
    if (selectedCreature) {
      drawSelectedCreatureRadii(ctx, selectedCreature)
      drawSelectedCreaturePath(ctx, selectedCreature, gameState)
    }

    // Draw party path (dashed line)
    if (gameState.party.path.length > 0) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(gameState.party.position.x, gameState.party.position.y)
      for (const waypoint of gameState.party.path) {
        ctx.lineTo(waypoint.x, waypoint.y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw target marker (crosshair)
    if (gameState.party.targetPosition) {
      const target = gameState.party.targetPosition
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      // Vertical line
      ctx.beginPath()
      ctx.moveTo(target.x, target.y - 15)
      ctx.lineTo(target.x, target.y + 15)
      ctx.stroke()
      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(target.x - 15, target.y)
      ctx.lineTo(target.x + 15, target.y)
      ctx.stroke()
    }

    // Draw party (white triangle)
    drawTriangle(ctx, gameState.party.position, '#fff', 20, gameState.party.direction)

    // Draw carried item near party direction
    if (gameState.party.carriedItem) {
      const carryDistance = 16
      const carryPosition = {
        x: gameState.party.position.x + Math.cos(gameState.party.direction) * carryDistance,
        y: gameState.party.position.y + Math.sin(gameState.party.direction) * carryDistance,
      }

      if (gameState.party.carriedItem.type === 'trap') {
        drawDiamond(ctx, carryPosition, gameState.party.carriedItem.color, 6)
      } else {
        ctx.fillStyle = gameState.party.carriedItem.color
        ctx.beginPath()
        ctx.arc(carryPosition.x, carryPosition.y, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw floating damage number
    if (gameState.party.lastDamageTaken > 0 && gameState.party.damageFlashUntil !== null && gameState.gameTime < gameState.party.damageFlashUntil) {
      const damageNumberProgress =
        1 - (gameState.party.damageFlashUntil - gameState.gameTime) / 0.4
      const yOffset = damageNumberProgress * 40 // float upward
      const opacity = Math.max(0, 1 - damageNumberProgress)

      ctx.save()
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = `rgba(255, 100, 100, ${opacity})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('-' + gameState.party.lastDamageTaken, gameState.party.position.x, gameState.party.position.y - 30 - yOffset)
      ctx.restore()
    }

    ctx.restore()

    // Draw damage flash in screen-space so it always covers the full viewport
    if (gameState.party.damageFlashUntil !== null && gameState.gameTime < gameState.party.damageFlashUntil) {
      const flashProgress =
        (gameState.party.damageFlashUntil - gameState.gameTime) / 0.4
      const intensity = Math.min(1, flashProgress * 2) // peak at start, fade quickly
      ctx.fillStyle = `rgba(255, 100, 100, ${intensity * 0.6})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [gameState])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const camera = getCameraOffset(gameState, canvas.width, canvas.height)
    const x = (e.clientX - rect.left) * scaleX + camera.x
    const y = (e.clientY - rect.top) * scaleY + camera.y

    onCanvasClick({ x, y })
  }

  const checkIfHoveringObject = (x: number, y: number): boolean => {
    // Check items (circles)
    for (const item of gameState.map.items) {
      const dx = x - item.position.x
      const dy = y - item.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= item.width / 2) return true
    }

    // Check food (circles)
    for (const food of gameState.map.food) {
      const dx = x - food.position.x
      const dy = y - food.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= food.width / 2) return true
    }

    // Check traps (diamond approximated with circle)
    for (const trap of gameState.map.traps) {
      if (!isTrapVisible(trap)) {
        continue
      }

      const dx = x - trap.position.x
      const dy = y - trap.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= trap.width / 2) return true
    }

    // Check artifact (circle)
    const artifact = gameState.map.artifact
    const dx = x - artifact.position.x
    const dy = y - artifact.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= artifact.width / 2) return true

    // Check creatures (triangles - approximate with circle)
    for (const creature of gameState.map.creatures) {
      const dx = x - creature.position.x
      const dy = y - creature.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= 15) return true
    }

    return false
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const camera = getCameraOffset(gameState, canvas.width, canvas.height)
    const x = (e.clientX - rect.left) * scaleX + camera.x
    const y = (e.clientY - rect.top) * scaleY + camera.y

    setIsHoveringObject(checkIfHoveringObject(x, y))
  }

  return (
    <canvas
      ref={canvasRef}
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      className={`dungeon-canvas ${isHoveringObject ? 'hovering-object' : ''}`}
    />
  )
}

function getSelectedCreature(gameState: GameState): Creature | null {
  if (!gameState.selectedObject || gameState.selectedObject.type !== 'creature') {
    return null
  }

  return gameState.map.creatures.find((creature) => creature.id === gameState.selectedObject?.id) || null
}

function drawSelectedCreaturePath(ctx: CanvasRenderingContext2D, creature: Creature, gameState: GameState) {
  if (creature.waypoints.length === 0) return

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 220, 80, 0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(creature.position.x, creature.position.y)
  for (const wp of creature.waypoints) {
    ctx.lineTo(wp.x, wp.y)
  }
  ctx.stroke()

  // Draw a small target dot at the final waypoint.
  const last = creature.waypoints[creature.waypoints.length - 1]
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255, 220, 80, 0.85)'
  ctx.beginPath()
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
  ctx.fill()

  // Draw a small marker on the actual aggression target if it's a creature.
  if (creature.aggressionTargetType === 'creature' && creature.aggressionTargetId !== null) {
    const target = gameState.map.creatures.find((c) => c.id === creature.aggressionTargetId)
    if (target) {
      ctx.strokeStyle = 'rgba(255, 160, 60, 0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(target.position.x, target.position.y, 20, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (creature.aggressionTargetType === 'player') {
    ctx.strokeStyle = 'rgba(255, 160, 60, 0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(gameState.party.position.x, gameState.party.position.y, 24, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawSelectedCreatureRadii(ctx: CanvasRenderingContext2D, creature: Creature) {
  ctx.save()

  // Far behavior radius: 1.5 x chunk size.
  ctx.fillStyle = 'rgba(255, 200, 120, 0.08)'
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.4)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(creature.position.x, creature.position.y, creature.farBehaviorRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Near reaction radius: 0.5 x chunk size.
  ctx.fillStyle = 'rgba(255, 120, 120, 0.1)'
  ctx.strokeStyle = 'rgba(255, 160, 160, 0.65)'
  ctx.lineWidth = 1.75
  ctx.beginPath()
  ctx.arc(creature.position.x, creature.position.y, creature.alertRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  color: string,
  radius: number
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(position.x, position.y - radius)
  ctx.lineTo(position.x + radius, position.y)
  ctx.lineTo(position.x, position.y + radius)
  ctx.lineTo(position.x - radius, position.y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawTrap(ctx: CanvasRenderingContext2D, trap: GameState['map']['traps'][number]) {
  const radius = trap.width / 2

  if (trap.state === 'portable') {
    drawDiamond(ctx, trap.position, trap.color, radius)
    return
  }

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(trap.position.x, trap.position.y - radius)
  ctx.lineTo(trap.position.x + radius, trap.position.y)
  ctx.lineTo(trap.position.x, trap.position.y + radius)
  ctx.lineTo(trap.position.x - radius, trap.position.y)
  ctx.closePath()

  if (trap.state === 'arming') {
    ctx.strokeStyle = 'rgba(255, 235, 140, 0.9)'
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 2
  } else {
    ctx.strokeStyle = 'rgba(255, 248, 220, 0.95)'
    ctx.lineWidth = 2.5
  }

  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawExtractionZone(ctx: CanvasRenderingContext2D, gameState: GameState) {
  const zone = gameState.map.extractionZone
  const left = zone.position.x - zone.width / 2
  const top = zone.position.y - zone.height / 2

  ctx.save()
  ctx.fillStyle = 'rgba(80, 180, 255, 0.06)'
  ctx.fillRect(left, top, zone.width, zone.height)

  ctx.strokeStyle = 'rgba(120, 210, 255, 0.65)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 6])
  ctx.strokeRect(left + 2, top + 2, zone.width - 4, zone.height - 4)
  ctx.setLineDash([])

  ctx.fillStyle = 'rgba(180, 230, 255, 0.95)'
  ctx.font = 'bold 24px "IBM Plex Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('*', zone.position.x, zone.position.y)
  ctx.restore()
}

function isTrapVisible(trap: GameState['map']['traps'][number]): boolean {
  return trap.state === 'portable' || trap.state === 'arming' || trap.state === 'armed'
}

function drawCreatureConditionOverlay(ctx: CanvasRenderingContext2D, creature: Creature) {
  if (creature.condition === 'trapped') {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 214, 102, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(creature.position.x, creature.position.y, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(creature.position.x - 10, creature.position.y - 10)
    ctx.lineTo(creature.position.x + 10, creature.position.y + 10)
    ctx.moveTo(creature.position.x + 10, creature.position.y - 10)
    ctx.lineTo(creature.position.x - 10, creature.position.y + 10)
    ctx.stroke()
    ctx.restore()
    return
  }

  if (creature.condition === 'enraged') {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 92, 92, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(creature.position.x, creature.position.y, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    return
  }

  if (creature.isFriendly) {
    ctx.save()
    ctx.strokeStyle = 'rgba(120, 230, 170, 0.95)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(creature.position.x, creature.position.y, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
}

function drawCreatureCarriedFood(ctx: CanvasRenderingContext2D, creature: Creature) {
  if (!creature.carriedFood) {
    return
  }

  const offset = 11
  const foodPosition = {
    x: creature.position.x + Math.cos(creature.direction) * offset,
    y: creature.position.y + Math.sin(creature.direction) * offset,
  }

  ctx.save()
  ctx.fillStyle = creature.carriedFood.color
  ctx.beginPath()
  ctx.arc(foodPosition.x, foodPosition.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function getCameraOffset(gameState: GameState, viewportWidth: number, viewportHeight: number): Vector2 {
  const maxX = Math.max(0, gameState.map.width - viewportWidth)
  const maxY = Math.max(0, gameState.map.height - viewportHeight)

  return {
    x: Math.max(0, Math.min(gameState.party.position.x - viewportWidth / 2, maxX)),
    y: Math.max(0, Math.min(gameState.party.position.y - viewportHeight / 2, maxY)),
  }
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  color: string,
  size: number,
  direction: number = -Math.PI / 2 // default pointing up
) {
  ctx.save()
  ctx.translate(position.x, position.y)
  ctx.rotate(direction)
  
  ctx.fillStyle = color
  ctx.beginPath()
  // Elongated triangle pointing right (will be rotated)
  ctx.moveTo(size * 0.8, 0) // tip
  ctx.lineTo(-size * 0.5, size * 0.4) // bottom left
  ctx.lineTo(-size * 0.5, -size * 0.4) // top left
  ctx.closePath()
  ctx.fill()
  
  ctx.restore()
}
