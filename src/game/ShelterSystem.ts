/**
 * Shelter-zone detection.
 * Pure functions — no React, no Canvas, no side effects.
 */

import { Vector2 } from '../types/game'

export interface ShelterBound {
  /** Top-left x in world space. */
  x: number
  /** Top-left y in world space. */
  y: number
  /** Side length in world pixels. */
  size: number
}

/**
 * Return true when `position` falls inside any shelter chunk.
 * Used to suppress far-detection when the party is stationary inside a shelter.
 */
export function isPositionInShelter(position: Vector2, shelters: ShelterBound[]): boolean {
  for (const s of shelters) {
    if (
      position.x >= s.x &&
      position.x <= s.x + s.size &&
      position.y >= s.y &&
      position.y <= s.y + s.size
    ) {
      return true
    }
  }
  return false
}
