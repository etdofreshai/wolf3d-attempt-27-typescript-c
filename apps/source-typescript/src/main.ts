import "./styles.css";
import { BrowserWolf3DAudio } from "./platform/audio";
import { IndexedVgaSurface, SCREEN_HEIGHT, SCREEN_WIDTH } from "./platform/vga";
import {
  IN_ResetInputState,
  IN_SetKeyboardState,
} from "./WOLFSRC/ID_IN.C";
import {
  sc_0,
  sc_1,
  sc_2,
  sc_3,
  sc_4,
  sc_5,
  sc_6,
  sc_7,
  sc_8,
  sc_9,
  sc_A,
  sc_Alt,
  sc_B,
  sc_BackSpace,
  sc_C,
  sc_CapsLock,
  sc_Control,
  sc_D,
  sc_Delete,
  sc_DownArrow,
  sc_E,
  sc_End,
  sc_Enter,
  sc_Escape,
  sc_F,
  sc_F1,
  sc_F2,
  sc_F3,
  sc_F4,
  sc_F5,
  sc_F6,
  sc_F7,
  sc_F8,
  sc_F9,
  sc_F10,
  sc_F11,
  sc_F12,
  sc_G,
  sc_H,
  sc_Home,
  sc_I,
  sc_Insert,
  sc_J,
  sc_K,
  sc_L,
  sc_LeftArrow,
  sc_LShift,
  sc_M,
  sc_N,
  sc_O,
  sc_P,
  sc_PgDn,
  sc_PgUp,
  sc_Q,
  sc_R,
  sc_RightArrow,
  sc_RShift,
  sc_S,
  sc_Space,
  sc_T,
  sc_Tab,
  sc_U,
  sc_UpArrow,
  sc_V,
  sc_W,
  sc_X,
  sc_Y,
  sc_Z,
  type ScanCode,
} from "./WOLFSRC/ID_IN.H";
import {
  LatchDrawPic,
  LoadLatchMem,
  VWB_Bar,
  VWB_DrawPic,
  VWB_DrawPropString,
  VW_DrawPropString,
  VW_SetFontState,
  VW_UpdateScreen,
} from "./WOLFSRC/ID_VH.C";
import {
  currentPalette,
  displayofs,
  linewidth,
  videoPlanes,
  VL_ResetVideoState,
  VL_SetBufferOffset,
  VL_SetPalette,
  VL_SetScreen,
  VL_SetVGAPlaneMode,
} from "./WOLFSRC/ID_VL.C";
import {
  CA_CacheAudioChunk,
  CA_CacheGrChunk,
  CA_CacheScreen,
  CA_LoadAllSounds,
  CA_CacheMap,
  CA_Startup,
  grsegs,
} from "./WOLFSRC/ID_CA.C";
import { PM_Startup } from "./WOLFSRC/ID_PM.C";
import {
  SD_DebugState,
  SD_MusicOff,
  SD_MusicOn,
  SD_PlaySound,
  SD_ResetSoundState,
  SD_SetDigiDevice,
  SD_SetDigiPlaybackHook,
  SD_SetMusicMode,
  SD_SetSoundMode,
  SD_StartMusic,
  SD_Startup,
  STARTMUSIC,
  SDL_SetupDigi,
  SDL_t0Service,
} from "./WOLFSRC/ID_SD.C";
import {
  sdm_AdLib,
  sdm_Off,
  sdm_PC,
  sds_Off,
  sds_SoundBlaster,
  sds_SoundSource,
  smm_AdLib,
  smm_Off,
} from "./WOLFSRC/ID_SD.H";
import { US_InitRndT, US_RndT } from "./WOLFSRC/ID_US_A.ASM";
import { DOSMemory } from "./WOLFSRC/TS_DOS_MEMORY";
import {
  DrawAmmo,
  DrawFace,
  DrawHealth,
  DrawKeys,
  DrawLevel,
  DrawLives,
  DrawScore,
  DrawWeapon,
} from "./WOLFSRC/WL_AGENT.C";
import {
  CONTROLS_LUMP_END,
  CONTROLS_LUMP_START,
  CREDITSPIC,
  GETPSYCHEDPIC,
  HITWALLSND,
  L_GUYPIC,
  LATCHPICS_LUMP_END,
  LATCHPICS_LUMP_START,
  MAPSIZE,
  PAUSEDPIC,
  PG13PIC,
  STARTFONT,
  STARTTILE8,
  STATUSBARPIC,
  STRUCTPIC,
  TITLEPIC,
} from "./WOLFSRC/TS_WL6_ASSETS";
import {
  STRUCT_LAYOUTS,
  getSaveRecord,
  nearOffsetForRuntimeSymbol,
  serializeSaveGame,
} from "./WOLFSRC/TS_SAVE_LAYOUT";
import { Died, DrawPlayBorder, DrawPlayScreen, SetupGameLevel } from "./WOLFSRC/WL_GAME.C";
import { DebugKeys } from "./WOLFSRC/WL_DEBUG.C";
import { BJ_Breathe, CheckHighScore, DrawHighScores, LevelCompleted, Victory, Write, type LevelCompletedSummary, type VictorySummary } from "./WOLFSRC/WL_INTER.C";
import { CacheLayoutGraphics, EndText, HelpScreens, ShowArticle, type TextDrawOperation } from "./WOLFSRC/WL_TEXT.C";
import { Scores, US_CPrint, US_Print, US_RestoreWindow, US_SetWindowState, type HighScore } from "./WOLFSRC/ID_US_1.C";
import { parseDemo, type WolfDemo } from "./WOLFSRC/TS_DEMO";
import { HIGHSCORESPIC } from "./WOLFSRC/TS_WL6_ASSETS";
import { ThreeDRefresh } from "./WOLFSRC/WL_DRAW.C";
import * as WL_MAIN from "./WOLFSRC/WL_MAIN.C";
import {
  CheckForEpisodes,
  DrawLoadSaveScreen,
  DrawMainMenu,
  DrawMenuGun,
  DrawNewEpisode,
  DrawNewGame,
  DrawSoundMenu,
  DrawWindow,
  EpisodeSelect,
  LSItems,
  LSMenu,
  MainItems,
  MainMenu,
  NewEitems,
  NewEmenu,
  NewItems,
  NewMenu,
  SaveGameNames,
  SaveGamesAvail,
  Message,
  SetupControlPanel,
  ShootSnd,
  SndItems,
  SndMenu,
  endStrings,
} from "./WOLFSRC/WL_MENU.C";
import { CURGAME, ENDGAMESTR, STR_SIZE1, STR_SIZE2, STR_SIZE3 } from "./WOLFSRC/FOREIGN.H";
import {
  InitRedShifts,
  PlayLoop,
  PollKeyboardButtons,
  PollKeyboardMove,
  PollMouseButtons,
  PollMouseMove,
  SONGS,
} from "./WOLFSRC/WL_PLAY.C";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}

const canvas = document.createElement("canvas");
canvas.id = "screen";
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
canvas.tabIndex = 0;
root.appendChild(canvas);

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas 2D context unavailable.");
}
ctx.imageSmoothingEnabled = false;

const surface = new IndexedVgaSurface(ctx);
surface.clear(0);
surface.present();

interface Wl6RuntimeFiles {
  readonly MAPHEAD: Uint8Array;
  readonly GAMEMAPS: Uint8Array;
  readonly VGAHEAD: Uint8Array;
  readonly VGAGRAPH: Uint8Array;
  readonly VGADICT: Uint8Array;
  readonly VSWAP: Uint8Array;
  readonly AUDIOHED: Uint8Array;
  readonly AUDIOT: Uint8Array;
  readonly CONFIG: Uint8Array;
  readonly GAMEPAL: Uint8Array;
}

// Map browser KeyboardEvent.code (physical key) to the DOS XT scancode the engine
// expects. The active movement/action keys come from CONFIG.WL6 (dirscan/buttonscan via
// ReadConfig) — the retail config binds movement to WASD, not the arrow keys — so every
// physical key a config could reference must be translatable here, not just the arrows.
const KEY_SCAN_CODES: Readonly<Record<string, ScanCode>> = {
  ArrowUp: sc_UpArrow,
  ArrowDown: sc_DownArrow,
  ArrowLeft: sc_LeftArrow,
  ArrowRight: sc_RightArrow,
  ControlLeft: sc_Control,
  ControlRight: sc_Control,
  AltLeft: sc_Alt,
  AltRight: sc_Alt,
  ShiftLeft: sc_LShift,
  ShiftRight: sc_RShift,
  Space: sc_Space,
  Enter: sc_Enter,
  Escape: sc_Escape,
  Tab: sc_Tab,
  Backspace: sc_BackSpace,
  CapsLock: sc_CapsLock,
  Home: sc_Home,
  End: sc_End,
  PageUp: sc_PgUp,
  PageDown: sc_PgDn,
  Insert: sc_Insert,
  Delete: sc_Delete,
  Digit1: sc_1,
  Digit2: sc_2,
  Digit3: sc_3,
  Digit4: sc_4,
  Digit5: sc_5,
  Digit6: sc_6,
  Digit7: sc_7,
  Digit8: sc_8,
  Digit9: sc_9,
  Digit0: sc_0,
  KeyA: sc_A,
  KeyB: sc_B,
  KeyC: sc_C,
  KeyD: sc_D,
  KeyE: sc_E,
  KeyF: sc_F,
  KeyG: sc_G,
  KeyH: sc_H,
  KeyI: sc_I,
  KeyJ: sc_J,
  KeyK: sc_K,
  KeyL: sc_L,
  KeyM: sc_M,
  KeyN: sc_N,
  KeyO: sc_O,
  KeyP: sc_P,
  KeyQ: sc_Q,
  KeyR: sc_R,
  KeyS: sc_S,
  KeyT: sc_T,
  KeyU: sc_U,
  KeyV: sc_V,
  KeyW: sc_W,
  KeyX: sc_X,
  KeyY: sc_Y,
  KeyZ: sc_Z,
  F1: sc_F1,
  F2: sc_F2,
  F3: sc_F3,
  F4: sc_F4,
  F5: sc_F5,
  F6: sc_F6,
  F7: sc_F7,
  F8: sc_F8,
  F9: sc_F9,
  F10: sc_F10,
  F11: sc_F11,
  F12: sc_F12,
};

const GAMESTATE_MAPON_OFFSET = structFieldOffset("gametype", "mapon");
const GAMESTATE_EPISODE_OFFSET = structFieldOffset("gametype", "episode");
const GAMESTATE_DIFFICULTY_OFFSET = structFieldOffset("gametype", "difficulty");
const GAMESTATE_SCORE_OFFSET = structFieldOffset("gametype", "score");
const GAMESTATE_OLDSCORE_OFFSET = structFieldOffset("gametype", "oldscore");
const GAMESTATE_TIMECOUNT_OFFSET = structFieldOffset("gametype", "TimeCount"); // 32-bit level time (tics)
const GAMESTATE_LIVES_OFFSET = structFieldOffset("gametype", "lives");
const GAMESTATE_HEALTH_OFFSET = structFieldOffset("gametype", "health");
const GAMESTATE_AMMO_OFFSET = structFieldOffset("gametype", "ammo");
const GAMESTATE_KEYS_OFFSET = structFieldOffset("gametype", "keys");
const GAMESTATE_WEAPON_OFFSET = structFieldOffset("gametype", "weapon");
const GAMESTATE_BESTWEAPON_OFFSET = structFieldOffset("gametype", "bestweapon");
const GAMESTATE_CHOSENWEAPON_OFFSET = structFieldOffset("gametype", "chosenweapon");
const WP_CHAINGUN = 3; // the chaingun weapon index (the MLI cheat grants it)
const GAMESTATE_ATTACKFRAME_OFFSET = structFieldOffset("gametype", "attackframe");
const GAMESTATE_ATTACKCOUNT_OFFSET = structFieldOffset("gametype", "attackcount");
const GAMESTATE_WEAPONFRAME_OFFSET = structFieldOffset("gametype", "weaponframe");
const OBJ_ANGLE_OFFSET = structFieldOffset("objtype", "angle");
const OBJ_TILEX_OFFSET = structFieldOffset("objtype", "tilex");
const OBJ_TILEY_OFFSET = structFieldOffset("objtype", "tiley");
const OBJ_X_OFFSET = structFieldOffset("objtype", "x");
const OBJ_Y_OFFSET = structFieldOffset("objtype", "y");

// playstate exitcodes (WL_DEF.H exit_t) — mirrors WL_GAME.C GameLoop's switch.
const EX_COMPLETED = 1;
const EX_DIED = 2;
const EX_WARPED = 3;
const EX_VICTORIOUS = 6;
const EX_SECRETLEVEL = 9;
// After the secret elevator (map 9) the player returns to this map per episode.
const ELEVATOR_BACK_TO = [1, 1, 7, 3, 5, 3] as const;
const VGA_PAGE_BYTES = 80 * 208;
const TICK_MS = 1000 / 70;
const MAIN_NEW_GAME = 0;
const MAIN_SOUND = 1; // WL_MENU.C MainMenu[1] = "Sound" → CP_Sound
const MAIN_CONTROL = 2; // WL_MENU.C MainMenu[2] = "Control" → CP_Control
const MAIN_LOAD_GAME = 3;
const MAIN_CHANGE_VIEW = 5; // WL_MENU.C MainMenu[5] = "Change View" → CP_ChangeView
const MAIN_READ_THIS = 6; // WL_MENU.C MainMenu[6] = "Read This!" → CP_ReadThis → HelpScreens
const MIN_VIEWSIZE = 4, MAX_VIEWSIZE = 19; // WL_MENU.C CP_ChangeView clamps the size to 4..19
const MAIN_SAVE_GAME = 4;
const MAIN_VIEW_SCORES = 7;
const MAIN_BACK_TO_DEMO = 8;
const MAIN_QUIT = 9;
// localStorage key prefix for the 10 browser save slots; each holds {name, data:base64} JSON
// (data = the T3 byte-identical save image).
const SAVE_SLOT_PREFIX = "wolf3d-ts-save-";
const HIGHSCORE_STORAGE_KEY = "wolf3d-ts-highscores"; // persisted high-score table (WriteConfig analog)
const CONFIG_STORAGE_KEY = "wolf3d-ts-config"; // persisted sound/view/control settings (CONFIG.WL6 analog)
const SAVE_SLOT_COUNT = 10;
const saveSlotKey = (slot: number): string => `${SAVE_SLOT_PREFIX}${slot}`;
// Max typed characters for a new high-score name (kept short so it fits the NAME column + cursor).
const MAX_HIGHSCORE_NAME = 17;
// Max typed characters for a save-slot name (the DOS slot box fits ~30; keep a margin).
const MAX_SAVE_NAME = 30;
// Load/Save menu geometry (WL_MENU.C LSM_X/LSM_Y) — used to position the typed-name cursor.
const LSM_X = 85;
const LSM_Y = 55;
// Attract-mode demos: graphics chunks T_DEMO0..T_DEMO3 (139-142) — the same T2-bit-exact demos.
const T_DEMO0_CHUNK = 139;
const DEMO_COUNT = 4;
const DEMO_DIFFICULTY = 3; // gd_hard — the demos were recorded on Hard (matches WL_GAME PlayDemo)
const DEMOTICS = 4; // tics advanced per demo command (PollControlsMemory uses this for demoCommand)
const MENU_IDLE_MS = 15000; // main-menu idle time before the attract demos auto-start (title loop)
const MOVEGUN1SND = 5; // AUDIOWL6 — the menu-cursor move sound (WL_MENU.C DrawGun/DrawHalfStep)
const ESCPRESSEDSND = 39; // AUDIOWL6 — the menu back/cancel sound (WL_MENU.C, Escape out of a menu)
const ENDBONUS1SND = 42; // AUDIOWL6 sound index — the ticking sound during the bonus/ratio count-up
const ENDBONUS2SND = 43; // sound when a tally field finishes counting (WL_INTER.C LevelCompleted)
const NOBONUSSND = 47; // a ratio finished at 0%
const PERCENT100SND = 48; // a ratio finished at 100%
const PLAYERDEATHSND = 9; // AUDIOWL6 sound index — the player's death cry (WL_GAME.C Died)
const DEATH_SPIN_STEPS_PER_FRAME = 3; // rotation steps consumed per rendered frame during the death spin
const DEATH_REDFADE_FRAMES = 9; // frames spent fading the held death frame toward red before respawn/game-over
const FIZZLE_STEPS_PER_FRAME = 4096; // LFSR steps consumed per rendered frame during the level-start fizzle
const GETPSYCHED_MS = 700; // how long the "Get Psyched!" loading screen shows before a level fizzles in
const INTRO_PG13_MS = 3000;   // PG13 rating screen hold (DOS IN_UserInput(TickBase*7); any key skips)
const INTRO_TITLE_MS = 6000;  // title page hold before auto-advancing (DOS IN_UserInput(TickBase*15))
const INTRO_CREDITS_MS = 4000; // credits page hold (DOS IN_UserInput(TickBase*10)); then the menu opens
const INTRO_FADE_FRAMES = 12;  // frames to fade each attract screen in/out (DOS VW_FadeIn/VW_FadeOut)
// AdLib music mode services the timer at ~700 Hz; at the 70 Hz tic rate that's 10 t0 services/tic.
// SDL_t0Service's own dispatch then yields 700 Hz music, 140 Hz sound effects, and 70 Hz TimeCount.
const T0_SERVICES_PER_TIC = 10;
const PLAYLOOP_T0_SERVICES = 2; // t0 ticks PlayLoopStepMemory already services per tic (controls.tics*2)
const T0_MS = 1000 / 700; // one AdLib timer-ISR service (700 Hz) in milliseconds, for real-time pacing
const MENUSONG = 14; // WONDERIN_MUS — the control-panel / main-menu song (WL_MENU.C StartCPMusic)
const INTROSONG = 7; // NAZI_NOR — the attract/title song (WL_MAIN.C DemoLoop StartCPMusic(INTROSONG))
const ENDLEVEL_MUS = 16; // floor-completed intermission (WL_INTER.C LevelCompleted)
const ROSTER_MUS = 23; // high-score table (WL_MENU.C CheckHighScore)
const URAHERO_MUS = 24; // episode victory (WL_INTER.C Victory)

