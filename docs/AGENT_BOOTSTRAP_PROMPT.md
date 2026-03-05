# Interactive Ball Game Repository — Bootstrap & Setup Guide

## Project Overview

**Назначение репозитория:**  
Создание интерактивной веб-игры — на белом фоне движется чёрный шарик, который следует за кликами мыши. После завершения настройки и включения GitHub Pages, игра сразу же будет доступна и функциональна.

**Используемые технологии:**
- React 19+ с TypeScript
- Vite (сборщик и dev-server)
- GitHub Pages (хостинг)
- Строгая модель AI-agent workflow с обязательным версионированием

**Этап выполнения:**
Это полностью автоматизированный bootstrap prompt для создания готового репозитория с одной командой. Скопируйте содержимое этого документа в поле "Jumpstart your project with Copilot" при создании репозитория на GitHub.

---

## Фаза 1: Холодный старт репозитория

### 1.1 Инициализация базовой структуры

Агент должен создать или убедиться в наличии следующей структуры:

```
.
├── .github/
│   └── copilot-instructions.md
├── .gitignore
```
.
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── docs/
│   ├── GAME_LOGIC.md
│   └── TODO.md
├── public/
│   └── (assets if needed)
├── scripts/
│   └── update-version.js
├── src/
│   ├── components/
│   │   └── BallGame.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   └── i18n.ts (if multilingual support needed)
├── .gitignore
├── AI_AGENT_INSTRUCTIONS.md
├── AGENT_BOOTSTRAP_PROMPT.md (this file)
├── build-notes.md
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── version.json
```

### 1.2 Убедиться в наличии и актуальности `package.json`

Проверить наличие следующих зависимостей и скриптов:

```json
{
  "name": "interactive-ball-game",
  "private": true,
  "version": "2026w10-0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "echo \"No tests configured\"",
    "lint": "eslint .",
    "preview": "vite preview",
    "bump:build": "node scripts/update-version.js",
    "bump:minor": "node scripts/update-version.js --minor"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "typescript": "~5.9.3",
    "vite": "^7.3.1"
  }
}
```

Если файл существует, обновить версию на `2026w10-0.1` и убедиться в наличии npm скриптов.

### 1.3 Убедиться в наличии основных конфигов

Должны быть созданы или обновлены:
- `vite.config.ts` — конфиг Vite с поддержкой React
- `tsconfig.json` — базовая конфигурация TypeScript
- `tsconfig.app.json` — конфиг для приложения
- `tsconfig.node.json` — конфиг для Node.js скриптов
- `eslint.config.js` — конфиг ESLint
- `.gitignore` — исключить `node_modules/`, `dist/`, `.env`

---

## Фаза 2: Обязательная система версионирования и workflow

Это **ключевое требование**, которое должно быть реализовано полностью.

### 2.1 Создать `version.json`

```json
{
  "weekCode": "2026w10",
  "minor": 0,
  "build": 1,
  "currentVersion": "2026w10-0.1"
}
```

### 2.2 Создать `scripts/update-version.js`

Скрипт должен:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'version.json');
const packageFile = path.join(__dirname, '..', 'package.json');
const buildNotesFile = path.join(__dirname, '..', 'build-notes.md');

// Получить текущую неделю (ISO week)
function getCurrentWeekCode() {
  const date = new Date();
  const year = date.getFullYear();
  const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}w${String(week).padStart(2, '0')}`;
}

// Прочитать текущую версию
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

// Парсить аргументы
const args = process.argv.slice(2);
const isMinor = args.includes('--minor');
const descIdx = args.indexOf('--desc');
const description = descIdx !== -1 ? args[descIdx + 1] : 'Updates';

const currentWeek = getCurrentWeekCode();
const weekChanged = versionData.weekCode !== currentWeek;

let newWeek = versionData.weekCode;
let newMinor = versionData.minor;
let newBuild = versionData.build;

