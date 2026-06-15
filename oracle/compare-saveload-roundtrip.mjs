// Phase 2 / T3 gate — save/load ROUND TRIP. The T3 gate (compare-save-data) proves serialize is
// byte-identical to DOS; this proves loadSaveGameImage correctly RESTORES a serialized save:
// serialize state A -> load the bytes into a fresh game B -> serialize B -> assert A === B'
// byte-for-byte. Validates the load path the browser Save/Load UI relies on.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-slrt-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { NewGame, LoadTheGame } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { serializeSaveGame, loadSaveGameImage, getSaveRecord, nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) {
  files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
}
mod.CA_Startup(files);

const acRec = mod.getSaveRecord("areaconnect");
const abpRec = mod.getSaveRecord("areabyplayer");
const acOff = Number.parseInt(acRec.symbolInfo.nearOffset.slice(2), 16);
const abpOff = Number.parseInt(abpRec.symbolInfo.nearOffset.slice(2), 16);

// Build the far segment (0x33DA) holding areaconnect (runtime param) + areabyplayer (dgroup).
function makeFar(dgroup, areaconnect) {
  const far = new Uint8Array(0x10000);
  far.set(areaconnect.subarray(0, acRec.bytes), acOff);
  const abp = mod.nearOffsetForRuntimeSymbol("_areabyplayer");
  far.set(dgroup.bytes.subarray(abp, abp + abpRec.bytes), abpOff);
  return far;
}

// ---- state A: a fresh E1M1 game ----
const dgA = new mod.DOSMemory(0x10000);
const acA = new Uint8Array(37 * 37);
mod.US_InitRndT(false);
mod.NewGame(dgA, 1, 0);
mod.US_InitRndT(false);
const [p0, p1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(p0), new Uint16Array(p1), dgA, { areaconnect: acA, loadedgame: false });
const saveA = mod.serializeSaveGame({ dgroup: dgA, segments: { "0x33DA": makeFar(dgA, acA) } }).bytes;

// ---- load saveA into a fresh game B, then re-serialize ----
const dgB = new mod.DOSMemory(0x10000);
const acB = new Uint8Array(37 * 37);
mod.US_InitRndT(false);
mod.NewGame(dgB, 1, 0); // init dgroup structures; load overwrites the saved state
const farB = makeFar(dgB, acB);
mod.LoadTheGame(saveA, { dgroup: dgB, segments: { "0x33DA": farB } }, 0, 0, {
  setupGameLevel: () => {
    const [q0, q1] = mod.CA_CacheMap(0); // E1M1 (mapon is restored before this hook fires)
    mod.SetupGameLevel(new Uint16Array(q0), new Uint16Array(q1), dgB, { areaconnect: acB, loadedgame: true });
  },
});
// pull areaconnect back out of the far segment (the load wrote it there)
acB.set(farB.subarray(acOff, acOff + acRec.bytes));
const saveB = mod.serializeSaveGame({ dgroup: dgB, segments: { "0x33DA": makeFar(dgB, acB) } }).bytes;

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
expect(saveA.length === saveB.length, `round-trip save lengths match (${saveA.length} vs ${saveB.length})`);
let diffs = 0, firstDiff = -1;
for (let i = 0; i < Math.min(saveA.length, saveB.length); i++) if (saveA[i] !== saveB[i]) { diffs++; if (firstDiff < 0) firstDiff = i; }
console.log(`round-trip: ${diffs} differing byte(s)${firstDiff >= 0 ? ` (first at offset ${firstDiff})` : ""} of ${saveA.length}`);
expect(diffs === 0, "load(save(X)) re-serializes byte-for-byte identical to save(X)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0 ? "\n✅ SAVE/LOAD ROUND TRIP: loadSaveGameImage restores a serialized save exactly." : `\n❌ ${fail} round-trip check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
