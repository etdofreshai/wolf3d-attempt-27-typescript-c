// T4 video gate: render the deterministic E1M1 level-start frame in the TS port
// (replicating main.ts's boot→loadLevel→renderFrame), deplanarize, and compare pixel-for-
// pixel against the committed DOS oracle framebuffer (oracle/generated/frames/...). The
// port is now BYTE-IDENTICAL (0/64000 diff) — walls, doors, scaled sprites, the held weapon,
// and the status bar all match the DOS render exactly (see memory/t4-video-parity.md). This
// gate guards against ANY rendering regression.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const MAX_DIFF = 0; // byte-identical; any nonzero diff is a regression
const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const framePath = path.join(repoRoot, "oracle", "generated", "frames", "wl6-e1m1-start-frame.bin");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-t4gate-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel, DrawPlayScreen } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { ThreeDRefresh } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
  `export { LoadLatchMem } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
  `export { DrawFace, DrawHealth, DrawLives, DrawLevel, DrawAmmo, DrawKeys, DrawWeapon, DrawScore } from "${rel(path.join(targetDir, "WL_AGENT.C.ts"))}";`,
  `export { STRUCTPIC, STATUSBARPIC, STARTTILE8, LATCHPICS_LUMP_START, LATCHPICS_LUMP_END } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);

const pictable = mod.CA_CacheGrChunk(mod.STRUCTPIC);
const statusBar = mod.CA_CacheGrChunk(mod.STATUSBARPIC);
const latchChunks = [];
latchChunks[mod.STARTTILE8] = mod.CA_CacheGrChunk(mod.STARTTILE8);
for (let c = mod.LATCHPICS_LUMP_START; c <= mod.LATCHPICS_LUMP_END; c++) latchChunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
mod.US_InitRndT(false);
const config = M.ReadConfig(files.CONFIG);
M.BuildTables();
M.SetupWalls();
M.NewViewSize(config.viewsize);
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const dgroup = new mod.DOSMemory(0x10000);
const areaconnect = new Uint8Array(37 * 37);
M.NewGame(dgroup, 1, 0);
mod.US_InitRndT(false);
const [plane0, plane1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect, loadedgame: false });
mod.LoadLatchMem({ chunks: latchChunks, pictable });
mod.DrawPlayScreen(dgroup, { pictable, statusBarSource: statusBar, statusBarWidth: 320, statusBarHeight: 40 });
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: 0 });
const opt = { pictable };
mod.DrawFace(dgroup, opt); mod.DrawHealth(dgroup, opt); mod.DrawLives(dgroup, opt); mod.DrawLevel(dgroup, opt);
mod.DrawAmmo(dgroup, opt); mod.DrawKeys(dgroup, opt); mod.DrawWeapon(dgroup, opt); mod.DrawScore(dgroup, opt);

const VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208, W = 320, H = 200;
const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const stride = (mod.linewidth & 0xffff) || 80;
const portPx = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  const rowOffset = (display + y * stride) & 0xffff;
  for (let x = 0; x < W; x++) portPx[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((rowOffset + (x >> 2)) & 0xffff)] ?? 0;
}
const oraclePx = new Uint8Array((await readFile(framePath)).subarray(768));
let diffs = 0;
for (let i = 0; i < W * H; i++) if (portPx[i] !== oraclePx[i]) diffs++;
await rm(tempDir, { recursive: true, force: true });

const pct = (100 * diffs / (W * H)).toFixed(2);
if (diffs <= MAX_DIFF) {
  console.log(`✅ T4 VIDEO FRAME: port E1M1 level-start render is byte-identical to the DOS oracle (${diffs}/${W * H} diff).`);
  process.exitCode = 0;
} else {
  console.log(`❌ T4 VIDEO FRAME regression: ${diffs}/${W * H} pixels differ (${pct}%) > ${MAX_DIFF} budget. See memory/t4-video-parity.md.`);
  process.exitCode = 1;
}
