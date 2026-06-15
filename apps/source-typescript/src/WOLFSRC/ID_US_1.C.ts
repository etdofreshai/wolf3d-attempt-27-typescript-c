import { i32 } from "./TS_C";
import { US_InitRndT } from "./ID_US_A.ASM";
import { IN_ClearKeysDown, type InputManagerSummary } from "./ID_IN.C";
import {
  key_BackSpace,
  key_Delete,
  key_Escape,
  key_None,
  key_Return,
  sc_BackSpace,
  sc_Delete,
  sc_DownArrow,
  sc_End,
  sc_Escape,
  sc_Home,
  sc_Insert,
  sc_LeftArrow,
  sc_None,
  sc_PgDn,
  sc_PgUp,
  sc_Return,
  sc_RightArrow,
  sc_UpArrow,
} from "./ID_IN.H";
import {
  VW_DrawPropString,
  VW_MeasurePropString,
  VW_SetFontState,
  VW_UpdateScreen,
  type MeasureStringSummary,
  type PropStringSummary,
  type UpdateScreenSummary,
} from "./ID_VH.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_US_1.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_US_1.C";
export const WOLFSRC_FUNCTIONS = [
  "US_CenterWindow",
  "US_CheckParm",
  "US_ClearWindow",
  "US_CPrint",
  "US_CPrintLine",
  "US_DrawWindow",
  "US_LineInput",
  "US_Print",
  "US_PrintCentered",
  "US_PrintSigned",
  "US_PrintUnsigned",
  "US_RestoreWindow",
  "US_SaveWindow",
  "US_SetWindowState",
  "US_SetPrintRoutines",
  "US_Shutdown",
  "US_Startup",
  "USL_HardError",
  "USL_PrintInCenter",
  "USL_XORICursor"
] as const;

const MAXX = 320;
const MAXY = 200;
const MaxString = 128;
export const MaxHighName = 57;
export const MaxScores = 7;
const ParmStrings = ["TEDLEVEL", "NOWAIT", ""] as const;
const ParmStrings2 = ["COMP", "NOCOMP", ""] as const;

export let PrintX = 0;
export let PrintY = 0;
export let WindowX = 0;
export let WindowY = 0;
export let WindowW = 0;
export let WindowH = 0;
export let US_Started = false;
export let compatability = false;
export let tedlevel = false;
export let tedlevelnum = 0;
export let NoWait = false;
export let abortprogram: string | null = null;

export interface HighScore {
  name: string;
  score: number;
  completed: number;
  episode: number;
}

export const Scores: HighScore[] = [
  { name: "id software-'92", score: 10000, completed: 1, episode: 0 },
  { name: "Adrian Carmack", score: 10000, completed: 1, episode: 0 },
  { name: "John Carmack", score: 10000, completed: 1, episode: 0 },
  { name: "Kevin Cloud", score: 10000, completed: 1, episode: 0 },
  { name: "Tom Hall", score: 10000, completed: 1, episode: 0 },
  { name: "John Romero", score: 10000, completed: 1, episode: 0 },
  { name: "Jay Wilbur", score: 10000, completed: 1, episode: 0 },
];

export interface WindowSummary {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly windowX: number;
  readonly windowY: number;
  readonly windowW: number;
  readonly windowH: number;
  readonly printX: number;
  readonly printY: number;
  readonly frameX: number;
  readonly frameY: number;
  readonly frameW: number;
  readonly frameH: number;
}

export interface WindowRec {
  x: number;
  y: number;
  w: number;
  h: number;
  px: number;
  py: number;
}

export interface RectPoint {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly ul: RectPoint;
  readonly lr: RectPoint;
}

export interface PrintSegmentSummary {
  readonly text: string;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly draw: PropStringSummary;
}

export interface PrintSummary {
  readonly text: string;
  readonly segments: readonly PrintSegmentSummary[];
  readonly printX: number;
  readonly printY: number;
}

export interface CenterPrintSummary extends PrintSegmentSummary {
  readonly rect: Rect;
}

export interface USLineInputEvent {
  readonly scan?: number;
  readonly ascii?: number | string;
}

export interface USLineInputBuffer {
  value: string;
}

export interface USLineInputOptions {
  readonly events?: readonly USLineInputEvent[];
}

export interface XORICursorSummary {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly cursor: number;
  readonly width: number;
  readonly height: number;
  readonly drawX: number;
  readonly drawY: number;
  readonly visible: boolean;
  readonly draw: PropStringSummary;
}

export interface USLineInputStepSummary {
  readonly scan: number;
  readonly ascii: number;
  readonly text: string;
  readonly cursor: number;
  readonly redraw: boolean;
  readonly cursormoved: boolean;
  readonly accepted: boolean | null;
  readonly erase: PropStringSummary | null;
  readonly draw: PropStringSummary | null;
  readonly cursorOff: XORICursorSummary | null;
  readonly cursorOn: XORICursorSummary | null;
  readonly update: UpdateScreenSummary;
}

export interface USLineInputSummary {
  readonly x: number;
  readonly y: number;
  readonly initial: string;
  readonly final: string;
  readonly accepted: boolean;
  readonly result: boolean;
  readonly cursor: number;
  readonly steps: readonly USLineInputStepSummary[];
  readonly finalCursor: XORICursorSummary | null;
  readonly cancelErase: PropStringSummary | null;
  readonly finalUpdate: UpdateScreenSummary;
  readonly clear: InputManagerSummary;
  readonly buffer: string | null;
}

