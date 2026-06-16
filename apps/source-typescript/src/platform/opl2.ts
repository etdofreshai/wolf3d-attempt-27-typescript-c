// Faithful OPL2 (Yamaha YM3812 / AdLib) emulator.
//
// Wolf3D's id_sd.c drives the AdLib card exclusively through `alOut(reg, val)` register
// writes (sound-effect instruments via SD_AlSetFXInst, IMF music via SD_ALSoundService, and
// per-tick frequency updates). The `check:opl` gate already proves the port's REGISTER STREAM
// is byte/hash-identical to DOS. This module is the missing half: it consumes those exact
// register writes and synthesizes PCM, so the browser actually plays AdLib music and SFX.
//
// The model is the documented OPL2 hardware: 9 two-operator FM channels, 18 operators, a
// 49716 Hz sample rate, log-sin + exp lookup synthesis, ADSR envelopes with key-scaling,
// 4 waveforms, feedback, and FM/additive connection. The log-sin and exp tables and the
// multiplier/key-scale tables are computed from the hardware formulas (not memorized binary
// blobs), so pitch is exact and the timbre matches the documented chip behavior.
//
// Register decode matches id_sd.c's constants exactly:
//   alChar=0x20 alScale=0x40 alAttack=0x60 alSus=0x80 alWave=0xe0
//   alFreqL=0xa0 alFreqH=0xb0 alFeedCon=0xc0 alEffects=0xbd
// Operator slot offsets (modulators 0,1,2,8,9,10,16,17,18 / carriers 3,4,5,11,12,13,19,20,21)
// are the standard OPL2 register->operator mapping (= id_sd.c `modifiers`/`carriers`).

export const OPL2_RATE = 49716; // YM3812 native sample rate (3.579545 MHz / 72)

const PHASE_BITS = 20; // phase accumulator width; waveform index = (phase >> 10) & 0x3ff
const PHASE_MASK = (1 << PHASE_BITS) - 1;

// MULT field -> 2x multiplier (MULT 0 = 0.5x -> value 1). Standard OPL2 table.
const MULT_X2 = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30];

// Key-scale-level: the standard OPL kslrom, indexed by the top 4 bits of the F-number.
const KSL_TABLE = [0, 32, 40, 45, 48, 51, 53, 55, 56, 58, 59, 60, 61, 62, 63, 64];
// KSL field 0..3 -> right-shift of the base attenuation. NOTE the OPL "bit swap": field 1 = 3 dB/oct
// (STRONGER than field 2 = 1.5 dB/oct), field 3 = 6 dB/oct. The previous [8,4,2,0] made field 1 the
// weakest (~0 dB/oct) — so KSL instruments stayed far too bright/loud at high pitch (off by up to 11 dB
// vs a faithful OPL2). Correct mapping is [8,1,2,0].
const KSL_SHIFT = [8, 1, 2, 0];

// Register->operator slot order: the 18 operators occupy register offsets
// 0,1,2,3,4,5, 8,9,10,11,12,13, 16,17,18,19,20,21. This maps an offset to a slot index 0..17.
const SLOT_FOR_OFFSET: Record<number, number> = {};
{
  const offsets = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21];
  offsets.forEach((off, i) => { SLOT_FOR_OFFSET[off] = i; });
}
// Channel c (0..8) uses modulator slot CH_MOD[c] and carrier slot CH_CAR[c].
const CH_MOD = [0, 1, 2, 6, 7, 8, 12, 13, 14];
const CH_CAR = [3, 4, 5, 9, 10, 11, 15, 16, 17];
// Which channel/role a given slot belongs to (for register decode).
const SLOT_CHANNEL = new Array<number>(18).fill(0);
const SLOT_IS_CARRIER = new Array<boolean>(18).fill(false);
for (let c = 0; c < 9; c++) {
  SLOT_CHANNEL[CH_MOD[c]] = c;
  SLOT_CHANNEL[CH_CAR[c]] = c;
  SLOT_IS_CARRIER[CH_CAR[c]] = true;
}

