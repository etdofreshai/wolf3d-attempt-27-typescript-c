import {
  CA_CacheAudioChunk,
  CA_CacheGrChunk,
  CA_GetVirtualFile,
  CA_LoadAllSounds,
  CA_SetVirtualFile,
  UNCACHEGRCHUNK,
  audiosegs,
  audiopurge,
  grsegs,
  type CacheManagerSummary,
  type VirtualFileHandleState,
} from "./ID_CA.C";
import {
  CURGAME,
  ENDGAMESTR,
  GAMESVD,
  STR_ALSB,
  STR_BD,
  STR_BRINGEM,
  STR_CALIB,
  STR_BKWD,
  STR_CFIRE,
  STR_CL,
  STR_COPEN,
  STR_CRUN,
  STR_CSTRAFE,
  STR_CUSTOM,
  STR_CV,
  STR_DADDY,
  STR_DEATH,
  STR_DEMO,
  STR_DISNEY,
  STR_EG,
  STR_ESCEXIT,
  STR_FAST,
  STR_FRWD,
  STR_GAME,
  STR_GAMEPAD,
  STR_HURTME,
  STR_JOYEN,
  STR_JOYST,
  STR_LEFT,
  STR_LGC,
  STR_LG,
  STR_MOUSEADJ,
  STR_MOUSEEN,
  STR_MOVEJOY,
  STR_MOVEJOY2,
  STR_NG,
  STR_NONE,
  STR_PC,
  STR_PORT2,
  STR_QT,
  STR_RIGHT,
  STR_SB,
  STR_SD,
  STR_SENS,
  STR_SG,
  STR_SIZE1,
  STR_SIZE2,
  STR_SIZE3,
  STR_SLOW,
  STR_THINK,
  STR_VS,
} from "./FOREIGN.H";
import {
  LoadLatchMem,
  VWB_Bar,
  VWB_DrawPic,
  VWB_Hlin,
  VWB_Vlin,
  type BufferedDrawSummary,
  type BufferedPicDrawSummary,
  type DrawPicOptions,
  type FontStateSummary,
  type LoadLatchMemOptions,
  type LoadLatchMemSummary,
  type MeasureStringSummary,
  type UpdateScreenSummary,
  VW_MeasurePropString,
  VW_UpdateScreen,
  VW_SetFontState,
} from "./ID_VH.C";
import {
  VL_FadeIn,
  VL_FadeOut,
  VL_SetPalette,
  VL_SetTextMode,
  VL_SetVGAPlaneMode,
  VL_TestPaletteSet,
  VL_WaitVBL,
  type FadeSummary,
  type PaletteSummary,
  type PlanarFillSummary,
  type VideoModeSummary,
} from "./ID_VL.C";
import { US_RndT } from "./ID_US_A.ASM";
import {
  IN_ClearKeysDown,
  IN_GetJoyAbs,
  IN_KeyDown,
  IN_JoyButtons,
  IN_MouseButtons,
  IN_ReadControl,
  IN_SetupJoy,
  IN_SetPaused,
  INL_GetJoyDelta,
  JoysPresent,
  Keyboard,
  LastASCII,
  LastScan,
  MousePresent,
  Paused,
  IN_Ack,
  type AxisDelta,
  type AxisAbs,
  type InputManagerSummary,
} from "./ID_IN.C";
import {
  dir_East,
  dir_None,
  dir_North,
  dir_South,
  dir_West,
  sc_Alt,
  sc_Control,
  motion_None,
  sc_Enter,
  sc_Escape,
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
  sc_N,
  sc_P,
  sc_Space,
  sc_Tab,
  sc_Y,
  type ControlInfo,
  type JoystickDef,
} from "./ID_IN.H";
import {
  AdLibPresent,
  DigiMode,
  MusicMode,
  SD_MusicOff,
  SD_MusicOn,
  SD_PlaySound,
  SD_SetDigiDevice,
  SD_SetMusicMode,
  SD_SetSoundMode,
  SD_SetTimeCount,
  SD_StartMusic,
  SD_StopSound,
  SDL_t0Service,
  SD_WaitSoundDone,
  SoundBlasterPresent,
  SoundMode,
  SoundSourcePresent,
  STARTMUSIC,
  TimeCount,
  alOut,
  type AlRegisterWrite,
  type SoundModeSummary,
} from "./ID_SD.C";
import { sdm_AdLib, sdm_Off, sdm_PC, sds_Off, sds_SoundBlaster, sds_SoundSource, smm_AdLib, smm_Off } from "./ID_SD.H";
import {
  C_BABYMODEPIC,
  C_CONTROLPIC,
  C_CUSTOMIZEPIC,
  C_CURSOR1PIC,
  C_CURSOR2PIC,
  C_DIGITITLEPIC,
  C_DISKLOADING1PIC,
  C_EPISODE1PIC,
  C_FXTITLEPIC,
  C_JOY1PIC,
  C_JOY2PIC,
  C_LOADGAMEPIC,
  C_MUSICTITLEPIC,
  C_MOUSELBACKPIC,
  C_NOTSELECTEDPIC,
  C_OPTIONSPIC,
  C_SELECTEDPIC,
  C_SAVEGAMEPIC,
  CONTROLS_LUMP_END,
  CONTROLS_LUMP_START,
  ESCPRESSEDSND,
  HITWALLSND,
  MOVEGUN1SND,
  MOVEGUN2SND,
  SHOOTDOORSND,
  SHOOTSND,
  STARTFONT,
} from "./TS_WL6_ASSETS";
import { DrawAllPlayBorder, ingame, type AllPlayBorderSummary, type PlayBorderSummary } from "./WL_GAME.C";
import {
  MS_CheckParm,
  LoadTheGame,
  NewGame as Main_NewGame,
  NewViewSize,
  SaveTheGame,
  SetMouseAdjustment,
  SetViewSize,
  ShowViewSize,
  mouseadjustment,
  viewwidth,
  type MainLoadGameResult,
  type MainNewGameSummary,
  type MainSaveGameResult,
  type ShowViewSizeSummary,
  type ViewSizeSummary,
} from "./WL_MAIN.C";
import { bt_nobutton, buttonjoy, buttonmouse, buttonscan, dirscan } from "./WL_PLAY.C";
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
import type { DOSMemory } from "./TS_DOS_MEMORY";
import { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol, type SaveGameMemory } from "./TS_SAVE_LAYOUT";
import { US_CPrint, US_Print, US_RestoreWindow, US_SaveWindow, type PrintSummary, type WindowRec, type WindowSummary } from "./ID_US_1.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_MENU.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_MENU.C";
export const WOLFSRC_FUNCTIONS = [
  "BossKey",
  "CacheLump",
  "CalibrateJoystick",
  "CheckForEpisodes",
  "CheckPause",
  "CleanupControlPanel",
  "ClearMScreen",
  "Confirm",
  "CP_ChangeView",
  "CP_CheckQuick",
  "CP_Control",
  "CP_EndGame",
  "CP_LoadGame",
  "CP_NewGame",
  "CP_Quit",
  "CP_ReadThis",
  "CP_SaveGame",
  "CP_Sound",
  "CP_ViewScores",
  "CustomControls",
  "DefineJoyBtns",
  "DefineKeyBtns",
  "DefineKeyMove",
  "DefineMouseBtns",
  "DrawChangeView",
  "DrawCtlScreen",
  "DrawCustJoy",
  "DrawCustKeybd",
  "DrawCustKeys",
  "DrawCustMouse",
  "DrawCustomScreen",
  "DrawGun",
  "DrawHalfStep",
  "DrawLoadSaveScreen",
  "DrawLSAction",
  "DrawMainMenu",
  "DrawMenu",
  "DrawMenuGun",
  "DrawMouseSens",
  "DrawNewEpisode",
  "DrawNewGame",
  "DrawNewGameDiff",
  "DrawOutline",
  "DrawSoundMenu",
  "DrawStripes",
  "DrawWindow",
  "EnterCtrlData",
  "EraseGun",
  "FixupCustom",
  "FreeMusic",
  "GetYorN",
  "HandleMenu",
  "IN_GetScanName",
  "IntroScreen",
  "Message",
  "MouseSensitivity",
  "PrintCustJoy",
  "PrintCustKeybd",
  "PrintCustKeys",
  "PrintCustMouse",
  "PrintLSEntry",
  "ReadAnyControl",
  "SetTextColor",
  "SetupControlPanel",
  "ShootSnd",
  "StartCPMusic",
  "TicDelay",
  "TrackWhichGame",
  "UnCacheLump",
  "US_ControlPanel",
  "WaitKeyUp"
] as const;

const BORDCOLOR = 0x29;
const BORD2COLOR = 0x23;
const DEACTIVE = 0x2b;
const BKGDCOLOR = 0x2d;
const STRIPE = 0x2c;
const READCOLOR = 0x4a;
const READHCOLOR = 0x47;
const TEXTCOLOR = 0x17;
const HIGHLIGHT = 0x13;
const CORNER_MUS = 0;
const INTROSONG = 7;
const MENUSONG = 14;
const ROSTER_MUS = 23;
const SENSITIVE = 60;
const CENTER = SENSITIVE * 2;
const VIEWCOLOR = 0x7f;
const MENU_X = 76;
const MENU_Y = 55;
const MENU_W = 178;
const MENU_H = 13 * 10 + 6;
const SM_X = 48;
const SM_W = 250;
const SM_Y1 = 20;
const SM_H1 = 4 * 13 - 7;
const SM_Y2 = SM_Y1 + 5 * 13;
const SM_H2 = 4 * 13 - 7;
const SM_Y3 = SM_Y2 + 5 * 13;
const SM_H3 = 3 * 13 - 7;
const NM_X = 50;
const NM_Y = 100;
const NM_W = 225;
const NM_H = 13 * 4 + 15;
const NE_X = 10;
const NE_Y = 23;
const NE_W = 320 - NE_X * 2;
const NE_H = 200 - NE_Y * 2;
const LSM_X = 85;
const LSM_Y = 55;
const LSM_W = 175;
const LSM_H = 10 * 13 + 10;
const LSA_X = 96;
const LSA_Y = 80;
const LSA_W = 130;
const LSA_H = 42;
const CTL_X = 24;
const CTL_Y = 70;
const CTL_W = 284;
const CTL_H = 13 * 7 - 7;
const CALX = 85;
const CALY = 40;
const CALW = 158;
const CALH = 140;
const CST_Y = 48;
const CST_START = 60;
const CST_SPC = 60;
const FIRE = 0;
const STRAFE = 1;
const RUN = 2;
const OPEN = 3;
const FWRD = 0;
const RIGHT = 1;
const BKWD = 2;
const LEFT = 3;
const newgame = 0;
const sound = 1;
const control = 2;
const loadgame = 3;
const readthis = 6;
const savegame = 4;
const changeview = 5;
const viewscores = 7;
const backtodemo = 8;
const quit = 9;
const ex_died = 2;
const mbarray = ["b0", "b1", "b2", "b3"] as const;
const order = [RUN, OPEN, FIRE, STRAFE] as const;
const moveorder = [LEFT, RIGHT, FWRD, BKWD] as const;
export const MOUSE = 0;
export const JOYSTICK = 1;
export const KEYBOARDBTNS = 2;
export const KEYBOARDMOVE = 3;

export const color_hlite = [DEACTIVE, HIGHLIGHT, READHCOLOR, 0x67] as const;
export const color_norml = [DEACTIVE, TEXTCOLOR, READCOLOR, 0x6b] as const;

export const ScanNames = [
  "?", "?", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "+", "?", "?",
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "|", "?", "A", "S",
  "D", "F", "G", "H", "J", "K", "L", ";", "\"", "?", "?", "?", "Z", "X", "C", "V",
  "B", "N", "M", ",", ".", "/", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
  "?", "?", "?", "?", "?", "?", "?", "?", "\x0f", "?", "-", "\x15", "5", "\x11", "+", "?",
  "\x13", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
  "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
  "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
] as const;

export const ExtScanCodes = [
  1, 0xe, 0xf, 0x1d, 0x2a, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e,
  0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x57, 0x59, 0x46, 0x1c, 0x36,
  0x37, 0x38, 0x47, 0x49, 0x4f, 0x51, 0x52, 0x53, 0x45, 0x48,
  0x50, 0x4b, 0x4d, 0x00,
] as const;

export const ExtScanNames = [
  "Esc", "BkSp", "Tab", "Ctrl", "LShft", "Space", "CapsLk", "F1", "F2", "F3", "F4",
  "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "ScrlLk", "Enter", "RShft",
  "PrtSc", "Alt", "Home", "PgUp", "End", "PgDn", "Ins", "Del", "NumLk", "Up",
  "Down", "Left", "Right", "",
] as const;

export const endStrings = [
  "Dost thou wish to\nleave with such hasty\nabandon?",
  "Chickening out...\nalready?",
  "Press N for more carnage.\nPress Y to be a weenie.",
  "So, you think you can\nquit this easily, huh?",
  "Press N to save the world.\nPress Y to abandon it in\nits hour of need.",
  "Press N if you are brave.\nPress Y to cower in shame.",
  "Heroes, press N.\nWimps, press Y.",
  "You are at an intersection.\nA sign says, 'Press Y to quit.'\n>",
  "For guns and glory, press N.\nFor work and worry, press Y.",
] as const;

export let SoundStatus = 1;
export let mouseenabled = false;
export let joystickenabled = false;
export let joypadenabled = false;
export let joystickprogressive = false;
export let joystickport = 0;
export let StartGame = 0;
export let pickquick = 0;
export const SaveGamesAvail: number[] = new Array(10).fill(0);
export const SaveGameNames: string[] = new Array(10).fill("");
export let SaveName = "SAVEGAM?.";

export const LSItems: CP_iteminfo = { x: LSM_X, y: LSM_Y, amount: 10, curpos: 0, indent: 24 };
export const MainItems: CP_iteminfo = { x: MENU_X, y: MENU_Y, amount: 10, curpos: 0, indent: 24 };
export const SndItems: CP_iteminfo = { x: SM_X, y: SM_Y1, amount: 12, curpos: 0, indent: 52 };
export const LSMenu: CP_itemtype[] = Array.from({ length: 10 }, () => ({ active: 1, string: "" }));
export const MainMenu: CP_itemtype[] = [
  { active: 1, string: STR_NG },
  { active: 1, string: STR_SD },
  { active: 1, string: STR_CL },
  { active: 1, string: STR_LG },
  { active: 0, string: STR_SG },
  { active: 1, string: STR_CV },
  { active: 2, string: "Read This!" },
  { active: 1, string: STR_VS },
  { active: 1, string: STR_BD },
  { active: 1, string: STR_QT },
];
export const SndMenu: CP_itemtype[] = [
  { active: 1, string: STR_NONE },
  { active: 1, string: STR_PC },
  { active: 1, string: STR_ALSB },
  { active: 0, string: "" },
  { active: 0, string: "" },
  { active: 1, string: STR_NONE },
  { active: 1, string: STR_DISNEY },
  { active: 1, string: STR_SB },
  { active: 0, string: "" },
  { active: 0, string: "" },
  { active: 1, string: STR_NONE },
  { active: 1, string: STR_ALSB },
];
export const NewItems: CP_iteminfo = { x: NM_X, y: NM_Y, amount: 4, curpos: 2, indent: 24 };
export const NewMenu: CP_itemtype[] = [
  { active: 1, string: STR_DADDY },
  { active: 1, string: STR_HURTME },
  { active: 1, string: STR_BRINGEM },
  { active: 1, string: STR_DEATH },
];
export const NewEitems: CP_iteminfo = { x: NE_X, y: NE_Y, amount: 11, curpos: 0, indent: 88 };
export const NewEmenu: CP_itemtype[] = [
  { active: 1, string: "Episode 1\nEscape from Wolfenstein" },
  { active: 0, string: "" },
  { active: 3, string: "Episode 2\nOperation: Eisenfaust" },
  { active: 0, string: "" },
  { active: 3, string: "Episode 3\nDie, Fuhrer, Die!" },
  { active: 0, string: "" },
  { active: 3, string: "Episode 4\nA Dark Secret" },
  { active: 0, string: "" },
  { active: 3, string: "Episode 5\nTrail of the Madman" },
  { active: 0, string: "" },
  { active: 3, string: "Episode 6\nConfrontation" },
];
export const EpisodeSelect: number[] = [1, 0, 0, 0, 0, 0];
export const CtlItems: CP_iteminfo = { x: CTL_X, y: CTL_Y, amount: 6, curpos: -1, indent: 56 };
export const CusItems: CP_iteminfo = { x: 8, y: CST_Y + 13 * 2, amount: 9, curpos: -1, indent: 0 };
export const CtlMenu: CP_itemtype[] = [
  { active: 0, string: STR_MOUSEEN },
  { active: 0, string: STR_JOYEN },
  { active: 0, string: STR_PORT2 },
  { active: 0, string: STR_GAMEPAD },
  { active: 0, string: STR_SENS },
  { active: 1, string: STR_CUSTOM },
];
export const CusMenu: CP_itemtype[] = [
  { active: 1, string: "" },
  { active: 0, string: "" },
  { active: 0, string: "" },
  { active: 1, string: "" },
  { active: 0, string: "" },
  { active: 0, string: "" },
  { active: 1, string: "" },
  { active: 0, string: "" },
  { active: 1, string: "" },
];
let lastgameon = 0;
let lastmusic = 0;
let lastcustomwhich = -1;
let handleMenuRedrawItem = 1;
let handleMenuLastItem = -1;

export interface MenuPicOptions {
  readonly chunks?: readonly (Uint8Array | null | undefined)[];
  readonly pictable?: Uint8Array;
  readonly maxTimerServices?: number;
  readonly inGame?: boolean;
}

export interface CP_iteminfo {
  x: number;
  y: number;
  amount: number;
  curpos: number;
  indent: number;
}

export interface CP_itemtype {
  active: number;
  string: string;
  routine?: ((temp1: number) => void) | null;
}

export interface IntRef {
  value: number;
}

export interface MenuClearSummary {
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
}

export interface MenuOutlineSummary {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color1: number;
  readonly color2: number;
  readonly top: BufferedDrawSummary<PlanarFillSummary>;
  readonly left: BufferedDrawSummary<PlanarFillSummary>;
  readonly bottom: BufferedDrawSummary<PlanarFillSummary>;
  readonly right: BufferedDrawSummary<PlanarFillSummary>;
}

export interface MenuWindowSummary {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly wcolor: number;
  readonly fill: BufferedDrawSummary<PlanarFillSummary>;
  readonly outline: MenuOutlineSummary;
}

export interface StripeSummary {
  readonly y: number;
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
  readonly stripe: BufferedDrawSummary<PlanarFillSummary>;
}

export interface LumpCacheSummary {
  readonly start: number;
  readonly end: number;
  readonly chunks: readonly number[];
  readonly cached: number;
  readonly skipped: number;
}

export interface DrawHalfStepSummary {
  readonly x: number;
  readonly y: number;
  readonly draw: BufferedPicDrawSummary;
  readonly update: UpdateScreenSummary;
  readonly soundPlayed: boolean;
  readonly waitedTics: number;
  readonly timerServices: number;
}

export interface TextColorSummary {
  readonly active: number;
  readonly hlight: boolean;
  readonly fontcolor: number;
  readonly backcolor: number;
  readonly state: FontStateSummary;
}

export interface DrawMenuItemSummary {
  readonly index: number;
  readonly active: number;
  readonly highlighted: boolean;
  readonly textColor: TextColorSummary;
  readonly disabledColor: FontStateSummary | null;
  readonly print: PrintSummary;
  readonly newline: PrintSummary;
  readonly restoreColor: FontStateSummary | null;
}

export interface DrawMenuSummary {
  readonly iteminfo: CP_iteminfo;
  readonly window: WindowSummary;
  readonly rows: readonly DrawMenuItemSummary[];
  readonly finalFont: FontStateSummary;
  readonly finalWindow: WindowRec;
}

