import "./styles.css";
import { findPlayerSpawn, parseWolfMap, type PlayerSpawn, type WolfMap } from "./wl6Map";

type SourceTypescriptStatus = {
  assets: Array<{
    fileName: string;
    present: boolean;
  }>;
  sourceCounts: {
    asm: number;
    c: number;
    h: number;
  };
};

type DemoPlan = {
  name: string;
  autoStart?: boolean;
  steps: DemoPlanStep[];
};

type DemoPlanStep =
  | {
      action: "wait";
      ms: number;
    }
  | {
      action: "key";
      holdMs?: number;
      key: string | number;
    }
  | {
      action: "keydown" | "keyup";
      key: string | number;
    }
  | {
      action: "capture";
      label?: string;
      png?: boolean;
      state?: boolean;
      wav?: boolean;
    };

type PortMap = {
  actors: PortActor[];
  blockingStaticKeys: Set<string>;
  doors: PortDoor[];
  height: number;
  killTotal: number;
  name: string;
  objects: Uint16Array;
  secretTotal: number;
  source: "fallback" | "wl6";
  statics: PortStatic[];
  treasureTotal: number;
  walls: Uint16Array;
  width: number;
};

type PortDoor = {
  action: "closed" | "open" | "opening" | "closing";
  index: number;
  lock: number;
  position: number;
  ticcount: number;
  tile: number;
  vertical: boolean;
  x: number;
  y: number;
};

type PortStatic = {
  blocking: boolean;
  bonus: boolean;
  collected: boolean;
  item: string;
  shapenum: number;
  treasure: boolean;
  type: number;
  x: number;
  y: number;
};

type PortActor = {
  attackMode: boolean;
  distance: number;
  dir: number;
  hitpoints: number;
  kind: string;
  mode: "boss" | "chase" | "dead" | "dying" | "ghost" | "pain" | "patrol" | "stand";
  shootable: boolean;
  speed: number;
  stateIndex: number;
  stateName: string;
  stateShapenum: number | null;
  stateTics: number;
  targetX: number;
  targetY: number;
  tile: number;
  x: number;
  y: number;
};

type ActorStateFrame = {
  final?: boolean;
  name: string;
  shapenum: number;
  tics: number;
};

type RayHit = {
  distance: number;
  door?: PortDoor;
  side: number;
  texture: number;
  tile: number;
  type: "door" | "wall";
};