if (weekChanged) {
  newWeek = currentWeek;
  newMinor = 0;
  newBuild = 1;
} else if (isMinor) {
  newMinor++;
  newBuild = 1;
} else {
  newBuild++;
}

const newVersion = `${newWeek}-${newMinor}.${newBuild}`;

// Обновить version.json
versionData.weekCode = newWeek;
versionData.minor = newMinor;
versionData.build = newBuild;
versionData.currentVersion = newVersion;

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');

// Обновить package.json
const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
packageData.version = newVersion;
fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');

// Добавить запись в build-notes.md
const noteEntry = `- ${newVersion} — ${description}\n`;
let buildNotes = '';
if (fs.existsSync(buildNotesFile)) {
  buildNotes = fs.readFileSync(buildNotesFile, 'utf8');
}
if (!buildNotes.includes('# Build Notes')) {
  buildNotes = '# Build Notes\n\n' + buildNotes;
}
fs.writeFileSync(buildNotesFile, buildNotes + noteEntry);

console.log(`✓ Version bumped to ${newVersion}`);
```

### 2.2.1 Убедиться в наличии `build-notes.md`

```markdown
# Build Notes

- 2026w10-0.1 — Initial repository bootstrap with interactive ball game.
```

---

## Фаза 3: Инструкции для AI-агента (обязательно)

### 3.1 Создать `AI_AGENT_INSTRUCTIONS.md`

Этот файл содержит политику работы агента в репозитории:

```markdown
# AI Agent Instructions

## Language Policy
- User-facing chat replies: **Russian**
- File content (code/docs/config): **English only**

## Versioning Strategy

Version format: `<weekCode>-<minor>.<build>`
- `weekCode`: current ISO week (e.g., `2026w10`)
- `minor`: minor version (reset on week change)
- `build`: incremental build number

### Mandatory Version Bump After Any Tracked File Change

After modifying ANY tracked file (except docs, README updates):
1. Run: `npm run bump:build -- --desc "Short English summary"`
2. Verify version in `version.json` and `package.json`
3. Run: `npm run typecheck` or `npm run build` to validate
4. Commit with format: `<version>: <description>`

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
2. Bump version: `npm run bump:build -- --desc "..."`
3. Verify: `npm run typecheck && npm run build`
4. Commit: `<version>: <description>`
5. Push to GitHub

## File Locations to Know

- Game component: `src/components/BallGame.tsx`
- Main app: `src/App.tsx`
- Game logic docs: `docs/GAME_LOGIC.md`
- Vite config: `vite.config.ts`
- Version files: `version.json`, `package.json` (sync both)
```

### 3.2 Создать `.github/copilot-instructions.md`

Компактная версия для быстрого обращения:

```markdown
# Repository Copilot Workflow

## Operational Rules
- User-facing chat replies must be in Russian.
- File content (code/docs/config) must be in English.
- After any tracked file change, run version bump:
  - `npm run bump:build -- --desc "Short English summary"`
  - `npm run bump:minor -- --desc "Short English summary"`
- Keep version synchronized in `version.json` and `package.json`.
- Ensure `build-notes.md` gets appended on each bump.
- Use commit message format: `<version>: <description>`.
- Standard sequence: change files -> bump version -> verify -> commit.
- After any source change, review and update domain docs if impacted.

## Key Documentation
- `README.md` — project overview
- `docs/GAME_LOGIC.md` — game mechanics
- `docs/TODO.md` — roadmap
- `src/components/BallGame.tsx` — game component

## Development Commands
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Lint: `npm run lint`
- Dev: `npm run dev`
- Bump build: `npm run bump:build -- --desc "Short English summary"`
- Bump minor: `npm run bump:minor -- --desc "Short English summary"`
```

---

## Фаза 4: Создание интерактивной мини-игры

### 4.1 Создать `src/components/BallGame.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

