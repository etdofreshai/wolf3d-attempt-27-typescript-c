import { DOSMemory } from "./TS_DOS_MEMORY";
import { NewGameMemory, type NewGameSummary } from "./TS_GAME_STATE";
import {
  DoChecksum as port_DoChecksum,
  loadSaveGameImage,
  serializeSaveGame,
  type LoadedSaveGameImage,
  type LoadSaveGameOptions,
  type SaveGameMemory,
  type SerializeSaveGameOptions,
  type SerializedSaveGame,
} from "./TS_SAVE_LAYOUT";
import { CA_Shutdown, CA_Startup, grsegs, type CacheFiles } from "./ID_CA.C";
import { IN_Ack, IN_Shutdown, IN_Startup, JoysPresent, MousePresent } from "./ID_IN.C";
import { MM_Shutdown, MM_Startup, MML_UseSpace } from "./ID_MM.C";
import { PM_Shutdown, PM_Startup, PM_UnlockMainMem } from "./ID_PM.C";
import {
  AdLibPresent,
  DigiMap,
  DigiMode,
  LASTSOUND,
  MusicMode,
  SD_SetDigiDevice,
  SD_SetMusicMode,
  SD_SetSoundMode,
  SD_Startup,
  SD_Shutdown,
  SoundBlasterPresent,
  SoundMode,
  SoundSourcePresent,
} from "./ID_SD.C";
import { TickBase, sdm_AdLib, sdm_Off, sdm_PC, sds_Off, sds_SoundBlaster, sds_SoundSource, smm_AdLib, smm_Off, type SDSMode, type SDMode, type SMMode } from "./ID_SD.H";
import {
  MaxHighName,
  MaxScores,
  NoWait,
  Scores,
  tedlevel,
  tedlevelnum,
  US_CheckParm,
  US_CPrint,
  US_RestoreWindow,
  US_SaveWindow,
  US_Shutdown,
  US_Startup,
  type HighScore,
} from "./ID_US_1.C";
import {
  LoadLatchMem,
  VL_MungePic,
  VWB_DrawPic,
  VW_SetFontState,
  VW_UpdateScreen,
  type BufferedPicDrawSummary,
  type DrawPicOptions,
  type UpdateScreenSummary,
} from "./ID_VH.C";
import {
  VL_Bar,
  VL_MemToScreen,
  VL_SetPalette,
  VL_SetBufferOffset,
  VL_SetScreen,
  VL_SetVGAPlaneMode,
  VL_Startup,
  VL_Shutdown,
  VL_TestPaletteSet,
  videoPlanes,
} from "./ID_VL.C";
import {
  finetangent,
  horizwall,
  pixelangle,
  SetViewSizeForRefresh,
  sintable,
  vertwall,
} from "./WL_DRAW.C";
import { CheckIs386, jabhack2 } from "./WL_ASM.ASM";
import { C_DISKLOADING1PIC, C_MOUSELBACKPIC, CONTROLS_LUMP_END, CONTROLS_LUMP_START, STARTFONT } from "./TS_WL6_ASSETS";
import { CheckForEpisodes, IntroScreen, MainItems, MainMenu, SetControlPanelState, joystickport, joystickprogressive, joypadenabled, joystickenabled, mouseenabled } from "./WL_MENU.C";
import { buttonjoy, buttonmouse, buttonscan, dirscan } from "./WL_PLAY.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_MAIN.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_MAIN.C";
export const WOLFSRC_FUNCTIONS = [
  "BuildTables",
  "CalcProjection",
  "DemoLoop",
  "DiskFlopAnim",
  "DoChecksum",
  "DoJukebox",
  "FinishSignon",
  "InitDigiMap",
  "InitGame",
  "LoadTheGame",
  "main",
  "MS_CheckParm",
  "NewGame",
  "NewViewSize",
  "Patch386",
  "Quit",
  "ReadConfig",
  "SaveTheGame",
  "SetupWalls",
  "SetViewSize",
  "ShowViewSize",
  "ShutdownId",
  "SignonScreen",
  "WriteConfig"
] as const;

const FOCALLENGTH = 0x5700;
const VIEWGLOBAL = 0x10000;
const TILEGLOBAL = 1 << 16;
const GLOBAL1 = 1 << 16;
const MINDIST = 0x5800;
const HEIGHTRATIO = 0.5;
const STATUSLINES = 40;
const SCREENWIDTH = 80;
const MAXWALLTILES = 64;
const ORDERSCREEN = 136;
const ERRORSCREEN = 137;
const ANGLES = 360;
const ANGLEQUAD = ANGLES / 4;
const FINEANGLES = 3600;
const RADTOINT = Math.fround(FINEANGLES / 2 / Math.PI);
const INTROSONG = 7;
const EX_ABORT = 7;
const PARM_STRINGS = ["baby", "easy", "normal", "hard", ""] as const;

const HALTSND = 21;
const DOGBARKSND = 41;
const CLOSEDOORSND = 19;
const OPENDOORSND = 18;
const ATKMACHINEGUNSND = 26;
const ATKPISTOLSND = 24;
const ATKGATLINGSND = 11;
const SCHUTZADSND = 51;
const GUTENTAGSND = 55;
const MUTTISND = 50;
const BOSSFIRESND = 59;
const SSFIRESND = 60;
const DEATHSCREAM1SND = 29;
const DEATHSCREAM2SND = 22;
const DEATHSCREAM3SND = 25;
const TAKEDAMAGESND = 16;
const PUSHWALLSND = 46;
const LEBENSND = 56;
const NAZIFIRESND = 58;
const SLURPIESND = 61;
const YEAHSND = 72;
const DOGDEATHSND = 10;
const AHHHGSND = 52;
const DIESND = 53;
const EVASND = 54;
const TOT_HUNDSND = 62;
const MEINGOTTSND = 63;
const SCHABBSHASND = 64;
const HITLERHASND = 65;
const SPIONSND = 66;
const NEINSOVASSND = 67;
const DOGATTACKSND = 68;
const LEVELDONESND = 40;
const MECHSTEPSND = 70;
const SCHEISTSND = 57;
const DEATHSCREAM4SND = 73;
const DEATHSCREAM5SND = 74;
const DONNERSND = 79;
const EINESND = 80;
const ERLAUBENSND = 81;
const DEATHSCREAM6SND = 75;
const DEATHSCREAM7SND = 76;
const DEATHSCREAM8SND = 77;
const DEATHSCREAM9SND = 78;
const KEINSND = 82;
const MEINSND = 83;
const ROSESND = 84;

export const wolfdigimap = [
  HALTSND, 0,
  DOGBARKSND, 1,
  CLOSEDOORSND, 2,
  OPENDOORSND, 3,
  ATKMACHINEGUNSND, 4,
  ATKPISTOLSND, 5,
  ATKGATLINGSND, 6,
  SCHUTZADSND, 7,
  GUTENTAGSND, 8,
  MUTTISND, 9,
  BOSSFIRESND, 10,
  SSFIRESND, 11,
  DEATHSCREAM1SND, 12,
  DEATHSCREAM2SND, 13,
  DEATHSCREAM3SND, 13,
  TAKEDAMAGESND, 14,
  PUSHWALLSND, 15,
  LEBENSND, 20,
  NAZIFIRESND, 21,
  SLURPIESND, 22,
  YEAHSND, 32,
  DOGDEATHSND, 16,
  AHHHGSND, 17,
  DIESND, 18,
  EVASND, 19,
  TOT_HUNDSND, 23,
  MEINGOTTSND, 24,
  SCHABBSHASND, 25,
  HITLERHASND, 26,
  SPIONSND, 27,
  NEINSOVASSND, 28,
  DOGATTACKSND, 29,
  LEVELDONESND, 30,
  MECHSTEPSND, 31,
  SCHEISTSND, 33,
  DEATHSCREAM4SND, 34,
  DEATHSCREAM5SND, 35,
  DONNERSND, 36,
  EINESND, 37,
  ERLAUBENSND, 38,
  DEATHSCREAM6SND, 39,
  DEATHSCREAM7SND, 40,
  DEATHSCREAM8SND, 41,
  DEATHSCREAM9SND, 42,
  KEINSND, 43,
  MEINSND, 44,
  ROSESND, 45,
  LASTSOUND,
] as const;

export let focallength = 0;
export let screenofs = 0;
export let viewwidth = 0;
export let viewheight = 0;
export let centerx = 0;
export let shootdelta = 0;
export let scale = 0;
export let maxslope = 0;
export let heightnumerator = 0;
export let minheightdiv = 0;
export let viewsize = 0;
export let mouseadjustment = 5;
export let lastSetupScalingWidth = 0;
export let IsA386 = false;
export let startgame = false;
export let loadedgame = false;
export let virtualreality = false;
export let LastDemo = 0;
export let msArgv: readonly string[] = ["wolf3d.exe"];
let diskFlopWhich = 0;
export const gamepal = new Uint8Array(256 * 3);
export const signon = new Uint8Array(320 * 200);
export const introscn = signon;

for (let i = 0; i < gamepal.length; i++) {
  gamepal[i] = i & 0xff;
}

export function SetMouseAdjustment(value: number): number {
  mouseadjustment = Math.trunc(value);
  return mouseadjustment;
}

export interface MainLoopStateOptions {
  readonly startgame?: boolean;
  readonly loadedgame?: boolean;
  readonly lastDemo?: number;
}

export interface MainLoopStateSummary {
  readonly startgame: boolean;
  readonly loadedgame: boolean;
  readonly LastDemo: number;
}

export function SetMainLoopState(options: MainLoopStateOptions = {}): MainLoopStateSummary {
  if (options.startgame !== undefined) {
    startgame = !!options.startgame;
  }
  if (options.loadedgame !== undefined) {
    loadedgame = !!options.loadedgame;
  }
  if (options.lastDemo !== undefined) {
    LastDemo = Math.trunc(options.lastDemo);
  }
  return { startgame, loadedgame, LastDemo };
}

export interface ProjectionSummary {
  readonly focallength: number;
  readonly facedist: number;
  readonly halfview: number;
  readonly scale: number;
  readonly heightnumerator: number;
  readonly minheightdiv: number;
  readonly maxslope: number;
}

export interface BuildTablesSummary {
  readonly fineTangents: number;
  readonly sinEntries: number;
  readonly tangent0: number;
  readonly tangentLast: number;
  readonly sin0: number;
  readonly sin90: number;
  readonly sin180: number;
  readonly cos0: number;
}

export interface ViewSizeSummary {
  readonly viewwidth: number;
  readonly viewheight: number;
  readonly centerx: number;
  readonly shootdelta: number;
  readonly screenofs: number;
  readonly projection: ProjectionSummary;
  readonly setupScalingWidth: number;
}

export interface ShowViewSizeSummary {
  readonly previewViewwidth: number;
  readonly previewViewheight: number;
  readonly restoredViewwidth: number;
  readonly restoredViewheight: number;
}

export interface WallSetupSummary {
  readonly firstHoriz: number;
  readonly firstVert: number;
  readonly lastHoriz: number;
  readonly lastVert: number;
}

export interface DigiMapSummary {
  readonly entries: number;
  readonly halt: number;
  readonly death3: number;
  readonly yeah: number;
  readonly rose: number;
}

export interface DiskFlopAnimOptions extends DrawPicOptions {
  readonly chunks?: readonly (Uint8Array | null | undefined)[];
}

export interface DiskFlopAnimSummary {
  readonly x: number;
  readonly y: number;
  readonly skipped: boolean;
  readonly which: number;
  readonly picnum: number | null;
  readonly draw: BufferedPicDrawSummary | null;
  readonly update: UpdateScreenSummary | null;
  readonly nextWhich: number;
}

export interface FinishSignonOptions {
  readonly ackPolls?: number;
  readonly pollHook?: (poll: number) => void;
  readonly screenColor?: number;
}

export interface FinishSignonSummary {
  readonly screenColor: number;
  readonly clearPrompt: ReturnType<typeof VL_Bar>;
  readonly promptWindow: ReturnType<typeof US_RestoreWindow>;
  readonly promptColor: ReturnType<typeof VW_SetFontState>;
  readonly prompt: ReturnType<typeof US_CPrint>;
  readonly noWait: boolean;
  readonly ack: boolean | null;
  readonly clearWorking: ReturnType<typeof VL_Bar>;
  readonly workingWindow: ReturnType<typeof US_RestoreWindow>;
  readonly workingColor: ReturnType<typeof VW_SetFontState>;
  readonly working: ReturnType<typeof US_CPrint>;
  readonly finalColor: ReturnType<typeof VW_SetFontState>;
}

export interface MainNewGameSummary extends NewGameSummary {
  readonly startgame: boolean;
}

export interface MainSaveGameResult extends SerializedSaveGame {
  readonly saved: true;
  readonly x: number;
  readonly y: number;
}

export interface MainLoadGameResult extends LoadedSaveGameImage {
  readonly x: number;
  readonly y: number;
}

export interface ShutdownIdSummary {
  readonly us: ReturnType<typeof US_Shutdown>;
  readonly sd: ReturnType<typeof SD_Shutdown>;
  readonly pm: ReturnType<typeof PM_Shutdown>;
  readonly in: ReturnType<typeof IN_Shutdown>;
  readonly vw: ReturnType<typeof VL_Shutdown>;
  readonly ca: ReturnType<typeof CA_Shutdown>;
  readonly mm: ReturnType<typeof MM_Shutdown>;
}

