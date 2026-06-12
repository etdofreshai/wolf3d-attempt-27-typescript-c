# WOLFSRC — 1:1 port mirror

One TypeScript module per original C file from [`source/WOLFSRC`](../../../../source/WOLFSRC),
preserving names, casing, comments, and structure. See [PORTING.md](../../../../PORTING.md)
(repo root) for the full conventions and the definition of done.

## Naming

| Original    | Ported module  |
|-------------|----------------|
| `ID_CA.C`   | `ID_CA.C.ts`   |
| `ID_CA.H`   | `ID_CA.H.ts`   |
| `WL_DRAW.C` | `WL_DRAW.C.ts` |
| `WL_DEF.H`  | `WL_DEF.H.ts`  |

- Preserve the stem and the original extension's casing (`ID_CA`, `.C`/`.H`),
  then append a lowercase `.ts`.
- `.H.ts` mirrors carry the shared declarations (constants, types, externs) as
  real exports; the single `.c` that defines a global owns its definition.
- Identifiers and comments are preserved verbatim.

## Reminders (from PORTING.md)

- **16-bit `int` semantics** — wrap arithmetic via the integer helpers; never
  rely on JS float64 width.
- **Serialized / pointer-addressed globals** live as views into the DOS-memory
  buffer (so byte-identical saves work); other scalars are module exports.
- The 10 `.asm` files are reimplemented from semantics into `*.ASM.ts`, with the
  original assembly preserved in a header comment.

## Mutable globals (PORTING.md §11#1, locked)

Every mutable C global lives on its defining module's exported state record,
named after the file stem (`ID_CA.C.ts` → `export const ca = {...}`), because
ESM namespace objects are frozen and can't model writable externs. `&global`
out-params (e.g. `MM_GetPtr(&grstarts, ...)`) become `ref(ca, "grstarts")` —
a `PtrCell` whose `(owner, key)` identity models the pointer's address (the
memory manager keys blocks on it, like the original's `useptr`).

## Status

| Module | State |
|---|---|
| `ID_CA.C/.H` | **Ported** — full caching manager; T1 extraction verified against `steam/base/*.WL6` (see `test/id_ca.test.ts` + fixture) |
| `ID_PM.C/.H` | **Ported** (cache tiers modeled per the ID_MM policy); all 663 VSWAP pages fixture-pinned |
| `ID_VL.C/.H` | **Ported** — drives the VGA card model in `platform/vga.ts` through the real port map; signon/title/credits render verified |
| `ID_US_A.ASM` | **Ported** (US_RndT/rndtable, asm preserved in header) |
| `ID_MM.C/.H` | Behavioral model (API-faithful, pressure-free heap); full transliteration scheduled with the save milestone |
| `GAMEPAL.OBJ`, `SIGNON.OBJ` | Extracted to data modules via `oracle/extract-omf.mjs` |
| `GFXV_WL6.H`, `AUDIOWL6.H`, `MAPSWL6.H`, `VERSION.H`, `ID_HEADS.H` | Ported |
| `WL_MAIN.C` | Partial: Quit, SignonScreen, BuildTables, CalcProjection, projection globals |
| `WL_DEF.H`, `WL_DRAW.C`, `WL_PLAY.C`, `ID_VH.C/.H`, `ID_SD.C/.H` | Partial (tables/update-block/pictable layers) |
| everything else | not started |

The browser boot (`platform/worker.ts`) runs the ported code synchronously in
a worker (Atomics-paced 70 Hz VBL) — `npm run dev`, port 5174.