export interface EraseGunSummary {
  readonly x: number;
  readonly y: number;
  readonly which: number;
  readonly erase: BufferedDrawSummary<PlanarFillSummary>;
  readonly textColor: TextColorSummary;
  readonly print: PrintSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export interface DrawGunSummary {
  readonly x: number;
  readonly oldY: number;
  readonly newY: number;
  readonly which: number;
  readonly erase: BufferedDrawSummary<PlanarFillSummary>;
  readonly draw: BufferedPicDrawSummary;
  readonly textColor: TextColorSummary;
  readonly print: PrintSummary;
  readonly routineCalled: boolean;
  readonly update: UpdateScreenSummary;
  readonly soundPlayed: boolean;
  readonly finalWindow: WindowRec;
}

export interface DrawMenuGunSummary {
  readonly x: number;
  readonly y: number;
  readonly draw: BufferedPicDrawSummary;
}

export interface CheckPauseSummary {
  readonly wasPaused: boolean;
  readonly soundStatusBefore: number;
  readonly soundStatusAfter: number;
  readonly music: SoundModeSummary | null;
  readonly verticalBlankWaits: number | null;
  readonly input: InputManagerSummary | null;
  readonly pausedAfter: boolean;
}

export interface MenuControlOptions {
  readonly mouseenabled?: boolean;
  readonly joystickenabled?: boolean;
  readonly joypadenabled?: boolean;
  readonly joystickport?: number;
  readonly mouseX?: number;
  readonly mouseY?: number;
  readonly mouseButtons?: number;
  readonly joyDelta?: AxisDelta;
  readonly joyButtons?: number;
}

export interface ReadAnyControlSummary {
  readonly control: ControlInfo;
  readonly mouseactive: boolean;
  readonly source: "base" | "mouse" | "joystick";
}

export interface TicDelaySummary {
  readonly count: number;
  readonly polls: number;
  readonly timerServices: number;
  readonly finalTimeCount: number;
  readonly lastControl: ControlInfo;
}

export interface WaitKeyUpOptions extends MenuControlOptions {
  readonly maxPolls?: number;
  readonly pollHook?: (poll: number, control: ControlInfo) => void;
}

export interface WaitKeyUpSummary {
  readonly polls: number;
  readonly finalControl: ControlInfo;
  readonly spaceDown: boolean;
  readonly enterDown: boolean;
  readonly escapeDown: boolean;
}

export interface HandleMenuPollState {
  readonly phase: "loop" | "post-move";
  readonly poll: number;
  readonly which: number;
  readonly exit: number;
}

export interface HandleMenuOptions extends MenuPicOptions, MenuControlOptions {
  readonly maxPolls?: number;
  readonly maxDelayPolls?: number;
  readonly pollHook?: (state: HandleMenuPollState) => void;
}

export interface IntroScreenOptions {
  readonly nearheap?: number;
  readonly farheap?: number;
  readonly EMSPresent?: boolean;
  readonly EMSPagesAvail?: number;
  readonly XMSPresent?: boolean;
  readonly XMSPagesAvail?: number;
  readonly mousePresent?: boolean;
  readonly joy0Present?: boolean;
  readonly joy1Present?: boolean;
  readonly adLibPresent?: boolean;
  readonly soundBlasterPresent?: boolean;
  readonly soundSourcePresent?: boolean;
}

export interface IntroScreenBarSummary {
  readonly kind: "main" | "ems" | "xms" | "device";
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color: number;
  readonly draw: BufferedDrawSummary<PlanarFillSummary>;
}

export interface IntroScreenSummary {
  readonly memoryKb: number;
  readonly emsKb: number | null;
  readonly xmsKb: number | null;
  readonly mainBars: readonly IntroScreenBarSummary[];
  readonly emsBars: readonly IntroScreenBarSummary[];
  readonly xmsBars: readonly IntroScreenBarSummary[];
  readonly deviceBars: readonly IntroScreenBarSummary[];
}

export interface USControlPanelOptions {
  readonly skipMusic?: boolean;
  readonly skipFade?: boolean;
  readonly palette?: Uint8Array;
  readonly musicOptions?: CPMusicOptions;
  readonly setupOptions?: SetupControlPanelOptions;
  readonly drawOptions?: MenuPicOptions;
  readonly handleOptions?: HandleMenuOptions;
  readonly quickOptions?: CPCheckQuickOptions;
  readonly mainSelections?: readonly number[];
  readonly cleanup?: boolean;
  readonly readThisOptions?: CPReadThisOptions;
  readonly saveOptions?: CPSaveGameOptions;
  readonly loadOptions?: CPLoadGameOptions;
  readonly soundOptions?: CPSoundOptions;
  readonly changeViewOptions?: CPChangeViewOptions;
  readonly controlOptions?: CPControlOptions;
  readonly newGameOptions?: CPNewGameOptions;
  readonly quitOptions?: CPQuitOptions;
  readonly endGameOptions?: CPEndGameOptions;
  readonly viewScoresOptions?: CPViewScoresOptions;
}

export interface USControlPanelActionSummary {
  readonly selection: number;
  readonly name: string;
  readonly result: unknown;
  readonly redraw: DrawMainMenuSummary | null;
  readonly fadeIn: FadeSummary | null;
}

export interface USControlPanelSummary {
  readonly scancode: number;
  readonly quick: CPCheckQuickSummary | null;
  readonly music: StartCPMusicSummary | null;
  readonly setup: SetupControlPanelSummary | null;
  readonly fkey: USControlPanelActionSummary | null;
  readonly mainDraw: DrawMainMenuSummary | null;
  readonly mainFadeIn: FadeSummary | null;
  readonly actions: readonly USControlPanelActionSummary[];
  readonly cleanup: CleanupControlPanelSummary | null;
  readonly startGame: number;
  readonly viewScoresString: string;
  readonly viewScoresRoutine: string | null;
}

export interface MessageMeasureSummary {
  readonly width: number;
  readonly height: number;
  readonly maxWidth: number;
  readonly chars: readonly MeasureStringSummary[];
}

export interface MessageOptions {
  readonly font?: Uint8Array;
}

export interface MessageSummary {
  readonly text: string;
  readonly fontChunk: number;
  readonly fontCached: boolean;
  readonly measure: MessageMeasureSummary;
  readonly x: number;
  readonly y: number;
  readonly fontState: FontStateSummary;
  readonly positionedWindow: WindowSummary;
  readonly window: MenuWindowSummary;
  readonly outline: MenuOutlineSummary;
  readonly color: FontStateSummary;
  readonly print: PrintSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export interface ConfirmPollState {
  readonly phase: "wait" | "release";
  readonly poll: number;
  readonly xit: number;
}

export interface ConfirmOptions extends MessageOptions {
  readonly maxPolls?: number;
  readonly maxReleasePolls?: number;
  readonly maxTimerServices?: number;
  readonly pollHook?: (state: ConfirmPollState) => void;
}

export interface ConfirmBlinkSummary {
  readonly tick: number;
  readonly erase: BufferedDrawSummary<PlanarFillSummary> | null;
  readonly print: PrintSummary | null;
  readonly update: UpdateScreenSummary;
}

export interface ConfirmSummary {
  readonly accepted: boolean;
  readonly xit: number;
  readonly message: MessageSummary;
  readonly x: number;
  readonly y: number;
  readonly waitPolls: number;
  readonly releasePolls: number;
  readonly blinks: readonly ConfirmBlinkSummary[];
  readonly initialClear: InputManagerSummary;
  readonly finalClear: InputManagerSummary;
  readonly shootDuringAccept: boolean | null;
  readonly finalSound: boolean;
}

export interface CPChangeViewPollState {
  readonly phase: "loop" | "post-step";
  readonly poll: number;
  readonly oldview: number;
  readonly newview: number;
  readonly exit: number;
}

export interface CPChangeViewOptions extends MessageOptions, MenuControlOptions {
  readonly maxPolls?: number;
  readonly maxDelayPolls?: number;
  readonly pollHook?: (state: CPChangeViewPollState) => void;
}

export interface CPChangeViewStepSummary {
  readonly direction: "decrease" | "increase";
  readonly newview: number;
  readonly pause: CheckPauseSummary;
  readonly preview: ShowViewSizeSummary;
  readonly update: UpdateScreenSummary;
  readonly soundPlayed: boolean;
  readonly delay: TicDelaySummary;
}

export interface CPChangeViewSummary {
  readonly oldview: number;
  readonly initialWindow: WindowSummary;
  readonly initial: DrawChangeViewSummary;
  readonly polls: number;
  readonly steps: readonly CPChangeViewStepSummary[];
  readonly exit: number;
  readonly cancelled: boolean;
  readonly restoredViewSize: ViewSizeSummary | null;
  readonly changed: boolean;
  readonly changeSound: boolean | null;
  readonly thinkMessage: MessageSummary | null;
  readonly resize: ViewSizeSummary | null;
  readonly shootSound: boolean | null;
  readonly debugPauseRequested: boolean;
  readonly fade: null;
}

export interface CPControlStateSummary {
  readonly mouseenabled: boolean;
  readonly joystickenabled: boolean;
  readonly joystickport: number;
  readonly joypadenabled: boolean;
  readonly cusCurpos: number;
}

export interface CPControlOptions extends MenuPicOptions, WaitKeyUpOptions {
  readonly selections?: readonly number[];
  readonly calibrateOptions?: CalibrateJoystickOptions;
}

export interface CPControlActionSummary {
  readonly which: number;
  readonly before: CPControlStateSummary;
  readonly after: CPControlStateSummary;
  readonly mouseCenter: readonly [number, number] | null;
  readonly calibration: CalibrateJoystickSummary | null;
  readonly redraw: DrawCtlScreenSummary;
  readonly wait: WaitKeyUpSummary | null;
  readonly sound: boolean | null;
}

export interface CPControlSummary {
  readonly initial: DrawCtlScreenSummary;
  readonly initialWait: WaitKeyUpSummary;
  readonly actions: readonly CPControlActionSummary[];
  readonly exitSelection: number;
  readonly finalState: CPControlStateSummary;
  readonly fade: null;
}

export interface CPEndGameOptions extends ConfirmOptions {
  readonly dgroup?: DOSMemory;
}

export interface CPEndGameMemorySummary {
  readonly gamestateOffset: number;
  readonly livesOffset: number;
  readonly playstateOffset: number;
  readonly lives: number;
  readonly playstate: number;
}

export interface CPEndGameSummary {
  readonly confirm: ConfirmSummary;
  readonly ended: boolean;
  readonly result: 0 | 1;
  readonly memory: CPEndGameMemorySummary | null;
  readonly pickquick: number;
  readonly mainSaveActive: number;
  readonly viewScoresString: string;
  readonly viewScoresRoutine: string | null;
}

export interface CPSaveLoadMemoryOptions {
  readonly dgroup?: DOSMemory;
  readonly memory?: SaveGameMemory;
  readonly segments?: SaveGameMemory["segments"];
}

export interface CPSaveGameOptions extends MenuPicOptions, ConfirmOptions, StatusDrawOptions, CPSaveLoadMemoryOptions {
  readonly quick?: boolean;
  readonly slot?: number;
  readonly selection?: number;
  readonly inputName?: string | null;
  readonly confirmOverwrite?: boolean;
  readonly skipDraw?: boolean;
  readonly skipFade?: boolean;
  readonly skipWaitKeyUp?: boolean;
}

export interface CPLoadGameOptions extends MenuPicOptions, StatusDrawOptions, CPSaveLoadMemoryOptions {
  readonly quick?: boolean;
  readonly slot?: number;
  readonly selection?: number;
  readonly skipDraw?: boolean;
  readonly skipFade?: boolean;
  readonly skipStatusRedraw?: boolean;
  readonly maxPolls?: number;
  readonly skipWaitKeyUp?: boolean;
}

export interface MenuSaveFileSummary {
  readonly slot: number;
  readonly filename: string;
  readonly headerName: string;
  readonly headerBytes: number;
  readonly imageBytes: number;
  readonly totalBytes: number;
  readonly checksum: number;
  readonly virtualFile: VirtualFileHandleState;
}

export interface MenuLoadFileSummary {
  readonly slot: number;
  readonly filename: string;
  readonly headerName: string;
  readonly fileBytes: number;
  readonly imageBytes: number;
}

export interface LoadGameStatusRedrawSummary {
  readonly face: DrawFaceSummary;
  readonly health: LatchNumberSummary;
  readonly lives: LatchNumberSummary;
  readonly level: LatchNumberSummary;
  readonly ammo: LatchNumberSummary;
  readonly keys: readonly [StatusDrawPicSummary, StatusDrawPicSummary];
  readonly weapon: StatusDrawPicSummary;
  readonly score: LatchNumberSummary;
}

export interface CPLoadGameSummary {
  readonly quick: boolean;
  readonly slot: number;
  readonly filename: string;
  readonly screen: DrawLoadSaveScreenSummary | null;
  readonly firstSound: boolean | null;
  readonly action: DrawLSActionSummary | null;
  readonly file: MenuLoadFileSummary | null;
  readonly loaded: MainLoadGameResult | null;
  readonly status: LoadGameStatusRedrawSummary | null;
  readonly secondSound: boolean | null;
  readonly startGame: number;
  readonly readThisActive: number;
  readonly fade: FadeSummary | null;
  readonly result: 0 | 1;
  readonly reason: "loaded" | "slot-unavailable" | "missing-memory" | "missing-file" | "cancelled";
}

export interface CPSaveGameSummary {
  readonly quick: boolean;
  readonly slot: number;
  readonly filename: string;
  readonly screen: DrawLoadSaveScreenSummary | null;
  readonly overwriteConfirm: ConfirmSummary | null;
  readonly firstSound: boolean | null;
  readonly clearedEmptySlot: BufferedDrawSummary<PlanarFillSummary> | null;
  readonly inputName: string | null;
  readonly action: DrawLSActionSummary | null;
  readonly saved: MainSaveGameResult | null;
  readonly file: MenuSaveFileSummary | null;
  readonly secondSound: boolean | null;
  readonly fade: FadeSummary | null;
  readonly result: 0 | 1;
  readonly reason: "saved" | "slot-unavailable" | "missing-memory" | "cancelled" | "overwrite-rejected";
}

export type CPCheckQuickBranch = "none" | "endgame" | "quicksave" | "quickload" | "quit";

export interface CPCheckQuickOptions extends ConfirmOptions, CPSaveGameOptions, CPLoadGameOptions {
  readonly dgroup?: DOSMemory;
  readonly pickquick?: number;
  readonly endStringIndex?: number;
  readonly skipFontCache?: boolean;
  readonly VGAHEAD?: Uint8Array;
  readonly VGAGRAPH?: Uint8Array;
  readonly VGADICT?: Uint8Array;
}

export interface CPCheckQuickSummary {
  readonly scancode: number;
  readonly branch: CPCheckQuickBranch;
  readonly result: 0 | 1;
  readonly pending: boolean;
  readonly pendingReason: string | null;
  readonly font: Uint8Array | null;
  readonly window160: WindowSummary | null;
  readonly confirm: ConfirmSummary | null;
  readonly memory: CPEndGameMemorySummary | null;
  readonly border: AllPlayBorderSummary<PlayBorderSummary> | null;
  readonly message: MessageSummary | null;
  readonly save: CPSaveGameSummary | null;
  readonly load: CPLoadGameSummary | null;
  readonly quit: CPQuitSummary | null;
  readonly window200: WindowSummary | null;
  readonly fontState: FontStateSummary | null;
  readonly pickquick: number;
  readonly mainSaveActive: number;
}

export interface CPQuitOptions extends ConfirmOptions, MenuPicOptions {
  readonly endStringIndex?: number;
}

export interface CPQuitSummary {
  readonly promptIndex: number;
  readonly prompt: string;
  readonly rnd: readonly [number, number] | null;
  readonly confirm: ConfirmSummary;
  readonly accepted: boolean;
  readonly update: UpdateScreenSummary | null;
  readonly musicOff: SoundModeSummary | null;
  readonly stopSound: SoundModeSummary | null;
  readonly fade: FadeSummary | null;
  readonly adlibWrites: readonly AlRegisterWrite[];
  readonly quitRequested: boolean;
  readonly redraw: DrawMainMenuSummary | null;
}

export interface CPReadThisOptions extends CPMusicOptions {
  readonly skipMusic?: boolean;
  readonly helpScreens?: () => unknown;
}

export interface CPReadThisSummary {
  readonly cornerMusic: StartCPMusicSummary | null;
  readonly helpScreens: unknown;
  readonly menuMusic: StartCPMusicSummary | null;
}

export interface CPNewGameOptions extends MenuPicOptions, ConfirmOptions {
  readonly dgroup?: DOSMemory;
  readonly episodeSelection?: number;
  readonly difficultySelection?: number;
  readonly alreadyInGame?: boolean;
  readonly skipFade?: boolean;
  readonly skipEpisodeDraw?: boolean;
  readonly skipDifficultyDraw?: boolean;
}

export interface CPNewGameSummary {
  readonly episodeDraw: DrawNewEpisodeSummary | null;
  readonly episodeSelection: number;
  readonly episode: number | null;
  readonly episodeAllowed: boolean;
  readonly episodeSound: boolean | null;
  readonly currentGameConfirm: ConfirmSummary | null;
  readonly firstFade: FadeSummary | null;
  readonly difficultyDraw: DrawNewGameSummary | null;
  readonly difficultySelection: number;
  readonly difficultySound: boolean | null;
  readonly newGame: MainNewGameSummary | null;
  readonly startGame: number;
  readonly finalFade: FadeSummary | null;
  readonly readThisActive: number;
  readonly pickquick: number;
  readonly cancelled: boolean;
  readonly cancelReason: "episode" | "episode-unavailable" | "current-game" | "difficulty" | null;
}

export interface CPViewScoresOptions extends CPMusicOptions {
  readonly skipMusic?: boolean;
  readonly skipFade?: boolean;
  readonly palette?: Uint8Array;
  readonly drawHighScores?: () => unknown;
  readonly ackMaxPolls?: number;
  readonly ackPollHook?: (poll: number) => void;
}

export interface CPViewScoresSummary {
  readonly font0: FontStateSummary;
  readonly scoreMusic: StartCPMusicSummary | null;
  readonly drawHighScores: unknown;
  readonly update: UpdateScreenSummary;
  readonly fadeIn: FadeSummary | null;
  readonly font1: FontStateSummary;
  readonly ack: boolean;
  readonly menuMusic: StartCPMusicSummary | null;
  readonly fadeOut: FadeSummary | null;
}

export interface CPSoundOptions extends MenuPicOptions, WaitKeyUpOptions, CPMusicOptions {
  readonly selections?: readonly number[];
  readonly skipLoadAllSounds?: boolean;
  readonly waitSoundDoneMaxPolls?: number;
}

export interface CPSoundActionSummary {
  readonly which: number;
  readonly changed: boolean;
  readonly waitSoundDone: boolean | null;
  readonly setSoundMode: boolean | null;
  readonly setDigiDevice: SoundModeSummary | null;
  readonly setMusicMode: boolean | null;
  readonly loadedSounds: CacheManagerSummary | null;
  readonly redraw: DrawSoundMenuSummary | null;
  readonly shootSound: boolean | null;
  readonly music: StartCPMusicSummary | null;
}

export interface CPSoundSummary {
  readonly initial: DrawSoundMenuSummary;
  readonly initialWait: WaitKeyUpSummary;
  readonly actions: readonly CPSoundActionSummary[];
  readonly exitSelection: number;
  readonly fade: null;
}

export interface CleanupControlPanelSummary {
  readonly controls: LumpCacheSummary;
  readonly fontState: FontStateSummary;
}

export interface DrawNewGameDiffSummary {
  readonly w: number;
  readonly picnum: number;
  readonly draw: BufferedPicDrawSummary;
}

export interface DrawLSActionSummary {
  readonly which: number;
  readonly window: MenuWindowSummary;
  readonly outline: MenuOutlineSummary;
  readonly disk: BufferedPicDrawSummary;
  readonly fontState: FontStateSummary;
  readonly positionedWindow: WindowSummary;
  readonly color: FontStateSummary;
  readonly print: PrintSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export interface DrawLoadSaveScreenOptions extends MenuPicOptions, WaitKeyUpOptions {
  readonly skipWaitKeyUp?: boolean;
}

export interface DrawLoadSaveScreenSummary {
  readonly loadsave: number;
  readonly background: MenuClearSummary;
  readonly fontState: FontStateSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly window: MenuWindowSummary;
  readonly stripes: StripeSummary;
  readonly titlePic: number;
  readonly title: BufferedPicDrawSummary;
  readonly entries: readonly PrintLSEntrySummary[];
  readonly menu: DrawMenuSummary;
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly wait: WaitKeyUpSummary | null;
}

export interface DrawMainMenuSummary {
  readonly background: MenuClearSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly stripes: StripeSummary;
  readonly optionsPic: BufferedPicDrawSummary;
  readonly window: MenuWindowSummary;
  readonly ingame: boolean;
  readonly backtodemoString: string;
  readonly backtodemoActive: number;
  readonly menu: DrawMenuSummary;
  readonly update: UpdateScreenSummary;
}

export interface DrawChangeViewSummary {
  readonly view: number;
  readonly bar: BufferedDrawSummary<PlanarFillSummary>;
  readonly preview: ShowViewSizeSummary;
  readonly printWindow: WindowSummary;
  readonly color: FontStateSummary;
  readonly size1: PrintSummary;
  readonly size2: PrintSummary;
  readonly size3: PrintSummary;
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly finalWindow: WindowRec;
}

export interface DrawMouseSensSummary {
  readonly background: MenuClearSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly window: MenuWindowSummary;
  readonly centerWindow: WindowSummary;
  readonly headingColor: FontStateSummary;
  readonly heading: PrintSummary;
  readonly labelColor: FontStateSummary;
  readonly slowPosition: WindowSummary;
  readonly slow: PrintSummary;
  readonly fastPosition: WindowSummary;
  readonly fast: PrintSummary;
  readonly mouseadjustment: number;
  readonly bar: BufferedDrawSummary<PlanarFillSummary>;
  readonly barOutline: MenuOutlineSummary;
  readonly knobOutline: MenuOutlineSummary;
  readonly knob: BufferedDrawSummary<PlanarFillSummary>;
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly finalWindow: WindowRec;
}

export interface MouseSensitivityPollState {
  readonly phase: "loop" | "release" | "final-release";
  readonly poll: number;
  readonly mouseadjustment: number;
  readonly exit: number;
}

export interface MouseSensitivityOptions extends MenuPicOptions, MenuControlOptions {
  readonly maxPolls?: number;
  readonly maxReleasePolls?: number;
  readonly pollHook?: (state: MouseSensitivityPollState) => void;
}

export interface MouseSensitivityStepSummary {
  readonly direction: "decrease" | "increase";
  readonly mouseadjustment: number;
  readonly bar: BufferedDrawSummary<PlanarFillSummary>;
  readonly barOutline: MenuOutlineSummary;
  readonly knobOutline: MenuOutlineSummary;
  readonly knob: BufferedDrawSummary<PlanarFillSummary>;
  readonly update: UpdateScreenSummary;
  readonly soundPlayed: boolean;
  readonly wait: WaitKeyUpSummary;
}

export interface MouseSensitivitySummary {
  readonly oldMouseAdjustment: number;
  readonly initial: DrawMouseSensSummary;
  readonly polls: number;
  readonly steps: readonly MouseSensitivityStepSummary[];
  readonly exit: number;
  readonly restored: boolean;
  readonly finalMouseAdjustment: number;
  readonly debugPauseRequested: boolean;
  readonly finalSound: boolean;
  readonly finalWait: WaitKeyUpSummary;
  readonly fade: null;
}

export interface DrawControlMenuButtonSummary {
  readonly index: number;
  readonly on: number;
  readonly picnum: number;
  readonly draw: BufferedPicDrawSummary;
}

export interface DrawCtlScreenSummary {
  readonly background: MenuClearSummary;
  readonly stripes: StripeSummary;
  readonly controlPic: BufferedPicDrawSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly window: MenuWindowSummary;
  readonly color: FontStateSummary;
  readonly menu: DrawMenuSummary;
  readonly buttons: readonly DrawControlMenuButtonSummary[];
  readonly pickedCurpos: number | null;
  readonly gun: DrawMenuGunSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export type CustomControlKind = "mouse" | "joy" | "keybd" | "keys";

export interface PrintCustSummary {
  readonly kind: CustomControlKind;
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly binding: number | null;
  readonly text: string | null;
  readonly print: PrintSummary | null;
  readonly finalWindow: WindowRec;
}

export interface DrawCustSummary {
  readonly kind: CustomControlKind;
  readonly hilight: number;
  readonly color: number;
  readonly colorState: FontStateSummary;
  readonly enabled: boolean | null;
  readonly menuIndex: number | null;
  readonly menuActive: number | null;
  readonly printY: number;
  readonly prints: readonly PrintCustSummary[];
  readonly finalWindow: WindowRec;
}

export interface DrawCustomLabelRowSummary {
  readonly runOrLeft: PrintSummary;
  readonly openOrRight: PrintSummary;
  readonly fireOrFrwd: PrintSummary;
  readonly strafeOrBkwd: PrintSummary;
}

export interface DrawCustomSectionSummary {
  readonly headingColor: FontStateSummary | null;
  readonly heading: PrintSummary | null;
  readonly labelColor: FontStateSummary;
  readonly labels: DrawCustomLabelRowSummary;
  readonly rowWindow: MenuWindowSummary;
  readonly row: DrawCustSummary;
  readonly newline: PrintSummary;
}

export interface DrawCustomScreenSummary {
  readonly background: MenuClearSummary;
  readonly initialWindow: WindowSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly stripes: StripeSummary;
  readonly title: BufferedPicDrawSummary;
  readonly mouse: DrawCustomSectionSummary;
  readonly joystick: DrawCustomSectionSummary;
  readonly keyboardButtons: DrawCustomSectionSummary;
  readonly keyboardMove: DrawCustomSectionSummary;
  readonly pickedCurpos: number | null;
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly finalWindow: WindowRec;
}

export interface FixupCustomLinesSummary {
  readonly y: number;
  readonly innerTop: BufferedDrawSummary<PlanarFillSummary>;
  readonly innerBottom: BufferedDrawSummary<PlanarFillSummary>;
  readonly outerTop: BufferedDrawSummary<PlanarFillSummary>;
  readonly outerBottom: BufferedDrawSummary<PlanarFillSummary>;
}

export interface FixupCustomSummary {
  readonly w: number;
  readonly currentLines: FixupCustomLinesSummary;
  readonly currentDraw: DrawCustSummary | null;
  readonly previous: number;
  readonly previousLines: FixupCustomLinesSummary | null;
  readonly previousDraw: DrawCustSummary | null;
  readonly lastwhich: number;
}

export interface CustomCtrls {
  readonly allowed: readonly number[];
}

export type CustomControlType = typeof MOUSE | typeof JOYSTICK | typeof KEYBOARDBTNS | typeof KEYBOARDMOVE;

export type EnterCtrlDataPhase =
  | "redraw-release"
  | "loop"
  | "pick"
  | "post-pick-release"
  | "direction-release"
  | "final-release";

export interface EnterCtrlDataPollState {
  readonly phase: EnterCtrlDataPhase;
  readonly poll: number;
  readonly index: number;
  readonly which: number;
  readonly type: CustomControlType;
  readonly exit: number;
  readonly picked: number;
  readonly control: ControlInfo | null;
}

export interface EnterCtrlDataOptions extends MenuControlOptions {
  readonly maxPolls?: number;
  readonly maxPickPolls?: number;
  readonly maxReleasePolls?: number;
  readonly maxTimerServices?: number;
  readonly pollHook?: (state: EnterCtrlDataPollState) => void;
}

export interface EnterCtrlDataRedrawSummary {
  readonly which: number;
  readonly x: number;
  readonly clearWindow: MenuWindowSummary;
  readonly draw: DrawCustSummary;
  readonly selectWindow: MenuWindowSummary;
  readonly outline: MenuOutlineSummary;
  readonly selectColor: FontStateSummary;
  readonly print: PrintCustSummary;
  readonly restoreColor: FontStateSummary;
  readonly update: UpdateScreenSummary;
  readonly wait: WaitKeyUpSummary;
}

export interface EnterCtrlDataFlashSummary {
  readonly tick: number;
  readonly erase: BufferedDrawSummary<PlanarFillSummary> | null;
  readonly question: PrintSummary | null;
  readonly sound: boolean | null;
  readonly update: UpdateScreenSummary;
}

export interface EnterCtrlDataPickSummary {
  readonly which: number;
  readonly type: CustomControlType;
  readonly polls: number;
  readonly result: number;
  readonly scan: number | null;
  readonly escape: boolean;
  readonly flashes: readonly EnterCtrlDataFlashSummary[];
  readonly sound: boolean | null;
  readonly bindings: {
    readonly buttonmouse: readonly number[];
    readonly buttonjoy: readonly number[];
    readonly buttonscan: readonly number[];
    readonly dirscan: readonly number[];
  };
}

export interface EnterCtrlDataMoveSummary {
  readonly direction: "west" | "east";
  readonly which: number;
  readonly sound: boolean;
  readonly releasePolls: number;
  readonly clear: InputManagerSummary;
}

export interface EnterCtrlDataSummary {
  readonly index: number;
  readonly type: CustomControlType;
  readonly allowed: readonly number[];
  readonly initialSound: boolean;
  readonly printY: number;
  readonly initialClear: InputManagerSummary;
  readonly initialWhich: number;
  readonly redraws: readonly EnterCtrlDataRedrawSummary[];
  readonly picks: readonly EnterCtrlDataPickSummary[];
  readonly moves: readonly EnterCtrlDataMoveSummary[];
  readonly exit: number;
  readonly finalSound: boolean;
  readonly finalWait: WaitKeyUpSummary;
  readonly finalClearWindow: MenuWindowSummary;
  readonly finalBindings: {
    readonly buttonmouse: readonly number[];
    readonly buttonjoy: readonly number[];
    readonly buttonscan: readonly number[];
    readonly dirscan: readonly number[];
  };
}

export interface DefineControlSummary {
  readonly index: number;
  readonly type: CustomControlType;
  readonly allowed: readonly number[];
  readonly enter: EnterCtrlDataSummary;
}

export interface CustomControlsOptions extends MenuPicOptions {
  readonly selections?: readonly number[];
  readonly defineOptions?: {
    readonly mouse?: EnterCtrlDataOptions;
    readonly joy?: EnterCtrlDataOptions;
    readonly keybd?: EnterCtrlDataOptions;
    readonly keys?: EnterCtrlDataOptions;
  };
}

export interface CustomControlsActionSummary {
  readonly which: number;
  readonly define: DefineControlSummary | null;
  readonly redraw: DrawCustSummary | null;
}

export interface CustomControlsSummary {
  readonly initial: DrawCustomScreenSummary;
  readonly actions: readonly CustomControlsActionSummary[];
  readonly exitSelection: number;
  readonly fade: null;
}

export interface DrawNewEpisodeOptions extends MenuPicOptions, WaitKeyUpOptions {
  readonly skipWaitKeyUp?: boolean;
}

export interface DrawNewEpisodeSummary {
  readonly background: MenuClearSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly window: MenuWindowSummary;
  readonly headingWindow: WindowSummary;
  readonly headingColor: FontStateSummary;
  readonly heading: PrintSummary;
  readonly menuColor: FontStateSummary;
  readonly menu: DrawMenuSummary;
  readonly episodePics: readonly BufferedPicDrawSummary[];
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly wait: WaitKeyUpSummary | null;
  readonly finalWindow: WindowRec;
}

export interface DrawNewGameOptions extends MenuPicOptions, WaitKeyUpOptions {
  readonly skipWaitKeyUp?: boolean;
}

export interface DrawNewGameSummary {
  readonly background: MenuClearSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly headingColor: FontStateSummary;
  readonly headingPosition: WindowSummary;
  readonly heading: PrintSummary;
  readonly window: MenuWindowSummary;
  readonly menu: DrawMenuSummary;
  readonly difficulty: DrawNewGameDiffSummary;
  readonly update: UpdateScreenSummary;
  readonly fade: null;
  readonly wait: WaitKeyUpSummary | null;
}

export interface DrawSoundMenuButtonSummary {
  readonly index: number;
  readonly on: number;
  readonly picnum: number;
  readonly draw: BufferedPicDrawSummary;
}

export interface DrawSoundMenuSummary {
  readonly background: MenuClearSummary;
  readonly mouseBack: BufferedPicDrawSummary;
  readonly windows: readonly [MenuWindowSummary, MenuWindowSummary, MenuWindowSummary];
  readonly menu: DrawMenuSummary;
  readonly titles: readonly [BufferedPicDrawSummary, BufferedPicDrawSummary, BufferedPicDrawSummary];
  readonly buttons: readonly DrawSoundMenuButtonSummary[];
  readonly gun: DrawMenuGunSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export interface GetYorNPollState {
  readonly phase: "wait" | "release";
  readonly poll: number;
  readonly xit: number;
}

export interface GetYorNOptions extends MenuPicOptions {
  readonly maxPolls?: number;
  readonly maxReleasePolls?: number;
  readonly pollHook?: (state: GetYorNPollState) => void;
}

export interface GetYorNSummary {
  readonly accepted: boolean;
  readonly xit: number;
  readonly x: number;
  readonly y: number;
  readonly pic: number;
  readonly cached: boolean;
  readonly draw: BufferedPicDrawSummary;
  readonly uncached: boolean;
  readonly update: UpdateScreenSummary;
  readonly initialClear: InputManagerSummary;
  readonly waitPolls: number;
  readonly releasePolls: number;
  readonly shootDuringAccept: boolean | null;
  readonly finalClear: InputManagerSummary;
  readonly finalSound: boolean;
}

export interface PrintLSEntrySummary {
  readonly w: number;
  readonly color: number;
  readonly fontColor: FontStateSummary;
  readonly outline: MenuOutlineSummary;
  readonly positionedWindow: WindowSummary;
  readonly entryFont: FontStateSummary;
  readonly text: string;
  readonly print: PrintSummary;
  readonly finalFont: FontStateSummary;
  readonly finalWindow: WindowRec;
}

export interface TrackWhichGameSummary {
  readonly previous: number;
  readonly current: number;
  readonly previousEntry: PrintLSEntrySummary;
  readonly currentEntry: PrintLSEntrySummary;
}

export interface CPMusicOptions {
  readonly AUDIOHED?: Uint8Array;
  readonly AUDIOT?: Uint8Array;
}

export interface FreeMusicSummary {
  readonly song: number;
  readonly chunk: number;
  readonly freed: boolean;
}

export interface StartCPMusicSummary {
  readonly previousSong: number;
  readonly previousChunk: number;
  readonly freedPrevious: boolean;
  readonly song: number;
  readonly chunk: number;
  readonly musicOff: SoundModeSummary;
  readonly cacheLength: number;
  readonly started: SoundModeSummary;
}

export interface SetupControlPanelSaveFile {
  readonly filename: string;
  readonly data: Uint8Array | string;
}

export interface SetupControlPanelOptions {
  readonly skipResourceCache?: boolean;
  readonly skipLoadAllSounds?: boolean;
  readonly saveFiles?: readonly SetupControlPanelSaveFile[];
  readonly AUDIOHED?: Uint8Array;
  readonly AUDIOT?: Uint8Array;
}

export interface SetupControlPanelSaveSummary {
  readonly slot: number;
  readonly filename: string;
  readonly name: string;
}

export interface SetupControlPanelSummary {
  readonly font: Uint8Array | null;
  readonly controls: LumpCacheSummary | null;
  readonly fontState: FontStateSummary;
  readonly window: WindowSummary;
  readonly ingame: boolean;
  readonly loadedSounds: CacheManagerSummary | null;
  readonly mainSaveActive: number;
  readonly saves: readonly SetupControlPanelSaveSummary[];
  readonly mouseCenter: readonly [number, number];
}

export interface CalibrateJoystickPollState {
  readonly phase: "first-wait" | "second-wait" | "release";
  readonly poll: number;
  readonly buttons: number;
}

export interface CalibrateJoystickOptions extends MenuPicOptions {
  readonly maxPolls?: number;
  readonly maxReleasePolls?: number;
  readonly pollHook?: (state: CalibrateJoystickPollState) => void;
}

export interface CalibrateJoystickScreenSummary {
  readonly step: 1 | 2;
  readonly picnum: number;
  readonly window: MenuWindowSummary;
  readonly outline: MenuOutlineSummary;
  readonly color: FontStateSummary;
  readonly printWindow: WindowSummary;
  readonly heading: PrintSummary;
  readonly icon: BufferedPicDrawSummary;
  readonly instructionWindow: WindowSummary;
  readonly instruction: PrintSummary;
  readonly exitColor: FontStateSummary;
  readonly exit: PrintSummary;
  readonly update: UpdateScreenSummary;
  readonly finalWindow: WindowRec;
}

export interface CalibrateJoystickSummary {
  readonly success: boolean;
  readonly exitReason: "calibrated" | "escape" | "invalid-range";
  readonly firstScreen: CalibrateJoystickScreenSummary;
  readonly secondScreen: CalibrateJoystickScreenSummary | null;
  readonly firstPolls: number;
  readonly secondPolls: number;
  readonly releasePolls: number;
  readonly min: AxisAbs | null;
  readonly max: AxisAbs | null;
  readonly firstSound: boolean | null;
  readonly secondSound: boolean | null;
  readonly setup: JoystickDef | null;
  readonly debugPauseRequested: boolean;
}

export interface CheckForEpisodesOptions {
  readonly files?: readonly string[];
  readonly throwOnMissing?: boolean;
}

export interface CheckForEpisodesSummary {
  readonly detected: "WL6" | "WL3" | "WL1";
  readonly extension: string;
  readonly names: {
    readonly configname: string;
    readonly SaveName: string;
    readonly PageFileName: string;
    readonly audioname: string;
    readonly demoname: string;
    readonly helpfilename: string;
    readonly endfilename: string;
  };
  readonly episodeSelect: readonly number[];
  readonly episodeMenuActive: readonly number[];
}

export interface BossKeyOptions {
  readonly palette?: Uint8Array;
  readonly latchOptions?: LoadLatchMemOptions;
  readonly skipLatchMem?: boolean;
  readonly waitForEscape?: boolean;
  readonly prompt?: string;
}

export interface BossKeySummary {
  readonly musicOff: SoundModeSummary;
  readonly textMode: VideoModeSummary;
  readonly prompt: string;
  readonly waitedForEscape: boolean;
  readonly escapeWasDown: boolean;
  readonly clearDuringWait: InputManagerSummary | null;
  readonly musicOn: SoundModeSummary;
  readonly vgaMode: VideoModeSummary;
  readonly paletteTest: boolean;
  readonly palette: PaletteSummary | null;
  readonly latchMem: LoadLatchMemSummary | null;
}

export function BossKey(options: BossKeyOptions = {}): BossKeySummary {
  const musicOff = SD_MusicOff();
  const textMode = VL_SetTextMode();
  const prompt = options.prompt ?? "C>";
  const shouldWait = options.waitForEscape ?? true;
  const escapeWasDown = !!Keyboard[sc_Escape];
  const clearDuringWait = shouldWait && !escapeWasDown ? IN_ClearKeysDown() : null;
  const musicOn = SD_MusicOn();
  const vgaMode = VL_SetVGAPlaneMode();
  const paletteTest = VL_TestPaletteSet();
  const palette = options.palette ? VL_SetPalette(options.palette) : null;
  const skipLatchMem = options.skipLatchMem ?? !options.latchOptions;
  const latchMem = skipLatchMem ? null : LoadLatchMem(options.latchOptions);

  return {
    musicOff,
    textMode,
    prompt,
    waitedForEscape: shouldWait,
    escapeWasDown,
    clearDuringWait,
    musicOn,
    vgaMode,
    paletteTest,
    palette,
    latchMem,
  };
}

export function CacheLump(lumpstart: number, lumpend: number): LumpCacheSummary {
  const chunks: number[] = [];
  let cached = 0;
  for (let i = Math.trunc(lumpstart); i <= Math.trunc(lumpend); i++) {
    chunks.push(i);
    if (CA_CacheGrChunk(i)) {
      cached++;
    }
  }
  return { start: Math.trunc(lumpstart), end: Math.trunc(lumpend), chunks, cached, skipped: 0 };
}

export function CalibrateJoystick(options: CalibrateJoystickOptions = {}): CalibrateJoystickSummary {
  const firstScreen = drawCalibrateJoystickScreen(1, options);
  const maxPolls = options.maxPolls ?? 256;
  const maxReleasePolls = options.maxReleasePolls ?? 256;
  let firstPolls = 0;
  let secondPolls = 0;
  let releasePolls = 0;
  let debugPauseRequested = false;

  let buttons = 0;
  do {
    options.pollHook?.({ phase: "first-wait", poll: firstPolls, buttons });
    buttons = IN_JoyButtons();
    firstPolls++;
    if (Keyboard[sc_Escape]) {
      return {
        success: false,
        exitReason: "escape",
        firstScreen,
        secondScreen: null,
        firstPolls,
        secondPolls,
        releasePolls,
        min: null,
        max: null,
        firstSound: null,
        secondSound: null,
        setup: null,
        debugPauseRequested,
      };
    }
    if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers")) {
      debugPauseRequested = true;
    }
    if (firstPolls > maxPolls) {
      throw new Error("CalibrateJoystick: button 0 was not pressed before maxPolls");
    }
  } while (!(buttons & 1));

  const firstSound = SD_PlaySound(SHOOTSND);
  const min = IN_GetJoyAbs(joystickport);
  const secondScreen = drawCalibrateJoystickScreen(2, options);

  buttons = 0;
  do {
    options.pollHook?.({ phase: "second-wait", poll: secondPolls, buttons });
    buttons = IN_JoyButtons();
    secondPolls++;
    if (Keyboard[sc_Escape]) {
      return {
        success: false,
        exitReason: "escape",
        firstScreen,
        secondScreen,
        firstPolls,
        secondPolls,
        releasePolls,
        min,
        max: null,
        firstSound,
        secondSound: null,
        setup: null,
        debugPauseRequested,
      };
    }
    if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers")) {
      debugPauseRequested = true;
    }
    if (secondPolls > maxPolls) {
      throw new Error("CalibrateJoystick: button 1 was not pressed before maxPolls");
    }
  } while (!(buttons & 2));

  const max = IN_GetJoyAbs(joystickport);
  const secondSound = SD_PlaySound(SHOOTSND);

  while (IN_JoyButtons()) {
    options.pollHook?.({ phase: "release", poll: releasePolls, buttons: IN_JoyButtons() });
    releasePolls++;
    if (releasePolls > maxReleasePolls) {
      throw new Error("CalibrateJoystick: joystick buttons did not release before maxReleasePolls");
    }
  }

  if (min.x !== max.x && min.y !== max.y) {
    const setup = IN_SetupJoy(joystickport, min.x, max.x, min.y, max.y);
    return {
      success: true,
      exitReason: "calibrated",
      firstScreen,
      secondScreen,
      firstPolls,
      secondPolls,
      releasePolls,
      min,
      max,
      firstSound,
      secondSound,
      setup,
      debugPauseRequested,
    };
  }

  return {
    success: false,
    exitReason: "invalid-range",
    firstScreen,
    secondScreen,
    firstPolls,
    secondPolls,
    releasePolls,
    min,
    max,
    firstSound,
    secondSound,
    setup: null,
    debugPauseRequested,
  };
}

export function CheckForEpisodes(options: CheckForEpisodesOptions = {}): CheckForEpisodesSummary {
  const files = options.files ?? ["WOLF3D.WL6"];
  let detected: CheckForEpisodesSummary["detected"] | null = null;

  if (hasEpisodeFile(files, "WL6")) {
    detected = "WL6";
    NewEmenu[2].active =
      NewEmenu[4].active =
      NewEmenu[6].active =
      NewEmenu[8].active =
      NewEmenu[10].active = 1;
    EpisodeSelect[1] =
      EpisodeSelect[2] =
      EpisodeSelect[3] =
      EpisodeSelect[4] =
      EpisodeSelect[5] = 1;
  } else if (hasEpisodeFile(files, "WL3")) {
    detected = "WL3";
    NewEmenu[2].active =
      NewEmenu[4].active = 1;
    EpisodeSelect[1] =
      EpisodeSelect[2] = 1;
  } else if (hasEpisodeFile(files, "WL1")) {
    detected = "WL1";
  }

  if (!detected) {
    if (options.throwOnMissing ?? true) {
      throw new Error("NO WOLFENSTEIN 3-D DATA FILES to be found!");
    }
    detected = "WL1";
  }

  const extension = detected;
  SaveName = `SAVEGAM?.${extension}`;
  return {
    detected,
    extension,
    names: {
      configname: `CONFIG.${extension}`,
      SaveName,
      PageFileName: `VSWAP.${extension}`,
      audioname: `AUDIO.${extension}`,
      demoname: `DEMO?.${extension}`,
      helpfilename: `HELPART.${extension}`,
      endfilename: `ENDART1.${extension}`,
    },
    episodeSelect: [...EpisodeSelect],
    episodeMenuActive: NewEmenu.map((item) => item.active),
  };
}

export function CheckPause(): CheckPauseSummary {
  const soundStatusBefore = SoundStatus;
  if (!Paused) {
    return {
      wasPaused: false,
      soundStatusBefore,
      soundStatusAfter: SoundStatus,
      music: null,
      verticalBlankWaits: null,
      input: null,
      pausedAfter: Paused,
    };
  }

  let music: SoundModeSummary | null = null;
  switch (SoundStatus) {
    case 0:
      music = SD_MusicOn();
      break;
    case 1:
      music = SD_MusicOff();
      break;
  }

  SoundStatus ^= 1;
  const verticalBlankWaits = VL_WaitVBL(3);
  IN_ClearKeysDown();
  const input = IN_SetPaused(false);
  return {
    wasPaused: true,
    soundStatusBefore,
    soundStatusAfter: SoundStatus,
    music,
    verticalBlankWaits,
    input,
    pausedAfter: Paused,
  };
}

export function CleanupControlPanel(): CleanupControlPanelSummary {
  const controls = UnCacheLump(CONTROLS_LUMP_START, CONTROLS_LUMP_END);
  const fontState = VW_SetFontState({ fontnumber: 0 });
  return { controls, fontState };
}

export function ClearMScreen(): MenuClearSummary {
  return { background: VWB_Bar(0, 0, 320, 200, BORDCOLOR) };
}

export function Confirm(string: string | ArrayLike<number>, options: ConfirmOptions = {}): ConfirmSummary {
  let xit = 0;
  let tick = 0;
  let waitPolls = 0;
  let releasePolls = 0;
  let timerServices = 0;
  const blinks: ConfirmBlinkSummary[] = [];
  const whichsnd = [ESCPRESSEDSND, SHOOTSND] as const;

  const message = Message(string, options);
  const initialClear = IN_ClearKeysDown();
  const position = US_SaveWindow();
  const x = position.px;
  const y = position.py;
  SD_SetTimeCount(0);

  const maxPolls = options.maxPolls ?? 256;
  const maxTimerServices = options.maxTimerServices ?? maxPolls * 16;
  while (!Keyboard[sc_Y] && !Keyboard[sc_N] && !Keyboard[sc_Escape]) {
    options.pollHook?.({ phase: "wait", poll: waitPolls, xit });
    if (Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]) {
      break;
    }

    if (TimeCount >= 10) {
      let erase: BufferedDrawSummary<PlanarFillSummary> | null = null;
      let print: PrintSummary | null = null;
      switch (tick) {
        case 0:
          erase = VWB_Bar(x, y, 8, 13, TEXTCOLOR);
          break;
        case 1:
          US_RestoreWindow({ ...US_SaveWindow(), px: x, py: y });
          print = US_Print("_");
          break;
      }
      const update = VW_UpdateScreen();
      blinks.push({ tick, erase, print, update });
      tick ^= 1;
      SD_SetTimeCount(0);
    } else {
      if (timerServices >= maxTimerServices) {
        throw new Error("Confirm: timer did not reach cursor blink threshold before maxTimerServices");
      }
      SDL_t0Service();
      timerServices++;
    }

    waitPolls++;
    if (waitPolls >= maxPolls) {
      throw new Error("Confirm: no Y/N/Escape response before maxPolls");
    }
  }

  let shootDuringAccept: boolean | null = null;
  if (Keyboard[sc_Y]) {
    xit = 1;
    shootDuringAccept = ShootSnd();
  }

  const maxReleasePolls = options.maxReleasePolls ?? 256;
  while (Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]) {
    options.pollHook?.({ phase: "release", poll: releasePolls, xit });
    releasePolls++;
    if (releasePolls > maxReleasePolls) {
      throw new Error("Confirm: response key did not release before maxReleasePolls");
    }
  }

  const finalClear = IN_ClearKeysDown();
  const finalSound = SD_PlaySound(whichsnd[xit]);
  return {
    accepted: !!xit,
    xit,
    message,
    x,
    y,
    waitPolls,
    releasePolls,
    blinks,
    initialClear,
    finalClear,
    shootDuringAccept,
    finalSound,
  };
}

export function CP_ChangeView(options: CPChangeViewOptions = {}): CPChangeViewSummary {
  let exit = 0;
  const initialWindow = US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const oldview = Math.trunc(viewwidth / 16);
  let newview = oldview;
  const initial = DrawChangeView(oldview);
  const steps: CPChangeViewStepSummary[] = [];
  let polls = 0;
  let debugPauseRequested = false;
  const maxPolls = options.maxPolls ?? 256;

  do {
    const pause = CheckPause();
    options.pollHook?.({ phase: "loop", poll: polls, oldview, newview, exit });
    const ci = ReadAnyControl(undefined, options).control;
    let stepDirection: CPChangeViewStepSummary["direction"] | null = null;

    switch (ci.dir) {
      case dir_South:
      case dir_West:
        newview--;
        if (newview < 4) {
          newview = 4;
        }
        stepDirection = "decrease";
        break;

      case dir_North:
      case dir_East:
        newview++;
        if (newview > 19) {
          newview = 19;
        }
        stepDirection = "increase";
        break;
    }

    if (stepDirection) {
      const preview = ShowViewSize(newview);
      const update = VW_UpdateScreen();
      const soundPlayed = SD_PlaySound(HITWALLSND);
      options.pollHook?.({ phase: "post-step", poll: polls, oldview, newview, exit });
      const delay = TicDelay(10, {
        mouseenabled: options.mouseenabled,
        joystickenabled: options.joystickenabled,
        joypadenabled: options.joypadenabled,
        joystickport: options.joystickport,
        mouseX: options.mouseX,
        mouseY: options.mouseY,
        mouseButtons: options.mouseButtons,
        joyDelta: options.joyDelta,
        joyButtons: options.joyButtons,
        maxPolls: options.maxDelayPolls,
      });
      steps.push({ direction: stepDirection, newview, pause, preview, update, soundPlayed, delay });
    } else {
      options.pollHook?.({ phase: "post-step", poll: polls, oldview, newview, exit });
    }

    if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers")) {
      debugPauseRequested = true;
    }

    if (ci.button0 || Keyboard[sc_Enter]) {
      exit = 1;
    } else if (ci.button1 || Keyboard[sc_Escape]) {
      exit = 2;
    }

    polls++;
    if (!exit && polls >= maxPolls) {
      throw new Error("CP_ChangeView: no accept/cancel response before maxPolls");
    }
  } while (!exit);

  if (exit === 2) {
    const restoredViewSize = SetViewSize(oldview * 16, Math.trunc(oldview * 16 * 0.5));
    const changeSound = SD_PlaySound(ESCPRESSEDSND);
    return {
      oldview,
      initialWindow,
      initial,
      polls,
      steps,
      exit,
      cancelled: true,
      restoredViewSize,
      changed: false,
      changeSound,
      thinkMessage: null,
      resize: null,
      shootSound: null,
      debugPauseRequested,
      fade: null,
    };
  }

  let changeSound: boolean | null = null;
  let thinkMessage: MessageSummary | null = null;
  let resize: ViewSizeSummary | null = null;
  if (oldview !== newview) {
    changeSound = SD_PlaySound(SHOOTSND);
    thinkMessage = Message(`${STR_THINK}...`, options);
    resize = NewViewSize(newview);
  }

  const shootSound = ShootSnd();
  return {
    oldview,
    initialWindow,
    initial,
    polls,
    steps,
    exit,
    cancelled: false,
    restoredViewSize: null,
    changed: oldview !== newview,
    changeSound,
    thinkMessage,
    resize,
    shootSound,
    debugPauseRequested,
    fade: null,
  };
}

