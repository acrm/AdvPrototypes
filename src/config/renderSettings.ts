/**
 * All visual-layer constants: colours, pixel sizes, font strings.
 * Nothing here is imported by pure game-logic modules.
 */

// ---------------------------------------------------------------------------
// Shared colour helpers
// ---------------------------------------------------------------------------

/** Convert a 6-digit hex colour + alpha to an rgba() string. */
export function hexToRgba(hex: string, alpha: number): string {
  const n = hex.replace('#', '')
  if (n.length !== 6) return `rgba(255, 255, 255, ${alpha})`
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ---------------------------------------------------------------------------
// Map colours
// ---------------------------------------------------------------------------

export const WALL_COLOR = '#4A3F35'

// ---------------------------------------------------------------------------
// Canvas entity sizes (pixels)
// ---------------------------------------------------------------------------

/** Rendered triangle size for NPC creatures. */
export const CREATURE_TRIANGLE_SIZE = 15

/** Rendered triangle size for a single party member. */
export const PARTY_MEMBER_SIZE = 16

/** Spacing (pixels) between party-member markers when rendered together. */
export const PARTY_MEMBER_SPACING = 20

/** Radius of a downed-party-member circle. */
export const DOWNED_MEMBER_RADIUS = 6

// ---------------------------------------------------------------------------
// Canvas colours
// ---------------------------------------------------------------------------

/** Colour of active party-member triangles. */
export const PARTY_ACTIVE_COLOR = '#ffffff'

/** Colour of downed party-member circles. */
export const PARTY_DOWNED_COLOR = '#000000'

/** Stroke colour of downed party-member circles. */
export const PARTY_DOWNED_STROKE = 'rgba(255,255,255,0.7)'
