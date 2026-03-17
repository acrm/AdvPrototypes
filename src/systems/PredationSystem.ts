import { Creature } from '../types/game'

const DEFAULT_CONSUME_PADDING = 2

export interface PredationConfig {
  feedingDurationSeconds: number
  consumeDistancePadding?: number
}

export interface PredationResolution {
  creatures: Creature[]
  consumedCreatureIds: string[]
}

export function resolvePredationTick(
  creatures: Creature[],
  gameTime: number,
  config: PredationConfig
): PredationResolution {
  const consumedIds = new Set<string>()
  const predatorUpdates = new Map<string, Creature>()
  const creaturesById = new Map<string, Creature>(creatures.map((creature) => [creature.id, creature]))
  const consumeDistancePadding = config.consumeDistancePadding ?? DEFAULT_CONSUME_PADDING
  const feedingDurationSeconds = Math.max(0, config.feedingDurationSeconds)

  for (const creature of creatures) {
    if (consumedIds.has(creature.id)) {
      continue
    }

    const predator = predatorUpdates.get(creature.id) ?? creature
    if (!isPredatorCandidate(predator)) {
      continue
    }

    if (predator.aggressionTargetType !== 'creature' || predator.aggressionTargetId === null) {
      continue
    }

    const targetId = predator.aggressionTargetId
    if (targetId === predator.id || consumedIds.has(targetId)) {
      continue
    }

    const target = predatorUpdates.get(targetId) ?? creaturesById.get(targetId)
    if (!target || consumedIds.has(target.id)) {
      continue
    }

    if (!canConsumeTarget(predator, target, consumeDistancePadding)) {
      continue
    }

    consumedIds.add(target.id)
    predatorUpdates.set(predator.id, {
      ...predator,
      state: 'idle',
      waypoints: [],
      targetFoodId: null,
      eatingUntil: gameTime + feedingDurationSeconds,
      carriedFood: null,
      aggressionTargetId: null,
      aggressionTargetType: null,
      aggressionBoostUntil: null,
    })
  }

  const survivors = creatures
    .filter((creature) => !consumedIds.has(creature.id))
    .map((creature) => predatorUpdates.get(creature.id) ?? creature)

  return {
    creatures: survivors,
    consumedCreatureIds: Array.from(consumedIds),
  }
}

function isPredatorCandidate(creature: Creature): boolean {
  if (creature.isFriendly) {
    return false
  }

  if (creature.condition === 'trapped' || creature.state === 'sleeping') {
    return false
  }

  if (creature.eatingUntil !== null) {
    return false
  }

  return true
}

function canConsumeTarget(predator: Creature, target: Creature, consumePadding: number): boolean {
  const consumeDistance = predator.width / 2 + target.width / 2 + Math.max(0, consumePadding)
  const distance = Math.hypot(
    predator.position.x - target.position.x,
    predator.position.y - target.position.y
  )

  return distance <= consumeDistance
}
