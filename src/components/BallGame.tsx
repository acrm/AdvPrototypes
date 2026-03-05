import React, { useState, useRef, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface Velocity {
  x: number
  y: number
}

const BALL_RADIUS = 20
const FRICTION = 0.98
const ACCELERATION = 0.5
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export const BallGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballPosRef = useRef<Position>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  const ballVelRef = useRef<Velocity>({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const [displayPos, setDisplayPos] = useState<Position>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const dx = clickX - ballPosRef.current.x
    const dy = clickY - ballPosRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      ballVelRef.current = {
        x: ballVelRef.current.x + (dx / distance) * ACCELERATION,
        y: ballVelRef.current.y + (dy / distance) * ACCELERATION,
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const pos = ballPosRef.current
      const vel = ballVelRef.current

      let newX = pos.x + vel.x
      let newY = pos.y + vel.y
      let newVx = vel.x
      let newVy = vel.y

      if (newX - BALL_RADIUS < 0) {
        newX = BALL_RADIUS
        newVx = Math.abs(newVx) * 0.9
      }
      if (newX + BALL_RADIUS > CANVAS_WIDTH) {
        newX = CANVAS_WIDTH - BALL_RADIUS
        newVx = -Math.abs(newVx) * 0.9
      }
      if (newY - BALL_RADIUS < 0) {
        newY = BALL_RADIUS
        newVy = Math.abs(newVy) * 0.9
      }
      if (newY + BALL_RADIUS > CANVAS_HEIGHT) {
        newY = CANVAS_HEIGHT - BALL_RADIUS
        newVy = -Math.abs(newVy) * 0.9
      }

      newVx *= FRICTION
      newVy *= FRICTION

      ballPosRef.current = { x: newX, y: newY }
      ballVelRef.current = { x: newVx, y: newVy }

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(newX, newY, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      setDisplayPos({ x: Math.round(newX), y: Math.round(newY) })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Interactive Ball Game</h1>
      <p>Click anywhere on the white canvas to make the ball move!</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        style={{
          border: '1px solid #cccccc',
          cursor: 'pointer',
          display: 'block',
          margin: '20px auto',
          backgroundColor: '#ffffff',
        }}
      />
      <p>Ball position: ({displayPos.x}, {displayPos.y})</p>
    </div>
  )
}