export const BallGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ballPos, setBallPos] = useState<Position>({ x: 400, y: 300 });
  const [ballVel, setBallVel] = useState<Velocity>({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const BALL_RADIUS = 20;
  const FRICTION = 0.98;
  const ACCELERATION = 0.5;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Обработчик клика мыши
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Вычислить вектор направления от шарика к клику
    const dx = clickX - ballPos.x;
    const dy = clickY - ballPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const normalX = (dx / distance) * ACCELERATION;
      const normalY = (dy / distance) * ACCELERATION;

      setBallVel({
        x: ballVel.x + normalX,
        y: ballVel.y + normalY,
      });
    }
  };

  // Основной игровой цикл
  useEffect(() => {
    const animate = () => {
      setBallPos((prev) => {
        let newX = prev.x + ballVel.x;
        let newY = prev.y + ballVel.y;

        // Отскок от стенок
        if (newX - BALL_RADIUS < 0) {
          newX = BALL_RADIUS;
          setBallVel((v) => ({ ...v, x: Math.abs(v.x) * 0.9 }));
        }
        if (newX + BALL_RADIUS > CANVAS_WIDTH) {
          newX = CANVAS_WIDTH - BALL_RADIUS;
          setBallVel((v) => ({ ...v, x: -Math.abs(v.x) * 0.9 }));
        }
        if (newY - BALL_RADIUS < 0) {
          newY = BALL_RADIUS;
          setBallVel((v) => ({ ...v, y: Math.abs(v.y) * 0.9 }));
        }
        if (newY + BALL_RADIUS > CANVAS_HEIGHT) {
          newY = CANVAS_HEIGHT - BALL_RADIUS;
          setBallVel((v) => ({ ...v, y: -Math.abs(v.y) * 0.9 }));
        }

        // Применить трение
        setBallVel((v) => ({
          x: v.x * FRICTION,
          y: v.y * FRICTION,
        }));

        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ballVel]);

  // Отрисовка на Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистить холст (белый фон)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Нарисовать шарик (черный)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, [ballPos]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Interactive Ball Game</h1>
      <p>Click anywhere on the white canvas to make the ball move!</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        style={{
          border: '1px solid #cccccc',
          cursor: 'pointer',
          display: 'block',
          margin: '20px auto',
          backgroundColor: '#ffffff',
        }}
      />
      <p>Ball position: ({Math.round(ballPos.x)}, {Math.round(ballPos.y)})</p>
    </div>
  );
};
```

### 4.2 Обновить `src/App.tsx`

```typescript
import { BallGame } from './components/BallGame';
import './App.css';

function App() {
  return (
    <div className="app">
      <BallGame />
    </div>
  );
}

export default App;
```

### 4.3 Обновить `src/App.css`

```css
.app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1 {
  color: #333;
  margin-bottom: 10px;
}

p {
  color: #666;
  margin: 10px 0;
}
```

### 4.4 Убедиться в наличии `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 4.5 Убедиться в наличии `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interactive Ball Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Фаза 5: Документация проекта

### 5.1 Создать `docs/GAME_LOGIC.md`

```markdown
# Game Logic

## Overview

Interactive Ball Game is a simple physics-based web application where:
- A black ball (radius 20px) moves on a white canvas (800x600px)
- User clicks on canvas to impart velocity to the ball
- Ball bounces off canvas edges
- Ball gradually slows down due to friction

## Mechanics

### Movement
- Ball starts at center (400, 300)
- Each click adds acceleration towards that point
- Velocity magnitude depends on click distance

### Physics
- Friction coefficient: 0.98 (98% retention per frame)
- Acceleration per click: 0.5 units per pixel distance
- Ball radius: 20 pixels
- Bounce energy loss: 10% (0.9 multiplier)

### Canvas Boundaries
- Width: 800px
- Height: 600px
- Ball bounces off all edges with energy loss

## Future Enhancements
- Multiple balls
- Gravity simulation
- Obstacle/wall placement
- Score/timer mechanics
```

### 5.2 Создать `docs/TODO.md`

```markdown
# Project Roadmap

## Current Features
- [x] Basic ball rendering
- [x] Click-based movement
- [x] Physics with friction
- [x] Canvas boundary collision
- [x] React + TypeScript setup
- [x] Vite build configuration

## TODO (Phase 2)
- [ ] Add sound effects on click and bounce
- [ ] Implement gravity (optional toggle)
- [ ] Add multi-ball game mode
- [ ] Statistics/high-score tracking
- [ ] Mobile touch support
- [ ] Velocity visualization
- [ ] Speed counter display

## Known Issues
- None reported yet

## Technical Debt
- Consider extracting physics into separate module
- Add unit tests for collision detection
- Performance optimization for mobile devices
```

### 5.3 Актуализировать `README.md`

```markdown
# Interactive Ball Game

A fun, interactive React-based web game where you make a black ball move by clicking on the canvas.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Development

```bash
# Clone the repository
git clone <your-repo-url>
cd interactive-ball-game

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

### GitHub Pages Deployment

GitHub Pages is configured to deploy automatically via GitHub Actions on every push to `main`.

1. Push your code to GitHub:
   ```bash
   git push origin main
   ```

2. Go to repository Settings > Pages > set Source to "GitHub Actions"

3. The workflow will automatically build and deploy your app

4. Access your game at: `https://your-username.github.io/your-repo-name/`

Note: The repository name in `vite.config.ts` should match your actual GitHub repository name.

## Game Controls

Click anywhere on the white canvas to push the ball in that direction. The ball will:
- Accelerate towards your click
- Bounce off canvas edges
- Gradually slow down due to friction

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Canvas API** - 2D graphics rendering

## Project Structure

```
src/
  components/
    BallGame.tsx    # Main game component
  App.tsx          # Root component
  main.tsx         # Entry point
docs/
  GAME_LOGIC.md    # Game mechanics documentation
  TODO.md          # Roadmap and known issues
scripts/
  update-version.js # Version management script
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

## License

MIT License - feel free to use and modify!

## Contributing

1. Make your changes
2. Bump version: `npm run bump:build -- --desc "..."`
3. Validate: `npm run typecheck && npm run build`
4. Commit: `<version>: <description>`
5. Push and create PR

See [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for AI agent workflow guidelines.
```

---

## Фаза 6: Проверки и GitHub Pages

Perform all steps below end-to-end. Do not stop at analysis.

---

## Global Rules

1. Chat/output language for user communication: **Russian**.
2. File/code language: **English only**.
3. Keep changes minimal and targeted; do not add unrelated features.
4. If a required file already exists, update it to match the contract below.
5. If equivalent logic exists under different names/paths, either align it or replace with the contract structure.
6. After all edits and version bump are done, create a git commit immediately in the same task.

---

## Required Files and Exact Intent

### 1) `AI_AGENT_INSTRUCTIONS.md`

Create or update with these policy blocks:

- Language policy (chat Russian, files English).
- Version format: `<weekCode>-<minor>.<build>`.
- Mandatory bump rule after **any tracked file change**.
- Commands:
  - `npm run bump:build -- --desc "Short English summary"`
  - `npm run bump:minor -- --desc "Short English summary"`
- Explain that version metadata is synchronized in `version.json` and `package.json`, and notes appended to `build-notes.md`.
- Commit message format requirement: `<version>: <description>`.
- Standard git workflow sequence:
  1) apply changes,
  2) run bump,
  3) run verification,
  4) commit.

