/**
 * Pure creature-AI functions — reaction decisions, alert state, movement.
 * No React, no Canvas, no side effects.
 */

import { Creature, CreatureRelation, Food, GameObject, GameState, Vector2 } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import { findPathWithObstacles, GRID_SIZE, isPositionWalkable } from '../systems/Pathfinding'
import { createMovementBounds, stepAlongWaypoints, stepTowardsTarget } from '../systems/MovementSystem'
import { distanceBetween, getNearestFood } from './GameQueries'

const ALERT_DURATION_SECONDS = GAME_SETTINGS.npc.alertDurationSeconds
const SPECIES_RELATION_MATRIX = GAME_SETTINGS.npc.speciesRelationMatrix
const AGGRESSION_BOOST_MULTIPLIER = GAME_SETTINGS.npc.aggressionBoostMultiplier
const AGGRESSION_BOOST_DURATION_SECONDS = GAME_SETTINGS.npc.aggressionBoostDurationSeconds
const AGGRESSION_BOOST_COOLDOWN_SECONDS = GAME_SETTINGS.npc.aggressionBoostCooldownSeconds
const AGGRESSION_TARGET_LOST_TIMEOUT_SECONDS = 2
const NPC_BOUNDARY_PADDING = GAME_SETTINGS.npc.mapBoundaryPadding
const NPC_WAYPOINT_REACH_MULTIPLIER = GAME_SETTINGS.npc.waypointReachDistanceMultiplier
const FOOD_FEEDING_DURATION = GAME_SETTINGS.food.feedingDurationSecondsByType
const FRIENDLY_FEEDINGS_REQUIRED = GAME_SETTINGS.food.feedingsToBecomeFriendly
const [TRAP_IMMOBILIZE_MIN, TRAP_IMMOBILIZE_MAX] = GAME_SETTINGS.trap.immobilizeDurationRangeSeconds

const CREATURE_STEP_SCALES = [1, 0.66, 0.4, 0.2] as const

function getCreatureNavigationObstacles(map: GameState['map']): GameObject[] {
  return [
    ...map.objects,
    ...map.refugeZones.map((zone, index) => ({
      id: `refuge_block_${index}`,
      type: 'obstacle' as const,
      position: zone.position,
      width: zone.width,
      height: zone.height,
      color: 'transparent',
      name: 'Shelter Boundary',
      description: 'Creatures cannot enter shelter chunks.',
    })),
  ]
}

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
// Vision mechanics (state-aware detection)
// ---------------------------------------------------------------------------

/**
 * Calculate if a target is within the creature's view cone.
 * Creatures face a direction and have a limited vision arc when idle.
 * @param creaturePos Position of the perceiving creature
 * @param creatureDir Direction creature is facing (in radians)
 * @param targetPos Position of the target to check
 * @param viewArc Angle of view cone in degrees (default 120°, ±60° from center)
 */
function isInViewCone(
  creaturePos: Vector2,
  creatureDir: number,
  targetPos: Vector2,
  viewArcDegrees: number = 120
): boolean {
  const dx = targetPos.x - creaturePos.x
  const dy = targetPos.y - creaturePos.y
  const angleToTarget = Math.atan2(dy, dx)

  // Normalize angles to [-π, π]
  const normalizeAngle = (angle: number): number => {
    while (angle > Math.PI) angle -= 2 * Math.PI
    while (angle < -Math.PI) angle += 2 * Math.PI
    return angle
  }

  const dirDiff = normalizeAngle(angleToTarget - creatureDir)
  const viewArcRadians = (viewArcDegrees / 2) * (Math.PI / 180)

  return Math.abs(dirDiff) <= viewArcRadians
}

/**
 * Check if creature can detect the player based on its current state.
 * - SLEEPING: Cannot detect (immediate return false)
 * - IDLE: Can detect only within view cone and only during periodic vision checks
 * - PATROL: Can detect at full radius with 360° awareness
 */
function canDetectPlayer(
  creature: Creature,
  partyPos: Vector2,
  gameTime: number,
  skipViewCone: boolean = false
): boolean {
  // Sleeping creatures can never detect player (far radius suppressed)
  if (creature.state === 'sleeping') return false

  // Distance check
  const dist = distanceBetween(creature.position, partyPos)

  // IDLE creatures: Only detect during scheduled vision checks with limited cone
  if (creature.state === 'idle') {
    // Only check vision on scheduled ticks
    if (gameTime < creature.nextVisionCheckAt) return false

    // Reduce effective detection radius when idle (80% of normal)
    const idleDetectionRadius = getAggressiveReactionRadius(creature) * 0.8

    if (dist > idleDetectionRadius) return false

    // Must be in view cone unless specifically skipped
    if (!skipViewCone && !isInViewCone(creature.position, creature.direction, partyPos, 120)) {
      return false
    }

    return true
  }

  // PATROL creatures: Full distance-based detection (no cone restriction)
  // Use the standard reaction radius
  return dist <= getAggressiveReactionRadius(creature)
}

