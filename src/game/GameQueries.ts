/**
 * Pure query functions — read-only predicates and lookups over game state.
 * No React, no Canvas, no side effects.
 */

import { Artifact, ExtractionZone, Food, GameState, GameObject, Trap, Vector2 } from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'

const HIDDEN_ARTIFACT_POSITION = GAME_SETTINGS.world.hiddenArtifactPosition
const SPEED_MULTIPLIER_BY_HEALTH = GAME_SETTINGS.health.speedMultiplierByHealth
const MAX_HEARTS = GAME_SETTINGS.health.maxHearts
const COLLISION_DAMAGE_COOLDOWN = GAME_SETTINGS.health.collisionDamageCooldownSeconds

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export function distanceBetween(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function isPointInsideExtractionZone(point: Vector2, zone: ExtractionZone): boolean {
  return (
    point.x >= zone.position.x - zone.width / 2 &&
    point.x <= zone.position.x + zone.width / 2 &&
    point.y >= zone.position.y - zone.height / 2 &&
    point.y <= zone.position.y + zone.height / 2
  )
}

// ---------------------------------------------------------------------------
// Artifact helpers
// ---------------------------------------------------------------------------

export function isArtifactOnMap(artifact: Artifact): boolean {
  return artifact.position.x >= 0 && artifact.position.y >= 0
}

export function hideArtifact(artifact: Artifact): Artifact {
  return {
    ...artifact,
    position: { x: HIDDEN_ARTIFACT_POSITION.x, y: HIDDEN_ARTIFACT_POSITION.y },
  }
}

// ---------------------------------------------------------------------------
// Trap helpers
// ---------------------------------------------------------------------------

export function isPortableTrap(trap: Trap): boolean {
  return trap.state === 'portable'
}

export function isPickupableTrap(trap: Trap): boolean {
  return trap.state === 'portable' || trap.state === 'armed'
}

export function isTrapSelectable(trap: Trap): boolean {
  return trap.state === 'portable' || trap.state === 'arming' || trap.state === 'armed'
}

// ---------------------------------------------------------------------------
// Party queries
// ---------------------------------------------------------------------------

export function hasArtifactExtracted(party: GameState['party'], zone: ExtractionZone): boolean {
  return (
    party.carriedItem?.type === 'artifact' &&
    isPointInsideExtractionZone(party.position, zone)
  )
}

export function isPartyDefeated(party: GameState['party']): boolean {
  return party.health <= 0
}

export function isPartyRecovering(party: GameState['party'], gameTime: number): boolean {
  return party.recoveringUntil !== null && gameTime < party.recoveringUntil
}

export function getPartySpeedMultiplier(health: number): number {
  const clamped = Math.max(0, Math.min(MAX_HEARTS, Math.floor(health)))
  return (SPEED_MULTIPLIER_BY_HEALTH as Record<number, number>)[clamped] ?? 1
}

// ---------------------------------------------------------------------------
// Collision / damage queries
// ---------------------------------------------------------------------------

export function isCollisionDamageReady(lastDamageAt: number | null, gameTime: number): boolean {
  return lastDamageAt === null || gameTime - lastDamageAt >= COLLISION_DAMAGE_COOLDOWN
}

export function isCreatureDamagingOnCollision(
  creature: GameState['map']['creatures'][number],
  partyPosition: Vector2
): boolean {
  if (creature.state === 'sleeping' || creature.condition === 'trapped' || creature.isFriendly) {
    return false
  }

  const activelyAggressiveToPlayer =
    creature.condition === 'enraged' ||
    (creature.aggressionTargetType === 'player' && creature.aggressionTargetId === 'player')

  if (!activelyAggressiveToPlayer) {
    return false
  }

  return distanceBetween(creature.position, partyPosition) <= creature.width / 2 + 10
}

// ---------------------------------------------------------------------------
// Selected-object sync
// ---------------------------------------------------------------------------

export function syncSelectedObject(
  selectedObject: GameObject | null,
  map: GameState['map']
): GameObject | null {
  if (!selectedObject) return null

  if (selectedObject.type === 'creature') {
    return map.creatures.find((c) => c.id === selectedObject.id) ?? null
  }
  if (selectedObject.type === 'item') {
    return map.items.find((i) => i.id === selectedObject.id) ?? null
  }
  if (selectedObject.type === 'food') {
    return map.food.find((f) => f.id === selectedObject.id) ?? null
  }
  if (selectedObject.type === 'trap') {
    return map.traps.find((t) => t.id === selectedObject.id) ?? null
  }
  if (selectedObject.type === 'artifact') {
    return map.artifact.id === selectedObject.id && isArtifactOnMap(map.artifact) ? map.artifact : null
  }

  return map.objects.find((o) => o.id === selectedObject.id) ?? null
}

// ---------------------------------------------------------------------------
// Food helper (used by both GameQueries and CreatureAI)
// ---------------------------------------------------------------------------

export function getNearestFood(origin: Vector2, foods: Food[]): Food | null {
  let best: Food | null = null
  let bestDist = Infinity
  for (const f of foods) {
    const d = distanceBetween(origin, f.position)
    if (d < bestDist) {
      best = f
      bestDist = d
    }
  }
  return best
}
