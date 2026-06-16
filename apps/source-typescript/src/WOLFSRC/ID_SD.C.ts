import { ChunksInFile, PMSoundStart, PM_GetPage, PM_GetSoundPage } from "./ID_PM.C";
import { readU16LE, readU32LE } from "./TS_C";
import {
  TickBase,
  sdm_AdLib,
  sdm_Off,
  sdm_PC,
  sds_Off,
  sds_PC,
  sds_SoundBlaster,
  sds_SoundSource,
  smm_AdLib,
  smm_Off,
  type SDMode,
  type SDSMode,
  type SMMode,
  type SoundCommon,
} from "./ID_SD.H";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_SD.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_SD.C";
export const WOLFSRC_FUNCTIONS = [
  "alOut",
  "SD_Default",
  "SD_FadeOutMusic",
  "SD_MusicOff",
  "SD_MusicOn",
  "SD_MusicPlaying",
  "SD_PlayDigitized",
  "SD_PlaySound",
  "SD_Poll",
  "SD_PositionSound",
  "SD_SetDigiDevice",
  "SD_SetMusicMode",
  "SD_SetPosition",
  "SD_SetSoundMode",
  "SD_SetUserHook",
  "SD_Shutdown",
  "SD_SoundPlaying",
  "SD_StartMusic",
  "SD_Startup",
  "SD_StopDigitized",
  "SD_StopSound",
  "SD_WaitSoundDone",
  "SDL_ALPlaySound",
  "SDL_ALService",
  "SDL_AlSetFXInst",
  "SDL_ALSoundService",
  "SDL_ALStopSound",
  "SDL_CheckSB",
  "SDL_CheckSS",
  "SDL_CleanAL",
  "SDL_CleanDevice",
  "SDL_DetectAdLib",
  "SDL_DetectSoundBlaster",
  "SDL_DetectSoundSource",
  "SDL_DigitizedDone",
  "SDL_LoadDigiSegment",
  "SDL_PCPlaySample",
  "SDL_PCPlaySound",
  "SDL_PCService",
  "SDL_PCStopSample",
  "SDL_PCStopSound",
  "SDL_PlayDigiSegment",
  "SDL_PositionSBP",
  "SDL_SBPlaySample",
  "SDL_SBPlaySeg",
  "SDL_SBService",
  "SDL_SBSetDMA",
  "SDL_SBStopSample",
  "SDL_SetInstrument",
  "SDL_SetIntsPerSec",
  "SDL_SetTimer0",
  "SDL_SetTimerSpeed",
  "SDL_SetupDigi",
  "SDL_ShutAL",
  "SDL_ShutDevice",
  "SDL_ShutPC",
  "SDL_ShutSB",
  "SDL_ShutSS",
  "SDL_SSPlaySample",
  "SDL_SSService",
  "SDL_SSStopSample",
  "SDL_StartAL",
  "SDL_StartDevice",
  "SDL_StartSB",
  "SDL_StartSS",
  "SDL_t0Service"
] as const;

export const LASTSOUND = 87;
export const STARTPCSOUNDS = 0;
export const STARTADLIBSOUNDS = 87;
export const STARTDIGISOUNDS = 174;
export const STARTMUSIC = 261;

const sqMaxTracks = 10;
const timerBaseHz = 1192030;
const alChar = 0x20;
const alScale = 0x40;
const alAttack = 0x60;
const alSus = 0x80;
const alWave = 0xe0;
const alFreqL = 0xa0;
const alEffects = 0xbd;
const alFreqH = 0xb0;
const alFeedCon = 0xc0;

const carriers = [3, 4, 5, 11, 12, 13, 19, 20, 21] as const;
const modifiers = [0, 1, 2, 8, 9, 10, 16, 17, 18] as const;
const pcarriers = [19, 0xff, 0xff, 0xff, 0xff] as const;
const pmodifiers = [16, 17, 18, 20, 21] as const;

export let SoundSourcePresent = false;
export let AdLibPresent = false;
export let SoundBlasterPresent = false;
export let SBProPresent = false;
export let NeedsDigitized = false;
export let NeedsMusic = false;
export let SoundPositioned = false;
export let SoundMode: SDMode = sdm_Off;
export let MusicMode: SMMode = smm_Off;
export let DigiMode: SDSMode = sds_Off;
export let TimeCount = 0;
export let HackCount = 0;
export const SoundTable: Array<SoundCommon | null> = new Array(LASTSOUND).fill(null);
export const DigiMap = new Int16Array(LASTSOUND).fill(-1);

export let nextsoundpos = false;
export let SoundNumber = 0;
export let DigiNumber = 0;
export let SoundPriority = 0;
export let DigiPriority = 0;
export let LeftPosition = 0;
export let RightPosition = 0;
export let DigiPlaying = false;
export let NumDigi = 0;
// Flattened (startPage, lengthBytes) pairs per digitized sound, built from VSWAP by SDL_SetupDigi.
export let DigiList: number[] = [];
const PMPAGESIZE = 4096; // VSWAP page size (digi sounds span ceil(len/PMPAGESIZE) consecutive pages)
// Browser bridge: when set, SD_PlaySound hands a digi sound's assembled PCM to this hook (Web Audio)
// instead of relying on the inert DOS DMA model. Null in headless/gate contexts (DigiMode stays off).
let digiPlaybackHook: ((pcm: Uint8Array, leftpos: number, rightpos: number) => void) | null = null;
export function SD_SetDigiPlaybackHook(fn: ((pcm: Uint8Array, leftpos: number, rightpos: number) => void) | null): void {
  digiPlaybackHook = fn;
}
export let sqActive = false;
export let alFXReg = 0;
export let TimerRate = TickBase * 2;
export let Timer0Speed = Math.trunc(timerBaseHz / (TickBase * 2));
export let TimerDivisor = Timer0Speed;
export let SD_Started = false;
export let pcLengthLeft = 0;
export let pcSampleLengthLeft = 0;
export let pcLastSample = -1;
export let pcSoundCursor = 0;
export let pcSampleActive = false;
export let alLengthLeft = 0;
export let alTimeCount = 0;
// AdLib IMF music ("sqHack") state — the song's event stream and playback cursor (SD_StartMusic /
// SDL_ALService). Each event is 4 bytes: reg, val, delay(word); delays are in alTimeCount (700 Hz)
// units. The stream loops when exhausted.
let sqHackData: Uint8Array | null = null;
let sqHackPtr = 0; // byte offset into sqHackData
let sqHackLen = 0; // bytes remaining in the current pass
let sqHackSeqLen = 0; // total length, for looping
let sqHackTime = 0;
export let alBlock = 0;
export let alSoundCursor = 0;
export let DigiLeft = 0;
export let DigiPage = 0;
export let DigiNextLen = 0;
export let DigiMissed = false;
export let DigiLastSegment = false;
export let DigiLastSegmentLength = 0;
export let DigiLastStart = 1;
export let DigiLastEnd = 0;
export let sbSamplePlaying = false;
export let ssSamplePlaying = false;

let pcSoundActive = false;
let alSoundActive = false;
let soundSourceActive = false;
let SoundUserHook: (() => void) | null = null;
let pcSoundData: Uint8Array | null = null;
let pcSampleData: Uint8Array | null = null;
let alSoundData: Uint8Array | null = null;
let digiCurrentSegment: Uint8Array | null = null;
let digiNextSegment: Uint8Array | null = null;
let timerServiceCount = 0;

interface Instrument {
  readonly mChar?: number;
  readonly cChar?: number;
  readonly mScale?: number;
  readonly cScale?: number;
  readonly mAttack?: number;
  readonly cAttack?: number;
  readonly mSus?: number;
  readonly cSus?: number;
  readonly mWave?: number;
  readonly cWave?: number;
  readonly nConn?: number;
}

type SoundWithData = SoundCommon & {
  readonly data?: ArrayLike<number>;
  readonly inst?: Instrument;
  readonly block?: number;
};

const alZeroInst: Required<Instrument> = {
  mChar: 0,
  cChar: 0,
  mScale: 0,
  cScale: 0,
  mAttack: 0,
  cAttack: 0,
  mSus: 0,
  cSus: 0,
  mWave: 0,
  cWave: 0,
  nConn: 0,
};

const alDefaultInst: Required<Instrument> = {
  mChar: 1,
  cChar: 1,
  mScale: 0x10,
  cScale: 0x10,
  mAttack: 0xf0,
  cAttack: 0xf0,
  mSus: 0x77,
  cSus: 0x77,
  mWave: 0,
  cWave: 0,
  nConn: 0,
};

export interface AlRegisterWrite {
  readonly register: number;
  readonly value: number;
}

export interface SoundModeSummary {
  readonly SoundMode: SDMode;
  readonly MusicMode: SMMode;
  readonly DigiMode: SDSMode;
  readonly NeedsDigitized: boolean;
  readonly NeedsMusic: boolean;
  readonly SoundPositioned: boolean;
  readonly SoundNumber: number;
  readonly SoundPriority: number;
  readonly DigiNumber: number;
  readonly DigiPriority: number;
  readonly DigiPlaying: boolean;
  readonly NumDigi: number;
  readonly LeftPosition: number;
  readonly RightPosition: number;
  readonly nextsoundpos: boolean;
  readonly sqActive: boolean;
  readonly TimerRate: number;
  readonly Timer0Speed: number;
  readonly TimerDivisor: number;
  readonly TimeCount: number;
  readonly HackCount: number;
  readonly pcSoundActive: boolean;
  readonly pcLengthLeft: number;
  readonly pcSampleActive: boolean;
  readonly pcSampleLengthLeft: number;
  readonly pcLastSample: number;
  readonly alSoundActive: boolean;
  readonly alLengthLeft: number;
  readonly alTimeCount: number;
  readonly DigiLeft: number;
  readonly DigiNextLen: number;
  readonly DigiMissed: boolean;
  readonly DigiLastSegment: boolean;
  readonly DigiLastSegmentLength: number;
  readonly DigiCurrentSegmentLength: number;
  readonly sbSamplePlaying: boolean;
  readonly ssSamplePlaying: boolean;
  readonly soundSourceActive: boolean;
  readonly hasSoundUserHook: boolean;
}

export interface SoundResetOptions {
  readonly AdLibPresent?: boolean;
  readonly SoundBlasterPresent?: boolean;
  readonly SoundSourcePresent?: boolean;
  readonly SoundMode?: SDMode;
  readonly MusicMode?: SMMode;
  readonly DigiMode?: SDSMode;
}

export interface SoundPositionSummary {
  readonly left: number;
  readonly right: number;
  readonly appliedToSoundBlaster: boolean;
}

export interface SoundTableLoadSummary {
  readonly mode: SDMode;
  readonly tableoffset: number;
  readonly loaded: number;
  readonly missing: number;
  readonly bytes: number;
}

export const alRegisterWrites: AlRegisterWrite[] = [];

export function SD_DebugState(): SoundModeSummary {
  return {
    SoundMode,
    MusicMode,
    DigiMode,
    NeedsDigitized,
    NeedsMusic,
    SoundPositioned,
    SoundNumber,
    SoundPriority,
    DigiNumber,
    DigiPriority,
    DigiPlaying,
    NumDigi,
    LeftPosition,
    RightPosition,
    nextsoundpos,
    sqActive,
    TimerRate,
    Timer0Speed,
    TimerDivisor,
    TimeCount,
    HackCount,
    pcSoundActive,
    pcLengthLeft,
    pcSampleActive,
    pcSampleLengthLeft,
    pcLastSample,
    alSoundActive,
    alLengthLeft,
    alTimeCount,
    DigiLeft,
    DigiNextLen,
    DigiMissed,
    DigiLastSegment,
    DigiLastSegmentLength,
    DigiCurrentSegmentLength: digiCurrentSegment?.length ?? 0,
    sbSamplePlaying,
    ssSamplePlaying,
    soundSourceActive,
    hasSoundUserHook: SoundUserHook !== null,
  };
}

export function SD_ResetSoundState(options: SoundResetOptions = {}): SoundModeSummary {
  SoundSourcePresent = options.SoundSourcePresent ?? false;
  AdLibPresent = options.AdLibPresent ?? false;
  SoundBlasterPresent = options.SoundBlasterPresent ?? false;
  SBProPresent = false;
  NeedsDigitized = false;
  NeedsMusic = false;
  SoundPositioned = false;
  SoundMode = options.SoundMode ?? sdm_Off;
  MusicMode = options.MusicMode ?? smm_Off;
  DigiMode = options.DigiMode ?? sds_Off;
  TimeCount = 0;
  HackCount = 0;
  nextsoundpos = false;
  SoundNumber = 0;
  DigiNumber = 0;
  SoundPriority = 0;
  DigiPriority = 0;
  LeftPosition = 0;
  RightPosition = 0;
  DigiPlaying = false;
  NumDigi = 0;
  sqActive = false;
  alFXReg = 0;
  TimerRate = TickBase * 2;
  Timer0Speed = Math.trunc(timerBaseHz / (TickBase * 2));
  TimerDivisor = Timer0Speed;
  SD_Started = false;
  pcLengthLeft = 0;
  pcSampleLengthLeft = 0;
  pcLastSample = -1;
  pcSoundCursor = 0;
  pcSampleActive = false;
  alLengthLeft = 0;
  alTimeCount = 0;
  alBlock = 0;
  alSoundCursor = 0;
  DigiLeft = 0;
  DigiPage = 0;
  DigiNextLen = 0;
  DigiMissed = false;
  DigiLastSegment = false;
  DigiLastSegmentLength = 0;
  DigiLastStart = 1;
  DigiLastEnd = 0;
  sbSamplePlaying = false;
  ssSamplePlaying = false;
  pcSoundActive = false;
  alSoundActive = false;
  soundSourceActive = false;
  pcSoundData = null;
  pcSampleData = null;
  alSoundData = null;
  digiCurrentSegment = null;
  digiNextSegment = null;
  timerServiceCount = 0;
  SoundUserHook = null;
  SoundTable.fill(null);
  DigiMap.fill(-1);
  alRegisterWrites.length = 0;
  return SD_DebugState();
}