export interface USStartupSummary {
  readonly alreadyStarted: boolean;
  readonly started: boolean;
  readonly hardErrorInstalled: boolean;
  readonly rndInitialized: boolean;
  readonly compatability: boolean;
  readonly tedlevel: boolean;
  readonly tedlevelnum: number;
  readonly NoWait: boolean;
}

export interface USShutdownSummary {
  readonly wasStarted: boolean;
  readonly started: boolean;
}

export interface USHardErrorOptions {
  readonly response?: "retry" | "abort";
  readonly screenMode?: number;
  readonly shutdown?: () => unknown;
}

export interface USHardErrorSummary {
  readonly errval: number;
  readonly ax: number;
  readonly bp: number;
  readonly si: number;
  readonly message: string;
  readonly screenMode: number;
  readonly window: WindowRec | null;
  readonly center: WindowSummary | null;
  readonly lines: readonly PrintSummary[];
  readonly update: UpdateScreenSummary | null;
  readonly clear: InputManagerSummary | null;
  readonly restored: WindowSummary | null;
  readonly shutdown: unknown;
  readonly abortprogram: string | null;
  readonly result: 1 | 2;
}

type MeasureRoutine = (str: string | ArrayLike<number>) => MeasureStringSummary;
type DrawRoutine = (str: string | ArrayLike<number>) => PropStringSummary;

let USL_MeasureString: MeasureRoutine = VW_MeasurePropString;
let USL_DrawString: DrawRoutine = VW_DrawPropString;
let cursorStatus = false;

export function US_CenterWindow(w: number, h: number): WindowSummary {
  return US_DrawWindow(Math.trunc(((MAXX / 8) - w) / 2), Math.trunc(((MAXY / 8) - h) / 2), w, h);
}

export function US_CheckParm(parm: string, strings: readonly string[]): number {
  let start = 0;
  while (start < parm.length && !isAsciiAlpha(parm.charCodeAt(start))) {
    start++;
  }
  const normalizedParm = parm.slice(start);

  for (let i = 0; i < strings.length; i++) {
    const candidate = strings[i];
    if (!candidate) {
      break;
    }

    let offset = 0;
    while (true) {
      const cs = candidate.charCodeAt(offset) || 0;
      if (cs === 0) {
        return i;
      }
      const cp = normalizedParm.charCodeAt(offset) || 0;
      if (toAsciiLower(cs) !== toAsciiLower(cp)) {
        break;
      }
      offset++;
    }
  }

  return -1;
}

export function US_ClearWindow(): WindowSummary {
  PrintX = WindowX;
  PrintY = WindowY;
  return windowSummary(Math.trunc(WindowX / 8), Math.trunc(WindowY / 8), Math.trunc(WindowW / 8), Math.trunc(WindowH / 8));
}

export function US_CPrint(str: string | ArrayLike<number>): PrintSummary {
  const text = cString(str);
  const segments: PrintSegmentSummary[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start;
    while (end < text.length && text.charCodeAt(end) !== 10) {
      end++;
    }
    segments.push(US_CPrintLine(text.slice(start, end)));
    start = end < text.length ? end + 1 : end;
  }
  return { text, segments, printX: PrintX, printY: PrintY };
}

export function US_CPrintLine(str: string | ArrayLike<number>): PrintSegmentSummary {
  const text = cString(str);
  const measured = USL_MeasureString(text);
  if (measured.width > WindowW) {
    throw new Error("US_CPrintLine() - String exceeds width");
  }

  const x = WindowX + Math.trunc((WindowW - measured.width) / 2);
  const y = PrintY;
  VW_SetFontState({ px: x, py: y });
  const draw = USL_DrawString(text);
  PrintY += measured.height;
  return { text, width: measured.width, height: measured.height, x, y, draw };
}

export function US_DrawWindow(x: number, y: number, w: number, h: number): WindowSummary {
  WindowX = x * 8;
  WindowY = y * 8;
  WindowW = w * 8;
  WindowH = h * 8;

  PrintX = WindowX;
  PrintY = WindowY;

  US_ClearWindow();
  return windowSummary(x, y, w, h);
}