type RuntimeMode = "boot" | "menu" | "episode" | "difficulty" | "play" | "intermission" | "victory" | "highscores" | "demo" | "loadsave" | "dying" | "fizzle" | "getpsyched" | "intro" | "sound" | "confirm" | "endtext" | "message" | "changeview" | "control";

// WL_PLAY.C CheckKeys cheat messages (FOREIGN.H STR_CHEATER1..5 / the B-A-T Commander Keen string).
const CHEATER_MESSAGE = "You now have 100% Health,\n99 Ammo and both Keys!\n\nNote that you have basically\neliminated your chances of\ngetting a high score!";
const KEEN_MESSAGE = "Commander Keen is also\navailable from Apogee, but\nthen, you already know\nthat - right, Cheatmeister?!";

// In-progress level-start dissolve (ID_VH.C FizzleFade): reveal `target` into the surface in the
// 17-bit LFSR pixel order over several frames.
interface FizzleAnim {
  readonly target: Uint8Array; // the fully-rendered first frame (deplanarized indices)
  rndval: number;              // FizzleFade LFSR state (seed 1, poly 0x12000)
}

// In-progress death animation (WL_GAME.C Died): spin the view toward the killer, then fade to red.
interface DyingAnim {
  readonly summary: ReturnType<typeof Died>;
  index: number;                 // next rotation step to apply
  phase: "spin" | "redfade";
  redStep: number;               // 0..DEATH_REDFADE_FRAMES
}

// The 10-slot Load/Save screen state. `action` = which screen; `entryName` is non-null while the
// player is typing a name for the slot being saved.
interface LoadSaveState { action: "load" | "save"; entryName: string | null; fromPlay: boolean; }

// Attract-mode demo playback state: the parsed demo + which command/demo we're on.
interface DemoState { demo: WolfDemo; index: number; demoIndex: number; }

// The values currently displayed on the intermission screen (counting up during the animation).
interface IntermissionShown { bonus: number; kill: number; secret: number; treasure: number; }
interface IntermissionAnim { summary: LevelCompletedSummary; stage: number; shown: IntermissionShown; soundCounter: number; }
// The victory screen's averages, counting up during its animation.
interface VictoryShown { kill: number; secret: number; treasure: number; }
interface VictoryAnim { summary: VictorySummary; stage: number; shown: VictoryShown; soundCounter: number; }
type MenuInfo = { curpos: number; amount: number };
type MenuItem = { active: number };

