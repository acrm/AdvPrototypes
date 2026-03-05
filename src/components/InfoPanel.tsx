import React from 'react'
import { GameObject, Party, Creature } from '../types/game'
import './InfoPanel.css'

interface InfoPanelProps {
  selectedObject: GameObject | null
  party: Party
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ selectedObject, party }) => {
  const displayPartyInfo = (): string => {
    let info = `# PARTY STATUS\n\n`
    info += `**Members:** ${party.members.join(', ')}\n\n`
    info += `**Position:** (${Math.round(party.position.x)}, ${Math.round(party.position.y)})\n\n`
    info += `**Observed Creatures:** ${party.observedCreatures.size}\n\n`
    info += `**Progress:** Searching for artifact...`
    return info
  }

  const getCreatureDescription = (creature: Creature): string => {
    let desc = `**${creature.name}**\n\n`
    desc += `${creature.description}\n\n`
    if (creature.behavior) desc += `**Behavior:** ${creature.behavior}\n`
    if (creature.diet) desc += `**Diet:** ${creature.diet}\n`
    if (creature.threat) desc += `**Threat Level:** ${creature.threat}\n`
    desc += `\n**Times Observed:** ${party.observedCreatures.get(creature.id) || 0}`
    return desc
  }

  let content: string = ''

  if (selectedObject) {
    if (selectedObject.type === 'creature') {
      content = getCreatureDescription(selectedObject as Creature)
    } else {
      content = `# ${selectedObject.name}\n\n${selectedObject.description}`
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
        if (line.startsWith('# ')) {
          return <h3 key={idx}>{line.substring(2)}</h3>
        } else if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={idx} className="bold">
              {line.substring(2, line.length - 2)}
            </p>
          )
        } else if (line.trim() === '') {
          return <div key={idx} style={{ height: '0.5rem' }} />
        } else {
          return <p key={idx}>{line}</p>
        }
      })}
    </div>
  )
}
