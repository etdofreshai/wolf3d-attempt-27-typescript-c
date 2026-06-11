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

This directory is empty until porting begins.
