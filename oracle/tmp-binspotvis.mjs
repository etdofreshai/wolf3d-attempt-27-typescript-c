// Diff spotvis (oracle ORTRACE.BIN vs port) at a given command, list differing tiles.
// Record layout: [9000 objlist][4096 spotvis]; spotvis[x*64+y]. Usage: node tmp-binspotvis.mjs <cmd>
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
const rec = M - 1;
const REC = 13138, OBJBYTES = 9000;

const bin = new Uint8Array(await readFile(path.join(repoRoot, "tmp/oracle-build/ORTRACE.BIN")));
const oSpot = (x, y) => bin[rec * REC + OBJBYTES + x * 64 + y];

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-sv-"));
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
const spotOff = mod.nearOffsetForRuntimeSymbol("_spotvis");
const pSpot = (x, y) => dgroup.u8(spotOff + x * 64 + y);

console.log(`spotvis diff at cmd ${M} (rec ${rec}): tiles where port != oracle`);
let n = 0;
for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
  const p = pSpot(x, y), o = oSpot(x, y);
  if ((p ? 1 : 0) !== (o ? 1 : 0)) { console.log(`  tile (${x},${y}): port=${p} oracle=${o}`); n++; }
}
console.log(`total differing tiles: ${n}`);
// Also show the neighborhood of the SS at 32,43
console.log("\nNeighborhood of SS (32,43) — port/oracle spotvis:");
for (let x = 30; x <= 34; x++) {
  let row = `  x=${x}: `;
  for (let y = 41; y <= 45; y++) row += `(${y}:${pSpot(x,y)}/${oSpot(x,y)}) `;
  console.log(row);
}
await rm(tempDir, { recursive: true, force: true });
