// T3 byte-identity check: serialize the port's level-start state (E1M1, difficulty 1,
// deterministic seed) and compare byte-for-byte against the real DOS save the Borland/
// DOSBox oracle produced (tmp/oracle-build/LSAVE0.SAV). This validates the save format
// AND the DGROUP/struct layout against the real game.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-t3-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { NewGame } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { serializeSaveGame, getSaveRecord, nearOffsetForSymbol, nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
const files = {};
for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);

const dgroup = new mod.DOSMemory(0x10000);
const areaconnect = new Uint8Array(37 * 37);
mod.US_InitRndT(false);
mod.NewGame(dgroup, 1, 0);
mod.US_InitRndT(false); // match the oracle's SetupGameLevel demoplayback re-seed (rndindex=0 at spawn)
const [plane0, plane1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(plane0), new Uint16Array(plane1), dgroup, {
  areaconnect,
  loadedgame: false,
});

// Marshal the runtime far-resident arrays (areaconnect param + dgroup areabyplayer) into
// the 0x33DA far segment at the save-record offsets the serializer reads from.
const far = new Uint8Array(0x10000);
const acRec = mod.getSaveRecord("areaconnect");
const abpRec = mod.getSaveRecord("areabyplayer");
const acOff = Number.parseInt(acRec.symbolInfo.nearOffset.slice(2), 16);
const abpOff = Number.parseInt(abpRec.symbolInfo.nearOffset.slice(2), 16);
console.log(`areaconnect: seg=${acRec.symbolInfo.segment} nearOff=${acRec.symbolInfo.nearOffset}(${acOff}) bytes=${acRec.bytes}`);
console.log(`areabyplayer: seg=${abpRec.symbolInfo.segment} nearOff=${abpRec.symbolInfo.nearOffset}(${abpOff}) bytes=${abpRec.bytes}`);
far.set(areaconnect.subarray(0, acRec.bytes), acOff);
const abpRuntime = mod.nearOffsetForRuntimeSymbol("_areabyplayer");
far.set(dgroup.bytes.subarray(abpRuntime, abpRuntime + abpRec.bytes), abpOff);

const result = mod.serializeSaveGame({ dgroup, segments: { "0x33DA": far } });
const portBytes = result.bytes;

const oracleBytes = new Uint8Array(await readFile(path.join(repoRoot, "tmp", "oracle-build", "LSAVE0.SAV")));

console.log(`port save: ${portBytes.length} bytes, oracle save: ${oracleBytes.length} bytes`);
console.log(`piece layout: ${result.pieces.map((p) => `${p.name}@${p.offset}(${p.bytes})`).join(" ")}`);
const n = Math.min(portBytes.length, oracleBytes.length);
let firstDiff = -1;
let diffCount = 0;
for (let i = 0; i < n; i++) {
  if (portBytes[i] !== oracleBytes[i]) {
    if (firstDiff < 0) firstDiff = i;
    diffCount++;
  }
}
// HYPOTHESIS CHECK: if the statetype near-offsets are uniformly +4 vs retail, then
// patching every actor's state pointer (objtype +6, u16) by -4 and ignoring the DOS
// nullobj uninitialized-stack padding should yield a byte-identical save.
{
  const patched = new Uint8Array(portBytes);
  for (const p of result.pieces) {
    if (p.name === "objtype") {
      const o = p.offset + 6;
      const v = (patched[o] | (patched[o + 1] << 8)) - 4;
      patched[o] = v & 0xff; patched[o + 1] = (v >> 8) & 0xff;
    }
  }
  const nullPiece = result.pieces.find((p) => p.name === "nullobj");
  let mism = 0, firstM = -1;
  for (let i = 0; i < n; i++) {
    if (nullPiece && i >= nullPiece.offset && i < nullPiece.offset + nullPiece.bytes) continue; // DOS nullobj = uninit stack
    if (i >= result.pieces.at(-1).offset) continue; // checksum cascades; recomputed below
    if (patched[i] !== oracleBytes[i]) { mism++; if (firstM < 0) firstM = i; }
  }
  console.log(`\nHYPOTHESIS (statetype -4, ignore nullobj+checksum): ${mism === 0 ? "✅ CONFIRMED byte-identical" : `❌ still ${mism} diffs, first @ ${firstM}`}`);
}

if (portBytes.length === oracleBytes.length && diffCount === 0) {
  console.log("✅ T3 BYTE-IDENTICAL: port level-start save == DOS oracle save");
} else {
  console.log(`❌ DIFFER: ${diffCount}/${n} bytes differ; first diff @ ${firstDiff}`);
  if (firstDiff >= 0) {
    const piece = result.pieces.find((p) => firstDiff >= p.offset && firstDiff < p.offset + p.bytes);
    console.log(`   first diff in piece "${piece?.name}" at +${firstDiff - (piece?.offset ?? 0)} (port=${portBytes[firstDiff]} oracle=${oracleBytes[firstDiff]})`);
    const lo = Math.max(0, firstDiff - 4), hi = Math.min(n, firstDiff + 12);
    console.log(`   port  [${lo}..${hi}]: ${[...portBytes.slice(lo, hi)].join(",")}`);
    console.log(`   oracle[${lo}..${hi}]: ${[...oracleBytes.slice(lo, hi)].join(",")}`);
  }
  // per-piece match summary
  for (const p of result.pieces) {
    let pd = 0;
    for (let i = p.offset; i < Math.min(p.offset + p.bytes, n); i++) if (portBytes[i] !== oracleBytes[i]) pd++;
    console.log(`   piece ${p.name}@${p.offset}(${p.bytes}): ${pd === 0 ? "OK" : pd + " diffs"}`);
  }
}
await rm(tempDir, { recursive: true, force: true });
