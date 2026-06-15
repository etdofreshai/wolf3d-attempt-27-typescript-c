// Use RAY_DEBUG to find which pixx column marks each divergent spotvis tile in the
// port's final refresh at demo-140 command 563.
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

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-rp-"));
const entryPath = path.join(tempDir, "e.ts");
const outPath = path.join(tempDir, "e.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { RAY_DEBUG } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
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

// Watch the divergent tiles.
const watch = [[31,44],[32,44],[39,44],[45,45],[46,46]];
mod.RAY_DEBUG.active = true;
mod.RAY_DEBUG.tiles = new Set(watch.map(([x,y]) => x*64+y));
mod.RAY_DEBUG.log = [];
mod.RAY_DEBUG.refreshIdx = 0;

mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: M });

const maxIdx = Math.max(...mod.RAY_DEBUG.log.map((e) => e.refreshIdx));
console.log(`final refreshIdx=${maxIdx}; marks during final refresh:`);
for (const [x,y] of watch) {
  const entries = mod.RAY_DEBUG.log.filter((e) => e.refreshIdx === maxIdx && e.tile[0]===x && e.tile[1]===y);
  if (!entries.length) { console.log(`  tile (${x},${y}): NOT marked in final refresh`); continue; }
  for (const e of entries) console.log(`  tile (${x},${y}): pixx=${e.pixx} side=${e.side} rayAngle=${e.rayAngle} xstep=${e.xstep} ystep=${e.ystep} xtilestep=${e.xtilestep} ytilestep=${e.ytilestep}`);
}
await rm(tempDir, { recursive: true, force: true });
