// Color gate — the damage (red) and bonus (gold) palette flashes. WL_PLAY.C UpdatePaletteShifts
// tints the whole VGA palette toward red when the player is hit and toward gold when they pick
// something up, then restores gamepal when the flash decays. The port computes the shift LEVEL in
// UpdatePaletteShiftsMemory but the browser (main.ts) must build the tables (InitRedShifts) and
// apply them via VL_SetPalette each frame — a step that was missing (flashes never showed) until
// fixed. This gate runs that exact chain on the real port modules and asserts currentPalette (what
// present() displays) actually shifts and restores. NO gate covered this before.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-palshift-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { InitRedShifts } from "${rel(path.join(targetDir, "WL_PLAY.C.ts"))}";`,
  `export { UpdatePaletteShiftsMemory, StartDamageFlashMemory, StartBonusFlashMemory } from "${rel(path.join(targetDir, "TS_LEVEL_SETUP.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
  `export { VL_SetPalette, currentPalette } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

// Base palette straight from GAMEPAL.OBJ (offset 0x77, see compare-palette.mjs).
const obj = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));
const gamepal = obj.subarray(0x77, 0x77 + 768);
const tables = mod.InitRedShifts(gamepal);

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
const sum = (a) => a.reduce((s, v) => s + v, 0);
const channelSums = (pal) => { let r = 0, g = 0, b = 0; for (let i = 0; i < 256; i++) { r += pal[i * 3]; g += pal[i * 3 + 1]; b += pal[i * 3 + 2]; } return { r, g, b }; };
const baseSum = channelSums(gamepal);

// Table shape + direction (red table pushes R up, G/B down; gold table pushes R/G up, B down).
expect(tables.redshifts.length === 6 && tables.whiteshifts.length === 3, "InitRedShifts built 6 red + 3 white tables");
const redTop = channelSums(tables.redshifts[5]);
expect(redTop.r > baseSum.r && redTop.g < baseSum.g && redTop.b < baseSum.b, "deepest red table: R increased, G+B decreased vs gamepal");
const goldTop = channelSums(tables.whiteshifts[2]);
expect(goldTop.r > baseSum.r && goldTop.g > baseSum.g, "deepest gold table: R+G increased vs gamepal");

// Drive the exact main.ts chain: StartDamageFlash → each tic UpdatePaletteShifts → apply via VL_SetPalette.
const dgroup = new mod.DOSMemory(0x10000);
mod.VL_SetPalette(gamepal);
const apply = (shift) => {
  if (shift.red > 0) mod.VL_SetPalette(tables.redshifts[shift.red - 1]);
  else if (shift.white > 0) mod.VL_SetPalette(tables.whiteshifts[shift.white - 1]);
  else mod.VL_SetPalette(gamepal);
};

mod.StartDamageFlashMemory(dgroup, 30); // took 30 damage → red flash
let firstShift = mod.UpdatePaletteShiftsMemory(dgroup, { tics: 1 });
apply(firstShift);
expect(firstShift.red > 0, `damage produced a red shift level (red=${firstShift.red})`);
const displayedRed = channelSums(mod.currentPalette);
expect(displayedRed.r > baseSum.r && sum(mod.currentPalette) !== sum(gamepal), "displayed palette (currentPalette) is now red-tinted, not gamepal");
expect(JSON.stringify([...mod.currentPalette]) === JSON.stringify([...tables.redshifts[firstShift.red - 1]]), "currentPalette equals the matching red table exactly");

// Run the flash to completion; it must decay back to the base palette.
let guard = 0, restored = false;
while (guard++ < 200) {
  const s = mod.UpdatePaletteShiftsMemory(dgroup, { tics: 1 });
  apply(s);
  if (s.red === 0 && s.white === 0) {
    restored = JSON.stringify([...mod.currentPalette]) === JSON.stringify([...gamepal]);
    break;
  }
}
expect(restored, "after the red flash decays, currentPalette is restored to the base gamepal");

// Bonus (gold) flash path.
const dg2 = new mod.DOSMemory(0x10000);
mod.VL_SetPalette(gamepal);
mod.StartBonusFlashMemory(dg2);
const goldShift = mod.UpdatePaletteShiftsMemory(dg2, { tics: 1 });
apply(goldShift);
expect(goldShift.white > 0, `pickup produced a gold/white shift level (white=${goldShift.white})`);
const displayedGold = channelSums(mod.currentPalette);
expect(displayedGold.r > baseSum.r && displayedGold.g > baseSum.g, "displayed palette is now gold-tinted (R+G up) for the bonus flash");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ PALETTE SHIFT: damage flashes red and pickups flash gold through the real apply chain, then restore."
  : `\n❌ ${fail} palette-shift check(s) failed — damage/bonus flashes are broken.`);
process.exitCode = fail === 0 ? 0 : 1;
