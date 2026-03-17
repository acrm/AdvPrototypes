// Game types and interfaces

export interface Vector2 {
  x: number
  y: number
}

export type ObjectType = 'creature' | 'obstacle' | 'item' | 'artifact' | 'food' | 'trap' | 'spawn_zone'

export type CreatureState = 'sleeping' | 'idle' | 'patrol'

export type CreatureCondition = 'normal' | 'trapped' | 'enraged'

export type CreatureRelation = 'friendly' | 'neutral' | 'aggressive' | 'avoid'

export type CreatureAggression = 'proximity' | 'vision' | 'dual'

export type AggressionTargetType = 'player' | 'creature'

export type FoodType = 'fungi' | 'organic_matter' | 'meat' | 'insects'

export type CreatureSpecies = 'rat' | 'spider' | 'goblin' | 'myconid' | 'owl' | 'bat' | 'wolf' | 'kobold'

export type TrapState = 'portable' | 'arming' | 'armed'

export type FoodDietTarget = `food:${FoodType}`

export type CreatureDietTarget = `creature:${CreatureSpecies}`

export type DietTarget = FoodDietTarget | CreatureDietTarget | 'player'

export type ItemTemplate = 'torch' | 'food_ration' | 'treasure'

export type SpawnKind = 'creature' | 'item' | 'artifact' | 'food' | 'trap'

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
  species: CreatureSpecies
  behavior?: string
  diet?: string
  threat?: string
  direction: number // angle in radians
  waypoints: Vector2[] // random movement path
  speed: number // movement speed
  state: CreatureState // current state
  condition: CreatureCondition // trap-related status overlay
  trappedUntil: number | null // absolute game time when immobilization ends
  isFriendly: boolean // tamed by repeated priming feedings
  primingFeedings: number // successful feedings from player-primed food
  targetFoodId: string | null // food currently being tracked by this creature
  eatingUntil: number | null // absolute game time when current eating action ends
  detectionRadius: number // radius used by line-of-sight checks
  alertUntil: number | null // absolute game time when creature's ALERT state ends
  alertRadius: number // dual-radius: 0.5× chunk for immediate wake/reaction
  farBehaviorRadius: number // dual-radius: 1.5× chunk for far-behavior adjustments
  relation: CreatureRelation // player relationship: friendly/neutral/aggressive/avoid
  aggression: CreatureAggression // aggro model: proximity/vision/dual
  aggressionTargetId: string | null // tracked target id while reaction behavior is active
  aggressionTargetType: AggressionTargetType | null // tracked target type
  aggressionBoostUntil: number | null // absolute game time when sprint burst ends
  aggressionBoostCooldownUntil: number | null // absolute game time when next burst may begin
  sleepSchedule: SleepSchedule // sleep/wake pattern
  idleTurnInterval: number // seconds between idle turns (1-2s)
  nextIdleTurnAt: number // absolute game time when next idle turn happens
  carriedFood: Food | null // food being carried
  dietPriorities: DietTarget[] // ordered by preference (index 0 is highest priority)
}

export interface Food extends GameObject {
  type: 'food'
  foodType: FoodType
  nutritionValue: number
  droppedByPartyAt: number | null // when party dropped this food (if any)
  primedForCreatureId: string | null // creature id that had line-of-sight during drop
}

export interface Trap extends GameObject {
  type: 'trap'
  targetSpecies: CreatureSpecies
  triggerRadius: number
  state: TrapState
  armingStartedAt: number | null
}

export interface SpawnZone extends GameObject {
  type: 'spawn_zone'
  spawnKind: SpawnKind
  sourceSymbol: string
  creatureSpecies?: CreatureSpecies
  itemTemplate?: ItemTemplate
  foodType?: FoodType
  trapTargetSpecies?: CreatureSpecies
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

export interface ExtractionZone {
  position: Vector2
  width: number
  height: number
}

export interface Party {
  position: Vector2
  members: string[]
  path: Vector2[]
  targetPosition: Vector2 | null
  observedCreatures: Map<string, number> // id -> times observed
  direction: number // angle in radians
  carriedItem: Food | Item | Trap | Artifact | null // what party is carrying
  health: number // 0-3 hearts
  lastDamageAt: number | null // absolute game time of latest received damage
  recoveringUntil: number | null // recovery lock after eating
  damageFlashUntil: number | null // absolute game time when red flash visual ends
  lastDamageTaken: number // amount of damage in last hit (for floating number display)
}

export interface GameMap {
  width: number
  height: number
  layoutCellSize: number
  objects: GameObject[]
  creatures: Creature[]
  items: Item[]
  food: Food[]
  traps: Trap[]
  spawnZones: SpawnZone[]
  artifact: Artifact
  extractionZone: ExtractionZone
}

export interface GameState {
  map: GameMap
  party: Party
  selectedObject: GameObject | null
  gameTime: number // in seconds (0-240 represents full cycle)
  cycleTime: number // 0-240 current time in cycle
  isMoving: boolean
}
