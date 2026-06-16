// OPL2 SYNTHESIS FIDELITY gate.
//
// The other OPL gates prove the register STREAM is byte-exact (check:opl) and that the synth produces
// audible, bounded, decaying PCM (check:opl-synth/-pitch/-worklet). None of them prove the synth
// produces the RIGHT TIMBRE — a from-scratch FM emulator can be audible and in-tune yet sound wrong.
// This gate pins the port's platform/opl2.ts synthesis against an INDEPENDENT, faithful OPL2 model
// (npm "opl3" = Cozendey OPL3, DOSBox-class; OPL2-compatible when only bank-0 registers are written),
// driven by the EXACT SAME register writes. It asserts:
//   1. the harmonic series of representative FM/feedback patches matches the reference (>=95%),
//   2. KSL (key-scale-level) attenuation per octave matches the reference to within 1 dB,
//   3. the real E1M1 song's audible partials match the reference (>=95%).
// This is what makes the AdLib music + SFX sound true to the original hardware; it caught a missing
// exp-table complement, a sign-corrupting phase-modulation mask, a half-strength modulation index,
// and an inverted KSL bit mapping.
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
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-oplfid-gate-"));
const entryPath = path.join(tempDir, "entry.ts"), outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheAudioChunk, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SD_SetMusicMode, SD_StartMusic, SDL_t0Service, alRegisterWrites, STARTMUSIC } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib, smm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { OPL2, OPL2_RATE } from "${rel(path.join(platformDir, "opl2.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const OPL_RATE = mod.OPL2_RATE, REF_RATE = 49700;

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

function renderPort(writes, n) { const o = new mod.OPL2(); o.reset(); for (const [r, v] of writes) o.write(r, v); const b = new Float32Array(n); o.render(b, 0, n); return b; }
function renderRef(writes, n) { const o = new OPL3(); for (const [r, v] of writes) o.write(0, r, v); const s = new Float32Array(n * 2); o.read(s); const out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = s[i * 2]; return out; }
const rms = (s, a = 0, b = s.length) => { let x = 0; for (let i = a; i < b; i++) x += s[i] * s[i]; return Math.sqrt(x / Math.max(1, b - a)); };
function goertzel(sig, f, rate, start, len) { const w = 2 * Math.PI * f / rate, c = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let i = start; i < start + len; i++) { const s0 = sig[i] + c * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) / (len / 2); }
function harmonics(sig, f0, rate) { const start = Math.floor(rate * 0.05), len = Math.min(sig.length - start, 8192); const h = []; for (let k = 1; k <= 10; k++) h.push(goertzel(sig, f0 * k, rate, start, len)); const m = Math.max(...h) || 1; return h.map((v) => v / m); }
function vcorr(a, b) { let num = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { num += a[i] * b[i]; da += a[i] * a[i]; db += b[i] * b[i]; } return num / Math.sqrt(da * db || 1); }

// ---- 1. Harmonic series of representative patches -----------------------------------------------
const M = 0x00, C = 0x03;
function fmPatch({ fb = 0, cnt = 0, mMult = 1, mTL = 0x10, cMult = 1, wave = 0, fnum = 580, block = 4 }) {
  return [[0x20 + M, 0x20 | mMult], [0x20 + C, 0x20 | cMult], [0x40 + M, mTL], [0x40 + C, 0],
    [0x60 + M, 0xf0], [0x60 + C, 0xf0], [0x80 + M, 0], [0x80 + C, 0], [0xe0 + M, wave], [0xe0 + C, wave],
    [0xc0, ((fb & 7) << 1) | (cnt & 1)], [0xa0, fnum & 0xff], [0xb0, 0x20 | ((block & 7) << 2) | ((fnum >> 8) & 3)]];
}
const N = Math.floor(OPL_RATE * 0.25);
const fp = (p) => 580 * Math.pow(2, 4) / Math.pow(2, 20) * p;
const patches = [
  ["FM 1:1 fb0", { fb: 0, cnt: 0, mMult: 1, mTL: 0x10, cMult: 1 }],
  ["FM 1:1 strong mod", { fb: 0, cnt: 0, mMult: 1, mTL: 0x00, cMult: 1 }],
  ["FM 1:2 fb0", { fb: 0, cnt: 0, mMult: 1, mTL: 0x12, cMult: 2 }],
  ["FM fb4", { fb: 4, cnt: 0, mMult: 1, mTL: 0x10, cMult: 1 }],
];
console.log("OPL2 fidelity vs opl3 reference (Cozendey, DOSBox-class):\n");
for (const [name, p] of patches) {
  const c = vcorr(harmonics(renderPort(fmPatch(p), N), fp(OPL_RATE), OPL_RATE), harmonics(renderRef(fmPatch(p), N), fp(REF_RATE), REF_RATE));
  expect(c >= 0.95, `${name}: harmonic series matches reference (${(c * 100).toFixed(1)}%)`);
}

// ---- 2. KSL attenuation per octave --------------------------------------------------------------
function kslPatch(fnum, block, ksl) {
  return [[0x20 + C, 0x20 | 1], [0x40 + C, ((ksl & 3) << 6) | 0], [0x60 + C, 0xf0], [0x80 + C, 0], [0xe0 + C, 0],
    [0x20 + M, 0x20 | 1], [0x40 + M, 0x3f], [0x60 + M, 0xf0], [0x80 + M, 0], [0xe0 + M, 0],
    [0xc0, 0x01], [0xa0, fnum & 0xff], [0xb0, 0x20 | ((block & 7) << 2) | ((fnum >> 8) & 3)]];
}
const NK = Math.floor(OPL_RATE * 0.12);
for (const ksl of [1, 2, 3]) {
  const pdB = 20 * Math.log10(rms(renderPort(kslPatch(512, 6, ksl), NK)) / rms(renderPort(kslPatch(512, 2, ksl), NK)));
  const rdB = 20 * Math.log10(rms(renderRef(kslPatch(512, 6, ksl), NK)) / rms(renderRef(kslPatch(512, 2, ksl), NK)));
  expect(Math.abs(pdB - rdB) <= 1.0, `KSL=${ksl}: per-4-octave attenuation matches reference within 1 dB (port ${pdB.toFixed(1)} vs ref ${rdB.toFixed(1)})`);
}

