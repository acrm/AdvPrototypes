import React, { useRef, useEffect } from 'react'
import { GameState, Vector2 } from '../types/game'

interface DungeonCanvasProps {
  gameState: GameState
  onCanvasClick: (pos: Vector2) => void
}

export const DungeonCanvas: React.FC<DungeonCanvasProps> = ({ gameState, onCanvasClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

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

    // Draw creatures (triangles - pointed rectangles)
    for (const creature of gameState.map.creatures) {
      drawTriangle(ctx, creature.position, creature.color, 15)
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
    drawTriangle(ctx, gameState.party.position, '#fff', 20)
  }, [gameState])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onCanvasClick({ x, y })
  }

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      onClick={handleCanvasClick}
      className="dungeon-canvas"
    />
  )
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  color: string,
  size: number
) {
  ctx.fillStyle = color
  ctx.beginPath()
  // Point upward
  ctx.moveTo(position.x, position.y - size / 1.5)
  ctx.lineTo(position.x + size / 2, position.y + size / 2)
  ctx.lineTo(position.x - size / 2, position.y + size / 2)
  ctx.closePath()
  ctx.fill()
}