export interface SignonScreenOptions {
  readonly palette?: Uint8Array;
  readonly intro?: Uint8Array;
  readonly introSegment?: number;
  readonly introOffset?: number;
  readonly virtualReality?: boolean;
}

export interface SignonMungeSummary {
  readonly bytes: number;
  readonly first: number;
  readonly last: number;
}

export interface SignonScreenSummary {
  readonly planeMode: ReturnType<typeof VL_SetVGAPlaneMode>;
  readonly paletteTest: boolean;
  readonly palette: ReturnType<typeof VL_SetPalette>;
  readonly virtualreality: boolean;
  readonly hiddenScreen: ReturnType<typeof VL_SetScreen> | null;
  readonly munge: SignonMungeSummary | null;
  readonly blit: ReturnType<typeof VL_MemToScreen> | null;
  readonly visibleScreen: ReturnType<typeof VL_SetScreen> | null;
  readonly reclaimSegment: number;
  readonly reclaimLength: number;
  readonly reclaim: ReturnType<typeof MML_UseSpace>;
}

export interface JukeboxMenuInfo {
  x: number;
  y: number;
  amount: number;
  curpos: number;
  indent: number;
}

export interface JukeboxMenuItem {
  active: number;
  string: string;
}

export interface DoJukeboxDrawState {
  readonly phase: "initial" | "selection";
  readonly start: number;
  readonly which: number;
  readonly song: number | null;
  readonly active: readonly number[];
}

export interface DoJukeboxAction {
  readonly which: number;
  readonly menuIndex: number;
  readonly previous: number;
  readonly previousMenuIndex: number | null;
  readonly song: number;
  readonly music: unknown;
  readonly draw: unknown;
  readonly update: unknown;
  readonly active: readonly number[];
}

export interface DoJukeboxOptions {
  readonly hsecond?: number;
  readonly selections?: readonly number[];
  readonly clearKeysDown?: () => unknown;
  readonly fadeOut?: () => unknown;
  readonly fadeIn?: () => unknown;
  readonly cacheFont?: (chunk: number) => unknown;
  readonly cacheLump?: (start: number, end: number) => unknown;
  readonly loadAllSounds?: () => unknown;
  readonly draw?: (state: DoJukeboxDrawState) => unknown;
  readonly update?: () => unknown;
  readonly printTitle?: (title: string) => unknown;
  readonly handleMenu?: (iteration: number, start: number) => number;
  readonly startMusic?: (song: number) => unknown;
  readonly uncacheLump?: (start: number, end: number) => unknown;
}

export interface DoJukeboxSummary {
  readonly available: boolean;
  readonly start: number | null;
  readonly visibleItems: readonly JukeboxMenuItem[];
  readonly songs: readonly number[];
  readonly selections: readonly number[];
  readonly actions: readonly DoJukeboxAction[];
  readonly lastsong: number;
  readonly active: readonly number[];
  readonly initialClear: unknown;
  readonly setupFadeOut: unknown;
  readonly cacheFont: unknown;
  readonly cacheLump: unknown;
  readonly loadAllSounds: unknown;
  readonly font: ReturnType<typeof VW_SetFontState> | null;
  readonly clearScreen: unknown;
  readonly mouseBackPic: number | null;
  readonly stripes: unknown;
  readonly window: unknown;
  readonly title: unknown;
  readonly initialDraw: unknown;
  readonly initialUpdate: unknown;
  readonly fadeIn: unknown;
  readonly finalFadeOut: unknown;
  readonly finalClear: unknown;
  readonly uncacheLump: unknown;
}

export type DemoLoopStage = "title" | "credits" | "scores";

export interface DemoLoopTedState {
  readonly difficulty: number;
  readonly episode: number;
  readonly mapon: number;
}

export interface DemoLoopAttractStep {
  readonly loop: number;
  readonly stage: DemoLoopStage | "demo" | "intro-music";
  readonly result: unknown;
  readonly input: boolean | null;
  readonly ticks: number | null;
  readonly demo: number | null;
  readonly playstate: number | null;
}

export interface DemoLoopCycleSummary {
  readonly index: number;
  readonly attract: readonly DemoLoopAttractStep[];
  readonly fadeOutBeforeMenu: unknown;
  readonly recordDemo: unknown;
  readonly controlPanel: unknown;
  readonly gameStartedOrLoaded: boolean;
  readonly gameLoop: unknown;
  readonly fadeOutAfterGame: unknown;
  readonly restartMusic: unknown;
}

export interface DemoLoopOptions {
  readonly argv?: readonly string[];
  readonly tedlevel?: boolean;
  readonly tedlevelnum?: number;
  readonly noWait?: boolean;
  readonly maxCycles?: number;
  readonly maxAttractLoops?: number;
  readonly keyboardTab?: boolean;
  readonly loadedgame?: boolean;
  readonly startgame?: boolean;
  readonly nonShareware?: () => unknown;
  readonly startCPMusic?: (song: number) => unknown;
  readonly pg13?: () => unknown;
  readonly sortMem?: () => unknown;
  readonly title?: () => unknown;
  readonly credits?: () => unknown;
  readonly drawHighScores?: () => unknown;
  readonly userInput?: (stage: DemoLoopStage, ticks: number, cycle: number) => boolean;
  readonly playDemo?: (demo: number) => unknown;
  readonly fadeOut?: () => unknown;
  readonly recordDemo?: () => unknown;
  readonly controlPanel?: (scancode: number) => unknown;
  readonly gameLoop?: () => unknown;
  readonly newGame?: (difficulty: number, episode: number) => unknown;
  readonly setTedGameState?: (state: DemoLoopTedState) => unknown;
  readonly quit?: (error: string | null) => unknown;
}

export interface DemoLoopSummary {
  readonly mode: "ted" | "attract";
  readonly argv: readonly string[];
  readonly noWait: boolean;
  readonly tedlevel: boolean;
  readonly tedlevelnum: number;
  readonly tedState: DemoLoopTedState | null;
  readonly newGame: unknown;
  readonly setTedGameState: unknown;
  readonly tedGameLoop: unknown;
  readonly tedQuit: unknown;
  readonly nonShareware: unknown;
  readonly introMusic: unknown;
  readonly pg13: unknown;
  readonly cycles: readonly DemoLoopCycleSummary[];
  readonly lastDemo: number;
  readonly bounded: boolean;
}

export interface MainOptions {
  readonly argv?: readonly string[];
  readonly checkForEpisodes?: () => unknown;
  readonly patch386?: (argv: readonly string[]) => unknown;
  readonly initGame?: (options: InitGameOptions) => unknown;
  readonly initOptions?: InitGameOptions;
  readonly demoLoop?: (options: DemoLoopOptions) => unknown;
  readonly demoOptions?: DemoLoopOptions;
  readonly quit?: (error: string, options: QuitOptions) => unknown;
  readonly quitOptions?: QuitOptions;
}

export interface MainSummary {
  readonly argv: readonly string[];
  readonly checkForEpisodes: unknown;
  readonly patch386: unknown;
  readonly initGame: unknown;
  readonly demoLoop: unknown;
  readonly quit: unknown;
}

export const JUKEBOX_SONGS = [
  3, 11, 9, 12, 2, 0,
  8, 18, 17, 4, 1, 19,
  6, 20, 22, 21, 19, 26,
] as const;

export const MusicItems: JukeboxMenuInfo = { x: 24, y: 70, amount: 6, curpos: 0, indent: 32 };

export const MusicMenu: JukeboxMenuItem[] = [
  { active: 1, string: "Get Them!" },
  { active: 1, string: "Searching" },
  { active: 1, string: "P.O.W." },
  { active: 1, string: "Suspense" },
  { active: 1, string: "War March" },
  { active: 1, string: "Around The Corner!" },
  { active: 1, string: "Nazi Anthem" },
  { active: 1, string: "Lurking..." },
  { active: 1, string: "Going After Hitler" },
  { active: 1, string: "Pounding Headache" },
  { active: 1, string: "Into the Dungeons" },
  { active: 1, string: "Ultimate Conquest" },
  { active: 1, string: "Kill the S.O.B." },
  { active: 1, string: "The Nazi Rap" },
  { active: 1, string: "Twelfth Hour" },
  { active: 1, string: "Zero Hour" },
  { active: 1, string: "Ultimate Conquest" },
  { active: 1, string: "Wolfpack" },
];

const CONFIG_SCORE_BYTES = MaxHighName + 1 + 4 + 2 + 2;
export const CONFIG_SIZE = MaxScores * CONFIG_SCORE_BYTES + 3 * 2 + 5 * 2 + (4 + 8 + 4 + 4) * 2 + 2 * 2;

export interface MainConfigControlState {
  readonly mouseenabled: boolean;
  readonly joystickenabled: boolean;
  readonly joypadenabled: boolean;
  readonly joystickprogressive: boolean;
  readonly joystickport: number;
}

export interface MainConfigSummary {
  readonly present: boolean;
  readonly bytes: number;
  readonly scores: readonly HighScore[];
  readonly sd: SDMode;
  readonly sm: SMMode;
  readonly sds: SDSMode;
  readonly controls: MainConfigControlState;
  readonly dirscan: readonly number[];
  readonly buttonscan: readonly number[];
  readonly buttonmouse: readonly number[];
  readonly buttonjoy: readonly number[];
  readonly viewsize: number;
  readonly mouseadjustment: number;
  readonly soundModeSet: boolean;
  readonly musicModeSet: boolean;
  readonly digiMode: ReturnType<typeof SD_SetDigiDevice>;
  readonly bytesOut?: Uint8Array;
}

export interface ReadConfigOptions {
  readonly data?: Uint8Array | null;
}

export interface WriteConfigOptions {
  readonly scores?: readonly HighScore[];
}

export interface InitGameOptions {
  readonly argv?: readonly string[];
  readonly heapBytes?: number;
  readonly timeLowByte?: number;
  readonly signonOptions?: SignonScreenOptions;
  readonly VSWAP?: Uint8Array;
  readonly cacheFiles?: Partial<CacheFiles>;
  readonly configData?: Uint8Array | null;
  readonly introScreen?: (() => unknown) | false;
  readonly cacheGrChunk?: (chunk: number) => Uint8Array | null | undefined;
  readonly loadLatchMem?: (() => unknown) | false;
}

export interface InitGameSummary {
  readonly virtualreality: boolean;
  readonly memory: ReturnType<typeof MM_Startup>;
  readonly signon: SignonScreenSummary;
  readonly video: ReturnType<typeof VL_Startup>;
  readonly input: ReturnType<typeof IN_Startup>;
  readonly page: ReturnType<typeof PM_Startup> | null;
  readonly pageUnlock: ReturnType<typeof PM_UnlockMainMem> | null;
  readonly sound: ReturnType<typeof SD_Startup>;
  readonly cache: ReturnType<typeof CA_Startup>;
  readonly user: ReturnType<typeof US_Startup>;
  readonly digi: DigiMapSummary;
  readonly buffer: ReturnType<typeof VL_SetBufferOffset>;
  readonly display: ReturnType<typeof VL_SetScreen>;
  readonly config: MainConfigSummary;
  readonly intro: unknown;
  readonly startFontChunk: number | null;
  readonly startFontBytes: number;
  readonly latch: unknown;
  readonly tables: BuildTablesSummary;
  readonly walls: WallSetupSummary;
}

export interface QuitTextCopySummary {
  readonly sourceOffset: number;
  readonly destSegment: number;
  readonly destOffset: number;
  readonly bytes: number;
}

export interface QuitOptions {
  readonly virtualReality?: boolean;
  readonly clearMemory?: () => unknown;
  readonly cacheGraphic?: (chunk: number) => Uint8Array | null | undefined;
  readonly shutdown?: () => ShutdownIdSummary;
  readonly writeConfig?: () => MainConfigSummary;
}

export interface QuitSummary {
  readonly error: string | null;
  readonly virtualInterrupt: number | null;
  readonly clearMemory: unknown;
  readonly screenChunk: number;
  readonly screenBytes: number;
  readonly writeConfig: MainConfigSummary | null;
  readonly shutdown: ShutdownIdSummary;
  readonly textCopy: QuitTextCopySummary;
  readonly cursor: readonly [number, number];
  readonly printedError: string | null;
  readonly exitCode: number;
}

export function MS_SetArgv(argv: readonly string[]): readonly string[] {
  msArgv = [...argv];
  return msArgv;
}

function readConfigOptions(options: ReadConfigOptions | Uint8Array | null): Uint8Array | null {
  if (options instanceof Uint8Array || options === null) {
    return options;
  }
  return options.data ?? null;
}

function readFixedString(data: Uint8Array, offset: number, length: number): string {
  let end = offset;
  while (end < offset + length && data[end]) {
    end++;
  }
  return String.fromCharCode(...data.subarray(offset, end));
}

function writeFixedString(data: Uint8Array, offset: number, length: number, value: string): void {
  data.fill(0, offset, offset + length);
  const capped = value.slice(0, length - 1);
  for (let i = 0; i < capped.length; i++) {
    data[offset + i] = capped.charCodeAt(i) & 0xff;
  }
}

