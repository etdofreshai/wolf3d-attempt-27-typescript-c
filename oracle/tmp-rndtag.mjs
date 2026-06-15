import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = Number(process.argv[2] ?? "140");
const ticA = Number(process.argv[3] ?? "566");
const ticB = Number(process.argv[4] ?? "567");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-rndtag-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT, __rndLog, __rndLogStart } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SD_ResetSoundState } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_PC } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { PlayDemoTrace } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));

function runTo(maxCommands) {
  mod.CA_Startup(files);
  mod.US_InitRndT(false);
  mod.BuildTables();
  mod.SetupWalls();
  mod.NewViewSize(19);
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const demoBytes = mod.CA_CacheGrChunk(chunk);
  const demo = mod.parseDemo(demoBytes);
  const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.__rndLogStart();
  mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands });
  return mod.__rndLog.slice();
}

const logA = runTo(ticA + 1); // includes tics 0..ticA
const logB = runTo(ticB + 1); // includes tics 0..ticB
console.log(`chunk=${chunk}: total US_RndT calls up to tic ${ticA}=${logA.length}, up to tic ${ticB}=${logB.length}`);
console.log(`=== calls made DURING tic ${ticB} (logB[${logA.length}..${logB.length}]) ===`);
for (let i = logA.length; i < logB.length; i++) {
  console.log(`  [${i - logA.length}] ${logB[i]}`);
}
await rm(tempDir, { recursive: true, force: true });
