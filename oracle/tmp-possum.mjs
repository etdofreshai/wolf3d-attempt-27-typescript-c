// Bisect the first tic where the port's actor-position sum (sum of x + 3*y over all
// actors) diverges from the oracle's (oracle/orig-demo-140-possum.csv). That tic is the
// root of the demo-140 non-RNG drift (positions diverge before the rndindex does at 566).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140;

const oracle = (await readFile(path.join(repoRoot, "oracle", "orig-demo-140-possum.csv"), "utf8"))
  .trim().split(/\r?\n/).map(Number);

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-ps-"));
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
  `export { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);
mod.BuildTables();
mod.SetupWalls();
mod.NewViewSize(15);
const off = (n) => mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === n)[1];
const F = { next: off("next"), x: off("x"), y: off("y") };
const demoBytes = mod.CA_CacheGrChunk(chunk);
const demo = mod.parseDemo(demoBytes);
const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);

function portSum(M) {
  mod.US_InitRndT(false);
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: M });
  const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  let sx = 0;
  for (let a = player; a; a = dgroup.u16(a + F.next)) sx = (sx + dgroup.i32(a + F.x) + 3 * dgroup.i32(a + F.y)) | 0;
  return sx;
}

// oracle[M-1] = sum after M commands. Compare port sum after M commands.
const match = (M) => portSum(M) === (oracle[M - 1] | 0);
// linear scan over coarse grid first
console.log("coarse scan (M: port vs oracle, ok?):");
for (const M of [50, 100, 200, 300, 400, 450, 500, 530, 550, 560, 565, 566, 567]) {
  const p = portSum(M), o = oracle[M - 1] | 0;
  console.log(`  M=${M}: port=${p} oracle=${o} ${p === o ? "OK" : "<<< DIVERGE"}`);
}
// binary search first divergence in [1, 567]
let lo = 1, hi = 567;
if (match(hi)) { console.log("no divergence by 567"); } else {
  while (lo < hi) { const mid = (lo + hi) >> 1; if (match(mid)) lo = mid + 1; else hi = mid; }
  console.log(`\nFIRST position divergence at command ${lo}: port=${portSum(lo)} oracle=${oracle[lo - 1] | 0} (prev cmd ${lo - 1} matches: ${match(lo - 1)})`);
}
await rm(tempDir, { recursive: true, force: true });