export function CP_CheckQuick(scancode: number, options: CPCheckQuickOptions = {}): CPCheckQuickSummary {
  const scan = Math.trunc(scancode);
  const quickReady = !!(options.pickquick ?? pickquick);
  switch (scan) {
    case sc_F7: {
      const font = options.skipFontCache
        ? null
        : CA_CacheGrChunk(STARTFONT + 1, options.VGAHEAD, options.VGAGRAPH, options.VGADICT);
      const window160 = US_RestoreWindow({ ...US_SaveWindow(), h: 160 });
      const confirm = Confirm(ENDGAMESTR, options);
      const memory = confirm.accepted ? writeEndGameState(options.dgroup) : null;
      const border = DrawAllPlayBorder();
      const window200 = US_RestoreWindow({ ...US_SaveWindow(), h: 200 });
      const fontState = VW_SetFontState({ fontnumber: 0 });
      MainMenu[savegame].active = 0;
      return {
        scancode: scan,
        branch: "endgame",
        result: 1,
        pending: false,
        pendingReason: null,
        font,
        window160,
        confirm,
        memory,
        border,
        message: null,
        save: null,
        load: null,
        quit: null,
        window200,
        fontState,
        pickquick,
        mainSaveActive: MainMenu[savegame].active,
      };
    }

    case sc_F8:
      if (SaveGamesAvail[LSItems.curpos] && quickReady) {
        const font = options.skipFontCache
          ? null
          : CA_CacheGrChunk(STARTFONT + 1, options.VGAHEAD, options.VGAGRAPH, options.VGADICT);
        VW_SetFontState({ fontnumber: 1 });
        const message = Message("Saving...", options);
        const save = CP_SaveGame({ ...options, quick: true, slot: LSItems.curpos, skipDraw: true, skipFade: true });
        const fontState0 = VW_SetFontState({ fontnumber: 0 });
        return {
          scancode: scan,
          branch: "quicksave",
          result: 1,
          pending: false,
          pendingReason: null,
          font,
          window160: null,
          confirm: null,
          memory: null,
          border: null,
          message,
          save,
          load: null,
          quit: null,
          window200: null,
          fontState: fontState0,
          pickquick,
          mainSaveActive: MainMenu[savegame].active,
        };
      }
      return pendingQuickCheck(scan, "quicksave", "CP_CheckQuick full save menu path is not ported yet");

    case sc_F9:
      if (SaveGamesAvail[LSItems.curpos] && quickReady) {
        const font = options.skipFontCache
          ? null
          : CA_CacheGrChunk(STARTFONT + 1, options.VGAHEAD, options.VGAGRAPH, options.VGADICT);
        VW_SetFontState({ fontnumber: 1 });
        const confirm = Confirm(`${STR_LGC}${SaveGameNames[LSItems.curpos]}"?`, options);
        const load = confirm.accepted
          ? CP_LoadGame({ ...options, quick: true, slot: LSItems.curpos, skipDraw: true, skipFade: true })
          : null;
        const border = DrawAllPlayBorder();
        const fontState0 = VW_SetFontState({ fontnumber: 0 });
        return {
          scancode: scan,
          branch: "quickload",
          result: 1,
          pending: false,
          pendingReason: null,
          font,
          window160: null,
          confirm,
          memory: null,
          border,
          message: null,
          save: null,
          load,
          quit: null,
          window200: null,
          fontState: fontState0,
          pickquick,
          mainSaveActive: MainMenu[savegame].active,
        };
      }
      return pendingQuickCheck(scan, "quickload", "CP_CheckQuick full load menu path is not ported yet");

    case sc_F10: {
      const font = options.skipFontCache
        ? null
        : CA_CacheGrChunk(STARTFONT + 1, options.VGAHEAD, options.VGAGRAPH, options.VGADICT);
      const window160 = US_RestoreWindow({ ...US_SaveWindow(), x: 0, y: 0, w: 320, h: 160 });
      const selection = selectEndString(options);
      const confirm = Confirm(selection.prompt, options);
      let update: UpdateScreenSummary | null = null;
      let musicOff: SoundModeSummary | null = null;
      let stopSound: SoundModeSummary | null = null;
      let fade: FadeSummary | null = null;
      const adlibWrites: AlRegisterWrite[] = [];
      let quitRequested = false;

      if (confirm.accepted) {
        update = VW_UpdateScreen();
        musicOff = SD_MusicOff();
        stopSound = SD_StopSound();
        fade = menuFadeOut();
        for (let i = 1; i <= 0xf5; i++) {
          adlibWrites.push(alOut(i, 0));
        }
        quitRequested = true;
      }

      const quit: CPQuitSummary = {
        promptIndex: selection.index,
        prompt: selection.prompt,
        rnd: selection.rnd,
        confirm,
        accepted: confirm.accepted,
        update,
        musicOff,
        stopSound,
        fade,
        adlibWrites,
        quitRequested,
        redraw: null,
      };
      const border = DrawAllPlayBorder();
      const window200 = US_RestoreWindow({ ...US_SaveWindow(), h: 200 });
      const fontState = VW_SetFontState({ fontnumber: 0 });
      return {
        scancode: scan,
        branch: "quit",
        result: 1,
        pending: false,
        pendingReason: null,
        font,
        window160,
        confirm,
        memory: null,
        border,
        message: null,
        save: null,
        load: null,
        quit,
        window200,
        fontState,
        pickquick,
        mainSaveActive: MainMenu[savegame].active,
      };
    }

    default:
      return {
        scancode: scan,
        branch: "none",
        result: 0,
        pending: false,
        pendingReason: null,
        font: null,
        window160: null,
        confirm: null,
        memory: null,
        border: null,
        message: null,
        save: null,
        load: null,
        quit: null,
        window200: null,
        fontState: null,
        pickquick,
        mainSaveActive: MainMenu[savegame].active,
      };
  }
}

export function CP_Control(options: CPControlOptions = {}): CPControlSummary {
  const initial = DrawCtlScreen(options);
  const initialWait = WaitKeyUp(options);
  const actions: CPControlActionSummary[] = [];
  let exitSelection = -1;

  for (const rawSelection of options.selections ?? []) {
    const which = Math.trunc(rawSelection);
    if (which < 0) {
      exitSelection = which;
      break;
    }

    const before = controlState();
    let mouseCenter: readonly [number, number] | null = null;
    let calibration: CalibrateJoystickSummary | null = null;
    let wait: WaitKeyUpSummary | null = null;
    let sound: boolean | null = null;

    switch (which) {
      case 0:
        mouseenabled = !mouseenabled;
        mouseCenter = [CENTER, CENTER];
        CusItems.curpos = -1;
        break;

      case 1:
        joystickenabled = !joystickenabled;
        if (joystickenabled) {
          calibration = CalibrateJoystick({
            chunks: options.chunks,
            pictable: options.pictable,
            maxTimerServices: options.maxTimerServices,
            ...options.calibrateOptions,
          });
          if (!calibration.success) {
            joystickenabled = false;
          }
        }
        CusItems.curpos = -1;
        break;

      case 2:
        joystickport ^= 1;
        break;

      case 3:
        joypadenabled = !joypadenabled;
        break;

      case 4:
      case 5:
        break;

      default:
        throw new RangeError(`CP_Control: bad menu selection ${which}`);
    }

    const redraw = DrawCtlScreen(options);
    if (which === 4 || which === 5) {
      wait = WaitKeyUp(options);
    } else {
      sound = ShootSnd();
    }

    actions.push({ which, before, after: controlState(), mouseCenter, calibration, redraw, wait, sound });
  }

  return {
    initial,
    initialWait,
    actions,
    exitSelection,
    finalState: controlState(),
    fade: null,
  };
}

export function CP_EndGame(options: CPEndGameOptions = {}): CPEndGameSummary {
  const confirm = Confirm(ENDGAMESTR, options);
  if (!confirm.accepted) {
    return {
      confirm,
      ended: false,
      result: 0,
      memory: null,
      pickquick,
      mainSaveActive: MainMenu[savegame].active,
      viewScoresString: MainMenu[viewscores].string,
      viewScoresRoutine: MainMenu[viewscores].routine?.name ?? null,
    };
  }

  const memory = writeEndGameState(options.dgroup);

  MainMenu[savegame].active = 0;
  MainMenu[viewscores].routine = CP_ViewScores;
  MainMenu[viewscores].string = STR_VS;

  return {
    confirm,
    ended: true,
    result: 1,
    memory,
    pickquick,
    mainSaveActive: MainMenu[savegame].active,
    viewScoresString: MainMenu[viewscores].string,
    viewScoresRoutine: MainMenu[viewscores].routine?.name ?? null,
  };
}

export function CP_LoadGame(optionsOrQuick: CPLoadGameOptions | number = {}): CPLoadGameSummary {
  const options: CPLoadGameOptions = typeof optionsOrQuick === "number" ? { quick: !!optionsOrQuick } : optionsOrQuick;
  const quick = !!options.quick;
  const slot = clampSaveSlot(options.slot ?? options.selection ?? LSItems.curpos);
  const filename = saveFilenameForSlot(slot);
  const screen = quick || options.skipDraw ? null : DrawLoadSaveScreen(0, loadSaveDrawOptions(options));

  const cancelled = !quick && (options.selection ?? LSItems.curpos) < 0;
  if (cancelled) {
    const fade = options.skipFade ? null : menuFadeOut();
    return {
      quick,
      slot,
      filename,
      screen,
      firstSound: null,
      action: null,
      file: null,
      loaded: null,
      status: null,
      secondSound: null,
      startGame: StartGame,
      readThisActive: MainMenu[readthis].active,
      fade,
      result: 0,
      reason: "cancelled",
    };
  }

  if (!SaveGamesAvail[slot]) {
    const fade = !quick && !options.skipFade ? menuFadeOut() : null;
    return {
      quick,
      slot,
      filename,
      screen,
      firstSound: null,
      action: null,
      file: null,
      loaded: null,
      status: null,
      secondSound: null,
      startGame: StartGame,
      readThisActive: MainMenu[readthis].active,
      fade,
      result: 0,
      reason: "slot-unavailable",
    };
  }

  const memory = saveMemoryFromOptions(options);
  if (!memory) {
    const fade = !quick && !options.skipFade ? menuFadeOut() : null;
    return {
      quick,
      slot,
      filename,
      screen,
      firstSound: null,
      action: null,
      file: null,
      loaded: null,
      status: null,
      secondSound: null,
      startGame: StartGame,
      readThisActive: MainMenu[readthis].active,
      fade,
      result: 0,
      reason: "missing-memory",
    };
  }

  const saveFile = readSaveFile(slot);
  if (!saveFile) {
    const fade = !quick && !options.skipFade ? menuFadeOut() : null;
    return {
      quick,
      slot,
      filename,
      screen,
      firstSound: null,
      action: null,
      file: null,
      loaded: null,
      status: null,
      secondSound: null,
      startGame: StartGame,
      readThisActive: MainMenu[readthis].active,
      fade,
      result: 0,
      reason: "missing-file",
    };
  }

  const firstSound = quick ? null : ShootSnd();
  const action = quick || options.skipDraw ? null : DrawLSAction(0, options);
  const loadX = quick ? 0 : LSA_X + 8;
  const loadY = quick ? 0 : LSA_Y + 5;
  const loaded = LoadTheGame(saveFile.image, memory, loadX, loadY);
  const status = quick && options.dgroup && !options.skipStatusRedraw
    ? redrawLoadedGameStatus(options.dgroup, options)
    : null;

  if (!quick) {
    StartGame = 1;
    MainMenu[readthis].active = 1;
  }
  const secondSound = quick ? null : ShootSnd();
  const fade = !quick && !options.skipFade ? menuFadeOut() : null;
  const file: MenuLoadFileSummary = {
    slot: saveFile.slot,
    filename: saveFile.filename,
    headerName: saveFile.headerName,
    fileBytes: saveFile.fileBytes,
    imageBytes: saveFile.imageBytes,
  };

  return {
    quick,
    slot,
    filename,
    screen,
    firstSound,
    action,
    file,
    loaded,
    status,
    secondSound,
    startGame: StartGame,
    readThisActive: MainMenu[readthis].active,
    fade,
    result: 1,
    reason: "loaded",
  };
}

export function CP_NewGame(options: CPNewGameOptions = {}): CPNewGameSummary {
  const drawOptions = menuOnlyPicOptions(options);
  const episodeDraw = options.skipEpisodeDraw ? null : DrawNewEpisode({ ...drawOptions, skipWaitKeyUp: true });
  const episodeSelection = Math.trunc(options.episodeSelection ?? NewEitems.curpos);
  if (episodeSelection < 0) {
    const firstFade = options.skipFade ? null : menuFadeOut();
    return newGameSummary({
      episodeDraw,
      episodeSelection,
      episode: null,
      episodeAllowed: false,
      firstFade,
      cancelled: true,
      cancelReason: "episode",
    });
  }

  const episode = Math.trunc(episodeSelection / 2);
  if (!EpisodeSelect[episode]) {
    return newGameSummary({
      episodeDraw,
      episodeSelection,
      episode,
      episodeAllowed: false,
      cancelled: true,
      cancelReason: "episode-unavailable",
    });
  }

  const episodeSound = ShootSnd();
  let currentGameConfirm: ConfirmSummary | null = null;
  if (options.alreadyInGame ?? ingame) {
    currentGameConfirm = Confirm(CURGAME, options);
    if (!currentGameConfirm.accepted) {
      const firstFade = options.skipFade ? null : menuFadeOut();
      return newGameSummary({
        episodeDraw,
        episodeSelection,
        episode,
        episodeAllowed: true,
        episodeSound,
        currentGameConfirm,
        firstFade,
        cancelled: true,
        cancelReason: "current-game",
      });
    }
  }

  const firstFade = options.skipFade ? null : menuFadeOut();
  const difficultyDraw = options.skipDifficultyDraw ? null : DrawNewGame({ ...drawOptions, skipWaitKeyUp: true });
  const difficultySelection = Math.trunc(options.difficultySelection ?? NewItems.curpos);
  if (difficultySelection < 0) {
    const finalFade = options.skipFade ? null : menuFadeOut();
    return newGameSummary({
      episodeDraw,
      episodeSelection,
      episode,
      episodeAllowed: true,
      episodeSound,
      currentGameConfirm,
      firstFade,
      difficultyDraw,
      difficultySelection,
      finalFade,
      cancelled: true,
      cancelReason: "difficulty",
    });
  }

  const difficultySound = ShootSnd();
  const newGame = options.dgroup ? Main_NewGame(options.dgroup, difficultySelection, episode) : null;
  StartGame = 1;
  const finalFade = options.skipFade ? null : menuFadeOut();
  MainMenu[readthis].active = 1;
  pickquick = 0;

  return newGameSummary({
    episodeDraw,
    episodeSelection,
    episode,
    episodeAllowed: true,
    episodeSound,
    currentGameConfirm,
    firstFade,
    difficultyDraw,
    difficultySelection,
    difficultySound,
    newGame,
    finalFade,
    cancelled: false,
    cancelReason: null,
  });
}

export function CP_Quit(options: CPQuitOptions = {}): CPQuitSummary {
  const selection = selectEndString(options);
  const confirm = Confirm(selection.prompt, options);

  let update: UpdateScreenSummary | null = null;
  let musicOff: SoundModeSummary | null = null;
  let stopSound: SoundModeSummary | null = null;
  let fade: FadeSummary | null = null;
  const adlibWrites: AlRegisterWrite[] = [];
  let quitRequested = false;
  let redraw: DrawMainMenuSummary | null = null;

  if (confirm.accepted) {
    update = VW_UpdateScreen();
    musicOff = SD_MusicOff();
    stopSound = SD_StopSound();
    fade = VL_FadeOut(0, 255, 43, 0, 0, 10);
    for (let i = 1; i <= 0xf5; i++) {
      adlibWrites.push(alOut(i, 0));
    }
    quitRequested = true;
  } else {
    redraw = DrawMainMenu(options);
  }

  return {
    promptIndex: selection.index,
    prompt: selection.prompt,
    rnd: selection.rnd,
    confirm,
    accepted: confirm.accepted,
    update,
    musicOff,
    stopSound,
    fade,
    adlibWrites,
    quitRequested,
    redraw,
  };
}

export function CP_ReadThis(options: CPReadThisOptions = {}): CPReadThisSummary {
  const cornerMusic = options.skipMusic ? null : StartCPMusic(CORNER_MUS, options);
  const helpScreens = options.helpScreens?.() ?? null;
  const menuMusic = options.skipMusic ? null : StartCPMusic(MENUSONG, options);
  return { cornerMusic, helpScreens, menuMusic };
}

export function CP_SaveGame(optionsOrQuick: CPSaveGameOptions | number = {}): CPSaveGameSummary {
  const options: CPSaveGameOptions = typeof optionsOrQuick === "number" ? { quick: !!optionsOrQuick } : optionsOrQuick;
  const quick = !!options.quick;
  const slot = clampSaveSlot(options.slot ?? options.selection ?? LSItems.curpos);
  const filename = saveFilenameForSlot(slot);
  const screen = quick || options.skipDraw ? null : DrawLoadSaveScreen(1, loadSaveDrawOptions(options));

  const cancelled = !quick && (options.selection ?? LSItems.curpos) < 0;
  if (cancelled) {
    const fade = options.skipFade ? null : menuFadeOut();
    return {
      quick,
      slot,
      filename,
      screen,
      overwriteConfirm: null,
      firstSound: null,
      clearedEmptySlot: null,
      inputName: null,
      action: null,
      saved: null,
      file: null,
      secondSound: null,
      fade,
      result: 0,
      reason: "cancelled",
    };
  }

  if (quick && !SaveGamesAvail[slot]) {
    return {
      quick,
      slot,
      filename,
      screen,
      overwriteConfirm: null,
      firstSound: null,
      clearedEmptySlot: null,
      inputName: null,
      action: null,
      saved: null,
      file: null,
      secondSound: null,
      fade: null,
      result: 0,
      reason: "slot-unavailable",
    };
  }

  let overwriteConfirm: ConfirmSummary | null = null;
  if (!quick && SaveGamesAvail[slot] && (options.confirmOverwrite ?? true)) {
    overwriteConfirm = Confirm(GAMESVD, options);
    if (!overwriteConfirm.accepted) {
      return {
        quick,
        slot,
        filename,
        screen,
        overwriteConfirm,
        firstSound: null,
        clearedEmptySlot: null,
        inputName: null,
        action: null,
        saved: null,
        file: null,
        secondSound: null,
        fade: null,
        result: 0,
        reason: "overwrite-rejected",
      };
    }
  }

  const inputName = options.inputName === undefined ? (SaveGameNames[slot] || "") : options.inputName;
  if (inputName === null) {
    const cleared = VWB_Bar(LSM_X + LSItems.indent + 1, LSM_Y + slot * 13 + 1, LSM_W - LSItems.indent - 16, 10, BKGDCOLOR);
    PrintLSEntry(slot, HIGHLIGHT);
    VW_UpdateScreen();
    SD_PlaySound(ESCPRESSEDSND);
    return {
      quick,
      slot,
      filename,
      screen,
      overwriteConfirm,
      firstSound: null,
      clearedEmptySlot: cleared,
      inputName,
      action: null,
      saved: null,
      file: null,
      secondSound: null,
      fade: null,
      result: 0,
      reason: "cancelled",
    };
  }

  const memory = saveMemoryFromOptions(options);
  if (!memory) {
    const fade = !quick && !options.skipFade ? menuFadeOut() : null;
    return {
      quick,
      slot,
      filename,
      screen,
      overwriteConfirm,
      firstSound: null,
      clearedEmptySlot: null,
      inputName,
      action: null,
      saved: null,
      file: null,
      secondSound: null,
      fade,
      result: 0,
      reason: "missing-memory",
    };
  }

  const firstSound = quick ? null : ShootSnd();
  const clearedEmptySlot = !quick && !SaveGamesAvail[slot]
    ? VWB_Bar(LSM_X + LSItems.indent + 1, LSM_Y + slot * 13 + 1, LSM_W - LSItems.indent - 16, 10, BKGDCOLOR)
    : null;
  if (!quick) {
    VW_UpdateScreen();
  }

  SaveGamesAvail[slot] = 1;
  SaveGameNames[slot] = inputName;

  const action = quick || options.skipDraw ? null : DrawLSAction(1, options);
  const saveX = quick ? 0 : LSA_X + 8;
  const saveY = quick ? 0 : LSA_Y + 5;
  const saved = SaveTheGame(memory, saveX, saveY);
  const bytes = composeSaveFile(inputName, saved.bytes);
  const virtualFile = CA_SetVirtualFile(filename, bytes);
  const file: MenuSaveFileSummary = {
    slot,
    filename,
    headerName: inputName.slice(0, 31),
    headerBytes: 32,
    imageBytes: saved.bytes.length,
    totalBytes: bytes.length,
    checksum: saved.checksum,
    virtualFile,
  };
  const secondSound = quick ? null : ShootSnd();
  const fade = !quick && !options.skipFade ? menuFadeOut() : null;

  return {
    quick,
    slot,
    filename,
    screen,
    overwriteConfirm,
    firstSound,
    clearedEmptySlot,
    inputName,
    action,
    saved,
    file,
    secondSound,
    fade,
    result: 1,
    reason: "saved",
  };
}

export function CP_Sound(options: CPSoundOptions = {}): CPSoundSummary {
  const initial = DrawSoundMenu(options);
  const initialWait = WaitKeyUp(options);
  const actions: CPSoundActionSummary[] = [];
  let exitSelection = -1;

  for (const rawSelection of options.selections ?? []) {
    const which = Math.trunc(rawSelection);
    if (which < 0) {
      exitSelection = which;
      break;
    }

    let changed = false;
    let waitSoundDone: boolean | null = null;
    let setSoundMode: boolean | null = null;
    let setDigiDevice: SoundModeSummary | null = null;
    let setMusicMode: boolean | null = null;
    let loadedSounds: CacheManagerSummary | null = null;
    let redraw: DrawSoundMenuSummary | null = null;
    let shootSound: boolean | null = null;
    let music: StartCPMusicSummary | null = null;

    switch (which) {
      case 0:
        if (SoundMode !== sdm_Off) {
          waitSoundDone = SD_WaitSoundDone(options.waitSoundDoneMaxPolls ?? 0);
          setSoundMode = SD_SetSoundMode(sdm_Off);
          redraw = DrawSoundMenu(options);
          changed = true;
        }
        break;

      case 1:
        if (SoundMode !== sdm_PC) {
          waitSoundDone = SD_WaitSoundDone(options.waitSoundDoneMaxPolls ?? 0);
          setSoundMode = SD_SetSoundMode(sdm_PC);
          if (!options.skipLoadAllSounds) {
            loadedSounds = CA_LoadAllSounds(options.AUDIOHED, options.AUDIOT);
          }
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          changed = true;
        }
        break;

      case 2:
        if (SoundMode !== sdm_AdLib) {
          waitSoundDone = SD_WaitSoundDone(options.waitSoundDoneMaxPolls ?? 0);
          setSoundMode = SD_SetSoundMode(sdm_AdLib);
          if (!options.skipLoadAllSounds) {
            loadedSounds = CA_LoadAllSounds(options.AUDIOHED, options.AUDIOT);
          }
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          changed = true;
        }
        break;

      case 5:
        if (DigiMode !== sds_Off) {
          setDigiDevice = SD_SetDigiDevice(sds_Off);
          redraw = DrawSoundMenu(options);
          changed = true;
        }
        break;

      case 6:
        if (DigiMode !== sds_SoundSource) {
          setDigiDevice = SD_SetDigiDevice(sds_SoundSource);
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          changed = true;
        }
        break;

      case 7:
        if (DigiMode !== sds_SoundBlaster) {
          setDigiDevice = SD_SetDigiDevice(sds_SoundBlaster);
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          changed = true;
        }
        break;

      case 10:
        if (MusicMode !== smm_Off) {
          setMusicMode = SD_SetMusicMode(smm_Off);
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          changed = true;
        }
        break;

      case 11:
        if (MusicMode !== smm_AdLib) {
          setMusicMode = SD_SetMusicMode(smm_AdLib);
          redraw = DrawSoundMenu(options);
          shootSound = ShootSnd();
          music = StartCPMusic(MENUSONG, options);
          changed = true;
        }
        break;

      default:
        break;
    }

    actions.push({ which, changed, waitSoundDone, setSoundMode, setDigiDevice, setMusicMode, loadedSounds, redraw, shootSound, music });
  }

  return { initial, initialWait, actions, exitSelection, fade: null };
}

export function CP_ViewScores(optionsOrTemp: CPViewScoresOptions | number = {}): CPViewScoresSummary {
  const options = typeof optionsOrTemp === "number" ? {} : optionsOrTemp;
  const font0 = VW_SetFontState({ fontnumber: 0 });
  const scoreMusic = options.skipMusic ? null : StartCPMusic(ROSTER_MUS, options);
  const drawHighScores = options.drawHighScores?.() ?? null;
  const update = VW_UpdateScreen();
  const fadeIn = options.skipFade ? null : menuFadeIn(options.palette);
  const font1 = VW_SetFontState({ fontnumber: 1 });
  const ack = IN_Ack(options.ackMaxPolls ?? 1, options.ackPollHook ?? null);
  const menuMusic = options.skipMusic ? null : StartCPMusic(MENUSONG, options);
  const fadeOut = options.skipFade ? null : menuFadeOut();
  return { font0, scoreMusic, drawHighScores, update, fadeIn, font1, ack, menuMusic, fadeOut };
}

export function CustomControls(options: CustomControlsOptions = {}): CustomControlsSummary {
  const initial = DrawCustomScreen(options);
  const actions: CustomControlsActionSummary[] = [];
  let exitSelection = -1;

  for (const rawSelection of options.selections ?? []) {
    const which = Math.trunc(rawSelection);
    if (which < 0) {
      exitSelection = which;
      break;
    }

    let define: DefineControlSummary | null = null;
    let redraw: DrawCustSummary | null = null;
    switch (which) {
      case 0:
        define = DefineMouseBtns(options.defineOptions?.mouse);
        redraw = DrawCustMouse(1);
        break;
      case 3:
        define = DefineJoyBtns(options.defineOptions?.joy);
        redraw = DrawCustJoy(0);
        break;
      case 6:
        define = DefineKeyBtns(options.defineOptions?.keybd);
        redraw = DrawCustKeybd(0);
        break;
      case 8:
        define = DefineKeyMove(options.defineOptions?.keys);
        redraw = DrawCustKeys(0);
        break;
      default:
        break;
    }
    actions.push({ which, define, redraw });
  }

  return { initial, actions, exitSelection, fade: null };
}

export function DefineJoyBtns(options: EnterCtrlDataOptions = {}): DefineControlSummary {
  const joyallowed = { allowed: [1, 1, 1, 1] };
  return {
    index: 5,
    type: JOYSTICK,
    allowed: joyallowed.allowed,
    enter: EnterCtrlData(5, joyallowed, DrawCustJoy, PrintCustJoy, JOYSTICK, options),
  };
}

export function DefineKeyBtns(options: EnterCtrlDataOptions = {}): DefineControlSummary {
  const keyallowed = { allowed: [1, 1, 1, 1] };
  return {
    index: 8,
    type: KEYBOARDBTNS,
    allowed: keyallowed.allowed,
    enter: EnterCtrlData(8, keyallowed, DrawCustKeybd, PrintCustKeybd, KEYBOARDBTNS, options),
  };
}

export function DefineKeyMove(options: EnterCtrlDataOptions = {}): DefineControlSummary {
  const keyallowed = { allowed: [1, 1, 1, 1] };
  return {
    index: 10,
    type: KEYBOARDMOVE,
    allowed: keyallowed.allowed,
    enter: EnterCtrlData(10, keyallowed, DrawCustKeys, PrintCustKeys, KEYBOARDMOVE, options),
  };
}

export function DefineMouseBtns(options: EnterCtrlDataOptions = {}): DefineControlSummary {
  const mouseallowed = { allowed: [0, 1, 1, 1] };
  return {
    index: 2,
    type: MOUSE,
    allowed: mouseallowed.allowed,
    enter: EnterCtrlData(2, mouseallowed, DrawCustMouse, PrintCustMouse, MOUSE, options),
  };
}

export function DrawChangeView(view: number): DrawChangeViewSummary {
  const selected = Math.trunc(view);
  const bar = VWB_Bar(0, 160, 320, 40, VIEWCOLOR);
  const preview = ShowViewSize(selected);
  const currentWindow = US_SaveWindow();
  const printWindow = US_RestoreWindow({
    ...currentWindow,
    x: 0,
    y: 320,
    w: currentWindow.w || 320,
    py: 161,
  });
  const color = VW_SetFontState({ fontcolor: HIGHLIGHT, backcolor: BKGDCOLOR });
  const size1 = US_CPrint(`${STR_SIZE1}\n`);
  const size2 = US_CPrint(`${STR_SIZE2}\n`);
  const size3 = US_CPrint(STR_SIZE3);
  const update = VW_UpdateScreen();
  return { view: selected, bar, preview, printWindow, color, size1, size2, size3, update, fade: null, finalWindow: US_SaveWindow() };
}

export function DrawCtlScreen(options: MenuPicOptions = {}): DrawCtlScreenSummary {
  const background = ClearMScreen();
  const stripes = DrawStripes(10);
  const controlPic = VWB_DrawPic(80, 0, C_CONTROLPIC, menuPicOptions(C_CONTROLPIC, options));
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const window = DrawWindow(CTL_X - 8, CTL_Y - 5, CTL_W, CTL_H, BKGDCOLOR);
  const color = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });

  if (JoysPresent[0]) {
    CtlMenu[1].active = 1;
    CtlMenu[2].active = 1;
    CtlMenu[3].active = 1;
  }

  CtlMenu[2].active = joystickenabled ? 1 : 0;
  CtlMenu[3].active = joystickenabled ? 1 : 0;

  if (MousePresent) {
    CtlMenu[4].active = 1;
    CtlMenu[0].active = 1;
  }

  CtlMenu[4].active = mouseenabled ? 1 : 0;

  const menu = DrawMenu(CtlItems, CtlMenu);
  const x = CTL_X + CtlItems.indent - 24;
  const buttons: DrawControlMenuButtonSummary[] = [];
  const selected = [mouseenabled, joystickenabled, !!joystickport, joypadenabled] as const;
  for (let i = 0; i < selected.length; i++) {
    const on = selected[i] ? 1 : 0;
    const picnum = on ? C_SELECTEDPIC : C_NOTSELECTEDPIC;
    buttons.push({
      index: i,
      on,
      picnum,
      draw: VWB_DrawPic(x, CTL_Y + 3 + i * 13, picnum, menuPicOptions(picnum, options)),
    });
  }

  let pickedCurpos: number | null = null;
  if (CtlItems.curpos < 0 || !CtlMenu[CtlItems.curpos]?.active) {
    for (let i = 0; i < 6; i++) {
      if (CtlMenu[i]?.active) {
        CtlItems.curpos = i;
        pickedCurpos = i;
        break;
      }
    }
  }

  const gun = DrawMenuGun(CtlItems, options);
  const update = VW_UpdateScreen();
  return { background, stripes, controlPic, mouseBack, window, color, menu, buttons, pickedCurpos, gun, update, finalWindow: US_SaveWindow() };
}

export function DrawCustJoy(hilight: number): DrawCustSummary {
  return drawCustButtonRow("joy", Math.trunc(hilight), 3, joystickenabled, CST_Y + 13 * 5, PrintCustJoy);
}

export function DrawCustKeybd(hilight: number): DrawCustSummary {
  return drawCustButtonRow("keybd", Math.trunc(hilight), null, null, CST_Y + 13 * 8, PrintCustKeybd);
}

export function DrawCustKeys(hilight: number): DrawCustSummary {
  return drawCustButtonRow("keys", Math.trunc(hilight), null, null, CST_Y + 13 * 10, PrintCustKeys);
}

export function DrawCustMouse(hilight: number): DrawCustSummary {
  return drawCustButtonRow("mouse", Math.trunc(hilight), 0, mouseenabled, CST_Y + 13 * 2, PrintCustMouse);
}

export function DrawCustomScreen(options: MenuPicOptions = {}): DrawCustomScreenSummary {
  const background = ClearMScreen();
  const initialWindow = US_RestoreWindow({ ...US_SaveWindow(), x: 0, w: 320, px: 0 });
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const stripes = DrawStripes(10);
  const title = VWB_DrawPic(80, 0, C_CUSTOMIZEPIC, menuPicOptions(C_CUSTOMIZEPIC, options));

  const mouseHeadingColor = VW_SetFontState({ fontcolor: READCOLOR, backcolor: BKGDCOLOR });
  US_RestoreWindow({ ...US_SaveWindow(), x: 0, w: 320, px: 0, py: CST_Y });
  const mouseHeading = US_CPrint("Mouse\n");
  const mouseLabelColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const mouseLabels = printCustomActionLabels(STR_CRUN, STR_COPEN, STR_CFIRE, `${STR_CSTRAFE}\n`);
  const mouseRowWindow = DrawWindow(5, US_SaveWindow().py - 1, 310, 13, BKGDCOLOR);
  const mouseRow = DrawCustMouse(0);
  const mouseNewline = US_Print("\n");

  const joystickHeadingColor = VW_SetFontState({ fontcolor: READCOLOR, backcolor: BKGDCOLOR });
  const joystickHeading = US_CPrint("Joystick/Gravis GamePad\n");
  const joystickLabelColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const joystickLabels = printCustomActionLabels(STR_CRUN, STR_COPEN, STR_CFIRE, `${STR_CSTRAFE}\n`);
  const joystickRowWindow = DrawWindow(5, US_SaveWindow().py - 1, 310, 13, BKGDCOLOR);
  const joystickRow = DrawCustJoy(0);
  const joystickNewline = US_Print("\n");

  const keyboardHeadingColor = VW_SetFontState({ fontcolor: READCOLOR, backcolor: BKGDCOLOR });
  const keyboardHeading = US_CPrint("Keyboard\n");
  const keyboardLabelColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const keyboardLabels = printCustomActionLabels(STR_CRUN, STR_COPEN, STR_CFIRE, `${STR_CSTRAFE}\n`);
  const keyboardRowWindow = DrawWindow(5, US_SaveWindow().py - 1, 310, 13, BKGDCOLOR);
  const keyboardRow = DrawCustKeybd(0);
  const keyboardNewline = US_Print("\n");

  const keyboardMoveLabelColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const keyboardMoveLabels = printCustomActionLabels(STR_LEFT, STR_RIGHT, STR_FRWD, `${STR_BKWD}\n`);
  const keyboardMoveRowWindow = DrawWindow(5, US_SaveWindow().py - 1, 310, 13, BKGDCOLOR);
  const keyboardMoveRow = DrawCustKeys(0);
  const keyboardMoveNewline = US_Print("\n");

  let pickedCurpos: number | null = null;
  if (CusItems.curpos < 0) {
    for (let i = 0; i < CusItems.amount; i++) {
      if (CusMenu[i]?.active) {
        CusItems.curpos = i;
        pickedCurpos = i;
        break;
      }
    }
  }

  const update = VW_UpdateScreen();
  return {
    background,
    initialWindow,
    mouseBack,
    stripes,
    title,
    mouse: {
      headingColor: mouseHeadingColor,
      heading: mouseHeading,
      labelColor: mouseLabelColor,
      labels: mouseLabels,
      rowWindow: mouseRowWindow,
      row: mouseRow,
      newline: mouseNewline,
    },
    joystick: {
      headingColor: joystickHeadingColor,
      heading: joystickHeading,
      labelColor: joystickLabelColor,
      labels: joystickLabels,
      rowWindow: joystickRowWindow,
      row: joystickRow,
      newline: joystickNewline,
    },
    keyboardButtons: {
      headingColor: keyboardHeadingColor,
      heading: keyboardHeading,
      labelColor: keyboardLabelColor,
      labels: keyboardLabels,
      rowWindow: keyboardRowWindow,
      row: keyboardRow,
      newline: keyboardNewline,
    },
    keyboardMove: {
      headingColor: null,
      heading: null,
      labelColor: keyboardMoveLabelColor,
      labels: keyboardMoveLabels,
      rowWindow: keyboardMoveRowWindow,
      row: keyboardMoveRow,
      newline: keyboardMoveNewline,
    },
    pickedCurpos,
    update,
    fade: null,
    finalWindow: US_SaveWindow(),
  };
}

export function DrawGun(
  item_i: CP_iteminfo,
  items: readonly CP_itemtype[],
  x: number,
  y: IntRef,
  which: number,
  basey: number,
  routine: ((w: number) => void) | null = null,
  options: MenuPicOptions = {},
): DrawGunSummary {
  const item = menuItemAt(items, which);
  const oldY = Math.trunc(y.value);
  const erase = VWB_Bar(Math.trunc(x) - 1, oldY, 25, 16, BKGDCOLOR);
  y.value = Math.trunc(basey + Math.trunc(which) * 13);
  const draw = VWB_DrawPic(Math.trunc(x), y.value, C_CURSOR1PIC, menuPicOptions(C_CURSOR1PIC, options));
  const textColor = SetTextColor(item, 1);
  setMenuPrintPosition(item_i, which);
  const print = US_Print(item.string);
  const routineCalled = !!routine;
  if (routine) {
    routine(Math.trunc(which));
  }
  const update = VW_UpdateScreen();
  const soundPlayed = SD_PlaySound(MOVEGUN2SND);
  return {
    x: Math.trunc(x),
    oldY,
    newY: y.value,
    which: Math.trunc(which),
    erase,
    draw,
    textColor,
    print,
    routineCalled,
    update,
    soundPlayed,
    finalWindow: US_SaveWindow(),
  };
}

export function DrawHalfStep(x: number, y: number, options: MenuPicOptions = {}): DrawHalfStepSummary {
  const draw = VWB_DrawPic(x, y, C_CURSOR1PIC, menuPicOptions(C_CURSOR1PIC, options));
  const update = VW_UpdateScreen();
  const soundPlayed = SD_PlaySound(MOVEGUN1SND);
  SD_SetTimeCount(0);

  let timerServices = 0;
  const maxTimerServices = options.maxTimerServices ?? 256;
  while (TimeCount < 8) {
    if (timerServices >= maxTimerServices) {
      throw new Error("DrawHalfStep: timer did not advance to 8 tics");
    }
    SDL_t0Service();
    timerServices++;
  }

  return { x, y, draw, update, soundPlayed, waitedTics: TimeCount, timerServices };
}

