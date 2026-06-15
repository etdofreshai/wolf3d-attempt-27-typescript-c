import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = Number(process.argv[2] ?? "140");
const maxCommands = Number(process.argv[3] ?? "566");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-actors-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
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
mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, {
  areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands,
});

const f = (name) => { const x = mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === name); return x[1]; };
const O = {
  next: f("next"), obclass: f("obclass"), state: f("state"), ticcount: f("ticcount"),
  dir: f("dir"), x: f("x"), y: f("y"), tilex: f("tilex"), tiley: f("tiley"),
  distance: f("distance"), speed: f("speed"), hitpoints: f("hitpoints"), flags: f("flags"),
};
const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
console.log(`demo ${chunk} mapon ${demo.mapon} after ${maxCommands} commands. player tile=${dgroup.u16(player+O.tilex)},${dgroup.u16(player+O.tiley)} x=${dgroup.i32(player+O.x)} y=${dgroup.i32(player+O.y)}`);
let a = dgroup.u16(player + O.next), n = 0;
while (a && n < 200) {
  const obclass = dgroup.u16(a + O.obclass);
  const tx = dgroup.u16(a + O.tilex), ty = dgroup.u16(a + O.tiley);
  // officers = obclass 4; print officers and anything near the two suspect tiles
  if (obclass === 4 || (Math.abs(tx-24)<=1&&Math.abs(ty-44)<=1) || (Math.abs(tx-42)<=2&&Math.abs(ty-46)<=1)) {
    console.log(`  obcl=${obclass} tile=${tx},${ty} dir=${dgroup.u16(a+O.dir)} x=${dgroup.i32(a+O.x)} y=${dgroup.i32(a+O.y)} dist=${dgroup.i32(a+O.distance)} speed=${dgroup.u32(a+O.speed)} tic=${dgroup.u16(a+O.ticcount)} hp=${dgroup.i16(a+O.hitpoints)} move(speed*4)=${dgroup.u32(a+O.speed)*4}`);
  }
  a = dgroup.u16(a + O.next); n++;
}
await rm(tempDir, { recursive: true, force: true });
