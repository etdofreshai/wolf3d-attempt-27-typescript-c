// T3 partial gate: prove the port's save-game serialization is byte-identical to a real
// DOS save (oracle/generated/saves/wl6-e1m1-start.sav) for the save FORMAT and all DATA
// fields. The few excluded bytes are DGROUP near-POINTERS (actor `state`, `laststatobj`)
// whose exact value depends on the build's DGROUP variable ordering — making those
// retail-authoritative is ROADMAP 3a (the deepest item); see memory/t3-save-interop.md.
// What this DOES prove: gamestate values, tilemap, actorat, areaconnect, areabyplayer,
// statobjlist, doorposition/doorobjlist, pushwall state — all byte-identical to DOS.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const fixturePath = path.join(repoRoot, "oracle", "generated", "saves", "wl6-e1m1-start.sav");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-savecmp-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheMap } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
  `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
  `export { NewGame } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SetupGameLevel } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
  `export { serializeSaveGame, getSaveRecord, nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
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
mod.US_InitRndT(false);
const [plane0, plane1] = mod.CA_CacheMap(0);
mod.SetupGameLevel(new Uint16Array(plane0), new Uint16Array(plane1), dgroup, { areaconnect, loadedgame: false });

const far = new Uint8Array(0x10000);
const acRec = mod.getSaveRecord("areaconnect");
const abpRec = mod.getSaveRecord("areabyplayer");
const acOff = Number.parseInt(acRec.symbolInfo.nearOffset.slice(2), 16);
const abpOff = Number.parseInt(abpRec.symbolInfo.nearOffset.slice(2), 16);
far.set(areaconnect.subarray(0, acRec.bytes), acOff);
const abpRuntime = mod.nearOffsetForRuntimeSymbol("_areabyplayer");
far.set(dgroup.bytes.subarray(abpRuntime, abpRuntime + abpRec.bytes), abpOff);

const result = mod.serializeSaveGame({ dgroup, segments: { "0x33DA": far } });
const port = result.bytes;
const oracle = new Uint8Array(await readFile(fixturePath));

// Bytes excluded from the DATA comparison (build-fragile DGROUP near-pointers + DOS
// uninitialized nullobj padding + the checksum that covers laststatobj).
const excluded = new Set();
for (const p of result.pieces) {
  if (p.name === "objtype") { excluded.add(p.offset + 6); excluded.add(p.offset + 7); }   // actor `state` near pointer
  if (p.name === "laststatobj" || p.name === "nullobj" || p.name === "checksum") {
    for (let i = p.offset; i < p.offset + p.bytes; i++) excluded.add(i);
  }
}

let dataDiffs = 0, firstDiff = -1;
const n = Math.min(port.length, oracle.length);
for (let i = 0; i < n; i++) {
  if (excluded.has(i)) continue;
  if (port[i] !== oracle[i]) { dataDiffs++; if (firstDiff < 0) firstDiff = i; }
}

const lenOk = port.length === oracle.length;
console.log(`port save ${port.length} B vs DOS fixture ${oracle.length} B; compared ${n - excluded.size} data bytes (excluded ${excluded.size} build-fragile pointer/nullobj/checksum bytes)`);
if (lenOk && dataDiffs === 0) {
  console.log("✅ T3 SAVE DATA: port save is byte-identical to the DOS save (format + all data fields).");
  process.exitCode = 0;
} else {
  console.log(`❌ T3 SAVE DATA mismatch: ${dataDiffs} data bytes differ${firstDiff >= 0 ? ` (first @ ${firstDiff})` : ""}${lenOk ? "" : `; length ${port.length} vs ${oracle.length}`}`);
  if (firstDiff >= 0) {
    const piece = result.pieces.find((p) => firstDiff >= p.offset && firstDiff < p.offset + p.bytes);
    console.log(`   first diff in piece "${piece?.name}" at +${firstDiff - (piece?.offset ?? 0)} (port=${port[firstDiff]} oracle=${oracle[firstDiff]})`);
  }
  process.exitCode = 1;
}
await rm(tempDir, { recursive: true, force: true });
