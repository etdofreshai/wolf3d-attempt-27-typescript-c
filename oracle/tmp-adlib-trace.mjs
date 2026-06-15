// Run demo 140 under sdm_AdLib, dump per-tic rndindex/soundPlaying/alLengthLeft and
// compare against the oracle fixture's rndindex column across a window to localize the
// AdLib divergence (and whether it's a fresh chaingun burst vs the first).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const fixtureDir = path.join(repoRoot, "oracle", "generated");
const chunk = Number(process.argv[2] ?? "140");
const lo = Number(process.argv[3] ?? "1105");
const hi = Number(process.argv[4] ?? "1155");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-altr-"));
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

const mode = process.argv[5] === "PC" ? mod.sdm_PC : process.argv[5] === "Off" ? mod.sdm_Off : mod.sdm_AdLib;
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

const fixtureText = await readFile(path.join(fixtureDir, `oracle-demo-${chunk}.csv`), "utf8");
const fixture = fixtureText.trim().split(/\r?\n/).slice(1).map((l) => l.split(",").map(Number));

console.log(`mode=${process.argv[5] ?? "AdLib"} chunk=${chunk} port tics=${trace.length} fixture tics=${fixture.length}`);
console.log(`tic | portRnd oraRnd d | sndPlay alLen | attacks`);
for (let i = lo - 1; i < Math.min(hi, trace.length); i++) {
  const s = trace[i];
  const ora = fixture[i] ? fixture[i][0] : "?";
  const d = (typeof ora === "number") ? (s.rndindex - ora) : "?";
  const atk = (s.playerAttacks ?? []).map((a) => JSON.stringify(a)).join(" ");
  const mark = d !== 0 ? "  <<<" : "";
  console.log(`${i + 1} | ${s.rndindex} ${ora} ${d} | snd=${s.soundPlaying} al=${s.alLengthLeft} | ${atk}${mark}`);
}
await rm(tempDir, { recursive: true, force: true });
