import { useState, useCallback } from 'react'
import { DungeonGame } from './components/DungeonGame'
import { DifficultyMenu } from './components/DifficultyMenu'
import { GameOverScreen } from './components/GameOverScreen'
import { Difficulty, InGameClock } from './types/game'
import { makeInitialClock } from './game/TimeSystem'
import './App.css'

function App() {
  const [sessionStatus, setSessionStatus] = useState<'menu' | 'running' | 'gameover'>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [endClock, setEndClock] = useState<InGameClock>(makeInitialClock)
  const [isVictory, setIsVictory] = useState(false)

  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d)
    setSessionStatus('running')
  }, [])

  const handleGameEnd = useCallback((victory: boolean, clock: InGameClock) => {
    setIsVictory(victory)
    setEndClock(clock)
    setSessionStatus('gameover')
  }, [])

  const handleRetry = useCallback(() => {
    setSessionStatus('menu')
  }, [])

  if (sessionStatus === 'menu') {
    return <DifficultyMenu onSelectDifficulty={handleSelectDifficulty} />
  }

  if (sessionStatus === 'gameover') {
    return (
      <GameOverScreen
        difficulty={difficulty}
        clock={endClock}
        isVictory={isVictory}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <div className="app">
      <DungeonGame difficulty={difficulty} onGameEnd={handleGameEnd} />
    </div>
  )
}

export default App
