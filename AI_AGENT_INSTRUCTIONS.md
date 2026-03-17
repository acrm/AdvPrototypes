# AI Agent Instructions

## Language Policy
- User-facing chat replies: **Russian**
- File content (code/docs/config): **English only**

## Documentation Agent Mode (Hard Constraint)

When the agent is explicitly assigned as a **documentation agent**:
- Do not edit any code files (for example: `src/**`, `scripts/**`, build/runtime configs, tests, or assets used by the app runtime).
- Limit file edits to documentation and instruction content only (for example: `docs/**`, `README.md`, `AI_AGENT_INSTRUCTIONS.md`, `.github/copilot-instructions.md`).
- If the request requires code changes, stop and ask for explicit role switch or handoff to an implementation agent.
- Before running a bump command, ensure staged files are documentation/instruction files only.

## Versioning Strategy

Version format: `<weekCode>-<minor>.<build>`
- `weekCode`: current ISO week (e.g., `2026w10`)
- `minor`: minor version (reset on week change)
- `build`: incremental build number

### Mandatory Version Bump After Any Tracked File Change

After modifying any tracked file:
1. Run exactly one bump command:
	- `npm run bump:build -- --desc "Short English summary"`
	- `npm run bump:minor -- --desc "Short English summary"`
2. Never edit `version.json`, `build-notes.md`, or the `package.json` version field directly during normal work. Only the bump script may update them.
3. Stage only your own changed files with explicit paths before bump. Do not use `git add -A` or `git add .`.
4. The bump script must sync `version.json` and `package.json`, append `build-notes.md`, run `npm run build`, and create the git commit automatically from pre-staged files plus metadata.
5. Do not create a second manual commit after a successful bump.

### Commands Reference

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run typecheck` — validate TypeScript
- `npm run lint` — check code style
- `npm run test` — run tests (if configured)
- `npm run bump:build -- --desc "..."` — bump build version
- `npm run bump:minor -- --desc "..."` — bump minor version

## Project Documentation Synchronization

After code changes, review and update:
- `docs/GAME_LOGIC.md` — game mechanics and rules
- `docs/TODO.md` — roadmap and known issues
- `README.md` — project overview

Keep docs in English, concise, and factual.

## Git Workflow

1. Make code changes
2. Update docs if behavior, UI, parameters, or flow changed
3. Stage only your own files (explicit `git add <path...>`)
4. Run one bump command
5. Push the commit created by the bump script to GitHub

## Multi-Agent Parallel Work

- Multiple agents may work in parallel chats on the same repository state.
- Each agent must commit only its own staged files plus bump metadata.
- Never stage or commit unrelated modifications from other agents.

## File Locations to Know

- Game component: `src/components/DungeonGame.tsx`
- Main app: `src/App.tsx`
- Game logic docs: `docs/GAME_LOGIC.md`
- Vite config: `vite.config.ts`
- Version files: `version.json`, `package.json` (sync both)
