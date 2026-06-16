// Ground-truth OPL2 fidelity comparison.
//
// The port's FM synth (platform/opl2.ts) is a from-scratch OPL2. To judge how faithful it sounds,
// we feed the EXACT SAME AdLib register stream that id_sd.c emits to BOTH:
//   PORT — apps/source-typescript/src/platform/opl2.ts  (the thing the user hears)
//   REF  — npm "opl3" (Cozendey OPL3, DOSBox-class accuracy; OPL2-compatible when only bank 0 is
//          written), the closest faithful hardware model we can run under node.
// Identical input → any audible difference is the port's synthesis. We render both, write listenable
// A/B WAVs, and measure objective divergence (loudness, brightness/centroid, spectral correlation,
// envelope correlation) for the FIRST SONG (E1M1) and a BONUS pickup (BONUS1SND, an AdLib SFX).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const OPL3 = require("opl3").OPL3;

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const platformDir = path.join(repoRoot, "apps", "source-typescript", "src", "platform");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tmpOut = path.join(repoRoot, "tmp");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-oplfid-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheAudioChunk, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SD_SetMusicMode, SD_StartMusic, SD_PlaySound, SD_StopSound, SD_SoundPlaying, SD_MusicOff, SDL_t0Service, alRegisterWrites, STARTMUSIC } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib, smm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { OPL2, OPL2_RATE } from "${rel(path.join(platformDir, "opl2.ts"))}";`,
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
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);

const OPL_RATE = mod.OPL2_RATE;        // port native (49716)
const REF_RATE = 49700;                // opl3 native
const BONUS1SND = 35;

// ---- Capture the 700Hz register stream for a scenario -----------------------------------------
// Returns tickGroups: array (per 700Hz service) of {register,value} arrays.
function capture(setup, ticks, stopWhenSilent) {
  mod.alRegisterWrites.length = 0;
  setup(); // SFX instrument load (SDL_ALPlaySound) emits register writes IMMEDIATELY, before any t0 tick
  const groups = [];
  groups.push(mod.alRegisterWrites.map((w) => ({ register: w.register & 0xff, value: w.value & 0xff }))); // tick 0 = setup writes
  mod.alRegisterWrites.length = 0;
  for (let t = 0; t < ticks; t++) {
    mod.SDL_t0Service();
    groups.push(mod.alRegisterWrites.map((w) => ({ register: w.register & 0xff, value: w.value & 0xff })));
    mod.alRegisterWrites.length = 0;
    if (stopWhenSilent && t > 35 && mod.SD_SoundPlaying() === 0) break;
  }
  return groups;
}

// ---- Render a captured stream through the PORT OPL2 --------------------------------------------
function renderPort(groups) {
  const opl = new mod.OPL2(); opl.reset();
  const spt = OPL_RATE / 700;
  const out = []; let carry = 0;
  const buf = new Float32Array(256);
  for (const g of groups) {
    for (const w of g) opl.write(w.register, w.value);
    carry += spt; let n = Math.floor(carry); carry -= n;
    while (n > 0) { const c = Math.min(n, buf.length); opl.render(buf, 0, c); for (let i = 0; i < c; i++) out.push(buf[i]); n -= c; }
  }
  return Float32Array.from(out);
}

// ---- Render a captured stream through the REFERENCE opl3 ---------------------------------------
function renderRef(groups) {
  const opl = new OPL3();
  const spt = REF_RATE / 700;
  const out = []; let carry = 0;
  for (const g of groups) {
    for (const w of g) opl.write(0, w.register, w.value); // array 0 = OPL2-compatible bank
    carry += spt; const n = Math.floor(carry); carry -= n;
    const stereo = new Float32Array(n * 2);
    opl.read(stereo);
    for (let i = 0; i < n; i++) out.push(stereo[i * 2]); // OPL2 is mono → take left
  }
  return Float32Array.from(out);
}

// ---- Measurement helpers ----------------------------------------------------------------------
const rms = (s, a = 0, b = s.length) => { let x = 0; for (let i = a; i < b; i++) x += s[i] * s[i]; return Math.sqrt(x / Math.max(1, b - a)); };
function normalize(s, peak = 0.9) { let m = 0; for (const v of s) m = Math.max(m, Math.abs(v)); if (m === 0) return s; const k = peak / m; const o = new Float32Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s[i] * k; return o; }

// naive DFT magnitude over a window (size = power of 2), returns magnitude[0..size/2]
function magSpectrum(sig, start, size) {
  const re = new Float64Array(size), im = new Float64Array(size);
  for (let i = 0; i < size; i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)); re[i] = (sig[start + i] || 0) * w; }
  // iterative radix-2 FFT
  for (let i = 1, j = 0; i < size; i++) { let bit = size >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= size; len <<= 1) { const ang = -2 * Math.PI / len; const wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < size; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k]; const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci; const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr; } } }
  const mag = new Float64Array(size / 2); for (let i = 0; i < size / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}
// average magnitude spectrum across the signal (overlapping windows)
function avgSpectrum(sig, size = 4096) {
  const mag = new Float64Array(size / 2); let frames = 0;
  for (let start = 0; start + size < sig.length; start += size / 2) { const m = magSpectrum(sig, start, size); for (let i = 0; i < mag.length; i++) mag[i] += m[i]; frames++; }
  if (frames) for (let i = 0; i < mag.length; i++) mag[i] /= frames;
  return mag;
}
function spectralCentroid(mag, rate, size) { let num = 0, den = 0; for (let i = 1; i < mag.length; i++) { const f = (i * rate) / size; num += f * mag[i]; den += mag[i]; } return den ? num / den : 0; }
function corr(a, b) { const n = Math.min(a.length, b.length); let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; } return num / Math.sqrt(da * db || 1); }
function envelope(sig, win = 256) { const env = new Float64Array(Math.floor(sig.length / win)); for (let w = 0; w < env.length; w++) env[w] = rms(sig, w * win, w * win + win); return env; }

function toWav(f32, rate) {
  const n = f32.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); buf.writeInt16LE((s * 32767) | 0, 44 + i * 2); }
  return buf;
}

async function compareCase(label, groups, seconds) {
  const port = renderPort(groups);
  const ref = renderRef(groups);
  const portN = normalize(port), refN = normalize(ref);
  await writeFile(path.join(tmpOut, `cmp-${label}-PORT.wav`), toWav(portN, OPL_RATE));
  await writeFile(path.join(tmpOut, `cmp-${label}-REF.wav`), toWav(refN, REF_RATE));

  const size = 4096;
  const pm = avgSpectrum(portN, size), rm2 = avgSpectrum(refN, size);
  const pc = spectralCentroid(pm, OPL_RATE, size), rc = spectralCentroid(rm2, REF_RATE, size);
  // log-magnitude spectral correlation (perceptually weighted)
  const plog = Float64Array.from(pm, (v) => Math.log10(v + 1e-9));
  const rlog = Float64Array.from(rm2, (v) => Math.log10(v + 1e-9));
  const specCorr = corr(plog, rlog);
  // ALSO: linear-magnitude correlation (weights audible partials, ignores the numerical noise floor
  // that log-scaling over-weights) and a partials-only correlation (bins above 3% of the ref peak).
  const linCorr = corr(pm, rm2);
  const refPeak = Math.max(...rm2); const thr = refPeak * 0.03;
  const pPart = [], rPart = []; for (let i = 1; i < rm2.length; i++) if (rm2[i] >= thr) { pPart.push(pm[i]); rPart.push(rm2[i]); }
  const partCorr = corr(Float64Array.from(pPart), Float64Array.from(rPart));
  // envelope correlation (timing/dynamics), aligned to common length
  const pe = envelope(portN), re = envelope(ref.length ? refN : refN);
  const envCorr = corr(pe, re);

  console.log(`\n=== ${label} (${seconds}s, ${groups.length} ticks) ===`);
  console.log(`  port samples ${port.length}, ref samples ${ref.length}`);
  console.log(`  loudness RMS   port ${rms(port).toFixed(4)}   ref ${rms(ref).toFixed(4)}   (pre-normalize)`);
  console.log(`  brightness (spectral centroid)  port ${pc.toFixed(0)} Hz   ref ${rc.toFixed(0)} Hz   diff ${(pc - rc).toFixed(0)} Hz`);
  console.log(`  log-spectrum correlation port↔ref: ${(specCorr * 100).toFixed(1)}%   (100% = identical timbre)`);
  console.log(`  linear-magnitude correlation     : ${(linCorr * 100).toFixed(1)}%   (weights audible partials)`);
  console.log(`  strong-partials-only correlation : ${(partCorr * 100).toFixed(1)}%   (bins >3% of ref peak)`);
  console.log(`  envelope correlation     port↔ref: ${(envCorr * 100).toFixed(1)}%   (100% = identical dynamics)`);
  // band energy split: low <1.5k, mid 1.5-5k, high >5k — shows WHERE timbre differs
  function bands(mag, rate) { let lo = 0, mid = 0, hi = 0; for (let i = 1; i < mag.length; i++) { const f = (i * rate) / size; const e = mag[i] * mag[i]; if (f < 1500) lo += e; else if (f < 5000) mid += e; else hi += e; } const t = lo + mid + hi || 1; return [100 * lo / t, 100 * mid / t, 100 * hi / t]; }
  const pb = bands(pm, OPL_RATE), rb = bands(rm2, REF_RATE);
  console.log(`  energy %% [low/mid/high]  port [${pb.map((x) => x.toFixed(0)).join("/")}]   ref [${rb.map((x) => x.toFixed(0)).join("/")}]`);
  return { label, pc, rc, specCorr, envCorr, pb, rb };
}

// ---- Scenario 1: first song (E1M1) -----------------------------------------------------------
const MUSIC_SECS = 8;
const musicGroups = capture(() => {
  const chunk = mod.CA_CacheAudioChunk(mod.STARTMUSIC + 3, files.AUDIOHED, files.AUDIOT);
  mod.SD_StartMusic(chunk);
}, Math.round(700 * MUSIC_SECS), false);
const musicRes = await compareCase("music-e1m1", musicGroups, MUSIC_SECS);

// ---- Scenario 2: bonus pickup (BONUS1SND, AdLib SFX) -----------------------------------------
mod.SD_MusicOff && mod.SD_MusicOff();
const bonusGroups = capture(() => {
  mod.SD_StopSound();
  mod.SD_PlaySound(BONUS1SND);
}, 700 * 3, true);
const bonusRes = await compareCase("bonus", bonusGroups, (bonusGroups.length / 700).toFixed(2));

await rm(tempDir, { recursive: true, force: true });
console.log("\nWrote tmp/cmp-music-e1m1-PORT.wav / -REF.wav and tmp/cmp-bonus-PORT.wav / -REF.wav");
console.log("(REF = npm opl3 / Cozendey OPL3 ~ DOSBox-class hardware model; PORT = platform/opl2.ts)");