export function SD_SetTimeCount(count: number): SoundModeSummary {
  TimeCount = Math.max(0, Math.trunc(count)) >>> 0;
  return SD_DebugState();
}

function bytesFromArrayLike(data: ArrayLike<number> | undefined, maxLength = Number.MAX_SAFE_INTEGER): Uint8Array | null {
  if (!data || data.length <= 0 || maxLength <= 0) {
    return null;
  }
  const length = Math.min(data.length, maxLength);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = data[i] & 0xff;
  }
  return bytes;
}

function soundData(sound: SoundCommon): Uint8Array | null {
  return bytesFromArrayLike((sound as SoundWithData).data, Math.max(0, Math.trunc(sound.length)));
}

function parseSoundTableChunk(mode: SDMode, chunk: Uint8Array | null | undefined): SoundCommon | null {
  if (mode === sdm_Off || !chunk || chunk.length < 6) {
    return null;
  }

  const length = readU32LE(chunk, 0);
  const priority = readU16LE(chunk, 4);

  if (mode === sdm_PC) {
    return {
      length,
      priority,
      data: chunk.subarray(6, Math.min(chunk.length, 6 + length)),
    } as SoundWithData;
  }

  if (mode === sdm_AdLib) {
    if (chunk.length < 23) {
      return null;
    }
    return {
      length,
      priority,
      inst: {
        mChar: chunk[6],
        cChar: chunk[7],
        mScale: chunk[8],
        cScale: chunk[9],
        mAttack: chunk[10],
        cAttack: chunk[11],
        mSus: chunk[12],
        cSus: chunk[13],
        mWave: chunk[14],
        cWave: chunk[15],
        nConn: chunk[16],
      },
      block: chunk[22],
      data: chunk.subarray(23, Math.min(chunk.length, 23 + length)),
    } as SoundWithData;
  }

  return null;
}

export function SD_LinkSoundTable(
  mode: SDMode,
  audioChunks: readonly (Uint8Array | null | undefined)[],
  tableoffset: number,
): SoundTableLoadSummary {
  let loaded = 0;
  let missing = 0;
  let bytes = 0;

  for (let i = 0; i < LASTSOUND; i++) {
    const chunk = audioChunks[tableoffset + i] ?? null;
    const parsed = parseSoundTableChunk(mode, chunk);
    SoundTable[i] = parsed;
    if (parsed) {
      loaded++;
      bytes += chunk?.length ?? 0;
    } else {
      missing++;
    }
  }

  return { mode, tableoffset, loaded, missing, bytes };
}

function syntheticSample(data: Uint8Array | null, cursor: number): number {
  if (data && data.length) {
    return data[cursor % data.length] & 0xff;
  }
  return (cursor % 255) + 1;
}

function instrumentByte(inst: Instrument, key: keyof Required<Instrument>): number {
  return (inst[key] ?? alZeroInst[key]) & 0xff;
}

function normalizedInstrument(soundOrInst?: SoundCommon | Instrument | null): Required<Instrument> {
  const candidate = soundOrInst && "priority" in soundOrInst
    ? (soundOrInst as SoundWithData).inst
    : (soundOrInst as Instrument | null | undefined);
  return {
    mChar: instrumentByte(candidate ?? alDefaultInst, "mChar"),
    cChar: instrumentByte(candidate ?? alDefaultInst, "cChar"),
    mScale: instrumentByte(candidate ?? alDefaultInst, "mScale"),
    cScale: instrumentByte(candidate ?? alDefaultInst, "cScale"),
    mAttack: instrumentByte(candidate ?? alDefaultInst, "mAttack"),
    cAttack: instrumentByte(candidate ?? alDefaultInst, "cAttack"),
    mSus: instrumentByte(candidate ?? alDefaultInst, "mSus"),
    cSus: instrumentByte(candidate ?? alDefaultInst, "cSus"),
    mWave: instrumentByte(candidate ?? alDefaultInst, "mWave"),
    cWave: instrumentByte(candidate ?? alDefaultInst, "cWave"),
    nConn: instrumentByte(candidate ?? alDefaultInst, "nConn"),
  };
}

function segmentBytes(addr: unknown, len: number): Uint8Array {
  const length = Math.max(0, Math.trunc(len));
  if (addr instanceof Uint8Array) {
    return addr.slice(0, Math.min(addr.length, length));
  }
  if (addr && typeof addr === "object" && "value" in addr) {
    const value = (addr as { readonly value?: unknown }).value;
    if (value instanceof Uint8Array) {
      return value.slice(0, Math.min(value.length, length));
    }
  }
  return new Uint8Array(length);
}

function SDL_SoundFinished(): void {
  SoundNumber = 0;
  SoundPriority = 0;
  pcSoundActive = false;
  alSoundActive = false;
  pcLengthLeft = 0;
  alLengthLeft = 0;
  pcSoundData = null;
  alSoundData = null;
}

function soundOrQuit(sound: number): SoundCommon {
  const s = SoundTable[sound] ?? null;
  if ((SoundMode !== sdm_Off) && !s) {
    throw new Error("SD_PlaySound() - Uncached sound");
  }
  if (!s) {
    throw new Error("SD_PlaySound() - Uncached sound");
  }
  return s;
}

export function alOut(n: number, b: number): AlRegisterWrite {
  const write = { register: n & 0xff, value: b & 0xff };
  alRegisterWrites.push(write);
  return write;
}

export function SD_Default(gotit: boolean, sd: SDMode, sm: SMMode): SoundModeSummary {
  let gotsd = gotit;
  let gotsm = gotit;

  if (gotsd) {
    switch (sd) {
      case sdm_AdLib:
        gotsd = AdLibPresent;
        break;
    }
  }
  if (!gotsd) {
    if (AdLibPresent) {
      sd = sdm_AdLib;
    } else {
      sd = sdm_PC;
    }
  }
  if (sd !== SoundMode) {
    SD_SetSoundMode(sd);
  }

  if (gotsm) {
    switch (sm) {
      case smm_AdLib:
        gotsm = AdLibPresent;
        break;
    }
  }
  if (!gotsm) {
    if (AdLibPresent) {
      sm = smm_AdLib;
    }
  }
  if (sm !== MusicMode) {
    SD_SetMusicMode(sm);
  }

  return SD_DebugState();
}

export function SD_FadeOutMusic(): SoundModeSummary {
  switch (MusicMode) {
    case smm_AdLib:
      SD_MusicOff();
      break;
  }
  return SD_DebugState();
}

export function SD_MusicOff(): SoundModeSummary {
  switch (MusicMode) {
    case smm_AdLib:
      alFXReg = 0;
      alOut(alEffects, 0);
      for (let i = 0; i < sqMaxTracks; i++) {
        alOut(alFreqH + i + 1, 0);
      }
      break;
  }
  sqActive = false;
  return SD_DebugState();
}

export function SD_MusicOn(): SoundModeSummary {
  sqActive = true;
  return SD_DebugState();
}

export function SD_MusicPlaying(): boolean {
  let result = false;

  switch (MusicMode) {
    case smm_AdLib:
      result = false;
      break;
    default:
      result = false;
  }

  return result;
}

export function SD_PlayDigitized(which: number, leftpos: number, rightpos: number): SoundModeSummary {
  if (!DigiMode) {
    return SD_DebugState();
  }

  SD_StopDigitized();
  if (which >= NumDigi || which < 0) {
    throw new Error("SD_PlayDigitized: bad sound number");
  }

  SD_SetPosition(leftpos, rightpos);
  DigiPlaying = true;
  DigiLeft = 0;
  DigiPage = which;
  DigiLastStart = which;
  DigiLastEnd = which + 1;
  DigiLastSegment = true;
  SDL_PlayDigiSegment(new Uint8Array([0x80]), 1);
  SDL_SetTimerSpeed();
  return SD_DebugState();
}

export function SD_PlaySound(sound: number): boolean {
  const lp = LeftPosition;
  const rp = RightPosition;
  LeftPosition = 0;
  RightPosition = 0;

  const ispos = nextsoundpos;
  nextsoundpos = false;

  if (sound === -1) {
    return false;
  }
  if (sound < 0 || sound >= LASTSOUND) {
    throw new RangeError("SD_PlaySound() - bad sound number");
  }

  const s = SoundTable[sound] ?? null;
  if ((SoundMode !== sdm_Off) && !s) {
    throw new Error("SD_PlaySound() - Uncached sound");
  }

  if ((DigiMode !== sds_Off) && (DigiMap[sound] !== -1)) {
    const soundCommon = soundOrQuit(sound);
    if ((DigiMode === sds_PC) && (SoundMode === sdm_PC)) {
      if (soundCommon.priority < SoundPriority) {
        return false;
      }

      pcSoundActive = false;
      SD_PlayDigitized(DigiMap[sound], lp, rp);
      SoundPositioned = ispos;
      SoundNumber = sound;
      SoundPriority = soundCommon.priority;
    } else {
      if (DigiPriority && !DigiNumber) {
        throw new Error("SD_PlaySound: Priority without a sound");
      }

      if (soundCommon.priority < DigiPriority) {
        return false;
      }

      SD_PlayDigitized(DigiMap[sound], lp, rp);
      SoundPositioned = ispos;
      DigiNumber = sound;
      DigiPriority = soundCommon.priority;
      // Browser: the DOS SB DMA model (SDL_SBPlaySeg) is inert here, so hand the assembled PCM to
      // the Web Audio bridge if one is registered (main.ts). No-op in headless/gate contexts.
      if (digiPlaybackHook) {
        const pcm = assembleDigiSound(DigiMap[sound]);
        if (pcm) {
          digiPlaybackHook(pcm, lp, rp);
        }
      }
    }

    return true;
  }

  if (SoundMode === sdm_Off) {
    return false;
  }
  if (!s) {
    throw new Error("SD_PlaySound() - Uncached sound");
  }
  if (!s.length) {
    throw new Error("SD_PlaySound() - Zero length sound");
  }
  if (s.priority < SoundPriority) {
    return false;
  }

  switch (SoundMode) {
    case sdm_PC:
      SDL_PCPlaySound(s);
      break;
    case sdm_AdLib:
      SDL_ALPlaySound(s);
      break;
  }

  SoundNumber = sound;
  SoundPriority = s.priority;

  return false;
}

export function SD_Poll(): SoundModeSummary {
  SDL_SetTimerSpeed();
  return SD_DebugState();
}

export function SD_PositionSound(leftvol: number, rightvol: number): SoundModeSummary {
  LeftPosition = leftvol;
  RightPosition = rightvol;
  nextsoundpos = true;
  return SD_DebugState();
}

export function SD_SetDigiDevice(mode: SDSMode): SoundModeSummary {
  let devicenotpresent: boolean;

  if (mode === DigiMode) {
    return SD_DebugState();
  }

  SD_StopDigitized();

  devicenotpresent = false;
  switch (mode) {
    case sds_SoundBlaster:
      if (!SoundBlasterPresent) {
        if (SoundSourcePresent) {
          mode = sds_SoundSource;
        } else {
          devicenotpresent = true;
        }
      }
      break;
    case sds_SoundSource:
      if (!SoundSourcePresent) {
        devicenotpresent = true;
      }
      break;
  }

  if (!devicenotpresent) {
    if (DigiMode === sds_SoundSource) {
      soundSourceActive = false;
    }

    DigiMode = mode;

    if (mode === sds_SoundSource) {
      soundSourceActive = true;
    }

    SDL_SetTimerSpeed();
  }

  return SD_DebugState();
}

export function SD_SetMusicMode(mode: SMMode): boolean {
  let result = false;

  SD_FadeOutMusic();
  while (SD_MusicPlaying()) {
    // The original spins here until a fade completes. In this source branch,
    // SD_MusicPlaying() always returns false, so this loop never iterates.
  }

  switch (mode) {
    case smm_Off:
      NeedsMusic = false;
      result = true;
      break;
    case smm_AdLib:
      if (AdLibPresent) {
        NeedsMusic = true;
        result = true;
      }
      break;
  }

  if (result) {
    MusicMode = mode;
  }

  SDL_SetTimerSpeed();

  return result;
}

export function SD_SetPosition(leftpos: number, rightpos: number): SoundPositionSummary {
  if (
    (leftpos < 0)
    || (leftpos > 15)
    || (rightpos < 0)
    || (rightpos > 15)
    || ((leftpos === 15) && (rightpos === 15))
  ) {
    throw new RangeError("SD_SetPosition: Illegal position");
  }

  return {
    left: leftpos,
    right: rightpos,
    appliedToSoundBlaster: DigiMode === sds_SoundBlaster,
  };
}

export function SD_SetSoundMode(mode: SDMode): boolean {
  let result = false;

  SD_StopSound();

  if ((mode === sdm_AdLib) && !AdLibPresent) {
    mode = sdm_PC;
  }

  switch (mode) {
    case sdm_Off:
      NeedsDigitized = false;
      result = true;
      break;
    case sdm_PC:
      NeedsDigitized = false;
      result = true;
      break;
    case sdm_AdLib:
      if (AdLibPresent) {
        NeedsDigitized = false;
        result = true;
      }
      break;
  }

  if (result && (mode !== SoundMode)) {
    pcSoundActive = false;
    alSoundActive = false;
    SoundMode = mode;
  }

  SDL_SetTimerSpeed();

  return result;
}

