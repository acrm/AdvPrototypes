import { CreatureSpecies, ItemTemplate } from '../types/game'

type RangeTuple = [number, number]

export const GAME_SETTINGS = {
  world: {
    navigationCellSize: 50,
    layoutRegionScale: 5,
    chunkGeneration: {
      // 0 = strict square masks (25/25 for walls, fully open corridors), 1 = maximum variation.
      squareDeviationFactor: 0.7,
      wall: {
        sideRecessChanceAtMaxDeviation: 0.95,
        edgeNibbleChanceAtMaxDeviation: 0.75,
        cornerCutChanceAtMaxDeviation: 0.9,
      },
      open: {
        borderProtrusionChanceAtMaxDeviation: 0.85,
        extraProtrusionChanceAtMaxDeviation: 0.65,
        junctionClusterChanceAtMaxDeviation: 0.8,
        maxJunctionClusterCells: 3,
      },
    },
    viewportWidth: 1200,
    viewportHeight: 800,
    partyStartLayoutCell: {
      x: 2,
      y: 2,
    },
    hiddenArtifactPosition: {
      x: -9999,
      y: -9999,
    },
  },
  cycle: {
    durationSeconds: 240,
    initialCycleTime: 120,
    creatureTickMs: 50,
    creatureTimeStep: 0.05,
  },
  player: {
    movementTickMs: 30,
    speedPerTick: 5,
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
      food: 14,
      item: 18,
      trap: 22,
    },
    detectionRadiusBySpecies: {
      rat: 120,
      spider: 190,
      goblin: 160,
      myconid: 135,
      owl: 210,
      bat: 145,
      wolf: 200,
      kobold: 155,
    } as Record<CreatureSpecies, number>,
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
  spawn: {
    itemTemplateRotation: ['torch', 'food_ration', 'treasure'] as ItemTemplate[],
    trapColorsByTargetSpecies: {
      rat: '#f4d03f',
      spider: '#8e44ad',
      goblin: '#2ecc71',
      myconid: '#9b59b6',
      owl: '#f39c12',
      bat: '#34495e',
      wolf: '#5dade2',
      kobold: '#e67e22',
    } as Record<CreatureSpecies, string>,
    defaultTrapTriggerRadius: 22,
  },
} as const
