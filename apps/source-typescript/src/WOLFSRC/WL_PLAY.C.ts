import { cdiv, i16 } from "./TS_C";
import { DOSMemory } from "./TS_DOS_MEMORY";
import { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";
import { US_DrawWindow, type WindowSummary } from "./ID_US_1.C";
import {
  sc_A,
  sc_Alt,
  sc_B,
  sc_BackSpace,
  sc_Escape,
  sc_F1,
  sc_F7,
  sc_F8,
  sc_F9,
  sc_F10,
  sc_G,
  sc_I,
  sc_L,
  sc_LShift,
  sc_M,
  sc_Tab,
  sc_T,
} from "./ID_IN.H";
import {
  DoActorMemory,
  ClearPaletteShiftsMemory,
  FinishPaletteShiftsMemory,
  GetNewActorMemory,
  InitActorListMemory,
  PollControlsMemory,
  PlayLoopStepMemory,
  RemoveObjMemory,
  StartBonusFlashMemory,
  StartDamageFlashMemory,
  UpdatePaletteShiftsMemory,
  type ActorListSummary,
  type ActorStepSummary,
  type PaletteShiftSummary,
  type PathStepOptions,
  type PollControlsOptions,
  type PollControlsSummary,
  type PlayLoopStepOptions,
  type PlayLoopStepSummary,
  type RemoveObjSummary,
  type SightPlayerOptions,
} from "./TS_LEVEL_SETUP";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_PLAY.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_PLAY.C";
export const WOLFSRC_FUNCTIONS = [
  "CenterWindow",
  "CheckKeys",
  "ClearPaletteShifts",
  "DoActor",
  "FinishPaletteShifts",
  "GetNewActor",
  "InitActorList",
  "InitRedShifts",
  "PlayLoop",
  "PollControls",
  "PollJoystickButtons",
  "PollJoystickMove",
  "PollKeyboardButtons",
  "PollKeyboardMove",
  "PollMouseButtons",
  "PollMouseMove",
  "RemoveObj",
  "StartBonusFlash",
  "StartDamageFlash",
  "StartMusic",
  "StopMusic",
  "UpdatePaletteShifts"
] as const;

const STARTMUSIC = 261;
const LASTMUSIC = 27;
const NUMREDSHIFTS = 6;
const REDSTEPS = 8;
const NUMWHITESHIFTS = 3;
const WHITESTEPS = 20;
export const NUMBUTTONS = 8;
const BASEMOVE = 35;
const RUNMOVE = 70;
const JOYSCALE = 2;
export const bt_nobutton = -1;
export const bt_attack = 0;
export const bt_strafe = 1;
export const bt_run = 2;
export const bt_use = 3;
const BT_NOBUTTON = bt_nobutton;
const BT_ATTACK = bt_attack;
const BT_STRAFE = bt_strafe;
const BT_RUN = bt_run;
const BT_USE = bt_use;
const DIR_NORTH = 0;
const DIR_EAST = 1;
const DIR_SOUTH = 2;
const DIR_WEST = 3;
export const dirscan: number[] = [0x48, 0x4d, 0x50, 0x4b];
export const buttonscan: number[] = [0x1d, 0x38, 0x36, 0x39, 0x02, 0x03, 0x04, 0x05];
export const buttonmouse: number[] = [BT_ATTACK, BT_STRAFE, BT_USE, BT_NOBUTTON];
export const buttonjoy: number[] = [BT_ATTACK, BT_STRAFE, BT_USE, BT_RUN];
const SONGS = [
  3, 11, 9, 12, 3, 11, 9, 12, 2, 0,
  8, 18, 17, 4, 8, 18, 4, 17, 2, 1,
  6, 20, 22, 21, 6, 20, 22, 21, 19, 26,
  3, 11, 9, 12, 3, 11, 9, 12, 2, 0,
  8, 18, 17, 4, 8, 18, 4, 17, 2, 1,
  6, 20, 22, 21, 6, 20, 22, 21, 19, 15,
] as const;
const WINDOW_MAXX = 320;
const WINDOW_MAXY = 160;
const WP_CHAINGUN = 3;
const EX_ABORT = 7;

interface MusicState {
  musicOn: boolean;
  lockedChunk: number | null;
  purgedChunks: readonly number[];
}

export interface StopMusicSummary {
  readonly musicOn: boolean;
  readonly purgedChunks: readonly number[];
}

export interface StartMusicSummary {
  readonly mapon: number;
  readonly episode: number;
  readonly songIndex: number;
  readonly chunk: number;
  readonly audioChunk: number;
  readonly started: boolean;
  readonly musicOn: boolean;
  readonly lockedChunk: number | null;
}

export interface RedShiftTables {
  readonly redshifts: readonly Uint8Array[];
  readonly whiteshifts: readonly Uint8Array[];
}

export type ScanCodeInput = readonly number[] | ReadonlySet<number>;

export interface ButtonPollSummary {
  readonly buttonstate: readonly boolean[];
}

export interface MovePollSummary {
  readonly controlx: number;
  readonly controly: number;
}

export interface PlayLoopOptions extends PlayLoopStepOptions {
  readonly maxSteps?: number;
}

export interface PlayLoopSummary {
  readonly steps: number;
  readonly completed: boolean;
  readonly playstate: number;
  readonly lastStep: PlayLoopStepSummary | null;
}

export interface CenterWindowSummary extends WindowSummary {
  readonly fixOfs: true;
}

export interface CheckKeysOptions {
  readonly pressed?: ScanCodeInput;
  readonly lastScan?: number;
  readonly screenfaded?: boolean;
  readonly demoplayback?: boolean;
  readonly paused?: boolean;
  readonly spear?: boolean;
  readonly loadedgame?: boolean;
  readonly startgame?: boolean;
  readonly debugOk?: boolean;
  readonly checkParm?: (name: string) => boolean;
}

export interface CheckKeysSummary {
  readonly action:
    | "ignored"
    | "none"
    | "godmode"
    | "mli-cheat"
    | "enable-debug"
    | "keen-cheat"
    | "pause"
    | "quick-control-panel"
    | "control-panel"
    | "debug-keys";
  readonly scan: number;
  readonly godmode: boolean;
  readonly debugOk: boolean;
  readonly clearKeys: boolean;
  readonly ack: boolean;
  readonly redraw:
    | null
    | "all-play-border"
    | "play-border-sides"
    | "play-screen";
  readonly message: string | null;
  readonly sound: string | null;
  readonly controlPanelScan: number | null;
  readonly stopMusic: boolean;
  readonly startMusic: boolean;
  readonly fadeOut: boolean;
  readonly fadeIn: boolean;
  readonly playstate: number | null;
}

const MUSIC_STATES = new WeakMap<DOSMemory, MusicState>();
export let singlestep = false;
export let godmode = false;
export let noclip = false;
export let DebugOk = 0;

export function CenterWindow(w: number, h: number): CenterWindowSummary {
  return {
    ...US_DrawWindow(Math.trunc(((WINDOW_MAXX / 8) - w) / 2), Math.trunc(((WINDOW_MAXY / 8) - h) / 2), w, h),
    fixOfs: true,
  };
}

export function CheckKeys(dgroup?: DOSMemory, options: CheckKeysOptions = {}): CheckKeysSummary {
  const pressed = options.pressed ?? [];
  const scan = Math.trunc(options.lastScan ?? 0);
  const has = (scanCode: number) => scanPressed(pressed, scanCode);
  const checkParm = (name: string) => options.checkParm?.(name) ?? false;
  const summary = (
    action: CheckKeysSummary["action"],
    overrides: Partial<Omit<CheckKeysSummary, "action" | "scan" | "godmode" | "debugOk">> = {},
  ): CheckKeysSummary => ({
    action,
    scan,
    godmode,
    debugOk: DebugOk !== 0,
    clearKeys: false,
    ack: false,
    redraw: null,
    message: null,
    sound: null,
    controlPanelScan: null,
    stopMusic: false,
    startMusic: false,
    fadeOut: false,
    fadeIn: false,
    playstate: null,
    ...overrides,
  });

  if (options.screenfaded || options.demoplayback) {
    return summary("ignored");
  }

  if (options.spear && has(sc_Tab) && has(sc_G) && has(sc_F10)) {
    godmode = !godmode;
    return summary("godmode", {
      message: godmode ? "God mode ON" : "God mode OFF",
      sound: godmode ? "ENDBONUS2SND" : "NOBONUSSND",
      ack: true,
      clearKeys: true,
      redraw: "play-border-sides",
    });
  }

  if (has(sc_M) && has(sc_L) && has(sc_I)) {
    if (dgroup) {
      const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
      dgroup.setU16(gamestate + gamestateFieldOffset("health"), 100);
      dgroup.setU16(gamestate + gamestateFieldOffset("ammo"), 99);
      dgroup.setU16(gamestate + gamestateFieldOffset("keys"), 3);
      dgroup.setU32(gamestate + gamestateFieldOffset("score"), 0);
      dgroup.setU32(
        gamestate + gamestateFieldOffset("TimeCount"),
        dgroup.u32(gamestate + gamestateFieldOffset("TimeCount")) + 42000,
      );
      dgroup.setU16(gamestate + gamestateFieldOffset("weapon"), WP_CHAINGUN);
      dgroup.setU16(gamestate + gamestateFieldOffset("chosenweapon"), WP_CHAINGUN);
      dgroup.setU16(gamestate + gamestateFieldOffset("bestweapon"), WP_CHAINGUN);
    }
    return summary("mli-cheat", {
      message: "STR_CHEATER1",
      ack: true,
      clearKeys: true,
      redraw: "all-play-border",
    });
  }

  const debugParm = options.spear ? "debugmode" : "goobers";
  if (has(sc_BackSpace) && has(sc_LShift) && has(sc_Alt) && checkParm(debugParm)) {
    DebugOk = 1;
    return summary("enable-debug", {
      message: "Debugging keys are\nnow available!",
      ack: true,
      clearKeys: true,
      redraw: "play-border-sides",
    });
  }

  if (has(sc_B) && has(sc_A) && has(sc_T)) {
    return summary("keen-cheat", {
      message: "Commander Keen is also available from Apogee",
      ack: true,
      clearKeys: true,
      redraw: "all-play-border",
    });
  }

  if (options.paused) {
    return summary("pause", {
      ack: true,
      clearKeys: true,
      stopMusic: true,
      startMusic: true,
    });
  }

  if (scan === sc_F10 || scan === sc_F9 || scan === sc_F7 || scan === sc_F8) {
    return summary("quick-control-panel", {
      controlPanelScan: scan,
      clearKeys: true,
      redraw: "play-border-sides",
      startMusic: scan === sc_F9,
    });
  }

  if ((scan >= sc_F1 && scan <= sc_F9) || scan === sc_Escape) {
    let playstate: number | null = null;
    if (options.loadedgame) {
      playstate = EX_ABORT;
      dgroup?.setU16(nearOffsetForRuntimeSymbol("_playstate"), EX_ABORT);
    }
    return summary("control-panel", {
      controlPanelScan: scan,
      clearKeys: true,
      redraw: "play-screen",
      stopMusic: true,
      startMusic: !options.startgame && !options.loadedgame,
      fadeOut: true,
      fadeIn: !options.startgame && !options.loadedgame,
      playstate,
    });
  }

  if (has(sc_Tab) && (options.debugOk ?? DebugOk !== 0)) {
    return summary("debug-keys");
  }

  return summary("none");
}

export function ClearPaletteShifts(dgroup: DOSMemory): PaletteShiftSummary {
  return ClearPaletteShiftsMemory(dgroup);
}

export function DoActor(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions = {},
): ActorStepSummary {
  return DoActorMemory(dgroup, plane0, plane1, actor, options);
}

export function FinishPaletteShifts(dgroup: DOSMemory): PaletteShiftSummary {
  return FinishPaletteShiftsMemory(dgroup);
}

export function GetNewActor(dgroup: DOSMemory): number {
  return GetNewActorMemory(dgroup);
}

export function InitActorList(dgroup: DOSMemory): ActorListSummary {
  return InitActorListMemory(dgroup);
}

export function InitRedShifts(basePalette: Uint8Array): RedShiftTables {
  if (basePalette.length < 768) {
    throw new Error(`InitRedShifts requires a 768-byte VGA palette, got ${basePalette.length}`);
  }
  const redshifts: Uint8Array[] = [];
  const whiteshifts: Uint8Array[] = [];

  for (let i = 1; i <= NUMREDSHIFTS; i++) {
    const shift = new Uint8Array(768);
    for (let j = 0; j <= 255; j++) {
      const base = j * 3;
      shift[base] = basePalette[base] + Math.trunc((64 - basePalette[base]) * i / REDSTEPS);
      shift[base + 1] = basePalette[base + 1] + Math.trunc((0 - basePalette[base + 1]) * i / REDSTEPS);
      shift[base + 2] = basePalette[base + 2] + Math.trunc((0 - basePalette[base + 2]) * i / REDSTEPS);
    }
    redshifts.push(shift);
  }

  for (let i = 1; i <= NUMWHITESHIFTS; i++) {
    const shift = new Uint8Array(768);
    for (let j = 0; j <= 255; j++) {
      const base = j * 3;
      shift[base] = basePalette[base] + Math.trunc((64 - basePalette[base]) * i / WHITESTEPS);
      shift[base + 1] = basePalette[base + 1] + Math.trunc((62 - basePalette[base + 1]) * i / WHITESTEPS);
      shift[base + 2] = basePalette[base + 2] + Math.trunc((0 - basePalette[base + 2]) * i / WHITESTEPS);
    }
    whiteshifts.push(shift);
  }

  return { redshifts, whiteshifts };
}

export function PlayLoop(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  options: PlayLoopOptions = {},
): PlayLoopSummary {
  const maxSteps = options.maxSteps ?? 1;
  let lastStep: PlayLoopStepSummary | null = null;
  for (let step = 0; step < maxSteps; step++) {
    lastStep = PlayLoopStepMemory(dgroup, plane0, plane1, options);
    if (lastStep.playstate) {
      return {
        steps: step + 1,
        completed: true,
        playstate: lastStep.playstate,
        lastStep,
      };
    }
  }
  return {
    steps: maxSteps,
    completed: false,
    playstate: lastStep?.playstate ?? 0,
    lastStep,
  };
}

export function PollControls(
  dgroup: DOSMemory,
  options: PollControlsOptions = {},
): PollControlsSummary {
  return PollControlsMemory(dgroup, options);
}

export function PollJoystickButtons(
  dgroup: DOSMemory,
  buttons: number,
  options: { readonly joystickport?: number; readonly joypadenabled?: boolean } = {},
): ButtonPollSummary {
  if (options.joystickport && !options.joypadenabled) {
    if (buttons & 4) {
      setButtonState(dgroup, buttonjoy[0]);
    }
    if (buttons & 8) {
      setButtonState(dgroup, buttonjoy[1]);
    }
  } else {
    if (buttons & 1) {
      setButtonState(dgroup, buttonjoy[0]);
    }
    if (buttons & 2) {
      setButtonState(dgroup, buttonjoy[1]);
    }
    if (options.joypadenabled) {
      if (buttons & 4) {
        setButtonState(dgroup, buttonjoy[2]);
      }
      if (buttons & 8) {
        setButtonState(dgroup, buttonjoy[3]);
      }
    }
  }
  return buttonPollSummary(dgroup);
}

export function PollJoystickMove(
  dgroup: DOSMemory,
  joyx: number,
  joyy: number,
  options: { readonly joystickprogressive?: boolean } = {},
): MovePollSummary {
  const tics = dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1;
  const controlx = nearOffsetForRuntimeSymbol("_controlx");
  const controly = nearOffsetForRuntimeSymbol("_controly");

  if (options.joystickprogressive) {
    if (joyx > 64) {
      addControl(dgroup, controlx, (joyx - 64) * JOYSCALE * tics);
    } else if (joyx < -64) {
      addControl(dgroup, controlx, -(-joyx - 64) * JOYSCALE * tics);
    }
    if (joyy > 64) {
      addControl(dgroup, controlx, (joyy - 64) * JOYSCALE * tics);
    } else if (joyy < -64) {
      addControl(dgroup, controly, -(-joyy - 64) * JOYSCALE * tics);
    }
  } else if (buttonState(dgroup, BT_RUN)) {
    pollDigitalJoyMove(dgroup, joyx, joyy, RUNMOVE * tics);
  } else {
    pollDigitalJoyMove(dgroup, joyx, joyy, BASEMOVE * tics);
  }
  return movePollSummary(dgroup);
}

export function PollKeyboardButtons(dgroup: DOSMemory, pressed: ScanCodeInput): ButtonPollSummary {
  for (let i = 0; i < NUMBUTTONS; i++) {
    if (scanPressed(pressed, buttonscan[i])) {
      setButtonState(dgroup, i);
    }
  }
  return buttonPollSummary(dgroup);
}

export function PollKeyboardMove(dgroup: DOSMemory, pressed: ScanCodeInput): MovePollSummary {
  const tics = dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1;
  const move = (buttonState(dgroup, BT_RUN) ? RUNMOVE : BASEMOVE) * tics;
  if (scanPressed(pressed, dirscan[DIR_NORTH])) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controly"), -move);
  }
  if (scanPressed(pressed, dirscan[DIR_SOUTH])) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controly"), move);
  }
  if (scanPressed(pressed, dirscan[DIR_WEST])) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controlx"), -move);
  }
  if (scanPressed(pressed, dirscan[DIR_EAST])) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controlx"), move);
  }
  return movePollSummary(dgroup);
}

