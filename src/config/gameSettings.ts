import { CreatureRelation, CreatureSpecies, FoodType, ItemTemplate } from '../types/game'

type RangeTuple = [number, number]

export const GAME_SETTINGS = {
  world: {
    navigationCellSize: 50,
    layoutRegionScale: 5,
    chunkGeneration: {
      // 0 = strict square masks (25/25 for walls, fully open corridors), 1 = maximum variation.
      squareDeviationFactor: 0.9,
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
    alertRadiusMultiplier: 0.5,
    farBehaviorRadiusMultiplier: 1.5,
    alertDurationSeconds: 3,
    aggressionModelBySpecies: {
      rat: 'proximity',
      spider: 'vision',
      goblin: 'vision',
      myconid: 'proximity',
      owl: 'vision',
      bat: 'vision',
      wolf: 'vision',
      kobold: 'proximity',
    } as Record<CreatureSpecies, 'proximity' | 'vision' | 'dual'>,
    playerRelationBySpecies: {
      rat: 'neutral',
      spider: 'aggressive',
      goblin: 'aggressive',
      myconid: 'neutral',
      owl: 'neutral',
      bat: 'aggressive',
      wolf: 'aggressive',
      kobold: 'neutral',
    } as Record<CreatureSpecies, CreatureRelation>,
    speciesRelationMatrix: {
      rat: {
        spider: 'avoid',
        owl: 'avoid',
        wolf: 'avoid',
      },
      spider: {
        goblin: 'aggressive',
        wolf: 'avoid',
      },
      goblin: {
        rat: 'aggressive',
        myconid: 'aggressive',
        wolf: 'avoid',
      },
      myconid: {
        goblin: 'avoid',
        wolf: 'avoid',
      },
      owl: {
        rat: 'aggressive',
        bat: 'aggressive',
        wolf: 'avoid',
      },
      bat: {
        owl: 'avoid',
        spider: 'avoid',
        wolf: 'avoid',
      },
      wolf: {
        rat: 'aggressive',
      },
      kobold: {
        rat: 'aggressive',
        spider: 'avoid',
        wolf: 'avoid',
      },
    } as Record<CreatureSpecies, Partial<Record<CreatureSpecies, CreatureRelation>>>,
    aggressionBoostMultiplier: 3,
    aggressionBoostDurationSeconds: 2,
    aggressionBoostCooldownSeconds: 2,
    speedRanges: {
      rat: [2.8, 4.5],
      spider: [2.3, 3.6],
      goblin: [2.5, 4.8],
      myconid: [1.2, 2.4],
      owl: [3.6, 4.9],
      bat: [3.7, 5.1],
      wolf: [4.6, 5.9],
      kobold: [2.5, 4.8],
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
  trap: {
    armDelaySeconds: 2,
    immobilizeDurationRangeSeconds: [10, 15] as RangeTuple,
  },
  food: {
    feedingsToBecomeFriendly: 3,
    feedingDurationSecondsByType: {
      fungi: 4,
      organic_matter: 5,
      meat: 8,
      insects: 2,
    } as Record<FoodType, number>,
  },
  health: {
    maxHearts: 3,
    collisionDamage: 1,
    collisionDamageCooldownSeconds: 2,
    recoveryDurationSeconds: 5,
    damageFlashDurationSeconds: 0.4,
    safeFoodTypes: ['fungi', 'organic_matter', 'insects'] as FoodType[],
    dangerousFoodDamageByType: {
      meat: 1,
    } as Partial<Record<FoodType, number>>,
    speedMultiplierByHealth: {
      3: 1,
      2: 0.75,
      1: 0.5,
      0: 0,
    } as Record<number, number>,
  },
} as const
