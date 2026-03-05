import { GameMap, Creature } from '../types/game'
import { GRID_SIZE, snapToGrid } from './Pathfinding'

// Helper to generate random waypoints for creature movement
function generateRandomWaypoints(mapWidth: number, mapHeight: number, count: number = 3) {
  const waypoints = []
  for (let i = 0; i < count; i++) {
    // Snap waypoints to grid centers
    const rawPos = {
      x: Math.random() * (mapWidth - 200) + 100,
      y: Math.random() * (mapHeight - 200) + 100,
    }
    waypoints.push(snapToGrid(rawPos))
  }
  return waypoints
}

export function initializeMap(): GameMap {
  const map: GameMap = {
    width: 1200,
    height: 800,
    objects: [],
    creatures: [],
    items: [],
    artifact: {
      id: 'artifact_main',
      type: 'artifact',
      position: snapToGrid({ x: 1050, y: 350 }),
      width: 20,
      height: 20,
      color: '#FFD700',
      name: 'Ancient Artifact',
      description: 'A glowing golden relic. This is your objective.',
    },
  }

  // Create dungeon walls and corridors
  // Outer walls
  const wallColor = '#4A3F35'
  
  // Top wall
  for (let x = 0; x < map.width; x += GRID_SIZE) {
    map.objects.push({
      id: `wall_top_${x}`,
      type: 'obstacle',
      position: { x, y: 0 },
      width: GRID_SIZE,
      height: GRID_SIZE,
      color: wallColor,
      name: 'Stone Wall',
      description: 'Solid dungeon wall made of ancient stone.',
    })
  }
  
  // Bottom wall
  for (let x = 0; x < map.width; x += GRID_SIZE) {
    map.objects.push({
      id: `wall_bottom_${x}`,
      type: 'obstacle',
      position: { x, y: map.height - GRID_SIZE },
      width: GRID_SIZE,
      height: GRID_SIZE,
      color: wallColor,
      name: 'Stone Wall',
      description: 'Solid dungeon wall made of ancient stone.',
    })
  }
  
  // Left wall
  for (let y = 0; y < map.height; y += GRID_SIZE) {
    map.objects.push({
      id: `wall_left_${y}`,
      type: 'obstacle',
      position: { x: 0, y },
      width: GRID_SIZE,
      height: GRID_SIZE,
      color: wallColor,
      name: 'Stone Wall',
      description: 'Solid dungeon wall made of ancient stone.',
    })
  }
  
  // Right wall
  for (let y = 0; y < map.height; y += GRID_SIZE) {
    map.objects.push({
      id: `wall_right_${y}`,
      type: 'obstacle',
      position: { x: map.width - GRID_SIZE, y },
      width: GRID_SIZE,
      height: GRID_SIZE,
      color: wallColor,
      name: 'Stone Wall',
      description: 'Solid dungeon wall made of ancient stone.',
    })
  }

  // Interior walls creating rooms and corridors
  // Horizontal wall sections
  const horizontalWalls = [
    { startX: 200, endX: 500, y: 200 },
    { startX: 600, endX: 900, y: 200 },
    { startX: 200, endX: 400, y: 400 },
    { startX: 700, endX: 1050, y: 450 },
    { startX: 300, endX: 600, y: 600 },
  ]
  
  for (const wall of horizontalWalls) {
    for (let x = wall.startX; x <= wall.endX; x += GRID_SIZE) {
      map.objects.push({
        id: `wall_h_${x}_${wall.y}`,
        type: 'obstacle',
        position: { x, y: wall.y },
        width: GRID_SIZE,
        height: GRID_SIZE,
        color: wallColor,
        name: 'Stone Wall',
        description: 'Solid dungeon wall made of ancient stone.',
      })
    }
  }
  
  // Vertical wall sections
  const verticalWalls = [
    { x: 300, startY: 100, endY: 350 },
    { x: 550, startY: 250, endY: 550 },
    { x: 800, startY: 100, endY: 350 },
    { x: 950, startY: 300, endY: 550 },
  ]
  
  for (const wall of verticalWalls) {
    for (let y = wall.startY; y <= wall.endY; y += GRID_SIZE) {
      map.objects.push({
        id: `wall_v_${wall.x}_${y}`,
        type: 'obstacle',
        position: { x: wall.x, y },
        width: GRID_SIZE,
        height: GRID_SIZE,
        color: wallColor,
        name: 'Stone Wall',
        description: 'Solid dungeon wall made of ancient stone.',
      })
    }
  }

  // Additional features (fungal patches, water pools)
  map.objects.push(
    {
      id: 'fungal_patch',
      type: 'obstacle',
      position: { x: 450, y: 100 },
      width: GRID_SIZE * 2,
      height: GRID_SIZE * 2,
      color: '#654321',
      name: 'Fungal Growth',
      description: 'Thick bioluminescent fungi. Best not to disturb it.',
    },
    {
      id: 'water_pool',
      type: 'obstacle',
      position: { x: 650, y: 350 },
      width: GRID_SIZE * 3,
      height: GRID_SIZE * 2,
      color: '#1a3a52',
      name: 'Underground Pool',
      description: 'Dark, still water. Depth unknown.',
    }
  )

  // Create passive creatures (various types)
  const creaturesBase = [
    {
      id: 'rat_1',
      type: 'creature' as const,
      position: snapToGrid({ x: 150, y: 300 }),
      width: 15,
      height: 15,
      color: '#8B7355',
      name: 'Giant Rat',
      description: 'A large rodent, the size of a cat. Nocturnal scavenger.',
      behavior: 'Forages at night, hides during day',
      diet: 'Organic matter, fungi',
      threat: 'Low (unless in swarms)',
    },
    {
      id: 'rat_2',
      type: 'creature' as const,
      position: snapToGrid({ x: 400, y: 500 }),
      width: 15,
      height: 15,
      color: '#8B7355',
      name: 'Giant Rat',
      description: 'A large rodent, the size of a cat. Nocturnal scavenger.',
      behavior: 'Forages at night, hides during day',
      diet: 'Organic matter, fungi',
      threat: 'Low (unless in swarms)',
    },
    {
      id: 'spider_1',
      type: 'creature' as const,
      position: snapToGrid({ x: 500, y: 350 }),
      width: 20,
      height: 20,
      color: '#2F4F4F',
      name: 'Giant Spider',
      description: 'Massive arachnid with glistening fangs. Territorial and aggressive.',
      behavior: 'Hunts from webs, very territorial',
      diet: 'Flying insects, small creatures',
      threat: 'Medium (webbing can immobilize)',
    },
    {
      id: 'blind_fish',
      type: 'creature' as const,
      position: snapToGrid({ x: 650, y: 250 }),
      width: 12,
      height: 12,
      color: '#E0FFFF',
      name: 'Blind Cave Fish',
      description: 'Pale, sightless fish with no eyes. Harmless and passive.',
      behavior: 'Swims slowly, avoids disturbances',
      diet: 'Small algae and organisms',
      threat: 'None',
    },
    {
      id: 'salamander_1',
      type: 'creature' as const,
      position: snapToGrid({ x: 850, y: 150 }),
      width: 14,
      height: 14,
      color: '#F5F5DC',
      name: 'Blind White Salamander',
      description: 'A translucent amphibian that burrows in damp soil.',
      behavior: 'Solitary, mostly burrowed',
      diet: 'Grubs and insects',
      threat: 'None',
    },
    {
      id: 'goblin_scout',
      type: 'creature' as const,
      position: snapToGrid({ x: 450, y: 650 }),
      width: 18,
      height: 18,
      color: '#228B22',
      name: 'Goblin Scout',
      description: 'A small humanoid with greenish skin. Intelligent and organized.',
      behavior: 'Patrols territory during daylight',
      diet: 'Omnivorous, prefers meat',
      threat: 'Medium (organized, uses tools/traps)',
    },
    {
      id: 'goblin_scout_2',
      type: 'creature' as const,
      position: snapToGrid({ x: 200, y: 650 }),
      width: 18,
      height: 18,
      color: '#228B22',
      name: 'Goblin Scout',
      description: 'A small humanoid with greenish skin. Intelligent and organized.',
      behavior: 'Patrols territory during daylight',
      diet: 'Omnivorous, prefers meat',
      threat: 'Medium (organized, uses tools/traps)',
    },
    {
      id: 'myconid_unit',
      type: 'creature' as const,
      position: snapToGrid({ x: 1050, y: 550 }),
      width: 22,
      height: 22,
      color: '#9370DB',
      name: 'Myconid (Fungal Entity)',
      description: 'A large sentient fungal colony. Slow-moving and alien.',
      behavior: 'Deliberate, communicates via spores',
      diet: 'Decomposing organic matter',
      threat: 'Medium (spores can cause effects)',
    },
  ]

  // Add movement properties to all creatures
  const creatures: Creature[] = creaturesBase.map((creature) => ({
    ...creature,
    direction: Math.random() * Math.PI * 2, // random initial direction
    waypoints: generateRandomWaypoints(map.width, map.height, 3),
    speed: 0.3 + Math.random() * 0.7, // random speed between 0.3 and 1.0
  }))

  map.creatures = creatures

  // Create items (food, supplies) - snapped to grid
  map.items.push(
    {
      id: 'item_torch',
      type: 'item',
      position: snapToGrid({ x: 150, y: 150 }),
      width: 12,
      height: 12,
      color: '#FF8C00',
      name: 'Torch',
      description: 'A lit torch. Provides light in dark areas.',
    },
    {
      id: 'item_ration',
      type: 'item',
      position: snapToGrid({ x: 150, y: 500 }),
      width: 10,
      height: 10,
      color: '#D2691E',
      name: 'Food Ration',
      description: 'Dried meat and bread. Can sustain the party.',
    },
    {
      id: 'item_rope',
      type: 'item',
      position: snapToGrid({ x: 1100, y: 650 }),
      width: 8,
      height: 8,
      color: '#DAA520',
      name: 'Coil of Rope',
      description: 'Strong rope for climbing or other tasks.',
    }
  )

  return map
}
