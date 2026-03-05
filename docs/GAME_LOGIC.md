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

### Creature Sleep/Activity Cycles

**Cycle Duration:** 240 seconds (full cycle)

**Creature States:**
1. **SLEEPING** - Completely motionless, unaware of surroundings
   - Safe to pass nearby
   - Identified by: zero movement and no rotation (same visual shape)
   - Cannot react to player actions

2. **IDLE** - Awake but stationary, rotates to a random direction every 1-2 seconds
   - Aware but not actively hunting
   - May notice player if very close
   - Identified by: static position, periodic direction changes

3. **PATROL** - Actively moving along waypoints, fully alert
   - Most dangerous state
   - Can detect player and react
   - Identified by: smooth movement, directional heading

**Sleep Schedules (Species-Specific):**
- **Rats:** Sleep 60-90% of cycle (nocturnal, hide during day)
- **Spiders:** Sleep 10-30% of cycle (brief rests, always ready)
- **Goblins:** Sleep 0-15% of cycle (highly alert, paranoid)
- **Owlbear:** Sleep 20-60% of cycle (long hunter's rest)

Each individual creature has slight variation (±5%) to make patterns non-obvious but learnable.

### Food & Feeding Mechanics

**Food Types & Spawn Zones:**
- **Fungi** - Grows in fungal gardens, soft glow
- **Organic Matter** - Decomposing vegetation, scattered debris
- **Meat** - Carrion from fallen creatures
- **Insects** - Swarms in specific cave areas

Each food type appears in semi-transparent spawn zones where it respawns periodically.

**Creature Feeding Process:**
1. Creature finds food → **picks it up** (can carry one item)
2. Creature decides: eat here or carry to secluded location?
3. Creature moves to feeding spot (may be different for each species)
4. Creature **stops and eats** for species-dependent duration:
   - Insects: 2 seconds
   - Fungi: 3 seconds
   - Organic Matter: 5 seconds
   - Meat: 8 seconds
5. Food item disappears

**Species Feeding Behavior:**
- **Rats:** Prefer to carry food to burrows (hiding behavior)
- **Spiders:** Eat on-site (use webbing to hold prey)
- **Goblins:** Carry to dens/safe zones (organized behavior)
- **Owlbear:** Eat anywhere (apex predator, fearless)

**Visual Indicator:** Food being carried displays as small object at creature's forward-pointing triangle vertex.

### Observation System
**Players learn by witnessing:**
- Creature sleep schedules (timing patterns)
- Feeding behavior and diet preferences
- Territorial boundaries and nest locations
- Reaction to player actions (sound, light, movement)
- Inter-creature dynamics (hunts, conflicts, alliances)

**Knowledge Tiers:**
- Tier 1: Basic identification (what is this? what does it eat?)
- Tier 2: Behavior patterns (when/where does it work? when does it rest?)
- Tier 3: Weakness/relationship (how to safely bypass it?)

### Player Interaction with Objects

**Item Interaction System (Current Prototype):**
- Click on any object → object is selected in the info panel
- **Ground item click:**
   - If close enough, party picks it up immediately
   - If far, party moves to the item and picks it up on arrival
- **Drop carried item:**
   - Click party to drop item at party position
   - Click nearby ground to drop item at clicked location
- **Obstacle click:** shows object details (no movement through walls)

**Party Inventory:**
- Party can carry ONE item at a time
- Carrying item displays visually at party's forward-facing direction
- Can drop item at current or nearby location to free space or reposition resources

**Strategic Uses:**
- Drop food to lure creatures away from your path
- Position food to trigger creature conflicts
- Follow creature carrying food to discover their hiding spots
- Block passages or create "bait zones"

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
