// Find first per-actor objlist divergence, PORT@viewsize19 vs oracle ORTRACE.BIN (viewsize 19).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps/source-typescript/src/WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam/base");
const lo = Number(process.argv[2] ?? 558), hi = Number(process.argv[3] ?? 568);

const oracle = readFileSync("tmp/oracle-build/ORTRACE.BIN");
const OBJSIZE = 60, MAXACTORS = 150, SPOTVIS = 64 * 64, PIXEL = 320 * 2;
const BLOCK = MAXACTORS * OBJSIZE + SPOTVIS + PIXEL + 10;
const oTics = Math.floor(oracle.length / BLOCK);
// fields to compare: name -> [offset, kind]
const FIELDS = { active: [0,"u16"], ticcount: [2,"u16"], obclass: [4,"u16"], state: [6,"u16"], flags: [8,"u8"], distance: [10,"i32"], dir: [14,"u16"], x: [16,"i32"], y: [20,"i32"], tilex: [24,"u16"], tiley: [26,"u16"], areanumber: [28,"u8"], angle: [42,"u16"], hitpoints: [44,"u16"], speed: [46,"i32"], temp1: [50,"u16"], temp2: [52,"u16"], temp3: [54,"u16"] };
const rd = (b, base, off, kind) => {
  const i = base + off;
  if (kind === "u8") return b[i];
  if (kind === "u16") return b[i] | (b[i + 1] << 8);
  return b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24); // i32 (signed via <<24)
};

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wod-"));
const entry = path.join(tempDir, "e.ts"); const out = path.join(tempDir, "e.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entry, [
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
await build({ entryPoints: [entry], outfile: out, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {}; for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));

function runTo(mc) {
  mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls();
  mod.NewViewSize(19); // <-- viewsize 19, matching real game/oracle
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC }); mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const db = mod.CA_CacheGrChunk(140); const demo = mod.parseDemo(db); const [p0, p1] = mod.CA_CacheMap(demo.mapon);
  const dg = new mod.DOSMemory(0x10000);
  mod.PlayDemoTrace(db, new Uint16Array(p0), new Uint16Array(p1), dg, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: mc });
  return dg;
}
const objlist = mod.nearOffsetForRuntimeSymbol("_objlist");

console.log(`oracle tics=${oTics}, comparing commands ${lo}..${hi} (port runTo(N+1) vs oracle block N), viewsize 19`);
for (let N = lo; N <= hi; N++) {
  const dg = runTo(N + 1);
  const oBase = N * BLOCK;
  const diffs = [];
  for (let K = 0; K < MAXACTORS; K++) {
    const pSlot = objlist + K * OBJSIZE, oSlot = oBase + K * OBJSIZE;
    for (const [name, [off, kind]] of Object.entries(FIELDS)) {
      const pv = rd(dg.bytes, pSlot, off, kind);
      const ov = rd(oracle, oSlot, off, kind);
      if (pv !== ov) diffs.push(`K=${K} ${name} port=${pv} orac=${ov}`);
    }
  }
  console.log(`cmd ${N}: ${diffs.length} field diffs${diffs.length ? "  >>> " + diffs.slice(0, 6).join(" | ") : ""}`);
  if (diffs.length) break;
}
await rm(tempDir, { recursive: true, force: true });
