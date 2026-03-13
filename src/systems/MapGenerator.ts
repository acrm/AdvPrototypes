import {
  Artifact,
  Creature,
  CreatureSpecies,
  Food,
  GameMap,
  Item,
  ItemTemplate,
  SleepSchedule,
  SpawnZone,
  Vector2,
} from '../types/game'
import { GAME_SETTINGS } from '../config/gameSettings'
import { GRID_SIZE, LAYOUT_REGION_SIZE } from './Pathfinding'
import { DUNGEON_LAYOUT, GRID_COLS, GRID_ROWS } from '../data/dungeonLayout'

const DEFAULT_CYCLE_TIME = GAME_SETTINGS.cycle.initialCycleTime
const ITEM_RESPAWN_COOLDOWN = GAME_SETTINGS.npc.respawnCooldownSeconds.item
const CREATURE_RESPAWN_COOLDOWN = GAME_SETTINGS.npc.respawnCooldownSeconds.creature

// Helper to convert layout coordinates to world position (center of large 3x3 region)
function layoutToWorld(layoutX: number, layoutY: number): Vector2 {
  return {
    x: layoutX * LAYOUT_REGION_SIZE + LAYOUT_REGION_SIZE / 2,
    y: layoutY * LAYOUT_REGION_SIZE + LAYOUT_REGION_SIZE / 2,
  }
}

function getRandomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function getRandomDirection(): number {
  return Math.random() * Math.PI * 2
}

function getZoneCandidatePositions(zone: SpawnZone): Vector2[] {
  const left = zone.position.x - zone.width / 2
  const top = zone.position.y - zone.height / 2
  const positions: Vector2[] = []

  for (let row = 0; row < GAME_SETTINGS.world.layoutRegionScale; row++) {
    for (let col = 0; col < GAME_SETTINGS.world.layoutRegionScale; col++) {
      positions.push({
        x: left + GRID_SIZE / 2 + col * GRID_SIZE,
        y: top + GRID_SIZE / 2 + row * GRID_SIZE,
      })
    }
  }

  return positions
}

