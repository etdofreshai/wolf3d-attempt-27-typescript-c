// Gate the Change View screen (WL_MENU.C CP_ChangeView) that main.ts now wires (main menu + F5).
// main.ts.drawChangeView does NewViewSize(size) + DrawPlayBorder() + a VIEWCOLOR panel + the
// "Use arrows to size" text. This renders that at a small (10) and large (19) size and asserts the
// centered viewport border actually shrinks/grows with the size, and the size-adjustment text draws.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-chview-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { DrawPlayBorder } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { VWB_Bar, VW_SetFontState } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { US_CPrint, US_RestoreWindow } from "${rel(path.join(targetDir, "ID_US_1.C.ts"))}";`,
  `export { STR_SIZE1, STR_SIZE2, STR_SIZE3 } from "${rel(path.join(targetDir, "FOREIGN.H.ts"))}";`,
  `export { STRUCTPIC, STARTFONT } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
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
mod.CA_CacheGrChunk(mod.STRUCTPIC);
mod.CA_CacheGrChunk(mod.STARTFONT);
mod.CA_CacheGrChunk(mod.STARTFONT + 1);
M.BuildTables();
M.SetupWalls();

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const W = 320, H = 200, VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208;
function deplanarize() {
  const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
  const stride = (mod.linewidth & 0xffff) || 80;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + (((display + y * stride) & 0xffff) + (x >> 2)) & 0xffff] ?? 0;
  return out;
}
// Render the change-view screen the way main.ts.drawChangeView does.
function renderChangeView(size) {
  M.NewViewSize(size);
  mod.DrawPlayBorder();
  mod.VWB_Bar(0, 160, W, 40, 0x7f);
  mod.US_RestoreWindow({ x: 0, y: 161, w: W, h: 39, px: 0, py: 162 });
  mod.VW_SetFontState({ fontnumber: 1, fontcolor: 0x13, backcolor: 0x7f });
  mod.US_CPrint(`${mod.STR_SIZE1}\n`);
  mod.US_CPrint(`${mod.STR_SIZE2}\n`);
  mod.US_CPrint(mod.STR_SIZE3);
}
// Width of the inner viewport (non-127 pixels) in the middle play row.
function viewportWidth(px) {
  const y = 70; let count = 0;
  for (let x = 0; x < W; x++) if (px[y * W + x] !== 127) count++;
  return count;
}

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

renderChangeView(10);
const small = deplanarize();
const wSmall = viewportWidth(small);
renderChangeView(19);
const large = deplanarize();
const wLarge = viewportWidth(large);
console.log(`viewport width: size 10 → ${wSmall}px, size 19 → ${wLarge}px (of ${W})`);
expect(wSmall > 120 && wSmall < 200, "size 10 renders a ~160px-wide centered viewport (not full screen)");
expect(wLarge > 280, "size 19 renders a near-full-width viewport");
expect(wLarge > wSmall + 80, "a larger view size produces a visibly larger viewport (NewViewSize takes effect)");

// The bottom VIEWCOLOR panel + size-adjustment text.
let panel = 0, textPixels = 0;
for (let y = 160; y < 200; y++) for (let x = 0; x < W; x++) { const v = large[y * W + x]; if (v === 0x7f) panel++; else textPixels++; }
console.log(`bottom panel: ${panel}px VIEWCOLOR, ${textPixels}px text/other`);
expect(panel > 8000, "the VIEWCOLOR (0x7f) size panel fills the bottom 40px");
expect(textPixels > 200, "the size-adjustment text drew over the panel");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ CHANGE VIEW: the viewport resizes with NewViewSize and the size-adjustment screen renders."
  : `\n❌ CHANGE VIEW: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