function readScores(data: Uint8Array, view: DataView): { readonly scores: HighScore[]; readonly offset: number } {
  const scores: HighScore[] = [];
  let offset = 0;
  for (let i = 0; i < MaxScores; i++) {
    const name = readFixedString(data, offset, MaxHighName + 1);
    offset += MaxHighName + 1;
    const score = view.getInt32(offset, true);
    offset += 4;
    const completed = view.getUint16(offset, true);
    offset += 2;
    const episode = view.getUint16(offset, true);
    offset += 2;
    scores.push({ name, score, completed, episode });
  }
  return { scores, offset };
}

function writeScores(data: Uint8Array, view: DataView, scores: readonly HighScore[]): number {
  let offset = 0;
  for (let i = 0; i < MaxScores; i++) {
    const score = scores[i] ?? Scores[i];
    writeFixedString(data, offset, MaxHighName + 1, score.name);
    offset += MaxHighName + 1;
    view.setInt32(offset, Math.trunc(score.score), true);
    offset += 4;
    view.setUint16(offset, Math.trunc(score.completed) & 0xffff, true);
    offset += 2;
    view.setUint16(offset, Math.trunc(score.episode) & 0xffff, true);
    offset += 2;
  }
  return offset;
}

function readI16Array(view: DataView, offset: number, count: number): { readonly values: number[]; readonly offset: number } {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(view.getInt16(offset, true));
    offset += 2;
  }
  return { values, offset };
}

function writeI16Array(view: DataView, offset: number, values: readonly number[], count: number): number {
  for (let i = 0; i < count; i++) {
    view.setInt16(offset, Math.trunc(values[i] ?? 0), true);
    offset += 2;
  }
  return offset;
}

function copyArray(target: number[], values: readonly number[]): void {
  for (let i = 0; i < target.length; i++) {
    target[i] = Math.trunc(values[i] ?? target[i]);
  }
}

function coerceSDMode(value: number): SDMode {
  return value === sdm_PC || value === sdm_AdLib ? value : sdm_Off;
}

function coerceSMMode(value: number): SMMode {
  return value === smm_AdLib ? smm_AdLib : smm_Off;
}

function coerceSDSMode(value: number): SDSMode {
  return value === 1 || value === sds_SoundSource || value === sds_SoundBlaster ? value : sds_Off;
}

function applyConfigSound(sd: SDMode, sm: SMMode, sds: SDSMode): Pick<MainConfigSummary, "soundModeSet" | "musicModeSet" | "digiMode"> {
  const musicModeSet = SD_SetMusicMode(sm);
  const soundModeSet = SD_SetSoundMode(sd);
  const digiMode = SD_SetDigiDevice(sds);
  return { soundModeSet, musicModeSet, digiMode };
}