// ---- 2b. Sustain level: a sustaining note must settle 3 dB per SL step (not 6) -----------------
function susPatch(sl) {
  return [[0x20 + C, 0x20 | 1], [0x40 + C, 0], [0x60 + C, 0xfc], [0x80 + C, ((sl & 0xf) << 4) | 0], [0xe0 + C, 0],
    [0x20 + M, 0x20 | 1], [0x40 + M, 0x3f], [0x60 + M, 0xff], [0x80 + M, 0xf0], [0xe0 + M, 0],
    [0xc0, 0x01], [0xa0, 512], [0xb0, 0x20 | (4 << 2) | 2]];
}
const ssRms = (s, rate) => rms(s, Math.floor(rate * 0.25), Math.floor(rate * 0.4));
const NS = Math.floor(OPL_RATE * 0.4), NSR = Math.floor(REF_RATE * 0.4);
const susPeakP = ssRms(renderPort(susPatch(0), NS), OPL_RATE), susPeakR = ssRms(renderRef(susPatch(0), NSR), REF_RATE);
for (const sl of [2, 4]) {
  const pdB = 20 * Math.log10(ssRms(renderPort(susPatch(sl), NS), OPL_RATE) / susPeakP);
  const rdB = 20 * Math.log10(ssRms(renderRef(susPatch(sl), NSR), REF_RATE) / susPeakR);
  expect(Math.abs(pdB - rdB) <= 1.0, `SL=${sl}: sustain settles at the reference level within 1 dB (port ${pdB.toFixed(1)} vs ref ${rdB.toFixed(1)}, ideal ${-3 * sl})`);
}

// ---- 3. Real E1M1 song audible partials ---------------------------------------------------------
const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup({ AUDIOHED: files.AUDIOHED, AUDIOT: files.AUDIOT });
mod.SD_ResetSoundState({ SoundMode: mod.sdm_AdLib, AdLibPresent: true });
mod.SD_Startup(); mod.SD_SetSoundMode(mod.sdm_AdLib); mod.SD_SetMusicMode(mod.smm_AdLib);
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
mod.alRegisterWrites.length = 0;
mod.SD_StartMusic(mod.CA_CacheAudioChunk(mod.STARTMUSIC + 3, files.AUDIOHED, files.AUDIOT));
const groups = [{ w: mod.alRegisterWrites.map((x) => [x.register & 0xff, x.value & 0xff]) }];
mod.alRegisterWrites.length = 0;
for (let t = 0; t < 700 * 6; t++) { mod.SDL_t0Service(); groups.push({ w: mod.alRegisterWrites.map((x) => [x.register & 0xff, x.value & 0xff]) }); mod.alRegisterWrites.length = 0; }
function renderStream(groups, rate, makeOpl, writeFn, readN) {
  const opl = makeOpl(); const spt = rate / 700; const out = []; let carry = 0;
  for (const g of groups) { for (const w of g.w) writeFn(opl, w); carry += spt; const n = Math.floor(carry); carry -= n; readN(opl, n, out); }
  return Float32Array.from(out);
}
const portMusic = renderStream(groups, OPL_RATE, () => { const o = new mod.OPL2(); o.reset(); return o; }, (o, w) => o.write(w[0], w[1]), (o, n, out) => { const b = new Float32Array(n); o.render(b, 0, n); for (let i = 0; i < n; i++) out.push(b[i]); });
const refMusic = renderStream(groups, REF_RATE, () => new OPL3(), (o, w) => o.write(0, w[0], w[1]), (o, n, out) => { const s = new Float32Array(n * 2); o.read(s); for (let i = 0; i < n; i++) out.push(s[i * 2]); });
function avgSpectrum(sig, size = 4096) {
  const mag = new Float64Array(size / 2); let fr = 0;
  for (let s = 0; s + size < sig.length; s += size / 2) {
    const re = new Float64Array(size), im = new Float64Array(size);
    for (let i = 0; i < size; i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)); re[i] = (sig[s + i] || 0) * w; }
    for (let i = 1, j = 0; i < size; i++) { let bit = size >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= size; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < size; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k]; const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr; } } }
    for (let i = 0; i < mag.length; i++) mag[i] += Math.hypot(re[i], im[i]); fr++;
  }
  if (fr) for (let i = 0; i < mag.length; i++) mag[i] /= fr; return mag;
}
const pm = avgSpectrum(portMusic), rm2 = avgSpectrum(refMusic);
const peak = Math.max(...rm2), thr = peak * 0.03;
const pa = [], ra = []; for (let i = 1; i < rm2.length; i++) if (rm2[i] >= thr) { pa.push(pm[i]); ra.push(rm2[i]); }
const musicCorr = vcorr(pa, ra);
expect(musicCorr >= 0.95, `E1M1 song audible partials match reference (${(musicCorr * 100).toFixed(1)}% of ${ra.length} strong bins)`);

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ OPL FIDELITY: the port's OPL2 synthesis matches a faithful reference (harmonics, KSL, real song) — the AdLib music + SFX are true to OPL2 hardware."
  : `\n❌ OPL FIDELITY: ${fail} check(s) failed — the synthesis has drifted from a faithful OPL2.`);
process.exitCode = fail === 0 ? 0 : 1;