export function DrawLoadSaveScreen(loadsave: number, options: DrawLoadSaveScreenOptions = {}): DrawLoadSaveScreenSummary {
  const selected = Math.trunc(loadsave);
  const background = ClearMScreen();
  const fontState = VW_SetFontState({ fontnumber: 1 });
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const window = DrawWindow(LSM_X - 10, LSM_Y - 5, LSM_W, LSM_H, BKGDCOLOR);
  const stripes = DrawStripes(10);
  const titlePic = selected ? C_SAVEGAMEPIC : C_LOADGAMEPIC;
  const title = VWB_DrawPic(60, 0, titlePic, menuPicOptions(titlePic, options));
  const entries: PrintLSEntrySummary[] = [];
  for (let i = 0; i < 10; i++) {
    entries.push(PrintLSEntry(i, TEXTCOLOR));
  }
  const menu = DrawMenu(LSItems, LSMenu);
  const update = VW_UpdateScreen();
  const wait = options.skipWaitKeyUp ? null : WaitKeyUp(options);
  return { loadsave: selected, background, fontState, mouseBack, window, stripes, titlePic, title, entries, menu, update, fade: null, wait };
}

export function DrawLSAction(which: number, options: MenuPicOptions = {}): DrawLSActionSummary {
  const selected = Math.trunc(which);
  const window = DrawWindow(LSA_X, LSA_Y, LSA_W, LSA_H, TEXTCOLOR);
  const outline = DrawOutline(LSA_X, LSA_Y, LSA_W, LSA_H, 0, HIGHLIGHT);
  const disk = VWB_DrawPic(LSA_X + 8, LSA_Y + 5, C_DISKLOADING1PIC, menuPicOptions(C_DISKLOADING1PIC, options));
  const fontState = VW_SetFontState({ fontnumber: 1 });
  const positionedWindow = US_RestoreWindow({ ...US_SaveWindow(), px: LSA_X + 46, py: LSA_Y + 13 });
  const color = VW_SetFontState({ fontcolor: 0, backcolor: TEXTCOLOR });
  const print = US_Print(selected ? "Saving..." : "Loading...");
  const update = VW_UpdateScreen();
  return { which: selected, window, outline, disk, fontState, positionedWindow, color, print, update, finalWindow: US_SaveWindow() };
}

export function DrawMainMenu(options: MenuPicOptions = {}): DrawMainMenuSummary {
  const background = ClearMScreen();
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const stripes = DrawStripes(10);
  const optionsPic = VWB_DrawPic(84, 0, C_OPTIONSPIC, menuPicOptions(C_OPTIONSPIC, options));
  const window = DrawWindow(MENU_X - 8, MENU_Y - 3, MENU_W, MENU_H, BKGDCOLOR);
  const menuInGame = options.inGame ?? ingame;

  if (menuInGame) {
    MainMenu[8].string = `${MainMenu[8].string.slice(0, 8)}${STR_GAME}`;
    MainMenu[8].active = 2;
  } else {
    MainMenu[8].string = `${MainMenu[8].string.slice(0, 8)}${STR_DEMO}`;
    MainMenu[8].active = 1;
  }

  const menu = DrawMenu(MainItems, MainMenu);
  const update = VW_UpdateScreen();
  return {
    background,
    mouseBack,
    stripes,
    optionsPic,
    window,
    ingame: menuInGame,
    backtodemoString: MainMenu[8].string,
    backtodemoActive: MainMenu[8].active,
    menu,
    update,
  };
}

export function DrawMenu(item_i: CP_iteminfo, items: readonly CP_itemtype[]): DrawMenuSummary {
  const which = Math.trunc(item_i.curpos);
  const itemCount = Math.trunc(item_i.amount);
  const windowX = Math.trunc(item_i.x + item_i.indent);
  const windowY = Math.trunc(item_i.y);
  const window = US_RestoreWindow({ x: windowX, y: windowY, w: 320, h: 200, px: windowX, py: windowY });
  const rows: DrawMenuItemSummary[] = [];

  for (let i = 0; i < itemCount; i++) {
    const item = items[i];
    if (!item) {
      throw new RangeError(`DrawMenu: missing menu item ${i}`);
    }

    const highlighted = which === i;
    const textColor = SetTextColor(item, highlighted ? 1 : 0);
    US_RestoreWindow({
      x: windowX,
      y: windowY,
      w: 320,
      h: 200,
      px: windowX,
      py: Math.trunc(item_i.y + i * 13),
    });

    let disabledColor: FontStateSummary | null = null;
    let restoreColor: FontStateSummary | null = null;
    if (item.active) {
      const print = US_Print(item.string);
      const newline = US_Print("\n");
      rows.push({ index: i, active: Math.trunc(item.active), highlighted, textColor, disabledColor, print, newline, restoreColor });
    } else {
      disabledColor = VW_SetFontState({ fontcolor: DEACTIVE, backcolor: BKGDCOLOR });
      const print = US_Print(item.string);
      restoreColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
      const newline = US_Print("\n");
      rows.push({ index: i, active: Math.trunc(item.active), highlighted, textColor, disabledColor, print, newline, restoreColor });
    }
  }

  return {
    iteminfo: { x: Math.trunc(item_i.x), y: Math.trunc(item_i.y), amount: itemCount, curpos: which, indent: Math.trunc(item_i.indent) },
    window,
    rows,
    finalFont: VW_SetFontState(),
    finalWindow: US_SaveWindow(),
  };
}

export function DrawMenuGun(iteminfo: CP_iteminfo, options: MenuPicOptions = {}): DrawMenuGunSummary {
  const x = Math.trunc(iteminfo.x);
  const y = Math.trunc(iteminfo.y + Math.trunc(iteminfo.curpos) * 13 - 2);
  return { x, y, draw: VWB_DrawPic(x, y, C_CURSOR1PIC, menuPicOptions(C_CURSOR1PIC, options)) };
}

export function DrawMouseSens(options: MenuPicOptions = {}): DrawMouseSensSummary {
  const background = ClearMScreen();
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const window = DrawWindow(10, 80, 300, 30, BKGDCOLOR);
  const centerWindow = US_RestoreWindow({ ...US_SaveWindow(), x: 0, w: 320, px: 0, py: 82 });
  const headingColor = VW_SetFontState({ fontcolor: READCOLOR, backcolor: BKGDCOLOR });
  const heading = US_CPrint(STR_MOUSEADJ);
  const labelColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const slowPosition = US_RestoreWindow({ ...US_SaveWindow(), px: 14, py: 95 });
  const slow = US_Print(STR_SLOW);
  const fastPosition = US_RestoreWindow({ ...US_SaveWindow(), px: 269, py: 95 });
  const fast = US_Print(STR_FAST);
  const adjustment = Math.trunc(mouseadjustment);
  const bar = VWB_Bar(60, 97, 200, 10, TEXTCOLOR);
  const barOutline = DrawOutline(60, 97, 200, 10, 0, HIGHLIGHT);
  const knobOutline = DrawOutline(60 + 20 * adjustment, 97, 20, 10, 0, READCOLOR);
  const knob = VWB_Bar(61 + 20 * adjustment, 98, 19, 9, READHCOLOR);
  const update = VW_UpdateScreen();
  return {
    background,
    mouseBack,
    window,
    centerWindow,
    headingColor,
    heading,
    labelColor,
    slowPosition,
    slow,
    fastPosition,
    fast,
    mouseadjustment: adjustment,
    bar,
    barOutline,
    knobOutline,
    knob,
    update,
    fade: null,
    finalWindow: US_SaveWindow(),
  };
}

export function DrawNewEpisode(options: DrawNewEpisodeOptions = {}): DrawNewEpisodeSummary {
  const background = ClearMScreen();
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const window = DrawWindow(NE_X - 4, NE_Y - 4, NE_W + 8, NE_H + 8, BKGDCOLOR);
  const headingColor = VW_SetFontState({ fontcolor: READHCOLOR, backcolor: BKGDCOLOR });
  const headingWindow = US_RestoreWindow({ ...US_SaveWindow(), x: 0, w: 320, px: 0, py: 2 });
  const heading = US_CPrint("Which episode to play?");
  const menuColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
  const menu = DrawMenu(NewEitems, NewEmenu);
  const episodePics: BufferedPicDrawSummary[] = [];
  for (let i = 0; i < 6; i++) {
    const picnum = C_EPISODE1PIC + i;
    episodePics.push(VWB_DrawPic(NE_X + 32, NE_Y + i * 26, picnum, menuPicOptions(picnum, options)));
  }
  const update = VW_UpdateScreen();
  const wait = options.skipWaitKeyUp ? null : WaitKeyUp(options);
  return { background, mouseBack, window, headingWindow, headingColor, heading, menuColor, menu, episodePics, update, fade: null, wait, finalWindow: US_SaveWindow() };
}

export function DrawNewGame(options: DrawNewGameOptions = {}): DrawNewGameSummary {
  const background = ClearMScreen();
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const headingColor = VW_SetFontState({ fontcolor: READHCOLOR, backcolor: BKGDCOLOR });
  const headingPosition = US_RestoreWindow({ ...US_SaveWindow(), px: NM_X + 20, py: NM_Y - 32 });
  const heading = US_Print("How tough are you?");
  const window = DrawWindow(NM_X - 5, NM_Y - 10, NM_W, NM_H, BKGDCOLOR);
  const menu = DrawMenu(NewItems, NewMenu);
  const difficulty = DrawNewGameDiff(NewItems.curpos, options);
  const update = VW_UpdateScreen();
  const wait = options.skipWaitKeyUp ? null : WaitKeyUp(options);
  return { background, mouseBack, headingColor, headingPosition, heading, window, menu, difficulty, update, fade: null, wait };
}

export function DrawNewGameDiff(w: number, options: MenuPicOptions = {}): DrawNewGameDiffSummary {
  const selected = Math.trunc(w);
  const picnum = selected + C_BABYMODEPIC;
  return {
    w: selected,
    picnum,
    draw: VWB_DrawPic(NM_X + 185, NM_Y + 7, picnum, menuPicOptions(picnum, options)),
  };
}

export function DrawOutline(x: number, y: number, w: number, h: number, color1: number, color2: number): MenuOutlineSummary {
  return {
    x,
    y,
    w,
    h,
    color1: color1 & 0xff,
    color2: color2 & 0xff,
    top: VWB_Hlin(x, x + w, y, color2),
    left: VWB_Vlin(y, y + h, x, color2),
    bottom: VWB_Hlin(x, x + w, y + h, color1),
    right: VWB_Vlin(y, y + h, x + w, color1),
  };
}

export function DrawSoundMenu(options: MenuPicOptions = {}): DrawSoundMenuSummary {
  const background = ClearMScreen();
  const mouseBack = VWB_DrawPic(112, 184, C_MOUSELBACKPIC, menuPicOptions(C_MOUSELBACKPIC, options));
  const windows = [
    DrawWindow(SM_X - 8, SM_Y1 - 3, SM_W, SM_H1, BKGDCOLOR),
    DrawWindow(SM_X - 8, SM_Y2 - 3, SM_W, SM_H2, BKGDCOLOR),
    DrawWindow(SM_X - 8, SM_Y3 - 3, SM_W, SM_H3, BKGDCOLOR),
  ] as const;

  if (!AdLibPresent && !SoundBlasterPresent) {
    SndMenu[2].active = 0;
    SndMenu[10].active = 0;
    SndMenu[11].active = 0;
  }

  if (!SoundSourcePresent) {
    SndMenu[6].active = 0;
  }

  if (!SoundBlasterPresent) {
    SndMenu[7].active = 0;
  }

  if (!SoundSourcePresent && !SoundBlasterPresent) {
    SndMenu[5].active = 0;
  }

  const menu = DrawMenu(SndItems, SndMenu);
  const titles = [
    VWB_DrawPic(100, SM_Y1 - 20, C_FXTITLEPIC, menuPicOptions(C_FXTITLEPIC, options)),
    VWB_DrawPic(100, SM_Y2 - 20, C_DIGITITLEPIC, menuPicOptions(C_DIGITITLEPIC, options)),
    VWB_DrawPic(100, SM_Y3 - 20, C_MUSICTITLEPIC, menuPicOptions(C_MUSICTITLEPIC, options)),
  ] as const;
  const buttons: DrawSoundMenuButtonSummary[] = [];

  for (let i = 0; i < SndItems.amount; i++) {
    if (SndMenu[i]?.string[0]) {
      let on = 0;
      switch (i) {
        case 0:
          if (SoundMode === sdm_Off) on = 1;
          break;
        case 1:
          if (SoundMode === sdm_PC) on = 1;
          break;
        case 2:
          if (SoundMode === sdm_AdLib) on = 1;
          break;
        case 5:
          if (DigiMode === sds_Off) on = 1;
          break;
        case 6:
          if (DigiMode === sds_SoundSource) on = 1;
          break;
        case 7:
          if (DigiMode === sds_SoundBlaster) on = 1;
          break;
        case 10:
          if (MusicMode === smm_Off) on = 1;
          break;
        case 11:
          if (MusicMode === smm_AdLib) on = 1;
          break;
      }

      const picnum = on ? C_SELECTEDPIC : C_NOTSELECTEDPIC;
      buttons.push({
        index: i,
        on,
        picnum,
        draw: VWB_DrawPic(SM_X + 24, SM_Y1 + i * 13 + 2, picnum, menuPicOptions(picnum, options)),
      });
    }
  }

  const gun = DrawMenuGun(SndItems, options);
  const update = VW_UpdateScreen();
  return { background, mouseBack, windows, menu, titles, buttons, gun, update, finalWindow: US_SaveWindow() };
}

export function DrawStripes(y: number): StripeSummary {
  return {
    y,
    background: VWB_Bar(0, y, 320, 24, 0),
    stripe: VWB_Hlin(0, 319, y + 22, STRIPE),
  };
}

export function DrawWindow(x: number, y: number, w: number, h: number, wcolor: number): MenuWindowSummary {
  return {
    x,
    y,
    w,
    h,
    wcolor: wcolor & 0xff,
    fill: VWB_Bar(x, y, w, h, wcolor),
    outline: DrawOutline(x, y, w, h, BORD2COLOR, DEACTIVE),
  };
}

export function EnterCtrlData(
  index: number,
  cust: CustomCtrls,
  DrawRtn: (hilight: number) => DrawCustSummary,
  PrintRtn: (i: number) => PrintCustSummary,
  type: CustomControlType,
  options: EnterCtrlDataOptions = {},
): EnterCtrlDataSummary {
  const selectedIndex = Math.trunc(index);
  const allowed = Array.from({ length: 4 }, (_unused, i) => (cust.allowed[i] ? 1 : 0));
  const initialSound = ShootSnd();
  const printY = CST_Y + 13 * selectedIndex;
  US_RestoreWindow({ ...US_SaveWindow(), py: printY });
  const initialClear = IN_ClearKeysDown();
  let exit = 0;
  let redraw = 1;
  let which = -1;

  for (let j = 0; j < 4; j++) {
    if (allowed[j]) {
      which = j;
      break;
    }
  }
  if (which < 0) {
    throw new Error("EnterCtrlData: no allowed control slots");
  }
  const initialWhich = which;

  const redraws: EnterCtrlDataRedrawSummary[] = [];
  const picks: EnterCtrlDataPickSummary[] = [];
  const moves: EnterCtrlDataMoveSummary[] = [];
  const maxPolls = options.maxPolls ?? 256;
  let polls = 0;
  let control = newMenuControlInfo();

  while (!exit) {
    if (redraw) {
      const x = CST_START + CST_SPC * which;
      const clearWindow = DrawWindow(5, printY - 1, 310, 13, BKGDCOLOR);
      const draw = DrawRtn(1);
      const selectWindow = DrawWindow(x - 2, printY, CST_SPC, 11, TEXTCOLOR);
      const outline = DrawOutline(x - 2, printY, CST_SPC, 11, 0, HIGHLIGHT);
      const selectColor = VW_SetFontState({ fontcolor: 0, backcolor: TEXTCOLOR });
      const print = PrintRtn(which);
      US_RestoreWindow({ ...US_SaveWindow(), px: x });
      const restoreColor = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
      const update = VW_UpdateScreen();
      const wait = waitEnterCtrlDataRelease(options, "redraw-release", selectedIndex, which, type, exit, 0);
      redraws.push({ which, x, clearWindow, draw, selectWindow, outline, selectColor, print, restoreColor, update, wait });
      redraw = 0;
    }

    options.pollHook?.({ phase: "loop", poll: polls, index: selectedIndex, which, type, exit, picked: 0, control });
    const read = ReadAnyControl(control, options);
    control = read.control;
    polls++;

    if (type === MOUSE || type === JOYSTICK) {
      if (IN_KeyDown(sc_Enter) || IN_KeyDown(sc_Control) || IN_KeyDown(sc_Alt)) {
        IN_ClearKeysDown();
        control.button0 = false;
        control.button1 = false;
      }
    }

    if (
      control.button0 ||
      control.button1 ||
      control.button2 ||
      control.button3 ||
      ((type === KEYBOARDBTNS || type === KEYBOARDMOVE) && LastScan === sc_Enter)
    ) {
      const pick = pickEnterCtrlData(selectedIndex, which, type, control, options);
      picks.push(pick);
      VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR });
      redraw = 1;
      waitEnterCtrlDataRelease(options, "post-pick-release", selectedIndex, which, type, exit, 1);
      continue;
    }

    if (control.button1 || IN_KeyDown(sc_Escape)) {
      exit = 1;
    }

    switch (control.dir) {
      case dir_West:
        do {
          which--;
          if (which < 0) {
            which = 3;
          }
        } while (!allowed[which]);
        redraw = 1;
        moves.push(waitEnterCtrlDataDirectionRelease("west", selectedIndex, which, type, options));
        break;

      case dir_East:
        do {
          which++;
          if (which > 3) {
            which = 0;
          }
        } while (!allowed[which]);
        redraw = 1;
        moves.push(waitEnterCtrlDataDirectionRelease("east", selectedIndex, which, type, options));
        break;

      case dir_North:
      case dir_South:
        exit = 1;
        break;
    }

    if (polls >= maxPolls && !exit) {
      throw new Error("EnterCtrlData: no exit response before maxPolls");
    }
  }

  const finalSound = SD_PlaySound(ESCPRESSEDSND);
  const finalWait = waitEnterCtrlDataRelease(options, "final-release", selectedIndex, which, type, exit, 0);
  const finalClearWindow = DrawWindow(5, printY - 1, 310, 13, BKGDCOLOR);
  return {
    index: selectedIndex,
    type,
    allowed,
    initialSound,
    printY,
    initialClear,
    initialWhich,
    redraws,
    picks,
    moves,
    exit,
    finalSound,
    finalWait,
    finalClearWindow,
    finalBindings: controlBindingsSummary(),
  };
}

export function EraseGun(
  item_i: CP_iteminfo,
  items: readonly CP_itemtype[],
  x: number,
  y: number,
  which: number,
): EraseGunSummary {
  const item = menuItemAt(items, which);
  const erase = VWB_Bar(Math.trunc(x) - 1, Math.trunc(y), 25, 16, BKGDCOLOR);
  const textColor = SetTextColor(item, 0);
  setMenuPrintPosition(item_i, which);
  const print = US_Print(item.string);
  const update = VW_UpdateScreen();
  return {
    x: Math.trunc(x),
    y: Math.trunc(y),
    which: Math.trunc(which),
    erase,
    textColor,
    print,
    update,
    finalWindow: US_SaveWindow(),
  };
}

export function FixupCustom(w: number): FixupCustomSummary {
  const which = Math.trunc(w);
  const currentLines = drawFixupCustomLines(which);
  let currentDraw: DrawCustSummary | null = null;
  switch (which) {
    case 0:
      currentDraw = DrawCustMouse(1);
      break;
    case 3:
      currentDraw = DrawCustJoy(1);
      break;
    case 6:
      currentDraw = DrawCustKeybd(1);
      break;
    case 8:
      currentDraw = DrawCustKeys(1);
      break;
  }

  const previous = lastcustomwhich;
  let previousLines: FixupCustomLinesSummary | null = null;
  let previousDraw: DrawCustSummary | null = null;
  if (previous >= 0) {
    previousLines = drawFixupCustomLines(previous);
    if (previous !== which) {
      switch (previous) {
        case 0:
          previousDraw = DrawCustMouse(0);
          break;
        case 3:
          previousDraw = DrawCustJoy(0);
          break;
        case 6:
          previousDraw = DrawCustKeybd(0);
          break;
        case 8:
          previousDraw = DrawCustKeys(0);
          break;
      }
    }
  }

  lastcustomwhich = which;
  return { w: which, currentLines, currentDraw, previous, previousLines, previousDraw, lastwhich: lastcustomwhich };
}

export function FreeMusic(): FreeMusicSummary {
  return FreeMusicChunk(lastmusic);
}

export function GetYorN(x: number, y: number, pic: number, options: GetYorNOptions = {}): GetYorNSummary {
  const picnum = Math.trunc(pic);
  const hadSource = !!options.chunks?.[picnum];
  const cached = hadSource ? false : !!CA_CacheGrChunk(picnum);
  const draw = VWB_DrawPic(Math.trunc(x) * 8, Math.trunc(y) * 8, picnum, menuPicOptions(picnum, options));
  const uncached = grsegs[picnum] !== null;
  if (uncached) {
    UNCACHEGRCHUNK(picnum);
  }
  const update = VW_UpdateScreen();
  const initialClear = IN_ClearKeysDown();
  const whichsnd = [ESCPRESSEDSND, SHOOTSND] as const;
  let xit = 0;
  let waitPolls = 0;
  let releasePolls = 0;
  let shootDuringAccept: boolean | null = null;

  const maxPolls = options.maxPolls ?? 256;
  while (!Keyboard[sc_Y] && !Keyboard[sc_N] && !Keyboard[sc_Escape]) {
    options.pollHook?.({ phase: "wait", poll: waitPolls, xit });
    if (Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]) {
      break;
    }
    waitPolls++;
    if (waitPolls >= maxPolls) {
      throw new Error("GetYorN: no Y/N/Escape response before maxPolls");
    }
  }

  if (Keyboard[sc_Y]) {
    xit = 1;
    shootDuringAccept = ShootSnd();
  }

  const maxReleasePolls = options.maxReleasePolls ?? 256;
  while (Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]) {
    options.pollHook?.({ phase: "release", poll: releasePolls, xit });
    releasePolls++;
    if (releasePolls > maxReleasePolls) {
      throw new Error("GetYorN: response key did not release before maxReleasePolls");
    }
  }

  const finalClear = IN_ClearKeysDown();
  const finalSound = SD_PlaySound(whichsnd[xit]);
  return {
    accepted: xit === 1,
    xit,
    x: Math.trunc(x),
    y: Math.trunc(y),
    pic: picnum,
    cached,
    draw,
    uncached,
    update,
    initialClear,
    waitPolls,
    releasePolls,
    shootDuringAccept,
    finalClear,
    finalSound,
  };
}

export function HandleMenu(
  item_i: CP_iteminfo,
  items: CP_itemtype[],
  routine: ((w: number) => void) | null = null,
  options: HandleMenuOptions = {},
): number {
  let which = Math.trunc(item_i.curpos);
  const amount = Math.trunc(item_i.amount);
  if (which < 0 || which >= amount || !items[which]?.active) {
    const firstActive = items.findIndex((item, index) => index < amount && !!item.active);
    if (firstActive < 0) {
      throw new Error("HandleMenu: no active menu items");
    }
    which = firstActive;
  }

  const x = Math.trunc(item_i.x) & -8;
  const basey = Math.trunc(item_i.y) - 2;
  let y = basey + which * 13;
  let shape = C_CURSOR1PIC;
  let timer = 8;
  let exit = 0;
  let polls = 0;
  const maxPolls = options.maxPolls ?? 256;

  VWB_DrawPic(x, y, C_CURSOR1PIC, menuPicOptions(C_CURSOR1PIC, options));
  SetTextColor(menuItemAt(items, which), 1);
  if (handleMenuRedrawItem) {
    setMenuPrintPosition(item_i, which);
    US_Print(menuItemAt(items, which).string);
  }
  if (routine) {
    routine(which);
  }
  VW_UpdateScreen();

  SD_SetTimeCount(0);
  IN_ClearKeysDown();

  do {
    options.pollHook?.({ phase: "loop", poll: polls, which, exit });

    if (TimeCount > timer) {
      SD_SetTimeCount(0);
      if (shape === C_CURSOR1PIC) {
        shape = C_CURSOR2PIC;
        timer = 8;
      } else {
        shape = C_CURSOR1PIC;
        timer = 70;
      }
      VWB_DrawPic(x, y, shape, menuPicOptions(shape, options));
      if (routine) {
        routine(which);
      }
      VW_UpdateScreen();
    }

    CheckPause();

    let key = LastASCII;
    if (key) {
      let ok = false;
      if (key >= 97) {
        key -= 97 - 65;
      }

      for (let i = which + 1; i < amount; i++) {
        const item = items[i];
        if (item?.active && item.string.charCodeAt(0) === key) {
          EraseGun(item_i, items, x, y, which);
          which = i;
          const yRef = { value: y };
          DrawGun(item_i, items, x, yRef, which, basey, routine, options);
          y = yRef.value;
          ok = true;
          IN_ClearKeysDown();
          break;
        }
      }

      if (!ok) {
        for (let i = 0; i < which; i++) {
          const item = items[i];
          if (item?.active && item.string.charCodeAt(0) === key) {
            EraseGun(item_i, items, x, y, which);
            which = i;
            const yRef = { value: y };
            DrawGun(item_i, items, x, yRef, which, basey, routine, options);
            y = yRef.value;
            IN_ClearKeysDown();
            break;
          }
        }
      }
    }

    const ci = ReadAnyControl(undefined, options).control;
    switch (ci.dir) {
      case dir_North: {
        EraseGun(item_i, items, x, y, which);
        if (which && items[which - 1]?.active) {
          y -= 6;
          DrawHalfStep(x, y, options);
        }

        do {
          which = which ? which - 1 : amount - 1;
        } while (!items[which]?.active);

        const yRef = { value: y };
        DrawGun(item_i, items, x, yRef, which, basey, routine, options);
        y = yRef.value;
        TicDelay(20, { ...options, maxPolls: options.maxDelayPolls });
        break;
      }

      case dir_South: {
        EraseGun(item_i, items, x, y, which);
        if (which !== amount - 1 && items[which + 1]?.active) {
          y += 6;
          DrawHalfStep(x, y, options);
        }

        do {
          which = which === amount - 1 ? 0 : which + 1;
        } while (!items[which]?.active);

        const yRef = { value: y };
        DrawGun(item_i, items, x, yRef, which, basey, routine, options);
        y = yRef.value;
        TicDelay(20, { ...options, maxPolls: options.maxDelayPolls });
        break;
      }
    }

    options.pollHook?.({ phase: "post-move", poll: polls, which, exit });

    if (ci.button0 || Keyboard[sc_Space] || Keyboard[sc_Enter]) {
      exit = 1;
    }
    if (ci.button1 || Keyboard[sc_Escape]) {
      exit = 2;
    }

    if (!exit) {
      SDL_t0Service();
      polls++;
      if (polls >= maxPolls) {
        throw new Error("HandleMenu: no accept/cancel response before maxPolls");
      }
    }
  } while (!exit);

  IN_ClearKeysDown();

  if (handleMenuLastItem !== which) {
    VWB_Bar(x - 1, y, 25, 16, BKGDCOLOR);
    setMenuPrintPosition(item_i, which);
    US_Print(menuItemAt(items, which).string);
    handleMenuRedrawItem = 1;
  } else {
    handleMenuRedrawItem = 0;
  }

  if (routine) {
    routine(which);
  }
  VW_UpdateScreen();

  item_i.curpos = which;
  handleMenuLastItem = which;

  if (exit === 1) {
    const item = menuItemAt(items, which);
    if (item.routine) {
      ShootSnd();
      menuFadeOut();
      item.routine(0);
    }
    return which;
  }

  SD_PlaySound(ESCPRESSEDSND);
  return -1;
}

export function IN_GetScanName(scan: number): string {
  const code = Math.trunc(scan) & 0xff;
  for (let i = 0; ExtScanCodes[i]; i++) {
    if (ExtScanCodes[i] === code) {
      return ExtScanNames[i];
    }
  }
  return ScanNames[code] ?? "?";
}

export function IntroScreen(options: IntroScreenOptions = {}): IntroScreenSummary {
  const MAINCOLOR = 0x6c;
  const EMSCOLOR = 0x6c;
  const XMSCOLOR = 0x6c;
  const FILLCOLOR = 14;
  const ems = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;
  const xms = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;
  const main = [32, 64, 96, 128, 160, 192, 224, 256, 288, 320] as const;

  const memoryKb = Math.trunc((1023 + Math.trunc(options.nearheap ?? 0) + Math.trunc(options.farheap ?? 0)) / 1024);
  const mainBars: IntroScreenBarSummary[] = [];
  const emsBars: IntroScreenBarSummary[] = [];
  const xmsBars: IntroScreenBarSummary[] = [];
  const deviceBars: IntroScreenBarSummary[] = [];

  const drawBar = (
    kind: IntroScreenBarSummary["kind"],
    index: number,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
  ): IntroScreenBarSummary => ({
    kind,
    index,
    x,
    y,
    w,
    h,
    color,
    draw: VWB_Bar(x, y, w, h, color),
  });

  for (let i = 0; i < main.length; i++) {
    if (memoryKb >= main[i]) {
      mainBars.push(drawBar("main", i, 49, 163 - 8 * i, 6, 5, MAINCOLOR - i));
    }
  }

  const emsKb = (options.EMSPresent ?? false) ? 4 * Math.trunc(options.EMSPagesAvail ?? 0) : null;
  if (emsKb !== null) {
    for (let i = 0; i < ems.length; i++) {
      if (emsKb >= ems[i]) {
        emsBars.push(drawBar("ems", i, 89, 163 - 8 * i, 6, 5, EMSCOLOR - i));
      }
    }
  }

  const xmsKb = (options.XMSPresent ?? false) ? 4 * Math.trunc(options.XMSPagesAvail ?? 0) : null;
  if (xmsKb !== null) {
    for (let i = 0; i < xms.length; i++) {
      if (xmsKb >= xms[i]) {
        xmsBars.push(drawBar("xms", i, 129, 163 - 8 * i, 6, 5, XMSCOLOR - i));
      }
    }
  }

  if (options.mousePresent ?? MousePresent) {
    deviceBars.push(drawBar("device", 0, 164, 82, 12, 2, FILLCOLOR));
  }
  if ((options.joy0Present ?? JoysPresent[0]) || (options.joy1Present ?? JoysPresent[1])) {
    deviceBars.push(drawBar("device", 1, 164, 105, 12, 2, FILLCOLOR));
  }
  const hasAdLib = options.adLibPresent ?? AdLibPresent;
  const hasSoundBlaster = options.soundBlasterPresent ?? SoundBlasterPresent;
  if (hasAdLib && !hasSoundBlaster) {
    deviceBars.push(drawBar("device", 2, 164, 128, 12, 2, FILLCOLOR));
  }
  if (hasSoundBlaster) {
    deviceBars.push(drawBar("device", 3, 164, 151, 12, 2, FILLCOLOR));
  }
  if (options.soundSourcePresent ?? SoundSourcePresent) {
    deviceBars.push(drawBar("device", 4, 164, 174, 12, 2, FILLCOLOR));
  }

  return { memoryKb, emsKb, xmsKb, mainBars, emsBars, xmsBars, deviceBars };
}

export function Message(string: string | ArrayLike<number>, options: MessageOptions = {}): MessageSummary {
  const text = menuCString(string);
  const fontChunk = STARTFONT + 1;
  const previousFont = grsegs[fontChunk];
  if (options.font) {
    grsegs[fontChunk] = options.font;
  }

  try {
    const fontCached = options.font ? false : !!CA_CacheGrChunk(fontChunk);
    const fontState = VW_SetFontState({ fontnumber: 1 });
    const measure = measureMessage(text);
    const currentWindow = US_SaveWindow();
    const y = Math.trunc(currentWindow.h / 2) - Math.trunc(measure.height / 2);
    const x = 160 - Math.trunc(measure.maxWidth / 2);
    const positionedWindow = US_RestoreWindow({
      x,
      y: currentWindow.y,
      w: currentWindow.w,
      h: currentWindow.h,
      px: x,
      py: y,
    });
    const window = DrawWindow(x - 5, y - 5, measure.maxWidth + 10, measure.height + 10, TEXTCOLOR);
    const outline = DrawOutline(x - 5, y - 5, measure.maxWidth + 10, measure.height + 10, 0, HIGHLIGHT);
    const color = VW_SetFontState({ fontcolor: 0, backcolor: TEXTCOLOR });
    const print = US_Print(text);
    const update = VW_UpdateScreen();
    return {
      text,
      fontChunk,
      fontCached,
      measure,
      x,
      y,
      fontState,
      positionedWindow,
      window,
      outline,
      color,
      print,
      update,
      finalWindow: US_SaveWindow(),
    };
  } finally {
    if (options.font) {
      grsegs[fontChunk] = previousFont ?? null;
    }
  }
}

export function MouseSensitivity(options: MouseSensitivityOptions = {}): MouseSensitivitySummary {
  let exit = 0;
  const oldMouseAdjustment = Math.trunc(mouseadjustment);
  const initial = DrawMouseSens(options);
  const steps: MouseSensitivityStepSummary[] = [];
  let polls = 0;
  let debugPauseRequested = false;
  const maxPolls = options.maxPolls ?? 256;

  do {
    options.pollHook?.({ phase: "loop", poll: polls, mouseadjustment: Math.trunc(mouseadjustment), exit });
    const ci = ReadAnyControl(undefined, options).control;
    switch (ci.dir) {
      case dir_North:
      case dir_West:
        if (mouseadjustment) {
          SetMouseAdjustment(mouseadjustment - 1);
          const redraw = drawMouseSensitivitySlider(mouseadjustment);
          const soundPlayed = SD_PlaySound(MOVEGUN1SND);
          const wait = waitMouseSensitivityRelease(options, "release", exit);
          steps.push({ direction: "decrease", mouseadjustment: Math.trunc(mouseadjustment), ...redraw, soundPlayed, wait });
        }
        break;

      case dir_South:
      case dir_East:
        if (mouseadjustment < 9) {
          SetMouseAdjustment(mouseadjustment + 1);
          const redraw = drawMouseSensitivitySlider(mouseadjustment);
          const soundPlayed = SD_PlaySound(MOVEGUN1SND);
          const wait = waitMouseSensitivityRelease(options, "release", exit);
          steps.push({ direction: "increase", mouseadjustment: Math.trunc(mouseadjustment), ...redraw, soundPlayed, wait });
        }
        break;
    }

    if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers")) {
      debugPauseRequested = true;
    }

    if (ci.button0 || Keyboard[sc_Space] || Keyboard[sc_Enter]) {
      exit = 1;
    } else if (ci.button1 || Keyboard[sc_Escape]) {
      exit = 2;
    }

    polls++;
    if (!exit && polls >= maxPolls) {
      throw new Error("MouseSensitivity: no accept/cancel response before maxPolls");
    }
  } while (!exit);

  let restored = false;
  let finalSound: boolean;
  if (exit === 2) {
    SetMouseAdjustment(oldMouseAdjustment);
    restored = true;
    finalSound = SD_PlaySound(ESCPRESSEDSND);
  } else {
    finalSound = SD_PlaySound(SHOOTSND);
  }

  const finalWait = waitMouseSensitivityRelease(options, "final-release", exit);
  return {
    oldMouseAdjustment,
    initial,
    polls,
    steps,
    exit,
    restored,
    finalMouseAdjustment: Math.trunc(mouseadjustment),
    debugPauseRequested,
    finalSound,
    finalWait,
    fade: null,
  };
}

function drawMouseSensitivitySlider(adjustment: number): Pick<
  MouseSensitivityStepSummary,
  "bar" | "barOutline" | "knobOutline" | "knob" | "update"
> {
  const selected = Math.trunc(adjustment);
  const bar = VWB_Bar(60, 97, 200, 10, TEXTCOLOR);
  const barOutline = DrawOutline(60, 97, 200, 10, 0, HIGHLIGHT);
  const knobOutline = DrawOutline(60 + 20 * selected, 97, 20, 10, 0, READCOLOR);
  const knob = VWB_Bar(61 + 20 * selected, 98, 19, 9, READHCOLOR);
  const update = VW_UpdateScreen();
  return { bar, barOutline, knobOutline, knob, update };
}

function waitMouseSensitivityRelease(
  options: MouseSensitivityOptions,
  phase: "release" | "final-release",
  exit: number,
): WaitKeyUpSummary {
  return WaitKeyUp({
    mouseenabled: options.mouseenabled,
    joystickenabled: options.joystickenabled,
    joypadenabled: options.joypadenabled,
    joystickport: options.joystickport,
    mouseX: options.mouseX,
    mouseY: options.mouseY,
    mouseButtons: options.mouseButtons,
    joyDelta: options.joyDelta,
    joyButtons: options.joyButtons,
    maxPolls: options.maxReleasePolls,
    pollHook: (poll) => {
      options.pollHook?.({ phase, poll, mouseadjustment: Math.trunc(mouseadjustment), exit });
    },
  });
}

export function PrintCustJoy(i: number): PrintCustSummary {
  return printCustButtonBinding("joy", Math.trunc(i), buttonjoy);
}