// --- computed synthesis tables -------------------------------------------------------------
// logsin[i] = round(-log2(sin((i+0.5) * pi/512)) * 256), the quarter-wave attenuation curve.
const LOGSIN = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  LOGSIN[i] = Math.round(-Math.log2(Math.sin((i + 0.5) * Math.PI / 512)) * 256);
}
// exp[i] = round((2^(i/256) - 1) * 1024); attenuation -> linear via (exp[x]|0x400)<<1 >> (x>>8).
const EXP = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  EXP[i] = Math.round((Math.pow(2, i / 256) - 1) * 1024);
}

// attenuation (0..0x1fff, 1/8 dB units) -> signed linear (~ -4084..4084).
function expLookup(attenuation: number): number {
  let att = attenuation;
  if (att < 0) att = 0;
  if (att > 0x1fff) att = 0x1fff;
  // The exp ROM is increasing, but attenuation increasing must DECREASE amplitude, so the low byte is
  // complemented (^0xff) before lookup — the standard OPL2/Nuked convention. Without it the att->linear
  // map is a sawtooth within each octave (non-monotonic), grossly distorting every operator's waveform.
  const mantissa = (EXP[(att & 0xff) ^ 0xff] | 0x400) << 1;
  return mantissa >> (att >> 8);
}

// waveform-shaped log-sin: returns {logAtt, negate} for a 10-bit phase index and waveform 0..3.
function waveLogSin(phase: number, waveform: number): { att: number; neg: boolean } {
  const p = phase & 0x3ff;
  switch (waveform) {
    case 0: { // full sine
      const neg = (p & 0x200) !== 0;
      const att = (p & 0x100) ? LOGSIN[(p & 0xff) ^ 0xff] : LOGSIN[p & 0xff];
      return { att, neg };
    }
    case 1: { // half sine (negative half silenced)
      if (p & 0x200) return { att: 0xfff, neg: false };
      const att = (p & 0x100) ? LOGSIN[(p & 0xff) ^ 0xff] : LOGSIN[p & 0xff];
      return { att, neg: false };
    }
    case 2: { // abs sine
      const att = (p & 0x100) ? LOGSIN[(p & 0xff) ^ 0xff] : LOGSIN[p & 0xff];
      return { att, neg: false };
    }
    default: { // 3: quarter sine (pulse-like)
      if (p & 0x100) return { att: 0xfff, neg: false };
      return { att: LOGSIN[p & 0xff], neg: false };
    }
  }
}

// Envelope generator phases.
const EG_OFF = 0, EG_ATTACK = 1, EG_DECAY = 2, EG_SUSTAIN = 3, EG_RELEASE = 4;
const MAX_ATT = 0x1ff; // 9-bit envelope attenuation (0 = loud, 0x1ff = silent)

interface Operator {
  // register-derived parameters
  am: boolean; vib: boolean; egType: boolean; ksr: boolean; mult: number;
  ksl: number; totalLevel: number; // tl in 1/8 dB units (0..63 *? -> stored *4)
  attackRate: number; decayRate: number; sustainLevel: number; releaseRate: number;
  waveform: number;
  // live state
  phase: number; // 20-bit accumulator
  egPhase: number;
  envAtt: number; // current attenuation (0..0x1ff, 9-bit)
  out0: number; out1: number; // last two outputs (for feedback averaging on modulator)
}

function makeOperator(): Operator {
  return {
    am: false, vib: false, egType: false, ksr: false, mult: 0,
    ksl: 0, totalLevel: 0, attackRate: 0, decayRate: 0, sustainLevel: 0, releaseRate: 0,
    waveform: 0,
    phase: 0, egPhase: EG_OFF, envAtt: MAX_ATT, out0: 0, out1: 0,
  };
}

interface Channel {
  fnum: number; // 10-bit
  block: number; // 3-bit
  keyOn: boolean;
  feedback: number; // 0..7
  connection: boolean; // false=FM, true=additive
}

