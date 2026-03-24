import React from 'react'
import { Difficulty } from '../types/game'
import './DifficultyMenu.css'

interface DifficultyMenuProps {
  onSelectDifficulty: (difficulty: Difficulty) => void
}

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'easy', label: 'EASY', desc: 'Creatures move slower and have reduced vision. Recommended for first exploration.' },
  { key: 'normal', label: 'NORMAL', desc: 'Standard creature behaviour. The dungeon is as designed.' },
  { key: 'hard', label: 'HARD', desc: 'Creatures are faster and more alert. Only for experienced delvers.' },
]

export const DifficultyMenu: React.FC<DifficultyMenuProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="difficulty-menu">
      <div className="difficulty-menu__title">DUNGEON PROTOTYPE</div>
      <div className="difficulty-menu__subtitle">Select Difficulty</div>
      <div className="difficulty-menu__options">
        {DIFFICULTY_OPTIONS.map(({ key, label, desc }) => (
          <button
            key={key}
            type="button"
            className="difficulty-menu__option"
            onClick={() => onSelectDifficulty(key)}
          >
            <span className="difficulty-menu__option-label">[{label}]</span>
            <span className="difficulty-menu__option-desc">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