export function PrintCustKeybd(i: number): PrintCustSummary {
  const index = Math.trunc(i);
  const x = CST_START + CST_SPC * index;
  const y = US_SaveWindow().py;
  const scan = buttonscan[order[index]];
  const text = IN_GetScanName(scan);
  US_RestoreWindow({ ...US_SaveWindow(), px: x });
  const print = US_Print(text);
  return { kind: "keybd", index, x, y, binding: scan, text, print, finalWindow: US_SaveWindow() };
}

export function PrintCustKeys(i: number): PrintCustSummary {
  const index = Math.trunc(i);
  const x = CST_START + CST_SPC * index;
  const y = US_SaveWindow().py;
  const scan = dirscan[moveorder[index]];
  const text = IN_GetScanName(scan);
  US_RestoreWindow({ ...US_SaveWindow(), px: x });
  const print = US_Print(text);
  return { kind: "keys", index, x, y, binding: scan, text, print, finalWindow: US_SaveWindow() };
}

export function PrintCustMouse(i: number): PrintCustSummary {
  return printCustButtonBinding("mouse", Math.trunc(i), buttonmouse);
}

function drawCustButtonRow(
  kind: CustomControlKind,
  hilight: number,
  menuIndex: number | null,
  enabled: boolean | null,
  printY: number,
  printer: (i: number) => PrintCustSummary,
): DrawCustSummary {
  let color = hilight ? HIGHLIGHT : TEXTCOLOR;
  let colorState = VW_SetFontState({ fontcolor: color, backcolor: BKGDCOLOR });

  if (menuIndex !== null) {
    if (!enabled) {
      color = DEACTIVE;
      colorState = VW_SetFontState({ fontcolor: color, backcolor: BKGDCOLOR });
      CusMenu[menuIndex].active = 0;
    } else {
      CusMenu[menuIndex].active = 1;
    }
  }

  US_RestoreWindow({ ...US_SaveWindow(), py: printY });
  const prints: PrintCustSummary[] = [];
  for (let i = 0; i < 4; i++) {
    prints.push(printer(i));
  }

  return {
    kind,
    hilight,
    color,
    colorState,
    enabled,
    menuIndex,
    menuActive: menuIndex === null ? null : CusMenu[menuIndex].active,
    printY,
    prints,
    finalWindow: US_SaveWindow(),
  };
}

function printCustButtonBinding(kind: "mouse" | "joy", index: number, bindings: readonly number[]): PrintCustSummary {
  const x = CST_START + CST_SPC * index;
  const y = US_SaveWindow().py;
  for (let j = 0; j < 4; j++) {
    if (order[index] === bindings[j]) {
      const text = mbarray[j];
      US_RestoreWindow({ ...US_SaveWindow(), px: x });
      const print = US_Print(text);
      return { kind, index, x, y, binding: j, text, print, finalWindow: US_SaveWindow() };
    }
  }
  return { kind, index, x, y, binding: null, text: null, print: null, finalWindow: US_SaveWindow() };
}

function printCustomActionLabels(
  first: string,
  second: string,
  third: string,
  fourth: string,
): DrawCustomLabelRowSummary {
  return {
    runOrLeft: printCustomLabelAt(CST_START, first),
    openOrRight: printCustomLabelAt(CST_START + CST_SPC, second),
    fireOrFrwd: printCustomLabelAt(CST_START + CST_SPC * 2, third),
    strafeOrBkwd: printCustomLabelAt(CST_START + CST_SPC * 3, fourth),
  };
}

function printCustomLabelAt(x: number, text: string): PrintSummary {
  US_RestoreWindow({ ...US_SaveWindow(), px: x });
  return US_Print(text);
}

function drawFixupCustomLines(w: number): FixupCustomLinesSummary {
  const y = CST_Y + 26 + Math.trunc(w) * 13;
  return {
    y,
    innerTop: VWB_Hlin(7, 32, y - 1, DEACTIVE),
    innerBottom: VWB_Hlin(7, 32, y + 12, BORD2COLOR),
    outerTop: VWB_Hlin(7, 32, y - 2, BORDCOLOR),
    outerBottom: VWB_Hlin(7, 32, y + 13, BORDCOLOR),
  };
}

function pickEnterCtrlData(
  index: number,
  which: number,
  type: CustomControlType,
  control: ControlInfo,
  options: EnterCtrlDataOptions,
): EnterCtrlDataPickSummary {
  let tick = 0;
  let picked = 0;
  let pickPolls = 0;
  let result = 0;
  let scan: number | null = null;
  let escape = false;
  let sound: boolean | null = null;
  let timerServices = 0;
  const flashes: EnterCtrlDataFlashSummary[] = [];
  const x = CST_START + CST_SPC * which;
  const maxPickPolls = options.maxPickPolls ?? 256;
  const maxTimerServices = options.maxTimerServices ?? maxPickPolls * 16;

  SD_SetTimeCount(0);
  VW_SetFontState({ fontcolor: 0, backcolor: TEXTCOLOR });

  while (!picked) {
    if (type === KEYBOARDBTNS || type === KEYBOARDMOVE) {
      IN_ClearKeysDown();
    }

    if (TimeCount > 10) {
      let erase: BufferedDrawSummary<PlanarFillSummary> | null = null;
      let question: PrintSummary | null = null;
      let flashSound: boolean | null = null;
      switch (tick) {
        case 0:
          erase = VWB_Bar(x, CST_Y + 13 * index + 1, CST_SPC - 2, 10, TEXTCOLOR);
          break;
        case 1:
          US_RestoreWindow({ ...US_SaveWindow(), px: x });
          question = US_Print("?");
          flashSound = SD_PlaySound(HITWALLSND);
          break;
      }
      tick ^= 1;
      SD_SetTimeCount(0);
      flashes.push({ tick, erase, question, sound: flashSound, update: VW_UpdateScreen() });
    }

    options.pollHook?.({ phase: "pick", poll: pickPolls, index, which, type, exit: 0, picked, control });

    switch (type) {
      case MOUSE: {
        const button = options.mouseButtons ?? IN_MouseButtons();
        switch (button) {
          case 1:
            result = 1;
            break;
          case 2:
            result = 2;
            break;
          case 4:
            result = 3;
            break;
        }
        if (result) {
          for (let z = 0; z < 4; z++) {
            if (order[which] === buttonmouse[z]) {
              buttonmouse[z] = bt_nobutton;
              break;
            }
          }
          buttonmouse[result - 1] = order[which];
          picked = 1;
          sound = SD_PlaySound(SHOOTDOORSND);
        }
        break;
      }

      case JOYSTICK:
        if (control.button0) {
          result = 1;
        } else if (control.button1) {
          result = 2;
        } else if (control.button2) {
          result = 3;
        } else if (control.button3) {
          result = 4;
        }
        if (result) {
          for (let z = 0; z < 4; z++) {
            if (order[which] === buttonjoy[z]) {
              buttonjoy[z] = bt_nobutton;
              break;
            }
          }
          buttonjoy[result - 1] = order[which];
          picked = 1;
          sound = SD_PlaySound(SHOOTDOORSND);
        }
        break;

      case KEYBOARDBTNS:
        if (LastScan) {
          scan = LastScan;
          buttonscan[order[which]] = LastScan;
          picked = 1;
          sound = ShootSnd();
          IN_ClearKeysDown();
        }
        break;

      case KEYBOARDMOVE:
        if (LastScan) {
          scan = LastScan;
          dirscan[moveorder[which]] = LastScan;
          picked = 1;
          sound = ShootSnd();
          IN_ClearKeysDown();
        }
        break;
    }

    if (IN_KeyDown(sc_Escape)) {
      picked = 1;
      escape = true;
    }

    pickPolls++;
    if (!picked) {
      if (pickPolls >= maxPickPolls) {
        throw new Error("EnterCtrlData: no replacement control before maxPickPolls");
      }
      if (timerServices < maxTimerServices) {
        SDL_t0Service();
        timerServices++;
      }
    }
  }

  return { which, type, polls: pickPolls, result, scan, escape, flashes, sound, bindings: controlBindingsSummary() };
}

function waitEnterCtrlDataRelease(
  options: EnterCtrlDataOptions,
  phase: EnterCtrlDataPhase,
  index: number,
  which: number,
  type: CustomControlType,
  exit: number,
  picked: number,
): WaitKeyUpSummary {
  return WaitKeyUp({
    mouseenabled: options.mouseenabled,
    joystickenabled: options.joystickenabled,
    joypadenabled: options.joypadenabled,
    joystickport: options.joystickport,
    mouseX: options.mouseX,
    mouseY: options.mouseY,
    mouseButtons: options.mouseButtons,
    joyDelta: options.joyDelta,
    joyButtons: options.joyButtons,
    maxPolls: options.maxReleasePolls,
    pollHook: (poll, control) => {
      options.pollHook?.({ phase, poll, index, which, type, exit, picked, control });
    },
  });
}

function waitEnterCtrlDataDirectionRelease(
  direction: "west" | "east",
  index: number,
  which: number,
  type: CustomControlType,
  options: EnterCtrlDataOptions,
): EnterCtrlDataMoveSummary {
  const sound = SD_PlaySound(MOVEGUN1SND);
  const maxPolls = options.maxReleasePolls ?? 256;
  let releasePolls = 0;
  let control = newMenuControlInfo();

  while (true) {
    options.pollHook?.({ phase: "direction-release", poll: releasePolls, index, which, type, exit: 0, picked: 0, control });
    const read = ReadAnyControl(control, options);
    control = read.control;
    releasePolls++;
    if (control.dir === dir_None) {
      break;
    }
    if (releasePolls >= maxPolls) {
      throw new Error("EnterCtrlData: direction did not release before maxReleasePolls");
    }
  }

  const clear = IN_ClearKeysDown();
  return { direction, which, sound, releasePolls, clear };
}

function controlBindingsSummary(): EnterCtrlDataSummary["finalBindings"] {
  return {
    buttonmouse: [...buttonmouse],
    buttonjoy: [...buttonjoy],
    buttonscan: [...buttonscan],
    dirscan: [...dirscan],
  };
}

export function PrintLSEntry(w: number, color: number): PrintLSEntrySummary {
  const index = Math.trunc(w);
  const drawColor = color & 0xff;
  const fontColor = VW_SetFontState({ fontcolor: drawColor, backcolor: BKGDCOLOR });
  const outline = DrawOutline(
    LSM_X + LSItems.indent,
    LSM_Y + index * 13,
    LSM_W - LSItems.indent - 15,
    11,
    drawColor,
    drawColor,
  );
  const positionedWindow = US_RestoreWindow({
    ...US_SaveWindow(),
    px: LSM_X + LSItems.indent + 2,
    py: LSM_Y + index * 13 + 1,
  });
  const entryFont = VW_SetFontState({ fontnumber: 0 });
  const text = SaveGamesAvail[index] ? SaveGameNames[index] : "      - empty -";
  const print = US_Print(text);
  const finalFont = VW_SetFontState({ fontnumber: 1 });
  return { w: index, color: drawColor, fontColor, outline, positionedWindow, entryFont, text, print, finalFont, finalWindow: US_SaveWindow() };
}

export function ReadAnyControl(ci?: ControlInfo, options: MenuControlOptions = {}): ReadAnyControlSummary {
  const control = IN_ReadControl(0, ci);
  let mouseactive = false;
  let source: ReadAnyControlSummary["source"] = "base";

  if (options.mouseenabled ?? mouseenabled) {
    const mousex = options.mouseX;
    const mousey = options.mouseY;

    if (mousey !== undefined && mousey < CENTER - SENSITIVE) {
      control.dir = dir_North;
      mouseactive = true;
      source = "mouse";
    } else if (mousey !== undefined && mousey > CENTER + SENSITIVE) {
      control.dir = dir_South;
      mouseactive = true;
      source = "mouse";
    }

    if (mousex !== undefined && mousex < CENTER - SENSITIVE) {
      control.dir = dir_West;
      mouseactive = true;
      source = "mouse";
    } else if (mousex !== undefined && mousex > CENTER + SENSITIVE) {
      control.dir = dir_East;
      mouseactive = true;
      source = "mouse";
    }

    const buttons = options.mouseButtons ?? IN_MouseButtons();
    if (buttons) {
      control.button0 = !!(buttons & 1);
      control.button1 = !!(buttons & 2);
      control.button2 = !!(buttons & 4);
      control.button3 = false;
      mouseactive = true;
      source = "mouse";
    }
  }

  if ((options.joystickenabled ?? joystickenabled) && !mouseactive) {
    const port = Math.trunc(options.joystickport ?? joystickport);
    const delta = options.joyDelta ?? INL_GetJoyDelta(port);
    if (delta.dy < -SENSITIVE) {
      control.dir = dir_North;
      source = "joystick";
    } else if (delta.dy > SENSITIVE) {
      control.dir = dir_South;
      source = "joystick";
    }

    if (delta.dx < -SENSITIVE) {
      control.dir = dir_West;
      source = "joystick";
    } else if (delta.dx > SENSITIVE) {
      control.dir = dir_East;
      source = "joystick";
    }

    const buttons = options.joyButtons ?? IN_JoyButtons();
    if (buttons) {
      control.button0 = !!(buttons & 1);
      control.button1 = !!(buttons & 2);
      if (options.joypadenabled ?? joypadenabled) {
        control.button2 = !!(buttons & 4);
        control.button3 = !!(buttons & 8);
      } else {
        control.button2 = false;
        control.button3 = false;
      }
      source = "joystick";
    }
  }

  return { control, mouseactive, source };
}

export function SetTextColor(items: CP_itemtype, hlight: number): TextColorSummary {
  const active = Math.trunc(items.active);
  const color = (hlight ? color_hlite : color_norml)[active];
  if (color === undefined) {
    throw new RangeError(`SetTextColor: bad active index ${active}`);
  }
  const state = VW_SetFontState({ fontcolor: color, backcolor: BKGDCOLOR });
  return { active, hlight: !!hlight, fontcolor: color, backcolor: BKGDCOLOR, state };
}

export function SetupControlPanel(options: SetupControlPanelOptions = {}): SetupControlPanelSummary {
  const font = options.skipResourceCache ? null : CA_CacheGrChunk(STARTFONT + 1);
  const controls = options.skipResourceCache ? null : CacheLump(CONTROLS_LUMP_START, CONTROLS_LUMP_END);
  const fontState = VW_SetFontState({ fontcolor: TEXTCOLOR, backcolor: BKGDCOLOR, fontnumber: 1 });
  const window = US_RestoreWindow({ ...US_SaveWindow(), h: 200 });

  let loadedSounds: CacheManagerSummary | null = null;
  if (!ingame) {
    if (!options.skipLoadAllSounds) {
      loadedSounds = CA_LoadAllSounds(options.AUDIOHED, options.AUDIOT);
    }
  } else {
    MainMenu[4].active = 1;
  }

  const saves: SetupControlPanelSaveSummary[] = [];
  for (const saveFile of options.saveFiles ?? []) {
    const slot = saveSlotFromFilename(saveFile.filename);
    if (slot < 0 || slot >= 10) {
      continue;
    }
    const name = saveNameFromHeader(saveFile.data);
    SaveGamesAvail[slot] = 1;
    SaveGameNames[slot] = name;
    saves.push({ slot, filename: saveFile.filename, name });
  }

  return {
    font,
    controls,
    fontState,
    window,
    ingame,
    loadedSounds,
    mainSaveActive: MainMenu[4].active,
    saves,
    mouseCenter: [CENTER, CENTER],
  };
}

export function ShootSnd(): boolean {
  return SD_PlaySound(SHOOTSND);
}

function FreeMusicChunk(song: number): FreeMusicSummary {
  const songIndex = Math.trunc(song);
  const chunk = STARTMUSIC + songIndex;
  const freed = audiosegs[chunk] !== null;
  if (freed) {
    audiosegs[chunk] = null;
    audiopurge[chunk] = 0;
  }
  return { song: songIndex, chunk, freed };
}

export function StartCPMusic(song: number, options: CPMusicOptions = {}): StartCPMusicSummary {
  const previousSong = lastmusic;
  const previous = FreeMusicChunk(previousSong);
  const songIndex = Math.trunc(song);
  lastmusic = songIndex;
  const musicOff = SD_MusicOff();
  const chunk = STARTMUSIC + songIndex;
  const music = CA_CacheAudioChunk(chunk, options.AUDIOHED, options.AUDIOT);
  const started = SD_StartMusic(music);
  return {
    previousSong,
    previousChunk: previous.chunk,
    freedPrevious: previous.freed,
    song: songIndex,
    chunk,
    musicOff,
    cacheLength: music.length,
    started,
  };
}

export function TicDelay(
  count: number,
  options: MenuControlOptions & { readonly maxPolls?: number } = {},
): TicDelaySummary {
  SD_SetTimeCount(0);
  const target = Math.max(0, Math.trunc(count));
  const maxPolls = options.maxPolls ?? Math.max(1, target * 32 + 1);
  let polls = 0;
  let timerServices = 0;
  let lastControl = newMenuControlInfo();

  do {
    const read = ReadAnyControl(lastControl, options);
    lastControl = read.control;
    polls++;
    if (TimeCount < target && lastControl.dir !== dir_None) {
      SDL_t0Service();
      timerServices++;
    }
    if (polls > maxPolls) {
      throw new Error("TicDelay: control did not become inactive before maxPolls");
    }
  } while (TimeCount < target && lastControl.dir !== dir_None);

  return { count: target, polls, timerServices, finalTimeCount: TimeCount, lastControl };
}

export function TrackWhichGame(w: number): TrackWhichGameSummary {
  const current = Math.trunc(w);
  const previous = lastgameon;
  const previousEntry = PrintLSEntry(previous, TEXTCOLOR);
  const currentEntry = PrintLSEntry(current, HIGHLIGHT);
  lastgameon = current;
  return { previous, current, previousEntry, currentEntry };
}

export function UnCacheLump(lumpstart: number, lumpend: number): LumpCacheSummary {
  const chunks: number[] = [];
  let uncached = 0;
  let skipped = 0;
  for (let i = Math.trunc(lumpstart); i <= Math.trunc(lumpend); i++) {
    chunks.push(i);
    if (grsegs[i]) {
      UNCACHEGRCHUNK(i);
      uncached++;
    } else {
      skipped++;
    }
  }
  return { start: Math.trunc(lumpstart), end: Math.trunc(lumpend), chunks, cached: uncached, skipped };
}

interface USControlPanelDispatchSummary {
  readonly action: USControlPanelActionSummary;
  readonly gameStartedOrLoaded: boolean;
  readonly stopLoop: boolean;
}

function usControlPanelMusicOptions(options: USControlPanelOptions): CPMusicOptions {
  return options.musicOptions ?? options.setupOptions ?? {};
}

function usControlPanelRedraw(options: USControlPanelOptions): Pick<USControlPanelActionSummary, "redraw" | "fadeIn"> {
  const redraw = DrawMainMenu(options.drawOptions ?? {});
  const fadeIn = options.skipFade ? null : menuFadeIn(options.palette);
  return { redraw, fadeIn };
}

function usControlPanelSelectionName(selection: number): string {
  switch (selection) {
    case newgame:
      return "newgame";
    case sound:
      return "sound";
    case control:
      return "control";
    case loadgame:
      return "loadgame";
    case savegame:
      return "savegame";
    case changeview:
      return "changeview";
    case readthis:
      return "readthis";
    case viewscores:
      return "viewscores";
    case backtodemo:
      return "backtodemo";
    case quit:
    case -1:
      return "quit";
    default:
      return `item-${selection}`;
  }
}

function rewriteViewScoresAsEndGame(): void {
  MainMenu[viewscores].routine = null;
  MainMenu[viewscores].string = STR_EG;
}

function runUSControlPanelFKey(scan: number, options: USControlPanelOptions): USControlPanelActionSummary | null {
  let result: unknown;
  let selection: number;
  let name: string;

  switch (scan) {
    case sc_F1:
      selection = readthis;
      name = "help";
      result = { helpScreens: options.readThisOptions?.helpScreens?.() ?? null };
      break;

    case sc_F2:
      selection = savegame;
      name = "savegame";
      result = CP_SaveGame({ ...(options.saveOptions ?? {}), quick: false });
      break;

    case sc_F3:
      selection = loadgame;
      name = "loadgame";
      result = CP_LoadGame({ ...(options.loadOptions ?? {}), quick: false });
      break;

    case sc_F4:
      selection = sound;
      name = "sound";
      result = CP_Sound(options.soundOptions ?? {});
      break;

    case sc_F5:
      selection = changeview;
      name = "changeview";
      result = CP_ChangeView(options.changeViewOptions ?? {});
      break;

    case sc_F6:
      selection = control;
      name = "control";
      result = CP_Control(options.controlOptions ?? {});
      break;

    default:
      return null;
  }

  return { selection, name, result, redraw: null, fadeIn: null };
}

function runUSControlPanelSelection(selection: number, options: USControlPanelOptions): USControlPanelDispatchSummary {
  const which = Math.trunc(selection);
  if (which >= 0 && (which >= MainItems.amount || !MainMenu[which]?.active)) {
    throw new RangeError(`US_ControlPanel: inactive or missing main menu item ${which}`);
  }

  let result: unknown = null;
  let redraw: DrawMainMenuSummary | null = null;
  let fadeIn: FadeSummary | null = null;
  let gameStartedOrLoaded = false;
  let stopLoop = false;

  switch (which) {
    case newgame: {
      const newGameResult = CP_NewGame(options.newGameOptions ?? {});
      result = newGameResult;
      gameStartedOrLoaded = !newGameResult.cancelled && !!newGameResult.startGame;
      stopLoop = !!newGameResult.startGame;
      break;
    }

    case sound:
      result = CP_Sound(options.soundOptions ?? {});
      break;

    case control:
      result = CP_Control(options.controlOptions ?? {});
      break;

    case loadgame: {
      const loadResult = CP_LoadGame({ ...(options.loadOptions ?? {}), quick: false });
      result = loadResult;
      gameStartedOrLoaded = loadResult.result === 1;
      stopLoop = !!loadResult.startGame;
      break;
    }

    case savegame:
      result = CP_SaveGame({ ...(options.saveOptions ?? {}), quick: false });
      break;

    case changeview:
      result = CP_ChangeView(options.changeViewOptions ?? {});
      break;

    case readthis:
      result = CP_ReadThis(options.readThisOptions ?? {});
      break;

    case viewscores:
      if (MainMenu[viewscores].routine === null) {
        const endGame = CP_EndGame(options.endGameOptions ?? {});
        result = endGame;
        if (endGame.result) {
          StartGame = 1;
          stopLoop = true;
        }
      } else {
        result = CP_ViewScores(options.viewScoresOptions ?? {});
      }
      ({ redraw, fadeIn } = usControlPanelRedraw(options));
      break;

    case backtodemo: {
      StartGame = 1;
      stopLoop = true;
      result = {
        startGame: StartGame,
        introMusic: ingame || options.skipMusic ? null : StartCPMusic(INTROSONG, usControlPanelMusicOptions(options)),
        fadeOut: options.skipFade ? null : menuFadeOut(),
      };
      break;
    }

    case quit:
    case -1: {
      const quitResult = CP_Quit(options.quitOptions ?? {});
      result = quitResult;
      if (quitResult.quitRequested) {
        StartGame = 1;
        stopLoop = true;
      }
      break;
    }

    default:
      throw new RangeError(`US_ControlPanel: bad main menu item ${which}`);
  }

  if (which !== viewscores && which !== backtodemo && which !== quit && which !== -1 && !StartGame) {
    ({ redraw, fadeIn } = usControlPanelRedraw(options));
  }

  return {
    action: { selection: which, name: usControlPanelSelectionName(which), result, redraw, fadeIn },
    gameStartedOrLoaded,
    stopLoop,
  };
}

export function US_ControlPanel(scancode = 0, options: USControlPanelOptions = {}): USControlPanelSummary {
  const scan = Math.trunc(scancode);

  if (ingame) {
    const quick = CP_CheckQuick(scan, options.quickOptions ?? {});
    if (quick.result) {
      return {
        scancode: scan,
        quick,
        music: null,
        setup: null,
        fkey: null,
        mainDraw: null,
        mainFadeIn: null,
        actions: [],
        cleanup: null,
        startGame: StartGame,
        viewScoresString: MainMenu[viewscores].string,
        viewScoresRoutine: MainMenu[viewscores].routine?.name ?? null,
      };
    }
  }

  const music = options.skipMusic ? null : StartCPMusic(MENUSONG, usControlPanelMusicOptions(options));
  const setup = SetupControlPanel(options.setupOptions ?? {});
  const fkey = runUSControlPanelFKey(scan, options);
  if (fkey) {
    const cleanup = options.cleanup === false ? null : CleanupControlPanel();
    return {
      scancode: scan,
      quick: null,
      music,
      setup,
      fkey,
      mainDraw: null,
      mainFadeIn: null,
      actions: [],
      cleanup,
      startGame: StartGame,
      viewScoresString: MainMenu[viewscores].string,
      viewScoresRoutine: MainMenu[viewscores].routine?.name ?? null,
    };
  }

  const mainDraw = DrawMainMenu(options.drawOptions ?? {});
  const mainFadeIn = options.skipFade ? null : menuFadeIn(options.palette);
  StartGame = 0;

  const actions: USControlPanelActionSummary[] = [];
  let gameStartedOrLoaded = false;
  const scriptedSelections = options.mainSelections
    ? [...options.mainSelections]
    : options.handleOptions
      ? [HandleMenu(MainItems, MainMenu, null, options.handleOptions)]
      : [];

  for (const selection of scriptedSelections) {
    const dispatch = runUSControlPanelSelection(selection, options);
    actions.push(dispatch.action);
    gameStartedOrLoaded ||= dispatch.gameStartedOrLoaded;
    if (dispatch.stopLoop) {
      break;
    }
  }

  const cleanup = options.cleanup === false ? null : CleanupControlPanel();
  if (gameStartedOrLoaded) {
    rewriteViewScoresAsEndGame();
  }

  return {
    scancode: scan,
    quick: null,
    music,
    setup,
    fkey: null,
    mainDraw,
    mainFadeIn,
    actions,
    cleanup,
    startGame: StartGame,
    viewScoresString: MainMenu[viewscores].string,
    viewScoresRoutine: MainMenu[viewscores].routine?.name ?? null,
  };
}

export function WaitKeyUp(options: WaitKeyUpOptions = {}): WaitKeyUpSummary {
  const maxPolls = options.maxPolls ?? 256;
  let polls = 0;
  let control = newMenuControlInfo();

  do {
    const read = ReadAnyControl(control, options);
    control = read.control;
    polls++;
    if (!isMenuControlHeld(control)) {
      break;
    }
    options.pollHook?.(polls, control);
    if (polls >= maxPolls) {
      throw new Error("WaitKeyUp: controls did not release before maxPolls");
    }
  } while (true);

  return {
    polls,
    finalControl: control,
    spaceDown: !!Keyboard[sc_Space],
    enterDown: !!Keyboard[sc_Enter],
    escapeDown: !!Keyboard[sc_Escape],
  };
}

function saveSlotFromFilename(filename: string): number {
  const ch = filename.charCodeAt(7);
  if (!Number.isFinite(ch)) {
    return -1;
  }
  return ch - 48;
}

function saveNameFromHeader(data: Uint8Array | string): string {
  if (typeof data === "string") {
    const nul = data.indexOf("\0");
    return (nul >= 0 ? data.slice(0, nul) : data.slice(0, 32)).slice(0, 32);
  }

  let end = 0;
  while (end < 32 && end < data.length && data[end] !== 0) {
    end++;
  }

  let name = "";
  for (let i = 0; i < end; i++) {
    name += String.fromCharCode(data[i] & 0xff);
  }
  return name;
}

function clampSaveSlot(slot: number): number {
  const value = Math.trunc(slot);
  if (value < 0 || value >= 10) {
    throw new RangeError(`save slot out of range: ${slot}`);
  }
  return value;
}

function saveFilenameForSlot(slot: number): string {
  const which = clampSaveSlot(slot);
  const chars = SaveName.split("");
  while (chars.length <= 7) {
    chars.push("\0");
  }
  chars[7] = String(which);
  return chars.join("");
}

