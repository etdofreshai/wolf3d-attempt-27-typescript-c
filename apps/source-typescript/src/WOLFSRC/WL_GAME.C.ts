import { i32, writeU16LE } from "./TS_C";
import { DOSMemory } from "./TS_DOS_MEMORY";
import { parseDemo } from "./TS_DEMO";
import { NewGameMemory } from "./TS_GAME_STATE";
import { CA_CacheGrChunk, UNCACHEGRCHUNK } from "./ID_CA.C";
import { MM_SortMem, type MMSummary } from "./ID_MM.C";
import { PM_UnlockMainMem, type PageManagerSummary } from "./ID_PM.C";
import { SD_DebugState, SD_SoundPlaying, SD_StopDigitized, type SoundModeSummary } from "./ID_SD.C";
import { US_InitRndT, rndindex } from "./ID_US_A.ASM";
import {
  bufferofs as vlBufferofs,
  VL_FadeOut,
  VL_SetBufferOffset,
  type FadeSummary,
  type PlanarFillSummary,
  type PlanarWriteSummary,
} from "./ID_VL.C";
import {
  VWB_Bar,
  VWB_DrawPic,
  VWB_Hlin,
  VWB_Plot,
  VWB_Vlin,
  type BufferedDrawSummary,
  type BufferedPicDrawSummary,
  type DrawPicOptions,
} from "./ID_VH.C";
import {
  DrawAmmo,
  DrawFace,
  DrawHealth,
  DrawKeys,
  DrawLevel,
  DrawLives,
  DrawScore,
  DrawWeapon,
  type DrawFaceSummary,
  type LatchNumberSummary,
  type StatusDrawOptions,
  type StatusDrawPicSummary,
} from "./WL_AGENT.C";
import { centerx, focallength, heightnumerator, scale, screenofs, shootdelta, viewheight, viewwidth } from "./WL_MAIN.C";
import { ThreeDRefresh, type ThreeDRefreshSummary } from "./WL_DRAW.C";
import { STATUSBARPIC } from "./TS_WL6_ASSETS";
import {
  FixedByFracMemory,
  InitActorListMemory,
  InitDoorListMemory,
  InitStaticListMemory,
  ClearPaletteShiftsMemory,
  PlayLoopStepMemory,
  clearAmbushMarkers,
  copyWallDataToLevelMemory,
  scanEnemyPlaneMemory,
  scanPlayerStartsMemory,
  scanSecretPushwallsMemory,
  scanStaticPlaneMemory,
  spawnDoorsFromWallPlane,
  type DispatchedActionSummary,
  type DispatchedThinkSummary,
  type EnemySpawnOptions,
  type PlayLoopStepSummary,
} from "./TS_LEVEL_SETUP";
import { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_GAME.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_GAME.C";
export const WOLFSRC_FUNCTIONS = [
  "ClearMemory",
  "Died",
  "DrawAllPlayBorder",
  "DrawAllPlayBorderSides",
  "DrawPlayBorder",
  "DrawPlayBorderSides",
  "DrawPlayScreen",
  "FinishDemoRecord",
  "GameLoop",
  "PlayDemo",
  "PlaySoundLocGlobal",
  "RecordDemo",
  "ScanInfoPlane",
  "SetSoundLoc",
  "SetupGameLevel",
  "StartDemoRecord",
  "UpdateSoundLoc"
] as const;

export let ingame = false;
export let demorecord = false;
export let demoplayback = false;
export let demoname = "DEMO?.";
export const MAXDEMOSIZE = 8192;
let demobuffer: Uint8Array | null = null;
let demoptr = 0;
let lastdemoptr = 0;

export interface ScanInfoPlaneSummary {
  readonly players: number;
  readonly statics: number;
  readonly secretPushwalls: number;
  readonly enemies: number;
  readonly killtotal: number;
}

export interface SetupGameLevelOptions extends EnemySpawnOptions {
  readonly areaconnect?: Uint8Array | DOSMemory;
}

export interface SetupGameLevelSummary {
  readonly walls: number;
  readonly floors: number;
  readonly doors: number;
  readonly players: number;
  readonly statics: number;
  readonly secretPushwalls: number;
  readonly enemies: number;
  readonly ambushMarkers: number;
  readonly killtotal: number;
}

export interface SoundProjectionContext {
  readonly viewx: number;
  readonly viewy: number;
  readonly viewsin: number;
  readonly viewcos: number;
}

export interface SoundLocSummary {
  readonly gx: number;
  readonly gy: number;
  readonly x: number;
  readonly y: number;
  readonly leftchannel: number;
  readonly rightchannel: number;
}

export interface PlaySoundLocSummary extends SoundLocSummary {
  readonly sound: number;
  readonly positioned: boolean;
  readonly played: boolean;
  readonly globalsoundx: number;
  readonly globalsoundy: number;
}

export interface UpdateSoundLocSummary {
  readonly updated: boolean;
  readonly leftchannel: number;
  readonly rightchannel: number;
  readonly globalsoundx: number;
  readonly globalsoundy: number;
}

export interface PlayDemoOptions extends SetupGameLevelOptions {
  readonly maxCommands?: number;
  readonly startNewGame?: boolean;
  readonly refreshVisibility?: boolean;
  readonly projectActorVisibility?: boolean;
}

export interface PlayDemoSummary {
  readonly mapon: number;
  readonly difficulty: number;
  readonly commands: number;
  readonly commandsRun: number;
  readonly completed: boolean;
  readonly setup: SetupGameLevelSummary;
  readonly playstate: number;
  readonly timeCount: number;
  readonly lastStep: PlayLoopStepSummary | null;
  readonly dgroupChecksum: number;
}

export interface PlayDemoTraceOptions extends PlayDemoOptions {
  readonly sampleEvery?: number;
}

export interface PlayDemoTraceSample {
  readonly commandIndex: number;
  readonly byteOffset: number;
  readonly buttonbits: number;
  readonly controlx: number;
  readonly controly: number;
  readonly rndindex: number;
  readonly timeCount: number;
  readonly playstate: number;
  readonly dgroupChecksum: number;
  readonly playerTilex: number;
  readonly playerTiley: number;
  readonly playerAngle: number;
  readonly health: number;
  readonly ammo: number;
  readonly weapon: number;
  readonly chosenweapon: number;
  readonly attackframe: number;
  readonly attackcount: number;
  readonly weaponframe: number;
  readonly facecount: number;
  readonly faceframe: number;
  readonly soundPlaying: number;
  readonly soundMode: number;
  readonly soundPriority: number;
  readonly pcSoundActive: boolean;
  readonly pcLengthLeft: number;
  readonly alSoundActive: boolean;
  readonly alLengthLeft: number;
  readonly score: number;
  readonly actorCount: number;
  readonly shotActions: readonly PlayDemoTraceShotAction[];
  readonly damageActions: readonly PlayDemoTraceDamageAction[];
  readonly playerAttacks: readonly PlayDemoTracePlayerAttack[];
}

export interface PlayDemoTraceShotAction {
  readonly actor: number;
  readonly obclass: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly state: string | null;
  readonly areaVisible: boolean;
  readonly lineClear: boolean;
  readonly visible: boolean;
  readonly hit: boolean;
  readonly damage: number;
  readonly hitchance: number;
  readonly hitRoll: number | null;
  readonly damageRoll: number | null;
  readonly dist: number;
  readonly thrustspeed: number;
  readonly health: number;
}

export interface PlayDemoTraceDamageAction {
  readonly actor: number;
  readonly obclass: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly state: string | null;
  readonly action: "T_Shoot" | "T_Bite" | "T_Projectile";
  readonly damage: number;
  readonly health: number;
  readonly hit: boolean;
}

export interface PlayDemoTracePlayerAttack {
  readonly target: number | null;
  readonly obclass: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly hit: boolean;
  readonly damage: number;
  readonly dist: number;
  readonly lineClear: boolean | null;
  readonly hitpoints: number | null;
  readonly killed: boolean;
  readonly killstate: string | null;
}

export interface PlayDemoTraceSummary extends PlayDemoSummary {
  readonly sampleEvery: number;
  readonly trace: readonly PlayDemoTraceSample[];
  readonly traceChecksum: number;
}

function RefreshDemoVisibility(dgroup: DOSMemory): ThreeDRefreshSummary | null {
  if (viewwidth <= 0 || viewheight <= 0) {
    return null;
  }
  dgroup.setU16(nearOffsetForRuntimeSymbol("_centerx"), centerx);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_shootdelta"), shootdelta);
  return ThreeDRefresh({
    dgroup,
    screenofs,
    scale,
    centerx,
    focallength,
    heightnumerator,
    demoplayback: true,
  });
}

function ResetPlayLoopState(dgroup: DOSMemory): void {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
  dgroup.setU32(gamestate + gamestateField("TimeCount")[0], 0);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_anglefrac"), 0);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_facecount"), 0);
  for (let i = 0; i < 10; i++) {
    dgroup.setU16(nearOffsetForRuntimeSymbol("_buttonstate") + i * 2, 0);
  }
  ClearPaletteShiftsMemory(dgroup);
}

export interface ClearMemorySummary {
  readonly page: PageManagerSummary;
  readonly sound: SoundModeSummary;
  readonly memory: MMSummary;
}

export interface PlayBorderSummary {
  readonly xl: number;
  readonly yl: number;
  readonly viewwidth: number;
  readonly viewheight: number;
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
  readonly viewport: BufferedDrawSummary<PlanarFillSummary>;
  readonly top: BufferedDrawSummary<PlanarFillSummary>;
  readonly bottom: BufferedDrawSummary<PlanarFillSummary>;
  readonly left: BufferedDrawSummary<PlanarFillSummary>;
  readonly right: BufferedDrawSummary<PlanarFillSummary>;
  readonly corner: BufferedDrawSummary<PlanarWriteSummary>;
}

export interface PlayBorderSidesSummary {
  readonly xl: number;
  readonly yl: number;
  readonly viewwidth: number;
  readonly viewheight: number;
  readonly leftBackground: BufferedDrawSummary<PlanarFillSummary>;
  readonly rightBackground: BufferedDrawSummary<PlanarFillSummary>;
  readonly left: BufferedDrawSummary<PlanarFillSummary>;
  readonly right: BufferedDrawSummary<PlanarFillSummary>;
}

export interface AllPlayBorderSummary<T> {
  readonly pages: readonly number[];
  readonly draws: readonly T[];
  readonly restoredBufferofs: number;
}

export interface DrawPlayScreenOptions extends StatusDrawOptions {
  readonly statusBarSource?: Uint8Array;
  readonly statusBarWidth?: number;
  readonly statusBarHeight?: number;
  readonly statusBarPictable?: Uint8Array;
}

export interface PlayScreenHudSummary {
  readonly face: DrawFaceSummary;
  readonly health: LatchNumberSummary;
  readonly lives: LatchNumberSummary;
  readonly level: LatchNumberSummary;
  readonly ammo: LatchNumberSummary;
  readonly keys: readonly [StatusDrawPicSummary, StatusDrawPicSummary];
  readonly weapon: StatusDrawPicSummary;
  readonly score: LatchNumberSummary;
}

export interface DrawPlayScreenSummary {
  readonly fade: FadeSummary;
  readonly statusBarChunk: number;
  readonly statusBarCached: boolean;
  readonly pages: readonly number[];
  readonly borders: readonly PlayBorderSummary[];
  readonly statusBars: readonly BufferedPicDrawSummary[];
  readonly restoredBufferofs: number;
  readonly hud: PlayScreenHudSummary;
}

export interface DemoRecordCommandInput {
  readonly buttonbits: number;
  readonly controlx: number;
  readonly controly: number;
}

export interface StartDemoRecordOptions {
  readonly commands?: readonly DemoRecordCommandInput[];
}

export interface StartDemoRecordSummary {
  readonly levelnumber: number;
  readonly maxSize: number;
  readonly demoptr: number;
  readonly lastdemoptr: number;
  readonly demorecord: boolean;
  readonly commands: number;
  readonly buffer: Uint8Array;
}

export interface FinishDemoRecordOptions {
  readonly demoNumber?: number | string | null;
  readonly centerWindow?: (w: number, h: number) => unknown;
  readonly print?: (text: string) => unknown;
  readonly update?: () => unknown;
  readonly writeFile?: (name: string, data: Uint8Array) => unknown;
}