### 2) `.github/copilot-instructions.md`

Create or update with concise operational rules mirroring `AI_AGENT_INSTRUCTIONS.md` plus:

- “After any source change, review and update domain docs if impacted.”
- A `Key Documentation` section listing project-specific docs/modules the agent must consult.
- Development command list relevant to the repository (at minimum build/typecheck/test + bump commands).

### 3) `version.json`

Create if missing with this schema:

```json
{
  "weekCode": "2026w10",
  "minor": 0,
  "build": 1,
  "currentVersion": "2026w10-0.1"
}
```

If it exists, preserve continuity and schema consistency.

### 4) `build-notes.md`

Create if missing:

```md
# Build Notes

- 2026w10-0.1 — Initial snapshot version entry.
```

Ensure future bumps append lines in format:

`- <version> — <description>`

### 5) `scripts/update-version.js`

Create or update a Node.js script that:

- Supports args:
  - `--minor` (increment minor, reset build to 1)
  - `--desc "..."` (description for notes)
- On regular bump:
  - increments `build` by 1.
- On week rollover:
  - sets `weekCode` to current,
  - resets to `minor=0`, `build=1`.
- Updates:
  - `version.json`,
  - `package.json` field `version`,
  - appends to `build-notes.md`.
- If `--desc` omitted, tries to use last git commit message; fallback to default text.
- Prints the new version to stdout.

