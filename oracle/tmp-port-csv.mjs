// Dump the port's per-tic demo trace in the same CSV columns as the oracle:
// rndindex,playstate,TimeCount,tilex,tiley,angle,health,ammo,score
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunkArg = Number(process.argv[2] ?? "140");
const outArg = process.argv[3] ?? `oracle/port-demo-${chunkArg}.csv`;

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-portcsv-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => {
  let r = path.relative(tempDir, p).split(path.sep).join("/");
  return r.startsWith(".") ? r : "./" + r;
};
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
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
mod.CA_Startup(files);
mod.US_InitRndT(false);
mod.BuildTables();
mod.SetupWalls();
mod.NewViewSize(15);
mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC });
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);

const demoBytes = mod.CA_CacheGrChunk(chunkArg);
const demo = mod.parseDemo(demoBytes);
const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
const dgroup = new mod.DOSMemory(0x10000);
const summary = mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, {
  areaconnect: new Uint8Array(37 * 37),
  sampleEvery: 1,
});
const out = summary.trace.map((s) =>
  `${s.rndindex},${s.playstate},${s.timeCount},${s.playerTilex},${s.playerTiley},${s.playerAngle},${s.health},${s.ammo},${s.score}`,
).join("\n") + "\n";
await writeFile(path.join(repoRoot, outArg), out);
console.log(`chunk=${chunkArg} mapon=${demo.mapon} samples=${summary.trace.length} playstate=${summary.playstate} tc=${summary.timeCount} -> ${outArg}`);
await rm(tempDir, { recursive: true, force: true });
