// Gate the pre-menu attract intro (WL_MAIN.C DemoLoop: PG13 -> title -> credits) and the between-
// levels "Get Psyched!" loading screen (WL_INTER.C PreloadGraphics) that main.ts now wires. Each is
// drawn with the EXACT calls main.ts uses (CA_CacheScreen for the full-screen TITLE/CREDITS art,
// VWB_Bar+VWB_DrawPic for PG13, VWB_Bar+LatchDrawPic+bars for Get-Psyched), deplanarized, and
// asserted to be real multi-color content (not blank / not a solid fill) — guarding the wiring,
// pic caching, and full-screen blit path that the headless single-screenshot smoke test can't pin
// down deterministically.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-intro-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheScreen } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { VWB_Bar, VWB_DrawPic, LatchDrawPic, LoadLatchMem } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { STRUCTPIC, STARTTILE8, LATCHPICS_LUMP_START, LATCHPICS_LUMP_END, TITLEPIC, CREDITSPIC, PG13PIC, GETPSYCHEDPIC } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, bufferofs, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
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
// Latch pics (for LatchDrawPic GETPSYCHEDPIC): cache the lump + load latch memory like loadLevel.
const latchChunks = [];
latchChunks[mod.STARTTILE8] = mod.CA_CacheGrChunk(mod.STARTTILE8);
for (let c = mod.LATCHPICS_LUMP_START; c <= mod.LATCHPICS_LUMP_END; c++) latchChunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.LoadLatchMem({ chunks: latchChunks, pictable });

const VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208, W = 320, H = 200;
function deplanarize() {
  const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
  const stride = (mod.linewidth & 0xffff) || 80;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const row = (display + y * stride) & 0xffff;
    for (let x = 0; x < W; x++) out[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + ((row + (x >> 2)) & 0xffff)] ?? 0;
  }
  return out;
}
const stats = (px) => {
  const colors = new Set(); let nonZero = 0;
  for (const v of px) { colors.add(v); if (v !== 0) nonZero++; }
  return { colors: colors.size, nonZero };
};
let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// --- 1. Title page: CA_CacheScreen(TITLEPIC) full-screen art (drawIntroStage stage 1) ----------
mod.VWB_Bar(0, 0, W, H, 0);
mod.CA_CacheScreen(mod.TITLEPIC);
let s = stats(deplanarize());
console.log(`TITLE   : ${s.colors} colors, ${s.nonZero}px non-black`);
expect(s.colors > 16, "title page is real multi-color art (CA_CacheScreen blitted TITLEPIC)");
expect(s.nonZero > W * H * 0.5, "title page fills most of the screen");

// --- 2. Credits page: CA_CacheScreen(CREDITSPIC) (drawIntroStage stage 2) ----------------------
mod.VWB_Bar(0, 0, W, H, 0);
mod.CA_CacheScreen(mod.CREDITSPIC);
s = stats(deplanarize());
console.log(`CREDITS : ${s.colors} colors, ${s.nonZero}px non-black`);
expect(s.colors > 8, "credits page is real multi-color art");
expect(s.nonZero > W * H * 0.3, "credits page drew substantial content");

// --- 3. PG13 screen: VWB_Bar(0x82) + VWB_DrawPic(216,110,PG13PIC) (drawIntroStage stage 0) ------
mod.VWB_Bar(0, 0, W, H, 0x82);
const pg13 = mod.CA_CacheGrChunk(mod.PG13PIC);
mod.VWB_DrawPic(216, 110, mod.PG13PIC, { source: pg13, pictable });
{
  const px = deplanarize();
  let bg = 0, pic = 0;
  for (let i = 0; i < px.length; i++) { if (px[i] === 0x82) bg++; else pic++; }
  console.log(`PG13    : bg(0x82)=${bg}px, pic=${pic}px`);
  expect(bg > W * H * 0.4, "PG13 fills the screen with bg color 0x82");
  expect(pic > 200, "PG13 pic graphic drew over the background");
}

// --- 4. Get-Psyched: gray play area + LatchDrawPic(GETPSYCHEDPIC) + red bar (drawGetPsyched) -----
mod.VWB_Bar(0, 0, W, 200 - 40, 127);
mod.LatchDrawPic(20 - 14, 80 - 3 * 8, mod.GETPSYCHEDPIC, { pictable });
const barX = 48 + 5, barY = 56 + 48 - 3, barW = 224 - 10;
mod.VWB_Bar(barX, barY, barW, 2, 0);
mod.VWB_Bar(barX, barY, Math.trunc(barW * 0.6), 2, 0x37);
mod.VWB_Bar(barX, barY, Math.trunc(barW * 0.6) - 1, 1, 0x32);
{
  const px = deplanarize();
  let gray = 0, bar = 0, psyched = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < W; x++) {
    const v = px[y * W + x];
    if (v === 127) gray++;
    else if (v === 0x37 || v === 0x32) bar++;
    else psyched++;
  }
  console.log(`PSYCHED : gray=${gray}px, redbar=${bar}px, getpsyched-art=${psyched}px`);
  expect(gray > W * 100, "Get-Psyched fills the play area with gray (127)");
  expect(bar > 100, "Get-Psyched red progress bar drew (colors 0x37/0x32)");
  expect(psyched > 200, "GETPSYCHEDPIC bar graphic drew (LatchDrawPic)");
}

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ INTRO SCREENS: PG13, title, credits, and the Get-Psyched loading screen all render real content."
  : `\n❌ INTRO SCREENS: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
