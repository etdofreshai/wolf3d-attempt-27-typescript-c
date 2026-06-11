# Wolfenstein 3D — Monorepo

A collection of **Wolfenstein 3D builds**, each playable in the browser through an
in‑browser DOSBox ([js-dos](https://js-dos.com)), plus a **launcher homepage** that
starts any of them from one place.

The goal is to compare builds side by side as we modify the game: the untouched
retail binary, the binary compiled from id Software's released source, and our
patched source tree — all running on the same data files.

```
┌──────────────┐     launch ▶     ┌──────────────────────────────┐
│  Home (5170) │ ───────────────► │  Retail DOS         (5171)   │
│   launcher   │ ───────────────► │  Source DOS Build   (5172)   │
│              │ ───────────────► │  Modified Source    (5173)   │
└──────────────┘                  └──────────────────────────────┘
```

## Quick start

Requires **Node 20.19+ or 22.12+** and npm.

```bash
npm install        # installs every workspace (deps are hoisted to the root)
npm run dev        # starts the launcher + all game apps concurrently
```

Then open the launcher: **http://localhost:5170**

Each card on the launcher opens one game build in a new tab and shows whether its
dev server is currently up. `npm run dev` starts all four servers, so they will be.

To run just one build:

```bash
npm run dev:dos-page              # or dev:source-dos, dev:source-modified-dos, dev:home
```

## The builds

| Build                  | Workspace                   | Port | What it is |
| ---------------------- | --------------------------- | ---- | ---------- |
| **Launcher**           | `@wolf3d/home`              | 5170 | This homepage. Lists and launches the builds below. |
| **Retail DOS**         | `@wolf3d/dos-page`          | 5171 | The original retail `WOLF3D.EXE` + WL6 data, unmodified. The reference build. |
| **Source DOS Build**   | `@wolf3d/source-dos`        | 5172 | `WOLF3D.EXE` built from id Software's released source (`source/WOLFSRC`). Can recompile in-browser when a Borland C++ toolchain is present. |
| **Modified Source DOS**| `@wolf3d/source-modified-dos` | 5173 | The same source pipeline tracking our patches, plus frame/audio/state capture and a URL-driven demo harness. |

The launcher's catalog lives in
[`apps/home/src/versions.ts`](apps/home/src/versions.ts) — it is the single source
of truth for what appears on the homepage.

## Repository layout

```
.
├── apps/
│   ├── home/                 # launcher homepage (@wolf3d/home)
│   ├── dos-page/             # retail build (@wolf3d/dos-page)
│   ├── source-dos/           # source-compiled build (@wolf3d/source-dos)
│   └── source-modified-dos/  # modified source build (@wolf3d/source-modified-dos)
├── source/                   # id Software Wolfenstein 3D source release (WOLFSRC)
├── steam/                    # shipped game data (WL6 assets, retail EXE, DOSBox)
├── deps/                     # vendored DOS toolchain (Borland C++) for rebuilds
├── tsconfig.base.json        # shared TypeScript config, extended by every app
└── package.json              # npm workspaces + orchestration scripts
```

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
monorepo. A single `npm install` at the root installs every app and hoists shared
dependencies (notably `js-dos`) into the root `node_modules`, which the apps' Vite
dev-server middleware reads from.

## Game data & toolchain

The builds need the original game data and (optionally) a DOS C compiler. These are
vendored in the repo, so a fresh clone runs out of the box:

- **WL6 data** (`steam/base/*.WL6`, retail `WOLF3D.EXE`) — mounted by all builds.
- **Source release** (`source/WOLFSRC/`) — the source the two source builds compile
  and run.
- **Borland C++** (`deps/borland/`) — when present, the source builds can recompile
  `WOLF3D.EXE` in the browser before launching. The dev server also auto-detects a
  local install via the `BORLANDC_ROOT` / `BC_ROOT` environment variables or common
  paths like `C:\BC30`.

> Wolfenstein 3D and its data files are © id Software. They are included here only
> for local development and are not redistributable.

## Adding a new build

The launcher is data-driven, so adding a build is mechanical:

1. **Scaffold the app** under `apps/<id>/` (copy an existing one as a starting
   point) with its own `package.json`, `vite.config.ts`, and `index.html`.
2. **Pin a fixed port** in its `vite.config.ts`:
   ```ts
   server: { port: 5174, strictPort: true }
   ```
3. **Wire it into the root scripts** in [`package.json`](package.json): add a
   `dev:<id>` script and reference it from the `dev` (and `preview`) `concurrently`
   line.
4. **List it** in [`apps/home/src/versions.ts`](apps/home/src/versions.ts) with the
   matching `devPort`. It now shows on the homepage automatically.

Workspaces are matched by the `apps/*` glob, so no root config change is needed for
the new package itself.

## Scripts

Run from the repo root:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the launcher and all game apps concurrently. |
| `npm run dev:<app>` | Start a single app (`home`, `dos-page`, `source-dos`, `source-modified-dos`). |
| `npm run build` | Type-check and production-build every app. |
| `npm run check` | Type-check every app (`tsc --noEmit`). |
| `npm run preview` | Serve the production builds locally. |

Each app exposes the same `dev` / `build` / `check` / `preview` scripts, runnable
directly with `npm run <script> --workspace @wolf3d/<app>`.
