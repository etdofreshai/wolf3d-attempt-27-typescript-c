// T4-audio synthesis gate (pitch + envelope): verify the OPL2 emulator's phase and envelope
// generators directly. (1) A pure sine keyed on at a known F-number/block must come out at the
// EXACT frequency (freq = fnum * 49716 / 2^(20-block)) — this is the robust correctness check
// for the phase generator regardless of timbre tables. (2) A 2-operator FM instrument keyed on
// (loud) then off must decay toward silence, exercising the ADSR envelope. The companion gate
// oracle/compare-opl-synth.mjs renders REAL Wolf3D AdLib sound streams through the same core.
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const src = path.join(repoRoot, "apps", "source-typescript", "src", "platform", "opl2.ts");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "opl2-"));
const outPath = path.join(tempDir, "opl2.mjs");
await build({ entryPoints: [src], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const { OPL2, OPL2_RATE, AdLibStream } = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

function measureFreqAt(samples, rate) {
  // remove DC bias, then count rising zero-crossings (sign changes) of the centered signal.
  let mean = 0; for (const v of samples) mean += v; mean /= samples.length;
  let crossings = 0, prev = samples[0] - mean;
  for (let i = 1; i < samples.length; i++) {
    const s = samples[i] - mean;
    if (prev < 0 && s >= 0) crossings++;
    prev = s;
  }
  return crossings * rate / samples.length;
}
const measureFreq = (samples) => measureFreqAt(samples, OPL2_RATE);
function rms(samples) { let s = 0; for (const v of samples) s += v * v; return Math.sqrt(s / samples.length); }
function peak(samples) { let p = 0; for (const v of samples) p = Math.max(p, Math.abs(v)); return p; }

let failures = 0;
const expect = (cond, msg) => { console.log(`${cond ? "  ok  " : " FAIL "} ${msg}`); if (!cond) failures++; };

// ---- Test 1: pure-sine pitch across several F-number/block values --------------------------
console.log("Test 1 — phase generator pitch accuracy (pure carrier sine):");
for (const [fnum, block, label] of [[580, 4, "A4 ~440Hz"], [345, 5, "~523Hz C5"], [512, 3, "~194Hz"]]) {
  const opl = new OPL2();
  opl.reset();
  // channel 0: ADDITIVE connection so the carrier is a PURE sine (no FM distortion); modulator
  // is held silent (attack rate 0 -> never leaves max attenuation) so only the carrier sounds.
  opl.write(0x20 + 0, 0x21); opl.write(0x20 + 3, 0x21); // mult=1, EG sustaining
  opl.write(0x40 + 0, 0x3f); opl.write(0x40 + 3, 0x00); // mod silent (TL=63), carrier loud (TL=0)
  opl.write(0x60 + 0, 0x00); opl.write(0x60 + 3, 0xf0); // mod AR=0 (stays silent); carrier AR=15
  opl.write(0x80 + 0, 0x00); opl.write(0x80 + 3, 0x00); // SL=0, RR=0
  opl.write(0xe0 + 0, 0x00); opl.write(0xe0 + 3, 0x00); // sine
  opl.write(0xc0 + 0, 0x01); // additive (no phase modulation of the carrier)
  opl.write(0xa0 + 0, fnum & 0xff);
  opl.write(0xb0 + 0, 0x20 | (block << 2) | ((fnum >> 8) & 3)); // key-on
  // skip the attack transient, then measure steady state
  opl.renderBuffer(2000);
  const buf = opl.renderBuffer(OPL2_RATE); // 1 second
  const expected = fnum * OPL2_RATE / Math.pow(2, 20 - block);
  const measured = measureFreq(buf);
  const errPct = Math.abs(measured - expected) / expected * 100;
  console.log(`    fnum=${fnum} block=${block} (${label}): expected ${expected.toFixed(1)}Hz, measured ${measured.toFixed(1)}Hz, err ${errPct.toFixed(2)}% (rms ${rms(buf).toFixed(3)})`);
  expect(errPct < 1.0, `${label}: pitch within 1%`);
  expect(rms(buf) > 0.02, `${label}: audible (non-silent)`);
}

// ---- Test 2: a 2-op FM instrument keys on (loud) then off (decays to silence) --------------
console.log("Test 2 — FM instrument envelope (key-on loud, key-off -> silence):");
{
  const opl = new OPL2();
  opl.reset();
  opl.write(0x20 + 0, 0x01); opl.write(0x20 + 3, 0x01); // mult=1
  opl.write(0x40 + 0, 0x10); opl.write(0x40 + 3, 0x00); // modest mod level, loud carrier
  opl.write(0x60 + 0, 0xf2); opl.write(0x60 + 3, 0xf2); // fast attack, slowish decay
  opl.write(0x80 + 0, 0x14); opl.write(0x80 + 3, 0x14); // sustain mid, release rate 4
  opl.write(0xe0 + 0, 0x00); opl.write(0xe0 + 3, 0x00);
  opl.write(0xc0 + 0, 0x06); // some feedback, FM
  opl.write(0xa0 + 0, 0x44);
  opl.write(0xb0 + 0, 0x20 | (4 << 2) | 0x02); // key-on, block 4
  const onBuf = opl.renderBuffer(Math.floor(OPL2_RATE * 0.2));
  // key-off
  opl.write(0xb0 + 0, (4 << 2) | 0x02);
  const offBuf = opl.renderBuffer(Math.floor(OPL2_RATE * 0.5));
  const tail = offBuf.subarray(offBuf.length - 1000);
  console.log(`    key-on rms ${rms(onBuf).toFixed(3)} peak ${peak(onBuf).toFixed(3)}; release-tail rms ${rms(tail).toFixed(4)}`);
  expect(rms(onBuf) > 0.02, "instrument audible while keyed on");
  expect(peak(onBuf) <= 1.0, "output stays within [-1,1] (no clipping overflow)");
  expect(rms(tail) < rms(onBuf) * 0.5, "envelope releases toward silence after key-off");
}

// ---- Test 3: AdLibStream resampler preserves pitch at the browser output rate --------------
console.log("Test 3 — AdLibStream resampling (49716 Hz chip -> 48000 Hz output) preserves pitch:");
for (const outRate of [48000, 44100]) {
  const stream = new AdLibStream(outRate);
  stream.reset();
  // same pure-sine A4 setup as Test 1 (fnum=580 block=4 -> 440 Hz)
  for (const [r, vv] of [[0x20, 0x21], [0x23, 0x21], [0x40, 0x3f], [0x43, 0x00], [0x60, 0x00],
    [0x63, 0xf0], [0x80, 0x00], [0x83, 0x00], [0xe0, 0x00], [0xe3, 0x00], [0xc0, 0x01],
    [0xa0, 580 & 0xff], [0xb0, 0x20 | (4 << 2) | ((580 >> 8) & 3)]]) stream.write(r, vv);
  const buf = new Float32Array(outRate); // 1 second at outRate
  stream.render(new Float32Array(2000)); // skip attack
  stream.render(buf);
  const measured = measureFreqAt(buf, outRate);
  const errPct = Math.abs(measured - 440.0) / 440.0 * 100;
  console.log(`    outRate=${outRate}: expected 440.0Hz, measured ${measured.toFixed(1)}Hz, err ${errPct.toFixed(2)}% (rms ${rms(buf).toFixed(3)})`);
  expect(errPct < 1.0, `outRate ${outRate}: resampled pitch within 1%`);
  expect(rms(buf) > 0.02, `outRate ${outRate}: resampled output audible`);
}

await rm(tempDir, { recursive: true, force: true });
console.log(failures === 0 ? "\n✅ OPL2 synthesis checks passed." : `\n❌ ${failures} OPL2 check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
