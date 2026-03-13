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
- **Layout Rendering:** Each layout symbol represents a large 150x150 world region, while creatures, items, and the party keep their original compact sizes inside those regions
- **Camera:** The viewport stays the same size and remains centered on the party as the dungeon scrolls around them

### Spawn Regions & Respawn

- **Symbol semantics:** Non-wall symbols are spawn regions rather than fixed single-tile placements
- **Initial spawn:** At the start of a run, the associated creature, item, or artifact appears somewhere inside its marked region
- **Persistence after movement:** Once spawned, the entity can move freely through the dungeon or be carried away by the party
- **Respawn rule:** If a spawned entity is removed from play entirely, a replacement appears in its original region after a cooldown
- **Current cooldowns:** Items return faster than creatures; artifact and party start regions do not auto-respawn

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

### Visibility & Detection System

**Creature Vision Mechanics:**
- Each creature species has detection radius (varies by type)
- **SLEEPING creatures:** Cannot see, cannot be triggered
- **IDLE creatures:** Limited vision cone, see only when rotating view in that direction (periodic checks)
- **PATROL creatures:** Full 360° awareness, constant vigilance

**Detection by Species:**
- **Rats:** Close vision (fear-based, paranoid), poor at distance
- **Spiders:** Excellent vision (predator eyes), large radius
- **Goblins:** Medium vision, organized search patterns
- **Owlbear:** Excellent vision (apex predator), largest radius

**Player Detection Triggers:**
- Direct line of sight (creature looks at player position)
- Noise from fast movement (see "Movement & Sound System")
- Collision with creature
- If player in creature's detection radius during PATROL state

**Detection Consequences:**
- Creature enters ALERT state
- Creature becomes hostile towards player
- Creature calls out if intelligent (goblins, drows)
- In ALERT: creature has +2 detection radius and constant scanning

### Territorial System & Conflicts

**Creature Territories:**
- Each adult creature claims territory with clear boundaries
- Territory contains preferred feeding spots, resting areas, patrol routes
- Smaller creatures (rats, spiders) have smaller territories
- Apex predators (owlbear) have huge territories overlapping many others

**Territorial Conflicts:**
- If creature from Species A enters Species B territory → confrontation risk
- **Low threat vs Medium:** Low retreats or avoids
- **Medium vs Medium:** Display, posturing, sometimes combat
- **Any vs Apex predator:** Submission or flight (all other creatures fear owlbear)

**Strategic Leverage:**
- Territorial disputes create "safe corridors" while conflicts happen
- Player can exploit timing: cross during goblin-spider conflict
- Apex predator territory is dangerous but creates de facto hunting zones (predator controls food, keeps swarms down)

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

**Item Interaction System:**
- Left click on an item selects it in the info panel and does not move the party
- `[PICK UP]` in the info panel makes the party approach the selected item and pick it up when within pickup radius
- `[DROP]` places the carried item at party position (or nearby clicked ground when valid)
- **Info panel action buttons:**
   - `[PICK UP]` - approaches currently selected item and picks it up when in range
   - `[DROP]` - drops currently carried item at party position
  - `[Set Trap]` - Place at location, arms after 2 seconds
  - `[Disarm]` - Remove armed trap
  - `[Examine]` - Learn details

**Party Inventory:**
- Party can carry ONE item at a time
- Carrying item displays visually at party's forward-facing direction
- Types of items: Food, Traps, Equipment

**Feeding & Domestication (Taming Mechanics):**

**Priming (Feeding in Visible Range):**
- Drop food within creature's current vision radius (only works if creature in IDLE or PATROL state)
- Creature notices food, moves to investigate and eat
- While eating → creature becomes temporarily non-hostile
- If player repeats this 3+ times with same creature → creature becomes "Friendly"

**Friendly Creatures:**
- Will not attack player
- Will ignore player presence
- Will not alert other creatures to player location
- Still follow their normal schedules and eating patterns
- Provides intel: player can observe creature behavior safely

**Trapping Mechanics:**

