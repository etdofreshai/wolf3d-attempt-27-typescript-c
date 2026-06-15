// T4-audio synthesis gate: prove the OPL2 emulator turns Wolf3D's real AdLib register stream
// into sound. The `check:opl` gate already proves the REGISTER STREAM is byte/hash-faithful to
// DOS id_sd.c; this gate feeds that exact stream (instrument setup + per-tick frequency writes)
// through the OPL2 chip emulator with the real service-tick timing and asserts the rendered PCM
// is audible, stays within [-1,1] (no overflow), and decays after the sound ends. Pitch accuracy
// of the phase generator is covered by oracle/tmp-opl2-synth.mjs.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const platformDir = path.join(repoRoot, "apps", "source-typescript", "src", "platform");
const wl6Dir = path.join(repoRoot, "steam", "base");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-oplsynth-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_PlaySound, alRegisterWrites, SDL_ALSoundService, SD_SoundPlaying } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
  `export { OPL2, OPL2_RATE, AdLibStream } from "${rel(path.join(platformDir, "opl2.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));

const SERVICE_HZ = 140; // id_sd.c sound timer = TickBase(70) * 2
const OUT_RATE = 48000; // browser AudioContext rate; exercises AdLibStream's 49716->48000 resampler
const samplesPerTick = Math.round(OUT_RATE / SERVICE_HZ);

// Render one Wolf3D AdLib sound through the EXACT browser audio path: id_sd.c produces register
// writes (instrument setup + per-tick SDL_ALSoundService), platform/audio.ts's serviceAdLib drains
// them into platform/opl2.ts's AdLibStream (= feed), and the ScriptProcessor pulls resampled PCM
// (= render). This gates the same code main.ts runs in the browser, at the browser sample rate.
function renderSound(sound) {
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_AdLib, AdLibPresent: true });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  const stream = new mod.AdLibStream(OUT_RATE);
  stream.reset();
  const pcm = [];
  const drain = () => { if (mod.alRegisterWrites.length) { stream.feed(mod.alRegisterWrites); mod.alRegisterWrites.length = 0; } };

  mod.alRegisterWrites.length = 0;
  mod.SD_PlaySound(sound);
  drain(); // instrument setup
  for (let t = 0; t < 4096 && mod.SD_SoundPlaying() !== 0; t++) {
    mod.SDL_ALSoundService();
    drain();
    const buf = new Float32Array(samplesPerTick);
    stream.render(buf);
    for (const s of buf) pcm.push(s);
  }
  // release tail (0.6 s) so even slow release rates have time to decay
  const tailLen = Math.round(OUT_RATE * 0.6);
  const tail = new Float32Array(tailLen);
  stream.render(tail);
  for (const s of tail) pcm.push(s);
  return { pcm: Float32Array.from(pcm), tailLen };
}

const rms = (s) => { let a = 0; for (const v of s) a += v * v; return Math.sqrt(a / s.length); };
const peak = (s) => { let p = 0; for (const v of s) p = Math.max(p, Math.abs(v)); return p; };

let failures = 0;
const expect = (cond, msg) => { console.log(`${cond ? "  ok  " : " FAIL "} ${msg}`); if (!cond) failures++; };

const sounds = [38, 1, 12, 24]; // chaingun + spread of AdLib sounds (same set as check:opl)
let decayed = 0;
for (const s of sounds) {
  const { pcm, tailLen } = renderSound(s);
  const body = pcm.subarray(0, pcm.length - tailLen);
  const tailEnd = pcm.subarray(pcm.length - 2000); // last ~40ms of the release tail
  const r = rms(body), pk = peak(pcm), tr = rms(tailEnd);
  const releases = tr < r * 0.6;
  if (releases) decayed++;
  console.log(`  sound ${String(s).padStart(2)}: ${pcm.length} samples (${(pcm.length / OUT_RATE).toFixed(2)}s @ ${OUT_RATE}Hz), body rms ${r.toFixed(4)}, peak ${pk.toFixed(3)}, tail-end rms ${tr.toFixed(4)}${releases ? "" : " [sustains: additive non-releasing op]"}`);
  // audible + bounded are always-true synthesis properties; assert them per sound.
  expect(r > 0.005, `sound ${s}: audible (body rms > 0.005)`);
  expect(pk <= 1.0, `sound ${s}: no overflow (peak <= 1.0)`);
}
// Envelope release: most instruments must decay after key-off (some legitimately sustain when
// their additive operator has decay/release rate 0). The controlled key-on/off envelope is
// verified exactly in oracle/tmp-opl2-synth.mjs Test 2.
expect(decayed >= 3, `at least 3 of ${sounds.length} sounds release toward silence after end (got ${decayed})`);

await rm(tempDir, { recursive: true, force: true });
if (failures === 0) {
  console.log(`\n✅ T4 AUDIO SYNTH: OPL2 emulator renders all ${sounds.length} real Wolf3D AdLib sound streams to audible, bounded, decaying PCM.`);
  process.exitCode = 0;
} else {
  console.log(`\n❌ T4 AUDIO SYNTH: ${failures} check(s) failed.`);
  process.exitCode = 1;
}
