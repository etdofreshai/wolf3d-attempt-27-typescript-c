// Gate the Y/N confirm dialog (WL_MENU.C Confirm → Message) that main.ts now uses for the "erase
// current game?" prompt (CURGAME) before starting a new game over an in-progress one. Renders the
// CURGAME message box the way showConfirm does (fullscreen window + Message) and asserts a centered
// text box with real glyph content actually draws.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-confirm-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { Message, SetupControlPanel } from "${rel(path.join(targetDir, "WL_MENU.C.ts"))}";`,
  `export { US_SetWindowState } from "${rel(path.join(targetDir, "ID_US_1.C.ts"))}";`,
  `export { VWB_Bar } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { CURGAME } from "${rel(path.join(targetDir, "FOREIGN.H.ts"))}";`,
  `export { STRUCTPIC, STARTFONT, CONTROLS_LUMP_START, CONTROLS_LUMP_END } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
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
const menuChunks = [];
menuChunks[mod.STARTFONT + 1] = mod.CA_CacheGrChunk(mod.STARTFONT + 1);
for (let c = mod.CONTROLS_LUMP_START; c <= mod.CONTROLS_LUMP_END; c++) menuChunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.SetupControlPanel({ skipResourceCache: true, skipLoadAllSounds: true });

// Clear to a known bg, then draw the confirm box exactly as showConfirm does.
mod.VWB_Bar(0, 0, 320, 200, 0x29);
mod.US_SetWindowState(0, 0, 320, 200);
const msg = mod.Message(mod.CURGAME, { font: menuChunks[mod.STARTFONT + 1] });

const W = 320, H = 200, VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208;
const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const stride = (mod.linewidth & 0xffff) || 80;
const px = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + (((display + y * stride) & 0xffff) + (x >> 2)) & 0xffff] ?? 0;

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// The box is centered (x≈160, y≈100). Count non-bg(0x29) pixels in a central region = box + glyphs.
let boxPixels = 0, glyphColors = new Set();
for (let y = 70; y < 130; y++) for (let x = 80; x < 240; x++) {
  const v = px[y * W + x];
  if (v !== 0x29) { boxPixels++; glyphColors.add(v); }
}
console.log(`confirm box: ${boxPixels}px non-bg in the center, ${glyphColors.size} distinct colors; Message x=${msg.x} y=${msg.y}`);
expect(boxPixels > 1500, "a centered confirm box + text drew over the background");
expect(glyphColors.size >= 2, "the box has window fill + text glyphs (multiple colors)");
expect(msg.x > 40 && msg.x < 200 && msg.y > 40 && msg.y < 160, "Message positioned the box near screen center");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ CONFIRM: the Y/N confirm box (CURGAME) renders centered with text over the screen."
  : `\n❌ CONFIRM: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
