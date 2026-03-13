import React, { useRef, useEffect, useState } from 'react'
import { GameState, Vector2 } from '../types/game'

const VIEWPORT_WIDTH = 1200
const VIEWPORT_HEIGHT = 800

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

      ctx.fillStyle = gameState.party.carriedItem.color
      ctx.beginPath()
      ctx.arc(carryPosition.x, carryPosition.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
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
