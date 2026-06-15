import { cdiv, u16 } from "./TS_C";
import { TimeCount } from "./ID_SD.C";
import { US_CheckParm } from "./ID_US_1.C";
import {
  MaxJoys,
  MaxPlayers,
  NumCodes,
  ctrl_Joystick,
  ctrl_Joystick1,
  ctrl_Joystick2,
  ctrl_Keyboard,
  ctrl_Keyboard1,
  ctrl_Mouse,
  demo_Off,
  demo_PlayDone,
  demo_Playback,
  demo_Record,
  dir_East,
  dir_None,
  dir_North,
  dir_NorthEast,
  dir_NorthWest,
  dir_South,
  dir_SouthEast,
  dir_SouthWest,
  dir_West,
  key_None,
  motion_Down,
  motion_Left,
  motion_None,
  motion_Right,
  motion_Up,
  sc_Alt,
  sc_CapsLock,
  sc_Control,
  sc_DownArrow,
  sc_End,
  sc_Home,
  sc_LShift,
  sc_LeftArrow,
  sc_PgDn,
  sc_PgUp,
  sc_RightArrow,
  sc_RShift,
  sc_None,
  sc_UpArrow,
  type ControlInfo,
  type ControlType,
  type Demo,
  type Direction,
  type JoystickDef,
  type KeyboardDef,
  type Motion,
  type ScanCode,
} from "./ID_IN.H";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_IN.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_IN.C";
export const WOLFSRC_FUNCTIONS = [
  "IN_Ack",
  "IN_CheckAck",
  "IN_ClearKeysDown",
  "IN_Default",
  "IN_GetJoyAbs",
  "IN_GetJoyButtonsDB",
  "IN_JoyButtons",
  "IN_MouseButtons",
  "IN_ReadControl",
  "IN_SetControlType",
  "IN_SetKeyHook",
  "IN_SetupJoy",
  "IN_Shutdown",
  "IN_StartAck",
  "IN_Startup",
  "IN_UserInput",
  "IN_WaitForASCII",
  "IN_WaitForKey",
  "INL_GetJoyButtons",
  "INL_GetJoyDelta",
  "INL_GetMouseButtons",
  "INL_GetMouseDelta",
  "INL_KeyService",
  "INL_SetJoyScale",
  "INL_ShutJoy",
  "INL_ShutKbd",
  "INL_ShutMouse",
  "INL_StartJoy",
  "INL_StartKbd",
  "INL_StartMouse"
] as const;

const JoyScaleMax = 32768;
const JoyScaleShift = 8;
const MaxJoyValue = 5000;