/**
 * Update creature's vision check timer when in idle state.
 * Called after a vision check happens to schedule the next one.
 */
function scheduleNextVisionCheck(creature: Creature, gameTime: number): Creature {
  if (creature.state !== 'idle') return creature

  // Schedule next check 0.5-1.0 seconds from now
  const nextCheckInterval = getRandomFloat(0.5, 1.0)
  return {
    ...creature,
    nextVisionCheckAt: gameTime + nextCheckInterval,
  }
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
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
    creature.aggressionBoostUntil === null &&
    creature.aggressionOutOfRangeSince === null
  ) {
    return creature
  }
  return {
    ...creature,
    aggressionTargetId: null,
    aggressionTargetType: null,
    aggressionOutOfRangeSince: null,
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
    return {
      ...creature,
      aggressionTargetId: reaction.targetId,
      aggressionTargetType: reaction.targetType,
      aggressionOutOfRangeSince: null,
    }
  }

  const boostUntil = gameTime + AGGRESSION_BOOST_DURATION_SECONDS
  return {
    ...creature,
    aggressionTargetId: reaction.targetId,
    aggressionTargetType: reaction.targetType,
    aggressionOutOfRangeSince: null,
    aggressionBoostUntil: boostUntil,
    aggressionBoostCooldownUntil: boostUntil + AGGRESSION_BOOST_COOLDOWN_SECONDS,
  }
}

