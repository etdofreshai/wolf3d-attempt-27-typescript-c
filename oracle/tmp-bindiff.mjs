// Decisive demo-140 localizer: compare oracle ORTRACE.BIN (full per-tic objlist)
// vs the port's objlist array, slot-by-slot, to find the FIRST diverging actor+tic+field.
// Alignment: oracle record R  <->  port PlayDemoTrace(maxCommands = R+1).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140;

const REC = 13736; // VERIFIED stride: 26084664/1899; objlist(150*60=9000) at record start (player tile matches oracle CSV for all 1899 recs)
const VISMASK = 0x08; // FL_VISABLE: viewsize/render-dependent artifact; mask out of flags compare to expose the real game-state divergence
const bin = new Uint8Array(await readFile(path.join(repoRoot, "tmp/oracle-build/ORTRACE.BIN")));
const bdv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
const nrec = bin.length / REC;

const O = { active: 0, ticcount: 2, obclass: 4, state: 6, flags: 8, distance: 10, dir: 14, x: 16, y: 20, tilex: 24, tiley: 26 };
const oU16 = (rec, slot, off) => bdv.getUint16(rec * REC + slot * 60 + off, true);
const oI32 = (rec, slot, off) => bdv.getInt32(rec * REC + slot * 60 + off, true);
const oU8 = (rec, slot, off) => bin[rec * REC + slot * 60 + off];

// ---- bundle port ----
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-bd-"));
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

const off = (n) => mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === n)[1];
const PF = { active: off("active"), ticcount: off("ticcount"), obclass: off("obclass"), state: off("state"), flags: off("flags"), distance: off("distance"), dir: off("dir"), x: off("x"), y: off("y"), tilex: off("tilex"), tiley: off("tiley") };
const stName = (so) => mod.STATETYPE_SYMBOLS.find((e) => Number.parseInt(e.nearOffset ?? e.offset, 16) === so)?.name ?? `0x${so.toString(16)}`;

function runPort(maxCommands) {
  mod.CA_Startup(files);
  mod.US_InitRndT(false);
  mod.BuildTables();
  mod.SetupWalls();
  mod.NewViewSize(19); // oracle/real-game viewsize (CONFIG.WL6); demo-140 is viewsize-independent but FL_VISABLE flags are not
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const demoBytes = mod.CA_CacheGrChunk(chunk);
  const demo = mod.parseDemo(demoBytes);
  const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands });
  return dgroup;
}
const objlistBase = mod.nearOffsetForRuntimeSymbol("_objlist");
const pslot = (dg, i) => objlistBase + i * 60;

const FIELDS = ["active", "obclass", "state", "flags", "distance", "dir", "x", "y", "tilex", "tiley"];
function portField(dg, i, f) {
  const b = pslot(dg, i) + PF[f];
  if (f === "x" || f === "y" || f === "distance") return dg.i32(b);
  if (f === "flags" || f === "active") return f === "flags" ? dg.u8(b) : dg.u16(b);
  return dg.u16(b);
}
function oracField(rec, i, f) {
  const o = O[f];
  if (f === "x" || f === "y" || f === "distance") return oI32(rec, i, o);
  if (f === "flags") return oU8(rec, i, o);
  return oU16(rec, i, o);
}

// scan commands; oracle rec = M-1
const lo = Number(process.argv[2] ?? "558");
const hi = Number(process.argv[3] ?? "572");
let firstDiff = null;
for (let M = lo; M <= hi; M++) {
  const rec = M - 1;
  if (rec < 0 || rec >= nrec) continue;
  const dg = runPort(M);
  const diffs = [];
  for (let i = 0; i < 150; i++) {
    for (const f of FIELDS) {
      let pv = portField(dg, i, f);
      let ov = oracField(rec, i, f);
      if (f === "flags") { pv &= ~VISMASK; ov &= ~VISMASK; }
      if (pv !== ov) diffs.push({ i, f, pv, ov });
    }
  }
  if (diffs.length) {
    console.log(`\n=== FIRST DIVERGENCE at command M=${M} (oracle rec ${rec}) : ${diffs.length} field diffs ===`);
    // group by slot
    const bySlot = {};
    for (const d of diffs) (bySlot[d.i] ??= []).push(d);
    for (const i of Object.keys(bySlot).map(Number).sort((a, b) => a - b)) {
      const dg = runPort(M);
      const obcl = portField(dg, i, "obclass");
      const st = stName(portField(dg, i, "state"));
      const ost = stName(oracField(rec, i, "state"));
      console.log(`slot ${i} obclass=${obcl} portState=${st} oracState=${ost}`);
      for (const d of bySlot[i]) console.log(`    ${d.f}: port=${d.pv} oracle=${d.ov} (diff ${d.pv - d.ov})`);
    }
    firstDiff = M;
    break;
  } else {
    console.log(`M=${M} (rec ${rec}): all 150 slots match`);
  }
}
if (!firstDiff) console.log("no divergence in range");
await rm(tempDir, { recursive: true, force: true });
