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
  CA_LoadAllSounds,
  CA_CacheMap,
  CA_Startup,
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
import { sdm_AdLib, sds_SoundBlaster, smm_AdLib } from "./WOLFSRC/ID_SD.H";
import { US_InitRndT } from "./WOLFSRC/ID_US_A.ASM";
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
  L_GUYPIC,
  LATCHPICS_LUMP_END,
  LATCHPICS_LUMP_START,
  MAPSIZE,
  PAUSEDPIC,
  STARTFONT,
  STARTTILE8,
  STATUSBARPIC,
  STRUCTPIC,
} from "./WOLFSRC/TS_WL6_ASSETS";
import {
  STRUCT_LAYOUTS,
  getSaveRecord,
  nearOffsetForRuntimeSymbol,
  serializeSaveGame,
} from "./WOLFSRC/TS_SAVE_LAYOUT";
import { Died, DrawPlayScreen, SetupGameLevel } from "./WOLFSRC/WL_GAME.C";
import { CheckHighScore, DrawHighScores, LevelCompleted, Victory, Write, type LevelCompletedSummary, type VictorySummary } from "./WOLFSRC/WL_INTER.C";
import { Scores } from "./WOLFSRC/ID_US_1.C";
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
  SetupControlPanel,
  ShootSnd,
} from "./WOLFSRC/WL_MENU.C";
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
const GAMESTATE_LIVES_OFFSET = structFieldOffset("gametype", "lives");
const GAMESTATE_HEALTH_OFFSET = structFieldOffset("gametype", "health");
const GAMESTATE_AMMO_OFFSET = structFieldOffset("gametype", "ammo");
const GAMESTATE_KEYS_OFFSET = structFieldOffset("gametype", "keys");
const GAMESTATE_WEAPON_OFFSET = structFieldOffset("gametype", "weapon");
const GAMESTATE_BESTWEAPON_OFFSET = structFieldOffset("gametype", "bestweapon");
const GAMESTATE_CHOSENWEAPON_OFFSET = structFieldOffset("gametype", "chosenweapon");
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
const MAIN_LOAD_GAME = 3;
const MAIN_SAVE_GAME = 4;
const MAIN_VIEW_SCORES = 7;
const MAIN_BACK_TO_DEMO = 8;
const MAIN_QUIT = 9;
// localStorage key prefix for the 10 browser save slots; each holds {name, data:base64} JSON
// (data = the T3 byte-identical save image).
const SAVE_SLOT_PREFIX = "wolf3d-ts-save-";
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
const ENDBONUS1SND = 42; // AUDIOWL6 sound index — the ticking sound during the bonus/ratio count-up
const PLAYERDEATHSND = 9; // AUDIOWL6 sound index — the player's death cry (WL_GAME.C Died)
const DEATH_SPIN_STEPS_PER_FRAME = 3; // rotation steps consumed per rendered frame during the death spin
const DEATH_REDFADE_FRAMES = 9; // frames spent fading the held death frame toward red before respawn/game-over
const FIZZLE_STEPS_PER_FRAME = 4096; // LFSR steps consumed per rendered frame during the level-start fizzle
// AdLib music mode services the timer at ~700 Hz; at the 70 Hz tic rate that's 10 t0 services/tic.
// SDL_t0Service's own dispatch then yields 700 Hz music, 140 Hz sound effects, and 70 Hz TimeCount.
const T0_SERVICES_PER_TIC = 10;
const PLAYLOOP_T0_SERVICES = 2; // t0 ticks PlayLoopStepMemory already services per tic (controls.tics*2)
const MENUSONG = 14; // WONDERIN_MUS — the control-panel / main-menu song (WL_MENU.C StartCPMusic)
const ENDLEVEL_MUS = 16; // floor-completed intermission (WL_INTER.C LevelCompleted)
const ROSTER_MUS = 23; // high-score table (WL_MENU.C CheckHighScore)
const URAHERO_MUS = 24; // episode victory (WL_INTER.C Victory)