function isAsciiAlpha(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

export function BuildTables(): BuildTablesSummary {
  for (let i = 0; i < FINEANGLES / 8; i++) {
    const tang = Math.tan((i + 0.5) / RADTOINT);
    finetangent[i] = Math.trunc(tang * TILEGLOBAL);
    finetangent[FINEANGLES / 4 - 1 - i] = Math.trunc((1 / tang) * TILEGLOBAL);
  }

  let angle = 0;
  const anglestep = Math.fround(Math.PI / 2 / ANGLEQUAD);
  for (let i = 0; i <= ANGLEQUAD; i++) {
    const value = Math.trunc(GLOBAL1 * Math.sin(angle));
    sintable[i] = value;
    sintable[i + ANGLES] = value;
    sintable[ANGLES / 2 - i] = value;
    sintable[ANGLES - i] = value | 0x80000000;
    sintable[ANGLES / 2 + i] = value | 0x80000000;
    angle = Math.fround(angle + anglestep);
  }

  return {
    fineTangents: finetangent.length,
    sinEntries: sintable.length,
    tangent0: finetangent[0],
    tangentLast: finetangent[finetangent.length - 1],
    sin0: sintable[0],
    sin90: sintable[90],
    sin180: sintable[180],
    cos0: sintable[90],
  };
}

export function CalcProjection(focal: number): ProjectionSummary {
  focallength = focal;
  const facedist = focal + MINDIST;
  const halfview = Math.trunc(viewwidth / 2);
  scale = Math.trunc((halfview * facedist) / (VIEWGLOBAL / 2));
  heightnumerator = (TILEGLOBAL * scale) >> 6;
  minheightdiv = Math.trunc(heightnumerator / 0x7fff) + 1;

  for (let i = 0; i < halfview; i++) {
    const tang = Math.trunc((i * VIEWGLOBAL) / viewwidth) / facedist;
    const angle = Math.fround(Math.atan(tang)); // C: `float angle` — 32-bit precision (WL_MAIN.C:648)
    const intang = Math.trunc(angle * RADTOINT);
    pixelangle[halfview - 1 - i] = intang;
    pixelangle[halfview + i] = -intang;
  }

  maxslope = finetangent[pixelangle[0]] >> 8;
  return { focallength, facedist, halfview, scale, heightnumerator, minheightdiv, maxslope };
}

function playstateFrom(result: unknown): number {
  if (typeof result === "number") {
    return Math.trunc(result);
  }
  if (result && typeof result === "object" && "playstate" in result) {
    const value = Number((result as { readonly playstate?: unknown }).playstate);
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  return 0;
}

function controlPanelStarted(result: unknown): boolean {
  if (!result || typeof result !== "object") {
    return false;
  }
  const summary = result as {
    readonly startGame?: unknown;
    readonly gameStartedOrLoaded?: unknown;
  };
  return !!summary.startGame || !!summary.gameStartedOrLoaded;
}

function runDemoLoopScreen(
  stage: DemoLoopStage,
  loop: number,
  cycle: number,
  ticks: number,
  draw: (() => unknown) | undefined,
  options: DemoLoopOptions,
): { readonly step: DemoLoopAttractStep; readonly interrupted: boolean } {
  const drawResult = draw?.() ?? null;
  const input = !!options.userInput?.(stage, ticks, cycle);
  const fadeOut = input ? null : (stage === "scores" ? null : (options.fadeOut?.() ?? null));
  return {
    step: {
      loop,
      stage,
      result: { draw: drawResult, fadeOut },
      input,
      ticks,
      demo: null,
      playstate: null,
    },
    interrupted: input,
  };
}

export function DemoLoop(options: DemoLoopOptions = {}): DemoLoopSummary {
  const argv = options.argv ?? msArgv;
  const useTedLevel = options.tedlevel ?? tedlevel;
  const useTedLevelNum = Math.trunc(options.tedlevelnum ?? tedlevelnum);
  const useNoWait = options.noWait ?? NoWait;

  if (useTedLevel) {
    let difficulty = 1;
    for (let i = 1; i < argv.length; i++) {
      const level = US_CheckParm(argv[i] ?? "", PARM_STRINGS);
      if (level !== -1) {
        difficulty = level;
        break;
      }
    }

    const tedState: DemoLoopTedState = {
      difficulty,
      episode: Math.trunc(useTedLevelNum / 10),
      mapon: useTedLevelNum % 10,
    };
    const newGame = options.newGame?.(1, 0) ?? null;
    const setTedGameState = options.setTedGameState?.(tedState) ?? null;
    const tedGameLoop = options.gameLoop?.() ?? null;
    const tedQuit = options.quit?.(null) ?? null;
    return {
      mode: "ted",
      argv,
      noWait: true,
      tedlevel: true,
      tedlevelnum: useTedLevelNum,
      tedState,
      newGame,
      setTedGameState,
      tedGameLoop,
      tedQuit,
      nonShareware: null,
      introMusic: null,
      pg13: null,
      cycles: [],
      lastDemo: LastDemo,
      bounded: false,
    };
  }

  const nonShareware = useNoWait ? null : (options.nonShareware?.() ?? null);
  const introMusic = options.startCPMusic?.(INTROSONG) ?? null;
  const pg13 = useNoWait ? null : (options.pg13?.() ?? null);
  const cycles: DemoLoopCycleSummary[] = [];
  const maxCycles = Math.max(0, Math.trunc(options.maxCycles ?? 1));
  const maxAttractLoops = Math.max(0, Math.trunc(options.maxAttractLoops ?? 1));

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const attract: DemoLoopAttractStep[] = [];
    let leaveAttract = useNoWait;

    for (let loop = 0; loop < maxAttractLoops && !leaveAttract; loop++) {
      const sortMem = options.sortMem?.() ?? null;
      const title = runDemoLoopScreen("title", loop, cycle, TickBase * 15, () => ({ sortMem, title: options.title?.() ?? null }), options);
      attract.push(title.step);
      if (title.interrupted) {
        leaveAttract = true;
        break;
      }

      const credits = runDemoLoopScreen("credits", loop, cycle, TickBase * 10, options.credits, options);
      attract.push(credits.step);
      if (credits.interrupted) {
        leaveAttract = true;
        break;
      }

      const scores = runDemoLoopScreen("scores", loop, cycle, TickBase * 10, options.drawHighScores, options);
      attract.push(scores.step);
      if (scores.interrupted) {
        leaveAttract = true;
        break;
      }

      const demo = LastDemo++ % 4;
      const result = options.playDemo?.(demo) ?? null;
      const playstate = playstateFrom(result);
      attract.push({ loop, stage: "demo", result, input: null, ticks: null, demo, playstate });
      if (playstate === EX_ABORT) {
        leaveAttract = true;
        break;
      }

      const restart = options.startCPMusic?.(INTROSONG) ?? null;
      attract.push({ loop, stage: "intro-music", result: restart, input: null, ticks: null, demo: null, playstate: null });
    }

    const fadeOutBeforeMenu = options.fadeOut?.() ?? null;
    const shouldRecordDemo = !!options.keyboardTab && MS_CheckParm("goobers", argv);
    const recordDemo = shouldRecordDemo ? (options.recordDemo?.() ?? null) : null;
    const controlPanel = shouldRecordDemo ? null : (options.controlPanel?.(0) ?? null);
    const gameStartedOrLoaded = (options.startgame ?? startgame) || (options.loadedgame ?? loadedgame) || controlPanelStarted(controlPanel);
    const gameLoop = gameStartedOrLoaded ? (options.gameLoop?.() ?? null) : null;
    const fadeOutAfterGame = gameStartedOrLoaded ? (options.fadeOut?.() ?? null) : null;
    const restartMusic = gameStartedOrLoaded ? (options.startCPMusic?.(INTROSONG) ?? null) : null;

    cycles.push({
      index: cycle,
      attract,
      fadeOutBeforeMenu,
      recordDemo,
      controlPanel,
      gameStartedOrLoaded,
      gameLoop,
      fadeOutAfterGame,
      restartMusic,
    });
  }

  return {
    mode: "attract",
    argv,
    noWait: useNoWait,
    tedlevel: false,
    tedlevelnum: useTedLevelNum,
    tedState: null,
    newGame: null,
    setTedGameState: null,
    tedGameLoop: null,
    tedQuit: null,
    nonShareware,
    introMusic,
    pg13,
    cycles,
    lastDemo: LastDemo,
    bounded: true,
  };
}

export function DiskFlopAnim(x: number, y: number, options: DiskFlopAnimOptions = {}): DiskFlopAnimSummary {
  const drawX = Math.trunc(x);
  const drawY = Math.trunc(y);
  const which = diskFlopWhich;
  if (!drawX && !drawY) {
    return { x: drawX, y: drawY, skipped: true, which, picnum: null, draw: null, update: null, nextWhich: diskFlopWhich };
  }

  const picnum = C_DISKLOADING1PIC + which;
  const draw = VWB_DrawPic(drawX, drawY, picnum, {
    ...options,
    source: options.source ?? options.chunks?.[picnum] ?? undefined,
  });
  const update = VW_UpdateScreen();
  diskFlopWhich ^= 1;
  return { x: drawX, y: drawY, skipped: false, which, picnum, draw, update, nextWhich: diskFlopWhich };
}

export function DoChecksum(source: Uint8Array, size = source.length, checksum = 0): number {
  return port_DoChecksum(source, size, checksum);
}

function jukeboxActiveStates(): number[] {
  return MusicMenu.map((item) => Math.trunc(item.active));
}

export function DoJukebox(options: DoJukeboxOptions = {}): DoJukeboxSummary {
  const initialClear = options.clearKeysDown?.() ?? null;
  if (!AdLibPresent && !SoundBlasterPresent) {
    return {
      available: false,
      start: null,
      visibleItems: [],
      songs: JUKEBOX_SONGS,
      selections: [],
      actions: [],
      lastsong: -1,
      active: jukeboxActiveStates(),
      initialClear,
      setupFadeOut: null,
      cacheFont: null,
      cacheLump: null,
      loadAllSounds: null,
      font: null,
      clearScreen: null,
      mouseBackPic: null,
      stripes: null,
      window: null,
      title: null,
      initialDraw: null,
      initialUpdate: null,
      fadeIn: null,
      finalFadeOut: null,
      finalClear: null,
      uncacheLump: null,
    };
  }

  const setupFadeOut = options.fadeOut?.() ?? null;
  const hsecond = Math.trunc(options.hsecond ?? 0);
  const start = (((hsecond % 3) + 3) % 3) * MusicItems.amount;
  MusicItems.curpos = 0;

  const cacheFont = options.cacheFont?.(STARTFONT + 1) ?? null;
  const cacheLump = options.cacheLump?.(CONTROLS_LUMP_START, CONTROLS_LUMP_END) ?? null;
  const loadAllSounds = options.loadAllSounds?.() ?? null;
  const font = VW_SetFontState({ fontnumber: 1, fontcolor: 0x17, backcolor: 0x2d });
  const clearScreen = options.draw?.({ phase: "initial", start, which: -1, song: null, active: jukeboxActiveStates() }) ?? null;
  const mouseBackPic = C_MOUSELBACKPIC;
  const stripes = { y: 10 };
  const window = { x: MusicItems.x - 2, y: MusicItems.y - 6, w: 280, h: 13 * 7, color: 0x2d };
  const visibleItems = MusicMenu.slice(start, start + MusicItems.amount).map((item) => ({ ...item }));
  const title = options.printTitle?.("Robert's Jukebox") ?? null;
  const initialDraw = { items: visibleItems, mouseBackPic, stripes, window };
  const initialUpdate = options.update?.() ?? null;
  const fadeIn = options.fadeIn?.() ?? null;

  const selections: number[] = [];
  const actions: DoJukeboxAction[] = [];
  let lastsong = -1;
  let iteration = 0;

  for (;;) {
    const which = options.handleMenu
      ? options.handleMenu(iteration, start)
      : (options.selections?.[iteration] ?? -1);
    iteration++;

    if (which < 0) {
      break;
    }
    if (which >= MusicItems.amount) {
      throw new RangeError(`DoJukebox: selection ${which} is outside the visible WL6 song bank`);
    }

    selections.push(which);
    const menuIndex = start + which;
    const previous = lastsong;
    const previousMenuIndex = previous >= 0 ? start + previous : null;
    if (previousMenuIndex !== null) {
      MusicMenu[previousMenuIndex].active = 1;
    }

    const song = JUKEBOX_SONGS[menuIndex];
    const music = options.startMusic?.(song) ?? null;
    MusicMenu[menuIndex].active = 2;
    const active = jukeboxActiveStates();
    const draw = options.draw?.({ phase: "selection", start, which, song, active }) ?? null;
    const update = options.update?.() ?? null;
    lastsong = which;

    actions.push({
      which,
      menuIndex,
      previous,
      previousMenuIndex,
      song,
      music,
      draw,
      update,
      active,
    });
  }

  const finalFadeOut = options.fadeOut?.() ?? null;
  const finalClear = options.clearKeysDown?.() ?? null;
  const uncacheLump = options.uncacheLump?.(CONTROLS_LUMP_START, CONTROLS_LUMP_END) ?? null;

  return {
    available: true,
    start,
    visibleItems,
    songs: JUKEBOX_SONGS,
    selections,
    actions,
    lastsong,
    active: jukeboxActiveStates(),
    initialClear,
    setupFadeOut,
    cacheFont,
    cacheLump,
    loadAllSounds,
    font,
    clearScreen,
    mouseBackPic,
    stripes,
    window,
    title,
    initialDraw,
    initialUpdate,
    fadeIn,
    finalFadeOut,
    finalClear,
    uncacheLump,
  };
}

export function FinishSignon(options: FinishSignonOptions = {}): FinishSignonSummary {
  const screenColor = (options.screenColor ?? videoPlanes[0] ?? 0) & 0xff;
  const clearPrompt = VL_Bar(0, 189, 300, 11, screenColor);

  const savedWindow = US_SaveWindow();
  const promptWindow = US_RestoreWindow({ ...savedWindow, x: 0, w: 320, py: 190 });
  const promptColor = VW_SetFontState({ fontcolor: 14, backcolor: 4 });
  const prompt = US_CPrint("Press a key");

  const noWait = NoWait;
  const ack = noWait ? null : IN_Ack(options.ackPolls ?? 1, options.pollHook ?? null);

  const clearWorking = VL_Bar(0, 189, 300, 11, screenColor);
  const workingWindow = US_RestoreWindow({ ...US_SaveWindow(), py: 190 });
  const workingColor = VW_SetFontState({ fontcolor: 10, backcolor: 4 });
  const working = US_CPrint("Working...");
  const finalColor = VW_SetFontState({ fontcolor: 0, backcolor: 15 });

  return {
    screenColor,
    clearPrompt,
    promptWindow,
    promptColor,
    prompt,
    noWait,
    ack,
    clearWorking,
    workingWindow,
    workingColor,
    working,
    finalColor,
  };
}

export function InitDigiMap(): DigiMapSummary {
  let entries = 0;
  for (let i = 0; wolfdigimap[i] !== LASTSOUND; i += 2) {
    DigiMap[wolfdigimap[i]] = wolfdigimap[i + 1];
    entries++;
  }

  return {
    entries,
    halt: DigiMap[HALTSND],
    death3: DigiMap[DEATHSCREAM3SND],
    yeah: DigiMap[YEAHSND],
    rose: DigiMap[ROSESND],
  };
}

export function InitGame(options: InitGameOptions = {}): InitGameSummary {
  const argv = options.argv ?? msArgv;
  MS_SetArgv(argv);
  virtualreality = MS_CheckParm("virtual", argv);

  const memory = MM_Startup(options.heapBytes);
  const signon = SignonScreen({ ...options.signonOptions, virtualReality: virtualreality });
  const video = VL_Startup();
  const input = IN_Startup(argv);
  const page = options.VSWAP ? PM_Startup(options.VSWAP, argv) : null;
  const pageUnlock = page ? PM_UnlockMainMem() : null;
  const sound = SD_Startup();
  const cache = CA_Startup(options.cacheFiles);
  const user = US_Startup(argv, options.timeLowByte ?? 0);
  const digi = InitDigiMap();
  const buffer = VL_SetBufferOffset(0);
  const display = VL_SetScreen(0, 0);
  const config = ReadConfig(options.configData ?? null);

  let intro: unknown = null;
  if (!virtualreality && options.introScreen !== false) {
    intro = (options.introScreen ?? IntroScreen)();
  }

  const startFont = options.cacheGrChunk?.(STARTFONT) ?? grsegs[STARTFONT] ?? null;
  const latch = options.loadLatchMem === false ? null : ((options.loadLatchMem ?? LoadLatchMem)());
  const tables = BuildTables();
  const walls = SetupWalls();

  return {
    virtualreality,
    memory,
    signon,
    video,
    input,
    page,
    pageUnlock,
    sound,
    cache,
    user,
    digi,
    buffer,
    display,
    config,
    intro,
    startFontChunk: startFont ? STARTFONT : null,
    startFontBytes: startFont?.length ?? 0,
    latch,
    tables,
    walls,
  };
}

export function LoadTheGame(
  bytes: Uint8Array,
  memory: SaveGameMemory,
  x = 0,
  y = 0,
  options: LoadSaveGameOptions = {},
): MainLoadGameResult {
  return {
    ...loadSaveGameImage(bytes, memory, options),
    x,
    y,
  };
}

export function main(options: MainOptions = {}): MainSummary {
  const argv = options.argv ?? msArgv;
  MS_SetArgv(argv);
  const checkForEpisodes = options.checkForEpisodes?.() ?? CheckForEpisodes();
  const patch386 = options.patch386?.(argv) ?? Patch386(argv);
  const initOptions = { ...(options.initOptions ?? {}), argv };
  const initGame = options.initGame?.(initOptions) ?? InitGame(initOptions);
  const demoOptions = { ...(options.demoOptions ?? {}), argv };
  const demoLoop = options.demoLoop?.(demoOptions) ?? DemoLoop(demoOptions);
  const quit = options.quit?.("Demo loop exited???", options.quitOptions ?? {}) ?? Quit("Demo loop exited???", options.quitOptions ?? {});
  return {
    argv,
    checkForEpisodes,
    patch386,
    initGame,
    demoLoop,
    quit,
  };
}

export function MS_CheckParm(check: string, argv: readonly string[] = msArgv): boolean {
  const target = check.toLowerCase();
  for (let i = 1; i < argv.length; i++) {
    const parm = argv[i] ?? "";
    let offset = 0;

    while (!isAsciiAlpha(parm.charCodeAt(offset))) {
      if (!parm[offset++]) {
        break;
      }
    }

    if (parm.slice(offset).toLowerCase() === target) {
      return true;
    }
  }

  return false;
}

export function NewGame(
  dgroup: DOSMemory,
  difficulty: number,
  episode: number,
): MainNewGameSummary {
  const summary = NewGameMemory(dgroup, difficulty, episode);
  startgame = true;
  return { ...summary, startgame };
}

export function NewViewSize(width: number): ViewSizeSummary {
  viewsize = width;
  return SetViewSize(width * 16, Math.trunc(width * 16 * HEIGHTRATIO));
}

export function Patch386(argv: readonly string[] = msArgv): boolean {
  for (let i = 1; i < argv.length; i++) {
    if (US_CheckParm(argv[i], ["no386", ""]) === 0) {
      IsA386 = false;
      return IsA386;
    }
  }

  if (CheckIs386()) {
    IsA386 = true;
    jabhack2();
  } else {
    IsA386 = false;
  }

  return IsA386;
}

export function Quit(error: string | null = null, options: QuitOptions = {}): QuitSummary {
  const message = error ?? "";
  const hasError = message.length > 0;
  const useVirtualReality = options.virtualReality ?? virtualreality;
  const virtualInterrupt = useVirtualReality ? 0x61 : null;
  const clearMemory = options.clearMemory?.() ?? null;
  const screenChunk = hasError ? ERRORSCREEN : ORDERSCREEN;
  const screen = options.cacheGraphic?.(screenChunk) ?? grsegs[screenChunk] ?? null;
  const write = hasError ? null : (options.writeConfig?.() ?? WriteConfig());
  const shutdown = options.shutdown?.() ?? ShutdownId();

  const textCopy: QuitTextCopySummary = hasError
    ? { sourceOffset: 7, destSegment: 0xb800, destOffset: 0, bytes: 7 * 160 }
    : { sourceOffset: 7, destSegment: 0xb800, destOffset: 0, bytes: 4000 };
  const cursor = hasError ? [1, 8] as const : [1, 24] as const;

  return {
    error: hasError ? message : null,
    virtualInterrupt,
    clearMemory,
    screenChunk,
    screenBytes: screen?.length ?? 0,
    writeConfig: write,
    shutdown,
    textCopy,
    cursor,
    printedError: hasError ? message : null,
    exitCode: hasError ? 1 : 0,
  };
}

export function ReadConfig(options: ReadConfigOptions | Uint8Array | null = {}): MainConfigSummary {
  const data = readConfigOptions(options);
  let scores = Scores.map((score) => ({ ...score }));
  let sd: SDMode;
  let sm: SMMode;
  let sds: SDSMode;
  let controls: MainConfigControlState;
  let nextDirscan = [...dirscan];
  let nextButtonscan = [...buttonscan];
  let nextButtonmouse = [...buttonmouse];
  let nextButtonjoy = [...buttonjoy];

  if (data && data.length >= CONFIG_SIZE) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const scoreRead = readScores(data, view);
    scores = scoreRead.scores;
    let offset = scoreRead.offset;
    sd = coerceSDMode(view.getUint16(offset, true));
    offset += 2;
    sm = coerceSMMode(view.getUint16(offset, true));
    offset += 2;
    sds = coerceSDSMode(view.getUint16(offset, true));
    offset += 2;

    controls = {
      mouseenabled: view.getUint16(offset, true) !== 0,
      joystickenabled: view.getUint16(offset + 2, true) !== 0,
      joypadenabled: view.getUint16(offset + 4, true) !== 0,
      joystickprogressive: view.getUint16(offset + 6, true) !== 0,
      joystickport: view.getInt16(offset + 8, true),
    };
    offset += 10;

    const dir = readI16Array(view, offset, 4);
    nextDirscan = dir.values;
    offset = dir.offset;
    const buttons = readI16Array(view, offset, 8);
    nextButtonscan = buttons.values;
    offset = buttons.offset;
    const mouse = readI16Array(view, offset, 4);
    nextButtonmouse = mouse.values;
    offset = mouse.offset;
    const joy = readI16Array(view, offset, 4);
    nextButtonjoy = joy.values;
    offset = joy.offset;

    viewsize = view.getInt16(offset, true);
    offset += 2;
    mouseadjustment = view.getInt16(offset, true);

    if (sd === sdm_AdLib && !AdLibPresent && !SoundBlasterPresent) {
      sd = sdm_PC;
      sd = smm_Off as SDMode;
    }
    if ((sds === sds_SoundBlaster && !SoundBlasterPresent) || (sds === sds_SoundSource && !SoundSourcePresent)) {
      sds = sds_Off;
    }
    if (!MousePresent) {
      controls = { ...controls, mouseenabled: false };
    }
    if (!JoysPresent[controls.joystickport]) {
      controls = { ...controls, joystickenabled: false };
    }

    MainMenu[6].active = 1;
    MainItems.curpos = 0;
  } else {
    if (SoundBlasterPresent || AdLibPresent) {
      sd = sdm_AdLib;
      sm = smm_AdLib;
    } else {
      sd = sdm_PC;
      sm = smm_Off;
    }

    if (SoundBlasterPresent) {
      sds = sds_SoundBlaster;
    } else if (SoundSourcePresent) {
      sds = sds_SoundSource;
    } else {
      sds = sds_Off;
    }

    controls = {
      mouseenabled: MousePresent,
      joystickenabled: false,
      joypadenabled: false,
      joystickprogressive: false,
      joystickport: 0,
    };
    viewsize = 15;
    mouseadjustment = 5;
  }

  for (let i = 0; i < MaxScores; i++) {
    Scores[i] = { ...scores[i] };
  }
  copyArray(dirscan, nextDirscan);
  copyArray(buttonscan, nextButtonscan);
  copyArray(buttonmouse, nextButtonmouse);
  copyArray(buttonjoy, nextButtonjoy);
  const appliedControls = SetControlPanelState(controls);
  const sound = applyConfigSound(sd, sm, sds);

  return {
    present: !!(data && data.length >= CONFIG_SIZE),
    bytes: data?.length ?? 0,
    scores: Scores.map((score) => ({ ...score })),
    sd,
    sm,
    sds,
    controls: {
      mouseenabled: appliedControls.mouseenabled,
      joystickenabled: appliedControls.joystickenabled,
      joypadenabled: appliedControls.joypadenabled,
      joystickprogressive: appliedControls.joystickprogressive,
      joystickport: appliedControls.joystickport,
    },
    dirscan: [...dirscan],
    buttonscan: [...buttonscan],
    buttonmouse: [...buttonmouse],
    buttonjoy: [...buttonjoy],
    viewsize,
    mouseadjustment,
    ...sound,
  };
}

