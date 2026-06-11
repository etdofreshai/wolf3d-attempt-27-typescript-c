# Porting Wolfenstein 3D to TypeScript — Conventions & Acceptance Spec

> Governing document for `apps/source-typescript`. This defines **what** we are
> building, **how** the code is shaped, and **how we know we are done**. When
> any other doc, comment, or instinct conflicts with this file, this file wins
> — until it is amended here.

---

## 0. How to read this doc

Three things are being nailed down, matching the request that started this work:

1. **Formatting** — §5 (files/names) and §6 (C-semantics rules).
2. **The goal** — §1 (goal/non-goals), §2 (scope), §3 (priority ladder).
3. **How we know we're finished** — §9 (the acceptance ladder), the single
   source of truth for "done."

Everything else (§4 determinism, §7 assembly, §8 oracle, §10 saves, §11 risks)
exists to serve those three.

---

## 1. Goal & non-goals

**Goal:** a **100% faithful port** of Wolfenstein 3D to TypeScript. The port
reproduces the original's behavior exactly — *including its bugs* — and its
source is structured so that any function in the port is traceable, almost
line-for-line, back to the original C it came from.

**Non-goals (this round):**

- No gameplay improvements, no bug fixes, no "modernization" of mechanics.
- No new features, resolutions, control schemes, or content.
- No rearchitecting "because it's cleaner." Cleaner that diverges from the
  original's behavior or structure is *wrong* here.