export function SD_SetUserHook(hook: (() => void) | null): SoundModeSummary {
  SoundUserHook = hook;
  return SD_DebugState();
}

export function SD_Shutdown(): SoundModeSummary {
  if (!SD_Started) {
    return SD_DebugState();
  }

  SD_MusicOff();
  SD_StopSound();
  SDL_ShutDevice();
  SDL_CleanDevice();
  SD_Started = false;
  return SD_DebugState();
}

export function SD_SoundPlaying(): number {
  let result = false;

  switch (SoundMode) {
    case sdm_PC:
      result = pcSoundActive ? true : false;
      break;
    case sdm_AdLib:
      result = alSoundActive ? true : false;
      break;
  }

  if (result) {
    return SoundNumber;
  } else {
    return 0;
  }
}

export function SD_StartMusic(music?: Uint8Array | { readonly length: number; readonly values?: Uint8Array | ArrayLike<number> }): SoundModeSummary {
  SD_MusicOff();

  if (MusicMode === smm_AdLib && music) {
    // Load the IMF event stream. A raw music chunk (Uint8Array) carries a [u16 length] header
    // followed by the events; a {length, values} object supplies them directly. When no data is
    // present (headless mode-transition checks pass {length} only) keep the original on/off behavior.
    if (music instanceof Uint8Array) {
      const len = (music[0] ?? 0) | ((music[1] ?? 0) << 8);
      sqHackData = music.subarray(2);
      sqHackPtr = 0;
      sqHackLen = len;
      sqHackSeqLen = len;
      sqHackTime = 0;
      alTimeCount = 0;
    } else if (music.values) {
      sqHackData = music.values instanceof Uint8Array ? music.values : Uint8Array.from(music.values);
      sqHackPtr = 0;
      sqHackLen = music.length;
      sqHackSeqLen = music.length;
      sqHackTime = 0;
      alTimeCount = 0;
    }
    SD_MusicOn();
  }

  return SD_DebugState();
}

export function SD_Startup(): SoundModeSummary {
  if (SD_Started) {
    return SD_DebugState();
  }

  SD_SetSoundMode(sdm_Off);
  SD_SetMusicMode(smm_Off);
  SD_Started = true;
  return SD_DebugState();
}

export function SD_StopDigitized(): SoundModeSummary {
  DigiLeft = 0;
  DigiNextLen = 0;
  DigiMissed = false;
  DigiPlaying = false;
  DigiLastSegment = false;
  DigiLastSegmentLength = 0;
  digiCurrentSegment = null;
  digiNextSegment = null;
  DigiNumber = 0;
  DigiPriority = 0;
  SoundPositioned = false;
  switch (DigiMode) {
    case sds_PC:
      SDL_PCStopSample();
      break;
    case sds_SoundBlaster:
      SDL_SBStopSample();
      break;
    case sds_SoundSource:
      SDL_SSStopSample();
      break;
  }
  if ((DigiMode === sds_PC) && (SoundMode === sdm_PC)) {
    SDL_SoundFinished();
  }
  return SD_DebugState();
}

export function SD_StopSound(): SoundModeSummary {
  if (DigiPlaying) {
    SD_StopDigitized();
  }

  switch (SoundMode) {
    case sdm_PC:
      SDL_PCStopSound();
      break;
    case sdm_AdLib:
      SDL_ALStopSound();
      break;
  }

  SoundPositioned = false;

  SDL_SoundFinished();
  return SD_DebugState();
}

export function SD_WaitSoundDone(maxPolls = 0): boolean {
  let polls = 0;
  while (SD_SoundPlaying()) {
    if (polls++ >= maxPolls) {
      return false;
    }
  }
  return true;
}

export function SDL_ALPlaySound(sound: SoundCommon): SoundModeSummary {
  const dataSound = sound as SoundWithData;
  const inst = normalizedInstrument(sound);
  if (!((inst.mSus | inst.cSus) & 0xff)) {
    throw new Error("SDL_ALPlaySound() - Bad instrument");
  }

  SDL_ALStopSound();
  alLengthLeft = Math.max(0, Math.trunc(sound.length));
  alSoundData = soundData(sound);
  alSoundCursor = 0;
  alBlock = (((dataSound.block ?? 0) & 7) << 2) | 0x20;
  alSoundActive = alLengthLeft > 0;
  pcSoundActive = false;
  SDL_AlSetFXInst(alZeroInst);
  SDL_AlSetFXInst(inst);
  return SD_DebugState();
}

export function SDL_ALService(): SoundModeSummary {
  if (!sqActive || !sqHackData) {
    return SD_DebugState();
  }
  // Faithful to the DOS SDL_ALService: emit every IMF event whose scheduled time has arrived, then
  // advance the clock; loop the song when the stream is exhausted.
  while (sqHackLen > 0 && sqHackTime <= alTimeCount) {
    const reg = sqHackData[sqHackPtr];
    const val = sqHackData[sqHackPtr + 1];
    const delay = sqHackData[sqHackPtr + 2] | (sqHackData[sqHackPtr + 3] << 8);
    sqHackPtr += 4;
    sqHackTime = alTimeCount + delay;
    alOut(reg, val);
    sqHackLen -= 4;
  }
  alTimeCount++;
  if (sqHackLen <= 0) {
    sqHackPtr = 0;
    sqHackLen = sqHackSeqLen;
    alTimeCount = 0;
    sqHackTime = 0;
  }
  return SD_DebugState();
}

export function SDL_AlSetFXInst(inst: Instrument = alDefaultInst): AlRegisterWrite[] {
  const start = alRegisterWrites.length;
  const fxInst = normalizedInstrument(inst);
  const m = modifiers[0];
  const c = carriers[0];
  alOut(m + alChar, fxInst.mChar);
  alOut(m + alScale, fxInst.mScale);
  alOut(m + alAttack, fxInst.mAttack);
  alOut(m + alSus, fxInst.mSus);
  alOut(m + alWave, fxInst.mWave);
  alOut(c + alChar, fxInst.cChar);
  alOut(c + alScale, fxInst.cScale);
  alOut(c + alAttack, fxInst.cAttack);
  alOut(c + alSus, fxInst.cSus);
  alOut(c + alWave, fxInst.cWave);
  alOut(alFeedCon, fxInst.nConn);
  return alRegisterWrites.slice(start);
}

export function SDL_ALSoundService(): SoundModeSummary {
  if (!alSoundActive) {
    return SD_DebugState();
  }

  const sample = syntheticSample(alSoundData, alSoundCursor++);
  if (sample === 0) {
    alOut(alFreqH, 0);
  } else {
    alOut(alFreqL, sample);
    alOut(alFreqH, alBlock);
  }

  alLengthLeft = Math.max(0, alLengthLeft - 1);
  if (alLengthLeft === 0) {
    alSoundActive = false;
    alSoundData = null;
    alOut(alFreqH, 0);
    SDL_SoundFinished();
  }
  return SD_DebugState();
}

export function SDL_ALStopSound(): SoundModeSummary {
  alSoundActive = false;
  alLengthLeft = 0;
  alSoundCursor = 0;
  alSoundData = null;
  alOut(alFreqH, 0);
  return SD_DebugState();
}

export function SDL_CheckSB(): boolean {
  return SoundBlasterPresent;
}

export function SDL_CheckSS(): boolean {
  return SoundSourcePresent;
}

export function SDL_CleanAL(): SoundModeSummary {
  alFXReg = 0;
  alOut(alEffects, 0);
  alOut(alFreqH, 0);
  return SD_DebugState();
}

export function SDL_CleanDevice(): SoundModeSummary {
  if ((SoundMode === sdm_AdLib) || (MusicMode === smm_AdLib)) {
    SDL_CleanAL();
  }
  return SD_DebugState();
}

export function SDL_DetectAdLib(): boolean {
  return AdLibPresent;
}

export function SDL_DetectSoundBlaster(): boolean {
  return SoundBlasterPresent;
}

export function SDL_DetectSoundSource(): boolean {
  return SoundSourcePresent;
}

export function SDL_DigitizedDone(): SoundModeSummary {
  if (digiNextSegment && DigiNextLen > 0) {
    const next = digiNextSegment;
    const nextLen = DigiNextLen;
    digiNextSegment = null;
    DigiNextLen = 0;
    DigiMissed = false;
    return SDL_PlayDigiSegment(next, nextLen);
  }

  if (DigiLastSegment) {
    DigiPlaying = false;
    DigiLastSegment = false;
    DigiLastSegmentLength = 0;
    digiCurrentSegment = null;
    pcSampleActive = false;
    pcSampleLengthLeft = 0;
    sbSamplePlaying = false;
    ssSamplePlaying = false;
    if ((DigiMode === sds_PC) && (SoundMode === sdm_PC)) {
      SDL_SoundFinished();
    } else {
      DigiNumber = 0;
      DigiPriority = 0;
    }
    SoundPositioned = false;
  } else {
    DigiMissed = true;
  }

  return SD_DebugState();
}

export function SDL_LoadDigiSegment(page = 0, length = PMPAGESIZE): Uint8Array {
  DigiPage = Math.max(0, Math.trunc(page));
  // Faithful to the DOS original (addr = PM_GetSoundPage(page)); the browser path uses
  // assembleDigiSound() instead, so this segment only feeds the (inert-in-browser) DMA bookkeeping.
  const segment = ChunksInFile > 0 ? PM_GetSoundPage(DigiPage) : new Uint8Array(Math.max(0, Math.trunc(length)));
  return length > 0 && length < segment.length ? segment.subarray(0, Math.trunc(length)) : segment;
}

export function SDL_PCPlaySample(addr: unknown, len: number): SoundModeSummary {
  const segment = segmentBytes(addr, len);
  pcSampleData = segment;
  pcSampleLengthLeft = segment.length;
  pcSampleActive = segment.length > 0;
  DigiLastSegmentLength = segment.length;
  DigiPlaying = pcSampleActive;
  return SD_DebugState();
}

export function SDL_PCPlaySound(sound: SoundCommon): SoundModeSummary {
  pcLastSample = -1;
  pcLengthLeft = Math.max(0, Math.trunc(sound.length));
  pcSoundCursor = 0;
  pcSoundData = soundData(sound);
  pcSoundActive = pcLengthLeft > 0;
  alSoundActive = false;
  return SD_DebugState();
}

export function SDL_PCService(): SoundModeSummary {
  if (pcSampleActive) {
    pcLastSample = syntheticSample(pcSampleData, pcSoundCursor++);
    pcSampleLengthLeft = Math.max(0, pcSampleLengthLeft - 1);
    DigiLastSegmentLength = pcSampleLengthLeft;
    if (pcSampleLengthLeft === 0) {
      SDL_PCStopSample();
      SDL_DigitizedDone();
    }
    return SD_DebugState();
  }

  if (pcSoundActive) {
    pcLastSample = syntheticSample(pcSoundData, pcSoundCursor++);
    pcLengthLeft = Math.max(0, pcLengthLeft - 1);
    if (pcLengthLeft === 0) {
      SDL_PCStopSound();
      SDL_SoundFinished();
    }
  }
  return SD_DebugState();
}

export function SDL_PCStopSample(): SoundModeSummary {
  pcSampleActive = false;
  pcSampleLengthLeft = 0;
  pcSampleData = null;
  return SD_DebugState();
}

export function SDL_PCStopSound(): SoundModeSummary {
  pcSoundActive = false;
  pcLengthLeft = 0;
  pcSoundCursor = 0;
  pcSoundData = null;
  return SD_DebugState();
}

export function SDL_PlayDigiSegment(addr: unknown, len: number): SoundModeSummary {
  const segment = segmentBytes(addr, len);
  digiCurrentSegment = segment;
  DigiLastSegmentLength = segment.length;
  if (DigiLeft <= 0 && DigiNextLen === 0) {
    DigiLastSegment = true;
  }

  switch (DigiMode) {
    case sds_PC:
      return SDL_PCPlaySample(segment, segment.length);
    case sds_SoundBlaster:
      return SDL_SBPlaySample(segment, segment.length);
    case sds_SoundSource:
      return SDL_SSPlaySample(segment, segment.length);
    default:
      return SD_DebugState();
  }
}

export function SDL_PositionSBP(leftpos: number, rightpos: number): SoundPositionSummary {
  if (
    (leftpos < 0)
    || (leftpos > 15)
    || (rightpos < 0)
    || (rightpos > 15)
    || ((leftpos === 15) && (rightpos === 15))
  ) {
    throw new RangeError("SDL_PositionSBP: Illegal position");
  }

  LeftPosition = leftpos;
  RightPosition = rightpos;
  return {
    left: leftpos,
    right: rightpos,
    appliedToSoundBlaster: DigiMode === sds_SoundBlaster,
  };
}

export function SDL_SBPlaySample(addr: unknown, len: number): SoundModeSummary {
  const segment = segmentBytes(addr, len);
  digiCurrentSegment = segment;
  DigiLastSegmentLength = segment.length;
  sbSamplePlaying = segment.length > 0;
  ssSamplePlaying = false;
  pcSampleActive = false;
  DigiPlaying = sbSamplePlaying;
  return SD_DebugState();
}

export function SDL_SBPlaySeg(addr: unknown, len: number): SoundModeSummary {
  return SDL_SBPlaySample(addr, len);
}