export interface FinishDemoRecordSummary {
  readonly length: number;
  readonly demorecord: boolean;
  readonly prompt: unknown;
  readonly update: unknown;
  readonly demoNumber: number | null;
  readonly filename: string | null;
  readonly written: unknown;
  readonly buffer: Uint8Array;
  readonly freed: boolean;
}

export interface RecordDemoOptions {
  readonly levelInput?: string | null;
  readonly centerWindow?: (w: number, h: number) => unknown;
  readonly print?: (text: string) => unknown;
  readonly update?: () => unknown;
  readonly fadeIn?: () => unknown;
  readonly fadeOut?: () => unknown;
  readonly newGame?: (difficulty: number, episode: number) => unknown;
  readonly setMap?: (mapon: number) => unknown;
  readonly startDemoRecord?: (level: number) => unknown;
  readonly drawPlayScreen?: () => unknown;
  readonly setupGameLevel?: () => unknown;
  readonly startMusic?: () => unknown;
  readonly checkMainMem?: () => unknown;
  readonly playLoop?: () => unknown;
  readonly stopMusic?: () => unknown;
  readonly clearMemory?: () => unknown;
  readonly finishDemoRecord?: () => unknown;
}

export interface RecordDemoSummary {
  readonly escaped: boolean;
  readonly prompt: unknown;
  readonly update: unknown;
  readonly fadeIn: unknown;
  readonly levelInput: string | null;
  readonly level: number | null;
  readonly newGame: unknown;
  readonly map: unknown;
  readonly startDemoRecord: unknown;
  readonly drawPlayScreen: unknown;
  readonly fadeInGame: unknown;
  readonly demorecord: boolean;
  readonly setupGameLevel: unknown;
  readonly startMusic: unknown;
  readonly checkMainMem: unknown;
  readonly fizzlein: boolean;
  readonly playLoop: unknown;
  readonly demoplayback: boolean;
  readonly stopMusic: unknown;
  readonly fadeOut: unknown;
  readonly clearMemory: unknown;
  readonly finishDemoRecord: unknown;
}

export interface GameLoopState {
  mapon: number;
  episode: number;
  score: number;
  oldscore: number;
  lives: number;
  keys: number;
}

export interface GameLoopOptions {
  readonly state?: Partial<GameLoopState>;
  readonly maxIterations?: number;
  readonly playstates?: readonly number[];
  readonly loadedgame?: boolean;
  readonly startgame?: boolean;
  readonly clearMemory?: () => unknown;
  readonly setFont?: () => unknown;
  readonly drawPlayScreen?: () => unknown;
  readonly drawScore?: (state: GameLoopState) => unknown;
  readonly setupGameLevel?: (state: GameLoopState) => unknown;
  readonly startMusic?: () => unknown;
  readonly checkMainMem?: () => unknown;
  readonly preloadGraphics?: () => unknown;
  readonly drawLevel?: (state: GameLoopState) => unknown;
  readonly playLoop?: (iteration: number, state: GameLoopState) => unknown;
  readonly stopMusic?: () => unknown;
  readonly finishDemoRecord?: () => unknown;
  readonly drawKeys?: (state: GameLoopState) => unknown;
  readonly fadeOut?: () => unknown;
  readonly levelCompleted?: (state: GameLoopState) => unknown;
  readonly died?: (state: GameLoopState) => unknown;
  readonly checkHighScore?: (score: number, completed: number) => unknown;
  readonly victory?: (state: GameLoopState) => unknown;
}

export interface GameLoopIterationSummary {
  readonly index: number;
  readonly stateBefore: GameLoopState;
  readonly scoreReset: boolean;
  readonly drawScore: unknown;
  readonly setupGameLevel: unknown;
  readonly startMusic: unknown;
  readonly checkMainMem: unknown;
  readonly preloadGraphics: unknown;
  readonly drawLevel: unknown;
  readonly playLoop: unknown;
  readonly playstate: number;
  readonly stopMusic: unknown;
  readonly finishDemoRecord: unknown;
  readonly branch: "completed" | "secretlevel" | "died-more-lives" | "died-game-over" | "victorious" | "default";
  readonly branchActions: readonly unknown[];
  readonly stateAfter: GameLoopState;
}

export interface GameLoopSummary {
  readonly clearMemory: unknown;
  readonly setFont: unknown;
  readonly drawPlayScreen: unknown;
  readonly iterations: readonly GameLoopIterationSummary[];
  readonly finalState: GameLoopState;
  readonly ingame: boolean;
  readonly bounded: boolean;
}

export interface DiedActorState {
  x: number;
  y: number;
  angle: number;
}

export interface DiedPlayerState extends DiedActorState {
  weapon: number;
  bestweapon: number;
  chosenweapon: number;
  lives: number;
  health: number;
  ammo: number;
  keys: number;
  attackframe: number;
  attackcount: number;
  weaponframe: number;
}

export interface DiedOptions {
  readonly player: DiedPlayerState;
  readonly killer: DiedActorState;
  readonly tics?: number | readonly number[];
  readonly tedlevel?: boolean;
  readonly playDeathSound?: () => unknown;
  readonly refresh?: (angle: number) => unknown;
  readonly calcTics?: (step: number) => number;
  readonly finishPaletteShifts?: () => unknown;
  readonly redBar?: () => unknown;
  readonly clearKeysDown?: () => unknown;
  readonly fizzleFade?: () => unknown;
  readonly userInput?: (ticks: number) => unknown;
  readonly waitSoundDone?: () => unknown;
  readonly drawKeys?: (state: DiedPlayerState) => unknown;
  readonly drawWeapon?: (state: DiedPlayerState) => unknown;
  readonly drawAmmo?: (state: DiedPlayerState) => unknown;
  readonly drawHealth?: (state: DiedPlayerState) => unknown;
  readonly drawFace?: (state: DiedPlayerState) => unknown;
  readonly drawLives?: (state: DiedPlayerState) => unknown;
  readonly maxSteps?: number;
}

export interface DiedRotationStep {
  readonly step: number;
  readonly tics: number;
  readonly change: number;
  readonly angle: number;
}

export interface DiedSummary {
  readonly targetAngle: number;
  readonly clockwise: number;
  readonly counter: number;
  readonly direction: "clockwise" | "counterclockwise";
  readonly rotations: readonly DiedRotationStep[];
  readonly playDeathSound: unknown;
  readonly finishPaletteShifts: unknown;
  readonly redBar: unknown;
  readonly clearKeysDown: unknown;
  readonly fizzleFade: unknown;
  readonly userInput: unknown;
  readonly waitSoundDone: unknown;
  readonly livesBefore: number;
  readonly livesAfter: number;
  readonly reset: boolean;
  readonly draws: readonly unknown[];
  readonly player: DiedPlayerState;
}

interface SoundState {
  globalsoundx: number;
  globalsoundy: number;
  leftchannel: number;
  rightchannel: number;
  positioned: boolean;
  lastSound: number | null;
}

