// Feature gate — mouse-look. main.ts feeds pointer-locked mouse motion/buttons into the play loop
// via WL_PLAY.C PollMouseMove (turn/forward) and PollMouseButtons (attack/strafe/use). The browser
// pointer-lock plumbing is simple event wiring (typecheck-covered); this gates the actual effect:
// running a play tic with a simulated mouse delta turns the player, the opposite delta turns back,
// and a mouse button press sets the attack button — through the same functions main.ts calls.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-mouse-"));
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
  `export { PlayLoop, PollMouseMove, PollMouseButtons } from "${rel(path.join(targetDir, "WL_PLAY.C.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
  `export { VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
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
dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_playstate"), 0);

const off = (s) => mod.nearOffsetForRuntimeSymbol(s);
const player = () => dgroup.u16(off("_player"));
const OBJ_ANGLE = 42;
const angle = () => dgroup.u16(player() + OBJ_ANGLE);

const tic = (mouseDx) => mod.PlayLoop(dgroup, new Uint16Array(p0), new Uint16Array(p1), {
  maxSteps: 1, areaconnect, viewwidth: M.viewwidth, scale: M.scale, centerx: M.centerx, shootdelta: M.shootdelta, focallength: M.focallength,
  pollControls: (dg) => { mod.PollMouseMove(dg, mouseDx, 0); },
});

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
const angDiff = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };

const a0 = angle();
tic(600);            // big rightward mouse motion
const a1 = angle();
tic(-600);           // back the other way
const a2 = angle();
console.log(`mouse turn: angle ${a0} -> ${a1} -> ${a2} (deltas ${angDiff(a1, a0)}, ${angDiff(a2, a1)})`);
expect(a1 !== a0, "a mouse X delta turns the player (PollMouseMove → controlx → view angle)");
expect(Math.sign(angDiff(a2, a1)) === -Math.sign(angDiff(a1, a0)) && a2 !== a1, "the opposite mouse delta turns the player back the other way");

// Mouse buttons: left button maps to attack (buttonmouse[0] = BT_ATTACK = 0).
const buttonstate = off("_buttonstate");
dgroup.view(buttonstate, 8 * 2).fill(0);
mod.PollMouseButtons(dgroup, 1);
const BT_ATTACK = 0;
expect(dgroup.u16(buttonstate + BT_ATTACK * 2) !== 0, "left mouse button sets the attack button (PollMouseButtons → buttonmouse[0])");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ MOUSE: pointer-locked mouse motion turns the player and the mouse button fires, through the real poll functions."
  : `\n❌ ${fail} mouse check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