type SpriteBillboard = {
  bitmap: SpriteBitmap | null;
  color: [number, number, number];
  depth: number;
  height: number;
  sourceWidth: number;
  screenX: number;
  width: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

type ActorSpriteDescriptor = {
  rotate: boolean;
  shapenum: number;
};

type AttackInfo = {
  attack: -1 | 0 | 1 | 2 | 3 | 4;
  frame: number;
  tics: number;
};

type SpriteBitmap = {
  mask: Uint8Array;
  pixels: Uint8Array;
};

type TextureBitmap = {
  pixels: Uint8Array;
};

type DecodedSpritePage = {
  bitmap: SpriteBitmap;
  info: SpritePageInfo;
};

type DecodedTexturePage = {
  bitmap: TextureBitmap;
};

type PageKind = "sound" | "sprite" | "texture";
type PaletteSource = "fallback" | "GAMEPAL.OBJ";

type PageInfo = {
  index: number;
  kind: PageKind;
  length: number;
  offset: number;
};

type SpritePageInfo = {
  columnOffsetCount: number;
  height: number;
  leftpix: number;
  page: number;
  rightpix: number;
  shapenum: number;
  visiblePixels: number;
  width: number;
};

type ScanInfoPlaneResult = {
  actors: PortActor[];
  killTotal: number;
  secretTotal: number;
  spawn: PlayerSpawn | null;
  statics: PortStatic[];
  treasureTotal: number;
};

const KEY_CODES: Record<string, number> = {
  ALT: 18,
  ARROWDOWN: 40,
  ARROWLEFT: 37,
  ARROWRIGHT: 39,
  ARROWUP: 38,
  BACKSPACE: 8,
  CONTROL: 17,
  CTRL: 17,
  ENTER: 13,
  ESC: 27,
  ESCAPE: 27,
  KEYA: 65,
  KEYD: 68,
  KEYN: 78,
  KEYS: 83,
  KEYW: 87,
  KEYY: 89,
  SHIFT: 16,
  SPACE: 32,
  TAB: 9
};

const DEMO_DEFAULT_HOLD_MS = 90;
const AREATILE = 107;
const ICONARROWS = 90;
const NODIR = 8;
const DOOR_POSITION_MAX = 0xffff;
const DOOR_POSITION_RATE_SHIFT = 10;
const EXTRAPOINTS = 40000;
const MAX_AMMO = 99;
const MAX_HEALTH = 100;
const MAX_LIVES = 9;
const OPENTICS = 300;
const PUSHABLETILE = 98;
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const SPDDOG = 1500;
const SPDPATROL = 512;
const STARTAMMO = 8;
const TILEGLOBAL = 65536;
const TILE_DISTANCE = 1;
const ATTACK_KEY_CODE = 17;
const USE_KEY_CODE = 32;
const WP_KNIFE = 0;
const WP_PISTOL = 1;
const WP_MACHINEGUN = 2;
const WP_CHAINGUN = 3;
// WL_DRAW.C weaponscale[] for WL6: SPR_KNIFEREADY, SPR_PISTOLREADY, etc.
const WEAPON_READY_SPRITES = [416, 421, 426, 431] as const;
// WL_AGENT.C attackinfo[4][14], trimmed to the populated frames in the WL6 source.
const ATTACK_INFO: AttackInfo[][] = [
  [
    { attack: 0, frame: 1, tics: 6 },
    { attack: 2, frame: 2, tics: 6 },
    { attack: 0, frame: 3, tics: 6 },
    { attack: -1, frame: 4, tics: 6 }
  ],
  [
    { attack: 0, frame: 1, tics: 6 },
    { attack: 1, frame: 2, tics: 6 },
    { attack: 0, frame: 3, tics: 6 },
    { attack: -1, frame: 4, tics: 6 }
  ],
  [
    { attack: 0, frame: 1, tics: 6 },
    { attack: 1, frame: 2, tics: 6 },
    { attack: 3, frame: 3, tics: 6 },
    { attack: -1, frame: 4, tics: 6 }
  ],
  [
    { attack: 0, frame: 1, tics: 6 },
    { attack: 1, frame: 2, tics: 6 },
    { attack: 4, frame: 3, tics: 6 },
    { attack: -1, frame: 4, tics: 6 }
  ]
];
const STATIC_INFO_TYPES = [
  "dressing",
  "block",
  "block",
  "block",
  "dressing",
  "block",
  "bo_alpo",
  "block",
  "block",
  "dressing",
  "block",
  "block",
  "block",
  "block",
  "dressing",
  "dressing",
  "block",
  "block",
  "block",
  "dressing",
  "bo_key1",
  "bo_key2",
  "block",
  "dressing",
  "bo_food",
  "bo_firstaid",
  "bo_clip",
  "bo_machinegun",
  "bo_chaingun",
  "bo_cross",
  "bo_chalice",
  "bo_bible",
  "bo_crown",
  "bo_fullheal",
  "bo_gibs",
  "block",
  "block",
  "block",
  "bo_gibs",
  "block",
  "block",
  "dressing",
  "dressing",
  "dressing",
  "dressing",
  "block",
  "block",
  "dressing",
  "bo_clip2"
] as const;
const TREASURE_STAT_TYPES = new Set(["bo_cross", "bo_chalice", "bo_bible", "bo_crown", "bo_fullheal"]);
const DROPPED_ITEM_TYPES = {
  bo_clip2: 48,
  bo_key1: 20,
  bo_machinegun: 27
} as const;
const FALLBACK_PALETTE_16: Array<[number, number, number]> = [
  [0, 0, 0],
  [0, 0, 170],
  [0, 170, 0],
  [0, 170, 170],
  [170, 0, 0],
  [170, 0, 170],
  [170, 85, 0],
  [170, 170, 170],
  [85, 85, 85],
  [85, 85, 255],
  [85, 255, 85],
  [85, 255, 255],
  [255, 85, 85],
  [255, 85, 255],
  [255, 255, 85],
  [255, 255, 255]
];
const DIR_ANGLE_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315, 360] as const;
// WL_DEF.H sprite enum values for WL6 with the SPEAR branches disabled.
const ACTOR_SPRITES = {
  BLINKY_W1: 288,
  BOSS_DEAD: 303,
  BOSS_DIE1: 304,
  BOSS_DIE2: 305,
  BOSS_DIE3: 306,
  BOSS_W1: 296,
  BOSS_W2: 297,
  BOSS_W3: 298,
  BOSS_W4: 299,
  CLYDE_W1: 292,
  DOG_DEAD: 134,
  DOG_DIE_1: 131,
  DOG_DIE_2: 132,
  DOG_DIE_3: 133,
  DOG_W1_1: 99,
  DOG_W2_1: 107,
  DOG_W3_1: 115,
  DOG_W4_1: 123,
  FAKE_DEAD: 333,
  FAKE_DIE1: 328,
  FAKE_DIE2: 329,
  FAKE_DIE3: 330,
  FAKE_DIE4: 331,
  FAKE_DIE5: 332,
  FAKE_W1: 321,
  FAKE_W2: 322,
  FAKE_W3: 323,
  FAKE_W4: 324,
  FAT_DEAD: 407,
  FAT_DIE1: 404,
  FAT_DIE2: 405,
  FAT_DIE3: 406,
  FAT_W1: 396,
  FAT_W2: 397,
  FAT_W3: 398,
  FAT_W4: 399,
  GIFT_DEAD: 369,
  GIFT_DIE1: 366,
  GIFT_DIE2: 367,
  GIFT_DIE3: 368,
  GIFT_W1: 360,
  GIFT_W2: 361,
  GIFT_W3: 362,
  GIFT_W4: 363,
  GRD_DEAD: 95,
  GRD_DIE_1: 91,
  GRD_DIE_2: 92,
  GRD_DIE_3: 93,
  GRD_PAIN_1: 90,
  GRD_PAIN_2: 94,
  GRD_S_1: 50,
  GRD_W1_1: 58,
  GRD_W2_1: 66,
  GRD_W3_1: 74,
  GRD_W4_1: 82,
  GRETEL_DEAD: 392,
  GRETEL_DIE1: 393,
  GRETEL_DIE2: 394,
  GRETEL_DIE3: 395,
  GRETEL_W1: 385,
  GRETEL_W2: 386,
  GRETEL_W3: 387,
  GRETEL_W4: 388,
  HITLER_DEAD: 352,
  HITLER_DIE1: 353,
  HITLER_DIE2: 354,
  HITLER_DIE3: 355,
  HITLER_DIE4: 356,
  HITLER_DIE5: 357,
  HITLER_DIE6: 358,
  HITLER_DIE7: 359,
  HITLER_W1: 345,
  HITLER_W2: 346,
  HITLER_W3: 347,
  HITLER_W4: 348,
  INKY_W1: 294,
  MECHA_DEAD: 341,
  MECHA_DIE1: 342,
  MECHA_DIE2: 343,
  MECHA_DIE3: 344,
  MECHA_W1: 334,
  MECHA_W2: 335,
  MECHA_W3: 336,
  MECHA_W4: 337,
  MUT_DEAD: 233,
  MUT_DIE_1: 228,
  MUT_DIE_2: 229,
  MUT_DIE_3: 230,
  MUT_DIE_4: 232,
  MUT_PAIN_1: 227,
  MUT_PAIN_2: 231,
  MUT_S_1: 187,
  MUT_W1_1: 195,
  MUT_W2_1: 203,
  MUT_W3_1: 211,
  MUT_W4_1: 219,
  OFC_DEAD: 284,
  OFC_DIE_1: 279,
  OFC_DIE_2: 280,
  OFC_DIE_3: 281,
  OFC_DIE_4: 283,
  OFC_PAIN_1: 278,
  OFC_PAIN_2: 282,
  OFC_S_1: 238,
  OFC_W1_1: 246,
  OFC_W2_1: 254,
  OFC_W3_1: 262,
  OFC_W4_1: 270,
  PINKY_W1: 290,
  SCHABB_DEAD: 316,
  SCHABB_DIE1: 313,
  SCHABB_DIE2: 314,
  SCHABB_DIE3: 315,
  SCHABB_W1: 307,
  SCHABB_W2: 308,
  SCHABB_W3: 309,
  SCHABB_W4: 310,
  SS_DEAD: 183,
  SS_DIE_1: 179,
  SS_DIE_2: 180,
  SS_DIE_3: 181,
  SS_PAIN_1: 178,
  SS_PAIN_2: 182,
  SS_S_1: 138,
  SS_W1_1: 146,
  SS_W2_1: 154,
  SS_W3_1: 162,
  SS_W4_1: 170
} as const;
const ACTOR_STAND_SPRITES: Record<string, number> = {
  dog: ACTOR_SPRITES.DOG_W1_1,
  guard: ACTOR_SPRITES.GRD_S_1,
  mutant: ACTOR_SPRITES.MUT_S_1,
  officer: ACTOR_SPRITES.OFC_S_1,
  ss: ACTOR_SPRITES.SS_S_1
};
const ACTOR_PATROL_SPRITES: Record<string, number> = {
  dog: ACTOR_SPRITES.DOG_W1_1,
  guard: ACTOR_SPRITES.GRD_W1_1,
  mutant: ACTOR_SPRITES.MUT_W1_1,
  officer: ACTOR_SPRITES.OFC_W1_1,
  ss: ACTOR_SPRITES.SS_W1_1
};
const ACTOR_ROTATING_KINDS = new Set(["dog", "guard", "mutant", "officer", "ss"]);
const ACTOR_BOSS_SPRITES: Record<string, number> = {
  boss: ACTOR_SPRITES.BOSS_W1,
  fake_hitler: ACTOR_SPRITES.FAKE_W1,
  fat: ACTOR_SPRITES.FAT_W1,
  gift: ACTOR_SPRITES.GIFT_W1,
  gretel: ACTOR_SPRITES.GRETEL_W1,
  // WL_ACT2.C SpawnHitler starts in s_mechastand before morphing to Hitler.
  hitler: ACTOR_SPRITES.MECHA_W1,
  schabbs: ACTOR_SPRITES.SCHABB_W1
};
const ACTOR_GHOST_SPRITES: Record<string, number> = {
  blinky: ACTOR_SPRITES.BLINKY_W1,
  clyde: ACTOR_SPRITES.CLYDE_W1,
  inky: ACTOR_SPRITES.INKY_W1,
  pinky: ACTOR_SPRITES.PINKY_W1
};
const ACTOR_PAIN_STATES: Record<string, [ActorStateFrame, ActorStateFrame]> = {
  guard: [
    { name: "s_grdpain", shapenum: ACTOR_SPRITES.GRD_PAIN_1, tics: 10 },
    { name: "s_grdpain1", shapenum: ACTOR_SPRITES.GRD_PAIN_2, tics: 10 }
  ],
  mutant: [
    { name: "s_mutpain", shapenum: ACTOR_SPRITES.MUT_PAIN_1, tics: 10 },
    { name: "s_mutpain1", shapenum: ACTOR_SPRITES.MUT_PAIN_2, tics: 10 }
  ],
  officer: [
    { name: "s_ofcpain", shapenum: ACTOR_SPRITES.OFC_PAIN_1, tics: 10 },
    { name: "s_ofcpain1", shapenum: ACTOR_SPRITES.OFC_PAIN_2, tics: 10 }
  ],
  ss: [
    { name: "s_sspain", shapenum: ACTOR_SPRITES.SS_PAIN_1, tics: 10 },
    { name: "s_sspain1", shapenum: ACTOR_SPRITES.SS_PAIN_2, tics: 10 }
  ]
};
const ACTOR_PATROL_STATES: Record<string, ActorStateFrame[]> = {
  dog: pathFrames("dog", [ACTOR_SPRITES.DOG_W1_1, ACTOR_SPRITES.DOG_W2_1, ACTOR_SPRITES.DOG_W3_1, ACTOR_SPRITES.DOG_W4_1]),
  guard: pathFrames("grd", [ACTOR_SPRITES.GRD_W1_1, ACTOR_SPRITES.GRD_W2_1, ACTOR_SPRITES.GRD_W3_1, ACTOR_SPRITES.GRD_W4_1]),
  mutant: pathFrames("mut", [ACTOR_SPRITES.MUT_W1_1, ACTOR_SPRITES.MUT_W2_1, ACTOR_SPRITES.MUT_W3_1, ACTOR_SPRITES.MUT_W4_1]),
  officer: pathFrames("ofc", [ACTOR_SPRITES.OFC_W1_1, ACTOR_SPRITES.OFC_W2_1, ACTOR_SPRITES.OFC_W3_1, ACTOR_SPRITES.OFC_W4_1]),
  ss: pathFrames("ss", [ACTOR_SPRITES.SS_W1_1, ACTOR_SPRITES.SS_W2_1, ACTOR_SPRITES.SS_W3_1, ACTOR_SPRITES.SS_W4_1])
};
const ACTOR_CHASE_STATES: Record<string, ActorStateFrame[]> = {
  boss: chaseFrames("boss", [ACTOR_SPRITES.BOSS_W1, ACTOR_SPRITES.BOSS_W2, ACTOR_SPRITES.BOSS_W3, ACTOR_SPRITES.BOSS_W4]),
  dog: chaseFrames("dog", [ACTOR_SPRITES.DOG_W1_1, ACTOR_SPRITES.DOG_W2_1, ACTOR_SPRITES.DOG_W3_1, ACTOR_SPRITES.DOG_W4_1]),
  fake_hitler: chaseFrames("fake", [ACTOR_SPRITES.FAKE_W1, ACTOR_SPRITES.FAKE_W2, ACTOR_SPRITES.FAKE_W3, ACTOR_SPRITES.FAKE_W4]),
  fat: chaseFrames("fat", [ACTOR_SPRITES.FAT_W1, ACTOR_SPRITES.FAT_W2, ACTOR_SPRITES.FAT_W3, ACTOR_SPRITES.FAT_W4]),
  gift: chaseFrames("gift", [ACTOR_SPRITES.GIFT_W1, ACTOR_SPRITES.GIFT_W2, ACTOR_SPRITES.GIFT_W3, ACTOR_SPRITES.GIFT_W4]),
  gretel: chaseFrames("gretel", [ACTOR_SPRITES.GRETEL_W1, ACTOR_SPRITES.GRETEL_W2, ACTOR_SPRITES.GRETEL_W3, ACTOR_SPRITES.GRETEL_W4]),
  guard: chaseFrames("grd", [ACTOR_SPRITES.GRD_W1_1, ACTOR_SPRITES.GRD_W2_1, ACTOR_SPRITES.GRD_W3_1, ACTOR_SPRITES.GRD_W4_1]),
  hitler: chaseFrames("mecha", [ACTOR_SPRITES.MECHA_W1, ACTOR_SPRITES.MECHA_W2, ACTOR_SPRITES.MECHA_W3, ACTOR_SPRITES.MECHA_W4], [10, 6, 8, 10, 6, 8]),
  mutant: chaseFrames("mut", [ACTOR_SPRITES.MUT_W1_1, ACTOR_SPRITES.MUT_W2_1, ACTOR_SPRITES.MUT_W3_1, ACTOR_SPRITES.MUT_W4_1]),
  officer: chaseFrames("ofc", [ACTOR_SPRITES.OFC_W1_1, ACTOR_SPRITES.OFC_W2_1, ACTOR_SPRITES.OFC_W3_1, ACTOR_SPRITES.OFC_W4_1]),
  schabbs: chaseFrames("schabb", [ACTOR_SPRITES.SCHABB_W1, ACTOR_SPRITES.SCHABB_W2, ACTOR_SPRITES.SCHABB_W3, ACTOR_SPRITES.SCHABB_W4]),
  ss: chaseFrames("ss", [ACTOR_SPRITES.SS_W1_1, ACTOR_SPRITES.SS_W2_1, ACTOR_SPRITES.SS_W3_1, ACTOR_SPRITES.SS_W4_1])
};
const ACTOR_DEATH_STATES: Record<string, ActorStateFrame[]> = {
  boss: deathFrames([
    ["s_bossdie1", ACTOR_SPRITES.BOSS_DIE1, 15],
    ["s_bossdie2", ACTOR_SPRITES.BOSS_DIE2, 15],
    ["s_bossdie3", ACTOR_SPRITES.BOSS_DIE3, 15],
    ["s_bossdie4", ACTOR_SPRITES.BOSS_DEAD, 0, true]
  ]),
  dog: deathFrames([
    ["s_dogdie1", ACTOR_SPRITES.DOG_DIE_1, 15],
    ["s_dogdie2", ACTOR_SPRITES.DOG_DIE_2, 15],
    ["s_dogdie3", ACTOR_SPRITES.DOG_DIE_3, 15],
    ["s_dogdead", ACTOR_SPRITES.DOG_DEAD, 15, true]
  ]),
  fake_hitler: deathFrames([
    ["s_fakedie1", ACTOR_SPRITES.FAKE_DIE1, 10],
    ["s_fakedie2", ACTOR_SPRITES.FAKE_DIE2, 10],
    ["s_fakedie3", ACTOR_SPRITES.FAKE_DIE3, 10],
    ["s_fakedie4", ACTOR_SPRITES.FAKE_DIE4, 10],
    ["s_fakedie5", ACTOR_SPRITES.FAKE_DIE5, 10],
    ["s_fakedie6", ACTOR_SPRITES.FAKE_DEAD, 0, true]
  ]),
  fat: deathFrames([
    ["s_fatdie1", ACTOR_SPRITES.FAT_W1, 1],
    ["s_fatdie2", ACTOR_SPRITES.FAT_W1, 10],
    ["s_fatdie3", ACTOR_SPRITES.FAT_DIE1, 10],
    ["s_fatdie4", ACTOR_SPRITES.FAT_DIE2, 10],
    ["s_fatdie5", ACTOR_SPRITES.FAT_DIE3, 10],
    ["s_fatdie6", ACTOR_SPRITES.FAT_DEAD, 20, true]
  ]),
  gift: deathFrames([
    ["s_giftdie1", ACTOR_SPRITES.GIFT_W1, 1],
    ["s_giftdie2", ACTOR_SPRITES.GIFT_W1, 10],
    ["s_giftdie3", ACTOR_SPRITES.GIFT_DIE1, 10],
    ["s_giftdie4", ACTOR_SPRITES.GIFT_DIE2, 10],
    ["s_giftdie5", ACTOR_SPRITES.GIFT_DIE3, 10],
    ["s_giftdie6", ACTOR_SPRITES.GIFT_DEAD, 20, true]
  ]),
  gretel: deathFrames([
    ["s_greteldie1", ACTOR_SPRITES.GRETEL_DIE1, 15],
    ["s_greteldie2", ACTOR_SPRITES.GRETEL_DIE2, 15],
    ["s_greteldie3", ACTOR_SPRITES.GRETEL_DIE3, 15],
    ["s_greteldie4", ACTOR_SPRITES.GRETEL_DEAD, 0, true]
  ]),
  guard: deathFrames([
    ["s_grddie1", ACTOR_SPRITES.GRD_DIE_1, 15],
    ["s_grddie2", ACTOR_SPRITES.GRD_DIE_2, 15],
    ["s_grddie3", ACTOR_SPRITES.GRD_DIE_3, 15],
    ["s_grddie4", ACTOR_SPRITES.GRD_DEAD, 0, true]
  ]),
  hitler: deathFrames([
    ["s_mechadie1", ACTOR_SPRITES.MECHA_DIE1, 10],
    ["s_mechadie2", ACTOR_SPRITES.MECHA_DIE2, 10],
    ["s_mechadie3", ACTOR_SPRITES.MECHA_DIE3, 10],
    ["s_mechadie4", ACTOR_SPRITES.MECHA_DEAD, 0, true]
  ]),
  mutant: deathFrames([
    ["s_mutdie1", ACTOR_SPRITES.MUT_DIE_1, 7],
    ["s_mutdie2", ACTOR_SPRITES.MUT_DIE_2, 7],
    ["s_mutdie3", ACTOR_SPRITES.MUT_DIE_3, 7],
    ["s_mutdie4", ACTOR_SPRITES.MUT_DIE_4, 7],
    ["s_mutdie5", ACTOR_SPRITES.MUT_DEAD, 0, true]
  ]),
  officer: deathFrames([
    ["s_ofcdie1", ACTOR_SPRITES.OFC_DIE_1, 11],
    ["s_ofcdie2", ACTOR_SPRITES.OFC_DIE_2, 11],
    ["s_ofcdie3", ACTOR_SPRITES.OFC_DIE_3, 11],
    ["s_ofcdie4", ACTOR_SPRITES.OFC_DIE_4, 11],
    ["s_ofcdie5", ACTOR_SPRITES.OFC_DEAD, 0, true]
  ]),
  schabbs: deathFrames([
    ["s_schabbdie1", ACTOR_SPRITES.SCHABB_W1, 10],
    ["s_schabbdie2", ACTOR_SPRITES.SCHABB_W1, 10],
    ["s_schabbdie3", ACTOR_SPRITES.SCHABB_DIE1, 10],
    ["s_schabbdie4", ACTOR_SPRITES.SCHABB_DIE2, 10],
    ["s_schabbdie5", ACTOR_SPRITES.SCHABB_DIE3, 10],
    ["s_schabbdie6", ACTOR_SPRITES.SCHABB_DEAD, 20, true]
  ]),
  ss: deathFrames([
    ["s_ssdie1", ACTOR_SPRITES.SS_DIE_1, 15],
    ["s_ssdie2", ACTOR_SPRITES.SS_DIE_2, 15],
    ["s_ssdie3", ACTOR_SPRITES.SS_DIE_3, 15],
    ["s_ssdie4", ACTOR_SPRITES.SS_DEAD, 0, true]
  ])
};
const BOSS_INFO_TILES: Record<number, string> = {
  160: "fake_hitler",
  178: "hitler",
  179: "fat",
  196: "schabbs",
  197: "gretel",
  214: "boss",
  215: "gift"
};
const GHOST_INFO_TILES: Record<number, string> = {
  224: "blinky",
  225: "clyde",
  226: "pinky",
  227: "inky"
};
// WL_ACT2.C starthitpoints[4][NUMENEMIES], with the UI difficulties mapped to rows 1-3.
const START_HITPOINTS = [
  [25, 50, 100, 1, 850, 850, 200, 800, 45, 25, 25, 25, 25, 850, 850, 850, 5, 1450, 850, 1050, 950, 1250],
  [25, 50, 100, 1, 950, 950, 300, 950, 55, 25, 25, 25, 25, 950, 950, 950, 10, 1550, 950, 1150, 1050, 1350],
  [25, 50, 100, 1, 1050, 1550, 400, 1050, 55, 25, 25, 25, 25, 1050, 1050, 1050, 15, 1650, 1050, 1250, 1150, 1450],
  [25, 50, 100, 1, 1200, 2400, 500, 1200, 65, 25, 25, 25, 25, 1200, 1200, 1200, 25, 2000, 1200, 1400, 1300, 1600]
] as const;
const ENEMY_HITPOINT_INDEX: Record<string, number> = {
  blinky: 9,
  boss: 4,
  clyde: 10,
  dog: 3,
  fake_hitler: 6,
  fat: 15,
  gift: 14,
  gretel: 13,
  guard: 0,
  hitler: 7,
  inky: 12,
  mutant: 8,
  officer: 1,
  pinky: 11,
  schabbs: 5,
  ss: 2
};
// ID_US_A.ASM rndtable. US_RndT increments rndindex before reading this table.
const US_RND_TABLE = [
  0, 8, 109, 220, 222, 241, 149, 107, 75, 248, 254, 140, 16, 66, 74, 21, 211, 47, 80, 242, 154, 27,
  205, 128, 161, 89, 77, 36, 95, 110, 85, 48, 212, 140, 211, 249, 22, 79, 200, 50, 28, 188, 52, 140,
  202, 120, 68, 145, 62, 70, 184, 190, 91, 197, 152, 224, 149, 104, 25, 178, 252, 182, 202, 182, 141,
  197, 4, 81, 181, 242, 145, 42, 39, 227, 156, 198, 225, 193, 219, 93, 122, 175, 249, 0, 175, 143, 70,
  239, 46, 246, 163, 53, 163, 109, 168, 135, 2, 235, 25, 92, 20, 145, 138, 77, 69, 166, 78, 176, 173,
  212, 166, 113, 94, 161, 41, 50, 239, 49, 111, 164, 70, 60, 2, 37, 171, 75, 136, 156, 11, 56, 42,
  146, 138, 229, 73, 146, 77, 61, 98, 196, 135, 106, 63, 197, 195, 86, 96, 203, 113, 101, 170, 247,
  181, 113, 80, 250, 108, 7, 255, 237, 129, 226, 79, 107, 112, 166, 103, 241, 24, 223, 239, 120, 198,
  58, 60, 82, 128, 3, 184, 66, 143, 224, 145, 224, 81, 206, 163, 45, 63, 90, 168, 114, 59, 33, 159,
  95, 28, 139, 123, 98, 125, 196, 15, 70, 194, 253, 54, 14, 109, 226, 71, 17, 161, 93, 186, 87, 244,
  138, 20, 52, 123, 251, 26, 36, 17, 46, 52, 231, 232, 76, 31, 221, 84, 37, 216, 165, 212, 106, 197,
  242, 98, 43, 39, 175, 254, 145, 190, 84, 118, 222, 187, 136, 120, 163, 236, 249
] as const;
const COMBAT_FOV = Math.PI / 3;
const SHOOT_CENTER_DELTA_PIXELS = 20;
const KNIFE_RANGE_TILES = 0x18000 / 0x10000;
const DIRECTION_DELTAS: Record<number, { dx: number; dy: number }> = {
  0: { dx: 1, dy: 0 },
  1: { dx: 1, dy: -1 },
  2: { dx: 0, dy: -1 },
  3: { dx: -1, dy: -1 },
  4: { dx: -1, dy: 0 },
  5: { dx: -1, dy: 1 },
  6: { dx: 0, dy: 1 },
  7: { dx: 1, dy: 1 }
};

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}