function resolveLockedTargetDecision(
  creature: Creature,
  party: GameState['party'],
  creatures: Creature[],
  gameTime: number
): { creature: Creature; decision: ReactionDecision | null } {
  if (creature.aggressionTargetId === null || creature.aggressionTargetType === null) {
    return { creature, decision: null }
  }

  if (creature.aggressionTargetType === 'player') {
    if (party.health <= 0) {
      return { creature: clearAggressionTarget(creature), decision: null }
    }

    const dist = distanceBetween(creature.position, party.position)
    if (dist <= creature.farBehaviorRadius) {
      return {
        creature: { ...creature, aggressionOutOfRangeSince: null },
        decision: {
          action: 'attack',
          targetType: 'player',
          targetId: 'player',
          targetPosition: party.position,
          distance: dist,
        },
      }
    }

    const outSince = creature.aggressionOutOfRangeSince ?? gameTime
    if (gameTime - outSince > AGGRESSION_TARGET_LOST_TIMEOUT_SECONDS) {
      return { creature: clearAggressionTarget(creature), decision: null }
    }

    return {
      creature: { ...creature, aggressionOutOfRangeSince: outSince },
      decision: {
        action: 'attack',
        targetType: 'player',
        targetId: 'player',
        targetPosition: party.position,
        distance: dist,
      },
    }
  }

  const target = creatures.find(
    (c) => c.id === creature.aggressionTargetId && c.condition !== 'trapped'
  )
  if (!target) {
    return { creature: clearAggressionTarget(creature), decision: null }
  }

  const dist = distanceBetween(creature.position, target.position)
  if (dist <= creature.farBehaviorRadius) {
    return {
      creature: { ...creature, aggressionOutOfRangeSince: null },
      decision: {
        action: 'attack',
        targetType: 'creature',
        targetId: target.id,
        targetPosition: target.position,
        distance: dist,
      },
    }
  }

  const outSince = creature.aggressionOutOfRangeSince ?? gameTime
  if (gameTime - outSince > AGGRESSION_TARGET_LOST_TIMEOUT_SECONDS) {
    return { creature: clearAggressionTarget(creature), decision: null }
  }

  return {
    creature: { ...creature, aggressionOutOfRangeSince: outSince },
    decision: {
      action: 'attack',
      targetType: 'creature',
      targetId: target.id,
      targetPosition: target.position,
      distance: dist,
    },
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
  const navigationObstacles = getCreatureNavigationObstacles(map)
  const movement = stepAlongWaypoints({
    position: creature.position,
    direction: creature.direction,
    waypoints,
    speed,
    waypointReachDistance: speed * NPC_WAYPOINT_REACH_MULTIPLIER,
    navigationCellSize: GRID_SIZE,
    stepScales: CREATURE_STEP_SCALES,
    clampBounds: bounds,
    isWalkable: (pos) => isPositionWalkable(pos, navigationObstacles),
  })

  if (movement.arrived) {
    return { ...creature, position: movement.position, state: 'idle', waypoints: [] }
  }

  if (!movement.moved) {
    // Keep patrol state when chasing so the creature immediately retries next tick
    // instead of snapping to idle and losing aggression context.
    const nextState = creature.aggressionTargetId !== null ? 'patrol' as const : 'idle' as const
    return { ...creature, position: movement.position, state: nextState, waypoints: [] }
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
  const navigationObstacles = getCreatureNavigationObstacles(map)
  const movement = stepTowardsTarget({
    position: creature.position,
    direction: creature.direction,
    targetPosition,
    speed: creature.speed * speedMultiplier,
    stepScales: CREATURE_STEP_SCALES,
    clampBounds: bounds,
    isWalkable: (pos) => isPositionWalkable(pos, navigationObstacles),
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
  const navigationObstacles = getCreatureNavigationObstacles(map)
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
    if (isPositionWalkable(candidate, navigationObstacles)) return candidate
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
  creatures: Creature[],
  gameTime: number
): ReactionDecision | null {
  const decisions: ReactionDecision[] = []

  if (party.health > 0) {
    const distToPlayer = distanceBetween(creature.position, party.position)
    const rel = creature.isFriendly ? 'friendly' : creature.relation

    // Use state-aware vision for player detection
    const canSeePlayer = canDetectPlayer(creature, party.position, gameTime)
    
    // Only attack/avoid if creature can actually detect the player
    if (canSeePlayer) {
      if (shouldAttackByRelation(rel, distToPlayer, creature)) {
        decisions.push({ action: 'attack', targetType: 'player', targetId: 'player', targetPosition: party.position, distance: distToPlayer })
      } else if (shouldAvoidByRelation(rel, distToPlayer, creature)) {
        decisions.push({ action: 'avoid', targetType: 'player', targetId: 'player', targetPosition: party.position, distance: distToPlayer })
      }
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

  if (decisions.length === 0) {
    return null
  }

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

  let workingCreature = creature
  let reaction = selectReactionDecision(workingCreature, party, creatures, gameTime)
  if (!reaction) {
    const locked = resolveLockedTargetDecision(workingCreature, party, creatures, gameTime)
    workingCreature = locked.creature
    reaction = locked.decision
  }
  if (!reaction) return null

  // If in idle state and we're making a detection decision, schedule next vision check
  if (workingCreature.state === 'idle') {
    workingCreature = scheduleNextVisionCheck(workingCreature, gameTime)
  }

  if (reaction.action === 'avoid') {
    const fleePos = findFleePosition(workingCreature, reaction.targetPosition, map)
    const fleePath = findPathWithObstacles(
      workingCreature.position,
      fleePos,
      getCreatureNavigationObstacles(map),
      map.width,
      map.height
    )
    const base = {
      ...clearAggressionTarget(workingCreature),
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
    workingCreature.position,
    reaction.targetPosition,
    getCreatureNavigationObstacles(map),
    map.width,
    map.height
  )
  const boosted = applyAggressionBurst(workingCreature, reaction, gameTime)
  const multiplier = isAggressionBoostActive(boosted, gameTime) ? AGGRESSION_BOOST_MULTIPLIER : 1
  const chasing = {
    ...boosted,
    alertUntil: gameTime + ALERT_DURATION_SECONDS,
    targetFoodId: null,
    eatingUntil: null,
    carriedFood: null,
    waypoints: chasePath,
  }

  if (chasePath.length === 0) {
    const directMove = moveCreatureDirectly(chasing, reaction.targetPosition, map, multiplier)
    // If can't pathfind AND can't move directly toward target, give up chase
    if (distanceBetween(directMove.position, workingCreature.position) <= 0.001) {
      return { ...clearAggressionTarget(directMove), state: 'idle' as const, waypoints: [] }
    }
    return directMove
  }

  const moved = moveCreatureAlongWaypoints(chasing, chasePath, map, multiplier)
  if (
    distanceBetween(moved.position, workingCreature.position) <= 0.001 &&
    distanceBetween(reaction.targetPosition, workingCreature.position) > workingCreature.width / 2
  ) {
    const directMove = moveCreatureDirectly(chasing, reaction.targetPosition, map, multiplier)
    // If pathfinding didn't move AND direct move doesn't work, give up
    if (distanceBetween(directMove.position, workingCreature.position) <= 0.001) {
      return { ...clearAggressionTarget(directMove), state: 'idle' as const, waypoints: [] }
    }
    return directMove
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
export { getCreatureNavigationObstacles }
