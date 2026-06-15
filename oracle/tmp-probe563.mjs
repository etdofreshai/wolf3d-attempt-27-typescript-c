// Probe demo-140 command 563: compare player slot0 (x,y,angle,tilex,tiley) and SS slot62,
// and compare oracle-dumped pixelangle[160..180] vs the port's pixelangle, to find why
// spotvis diverges when player position/angle ostensibly match.
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
const REC = 13138, OBJBYTES = 9000, SPOTBYTES = 4096;

const bin = new Uint8Array(await readFile(path.join(repoRoot, "tmp/oracle-build/ORTRACE.BIN")));
const bdv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
// objtype layout in oracle dump: 60 bytes/slot. offsets per tmp-bindiff:
const O = { active: 0, ticcount: 2, obclass: 4, state: 6, flags: 8, distance: 10, dir: 14, x: 16, y: 20, tilex: 24, tiley: 26, areanumber: 28, angle: 42 };
const oU8 = (slot, off) => bin[rec * REC + slot * 60 + off];
const oU16 = (slot, off) => bdv.getUint16(rec * REC + slot * 60 + off, true);
const oI32 = (slot, off) => bdv.getInt32(rec * REC + slot * 60 + off, true);
// pixelangle dump at offset 9000+4096 = 13096, 21 shorts for indices 160..180
const oPix = (i) => bdv.getInt16(rec * REC + OBJBYTES + SPOTBYTES + (i - 160) * 2, true);

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-p563-"));
const entryPath = path.join(tempDir, "e.ts");
const outPath = path.join(tempDir, "e.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { pixelangle, midangle, viewx as drawViewx, viewy as drawViewy, viewangle as drawViewangle } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
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
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC }); mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
const demoBytes = mod.CA_CacheGrChunk(chunk); const demo = mod.parseDemo(demoBytes);
const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
const dgroup = new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: M });

const objBase = mod.nearOffsetForRuntimeSymbol("_objlist");
const off = (n) => mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === n)[1];
const PF = { x: off("x"), y: off("y"), angle: off("angle"), tilex: off("tilex"), tiley: off("tiley"), flags: off("flags") };
const ps = (slot) => objBase + slot * 60;
const pX = (slot) => dgroup.i32(ps(slot) + PF.x);
const pY = (slot) => dgroup.i32(ps(slot) + PF.y);
const pAng = (slot) => dgroup.u16(ps(slot) + PF.angle);
const pTx = (slot) => dgroup.u16(ps(slot) + PF.tilex);
const pTy = (slot) => dgroup.u16(ps(slot) + PF.tiley);
const pFl = (slot) => dgroup.u8(ps(slot) + PF.flags);

console.log(`=== command ${M} (oracle rec ${rec}) ===`);
console.log("PLAYER slot0:");
console.log(`  port  : x=${pX(0)} y=${pY(0)} angle=${pAng(0)} tile=(${pTx(0)},${pTy(0)})`);
console.log(`  oracle: x=${oI32(0,O.x)} y=${oI32(0,O.y)} angle=${oU16(0,O.angle)} tile=(${oU16(0,O.tilex)},${oU16(0,O.tiley)})`);
console.log("SS slot62:");
console.log(`  port  : x=${pX(62)} y=${pY(62)} angle=${pAng(62)} tile=(${pTx(62)},${pTy(62)}) flags=${pFl(62)}`);
console.log(`  oracle: x=${oI32(62,O.x)} y=${oI32(62,O.y)} angle=${oU16(62,O.angle)} tile=(${oU16(62,O.tilex)},${oU16(62,O.tiley)}) flags=${oU8?.(62,O.flags) ?? bin[rec*REC+62*60+O.flags]}`);

console.log("\nWL_DRAW globals after last refresh (port):");
console.log(`  viewx=${mod.drawViewx} viewy=${mod.drawViewy} viewangle=${mod.drawViewangle} midangle=${mod.midangle}`);

console.log("\npixelangle[160..180] port vs oracle:");
let diffs = 0;
for (let i = 160; i <= 180; i++) {
  const p = mod.pixelangle[i], o = oPix(i);
  const mark = p !== o ? "  <-- DIFF" : "";
  if (p !== o) diffs++;
  console.log(`  [${i}] port=${p} oracle=${o}${mark}`);
}
console.log(`pixelangle diffs: ${diffs}`);
await rm(tempDir, { recursive: true, force: true });
