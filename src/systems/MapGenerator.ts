import { GameMap, Creature } from '../types/game'

// Helper to generate random waypoints for creature movement
function generateRandomWaypoints(mapWidth: number, mapHeight: number, count: number = 3) {
  const waypoints = []
  for (let i = 0; i < count; i++) {
    waypoints.push({
      x: Math.random() * (mapWidth - 200) + 100,
      y: Math.random() * (mapHeight - 200) + 100,
    })
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
      position: { x: 1050, y: 350 },
      width: 20,
      height: 20,
      color: '#FFD700',
      name: 'Ancient Artifact',
      description: 'A glowing golden relic. This is your objective.',
    },
  }

  // Create static obstacles (caves, walls)
  map.objects.push(
    {
      id: 'obstacle_1',
      type: 'obstacle',
      position: { x: 300, y: 200 },
      width: 150,
      height: 100,
      color: '#8B4513',
      name: 'Stone Wall',
      description: 'A solid rock formation blocking the way.',
    },
    {
      id: 'obstacle_2',
      type: 'obstacle',
      position: { x: 600, y: 500 },
      width: 200,
      height: 80,
      color: '#8B4513',
      name: 'Collapsed Rubble',
      description: 'Unstable rocks and debris. Better avoid it.',
    },
    {
      id: 'obstacle_3',
      type: 'obstacle',
      position: { x: 800, y: 200 },
      width: 100,
      height: 150,
      color: '#4A4A4A',
      name: 'Underground Lake',
      description: 'A dark, still body of water. Its depth is unknown.',
    },
    {
      id: 'obstacle_4',
      type: 'obstacle',
      position: { x: 500, y: 100 },
      width: 120,
      height: 60,
      color: '#654321',
      name: 'Fungal Growth',
      description: 'Thick bioluminescent fungi covering the cave wall.',
    }
  )

  // Create passive creatures (various types)
  const creaturesBase = [
    {
      id: 'rat_1',
      type: 'creature' as const,
      position: { x: 200, y: 300 },
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
      position: { x: 250, y: 400 },
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
      position: { x: 450, y: 350 },
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
      position: { x: 800, y: 250 },
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
      position: { x: 700, y: 150 },
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
      position: { x: 400, y: 600 },
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
      position: { x: 550, y: 650 },
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
      position: { x: 950, y: 500 },
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

  // Create items (food, supplies)
  map.items.push(
    {
      id: 'item_torch',
      type: 'item',
      position: { x: 150, y: 150 },
      width: 12,
      height: 12,
      color: '#FF8C00',
      name: 'Torch',
      description: 'A lit torch. Provides light in dark areas.',
    },
    {
      id: 'item_ration',
      type: 'item',
      position: { x: 100, y: 500 },
      width: 10,
      height: 10,
      color: '#D2691E',
      name: 'Food Ration',
      description: 'Dried meat and bread. Can sustain the party.',
    },
    {
      id: 'item_rope',
      type: 'item',
      position: { x: 1100, y: 400 },
      width: 8,
      height: 8,
      color: '#DAA520',
      name: 'Coil of Rope',
      description: 'Strong rope for climbing or other tasks.',
    }
  )

  return map
}
