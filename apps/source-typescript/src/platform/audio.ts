import {
  SoundMode,
  SoundNumber,
  SoundTable,
  type AlRegisterWrite,
  alRegisterWrites,
  pcLengthLeft,
} from "../WOLFSRC/ID_SD.C";
import { sdm_AdLib, sdm_PC } from "../WOLFSRC/ID_SD.H";
import { AdLibStream } from "./opl2";
// Vite bundles the worklet (and its opl2.ts import) into a self-contained script and hands us its
// URL; AudioContext.audioWorklet.addModule() loads it onto the audio thread.
import oplWorkletUrl from "./opl2-worklet.ts?worker&url";

const PC_SERVICE_HZ = 140;
const PC_TIMER_HZ = 1192030;
const PC_SOUND_MULTIPLIER = 60;
const PC_GAIN = 0.08;
const ADLIB_BUFFER = 1024; // ScriptProcessor block size (~21 ms at 48 kHz)
const ADLIB_GAIN = 1.6; // OPL2 output is scaled conservatively in opl2.ts; lift it to a usable level
const DIGI_HZ = 7000; // Wolf3D digitized sounds are unsigned 8-bit PCM at ~7 kHz (Web Audio resamples)
const DIGI_GAIN = 0.85; // headroom so a digi sound mixed over AdLib FM doesn't clip
const MAX_PENDING_WRITES = 8192; // cap on writes buffered while the worklet module loads (~12s of music)

// Pack register writes into a transferable Int32Array of (register, value, tick) triples for posting
// to the worklet (avoids structured-cloning an array of objects every frame).
function packWrites(writes: ArrayLike<AlRegisterWrite>): Int32Array {
  const a = new Int32Array(writes.length * 3);
  for (let i = 0; i < writes.length; i++) {
    const w = writes[i];
    a[i * 3] = w.register;
    a[i * 3 + 1] = w.value;
    a[i * 3 + 2] = w.tick ?? -1;
  }
  return a;
}

// Post a batch of writes to the worklet, transferring the packed buffer (zero-copy).
function postSchedule(port: MessagePort, writes: ArrayLike<AlRegisterWrite>): void {
  const data = packWrites(writes);
  port.postMessage({ type: "schedule", data }, [data.buffer]);
}

type BrowserAudioWindow = Window & typeof globalThis & {
  readonly webkitAudioContext?: typeof AudioContext;
};

type SoundTableEntry = {
  readonly length: number;
  readonly data?: ArrayLike<number>;
};

export class BrowserWolf3DAudio {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private lastSoundKey = "";
  private adlib: AdLibStream | null = null; // only used by the ScriptProcessor fallback path
  private adlibNode: ScriptProcessorNode | null = null;
  private adlibPort: MessagePort | null = null; // worklet message port (preferred audio-thread path)
  private adlibSetupStarted = false;
  // Register writes produced before the async worklet finishes loading; flushed once it's ready so
  // the music's instrument-setup writes aren't lost. Capped so a slow load can't grow it unbounded.
  private pendingWrites: AlRegisterWrite[] = [];
  private digiSource: AudioBufferSourceNode | null = null; // current one-shot digitized sound

  resume(): void {
    const context = this.ensureContext();
    if (!context) {
      return;
    }
    this.ensureAdLibNode(context);
    void context.resume().catch(() => undefined);
  }

  syncFromSoundState(force = false): void {
    if (SoundMode !== sdm_PC || SoundNumber <= 0 || pcLengthLeft <= 0) {
      return;
    }
    this.playPcSound(SoundNumber, force);
  }

  // Hand the AdLib register writes id_sd.c produced this frame to the OPL2 emulator. Called once per
  // game frame, but the writes are NOT applied all at once: each carries the 700 Hz timer-service
  // tick it was emitted on, and AdLibStream.schedule() releases each tick-group on the 700 Hz grid
  // as the ScriptProcessor renders — preserving sub-frame note timing (DOS' timer-ISR cadence)
  // instead of collapsing ~12 services/frame into a single instant (which garbled tempo + onsets).
  // Writes are always cleared (even before audio starts) so the queue can't grow unbounded.
  serviceAdLib(): void {
    if (alRegisterWrites.length === 0) {
      return;
    }
    if (SoundMode === sdm_AdLib) {
      if (this.adlibPort) {
        // Worklet path: pack the frame's writes into a transferable Int32Array (reg, val, tick
        // triples) and post them to the audio thread, where schedule() releases them at 700 Hz.
        postSchedule(this.adlibPort, alRegisterWrites);
      } else if (this.adlib) {
        this.adlib.schedule(alRegisterWrites); // ScriptProcessor fallback (main-thread synth)
      } else if (this.pendingWrites.length < MAX_PENDING_WRITES) {
        // Worklet still loading — buffer so the instrument-setup writes survive the brief load.
        for (let i = 0; i < alRegisterWrites.length; i++) this.pendingWrites.push(alRegisterWrites[i]);
      }
    }
    alRegisterWrites.length = 0;
  }