export function US_LineInput(
  x: number,
  y: number,
  buf: USLineInputBuffer | Uint8Array | string[] | null = null,
  def: string | ArrayLike<number> | null = null,
  escok = true,
  maxchars = 0,
  maxwidth = 0,
  options: USLineInputOptions = {},
): USLineInputSummary {
  let s = def ? cString(def) : "";
  let olds = "";
  let cursor = s.length;
  let redraw = true;
  let cursorvis = false;
  let cursormoved = true;
  let done = false;
  let result = false;
  const steps: USLineInputStepSummary[] = [];

  for (const event of options.events ?? []) {
    const cursorOff = cursorvis ? USL_XORICursor(x, y, s, cursor) : null;
    let sc = Math.trunc(event.scan ?? sc_None);
    let c = asciiFromLineInputEvent(event);
    let accepted: boolean | null = null;

    switch (sc) {
      case sc_LeftArrow:
        if (cursor) {
          cursor--;
        }
        c = key_None;
        cursormoved = true;
        break;
      case sc_RightArrow:
        if (s[cursor]) {
          cursor++;
        }
        c = key_None;
        cursormoved = true;
        break;
      case sc_Home:
        cursor = 0;
        c = key_None;
        cursormoved = true;
        break;
      case sc_End:
        cursor = s.length;
        c = key_None;
        cursormoved = true;
        break;

      case sc_Return:
        done = true;
        result = true;
        accepted = true;
        c = key_None;
        break;
      case sc_Escape:
        if (escok) {
          done = true;
          result = false;
          accepted = false;
        }
        c = key_None;
        break;

      case sc_BackSpace:
        if (cursor) {
          s = `${s.slice(0, cursor - 1)}${s.slice(cursor)}`;
          cursor--;
          redraw = true;
        }
        c = key_None;
        cursormoved = true;
        break;
      case sc_Delete:
        if (s[cursor]) {
          s = `${s.slice(0, cursor)}${s.slice(cursor + 1)}`;
          redraw = true;
        }
        c = key_None;
        cursormoved = true;
        break;

      case 0x4c:
      case sc_UpArrow:
      case sc_DownArrow:
      case sc_PgUp:
      case sc_PgDn:
      case sc_Insert:
        c = key_None;
        break;
    }

    if (c) {
      const len = s.length;
      const measured = USL_MeasureString(s);
      if (
        isPrintableAscii(c) &&
        len < MaxString - 1 &&
        (!maxchars || len < maxchars) &&
        (!maxwidth || measured.width < maxwidth)
      ) {
        s = `${s.slice(0, cursor)}${String.fromCharCode(c)}${s.slice(cursor)}`;
        cursor++;
        redraw = true;
      }
    }

    let erase: PropStringSummary | null = null;
    let draw: PropStringSummary | null = null;
    const stepRedraw = redraw;
    const stepCursorMoved = cursormoved;
    if (redraw) {
      VW_SetFontState({ px: Math.trunc(x), py: Math.trunc(y) });
      erase = USL_DrawString(olds);
      olds = s;

      VW_SetFontState({ px: Math.trunc(x), py: Math.trunc(y) });
      draw = USL_DrawString(s);

      redraw = false;
    }

    if (cursormoved) {
      cursorvis = false;
      cursormoved = false;
    }

    cursorvis = !done;
    const cursorOn = cursorvis ? USL_XORICursor(x, y, s, cursor) : null;
    const update = VW_UpdateScreen();
    steps.push({
      scan: sc,
      ascii: c,
      text: s,
      cursor,
      redraw: stepRedraw,
      cursormoved: stepCursorMoved,
      accepted,
      erase,
      draw,
      cursorOff,
      cursorOn,
      update,
    });

    if (done) {
      break;
    }
  }

  const finalCursor = cursorvis ? USL_XORICursor(x, y, s, cursor) : null;
  let cancelErase: PropStringSummary | null = null;
  if (!result) {
    VW_SetFontState({ px: Math.trunc(x), py: Math.trunc(y) });
    cancelErase = USL_DrawString(olds);
  }
  const finalUpdate = VW_UpdateScreen();
  const clear = IN_ClearKeysDown();
  const buffer = result ? writeLineInputBuffer(buf, s) : null;

  return {
    x: Math.trunc(x),
    y: Math.trunc(y),
    initial: def ? cString(def) : "",
    final: s,
    accepted: result,
    result,
    cursor,
    steps,
    finalCursor,
    cancelErase,
    finalUpdate,
    clear,
    buffer,
  };
}

export function US_Print(str: string | ArrayLike<number>): PrintSummary {
  const text = cString(str);
  const segments: PrintSegmentSummary[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start;
    while (end < text.length && text.charCodeAt(end) !== 10) {
      end++;
    }
    const segment = text.slice(start, end);
    const measured = USL_MeasureString(segment);
    const x = PrintX;
    const y = PrintY;
    VW_SetFontState({ px: x, py: y });
    const draw = USL_DrawString(segment);
    segments.push({ text: segment, width: measured.width, height: measured.height, x, y, draw });

    if (end < text.length) {
      start = end + 1;
      PrintX = WindowX;
      PrintY += measured.height;
    } else {
      PrintX += measured.width;
      start = end;
    }
  }

  return { text, segments, printX: PrintX, printY: PrintY };
}

export function US_PrintCentered(str: string | ArrayLike<number>): CenterPrintSummary {
  const rect = {
    ul: { x: WindowX, y: WindowY },
    lr: { x: WindowX + WindowW, y: WindowY + WindowH },
  };
  return USL_PrintInCenter(str, rect);
}

export function US_PrintSigned(n: number): PrintSummary {
  return US_Print(i32(n).toString(10));
}

export function US_PrintUnsigned(n: number): PrintSummary {
  return US_Print((Math.trunc(n) >>> 0).toString(10));
}

export function US_RestoreWindow(win: WindowRec): WindowSummary {
  WindowX = win.x;
  WindowY = win.y;
  WindowW = win.w;
  WindowH = win.h;
  PrintX = win.px;
  PrintY = win.py;
  return windowSummary(Math.trunc(WindowX / 8), Math.trunc(WindowY / 8), Math.trunc(WindowW / 8), Math.trunc(WindowH / 8));
}

