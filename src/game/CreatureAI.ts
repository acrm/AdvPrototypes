/**
 * Pure creature-AI functions — reaction decisions, alert state, movement.
 * No React, no Canvas, no side effects.
 */

import { Creature, CreatureRelation, Food, GameState, Vector2 } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import { findPathWithObstacles, GRID_SIZE, isPositionWalkable } from '../systems/Pathfinding'
import { createMovementBounds, stepAlongWaypoints, stepTowardsTarget } from '../systems/MovementSystem'
import { distanceBetween, getNearestFood } from './GameQueries'

const ALERT_DURATION_SECONDS = GAME_SETTINGS.npc.alertDurationSeconds
const SPECIES_RELATION_MATRIX = GAME_SETTINGS.npc.speciesRelationMatrix
const AGGRESSION_BOOST_MULTIPLIER = GAME_SETTINGS.npc.aggressionBoostMultiplier
const AGGRESSION_BOOST_DURATION_SECONDS = GAME_SETTINGS.npc.aggressionBoostDurationSeconds
const AGGRESSION_BOOST_COOLDOWN_SECONDS = GAME_SETTINGS.npc.aggressionBoostCooldownSeconds
const NPC_BOUNDARY_PADDING = GAME_SETTINGS.npc.mapBoundaryPadding
const NPC_WAYPOINT_REACH_MULTIPLIER = GAME_SETTINGS.npc.waypointReachDistanceMultiplier
const FOOD_FEEDING_DURATION = GAME_SETTINGS.food.feedingDurationSecondsByType
const FRIENDLY_FEEDINGS_REQUIRED = GAME_SETTINGS.food.feedingsToBecomeFriendly
const [TRAP_IMMOBILIZE_MIN, TRAP_IMMOBILIZE_MAX] = GAME_SETTINGS.trap.immobilizeDurationRangeSeconds

const CREATURE_STEP_SCALES = [1, 0.66, 0.4, 0.2] as const

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export type ReactionAction = 'attack' | 'avoid'

export type ReactionDecision = {
  action: ReactionAction
  targetType: 'player' | 'creature'
  targetId: string
  targetPosition: Vector2
  distance: number
}

// ---------------------------------------------------------------------------
// Aggression-model helpers
// ---------------------------------------------------------------------------

export function getEffectiveAggressionModel(aggression: Creature['aggression']): 'proximity' | 'vision' {
  return aggression === 'proximity' ? 'proximity' : 'vision'
}

function getAggressiveReactionRadius(creature: Creature): number {
  return getEffectiveAggressionModel(creature.aggression) === 'vision'
    ? creature.farBehaviorRadius
    : creature.alertRadius
}

export function shouldAttackByRelation(
  relation: CreatureRelation,
  distance: number,
  creature: Creature
): boolean {
  if (relation === 'aggressive') return distance <= getAggressiveReactionRadius(creature)
  if (relation === 'neutral') return distance <= creature.alertRadius
  return false
}

export function shouldAvoidByRelation(
  relation: CreatureRelation,
  distance: number,
  creature: Creature
): boolean {
  return relation === 'avoid' && distance <= creature.farBehaviorRadius
}

export function getSpeciesRelation(
  observerSpecies: Creature['species'],
  targetSpecies: Creature['species']
): CreatureRelation {
  return (SPECIES_RELATION_MATRIX as Record<string, Record<string, CreatureRelation>>)[observerSpecies]?.[targetSpecies] ?? 'neutral'
}

// ---------------------------------------------------------------------------
// Alert state
// ---------------------------------------------------------------------------

export function isCreatureInAlertRadius(creature: Creature, partyPosition: Vector2): boolean {
  return distanceBetween(creature.position, partyPosition) <= creature.alertRadius
}

export function isCreatureInFarBehaviorRadius(creature: Creature, targetPosition: Vector2): boolean {
  return distanceBetween(creature.position, targetPosition) <= creature.farBehaviorRadius
}

