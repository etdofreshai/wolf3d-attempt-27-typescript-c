import { DOSMemory } from "./TS_DOS_MEMORY";
import { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";
import { MaxHighName, MaxScores, Scores, US_SetWindowState, WindowH, WindowW, WindowX, WindowY, type HighScore, type WindowSummary } from "./ID_US_1.C";
import {
  currentPalette,
  VL_FadeIn,
  VL_FadeOut,
  type FadeSummary,
  type PlanarFillSummary,
} from "./ID_VL.C";
import {
  LatchDrawPic,
  update,
  VWB_Bar,
  VWB_DrawPic,
  VW_SetFontState,
  VW_UpdateScreen,
  type BufferedDrawSummary,
  type BufferedPicDrawSummary,
  type DrawPicOptions,
  type LatchDrawPicSummary,
  type UpdateScreenSummary,
} from "./ID_VH.C";
import { IN_Ack, IN_ClearKeysDown, IN_UserInput } from "./ID_IN.C";
import { CA_CacheGrChunk, UNCACHEGRCHUNK } from "./ID_CA.C";
import { PM_Preload, type PagePreloadSummary } from "./ID_PM.C";
import { SD_SetTimeCount, TimeCount } from "./ID_SD.C";
import { DrawLevel, GivePoints, type LatchNumberSummary, type StatusDrawOptions } from "./WL_AGENT.C";
import { DrawPlayBorder, type PlayBorderSummary } from "./WL_GAME.C";
import { ClearMScreen, DrawStripes } from "./WL_MENU.C";
import {
  STARTFONT,
  GETPSYCHEDPIC,
  L_APIC,
  L_APOSTROPHEPIC,
  L_COLONPIC,
  L_EXPOINTPIC,
  L_GUYPIC,
  L_GUY2PIC,
  L_NUM0PIC,
  L_PERCENTPIC,
  PG13PIC,
} from "./TS_WL6_ASSETS";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_INTER.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_INTER.C";
export const WOLFSRC_FUNCTIONS = [
  "BackDoor",
  "BJ_Breathe",
  "CheckHighScore",
  "ClearSplitVWB",
  "CopyProtection",
  "DrawHighScores",
  "EndScreen",
  "EndSpear",
  "LevelCompleted",
  "NonShareware",
  "PG13",
  "PreloadGraphics",
  "PreloadUpdate",
  "Victory",
  "Write"
] as const;

export interface ClearSplitVWBSummary {
  readonly clearedBlocks: number;
  readonly window: WindowSummary;
}

export interface PreloadUpdateSummary {
  readonly current: number;
  readonly total: number;
  readonly width: number;
  readonly filledWidth: number;
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
  readonly fill: BufferedDrawSummary<PlanarFillSummary> | null;
  readonly highlight: BufferedDrawSummary<PlanarFillSummary> | null;
  readonly update: UpdateScreenSummary;
  readonly aborted: false;
}

export interface PreloadGraphicsOptions extends StatusDrawOptions {
  readonly palette?: Uint8Array;
  readonly userInputMaxPolls?: number;
  readonly userInputPollHook?: ((poll: number) => void) | null;
}

export interface PreloadGraphicsSummary {
  readonly level: LatchNumberSummary;
  readonly split: ClearSplitVWBSummary;
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
  readonly getPsyched: LatchDrawPicSummary;
  readonly window: WindowSummary;
  readonly firstUpdate: UpdateScreenSummary;
  readonly fadeIn: FadeSummary;
  readonly preload: PagePreloadSummary;
  readonly lastPreload: PreloadUpdateSummary | null;
  readonly userInput: boolean;
  readonly fadeOut: FadeSummary;
  readonly border: PlayBorderSummary;
  readonly finalUpdate: UpdateScreenSummary;
}

export interface IntermissionWriteOptions {
  readonly pictable?: Uint8Array;
  readonly chunks?: readonly (Uint8Array | null | undefined)[];
}

export interface IntermissionWriteSummary {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly draws: readonly BufferedPicDrawSummary[];
  readonly picnums: readonly number[];
  readonly finalX: number;
  readonly finalY: number;
}

export interface BJBreatheSummary {
  readonly breathed: boolean;
  readonly which: number;
  readonly max: number;
  readonly timeCount: number;
  readonly picnum: number | null;
  readonly draw: BufferedPicDrawSummary | null;
  readonly update: UpdateScreenSummary | null;
}

export interface PG13Options extends IntermissionWriteOptions {
  readonly palette?: Uint8Array;
  readonly userInputMaxPolls?: number;
  readonly userInputPollHook?: ((poll: number) => void) | null;
}

export interface PG13Summary {
  readonly fadeOutBefore: FadeSummary;
  readonly background: BufferedDrawSummary<PlanarFillSummary>;
  readonly cached: boolean;
  readonly draw: BufferedPicDrawSummary;
  readonly update: UpdateScreenSummary;
  readonly fadeIn: FadeSummary;
  readonly userInput: boolean;
  readonly fadeOutAfter: FadeSummary;
}

export interface HighScorePrintSummary {
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export interface DrawHighScoreRowSummary {
  readonly index: number;
  readonly y: number;
  readonly score: HighScore;
  readonly name: HighScorePrintSummary;
  readonly episodeLevel: HighScorePrintSummary;
  readonly levelDigits: HighScorePrintSummary;
  readonly scoreDigits: HighScorePrintSummary;
}

export interface DrawHighScoresOptions {
  readonly cacheGraphic?: (chunk: number) => unknown;
  readonly uncacheGraphic?: (chunk: number) => unknown;
  readonly drawPic?: (x: number, y: number, picnum: number) => unknown;
  readonly print?: (x: number, y: number, text: string) => unknown;
  readonly measureText?: (text: string) => number;
  readonly update?: () => unknown;
  readonly clearScreen?: () => unknown;
  readonly drawStripes?: (y: number) => unknown;
}

export interface DrawHighScoresSummary {
  readonly cached: readonly unknown[];
  readonly clearScreen: unknown;
  readonly stripes: unknown;
  readonly headerPics: readonly unknown[];
  readonly uncacheTitle: unknown;
  readonly font: ReturnType<typeof VW_SetFontState>;
  readonly rows: readonly DrawHighScoreRowSummary[];
  readonly prints: readonly unknown[];
  readonly update: unknown;
}

export interface CheckHighScoreOptions {
  readonly episode?: number;
  readonly startMusic?: (song: number) => unknown;
  readonly drawHighScores?: () => unknown;
  readonly drawOptions?: DrawHighScoresOptions;
  readonly fadeIn?: () => unknown;
  readonly nameInput?: (index: number, score: HighScore) => string | null | undefined;
  readonly clearKeysDown?: () => unknown;
  readonly userInput?: (ticks: number) => unknown;
}

export interface CheckHighScoreSummary {
  readonly score: number;
  readonly completed: number;
  readonly episode: number;
  readonly inserted: boolean;
  readonly index: number;
  readonly music: unknown;
  readonly draw: unknown;
  readonly fadeIn: unknown;
  readonly nameInput: string | null;
  readonly clearKeysDown: unknown;
  readonly userInput: unknown;
  readonly scores: readonly HighScore[];
}

export interface NonSharewareOptions {
  readonly cacheFont?: (chunk: number) => unknown;
  readonly print?: (x: number, y: number, text: string) => unknown;
  readonly ackMaxPolls?: number;
  readonly ackPollHook?: ((poll: number) => void) | null;
  readonly palette?: Uint8Array;
}

export interface NonSharewareSummary {
  readonly fadeOut: FadeSummary;
  readonly clearScreen: unknown;
  readonly stripes: unknown;
  readonly cacheFont: unknown;
  readonly headingFont: ReturnType<typeof VW_SetFontState>;
  readonly heading: unknown;
  readonly bodyFont: ReturnType<typeof VW_SetFontState>;
  readonly body: readonly unknown[];
  readonly update: UpdateScreenSummary;
  readonly fadeIn: FadeSummary;
  readonly ack: boolean;
}

export interface BackDoorSummary {
  readonly input: string;
  readonly normalized: string;
  readonly match: boolean;
  readonly index: number;
  readonly response: readonly string[] | null;
}

export interface CopyProtectionOptions {
  readonly quizType?: "debriefing" | "checkmanual" | "staffquiz" | "miscquiz";
  readonly choice?: number;
  readonly input?: string;
  readonly rng?: () => number;
}

export interface CopyProtectionSummary {
  readonly quizType: string;
  readonly choice: number;
  readonly input: string;
  readonly correct: boolean;
  readonly backDoor: BackDoorSummary;
  readonly tries: number;
  readonly accepted: boolean;
}

export interface EndScreenSummary {
  readonly palette: number;
  readonly screen: number;
  readonly update: UpdateScreenSummary;
  readonly cachePalette: unknown;
  readonly fadeIn: FadeSummary;
  readonly uncachePalette: unknown;
  readonly clearKeys: boolean;
  readonly ack: boolean;
  readonly fadeOut: FadeSummary;
}

export interface EndScreenOptions {
  readonly paletteBytes?: Uint8Array;
  readonly cacheGraphic?: (chunk: number) => unknown;
  readonly uncacheGraphic?: (chunk: number) => unknown;
}

export interface EndSpearSummary {
  readonly screens: readonly EndScreenSummary[];
  readonly storyScreens: readonly number[];
  readonly savegameActive: false;
}

export interface LevelRatio {
  kill: number;
  secret: number;
  treasure: number;
  time: number;
}

export interface LevelCompletedSummary {
  readonly mapon: number;
  readonly episode: number;
  readonly normalFloor: boolean;
  readonly parTime: string;
  readonly elapsedSeconds: number;
  readonly displayTime: string;
  readonly timeLeft: number;
  readonly ratios: LevelRatio;
  readonly bonus: number;
  readonly score: number;
  readonly scoreDraw: LatchNumberSummary | null;
  readonly savedRatio: LevelRatio | null;
  readonly fadeOut: FadeSummary;
  readonly borderPages: readonly PlayBorderSummary[];
}

export interface LevelCompletedOptions {
  readonly drawScore?: (dgroup: DOSMemory) => LatchNumberSummary;
}

export interface VictorySummary {
  readonly totalSeconds: number;
  readonly totalTime: string;
  readonly averages: LevelRatio;
  readonly timeCode: string | null;
  readonly ending: "EndText" | "EndSpear";
}

const BLACK = 0;
const STATUSLINES = 40;
const TICKBASE = 70;
const BORDCOLOR = 0x29;
const BKGDCOLOR = 0x2d;
const HIGHLIGHT = 0x13;
const READHCOLOR = 0x47;
const HIGHSCORESPIC = 90;
const C_LEVELPIC = 38;
const C_NAMEPIC = 39;
const C_SCOREPIC = 40;
const ROSTER_MUS = 23;
const PAR_AMOUNT = 500;
const PERCENT100AMT = 10000;
const END1PALETTE = 154;
const END2PALETTE = 155;
const END3PALETTE = 156;
const END4PALETTE = 157;
const END5PALETTE = 158;
const END6PALETTE = 159;
const END7PALETTE = 160;
const END8PALETTE = 161;
const END9PALETTE = 162;
const ENDSCREEN11PIC = 81;
const ENDSCREEN12PIC = 82;
const ENDSCREEN3PIC = 83;
const ENDSCREEN4PIC = 84;
const ENDSCREEN5PIC = 85;
const ENDSCREEN6PIC = 86;
const ENDSCREEN7PIC = 87;
const ENDSCREEN8PIC = 88;
const ENDSCREEN9PIC = 89;
const WL6_PAR_TIMES = [
  [1.5, "01:30"], [2, "02:00"], [2, "02:00"], [3.5, "03:30"], [3, "03:00"], [3, "03:00"], [2.5, "02:30"], [2.5, "02:30"], [0, "??:??"], [0, "??:??"],
  [1.5, "01:30"], [3.5, "03:30"], [3, "03:00"], [2, "02:00"], [4, "04:00"], [6, "06:00"], [1, "01:00"], [3, "03:00"], [0, "??:??"], [0, "??:??"],
  [1.5, "01:30"], [1.5, "01:30"], [2.5, "02:30"], [2.5, "02:30"], [3.5, "03:30"], [2.5, "02:30"], [2, "02:00"], [6, "06:00"], [0, "??:??"], [0, "??:??"],
  [2, "02:00"], [2, "02:00"], [1.5, "01:30"], [1, "01:00"], [4.5, "04:30"], [3.5, "03:30"], [2, "02:00"], [4.5, "04:30"], [0, "??:??"], [0, "??:??"],
  [2.5, "02:30"], [1.5, "01:30"], [2.5, "02:30"], [2.5, "02:30"], [4, "04:00"], [3, "03:00"], [4.5, "04:30"], [3.5, "03:30"], [0, "??:??"], [0, "??:??"],
  [6.5, "06:30"], [4, "04:00"], [4.5, "04:30"], [6, "06:00"], [5, "05:00"], [5.5, "05:30"], [5.5, "05:30"], [8.5, "08:30"], [0, "??:??"], [0, "??:??"],
] as const;
const BACKDOOR_STRS = ["a spoon?", "bite me!", "joshua", "pelt", "snoops"] as const;
const GOODBOY_STRS = [
  ["...is the CORRECT ANSWER!", ""],
  ["Consider yourself bitten, sir.", ""],
  ["Greetings Professor Falken, would you", "like to play Spear of Destiny?"],
  ["Do you have any gold spray paint?", ""],
  ["I wish I had a 21\" monitor...", ""],
] as const;
const COPY_QUIZ_TYPES = ["debriefing", "checkmanual", "staffquiz", "miscquiz"] as const;
const BOSS_CORRECT = ["DEATH KNIGHT", "BARNACLE WILHELM", "UBERMUTANTUBER MUTANT", "TRANS GROSSE"] as const;
const WORD_CORRECT = ["3", "4", "4", "5", "5"] as const;
const MEMBER_CORRECT = ["adrian carmack", "john carmackjohn romero", "tom hall", "jay wilbur", "kevin cloud"] as const;
const MISC_CORRECT = ["ss", "8", "*", "45"] as const;
const ALPHA = [
  L_NUM0PIC, L_NUM0PIC + 1, L_NUM0PIC + 2, L_NUM0PIC + 3, L_NUM0PIC + 4,
  L_NUM0PIC + 5, L_NUM0PIC + 6, L_NUM0PIC + 7, L_NUM0PIC + 8, L_NUM0PIC + 9,
  L_COLONPIC, 0, 0, 0, 0, 0, 0,
  L_APIC, L_APIC + 1, L_APIC + 2, L_APIC + 3, L_APIC + 4, L_APIC + 5,
  L_APIC + 6, L_APIC + 7, L_APIC + 8, L_APIC + 9, L_APIC + 10, L_APIC + 11,
  L_APIC + 12, L_APIC + 13, L_APIC + 14, L_APIC + 15, L_APIC + 16, L_APIC + 17,
  L_APIC + 18, L_APIC + 19, L_APIC + 20, L_APIC + 21, L_APIC + 22, L_APIC + 23,
  L_APIC + 24, L_APIC + 25,
] as const;

export let lastPreloadUpdate: PreloadUpdateSummary | null = null;
export const LevelRatios: LevelRatio[] = Array.from({ length: 20 }, () => ({ kill: 0, secret: 0, treasure: 0, time: 0 }));
let bjWhich = 0;
let bjMax = 10;

export function BackDoor(input: string): BackDoorSummary {
  const normalized = input.toLowerCase();
  const index = BACKDOOR_STRS.indexOf(normalized as (typeof BACKDOOR_STRS)[number]);
  return {
    input,
    normalized,
    match: index !== -1,
    index,
    response: index === -1 ? null : GOODBOY_STRS[index],
  };
}

export function BJ_Breathe(options: IntermissionWriteOptions = {}): BJBreatheSummary {
  if (TimeCount > bjMax) {
    bjWhich ^= 1;
    const picnum = bjWhich ? L_GUY2PIC : L_GUYPIC;
    const draw = VWB_DrawPic(0, 16, picnum, writePicOptions(picnum, options));
    const updateSummary = VW_UpdateScreen();
    SD_SetTimeCount(0);
    bjMax = 35;
    return {
      breathed: true,
      which: bjWhich,
      max: bjMax,
      timeCount: TimeCount,
      picnum,
      draw,
      update: updateSummary,
    };
  }

  return {
    breathed: false,
    which: bjWhich,
    max: bjMax,
    timeCount: TimeCount,
    picnum: null,
    draw: null,
    update: null,
  };
}

function highScoreFixedDigits(value: number): string {
  const text = (Math.trunc(value) >>> 0).toString(10);
  return String.fromCharCode(...Array.from(text, (ch) => ch.charCodeAt(0) + (129 - 48)));
}

function highScoreMeasure(text: string, options: DrawHighScoresOptions): number {
  return Math.trunc(options.measureText?.(text) ?? text.length * 8);
}

function highScorePrint(
  x: number,
  y: number,
  text: string,
  options: DrawHighScoresOptions,
  prints: unknown[],
): HighScorePrintSummary {
  const summary = { x: Math.trunc(x), y: Math.trunc(y), text };
  prints.push(options.print?.(summary.x, summary.y, text) ?? summary);
  return summary;
}

function copyScores(): HighScore[] {
  return Scores.map((score) => ({ ...score }));
}

export function CheckHighScore(score: number, other: number, options: CheckHighScoreOptions = {}): CheckHighScoreSummary {
  const myscore: HighScore = {
    name: "",
    score: Math.trunc(score),
    episode: Math.trunc(options.episode ?? 0),
    completed: Math.trunc(other),
  };

  let index = -1;
  for (let i = 0; i < MaxScores; i++) {
    const current = Scores[i];
    if (myscore.score > current.score || (myscore.score === current.score && myscore.completed > current.completed)) {
      for (let j = MaxScores; --j > i;) {
        Scores[j] = { ...Scores[j - 1] };
      }
      Scores[i] = myscore;
      index = i;
      break;
    }
  }

  const music = options.startMusic?.(ROSTER_MUS) ?? null;
  const draw = options.drawHighScores?.() ?? DrawHighScores(options.drawOptions ?? {});
  const fadeIn = options.fadeIn?.() ?? VL_FadeIn(0, 255, new Uint8Array(currentPalette), 30);
  let nameInput: string | null = null;
  let clearKeysDown: unknown = null;
  let userInput: unknown = null;

  if (index !== -1) {
    const nextName = options.nameInput?.(index, Scores[index]) ?? Scores[index].name;
    nameInput = nextName.slice(0, MaxHighName);
    Scores[index].name = nameInput;
  } else {
    clearKeysDown = options.clearKeysDown?.() ?? IN_ClearKeysDown();
    userInput = options.userInput?.(500) ?? IN_UserInput(500, 1, null);
  }

  return {
    score: myscore.score,
    completed: myscore.completed,
    episode: myscore.episode,
    inserted: index !== -1,
    index,
    music,
    draw,
    fadeIn,
    nameInput,
    clearKeysDown,
    userInput,
    scores: copyScores(),
  };
}

export function ClearSplitVWB(): ClearSplitVWBSummary {
  update.fill(0);
  const window = US_SetWindowState(0, 0, 320, 160);
  return { clearedBlocks: update.length, window };
}

export function CopyProtection(options: CopyProtectionOptions = {}): CopyProtectionSummary {
  const rng = options.rng ?? Math.random;
  const quizType = options.quizType ?? COPY_QUIZ_TYPES[Math.trunc(rng() * COPY_QUIZ_TYPES.length) % COPY_QUIZ_TYPES.length];
  const choice = Math.max(0, Math.trunc(options.choice ?? Math.trunc(rng() * 5)));
  const input = options.input ?? "";
  const normalized = input.toLowerCase();
  const backDoor = BackDoor(input);
  let correct = false;

  switch (quizType) {
    case "debriefing": {
      const answer = BOSS_CORRECT[choice & 3].toLowerCase();
      correct = normalized.length > 3 && answer.includes(normalized);
      break;
    }
    case "checkmanual":
      correct = normalized === WORD_CORRECT[choice % WORD_CORRECT.length];
      break;
    case "staffquiz": {
      const answer = MEMBER_CORRECT[choice % MEMBER_CORRECT.length];
      correct = normalized.length > 2 && answer.includes(normalized);
      break;
    }
    case "miscquiz":
      correct = normalized === MISC_CORRECT[choice % MISC_CORRECT.length];
      break;
  }

  return {
    quizType,
    choice,
    input,
    correct,
    backDoor,
    tries: 1,
    accepted: correct || backDoor.match,
  };
}

export function DrawHighScores(options: DrawHighScoresOptions = {}): DrawHighScoresSummary {
  const cached = [HIGHSCORESPIC, STARTFONT, C_LEVELPIC, C_SCOREPIC, C_NAMEPIC].map((chunk) => options.cacheGraphic?.(chunk) ?? chunk);
  const clearScreen = options.clearScreen?.() ?? ClearMScreen();
  const stripes = options.drawStripes?.(10) ?? DrawStripes(10);
  const headerPics = [
    options.drawPic?.(48, 0, HIGHSCORESPIC) ?? { x: 48, y: 0, picnum: HIGHSCORESPIC },
    options.drawPic?.(4 * 8, 68, C_NAMEPIC) ?? { x: 4 * 8, y: 68, picnum: C_NAMEPIC },
    options.drawPic?.(20 * 8, 68, C_LEVELPIC) ?? { x: 20 * 8, y: 68, picnum: C_LEVELPIC },
    options.drawPic?.(28 * 8, 68, C_SCOREPIC) ?? { x: 28 * 8, y: 68, picnum: C_SCOREPIC },
  ];
  const uncacheTitle = options.uncacheGraphic?.(HIGHSCORESPIC) ?? null;
  const font = VW_SetFontState({ fontnumber: 0, fontcolor: 15, backcolor: BORDCOLOR });
  const rows: DrawHighScoreRowSummary[] = [];
  const prints: unknown[] = [];

  for (let i = 0; i < MaxScores; i++) {
    const score = Scores[i];
    const y = 76 + 16 * i;
    const name = highScorePrint(4 * 8, y, score.name, options, prints);
    const levelDigitsText = highScoreFixedDigits(score.completed);
    const levelX = 22 * 8 - highScoreMeasure(levelDigitsText, options) - 6;
    const episodeLevel = highScorePrint(levelX, y, `E${score.episode + 1}/L`, options, prints);
    const levelDigits = highScorePrint(levelX + episodeLevel.text.length * 8, y, levelDigitsText, options, prints);
    const scoreDigitsText = highScoreFixedDigits(score.score);
    const scoreX = 34 * 8 - 8 - highScoreMeasure(scoreDigitsText, options);
    const scoreDigits = highScorePrint(scoreX, y, scoreDigitsText, options, prints);
    rows.push({ index: i, y, score: { ...score }, name, episodeLevel, levelDigits, scoreDigits });
  }

  const updateSummary = options.update?.() ?? VW_UpdateScreen();
  return { cached, clearScreen, stripes, headerPics, uncacheTitle, font, rows, prints, update: updateSummary };
}

export function EndScreen(palette: number, screen: number, options: EndScreenOptions = {}): EndScreenSummary {
  const updateSummary = VW_UpdateScreen();
  const cachePalette = options.cacheGraphic?.(palette) ?? palette;
  const fadeIn = VL_FadeIn(0, 255, options.paletteBytes ?? new Uint8Array(currentPalette), 30);
  const uncachePalette = options.uncacheGraphic?.(palette) ?? palette;
  const clearKeys = !!IN_ClearKeysDown();
  const ack = IN_Ack();
  const fadeOut = VL_FadeOut(0, 255, 0, 0, 0, 30);
  return {
    palette,
    screen,
    update: updateSummary,
    cachePalette,
    fadeIn,
    uncachePalette,
    clearKeys,
    ack,
    fadeOut,
  };
}

export function EndSpear(): EndSpearSummary {
  const screens = [
    EndScreen(END1PALETTE, ENDSCREEN11PIC),
    EndScreen(END4PALETTE, ENDSCREEN4PIC),
    EndScreen(END5PALETTE, ENDSCREEN5PIC),
    EndScreen(END6PALETTE, ENDSCREEN6PIC),
    EndScreen(END7PALETTE, ENDSCREEN7PIC),
    EndScreen(END8PALETTE, ENDSCREEN8PIC),
    EndScreen(END9PALETTE, ENDSCREEN9PIC),
    EndScreen(END2PALETTE, ENDSCREEN12PIC),
  ];
  return {
    screens,
    storyScreens: [ENDSCREEN3PIC, END3PALETTE],
    savegameActive: false,
  };
}

export function LevelCompleted(dgroup: DOSMemory, options: LevelCompletedOptions = {}): LevelCompletedSummary {
  const gamestate = nearGamestate();
  const mapon = dgroup.u16(gamestate + gamestateFieldOffset("mapon"));
  const episode = dgroup.u16(gamestate + gamestateFieldOffset("episode"));
  const timeCount = dgroup.u32(gamestate + gamestateFieldOffset("TimeCount"));
  const par = WL6_PAR_TIMES[episode * 10 + mapon] ?? [0, "??:??"];
  const elapsedSeconds = Math.min(Math.trunc(timeCount / TICKBASE), 99 * 60);
  const parTicks = par[0] * 4200;
  const timeLeft = timeCount < parTicks ? Math.trunc(parTicks / TICKBASE - elapsedSeconds) : 0;
  const ratios = {
    kill: ratio(dgroup.u16(gamestate + gamestateFieldOffset("killcount")), dgroup.u16(gamestate + gamestateFieldOffset("killtotal"))),
    secret: ratio(dgroup.u16(gamestate + gamestateFieldOffset("secretcount")), dgroup.u16(gamestate + gamestateFieldOffset("secrettotal"))),
    treasure: ratio(dgroup.u16(gamestate + gamestateFieldOffset("treasurecount")), dgroup.u16(gamestate + gamestateFieldOffset("treasuretotal"))),
    time: elapsedSeconds,
  };
  const normalFloor = mapon < 8;
  const bonus = normalFloor
    ? timeLeft * PAR_AMOUNT
      + (ratios.kill === 100 ? PERCENT100AMT : 0)
      + (ratios.secret === 100 ? PERCENT100AMT : 0)
      + (ratios.treasure === 100 ? PERCENT100AMT : 0)
    : 15000;
  GivePoints(dgroup, bonus);
  const scoreDraw = options.drawScore?.(dgroup) ?? null;
  const displayMinutes = Math.trunc(elapsedSeconds / 60);
  const displaySeconds = elapsedSeconds % 60;
  const savedRatio = normalFloor
    ? { ...ratios }
    : null;
  if (savedRatio) {
    LevelRatios[mapon] = savedRatio;
  }
  const fadeOut = VL_FadeOut(0, 255, 0, 0, 0, 30);
  const borderPages = [DrawPlayBorder(), DrawPlayBorder(), DrawPlayBorder()];

  return {
    mapon,
    episode,
    normalFloor,
    parTime: par[1],
    elapsedSeconds,
    displayTime: `${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`,
    timeLeft,
    ratios,
    bonus,
    score: dgroup.u32(gamestate + gamestateFieldOffset("score")),
    scoreDraw,
    savedRatio,
    fadeOut,
    borderPages,
  };
}

export function NonShareware(options: NonSharewareOptions = {}): NonSharewareSummary {
  const fadeOut = VL_FadeOut(0, 255, 0, 0, 0, 30);
  const clearScreen = ClearMScreen();
  const stripes = DrawStripes(10);
  const cacheFont = options.cacheFont?.(STARTFONT + 1) ?? null;
  const headingFont = VW_SetFontState({ fontnumber: 1, fontcolor: READHCOLOR, backcolor: BKGDCOLOR, px: 110, py: 15 });
  const heading = options.print?.(110, 15, "Attention") ?? { x: 110, y: 15, text: "Attention" };
  const bodyFont = VW_SetFontState({ fontcolor: HIGHLIGHT, backcolor: BKGDCOLOR, px: 40, py: 60 });
  const bodyText = [
    "This game is NOT shareware.\n",
    "Please do not distribute it.\n",
    "Thanks.\n\n",
    "        Id Software\n",
  ];
  let y = 60;
  const body = bodyText.map((text) => {
    const printed = options.print?.(40, y, text) ?? { x: 40, y, text };
    y += Math.max(1, text.split("\n").length - 1) * 8;
    return printed;
  });
  const updateSummary = VW_UpdateScreen();
  const fadeIn = VL_FadeIn(0, 255, options.palette ?? new Uint8Array(currentPalette), 30);
  const ack = IN_Ack(options.ackMaxPolls ?? 1, options.ackPollHook ?? null);
  return { fadeOut, clearScreen, stripes, cacheFont, headingFont, heading, bodyFont, body, update: updateSummary, fadeIn, ack };
}

export function PG13(options: PG13Options = {}): PG13Summary {
  const fadeOutBefore = VL_FadeOut(0, 255, 0, 0, 0, 30);
  const background = VWB_Bar(0, 0, 320, 200, 0x82);
  const cached = !options.chunks?.[PG13PIC];
  if (cached) {
    CA_CacheGrChunk(PG13PIC);
  }
  let draw: BufferedPicDrawSummary;
  try {
    draw = VWB_DrawPic(216, 110, PG13PIC, writePicOptions(PG13PIC, options));
  } finally {
    if (cached) {
      UNCACHEGRCHUNK(PG13PIC);
    }
  }
  const updateSummary = VW_UpdateScreen();
  const fadeIn = VL_FadeIn(0, 255, options.palette ?? new Uint8Array(currentPalette), 30);
  const userInput = IN_UserInput(TICKBASE * 7, options.userInputMaxPolls ?? 1, options.userInputPollHook ?? null);
  const fadeOutAfter = VL_FadeOut(0, 255, 0, 0, 0, 30);
  return { fadeOutBefore, background, cached, draw, update: updateSummary, fadeIn, userInput, fadeOutAfter };
}

export function PreloadGraphics(dgroup: DOSMemory, options: PreloadGraphicsOptions = {}): PreloadGraphicsSummary {
  const level = DrawLevel(dgroup, options);
  const split = ClearSplitVWB();
  const background = VWB_Bar(0, 0, 320, 200 - STATUSLINES, 127);
  const getPsyched = LatchDrawPic(20 - 14, 80 - 3 * 8, GETPSYCHEDPIC, options);
  const window = US_SetWindowState(160 - 14 * 8, 80 - 3 * 8, 28 * 8, 48);
  const firstUpdate = VW_UpdateScreen();
  const fadeIn = VL_FadeIn(0, 255, options.palette ?? new Uint8Array(currentPalette), 30);
  const preload = PM_Preload(PreloadUpdate);
  const lastPreload = lastPreloadUpdate;
  const userInput = IN_UserInput(70, options.userInputMaxPolls ?? 1, options.userInputPollHook ?? null);
  const fadeOut = VL_FadeOut(0, 255, 0, 0, 0, 30);
  const border = DrawPlayBorder();
  const finalUpdate = VW_UpdateScreen();
  return {
    level,
    split,
    background,
    getPsyched,
    window,
    firstUpdate,
    fadeIn,
    preload,
    lastPreload,
    userInput,
    fadeOut,
    border,
    finalUpdate,
  };
}

export function PreloadUpdate(current: number, total: number): false {
  const width = WindowW - 10;
  const x = WindowX + 5;
  const y = WindowY + WindowH - 3;
  const background = VWB_Bar(x, y, width, 2, BLACK);
  const filledWidth = total ? Math.trunc((width * current) / total) : 0;
  let fill: BufferedDrawSummary<PlanarFillSummary> | null = null;
  let highlight: BufferedDrawSummary<PlanarFillSummary> | null = null;

  if (filledWidth) {
    fill = VWB_Bar(x, y, filledWidth, 2, 0x37);
    highlight = VWB_Bar(x, y, filledWidth - 1, 1, 0x32);
  }

  const updateSummary = VW_UpdateScreen();
  lastPreloadUpdate = {
    current,
    total,
    width,
    filledWidth,
    background,
    fill,
    highlight,
    update: updateSummary,
    aborted: false,
  };
  return false;
}

export function Victory(dgroup: DOSMemory, options: { readonly spear?: boolean } = {}): VictorySummary {
  const gamestate = nearGamestate();
  const divisor = options.spear ? 14 : 8;
  let totalSeconds = 0;
  let killTotal = 0;
  let secretTotal = 0;
  let treasureTotal = 0;
  const ratioCount = options.spear ? 20 : 8;
  for (let i = 0; i < ratioCount; i++) {
    const levelRatio = LevelRatios[i];
    totalSeconds += levelRatio.time;
    killTotal += levelRatio.kill;
    secretTotal += levelRatio.secret;
    treasureTotal += levelRatio.treasure;
  }
  const minutes = Math.min(99, Math.trunc(totalSeconds / 60));
  const seconds = minutes === 99 ? 99 : totalSeconds % 60;
  const averages = {
    kill: Math.trunc(killTotal / divisor),
    secret: Math.trunc(secretTotal / divisor),
    treasure: Math.trunc(treasureTotal / divisor),
    time: totalSeconds,
  };
  const difficulty = dgroup.u16(gamestate + gamestateFieldOffset("difficulty"));
  const timeCode = !options.spear && difficulty >= 2
    ? makeVictoryTimeCode(minutes, seconds)
    : null;
  return {
    totalSeconds,
    totalTime: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    averages,
    timeCode,
    ending: options.spear ? "EndSpear" : "EndText",
  };
}

export function Write(x: number, y: number, string: string, options: IntermissionWriteOptions = {}): IntermissionWriteSummary {
  const ox = x * 8;
  let nx = ox;
  let ny = y * 8;
  const draws: BufferedPicDrawSummary[] = [];
  const picnums: number[] = [];

  for (let i = 0; i < string.length; i++) {
    const original = string.charCodeAt(i) & 0xff;
    if (original === 0) {
      break;
    }
    if (original === 10) {
      nx = ox;
      ny += 16;
      continue;
    }

    switch (original) {
      case 33:
        drawWritePic(nx, ny, L_EXPOINTPIC, options, draws, picnums);
        nx += 8;
        continue;
      case 39:
        drawWritePic(nx, ny, L_APOSTROPHEPIC, options, draws, picnums);
        nx += 8;
        continue;
      case 32:
        break;
      case 58:
        drawWritePic(nx, ny, L_COLONPIC, options, draws, picnums);
        nx += 8;
        continue;
      case 37:
        drawWritePic(nx, ny, L_PERCENTPIC, options, draws, picnums);
        break;
      default: {
        let ch = original;
        if (ch >= 97) {
          ch -= 97 - 65;
        }
        ch -= 48;
        const picnum = ALPHA[ch];
        if (!picnum) {
          throw new RangeError(`WL_INTER.Write unsupported character ${String.fromCharCode(original)}`);
        }
        drawWritePic(nx, ny, picnum, options, draws, picnums);
      }
    }
    nx += 16;
  }

  return { x, y, text: string, draws, picnums, finalX: nx, finalY: ny };
}

function drawWritePic(
  x: number,
  y: number,
  picnum: number,
  options: IntermissionWriteOptions,
  draws: BufferedPicDrawSummary[],
  picnums: number[],
): void {
  const drawOptions = writePicOptions(picnum, options);
  draws.push(VWB_DrawPic(x, y, picnum, drawOptions));
  picnums.push(picnum);
}

function writePicOptions(picnum: number, options: IntermissionWriteOptions): DrawPicOptions {
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

function nearGamestate(): number {
  return nearOffsetForRuntimeSymbol("_gamestate");
}

function gamestateFieldOffset(name: string): number {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing gamestate field ${name}`);
  }
  return field[1];
}

function ratio(count: number, total: number): number {
  return total ? Math.trunc((count * 100) / total) : 0;
}

function makeVictoryTimeCode(minutes: number, seconds: number): string {
  const first = (((Math.trunc(minutes / 10) ^ (minutes % 10)) ^ 0x0a) + 65);
  const second = (((Math.trunc(seconds / 10) ^ (seconds % 10)) ^ 0x0a) + 65);
  const third = ((first ^ second) + 65) & 0xff;
  return String.fromCharCode(first, second, third);
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_INTER.C
// 
// #include "WL_DEF.H"
// #pragma hdrstop
// 
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = CLearSplitVWB
// =
// ==================
// */
// 
// void ClearSplitVWB (void)
// {
// 	memset (update,0,sizeof(update));
// 	WindowX = 0;
// 	WindowY = 0;
// 	WindowW = 320;
// 	WindowH = 160;
// }
// 
// 
// //==========================================================================
// 
// #ifdef SPEAR
// #ifndef SPEARDEMO
// ////////////////////////////////////////////////////////
// //
// // End of Spear of Destiny
// //
// ////////////////////////////////////////////////////////
// 
// void EndScreen (int palette, int screen)
// {
// 	CA_CacheScreen (screen);
// 	VW_UpdateScreen ();
// 	CA_CacheGrChunk (palette);
// 	VL_FadeIn(0,255,grsegs[palette],30);
// 	UNCACHEGRCHUNK (palette);
// 	IN_ClearKeysDown ();
// 	IN_Ack ();
// 	VW_FadeOut ();
// }
// 
// 
// void EndSpear(void)
// {
// 	EndScreen (END1PALETTE, ENDSCREEN11PIC);
// 
// 	CA_CacheScreen (ENDSCREEN3PIC);
// 	VW_UpdateScreen ();
// 	CA_CacheGrChunk (END3PALETTE);
// 	VL_FadeIn(0,255,grsegs[END3PALETTE],30);
// 	UNCACHEGRCHUNK (END3PALETTE);
// 	fontnumber = 0;
// 	fontcolor = 0xd0;
// 	WindowX = 0;
// 	WindowW = 320;
// 	PrintX = 0;
// 	PrintY = 180;
// 	US_CPrint (STR_ENDGAME1"\n");
// 	US_CPrint (STR_ENDGAME2);
// 	VW_UpdateScreen ();
// 	IN_StartAck ();
// 	TimeCount = 0;
// 	while (!IN_CheckAck () && TimeCount < 700);
// 
// 	PrintX = 0;
// 	PrintY = 180;
// 	VWB_Bar(0,180,320,20,0);
// 	US_CPrint (STR_ENDGAME3"\n");
// 	US_CPrint (STR_ENDGAME4);
// 	VW_UpdateScreen ();
// 	IN_StartAck ();
// 	TimeCount = 0;
// 	while (!IN_CheckAck () && TimeCount < 700);
// 
// 	VW_FadeOut ();
// 
// 	EndScreen (END4PALETTE, ENDSCREEN4PIC);
// 	EndScreen (END5PALETTE, ENDSCREEN5PIC);
// 	EndScreen (END6PALETTE, ENDSCREEN6PIC);
// 	EndScreen (END7PALETTE, ENDSCREEN7PIC);
// 	EndScreen (END8PALETTE, ENDSCREEN8PIC);
// 	EndScreen (END9PALETTE, ENDSCREEN9PIC);
// 
// 	EndScreen (END2PALETTE, ENDSCREEN12PIC);
// 
// 	MainMenu[savegame].active = 0;
// }
// #endif
// #endif
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = Victory
// =
// ==================
// */
// 
// void Victory (void)
// {
// #ifndef SPEARDEMO
// 	long	sec;
// 	int i,min,kr,sr,tr,x;
// 	char tempstr[8];
// 
// #define RATIOX	6
// #define RATIOY	14
// #define TIMEX	14
// #define TIMEY	8
// 
// 
// #ifdef SPEAR
// 	StartCPMusic (XTHEEND_MUS);
// 
// 	CA_CacheGrChunk(BJCOLLAPSE1PIC);
// 	CA_CacheGrChunk(BJCOLLAPSE2PIC);
// 	CA_CacheGrChunk(BJCOLLAPSE3PIC);
// 	CA_CacheGrChunk(BJCOLLAPSE4PIC);
// 
// 	VWB_Bar(0,0,320,200,VIEWCOLOR);
// 	VWB_DrawPic (124,44,BJCOLLAPSE1PIC);
// 	VW_UpdateScreen ();
// 	VW_FadeIn ();
// 	VW_WaitVBL(2*70);
// 	VWB_DrawPic (124,44,BJCOLLAPSE2PIC);
// 	VW_UpdateScreen ();
// 	VW_WaitVBL(105);
// 	VWB_DrawPic (124,44,BJCOLLAPSE3PIC);
// 	VW_UpdateScreen ();
// 	VW_WaitVBL(105);
// 	VWB_DrawPic (124,44,BJCOLLAPSE4PIC);
// 	VW_UpdateScreen ();
// 	VW_WaitVBL(3*70);
// 
// 	UNCACHEGRCHUNK(BJCOLLAPSE1PIC);
// 	UNCACHEGRCHUNK(BJCOLLAPSE2PIC);
// 	UNCACHEGRCHUNK(BJCOLLAPSE3PIC);
// 	UNCACHEGRCHUNK(BJCOLLAPSE4PIC);
// 	VL_FadeOut (0,255,0,17,17,5);
// #endif
// 
// 	StartCPMusic (URAHERO_MUS);
// 	ClearSplitVWB ();
// 	CacheLump(LEVELEND_LUMP_START,LEVELEND_LUMP_END);
// 	CA_CacheGrChunk(STARTFONT);
// 
// #ifndef SPEAR
// 	CA_CacheGrChunk(C_TIMECODEPIC);
// #endif
// 
// 
// 	VWB_Bar (0,0,320,200-STATUSLINES,127);
// #ifdef JAPAN
// #ifndef JAPDEMO
// 	CA_CacheGrChunk(C_ENDRATIOSPIC);
// 	VWB_DrawPic(0,0,C_ENDRATIOSPIC);
// 	UNCACHEGRCHUNK(C_ENDRATIOSPIC);
// #endif
// #else
// 	Write(18,2,STR_YOUWIN);
// 
// 	Write(TIMEX,TIMEY-2,STR_TOTALTIME);
// 
// 	Write(12,RATIOY-2,"averages");
// 
// 	#ifdef SPANISH
// 	Write(RATIOX+2,  RATIOY,      STR_RATKILL);
// 	Write(RATIOX+2,  RATIOY+2,  STR_RATSECRET);
// 	Write(RATIOX+2,  RATIOY+4,STR_RATTREASURE);
// 	#else
// 	Write(RATIOX+8,RATIOY,      STR_RATKILL);
// 	Write(RATIOX+4,RATIOY+2,  STR_RATSECRET);
// 	Write(RATIOX,  RATIOY+4,STR_RATTREASURE);
// 	#endif
// 
// #endif
// 
// #ifndef JAPDEMO
// 	VWB_DrawPic (8,4,L_BJWINSPIC);
// #endif
// 
// 
// #ifndef SPEAR
// 	for (kr = sr = tr = sec = i = 0;i < 8;i++)
// #else
// 	for (kr = sr = tr = sec = i = 0;i < 20;i++)
// #endif
// 	{
// 		sec += LevelRatios[i].time;
// 		kr += LevelRatios[i].kill;
// 		sr += LevelRatios[i].secret;
// 		tr += LevelRatios[i].treasure;
// 	}
// 
// #ifndef SPEAR
// 	kr /= 8;
// 	sr /= 8;
// 	tr /= 8;
// #else
// 	kr /= 14;
// 	sr /= 14;
// 	tr /= 14;
// #endif
// 
// 	min = sec/60;
// 	sec %= 60;
// 
// 	if (min > 99)
// 		min = sec = 99;
// 
// 	i = TIMEX*8+1;
// 	VWB_DrawPic(i,TIMEY*8,L_NUM0PIC+(min/10));
// 	i += 2*8;
// 	VWB_DrawPic(i,TIMEY*8,L_NUM0PIC+(min%10));
// 	i += 2*8;
// 	Write(i/8,TIMEY,":");
// 	i += 1*8;
// 	VWB_DrawPic(i,TIMEY*8,L_NUM0PIC+(sec/10));
// 	i += 2*8;
// 	VWB_DrawPic(i,TIMEY*8,L_NUM0PIC+(sec%10));
// 	VW_UpdateScreen ();
// 
// 	itoa(kr,tempstr,10);
// 	x=RATIOX+24-strlen(tempstr)*2;
// 	Write(x,RATIOY,tempstr);
// 
// 	itoa(sr,tempstr,10);
// 	x=RATIOX+24-strlen(tempstr)*2;
// 	Write(x,RATIOY+2,tempstr);
// 
// 	itoa(tr,tempstr,10);
// 	x=RATIOX+24-strlen(tempstr)*2;
// 	Write(x,RATIOY+4,tempstr);
// 
// 
// #ifndef SPANISH
// #ifndef UPLOAD
// #ifndef SPEAR
// 	//
// 	// TOTAL TIME VERIFICATION CODE
// 	//
// 	if (gamestate.difficulty>=gd_medium)
// 	{
// 		VWB_DrawPic (30*8,TIMEY*8,C_TIMECODEPIC);
// 		fontnumber = 0;
// 		fontcolor = READHCOLOR;
// 		PrintX = 30*8-3;
// 		PrintY = TIMEY*8+8;
// 		PrintX+=4;
// 		tempstr[0] = (((min/10)^(min%10))^0xa)+'A';
// 		tempstr[1] = (((sec/10)^(sec%10))^0xa)+'A';
// 		tempstr[2] = (tempstr[0]^tempstr[1])+'A';
// 		tempstr[3] = 0;
// 		US_Print(tempstr);
// 	}
// #endif
// #endif
// #endif
// 
// 
// 	fontnumber = 1;
// 
// 	VW_UpdateScreen ();
// 	VW_FadeIn ();
// 
// 	IN_Ack();
// 
// 	#ifndef SPEAR
// 	if (Keyboard[sc_P] && MS_CheckParm("goobers"))
// 		PicturePause();
// 	#endif
// 
// 	VW_FadeOut ();
// 
// #ifndef SPEAR
// 	UNCACHEGRCHUNK(C_TIMECODEPIC);
// #endif
// 	UnCacheLump(LEVELEND_LUMP_START,LEVELEND_LUMP_END);
// 
// #ifndef SPEAR
// 	EndText();
// #else
// 	EndSpear();
// #endif
// 
// #endif // SPEARDEMO
// }
// 
// 
// //==========================================================================
// 
// #ifndef JAPAN
// /*
// ==================
// =
// = PG13
// =
// ==================
// */
// 
// void PG13 (void)
// {
// 	VW_FadeOut();
// 	VWB_Bar(0,0,320,200,0x82);			// background
// 
// 	CA_CacheGrChunk (PG13PIC);
// 	VWB_DrawPic (216,110,PG13PIC);
// 	VW_UpdateScreen ();
// 
// 	UNCACHEGRCHUNK (PG13PIC);
// 
// 	VW_FadeIn();
// 	IN_UserInput(TickBase*7);
// 
// 	VW_FadeOut ();
// }
// #endif
// 
// 
// //==========================================================================
// 
// void Write(int x,int y,char *string)
// {
//  int alpha[]={L_NUM0PIC,L_NUM1PIC,L_NUM2PIC,L_NUM3PIC,L_NUM4PIC,L_NUM5PIC,
// 	L_NUM6PIC,L_NUM7PIC,L_NUM8PIC,L_NUM9PIC,L_COLONPIC,0,0,0,0,0,0,L_APIC,L_BPIC,
// 	L_CPIC,L_DPIC,L_EPIC,L_FPIC,L_GPIC,L_HPIC,L_IPIC,L_JPIC,L_KPIC,
// 	L_LPIC,L_MPIC,L_NPIC,L_OPIC,L_PPIC,L_QPIC,L_RPIC,L_SPIC,L_TPIC,
// 	L_UPIC,L_VPIC,L_WPIC,L_XPIC,L_YPIC,L_ZPIC};
// 
//  int i,ox,nx,ny;
//  char ch;
// 
// 
//  ox=nx=x*8;
//  ny=y*8;
//  for (i=0;i<strlen(string);i++)
//    if (string[i]=='\n')
//    {
// 	nx=ox;
// 	ny+=16;
//    }
//    else
//    {
// 	ch=string[i];
// 	if (ch>='a')
// 	  ch-=('a'-'A');
// 	ch-='0';
// 
// 	switch(string[i])
// 	{
// 	 case '!':
// 	   VWB_DrawPic(nx,ny,L_EXPOINTPIC);
// 	   nx+=8;
// 	   continue;
// 
// 	 case '\'':
// 	   VWB_DrawPic(nx,ny,L_APOSTROPHEPIC);
// 	   nx+=8;
// 	   continue;
// 
// 	 case ' ': break;
// 	 case 0x3a:	// ':'
// 
// 	   VWB_DrawPic(nx,ny,L_COLONPIC);
// 	   nx+=8;
// 	   continue;
// 
// 	 case '%':
// 	   VWB_DrawPic(nx,ny,L_PERCENTPIC);
// 	   break;
// 
// 	 default:
// 	   VWB_DrawPic(nx,ny,alpha[ch]);
// 	}
// 	nx+=16;
//    }
// }
// 
// 
// //
// // Breathe Mr. BJ!!!
// //
// void BJ_Breathe(void)
// {
// 	static int which=0,max=10;
// 	int pics[2]={L_GUYPIC,L_GUY2PIC};
// 
// 
// 	if (TimeCount>max)
// 	{
// 		which^=1;
// 		VWB_DrawPic(0,16,pics[which]);
// 		VW_UpdateScreen();
// 		TimeCount=0;
// 		max=35;
// 	}
// }
// 
// 
// 
// /*
// ==================
// =
// = LevelCompleted
// =
// = Entered with the screen faded out
// = Still in split screen mode with the status bar
// =
// = Exit with the screen faded out
// =
// ==================
// */
// 
// #ifndef SPEAR
// LRstruct LevelRatios[8];
// #else
// LRstruct LevelRatios[20];
// #endif
// 
// void LevelCompleted (void)
// {
// 	#define VBLWAIT	30
// 	#define PAR_AMOUNT	500
// 	#define PERCENT100AMT	10000
// 	typedef struct {
// 			float time;
// 			char timestr[6];
// 			} times;
// 
// 	int	x,i,min,sec,ratio,kr,sr,tr;
// 	unsigned	temp;
// 	char tempstr[10];
// 	long bonus,timeleft=0;
// 	times parTimes[]=
// 	{
// #ifndef SPEAR
// 	 //
// 	 // Episode One Par Times
// 	 //
// 	 {1.5,	"01:30"},
// 	 {2,	"02:00"},
// 	 {2,	"02:00"},
// 	 {3.5,	"03:30"},
// 	 {3,	"03:00"},
// 	 {3,	"03:00"},
// 	 {2.5,	"02:30"},
// 	 {2.5,	"02:30"},
// 	 {0,	"??:??"},	// Boss level
// 	 {0,	"??:??"},	// Secret level
// 
// 	 //
// 	 // Episode Two Par Times
// 	 //
// 	 {1.5,	"01:30"},
// 	 {3.5,	"03:30"},
// 	 {3,	"03:00"},
// 	 {2,	"02:00"},
// 	 {4,	"04:00"},
// 	 {6,	"06:00"},
// 	 {1,	"01:00"},
// 	 {3,	"03:00"},
// 	 {0,	"??:??"},
// 	 {0,	"??:??"},
// 
// 	 //
// 	 // Episode Three Par Times
// 	 //
// 	 {1.5,	"01:30"},
// 	 {1.5,	"01:30"},
// 	 {2.5,	"02:30"},
// 	 {2.5,	"02:30"},
// 	 {3.5,	"03:30"},
// 	 {2.5,	"02:30"},
// 	 {2,	"02:00"},
// 	 {6,	"06:00"},
// 	 {0,	"??:??"},
// 	 {0,	"??:??"},
// 
// 	 //
// 	 // Episode Four Par Times
// 	 //
// 	 {2,	"02:00"},
// 	 {2,	"02:00"},
// 	 {1.5,	"01:30"},
// 	 {1,	"01:00"},
// 	 {4.5,	"04:30"},
// 	 {3.5,	"03:30"},
// 	 {2,	"02:00"},
// 	 {4.5,	"04:30"},
// 	 {0,	"??:??"},
// 	 {0,	"??:??"},
// 
// 	 //
// 	 // Episode Five Par Times
// 	 //
// 	 {2.5,	"02:30"},
// 	 {1.5,	"01:30"},
// 	 {2.5,	"02:30"},
// 	 {2.5,	"02:30"},
// 	 {4,	"04:00"},
// 	 {3,	"03:00"},
// 	 {4.5,	"04:30"},
// 	 {3.5,	"03:30"},
// 	 {0,	"??:??"},
// 	 {0,	"??:??"},
// 
// 	 //
// 	 // Episode Six Par Times
// 	 //
// 	 {6.5,	"06:30"},
// 	 {4,	"04:00"},
// 	 {4.5,	"04:30"},
// 	 {6,	"06:00"},
// 	 {5,	"05:00"},
// 	 {5.5,	"05:30"},
// 	 {5.5,	"05:30"},
// 	 {8.5,	"08:30"},
// 	 {0,	"??:??"},
// 	 {0,	"??:??"}
// #else
// 	 //
// 	 // SPEAR OF DESTINY TIMES
// 	 //
// 	 {1.5,	"01:30"},
// 	 {3.5,	"03:30"},
// 	 {2.75,	"02:45"},
// 	 {3.5,	"03:30"},
// 	 {0,	"??:??"},	// Boss 1
// 	 {4.5,	"04:30"},
// 	 {3.25,	"03:15"},
// 	 {2.75,	"02:45"},
// 	 {4.75,	"04:45"},
// 	 {0,	"??:??"},	// Boss 2
// 	 {6.5,	"06:30"},
// 	 {4.5,	"04:30"},
// 	 {2.75,	"02:45"},
// 	 {4.5,	"04:30"},
// 	 {6,	"06:00"},
// 	 {0,	"??:??"},	// Boss 3
// 	 {6,	"06:00"},
// 	 {0,	"??:??"},	// Boss 4
// 	 {0,	"??:??"},	// Secret level 1
// 	 {0,	"??:??"},	// Secret level 2
// #endif
// 	};
// 
// 
// 
// 	CacheLump(LEVELEND_LUMP_START,LEVELEND_LUMP_END);
// 	ClearSplitVWB ();			// set up for double buffering in split screen
// 	VWB_Bar (0,0,320,200-STATUSLINES,127);
// 	StartCPMusic(ENDLEVEL_MUS);
// 
// //
// // do the intermission
// //
// 	IN_ClearKeysDown();
// 	IN_StartAck();
// 
// #ifdef JAPAN
// 	CA_CacheGrChunk(C_INTERMISSIONPIC);
// 	VWB_DrawPic(0,0,C_INTERMISSIONPIC);
// 	UNCACHEGRCHUNK(C_INTERMISSIONPIC);
// #endif
// 	VWB_DrawPic(0,16,L_GUYPIC);
// 
// #ifndef SPEAR
// 	if (mapon<8)
// #else
// 	if (mapon != 4 &&
// 		mapon != 9 &&
// 		mapon != 15 &&
// 		mapon < 17)
// #endif
// 	{
// #ifndef JAPAN
// 	 #ifdef SPANISH
// 	 Write(14,2,"piso\ncompletado");
// 	 #else
// 	 Write(14,2,"floor\ncompleted");
// 	 #endif
// 
// 	 Write(14,7,STR_BONUS"     0");
// 	 Write(16,10,STR_TIME);
// 	 Write(16,12,STR_PAR);
// 
// 	 #ifdef SPANISH
// 	 Write(11,14,    STR_RAT2KILL);
// 	 Write(11,16,  STR_RAT2SECRET);
// 	 Write(11,18,STR_RAT2TREASURE);
// 	 #else
// 	 Write(9,14,    STR_RAT2KILL);
// 	 Write(5,16,  STR_RAT2SECRET);
// 	 Write(1,18,STR_RAT2TREASURE);
// 	 #endif
// 
// 	 Write(26,2,itoa(gamestate.mapon+1,tempstr,10));
// #endif
// 
// 	 #ifdef SPANISH
// 	 Write(30,12,parTimes[gamestate.episode*10+mapon].timestr);
// 	 #else
// 	 Write(26,12,parTimes[gamestate.episode*10+mapon].timestr);
// 	 #endif
// 
// 	 //
// 	 // PRINT TIME
// 	 //
// 	 sec=gamestate.TimeCount/70;
// 
// 	 if (sec > 99*60)		// 99 minutes max
// 	   sec = 99*60;
// 
// 	 if (gamestate.TimeCount<parTimes[gamestate.episode*10+mapon].time*4200)
// 		timeleft=(parTimes[gamestate.episode*10+mapon].time*4200)/70-sec;
// 
// 	 min=sec/60;
// 	 sec%=60;
// 
// 	 #ifdef SPANISH
// 	 i=30*8;
// 	 #else
// 	 i=26*8;
// 	 #endif
// 	 VWB_DrawPic(i,10*8,L_NUM0PIC+(min/10));
// 	 i+=2*8;
// 	 VWB_DrawPic(i,10*8,L_NUM0PIC+(min%10));
// 	 i+=2*8;
// 	 Write(i/8,10,":");
// 	 i+=1*8;
// 	 VWB_DrawPic(i,10*8,L_NUM0PIC+(sec/10));
// 	 i+=2*8;
// 	 VWB_DrawPic(i,10*8,L_NUM0PIC+(sec%10));
// 
// 	 VW_UpdateScreen ();
// 	 VW_FadeIn ();
// 
// 
// 	 //
// 	 // FIGURE RATIOS OUT BEFOREHAND
// 	 //
// 	 kr = sr = tr = 0;
// 	 if (gamestate.killtotal)
// 		kr=(gamestate.killcount*100)/gamestate.killtotal;
// 	 if (gamestate.secrettotal)
// 		sr=(gamestate.secretcount*100)/gamestate.secrettotal;
// 	 if (gamestate.treasuretotal)
// 		tr=(gamestate.treasurecount*100)/gamestate.treasuretotal;
// 
// 
// 	 //
// 	 // PRINT TIME BONUS
// 	 //
// 	 bonus=timeleft*PAR_AMOUNT;
// 	 if (bonus)
// 	 {
// 	  for (i=0;i<=timeleft;i++)
// 	  {
// 	   ltoa((long)i*PAR_AMOUNT,tempstr,10);
// 	   x=36-strlen(tempstr)*2;
// 	   Write(x,7,tempstr);
// 	   if (!(i%(PAR_AMOUNT/10)))
// 		 SD_PlaySound(ENDBONUS1SND);
// 	   VW_UpdateScreen();
// 	   while(SD_SoundPlaying())
// 		 BJ_Breathe();
// 	   if (IN_CheckAck())
// 		 goto done;
// 	  }
// 
// 	  VW_UpdateScreen();
// 	  SD_PlaySound(ENDBONUS2SND);
// 	  while(SD_SoundPlaying())
// 		BJ_Breathe();
// 	 }
// 
// 
// 	 #ifdef SPANISH
// 	 #define RATIOXX		33
// 	 #else
// 	 #define RATIOXX		37
// 	 #endif
// 	 //
// 	 // KILL RATIO
// 	 //
// 	 ratio=kr;
// 	 for (i=0;i<=ratio;i++)
// 	 {
// 	  itoa(i,tempstr,10);
// 	  x=RATIOXX-strlen(tempstr)*2;
// 	  Write(x,14,tempstr);
// 	  if (!(i%10))
// 		SD_PlaySound(ENDBONUS1SND);
// 	  VW_UpdateScreen ();
// 	  while(SD_SoundPlaying())
// 		BJ_Breathe();
// 
// 	  if (IN_CheckAck())
// 		goto done;
// 	 }
// 	 if (ratio==100)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   bonus+=PERCENT100AMT;
// 	   ltoa(bonus,tempstr,10);
// 	   x=(RATIOXX-1)-strlen(tempstr)*2;
// 	   Write(x,7,tempstr);
// 	   VW_UpdateScreen();
// 	   SD_PlaySound(PERCENT100SND);
// 	 }
// 	 else
// 	 if (!ratio)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   SD_PlaySound(NOBONUSSND);
// 	 }
// 	 else
// 	 SD_PlaySound(ENDBONUS2SND);
// 
// 	 VW_UpdateScreen();
// 	 while(SD_SoundPlaying())
// 	   BJ_Breathe();
// 
// 
// 	 //
// 	 // SECRET RATIO
// 	 //
// 	 ratio=sr;
// 	 for (i=0;i<=ratio;i++)
// 	 {
// 	  itoa(i,tempstr,10);
// 	  x=RATIOXX-strlen(tempstr)*2;
// 	  Write(x,16,tempstr);
// 	  if (!(i%10))
// 		SD_PlaySound(ENDBONUS1SND);
// 	  VW_UpdateScreen ();
// 	  while(SD_SoundPlaying())
// 		BJ_Breathe();
// 	  BJ_Breathe();
// 
// 	  if (IN_CheckAck())
// 		goto done;
// 	 }
// 	 if (ratio==100)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   bonus+=PERCENT100AMT;
// 	   ltoa(bonus,tempstr,10);
// 	   x=(RATIOXX-1)-strlen(tempstr)*2;
// 	   Write(x,7,tempstr);
// 	   VW_UpdateScreen();
// 	   SD_PlaySound(PERCENT100SND);
// 	 }
// 	 else
// 	 if (!ratio)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   SD_PlaySound(NOBONUSSND);
// 	 }
// 	 else
// 	   SD_PlaySound(ENDBONUS2SND);
// 	 VW_UpdateScreen();
// 	 while(SD_SoundPlaying())
// 	   BJ_Breathe();
// 
// 
// 	 //
// 	 // TREASURE RATIO
// 	 //
// 	 ratio=tr;
// 	 for (i=0;i<=ratio;i++)
// 	 {
// 	  itoa(i,tempstr,10);
// 	  x=RATIOXX-strlen(tempstr)*2;
// 	  Write(x,18,tempstr);
// 	  if (!(i%10))
// 		SD_PlaySound(ENDBONUS1SND);
// 	  VW_UpdateScreen ();
// 	  while(SD_SoundPlaying())
// 		BJ_Breathe();
// 	  if (IN_CheckAck())
// 		goto done;
// 	 }
// 	 if (ratio==100)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   bonus+=PERCENT100AMT;
// 	   ltoa(bonus,tempstr,10);
// 	   x=(RATIOXX-1)-strlen(tempstr)*2;
// 	   Write(x,7,tempstr);
// 	   VW_UpdateScreen();
// 	   SD_PlaySound(PERCENT100SND);
// 	 }
// 	 else
// 	 if (!ratio)
// 	 {
// 	   VW_WaitVBL(VBLWAIT);
// 	   SD_StopSound();
// 	   SD_PlaySound(NOBONUSSND);
// 	 }
// 	 else
// 	 SD_PlaySound(ENDBONUS2SND);
// 	 VW_UpdateScreen();
// 	 while(SD_SoundPlaying())
// 	   BJ_Breathe();
// 
// 
// 	 //
// 	 // JUMP STRAIGHT HERE IF KEY PRESSED
// 	 //
// 	 done:
// 
// 	 itoa(kr,tempstr,10);
// 	 x=RATIOXX-strlen(tempstr)*2;
// 	 Write(x,14,tempstr);
// 
// 	 itoa(sr,tempstr,10);
// 	 x=RATIOXX-strlen(tempstr)*2;
// 	 Write(x,16,tempstr);
// 
// 	 itoa(tr,tempstr,10);
// 	 x=RATIOXX-strlen(tempstr)*2;
// 	 Write(x,18,tempstr);
// 
// 	 bonus=(long)timeleft*PAR_AMOUNT+
// 		   (PERCENT100AMT*(kr==100))+
// 		   (PERCENT100AMT*(sr==100))+
// 		   (PERCENT100AMT*(tr==100));
// 
// 	 GivePoints(bonus);
// 	 ltoa(bonus,tempstr,10);
// 	 x=36-strlen(tempstr)*2;
// 	 Write(x,7,tempstr);
// 
// 	 //
// 	 // SAVE RATIO INFORMATION FOR ENDGAME
// 	 //
// 	 LevelRatios[mapon].kill=kr;
// 	 LevelRatios[mapon].secret=sr;
// 	 LevelRatios[mapon].treasure=tr;
// 	 LevelRatios[mapon].time=min*60+sec;
// 	}
// 	else
// 	{
// #ifdef SPEAR
// #ifndef SPEARDEMO
// 	  switch(mapon)
// 	  {
// 	   case 4: Write(14,4," trans\n"
// 						  " grosse\n"
// 						  STR_DEFEATED); break;
// 	   case 9: Write(14,4,"barnacle\n"
// 						  "wilhelm\n"
// 						  STR_DEFEATED); break;
// 	   case 15: Write(14,4,"ubermutant\n"
// 						   STR_DEFEATED); break;
// 	   case 17: Write(14,4," death\n"
// 						   " knight\n"
// 						   STR_DEFEATED); break;
// 	   case 18: Write(13,4,"secret tunnel\n"
// 						   "    area\n"
// 						   "  completed!"); break;
// 	   case 19: Write(13,4,"secret castle\n"
// 						   "    area\n"
// 						   "  completed!"); break;
// 	  }
// #endif
// #else
// 	  Write(14,4,"secret floor\n completed!");
// #endif
// 
// 	  Write(10,16,"15000 bonus!");
// 
// 	  VW_UpdateScreen();
// 	  VW_FadeIn();
// 
// 	  GivePoints(15000);
// 	}
// 
// 
// 	DrawScore();
// 	VW_UpdateScreen();
// 
// 	TimeCount=0;
// 	IN_StartAck();
// 	while(!IN_CheckAck())
// 	  BJ_Breathe();
// 
// //
// // done
// //
// #ifdef SPEARDEMO
// 	if (gamestate.mapon == 1)
// 	{
// 		SD_PlaySound (BONUS1UPSND);
// 
// 		CA_CacheGrChunk (STARTFONT+1);
// 		Message ("This concludes your demo\n"
// 				 "of Spear of Destiny! Now,\n"
// 				 "go to your local software\n"
// 				 "store and buy it!");
// 		UNCACHEGRCHUNK (STARTFONT+1);
// 
// 		IN_ClearKeysDown();
// 		IN_Ack();
// 	}
// #endif
// 
// #ifdef JAPDEMO
// 	if (gamestate.mapon == 3)
// 	{
// 		SD_PlaySound (BONUS1UPSND);
// 
// 		CA_CacheGrChunk (STARTFONT+1);
// 		Message ("This concludes your demo\n"
// 				 "of Wolfenstein 3-D! Now,\n"
// 				 "go to your local software\n"
// 				 "store and buy it!");
// 		UNCACHEGRCHUNK (STARTFONT+1);
// 
// 		IN_ClearKeysDown();
// 		IN_Ack();
// 	}
// #endif
// 
// 	#ifndef SPEAR
// 	if (Keyboard[sc_P] && MS_CheckParm("goobers"))
// 		PicturePause();
// 	#endif
// 
// 	VW_FadeOut ();
// 	temp = bufferofs;
// 	for (i=0;i<3;i++)
// 	{
// 		bufferofs = screenloc[i];
// 		DrawPlayBorder ();
// 	}
// 	bufferofs = temp;
// 
// 	UnCacheLump(LEVELEND_LUMP_START,LEVELEND_LUMP_END);
// }
// 
// 
// 
// //==========================================================================
// 
// 
// /*
// =================
// =
// = PreloadGraphics
// =
// = Fill the cache up
// =
// =================
// */
// 
// boolean PreloadUpdate(unsigned current, unsigned total)
// {
// 	unsigned w = WindowW - 10;
// 
// 
// 	VWB_Bar(WindowX + 5,WindowY + WindowH - 3,w,2,BLACK);
// 	w = ((long)w * current) / total;
// 	if (w)
// 	{
// 	 VWB_Bar(WindowX + 5,WindowY + WindowH - 3,w,2,0x37); //SECONDCOLOR);
// 	 VWB_Bar(WindowX + 5,WindowY + WindowH - 3,w-1,1,0x32);
// 
// 	}
// 	VW_UpdateScreen();
// //	if (LastScan == sc_Escape)
// //	{
// //		IN_ClearKeysDown();
// //		return(true);
// //	}
// //	else
// 		return(false);
// }
// 
// void PreloadGraphics(void)
// {
// 	DrawLevel ();
// 	ClearSplitVWB ();			// set up for double buffering in split screen
// 
// 	VWB_Bar (0,0,320,200-STATUSLINES,127);
// 
// 	LatchDrawPic (20-14,80-3*8,GETPSYCHEDPIC);
// 
// 	WindowX = 160-14*8;
// 	WindowY = 80-3*8;
// 	WindowW = 28*8;
// 	WindowH = 48;
// 	VW_UpdateScreen();
// 	VW_FadeIn ();
// 
// 	PM_Preload (PreloadUpdate);
// 	IN_UserInput (70);
// 	VW_FadeOut ();
// 
// 	DrawPlayBorder ();
// 	VW_UpdateScreen ();
// }
// 
// 
// //==========================================================================
// 
// /*
// ==================
// =
// = DrawHighScores
// =
// ==================
// */
// 
// void	DrawHighScores(void)
// {
// 	char		buffer[16],*str,buffer1[5];
// 	byte		temp,temp1,temp2,temp3;
// 	word		i,j,
// 				w,h,
// 				x,y;
// 	HighScore	*s;
// 
// 
// 	MM_SortMem ();
// 
// #ifndef SPEAR
// //	CA_CacheGrChunk (C_CODEPIC);
// 	CA_CacheGrChunk (HIGHSCORESPIC);
// 	CA_CacheGrChunk (STARTFONT);
// 	CA_CacheGrChunk (C_LEVELPIC);
// 	CA_CacheGrChunk (C_SCOREPIC);
// 	CA_CacheGrChunk (C_NAMEPIC);
// 
// 	ClearMScreen();
// 	DrawStripes(10);
// 
// 	VWB_DrawPic(48,0,HIGHSCORESPIC);
// 	UNCACHEGRCHUNK (HIGHSCORESPIC);
// 
// 	VWB_DrawPic(4*8,68,C_NAMEPIC);
// 	VWB_DrawPic(20*8,68,C_LEVELPIC);
// 	VWB_DrawPic(28*8,68,C_SCOREPIC);
// #ifndef UPLOAD
// //	VWB_DrawPic(35*8,68,C_CODEPIC);
// #endif
// 	fontnumber=0;
// 
// #else
// 	CacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 	ClearMScreen();
// 	DrawStripes(10);
// 	UnCacheLump (BACKDROP_LUMP_START,BACKDROP_LUMP_END);
// 
// 	CacheLump (HIGHSCORES_LUMP_START,HIGHSCORES_LUMP_END);
// 	CA_CacheGrChunk (STARTFONT+1);
// 	VWB_DrawPic (0,0,HIGHSCORESPIC);
// 
// 	fontnumber = 1;
// #endif
// 
// 
// #ifndef SPEAR
// 	SETFONTCOLOR(15,0x29);
// #else
// 	SETFONTCOLOR(HIGHLIGHT,0x29);
// #endif
// 
// 	for (i = 0,s = Scores;i < MaxScores;i++,s++)
// 	{
// 		PrintY = 76 + (16 * i);
// 
// 		//
// 		// name
// 		//
// #ifndef SPEAR
// 		PrintX = 4*8;
// #else
// 		PrintX = 16;
// #endif
// 		US_Print(s->name);
// 
// 		//
// 		// level
// 		//
// 		ultoa(s->completed,buffer,10);
// #ifndef SPEAR
// 		for (str = buffer;*str;str++)
// 			*str = *str + (129 - '0');	// Used fixed-width numbers (129...)
// 		USL_MeasureString(buffer,&w,&h);
// 		PrintX = (22 * 8)-w;
// #else
// 		USL_MeasureString(buffer,&w,&h);
// 		PrintX = 194 - w;
// #endif
// 
// #ifndef UPLOAD
// #ifndef SPEAR
// 		PrintX -= 6;
// 		itoa(s->episode+1,buffer1,10);
// 		US_Print("E");
// 		US_Print(buffer1);
// 		US_Print("/L");
// #endif
// #endif
// 
// #ifdef SPEAR
// 		if (s->completed == 21)
// 			VWB_DrawPic (PrintX+8,PrintY-1,C_WONSPEARPIC);
// 		else
// #endif
// 		US_Print(buffer);
// 
// 		//
// 		// score
// 		//
// 		ultoa(s->score,buffer,10);
// #ifndef SPEAR
// 		for (str = buffer;*str;str++)
// 			*str = *str + (129 - '0');	// Used fixed-width numbers (129...)
// 		USL_MeasureString(buffer,&w,&h);
// 		PrintX = (34 * 8) - 8 - w;
// #else
// 		USL_MeasureString(buffer,&w,&h);
// 		PrintX = 292 - w;
// #endif
// 		US_Print(buffer);
// 
// 		#if 0
// #ifndef UPLOAD
// #ifndef SPEAR
// 		//
// 		// verification #
// 		//
// 		if (!i)
// 		{
// 		 temp=(((s->score >> 28)& 0xf)^
// 			  ((s->score >> 24)& 0xf))+'A';
// 		 temp1=(((s->score >> 20)& 0xf)^
// 			   ((s->score >> 16)& 0xf))+'A';
// 		 temp2=(((s->score >> 12)& 0xf)^
// 			   ((s->score >> 8)& 0xf))+'A';
// 		 temp3=(((s->score >> 4)& 0xf)^
// 			   ((s->score >> 0)& 0xf))+'A';
// 
// 		 SETFONTCOLOR(0x49,0x29);
// 		 PrintX = 35*8;
// 		 buffer[0]=temp;
// 		 buffer[1]=temp1;
// 		 buffer[2]=temp2;
// 		 buffer[3]=temp3;
// 		 buffer[4]=0;
// 		 US_Print(buffer);
// 		 SETFONTCOLOR(15,0x29);
// 		}
// #endif
// #endif
// 		#endif
// 	}
// 
// 	VW_UpdateScreen ();
// 
// #ifdef SPEAR
// 	UnCacheLump (HIGHSCORES_LUMP_START,HIGHSCORES_LUMP_END);
// 	fontnumber = 0;
// #endif
// }
// 
// //===========================================================================
// 
// 
// /*
// =======================
// =
// = CheckHighScore
// =
// =======================
// */
// 
// void	CheckHighScore (long score,word other)
// {
// 	word		i,j;
// 	int			n;
// 	HighScore	myscore;
// 
// 	strcpy(myscore.name,"");
// 	myscore.score = score;
// 	myscore.episode = gamestate.episode;
// 	myscore.completed = other;
// 
// 	for (i = 0,n = -1;i < MaxScores;i++)
// 	{
// 		if
// 		(
// 			(myscore.score > Scores[i].score)
// 		||	(
// 				(myscore.score == Scores[i].score)
// 			&& 	(myscore.completed > Scores[i].completed)
// 			)
// 		)
// 		{
// 			for (j = MaxScores;--j > i;)
// 				Scores[j] = Scores[j - 1];
// 			Scores[i] = myscore;
// 			n = i;
// 			break;
// 		}
// 	}
// 
// #ifdef SPEAR
// 	StartCPMusic (XAWARD_MUS);
// #else
// 	StartCPMusic (ROSTER_MUS);
// #endif
// 	DrawHighScores ();
// 
// 	VW_FadeIn ();
// 
// 	if (n != -1)
// 	{
// 	//
// 	// got a high score
// 	//
// 		PrintY = 76 + (16 * n);
// #ifndef SPEAR
// 		PrintX = 4*8;
// 		backcolor = BORDCOLOR;
// 		fontcolor = 15;
// 		US_LineInput(PrintX,PrintY,Scores[n].name,nil,true,MaxHighName,100);
// #else
// 		PrintX = 16;
// 		fontnumber = 1;
// 		VWB_Bar (PrintX-2,PrintY-2,145,15,0x9c);
// 		VW_UpdateScreen ();
// 		backcolor = 0x9c;
// 		fontcolor = 15;
// 		US_LineInput(PrintX,PrintY,Scores[n].name,nil,true,MaxHighName,130);
// #endif
// 	}
// 	else
// 	{
// 		IN_ClearKeysDown ();
// 		IN_UserInput(500);
// 	}
// 
// }
// 
// 
// #ifndef UPLOAD
// #ifndef SPEAR
// #ifndef JAPAN
// ////////////////////////////////////////////////////////
// //
// // NON-SHAREWARE NOTICE
// //
// ////////////////////////////////////////////////////////
// void NonShareware(void)
// {
// 	VW_FadeOut();
// 
// 	ClearMScreen();
// 	DrawStripes(10);
// 
// 	CA_CacheGrChunk(STARTFONT+1);
// 	fontnumber = 1;
// 
// 	SETFONTCOLOR(READHCOLOR,BKGDCOLOR);
// 	PrintX=110;
// 	PrintY=15;
// 
// 	#ifdef SPANISH
// 	US_Print("Atencion");
// 	#else
// 	US_Print("Attention");
// 	#endif
// 
// 	SETFONTCOLOR(HIGHLIGHT,BKGDCOLOR);
// 	WindowX=PrintX=40;
// 	PrintY=60;
// 	#ifdef SPANISH
// 	US_Print("Este juego NO es gratis y\n");
// 	US_Print("NO es Shareware; favor de\n");
// 	US_Print("no distribuirlo.\n\n");
// 	#else
// 	US_Print("This game is NOT shareware.\n");
// 	US_Print("Please do not distribute it.\n");
// 	US_Print("Thanks.\n\n");
// 	#endif
// 	US_Print("        Id Software\n");
// 
// 	VW_UpdateScreen ();
// 	VW_FadeIn();
// 	IN_Ack();
// }
// #endif
// #endif
// #endif
// 
// #ifdef SPEAR
// #ifndef SPEARDEMO
// ////////////////////////////////////////////////////////
// //
// // COPY PROTECTION FOR FormGen
// //
// ////////////////////////////////////////////////////////
// char 	far CopyProFailedStrs[][100] = {
// 			STR_COPY1,
// 			STR_COPY2,
// 
// 			STR_COPY3,
// 			STR_COPY4,
// 
// 			STR_COPY5,
// 			STR_COPY6,
// 
// 			STR_COPY7,
// 			STR_COPY8,
// 
// 			STR_COPY9,
// 			"",
// 
// 			STR_COPY10,
// 			STR_COPY11,
// 
// 			STR_COPY12,
// 			"",
// 
// 			STR_COPY13,
// 			"",
// 
// 			STR_COPY14,
// 			""
// 			},
// 
// 		far BackDoorStrs[5][16] = {
// 			"a spoon?",
// 			"bite me!",
// 			"joshua",
// 			"pelt",
// #ifdef BETA
// 			"beta"
// #else
// 			"snoops"
// #endif
// 			},
// 
// 		far GoodBoyStrs[10][40] = {
// 			"...is the CORRECT ANSWER!",
// 			"",
// 
// 			"Consider yourself bitten, sir.",
// 			"",
// 
// 			"Greetings Professor Falken, would you",
// 			"like to play Spear of Destiny?",
// 
// 			"Do you have any gold spray paint?",
// 			"",
// 
// #ifdef BETA
// 			"Beta testing approved.",
// #else
// 			"I wish I had a 21\" monitor...",
// #endif
// 			""
// 			},
// 
// 		far bossstrs[4][24] = {
// 			"DEATH KNIGHT",
// 			"BARNACLE WILHELM",
// 			"UBERMUTANTUBER MUTANT",
// 			"TRANS GROSSE"
// 			},
// 
// 		far WordStr[5][20] = {
// 			"New Game",
// 			"Sound...F4",
// 			"Control...F6",
// 			"Change View...F5",
// 			"Quit...F10"},
// 
// 		far	WordCorrect[5][2] = {"3","4","4","5","5"},
// 
// 		far MemberStr[10][40] = {
// 			STR_COPY15,
// 			"",
// 
// 			STR_COPY16,
// 			"",
// 
// 			STR_COPY17,
// 			STR_COPY18,
// 
// 			STR_COPY19,
// 			STR_COPY20,
// 
// 			STR_COPY21,
// 			STR_COPY22},
// 
// 		far MemberCorrect[5][24] = {
// 			"adrian carmack",
// 			"john carmackjohn romero",
// 			"tom hall",
// 			"jay wilbur",
// 			"kevin cloud"},
// 
// 		far DosMessages[9][80] = {
// 			STR_NOPE1,
// 			STR_NOPE2,
// 			STR_NOPE3,
// 			STR_NOPE4,
// 			STR_NOPE5,
// 			STR_NOPE6,
// 			STR_NOPE7,
// 			STR_NOPE8,
// 			STR_NOPE9},
// 
// 		far MiscTitle[4][20] = {
// 			"BLOOD TEST",
// 			"STRAIGHT-LACED",
// 			"QUITE SHAPELY",
// 			"I AM WHAT I AMMO"
// 			},
// 
// 		far MiscStr[12][40] = {
// 			STR_MISC1,
// 			STR_MISC2,
// 			"",
// 
// 			STR_MISC3,
// 			STR_MISC4,
// 			"",
// 
// 			STR_MISC5,
// 			STR_MISC6,
// 			"",
// 
// 			STR_MISC7,
// 			STR_MISC8,
// 			STR_MISC9
// 			},
// 
// 		far MiscCorrect[4][5] = {"ss","8",STR_STAR,"45"};
// 
// 
// int  BackDoor(char *s)
// {
// 	int i;
// 
// 
// 	strlwr(s);
// 
// 	for (i=0;i<5;i++)
// 		if (!_fstrcmp(s,BackDoorStrs[i]))
// 		{
// 			SETFONTCOLOR(14,15);
// 			fontnumber = 0;
// 			PrintY = 175;
// 			VWB_DrawPic (0,20*8,COPYPROTBOXPIC);
// 			US_CPrint(GoodBoyStrs[i*2]);
// 			US_CPrint(GoodBoyStrs[i*2+1]);
// 			VW_UpdateScreen();
// 			return 1;
// 		}
// 
// 	return 0;
// }
// 
// 
// void CopyProtection(void)
// {
// #define TYPEBOX_Y		177
// #define TYPEBOX_BKGD	0x9c
// #define PRINTCOLOR		HIGHLIGHT
// 
// 	int	i,match,whichboss,bossnum,try,whichline,enemypicked[4]={0,0,0,0},
// 		bosses[4] = { BOSSPIC1PIC,BOSSPIC2PIC,BOSSPIC3PIC,BOSSPIC4PIC },
// 		whichone,whichpicked[4]={0,0,0,0},quiztype,whichmem,
// 		memberpicked[5]={0,0,0,0,0},wordpicked[5]={0,0,0,0,0},whichword;
// 
// 	char	inputbuffer[20],
// 			message[80];
// 
// 	enum
// 	{
// 		debriefing,
// 		checkmanual,
// 		staffquiz,
// 		miscquiz,
// 
// 		totaltypes
// 	};
// 
// 
// 
// 	try = 0;
// 	VW_FadeOut();
// 	CA_CacheGrChunk(C_BACKDROPPIC);
// 	CacheLump(COPYPROT_LUMP_START,COPYPROT_LUMP_END);
// 	CA_CacheGrChunk(STARTFONT+1);
// 	CA_LoadAllSounds();
// 	StartCPMusic(COPYPRO_MUS);
// 	US_InitRndT(true);
// 
// 	while (try<3)
// 	{
// 		fontnumber = 1;
// 		SETFONTCOLOR(PRINTCOLOR-2,15);
// 		VWB_DrawPic (0,0,C_BACKDROPPIC);
// 		VWB_DrawPic (0,0,COPYPROTTOPPIC);
// 		VWB_DrawPic (0,20*8,COPYPROTBOXPIC);
// 		WindowX = WindowY = 0;
// 		WindowW = 320;
// 		WindowH = 200;
// 		PrintY = 65;
// 
// 		quiztype = US_RndT()%totaltypes;
// 		switch(quiztype)
// 		{
// 			//
// 			// BOSSES QUIZ
// 			//
// 			case debriefing:
// 				PrintX = 0;
// 				US_Print(STR_DEBRIEF);
// 				SETFONTCOLOR(PRINTCOLOR,15);
// 
// 				while (enemypicked[whichboss = US_RndT()&3]);
// 				enemypicked[whichboss] = 1;
// 				bossnum = bosses[whichboss];
// 				VWB_DrawPic(128,60,bossnum);
// 				fontnumber = 0;
// 				PrintY = 130;
// 				US_CPrint(STR_ENEMY1"\n");
// 				US_CPrint(STR_ENEMY2"\n\n");
// 
// 				VW_UpdateScreen();
// 				VW_FadeIn();
// 
// 				PrintX = 100;
// 				fontcolor = 15;
// 				backcolor = TYPEBOX_BKGD;
// 				inputbuffer[0] = 0;
// 				PrintY = TYPEBOX_Y;
// 				fontnumber = 1;
// 				US_LineInput(PrintX,PrintY,inputbuffer,nil,true,20,100);
// 
// 				match = 0;
// 				for (i=0;i<_fstrlen(bossstrs[whichboss]);i++)
// 					if (!_fstrnicmp(inputbuffer,bossstrs[whichboss]+i,strlen(inputbuffer)) &&
// 						strlen(inputbuffer)>3)
// 						match = 1;
// 
// 				match += BackDoor(inputbuffer);
// 				break;
// 
// 			//
// 			// MANUAL CHECK
// 			//
// 			case checkmanual:
// 				while (wordpicked[whichword = US_RndT()%5]);
// 				wordpicked[whichword] = 1;
// 				US_CPrint(STR_CHECKMAN);
// 				SETFONTCOLOR(PRINTCOLOR,15);
// 				PrintY += 25;
// 				US_CPrint(STR_MAN1);
// 				US_CPrint(STR_MAN2);
// 				_fstrcpy(message,STR_MAN3" \"");
// 				_fstrcat(message,WordStr[whichword]);
// 				_fstrcat(message,"\" "STR_MAN4);
// 				US_CPrint(message);
// 				VW_UpdateScreen();
// 				VW_FadeIn();
// 
// 				PrintX = 146;
// 				fontcolor = 15;
// 				backcolor = TYPEBOX_BKGD;
// 				inputbuffer[0] = 0;
// 				PrintY = TYPEBOX_Y;
// 				US_LineInput(PrintX,PrintY,inputbuffer,nil,true,6,100);
// 
// 				strlwr(inputbuffer);
// 				match = 1-(_fstrcmp(inputbuffer,WordCorrect[whichword])!=0);
// 				match += BackDoor(inputbuffer);
// 				break;
// 
// 			//
// 			// STAFF QUIZ
// 			//
// 			case staffquiz:
// 				while (memberpicked[whichmem = US_RndT()%5]);
// 				memberpicked[whichmem] = 1;
// 				US_CPrint(STR_ID1);
// 				SETFONTCOLOR(PRINTCOLOR,15);
// 				PrintY += 25;
// 				US_CPrint(MemberStr[whichmem*2]);
// 				US_CPrint(MemberStr[whichmem*2+1]);
// 				VW_UpdateScreen();
// 				VW_FadeIn();
// 
// 				PrintX = 100;
// 				fontcolor = 15;
// 				backcolor = TYPEBOX_BKGD;
// 				inputbuffer[0] = 0;
// 				PrintY = TYPEBOX_Y;
// 				US_LineInput(PrintX,PrintY,inputbuffer,nil,true,20,120);
// 
// 				strlwr(inputbuffer);
// 				match = 0;
// 				for (i=0;i<_fstrlen(MemberCorrect[whichmem]);i++)
// 					if (!_fstrnicmp(inputbuffer,MemberCorrect[whichmem]+i,strlen(inputbuffer)) &&
// 						strlen(inputbuffer)>2)
// 							match = 1;
// 				match += BackDoor(inputbuffer);
// 				break;
// 
// 			//
// 			// MISCELLANEOUS QUESTIONS
// 			//
// 			case miscquiz:
// 				while (whichpicked[whichone = US_RndT()&3]);
// 				whichpicked[whichone] = 1;
// 				US_CPrint(MiscTitle[whichone]);
// 				SETFONTCOLOR(PRINTCOLOR,15);
// 				PrintY += 25;
// 				US_CPrint(MiscStr[whichone*3]);
// 				US_CPrint(MiscStr[whichone*3+1]);
// 				US_CPrint(MiscStr[whichone*3+2]);
// 				VW_UpdateScreen();
// 				VW_FadeIn();
// 
// 				PrintX = 146;
// 				fontcolor = 15;
// 				backcolor = TYPEBOX_BKGD;
// 				inputbuffer[0] = 0;
// 				PrintY = TYPEBOX_Y;
// 				US_LineInput(PrintX,PrintY,inputbuffer,nil,true,6,100);
// 
// 				strlwr(inputbuffer);
// 				match = 1-(_fstrcmp(inputbuffer,MiscCorrect[whichone])!=0);
// 				match += BackDoor(inputbuffer);
// 				break;
// 			}
// 
// 		//
// 		// IF NO MATCH, WE'VE GOT A (MINOR) PROBLEM!
// 		//
// 
// 		if (!match)
// 		{
// 			whichline = 2*(US_RndT()%9);
// 			SETFONTCOLOR(14,15);
// 			fontnumber = 0;
// 			PrintY = 175;
// 			VWB_DrawPic (0,20*8,COPYPROTBOXPIC);
// 			US_CPrint(CopyProFailedStrs[whichline]);
// 			US_CPrint(CopyProFailedStrs[whichline+1]);
// 
// 			VW_UpdateScreen();
// 			SD_PlaySound(NOWAYSND);
// 			IN_UserInput(TickBase*3);
// 			VW_FadeOut();
// 			try++;
// 		}
// 		else
// 		{
// 			int start;
// 
// 
// 			SD_PlaySound(BONUS1UPSND);
// 			SD_WaitSoundDone();
// 			UNCACHEGRCHUNK (STARTFONT+1);
// 			UNCACHEGRCHUNK (C_BACKDROPPIC);
// 			UnCacheLump (COPYPROT_LUMP_START,COPYPROT_LUMP_END);
// 
// 			switch(SoundMode)
// 			{
// 				case sdm_Off: return;
// 				case sdm_PC: start = STARTPCSOUNDS; break;
// 				case sdm_AdLib: start = STARTADLIBSOUNDS;
// 			}
// 
// 			for (i=0;i<NUMSOUNDS;i++,start++)
// 				MM_FreePtr ((memptr *)&audiosegs[start]);
// 			return;
// 		}
// 	}
// 
// 	ClearMemory();
// 	ShutdownId();
// 
// 	_fstrcpy(message,DosMessages[US_RndT()%9]);
// 
// 	_AX = 3;
// 	geninterrupt(0x10);
// 
// 	printf("%s\n",message);
// 	exit(1);
// }
// 
// #endif // SPEARDEMO
// #endif // SPEAR
// //===========================================================================
// 
