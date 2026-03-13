// Game types and interfaces

export interface Vector2 {
  x: number
  y: number
}

export type ObjectType = 'creature' | 'obstacle' | 'item' | 'artifact' | 'food' | 'spawn_zone'

export type CreatureState = 'sleeping' | 'idle' | 'patrol'

export type FoodType = 'fungi' | 'organic_matter' | 'meat' | 'insects'

export type CreatureSpecies = 'rat' | 'spider' | 'goblin' | 'myconid' | 'owl' | 'bat' | 'wolf' | 'kobold'

export type ItemTemplate = 'torch' | 'food_ration' | 'treasure'

export type SpawnKind = 'creature' | 'item' | 'artifact'

export interface GameObject {
  id: string
  type: ObjectType
  position: Vector2
  width: number
  height: number
  color: string
  name: string
  description: string
  sourceSpawnZoneId?: string | null
}

export interface SleepSchedule {
  sleepStart: number // 0-240 cycle time when sleep starts
  sleepEnd: number // 0-240 cycle time when sleep ends
  variation: number // random variation in sleep times
}

export interface Creature extends GameObject {
  type: 'creature'
  behavior?: string
  diet?: string
  threat?: string
  direction: number // angle in radians
  waypoints: Vector2[] // random movement path
  speed: number // movement speed
  state: CreatureState // current state
  sleepSchedule: SleepSchedule // sleep/wake pattern
  idleTurnInterval: number // seconds between idle turns (1-2s)
  nextIdleTurnAt: number // absolute game time when next idle turn happens
  carriedFood: Food | null // food being carried
  preferredFoodTypes: FoodType[] // what food this creature eats
}

export interface Food extends GameObject {
  type: 'food'
  foodType: FoodType
  nutritionValue: number
}

export interface SpawnZone extends GameObject {
  type: 'spawn_zone'
  spawnKind: SpawnKind
  sourceSymbol: string
  creatureSpecies?: CreatureSpecies
  itemTemplate?: ItemTemplate
  respawnCooldown: number // seconds before zone spawns a replacement
  respawnStartedAt: number | null // when the current missing-state cooldown started
  activeEntityId: string | null // currently spawned entity linked to this zone
  spawnCount: number // monotonically increasing counter for unique respawn ids
}

export interface Obstacle extends GameObject {
  type: 'obstacle'
}

export interface Item extends GameObject {
  type: 'item'
}

export interface Artifact extends GameObject {
  type: 'artifact'
}

export interface Party {
  position: Vector2
  members: string[]
  path: Vector2[]
  targetPosition: Vector2 | null
  observedCreatures: Map<string, number> // id -> times observed
  direction: number // angle in radians
  carriedItem: Food | Item | null // what party is carrying
}

export interface GameMap {
  width: number
  height: number
  layoutCellSize: number
  objects: GameObject[]
  creatures: Creature[]
  items: Item[]
  food: Food[]
  spawnZones: SpawnZone[]
  artifact: Artifact
}

export interface GameState {
  map: GameMap
  party: Party
  selectedObject: GameObject | null
  gameTime: number // in seconds (0-240 represents full cycle)
  cycleTime: number // 0-240 current time in cycle
  isMoving: boolean
}
