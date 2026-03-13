# Dungeon Ecosystem Prototype - Roadmap

## Phase 1: Core Loop MVP (Prototype)

### Foundation
- [x] Set game window title to "Dungeon Ecosystem"
- [x] Dungeon map structure (basic multi-room layout)
- [x] Party character & representation
- [ ] Camera/viewport system
- [x] Mouse click input system (movement, object interaction)

### Creature AI System
- [x] Creature entity framework with sleep/wake cycles
- [x] 240-second game cycle with time progression
- [x] Sleep schedule system (sleepStart, sleepEnd, variation)
- [x] Three creature states: sleeping, idle, patrol
- [x] Visual state feedback (immobile vs rotating vs moving)
- [ ] Deterministic waypoint generation for patrol routes
- [x] State transitions based on cycle time

### Visibility & Detection System
- [ ] Creature detection radius (varies by species)
- [ ] Vision mechanics: sleeping (no detection), idle (periodic checks), patrol (full awareness)
- [ ] Player detection trigger (line of sight, noise, collision)
- [ ] ALERT state for creatures (heightened awareness when detecting player)
- [ ] Detection feedback (visual alert icon or warning)
- [ ] Selected creature highlight: show translucent detection radius ring on map

### Territorial System
- [ ] Spawn zones defined in dungeon layout (zone types, not individual creatures)
- [ ] Creature assignment to zone types
- [ ] Territorial boundaries visualization
- [ ] Creature movement between adjacent same-type zones
- [ ] Territorial conflict simulation (when creatures invade territories)

### Player Health System
- [ ] 3-heart health display (one per party member)
- [ ] Damage mechanic (creature collision, environmental hazard)
- [ ] Speed penalty based on health:
  - 3 Health: Normal speed
  - 2 Health: 25% slower
  - 1 Health: 50% slower
- [ ] Health recovery: eating safe food restores 1 health
- [ ] Loss condition: 0 Health = game over
- [ ] Safe food types: fungi, organic matter, insects
- [ ] Dangerous food types: meat (spoiled), certain fungi (hallucinogenic)

### Trapping & Domestication Mechanics
- [ ] Trap item type (player can carry and place)
- [ ] Trap placement UI action
- [ ] Trap detection by creatures (triggered on collision)
- [ ] Trapped creature state: immobilized 10-15 seconds
- [ ] Enraged state: creature becomes hostile to player specifically after escaping trap
- [ ] Priming/Feeding: drop food in creature's sight to begin taming
- [ ] Friendly state: after 3+ feedings, creature becomes non-hostile
- [ ] Friendly creature benefits: safe observation, no attacks, spreads non-aggression
- [ ] Trap map objects spawn as diamonds (not circles)
- [ ] Trap color encodes target species (fixed palette)

### Movement & Sound System
- [ ] Speed tiers: fast (noisy), medium (normal), slow (quiet)
- [ ] Sound generation based on speed and movement distance
- [ ] Creature hearing based on state (patrol hears more than idle)
- [ ] Noise propagation through zones (alert chains)
- [ ] Standing still: complete silence

### Food & Feeding System
- [x] Food item types: fungi, organic_matter, meat, insects
- [ ] Spawn zones (semi-transparent, respawning food)
- [ ] Creatures pick up and carry food
- [ ] Creatures move to feeding locations (species-specific behavior)
- [ ] Feeding duration timer (2-8 seconds by food type)
- [ ] Food disappears after consumption
- [ ] Visual rendering of carried food at creature's forward vertex
- [ ] Ordered diet priorities per species (`dietPriorities`)
- [ ] Predator-capable species include prey targets (`creature:<species>`) and optional `player`
- [ ] Target selection uses first available entry in ordered priority list

### Layout Marker Integration
- [ ] Parse creature zone symbols: `r/s/g/m/o/b/w/k`
- [ ] Parse food zone symbols: `F/N/M/I`
- [ ] Parse trap zone symbols: `R/S/G/Y/O/B/W/K`
- [ ] Keep `.` as item zone and `*` as artifact zone
- [ ] Treat symbols as zone definitions, not fixed single-entity placements

### Player Interaction System - Object Actions
- [x] Object click detection 
- [x] "Pick Up" action for food items
- [x] "Drop" action for carrying items
- [x] "Examine" action for objects
- [x] Party inventory (one item max)
- [x] Visual feedback for held items at party direction
- [ ] "Eat" action for safe food items
- [ ] "Eat" action feedback (animation, health gain message)
- [ ] Health indicator (3 hearts) displayed in UI
- [ ] Speed penalty visualization when wounded