class BrowserWolf3DRuntime {
  private readonly dgroup = new DOSMemory(0x10000);
  private readonly areaconnect = new Uint8Array(37 * 37);
  private readonly audio = new BrowserWolf3DAudio();
  private readonly pressedScans = new Set<ScanCode>();
  private plane0 = new Uint16Array(MAPSIZE * MAPSIZE);
  private plane1 = new Uint16Array(MAPSIZE * MAPSIZE);
  private statusBar: Uint8Array | null = null;
  private pictable: Uint8Array | null = null;
  private menuChunks: Array<Uint8Array | null> = [];
  private latchChunks: Array<Uint8Array | null> = [];
  private levelEndChunks: Array<Uint8Array | null> = [];
  private highScoreChunks: Array<Uint8Array | null> = [];
  // Raw AUDIOHED/AUDIOT kept for caching per-level IMF music chunks (CA_CacheAudioChunk).
  private audiohed: Uint8Array | null = null;
  private audiot: Uint8Array | null = null;
  private currentSong = -1; // music chunk currently playing (-1 = none), to avoid restarting it
  // Damage (red) / bonus (gold) palette-shift tables, built from gamepal at boot (InitRedShifts).
  private shiftTables: ReturnType<typeof InitRedShifts> | null = null;
  // Shift level active for the frame being rendered: red 1..NUMREDSHIFTS, white 1..NUMWHITESHIFTS.
  private paletteShift: { red: number; white: number } = { red: 0, white: 0 };
  // True while the game is paused (WL_PLAY.C CheckKeys Paused): PAUSEDPIC shown, tics frozen.
  private paused = false;
  // Non-null while the death spin+redfade animation is playing (mode === "dying").
  private dyingAnim: DyingAnim | null = null;
  // Non-null while the level-start fizzle dissolve is playing (mode === "fizzle").
  private fizzleAnim: FizzleAnim | null = null;
  // Mouse-look (WL_PLAY.C PollMouseMove/PollMouseButtons), active only while the pointer is locked.
  private pointerLocked = false;
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private mouseButtons = 0; // bit0 left, bit1 right, bit2 middle (PollMouseButtons order)
  // >= 0 while the player is typing a name for a newly-earned high score (the row index).
  private highScoreEntryIndex = -1;
  private highScoreEntryName = "";
  // Active while the floor-completed bonus/ratio count-up is animating; null = static/done.
  private intermissionAnim: IntermissionAnim | null = null;
  // Active while the victory-screen averages are counting up; null = static/done.
  private victoryAnim: VictoryAnim | null = null;
  // Active while the 10-slot Load/Save screen is open; null otherwise.
  private loadSaveState: LoadSaveState | null = null;
  // Active while an attract-mode demo is playing back; null otherwise.
  private demoState: DemoState | null = null;
  private lastDemo = 0; // session-persistent attract demo index (WL_MAIN.C DemoLoop LastDemo++%4)
  private mouseEnabled = true; // WL_MENU.C mouseenabled (default MousePresent); gates mouse-look polling
  private menuFromPlay = false; // an options menu opened in-game (F-key) returns to play, not the menu
  private controlCursor = 0; // cursor row in the Control menu
  private debugOk = false; // WL_PLAY.C DebugOk: TAB debug keys enabled (DOS: 'goobers' parm; here ?debug)
  // Timestamp (performance.now) of the last user input; the menu auto-starts demos when idle.
  private lastInputTime = 0;
  private mode: RuntimeMode = "boot";
  private hasGame = false;
  private selectedEpisode = 0;
  private lastFrameTime = 0;
  private tickAccumulator = 0;
  private t0Accumulator = 0; // real-time accumulator (ms) for 700 Hz AdLib timer servicing outside "play"
  private frames = 0;
  // Pending Y/N confirm dialog (WL_MENU.C Confirm) callbacks, set while mode === "confirm".
  private confirmOnYes: (() => void) | null = null;
  private confirmOnNo: (() => void) | null = null;
  // Pending any-key message overlay (WL_MENU.C Message + IN_Ack) callback, set while mode === "message".
  private messageOnDone: (() => void) | null = null;
  // Change View (WL_MENU.C CP_ChangeView): the candidate + pre-edit view size and where to return.
  private changeViewSize = 0;
  private changeViewOriginal = 0;
  private changeViewFromPlay = false;
  // Article viewer (WL_TEXT.C ShowArticle) state: the article text, current page, page count, and
  // what to do when the last page is acknowledged (high scores after an ending, menu after help).
  private articleText = "";
  private articlePage = 0;
  private articleTotalPages = 0;
  private articleOnDone: (() => void) | null = null;
  // "Get Psyched!" loading screen (WL_INTER.C PreloadGraphics) state: deadline + how the level resumes.
  private getPsychedDeadline = 0;
  // Pre-menu attract intro (WL_MAIN.C DemoLoop: PG13 -> title -> credits) state, with palette fades.
  private introStage = 0;
  private introDeadline = 0;
  private introFadeStep = 0;
  private introFadeDir: "in" | "hold" | "out" = "in";
  private introScreenTag = "PG13";

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly surface: IndexedVgaSurface,
  ) {}

  async start(): Promise<void> {
    const files = await loadWl6RuntimeFiles();
    CA_Startup(files);
    const pictable = requireGraphicChunk(STRUCTPIC);
    const statusBar = requireGraphicChunk(STATUSBARPIC);
    const menuChunks = cacheMenuGraphics();
    const latchChunks = cacheLatchGraphics();
    const levelEndChunks = cacheLevelEndGraphics();
    const highScoreChunks = cacheHighScoreGraphics();

    this.pictable = pictable;
    this.statusBar = statusBar;
    this.menuChunks = menuChunks;
    this.latchChunks = latchChunks;
    this.levelEndChunks = levelEndChunks;
    this.highScoreChunks = highScoreChunks;
    this.installInput();
    this.areaconnect.fill(0);
    WL_MAIN.gamepal.set(readGamePaletteObject(files.GAMEPAL));
    // Precompute the damage (red) and bonus (gold/"white") palette-shift tables from gamepal,
    // exactly as WL_PLAY.C InitRedShifts does. UpdatePaletteShiftsMemory reports the active
    // shift level each tic; renderFrame applies the matching table so getting hit flashes red
    // and pickups flash gold (see applyPaletteShift).
    this.shiftTables = InitRedShifts(WL_MAIN.gamepal);

    VL_ResetVideoState();
    VL_SetVGAPlaneMode();
    VL_SetPalette(WL_MAIN.gamepal);
    IN_ResetInputState();
    US_InitRndT(false);
    // Emulate an installed AdLib card so SD_SetSoundMode(sdm_AdLib) takes effect; the OPL2
    // emulator (platform/opl2.ts) synthesizes the resulting register stream in the browser.
    // (SD_ResetSoundState clears SD_Started, so SD_Startup must follow it.)
    SD_ResetSoundState({ AdLibPresent: true, SoundBlasterPresent: true });
    SD_Startup();
    SD_SetSoundMode(sdm_AdLib);
    SD_SetMusicMode(smm_AdLib); // enable AdLib (IMF) background music; serviced via SDL_t0Service
    this.audiohed = files.AUDIOHED;
    this.audiot = files.AUDIOT;
    CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
    PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
    // Enable digitized (Sound Blaster) sound effects: build DigiList from VSWAP, map the sounds
    // that have digitized versions, switch the digi device on, and route playback to Web Audio.
    // Sounds without a digi mapping still play through the AdLib FM path.
    SDL_SetupDigi();
    WL_MAIN.InitDigiMap();
    SD_SetDigiDevice(sds_SoundBlaster);
    SD_SetDigiPlaybackHook((pcm) => this.audio.playDigi(pcm));
    CheckForEpisodes({ files: ["WOLF3D.WL6"] });
    const config = WL_MAIN.ReadConfig(files.CONFIG);
    this.loadHighScores(); // restore any locally-saved high scores over the shipped defaults
    WL_MAIN.BuildTables();
    WL_MAIN.SetupWalls();
    WL_MAIN.NewViewSize(config.viewsize);
    SD_SetSoundMode(sdm_AdLib);
    this.loadConfig(); // restore persisted sound/view/mouse settings over the CONFIG.WL6 defaults
    this.debugOk = debugRequested(); // ?debug enables the TAB debug keys (DOS 'goobers' parm analog)

    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
    // WL_MAIN.C DemoLoop shows the attract intro (PG13 → title → credits) before the control panel;
    // the port used to boot straight to the menu. Any key skips the intro to the main menu.
    // `?nointro` boots straight to the menu (deterministic for the headless browser-smoke gate).
    if (skipIntroRequested()) {
      this.showMainMenu();
    } else {
      this.startIntro();
    }
    requestAnimationFrame(this.tick);
  }

  // Begin the attract sequence at boot (WL_MAIN.C DemoLoop: StartCPMusic(INTROSONG); PG13() once; then
  // the infinite while(1) rotation). PG13 shows once, then the loop is Title → Credits → High Scores →
  // Demo → Title → … (see advanceIntro + stepDemo). Any keypress during any stage breaks out to the menu.
  private startIntro(): void {
    this.mode = "intro";
    this.introStage = 0;
    this.lastFrameTime = 0;
    this.t0Accumulator = 0;
    this.playSong(INTROSONG);
    this.drawIntroStage(0); // draw the buffer; the fade loop presents it as the palette ramps up
    this.introFadeDir = "in";
    this.introFadeStep = 0;
    this.introDeadline = performance.now() + INTRO_PG13_MS;
  }

  // Re-enter the attract rotation at the TITLE page — DOS DemoLoop's while(1) top, which shows PG13
  // only once before the loop (WL_MAIN.C:1480-1486). Used after a demo finishes and when the menu sits
  // idle, so the attract keeps cycling Title → Credits → High Scores → Demo instead of chaining
  // demo→demo or stalling on the menu.
  private enterAttract(): void {
    this.mode = "intro";
    this.introStage = 1;
    this.lastFrameTime = 0;
    this.t0Accumulator = 0;
    this.playSong(INTROSONG); // DemoLoop restarts INTROSONG after each demo (WL_MAIN.C:1549)
    this.drawIntroStage(1);
    this.introFadeDir = "in";
    this.introFadeStep = 0;
    this.introDeadline = performance.now() + INTRO_TITLE_MS;
  }

  // Draw one attract-intro stage into the buffer (0 = PG13, 1 = title, 2 = credits). The palette is
  // left to advanceIntro's fade loop, which presents each frame.
  private drawIntroStage(stage: number): void {
    this.toMenuPage(); // page-0-align (Quit→startIntro enters from a page-flipped play frame)
    if (stage === 0) {
      // WL_INTER.C PG13: fill the screen with bg color 0x82, draw the PG13 pic at (216,110).
      VWB_Bar(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0x82);
      const source = CA_CacheGrChunk(PG13PIC) ?? undefined;
      VWB_DrawPic(216, 110, PG13PIC, { source, pictable: this.pictable ?? undefined });
      this.introScreenTag = "PG13";
    } else if (stage === 1) {
      CA_CacheScreen(TITLEPIC); // unpack the full-screen title art into the video buffer
      this.introScreenTag = "TITLE";
    } else if (stage === 2) {
      CA_CacheScreen(CREDITSPIC); // full-screen credits art
      this.introScreenTag = "CREDITS";
    } else {
      // stage 3: high scores — a first-class screen in the DOS attract rotation (WL_MAIN.C DemoLoop
      // draws DrawHighScores between Credits and the demo). Keep INTROSONG playing, no entry cursor.
      this.drawHighScoreTable(-1);
      this.introScreenTag = "HIGHSCORES";
    }
  }

  // Advance the attract intro each frame, bracketing every screen with a palette fade-in/out like
  // DOS DemoLoop's VW_FadeIn()/VW_FadeOut(): fade the screen in, hold for its duration, fade out,
  // then draw the next stage (PG13 → title → credits → main menu).
  private advanceIntro(frameTime: number): void {
    const gamepal = WL_MAIN.gamepal;
    if (this.introFadeDir === "in") {
      this.applyFadePalette(this.introFadeStep / INTRO_FADE_FRAMES);
      if (this.introFadeStep++ >= INTRO_FADE_FRAMES) {
        this.introFadeDir = "hold";
        VL_SetPalette(gamepal);
      }
    } else if (this.introFadeDir === "hold") {
      if (frameTime >= this.introDeadline) {
        this.introFadeDir = "out";
        this.introFadeStep = 0;
      }
    } else { // "out"
      this.applyFadePalette(1 - this.introFadeStep / INTRO_FADE_FRAMES);
      if (this.introFadeStep++ >= INTRO_FADE_FRAMES) {
        this.introStage += 1;
        if (this.introStage === 1) {
          this.drawIntroStage(1);
          this.introDeadline = frameTime + INTRO_TITLE_MS;
        } else if (this.introStage === 2) {
          this.drawIntroStage(2);
          this.introDeadline = frameTime + INTRO_CREDITS_MS;
        } else if (this.introStage === 3) {
          this.drawIntroStage(3); // high scores (DemoLoop's Title → Credits → High Scores → Demo)
          this.introDeadline = frameTime + INTRO_CREDITS_MS;
        } else {
          this.startDemo(this.lastDemo); // after high scores, play the next attract demo
          return;
        }
        this.introFadeDir = "in";
        this.introFadeStep = 0;
      }
    }
    this.present(this.introScreenTag);
  }

  // Set the active palette to `gamepal` scaled by t (0 = black, 1 = full) for a VW_Fade-style ramp.
  private applyFadePalette(t: number): void {
    const gamepal = WL_MAIN.gamepal;
    const clamped = Math.max(0, Math.min(1, t));
    const faded = new Uint8Array(gamepal.length);
    for (let i = 0; i < gamepal.length; i++) faded[i] = Math.round(gamepal[i] * clamped);
    VL_SetPalette(faded);
  }

  // Advance the 700 Hz AdLib timer ISR (SDL_t0Service) by real elapsed wall-clock time. The "play"
  // loop already paces the timer through its own 70 Hz tic accumulator; this keeps music/SFX at the
  // correct tempo on every other screen (menu, intermission, victory, fizzle, death) on displays
  // that aren't 70 Hz. Capped so a long stall can't spiral into thousands of catch-up services.
  private serviceAudioTimer(frameTime: number): void {
    if (!this.lastFrameTime) {
      this.lastFrameTime = frameTime;
    }
    this.t0Accumulator += Math.min(250, frameTime - this.lastFrameTime);
    this.lastFrameTime = frameTime;
    let guard = 0;
    while (this.t0Accumulator >= T0_MS && guard < 256) {
      SDL_t0Service();
      this.t0Accumulator -= T0_MS;
      guard++;
    }
  }

  private readonly tick = (frameTime: number): void => {
    if (this.mode === "demo") {
      // Attract-mode demo playback runs game tics from recorded input (PlayLoopStepMemory does
      // its own t0 sound servicing); just drain the resulting AdLib writes to the OPL2 emulator.
      this.stepDemo(frameTime);
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode === "dying") {
      // The death spin+redfade animation (WL_GAME.C Died) — no game tics run; advanceDying drives
      // the rotation/fade and resolves into respawn or game over. The AdLib timer keeps running so
      // music continues underneath the animation, as it does under DOS' timer ISR.
      this.advanceDying();
      this.serviceAudioTimer(frameTime);
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode === "fizzle") {
      // The level-start dissolve (ID_VH.C FizzleFade) — no tics run until the screen is revealed.
      this.advanceFizzle();
      this.serviceAudioTimer(frameTime);
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode === "getpsyched") {
      // The "Get Psyched!" loading screen (WL_INTER.C PreloadGraphics) — holds briefly with a filling
      // bar, then fizzles the level in. The AdLib timer keeps the level song playing underneath.
      this.advanceGetPsyched(frameTime);
      this.serviceAudioTimer(frameTime);
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode === "intro") {
      // Pre-menu attract intro (WL_MAIN.C DemoLoop): PG13 → title → credits, each holding a few
      // seconds, with the INTROSONG playing. advanceIntro moves to the menu when the rotation ends.
      this.advanceIntro(frameTime);
      this.serviceAudioTimer(frameTime);
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode !== "play") {
      // Service the sound timer in real time so AdLib menu/intermission music plays at its true
      // 700 Hz tempo regardless of display refresh rate, then hand the resulting register writes to
      // the OPL2 emulator (no game tics run outside "play").
      this.serviceAudioTimer(frameTime);
      // Drive the bonus/ratio count-up on the intermission + victory screens.
      if (this.mode === "intermission" && this.intermissionAnim && this.intermissionAnim.stage <= 3) {
        this.advanceIntermission();
      } else if (this.mode === "victory" && this.victoryAnim && this.victoryAnim.stage <= 2) {
        this.advanceVictory();
      }
      // WL_INTER.C LevelCompleted interleaves BJ_Breathe() through the floor-completed intermission
      // so BJ alternates L_GUYPIC/L_GUY2PIC (~every 35 tics). serviceAudioTimer advances TimeCount.
      // (The victory screen shows the static L_BJWINSPIC and never breathes.)
      if (this.mode === "intermission") {
        this.advanceBJBreathe();
      }
      // Attract mode: after the main menu sits idle, re-enter the full attract rotation (Title →
      // Credits → High Scores → Demo), not straight into a demo — closer to DOS than jumping to PlayDemo.
      if (this.mode === "menu" && frameTime - this.lastInputTime > MENU_IDLE_MS) {
        this.enterAttract();
      }
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    // Paused (WL_PLAY.C CheckKeys): freeze tics, sound, and rendering — PAUSEDPIC stays on screen
    // until any key resumes (handled in the keydown handler).
    if (this.paused) {
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }

    if (!this.lastFrameTime) {
      this.lastFrameTime = frameTime;
    }
    this.tickAccumulator += Math.min(250, frameTime - this.lastFrameTime);
    this.lastFrameTime = frameTime;

    let stepped = false;
    let guard = 0;
    let playstate = 0;
    while (this.tickAccumulator >= TICK_MS && guard < 5) {
      playstate = this.stepOneTic();
      this.tickAccumulator -= TICK_MS;
      stepped = true;
      guard++;
      if (playstate) {
        break;
      }
    }

    if (stepped) {
      this.renderFrame();
    }

    if (playstate) {
      this.handlePlaystate(playstate);
    }

    // Feed this frame's AdLib register writes (from stepOneTic's SDL_t0Service calls) to the
    // OPL2 emulator, which the audio ScriptProcessor renders continuously.
    this.audio.serviceAdLib();

    requestAnimationFrame(this.tick);
  };

  private showMainMenu(): void {
    this.mode = "menu";
    this.toMenuPage(); // page-0-align so the menu isn't shifted by a leftover play screenofs (Change View)
    VL_SetPalette(WL_MAIN.gamepal); // restore full palette (the intro fade-out / a game may have dimmed it)
    this.lastInputTime = performance.now(); // restart the attract-demo idle timer
    this.playSong(MENUSONG); // the menu's AdLib song (WL_MENU.C StartCPMusic(MENUSONG))
    SetupControlPanel({ skipResourceCache: true, skipLoadAllSounds: true });
    MainMenu[MAIN_SAVE_GAME].active = this.hasGame ? 1 : 0;
    MainMenu[MAIN_LOAD_GAME].active = this.hasSavedGame() ? 1 : 0;
    this.ensureActiveCursor(MainItems, MainMenu);
    DrawMainMenu(this.menuPicOptions());
    DrawMenuGun(MainItems, this.menuPicOptions());
    VW_UpdateScreen();
    this.present(this.hasGame ? "MENU_INGAME" : "MENU");
  }

  private showEpisodeMenu(): void {
    this.mode = "episode";
    this.ensureActiveCursor(NewEitems, NewEmenu);
    DrawNewEpisode({ ...this.menuPicOptions(), skipWaitKeyUp: true });
    DrawMenuGun(NewEitems, this.menuPicOptions());
    VW_UpdateScreen();
    this.present("MENU_EPISODE");
  }

  private showDifficultyMenu(): void {
    this.mode = "difficulty";
    this.ensureActiveCursor(NewItems, NewMenu);
    DrawNewGame({ ...this.menuPicOptions(), skipWaitKeyUp: true });
    DrawMenuGun(NewItems, this.menuPicOptions());
    VW_UpdateScreen();
    this.present("MENU_DIFFICULTY");
  }

  // The WL_MENU.C Sound options menu (MainMenu[1] → CP_Sound): three sections — sound effects
  // (None/PC/AdLib), digitized (None/Disney/SoundBlaster), and music (None/AdLib) — with the gun
  // cursor on the current selection. DrawSoundMenu renders the windows + on/off marks from the live
  // SoundMode/DigiMode/MusicMode. The browser app drives it directly instead of CP_Sound's blocking
  // loop; selecting an item applies that mode (mirroring CP_Sound's per-item switch).
  private showSoundMenu(fromPlay = false): void {
    this.menuFromPlay = fromPlay; // one-time: don't reset this (or curpos) on every redraw
    SndItems.curpos = this.currentSoundCursor();
    this.mode = "sound";
    this.drawSoundMenu();
  }

  // Redraw the sound menu WITHOUT touching menuFromPlay or curpos (so arrow navigation can reach the
  // digitized/music rows and an in-game F4 still returns to the game on Esc).
  private drawSoundMenu(): void {
    this.toMenuPage();
    DrawSoundMenu(this.menuPicOptions());
    DrawMenuGun(SndItems, this.menuPicOptions());
    VW_UpdateScreen();
    this.present("MENU_SOUND");
  }

  // Return from an in-game options menu/screen to either the game (if opened with F-key during play)
  // or the main menu.
  private exitOptions(): void {
    if (this.menuFromPlay && this.hasGame) {
      this.menuFromPlay = false;
      this.returnToGame();
    } else {
      this.showMainMenu();
    }
  }

  // The SndItems cursor row that matches the currently-active mode in each section (so the menu
  // opens with the gun on the live setting). Defaults to the AdLib/music rows when uncertain.
  private currentSoundCursor(): number {
    const sound = SD_DebugState();
    if (sound.SoundMode === sdm_Off) return 0;
    if (sound.SoundMode === sdm_PC) return 1;
    return 2; // sdm_AdLib
  }

  private handleSoundMenuScan(scan: ScanCode): void {
    switch (scan) {
      case sc_UpArrow:
        if (this.moveCursor(SndItems, SndMenu, -1)) {
          this.drawSoundMenu();
        }
        return;
      case sc_DownArrow:
        if (this.moveCursor(SndItems, SndMenu, 1)) {
          this.drawSoundMenu();
        }
        return;
      case sc_Enter:
      case sc_Space:
      case sc_Control:
        this.applySoundSelection(SndItems.curpos);
        return;
      case sc_Escape:
        SD_PlaySound(ESCPRESSEDSND); // WL_MENU.C: Escape out of a menu plays ESCPRESSEDSND, not SHOOTSND
        this.audio.syncFromSoundState(true);
        this.exitOptions();
        return;
    }
  }

  // Apply the sound-menu item at `which`, mirroring WL_MENU.C CP_Sound's per-item switch: set the
  // effect/digitized/music device for that section, then redraw the menu and re-sync the audio.
  private applySoundSelection(which: number): void {
    switch (which) {
      case 0: SD_SetSoundMode(sdm_Off); break;
      case 1: SD_SetSoundMode(sdm_PC); break;
      case 2: SD_SetSoundMode(sdm_AdLib); break;
      case 5: SD_SetDigiDevice(sds_Off); break;
      case 6: SD_SetDigiDevice(sds_SoundSource); break;
      case 7: SD_SetDigiDevice(sds_SoundBlaster); break;
      case 10:
        SD_SetMusicMode(smm_Off);
        SD_MusicOff();          // release the OPL music voices so the last note doesn't sustain
        this.currentSong = -1;  // so re-enabling music restarts the song
        break;
      case 11:
        SD_SetMusicMode(smm_AdLib);
        this.currentSong = -1;
        this.playSong(MENUSONG); // CP_Sound restarts the menu song when music is turned back on
        break;
      default:
        return; // inactive separator row
    }
    ShootSnd();
    this.audio.syncFromSoundState(true);
    this.saveConfig(); // persist the new sound device selection (CONFIG.WL6 analog)
    this.drawSoundMenu(); // redraw with the new on/off marks, keeping the gun where it is
  }

  // Draw a Y/N confirm box over the current screen (WL_MENU.C Confirm → Message) and wait for the
  // answer. `onYes`/`onNo` run on Y / (N or Esc). The underlying screen must already be presented;
  // Message overlays the centered text box. Used for the "erase current game?" prompt etc.
  private showConfirm(text: string, onYes: () => void, onNo: () => void): void {
    VL_SetBufferOffset(displayPageBase(displayofs)); // overlay the box on the visible page (page-flips in-game)
    VL_SetScreen(displayPageBase(displayofs), 0);    // align displayofs so VW_UpdateScreen + present agree
    US_SetWindowState(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // fullscreen window so Message centers on screen
    Message(text, { font: this.menuChunks[STARTFONT + 1] ?? undefined });
    VW_UpdateScreen();
    this.confirmOnYes = onYes;
    this.confirmOnNo = onNo;
    this.mode = "confirm";
    this.present("CONFIRM");
  }

  private resolveConfirm(yes: boolean): void {
    const action = yes ? this.confirmOnYes : this.confirmOnNo;
    this.confirmOnYes = null;
    this.confirmOnNo = null;
    if (yes) {
      ShootSnd();
    }
    this.audio.syncFromSoundState(true);
    action?.();
  }

  // Draw a centered message box (WL_MENU.C Message) over the current screen and wait for any key
  // (IN_Ack), then run `onDone`. Used for the in-game cheat confirmation messages.
  private showMessage(text: string, onDone: () => void): void {
    VL_SetBufferOffset(displayPageBase(displayofs)); // overlay on the visible page (page-flips in-game)
    VL_SetScreen(displayPageBase(displayofs), 0);    // align displayofs so VW_UpdateScreen + present agree
    US_SetWindowState(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    Message(text, { font: this.menuChunks[STARTFONT + 1] ?? undefined });
    VW_UpdateScreen();
    this.messageOnDone = onDone;
    this.mode = "message";
    this.present("MESSAGE");
  }

  private resolveMessage(): void {
    const action = this.messageOnDone;
    this.messageOnDone = null;
    action?.();
  }

  // The WL_MENU.C Change View screen (CP_ChangeView): a live preview of the play border at the
  // candidate size with "Use arrows to size / ENTER to accept / ESC to cancel" below. Left/Down
  // shrink, Right/Up grow (clamped 4..19); ENTER commits, ESC restores the prior size. `fromPlay`
  // returns to the game vs the main menu.
  private showChangeView(fromPlay: boolean): void {
    this.changeViewFromPlay = fromPlay;
    this.changeViewOriginal = Math.trunc(WL_MAIN.viewwidth / 16);
    this.changeViewSize = this.changeViewOriginal;
    this.mode = "changeview";
    this.drawChangeView();
  }

  private drawChangeView(): void {
    this.toMenuPage(); // full-screen preview takeover, page-0-aligned
    WL_MAIN.NewViewSize(this.changeViewSize); // set the geometry, then draw the border at that size
    DrawPlayBorder();                          // bg + centered viewport border at the candidate size
    VWB_Bar(0, 160, SCREEN_WIDTH, 40, 0x7f);   // VIEWCOLOR panel for the size-adjustment text
    // US_CPrint centers on WindowX/WindowW and prints at the window PrintY, so set both via the
    // window record (US_SetWindowState alone doesn't move the print cursor).
    US_RestoreWindow({ x: 0, y: 161, w: SCREEN_WIDTH, h: 39, px: 0, py: 162 });
    VW_SetFontState({ fontnumber: 1, fontcolor: 0x13, backcolor: 0x7f }); // HIGHLIGHT on VIEWCOLOR
    US_CPrint(`${STR_SIZE1}\n`);
    US_CPrint(`${STR_SIZE2}\n`);
    US_CPrint(STR_SIZE3);
    this.present("CHANGEVIEW");
  }

  private handleChangeViewScan(scan: ScanCode): void {
    if (scan === sc_LeftArrow || scan === sc_DownArrow) {
      this.changeViewSize = Math.max(MIN_VIEWSIZE, this.changeViewSize - 1);
      SD_PlaySound(HITWALLSND);
      this.drawChangeView();
      return;
    }
    if (scan === sc_RightArrow || scan === sc_UpArrow) {
      this.changeViewSize = Math.min(MAX_VIEWSIZE, this.changeViewSize + 1);
      SD_PlaySound(HITWALLSND);
      this.drawChangeView();
      return;
    }
    if (scan === sc_Enter || scan === sc_Space || scan === sc_Control) {
      ShootSnd(); // WL_MENU.C: confirming a menu choice plays SHOOTSND
      WL_MAIN.NewViewSize(this.changeViewSize); // commit (already set, but be explicit)
      this.saveConfig();
      this.finishChangeView();
      return;
    }
    if (scan === sc_Escape) {
      SD_PlaySound(ESCPRESSEDSND); // WL_MENU.C: backing out of a menu plays ESCPRESSEDSND
      WL_MAIN.NewViewSize(this.changeViewOriginal); // cancel → restore the prior size
      this.finishChangeView();
    }
  }

  private finishChangeView(): void {
    if (this.changeViewFromPlay && this.hasGame) {
      // Re-lay-out the status bar at the new view size, then resume play.
      DrawPlayScreen(this.dgroup, { pictable: this.pictable ?? undefined, statusBarSource: this.statusBar ?? undefined, statusBarWidth: SCREEN_WIDTH, statusBarHeight: 40 });
      this.returnToGame();
    } else {
      this.showMainMenu();
    }
  }

  // Control options (WL_MENU.C CP_Control). The DOS panel also rebinds keyboard/joystick, but those
  // are DOS-scancode/hardware specific; the browser-relevant settings are mouse-look enable and mouse
  // sensitivity (the rest of the bindings are fixed WASD+arrows). Up/Down pick a row; Left/Right (or
  // Enter) change it; ESC saves + exits. Reachable from the main menu (item 2) and in-game F6.
  private showControlMenu(fromPlay: boolean): void {
    this.menuFromPlay = fromPlay;
    this.controlCursor = 0;
    this.mode = "control";
    this.drawControlMenu();
  }

  private drawControlMenu(): void {
    this.toMenuPage(); // full-screen menu takeover, page-0-aligned
    VWB_Bar(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0x29); // darker red so the BKGDCOLOR window stands out
    DrawWindow(40, 50, 240, 100, 0x2d);               // bordered BKGDCOLOR window (fill + outline)
    US_RestoreWindow({ x: 56, y: 60, w: 208, h: 80, px: 56, py: 62 }); // text print area inside it
    VW_SetFontState({ fontnumber: 1, fontcolor: 0x13, backcolor: 0x2d }); // HIGHLIGHT on BKGDCOLOR
    US_Print("        Control\n\n");
    US_Print(`${this.controlCursor === 0 ? ">" : " "} Mouse:  ${this.mouseEnabled ? "Enabled " : "Disabled"}\n\n`);
    US_Print(`${this.controlCursor === 1 ? ">" : " "} Mouse Sensitivity: ${WL_MAIN.mouseadjustment}\n\n\n`);
    US_Print("  Up/Down pick, Left/Right\n  or Enter change, ESC exit");
    VW_UpdateScreen();
    this.present("MENU_CONTROL");
  }

  private handleControlMenuScan(scan: ScanCode): void {
    if (scan === sc_UpArrow) { this.controlCursor = Math.max(0, this.controlCursor - 1); this.drawControlMenu(); return; }
    if (scan === sc_DownArrow) { this.controlCursor = Math.min(1, this.controlCursor + 1); this.drawControlMenu(); return; }
    if (scan === sc_LeftArrow || scan === sc_RightArrow || scan === sc_Enter || scan === sc_Space || scan === sc_Control) {
      if (this.controlCursor === 0) {
        this.mouseEnabled = !this.mouseEnabled;
      } else {
        const delta = scan === sc_LeftArrow ? -1 : 1; // Enter/Right increase, wrapping 9→1
        let s = WL_MAIN.mouseadjustment + delta;
        if (s < 1) s = 9; if (s > 9) s = 1;
        WL_MAIN.SetMouseAdjustment(s);
      }
      ShootSnd();
      this.audio.syncFromSoundState(true);
      this.saveConfig();
      this.drawControlMenu();
      return;
    }
    if (scan === sc_Escape) {
      this.saveConfig();
      this.exitOptions();
    }
  }

  private menuPicOptions(): { chunks: readonly (Uint8Array | null)[]; pictable?: Uint8Array; inGame: boolean } {
    return {
      chunks: this.menuChunks,
      pictable: this.pictable ?? undefined,
      inGame: this.hasGame,
    };
  }

  private handleMenuScan(scan: ScanCode): void {
    switch (this.mode) {
      case "menu":
        this.handleMainMenuScan(scan);
        break;
      case "episode":
        this.handleEpisodeMenuScan(scan);
        break;
      case "difficulty":
        this.handleDifficultyMenuScan(scan);
        break;
      case "sound":
        this.handleSoundMenuScan(scan);
        break;
      case "changeview":
        this.handleChangeViewScan(scan);
        break;
      case "control":
        this.handleControlMenuScan(scan);
        break;
      case "endtext":
        this.handleEndTextScan(scan);
        break;
      case "intermission":
        this.handleIntermissionScan(scan);
        break;
      case "victory":
        this.handleVictoryScan(scan);
        break;
      case "highscores":
        this.handleHighScoresScan(scan);
        break;
      case "loadsave":
        this.handleLoadSaveScan(scan);
        break;
    }
  }

  private handleMainMenuScan(scan: ScanCode): void {
    switch (scan) {
      case sc_UpArrow:
        if (this.moveCursor(MainItems, MainMenu, -1)) {
          this.showMainMenu();
        }
        return;
      case sc_DownArrow:
        if (this.moveCursor(MainItems, MainMenu, 1)) {
          this.showMainMenu();
        }
        return;
      case sc_Enter:
      case sc_Space:
      case sc_Control:
        this.acceptMainMenuSelection();
        return;
      case sc_Escape:
        if (this.hasGame) {
          this.returnToGame();
        }
        return;
    }
  }

  private handleEpisodeMenuScan(scan: ScanCode): void {
    switch (scan) {
      case sc_UpArrow:
        if (this.moveCursor(NewEitems, NewEmenu, -1)) {
          this.showEpisodeMenu();
        }
        return;
      case sc_DownArrow:
        if (this.moveCursor(NewEitems, NewEmenu, 1)) {
          this.showEpisodeMenu();
        }
        return;
      case sc_Enter:
      case sc_Space:
      case sc_Control: {
        const episode = Math.trunc(NewEitems.curpos / 2);
        // WL_MENU.C CP_NewGame: a locked (shareware) episode can't be selected — NOWAYSND + a hint.
        // With WL6 data CheckForEpisodes unlocks all episodes, so this is faithful but never fires.
        if (!EpisodeSelect[episode]) {
          SD_PlaySound(6); // NOWAYSND
          this.audio.syncFromSoundState(true);
          this.showMessage(
            "Please select \"Read This!\"\nfrom the Options menu to\nfind out how to order this\nepisode from Apogee.",
            () => this.showEpisodeMenu(),
          );
          return;
        }
        this.selectedEpisode = episode;
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showDifficultyMenu();
        return;
      }
      case sc_Escape:
        SD_PlaySound(ESCPRESSEDSND); // WL_MENU.C: backing out of the Episode menu
        this.showMainMenu();
        return;
    }
  }

  private handleDifficultyMenuScan(scan: ScanCode): void {
    switch (scan) {
      case sc_UpArrow:
        if (this.moveCursor(NewItems, NewMenu, -1)) {
          this.showDifficultyMenu();
        }
        return;
      case sc_DownArrow:
        if (this.moveCursor(NewItems, NewMenu, 1)) {
          this.showDifficultyMenu();
        }
        return;
      case sc_Enter:
      case sc_Space:
      case sc_Control: {
        const episode = this.selectedEpisode;
        const difficulty = NewItems.curpos;
        // WL_MENU.C CP_NewGame: if a game is already in progress, confirm before erasing it.
        if (this.hasGame) {
          this.showConfirm(CURGAME, () => this.beginGame(episode, difficulty), () => this.showMainMenu());
        } else {
          ShootSnd();
          this.audio.syncFromSoundState(true);
          this.beginGame(episode, difficulty);
        }
        return;
      }
      case sc_Escape:
        SD_PlaySound(ESCPRESSEDSND); // WL_MENU.C: backing out of the Difficulty menu
        this.showEpisodeMenu();
        return;
    }
  }

  private acceptMainMenuSelection(): void {
    switch (MainItems.curpos) {
      case MAIN_NEW_GAME:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showEpisodeMenu();
        return;
      case MAIN_SOUND:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showSoundMenu();
        return;
      case MAIN_CONTROL:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showControlMenu(false);
        return;
      case MAIN_CHANGE_VIEW:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showChangeView(false);
        return;
      case MAIN_READ_THIS:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showReadThis();
        return;
      case MAIN_LOAD_GAME:
        if (this.hasSavedGame()) {
          ShootSnd();
          this.audio.syncFromSoundState(true);
          this.showLoadSaveScreen("load");
        }
        return;
      case MAIN_SAVE_GAME:
        if (this.hasGame) {
          ShootSnd();
          this.audio.syncFromSoundState(true);
          this.showLoadSaveScreen("save");
        }
        return;
      case MAIN_VIEW_SCORES:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showHighScores();
        return;
      case MAIN_BACK_TO_DEMO:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        if (this.hasGame) {
          this.returnToGame();
        } else {
          this.startDemo(this.lastDemo); // attract-mode demo loop (continues the LastDemo cycle)
        }
        return;
      case MAIN_QUIT: {
        // WL_MENU.C CP_Quit: a random end-string taunt + Y/N (selectEndString picks
        // endStrings[(US_RndT()&7)+(US_RndT()&1)]). DOS quits to DOS; the browser has nowhere to
        // exit to, so "Yes" returns to the attract title sequence instead.
        const index = Math.min((US_RndT() & 0x7) + (US_RndT() & 1), endStrings.length - 1);
        this.canvas.dataset.wolfsrcScreen = "MENU_QUIT";
        this.showConfirm(endStrings[index], () => {
          this.hasGame = false;
          this.startIntro();
        }, () => this.showMainMenu());
        return;
      }
    }
  }

  private beginGame(episode: number, difficulty: number): void {
    if (!this.pictable || !this.statusBar) {
      return;
    }
    WL_MAIN.NewGame(this.dgroup, difficulty, episode);
    this.hasGame = true;
    this.loadLevel();
  }

  // Set up + draw the level named by gamestate.episode/mapon and enter play mode.
  // Used both to start a new game and to (re)load a level on a playstate transition;
  // unlike beginGame it preserves gamestate (score/lives/weapons) — mirroring how
  // WL_GAME.C GameLoop re-runs SetupGameLevel between PlayLoop iterations.
  private loadLevel(showGetPsyched = true): void {
    if (!this.pictable || !this.statusBar) {
      return;
    }
    this.areaconnect.fill(0);
    const episode = this.gamestateU16(GAMESTATE_EPISODE_OFFSET);
    const mapIndex = episode * 10 + this.gamestateU16(GAMESTATE_MAPON_OFFSET);
    const [plane0, plane1] = CA_CacheMap(mapIndex);
    this.plane0 = new Uint16Array(plane0);
    this.plane1 = new Uint16Array(plane1);
    SetupGameLevel(this.plane0, this.plane1, this.dgroup, {
      areaconnect: this.areaconnect,
      loadedgame: false,
    });
    LoadLatchMem({ chunks: this.latchChunks, pictable: this.pictable });
    DrawPlayScreen(this.dgroup, {
      pictable: this.pictable,
      statusBarSource: this.statusBar,
      statusBarWidth: SCREEN_WIDTH,
      statusBarHeight: 40,
    });
    VL_SetPalette(WL_MAIN.gamepal);
    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
    this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
    this.mode = "play";
    this.lastFrameTime = 0;
    this.tickAccumulator = 0;
    this.paletteShift = { red: 0, white: 0 }; // no leftover damage tint on the fresh level
    this.startLevelMusic();
    // WL_GAME.C GameLoop: `if (!died) PreloadGraphics()` — show the "Get Psyched!" loading screen on
    // a fresh level start, but NOT on a death-respawn (the caller passes showGetPsyched=false there).
    // Then the first frame is fizzled in. In DOS the bar tracks PM_Preload; assets are already in
    // memory here, so it fills over a short fixed hold instead of a black gap between levels.
    if (showGetPsyched) {
      this.getPsychedDeadline = performance.now() + GETPSYCHED_MS;
      this.drawGetPsyched(0);
      this.mode = "getpsyched";
      this.lastFrameTime = 0;
      return;
    }
    // Render the first frame and dissolve it in (WL_GAME.C fizzles the view in on level start).
    this.renderFrame();
    this.beginFizzleIn();
  }

  // Draw the WL_INTER.C "Get Psyched!" loading screen: a gray play area with the GETPSYCHEDPIC bar
  // graphic and a red progress bar (PreloadUpdate geometry). The status bar drawn by DrawPlayScreen
  // stays at the bottom. `progress` is 0..1 of the loading bar fill.
  private drawGetPsyched(progress: number): void {
    VL_SetBufferOffset(0);
    VWB_Bar(0, 0, SCREEN_WIDTH, 200 - 40, 127); // clear the play view (STATUSLINES=40) to bg color 127
    LatchDrawPic(20 - 14, 80 - 3 * 8, GETPSYCHEDPIC, { pictable: this.pictable ?? undefined });
    // Loading bar inside US_SetWindowState(160-14*8, 80-3*8, 28*8, 48): WindowX/Y/W/H = 48/56/224/48.
    const barX = 48 + 5, barY = 56 + 48 - 3, barW = 224 - 10;
    VWB_Bar(barX, barY, barW, 2, 0); // black track (PreloadUpdate)
    const filled = Math.max(0, Math.min(barW, Math.trunc(barW * progress)));
    if (filled > 0) {
      VWB_Bar(barX, barY, filled, 2, 0x37); // red fill (SECONDCOLOR)
      VWB_Bar(barX, barY, Math.max(0, filled - 1), 1, 0x32); // lighter highlight row
    }
    this.present("GETPSYCHED");
  }

  // Advance the "Get Psyched!" hold each frame; when it elapses, fizzle the first level frame in.
  private advanceGetPsyched(frameTime: number): void {
    const remaining = this.getPsychedDeadline - frameTime;
    const progress = 1 - Math.max(0, remaining) / GETPSYCHED_MS;
    this.drawGetPsyched(Math.min(1, progress));
    if (frameTime >= this.getPsychedDeadline) {
      this.renderFrame();
      this.beginFizzleIn(); // sets mode = "fizzle"; play resumes after the dissolve
    }
  }

  // Play an AdLib (IMF) song by its AUDIOT music-chunk index: cache the chunk and hand its IMF event
  // stream to SD_StartMusic, which SDL_t0Service plays through the OPL2 emulator (and loops). Skips
  // re-starting a song that's already playing so menu navigation doesn't keep restarting it.
  private playSong(songChunk: number): void {
    if (songChunk === this.currentSong || !this.audiohed || !this.audiot) {
      return;
    }
    this.currentSong = songChunk;
    const data = CA_CacheAudioChunk(STARTMUSIC + songChunk, this.audiohed, this.audiot);
    if (data && data.length >= 2) {
      SD_StartMusic(data); // raw chunk: [u16 length][IMF events] — SD_StartMusic parses + loops it
    }
  }

  // Start the current level's song (WL_PLAY.C StartMusic picks it per episode/map from SONGS).
  private startLevelMusic(): void {
    this.currentSong = -1; // always (re)start the level song — same-map respawn restarts it (WL_PLAY.C StartMusic)
    const episode = this.gamestateU16(GAMESTATE_EPISODE_OFFSET);
    const mapon = this.gamestateU16(GAMESTATE_MAPON_OFFSET);
    this.playSong(SONGS[(episode * 10 + mapon) % SONGS.length]);
  }

  // Start the level-start fizzle: capture the just-rendered frame (renderFrame filled surface.pixels)
  // as the target, blank the screen, and dissolve the target in over frames in advanceFizzle.
  private beginFizzleIn(): void {
    const target = new Uint8Array(this.surface.pixels);
    this.fizzleAnim = { target, rndval: 1 };
    this.surface.pixels.fill(0);
    this.surface.present();
    this.mode = "fizzle";
  }

  // Reveal FIZZLE_STEPS_PER_FRAME pixels per frame in FizzleFade's 17-bit LFSR order (poly 0x12000,
  // x = rnd>>8, y = (rnd&0xff)-1), then resume play once the LFSR returns to its seed.
  private advanceFizzle(): void {
    const anim = this.fizzleAnim;
    if (!anim) {
      return;
    }
    const W = SCREEN_WIDTH, H = SCREEN_HEIGHT;
    let rndval = anim.rndval;
    let done = false;
    for (let p = 0; p < FIZZLE_STEPS_PER_FRAME; p++) {
      const y = ((rndval & 0xff) - 1) & 0xff;
      const x = (rndval >>> 8) & 0xffff;
      const carry = rndval & 1;
      rndval >>>= 1;
      if (carry) {
        rndval = (rndval ^ 0x00012000) >>> 0;
      }
      if (x < W && y < H) {
        this.surface.pixels[y * W + x] = anim.target[y * W + x];
      }
      if (rndval === 1) { // full LFSR period → dissolve complete
        done = true;
        break;
      }
    }
    anim.rndval = rndval;
    this.surface.present();
    if (done) {
      this.surface.pixels.set(anim.target); // guarantee a pixel-perfect final frame
      this.surface.present();
      this.fizzleAnim = null;
      this.mode = "play";
      this.lastFrameTime = 0;
      this.tickAccumulator = 0;
    }
  }

  // A fixed-size save record's near-offset (in the DGROUP far segment) + byte length.
  private saveRecordLayout(name: "areaconnect" | "areabyplayer"): { offset: number; bytes: number } {
    const rec = getSaveRecord(name);
    const offset = rec.symbolInfo ? Number.parseInt(rec.symbolInfo.nearOffset.slice(2), 16) : 0;
    const bytes = typeof rec.bytes === "number" ? rec.bytes : 0;
    return { offset, bytes };
  }

  // Build the far segment (0x33DA) the save format needs: areaconnect (a runtime param) + the
  // dgroup's areabyplayer, each at its save-record near-offset. Same marshaling as the T3 gate.
  private makeSaveFar(): Uint8Array {
    const far = new Uint8Array(0x10000);
    const ac = this.saveRecordLayout("areaconnect");
    const abp = this.saveRecordLayout("areabyplayer");
    far.set(this.areaconnect.subarray(0, ac.bytes), ac.offset);
    const abpRuntime = nearOffsetForRuntimeSymbol("_areabyplayer");
    far.set(this.dgroup.bytes.subarray(abpRuntime, abpRuntime + abp.bytes), abp.offset);
    return far;
  }

  // Read save slot `slot` from localStorage, tolerating the legacy raw-base64 format.
  private readSaveSlot(slot: number): { name: string; data: string } | null {
    try {
      const stored = localStorage.getItem(saveSlotKey(slot));
      if (!stored) {
        return null;
      }
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.data === "string") {
          return { name: typeof parsed.name === "string" ? parsed.name : "saved game", data: parsed.data };
        }
      } catch {
        // legacy: the value is the raw base64 save image
      }
      return { name: "saved game", data: stored };
    } catch {
      return null;
    }
  }

  // Mirror the localStorage slots into WL_MENU's SaveGamesAvail/SaveGameNames for the slot screen.
  private populateSaveSlots(): void {
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const entry = this.readSaveSlot(i);
      SaveGamesAvail[i] = entry ? 1 : 0;
      SaveGameNames[i] = entry ? entry.name : "";
    }
  }

  // Save the current game (the T3 byte-identical save image) into slot `slot` under `name`.
  private saveGameToSlot(slot: number, name: string): boolean {
    if (!this.hasGame) {
      return false;
    }
    try {
      const result = serializeSaveGame({ dgroup: this.dgroup, segments: { "0x33DA": this.makeSaveFar() } });
      localStorage.setItem(saveSlotKey(slot), JSON.stringify({ name: name.slice(0, MAX_SAVE_NAME), data: base64FromBytes(result.bytes) }));
      return true;
    } catch {
      return false;
    }
  }

  private hasSavedGame(): boolean {
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      if (this.readSaveSlot(i)) {
        return true;
      }
    }
    return false;
  }

  // Restore save slot `slot` (verified byte-exact round-trip by check:saveload-roundtrip) and
  // resume play. Mirrors loadLevel's setup but with loadedgame=true (state comes from the save).
  private loadGameFromSlot(slot: number): boolean {
    if (!this.pictable || !this.statusBar) {
      return false;
    }
    const entry = this.readSaveSlot(slot);
    if (!entry) {
      return false;
    }
    let bytes: Uint8Array;
    try {
      bytes = bytesFromBase64(entry.data);
    } catch {
      return false;
    }
    const far = this.makeSaveFar();
    this.areaconnect.fill(0);
    WL_MAIN.LoadTheGame(bytes, { dgroup: this.dgroup, segments: { "0x33DA": far } }, 0, 0, {
      setupGameLevel: () => {
        // gamestate.mapon/episode are restored before this hook fires.
        const mapIndex = this.gamestateU16(GAMESTATE_EPISODE_OFFSET) * 10 + this.gamestateU16(GAMESTATE_MAPON_OFFSET);
        const [plane0, plane1] = CA_CacheMap(mapIndex);
        this.plane0 = new Uint16Array(plane0);
        this.plane1 = new Uint16Array(plane1);
        SetupGameLevel(this.plane0, this.plane1, this.dgroup, { areaconnect: this.areaconnect, loadedgame: true });
      },
    });
    // recover the restored areaconnect from the far segment into the runtime param.
    const ac = this.saveRecordLayout("areaconnect");
    this.areaconnect.set(far.subarray(ac.offset, ac.offset + ac.bytes));

    this.hasGame = true;
    LoadLatchMem({ chunks: this.latchChunks, pictable: this.pictable });
    DrawPlayScreen(this.dgroup, {
      pictable: this.pictable,
      statusBarSource: this.statusBar,
      statusBarWidth: SCREEN_WIDTH,
      statusBarHeight: 40,
    });
    VL_SetPalette(WL_MAIN.gamepal);
    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
    this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
    this.mode = "play";
    this.lastFrameTime = 0;
    this.tickAccumulator = 0;
    this.renderFrame();
    return true;
  }

  // Open the WL_MENU 10-slot Load/Save screen (action = "load" | "save"). Mirrors the localStorage
  // slots into SaveGamesAvail/SaveGameNames, draws DrawLoadSaveScreen + the cursor gun, presents.
  private showLoadSaveScreen(action: "load" | "save", fromPlay = false): void {
    if (!this.pictable) {
      this.showMainMenu();
      return;
    }
    this.mode = "loadsave";
    this.loadSaveState = { action, entryName: null, fromPlay };
    this.populateSaveSlots();
    LSItems.curpos = 0;
    this.drawLoadSaveScreen();
  }

  private drawLoadSaveScreen(): void {
    this.toMenuPage(); // page-0-align (F2/F3/F8/F9 open this in-game after a page-flipped frame)
    const opt = this.menuPicOptions();
    DrawLoadSaveScreen(this.loadSaveState?.action === "save" ? 1 : 0, { ...opt, skipWaitKeyUp: true });
    DrawMenuGun(LSItems, opt);
    if (this.loadSaveState?.entryName !== null && this.loadSaveState) {
      // a name is being typed into the selected slot box — draw it + a cursor via the font
      VW_SetFontState({ px: LSM_X + LSItems.indent + 2, py: LSM_Y + LSItems.curpos * 13 + 1, fontcolor: 0, fontnumber: 0 });
      VW_DrawPropString(`${this.loadSaveState.entryName}_`);
    }
    this.present(this.loadSaveState?.action === "save" ? "SAVE_MENU" : "LOAD_MENU");
  }

  // Load/Save slot screen input. While typing a save name it's handled in setKey; here we handle
  // slot navigation + selection: Load → restore; Save → start name entry (or save); Escape → menu.
  private handleLoadSaveScan(scan: ScanCode): void {
    const st = this.loadSaveState;
    if (!st) {
      this.showMainMenu();
      return;
    }
    switch (scan) {
      case sc_UpArrow:
        if (this.moveCursor(LSItems, LSMenu, -1)) this.drawLoadSaveScreen();
        return;
      case sc_DownArrow:
        if (this.moveCursor(LSItems, LSMenu, 1)) this.drawLoadSaveScreen();
        return;
      case sc_Escape: {
        SD_PlaySound(ESCPRESSEDSND); // WL_MENU.C: backing out of the load/save menu
        const fromPlay = st.fromPlay;
        this.loadSaveState = null;
        if (fromPlay) { this.returnToGame(); } else { this.showMainMenu(); } // cancel → resume play
        return;
      }
      case sc_Enter:
      case sc_Space:
      case sc_Control: {
        const slot = LSItems.curpos;
        if (st.action === "load") {
          if (SaveGamesAvail[slot]) {
            ShootSnd(); // WL_MENU.C CP_LoadGame: selecting a slot plays SHOOTSND
            this.loadSaveState = null;
            this.loadGameFromSlot(slot);
          }
        } else {
          // begin typing a name: prefill an OCCUPIED slot with its existing name (to edit/overwrite),
          // start an empty slot blank. An empty name on confirm falls back to "floor N".
          ShootSnd(); // WL_MENU.C CP_SaveGame: selecting a slot plays SHOOTSND
          st.entryName = SaveGamesAvail[slot] ? (SaveGameNames[slot] ?? "") : "";
          SaveGamesAvail[slot] = 1;
          SaveGameNames[slot] = st.entryName;
          this.drawLoadSaveScreen();
        }
        return;
      }
    }
  }

  // Typed input for a save-slot name (mode "loadsave" with entryName active). Enter saves; Escape
  // cancels; printable chars/Backspace edit. Each keystroke re-renders the slot list + cursor.
  private handleSaveNameKey(event: KeyboardEvent): void {
    const st = this.loadSaveState;
    if (!st || st.entryName === null) {
      return;
    }
    const slot = LSItems.curpos;
    const key = event.key;
    if (key === "Enter") {
      const name = st.entryName.trim() || `floor ${this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 1}`;
      this.saveGameToSlot(slot, name);
      const fromPlay = st.fromPlay;
      this.loadSaveState = null;
      if (fromPlay) { this.returnToGame(); } else { this.showMainMenu(); } // in-game save resumes play
      return;
    }
    if (key === "Escape") {
      st.entryName = null;
      this.populateSaveSlots(); // discard the in-progress entry
      this.drawLoadSaveScreen();
      return;
    }
    if (key === "Backspace") {
      st.entryName = st.entryName.slice(0, -1);
    } else if (key.length === 1 && key.charCodeAt(0) >= 0x20 && key.charCodeAt(0) < 0x7f && st.entryName.length < MAX_SAVE_NAME) {
      st.entryName += key;
    }
    SaveGameNames[slot] = st.entryName;
    this.drawLoadSaveScreen();
  }

  private returnToGame(): void {
    if (!this.hasGame) {
      return;
    }
    this.mode = "play";
    this.lastFrameTime = 0;
    this.tickAccumulator = 0;
    this.startLevelMusic(); // restore the level song after a menu/control panel (WL_PLAY.C StartMusic)
    this.renderFrame();
  }

  // Attract mode: set up and begin playing the embedded demo `demoIndex` (chunks T_DEMO0..3),
  // mirroring WL_GAME.C PlayDemo's setup (NewGame on Hard at the demo's map, US_InitRndT(false),
  // SetupGameLevel). The per-frame driver (stepDemo) feeds one recorded command at a time.
  private startDemo(demoIndex: number): void {
    if (!this.pictable || !this.statusBar) {
      this.showMainMenu();
      return;
    }
    let demo: WolfDemo;
    try {
      const bytes = CA_CacheGrChunk(T_DEMO0_CHUNK + (demoIndex % DEMO_COUNT));
      if (!bytes) {
        this.showMainMenu();
        return;
      }
      demo = parseDemo(bytes);
    } catch {
      this.showMainMenu();
      return;
    }
    // WL_MAIN.C DemoLoop uses a session-persistent `LastDemo` and plays PlayDemo(LastDemo++%4), so
    // the attract cycle continues 0,1,2,3,0… across menu visits instead of restarting at 0.
    this.lastDemo = (demoIndex % DEMO_COUNT) + 1;
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    WL_MAIN.NewGame(this.dgroup, 1, 0);
    this.dgroup.setU16(gs + GAMESTATE_MAPON_OFFSET, demo.mapon);
    this.dgroup.setU16(gs + GAMESTATE_DIFFICULTY_OFFSET, DEMO_DIFFICULTY);
    US_InitRndT(false);
    const [plane0, plane1] = CA_CacheMap(demo.mapon);
    this.plane0 = new Uint16Array(plane0);
    this.plane1 = new Uint16Array(plane1);
    this.areaconnect.fill(0);
    SetupGameLevel(this.plane0, this.plane1, this.dgroup, { areaconnect: this.areaconnect, loadedgame: false });
    // ResetPlayLoopState (private in WL_GAME.C) — replicate the relevant resets.
    this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
    this.dgroup.setU32(gs + structFieldOffset("gametype", "TimeCount"), 0);
    this.dgroup.setU16(nearOffsetForRuntimeSymbol("_anglefrac"), 0);
    this.dgroup.setU16(nearOffsetForRuntimeSymbol("_facecount"), 0);
    for (let i = 0; i < 10; i++) {
      this.dgroup.setU16(nearOffsetForRuntimeSymbol("_buttonstate") + i * 2, 0);
    }
    LoadLatchMem({ chunks: this.latchChunks, pictable: this.pictable });
    DrawPlayScreen(this.dgroup, { pictable: this.pictable, statusBarSource: this.statusBar, statusBarWidth: SCREEN_WIDTH, statusBarHeight: 40 });
    VL_SetPalette(WL_MAIN.gamepal);
    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
    this.startLevelMusic(); // WL_GAME.C PlayDemo plays the demo map's song (was left on INTROSONG)
    this.demoState = { demo, index: 0, demoIndex: demoIndex % DEMO_COUNT };
    this.mode = "demo";
    this.lastFrameTime = 0;
    this.tickAccumulator = 0;
    this.renderFrame();
  }

  // Advance the playing demo by the number of recorded commands that fit the elapsed time (each
  // command = DEMOTICS tics), feeding each through PlayLoop's demoCommand, then render. When the
  // demo ends (commands exhausted or a terminal playstate), roll on to the next demo.
  private stepDemo(frameTime: number): void {
    const a = this.demoState;
    if (!a) {
      this.showMainMenu();
      return;
    }
    if (!this.lastFrameTime) {
      this.lastFrameTime = frameTime;
    }
    this.tickAccumulator += Math.min(250, frameTime - this.lastFrameTime);
    this.lastFrameTime = frameTime;
    const perCommand = DEMOTICS * TICK_MS;
    let guard = 0;
    let ended = false;
    while (this.tickAccumulator >= perCommand && guard < 8) {
      this.tickAccumulator -= perCommand;
      guard++;
      if (a.index >= a.demo.commands.length) { ended = true; break; }
      const result = PlayLoop(this.dgroup, this.plane0, this.plane1, {
        maxSteps: 1,
        demoCommand: a.demo.commands[a.index],
        demoDone: a.index === a.demo.commands.length - 1,
        areaconnect: this.areaconnect,
        viewwidth: WL_MAIN.viewwidth,
        scale: WL_MAIN.scale,
        centerx: WL_MAIN.centerx,
        shootdelta: WL_MAIN.shootdelta,
        focallength: WL_MAIN.focallength,
      });
      a.index++;
      if (result.playstate) { ended = true; break; }
    }
    this.renderFrame();
    if (ended || a.index >= a.demo.commands.length) {
      // DOS PlayDemo returns to DemoLoop's loop top, which redraws Title → Credits → High Scores before
      // the NEXT demo — it does not chain demo→demo. lastDemo was already advanced in startDemo.
      this.enterAttract();
    }
  }

  private ensureActiveCursor(itemInfo: MenuInfo, items: readonly MenuItem[]): void {
    if (this.isActiveMenuItem(itemInfo, items, itemInfo.curpos)) {
      return;
    }
    const amount = Math.trunc(itemInfo.amount);
    for (let index = 0; index < amount; index++) {
      if (this.isActiveMenuItem(itemInfo, items, index)) {
        itemInfo.curpos = index;
        return;
      }
    }
  }

  private moveCursor(itemInfo: MenuInfo, items: readonly MenuItem[], delta: -1 | 1): boolean {
    const amount = Math.trunc(itemInfo.amount);
    if (amount <= 0) {
      return false;
    }
    let next = Math.trunc(itemInfo.curpos);
    for (let guard = 0; guard < amount; guard++) {
      next = (next + delta + amount) % amount;
      if (this.isActiveMenuItem(itemInfo, items, next)) {
        if (next === itemInfo.curpos) {
          return false;
        }
        itemInfo.curpos = next;
        SD_PlaySound(MOVEGUN1SND); // WL_MENU.C DrawGun: the cursor-move sound (menus were silent)
        return true;
      }
    }
    return false;
  }

  private isActiveMenuItem(itemInfo: MenuInfo, items: readonly MenuItem[], index: number): boolean {
    return index >= 0 && index < Math.trunc(itemInfo.amount) && !!items[index]?.active;
  }

  private stepOneTic(): number {
    const result = PlayLoop(this.dgroup, this.plane0, this.plane1, {
      maxSteps: 1,
      tics: 1,
      areaconnect: this.areaconnect,
      viewwidth: WL_MAIN.viewwidth,
      scale: WL_MAIN.scale,
      centerx: WL_MAIN.centerx,
      shootdelta: WL_MAIN.shootdelta,
      focallength: WL_MAIN.focallength,
      pollControls: (dgroup) => {
        PollKeyboardButtons(dgroup, this.pressedScans);
        PollKeyboardMove(dgroup, this.pressedScans);
        // Mouse-look: fold the pointer-locked motion + buttons into the same control state, then
        // consume the accumulated delta so it's applied once (WL_PLAY.C PollControls polls both).
        if (this.pointerLocked && this.mouseEnabled) {
          PollMouseButtons(dgroup, this.mouseButtons);
          PollMouseMove(dgroup, this.mouseDeltaX, this.mouseDeltaY, { mouseadjustment: WL_MAIN.mouseadjustment });
          this.mouseDeltaX = 0;
          this.mouseDeltaY = 0;
        }
      },
    });
    this.audio.syncFromSoundState();
    // PlayLoop already serviced controls.tics*2 (=2) t0 ticks during its control poll, so top up
    // to the DOS 10/tic — servicing all 10 here would be 12/tic and play AdLib music ~20% too fast.
    for (let i = 0; i < T0_SERVICES_PER_TIC - PLAYLOOP_T0_SERVICES; i++) {
      SDL_t0Service(); // 700 Hz timer: advances IMF music, sound effects, and TimeCount in step
    }
    // Capture this tic's palette-shift level so the rendered frame can flash red (damage) or
    // gold (bonus). UpdatePaletteShiftsMemory already decremented the counters inside PlayLoop.
    const shift = result.lastStep?.palette;
    this.paletteShift = shift ? { red: shift.red, white: shift.white } : { red: 0, white: 0 };
    return result.playstate;
  }

  // Mirror WL_GAME.C GameLoop's post-PlayLoop switch: a terminal playstate ends the
  // level and routes to death / level-advance / victory. (The animated intermission,
  // death-spin frames, and fizzle/fade are applied as state but not yet rendered
  // frame-by-frame — see ROADMAP Phase 2b-2d.)
  private handlePlaystate(playstate: number): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    switch (playstate) {
      case EX_COMPLETED:
      case EX_SECRETLEVEL: {
        this.dgroup.setU16(gs + GAMESTATE_KEYS_OFFSET, 0);
        const summary = LevelCompleted(this.dgroup);
        this.dgroup.setU32(gs + GAMESTATE_OLDSCORE_OFFSET, this.dgroup.u32(gs + GAMESTATE_SCORE_OFFSET));
        // Show the floor-completed bonus-tally intermission screen with the counting-up animation;
        // a keypress skips to the finals (or, once done, advances to the queued next level).
        this.startIntermissionAnim(summary);
        this.playSong(ENDLEVEL_MUS); // WL_INTER.C LevelCompleted switches to the intermission song
        const episode = this.gamestateU16(GAMESTATE_EPISODE_OFFSET);
        let mapon = this.gamestateU16(GAMESTATE_MAPON_OFFSET);
        if (mapon === 9) {
          mapon = ELEVATOR_BACK_TO[episode] ?? mapon;
        } else if (playstate === EX_SECRETLEVEL) {
          mapon = 9;
        } else {
          mapon++;
        }
        this.dgroup.setU16(gs + GAMESTATE_MAPON_OFFSET, mapon);
        this.mode = "intermission";
        break;
      }
      case EX_DIED: {
        this.handleDied();
        break;
      }
      case EX_VICTORIOUS: {
        // Show the "you win!" victory screen with the averages counting up; a keypress skips to
        // the finals, then records the score → high scores (the faithful WL6 episode ending).
        this.startVictoryAnim(Victory(this.dgroup));
        this.playSong(URAHERO_MUS); // WL_INTER.C Victory plays the hero theme
        this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
        this.mode = "victory";
        break;
      }
      case EX_WARPED:
      default: {
        this.loadLevel();
        break;
      }
    }
  }

  // EX_DIED: apply the ported Died() state transition (lose a life; if any remain,
  // reset health/weapon/ammo/keys and reload the level), else game over → main menu.
  private handleDied(): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    const player = this.dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    const killer = this.dgroup.u16(nearOffsetForRuntimeSymbol("_killerobj")) || player;
    const summary = Died({
      player: {
        x: this.dgroup.i32(player + OBJ_X_OFFSET),
        y: this.dgroup.i32(player + OBJ_Y_OFFSET),
        angle: this.dgroup.u16(player + OBJ_ANGLE_OFFSET),
        weapon: this.dgroup.i16(gs + GAMESTATE_WEAPON_OFFSET),
        bestweapon: this.dgroup.i16(gs + GAMESTATE_BESTWEAPON_OFFSET),
        chosenweapon: this.dgroup.i16(gs + GAMESTATE_CHOSENWEAPON_OFFSET),
        lives: this.dgroup.i16(gs + GAMESTATE_LIVES_OFFSET),
        health: this.dgroup.i16(gs + GAMESTATE_HEALTH_OFFSET),
        ammo: this.dgroup.i16(gs + GAMESTATE_AMMO_OFFSET),
        keys: this.dgroup.i16(gs + GAMESTATE_KEYS_OFFSET),
        attackframe: this.dgroup.i16(gs + GAMESTATE_ATTACKFRAME_OFFSET),
        attackcount: this.dgroup.i16(gs + GAMESTATE_ATTACKCOUNT_OFFSET),
        weaponframe: this.dgroup.i16(gs + GAMESTATE_WEAPONFRAME_OFFSET),
      },
      killer: {
        x: this.dgroup.i32(killer + OBJ_X_OFFSET),
        y: this.dgroup.i32(killer + OBJ_Y_OFFSET),
        angle: this.dgroup.u16(killer + OBJ_ANGLE_OFFSET),
      },
    });

    // Take the weapon away and cry out, then animate the spin-to-killer (advanceDying drives the
    // rotation frame-by-frame, then a red fade, before applyDiedResult loses the life / ends).
    this.dgroup.setU16(gs + GAMESTATE_WEAPON_OFFSET, 0xffff); // weapon = -1
    SD_PlaySound(PLAYERDEATHSND);
    this.audio.syncFromSoundState(true);
    this.paletteShift = { red: 0, white: 0 };
    this.dyingAnim = { summary, index: 0, phase: "spin", redStep: 0 };
    this.mode = "dying";
  }

  // Drive the death animation one rendered frame at a time (WL_GAME.C Died: spin the view toward
  // the killer with ThreeDRefresh per rotation step, then a red palette fade), then resolve.
  private advanceDying(): void {
    const anim = this.dyingAnim;
    if (!anim) {
      return;
    }
    const player = this.dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    if (anim.phase === "spin") {
      const rotations = anim.summary.rotations;
      anim.index = Math.min(anim.index + DEATH_SPIN_STEPS_PER_FRAME, rotations.length);
      const angle = anim.index > 0 && rotations.length > 0
        ? rotations[anim.index - 1].angle
        : anim.summary.player.angle;
      this.dgroup.setU16(player + OBJ_ANGLE_OFFSET, angle & 0xffff);
      this.renderFrame(true); // spin: 3D view only, no status-bar redraw (weapon is the -1 sentinel)
      if (anim.index >= rotations.length) {
        this.dgroup.setU16(player + OBJ_ANGLE_OFFSET, anim.summary.player.angle & 0xffff);
        anim.phase = "redfade";
        anim.redStep = 0;
      }
      return;
    }
    // redfade: tint the held death frame toward red over a few frames (do NOT re-render — just
    // shift currentPalette, which present() reads), then resolve the death.
    anim.redStep++;
    const tables = this.shiftTables;
    if (tables) {
      const lvl = Math.min(anim.redStep, tables.redshifts.length) - 1;
      VL_SetPalette(tables.redshifts[Math.max(0, lvl)]);
    }
    this.present("DYING");
    if (anim.redStep >= DEATH_REDFADE_FRAMES) {
      VL_SetPalette(WL_MAIN.gamepal);
      this.dyingAnim = null;
      this.applyDiedResult(anim.summary);
    }
  }

  // The WL_GAME.C Died tail: lose a life and respawn the level, or game over → high scores.
  private applyDiedResult(summary: ReturnType<typeof Died>): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    const player = this.dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    const p = summary.player;
    this.dgroup.setU16(gs + GAMESTATE_LIVES_OFFSET, p.lives & 0xffff);
    this.dgroup.setU16(player + OBJ_ANGLE_OFFSET, p.angle & 0xffff);
    if (summary.reset) {
      this.dgroup.setU16(gs + GAMESTATE_HEALTH_OFFSET, p.health);
      this.dgroup.setU16(gs + GAMESTATE_WEAPON_OFFSET, p.weapon & 0xffff);
      this.dgroup.setU16(gs + GAMESTATE_BESTWEAPON_OFFSET, p.bestweapon & 0xffff);
      this.dgroup.setU16(gs + GAMESTATE_CHOSENWEAPON_OFFSET, p.chosenweapon & 0xffff);
      this.dgroup.setU16(gs + GAMESTATE_AMMO_OFFSET, p.ammo);
      this.dgroup.setU16(gs + GAMESTATE_KEYS_OFFSET, p.keys);
      this.dgroup.setU16(gs + GAMESTATE_ATTACKFRAME_OFFSET, p.attackframe);
      this.dgroup.setU16(gs + GAMESTATE_ATTACKCOUNT_OFFSET, p.attackcount);
      this.dgroup.setU16(gs + GAMESTATE_WEAPONFRAME_OFFSET, p.weaponframe);
      // WL_GAME.C GameLoop restart loop: `if (!loadedgame) gamestate.score = gamestate.oldscore;`
      // — dying rolls the score back to its level-start value so points from the failed attempt
      // aren't kept (and re-earned), which would inflate the score and farm extra lives.
      this.dgroup.setU32(gs + GAMESTATE_SCORE_OFFSET, this.dgroup.u32(gs + GAMESTATE_OLDSCORE_OFFSET));
      this.loadLevel(false); // WL_GAME.C: `if (!died) PreloadGraphics()` — no Get-Psyched on respawn
    } else {
      // Game over (no lives left): record the score into the high-score table and show it.
      this.hasGame = false;
      this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
      // WL_GAME.C ex_died: CheckHighScore(score, mapon+1) — 1-based level reached, matching the
      // victory path (recordHighScoreAndShow(mapon+1)) for the LEVEL column + equal-score tie-break.
      const completed = this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 1;
      this.recordHighScoreAndShow(completed);
    }
  }

  // Draw the WL_INTER.C floor-completed intermission screen (BJ figure + bonus/time/par and
  // kill/secret/treasure ratios) with the level's FINAL stats, then present it. The DOS version
  // animates each value counting up; this shows the settled values (a faithful static layout —
  // count-up animation is a follow-up). Boss floors (mapon >= 8) get the minimal completed panel.
  // Make BJ breathe on the intermission/victory screen: BJ_Breathe toggles L_GUYPIC/L_GUY2PIC at
  // (0,16) once TimeCount passes its threshold (~35 tics). It draws only when it toggles, leaving
  // the rest of the screen (stats/text) intact; present the new frame when it does.
  private advanceBJBreathe(): void {
    VL_SetBufferOffset(0);
    const result = BJ_Breathe({ chunks: this.levelEndChunks, pictable: this.pictable ?? undefined });
    if (result.breathed) {
      this.present("INTERMISSION");
    }
  }

  private drawIntermission(summary: LevelCompletedSummary, shown?: IntermissionShown): void {
    const s = shown ?? { bonus: summary.bonus, kill: summary.ratios.kill, secret: summary.ratios.secret, treasure: summary.ratios.treasure };
    const opt = { chunks: this.levelEndChunks, pictable: this.pictable ?? undefined };
    this.toMenuPage();
    VL_SetPalette(WL_MAIN.gamepal); // LevelCompleted's VW_FadeOut left the palette black — restore it
    VWB_Bar(0, 0, SCREEN_WIDTH, 200 - 40, 127); // clear top 160px (STATUSLINES=40) to bg color 127
    VWB_DrawPic(0, 16, L_GUYPIC, { source: this.levelEndChunks[L_GUYPIC] ?? undefined, pictable: this.pictable ?? undefined });
    const bonusStr = String(s.bonus);
    if (summary.normalFloor) {
      Write(14, 2, "floor\ncompleted", opt);
      Write(26, 2, String(summary.mapon + 1), opt);
      Write(14, 7, "bonus", opt);
      Write(36 - bonusStr.length * 2, 7, bonusStr, opt);
      Write(16, 10, "time", opt);
      Write(16, 12, " par", opt);
      Write(26, 12, summary.parTime, opt);
      Write(26, 10, summary.displayTime, opt);
      Write(9, 14, "kill ratio    %", opt);
      Write(5, 16, "secret ratio    %", opt);
      Write(1, 18, "treasure ratio    %", opt);
      this.writeRatioValue(s.kill, 14, opt);
      this.writeRatioValue(s.secret, 16, opt);
      this.writeRatioValue(s.treasure, 18, opt);
    } else {
      // Secret/boss floor (mapon >= 8). WL_INTER.C LevelCompleted (#else / non-SPEAR branch) draws
      // the fixed "secret floor completed!" panel and the literal "15000 bonus!" (GivePoints(15000)
      // already awards it in LevelCompleted), not the generic floor/bonus layout.
      Write(14, 4, "secret floor\n completed!", opt);
      Write(10, 16, "15000 bonus!", opt);
    }
    this.present("INTERMISSION");
  }

  // Begin the bonus/ratio count-up animation for a normal-floor intermission. The per-frame
  // driver (advanceIntermission, run from the tick loop) walks `stage` 0→3 (bonus, kill, secret,
  // treasure), each counting from 0 to its target; when stage>3 the screen holds the finals and
  // a keypress advances. (DOS sounds/BJ_Breathe during count-up are a follow-up.)
  private startIntermissionAnim(summary: LevelCompletedSummary): void {
    if (!summary.normalFloor) {
      this.intermissionAnim = null; // boss floors show the static panel
      this.drawIntermission(summary);
      return;
    }
    this.intermissionAnim = { summary, stage: 0, shown: { bonus: 0, kill: 0, secret: 0, treasure: 0 }, soundCounter: 0 };
    this.drawIntermission(summary, this.intermissionAnim.shown);
  }

  // One animation step (called per frame while the intermission count-up is running).
  private advanceIntermission(): void {
    const a = this.intermissionAnim;
    if (!a || a.stage > 3) {
      return;
    }
    const targets = [a.summary.bonus, a.summary.ratios.kill, a.summary.ratios.secret, a.summary.ratios.treasure];
    const fields: Array<keyof IntermissionShown> = ["bonus", "kill", "secret", "treasure"];
    const field = fields[a.stage];
    const target = targets[a.stage];
    const step = a.stage === 0 ? Math.max(50, Math.ceil(target / 40)) : Math.max(2, Math.ceil(target / 30));
    let value = a.shown[field] + step;
    let finished = false;
    if (value >= target) {
      value = target;
      a.stage++;
      finished = true;
    }
    a.shown[field] = value;
    if (finished) {
      // End-of-field cue (WL_INTER.C LevelCompleted): a ratio that hit 100% / 0% gets its own
      // sound; every field then chimes ENDBONUS2SND.
      if (a.stage === 1 && a.summary.bonus === 0) {
        // A zero time-bonus is silent: WL_INTER.C guards the whole time-bonus block behind `if (bonus)`.
      } else if (a.stage > 1) {
        SD_PlaySound(target === 100 ? PERCENT100SND : target === 0 ? NOBONUSSND : ENDBONUS2SND);
      } else {
        SD_PlaySound(ENDBONUS2SND); // the bonus field finished
      }
    } else if (a.soundCounter++ % 4 === 0) {
      SD_PlaySound(ENDBONUS1SND); // the DOS ticking sound as the numbers roll up
    }
    this.drawIntermission(a.summary, a.shown);
  }

  // Right-align a ratio percentage to column 37 (RATIOXX), matching WL_INTER.C's `x=RATIOXX-len*2`.
  private writeRatioValue(value: number, row: number, opt: { chunks: Array<Uint8Array | null>; pictable?: Uint8Array }): void {
    const s = String(value);
    Write(37 - s.length * 2, row, s, opt);
  }

  // Intermission ack: while the count-up is still animating, a key skips to the final values;
  // once the tally is complete (or on a boss-floor static panel), a key advances to the next level.
  private handleIntermissionScan(_scan: ScanCode): void {
    // WL_INTER.C LevelCompleted advances/skips on IN_CheckAck/IN_Ack, i.e. ANY key — not just
    // Enter/Space/Ctrl. setKey only routes mapped scancodes here (down, non-repeat), so accept all.
    const a = this.intermissionAnim;
    if (a && a.stage <= 3) {
      a.shown = { bonus: a.summary.bonus, kill: a.summary.ratios.kill, secret: a.summary.ratios.secret, treasure: a.summary.ratios.treasure };
      a.stage = 4;
      this.drawIntermission(a.summary, a.shown); // jump to the finished tally
      return;
    }
    this.intermissionAnim = null;
    this.loadLevel();
  }

  // Draw the WL_INTER.C "you win!" victory screen: BJ-wins figure + total time + the average
  // kill/secret/treasure ratios across the episode (from Victory()'s settled stats). Layout
  // constants match WL_INTER.C (TIMEX=14 TIMEY=8 RATIOX=6 RATIOY=14; averages right-align to
  // col RATIOX+24=30). `shown` carries the in-progress averages while the count-up animates.
  private drawVictory(summary: VictorySummary, shown?: VictoryShown): void {
    const s = shown ?? { kill: summary.averages.kill, secret: summary.averages.secret, treasure: summary.averages.treasure };
    const opt = { chunks: this.levelEndChunks, pictable: this.pictable ?? undefined };
    const L_BJWINSPIC = 85; // last pic of the LEVELEND lump (43..85), cached in levelEndChunks
    this.toMenuPage();
    VL_SetPalette(WL_MAIN.gamepal);
    VWB_Bar(0, 0, SCREEN_WIDTH, 200 - 40, 127);
    VWB_DrawPic(8, 4, L_BJWINSPIC, { source: this.levelEndChunks[L_BJWINSPIC] ?? undefined, pictable: this.pictable ?? undefined });
    Write(18, 2, "you win!", opt);
    Write(14, 6, "total time", opt);
    Write(14, 8, summary.totalTime, opt);
    Write(12, 12, "averages", opt);
    Write(14, 14, "kill    %", opt);
    Write(10, 16, "secret    %", opt);
    Write(6, 18, "treasure    %", opt);
    this.writeRightAligned(s.kill, 14, 30, opt);
    this.writeRightAligned(s.secret, 16, 30, opt);
    this.writeRightAligned(s.treasure, 18, 30, opt);
    this.present("VICTORY");
  }

  // Begin (and step) the victory-screen averages count-up — mirrors the intermission tally.
  private startVictoryAnim(summary: VictorySummary): void {
    this.victoryAnim = { summary, stage: 0, shown: { kill: 0, secret: 0, treasure: 0 }, soundCounter: 0 };
    this.drawVictory(summary, this.victoryAnim.shown);
  }

  private advanceVictory(): void {
    const a = this.victoryAnim;
    if (!a || a.stage > 2) {
      return;
    }
    const targets = [a.summary.averages.kill, a.summary.averages.secret, a.summary.averages.treasure];
    const fields: Array<keyof VictoryShown> = ["kill", "secret", "treasure"];
    const field = fields[a.stage];
    const target = targets[a.stage];
    let value = a.shown[field] + Math.max(2, Math.ceil(target / 30));
    if (value >= target) {
      value = target;
      a.stage++;
    }
    a.shown[field] = value;
    if (a.soundCounter++ % 4 === 0) {
      SD_PlaySound(ENDBONUS1SND);
    }
    this.drawVictory(a.summary, a.shown);
  }

  // Right-align a value's text so it ends at column `col` (WL_INTER.C's `x = col - strlen*2`).
  private writeRightAligned(value: number, row: number, col: number, opt: { chunks: Array<Uint8Array | null>; pictable?: Uint8Array }): void {
    const s = String(value);
    Write(col - s.length * 2, row, s, opt);
  }

  // Victory ack: record the score and show the high scores — the faithful WL6 episode ending
  // (WL_GAME GameLoop ex_victorious: Victory() then CheckHighScore(score, mapon+1)). WL6 has no
  // separate end-story/credits screen; the BJ-collapse/EndScreen art is Spear-of-Destiny only.
  private handleVictoryScan(_scan: ScanCode): void {
    // WL_INTER.C Victory ends with IN_Ack — ANY key advances/skips, not just Enter/Space/Ctrl.
    const a = this.victoryAnim;
    if (a && a.stage <= 2) {
      // first key skips the count-up to the final averages
      a.shown = { kill: a.summary.averages.kill, secret: a.summary.averages.secret, treasure: a.summary.averages.treasure };
      a.stage = 3;
      this.drawVictory(a.summary, a.shown);
      return;
    }
    this.victoryAnim = null;
    this.hasGame = false;
    // WL_INTER.C Victory ends with EndText() — the per-episode ENDART story/credits article. Show it
    // (page-turning) before the high-score table, exactly as the original ends the episode.
    this.showEndText(this.gamestateU16(GAMESTATE_EPISODE_OFFSET), this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 1);
  }

  // Show the per-episode end-of-game article (WL_TEXT.C EndText/ShowArticle): the ENDART text chunk
  // laid out page-by-page in the help-window frame. `completed` is the 1-based level reached, used
  // for the high-score table after the article. Falls straight through to high scores if the article
  // can't be loaded/rendered.
  private showEndText(episode: number, completed: number): void {
    const info = EndText({ episode });
    // WL6 end art is a VGAGRAPH chunk (T_ENDART1 + episode); only that numeric form is supported.
    const chunk = typeof info.chunkOrFile === "number" ? info.chunkOrFile : -1;
    this.playSong(ENDLEVEL_MUS); // a settled tune under the ending text
    this.showArticle(chunk, () => this.recordHighScoreAndShow(completed));
  }

  // "Read This!" help/instructions article (WL_MENU.C CP_ReadThis → WL_TEXT.C HelpScreens, T_HELPART).
  private showReadThis(): void {
    const info = HelpScreens();
    const chunk = typeof info.chunkOrFile === "number" ? info.chunkOrFile : -1;
    this.showArticle(chunk, () => this.showMainMenu());
  }

  // Show a WL_TEXT article (ENDART / help) page-by-page; `onDone` runs when the last page is acked.
  // Falls straight through to onDone if the chunk can't be loaded or the layout fails (never strands).
  private showArticle(chunk: number, onDone: () => void): void {
    this.articleOnDone = onDone;
    try {
      const bytes = chunk >= 0 ? CA_CacheGrChunk(chunk) : null;
      if (!bytes || bytes.length === 0) { onDone(); return; }
      let article = "";
      for (let i = 0; i < bytes.length; i++) article += String.fromCharCode(bytes[i]);
      this.articleText = article;
      // Cache the fonts + every graphic the article references (CacheLayoutGraphics marks them).
      CA_CacheGrChunk(STARTFONT);
      CA_CacheGrChunk(STARTFONT + 1);
      const layout = CacheLayoutGraphics(article);
      for (const c of layout.marked) CA_CacheGrChunk(c);
      this.articleTotalPages = Math.max(1, layout.pages);
      this.articlePage = 1;
      this.mode = "endtext";
      this.renderArticlePage();
    } catch {
      onDone();
    }
  }

  // Render the article up to the current page (WL_TEXT.C ShowArticle re-lays-out from the top each
  // call and resets its text offset, so page k = render pages 1..k and keep page k). The port's text
  // engine only COMPUTES each page's draw operations (for gate-testability); execute them here.
  private renderArticlePage(): void {
    this.toMenuPage(); // full-screen article takeover, page-0-aligned (F1 help enters from a play frame)
    const shown = ShowArticle({ article: this.articleText, renderAll: true, maxPages: this.articlePage });
    const page = shown.pages[shown.pages.length - 1];
    if (page) {
      this.executeTextOperations(page.operations);
    }
    this.present("ENDTEXT");
  }

  // Execute a page's computed draw operations into the video buffer: window/clear bars, embedded
  // graphics, and proportional-font words (the ENDART articles use only ^P/^G/^C/^E — a single font
  // with per-word color, so each word carries its own color and position).
  private executeTextOperations(ops: readonly TextDrawOperation[]): void {
    for (const op of ops) {
      switch (op.type) {
        case "bar":
          VWB_Bar(op.x, op.y, op.width, op.height, op.color);
          break;
        case "pic":
          VWB_DrawPic(op.x, op.y, op.pic, { source: grsegs[op.pic] ?? undefined, pictable: this.pictable ?? undefined });
          break;
        case "word":
          VW_SetFontState({ fontnumber: 0, fontcolor: op.color, px: op.x, py: op.y });
          VWB_DrawPropString(op.word);
          break;
        case "page-number":
          VW_SetFontState({ fontnumber: 0, fontcolor: op.color, px: op.x, py: op.y });
          VWB_DrawPropString(op.text);
          break;
      }
    }
  }

  // Any key turns to the next article page; once the last page is acknowledged, run articleOnDone
  // (→ high scores after an ending, → main menu after the help screens).
  private handleEndTextScan(_scan: ScanCode): void {
    const done = this.articleOnDone ?? (() => this.showMainMenu());
    if (this.articlePage >= this.articleTotalPages) {
      this.articleOnDone = null;
      done();
      return;
    }
    this.articlePage += 1;
    try {
      this.renderArticlePage();
    } catch {
      this.articleOnDone = null;
      done();
    }
  }

  // Draw the WL_INTER.C high-score table (HIGH SCORES title + NAME/LEVEL/SCORE columns + the 7
  // entries) and present it. drawPic blits the title/header pics from the cached lookup; print
  // renders each row's name/level/score via the proportional font (VW_SetFontState px/py). When
  // `entryIndex` >= 0 the player is typing that row's name — redraw it with a trailing cursor.
  // Persist the high-score table to localStorage (the browser stand-in for WriteConfig writing
  // CONFIG.WL6) so scores survive a reload, and hydrate it at boot.
  private saveHighScores(): void {
    try {
      window.localStorage?.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(Scores));
    } catch { /* storage may be unavailable */ }
  }

  // Persist user settings (sound modes, view size, mouse-enable) to localStorage — the browser
  // analog of WL_MAIN.C WriteConfig writing CONFIG.WL6 — so menu/Change-View choices survive reload.
  private saveConfig(): void {
    try {
      const sound = SD_DebugState();
      const config = {
        viewsize: Math.trunc(WL_MAIN.viewwidth / 16),
        soundMode: sound.SoundMode,
        digiMode: sound.DigiMode,
        musicMode: sound.MusicMode,
        mouseEnabled: this.mouseEnabled,
      };
      window.localStorage?.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch { /* storage may be unavailable */ }
  }

  // Restore persisted settings at boot, over the CONFIG.WL6 defaults (ReadConfig analog).
  private loadConfig(): void {
    try {
      const raw = window.localStorage?.getItem(CONFIG_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const c = JSON.parse(raw) as Record<string, unknown>;
      if (typeof c.viewsize === "number") {
        WL_MAIN.NewViewSize(Math.max(MIN_VIEWSIZE, Math.min(MAX_VIEWSIZE, c.viewsize | 0)));
      }
      if (typeof c.soundMode === "number") SD_SetSoundMode(c.soundMode as Parameters<typeof SD_SetSoundMode>[0]);
      if (typeof c.digiMode === "number") SD_SetDigiDevice(c.digiMode as Parameters<typeof SD_SetDigiDevice>[0]);
      if (typeof c.musicMode === "number") SD_SetMusicMode(c.musicMode as Parameters<typeof SD_SetMusicMode>[0]);
      if (typeof c.mouseEnabled === "boolean") this.mouseEnabled = c.mouseEnabled;
    } catch { /* ignore corrupt storage */ }
  }

  private loadHighScores(): void {
    try {
      const raw = window.localStorage?.getItem(HIGHSCORE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as Array<Partial<HighScore>>;
      for (let i = 0; i < Scores.length && i < saved.length; i++) {
        const s = saved[i];
        if (s && typeof s.score === "number") {
          Scores[i].name = String(s.name ?? "");
          Scores[i].score = s.score | 0;
          Scores[i].completed = (s.completed ?? 0) | 0;
          Scores[i].episode = (s.episode ?? 0) | 0;
        }
      }
    } catch { /* ignore corrupt storage */ }
  }

  // Render the high-score table into the buffer (WL_INTER.C DrawHighScores). Shared by the post-game
  // high-scores screen (showHighScores) and the attract-rotation high-scores stage (drawIntroStage 3);
  // the caller owns the page-align, palette, song, and present.
  private drawHighScoreTable(entryIndex: number): void {
    const lookup = (picnum: number): Uint8Array | undefined =>
      this.highScoreChunks[picnum] ?? this.menuChunks[picnum] ?? undefined;
    DrawHighScores({
      cacheGraphic: (chunk) => lookup(chunk) ?? chunk,
      drawPic: (x, y, picnum) => VWB_DrawPic(x, y, picnum, { source: lookup(picnum), pictable: this.pictable ?? undefined }),
      print: (x, y, text) => { VW_SetFontState({ px: x, py: y, fontcolor: 15, fontnumber: 0 }); return VW_DrawPropString(text); },
    });
    if (entryIndex >= 0) {
      VW_SetFontState({ px: 4 * 8, py: 76 + 16 * entryIndex, fontcolor: 15, fontnumber: 0 });
      VW_DrawPropString(`${Scores[entryIndex]?.name ?? ""}_`); // re-draw the name + a typing cursor
    }
  }

  private showHighScores(entryIndex = -1): void {
    this.mode = "highscores";
    this.toMenuPage(); // page-0-align so a leftover play page/screenofs doesn't shift the table
    VL_SetPalette(WL_MAIN.gamepal); // game over may have left a damage/death tint
    this.playSong(ROSTER_MUS); // WL_MENU.C CheckHighScore plays the roster song
    this.highScoreEntryIndex = entryIndex;
    this.drawHighScoreTable(entryIndex);
    this.present("HIGHSCORES");
  }

  // Record the just-finished game's score into the high-score table (WL_INTER.C CheckHighScore).
  // If it qualifies (inserted at `index`), enter the interactive name-entry sub-mode; otherwise
  // just display the table. `completed` = levels finished. The synchronous nameInput/userInput
  // hooks are stubbed so the typed-name flow is driven by the browser key loop instead.
  private recordHighScoreAndShow(completed: number): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    const score = this.dgroup.u32(gs + GAMESTATE_SCORE_OFFSET);
    const episode = this.gamestateU16(GAMESTATE_EPISODE_OFFSET);
    const result = CheckHighScore(score, completed, {
      episode,
      startMusic: () => null,
      drawHighScores: () => null,
      fadeIn: () => null,
      nameInput: (_index, entry) => entry.name,
      userInput: () => null,
      clearKeysDown: () => null,
    });
    if (result.inserted && result.index >= 0) {
      this.highScoreEntryName = Scores[result.index]?.name ?? "";
      this.showHighScores(result.index); // begin name entry on the new row
    } else {
      this.showHighScores();
    }
  }

  // Interactive high-score name entry: build the new row's name from typed characters. Printable
  // chars append (capped to fit the NAME column), Backspace deletes, Enter/Escape confirm. Each
  // keystroke re-renders the table with the in-progress name + cursor.
  private handleHighScoreEntryKey(event: KeyboardEvent): void {
    const key = event.key;
    if (key === "Enter" || key === "Escape") {
      const index = this.highScoreEntryIndex;
      if (index >= 0 && Scores[index]) {
        Scores[index].name = this.highScoreEntryName;
      }
      this.saveHighScores(); // persist the finalized table so it survives a reload
      this.showHighScores(); // leave entry mode (no cursor)
      return;
    }
    if (key === "Backspace") {
      this.highScoreEntryName = this.highScoreEntryName.slice(0, -1);
    } else if (key.length === 1 && key.charCodeAt(0) >= 0x20 && key.charCodeAt(0) < 0x7f && this.highScoreEntryName.length < MAX_HIGHSCORE_NAME) {
      this.highScoreEntryName += key;
    }
    const index = this.highScoreEntryIndex;
    if (index >= 0 && Scores[index]) {
      Scores[index].name = this.highScoreEntryName;
    }
    this.showHighScores(index); // redraw table + cursor with the updated name
  }

  // High-scores ack (display mode only): any select/back key returns to the main menu.
  private handleHighScoresScan(scan: ScanCode): void {
    if (scan === sc_Enter || scan === sc_Space || scan === sc_Control || scan === sc_Escape) {
      this.showMainMenu();
    }
  }

  private renderFrame(skipStatusBar = false): void {
    ThreeDRefresh({
      dgroup: this.dgroup,
      screenofs: WL_MAIN.screenofs,
      scale: WL_MAIN.scale,
      centerx: WL_MAIN.centerx,
      focallength: WL_MAIN.focallength,
      heightnumerator: WL_MAIN.heightnumerator,
      episode: this.gamestateU16(GAMESTATE_EPISODE_OFFSET),
      mapon: this.gamestateU16(GAMESTATE_MAPON_OFFSET),
    });
    // WL_GAME.C Died() only ThreeDRefreshes during the death spin (gamestate.weapon = -1); skip the
    // status-bar redraw so DrawWeapon isn't handed the -1 sentinel, and the last weapon pic is kept.
    if (!skipStatusBar) {
      this.drawStatusBar();
    }
    this.applyPaletteShift();
    this.present("PLAYLOOP");
  }

  // Overlay the PAUSEDPIC on the current frame (WL_PLAY.C: LatchDrawPic(20-4,80-2*8,PAUSEDPIC)).
  private drawPaused(): void {
    if (!this.pictable) {
      return;
    }
    // ThreeDRefresh page-flips, so bufferofs points at the NEXT page; draw onto the VISIBLE page
    // (WL_PLAY.C does `bufferofs = displayofs` before LatchDrawPic).
    VL_SetBufferOffset(displayPageBase(displayofs));
    LatchDrawPic(20 - 4, 80 - 2 * 8, PAUSEDPIC, { pictable: this.pictable });
    this.present("PAUSED");
  }

  // Apply the active damage/bonus palette shift (WL_PLAY.C UpdatePaletteShifts). red>0 → the
  // red damage flash; white>0 → the gold bonus flash; otherwise restore the base gamepal. This
  // sets currentPalette, which present() reads via setPaletteFromVgaDac.
  private applyPaletteShift(): void {
    const { red, white } = this.paletteShift;
    const tables = this.shiftTables;
    if (tables && red > 0 && red <= tables.redshifts.length) {
      VL_SetPalette(tables.redshifts[red - 1]);
    } else if (tables && white > 0 && white <= tables.whiteshifts.length) {
      VL_SetPalette(tables.whiteshifts[white - 1]);
    } else {
      VL_SetPalette(WL_MAIN.gamepal);
    }
  }

  // WL_PLAY.C CheckKeys MLI cheat: top up health/ammo/keys, zero the score, and grant the chaingun.
  // Run a WL_DEBUG.C DebugKeys action (TAB + letter while ?debug). Applies the player-affecting
  // actions (god mode, no clip, free items, hurt, warp); the DOS-only diagnostics (counts, memory,
  // shape test, etc.) are no-ops in the browser. A brief message confirms toggles.
  private applyDebugKey(letter: string): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    const godmodeOff = nearOffsetForRuntimeSymbol("_godmode");
    const noclipOff = nearOffsetForRuntimeSymbol("_noclip");
    const result = DebugKeys({
      key: letter,
      godmode: this.dgroup.u16(godmodeOff) !== 0,
      noclip: this.dgroup.u16(noclipOff) !== 0,
      value: this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 2, // warp target = next floor (mapon+1)
    });
    if (!result.handled) {
      return;
    }
    switch (result.action) {
      case "god-mode":
        this.dgroup.setU16(godmodeOff, result.godmode ? 1 : 0);
        this.pressedScans.clear();
        this.showMessage(`God Mode ${result.godmode ? "ON" : "OFF"}`, () => this.returnToGame());
        return;
      case "no-clip":
        this.dgroup.setU16(noclipOff, result.noclip ? 1 : 0);
        this.pressedScans.clear();
        this.showMessage(`No Clipping ${result.noclip ? "ON" : "OFF"}`, () => this.returnToGame());
        return;
      case "free-items":
        this.dgroup.setU16(gs + GAMESTATE_HEALTH_OFFSET, 100);
        this.dgroup.setU16(gs + GAMESTATE_AMMO_OFFSET, 99);
        this.dgroup.setU16(gs + GAMESTATE_KEYS_OFFSET, 3);
        break;
      case "hurt-self": {
        const h = Math.max(0, this.gamestateU16(GAMESTATE_HEALTH_OFFSET) - (result.value ?? 16));
        this.dgroup.setU16(gs + GAMESTATE_HEALTH_OFFSET, h);
        break;
      }
      case "warp":
        this.dgroup.setU16(gs + GAMESTATE_MAPON_OFFSET, (result.value ?? 0) % 10);
        this.loadLevel();
        return;
      default:
        return; // DOS-only diagnostics: no browser effect
    }
    this.drawStatusBar();
    this.present("PLAYLOOP");
  }

  private applyMLICheat(): void {
    const gs = nearOffsetForRuntimeSymbol("_gamestate");
    this.dgroup.setU16(gs + GAMESTATE_HEALTH_OFFSET, 100);
    this.dgroup.setU16(gs + GAMESTATE_AMMO_OFFSET, 99);
    this.dgroup.setU16(gs + GAMESTATE_KEYS_OFFSET, 3);
    this.dgroup.setU32(gs + GAMESTATE_SCORE_OFFSET, 0);
    this.dgroup.setU16(gs + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
    this.dgroup.setU16(gs + GAMESTATE_BESTWEAPON_OFFSET, WP_CHAINGUN);
    this.dgroup.setU16(gs + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
    // WL_PLAY.C CheckKeys MLI cheat also does gamestate.TimeCount += 42000 — pushing level time past
    // par so the cheat zeroes the time bonus on the next intermission (matching the CHEATER text).
    this.dgroup.setU32(gs + GAMESTATE_TIMECOUNT_OFFSET, (this.dgroup.u32(gs + GAMESTATE_TIMECOUNT_OFFSET) + 42000) >>> 0);
    SD_PlaySound(ENDBONUS2SND); // a little chime to confirm (original shows the CHEATER message)
    this.drawStatusBar();
    this.present("PLAYLOOP");
  }

  private drawStatusBar(): void {
    if (!this.pictable) {
      return;
    }
    const options = { pictable: this.pictable };
    DrawFace(this.dgroup, options);
    DrawHealth(this.dgroup, options);
    DrawLives(this.dgroup, options);
    DrawLevel(this.dgroup, options);
    DrawAmmo(this.dgroup, options);
    DrawKeys(this.dgroup, options);
    DrawWeapon(this.dgroup, options);
    DrawScore(this.dgroup, options);
  }

  private present(screen: string): void {
    const player = this.dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    this.surface.setPaletteFromVgaDac(currentPalette);
    this.surface.copyFromPlanarVga(videoPlanes, displayPageBase(displayofs), linewidth);
    this.surface.present();
    this.canvas.dataset.wolfsrcScreen = screen;
    this.canvas.dataset.wolfsrcMode = this.mode;
    this.canvas.dataset.wolfsrcMenuSelection = `${MainItems.curpos},${NewEitems.curpos},${NewItems.curpos}`;
    const episode = this.gamestateU16(GAMESTATE_EPISODE_OFFSET);
    const mapon = this.gamestateU16(GAMESTATE_MAPON_OFFSET);
    this.canvas.dataset.wolfsrcEpisode = String(episode);
    this.canvas.dataset.wolfsrcMap = String(mapon);
    this.canvas.dataset.wolfsrcMapIndex = String(episode * 10 + mapon);
    this.canvas.dataset.wolfsrcFrame = String(this.frames++);
    this.canvas.dataset.wolfsrcHealth = String(this.gamestateU16(GAMESTATE_HEALTH_OFFSET));
    this.canvas.dataset.wolfsrcAmmo = String(this.gamestateU16(GAMESTATE_AMMO_OFFSET));
    this.canvas.dataset.wolfsrcLives = String(this.gamestateU16(GAMESTATE_LIVES_OFFSET));
    this.canvas.dataset.wolfsrcWeapon = String(this.gamestateU16(GAMESTATE_WEAPON_OFFSET));
    this.canvas.dataset.wolfsrcScore = String(this.dgroup.u32(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_SCORE_OFFSET));
    const sound = SD_DebugState();
    this.canvas.dataset.wolfsrcSoundMode = String(sound.SoundMode);
    this.canvas.dataset.wolfsrcSoundNumber = String(sound.SoundNumber);
    this.canvas.dataset.wolfsrcPcLengthLeft = String(sound.pcLengthLeft);
    if (player) {
      this.canvas.dataset.wolfsrcPlayerTile = `${this.dgroup.u16(player + OBJ_TILEX_OFFSET)},${this.dgroup.u16(player + OBJ_TILEY_OFFSET)}`;
      this.canvas.dataset.wolfsrcPlayerAngle = String(this.dgroup.u16(player + OBJ_ANGLE_OFFSET));
    }
  }

  private gamestateU16(offset: number): number {
    return this.dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + offset);
  }

  // present() copies the displayed image from displayPageBase(displayofs). During play ThreeDRefresh
  // page-flips and leaves displayofs = pageBase + screenofs on a non-zero play page, so a full-screen
  // menu/intermission that draws to page 0 (or VW_UpdateScreen-copies to the unaligned displayofs)
  // would show a stale, shifted game frame. Full-screen-takeover screens must page-0-align both
  // pointers on entry (matching loadLevel/startDemo) so draw + copy + present all agree.
  private toMenuPage(): void {
    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
  }

  private installInput(): void {
    this.canvas.focus();
    this.canvas.addEventListener("click", () => {
      this.canvas.focus();
      this.audio.resume();
      // Clicking the play view captures the pointer for mouse-look (Esc / blur releases it).
      if (this.mode === "play" && !this.pointerLocked) {
        this.canvas.requestPointerLock?.();
      }
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      // Dropping the lock clears any in-flight mouse motion/buttons so they don't stick.
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
      this.mouseButtons = 0;
    });
    this.canvas.addEventListener("mousemove", (event) => {
      if (this.pointerLocked) {
        this.mouseDeltaX += event.movementX;
        this.mouseDeltaY += event.movementY;
      }
    });
    this.canvas.addEventListener("mousedown", (event) => {
      if (this.pointerLocked) {
        event.preventDefault();
        this.mouseButtons |= 1 << (event.button === 1 ? 2 : event.button === 2 ? 1 : 0);
      }
    });
    this.canvas.addEventListener("mouseup", (event) => {
      if (this.pointerLocked) {
        event.preventDefault();
        this.mouseButtons &= ~(1 << (event.button === 1 ? 2 : event.button === 2 ? 1 : 0));
      }
    });
    this.canvas.addEventListener("contextmenu", (event) => {
      if (this.pointerLocked) {
        event.preventDefault(); // right-click is "use"/strafe in-game, not the context menu
      }
    });
    window.addEventListener("blur", () => {
      this.pressedScans.clear();
      this.mouseButtons = 0;
    });
    window.addEventListener("keydown", (event) => this.setKey(event, true));
    window.addEventListener("keyup", (event) => this.setKey(event, false));
  }

  private setKey(event: KeyboardEvent, down: boolean): void {
    if (down) {
      this.lastInputTime = performance.now(); // any input resets the attract-demo idle timer
    }
    // The death + level-start fizzle + Get-Psyched screens run to completion non-interactively.
    if (this.mode === "dying" || this.mode === "fizzle" || this.mode === "getpsyched") {
      return;
    }
    // Any-key message overlay (WL_MENU.C Message + IN_Ack): the next keypress dismisses it.
    if (this.mode === "message") {
      if (down && !event.repeat) {
        event.preventDefault();
        this.audio.resume();
        this.resolveMessage();
      }
      return;
    }
    // Y/N confirm dialog (WL_MENU.C Confirm): Y accepts, N or Esc declines. Swallows other keys.
    if (this.mode === "confirm") {
      if (down && !event.repeat) {
        if (event.code === "KeyY" || event.code === "Enter") {
          event.preventDefault();
          this.audio.resume();
          this.resolveConfirm(true);
        } else if (event.code === "KeyN" || event.code === "Escape") {
          event.preventDefault();
          this.audio.resume();
          this.resolveConfirm(false);
        }
      }
      return;
    }
    // Pre-menu attract intro (PG13/title/credits): any key skips straight to the main menu, exactly
    // as DOS DemoLoop breaks out of the title rotation into US_ControlPanel on IN_UserInput.
    if (this.mode === "intro") {
      if (down && !event.repeat) {
        event.preventDefault();
        this.audio.resume();
        this.showMainMenu();
      }
      return;
    }
    // High-score name entry captures RAW character input (any printable key, incl. ones not in
    // the DOS scancode map), so it must intercept before the scancode lookup.
    if (this.mode === "highscores" && this.highScoreEntryIndex >= 0) {
      if (down && !event.repeat) {
        event.preventDefault();
        this.audio.resume();
        this.handleHighScoreEntryKey(event);
      }
      return;
    }
    // Typing a save-slot name captures RAW character input before the scancode lookup.
    if (this.mode === "loadsave" && this.loadSaveState?.entryName !== null && this.loadSaveState) {
      if (down && !event.repeat) {
        event.preventDefault();
        this.audio.resume();
        this.handleSaveNameKey(event);
      }
      return;
    }
    // Any key exits the attract-mode demo back to the main menu (like the DOS title loop).
    if (this.mode === "demo") {
      if (down && !event.repeat) {
        event.preventDefault();
        this.audio.resume();
        this.demoState = null;
        this.showMainMenu();
      }
      return;
    }
    // Pause (WL_PLAY.C CheckKeys): the Pause key isn't a normal game scancode, so handle it before
    // the scancode lookup. While paused, ANY keydown resumes; otherwise the Pause key freezes play.
    if (this.mode === "play" && down && !event.repeat) {
      if (this.paused) {
        event.preventDefault();
        this.paused = false;
        SD_MusicOn();              // resume the song (WL_PLAY.C CheckKeys SD_MusicOn after pause)
        this.pressedScans.clear(); // the resuming key shouldn't leak into held movement
        this.renderFrame();        // redraw the live frame, clearing PAUSEDPIC
        return;
      }
      if (event.code === "Pause") {
        event.preventDefault();
        this.audio.resume();
        this.paused = true;
        SD_MusicOff(); // silence the song while paused (WL_PLAY.C CheckKeys SD_MusicOff)
        this.pressedScans.clear();
        this.drawPaused();
        return;
      }
    }
    const scan = KEY_SCAN_CODES[event.code];
    if (scan === undefined) {
      return;
    }
    event.preventDefault();
    if (down) {
      this.audio.resume();
    }
    IN_SetKeyboardState(scan, down, down ? asciiForKey(event.key) : 0);
    if (this.mode !== "play") {
      if (down && !event.repeat) {
        this.handleMenuScan(scan);
      }
      return;
    }
    if (down && !event.repeat && scan === sc_Escape) {
      this.pressedScans.delete(scan);
      this.showMainMenu();
      return;
    }
    // In-game help (WL_PLAY.C CheckKeys → US_ControlPanel(F1) → HelpScreens). F1 shows the help
    // article, then resumes play.
    if (down && !event.repeat && scan === sc_F1) {
      event.preventDefault();
      this.pressedScans.clear();
      const info = HelpScreens();
      const chunk = typeof info.chunkOrFile === "number" ? info.chunkOrFile : -1;
      this.showArticle(chunk, () => this.returnToGame());
      return;
    }
    // In-game save/load (WL_PLAY.C CheckKeys → US_ControlPanel(F2/F3)). F2 saves, F3 loads; both
    // open the 10-slot screen and resume play when done/cancelled.
    if (down && !event.repeat && scan === sc_F2) {
      this.pressedScans.clear();
      this.showLoadSaveScreen("save", true);
      return;
    }
    if (down && !event.repeat && scan === sc_F3 && this.hasSavedGame()) {
      this.pressedScans.clear();
      this.showLoadSaveScreen("load", true);
      return;
    }
    // In-game Sound options (WL_PLAY.C CheckKeys → US_ControlPanel(F4) → CP_Sound).
    if (down && !event.repeat && scan === sc_F4) {
      event.preventDefault();
      this.pressedScans.clear();
      this.showSoundMenu(true);
      return;
    }
    // In-game Change View (WL_PLAY.C CheckKeys → US_ControlPanel(F5) → CP_ChangeView): resize the
    // viewport, then resume play.
    if (down && !event.repeat && scan === sc_F5) {
      event.preventDefault();
      this.pressedScans.clear();
      this.showChangeView(true);
      return;
    }
    // In-game Control options (WL_PLAY.C CheckKeys → US_ControlPanel(F6) → CP_Control).
    if (down && !event.repeat && scan === sc_F6) {
      event.preventDefault();
      this.pressedScans.clear();
      this.showControlMenu(true);
      return;
    }
    // In-game End Game (WL_PLAY.C CheckKeys → US_ControlPanel(F7) → CP_CheckQuick): confirm, then
    // end the run to the high-score table (recording the score reached), or resume play on N.
    if (down && !event.repeat && scan === sc_F7) {
      event.preventDefault();
      this.pressedScans.clear();
      const completed = this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 1;
      this.showConfirm(ENDGAMESTR, () => {
        this.hasGame = false;
        this.recordHighScoreAndShow(completed);
      }, () => this.returnToGame());
      return;
    }
    // In-game F8/F9 quicksave/quickload (WL_PLAY.C CheckKeys → CP_CheckQuick): open the slot screen.
    if (down && !event.repeat && scan === sc_F8) {
      event.preventDefault();
      this.pressedScans.clear();
      this.showLoadSaveScreen("save", true);
      return;
    }
    if (down && !event.repeat && scan === sc_F9 && this.hasSavedGame()) {
      event.preventDefault();
      this.pressedScans.clear();
      this.showLoadSaveScreen("load", true);
      return;
    }
    // In-game Quit (WL_PLAY.C CheckKeys → US_ControlPanel(F10) → CP_Quit): a random taunt + confirm;
    // the browser returns to the attract title on Y rather than exiting.
    if (down && !event.repeat && scan === sc_F10) {
      event.preventDefault();
      this.pressedScans.clear();
      const index = Math.min((US_RndT() & 0x7) + (US_RndT() & 1), endStrings.length - 1);
      this.showConfirm(endStrings[index], () => {
        this.hasGame = false;
        this.startIntro();
      }, () => this.returnToGame());
      return;
    }
    if (down) {
      this.pressedScans.add(scan);
      // WL_PLAY.C CheckKeys: with DebugOk set, TAB + a letter runs WL_DEBUG.C DebugKeys (god mode,
      // no clip, free items, warp, etc.). Gated behind ?debug, like the original 'goobers' parm.
      if (this.debugOk && !event.repeat && this.pressedScans.has(sc_Tab) && /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        this.applyDebugKey(event.key.toUpperCase());
        return;
      }
      // WL_PLAY.C CheckKeys retail cheat: M+L+I held → full health/ammo/keys + chaingun, then the
      // STR_CHEATER message (which warns the high score is forfeit).
      if (!event.repeat && this.pressedScans.has(sc_M) && this.pressedScans.has(sc_L) && this.pressedScans.has(sc_I)) {
        this.applyMLICheat();
        this.pressedScans.clear();
        this.showMessage(CHEATER_MESSAGE, () => this.returnToGame());
        return;
      }
      // WL_PLAY.C CheckKeys: B+A+T held → the Commander Keen flavor message (no state change).
      if (!event.repeat && this.pressedScans.has(sc_B) && this.pressedScans.has(sc_A) && this.pressedScans.has(sc_T)) {
        this.pressedScans.clear();
        this.showMessage(KEEN_MESSAGE, () => this.returnToGame());
        return;
      }
    } else {
      this.pressedScans.delete(scan);
    }
  }
}

async function loadWl6RuntimeFiles(): Promise<Wl6RuntimeFiles> {
  const [MAPHEAD, GAMEMAPS, VGAHEAD, VGAGRAPH, VGADICT, VSWAP, AUDIOHED, AUDIOT, CONFIG, GAMEPAL] = await Promise.all([
    fetchBytes("/__source-typescript/asset/MAPHEAD.WL6"),
    fetchBytes("/__source-typescript/asset/GAMEMAPS.WL6"),
    fetchBytes("/__source-typescript/asset/VGAHEAD.WL6"),
    fetchBytes("/__source-typescript/asset/VGAGRAPH.WL6"),
    fetchBytes("/__source-typescript/asset/VGADICT.WL6"),
    fetchBytes("/__source-typescript/asset/VSWAP.WL6"),
    fetchBytes("/__source-typescript/asset/AUDIOHED.WL6"),
    fetchBytes("/__source-typescript/asset/AUDIOT.WL6"),
    fetchBytes("/__source-typescript/asset/CONFIG.WL6"),
    fetchBytes("/__source-typescript/source/OBJ/GAMEPAL.OBJ"),
  ]);
  return { MAPHEAD, GAMEMAPS, VGAHEAD, VGAGRAPH, VGADICT, VSWAP, AUDIOHED, AUDIOT, CONFIG, GAMEPAL };
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function cacheMenuGraphics(): Array<Uint8Array | null> {
  const chunks: Array<Uint8Array | null> = [];
  chunks[STARTFONT + 1] = requireGraphicChunk(STARTFONT + 1);
  for (let chunk = CONTROLS_LUMP_START; chunk <= CONTROLS_LUMP_END; chunk++) {
    chunks[chunk] = requireGraphicChunk(chunk);
  }
  return chunks;
}

function cacheLatchGraphics(): Array<Uint8Array | null> {
  const chunks: Array<Uint8Array | null> = [];
  chunks[STARTTILE8] = requireGraphicChunk(STARTTILE8);
  for (let chunk = LATCHPICS_LUMP_START; chunk <= LATCHPICS_LUMP_END; chunk++) {
    chunks[chunk] = requireGraphicChunk(chunk);
  }
  return chunks;
}

// LEVELEND lump (GFXV_WL6.H: LEVELEND_LUMP_START=43=L_GUYPIC .. LEVELEND_LUMP_END=85) — the BJ
// figure, number/colon/percent/letter pics that the floor-completed intermission screen draws.
const LEVELEND_LUMP_START = L_GUYPIC; // 43
const LEVELEND_LUMP_END = 85;
function cacheLevelEndGraphics(): Array<Uint8Array | null> {
  const chunks: Array<Uint8Array | null> = [];
  for (let chunk = LEVELEND_LUMP_START; chunk <= LEVELEND_LUMP_END; chunk++) {
    chunks[chunk] = requireGraphicChunk(chunk);
  }
  return chunks;
}

// High-score table graphics: the title pic (HIGHSCORESPIC=90), font 0 (STARTFONT=1) for the
// name/level/score text, and the C_NAME/C_LEVEL/C_SCORE column headers (39/38/40, which live in
// the menu CONTROLS lump but are cached here too so drawHighScores has a single lookup table).
function cacheHighScoreGraphics(): Array<Uint8Array | null> {
  const chunks: Array<Uint8Array | null> = [];
  for (const chunk of [HIGHSCORESPIC, STARTFONT, 38, 39, 40]) {
    chunks[chunk] = requireGraphicChunk(chunk);
  }
  return chunks;
}

// Save images are raw bytes; localStorage holds strings, so round-trip through base64.
function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function bytesFromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}

// True when the page URL requests skipping the pre-menu attract intro (`?nointro`). This is a
// test/automation hook (the browser-smoke gate uses it for a deterministic menu screenshot); a
// normal launch has no query string and shows the full intro.
function skipIntroRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has("nointro");
  } catch {
    return false;
  }
}

