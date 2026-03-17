import { Vector2 } from '../types/game'
import { GRID_SIZE } from './Pathfinding'

const MOVEMENT_EPSILON = 0.0001
const DEFAULT_STEP_SCALES: readonly number[] = [1]

export interface MovementBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface WaypointMovementInput {
  position: Vector2
  direction: number
  waypoints: Vector2[]
  speed: number
  waypointReachDistance: number
  navigationCellSize?: number
  stepScales?: readonly number[]
  clampBounds?: MovementBounds
  isWalkable?: (position: Vector2) => boolean
}

export interface WaypointMovementResult {
  position: Vector2
  direction: number
  waypoints: Vector2[]
  moved: boolean
  arrived: boolean
}

export interface DirectMovementInput {
  position: Vector2
  direction: number
  targetPosition: Vector2
  speed: number
  stepScales?: readonly number[]
  clampBounds?: MovementBounds
  isWalkable?: (position: Vector2) => boolean
}

export interface DirectMovementResult {
  position: Vector2
  direction: number
  moved: boolean
}

export function createMovementBounds(
  mapWidth: number,
  mapHeight: number,
  padding: number = 0
): MovementBounds {
  return {
    minX: padding,
    maxX: Math.max(padding, mapWidth - padding),
    minY: padding,
    maxY: Math.max(padding, mapHeight - padding),
  }
}

export function stepAlongWaypoints(input: WaypointMovementInput): WaypointMovementResult {
  const safeSpeed = Math.max(0, input.speed)
  const safeReachDistance = Math.max(0, input.waypointReachDistance)
  const navigationCellSize = input.navigationCellSize ?? GRID_SIZE

  const pruned = pruneConsumedWaypoints(
    input.position,
    input.waypoints,
    safeReachDistance,
    navigationCellSize
  )

  if (pruned.remainingWaypoints.length === 0) {
    const moved = distanceBetween(input.position, pruned.anchorPosition) > MOVEMENT_EPSILON
    return {
      position: pruned.anchorPosition,
      direction: input.direction,
      waypoints: [],
      moved,
      arrived: true,
    }
  }

  if (safeSpeed <= MOVEMENT_EPSILON) {
    const moved = distanceBetween(input.position, pruned.anchorPosition) > MOVEMENT_EPSILON
    return {
      position: pruned.anchorPosition,
      direction: input.direction,
      waypoints: pruned.remainingWaypoints,
      moved,
      arrived: false,
    }
  }

  const target = pruned.remainingWaypoints[0]
  const angle = Math.atan2(target.y - pruned.anchorPosition.y, target.x - pruned.anchorPosition.x)
  const distanceToTarget = distanceBetween(pruned.anchorPosition, target)

  const nextPosition = tryStepTowardTarget({
    origin: pruned.anchorPosition,
    target,
    distanceToTarget,
    speed: safeSpeed,
    stepScales: input.stepScales,
    clampBounds: input.clampBounds,
    isWalkable: input.isWalkable,
  })

  if (!nextPosition) {
    const moved = distanceBetween(input.position, pruned.anchorPosition) > MOVEMENT_EPSILON
    return {
      position: pruned.anchorPosition,
      direction: input.direction,
      waypoints: pruned.remainingWaypoints,
      moved,
      arrived: false,
    }
  }

  return {
    position: nextPosition,
    direction: angle,
    waypoints: pruned.remainingWaypoints,
    moved: true,
    arrived: false,
  }
}

export function stepTowardsTarget(input: DirectMovementInput): DirectMovementResult {
  const safeSpeed = Math.max(0, input.speed)
  const distanceToTarget = distanceBetween(input.position, input.targetPosition)

  if (distanceToTarget <= MOVEMENT_EPSILON || safeSpeed <= MOVEMENT_EPSILON) {
    return {
      position: input.position,
      direction: input.direction,
      moved: false,
    }
  }

  const angle = Math.atan2(
    input.targetPosition.y - input.position.y,
    input.targetPosition.x - input.position.x
  )

  const nextPosition = tryStepTowardTarget({
    origin: input.position,
    target: input.targetPosition,
    distanceToTarget,
    speed: safeSpeed,
    stepScales: input.stepScales,
    clampBounds: input.clampBounds,
    isWalkable: input.isWalkable,
  })

  if (!nextPosition) {
    return {
      position: input.position,
      direction: angle,
      moved: false,
    }
  }

  return {
    position: nextPosition,
    direction: angle,
    moved: true,
  }
}

type PrunedWaypoints = {
  anchorPosition: Vector2
  remainingWaypoints: Vector2[]
}

function pruneConsumedWaypoints(
  origin: Vector2,
  waypoints: Vector2[],
  waypointReachDistance: number,
  navigationCellSize: number
): PrunedWaypoints {
  let anchorPosition = origin
  let index = 0

  while (index < waypoints.length) {
    const waypoint = waypoints[index]
    const distanceToWaypoint = distanceBetween(anchorPosition, waypoint)
    const reached = distanceToWaypoint <= waypointReachDistance
    const sameCell = isSameNavigationCell(anchorPosition, waypoint, navigationCellSize)

    if (!reached && !sameCell) {
      break
    }

    // Same-cell path nodes are often just start-cell centers from A* and should not pull entities backward.
    if (!reached && sameCell) {
      index += 1
      continue
    }

    anchorPosition = waypoint
    index += 1
  }

  return {
    anchorPosition,
    remainingWaypoints: waypoints.slice(index),
  }
}

type StepTowardTargetArgs = {
  origin: Vector2
  target: Vector2
  distanceToTarget: number
  speed: number
  stepScales?: readonly number[]
  clampBounds?: MovementBounds
  isWalkable?: (position: Vector2) => boolean
}

function tryStepTowardTarget(args: StepTowardTargetArgs): Vector2 | null {
  if (args.distanceToTarget <= MOVEMENT_EPSILON) {
    return null
  }

  const angle = Math.atan2(args.target.y - args.origin.y, args.target.x - args.origin.x)
  const scales = normalizeStepScales(args.stepScales)

  for (const scale of scales) {
    const rawStep = args.speed * scale
    if (rawStep <= MOVEMENT_EPSILON) {
      continue
    }

    const step = Math.min(rawStep, args.distanceToTarget)
    let candidate = {
      x: args.origin.x + Math.cos(angle) * step,
      y: args.origin.y + Math.sin(angle) * step,
    }

    if (args.clampBounds) {
      candidate = clampToBounds(candidate, args.clampBounds)
    }

    if (args.isWalkable && !args.isWalkable(candidate)) {
      continue
    }

    if (distanceBetween(args.origin, candidate) <= MOVEMENT_EPSILON) {
      continue
    }

    return candidate
  }

  return null
}

function normalizeStepScales(stepScales?: readonly number[]): readonly number[] {
  if (!stepScales || stepScales.length === 0) {
    return DEFAULT_STEP_SCALES
  }

  const filtered = stepScales.filter((scale) => Number.isFinite(scale) && scale > 0)
  if (filtered.length === 0) {
    return DEFAULT_STEP_SCALES
  }

  return filtered
}

function clampToBounds(position: Vector2, bounds: MovementBounds): Vector2 {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y)),
  }
}

function isSameNavigationCell(a: Vector2, b: Vector2, cellSize: number): boolean {
  if (cellSize <= 0) {
    return false
  }

  return (
    Math.floor(a.x / cellSize) === Math.floor(b.x / cellSize) &&
    Math.floor(a.y / cellSize) === Math.floor(b.y / cellSize)
  )
}

function distanceBetween(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
