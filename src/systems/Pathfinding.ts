// Simple A* pathfinding for dungeon navigation
import { Vector2, GameObject } from '../types/game'

export const GRID_SIZE = 50 // Grid cell size in pixels

// Helper to snap position to grid center
export function snapToGrid(pos: Vector2): Vector2 {
  return {
    x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
  }
}

// Helper to get grid coordinates
export function toGridCoords(pos: Vector2): { x: number; y: number } {
  return {
    x: Math.floor(pos.x / GRID_SIZE),
    y: Math.floor(pos.y / GRID_SIZE),
  }
}

// Helper to get world position from grid coords
export function toWorldCoords(gridX: number, gridY: number): Vector2 {
  return {
    x: gridX * GRID_SIZE,
    y: gridY * GRID_SIZE,
  }
}

interface GridNode {
  x: number
  y: number
  g: number // cost from start
  h: number // heuristic to goal
  f: number // g + h
  parent: GridNode | null
  walkable: boolean
}

// Build a walkable grid for the entire map
export function buildWalkableGrid(
  obstacles: GameObject[],
  mapWidth: number,
  mapHeight: number
): boolean[][] {
  const gridWidth = Math.ceil(mapWidth / GRID_SIZE)
  const gridHeight = Math.ceil(mapHeight / GRID_SIZE)
  
  // Initialize all cells as walkable
  const walkable: boolean[][] = []
  for (let y = 0; y < gridHeight; y++) {
    walkable[y] = []
    for (let x = 0; x < gridWidth; x++) {
      walkable[y][x] = true
    }
  }
  
  // Mark obstacle cells as unwalkable
  for (const obstacle of obstacles) {
    const minX = Math.floor((obstacle.position.x - obstacle.width / 2) / GRID_SIZE)
    const maxX = Math.ceil((obstacle.position.x + obstacle.width / 2) / GRID_SIZE)
    const minY = Math.floor((obstacle.position.y - obstacle.height / 2) / GRID_SIZE)
    const maxY = Math.ceil((obstacle.position.y + obstacle.height / 2) / GRID_SIZE)

    for (let y = Math.max(0, minY); y < Math.min(gridHeight, maxY); y++) {
      for (let x = Math.max(0, minX); x < Math.min(gridWidth, maxX); x++) {
        walkable[y][x] = false
      }
    }
  }
  
  return walkable
}

// Check if a position is walkable
export function isPositionWalkable(
  position: Vector2,
  obstacles: GameObject[]
): boolean {
  const gridX = Math.floor(position.x / GRID_SIZE)
  const gridY = Math.floor(position.y / GRID_SIZE)
  
  for (const obstacle of obstacles) {
    const minX = Math.floor((obstacle.position.x - obstacle.width / 2) / GRID_SIZE)
    const maxX = Math.ceil((obstacle.position.x + obstacle.width / 2) / GRID_SIZE)
    const minY = Math.floor((obstacle.position.y - obstacle.height / 2) / GRID_SIZE)
    const maxY = Math.ceil((obstacle.position.y + obstacle.height / 2) / GRID_SIZE)
    
    if (gridX >= minX && gridX < maxX && gridY >= minY && gridY < maxY) {
      return false
    }
  }
  
  return true
}

// Get a random walkable position on the map
export function getRandomWalkablePosition(
  obstacles: GameObject[],
  mapWidth: number,
  mapHeight: number
): Vector2 {
  const walkableGrid = buildWalkableGrid(obstacles, mapWidth, mapHeight)
  const gridWidth = walkableGrid[0].length
  const gridHeight = walkableGrid.length
  
  // Collect all walkable cells
  const walkableCells: { x: number; y: number }[] = []
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (walkableGrid[y][x]) {
        walkableCells.push({ x, y })
      }
    }
  }
  
  // Pick a random walkable cell
  if (walkableCells.length === 0) {
    // Fallback if no walkable cells (shouldn't happen)
    return { x: GRID_SIZE / 2, y: GRID_SIZE / 2 }
  }
  
  const randomCell = walkableCells[Math.floor(Math.random() * walkableCells.length)]
  
  // Return center of cell
  return {
    x: randomCell.x * GRID_SIZE + GRID_SIZE / 2,
    y: randomCell.y * GRID_SIZE + GRID_SIZE / 2,
  }
}

