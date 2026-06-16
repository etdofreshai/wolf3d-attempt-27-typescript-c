// Gate the Sound options menu (WL_MENU.C CP_Sound / DrawSoundMenu) that main.ts now wires from the
// main menu (MainMenu[1]). Renders DrawSoundMenu with the real cached menu graphics, asserts it
// draws the three windows + section titles + the per-item on/off marks, and verifies the on-marks
// track SoundMode/DigiMode/MusicMode — i.e. selecting an item (which main.ts does via the same mode
// setters) is reflected on the screen.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-sndmenu-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { DrawSoundMenu, SetupControlPanel, SndItems } from "${rel(path.join(targetDir, "WL_MENU.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SD_SetMusicMode, SD_SetDigiDevice } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_Off, sdm_PC, sdm_AdLib, sds_Off, sds_SoundBlaster, smm_Off, smm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
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
const menuChunks = [];
menuChunks[mod.STARTFONT + 1] = mod.CA_CacheGrChunk(mod.STARTFONT + 1);
for (let c = mod.CONTROLS_LUMP_START; c <= mod.CONTROLS_LUMP_END; c++) menuChunks[c] = mod.CA_CacheGrChunk(c);

mod.SD_ResetSoundState({ AdLibPresent: true, SoundBlasterPresent: true });
mod.SD_Startup();
mod.SD_SetSoundMode(mod.sdm_AdLib);
mod.SD_SetMusicMode(mod.smm_AdLib);
mod.SD_SetDigiDevice(mod.sds_SoundBlaster);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
mod.SetupControlPanel({ skipResourceCache: true, skipLoadAllSounds: true });

const opt = { chunks: menuChunks, pictable, inGame: false };
let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// On-state for an item index in the rendered summary.
const onOf = (summary, index) => summary.buttons.find((b) => b.index === index)?.on ?? -1;

// 1. Default modes: FX=AdLib(2), Digi=SoundBlaster(7), Music=AdLib(11) should each be "on".
let s = mod.DrawSoundMenu(opt);
console.log(`buttons rendered: ${s.buttons.length}, windows: ${s.windows.length}, titles: ${s.titles.length}`);
expect(s.windows.length === 3, "three section windows drawn (FX / digitized / music)");
expect(s.titles.length === 3, "three section title pics drawn");
expect(onOf(s, 2) === 1, "FX section shows AdLib selected (default sdm_AdLib)");
expect(onOf(s, 7) === 1, "digitized section shows SoundBlaster selected (default)");
expect(onOf(s, 11) === 1, "music section shows AdLib selected (default)");

// 2. Turn FX off + music off (what main.ts's applySoundSelection does) → marks must follow.
mod.SD_SetSoundMode(mod.sdm_Off);
mod.SD_SetMusicMode(mod.smm_Off);
s = mod.DrawSoundMenu(opt);
expect(onOf(s, 0) === 1, "after SetSoundMode(Off): FX 'None' is now selected");
expect(onOf(s, 2) === 0, "after SetSoundMode(Off): FX 'AdLib' is no longer selected");
expect(onOf(s, 10) === 1, "after SetMusicMode(Off): music 'None' is now selected");
expect(onOf(s, 11) === 0, "after SetMusicMode(Off): music 'AdLib' is no longer selected");

// 3. The menu draws substantial pixels (real screen, not blank).
const VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208, W = 320, H = 200;
const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
const stride = (mod.linewidth & 0xffff) || 80;
let nonZero = 0; const colors = new Set();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const v = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + (((display + y * stride) & 0xffff) + (x >> 2)) & 0xffff] ?? 0;
  colors.add(v); if (v !== 0) nonZero++;
}
console.log(`sound menu render: ${colors.size} colors, ${nonZero}px non-black`);
expect(nonZero > 5000, "sound menu drew substantial content");
expect(colors.size > 4, "sound menu is multi-color (windows, titles, marks, text)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ SOUND MENU: DrawSoundMenu renders the 3 sections and the on/off marks track SoundMode/DigiMode/MusicMode."
  : `\n❌ SOUND MENU: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