const ATABLEMAX = 15;
const TILESHIFT = 16;
const RIGHT_TABLE = [
  [8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 6, 0, 0, 0, 0, 0, 1, 3, 5, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 6, 4, 0, 0, 0, 0, 0, 2, 4, 6, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 4, 1, 0, 0, 0, 1, 2, 4, 6, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 6, 5, 4, 2, 1, 0, 1, 2, 3, 5, 7, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 5, 4, 3, 2, 2, 3, 3, 5, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 4, 4, 5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 5, 5, 6, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
] as const;
const LEFT_TABLE = [
  [8, 8, 8, 8, 8, 8, 8, 8, 5, 3, 1, 0, 0, 0, 0, 0, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 6, 4, 2, 0, 0, 0, 0, 0, 4, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 6, 4, 2, 1, 0, 0, 0, 1, 4, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 7, 5, 3, 2, 1, 0, 1, 2, 4, 5, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 5, 3, 3, 2, 2, 3, 4, 5, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 6, 5, 4, 4, 4, 4, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 6, 6, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
] as const;
const SOUND_STATES = new WeakMap<DOSMemory, SoundState>();
const GD_HARD = 3;
const STATUSLINES = 40;
const SCREENWIDTH = 80;
const SCREENSIZE = SCREENWIDTH * 208;
const PAGE1START = 0;
const PAGE2START = SCREENSIZE;
const PAGE3START = SCREENSIZE * 2;
const SCREENLOC = [PAGE1START, PAGE2START, PAGE3START] as const;
const EX_COMPLETED = 1;
const EX_DIED = 2;
const EX_WARPED = 3;
const EX_VICTORIOUS = 6;
const EX_SECRETLEVEL = 9;
const ELEVATOR_BACK_TO = [1, 1, 7, 3, 5, 3] as const;
const ANGLES = 360;
const DEATHROTATE = 2;
const STARTAMMO = 8;

export function ClearMemory(): ClearMemorySummary {
  const page = PM_UnlockMainMem();
  const sound = SD_StopDigitized();
  const memory = MM_SortMem();
  return { page, sound, memory };
}

function diedTicFor(options: DiedOptions, step: number): number {
  const tics = options.tics;
  if (typeof tics === "number") {
    return Math.trunc(tics);
  }
  if (tics) {
    return Math.trunc(tics[Math.min(step, tics.length - 1)] ?? 1);
  }
  return 1;
}

export function Died(options: DiedOptions): DiedSummary {
  const player: DiedPlayerState = { ...options.player, weapon: -1 };
  const playDeathSound = options.playDeathSound?.() ?? null;
  const dx = options.killer.x - player.x;
  const dy = player.y - options.killer.y;
  let fangle = Math.atan2(dy, dx);
  if (fangle < 0) {
    fangle = Math.PI * 2 + fangle;
  }
  const targetAngle = Math.trunc((fangle / (Math.PI * 2)) * ANGLES);
  let clockwise: number;
  let counter: number;
  if (player.angle > targetAngle) {
    counter = player.angle - targetAngle;
    clockwise = ANGLES - player.angle + targetAngle;
  } else {
    clockwise = targetAngle - player.angle;
    counter = player.angle + ANGLES - targetAngle;
  }

  let curangle = player.angle;
  const rotations: DiedRotationStep[] = [];
  const direction = clockwise < counter ? "clockwise" : "counterclockwise";
  const maxSteps = Math.max(1, Math.trunc(options.maxSteps ?? 720));

  if (direction === "clockwise") {
    if (curangle > targetAngle) {
      curangle -= ANGLES;
    }
    for (let step = 0; curangle !== targetAngle && step < maxSteps; step++) {
      const tics = diedTicFor(options, step);
      let change = tics * DEATHROTATE;
      if (curangle + change > targetAngle) {
        change = targetAngle - curangle;
      }
      curangle += change;
      player.angle += change;
      if (player.angle >= ANGLES) {
        player.angle -= ANGLES;
      }
      rotations.push({ step, tics, change, angle: player.angle });
      options.refresh?.(player.angle);
      options.calcTics?.(step);
    }
  } else {
    if (curangle < targetAngle) {
      curangle += ANGLES;
    }
    for (let step = 0; curangle !== targetAngle && step < maxSteps; step++) {
      const tics = diedTicFor(options, step);
      let change = -tics * DEATHROTATE;
      if (curangle + change < targetAngle) {
        change = targetAngle - curangle;
      }
      curangle += change;
      player.angle += change;
      if (player.angle < 0) {
        player.angle += ANGLES;
      }
      rotations.push({ step, tics, change, angle: player.angle });
      options.refresh?.(player.angle);
      options.calcTics?.(step);
    }
  }

  const finishPaletteShifts = options.finishPaletteShifts?.() ?? null;
  const redBar = options.redBar?.() ?? null;
  const clearKeysDown = options.clearKeysDown?.() ?? null;
  const fizzleFade = options.fizzleFade?.() ?? null;
  const userInput = options.userInput?.(100) ?? null;
  const waitSoundDone = options.waitSoundDone?.() ?? null;
  const livesBefore = player.lives;
  if (!(options.tedlevel ?? false)) {
    player.lives--;
  }

  const draws: unknown[] = [];
  const reset = player.lives > -1;
  if (reset) {
    player.health = 100;
    player.weapon = 1;
    player.bestweapon = 1;
    player.chosenweapon = 1;
    player.ammo = STARTAMMO;
    player.keys = 0;
    player.attackframe = 0;
    player.attackcount = 0;
    player.weaponframe = 0;
    draws.push(options.drawKeys?.(player) ?? null);
    draws.push(options.drawWeapon?.(player) ?? null);
    draws.push(options.drawAmmo?.(player) ?? null);
    draws.push(options.drawHealth?.(player) ?? null);
    draws.push(options.drawFace?.(player) ?? null);
    draws.push(options.drawLives?.(player) ?? null);
  }

  return {
    targetAngle,
    clockwise,
    counter,
    direction,
    rotations,
    playDeathSound,
    finishPaletteShifts,
    redBar,
    clearKeysDown,
    fizzleFade,
    userInput,
    waitSoundDone,
    livesBefore,
    livesAfter: player.lives,
    reset,
    draws,
    player,
  };
}

export function DrawAllPlayBorder(): AllPlayBorderSummary<PlayBorderSummary> {
  const temp = vlBufferofs;
  const draws: PlayBorderSummary[] = [];
  for (const page of SCREENLOC) {
    VL_SetBufferOffset(page);
    draws.push(DrawPlayBorder());
  }
  VL_SetBufferOffset(temp);
  return { pages: SCREENLOC, draws, restoredBufferofs: vlBufferofs };
}

export function DrawAllPlayBorderSides(): AllPlayBorderSummary<PlayBorderSidesSummary> {
  const temp = vlBufferofs;
  const draws: PlayBorderSidesSummary[] = [];
  for (const page of SCREENLOC) {
    VL_SetBufferOffset(page);
    draws.push(DrawPlayBorderSides());
  }
  VL_SetBufferOffset(temp);
  return { pages: SCREENLOC, draws, restoredBufferofs: vlBufferofs };
}

export function DrawPlayBorder(): PlayBorderSummary {
  const background = VWB_Bar(0, 0, 320, 200 - STATUSLINES, 127);
  const xl = 160 - Math.trunc(viewwidth / 2);
  const yl = Math.trunc((200 - STATUSLINES - viewheight) / 2);
  const viewport = VWB_Bar(xl, yl, viewwidth, viewheight, 0);
  const top = VWB_Hlin(xl - 1, xl + viewwidth, yl - 1, 0);
  const bottom = VWB_Hlin(xl - 1, xl + viewwidth, yl + viewheight, 125);
  const left = VWB_Vlin(yl - 1, yl + viewheight, xl - 1, 0);
  const right = VWB_Vlin(yl - 1, yl + viewheight, xl + viewwidth, 125);
  const corner = VWB_Plot(xl - 1, yl + viewheight, 124);

  return { xl, yl, viewwidth, viewheight, background, viewport, top, bottom, left, right, corner };
}

export function DrawPlayBorderSides(): PlayBorderSidesSummary {
  const xl = 160 - Math.trunc(viewwidth / 2);
  const yl = Math.trunc((200 - STATUSLINES - viewheight) / 2);
  const leftBackground = VWB_Bar(0, 0, xl - 1, 200 - STATUSLINES, 127);
  const rightBackground = VWB_Bar(xl + viewwidth + 1, 0, xl - 2, 200 - STATUSLINES, 127);
  const left = VWB_Vlin(yl - 1, yl + viewheight, xl - 1, 0);
  const right = VWB_Vlin(yl - 1, yl + viewheight, xl + viewwidth, 125);

  return { xl, yl, viewwidth, viewheight, leftBackground, rightBackground, left, right };
}

export function DrawPlayScreen(dgroup: DOSMemory, options: DrawPlayScreenOptions = {}): DrawPlayScreenSummary {
  const fade = VL_FadeOut(0, 255, 0, 0, 0, 30);
  const temp = vlBufferofs;
  const borders: PlayBorderSummary[] = [];
  const statusBars: BufferedPicDrawSummary[] = [];
  const statusBarOptions = statusBarDrawOptions(options);
  const statusBarCached = !options.statusBarSource;

  try {
    if (statusBarCached) {
      CA_CacheGrChunk(STATUSBARPIC);
    }

    for (const page of SCREENLOC) {
      VL_SetBufferOffset(page);
      borders.push(DrawPlayBorder());
      statusBars.push(VWB_DrawPic(0, 200 - STATUSLINES, STATUSBARPIC, statusBarOptions));
    }
  } finally {
    VL_SetBufferOffset(temp);
    if (statusBarCached) {
      UNCACHEGRCHUNK(STATUSBARPIC);
    }
  }

  const hud = {
    face: DrawFace(dgroup, options),
    health: DrawHealth(dgroup, options),
    lives: DrawLives(dgroup, options),
    level: DrawLevel(dgroup, options),
    ammo: DrawAmmo(dgroup, options),
    keys: DrawKeys(dgroup, options),
    weapon: DrawWeapon(dgroup, options),
    score: DrawScore(dgroup, options),
  };

  return {
    fade,
    statusBarChunk: STATUSBARPIC,
    statusBarCached,
    pages: SCREENLOC,
    borders,
    statusBars,
    restoredBufferofs: vlBufferofs,
    hud,
  };
}

function appendDemoRecordCommand(command: DemoRecordCommandInput): void {
  if (!demobuffer) {
    throw new Error("StartDemoRecord must be called before appending demo commands");
  }
  if (demoptr + 3 > lastdemoptr) {
    throw new Error("Demo buffer overflowed!");
  }
  demobuffer[demoptr++] = Math.trunc(command.buttonbits) & 0xff;
  demobuffer[demoptr++] = Math.trunc(command.controlx) & 0xff;
  demobuffer[demoptr++] = Math.trunc(command.controly) & 0xff;
}

export function FinishDemoRecord(options: FinishDemoRecordOptions = {}): FinishDemoRecordSummary {
  if (!demobuffer) {
    throw new Error("FinishDemoRecord requires an active demo buffer");
  }

  demorecord = false;
  const length = demoptr;
  writeU16LE(demobuffer, 1, length);
  const prompt = {
    center: options.centerWindow?.(24, 3) ?? null,
    print: options.print?.(" Demo number (0-9):") ?? " Demo number (0-9):",
  };
  const update = options.update?.() ?? null;
  const parsed = options.demoNumber === null || options.demoNumber === undefined
    ? Number.NaN
    : Number.parseInt(String(options.demoNumber), 10);
  const demoNumber = Number.isFinite(parsed) && parsed >= 0 && parsed <= 9 ? parsed : null;
  let filename: string | null = null;
  let written: unknown = null;
  const buffer = demobuffer.slice(0, length);

  if (demoNumber !== null) {
    filename = `DEMO${demoNumber}.`;
    demoname = filename;
    written = options.writeFile?.(filename, buffer) ?? { filename, bytes: buffer.length };
  }

  demobuffer = null;
  demoptr = 0;
  lastdemoptr = 0;
  return { length, demorecord, prompt, update, demoNumber, filename, written, buffer, freed: true };
}

function gameLoopState(options: GameLoopOptions): GameLoopState {
  return {
    mapon: Math.trunc(options.state?.mapon ?? 0),
    episode: Math.trunc(options.state?.episode ?? 0),
    score: Math.trunc(options.state?.score ?? 0),
    oldscore: Math.trunc(options.state?.oldscore ?? options.state?.score ?? 0),
    lives: Math.trunc(options.state?.lives ?? 3),
    keys: Math.trunc(options.state?.keys ?? 0),
  };
}

function cloneGameLoopState(state: GameLoopState): GameLoopState {
  return { ...state };
}

function gameLoopPlaystate(result: unknown, fallback: number): number {
  if (typeof result === "number") {
    return Math.trunc(result);
  }
  if (result && typeof result === "object" && "playstate" in result) {
    const value = Number((result as { readonly playstate?: unknown }).playstate);
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }
  return fallback;
}

export function GameLoop(options: GameLoopOptions = {}): GameLoopSummary {
  const state = gameLoopState(options);
  let useLoadedGame = !!options.loadedgame;
  let died = false;
  const iterations: GameLoopIterationSummary[] = [];
  const clearMemory = options.clearMemory?.() ?? null;
  const setFont = options.setFont?.() ?? null;
  const drawPlayScreen = options.drawPlayScreen?.() ?? null;
  const maxIterations = Math.max(0, Math.trunc(options.maxIterations ?? Math.max(1, options.playstates?.length ?? 1)));

  for (let index = 0; index < maxIterations; index++) {
    const stateBefore = cloneGameLoopState(state);
    let scoreReset = false;
    if (!useLoadedGame) {
      state.score = state.oldscore;
      scoreReset = true;
    }

    const drawScore = options.drawScore?.(cloneGameLoopState(state)) ?? null;
    let setupGameLevel: unknown = null;
    if (useLoadedGame) {
      useLoadedGame = false;
    } else {
      setupGameLevel = options.setupGameLevel?.(cloneGameLoopState(state)) ?? null;
    }

    ingame = true;
    const startMusic = options.startMusic?.() ?? null;
    const checkMainMem = options.checkMainMem?.() ?? null;
    const preloadGraphics = died ? null : (options.preloadGraphics?.() ?? null);
    died = false;
    const drawLevel = options.drawLevel?.(cloneGameLoopState(state)) ?? null;
    const playLoop = options.playLoop?.(index, cloneGameLoopState(state)) ?? null;
    const playstate = options.playstates?.[index] ?? gameLoopPlaystate(playLoop, 0);
    const stopMusic = options.stopMusic?.() ?? null;
    ingame = false;
    const finishDemoRecord = demorecord && playstate !== EX_WARPED
      ? (options.finishDemoRecord?.() ?? FinishDemoRecord())
      : null;

    let branch: GameLoopIterationSummary["branch"] = "default";
    const branchActions: unknown[] = [];

    switch (playstate) {
      case EX_COMPLETED:
      case EX_SECRETLEVEL: {
        branch = playstate === EX_SECRETLEVEL ? "secretlevel" : "completed";
        state.keys = 0;
        branchActions.push(options.drawKeys?.(cloneGameLoopState(state)) ?? null);
        branchActions.push(options.fadeOut?.() ?? null);
        branchActions.push(options.clearMemory?.() ?? null);
        branchActions.push(options.levelCompleted?.(cloneGameLoopState(state)) ?? null);
        state.oldscore = state.score;
        if (state.mapon === 9) {
          state.mapon = ELEVATOR_BACK_TO[state.episode] ?? state.mapon;
        } else if (playstate === EX_SECRETLEVEL) {
          state.mapon = 9;
        } else {
          state.mapon++;
        }
        break;
      }

      case EX_DIED: {
        branchActions.push(options.died?.(cloneGameLoopState(state)) ?? null);
        died = true;
        if (state.lives > -1) {
          branch = "died-more-lives";
          break;
        }
        branch = "died-game-over";
        branchActions.push(options.fadeOut?.() ?? null);
        branchActions.push(options.clearMemory?.() ?? null);
        branchActions.push(options.checkHighScore?.(state.score, state.mapon + 1) ?? null);
        iterations.push({
          index,
          stateBefore,
          scoreReset,
          drawScore,
          setupGameLevel,
          startMusic,
          checkMainMem,
          preloadGraphics,
          drawLevel,
          playLoop,
          playstate,
          stopMusic,
          finishDemoRecord,
          branch,
          branchActions,
          stateAfter: cloneGameLoopState(state),
        });
        return { clearMemory, setFont, drawPlayScreen, iterations, finalState: cloneGameLoopState(state), ingame, bounded: false };
      }

      case EX_VICTORIOUS: {
        branch = "victorious";
        branchActions.push(options.fadeOut?.() ?? null);
        branchActions.push(options.clearMemory?.() ?? null);
        branchActions.push(options.victory?.(cloneGameLoopState(state)) ?? null);
        branchActions.push(options.clearMemory?.() ?? null);
        branchActions.push(options.checkHighScore?.(state.score, state.mapon + 1) ?? null);
        iterations.push({
          index,
          stateBefore,
          scoreReset,
          drawScore,
          setupGameLevel,
          startMusic,
          checkMainMem,
          preloadGraphics,
          drawLevel,
          playLoop,
          playstate,
          stopMusic,
          finishDemoRecord,
          branch,
          branchActions,
          stateAfter: cloneGameLoopState(state),
        });
        return { clearMemory, setFont, drawPlayScreen, iterations, finalState: cloneGameLoopState(state), ingame, bounded: false };
      }

      default:
        branch = "default";
        branchActions.push(options.clearMemory?.() ?? null);
        break;
    }

    iterations.push({
      index,
      stateBefore,
      scoreReset,
      drawScore,
      setupGameLevel,
      startMusic,
      checkMainMem,
      preloadGraphics,
      drawLevel,
      playLoop,
      playstate,
      stopMusic,
      finishDemoRecord,
      branch,
      branchActions,
      stateAfter: cloneGameLoopState(state),
    });
  }

  return { clearMemory, setFont, drawPlayScreen, iterations, finalState: cloneGameLoopState(state), ingame, bounded: true };
}

export function PlayDemo(
  demoBytes: Uint8Array,
  plane0: Uint16Array,
  plane1: Uint16Array,
  dgroup: DOSMemory,
  options: PlayDemoOptions = {},
): PlayDemoSummary {
  const demo = parseDemo(demoBytes);
  if (options.startNewGame ?? true) {
    NewGameMemory(dgroup, 1, 0);
  }
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU16(gamestate + gamestateField("mapon")[0], demo.mapon);
  dgroup.setU16(gamestate + gamestateField("difficulty")[0], GD_HARD);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);

  const previousDemoplayback = demoplayback;
  demoplayback = true;
  US_InitRndT(false);
  const setup = SetupGameLevel(plane0, plane1, dgroup, options);
  ResetPlayLoopState(dgroup);
  const maxCommands = Math.min(options.maxCommands ?? demo.commands.length, demo.commands.length);
  const refreshVisibility = options.refreshVisibility ?? true;
  let lastStep: PlayLoopStepSummary | null = null;
  let commandsRun = 0;

  for (let index = 0; index < maxCommands; index++) {
    lastStep = PlayLoopStepMemory(dgroup, plane0, plane1, {
      ...options,
      projectActorVisibility: options.projectActorVisibility ?? !refreshVisibility,
      demoCommand: demo.commands[index],
      demoDone: index === demo.commands.length - 1,
    });
    if (refreshVisibility) {
      RefreshDemoVisibility(dgroup);
    }
    commandsRun++;
    if (lastStep.playstate) {
      break;
    }
  }
  demoplayback = previousDemoplayback;

  const playstate = dgroup.u16(nearOffsetForRuntimeSymbol("_playstate"));
  return {
    mapon: demo.mapon,
    difficulty: GD_HARD,
    commands: demo.commands.length,
    commandsRun,
    completed: commandsRun === demo.commands.length || playstate !== 0,
    setup,
    playstate,
    timeCount: dgroup.u32(gamestate + gamestateField("TimeCount")[0]),
    lastStep,
    dgroupChecksum: checksumBytes(dgroup.bytes),
  };
}

export function PlayDemoTrace(
  demoBytes: Uint8Array,
  plane0: Uint16Array,
  plane1: Uint16Array,
  dgroup: DOSMemory,
  options: PlayDemoTraceOptions = {},
): PlayDemoTraceSummary {
  const demo = parseDemo(demoBytes);
  if (options.startNewGame ?? true) {
    NewGameMemory(dgroup, 1, 0);
  }
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU16(gamestate + gamestateField("mapon")[0], demo.mapon);
  dgroup.setU16(gamestate + gamestateField("difficulty")[0], GD_HARD);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);

  const previousDemoplayback = demoplayback;
  demoplayback = true;
  US_InitRndT(false);
  const setup = SetupGameLevel(plane0, plane1, dgroup, options);
  ResetPlayLoopState(dgroup);
  const maxCommands = Math.min(options.maxCommands ?? demo.commands.length, demo.commands.length);
  const sampleEvery = Math.max(1, Math.trunc(options.sampleEvery ?? 1));
  const refreshVisibility = options.refreshVisibility ?? true;
  const trace: PlayDemoTraceSample[] = [];
  let lastStep: PlayLoopStepSummary | null = null;
  let commandsRun = 0;

  for (let index = 0; index < maxCommands; index++) {
    const command = demo.commands[index];
    lastStep = PlayLoopStepMemory(dgroup, plane0, plane1, {
      ...options,
      projectActorVisibility: options.projectActorVisibility ?? !refreshVisibility,
      demoCommand: command,
      demoDone: index === demo.commands.length - 1,
    });
    if (refreshVisibility) {
      RefreshDemoVisibility(dgroup);
    }
    commandsRun++;

    const shouldSample =
      (index % sampleEvery) === 0 ||
      index === maxCommands - 1 ||
      lastStep.playstate !== 0;
    if (shouldSample) {
      trace.push(playDemoTraceSample(
        dgroup,
        lastStep,
        command.byteOffset,
        index,
        command.buttonbits,
        command.controlx,
        command.controly,
      ));
    }

    if (lastStep.playstate) {
      break;
    }
  }
  demoplayback = previousDemoplayback;

  const playstate = dgroup.u16(nearOffsetForRuntimeSymbol("_playstate"));
  return {
    mapon: demo.mapon,
    difficulty: GD_HARD,
    commands: demo.commands.length,
    commandsRun,
    completed: commandsRun === demo.commands.length || playstate !== 0,
    setup,
    playstate,
    timeCount: dgroup.u32(gamestate + gamestateField("TimeCount")[0]),
    lastStep,
    dgroupChecksum: checksumBytes(dgroup.bytes),
    sampleEvery,
    trace,
    traceChecksum: checksumDemoTrace(trace),
  };
}

