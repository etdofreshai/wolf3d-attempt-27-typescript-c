// demo-140 diagnostic (oracle-independent): at command 566, inspect officer@42,46's
// line-of-sight to the player and the port's CheckLine result, to decide whether the
// divergence is a CheckLine bug (clear shot through a wall) or a positional drift.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140, cmd = 566;

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-cl-"));
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
  `export { CheckLineMemory } from "${rel(path.join(targetDir, "TS_LEVEL_SETUP.ts"))}";`,
  `export { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
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
const demoBytes = mod.CA_CacheGrChunk(chunk);
const demo = mod.parseDemo(demoBytes);
const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
const dgroup = new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: cmd });

const off = (n) => mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === n)[1];
const F = { next: off("next"), obclass: off("obclass"), tilex: off("tilex"), tiley: off("tiley"), x: off("x"), y: off("y"), dir: off("dir"), areanumber: off("areanumber") };
const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
const tilemap = mod.nearOffsetForRuntimeSymbol("_tilemap");
const cell = (x, y) => dgroup.u8(tilemap + x * 64 + y);
const plux = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_plux"));
const pluy = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_pluy"));
console.log(`player tile=${dgroup.u16(player + F.tilex)},${dgroup.u16(player + F.tiley)} x=${dgroup.i32(player + F.x)} y=${dgroup.i32(player + F.y)} plux=${plux} pluy=${pluy}`);

// find officer (obclass 4) near 42,46
let target = null;
for (let a = dgroup.u16(player + F.next); a; a = dgroup.u16(a + F.next)) {
  if (dgroup.u16(a + F.obclass) === 4 && dgroup.u16(a + F.tilex) === 42 && dgroup.u16(a + F.tiley) === 46) { target = a; break; }
}
if (!target) { console.log("officer@42,46 not found"); } else {
  const ox = dgroup.i32(target + F.x), oy = dgroup.i32(target + F.y);
  console.log(`officer@42,46: x=${ox} y=${oy} (x>>16=${ox >> 16}) dir=${dgroup.u16(target + F.dir)} area=${dgroup.u8(target + F.areanumber)}`);
  const cl = mod.CheckLineMemory(dgroup, target, {});
  console.log(`CheckLineMemory(officer) = ${cl}`);
  console.log("=== tilemap rows 44..48, cols 40..49 (0=floor, 1-127=WALL, 128+=door) ===");
  console.log("      " + Array.from({ length: 10 }, (_, i) => String(40 + i).padStart(4)).join(""));
  for (let y = 44; y <= 48; y++) {
    let row = `y=${y}: `;
    for (let x = 40; x <= 49; x++) row += String(cell(x, y)).padStart(4);
    console.log(row);
  }
  // door #19 (tilemap value 147 = 0x80|19) at (46,46)
  const doorpos = mod.nearOffsetForRuntimeSymbol("_doorposition");
  const doorlist = mod.nearOffsetForRuntimeSymbol("_doorobjlist");
  const dsz = mod.STRUCT_LAYOUTS.doorobj_t.bytes;
  const dfields = mod.STRUCT_LAYOUTS.doorobj_t.fields.map((f) => f[0]);
  const doff = (n) => mod.STRUCT_LAYOUTS.doorobj_t.fields.find((e) => e[0] === n)[1];
  console.log(`\ndoorobj_t fields: ${dfields.join(",")} (size ${dsz})`);
  console.log(`doorposition[19] = ${dgroup.u16(doorpos + 19 * 2)} (0=closed, 0xffff=open)`);
  const d = doorlist + 19 * dsz;
  let s = `door#19:`;
  for (const fn of dfields) s += ` ${fn}=${dgroup.u8(d + doff(fn))}`;
  console.log(s);
}
await rm(tempDir, { recursive: true, force: true });
