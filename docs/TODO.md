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

### Food & Feeding System
- [x] Food item type: fungi, organic_matter, meat, insects
- [ ] Spawn zones (semi-transparent, respawning food)
- [ ] Creatures pick up and carry food
- [ ] Creatures move to feeding locations (species-specific behavior)
- [ ] Feeding duration timer (2-8 seconds by food type)
- [ ] Food disappears after consumption
- [ ] Visual rendering of carried food at creature's forward vertex

### Player Interaction System
- [x] Object click detection and interaction
- [x] "Pick Up" action for items
- [x] "Drop" action for carrying items
- [x] Party inventory (can hold one item at a time)
- [x] Visual feedback for held items (display at party direction)
- [ ] Examine action for spawn zones and obstacles

### Creature Species (MVP)
- [ ] Giant Rats (nocturnal sleep pattern, fungi/organic preference)
- [ ] Giant Spiders (alert, eat-on-site behavior)
- [ ] Goblins (organized, carry to den behavior)
- [ ] Owlbear (minimal sleep, apex predator)

### Observation & Information
- [ ] Creature detection when visible on screen
- [ ] Info panel showing selected object details
- [ ] Display creature state when selected
- [ ] Show food type information
- [ ] Display spawn zone details

### Artifact & Objective
- [ ] Owlbear lair location with artifact
- [ ] Win condition check (artifact + at entrance)
- [ ] Basic map with clear path to artifact
- [ ] Visual marker for entrance and artifact

### Testing
- [ ] Playtest creature sleep cycles (visible state changes)
- [ ] Verify creature feeding behavior works
- [ ] Test player object pickup/dropping
- [ ] Test various creature sleep patterns (can bypass sleeping ones)

---

## Phase 2: Ecosystem Expansion

## Phase 2: Ecosystem Expansion

### Advanced Feeding Mechanics
- [ ] Hunger state tracking for creatures
- [ ] Creatures actively search for food when hungry
- [ ] Hunger affects creature behavior (more aggressive?)
- [ ] Population control (too many creatures = food scarcity)

### Creature Interactions
- [ ] Predator/prey dynamics (spiders hunt insects)
- [ ] Territorial disputes between creatures
- [ ] Feeding conflicts (competition for resources)
- [ ] Pack behavior (rats swarm, goblins coordinate)

### Extended Bestiary
- [ ] Myconids (slow, detoxify areas)
- [ ] More creature species (cave fish, bats, wolves, etc.)
- [ ] Environmental creatures (insects, small harmless life)

### Advanced Knowledge System
- [ ] Multi-tier creature knowledge (identification → behavior → feeding spots)
- [ ] Knowledge persistence across saves
- [ ] Discovery journal with creature entries and notes
- [ ] Creature behavior learning (become wary of player)

### Multiple Routes
- [ ] Stealth path (around enemies, use sleep cycles)
- [ ] Feeding path (use food to distract/redirect)
- [ ] Predator path (use predator/prey dynamics)
- [ ] Environmental path (use obstacles and hazards)

---

## Phase 3: Polish & Depth

### Advanced Features
- [ ] Stealth mechanics (noise generation, detection radius)
- [ ] Light source mechanics (torch/darkness affect visibility)
- [ ] Hazardous terrain (toxic zones, unstable floors)
- [ ] Sound effects and creature vocalizations
- [ ] Scent/smell tracking for predators
- [ ] Combat as ultimate failure state (shows why avoidance needed)
- [ ] Creature swarms and pack dynamics
- [ ] Gelatinous Cube encounter (major setpiece)

### UI/UX Improvements
- [ ] Better creature state visualization (icons, effects)
- [ ] Threat level indicators
- [ ] Cycle timer display
- [ ] Inventory management UI
- [ ] Map memory (what you've explored)
- [ ] Quest log with objectives

### Narrative & Atmosphere
- [ ] Environmental storytelling through creature behavior
- [ ] Artifact lore and purpose
- [ ] Discovery of past events through ecosystem clues
- [ ] End-game narrative consequences

### Emergent & Dynamic Systems
- [ ] Creature behavior learning from player (become cautious)
- [ ] Long-term ecosystem changes (deplete rat population = food chain shifts)
- [ ] Dynamic encounters (creatures modify patterns)
- [ ] Food source management (run out of food = desperation)

---

## Known Issues & Notes
- Sleep cycle variation should be deterministic per creature (seed-based)
- Food carrying animation needs smooth visual integration
- Spawn zones respawn timer needs to handle consumed vs missed food

## Technical Debt / Considerations
- Creature AI architecture needs to be easily extensible (add new species)
- Food interaction system should support future mechanics (poisoning, disease)
- Save/load progress for longer playtests
- Performance optimization for many simultaneous creatures
- Deterministic waypoint generation (seed-based)

## Testing Priorities
1. **Learnability:** Can player intuitively discover creature sleep patterns?
2. **Playability:** Can player reach artifact using only observation and food manipulation?
3. **Fairness:** Are there always viable non-combat solutions?
4. **Balance:** Is any single strategy obviously dominant (thus others useless)?
5. **Determinism:** Do creatures follow consistent, predictable patterns across playthroughs?