type RuntimeMode = "boot" | "menu" | "episode" | "difficulty" | "play" | "intermission" | "victory" | "highscores" | "demo" | "loadsave" | "dying" | "fizzle";

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
  // Timestamp (performance.now) of the last user input; the menu auto-starts demos when idle.
  private lastInputTime = 0;
  private mode: RuntimeMode = "boot";
  private hasGame = false;
  private selectedEpisode = 0;
  private lastFrameTime = 0;
  private tickAccumulator = 0;
  private frames = 0;

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
    WL_MAIN.BuildTables();
    WL_MAIN.SetupWalls();
    WL_MAIN.NewViewSize(config.viewsize);
    SD_SetSoundMode(sdm_AdLib);

    VL_SetBufferOffset(0);
    VL_SetScreen(0, 0);
    this.showMainMenu();
    requestAnimationFrame(this.tick);
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
      // the rotation/fade and resolves into respawn or game over.
      this.advanceDying();
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode === "fizzle") {
      // The level-start dissolve (ID_VH.C FizzleFade) — no tics run until the screen is revealed.
      this.advanceFizzle();
      this.audio.serviceAdLib();
      requestAnimationFrame(this.tick);
      return;
    }
    if (this.mode !== "play") {
      this.lastFrameTime = frameTime;
      // Service the sound timer so AdLib menu sounds + music advance, then hand the resulting
      // register writes to the OPL2 emulator (no game tics run outside "play").
      for (let i = 0; i < T0_SERVICES_PER_TIC; i++) {
        SDL_t0Service();
      }
      // Drive the bonus/ratio count-up on the intermission + victory screens.
      if (this.mode === "intermission" && this.intermissionAnim && this.intermissionAnim.stage <= 3) {
        this.advanceIntermission();
      } else if (this.mode === "victory" && this.victoryAnim && this.victoryAnim.stage <= 2) {
        this.advanceVictory();
      }
      // Attract mode: auto-start the demo loop after the main menu sits idle (the title loop).
      if (this.mode === "menu" && frameTime - this.lastInputTime > MENU_IDLE_MS) {
        this.startDemo(0);
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
      case sc_Control:
        this.selectedEpisode = Math.trunc(NewEitems.curpos / 2);
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.showDifficultyMenu();
        return;
      case sc_Escape:
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
      case sc_Control:
        ShootSnd();
        this.audio.syncFromSoundState(true);
        this.beginGame(this.selectedEpisode, NewItems.curpos);
        return;
      case sc_Escape:
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
          this.startDemo(0); // attract-mode demo loop
        }
        return;
      case MAIN_QUIT:
        this.canvas.dataset.wolfsrcScreen = "MENU_QUIT";
        return;
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
  private loadLevel(): void {
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
    // Render the first frame and dissolve it in (WL_GAME.C fizzles the view in on level start).
    this.renderFrame();
    this.beginFizzleIn();
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
            this.loadSaveState = null;
            this.loadGameFromSlot(slot);
          }
        } else {
          // begin typing a name: prefill an OCCUPIED slot with its existing name (to edit/overwrite),
          // start an empty slot blank. An empty name on confirm falls back to "floor N".
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
      this.startDemo(a.demoIndex + 1); // next demo in the attract loop
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
        if (this.pointerLocked) {
          PollMouseButtons(dgroup, this.mouseButtons);
          PollMouseMove(dgroup, this.mouseDeltaX, this.mouseDeltaY);
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
      this.renderFrame(); // derives viewangle from the player angle (no context passed)
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
      this.loadLevel();
    } else {
      // Game over (no lives left): record the score into the high-score table and show it.
      this.hasGame = false;
      this.dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), 0);
      const completed = this.gamestateU16(GAMESTATE_MAPON_OFFSET);
      this.recordHighScoreAndShow(completed);
    }
  }

  // Draw the WL_INTER.C floor-completed intermission screen (BJ figure + bonus/time/par and
  // kill/secret/treasure ratios) with the level's FINAL stats, then present it. The DOS version
  // animates each value counting up; this shows the settled values (a faithful static layout —
  // count-up animation is a follow-up). Boss floors (mapon >= 8) get the minimal completed panel.
  private drawIntermission(summary: LevelCompletedSummary, shown?: IntermissionShown): void {
    const s = shown ?? { bonus: summary.bonus, kill: summary.ratios.kill, secret: summary.ratios.secret, treasure: summary.ratios.treasure };
    const opt = { chunks: this.levelEndChunks, pictable: this.pictable ?? undefined };
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
      Write(14, 4, "floor\ncompleted", opt);
      Write(14, 9, "bonus", opt);
      Write(36 - bonusStr.length * 2, 9, bonusStr, opt);
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
    if (value >= target) {
      value = target;
      a.stage++;
    }
    a.shown[field] = value;
    if (a.soundCounter++ % 4 === 0) {
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
  private handleIntermissionScan(scan: ScanCode): void {
    if (scan !== sc_Enter && scan !== sc_Space && scan !== sc_Control) {
      return;
    }
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
  private handleVictoryScan(scan: ScanCode): void {
    if (scan !== sc_Enter && scan !== sc_Space && scan !== sc_Control) {
      return;
    }
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
    this.recordHighScoreAndShow(this.gamestateU16(GAMESTATE_MAPON_OFFSET) + 1);
  }

  // Draw the WL_INTER.C high-score table (HIGH SCORES title + NAME/LEVEL/SCORE columns + the 7
  // entries) and present it. drawPic blits the title/header pics from the cached lookup; print
  // renders each row's name/level/score via the proportional font (VW_SetFontState px/py). When
  // `entryIndex` >= 0 the player is typing that row's name — redraw it with a trailing cursor.
  private showHighScores(entryIndex = -1): void {
    this.mode = "highscores";
    this.playSong(ROSTER_MUS); // WL_MENU.C CheckHighScore plays the roster song
    this.highScoreEntryIndex = entryIndex;
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

  private renderFrame(): void {
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
    this.drawStatusBar();
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
    // The death + level-start fizzle animations run to completion non-interactively; swallow input.
    if (this.mode === "dying" || this.mode === "fizzle") {
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
    if (down) {
      this.pressedScans.add(scan);
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