function makeChannel(): Channel {
  return { fnum: 0, block: 0, keyOn: false, feedback: 0, connection: false };
}

// Envelope rate -> per-sample increment. The OPL EG advances on a global counter; we model the
// attenuation change per output sample using the documented rate->step relationship. `rate` is
// the effective 6-bit rate (0..63). Returns the attenuation delta to apply this sample (can be
// fractional, accumulated by the caller).
// OPL2 envelope-generator increment table (the Nuked-OPL / DOSBox model). Each EG step the chip adds
// EG_INC[row][(egTimer >> shift) & 7] to the operator's 9-bit attenuation; `row`/`shift` come from the
// effective 6-bit rate. This replaces the old 2^((rate-48)/4) heuristic, which ran envelopes ~4x too
// fast and collapsed the high rates together — the dominant cause of the "rougher" timbre.
const EG_INC: readonly (readonly number[])[] = [
  [0, 1, 0, 1, 0, 1, 0, 1], [0, 1, 0, 1, 1, 1, 0, 1], [0, 1, 1, 1, 0, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 2, 1, 1, 1, 2], [1, 2, 1, 2, 1, 2, 1, 2], [1, 2, 2, 2, 1, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 4, 2, 2, 2, 4], [2, 4, 2, 4, 2, 4, 2, 4], [2, 4, 4, 4, 2, 4, 4, 4],
  [4, 4, 4, 4, 4, 4, 4, 4],
];
// Decode an effective 6-bit rate to (shift, row): the EG advances every 2^shift samples and reads
// the 8-entry pattern EG_INC[row].
function egParams(rate: number): { shift: number; row: number } {
  const r = Math.min(63, Math.max(0, rate));
  const hi = r >> 2, lo = r & 3;
  if (hi < 12) return { shift: 12 - hi, row: lo };
  if (hi === 12) return { shift: 0, row: lo };
  if (hi === 13) return { shift: 0, row: 4 + lo };
  if (hi === 14) return { shift: 0, row: 8 + lo };
  return { shift: 0, row: 12 };
}

export class OPL2 {
  private readonly registers = new Uint8Array(256);
  private readonly operators: Operator[] = [];
  private readonly channels: Channel[] = [];
  private egTimer = 0; // global EG sample counter; egParams selects when each operator's EG advances
  // NOTE: the global AM (tremolo) and vibrato LFOs are not yet modeled — `op.am`/`op.vib` are
  // decoded from registers but their depth modulation is a future fidelity refinement.

  constructor() {
    for (let i = 0; i < 18; i++) this.operators.push(makeOperator());
    for (let c = 0; c < 9; c++) this.channels.push(makeChannel());
  }

  reset(): void {
    this.registers.fill(0);
    this.egTimer = 0;
    for (let i = 0; i < 18; i++) { this.operators[i] = makeOperator(); }
    for (let c = 0; c < 9; c++) this.channels[c] = makeChannel();
  }

