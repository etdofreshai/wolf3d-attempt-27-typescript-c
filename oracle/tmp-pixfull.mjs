// Compare FULL pixelangle[0..319] port vs oracle at demo-140 command, using new REC layout
// REC = objlist(9000)+spotvis(4096)+pixelangle(320*2=640) = 13736.
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
const REC = 13736, OBJBYTES = 9000, SPOTBYTES = 4096;
const PIXOFF = OBJBYTES + SPOTBYTES;

const bin = new Uint8Array(await readFile(path.join(repoRoot, "tmp/oracle-build/ORTRACE.BIN")));
const bdv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
console.log(`records in BIN: ${bin.length / REC} (expect integer)`);
const oPix = (i) => bdv.getInt16(rec * REC + PIXOFF + i * 2, true);

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-pf-"));
const entryPath = path.join(tempDir, "e.ts");
const outPath = path.join(tempDir, "e.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { pixelangle } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
  `export { SD_ResetSoundState } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_PC } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { PlayDemoTrace } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
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

let diffs = 0;
for (let i = 0; i < 320; i++) {
  const p = mod.pixelangle[i] ?? 0, o = oPix(i);
  if (p !== o) { console.log(`  pixelangle[${i}] port=${p} oracle=${o} (diff ${p-o})`); diffs++; }
}
console.log(`\npixelangle full-array diffs: ${diffs}`);
// Specifically the suspect columns:
console.log("suspect columns 213..221:");
for (let i = 213; i <= 221; i++) console.log(`  [${i}] port=${mod.pixelangle[i]} oracle=${oPix(i)}`);
await rm(tempDir, { recursive: true, force: true });
