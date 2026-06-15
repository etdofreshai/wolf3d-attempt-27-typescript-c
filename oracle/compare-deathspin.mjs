// Feature gate — the death spin (WL_GAME.C Died). On death the view rotates to face the killer,
// rendering each rotation step (DEATHROTATE), then fades red. This drives the real Died() to get
// the rotation sequence, renders frames at the start vs end angles through the real raycaster, and
// asserts: the spin has multiple steps, the view actually changes as it rotates, and the final
// angle faces the killer. (main.ts advanceDying drives this same sequence frame-by-frame.)
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-death-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel, DrawPlayScreen, Died } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { ThreeDRefresh } from "${rel(path.join(targetDir, "WL_DRAW.C.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
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
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);
const dgroup = new mod.DOSMemory(0x10000);
const areaconnect = new Uint8Array(37 * 37);
M.NewGame(dgroup, 1, 0);
mod.US_InitRndT(false);
const [p0, p1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(p0), new Uint16Array(p1), dgroup, { areaconnect, loadedgame: false });

const off = (s) => mod.nearOffsetForRuntimeSymbol(s);
const gs = off("_gamestate");
const player = dgroup.u16(off("_player"));
const OBJ_X = 16, OBJ_Y = 20, OBJ_ANGLE = 42; // objtype near-offsets (WL_DRAW: x=16, y=20, angle=42)
const px = dgroup.i32(player + OBJ_X), py = dgroup.i32(player + OBJ_Y);

// Field offsets vary; read the player's current angle straight from the OBJ and place a killer
// roughly behind the player so Died() must rotate a large arc.
const playerAngle = dgroup.u16(player + OBJ_ANGLE);
const ANGLES = 360, TILEGLOBAL = 1 << 16;
const killer = { x: px - 4 * TILEGLOBAL, y: py + 3 * TILEGLOBAL, angle: 0 };

const summary = mod.Died({
  player: {
    x: px, y: py, angle: playerAngle, weapon: 2, bestweapon: 2, chosenweapon: 2,
    lives: 3, health: 0, ammo: 8, keys: 0, attackframe: 0, attackcount: 0, weaponframe: 0,
  },
  killer,
});

const VPB = 0x10000, PAGE = 80 * 208, W = 320, H = 200;
const renderAt = (angle) => {
  dgroup.setU16(player + OBJ_ANGLE, angle & 0xffff);
  mod.VL_SetBufferOffset(0); mod.VL_SetScreen(0, 0);
  mod.ThreeDRefresh({ dgroup, screenofs: M.screenofs, scale: M.scale, centerx: M.centerx, focallength: M.focallength, heightnumerator: M.heightnumerator, episode: 0, mapon: 0 });
  const disp = Math.trunc((mod.displayofs & 0xffff) / PAGE) * PAGE;
  const stride = (mod.linewidth & 0xffff) || 80;
  let h = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) h = (h * 31 + (mod.videoPlanes[(x & 3) * VPB + ((disp + y * stride + (x >> 2)) & 0xffff)] ?? 0)) >>> 0;
  return h;
};

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

const rot = summary.rotations;
console.log(`death spin: ${rot.length} rotation steps, ${playerAngle} -> ${summary.player.angle} (target faces killer)`);
expect(rot.length >= 2, "the death spin rotates through multiple steps");

// Render the first vs the last rotation frame; the view must change as it spins.
const hStart = renderAt(rot.length ? rot[0].angle : playerAngle);
const hEnd = renderAt(summary.player.angle);
expect(hStart !== hEnd, "the rendered view changes between the start and end of the spin (camera rotates)");

// The final angle should face the killer (atan2 of the killer delta), within DEATHROTATE tolerance.
let fangle = Math.atan2(py - killer.y, killer.x - px);
if (fangle < 0) fangle += Math.PI * 2;
const wantAngle = Math.trunc((fangle / (Math.PI * 2)) * ANGLES);
let d = Math.abs(summary.player.angle - wantAngle); if (d > ANGLES / 2) d = ANGLES - d;
expect(d <= 2, `final view angle faces the killer (got ${summary.player.angle}, want ~${wantAngle})`);

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ DEATH SPIN: Died() rotates the view to face the killer and the raycaster renders the turning camera."
  : `\n❌ ${fail} death-spin check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
