# Dungeon Ecosystem Game Logic

## Overview

**Prototype Goal:** Test mechanics of non-combat exploration and creature ecosystem management in a D&D-inspired underground environment.

**Core Loop:**
1. Player (party) enters dungeon entrance
2. Explores labyrinthine caverns, observing and learning creature behavior
3. Avoids/manages encounters through understanding and stealth
4. Locates and retrieves an artifact
5. Returns to entrance alive

**Key Principle:** Combat is AVOIDABLE but DEADLY. Victory comes through observation, adaptation, and ecosystem manipulation—not direct combat.

---

## World Design

### Environment
- **Scale:** Multi-chamber dungeon system (10-15 interconnected locations for prototype)
- **Themes:** Classic D&D underdark—cavernous halls, narrow passages, underground lakes, fungal gardens
- **Safe Zones:** Limited (entrance, potentially a neutral meeting ground)
- **Hazards:** Environmental damage (unstable floors, toxic air zones, underground rivers)

### Creature Ecosystem (50/50 Animal / Monster Split)

#### ANIMALS (Realistic Underground/Cave Dwellers)
1. **Giant Rats** (Common, Swarms)
   - Behavior: Nocturnal, fear light, scavengers
   - Diet: Organic matter, fungi
   - Threat: Low individually; dangerous in groups (disease)
   - Ecology: Food source for larger predators

2. **Giant Spiders** (CR 1, Territorial)
   - Behavior: Hunt from webs, very aggressive to intruders
   - Diet: Flying insects, small creatures
   - Threat: Medium (webbing immobilizes)
   - Relationship: Ignore rats if fed

3. **Cave Fish & Blind Crayfish** (Low threat, ecosystem)
   - Behavior: Passive unless water disturbed
   - Diet: Small organisms, algae
   - Threat: None direct
   - Indicator: Water quality, safety of drinking

4. **Blind White Salamanders/Newts** (Harmless)
   - Behavior: Burrowing, solitary
   - Diet: Grubs, insects
   - Threat: None
   - Utility: Indicator of soil moisture

#### MONSTERS (Fantastical/Supernatural)
1. **Goblin Tribe** (CR 1/4 individually, dangerous in numbers)
   - Behavior: Territorial, social hierarchy, use tools/traps
   - Diet: Omnivorous, prefer meat
   - Threat: Medium-High (organized, intelligent)
   - Relationship: War with Drow, fear owlbears, dominate rats

2. **Myconids (Fungal Colony)** (CR 2, Alien Intelligence)
   - Behavior: Slow, deliberate, communicate via spores
   - Diet: Decomposition of organic matter
   - Threat: Medium (spores cause paralysis/hallucinations)
   - Ecology: Symbiotic with fungi garden, prey on goblins

3. **Drow Scouts** (CR 1, Intelligent, Dangerous)
   - Behavior: Organized, magic-users, clannish
   - Diet: Humanoid food standards
   - Threat: HIGH (magic, coordination)
   - Relationship: At war with goblins, avoid myconids

4. **Owlbear** (CR 3, Apex Predator)
   - Behavior: Aggressive, territorial, highly intelligent for beast
   - Diet: Large prey (goblins, drow, party if cornered)
   - Threat: EXTREME (1v1 deadly, but solo and avoidable)
   - Ecology: Top predator, hunts at night, has lair with artifact location nearby

5. **Ooze/Gelatinous Cube** (CR 4, Environmental Hazard)
   - Behavior: Slow, predatory, dissolves organic matter
   - Diet: Everything organic
   - Threat: CRITICAL if encountered (inescapable trap)
   - Ecology: Inhabits main corridor, creates safe zone behind it (dissolved debris)

---

## Player Mechanics

### Observation System
**Players learn by witnessing:**
- Creature movement patterns (day/night cycles)
- Feeding behavior and diet preferences
- Territorial boundaries and nest locations
- Reaction to player actions (sound, light, movement)
- Inter-creature dynamics (hunts, conflicts, alliances)

**Knowledge Tiers:**
- Tier 1: Basic identification (what is this?)
- Tier 2: Behavior patterns (when/where it hunts)
- Tier 3: Weakness/relationship (how to pass safely)

### Avoidance Mechanics

**Option A: Stealth**
- Move slowly, minimize noise
- Use darkness (avoid light sources)
- Avoid scent trails
- Risk: Time cost, creature patience

**Option B: Exploitation**
- Feed one creature to distract predator
- Trigger conflict between species
- Use creature movement as cover
- Risk: Unexpected escalation

**Option C: Symbiotic Passage**
- Discover neutral zones (myconid garden = protection from hunters)
- Follow a "beneficial" creature (follow rats through goblin territory)
- Mimic behavior (immobility in myconid presence)
- Risk: Extreme situation if deception fails

**Option D: Traps & Environmental**
- Trigger goblin traps on other creatures
- Use collapsing terrain
- Exploit owlbear territorial fear of larger obstacles
- Risk: Unpredictable outcomes

### Knowledge = Currency
Once party *understands* a creature's behavior, options emerge:
- ✓ Knows rats fear light → Use torches to create safe path through rat swarm
- ✓ Knows goblins and drow are at war → Cross main hall during their scheduled conflict
- ✓ Knows owlbear hunts at night → Travel during daylight hours
- ✓ Knows ooze moves slowly → Observe its path and predict safe windows

---

## Artifact & Victory Conditions

**Artifact Location:**
- Hidden in owlbear's lair (deep cavern)
- Owlbear doesn't actively guard it, but uses territory
- Retrievable only during owlbear's hunting period (night cycle)
- Return path: Must backtrack through dungeon without triggering new encounters

**Win Conditions:**
1. Retrieve artifact
2. Reach entrance alive
3. Party intact (group stays together mechanically)

**Lose Conditions:**
- Party death (combat to death, ooze dissolution, environmental hazard)
- Artifact destroyed (certain encounters)
- Soft lock: Trigger all-out war, no safe path remains (learning failure)

---

## Prototype Scope (MVP)

### Must Have:
- [ ] 3-4 creatures with distinct AI patterns (Rats, Spiders, Goblins, Owlbear)
- [ ] Day/night cycle affecting creature activity
- [ ] Player movement with stealth mechanics
- [ ] Visual creature state feedback (alert, hunting, sleeping)
- [ ] Simple observation HUD (what does party know about visible creatures?)
- [ ] One successful avoidance path to artifact
- [ ] Basic map (3-5 locations)

### Should Have:
- [ ] Creature interactions (hunts, conflicts, territorial disputes)
- [ ] Environmental hazards (sound generation, visibility system)
- [ ] Multiple viable routes through dungeon
- [ ] Feedback on player action consequences

### Nice to Have:
- [ ] Full D&D bestiary (Myconids, Drow, Ooze)
- [ ] Complex ecosystem chains
- [ ] Emergent storytelling in creature conflicts
- [ ] Morale/fear system for party

---

## Risk Mitigation

**Risk:** Unpredictable AI makes learning impossible
- Mitigation: Creatures follow deterministic patterns (same time/place daily)

**Risk:** Players default to violence
- Mitigation: Combat is explicitly deadly; first real fight shows 60% health loss

**Risk:** Observation is tedious
- Mitigation: Highlight key behavioral tells; log observations for player reference

**Risk:** Ecosystem is too complex to predict
- Mitigation: Start with simple species pairs; add depth gradually
