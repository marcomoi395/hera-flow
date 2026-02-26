# Copilot Instructions

## Commands

```bash
npm run dev             # Start dev server (Electron + Vite HMR)
npm run build           # Typecheck + build for production
npm run lint            # ESLint
npm run format          # Prettier (write)
npm run typecheck       # Run both node and web typechecks
npm run typecheck:node  # Typecheck main/preload only
npm run typecheck:web   # Typecheck renderer only
```

No test suite exists yet.

## Architecture

This is an **Electron + TypeScript** desktop app (elevator maintenance management) built with `electron-vite`. It has three distinct processes:

### Main process (`src/main/`)
- Entry: `src/main/index.ts` — creates the BrowserWindow, connects MongoDB, registers all `ipcMain` handlers
- `configs/database.ts` — Mongoose singleton (`Database.getInstance()`)
- `models/` — Mongoose schemas/models
- `services/` — Static service classes with async methods (e.g., `CustomerService`)

### Preload (`src/preload/`)
- `index.ts` — Bridges main↔renderer: wraps `ipcRenderer.invoke()` calls into a typed `api` object, exposes it via `contextBridge.exposeInMainWorld('api', api)`
- `index.d.ts` — Declares `window.api` and `window.electron` global types for the renderer

### Renderer (`src/renderer/`)
- Vanilla TypeScript (`src/renderer/src/renderer.ts`), **no framework**
- Calls `window.api.*` to communicate with main
- Renders HTML by building template strings and setting `innerHTML`

## IPC Convention

Adding a new feature requires coordinated changes across four files:

1. **`src/main/services/`** — Add a static method to a service class
2. **`src/main/index.ts`** — Register `ipcMain.handle('channel-name', ...)` calling the service
3. **`src/preload/index.ts`** — Add a typed wrapper in the `api` object using `ipcRenderer.invoke('channel-name', ...)`
4. **`src/preload/index.d.ts`** — Update the `Window['api']` interface with the new method signature

## Data Layer

- Database: **MongoDB** via Mongoose; connection string from `MONGO_URL` env var (`.env` file, loaded by `dotenv` in `src/main/index.ts`)
- `NODE_ENV=dev` enables Mongoose query debug logging with color
- **Soft delete**: records use `isDeleted: boolean` (default `false`); all queries filter `{ isDeleted: false }`
- Collections use explicit names: `customer`, `maintenance_contract`, `warranty_history` (Elevator uses Mongoose default)
- Related models must be imported in the service file before `.populate()` calls — this registers them with Mongoose (see `customer.service.ts`)

## TypeScript Setup

- Split tsconfig: `tsconfig.node.json` (main + preload) and `tsconfig.web.json` (renderer)
- `any` is a **warning**, not an error — avoid in new code but won't block builds
- Unused imports are warnings and auto-fixable via `eslint --fix`

## Code Style

Prettier config: single quotes, no semicolons, 4-space indent, 100-char line width, no trailing commas, LF line endings.

`no-console` is **off** — console logging is acceptable in main process code.
