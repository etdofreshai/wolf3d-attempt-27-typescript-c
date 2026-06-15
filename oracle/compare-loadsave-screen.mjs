// Phase 2 gate — the 10-slot Load/Save screen. Renders WL_MENU.C DrawLoadSaveScreen (the SAVE
// GAME / LOAD GAME title + a 10-slot list, each slot showing its name or "- empty -") with the
// menu chunks the browser caches, deplanarizes, and asserts the title + slot rows draw.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-ls-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { DrawLoadSaveScreen, SaveGamesAvail, SaveGameNames, LSItems, LSMenu, SetupControlPanel } from "${rel(path.join(targetDir, "WL_MENU.C.ts"))}";`,
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

const pictable = mod.CA_CacheGrChunk(mod.STRUCTPIC);
const chunks = [];
chunks[mod.STARTFONT] = mod.CA_CacheGrChunk(mod.STARTFONT);
chunks[mod.STARTFONT + 1] = mod.CA_CacheGrChunk(mod.STARTFONT + 1);
for (let c = mod.CONTROLS_LUMP_START; c <= mod.CONTROLS_LUMP_END; c++) chunks[c] = mod.CA_CacheGrChunk(c);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.SetupControlPanel({ skipResourceCache: true, skipLoadAllSounds: true });

// two slots filled (with names), the rest "- empty -"
for (let i = 0; i < 10; i++) { mod.SaveGamesAvail[i] = 0; mod.SaveGameNames[i] = ""; }
mod.SaveGamesAvail[0] = 1; mod.SaveGameNames[0] = "floor 3";
mod.SaveGamesAvail[2] = 1; mod.SaveGameNames[2] = "boss fight";

mod.DrawLoadSaveScreen(1, { chunks, pictable }); // 1 = SAVE GAME

const VPB = 0x10000, PAGE = 80 * 208, W = 320, H = 200;
const disp = Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE;
const stride = (mod.linewidth & 0xffff) || 80;
const px = new Uint8Array(W * H);
for (let y = 0; y < H; y++) { const row = (disp + y * stride) & 0xffff; for (let x = 0; x < W; x++) px[y * W + x] = mod.videoPlanes[(x & 3) * VPB + ((row + (x >> 2)) & 0xffff)] ?? 0; }

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
// the title pic sits in the top ~32 rows; the 10 slot boxes run down the middle.
let titlePx = 0, bodyPx = 0;
for (let y = 0; y < 200; y++) for (let x = 0; x < W; x++) { const v = px[y * W + x]; if (v !== 0) { if (y < 34) titlePx++; else bodyPx++; } }
let nonEmptyRows = 0;
for (let i = 0; i < 10; i++) { let hit = 0; const y0 = 55 + i * 13; for (let y = y0; y < y0 + 11 && y < H; y++) for (let x = 40; x < 280; x++) if (px[y * W + x] !== 0) hit++; if (hit > 30) nonEmptyRows++; }
console.log(`loadsave render: title=${titlePx}px body=${bodyPx}px; rows with content=${nonEmptyRows}/10`);
expect(titlePx > 300, "SAVE GAME title pic drew pixels");
expect(bodyPx > 2000, "the slot list body drew substantial content");
expect(nonEmptyRows >= 8, "most of the 10 slot rows drew (outlines + names/'- empty -')");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0 ? "\n✅ LOAD/SAVE SCREEN: 10-slot save/load screen renders the title + slot list." : `\n❌ ${fail} load/save screen check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
