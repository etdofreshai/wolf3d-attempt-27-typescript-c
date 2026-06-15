export const meta = {
  name: 'wolf3d-determinism-audit',
  description: 'Audit determinism-critical Wolf3D port modules vs original C for RNG-order/integer-math divergences',
  phases: [
    { title: 'Audit', detail: 'compare each port .ts vs original .c for RNG/order/math divergences' },
    { title: 'Verify', detail: 'adversarially confirm each candidate divergence against the C source' },
  ],
}

const REPO = 'C:/Users/etgarcia/.codex/worktrees/5e66/wolf3d-attempt-27-typescript-c'
const SRC = `${REPO}/source/WOLFSRC`
const TS = `${REPO}/apps/source-typescript/src/WOLFSRC`

const CONTEXT = `
BACKGROUND (verified empirically this session):
- This is a 1:1 faithful TypeScript port of DOS Wolfenstein 3D (registered WL6). Fidelity rule: the port must reproduce the original's integer math, fixed-point, and US_RndT PRNG stream EXACTLY, in the same per-tic order, INCLUDING bugs. See PORTING.md.
- The keystone test (T2) replays the 4 embedded demos. All 4 currently FAIL: the demo player ends in playstate ex_died (2) where the original ends ex_completed (1). Demos 139/141/142 die on their LITERAL last command after running every command; demo 140 dies at 695/1899.
- Combat itself works (player lands hits/kills; score accrues). The visibility/FL_VISABLE model is essentially correct (full ThreeDRefresh path survives 690/691 commands on demo 139; lighter visibility models die far earlier). The failure is a SUBTLE CUMULATIVE RNG-STREAM DRIFT: enemies land a hair too much damage over the demo, leaving the player at critical HP so the final tics finish them.
- Therefore the bug is one or more of: (a) an EXTRA or MISSING US_RndT() call somewhere in the per-tic codepath, (b) US_RndT() calls in a DIFFERENT ORDER than the C, (c) a different ACTOR SPAWN ORDER (objlist order) that changes the order DoActor consumes RNG each tic, (d) an integer-truncation / fixed-point difference that flips a comparison (e.g. hitchance test, dist, CheckLine) and thereby adds/removes a downstream damage roll.
- 16-bit semantics matter: C 'int' is 16-bit signed; overflow/wrap is intentional. Division truncates toward zero. US_RndT() returns rndtable[++rndindex] (0..255), wrapping index at 255.

C integer width: int/short = 16-bit signed, long = 32-bit. JS is float64; every game-value arithmetic that the C would truncate must be truncated in the port.
`

