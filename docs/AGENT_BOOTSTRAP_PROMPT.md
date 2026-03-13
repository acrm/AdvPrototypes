# Interactive Ball Game Bootstrap Prompt

Use this prompt in GitHub's "Jumpstart your project with Copilot" field to create a complete repository in one pass.

## Goal

Create a ready-to-run React + TypeScript + Vite repository for a simple interactive ball game and prepare it for automatic GitHub Pages deployment.

## Non-Negotiable Rules

1. User-facing chat/output must be in Russian.
2. All repository files must be in English.
3. Complete the work end-to-end; do not stop at analysis.
4. Keep changes minimal and targeted.
5. If a required file already exists, update it to match this contract instead of creating duplicates.
6. After any tracked file change, finish by running exactly one bump command. The bump script must create the git commit automatically after successful verification. Do not create a second manual commit.

## Repository Contract

Ensure this structure exists:

```text
.github/copilot-instructions.md
.github/workflows/deploy.yml
AI_AGENT_INSTRUCTIONS.md
build-notes.md
docs/GAME_LOGIC.md
docs/TODO.md
scripts/update-version.js
src/components/BallGame.tsx
src/App.tsx
src/App.css
src/main.tsx
src/index.css
index.html
package.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
eslint.config.js
vite.config.ts
version.json
```

## Package Contract

`package.json` must:

- use a private ESM project
- keep `version` synchronized with `version.json`
- include scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `test`
  - `lint`
  - `preview`
  - `bump:build`
  - `bump:minor`
- include React 19, ReactDOM 19, TypeScript 5.x, Vite, `@vitejs/plugin-react`, and the ESLint packages required by the repo

## Versioning And Commit Contract

Create or align `version.json` with this schema:

```json
{
  "weekCode": "2026w10",
  "minor": 0,
  "build": 1,
  "currentVersion": "2026w10-0.1"
}
```

Create or align `build-notes.md` with this format:

```md
# Build Notes

- 2026w10-0.1 — Initial repository bootstrap with interactive ball game.
```

Create or update `scripts/update-version.js` so that it:

1. Supports `--minor` and `--desc "..."`.
2. Falls back to the last git commit subject when `--desc` is omitted, then to `Updates` if git history is unavailable.
3. Uses version format `<weekCode>-<minor>.<build>`.
4. Resets to `minor=0`, `build=1` when the week changes.
5. Increments `minor` and resets `build=1` for `--minor`.
6. Increments only `build` for a normal bump.
7. Updates `version.json`.
8. Updates `package.json` field `version`.
9. Appends `build-notes.md` with `- <version> — <description>`.
10. Runs `npm run build`.
11. If build succeeds, runs `git add -A` and creates a commit with message `<version>: <description>`.
12. If build or commit fails, exits non-zero and does not leave a newly created commit behind.
13. Prints the new version to stdout.

`package.json` scripts must call this file:

```json
{
  "scripts": {
    "bump:build": "node scripts/update-version.js",
    "bump:minor": "node scripts/update-version.js --minor"
  }
}
```

## Agent Instruction Files

Create or update both `AI_AGENT_INSTRUCTIONS.md` and `.github/copilot-instructions.md`.

They must state that:

- chat replies are in Russian
- repository files are in English
- after any tracked file change, the agent runs exactly one bump command
- the bump script synchronizes `version.json` and `package.json`, appends `build-notes.md`, verifies the build, and creates the git commit automatically
- the agent must not create a second manual commit after a successful bump
- domain documentation must be updated in the same task when behavior, parameters, UI, or flows change

## Application Contract

Create or update these files:

- `src/components/BallGame.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/main.tsx`
- `src/index.css`
- `index.html`
- `vite.config.ts`

Implementation requirements:

- a white canvas sized `800x600`
- a black ball with radius `20`
- ball starts at the center
- clicking the canvas adds velocity toward the click point
- friction coefficient `0.98`
- acceleration factor `0.5`
- wall bounces with visible energy loss
- a simple centered page layout with title and short instructions
- a position readout for the ball
- Vite base path configured for GitHub Pages in production

## Documentation Contract

Create or update:

- `docs/GAME_LOGIC.md`
- `docs/TODO.md`
- `README.md`

Documentation must be concise and factual.

Required content:

- `docs/GAME_LOGIC.md`: mechanics, physics constants, canvas bounds, future enhancements
- `docs/TODO.md`: current features, roadmap, known issues, technical debt
- `README.md`: quick start, install, dev, build, GitHub Pages deployment, versioning workflow, and a note that the bump script creates the commit automatically

## GitHub Pages Contract

Create `.github/workflows/deploy.yml` using the modern Pages deployment flow:

- trigger on push to `main`
- allow manual `workflow_dispatch`
- set permissions for `contents`, `pages`, and `id-token`
- build the project with Node.js and `npm ci`
- upload `dist` with `actions/upload-pages-artifact`
- deploy with `actions/deploy-pages`

The repository must be configured so the user only needs to select `GitHub Actions` in GitHub Settings > Pages.

## Required Execution Sequence

Perform these steps in order:

1. Create or update the required files.
2. Install dependencies if needed: `npm install`.
3. Run `npm run typecheck`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Run `npm run bump:build -- --desc "Initialize interactive ball game with AI agent workflow"`.
7. Do not create a second manual commit. The bump script must already have created the commit.
8. Push to `main` if credentials are available.
9. Tell the user to enable GitHub Pages with Source = `GitHub Actions` if that step cannot be automated.

## Acceptance Checklist

- `AI_AGENT_INSTRUCTIONS.md` exists and matches the workflow contract
- `.github/copilot-instructions.md` exists and matches the workflow contract
- `.github/workflows/deploy.yml` exists for auto-deploy
- `version.json` exists and matches the schema
- `build-notes.md` exists and includes version entries
- `scripts/update-version.js` bumps version, validates build, and auto-commits
- `package.json` contains bump scripts
- `vite.config.ts` is ready for Pages
- `src/components/BallGame.tsx` works
- `src/App.tsx` renders the game
- docs are present and current
- `npm run typecheck` succeeds
- `npm run lint` succeeds
- `npm run build` succeeds
- the bump command succeeds and creates the commit

## Final Response Format

Return the final report in Russian with these sections:

- What was created or updated
- Checks performed and their status
- Final version from `version.json`
- Commit message created by the bump script
- Remaining manual step, if any

## GitHub Pages URL Format

```text
https://<username>.github.io/<repo-name>/
```
