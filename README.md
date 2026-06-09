# wolf3d-monorepo

A workspace for Wolfenstein 3D experiments that keeps the original DOS materials available as reference inputs while new implementations live in first-class apps.

The first app is a TypeScript browser page at `apps/dos-page`. It emulates the shape of the DOS game loop with fixed-point movement, tic timing, and a small raycasting renderer. It does not decode or embed proprietary art/map/audio assets.

## Commands

```powershell
npm install
npm run dev
npm run check
npm run build
```

`npm run dev` starts the TypeScript app through Vite.

## Folder layout

### `apps/`

Tracked apps and experiments that can grow independently inside the monorepo.

- `apps/dos-page/`: TypeScript canvas page inspired by `source/WOLFSRC`.

### `steam/`

Local runtime data copied or installed from the Steam release of **Wolfenstein 3D full version / WL6 data**.

Typical files, when present locally, are the retail `*.WL6` data files used by the game runtime, such as map, graphics, audio, and page data. These files are proprietary and must stay local.

Rules:

- Do not commit files from `steam/`.
- Do not print, dump, hash, screenshot, or preserve proprietary asset contents in tracked files.
- Use this folder only as private runtime input for local verification.
- Keep only `steam/.gitkeep` tracked so the folder exists in fresh clones.

### `source/`

Placeholder for the original id Software Wolfenstein 3D source release used as implementation/reference input.

For the current porting workflow, this means the original id Software source tree, commonly placed as:

```text
source/WOLFSRC/
```

That tree corresponds to the original Wolfenstein 3D DOS C/ASM source release, not Wolf4SDL, ECWolf, Chocolate Wolfenstein, or any other source port.

Rules:

- Use this folder only for original id Software source-release material when license/provenance permits.
- Do not put third-party source ports here.
- Downstream projects should treat `source/WOLFSRC` as the only implementation/reference source for original-source-only work.
- This template tracks only `source/.gitkeep`; it does not redistribute the source release.

## Version mapping

- `steam/` represents the local Steam-provided Wolfenstein 3D retail data files, typically the full WL6 data set.
- `source/WOLFSRC/` represents the original id Software Wolfenstein 3D DOS source release used for source-only porting reference.

## Safety policy

This template is designed to keep proprietary and license-sensitive material out of git history by default.

New tracked files should remain limited to documentation, placeholder files, build/project scaffolding, and original code written for the downstream port.

Do **not** commit:

- Steam game data or `*.WL6` runtime assets.
- Credentials, auth files, tokens, `.env` files, or secrets.
- Decoded asset dumps, screenshots, hashes, map tile dumps, or extracted proprietary content.
- Code copied from Wolf4SDL, ECWolf, Chocolate Wolfenstein, or other source ports.

## Intended use

Create a new project from this template, then locally add:

```text
steam/        # private WL6 runtime data, ignored by git
source/WOLFSRC/ # local original id Software source release, ignored by git in this template
```

Downstream projects can then build portable C + SDL3 implementations while keeping provenance and asset boundaries explicit.