export function SaveTheGame(
  memory: SaveGameMemory,
  x = 0,
  y = 0,
  options: SerializeSaveGameOptions = {},
): MainSaveGameResult {
  return {
    ...serializeSaveGame(memory, options),
    saved: true,
    x,
    y,
  };
}

export function SetupWalls(): WallSetupSummary {
  for (let i = 1; i < MAXWALLTILES; i++) {
    horizwall[i] = (i - 1) * 2;
    vertwall[i] = (i - 1) * 2 + 1;
  }

  return {
    firstHoriz: horizwall[1],
    firstVert: vertwall[1],
    lastHoriz: horizwall[MAXWALLTILES - 1],
    lastVert: vertwall[MAXWALLTILES - 1],
  };
}

export function SetViewSize(width: number, height: number): ViewSizeSummary {
  viewwidth = width & ~15;
  viewheight = height & ~1;
  centerx = Math.trunc(viewwidth / 2) - 1;
  shootdelta = Math.trunc(viewwidth / 10);
  screenofs = Math.trunc((200 - STATUSLINES - viewheight) / 2) * SCREENWIDTH
    + Math.trunc((320 - viewwidth) / 8);

  const projection = CalcProjection(FOCALLENGTH);
  lastSetupScalingWidth = Math.trunc(viewwidth * 1.5);
  SetViewSizeForRefresh(viewwidth, viewheight);

  return {
    viewwidth,
    viewheight,
    centerx,
    shootdelta,
    screenofs,
    projection,
    setupScalingWidth: lastSetupScalingWidth,
  };
}

export function ShowViewSize(width: number): ShowViewSizeSummary {
  const oldwidth = viewwidth;
  const oldheight = viewheight;
  const previewViewwidth = width * 16;
  const previewViewheight = Math.trunc(width * 16 * HEIGHTRATIO);

  viewwidth = previewViewwidth;
  viewheight = previewViewheight;

  viewheight = oldheight;
  viewwidth = oldwidth;

  return {
    previewViewwidth,
    previewViewheight,
    restoredViewwidth: viewwidth,
    restoredViewheight: viewheight,
  };
}

export function ShutdownId(): ShutdownIdSummary {
  const us = US_Shutdown();
  const sd = SD_Shutdown();
  const pm = PM_Shutdown();
  const input = IN_Shutdown();
  const vw = VL_Shutdown();
  const ca = CA_Shutdown();
  const mm = MM_Shutdown();
  return { us, sd, pm, in: input, vw, ca, mm };
}

export function SignonScreen(options: SignonScreenOptions = {}): SignonScreenSummary {
  const planeMode = VL_SetVGAPlaneMode();
  const paletteTest = VL_TestPaletteSet();
  const palette = VL_SetPalette(options.palette ?? gamepal);

  const useVirtualReality = options.virtualReality ?? virtualreality;
  let hiddenScreen: ReturnType<typeof VL_SetScreen> | null = null;
  let munge: SignonMungeSummary | null = null;
  let blit: ReturnType<typeof VL_MemToScreen> | null = null;
  let visibleScreen: ReturnType<typeof VL_SetScreen> | null = null;

  if (!useVirtualReality) {
    hiddenScreen = VL_SetScreen(0x8000, 0);
    const intro = options.intro ?? introscn;
    const munged = VL_MungePic(intro, 320, 200);
    munge = {
      bytes: munged.length,
      first: munged[0] ?? 0,
      last: munged[munged.length - 1] ?? 0,
    };
    blit = VL_MemToScreen(munged, 320, 200, 0, 0);
    visibleScreen = VL_SetScreen(0, 0);
  }

  let reclaimSegment = Math.trunc(options.introSegment ?? 0);
  let reclaimLength = Math.trunc(64000 / 16);
  if (Math.trunc(options.introOffset ?? 0)) {
    reclaimSegment++;
    reclaimLength--;
  }
  const reclaim = MML_UseSpace(reclaimSegment, reclaimLength);

  return {
    planeMode,
    paletteTest,
    palette,
    virtualreality: useVirtualReality,
    hiddenScreen,
    munge,
    blit,
    visibleScreen,
    reclaimSegment,
    reclaimLength,
    reclaim,
  };
}

