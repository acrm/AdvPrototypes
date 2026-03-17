# Repository Copilot Workflow

## Operational Rules
- User-facing chat replies must be in Russian.
- File content (code/docs/config) must be in English.
- If you are operating as a documentation agent, do not modify code files; edit documentation/instruction files only.
- In documentation-agent mode, any request that needs code changes must be blocked until the user explicitly switches to an implementation role.
- After any tracked file change, run exactly one version bump command:
  - `npm run bump:build -- --desc "Short English summary"`
  - `npm run bump:minor -- --desc "Short English summary"`
- Never edit `version.json`, `build-notes.md`, or the `package.json` version field directly during normal work.
- Before bump, stage only your own changed files with explicit paths. Never use `git add -A` or `git add .`.
- Keep version synchronized in `version.json` and `package.json`.
- Ensure `build-notes.md` gets appended on each bump.
- The bump script must run build verification and create the git commit automatically from pre-staged files plus metadata.
- Use commit message format: `<version>: <description>`.
- Do not create a second manual commit after a successful bump.
- Standard sequence: change files -> update docs if needed -> bump version -> push.
- After any source change, review and update domain docs if impacted.

## Key Documentation
- `README.md` — project overview
- `docs/GAME_LOGIC.md` — game mechanics
- `docs/TODO.md` — roadmap
- `src/components/DungeonGame.tsx` — game component

## Development Commands
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Lint: `npm run lint`
- Dev: `npm run dev`
- Bump build: `npm run bump:build -- --desc "Short English summary"`
- Bump minor: `npm run bump:minor -- --desc "Short English summary"`