root.innerHTML = `
  <main class="port-shell">
    <header class="port-toolbar">
      <div class="identity">
        <span>Source TypeScript</span>
        <small id="status-line">Initializing</small>
      </div>
      <div class="actions">
        <button id="reset-game" type="button">Reset</button>
        <button id="tick-game" type="button">Tick</button>
        <button id="run-demo" type="button" disabled>Demo</button>
        <button id="export-png" type="button">PNG</button>
        <button id="export-wav" type="button">WAV</button>
        <button id="export-state" type="button">BIN</button>
      </div>
    </header>
    <section class="workbench">
      <div class="stage" aria-label="TypeScript port renderer">
        <canvas id="screen" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
      </div>
      <aside class="panel">
        <dl class="status-grid">
          <div>
            <dt>Source</dt>
            <dd id="source-count">--</dd>
          </div>
          <div>
            <dt>Assets</dt>
            <dd id="asset-count">--</dd>
          </div>
          <div>
            <dt>Map</dt>
            <dd id="map-state">fallback</dd>
          </div>
          <div>
            <dt>Objects</dt>
            <dd id="object-state">--</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd id="runtime-state">--</dd>
          </div>
          <div>
            <dt>Demo</dt>
            <dd id="demo-state">--</dd>
          </div>
        </dl>
        <div class="class-grid" id="class-grid"></div>
        <div class="artifact-list" id="artifact-list" aria-live="polite"></div>
        <pre class="trace-log" id="trace-log" aria-live="polite"></pre>
      </aside>
    </section>
  </main>
`;

const appRoot = root;
const screen = requireElement<HTMLCanvasElement>("#screen");
const statusLine = requireElement<HTMLElement>("#status-line");
const sourceCount = requireElement<HTMLElement>("#source-count");
const assetCount = requireElement<HTMLElement>("#asset-count");
const mapState = requireElement<HTMLElement>("#map-state");
const objectState = requireElement<HTMLElement>("#object-state");
const runtimeState = requireElement<HTMLElement>("#runtime-state");
const demoState = requireElement<HTMLElement>("#demo-state");
const classGrid = requireElement<HTMLElement>("#class-grid");
const artifactList = requireElement<HTMLElement>("#artifact-list");
const traceLog = requireElement<HTMLPreElement>("#trace-log");
const buttonReset = requireElement<HTMLButtonElement>("#reset-game");
const buttonTick = requireElement<HTMLButtonElement>("#tick-game");
const buttonRunDemo = requireElement<HTMLButtonElement>("#run-demo");
const buttonExportPng = requireElement<HTMLButtonElement>("#export-png");
const buttonExportWav = requireElement<HTMLButtonElement>("#export-wav");
const buttonExportState = requireElement<HTMLButtonElement>("#export-state");

class WLMain {
  readonly id_ca: IDCA;
  readonly id_in: IDIN;
  readonly id_pm: IDPM;
  readonly id_sd: IDSD;
  readonly id_us: IDUS;
  readonly id_vl: IDVL;
  readonly wl_draw: WLDraw;
  readonly wl_game: WLGame;
  readonly wl_play: WLPlay;

  private artifactUrls: string[] = [];
  private animationStarted = false;
  private demoRunning = false;
  private lastTime = 0;
  private readonly demoPlan: DemoPlan | null;

  constructor(screenCanvas: HTMLCanvasElement, demoPlan: DemoPlan | null) {
    this.demoPlan = demoPlan;
    this.id_vl = new IDVL(screenCanvas);
    this.id_in = new IDIN();
    this.id_pm = new IDPM();
    this.id_sd = new IDSD();
    this.id_us = new IDUS();
    this.id_ca = new IDCA();
    this.wl_game = new WLGame();
    this.wl_draw = new WLDraw(this.id_vl, this.id_pm);
    this.wl_play = new WLPlay(this.wl_game, this.wl_draw, this.id_in, this.id_sd);
  }

  async StartGame(): Promise<void> {
    this.id_us.US_Print("StartGame");
    statusLine.textContent = "Loading ID_CA map";
    try {
      const status = await this.id_ca.CacheStartup();
      renderSourceStatus(status);
      const pageStatus = await this.id_pm.PM_Startup();
      this.id_us.US_Print(
        `PM_Startup VSWAP ${pageStatus.chunksInFile} chunks / ${pageStatus.textureCount} textures / ${pageStatus.spriteCount} sprites / palette ${pageStatus.paletteSource} / first ${pageStatus.firstSpriteVisiblePixels} px`
      );
      const wolfMap = await this.id_ca.CA_CacheMap(0);
      this.wl_game.SetupGameLevel(0, wolfMap);
      this.id_us.US_Print(
        `CA_CacheMap ${wolfMap.header.name || `map ${wolfMap.index}`} ${wolfMap.header.width}x${wolfMap.header.height}`
      );
    } catch (error) {
      this.wl_game.SetupGameLevel(0);
      this.id_us.US_Print(error instanceof Error ? `Fallback map: ${error.message}` : "Fallback map");
    }

    this.lastTime = window.performance.now();
    if (!this.animationStarted) {
      this.animationStarted = true;
      requestAnimationFrame((time) => this.GameLoop(time));
    }

    this.RenderUi();
  }

  ResetGame(): void {
    this.id_sd.SD_StopDigitized();
    this.wl_game.SetupGameLevel(0, this.id_ca.currentMap);
    this.wl_play.PlayLoop(1000 / 60);
    this.id_us.US_Print("ResetGame");
    this.RenderUi();
  }

  Tick(ticMs: number): void {
    this.wl_play.PlayLoop(ticMs);
    this.RenderUi();
  }

  async RunDemoPlan(): Promise<void> {
    if (!this.demoPlan || this.demoRunning) {
      return;
    }

    this.demoRunning = true;
    statusLine.textContent = `Demo running: ${this.demoPlan.name}`;
    this.RenderUi();

    try {
      for (const [index, step] of this.demoPlan.steps.entries()) {
        await this.RunDemoStep(step, index);
      }

      statusLine.textContent = `Demo complete: ${this.demoPlan.name}`;
    } catch (error) {
      statusLine.textContent = error instanceof Error ? error.message : "Demo failed";
    } finally {
      this.demoRunning = false;
      this.RenderUi();
    }
  }

  async ExportPng(label: string, autoDownload = true): Promise<void> {
    const blob = await this.id_vl.VL_ScreenToBlob();
    this.RegisterArtifact(blob, artifactFileName("frame", label, "png"), autoDownload);
  }

  async ExportWav(label: string, autoDownload = true): Promise<void> {
    const wav = this.id_sd.SD_ExportWav();
    this.RegisterArtifact(
      new Blob([new Uint8Array(wav)], {
        type: "audio/wav"
      }),
      artifactFileName("audio", label, "wav"),
      autoDownload
    );
  }

  StateSnapshot(): Record<string, unknown> {
    return {
      audioSamples: this.id_sd.sampleCount,
      game: this.wl_game.gamestate,
      map: this.wl_game.mapMetadata,
      doors: this.wl_game.map.doors.map((door) => ({
        action: door.action,
        index: door.index,
        lock: door.lock,
        position: door.position,
        tile: door.tile,
        vertical: door.vertical,
        x: door.x,
        y: door.y
      })),
      objects: {
        actors: this.wl_game.map.actors.length,
        actorsDetail: this.wl_game.map.actors.map((actor) => ({
          attackMode: actor.attackMode,
          distance: actor.distance,
          dir: actor.dir,
          hitpoints: actor.hitpoints,
          kind: actor.kind,
          mode: actor.mode,
          shootable: actor.shootable,
          speed: actor.speed,
          stateIndex: actor.stateIndex,
          stateName: actor.stateName,
          stateShapenum: actor.stateShapenum,
          stateTics: actor.stateTics,
          targetX: actor.targetX,
          targetY: actor.targetY,
          tile: actor.tile,
          x: actor.x,
          y: actor.y
        })),
        killedActors: this.wl_game.map.actors.filter((actor) => !actor.shootable && actor.kind !== "dead_guard").length,
        shootableActors: this.wl_game.map.actors.filter((actor) => actor.shootable).length,
        blockingStatics: this.wl_game.map.blockingStaticKeys.size,
        collectedBonuses: this.wl_game.map.statics.filter((stat) => stat.collected).length,
        doors: this.wl_game.map.doors.length,
        statics: this.wl_game.map.statics.length,
        staticsDetail: this.wl_game.map.statics.map((stat) => ({
          blocking: stat.blocking,
          bonus: stat.bonus,
          collected: stat.collected,
          item: stat.item,
          shapenum: stat.shapenum,
          treasure: stat.treasure,
          type: stat.type,
          x: stat.x,
          y: stat.y
        }))
      },
      pageManager: this.id_pm.StateSnapshot(),
      runner: "source-typescript",
      ticcount: this.wl_game.gamestate.ticcount
    };
  }

  async ExportState(label: string, autoDownload = true): Promise<void> {
    const bytes = encodeText(JSON.stringify(this.StateSnapshot()));
    this.RegisterArtifact(
      new Blob([new Uint8Array(bytes)], {
        type: "application/octet-stream"
      }),
      artifactFileName("state", label, "bin"),
      autoDownload
    );
  }

  private GameLoop(time: number): void {
    const elapsed = Math.min(100, time - this.lastTime);
    this.lastTime = time;
    if (!this.demoRunning) {
      this.Tick(elapsed);
    }
    requestAnimationFrame((nextTime) => this.GameLoop(nextTime));
  }

  private async RunDemoStep(step: DemoPlanStep, index: number): Promise<void> {
    if (step.action === "wait") {
      await this.AdvanceDemoWait(Math.max(0, step.ms));
      return;
    }

    if (step.action === "capture") {
      const label = step.label ?? `step-${index + 1}`;
      if (step.png !== false) {
        await this.ExportPng(label, false);
      }

      if (step.wav) {
        await this.ExportWav(label, false);
      }

      if (step.state) {
        await this.ExportState(label, false);
      }

      return;
    }

    const keyCode = keyCodeFor(step.key);
    if (step.action === "keydown") {
      this.id_in.KeyDown(keyCode);
      return;
    }

    if (step.action === "keyup") {
      this.id_in.KeyUp(keyCode);
      return;
    }

    if (step.action === "key") {
      this.id_in.KeyDown(keyCode);
      await this.AdvanceDemoWait(Math.max(1, step.holdMs ?? DEMO_DEFAULT_HOLD_MS));
      this.id_in.KeyUp(keyCode);
    }
  }

  private async AdvanceDemoWait(milliseconds: number): Promise<void> {
    const ticMs = 1000 / 70;
    let remaining = milliseconds;
    let steps = 0;
    while (remaining > 0) {
      const step = Math.min(ticMs, remaining);
      this.Tick(step);
      remaining -= step;
      steps += 1;
      if (steps % 64 === 0) {
        await delay(0);
      }
    }

    await delay(0);
  }

  private RegisterArtifact(blob: Blob, fileName: string, autoDownload: boolean): void {
    const url = URL.createObjectURL(blob);
    this.artifactUrls.push(url);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.textContent = `${fileName} (${formatBytes(blob.size)})`;
    artifactList.prepend(link);

    if (autoDownload) {
      link.click();
    }
  }

  private RenderUi(): void {
    mapState.textContent = this.wl_game.mapMetadata;
    objectState.textContent = this.wl_game.objectMetadata;
    runtimeState.textContent = `tic ${this.wl_game.gamestate.ticcount} / ${this.wl_game.gamestate.x.toFixed(2)}, ${this.wl_game.gamestate.y.toFixed(2)} / hp ${this.wl_game.gamestate.health} ammo ${this.wl_game.gamestate.ammo} wp ${this.wl_game.gamestate.weapon}:${this.wl_game.gamestate.weaponframe} atk ${this.wl_game.gamestate.attackframe}:${this.wl_game.gamestate.attackcount} keys ${this.wl_game.gamestate.keys}`;
    demoState.textContent = this.demoPlan
      ? this.demoRunning
        ? `Running ${this.demoPlan.name}`
        : `${this.demoPlan.name} (${this.demoPlan.steps.length} steps)`
      : "No plan";
    buttonRunDemo.disabled = !this.demoPlan || this.demoRunning;
    traceLog.textContent = this.id_us.lines.slice(-18).join("\n");
    statusLine.textContent = this.demoRunning ? statusLine.textContent : "Running";
  }
}

class WLPlay {
  constructor(
    private readonly wl_game: WLGame,
    private readonly wl_draw: WLDraw,
    private readonly id_in: IDIN,
    private readonly id_sd: IDSD
  ) {}

  PlayLoop(ticMs: number): void {
    const tics = ticsFromMilliseconds(ticMs);
    const moved = this.wl_game.PlayPlayerInput(this.id_in, ticMs, tics, this.id_in.ConsumeUse());
    this.wl_game.MoveActors(tics);
    this.wl_game.MoveDoors(tics);
    this.wl_draw.ThreeDRefresh(this.wl_game);
    this.id_sd.SD_Service(moved, ticMs);
  }
}

class WLGame {
  map = createFallbackMap();
  private attackButtonHeld = false;
  private rndIndex = 0;

  readonly gamestate = {
    angle: 0,
    ammo: STARTAMMO,
    attackcount: 0,
    attackframe: 0,
    bestweapon: WP_PISTOL,
    chosenweapon: WP_PISTOL,
    difficulty: "medium" as "easy" | "medium" | "hard",
    health: MAX_HEALTH,
    keys: 0,
    killcount: 0,
    killtotal: 0,
    level: 0,
    lives: 3,
    nextextra: EXTRAPOINTS,
    score: 0,
    secretcount: 0,
    secrettotal: 0,
    treasurecount: 0,
    treasuretotal: 0,
    ticcount: 0,
    weapon: WP_PISTOL,
    weaponframe: 0,
    x: 3.5,
    y: 3.5
  };

  get mapMetadata(): string {
    return `${this.map.name} ${this.map.width}x${this.map.height}`;
  }

  get objectMetadata(): string {
    const movingDoors = this.map.doors.filter((door) => door.action !== "closed").length;
    const shootableActors = this.map.actors.filter((actor) => actor.shootable).length;
    return `${this.map.doors.length} doors (${movingDoors} active) / ${this.map.statics.length} statics / ${shootableActors}/${this.map.actors.length} live actors`;
  }

