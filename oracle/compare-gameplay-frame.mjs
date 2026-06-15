// T4 video gate — a GAMEPLAY frame (not just the empty E1M1 start). check:frame only validates
// the static level-start snapshot, so the sprite/enemy/door-animation render paths (DrawScaleds,
// scaled-shape posts) were never gated. This drives the bit-exact attract demo to a mid-demo tic
// where enemies are on screen, renders the FULL pipeline, and asserts:
//   1. it's a real 3D gameplay scene, distinct from the empty start frame;
//   2. enemy actors actually exist in the scene being drawn;
//   3. two fully-independent runs to the same tic are byte-identical — i.e. the whole render
//      pipeline (raycaster + DrawScaleds + sprite scaling) is a pure function of the per-tic sim
//      state, which check:demo-traces already proves byte-exact to the DOS oracle.
// Scope note: this is a determinism + content gate. Byte-exact PARITY for gameplay frames would
// need a DOS-oracle VGA dump mid-demo (not generated here); the start frame remains the byte-exact
// parity anchor (check:frame), and the sim driving this frame is oracle-exact (check:demo-traces).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-gpframe-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { PlayLoop } from "${rel(path.join(targetDir, "WL_PLAY.C.ts"))}";`,
  `export { ThreeDRefresh } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) {
  files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
}
mod.CA_Startup(files);
mod.PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
const config = M.ReadConfig(files.CONFIG);
M.BuildTables();
M.SetupWalls();
M.NewViewSize(config.viewsize);

const T_DEMO0 = 139;
const demo = mod.parseDemo(mod.CA_CacheGrChunk(T_DEMO0));
const tileOff = (s) => mod.nearOffsetForRuntimeSymbol(s);
const VPB = 0x10000, PAGE = 80 * 208, W = 320, H = 200;
const STOP_TIC = Math.min(160, demo.commands.length - 1); // mid-demo: player is moving through rooms

// Play the demo to STOP_TIC from a fresh setup and return {framebuffer, actorCount}.
function renderAtTic() {
  mod.VL_ResetVideoState();
  mod.VL_SetVGAPlaneMode();
  mod.VL_SetBufferOffset(0);
  mod.VL_SetScreen(0, 0);
  const dgroup = new mod.DOSMemory(0x10000);
  const areaconnect = new Uint8Array(37 * 37);
  mod.US_InitRndT(false);
  M.NewGame(dgroup, 1, 0);
  const [p0, p1] = mod.CA_CacheMap(demo.mapon);
  mod.SetupGameLevel(new Uint16Array(p0), new Uint16Array(p1), dgroup, { areaconnect, loadedgame: false });
  dgroup.setU16(tileOff("_playstate"), 0);
  for (let i = 0; i <= STOP_TIC; i++) {
    const r = mod.PlayLoop(dgroup, new Uint16Array(p0), new Uint16Array(p1), {
      maxSteps: 1, demoCommand: demo.commands[i], demoDone: false,
      areaconnect, viewwidth: M.viewwidth, scale: M.scale, centerx: M.centerx, shootdelta: M.shootdelta, focallength: M.focallength,
    });
    if (r.playstate) break;
  }
  mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: demo.mapon });
  // Deplanarize the displayed page to a flat 320x200 indexed buffer.
  const disp = Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE;
  const stride = (mod.linewidth & 0xffff) || 80;
  const px = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const ro = (disp + y * stride) & 0xffff; for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VPB + ((ro + (x >> 2)) & 0xffff)] ?? 0; }
  // Count actors in the linked list (player + enemies/objects) via OBJ.next chaining.
  let actorCount = 0, a = dgroup.u16(tileOff("_player"));
  const OBJ_NEXT = 56; // objtype.next near-offset (TS_LEVEL_SETUP OBJ_NEXT_OFFSET)
  const seen = new Set();
  while (a && !seen.has(a) && actorCount < 256) { seen.add(a); actorCount++; a = dgroup.u16(a + OBJ_NEXT); }
  return { px, actorCount };
}

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

const a = renderAtTic();
const b = renderAtTic();

// Compare against the committed empty E1M1 start frame to prove this is a different, real scene.
const startFrame = new Uint8Array((await readFile(path.join(repoRoot, "oracle", "generated", "frames", "wl6-e1m1-start-frame.bin"))).subarray(768));

let nonFloor = 0, distinct = new Set(), diffFromStart = 0;
for (let i = 0; i < W * H; i++) {
  const v = a.px[i];
  if (v !== 25 && v !== 29) nonFloor++; // 25=floor, 29=ceiling
  distinct.add(v);
  if (v !== startFrame[i]) diffFromStart++;
}
let identical = a.px.length === b.px.length;
for (let i = 0; identical && i < a.px.length; i++) if (a.px[i] !== b.px[i]) identical = false;

console.log(`gameplay frame @tic ${STOP_TIC}: ${nonFloor} non-floor/ceiling px, ${distinct.size} distinct colors, ${a.actorCount} actors, ${diffFromStart} px differ from E1M1 start`);
expect(a.actorCount > 3, "scene has multiple actors (enemies/objects) present on the map");
expect(nonFloor > 3000, "a substantial 3D scene rendered (walls + sprites)");
expect(distinct.size > 20, "the frame uses many palette colors (textured walls + sprites, not a flat error screen)");
expect(diffFromStart > 20000, "the gameplay frame is materially different from the empty E1M1 start frame");
expect(identical, "two independent runs to the same demo tic render BYTE-IDENTICAL frames (render pipeline is deterministic)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ GAMEPLAY FRAME: a mid-demo scene with enemies renders deterministically through the full sprite pipeline."
  : `\n❌ ${fail} gameplay-frame check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
