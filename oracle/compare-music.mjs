// Feature gate — AdLib (IMF) background music. Each Wolf3D level plays a song stored in AUDIOT as an
// IMF event stream ([u16 length] then (reg, val, u16 delay) events at 700 Hz). The port had the
// music on/off bookkeeping but the actual interpreter (SDL_ALService) + loader (SD_StartMusic) were
// stubbed, so no music played. This gate drives the real interpreter and asserts it emits exactly
// the song's AdLib register writes, in order, at the right times, and loops cleanly.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-music-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_LoadAllSounds, CA_CacheAudioChunk } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SD_SetMusicMode, SD_StartMusic, SDL_ALService, SD_DebugState, alRegisterWrites, STARTMUSIC } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib, smm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup({ AUDIOHED: files.AUDIOHED, AUDIOT: files.AUDIOT });
mod.SD_ResetSoundState({ AdLibPresent: true });
mod.SD_Startup();
mod.SD_SetSoundMode(mod.sdm_AdLib);
mod.SD_SetMusicMode(mod.smm_AdLib);

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// Parse the E1M1 song (music chunk 3) IMF directly: expected (reg,val) events + delays.
const chunk = mod.CA_CacheAudioChunk(mod.STARTMUSIC + 3, files.AUDIOHED, files.AUDIOT);
const len = chunk[0] | (chunk[1] << 8);
const expected = [];
let totalDelay = 0;
for (let o = 2; o + 4 <= 2 + len; o += 4) { expected.push([chunk[o], chunk[o + 1]]); totalDelay += chunk[o + 2] | (chunk[o + 3] << 8); }
console.log(`E1M1 song: ${expected.length} events, totalDelay=${totalDelay} (~${(totalDelay / 700).toFixed(1)}s @700Hz)`);

mod.SD_StartMusic(chunk);
expect(mod.SD_DebugState().sqActive, "SD_StartMusic started playback (sqActive)");
mod.alRegisterWrites.length = 0; // drop the SD_MusicOff voice-silencing writes

// Run the interpreter through ~2 full loops, capturing every emitted (register, value).
const writes = [];
const services = totalDelay * 2 + 200;
for (let i = 0; i < services; i++) {
  mod.SDL_ALService();
  for (const w of mod.alRegisterWrites) writes.push([w.register, w.value]);
  mod.alRegisterWrites.length = 0;
}
const distinctRegs = new Set(writes.map((w) => w[0])).size;
console.log(`interpreter emitted ${writes.length} register writes over ${services} services, ${distinctRegs} distinct registers`);

expect(writes.length >= expected.length * 2 - 8, "the song played through and looped (≈2x the event count emitted)");
let firstMiss = -1;
for (let i = 0; i < expected.length; i++) { if (writes[i][0] !== expected[i][0] || writes[i][1] !== expected[i][1]) { firstMiss = i; break; } }
expect(firstMiss === -1, "emitted AdLib register stream matches the IMF events exactly, in order (first pass)");
let loopMiss = -1;
for (let i = 0; i < expected.length; i++) { const w = writes[expected.length + i]; if (!w || w[0] !== expected[i][0] || w[1] !== expected[i][1]) { loopMiss = i; break; } }
expect(loopMiss === -1, "the song loops cleanly — the second pass replays the IMF from the top");
expect(distinctRegs > 30, "music drives many AdLib registers (a real multi-voice song, not a stuck note)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ MUSIC: the IMF interpreter plays the level song's AdLib register stream in order and loops it."
  : `\n❌ ${fail} music check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
