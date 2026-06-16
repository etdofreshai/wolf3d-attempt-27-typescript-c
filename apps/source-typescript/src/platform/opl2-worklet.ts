// AudioWorklet processor that renders Wolf3D's AdLib (OPL2) audio on the audio thread.
//
// Why a worklet: the previous renderer was a ScriptProcessorNode, whose onaudioprocess fires on the
// MAIN thread. While the game renders a 3D frame (or the GC pauses), that callback runs late and the
// audio buffer underruns — heard as music/SFX "cut off". An AudioWorkletProcessor runs on the
// dedicated audio rendering thread, so it is immune to main-thread jank: the synth keeps producing
// samples on time no matter what the game loop is doing.
//
// The game loop (main thread) still produces the exact id_sd.c register-write stream and posts each
// frame's writes here; AdLibStream.schedule() releases them on the 700 Hz timer grid so note timing
// is sample-accurate. opl2.ts is pure (no browser deps) so it bundles straight into this worklet.
import { AdLibStream, type AdLibRegisterWrite } from "./opl2";

// AudioWorkletGlobalScope globals (not in the project's TS lib set).
declare const sampleRate: number;
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(
  name: string,
  ctor: new (options?: unknown) => AudioWorkletProcessor,
): void;

const ADLIB_GAIN = 1.6; // OPL2 output is scaled conservatively in opl2.ts; lift it to a usable level

type WorkletMessage =
  | { readonly type: "schedule"; readonly data: Int32Array }
  | { readonly type: "reset" }
  | { readonly type: "gain"; readonly value: number };

class Opl2Processor extends AudioWorkletProcessor {
  private readonly stream = new AdLibStream(sampleRate);
  private gain = ADLIB_GAIN;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<WorkletMessage>): void => {
      const msg = event.data;
      if (msg.type === "schedule") {
        const a = msg.data;
        const writes: AdLibRegisterWrite[] = new Array(a.length / 3);
        for (let k = 0; k < writes.length; k++) {
          writes[k] = { register: a[k * 3], value: a[k * 3 + 1], tick: a[k * 3 + 2] };
        }
        this.stream.schedule(writes);
      } else if (msg.type === "reset") {
        this.stream.reset();
      } else if (msg.type === "gain") {
        this.gain = msg.value;
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]?.[0];
    if (!out) {
      return true;
    }
    this.stream.render(out);
    const g = this.gain;
    for (let i = 0; i < out.length; i++) {
      const v = out[i] * g;
      out[i] = v > 1 ? 1 : v < -1 ? -1 : v;
    }
    return true; // keep the processor alive even with no inputs
  }
}

registerProcessor("opl2-processor", Opl2Processor);