**Setting a Trap:**
- Player carries trap item (must have found/crafted one)
- Click ground location → `[Set Trap]`
- Trap becomes invisible/hidden for 2 seconds
- When creature walks over armed trap → creature is caught

**Trapped Creature Effects:**
- Creature immobilized for 10-15 seconds (depends on creature size)
- Upon release: creature is **ENRAGED** and **HOSTILE to player specifically**
- Creature will actively hunt player (has dedicated AI modification)
- Enraged creature attacks on sight, ignores normal behavior patterns
- Other creatures notice enraged companion → may join hunt

**Trap Strategy:**
- Can use to block specific creature temporarily
- Can create "exit window" by trapping predator that blocks your path
- Risky: if caught by other creatures while enraged creature is loose → cornered
- Once creature enraged against you → difficult to untame (needs many priming sessions)

### Player Health System

**Party Health:**
- Party has **3 Health Hearts** (one per party member)
- Each heart = one party member's status
- Health is tracked collectively (whole party has 3 hits total)

**Taking Damage:**
- Creature collision while player not prepared: -1 Health (lose one party member's resilience)
- Direct attack/combat: -1 to -2 Health (depending on creature)
- Environmental hazard: -1 Health
- At 0 Health: **GAME OVER** (entire party defeated)

**Health Penalties:**
- At 3 Health: Normal speed (base case)
- At 2 Health: Party moves 25% slower (one member injured, slowing group)
- At 1 Health: Party moves 50% slower (two members critically wounded)
- At 0 Health: Loss condition (cannot continue)

**Health Recovery:**
- Party can eat non-dangerous food items to restore 1 Health
- Each food type can be eaten by party: fungi, organic matter, insects (meat is dangerous - spoiled/unknown)
- After eating: 5-second animation/recovery time before movement resumes
- Can only recover if at least 1 Health remaining
- Max health always 3 (cannot exceed)

**Dangerous Foods for Player:**
- **Meat:** Unknown source, likely contaminated or poisoned → avoid
- **Fungi in certain zones:** Hallucinogenic myconid spores → player loses control temporarily
- **Contaminated water:** Toxic underground lakes → damage over time

### Movement & Sound System

**Speed Mechanics:**
- Base speed: party moves at defined pace
- Fast movement: Creates noise, creatures can hear from distance
- Slow movement: Minimal noise, creatures less likely to notice
- Standing still: No noise, allows creature to pass

**Sound Detection:**
- Creatures in PATROL state have heightened hearing (large radius)
- Creatures in IDLE state hear less frequently (periodic checks)
- Loud noises (crashing into obstacle, shouting): can trigger ALERT in multiple creatures
- Sound propagates: one creature hearing alert can cause chain reaction through territory

### Spawn Zones & Creature Territories

**Spawn Zone System:**
- Dungeon is divided into named zones (e.g., "Rat Warren", "Spider Nest", "Fungal Gardens")
- Each zone type has preferred species (but not exclusive)
- Zones are marked in text dungeon layout with zone letter (not individual creature placement)

**Creature Assignment to Zones:**
- Creatures are **born/assigned to zone type** (rats spawn in Warren, spiders in Nest, etc.)
- Creatures **rest/sleep in their home zone**
- Creature can **patrol between adjacent zones of same type** (Warren #1 ↔ Warren #2)
- Creature **never leaves zone type** (rat cannot go to spider territory permanently)

**Dungeon Layout Notation:**
- `r` = Rat Warren zone (can have multiple rats, they move within warren)
- `s` = Spider Nest zone (territorial, usually 1-2 spiders)
- `g` = Goblin warren zone (organized, hierarchical)
- `o` = Owlbear lair zone (dangerous apex predator territory)
- `*` = Artifact location

**Zone Transitioning:**
- Creature patrols between connected zones of same type following waypoints
- When in waypoint of adjacent own-type zone → creature may spend time there
- Creatures are territorial but not rigid (follow ecological rules, not invisible walls)

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
- Party death: 0 Health remaining (all three party members incapacitated)
- Captured by creatures: Overwhelmed in combat
- Artifact destroyed: Certain encounters or hazards
- Soft lock: All possible paths sealed, creature territories completely blocking passage

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
