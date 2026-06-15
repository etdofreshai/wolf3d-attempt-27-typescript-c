// Feature gate — the Pause overlay. WL_PLAY.C CheckKeys freezes the game and draws
// LatchDrawPic(20-4, 80-2*8, PAUSEDPIC) over the live frame; main.ts does the same in drawPaused().
// This renders the E1M1 frame, overlays PAUSEDPIC the same way, and asserts the pic actually drew
// into its region (the latch pic loaded + blitted at the right spot) — not a no-op.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-pause-"));
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
  `export { LoadLatchMem, LatchDrawPic } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
  `export { STRUCTPIC, STATUSBARPIC, STARTTILE8, LATCHPICS_LUMP_START, LATCHPICS_LUMP_END, PAUSEDPIC } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
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
const [p0, p1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(p0), new Uint16Array(p1), dgroup, { areaconnect, loadedgame: false });
mod.LoadLatchMem({ chunks: latchChunks, pictable });
mod.DrawPlayScreen(dgroup, { pictable, statusBarSource: statusBar, statusBarWidth: 320, statusBarHeight: 40 });
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: 0 });

const VPB = 0x10000, PAGE = 80 * 208, W = 320, H = 200;
const read = () => {
  const disp = Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE;
  const stride = (mod.linewidth & 0xffff) || 80;
  const px = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const ro = (disp + y * stride) & 0xffff; for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VPB + ((ro + (x >> 2)) & 0xffff)] ?? 0; }
  return px;
};

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// Region where PAUSEDPIC lands: x = (20-4)*8 = 128px, y = 80-16 = 64px. Sample a generous box.
const X0 = 100, X1 = 220, Y0 = 56, Y1 = 96;
const regionHash = (px) => { let h = 0, nz = 0; for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const v = px[y * W + x]; h = (h * 31 + v) >>> 0; if (v) nz++; } return { h, nz }; };

const before = regionHash(read());
// ThreeDRefresh page-flips (bufferofs → next page); draw onto the visible page like drawPaused does.
mod.VL_SetBufferOffset(Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE);
mod.LatchDrawPic(20 - 4, 80 - 2 * 8, mod.PAUSEDPIC, { pictable });
const after = regionHash(read());

console.log(`PAUSEDPIC=${mod.PAUSEDPIC}; region before hash=${before.h} nz=${before.nz}, after hash=${after.h} nz=${after.nz}`);
expect(mod.PAUSEDPIC === 133, "PAUSEDPIC resolves to the WL6 latch pic 133");
expect(after.h !== before.h, "drawing PAUSEDPIC changed the overlay region (the pic actually blitted)");
expect(after.nz > 200, "the PAUSEDPIC region has substantial content after the overlay (pic drew, not a no-op)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ PAUSE: PAUSEDPIC loads from the latch set and overlays the live frame at the faithful position."
  : `\n❌ ${fail} pause check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