export function findPathWithObstacles(
  start: Vector2,
  goal: Vector2,
  obstacles: GameObject[],
  mapWidth: number,
  mapHeight: number
): Vector2[] {
  const gridWidth = Math.ceil(mapWidth / GRID_SIZE)
  const gridHeight = Math.ceil(mapHeight / GRID_SIZE)

  // Create grid
  const grid: GridNode[][] = []
  for (let y = 0; y < gridHeight; y++) {
    grid[y] = []
    for (let x = 0; x < gridWidth; x++) {
      grid[y][x] = {
        x,
        y,
        g: 0,
        h: 0,
        f: 0,
        parent: null,
        walkable: true,
      }
    }
  }

  // Mark obstacle cells as unwalkable
  for (const obstacle of obstacles) {
    const minX = Math.floor((obstacle.position.x - obstacle.width / 2) / GRID_SIZE)
    const maxX = Math.ceil((obstacle.position.x + obstacle.width / 2) / GRID_SIZE)
    const minY = Math.floor((obstacle.position.y - obstacle.height / 2) / GRID_SIZE)
    const maxY = Math.ceil((obstacle.position.y + obstacle.height / 2) / GRID_SIZE)

    for (let y = Math.max(0, minY); y < Math.min(gridHeight, maxY); y++) {
      for (let x = Math.max(0, minX); x < Math.min(gridWidth, maxX); x++) {
        grid[y][x].walkable = false
      }
    }
  }

  // Convert world coordinates to grid coordinates
  const startNode = grid[Math.floor(start.y / GRID_SIZE)][Math.floor(start.x / GRID_SIZE)]
  const goalNode = grid[Math.floor(goal.y / GRID_SIZE)][Math.floor(goal.x / GRID_SIZE)]

  // If start or goal is unwalkable, return empty path (no path possible)
  if (!startNode.walkable || !goalNode.walkable) {
    return []
  }

  // A* algorithm
  const openList: GridNode[] = [startNode]
  const closedList: Set<GridNode> = new Set()

  startNode.g = 0
  startNode.h = heuristic(startNode, goalNode)
  startNode.f = startNode.h

  while (openList.length > 0) {
    // Find node with lowest f score
    let currentNode = openList[0]
    let currentIndex = 0
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < currentNode.f) {
        currentNode = openList[i]
        currentIndex = i
      }
    }

    // Remove current from open list
    openList.splice(currentIndex, 1)
    closedList.add(currentNode)

    // Found the goal
    if (currentNode === goalNode) {
      return reconstructPath(currentNode, goal)
    }

    // Check neighbors
    const neighbors = getNeighbors(currentNode, grid, gridWidth, gridHeight)
    for (const neighbor of neighbors) {
      if (!neighbor.walkable || closedList.has(neighbor)) {
        continue
      }

      // Calculate cost (diagonal = ~1.414, straight = 1)
      const dx = Math.abs(neighbor.x - currentNode.x)
      const dy = Math.abs(neighbor.y - currentNode.y)
      const moveCost = dx === 1 && dy === 1 ? 1.414 : 1
      const tentativeG = currentNode.g + moveCost

      if (!openList.includes(neighbor)) {
        openList.push(neighbor)
      } else if (tentativeG >= neighbor.g) {
        continue
      }

      neighbor.parent = currentNode
      neighbor.g = tentativeG
      neighbor.h = heuristic(neighbor, goalNode)
      neighbor.f = neighbor.g + neighbor.h
    }
  }

  // No path found, return empty path
  return []
}

function heuristic(a: GridNode, b: GridNode): number {
  // Manhattan distance
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function getNeighbors(
  node: GridNode,
  grid: GridNode[][],
  gridWidth: number,
  gridHeight: number
): GridNode[] {
  const neighbors: GridNode[] = []
  const { x, y } = node

  // 8-directional movement (including diagonals)
  const directions = [
    { dx: -1, dy: 0 },  // left
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: -1 },  // up
    { dx: 0, dy: 1 },   // down
    { dx: -1, dy: -1 }, // up-left
    { dx: 1, dy: -1 },  // up-right
    { dx: -1, dy: 1 },  // down-left
    { dx: 1, dy: 1 },   // down-right
  ]

  for (const dir of directions) {
    const nx = x + dir.dx
    const ny = y + dir.dy

    if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) {
      continue
    }

    // Prevent diagonal movement through blocked corners
    if (dir.dx !== 0 && dir.dy !== 0) {
      const horizontalNeighbor = grid[y][x + dir.dx]
      const verticalNeighbor = grid[y + dir.dy][x]
      if (!horizontalNeighbor.walkable || !verticalNeighbor.walkable) {
        continue
      }
    }

    neighbors.push(grid[ny][nx])
  }

  return neighbors
}

function reconstructPath(node: GridNode, finalGoal: Vector2): Vector2[] {
  const path: Vector2[] = []
  let current: GridNode | null = node

  while (current !== null) {
    path.unshift({
      x: current.x * GRID_SIZE + GRID_SIZE / 2,
      y: current.y * GRID_SIZE + GRID_SIZE / 2,
    })
    current = current.parent
  }

  // Replace last waypoint with actual goal
  if (path.length > 0) {
    path[path.length - 1] = finalGoal
  }

  // Simplify path by removing redundant waypoints
  return simplifyPath(path)
}

function simplifyPath(path: Vector2[]): Vector2[] {
  if (path.length <= 2) return path

  const simplified: Vector2[] = [path[0]]

  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1]
    const current = path[i]
    const next = path[i + 1]

    // Check if current point is on the line between prev and next
    const dx1 = current.x - prev.x
    const dy1 = current.y - prev.y
    const dx2 = next.x - current.x
    const dy2 = next.y - current.y

    // Cross product to check collinearity
    const cross = dx1 * dy2 - dy1 * dx2
    if (Math.abs(cross) > 1) {
      simplified.push(current)
    }
  }

  simplified.push(path[path.length - 1])
  return simplified
}