export function US_SetWindowState(x: number, y: number, w: number, h: number): WindowSummary {
  WindowX = x;
  WindowY = y;
  WindowW = w;
  WindowH = h;
  return windowSummary(Math.trunc(WindowX / 8), Math.trunc(WindowY / 8), Math.trunc(WindowW / 8), Math.trunc(WindowH / 8));
}

export function US_SaveWindow(win: WindowRec = { x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 }): WindowRec {
  win.x = WindowX;
  win.y = WindowY;
  win.w = WindowW;
  win.h = WindowH;
  win.px = PrintX;
  win.py = PrintY;
  return win;
}

export function US_SetPrintRoutines(measure: MeasureRoutine, draw: DrawRoutine): void {
  USL_MeasureString = measure;
  USL_DrawString = draw;
}

export function US_Shutdown(): USShutdownSummary {
  const wasStarted = US_Started;
  if (US_Started) {
    US_Started = false;
  }
  return { wasStarted, started: US_Started };
}

export function US_Startup(argv: readonly string[] = [], timeLowByte = 0): USStartupSummary {
  if (US_Started) {
    return {
      alreadyStarted: true,
      started: US_Started,
      hardErrorInstalled: true,
      rndInitialized: false,
      compatability,
      tedlevel,
      tedlevelnum,
      NoWait,
    };
  }

  US_InitRndT(true, timeLowByte);

  for (let i = 1; i < argv.length; i++) {
    switch (US_CheckParm(argv[i], ParmStrings2)) {
      case 0:
        compatability = true;
        break;
      case 1:
        compatability = false;
        break;
    }
  }

  for (let i = 1; i < argv.length; i++) {
    switch (US_CheckParm(argv[i], ParmStrings)) {
      case 0: {
        const parsed = Number.parseInt(argv[i + 1] ?? "", 10);
        tedlevelnum = Number.isFinite(parsed) ? parsed : -1;
        if (tedlevelnum >= 0) {
          tedlevel = true;
        }
        break;
      }
      case 1:
        NoWait = true;
        break;
    }
  }

  US_Started = true;
  return {
    alreadyStarted: false,
    started: US_Started,
    hardErrorInstalled: true,
    rndInitialized: true,
    compatability,
    tedlevel,
    tedlevelnum,
    NoWait,
  };
}

export function USL_HardError(errval: number, ax: number, bp: number, si: number, options: USHardErrorOptions = {}): USHardErrorSummary {
  const message = hardErrorMessage(ax, si);
  const screenMode = options.screenMode ?? 0x13;
  let window: WindowRec | null = null;
  let center: WindowSummary | null = null;
  const lines: PrintSummary[] = [];
  let update: UpdateScreenSummary | null = null;
  let clear: InputManagerSummary | null = null;
  let restored: WindowSummary | null = null;
  let shutdown: unknown = null;
  let result: 1 | 2 = 2;

  if (screenMode >= 4 && screenMode !== 7 && options.response !== "abort") {
    window = US_SaveWindow();
    center = US_CenterWindow(30, 3);
    lines.push(US_CPrint(message));
    lines.push(US_CPrint("(R)etry or (A)bort?"));
    update = VW_UpdateScreen();
    clear = IN_ClearKeysDown();
    US_ClearWindow();
    VW_UpdateScreen();
    restored = US_RestoreWindow(window);
    result = 1;
  } else {
    abortprogram = message;
    shutdown = options.shutdown?.() ?? null;
    result = 2;
  }

  return {
    errval: Math.trunc(errval),
    ax: Math.trunc(ax),
    bp: Math.trunc(bp),
    si: Math.trunc(si),
    message,
    screenMode,
    window,
    center,
    lines,
    update,
    clear,
    restored,
    shutdown,
    abortprogram,
    result,
  };
}

export function USL_PrintInCenter(str: string | ArrayLike<number>, rect: Rect): CenterPrintSummary {
  const text = cString(str);
  const measured = USL_MeasureString(text);
  const rw = rect.lr.x - rect.ul.x;
  const rh = rect.lr.y - rect.ul.y;
  const x = rect.ul.x + Math.trunc((rw - measured.width) / 2);
  const y = rect.ul.y + Math.trunc((rh - measured.height) / 2);
  VW_SetFontState({ px: x, py: y });
  const draw = USL_DrawString(text);
  return { text, width: measured.width, height: measured.height, x, y, draw, rect };
}

export function USL_XORICursor(x: number, y: number, s: string | ArrayLike<number>, cursor: number): XORICursorSummary {
  const text = cString(s);
  const clampedCursor = Math.max(0, Math.min(Math.trunc(cursor), text.length));
  const prefix = text.slice(0, clampedCursor);
  const measured = USL_MeasureString(prefix);
  const drawX = Math.trunc(x) + measured.width - 1;
  const drawY = Math.trunc(y);
  VW_SetFontState({ px: drawX, py: drawY });
  cursorStatus = !cursorStatus;
  const draw = USL_DrawString("\x80");
  return {
    x: Math.trunc(x),
    y: Math.trunc(y),
    text,
    cursor: clampedCursor,
    width: measured.width,
    height: measured.height,
    drawX,
    drawY,
    visible: cursorStatus,
    draw,
  };
}

