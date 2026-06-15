// Dump port tilemap/doorposition/spotvis around the demo-140 divergent tiles at cmd 563.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140;
const M = Number(process.argv[2] ?? "563");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-p563b-"));
const entryPath = path.join(tempDir, "e.ts");
const outPath = path.join(tempDir, "e.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SD_ResetSoundState } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_PC } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { PlayDemoTrace } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC }); mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
const demoBytes = mod.CA_CacheGrChunk(chunk); const demo = mod.parseDemo(demoBytes);
const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
const dgroup = new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: M });

const tileOff = mod.nearOffsetForRuntimeSymbol("_tilemap");
const spotOff = mod.nearOffsetForRuntimeSymbol("_spotvis");
const doorOff = mod.nearOffsetForRuntimeSymbol("_doorposition");
const tile = (x, y) => dgroup.u8(tileOff + x * 64 + y); // tilemap is byte[64][64]
const spot = (x, y) => dgroup.u8(spotOff + x * 64 + y);

// tilemap value >=0x80 = door (door number = val & 0x7f). 0 = empty. else wall.
console.log(`tilemap[x=28..48][y=40..48] at cmd ${M} (val; * if door, # if wall, . if empty):`);
let header = "      ";
for (let y = 40; y <= 48; y++) header += `y${y}`.padStart(5);
console.log(header);
for (let x = 28; x <= 48; x++) {
  let row = `x=${String(x).padStart(2)}: `;
  for (let y = 40; y <= 48; y++) {
    const t = tile(x, y);
    let s = t === 0 ? "." : (t & 0x80 ? `D${t & 0x7f}` : `#${t}`);
    row += s.padStart(5);
  }
  console.log(row);
}
console.log(`\nspotvis (port) same window:`);
console.log(header);
for (let x = 28; x <= 48; x++) {
  let row = `x=${String(x).padStart(2)}: `;
  for (let y = 40; y <= 48; y++) row += String(spot(x, y)).padStart(5);
  console.log(row);
}
// doorposition for any doors in window
console.log(`\ndoors in window (tile value & doorposition):`);
for (let x = 28; x <= 48; x++) for (let y = 40; y <= 48; y++) {
  const t = tile(x, y);
  if (t & 0x80) {
    const dn = t & 0x7f;
    console.log(`  door at (${x},${y}) num=${dn} doorposition=${dgroup.u16(doorOff + dn * 2)}`);
  }
}
await rm(tempDir, { recursive: true, force: true });
