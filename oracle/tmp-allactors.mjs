// Dump every actor's (listpos,obclass,tilex,tiley,x,y,state-ish) at maxCommands M (port).
// Run for two adjacent commands and diff to find which actor moves anomalously at the
// demo-140 root tic (command index 564).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunk = 140;
const M = Number(process.argv[2] ?? "565");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-aa-"));
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
mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect: new Uint8Array(37 * 37), sampleEvery: 1, maxCommands: M });

const off = (n) => mod.STRUCT_LAYOUTS.objtype.fields.find((e) => e[0] === n)[1];
const F = { next: off("next"), obclass: off("obclass"), tilex: off("tilex"), tiley: off("tiley"), x: off("x"), y: off("y"), state: off("state"), dir: off("dir"), distance: off("distance") };
const stName = (so) => mod.STATETYPE_SYMBOLS.find((e) => Number.parseInt(e.nearOffset ?? e.offset, 16) === so)?.name ?? `0x${so.toString(16)}`;
const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
let i = 0;
for (let a = player; a; a = dgroup.u16(a + F.next)) {
  const x = dgroup.i32(a + F.x), y = dgroup.i32(a + F.y);
  console.log(`${i} obcl=${dgroup.u16(a + F.obclass)} tile=${dgroup.u16(a + F.tilex)},${dgroup.u16(a + F.tiley)} x=${x} y=${y} x3y=${(x + 3 * y) | 0} dir=${dgroup.u16(a + F.dir)} dist=${dgroup.i32(a + F.distance)} st=${stName(dgroup.u16(a + F.state))}`);
  i++;
}
await rm(tempDir, { recursive: true, force: true });