export function PlaySoundLocGlobal(
  dgroup: DOSMemory,
  sound: number,
  gx: number,
  gy: number,
  context: SoundProjectionContext,
  options: { readonly soundPlayed?: boolean } = {},
): PlaySoundLocSummary {
  const loc = SetSoundLoc(dgroup, gx, gy, context);
  const state = soundStateFor(dgroup);
  state.positioned = true;
  const played = options.soundPlayed ?? true;
  if (played) {
    state.globalsoundx = i32(gx);
    state.globalsoundy = i32(gy);
    state.lastSound = sound;
  }
  return {
    ...loc,
    sound,
    positioned: true,
    played,
    globalsoundx: state.globalsoundx,
    globalsoundy: state.globalsoundy,
  };
}

export function RecordDemo(options: RecordDemoOptions = {}): RecordDemoSummary {
  const prompt = {
    center: options.centerWindow?.(26, 3) ?? null,
    print: options.print?.("  Demo which level(1-10):") ?? "  Demo which level(1-10):",
  };
  const update = options.update?.() ?? null;
  const fadeIn = options.fadeIn?.() ?? null;
  const levelInput = options.levelInput ?? null;
  if (levelInput === null) {
    return {
      escaped: true,
      prompt,
      update,
      fadeIn,
      levelInput,
      level: null,
      newGame: null,
      map: null,
      startDemoRecord: null,
      drawPlayScreen: null,
      fadeInGame: null,
      demorecord,
      setupGameLevel: null,
      startMusic: null,
      checkMainMem: null,
      fizzlein: false,
      playLoop: null,
      demoplayback,
      stopMusic: null,
      fadeOut: null,
      clearMemory: null,
      finishDemoRecord: null,
    };
  }

  const level = Math.trunc(Number.parseInt(levelInput, 10)) - 1;
  const fadeOut = options.fadeOut?.() ?? null;
  const newGame = options.newGame?.(GD_HARD, Math.trunc(level / 10)) ?? null;
  const map = options.setMap?.(level % 10) ?? { mapon: level % 10 };
  const start = options.startDemoRecord?.(level) ?? StartDemoRecord(level);
  const drawPlayScreen = options.drawPlayScreen?.() ?? null;
  const fadeInGame = options.fadeIn?.() ?? null;
  demorecord = true;
  const setupGameLevel = options.setupGameLevel?.() ?? null;
  const startMusic = options.startMusic?.() ?? null;
  const checkMainMem = options.checkMainMem?.() ?? null;
  const fizzlein = true;
  const playLoop = options.playLoop?.() ?? null;
  demoplayback = false;
  const stopMusic = options.stopMusic?.() ?? null;
  const fadeOutAfter = options.fadeOut?.() ?? null;
  const clearMemory = options.clearMemory?.() ?? null;
  let finishDemoRecord = options.finishDemoRecord?.() ?? null;
  if (finishDemoRecord === null || finishDemoRecord === undefined) {
    if (options.startDemoRecord) {
      demorecord = false;
    } else {
      finishDemoRecord = FinishDemoRecord();
    }
  }
  demorecord = false;

  return {
    escaped: false,
    prompt,
    update,
    fadeIn,
    levelInput,
    level,
    newGame,
    map,
    startDemoRecord: start,
    drawPlayScreen,
    fadeInGame,
    demorecord,
    setupGameLevel,
    startMusic,
    checkMainMem,
    fizzlein,
    playLoop,
    demoplayback,
    stopMusic,
    fadeOut: fadeOutAfter ?? fadeOut,
    clearMemory,
    finishDemoRecord,
  };
}

export function ScanInfoPlane(
  plane1: Uint16Array,
  plane0: Uint16Array,
  dgroup: DOSMemory,
  options: EnemySpawnOptions = {},
): ScanInfoPlaneSummary {
  const playerScan = scanPlayerStartsMemory(plane1, plane0, dgroup);
  const staticScan = scanStaticPlaneMemory(plane1, dgroup, options);
  const secretScan = scanSecretPushwallsMemory(plane1, dgroup, options);
  const enemyScan = scanEnemyPlaneMemory(plane1, plane0, dgroup, options);
  return {
    players: playerScan.players,
    statics: staticScan.statics,
    secretPushwalls: secretScan.secretPushwalls,
    enemies: enemyScan.enemies,
    killtotal: enemyScan.killtotal,
  };
}

export function SetSoundLoc(
  dgroup: DOSMemory,
  gx: number,
  gy: number,
  context: SoundProjectionContext,
): SoundLocSummary {
  let localx = i32(gx - context.viewx);
  let localy = i32(gy - context.viewy);
  let xt = FixedByFracMemory(localx, context.viewcos);
  let yt = FixedByFracMemory(localy, context.viewsin);
  let x = (xt - yt) >> TILESHIFT;

  xt = FixedByFracMemory(localx, context.viewsin);
  yt = FixedByFracMemory(localy, context.viewcos);
  let y = (yt + xt) >> TILESHIFT;

  if (y >= ATABLEMAX) {
    y = ATABLEMAX - 1;
  } else if (y <= -ATABLEMAX) {
    y = -ATABLEMAX;
  }
  if (x < 0) {
    x = -x;
  }
  if (x >= ATABLEMAX) {
    x = ATABLEMAX - 1;
  }

  const leftchannel = LEFT_TABLE[x][y + ATABLEMAX];
  const rightchannel = RIGHT_TABLE[x][y + ATABLEMAX];
  const state = soundStateFor(dgroup);
  state.leftchannel = leftchannel;
  state.rightchannel = rightchannel;
  return { gx, gy, x, y, leftchannel, rightchannel };
}

export function SetupGameLevel(
  plane0: Uint16Array,
  plane1: Uint16Array,
  dgroup: DOSMemory,
  options: SetupGameLevelOptions = {},
): SetupGameLevelSummary {
  if (!options.loadedgame) {
    clearLevelTotals(dgroup);
  }
  US_InitRndT(demoplayback || demorecord ? false : true);
  const copied = copyWallDataToLevelMemory(plane0, dgroup);
  InitActorListMemory(dgroup);
  InitDoorListMemory(dgroup, options.areaconnect);
  InitStaticListMemory(dgroup);
  const doorScan = spawnDoorsFromWallPlane(plane0, dgroup);
  const infoScan = ScanInfoPlane(plane1, plane0, dgroup, options);
  const cleaned = clearAmbushMarkers(plane0, dgroup);
  return {
    walls: copied.walls,
    floors: copied.floors,
    doors: doorScan.doors,
    players: infoScan.players,
    statics: infoScan.statics,
    secretPushwalls: infoScan.secretPushwalls,
    enemies: infoScan.enemies,
    ambushMarkers: cleaned.ambushMarkers,
    killtotal: infoScan.killtotal,
  };
}