function hardErrorMessage(ax: number, di: number): string {
  const axValue = Math.trunc(ax);
  if (axValue < 0) {
    return "Device Error";
  }

  const drive = String.fromCharCode((axValue & 0xff) + 65);
  return (Math.trunc(di) & 0x00ff) === 0
    ? `Drive ${drive} is Write Protected`
    : `Error on Drive ${drive}`;
}

function asciiFromLineInputEvent(event: USLineInputEvent): number {
  const ascii = event.ascii;
  if (typeof ascii === "string") {
    return ascii.length ? ascii.charCodeAt(0) & 0xff : key_None;
  }
  if (typeof ascii === "number") {
    return Math.trunc(ascii) & 0xff;
  }

  switch (event.scan) {
    case sc_Return:
      return key_Return;
    case sc_Escape:
      return key_Escape;
    case sc_BackSpace:
      return key_BackSpace;
    case sc_Delete:
      return key_Delete;
    default:
      return key_None;
  }
}

function isPrintableAscii(code: number): boolean {
  return code >= 32 && code <= 126;
}

function writeLineInputBuffer(buf: USLineInputBuffer | Uint8Array | string[] | null, text: string): string | null {
  if (!buf) {
    return null;
  }

  if (buf instanceof Uint8Array) {
    const max = Math.max(0, buf.length - 1);
    const copied = text.slice(0, max);
    for (let i = 0; i < copied.length; i++) {
      buf[i] = copied.charCodeAt(i) & 0xff;
    }
    if (buf.length) {
      buf[copied.length] = 0;
    }
    return copied;
  }

  if (Array.isArray(buf)) {
    buf.length = 0;
    buf.push(text);
    return text;
  }

  buf.value = text;
  return text;
}

function windowSummary(x: number, y: number, w: number, h: number): WindowSummary {
  const frameX = (x - 1) * 8;
  const frameY = (y - 1) * 8;
  return {
    x,
    y,
    w,
    h,
    windowX: WindowX,
    windowY: WindowY,
    windowW: WindowW,
    windowH: WindowH,
    printX: PrintX,
    printY: PrintY,
    frameX,
    frameY,
    frameW: (w + 1) * 8,
    frameH: (h + 1) * 8,
  };
}