  // Apply one AdLib register write (the same (reg, val) that id_sd.c's alOut emits).
  write(reg: number, value: number): void {
    const r = reg & 0xff;
    const v = value & 0xff;
    this.registers[r] = v;

    if (r === 0xbd) {
      // rhythm / AM depth / vib depth — rhythm mode not used by Wolf3D SFX/music; ignore drums.
      return;
    }

    // Operator-parameter registers occupy 0x20-0x35, 0x40-0x55, 0x60-0x75, 0x80-0x95, 0xe0-0xf5
    // (offset = r & 0x1f maps to the operator slot). NOTE: `r & 0xe0` cannot be used to classify
    // registers because 0xa0 (fnum-low) and 0xb0 (fnum-high/key-on) both yield 0xa0 — they must be
    // decoded by their explicit ranges instead.
    const isOpReg = (r >= 0x20 && r <= 0x35) || (r >= 0x40 && r <= 0x55) ||
      (r >= 0x60 && r <= 0x75) || (r >= 0x80 && r <= 0x95) || (r >= 0xe0 && r <= 0xf5);
    if (isOpReg) {
      const group = r & 0xe0; // 0x20 / 0x40 / 0x60 / 0x80 / 0xe0
      const slot = SLOT_FOR_OFFSET[r & 0x1f];
      if (slot === undefined) return;
      const op = this.operators[slot];
      switch (group) {
        case 0x20:
          op.am = (v & 0x80) !== 0;
          op.vib = (v & 0x40) !== 0;
          op.egType = (v & 0x20) !== 0; // 1 = sustaining
          op.ksr = (v & 0x10) !== 0;
          op.mult = v & 0x0f;
          break;
        case 0x40:
          op.ksl = (v >> 6) & 3;
          op.totalLevel = v & 0x3f; // 0..63, each step 0.75 dB
          break;
        case 0x60:
          op.attackRate = (v >> 4) & 0x0f;
          op.decayRate = v & 0x0f;
          break;
        case 0x80:
          op.sustainLevel = (v >> 4) & 0x0f;
          op.releaseRate = v & 0x0f;
          break;
        case 0xe0:
          op.waveform = v & 0x03; // OPL2: only 4 waveforms
          break;
      }
      return;
    }

    // Channel registers, decoded by explicit range. Channel = low nibble (0..8 valid).
    if (r >= 0xa0 && r <= 0xa8) {
      const channel = this.channels[r - 0xa0];
      channel.fnum = (channel.fnum & 0x300) | v;
    } else if (r >= 0xb0 && r <= 0xb8) {
      const ch = r - 0xb0;
      const channel = this.channels[ch];
      channel.fnum = (channel.fnum & 0xff) | ((v & 0x03) << 8);
      channel.block = (v >> 2) & 0x07;
      const newKeyOn = (v & 0x20) !== 0;
      if (newKeyOn && !channel.keyOn) this.keyOn(ch);
      else if (!newKeyOn && channel.keyOn) this.keyOff(ch);
      channel.keyOn = newKeyOn;
    } else if (r >= 0xc0 && r <= 0xc8) {
      const channel = this.channels[r - 0xc0];
      channel.feedback = (v >> 1) & 0x07;
      channel.connection = (v & 0x01) !== 0;
    }
  }

  private keyOn(ch: number): void {
    for (const slot of [CH_MOD[ch], CH_CAR[ch]]) {
      const op = this.operators[slot];
      op.egPhase = EG_ATTACK;
      op.phase = 0;
      // Attack starts from current attenuation toward 0.
    }
  }

  private keyOff(ch: number): void {
    for (const slot of [CH_MOD[ch], CH_CAR[ch]]) {
      const op = this.operators[slot];
      if (op.egPhase !== EG_OFF) op.egPhase = EG_RELEASE;
    }
  }

  private effectiveRate(rate4: number, op: Operator, block: number, fnumTop: boolean): number {
    if (rate4 === 0) return 0;
    const ksrOfs = op.ksr ? ((block << 1) | (fnumTop ? 1 : 0)) : (block >> 1);
    return Math.min(63, rate4 * 4 + ksrOfs);
  }

