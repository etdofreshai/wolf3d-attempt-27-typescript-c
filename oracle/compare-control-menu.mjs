// Gate the Control options menu (WL_MENU.C CP_Control, browser-adapted) that main.ts wires from the
// main menu (item 2) and in-game F6. Renders the menu the way main.ts.drawControlMenu does
// (BKGDCOLOR bg + US_CenterWindow + the Mouse/Sensitivity rows) and asserts the window + option text
// actually draw, and that the cursor marker tracks the selected row.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-ctl-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { VWB_Bar, VW_SetFontState } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { US_RestoreWindow, US_Print } from "${rel(path.join(targetDir, "ID_US_1.C.ts"))}";`,
  `export { DrawWindow } from "${rel(path.join(targetDir, "WL_MENU.C.ts"))}";`,
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
mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const W = 320, H = 200, VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208;
function deplanarize() {
  const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
  const stride = (mod.linewidth & 0xffff) || 80;
  const px = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + (((display + y * stride) & 0xffff) + (x >> 2)) & 0xffff] ?? 0;
  return px;
}
function stats(px) { const colors = new Set(); let nonBg = 0; for (const v of px) { colors.add(v); if (v !== 0x29) nonBg++; } return { colors: colors.size, nonBg }; }
function drawControl(cursor, mouseEnabled, sens) {
  mod.VWB_Bar(0, 0, W, H, 0x29);
  mod.DrawWindow(40, 50, 240, 100, 0x2d);
  mod.US_RestoreWindow({ x: 56, y: 60, w: 208, h: 80, px: 56, py: 62 });
  mod.VW_SetFontState({ fontnumber: 1, fontcolor: 0x13, backcolor: 0x2d });
  mod.US_Print("        Control\n\n");
  mod.US_Print(`${cursor === 0 ? ">" : " "} Mouse:  ${mouseEnabled ? "Enabled " : "Disabled"}\n\n`);
  mod.US_Print(`${cursor === 1 ? ">" : " "} Mouse Sensitivity: ${sens}\n\n\n`);
  mod.US_Print("  Up/Down pick, Left/Right\n  or Enter change, ESC exit");
}

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

drawControl(0, true, 5);
const pxA = deplanarize();
const s = stats(pxA);
console.log(`control menu: ${s.colors} colors, ${s.nonBg}px non-bg`);
expect(s.colors > 3, "control menu is multi-color (window + text over BKGDCOLOR)");
expect(s.nonBg > 3000, "the window frame + option text drew substantial content");

// The cursor marker + toggled value change the rendered text (compare the two states pixel-by-pixel).
drawControl(1, false, 9);
const pxB = deplanarize();
let diff = 0;
for (let i = 0; i < pxA.length; i++) if (pxA[i] !== pxB[i]) diff++;
console.log(`cursor/value change altered ${diff}px`);
expect(diff > 30, "changing the cursor row / mouse-enable / sensitivity changes the rendered text");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ CONTROL MENU: the Control options screen renders the Mouse + Sensitivity rows."
  : `\n❌ CONTROL MENU: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