  SetupGameLevel(level: number, wolfMap: WolfMap | null = null): void {
    let spawn: PlayerSpawn = {
      angle: 0,
      tile: 0,
      x: 3.5,
      y: 3.5
    };

    if (wolfMap) {
      const scan = scanInfoPlane(wolfMap, this.gamestate.difficulty);
      const doors = scanWallPlaneForDoors(wolfMap);
      const blockingStaticKeys = new Set(
        scan.statics.filter((stat) => stat.blocking).map((stat) => tileKey(stat.x, stat.y))
      );

      this.map = {
        actors: scan.actors,
        blockingStaticKeys,
        doors,
        height: wolfMap.header.height,
        killTotal: scan.killTotal,
        name: `WL6 ${wolfMap.index} ${wolfMap.header.name || "unnamed"}`,
        objects: wolfMap.planes[1],
        secretTotal: scan.secretTotal,
        source: "wl6",
        statics: scan.statics,
        treasureTotal: scan.treasureTotal,
        walls: wolfMap.planes[0],
        width: wolfMap.header.width
      };
      spawn = scan.spawn ?? findPlayerSpawn(wolfMap);
    } else if (this.map.source !== "wl6") {
      this.map = createFallbackMap();
    }

    this.gamestate.angle = normalizeAngle(spawn.angle);
    this.gamestate.ammo = STARTAMMO;
    this.gamestate.attackcount = 0;
    this.gamestate.attackframe = 0;
    this.attackButtonHeld = false;
    this.rndIndex = 0;
    this.gamestate.bestweapon = WP_PISTOL;
    this.gamestate.chosenweapon = WP_PISTOL;
    this.gamestate.health = MAX_HEALTH;
    this.gamestate.keys = 0;
    this.gamestate.killcount = 0;
    this.gamestate.killtotal = this.map.killTotal;
    this.gamestate.level = level;
    this.gamestate.lives = 3;
    this.gamestate.nextextra = EXTRAPOINTS;
    this.gamestate.score = 0;
    this.gamestate.secretcount = 0;
    this.gamestate.secrettotal = this.map.secretTotal;
    this.gamestate.treasurecount = 0;
    this.gamestate.treasuretotal = this.map.treasureTotal;
    this.gamestate.ticcount = 0;
    this.gamestate.weapon = WP_PISTOL;
    this.gamestate.weaponframe = 0;
    this.gamestate.x = spawn.x;
    this.gamestate.y = spawn.y;
  }

  PlayPlayerInput(id_in: IDIN, ticMs: number, tics: number, usePressed: boolean): boolean {
    const attackDown = id_in.IN_AttackDown();
    let moved = false;

    if (this.gamestate.attackcount > 0) {
      moved = this.ControlMovement(id_in, ticMs);
      this.T_Attack(tics, attackDown);
    } else {
      if (usePressed) {
        this.Cmd_Use();
      }

      if (attackDown && !this.attackButtonHeld) {
        this.Cmd_Fire();
      }

      moved = this.ControlMovement(id_in, ticMs);
    }

    if (!attackDown) {
      this.attackButtonHeld = false;
    }

    return moved;
  }

  ControlMovement(id_in: IDIN, ticMs: number): boolean {
    const seconds = ticMs / 1000;
    const moveSpeed = 2.4 * seconds;
    const turnSpeed = 2.6 * seconds;
    let moved = false;

    if (id_in.IN_KeyDown(37) || id_in.IN_KeyDown(65)) {
      this.gamestate.angle -= turnSpeed;
      moved = true;
    }

    if (id_in.IN_KeyDown(39) || id_in.IN_KeyDown(68)) {
      this.gamestate.angle += turnSpeed;
      moved = true;
    }

    const forward =
      (id_in.IN_KeyDown(38) || id_in.IN_KeyDown(87) ? 1 : 0) -
      (id_in.IN_KeyDown(40) || id_in.IN_KeyDown(83) ? 1 : 0);

    if (forward !== 0) {
      const nextX = this.gamestate.x + Math.cos(this.gamestate.angle) * moveSpeed * forward;
      const nextY = this.gamestate.y + Math.sin(this.gamestate.angle) * moveSpeed * forward;
      if (!this.IsWall(nextX, this.gamestate.y)) {
        this.gamestate.x = nextX;
      }

      if (!this.IsWall(this.gamestate.x, nextY)) {
        this.gamestate.y = nextY;
      }

      moved = true;
    }

    this.gamestate.angle = normalizeAngle(this.gamestate.angle);
    this.TryPickupBonusAt(Math.floor(this.gamestate.x), Math.floor(this.gamestate.y));
    this.gamestate.ticcount += 1;
    return moved;
  }

  Cmd_Fire(): void {
    const attackInfo = ATTACK_INFO[this.gamestate.weapon] ?? ATTACK_INFO[WP_KNIFE];
    const firstFrame = attackInfo?.[0];
    if (!firstFrame) {
      return;
    }

    this.attackButtonHeld = true;
    this.gamestate.weaponframe = 0;
    this.gamestate.attackframe = 0;
    this.gamestate.attackcount = firstFrame.tics;
    this.gamestate.weaponframe = firstFrame.frame;
  }

  Cmd_Use(): boolean {
    const target = this.UseTarget();
    const door = this.DoorAt(target.x, target.y);
    if (door) {
      this.OperateDoor(door.index);
      return true;
    }

    if ((this.map.objects[target.y * this.map.width + target.x] ?? 0) === PUSHABLETILE) {
      this.gamestate.secrettotal = Math.max(this.gamestate.secrettotal, this.map.secretTotal);
      return false;
    }

    return false;
  }

  MoveDoors(tics: number): void {
    for (const door of this.map.doors) {
      if (door.action === "open") {
        this.DoorOpen(door, tics);
      } else if (door.action === "opening") {
        this.DoorOpening(door, tics);
      } else if (door.action === "closing") {
        this.DoorClosing(door, tics);
      }
    }
  }

  MoveActors(tics: number): void {
    for (const actor of this.map.actors) {
      this.MoveActorState(actor, tics);
    }
  }

  private MoveActorState(actor: PortActor, tics: number): void {
    if (actor.mode === "dying") {
      this.MoveDeathState(actor, tics);
    } else if (actor.mode === "pain") {
      this.MovePainState(actor, tics);
    } else if (actor.mode === "patrol" || actor.mode === "chase") {
      this.MoveLoopingActorState(actor, tics);
      if (actor.mode === "patrol") {
        this.T_Path(actor, tics);
      }
    }
  }

  private MoveDeathState(actor: PortActor, tics: number): void {
    if (actor.stateTics <= 0) {
      return;
    }

    const sequence = ACTOR_DEATH_STATES[actor.kind];
    if (!sequence) {
      return;
    }

    actor.stateTics -= tics;
    while (actor.mode === "dying" && actor.stateTics <= 0) {
      const nextIndex = Math.min(actor.stateIndex + 1, sequence.length - 1);
      this.NewActorState(actor, sequence, nextIndex, actor.stateTics);
      if (nextIndex === sequence.length - 1) {
        return;
      }
    }
  }

  private MovePainState(actor: PortActor, tics: number): void {
    if (actor.stateTics <= 0) {
      return;
    }

    actor.stateTics -= tics;
    if (actor.stateTics <= 0) {
      this.StartChaseState(actor, actor.stateTics);
    }
  }

  private MoveLoopingActorState(actor: PortActor, tics: number): void {
    const sequence = actor.mode === "patrol" ? ACTOR_PATROL_STATES[actor.kind] : ACTOR_CHASE_STATES[actor.kind];
    if (!sequence) {
      return;
    }

    actor.stateTics -= tics;
    while (actor.stateTics <= 0) {
      const nextIndex = (actor.stateIndex + 1) % sequence.length;
      this.SetActorSequenceState(actor, sequence, nextIndex, actor.mode, actor.stateTics);
    }
  }

  private T_Path(actor: PortActor, tics: number): void {
    if (actor.dir === NODIR) {
      this.SelectPathDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }

    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance <= 0) {
        this.SelectPathDir(actor);
        if (actor.dir === NODIR || actor.distance <= 0) {
          return;
        }
      }

