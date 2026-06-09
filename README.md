# wolf3d-attempt-27-typescript-c

TypeScript-first Wolfenstein 3D porting experiments that keep the original DOS
source and retail data boundaries explicit.

## Current slice

The first app lives in `apps/dos-page`. Its first screen boots the original DOS
executable and repo-local WL6 data through a browser DOSBox/WASM layer. This
runs the original DOS program/data path in the browser; it is not yet a
source-to-WASM build of the released C/ASM source tree.

The same app also keeps a TypeScript source-probe page with a 320x200 raycast
canvas, fixed-tic movement, procedural wall shading, and a browser-local WL6 map
loader.

The loader accepts `MAPHEAD.WL6` and `GAMEMAPS.WL6` through file inputs and
keeps those bytes in memory only. It follows the original `ID_CA` path:

- read the MAPHEAD RLEW tag and map-header offsets
- read each `maptype` header from GAMEMAPS
- Carmack-expand the compressed plane chunk
- skip the RLEW length word produced by the Carmack-expanded chunk
- RLEW-expand planes 0 and 1 into the 64x64 DOS map buffers

Run it locally:

```powershell
npm install
npm run dev
```

Then open the printed Vite URL and select your local WL6 map files.

During `npm run dev`, the page also exposes a `Local WL6` button when
`steam/base/MAPHEAD.WL6` and `steam/base/GAMEMAPS.WL6` exist locally. That
development endpoint is not part of the production bundle.

The original DOS runner expects these local files under `steam/base`:

- `WOLF3D.EXE`
- `AUDIOHED.WL6`
- `AUDIOT.WL6`
- `CONFIG.WL6`
- `GAMEMAPS.WL6`
- `MAPHEAD.WL6`
- `VGADICT.WL6`
- `VGAGRAPH.WL6`
- `VGAHEAD.WL6`
- `VSWAP.WL6`

## Source-to-WASM boundary

Running the released source directly as WebAssembly is a separate porting track.
The source tree is Borland/Turbo C-era DOS code with segmented pointer
qualifiers, inline x86 assembly, direct VGA and sound-card port I/O, BIOS/DOS
interrupts, and standalone `.ASM` modules. Those pieces need browser host
replacements before the original `WL_MAIN.C`/`GameLoop` path can compile to
WASM.

Validation:

```powershell
npm run check
npm run build
```

This repo is intended to contain **no proprietary game assets** in new tracked
work. The local `steam/` folder is runtime input only.

## Folder layout

### `steam/`

Private local runtime data copied or installed from the Steam release of **Wolfenstein 3D full version / WL6 data**.

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

Tracked files should remain limited to documentation, placeholder files, build/project scaffolding, and original code written for the downstream port.

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
