# Dungeon Ecosystem Game - Prototype

An experimental exploration game prototype for testing non-combat dungeon mechanics in a D&D-inspired underground setting. Navigate through a living ecosystem of creatures, observe their behavior, and solve puzzles through understanding rather than combat.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/acrm/AdvPrototypes.git
cd AdvPrototypes

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

Output goes to `dist/` folder.

## Game Concept

**Goal:** Navigate a dangerous dungeon, retrieve an artifact from the depths, and escape alive.

**Challenge:** Most creatures can kill you in seconds. Survival depends on understanding their behavior through careful observation rather than combat.

**Core Mechanics:**
- **Exploration:** Move through interconnected caverns full of creatures
- **Observation:** Learn what each creature wants, fears, and hunts
- **Avoidance:** Use stealth, environmental knowledge, and creature relationships to bypass threats
- **Day/Night Cycles:** Creature activity changes based on time; use this to your advantage
- **Item Transport:** Pick up one item at a time, carry it through the map, and drop it strategically

## Current Controls

- **Left click on ground:** Move party (if path is reachable)
- **Left click on creature/object:** Select and inspect in info panel
- **Left click on item:** Move to item and pick it up (or pick instantly if close)
- **Left click near party while carrying:** Drop carried item
- **Left click on party while carrying:** Drop carried item at party position

**Creatures (D&D Bestiary):**
- **Giant Rats** - Nocturnal scavengers, fear light, swarm in numbers
- **Giant Spiders** - Territorial hunters, create webs, aggressive to intruders
- **Goblins** - Intelligent, organized, territorial, set traps
- **Myconids** - Slow fungal entities, create safe zones through alien intelligence
- **Owlbear** - Apex predator, deadly in combat, hunts on its schedule

See [docs/GAME_LOGIC.md](./docs/GAME_LOGIC.md) for detailed creature ecosystem design.

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Canvas API** - 2D graphics rendering

## Project Structure

```
src/
  components/
    DungeonGame.tsx      # Main game component (replaces BallGame.tsx)
    Creature.tsx         # Creature rendering & behavior
    Player.tsx           # Party representation
    DungeonMap.tsx       # Level/dungeon layout
  systems/
    CreatureAI.ts        # Behavior system for creatures
    EcosystemManager.ts  # Creature interactions & ecology
    ObservationLog.ts    # Player knowledge tracking
  App.tsx               # Root component
  main.tsx              # Entry point
docs/
  GAME_LOGIC.md         # Core mechanics & creature ecosystem design
  TODO.md               # Development roadmap
scripts/
  update-version.js     # Version management script
```

## Version Management

This project uses semantic versioning tied to ISO week:
- Format: `<weekCode>-<minor>.<build>`
- Example: `2026w10-0.1`

Version bumps after every code change:
```bash
npm run bump:build -- --desc "Your change description"
npm run bump:minor -- --desc "For breaking changes"
```

## Prototype Philosophy

This is an **experimental prototype** focused on testing core mechanics over polish:
- ✓ Mechanic testing (observation, avoidance, ecosystem)
- ✓ Creature AI behavior patterns
- ✓ Non-combat gameplay viability
- ✗ Full art/audio (placeholder acceptable)
- ✗ Complete dungeon (3-5 locations sufficient)
- ✗ All D&D creatures (start with Rats/Spiders/Goblins/Owlbear)

## License

MIT License - feel free to use and modify!

## Contributing

1. Make your changes
2. Bump version: `npm run bump:build -- --desc "..."`
3. Validate: `npm run typecheck && npm run build`
4. Commit: `<version>: <description>`
5. Push and create PR

See [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for AI agent workflow guidelines.