const ASCIINames = new Uint8Array([
  0, 27, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, 8, 9,
  113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, 13, 0, 97, 115,
  100, 102, 103, 104, 106, 107, 108, 59, 39, 96, 0, 92, 122, 120, 99, 118,
  98, 110, 109, 44, 46, 47, 0, 42, 0, 32, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 55, 56, 57, 45, 52, 53, 54, 43, 49,
  50, 51, 48, 127, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

const ShiftNames = new Uint8Array([
  0, 27, 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, 8, 9,
  81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, 13, 0, 65, 83,
  68, 70, 71, 72, 74, 75, 76, 58, 34, 126, 0, 124, 90, 88, 67, 86,
  66, 78, 77, 60, 62, 63, 0, 42, 0, 32, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 55, 56, 57, 45, 52, 53, 54, 43, 49,
  50, 51, 48, 127, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

const SpecialNames = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

const DirTable = [
  dir_NorthWest, dir_North, dir_NorthEast,
  dir_West, dir_None, dir_East,
  dir_SouthWest, dir_South, dir_SouthEast,
] as const;

const ParmStrings = ["nojoys", "nomouse", ""] as const;

export let MousePresent = false;
export const JoysPresent: boolean[] = new Array(MaxJoys).fill(false);
export let JoyPadPresent = false;
export const Keyboard: boolean[] = new Array(NumCodes).fill(false);
export let Paused = false;
export let LastASCII = key_None;
export let LastScan: ScanCode = sc_None;
export const KbdDefs: KeyboardDef = {
  button0: sc_Control,
  button1: sc_Alt,
  upleft: sc_Home,
  up: sc_UpArrow,
  upright: sc_PgUp,
  left: sc_LeftArrow,
  right: sc_RightArrow,
  downleft: sc_End,
  down: sc_DownArrow,
  downright: sc_PgDn,
};
export const JoyDefs: JoystickDef[] = Array.from({ length: MaxJoys }, () => newJoystickDef());
export const Controls: ControlType[] = new Array(MaxPlayers).fill(ctrl_Keyboard1);
export let MouseDownCount = 0;
export let DemoMode: Demo = demo_Off;
export let DemoBuffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
export let DemoOffset = 0;
export let DemoSize = 0;

let IN_Started = false;
let CapsLock = false;
let CurCode: ScanCode = sc_None;
let LastCode: ScanCode = sc_None;
let specialKeyPrefix = false;
let INL_KeyHook: (() => void) | null = null;
let inputArgv: readonly string[] = ["wolf3d.exe"];
let mouseHardwarePresent = false;
let mouseButtons = 0;
let mouseDeltaX = 0;
let mouseDeltaY = 0;
const joyHardwarePresent = new Array(MaxJoys).fill(false);
const joyAbs = Array.from({ length: MaxJoys }, () => ({ x: 0, y: 0 }));
const joyButtons = new Uint8Array(MaxJoys);
const btnstate = new Array(8).fill(false);

export interface InputManagerSummary {
  readonly IN_Started: boolean;
  readonly MousePresent: boolean;
  readonly JoysPresent: readonly boolean[];
  readonly JoyPadPresent: boolean;
  readonly LastASCII: number;
  readonly LastScan: ScanCode;
  readonly Paused: boolean;
  readonly CapsLock: boolean;
  readonly CurCode: ScanCode;
  readonly LastCode: ScanCode;
  readonly Controls: readonly ControlType[];
  readonly DemoMode: Demo;
  readonly DemoOffset: number;
  readonly DemoSize: number;
  readonly mouseButtons: number;
  readonly mouseDeltaX: number;
  readonly mouseDeltaY: number;
  readonly joyButtons: readonly number[];
  readonly joyAbs: readonly { readonly x: number; readonly y: number }[];
  readonly btnstate: readonly boolean[];
  readonly pressedKeys: readonly ScanCode[];
}

export interface InputResetOptions {
  readonly MousePresent?: boolean;
  readonly JoysPresent?: readonly boolean[];
  readonly JoyPadPresent?: boolean;
  readonly argv?: readonly string[];
}

export interface MouseStateOptions {
  readonly present?: boolean;
  readonly buttons?: number;
  readonly deltaX?: number;
  readonly deltaY?: number;
  readonly addDeltaX?: number;
  readonly addDeltaY?: number;
}

export interface JoyStateOptions {
  readonly present?: boolean;
  readonly x?: number;
  readonly y?: number;
  readonly buttons?: number;
}

export interface AxisDelta {
  readonly dx: number;
  readonly dy: number;
}

export interface AxisAbs {
  readonly x: number;
  readonly y: number;
}

export function IN_DebugState(): InputManagerSummary {
  return {
    IN_Started,
    MousePresent,
    JoysPresent: [...JoysPresent],
    JoyPadPresent,
    LastASCII,
    LastScan,
    Paused,
    CapsLock,
    CurCode,
    LastCode,
    Controls: [...Controls],
    DemoMode,
    DemoOffset,
    DemoSize,
    mouseButtons,
    mouseDeltaX,
    mouseDeltaY,
    joyButtons: Array.from(joyButtons),
    joyAbs: joyAbs.map((entry) => ({ ...entry })),
    btnstate: [...btnstate],
    pressedKeys: Keyboard.flatMap((down, code) => (down ? [code] : [])),
  };
}

export function IN_ResetInputState(options: InputResetOptions = {}): InputManagerSummary {
  IN_Started = false;
  MousePresent = options.MousePresent ?? false;
  mouseHardwarePresent = MousePresent;
  JoyPadPresent = options.JoyPadPresent ?? false;
  for (let i = 0; i < MaxJoys; i++) {
    JoysPresent[i] = options.JoysPresent?.[i] ?? false;
    joyHardwarePresent[i] = JoysPresent[i];
    joyAbs[i].x = JoysPresent[i] ? 2500 : 0;
    joyAbs[i].y = JoysPresent[i] ? 2500 : 0;
    joyButtons[i] = 0;
    JoyDefs[i] = newJoystickDef();
  }
  Keyboard.fill(false);
  Controls.fill(ctrl_Keyboard1);
  Paused = false;
  LastASCII = key_None;
  LastScan = sc_None;
  CapsLock = false;
  CurCode = sc_None;
  LastCode = sc_None;
  specialKeyPrefix = false;
  INL_KeyHook = null;
  inputArgv = options.argv ? [...options.argv] : ["wolf3d.exe"];
  mouseButtons = 0;
  mouseDeltaX = 0;
  mouseDeltaY = 0;
  MouseDownCount = 0;
  DemoMode = demo_Off;
  DemoBuffer = new Uint8Array(0);
  DemoOffset = 0;
  DemoSize = 0;
  btnstate.fill(false);
  return IN_DebugState();
}

export function IN_SetArgv(argv: readonly string[]): readonly string[] {
  inputArgv = [...argv];
  return inputArgv;
}

export function IN_SetMouseState(options: MouseStateOptions): InputManagerSummary {
  if (options.present !== undefined) {
    mouseHardwarePresent = options.present;
    MousePresent = options.present;
  }
  if (options.buttons !== undefined) {
    mouseButtons = options.buttons & 0xff;
  }
  if (options.deltaX !== undefined) {
    mouseDeltaX = Math.trunc(options.deltaX);
  }
  if (options.deltaY !== undefined) {
    mouseDeltaY = Math.trunc(options.deltaY);
  }
  if (options.addDeltaX !== undefined) {
    mouseDeltaX = Math.trunc(mouseDeltaX + options.addDeltaX);
  }
  if (options.addDeltaY !== undefined) {
    mouseDeltaY = Math.trunc(mouseDeltaY + options.addDeltaY);
  }
  return IN_DebugState();
}

export function IN_SetJoyState(joy: number, options: JoyStateOptions): InputManagerSummary {
  checkJoy(joy);
  if (options.present !== undefined) {
    joyHardwarePresent[joy] = options.present;
    JoysPresent[joy] = options.present;
    if (options.present && joyAbs[joy].x === 0 && joyAbs[joy].y === 0) {
      joyAbs[joy].x = 2500;
      joyAbs[joy].y = 2500;
    }
  }
  if (options.x !== undefined) {
    joyAbs[joy].x = u16(options.x);
  }
  if (options.y !== undefined) {
    joyAbs[joy].y = u16(options.y);
  }
  if (options.buttons !== undefined) {
    joyButtons[joy] = options.buttons & 3;
  }
  return IN_DebugState();
}

export function IN_SetDemoBuffer(
  mode: Demo,
  buffer: Uint8Array | readonly number[],
  size = buffer.length,
  offset = 0,
): InputManagerSummary {
  DemoMode = mode;
  DemoBuffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  DemoSize = Math.min(u16(size), DemoBuffer.length);
  DemoOffset = u16(offset);
  return IN_DebugState();
}

export function IN_StartDemoPlayback(buffer: Uint8Array | readonly number[]): InputManagerSummary {
  return IN_SetDemoBuffer(demo_Playback, buffer, buffer.length, 0);
}

export function IN_StartDemoRecord(bufferOrSize: Uint8Array | number): InputManagerSummary {
  DemoBuffer = typeof bufferOrSize === "number" ? new Uint8Array(bufferOrSize) : bufferOrSize;
  DemoBuffer.fill(0);
  DemoMode = demo_Record;
  DemoOffset = 0;
  DemoSize = DemoBuffer.length;
  return IN_DebugState();
}

export function IN_StopDemo(): InputManagerSummary {
  DemoMode = demo_Off;
  return IN_DebugState();
}

export function IN_KeyDown(code: ScanCode): boolean {
  return Keyboard[code & 0x7f] ?? false;
}

export function IN_ClearKey(code: ScanCode): InputManagerSummary {
  const scan = code & 0x7f;
  Keyboard[scan] = false;
  if (scan === LastScan) {
    LastScan = sc_None;
  }
  return IN_DebugState();
}

export function IN_SetKeyboardState(code: ScanCode, down: boolean, ascii = key_None): InputManagerSummary {
  const summary = INL_KeyService(down ? code : (code | 0x80));
  if (ascii) {
    LastASCII = ascii & 0xff;
  }
  return summary;
}

export function IN_SetPaused(paused: boolean): InputManagerSummary {
  Paused = !!paused;
  return IN_DebugState();
}

export function IN_Ack(maxPolls = 1, pollHook: ((poll: number) => void) | null = null): boolean {
  IN_StartAck();

  for (let poll = 0; poll < maxPolls; poll++) {
    pollHook?.(poll);
    if (IN_CheckAck()) {
      return true;
    }
  }
  return false;
}

export function IN_CheckAck(): boolean {
  let buttons: number;

  if (LastScan) {
    return true;
  }

  buttons = IN_JoyButtons() << 4;
  if (MousePresent) {
    buttons |= IN_MouseButtons();
  }

  for (let i = 0; i < 8; i++, buttons >>= 1) {
    if (buttons & 1) {
      if (!btnstate[i]) {
        return true;
      }
    } else {
      btnstate[i] = false;
    }
  }

  return false;
}

export function IN_ClearKeysDown(): InputManagerSummary {
  LastScan = sc_None;
  LastASCII = key_None;
  Keyboard.fill(false);
  return IN_DebugState();
}

export function IN_Default(gotit: boolean, input: ControlType): InputManagerSummary {
  let selected = input;
  if (
    (!gotit)
    || ((selected === ctrl_Joystick1) && !JoysPresent[0])
    || ((selected === ctrl_Joystick2) && !JoysPresent[1])
    || ((selected === ctrl_Mouse) && !MousePresent)
  ) {
    selected = ctrl_Keyboard1;
  }
  IN_SetControlType(0, selected);
  return IN_DebugState();
}

export function IN_GetJoyAbs(joy: number): AxisAbs {
  checkJoy(joy);
  return { x: joyAbs[joy].x, y: joyAbs[joy].y };
}

export function IN_GetJoyButtonsDB(joy: number): number {
  return INL_GetJoyButtons(joy);
}

export function IN_JoyButtons(): number {
  return (joyButtons[0] & 3) | ((joyButtons[1] & 3) << 2);
}

export function IN_MouseButtons(): number {
  return MousePresent ? mouseButtons & 0xff : 0;
}

export function IN_ReadControl(player: number, info: ControlInfo = newControlInfo()): ControlInfo {
  let realdelta = false;
  let dbyte = 0;
  let buttons = 0;
  let dx = 0;
  let dy = 0;
  let mx: Motion = motion_None;
  let my: Motion = motion_None;

  if (DemoMode === demo_Playback) {
    dbyte = DemoBuffer[DemoOffset + 1] ?? 0;
    my = (((dbyte & 3) - 1) as Motion);
    mx = ((((dbyte >> 2) & 3) - 1) as Motion);
    buttons = (dbyte >> 4) & 3;

    DemoBuffer[DemoOffset] = ((DemoBuffer[DemoOffset] ?? 0) - 1) & 0xff;
    if (!DemoBuffer[DemoOffset]) {
      DemoOffset += 2;
      if (DemoOffset >= DemoSize) {
        DemoMode = demo_PlayDone;
      }
    }

    realdelta = false;
  } else if (DemoMode === demo_PlayDone) {
    throw new Error("Demo playback exceeded");
  } else {
    switch (Controls[player]) {
      case ctrl_Keyboard: {
        const def = KbdDefs;

        if (Keyboard[def.upleft]) {
          mx = motion_Left;
          my = motion_Up;
        } else if (Keyboard[def.upright]) {
          mx = motion_Right;
          my = motion_Up;
        } else if (Keyboard[def.downleft]) {
          mx = motion_Left;
          my = motion_Down;
        } else if (Keyboard[def.downright]) {
          mx = motion_Right;
          my = motion_Down;
        }

        if (Keyboard[def.up]) {
          my = motion_Up;
        } else if (Keyboard[def.down]) {
          my = motion_Down;
        }

        if (Keyboard[def.left]) {
          mx = motion_Left;
        } else if (Keyboard[def.right]) {
          mx = motion_Right;
        }

        if (Keyboard[def.button0]) {
          buttons += 1 << 0;
        }
        if (Keyboard[def.button1]) {
          buttons += 1 << 1;
        }
        realdelta = false;
        break;
      }
      case ctrl_Joystick1:
      case ctrl_Joystick2: {
        const delta = INL_GetJoyDelta(Controls[player] - ctrl_Joystick);
        dx = delta.dx;
        dy = delta.dy;
        buttons = INL_GetJoyButtons(Controls[player] - ctrl_Joystick);
        realdelta = true;
        break;
      }
      case ctrl_Mouse: {
        const delta = INL_GetMouseDelta();
        dx = delta.dx;
        dy = delta.dy;
        buttons = INL_GetMouseButtons();
        realdelta = true;
        break;
      }
    }
  }

  if (realdelta) {
    mx = dx < 0 ? motion_Left : (dx > 0 ? motion_Right : motion_None);
    my = dy < 0 ? motion_Up : (dy > 0 ? motion_Down : motion_None);
  } else {
    dx = mx * 127;
    dy = my * 127;
  }

  info.x = dx;
  info.xaxis = mx;
  info.y = dy;
  info.yaxis = my;
  info.button0 = (buttons & (1 << 0)) !== 0;
  info.button1 = (buttons & (1 << 1)) !== 0;
  info.button2 = (buttons & (1 << 2)) !== 0;
  info.button3 = (buttons & (1 << 3)) !== 0;
  info.dir = DirTable[((my + 1) * 3) + (mx + 1)] as Direction;

  if (DemoMode === demo_Record) {
    dbyte = ((buttons << 4) | ((mx + 1) << 2) | (my + 1)) & 0xff;

    if (
      ((DemoBuffer[DemoOffset + 1] ?? 0) === dbyte)
      && ((DemoBuffer[DemoOffset] ?? 0) < 255)
    ) {
      DemoBuffer[DemoOffset] = ((DemoBuffer[DemoOffset] ?? 0) + 1) & 0xff;
    } else {
      if (DemoOffset || DemoBuffer[DemoOffset]) {
        DemoOffset += 2;
      }

      if (DemoOffset >= DemoSize) {
        throw new Error("Demo buffer overflow");
      }

      DemoBuffer[DemoOffset] = 1;
      DemoBuffer[DemoOffset + 1] = dbyte;
    }
  }

  return info;
}

export function IN_SetControlType(player: number, type: ControlType): InputManagerSummary {
  Controls[player] = type;
  return IN_DebugState();
}

export function IN_SetKeyHook(hook: (() => void) | null): InputManagerSummary {
  INL_KeyHook = hook;
  return IN_DebugState();
}

export function IN_SetupJoy(joy: number, minx: number, maxx: number, miny: number, maxy: number): JoystickDef {
  const def = joyDef(joy);
  let r: number;
  let d: number;

  def.joyMinX = u16(minx);
  def.joyMaxX = u16(maxx);
  r = def.joyMaxX - def.joyMinX;
  d = cdiv(r, 3);
  def.threshMinX = cdiv(r, 2) - d + def.joyMinX;
  def.threshMaxX = cdiv(r, 2) + d + def.joyMinX;

  def.joyMinY = u16(miny);
  def.joyMaxY = u16(maxy);
  r = def.joyMaxY - def.joyMinY;
  d = cdiv(r, 3);
  def.threshMinY = cdiv(r, 2) - d + def.joyMinY;
  def.threshMaxY = cdiv(r, 2) + d + def.joyMinY;

  return INL_SetJoyScale(joy);
}

export function IN_Shutdown(): InputManagerSummary {
  if (!IN_Started) {
    return IN_DebugState();
  }

  INL_ShutMouse();
  for (let i = 0; i < MaxJoys; i++) {
    INL_ShutJoy(i);
  }
  INL_ShutKbd();

  IN_Started = false;
  return IN_DebugState();
}

export function IN_StartAck(): InputManagerSummary {
  let buttons: number;

  IN_ClearKeysDown();
  btnstate.fill(false);

  buttons = IN_JoyButtons() << 4;
  if (MousePresent) {
    buttons |= IN_MouseButtons();
  }

  for (let i = 0; i < 8; i++, buttons >>= 1) {
    if (buttons & 1) {
      btnstate[i] = true;
    }
  }

  return IN_DebugState();
}

export function IN_Startup(argv: readonly string[] = inputArgv): InputManagerSummary {
  let checkjoys = true;
  let checkmouse = true;

  if (IN_Started) {
    return IN_DebugState();
  }

  for (let i = 1; i < argv.length; i++) {
    switch (US_CheckParm(argv[i], ParmStrings)) {
      case 0:
        checkjoys = false;
        break;
      case 1:
        checkmouse = false;
        break;
    }
  }

  INL_StartKbd();
  MousePresent = checkmouse ? INL_StartMouse() : false;

  for (let i = 0; i < MaxJoys; i++) {
    JoysPresent[i] = checkjoys ? INL_StartJoy(i) : false;
  }

  IN_Started = true;
  return IN_DebugState();
}

export function IN_UserInput(
  delay: number,
  maxPolls = 1,
  pollHook: ((poll: number) => void) | null = null,
): boolean {
  const lasttime = TimeCount;
  let polls = 0;

  IN_StartAck();
  do {
    pollHook?.(polls);
    if (IN_CheckAck()) {
      return true;
    }
    polls++;
    if (polls >= maxPolls) {
      return false;
    }
  } while (((TimeCount - lasttime) >>> 0) < delay);

  return false;
}

export function IN_WaitForASCII(): number {
  const result = LastASCII;
  LastASCII = key_None;
  return result;
}

export function IN_WaitForKey(): ScanCode {
  const result = LastScan;
  LastScan = sc_None;
  return result;
}

export function INL_GetJoyButtons(joy: number): number {
  checkJoy(joy);
  return joyButtons[joy] & 3;
}

export function INL_GetJoyDelta(joy: number): AxisDelta {
  const { x, y } = IN_GetJoyAbs(joy);
  const def = joyDef(joy);
  let dx: number;
  let dy: number;
  let scaled: number;

  if (x < def.threshMinX) {
    const bounded = x < def.joyMinX ? def.joyMinX : x;
    scaled = (-(bounded - def.threshMinX) * def.joyMultXL) >> JoyScaleShift;
    dx = scaled > 127 ? -127 : -scaled;
  } else if (x > def.threshMaxX) {
    const bounded = x > def.joyMaxX ? def.joyMaxX : x;
    scaled = ((bounded - def.threshMaxX) * def.joyMultXH) >> JoyScaleShift;
    dx = scaled > 127 ? 127 : scaled;
  } else {
    dx = 0;
  }

  if (y < def.threshMinY) {
    const bounded = y < def.joyMinY ? def.joyMinY : y;
    scaled = (-(bounded - def.threshMinY) * def.joyMultYL) >> JoyScaleShift;
    dy = scaled > 127 ? -127 : -scaled;
  } else if (y > def.threshMaxY) {
    const bounded = y > def.joyMaxY ? def.joyMaxY : y;
    scaled = ((bounded - def.threshMaxY) * def.joyMultYH) >> JoyScaleShift;
    dy = scaled > 127 ? 127 : scaled;
  } else {
    dy = 0;
  }

  return { dx, dy };
}

export function INL_GetMouseButtons(): number {
  return mouseButtons & 0xff;
}

export function INL_GetMouseDelta(): AxisDelta {
  const dx = mouseDeltaX;
  const dy = mouseDeltaY;
  mouseDeltaX = 0;
  mouseDeltaY = 0;
  return { dx, dy };
}

export function INL_KeyService(rawScan: number = sc_None): InputManagerSummary {
  let k = rawScan & 0xff;
  let c = 0;

  if (k === 0xe0) {
    specialKeyPrefix = true;
  } else if (k === 0xe1) {
    Paused = true;
  } else {
    if (k & 0x80) {
      k &= 0x7f;
      Keyboard[k] = false;
    } else {
      LastCode = CurCode;
      CurCode = k;
      LastScan = k;
      Keyboard[k] = true;

      if (specialKeyPrefix) {
        c = SpecialNames[k] ?? 0;
      } else {
        if (k === sc_CapsLock) {
          CapsLock = !CapsLock;
        }

        if (Keyboard[sc_LShift] || Keyboard[sc_RShift]) {
          c = ShiftNames[k] ?? 0;
          if ((c >= 65) && (c <= 90) && CapsLock) {
            c += 32;
          }
        } else {
          c = ASCIINames[k] ?? 0;
          if ((c >= 97) && (c <= 122) && CapsLock) {
            c -= 32;
          }
        }
      }
      if (c) {
        LastASCII = c;
      }
    }

    specialKeyPrefix = false;
  }

  if (INL_KeyHook && !specialKeyPrefix) {
    INL_KeyHook();
  }

  return IN_DebugState();
}

export function INL_SetJoyScale(joy: number): JoystickDef {
  const def = joyDef(joy);
  def.joyMultXL = cdiv(JoyScaleMax, def.threshMinX - def.joyMinX);
  def.joyMultXH = cdiv(JoyScaleMax, def.joyMaxX - def.threshMaxX);
  def.joyMultYL = cdiv(JoyScaleMax, def.threshMinY - def.joyMinY);
  def.joyMultYH = cdiv(JoyScaleMax, def.joyMaxY - def.threshMaxY);
  return def;
}

export function INL_ShutJoy(joy: number): InputManagerSummary {
  checkJoy(joy);
  JoysPresent[joy] = false;
  return IN_DebugState();
}

export function INL_ShutKbd(): InputManagerSummary {
  return IN_ClearKeysDown();
}

export function INL_ShutMouse(): InputManagerSummary {
  return IN_DebugState();
}

export function INL_StartJoy(joy: number): boolean {
  const { x, y } = IN_GetJoyAbs(joy);

  if (
    !joyHardwarePresent[joy]
    || ((x === 0) || (x > MaxJoyValue - 10))
    || ((y === 0) || (y > MaxJoyValue - 10))
  ) {
    return false;
  }

  IN_SetupJoy(joy, 0, x * 2, 0, y * 2);
  return true;
}

export function INL_StartKbd(): InputManagerSummary {
  INL_KeyHook = null;
  return IN_ClearKeysDown();
}

export function INL_StartMouse(): boolean {
  return mouseHardwarePresent;
}

function newControlInfo(): ControlInfo {
  return {
    button0: false,
    button1: false,
    button2: false,
    button3: false,
    x: 0,
    y: 0,
    xaxis: motion_None,
    yaxis: motion_None,
    dir: dir_None,
  };
}

function newJoystickDef(): JoystickDef {
  return {
    joyMinX: 0,
    joyMinY: 0,
    threshMinX: 0,
    threshMinY: 0,
    threshMaxX: 0,
    threshMaxY: 0,
    joyMaxX: 0,
    joyMaxY: 0,
    joyMultXL: 0,
    joyMultYL: 0,
    joyMultXH: 0,
    joyMultYH: 0,
  };
}

function joyDef(joy: number): JoystickDef {
  checkJoy(joy);
  return JoyDefs[joy];
}

function checkJoy(joy: number): void {
  if (joy < 0 || joy >= MaxJoys) {
    throw new RangeError(`bad joystick index ${joy}`);
  }
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID Engine
// //	ID_IN.c - Input Manager
// //	v1.0d1
// //	By Jason Blochowiak
// //
// 
// //
// //	This module handles dealing with the various input devices
// //
// //	Depends on: Memory Mgr (for demo recording), Sound Mgr (for timing stuff),
// //				User Mgr (for command line parms)
// //
// //	Globals:
// //		LastScan - The keyboard scan code of the last key pressed
// //		LastASCII - The ASCII value of the last key pressed
// //	DEBUG - there are more globals
// //
// 
// #include "ID_HEADS.H"
// #pragma	hdrstop
// 
// #define	KeyInt		9	// The keyboard ISR number
// 
// //
// // mouse constants
// //
// #define	MReset		0
// #define	MButtons	3
// #define	MDelta		11
// 
// #define	MouseInt	0x33
// #define	Mouse(x)	_AX = x,geninterrupt(MouseInt)
// 
// //
// // joystick constants
// //
// #define	JoyScaleMax		32768
// #define	JoyScaleShift	8
// #define	MaxJoyValue		5000
// 
// /*
// =============================================================================
// 
// 					GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// //
// // configuration variables
// //
// boolean			MousePresent;
// boolean			JoysPresent[MaxJoys];
// boolean			JoyPadPresent;
// 
// 
// // 	Global variables
// 		boolean		Keyboard[NumCodes];
// 		boolean		Paused;
// 		char		LastASCII;
// 		ScanCode	LastScan;
// 
// 		KeyboardDef	KbdDefs = {0x1d,0x38,0x47,0x48,0x49,0x4b,0x4d,0x4f,0x50,0x51};
// 		JoystickDef	JoyDefs[MaxJoys];
// 		ControlType	Controls[MaxPlayers];
// 
// 		longword	MouseDownCount;
// 
// 		Demo		DemoMode = demo_Off;
// 		byte _seg	*DemoBuffer;
// 		word		DemoOffset,DemoSize;
// 
// /*
// =============================================================================
// 
// 					LOCAL VARIABLES
// 
// =============================================================================
// */
// static	byte        far ASCIINames[] =		// Unshifted ASCII for scan codes
// 					{
// //	 0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
// 	0  ,27 ,'1','2','3','4','5','6','7','8','9','0','-','=',8  ,9  ,	// 0
// 	'q','w','e','r','t','y','u','i','o','p','[',']',13 ,0  ,'a','s',	// 1
// 	'd','f','g','h','j','k','l',';',39 ,'`',0  ,92 ,'z','x','c','v',	// 2
// 	'b','n','m',',','.','/',0  ,'*',0  ,' ',0  ,0  ,0  ,0  ,0  ,0  ,	// 3
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,'7','8','9','-','4','5','6','+','1',	// 4
// 	'2','3','0',127,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 5
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 6
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0		// 7
// 					},
// 					far ShiftNames[] =		// Shifted ASCII for scan codes
// 					{
// //	 0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
// 	0  ,27 ,'!','@','#','$','%','^','&','*','(',')','_','+',8  ,9  ,	// 0
// 	'Q','W','E','R','T','Y','U','I','O','P','{','}',13 ,0  ,'A','S',	// 1
// 	'D','F','G','H','J','K','L',':',34 ,'~',0  ,'|','Z','X','C','V',	// 2
// 	'B','N','M','<','>','?',0  ,'*',0  ,' ',0  ,0  ,0  ,0  ,0  ,0  ,	// 3
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,'7','8','9','-','4','5','6','+','1',	// 4
// 	'2','3','0',127,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 5
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 6
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0   	// 7
// 					},
// 					far SpecialNames[] =	// ASCII for 0xe0 prefixed codes
// 					{
// //	 0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 0
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,13 ,0  ,0  ,0  ,	// 1
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 2
// 	0  ,0  ,0  ,0  ,0  ,'/',0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 3
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 4
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 5
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,	// 6
// 	0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0  ,0   	// 7
// 					};
// 
// 
// static	boolean		IN_Started;
// static	boolean		CapsLock;
// static	ScanCode	CurCode,LastCode;
// 
// static	Direction	DirTable[] =		// Quick lookup for total direction
// 					{
// 						dir_NorthWest,	dir_North,	dir_NorthEast,
// 						dir_West,		dir_None,	dir_East,
// 						dir_SouthWest,	dir_South,	dir_SouthEast
// 					};
// 
// static	void			(*INL_KeyHook)(void);
// static	void interrupt	(*OldKeyVect)(void);
// 
// static	char			*ParmStrings[] = {"nojoys","nomouse",nil};
// 
// //	Internal routines
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_KeyService() - Handles a keyboard interrupt (key up/down)
// //
// ///////////////////////////////////////////////////////////////////////////
// static void interrupt
// INL_KeyService(void)
// {
// static	boolean	special;
// 		byte	k,c,
// 				temp;
// 		int		i;
// 
// 	k = inportb(0x60);	// Get the scan code
// 
// 	// Tell the XT keyboard controller to clear the key
// 	outportb(0x61,(temp = inportb(0x61)) | 0x80);
// 	outportb(0x61,temp);
// 
// 	if (k == 0xe0)		// Special key prefix
// 		special = true;
// 	else if (k == 0xe1)	// Handle Pause key
// 		Paused = true;
// 	else
// 	{
// 		if (k & 0x80)	// Break code
// 		{
// 			k &= 0x7f;
// 
// // DEBUG - handle special keys: ctl-alt-delete, print scrn
// 
// 			Keyboard[k] = false;
// 		}
// 		else			// Make code
// 		{
// 			LastCode = CurCode;
// 			CurCode = LastScan = k;
// 			Keyboard[k] = true;
// 
// 			if (special)
// 				c = SpecialNames[k];
// 			else
// 			{
// 				if (k == sc_CapsLock)
// 				{
// 					CapsLock ^= true;
// 					// DEBUG - make caps lock light work
// 				}
// 
// 				if (Keyboard[sc_LShift] || Keyboard[sc_RShift])	// If shifted
// 				{
// 					c = ShiftNames[k];
// 					if ((c >= 'A') && (c <= 'Z') && CapsLock)
// 						c += 'a' - 'A';
// 				}
// 				else
// 				{
// 					c = ASCIINames[k];
// 					if ((c >= 'a') && (c <= 'z') && CapsLock)
// 						c -= 'a' - 'A';
// 				}
// 			}
// 			if (c)
// 				LastASCII = c;
// 		}
// 
// 		special = false;
// 	}
// 
// 	if (INL_KeyHook && !special)
// 		INL_KeyHook();
// 	outportb(0x20,0x20);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_GetMouseDelta() - Gets the amount that the mouse has moved from the
// //		mouse driver
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// INL_GetMouseDelta(int *x,int *y)
// {
// 	Mouse(MDelta);
// 	*x = _CX;
// 	*y = _DX;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_GetMouseButtons() - Gets the status of the mouse buttons from the
// //		mouse driver
// //
// ///////////////////////////////////////////////////////////////////////////
// static word
// INL_GetMouseButtons(void)
// {
// 	word	buttons;
// 
// 	Mouse(MButtons);
// 	buttons = _BX;
// 	return(buttons);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_GetJoyAbs() - Reads the absolute position of the specified joystick
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_GetJoyAbs(word joy,word *xp,word *yp)
// {
// 	byte	xb,yb,
// 			xs,ys;
// 	word	x,y;
// 
// 	x = y = 0;
// 	xs = joy? 2 : 0;		// Find shift value for x axis
// 	xb = 1 << xs;			// Use shift value to get x bit mask
// 	ys = joy? 3 : 1;		// Do the same for y axis
// 	yb = 1 << ys;
// 
// // Read the absolute joystick values
// asm		pushf				// Save some registers
// asm		push	si
// asm		push	di
// asm		cli					// Make sure an interrupt doesn't screw the timings
// 
// 
// asm		mov		dx,0x201
// asm		in		al,dx
// asm		out		dx,al		// Clear the resistors
// 
// asm		mov		ah,[xb]		// Get masks into registers
// asm		mov		ch,[yb]
// 
// asm		xor		si,si		// Clear count registers
// asm		xor		di,di
// asm		xor		bh,bh		// Clear high byte of bx for later
// 
// asm		push	bp			// Don't mess up stack frame
// asm		mov		bp,MaxJoyValue
// 
// loop:
// asm		in		al,dx		// Get bits indicating whether all are finished
// 
// asm		dec		bp			// Check bounding register
// asm		jz		done		// We have a silly value - abort
// 
// asm		mov		bl,al		// Duplicate the bits
// asm		and		bl,ah		// Mask off useless bits (in [xb])
// asm		add		si,bx		// Possibly increment count register
// asm		mov		cl,bl		// Save for testing later
// 
// asm		mov		bl,al
// asm		and		bl,ch		// [yb]
// asm		add		di,bx
// 
// asm		add		cl,bl
// asm		jnz		loop 		// If both bits were 0, drop out
// 
// done:
// asm     pop		bp
// 
// asm		mov		cl,[xs]		// Get the number of bits to shift
// asm		shr		si,cl		//  and shift the count that many times
// 
// asm		mov		cl,[ys]
// asm		shr		di,cl
// 
// asm		mov		[x],si		// Store the values into the variables
// asm		mov		[y],di
// 
// asm		pop		di
// asm		pop		si
// asm		popf				// Restore the registers
// 
// 	*xp = x;
// 	*yp = y;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_GetJoyDelta() - Returns the relative movement of the specified
// //		joystick (from +/-127)
// //
// ///////////////////////////////////////////////////////////////////////////
// void INL_GetJoyDelta(word joy,int *dx,int *dy)
// {
// 	word		x,y;
// 	longword	time;
// 	JoystickDef	*def;
// static	longword	lasttime;
// 
// 	IN_GetJoyAbs(joy,&x,&y);
// 	def = JoyDefs + joy;
// 
// 	if (x < def->threshMinX)
// 	{
// 		if (x < def->joyMinX)
// 			x = def->joyMinX;
// 
// 		x = -(x - def->threshMinX);
// 		x *= def->joyMultXL;
// 		x >>= JoyScaleShift;
// 		*dx = (x > 127)? -127 : -x;
// 	}
// 	else if (x > def->threshMaxX)
// 	{
// 		if (x > def->joyMaxX)
// 			x = def->joyMaxX;
// 
// 		x = x - def->threshMaxX;
// 		x *= def->joyMultXH;
// 		x >>= JoyScaleShift;
// 		*dx = (x > 127)? 127 : x;
// 	}
// 	else
// 		*dx = 0;
// 
// 	if (y < def->threshMinY)
// 	{
// 		if (y < def->joyMinY)
// 			y = def->joyMinY;
// 
// 		y = -(y - def->threshMinY);
// 		y *= def->joyMultYL;
// 		y >>= JoyScaleShift;
// 		*dy = (y > 127)? -127 : -y;
// 	}
// 	else if (y > def->threshMaxY)
// 	{
// 		if (y > def->joyMaxY)
// 			y = def->joyMaxY;
// 
// 		y = y - def->threshMaxY;
// 		y *= def->joyMultYH;
// 		y >>= JoyScaleShift;
// 		*dy = (y > 127)? 127 : y;
// 	}
// 	else
// 		*dy = 0;
// 
// 	lasttime = TimeCount;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_GetJoyButtons() - Returns the button status of the specified
// //		joystick
// //
// ///////////////////////////////////////////////////////////////////////////
// static word
// INL_GetJoyButtons(word joy)
// {
// register	word	result;
// 
// 	result = inportb(0x201);	// Get all the joystick buttons
// 	result >>= joy? 6 : 4;	// Shift into bits 0-1
// 	result &= 3;				// Mask off the useless bits
// 	result ^= 3;
// 	return(result);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_GetJoyButtonsDB() - Returns the de-bounced button status of the
// //		specified joystick
// //
// ///////////////////////////////////////////////////////////////////////////
// word
// IN_GetJoyButtonsDB(word joy)
// {
// 	longword	lasttime;
// 	word		result1,result2;
// 
// 	do
// 	{
// 		result1 = INL_GetJoyButtons(joy);
// 		lasttime = TimeCount;
// 		while (TimeCount == lasttime)
// 			;
// 		result2 = INL_GetJoyButtons(joy);
// 	} while (result1 != result2);
// 	return(result1);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_StartKbd() - Sets up my keyboard stuff for use
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// INL_StartKbd(void)
// {
// 	INL_KeyHook = NULL;			// no key hook routine
// 
// 	IN_ClearKeysDown();
// 
// 	OldKeyVect = getvect(KeyInt);
// 	setvect(KeyInt,INL_KeyService);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_ShutKbd() - Restores keyboard control to the BIOS
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// INL_ShutKbd(void)
// {
// 	poke(0x40,0x17,peek(0x40,0x17) & 0xfaf0);	// Clear ctrl/alt/shift flags
// 
// 	setvect(KeyInt,OldKeyVect);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_StartMouse() - Detects and sets up the mouse
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// INL_StartMouse(void)
// {
// #if 0
// 	if (getvect(MouseInt))
// 	{
// 		Mouse(MReset);
// 		if (_AX == 0xffff)
// 			return(true);
// 	}
// 	return(false);
// #endif
//  union REGS regs;
//  unsigned char far *vector;
// 
// 
//  if ((vector=MK_FP(peek(0,0x33*4+2),peek(0,0x33*4)))==NULL)
//    return false;
// 
//  if (*vector == 207)
//    return false;
// 
//  Mouse(MReset);
//  return true;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_ShutMouse() - Cleans up after the mouse
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// INL_ShutMouse(void)
// {
// }
// 
// //
// //	INL_SetJoyScale() - Sets up scaling values for the specified joystick
// //
// static void
// INL_SetJoyScale(word joy)
// {
// 	JoystickDef	*def;
// 
// 	def = &JoyDefs[joy];
// 	def->joyMultXL = JoyScaleMax / (def->threshMinX - def->joyMinX);
// 	def->joyMultXH = JoyScaleMax / (def->joyMaxX - def->threshMaxX);
// 	def->joyMultYL = JoyScaleMax / (def->threshMinY - def->joyMinY);
// 	def->joyMultYH = JoyScaleMax / (def->joyMaxY - def->threshMaxY);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_SetupJoy() - Sets up thresholding values and calls INL_SetJoyScale()
// //		to set up scaling values
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_SetupJoy(word joy,word minx,word maxx,word miny,word maxy)
// {
// 	word		d,r;
// 	JoystickDef	*def;
// 
// 	def = &JoyDefs[joy];
// 
// 	def->joyMinX = minx;
// 	def->joyMaxX = maxx;
// 	r = maxx - minx;
// 	d = r / 3;
// 	def->threshMinX = ((r / 2) - d) + minx;
// 	def->threshMaxX = ((r / 2) + d) + minx;
// 
// 	def->joyMinY = miny;
// 	def->joyMaxY = maxy;
// 	r = maxy - miny;
// 	d = r / 3;
// 	def->threshMinY = ((r / 2) - d) + miny;
// 	def->threshMaxY = ((r / 2) + d) + miny;
// 
// 	INL_SetJoyScale(joy);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_StartJoy() - Detects & auto-configures the specified joystick
// //					The auto-config assumes the joystick is centered
// //
// ///////////////////////////////////////////////////////////////////////////
// static boolean
// INL_StartJoy(word joy)
// {
// 	word		x,y;
// 
// 	IN_GetJoyAbs(joy,&x,&y);
// 
// 	if
// 	(
// 		((x == 0) || (x > MaxJoyValue - 10))
// 	||	((y == 0) || (y > MaxJoyValue - 10))
// 	)
// 		return(false);
// 	else
// 	{
// 		IN_SetupJoy(joy,0,x * 2,0,y * 2);
// 		return(true);
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	INL_ShutJoy() - Cleans up the joystick stuff
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// INL_ShutJoy(word joy)
// {
// 	JoysPresent[joy] = false;
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_Startup() - Starts up the Input Mgr
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_Startup(void)
// {
// 	boolean	checkjoys,checkmouse;
// 	word	i;
// 
// 	if (IN_Started)
// 		return;
// 
// 	checkjoys = true;
// 	checkmouse = true;
// 	for (i = 1;i < _argc;i++)
// 	{
// 		switch (US_CheckParm(_argv[i],ParmStrings))
// 		{
// 		case 0:
// 			checkjoys = false;
// 			break;
// 		case 1:
// 			checkmouse = false;
// 			break;
// 		}
// 	}
// 
// 	INL_StartKbd();
// 	MousePresent = checkmouse? INL_StartMouse() : false;
// 
// 	for (i = 0;i < MaxJoys;i++)
// 		JoysPresent[i] = checkjoys? INL_StartJoy(i) : false;
// 
// 	IN_Started = true;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_Default() - Sets up default conditions for the Input Mgr
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_Default(boolean gotit,ControlType in)
// {
// 	if
// 	(
// 		(!gotit)
// 	|| 	((in == ctrl_Joystick1) && !JoysPresent[0])
// 	|| 	((in == ctrl_Joystick2) && !JoysPresent[1])
// 	|| 	((in == ctrl_Mouse) && !MousePresent)
// 	)
// 		in = ctrl_Keyboard1;
// 	IN_SetControlType(0,in);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_Shutdown() - Shuts down the Input Mgr
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_Shutdown(void)
// {
// 	word	i;
// 
// 	if (!IN_Started)
// 		return;
// 
// 	INL_ShutMouse();
// 	for (i = 0;i < MaxJoys;i++)
// 		INL_ShutJoy(i);
// 	INL_ShutKbd();
// 
// 	IN_Started = false;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_SetKeyHook() - Sets the routine that gets called by INL_KeyService()
// //			everytime a real make/break code gets hit
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_SetKeyHook(void (*hook)())
// {
// 	INL_KeyHook = hook;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_ClearKeysDown() - Clears the keyboard array
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_ClearKeysDown(void)
// {
// 	int	i;
// 
// 	LastScan = sc_None;
// 	LastASCII = key_None;
// 	memset (Keyboard,0,sizeof(Keyboard));
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_ReadControl() - Reads the device associated with the specified
// //		player and fills in the control info struct
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_ReadControl(int player,ControlInfo *info)
// {
// 			boolean		realdelta;
// 			byte		dbyte;
// 			word		buttons;
// 			int			dx,dy;
// 			Motion		mx,my;
// 			ControlType	type;
// register	KeyboardDef	*def;
// 
// 	dx = dy = 0;
// 	mx = my = motion_None;
// 	buttons = 0;
// 
// 	if (DemoMode == demo_Playback)
// 	{
// 		dbyte = DemoBuffer[DemoOffset + 1];
// 		my = (dbyte & 3) - 1;
// 		mx = ((dbyte >> 2) & 3) - 1;
// 		buttons = (dbyte >> 4) & 3;
// 
// 		if (!(--DemoBuffer[DemoOffset]))
// 		{
// 			DemoOffset += 2;
// 			if (DemoOffset >= DemoSize)
// 				DemoMode = demo_PlayDone;
// 		}
// 
// 		realdelta = false;
// 	}
// 	else if (DemoMode == demo_PlayDone)
// 		Quit("Demo playback exceeded");
// 	else
// 	{
// 		switch (type = Controls[player])
// 		{
// 		case ctrl_Keyboard:
// 			def = &KbdDefs;
// 
// 			if (Keyboard[def->upleft])
// 				mx = motion_Left,my = motion_Up;
// 			else if (Keyboard[def->upright])
// 				mx = motion_Right,my = motion_Up;
// 			else if (Keyboard[def->downleft])
// 				mx = motion_Left,my = motion_Down;
// 			else if (Keyboard[def->downright])
// 				mx = motion_Right,my = motion_Down;
// 
// 			if (Keyboard[def->up])
// 				my = motion_Up;
// 			else if (Keyboard[def->down])
// 				my = motion_Down;
// 
// 			if (Keyboard[def->left])
// 				mx = motion_Left;
// 			else if (Keyboard[def->right])
// 				mx = motion_Right;
// 
// 			if (Keyboard[def->button0])
// 				buttons += 1 << 0;
// 			if (Keyboard[def->button1])
// 				buttons += 1 << 1;
// 			realdelta = false;
// 			break;
// 		case ctrl_Joystick1:
// 		case ctrl_Joystick2:
// 			INL_GetJoyDelta(type - ctrl_Joystick,&dx,&dy);
// 			buttons = INL_GetJoyButtons(type - ctrl_Joystick);
// 			realdelta = true;
// 			break;
// 		case ctrl_Mouse:
// 			INL_GetMouseDelta(&dx,&dy);
// 			buttons = INL_GetMouseButtons();
// 			realdelta = true;
// 			break;
// 		}
// 	}
// 
// 	if (realdelta)
// 	{
// 		mx = (dx < 0)? motion_Left : ((dx > 0)? motion_Right : motion_None);
// 		my = (dy < 0)? motion_Up : ((dy > 0)? motion_Down : motion_None);
// 	}
// 	else
// 	{
// 		dx = mx * 127;
// 		dy = my * 127;
// 	}
// 
// 	info->x = dx;
// 	info->xaxis = mx;
// 	info->y = dy;
// 	info->yaxis = my;
// 	info->button0 = buttons & (1 << 0);
// 	info->button1 = buttons & (1 << 1);
// 	info->button2 = buttons & (1 << 2);
// 	info->button3 = buttons & (1 << 3);
// 	info->dir = DirTable[((my + 1) * 3) + (mx + 1)];
// 
// 	if (DemoMode == demo_Record)
// 	{
// 		// Pack the control info into a byte
// 		dbyte = (buttons << 4) | ((mx + 1) << 2) | (my + 1);
// 
// 		if
// 		(
// 			(DemoBuffer[DemoOffset + 1] == dbyte)
// 		&&	(DemoBuffer[DemoOffset] < 255)
// 		)
// 			(DemoBuffer[DemoOffset])++;
// 		else
// 		{
// 			if (DemoOffset || DemoBuffer[DemoOffset])
// 				DemoOffset += 2;
// 
// 			if (DemoOffset >= DemoSize)
// 				Quit("Demo buffer overflow");
// 
// 			DemoBuffer[DemoOffset] = 1;
// 			DemoBuffer[DemoOffset + 1] = dbyte;
// 		}
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_SetControlType() - Sets the control type to be used by the specified
// //		player
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// IN_SetControlType(int player,ControlType type)
// {
// 	// DEBUG - check that requested type is present?
// 	Controls[player] = type;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_WaitForKey() - Waits for a scan code, then clears LastScan and
// //		returns the scan code
// //
// ///////////////////////////////////////////////////////////////////////////
// ScanCode
// IN_WaitForKey(void)
// {
// 	ScanCode	result;
// 
// 	while (!(result = LastScan))
// 		;
// 	LastScan = 0;
// 	return(result);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_WaitForASCII() - Waits for an ASCII char, then clears LastASCII and
// //		returns the ASCII value
// //
// ///////////////////////////////////////////////////////////////////////////
// char
// IN_WaitForASCII(void)
// {
// 	char		result;
// 
// 	while (!(result = LastASCII))
// 		;
// 	LastASCII = '\0';
// 	return(result);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_Ack() - waits for a button or key press.  If a button is down, upon
// // calling, it must be released for it to be recognized
// //
// ///////////////////////////////////////////////////////////////////////////
// 
// boolean	btnstate[8];
// 
// void IN_StartAck(void)
// {
// 	unsigned	i,buttons;
// 
// //
// // get initial state of everything
// //
// 	IN_ClearKeysDown();
// 	memset (btnstate,0,sizeof(btnstate));
// 
// 	buttons = IN_JoyButtons () << 4;
// 	if (MousePresent)
// 		buttons |= IN_MouseButtons ();
// 
// 	for (i=0;i<8;i++,buttons>>=1)
// 		if (buttons&1)
// 			btnstate[i] = true;
// }
// 
// 
// boolean IN_CheckAck (void)
// {
// 	unsigned	i,buttons;
// 
// //
// // see if something has been pressed
// //
// 	if (LastScan)
// 		return true;
// 
// 	buttons = IN_JoyButtons () << 4;
// 	if (MousePresent)
// 		buttons |= IN_MouseButtons ();
// 
// 	for (i=0;i<8;i++,buttons>>=1)
// 		if ( buttons&1 )
// 		{
// 			if (!btnstate[i])
// 				return true;
// 		}
// 		else
// 			btnstate[i]=false;
// 
// 	return false;
// }
// 
// 
// void IN_Ack (void)
// {
// 	IN_StartAck ();
// 
// 	while (!IN_CheckAck ())
// 	;
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_UserInput() - Waits for the specified delay time (in ticks) or the
// //		user pressing a key or a mouse button. If the clear flag is set, it
// //		then either clears the key or waits for the user to let the mouse
// //		button up.
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean IN_UserInput(longword delay)
// {
// 	longword	lasttime;
// 
// 	lasttime = TimeCount;
// 	IN_StartAck ();
// 	do
// 	{
// 		if (IN_CheckAck())
// 			return true;
// 	} while (TimeCount - lasttime < delay);
// 	return(false);
// }
// 
// //===========================================================================
// 
// /*
// ===================
// =
// = IN_MouseButtons
// =
// ===================
// */
// 
// byte	IN_MouseButtons (void)
// {
// 	if (MousePresent)
// 	{
// 		Mouse(MButtons);
// 		return _BX;
// 	}
// 	else
// 		return 0;
// }
// 
// 
// /*
// ===================
// =
// = IN_JoyButtons
// =
// ===================
// */
// 
// byte	IN_JoyButtons (void)
// {
// 	unsigned joybits;
// 
// 	joybits = inportb(0x201);	// Get all the joystick buttons
// 	joybits >>= 4;				// only the high bits are useful
// 	joybits ^= 15;				// return with 1=pressed
// 
// 	return joybits;
// }
// 
// 
// 
