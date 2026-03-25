import React from 'react'
import { Creature, Food, GameObject, Party, Trap } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import './InfoPanel.css'

const CYCLE_DURATION_SECONDS = GAME_SETTINGS.cycle.durationSeconds
const NAV_CELL_PX = GAME_SETTINGS.world.navigationCellSize // 1 block = 1 navigation cell = 50 px
type TickPlaybackMode = 'paused' | 'normal'

interface InfoPanelProps {
  selectedObject: GameObject | null
  party: Party
  clockLabel: string
  clockDay: number
  cycleTime: number
  gameTime: number
  tickPlaybackMode: TickPlaybackMode
  isThrowTargeting: boolean
  throwRadius: number
  fps: number
  totalCreatures: number
  activeAiCreatures: number
  isVictory: boolean
  isDefeated: boolean
  isRecovering: boolean
  canPickUpSelected: boolean
  canSetTrapSelected: boolean
  canThrowCarried: boolean
  canDropCarried: boolean
  canEatCarried: boolean
  onPickUpSelected: () => void
  onSetTrapSelected: () => void
  onThrowCarried: () => void
  onDropCarried: () => void
  onEatCarried: () => void
  onPauseTicks: () => void
  onStepTick: () => void
  onPlayFullSpeed: () => void
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedObject,
  party,
  clockLabel,
  clockDay,
  cycleTime,
  gameTime,
  tickPlaybackMode,
  isThrowTargeting,
  throwRadius,
  fps,
  totalCreatures,
  activeAiCreatures,
  isVictory,
  isDefeated,
  isRecovering,
  canPickUpSelected,
  canSetTrapSelected,
  canThrowCarried,
  canDropCarried,
  canEatCarried,
  onPickUpSelected,
  onSetTrapSelected,
  onThrowCarried,
  onDropCarried,
  onEatCarried,
  onPauseTicks,
  onStepTick,
  onPlayFullSpeed,
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
    const partyLine = party.members.map((name, i) => {
      const heart = (party.memberStatuses[i] ?? 'downed') === 'active' ? '❤' : '·'
      return `${heart} ${name}`
    }).join('  ')
    info += `[PARTY] ${partyLine}\n\n`
    info += `[SPEED] ${formatPartySpeedLabel(party.health)}\n\n`
    info += `[POSITION] (${Math.round(party.position.x)}, ${Math.round(party.position.y)})\n\n`
    info += `[CARRYING] ${party.carriedItem ? party.carriedItem.name : 'Nothing'}\n\n`
    info += `[OBSERVED] ${party.observedCreatures.size} creatures\n\n`
    info += `[CONTROLS] Actions are shown below only when they are available\n\n`

    if (isThrowTargeting) {
      info += `[THROW MODE] Click walkable ground within ${formatBlocks(throwRadius)} bl\n\n`
    }

    if (isDefeated) {
      info += `[PROGRESS] Game over. Party defeated.`
      return info
    }

    if (isRecovering && party.recoveringUntil !== null) {
      info += `[PROGRESS] Recovering`
      return info
    }

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

  const formatBlocks = (pixels: number): string => {
    return (pixels / NAV_CELL_PX).toFixed(1)
  }