  // advance one operator's envelope by one sample; returns current attenuation (0..0x1ff).
  private advanceEnv(slot: number, block: number, fnumHi: boolean): number {
    const op = this.operators[slot];
    switch (op.egPhase) {
      case EG_OFF:
        return MAX_ATT;
      case EG_ATTACK: {
        const rate = this.effectiveRate(op.attackRate, op, block, fnumHi);
        if (op.attackRate >= 15) { op.envAtt = 0; op.egPhase = EG_DECAY; break; }
        const { shift, row } = egParams(rate);
        if ((this.egTimer & ((1 << shift) - 1)) === 0) {
          const delta = EG_INC[row][(this.egTimer >> shift) & 7];
          if (delta > 0) {
            // Attack: exponential approach toward 0 (louder). ~envAtt is negative, so this DECREASES
            // the attenuation by a fraction of the remaining distance, fast at first then easing in.
            op.envAtt += (~op.envAtt * delta) >> 3;
            if (op.envAtt <= 0) { op.envAtt = 0; op.egPhase = EG_DECAY; }
          }
        }
        break;
      }
      case EG_DECAY: {
        const rate = this.effectiveRate(op.decayRate, op, block, fnumHi);
        // Sustain level = 3 dB per step. envAtt enters the att domain as `envAtt << 3`, where 1 envAtt
        // unit = 8 att-units = 0.1875 dB, so 3 dB = 16 envAtt units => `sustainLevel << 4` (== Nuked's
        // eg_sl). The previous *32 gave 6 dB/step, settling every sustained note ~2x too quiet (thin music).
        const target = op.sustainLevel === 15 ? MAX_ATT : op.sustainLevel * 16;
        const { shift, row } = egParams(rate);
        if ((this.egTimer & ((1 << shift) - 1)) === 0) {
          op.envAtt += EG_INC[row][(this.egTimer >> shift) & 7]; // linear rise toward the sustain level
        }
        if (op.envAtt >= target) { op.envAtt = target; op.egPhase = op.egType ? EG_SUSTAIN : EG_RELEASE; }
        break;
      }
      case EG_SUSTAIN:
        // sustaining tone: hold until key-off (egType true). percussive handled in decay->release.
        break;
      case EG_RELEASE: {
        const rate = this.effectiveRate(op.releaseRate, op, block, fnumHi);
        const { shift, row } = egParams(rate);
        if ((this.egTimer & ((1 << shift) - 1)) === 0) {
          op.envAtt += EG_INC[row][(this.egTimer >> shift) & 7]; // linear rise toward silence
        }
        if (op.envAtt >= MAX_ATT) { op.envAtt = MAX_ATT; op.egPhase = EG_OFF; }
        break;
      }
    }
    if (op.envAtt < 0) op.envAtt = 0;
    if (op.envAtt > MAX_ATT) op.envAtt = MAX_ATT;
    return op.envAtt;
  }

  // compute one operator's signed output (~ -4084..4084), advancing its phase + envelope.
  private operatorOutput(slot: number, channel: Channel, modulation: number): number {
    const op = this.operators[slot];
    const fnumHi = (channel.fnum & 0x200) !== 0;
    const envAtt = this.advanceEnv(slot, channel.block, fnumHi);
    if (op.egPhase === EG_OFF && envAtt >= MAX_ATT) {
      op.out1 = op.out0; op.out0 = 0; return 0;
    }
    // phase increment
    const inc = ((channel.fnum << channel.block) * MULT_X2[op.mult]) >> 1;
    op.phase = (op.phase + inc) & PHASE_MASK;
    let phaseIndex = (op.phase >> 10) & 0x3ff;
    phaseIndex = (phaseIndex + modulation) & 0x3ff;

    const { att, neg } = waveLogSin(phaseIndex, op.waveform);
    // total attenuation = wave + envelope + totalLevel + KSL, in the exp-table att domain (256 = 6 dB).
    // KSL base = (kslrom[fnum_hi] << 2) - ((8 - block) << 5), clamped >=0 (no scaling in low octaves) —
    // the exact OPL/Nuked formula. >> KSL_SHIFT[field], then << 3 lands the per-octave attenuation at
    // {0, 3, 1.5, 6} dB for field {0,1,2,3} in this domain (verified vs the opl3 reference).
    let kslBase = (KSL_TABLE[(channel.fnum >> 6) & 0x0f] << 2) - ((8 - channel.block) << 5);
    if (kslBase < 0) kslBase = 0;
    const ksl = op.ksl === 0 ? 0 : (kslBase >> KSL_SHIFT[op.ksl]) << 3;
    const totalAtt = att + (envAtt << 3) + (op.totalLevel << 5) + ksl;
    let sample = expLookup(totalAtt);
    if (neg) sample = -sample;

    op.out1 = op.out0;
    op.out0 = sample;
    return sample;
  }