export function PollMouseButtons(dgroup: DOSMemory, buttons: number): ButtonPollSummary {
  if (buttons & 1) {
    setButtonState(dgroup, buttonmouse[0]);
  }
  if (buttons & 2) {
    setButtonState(dgroup, buttonmouse[1]);
  }
  if (buttons & 4) {
    setButtonState(dgroup, buttonmouse[2]);
  }
  return buttonPollSummary(dgroup);
}

export function PollMouseMove(
  dgroup: DOSMemory,
  mousexmove: number,
  mouseymove: number,
  options: { readonly mouseadjustment?: number } = {},
): MovePollSummary {
  const denominator = 13 - (options.mouseadjustment ?? 0);
  addControl(dgroup, nearOffsetForRuntimeSymbol("_controlx"), cdiv(mousexmove * 10, denominator));
  addControl(dgroup, nearOffsetForRuntimeSymbol("_controly"), cdiv(mouseymove * 20, denominator));
  return movePollSummary(dgroup);
}

export function RemoveObj(dgroup: DOSMemory, actor: number): RemoveObjSummary {
  return RemoveObjMemory(dgroup, actor);
}

export function StartBonusFlash(dgroup: DOSMemory): PaletteShiftSummary {
  return StartBonusFlashMemory(dgroup);
}