### Creature Species (MVP)
- [ ] Giant Rats (nocturnal sleep pattern, fungi/organic preference, zone: Rat Warren)
- [ ] Giant Spiders (alert, eat-on-site behavior, zone: Spider Nest)
- [ ] Goblins (organized, carry to den behavior, zone: Goblin Warren)
- [ ] Owlbear (minimal sleep, apex predator, zone: Owlbear Lair)
- [ ] Species-specific detection radius values
- [ ] Species-specific enrage behavior after trap escape

### Observation & Information
- [ ] Creature state display when selected
- [ ] Show food type information
- [ ] Show ordered diet priorities in creature details
- [ ] Show predator targets (including player, if configured) in creature details
- [ ] Display zone/territory information
- [ ] Info panel shows creature detection status
- [ ] Visual indicator for friendly creatures
- [ ] Visual indicator for enraged creatures
- [ ] Health heart display in UI

### Artifact & Objective
- [ ] Owlbear lair location with artifact
- [ ] Win condition: have artifact + reach entrance
- [ ] Entrance location clearly marked
- [ ] Clear path possibility to artifact despite dangers
- [ ] Creature placement creates strategic challenge

### Testing & Balance
- [ ] Playtest visibility: can player observe creatures without being detected?
- [ ] Playtest territorial conflicts: do they create usable windows?
- [ ] Playtest feeding taming: does 3x priming feel like reasonable effort?
- [ ] Playtest traps: is trapping-and-enraging a viable tactic?
- [ ] Playtest health system: do 3 hearts feel right for difficulty?
- [ ] Playtest speed penalties: is movement constraint harsh enough when wounded?
- [ ] Verify creature zones are respected (no zone crossing)
- [ ] Verify artifact is accessible via multiple routes
- [ ] Test friendly creature behavior (safe observation)
- [ ] Test enraged creature behavior (aggressive, hunts player)
- [ ] Verify food respawning in zones
- [ ] Verify player cannot eat dangerous food (meat, hallucinogenic fungi)
- [ ] Verify selected-creature detection ring matches configured detection radius
- [ ] Verify predator species attack only configured prey species and player
- [ ] Verify every trap diamond color matches its target species mapping

---

## Phase 2: Ecosystem Expansion

### Advanced Feeding Mechanics
- [ ] Hunger state tracking for creatures
- [ ] Creatures actively search for food when hungry
- [ ] Hunger affects creature behavior (more aggressive?)
- [ ] Population control (too many creatures = food scarcity)

### Creature Interactions
- [ ] Predator/prey dynamics (spiders hunt insects, owlbear hunts all)
- [ ] Territorial disputes between creatures (visible conflicts)
- [ ] Feeding conflicts (competition for resources creates temporary lulls)
- [ ] Pack/swarm behavior (rats swarm when alert, goblins coordinate)
- [ ] Pack leadership (alpha creatures influence swarm behavior)
- [ ] Creature communication (howls, squeaks signal other creatures)

### Extended Bestiary (Phase 2+)
- [ ] Myconids (slow fungal entities, detoxify certain areas)
- [ ] Cave insects (numerous, harmless, spider food)
- [ ] Bats (nocturnal, avoid them)
- [ ] Wolves (pack predators, territorial)
- [ ] Drow scouts (intelligent, magical)

### Advanced Knowledge System
- [ ] Multi-tier creature knowledge (ID → behavior → vulnerabilities)
- [ ] Knowledge persistence across playthroughs
- [ ] Discovery journal with creature entries
- [ ] Creature behavior learning (become wary of specific player tactics)
- [ ] Creature trait discovery (speed, intelligence, aggression)

### Multiple Routes & Solutions
- [ ] Stealth path (use sleep cycles to bypass creatures)
- [ ] Feeding/Taming path (domesticate creatures for safe passage)
- [ ] Trap/Diversion path (trap hazardous creatures to clear paths)
- [ ] Territorial path (use predator/prey conflicts as cover)
- [ ] Environmental hazard path (navigate using natural obstacles)
- [ ] Combination paths (mix multiple strategies)

---

## Phase 3: Polish & Depth

### Advanced Detection & Evasion
- [ ] Scent/smell tracking for predators (owlbear, wolves)
- [ ] Creature learning system (become wary of specific player tactics)
- [ ] Creature communication network (warnings spread through zones)
- [ ] Sophisticated hearing simulation (echoes, distance calculations)
- [ ] Light and shadow mechanics (torch attracts/repels different creatures)

