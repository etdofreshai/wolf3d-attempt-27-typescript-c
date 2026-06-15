// Phase 2 gate — floor-completed intermission screen. Replicates main.ts's drawIntermission
// (VWB_Bar clear + VWB_DrawPic(L_GUYPIC) + Write labels/values via the LevelEnd lump 43-85),
// deplanarizes, and asserts it draws non-trivial content: the BJ figure (left region) and the
// bonus/time/par/ratio text (right region) — i.e. not a blank or broken screen. Guards against
// regressions in the intermission wiring, pic caching, and Write text layout.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-inter-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { VWB_Bar, VWB_DrawPic } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { Write } from "${rel(path.join(targetDir, "WL_INTER.C.ts"))}";`,
  `export { L_GUYPIC } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
  `export { STRUCTPIC } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
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

const pictable = mod.CA_CacheGrChunk(mod.STRUCTPIC);
const levelEndChunks = [];
for (let c = mod.L_GUYPIC; c <= 85; c++) levelEndChunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

// replicate main.ts drawIntermission with sample E1M1-style stats
const opt = { chunks: levelEndChunks, pictable };
mod.VWB_Bar(0, 0, 320, 160, 127);
mod.VWB_DrawPic(0, 16, mod.L_GUYPIC, { source: levelEndChunks[mod.L_GUYPIC], pictable });
mod.Write(14, 2, "floor\ncompleted", opt);
mod.Write(26, 2, "1", opt);
mod.Write(14, 7, "bonus", opt);
mod.Write(36 - 4 * 2, 7, "1500", opt);
mod.Write(16, 10, "time", opt);
mod.Write(16, 12, " par", opt);
mod.Write(26, 12, "01:30", opt);
mod.Write(26, 10, "00:45", opt);
mod.Write(9, 14, "kill ratio    %", opt);
mod.Write(5, 16, "secret ratio    %", opt);
mod.Write(1, 18, "treasure ratio    %", opt);
mod.Write(37 - 3 * 2, 14, "100", opt);
mod.Write(37 - 2 * 2, 16, "50", opt);
mod.Write(37 - 1 * 2, 18, "0", opt);

// deplanarize
const VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208, W = 320, H = 200;
const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const stride = (mod.linewidth & 0xffff) || 80;
const px = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  const row = (display + y * stride) & 0xffff;
  for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((row + (x >> 2)) & 0xffff)] ?? 0;
}

// Analyze: top 160px should be mostly bg color 127 with non-127 content (BJ + text);
// the BJ figure occupies the left columns, text the right.
let bg = 0, nonBg = 0, bjRegion = 0, textRegion = 0;
for (let y = 16; y < 160; y++) {
  for (let x = 0; x < W; x++) {
    const v = px[y * W + x];
    if (v === 127) bg++; else { nonBg++; if (x < 96) bjRegion++; else textRegion++; }
  }
}
let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
console.log(`intermission render: bg(127)=${bg}px nonBg=${nonBg}px (BJ-region=${bjRegion}, text-region=${textRegion})`);
expect(nonBg > 2000, "screen has substantial non-background content (BJ + text drawn)");
expect(bjRegion > 500, "BJ figure region (left) drew pixels");
expect(textRegion > 1000, "text/stats region (right) drew pixels");
expect(bg > 5000, "background color 127 fills most of the screen (cleared correctly)");

const deplanarize = () => {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const row = (display + y * stride) & 0xffff;
    for (let x = 0; x < W; x++) out[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((row + (x >> 2)) & 0xffff)] ?? 0;
  }
  return out;
};

// ---- victory "you win!" screen (replicate main.ts drawVictory) ----------------------------
const L_BJWINSPIC = 85;
mod.VWB_Bar(0, 0, 320, 160, 127);
mod.VWB_DrawPic(8, 4, L_BJWINSPIC, { source: levelEndChunks[L_BJWINSPIC], pictable });
mod.Write(18, 2, "you win!", opt);
mod.Write(14, 6, "total time", opt);
mod.Write(14, 8, "02:15", opt);
mod.Write(12, 12, "averages", opt);
mod.Write(14, 14, "kill    %", opt);
mod.Write(10, 16, "secret    %", opt);
mod.Write(6, 18, "treasure    %", opt);
mod.Write(30 - 3 * 2, 14, "100", opt);
mod.Write(30 - 2 * 2, 16, "75", opt);
mod.Write(30 - 1 * 2, 18, "0", opt);
const vpx = deplanarize();
let vbg = 0, vnonBg = 0, vbjRegion = 0, vtextRegion = 0;
for (let y = 4; y < 160; y++) for (let x = 0; x < W; x++) { const v = vpx[y * W + x]; if (v === 127) vbg++; else { vnonBg++; if (x < 96) vbjRegion++; else vtextRegion++; } }
console.log(`victory render:      bg(127)=${vbg}px nonBg=${vnonBg}px (BJ-region=${vbjRegion}, text-region=${vtextRegion})`);
expect(vnonBg > 2000, "victory screen has substantial content (BJ-wins + text)");
expect(vbjRegion > 500, "victory BJ-wins figure drew pixels");
expect(vtextRegion > 1000, "victory text/averages drew pixels");

// write PNGs for visual confirmation (best-effort; never fails the gate)
try {
  const zlib = await import("node:zlib");
  await (await import("node:fs/promises")).mkdir(path.join(repoRoot, "tmp"), { recursive: true });
  const pal = GAMEPAL.subarray(0x77, 0x77 + 768);
  const crc32 = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const tt = Buffer.from(t); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([tt, d]))); return Buffer.concat([l, tt, d, cr]); };
  const writePng = async (pixels, name) => {
    const raw = Buffer.alloc(H * (1 + W * 3));
    for (let y = 0; y < H; y++) { let o = y * (1 + W * 3); raw[o++] = 0; for (let x = 0; x < W; x++) { const i = pixels[y * W + x]; raw[o++] = Math.min(255, pal[i * 3] * 4); raw[o++] = Math.min(255, pal[i * 3 + 1] * 4); raw[o++] = Math.min(255, pal[i * 3 + 2] * 4); } }
    const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
    await writeFile(path.join(repoRoot, "tmp", name), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ih), ch("IDAT", zlib.deflateSync(raw)), ch("IEND", Buffer.alloc(0))]));
  };
  await writePng(px, "intermission.png");
  await writePng(vpx, "victory.png");
  console.log("wrote tmp/intermission.png + tmp/victory.png");
} catch { /* PNG is a debugging aid; ignore write failures in CI */ }

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0 ? "\n✅ END-SCREENS: floor-completed intermission + 'you win!' victory screens both render (BJ figure + stats)." : `\n❌ ${fail} end-screen render check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