      if (move < actor.distance) {
        this.MoveObj(actor, move);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      move -= actor.distance;
      this.SelectPathDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }
  }

  private MoveObj(actor: PortActor, move: number): void {
    const delta = DIRECTION_DELTAS[actor.dir];
    if (!delta) {
      return;
    }

    actor.x += delta.dx * move;
    actor.y += delta.dy * move;
    actor.distance -= move;
  }

  private SelectPathDir(actor: PortActor): void {
    const targetX = Math.floor(actor.targetX);
    const targetY = Math.floor(actor.targetY);
    const spot = (this.map.objects[targetY * this.map.width + targetX] ?? 0) - ICONARROWS;
    if (spot >= 0 && spot < 8) {
      actor.dir = spot;
    }

    actor.distance = TILE_DISTANCE;
    if (!this.TryWalk(actor)) {
      actor.dir = NODIR;
    }
  }

  private TryWalk(actor: PortActor): boolean {
    const delta = DIRECTION_DELTAS[actor.dir];
    if (!delta) {
      return false;
    }

    const nextX = actor.targetX + delta.dx;
    const nextY = actor.targetY + delta.dy;
    if (!this.CanActorEnterTile(actor, nextX, nextY)) {
      return false;
    }

    actor.targetX = nextX;
    actor.targetY = nextY;
    actor.distance = TILE_DISTANCE;
    return true;
  }

  private CanActorEnterTile(actor: PortActor, tileX: number, tileY: number): boolean {
    if (this.GetTile(tileX, tileY) !== 0 || this.map.blockingStaticKeys.has(tileKey(tileX, tileY))) {
      return false;
    }

    return !this.map.actors.some((other) => {
      if (other === actor || !other.shootable) {
        return false;
      }

      return other.targetX === tileX && other.targetY === tileY;
    });
  }

  OperateDoor(index: number): void {
    const door = this.map.doors[index];
    if (!door) {
      return;
    }

    if (door.lock > 0 && door.lock < 5 && (this.gamestate.keys & (1 << (door.lock - 1))) === 0) {
      return;
    }

    if (door.action === "closed" || door.action === "closing") {
      this.OpenDoor(door);
    } else if (door.action === "open" || door.action === "opening") {
      this.CloseDoor(door);
    }
  }

  OpenDoor(door: PortDoor): void {
    if (door.action === "open") {
      door.ticcount = 0;
    } else {
      door.action = "opening";
    }
  }

  CloseDoor(door: PortDoor): void {
    if (this.PlayerIntersectsDoor(door)) {
      return;
    }

    door.action = "closing";
  }

  GiveKey(key: number): void {
    this.gamestate.keys |= 1 << key;
  }

  GiveAmmo(ammo: number): void {
    if (this.gamestate.ammo === 0 && this.gamestate.attackframe === 0) {
      this.gamestate.weapon = this.gamestate.chosenweapon;
    }

    this.gamestate.ammo = Math.min(MAX_AMMO, this.gamestate.ammo + ammo);
  }

  GiveWeapon(weapon: number): void {
    this.GiveAmmo(6);
    if (this.gamestate.bestweapon < weapon) {
      this.gamestate.bestweapon = weapon;
      this.gamestate.weapon = weapon;
      this.gamestate.chosenweapon = weapon;
    }
  }

  GiveExtraMan(): void {
    if (this.gamestate.lives < MAX_LIVES) {
      this.gamestate.lives += 1;
    }
  }

  GivePoints(points: number): void {
    this.gamestate.score += points;
    while (this.gamestate.score >= this.gamestate.nextextra) {
      this.gamestate.nextextra += EXTRAPOINTS;
      this.GiveExtraMan();
    }
  }

  HealSelf(points: number): void {
    this.gamestate.health = Math.min(MAX_HEALTH, this.gamestate.health + points);
  }

  IsWall(x: number, y: number): boolean {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    return this.GetTile(x, y) !== 0 || this.map.blockingStaticKeys.has(tileKey(tileX, tileY));
  }

  GetTile(x: number, y: number): number {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return 1;
    }

    const door = this.DoorAt(tileX, tileY);
    if (door && door.action !== "open") {
      return door.tile;
    }

    return this.GetWallTile(tileX, tileY);
  }

  DoorAtTile(x: number, y: number): PortDoor | null {
    return this.DoorAt(x, y);
  }

  GetWallTile(tileX: number, tileY: number): number {
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return 1;
    }

    return collisionTile(this.map.walls[tileY * this.map.width + tileX] ?? 1);
  }

  private T_Attack(tics: number, attackDown: boolean): void {
    this.gamestate.attackcount -= tics;
    while (this.gamestate.attackcount <= 0) {
      const attackInfo = ATTACK_INFO[this.gamestate.weapon] ?? ATTACK_INFO[WP_KNIFE];
      const current = attackInfo?.[this.gamestate.attackframe];
      if (!current) {
        this.FinishAttack();
        return;
      }

      if (current.attack === -1) {
        this.FinishAttack();
        return;
      }

      if (current.attack === 1) {
        this.RunGunAttackFrame();
      } else if (current.attack === 2) {
        this.RunKnifeAttackFrame();
      } else if (current.attack === 3) {
        if (this.gamestate.ammo > 0 && attackDown) {
          this.gamestate.attackframe -= 2;
        }
      } else if (current.attack === 4) {
        if (this.gamestate.ammo > 0) {
          if (attackDown) {
            this.gamestate.attackframe -= 2;
          }

          this.RunGunAttackFrame();
        }
      }

      this.gamestate.attackcount += current.tics;
      this.gamestate.attackframe += 1;
      this.gamestate.weaponframe = (attackInfo?.[this.gamestate.attackframe] ?? current).frame;
    }
  }

  private FinishAttack(): void {
    if (this.gamestate.ammo === 0) {
      this.gamestate.weapon = WP_KNIFE;
    } else if (this.gamestate.weapon !== this.gamestate.chosenweapon) {
      this.gamestate.weapon = this.gamestate.chosenweapon;
    }

    this.gamestate.attackcount = 0;
    this.gamestate.attackframe = 0;
    this.gamestate.weaponframe = 0;
  }

  private RunGunAttackFrame(): void {
    if (this.gamestate.ammo === 0) {
      this.gamestate.attackframe += 1;
      return;
    }

    this.gamestate.ammo -= 1;
    const target = this.TargetActorInCrosshair();
    if (!target) {
      return;
    }

    const dist = this.ActorTileDistance(target);
    let damage = 0;
    if (dist < 2) {
      damage = Math.floor(this.US_RndT() / 4);
    } else if (dist < 4) {
      damage = Math.floor(this.US_RndT() / 6);
    } else {
      if (Math.floor(this.US_RndT() / 12) < dist) {
        return;
      }

      damage = Math.floor(this.US_RndT() / 6);
    }

    this.DamageActor(target, damage);
  }

  private RunKnifeAttackFrame(): void {
    const target = this.TargetActorInCrosshair();
    if (!target) {
      return;
    }

    const dx = target.x + 0.5 - this.gamestate.x;
    const dy = target.y + 0.5 - this.gamestate.y;
    if (Math.hypot(dx, dy) > KNIFE_RANGE_TILES) {
      return;
    }

    this.DamageActor(target, this.US_RndT() >> 4);
  }

  private TargetActorInCrosshair(): PortActor | null {
    const forwardX = Math.cos(this.gamestate.angle);
    const forwardY = Math.sin(this.gamestate.angle);
    const rightX = -forwardY;
    const rightY = forwardX;
    const projectionScale = SCREEN_WIDTH / (2 * Math.tan(COMBAT_FOV / 2));
    let bestActor: PortActor | null = null;
    let bestDepth = Number.POSITIVE_INFINITY;

    for (const actor of this.map.actors) {
      if (!actor.shootable || actor.mode === "dead") {
        continue;
      }

      const dx = actor.x + 0.5 - this.gamestate.x;
      const dy = actor.y + 0.5 - this.gamestate.y;
      const depth = dx * forwardX + dy * forwardY;
      if (depth <= 0) {
        continue;
      }

      const side = dx * rightX + dy * rightY;
      const screenX = SCREEN_WIDTH / 2 + (side / depth) * projectionScale;
      if (Math.abs(screenX - SCREEN_WIDTH / 2) > SHOOT_CENTER_DELTA_PIXELS) {
        continue;
      }

      if (depth < bestDepth && this.CheckLineToActor(actor)) {
        bestActor = actor;
        bestDepth = depth;
      }
    }

    return bestActor;
  }

  private CheckLineToActor(actor: PortActor): boolean {
    const actorTileX = Math.floor(actor.x);
    const actorTileY = Math.floor(actor.y);
    const targetX = actor.x + 0.5;
    const targetY = actor.y + 0.5;
    const dx = targetX - this.gamestate.x;
    const dy = targetY - this.gamestate.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 16));

    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = this.gamestate.x + dx * t;
      const y = this.gamestate.y + dy * t;
      const tileX = Math.floor(x);
      const tileY = Math.floor(y);
      if (tileX === actorTileX && tileY === actorTileY) {
        continue;
      }

      if (this.GetTile(x, y) !== 0) {
        return false;
      }
    }

    return true;
  }

  private ActorTileDistance(actor: PortActor): number {
    const playerTileX = Math.floor(this.gamestate.x);
    const playerTileY = Math.floor(this.gamestate.y);
    return Math.max(Math.abs(Math.floor(actor.x) - playerTileX), Math.abs(Math.floor(actor.y) - playerTileY));
  }

  private DamageActor(actor: PortActor, damage: number): void {
    if (!actor.shootable || actor.mode === "dead") {
      return;
    }

    const wasAttackMode = actor.attackMode;
    const actualDamage = wasAttackMode ? damage : damage * 2;
    actor.hitpoints -= actualDamage;
    if (actor.hitpoints <= 0) {
      this.KillActor(actor);
      return;
    }

    if (!wasAttackMode) {
      this.FirstSighting(actor);
    }

    this.StartPainState(actor);
  }

  private KillActor(actor: PortActor): void {
    actor.hitpoints = 0;
    actor.shootable = false;
    actor.attackMode = false;
    this.StartDeathState(actor);
    this.gamestate.killcount += 1;
    this.GivePoints(actorKillScore(actor.kind));
    this.PlaceKillDrop(actor);
  }

  private US_RndT(): number {
    this.rndIndex = (this.rndIndex + 1) & 0xff;
    return US_RND_TABLE[this.rndIndex] ?? 0;
  }

  private PlaceKillDrop(actor: PortActor): void {
    const tileX = Math.floor(actor.x);
    const tileY = Math.floor(actor.y);
    switch (actor.kind) {
      case "guard":
      case "mutant":
      case "officer":
        this.PlaceItemType("bo_clip2", tileX, tileY);
        break;
      case "ss":
        this.PlaceItemType(this.gamestate.bestweapon < WP_MACHINEGUN ? "bo_machinegun" : "bo_clip2", tileX, tileY);
        break;
      case "boss":
      case "gretel":
        this.PlaceItemType("bo_key1", tileX, tileY);
        break;
      default:
        break;
    }
  }

  private PlaceItemType(item: keyof typeof DROPPED_ITEM_TYPES, x: number, y: number): void {
    const type = DROPPED_ITEM_TYPES[item];
    this.map.statics.push(staticFromStaticType(type, x, y));
  }

  private StartDeathState(actor: PortActor): void {
    const sequence = ACTOR_DEATH_STATES[actor.kind];
    if (!sequence) {
      actor.mode = "dead";
      actor.stateName = "s_grddie4";
      actor.stateIndex = 0;
      actor.stateShapenum = ACTOR_SPRITES.GRD_DEAD;
      actor.stateTics = 0;
      return;
    }

    this.NewActorState(actor, sequence, 0);
  }

  private FirstSighting(actor: PortActor): void {
    actor.attackMode = true;
    this.StartChaseState(actor);
  }

  private StartChaseState(actor: PortActor, carry = 0): void {
    const sequence = ACTOR_CHASE_STATES[actor.kind];
    if (!sequence) {
      return;
    }

    this.SetActorSequenceState(actor, sequence, 0, "chase", carry);
  }

  private StartPainState(actor: PortActor): void {
    const painStates = ACTOR_PAIN_STATES[actor.kind];
    if (!painStates) {
      return;
    }

    const stateIndex = actor.hitpoints & 1 ? 0 : 1;
    const frame = painStates[stateIndex];
    actor.mode = "pain";
    actor.stateIndex = stateIndex;
    actor.stateName = frame.name;
    actor.stateShapenum = frame.shapenum;
    actor.stateTics = frame.tics;
  }

  private NewActorState(actor: PortActor, sequence: ActorStateFrame[], index: number, carry = 0): void {
    this.SetActorSequenceState(actor, sequence, index, "dying", carry);
  }

  private SetActorSequenceState(
    actor: PortActor,
    sequence: ActorStateFrame[],
    index: number,
    mode: PortActor["mode"],
    carry = 0
  ): void {
    const frame = sequence[index] ?? sequence[sequence.length - 1];
    if (!frame) {
      return;
    }

    actor.mode = frame.final ? "dead" : mode;
    actor.stateIndex = index;
    actor.stateName = frame.name;
    actor.stateShapenum = frame.shapenum;
    actor.stateTics = frame.final || frame.tics === 0 ? Math.max(0, frame.tics + carry) : frame.tics + carry;
  }

  private DoorOpen(door: PortDoor, tics: number): void {
    door.ticcount += tics;
    if (door.ticcount >= OPENTICS) {
      this.CloseDoor(door);
    }
  }

  private DoorOpening(door: PortDoor, tics: number): void {
    door.position += tics << DOOR_POSITION_RATE_SHIFT;
    if (door.position >= DOOR_POSITION_MAX) {
      door.position = DOOR_POSITION_MAX;
      door.ticcount = 0;
      door.action = "open";
    }
  }

  private DoorClosing(door: PortDoor, tics: number): void {
    if (this.PlayerIntersectsDoor(door)) {
      this.OpenDoor(door);
      return;
    }

    door.position -= tics << DOOR_POSITION_RATE_SHIFT;
    if (door.position <= 0) {
      door.position = 0;
      door.action = "closed";
    }
  }

  private DoorAt(x: number, y: number): PortDoor | null {
    return this.map.doors.find((door) => door.x === x && door.y === y) ?? null;
  }

  private GetBonus(stat: PortStatic): boolean {
    if (stat.collected || !stat.bonus) {
      return false;
    }

    switch (stat.item) {
      case "bo_firstaid":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.HealSelf(25);
        break;
      case "bo_key1":
      case "bo_key2":
      case "bo_key3":
      case "bo_key4":
        this.GiveKey(keyNumberForBonus(stat.item));
        break;
      case "bo_cross":
      case "bo_chalice":
      case "bo_bible":
      case "bo_crown":
        this.GivePoints(treasureScoreForBonus(stat.item));
        this.gamestate.treasurecount += 1;
        break;
      case "bo_clip":
        if (this.gamestate.ammo === MAX_AMMO) {
          return false;
        }
        this.GiveAmmo(8);
        break;
      case "bo_clip2":
        if (this.gamestate.ammo === MAX_AMMO) {
          return false;
        }
        this.GiveAmmo(4);
        break;
      case "bo_machinegun":
        this.GiveWeapon(WP_MACHINEGUN);
        break;
      case "bo_chaingun":
        this.GiveWeapon(WP_CHAINGUN);
        break;
      case "bo_fullheal":
        this.HealSelf(99);
        this.GiveAmmo(25);
        this.GiveExtraMan();
        this.gamestate.treasurecount += 1;
        break;
      case "bo_food":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.HealSelf(10);
        break;
      case "bo_alpo":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.HealSelf(4);
        break;
      case "bo_gibs":
        if (this.gamestate.health > 10) {
          return false;
        }
        this.HealSelf(1);
        break;
      default:
        return false;
    }

    stat.collected = true;
    return true;
  }

  private TryPickupBonusAt(tileX: number, tileY: number): void {
    const stat = this.map.statics.find(
      (candidate) => candidate.x === tileX && candidate.y === tileY && candidate.bonus && !candidate.collected
    );
    if (stat) {
      this.GetBonus(stat);
    }
  }

  private PlayerIntersectsDoor(door: PortDoor): boolean {
    return Math.floor(this.gamestate.x) === door.x && Math.floor(this.gamestate.y) === door.y;
  }

  private UseTarget(): { dir: "east" | "north" | "south" | "west"; x: number; y: number } {
    const angle = normalizeAngle(this.gamestate.angle);
    const tileX = Math.floor(this.gamestate.x);
    const tileY = Math.floor(this.gamestate.y);

    if (angle < Math.PI / 4 || angle > (Math.PI * 7) / 4) {
      return {
        dir: "east",
        x: tileX + 1,
        y: tileY
      };
    }

    if (angle < (Math.PI * 3) / 4) {
      return {
        dir: "north",
        x: tileX,
        y: tileY - 1
      };
    }

    if (angle < (Math.PI * 5) / 4) {
      return {
        dir: "west",
        x: tileX - 1,
        y: tileY
      };
    }

    return {
      dir: "south",
      x: tileX,
      y: tileY + 1
    };
  }
}

class WLDraw {
  constructor(
    private readonly id_vl: IDVL,
    private readonly id_pm: IDPM
  ) {}

  ThreeDRefresh(wl_game: WLGame): void {
    const image = this.id_vl.VL_BeginFrame();
    const fov = Math.PI / 3;
    const horizon = SCREEN_HEIGHT / 2;
    const wallDepths = new Float64Array(SCREEN_WIDTH);

    for (let y = 0; y < SCREEN_HEIGHT; y += 1) {
      const color: [number, number, number] = y < horizon ? [32, 41, 50] : [76, 67, 54];
      for (let x = 0; x < SCREEN_WIDTH; x += 1) {
        this.id_vl.VL_Plot(image, x, y, color[0], color[1], color[2]);
      }
    }

    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      const rayAngle = wl_game.gamestate.angle + (x / SCREEN_WIDTH - 0.5) * fov;
      const hit = this.CastRay(wl_game, rayAngle);
      const corrected = hit.distance * Math.cos(rayAngle - wl_game.gamestate.angle);
      wallDepths[x] = corrected;
      const wallHeight = Math.min(SCREEN_HEIGHT, Math.floor(SCREEN_HEIGHT / Math.max(0.08, corrected)));
      const y0 = Math.max(0, Math.floor(horizon - wallHeight / 2));
      const y1 = Math.min(SCREEN_HEIGHT - 1, Math.floor(horizon + wallHeight / 2));
      const shade = Math.max(48, Math.floor(196 - corrected * 24));
      const wallTexture =
        hit.type === "door" && hit.door
          ? this.id_pm.PM_GetDoorTexture(hit.door.lock, hit.door.vertical)
          : this.id_pm.PM_GetWallTexture(hit.tile, hit.side);
      const fallbackWall =
        hit.type === "door" && hit.door
          ? doorRgb(hit.door, shade / 255, hit.texture)
          : wallRgb(hit.tile, shade / 255, hit.side === 0 ? 0 : -24);
      const wallTop = horizon - wallHeight / 2;

      for (let y = y0; y <= y1; y += 1) {
        const textureIndex = sampleWallPixel(wallTexture, hit.texture, (y - wallTop) / Math.max(1, wallHeight));
        const wall = textureIndex === null ? fallbackWall : this.id_pm.PM_PaletteIndexRgb(textureIndex);
        this.id_vl.VL_Plot(image, x, y, wall[0], wall[1], wall[2]);
      }
    }

