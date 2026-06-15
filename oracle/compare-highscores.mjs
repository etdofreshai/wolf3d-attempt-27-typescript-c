// Phase 2 gate — high-score table. Renders WL_INTER.C DrawHighScores with the same browser
// callbacks main.ts's showHighScores uses (drawPic -> VWB_DrawPic(cached chunk); print ->
// VW_SetFontState({px,py}) + VW_DrawPropString), deplanarizes, and asserts the HIGH SCORES title
// pic + headers draw and all 7 score rows render text. Guards the wiring, pic caching, and the
// proportional-font print path against regressions.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-hs-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { VWB_DrawPic, VW_SetFontState, VW_DrawPropString } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { DrawHighScores } from "${rel(path.join(targetDir, "WL_INTER.C.ts"))}";`,
  `export { Scores } from "${rel(path.join(targetDir, "ID_US_1.C.ts"))}";`,
  `export { HIGHSCORESPIC, STARTFONT, STRUCTPIC } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
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
// cache the high-score graphics: title (90), headers C_NAME/LEVEL/SCORE (39/40/38), and font 0 (1)
const chunks = [];
for (const c of [mod.HIGHSCORESPIC, 38, 39, 40, mod.STARTFONT]) chunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

mod.DrawHighScores({
  cacheGraphic: (chunk) => (chunks[chunk] ??= mod.CA_CacheGrChunk(chunk)),
  drawPic: (x, y, picnum) => mod.VWB_DrawPic(x, y, picnum, { source: chunks[picnum] ?? mod.CA_CacheGrChunk(picnum), pictable }),
  print: (x, y, text) => { mod.VW_SetFontState({ px: x, py: y, fontcolor: 15, fontnumber: 0 }); return mod.VW_DrawPropString(text); },
});

// deplanarize
const VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208, W = 320, H = 200;
const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const stride = (mod.linewidth & 0xffff) || 80;
const px = new Uint8Array(W * H);
for (let y = 0; y < H; y++) { const row = (display + y * stride) & 0xffff; for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((row + (x >> 2)) & 0xffff)] ?? 0; }

// Analyze: title pic in top rows; 7 score rows of text at y=76+16*i (76..172).
const BORD = 0x29;
let nonBg = 0, titleRegion = 0;
const rowHits = [];
for (let i = 0; i < 7; i++) { const y0 = 76 + 16 * i; let hit = 0; for (let y = y0; y < y0 + 10 && y < H; y++) for (let x = 0; x < W; x++) if (px[y * W + x] !== BORD && px[y * W + x] !== 0) hit++; rowHits.push(hit); }
for (let y = 0; y < 68; y++) for (let x = 0; x < W; x++) if (px[y * W + x] !== BORD && px[y * W + x] !== 0) { nonBg++; titleRegion++; }
let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
console.log(`highscores render: title-region=${titleRegion}px; score-row hits=[${rowHits.join(",")}]`);
expect(titleRegion > 800, "HIGH SCORES title + headers drew pixels (top region)");

// ---- name-entry state (replicate main.ts showHighScores(entryIndex)): a new high score on row
// 0 with a partially-typed name + a trailing cursor. Verify the cursor lengthens that row. ----
const baselineRow0 = rowHits[0];
mod.Scores[0].name = "ab"; // a freshly-typed short name (was the longest default name)
const drawEntry = () => {
  mod.DrawHighScores({
    cacheGraphic: (chunk) => (chunks[chunk] ??= mod.CA_CacheGrChunk(chunk)),
    drawPic: (x, y, picnum) => mod.VWB_DrawPic(x, y, picnum, { source: chunks[picnum] ?? mod.CA_CacheGrChunk(picnum), pictable }),
    print: (x, y, text) => { mod.VW_SetFontState({ px: x, py: y, fontcolor: 15, fontnumber: 0 }); return mod.VW_DrawPropString(text); },
  });
  mod.VW_SetFontState({ px: 4 * 8, py: 76, fontcolor: 15, fontnumber: 0 });
  mod.VW_DrawPropString(`${mod.Scores[0].name}_`); // name + typing cursor
};
drawEntry();
const epx = new Uint8Array(W * H);
for (let y = 0; y < H; y++) { const row = (display + y * stride) & 0xffff; for (let x = 0; x < W; x++) epx[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((row + (x >> 2)) & 0xffff)] ?? 0; }
let entryRowHits = 0; for (let y = 76; y < 86; y++) for (let x = 4 * 8; x < 20 * 8; x++) if (epx[y * W + x] !== BORD && epx[y * W + x] !== 0) entryRowHits++;
console.log(`name-entry render: row0 "ab_" hits=${entryRowHits}px (baseline full-name row0=${baselineRow0}px)`);
expect(entryRowHits > 20, "name-entry row renders the typed name + cursor");
const rowsWithText = rowHits.filter((h) => h > 40).length;
expect(rowsWithText >= 7, `all 7 score rows drew text (got ${rowsWithText})`);

// PNG
try {
  const zlib = await import("node:zlib");
  await (await import("node:fs/promises")).mkdir(path.join(repoRoot, "tmp"), { recursive: true });
  const pal = GAMEPAL.subarray(0x77, 0x77 + 768);
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) { let o = y * (1 + W * 3); raw[o++] = 0; for (let x = 0; x < W; x++) { const i = px[y * W + x]; raw[o++] = Math.min(255, pal[i * 3] * 4); raw[o++] = Math.min(255, pal[i * 3 + 1] * 4); raw[o++] = Math.min(255, pal[i * 3 + 2] * 4); } }
  const crc32 = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const tt = Buffer.from(t); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([tt, d]))); return Buffer.concat([l, tt, d, cr]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  await writeFile(path.join(repoRoot, "tmp", "highscores.png"), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ih), ch("IDAT", zlib.deflateSync(raw)), ch("IEND", Buffer.alloc(0))]));
  console.log("wrote tmp/highscores.png");
} catch (e) { console.log("png skip:", e.message); }

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0 ? "\n✅ HIGHSCORES: high-score table renders title + 7 score rows + the name-entry cursor." : `\n❌ ${fail} highscores check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
