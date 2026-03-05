# Dungeon Ecosystem Prototype - Roadmap

## Phase 1: Core Loop MVP (Prototype)

### Foundation
- [ ] Dungeon map structure (tilemap, 3-5 key locations)
- [ ] Player character & party representation
- [ ] Camera/viewport system
- [ ] Input system (movement, interact, observe)

### Basic Creature System
- [ ] Creature entity framework (position, state, behavior)
- [ ] Giant Rats (nocturnal, scavenger behavior, swarm mechanics)
- [ ] Giant Spiders (territorial, web mechanic, aggression)
- [ ] Basic AI state machine (idle, alert, hunting, fleeing)

### Day/Night Cycle
- [ ] Time progression system
- [ ] Creature activity changes (rats active at night, etc)
- [ ] Visual feedback (lighting changes, creature behavior shifts)

### Observation Mechanics
- [ ] Creature detection/visibility on screen
- [ ] Basic observation log (what did player witness?)
- [ ] HUD display of known creatures
- [ ] Simple behavior indicators (sleeping, hunting, alert)

### Player Interaction
- [ ] Stealth movement (noise/detection system)
- [ ] Light source management (torch affects visibility)
- [ ] Creature reaction to player actions
- [ ] Basic hazards (environmental damage)

### Artifact & Objective
- [ ] Owlbear lair location with artifact
- [ ] Win condition (reach entrance with artifact)
- [ ] Lose conditions (party death)
- [ ] At least one clear path through dungeon

### Testing
- [ ] Playtest core loop (can player observe creatures?)
- [ ] Verify creature behaviors are deterministic
- [ ] Test stealth vs. aggression outcomes

---

## Phase 2: Ecosystem Expansion

### Extended Bestiary
- [ ] Goblins (organized, traps, territorial)
- [ ] Myconids (slow, alien behavior, spore mechanic)
- [ ] Drow scouts (intelligent, faction rivals)

### Creature Interactions
- [ ] Goblin vs. Drow conflict system
- [ ] Predator/prey dynamics (spiders hunt flying creatures)
- [ ] Territorial disputes
- [ ] Feeding/corpse mechanics

### Advanced Knowledge System
- [ ] Multi-tier creature knowledge (identification → behavior → exploitation)
- [ ] Knowledge persistence (remember what you learned)
- [ ] Discovery journal with creature entries

### Multiple Routes
- [ ] Stealth path (around enemies)
- [ ] Exploitation path (trigger conflicts, use as cover)
- [ ] Symbiotic path (follow neutral creatures)
- [ ] Environmental path (use hazards)

### Audio System
- [ ] Ambient dungeon sounds
- [ ] Creature vocalizations (rat squeaks, spider hiss)
- [ ] Silence as safety indicator
- [ ] Noise generation mechanics

---

## Phase 3: Polish & Depth

### Advanced Features
- [ ] Gelatinous Cube encounter (major setpiece)
- [ ] Scent/smell mechanic (for predators)
- [ ] Pack dynamics (goblin squads, rat swarms)
- [ ] Breeding/population changes (minor ecosystem shifts)

### UI/UX
- [ ] Better creature recognition UI
- [ ] Threat level indicators
- [ ] Map memory (what you've explored)
- [ ] Quest journal/objectives

### Narrative
- [ ] Discovery narrative (lore discovered through creatures)
- [ ] Environmental storytelling
- [ ] Artifact reveal and consequence

### Emergent Gameplay
- [ ] Creature behavior learning from player (become cautious)
- [ ] Long-term ecosystem changes (deplete rat population = less food)
- [ ] Dynamic encounters (creatures change patterns)

---

## Known Issues
- None yet (prototype phase)

## Technical Debt / Considerations
- Creature AI architecture (should be easily extensible)
- Audio system integration
- Save/load progress for longer playtests
- Performance optimization for many simultaneous creatures

## Testing Priorities
1. **Playability:** Can player actually achieve objectives without combat?
2. **Learnability:** Can player intuitively discover creature patterns?
3. **Fairness:** Are there always viable non-combat solutions?
4. **Balance:** Is any strategy obviously dominant (thus others obsolete)?