    this.DrawScaleds(image, wl_game, wallDepths, fov, horizon);
    this.DrawWeapon(image, wl_game.gamestate.weapon, wl_game.gamestate.weaponframe);
    this.id_vl.VL_Present(image);
  }

  private CastRay(wl_game: WLGame, angle: number): RayHit {
    const step = 0.025;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const originX = wl_game.gamestate.x;
    const originY = wl_game.gamestate.y;

    for (let distance = 0; distance < 16; distance += step) {
      const x = originX + dirX * distance;
      const y = originY + dirY * distance;
      const tileX = Math.floor(x);
      const tileY = Math.floor(y);
      const door = wl_game.DoorAtTile(tileX, tileY);
      if (door) {
        const doorHit = this.CastDoorRay(door, originX, originY, dirX, dirY);
        if (doorHit) {
          return doorHit;
        }

        continue;
      }

      const tile = wl_game.GetWallTile(tileX, tileY);
      if (tile !== 0) {
        const side = Math.abs(dirX) > Math.abs(dirY) ? 0 : 1;
        return {
          distance,
          side,
          texture: side === 0 ? fractional(y) : fractional(x),
          tile,
          type: "wall"
        };
      }
    }

    return {
      distance: 16,
      side: 0,
      texture: 0,
      tile: 1,
      type: "wall"
    };
  }

  private CastDoorRay(
    door: PortDoor,
    originX: number,
    originY: number,
    dirX: number,
    dirY: number
  ): RayHit | null {
    if (door.action === "open") {
      return null;
    }

    const openFraction = door.position / (DOOR_POSITION_MAX + 1);
    if (door.vertical) {
      if (Math.abs(dirX) < 0.0001) {
        return null;
      }

      const hitDistance = (door.x + 0.5 - originX) / dirX;
      const localY = originY + dirY * hitDistance - door.y;
      if (hitDistance < 0 || localY < 0 || localY >= 1 || localY < openFraction) {
        return null;
      }

      return {
        distance: hitDistance,
        door,
        side: 2,
        texture: localY - openFraction,
        tile: door.tile,
        type: "door"
      };
    }

    if (Math.abs(dirY) < 0.0001) {
      return null;
    }

    const hitDistance = (door.y + 0.5 - originY) / dirY;
    const localX = originX + dirX * hitDistance - door.x;
    if (hitDistance < 0 || localX < 0 || localX >= 1 || localX < openFraction) {
      return null;
    }

    return {
      distance: hitDistance,
      door,
      side: 2,
      texture: localX - openFraction,
      tile: door.tile,
      type: "door"
    };
  }

  private DrawScaleds(
    image: ImageData,
    wl_game: WLGame,
    wallDepths: Float64Array,
    fov: number,
    horizon: number
  ): void {
    const sprites: SpriteBillboard[] = [];
    for (const stat of wl_game.map.statics) {
      if (stat.collected) {
        continue;
      }

      const sprite = this.TransformSprite(
        wl_game,
        stat.x + 0.5,
        stat.y + 0.5,
        fov,
        horizon,
        staticRgb(stat),
        this.id_pm.PM_GetSpritePageInfo(stat.shapenum)?.width ?? 64,
        this.id_pm.PM_GetSpriteBitmap(stat.shapenum)
      );
      if (sprite) {
        sprites.push(sprite);
      }
    }

    for (const actor of wl_game.map.actors) {
      const actorSprite = actorSpriteDescriptor(actor, wl_game.gamestate.angle);
      const actorSpriteInfo = actorSprite ? this.id_pm.PM_GetSpritePageInfo(actorSprite.shapenum) : null;
      const sprite = this.TransformSprite(
        wl_game,
        actor.x + 0.5,
        actor.y + 0.5,
        fov,
        horizon,
        actorRgb(actor),
        actorSpriteInfo?.width ?? 64,
        actorSprite ? this.id_pm.PM_GetSpriteBitmap(actorSprite.shapenum) : null
      );
      if (sprite) {
        sprites.push(sprite);
      }
    }

    sprites.sort((left, right) => right.depth - left.depth);
    for (const sprite of sprites) {
      this.DrawSpriteBillboard(image, sprite, wallDepths);
    }
  }

  private TransformSprite(
    wl_game: WLGame,
    worldX: number,
    worldY: number,
    fov: number,
    horizon: number,
    color: [number, number, number],
    sourceWidth: number,
    bitmap: SpriteBitmap | null
  ): SpriteBillboard | null {
    const dx = worldX - wl_game.gamestate.x;
    const dy = worldY - wl_game.gamestate.y;
    const forwardX = Math.cos(wl_game.gamestate.angle);
    const forwardY = Math.sin(wl_game.gamestate.angle);
    const rightX = -forwardY;
    const rightY = forwardX;
    const depth = dx * forwardX + dy * forwardY;
    if (depth <= 0.18) {
      return null;
    }

    const side = dx * rightX + dy * rightY;
    const projectionScale = SCREEN_WIDTH / (2 * Math.tan(fov / 2));
    const screenX = SCREEN_WIDTH / 2 + (side / depth) * projectionScale;
    const height = Math.max(2, Math.min(SCREEN_HEIGHT * 2, Math.floor((SCREEN_HEIGHT * 0.92) / depth)));
    const width = Math.max(2, Math.floor(height * Math.max(0.25, sourceWidth / 64)));
    const x0 = Math.max(0, Math.floor(screenX - width / 2));
    const x1 = Math.min(SCREEN_WIDTH - 1, Math.floor(screenX + width / 2));
    if (x1 < 0 || x0 >= SCREEN_WIDTH) {
      return null;
    }

    const y0 = Math.max(0, Math.floor(horizon - height / 2));
    const y1 = Math.min(SCREEN_HEIGHT - 1, Math.floor(horizon + height / 2));
    if (y1 < 0 || y0 >= SCREEN_HEIGHT) {
      return null;
    }

    return {
      bitmap,
      color,
      depth,
      height,
      sourceWidth,
      screenX,
      width,
      x0,
      x1,
      y0,
      y1
    };
  }

  private DrawSpriteBillboard(image: ImageData, sprite: SpriteBillboard, wallDepths: Float64Array): void {
    const shade = Math.max(0.35, Math.min(1, 1.2 - sprite.depth * 0.09));
    for (let x = sprite.x0; x <= sprite.x1; x += 1) {
      const wallDepth = wallDepths[x] ?? 0;
      if (sprite.depth >= wallDepth) {
        continue;
      }

      const u = (x - (sprite.screenX - sprite.width / 2)) / Math.max(1, sprite.width);
      for (let y = sprite.y0; y <= sprite.y1; y += 1) {
        const v = (y - (SCREEN_HEIGHT / 2 - sprite.height / 2)) / Math.max(1, sprite.height);
        const source = sampleSpritePixel(sprite, u, v);
        if (!source.visible) {
          continue;
        }

        const color = source.index === null ? sprite.color : this.id_pm.PM_PaletteIndexRgb(source.index);
        const pixelShade = source.index === null ? shade : 1;

        this.id_vl.VL_Plot(
          image,
          x,
          y,
          clampByte(color[0] * pixelShade),
          clampByte(color[1] * pixelShade),
          clampByte(color[2] * pixelShade)
        );
      }
    }
  }

  private DrawWeapon(image: ImageData, weapon: number, weaponframe: number): void {
    const readySprite = WEAPON_READY_SPRITES[weapon];
    if (readySprite === undefined) {
      return;
    }

    const shapenum = readySprite + weaponframe;
    const bitmap = this.id_pm.PM_GetSpriteBitmap(shapenum);
    if (!bitmap) {
      this.DrawProceduralWeapon(image);
      return;
    }

    this.DrawSimpleScaledShape(image, bitmap, SCREEN_WIDTH / 2, SCREEN_HEIGHT + 1);
  }

  private DrawSimpleScaledShape(image: ImageData, bitmap: SpriteBitmap, xcenter: number, height: number): void {
    const width = height;
    const left = Math.floor(xcenter - width / 2);
    const top = Math.floor(SCREEN_HEIGHT / 2 - height / 2);
    const right = Math.min(SCREEN_WIDTH - 1, Math.ceil(left + width));
    const bottom = Math.min(SCREEN_HEIGHT - 1, Math.ceil(top + height));

    for (let x = Math.max(0, left); x <= right; x += 1) {
      const u = (x - left) / Math.max(1, width);
      for (let y = Math.max(0, top); y <= bottom; y += 1) {
        const v = (y - top) / Math.max(1, height);
        const sourceX = Math.max(0, Math.min(63, Math.floor(u * 64)));
        const sourceY = Math.max(0, Math.min(63, Math.floor(v * 64)));
        const sourceIndex = sourceY * 64 + sourceX;
        if (!bitmap.mask[sourceIndex]) {
          continue;
        }

        const color = this.id_pm.PM_PaletteIndexRgb(bitmap.pixels[sourceIndex] ?? 0);
        this.id_vl.VL_Plot(image, x, y, color[0], color[1], color[2]);
      }
    }
  }

  private DrawProceduralWeapon(image: ImageData): void {
    for (let y = 156; y < SCREEN_HEIGHT; y += 1) {
      for (let x = 132; x < 188; x += 1) {
        const grip = x > 148 && x < 172 && y > 170;
        this.id_vl.VL_Plot(image, x, y, grip ? 42 : 118, grip ? 38 : 112, grip ? 34 : 96);
      }
    }
  }
}

class IDVL {
  private readonly context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    this.context = context;
  }

  VL_BeginFrame(): ImageData {
    return this.context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  VL_Plot(image: ImageData, x: number, y: number, red: number, green: number, blue: number): void {
    const index = (y * SCREEN_WIDTH + x) * 4;
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = 255;
  }

  VL_Present(image: ImageData): void {
    this.context.putImageData(image, 0, 0);
  }

  VL_ScreenToBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG export failed."));
        }
      }, "image/png");
    });
  }
}

class IDSD {
  readonly sampleRate = 44100;
  sampleCount = 0;
  private readonly chunks: Float32Array[] = [];
  private phase = 0;

  SD_Service(active: boolean, ticMs: number): void {
    const count = Math.max(1, Math.floor((this.sampleRate * ticMs) / 1000));
    const samples = new Float32Array(count);
    const frequency = active ? 132 : 0;

    for (let index = 0; index < count; index += 1) {
      if (frequency > 0) {
        samples[index] = Math.sin(this.phase) * 0.08;
        this.phase += (Math.PI * 2 * frequency) / this.sampleRate;
      }
    }

    this.chunks.push(samples);
    this.sampleCount += samples.length;
    while (this.sampleCount > this.sampleRate * 120 && this.chunks.length > 0) {
      const removed = this.chunks.shift();
      this.sampleCount -= removed?.length ?? 0;
    }
  }

  SD_StopDigitized(): void {
    this.chunks.length = 0;
    this.phase = 0;
    this.sampleCount = 0;
  }

  SD_ExportWav(): Uint8Array {
    const samples = new Float32Array(this.sampleCount);
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    return encodeWav(samples, this.sampleRate);
  }
}

class IDPM {
  private chunksInFile = 0;
  private paletteRgb = createFallbackPalette();
  private paletteSource: PaletteSource = "fallback";
  private pageBytes: Uint8Array | null = null;
  private readonly pages: PageInfo[] = [];
  private readonly spriteBitmaps = new Map<number, SpriteBitmap>();
  private readonly sprites = new Map<number, SpritePageInfo>();
  private readonly textureBitmaps = new Map<number, TextureBitmap>();
  private spriteStart = 0;
  private soundStart = 0;

  async PM_Startup(): Promise<{
    chunksInFile: number;
    firstSpriteVisiblePixels: number;
    paletteSource: PaletteSource;
    soundStart: number;
    spriteCount: number;
    spriteStart: number;
    textureCount: number;
  }> {
    const [bytes, paletteStatus] = await Promise.all([
      fetchBytes("/__source-typescript/asset/VSWAP.WL6"),
      this.LoadGamePalette()
    ]);
    this.pageBytes = bytes;
    this.paletteRgb = paletteStatus.paletteRgb;
    this.paletteSource = paletteStatus.source;
    this.chunksInFile = readUint16LE(bytes, 0);
    this.spriteStart = readUint16LE(bytes, 2);
    this.soundStart = readUint16LE(bytes, 4);
    this.pages.length = 0;
    this.spriteBitmaps.clear();
    this.sprites.clear();
    this.textureBitmaps.clear();

    const offsetsStart = 6;
    const lengthsStart = offsetsStart + this.chunksInFile * 4;
    for (let index = 0; index < this.chunksInFile; index += 1) {
      const offset = readUint32LE(bytes, offsetsStart + index * 4);
      const length = readUint16LE(bytes, lengthsStart + index * 2);
      const kind: PageKind =
        index < this.spriteStart ? "texture" : index < this.soundStart ? "sprite" : "sound";
      const page = {
        index,
        kind,
        length,
        offset
      };
      this.pages.push(page);

      if (kind === "texture") {
        const texture = this.DecodeTexturePage(index, page);
        if (texture) {
          this.textureBitmaps.set(index, texture.bitmap);
        }
      } else if (kind === "sprite") {
        const sprite = this.DecodeSpritePage(index, page);
        if (sprite) {
          this.sprites.set(sprite.info.shapenum, sprite.info);
          this.spriteBitmaps.set(sprite.info.shapenum, sprite.bitmap);
        }
      }
    }

    return {
      chunksInFile: this.chunksInFile,
      firstSpriteVisiblePixels: this.sprites.get(0)?.visiblePixels ?? 0,
      paletteSource: this.paletteSource,
      soundStart: this.soundStart,
      spriteCount: this.sprites.size,
      spriteStart: this.spriteStart,
      textureCount: this.textureBitmaps.size
    };
  }

  PM_GetPage(pagenum: number): Uint8Array | null {
    const page = this.pages[pagenum];
    if (!page || !this.pageBytes || page.offset === 0 || page.length === 0) {
      return null;
    }

    return this.pageBytes.subarray(page.offset, page.offset + page.length);
  }

  PM_GetSpritePageInfo(shapenum: number): SpritePageInfo | null {
    return this.sprites.get(shapenum) ?? null;
  }

  PM_GetSpriteBitmap(shapenum: number): SpriteBitmap | null {
    return this.spriteBitmaps.get(shapenum) ?? null;
  }

  PM_GetWallTexture(tile: number, side: number): TextureBitmap | null {
    const wallTile = tile & 0x3f;
    if (wallTile <= 0) {
      return null;
    }

    // WL_MAIN.C SetupWalls maps tile i to horiz=(i-1)*2 and vert=(i-1)*2+1.
    const pageIndex = (wallTile - 1) * 2 + (side === 0 ? 1 : 0);
    return this.textureBitmaps.get(pageIndex) ?? null;
  }

  PM_GetDoorTexture(lock: number, vertical: boolean): TextureBitmap | null {
    // WL_DRAW.C defines DOORWALL as the final eight texture pages before sprites.
    let pageIndex = this.spriteStart - 8;
    if (lock > 0 && lock < 5) {
      pageIndex += 6;
    } else if (lock === 5) {
      pageIndex += 4;
    }

    if (vertical) {
      pageIndex += 1;
    }

    return this.textureBitmaps.get(pageIndex) ?? null;
  }

  PM_PaletteIndexRgb(index: number): [number, number, number] {
    return paletteIndexRgb(index, this.paletteRgb);
  }

  StateSnapshot(): Record<string, unknown> {
    return {
      chunksInFile: this.chunksInFile,
      decodedSprites: this.sprites.size,
      decodedTextures: this.textureBitmaps.size,
      firstSprite: this.sprites.get(0) ?? null,
      paletteSource: this.paletteSource,
      soundStart: this.soundStart,
      spriteStart: this.spriteStart,
      textures: this.pages.filter((page) => page.kind === "texture" && page.length > 0).length
    };
  }

  private DecodeTexturePage(_pageIndex: number, page: PageInfo): DecodedTexturePage | null {
    const bytes = this.PM_GetPage(page.index);
    if (!bytes || page.length < 64 * 64 || bytes.length < 64 * 64) {
      return null;
    }

    return {
      bitmap: {
        pixels: bytes.subarray(0, 64 * 64)
      }
    };
  }

  private DecodeSpritePage(pageIndex: number, page: PageInfo): DecodedSpritePage | null {
    const bytes = this.PM_GetPage(pageIndex);
    if (!bytes || bytes.length < 4 + 64 * 2) {
      return null;
    }

    const leftpix = readUint16LE(bytes, 0);
    const rightpix = readUint16LE(bytes, 2);
    if (leftpix > rightpix || rightpix >= 64) {
      return null;
    }

    const mask = new Uint8Array(64 * 64);
    const pixels = new Uint8Array(64 * 64);
    let columnOffsetCount = 0;
    let visiblePixels = 0;
    for (let column = leftpix; column <= rightpix; column += 1) {
      let dataOffset = readUint16LE(bytes, 4 + (column - leftpix) * 2);
      if (dataOffset <= 0 || dataOffset >= page.length) {
        continue;
      }

      columnOffsetCount += 1;
      let guard = 0;
      while (dataOffset + 6 <= page.length && guard < 64) {
        guard += 1;
        const endWord = readUint16LE(bytes, dataOffset);
        if (endWord === 0) {
          break;
        }

        const top = signed16(readUint16LE(bytes, dataOffset + 2));
        const start = Math.floor(readUint16LE(bytes, dataOffset + 4) / 2);
        const end = Math.floor(endWord / 2);
        dataOffset += 6;

        for (let y = Math.max(0, start); y < Math.min(64, end); y += 1) {
          const sourceIndex = top + y;
          if (sourceIndex < 0 || sourceIndex >= bytes.length) {
            continue;
          }

          const targetIndex = y * 64 + column;
          if (!mask[targetIndex]) {
            visiblePixels += 1;
          }

          mask[targetIndex] = 1;
          pixels[targetIndex] = bytes[sourceIndex] ?? 0;
        }
      }
    }

    return {
      bitmap: {
        mask,
        pixels
      },
      info: {
        columnOffsetCount,
        height: 64,
        leftpix,
        page: pageIndex,
        rightpix,
        shapenum: pageIndex - this.spriteStart,
        visiblePixels,
        width: rightpix - leftpix + 1
      }
    };
  }

