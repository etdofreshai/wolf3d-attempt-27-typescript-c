export const meta = {
  name: 'wolf3d-tier-assessment',
  description: 'Assess current state of each PORTING.md acceptance tier to build an accurate finish roadmap',
  phases: [{ title: 'Assess', detail: 'one agent per tier/area reads the code and reports status + gaps' }],
}

const REPO = 'C:/Users/etgarcia/.codex/worktrees/5e66/wolf3d-attempt-27-typescript-c'
const TS = `${REPO}/apps/source-typescript/src`
const SRC = `${REPO}/source/WOLFSRC`

const CONTEXT = `
PROJECT: a 100% faithful TypeScript port of DOS Wolfenstein 3D (registered WL6) in apps/source-typescript, governed by PORTING.md. Acceptance ladder (§9): T0 structural mirror, T1 asset parity, T2 demo determinism (keystone), T3 byte-identical save interop, T4 audio/visual parity. The oracle (§8) is the Borland-rebuilt source run under DOSBox.

ALREADY ESTABLISHED THIS SESSION (do not re-investigate, treat as known):
- T0 + T1 PASS (scripts/check-source-typescript-port.mjs gets past structural + asset gates to runtime demo playback).
- T2: a working per-tic DOS oracle was built (instrumented Borland build under DOSBox). The port is BIT-EXACT vs the oracle for demos 139/141/142 (all end ex_died, matching tic). Demo 140 has one real bug (extra US_RndT at cmd 566 in officer T_Chase). The checker's demo gate wrongly asserts playstate===1 (ex_completed); the real end state is ex_died for all 4.
- A fidelity fix landed: s_dogdead tictime 0->15.

Your job: report the CURRENT implementation state of your assigned area so a finish-roadmap can be written. Read the actual code. Be concrete about what EXISTS, what's STUBBED/MISSING, and the specific GAP to the PORTING.md acceptance bar. Cite files:lines.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['area', 'status', 'whatExists', 'gaps', 'nextActions'],
  properties: {
    area: { type: 'string' },
    status: { type: 'string', enum: ['done', 'mostly', 'partial', 'scaffolded', 'missing'] },
    whatExists: { type: 'array', items: { type: 'string' }, description: 'concrete things implemented, with file:line' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'specific missing pieces vs the PORTING.md bar' },
    nextActions: { type: 'array', items: { type: 'string' }, description: 'ordered concrete steps to close the gap' },
    estimateNotes: { type: 'string', description: 'rough size/risk of the remaining work' },
  },
}

const AREAS = [
  {
    key: 'T3-saves',
    prompt: `Assess T3 (byte-identical save-game interop, PORTING.md §10). Read ${TS}/WOLFSRC/TS_SAVE_LAYOUT.ts, the serializeSaveGame/parseSaveGameImage/loadSaveGameImage exports, ${TS}/WOLFSRC/WL_MAIN.C.ts (SaveTheGame/LoadTheGame/DoChecksum), ${TS}/WOLFSRC/TS_DGROUP_LAYOUT.ts, ${SRC}/WL_MAIN.C (SaveTheGame/LoadTheGame), and how scripts/check-source-typescript-port.mjs exercises saves (grep buildSyntheticSaveImage, serializeSaveGame). Report: is save serialization implemented and byte-identical to the original? Is the DGROUP layout map wired in? Is there a save round-trip test against oracle-captured saves? What's missing to make T3 green (both directions: original->port load, port->original byte-identical write + DoChecksum).`,
  },
  {
    key: 'T4-video',
    prompt: `Assess T4 video (per-frame framebuffer parity, PORTING.md §9 T4). Read ${TS}/platform/vga.ts, ${TS}/WOLFSRC/WL_DRAW.C.ts (ThreeDRefresh, WallRefresh, DrawScaleds, ScalePost), ${TS}/WOLFSRC/ID_VL.C.ts, ${TS}/WOLFSRC/ID_VH.C.ts, the .ASM.ts scalers (WL_DR_A, WL_SCALE, JABHACK, WHACK_A). Report: does the port render a deterministic indexed 320x200 framebuffer through the ported raycaster + scalers? Is the output a faithful integer renderer (not an approximation)? Is there any per-frame framebuffer-hash comparison vs the oracle? What's missing to make T4-video green (pixel-exact framebuffer hash across a demo).`,
  },
  {
    key: 'T4-audio',
    prompt: `Assess T4 audio (OPL register-stream parity + PC speaker + digi, §9 T4, §11 item 2 Nuked-OPL). Read ${TS}/platform/audio.ts, ${TS}/WOLFSRC/ID_SD.C.ts (SD_PlaySound, SDL_ALSoundService, alRegisterWrites, SDL_PCService, SDL_t0Service), ${TS}/WOLFSRC/ID_SD_A.ASM.ts. Report: does the port produce an OPL2 register-write stream with tic timestamps? Is there a Nuked-OPL core? PC-speaker + digitized PCM events? Any comparison of the register stream vs the oracle at the same tics? What's missing to make T4-audio green.`,
  },
  {
    key: 'playability',
    prompt: `Assess actual browser playability of apps/source-typescript (GOAL.md: "boots into a real Wolf3D experience, fully playable"). Read ${TS}/main.ts fully, ${TS}/platform/vga.ts, ${REPO}/apps/source-typescript/vite.config.ts. Report: from a cold boot in the browser, does the wired runtime reach a playable in-game state (menu -> new game -> 3D view + input + status bar + audio)? What game-flow pieces are present vs missing (intermission/Victory/Died/level transitions/game-over/score screen/save+load UI)? Is the tic loop faithful (70Hz stepped)? What's missing for "fully playable end to end".`,
  },
  {
    key: 'oracle-harness',
    prompt: `Assess the oracle + cross-side comparison harness (§8, §9 tooling requirement). Read ${REPO}/oracle/README.md, list ${REPO}/oracle/, ${REPO}/apps/source-modified-dos/ (is it instrumented or just a js-dos frontend?), and scripts/check-source-typescript-port.mjs structure (what it validates, how it bundles the port, the EXPECTED fixtures baked in). NOTE: this session proved the Borland+DOSBox oracle builds/runs headless and can dump per-tic rndindex+state; a scratch instrumented build is in ${REPO}/tmp/oracle-build. Report: what oracle infrastructure exists, what per-tic/per-frame/OPL fixtures exist vs are missing, and what's needed to formalize per-tic instrumentation into apps/source-modified-dos and to add a both-sides comparison harness.`,
  },
  {
    key: 'T0-T1-checker',
    prompt: `Assess T0 (structural) and T1 (asset parity) completeness and the checker design. Read the structure of scripts/check-source-typescript-port.mjs (it's ~12k lines; grep for the check function names and EXPECTED fixtures; read checkRuntimeDemoPlayback around line 12291). Cross-check: do all ${SRC}/*.C/*.H/*.ASM have a corresponding .ts under ${TS}/WOLFSRC (compare directory listings)? Are all original functions present (the checker validates this)? Report: are T0 and T1 truly complete, any residual structural/asset gaps, and specifically how the demo-playback gate (checkRuntimeDemoPlayback) is currently written so it can be replaced with a per-tic oracle-fixture comparison.`,
  },
]

phase('Assess')
log(`Assessing ${AREAS.length} areas for the finish roadmap`)
const results = await parallel(AREAS.map((a) => () =>
  agent(`${CONTEXT}\n\n=== AREA: ${a.key} ===\n${a.prompt}`, { label: `assess:${a.key}`, phase: 'Assess', schema: SCHEMA })
    .then((r) => ({ key: a.key, ...r }))))

return { assessments: results.filter(Boolean) }
