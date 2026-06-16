// Feature gate — the two episode-ending victory paths (the audit's blocker). In WL6 a boss level
// ends either by killing the death-cam boss (Schabbs/Hitler/Otto/Fettgesicht: their looping final
// die-state runs A_StartDeathCam → playstate=ex_victorious) or by stepping on the exit-elevator
// tile (VictoryTile spawns BJ, who runs off and T_BJDone sets ex_victorious). Both were broken:
// A_StartDeathCam was never dispatched and VictoryTile never spawned BJ. This drives the real actor
// state machine and asserts both paths now reach ex_victorious.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-victory-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { DoActorMemory, SpawnNewObjMemory, VictoryTileMemory } from "${rel(path.join(targetDir, "TS_LEVEL_SETUP.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
  `export { VL_ResetVideoState, VL_SetVGAPlaneMode } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);
mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
mod.US_InitRndT(false);
const config = M.ReadConfig(files.CONFIG);
M.BuildTables();
M.SetupWalls();
M.NewViewSize(config.viewsize);

const off = (s) => mod.nearOffsetForRuntimeSymbol(s);
const EX_VICTORIOUS = 6, BJOBJ = 14, OBJ_ACTIVE = 0, OBJ_NEXT = 56, OBJ_CLASS = 4, OBJ_TILEX = 24, OBJ_TILEY = 26;

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
const newLevel = () => {
  const dgroup = new mod.DOSMemory(0x10000);
  const areaconnect = new Uint8Array(37 * 37);
  M.NewGame(dgroup, 1, 0);
  mod.US_InitRndT(false);
  const [p0, p1] = mod.CA_CacheMap(0);
  const plane0 = new Uint16Array(p0), plane1 = new Uint16Array(p1);
  mod.SetupGameLevel(plane0, plane1, dgroup, { areaconnect, loadedgame: false });
  dgroup.setU16(off("_playstate"), 0);
  return { dgroup, plane0, plane1 };
};

// --- Path 1: kill a death-cam boss → ex_victorious ---
{
  const { dgroup, plane0, plane1 } = newLevel();
  const player = dgroup.u16(off("_player"));
  const tx = dgroup.u16(player + OBJ_TILEX), ty = dgroup.u16(player + OBJ_TILEY);
  const { actor } = mod.SpawnNewObjMemory(dgroup, plane0, tx, ty, "_s_schabbdie6"); // Schabbs, final die-state
  dgroup.setU16(actor + OBJ_ACTIVE, 1); // process it regardless of areabyplayer
  let reached = false;
  for (let i = 0; i < 20 && !reached; i++) {
    mod.DoActorMemory(dgroup, plane0, plane1, actor, { tics: 10 });
    if (dgroup.u16(off("_playstate")) === EX_VICTORIOUS) reached = true;
  }
  console.log(`death-cam boss: playstate=${dgroup.u16(off("_playstate"))} after stepping s_schabbdie6`);
  expect(reached, "killing a death-cam boss (s_schabbdie6 → A_StartDeathCam) reaches ex_victorious");
}

// --- Path 2: step on the exit tile → BJ spawns → (T_BJDone) ex_victorious ---
{
  const { dgroup, plane0 } = newLevel();
  const countBj = () => {
    let n = 0, a = dgroup.u16(off("_player")), seen = new Set();
    while (a && !seen.has(a) && n < 512) { seen.add(a); if (dgroup.u16(a + OBJ_CLASS) === BJOBJ) n++; a = dgroup.u16(a + OBJ_NEXT); }
    return n;
  };
  expect(countBj() === 0, "no BJ-victory actor before VictoryTile");
  mod.VictoryTileMemory(dgroup, plane0);
  console.log(`exit tile: BJ-victory actors after VictoryTile = ${countBj()}`);
  expect(countBj() === 1, "VictoryTile spawns the BJ-victory actor (the exit-elevator ending)");
}

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ VICTORY: both episode-ending paths work — death-cam boss kill reaches ex_victorious, and the exit tile spawns BJ."
  : `\n❌ ${fail} victory-path check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
