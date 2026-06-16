// In-depth audio comparison for the "garbled/cut-off" fix.
//
// The AdLib timer ISR emits register writes at 700 Hz. We compare three ways of turning that exact
// write stream into PCM:
//   GROUND TRUTH — release each 700Hz tick-group, render exactly OPL2_RATE/700 chip samples. This
//                  is what real hardware / DOS does, and what check:opl-synth interleaves.
//   BATCHED      — OLD live path: per rAF frame, dump every write that landed in the frame into the
//                  OPL2 at one instant, then render the frame's samples.
//   SCHEDULED    — NEW path: AdLibStream.schedule() queues each 700Hz tick-group and releases it on
//                  the 700Hz grid as samples are produced.
// Frames are given REALISTIC JITTER (a 3D engine doesn't deliver perfectly even 16.67ms frames), and
// we drive a continuous gameplay scenario (music + a firing weapon) so writes actually cluster. We
// then measure each path's deviation from ground truth (lower = more faithful).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const platformDir = path.join(repoRoot, "apps", "source-typescript", "src", "platform");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-audiocmp-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheAudioChunk, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SD_SetMusicMode, SD_StartMusic, SD_PlaySound, SD_SoundPlaying, SDL_t0Service, alRegisterWrites, STARTMUSIC } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib, smm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { OPL2_RATE, AdLibStream } from "${rel(path.join(platformDir, "opl2.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup({ AUDIOHED: files.AUDIOHED, AUDIOT: files.AUDIOT });
mod.SD_ResetSoundState({ SoundMode: mod.sdm_AdLib, AdLibPresent: true });
mod.SD_Startup();
mod.SD_SetSoundMode(mod.sdm_AdLib);
mod.SD_SetMusicMode(mod.smm_AdLib);
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT); // load AdLib sound table (after mode = AdLib)

const OUT_RATE = 48000, OPL_RATE = mod.OPL2_RATE;
const SECONDS = 10;
const T0_MS = 1000 / 700;
const PISTOL = 1; // an AdLib weapon sound — retriggered to emulate firing during the scenario

// --- 1. Build the 700Hz timeline of tick-groups for a music+firing scenario --------------------
const chunk = mod.CA_CacheAudioChunk(mod.STARTMUSIC + 3, files.AUDIOHED, files.AUDIOT);
mod.SD_StartMusic(chunk);
mod.alRegisterWrites.length = 0;

const tickGroups = [];            // tickGroups[i] = writes emitted by the i-th 700Hz service
const totalTicks = Math.round(700 * SECONDS);
for (let t = 0; t < totalTicks; t++) {
  if (t % 105 === 0 && mod.SD_SoundPlaying() === 0) mod.SD_PlaySound(PISTOL); // fire ~6.7x/s when idle
  mod.SDL_t0Service();
  tickGroups.push(mod.alRegisterWrites.map((w) => ({ register: w.register, value: w.value, tick: w.tick })));
  mod.alRegisterWrites.length = 0;
}
const totalWrites = tickGroups.reduce((a, g) => a + g.length, 0);
const busiest = tickGroups.reduce((m, g) => Math.max(m, g.length), 0);
console.log(`scenario: ${totalTicks} 700Hz ticks, ${totalWrites} writes (${(totalWrites / SECONDS).toFixed(0)}/s), busiest tick = ${busiest} writes`);

// --- 2. Ground truth: one tick-group, then exactly OPL_RATE/700 chip samples -------------------
function renderGroundTruth() {
  const stream = new mod.AdLibStream(OPL_RATE); stream.reset(); // render at native rate (no resample)
  const samplesPerTick = OPL_RATE / 700;
  const out = []; let carry = 0;
  for (const g of tickGroups) {
    stream.feed(g);
    carry += samplesPerTick;
    const n = Math.floor(carry); carry -= n;
    const buf = new Float32Array(n); stream.render(buf);
    for (const s of buf) out.push(s);
  }
  return Float32Array.from(out);
}

