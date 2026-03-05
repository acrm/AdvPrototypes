import { GameMap, Vector2 } from '../types/game'
import { GRID_SIZE } from './Pathfinding'
import { DUNGEON_LAYOUT, GRID_COLS, GRID_ROWS } from '../data/dungeonLayout'

// Helper to convert grid coordinates to world position (center of cell)
function gridToWorld(gridX: number, gridY: number): Vector2 {
  return {
    x: gridX * GRID_SIZE + GRID_SIZE / 2,
    y: gridY * GRID_SIZE + GRID_SIZE / 2,
  }
}

// Helper to generate random waypoints for creature movement
function generateRandomWaypoints(count: number = 3) {
  const waypoints = []
  for (let i = 0; i < count; i++) {
    // Generate waypoints on grid centers
    const gridX = Math.floor(Math.random() * (GRID_COLS - 2)) + 1
    const gridY = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1
    waypoints.push(gridToWorld(gridX, gridY))
  }
  return waypoints
}

export function initializeMap(): { map: GameMap; partyStartPosition: Vector2 } {
  const map: GameMap = {
    width: GRID_COLS * GRID_SIZE,
    height: GRID_ROWS * GRID_SIZE,
    objects: [],
    creatures: [],
    items: [],
    artifact: {
      id: 'artifact_main',
      type: 'artifact',
      position: { x: 0, y: 0 }, // Will be set when parsing
      width: 20,
      height: 20,
      color: '#FFD700',
      name: 'Ancient Artifact',
      description: 'A glowing golden relic. This is your objective.',
    },
  }

  let partyStartPosition: Vector2 = gridToWorld(2, 2) // default fallback
  const wallColor = '#4A3F35'

  // Parse dungeon layout
  const lines = DUNGEON_LAYOUT.split('\n').filter(line => line.length > 0) // Remove empty lines
  
  // Counters for unique IDs
  let ratCount = 0
  let spiderCount = 0
  let goblinCount = 0
  let myconidCount = 0
  let owlCount = 0
  let batCount = 0
  let wolfCount = 0
  let koboldCount = 0
  let itemCount = 0

  for (let row = 0; row < lines.length; row++) {
    const line = lines[row]
    for (let col = 0; col < line.length; col++) {
      const char = line[col]
      const position = gridToWorld(col, row)

      switch (char) {
        case '#': // Wall
          map.objects.push({
            id: `wall_${col}_${row}`,
            type: 'obstacle',
            position: gridToWorld(col, row), // Use grid center like other objects
            width: GRID_SIZE,
            height: GRID_SIZE,
            color: wallColor,
            name: 'Stone Wall',
            description: 'Solid dungeon wall made of ancient stone.',
          })
          break

        case 'P': // Party starting position
          partyStartPosition = position
          break

        case '*': // Artifact
          map.artifact.position = position
          break

        case '.': // Item
          itemCount++
          map.items.push({
            id: `item_${itemCount}`,
            type: 'item',
            position,
            width: 10,
            height: 10,
            color: '#FF8C00',
            name: itemCount === 1 ? 'Torch' : itemCount === 2 ? 'Food Ration' : 'Treasure',
            description: itemCount === 1 ? 'A lit torch for light.' : itemCount === 2 ? 'Dried provisions.' : 'A small treasure.',
          })
          break

        case 'r': // Rat
          ratCount++
          map.creatures.push({
            id: `rat_${ratCount}`,
            type: 'creature',
            position,
            width: 15,
            height: 15,
            color: '#8B7355',
            name: 'Giant Rat',
            description: 'A large rodent, the size of a cat. Nocturnal scavenger.',
            behavior: 'Forages at night, hides during day',
            diet: 'Organic matter, fungi',
            threat: 'Low (unless in swarms)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.4 + Math.random() * 0.3,
          })
          break

        case 's': // Spider
          spiderCount++
          map.creatures.push({
            id: `spider_${spiderCount}`,
            type: 'creature',
            position,
            width: 20,
            height: 20,
            color: '#2F4F4F',
            name: 'Giant Spider',
            description: 'Massive arachnid with glistening fangs. Territorial and aggressive.',
            behavior: 'Hunts from webs, very territorial',
            diet: 'Flying insects, small creatures',
            threat: 'Medium (webbing can immobilize)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.3 + Math.random() * 0.3,
          })
          break

        case 'g': // Goblin
          goblinCount++
          map.creatures.push({
            id: `goblin_${goblinCount}`,
            type: 'creature',
            position,
            width: 18,
            height: 18,
            color: '#228B22',
            name: 'Goblin Scout',
            description: 'A small humanoid with greenish skin. Intelligent and organized.',
            behavior: 'Patrols territory during daylight',
            diet: 'Omnivorous, prefers meat',
            threat: 'Medium (organized, uses tools/traps)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.5 + Math.random() * 0.3,
          })
          break

        case 'm': // Myconid
          myconidCount++
          map.creatures.push({
            id: `myconid_${myconidCount}`,
            type: 'creature',
            position,
            width: 22,
            height: 22,
            color: '#9370DB',
            name: 'Myconid (Fungal Entity)',
            description: 'A large sentient fungal colony. Slow-moving and alien.',
            behavior: 'Deliberate, communicates via spores',
            diet: 'Decomposing organic matter',
            threat: 'Medium (spores can cause effects)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.2 + Math.random() * 0.2,
          })
          break

        case 'o': // Owl
          owlCount++
          map.creatures.push({
            id: `owl_${owlCount}`,
            type: 'creature',
            position,
            width: 16,
            height: 16,
            color: '#D3D3D3',
            name: 'Cave Owl',
            description: 'A large nocturnal bird. Silent hunter with excellent vision.',
            behavior: 'Roosts during day, hunts at night',
            diet: 'Small rodents, insects',
            threat: 'Low (avoids humanoids)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.6 + Math.random() * 0.3,
          })
          break

        case 'b': // Bat
          batCount++
          map.creatures.push({
            id: `bat_${batCount}`,
            type: 'creature',
            position,
            width: 12,
            height: 12,
            color: '#1C1C1C',
            name: 'Giant Bat',
            description: 'Large flying mammal with echolocation. Lives in colonies.',
            behavior: 'Sleeps hanging from ceiling, flies erratically',
            diet: 'Insects, small creatures',
            threat: 'Low (startles easily)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.7 + Math.random() * 0.4,
          })
          break

        case 'w': // Wolf
          wolfCount++
          map.creatures.push({
            id: `wolf_${wolfCount}`,
            type: 'creature',
            position,
            width: 20,
            height: 20,
            color: '#708090',
            name: 'Dire Wolf',
            description: 'Large predatory canine. Hunts in packs.',
            behavior: 'Pack hunter, territorial',
            diet: 'Large prey, carrion',
            threat: 'High (aggressive when threatened)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.6 + Math.random() * 0.3,
          })
          break

        case 'k': // Kobold
          koboldCount++
          map.creatures.push({
            id: `kobold_${koboldCount}`,
            type: 'creature',
            position,
            width: 16,
            height: 16,
            color: '#FF8C00',
            name: 'Kobold',
            description: 'Small reptilian humanoid. Cunning trap-makers.',
            behavior: 'Uses traps and ambushes, avoids direct combat',
            diet: 'Omnivorous scavenger',
            threat: 'Medium (traps and numbers)',
            direction: Math.random() * Math.PI * 2,
            waypoints: generateRandomWaypoints(3),
            speed: 0.5 + Math.random() * 0.3,
          })
          break

        // Space character or unknown - empty walkable space
      }
    }
  }

  return { map, partyStartPosition }
}
