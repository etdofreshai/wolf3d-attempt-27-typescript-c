// Sweep port SoundMode (off/PC/AdLib) against the committed oracle fixtures for all
// 4 demos, reporting first divergence per (mode,demo). Whichever mode best matches
// the DOS-generated fixtures reveals the oracle's effective sound mode.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const fixtureDir = path.join(repoRoot, "oracle", "generated");
const CHUNKS = [139, 140, 141, 142];
const COLS = ["rndindex", "playstate", "timeCount", "tilex", "tiley", "angle", "health", "ammo", "score"];

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-smsweep-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize, ReadConfig } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SD_ResetSoundState } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_Off, sdm_PC, sdm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { PlayDemoTrace } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);
const viewsize = mod.ReadConfig(files.CONFIG).viewsize;

function portRow(s) {
  return [s.rndindex, s.playstate, s.timeCount, s.playerTilex, s.playerTiley, s.playerAngle, s.health, s.ammo, s.score];
}

const MODES = [["sdm_Off", mod.sdm_Off], ["sdm_PC", mod.sdm_PC], ["sdm_AdLib", mod.sdm_AdLib]];
for (const [modeName, mode] of MODES) {
  console.log(`\n=== SoundMode = ${modeName} (${mode}) ===`);
  for (const chunk of CHUNKS) {
    const fixtureText = await readFile(path.join(fixtureDir, `oracle-demo-${chunk}.csv`), "utf8");
    const fixture = fixtureText.trim().split(/\r?\n/).slice(1).map((l) => l.split(",").map(Number));
    mod.US_InitRndT(false);
    mod.BuildTables();
    mod.SetupWalls();
    mod.NewViewSize(viewsize);
    mod.SD_ResetSoundState({ SoundMode: mode });
    mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
    const demoBytes = mod.CA_CacheGrChunk(chunk);
    const demo = mod.parseDemo(demoBytes);
    const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
    const dgroup = new mod.DOSMemory(0x10000);
    const summary = mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, {
      areaconnect: new Uint8Array(37 * 37), sampleEvery: 1,
    });
    const trace = summary.trace;
    let firstDiverge = null;
    const n = Math.min(trace.length, fixture.length);
    for (let i = 0; i < n && firstDiverge === null; i++) {
      const p = portRow(trace[i]);
      for (let c = 0; c < COLS.length; c++) {
        if (p[c] !== fixture[i][c]) { firstDiverge = { tic: i + 1, col: COLS[c], port: p[c], oracle: fixture[i][c] }; break; }
      }
    }
    const lenMatch = trace.length === fixture.length;
    const match = firstDiverge === null && lenMatch;
    const detail = match ? `${trace.length} tics bit-exact`
      : (firstDiverge ? `@tic ${firstDiverge.tic} col ${firstDiverge.col}: port=${firstDiverge.port} oracle=${firstDiverge.oracle}`
        : `length port ${trace.length} vs oracle ${fixture.length}`);
    console.log(`  demo ${chunk}: ${match ? "MATCH" : "DIVERGE"} (${detail})`);
  }
}
await rm(tempDir, { recursive: true, force: true });
