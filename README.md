# wolf3d-attempt-27-typescript-c

TypeScript-first Wolfenstein 3D porting experiments that keep the original DOS
source and retail data boundaries explicit.

## App tracks

This repo is being split into separate browser-facing lanes:

- `apps/launcher`: front door for the current game lanes and local tools. It
  shows the Steam/source server status, WL6 data inventory, source inventory,
  and toolchain readiness.
- `apps/dos-page`: Steam DOS executable + repo-local WL6 data through a browser
  DOSBox/WASM layer.
- `apps/source-dos`: original source-release DOS lane. It mounts
  `source/WOLFSRC`, uses the same WL6 runtime data from `steam/base`, and
  launches the source tree's `WOLF3D.EXE`. It also checks whether a local
  Borland C++ 3.0/3.1 + TASM/TLINK toolchain is available before enabling a
  rebuild path.
- `apps/source-modified-dos`: modified original-source DOS lane. It runs the
  source-built DOS image through the raw js-dos command interface so the browser
  can emit parity artifacts: PNG screenshots, WAV audio, and BIN state bundles.
- `apps/source-typescript`: browser-native TypeScript source-port scaffold. It
  starts with original-source naming (`WLMain`, `WLGame`, `WLPlay`, `WLDraw`,
  `IDCA`, `IDIN`, `IDSD`, `IDUS`, `IDVL`) and accepts the same demo plans as the
  modified DOS lane. Its `IDCA` path now loads `MAPHEAD.WL6` and
  `GAMEMAPS.WL6` locally, decodes the first WL6 map planes, places the player
  from the original spawn tile, and uses that wall plane for collision and
  raycasting. It also mirrors the first `SetupGameLevel`/`ScanInfoPlane` pass by
  extracting door records from plane 0 and static/enemy/secret counts from plane
  1 for state export and parity display.
- Port app: future portable/full port lane. This should advance after the
  original DOS/source and TypeScript artifact outputs are comparable.

`apps/source-dos` is the current second slice. On this machine,
`C:\Users\etgarcia\Downloads\BCPP31.ZIP` has been extracted into the ignored
`deps/borland` folder, so the source app can mount `BCC.EXE`, `TASM.EXE`,
`TLINK.EXE`, `INCLUDE`, and `LIB` into the browser DOSBox worker.

The Source app's Build button now rebuilds a fresh 16-bit `WOLF3D.EXE` from the
original C/ASM tree in `source/WOLFSRC`, using a browser-mounted Borland
makefile/config derived from the original `WOLF3D.PRJ`. The generated EXE is
kept in memory, exposed as a local download, and used by Start for the next
DOSBox launch.

The modified DOS and TypeScript lanes both understand base64url-encoded demo
plans in the `?demo=` query parameter. Demo steps can wait, press or hold keys,
and capture PNG/WAV/BIN artifacts. The helper script prints a ready-to-open URL:

```powershell
npm run demo:plan -- --target source-modified-dos --name boot --wait 1200 --key Enter:90 --wait 500 --capture menu --state --wav
npm run demo:plan -- --target source-typescript --name turn-test --map 0 --difficulty hard --wait 300 --key ArrowRight:250 --capture turn --state
```

Local DOS build dependencies are intentionally private. To let `apps/source-dos`
load a period compiler into DOSBox, place a licensed Borland C++ 3.0/3.1-style
install under `deps/borland` or set `BORLANDC_ROOT` / `BC_ROOT` to that install
root. The source app looks for `BCC.EXE`, `TASM.EXE`, `TLINK.EXE`, `INCLUDE`,
and `LIB`; when they are found, it mounts the toolchain privately inside the
browser DOSBox build runtime.

The official Embarcadero museum downloads for Turbo C 2.01 and Turbo C++ 1.01
are useful for comparison and partial DOS-era files, but they do not provide the
full Wolf3D build toolchain. In particular, the available museum packages do not
include `BCC.EXE` or `TASM.EXE`.

`apps/dos-page` also keeps a TypeScript source-probe page with a 320x200 raycast
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
npm run dev:all
```

Then open the launcher URL. `dev:all` uses these local ports:

```text
launcher: http://127.0.0.1:5173/
steam:    http://127.0.0.1:5174/
source:   http://127.0.0.1:5175/
modified: http://127.0.0.1:5176/
typeport: http://127.0.0.1:5177/
```

You can also run a single app:

```powershell
npm run dev:launcher
npm run dev:steam
npm run dev:source
npm run dev:source-modified
npm run dev:source-typescript
```

Then open the printed Vite URL for the app you are working on.

During `npm run dev:steam`, the page also exposes a `Local WL6` button when
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

The original-source DOS lane is different: it aims to rebuild a 16-bit DOS EXE
from `source/WOLFSRC` with period-correct DOS tools, then run that EXE in
DOSBox/js-dos against the local WL6 data.

Validation:

```powershell
npm run check
npm run build
```

`npm run check` also verifies the modeled `apps/source-typescript` actor and
projectile state-frame shapenums/tics/actions/thinks against
`source/WOLFSRC/WL_ACT2.C`, plus WL6 static-object table parity against
`source/WOLFSRC/WL_ACT1.C`, door/pushwall contract parity against
`source/WOLFSRC/WL_ACT1.C`, weapon attack-frame, player attack, and player
command contract parity against
`source/WOLFSRC/WL_AGENT.C`, audio chunk parity against
`source/WOLFSRC/AUDIOWL6.H`, weapon sprite parity against
`source/WOLFSRC/WL_DRAW.C`, enemy hitpoint parity against
`source/WOLFSRC/WL_ACT2.C`, agent helper, pickup reward, and scored treasure
bonus parity against `source/WOLFSRC/WL_AGENT.C`, actor kill score/drop parity and
damage/pain-state parity plus actor direction-table parity against
`source/WOLFSRC/WL_STATE.C`, level-flow table parity against
`source/WOLFSRC/WL_GAME.C` and `source/WOLFSRC/WL_INTER.C`, RNG table parity against
`source/WOLFSRC/ID_US_A.ASM`, and the sprite/weapon/enemy/direction enums in
`source/WOLFSRC/WL_DEF.H`.

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
- Local DOS compiler/toolchain installs under `deps/borland`.
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