### 6) `package.json`

Ensure scripts exist (add if absent, preserve other scripts):

```json
{
  "scripts": {
    "bump:build": "node scripts/update-version.js",
    "bump:minor": "node scripts/update-version.js --minor"
  }
}
```

Do not remove existing scripts.

---

## Project Documentation Synchronization Contract

Create or update documentation policy in both instruction files:

- After code changes, check domain docs (game logic / business rules / architecture / roadmap equivalents).
- If behavior, parameters, UI, or flows changed, update docs in same task.

If repository has no such docs, create minimal placeholders:

- `docs/GAME_LOGIC.md` (or domain-equivalent name),
- `docs/TODO.md`.

Use concise, factual English content.

---

### 6.1 Выполнить все проверки

Команды для валидации репозитория (выполнить по порядку):

```bash
# 1. Установить зависимости (если еще не установлены)
npm install

# 2. Проверить типы TypeScript
npm run typecheck

# 3. Проверить синтаксис (линтинг)
npm run lint

# 4. Собрать проект
npm run build

# 5. Просмотреть предпросмотр (опционально)
npm run preview
```

Все команды должны завершиться успешно без ошибок.

### 6.2 Первый bump версии после инициализации

```bash
npm run bump:build -- --desc "Initialize interactive ball game with AI agent workflow"
```

Проверить:
- `version.json` обновлён с новой версией
- `package.json` содержит новую версию в поле `version`
- `build-notes.md` имеет новую запись

### 6.3 Git коммит

```bash
git add -A
git commit -m "<newVersion>: Initialize interactive ball game with AI agent workflow"
git push origin main
```

Где `<newVersion>` — версия из `version.json` (например, `2026w10-0.1`).

### 6.4 Настройка GitHub Pages