export function SDL_SBService(): SoundModeSummary {
  if (sbSamplePlaying) {
    DigiLastSegmentLength = Math.max(0, DigiLastSegmentLength - 1);
    if (DigiLastSegmentLength === 0) {
      SDL_SBStopSample();
      SDL_DigitizedDone();
    }
  }
  return SD_DebugState();
}

export function SDL_SBSetDMA(_channel = 1): SoundModeSummary {
  return SD_DebugState();
}

export function SDL_SBStopSample(): SoundModeSummary {
  sbSamplePlaying = false;
  return SD_DebugState();
}

export function SDL_SetInstrument(
  _track = 1,
  which = 0,
  inst: Instrument = alDefaultInst,
  percussive = false,
): AlRegisterWrite[] {
  const start = alRegisterWrites.length;
  const fxInst = normalizedInstrument(inst);
  const c = percussive ? pcarriers[which] : carriers[which];
  const m = percussive ? pmodifiers[which] : modifiers[which];
  if (m === undefined || c === undefined) {
    throw new RangeError("SDL_SetInstrument: bad voice");
  }

  alOut(m + alChar, fxInst.mChar);
  alOut(m + alScale, fxInst.mScale);
  alOut(m + alAttack, fxInst.mAttack);
  alOut(m + alSus, fxInst.mSus);
  alOut(m + alWave, fxInst.mWave);
  if (c !== 0xff) {
    alOut(c + alChar, fxInst.cChar);
    alOut(c + alScale, fxInst.cScale);
    alOut(c + alAttack, fxInst.cAttack);
    alOut(c + alSus, fxInst.cSus);
    alOut(c + alWave, fxInst.cWave);
  }
  alOut(which + alFeedCon, fxInst.nConn);
  return alRegisterWrites.slice(start);
}

export function SDL_SetIntsPerSec(ints: number): number {
  const rate = Math.max(0, Math.trunc(ints));
  TimerRate = rate;
  SDL_SetTimer0(rate > 0 ? Math.trunc(timerBaseHz / rate) : 0);
  return TimerRate;
}

export function SDL_SetTimer0(speed: number): number {
  const safeSpeed = Math.max(0, Math.trunc(speed)) & 0xffff;
  Timer0Speed = safeSpeed;
  const pcExtremeDivisor = Math.trunc(timerBaseHz / (TickBase * 100));
  TimerDivisor = safeSpeed === pcExtremeDivisor
    ? Math.trunc(timerBaseHz / (TickBase * 10))
    : safeSpeed;
  return TimerDivisor;
}

export function SDL_SetTimerSpeed(): number {
  let rate: number;

  if ((DigiMode === sds_PC) && DigiPlaying) {
    rate = TickBase * 100;
  } else if (
    (MusicMode === smm_AdLib)
    || ((DigiMode === sds_SoundSource) && DigiPlaying)
  ) {
    rate = TickBase * 10;
  } else {
    rate = TickBase * 2;
  }

  if (rate !== TimerRate) {
    SDL_SetIntsPerSec(rate);
  } else {
    TimerRate = rate;
  }
  return TimerRate;
}

export function SDL_SetupDigi(numDigi = 0): SoundModeSummary {
  DigiPlaying = false;
  DigiLeft = 0;
  DigiNextLen = 0;
  DigiMissed = false;
  DigiLastSegment = false;
  DigiLastSegmentLength = 0;
  digiCurrentSegment = null;
  digiNextSegment = null;
  DigiMap.fill(-1);
  DigiList = [];
  NumDigi = 0;
  // The last VSWAP chunk is the digisound info list: (startPage, lengthBytes) word pairs, where
  // startPage is relative to PMSoundStart. Walk it the way the DOS SDL_SetupDigi does — accumulate
  // pages and stop when they reach the list chunk — to count NumDigi and copy the pairs.
  if (ChunksInFile > 0) {
    const list = PM_GetPage(ChunksInFile - 1);
    const u16 = (o: number): number => (list[o] ?? 0) | ((list[o + 1] ?? 0) << 8);
    const entries = Math.trunc(list.length / 4);
    let pg = PMSoundStart;
    let i = 0;
    for (; i < entries; i++) {
      if (pg >= ChunksInFile - 1) {
        break;
      }
      DigiList.push(u16(i * 4), u16(i * 4 + 2));
      pg += Math.ceil(u16(i * 4 + 2) / PMPAGESIZE);
    }
    NumDigi = i;
  } else {
    // Headless/unit contexts that never start the page manager: keep the legacy param contract so
    // the digitized-path checks (which set NumDigi without VSWAP) still work.
    NumDigi = Math.max(0, Math.trunc(numDigi));
  }
  return SD_DebugState();
}

// Assemble a digitized sound's full PCM (unsigned 8-bit, ~7 kHz) from its VSWAP pages. Returns the
// `length`-byte sample for digi index `which`, or null if out of range / empty.
export function assembleDigiSound(which: number): Uint8Array | null {
  if (which < 0 || which * 2 + 1 >= DigiList.length) {
    return null;
  }
  const startPage = DigiList[which * 2];
  const length = DigiList[which * 2 + 1];
  if (length <= 0) {
    return null;
  }
  const numPages = Math.ceil(length / PMPAGESIZE);
  const out = new Uint8Array(numPages * PMPAGESIZE);
  for (let k = 0; k < numPages; k++) {
    const page = PM_GetSoundPage(startPage + k);
    out.set(page.subarray(0, PMPAGESIZE), k * PMPAGESIZE);
  }
  return out.subarray(0, length);
}

export function SDL_ShutAL(): SoundModeSummary {
  SDL_ALStopSound();
  if (MusicMode === smm_AdLib) {
    SD_MusicOff();
  }
  return SD_DebugState();
}

export function SDL_ShutDevice(): SoundModeSummary {
  switch (SoundMode) {
    case sdm_PC:
      SDL_ShutPC();
      break;
    case sdm_AdLib:
      SDL_ShutAL();
      break;
  }
  SDL_SoundFinished();
  SoundMode = sdm_Off;
  return SD_DebugState();
}

export function SDL_ShutPC(): SoundModeSummary {
  SDL_PCStopSound();
  SDL_PCStopSample();
  return SD_DebugState();
}

export function SDL_ShutSB(): SoundModeSummary {
  SDL_SBStopSample();
  return SD_DebugState();
}

export function SDL_ShutSS(): SoundModeSummary {
  SDL_SSStopSample();
  soundSourceActive = false;
  return SD_DebugState();
}

export function SDL_SSPlaySample(addr: unknown, len: number): SoundModeSummary {
  const segment = segmentBytes(addr, len);
  digiCurrentSegment = segment;
  DigiLastSegmentLength = segment.length;
  ssSamplePlaying = segment.length > 0;
  sbSamplePlaying = false;
  pcSampleActive = false;
  soundSourceActive = ssSamplePlaying || soundSourceActive;
  DigiPlaying = ssSamplePlaying;
  return SD_DebugState();
}

export function SDL_SSService(): SoundModeSummary {
  if (ssSamplePlaying) {
    DigiLastSegmentLength = Math.max(0, DigiLastSegmentLength - 1);
    if (DigiLastSegmentLength === 0) {
      SDL_SSStopSample();
      SDL_DigitizedDone();
    }
  }
  return SD_DebugState();
}

export function SDL_SSStopSample(): SoundModeSummary {
  ssSamplePlaying = false;
  return SD_DebugState();
}

export function SDL_StartAL(): SoundModeSummary {
  alFXReg = 0;
  alOut(alEffects, alFXReg);
  SDL_AlSetFXInst(alZeroInst);
  return SD_DebugState();
}

export function SDL_StartDevice(): SoundModeSummary {
  switch (SoundMode) {
    case sdm_AdLib:
      SDL_StartAL();
      break;
  }
  SoundNumber = 0;
  SoundPriority = 0;
  return SD_DebugState();
}

export function SDL_StartSB(): SoundModeSummary {
  SoundBlasterPresent = true;
  return SD_DebugState();
}

export function SDL_StartSS(): SoundModeSummary {
  SoundSourcePresent = true;
  soundSourceActive = true;
  return SD_DebugState();
}