export function updateCreatureAlertState(
  creature: Creature,
  gameTime: number,
  partyPosition: Vector2
): Creature {
  if (creature.isFriendly) return creature

  if (isCreatureInAlertRadius(creature, partyPosition)) {
    return { ...creature, alertUntil: gameTime + ALERT_DURATION_SECONDS }
  }

  if (creature.alertUntil !== null && gameTime < creature.alertUntil) return creature

  return { ...creature, alertUntil: null }
}

// ---------------------------------------------------------------------------
// Aggression state helpers
// ---------------------------------------------------------------------------

export function isAggressionBoostActive(creature: Creature, gameTime: number): boolean {
  return creature.aggressionBoostUntil !== null && gameTime < creature.aggressionBoostUntil
}

export function clearExpiredAggressionState(creature: Creature, gameTime: number): Creature {
  return {
    ...creature,
    aggressionBoostUntil:
      creature.aggressionBoostUntil !== null && gameTime < creature.aggressionBoostUntil
        ? creature.aggressionBoostUntil
        : null,
    aggressionBoostCooldownUntil:
      creature.aggressionBoostCooldownUntil !== null &&
      gameTime < creature.aggressionBoostCooldownUntil
        ? creature.aggressionBoostCooldownUntil
        : null,
  }
}

export function clearAggressionTarget(creature: Creature): Creature {
  if (
    creature.aggressionTargetId === null &&
    creature.aggressionTargetType === null &&
    creature.aggressionBoostUntil === null
  ) {
    return creature
  }
  return {
    ...creature,
    aggressionTargetId: null,
    aggressionTargetType: null,
    aggressionBoostUntil: null,
  }
}

export function applyAggressionBurst(
  creature: Creature,
  reaction: ReactionDecision,
  gameTime: number
): Creature {
  const boostActive = isAggressionBoostActive(creature, gameTime)
  const cooldownActive =
    creature.aggressionBoostCooldownUntil !== null && gameTime < creature.aggressionBoostCooldownUntil

  if (boostActive || cooldownActive) {
    return { ...creature, aggressionTargetId: reaction.targetId, aggressionTargetType: reaction.targetType }
  }

  const boostUntil = gameTime + AGGRESSION_BOOST_DURATION_SECONDS
  return {
    ...creature,
    aggressionTargetId: reaction.targetId,
    aggressionTargetType: reaction.targetType,
    aggressionBoostUntil: boostUntil,
    aggressionBoostCooldownUntil: boostUntil + AGGRESSION_BOOST_COOLDOWN_SECONDS,
  }
}

// ---------------------------------------------------------------------------
// Movement helpers
// ---------------------------------------------------------------------------

export function moveCreatureAlongWaypoints(
  creature: Creature,
  waypoints: Vector2[],
  map: GameState['map'],
  speedMultiplier = 1
): Creature {
  const speed = creature.speed * speedMultiplier
  const bounds = createMovementBounds(map.width, map.height, NPC_BOUNDARY_PADDING)
  const movement = stepAlongWaypoints({
    position: creature.position,
    direction: creature.direction,
    waypoints,
    speed,
    waypointReachDistance: speed * NPC_WAYPOINT_REACH_MULTIPLIER,
    navigationCellSize: GRID_SIZE,
    stepScales: CREATURE_STEP_SCALES,
    clampBounds: bounds,
    isWalkable: (pos) => isPositionWalkable(pos, map.objects),
  })

  if (movement.arrived || !movement.moved) {
    return { ...creature, position: movement.position, state: 'idle', waypoints: [] }
  }

  return {
    ...creature,
    position: movement.position,
    direction: movement.direction,
    state: 'patrol',
    waypoints: movement.waypoints,
  }
}

