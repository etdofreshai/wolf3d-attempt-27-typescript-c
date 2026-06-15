// T4 video: render the deterministic E1M1 level-start frame in the TS port (headless,
// replicating main.ts's boot→loadLevel→renderFrame pipeline), deplanarize, and compare
// pixel-for-pixel against the oracle framebuffer dump (tmp/oracle-build/LFRAME0.BIN).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-t4-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel, DrawPlayScreen } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { ThreeDRefresh, scaledPosts, wallheight } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
  `export { PlayLoop, PollKeyboardButtons, PollKeyboardMove } from "${rel(path.join(targetDir, "WL_PLAY.C.ts"))}";`,
  `export { LoadLatchMem } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
  `export { DrawFace, DrawHealth, DrawLives, DrawLevel, DrawAmmo, DrawKeys, DrawWeapon, DrawScore } from "${rel(path.join(targetDir, "WL_AGENT.C.ts"))}";`,
  `export { STRUCTPIC, STATUSBARPIC, STARTTILE8, LATCHPICS_LUMP_START, LATCHPICS_LUMP_END } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
const GAMEPAL = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));
mod.CA_Startup(files);
M.gamepal.set(GAMEPAL.subarray(0x77, 0x77 + 768));

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
const p0 = new Uint16Array(plane0), p1 = new Uint16Array(plane1);
mod.SetupGameLevel(p0, p1, dgroup, { areaconnect, loadedgame: false });
mod.LoadLatchMem({ chunks: latchChunks, pictable });
mod.DrawPlayScreen(dgroup, { pictable, statusBarSource: statusBar, statusBarWidth: 320, statusBarHeight: 40 });
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const gs = mod.nearOffsetForRuntimeSymbol("_gamestate");
const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
console.log(`player tile=${dgroup.u16(player + 24)},${dgroup.u16(player + 26)} angle=${dgroup.u16(player + 42)} x=${dgroup.i32(player + 16)} y=${dgroup.i32(player + 20)}`);
{
  const tmOff = mod.nearOffsetForRuntimeSymbol("_tilemap");
  for (let y = 54; y <= 60; y++) {
    const row = [];
    for (let x = 28; x <= 36; x++) row.push(dgroup.u8(tmOff + x * 64 + y).toString().padStart(3));
    console.log(`tilemap y=${y} x28..36: ${row.join(" ")}`);
  }
}
// Run one PlayLoop tic with no input (as main.ts does before renderFrame), so the same
// view/projection state is established that the live game uses.
mod.PlayLoop(dgroup, p0, p1, {
  maxSteps: 1, tics: 1, areaconnect,
  viewwidth: M.viewwidth, scale: M.scale, centerx: M.centerx, shootdelta: M.shootdelta, focallength: M.focallength,
  pollControls: () => {},
});
mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: 0 });
const opt = { pictable };
mod.DrawFace(dgroup, opt); mod.DrawHealth(dgroup, opt); mod.DrawLives(dgroup, opt); mod.DrawLevel(dgroup, opt);
mod.DrawAmmo(dgroup, opt); mod.DrawKeys(dgroup, opt); mod.DrawWeapon(dgroup, opt); mod.DrawScore(dgroup, opt);