  private async LoadGamePalette(): Promise<{ paletteRgb: Uint8Array; source: PaletteSource }> {
    try {
      const bytes = await fetchBytes("/__source-typescript/source/OBJ/GAMEPAL.OBJ");
      const paletteRgb = decodeGamePaletteObject(bytes);
      if (paletteRgb) {
        return {
          paletteRgb,
          source: "GAMEPAL.OBJ"
        };
      }
    } catch {
      // Keep the port usable when running outside the Vite source-file route.
    }

    return {
      paletteRgb: createFallbackPalette(),
      source: "fallback"
    };
  }
}

class IDCA {
  currentMap: WolfMap | null = null;

  async CacheStartup(): Promise<SourceTypescriptStatus> {
    const response = await fetch("/__source-typescript/status");
    if (!response.ok) {
      throw new Error(`Status returned ${response.status}`);
    }

    return (await response.json()) as SourceTypescriptStatus;
  }

  async CA_CacheMap(mapIndex: number): Promise<WolfMap> {
    const [mapHeadBytes, gameMapsBytes] = await Promise.all([
      fetchBytes("/__source-typescript/asset/MAPHEAD.WL6"),
      fetchBytes("/__source-typescript/asset/GAMEMAPS.WL6")
    ]);

    this.currentMap = parseWolfMap(mapHeadBytes, gameMapsBytes, mapIndex);
    return this.currentMap;
  }
}

class IDIN {
  private readonly keys = new Set<number>();
  private pendingUse = false;

  IN_KeyDown(keyCode: number): boolean {
    return this.keys.has(keyCode);
  }

  IN_AttackDown(): boolean {
    return this.IN_KeyDown(ATTACK_KEY_CODE);
  }

  ConsumeUse(): boolean {
    const use = this.pendingUse;
    this.pendingUse = false;
    return use;
  }

  KeyDown(keyCode: number): void {
    if (keyCode === USE_KEY_CODE && !this.keys.has(keyCode)) {
      this.pendingUse = true;
    }

    this.keys.add(keyCode);
  }

  KeyUp(keyCode: number): void {
    this.keys.delete(keyCode);
  }
}

class IDUS {
  readonly lines: string[] = [];

  US_Print(line: string): void {
    this.lines.push(`${new Date().toLocaleTimeString()} ${line}`);
  }
}

startSourceTypescriptApp();

function startSourceTypescriptApp(): void {
  const demoPlan = readDemoPlan();
  const wlMain = new WLMain(screen, demoPlan);

  (window as Window & {
    wolf3dTypeScriptHarness?: {
      exportPng: () => Promise<void>;
      exportState: () => Promise<void>;
      exportWav: () => Promise<void>;
      operateDoor: (index?: number) => void;
      reset: () => void;
      runDemo: () => Promise<void>;
      state: () => Record<string, unknown>;
    };
  }).wolf3dTypeScriptHarness = {
    exportPng: () => wlMain.ExportPng("harness", false),
    exportState: () => wlMain.ExportState("harness", false),
    exportWav: () => wlMain.ExportWav("harness", false),
    operateDoor: (index = 0) => wlMain.wl_game.OperateDoor(index),
    reset: () => wlMain.ResetGame(),
    runDemo: () => wlMain.RunDemoPlan(),
    state: () => wlMain.StateSnapshot()
  };

  buttonReset.addEventListener("click", () => {
    wlMain.ResetGame();
  });

  buttonTick.addEventListener("click", () => {
    wlMain.Tick(1000 / 60);
  });

  buttonRunDemo.addEventListener("click", () => {
    void wlMain.RunDemoPlan();
  });

  buttonExportPng.addEventListener("click", () => {
    void wlMain.ExportPng("manual");
  });

  buttonExportWav.addEventListener("click", () => {
    void wlMain.ExportWav("manual");
  });

  buttonExportState.addEventListener("click", () => {
    void wlMain.ExportState("manual");
  });

  window.addEventListener("keydown", (event) => {
    wlMain.id_in.KeyDown(event.keyCode);
  });

  window.addEventListener("keyup", (event) => {
    wlMain.id_in.KeyUp(event.keyCode);
  });

  classGrid.replaceChildren(
    ...["WLMain", "WLGame", "WLPlay", "WLDraw", "IDCA", "IDIN", "IDPM", "IDSD", "IDUS", "IDVL"].map((name) => {
      const span = document.createElement("span");
      span.textContent = name;
      return span;
    })
  );

  void wlMain.StartGame();
  if (demoPlan && demoPlan.autoStart !== false) {
    window.setTimeout(() => {
      void wlMain.RunDemoPlan();
    }, 500);
  }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0)
    | ((bytes[offset + 1] ?? 0) << 8)
    | ((bytes[offset + 2] ?? 0) << 16)
    | ((bytes[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

function signed16(value: number): number {
  return value & 0x8000 ? value - 0x10000 : value;
}

function renderSourceStatus(status: SourceTypescriptStatus): void {
  const presentAssets = status.assets.filter((asset) => asset.present).length;
  sourceCount.textContent = `${status.sourceCounts.c} C / ${status.sourceCounts.asm} ASM / ${status.sourceCounts.h} H`;
  assetCount.textContent = `${presentAssets}/${status.assets.length} WL6`;
}

function createFallbackMap(): PortMap {
  const rows = [
    "111111111111",
    "100000000001",
    "101110111101",
    "100010100001",
    "111010101111",
    "100010100001",
    "101110111101",
    "100000000001",
    "101011110101",
    "100000000001",
    "100001000001",
    "111111111111"
  ];
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  const walls = new Uint16Array(width * height);
  const objects = new Uint16Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const row = rows[y] ?? "";
    for (let x = 0; x < width; x += 1) {
      walls[y * width + x] = row[x] === "0" ? 0 : 1;
    }
  }

  return {
    actors: [],
    blockingStaticKeys: new Set(),
    doors: [],
    height,
    killTotal: 0,
    name: "fallback scaffold",
    objects,
    secretTotal: 0,
    source: "fallback",
    statics: [],
    treasureTotal: 0,
    walls,
    width
  };
}

function scanWallPlaneForDoors(map: WolfMap): PortDoor[] {
  const doors: PortDoor[] = [];
  const { width, height } = map.header;
  const walls = map.planes[0];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = walls[y * width + x] ?? 0;
      if (tile < 90 || tile > 101) {
        continue;
      }

      const vertical = tile % 2 === 0;
      doors.push({
        action: "closed",
        index: doors.length,
        lock: vertical ? (tile - 90) / 2 : (tile - 91) / 2,
        position: 0,
        ticcount: 0,
        tile,
        vertical,
        x,
        y
      });
    }
  }

  return doors;
}

function scanInfoPlane(map: WolfMap, difficulty: "easy" | "medium" | "hard"): ScanInfoPlaneResult {
  const statics: PortStatic[] = [];
  const actors: PortActor[] = [];
  let secretTotal = 0;
  let treasureTotal = 0;
  let spawn: PlayerSpawn | null = null;
  const { width, height } = map.header;
  const info = map.planes[1];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = info[y * width + x] ?? 0;
      if (tile === 0) {
        continue;
      }

      if (tile >= 19 && tile <= 22) {
        spawn = {
          angle: spawnAngleForInfoTile(tile),
          tile,
          x: x + 0.5,
          y: y + 0.5
        };
        continue;
      }

      if (tile >= 23 && tile <= 74) {
        const stat = staticFromInfoTile(tile, x, y);
        statics.push(stat);
        if (stat.treasure) {
          treasureTotal += 1;
        }
        continue;
      }

      if (tile === PUSHABLETILE) {
        secretTotal += 1;
        continue;
      }

      const actor = actorFromInfoTile(tile, x, y, difficulty);
      if (actor) {
        actors.push(actor);
      }
    }
  }

  return {
    actors,
    killTotal: actors.filter((actor) => actor.mode !== "ghost" && actor.mode !== "dead").length,
    secretTotal,
    spawn,
    statics,
    treasureTotal
  };
}

function pathFrames(prefix: string, walkSprites: [number, number, number, number]): ActorStateFrame[] {
  return walkFrames(prefix, "path", walkSprites, [20, 5, 15, 20, 5, 15]);
}

function chaseFrames(
  prefix: string,
  walkSprites: [number, number, number, number],
  tics: [number, number, number, number, number, number] = [10, 3, 8, 10, 3, 8]
): ActorStateFrame[] {
  return walkFrames(prefix, "chase", walkSprites, tics);
}

function walkFrames(
  prefix: string,
  stateKind: "chase" | "path",
  [w1, w2, w3, w4]: [number, number, number, number],
  [t1, t1s, t2, t3, t3s, t4]: [number, number, number, number, number, number]
): ActorStateFrame[] {
  return [
    { name: `s_${prefix}${stateKind}1`, shapenum: w1, tics: t1 },
    { name: `s_${prefix}${stateKind}1s`, shapenum: w1, tics: t1s },
    { name: `s_${prefix}${stateKind}2`, shapenum: w2, tics: t2 },
    { name: `s_${prefix}${stateKind}3`, shapenum: w3, tics: t3 },
    { name: `s_${prefix}${stateKind}3s`, shapenum: w3, tics: t3s },
    { name: `s_${prefix}${stateKind}4`, shapenum: w4, tics: t4 }
  ];
}

function deathFrames(frames: Array<[string, number, number, boolean?]>): ActorStateFrame[] {
  return frames.map(([name, shapenum, tics, final]) => {
    const frame: ActorStateFrame = {
      name,
      shapenum,
      tics
    };
    if (final) {
      frame.final = true;
    }

    return frame;
  });
}

function initialActorState(
  kind: string,
  mode: PortActor["mode"],
  shapenum: number | null = null
): Pick<PortActor, "stateIndex" | "stateName" | "stateShapenum" | "stateTics"> {
  const sequence = mode === "patrol" ? ACTOR_PATROL_STATES[kind] : mode === "chase" ? ACTOR_CHASE_STATES[kind] : null;
  const firstFrame = sequence?.[0];
  if (firstFrame) {
    return {
      stateIndex: 0,
      stateName: firstFrame.name,
      stateShapenum: firstFrame.shapenum,
      stateTics: firstFrame.tics
    };
  }

  const prefix = actorStatePrefix(kind);
  const stateName =
    mode === "dead"
      ? "s_grddie4"
      : mode === "ghost"
        ? `s_${prefix}chase1`
        : mode === "patrol"
          ? `s_${prefix}path1`
          : `s_${prefix}stand`;

  return {
    stateIndex: 0,
    stateName,
    stateShapenum: shapenum,
    stateTics: 0
  };
}

function initialActorMovement(
  kind: string,
  mode: PortActor["mode"],
  dir: number,
  x: number,
  y: number
): Pick<PortActor, "distance" | "speed" | "targetX" | "targetY"> {
  const speed = actorBaseSpeed(kind);
  if (mode === "patrol") {
    const delta = DIRECTION_DELTAS[dir];
    return {
      distance: TILE_DISTANCE,
      speed,
      targetX: x + (delta?.dx ?? 0),
      targetY: y + (delta?.dy ?? 0)
    };
  }

  return {
    distance: 0,
    speed,
    targetX: x,
    targetY: y
  };
}

function actorBaseSpeed(kind: string): number {
  return kind === "dog" ? SPDDOG : SPDPATROL;
}

function mapDirectionToSourceDir(direction: number): number {
  return direction * 2;
}

function bossInitialDirection(kind: string): number {
  switch (kind) {
    case "boss":
      return 6;
    case "gretel":
    case "hitler":
      return 2;
    default:
      return NODIR;
  }
}

function actorStatePrefix(kind: string): string {
  switch (kind) {
    case "fake_hitler":
      return "fake";
    case "guard":
      return "grd";
    case "hitler":
      return "mecha";
    case "mutant":
      return "mut";
    case "officer":
      return "ofc";
    default:
      return kind;
  }
}

function staticFromInfoTile(tile: number, x: number, y: number): PortStatic {
  return staticFromStaticType(tile - 23, x, y);
}

function staticFromStaticType(type: number, x: number, y: number): PortStatic {
  const statType = STATIC_INFO_TYPES[type] ?? "dressing";

  return {
    blocking: statType === "block",
    bonus: statType.startsWith("bo_"),
    collected: false,
    item: statType,
    shapenum: statShapenumForType(type, statType),
    treasure: TREASURE_STAT_TYPES.has(statType),
    type,
    x,
    y
  };
}

function actorFromInfoTile(
  tile: number,
  x: number,
  y: number,
  difficulty: "easy" | "medium" | "hard"
): PortActor | null {
  if (tile === 124) {
    return {
      attackMode: false,
      dir: NODIR,
      hitpoints: 0,
      kind: "dead_guard",
      mode: "dead",
      shootable: false,
      ...initialActorState("dead_guard", "dead", ACTOR_SPRITES.GRD_DEAD),
      ...initialActorMovement("dead_guard", "dead", NODIR, x, y),
      tile,
      x,
      y
    };
  }

  const guard = directionalEnemy(tile, difficulty, "guard", 108, 144, 180, "stand")
    ?? directionalEnemy(tile, difficulty, "guard", 112, 148, 184, "patrol")
    ?? directionalEnemy(tile, difficulty, "officer", 116, 152, 188, "stand")
    ?? directionalEnemy(tile, difficulty, "officer", 120, 156, 192, "patrol")
    ?? directionalEnemy(tile, difficulty, "ss", 126, 162, 198, "stand")
    ?? directionalEnemy(tile, difficulty, "ss", 130, 166, 202, "patrol")
    ?? directionalEnemy(tile, difficulty, "dog", 134, 170, 206, "stand")
    ?? directionalEnemy(tile, difficulty, "dog", 138, 174, 210, "patrol")
    ?? directionalEnemy(tile, difficulty, "mutant", 216, 234, 252, "stand")
    ?? directionalEnemy(tile, difficulty, "mutant", 220, 238, 256, "patrol");
  if (guard) {
    return {
      ...guard,
      attackMode: false,
      hitpoints: actorHitpoints(guard.kind, difficulty),
      shootable: true,
      ...initialActorState(guard.kind, guard.mode),
      ...initialActorMovement(guard.kind, guard.mode, guard.dir, x, y),
      x,
      y
    };
  }

  const bossKind = BOSS_INFO_TILES[tile];
  if (bossKind) {
    const dir = bossInitialDirection(bossKind);
    return {
      attackMode: false,
      dir,
      hitpoints: actorHitpoints(bossKind, difficulty),
      kind: bossKind,
      mode: "boss",
      shootable: true,
      ...initialActorState(bossKind, "boss"),
      ...initialActorMovement(bossKind, "boss", dir, x, y),
      tile,
      x,
      y
    };
  }

  const ghostKind = GHOST_INFO_TILES[tile];
  if (ghostKind) {
    return {
      attackMode: false,
      dir: NODIR,
      hitpoints: actorHitpoints(ghostKind, difficulty),
      kind: ghostKind,
      mode: "ghost",
      shootable: false,
      ...initialActorState(ghostKind, "ghost"),
      ...initialActorMovement(ghostKind, "ghost", NODIR, x, y),
      tile,
      x,
      y
    };
  }

  return null;
}