  // Play a digitized sound (unsigned 8-bit PCM @ ~7 kHz) as a one-shot Web Audio buffer. Driven by
  // the ID_SD digiPlaybackHook when DigiMode (SoundBlaster) routes a sound to its digitized version;
  // mixes alongside the continuous AdLib ScriptProcessor (non-digi sounds still play FM).
  playDigi(pcm: Uint8Array): void {
    const context = this.ensureContext();
    if (!context || pcm.length === 0) {
      return;
    }
    // DOS plays exactly one digitized sound at a time (a new one stops the previous), so cut off
    // any still-playing digi node before starting this one.
    if (this.digiSource) {
      try {
        this.digiSource.stop();
      } catch { /* already stopped */ }
      this.digiSource = null;
    }
    const buffer = context.createBuffer(1, pcm.length, DIGI_HZ);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) {
      channel[i] = (pcm[i] - 128) / 128; // unsigned 8-bit (128 = silence) → [-1, 1]
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = DIGI_GAIN;
    source.connect(gain);
    gain.connect(context.destination);
    source.onended = (): void => {
      if (this.digiSource === source) {
        this.digiSource = null;
      }
    };
    this.digiSource = source;
    source.start();
  }

  private ensureAdLibNode(context: AudioContext): void {
    if (this.adlibSetupStarted) {
      return;
    }
    this.adlibSetupStarted = true;
    // Preferred path: render the OPL2 on the audio thread via an AudioWorklet, so 3D-frame jank and
    // GC pauses on the main thread can't underrun the audio ("cut off"). Falls back to a
    // ScriptProcessor if the worklet can't be loaded (older browsers / addModule failure).
    const audioWorkletWindow = window as BrowserAudioWindow;
    if (audioWorkletWindow.AudioWorkletNode && context.audioWorklet) {
      context.audioWorklet
        .addModule(oplWorkletUrl)
        .then(() => {
          const node = new AudioWorkletNode(context, "opl2-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
          });
          node.connect(context.destination);
          this.adlibPort = node.port;
          // Flush any writes produced while the module was loading.
          if (this.pendingWrites.length > 0) {
            postSchedule(this.adlibPort, this.pendingWrites);
            this.pendingWrites = [];
          }
        })
        .catch(() => {
          this.startScriptProcessorFallback(context);
        });
    } else {
      this.startScriptProcessorFallback(context);
    }
  }

  private startScriptProcessorFallback(context: AudioContext): void {
    if (this.adlibNode) {
      return;
    }
    this.adlib = new AdLibStream(context.sampleRate);
    if (this.pendingWrites.length > 0) {
      this.adlib.schedule(this.pendingWrites);
      this.pendingWrites = [];
    }
    // ScriptProcessor is deprecated and runs on the main thread (so it can underrun under load), but
    // it's the universally-available fallback and shares the OPL2 state with the game loop.
    const node = context.createScriptProcessor(ADLIB_BUFFER, 0, 1);
    node.onaudioprocess = (event: AudioProcessingEvent): void => {
      const out = event.outputBuffer.getChannelData(0);
      if (this.adlib) {
        this.adlib.render(out);
        for (let i = 0; i < out.length; i++) {
          out[i] = Math.max(-1, Math.min(1, out[i] * ADLIB_GAIN));
        }
      } else {
        out.fill(0);
      }
    };
    node.connect(context.destination);
    this.adlibNode = node;
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Already stopped.
      }
    }
    this.source = null;
    this.lastSoundKey = "";
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }
    const audioWindow = window as BrowserAudioWindow;
    const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }
    this.context = new AudioContextCtor();
    return this.context;
  }

  private playPcSound(soundNumber: number, force: boolean): void {
    const sound = SoundTable[soundNumber] as SoundTableEntry | null;
    if (!sound?.data || sound.length <= 0) {
      return;
    }

    const samples = bytesFromArrayLike(sound.data, sound.length);
    if (!samples.length) {
      return;
    }

    const key = `${soundNumber}:${samples.length}:${samples[0]}:${samples[samples.length - 1]}`;
    if (!force && key === this.lastSoundKey) {
      return;
    }
    this.lastSoundKey = key;

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    this.stopSource();
    const source = context.createBufferSource();
    source.buffer = createPcSpeakerBuffer(context, samples);
    source.connect(context.destination);
    source.onended = (): void => {
      if (this.source === source) {
        this.source = null;
        this.lastSoundKey = "";
      }
    };
    this.source = source;
    source.start();
  }

  private stopSource(): void {
    if (!this.source) {
      return;
    }
    try {
      this.source.stop();
    } catch {
      // Already stopped.
    }
    this.source = null;
  }
}

function bytesFromArrayLike(data: ArrayLike<number>, maxLength: number): Uint8Array {
  const length = Math.min(data.length, Math.max(0, Math.trunc(maxLength)));
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = data[i] & 0xff;
  }
  return bytes;
}

function createPcSpeakerBuffer(context: AudioContext, samples: Uint8Array): AudioBuffer {
  const framesPerPcSample = Math.max(1, Math.round(context.sampleRate / PC_SERVICE_HZ));
  const frameCount = Math.max(1, samples.length * framesPerPcSample);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let phase = 0;

  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
    const pcSample = samples[sampleIndex];
    const frequency = pcSample ? PC_TIMER_HZ / (pcSample * PC_SOUND_MULTIPLIER) : 0;
    for (let frame = 0; frame < framesPerPcSample; frame++) {
      const outputIndex = (sampleIndex * framesPerPcSample) + frame;
      if (outputIndex >= channel.length) {
        break;
      }
      if (!frequency) {
        channel[outputIndex] = 0;
        continue;
      }
      phase = (phase + (frequency / context.sampleRate)) % 1;
      channel[outputIndex] = phase < 0.5 ? PC_GAIN : -PC_GAIN;
    }
  }

  return buffer;
}
