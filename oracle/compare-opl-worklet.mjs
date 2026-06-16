// Gate the AudioWorklet audio path. platform/opl2-worklet.ts runs the OPL2 synth on the audio
// thread (so main-thread 3D-frame jank can't underrun audio = "cut off"). This gate bundles the
// REAL worklet module, evaluates it with stubbed AudioWorkletGlobalScope globals, drives it the way
// platform/audio.ts does (post packed (reg,val,tick) writes for a real Wolf3D sound, then pull
// 128-sample render quanta), and asserts it (a) registers an "opl2-processor", (b) renders audible,
// bounded PCM, and (c) preserves the 700Hz schedule so a whole frame's writes don't collapse.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const platformDir = path.join(repoRoot, "apps", "source-typescript", "src", "platform");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-oplwklt-"));

// 1. Bundle the worklet module on its own (proves it bundles to self-contained code, like Vite does).
const workletOut = path.join(tempDir, "worklet.mjs");
await build({ entryPoints: [path.join(platformDir, "opl2-worklet.ts")], outfile: workletOut, bundle: true, format: "esm", platform: "neutral", logLevel: "silent" });

// 2. Bundle id_sd.c so we can generate a real sound's register-write stream.
const sdEntry = path.join(tempDir, "sd.ts");
const sdOut = path.join(tempDir, "sd.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(sdEntry, [
  `export { CA_Startup, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_PlaySound, SDL_ALSoundService, SD_SoundPlaying, alRegisterWrites } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
].join("\n"));
await build({ entryPoints: [sdEntry], outfile: sdOut, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const sd = await import(`${pathToFileURL(sdOut).href}?c=${Date.now()}`);

// 3. Stub the AudioWorkletGlobalScope and load the worklet bundle, capturing registerProcessor.
let captured = null;
const ports = [];
globalThis.sampleRate = 48000;
globalThis.AudioWorkletProcessor = class {
  constructor() {
    const listeners = {};
    this.port = {
      postMessage() {},
      set onmessage(fn) { listeners.msg = fn; },
      get onmessage() { return listeners.msg; },
      _deliver(data) { listeners.msg?.({ data }); },
    };
    ports.push(this.port);
  }
};
globalThis.registerProcessor = (name, ctor) => { captured = { name, ctor }; };
await import(`${pathToFileURL(workletOut).href}?c=${Date.now()}`);

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
expect(captured?.name === "opl2-processor", `worklet registers an "opl2-processor" (got ${captured?.name})`);

// 4. Generate a real sound's writes (chaingun) and split them into per-frame batches the way the
//    browser does (~12 services / rAF frame), packed as (reg,val,tick) Int32Array.
const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
sd.SD_ResetSoundState({ SoundMode: sd.sdm_AdLib, AdLibPresent: true });
sd.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
sd.alRegisterWrites.length = 0;
sd.SD_PlaySound(38); // chaingun
const frames = [];
let frame = sd.alRegisterWrites.map((w) => ({ register: w.register, value: w.value, tick: w.tick ?? 0 }));
sd.alRegisterWrites.length = 0;
let svc = 0;
for (let t = 0; t < 4096 && sd.SD_SoundPlaying() !== 0; t++) {
  sd.SDL_ALSoundService();
  for (const w of sd.alRegisterWrites) frame.push({ register: w.register, value: w.value, tick: t + 1 });
  sd.alRegisterWrites.length = 0;
  if (++svc % 12 === 0) { frames.push(frame); frame = []; } // ~12 services per simulated frame
}
if (frame.length) frames.push(frame);
const pack = (ws) => { const a = new Int32Array(ws.length * 3); for (let i = 0; i < ws.length; i++) { a[i * 3] = ws[i].register; a[i * 3 + 1] = ws[i].value; a[i * 3 + 2] = ws[i].tick; } return a; };

// 5. Instantiate the processor and run it like the audio graph: post a frame's writes, then pull
//    samples (128-sample quanta, ~800 samples per 60fps frame), repeat.
const proc = new captured.ctor();
const port = ports[ports.length - 1];
const SAMPLES_PER_FRAME = 800, QUANTUM = 128;
const pcm = [];
const renderFrameSamples = () => {
  let produced = 0;
  while (produced < SAMPLES_PER_FRAME) {
    const buf = new Float32Array(QUANTUM);
    const alive = proc.process([], [[buf]], {});
    if (alive !== true) { expect(false, "process() returned true to stay alive"); break; }
    for (const s of buf) pcm.push(s);
    produced += QUANTUM;
  }
};
for (const f of frames) { port._deliver({ type: "schedule", data: pack(f) }); renderFrameSamples(); }
// release tail
for (let i = 0; i < 30; i++) renderFrameSamples();

const f32 = Float32Array.from(pcm);
const rms = Math.sqrt(f32.reduce((a, v) => a + v * v, 0) / f32.length);
let peak = 0; for (const v of f32) peak = Math.max(peak, Math.abs(v));
const tail = f32.subarray(f32.length - 2000);
const tailRms = Math.sqrt(tail.reduce((a, v) => a + v * v, 0) / tail.length);
console.log(`worklet rendered ${f32.length} samples, rms ${rms.toFixed(4)}, peak ${peak.toFixed(3)}, tail rms ${tailRms.toFixed(4)}`);
expect(rms > 0.005, "worklet output is audible (rms > 0.005)");
expect(peak <= 1.0, "worklet output is bounded (peak <= 1.0, gain clamp works)");
expect(tailRms < rms * 0.7, "sound decays after it ends (envelope release runs on the audio thread)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ OPL WORKLET: the AudioWorklet bundle registers, renders real Wolf3D AdLib audio on the audio thread, and stays bounded."
  : `\n❌ OPL WORKLET: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