  const cycleSecToHHMM = (s: number): string => {
    const totalMin = Math.floor(s * 6)
    const h = Math.floor(totalMin / 60) % 24
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getCreatureDescription = (creature: Creature): string => {
    let desc = `${creature.description}\n\n`
    
    desc += `[STATE] ${getCreatureStateLabel(creature, gameTime)}\n\n`
    
    // Show relation
    const relationEmoji = creature.relation === 'friendly' ? '💚' : creature.relation === 'aggressive' ? '❤️‍🔥' : '⚪'
    desc += `[RELATION] ${relationEmoji} ${creature.relation.charAt(0).toUpperCase() + creature.relation.slice(1)}\n\n`
    
    if (creature.condition === 'trapped' && creature.trappedUntil !== null) {
      desc += `[RELEASE IN] ${Math.max(0, creature.trappedUntil - gameTime).toFixed(1)}s\n\n`
    }

    if (creature.eatingUntil !== null) {
      desc += `[EATING] ${Math.max(0, creature.eatingUntil - gameTime).toFixed(1)}s remaining\n\n`
    } else if (creature.targetFoodId) {
      desc += `[FOOD TARGET] Tracking visible food\n\n`
    }
    
    // Show sleep schedule
    const sleepStart = creature.sleepSchedule.sleepStart
    const sleepEnd = creature.sleepSchedule.sleepEnd
    desc += `[SLEEP] ${cycleSecToHHMM(sleepStart)}–${cycleSecToHHMM(sleepEnd)} ${sleepEnd < sleepStart ? '(wraps)' : ''}\n\n`
    desc += `[ALARM ZONE] ${formatBlocks(creature.alertRadius)} bl\n`
    desc += `[AWARENESS ZONE] ${formatBlocks(creature.farBehaviorRadius)} bl\n\n`
    const fleeTargets = getFleeTargetsList(creature)
    if (fleeTargets) {
      desc += `[AVOIDS] ${fleeTargets}\n\n`
    }
    
    if (creature.behavior) desc += `[BEHAVIOR] ${creature.behavior}\n`
    
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
    return [
      `= ${trap.name.toUpperCase()} =`,
      '',
      trap.description,
      '',
      `[TYPE] ${trap.type}`,
      `[STATUS] ${formatTrapStateLabel(trap)}`,
      `[VISIBILITY] ${trap.state === 'portable' ? 'Visible and portable' : 'Hidden after placement'}`,
      `[TARGET SPECIES] ${trap.targetSpecies}`,
      `[TRIGGER RADIUS] ${formatBlocks(trap.triggerRadius)} bl`,
      ...(trap.state === 'arming' ? [`[ARMED IN] ...`] : []),
    ].join('\n')
  }

  let content: string = ''
  const entityDisplayName = selectedObject ? selectedObject.name : 'Adventuring Party'

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
        <div className="panel-header-main-row">
          <h2>INFO</h2>
          <div className="panel-clock">{clockLabel}</div>
        </div>
      </div>
      <div className="panel-content">
        <div className="entity-name-block">{entityDisplayName}</div>
        {!selectedObject && (
          <div className="fixed-time-block">
            <span className="time-day">Day {clockDay}</span>
            <span className="time-clock">{clockLabel}</span>
            <span className="time-phase">{getTimeOfDay(cycleTime)}</span>
          </div>
        )}
        <div className="panel-content-details">
          <InfoContent text={content} />
        </div>
        <div className="panel-actions">
          {canPickUpSelected && (
            <button
              type="button"
              className="action-button"
              onClick={onPickUpSelected}
            >
              [PICK UP]
            </button>
          )}
          {canSetTrapSelected && (
            <button
              type="button"
              className="action-button"
              onClick={onSetTrapSelected}
            >
              [SET TRAP]
            </button>
          )}
          {canThrowCarried && (
            <button
              type="button"
              className="action-button"
              onClick={onThrowCarried}
            >
              {isThrowTargeting ? '[THROW: AIM]' : '[THROW]'}
            </button>
          )}
          {canDropCarried && (
            <button
              type="button"
              className="action-button"
              onClick={onDropCarried}
            >
              [DROP]
            </button>
          )}
          {canEatCarried && (
            <button
              type="button"
              className="action-button"
              onClick={onEatCarried}
            >
              [EAT]
            </button>
          )}
        </div>
        <div className="debug-controls">
          <div className="debug-controls-title">[SIM DEBUG] {getTickPlaybackModeLabel(tickPlaybackMode)}</div>
          <div className="debug-stats">
            <div className="debug-stat-line">[FPS] {fps.toFixed(1)}</div>
            <div className="debug-stat-line">[CREATURES TOTAL] {totalCreatures}</div>
            <div className="debug-stat-line">[CREATURES ACTIVE AI] {activeAiCreatures}</div>
          </div>
          <div className="panel-actions debug-actions">
            <button
              type="button"
              className="action-button"
              disabled={tickPlaybackMode === 'paused'}
              onClick={onPauseTicks}
            >
              [PAUSE]
            </button>
            <button
              type="button"
              className="action-button"
              onClick={onStepTick}
            >
              [STEP +1]
            </button>
            <button
              type="button"
              className="action-button"
              disabled={tickPlaybackMode === 'normal'}
              onClick={onPlayFullSpeed}
            >
              [RUN]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTickPlaybackModeLabel(mode: TickPlaybackMode): string {
  if (mode === 'paused') {
    return 'Paused'
  }

  return 'Running (6 TPS)'
}

function formatPartySpeedLabel(health: number): string {
  if (health >= 3) {
    return '100% (normal)'
  }

  if (health === 2) {
    return '75% (-25%)'
  }

  if (health === 1) {
    return '50% (-50%)'
  }

  return '0% (defeated)'
}

function getCreatureStateLabel(creature: Creature, gameTime: number): string {
  if (creature.condition === 'trapped' && creature.trappedUntil !== null) {
    return `🪤 Trapped`
  }
  if (creature.condition === 'enraged') {
    return `❤️‍🔥 Pursuit (enraged)`
  }
  const isAlerted = creature.alertUntil !== null && gameTime < creature.alertUntil
  if (creature.state === 'sleeping') {
    return `💤 Sleeping`
  }
  if (creature.state === 'idle') {
    return isAlerted ? `⏸️ Idle · Alerted` : `⏸️ Idle`
  }
  // patrol
  const suffix = isAlerted ? ' · Alerted' : creature.isFriendly ? ' · Friendly' : ''
  return `🚶 Patrol${suffix}`
}

function getFleeTargetsList(creature: Creature): string {
  const targets: string[] = []
  if (creature.relation === 'avoid') {
    targets.push('Adventuring Party')
  }
  const relationMatrix = GAME_SETTINGS.npc.speciesRelationMatrix as Record<string, Record<string, string>>
  const myRelations = relationMatrix[creature.species] ?? {}
  for (const [otherSpecies, relation] of Object.entries(myRelations)) {
    if (relation === 'avoid') {
      targets.push(getCreatureDisplayName(otherSpecies))
    }
  }
  return targets.join(', ')
}

function getCreatureDisplayName(species: string): string {
  if (species === 'rat') {
    return 'Giant Rat'
  }

  if (species === 'spider') {
    return 'Giant Spider'
  }

  if (species === 'goblin') {
    return 'Goblin'
  }

  if (species === 'myconid') {
    return 'Myconid'
  }

  if (species === 'owl') {
    return 'Owl'
  }

  if (species === 'bat') {
    return 'Bat'
  }

  if (species === 'wolf') {
    return 'Wolf'
  }

  if (species === 'kobold') {
    return 'Kobold'
  }

  return species
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