function saveHeaderBytes(name: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const text = name.slice(0, 31);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function composeSaveFile(headerName: string, image: Uint8Array): Uint8Array {
  const header = saveHeaderBytes(headerName);
  const bytes = new Uint8Array(header.length + image.length);
  bytes.set(header, 0);
  bytes.set(image, header.length);
  return bytes;
}

function readSaveFile(slot: number): MenuLoadFileSummary & { readonly image: Uint8Array } | null {
  const which = clampSaveSlot(slot);
  const filename = saveFilenameForSlot(which);
  const file = CA_GetVirtualFile(filename);
  if (!file || file.length < 32) {
    return null;
  }
  return {
    slot: which,
    filename,
    headerName: saveNameFromHeader(file),
    fileBytes: file.length,
    imageBytes: file.length - 32,
    image: file.slice(32),
  };
}

function saveMemoryFromOptions(options: CPSaveLoadMemoryOptions): SaveGameMemory | null {
  if (options.memory) {
    return options.memory;
  }
  if (!options.dgroup) {
    return null;
  }
  return { dgroup: options.dgroup, segments: options.segments };
}

function redrawLoadedGameStatus(dgroup: DOSMemory, options: StatusDrawOptions): LoadGameStatusRedrawSummary {
  return {
    face: DrawFace(dgroup, options),
    health: DrawHealth(dgroup, options),
    lives: DrawLives(dgroup, options),
    level: DrawLevel(dgroup, options),
    ammo: DrawAmmo(dgroup, options),
    keys: DrawKeys(dgroup, options),
    weapon: DrawWeapon(dgroup, options),
    score: DrawScore(dgroup, options),
  };
}

function drawCalibrateJoystickScreen(step: 1 | 2, options: MenuPicOptions): CalibrateJoystickScreenSummary {
  const window = DrawWindow(CALX - 5, CALY - 5, CALW, CALH, TEXTCOLOR);
  const outline = DrawOutline(CALX - 5, CALY - 5, CALW, CALH, 0, HIGHLIGHT);
  const color = VW_SetFontState({ fontcolor: 0, backcolor: TEXTCOLOR });
  const printWindow = US_RestoreWindow({
    ...US_SaveWindow(),
    x: CALX,
    y: CALY,
    w: CALW,
    h: CALH,
    px: CALX,
    py: CALY,
  });
  const heading = US_Print(`    ${STR_CALIB}\n    ${STR_JOYST}\n`);
  const picnum = step === 1 ? C_JOY1PIC : C_JOY2PIC;
  const icon = VWB_DrawPic(CALX + 40, CALY + 30, picnum, menuPicOptions(picnum, options));
  const instructionWindow = US_RestoreWindow({ ...US_SaveWindow(), px: CALX, py: CALY + 80 });
  const instruction = US_Print(step === 1 ? STR_MOVEJOY : STR_MOVEJOY2);
  const exitColor = VW_SetFontState({ fontcolor: BKGDCOLOR, backcolor: TEXTCOLOR });
  const exit = US_Print(`   ${STR_ESCEXIT}`);
  const update = VW_UpdateScreen();
  return { step, picnum, window, outline, color, printWindow, heading, icon, instructionWindow, instruction, exitColor, exit, update, finalWindow: US_SaveWindow() };
}

function controlState(): CPControlStateSummary {
  return {
    mouseenabled,
    joystickenabled,
    joystickport,
    joypadenabled,
    cusCurpos: CusItems.curpos,
  };
}

export interface ControlPanelStateOptions {
  readonly mouseenabled?: boolean;
  readonly joystickenabled?: boolean;
  readonly joypadenabled?: boolean;
  readonly joystickprogressive?: boolean;
  readonly joystickport?: number;
}

export interface ControlPanelConfigStateSummary extends CPControlStateSummary {
  readonly joystickprogressive: boolean;
}

export function SetControlPanelState(options: ControlPanelStateOptions = {}): ControlPanelConfigStateSummary {
  mouseenabled = options.mouseenabled ?? mouseenabled;
  joystickenabled = options.joystickenabled ?? joystickenabled;
  joypadenabled = options.joypadenabled ?? joypadenabled;
  joystickprogressive = options.joystickprogressive ?? joystickprogressive;
  joystickport = Math.trunc(options.joystickport ?? joystickport);
  return { ...controlState(), joystickprogressive };
}

function hasEpisodeFile(files: readonly string[], extension: string): boolean {
  const suffix = `.${extension.toUpperCase()}`;
  return files.some((file) => file.toUpperCase().endsWith(suffix));
}

function menuPicOptions(picnum: number, options: MenuPicOptions): DrawPicOptions {
  const drawOptions: { source?: Uint8Array; pictable?: Uint8Array } = {};
  const source = options.chunks?.[picnum];
  if (source) {
    drawOptions.source = source;
  }
  if (options.pictable) {
    drawOptions.pictable = options.pictable;
  }
  return drawOptions;
}

function menuOnlyPicOptions(options: MenuPicOptions): MenuPicOptions {
  return {
    chunks: options.chunks,
    pictable: options.pictable,
    maxTimerServices: options.maxTimerServices,
    inGame: options.inGame,
  };
}

function loadSaveDrawOptions(options: CPSaveGameOptions | CPLoadGameOptions): DrawLoadSaveScreenOptions {
  return {
    chunks: options.chunks,
    pictable: options.pictable,
    maxTimerServices: options.maxTimerServices,
    maxPolls: options.maxPolls,
    skipWaitKeyUp: options.skipWaitKeyUp,
  };
}

function menuGamestateFieldOffset(name: string): number {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Unknown gamestate field ${name}`);
  }
  return field[1];
}

function writeEndGameState(dgroup: DOSMemory | undefined): CPEndGameMemorySummary | null {
  pickquick = 0;
  if (!dgroup) {
    return null;
  }

  const gamestateOffset = nearOffsetForRuntimeSymbol("_gamestate");
  const livesOffset = gamestateOffset + menuGamestateFieldOffset("lives");
  const playstateOffset = nearOffsetForRuntimeSymbol("_playstate");
  dgroup.setU16(livesOffset, 0);
  dgroup.setU16(playstateOffset, ex_died);
  return {
    gamestateOffset,
    livesOffset,
    playstateOffset,
    lives: dgroup.u16(livesOffset),
    playstate: dgroup.u16(playstateOffset),
  };
}

function pendingQuickCheck(
  scancode: number,
  branch: Exclude<CPCheckQuickBranch, "none" | "endgame">,
  pendingReason: string,
): CPCheckQuickSummary {
  return {
    scancode,
    branch,
    result: 1,
    pending: true,
    pendingReason,
    font: null,
    window160: null,
    confirm: null,
    memory: null,
    border: null,
    message: null,
    save: null,
    load: null,
    quit: null,
    window200: null,
    fontState: null,
    pickquick,
    mainSaveActive: MainMenu[savegame].active,
  };
}

function menuFadeOut(): FadeSummary {
  return VL_FadeOut(0, 255, 43, 0, 0, 10);
}

function menuFadeIn(palette: Uint8Array | undefined): FadeSummary {
  if (!palette) {
    throw new Error("MenuFadeIn requires gamepal palette bytes");
  }
  return VL_FadeIn(0, 255, palette, 10);
}

function newGameSummary(
  summary: Partial<CPNewGameSummary> & {
    readonly episodeDraw: DrawNewEpisodeSummary | null;
    readonly episodeSelection: number;
    readonly episode: number | null;
    readonly episodeAllowed: boolean;
    readonly cancelled: boolean;
    readonly cancelReason: CPNewGameSummary["cancelReason"];
  },
): CPNewGameSummary {
  return {
    episodeSound: null,
    currentGameConfirm: null,
    firstFade: null,
    difficultyDraw: null,
    difficultySelection: -1,
    difficultySound: null,
    newGame: null,
    finalFade: null,
    startGame: StartGame,
    readThisActive: MainMenu[readthis].active,
    pickquick,
    ...summary,
  };
}

function selectEndString(options: CPQuitOptions): { index: number; prompt: string; rnd: readonly [number, number] | null } {
  if (options.endStringIndex !== undefined) {
    const index = Math.trunc(options.endStringIndex);
    const prompt = endStrings[index];
    if (prompt === undefined) {
      throw new RangeError(`CP_Quit: bad end string index ${index}`);
    }
    return { index, prompt, rnd: null };
  }

  const first = US_RndT();
  const second = US_RndT();
  const index = first & (0x7 + (second & 1));
  return { index, prompt: endStrings[index], rnd: [first, second] };
}

function menuItemAt(items: readonly CP_itemtype[], which: number): CP_itemtype {
  const index = Math.trunc(which);
  const item = items[index];
  if (!item) {
    throw new RangeError(`WL_MENU.C menu item ${index} is missing`);
  }
  return item;
}

function setMenuPrintPosition(item_i: CP_iteminfo, which: number): WindowSummary {
  const win = US_SaveWindow();
  return US_RestoreWindow({
    x: win.x,
    y: win.y,
    w: win.w,
    h: win.h,
    px: Math.trunc(item_i.x + item_i.indent),
    py: Math.trunc(item_i.y + Math.trunc(which) * 13),
  });
}

function newMenuControlInfo(): ControlInfo {
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

function isMenuControlHeld(ci: ControlInfo): boolean {
  return !!(
    ci.button0 ||
    ci.button1 ||
    ci.button2 ||
    ci.button3 ||
    Keyboard[sc_Space] ||
    Keyboard[sc_Enter] ||
    Keyboard[sc_Escape]
  );
}

function measureMessage(text: string): MessageMeasureSummary {
  const font = VW_MeasurePropString("", { fontnumber: 1 });
  const chars: MeasureStringSummary[] = [];
  let height = font.height;
  let width = 0;
  let maxWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i) & 0xff;
    if (ch === 10) {
      if (width > maxWidth) {
        maxWidth = width;
      }
      width = 0;
      height += font.height;
    } else {
      const measured = VW_MeasurePropString(String.fromCharCode(ch), { fontnumber: 1 });
      chars.push(measured);
      width += measured.width;
    }
  }

  if (width + 10 > maxWidth) {
    maxWidth = width + 10;
  }

  return { width, height, maxWidth, chars };
}

function menuCString(str: string | ArrayLike<number>): string {
  if (typeof str === "string") {
    const nul = str.indexOf("\x00");
    return nul === -1 ? str : str.slice(0, nul);
  }

  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str[i] & 0xff;
    if (code === 0) {
      break;
    }
    out += String.fromCharCode(code);
  }
  return out;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// ////////////////////////////////////////////////////////////////////
// //
// // WL_MENU.C
// // by John Romero (C) 1992 Id Software, Inc.
// //
// ////////////////////////////////////////////////////////////////////
// #include "wl_def.h"
// #pragma hdrstop
// 
// //
// // PRIVATE PROTOTYPES
// //
// void CP_ReadThis(void);
// 
// #ifdef SPEAR
// #define STARTITEM	newgame
// 
// #else
// #ifdef GOODTIMES
// #define STARTITEM	newgame
// 
// #else
// #define STARTITEM	readthis
// #endif
// #endif
// 
// char far endStrings[9][80]=
// {
// #ifndef SPEAR
// 	{"Dost thou wish to\nleave with such hasty\nabandon?"},
// 	{"Chickening out...\nalready?"},
// 	{"Press N for more carnage.\nPress Y to be a weenie."},
// 	{"So, you think you can\nquit this easily, huh?"},
// 	{"Press N to save the world.\nPress Y to abandon it in\nits hour of need."},
// 	{"Press N if you are brave.\nPress Y to cower in shame."},
// 	{"Heroes, press N.\nWimps, press Y."},
// 	{"You are at an intersection.\nA sign says, 'Press Y to quit.'\n>"},
// 	{"For guns and glory, press N.\nFor work and worry, press Y."}
// #else
// 	ENDSTR1,
// 	ENDSTR2,
// 	ENDSTR3,
// 	ENDSTR4,
// 	ENDSTR5,
// 	ENDSTR6,
// 	ENDSTR7,
// 	ENDSTR8,
// 	ENDSTR9
// #endif
// };
// 
// CP_iteminfo
// 	MainItems={MENU_X,MENU_Y,10,STARTITEM,24},
// 	SndItems={SM_X,SM_Y1,12,0,52},
// 	LSItems={LSM_X,LSM_Y,10,0,24},
// 	CtlItems={CTL_X,CTL_Y,6,-1,56},
// 	CusItems={8,CST_Y+13*2,9,-1,0},
// 	NewEitems={NE_X,NE_Y,11,0,88},
// 	NewItems={NM_X,NM_Y,4,2,24};
// 
// #pragma warn -sus
// CP_itemtype far
// MainMenu[]=
// {
// #ifdef JAPAN
// 	{1,"",CP_NewGame},
// 	{1,"",CP_Sound},
// 	{1,"",CP_Control},
// 	{1,"",CP_LoadGame},
// 	{0,"",CP_SaveGame},
// 	{1,"",CP_ChangeView},
// 	{2,"",CP_ReadThis},
// 	{1,"",CP_ViewScores},
// 	{1,"",0},
// 	{1,"",0}
// #else
// 
// 	{1,STR_NG,CP_NewGame},
// 	{1,STR_SD,CP_Sound},
// 	{1,STR_CL,CP_Control},
// 	{1,STR_LG,CP_LoadGame},
// 	{0,STR_SG,CP_SaveGame},
// 	{1,STR_CV,CP_ChangeView},
// 
// #ifndef GOODTIMES
// #ifndef SPEAR
// 
// 	#ifdef SPANISH
// 	{2,"Ve esto!",CP_ReadThis},
// 	#else
// 	{2,"Read This!",CP_ReadThis},
// 	#endif
// 
// #endif
// #endif
// 
// 	{1,STR_VS,CP_ViewScores},
// 	{1,STR_BD,0},
// 	{1,STR_QT,0}
// #endif
// },
// 
// far SndMenu[]=
// {
// #ifdef JAPAN
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{1,"",0},
// #else
// 	{1,STR_NONE,0},
// 	{1,STR_PC,0},
// 	{1,STR_ALSB,0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,STR_NONE,0},
// 	{1,STR_DISNEY,0},
// 	{1,STR_SB,0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,STR_NONE,0},
// 	{1,STR_ALSB,0}
// #endif
// },
// 
// far CtlMenu[]=
// {
// #ifdef JAPAN
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",MouseSensitivity},
// 	{1,"",CustomControls}
// #else
// 	{0,STR_MOUSEEN,0},
// 	{0,STR_JOYEN,0},
// 	{0,STR_PORT2,0},
// 	{0,STR_GAMEPAD,0},
// 	{0,STR_SENS,MouseSensitivity},
// 	{1,STR_CUSTOM,CustomControls}
// #endif
// },
// 
// #pragma warn +sus
// 
// #ifndef SPEAR
// far NewEmenu[]=
// {
// #ifdef JAPAN
// #ifdef JAPDEMO
// 	{1,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{0,"",0},
// #else
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0}
// #endif
// #else
// 	#ifdef SPANISH
// 	{1,"Episodio 1\n"
// 	   "Fuga desde Wolfenstein",0},
// 	{0,"",0},
// 	{3,"Episodio 2\n"
// 		   "Operacion Eisenfaust",0},
// 	{0,"",0},
// 	{3,"Episodio 3\n"
// 		   "Muere, Fuhrer, Muere!",0},
// 	{0,"",0},
// 	{3,"Episodio 4\n"
// 		  "Un Negro Secreto",0},
// 	{0,"",0},
// 	{3,"Episodio 5\n"
// 		  "Huellas del Loco",0},
// 	{0,"",0},
// 	{3,"Episodio 6\n"
// 		  "Confrontacion",0}
// 	#else
// 	{1,"Episode 1\n"
// 	   "Escape from Wolfenstein",0},
// 	{0,"",0},
// 	{3,"Episode 2\n"
// 		   "Operation: Eisenfaust",0},
// 	{0,"",0},
// 	{3,"Episode 3\n"
// 		   "Die, Fuhrer, Die!",0},
// 	{0,"",0},
// 	{3,"Episode 4\n"
// 		  "A Dark Secret",0},
// 	{0,"",0},
// 	{3,"Episode 5\n"
// 		  "Trail of the Madman",0},
// 	{0,"",0},
// 	{3,"Episode 6\n"
// 		  "Confrontation",0}
// 	#endif
// #endif
// },
// #endif
// 
// 
// far NewMenu[]=
// {
// #ifdef JAPAN
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0}
// #else
// 	{1,STR_DADDY,0},
// 	{1,STR_HURTME,0},
// 	{1,STR_BRINGEM,0},
// 	{1,STR_DEATH,0}
// #endif
// },
// 
// far LSMenu[]=
// {
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0},
// 	{1,"",0}
// },
// 
// far CusMenu[]=
// {
// 	{1,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{0,"",0},
// 	{1,"",0},
// 	{0,"",0},
// 	{1,"",0}
// }
// ;
// 
// 
// int color_hlite[]={
//    DEACTIVE,
//    HIGHLIGHT,
//    READHCOLOR,
//    0x67
//    },
// 
//    color_norml[]={
//    DEACTIVE,
//    TEXTCOLOR,
//    READCOLOR,
//    0x6b
//    };
// 
// int EpisodeSelect[6]={1};
// 
// 
// int SaveGamesAvail[10],StartGame,SoundStatus=1,pickquick;
// char SaveGameNames[10][32],SaveName[13]="SAVEGAM?.";
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // INPUT MANAGER SCANCODE TABLES
// //
// ////////////////////////////////////////////////////////////////////
// static byte
// 					*ScanNames[] =		// Scan code names with single chars
// 					{
// 	"?","?","1","2","3","4","5","6","7","8","9","0","-","+","?","?",
// 	"Q","W","E","R","T","Y","U","I","O","P","[","]","|","?","A","S",
// 	"D","F","G","H","J","K","L",";","\"","?","?","?","Z","X","C","V",
// 	"B","N","M",",",".","/","?","?","?","?","?","?","?","?","?","?",
// 	"?","?","?","?","?","?","?","?","\xf","?","-","\x15","5","\x11","+","?",
// 	"\x13","?","?","?","?","?","?","?","?","?","?","?","?","?","?","?",
// 	"?","?","?","?","?","?","?","?","?","?","?","?","?","?","?","?",
// 	"?","?","?","?","?","?","?","?","?","?","?","?","?","?","?","?"
// 					},	// DEBUG - consolidate these
// 					far ExtScanCodes[] =	// Scan codes with >1 char names
// 					{
// 	1,0xe,0xf,0x1d,0x2a,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,
// 	0x3f,0x40,0x41,0x42,0x43,0x44,0x57,0x59,0x46,0x1c,0x36,
// 	0x37,0x38,0x47,0x49,0x4f,0x51,0x52,0x53,0x45,0x48,
// 	0x50,0x4b,0x4d,0x00
// 					},
// 					*ExtScanNames[] =	// Names corresponding to ExtScanCodes
// 					{
// 	"Esc","BkSp","Tab","Ctrl","LShft","Space","CapsLk","F1","F2","F3","F4",
// 	"F5","F6","F7","F8","F9","F10","F11","F12","ScrlLk","Enter","RShft",
// 	"PrtSc","Alt","Home","PgUp","End","PgDn","Ins","Del","NumLk","Up",
// 	"Down","Left","Right",""
// 					};
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Wolfenstein Control Panel!  Ta Da!
// //
// ////////////////////////////////////////////////////////////////////
// void US_ControlPanel(byte scancode)
// {
// 	int which,i,start;
// 
// 
// 	if (ingame)
// 		if (CP_CheckQuick(scancode))
// 			return;
// 
// 	StartCPMusic(MENUSONG);
// 	SetupControlPanel();
// 
// 	//
// 	// F-KEYS FROM WITHIN GAME
// 	//
// 	switch(scancode)
// 	{
// 		case sc_F1:
// 			#ifdef SPEAR
// 			BossKey();
// 			#else
// 			#ifdef GOODTIMES
// 			BossKey();
// 			#else
// 			HelpScreens();
// 			#endif
// 			#endif
// 			goto finishup;
// 
// 		case sc_F2:
// 			CP_SaveGame(0);
// 			goto finishup;
// 
// 		case sc_F3:
// 			CP_LoadGame(0);
// 			goto finishup;
// 
// 		case sc_F4:
// 			CP_Sound();
// 			goto finishup;
// 
// 		case sc_F5:
// 			CP_ChangeView();
// 			goto finishup;
// 
// 		case sc_F6:
// 			CP_Control();
// 			goto finishup;
// 
// 		finishup:
// 			CleanupControlPanel();
// 			#ifdef SPEAR
// 			UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 			#endif
// 			return;
// 	}
// 
// #ifdef SPEAR
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// 
// 	DrawMainMenu();
// 	MenuFadeIn();
// 	StartGame=0;
// 
// 	//
// 	// MAIN MENU LOOP
// 	//
// 	do
// 	{
// 		which=HandleMenu(&MainItems,&MainMenu[0],NULL);
// 
// 		#ifdef SPEAR
// 		#ifndef SPEARDEMO
// 		//
// 		// EASTER EGG FOR SPEAR OF DESTINY!
// 		//
// 		if (Keyboard[sc_I] && Keyboard[sc_D])
// 		{
// 			VW_FadeOut();
// 			StartCPMusic (XJAZNAZI_MUS);
// 			UnCacheLump(OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 			UnCacheLump(BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 			MM_SortMem ();
// 			ClearMemory ();
// 
// 
// 			CA_CacheGrChunk (IDGUYS1PIC);
// 			VWB_DrawPic(0,0,IDGUYS1PIC);
// 			UNCACHEGRCHUNK(IDGUYS1PIC);
// 
// 			CA_CacheGrChunk (IDGUYS2PIC);
// 			VWB_DrawPic(0,80,IDGUYS2PIC);
// 			UNCACHEGRCHUNK(IDGUYS2PIC);
// 
// 			VW_UpdateScreen();
// 
// 			CA_CacheGrChunk (IDGUYSPALETTE);
// 			VL_FadeIn(0,255,grsegs[IDGUYSPALETTE],30);
// 			UNCACHEGRCHUNK(IDGUYSPALETTE);
// 
// 			while (Keyboard[sc_I] || Keyboard[sc_D]);
// 			IN_ClearKeysDown();
// 			IN_Ack();
// 
// 			VW_FadeOut();
// 
// 			CacheLump(BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 			CacheLump(OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 			DrawMainMenu();
// 			StartCPMusic (MENUSONG);
// 			MenuFadeIn();
// 		}
// 		#endif
// 		#endif
// 
// 		switch(which)
// 		{
// 			case viewscores:
// 				if (MainMenu[viewscores].routine == NULL)
// 					if (CP_EndGame())
// 						StartGame=1;
// 
// 				DrawMainMenu();
// 				MenuFadeIn();
// 				break;
// 
// 			case backtodemo:
// 				#ifdef SPEAR
// 				if (!ingame)
// 				{
// 					//
// 					// DEALLOCATE ALL SOUNDS!
// 					//
// 					switch (SoundMode)
// 					{
// 						case sdm_PC:
// 							start = STARTPCSOUNDS;
// 							break;
// 						case sdm_AdLib:
// 							start = STARTADLIBSOUNDS;
// 							break;
// 					}
// 
// 					if (SoundMode != sdm_Off)
// 						for (i=0;i<NUMSOUNDS;i++,start++)
// 							if (audiosegs[start])
// 								MM_SetPurge (&(memptr)audiosegs[start],3);		// make purgable
// 				}
// 				#endif
// 
// 				MM_SortMem();
// 				StartGame=1;
// 				if (!ingame)
// 					StartCPMusic(INTROSONG);
// 				VL_FadeOut(0,255,0,0,0,10);
// 				break;
// 
// 			case -1:
// 			case quit:
// 				CP_Quit();
// 				break;
// 
// 			default:
// 				if (!StartGame)
// 				{
// 					DrawMainMenu();
// 					MenuFadeIn();
// 				}
// 		}
// 
// 	//
// 	// "EXIT OPTIONS" OR "NEW GAME" EXITS
// 	//
// 	} while(!StartGame);
// 
// 	//
// 	// DEALLOCATE EVERYTHING
// 	//
// 	CleanupControlPanel();
// 
// 	//
// 	// CHANGE MAINMENU ITEM
// 	//
// 	if (startgame || loadedgame)
// 	{
// 		#pragma warn -sus
// 		MainMenu[viewscores].routine = NULL;
// 		#ifndef JAPAN
// 		_fstrcpy(MainMenu[viewscores].string,STR_EG);
// 		#endif
// 		#pragma warn +sus
// 	}
// 
// 	// RETURN/START GAME EXECUTION
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	MM_SortMem ();
// #endif
// }
// 
// 
// ////////////////////////
// //
// // DRAW MAIN MENU SCREEN
// //
// void DrawMainMenu(void)
// {
// #ifdef JAPAN
// 	CA_CacheScreen(S_OPTIONSPIC);
// #else
// 	ClearMScreen();
// 
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 	DrawStripes(10);
// 	VWB_DrawPic(84,0,C_OPTIONSPIC);
// 
// 	#ifdef SPANISH
// 	DrawWindow(MENU_X-8,MENU_Y-3,MENU_W+8,MENU_H,BKGDCOLOR);
// 	#else
// 	DrawWindow(MENU_X-8,MENU_Y-3,MENU_W,MENU_H,BKGDCOLOR);
// 	#endif
// #endif
// 
// 	//
// 	// CHANGE "GAME" AND "DEMO"
// 	//
// 	if (ingame)
// 	{
// 		#ifndef JAPAN
// 
// 		#ifdef SPANISH
// 		_fstrcpy(&MainMenu[backtodemo].string,STR_GAME);
// 		#else
// 		_fstrcpy(&MainMenu[backtodemo].string[8],STR_GAME);
// 		#endif
// 
// 		#else
// 		CA_CacheGrChunk(C_MRETGAMEPIC);
// 		VWB_DrawPic(12*8,20*8,C_MRETGAMEPIC);
// 		UNCACHEGRCHUNK(C_MRETGAMEPIC);
// 		CA_CacheGrChunk(C_MENDGAMEPIC);
// 		VWB_DrawPic(12*8,18*8,C_MENDGAMEPIC);
// 		UNCACHEGRCHUNK(C_MENDGAMEPIC);
// 		#endif
// 		MainMenu[backtodemo].active=2;
// 	}
// 	else
// 	{
// 		#ifndef JAPAN
// 		#ifdef SPANISH
// 		_fstrcpy(&MainMenu[backtodemo].string,STR_BD);
// 		#else
// 		_fstrcpy(&MainMenu[backtodemo].string[8],STR_DEMO);
// 		#endif
// 		#else
// 		CA_CacheGrChunk(C_MRETDEMOPIC);
// 		VWB_DrawPic(12*8,20*8,C_MRETDEMOPIC);
// 		UNCACHEGRCHUNK(C_MRETDEMOPIC);
// 		CA_CacheGrChunk(C_MSCORESPIC);
// 		VWB_DrawPic(12*8,18*8,C_MSCORESPIC);
// 		UNCACHEGRCHUNK(C_MSCORESPIC);
// 		#endif
// 		MainMenu[backtodemo].active=1;
// 	}
// 
// 	DrawMenu(&MainItems,&MainMenu[0]);
// 	VW_UpdateScreen();
// }
// 
// #ifndef GOODTIMES
// #ifndef SPEAR
// ////////////////////////////////////////////////////////////////////
// //
// // READ THIS!
// //
// ////////////////////////////////////////////////////////////////////
// void CP_ReadThis(void)
// {
// 	StartCPMusic(CORNER_MUS);
// 	HelpScreens();
// 	StartCPMusic(MENUSONG);
// }
// #endif
// #endif
// 
// #ifndef SPEAR
// #ifndef GOODTIMES
// #else
// ////////////////////////////////////////////////////////////////////
// //
// // BOSS KEY
// //
// ////////////////////////////////////////////////////////////////////
// void BossKey(void)
// {
// 	SD_MusicOff();
// 	_AX = 3;
// 	geninterrupt(0x10);
// 	printf("C>");
// 	while (!Keyboard[sc_Escape])
// 	IN_ClearKeysDown();
// 
// 	SD_MusicOn();
// 	VL_SetVGAPlaneMode ();
// 	VL_TestPaletteSet ();
// 	VL_SetPalette (&gamepal);
// 	LoadLatchMem();
// }
// #endif
// #endif
// 
// ////////////////////////////////////////////////////////////////////
// //
// // CHECK QUICK-KEYS & QUIT (WHILE IN A GAME)
// //
// ////////////////////////////////////////////////////////////////////
// int CP_CheckQuick(unsigned scancode)
// {
// 	switch(scancode)
// 	{
// 		//
// 		// END GAME
// 		//
// 		case sc_F7:
// 			CA_CacheGrChunk(STARTFONT+1);
// 
// 			WindowH=160;
// 			#ifdef JAPAN
// 			if (GetYorN(7,8,C_JAPQUITPIC))
// 			#else
// 			if (Confirm(ENDGAMESTR))
// 			#endif
// 			{
// 				playstate = ex_died;
// 				pickquick = gamestate.lives = 0;
// 			}
// 
// 			DrawAllPlayBorder();
// 			WindowH=200;
// 			fontnumber=0;
// 			MainMenu[savegame].active = 0;
// 			return 1;
// 
// 		//
// 		// QUICKSAVE
// 		//
// 		case sc_F8:
// 			if (SaveGamesAvail[LSItems.curpos] && pickquick)
// 			{
// 				CA_CacheGrChunk(STARTFONT+1);
// 				fontnumber = 1;
// 				Message(STR_SAVING"...");
// 				CP_SaveGame(1);
// 				fontnumber=0;
// 			}
// 			else
// 			{
// 				#ifndef SPEAR
// 				CA_CacheGrChunk(STARTFONT+1);
// 				CA_CacheGrChunk(C_CURSOR1PIC);
// 				CA_CacheGrChunk(C_CURSOR2PIC);
// 				CA_CacheGrChunk(C_DISKLOADING1PIC);
// 				CA_CacheGrChunk(C_DISKLOADING2PIC);
// 				CA_CacheGrChunk(C_SAVEGAMEPIC);
// 				CA_CacheGrChunk(C_MOUSELBACKPIC);
// 				#else
// 				CacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 				CA_CacheGrChunk(C_CURSOR1PIC);
// 				#endif
// 
// 				VW_FadeOut ();
// 
// 				StartCPMusic(MENUSONG);
// 				pickquick=CP_SaveGame(0);
// 
// 				SETFONTCOLOR(0,15);
// 				IN_ClearKeysDown();
// 				DrawPlayScreen ();
// 
// 				if (!startgame && !loadedgame)
// 				{
// 					VW_FadeIn ();
// 					StartMusic ();
// 				}
// 
// 				if (loadedgame)
// 					playstate = ex_abort;
// 				lasttimecount = TimeCount;
// 
// 				if (MousePresent)
// 					Mouse(MDelta);	// Clear accumulated mouse movement
// 
// 				PM_CheckMainMem ();
// 
// 				#ifndef SPEAR
// 				UNCACHEGRCHUNK(C_CURSOR1PIC);
// 				UNCACHEGRCHUNK(C_CURSOR2PIC);
// 				UNCACHEGRCHUNK(C_DISKLOADING1PIC);
// 				UNCACHEGRCHUNK(C_DISKLOADING2PIC);
// 				UNCACHEGRCHUNK(C_SAVEGAMEPIC);
// 				UNCACHEGRCHUNK(C_MOUSELBACKPIC);
// 				#else
// 				UnCacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 				#endif
// 			}
// 			return 1;
// 
// 		//
// 		// QUICKLOAD
// 		//
// 		case sc_F9:
// 			if (SaveGamesAvail[LSItems.curpos] && pickquick)
// 			{
// 				char string[100]=STR_LGC;
// 
// 
// 				CA_CacheGrChunk(STARTFONT+1);
// 				fontnumber = 1;
// 
// 				strcat(string,SaveGameNames[LSItems.curpos]);
// 				strcat(string,"\"?");
// 
// 				if (Confirm(string))
// 					CP_LoadGame(1);
// 
// 				DrawAllPlayBorder();
// 				fontnumber=0;
// 			}
// 			else
// 			{
// 				#ifndef SPEAR
// 				CA_CacheGrChunk(STARTFONT+1);
// 				CA_CacheGrChunk(C_CURSOR1PIC);
// 				CA_CacheGrChunk(C_CURSOR2PIC);
// 				CA_CacheGrChunk(C_DISKLOADING1PIC);
// 				CA_CacheGrChunk(C_DISKLOADING2PIC);
// 				CA_CacheGrChunk(C_LOADGAMEPIC);
// 				CA_CacheGrChunk(C_MOUSELBACKPIC);
// 				#else
// 				CA_CacheGrChunk(C_CURSOR1PIC);
// 				CacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 				#endif
// 
// 				VW_FadeOut ();
// 
// 				StartCPMusic(MENUSONG);
// 				pickquick=CP_LoadGame(0);
// 
// 				SETFONTCOLOR(0,15);
// 				IN_ClearKeysDown();
// 				DrawPlayScreen ();
// 
// 				if (!startgame && !loadedgame)
// 				{
// 					VW_FadeIn ();
// 					StartMusic ();
// 				}
// 
// 				if (loadedgame)
// 					playstate = ex_abort;
// 
// 				lasttimecount = TimeCount;
// 
// 				if (MousePresent)
// 					Mouse(MDelta);	// Clear accumulated mouse movement
// 				PM_CheckMainMem ();
// 
// 				#ifndef SPEAR
// 				UNCACHEGRCHUNK(C_CURSOR1PIC);
// 				UNCACHEGRCHUNK(C_CURSOR2PIC);
// 				UNCACHEGRCHUNK(C_DISKLOADING1PIC);
// 				UNCACHEGRCHUNK(C_DISKLOADING2PIC);
// 				UNCACHEGRCHUNK(C_LOADGAMEPIC);
// 				UNCACHEGRCHUNK(C_MOUSELBACKPIC);
// 				#else
// 				UnCacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 				#endif
// 			}
// 			return 1;
// 
// 		//
// 		// QUIT
// 		//
// 		case sc_F10:
// 			CA_CacheGrChunk(STARTFONT+1);
// 
// 			WindowX=WindowY=0;
// 			WindowW=320;
// 			WindowH=160;
// 			#ifdef JAPAN
// 			if (GetYorN(7,8,C_QUITMSGPIC))
// 			#else
// 				#ifdef SPANISH
// 			if (Confirm(ENDGAMESTR))
// 				#else
// 			if (Confirm(endStrings[US_RndT()&0x7+(US_RndT()&1)]))
// 				#endif
// 			#endif
// 			{
// 				int i;
// 
// 
// 				VW_UpdateScreen();
// 				SD_MusicOff();
// 				SD_StopSound();
// 				MenuFadeOut();
// 
// 				//
// 				// SHUT-UP THE ADLIB
// 				//
// 				for (i=1;i<=0xf5;i++)
// 					alOut(i,0);
// 				Quit(NULL);
// 			}
// 
// 			DrawAllPlayBorder();
// 			WindowH=200;
// 			fontnumber=0;
// 			return 1;
// 		}
// 
// 	return 0;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // END THE CURRENT GAME
// //
// ////////////////////////////////////////////////////////////////////
// int CP_EndGame(void)
// {
// #ifdef JAPAN
// 	if (!GetYorN(7,8,C_JAPQUITPIC))
// #else
// 	if (!Confirm(ENDGAMESTR))
// #endif
// 		return 0;
// 
// 	pickquick = gamestate.lives = 0;
// 	playstate = ex_died;
// 
// 	#pragma warn -sus
// 	MainMenu[savegame].active = 0;
// 	MainMenu[viewscores].routine=CP_ViewScores;
// 	#ifndef JAPAN
// 	_fstrcpy(MainMenu[viewscores].string,STR_VS);
// 	#endif
// 	#pragma warn +sus
// 
// 	return 1;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // VIEW THE HIGH SCORES
// //
// ////////////////////////////////////////////////////////////////////
// void CP_ViewScores(void)
// {
// 	fontnumber=0;
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	StartCPMusic (XAWARD_MUS);
// #else
// 	StartCPMusic (ROSTER_MUS);
// #endif
// 
// 	DrawHighScores ();
// 	VW_UpdateScreen ();
// 	MenuFadeIn();
// 	fontnumber=1;
// 
// 	IN_Ack();
// 
// 	StartCPMusic(MENUSONG);
// 	MenuFadeOut();
// 
// #ifdef SPEAR
// 	CacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // START A NEW GAME
// //
// ////////////////////////////////////////////////////////////////////
// void CP_NewGame(void)
// {
// 	int which,episode;
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// 
// 
// #ifndef SPEAR
// firstpart:
// 
// 	DrawNewEpisode();
// 	do
// 	{
// 		which=HandleMenu(&NewEitems,&NewEmenu[0],NULL);
// 		switch(which)
// 		{
// 			case -1:
// 				MenuFadeOut();
// 				return;
// 
// 			default:
// 				if (!EpisodeSelect[which/2])
// 				{
// 					SD_PlaySound (NOWAYSND);
// 					Message("Please select \"Read This!\"\n"
// 							"from the Options menu to\n"
// 							"find out how to order this\n"
// 							"episode from Apogee.");
// 					IN_ClearKeysDown();
// 					IN_Ack();
// 					DrawNewEpisode();
// 					which = 0;
// 				}
// 				else
// 				{
// 					episode = which/2;
// 					which = 1;
// 				}
// 				break;
// 		}
// 
// 	} while (!which);
// 
// 	ShootSnd();
// 
// 	//
// 	// ALREADY IN A GAME?
// 	//
// 	if (ingame)
// 		#ifdef JAPAN
// 		if (!GetYorN(7,8,C_JAPNEWGAMEPIC))
// 		#else
// 		if (!Confirm(CURGAME))
// 		#endif
// 		{
// 			MenuFadeOut();
// 			return;
// 		}
// 
// 	MenuFadeOut();
// 
// #else
// 	episode = 0;
// 
// 	//
// 	// ALREADY IN A GAME?
// 	//
// 	CacheLump (NEWGAME_LUMP_START,NEWGAME_LUMP_END);
// 	DrawNewGame();
// 	if (ingame)
// 		if (!Confirm(CURGAME))
// 		{
// 			MenuFadeOut();
// 			UnCacheLump (NEWGAME_LUMP_START,NEWGAME_LUMP_END);
// 			CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 			return;
// 		}
// 
// #endif
// 
// 	DrawNewGame();
// 	which=HandleMenu(&NewItems,&NewMenu[0],DrawNewGameDiff);
// 	if (which<0)
// 	{
// 		MenuFadeOut();
// 		#ifndef SPEAR
// 		goto firstpart;
// 		#else
// 		UnCacheLump (NEWGAME_LUMP_START,NEWGAME_LUMP_END);
// 		CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 		return;
// 		#endif
// 	}
// 
// 	ShootSnd();
// 	NewGame(which,episode);
// 	StartGame=1;
// 	MenuFadeOut();
// 
// 	//
// 	// CHANGE "READ THIS!" TO NORMAL COLOR
// 	//
// 	#ifndef SPEAR
// 	#ifndef GOODTIMES
// 	MainMenu[readthis].active=1;
// 	#endif
// 	#endif
// 
// 	pickquick = 0;
// 
// #ifdef SPEAR
// 	UnCacheLump (NEWGAME_LUMP_START,NEWGAME_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// }
// 
// 
// #ifndef SPEAR
// /////////////////////
// //
// // DRAW NEW EPISODE MENU
// //
// void DrawNewEpisode(void)
// {
// 	int i;
// 
// #ifdef JAPAN
// 	CA_CacheScreen(S_EPISODEPIC);
// #else
// 	ClearMScreen();
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 
// 	DrawWindow(NE_X-4,NE_Y-4,NE_W+8,NE_H+8,BKGDCOLOR);
// 	SETFONTCOLOR(READHCOLOR,BKGDCOLOR);
// 	PrintY=2;
// 	WindowX=0;
// 	#ifdef SPANISH
// 	US_CPrint("Cual episodio jugar?");
// 	#else
// 	US_CPrint("Which episode to play?");
// 	#endif
// #endif
// 
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	DrawMenu(&NewEitems,&NewEmenu[0]);
// 
// 	for (i=0;i<6;i++)
// 		VWB_DrawPic(NE_X+32,NE_Y+i*26,C_EPISODE1PIC+i);
// 
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// 	WaitKeyUp();
// }
// #endif
// 
// /////////////////////
// //
// // DRAW NEW GAME MENU
// //
// void DrawNewGame(void)
// {
// #ifdef JAPAN
// 	CA_CacheScreen(S_SKILLPIC);
// #else
// 	ClearMScreen();
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 
// 	SETFONTCOLOR(READHCOLOR,BKGDCOLOR);
// 	PrintX=NM_X+20;
// 	PrintY=NM_Y-32;
// 
// #ifndef SPEAR
// 	#ifdef SPANISH
// 	US_Print("Eres macho?");
// 	#else
// 	US_Print("How tough are you?");
// 	#endif
// #else
// 	VWB_DrawPic (PrintX,PrintY,C_HOWTOUGHPIC);
// #endif
// 
// 	DrawWindow(NM_X-5,NM_Y-10,NM_W,NM_H,BKGDCOLOR);
// #endif
// 
// 	DrawMenu(&NewItems,&NewMenu[0]);
// 	DrawNewGameDiff(NewItems.curpos);
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// 	WaitKeyUp();
// }
// 
// 
// ////////////////////////
// //
// // DRAW NEW GAME GRAPHIC
// //
// void DrawNewGameDiff(int w)
// {
// 	VWB_DrawPic(NM_X+185,NM_Y+7,w+C_BABYMODEPIC);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // HANDLE SOUND MENU
// //
// ////////////////////////////////////////////////////////////////////
// void CP_Sound(void)
// {
// 	int which,i;
// 
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	CacheLump (SOUND_LUMP_START,SOUND_LUMP_END);
// #endif
// 
// 	DrawSoundMenu();
// 	MenuFadeIn();
// 	WaitKeyUp();
// 
// 	do
// 	{
// 		which=HandleMenu(&SndItems,&SndMenu[0],NULL);
// 		//
// 		// HANDLE MENU CHOICES
// 		//
// 		switch(which)
// 		{
// 			//
// 			// SOUND EFFECTS
// 			//
// 			case 0:
// 				if (SoundMode!=sdm_Off)
// 				{
// 					SD_WaitSoundDone();
// 					SD_SetSoundMode(sdm_Off);
// 					DrawSoundMenu();
// 				}
// 				break;
// 			case 1:
// 				if (SoundMode!=sdm_PC)
// 				{
// 					SD_WaitSoundDone();
// 					SD_SetSoundMode(sdm_PC);
// 					CA_LoadAllSounds();
// 					DrawSoundMenu();
// 					ShootSnd();
// 				}
// 				break;
// 			case 2:
// 				if (SoundMode!=sdm_AdLib)
// 				{
// 					SD_WaitSoundDone();
// 					SD_SetSoundMode(sdm_AdLib);
// 					CA_LoadAllSounds();
// 					DrawSoundMenu();
// 					ShootSnd();
// 				}
// 				break;
// 
// 			//
// 			// DIGITIZED SOUND
// 			//
// 			case 5:
// 				if (DigiMode!=sds_Off)
// 				{
// 					SD_SetDigiDevice(sds_Off);
// 					DrawSoundMenu();
// 				}
// 				break;
// 			case 6:
// 				if (DigiMode!=sds_SoundSource)
// 				{
// 					SD_SetDigiDevice(sds_SoundSource);
// 					DrawSoundMenu();
// 					ShootSnd();
// 				}
// 				break;
// 			case 7:
// 				if (DigiMode!=sds_SoundBlaster)
// 				{
// 					SD_SetDigiDevice(sds_SoundBlaster);
// 					DrawSoundMenu();
// 					ShootSnd();
// 				}
// 				break;
// 
// 			//
// 			// MUSIC
// 			//
// 			case 10:
// 				if (MusicMode!=smm_Off)
// 				{
// 					SD_SetMusicMode(smm_Off);
// 					DrawSoundMenu();
// 					ShootSnd();
// 				}
// 				break;
// 			case 11:
// 				if (MusicMode!=smm_AdLib)
// 				{
// 					SD_SetMusicMode(smm_AdLib);
// 					DrawSoundMenu();
// 					ShootSnd();
// 					StartCPMusic(MENUSONG);
// 				}
// 				break;
// 		}
// 	} while(which>=0);
// 
// 	MenuFadeOut();
// 
// #ifdef SPEAR
// 	UnCacheLump (SOUND_LUMP_START,SOUND_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// }
// 
// 
// //////////////////////
// //
// // DRAW THE SOUND MENU
// //
// void DrawSoundMenu(void)
// {
// 	int i,on;
// 
// 
// #ifdef JAPAN
// 	CA_CacheScreen(S_SOUNDPIC);
// #else
// 	//
// 	// DRAW SOUND MENU
// 	//
// 	ClearMScreen();
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 
// 	DrawWindow(SM_X-8,SM_Y1-3,SM_W,SM_H1,BKGDCOLOR);
// 	DrawWindow(SM_X-8,SM_Y2-3,SM_W,SM_H2,BKGDCOLOR);
// 	DrawWindow(SM_X-8,SM_Y3-3,SM_W,SM_H3,BKGDCOLOR);
// #endif
// 
// 	//
// 	// IF NO ADLIB, NON-CHOOSENESS!
// 	//
// 	if (!AdLibPresent && !SoundBlasterPresent)
// 	{
// 		SndMenu[2].active=SndMenu[10].active=SndMenu[11].active=0;
// 	}
// 
// 	if (!SoundSourcePresent)
// 		SndMenu[6].active=0;
// 
// 	if (!SoundBlasterPresent)
// 		SndMenu[7].active=0;
// 
// 	if (!SoundSourcePresent && !SoundBlasterPresent)
// 		SndMenu[5].active=0;
// 
// 	DrawMenu(&SndItems,&SndMenu[0]);
// #ifndef JAPAN
// 	VWB_DrawPic(100,SM_Y1-20,C_FXTITLEPIC);
// 	VWB_DrawPic(100,SM_Y2-20,C_DIGITITLEPIC);
// 	VWB_DrawPic(100,SM_Y3-20,C_MUSICTITLEPIC);
// #endif
// 
// 	for (i=0;i<SndItems.amount;i++)
// #ifdef JAPAN
// 		if (i!=3 && i!=4 && i!=8 && i!=9)
// #else
// 		if (SndMenu[i].string[0])
// #endif
// 		{
// 			//
// 			// DRAW SELECTED/NOT SELECTED GRAPHIC BUTTONS
// 			//
// 			on=0;
// 			switch(i)
// 			{
// 				//
// 				// SOUND EFFECTS
// 				//
// 				case 0: if (SoundMode==sdm_Off) on=1; break;
// 				case 1: if (SoundMode==sdm_PC) on=1; break;
// 				case 2: if (SoundMode==sdm_AdLib) on=1; break;
// 
// 				//
// 				// DIGITIZED SOUND
// 				//
// 				case 5: if (DigiMode==sds_Off) on=1; break;
// 				case 6: if (DigiMode==sds_SoundSource) on=1; break;
// 				case 7: if (DigiMode==sds_SoundBlaster) on=1; break;
// 
// 				//
// 				// MUSIC
// 				//
// 				case 10: if (MusicMode==smm_Off) on=1; break;
// 				case 11: if (MusicMode==smm_AdLib) on=1; break;
// 			}
// 
// 			if (on)
// 				VWB_DrawPic(SM_X+24,SM_Y1+i*13+2,C_SELECTEDPIC);
// 			else
// 				VWB_DrawPic(SM_X+24,SM_Y1+i*13+2,C_NOTSELECTEDPIC);
// 		}
// 
// 	DrawMenuGun(&SndItems);
// 	VW_UpdateScreen();
// }
// 
// 
// //
// // DRAW LOAD/SAVE IN PROGRESS
// //
// void DrawLSAction(int which)
// {
// 	#define LSA_X	96
// 	#define LSA_Y	80
// 	#define LSA_W	130
// 	#define LSA_H	42
// 
// 	DrawWindow(LSA_X,LSA_Y,LSA_W,LSA_H,TEXTCOLOR);
// 	DrawOutline(LSA_X,LSA_Y,LSA_W,LSA_H,0,HIGHLIGHT);
// 	VWB_DrawPic(LSA_X+8,LSA_Y+5,C_DISKLOADING1PIC);
// 
// 	fontnumber=1;
// 	SETFONTCOLOR(0,TEXTCOLOR);
// 	PrintX=LSA_X+46;
// 	PrintY=LSA_Y+13;
// 
// 	if (!which)
// 		US_Print(STR_LOADING"...");
// 	else
// 		US_Print(STR_SAVING"...");
// 
// 	VW_UpdateScreen();
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // LOAD SAVED GAMES
// //
// ////////////////////////////////////////////////////////////////////
// int CP_LoadGame(int quick)
// {
// 	int handle,which,exit=0;
// 	char name[13];
// 
// 
// 	strcpy(name,SaveName);
// 
// 	//
// 	// QUICKLOAD?
// 	//
// 	if (quick)
// 	{
// 		which=LSItems.curpos;
// 
// 		if (SaveGamesAvail[which])
// 		{
// 			name[7]=which+'0';
// 			handle=open(name,O_BINARY);
// 			lseek(handle,32,SEEK_SET);
// 			loadedgame=true;
// 			LoadTheGame(handle,0,0);
// 			loadedgame=false;
// 			close(handle);
// 
// 			DrawFace ();
// 			DrawHealth ();
// 			DrawLives ();
// 			DrawLevel ();
// 			DrawAmmo ();
// 			DrawKeys ();
// 			DrawWeapon ();
// 			DrawScore ();
// 			return 1;
// 		}
// 	}
// 
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	CacheLump (LOADSAVE_LUMP_START,LOADSAVE_LUMP_END);
// #endif
// 
// 	DrawLoadSaveScreen(0);
// 
// 	do
// 	{
// 		which=HandleMenu(&LSItems,&LSMenu[0],TrackWhichGame);
// 		if (which>=0 && SaveGamesAvail[which])
// 		{
// 			ShootSnd();
// 			name[7]=which+'0';
// 
// 			handle=open(name,O_BINARY);
// 			lseek(handle,32,SEEK_SET);
// 
// 			DrawLSAction(0);
// 			loadedgame=true;
// 
// 			LoadTheGame(handle,LSA_X+8,LSA_Y+5);
// 			close(handle);
// 
// 			StartGame=1;
// 			ShootSnd();
// 			//
// 			// CHANGE "READ THIS!" TO NORMAL COLOR
// 			//
// 
// 			#ifndef SPEAR
// 			#ifndef GOODTIMES
// 			MainMenu[readthis].active=1;
// 			#endif
// 			#endif
// 
// 			exit=1;
// 			break;
// 		}
// 
// 	} while(which>=0);
// 
// 	MenuFadeOut();
// 
// #ifdef SPEAR
// 	UnCacheLump (LOADSAVE_LUMP_START,LOADSAVE_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// 
// 	return exit;
// }
// 
// 
// ///////////////////////////////////
// //
// // HIGHLIGHT CURRENT SELECTED ENTRY
// //
// void TrackWhichGame(int w)
// {
// 	static int lastgameon=0;
// 
// 	PrintLSEntry(lastgameon,TEXTCOLOR);
// 	PrintLSEntry(w,HIGHLIGHT);
// 
// 	lastgameon=w;
// }
// 
// 
// ////////////////////////////
// //
// // DRAW THE LOAD/SAVE SCREEN
// //
// void DrawLoadSaveScreen(int loadsave)
// {
// 	#define DISKX	100
// 	#define DISKY	0
// 
// 	int i;
// 
// 
// 	ClearMScreen();
// 	fontnumber=1;
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 	DrawWindow(LSM_X-10,LSM_Y-5,LSM_W,LSM_H,BKGDCOLOR);
// 	DrawStripes(10);
// 
// 	if (!loadsave)
// 		VWB_DrawPic(60,0,C_LOADGAMEPIC);
// 	else
// 		VWB_DrawPic(60,0,C_SAVEGAMEPIC);
// 
// 	for (i=0;i<10;i++)
// 		PrintLSEntry(i,TEXTCOLOR);
// 
// 	DrawMenu(&LSItems,&LSMenu[0]);
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// 	WaitKeyUp();
// }
// 
// 
// ///////////////////////////////////////////
// //
// // PRINT LOAD/SAVE GAME ENTRY W/BOX OUTLINE
// //
// void PrintLSEntry(int w,int color)
// {
// 	SETFONTCOLOR(color,BKGDCOLOR);
// 	DrawOutline(LSM_X+LSItems.indent,LSM_Y+w*13,LSM_W-LSItems.indent-15,11,color,color);
// 	PrintX=LSM_X+LSItems.indent+2;
// 	PrintY=LSM_Y+w*13+1;
// 	fontnumber=0;
// 
// 	if (SaveGamesAvail[w])
// 		US_Print(SaveGameNames[w]);
// 	else
// 		US_Print("      - "STR_EMPTY" -");
// 
// 	fontnumber=1;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // SAVE CURRENT GAME
// //
// ////////////////////////////////////////////////////////////////////
// int CP_SaveGame(int quick)
// {
// 	int handle,which,exit=0;
// 	unsigned nwritten;
// 	char name[13],input[32];
// 
// 
// 	strcpy(name,SaveName);
// 
// 	//
// 	// QUICKSAVE?
// 	//
// 	if (quick)
// 	{
// 		which=LSItems.curpos;
// 
// 		if (SaveGamesAvail[which])
// 		{
// 			name[7]=which+'0';
// 			unlink(name);
// 			handle=creat(name,S_IREAD|S_IWRITE);
// 
// 			strcpy(input,&SaveGameNames[which][0]);
// 
// 			_dos_write(handle,(void far *)input,32,&nwritten);
// 			lseek(handle,32,SEEK_SET);
// 			SaveTheGame(handle,0,0);
// 			close(handle);
// 
// 			return 1;
// 		}
// 	}
// 
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	CacheLump (LOADSAVE_LUMP_START,LOADSAVE_LUMP_END);
// #endif
// 
// 	DrawLoadSaveScreen(1);
// 
// 	do
// 	{
// 		which=HandleMenu(&LSItems,&LSMenu[0],TrackWhichGame);
// 		if (which>=0)
// 		{
// 			//
// 			// OVERWRITE EXISTING SAVEGAME?
// 			//
// 			if (SaveGamesAvail[which])
// 				#ifdef JAPAN
// 				if (!GetYorN(7,8,C_JAPSAVEOVERPIC))
// 				#else
// 				if (!Confirm(GAMESVD))
// 				#endif
// 				{
// 					DrawLoadSaveScreen(1);
// 					continue;
// 				}
// 				else
// 				{
// 					DrawLoadSaveScreen(1);
// 					PrintLSEntry(which,HIGHLIGHT);
// 					VW_UpdateScreen();
// 				}
// 
// 			ShootSnd();
// 
// 			strcpy(input,&SaveGameNames[which][0]);
// 			name[7]=which+'0';
// 
// 			fontnumber=0;
// 			if (!SaveGamesAvail[which])
// 				VWB_Bar(LSM_X+LSItems.indent+1,LSM_Y+which*13+1,LSM_W-LSItems.indent-16,10,BKGDCOLOR);
// 			VW_UpdateScreen();
// 
// 			if (US_LineInput(LSM_X+LSItems.indent+2,LSM_Y+which*13+1,input,input,true,31,LSM_W-LSItems.indent-30))
// 			{
// 				SaveGamesAvail[which]=1;
// 				strcpy(&SaveGameNames[which][0],input);
// 
// 				unlink(name);
// 				handle=creat(name,S_IREAD|S_IWRITE);
// 				_dos_write(handle,(void far *)input,32,&nwritten);
// 				lseek(handle,32,SEEK_SET);
// 
// 				DrawLSAction(1);
// 				SaveTheGame(handle,LSA_X+8,LSA_Y+5);
// 
// 				close(handle);
// 
// 				ShootSnd();
// 				exit=1;
// 			}
// 			else
// 			{
// 				VWB_Bar(LSM_X+LSItems.indent+1,LSM_Y+which*13+1,LSM_W-LSItems.indent-16,10,BKGDCOLOR);
// 				PrintLSEntry(which,HIGHLIGHT);
// 				VW_UpdateScreen();
// 				SD_PlaySound(ESCPRESSEDSND);
// 				continue;
// 			}
// 
// 			fontnumber=1;
// 			break;
// 		}
// 
// 	} while(which>=0);
// 
// 	MenuFadeOut();
// 
// #ifdef SPEAR
// 	UnCacheLump (LOADSAVE_LUMP_START,LOADSAVE_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// 
// 	return exit;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // CALIBRATE JOYSTICK
// //
// ////////////////////////////////////////////////////////////////////
// int CalibrateJoystick(void)
// {
// 	#define CALX	85
// 	#define CALY	40
// 	#define CALW	158
// 	#define CALH	140
// 
// 	unsigned xmin,ymin,xmax,ymax,jb;
// 
// 
// 
// 	#ifdef JAPAN
// 	VWB_DrawPic(CALX,CALY,C_JOY0PIC);
// 	#else
// 	DrawWindow(CALX-5,CALY-5,CALW,CALH,TEXTCOLOR);
// 	DrawOutline(CALX-5,CALY-5,CALW,CALH,0,HIGHLIGHT);
// 	SETFONTCOLOR(0,TEXTCOLOR);
// 
// 	WindowX = PrintX = CALX;
// 	WindowW = CALW;
// 	WindowH = CALH;
// 	WindowY = PrintY = CALY;
// 	US_Print("    "STR_CALIB"\n    "STR_JOYST"\n");
// 	VWB_DrawPic(CALX+40,CALY+30,C_JOY1PIC);
// 	PrintY = CALY+80;
// 	US_Print(STR_MOVEJOY);
// 	SETFONTCOLOR(BKGDCOLOR,TEXTCOLOR);
// 	US_Print("   "STR_ESCEXIT);
// 	#endif
// 	VW_UpdateScreen();
// 
// 	do
// 	{
// 		jb=IN_JoyButtons();
// 		if (Keyboard[sc_Escape])
// 			return 0;
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			PicturePause();
// 		#endif
// 
// 	} while(!(jb&1));
// 
// 	SD_PlaySound(SHOOTSND);
// 	IN_GetJoyAbs(joystickport,&xmin,&ymin);
// 
// 
// 	#ifdef JAPAN
// 	VWB_DrawPic(CALX,CALY,C_JOY1PIC);
// 	#else
// 	DrawWindow(CALX-5,CALY-5,CALW,CALH,TEXTCOLOR);
// 	DrawOutline(CALX-5,CALY-5,CALW,CALH,0,HIGHLIGHT);
// 	SETFONTCOLOR(0,TEXTCOLOR);
// 
// 	PrintX = CALX;
// 	PrintY = CALY;
// 	US_Print("    "STR_CALIB"\n    "STR_JOYST"\n");
// 	VWB_DrawPic(CALX+40,CALY+30,C_JOY2PIC);
// 	PrintY = CALY+80;
// 	US_Print(STR_MOVEJOY2);
// 	SETFONTCOLOR(BKGDCOLOR,TEXTCOLOR);
// 	US_Print("   "STR_ESCEXIT);
// 	#endif
// 	VW_UpdateScreen();
// 
// 	do
// 	{
// 		jb=IN_JoyButtons();
// 		if (Keyboard[sc_Escape])
// 			return 0;
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			PicturePause();
// 		#endif
// 	} while(!(jb&2));
// 
// 	IN_GetJoyAbs(joystickport,&xmax,&ymax);
// 	SD_PlaySound(SHOOTSND);
// 
// 	while (IN_JoyButtons());
// 
// 	//
// 	// ASSIGN ACTUAL VALUES HERE
// 	//
// 	if ((xmin != xmax) && (ymin != ymax))
// 		IN_SetupJoy(joystickport,xmin,xmax,ymin,ymax);
// 	else
// 		return 0;
// 
// 	return 1;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // DEFINE CONTROLS
// //
// ////////////////////////////////////////////////////////////////////
// void CP_Control(void)
// {
// 	#define CTL_SPC	70
// 	enum {MOUSEENABLE,JOYENABLE,USEPORT2,PADENABLE,MOUSESENS,CUSTOMIZE};
// 	int i,which;
// 
// 
// #ifdef SPEAR
// 	UnCacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// 	CacheLump (CONTROL_LUMP_START,CONTROL_LUMP_END);
// #endif
// 
// 	DrawCtlScreen();
// 	MenuFadeIn();
// 	WaitKeyUp();
// 
// 	do
// 	{
// 		which=HandleMenu(&CtlItems,&CtlMenu[0],NULL);
// 		switch(which)
// 		{
// 			case MOUSEENABLE:
// 				mouseenabled^=1;
// 				_CX=_DX=CENTER;
// 				Mouse(4);
// 				DrawCtlScreen();
// 				CusItems.curpos=-1;
// 				ShootSnd();
// 				break;
// 
// 			case JOYENABLE:
// 				joystickenabled^=1;
// 				if (joystickenabled)
// 					if (!CalibrateJoystick())
// 						joystickenabled = 0;
// 				DrawCtlScreen();
// 				CusItems.curpos=-1;
// 				ShootSnd();
// 				break;
// 
// 			case USEPORT2:
// 				joystickport^=1;
// 				DrawCtlScreen();
// 				ShootSnd();
// 				break;
// 
// 			case PADENABLE:
// 				joypadenabled^=1;
// 				DrawCtlScreen();
// 				ShootSnd();
// 				break;
// 
// 			case MOUSESENS:
// 			case CUSTOMIZE:
// 				DrawCtlScreen();
// 				MenuFadeIn();
// 				WaitKeyUp();
// 				break;
// 		}
// 	} while(which>=0);
// 
// 	MenuFadeOut();
// 
// #ifdef SPEAR
// 	UnCacheLump (CONTROL_LUMP_START,CONTROL_LUMP_END);
// 	CacheLump (OPTIONS_LUMP_START,OPTIONS_LUMP_END);
// #endif
// }
// 
// 
// ////////////////////////////////
// //
// // DRAW MOUSE SENSITIVITY SCREEN
// //
// void DrawMouseSens(void)
// {
// #ifdef JAPAN
// 	CA_CacheScreen(S_MOUSESENSPIC);
// #else
// 	ClearMScreen();
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 	#ifdef SPANISH
// 	DrawWindow(10,80,300,43,BKGDCOLOR);
// 	#else
// 	DrawWindow(10,80,300,30,BKGDCOLOR);
// 	#endif
// 
// 	WindowX=0;
// 	WindowW=320;
// 	PrintY=82;
// 	SETFONTCOLOR(READCOLOR,BKGDCOLOR);
// 	US_CPrint(STR_MOUSEADJ);
// 
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	#ifdef SPANISH
// 	PrintX=14;
// 	PrintY=95+13;
// 	US_Print(STR_SLOW);
// 	PrintX=252;
// 	US_Print(STR_FAST);
// 	#else
// 	PrintX=14;
// 	PrintY=95;
// 	US_Print(STR_SLOW);
// 	PrintX=269;
// 	US_Print(STR_FAST);
// 	#endif
// #endif
// 
// 	VWB_Bar(60,97,200,10,TEXTCOLOR);
// 	DrawOutline(60,97,200,10,0,HIGHLIGHT);
// 	DrawOutline(60+20*mouseadjustment,97,20,10,0,READCOLOR);
// 	VWB_Bar(61+20*mouseadjustment,98,19,9,READHCOLOR);
// 
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// }
// 
// 
// ///////////////////////////
// //
// // ADJUST MOUSE SENSITIVITY
// //
// void MouseSensitivity(void)
// {
// 	ControlInfo ci;
// 	int exit=0,oldMA;
// 
// 
// 	oldMA=mouseadjustment;
// 	DrawMouseSens();
// 	do
// 	{
// 		ReadAnyControl(&ci);
// 		switch(ci.dir)
// 		{
// 			case dir_North:
// 			case dir_West:
// 				if (mouseadjustment)
// 				{
// 					mouseadjustment--;
// 					VWB_Bar(60,97,200,10,TEXTCOLOR);
// 					DrawOutline(60,97,200,10,0,HIGHLIGHT);
// 					DrawOutline(60+20*mouseadjustment,97,20,10,0,READCOLOR);
// 					VWB_Bar(61+20*mouseadjustment,98,19,9,READHCOLOR);
// 					VW_UpdateScreen();
// 					SD_PlaySound(MOVEGUN1SND);
// 					while(Keyboard[sc_LeftArrow]);
// 					WaitKeyUp();
// 				}
// 				break;
// 
// 			case dir_South:
// 			case dir_East:
// 				if (mouseadjustment<9)
// 				{
// 					mouseadjustment++;
// 					VWB_Bar(60,97,200,10,TEXTCOLOR);
// 					DrawOutline(60,97,200,10,0,HIGHLIGHT);
// 					DrawOutline(60+20*mouseadjustment,97,20,10,0,READCOLOR);
// 					VWB_Bar(61+20*mouseadjustment,98,19,9,READHCOLOR);
// 					VW_UpdateScreen();
// 					SD_PlaySound(MOVEGUN1SND);
// 					while(Keyboard[sc_RightArrow]);
// 					WaitKeyUp();
// 				}
// 				break;
// 		}
// 
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 		#else
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("debugmode"))
// 		#endif
// 			PicturePause();
// 
// 		if (ci.button0 || Keyboard[sc_Space] || Keyboard[sc_Enter])
// 			exit=1;
// 		else
// 		if (ci.button1 || Keyboard[sc_Escape])
// 			exit=2;
// 
// 	} while(!exit);
// 
// 	if (exit==2)
// 	{
// 		mouseadjustment=oldMA;
// 		SD_PlaySound(ESCPRESSEDSND);
// 	}
// 	else
// 		SD_PlaySound(SHOOTSND);
// 
// 	WaitKeyUp();
// 	MenuFadeOut();
// }
// 
// 
// ///////////////////////////
// //
// // DRAW CONTROL MENU SCREEN
// //
// void DrawCtlScreen(void)
// {
//  int i,x,y;
// 
// 
// #ifdef JAPAN
// 	CA_CacheScreen(S_CONTROLPIC);
// #else
//  ClearMScreen();
//  DrawStripes(10);
//  VWB_DrawPic(80,0,C_CONTROLPIC);
//  VWB_DrawPic(112,184,C_MOUSELBACKPIC);
//  DrawWindow(CTL_X-8,CTL_Y-5,CTL_W,CTL_H,BKGDCOLOR);
// #endif
//  WindowX=0;
//  WindowW=320;
//  SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 
//  if (JoysPresent[0])
//    CtlMenu[1].active=
//    CtlMenu[2].active=
//    CtlMenu[3].active=1;
// 
//  CtlMenu[2].active=CtlMenu[3].active=joystickenabled;
// 
//  if (MousePresent)
//  {
//   CtlMenu[4].active=
//   CtlMenu[0].active=1;
//  }
// 
//  CtlMenu[4].active=mouseenabled;
// 
// 
//  DrawMenu(&CtlItems,&CtlMenu[0]);
// 
// 
//  x=CTL_X+CtlItems.indent-24;
//  y=CTL_Y+3;
//  if (mouseenabled)
//    VWB_DrawPic(x,y,C_SELECTEDPIC);
//  else
//    VWB_DrawPic(x,y,C_NOTSELECTEDPIC);
// 
//  y=CTL_Y+16;
//  if (joystickenabled)
//    VWB_DrawPic(x,y,C_SELECTEDPIC);
//  else
//    VWB_DrawPic(x,y,C_NOTSELECTEDPIC);
// 
//  y=CTL_Y+29;
//  if (joystickport)
//    VWB_DrawPic(x,y,C_SELECTEDPIC);
//  else
//    VWB_DrawPic(x,y,C_NOTSELECTEDPIC);
// 
//  y=CTL_Y+42;
//  if (joypadenabled)
//    VWB_DrawPic(x,y,C_SELECTEDPIC);
//  else
//    VWB_DrawPic(x,y,C_NOTSELECTEDPIC);
// 
//  //
//  // PICK FIRST AVAILABLE SPOT
//  //
//  if (CtlItems.curpos<0 || !CtlMenu[CtlItems.curpos].active)
//    for (i=0;i<6;i++)
// 	 if (CtlMenu[i].active)
// 	 {
// 	  CtlItems.curpos=i;
// 	  break;
// 	 }
// 
//  DrawMenuGun(&CtlItems);
//  VW_UpdateScreen();
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // CUSTOMIZE CONTROLS
// //
// ////////////////////////////////////////////////////////////////////
// enum {FIRE,STRAFE,RUN,OPEN};
// char mbarray[4][3]={"b0","b1","b2","b3"},
// 	   order[4]={RUN,OPEN,FIRE,STRAFE};
// 
// 
// void CustomControls(void)
// {
//  int which;
// 
// 
//  DrawCustomScreen();
//  do
//  {
//   which=HandleMenu(&CusItems,&CusMenu[0],FixupCustom);
//   switch(which)
//   {
//    case 0:
// 	 DefineMouseBtns();
// 	 DrawCustMouse(1);
// 	 break;
//    case 3:
// 	 DefineJoyBtns();
// 	 DrawCustJoy(0);
// 	 break;
//    case 6:
// 	 DefineKeyBtns();
// 	 DrawCustKeybd(0);
// 	 break;
//    case 8:
// 	 DefineKeyMove();
// 	 DrawCustKeys(0);
//   }
//  } while(which>=0);
// 
// 
// 
//  MenuFadeOut();
// }
// 
// 
// ////////////////////////
// //
// // DEFINE THE MOUSE BUTTONS
// //
// void DefineMouseBtns(void)
// {
//  CustomCtrls mouseallowed={0,1,1,1};
//  EnterCtrlData(2,&mouseallowed,DrawCustMouse,PrintCustMouse,MOUSE);
// }
// 
// 
// ////////////////////////
// //
// // DEFINE THE JOYSTICK BUTTONS
// //
// void DefineJoyBtns(void)
// {
//  CustomCtrls joyallowed={1,1,1,1};
//  EnterCtrlData(5,&joyallowed,DrawCustJoy,PrintCustJoy,JOYSTICK);
// }
// 
// 
// ////////////////////////
// //
// // DEFINE THE KEYBOARD BUTTONS
// //
// void DefineKeyBtns(void)
// {
//  CustomCtrls keyallowed={1,1,1,1};
//  EnterCtrlData(8,&keyallowed,DrawCustKeybd,PrintCustKeybd,KEYBOARDBTNS);
// }
// 
// 
// ////////////////////////
// //
// // DEFINE THE KEYBOARD BUTTONS
// //
// void DefineKeyMove(void)
// {
// 	CustomCtrls keyallowed={1,1,1,1};
// 	EnterCtrlData(10,&keyallowed,DrawCustKeys,PrintCustKeys,KEYBOARDMOVE);
// }
// 
// 
// ////////////////////////
// //
// // ENTER CONTROL DATA FOR ANY TYPE OF CONTROL
// //
// enum {FWRD,RIGHT,BKWD,LEFT};
// int moveorder[4]={LEFT,RIGHT,FWRD,BKWD};
// 
// void EnterCtrlData(int index,CustomCtrls *cust,void (*DrawRtn)(int),void (*PrintRtn)(int),int type)
// {
//  int j,exit,tick,redraw,which,x,picked;
//  ControlInfo ci;
// 
// 
//  ShootSnd();
//  PrintY=CST_Y+13*index;
//  IN_ClearKeysDown();
//  exit=0;
//  redraw=1;
//  //
//  // FIND FIRST SPOT IN ALLOWED ARRAY
//  //
//  for (j=0;j<4;j++)
//    if (cust->allowed[j])
//    {
// 	which=j;
// 	break;
//    }
// 
//  do
//  {
//   if (redraw)
//   {
//    x=CST_START+CST_SPC*which;
//    DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// 
//    DrawRtn(1);
//    DrawWindow(x-2,PrintY,CST_SPC,11,TEXTCOLOR);
//    DrawOutline(x-2,PrintY,CST_SPC,11,0,HIGHLIGHT);
//    SETFONTCOLOR(0,TEXTCOLOR);
//    PrintRtn(which);
//    PrintX=x;
//    SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
//    VW_UpdateScreen();
//    WaitKeyUp();
//    redraw=0;
//   }
// 
//   ReadAnyControl(&ci);
// 
//   if (type==MOUSE || type==JOYSTICK)
// 	if (IN_KeyDown(sc_Enter)||IN_KeyDown(sc_Control)||IN_KeyDown(sc_Alt))
// 	{
// 	 IN_ClearKeysDown();
// 	 ci.button0=ci.button1=false;
// 	}
// 
//   //
//   // CHANGE BUTTON VALUE?
//   //
//   if ((ci.button0|ci.button1|ci.button2|ci.button3)||
// 	  ((type==KEYBOARDBTNS||type==KEYBOARDMOVE) && LastScan==sc_Enter))
//   {
//    tick=TimeCount=picked=0;
//    SETFONTCOLOR(0,TEXTCOLOR);
// 
//    do
//    {
// 	int button,result=0;
// 
// 
// 	if (type==KEYBOARDBTNS||type==KEYBOARDMOVE)
// 	  IN_ClearKeysDown();
// 
// 	//
// 	// FLASH CURSOR
// 	//
// 	if (TimeCount>10)
// 	{
// 	 switch(tick)
// 	 {
// 	  case 0:
// 	VWB_Bar(x,PrintY+1,CST_SPC-2,10,TEXTCOLOR);
// 	break;
// 	  case 1:
// 	PrintX=x;
// 	US_Print("?");
// 	SD_PlaySound(HITWALLSND);
// 	 }
// 	 tick^=1;
// 	 TimeCount=0;
// 	 VW_UpdateScreen();
// 	}
// 
// 	//
// 	// WHICH TYPE OF INPUT DO WE PROCESS?
// 	//
// 	switch(type)
// 	{
// 	 case MOUSE:
// 	   Mouse(3);
// 	   button=_BX;
// 	   switch(button)
// 	   {
// 	case 1: result=1; break;
// 	case 2: result=2; break;
// 	case 4: result=3; break;
// 	   }
// 
// 	   if (result)
// 	   {
// 	int z;
// 
// 
// 	for (z=0;z<4;z++)
// 	  if (order[which]==buttonmouse[z])
// 	  {
// 	   buttonmouse[z]=bt_nobutton;
// 	   break;
// 	  }
// 
// 	buttonmouse[result-1]=order[which];
// 	picked=1;
// 	SD_PlaySound(SHOOTDOORSND);
// 	   }
// 	   break;
// 
// 	 case JOYSTICK:
// 	   if (ci.button0) result=1;
// 	   else
// 	   if (ci.button1) result=2;
// 	   else
// 	   if (ci.button2) result=3;
// 	   else
// 	   if (ci.button3) result=4;
// 
// 	   if (result)
// 	   {
// 	int z;
// 
// 
// 	for (z=0;z<4;z++)
// 	  if (order[which]==buttonjoy[z])
// 	  {
// 	   buttonjoy[z]=bt_nobutton;
// 	   break;
// 	  }
// 
// 	buttonjoy[result-1]=order[which];
// 	picked=1;
// 	SD_PlaySound(SHOOTDOORSND);
// 	   }
// 	   break;
// 
// 	 case KEYBOARDBTNS:
// 	   if (LastScan)
// 	   {
// 	buttonscan[order[which]]=LastScan;
// 	picked=1;
// 	ShootSnd();
// 	IN_ClearKeysDown();
// 	   }
// 	   break;
// 
// 	 case KEYBOARDMOVE:
// 	   if (LastScan)
// 	   {
// 	dirscan[moveorder[which]]=LastScan;
// 	picked=1;
// 	ShootSnd();
// 	IN_ClearKeysDown();
// 	   }
// 	   break;
// 	}
// 
// 	//
// 	// EXIT INPUT?
// 	//
// 	if (IN_KeyDown(sc_Escape))
// 	{
// 	 picked=1;
// 	 continue;
// 	}
// 
//    } while(!picked);
// 
//    SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
//    redraw=1;
//    WaitKeyUp();
//    continue;
//   }
// 
//   if (ci.button1 || IN_KeyDown(sc_Escape))
// 	exit=1;
// 
//   //
//   // MOVE TO ANOTHER SPOT?
//   //
//   switch(ci.dir)
//   {
//    case dir_West:
// 	 do
// 	 {
// 	  which--;
// 	  if (which<0)
// 	which=3;
// 	 } while(!cust->allowed[which]);
// 	 redraw=1;
// 	 SD_PlaySound(MOVEGUN1SND);
// 	 while(ReadAnyControl(&ci),ci.dir!=dir_None);
// 	 IN_ClearKeysDown();
// 	 break;
// 
//    case dir_East:
// 	 do
// 	 {
// 	  which++;
// 	  if (which>3)
// 	which=0;
// 	 } while(!cust->allowed[which]);
// 	 redraw=1;
// 	 SD_PlaySound(MOVEGUN1SND);
// 	 while(ReadAnyControl(&ci),ci.dir!=dir_None);
// 	 IN_ClearKeysDown();
// 	 break;
//    case dir_North:
//    case dir_South:
// 	 exit=1;
//   }
//  } while(!exit);
// 
//  SD_PlaySound(ESCPRESSEDSND);
//  WaitKeyUp();
//  DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// }
// 
// 
// ////////////////////////
// //
// // FIXUP GUN CURSOR OVERDRAW SHIT
// //
// void FixupCustom(int w)
// {
// 	static int lastwhich=-1;
// 	int y=CST_Y+26+w*13;
// 
// 
// 	VWB_Hlin(7,32,y-1,DEACTIVE);
// 	VWB_Hlin(7,32,y+12,BORD2COLOR);
// #ifndef SPEAR
// 	VWB_Hlin(7,32,y-2,BORDCOLOR);
// 	VWB_Hlin(7,32,y+13,BORDCOLOR);
// #else
// 	VWB_Hlin(7,32,y-2,BORD2COLOR);
// 	VWB_Hlin(7,32,y+13,BORD2COLOR);
// #endif
// 
// 	switch(w)
// 	{
// 		case 0: DrawCustMouse(1); break;
// 		case 3: DrawCustJoy(1); break;
// 		case 6: DrawCustKeybd(1); break;
// 		case 8: DrawCustKeys(1);
// 	}
// 
// 
// 	if (lastwhich>=0)
// 	{
// 		y=CST_Y+26+lastwhich*13;
// 		VWB_Hlin(7,32,y-1,DEACTIVE);
// 		VWB_Hlin(7,32,y+12,BORD2COLOR);
// #ifndef SPEAR
// 		VWB_Hlin(7,32,y-2,BORDCOLOR);
// 		VWB_Hlin(7,32,y+13,BORDCOLOR);
// #else
// 		VWB_Hlin(7,32,y-2,BORD2COLOR);
// 		VWB_Hlin(7,32,y+13,BORD2COLOR);
// #endif
// 
// 		if (lastwhich!=w)
// 			switch(lastwhich)
// 			{
// 				case 0: DrawCustMouse(0); break;
// 				case 3: DrawCustJoy(0); break;
// 				case 6: DrawCustKeybd(0); break;
// 				case 8: DrawCustKeys(0);
// 			}
// 	}
// 
// 	lastwhich=w;
// }
// 
// 
// ////////////////////////
// //
// // DRAW CUSTOMIZE SCREEN
// //
// void DrawCustomScreen(void)
// {
// 	int i;
// 
// 
// #ifdef JAPAN
// 	CA_CacheScreen(S_CUSTOMPIC);
// 	fontnumber=1;
// 
// 	PrintX=CST_START;
// 	PrintY = CST_Y+26;
// 	DrawCustMouse(0);
// 
// 	PrintX=CST_START;
// 	US_Print("\n\n\n");
// 	DrawCustJoy(0);
// 
// 	PrintX=CST_START;
// 	US_Print("\n\n\n");
// 	DrawCustKeybd(0);
// 
// 	PrintX=CST_START;
// 	US_Print("\n\n\n");
// 	DrawCustKeys(0);
// #else
// 	ClearMScreen();
// 	WindowX=0;
// 	WindowW=320;
// 	VWB_DrawPic(112,184,C_MOUSELBACKPIC);
// 	DrawStripes(10);
// 	VWB_DrawPic(80,0,C_CUSTOMIZEPIC);
// 
// 	//
// 	// MOUSE
// 	//
// 	SETFONTCOLOR(READCOLOR,BKGDCOLOR);
// 	WindowX=0;
// 	WindowW=320;
// 
// #ifndef SPEAR
// 	PrintY=CST_Y;
// 	US_CPrint("Mouse\n");
// #else
// 	PrintY = CST_Y+13;
// 	VWB_DrawPic (128,48,C_MOUSEPIC);
// #endif
// 
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	#ifdef SPANISH
// 	PrintX=CST_START-16;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START-16+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START-16+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START-16+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#else
// 	PrintX=CST_START;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#endif
// 
// 	DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// 	DrawCustMouse(0);
// 	US_Print("\n");
// 
// 
// 	//
// 	// JOYSTICK/PAD
// 	//
// #ifndef SPEAR
// 	SETFONTCOLOR(READCOLOR,BKGDCOLOR);
// 	US_CPrint("Joystick/Gravis GamePad\n");
// #else
// 	PrintY += 13;
// 	VWB_DrawPic (40,88,C_JOYSTICKPIC);
// #endif
// 
// #ifdef SPEAR
// 	VWB_DrawPic (112,120,C_KEYBOARDPIC);
// #endif
// 
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	#ifdef SPANISH
// 	PrintX=CST_START-16;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START-16+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START-16+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START-16+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#else
// 	PrintX=CST_START;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#endif
// 	DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// 	DrawCustJoy(0);
// 	US_Print("\n");
// 
// 
// 	//
// 	// KEYBOARD
// 	//
// #ifndef SPEAR
// 	SETFONTCOLOR(READCOLOR,BKGDCOLOR);
// 	US_CPrint("Keyboard\n");
// #else
// 	PrintY += 13;
// #endif
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	#ifdef SPANISH
// 	PrintX=CST_START-16;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START-16+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START-16+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START-16+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#else
// 	PrintX=CST_START;
// 	US_Print(STR_CRUN);
// 	PrintX=CST_START+CST_SPC*1;
// 	US_Print(STR_COPEN);
// 	PrintX=CST_START+CST_SPC*2;
// 	US_Print(STR_CFIRE);
// 	PrintX=CST_START+CST_SPC*3;
// 	US_Print(STR_CSTRAFE"\n");
// 	#endif
// 	DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// 	DrawCustKeybd(0);
// 	US_Print("\n");
// 
// 
// 	//
// 	// KEYBOARD MOVE KEYS
// 	//
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	#ifdef SPANISH
// 	PrintX=4;
// 	US_Print(STR_LEFT);
// 	US_Print("/");
// 	US_Print(STR_RIGHT);
// 	US_Print("/");
// 	US_Print(STR_FRWD);
// 	US_Print("/");
// 	US_Print(STR_BKWD"\n");
// 	#else
// 	PrintX=CST_START;
// 	US_Print(STR_LEFT);
// 	PrintX=CST_START+CST_SPC*1;
// 	US_Print(STR_RIGHT);
// 	PrintX=CST_START+CST_SPC*2;
// 	US_Print(STR_FRWD);
// 	PrintX=CST_START+CST_SPC*3;
// 	US_Print(STR_BKWD"\n");
// 	#endif
// 	DrawWindow(5,PrintY-1,310,13,BKGDCOLOR);
// 	DrawCustKeys(0);
// #endif
// 	//
// 	// PICK STARTING POINT IN MENU
// 	//
// 	if (CusItems.curpos<0)
// 		for (i=0;i<CusItems.amount;i++)
// 			if (CusMenu[i].active)
// 			{
// 				CusItems.curpos=i;
// 				break;
// 			}
// 
// 
// 	VW_UpdateScreen();
// 	MenuFadeIn();
// }
// 
// 
// void PrintCustMouse(int i)
// {
// 	int j;
// 
// 	for (j=0;j<4;j++)
// 		if (order[i]==buttonmouse[j])
// 		{
// 			PrintX=CST_START+CST_SPC*i;
// 			US_Print(mbarray[j]);
// 			break;
// 		}
// }
// 
// void DrawCustMouse(int hilight)
// {
// 	int i,color;
// 
// 
// 	color=TEXTCOLOR;
// 	if (hilight)
// 		color=HIGHLIGHT;
// 	SETFONTCOLOR(color,BKGDCOLOR);
// 
// 	if (!mouseenabled)
// 	{
// 		SETFONTCOLOR(DEACTIVE,BKGDCOLOR);
// 		CusMenu[0].active=0;
// 	}
// 	else
// 		CusMenu[0].active=1;
// 
// 	PrintY=CST_Y+13*2;
// 	for (i=0;i<4;i++)
// 		PrintCustMouse(i);
// }
// 
// void PrintCustJoy(int i)
// {
// 	int j;
// 
// 	for (j=0;j<4;j++)
// 		if (order[i]==buttonjoy[j])
// 		{
// 			PrintX=CST_START+CST_SPC*i;
// 			US_Print(mbarray[j]);
// 			break;
// 		}
// }
// 
// void DrawCustJoy(int hilight)
// {
// 	int i,color;
// 
// 
// 	color=TEXTCOLOR;
// 	if (hilight)
// 		color=HIGHLIGHT;
// 	SETFONTCOLOR(color,BKGDCOLOR);
// 
// 	if (!joystickenabled)
// 	{
// 		SETFONTCOLOR(DEACTIVE,BKGDCOLOR);
// 		CusMenu[3].active=0;
// 	}
// 	else
// 		CusMenu[3].active=1;
// 
// 	PrintY=CST_Y+13*5;
// 	for (i=0;i<4;i++)
// 		PrintCustJoy(i);
// }
// 
// 
// void PrintCustKeybd(int i)
// {
// 	PrintX=CST_START+CST_SPC*i;
// 	US_Print(IN_GetScanName(buttonscan[order[i]]));
// }
// 
// void DrawCustKeybd(int hilight)
// {
// 	int i,color;
// 
// 
// 	color=TEXTCOLOR;
// 	if (hilight)
// 		color=HIGHLIGHT;
// 	SETFONTCOLOR(color,BKGDCOLOR);
// 
// 	PrintY=CST_Y+13*8;
// 	for (i=0;i<4;i++)
// 		PrintCustKeybd(i);
// }
// 
// void PrintCustKeys(int i)
// {
// 	PrintX=CST_START+CST_SPC*i;
// 	US_Print(IN_GetScanName(dirscan[moveorder[i]]));
// }
// 
// void DrawCustKeys(int hilight)
// {
// 	int i,color;
// 
// 
// 	color=TEXTCOLOR;
// 	if (hilight)
// 		color=HIGHLIGHT;
// 	SETFONTCOLOR(color,BKGDCOLOR);
// 
// 	PrintY=CST_Y+13*10;
// 	for (i=0;i<4;i++)
// 		PrintCustKeys(i);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // CHANGE SCREEN VIEWING SIZE
// //
// ////////////////////////////////////////////////////////////////////
// void CP_ChangeView(void)
// {
// 	int exit=0,oldview,newview;
// 	ControlInfo ci;
// 
// 
// 	WindowX=WindowY=0;
// 	WindowW=320;
// 	WindowH=200;
// 	newview=oldview=viewwidth/16;
// 	DrawChangeView(oldview);
// 
// 	do
// 	{
// 		CheckPause();
// 		ReadAnyControl(&ci);
// 		switch(ci.dir)
// 		{
// 		case dir_South:
// 		case dir_West:
// 			newview--;
// 			if (newview<4)
// 				newview=4;
// 			ShowViewSize(newview);
// 			VW_UpdateScreen();
// 			SD_PlaySound(HITWALLSND);
// 			TicDelay(10);
// 			break;
// 
// 		case dir_North:
// 		case dir_East:
// 			newview++;
// 			if (newview>19)
// 				newview=19;
// 			ShowViewSize(newview);
// 			VW_UpdateScreen();
// 			SD_PlaySound(HITWALLSND);
// 			TicDelay(10);
// 			break;
// 		}
// 
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 		#else
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("debugmode"))
// 		#endif
// 			PicturePause();
// 
// 		if (ci.button0 || Keyboard[sc_Enter])
// 			exit=1;
// 		else
// 		if (ci.button1 || Keyboard[sc_Escape])
// 		{
// 			viewwidth=oldview*16;
// 			SD_PlaySound(ESCPRESSEDSND);
// 			MenuFadeOut();
// 			return;
// 		}
// 
// 	} while(!exit);
// 
// 
// 	if (oldview!=newview)
// 	{
// 		SD_PlaySound (SHOOTSND);
// 		Message(STR_THINK"...");
// 		NewViewSize(newview);
// 	}
// 
// 	ShootSnd();
// 	MenuFadeOut();
// }
// 
// 
// /////////////////////////////
// //
// // DRAW THE CHANGEVIEW SCREEN
// //
// void DrawChangeView(int view)
// {
// #ifdef JAPAN
// 	CA_CacheScreen(S_CHANGEPIC);
// 
// 	ShowViewSize(view);
// #else
// 	VWB_Bar(0,160,320,40,VIEWCOLOR);
// 	ShowViewSize(view);
// 
// 	PrintY=161;
// 	WindowX=0;
// 	WindowY=320;
// 	SETFONTCOLOR(HIGHLIGHT,BKGDCOLOR);
// 
// 	US_CPrint(STR_SIZE1"\n");
// 	US_CPrint(STR_SIZE2"\n");
// 	US_CPrint(STR_SIZE3);
// #endif
// 	VW_UpdateScreen();
// 
// 	MenuFadeIn();
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // QUIT THIS INFERNAL GAME!
// //
// ////////////////////////////////////////////////////////////////////
// void CP_Quit(void)
// {
// 	int i;
// 
// 
// 	#ifdef JAPAN
// 	if (GetYorN(7,11,C_QUITMSGPIC))
// 	#else
// 
// 	#ifdef SPANISH
// 	if (Confirm(ENDGAMESTR))
// 	#else
// 	if (Confirm(endStrings[US_RndT()&0x7+(US_RndT()&1)]))
// 	#endif
// 
// 	#endif
// 	{
// 		VW_UpdateScreen();
// 		SD_MusicOff();
// 		SD_StopSound();
// 		MenuFadeOut();
// 		//
// 		// SHUT-UP THE ADLIB
// 		//
// 		for (i=1;i<=0xf5;i++)
// 			alOut(i,0);
// 		Quit(NULL);
// 	}
// 
// 	DrawMainMenu();
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // HANDLE INTRO SCREEN (SYSTEM CONFIG)
// //
// ////////////////////////////////////////////////////////////////////
// void IntroScreen(void)
// {
// #ifdef SPEAR
// 
// #define MAINCOLOR	0x4f
// #define EMSCOLOR	0x4f
// #define XMSCOLOR	0x4f
// 
// #else
// 
// #define MAINCOLOR	0x6c
// #define EMSCOLOR	0x6c
// #define XMSCOLOR	0x6c
// 
// #endif
// #define FILLCOLOR	14
// 
// 	long memory,emshere,xmshere;
// 	int i,num,ems[10]={100,200,300,400,500,600,700,800,900,1000},
// 		xms[10]={100,200,300,400,500,600,700,800,900,1000},
// 		main[10]={32,64,96,128,160,192,224,256,288,320};
// 
// 
// 	//
// 	// DRAW MAIN MEMORY
// 	//
// 	memory=(1023l+mminfo.nearheap+mminfo.farheap)/1024l;
// 	for (i=0;i<10;i++)
// 		if (memory>=main[i])
// 			VWB_Bar(49,163-8*i,6,5,MAINCOLOR-i);
// 
// 
// 	//
// 	// DRAW EMS MEMORY
// 	//
// 	if (EMSPresent)
// 	{
// 		emshere=4l*EMSPagesAvail;
// 		for (i=0;i<10;i++)
// 			if (emshere>=ems[i])
// 				VWB_Bar(89,163-8*i,6,5,EMSCOLOR-i);
// 	}
// 
// 	//
// 	// DRAW XMS MEMORY
// 	//
// 	if (XMSPresent)
// 	{
// 		xmshere=4l*XMSPagesAvail;
// 		for (i=0;i<10;i++)
// 			if (xmshere>=xms[i])
// 				VWB_Bar(129,163-8*i,6,5,XMSCOLOR-i);
// 	}
// 
// 	//
// 	// FILL BOXES
// 	//
// 	if (MousePresent)
// 		VWB_Bar(164,82,12,2,FILLCOLOR);
// 
// 	if (JoysPresent[0] || JoysPresent[1])
// 		VWB_Bar(164,105,12,2,FILLCOLOR);
// 
// 	if (AdLibPresent && !SoundBlasterPresent)
// 		VWB_Bar(164,128,12,2,FILLCOLOR);
// 
// 	if (SoundBlasterPresent)
// 		VWB_Bar(164,151,12,2,FILLCOLOR);
// 
// 	if (SoundSourcePresent)
// 		VWB_Bar(164,174,12,2,FILLCOLOR);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////
// //
// // SUPPORT ROUTINES
// //
// ////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Clear Menu screens to dark red
// //
// ////////////////////////////////////////////////////////////////////
// void ClearMScreen(void)
// {
// #ifndef SPEAR
// 	VWB_Bar(0,0,320,200,BORDCOLOR);
// #else
// 	VWB_DrawPic(0,0,C_BACKDROPPIC);
// #endif
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Un/Cache a LUMP of graphics
// //
// ////////////////////////////////////////////////////////////////////
// void CacheLump(int lumpstart,int lumpend)
// {
//  int i;
// 
//  for (i=lumpstart;i<=lumpend;i++)
//    CA_CacheGrChunk(i);
// }
// 
// 
// void UnCacheLump(int lumpstart,int lumpend)
// {
//  int i;
// 
//  for (i=lumpstart;i<=lumpend;i++)
// 	if (grsegs[i])
// 		UNCACHEGRCHUNK(i);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Draw a window for a menu
// //
// ////////////////////////////////////////////////////////////////////
// void DrawWindow(int x,int y,int w,int h,int wcolor)
// {
// 	VWB_Bar(x,y,w,h,wcolor);
// 	DrawOutline(x,y,w,h,BORD2COLOR,DEACTIVE);
// }
// 
// 
// void DrawOutline(int x,int y,int w,int h,int color1,int color2)
// {
// 	VWB_Hlin(x,x+w,y,color2);
// 	VWB_Vlin(y,y+h,x,color2);
// 	VWB_Hlin(x,x+w,y+h,color1);
// 	VWB_Vlin(y,y+h,x+w,color1);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Setup Control Panel stuff - graphics, etc.
// //
// ////////////////////////////////////////////////////////////////////
// void SetupControlPanel(void)
// {
// 	struct ffblk f;
// 	char name[13];
// 	int which,i;
// 
// 
// 	//
// 	// CACHE GRAPHICS & SOUNDS
// 	//
// 	CA_CacheGrChunk(STARTFONT+1);
// #ifndef SPEAR
// 	CacheLump(CONTROLS_LUMP_START,CONTROLS_LUMP_END);
// #else
// 	CacheLump(BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// #endif
// 
// 	SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 	fontnumber=1;
// 	WindowH=200;
// 
// 	if (!ingame)
// 		CA_LoadAllSounds();
// 	else
// 		MainMenu[savegame].active=1;
// 
// 	//
// 	// SEE WHICH SAVE GAME FILES ARE AVAILABLE & READ STRING IN
// 	//
// 	strcpy(name,SaveName);
// 	if (!findfirst(name,&f,0))
// 		do
// 		{
// 			which=f.ff_name[7]-'0';
// 			if (which<10)
// 			{
// 				int handle;
// 				char temp[32];
// 
// 				SaveGamesAvail[which]=1;
// 				handle=open(f.ff_name,O_BINARY);
// 				read(handle,temp,32);
// 				close(handle);
// 				strcpy(&SaveGameNames[which][0],temp);
// 			}
// 		} while(!findnext(&f));
// 
// 	//
// 	// CENTER MOUSE
// 	//
// 	_CX=_DX=CENTER;
// 	Mouse(4);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Clean up all the Control Panel stuff
// //
// ////////////////////////////////////////////////////////////////////
// void CleanupControlPanel(void)
// {
// #ifndef SPEAR
// 	UnCacheLump(CONTROLS_LUMP_START,CONTROLS_LUMP_END);
// #else
// 	UnCacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// #endif
// 
// 	fontnumber = 0;
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Handle moving gun around a menu
// //
// ////////////////////////////////////////////////////////////////////
// int HandleMenu(CP_iteminfo *item_i,CP_itemtype far *items,void (*routine)(int w))
// {
// 	char key;
// 	static int redrawitem=1,lastitem=-1;
// 	int i,x,y,basey,exit,which,shape,timer;
// 	ControlInfo ci;
// 
// 
// 	which=item_i->curpos;
// 	x=item_i->x&-8;
// 	basey=item_i->y-2;
// 	y=basey+which*13;
// 
// 	VWB_DrawPic(x,y,C_CURSOR1PIC);
// 	SetTextColor(items+which,1);
// 	if (redrawitem)
// 	{
// 		PrintX=item_i->x+item_i->indent;
// 		PrintY=item_i->y+which*13;
// 		US_Print((items+which)->string);
// 	}
// 	//
// 	// CALL CUSTOM ROUTINE IF IT IS NEEDED
// 	//
// 	if (routine)
// 		routine(which);
// 	VW_UpdateScreen();
// 
// 	shape=C_CURSOR1PIC;
// 	timer=8;
// 	exit=0;
// 	TimeCount=0;
// 	IN_ClearKeysDown();
// 
// 
// 	do
// 	{
// 		//
// 		// CHANGE GUN SHAPE
// 		//
// 		if (TimeCount>timer)
// 		{
// 			TimeCount=0;
// 			if (shape==C_CURSOR1PIC)
// 			{
// 				shape=C_CURSOR2PIC;
// 				timer=8;
// 			}
// 			else
// 			{
// 				shape=C_CURSOR1PIC;
// 				timer=70;
// 			}
// 			VWB_DrawPic(x,y,shape);
// 			if (routine)
// 				routine(which);
// 			VW_UpdateScreen();
// 		}
// 
// 		CheckPause();
// 
// 		//
// 		// SEE IF ANY KEYS ARE PRESSED FOR INITIAL CHAR FINDING
// 		//
// 		key=LastASCII;
// 		if (key)
// 		{
// 			int ok=0;
// 
// 			//
// 			// CHECK FOR SCREEN CAPTURE
// 			//
// 			#ifndef SPEAR
// 			if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			#else
// 			if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("debugmode"))
// 			#endif
// 				PicturePause();
// 
// 
// 			if (key>='a')
// 				key-='a'-'A';
// 
// 			for (i=which+1;i<item_i->amount;i++)
// 				if ((items+i)->active && (items+i)->string[0]==key)
// 				{
// 					EraseGun(item_i,items,x,y,which);
// 					which=i;
// 					DrawGun(item_i,items,x,&y,which,basey,routine);
// 					ok=1;
// 					IN_ClearKeysDown();
// 					break;
// 				}
// 
// 			//
// 			// DIDN'T FIND A MATCH FIRST TIME THRU. CHECK AGAIN.
// 			//
// 			if (!ok)
// 			{
// 				for (i=0;i<which;i++)
// 					if ((items+i)->active && (items+i)->string[0]==key)
// 					{
// 						EraseGun(item_i,items,x,y,which);
// 						which=i;
// 						DrawGun(item_i,items,x,&y,which,basey,routine);
// 						IN_ClearKeysDown();
// 						break;
// 					}
// 			}
// 		}
// 
// 		//
// 		// GET INPUT
// 		//
// 		ReadAnyControl(&ci);
// 		switch(ci.dir)
// 		{
// 			////////////////////////////////////////////////
// 			//
// 			// MOVE UP
// 			//
// 			case dir_North:
// 
// 			EraseGun(item_i,items,x,y,which);
// 
// 			//
// 			// ANIMATE HALF-STEP
// 			//
// 			if (which && (items+which-1)->active)
// 			{
// 				y-=6;
// 				DrawHalfStep(x,y);
// 			}
// 
// 			//
// 			// MOVE TO NEXT AVAILABLE SPOT
// 			//
// 			do
// 			{
// 				if (!which)
// 					which=item_i->amount-1;
// 				else
// 					which--;
// 			} while(!(items+which)->active);
// 
// 			DrawGun(item_i,items,x,&y,which,basey,routine);
// 			//
// 			// WAIT FOR BUTTON-UP OR DELAY NEXT MOVE
// 			//
// 			TicDelay(20);
// 			break;
// 
// 			////////////////////////////////////////////////
// 			//
// 			// MOVE DOWN
// 			//
// 			case dir_South:
// 
// 			EraseGun(item_i,items,x,y,which);
// 			//
// 			// ANIMATE HALF-STEP
// 			//
// 			if (which!=item_i->amount-1 && (items+which+1)->active)
// 			{
// 				y+=6;
// 				DrawHalfStep(x,y);
// 			}
// 
// 			do
// 			{
// 				if (which==item_i->amount-1)
// 					which=0;
// 				else
// 					which++;
// 			} while(!(items+which)->active);
// 
// 			DrawGun(item_i,items,x,&y,which,basey,routine);
// 
// 			//
// 			// WAIT FOR BUTTON-UP OR DELAY NEXT MOVE
// 			//
// 			TicDelay(20);
// 			break;
// 		}
// 
// 		if (ci.button0 ||
// 			Keyboard[sc_Space] ||
// 			Keyboard[sc_Enter])
// 				exit=1;
// 
// 		if (ci.button1 ||
// 			Keyboard[sc_Escape])
// 				exit=2;
// 
// 	} while(!exit);
// 
// 
// 	IN_ClearKeysDown();
// 
// 	//
// 	// ERASE EVERYTHING
// 	//
// 	if (lastitem!=which)
// 	{
// 		VWB_Bar(x-1,y,25,16,BKGDCOLOR);
// 		PrintX=item_i->x+item_i->indent;
// 		PrintY=item_i->y+which*13;
// 		US_Print((items+which)->string);
// 		redrawitem=1;
// 	}
// 	else
// 		redrawitem=0;
// 
// 	if (routine)
// 		routine(which);
// 	VW_UpdateScreen();
// 
// 	item_i->curpos=which;
// 
// 	lastitem=which;
// 	switch(exit)
// 	{
// 		case 1:
// 			//
// 			// CALL THE ROUTINE
// 			//
// 			if ((items+which)->routine!=NULL)
// 			{
// 				ShootSnd();
// 				MenuFadeOut();
// 				(items+which)->routine(0);
// 			}
// 			return which;
// 
// 		case 2:
// 			SD_PlaySound(ESCPRESSEDSND);
// 			return -1;
// 	}
// 
// 	return 0; // JUST TO SHUT UP THE ERROR MESSAGES!
// }
// 
// 
// //
// // ERASE GUN & DE-HIGHLIGHT STRING
// //
// void EraseGun(CP_iteminfo *item_i,CP_itemtype far *items,int x,int y,int which)
// {
// 	VWB_Bar(x-1,y,25,16,BKGDCOLOR);
// 	SetTextColor(items+which,0);
// 
// 	PrintX=item_i->x+item_i->indent;
// 	PrintY=item_i->y+which*13;
// 	US_Print((items+which)->string);
// 	VW_UpdateScreen();
// }
// 
// 
// //
// // DRAW HALF STEP OF GUN TO NEXT POSITION
// //
// void DrawHalfStep(int x,int y)
// {
// 	VWB_DrawPic(x,y,C_CURSOR1PIC);
// 	VW_UpdateScreen();
// 	SD_PlaySound(MOVEGUN1SND);
// 	TimeCount=0;
// 	while(TimeCount<8);
// }
// 
// 
// //
// // DRAW GUN AT NEW POSITION
// //
// void DrawGun(CP_iteminfo *item_i,CP_itemtype far *items,int x,int *y,int which,int basey,void (*routine)(int w))
// {
// 	VWB_Bar(x-1,*y,25,16,BKGDCOLOR);
// 	*y=basey+which*13;
// 	VWB_DrawPic(x,*y,C_CURSOR1PIC);
// 	SetTextColor(items+which,1);
// 
// 	PrintX=item_i->x+item_i->indent;
// 	PrintY=item_i->y+which*13;
// 	US_Print((items+which)->string);
// 
// 	//
// 	// CALL CUSTOM ROUTINE IF IT IS NEEDED
// 	//
// 	if (routine)
// 		routine(which);
// 	VW_UpdateScreen();
// 	SD_PlaySound(MOVEGUN2SND);
// }
// 
// ////////////////////////////////////////////////////////////////////
// //
// // DELAY FOR AN AMOUNT OF TICS OR UNTIL CONTROLS ARE INACTIVE
// //
// ////////////////////////////////////////////////////////////////////
// void TicDelay(int count)
// {
// 	ControlInfo ci;
// 
// 
// 	TimeCount=0;
// 	do
// 	{
// 		ReadAnyControl(&ci);
// 	} while(TimeCount<count && ci.dir!=dir_None);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // Draw a menu
// //
// ////////////////////////////////////////////////////////////////////
// void DrawMenu(CP_iteminfo *item_i,CP_itemtype far *items)
// {
// 	int i,which=item_i->curpos;
// 
// 
// 	WindowX=PrintX=item_i->x+item_i->indent;
// 	WindowY=PrintY=item_i->y;
// 	WindowW=320;
// 	WindowH=200;
// 
// 	for (i=0;i<item_i->amount;i++)
// 	{
// 		SetTextColor(items+i,which==i);
// 
// 		PrintY=item_i->y+i*13;
// 		if ((items+i)->active)
// 			US_Print((items+i)->string);
// 		else
// 		{
// 			SETFONTCOLOR(DEACTIVE,BKGDCOLOR);
// 			US_Print((items+i)->string);
// 			SETFONTCOLOR(TEXTCOLOR,BKGDCOLOR);
// 		}
// 
// 		US_Print("\n");
// 	}
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // SET TEXT COLOR (HIGHLIGHT OR NO)
// //
// ////////////////////////////////////////////////////////////////////
// void SetTextColor(CP_itemtype far *items,int hlight)
// {
// 	if (hlight)
// 		{SETFONTCOLOR(color_hlite[items->active],BKGDCOLOR);}
// 	else
// 		{SETFONTCOLOR(color_norml[items->active],BKGDCOLOR);}
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // WAIT FOR CTRLKEY-UP OR BUTTON-UP
// //
// ////////////////////////////////////////////////////////////////////
// void WaitKeyUp(void)
// {
// 	ControlInfo ci;
// 	while(ReadAnyControl(&ci),	ci.button0|
// 								ci.button1|
// 								ci.button2|
// 								ci.button3|
// 								Keyboard[sc_Space]|
// 								Keyboard[sc_Enter]|
// 								Keyboard[sc_Escape]);
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // READ KEYBOARD, JOYSTICK AND MOUSE FOR INPUT
// //
// ////////////////////////////////////////////////////////////////////
// void ReadAnyControl(ControlInfo *ci)
// {
// 	int mouseactive=0;
// 
// 
// 	IN_ReadControl(0,ci);
// 
// 	if (mouseenabled)
// 	{
// 		int mousey,mousex;
// 
// 
// 		// READ MOUSE MOTION COUNTERS
// 		// RETURN DIRECTION
// 		// HOME MOUSE
// 		// CHECK MOUSE BUTTONS
// 
// 		Mouse(3);
// 		mousex=_CX;
// 		mousey=_DX;
// 
// 		if (mousey<CENTER-SENSITIVE)
// 		{
// 			ci->dir=dir_North;
// 			_CX=_DX=CENTER;
// 			Mouse(4);
// 			mouseactive=1;
// 		}
// 		else
// 		if (mousey>CENTER+SENSITIVE)
// 		{
// 			ci->dir=dir_South;
// 			_CX=_DX=CENTER;
// 			Mouse(4);
// 			mouseactive=1;
// 		}
// 
// 		if (mousex<CENTER-SENSITIVE)
// 		{
// 			ci->dir=dir_West;
// 			_CX=_DX=CENTER;
// 			Mouse(4);
// 			mouseactive=1;
// 		}
// 		else
// 		if (mousex>CENTER+SENSITIVE)
// 		{
// 			ci->dir=dir_East;
// 			_CX=_DX=CENTER;
// 			Mouse(4);
// 			mouseactive=1;
// 		}
// 
// 		if (IN_MouseButtons())
// 		{
// 			ci->button0=IN_MouseButtons()&1;
// 			ci->button1=IN_MouseButtons()&2;
// 			ci->button2=IN_MouseButtons()&4;
// 			ci->button3=false;
// 			mouseactive=1;
// 		}
// 	}
// 
// 	if (joystickenabled && !mouseactive)
// 	{
// 		int jx,jy,jb;
// 
// 
// 		INL_GetJoyDelta(joystickport,&jx,&jy);
// 		if (jy<-SENSITIVE)
// 			ci->dir=dir_North;
// 		else
// 		if (jy>SENSITIVE)
// 			ci->dir=dir_South;
// 
// 		if (jx<-SENSITIVE)
// 			ci->dir=dir_West;
// 		else
// 		if (jx>SENSITIVE)
// 			ci->dir=dir_East;
// 
// 		jb=IN_JoyButtons();
// 		if (jb)
// 		{
// 			ci->button0=jb&1;
// 			ci->button1=jb&2;
// 			if (joypadenabled)
// 			{
// 				ci->button2=jb&4;
// 				ci->button3=jb&8;
// 			}
// 			else
// 				ci->button2=ci->button3=false;
// 		}
// 	}
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // DRAW DIALOG AND CONFIRM YES OR NO TO QUESTION
// //
// ////////////////////////////////////////////////////////////////////
// int Confirm(char far *string)
// {
// 	int xit=0,i,x,y,tick=0,time,whichsnd[2]={ESCPRESSEDSND,SHOOTSND};
// 
// 
// 	Message(string);
// 	IN_ClearKeysDown();
// 
// 	//
// 	// BLINK CURSOR
// 	//
// 	x=PrintX;
// 	y=PrintY;
// 	TimeCount=0;
// 
// 	do
// 	{
// 		if (TimeCount>=10)
// 		{
// 			switch(tick)
// 			{
// 				case 0:
// 					VWB_Bar(x,y,8,13,TEXTCOLOR);
// 					break;
// 				case 1:
// 					PrintX=x;
// 					PrintY=y;
// 					US_Print("_");
// 			}
// 			VW_UpdateScreen();
// 			tick^=1;
// 			TimeCount=0;
// 		}
// 
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			PicturePause();
// 		#endif
// 
// 	#ifdef SPANISH
// 	} while(!Keyboard[sc_S] && !Keyboard[sc_N] && !Keyboard[sc_Escape]);
// 	#else
// 	} while(!Keyboard[sc_Y] && !Keyboard[sc_N] && !Keyboard[sc_Escape]);
// 	#endif
// 
// 	#ifdef SPANISH
// 	if (Keyboard[sc_S])
// 	{
// 		xit=1;
// 		ShootSnd();
// 	}
// 
// 	while(Keyboard[sc_S] || Keyboard[sc_N] || Keyboard[sc_Escape]);
// 
// 	#else
// 
// 	if (Keyboard[sc_Y])
// 	{
// 		xit=1;
// 		ShootSnd();
// 	}
// 
// 	while(Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]);
// 	#endif
// 
// 	IN_ClearKeysDown();
// 	SD_PlaySound(whichsnd[xit]);
// 	return xit;
// }
// 
// #ifdef JAPAN
// ////////////////////////////////////////////////////////////////////
// //
// // DRAW MESSAGE & GET Y OR N
// //
// ////////////////////////////////////////////////////////////////////
// int GetYorN(int x,int y,int pic)
// {
// 	int xit=0,whichsnd[2]={ESCPRESSEDSND,SHOOTSND};
// 
// 
// 	CA_CacheGrChunk(pic);
// 	VWB_DrawPic(x * 8,y * 8,pic);
// 	UNCACHEGRCHUNK(pic);
// 	VW_UpdateScreen();
// 	IN_ClearKeysDown();
// 
// 	do
// 	{
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			PicturePause();
// 		#endif
// 
// 	#ifdef SPANISH
// 	} while(!Keyboard[sc_S] && !Keyboard[sc_N] && !Keyboard[sc_Escape]);
// 	#else
// 	} while(!Keyboard[sc_Y] && !Keyboard[sc_N] && !Keyboard[sc_Escape]);
// 	#endif
// 
// 	#ifdef SPANISH
// 	if (Keyboard[sc_S])
// 	{
// 		xit=1;
// 		ShootSnd();
// 	}
// 
// 	while(Keyboard[sc_S] || Keyboard[sc_N] || Keyboard[sc_Escape]);
// 
// 	#else
// 
// 	if (Keyboard[sc_Y])
// 	{
// 		xit=1;
// 		ShootSnd();
// 	}
// 
// 	while(Keyboard[sc_Y] || Keyboard[sc_N] || Keyboard[sc_Escape]);
// 	#endif
// 
// 	IN_ClearKeysDown();
// 	SD_PlaySound(whichsnd[xit]);
// 	return xit;
// }
// #endif
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // PRINT A MESSAGE IN A WINDOW
// //
// ////////////////////////////////////////////////////////////////////
// void Message(char far *string)
// {
// 	int h=0,w=0,mw=0,i,x,y,time;
// 	fontstruct _seg *font;
// 
// 
// 	CA_CacheGrChunk (STARTFONT+1);
// 	fontnumber=1;
// 	font=grsegs[STARTFONT+fontnumber];
// 	h=font->height;
// 	for (i=0;i<_fstrlen(string);i++)
// 		if (string[i]=='\n')
// 		{
// 			if (w>mw)
// 				mw=w;
// 			w=0;
// 			h+=font->height;
// 		}
// 		else
// 			w+=font->width[string[i]];
// 
// 	if (w+10>mw)
// 		mw=w+10;
// 
// 	PrintY=(WindowH/2)-h/2;
// 	PrintX=WindowX=160-mw/2;
// 
// 	DrawWindow(WindowX-5,PrintY-5,mw+10,h+10,TEXTCOLOR);
// 	DrawOutline(WindowX-5,PrintY-5,mw+10,h+10,0,HIGHLIGHT);
// 	SETFONTCOLOR(0,TEXTCOLOR);
// 	US_Print(string);
// 	VW_UpdateScreen();
// }
// 
// 
// ////////////////////////////////////////////////////////////////////
// //
// // THIS MAY BE FIXED A LITTLE LATER...
// //
// ////////////////////////////////////////////////////////////////////
// static	int	lastmusic;
// 
// void StartCPMusic(int song)
// {
// 	musicnames	chunk;
// 
// 	if (audiosegs[STARTMUSIC + lastmusic])	// JDC
// 		MM_FreePtr ((memptr *)&audiosegs[STARTMUSIC + lastmusic]);
// 	lastmusic = song;
// 
// 	SD_MusicOff();
// 	chunk =	song;
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
// void FreeMusic (void)
// {
// 	if (audiosegs[STARTMUSIC + lastmusic])	// JDC
// 		MM_FreePtr ((memptr *)&audiosegs[STARTMUSIC + lastmusic]);
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// //	IN_GetScanName() - Returns a string containing the name of the
// //		specified scan code
// //
// ///////////////////////////////////////////////////////////////////////////
// byte *
// IN_GetScanName(ScanCode scan)
// {
// 	byte		**p;
// 	ScanCode	far *s;
// 
// 	for (s = ExtScanCodes,p = ExtScanNames;*s;p++,s++)
// 		if (*s == scan)
// 			return(*p);
// 
// 	return(ScanNames[scan]);
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// // CHECK FOR PAUSE KEY (FOR MUSIC ONLY)
// //
// ///////////////////////////////////////////////////////////////////////////
// void CheckPause(void)
// {
// 	if (Paused)
// 	{
// 		switch(SoundStatus)
// 		{
// 			case 0: SD_MusicOn(); break;
// 			case 1: SD_MusicOff(); break;
// 		}
// 
// 		SoundStatus^=1;
// 		VW_WaitVBL(3);
// 		IN_ClearKeysDown();
// 		Paused=false;
//  }
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// // DRAW GUN CURSOR AT CORRECT POSITION IN MENU
// //
// ///////////////////////////////////////////////////////////////////////////
// void DrawMenuGun(CP_iteminfo *iteminfo)
// {
// 	int x,y;
// 
// 
// 	x=iteminfo->x;
// 	y=iteminfo->y+iteminfo->curpos*13-2;
// 	VWB_DrawPic(x,y,C_CURSOR1PIC);
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// // DRAW SCREEN TITLE STRIPES
// //
// ///////////////////////////////////////////////////////////////////////////
// void DrawStripes(int y)
// {
// #ifndef SPEAR
// 	VWB_Bar(0,y,320,24,0);
// 	VWB_Hlin(0,319,y+22,STRIPE);
// #else
// 	VWB_Bar(0,y,320,22,0);
// 	VWB_Hlin(0,319,y+23,0);
// #endif
// }
// 
// void ShootSnd(void)
// {
// 	SD_PlaySound(SHOOTSND);
// }
// 
// 
// ///////////////////////////////////////////////////////////////////////////
// //
// // CHECK FOR EPISODES
// //
// ///////////////////////////////////////////////////////////////////////////
// void CheckForEpisodes(void)
// {
// 	struct ffblk f;
// 
// //
// // JAPANESE VERSION
// //
// #ifdef JAPAN
// #ifdef JAPDEMO
// 	if (!findfirst("*.WJ1",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"WJ1");
// #else
// 	if (!findfirst("*.WJ6",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"WJ6");
// #endif
// 		strcat(configname,extension);
// 		strcat(SaveName,extension);
// 		strcat(PageFileName,extension);
// 		strcat(audioname,extension);
// 		strcat(demoname,extension);
// 		EpisodeSelect[1] =
// 		EpisodeSelect[2] =
// 		EpisodeSelect[3] =
// 		EpisodeSelect[4] =
// 		EpisodeSelect[5] = 1;
// 	}
// 	else
// 		Quit("NO JAPANESE WOLFENSTEIN 3-D DATA FILES to be found!");
// #else
// 
// //
// // ENGLISH
// //
// #ifndef UPLOAD
// #ifndef SPEAR
// 	if (!findfirst("*.WL6",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"WL6");
// 		NewEmenu[2].active =
// 		NewEmenu[4].active =
// 		NewEmenu[6].active =
// 		NewEmenu[8].active =
// 		NewEmenu[10].active =
// 		EpisodeSelect[1] =
// 		EpisodeSelect[2] =
// 		EpisodeSelect[3] =
// 		EpisodeSelect[4] =
// 		EpisodeSelect[5] = 1;
// 	}
// 	else
// 	if (!findfirst("*.WL3",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"WL3");
// 		NewEmenu[2].active =
// 		NewEmenu[4].active =
// 		EpisodeSelect[1] =
// 		EpisodeSelect[2] = 1;
// 	}
// 	else
// #endif
// #endif
// 
// 
// 
// #ifdef SPEAR
// #ifndef SPEARDEMO
// 	if (!findfirst("*.SOD",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"SOD");
// 	}
// 	else
// 		Quit("NO SPEAR OF DESTINY DATA FILES TO BE FOUND!");
// #else
// 	if (!findfirst("*.SDM",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"SDM");
// 	}
// 	else
// 		Quit("NO SPEAR OF DESTINY DEMO DATA FILES TO BE FOUND!");
// #endif
// 
// #else
// 	if (!findfirst("*.WL1",&f,FA_ARCH))
// 	{
// 		strcpy(extension,"WL1");
// 	}
// 	else
// 		Quit("NO WOLFENSTEIN 3-D DATA FILES to be found!");
// #endif
// 
// 	strcat(configname,extension);
// 	strcat(SaveName,extension);
// 	strcat(PageFileName,extension);
// 	strcat(audioname,extension);
// 	strcat(demoname,extension);
// #ifndef SPEAR
// #ifndef GOODTIMES
// 	strcat(helpfilename,extension);
// #endif
// 	strcat(endfilename,extension);
// #endif
// #endif
// }
// 
