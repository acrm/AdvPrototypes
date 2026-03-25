# TODO - Prioritized Implementation Roadmap

## P0: MVP Blocking (Required for Core Loop)

### Chunk-Based Dungeon Generation
- [ ] Treat layout as a chunk-type map, not as final collision geometry
- [ ] Expand each layout symbol into a `5 x 5` gameplay-cell chunk
- [ ] Wall chunk generator: keep impassable central core
- [ ] Wall chunk generator: connect core stone continuously to neighboring wall chunks
- [ ] Wall chunk generator: carve side recesses from borders facing open chunks
- [ ] Wall chunk generator: cut corner cells when both corner-adjacent chunks are open
- [ ] Open chunk generator: allow wall-side protrusions without breaking traversability
- [ ] Open chunk generator: guarantee a path of width `>= 1` cell between all open sides
- [ ] Validate diagonal passage rules inside generated chunks (no blocked corner-cuts)
- [ ] Junction chunk option: allow a central blocked cluster of `1-3` cells when chunk has more than two open sides

**Dependencies**: Pathfinding verification, wall generation validation, traversability validation

### Vision Mechanics
- [ ] Implement sight-based detection for idle/patrol creatures (currently instant detection)
- [ ] Sleeping creature perception: only near-reaction radius triggers wake response
- [ ] Idle creature state: periodic awareness checks with configurable field of view
- [ ] Patrol creature state: full vision awareness with line-of-sight validation
- **Current issue**: Monsters detect instantly; should respect vision cones and distance-based awareness

### Creature Species Definition
Define complete behavioral templates for all 8 species:
- [ ] **Rat** — sleep pattern: dawn/dusk active | diet: fungi, insects | zone: lower caverns | aggression: low | threat: low
- [ ] **Spider** — sleep pattern: nocturnal | diet: insects, small creatures | zone: rocky areas | aggression: medium | threat: medium
- [ ] **Goblin** — sleep pattern: irregular | diet: meat, fungi | zone: mid-dungeon | aggression: high | threat: high
- [ ] **Myconid** — sleep pattern: slow growth-rest cycles | diet: organic matter | zone: wet areas | aggression: low | threat: low
- [ ] **Owl** — sleep pattern: diurnal reverse | diet: small creatures, insects | zone: open caverns | aggression: medium | threat: medium
- [ ] **Bat** — sleep pattern: nocturnal | diet: insects, small fruit | zone: upper caverns | aggression: low | threat: low
- [ ] **Wolf** — sleep pattern: crepuscular | diet: meat | zone: open terrain | aggression: high | threat: very high
- [ ] **Kobold** — sleep pattern: nocturnal | diet: meat, fungi | zone: fortified areas | aggression: very high | threat: very high

---

## P1: Core Features (Make Game Interesting)

- [ ] Deterministic waypoint generation for patrol routes (per-chunk seeding)
- [ ] Visible trap coverage indicator (show trap zones safely before stepping in)
- [ ] Friendly creature benefits (morale boost, protection, resource sharing)
- [ ] Environmental interaction patterns (water pools, lava zones, pheromone trails)
- [ ] Creature ability trees (special attacks, group tactics, environmental manipulation)
- [ ] Sound propagation system (noise alerts nearby creatures)

---

## P2: Polish (If Time Permits)

- [ ] Combat failure state (injury/exhaustion mechanics instead of instant death)
- [ ] Hazardous environments (damaging terrain, atmospheric effects)
- [ ] Enhanced UI/UX: minimap with creature indicators
- [ ] Tutorial / hint system for first-time players
- [ ] Save/load game state
- [ ] Statistics tracking (creatures encountered, items found, efficiency metrics)

---

## P3: Expansion (Post-MVP)

- [ ] Advanced knowledge system (creatures remember encounters, adjust behavior over time)
- [ ] Creature learning (populations adapt to player tactics)
- [ ] Ecosystem depth (predator-prey cycles, territory control, mating seasons)
- [ ] Procedural biome generation (adapt creature types by region)
- [ ] Multi-level dungeon descents

---

## TOP 5 P0 Implementation Priority (Start Here)

1. **Build final navigation map from chunk generation** — Essential foundation; blocks all movement pathfinding
2. **Wall chunk generator core logic** — Enables valid layout expansion and traversable dungeon
3. **Validate traversability & generate fallback rules** — Ensures game doesn't deadlock on invalid chunks
4. **Deterministic waypoint generation** — Allows creatures to patrol realistically without instant detection
5. **Vision mechanics (sight-based detection)** — Removes instant detection, makes creatures behave intelligently

These 5 items unlock core gameplay: valid dungeon → creatures move sensibly → vision-based encounters → player strategy emerges.

