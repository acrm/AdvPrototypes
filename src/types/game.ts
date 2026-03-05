// Game types and interfaces

export interface Vector2 {
  x: number
  y: number
}

export type ObjectType = 'creature' | 'obstacle' | 'item' | 'artifact' | 'food' | 'spawn_zone'

export type CreatureState = 'sleeping' | 'idle' | 'patrol'

export type FoodType = 'fungi' | 'organic_matter' | 'meat' | 'insects'

export interface GameObject {
  id: string
  type: ObjectType
  position: Vector2
  width: number
  height: number
  color: string
  name: string
  description: string
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
  foodType: FoodType
  spawnInterval: number // seconds between spawns
  lastSpawnTime: number // when last food spawned
  maxFood: number // max simultaneous food items
  currentFood: number // current food count
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