export function SDL_t0Service(): SoundModeSummary {
  HackCount++;
  timerServiceCount++;

  const tickUser = (): void => {
    TimeCount++;
    SoundUserHook?.();
  };
  const serviceSound = (): void => {
    switch (SoundMode) {
      case sdm_PC:
        SDL_PCService();
        break;
      case sdm_AdLib:
        SDL_ALSoundService();
        break;
    }
  };

  if ((MusicMode === smm_AdLib) || (DigiMode === sds_SoundSource)) {
    SDL_ALService();
    SDL_SSService();
    if ((timerServiceCount % 10) === 0) {
      tickUser();
    }
    if ((timerServiceCount % 5) === 0) {
      serviceSound();
    }
  } else {
    if ((timerServiceCount & 1) === 0) {
      tickUser();
    }
    serviceSound();
    if (DigiMode === sds_SoundBlaster) {
      SDL_SBService();
    }
  }

  return SD_DebugState();
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID Engine
// //	ID_SD.c - Sound Manager for Wolfenstein 3D
// //	v1.2
// //	By Jason Blochowiak
// //
// 
// //
// //	This module handles dealing with generating sound on the appropriate
// //		hardware
// //
// //	Depends on: User Mgr (for parm checking)
// //
// //	Globals:
// //		For User Mgr:
// //			SoundSourcePresent - Sound Source thingie present?
// //			SoundBlasterPresent - SoundBlaster card present?
// //			AdLibPresent - AdLib card present?
// //			SoundMode - What device is used for sound effects
// //				(Use SM_SetSoundMode() to set)
// //			MusicMode - What device is used for music
// //				(Use SM_SetMusicMode() to set)
// //			DigiMode - What device is used for digitized sound effects
// //				(Use SM_SetDigiDevice() to set)
// //
// //		For Cache Mgr:
// //			NeedsDigitized - load digitized sounds?
// //			NeedsMusic - load music?
// //
// 
// #pragma hdrstop		// Wierdo thing with MUSE
// 
// #include <dos.h>
// 
// #ifdef	_MUSE_      // Will be defined in ID_Types.h
// #include "ID_SD.h"
// #else
// #include "ID_HEADS.H"
// #endif
// #pragma	hdrstop
// #pragma	warn	-pia
// 
// #ifdef	nil
// #undef	nil
// #endif
// #define	nil	0
// 
// #define	SDL_SoundFinished()	{SoundNumber = SoundPriority = 0;}
// 
// // Macros for SoundBlaster stuff
// #define	sbOut(n,b)	outportb((n) + sbLocation,b)
// #define	sbIn(n)		inportb((n) + sbLocation)
// #define	sbWriteDelay()	while (sbIn(sbWriteStat) & 0x80);
// #define	sbReadDelay()	while (sbIn(sbDataAvail) & 0x80);
// 
// // Macros for AdLib stuff
// #define	selreg(n)	outportb(alFMAddr,n)
// #define	writereg(n)	outportb(alFMData,n)
// #define	readstat()	inportb(alFMStatus)
// 
// //	Imports from ID_SD_A.ASM
// extern	void			SDL_SetDS(void),
// 						SDL_IndicatePC(boolean on);
// extern	void interrupt	SDL_t0ExtremeAsmService(void),
// 						SDL_t0FastAsmService(void),
// 						SDL_t0SlowAsmService(void);
// 
// //	Global variables
// 	boolean		SoundSourcePresent,
// 				AdLibPresent,
// 				SoundBlasterPresent,SBProPresent,
// 				NeedsDigitized,NeedsMusic,
// 				SoundPositioned;
// 	SDMode		SoundMode;
// 	SMMode		MusicMode;
// 	SDSMode		DigiMode;
// 	longword	TimeCount;
// 	word		HackCount;
// 	word		*SoundTable;	// Really * _seg *SoundTable, but that don't work
// 	boolean		ssIsTandy;
// 	word		ssPort = 2;
// 	int			DigiMap[LASTSOUND];
// 
// //	Internal variables
// static	boolean			SD_Started;
// 		boolean			nextsoundpos;
// 		longword		TimerDivisor,TimerCount;
// static	char			*ParmStrings[] =
// 						{
// 							"noal",
// 							"nosb",
// 							"nopro",
// 							"noss",
// 							"sst",
// 							"ss1",
// 							"ss2",
// 							"ss3",
// 							nil
// 						};
// static	void			(*SoundUserHook)(void);
// 		soundnames		SoundNumber,DigiNumber;
// 		word			SoundPriority,DigiPriority;
// 		int				LeftPosition,RightPosition;
// 		void interrupt	(*t0OldService)(void);
// 		long			LocalTime;
// 		word			TimerRate;
// 
// 		word			NumDigi,DigiLeft,DigiPage;
// 		word			_seg *DigiList;
// 		word			DigiLastStart,DigiLastEnd;
// 		boolean			DigiPlaying;
// static	boolean			DigiMissed,DigiLastSegment;
// static	memptr			DigiNextAddr;
// static	word			DigiNextLen;
// 
// //	SoundBlaster variables
// static	boolean					sbNoCheck,sbNoProCheck;
// static	volatile boolean		sbSamplePlaying;
// static	byte					sbOldIntMask = -1;
// static	volatile byte			huge *sbNextSegPtr;
// static	byte					sbDMA = 1,
// 								sbDMAa1 = 0x83,sbDMAa2 = 2,sbDMAa3 = 3,
// 								sba1Vals[] = {0x87,0x83,0,0x82},
// 								sba2Vals[] = {0,2,0,6},
// 								sba3Vals[] = {1,3,0,7};
// static	int						sbLocation = -1,sbInterrupt = 7,sbIntVec = 0xf,
// 								sbIntVectors[] = {-1,-1,0xa,0xb,-1,0xd,-1,0xf,-1,-1,-1};
// static	volatile longword		sbNextSegLen;
// static	volatile SampledSound	huge *sbSamples;
// static	void interrupt			(*sbOldIntHand)(void);
// static	byte					sbpOldFMMix,sbpOldVOCMix;
// 
// //	SoundSource variables
// 		boolean				ssNoCheck;
// 		boolean				ssActive;
// 		word				ssControl,ssStatus,ssData;
// 		byte				ssOn,ssOff;
// 		volatile byte		far *ssSample;
// 		volatile longword	ssLengthLeft;
// 
// //	PC Sound variables
// 		volatile byte	pcLastSample,far *pcSound;
// 		longword		pcLengthLeft;
// 		word			pcSoundLookup[255];
// 
// //	AdLib variables
// 		boolean			alNoCheck;
// 		byte			far *alSound;
// 		word			alBlock;
// 		longword		alLengthLeft;
// 		longword		alTimeCount;
// 		Instrument		alZeroInst;
// 
// // This table maps channel numbers to carrier and modulator op cells
// static	byte			carriers[9] =  { 3, 4, 5,11,12,13,19,20,21},
// 						modifiers[9] = { 0, 1, 2, 8, 9,10,16,17,18},
// // This table maps percussive voice numbers to op cells
// 						pcarriers[5] = {19,0xff,0xff,0xff,0xff},
// 						pmodifiers[5] = {16,17,18,20,21};
// 
// //	Sequencer variables
// 		boolean			sqActive;
// static	word			alFXReg;
// static	ActiveTrack		*tracks[sqMaxTracks],
// 						mytracks[sqMaxTracks];
// static	word			sqMode,sqFadeStep;
// 		word			far *sqHack,far *sqHackPtr,sqHackLen,sqHackSeqLen;
// 		long			sqHackTime;
// 
// //	Internal routines
// 		void			SDL_DigitizedDone(void);
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SetTimer0() - Sets system timer 0 to the specified speed
// //
// ///////////////////////////////////////////////////////////////////////////
// #pragma	argsused
// static void
// SDL_SetTimer0(word speed)
// {
// #ifndef TPROF	// If using Borland's profiling, don't screw with the timer
// asm	pushf
// asm	cli
// 
// 	outportb(0x43,0x36);				// Change timer 0
// 	outportb(0x40,speed);
// 	outportb(0x40,speed >> 8);
// 	// Kludge to handle special case for digitized PC sounds
// 	if (TimerDivisor == (1192030 / (TickBase * 100)))
// 		TimerDivisor = (1192030 / (TickBase * 10));
// 	else
// 		TimerDivisor = speed;
// 
// asm	popf
// #else
// 	TimerDivisor = 0x10000;
// #endif
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SetIntsPerSec() - Uses SDL_SetTimer0() to set the number of
// //		interrupts generated by system timer 0 per second
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_SetIntsPerSec(word ints)
// {
// 	TimerRate = ints;
// 	SDL_SetTimer0(1192030 / ints);
// }
// 
// static void
// SDL_SetTimerSpeed(void)
// {
// 	word	rate;
// 	void interrupt	(*isr)(void);
// 
// 	if ((DigiMode == sds_PC) && DigiPlaying)
// 	{
// 		rate = TickBase * 100;
// 		isr = SDL_t0ExtremeAsmService;
// 	}
// 	else if
// 	(
// 		(MusicMode == smm_AdLib)
// 	||	((DigiMode == sds_SoundSource) && DigiPlaying)
// 	)
// 	{
// 		rate = TickBase * 10;
// 		isr = SDL_t0FastAsmService;
// 	}
// 	else
// 	{
// 		rate = TickBase * 2;
// 		isr = SDL_t0SlowAsmService;
// 	}
// 
// 	if (rate != TimerRate)
// 	{
// 		setvect(8,isr);
// 		SDL_SetIntsPerSec(rate);
// 		TimerRate = rate;
// 	}
// }
// 
// //
// //	SoundBlaster code
// //
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SBStopSample() - Stops any active sampled sound and causes DMA
// //		requests from the SoundBlaster to cease
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_SBStopSample(void)
// {
// 	byte	is;
// 
// asm	pushf
// asm	cli
// 
// 	if (sbSamplePlaying)
// 	{
// 		sbSamplePlaying = false;
// 
// 		sbWriteDelay();
// 		sbOut(sbWriteCmd,0xd0);	// Turn off DSP DMA
// 
// 		is = inportb(0x21);	// Restore interrupt mask bit
// 		if (sbOldIntMask & (1 << sbInterrupt))
// 			is |= (1 << sbInterrupt);
// 		else
// 			is &= ~(1 << sbInterrupt);
// 		outportb(0x21,is);
// 	}
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SBPlaySeg() - Plays a chunk of sampled sound on the SoundBlaster
// //	Insures that the chunk doesn't cross a bank boundary, programs the DMA
// //	 controller, and tells the SB to start doing DMA requests for DAC
// //
// ///////////////////////////////////////////////////////////////////////////
// static longword
// SDL_SBPlaySeg(volatile byte huge *data,longword length)
// {
// 	unsigned		datapage;
// 	longword		dataofs,uselen;
// 
// 	uselen = length;
// 	datapage = FP_SEG(data) >> 12;
// 	dataofs = ((FP_SEG(data) & 0xfff) << 4) + FP_OFF(data);
// 	if (dataofs >= 0x10000)
// 	{
// 		datapage++;
// 		dataofs -= 0x10000;
// 	}
// 
// 	if (dataofs + uselen > 0x10000)
// 		uselen = 0x10000 - dataofs;
// 
// 	uselen--;
// 
// 	// Program the DMA controller
// asm	pushf
// asm	cli
// 	outportb(0x0a,sbDMA | 4);					// Mask off DMA on channel sbDMA
// 	outportb(0x0c,0);							// Clear byte ptr flip-flop to lower byte
// 	outportb(0x0b,0x49);						// Set transfer mode for D/A conv
// 	outportb(sbDMAa2,(byte)dataofs);			// Give LSB of address
// 	outportb(sbDMAa2,(byte)(dataofs >> 8));		// Give MSB of address
// 	outportb(sbDMAa1,(byte)datapage);			// Give page of address
// 	outportb(sbDMAa3,(byte)uselen);				// Give LSB of length
// 	outportb(sbDMAa3,(byte)(uselen >> 8));		// Give MSB of length
// 	outportb(0x0a,sbDMA);						// Re-enable DMA on channel sbDMA
// 
// 	// Start playing the thing
// 	sbWriteDelay();
// 	sbOut(sbWriteCmd,0x14);
// 	sbWriteDelay();
// 	sbOut(sbWriteData,(byte)uselen);
// 	sbWriteDelay();
// 	sbOut(sbWriteData,(byte)(uselen >> 8));
// asm	popf
// 
// 	return(uselen + 1);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SBService() - Services the SoundBlaster DMA interrupt
// //
// ///////////////////////////////////////////////////////////////////////////
// static void interrupt
// SDL_SBService(void)
// {
// 	longword	used;
// 
// 	sbIn(sbDataAvail);	// Ack interrupt to SB
// 
// 	if (sbNextSegPtr)
// 	{
// 		used = SDL_SBPlaySeg(sbNextSegPtr,sbNextSegLen);
// 		if (sbNextSegLen <= used)
// 			sbNextSegPtr = nil;
// 		else
// 		{
// 			sbNextSegPtr += used;
// 			sbNextSegLen -= used;
// 		}
// 	}
// 	else
// 	{
// 		SDL_SBStopSample();
// 		SDL_DigitizedDone();
// 	}
// 
// 	outportb(0x20,0x20);	// Ack interrupt
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SBPlaySample() - Plays a sampled sound on the SoundBlaster. Sets up
// //		DMA to play the sound
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_SBPlaySample(byte huge *data,longword len)
// {
// 	longword	used;
// 
// 	SDL_SBStopSample();
// 
// asm	pushf
// asm	cli
// 
// 	used = SDL_SBPlaySeg(data,len);
// 	if (len <= used)
// 		sbNextSegPtr = nil;
// 	else
// 	{
// 		sbNextSegPtr = data + used;
// 		sbNextSegLen = len - used;
// 	}
// 
// 	// Save old interrupt status and unmask ours
// 	sbOldIntMask = inportb(0x21);
// 	outportb(0x21,sbOldIntMask & ~(1 << sbInterrupt));
// 
// 	sbWriteDelay();
// 	sbOut(sbWriteCmd,0xd4);						// Make sure DSP DMA is enabled
// 
// 	sbSamplePlaying = true;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PositionSBP() - Sets the attenuation levels for the left and right
// //		channels by using the mixer chip on the SB Pro. This hits a hole in
// //		the address map for normal SBs.
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_PositionSBP(int leftpos,int rightpos)
// {
// 	byte	v;
// 
// 	if (!SBProPresent)
// 		return;
// 
// 	leftpos = 15 - leftpos;
// 	rightpos = 15 - rightpos;
// 	v = ((leftpos & 0x0f) << 4) | (rightpos & 0x0f);
// 
// asm	pushf
// asm	cli
// 
// 	sbOut(sbpMixerAddr,sbpmVoiceVol);
// 	sbOut(sbpMixerData,v);
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_CheckSB() - Checks to see if a SoundBlaster resides at a
// //		particular I/O location
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// SDL_CheckSB(int port)
// {
// 	int	i;
// 
// 	sbLocation = port << 4;		// Initialize stuff for later use
// 
// 	sbOut(sbReset,true);		// Reset the SoundBlaster DSP
// asm	mov	dx,0x388				// Wait >4usec
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// asm	in	al, dx
// 
// 	sbOut(sbReset,false);		// Turn off sb DSP reset
// asm	mov	dx,0x388				// Wait >100usec
// asm	mov	cx,100
// usecloop:
// asm	in	al,dx
// asm	loop usecloop
// 
// 	for (i = 0;i < 100;i++)
// 	{
// 		if (sbIn(sbDataAvail) & 0x80)		// If data is available...
// 		{
// 			if (sbIn(sbReadData) == 0xaa)	// If it matches correct value
// 				return(true);
// 			else
// 			{
// 				sbLocation = -1;			// Otherwise not a SoundBlaster
// 				return(false);
// 			}
// 		}
// 	}
// 	sbLocation = -1;						// Retry count exceeded - fail
// 	return(false);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	Checks to see if a SoundBlaster is in the system. If the port passed is
// //		-1, then it scans through all possible I/O locations. If the port
// //		passed is 0, then it uses the default (2). If the port is >0, then
// //		it just passes it directly to SDL_CheckSB()
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// SDL_DetectSoundBlaster(int port)
// {
// 	int	i;
// 
// 	if (port == 0)					// If user specifies default, use 2
// 		port = 2;
// 	if (port == -1)
// 	{
// 		if (SDL_CheckSB(2))			// Check default before scanning
// 			return(true);
// 
// 		if (SDL_CheckSB(4))			// Check other SB Pro location before scan
// 			return(true);
// 
// 		for (i = 1;i <= 6;i++)		// Scan through possible SB locations
// 		{
// 			if ((i == 2) || (i == 4))
// 				continue;
// 
// 			if (SDL_CheckSB(i))		// If found at this address,
// 				return(true);		//	return success
// 		}
// 		return(false);				// All addresses failed, return failure
// 	}
// 	else
// 		return(SDL_CheckSB(port));	// User specified address or default
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SBSetDMA() - Sets the DMA channel to be used by the SoundBlaster
// //		code. Sets up sbDMA, and sbDMAa1-sbDMAa3 (used by SDL_SBPlaySeg()).
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SDL_SBSetDMA(byte channel)
// {
// 	if (channel > 3)
// 		Quit("SDL_SBSetDMA() - invalid SoundBlaster DMA channel");
// 
// 	sbDMA = channel;
// 	sbDMAa1 = sba1Vals[channel];
// 	sbDMAa2 = sba2Vals[channel];
// 	sbDMAa3 = sba3Vals[channel];
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_StartSB() - Turns on the SoundBlaster
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_StartSB(void)
// {
// 	byte	timevalue,test;
// 
// 	sbIntVec = sbIntVectors[sbInterrupt];
// 	if (sbIntVec < 0)
// 		Quit("SDL_StartSB: Illegal or unsupported interrupt number for SoundBlaster");
// 
// 	sbOldIntHand = getvect(sbIntVec);	// Get old interrupt handler
// 	setvect(sbIntVec,SDL_SBService);	// Set mine
// 
// 	sbWriteDelay();
// 	sbOut(sbWriteCmd,0xd1);				// Turn on DSP speaker
// 
// 	// Set the SoundBlaster DAC time constant for 7KHz
// 	timevalue = 256 - (1000000 / 7000);
// 	sbWriteDelay();
// 	sbOut(sbWriteCmd,0x40);
// 	sbWriteDelay();
// 	sbOut(sbWriteData,timevalue);
// 
// 	SBProPresent = false;
// 	if (sbNoProCheck)
// 		return;
// 
// 	// Check to see if this is a SB Pro
// 	sbOut(sbpMixerAddr,sbpmFMVol);
// 	sbpOldFMMix = sbIn(sbpMixerData);
// 	sbOut(sbpMixerData,0xbb);
// 	test = sbIn(sbpMixerData);
// 	if (test == 0xbb)
// 	{
// 		// Boost FM output levels to be equivilent with digitized output
// 		sbOut(sbpMixerData,0xff);
// 		test = sbIn(sbpMixerData);
// 		if (test == 0xff)
// 		{
// 			SBProPresent = true;
// 
// 			// Save old Voice output levels (SB Pro)
// 			sbOut(sbpMixerAddr,sbpmVoiceVol);
// 			sbpOldVOCMix = sbIn(sbpMixerData);
// 
// 			// Turn SB Pro stereo DAC off
// 			sbOut(sbpMixerAddr,sbpmControl);
// 			sbOut(sbpMixerData,0);				// 0=off,2=on
// 		}
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ShutSB() - Turns off the SoundBlaster
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_ShutSB(void)
// {
// 	SDL_SBStopSample();
// 
// 	if (SBProPresent)
// 	{
// 		// Restore FM output levels (SB Pro)
// 		sbOut(sbpMixerAddr,sbpmFMVol);
// 		sbOut(sbpMixerData,sbpOldFMMix);
// 
// 		// Restore Voice output levels (SB Pro)
// 		sbOut(sbpMixerAddr,sbpmVoiceVol);
// 		sbOut(sbpMixerData,sbpOldVOCMix);
// 	}
// 
// 	setvect(sbIntVec,sbOldIntHand);		// Set vector back
// }
// 
// //	Sound Source Code
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SSStopSample() - Stops a sample playing on the Sound Source
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_SSStopSample(void)
// {
// asm	pushf
// asm	cli
// 
// 	(long)ssSample = 0;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SSService() - Handles playing the next sample on the Sound Source
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_SSService(void)
// {
// 	boolean	gotit;
// 	byte	v;
// 
// 	while (ssSample)
// 	{
// 	asm	mov		dx,[ssStatus]	// Check to see if FIFO is currently empty
// 	asm	in		al,dx
// 	asm	test	al,0x40
// 	asm	jnz		done			// Nope - don't push any more data out
// 
// 		v = *ssSample++;
// 		if (!(--ssLengthLeft))
// 		{
// 			(long)ssSample = 0;
// 			SDL_DigitizedDone();
// 		}
// 
// 	asm	mov		dx,[ssData]		// Pump the value out
// 	asm	mov		al,[v]
// 	asm	out		dx,al
// 
// 	asm	mov		dx,[ssControl]	// Pulse printer select
// 	asm	mov		al,[ssOff]
// 	asm	out		dx,al
// 	asm	push	ax
// 	asm	pop		ax
// 	asm	mov		al,[ssOn]
// 	asm	out		dx,al
// 
// 	asm	push	ax				// Delay a short while
// 	asm	pop		ax
// 	asm	push	ax
// 	asm	pop		ax
// 	}
// done:;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SSPlaySample() - Plays the specified sample on the Sound Source
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_SSPlaySample(byte huge *data,longword len)
// {
// asm	pushf
// asm	cli
// 
// 	ssLengthLeft = len;
// 	ssSample = (volatile byte far *)data;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_StartSS() - Sets up for and turns on the Sound Source
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_StartSS(void)
// {
// 	if (ssPort == 3)
// 		ssControl = 0x27a;	// If using LPT3
// 	else if (ssPort == 2)
// 		ssControl = 0x37a;	// If using LPT2
// 	else
// 		ssControl = 0x3be;	// If using LPT1
// 	ssStatus = ssControl - 1;
// 	ssData = ssStatus - 1;
// 
// 	ssOn = 0x04;
// 	if (ssIsTandy)
// 		ssOff = 0x0e;				// Tandy wierdness
// 	else
// 		ssOff = 0x0c;				// For normal machines
// 
// 	outportb(ssControl,ssOn);		// Enable SS
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ShutSS() - Turns off the Sound Source
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_ShutSS(void)
// {
// 	outportb(ssControl,ssOff);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_CheckSS() - Checks to see if a Sound Source is present at the
// //		location specified by the sound source variables
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// SDL_CheckSS(void)
// {
// 	boolean		present = false;
// 	longword	lasttime;
// 
// 	// Turn the Sound Source on and wait awhile (4 ticks)
// 	SDL_StartSS();
// 
// 	lasttime = TimeCount;
// 	while (TimeCount < lasttime + 4)
// 		;
// 
// asm	mov		dx,[ssStatus]	// Check to see if FIFO is currently empty
// asm	in		al,dx
// asm	test	al,0x40
// asm	jnz		checkdone		// Nope - Sound Source not here
// 
// asm	mov		cx,32			// Force FIFO overflow (FIFO is 16 bytes)
// outloop:
// asm	mov		dx,[ssData]		// Pump a neutral value out
// asm	mov		al,0x80
// asm	out		dx,al
// 
// asm	mov		dx,[ssControl]	// Pulse printer select
// asm	mov		al,[ssOff]
// asm	out		dx,al
// asm	push	ax
// asm	pop		ax
// asm	mov		al,[ssOn]
// asm	out		dx,al
// 
// asm	push	ax				// Delay a short while before we do this again
// asm	pop		ax
// asm	push	ax
// asm	pop		ax
// 
// asm	loop	outloop
// 
// asm	mov		dx,[ssStatus]	// Is FIFO overflowed now?
// asm	in		al,dx
// asm	test	al,0x40
// asm	jz		checkdone		// Nope, still not - Sound Source not here
// 
// 	present = true;			// Yes - it's here!
// 
// checkdone:
// 	SDL_ShutSS();
// 	return(present);
// }
// 
// static boolean
// SDL_DetectSoundSource(void)
// {
// 	for (ssPort = 1;ssPort <= 3;ssPort++)
// 		if (SDL_CheckSS())
// 			return(true);
// 	return(false);
// }
// 
// //
// //	PC Sound code
// //
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PCPlaySample() - Plays the specified sample on the PC speaker
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_PCPlaySample(byte huge *data,longword len)
// {
// asm	pushf
// asm	cli
// 
// 	SDL_IndicatePC(true);
// 
// 	pcLengthLeft = len;
// 	pcSound = (volatile byte far *)data;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PCStopSample() - Stops a sample playing on the PC speaker
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_PCStopSample(void)
// {
// asm	pushf
// asm	cli
// 
// 	(long)pcSound = 0;
// 
// 	SDL_IndicatePC(false);
// 
// asm	in	al,0x61		  	// Turn the speaker off
// asm	and	al,0xfd			// ~2
// asm	out	0x61,al
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PCPlaySound() - Plays the specified sound on the PC speaker
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_PCPlaySound(PCSound far *sound)
// {
// asm	pushf
// asm	cli
// 
// 	pcLastSample = -1;
// 	pcLengthLeft = sound->common.length;
// 	pcSound = sound->data;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PCStopSound() - Stops the current sound playing on the PC Speaker
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_PCStopSound(void)
// {
// asm	pushf
// asm	cli
// 
// 	(long)pcSound = 0;
// 
// asm	in	al,0x61		  	// Turn the speaker off
// asm	and	al,0xfd			// ~2
// asm	out	0x61,al
// 
// asm	popf
// }
// 
// #if 0
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_PCService() - Handles playing the next sample in a PC sound
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_PCService(void)
// {
// 	byte	s;
// 	word	t;
// 
// 	if (pcSound)
// 	{
// 		s = *pcSound++;
// 		if (s != pcLastSample)
// 		{
// 		asm	pushf
// 		asm	cli
// 
// 			pcLastSample = s;
// 			if (s)					// We have a frequency!
// 			{
// 				t = pcSoundLookup[s];
// 			asm	mov	bx,[t]
// 
// 			asm	mov	al,0xb6			// Write to channel 2 (speaker) timer
// 			asm	out	43h,al
// 			asm	mov	al,bl
// 			asm	out	42h,al			// Low byte
// 			asm	mov	al,bh
// 			asm	out	42h,al			// High byte
// 
// 			asm	in	al,0x61			// Turn the speaker & gate on
// 			asm	or	al,3
// 			asm	out	0x61,al
// 			}
// 			else					// Time for some silence
// 			{
// 			asm	in	al,0x61		  	// Turn the speaker & gate off
// 			asm	and	al,0xfc			// ~3
// 			asm	out	0x61,al
// 			}
// 
// 		asm	popf
// 		}
// 
// 		if (!(--pcLengthLeft))
// 		{
// 			SDL_PCStopSound();
// 			SDL_SoundFinished();
// 		}
// 	}
// }
// #endif
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ShutPC() - Turns off the pc speaker
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_ShutPC(void)
// {
// asm	pushf
// asm	cli
// 
// 	pcSound = 0;
// 
// asm	in	al,0x61		  	// Turn the speaker & gate off
// asm	and	al,0xfc			// ~3
// asm	out	0x61,al
// 
// asm	popf
// }
// 
// //
// //	Stuff for digitized sounds
// //
// memptr
// SDL_LoadDigiSegment(word page)
// {
// 	memptr	addr;
// 
// #if 0	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,10	// bright green
// asm	out	dx,al
// #endif
// 
// 	addr = PM_GetSoundPage(page);
// 	PM_SetPageLock(PMSoundStart + page,pml_Locked);
// 
// #if 0	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,3	// blue
// asm	out	dx,al
// asm	mov	al,0x20	// normal
// asm	out	dx,al
// #endif
// 
// 	return(addr);
// }
// 
// void
// SDL_PlayDigiSegment(memptr addr,word len)
// {
// 	switch (DigiMode)
// 	{
// 	case sds_PC:
//     	SDL_PCPlaySample(addr,len);
// 		break;
// 	case sds_SoundSource:
// 		SDL_SSPlaySample(addr,len);
// 		break;
// 	case sds_SoundBlaster:
// 		SDL_SBPlaySample(addr,len);
// 		break;
// 	}
// }
// 
// void
// SD_StopDigitized(void)
// {
// 	int	i;
// 
// asm	pushf
// asm	cli
// 
// 	DigiLeft = 0;
// 	DigiNextAddr = nil;
// 	DigiNextLen = 0;
// 	DigiMissed = false;
// 	DigiPlaying = false;
// 	DigiNumber = DigiPriority = 0;
// 	SoundPositioned = false;
// 	if ((DigiMode == sds_PC) && (SoundMode == sdm_PC))
// 		SDL_SoundFinished();
// 
// 	switch (DigiMode)
// 	{
// 	case sds_PC:
// 		SDL_PCStopSample();
// 		break;
// 	case sds_SoundSource:
// 		SDL_SSStopSample();
// 		break;
// 	case sds_SoundBlaster:
// 		SDL_SBStopSample();
// 		break;
// 	}
// 
// asm	popf
// 
// 	for (i = DigiLastStart;i < DigiLastEnd;i++)
// 		PM_SetPageLock(i + PMSoundStart,pml_Unlocked);
// 	DigiLastStart = 1;
// 	DigiLastEnd = 0;
// }
// 
// void
// SD_Poll(void)
// {
// 	if (DigiLeft && !DigiNextAddr)
// 	{
// 		DigiNextLen = (DigiLeft >= PMPageSize)? PMPageSize : (DigiLeft % PMPageSize);
// 		DigiLeft -= DigiNextLen;
// 		if (!DigiLeft)
// 			DigiLastSegment = true;
// 		DigiNextAddr = SDL_LoadDigiSegment(DigiPage++);
// 	}
// 	if (DigiMissed && DigiNextAddr)
// 	{
// 		SDL_PlayDigiSegment(DigiNextAddr,DigiNextLen);
// 		DigiNextAddr = nil;
// 		DigiMissed = false;
// 		if (DigiLastSegment)
// 		{
// 			DigiPlaying = false;
// 			DigiLastSegment = false;
// 		}
// 	}
// 	SDL_SetTimerSpeed();
// }
// 
// void
// SD_SetPosition(int leftpos,int rightpos)
// {
// 	if
// 	(
// 		(leftpos < 0)
// 	||	(leftpos > 15)
// 	||	(rightpos < 0)
// 	||	(rightpos > 15)
// 	||	((leftpos == 15) && (rightpos == 15))
// 	)
// 		Quit("SD_SetPosition: Illegal position");
// 
// 	switch (DigiMode)
// 	{
// 	case sds_SoundBlaster:
// 		SDL_PositionSBP(leftpos,rightpos);
// 		break;
// 	}
// }
// 
// void
// SD_PlayDigitized(word which,int leftpos,int rightpos)
// {
// 	word	len;
// 	memptr	addr;
// 
// 	if (!DigiMode)
// 		return;
// 
// 	SD_StopDigitized();
// 	if (which >= NumDigi)
// 		Quit("SD_PlayDigitized: bad sound number");
// 
// 	SD_SetPosition(leftpos,rightpos);
// 
// 	DigiPage = DigiList[(which * 2) + 0];
// 	DigiLeft = DigiList[(which * 2) + 1];
// 
// 	DigiLastStart = DigiPage;
// 	DigiLastEnd = DigiPage + ((DigiLeft + (PMPageSize - 1)) / PMPageSize);
// 
// 	len = (DigiLeft >= PMPageSize)? PMPageSize : (DigiLeft % PMPageSize);
// 	addr = SDL_LoadDigiSegment(DigiPage++);
// 
// 	DigiPlaying = true;
// 	DigiLastSegment = false;
// 
// 	SDL_PlayDigiSegment(addr,len);
// 	DigiLeft -= len;
// 	if (!DigiLeft)
// 		DigiLastSegment = true;
// 
// 	SD_Poll();
// }
// 
// void
// SDL_DigitizedDone(void)
// {
// 	if (DigiNextAddr)
// 	{
// 		SDL_PlayDigiSegment(DigiNextAddr,DigiNextLen);
// 		DigiNextAddr = nil;
// 		DigiMissed = false;
// 	}
// 	else
// 	{
// 		if (DigiLastSegment)
// 		{
// 			DigiPlaying = false;
// 			DigiLastSegment = false;
// 			if ((DigiMode == sds_PC) && (SoundMode == sdm_PC))
// 			{
// 				SDL_SoundFinished();
// 			}
// 			else
// 				DigiNumber = DigiPriority = 0;
// 			SoundPositioned = false;
// 		}
// 		else
// 			DigiMissed = true;
// 	}
// }
// 
// void
// SD_SetDigiDevice(SDSMode mode)
// {
// 	boolean	devicenotpresent;
// 
// 	if (mode == DigiMode)
// 		return;
// 
// 	SD_StopDigitized();
// 
// 	devicenotpresent = false;
// 	switch (mode)
// 	{
// 	case sds_SoundBlaster:
// 		if (!SoundBlasterPresent)
// 		{
// 			if (SoundSourcePresent)
// 				mode = sds_SoundSource;
// 			else
// 				devicenotpresent = true;
// 		}
// 		break;
// 	case sds_SoundSource:
// 		if (!SoundSourcePresent)
// 			devicenotpresent = true;
// 		break;
// 	}
// 
// 	if (!devicenotpresent)
// 	{
// 		if (DigiMode == sds_SoundSource)
// 			SDL_ShutSS();
// 
// 		DigiMode = mode;
// 
// 		if (mode == sds_SoundSource)
// 			SDL_StartSS();
// 
// 		SDL_SetTimerSpeed();
// 	}
// }
// 
// void
// SDL_SetupDigi(void)
// {
// 	memptr	list;
// 	word	far *p,
// 			pg;
// 	int		i;
// 
// 	PM_UnlockMainMem();
// 	MM_GetPtr(&list,PMPageSize);
// 	PM_CheckMainMem();
// 	p = (word far *)MK_FP(PM_GetPage(ChunksInFile - 1),0);
// 	_fmemcpy((void far *)list,(void far *)p,PMPageSize);
// 	pg = PMSoundStart;
// 	for (i = 0;i < PMPageSize / (sizeof(word) * 2);i++,p += 2)
// 	{
// 		if (pg >= ChunksInFile - 1)
// 			break;
// 		pg += (p[1] + (PMPageSize - 1)) / PMPageSize;
// 	}
// 	PM_UnlockMainMem();
// 	MM_GetPtr((memptr *)&DigiList,i * sizeof(word) * 2);
// 	_fmemcpy((void far *)DigiList,(void far *)list,i * sizeof(word) * 2);
// 	MM_FreePtr(&list);
// 	NumDigi = i;
// 
// 	for (i = 0;i < LASTSOUND;i++)
// 		DigiMap[i] = -1;
// }
// 
// // 	AdLib Code
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	alOut(n,b) - Puts b in AdLib card register n
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// alOut(byte n,byte b)
// {
// asm	pushf
// asm	cli
// 
// asm	mov	dx,0x388
// asm	mov	al,[n]
// asm	out	dx,al
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	inc	dx
// asm	mov	al,[b]
// asm	out	dx,al
// 
// asm	popf
// 
// asm	dec	dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// 
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// 
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// 
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// asm	in	al,dx
// }
// 
// #if 0
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_SetInstrument() - Puts an instrument into a generator
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_SetInstrument(int track,int which,Instrument far *inst,boolean percussive)
// {
// 	byte		c,m;
// 
// 	if (percussive)
// 	{
// 		c = pcarriers[which];
// 		m = pmodifiers[which];
// 	}
// 	else
// 	{
// 		c = carriers[which];
// 		m = modifiers[which];
// 	}
// 
// 	tracks[track - 1]->inst = *inst;
// 	tracks[track - 1]->percussive = percussive;
// 
// 	alOut(m + alChar,inst->mChar);
// 	alOut(m + alScale,inst->mScale);
// 	alOut(m + alAttack,inst->mAttack);
// 	alOut(m + alSus,inst->mSus);
// 	alOut(m + alWave,inst->mWave);
// 
// 	// Most percussive instruments only use one cell
// 	if (c != 0xff)
// 	{
// 		alOut(c + alChar,inst->cChar);
// 		alOut(c + alScale,inst->cScale);
// 		alOut(c + alAttack,inst->cAttack);
// 		alOut(c + alSus,inst->cSus);
// 		alOut(c + alWave,inst->cWave);
// 	}
// 
// 	alOut(which + alFeedCon,inst->nConn);	// DEBUG - I think this is right
// }
// #endif
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ALStopSound() - Turns off any sound effects playing through the
// //		AdLib card
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_ALStopSound(void)
// {
// asm	pushf
// asm	cli
// 
// 	(long)alSound = 0;
// 	alOut(alFreqH + 0,0);
// 
// asm	popf
// }
// 
// static void
// SDL_AlSetFXInst(Instrument far *inst)
// {
// 	byte		c,m;
// 
// 	m = modifiers[0];
// 	c = carriers[0];
// 	alOut(m + alChar,inst->mChar);
// 	alOut(m + alScale,inst->mScale);
// 	alOut(m + alAttack,inst->mAttack);
// 	alOut(m + alSus,inst->mSus);
// 	alOut(m + alWave,inst->mWave);
// 	alOut(c + alChar,inst->cChar);
// 	alOut(c + alScale,inst->cScale);
// 	alOut(c + alAttack,inst->cAttack);
// 	alOut(c + alSus,inst->cSus);
// 	alOut(c + alWave,inst->cWave);
// 
// 	// Note: Switch commenting on these lines for old MUSE compatibility
// //	alOut(alFeedCon,inst->nConn);
// 	alOut(alFeedCon,0);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ALPlaySound() - Plays the specified sound on the AdLib card
// //
// ///////////////////////////////////////////////////////////////////////////
// #ifdef	_MUSE_
// void
// #else
// static void
// #endif
// SDL_ALPlaySound(AdLibSound far *sound)
// {
// 	Instrument	far *inst;
// 	byte		huge *data;
// 
// 	SDL_ALStopSound();
// 
// asm	pushf
// asm	cli
// 
// 	alLengthLeft = sound->common.length;
// 	data = sound->data;
// 	data++;
// 	data--;
// 	alSound = (byte far *)data;
// 	alBlock = ((sound->block & 7) << 2) | 0x20;
// 	inst = &sound->inst;
// 
// 	if (!(inst->mSus | inst->cSus))
// 	{
// 	asm	popf
// 		Quit("SDL_ALPlaySound() - Bad instrument");
// 	}
// 
// 	SDL_AlSetFXInst(&alZeroInst);	// DEBUG
// 	SDL_AlSetFXInst(inst);
// 
// asm	popf
// }
// 
// #if 0
// ///////////////////////////////////////////////////////////////////////////
// //
// // 	SDL_ALSoundService() - Plays the next sample out through the AdLib card
// //
// ///////////////////////////////////////////////////////////////////////////
// //static void
// void
// SDL_ALSoundService(void)
// {
// 	byte	s;
// 
// 	if (alSound)
// 	{
// 		s = *alSound++;
// 		if (!s)
// 			alOut(alFreqH + 0,0);
// 		else
// 		{
// 			alOut(alFreqL + 0,s);
// 			alOut(alFreqH + 0,alBlock);
// 		}
// 
// 		if (!(--alLengthLeft))
// 		{
// 			(long)alSound = 0;
// 			alOut(alFreqH + 0,0);
// 			SDL_SoundFinished();
// 		}
// 	}
// }
// #endif
// 
// #if 0
// void
// SDL_ALService(void)
// {
// 	byte	a,v;
// 	word	w;
// 
// 	if (!sqActive)
// 		return;
// 
// 	while (sqHackLen && (sqHackTime <= alTimeCount))
// 	{
// 		w = *sqHackPtr++;
// 		sqHackTime = alTimeCount + *sqHackPtr++;
// 	asm	mov	dx,[w]
// 	asm	mov	[a],dl
// 	asm	mov	[v],dh
// 		alOut(a,v);
// 		sqHackLen -= 4;
// 	}
// 	alTimeCount++;
// 	if (!sqHackLen)
// 	{
// 		sqHackPtr = (word far *)sqHack;
// 		sqHackLen = sqHackSeqLen;
// 		alTimeCount = sqHackTime = 0;
// 	}
// }
// #endif
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ShutAL() - Shuts down the AdLib card for sound effects
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_ShutAL(void)
// {
// asm	pushf
// asm	cli
// 
// 	alOut(alEffects,0);
// 	alOut(alFreqH + 0,0);
// 	SDL_AlSetFXInst(&alZeroInst);
// 	alSound = 0;
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_CleanAL() - Totally shuts down the AdLib card
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_CleanAL(void)
// {
// 	int	i;
// 
// asm	pushf
// asm	cli
// 
// 	alOut(alEffects,0);
// 	for (i = 1;i < 0xf5;i++)
// 		alOut(i,0);
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_StartAL() - Starts up the AdLib card for sound effects
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_StartAL(void)
// {
// 	alFXReg = 0;
// 	alOut(alEffects,alFXReg);
// 	SDL_AlSetFXInst(&alZeroInst);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_DetectAdLib() - Determines if there's an AdLib (or SoundBlaster
// //		emulating an AdLib) present
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// SDL_DetectAdLib(void)
// {
// 	byte	status1,status2;
// 	int		i;
// 
// 	alOut(4,0x60);	// Reset T1 & T2
// 	alOut(4,0x80);	// Reset IRQ
// 	status1 = readstat();
// 	alOut(2,0xff);	// Set timer 1
// 	alOut(4,0x21);	// Start timer 1
// #if 0
// 	SDL_Delay(TimerDelay100);
// #else
// asm	mov	dx,0x388
// asm	mov	cx,100
// usecloop:
// asm	in	al,dx
// asm	loop usecloop
// #endif
// 
// 	status2 = readstat();
// 	alOut(4,0x60);
// 	alOut(4,0x80);
// 
// 	if (((status1 & 0xe0) == 0x00) && ((status2 & 0xe0) == 0xc0))
// 	{
// 		for (i = 1;i <= 0xf5;i++)	// Zero all the registers
// 			alOut(i,0);
// 
// 		alOut(1,0x20);	// Set WSE=1
// 		alOut(8,0);		// Set CSM=0 & SEL=0
// 
// 		return(true);
// 	}
// 	else
// 		return(false);
// }
// 
// #if 0
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_t0Service() - My timer 0 ISR which handles the different timings and
// //		dispatches to whatever other routines are appropriate
// //
// ///////////////////////////////////////////////////////////////////////////
// static void interrupt
// SDL_t0Service(void)
// {
// static	word	count = 1;
// 
// #if 1	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,4	// red
// asm	out	dx,al
// #endif
// 
// 	HackCount++;
// 
// 	if ((MusicMode == smm_AdLib) || (DigiMode == sds_SoundSource))
// 	{
// 		SDL_ALService();
// 		SDL_SSService();
// //		if (!(++count & 7))
// 		if (!(++count % 10))
// 		{
// 			LocalTime++;
// 			TimeCount++;
// 			if (SoundUserHook)
// 				SoundUserHook();
// 		}
// //		if (!(count & 3))
// 		if (!(count % 5))
// 		{
// 			switch (SoundMode)
// 			{
// 			case sdm_PC:
// 				SDL_PCService();
// 				break;
// 			case sdm_AdLib:
// 				SDL_ALSoundService();
// 				break;
// 			}
// 		}
// 	}
// 	else
// 	{
// 		if (!(++count & 1))
// 		{
// 			LocalTime++;
// 			TimeCount++;
// 			if (SoundUserHook)
// 				SoundUserHook();
// 		}
// 		switch (SoundMode)
// 		{
// 		case sdm_PC:
// 			SDL_PCService();
// 			break;
// 		case sdm_AdLib:
// 			SDL_ALSoundService();
// 			break;
// 		}
// 	}
// 
// asm	mov	ax,[WORD PTR TimerCount]
// asm	add	ax,[WORD PTR TimerDivisor]
// asm	mov	[WORD PTR TimerCount],ax
// asm	jnc	myack
// 	t0OldService();			// If we overflow a word, time to call old int handler
// asm	jmp	olddone
// myack:;
// 	outportb(0x20,0x20);	// Ack the interrupt
// olddone:;
// 
// #if 1	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,3	// blue
// asm	out	dx,al
// asm	mov	al,0x20	// normal
// asm	out	dx,al
// #endif
// }
// #endif
// 
// ////////////////////////////////////////////////////////////////////////////
// //
// //	SDL_ShutDevice() - turns off whatever device was being used for sound fx
// //
// ////////////////////////////////////////////////////////////////////////////
// static void
// SDL_ShutDevice(void)
// {
// 	switch (SoundMode)
// 	{
// 	case sdm_PC:
// 		SDL_ShutPC();
// 		break;
// 	case sdm_AdLib:
// 		SDL_ShutAL();
// 		break;
// 	}
// 	SoundMode = sdm_Off;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_CleanDevice() - totally shuts down all sound devices
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_CleanDevice(void)
// {
// 	if ((SoundMode == sdm_AdLib) || (MusicMode == smm_AdLib))
// 		SDL_CleanAL();
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SDL_StartDevice() - turns on whatever device is to be used for sound fx
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// SDL_StartDevice(void)
// {
// 	switch (SoundMode)
// 	{
// 	case sdm_AdLib:
// 		SDL_StartAL();
// 		break;
// 	}
// 	SoundNumber = SoundPriority = 0;
// }
// 
// //	Public routines
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_SetSoundMode() - Sets which sound hardware to use for sound effects
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean
// SD_SetSoundMode(SDMode mode)
// {
// 	boolean	result = false;
// 	word	tableoffset;
// 
// 	SD_StopSound();
// 
// #ifndef	_MUSE_
// 	if ((mode == sdm_AdLib) && !AdLibPresent)
// 		mode = sdm_PC;
// 
// 	switch (mode)
// 	{
// 	case sdm_Off:
// 		NeedsDigitized = false;
// 		result = true;
// 		break;
// 	case sdm_PC:
// 		tableoffset = STARTPCSOUNDS;
// 		NeedsDigitized = false;
// 		result = true;
// 		break;
// 	case sdm_AdLib:
// 		if (AdLibPresent)
// 		{
// 			tableoffset = STARTADLIBSOUNDS;
// 			NeedsDigitized = false;
// 			result = true;
// 		}
// 		break;
// 	}
// #else
// 	result = true;
// #endif
// 
// 	if (result && (mode != SoundMode))
// 	{
// 		SDL_ShutDevice();
// 		SoundMode = mode;
// #ifndef	_MUSE_
// 		SoundTable = (word *)(&audiosegs[tableoffset]);
// #endif
// 		SDL_StartDevice();
// 	}
// 
// 	SDL_SetTimerSpeed();
// 
// 	return(result);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_SetMusicMode() - sets the device to use for background music
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean
// SD_SetMusicMode(SMMode mode)
// {
// 	boolean	result = false;
// 
// 	SD_FadeOutMusic();
// 	while (SD_MusicPlaying())
// 		;
// 
// 	switch (mode)
// 	{
// 	case smm_Off:
// 		NeedsMusic = false;
// 		result = true;
// 		break;
// 	case smm_AdLib:
// 		if (AdLibPresent)
// 		{
// 			NeedsMusic = true;
// 			result = true;
// 		}
// 		break;
// 	}
// 
// 	if (result)
// 		MusicMode = mode;
// 
// 	SDL_SetTimerSpeed();
// 
// 	return(result);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_Startup() - starts up the Sound Mgr
// //		Detects all additional sound hardware and installs my ISR
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_Startup(void)
// {
// 	int	i;
// 
// 	if (SD_Started)
// 		return;
// 
// 	SDL_SetDS();
// 
// 	ssIsTandy = false;
// 	ssNoCheck = false;
// 	alNoCheck = false;
// 	sbNoCheck = false;
// 	sbNoProCheck = false;
// #ifndef	_MUSE_
// 	for (i = 1;i < _argc;i++)
// 	{
// 		switch (US_CheckParm(_argv[i],ParmStrings))
// 		{
// 		case 0:						// No AdLib detection
// 			alNoCheck = true;
// 			break;
// 		case 1:						// No SoundBlaster detection
// 			sbNoCheck = true;
// 			break;
// 		case 2:						// No SoundBlaster Pro detection
// 			sbNoProCheck = true;
// 			break;
// 		case 3:
// 			ssNoCheck = true;		// No Sound Source detection
// 			break;
// 		case 4:						// Tandy Sound Source handling
// 			ssIsTandy = true;
// 			break;
// 		case 5:						// Sound Source present at LPT1
// 			ssPort = 1;
// 			ssNoCheck = SoundSourcePresent = true;
// 			break;
// 		case 6:                     // Sound Source present at LPT2
// 			ssPort = 2;
// 			ssNoCheck = SoundSourcePresent = true;
// 			break;
// 		case 7:                     // Sound Source present at LPT3
// 			ssPort = 3;
// 			ssNoCheck = SoundSourcePresent = true;
// 			break;
// 		}
// 	}
// #endif
// 
// 	SoundUserHook = 0;
// 
// 	t0OldService = getvect(8);	// Get old timer 0 ISR
// 
// 	LocalTime = TimeCount = alTimeCount = 0;
// 
// 	SD_SetSoundMode(sdm_Off);
// 	SD_SetMusicMode(smm_Off);
// 
// 	if (!ssNoCheck)
// 		SoundSourcePresent = SDL_DetectSoundSource();
// 
// 	if (!alNoCheck)
// 	{
// 		AdLibPresent = SDL_DetectAdLib();
// 		if (AdLibPresent && !sbNoCheck)
// 		{
// 			int port = -1;
// 			char *env = getenv("BLASTER");
// 			if (env)
// 			{
// 				long temp;
// 				while (*env)
// 				{
// 					while (isspace(*env))
// 						env++;
// 
// 					switch (toupper(*env))
// 					{
// 					case 'A':
// 						temp = strtol(env + 1,&env,16);
// 						if
// 						(
// 							(temp >= 0x210)
// 						&&	(temp <= 0x260)
// 						&&	(!(temp & 0x00f))
// 						)
// 							port = (temp - 0x200) >> 4;
// 						else
// 							Quit("SD_Startup: Unsupported address value in BLASTER");
// 						break;
// 					case 'I':
// 						temp = strtol(env + 1,&env,10);
// 						if
// 						(
// 							(temp >= 0)
// 						&&	(temp <= 10)
// 						&&	(sbIntVectors[temp] != -1)
// 						)
// 						{
// 							sbInterrupt = temp;
// 							sbIntVec = sbIntVectors[sbInterrupt];
// 						}
// 						else
// 							Quit("SD_Startup: Unsupported interrupt value in BLASTER");
// 						break;
// 					case 'D':
// 						temp = strtol(env + 1,&env,10);
// 						if ((temp == 0) || (temp == 1) || (temp == 3))
// 							SDL_SBSetDMA(temp);
// 						else
// 							Quit("SD_Startup: Unsupported DMA value in BLASTER");
// 						break;
// 					default:
// 						while (isspace(*env))
// 							env++;
// 						while (*env && !isspace(*env))
// 							env++;
// 						break;
// 					}
// 				}
// 			}
// 			SoundBlasterPresent = SDL_DetectSoundBlaster(port);
// 		}
// 	}
// 
// 	for (i = 0;i < 255;i++)
// 		pcSoundLookup[i] = i * 60;
// 
// 	if (SoundBlasterPresent)
// 		SDL_StartSB();
// 
// 	SDL_SetupDigi();
// 
// 	SD_Started = true;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_Default() - Sets up the default behaviour for the Sound Mgr whether
// //		the config file was present or not.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_Default(boolean gotit,SDMode sd,SMMode sm)
// {
// 	boolean	gotsd,gotsm;
// 
// 	gotsd = gotsm = gotit;
// 
// 	if (gotsd)	// Make sure requested sound hardware is available
// 	{
// 		switch (sd)
// 		{
// 		case sdm_AdLib:
// 			gotsd = AdLibPresent;
// 			break;
// 		}
// 	}
// 	if (!gotsd)
// 	{
// 		if (AdLibPresent)
// 			sd = sdm_AdLib;
// 		else
// 			sd = sdm_PC;
// 	}
// 	if (sd != SoundMode)
// 		SD_SetSoundMode(sd);
// 
// 
// 	if (gotsm)	// Make sure requested music hardware is available
// 	{
// 		switch (sm)
// 		{
// 		case sdm_AdLib:
// 			gotsm = AdLibPresent;
// 			break;
// 		}
// 	}
// 	if (!gotsm)
// 	{
// 		if (AdLibPresent)
// 			sm = smm_AdLib;
// 	}
// 	if (sm != MusicMode)
// 		SD_SetMusicMode(sm);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_Shutdown() - shuts down the Sound Mgr
// //		Removes sound ISR and turns off whatever sound hardware was active
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_Shutdown(void)
// {
// 	if (!SD_Started)
// 		return;
// 
// 	SD_MusicOff();
// 	SD_StopSound();
// 	SDL_ShutDevice();
// 	SDL_CleanDevice();
// 
// 	if (SoundBlasterPresent)
// 		SDL_ShutSB();
// 
// 	if (SoundSourcePresent)
// 		SDL_ShutSS();
// 
// 	asm	pushf
// 	asm	cli
// 
// 	SDL_SetTimer0(0);
// 
// 	setvect(8,t0OldService);
// 
// 	asm	popf
// 
// 	SD_Started = false;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_SetUserHook() - sets the routine that the Sound Mgr calls every 1/70th
// //		of a second from its timer 0 ISR
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_SetUserHook(void (* hook)(void))
// {
// 	SoundUserHook = hook;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_PositionSound() - Sets up a stereo imaging location for the next
// //		sound to be played. Each channel ranges from 0 to 15.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_PositionSound(int leftvol,int rightvol)
// {
// 	LeftPosition = leftvol;
// 	RightPosition = rightvol;
// 	nextsoundpos = true;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_PlaySound() - plays the specified sound on the appropriate hardware
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean
// SD_PlaySound(soundnames sound)
// {
// 	boolean		ispos;
// 	SoundCommon	far *s;
// 	int	lp,rp;
// 
// 	lp = LeftPosition;
// 	rp = RightPosition;
// 	LeftPosition = 0;
// 	RightPosition = 0;
// 
// 	ispos = nextsoundpos;
// 	nextsoundpos = false;
// 
// 	if (sound == -1)
// 		return(false);
// 
// 	s = MK_FP(SoundTable[sound],0);
// 	if ((SoundMode != sdm_Off) && !s)
// 		Quit("SD_PlaySound() - Uncached sound");
// 
// 	if ((DigiMode != sds_Off) && (DigiMap[sound] != -1))
// 	{
// 		if ((DigiMode == sds_PC) && (SoundMode == sdm_PC))
// 		{
// 			if (s->priority < SoundPriority)
// 				return(false);
// 
// 			SDL_PCStopSound();
// 
// 			SD_PlayDigitized(DigiMap[sound],lp,rp);
// 			SoundPositioned = ispos;
// 			SoundNumber = sound;
// 			SoundPriority = s->priority;
// 		}
// 		else
// 		{
// 		asm	pushf
// 		asm	cli
// 			if (DigiPriority && !DigiNumber)
// 			{
// 			asm	popf
// 				Quit("SD_PlaySound: Priority without a sound");
// 			}
// 		asm	popf
// 
// 			if (s->priority < DigiPriority)
// 				return(false);
// 
// 			SD_PlayDigitized(DigiMap[sound],lp,rp);
// 			SoundPositioned = ispos;
// 			DigiNumber = sound;
// 			DigiPriority = s->priority;
// 		}
// 
// 		return(true);
// 	}
// 
// 	if (SoundMode == sdm_Off)
// 		return(false);
// 	if (!s->length)
// 		Quit("SD_PlaySound() - Zero length sound");
// 	if (s->priority < SoundPriority)
// 		return(false);
// 
// 	switch (SoundMode)
// 	{
// 	case sdm_PC:
// 		SDL_PCPlaySound((void far *)s);
// 		break;
// 	case sdm_AdLib:
// 		SDL_ALPlaySound((void far *)s);
// 		break;
// 	}
// 
// 	SoundNumber = sound;
// 	SoundPriority = s->priority;
// 
// 	return(false);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_SoundPlaying() - returns the sound number that's playing, or 0 if
// //		no sound is playing
// //
// ///////////////////////////////////////////////////////////////////////////
// word
// SD_SoundPlaying(void)
// {
// 	boolean	result = false;
// 
// 	switch (SoundMode)
// 	{
// 	case sdm_PC:
// 		result = pcSound? true : false;
// 		break;
// 	case sdm_AdLib:
// 		result = alSound? true : false;
// 		break;
// 	}
// 
// 	if (result)
// 		return(SoundNumber);
// 	else
// 		return(false);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_StopSound() - if a sound is playing, stops it
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_StopSound(void)
// {
// 	if (DigiPlaying)
// 		SD_StopDigitized();
// 
// 	switch (SoundMode)
// 	{
// 	case sdm_PC:
// 		SDL_PCStopSound();
// 		break;
// 	case sdm_AdLib:
// 		SDL_ALStopSound();
// 		break;
// 	}
// 
// 	SoundPositioned = false;
// 
// 	SDL_SoundFinished();
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_WaitSoundDone() - waits until the current sound is done playing
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_WaitSoundDone(void)
// {
// 	while (SD_SoundPlaying())
// 		;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_MusicOn() - turns on the sequencer
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_MusicOn(void)
// {
// 	sqActive = true;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_MusicOff() - turns off the sequencer and any playing notes
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_MusicOff(void)
// {
// 	word	i;
// 
// 
// 	switch (MusicMode)
// 	{
// 	case smm_AdLib:
// 		alFXReg = 0;
// 		alOut(alEffects,0);
// 		for (i = 0;i < sqMaxTracks;i++)
// 			alOut(alFreqH + i + 1,0);
// 		break;
// 	}
// 	sqActive = false;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_StartMusic() - starts playing the music pointed to
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_StartMusic(MusicGroup far *music)
// {
// 	SD_MusicOff();
// asm	pushf
// asm	cli
// 
// 	if (MusicMode == smm_AdLib)
// 	{
// 		sqHackPtr = sqHack = music->values;
// 		sqHackSeqLen = sqHackLen = music->length;
// 		sqHackTime = 0;
// 		alTimeCount = 0;
// 		SD_MusicOn();
// 	}
// 
// asm	popf
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_FadeOutMusic() - starts fading out the music. Call SD_MusicPlaying()
// //		to see if the fadeout is complete
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// SD_FadeOutMusic(void)
// {
// 	switch (MusicMode)
// 	{
// 	case smm_AdLib:
// 		// DEBUG - quick hack to turn the music off
// 		SD_MusicOff();
// 		break;
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	SD_MusicPlaying() - returns true if music is currently playing, false if
// //		not
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean
// SD_MusicPlaying(void)
// {
// 	boolean	result;
// 
// 	switch (MusicMode)
// 	{
// 	case smm_AdLib:
// 		result = false;
// 		// DEBUG - not written
// 		break;
// 	default:
// 		result = false;
// 	}
// 
// 	return(result);
// }
// 