export function StartDemoRecord(levelnumber: number, options: StartDemoRecordOptions = {}): StartDemoRecordSummary {
  demobuffer = new Uint8Array(MAXDEMOSIZE);
  demoptr = 0;
  lastdemoptr = MAXDEMOSIZE;
  demobuffer[demoptr] = Math.trunc(levelnumber) & 0xff;
  demoptr += 4;
  demorecord = true;

  for (const command of options.commands ?? []) {
    appendDemoRecordCommand(command);
  }

  return {
    levelnumber: Math.trunc(levelnumber),
    maxSize: MAXDEMOSIZE,
    demoptr,
    lastdemoptr,
    demorecord,
    commands: options.commands?.length ?? 0,
    buffer: demobuffer.slice(0, demoptr),
  };
}

export function UpdateSoundLoc(
  dgroup: DOSMemory,
  context: SoundProjectionContext,
  options: { readonly soundPositioned?: boolean } = {},
): UpdateSoundLocSummary {
  const state = soundStateFor(dgroup);
  const positioned = options.soundPositioned ?? state.positioned;
  if (!positioned) {
    return {
      updated: false,
      leftchannel: state.leftchannel,
      rightchannel: state.rightchannel,
      globalsoundx: state.globalsoundx,
      globalsoundy: state.globalsoundy,
    };
  }
  const loc = SetSoundLoc(dgroup, state.globalsoundx, state.globalsoundy, context);
  return {
    updated: true,
    leftchannel: loc.leftchannel,
    rightchannel: loc.rightchannel,
    globalsoundx: state.globalsoundx,
    globalsoundy: state.globalsoundy,
  };
}

function clearLevelTotals(dgroup: DOSMemory): void {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  for (const name of [
    "TimeCount",
    "secrettotal",
    "killtotal",
    "treasuretotal",
    "secretcount",
    "killcount",
    "treasurecount",
  ]) {
    const [offset, bytes] = gamestateField(name);
    dgroup.view(gamestate + offset, bytes).fill(0);
  }
}

function gamestateField(name: string): [number, number] {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing gamestate field ${name}`);
  }
  return [field[1], field[2]];
}

function structOffset(layout: keyof typeof STRUCT_LAYOUTS, name: string): number {
  const field = STRUCT_LAYOUTS[layout].fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing ${layout} field ${name}`);
  }
  return field[1];
}

function playDemoTraceSample(
  dgroup: DOSMemory,
  lastStep: PlayLoopStepSummary | null,
  byteOffset: number,
  commandIndex: number,
  buttonbits: number,
  controlx: number,
  controly: number,
): PlayDemoTraceSample {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const tilexOffset = structOffset("objtype", "tilex");
  const tileyOffset = structOffset("objtype", "tiley");
  const angleOffset = structOffset("objtype", "angle");
  const sound = SD_DebugState();
  return {
    commandIndex,
    byteOffset,
    buttonbits,
    controlx,
    controly,
    rndindex,
    timeCount: dgroup.u32(gamestate + gamestateField("TimeCount")[0]),
    playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
    dgroupChecksum: checksumBytes(dgroup.bytes),
    playerTilex: player ? dgroup.u16(player + tilexOffset) : 0,
    playerTiley: player ? dgroup.u16(player + tileyOffset) : 0,
    playerAngle: player ? dgroup.u16(player + angleOffset) : 0,
    health: dgroup.u16(gamestate + gamestateField("health")[0]),
    ammo: dgroup.u16(gamestate + gamestateField("ammo")[0]),
    weapon: dgroup.u16(gamestate + gamestateField("weapon")[0]),
    chosenweapon: dgroup.u16(gamestate + gamestateField("chosenweapon")[0]),
    attackframe: dgroup.u16(gamestate + gamestateField("attackframe")[0]),
    attackcount: dgroup.i16(gamestate + gamestateField("attackcount")[0]),
    weaponframe: dgroup.u16(gamestate + gamestateField("weaponframe")[0]),
    facecount: dgroup.i16(nearOffsetForRuntimeSymbol("_facecount")),
    faceframe: dgroup.u16(gamestate + gamestateField("faceframe")[0]),
    soundPlaying: SD_SoundPlaying(),
    soundMode: sound.SoundMode,
    soundPriority: sound.SoundPriority,
    pcSoundActive: sound.pcSoundActive,
    pcLengthLeft: sound.pcLengthLeft,
    alSoundActive: sound.alSoundActive,
    alLengthLeft: sound.alLengthLeft,
    score: dgroup.u32(gamestate + gamestateField("score")[0]),
    actorCount: countDemoActors(dgroup),
    shotActions: demoTraceShotActions(dgroup, lastStep),
    damageActions: demoTraceDamageActions(dgroup, lastStep),
    playerAttacks: demoTracePlayerAttacks(dgroup, lastStep),
  };
}

function demoTracePlayerAttacks(
  dgroup: DOSMemory,
  lastStep: PlayLoopStepSummary | null,
): PlayDemoTracePlayerAttack[] {
  const attacks: PlayDemoTracePlayerAttack[] = [];
  if (!lastStep) {
    return attacks;
  }
  for (const step of lastStep.actorSteps) {
    for (const think of step.thinkResults ?? []) {
      attacks.push(...demoTraceThinkAttacks(dgroup, think));
    }
  }
  return attacks;
}

function demoTraceThinkAttacks(
  dgroup: DOSMemory,
  think: DispatchedThinkSummary,
): PlayDemoTracePlayerAttack[] {
  if (think.think !== "T_Attack") {
    return [];
  }
  return think.attack.attacks.map((attack) => {
    const target = attack.target;
    const damageResult = attack.damageResult;
    const classOffset = structOffset("objtype", "obclass");
    const tilexOffset = structOffset("objtype", "tilex");
    const tileyOffset = structOffset("objtype", "tiley");
    const hitpointsOffset = structOffset("objtype", "hitpoints");
    return {
      target,
      obclass: target ? dgroup.u16(target + classOffset) : 0,
      tilex: target ? dgroup.u16(target + tilexOffset) : 0,
      tiley: target ? dgroup.u16(target + tileyOffset) : 0,
      hit: attack.hit,
      damage: attack.damage,
      dist: attack.dist,
      lineClear: attack.lineClear,
      hitpoints: target ? dgroup.i16(target + hitpointsOffset) : null,
      killed: damageResult?.killed ?? false,
      killstate: damageResult?.state ?? null,
    };
  });
}

function demoTraceDamageActions(
  dgroup: DOSMemory,
  lastStep: PlayLoopStepSummary | null,
): PlayDemoTraceDamageAction[] {
  const actions: PlayDemoTraceDamageAction[] = [];
  if (!lastStep) {
    return actions;
  }
  for (const step of lastStep.actorSteps) {
    for (const action of step.actions ?? []) {
      const summary = demoTraceDamageAction(dgroup, step.actor, step.state, action);
      if (summary) {
        actions.push(summary);
      }
    }
  }
  return actions;
}

function demoTraceShotActions(
  dgroup: DOSMemory,
  lastStep: PlayLoopStepSummary | null,
): PlayDemoTraceShotAction[] {
  const actions: PlayDemoTraceShotAction[] = [];
  if (!lastStep) {
    return actions;
  }
  for (const step of lastStep.actorSteps) {
    for (const action of step.actions ?? []) {
      if (action.action !== "T_Shoot") {
        continue;
      }
      const classOffset = structOffset("objtype", "obclass");
      const tilexOffset = structOffset("objtype", "tilex");
      const tileyOffset = structOffset("objtype", "tiley");
      actions.push({
        actor: step.actor,
        obclass: dgroup.u16(step.actor + classOffset),
        tilex: dgroup.u16(step.actor + tilexOffset),
        tiley: dgroup.u16(step.actor + tileyOffset),
        state: step.state,
        areaVisible: action.shoot.areaVisible,
        lineClear: action.shoot.lineClear,
        visible: action.shoot.visible,
        hit: action.shoot.hit,
        damage: action.shoot.damage,
        hitchance: action.shoot.hitchance,
        hitRoll: action.shoot.hitRoll,
        damageRoll: action.shoot.damageRoll,
        dist: action.shoot.dist,
        thrustspeed: action.shoot.thrustspeed,
        health: action.shoot.health,
      });
    }
  }
  return actions;
}

function demoTraceDamageAction(
  dgroup: DOSMemory,
  actor: number,
  state: string | null,
  action: DispatchedActionSummary,
): PlayDemoTraceDamageAction | null {
  if (action.action === "T_Shoot") {
    if (!action.shoot.hit || !action.shoot.damage) {
      return null;
    }
    return demoTraceDamageActionForActor(
      dgroup,
      actor,
      state,
      "T_Shoot",
      action.shoot.damage,
      action.shoot.health,
      action.shoot.hit,
    );
  }
  if (action.action === "T_Bite") {
    if (!action.bite.hit || !action.bite.damage) {
      return null;
    }
    return demoTraceDamageActionForActor(
      dgroup,
      actor,
      state,
      "T_Bite",
      action.bite.damage,
      action.bite.health,
      action.bite.hit,
    );
  }
  if (action.action === "T_Projectile") {
    if (!action.projectile.hitPlayer || !action.projectile.damage) {
      return null;
    }
    return demoTraceDamageActionForActor(
      dgroup,
      actor,
      state,
      "T_Projectile",
      action.projectile.damage,
      dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + gamestateField("health")[0]),
      action.projectile.hitPlayer,
    );
  }
  return null;
}

function demoTraceDamageActionForActor(
  dgroup: DOSMemory,
  actor: number,
  state: string | null,
  action: PlayDemoTraceDamageAction["action"],
  damage: number,
  health: number,
  hit: boolean,
): PlayDemoTraceDamageAction {
  const classOffset = structOffset("objtype", "obclass");
  const tilexOffset = structOffset("objtype", "tilex");
  const tileyOffset = structOffset("objtype", "tiley");
  return {
    actor,
    obclass: dgroup.u16(actor + classOffset),
    tilex: dgroup.u16(actor + tilexOffset),
    tiley: dgroup.u16(actor + tileyOffset),
    state,
    action,
    damage,
    health,
    hit,
  };
}

function countDemoActors(dgroup: DOSMemory): number {
  let actor = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const nextOffset = structOffset("objtype", "next");
  let count = 0;
  while (actor) {
    count++;
    if (count > 150) {
      throw new Error("PlayDemoTrace actor list exceeded MAXACTORS");
    }
    actor = dgroup.u16(actor + nextOffset);
  }
  return count;
}

function checksumDemoTrace(trace: readonly PlayDemoTraceSample[]): number {
  let checksum = 0x811c9dc5;
  for (const sample of trace) {
    checksum = checksumTraceValue(checksum, sample.commandIndex);
    checksum = checksumTraceValue(checksum, sample.byteOffset);
    checksum = checksumTraceValue(checksum, sample.buttonbits);
    checksum = checksumTraceValue(checksum, sample.controlx);
    checksum = checksumTraceValue(checksum, sample.controly);
    checksum = checksumTraceValue(checksum, sample.timeCount);
    checksum = checksumTraceValue(checksum, sample.playstate);
    checksum = checksumTraceValue(checksum, sample.dgroupChecksum);
    checksum = checksumTraceValue(checksum, sample.playerTilex);
    checksum = checksumTraceValue(checksum, sample.playerTiley);
    checksum = checksumTraceValue(checksum, sample.playerAngle);
    checksum = checksumTraceValue(checksum, sample.health);
    checksum = checksumTraceValue(checksum, sample.ammo);
    checksum = checksumTraceValue(checksum, sample.score);
    checksum = checksumTraceValue(checksum, sample.actorCount);
    for (const attack of sample.playerAttacks) {
      checksum = checksumTraceValue(checksum, attack.target ?? 0);
      checksum = checksumTraceValue(checksum, attack.obclass);
      checksum = checksumTraceValue(checksum, attack.tilex);
      checksum = checksumTraceValue(checksum, attack.tiley);
      checksum = checksumTraceValue(checksum, attack.hit ? 1 : 0);
      checksum = checksumTraceValue(checksum, attack.damage);
      checksum = checksumTraceValue(checksum, attack.dist);
      checksum = checksumTraceValue(checksum, attack.lineClear === null ? 2 : attack.lineClear ? 1 : 0);
      checksum = checksumTraceValue(checksum, attack.hitpoints ?? 0);
      checksum = checksumTraceValue(checksum, attack.killed ? 1 : 0);
    }
    for (const action of sample.damageActions) {
      checksum = checksumTraceValue(checksum, action.actor);
      checksum = checksumTraceValue(checksum, action.obclass);
      checksum = checksumTraceValue(checksum, action.tilex);
      checksum = checksumTraceValue(checksum, action.tiley);
      checksum = checksumTraceValue(checksum, action.damage);
      checksum = checksumTraceValue(checksum, action.health);
      checksum = checksumTraceValue(checksum, action.hit ? 1 : 0);
    }
  }
  return checksum >>> 0;
}