// deplanarize the port's videoPlanes at displayofs (mirrors IndexedVgaSurface.copyFromPlanarVga)
const VIDEO_PLANE_BYTES = 0x10000;
const VGA_PAGE_BYTES = 80 * 208;
const W = 320, H = 200;
const displayPageBase = (off) => Math.trunc((off & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const display = displayPageBase(mod.displayofs); // mirror main.ts present()
const stride = (mod.linewidth & 0xffff) || 80;
const portPx = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  const rowOffset = (display + y * stride) & 0xffff;
  for (let x = 0; x < W; x++) {
    const plane = x & 3;
    const planeOffset = (rowOffset + (x >> 2)) & 0xffff;
    portPx[y * W + x] = mod.videoPlanes[plane * VIDEO_PLANE_BYTES + planeOffset] ?? 0;
  }
}

const oraclePx = new Uint8Array((await readFile(path.join(repoRoot, "tmp", "oracle-build", "LFRAME0.BIN"))).subarray(768));

let diffs = 0;
for (let i = 0; i < W * H; i++) if (portPx[i] !== oraclePx[i]) diffs++;
{
  const colDiffs = [];
  for (let x = 0; x < W; x++) { let dc = 0; for (let y = 0; y < H; y++) if (portPx[y * W + x] !== oraclePx[y * W + x]) dc++; if (dc > 0) colDiffs.push([x, dc]); }
  colDiffs.sort((a, b) => b[1] - a[1]);
  console.log(`top diff columns: ${colDiffs.slice(0, 12).map(([x, d]) => `x${x}:${d}`).join(" ")}`);
}
console.log(`port displayofs=${display} linewidth=${stride}`);
console.log(`view: viewwidth=${M.viewwidth} viewheight=${M.viewheight} scale=${M.scale} heightnumerator=${M.heightnumerator} centerx=${M.centerx} focallength=${M.focallength} screenofs=${M.screenofs}`);
console.log(`wallheight[40,80,160,240,280] = ${[40, 80, 160, 240, 280].map((x) => mod.wallheight[x]).join(",")}`);
{
  const whBuf = await readFile(path.join(repoRoot, "tmp", "oracle-build", "WHEIGHT.BIN"));
  const oWH = new Int16Array(whBuf.buffer, whBuf.byteOffset, whBuf.length >> 1);
  console.log(`WHEIGHT.BIN entries=${oWH.length}`);
  const mism = [];
  for (let x = 0; x < M.viewwidth; x++) { if ((mod.wallheight[x] | 0) !== oWH[x]) mism.push(`x${x}:p${mod.wallheight[x]}/o${oWH[x]}`); }
  console.log(`wallheight mismatches (${mism.length}): ${mism.slice(0, 40).join(" ")}`);
  for (const vx of [134, 136, 138, 140, 142]) console.log(`  wallheight[vx=${vx}] port=${mod.wallheight[vx]} oracle=${oWH[vx]}`);
}
console.log(`pixel diffs: ${diffs}/${W * H} (${(100 * diffs / (W * H)).toFixed(2)}%)`);
{
  const posts = mod.scaledPosts;
  let even = 0, odd = 0; const sides = {};
  for (const p of posts) { if ((p.wallpic & 1) === 0) even++; else odd++; sides[p.side] = (sides[p.side] ?? 0) + 1; }
  console.log(`scaledPosts: ${posts.length} total; wallpic even(light)=${even} odd(dark)=${odd}; sides=${JSON.stringify(sides)}`);
  for (const sx of [144, 146, 148]) {
    const vx = sx - 8;
    const hit = posts.filter((p) => vx >= p.x && vx < p.x + p.width);
    const diffRows = [];
    for (let y = 0; y < H; y++) if (portPx[y * W + sx] !== oraclePx[y * W + sx]) diffRows.push(`y${y}:p${portPx[y * W + sx]}/o${oraclePx[y * W + sx]}`);
    console.log(`  x=${sx} (viewx ${vx}) post=${hit.map((p) => `wallpic=${p.wallpic}s${p.side}`).join(",")} diffRows: ${diffRows.join(" ")}`);
  }
  for (const cx of [124, 195]) {
    const p = [], o = [];
    for (let y = 20; y < 140; y += 3) { p.push(portPx[y * W + cx]); o.push(oraclePx[y * W + cx]); }
    console.log(`col x=${cx} y20..137/3 port  =[${p.join(",")}]`);
    console.log(`col x=${cx} y20..137/3 oracle=[${o.join(",")}]`);
  }
  // Indexed dump at door center x=148 for rows 100..160 (the bottom transition)
  for (const cx of [148]) {
    const rows = [];
    for (let y = 100; y <= 160; y++) rows.push(`y${y}:p${portPx[y * W + cx]}/o${oraclePx[y * W + cx]}`);
    console.log(`IDX col x=${cx} rows100-160: ${rows.join(" ")}`);
  }
}

// write 3-panel PNG: port | oracle | diff-mask (magenta = differing pixel) for inspection
const pal = GAMEPAL.subarray(0x77, 0x77 + 768);
const OW = W * 3 + 16;
const raw = Buffer.alloc(H * (1 + OW * 3));
const put = (buf, o, idx) => { buf[o] = Math.min(255, pal[idx * 3] * 4); buf[o + 1] = Math.min(255, pal[idx * 3 + 1] * 4); buf[o + 2] = Math.min(255, pal[idx * 3 + 2] * 4); };
for (let y = 0; y < H; y++) {
  let o = y * (1 + OW * 3); raw[o++] = 0;
  for (let x = 0; x < W; x++) { put(raw, o, portPx[y * W + x]); o += 3; }
  for (let x = 0; x < 8; x++) { raw[o] = raw[o + 1] = raw[o + 2] = 64; o += 3; }
  for (let x = 0; x < W; x++) { put(raw, o, oraclePx[y * W + x]); o += 3; }
  for (let x = 0; x < 8; x++) { raw[o] = raw[o + 1] = raw[o + 2] = 64; o += 3; }
  for (let x = 0; x < W; x++) { const d = portPx[y * W + x] !== oraclePx[y * W + x]; raw[o] = d ? 255 : 0; raw[o + 1] = 0; raw[o + 2] = d ? 255 : 0; o += 3; }
}
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; }
function ch(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const tt = Buffer.from(t); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([tt, d]))); return Buffer.concat([l, tt, d, cr]); }
const ih = Buffer.alloc(13); ih.writeUInt32BE(OW, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
await writeFile(path.join(repoRoot, "tmp", "t4-port-vs-oracle.png"), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ih), ch("IDAT", zlib.deflateSync(raw)), ch("IEND", Buffer.alloc(0))]));
console.log("wrote tmp/t4-port-vs-oracle.png (port | oracle)");
await rm(tempDir, { recursive: true, force: true });
