// Dump one slot's full objtype state, oracle vs port, across a command range.
// Usage: node oracle/tmp-binslot.mjs <slot> <loCmd> <hiCmd>
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140;
const SLOT = Number(process.argv[2] ?? "62");
const lo = Number(process.argv[3] ?? "560");
const hi = Number(process.argv[4] ?? "568");

const REC = 150 * 60;
const bin = new Uint8Array(await readFile(path.join(repoRoot, "tmp/oracle-build/ORTRACE.BIN")));
const bdv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);

const O = { active: 0, ticcount: 2, obclass: 4, state: 6, flags: 8, distance: 10, dir: 14, x: 16, y: 20, tilex: 24, tiley: 26, viewx: 30, viewheight: 32, transx: 34, transy: 38, angle: 42, temp1: 50 };
const oU16 = (rec, off) => bdv.getUint16(rec * REC + SLOT * 60 + off, true);
const oI16 = (rec, off) => bdv.getInt16(rec * REC + SLOT * 60 + off, true);
const oI32 = (rec, off) => bdv.getInt32(rec * REC + SLOT * 60 + off, true);
const oU8 = (rec, off) => bin[rec * REC + SLOT * 60 + off];

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-bs-"));
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
  `export { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol, STATETYPE_SYMBOLS } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
const PF = {}; for (const f of Object.keys(O)) { const e = mod.STRUCT_LAYOUTS.objtype.fields.find((x) => x[0] === f); PF[f] = e ? e[1] : null; }
const stName = (so) => mod.STATETYPE_SYMBOLS.find((e) => Number.parseInt(e.nearOffset ?? e.offset, 16) === so)?.name ?? `0x${so.toString(16)}`;
const objlistBase = mod.nearOffsetForRuntimeSymbol("_objlist");

function runPort(maxCommands) {
  mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(15);
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC }); mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const demoBytes = mod.CA_CacheGrChunk(chunk); const demo = mod.parseDemo(demoBytes);
  const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands });
  return dgroup;
}
const pv = (dg, f) => {
  const b = objlistBase + SLOT * 60 + PF[f];
  if (f === "x" || f === "y" || f === "distance" || f === "transx" || f === "transy") return dg.i32(b);
  if (f === "flags") return dg.u8(b);
  if (f === "viewx" || f === "angle") return dg.i16(b);
  return dg.u16(b);
};
const fmt = (rec, get) => `vis=${(get("flags") & 8) ? 1 : 0} flags=${get("flags")} st=${stName(get("state"))} tile=${get("tilex")},${get("tiley")} x=${get("x")} y=${get("y")} dir=${get("dir")} dist=${get("distance")} vx=${get("viewx")} vh=${get("viewheight")} tx=${get("transx")}`;

console.log(`SLOT ${SLOT}`);
for (let M = lo; M <= hi; M++) {
  const rec = M - 1;
  const oget = (f) => { const o = O[f]; if (f==="x"||f==="y"||f==="distance"||f==="transx"||f==="transy") return oI32(rec,o); if (f==="flags") return oU8(rec,o); if (f==="viewx"||f==="angle") return oI16(rec,o); return oU16(rec,o); };
  const dg = runPort(M);
  const pget = (f) => pv(dg, f);
  console.log(`cmd ${M} (rec ${rec})`);
  console.log(`  ORACLE ${fmt(rec, oget)}`);
  console.log(`  PORT   ${fmt(rec, pget)}`);
}
await rm(tempDir, { recursive: true, force: true });