1. **Обновить `vite.config.ts`** для GitHub Pages:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'your-repo-name' with actual repository name
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/your-repo-name/' : '/',
}))
```

2. **Создать `.github/workflows/deploy.yml`** для автоматического деплоя:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. **В GitHub репозитории:**
   - Перейти в Settings > Pages
   - Выбрать Source: "GitHub Actions"
   - Workflow автоматически запустится при первом пуше в `main`

После первого успешного деплоя игра будет доступна по адресу:
```
https://<username>.github.io/<repo-name>/
```

---

## Фаза 7: Итоговая проверка

Убедиться, что выполнены все требования:

- [ ] `AI_AGENT_INSTRUCTIONS.md` создан и содержит политику
- [ ] `.github/copilot-instructions.md` создан и полен
- [ ] `.github/workflows/deploy.yml` создан для автоматического деплоя
- [ ] `version.json` существует и имеет корректный формат
- [ ] `build-notes.md` существует с записями о версиях
- [ ] `scripts/update-version.js` работает и увеличивает версию
- [ ] `package.json` содержит npm скрипты для bump
- [ ] `vite.config.ts` настроен для GitHub Pages с правильным base path
- [ ] `src/components/BallGame.tsx` создана и функциональна
- [ ] `src/App.tsx` импортирует и использует BallGame
- [ ] `docs/GAME_LOGIC.md` задокументирована механика
- [ ] `docs/TODO.md` содержит roadmap
- [ ] `README.md` описывает проект и инструкции
- [ ] Все проверки пройдены: `typecheck`, `lint`, `build`
- [ ] Версия bumped и закоммичена
- [ ] GitHub Pages настроена на "GitHub Actions" в Settings

---

## Итоговый отчет формата

После завершения всех этапов агент должен предоставить на **русском языке** отчет с разделами:

### Что сделано
- Список всех созданных/обновленных файлов
- Краткое описание каждого компонента (игра, версионирование, документация)

### Измененные файлы
- `version.json` — версионирование
- `package.json` — скрипты и версия
- `build-notes.md` — история версий
- `scripts/update-version.js` — скрипт бампинга
- `AI_AGENT_INSTRUCTIONS.md` — политика агента
- `.github/copilot-instructions.md` — quick reference
- `.github/workflows/deploy.yml` — автоматический деплой на GitHub Pages
- `vite.config.ts` — конфиг для Pages
- `src/components/BallGame.tsx` — игра
- `src/App.tsx` — главный компонент
- `docs/GAME_LOGIC.md` — механика
- `docs/TODO.md` — roadmap
- `README.md` — документация

### Проверки
- ✓ `npm run typecheck` — успешно
- ✓ `npm run lint` — успешно (или с предупреждениями)
- ✓ `npm run build` — успешно, бинарник создан в `dist/`
- ✓ Версия bumped до `<resultVersion>`
- ✓ Git коммит создан: `<resultVersion>: Initialize...`

### Итоговая версия
`<resultVersion>` (из `version.json`)

### Что осталось
- [ ] Запушить в GitHub (пользователю)
- [ ] Включить GitHub Pages: Settings > Pages > Source: "GitHub Actions"
- [ ] После первого деплоя проверить игру по URL

### GitHub Pages URL
```
https://<username>.github.io/<repo-name>/
```

---

## Дополнительные замечания

### Для пользователя (после выполнения агентом)

1. **Клонирование репозитория:**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   npm install
   npm run dev
   ```

2. **Локальная разработка:**
   - Проект доступен на http://localhost:5173
   - Изменения отражаются в реальном времени (HMR)

3. **Добавление новых функций:**
   - Изменить код → bump версии → проверить → коммитить
   - Обновлять `docs/GAME_LOGIC.md` при изменении механики
   - Обновлять `docs/TODO.md` при появлении новых идей

4. **Публикация обновлений:**
   - Просто сделайте `git push` — GitHub Actions автоматически соберёт и задеплоит изменения
   - Проверьте статус деплоя во вкладке Actions на GitHub

### Для AI-агента (долгосрочная политика)

- Всегда следовать версионированию (никаких исключений)
- Синхронизировать версию в `version.json` и `package.json`
- После кода → bump → проверка → коммит (в этом порядке)
- Обновлять документацию вместе с кодом
- Если возникают проблемы, консультироваться с документацией в `.github/copilot-instructions.md`

---

## Завершение

Это распоряжение готово к использованию как **GitHub Copilot Bootstrap Prompt**.

Скопируйте содержимое этого документа в поле "Jumpstart your project with Copilot" при создании репозитория, и Copilot выполнит все шаги автоматически, предоставив готовый, полностью функциональный репозиторий с:
- Интерактивной игрой (чёрный шарик на белом фоне)
- Строгой системой версионирования
- Обязательным AI-agent workflow
- Автоматическим деплоем на GitHub Pages через GitHub Actions
- Полной документацией

После выполнения нужно:
1. Запушить код в GitHub
2. В Settings > Pages выбрать Source: "GitHub Actions"
3. Игра автоматически задеплоится и будет доступна в интернете
