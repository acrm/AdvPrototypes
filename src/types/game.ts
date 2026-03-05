// Game types and interfaces

export interface Vector2 {
  x: number
  y: number
}

export type ObjectType = 'creature' | 'obstacle' | 'item' | 'artifact'

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

export interface Creature extends GameObject {
  type: 'creature'
  behavior?: string
  diet?: string
  threat?: string
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
}

export interface GameMap {
  width: number
  height: number
  objects: GameObject[]
  creatures: Creature[]
  items: Item[]
  artifact: Artifact
}

export interface GameState {
  map: GameMap
  party: Party
  selectedObject: GameObject | null
  gameTime: number // in game time (0-1 represents a day cycle)
  isMoving: boolean
}
