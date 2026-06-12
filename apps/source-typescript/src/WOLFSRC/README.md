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
| `ID_MM.C/.H` | Behavioral model (API-faithful, pressure-free heap); full transliteration scheduled with the save milestone |
| `GFXV_WL6.H`, `AUDIOWL6.H`, `MAPSWL6.H`, `VERSION.H`, `ID_HEADS.H` | Ported |
| `ID_VL`, `ID_VH`, `ID_SD`, `WL_MAIN` | Partial stubs (only what ID_CA touches) — full ports queued |
| everything else | not started |