If a change is tempting but not required to match the original, it does not
happen this round. (Requirement #11.)

---

## 2. Scope lock

**Target game:** Wolfenstein 3D, **registered WL6** (six episodes). All other
variants the source supports — WL1 shareware, Spear of Destiny (SOD), SDM, SD2,
SD3 — are **out of scope this round**, even though `WOLFSRC` compiles them via
`#ifdef`. We port the `WL6` path; `#ifdef SPEAR` / shareware branches are
ported as dead-but-present code (kept for traceability, never exercised).

**Canonical binary (the oracle's subject):**

- `steam/base/wolf3d.exe`
- size `108779` bytes
- sha256 `48d9594649f330956e86ea1892bab76b2d83cfd4038e262ff8f3383ba945ec09`

This exact binary is *the* reference. RNG behavior, demo format, savegame
layout, and data-segment addresses are all version-specific, so the version is
part of the spec, not an afterthought. If this binary is ever swapped, the
oracle fixtures and the save-layout map (§10) must be regenerated.

**Canonical data:** the `*.WL6` files in `steam/base/` —
`GAMEMAPS/MAPHEAD`, `VGAGRAPH/VGADICT/VGAHEAD`, `AUDIOT/AUDIOHED`, `VSWAP`,
`CONFIG.WL6`. Demos are the `T_DEMO0..T_DEMO3` chunks embedded in
`VGAGRAPH.WL6`.

**Source of truth for code:** `source/WOLFSRC/` (70 `.c`/`.h` + 10 `.asm`).

---

## 3. Priority ladder (the tie-breaker)

When two goals conflict, the higher one wins. This order is from the original
request and is binding:

1. **Looks, plays, and feels exactly like the original.** (req #9)
2. **The source code looks nearly the same as the original.** (req #10)
3. **No improvements** — faithful only. (req #11)

The consequence that bites most often: **#1 beats #2.** Where a literal
transliteration would *behave* differently than the C (see §6), we change the
code's shape to preserve behavior. "Source looks the same" therefore means
**auditably traceable** — a reviewer can diff a `.ts` against its `.c` and see
the correspondence — *not* "textually identical character-for-character."

---

## 4. The core principle: determinism is the deliverable

Requirements #2–#7 (extract assets, save/load interop, demo playback,
screenshot match, sound match) look like six features. They are not. They are
six **observable projections of one property: bit-exact logical determinism.**

If the port reproduces the original's integer math, fixed-point, PRNG
(`US_RndT` / `rndtable`), and 70 Hz tic ordering exactly, then:

- demos play to identical state (the keystone test),
- saves round-trip,
- framebuffers match per frame,
- the OPL register stream — and thus the audio — matches,

**as a consequence**, not as separate work. So effort goes into the math and
the tic loop first. The A/V/save/demo comparisons in §9 are how we *measure*
determinism; they are not independent deliverables.

Determinism prerequisites that must be locked exactly:

- Fixed **70 Hz** game tic; logic is stepped, never frame-coupled.
- `US_RndT()` over the fixed 256-entry `rndtable` with the same index handling.
- Fixed-point trig/scale tables (`sintable`, `costable`, `tantable`,
  `pixelangle`, scaler tables) computed to identical values.
- Identical movement/clipping/think order each tic.

---

## 5. File & naming conventions

### 5.1 One module per original file

Every `.c` and `.h` in `WOLFSRC` maps to exactly one TypeScript module.

| Original    | Ported module   |
|-------------|-----------------|
| `ID_CA.C`   | `ID_CA.C.ts`    |
| `ID_CA.H`   | `ID_CA.H.ts`    |
| `WL_DRAW.C` | `WL_DRAW.C.ts`  |
| `WL_DEF.H`  | `WL_DEF.H.ts`   |

Rules:

- **Preserve the stem and the original extension's casing exactly**
  (`ID_CA`, `WL_DRAW`, the `.C`/`.H`), then append a **lowercase `.ts`**.
  Lowercase `.ts` keeps Vite/tsc/import-resolution well-behaved; the preserved
  `.C`/`.H` keeps the origin obvious. (Decided.)
- Mirror the directory layout under `apps/source-typescript/src/WOLFSRC/`
  (or equivalent) so the tree itself diffs against the original.

### 5.2 Headers (`.H.ts`)

A C header is an *interface* (externs, typedefs, macros, prototypes). The
`.H.ts` mirror **carries the shared declarations as real exports**:

- `#define` constants → `export const` (typed, same name, same value).
- `typedef struct` → an `export interface`/`class` plus a documented byte
  layout (see §6.5) when the struct is ever serialized.
- function prototypes → re-exports / ambient declarations as needed.
- `extern <global>` → the *declaration*; the single defining `.c` owns the
  *definition* (see §6.4).

### 5.3 Names, comments, structure

- **Identifiers preserved verbatim**, including the original casing and id's
  conventions (`PlayLoop`, `T_Stand`, `gamestate`, `obj->state`). Do not
  camelCase, do not "fix" Hungarian-ish names.
- **Comments preserved verbatim** — including id Software banner blocks,
  the `==========` rules, and inline `// fixme`-style notes. They are part of
  the audit trail and cost nothing to keep.
- **Statement-level correspondence** is the target: a function in the `.ts`
  should read top-to-bottom in the same order, with the same branches and the
  same locals, as the C. A side-by-side diff against the `.c` is the review
  artifact. (This is the concrete meaning of "source looks the same," §3.)

---

## 6. C-semantics fidelity rules

These are the places a naive transliteration silently diverges. They are
non-negotiable because they sit under §3 rule #1.

### 6.1 Integer width & overflow

Borland C on 16-bit DOS: **`int` is 16-bit signed.** JS numbers are float64.
Wolf3D *relies* on overflow and wraparound (angles, fixed-point, counters).

- Treat `int`/`short` as 16-bit, `long` as 32-bit, with explicit signedness.
- Every arithmetic result that the original would have truncated **must be
  truncated** — via masking helpers, `Int16`/`Uint16`/`Int32` coercion, or
  typed-array storage. A helper layer (e.g. `i16(x)`, `u16(x)`, `i32(x)`,
  `imul16`) is mandatory; do not scatter `& 0xffff` ad hoc.
- Division truncates toward zero (C semantics), not `Math.floor`.

This is the single most pervasive hazard. Assume any unguarded `+`/`*` on a
game value is a bug until proven width-safe.

### 6.2 Fixed-point

- `fixed` is 32-bit, `GLOBAL1 = 1<<16` (16.16). Reproduce the exact table
  generation and the exact multiply/shift sequences (`FixedMul`/`FixedByFrac`
  semantics), including any intermediate truncation. Do not substitute float
  trig — values must match the original tables bit-for-bit.

### 6.3 Pointers & the DOS memory model

Wolf3D uses pointers everywhere, plus a custom memory manager
([ID_MM.C](source/WOLFSRC/ID_MM.C)) over EMS/XMS and far pointers. Two reasons
this becomes a **modeled DOS-memory image** rather than idiomatic TS objects:

1. The memory manager's pointer arithmetic doesn't survive transliteration into
   GC'd objects.
2. **Byte-identical saves (§10) require objects at fixed addresses.**

Therefore: model the relevant memory as a backing `ArrayBuffer` ("DOS memory"),
with structs as typed views at stable offsets. Pointers become offsets into
that buffer. This is an architectural commitment, decided up front, not a
save-time patch.

### 6.4 Globals / `extern` strategy

Wolf3D is built on a large global namespace (hundreds of `extern`s). Convention:

- The header mirror (`X.H.ts`) **declares** the global (its type / external
  binding).
- The single `.c` that defines it **owns the definition** and exports the
  mutable binding; all other modules import it.
- Mutable globals are exported as properties of a per-file state object (or a
  shared globals module) so that imports see live updates — a bare
  `export let` re-bound in another module will not propagate. Pick one
  mechanism and apply it uniformly. *(Mechanism choice tracked in §11.)*

### 6.5 Structs, unions, byte layout

- x86 is **little-endian**; all serialized layouts are little-endian.
- Any struct that is written to disk, hashed, or pointer-targeted gets an
  explicit, documented byte layout (offset, width, signedness per field) that
  matches the Borland-compiled layout **including padding/alignment**.
  `objstruct`, `gamestate`, `statobj`, `doorstruct`, `statetype` are the
  load-bearing ones (see §10).
- Unions are modeled as overlapping views on the same backing bytes, not as
  a TS tagged union, when their byte aliasing is observable.

### 6.6 Control flow

- `goto`, `switch` fallthrough, comma operators, and assignment-in-condition
  are preserved in behavior. Where TS can't express `goto` directly, use the
  minimal faithful equivalent (labeled loop / state flag) and comment the
  original construct.

---

## 7. Assembly (the 10 `.asm` files)

These **cannot** be made to "look the same" — §3 rule #2 does not apply to
them. They are reimplemented from **semantics**, with the original assembly
preserved verbatim in a header comment block for audit, in a `*.ASM.ts` module.

| File           | Role                                              | Port approach |
|----------------|---------------------------------------------------|---------------|
| `WL_DR_A.ASM`  | Column scaler — the core inner render loop        | Reimplement; pixel-exact output is the test |
| `JABHACK.ASM`  | Self-modifying *compiled scalers* setup           | Reimplement the generated-scaler behavior |
| `WHACK_A.ASM`  | Compiled-scaler patching                          | Reimplement behavior |
| `ID_VL_A.ASM`  | VGA low-level (planar writes, palette)            | Reimplement against the framebuffer model |
| `ID_VH_A.ASM`  | View hardware helpers                             | Reimplement |
| `ID_SD_A.ASM`  | Sound low-level (timer/OPL/PCSpeaker hooks)       | Reimplement against the audio model (§9 T4) |
| `ID_US_A.ASM`  | User-mgr helpers                                  | Reimplement |
| `WL_ASM.ASM`   | Misc game asm                                     | Reimplement |
| `H_LDIV.ASM`   | 32-bit long division helper                       | Reimplement as exact integer division |
| `C0.ASM`       | C runtime startup                                 | Mostly N/A; replicate only observable setup |

The acceptance bar for these is **identical observable output** (pixels for the
scaler, register writes for sound), not textual resemblance.

---

## 8. The reference oracle

Every "compare to the original at the same point" requirement (#2–#7) needs a
ground-truth instrument. We have the materials to build the best possible one:
the *real* source (`WOLFSRC`), the *real* toolchain (Borland C++ 3.1 in
[deps/borland](deps/borland)), DOSBox ([steam/DOSBox](steam/DOSBox)), and the
WL6 data.

**The oracle has two faces, mapped onto the existing apps — the OG stays pure:**

- **`apps/source-dos` — the pure OG.** The unmodified 16-bit DOS app (the
  shipped `wolf3d.exe`, §2), run under DOSBox/js-dos. This is *the authority*:
  behavioral ground truth, the byte-for-byte EXE reference, and the source of
  the save-layout addresses (§10). **Never modified.**
- **`apps/source-modified-dos` — the instrumented sibling + eval tooling.** A
  behavior-preserving instrumented build (plus any extraction/comparison tools
  we need to write), **validated to track the OG demo-for-demo** before its
  output is trusted. This is where hooks live, so the OG never has to.

The instrumented sibling is what, per tic, emits:

- a **game-state hash** (and, on demand, the full struct dump behind it),
- the **320×200 framebuffer** (indexed + the active VGA palette),
- the **OPL2 register-write stream** with tic timestamps, plus PC-speaker and
  digitized-sound events,
- and a one-time **data-segment layout map** (the DS offsets of `objlist`,
  every `statetype` table, and the other serialized globals) — required for
  §10.

It must also accept **scripted input / demo playback / state setup** so we can
drive it to "the same point" the port is at (requirement #7).

**Build path (decided — fidelity-first):** the instrumented sibling is the
**original source plus behavior-preserving hooks, compiled with the vendored
Borland C++ 3.1** (16-bit DOS) and run under DOSBox/js-dos — it lives in
`apps/source-modified-dos`, while the pure OG in `apps/source-dos` is never
touched. A modern recompile is explicitly rejected as the authority: a modern compiler
has 32-bit `int`, different struct padding, and different FP, so it would
diverge on overflow and would *not* reproduce the DOS struct layout that
byte-identical saves (§10) depend on. Instrumentation is done **at the source
level** (hooks that dump the per-tic state hash, framebuffer, and OPL
register stream to disk), so extraction needs no DOSBox debugger scripting.
The Borland linker `.MAP` yields the data-segment layout map (§10) for free.

**Step 1 (gate):** confirm whether the Borland rebuild reproduces
`steam/base/wolf3d.exe` byte-for-byte. If yes, behavior *and* the save-layout
addresses unify in one artifact. If not, behavior is taken from the
instrumented rebuild, but the **save-layout addresses are taken from the
shipped binary** (via its map / memory inspection), because that is the binary
your saves must interoperate with (§2, §10).

Build order: **the oracle is the first concrete deliverable after this spec is
signed off.** Until it exists, "matches the original" is an opinion, not a test.

---

## 9. Definition of done — the acceptance ladder

"Finished" = **every tier green across the entire shipped WL6 content set**,
run in CI. Tiers are cumulative.

### T0 — Structural (script-checkable)
- Every `WOLFSRC` `.c`/`.h` has a corresponding `.ts` module.
- Every original function exists in the port (name preserved).
- Comments/banners preserved (spot-checked by a diff lint).

### T1 — Asset parity (hash compare)
- Maps (Carmack+RLEW), graphics (Huffman via `VGADICT`), audio
  (`AUDIOT/AUDIOHED`), and `VSWAP` chunks extracted by the port are
  **byte-identical** to the oracle's extraction. (Requirement #2.)

### T2 — Determinism via demos (the keystone)
- All four embedded demos (`T_DEMO0..3`) play to completion with an
  **identical per-tic game-state hash** vs. the oracle, start to finish.
  (Requirement #4.) Passing this is stronger evidence of parity than any
  screenshot.

### T3 — Save-game interop (byte-identical — see §10)
- A savegame written by the original **loads in the port** to an identical
  state hash. (Requirement #3, direction A.)
- A savegame written by the port is **byte-for-byte identical** to what the
  original would have written from the same state — same field layout, same
  pointer offsets, same `DoChecksum`. (Requirement #3, direction B.)
- Verified across a battery of captured states.

### T4 — Audio/visual parity
- **Video:** per-frame framebuffer hash matches the oracle across a full demo
  run. Pixel-exact is the target (deterministic integer renderer + exact
  palette). (Requirement #5.)
- **Audio:** the port's OPL register-write stream matches the oracle's at the
  same tics (the exact, hardware-independent test); fed through the shared
  **Nuked-OPL** core (§11), the rendered buffer matches within a defined
  tolerance. PC-speaker and digitized PCM are exact. (Requirement #6.)

### Tooling requirement (cross-cutting, requirement #7)
- The port exposes the same scripted-input / state-setup / screenshot /
  audio-capture hooks as the oracle, so any state can be reached and compared
  in both. This harness is part of "done," not optional.

When T0–T4 are green over all WL6 maps, all demos, and the save battery — and
the comparison harness exists on both sides — the port is **a faithful 100%
parity port** (requirement #8) and this round is complete.

---

## 10. Save-game byte-identity — what the strict path demands

(Decided: **byte-identical interop**, the strict option.)

From [WL_MAIN.C](source/WOLFSRC/WL_MAIN.C) `SaveTheGame`/`LoadTheGame`:

- The save is a sequence of **raw struct dumps**: `gamestate`, `LevelRatios`,
  `tilemap`, `actorat`, `areaconnect`, `areabyplayer`, the `objtype` list
  (each `player`→`next` chain entry), a `nullobj` end marker, `laststatobj`,
  `statobjlist`, `doorposition`, `doorobjlist`, the push-wall state, then a
  trailing **`long checksum`** from `DoChecksum`.
- Each `objtype` is written **whole**, including `statetype *state` and
  `objstruct *next,*prev` (these are **2-byte near offsets** — confirmed by
  `LoadTheGame` doing `memcpy(new,&nullobj,sizeof(nullobj)-4)`, which copies
  everything *except* the trailing 4 bytes / `next`+`prev`).
- On load, `next`/`prev` are **rebuilt** (`GetNewActor`/`InitActorList`), but
  `state` is **restored verbatim**.

**Implications for the port:**

1. The flat arrays/structs (`gamestate`, `tilemap`, …) need exact
   Borland-compiled byte layout (field order, widths, padding) and
   little-endian encoding. Tractable.
2. The hard part: to emit byte-identical `objtype` records, the port must write
   the **same `state` offset and the same `next`/`prev` offsets** the original
   would have. Those are **DS-relative addresses fixed by the compiled EXE's
   layout.** So the port must place `objlist` and every `statetype` table at the
   **same data-segment offsets** as `steam/base/wolf3d.exe`.
3. Therefore the oracle (§8) must emit the **layout map** of those offsets, and
   the port's DOS-memory model (§6.3) must honor it.
4. `DoChecksum` must be reproduced exactly (algorithm + the same byte ranges in
   the same order).

This is the deepest part of the project and is **binary-coupled**: it is valid
only for the locked binary in §2. Treat the layout map as a generated fixture,
not as hand-maintained constants.

---

## 11. Resolved decisions & residual risks

All five originally-open items are decided, each toward maximum fidelity to the
original code and runtime.

| # | Item | Decision (fidelity-first) |
|---|------|---------------------------|
| 1 | **Global/`extern` mechanism** (§6.4) | Each global is **defined in the `.ts` mirror of the `.c` that defines it** — never a catch-all globals module (that would destroy the 1:1 structure). Serialized / pointer-addressed globals are **views into the DOS-memory buffer** (§6.3); remaining plain scalars are mutable module exports. Residual cosmetic tax: ESM has no writable cross-module bindings, so an importer that *writes* a scalar global goes through its module namespace (`IN.tics`) rather than bare `tics`. |
| 2 | **OPL core** (§9 T4) | **Nuked-OPL** (OPL2 mode) — reverse-engineered from the real YM3812/YMF262 silicon, the closest to actual AdLib/SB hardware. Primary test is **register-write equality at the same tics** (hardware-independent, exact); the Nuked-rendered buffer is the secondary tolerance check. |
| 3 | **Oracle build path** (§8) | **Original source built with the vendored Borland C++ 3.1, run under DOSBox/js-dos, instrumented at the source level.** Pure OG = `apps/source-dos` (the authority, untouched); the instrumented build + eval tools = `apps/source-modified-dos`, validated to track the OG demo-for-demo. A modern recompile is rejected (wrong `int` width, padding, and FP → diverges and breaks save layout). Step-1 gate: confirm the Borland rebuild reproduces `wolf3d.exe` byte-for-byte; if not, behavior comes from the rebuild and save-layout addresses from the shipped binary. |
| 4 | **DOS-memory model scope** (§6.3) | Model exactly what the original gives a **stable address**: the **data segment** (statically-allocated globals) + **ID_MM's contiguous managed heap** (already a buffer in the original) as backing `ArrayBuffer`s at the original offsets. **Stack locals stay ordinary TS variables** — no fixed address in the original, so zero fidelity lost and the code stays readable. This is also the minimum that makes byte-identical saves correct. |
| 5 | **Existing scaffold** | **Replace** the generic raycaster (`engine.ts`/`input.ts`/`main.ts`) with the `WOLFSRC`-mirrored tree; git history preserves it. Keep only a **thin browser "platform" shim** (canvas / keyboard / audio) — the moral equivalent of the original DOS hardware layer — backing the `ID_VL` / `ID_IN` / `ID_SD` ports. *(Pending an explicit go-ahead before deletion.)* |

**Residual risks to watch:**

- **Save layout is binary-coupled** (§10): valid only for the locked binary in
  §2. If the Borland rebuild doesn't match it byte-for-byte, the layout map
  must come from the shipped binary, not the rebuild.
- **Per-tic dumps under DOSBox are slow** (writing the 64 KB framebuffer +
  hashes every tic). Acceptable for offline fixture generation; not realtime.
- **FM-audio tolerance** (§9 T4) is a defined band, not bit-equality, once past
  the register stream — the exact threshold is set when the harness lands.

---

*Last decisions baked in: target = WL6 / the locked binary in §2; extension
scheme = `NAME.C.ts` (lowercase `.ts`); save interop = byte-identical; globals
defined at origin + DOS-memory-backed; OPL core = Nuked-OPL; oracle =
Borland-built original under DOSBox, source-instrumented; scaffold = replaced
by the mirrored tree. Start = this spec, then build the oracle.*
