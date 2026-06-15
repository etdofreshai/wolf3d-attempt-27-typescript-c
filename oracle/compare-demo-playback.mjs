// Phase 2 gate — attract-mode demo playback. Replicates main.ts's startDemo/stepDemo browser
// wiring (NewGame on Hard at the demo's map + US_InitRndT(false) + SetupGameLevel, then feed each
// recorded command through PlayLoop's demoCommand) and asserts the demo actually PLAYS: the player
// moves through the level and a mid-demo frame renders non-trivially. (Per-tic determinism itself
// is covered by check:demo-traces; this guards the browser playback wiring.)
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-demoplay-"));
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
const GAMEPAL = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));
mod.CA_Startup(files);
M.gamepal.set(GAMEPAL.subarray(0x77, 0x77 + 768));
mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
const config = M.ReadConfig(files.CONFIG);
M.BuildTables();
M.SetupWalls();
M.NewViewSize(config.viewsize);
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const tileOff = (sym) => mod.nearOffsetForRuntimeSymbol(sym);
const gsField = (name) => M.structFieldOffset ? M.structFieldOffset("gametype", name) : null;

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// startDemo(0) setup (mirrors main.ts)
const dgroup = new mod.DOSMemory(0x10000);
const areaconnect = new Uint8Array(37 * 37);
const T_DEMO0 = 139;
const demoBytes = mod.CA_CacheGrChunk(T_DEMO0);
const demo = mod.parseDemo(demoBytes);
mod.US_InitRndT(false);
M.NewGame(dgroup, 1, 0);
// The level (and player spawn) come from the planes loaded for demo.mapon, so the demo plays
// from its recorded map regardless of the gamestate fields.
const [p0, p1] = mod.CA_CacheMap(demo.mapon);
mod.SetupGameLevel(new Uint16Array(p0), new Uint16Array(p1), dgroup, { areaconnect, loadedgame: false });
dgroup.setU16(tileOff("_playstate"), 0);

const player = () => dgroup.u16(tileOff("_player"));
const playerTile = () => `${dgroup.u16(player() + 24)},${dgroup.u16(player() + 26)}`; // OBJ tilex/tiley at +24/+26
const startTile = playerTile();

// step the whole demo through PlayLoop's demoCommand
const seenTiles = new Set();
for (let i = 0; i < demo.commands.length; i++) {
  const r = mod.PlayLoop(dgroup, new Uint16Array(p0), new Uint16Array(p1), {
    maxSteps: 1, demoCommand: demo.commands[i], demoDone: i === demo.commands.length - 1,
    areaconnect, viewwidth: M.viewwidth, scale: M.scale, centerx: M.centerx, shootdelta: M.shootdelta, focallength: M.focallength,
  });
  seenTiles.add(playerTile());
  if (r.playstate) break;
}
const endTile = playerTile();
console.log(`demo 0: map ${demo.mapon}, ${demo.commands.length} commands; player ${startTile} -> ${endTile}; ${seenTiles.size} distinct tiles visited`);
expect(demo.commands.length > 100, "demo parsed with a real command stream");
expect(endTile !== startTile, "player moved over the course of the demo (input drives motion)");
expect(seenTiles.size >= 5, "player walked a real path through several tiles (not stuck on a wall)");

// render a frame after playback to confirm the view pipeline still produces a scene
mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: demo.mapon });
const VPB = 0x10000, PAGE = 80 * 208, W = 320, H = 200;
const disp = Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE;
const stride = (mod.linewidth & 0xffff) || 80;
let nonFloor = 0;
for (let y = 4; y < 150; y++) for (let x = 8; x < 312; x++) { const v = mod.videoPlanes[(x & 3) * VPB + ((disp + y * stride + (x >> 2)) & 0xffff)] ?? 0; if (v !== 25 && v !== 29) nonFloor++; }
console.log(`post-demo frame: ${nonFloor} non-floor/ceiling px`);
expect(nonFloor > 3000, "a 3D scene renders after demo playback (walls/sprites present)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0 ? "\n✅ DEMO PLAYBACK: attract-mode demo setup + per-command stepping drives motion and renders." : `\n❌ ${fail} demo-playback check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
