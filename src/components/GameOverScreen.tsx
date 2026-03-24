import React from 'react'
import { Difficulty, InGameClock } from '../types/game'
import { formatClock } from '../game/TimeSystem'
import './GameOverScreen.css'

interface GameOverScreenProps {
  difficulty: Difficulty
  clock: InGameClock
  isVictory: boolean
  onRetry: () => void
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ difficulty, clock, isVictory, onRetry }) => {
  return (
    <div className="game-over-screen">
      <div className={`game-over-screen__outcome ${isVictory ? 'game-over-screen__outcome--victory' : 'game-over-screen__outcome--defeat'}`}>
        {isVictory ? 'MISSION COMPLETE' : 'PARTY DEFEATED'}
      </div>
      <div className="game-over-screen__stats">
        <div className="game-over-screen__stat">
          <span className="game-over-screen__stat-label">[DIFFICULTY]</span>
          <span className="game-over-screen__stat-value">{DIFFICULTY_LABEL[difficulty]}</span>
        </div>
        <div className="game-over-screen__stat">
          <span className="game-over-screen__stat-label">[TIME ELAPSED]</span>
          <span className="game-over-screen__stat-value">{formatClock(clock)}</span>
        </div>
      </div>
      <button
        type="button"
        className="game-over-screen__retry"
        onClick={onRetry}
      >
        [RETRY]
      </button>
    </div>
  )
}