export function moveCreatureDirectly(
  creature: Creature,
  targetPosition: Vector2,
  map: GameState['map'],
  speedMultiplier = 1
): Creature {
  const bounds = createMovementBounds(map.width, map.height, NPC_BOUNDARY_PADDING)
  const movement = stepTowardsTarget({
    position: creature.position,
    direction: creature.direction,
    targetPosition,
    speed: creature.speed * speedMultiplier,
    stepScales: CREATURE_STEP_SCALES,
    clampBounds: bounds,
    isWalkable: (pos) => isPositionWalkable(pos, map.objects),
  })

  return {
    ...creature,
    position: movement.moved ? movement.position : creature.position,
    direction: movement.direction,
    state: 'patrol',
    waypoints: [],
  }
}

export function findFleePosition(
  creature: Creature,
  threatPosition: Vector2,
  map: GameState['map']
): Vector2 {
  const base = Math.atan2(
    creature.position.y - threatPosition.y,
    creature.position.x - threatPosition.x
  )
  const step = Math.max(creature.alertRadius * 1.5, creature.farBehaviorRadius * 0.7)
  const angles = [
    base,
    base + Math.PI / 6,
    base - Math.PI / 6,
    base + Math.PI / 3,
    base - Math.PI / 3,
    base + Math.PI / 2,
    base - Math.PI / 2,
  ]

  for (const angle of angles) {
    const candidate = {
      x: Math.max(NPC_BOUNDARY_PADDING, Math.min(map.width - NPC_BOUNDARY_PADDING, creature.position.x + Math.cos(angle) * step)),
      y: Math.max(NPC_BOUNDARY_PADDING, Math.min(map.height - NPC_BOUNDARY_PADDING, creature.position.y + Math.sin(angle) * step)),
    }
    if (isPositionWalkable(candidate, map.objects)) return candidate
  }

  return creature.position
}

// ---------------------------------------------------------------------------
// Reaction decision
// ---------------------------------------------------------------------------

function getReactionPriority(creature: Creature, decision: ReactionDecision): number {
  if (decision.action === 'avoid') return -2
  if (decision.targetType === 'player' && creature.relation === 'aggressive') return -1
  return decision.distance <= creature.alertRadius ? 0 : 1
}

export function selectReactionDecision(
  creature: Creature,
  party: GameState['party'],
  creatures: Creature[]
): ReactionDecision | null {
  const decisions: ReactionDecision[] = []

  if (party.health > 0) {
    const distToPlayer = distanceBetween(creature.position, party.position)
    const rel = creature.isFriendly ? 'friendly' : creature.relation

    if (shouldAttackByRelation(rel, distToPlayer, creature)) {
      decisions.push({ action: 'attack', targetType: 'player', targetId: 'player', targetPosition: party.position, distance: distToPlayer })
    } else if (shouldAvoidByRelation(rel, distToPlayer, creature)) {
      decisions.push({ action: 'avoid', targetType: 'player', targetId: 'player', targetPosition: party.position, distance: distToPlayer })
    }
  }

  for (const other of creatures) {
    if (other.id === creature.id || other.condition === 'trapped') continue
    const rel = getSpeciesRelation(creature.species, other.species)
    const dist = distanceBetween(creature.position, other.position)

    if (shouldAttackByRelation(rel, dist, creature)) {
      decisions.push({ action: 'attack', targetType: 'creature', targetId: other.id, targetPosition: other.position, distance: dist })
      continue
    }
    if (shouldAvoidByRelation(rel, dist, creature)) {
      decisions.push({ action: 'avoid', targetType: 'creature', targetId: other.id, targetPosition: other.position, distance: dist })
    }
  }

  if (decisions.length === 0) return null

  decisions.sort((a, b) => {
    const pa = getReactionPriority(creature, a)
    const pb = getReactionPriority(creature, b)
    return pa !== pb ? pa - pb : a.distance - b.distance
  })

  const best = decisions[0]

  if (creature.aggressionTargetId !== null && creature.aggressionTargetType !== null) {
    const locked = decisions.find(
      (d) => d.targetId === creature.aggressionTargetId && d.targetType === creature.aggressionTargetType
    )
    if (locked) {
      if (getReactionPriority(creature, best) < getReactionPriority(creature, locked)) return best
      return locked
    }
  }

  return best
}