// `?debug` enables the TAB debug keys — the browser analog of DOS' 'goobers' command-line parm +
// Alt+LShift+BackSpace unlock that gated WL_DEBUG.C DebugKeys in the shipped retail build.
function debugRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
}

function requireGraphicChunk(chunk: number): Uint8Array {
  const decoded = CA_CacheGrChunk(chunk);
  if (!decoded) {
    throw new Error(`Missing graphics chunk ${chunk}`);
  }
  return decoded;
}

function readGamePaletteObject(objectBytes: Uint8Array): Uint8Array {
  // GAMEPAL.OBJ is an OMF object file; the 768-byte _gamepal array lives inside the LEDATA
  // record (type 0xA0) at file 0x71. LEDATA's payload is [segIndex:1][dataOffset:2][raw…],
  // so the palette bytes start at 0x74 + 3 = 0x77 — NOT 0x76 (that off-by-one prepends the
  // data-offset high byte and shifts every RGB triplet, scrambling all colors). Verified: at
  // 0x77 colors 0-7 are the canonical Wolf3D palette (0,0,0)(0,0,42)(0,42,0)… in 6-bit DAC.
  const payloadOffset = 0x77;
  const paletteBytes = 256 * 3;
  const palette = objectBytes.subarray(payloadOffset, payloadOffset + paletteBytes);
  if (palette.length !== paletteBytes) {
    throw new Error(`GAMEPAL.OBJ did not contain ${paletteBytes} palette bytes at 0x${payloadOffset.toString(16)}`);
  }
  return palette;
}

function structFieldOffset(layout: keyof typeof STRUCT_LAYOUTS, name: string): number {
  const field = STRUCT_LAYOUTS[layout].fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing ${layout} field ${name}`);
  }
  return field[1];
}

function displayPageBase(offset: number): number {
  return Math.trunc((offset & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
}

function asciiForKey(key: string): number {
  if (key.length === 1) {
    return key.charCodeAt(0) & 0xff;
  }
  if (key === "Enter") {
    return 13;
  }
  if (key === "Escape") {
    return 27;
  }
  if (key === " ") {
    return 32;
  }
  return 0;
}

void new BrowserWolf3DRuntime(canvas, surface).start().catch((error: unknown) => {
  console.error(error);
  canvas.dataset.wolfsrcScreen = "BOOT_ERROR";
  surface.clear(4);
  surface.present();
});