export function WriteConfig(options: WriteConfigOptions = {}): MainConfigSummary {
  const bytes = new Uint8Array(CONFIG_SIZE);
  const view = new DataView(bytes.buffer);
  let offset = writeScores(bytes, view, options.scores ?? Scores);
  view.setUint16(offset, SoundMode, true);
  offset += 2;
  view.setUint16(offset, MusicMode, true);
  offset += 2;
  view.setUint16(offset, DigiMode, true);
  offset += 2;

  view.setUint16(offset, mouseenabled ? 1 : 0, true);
  offset += 2;
  view.setUint16(offset, joystickenabled ? 1 : 0, true);
  offset += 2;
  view.setUint16(offset, joypadenabled ? 1 : 0, true);
  offset += 2;
  view.setUint16(offset, joystickprogressive ? 1 : 0, true);
  offset += 2;
  view.setInt16(offset, joystickport, true);
  offset += 2;

  offset = writeI16Array(view, offset, dirscan, 4);
  offset = writeI16Array(view, offset, buttonscan, 8);
  offset = writeI16Array(view, offset, buttonmouse, 4);
  offset = writeI16Array(view, offset, buttonjoy, 4);
  view.setInt16(offset, viewsize, true);
  offset += 2;
  view.setInt16(offset, mouseadjustment, true);

  return {
    present: true,
    bytes: CONFIG_SIZE,
    scores: Scores.map((score) => ({ ...score })),
    sd: SoundMode,
    sm: MusicMode,
    sds: DigiMode,
    controls: { mouseenabled, joystickenabled, joypadenabled, joystickprogressive, joystickport },
    dirscan: [...dirscan],
    buttonscan: [...buttonscan],
    buttonmouse: [...buttonmouse],
    buttonjoy: [...buttonjoy],
    viewsize,
    mouseadjustment,
    soundModeSet: true,
    musicModeSet: true,
    digiMode: SD_SetDigiDevice(DigiMode),
    bytesOut: bytes,
  };
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_MAIN.C
// 
// #include <conio.h>
// #include "WL_DEF.H"
// #pragma hdrstop
// 
// 
// /*
// =============================================================================
// 
// 						   WOLFENSTEIN 3-D
// 
// 					  An Id Software production
// 
// 						   by John Carmack
// 
// =============================================================================
// */
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
// #define FOCALLENGTH     (0x5700l)               // in global coordinates
// #define VIEWGLOBAL      0x10000                 // globals visable flush to wall
// 
// #define VIEWWIDTH       256                     // size of view window
// #define VIEWHEIGHT      144
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// char            str[80],str2[20];
// int				tedlevelnum;
// boolean         tedlevel;
// boolean         nospr;
// boolean         IsA386;
// int                     dirangle[9] = {0,ANGLES/8,2*ANGLES/8,3*ANGLES/8,4*ANGLES/8,
// 	5*ANGLES/8,6*ANGLES/8,7*ANGLES/8,ANGLES};
// 
// //
// // proejection variables
// //
// fixed           focallength;
// unsigned        screenofs;
// int             viewwidth;
// int             viewheight;
// int             centerx;
// int             shootdelta;                     // pixels away from centerx a target can be
// fixed           scale,maxslope;
// long            heightnumerator;
// int                     minheightdiv;
// 
// 
// void            Quit (char *error);
// 
// boolean         startgame,loadedgame,virtualreality;
// int             mouseadjustment;
// 
// char	configname[13]="CONFIG.";
// 
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
// /*
// ====================
// =
// = ReadConfig
// =
// ====================
// */
// 
// void ReadConfig(void)
// {
// 	int                     file;
// 	SDMode          sd;
// 	SMMode          sm;
// 	SDSMode         sds;
// 
// 
// 	if ( (file = open(configname,O_BINARY | O_RDONLY)) != -1)
// 	{
// 	//
// 	// valid config file
// 	//
// 		read(file,Scores,sizeof(HighScore) * MaxScores);
// 
// 		read(file,&sd,sizeof(sd));
// 		read(file,&sm,sizeof(sm));
// 		read(file,&sds,sizeof(sds));
// 
// 		read(file,&mouseenabled,sizeof(mouseenabled));
// 		read(file,&joystickenabled,sizeof(joystickenabled));
// 		read(file,&joypadenabled,sizeof(joypadenabled));
// 		read(file,&joystickprogressive,sizeof(joystickprogressive));
// 		read(file,&joystickport,sizeof(joystickport));
// 
// 		read(file,&dirscan,sizeof(dirscan));
// 		read(file,&buttonscan,sizeof(buttonscan));
// 		read(file,&buttonmouse,sizeof(buttonmouse));
// 		read(file,&buttonjoy,sizeof(buttonjoy));
// 
// 		read(file,&viewsize,sizeof(viewsize));
// 		read(file,&mouseadjustment,sizeof(mouseadjustment));
// 
// 		close(file);
// 
// 		if (sd == sdm_AdLib && !AdLibPresent && !SoundBlasterPresent)
// 		{
// 			sd = sdm_PC;
// 			sd = smm_Off;
// 		}
// 
// 		if ((sds == sds_SoundBlaster && !SoundBlasterPresent) ||
// 			(sds == sds_SoundSource && !SoundSourcePresent))
// 			sds = sds_Off;
// 
// 		if (!MousePresent)
// 			mouseenabled = false;
// 		if (!JoysPresent[joystickport])
// 			joystickenabled = false;
// 
// 		MainMenu[6].active=1;
// 		MainItems.curpos=0;
// 	}
// 	else
// 	{
// 	//
// 	// no config file, so select by hardware
// 	//
// 		if (SoundBlasterPresent || AdLibPresent)
// 		{
// 			sd = sdm_AdLib;
// 			sm = smm_AdLib;
// 		}
// 		else
// 		{
// 			sd = sdm_PC;
// 			sm = smm_Off;
// 		}
// 
// 		if (SoundBlasterPresent)
// 			sds = sds_SoundBlaster;
// 		else if (SoundSourcePresent)
// 			sds = sds_SoundSource;
// 		else
// 			sds = sds_Off;
// 
// 		if (MousePresent)
// 			mouseenabled = true;
// 
// 		joystickenabled = false;
// 		joypadenabled = false;
// 		joystickport = 0;
// 		joystickprogressive = false;
// 
// 		viewsize = 15;
// 		mouseadjustment=5;
// 	}
// 
// 	SD_SetMusicMode (sm);
// 	SD_SetSoundMode (sd);
// 	SD_SetDigiDevice (sds);
// 
// }
// 
// 
// /*
// ====================
// =
// = WriteConfig
// =
// ====================
// */
// 
// void WriteConfig(void)
// {
// 	int                     file;
// 
// 	file = open(configname,O_CREAT | O_BINARY | O_WRONLY,
// 				S_IREAD | S_IWRITE | S_IFREG);
// 
// 	if (file != -1)
// 	{
// 		write(file,Scores,sizeof(HighScore) * MaxScores);
// 
// 		write(file,&SoundMode,sizeof(SoundMode));
// 		write(file,&MusicMode,sizeof(MusicMode));
// 		write(file,&DigiMode,sizeof(DigiMode));
// 
// 		write(file,&mouseenabled,sizeof(mouseenabled));
// 		write(file,&joystickenabled,sizeof(joystickenabled));
// 		write(file,&joypadenabled,sizeof(joypadenabled));
// 		write(file,&joystickprogressive,sizeof(joystickprogressive));
// 		write(file,&joystickport,sizeof(joystickport));
// 
// 		write(file,&dirscan,sizeof(dirscan));
// 		write(file,&buttonscan,sizeof(buttonscan));
// 		write(file,&buttonmouse,sizeof(buttonmouse));
// 		write(file,&buttonjoy,sizeof(buttonjoy));
// 
// 		write(file,&viewsize,sizeof(viewsize));
// 		write(file,&mouseadjustment,sizeof(mouseadjustment));
// 
// 		close(file);
// 	}
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// ========================
// =
// = Patch386
// =
// = Patch ldiv to use 32 bit instructions
// =
// ========================
// */
// 
// char    *JHParmStrings[] = {"no386",nil};
// void Patch386 (void)
// {
// extern void far jabhack2(void);
// extern int far  CheckIs386(void);
// 
// 	int     i;
// 
// 	for (i = 1;i < _argc;i++)
// 		if (US_CheckParm(_argv[i],JHParmStrings) == 0)
// 		{
// 			IsA386 = false;
// 			return;
// 		}
// 
// 	if (CheckIs386())
// 	{
// 		IsA386 = true;
// 		jabhack2();
// 	}
// 	else
// 		IsA386 = false;
// }
// 
// //===========================================================================
// 
// /*
// =====================
// =
// = NewGame
// =
// = Set up new game to start from the beginning
// =
// =====================
// */
// 
// void NewGame (int difficulty,int episode)
// {
// 	memset (&gamestate,0,sizeof(gamestate));
// 	gamestate.difficulty = difficulty;
// 	gamestate.weapon = gamestate.bestweapon
// 		= gamestate.chosenweapon = wp_pistol;
// 	gamestate.health = 100;
// 	gamestate.ammo = STARTAMMO;
// 	gamestate.lives = 3;
// 	gamestate.nextextra = EXTRAPOINTS;
// 	gamestate.episode=episode;
// 
// 	startgame = true;
// }
// 
// //===========================================================================
// 
// void DiskFlopAnim(int x,int y)
// {
//  static char which=0;
//  if (!x && !y)
//    return;
//  VWB_DrawPic(x,y,C_DISKLOADING1PIC+which);
//  VW_UpdateScreen();
//  which^=1;
// }
// 
// 
// long DoChecksum(byte far *source,unsigned size,long checksum)
// {
//  unsigned i;
// 
//  for (i=0;i<size-1;i++)
//    checksum += source[i]^source[i+1];
// 
//  return checksum;
// }
// 
// 
// /*
// ==================
// =
// = SaveTheGame
// =
// ==================
// */
// 
// boolean SaveTheGame(int file,int x,int y)
// {
// 	struct diskfree_t dfree;
// 	long avail,size,checksum;
// 	objtype *ob,nullobj;
// 
// 
// 	if (_dos_getdiskfree(0,&dfree))
// 	  Quit("Error in _dos_getdiskfree call");
// 
// 	avail = (long)dfree.avail_clusters *
// 			dfree.bytes_per_sector *
// 			dfree.sectors_per_cluster;
// 
// 	size = 0;
// 	for (ob = player; ob ; ob=ob->next)
// 	  size += sizeof(*ob);
// 	size += sizeof(nullobj);
// 
// 	size += sizeof(gamestate) +
// 			sizeof(LRstruct)*8 +
// 			sizeof(tilemap) +
// 			sizeof(actorat) +
// 			sizeof(laststatobj) +
// 			sizeof(statobjlist) +
// 			sizeof(doorposition) +
// 			sizeof(pwallstate) +
// 			sizeof(pwallx) +
// 			sizeof(pwally) +
// 			sizeof(pwalldir) +
// 			sizeof(pwallpos);
// 
// 	if (avail < size)
// 	{
// 	 Message(STR_NOSPACE1"\n"
// 			 STR_NOSPACE2);
// 	 return false;
// 	}
// 
// 	checksum = 0;
// 
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)&gamestate,sizeof(gamestate));
// 	checksum = DoChecksum((byte far *)&gamestate,sizeof(gamestate),checksum);
// 
// 	DiskFlopAnim(x,y);
// #ifdef SPEAR
// 	CA_FarWrite (file,(void far *)&LevelRatios[0],sizeof(LRstruct)*20);
// 	checksum = DoChecksum((byte far *)&LevelRatios[0],sizeof(LRstruct)*20,checksum);
// #else
// 	CA_FarWrite (file,(void far *)&LevelRatios[0],sizeof(LRstruct)*8);
// 	checksum = DoChecksum((byte far *)&LevelRatios[0],sizeof(LRstruct)*8,checksum);
// #endif
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)tilemap,sizeof(tilemap));
// 	checksum = DoChecksum((byte far *)tilemap,sizeof(tilemap),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)actorat,sizeof(actorat));
// 	checksum = DoChecksum((byte far *)actorat,sizeof(actorat),checksum);
// 
// 	CA_FarWrite (file,(void far *)areaconnect,sizeof(areaconnect));
// 	CA_FarWrite (file,(void far *)areabyplayer,sizeof(areabyplayer));
// 
// 	for (ob = player ; ob ; ob=ob->next)
// 	{
// 	 DiskFlopAnim(x,y);
// 	 CA_FarWrite (file,(void far *)ob,sizeof(*ob));
// 	}
// 	nullobj.active = ac_badobject;          // end of file marker
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)&nullobj,sizeof(nullobj));
// 
// 
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)&laststatobj,sizeof(laststatobj));
// 	checksum = DoChecksum((byte far *)&laststatobj,sizeof(laststatobj),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)statobjlist,sizeof(statobjlist));
// 	checksum = DoChecksum((byte far *)statobjlist,sizeof(statobjlist),checksum);
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)doorposition,sizeof(doorposition));
// 	checksum = DoChecksum((byte far *)doorposition,sizeof(doorposition),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)doorobjlist,sizeof(doorobjlist));
// 	checksum = DoChecksum((byte far *)doorobjlist,sizeof(doorobjlist),checksum);
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarWrite (file,(void far *)&pwallstate,sizeof(pwallstate));
// 	checksum = DoChecksum((byte far *)&pwallstate,sizeof(pwallstate),checksum);
// 	CA_FarWrite (file,(void far *)&pwallx,sizeof(pwallx));
// 	checksum = DoChecksum((byte far *)&pwallx,sizeof(pwallx),checksum);
// 	CA_FarWrite (file,(void far *)&pwally,sizeof(pwally));
// 	checksum = DoChecksum((byte far *)&pwally,sizeof(pwally),checksum);
// 	CA_FarWrite (file,(void far *)&pwalldir,sizeof(pwalldir));
// 	checksum = DoChecksum((byte far *)&pwalldir,sizeof(pwalldir),checksum);
// 	CA_FarWrite (file,(void far *)&pwallpos,sizeof(pwallpos));
// 	checksum = DoChecksum((byte far *)&pwallpos,sizeof(pwallpos),checksum);
// 
// 	//
// 	// WRITE OUT CHECKSUM
// 	//
// 	CA_FarWrite (file,(void far *)&checksum,sizeof(checksum));
// 
// 	return(true);
// }
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = LoadTheGame
// =
// ==================
// */
// 
// boolean LoadTheGame(int file,int x,int y)
// {
// 	long checksum,oldchecksum;
// 	objtype *ob,nullobj;
// 
// 
// 	checksum = 0;
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)&gamestate,sizeof(gamestate));
// 	checksum = DoChecksum((byte far *)&gamestate,sizeof(gamestate),checksum);
// 
// 	DiskFlopAnim(x,y);
// #ifdef SPEAR
// 	CA_FarRead (file,(void far *)&LevelRatios[0],sizeof(LRstruct)*20);
// 	checksum = DoChecksum((byte far *)&LevelRatios[0],sizeof(LRstruct)*20,checksum);
// #else
// 	CA_FarRead (file,(void far *)&LevelRatios[0],sizeof(LRstruct)*8);
// 	checksum = DoChecksum((byte far *)&LevelRatios[0],sizeof(LRstruct)*8,checksum);
// #endif
// 
// 	DiskFlopAnim(x,y);
// 	SetupGameLevel ();
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)tilemap,sizeof(tilemap));
// 	checksum = DoChecksum((byte far *)tilemap,sizeof(tilemap),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)actorat,sizeof(actorat));
// 	checksum = DoChecksum((byte far *)actorat,sizeof(actorat),checksum);
// 
// 	CA_FarRead (file,(void far *)areaconnect,sizeof(areaconnect));
// 	CA_FarRead (file,(void far *)areabyplayer,sizeof(areabyplayer));
// 
// 
// 
// 	InitActorList ();
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)player,sizeof(*player));
// 
// 	while (1)
// 	{
// 	 DiskFlopAnim(x,y);
// 		CA_FarRead (file,(void far *)&nullobj,sizeof(nullobj));
// 		if (nullobj.active == ac_badobject)
// 			break;
// 		GetNewActor ();
// 	 // don't copy over the links
// 		memcpy (new,&nullobj,sizeof(nullobj)-4);
// 	}
// 
// 
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)&laststatobj,sizeof(laststatobj));
// 	checksum = DoChecksum((byte far *)&laststatobj,sizeof(laststatobj),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)statobjlist,sizeof(statobjlist));
// 	checksum = DoChecksum((byte far *)statobjlist,sizeof(statobjlist),checksum);
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)doorposition,sizeof(doorposition));
// 	checksum = DoChecksum((byte far *)doorposition,sizeof(doorposition),checksum);
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)doorobjlist,sizeof(doorobjlist));
// 	checksum = DoChecksum((byte far *)doorobjlist,sizeof(doorobjlist),checksum);
// 
// 	DiskFlopAnim(x,y);
// 	CA_FarRead (file,(void far *)&pwallstate,sizeof(pwallstate));
// 	checksum = DoChecksum((byte far *)&pwallstate,sizeof(pwallstate),checksum);
// 	CA_FarRead (file,(void far *)&pwallx,sizeof(pwallx));
// 	checksum = DoChecksum((byte far *)&pwallx,sizeof(pwallx),checksum);
// 	CA_FarRead (file,(void far *)&pwally,sizeof(pwally));
// 	checksum = DoChecksum((byte far *)&pwally,sizeof(pwally),checksum);
// 	CA_FarRead (file,(void far *)&pwalldir,sizeof(pwalldir));
// 	checksum = DoChecksum((byte far *)&pwalldir,sizeof(pwalldir),checksum);
// 	CA_FarRead (file,(void far *)&pwallpos,sizeof(pwallpos));
// 	checksum = DoChecksum((byte far *)&pwallpos,sizeof(pwallpos),checksum);
// 
// 	CA_FarRead (file,(void far *)&oldchecksum,sizeof(oldchecksum));
// 
// 	if (oldchecksum != checksum)
// 	{
// 	 Message(STR_SAVECHT1"\n"
// 			 STR_SAVECHT2"\n"
// 			 STR_SAVECHT3"\n"
// 			 STR_SAVECHT4);
// 
// 	 IN_ClearKeysDown();
// 	 IN_Ack();
// 
// 	 gamestate.score = 0;
// 	 gamestate.lives = 1;
// 	 gamestate.weapon =
// 	   gamestate.chosenweapon =
// 	   gamestate.bestweapon = wp_pistol;
// 	 gamestate.ammo = 8;
// 	}
// 
// 	return true;
// }
// 
// //===========================================================================
// 
// /*
// ==========================
// =
// = ShutdownId
// =
// = Shuts down all ID_?? managers
// =
// ==========================
// */
// 
// void ShutdownId (void)
// {
// 	US_Shutdown ();
// 	SD_Shutdown ();
// 	PM_Shutdown ();
// 	IN_Shutdown ();
// 	VW_Shutdown ();
// 	CA_Shutdown ();
// 	MM_Shutdown ();
// }
// 
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = BuildTables
// =
// = Calculates:
// =
// = scale                 projection constant
// = sintable/costable     overlapping fractional tables
// =
// ==================
// */
// 
// const   float   radtoint = (float)FINEANGLES/2/PI;
// 
// void BuildTables (void)
// {
//   int           i;
//   float         angle,anglestep;
//   double        tang;
//   fixed         value;
// 
// 
// //
// // calculate fine tangents
// //
// 
// 	for (i=0;i<FINEANGLES/8;i++)
// 	{
// 		tang = tan( (i+0.5)/radtoint);
// 		finetangent[i] = tang*TILEGLOBAL;
// 		finetangent[FINEANGLES/4-1-i] = 1/tang*TILEGLOBAL;
// 	}
// 
// //
// // costable overlays sintable with a quarter phase shift
// // ANGLES is assumed to be divisable by four
// //
// // The low word of the value is the fraction, the high bit is the sign bit,
// // bits 16-30 should be 0
// //
// 
//   angle = 0;
//   anglestep = PI/2/ANGLEQUAD;
//   for (i=0;i<=ANGLEQUAD;i++)
//   {
// 	value=GLOBAL1*sin(angle);
// 	sintable[i]=
// 	  sintable[i+ANGLES]=
// 	  sintable[ANGLES/2-i] = value;
// 	sintable[ANGLES-i]=
// 	  sintable[ANGLES/2+i] = value | 0x80000000l;
// 	angle += anglestep;
//   }
// 
// }
// 
// //===========================================================================
// 
// 
// /*
// ====================
// =
// = CalcProjection
// =
// = Uses focallength
// =
// ====================
// */
// 
// void CalcProjection (long focal)
// {
// 	int             i;
// 	long            intang;
// 	float   angle;
// 	double  tang;
// 	double  planedist;
// 	double  globinhalf;
// 	int             halfview;
// 	double  halfangle,facedist;
// 
// 
// 	focallength = focal;
// 	facedist = focal+MINDIST;
// 	halfview = viewwidth/2;                                 // half view in pixels
// 
// //
// // calculate scale value for vertical height calculations
// // and sprite x calculations
// //
// 	scale = halfview*facedist/(VIEWGLOBAL/2);
// 
// //
// // divide heightnumerator by a posts distance to get the posts height for
// // the heightbuffer.  The pixel height is height>>2
// //
// 	heightnumerator = (TILEGLOBAL*scale)>>6;
// 	minheightdiv = heightnumerator/0x7fff +1;
// 
// //
// // calculate the angle offset from view angle of each pixel's ray
// //
// 
// 	for (i=0;i<halfview;i++)
// 	{
// 	// start 1/2 pixel over, so viewangle bisects two middle pixels
// 		tang = (long)i*VIEWGLOBAL/viewwidth/facedist;
// 		angle = atan(tang);
// 		intang = angle*radtoint;
// 		pixelangle[halfview-1-i] = intang;
// 		pixelangle[halfview+i] = -intang;
// 	}
// 
// //
// // if a point's abs(y/x) is greater than maxslope, the point is outside
// // the view area
// //
// 	maxslope = finetangent[pixelangle[0]];
// 	maxslope >>= 8;
// }
// 
// 
// 
// //===========================================================================
// 
// /*
// ===================
// =
// = SetupWalls
// =
// = Map tile values to scaled pics
// =
// ===================
// */
// 
// void SetupWalls (void)
// {
// 	int     i;
// 
// 	for (i=1;i<MAXWALLTILES;i++)
// 	{
// 		horizwall[i]=(i-1)*2;
// 		vertwall[i]=(i-1)*2+1;
// 	}
// }
// 
// //===========================================================================
// 
// /*
// ==========================
// =
// = SignonScreen
// =
// ==========================
// */
// 
// void SignonScreen (void)                        // VGA version
// {
// 	unsigned        segstart,seglength;
// 
// 	VL_SetVGAPlaneMode ();
// 	VL_TestPaletteSet ();
// 	VL_SetPalette (&gamepal);
// 
// 	if (!virtualreality)
// 	{
// 		VW_SetScreen(0x8000,0);
// 		VL_MungePic (&introscn,320,200);
// 		VL_MemToScreen (&introscn,320,200,0,0);
// 		VW_SetScreen(0,0);
// 	}
// 
// //
// // reclaim the memory from the linked in signon screen
// //
// 	segstart = FP_SEG(&introscn);
// 	seglength = 64000/16;
// 	if (FP_OFF(&introscn))
// 	{
// 		segstart++;
// 		seglength--;
// 	}
// 	MML_UseSpace (segstart,seglength);
// }
// 
// 
// /*
// ==========================
// =
// = FinishSignon
// =
// ==========================
// */
// 
// void FinishSignon (void)
// {
// 
// #ifndef SPEAR
// 	VW_Bar (0,189,300,11,peekb(0xa000,0));
// 	WindowX = 0;
// 	WindowW = 320;
// 	PrintY = 190;
// 
// 	#ifndef JAPAN
// 	SETFONTCOLOR(14,4);
// 
// 	#ifdef SPANISH
// 	US_CPrint ("Oprima una tecla");
// 	#else
// 	US_CPrint ("Press a key");
// 	#endif
// 
// 	#endif
// 
// 	if (!NoWait)
// 		IN_Ack ();
// 
// 	#ifndef JAPAN
// 	VW_Bar (0,189,300,11,peekb(0xa000,0));
// 
// 	PrintY = 190;
// 	SETFONTCOLOR(10,4);
// 
// 	#ifdef SPANISH
// 	US_CPrint ("pensando...");
// 	#else
// 	US_CPrint ("Working...");
// 	#endif
// 
// 	#endif
// 
// 	SETFONTCOLOR(0,15);
// #else
// 	if (!NoWait)
// 		VW_WaitVBL(3*70);
// #endif
// }
// 
// //===========================================================================
// 
// /*
// =================
// =
// = MS_CheckParm
// =
// =================
// */
// 
// boolean MS_CheckParm (char far *check)
// {
// 	int             i;
// 	char    *parm;
// 
// 	for (i = 1;i<_argc;i++)
// 	{
// 		parm = _argv[i];
// 
// 		while ( !isalpha(*parm) )       // skip - / \ etc.. in front of parm
// 			if (!*parm++)
// 				break;                          // hit end of string without an alphanum
// 
// 		if ( !_fstricmp(check,parm) )
// 			return true;
// 	}
// 
// 	return false;
// }
// 
// //===========================================================================
// 
// /*
// =====================
// =
// = InitDigiMap
// =
// =====================
// */
// 
// static  int     wolfdigimap[] =
// 		{
// 			// These first sounds are in the upload version
// #ifndef SPEAR
// 			HALTSND,                0,
// 			DOGBARKSND,             1,
// 			CLOSEDOORSND,           2,
// 			OPENDOORSND,            3,
// 			ATKMACHINEGUNSND,       4,
// 			ATKPISTOLSND,           5,
// 			ATKGATLINGSND,          6,
// 			SCHUTZADSND,            7,
// 			GUTENTAGSND,            8,
// 			MUTTISND,               9,
// 			BOSSFIRESND,            10,
// 			SSFIRESND,              11,
// 			DEATHSCREAM1SND,        12,
// 			DEATHSCREAM2SND,        13,
// 			DEATHSCREAM3SND,        13,
// 			TAKEDAMAGESND,          14,
// 			PUSHWALLSND,            15,
// 
// 			LEBENSND,               20,
// 			NAZIFIRESND,            21,
// 			SLURPIESND,             22,
// 
// 			YEAHSND,				32,
// 
// #ifndef UPLOAD
// 			// These are in all other episodes
// 			DOGDEATHSND,            16,
// 			AHHHGSND,               17,
// 			DIESND,                 18,
// 			EVASND,                 19,
// 
// 			TOT_HUNDSND,            23,
// 			MEINGOTTSND,            24,
// 			SCHABBSHASND,           25,
// 			HITLERHASND,            26,
// 			SPIONSND,               27,
// 			NEINSOVASSND,           28,
// 			DOGATTACKSND,           29,
// 			LEVELDONESND,           30,
// 			MECHSTEPSND,			31,
// 
// 			SCHEISTSND,				33,
// 			DEATHSCREAM4SND,		34,		// AIIEEE
// 			DEATHSCREAM5SND,		35,		// DEE-DEE
// 			DONNERSND,				36,		// EPISODE 4 BOSS DIE
// 			EINESND,				37,		// EPISODE 4 BOSS SIGHTING
// 			ERLAUBENSND,			38,		// EPISODE 6 BOSS SIGHTING
// 			DEATHSCREAM6SND,		39,		// FART
// 			DEATHSCREAM7SND,		40,		// GASP
// 			DEATHSCREAM8SND,		41,		// GUH-BOY!
// 			DEATHSCREAM9SND,		42,		// AH GEEZ!
// 			KEINSND,				43,		// EPISODE 5 BOSS SIGHTING
// 			MEINSND,				44,		// EPISODE 6 BOSS DIE
// 			ROSESND,				45,		// EPISODE 5 BOSS DIE
// 
// #endif
// #else
// //
// // SPEAR OF DESTINY DIGISOUNDS
// //
// 			HALTSND,                0,
// 			CLOSEDOORSND,           2,
// 			OPENDOORSND,            3,
// 			ATKMACHINEGUNSND,       4,
// 			ATKPISTOLSND,           5,
// 			ATKGATLINGSND,          6,
// 			SCHUTZADSND,            7,
// 			BOSSFIRESND,            8,
// 			SSFIRESND,              9,
// 			DEATHSCREAM1SND,        10,
// 			DEATHSCREAM2SND,        11,
// 			TAKEDAMAGESND,          12,
// 			PUSHWALLSND,            13,
// 			AHHHGSND,               15,
// 			LEBENSND,               16,
// 			NAZIFIRESND,            17,
// 			SLURPIESND,             18,
// 			LEVELDONESND,           22,
// 			DEATHSCREAM4SND,		23,		// AIIEEE
// 			DEATHSCREAM3SND,        23,		// DOUBLY-MAPPED!!!
// 			DEATHSCREAM5SND,		24,		// DEE-DEE
// 			DEATHSCREAM6SND,		25,		// FART
// 			DEATHSCREAM7SND,		26,		// GASP
// 			DEATHSCREAM8SND,		27,		// GUH-BOY!
// 			DEATHSCREAM9SND,		28,		// AH GEEZ!
// 			GETGATLINGSND,			38,		// Got Gat replacement
// 
// #ifndef SPEARDEMO
// 			DOGBARKSND,             1,
// 			DOGDEATHSND,            14,
// 			SPIONSND,               19,
// 			NEINSOVASSND,           20,
// 			DOGATTACKSND,           21,
// 			TRANSSIGHTSND,			29,		// Trans Sight
// 			TRANSDEATHSND,			30,		// Trans Death
// 			WILHELMSIGHTSND,		31,		// Wilhelm Sight
// 			WILHELMDEATHSND,		32,		// Wilhelm Death
// 			UBERDEATHSND,			33,		// Uber Death
// 			KNIGHTSIGHTSND,			34,		// Death Knight Sight
// 			KNIGHTDEATHSND,			35,		// Death Knight Death
// 			ANGELSIGHTSND,			36,		// Angel Sight
// 			ANGELDEATHSND,			37,		// Angel Death
// 			GETSPEARSND,			39,		// Got Spear replacement
// #endif
// #endif
// 			LASTSOUND
// 		};
// 
// 
// void InitDigiMap (void)
// {
// 	int                     *map;
// 
// 	for (map = wolfdigimap;*map != LASTSOUND;map += 2)
// 		DigiMap[map[0]] = map[1];
// 
// 
// }
// 
// 
// #ifndef SPEAR
// CP_iteminfo	MusicItems={CTL_X,CTL_Y,6,0,32};
// CP_itemtype far MusicMenu[]=
// 	{
// 		{1,"Get Them!",0},
// 		{1,"Searching",0},
// 		{1,"P.O.W.",0},
// 		{1,"Suspense",0},
// 		{1,"War March",0},
// 		{1,"Around The Corner!",0},
// 
// 		{1,"Nazi Anthem",0},
// 		{1,"Lurking...",0},
// 		{1,"Going After Hitler",0},
// 		{1,"Pounding Headache",0},
// 		{1,"Into the Dungeons",0},
// 		{1,"Ultimate Conquest",0},
// 
// 		{1,"Kill the S.O.B.",0},
// 		{1,"The Nazi Rap",0},
// 		{1,"Twelfth Hour",0},
// 		{1,"Zero Hour",0},
// 		{1,"Ultimate Conquest",0},
// 		{1,"Wolfpack",0}
// 	};
// #else
// CP_iteminfo MusicItems={CTL_X,CTL_Y-20,9,0,32};
// CP_itemtype far MusicMenu[]=
//    {
// 		{1,"Funky Colonel Bill",0},
// 		{1,"Death To The Nazis",0},
// 		{1,"Tiptoeing Around",0},
// 		{1,"Is This THE END?",0},
// 		{1,"Evil Incarnate",0},
// 		{1,"Jazzin' Them Nazis",0},
// 		{1,"Puttin' It To The Enemy",0},
// 		{1,"The SS Gonna Get You",0},
// 		{1,"Towering Above",0}
// 	};
// #endif
// 
// #ifndef SPEARDEMO
// void DoJukebox(void)
// {
// 	int which,lastsong=-1;
// 	unsigned start,songs[]=
// 		{
// #ifndef SPEAR
// 			GETTHEM_MUS,
// 			SEARCHN_MUS,
// 			POW_MUS,
// 			SUSPENSE_MUS,
// 			WARMARCH_MUS,
// 			CORNER_MUS,
// 
// 			NAZI_OMI_MUS,
// 			PREGNANT_MUS,
// 			GOINGAFT_MUS,
// 			HEADACHE_MUS,
// 			DUNGEON_MUS,
// 			ULTIMATE_MUS,
// 
// 			INTROCW3_MUS,
// 			NAZI_RAP_MUS,
// 			TWELFTH_MUS,
// 			ZEROHOUR_MUS,
// 			ULTIMATE_MUS,
// 			PACMAN_MUS
// #else
// 			XFUNKIE_MUS,             // 0
// 			XDEATH_MUS,              // 2
// 			XTIPTOE_MUS,             // 4
// 			XTHEEND_MUS,             // 7
// 			XEVIL_MUS,               // 17
// 			XJAZNAZI_MUS,            // 18
// 			XPUTIT_MUS,              // 21
// 			XGETYOU_MUS,             // 22
// 			XTOWER2_MUS              // 23
// #endif
// 		};
// 	struct dostime_t time;
// 
// 
// 
// 	IN_ClearKeysDown();
// 	if (!AdLibPresent && !SoundBlasterPresent)
// 		return;
// 
// 
// 	MenuFadeOut();
// 
// #ifndef SPEAR
// #ifndef UPLOAD
// 	_dos_gettime(&time);
// 	start = (time.hsecond%3)*6;
// #else
// 	start = 0;
// #endif
// #else
// 	start = 0;
// #endif
// 
// 
// 	CA_CacheGrChunk (STARTFONT+1);
// #ifdef SPEAR
// 	CacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// #else
// 	CacheLump (CONTROLS_LUMP_START,CONTROLS_LUMP_END);
// #endif
// 	CA_LoadAllSounds ();
// 
// 	fontnumber=1;
// 	ClearMScreen ();
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 	DrawStripes (10);
// 	SETFONTCOLOR (TEXTCOLOR,BKGDCOLOR);
// 
// #ifndef SPEAR
// 	DrawWindow (CTL_X-2,CTL_Y-6,280,13*7,BKGDCOLOR);
// #else
// 	DrawWindow (CTL_X-2,CTL_Y-26,280,13*10,BKGDCOLOR);
// #endif
// 
// 	DrawMenu (&MusicItems,&MusicMenu[start]);
// 
// 	SETFONTCOLOR (READHCOLOR,BKGDCOLOR);
// 	PrintY=15;
// 	WindowX = 0;
// 	WindowY = 320;
// 	US_CPrint ("Robert's Jukebox");
// 
// 	SETFONTCOLOR (TEXTCOLOR,BKGDCOLOR);
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// 
// 	do
// 	{
// 		which = HandleMenu(&MusicItems,&MusicMenu[start],NULL);
// 		if (which>=0)
// 		{
// 			if (lastsong >= 0)
// 				MusicMenu[start+lastsong].active = 1;
// 
// 			StartCPMusic(songs[start + which]);
// 			MusicMenu[start+which].active = 2;
// 			DrawMenu (&MusicItems,&MusicMenu[start]);
// 			VW_UpdateScreen();
// 			lastsong = which;
// 		}
// 	} while(which>=0);
// 
// 	MenuFadeOut();
// 	IN_ClearKeysDown();
// #ifdef SPEAR
// 	UnCacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// #else
// 	UnCacheLump (CONTROLS_LUMP_START,CONTROLS_LUMP_END);
// #endif
// }
// #endif
// 
// 
// /*
// ==========================
// =
// = InitGame
// =
// = Load a few things right away
// =
// ==========================
// */
// 
// void InitGame (void)
// {
// 	int                     i,x,y;
// 	unsigned        *blockstart;
// 
// 	if (MS_CheckParm ("virtual"))
// 		virtualreality = true;
// 	else
// 		virtualreality = false;
// 
// 	MM_Startup ();                  // so the signon screen can be freed
// 
// 	SignonScreen ();
// 
// 	VW_Startup ();
// 	IN_Startup ();
// 	PM_Startup ();
// 	PM_UnlockMainMem ();
// 	SD_Startup ();
// 	CA_Startup ();
// 	US_Startup ();
// 
// 
// #ifndef SPEAR
// 	if (mminfo.mainmem < 235000L)
// #else
// 	if (mminfo.mainmem < 257000L && !MS_CheckParm("debugmode"))
// #endif
// 	{
// 		memptr screen;
// 
// 		CA_CacheGrChunk (ERRORSCREEN);
// 		screen = grsegs[ERRORSCREEN];
// 		ShutdownId();
// 		movedata ((unsigned)screen,7+7*160,0xb800,0,17*160);
// 		gotoxy (1,23);
// 		exit(1);
// 	}
// 
// 
// //
// // build some tables
// //
// 	InitDigiMap ();
// 
// 	for (i=0;i<MAPSIZE;i++)
// 	{
// 		nearmapylookup[i] = &tilemap[0][0]+MAPSIZE*i;
// 		farmapylookup[i] = i*64;
// 	}
// 
// 	for (i=0;i<PORTTILESHIGH;i++)
// 		uwidthtable[i] = UPDATEWIDE*i;
// 
// 	blockstart = &blockstarts[0];
// 	for (y=0;y<UPDATEHIGH;y++)
// 		for (x=0;x<UPDATEWIDE;x++)
// 			*blockstart++ = SCREENWIDTH*16*y+x*TILEWIDTH;
// 
// 	updateptr = &update[0];
// 
// 	bufferofs = 0;
// 	displayofs = 0;
// 	ReadConfig ();
// 
// 
// //
// // HOLDING DOWN 'M' KEY?
// //
// #ifndef SPEARDEMO
// 	if (Keyboard[sc_M])
// 	  DoJukebox();
// 	else
// #endif
// //
// // draw intro screen stuff
// //
// 	if (!virtualreality)
// 		IntroScreen ();
// 
// //
// // load in and lock down some basic chunks
// //
// 
// 	CA_CacheGrChunk(STARTFONT);
// 	MM_SetLock (&grsegs[STARTFONT],true);
// 
// 	LoadLatchMem ();
// 	BuildTables ();          // trig tables
// 	SetupWalls ();
// 
// #if 0
// {
// int temp,i;
// temp = viewsize;
// 	profilehandle = open("SCALERS.TXT", O_CREAT | O_WRONLY | O_TEXT);
// for (i=1;i<20;i++)
// 	NewViewSize(i);
// viewsize = temp;
// close(profilehandle);
// }
// #endif
// 
// 	NewViewSize (viewsize);
// 
// 
// //
// // initialize variables
// //
// 	InitRedShifts ();
// 	if (!virtualreality)
// 		FinishSignon();
// 
// 	displayofs = PAGE1START;
// 	bufferofs = PAGE2START;
// 
// 	if (virtualreality)
// 	{
// 		NoWait = true;
// 		geninterrupt(0x60);
// 	}
// }
// 
// //===========================================================================
// 
// /*
// ==========================
// =
// = SetViewSize
// =
// ==========================
// */
// 
// boolean SetViewSize (unsigned width, unsigned height)
// {
// 	viewwidth = width&~15;                  // must be divisable by 16
// 	viewheight = height&~1;                 // must be even
// 	centerx = viewwidth/2-1;
// 	shootdelta = viewwidth/10;
// 	screenofs = ((200-STATUSLINES-viewheight)/2*SCREENWIDTH+(320-viewwidth)/8);
// 
// //
// // calculate trace angles and projection constants
// //
// 	CalcProjection (FOCALLENGTH);
// 
// //
// // build all needed compiled scalers
// //
// //	MM_BombOnError (false);
// 	SetupScaling (viewwidth*1.5);
// #if 0
// 	MM_BombOnError (true);
// 	if (mmerror)
// 	{
// 		Quit ("Can't build scalers!");
// 		mmerror = false;
// 		return false;
// 	}
// #endif
// 	return true;
// }
// 
// 
// void ShowViewSize (int width)
// {
// 	int     oldwidth,oldheight;
// 
// 	oldwidth = viewwidth;
// 	oldheight = viewheight;
// 
// 	viewwidth = width*16;
// 	viewheight = width*16*HEIGHTRATIO;
// 	DrawPlayBorder ();
// 
// 	viewheight = oldheight;
// 	viewwidth = oldwidth;
// }
// 
// 
// void NewViewSize (int width)
// {
// 	CA_UpLevel ();
// 	MM_SortMem ();
// 	viewsize = width;
// 	SetViewSize (width*16,width*16*HEIGHTRATIO);
// 	CA_DownLevel ();
// }
// 
// 
// 
// //===========================================================================
// 
// /*
// ==========================
// =
// = Quit
// =
// ==========================
// */
// 
// void Quit (char *error)
// {
// 	unsigned        finscreen;
// 	memptr	screen;
// 
// 	if (virtualreality)
// 		geninterrupt(0x61);
// 
// 	ClearMemory ();
// 	if (!*error)
// 	{
// 	 #ifndef JAPAN
// 	 CA_CacheGrChunk (ORDERSCREEN);
// 	 screen = grsegs[ORDERSCREEN];
// 	 #endif
// 	 WriteConfig ();
// 	}
// 	else
// 	{
// 	 CA_CacheGrChunk (ERRORSCREEN);
// 	 screen = grsegs[ERRORSCREEN];
// 	}
// 
// 	ShutdownId ();
// 
// 	if (error && *error)
// 	{
// 	  movedata ((unsigned)screen,7,0xb800,0,7*160);
// 	  gotoxy (10,4);
// 	  puts(error);
// 	  gotoxy (1,8);
// 	  exit(1);
// 	}
// 	else
// 	if (!error || !(*error))
// 	{
// 		clrscr();
// 		#ifndef JAPAN
// 		movedata ((unsigned)screen,7,0xb800,0,4000);
// 		gotoxy(1,24);
// 		#endif
// //asm	mov	bh,0
// //asm	mov	dh,23	// row
// //asm	mov	dl,0	// collumn
// //asm	mov ah,2
// //asm	int	0x10
// 	}
// 
// 	exit(0);
// }
// 
// //===========================================================================
// 
// 
// 
// /*
// =====================
// =
// = DemoLoop
// =
// =====================
// */
// 
// static  char *ParmStrings[] = {"baby","easy","normal","hard",""};
// 
// void    DemoLoop (void)
// {
// 	static int LastDemo;
// 	int     i,level;
// 	long nsize;
// 	memptr	nullblock;
// 
// //
// // check for launch from ted
// //
// 	if (tedlevel)
// 	{
// 		NoWait = true;
// 		NewGame(1,0);
// 
// 		for (i = 1;i < _argc;i++)
// 		{
// 			if ( (level = US_CheckParm(_argv[i],ParmStrings)) != -1)
// 			{
// 			 gamestate.difficulty=level;
// 			 break;
// 			}
// 		}
// 
// #ifndef SPEAR
// 		gamestate.episode = tedlevelnum/10;
// 		gamestate.mapon = tedlevelnum%10;
// #else
// 		gamestate.episode = 0;
// 		gamestate.mapon = tedlevelnum;
// #endif
// 		GameLoop();
// 		Quit (NULL);
// 	}
// 
// 
// //
// // main game cycle
// //
// 
// 
// //	nsize = (long)40*1024;
// //	MM_GetPtr(&nullblock,nsize);
// 
// #ifndef DEMOTEST
// 
// 	#ifndef UPLOAD
// 
// 		#ifndef GOODTIMES
// 		#ifndef SPEAR
// 		#ifndef JAPAN
// 		if (!NoWait)
// 			NonShareware();
// 		#endif
// 		#else
// 
// 			#ifndef GOODTIMES
// 			#ifndef SPEARDEMO
// 			CopyProtection();
// 			#endif
// 			#endif
// 
// 		#endif
// 		#endif
// 	#endif
// 
// 	StartCPMusic(INTROSONG);
// 
// #ifndef JAPAN
// 	if (!NoWait)
// 		PG13 ();
// #endif
// 
// #endif
// 
// 	while (1)
// 	{
// 		while (!NoWait)
// 		{
// //
// // title page
// //
// 			MM_SortMem ();
// #ifndef DEMOTEST
// 
// #ifdef SPEAR
// 			CA_CacheGrChunk (TITLEPALETTE);
// 
// 			CA_CacheGrChunk (TITLE1PIC);
// 			VWB_DrawPic (0,0,TITLE1PIC);
// 			UNCACHEGRCHUNK (TITLE1PIC);
// 
// 			CA_CacheGrChunk (TITLE2PIC);
// 			VWB_DrawPic (0,80,TITLE2PIC);
// 			UNCACHEGRCHUNK (TITLE2PIC);
// 			VW_UpdateScreen ();
// 			VL_FadeIn(0,255,grsegs[TITLEPALETTE],30);
// 
// 			UNCACHEGRCHUNK (TITLEPALETTE);
// #else
// 			CA_CacheScreen (TITLEPIC);
// 			VW_UpdateScreen ();
// 			VW_FadeIn();
// #endif
// 			if (IN_UserInput(TickBase*15))
// 				break;
// 			VW_FadeOut();
// //
// // credits page
// //
// 			CA_CacheScreen (CREDITSPIC);
// 			VW_UpdateScreen();
// 			VW_FadeIn ();
// 			if (IN_UserInput(TickBase*10))
// 				break;
// 			VW_FadeOut ();
// //
// // high scores
// //
// 			DrawHighScores ();
// 			VW_UpdateScreen ();
// 			VW_FadeIn ();
// 
// 			if (IN_UserInput(TickBase*10))
// 				break;
// #endif
// //
// // demo
// //
// 
// 			#ifndef SPEARDEMO
// 			PlayDemo (LastDemo++%4);
// 			#else
// 			PlayDemo (0);
// 			#endif
// 
// 			if (playstate == ex_abort)
// 				break;
// 			StartCPMusic(INTROSONG);
// 		}
// 
// 		VW_FadeOut ();
// 
// #ifndef SPEAR
// 		if (Keyboard[sc_Tab] && MS_CheckParm("goobers"))
// #else
// 		if (Keyboard[sc_Tab] && MS_CheckParm("debugmode"))
// #endif
// 			RecordDemo ();
// 		else
// 			US_ControlPanel (0);
// 
// 		if (startgame || loadedgame)
// 		{
// 			GameLoop ();
// 			VW_FadeOut();
// 			StartCPMusic(INTROSONG);
// 		}
// 	}
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// ==========================
// =
// = main
// =
// ==========================
// */
// 
// char    *nosprtxt[] = {"nospr",nil};
// 
// void main (void)
// {
// 	int     i;
// 
// 
// #ifdef BETA
// 	//
// 	// THIS IS FOR BETA ONLY!
// 	//
// 	struct dosdate_t d;
// 
// 	_dos_getdate(&d);
// 	if (d.year > YEAR ||
// 		(d.month >= MONTH && d.day >= DAY))
// 	{
// 	 printf("Sorry, BETA-TESTING is over. Thanks for you help.\n");
// 	 exit(1);
// 	}
// #endif
// 
// 	CheckForEpisodes();
// 
// 	Patch386 ();
// 
// 	InitGame ();
// 
// 	DemoLoop();
// 
// 	Quit("Demo loop exited???");
// }
// 
// 