export function resolveCreatureReaction(
  creature: Creature,
  party: GameState['party'],
  creatures: Creature[],
  map: GameState['map'],
  gameTime: number
): Creature | null {
  if (creature.isFriendly || creature.condition === 'trapped') return null

  const reaction = selectReactionDecision(creature, party, creatures)
  if (!reaction) return null

  if (reaction.action === 'avoid') {
    const fleePos = findFleePosition(creature, reaction.targetPosition, map)
    const fleePath = findPathWithObstacles(creature.position, fleePos, map.objects, map.width, map.height)
    const base = {
      ...clearAggressionTarget(creature),
      alertUntil: gameTime + ALERT_DURATION_SECONDS,
      targetFoodId: null,
      eatingUntil: null,
      carriedFood: null,
      waypoints: fleePath,
    }
    return fleePath.length === 0
      ? { ...base, state: 'idle' as const, waypoints: [] }
      : moveCreatureAlongWaypoints(base, fleePath, map)
  }

  const chasePath = findPathWithObstacles(
    creature.position, reaction.targetPosition, map.objects, map.width, map.height
  )
  const boosted = applyAggressionBurst(creature, reaction, gameTime)
  const multiplier = isAggressionBoostActive(boosted, gameTime) ? AGGRESSION_BOOST_MULTIPLIER : 1
  const chasing = {
    ...boosted,
    alertUntil: gameTime + ALERT_DURATION_SECONDS,
    targetFoodId: null,
    eatingUntil: null,
    carriedFood: null,
    waypoints: chasePath,
  }

  if (chasePath.length === 0) return moveCreatureDirectly(chasing, reaction.targetPosition, map, multiplier)

  const moved = moveCreatureAlongWaypoints(chasing, chasePath, map, multiplier)
  if (
    distanceBetween(moved.position, creature.position) <= 0.001 &&
    distanceBetween(reaction.targetPosition, creature.position) > creature.width / 2
  ) {
    return moveCreatureDirectly(chasing, reaction.targetPosition, map, multiplier)
  }
  return moved
}

// ---------------------------------------------------------------------------
// Food targeting
// ---------------------------------------------------------------------------

export function getFeedingDurationSeconds(foodType: Food['foodType']): number {
  return (FOOD_FEEDING_DURATION as Record<string, number>)[foodType]
}

export function selectFoodTargetForCreature(creature: Creature, foods: Food[]): Food | null {
  const visible = foods.filter(
    (f) => distanceBetween(creature.position, f.position) <= creature.detectionRadius
  )
  if (visible.length === 0) return null

  for (const priority of creature.dietPriorities) {
    if (!priority.startsWith('food:')) continue
    const type = priority.slice('food:'.length) as Food['foodType']
    const matches = visible.filter((f) => f.foodType === type)
    if (matches.length > 0) return getNearestFood(creature.position, matches)
  }

  return getNearestFood(creature.position, visible)
}

// ---------------------------------------------------------------------------
// Trap immobilization
// ---------------------------------------------------------------------------

export function getTrapImmobilizeDuration(creature: Creature): number {
  const size = Math.max(creature.width, creature.height)
  const t = Math.max(0, Math.min(1, (size - 12) / 10))
  return TRAP_IMMOBILIZE_MIN + t * (TRAP_IMMOBILIZE_MAX - TRAP_IMMOBILIZE_MIN)
}

// ---------------------------------------------------------------------------
// Friendly feedings threshold export
// ---------------------------------------------------------------------------

export { FRIENDLY_FEEDINGS_REQUIRED }
