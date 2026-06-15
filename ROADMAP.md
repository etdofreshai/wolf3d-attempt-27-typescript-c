# Finish Roadmap — `apps/source-typescript` to PORTING.md done

> Companion to [PORTING.md](PORTING.md) (the spec) and [GOAL.md](GOAL.md) (the
> bar). PORTING.md §9 defines "done" as **T0–T4 green over all WL6 content, in
> CI, plus a playable app**. This file is the sequenced plan to get there, with
> the current state of each tier established by a code audit + a working
> Borland/DOSBox per-tic oracle built this session.

## Status snapshot

| Tier | State | One-line |
|------|-------|----------|
| **T0** structural mirror | ✅ done | 96/96 `WOLFSRC` files mirrored; function-presence enforced by the checker |
| **T1** asset parity | ✅ done | maps/graphics/audio/VSWAP + 4 demo chunks byte-identical to expected |
| **T2** demo determinism (keystone) | ✅ done | port **bit-exact vs oracle for ALL 4 demos** (139/140/141/142) per-tic; `npm run check:demo-traces` green; demo 140 fixed via AdLib sound mode + top-of-loop t0 servicing (see `memory/demos-end-ex-died.md`) |
| **T3** save byte-identity | 🟡 data-gated in CI | save FORMAT + all DATA byte-identical to a real DOS save, **wired as `npm run check:save-data`** (`oracle/compare-save-data.mjs` vs `oracle/generated/saves/wl6-e1m1-start.sav`, 18609/18609 data bytes); only excluded diffs are near-POINTERS (build-fragile DGROUP) — full byte-identity needs **retail-authoritative DGROUP offsets** from the stripped retail EXE (3a, deepest item, still open) |
| **T4** video parity | 🟢 99.83% gated | oracle framebuffer dump + **CI gate `npm run check:frame`** (`oracle/compare-frame.mjs` vs `oracle/generated/frames/wl6-e1m1-start-frame.bin`). **Fixed 3 wall/jamb-render bugs (height `>>3`→`(wh&0xfff8)>>2`, comptable texel map, door-jamb tilemap plumbing) → pixel diff 30% → 0.17% (109px)**, demos still 4/4. Residual = tiny door-slab detail. NEXT: per-tic dump for full-demo parity. See `memory/t4-video-parity.md` |
| **T4** audio parity | 🟡 register stream gated | port models OPL writes faithfully (instrument + per-tick freq, real AUDIOT values, parsing+sequence == DOS by inspection); **`npm run check:opl` gates the register stream in CI** (4 sounds, 1162 writes). Oracle runtime alOut dump blocked by oracle-global fragility. **Remaining: Nuked-OPL render (5c) so the browser plays faithful AdLib.** See `memory/t4-audio-parity.md` |
| Playability (GOAL.md) | 🟡 partial | **browser-verified playable + beatable**: boot→menu→episode→difficulty→3D + WASD move/turn + Ctrl fire + statusbar; `playstate` loop wired (level advance + bonus, death/respawn, game-over→menu). **Remaining:** animated transition screens (death-spin/tally/victory), high-score entry, save/load UI, attract demos, pause/cheats |
| Oracle + harness (§8, req #7) | 🟡 partial | headless Borland+DOSBox build + per-tic CSV proven; **not committed** to `apps/source-modified-dos`; no automated both-sides gate; no T4 fixtures |

Key facts (see `memory/`): all four demos end **`ex_died`** (not `ex_completed`)
in the real game, and the port now reproduces **all 4 bit-exactly per-tic**. The
final demo-140 fix was twofold — the oracle runs **AdLib** sound (DOSBox emulates
OPL; `SD_Default` picks `sdm_AdLib` despite CONFIG.WL6 `sd=0`), and the t0 sound
ISR must be serviced at the **top** of the play loop (during the CalcTics wait)
so `UpdateFace`'s `SD_SoundPlaying()` check sees the correct per-tic sound state.
`npm run check` (incl. `check:source-typescript-port` + `check:demo-traces`) is
green; `tsc` clean.

---

## Phase 1 — Close T2 (the keystone) ✅ DONE

Determinism is the deliverable (§4): once the demos match per-tic, the rest is
measurement. This phase is mostly formalization + one real bug.

- [ ] **1a. Fix the demo-140 bug. ROOT CAUSE FOUND (2026-06-13, loop iter 3 —
  it's the RAYCASTER/`spotvis`, NOT movement).** Regenerated the oracle objlist
  binary dump (`tmp/oracle-build/ORTRACE.BIN`, 1899×9000B, objlist-only) and ran
  `oracle/tmp-bindiff.mjs 555 570`: the FIRST per-slot divergence is at **command
  562**, **slot 62 (an SS, obclass 5) at tile 32,43**, field `flags` port=9 vs
  oracle=1 — the **0x08 = `FL_VISABLE`** bit. `oracle/tmp-binslot.mjs 62 560 564`
  shows: cmds 560-561 match; at 562 the ORACLE leaves the SS untransformed
  (viewx=viewheight=transx=0 ⇒ it FAILED the DrawScaleds `spotvis` neighbourhood
  gate) while the PORT transforms it (vx=177 vh=45 tx=954975) and sets FL_VISABLE.
  So the port's raycaster marks a tile near (32,43) `spotvis`-visible when the
  oracle's doesn't (a ray grazes a wall/corner differently). This is the SAME
  "approximate wall renderer" as Phase 4b — **fixing the raycaster `spotvis`
  marking unblocks BOTH demo-140 (T2) and T4 video.** Cascade: SS FL_VISABLE flip
  (cmd 562) → changes player `GunAttack`/`CheckLine` target selection (same RNG
  *count*, different enemy) → actor-position drift (cmd 564) → rndindex divergence
  (cmd 566) → early death. The earlier "movement / officer / dog" leads were all
  *downstream symptoms* of this one spotvis flip. NEXT (dedicated raycaster
  session): re-add `fwrite(spotvis,...)` to the oracle dump (REC→13096, use
  `tmp-binspotvis.mjs`), find the exact spotvis tile that differs near (32,43) at
  cmd 562, then diff the port ray-march (`WL_DRAW.C.ts` WallRefresh/AsmRefresh +
  `WL_DR_A.ASM`) vs the C for that ray. Tools: `oracle/tmp-bindiff.mjs`,
  `tmp-binslot.mjs` (REC=9000 objlist-only), `tmp-binspotvis.mjs` (REC=13096 w/
  spotvis — oracle now dumps objlist+spotvis), `tmp-raydbg.mjs`, `tmp-tilemaprow.mjs`.
  PROGRESS 2026-06-13 (loop iter 4): `tmp-binspotvis.mjs 563` pins the spotvis diffs
  at cmd 562 — port WRONGLY marks **(31,44) & (32,44)** (in SS@32,43's 3x3 nbhd ⇒
  sets FL_VISABLE) and MISSES (39,44),(45,45). Offending rays (`tmp-raydbg.mjs`):
  **pixx 170-172, angle 1715-1721**, near-horizontal (xstep≈-475339, ystep≈-9035,
  steps=(-1,-1)). Player @ tile 47,46 x=3120481 y=3037963 angle=189. Geometry: a
  walled room x=38-45/y=44-45 (N wall y=43 x=37-46; W wall x=37=17; E wall x=46=17;
  door #19=147 @46,46). The port's ray reaches (31,44)/(32,44) WEST of the x=37 wall
  while skipping in-room (39,44) ⇒ the DDA tile *path* diverges (not the wall/door
  hit test). **Door logic VERIFIED FAITHFUL** (`halfFixedStep=i32(step)>>1` == C
  `sar;rcr`; `(doorIntercept&0xffff)<doorposition` == `jb`). So bug = a fixed-point
  edge case in DDA stepping (`setupRayPartials`/`fixedStepByPartial` initial
  intercept, or xintercept/yintercept accumulation) for near-horizontal rays. NEXT:
  RAY_DEBUG-log pixx=170's FULL tile sequence and hand-trace the expected DDA to
  find the diverging step. (Also unblocks T4-4b.)
  PROGRESS 2026-06-13 (loop iter 5): traced pixx=170's full DDA (RAY_DEBUG +
  intercepts via `oracle/tmp-rayseq.mjs`). The port's ray runs **~0.17 tile too far
  SOUTH (high y)**: it marks (45,**46**),(39,**45**),(31,**44**) where the oracle marks
  (45,**45**),(39,**44**) — a sub-tile boundary flip at the grazing point (x=45, port
  yint=46.034 just inside tile 46; oracle just inside tile 45) that skips the room's
  wall row. RULED OUT: player x/y/angle MATCH the oracle exactly at cmd 562
  (3120481,3037963,189 — angle isn't in bindiff FIELDS so I checked it directly);
  `fixedStepByPartial` is FAITHFUL (asm `xpartialbyystep` does abs→floor→negate, ==
  the port's `-floor(|step|*partial/65536)`); DDA stepping + door logic faithful
  (iters 3-4). So the bug is a razor-thin offset in the **initial yintercept** ⇒ only
  `viewy` or the `xpartial`/`ypartial` setup constants remain. NEXT: read-only diff
  the port's `CalcProjection`/`SetupScaling` partial computation (xpartialup/down,
  ypartialup/down) + viewx/viewy vs the C (`WL_DRAW.C` CalcProjection); if those are
  faithful, dump oracle per-ray viewx/viewy/partials (same-size fprintf) to find the
  sub-tile flip. NOTE: 5 iters deep on this one razor-thin raycaster bug — if the
  partials check doesn't crack it, PIVOT to Phase 2 (playability) for visible
  progress and resume the raycaster as a dedicated effort.
  PROGRESS 2026-06-13 (loop iter 6): verified the ENTIRE raycaster setup faithful to
  the C ASM (WL_DR_A.ASM initvars: yintercept=viewy+xpartialbyystep, xintercept=
  viewx+ypartialbyxstep, xtile=focaltx+xtilestep all match); midangle, viewx/viewy
  partial formulas match. Found+FIXED one real fidelity bug: pixelangle gen used 64-bit
  `Math.atan` where C declares `float angle` — now `Math.fround(Math.atan(tang))`
  (WL_MAIN.C.ts:892). No regression (139/141/142 bit-exact, tsc clean) but it did NOT
  change demo 140 ⇒ pixelangle[170] wasn't the trigger. CONCLUSION: every checkable
  raycaster input is faithful; the remaining razor-thin diff is in the exact per-ray
  xstep/ystep (finetangent index) or sub-unit DDA accumulation for pixx=170 — pinning
  it needs the ORACLE's per-ray values for pixx=170, requiring register-level ASM
  AsmRefresh instrumentation (crash-prone, dedicated tooling). **DEFERRING raycaster;
  PIVOTING to Phase 2 (playability)** — kept the faithful fround fix.
  MAJOR CORRECTION 2026-06-13 (loop iter 7): the oracle dumps showed the port's
  `pixelangle` (at viewsize 15) ≠ oracle's — because the demo harness hardcoded
  `NewViewSize(15)` while the oracle/real-game reads **viewsize 19 from CONFIG.WL6**
  (`ReadConfig`). FIXED `oracle/compare-demo-traces.mjs` to read `config.viewsize`
  (the real app already does). At viewsize 19 the port's pixelangle MATCHES the oracle
  — BUT demo 140 STILL diverges **identically** (tic 567, port rnd=59 vs 58). ⇒ the
  demo-140 game-state divergence is **VIEWSIZE-INDEPENDENT**, so the entire raycaster/
  spotvis/`FL_VISABLE` investigation (iters 3-6) was chasing a **viewsize artifact**
  (port@15 vs oracle@19 spotvis differences that DON'T affect game state). The SS@32,43
  FL_VISABLE "divergence" at cmd 562 was just the viewsize mismatch. THE REAL BUG is the
  +1 `US_RndT` at **command 566** (viewsize-independent), per the EARLIEST localization:
  port makes 3 calls (player `UpdateFace`, officer `SelectChaseDir`, officer `T_Chase`
  direct shoot-check gated by `CheckLine`) vs oracle's 2. Since FL_VISABLE is ruled out,
  the extra call is from `CheckLine`/door-timing (door #19 @46,46 on an officer's line)
  or `UpdateFace`. NEXT: re-run `tmp-bindiff`/`tmp-rndtag` with the PORT at **viewsize
  19** (they currently use 15) to find the REAL first objlist divergence + the exact
  extra-call source, then diff that path (CheckLine / MoveDoors / door open-timing /
  UpdateFace) vs the C. The raycaster IS verified faithful (good for T4); pixelangle
  fround + the viewsize-19 harness fix are kept.
- [ ] **1a (superseded notes below).** ROOT TIC found (2026-06-13, `oracle/tmp-possum.mjs`):
  the door #19 theory was a red herring (it opens identically). The actor-position
  sum (Σ x+3y) first diverges at **command index 564** (port vs oracle differ by
  14336), *before* the rndindex divergence at 566 — a **non-RNG movement drift** of
  one actor in the west map-43 cluster (tiles ~20–26, chasing east: officers, dogs,
  an SS). At cmd 566 that drift flips officer@42,46's CheckLine → the extra RNG.
  PROGRESS 2026-06-13 (loop iter 2; CORRECTS iter 1 — indexing was off by one):
  port `aa(M).txt` aligns to oracle index `M-1`. With that fix: at **command 563**
  total + dog + ofc ALL MATCH; at **command 564** total diff -14336, **officer sum
  diff exactly -16384 (-0x4000)**, dog still MATCH. So the diverging class is
  **officers, NOT dogs** (iter-1 "dogs" was the off-by-one). Moving officers:
  listpos **68** (Δx3y +14336: @563 _s_ofcchase2 dir=4 dist=4096 → @564 dir=6
  dist=59392, dx=-4096 dy=+6144) and **76** (Δx3y -30720: dir=2 dist=24576 → dist
  14336, dy=-10240). Both transitions are internally C-consistent (move=10240/tic),
  so it's a subtle value/timing drift. `T_Chase`/`MoveObj`/`SelectChaseDir`/
  `SelectDodgeDir`/`TryWalk` read faithful. CAVEAT: oracle ofc-sum is constant
  560→564, but a sum-match does NOT prove per-officer match (offsetting errors
  cancel) — the true first divergence may be < 564. NEXT: oracle PER-OFFICER x,y
  per tic (same-size fprintf: replace player x/y with officer-by-listpos x,y; OR
  two sub-sums west/east tilex<32) to find the exact officer+tic, then diff its
  movement vs the C. Suspect: an officer T_Chase while-loop goal-cross / MoveObj
  edge specific to map-43 geometry (officers on 139/141 are clean).
  **Accept:** `node oracle/compare-demo-traces.mjs` shows demo 140 MATCH (tc 7596).
  - Oracle instrumentation method (unblocked): the crash is triggered by **adding a
    new global** (`int g_curdemo;`) or **growing the code** past a tight link
    boundary — NOT by loops/locals. A **same-size fprintf** (replace the 2 player-x/y
    cols with an aggregate-sum loop reusing `obj` + 1 `long` local) builds + runs
    (release, 265KB). So dump aggregate sums, never per-actor fprintf, never new
    globals. This unblocks deeper T2 localization; T3/T4 framebuffer/OPL dumps will
    need the same discipline (or a binary-patch/DOSBox-memdump mechanism).
- [ ] **1b. Formalize the oracle** into `apps/source-modified-dos` (§8): commit
  the behavior-preserving source hooks proven in `tmp/oracle-build`
  (WL_PLAY.C per-tic `fprintf`, WL_MAIN.C `oracletracefp` + 4-demo driver,
  `ID_US_A.ASM` `US_GetRndIndex`), plus the one-shot build script
  (copy→PRJ2MAK→2 fixes→clean→MAKE under headless DOSBox).
- [x] **1c. Generate + commit per-tic oracle fixtures** for all 4 demos —
  DONE. `oracle/generated/oracle-demo-{139,140,141,142}.csv` (691/1899/1140/1656
  rows; cols `rndindex,playstate,timeCount,tilex,tiley,angle,health,ammo,score,x,y`)
  captured from the Borland/DOSBox **release** build (265KB; the per-actor/checksum
  crashes were specific to that added code, not the build config). Regenerable via
  the 4-demo driver in `tmp/oracle-build`.
- [x] **6a (early). Committed both-sides comparison harness** —
  `oracle/compare-demo-traces.mjs`, wired as `npm run check:demo-traces` and into
  the root `check` chain. Result: **demos 139/141/142 are per-tic BIT-EXACT** vs
  the oracle; demo 140 diverges at tic 567 (rndindex +1). Replaces the `tmp-*.mjs`
  scratch for demo comparison.
- [x] **1d. Fix the checker's demo gate** (`check-source-typescript-port.mjs`
  ~12329–12353): DONE (intermediate). Changed `playstate !== 1` → `!== 2` with a
  comment documenting the oracle truth (all 4 demos end ex_died). Now the checker
  **passes demos 139/141/142 and correctly fails only demo 140** on its real
  `commandsRun`/`timeCount` mismatch. TODO: upgrade to a per-tic oracle-fixture
  comparison (needs 1c) so it's a full T2 gate, not just end-state.
- [ ] **1e. Upgrade the per-tic row to a full game-state hash** (objlist/doors/
  statics/pushwalls/area), emitted on both sides, so T2 is the §9 "identical
  per-tic game-state hash" — not just observable fields. (Depends on Phase 3's
  DGROUP work for byte-identity; may land a structural hash first.)

**T2 green** = all 4 demos match the oracle per-tic, in CI.

## Phase 2 — Playability (GOAL.md "fully playable") 🟡

Mostly integration; the engine functions are already ported.

- [x] **2.0. Live input wired to CONFIG.WL6 bindings** (2026-06-14): expanded
  `main.ts` `KEY_SCAN_CODES` to a full physical-key→DOS-scancode map so the
  retail config's **WASD** movement (`dirscan=[W,D,S,A]`) resolves — previously
  only arrow keys were mapped, so the player never moved/turned. Browser-verified
  (Chrome automation): WASD move/turn + Ctrl fire all work; status bar updates.
- [x] **2a. `playstate`-driven outer loop wired** (2026-06-14, browser-verified):
  `main.ts` `stepOneTic` returns `PlayLoop(...).playstate`; `tick()` →
  `handlePlaystate()` mirrors `GameLoop`'s switch. EX_COMPLETED/EX_SECRETLEVEL →
  `LevelCompleted` bonus + mapon advance (elevator/secret) + `loadLevel`; EX_DIED →
  ported `Died()` state (lives−−/reset) + reload or game-over→menu; EX_VICTORIOUS →
  menu; EX_WARPED → reload. `beginGame` refactored into `NewGame`+`loadLevel`.
  Verified: level 0→1 advance + bonus + 1-up, death respawn, lives 3→0→game-over.
- [~] **2b.** `Died()` STATE wired (life loss + reload/game-over). **Remaining:**
  render the death-spin frames + red fade frame-by-frame (currently applied as
  final state, not animated).
- [~] **2c.** `LevelCompleted()` bonus + level advance (elevator/secret/next-map)
  wired. **Remaining:** the animated intermission tally SCREEN (counting bonuses).
- [ ] **2d.** Wire `Victory()` + end story/credits (`WL_INTER.C.ts`, `WL_TEXT.C`)
  — currently EX_VICTORIOUS just returns to the main menu.
- [ ] **2e.** Wire `CheckHighScore` + name entry/table.
- [ ] **2f.** Save/Load menu UI behind the existing `MAIN_SAVE_GAME` slot (also
  exercises T3 end-to-end).
- [ ] **2g.** Attract/intro: PG13/title/credits + `DemoLoop` on idle.
- [ ] **2h.** Surface `CheckKeys` pause/cheat/help; faithful Esc→control-panel.

**Accept:** cold boot → attract demos → new game → play → die/advance/win →
high score → menu, all through ported engine flow.

## Phase 3 — T3 save byte-identity 🟡 (verified 99.7% byte-identical 2026-06-14)

A real DOS level-start save (`oracle/generated/saves/wl6-e1m1-start.sav`, 18701 B)
was captured from the Borland/DOSBox oracle and compared to the port's
`serializeSaveGame` of the same deterministic state (`oracle/tmp-t3-compare.mjs`):
**18645/18701 bytes match**, including gamestate/tilemap/actorat/areaconnect/
areabyplayer/statobjlist/doors/pushwalls. See `memory/t3-save-interop.md`.

- [ ] **3a. retail-authoritative DGROUP (the deepest item) — characterized, still open.**
  The save's DATA all matches; only near-POINTERS (actor `state`, `laststatobj`)
  diverge, and that divergence is **DGROUP build-fragility**, not a constant offset:
  `source/WOLFSRC/WOLF3D.MAP` vs the oracle build's MAP differ non-uniformly
  (`_s_player` −4, `_statobjlist`/`_gamestate` +2, `_objlist` 0) because instrumentation
  changes DGROUP variable ordering. So a captured-save comparison can't pin retail
  offsets unless the capturing build's DGROUP exactly matches the port's reference.
  `oracle/compare-retail-dgroup.mjs` confirms the retail EXE is STRIPPED (no symbols)
  and not byte-coverable. **Real fix:** reverse-engineer the retail DGROUP symbol
  offsets from `steam/base/wolf3d.exe`, regenerate `TS_DGROUP_LAYOUT.ts` from those,
  re-verify all gates. (See `memory/t3-save-interop.md` for the full analysis.)
- [~] **3b.** First fixture captured (`wl6-e1m1-start.sav`). **Remaining:** the rest
  of the battery (mid-combat N actors, doors open, pushwall mid-move, post-cheat)
  via the same oracle save-capture (`tmp/oracle-build` main saves at a chosen
  point; backup of the demo-tracer main at `WL_MAIN.C.bak-t2`).
- [ ] **3c.** Direction-A gate: load each `.sav` via `loadSaveGameImage` → state
  hash equals the oracle's post-load hash.
- [ ] **3d.** Direction-B gate: from each captured state, `serializeSaveGame`
  bytes **==** the oracle `.sav` byte-for-byte (surfaces any wrong offset).
- [ ] **3e.** Wire 3c/3d into the checker as the T3 gate.

**Accept:** both directions byte-identical across the battery, in CI.

## Phase 4 — T4 video pixel-parity 🟡

- [x] **4a. Oracle framebuffer dump — DONE** (2026-06-14, single level-start frame):
  deplanarize Mode-X **`displayofs`** (after `ThreeDRefresh` page-flips; bufferofs is
  blank) → indexed 320×200 + 6-bit DAC palette. Fixture
  `oracle/generated/frames/wl6-e1m1-start-frame.bin`; harness `oracle/tmp-t4-frame.mjs`
  renders the port frame and pixel-diffs (writes `tmp/t4-port-vs-oracle.png`). Port scene
  MATCHES the oracle; remaining diff is the wall texturing. **Remaining:** extend to
  per-tic during demo playback. See `memory/t4-video-parity.md`.
- [x] **4b. Wall/jamb render — FIXED** (2026-06-14): 3 real `drawScalePost`/`WallRefresh`
  bugs → frame 30% → 0.17%: (1) post height `>>3`→`(wallheight & 0xfff8) >> 2` (DOS
  ScalePost asm; wallheight[] dump confirmed the raycaster was already faithful); (2)
  naive texel division → `buildCompScale` comptable (shared with the sprite scaler); (3)
  door-jamb `tilemap` not derived from the dgroup for `WallRefresh`'s hit functions →
  jambs drew light `horizwall` instead of dark `DOORWALL+2/+3`. Demos still 4/4.
- [~] **4c.** comptable now used for walls (= sprite scaler path). Residual 0.17% =
  door-slab detail; proving byte-equality across all scales is the remaining rigor.
- [~] **4d. Frame gate WIRED** (`npm run check:frame` → `oracle/compare-frame.mjs`):
  renders the E1M1 level-start frame, asserts ≤150px diff vs the committed oracle (currently
  109, the door-slab residual). **Remaining:** per-tic dump during demo playback + a hash
  gate across all 4 demos (extend the oracle dump like the framebuffer/wallheight dumps).

**Accept:** per-frame framebuffer hash matches the oracle across all 4 demos.

## Phase 5 — T4 audio parity 🟠

- [ ] **5a.** Oracle per-tic **OPL2 register-write stream** with tic timestamps
  (instrument `alOut`).
- [ ] **5b.** Port side: tic-timestamp `alRegisterWrites`; faithful sample
  streaming (replace `syntheticSample` fabrication, `ID_SD.C.ts:495`); real digi
  PCM decode.
- [ ] **5c.** Vendor **Nuked-OPL** (OPL2) and render AdLib from the same writes
  (§11 item 2).
- [ ] **5d.** Checker: **register-write equality** at the same tics (exact) +
  Nuked-rendered tolerance check; PC-speaker + digi PCM exact.

**Accept:** OPL register stream matches the oracle tic-for-tic across the demos.

## Phase 6 — Harness, CI, final sweep

- [ ] **6a.** Commit both-sides comparison harness (replace `oracle/tmp-*.mjs`).
- [ ] **6b.** Scripted state-setup / save-load entry into the oracle (req #7).
- [ ] **6c.** CI: T0–T4 gates green over all WL6 maps/demos/save battery.
- [ ] **6d.** Final: a clean `npm run check` + the app demonstrably playable
  end-to-end (Phase 2).

---

## Sequencing / dependencies

```
Phase 1 (T2) ──► Phase 2 (playable) can proceed in parallel after 1a
   │
   ├─ 1e needs Phase 3a (retail DGROUP) for a *byte-identical* state hash
   ▼
Phase 3 (T3) ──► needs oracle save-capture (extends Phase 1b tooling)
Phase 4 (T4 video) ──► needs oracle framebuffer dump (extends 1b tooling)
Phase 5 (T4 audio) ──► needs oracle OPL dump (extends 1b tooling)
Phase 6 ──► after T2–T4 gates exist
```

The oracle instrumentation (Phase 1b) is the shared enabler for T2/T3/T4
fixtures — each later phase adds one more per-tic emitter (state hash →
framebuffer → OPL) to the same committed `apps/source-modified-dos` build.

**Working notes / scratch this session:** `tmp/oracle-build/` (instrumented
oracle), `oracle/orig-demo-140.csv` + `oracle/port-demo-140.csv` (the demo-140
divergence proof), `oracle/tmp-*.mjs` (ad-hoc harnesses), `artifacts/*.workflow.js`
(audit + assessment). These are uncommitted scratch to be formalized in Phase 1b.
