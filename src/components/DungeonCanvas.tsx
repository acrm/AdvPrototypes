import React, { useRef, useEffect, useState } from 'react'
import { GameState, Vector2 } from '../types/game'

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

    // Draw creatures (triangles for awake, circles for sleeping)
    for (const creature of gameState.map.creatures) {
      if (creature.state === 'sleeping') {
        // Draw sleeping creature as a circle with "Zzz"
        ctx.fillStyle = creature.color
        ctx.globalAlpha = 0.6 // Semi-transparent
        ctx.beginPath()
        ctx.arc(creature.position.x, creature.position.y, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1.0
        
        // Add "Z" symbol
        ctx.fillStyle = '#fff'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Z', creature.position.x, creature.position.y - 18)
      } else {
        // Draw awake creature as triangle
        drawTriangle(ctx, creature.position, creature.color, 15, creature.direction)
      }
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
  }, [gameState])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

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
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsHoveringObject(checkIfHoveringObject(x, y))
  }

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      className={`dungeon-canvas ${isHoveringObject ? 'hovering-object' : ''}`}
    />
  )
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