// --- 3. Replay the timeline through realistic JITTERY frames -----------------------------------
// Deterministic pseudo-jitter (no Date/Math.random): frame durations wander 8..40ms around 16.7ms.
function frameDurations() {
  const ds = []; let total = 0, i = 0;
  while (total < SECONDS * 1000) {
    const wobble = [16.7, 16.7, 33.3, 16.7, 8.3, 25, 16.7, 50, 16.7, 16.7][i % 10];
    ds.push(wobble); total += wobble; i++;
  }
  return ds;
}
// Map the 700Hz tick timeline onto frames by wall-clock, then render each frame at OUT_RATE.
function renderFramed(useSchedule) {
  const stream = new mod.AdLibStream(OUT_RATE); stream.reset();
  const out = []; let tickCursor = 0, clock = 0, sampleCarry = 0;
  for (const dur of frameDurations()) {
    const frameEnd = clock + dur;
    const groups = [];
    while (tickCursor < tickGroups.length && (tickCursor * T0_MS) < frameEnd) {
      for (const w of tickGroups[tickCursor]) groups.push(w);
      tickCursor++;
    }
    if (useSchedule) stream.schedule(groups); else stream.feed(groups);
    sampleCarry += (dur / 1000) * OUT_RATE;
    const n = Math.floor(sampleCarry); sampleCarry -= n;
    const buf = new Float32Array(n); stream.render(buf);
    for (const s of buf) out.push(s);
    clock = frameEnd;
  }
  return Float32Array.from(out);
}

const truth = renderGroundTruth();   // at OPL_RATE
const batched = renderFramed(false); // at OUT_RATE
const scheduled = renderFramed(true);// at OUT_RATE

// --- 4. Measure deviation from ground truth (resample truth to OUT_RATE, align, normalized RMS err)
function resampleZOH(src, srcRate, dstRate, dstLen) {
  const out = new Float32Array(dstLen); const ratio = srcRate / dstRate;
  for (let i = 0; i < dstLen; i++) out[i] = src[Math.min(src.length - 1, Math.floor(i * ratio))];
  return out;
}
const rms = (s) => { let x = 0; for (const v of s) x += v * v; return Math.sqrt(x / s.length); };
const N = Math.min(batched.length, scheduled.length);
const truthOut = resampleZOH(truth, OPL_RATE, OUT_RATE, N);
// FM/additive output decorrelates with any sub-sample phase shift, so raw sample-RMS difference is
// meaningless (identical-sounding renders score ~141%). What batching actually breaks is WHEN energy
// appears (note onsets / rhythm), so compare the short-window ENERGY ENVELOPE instead: per ~5ms
// window RMS, normalized difference vs ground truth (lower = onsets land at the right times).
const WIN = 240; // ~5ms at 48kHz
function envelope(sig) {
  const env = new Float32Array(Math.floor(N / WIN));
  for (let w = 0; w < env.length; w++) { let x = 0; for (let i = 0; i < WIN; i++) { const v = sig[w * WIN + i]; x += v * v; } env[w] = Math.sqrt(x / WIN); }
  return env;
}
const truthEnv = envelope(truthOut);
const tEnvRms = rms(truthEnv);
function envDev(sig) {
  const e = envelope(sig);
  let best = Infinity;
  for (let off = -8; off <= 8; off++) { // search ±40ms window alignment
    let err = 0, cnt = 0;
    for (let w = 4; w < e.length - 4; w++) { const t = truthEnv[w + off]; if (t === undefined) continue; const d = e[w] - t; err += d * d; cnt++; }
    best = Math.min(best, Math.sqrt(err / cnt));
  }
  return best / tEnvRms;
}
console.log(`ground-truth rms ${rms(truthOut).toFixed(4)}`);
console.log(`BATCHED   onset/rhythm deviation from ground truth: ${(envDev(batched) * 100).toFixed(1)}%`);
console.log(`SCHEDULED onset/rhythm deviation from ground truth: ${(envDev(scheduled) * 100).toFixed(1)}%`);

// --- 5. Write listenable WAVs ------------------------------------------------------------------
function toWav(f32, rate) {
  const n = f32.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); buf.writeInt16LE((s * 32767) | 0, 44 + i * 2); }
  return buf;
}
const tmpOut = path.join(repoRoot, "tmp");
await writeFile(path.join(tmpOut, "music-A-batched.wav"), toWav(batched, OUT_RATE));
await writeFile(path.join(tmpOut, "music-B-scheduled.wav"), toWav(scheduled, OUT_RATE));
await writeFile(path.join(tmpOut, "music-C-groundtruth.wav"), toWav(truth, OPL_RATE));
console.log(`wrote tmp/music-A-batched.wav, music-B-scheduled.wav, music-C-groundtruth.wav (${SECONDS}s)`);
await rm(tempDir, { recursive: true, force: true });