  // render `count` samples into `out` (Float32, ~[-1,1]), starting at `offset`.
  render(out: Float32Array, offset: number, count: number): void {
    for (let n = 0; n < count; n++) {
      this.egTimer = (this.egTimer + 1) | 0; // advance the EG clock once per chip sample
      let mix = 0;
      for (let c = 0; c < 9; c++) {
        const channel = this.channels[c];
        const modSlot = CH_MOD[c];
        const carSlot = CH_CAR[c];
        const modOp = this.operators[modSlot];
        // feedback: average of modulator's last two outputs, scaled by feedback amount.
        let fb = 0;
        if (channel.feedback > 0) {
          // feedback depth = (out0+out1) >> (9-fb); this matches the OPL feedback[fb] cycle table
          // (1/32..2 cycles) exactly. Pass it SIGNED — masking here would corrupt negative phase.
          fb = (modOp.out0 + modOp.out1) >> (9 - channel.feedback);
        }
        const modOut = this.operatorOutput(modSlot, channel, fb);
        let chOut: number;
        if (channel.connection) {
          // additive: both operators feed output directly.
          const carOut = this.operatorOutput(carSlot, channel, 0);
          chOut = modOut + carOut;
        } else {
          // FM: modulator phase-modulates the carrier. The modulator output (±~4080 ≈ ±1.0 full scale)
          // maps to ±4 cycles of phase swing (the OPL "toPhase=4" modulation index): in this 1024-per-
          // cycle phase domain that is modOut itself. Pass it SIGNED; operatorOutput masks after adding.
          const carOut = this.operatorOutput(carSlot, channel, modOut);
          chOut = carOut;
        }
        mix += chOut;
      }
      // Normalize by the operator count: 18 operators × ±4096 full-scale = 73728, so the full chip
      // output spans [-1,1] (the documented DOSBox/opl3 "/18" per-operator normalization). The old
      // /32768 ran ~2.25× hot, soft-clipping busy polyphony here before the output gain. Final listening
      // level is set by ADLIB_GAIN in audio.ts / opl2-worklet.ts (raised in step to keep loudness equal).
      out[offset + n] = Math.max(-1, Math.min(1, mix / 73728));
    }
  }

  // convenience: render a fresh Float32 buffer of `count` samples.
  renderBuffer(count: number): Float32Array {
    const buf = new Float32Array(count);
    this.render(buf, 0, count);
    return buf;
  }
}

// A browser-friendly streaming wrapper: holds an OPL2, accepts AdLib register writes (drained
// from id_sd.c's `alRegisterWrites`), and renders continuously at an arbitrary output sample
// rate by resampling from the chip's native 49716 Hz. Pure (no browser deps) so it can be unit
// tested; the AudioContext glue in platform/audio.ts only feeds it writes and pulls samples.
export interface AdLibRegisterWrite {
  readonly register: number;
  readonly value: number;
  // 700 Hz timer-service index (id_sd.c SDL_t0Service). schedule() groups writes by this tick and
  // releases each group on the 700 Hz grid; undefined means "apply with the current/previous group".
  readonly tick?: number;
}

// Wolf3D's AdLib timer ISR runs at 700 Hz; music (SDL_ALService) is serviced every interrupt and
// sound effects (SDL_ALSoundService) every 5th. Each interrupt's register writes are simultaneous,
// so we release one tick-group every OPL2_RATE/700 chip samples to reproduce the original cadence.
const AL_SERVICE_HZ = 700;
// Cap queued tick-groups so a long rAF stall (hidden tab, GC pause) that bursts a backlog of writes
// can't add unbounded latency — beyond this we fast-forward the oldest groups on the next render.
const MAX_PENDING_GROUPS = 256; // ~0.37 s of music at 700 Hz