function isAsciiAlpha(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function toAsciiLower(code: number): number {
  return code >= 65 && code <= 90 ? code + 32 : code;
}

function cString(str: string | ArrayLike<number>): string {
  if (typeof str === "string") {
    const nul = str.indexOf("\x00");
    return nul === -1 ? str : str.slice(0, nul);
  }

  const chars: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str[i] & 0xff;
    if (code === 0) {
      break;
    }
    chars.push(code);
  }
  return String.fromCharCode(...chars);
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID Engine
// //	ID_US_1.c - User Manager - General routines
// //	v1.1d1
// //	By Jason Blochowiak
// //	Hacked up for Catacomb 3D
// //
// 
// //
// //	This module handles dealing with user input & feedback
// //
// //	Depends on: Input Mgr, View Mgr, some variables from the Sound, Caching,
// //		and Refresh Mgrs, Memory Mgr for background save/restore
// //
// //	Globals:
// //		ingame - Flag set by game indicating if a game is in progress
// //      abortgame - Flag set if the current game should be aborted (if a load
// //			game fails)
// //		loadedgame - Flag set if a game was loaded
// //		abortprogram - Normally nil, this points to a terminal error message
// //			if the program needs to abort
// //		restartgame - Normally set to gd_Continue, this is set to one of the
// //			difficulty levels if a new game should be started
// //		PrintX, PrintY - Where the User Mgr will print (global coords)
// //		WindowX,WindowY,WindowW,WindowH - The dimensions of the current
// //			window
// //
// 
// #include "ID_HEADS.H"
// 
// #pragma	hdrstop
// 
// #pragma	warn	-pia
// 
// 
// //	Global variables
// 		char		*abortprogram;
// 		boolean		NoWait;
// 		word		PrintX,PrintY;
// 		word		WindowX,WindowY,WindowW,WindowH;
// 
// //	Internal variables
// #define	ConfigVersion	1
// 
// static	char		*ParmStrings[] = {"TEDLEVEL","NOWAIT"},
// 					*ParmStrings2[] = {"COMP","NOCOMP"};
// static	boolean		US_Started;
// 
// 		boolean		Button0,Button1,
// 					CursorBad;
// 		int			CursorX,CursorY;
// 
// 		void		(*USL_MeasureString)(char far *,word *,word *) = VW_MeasurePropString,
// 					(*USL_DrawString)(char far *) = VWB_DrawPropString;
// 
// 		SaveGame	Games[MaxSaveGames];
// 		HighScore	Scores[MaxScores] =
// 					{
// 						{"id software-'92",10000,1},
// 						{"Adrian Carmack",10000,1},
// 						{"John Carmack",10000,1},
// 						{"Kevin Cloud",10000,1},
// 						{"Tom Hall",10000,1},
// 						{"John Romero",10000,1},
// 						{"Jay Wilbur",10000,1},
// 					};
// 
// //	Internal routines
// 
// //	Public routines
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	USL_HardError() - Handles the Abort/Retry/Fail sort of errors passed
// //			from DOS.
// //
// ///////////////////////////////////////////////////////////////////////////
// #pragma	warn	-par
// #pragma	warn	-rch
// int
// USL_HardError(word errval,int ax,int bp,int si)
// {
// #define IGNORE  0
// #define RETRY   1
// #define	ABORT   2
// extern	void	ShutdownId(void);
// 
// static	char		buf[32];
// static	WindowRec	wr;
// 		int			di;
// 		char		c,*s,*t;
// 
// 
// 	di = _DI;
// 
// 	if (ax < 0)
// 		s = "Device Error";
// 	else
// 	{
// 		if ((di & 0x00ff) == 0)
// 			s = "Drive ~ is Write Protected";
// 		else
// 			s = "Error on Drive ~";
// 		for (t = buf;*s;s++,t++)	// Can't use sprintf()
// 			if ((*t = *s) == '~')
// 				*t = (ax & 0x00ff) + 'A';
// 		*t = '\0';
// 		s = buf;
// 	}
// 
// 	c = peekb(0x40,0x49);	// Get the current screen mode
// 	if ((c < 4) || (c == 7))
// 		goto oh_kill_me;
// 
// 	// DEBUG - handle screen cleanup
// 
// 	US_SaveWindow(&wr);
// 	US_CenterWindow(30,3);
// 	US_CPrint(s);
// 	US_CPrint("(R)etry or (A)bort?");
// 	VW_UpdateScreen();
// 	IN_ClearKeysDown();
// 
// asm	sti	// Let the keyboard interrupts come through
// 
// 	while (true)
// 	{
// 		switch (IN_WaitForASCII())
// 		{
// 		case key_Escape:
// 		case 'a':
// 		case 'A':
// 			goto oh_kill_me;
// 			break;
// 		case key_Return:
// 		case key_Space:
// 		case 'r':
// 		case 'R':
// 			US_ClearWindow();
// 			VW_UpdateScreen();
// 			US_RestoreWindow(&wr);
// 			return(RETRY);
// 			break;
// 		}
// 	}
// 
// oh_kill_me:
// 	abortprogram = s;
// 	ShutdownId();
// 	fprintf(stderr,"Terminal Error: %s\n",s);
// 	if (tedlevel)
// 		fprintf(stderr,"You launched from TED. I suggest that you reboot...\n");
// 
// 	return(ABORT);
// #undef	IGNORE
// #undef	RETRY
// #undef	ABORT
// }
// #pragma	warn	+par
// #pragma	warn	+rch
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_Startup() - Starts the User Mgr
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_Startup(void)
// {
// 	int	i,n;
// 
// 	if (US_Started)
// 		return;
// 
// 	harderr(USL_HardError);	// Install the fatal error handler
// 
// 	US_InitRndT(true);		// Initialize the random number generator
// 
// 	for (i = 1;i < _argc;i++)
// 	{
// 		switch (US_CheckParm(_argv[i],ParmStrings2))
// 		{
// 		case 0:
// 			compatability = true;
// 			break;
// 		case 1:
// 			compatability = false;
// 			break;
// 		}
// 	}
// 
// 	// Check for TED launching here
// 	for (i = 1;i < _argc;i++)
// 	{
// 		n = US_CheckParm(_argv[i],ParmStrings);
// 		switch(n)
// 		{
// 		 case 0:
// 		   tedlevelnum = atoi(_argv[i + 1]);
// 		   if (tedlevelnum >= 0)
// 		     tedlevel = true;
// 		   break;
// 
// 		 case 1:
// 		   NoWait = true;
// 		   break;
// 		}
// 	}
// 
// 	US_Started = true;
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_Shutdown() - Shuts down the User Mgr
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_Shutdown(void)
// {
// 	if (!US_Started)
// 		return;
// 
// 	US_Started = false;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_CheckParm() - checks to see if a string matches one of a set of
// //		strings. The check is case insensitive. The routine returns the
// //		index of the string that matched, or -1 if no matches were found
// //
// ///////////////////////////////////////////////////////////////////////////
// int
// US_CheckParm(char *parm,char **strings)
// {
// 	char	cp,cs,
// 			*p,*s;
// 	int		i;
// 
// 	while (!isalpha(*parm))	// Skip non-alphas
// 		parm++;
// 
// 	for (i = 0;*strings && **strings;i++)
// 	{
// 		for (s = *strings++,p = parm,cs = cp = 0;cs == cp;)
// 		{
// 			cs = *s++;
// 			if (!cs)
// 				return(i);
// 			cp = *p++;
// 
// 			if (isupper(cs))
// 				cs = tolower(cs);
// 			if (isupper(cp))
// 				cp = tolower(cp);
// 		}
// 	}
// 	return(-1);
// }
// 
// 
// //	Window/Printing routines
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_SetPrintRoutines() - Sets the routines used to measure and print
// //		from within the User Mgr. Primarily provided to allow switching
// //		between masked and non-masked fonts
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_SetPrintRoutines(void (*measure)(char far *,word *,word *),void (*print)(char far *))
// {
// 	USL_MeasureString = measure;
// 	USL_DrawString = print;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_Print() - Prints a string in the current window. Newlines are
// //		supported.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_Print(char far *s)
// {
// 	char	c,far *se;
// 	word	w,h;
// 
// 	while (*s)
// 	{
// 		se = s;
// 		while ((c = *se) && (c != '\n'))
// 			se++;
// 		*se = '\0';
// 
// 		USL_MeasureString(s,&w,&h);
// 		px = PrintX;
// 		py = PrintY;
// 		USL_DrawString(s);
// 
// 		s = se;
// 		if (c)
// 		{
// 			*se = c;
// 			s++;
// 
// 			PrintX = WindowX;
// 			PrintY += h;
// 		}
// 		else
// 			PrintX += w;
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_PrintUnsigned() - Prints an unsigned long
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_PrintUnsigned(longword n)
// {
// 	char	buffer[32];
// 
// 	US_Print(ultoa(n,buffer,10));
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_PrintSigned() - Prints a signed long
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_PrintSigned(long n)
// {
// 	char	buffer[32];
// 
// 	US_Print(ltoa(n,buffer,10));
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	USL_PrintInCenter() - Prints a string in the center of the given rect
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// USL_PrintInCenter(char far *s,Rect r)
// {
// 	word	w,h,
// 			rw,rh;
// 
// 	USL_MeasureString(s,&w,&h);
// 	rw = r.lr.x - r.ul.x;
// 	rh = r.lr.y - r.ul.y;
// 
// 	px = r.ul.x + ((rw - w) / 2);
// 	py = r.ul.y + ((rh - h) / 2);
// 	USL_DrawString(s);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_PrintCentered() - Prints a string centered in the current window.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_PrintCentered(char far *s)
// {
// 	Rect	r;
// 
// 	r.ul.x = WindowX;
// 	r.ul.y = WindowY;
// 	r.lr.x = r.ul.x + WindowW;
// 	r.lr.y = r.ul.y + WindowH;
// 
// 	USL_PrintInCenter(s,r);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_CPrintLine() - Prints a string centered on the current line and
// //		advances to the next line. Newlines are not supported.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_CPrintLine(char far *s)
// {
// 	word	w,h;
// 
// 	USL_MeasureString(s,&w,&h);
// 
// 	if (w > WindowW)
// 		Quit("US_CPrintLine() - String exceeds width");
// 	px = WindowX + ((WindowW - w) / 2);
// 	py = PrintY;
// 	USL_DrawString(s);
// 	PrintY += h;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_CPrint() - Prints a string in the current window. Newlines are
// //		supported.
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_CPrint(char far *s)
// {
// 	char	c,far *se;
// 
// 	while (*s)
// 	{
// 		se = s;
// 		while ((c = *se) && (c != '\n'))
// 			se++;
// 		*se = '\0';
// 
// 		US_CPrintLine(s);
// 
// 		s = se;
// 		if (c)
// 		{
// 			*se = c;
// 			s++;
// 		}
// 	}
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_ClearWindow() - Clears the current window to white and homes the
// //		cursor
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_ClearWindow(void)
// {
// 	VWB_Bar(WindowX,WindowY,WindowW,WindowH,WHITE);
// 	PrintX = WindowX;
// 	PrintY = WindowY;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_DrawWindow() - Draws a frame and sets the current window parms
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_DrawWindow(word x,word y,word w,word h)
// {
// 	word	i,
// 			sx,sy,sw,sh;
// 
// 	WindowX = x * 8;
// 	WindowY = y * 8;
// 	WindowW = w * 8;
// 	WindowH = h * 8;
// 
// 	PrintX = WindowX;
// 	PrintY = WindowY;
// 
// 	sx = (x - 1) * 8;
// 	sy = (y - 1) * 8;
// 	sw = (w + 1) * 8;
// 	sh = (h + 1) * 8;
// 
// 	US_ClearWindow();
// 
// 	VWB_DrawTile8(sx,sy,0),VWB_DrawTile8(sx,sy + sh,5);
// 	for (i = sx + 8;i <= sx + sw - 8;i += 8)
// 		VWB_DrawTile8(i,sy,1),VWB_DrawTile8(i,sy + sh,6);
// 	VWB_DrawTile8(i,sy,2),VWB_DrawTile8(i,sy + sh,7);
// 
// 	for (i = sy + 8;i <= sy + sh - 8;i += 8)
// 		VWB_DrawTile8(sx,i,3),VWB_DrawTile8(sx + sw,i,4);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_CenterWindow() - Generates a window of a given width & height in the
// //		middle of the screen
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_CenterWindow(word w,word h)
// {
// 	US_DrawWindow(((MaxX / 8) - w) / 2,((MaxY / 8) - h) / 2,w,h);
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_SaveWindow() - Saves the current window parms into a record for
// //		later restoration
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_SaveWindow(WindowRec *win)
// {
// 	win->x = WindowX;
// 	win->y = WindowY;
// 	win->w = WindowW;
// 	win->h = WindowH;
// 
// 	win->px = PrintX;
// 	win->py = PrintY;
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_RestoreWindow() - Sets the current window parms to those held in the
// //		record
// //
// ///////////////////////////////////////////////////////////////////////////
// void
// US_RestoreWindow(WindowRec *win)
// {
// 	WindowX = win->x;
// 	WindowY = win->y;
// 	WindowW = win->w;
// 	WindowH = win->h;
// 
// 	PrintX = win->px;
// 	PrintY = win->py;
// }
// 
// //	Input routines
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	USL_XORICursor() - XORs the I-bar text cursor. Used by US_LineInput()
// //
// ///////////////////////////////////////////////////////////////////////////
// static void
// USL_XORICursor(int x,int y,char *s,word cursor)
// {
// 	static	boolean	status;		// VGA doesn't XOR...
// 	char	buf[MaxString];
// 	int		temp;
// 	word	w,h;
// 
// 	strcpy(buf,s);
// 	buf[cursor] = '\0';
// 	USL_MeasureString(buf,&w,&h);
// 
// 	px = x + w - 1;
// 	py = y;
// 	if (status^=1)
// 		USL_DrawString("\x80");
// 	else
// 	{
// 		temp = fontcolor;
// 		fontcolor = backcolor;
// 		USL_DrawString("\x80");
// 		fontcolor = temp;
// 	}
// 
// }
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	US_LineInput() - Gets a line of user input at (x,y), the string defaults
// //		to whatever is pointed at by def. Input is restricted to maxchars
// //		chars or maxwidth pixels wide. If the user hits escape (and escok is
// //		true), nothing is copied into buf, and false is returned. If the
// //		user hits return, the current string is copied into buf, and true is
// //		returned
// //
// ///////////////////////////////////////////////////////////////////////////
// boolean
// US_LineInput(int x,int y,char *buf,char *def,boolean escok,
// 				int maxchars,int maxwidth)
// {
// 	boolean		redraw,
// 				cursorvis,cursormoved,
// 				done,result;
// 	ScanCode	sc;
// 	char		c,
// 				s[MaxString],olds[MaxString];
// 	word		i,
// 				cursor,
// 				w,h,
// 				len,temp;
// 	longword	lasttime;
// 
// 	if (def)
// 		strcpy(s,def);
// 	else
// 		*s = '\0';
// 	*olds = '\0';
// 	cursor = strlen(s);
// 	cursormoved = redraw = true;
// 
// 	cursorvis = done = false;
// 	lasttime = TimeCount;
// 	LastASCII = key_None;
// 	LastScan = sc_None;
// 
// 	while (!done)
// 	{
// 		if (cursorvis)
// 			USL_XORICursor(x,y,s,cursor);
// 
// 	asm	pushf
// 	asm	cli
// 
// 		sc = LastScan;
// 		LastScan = sc_None;
// 		c = LastASCII;
// 		LastASCII = key_None;
// 
// 	asm	popf
// 
// 		switch (sc)
// 		{
// 		case sc_LeftArrow:
// 			if (cursor)
// 				cursor--;
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 		case sc_RightArrow:
// 			if (s[cursor])
// 				cursor++;
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 		case sc_Home:
// 			cursor = 0;
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 		case sc_End:
// 			cursor = strlen(s);
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 
// 		case sc_Return:
// 			strcpy(buf,s);
// 			done = true;
// 			result = true;
// 			c = key_None;
// 			break;
// 		case sc_Escape:
// 			if (escok)
// 			{
// 				done = true;
// 				result = false;
// 			}
// 			c = key_None;
// 			break;
// 
// 		case sc_BackSpace:
// 			if (cursor)
// 			{
// 				strcpy(s + cursor - 1,s + cursor);
// 				cursor--;
// 				redraw = true;
// 			}
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 		case sc_Delete:
// 			if (s[cursor])
// 			{
// 				strcpy(s + cursor,s + cursor + 1);
// 				redraw = true;
// 			}
// 			c = key_None;
// 			cursormoved = true;
// 			break;
// 
// 		case 0x4c:	// Keypad 5
// 		case sc_UpArrow:
// 		case sc_DownArrow:
// 		case sc_PgUp:
// 		case sc_PgDn:
// 		case sc_Insert:
// 			c = key_None;
// 			break;
// 		}
// 
// 		if (c)
// 		{
// 			len = strlen(s);
// 			USL_MeasureString(s,&w,&h);
// 
// 			if
// 			(
// 				isprint(c)
// 			&&	(len < MaxString - 1)
// 			&&	((!maxchars) || (len < maxchars))
// 			&&	((!maxwidth) || (w < maxwidth))
// 			)
// 			{
// 				for (i = len + 1;i > cursor;i--)
// 					s[i] = s[i - 1];
// 				s[cursor++] = c;
// 				redraw = true;
// 			}
// 		}
// 
// 		if (redraw)
// 		{
// 			px = x;
// 			py = y;
// 			temp = fontcolor;
// 			fontcolor = backcolor;
// 			USL_DrawString(olds);
// 			fontcolor = temp;
// 			strcpy(olds,s);
// 
// 			px = x;
// 			py = y;
// 			USL_DrawString(s);
// 
// 			redraw = false;
// 		}
// 
// 		if (cursormoved)
// 		{
// 			cursorvis = false;
// 			lasttime = TimeCount - TickBase;
// 
// 			cursormoved = false;
// 		}
// 		if (TimeCount - lasttime > TickBase / 2)
// 		{
// 			lasttime = TimeCount;
// 
// 			cursorvis ^= true;
// 		}
// 		if (cursorvis)
// 			USL_XORICursor(x,y,s,cursor);
// 
// 		VW_UpdateScreen();
// 	}
// 
// 	if (cursorvis)
// 		USL_XORICursor(x,y,s,cursor);
// 	if (!result)
// 	{
// 		px = x;
// 		py = y;
// 		USL_DrawString(olds);
// 	}
// 	VW_UpdateScreen();
// 
// 	IN_ClearKeysDown();
// 	return(result);
// }
// 