const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['module', 'divergences'],
  properties: {
    module: { type: 'string' },
    summary: { type: 'string', description: 'one-line overall faithfulness assessment of this module' },
    divergences: {
      type: 'array',
      description: 'Each place the .ts diverges from the .c in a way that could shift the RNG stream or a comparison result. Empty if faithful.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['symbol', 'kind', 'cBehavior', 'tsBehavior', 'why', 'impact', 'confidence'],
        properties: {
          symbol: { type: 'string', description: 'function or table name where the divergence lives' },
          kind: { type: 'string', enum: ['rng-count', 'rng-order', 'spawn-order', 'integer-math', 'fixed-point', 'control-flow', 'other'] },
          cBehavior: { type: 'string', description: 'exact relevant C code/behavior (quote the C line(s))' },
          tsBehavior: { type: 'string', description: 'exact relevant TS code/behavior (quote the .ts line(s))' },
          why: { type: 'string', description: 'why this changes runtime behavior / the RNG stream' },
          location: { type: 'string', description: 'file:line in the .ts where a fix would go' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          confidence: { type: 'number', description: '0..1 that this is a REAL divergence, not a faithful re-expression' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isReal', 'reasoning', 'severity'],
  properties: {
    isReal: { type: 'boolean', description: 'true only if this is a GENUINE divergence from the C that changes runtime behavior' },
    reasoning: { type: 'string', description: 'cite the specific C and TS code; explain why it is or is not a real divergence' },
    severity: { type: 'string', enum: ['stream-shifting', 'value-only', 'cosmetic', 'none'] },
    suggestedFix: { type: 'string', description: 'minimal faithful fix if isReal, else empty' },
  },
}

const MODULES = [
  {
    name: 'WL_ACT2',
    focus: 'T_Shoot, T_Bite, T_Projectile, T_Chase, T_DogChase, T_Path, T_Stand, T_Launch, A_StartAttack, SelectPathDir, ProjectileTryMove. These hold 20 of the US_RndT calls. Check the EXACT count and order of US_RndT() per function, the hitchance/dist/damage math (16-bit), and the >>2/>>3/>>4 damage shifts.',
  },
  {
    name: 'WL_STATE',
    focus: 'CheckLine, CheckSight, SightPlayer, FirstSighting, SelectChaseDir, SelectDodgeDir, MoveObj, TryWalk, DamageActor, KillActor, SpawnNewObj, NewState. 8 US_RndT calls. CheckLine/CheckSight control whether T_Shoot fires (so they gate downstream RNG). SelectDodgeDir/FirstSighting/SightPlayer consume RNG — verify count/order and the fixed-point line math in CheckLine.',
  },
  {
    name: 'WL_AGENT',
    focus: 'T_Player, ControlMovement, Thrust, TakeDamage, GunAttack, KnifeAttack, T_Attack, ClipMove, TryMove, CheckWeaponChange, Cmd_Fire, Cmd_Use. 7 US_RndT calls (GunAttack/KnifeAttack hit rolls). Verify player damage application in TakeDamage (does it consume RNG? it must NOT unless the C does), and GunAttack target-selection + US_RndT order.',
  },
  {
    name: 'WL_PLAY',
    focus: 'PollControls (demo input read + the demoptr==lastdemoptr -> ex_completed end condition), DoActor (the per-actor think dispatch order), PlayLoop body ORDER, GetNewActor/RemoveObj (objlist linkage = DoActor iteration order), dirscan, ClearPaletteShifts/UpdatePaletteShifts. Only 1 US_RndT here but the tic ORDER and objlist order are decisive.',
  },
  {
    name: 'ID_US_1',
    altC: 'ID_US_1',
    focus: 'US_RndT itself, US_InitRndT, and the 256-entry rndtable. Verify rndtable values are byte-identical, that US_RndT does rndindex=(rndindex+1)&0xff; return rndtable[rndindex], and that US_InitRndT(false) sets rndindex=0. ALSO check ID_US_A.ASM.ts in the port (the port may define US_RndT/rndtable there). A wrong index pre/post-increment or seed shifts EVERYTHING.',
  },
  {
    name: 'WL_DRAW',
    focus: 'ThreeDRefresh, TransformActor, DrawScaleds, CalcTics, CalcHeight. No RNG, but DrawScaleds/visibility sets actor FL_VISABLE which T_Shoot reads for hitchance (160-dist*16 vs *8). Verify which actors get FL_VISABLE set each refresh, and the TransformActor fixed-point (viewx/viewheight) math, since a wrong FL_VISABLE flips hitchance and thus a hit/miss, adding/removing a damage roll.',
  },
  {
    name: 'WL_GAME',
    focus: 'SetupGameLevel and ScanInfoPlane (the ACTOR SPAWN ORDER over the map tiles — this fixes objlist order and thus per-tic RNG order; verify the tile scan order and SpawnStand/SpawnPatrol/SpawnBoss dispatch matches the C EXACTLY), plus the PlayLoop port (PlayLoopStepMemory / PlayDemoTrace) tic-body order vs the original PlayLoop in WL_PLAY.C. Confirm the port runs PollControls->MoveDoors->MovePWalls->DoActor(all)->UpdatePaletteShifts->ThreeDRefresh in that order and consumes no extra RNG.',
  },
]

function auditPrompt(m) {
  const cName = (m.altC ?? m.name)
  return `${CONTEXT}

You are auditing ONE module of the Wolf3D TypeScript port for FAITHFULNESS to the original C, focused on determinism (RNG stream + integer math).

Original C: ${SRC}/${cName}.C  (also read ${SRC}/${cName}.H if present)
Ported TS: ${TS}/${m.name}.C.ts  (and ${TS}/${m.name}.H.ts if present)
For ID_US also read ${TS}/ID_US_A.ASM.ts and ${SRC}/ID_US.H. For WL_GAME also read the relevant parts of ${SRC}/WL_PLAY.C for PlayLoop order, and ${SRC}/WL_GAME.C ScanInfoPlane.

FOCUS: ${m.focus}

Method:
1. Read both files (use offset/limit for large files; Grep for the focus functions).
2. For each focus function, compare the TS against the C STATEMENT BY STATEMENT, specifically:
   - Count US_RndT() calls and their ORDER. Any extra, missing, or reordered call is HIGH impact.
   - Any conditional that gates a US_RndT() call (if mispredicted vs C, it adds/removes a roll).
   - Integer truncation: results the C truncates to 16-bit signed but the TS leaves as float64, or wrong signedness, or Math.floor where C truncates toward zero.
   - Fixed-point multiply/shift sequences.
   - Iteration/spawn order that changes objlist order.
3. IGNORE differences in SPEAR/shareware dead code, comments, helper-struct shapes, and pure rendering pixel math that cannot affect the RNG stream or a comparison feeding a US_RndT gate.
4. Report ONLY divergences that could change runtime behavior. Quote BOTH the C and the TS. If the module is faithful, return an empty divergences array. Prefer precision over volume — at most ~8 findings, ranked by impact.

Return the structured object.`
}

phase('Audit')
log(`Auditing ${MODULES.length} determinism-critical module pairs vs original C`)

const results = await pipeline(
  MODULES,
  (m) => agent(auditPrompt(m), { label: `audit:${m.name}`, phase: 'Audit', schema: AUDIT_SCHEMA }),
  (audit, m) => {
    const divs = (audit?.divergences ?? []).filter((d) => (d.confidence ?? 0) >= 0.35)
    if (!divs.length) return []
    return parallel(divs.map((d) => () =>
      agent(
        `${CONTEXT}

Adversarially VERIFY a single claimed divergence between the Wolf3D port and the original C. Default to skepticism: only confirm if you can point to the exact C and TS code proving the port behaves differently at runtime in a way that shifts the US_RndT stream or flips a comparison feeding it.

Module: ${m.name}
Original C: ${SRC}/${m.altC ?? m.name}.C
Ported TS: ${TS}/${m.name}.C.ts

CLAIM:
- symbol: ${d.symbol}
- kind: ${d.kind}
- C behavior: ${d.cBehavior}
- TS behavior: ${d.tsBehavior}
- why claimed: ${d.why}
- location: ${d.location ?? 'n/a'}

Read BOTH sources around ${d.symbol}. Decide isReal. A divergence is 'stream-shifting' if it adds/removes/reorders a US_RndT() call or flips a comparison that gates one; 'value-only' if it changes a value but not the RNG stream; 'cosmetic'/'none' otherwise. Provide a minimal faithful fix only if isReal.`,
        { label: `verify:${m.name}:${d.symbol}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then((v) => ({ ...d, module: m.name, verdict: v })))
    )
  },
)

const all = results.flat().filter(Boolean)
const confirmed = all.filter((d) => d.verdict?.isReal)

return {
  totalCandidates: all.length,
  confirmedCount: confirmed.length,
  candidates: all.map((d) => ({
    module: d.module,
    symbol: d.symbol,
    kind: d.kind,
    impact: d.impact,
    confidence: d.confidence,
    cBehavior: d.cBehavior,
    tsBehavior: d.tsBehavior,
    why: d.why,
    location: d.location,
    verdict_isReal: d.verdict?.isReal,
    verdict_severity: d.verdict?.severity,
    verdict_reasoning: d.verdict?.reasoning,
    verdict_fix: d.verdict?.suggestedFix,
  })),
}