function directionalEnemy(
  tile: number,
  difficulty: "easy" | "medium" | "hard",
  kind: string,
  easyBase: number,
  mediumBase: number,
  hardBase: number,
  mode: "patrol" | "stand"
): Pick<PortActor, "dir" | "kind" | "mode" | "tile"> | null {
  if (tile >= hardBase && tile <= hardBase + 3) {
    if (difficultyRank(difficulty) < difficultyRank("hard")) {
      return null;
    }

    return {
      dir: mapDirectionToSourceDir(tile - hardBase),
      kind,
      mode,
      tile
    };
  }

  if (tile >= mediumBase && tile <= mediumBase + 3) {
    if (difficultyRank(difficulty) < difficultyRank("medium")) {
      return null;
    }

    return {
      dir: mapDirectionToSourceDir(tile - mediumBase),
      kind,
      mode,
      tile
    };
  }

  if (tile >= easyBase && tile <= easyBase + 3) {
    return {
      dir: mapDirectionToSourceDir(tile - easyBase),
      kind,
      mode,
      tile
    };
  }

  return null;
}

function difficultyRank(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0;
}

function hitpointRowForDifficulty(difficulty: "easy" | "medium" | "hard"): 1 | 2 | 3 {
  return difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
}

function actorHitpoints(kind: string, difficulty: "easy" | "medium" | "hard"): number {
  const enemyIndex = ENEMY_HITPOINT_INDEX[kind] ?? 0;
  return START_HITPOINTS[hitpointRowForDifficulty(difficulty)][enemyIndex] ?? 25;
}

function actorKillScore(kind: string): number {
  switch (kind) {
    case "guard":
      return 100;
    case "dog":
      return 200;
    case "officer":
      return 400;
    case "ss":
      return 500;
    case "mutant":
      return 700;
    case "fake_hitler":
      return 2000;
    case "boss":
    case "fat":
    case "gift":
    case "gretel":
    case "hitler":
    case "schabbs":
      return 5000;
    default:
      return 0;
  }
}

function statShapenumForType(type: number, item: string): number {
  if (item === "bo_clip2") {
    return 28;
  }

  return type + 2;
}

function keyNumberForBonus(item: string): number {
  switch (item) {
    case "bo_key1":
      return 0;
    case "bo_key2":
      return 1;
    case "bo_key3":
      return 2;
    case "bo_key4":
      return 3;
    default:
      throw new Error(`Unsupported key bonus: ${item}`);
  }
}

function treasureScoreForBonus(item: string): number {
  switch (item) {
    case "bo_cross":
      return 100;
    case "bo_chalice":
      return 500;
    case "bo_bible":
      return 1000;
    case "bo_crown":
      return 5000;
    default:
      return 0;
  }
}

function staticRgb(stat: PortStatic): [number, number, number] {
  if (stat.bonus) {
    switch (stat.item) {
      case "bo_key1":
        return [238, 190, 70];
      case "bo_key2":
        return [190, 204, 220];
      case "bo_food":
      case "bo_alpo":
        return [174, 78, 54];
      case "bo_firstaid":
        return [232, 232, 226];
      case "bo_clip":
      case "bo_clip2":
        return [186, 148, 76];
      case "bo_machinegun":
      case "bo_chaingun":
        return [120, 130, 138];
      case "bo_cross":
      case "bo_chalice":
      case "bo_bible":
      case "bo_crown":
      case "bo_fullheal":
        return [218, 176, 70];
      default:
        return [170, 120, 84];
    }
  }

  if (stat.blocking) {
    return [92, 116, 96];
  }

  return [116, 102, 82];
}

function actorRgb(actor: PortActor): [number, number, number] {
  if (actor.mode === "dead" || actor.mode === "dying") {
    return [96, 60, 54];
  }

  if (actor.mode === "ghost") {
    return [150, 126, 182];
  }

  switch (actor.kind) {
    case "dog":
      return [120, 88, 58];
    case "officer":
      return [74, 94, 152];
    case "ss":
      return [58, 58, 66];
    case "mutant":
      return [122, 132, 110];
    default:
      return [92, 126, 78];
  }
}

function actorSpriteDescriptor(actor: PortActor, playerAngle: number): ActorSpriteDescriptor | null {
  if (actor.mode === "dead" || actor.mode === "dying") {
    return {
      rotate: false,
      shapenum: actor.stateShapenum ?? ACTOR_SPRITES.GRD_DEAD
    };
  }

  if (actor.mode === "pain") {
    return {
      rotate: false,
      shapenum: actor.stateShapenum ?? ACTOR_STAND_SPRITES[actor.kind] ?? ACTOR_SPRITES.GRD_S_1
    };
  }

  if (actor.mode === "ghost") {
    const shapenum = ACTOR_GHOST_SPRITES[actor.kind];
    return shapenum === undefined
      ? null
      : {
          rotate: false,
          shapenum
        };
  }

  if (actor.mode === "chase") {
    const base = actor.stateShapenum ?? ACTOR_PATROL_SPRITES[actor.kind] ?? ACTOR_BOSS_SPRITES[actor.kind];
    if (base === undefined) {
      return null;
    }

    return {
      rotate: ACTOR_ROTATING_KINDS.has(actor.kind),
      shapenum: ACTOR_ROTATING_KINDS.has(actor.kind) ? base + calcActorRotate(actor, playerAngle) : base
    };
  }

  if (actor.mode === "boss") {
    const shapenum = ACTOR_BOSS_SPRITES[actor.kind];
    return shapenum === undefined
      ? null
      : {
          rotate: false,
          shapenum
        };
  }

  const base =
    actor.mode === "patrol"
      ? actor.stateShapenum ?? ACTOR_PATROL_SPRITES[actor.kind]
      : ACTOR_STAND_SPRITES[actor.kind];
  if (base === undefined) {
    return null;
  }

  // WL_DRAW.C DrawScaleds adds CalcRotate() when the actor state has rotate=true.
  return {
    rotate: true,
    shapenum: base + calcActorRotate(actor, playerAngle)
  };
}

function calcActorRotate(actor: PortActor, playerAngle: number): number {
  const playerAngleDegrees = normalizeDegrees((-playerAngle * 180) / Math.PI);
  const dirType = Math.max(0, Math.min(8, actor.dir));
  const actorDirection = DIR_ANGLE_DEGREES[dirType] ?? 0;
  const rotateAngle = normalizeDegrees(playerAngleDegrees - 180 - actorDirection + 360 / 16);
  return Math.floor(rotateAngle / (360 / 8)) % 8;
}

function sampleWallPixel(texture: TextureBitmap | null, u: number, v: number): number | null {
  if (!texture || u < 0 || v < 0 || u > 1 || v > 1) {
    return null;
  }

  const sourceX = Math.max(0, Math.min(63, Math.floor(u * 64)));
  const sourceY = Math.max(0, Math.min(63, Math.floor(v * 64)));
  return texture.pixels[sourceX * 64 + sourceY] ?? null;
}

function sampleSpritePixel(sprite: SpriteBillboard, u: number, v: number): { index: number | null; visible: boolean } {
  if (sprite.bitmap) {
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return {
        index: null,
        visible: false
      };
    }

    const sourceX = Math.max(0, Math.min(63, Math.floor(u * 64)));
    const sourceY = Math.max(0, Math.min(63, Math.floor(v * 64)));
    const sourceIndex = sourceY * 64 + sourceX;
    if (!sprite.bitmap.mask[sourceIndex]) {
      return {
        index: null,
        visible: false
      };
    }

    return {
      index: sprite.bitmap.pixels[sourceIndex] ?? 0,
      visible: true
    };
  }

  return {
    index: null,
    visible: spriteMask(u, v)
  };
}

function paletteIndexRgb(index: number, paletteRgb: Uint8Array): [number, number, number] {
  const offset = (index & 0xff) * 3;
  return [paletteRgb[offset] ?? 0, paletteRgb[offset + 1] ?? 0, paletteRgb[offset + 2] ?? 0];
}

function decodeGamePaletteObject(bytes: Uint8Array): Uint8Array | null {
  let offset = 0;
  while (offset + 3 <= bytes.length) {
    const recordType = bytes[offset] ?? 0;
    const recordLength = readUint16LE(bytes, offset + 1);
    const recordDataLength = recordLength - 1;
    const recordDataStart = offset + 3;
    const nextRecord = offset + 3 + recordLength;
    if (recordLength <= 0 || nextRecord > bytes.length || recordDataLength < 0) {
      return null;
    }

    if (recordType === 0xa0 || recordType === 0xa1) {
      const data = bytes.subarray(recordDataStart, recordDataStart + recordDataLength);
      const segmentIndex = readOmfIndex(data, 0);
      const dataOffsetLength = recordType === 0xa1 ? 4 : 2;
      const payloadStart = segmentIndex.nextOffset + dataOffsetLength;
      if (payloadStart + 768 <= data.length) {
        return vgaDacPaletteToRgb(data.subarray(payloadStart, payloadStart + 768));
      }
    }

    offset = nextRecord;
  }

  return null;
}

function readOmfIndex(bytes: Uint8Array, offset: number): { nextOffset: number; value: number } {
  const first = bytes[offset];
  if (first === undefined) {
    throw new Error(`Unexpected end of OMF index at byte ${offset}.`);
  }

  if ((first & 0x80) === 0) {
    return {
      nextOffset: offset + 1,
      value: first
    };
  }

  const second = bytes[offset + 1];
  if (second === undefined) {
    throw new Error(`Unexpected end of two-byte OMF index at byte ${offset}.`);
  }

  return {
    nextOffset: offset + 2,
    value: ((first & 0x7f) << 8) | second
  };
}

function vgaDacPaletteToRgb(dacBytes: Uint8Array): Uint8Array {
  const paletteRgb = new Uint8Array(256 * 3);
  for (let index = 0; index < 256; index += 1) {
    const source = index * 3;
    const dest = index * 3;
    paletteRgb[dest] = dacToByte(dacBytes[source] ?? 0);
    paletteRgb[dest + 1] = dacToByte(dacBytes[source + 1] ?? 0);
    paletteRgb[dest + 2] = dacToByte(dacBytes[source + 2] ?? 0);
  }

  return paletteRgb;
}

function createFallbackPalette(): Uint8Array {
  const paletteRgb = new Uint8Array(256 * 3);
  for (let index = 0; index < 256; index += 1) {
    const base = FALLBACK_PALETTE_16[index & 0x0f] ?? [128, 128, 128];
    const lift = (index >> 4) * 5;
    const dest = index * 3;
    paletteRgb[dest] = clampByte(base[0] + lift);
    paletteRgb[dest + 1] = clampByte(base[1] + lift);
    paletteRgb[dest + 2] = clampByte(base[2] + lift);
  }

  return paletteRgb;
}

function dacToByte(value: number): number {
  return clampByte(Math.round((Math.max(0, Math.min(63, value)) * 255) / 63));
}

function spriteMask(u: number, v: number): boolean {
  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return false;
  }

  const dx = Math.abs(u - 0.5) / 0.46;
  const dy = Math.abs(v - 0.55) / 0.52;
  return dx * dx + dy * dy <= 1;
}

function spawnAngleForInfoTile(tile: number): number {
  switch (tile) {
    case 19:
      return -Math.PI / 2;
    case 20:
      return 0;
    case 21:
      return Math.PI / 2;
    case 22:
      return Math.PI;
    default:
      return 0;
  }
}

function wallRgb(tile: number, shade: number, channelOffset: number): [number, number, number] {
  if (tile >= 90 && tile <= 101) {
    return [
      clampByte(88 * shade),
      clampByte(116 * shade + channelOffset),
      clampByte(136 * shade)
    ];
  }

  const fallback: [number, number, number] = [143, 54, 45];
  const palette: Array<[number, number, number]> = [
    fallback,
    [96, 126, 70],
    [69, 109, 154],
    [185, 155, 80],
    [118, 79, 132],
    [157, 82, 54],
    [78, 139, 132],
    [176, 176, 148]
  ];
  const base = palette[Math.abs(tile) % palette.length] ?? fallback;

  return [
    clampByte(base[0] * shade),
    clampByte(base[1] * shade + channelOffset),
    clampByte(base[2] * shade - 24)
  ];
}

function doorRgb(door: PortDoor, shade: number, texture: number): [number, number, number] {
  const stripe = Math.floor(texture * 12) % 2 === 0 ? 18 : -10;
  if (door.lock > 0 && door.lock < 5) {
    return [
      clampByte(84 * shade + stripe),
      clampByte(112 * shade + stripe),
      clampByte(156 * shade + 18)
    ];
  }

  if (door.lock === 5) {
    return [
      clampByte(152 * shade + stripe),
      clampByte(152 * shade + stripe),
      clampByte(132 * shade)
    ];
  }

  return [
    clampByte(108 * shade + stripe),
    clampByte(86 * shade + stripe),
    clampByte(64 * shade)
  ];
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

function fractional(value: number): number {
  return value - Math.floor(value);
}

function collisionTile(tile: number): number {
  if (tile >= AREATILE) {
    return 0;
  }

  return tile;
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = appRoot.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function readDemoPlan(): DemoPlan | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("demo");
  if (!encoded) {
    return null;
  }

  try {
    const plan = normalizeDemoPlan(JSON.parse(decodeBase64Url(encoded)));
    if (!plan) {
      return null;
    }

    const autoStart = params.get("autorun") === "0" ? false : (plan.autoStart ?? true);
    return {
      ...plan,
      autoStart
    };
  } catch {
    statusLine.textContent = "Invalid demo plan";
    return null;
  }
}

function normalizeDemoPlan(value: unknown): DemoPlan | null {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    return null;
  }

  const steps = value.steps.filter(isDemoPlanStep);
  if (steps.length === 0) {
    return null;
  }

  const name = typeof value.name === "string" && value.name.trim().length > 0
    ? value.name.trim()
    : "cli-demo";

  return {
    ...(typeof value.autoStart === "boolean" ? { autoStart: value.autoStart } : {}),
    name,
    steps
  };
}

function isDemoPlanStep(value: unknown): value is DemoPlanStep {
  if (!isRecord(value) || typeof value.action !== "string") {
    return false;
  }

  if (value.action === "wait") {
    return typeof value.ms === "number";
  }

  if (value.action === "capture") {
    return true;
  }

  if (value.action === "key" || value.action === "keydown" || value.action === "keyup") {
    return typeof value.key === "string" || typeof value.key === "number";
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function keyCodeFor(key: string | number): number {
  if (typeof key === "number") {
    return key;
  }

  const normalized = key.replace(/[\s_-]/g, "").toUpperCase();
  const mapped = KEY_CODES[normalized] ?? KEY_CODES[`KEY${normalized}`];
  if (mapped) {
    return mapped;
  }

  if (normalized.length === 1) {
    return normalized.charCodeAt(0);
  }

  throw new Error(`Unknown demo key: ${key}`);
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function artifactFileName(kind: string, label: string, extension: string): string {
  const suffix = label.trim().length > 0 ? `-${slug(label)}` : "";
  return `wolf3d-source-typescript-${kind}${suffix}.${extension}`;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function ticsFromMilliseconds(milliseconds: number): number {
  return Math.max(1, Math.round((milliseconds * 70) / 1000));
}

function normalizeAngle(angle: number): number {
  const tau = Math.PI * 2;
  return ((angle % tau) + tau) % tau;
}

function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const channelCount = 1;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}