export function StartDamageFlash(dgroup: DOSMemory, damage: number): PaletteShiftSummary {
  return StartDamageFlashMemory(dgroup, damage);
}

export function StartMusic(
  dgroup: DOSMemory,
  options: { readonly cacheError?: boolean } = {},
): StartMusicSummary {
  StopMusic(dgroup);
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const mapon = dgroup.u16(gamestate + gamestateFieldOffset("mapon"));
  const episode = dgroup.u16(gamestate + gamestateFieldOffset("episode"));
  const songIndex = mapon + episode * 10;
  const chunk = SONGS[songIndex];
  if (chunk === undefined) {
    throw new Error(`StartMusic song index out of range: ${songIndex}`);
  }
  const state = musicStateFor(dgroup);
  const started = !options.cacheError;
  state.musicOn = started;
  state.lockedChunk = started ? chunk : null;
  return {
    mapon,
    episode,
    songIndex,
    chunk,
    audioChunk: STARTMUSIC + chunk,
    started,
    musicOn: state.musicOn,
    lockedChunk: state.lockedChunk,
  };
}

export function StopMusic(dgroup: DOSMemory): StopMusicSummary {
  const state = musicStateFor(dgroup);
  const purgedChunks = state.lockedChunk === null
    ? []
    : Array.from({ length: LASTMUSIC }, (_unused, index) => STARTMUSIC + index);
  state.musicOn = false;
  state.lockedChunk = null;
  state.purgedChunks = purgedChunks;
  return { musicOn: false, purgedChunks };
}

export function UpdatePaletteShifts(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): PaletteShiftSummary {
  return UpdatePaletteShiftsMemory(dgroup, options);
}

