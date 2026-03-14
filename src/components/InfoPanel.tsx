import React from 'react'
import { Creature, DietTarget, Food, GameObject, Party, Trap } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import './InfoPanel.css'

const CYCLE_DURATION_SECONDS = GAME_SETTINGS.cycle.durationSeconds
const FRIENDLY_FEEDINGS_REQUIRED = GAME_SETTINGS.food.feedingsToBecomeFriendly

interface InfoPanelProps {
  selectedObject: GameObject | null
  party: Party
  cycleTime: number
  gameTime: number
  isVictory: boolean
  canPickUpSelected: boolean
  canSetTrapSelected: boolean
  canDropCarried: boolean
  onPickUpSelected: () => void
  onSetTrapSelected: () => void
  onDropCarried: () => void
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedObject,
  party,
  cycleTime,
  gameTime,
  isVictory,
  canPickUpSelected,
  canSetTrapSelected,
  canDropCarried,
  onPickUpSelected,
  onSetTrapSelected,
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
    info += `[CONTROLS] Use [PICK UP], [SET TRAP], and [DROP] actions below\n\n`
    if (isVictory) {
      info += `[PROGRESS] Artifact extracted. Mission complete.`
      return info
    }

    if (party.carriedItem?.type === 'artifact') {
      info += `[PROGRESS] Artifact secured. Reach extraction marker (*)`
      return info
    }

    info += `[PROGRESS] Searching for artifact chamber (A)...`
    return info
  }

  const getCreatureDescription = (creature: Creature): string => {
    let desc = `= ${creature.name.toUpperCase()} =\n\n`
    desc += `${creature.description}\n\n`
    
    // Show current state
    const stateEmoji = creature.state === 'sleeping' ? '💤' : creature.state === 'patrol' ? '🚶' : '⏸️'
    desc += `[STATE] ${stateEmoji} ${creature.state.charAt(0).toUpperCase() + creature.state.slice(1)}\n\n`
    desc += `[CONDITION] ${getCreatureConditionLabel(creature, gameTime)}\n\n`
    desc += `[TAMING] ${creature.isFriendly ? 'Friendly' : `${creature.primingFeedings}/${FRIENDLY_FEEDINGS_REQUIRED} feedings`}\n\n`

    if (creature.condition === 'trapped' && creature.trappedUntil !== null) {
      desc += `[RELEASE IN] ${Math.max(0, creature.trappedUntil - gameTime).toFixed(1)}s\n\n`
    }

    if (creature.condition === 'enraged') {
      desc += `[HOSTILITY] Locked on player pursuit\n\n`
    } else if (creature.isFriendly) {
      desc += `[HOSTILITY] Non-hostile to player\n\n`
    }

    if (creature.eatingUntil !== null) {
      desc += `[EATING] ${Math.max(0, creature.eatingUntil - gameTime).toFixed(1)}s remaining\n\n`
    } else if (creature.targetFoodId) {
      desc += `[FOOD TARGET] Tracking visible food\n\n`
    }
    
    // Show sleep schedule
    const sleepStart = Math.floor(creature.sleepSchedule.sleepStart)
    const sleepEnd = Math.floor(creature.sleepSchedule.sleepEnd)
    desc += `[SLEEP] ${sleepStart}-${sleepEnd}s ${sleepEnd < sleepStart ? '(wraps)' : ''}\n\n`
    desc += `[DETECTION] ${getDetectionModeLabel(creature)} (${Math.floor(creature.detectionRadius)}px)\n\n`
    
    if (creature.behavior) desc += `[BEHAVIOR] ${creature.behavior}\n`
    if (creature.diet) desc += `[DIET] ${creature.diet}\n`
    if (creature.threat) desc += `[THREAT] ${creature.threat}\n`
    
    if (creature.dietPriorities.length > 0) {
      desc += `[DIET PRIORITY] ${creature.dietPriorities.map(formatDietTarget).join(' > ')}\n`

      const predatorTargets = creature.dietPriorities
        .filter((target) => target.startsWith('creature:') || target === 'player')
        .map(formatDietTarget)

      if (predatorTargets.length > 0) {
        desc += `[PREDATOR TARGETS] ${predatorTargets.join(', ')}\n`
      }
    }
    
    desc += `\n[TIMES OBSERVED] ${party.observedCreatures.get(creature.id) || 0}`
    return desc
  }

  const getFoodDescription = (food: Food): string => {
    return [
      `= ${food.name.toUpperCase()} =`,
      '',
      food.description,
      '',
      `[TYPE] ${food.type}`,
      `[FOOD TYPE] ${food.foodType}`,
      `[NUTRITION] ${food.nutritionValue}`,
      `[PRIMED] ${food.primedForCreatureId ? `Yes (${food.primedForCreatureId})` : 'No'}`,
    ].join('\n')
  }

  const getTrapDescription = (trap: Trap): string => {
    const armingRemaining = trap.state === 'arming' && trap.armingStartedAt !== null
      ? Math.max(0, GAME_SETTINGS.trap.armDelaySeconds - (gameTime - trap.armingStartedAt))
      : 0

    return [
      `= ${trap.name.toUpperCase()} =`,
      '',
      trap.description,
      '',
      `[TYPE] ${trap.type}`,
      `[STATUS] ${formatTrapStateLabel(trap)}`,
      `[VISIBILITY] ${trap.state === 'portable' ? 'Visible and portable' : 'Hidden after placement'}`,
      `[TARGET SPECIES] ${trap.targetSpecies}`,
      `[TRIGGER RADIUS] ${Math.floor(trap.triggerRadius)}px`,
      ...(trap.state === 'arming' ? [`[ARMED IN] ${armingRemaining.toFixed(1)}s`] : []),
    ].join('\n')
  }

  let content: string = ''

  if (selectedObject) {
    if (selectedObject.type === 'creature') {
      content = getCreatureDescription(selectedObject as Creature)
    } else if (selectedObject.type === 'food') {
      content = getFoodDescription(selectedObject as Food)
    } else if (selectedObject.type === 'trap') {
      content = getTrapDescription(selectedObject as Trap)
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
            disabled={!canSetTrapSelected}
            onClick={onSetTrapSelected}
          >
            [SET TRAP]
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

function getDetectionModeLabel(creature: Creature): string {
  if (creature.condition === 'trapped') {
    return 'Immobilized (trap)'
  }

  if (creature.condition === 'enraged') {
    return 'Pursuit (enraged)'
  }

  if (creature.state === 'sleeping') {
    return 'Inactive (sleeping)'
  }

  if (creature.state === 'idle') {
    return 'Periodic checks (idle)'
  }

  return 'Full awareness (patrol)'
}

function formatDietTarget(target: DietTarget): string {
  if (target === 'player') {
    return 'player'
  }

  const [prefix, value] = target.split(':')
  if (prefix === 'food') {
    return value.replace('_', ' ')
  }

  if (prefix === 'creature') {
    return value
  }

  return target
}

function getCreatureConditionLabel(creature: Creature, gameTime: number): string {
  if (creature.condition === 'trapped' && creature.trappedUntil !== null) {
    return `Trapped (${Math.max(0, creature.trappedUntil - gameTime).toFixed(1)}s left)`
  }

  if (creature.condition === 'enraged') {
    return 'Enraged'
  }

  if (creature.isFriendly) {
    return 'Friendly'
  }

  return 'Normal'
}

function formatTrapStateLabel(trap: Trap): string {
  if (trap.state === 'portable') {
    return 'Portable'
  }

  if (trap.state === 'arming') {
    return 'Arming'
  }

  return 'Armed'
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