### Combat Failure State
- [ ] Combat system (if player cornered, must fight)
- [ ] Combat shows why avoidance is critical (high damage)
- [ ] Creature combat AI (pack coordination, tactics)
- [ ] Surrender option (if overwhelmed)

### Hazardous Environment
- [ ] Toxic air zones (damage over time)
- [ ] Unstable terrain (risk of collapse)
- [ ] Underground lakes (depth/drowning risk)
- [ ] Myconid spore zones (hallucinogenic effects)
- [ ] Pressure plates and triggers

### UI/UX Enhancements
- [ ] Threat level indicators (distance to nearest danger)
- [ ] Cycle timer display (shows current time in 240s cycle)
- [ ] Inventory management UI (show carried item)
- [ ] Map memory (explored vs unexplored areas)
- [ ] Creature trait visualization (aggression level, speed)
- [ ] Status effects display (enraged, friendly, trapped)

### Narrative & Storytelling
- [ ] Artifact lore (what is it? why does player need it?)
- [ ] Creature backstory (through behavior observation)
- [ ] Environmental storytelling (signs of past events)
- [ ] End-game revelation (consequences of retrieving artifact)
- [ ] Multiple endings (based on actions, creature fates)

### Emergent Systems
- [ ] Food chain consequences (if rats eliminated, herbivore chain breaks)
- [ ] Creature adaptation (become more cautious if player aggressive)
- [ ] Pack leadership dynamics (alpha creature changes behavior pattern)
- [ ] Territory reclamation (if predator dies, others claim territory)
- [ ] Ecosystem collapse scenarios (possible failure states)

---

## Known Issues & Implementation Notes

**Implementation Reference (for coding agent):**
- Diet priorities (ordered):
  - Rat: `food:fungi`, `food:organic_matter`, `food:insects`
  - Spider: `food:insects`, `creature:rat`, `creature:bat`, `player`
  - Goblin: `food:meat`, `food:organic_matter`, `creature:rat`, `player`
  - Myconid: `food:organic_matter`, `food:fungi`
  - Owl: `creature:rat`, `creature:bat`, `food:insects`, `player`
  - Bat: `food:insects`, `food:fungi`
  - Wolf: `creature:goblin`, `creature:rat`, `food:meat`, `player`
  - Kobold: `food:meat`, `food:insects`, `food:organic_matter`, `creature:rat`
- Trap color mapping by target species:
  - Rat `#f4d03f`, Spider `#8e44ad`, Goblin `#2ecc71`, Myconid `#9b59b6`
  - Owl `#f39c12`, Bat `#34495e`, Wolf `#5dade2`, Kobold `#e67e22`
- Selected creature visualization: always render a translucent detection-radius ring while selected
- Layout symbol mapping: `F/N/M/I` for food zones and `R/S/G/Y/O/B/W/K` for trap zones

**Determinism:**
- All creature behaviors seeded for consistency across playthroughs
- Sleep variation per creature uses consistent PRNG
- Waypoint generation deterministic per creature ID

**Zone System:**
- Creatures respect assigned zone type (never permanently leave)
- Can transition through adjacent zones of same type
- Zone letters in dungeon layout define zone type, not creature placement

**Health & Damage:**
- Damage always triggers from collision, not proximity
- Player can run away even at low health (risky but possible)
- Health penalty affects speed, not other abilities

**Trap System:**
- Traps are temporary solutions (enragement creates counterplay)
- Trapped creature damage based on size/species
- Can chain traps but enraged creatures more alert

**Food Taming:**
- 3 feedings threshold feels right for difficulty
- Friendly creatures still follow their schedules (not permanent followers)
- Cannot un-friendly a creature without extreme effort

## Technical Debt & Optimizations

- Creature AI architecture (easy species additions)
- Pathfinding for creature waypoints (A* or simple patrol)
- Zone-based culling (don't simulate off-screen creatures heavily)
- Save/load system (for longer playtests)
- Performance with 10+ creatures on screen
- Procedural zone generation from text layout

## Testing & Balance Priorities

**Critical:**
1. Can player reach artifact without being forced to fight? (core principle)
2. Do visibility mechanics feel tense but fair?
3. Do health/speed penalties create meaningful challenges?

**Important:**
4. Do sleep cycles feel learnable and useful?
5. Is trap/taming/territorial system understandable?
6. Are all three (4+) starting zones viable for progression?

**Nice to Have:**
7. Do creature conflicts create dramatic moments?
8. Can player invent creative solutions beyond planned routes?
9. Does the ecosystem feel "alive" and reactive?