function gamestateFieldOffset(name: string): number {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing gamestate field ${name}`);
  }
  return field[1];
}

function musicStateFor(dgroup: DOSMemory): MusicState {
  let state = MUSIC_STATES.get(dgroup);
  if (!state) {
    state = { musicOn: false, lockedChunk: null, purgedChunks: [] };
    MUSIC_STATES.set(dgroup, state);
  }
  return state;
}

function setButtonState(dgroup: DOSMemory, button: number): void {
  if (button === BT_NOBUTTON) {
    return;
  }
  dgroup.setU16(nearOffsetForRuntimeSymbol("_buttonstate") + button * 2, 1);
}

function buttonState(dgroup: DOSMemory, button: number): boolean {
  return dgroup.u16(nearOffsetForRuntimeSymbol("_buttonstate") + button * 2) !== 0;
}

function addControl(dgroup: DOSMemory, offset: number, delta: number): void {
  dgroup.setU16(offset, i16(dgroup.i16(offset) + delta));
}

function scanPressed(pressed: ScanCodeInput, scanCode: number): boolean {
  return "has" in pressed ? pressed.has(scanCode) : pressed.includes(scanCode);
}

function pollDigitalJoyMove(dgroup: DOSMemory, joyx: number, joyy: number, move: number): void {
  if (joyx > 64) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controlx"), move);
  } else if (joyx < -64) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controlx"), -move);
  }
  if (joyy > 64) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controly"), move);
  } else if (joyy < -64) {
    addControl(dgroup, nearOffsetForRuntimeSymbol("_controly"), -move);
  }
}

function buttonPollSummary(dgroup: DOSMemory): ButtonPollSummary {
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  return {
    buttonstate: Array.from({ length: NUMBUTTONS }, (_unused, index) => dgroup.u16(buttonstate + index * 2) !== 0),
  };
}

function movePollSummary(dgroup: DOSMemory): MovePollSummary {
  return {
    controlx: dgroup.i16(nearOffsetForRuntimeSymbol("_controlx")),
    controly: dgroup.i16(nearOffsetForRuntimeSymbol("_controly")),
  };
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_PLAY.C
// 
// #include "WL_DEF.H"
// #pragma hdrstop
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
// #define sc_Question	0x35
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// boolean		madenoise;					// true when shooting or screaming
// 
// exit_t		playstate;
// 
// int			DebugOk;
// 
// objtype 	objlist[MAXACTORS],*new,*obj,*player,*lastobj,
// 			*objfreelist,*killerobj;
// 
// unsigned	farmapylookup[MAPSIZE];
// byte		*nearmapylookup[MAPSIZE];
// 
// boolean		singlestep,godmode,noclip;
// int			extravbls;
// 
// byte		tilemap[MAPSIZE][MAPSIZE];	// wall values only
// byte		spotvis[MAPSIZE][MAPSIZE];
// objtype		*actorat[MAPSIZE][MAPSIZE];
// 
// //
// // replacing refresh manager
// //
// unsigned	mapwidth,mapheight,tics;
// boolean		compatability;
// byte		*updateptr;
// unsigned	mapwidthtable[64];
// unsigned	uwidthtable[UPDATEHIGH];
// unsigned	blockstarts[UPDATEWIDE*UPDATEHIGH];
// byte		update[UPDATESIZE];
// 
// //
// // control info
// //
// boolean		mouseenabled,joystickenabled,joypadenabled,joystickprogressive;
// int			joystickport;
// int			dirscan[4] = {sc_UpArrow,sc_RightArrow,sc_DownArrow,sc_LeftArrow};
// int			buttonscan[NUMBUTTONS] =
// 			{sc_Control,sc_Alt,sc_RShift,sc_Space,sc_1,sc_2,sc_3,sc_4};
// int			buttonmouse[4]={bt_attack,bt_strafe,bt_use,bt_nobutton};
// int			buttonjoy[4]={bt_attack,bt_strafe,bt_use,bt_run};
// 
// int			viewsize;
// 
// boolean		buttonheld[NUMBUTTONS];
// 
// boolean		demorecord,demoplayback;
// char		far *demoptr, far *lastdemoptr;
// memptr		demobuffer;
// 
// //
// // curent user input
// //
// int			controlx,controly;		// range from -100 to 100 per tic
// boolean		buttonstate[NUMBUTTONS];
// 
// 
// 
// //===========================================================================
// 
// 
// void	CenterWindow(word w,word h);
// void 	InitObjList (void);
// void 	RemoveObj (objtype *gone);
// void 	PollControls (void);
// void 	StopMusic(void);
// void 	StartMusic(void);
// void	PlayLoop (void);
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
// objtype dummyobj;
// 
// //
// // LIST OF SONGS FOR EACH VERSION
// //
// int songs[]=
// {
// #ifndef SPEAR
//  //
//  // Episode One
//  //
//  GETTHEM_MUS,
//  SEARCHN_MUS,
//  POW_MUS,
//  SUSPENSE_MUS,
//  GETTHEM_MUS,
//  SEARCHN_MUS,
//  POW_MUS,
//  SUSPENSE_MUS,
// 
//  WARMARCH_MUS,	// Boss level
//  CORNER_MUS,	// Secret level
// 
//  //
//  // Episode Two
//  //
//  NAZI_OMI_MUS,
//  PREGNANT_MUS,
//  GOINGAFT_MUS,
//  HEADACHE_MUS,
//  NAZI_OMI_MUS,
//  PREGNANT_MUS,
//  HEADACHE_MUS,
//  GOINGAFT_MUS,
// 
//  WARMARCH_MUS,	// Boss level
//  DUNGEON_MUS,	// Secret level
// 
//  //
//  // Episode Three
//  //
//  INTROCW3_MUS,
//  NAZI_RAP_MUS,
//  TWELFTH_MUS,
//  ZEROHOUR_MUS,
//  INTROCW3_MUS,
//  NAZI_RAP_MUS,
//  TWELFTH_MUS,
//  ZEROHOUR_MUS,
// 
//  ULTIMATE_MUS,	// Boss level
//  PACMAN_MUS,	// Secret level
// 
//  //
//  // Episode Four
//  //
//  GETTHEM_MUS,
//  SEARCHN_MUS,
//  POW_MUS,
//  SUSPENSE_MUS,
//  GETTHEM_MUS,
//  SEARCHN_MUS,
//  POW_MUS,
//  SUSPENSE_MUS,
// 
//  WARMARCH_MUS,	// Boss level
//  CORNER_MUS,	// Secret level
// 
//  //
//  // Episode Five
//  //
//  NAZI_OMI_MUS,
//  PREGNANT_MUS,
//  GOINGAFT_MUS,
//  HEADACHE_MUS,
//  NAZI_OMI_MUS,
//  PREGNANT_MUS,
//  HEADACHE_MUS,
//  GOINGAFT_MUS,
// 
//  WARMARCH_MUS,	// Boss level
//  DUNGEON_MUS,	// Secret level
// 
//  //
//  // Episode Six
//  //
//  INTROCW3_MUS,
//  NAZI_RAP_MUS,
//  TWELFTH_MUS,
//  ZEROHOUR_MUS,
//  INTROCW3_MUS,
//  NAZI_RAP_MUS,
//  TWELFTH_MUS,
//  ZEROHOUR_MUS,
// 
//  ULTIMATE_MUS,	// Boss level
//  FUNKYOU_MUS		// Secret level
// #else
// 
//  //////////////////////////////////////////////////////////////
//  //
//  // SPEAR OF DESTINY TRACKS
//  //
//  //////////////////////////////////////////////////////////////
//  XTIPTOE_MUS,
//  XFUNKIE_MUS,
//  XDEATH_MUS,
//  XGETYOU_MUS,		// DON'T KNOW
//  ULTIMATE_MUS,	// Trans Gr�sse
// 
//  DUNGEON_MUS,
//  GOINGAFT_MUS,
//  POW_MUS,
//  TWELFTH_MUS,
//  ULTIMATE_MUS,	// Barnacle Wilhelm BOSS
// 
//  NAZI_OMI_MUS,
//  GETTHEM_MUS,
//  SUSPENSE_MUS,
//  SEARCHN_MUS,
//  ZEROHOUR_MUS,
//  ULTIMATE_MUS,	// Super Mutant BOSS
// 
//  XPUTIT_MUS,
//  ULTIMATE_MUS,	// Death Knight BOSS
// 
//  XJAZNAZI_MUS,	// Secret level
//  XFUNKIE_MUS,	// Secret level (DON'T KNOW)
// 
//  XEVIL_MUS		// Angel of Death BOSS
// 
// #endif
// };
// 
// 
// /*
// =============================================================================
// 
// 						  USER CONTROL
// 
// =============================================================================
// */
// 
// 
// #define BASEMOVE		35
// #define RUNMOVE			70
// #define BASETURN		35
// #define RUNTURN			70
// 
// #define JOYSCALE		2
// 
// /*
// ===================
// =
// = PollKeyboardButtons
// =
// ===================
// */
// 
// void PollKeyboardButtons (void)
// {
// 	int		i;
// 
// 	for (i=0;i<NUMBUTTONS;i++)
// 		if (Keyboard[buttonscan[i]])
// 			buttonstate[i] = true;
// }
// 
// 
// /*
// ===================
// =
// = PollMouseButtons
// =
// ===================
// */
// 
// void PollMouseButtons (void)
// {
// 	int	buttons;
// 
// 	buttons = IN_MouseButtons ();
// 
// 	if (buttons&1)
// 		buttonstate[buttonmouse[0]] = true;
// 	if (buttons&2)
// 		buttonstate[buttonmouse[1]] = true;
// 	if (buttons&4)
// 		buttonstate[buttonmouse[2]] = true;
// }
// 
// 
// 
// /*
// ===================
// =
// = PollJoystickButtons
// =
// ===================
// */
// 
// void PollJoystickButtons (void)
// {
// 	int	buttons;
// 
// 	buttons = IN_JoyButtons ();
// 
// 	if (joystickport && !joypadenabled)
// 	{
// 		if (buttons&4)
// 			buttonstate[buttonjoy[0]] = true;
// 		if (buttons&8)
// 			buttonstate[buttonjoy[1]] = true;
// 	}
// 	else
// 	{
// 		if (buttons&1)
// 			buttonstate[buttonjoy[0]] = true;
// 		if (buttons&2)
// 			buttonstate[buttonjoy[1]] = true;
// 		if (joypadenabled)
// 		{
// 			if (buttons&4)
// 				buttonstate[buttonjoy[2]] = true;
// 			if (buttons&8)
// 				buttonstate[buttonjoy[3]] = true;
// 		}
// 	}
// }
// 
// 
// /*
// ===================
// =
// = PollKeyboardMove
// =
// ===================
// */
// 
// void PollKeyboardMove (void)
// {
// 	if (buttonstate[bt_run])
// 	{
// 		if (Keyboard[dirscan[di_north]])
// 			controly -= RUNMOVE*tics;
// 		if (Keyboard[dirscan[di_south]])
// 			controly += RUNMOVE*tics;
// 		if (Keyboard[dirscan[di_west]])
// 			controlx -= RUNMOVE*tics;
// 		if (Keyboard[dirscan[di_east]])
// 			controlx += RUNMOVE*tics;
// 	}
// 	else
// 	{
// 		if (Keyboard[dirscan[di_north]])
// 			controly -= BASEMOVE*tics;
// 		if (Keyboard[dirscan[di_south]])
// 			controly += BASEMOVE*tics;
// 		if (Keyboard[dirscan[di_west]])
// 			controlx -= BASEMOVE*tics;
// 		if (Keyboard[dirscan[di_east]])
// 			controlx += BASEMOVE*tics;
// 	}
// }
// 
// 
// /*
// ===================
// =
// = PollMouseMove
// =
// ===================
// */
// 
// void PollMouseMove (void)
// {
// 	int	mousexmove,mouseymove;
// 
// 	Mouse(MDelta);
// 	mousexmove = _CX;
// 	mouseymove = _DX;
// 
// 	controlx += mousexmove*10/(13-mouseadjustment);
// 	controly += mouseymove*20/(13-mouseadjustment);
// }
// 
// 
// 
// /*
// ===================
// =
// = PollJoystickMove
// =
// ===================
// */
// 
// void PollJoystickMove (void)
// {
// 	int	joyx,joyy;
// 
// 	INL_GetJoyDelta(joystickport,&joyx,&joyy);
// 
// 	if (joystickprogressive)
// 	{
// 		if (joyx > 64)
// 			controlx += (joyx-64)*JOYSCALE*tics;
// 		else if (joyx < -64)
// 			controlx -= (-joyx-64)*JOYSCALE*tics;
// 		if (joyy > 64)
// 			controlx += (joyy-64)*JOYSCALE*tics;
// 		else if (joyy < -64)
// 			controly -= (-joyy-64)*JOYSCALE*tics;
// 	}
// 	else if (buttonstate[bt_run])
// 	{
// 		if (joyx > 64)
// 			controlx += RUNMOVE*tics;
// 		else if (joyx < -64)
// 			controlx -= RUNMOVE*tics;
// 		if (joyy > 64)
// 			controly += RUNMOVE*tics;
// 		else if (joyy < -64)
// 			controly -= RUNMOVE*tics;
// 	}
// 	else
// 	{
// 		if (joyx > 64)
// 			controlx += BASEMOVE*tics;
// 		else if (joyx < -64)
// 			controlx -= BASEMOVE*tics;
// 		if (joyy > 64)
// 			controly += BASEMOVE*tics;
// 		else if (joyy < -64)
// 			controly -= BASEMOVE*tics;
// 	}
// }
// 
// 
// /*
// ===================
// =
// = PollControls
// =
// = Gets user or demo input, call once each frame
// =
// = controlx		set between -100 and 100 per tic
// = controly
// = buttonheld[]	the state of the buttons LAST frame
// = buttonstate[]	the state of the buttons THIS frame
// =
// ===================
// */
// 
// void PollControls (void)
// {
// 	int		max,min,i;
// 	byte	buttonbits;
// 
// //
// // get timing info for last frame
// //
// 	if (demoplayback)
// 	{
// 		while (TimeCount<lasttimecount+DEMOTICS)
// 		;
// 		TimeCount = lasttimecount + DEMOTICS;
// 		lasttimecount += DEMOTICS;
// 		tics = DEMOTICS;
// 	}
// 	else if (demorecord)			// demo recording and playback needs
// 	{								// to be constant
// //
// // take DEMOTICS or more tics, and modify Timecount to reflect time taken
// //
// 		while (TimeCount<lasttimecount+DEMOTICS)
// 		;
// 		TimeCount = lasttimecount + DEMOTICS;
// 		lasttimecount += DEMOTICS;
// 		tics = DEMOTICS;
// 	}
// 	else
// 		CalcTics ();
// 
// 	controlx = 0;
// 	controly = 0;
// 	memcpy (buttonheld,buttonstate,sizeof(buttonstate));
// 	memset (buttonstate,0,sizeof(buttonstate));
// 
// 	if (demoplayback)
// 	{
// 	//
// 	// read commands from demo buffer
// 	//
// 		buttonbits = *demoptr++;
// 		for (i=0;i<NUMBUTTONS;i++)
// 		{
// 			buttonstate[i] = buttonbits&1;
// 			buttonbits >>= 1;
// 		}
// 
// 		controlx = *demoptr++;
// 		controly = *demoptr++;
// 
// 		if (demoptr == lastdemoptr)
// 			playstate = ex_completed;		// demo is done
// 
// 		controlx *= (int)tics;
// 		controly *= (int)tics;
// 
// 		return;
// 	}
// 
// 
// //
// // get button states
// //
// 	PollKeyboardButtons ();
// 
// 	if (mouseenabled)
// 		PollMouseButtons ();
// 
// 	if (joystickenabled)
// 		PollJoystickButtons ();
// 
// //
// // get movements
// //
// 	PollKeyboardMove ();
// 
// 	if (mouseenabled)
// 		PollMouseMove ();
// 
// 	if (joystickenabled)
// 		PollJoystickMove ();
// 
// //
// // bound movement to a maximum
// //
// 	max = 100*tics;
// 	min = -max;
// 	if (controlx > max)
// 		controlx = max;
// 	else if (controlx < min)
// 		controlx = min;
// 
// 	if (controly > max)
// 		controly = max;
// 	else if (controly < min)
// 		controly = min;
// 
// 	if (demorecord)
// 	{
// 	//
// 	// save info out to demo buffer
// 	//
// 		controlx /= (int)tics;
// 		controly /= (int)tics;
// 
// 		buttonbits = 0;
// 
// 		for (i=NUMBUTTONS-1;i>=0;i--)
// 		{
// 			buttonbits <<= 1;
// 			if (buttonstate[i])
// 				buttonbits |= 1;
// 		}
// 
// 		*demoptr++ = buttonbits;
// 		*demoptr++ = controlx;
// 		*demoptr++ = controly;
// 
// 		if (demoptr >= lastdemoptr)
// 			Quit ("Demo buffer overflowed!");
// 
// 		controlx *= (int)tics;
// 		controly *= (int)tics;
// 	}
// }
// 
// 
// 
// //==========================================================================
// 
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	CenterWindow() - Generates a window of a given width & height in the
// //		middle of the screen
// //
// ///////////////////////////////////////////////////////////////////////////
// 
// #define MAXX	320
// #define MAXY	160
// 
// void	CenterWindow(word w,word h)
// {
// 	FixOfs ();
// 	US_DrawWindow(((MAXX / 8) - w) / 2,((MAXY / 8) - h) / 2,w,h);
// }
// 
// //===========================================================================
// 
// 
// /*
// =====================
// =
// = CheckKeys
// =
// =====================
// */
// 
// void CheckKeys (void)
// {
// 	int		i;
// 	byte	scan;
// 	unsigned	temp;
// 
// 
// 	if (screenfaded || demoplayback)	// don't do anything with a faded screen
// 		return;
// 
// 	scan = LastScan;
// 
// 
// 	#ifdef SPEAR
// 	//
// 	// SECRET CHEAT CODE: TAB-G-F10
// 	//
// 	if (Keyboard[sc_Tab] &&
// 		Keyboard[sc_G] &&
// 		Keyboard[sc_F10])
// 	{
// 		WindowH = 160;
// 		if (godmode)
// 		{
// 			Message ("God mode OFF");
// 			SD_PlaySound (NOBONUSSND);
// 		}
// 		else
// 		{
// 			Message ("God mode ON");
// 			SD_PlaySound (ENDBONUS2SND);
// 		}
// 
// 		IN_Ack();
// 		godmode ^= 1;
// 		DrawAllPlayBorderSides ();
// 		IN_ClearKeysDown();
// 		return;
// 	}
// 	#endif
// 
// 
// 	//
// 	// SECRET CHEAT CODE: 'MLI'
// 	//
// 	if (Keyboard[sc_M] &&
// 		Keyboard[sc_L] &&
// 		Keyboard[sc_I])
// 	{
// 		gamestate.health = 100;
// 		gamestate.ammo = 99;
// 		gamestate.keys = 3;
// 		gamestate.score = 0;
// 		gamestate.TimeCount += 42000L;
// 		GiveWeapon (wp_chaingun);
// 
// 		DrawWeapon();
// 		DrawHealth();
// 		DrawKeys();
// 		DrawAmmo();
// 		DrawScore();
// 
// 		ClearMemory ();
// 		CA_CacheGrChunk (STARTFONT+1);
// 		ClearSplitVWB ();
// 		VW_ScreenToScreen (displayofs,bufferofs,80,160);
// 
// 		Message(STR_CHEATER1"\n"
// 				STR_CHEATER2"\n\n"
// 				STR_CHEATER3"\n"
// 				STR_CHEATER4"\n"
// 				STR_CHEATER5);
// 
// 		UNCACHEGRCHUNK(STARTFONT+1);
// 		PM_CheckMainMem ();
// 		IN_ClearKeysDown();
// 		IN_Ack();
// 
// 		DrawAllPlayBorder ();
// 	}
// 
// 	//
// 	// OPEN UP DEBUG KEYS
// 	//
// #ifndef SPEAR
// 	if (Keyboard[sc_BackSpace] &&
// 		Keyboard[sc_LShift] &&
// 		Keyboard[sc_Alt] &&
// 		MS_CheckParm("goobers"))
// #else
// 	if (Keyboard[sc_BackSpace] &&
// 		Keyboard[sc_LShift] &&
// 		Keyboard[sc_Alt] &&
// 		MS_CheckParm("debugmode"))
// #endif
// 	{
// 	 ClearMemory ();
// 	 CA_CacheGrChunk (STARTFONT+1);
// 	 ClearSplitVWB ();
// 	 VW_ScreenToScreen (displayofs,bufferofs,80,160);
// 
// 	 Message("Debugging keys are\nnow available!");
// 	 UNCACHEGRCHUNK(STARTFONT+1);
// 	 PM_CheckMainMem ();
// 	 IN_ClearKeysDown();
// 	 IN_Ack();
// 
// 	 DrawAllPlayBorderSides ();
// 	 DebugOk=1;
// 	}
// 
// 	//
// 	// TRYING THE KEEN CHEAT CODE!
// 	//
// 	if (Keyboard[sc_B] &&
// 		Keyboard[sc_A] &&
// 		Keyboard[sc_T])
// 	{
// 	 ClearMemory ();
// 	 CA_CacheGrChunk (STARTFONT+1);
// 	 ClearSplitVWB ();
// 	 VW_ScreenToScreen (displayofs,bufferofs,80,160);
// 
// 	 Message("Commander Keen is also\n"
// 			 "available from Apogee, but\n"
// 			 "then, you already know\n"
// 			 "that - right, Cheatmeister?!");
// 
// 	 UNCACHEGRCHUNK(STARTFONT+1);
// 	 PM_CheckMainMem ();
// 	 IN_ClearKeysDown();
// 	 IN_Ack();
// 
// 	 DrawAllPlayBorder ();
// 	}
// 
// //
// // pause key weirdness can't be checked as a scan code
// //
// 	if (Paused)
// 	{
// 		bufferofs = displayofs;
// 		LatchDrawPic (20-4,80-2*8,PAUSEDPIC);
// 		SD_MusicOff();
// 		IN_Ack();
// 		IN_ClearKeysDown ();
// 		SD_MusicOn();
// 		Paused = false;
// 		if (MousePresent)
// 			Mouse(MDelta);	// Clear accumulated mouse movement
// 		return;
// 	}
// 
// 
// //
// // F1-F7/ESC to enter control panel
// //
// 	if (
// #ifndef DEBCHECK
// 		scan == sc_F10 ||
// #endif
// 		scan == sc_F9 ||
// 		scan == sc_F7 ||
// 		scan == sc_F8)			// pop up quit dialog
// 	{
// 		ClearMemory ();
// 		ClearSplitVWB ();
// 		VW_ScreenToScreen (displayofs,bufferofs,80,160);
// 		US_ControlPanel(scan);
// 
// 		 DrawAllPlayBorderSides ();
// 
// 		if (scan == sc_F9)
// 		  StartMusic ();
// 
// 		PM_CheckMainMem ();
// 		SETFONTCOLOR(0,15);
// 		IN_ClearKeysDown();
// 		return;
// 	}
// 
// 	if ( (scan >= sc_F1 && scan <= sc_F9) || scan == sc_Escape)
// 	{
// 		StopMusic ();
// 		ClearMemory ();
// 		VW_FadeOut ();
// 
// 		US_ControlPanel(scan);
// 
// 		SETFONTCOLOR(0,15);
// 		IN_ClearKeysDown();
// 		DrawPlayScreen ();
// 		if (!startgame && !loadedgame)
// 		{
// 			VW_FadeIn ();
// 			StartMusic ();
// 		}
// 		if (loadedgame)
// 			playstate = ex_abort;
// 		lasttimecount = TimeCount;
// 		if (MousePresent)
// 			Mouse(MDelta);	// Clear accumulated mouse movement
// 		PM_CheckMainMem ();
// 		return;
// 	}
// 
// //
// // TAB-? debug keys
// //
// 	if (Keyboard[sc_Tab] && DebugOk)
// 	{
// 		CA_CacheGrChunk (STARTFONT);
// 		fontnumber=0;
// 		SETFONTCOLOR(0,15);
// 		DebugKeys();
// 		if (MousePresent)
// 			Mouse(MDelta);	// Clear accumulated mouse movement
// 		lasttimecount = TimeCount;
// 		return;
// 	}
// 
// }
// 
// 
// //===========================================================================
// 
// /*
// #############################################################################
// 
// 				  The objlist data structure
// 
// #############################################################################
// 
// objlist containt structures for every actor currently playing.  The structure
// is accessed as a linked list starting at *player, ending when ob->next ==
// NULL.  GetNewObj inserts a new object at the end of the list, meaning that
// if an actor spawn another actor, the new one WILL get to think and react the
// same frame.  RemoveObj unlinks the given object and returns it to the free
// list, but does not damage the objects ->next pointer, so if the current object
// removes itself, a linked list following loop can still safely get to the
// next element.
// 
// <backwardly linked free list>
// 
// #############################################################################
// */
// 
// 
// /*
// =========================
// =
// = InitActorList
// =
// = Call to clear out the actor object lists returning them all to the free
// = list.  Allocates a special spot for the player.
// =
// =========================
// */
// 
// int	objcount;
// 
// void InitActorList (void)
// {
// 	int	i;
// 
// //
// // init the actor lists
// //
// 	for (i=0;i<MAXACTORS;i++)
// 	{
// 		objlist[i].prev = &objlist[i+1];
// 		objlist[i].next = NULL;
// 	}
// 
// 	objlist[MAXACTORS-1].prev = NULL;
// 
// 	objfreelist = &objlist[0];
// 	lastobj = NULL;
// 
// 	objcount = 0;
// 
// //
// // give the player the first free spots
// //
// 	GetNewActor ();
// 	player = new;
// 
// }
// 
// //===========================================================================
// 
// /*
// =========================
// =
// = GetNewActor
// =
// = Sets the global variable new to point to a free spot in objlist.
// = The free spot is inserted at the end of the liked list
// =
// = When the object list is full, the caller can either have it bomb out ot
// = return a dummy object pointer that will never get used
// =
// =========================
// */
// 
// void GetNewActor (void)
// {
// 	if (!objfreelist)
// 		Quit ("GetNewActor: No free spots in objlist!");
// 
// 	new = objfreelist;
// 	objfreelist = new->prev;
// 	memset (new,0,sizeof(*new));
// 
// 	if (lastobj)
// 		lastobj->next = new;
// 	new->prev = lastobj;	// new->next is allready NULL from memset
// 
// 	new->active = false;
// 	lastobj = new;
// 
// 	objcount++;
// }
// 
// //===========================================================================
// 
// /*
// =========================
// =
// = RemoveObj
// =
// = Add the given object back into the free list, and unlink it from it's
// = neighbors
// =
// =========================
// */
// 
// void RemoveObj (objtype *gone)
// {
// 	objtype **spotat;
// 
// 	if (gone == player)
// 		Quit ("RemoveObj: Tried to remove the player!");
// 
// 	gone->state = NULL;
// 
// //
// // fix the next object's back link
// //
// 	if (gone == lastobj)
// 		lastobj = (objtype *)gone->prev;
// 	else
// 		gone->next->prev = gone->prev;
// 
// //
// // fix the previous object's forward link
// //
// 	gone->prev->next = gone->next;
// 
// //
// // add it back in to the free list
// //
// 	gone->prev = objfreelist;
// 	objfreelist = gone;
// 
// 	objcount--;
// }
// 
// /*
// =============================================================================
// 
// 						MUSIC STUFF
// 
// =============================================================================
// */
// 
// 
// /*
// =================
// =
// = StopMusic
// =
// =================
// */
// 
// void StopMusic(void)
// {
// 	int	i;
// 
// 	SD_MusicOff();
// 	for (i = 0;i < LASTMUSIC;i++)
// 		if (audiosegs[STARTMUSIC + i])
// 		{
// 			MM_SetPurge(&((memptr)audiosegs[STARTMUSIC + i]),3);
// 			MM_SetLock(&((memptr)audiosegs[STARTMUSIC + i]),false);
// 		}
// }
// 
// //==========================================================================
// 
// 
// /*
// =================
// =
// = StartMusic
// =
// =================
// */
// 
// void StartMusic(void)
// {
// 	musicnames	chunk;
// 
// 	SD_MusicOff();
// 	chunk = songs[gamestate.mapon+gamestate.episode*10];
// 
// //	if ((chunk == -1) || (MusicMode != smm_AdLib))
// //DEBUG control panel		return;
// 
// 	MM_BombOnError (false);
// 	CA_CacheAudioChunk(STARTMUSIC + chunk);
// 	MM_BombOnError (true);
// 	if (mmerror)
// 		mmerror = false;
// 	else
// 	{
// 		MM_SetLock(&((memptr)audiosegs[STARTMUSIC + chunk]),true);
// 		SD_StartMusic((MusicGroup far *)audiosegs[STARTMUSIC + chunk]);
// 	}
// }
// 
// 
// /*
// =============================================================================
// 
// 					PALETTE SHIFTING STUFF
// 
// =============================================================================
// */
// 
// #define NUMREDSHIFTS	6
// #define REDSTEPS		8
// 
// #define NUMWHITESHIFTS	3
// #define WHITESTEPS		20
// #define WHITETICS		6
// 
// 
// byte	far redshifts[NUMREDSHIFTS][768];
// byte	far whiteshifts[NUMREDSHIFTS][768];
// 
// int		damagecount,bonuscount;
// boolean	palshifted;
// 
// extern 	byte	far	gamepal;
// 
// /*
// =====================
// =
// = InitRedShifts
// =
// =====================
// */
// 
// void InitRedShifts (void)
// {
// 	byte	far *workptr, far *baseptr;
// 	int		i,j,delta;
// 
// 
// //
// // fade through intermediate frames
// //
// 	for (i=1;i<=NUMREDSHIFTS;i++)
// 	{
// 		workptr = (byte far *)&redshifts[i-1][0];
// 		baseptr = &gamepal;
// 
// 		for (j=0;j<=255;j++)
// 		{
// 			delta = 64-*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / REDSTEPS;
// 			delta = -*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / REDSTEPS;
// 			delta = -*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / REDSTEPS;
// 		}
// 	}
// 
// 	for (i=1;i<=NUMWHITESHIFTS;i++)
// 	{
// 		workptr = (byte far *)&whiteshifts[i-1][0];
// 		baseptr = &gamepal;
// 
// 		for (j=0;j<=255;j++)
// 		{
// 			delta = 64-*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / WHITESTEPS;
// 			delta = 62-*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / WHITESTEPS;
// 			delta = 0-*baseptr;
// 			*workptr++ = *baseptr++ + delta * i / WHITESTEPS;
// 		}
// 	}
// }
// 
// 
// /*
// =====================
// =
// = ClearPaletteShifts
// =
// =====================
// */
// 
// void ClearPaletteShifts (void)
// {
// 	bonuscount = damagecount = 0;
// }
// 
// 
// /*
// =====================
// =
// = StartBonusFlash
// =
// =====================
// */
// 
// void StartBonusFlash (void)
// {
// 	bonuscount = NUMWHITESHIFTS*WHITETICS;		// white shift palette
// }
// 
// 
// /*
// =====================
// =
// = StartDamageFlash
// =
// =====================
// */
// 
// void StartDamageFlash (int damage)
// {
// 	damagecount += damage;
// }
// 
// 
// /*
// =====================
// =
// = UpdatePaletteShifts
// =
// =====================
// */
// 
// void UpdatePaletteShifts (void)
// {
// 	int	red,white;
// 
// 	if (bonuscount)
// 	{
// 		white = bonuscount/WHITETICS +1;
// 		if (white>NUMWHITESHIFTS)
// 			white = NUMWHITESHIFTS;
// 		bonuscount -= tics;
// 		if (bonuscount < 0)
// 			bonuscount = 0;
// 	}
// 	else
// 		white = 0;
// 
// 
// 	if (damagecount)
// 	{
// 		red = damagecount/10 +1;
// 		if (red>NUMREDSHIFTS)
// 			red = NUMREDSHIFTS;
// 
// 		damagecount -= tics;
// 		if (damagecount < 0)
// 			damagecount = 0;
// 	}
// 	else
// 		red = 0;
// 
// 	if (red)
// 	{
// 		VW_WaitVBL(1);
// 		VL_SetPalette (redshifts[red-1]);
// 		palshifted = true;
// 	}
// 	else if (white)
// 	{
// 		VW_WaitVBL(1);
// 		VL_SetPalette (whiteshifts[white-1]);
// 		palshifted = true;
// 	}
// 	else if (palshifted)
// 	{
// 		VW_WaitVBL(1);
// 		VL_SetPalette (&gamepal);		// back to normal
// 		palshifted = false;
// 	}
// }
// 
// 
// /*
// =====================
// =
// = FinishPaletteShifts
// =
// = Resets palette to normal if needed
// =
// =====================
// */
// 
// void FinishPaletteShifts (void)
// {
// 	if (palshifted)
// 	{
// 		palshifted = 0;
// 		VW_WaitVBL(1);
// 		VL_SetPalette (&gamepal);
// 	}
// }
// 
// 
// /*
// =============================================================================
// 
// 						CORE PLAYLOOP
// 
// =============================================================================
// */
// 
// 
// /*
// =====================
// =
// = DoActor
// =
// =====================
// */
// 
// void DoActor (objtype *ob)
// {
// 	void (*think)(objtype *);
// 
// 	if (!ob->active && !areabyplayer[ob->areanumber])
// 		return;
// 
// 	if (!(ob->flags&(FL_NONMARK|FL_NEVERMARK)) )
// 		actorat[ob->tilex][ob->tiley] = NULL;
// 
// //
// // non transitional object
// //
// 
// 	if (!ob->ticcount)
// 	{
// 		think =	ob->state->think;
// 		if (think)
// 		{
// 			think (ob);
// 			if (!ob->state)
// 			{
// 				RemoveObj (ob);
// 				return;
// 			}
// 		}
// 
// 		if (ob->flags&FL_NEVERMARK)
// 			return;
// 
// 		if ( (ob->flags&FL_NONMARK) && actorat[ob->tilex][ob->tiley])
// 			return;
// 
// 		actorat[ob->tilex][ob->tiley] = ob;
// 		return;
// 	}
// 
// //
// // transitional object
// //
// 	ob->ticcount-=tics;
// 	while ( ob->ticcount <= 0)
// 	{
// 		think = ob->state->action;			// end of state action
// 		if (think)
// 		{
// 			think (ob);
// 			if (!ob->state)
// 			{
// 				RemoveObj (ob);
// 				return;
// 			}
// 		}
// 
// 		ob->state = ob->state->next;
// 
// 		if (!ob->state)
// 		{
// 			RemoveObj (ob);
// 			return;
// 		}
// 
// 		if (!ob->state->tictime)
// 		{
// 			ob->ticcount = 0;
// 			goto think;
// 		}
// 
// 		ob->ticcount += ob->state->tictime;
// 	}
// 
// think:
// 	//
// 	// think
// 	//
// 	think =	ob->state->think;
// 	if (think)
// 	{
// 		think (ob);
// 		if (!ob->state)
// 		{
// 			RemoveObj (ob);
// 			return;
// 		}
// 	}
// 
// 	if (ob->flags&FL_NEVERMARK)
// 		return;
// 
// 	if ( (ob->flags&FL_NONMARK) && actorat[ob->tilex][ob->tiley])
// 		return;
// 
// 	actorat[ob->tilex][ob->tiley] = ob;
// }
// 
// //==========================================================================
// 
// 
// /*
// ===================
// =
// = PlayLoop
// =
// ===================
// */
// long funnyticount;
// 
// 
// void PlayLoop (void)
// {
// 	int		give;
// 	int	helmetangle;
// 
// 	playstate = TimeCount = lasttimecount = 0;
// 	frameon = 0;
// 	running = false;
// 	anglefrac = 0;
// 	facecount = 0;
// 	funnyticount = 0;
// 	memset (buttonstate,0,sizeof(buttonstate));
// 	ClearPaletteShifts ();
// 
// 	if (MousePresent)
// 		Mouse(MDelta);	// Clear accumulated mouse movement
// 
// 	if (demoplayback)
// 		IN_StartAck ();
// 
// 	do
// 	{
// 		if (virtualreality)
// 		{
// 			helmetangle = peek (0x40,0xf0);
// 			player->angle += helmetangle;
// 			if (player->angle >= ANGLES)
// 				player->angle -= ANGLES;
// 		}
// 
// 
// 		PollControls();
// 
// //
// // actor thinking
// //
// 		madenoise = false;
// 
// 		MoveDoors ();
// 		MovePWalls ();
// 
// 		for (obj = player;obj;obj = obj->next)
// 			DoActor (obj);
// 
// 		UpdatePaletteShifts ();
// 
// 		ThreeDRefresh ();
// 
// 		//
// 		// MAKE FUNNY FACE IF BJ DOESN'T MOVE FOR AWHILE
// 		//
// 		#ifdef SPEAR
// 		funnyticount += tics;
// 		if (funnyticount > 30l*70)
// 		{
// 			funnyticount = 0;
// 			StatusDrawPic (17,4,BJWAITING1PIC+(US_RndT()&1));
// 			facecount = 0;
// 		}
// 		#endif
// 
// 		gamestate.TimeCount+=tics;
// 
// 		SD_Poll ();
// 		UpdateSoundLoc();	// JAB
// 
// 		if (screenfaded)
// 			VW_FadeIn ();
// 
// 		CheckKeys();
// 
// //
// // debug aids
// //
// 		if (singlestep)
// 		{
// 			VW_WaitVBL(14);
// 			lasttimecount = TimeCount;
// 		}
// 		if (extravbls)
// 			VW_WaitVBL(extravbls);
// 
// 		if (demoplayback)
// 		{
// 			if (IN_CheckAck ())
// 			{
// 				IN_ClearKeysDown ();
// 				playstate = ex_abort;
// 			}
// 		}
// 
// 
// 		if (virtualreality)
// 		{
// 			player->angle -= helmetangle;
// 			if (player->angle < 0)
// 				player->angle += ANGLES;
// 		}
// 
// 	}while (!playstate && !startgame);
// 
// 	if (playstate != ex_died)
// 		FinishPaletteShifts ();
// }
// 
// 