function checksumTraceValue(checksum: number, value: number): number {
  let next = checksum >>> 0;
  const word = value >>> 0;
  for (let shift = 0; shift < 32; shift += 8) {
    next ^= (word >>> shift) & 0xff;
    next = Math.imul(next, 0x01000193) >>> 0;
  }
  return next;
}

function soundStateFor(dgroup: DOSMemory): SoundState {
  let state = SOUND_STATES.get(dgroup);
  if (!state) {
    state = {
      globalsoundx: 0,
      globalsoundy: 0,
      leftchannel: 0,
      rightchannel: 0,
      positioned: false,
      lastSound: null,
    };
    SOUND_STATES.set(dgroup, state);
  }
  return state;
}

function checksumBytes(bytes: Uint8Array): number {
  let checksum = 0x811c9dc5;
  for (const byte of bytes) {
    checksum ^= byte;
    checksum = Math.imul(checksum, 0x01000193) >>> 0;
  }
  return checksum;
}

function statusBarDrawOptions(options: DrawPlayScreenOptions): DrawPicOptions {
  const drawOptions: DrawPicOptions = {};
  if (options.statusBarSource) {
    (drawOptions as { source?: Uint8Array }).source = options.statusBarSource;
  }
  if (options.statusBarWidth !== undefined) {
    (drawOptions as { width?: number }).width = options.statusBarWidth;
  }
  if (options.statusBarHeight !== undefined) {
    (drawOptions as { height?: number }).height = options.statusBarHeight;
  }
  const pictable = options.statusBarPictable ?? options.pictable;
  if (pictable) {
    (drawOptions as { pictable?: Uint8Array }).pictable = pictable;
  }
  return drawOptions;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_GAME.C
// 
// #include "WL_DEF.H"
// #pragma hdrstop
// 
// #ifdef MYPROFILE
// #include <TIME.H>
// #endif
// 
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// boolean		ingame,fizzlein;
// unsigned	latchpics[NUMLATCHPICS];
// gametype	gamestate;
// 
// long		spearx,speary;
// unsigned	spearangle;
// boolean		spearflag;
// 
// //
// // ELEVATOR BACK MAPS - REMEMBER (-1)!!
// //
// int ElevatorBackTo[]={1,1,7,3,5,3};
// 
// void ScanInfoPlane (void);
// void SetupGameLevel (void);
// void DrawPlayScreen (void);
// void LoadLatchMem (void);
// void GameLoop (void);
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// 
// //===========================================================================
// //===========================================================================
// 
// 
// /*
// ==========================
// =
// = SetSoundLoc - Given the location of an object (in terms of global
// =	coordinates, held in globalsoundx and globalsoundy), munges the values
// =	for an approximate distance from the left and right ear, and puts
// =	those values into leftchannel and rightchannel.
// =
// = JAB
// =
// ==========================
// */
// 
// 	fixed	globalsoundx,globalsoundy;
// 	int		leftchannel,rightchannel;
// #define ATABLEMAX 15
// byte righttable[ATABLEMAX][ATABLEMAX * 2] = {
// { 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 6, 0, 0, 0, 0, 0, 1, 3, 5, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 6, 4, 0, 0, 0, 0, 0, 2, 4, 6, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 4, 1, 0, 0, 0, 1, 2, 4, 6, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 6, 5, 4, 2, 1, 0, 1, 2, 3, 5, 7, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 5, 4, 3, 2, 2, 3, 3, 5, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 4, 4, 5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 5, 5, 6, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8}
// };
// byte lefttable[ATABLEMAX][ATABLEMAX * 2] = {
// { 8, 8, 8, 8, 8, 8, 8, 8, 5, 3, 1, 0, 0, 0, 0, 0, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 6, 4, 2, 0, 0, 0, 0, 0, 4, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 6, 4, 2, 1, 0, 0, 0, 1, 4, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 7, 5, 3, 2, 1, 0, 1, 2, 4, 5, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 5, 3, 3, 2, 2, 3, 4, 5, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 6, 5, 4, 4, 4, 4, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 6, 6, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
// { 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8}
// };
// 
// void
// SetSoundLoc(fixed gx,fixed gy)
// {
// 	fixed	xt,yt;
// 	int		x,y;
// 
// //
// // translate point to view centered coordinates
// //
// 	gx -= viewx;
// 	gy -= viewy;
// 
// //
// // calculate newx
// //
// 	xt = FixedByFrac(gx,viewcos);
// 	yt = FixedByFrac(gy,viewsin);
// 	x = (xt - yt) >> TILESHIFT;
// 
// //
// // calculate newy
// //
// 	xt = FixedByFrac(gx,viewsin);
// 	yt = FixedByFrac(gy,viewcos);
// 	y = (yt + xt) >> TILESHIFT;
// 
// 	if (y >= ATABLEMAX)
// 		y = ATABLEMAX - 1;
// 	else if (y <= -ATABLEMAX)
// 		y = -ATABLEMAX;
// 	if (x < 0)
// 		x = -x;
// 	if (x >= ATABLEMAX)
// 		x = ATABLEMAX - 1;
// 	leftchannel  =  lefttable[x][y + ATABLEMAX];
// 	rightchannel = righttable[x][y + ATABLEMAX];
// 
// #if 0
// 	CenterWindow(8,1);
// 	US_PrintSigned(leftchannel);
// 	US_Print(",");
// 	US_PrintSigned(rightchannel);
// 	VW_UpdateScreen();
// #endif
// }
// 
// /*
// ==========================
// =
// = SetSoundLocGlobal - Sets up globalsoundx & globalsoundy and then calls
// =	UpdateSoundLoc() to transform that into relative channel volumes. Those
// =	values are then passed to the Sound Manager so that they'll be used for
// =	the next sound played (if possible).
// =
// = JAB
// =
// ==========================
// */
// void PlaySoundLocGlobal(word s,fixed gx,fixed gy)
// {
// 	SetSoundLoc(gx,gy);
// 	SD_PositionSound(leftchannel,rightchannel);
// 	if (SD_PlaySound(s))
// 	{
// 		globalsoundx = gx;
// 		globalsoundy = gy;
// 	}
// }
// 
// void UpdateSoundLoc(void)
// {
// 	if (SoundPositioned)
// 	{
// 		SetSoundLoc(globalsoundx,globalsoundy);
// 		SD_SetPosition(leftchannel,rightchannel);
// 	}
// }
// 
// /*
// **	JAB End
// */
// 
// 
// /*
// ==========================
// =
// = ClearMemory
// =
// ==========================
// */
// 
// void ClearMemory (void)
// {
// 	PM_UnlockMainMem();
// 	SD_StopDigitized();
// 	MM_SortMem ();
// }
// 
// 
// /*
// ==========================
// =
// = ScanInfoPlane
// =
// = Spawn all actors and mark down special places
// =
// ==========================
// */
// 
// void ScanInfoPlane (void)
// {
// 	unsigned	x,y,i,j;
// 	int			tile;
// 	unsigned	far	*start;
// 
// 	start = mapsegs[1];
// 	for (y=0;y<mapheight;y++)
// 		for (x=0;x<mapwidth;x++)
// 		{
// 			tile = *start++;
// 			if (!tile)
// 				continue;
// 
// 			switch (tile)
// 			{
// 			case 19:
// 			case 20:
// 			case 21:
// 			case 22:
// 				SpawnPlayer(x,y,NORTH+tile-19);
// 				break;
// 
// 			case 23:
// 			case 24:
// 			case 25:
// 			case 26:
// 			case 27:
// 			case 28:
// 			case 29:
// 			case 30:
// 
// 			case 31:
// 			case 32:
// 			case 33:
// 			case 34:
// 			case 35:
// 			case 36:
// 			case 37:
// 			case 38:
// 
// 			case 39:
// 			case 40:
// 			case 41:
// 			case 42:
// 			case 43:
// 			case 44:
// 			case 45:
// 			case 46:
// 
// 			case 47:
// 			case 48:
// 			case 49:
// 			case 50:
// 			case 51:
// 			case 52:
// 			case 53:
// 			case 54:
// 
// 			case 55:
// 			case 56:
// 			case 57:
// 			case 58:
// 			case 59:
// 			case 60:
// 			case 61:
// 			case 62:
// 
// 			case 63:
// 			case 64:
// 			case 65:
// 			case 66:
// 			case 67:
// 			case 68:
// 			case 69:
// 			case 70:
// 			case 71:
// 			case 72:
// 			case 73:						// TRUCK AND SPEAR!
// 			case 74:
// 
// 				SpawnStatic(x,y,tile-23);
// 				break;
// 
// //
// // P wall
// //
// 			case 98:
// 				if (!loadedgame)
// 				  gamestate.secrettotal++;
// 				break;
// 
// //
// // guard
// //
// 			case 180:
// 			case 181:
// 			case 182:
// 			case 183:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 144:
// 			case 145:
// 			case 146:
// 			case 147:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 108:
// 			case 109:
// 			case 110:
// 			case 111:
// 				SpawnStand(en_guard,x,y,tile-108);
// 				break;
// 
// 
// 			case 184:
// 			case 185:
// 			case 186:
// 			case 187:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 148:
// 			case 149:
// 			case 150:
// 			case 151:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 112:
// 			case 113:
// 			case 114:
// 			case 115:
// 				SpawnPatrol(en_guard,x,y,tile-112);
// 				break;
// 
// 			case 124:
// 				SpawnDeadGuard (x,y);
// 				break;
// //
// // officer
// //
// 			case 188:
// 			case 189:
// 			case 190:
// 			case 191:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 152:
// 			case 153:
// 			case 154:
// 			case 155:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 116:
// 			case 117:
// 			case 118:
// 			case 119:
// 				SpawnStand(en_officer,x,y,tile-116);
// 				break;
// 
// 
// 			case 192:
// 			case 193:
// 			case 194:
// 			case 195:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 156:
// 			case 157:
// 			case 158:
// 			case 159:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 120:
// 			case 121:
// 			case 122:
// 			case 123:
// 				SpawnPatrol(en_officer,x,y,tile-120);
// 				break;
// 
// 
// //
// // ss
// //
// 			case 198:
// 			case 199:
// 			case 200:
// 			case 201:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 162:
// 			case 163:
// 			case 164:
// 			case 165:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 126:
// 			case 127:
// 			case 128:
// 			case 129:
// 				SpawnStand(en_ss,x,y,tile-126);
// 				break;
// 
// 
// 			case 202:
// 			case 203:
// 			case 204:
// 			case 205:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 166:
// 			case 167:
// 			case 168:
// 			case 169:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 130:
// 			case 131:
// 			case 132:
// 			case 133:
// 				SpawnPatrol(en_ss,x,y,tile-130);
// 				break;
// 
// //
// // dogs
// //
// 			case 206:
// 			case 207:
// 			case 208:
// 			case 209:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 170:
// 			case 171:
// 			case 172:
// 			case 173:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 134:
// 			case 135:
// 			case 136:
// 			case 137:
// 				SpawnStand(en_dog,x,y,tile-134);
// 				break;
// 
// 
// 			case 210:
// 			case 211:
// 			case 212:
// 			case 213:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 36;
// 			case 174:
// 			case 175:
// 			case 176:
// 			case 177:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 36;
// 			case 138:
// 			case 139:
// 			case 140:
// 			case 141:
// 				SpawnPatrol(en_dog,x,y,tile-138);
// 				break;
// 
// //
// // boss
// //
// #ifndef SPEAR
// 			case 214:
// 				SpawnBoss (x,y);
// 				break;
// 			case 197:
// 				SpawnGretel (x,y);
// 				break;
// 			case 215:
// 				SpawnGift (x,y);
// 				break;
// 			case 179:
// 				SpawnFat (x,y);
// 				break;
// 			case 196:
// 				SpawnSchabbs (x,y);
// 				break;
// 			case 160:
// 				SpawnFakeHitler (x,y);
// 				break;
// 			case 178:
// 				SpawnHitler (x,y);
// 				break;
// #else
// 			case 106:
// 				SpawnSpectre (x,y);
// 				break;
// 			case 107:
// 				SpawnAngel (x,y);
// 				break;
// 			case 125:
// 				SpawnTrans (x,y);
// 				break;
// 			case 142:
// 				SpawnUber (x,y);
// 				break;
// 			case 143:
// 				SpawnWill (x,y);
// 				break;
// 			case 161:
// 				SpawnDeath (x,y);
// 				break;
// 
// #endif
// 
// //
// // mutants
// //
// 			case 252:
// 			case 253:
// 			case 254:
// 			case 255:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 18;
// 			case 234:
// 			case 235:
// 			case 236:
// 			case 237:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 18;
// 			case 216:
// 			case 217:
// 			case 218:
// 			case 219:
// 				SpawnStand(en_mutant,x,y,tile-216);
// 				break;
// 
// 			case 256:
// 			case 257:
// 			case 258:
// 			case 259:
// 				if (gamestate.difficulty<gd_hard)
// 					break;
// 				tile -= 18;
// 			case 238:
// 			case 239:
// 			case 240:
// 			case 241:
// 				if (gamestate.difficulty<gd_medium)
// 					break;
// 				tile -= 18;
// 			case 220:
// 			case 221:
// 			case 222:
// 			case 223:
// 				SpawnPatrol(en_mutant,x,y,tile-220);
// 				break;
// 
// //
// // ghosts
// //
// #ifndef SPEAR
// 			case 224:
// 				SpawnGhosts (en_blinky,x,y);
// 				break;
// 			case 225:
// 				SpawnGhosts (en_clyde,x,y);
// 				break;
// 			case 226:
// 				SpawnGhosts (en_pinky,x,y);
// 				break;
// 			case 227:
// 				SpawnGhosts (en_inky,x,y);
// 				break;
// #endif
// 			}
// 
// 		}
// }
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = SetupGameLevel
// =
// ==================
// */
// 
// void SetupGameLevel (void)
// {
// 	int	x,y,i;
// 	unsigned	far *map,tile,spot;
// 
// 
// 	if (!loadedgame)
// 	{
// 	 gamestate.TimeCount=
// 	 gamestate.secrettotal=
// 	 gamestate.killtotal=
// 	 gamestate.treasuretotal=
// 	 gamestate.secretcount=
// 	 gamestate.killcount=
// 	 gamestate.treasurecount=0;
// 	}
// 
// 	if (demoplayback || demorecord)
// 		US_InitRndT (false);
// 	else
// 		US_InitRndT (true);
// 
// //
// // load the level
// //
// 	CA_CacheMap (gamestate.mapon+10*gamestate.episode);
// 	mapon-=gamestate.episode*10;
// 
// 	mapwidth = mapheaderseg[mapon]->width;
// 	mapheight = mapheaderseg[mapon]->height;
// 
// 	if (mapwidth != 64 || mapheight != 64)
// 		Quit ("Map not 64*64!");
// 
// 
// //
// // copy the wall data to a data segment array
// //
// 	memset (tilemap,0,sizeof(tilemap));
// 	memset (actorat,0,sizeof(actorat));
// 	map = mapsegs[0];
// 	for (y=0;y<mapheight;y++)
// 		for (x=0;x<mapwidth;x++)
// 		{
// 			tile = *map++;
// 			if (tile<AREATILE)
// 			{
// 			// solid wall
// 				tilemap[x][y] = tile;
// 				(unsigned)actorat[x][y] = tile;
// 			}
// 			else
// 			{
// 			// area floor
// 				tilemap[x][y] = 0;
// 				(unsigned)actorat[x][y] = 0;
// 			}
// 		}
// 
// //
// // spawn doors
// //
// 	InitActorList ();			// start spawning things with a clean slate
// 	InitDoorList ();
// 	InitStaticList ();
// 
// 	map = mapsegs[0];
// 	for (y=0;y<mapheight;y++)
// 		for (x=0;x<mapwidth;x++)
// 		{
// 			tile = *map++;
// 			if (tile >= 90 && tile <= 101)
// 			{
// 			// door
// 				switch (tile)
// 				{
// 				case 90:
// 				case 92:
// 				case 94:
// 				case 96:
// 				case 98:
// 				case 100:
// 					SpawnDoor (x,y,1,(tile-90)/2);
// 					break;
// 				case 91:
// 				case 93:
// 				case 95:
// 				case 97:
// 				case 99:
// 				case 101:
// 					SpawnDoor (x,y,0,(tile-91)/2);
// 					break;
// 				}
// 			}
// 		}
// 
// //
// // spawn actors
// //
// 	ScanInfoPlane ();
// 
// //
// // take out the ambush markers
// //
// 	map = mapsegs[0];
// 	for (y=0;y<mapheight;y++)
// 		for (x=0;x<mapwidth;x++)
// 		{
// 			tile = *map++;
// 			if (tile == AMBUSHTILE)
// 			{
// 				tilemap[x][y] = 0;
// 				if ( (unsigned)actorat[x][y] == AMBUSHTILE)
// 					actorat[x][y] = NULL;
// 
// 				if (*map >= AREATILE)
// 					tile = *map;
// 				if (*(map-1-mapwidth) >= AREATILE)
// 					tile = *(map-1-mapwidth);
// 				if (*(map-1+mapwidth) >= AREATILE)
// 					tile = *(map-1+mapwidth);
// 				if ( *(map-2) >= AREATILE)
// 					tile = *(map-2);
// 
// 				*(map-1) = tile;
// 			}
// 		}
// 
// 
// 
// //
// // have the caching manager load and purge stuff to make sure all marks
// // are in memory
// //
// 	CA_LoadAllSounds ();
// 
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// ===================
// =
// = DrawPlayBorderSides
// =
// = To fix window overwrites
// =
// ===================
// */
// 
// void DrawPlayBorderSides (void)
// {
// 	int	xl,yl;
// 
// 	xl = 160-viewwidth/2;
// 	yl = (200-STATUSLINES-viewheight)/2;
// 
// 	VWB_Bar (0,0,xl-1,200-STATUSLINES,127);
// 	VWB_Bar (xl+viewwidth+1,0,xl-2,200-STATUSLINES,127);
// 
// 	VWB_Vlin (yl-1,yl+viewheight,xl-1,0);
// 	VWB_Vlin (yl-1,yl+viewheight,xl+viewwidth,125);
// }
// 
// 
// /*
// ===================
// =
// = DrawAllPlayBorderSides
// =
// ===================
// */
// 
// void DrawAllPlayBorderSides (void)
// {
// 	unsigned	i,temp;
// 
// 	temp = bufferofs;
// 	for (i=0;i<3;i++)
// 	{
// 		bufferofs = screenloc[i];
// 		DrawPlayBorderSides ();
// 	}
// 	bufferofs = temp;
// }
// 
// /*
// ===================
// =
// = DrawPlayBorder
// =
// ===================
// */
// void DrawAllPlayBorder (void)
// {
// 	unsigned	i,temp;
// 
// 	temp = bufferofs;
// 	for (i=0;i<3;i++)
// 	{
// 		bufferofs = screenloc[i];
// 		DrawPlayBorder ();
// 	}
// 	bufferofs = temp;
// }
// 
// /*
// ===================
// =
// = DrawPlayBorder
// =
// ===================
// */
// 
// void DrawPlayBorder (void)
// {
// 	int	xl,yl;
// 
// 	VWB_Bar (0,0,320,200-STATUSLINES,127);
// 
// 	xl = 160-viewwidth/2;
// 	yl = (200-STATUSLINES-viewheight)/2;
// 	VWB_Bar (xl,yl,viewwidth,viewheight,0);
// 
// 	VWB_Hlin (xl-1,xl+viewwidth,yl-1,0);
// 	VWB_Hlin (xl-1,xl+viewwidth,yl+viewheight,125);
// 	VWB_Vlin (yl-1,yl+viewheight,xl-1,0);
// 	VWB_Vlin (yl-1,yl+viewheight,xl+viewwidth,125);
// 	VWB_Plot (xl-1,yl+viewheight,124);
// }
// 
// 
// 
// /*
// ===================
// =
// = DrawPlayScreen
// =
// ===================
// */
// 
// void DrawPlayScreen (void)
// {
// 	int	i,j,p,m;
// 	unsigned	temp;
// 
// 	VW_FadeOut ();
// 
// 	temp = bufferofs;
// 
// 	CA_CacheGrChunk (STATUSBARPIC);
// 
// 	for (i=0;i<3;i++)
// 	{
// 		bufferofs = screenloc[i];
// 		DrawPlayBorder ();
// 		VWB_DrawPic (0,200-STATUSLINES,STATUSBARPIC);
// 	}
// 
// 	bufferofs = temp;
// 
// 	UNCACHEGRCHUNK (STATUSBARPIC);
// 
// 	DrawFace ();
// 	DrawHealth ();
// 	DrawLives ();
// 	DrawLevel ();
// 	DrawAmmo ();
// 	DrawKeys ();
// 	DrawWeapon ();
// 	DrawScore ();
// }
// 
// 
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = StartDemoRecord
// =
// ==================
// */
// 
// #define MAXDEMOSIZE	8192
// 
// void StartDemoRecord (int levelnumber)
// {
// 	MM_GetPtr (&demobuffer,MAXDEMOSIZE);
// 	MM_SetLock (&demobuffer,true);
// 	demoptr = (char far *)demobuffer;
// 	lastdemoptr = demoptr+MAXDEMOSIZE;
// 
// 	*demoptr = levelnumber;
// 	demoptr += 4;				// leave space for length
// 	demorecord = true;
// }
// 
// 
// /*
// ==================
// =
// = FinishDemoRecord
// =
// ==================
// */
// 
// char	demoname[13] = "DEMO?.";
// 
// void FinishDemoRecord (void)
// {
// 	long	length,level;
// 
// 	demorecord = false;
// 
// 	length = demoptr - (char far *)demobuffer;
// 
// 	demoptr = ((char far *)demobuffer)+1;
// 	*(unsigned far *)demoptr = length;
// 
// 	CenterWindow(24,3);
// 	PrintY+=6;
// 	US_Print(" Demo number (0-9):");
// 	VW_UpdateScreen();
// 
// 	if (US_LineInput (px,py,str,NULL,true,2,0))
// 	{
// 		level = atoi (str);
// 		if (level>=0 && level<=9)
// 		{
// 			demoname[4] = '0'+level;
// 			CA_WriteFile (demoname,(void far *)demobuffer,length);
// 		}
// 	}
// 
// 
// 	MM_FreePtr (&demobuffer);
// }
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = RecordDemo
// =
// = Fades the screen out, then starts a demo.  Exits with the screen faded
// =
// ==================
// */
// 
// void RecordDemo (void)
// {
// 	int level,esc;
// 
// 	CenterWindow(26,3);
// 	PrintY+=6;
// 	CA_CacheGrChunk(STARTFONT);
// 	fontnumber=0;
// 	US_Print("  Demo which level(1-10):");
// 	VW_UpdateScreen();
// 	VW_FadeIn ();
// 	esc = !US_LineInput (px,py,str,NULL,true,2,0);
// 	if (esc)
// 		return;
// 
// 	level = atoi (str);
// 	level--;
// 
// 	SETFONTCOLOR(0,15);
// 	VW_FadeOut ();
// 
// #ifndef SPEAR
// 	NewGame (gd_hard,level/10);
// 	gamestate.mapon = level%10;
// #else
// 	NewGame (gd_hard,0);
// 	gamestate.mapon = level;
// #endif
// 
// 	StartDemoRecord (level);
// 
// 	DrawPlayScreen ();
// 	VW_FadeIn ();
// 
// 	startgame = false;
// 	demorecord = true;
// 
// 	SetupGameLevel ();
// 	StartMusic ();
// 	PM_CheckMainMem ();
// 	fizzlein = true;
// 
// 	PlayLoop ();
// 
// 	demoplayback = false;
// 
// 	StopMusic ();
// 	VW_FadeOut ();
// 	ClearMemory ();
// 
// 	FinishDemoRecord ();
// }
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = PlayDemo
// =
// = Fades the screen out, then starts a demo.  Exits with the screen faded
// =
// ==================
// */
// 
// void PlayDemo (int demonumber)
// {
// 	int length;
// 
// #ifdef DEMOSEXTERN
// // debug: load chunk
// #ifndef SPEARDEMO
// 	int dems[4]={T_DEMO0,T_DEMO1,T_DEMO2,T_DEMO3};
// #else
// 	int dems[1]={T_DEMO0};
// #endif
// 
// 	CA_CacheGrChunk(dems[demonumber]);
// 	demoptr = grsegs[dems[demonumber]];
// 	MM_SetLock (&grsegs[dems[demonumber]],true);
// #else
// 	demoname[4] = '0'+demonumber;
// 	CA_LoadFile (demoname,&demobuffer);
// 	MM_SetLock (&demobuffer,true);
// 	demoptr = (char far *)demobuffer;
// #endif
// 
// 	NewGame (1,0);
// 	gamestate.mapon = *demoptr++;
// 	gamestate.difficulty = gd_hard;
// 	length = *((unsigned far *)demoptr)++;
// 	demoptr++;
// 	lastdemoptr = demoptr-4+length;
// 
// 	VW_FadeOut ();
// 
// 	SETFONTCOLOR(0,15);
// 	DrawPlayScreen ();
// 	VW_FadeIn ();
// 
// 	startgame = false;
// 	demoplayback = true;
// 
// 	SetupGameLevel ();
// 	StartMusic ();
// 	PM_CheckMainMem ();
// 	fizzlein = true;
// 
// 	PlayLoop ();
// 
// #ifdef DEMOSEXTERN
// 	UNCACHEGRCHUNK(dems[demonumber]);
// #else
// 	MM_FreePtr (&demobuffer);
// #endif
// 
// 	demoplayback = false;
// 
// 	StopMusic ();
// 	VW_FadeOut ();
// 	ClearMemory ();
// }
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = Died
// =
// ==================
// */
// 
// #define DEATHROTATE 2
// 
// void Died (void)
// {
// 	float	fangle;
// 	long	dx,dy;
// 	int		iangle,curangle,clockwise,counter,change;
// 
// 	gamestate.weapon = -1;			// take away weapon
// 	SD_PlaySound (PLAYERDEATHSND);
// //
// // swing around to face attacker
// //
// 	dx = killerobj->x - player->x;
// 	dy = player->y - killerobj->y;
// 
// 	fangle = atan2(dy,dx);			// returns -pi to pi
// 	if (fangle<0)
// 		fangle = M_PI*2+fangle;
// 
// 	iangle = fangle/(M_PI*2)*ANGLES;
// 
// 	if (player->angle > iangle)
// 	{
// 		counter = player->angle - iangle;
// 		clockwise = ANGLES-player->angle + iangle;
// 	}
// 	else
// 	{
// 		clockwise = iangle - player->angle;
// 		counter = player->angle + ANGLES-iangle;
// 	}
// 
// 	curangle = player->angle;
// 
// 	if (clockwise<counter)
// 	{
// 	//
// 	// rotate clockwise
// 	//
// 		if (curangle>iangle)
// 			curangle -= ANGLES;
// 		do
// 		{
// 			change = tics*DEATHROTATE;
// 			if (curangle + change > iangle)
// 				change = iangle-curangle;
// 
// 			curangle += change;
// 			player->angle += change;
// 			if (player->angle >= ANGLES)
// 				player->angle -= ANGLES;
// 
// 			ThreeDRefresh ();
// 			CalcTics ();
// 		} while (curangle != iangle);
// 	}
// 	else
// 	{
// 	//
// 	// rotate counterclockwise
// 	//
// 		if (curangle<iangle)
// 			curangle += ANGLES;
// 		do
// 		{
// 			change = -tics*DEATHROTATE;
// 			if (curangle + change < iangle)
// 				change = iangle-curangle;
// 
// 			curangle += change;
// 			player->angle += change;
// 			if (player->angle < 0)
// 				player->angle += ANGLES;
// 
// 			ThreeDRefresh ();
// 			CalcTics ();
// 		} while (curangle != iangle);
// 	}
// 
// //
// // fade to red
// //
// 	FinishPaletteShifts ();
// 
// 	bufferofs += screenofs;
// 	VW_Bar (0,0,viewwidth,viewheight,4);
// 	IN_ClearKeysDown ();
// 	FizzleFade(bufferofs,displayofs+screenofs,viewwidth,viewheight,70,false);
// 	bufferofs -= screenofs;
// 	IN_UserInput(100);
// 	SD_WaitSoundDone ();
// 
// 	if (tedlevel == false)	// SO'S YA DON'T GET KILLED WHILE LAUNCHING!
// 	  gamestate.lives--;
// 
// 	if (gamestate.lives > -1)
// 	{
// 		gamestate.health = 100;
// 		gamestate.weapon = gamestate.bestweapon
// 			= gamestate.chosenweapon = wp_pistol;
// 		gamestate.ammo = STARTAMMO;
// 		gamestate.keys = 0;
// 		gamestate.attackframe = gamestate.attackcount =
// 		gamestate.weaponframe = 0;
// 
// 		DrawKeys ();
// 		DrawWeapon ();
// 		DrawAmmo ();
// 		DrawHealth ();
// 		DrawFace ();
// 		DrawLives ();
// 	}
// 
// }
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = GameLoop
// =
// ===================
// */
// 
// void GameLoop (void)
// {
// 	int i,xl,yl,xh,yh;
// 	char num[20];
// 	boolean	died;
// #ifdef MYPROFILE
// 	clock_t start,end;
// #endif
// 
// restartgame:
// 	ClearMemory ();
// 	SETFONTCOLOR(0,15);
// 	DrawPlayScreen ();
// 	died = false;
// restart:
// 	do
// 	{
// 		if (!loadedgame)
// 		  gamestate.score = gamestate.oldscore;
// 		DrawScore();
// 
// 		startgame = false;
// 		if (loadedgame)
// 			loadedgame = false;
// 		else
// 			SetupGameLevel ();
// 
// #ifdef SPEAR
// 		if (gamestate.mapon == 20)	// give them the key allways
// 		{
// 			gamestate.keys |= 1;
// 			DrawKeys ();
// 		}
// #endif
// 
// 		ingame = true;
// 		StartMusic ();
// 		PM_CheckMainMem ();
// 		if (!died)
// 			PreloadGraphics ();
// 		else
// 			died = false;
// 
// 		fizzlein = true;
// 		DrawLevel ();
// 
// startplayloop:
// 		PlayLoop ();
// 
// #ifdef SPEAR
// 		if (spearflag)
// 		{
// 			SD_StopSound();
// 			SD_PlaySound(GETSPEARSND);
// 			if (DigiMode != sds_Off)
// 			{
// 				long lasttimecount = TimeCount;
// 
// 				while(TimeCount < lasttimecount+150)
// 				//while(DigiPlaying!=false)
// 					SD_Poll();
// 			}
// 			else
// 				SD_WaitSoundDone();
// 
// 			ClearMemory ();
// 			gamestate.oldscore = gamestate.score;
// 			gamestate.mapon = 20;
// 			SetupGameLevel ();
// 			StartMusic ();
// 			PM_CheckMainMem ();
// 			player->x = spearx;
// 			player->y = speary;
// 			player->angle = spearangle;
// 			spearflag = false;
// 			Thrust (0,0);
// 			goto startplayloop;
// 		}
// #endif
// 
// 		StopMusic ();
// 		ingame = false;
// 
// 		if (demorecord && playstate != ex_warped)
// 			FinishDemoRecord ();
// 
// 		if (startgame || loadedgame)
// 			goto restartgame;
// 
// 		switch (playstate)
// 		{
// 		case ex_completed:
// 		case ex_secretlevel:
// 			gamestate.keys = 0;
// 			DrawKeys ();
// 			VW_FadeOut ();
// 
// 			ClearMemory ();
// 
// 			LevelCompleted ();		// do the intermission
// #ifdef SPEARDEMO
// 			if (gamestate.mapon == 1)
// 			{
// 				died = true;			// don't "get psyched!"
// 
// 				VW_FadeOut ();
// 
// 				ClearMemory ();
// 
// 				CheckHighScore (gamestate.score,gamestate.mapon+1);
// 
// 				#pragma warn -sus
// 				#ifndef JAPAN
// 				_fstrcpy(MainMenu[viewscores].string,STR_VS);
// 				#endif
// 				MainMenu[viewscores].routine = CP_ViewScores;
// 				#pragma warn +sus
// 
// 				return;
// 			}
// #endif
// 
// #ifdef JAPDEMO
// 			if (gamestate.mapon == 3)
// 			{
// 				died = true;			// don't "get psyched!"
// 
// 				VW_FadeOut ();
// 
// 				ClearMemory ();
// 
// 				CheckHighScore (gamestate.score,gamestate.mapon+1);
// 
// 				#pragma warn -sus
// 				#ifndef JAPAN
// 				_fstrcpy(MainMenu[viewscores].string,STR_VS);
// 				#endif
// 				MainMenu[viewscores].routine = CP_ViewScores;
// 				#pragma warn +sus
// 
// 				return;
// 			}
// #endif
// 
// 			gamestate.oldscore = gamestate.score;
// 
// #ifndef SPEAR
// 			//
// 			// COMING BACK FROM SECRET LEVEL
// 			//
// 			if (gamestate.mapon == 9)
// 				gamestate.mapon = ElevatorBackTo[gamestate.episode];	// back from secret
// 			else
// 			//
// 			// GOING TO SECRET LEVEL
// 			//
// 			if (playstate == ex_secretlevel)
// 				gamestate.mapon = 9;
// #else
// 
// #define FROMSECRET1		3
// #define FROMSECRET2		11
// 
// 			//
// 			// GOING TO SECRET LEVEL
// 			//
// 			if (playstate == ex_secretlevel)
// 				switch(gamestate.mapon)
// 				{
// 				 case FROMSECRET1: gamestate.mapon = 18; break;
// 				 case FROMSECRET2: gamestate.mapon = 19; break;
// 				}
// 			else
// 			//
// 			// COMING BACK FROM SECRET LEVEL
// 			//
// 			if (gamestate.mapon == 18 || gamestate.mapon == 19)
// 				switch(gamestate.mapon)
// 				{
// 				 case 18: gamestate.mapon = FROMSECRET1+1; break;
// 				 case 19: gamestate.mapon = FROMSECRET2+1; break;
// 				}
// #endif
// 			else
// 			//
// 			// GOING TO NEXT LEVEL
// 			//
// 				gamestate.mapon++;
// 
// 
// 			break;
// 
// 		case ex_died:
// 			Died ();
// 			died = true;			// don't "get psyched!"
// 
// 			if (gamestate.lives > -1)
// 				break;				// more lives left
// 
// 			VW_FadeOut ();
// 
// 			ClearMemory ();
// 
// 			CheckHighScore (gamestate.score,gamestate.mapon+1);
// 
// 			#pragma warn -sus
// 			#ifndef JAPAN
// 			_fstrcpy(MainMenu[viewscores].string,STR_VS);
// 			#endif
// 			MainMenu[viewscores].routine = CP_ViewScores;
// 			#pragma warn +sus
// 
// 			return;
// 
// 		case ex_victorious:
// 
// #ifndef SPEAR
// 			VW_FadeOut ();
// #else
// 			VL_FadeOut (0,255,0,17,17,300);
// #endif
// 			ClearMemory ();
// 
// 			Victory ();
// 
// 			ClearMemory ();
// 
// 			CheckHighScore (gamestate.score,gamestate.mapon+1);
// 
// 			#pragma warn -sus
// 			#ifndef JAPAN
// 			_fstrcpy(MainMenu[viewscores].string,STR_VS);
// 			#endif
// 			MainMenu[viewscores].routine = CP_ViewScores;
// 			#pragma warn +sus
// 
// 			return;
// 
// 		default:
// 			ClearMemory ();
// 			break;
// 		}
// 
// 	} while (1);
// 
// }
// 
// 