function getRandomPositionInZone(zone: SpawnZone): Vector2 {
  const candidates = getZoneCandidatePositions(zone)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// Helper to generate sleep schedule for creature
function generateSleepSchedule(isNocturnal: boolean = false): SleepSchedule {
  const sleepConfig = isNocturnal
    ? GAME_SETTINGS.npc.sleepSchedule.nocturnal
    : GAME_SETTINGS.npc.sleepSchedule.diurnal

  if (isNocturnal) {
    return {
      sleepStart: getRandomFloat(sleepConfig.startRange[0], sleepConfig.startRange[1]),
      sleepEnd: getRandomFloat(sleepConfig.endRange[0], sleepConfig.endRange[1]),
      variation: getRandomFloat(sleepConfig.variationRange[0], sleepConfig.variationRange[1]),
    }
  }

  return {
    sleepStart: getRandomFloat(sleepConfig.startRange[0], sleepConfig.startRange[1]),
    sleepEnd: getRandomFloat(sleepConfig.endRange[0], sleepConfig.endRange[1]),
    variation: getRandomFloat(sleepConfig.variationRange[0], sleepConfig.variationRange[1]),
  }
}

function isSleeping(schedule: SleepSchedule, cycleTime: number): boolean {
  const { sleepStart, sleepEnd } = schedule
  if (sleepStart < sleepEnd) {
    return cycleTime >= sleepStart && cycleTime <= sleepEnd
  }

  return cycleTime >= sleepStart || cycleTime <= sleepEnd
}

function createIdleTurnTiming(startGameTime: number = 0): { idleTurnInterval: number; nextIdleTurnAt: number } {
  const [minSeconds, maxSeconds] = GAME_SETTINGS.npc.idleTurnIntervalRange
  const idleTurnInterval = getRandomFloat(minSeconds, maxSeconds)
  return {
    idleTurnInterval,
    nextIdleTurnAt: startGameTime + idleTurnInterval,
  }
}

type CreatureTemplate = {
  species: CreatureSpecies
  color: string
  width: number
  height: number
  name: string
  description: string
  behavior: string
  diet: string
  threat: string
  speedRange: readonly [number, number]
  isNocturnal: boolean
  preferredFoodTypes: Creature['preferredFoodTypes']
}

const CREATURE_TEMPLATES: Record<CreatureSpecies, CreatureTemplate> = {
  rat: {
    species: 'rat',
    color: '#8B7355',
    width: 15,
    height: 15,
    name: 'Giant Rat',
    description: 'A large rodent, the size of a cat. Nocturnal scavenger.',
    behavior: 'Forages at night, hides during day',
    diet: 'Organic matter, fungi',
    threat: 'Low (unless in swarms)',
    speedRange: GAME_SETTINGS.npc.speedRanges.rat,
    isNocturnal: true,
    preferredFoodTypes: ['fungi', 'organic_matter'],
  },
  spider: {
    species: 'spider',
    color: '#2F4F4F',
    width: 20,
    height: 20,
    name: 'Giant Spider',
    description: 'Massive arachnid with glistening fangs. Territorial and aggressive.',
    behavior: 'Hunts from webs, very territorial',
    diet: 'Flying insects, small creatures',
    threat: 'Medium (webbing can immobilize)',
    speedRange: GAME_SETTINGS.npc.speedRanges.spider,
    isNocturnal: false,
    preferredFoodTypes: ['insects', 'meat'],
  },
  goblin: {
    species: 'goblin',
    color: '#228B22',
    width: 18,
    height: 18,
    name: 'Goblin Scout',
    description: 'A small humanoid with greenish skin. Intelligent and organized.',
    behavior: 'Patrols territory during daylight',
    diet: 'Omnivorous, prefers meat',
    threat: 'Medium (organized, uses tools/traps)',
    speedRange: GAME_SETTINGS.npc.speedRanges.goblin,
    isNocturnal: false,
    preferredFoodTypes: ['meat', 'organic_matter'],
  },
  myconid: {
    species: 'myconid',
    color: '#9370DB',
    width: 22,
    height: 22,
    name: 'Myconid (Fungal Entity)',
    description: 'A large sentient fungal colony. Slow-moving and alien.',
    behavior: 'Deliberate, communicates via spores',
    diet: 'Decomposing organic matter',
    threat: 'Medium (spores can cause effects)',
    speedRange: GAME_SETTINGS.npc.speedRanges.myconid,
    isNocturnal: false,
    preferredFoodTypes: ['organic_matter', 'fungi'],
  },
  owl: {
    species: 'owl',
    color: '#D3D3D3',
    width: 16,
    height: 16,
    name: 'Cave Owl',
    description: 'A large nocturnal bird. Silent hunter with excellent vision.',
    behavior: 'Roosts during day, hunts at night',
    diet: 'Small rodents, insects',
    threat: 'Low (avoids humanoids)',
    speedRange: GAME_SETTINGS.npc.speedRanges.owl,
    isNocturnal: true,
    preferredFoodTypes: ['meat', 'insects'],
  },
  bat: {
    species: 'bat',
    color: '#1C1C1C',
    width: 12,
    height: 12,
    name: 'Giant Bat',
    description: 'Large flying mammal with echolocation. Lives in colonies.',
    behavior: 'Sleeps hanging from ceiling, flies erratically',
    diet: 'Insects, small creatures',
    threat: 'Low (startles easily)',
    speedRange: GAME_SETTINGS.npc.speedRanges.bat,
    isNocturnal: true,
    preferredFoodTypes: ['insects'],
  },
  wolf: {
    species: 'wolf',
    color: '#708090',
    width: 20,
    height: 20,
    name: 'Dire Wolf',
    description: 'Large predatory canine. Hunts in packs.',
    behavior: 'Pack hunter, territorial',
    diet: 'Large prey, carrion',
    threat: 'High (aggressive when threatened)',
    speedRange: GAME_SETTINGS.npc.speedRanges.wolf,
    isNocturnal: false,
    preferredFoodTypes: ['meat'],
  },
  kobold: {
    species: 'kobold',
    color: '#FF8C00',
    width: 16,
    height: 16,
    name: 'Kobold',
    description: 'Small reptilian humanoid. Cunning trap-makers.',
    behavior: 'Uses traps and ambushes, avoids direct combat',
    diet: 'Omnivorous scavenger',
    threat: 'Medium (traps and numbers)',
    speedRange: GAME_SETTINGS.npc.speedRanges.kobold,
    isNocturnal: false,
    preferredFoodTypes: ['meat', 'organic_matter', 'insects'],
  },
}

function createCreatureFromZone(zone: SpawnZone, cycleTime: number, gameTime: number = 0): Creature {
  if (!zone.creatureSpecies) {
    throw new Error(`Spawn zone ${zone.id} does not define a creature species.`)
  }

  const template = CREATURE_TEMPLATES[zone.creatureSpecies]
  const position = getRandomPositionInZone(zone)
  const sleepSchedule = generateSleepSchedule(template.isNocturnal)
  const nextSpawnCount = zone.spawnCount + 1
  const speed = getRandomFloat(template.speedRange[0], template.speedRange[1])
  const state = isSleeping(sleepSchedule, cycleTime) ? 'sleeping' : 'idle'

  return {
    id: `${zone.id}_spawn_${nextSpawnCount}`,
    type: 'creature',
    position,
    width: template.width,
    height: template.height,
    color: template.color,
    name: template.name,
    description: template.description,
    behavior: template.behavior,
    diet: template.diet,
    threat: template.threat,
    direction: getRandomDirection(),
    waypoints: [],
    speed,
    state,
    sleepSchedule,
    ...createIdleTurnTiming(gameTime),
    carriedFood: null,
    preferredFoodTypes: template.preferredFoodTypes,
    sourceSpawnZoneId: zone.id,
  }
}

function createItemFromZone(zone: SpawnZone): Item {
  if (!zone.itemTemplate) {
    throw new Error(`Spawn zone ${zone.id} does not define an item template.`)
  }

  const position = getRandomPositionInZone(zone)
  const nextSpawnCount = zone.spawnCount + 1

  switch (zone.itemTemplate) {
    case 'torch':
      return {
        id: `${zone.id}_spawn_${nextSpawnCount}`,
        type: 'item',
        position,
        width: 10,
        height: 10,
        color: '#FF8C00',
        name: 'Torch',
        description: 'A lit torch for light.',
        sourceSpawnZoneId: zone.id,
      }
    case 'food_ration':
      return {
        id: `${zone.id}_spawn_${nextSpawnCount}`,
        type: 'item',
        position,
        width: 10,
        height: 10,
        color: '#C9A66B',
        name: 'Food Ration',
        description: 'Dried provisions packed for travel.',
        sourceSpawnZoneId: zone.id,
      }
    default:
      return {
        id: `${zone.id}_spawn_${nextSpawnCount}`,
        type: 'item',
        position,
        width: 10,
        height: 10,
        color: '#B8860B',
        name: 'Treasure',
        description: 'A small treasure left behind in the dungeon.',
        sourceSpawnZoneId: zone.id,
      }
  }
}

function createArtifactFromZone(zone: SpawnZone): Artifact {
  const position = getRandomPositionInZone(zone)
  const nextSpawnCount = zone.spawnCount + 1

  return {
    id: `${zone.id}_spawn_${nextSpawnCount}`,
    type: 'artifact',
    position,
    width: 20,
    height: 20,
    color: '#FFD700',
    name: 'Ancient Artifact',
    description: 'A glowing golden relic. This is your objective.',
    sourceSpawnZoneId: zone.id,
  }
}

function applyInitialSpawnToZone(map: GameMap, zone: SpawnZone, cycleTime: number): SpawnZone {
  if (zone.spawnKind === 'creature') {
    const creature = createCreatureFromZone(zone, cycleTime, 0)
    map.creatures.push(creature)
    return {
      ...zone,
      activeEntityId: creature.id,
      spawnCount: zone.spawnCount + 1,
    }
  }

  if (zone.spawnKind === 'item') {
    const item = createItemFromZone(zone)
    map.items.push(item)
    return {
      ...zone,
      activeEntityId: item.id,
      spawnCount: zone.spawnCount + 1,
    }
  }

  const artifact = createArtifactFromZone(zone)
  map.artifact = artifact
  return {
    ...zone,
    activeEntityId: artifact.id,
    spawnCount: zone.spawnCount + 1,
  }
}

function createSpawnZoneBase(
  id: string,
  position: Vector2,
  sourceSymbol: string,
  spawnKind: SpawnZone['spawnKind'],
  overrides: Partial<SpawnZone>
): SpawnZone {
  return {
    id,
    type: 'spawn_zone',
    position,
    width: LAYOUT_REGION_SIZE,
    height: LAYOUT_REGION_SIZE,
    color: 'rgba(120, 180, 120, 0.12)',
    name: `Spawn Zone ${sourceSymbol.toUpperCase()}`,
    description: `A large dungeon region that spawns ${sourceSymbol}.`,
    spawnKind,
    sourceSymbol,
    respawnCooldown: 0,
    respawnStartedAt: null,
    activeEntityId: null,
    spawnCount: 0,
    ...overrides,
  }
}

function getItemTemplateForIndex(index: number): ItemTemplate {
  if (index === 1) return 'torch'
  if (index === 2) return 'food_ration'
  return 'treasure'
}

function getCreatureSpeciesFromSymbol(symbol: string): CreatureSpecies | null {
  switch (symbol) {
    case 'r':
      return 'rat'
    case 's':
      return 'spider'
    case 'g':
      return 'goblin'
    case 'm':
      return 'myconid'
    case 'o':
      return 'owl'
    case 'b':
      return 'bat'
    case 'w':
      return 'wolf'
    case 'k':
      return 'kobold'
    default:
      return null
  }
}

export function initializeMap(): { map: GameMap; partyStartPosition: Vector2 } {
  const map: GameMap = {
    width: GRID_COLS * LAYOUT_REGION_SIZE,
    height: GRID_ROWS * LAYOUT_REGION_SIZE,
    layoutCellSize: LAYOUT_REGION_SIZE,
    objects: [],
    creatures: [],
    items: [],
    food: [],
    spawnZones: [],
    artifact: {
      id: 'artifact_placeholder',
      type: 'artifact',
      position: { x: -9999, y: -9999 },
      width: 20,
      height: 20,
      color: '#FFD700',
      name: 'Ancient Artifact',
      description: 'A glowing golden relic. This is your objective.',
      sourceSpawnZoneId: null,
    },
  }

  let partyStartPosition: Vector2 = layoutToWorld(2, 2)
  const wallColor = '#4A3F35'
  const lines = DUNGEON_LAYOUT.split('\n').filter((line) => line.length > 0)

  let itemZoneCount = 0
  let artifactZoneCount = 0
  let spawnZoneSequence = 0

  for (let row = 0; row < lines.length; row++) {
    const line = lines[row]
    for (let col = 0; col < line.length; col++) {
      const symbol = line[col]
      const position = layoutToWorld(col, row)

      if (symbol === '#') {
        map.objects.push({
          id: `wall_${col}_${row}`,
          type: 'obstacle',
          position,
          width: LAYOUT_REGION_SIZE,
          height: LAYOUT_REGION_SIZE,
          color: wallColor,
          name: 'Stone Wall',
          description: 'Solid dungeon wall made of ancient stone.',
          sourceSpawnZoneId: null,
        })
        continue
      }

      if (symbol === 'P') {
        partyStartPosition = position
        continue
      }

      const creatureSpecies = getCreatureSpeciesFromSymbol(symbol)
      if (creatureSpecies) {
        spawnZoneSequence++
        const zone = createSpawnZoneBase(
          `spawn_zone_${spawnZoneSequence}`,
          position,
          symbol,
          'creature',
          {
            creatureSpecies,
            name: `${CREATURE_TEMPLATES[creatureSpecies].name} Territory`,
            description: `A wide spawn region for ${CREATURE_TEMPLATES[creatureSpecies].name}.`,
            respawnCooldown: CREATURE_RESPAWN_COOLDOWN,
          }
        )
        map.spawnZones.push(applyInitialSpawnToZone(map, zone, DEFAULT_CYCLE_TIME))
        continue
      }

      if (symbol === '.') {
        itemZoneCount++
        spawnZoneSequence++
        const itemTemplate = getItemTemplateForIndex(itemZoneCount)
        const zone = createSpawnZoneBase(
          `spawn_zone_${spawnZoneSequence}`,
          position,
          symbol,
          'item',
          {
            itemTemplate,
            name: 'Item Cache',
            description: 'A broad region where a small item can appear again after a cooldown.',
            respawnCooldown: ITEM_RESPAWN_COOLDOWN,
          }
        )
        map.spawnZones.push(applyInitialSpawnToZone(map, zone, DEFAULT_CYCLE_TIME))
        continue
      }

      if (symbol === '*') {
        artifactZoneCount++
        spawnZoneSequence++
        const zone = createSpawnZoneBase(
          `spawn_zone_${spawnZoneSequence}`,
          position,
          symbol,
          'artifact',
          {
            name: `Artifact Chamber ${artifactZoneCount}`,
            description: 'A large chamber where the artifact first appears.',
            respawnCooldown: 0,
          }
        )
        map.spawnZones.push(applyInitialSpawnToZone(map, zone, DEFAULT_CYCLE_TIME))
      }
    }
  }

  return { map, partyStartPosition }
}

export function refreshSpawnZones(
  map: GameMap,
  gameTime: number,
  cycleTime: number,
  carriedItem: Item | Food | null
): GameMap {
  const presentIds = new Set<string>()

  for (const creature of map.creatures) {
    presentIds.add(creature.id)
  }
  for (const item of map.items) {
    presentIds.add(item.id)
  }
  for (const food of map.food) {
    presentIds.add(food.id)
  }
  if (carriedItem) {
    presentIds.add(carriedItem.id)
  }
  if (map.artifact.position.x >= 0 && map.artifact.position.y >= 0) {
    presentIds.add(map.artifact.id)
  }

  const nextMap: GameMap = {
    ...map,
    creatures: [...map.creatures],
    items: [...map.items],
    food: [...map.food],
    spawnZones: map.spawnZones.map((zone) => ({ ...zone })),
    artifact: { ...map.artifact },
  }

  nextMap.spawnZones = nextMap.spawnZones.map((zone) => {
    const zoneCopy = { ...zone }
    const isEntityPresent = zoneCopy.activeEntityId !== null && presentIds.has(zoneCopy.activeEntityId)

    if (isEntityPresent) {
      zoneCopy.respawnStartedAt = null
      return zoneCopy
    }

    if (zoneCopy.respawnCooldown <= 0) {
      zoneCopy.respawnStartedAt = null
      return zoneCopy
    }

    if (zoneCopy.respawnStartedAt === null) {
      zoneCopy.respawnStartedAt = gameTime
      return zoneCopy
    }

    if (gameTime - zoneCopy.respawnStartedAt < zoneCopy.respawnCooldown) {
      return zoneCopy
    }

    if (zoneCopy.spawnKind === 'creature') {
      const creature = createCreatureFromZone(zoneCopy, cycleTime, gameTime)
      nextMap.creatures.push(creature)
      zoneCopy.activeEntityId = creature.id
      zoneCopy.spawnCount += 1
      zoneCopy.respawnStartedAt = null
      return zoneCopy
    }

    if (zoneCopy.spawnKind === 'item') {
      const item = createItemFromZone(zoneCopy)
      nextMap.items.push(item)
      zoneCopy.activeEntityId = item.id
      zoneCopy.spawnCount += 1
      zoneCopy.respawnStartedAt = null
      return zoneCopy
    }

    return zoneCopy
  })

  return nextMap
}

export { isSleeping }
