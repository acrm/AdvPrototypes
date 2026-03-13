import { CreatureSpecies } from '../types/game'

type RangeTuple = [number, number]

export const GAME_SETTINGS = {
  world: {
    navigationCellSize: 50,
    layoutRegionScale: 3,
    viewportWidth: 1200,
    viewportHeight: 800,
  },
  cycle: {
    durationSeconds: 240,
    initialCycleTime: 120,
    creatureTickMs: 50,
    creatureTimeStep: 0.05,
  },
  player: {
    movementTickMs: 30,
    speedPerTick: 2,
    interactionRadius: 30,
    pickupRadius: 30,
    timeStep: 0.001,
  },
  npc: {
    idleTurnIntervalRange: [1, 2] as RangeTuple,
    patrolStartChancePerTick: 0.01,
    waypointReachDistanceMultiplier: 2,
    mapBoundaryPadding: 30,
    respawnCooldownSeconds: {
      creature: 35,
      item: 18,
    },
    speedRanges: {
      rat: [0.4, 0.7],
      spider: [0.3, 0.6],
      goblin: [0.5, 0.8],
      myconid: [0.2, 0.4],
      owl: [0.6, 0.9],
      bat: [0.7, 1.1],
      wolf: [0.6, 0.9],
      kobold: [0.5, 0.8],
    } as Record<CreatureSpecies, RangeTuple>,
    sleepSchedule: {
      nocturnal: {
        startRange: [60, 80] as RangeTuple,
        endRange: [160, 180] as RangeTuple,
        variationRange: [5, 15] as RangeTuple,
      },
      diurnal: {
        startRange: [200, 220] as RangeTuple,
        endRange: [40, 60] as RangeTuple,
        variationRange: [5, 15] as RangeTuple,
      },
    },
  },
} as const
