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
- **Extraction Objective:** Retrieve the artifact from `A` and carry it back to the extraction marker `*`
- **Large Spawn Regions:** Each layout symbol now defines a 150x150 dungeon region where creatures, items, and the artifact can reappear after a cooldown
- **Follow Camera:** The visible play area stays fixed while the camera remains centered on the party

## Current Controls

- **Left click on ground:** Move party (if path is reachable)
- **Left click on creature/object:** Select and inspect in info panel
- **Left click on item:** Select item only (does not move party)
- **Left click near party while carrying:** Drop carried item
- **Left click on party while carrying:** Drop carried item at party position
- **Info panel buttons:** `[PICK UP]` approaches selected portable object (item, food, trap, artifact), `[SET TRAP]` arms selected nearby trap, `[DROP]` drops carried object
- **Camera:** The viewport follows the party, so the dungeon scrolls around them

## Tuning Gameplay Parameters

Gameplay tuning values are centralized in `src/config/gameSettings.ts`:

- cycle duration and tick rates
- party movement speed and interaction radii
- spawn respawn cooldowns
- creature patrol/idle behavior timings
- per-species movement speed ranges

Adjust these values to rebalance the prototype without editing gameplay logic files.

**Creatures (D&D Bestiary):**
- **Giant Rats** - Nocturnal scavengers, fear light, swarm in numbers
- **Giant Spiders** - Territorial hunters, create webs, aggressive to intruders
- **Goblins** - Intelligent, organized, territorial, set traps
- **Myconids** - Slow fungal entities, create safe zones through alien intelligence
- **Cave Owl** - Nocturnal aerial hunter with strong detection radius

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
    DungeonGame.tsx      # Main gameplay loop and interactions
    DungeonCanvas.tsx    # World rendering and camera
    InfoPanel.tsx        # Object details and action buttons
  systems/
    MapGenerator.ts      # Chunk generation and spawn zones
    Pathfinding.ts       # Navigation and walkability checks
  config/
    gameSettings.ts      # Central gameplay tuning
  data/
    dungeonLayout.ts     # Symbol-based zone/chunk layout
  types/
    game.ts              # Shared game state/types
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

Run one bump command after every tracked change:
```bash
npm run bump:build -- --desc "Your change description"
npm run bump:minor -- --desc "For breaking changes"
```

Do not edit `version.json`, `build-notes.md`, or the `package.json` version field manually during normal work. Stage only your own changed files before running bump.

The bump script synchronizes `version.json` and `package.json`, appends `build-notes.md`, runs `npm run build`, and creates the git commit automatically from your staged files plus bump metadata.

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
2. Update docs if behavior or workflow changed
3. Stage only your own files: `git add <path...>`
4. Run a bump command: `npm run bump:build -- --desc "..."`
5. Push the commit created by the bump script and create a PR

See [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for AI agent workflow guidelines.
