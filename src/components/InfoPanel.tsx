import React from 'react'
import { GameObject, Party, Creature } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import './InfoPanel.css'

const CYCLE_DURATION_SECONDS = GAME_SETTINGS.cycle.durationSeconds

interface InfoPanelProps {
  selectedObject: GameObject | null
  party: Party
  cycleTime: number
  canPickUpSelected: boolean
  canDropCarried: boolean
  onPickUpSelected: () => void
  onDropCarried: () => void
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedObject,
  party,
  cycleTime,
  canPickUpSelected,
  canDropCarried,
  onPickUpSelected,
  onDropCarried,
}) => {
  const getTimeOfDay = (cycle: number): string => {
    const phaseDuration = CYCLE_DURATION_SECONDS / 4
    if (cycle < phaseDuration) return '🌙 Night'
    if (cycle < phaseDuration * 2) return '🌅 Morning'
    if (cycle < phaseDuration * 3) return '☀️ Day'
    return '🌆 Evening'
  }

  const displayPartyInfo = (): string => {
    let info = `= PARTY STATUS =\n\n`
    info += `[TIME] ${getTimeOfDay(cycleTime)} (${Math.floor(cycleTime)}s)\n\n`
    info += `[MEMBERS] ${party.members.join(', ')}\n\n`
    info += `[POSITION] (${Math.round(party.position.x)}, ${Math.round(party.position.y)})\n\n`
    info += `[CARRYING] ${party.carriedItem ? party.carriedItem.name : 'Nothing'}\n\n`
    info += `[OBSERVED] ${party.observedCreatures.size} creatures\n\n`
    info += `[CONTROLS] Use [PICK UP] and [DROP] buttons below\n\n`
    info += `[PROGRESS] Searching for artifact...`
    return info
  }

  const getCreatureDescription = (creature: Creature): string => {
    let desc = `= ${creature.name.toUpperCase()} =\n\n`
    desc += `${creature.description}\n\n`
    
    // Show current state
    const stateEmoji = creature.state === 'sleeping' ? '💤' : creature.state === 'patrol' ? '🚶' : '⏸️'
    desc += `[STATE] ${stateEmoji} ${creature.state.charAt(0).toUpperCase() + creature.state.slice(1)}\n\n`
    
    // Show sleep schedule
    const sleepStart = Math.floor(creature.sleepSchedule.sleepStart)
    const sleepEnd = Math.floor(creature.sleepSchedule.sleepEnd)
    desc += `[SLEEP] ${sleepStart}-${sleepEnd}s ${sleepEnd < sleepStart ? '(wraps)' : ''}\n\n`
    
    if (creature.behavior) desc += `[BEHAVIOR] ${creature.behavior}\n`
    if (creature.diet) desc += `[DIET] ${creature.diet}\n`
    if (creature.threat) desc += `[THREAT] ${creature.threat}\n`
    
    if (creature.preferredFoodTypes && creature.preferredFoodTypes.length > 0) {
      desc += `[FOOD PREFERENCES] ${creature.preferredFoodTypes.join(', ')}\n`
    }
    
    desc += `\n[TIMES OBSERVED] ${party.observedCreatures.get(creature.id) || 0}`
    return desc
  }

  let content: string = ''

  if (selectedObject) {
    if (selectedObject.type === 'creature') {
      content = getCreatureDescription(selectedObject as Creature)
    } else {
      content = `= ${selectedObject.name.toUpperCase()} =\n\n${selectedObject.description}\n\n[TYPE] ${selectedObject.type}`
    }
  } else {
    content = displayPartyInfo()
  }

  return (
    <div className="info-panel">
      <div className="panel-header">
        <h2>INFO</h2>
      </div>
      <div className="panel-content">
        <InfoContent text={content} />
        <div className="panel-actions">
          <button
            type="button"
            className="action-button"
            disabled={!canPickUpSelected}
            onClick={onPickUpSelected}
          >
            [PICK UP]
          </button>
          <button
            type="button"
            className="action-button"
            disabled={!canDropCarried}
            onClick={onDropCarried}
          >
            [DROP]
          </button>
        </div>
      </div>
    </div>
  )
}

interface InfoContentProps {
  text: string
}

const InfoContent: React.FC<InfoContentProps> = ({ text }) => {
  const lines = text.split('\n')

  return (
    <div className="info-content">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (trimmed.startsWith('=') && trimmed.endsWith('=')) {
          return <h3 key={idx}>{trimmed}</h3>
        } else if (trimmed.startsWith('[')) {
          const closingBracketIndex = trimmed.indexOf(']')
          if (closingBracketIndex > 0) {
            const tag = trimmed.substring(0, closingBracketIndex + 1)
            const rest = trimmed.substring(closingBracketIndex + 1).trim()
            if (rest.length > 0) {
              return (
                <p key={idx} className="tag-line">
                  <span className="tag">{tag}</span> {rest}
                </p>
              )
            }
            return (
              <p key={idx} className="tag-line">
                <span className="tag">{tag}</span>
              </p>
            )
          }
          return (
            <p key={idx} className="tag-line">
              {trimmed}
            </p>
          )
        } else if (trimmed === '') {
          return <div key={idx} style={{ height: '0.5rem' }} />
        } else if (trimmed.startsWith('-')) {
          return (
            <p key={idx} className="bold">
              {trimmed}
            </p>
          )
        } else {
          return <p key={idx}>{trimmed}</p>
        }
      })}
    </div>
  )
}