export class AdLibStream {
  private readonly opl = new OPL2();
  private readonly ratio: number; // OPL samples consumed per output sample (~1.036 at 48 kHz)
  private fracPos = 0;
  private last = 0;
  private readonly one = new Float32Array(1);
  // Sample-accurate register scheduling: queued groups of writes (one per 700 Hz service tick) and
  // the chip-sample countdown until the next group is applied.
  private readonly pending: AdLibRegisterWrite[][] = [];
  private readonly oplSamplesPerService: number;
  private oplSamplesUntilNext = 0;

  constructor(outRate: number) {
    this.ratio = OPL2_RATE / Math.max(8000, outRate || OPL2_RATE);
    this.oplSamplesPerService = OPL2_RATE / AL_SERVICE_HZ; // ≈ 71 chip samples between 700 Hz ticks
    this.opl.reset();
  }

  reset(): void {
    this.opl.reset();
    this.fracPos = 0;
    this.last = 0;
    this.pending.length = 0;
    this.oplSamplesUntilNext = 0;
  }

  write(register: number, value: number): void {
    this.opl.write(register, value);
  }

  // Apply a batch of register writes immediately. Used by the gates/tests, which already interleave
  // service + render at the correct per-tick cadence (so "now" is the right time for them).
  feed(writes: AdLibRegisterWrite[]): void {
    for (let i = 0; i < writes.length; i++) this.opl.write(writes[i].register, writes[i].value);
  }

  // Enqueue a frame's worth of register writes for sample-accurate playback. The writes carry the
  // 700 Hz `tick` they were produced on (id_sd.c's timer-service index); consecutive writes sharing
  // a tick are one simultaneous group. render() then releases one group every 700 Hz, instead of
  // dumping the whole frame into a single instant (which collapses tempo + note onsets → garbling).
  schedule(writes: ArrayLike<AdLibRegisterWrite>): void {
    let groupStart = 0;
    for (let i = 0; i < writes.length; i++) {
      const next = writes[i + 1];
      const boundary = i + 1 >= writes.length || (next.tick ?? -1) !== (writes[i].tick ?? -1);
      if (boundary) {
        const group: AdLibRegisterWrite[] = [];
        for (let j = groupStart; j <= i; j++) group.push(writes[j]);
        this.pending.push(group);
        groupStart = i + 1;
      }
    }
  }

  private applyGroup(group: AdLibRegisterWrite[]): void {
    for (let i = 0; i < group.length; i++) this.opl.write(group[i].register, group[i].value);
  }

  // Drop the oldest queued groups (applying them) when the backlog exceeds MAX_PENDING_GROUPS, so a
  // burst after a stall doesn't accumulate latency. Applied instantly because they're already late.
  private catchUp(): void {
    while (this.pending.length > MAX_PENDING_GROUPS) {
      this.applyGroup(this.pending.shift() as AdLibRegisterWrite[]);
    }
  }

  // Render `out.length` output samples at the construction-time rate, resampling from 49716 Hz with
  // a zero-order hold (the chip rate is only ~3.6% above 48 kHz, so ZOH is transparent). Queued
  // register groups are released on the 700 Hz service grid as chip samples are produced.
  render(out: Float32Array): void {
    const one = this.one;
    this.catchUp();
    for (let i = 0; i < out.length; i++) {
      this.fracPos += this.ratio;
      while (this.fracPos >= 1) {
        this.fracPos -= 1;
        // Release scheduled register groups due at this chip sample (700 Hz grid).
        if (this.pending.length > 0) {
          this.oplSamplesUntilNext -= 1;
          while (this.oplSamplesUntilNext <= 0 && this.pending.length > 0) {
            this.applyGroup(this.pending.shift() as AdLibRegisterWrite[]);
            this.oplSamplesUntilNext += this.oplSamplesPerService;
          }
        }
        this.opl.render(one, 0, 1);
        this.last = one[0];
      }
      out[i] = this.last;
    }
  }
}
