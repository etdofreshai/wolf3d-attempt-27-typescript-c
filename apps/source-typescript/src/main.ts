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

type SourceDifficulty = "baby" | "easy" | "medium" | "hard";
type SourcePlayState =
  | "ex_abort"
  | "ex_completed"
  | "ex_demodone"
  | "ex_died"
  | "ex_loadedgame"
  | "ex_resetgame"
  | "ex_secretlevel"
  | "ex_stillplaying"
  | "ex_victorious"
  | "ex_warped";

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

type ArtifactKind = "audio" | "frame" | "state";

type ArtifactRecord = {
  bytes: number;
  fileName: string;
  kind: ArtifactKind;
  label: string;
  mimeType: string;
  sequence: number;
  ticcount: number;
};

type SourcePaletteShift = {
  kind: "red" | "white";
  level: number;
};

type PortMap = {
  actors: PortActor[];
  areaConnectCounts: Map<string, number>;
  areasByPlayer: Set<number>;
  blockingStaticKeys: Set<string>;
  doors: PortDoor[];
  height: number;
  killTotal: number;
  name: string;
  objects: Uint16Array;
  projectiles: PortProjectile[];
  pushWall: PortPushWall | null;
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

type PushWallDirection = "east" | "north" | "south" | "west";

type PortPushWall = {
  dir: PushWallDirection;
  oldTile: number;
  pos: number;
  state: number;
  x: number;
  y: number;
};

type ProjectileKind = "boom" | "fire" | "needle" | "rocket" | "smoke";

type PortProjectile = {
  angle: number;
  kind: ProjectileKind;
  speed: number;
  stateIndex: number;
  stateName: string;
  stateShapenum: number;
  stateTics: number;
  x: number;
  y: number;
};

type DamageSource = {
  kind: string;
  source: "actor" | "projectile";
  x: number;
  y: number;
};

type SourceLevelRatio = {
  kill: number;
  secret: number;
  time: number;
  treasure: number;
};

type SourceLevelCompletionSummary = SourceLevelRatio & {
  bonus: number;
  mapon: number;
  timeLeft: number;
  type: "regular" | "secret";
};

type SourceVictorySummary = {
  averageKill: number;
  averageSecret: number;
  averageTreasure: number;
  displayMinutes: number;
  displaySeconds: number;
  highScoreCompleted: number;
  score: number;
  totalTime: number;
};

type SourceHighScore = {
  completed: number;
  episode: number;
  name: string;
  score: number;
};

type SourceHighScoreCheck = SourceHighScore & {
  inserted: boolean;
  rank: number | null;
};

type PortActor = {
  active: boolean;
  ambush: boolean;
  attackMode: boolean;
  distance: number;
  dir: number;
  firstAttack: boolean;
  hitpoints: number;
  kind: string;
  mode: "attack" | "boss" | "chase" | "dead" | "dying" | "ghost" | "pain" | "patrol" | "stand" | "victory";
  reactionTime: number;
  shootable: boolean;
  speed: number;
  stateIndex: number;
  stateName: string;
  stateShapenum: number | null;
  stateTics: number;
  targetX: number;
  targetY: number;
  tile: number;
  visible: boolean;
  victoryPhase?: "jump" | "run";
  victoryTilesRemaining?: number;
  x: number;
  y: number;
};

type ActorFrameAction =
  | "bite"
  | "bjDone"
  | "bjYell"
  | "deathScream"
  | "fakeFire"
  | "hitlerMorph"
  | "mechaSound"
  | "shoot"
  | "slurpie"
  | "startDeathCam"
  | "throwNeedle"
  | "throwRocket";
type ActorFrameThink = "bjJump" | "bjRun";

type ActorStateFrame = {
  action?: ActorFrameAction;
  final?: boolean;
  name: string;
  nextMode?: "chase";
  shapenum: number;
  think?: ActorFrameThink;
  tics: number;
};

type ProjectileStateFrame = {
  name: string;
  rotate?: boolean;
  shapenum: number;
  tics: number;
};

type RayHit = {
  distance: number;
  door?: PortDoor;
  side: number;
  texture: number;
  tile: number;
  type: "door" | "pushwall" | "wall";
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
type SourceSoundName =
  | "AHHHGSND"
  | "ATKGATLINGSND"
  | "ATKKNIFESND"
  | "ATKMACHINEGUNSND"
  | "ATKPISTOLSND"
  | "BONUS1SND"
  | "BONUS2SND"
  | "BONUS3SND"
  | "BONUS4SND"
  | "BONUS1UPSND"
  | "BOSSACTIVESND"
  | "BOSSFIRESND"
  | "CLOSEDOORSND"
  | "DEATHSCREAM1SND"
  | "DEATHSCREAM2SND"
  | "DEATHSCREAM3SND"
  | "DEATHSCREAM4SND"
  | "DEATHSCREAM5SND"
  | "DEATHSCREAM6SND"
  | "DEATHSCREAM7SND"
  | "DEATHSCREAM8SND"
  | "DEATHSCREAM9SND"
  | "DIESND"
  | "DONOTHINGSND"
  | "DOGBARKSND"
  | "DOGATTACKSND"
  | "DOGDEATHSND"
  | "DONNERSND"
  | "EINESND"
  | "ENDBONUS1SND"
  | "ENDBONUS2SND"
  | "ERLAUBENSND"
  | "ESCPRESSEDSND"
  | "EVASND"
  | "FLAMETHROWERSND"
  | "GAMEOVERSND"
  | "GETAMMOSND"
  | "GETGATLINGSND"
  | "GETKEYSND"
  | "GETMACHINESND"
  | "GOOBSSND"
  | "GUTENTAGSND"
  | "HALTSND"
  | "HEARTBEATSND"
  | "HITENEMYSND"
  | "HITLERHASND"
  | "HITWALLSND"
  | "HEALTH1SND"
  | "HEALTH2SND"
  | "KEINSND"
  | "LEVELDONESND"
  | "LEBENSND"
  | "MECHSTEPSND"
  | "MEINGOTTSND"
  | "MEINSND"
  | "MISSILEFIRESND"
  | "MISSILEHITSND"
  | "MOVEGUN1SND"
  | "MOVEGUN2SND"
  | "MUTTISND"
  | "NAZIFIRESND"
  | "NAZIHITPLAYERSND"
  | "NEINSOVASSND"
  | "NOBONUSSND"
  | "NOITEMSND"
  | "NOWAYSND"
  | "OPENDOORSND"
  | "PERCENT100SND"
  | "PLAYERDEATHSND"
  | "PUSHWALLSND"
  | "ROSESND"
  | "SCHABBSHASND"
  | "SCHABBSTHROWSND"
  | "SCHEISTSND"
  | "SCHUTZADSND"
  | "SELECTITEMSND"
  | "SELECTWPNSND"
  | "SHOOTDOORSND"
  | "SHOOTSND"
  | "SLURPIESND"
  | "SPIONSND"
  | "SSFIRESND"
  | "TAKEDAMAGESND"
  | "TOT_HUNDSND"
  | "WALK1SND"
  | "WALK2SND"
  | "YEAHSND";

type PageInfo = {
  index: number;
  kind: PageKind;
  length: number;
  offset: number;
};

type SourceSoundCommonInfo = {
  chunk: number;
  dataBytes: number;
  length: number;
  offset: number;
  priority: number;
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
const ALTELEVATORTILE = 107;
const AMBUSHTILE = 106;
const AREATILE = 107;
const BJJUMPSPEED = 680;
const BJRUNSPEED = 2048;
const ELEVATORTILE = 21;
const ELEVATOR_BACK_TO = [1, 1, 7, 3, 5, 3] as const;
const EXITTILE = 99;
const ICONARROWS = 90;
const NODIR = 8;
const DOOR_POSITION_MAX = 0xffff;
const DOOR_POSITION_RATE_SHIFT = 10;
const EXTRAPOINTS = 40000;
const MAX_AMMO = 99;
const MAX_HEALTH = 100;
const MAX_HIGH_NAME = 57;
const MAX_LIVES = 9;
const MAX_SCORES = 7;
const OPENTICS = 300;
const RUNSPEED = 6000;
const SOURCE_ANGLES = 360;
const SOURCE_ANGLESCALE = 20;
const SOURCE_BASEMOVE = 35;
const SOURCE_FORWARD_MOVESCALE = 150;
const SOURCE_BACK_MOVESCALE = 100;
// WL_ACT2.C mutates the projectile bosses' second death frame when digitized sound is enabled.
const SOURCE_DIGITIZED_BOSS_DEATH_TICS = 140;
const SOURCE_LEVEL_RATIO_COUNT = 8;
const SOURCE_MAX_CONTROL = 100;
const SOURCE_MINDIST = 0x5800;
const SOURCE_PAR_AMOUNT = 500;
const SOURCE_PERCENT_100_BONUS = 10000;
const SOURCE_NUM_RED_SHIFTS = 6;
const SOURCE_RED_STEPS = 8;
const SOURCE_NUM_WHITE_SHIFTS = 3;
const SOURCE_WHITE_STEPS = 20;
const SOURCE_WHITE_TICS = 6;
const SOURCE_WHITE_SHIFT_TARGET: [number, number, number] = [255, 247, 0];
const SOURCE_RUNMOVE = 70;
const SOURCE_SECRET_FLOOR_BONUS = 15000;
const SOURCE_TICS_PER_SECOND = 70;
const SOURCE_PC_SOUND_SERVICE_HZ = SOURCE_TICS_PER_SECOND * 2;
const PUSHABLETILE = 98;
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const SPDDOG = 1500;
const SPDPATROL = 512;
const STARTAMMO = 8;
const TILEGLOBAL = 65536;
const SOURCE_PLAYERSIZE_TILES = SOURCE_MINDIST / TILEGLOBAL;
const TILE_DISTANCE = 1;
const MINACTORDIST_TILES = 0x10000 / TILEGLOBAL;
const SOURCE_OBJECT_SIZE_TILES = 0x2000 / TILEGLOBAL;
const PROJECTILE_PROBE_TILES = 0x2000 / TILEGLOBAL;
const PROJECTILESIZE_TILES = 0xc000 / TILEGLOBAL;
const WL6_PAR_TIMES_SECONDS = [
  90, 120, 120, 210, 180, 180, 150, 150, 0, 0,
  90, 210, 180, 120, 240, 360, 60, 180, 0, 0,
  90, 90, 150, 150, 210, 150, 120, 360, 0, 0,
  120, 120, 90, 60, 270, 210, 120, 270, 0, 0,
  150, 90, 150, 150, 240, 180, 270, 210, 0, 0,
  390, 240, 270, 360, 300, 330, 330, 510, 0, 0
] as const;
const DEFAULT_HIGH_SCORES: SourceHighScore[] = [
  { completed: 1, episode: 0, name: "id software-'92", score: 10000 },
  { completed: 1, episode: 0, name: "Adrian Carmack", score: 10000 },
  { completed: 1, episode: 0, name: "John Carmack", score: 10000 },
  { completed: 1, episode: 0, name: "Kevin Cloud", score: 10000 },
  { completed: 1, episode: 0, name: "Tom Hall", score: 10000 },
  { completed: 1, episode: 0, name: "John Romero", score: 10000 },
  { completed: 1, episode: 0, name: "Jay Wilbur", score: 10000 }
] as const;
const ATTACK_KEY_CODE = 17;
const RUN_KEY_CODE = 16;
const STRAFE_KEY_CODE = 18;
const USE_KEY_CODE = 32;
const SOURCE_DEATH_CAM_DONE_TICS = 20;
const SOURCE_DEATH_CAM_START_DISTANCE = 0x14000 / TILEGLOBAL;
const SOURCE_DEATH_CAM_DISTANCE_STEP = 0x1000 / TILEGLOBAL;
const SOURCE_DEATH_CAM_MAX_STEPS = 64;
const GETGATLINGSND: SourceSoundName = "GETGATLINGSND";
const SOURCE_SOUND_CHUNKS: Record<SourceSoundName, number> = {
  AHHHGSND: 52,
  ATKGATLINGSND: 11,
  ATKKNIFESND: 23,
  ATKMACHINEGUNSND: 26,
  ATKPISTOLSND: 24,
  BONUS1SND: 35,
  BONUS2SND: 36,
  BONUS3SND: 37,
  BONUS4SND: 45,
  BONUS1UPSND: 44,
  BOSSACTIVESND: 49,
  BOSSFIRESND: 59,
  CLOSEDOORSND: 19,
  DEATHSCREAM1SND: 29,
  DEATHSCREAM2SND: 22,
  DEATHSCREAM3SND: 25,
  DEATHSCREAM4SND: 73,
  DEATHSCREAM5SND: 74,
  DEATHSCREAM6SND: 75,
  DEATHSCREAM7SND: 76,
  DEATHSCREAM8SND: 77,
  DEATHSCREAM9SND: 78,
  DIESND: 53,
  DONOTHINGSND: 20,
  DOGBARKSND: 41,
  DOGATTACKSND: 68,
  DOGDEATHSND: 10,
  DONNERSND: 79,
  EINESND: 80,
  ENDBONUS1SND: 42,
  ENDBONUS2SND: 43,
  ERLAUBENSND: 81,
  ESCPRESSEDSND: 39,
  EVASND: 54,
  FLAMETHROWERSND: 69,
  GAMEOVERSND: 17,
  GETAMMOSND: 31,
  GETGATLINGSND: 38,
  GETKEYSND: 12,
  GETMACHINESND: 30,
  GOOBSSND: 71,
  GUTENTAGSND: 55,
  HALTSND: 21,
  HEARTBEATSND: 3,
  HITENEMYSND: 27,
  HITLERHASND: 65,
  HITWALLSND: 0,
  HEALTH1SND: 33,
  HEALTH2SND: 34,
  KEINSND: 82,
  LEVELDONESND: 40,
  LEBENSND: 56,
  MECHSTEPSND: 70,
  MEINGOTTSND: 63,
  MEINSND: 83,
  MISSILEFIRESND: 85,
  MISSILEHITSND: 86,
  MOVEGUN1SND: 5,
  MOVEGUN2SND: 4,
  MUTTISND: 50,
  NAZIFIRESND: 58,
  NAZIHITPLAYERSND: 7,
  NEINSOVASSND: 67,
  NOBONUSSND: 47,
  NOITEMSND: 13,
  NOWAYSND: 6,
  OPENDOORSND: 18,
  PERCENT100SND: 48,
  PLAYERDEATHSND: 9,
  PUSHWALLSND: 46,
  ROSESND: 84,
  SCHABBSHASND: 64,
  SCHABBSTHROWSND: 8,
  SCHEISTSND: 57,
  SCHUTZADSND: 51,
  SELECTITEMSND: 2,
  SELECTWPNSND: 1,
  SHOOTDOORSND: 28,
  SHOOTSND: 32,
  SLURPIESND: 61,
  SPIONSND: 66,
  SSFIRESND: 60,
  TAKEDAMAGESND: 16,
  TOT_HUNDSND: 62,
  WALK1SND: 14,
  WALK2SND: 15,
  YEAHSND: 72
};
const WL6_GUARD_DEATH_SCREAMS = [
  "DEATHSCREAM1SND",
  "DEATHSCREAM2SND",
  "DEATHSCREAM3SND",
  "DEATHSCREAM4SND",
  "DEATHSCREAM5SND",
  "DEATHSCREAM7SND",
  "DEATHSCREAM8SND",
  "DEATHSCREAM9SND"
] as const satisfies readonly SourceSoundName[];
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
  BLINKY_W2: 289,
  BOOM_1: 382,
  BOOM_2: 383,
  BOOM_3: 384,
  BOSS_DEAD: 303,
  BOSS_DIE1: 304,
  BOSS_DIE2: 305,
  BOSS_DIE3: 306,
  BOSS_SHOOT1: 300,
  BOSS_SHOOT2: 301,
  BOSS_SHOOT3: 302,
  BOSS_W1: 296,
  BOSS_W2: 297,
  BOSS_W3: 298,
  BOSS_W4: 299,
  CLYDE_W1: 292,
  CLYDE_W2: 293,
  DOG_DEAD: 134,
  DOG_DIE_1: 131,
  DOG_DIE_2: 132,
  DOG_DIE_3: 133,
  DOG_JUMP1: 135,
  DOG_JUMP2: 136,
  DOG_JUMP3: 137,
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
  FAKE_SHOOT: 325,
  FAKE_W1: 321,
  FAKE_W2: 322,
  FAKE_W3: 323,
  FAKE_W4: 324,
  FAT_DEAD: 407,
  FAT_DIE1: 404,
  FAT_DIE2: 405,
  FAT_DIE3: 406,
  FAT_SHOOT1: 400,
  FAT_SHOOT2: 401,
  FAT_SHOOT3: 402,
  FAT_SHOOT4: 403,
  FAT_W1: 396,
  FAT_W2: 397,
  FAT_W3: 398,
  FAT_W4: 399,
  BJ_W1: 408,
  BJ_W2: 409,
  BJ_W3: 410,
  BJ_W4: 411,
  BJ_JUMP1: 412,
  BJ_JUMP2: 413,
  BJ_JUMP3: 414,
  BJ_JUMP4: 415,
  FIRE1: 326,
  FIRE2: 327,
  GIFT_DEAD: 369,
  GIFT_DIE1: 366,
  GIFT_DIE2: 367,
  GIFT_DIE3: 368,
  GIFT_SHOOT1: 364,
  GIFT_SHOOT2: 365,
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
  GRD_SHOOT1: 96,
  GRD_SHOOT2: 97,
  GRD_SHOOT3: 98,
  GRD_W1_1: 58,
  GRD_W2_1: 66,
  GRD_W3_1: 74,
  GRD_W4_1: 82,
  GRETEL_DEAD: 392,
  GRETEL_DIE1: 393,
  GRETEL_DIE2: 394,
  GRETEL_DIE3: 395,
  GRETEL_SHOOT1: 389,
  GRETEL_SHOOT2: 390,
  GRETEL_SHOOT3: 391,
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
  HITLER_SHOOT1: 349,
  HITLER_SHOOT2: 350,
  HITLER_SHOOT3: 351,
  HITLER_W1: 345,
  HITLER_W2: 346,
  HITLER_W3: 347,
  HITLER_W4: 348,
  INKY_W1: 294,
  INKY_W2: 295,
  MECHA_DEAD: 341,
  MECHA_DIE1: 342,
  MECHA_DIE2: 343,
  MECHA_DIE3: 344,
  MECHA_SHOOT1: 338,
  MECHA_SHOOT2: 339,
  MECHA_SHOOT3: 340,
  MECHA_W1: 334,
  MECHA_W2: 335,
  MECHA_W3: 336,
  MECHA_W4: 337,
  ROCKET_1: 370,
  SMOKE_1: 378,
  SMOKE_2: 379,
  SMOKE_3: 380,
  SMOKE_4: 381,
  MUT_DEAD: 233,
  MUT_DIE_1: 228,
  MUT_DIE_2: 229,
  MUT_DIE_3: 230,
  MUT_DIE_4: 232,
  MUT_PAIN_1: 227,
  MUT_PAIN_2: 231,
  MUT_S_1: 187,
  MUT_SHOOT1: 234,
  MUT_SHOOT2: 235,
  MUT_SHOOT3: 236,
  MUT_SHOOT4: 237,
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
  OFC_SHOOT1: 285,
  OFC_SHOOT2: 286,
  OFC_SHOOT3: 287,
  OFC_W1_1: 246,
  OFC_W2_1: 254,
  OFC_W3_1: 262,
  OFC_W4_1: 270,
  PINKY_W1: 290,
  PINKY_W2: 291,
  SCHABB_DEAD: 316,
  SCHABB_DIE1: 313,
  SCHABB_DIE2: 314,
  SCHABB_DIE3: 315,
  SCHABB_SHOOT1: 311,
  SCHABB_SHOOT2: 312,
  SCHABB_W1: 307,
  SCHABB_W2: 308,
  SCHABB_W3: 309,
  SCHABB_W4: 310,
  HYPO1: 317,
  HYPO2: 318,
  HYPO3: 319,
  HYPO4: 320,
  SS_DEAD: 183,
  SS_DIE_1: 179,
  SS_DIE_2: 180,
  SS_DIE_3: 181,
  SS_PAIN_1: 178,
  SS_PAIN_2: 182,
  SS_S_1: 138,
  SS_SHOOT1: 184,
  SS_SHOOT2: 185,
  SS_SHOOT3: 186,
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
  real_hitler: ACTOR_SPRITES.HITLER_W1,
  schabbs: ACTOR_SPRITES.SCHABB_W1
};
const ACTOR_GHOST_SPRITES: Record<string, number> = {
  blinky: ACTOR_SPRITES.BLINKY_W1,
  clyde: ACTOR_SPRITES.CLYDE_W1,
  inky: ACTOR_SPRITES.INKY_W1,
  pinky: ACTOR_SPRITES.PINKY_W1
};
const ACTOR_GHOST_STATES: Record<string, ActorStateFrame[]> = {
  blinky: [
    { name: "s_blinkychase1", shapenum: ACTOR_SPRITES.BLINKY_W1, tics: 10 },
    { name: "s_blinkychase2", shapenum: ACTOR_SPRITES.BLINKY_W2, tics: 10 }
  ],
  clyde: [
    { name: "s_clydechase1", shapenum: ACTOR_SPRITES.CLYDE_W1, tics: 10 },
    { name: "s_clydechase2", shapenum: ACTOR_SPRITES.CLYDE_W2, tics: 10 }
  ],
  inky: [
    { name: "s_inkychase1", shapenum: ACTOR_SPRITES.INKY_W1, tics: 10 },
    { name: "s_inkychase2", shapenum: ACTOR_SPRITES.INKY_W2, tics: 10 }
  ],
  pinky: [
    { name: "s_pinkychase1", shapenum: ACTOR_SPRITES.PINKY_W1, tics: 10 },
    { name: "s_pinkychase2", shapenum: ACTOR_SPRITES.PINKY_W2, tics: 10 }
  ]
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
const ACTOR_ATTACK_STATES: Record<string, ActorStateFrame[]> = {
  boss: [
    { name: "s_bossshoot1", shapenum: ACTOR_SPRITES.BOSS_SHOOT1, tics: 30 },
    { action: "shoot", name: "s_bossshoot2", shapenum: ACTOR_SPRITES.BOSS_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_bossshoot3", shapenum: ACTOR_SPRITES.BOSS_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_bossshoot4", shapenum: ACTOR_SPRITES.BOSS_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_bossshoot5", shapenum: ACTOR_SPRITES.BOSS_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_bossshoot6", shapenum: ACTOR_SPRITES.BOSS_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_bossshoot7", shapenum: ACTOR_SPRITES.BOSS_SHOOT3, tics: 10 },
    { name: "s_bossshoot8", nextMode: "chase", shapenum: ACTOR_SPRITES.BOSS_SHOOT1, tics: 10 }
  ],
  dog: [
    { name: "s_dogjump1", shapenum: ACTOR_SPRITES.DOG_JUMP1, tics: 10 },
    { action: "bite", name: "s_dogjump2", shapenum: ACTOR_SPRITES.DOG_JUMP2, tics: 10 },
    { name: "s_dogjump3", shapenum: ACTOR_SPRITES.DOG_JUMP3, tics: 10 },
    { name: "s_dogjump4", shapenum: ACTOR_SPRITES.DOG_JUMP1, tics: 10 },
    { name: "s_dogjump5", nextMode: "chase", shapenum: ACTOR_SPRITES.DOG_W1_1, tics: 10 }
  ],
  fake_hitler: [
    { action: "fakeFire", name: "s_fakeshoot1", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot2", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot3", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot4", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot5", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot6", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot7", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { action: "fakeFire", name: "s_fakeshoot8", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 },
    { name: "s_fakeshoot9", nextMode: "chase", shapenum: ACTOR_SPRITES.FAKE_SHOOT, tics: 8 }
  ],
  fat: [
    { name: "s_fatshoot1", shapenum: ACTOR_SPRITES.FAT_SHOOT1, tics: 30 },
    { action: "throwRocket", name: "s_fatshoot2", shapenum: ACTOR_SPRITES.FAT_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_fatshoot3", shapenum: ACTOR_SPRITES.FAT_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_fatshoot4", shapenum: ACTOR_SPRITES.FAT_SHOOT4, tics: 10 },
    { action: "shoot", name: "s_fatshoot5", shapenum: ACTOR_SPRITES.FAT_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_fatshoot6", nextMode: "chase", shapenum: ACTOR_SPRITES.FAT_SHOOT4, tics: 10 }
  ],
  gift: [
    { name: "s_giftshoot1", shapenum: ACTOR_SPRITES.GIFT_SHOOT1, tics: 30 },
    { action: "throwRocket", name: "s_giftshoot2", nextMode: "chase", shapenum: ACTOR_SPRITES.GIFT_SHOOT2, tics: 10 }
  ],
  gretel: [
    { name: "s_gretelshoot1", shapenum: ACTOR_SPRITES.GRETEL_SHOOT1, tics: 30 },
    { action: "shoot", name: "s_gretelshoot2", shapenum: ACTOR_SPRITES.GRETEL_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_gretelshoot3", shapenum: ACTOR_SPRITES.GRETEL_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_gretelshoot4", shapenum: ACTOR_SPRITES.GRETEL_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_gretelshoot5", shapenum: ACTOR_SPRITES.GRETEL_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_gretelshoot6", shapenum: ACTOR_SPRITES.GRETEL_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_gretelshoot7", shapenum: ACTOR_SPRITES.GRETEL_SHOOT3, tics: 10 },
    { name: "s_gretelshoot8", nextMode: "chase", shapenum: ACTOR_SPRITES.GRETEL_SHOOT1, tics: 10 }
  ],
  guard: [
    { name: "s_grdshoot1", shapenum: ACTOR_SPRITES.GRD_SHOOT1, tics: 20 },
    { action: "shoot", name: "s_grdshoot2", shapenum: ACTOR_SPRITES.GRD_SHOOT2, tics: 20 },
    { name: "s_grdshoot3", nextMode: "chase", shapenum: ACTOR_SPRITES.GRD_SHOOT3, tics: 20 }
  ],
  hitler: [
    { name: "s_mechashoot1", shapenum: ACTOR_SPRITES.MECHA_SHOOT1, tics: 30 },
    { action: "shoot", name: "s_mechashoot2", shapenum: ACTOR_SPRITES.MECHA_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_mechashoot3", shapenum: ACTOR_SPRITES.MECHA_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_mechashoot4", shapenum: ACTOR_SPRITES.MECHA_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_mechashoot5", shapenum: ACTOR_SPRITES.MECHA_SHOOT3, tics: 10 },
    { name: "s_mechashoot6", nextMode: "chase", shapenum: ACTOR_SPRITES.MECHA_SHOOT2, tics: 10 }
  ],
  mutant: [
    { action: "shoot", name: "s_mutshoot1", shapenum: ACTOR_SPRITES.MUT_SHOOT1, tics: 6 },
    { name: "s_mutshoot2", shapenum: ACTOR_SPRITES.MUT_SHOOT2, tics: 20 },
    { action: "shoot", name: "s_mutshoot3", shapenum: ACTOR_SPRITES.MUT_SHOOT3, tics: 10 },
    { name: "s_mutshoot4", nextMode: "chase", shapenum: ACTOR_SPRITES.MUT_SHOOT4, tics: 20 }
  ],
  officer: [
    { name: "s_ofcshoot1", shapenum: ACTOR_SPRITES.OFC_SHOOT1, tics: 6 },
    { action: "shoot", name: "s_ofcshoot2", shapenum: ACTOR_SPRITES.OFC_SHOOT2, tics: 20 },
    { name: "s_ofcshoot3", nextMode: "chase", shapenum: ACTOR_SPRITES.OFC_SHOOT3, tics: 10 }
  ],
  real_hitler: [
    { name: "s_hitlershoot1", shapenum: ACTOR_SPRITES.HITLER_SHOOT1, tics: 30 },
    { action: "shoot", name: "s_hitlershoot2", shapenum: ACTOR_SPRITES.HITLER_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_hitlershoot3", shapenum: ACTOR_SPRITES.HITLER_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_hitlershoot4", shapenum: ACTOR_SPRITES.HITLER_SHOOT2, tics: 10 },
    { action: "shoot", name: "s_hitlershoot5", shapenum: ACTOR_SPRITES.HITLER_SHOOT3, tics: 10 },
    { name: "s_hitlershoot6", nextMode: "chase", shapenum: ACTOR_SPRITES.HITLER_SHOOT2, tics: 10 }
  ],
  schabbs: [
    { name: "s_schabbshoot1", shapenum: ACTOR_SPRITES.SCHABB_SHOOT1, tics: 30 },
    { action: "throwNeedle", name: "s_schabbshoot2", nextMode: "chase", shapenum: ACTOR_SPRITES.SCHABB_SHOOT2, tics: 10 }
  ],
  ss: [
    { name: "s_ssshoot1", shapenum: ACTOR_SPRITES.SS_SHOOT1, tics: 20 },
    { action: "shoot", name: "s_ssshoot2", shapenum: ACTOR_SPRITES.SS_SHOOT2, tics: 20 },
    { name: "s_ssshoot3", shapenum: ACTOR_SPRITES.SS_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_ssshoot4", shapenum: ACTOR_SPRITES.SS_SHOOT2, tics: 10 },
    { name: "s_ssshoot5", shapenum: ACTOR_SPRITES.SS_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_ssshoot6", shapenum: ACTOR_SPRITES.SS_SHOOT2, tics: 10 },
    { name: "s_ssshoot7", shapenum: ACTOR_SPRITES.SS_SHOOT3, tics: 10 },
    { action: "shoot", name: "s_ssshoot8", shapenum: ACTOR_SPRITES.SS_SHOOT2, tics: 10 },
    { name: "s_ssshoot9", nextMode: "chase", shapenum: ACTOR_SPRITES.SS_SHOOT3, tics: 10 }
  ]
};
const ACTOR_VICTORY_RUN_STATES: ActorStateFrame[] = [
  { name: "s_bjrun1", shapenum: ACTOR_SPRITES.BJ_W1, think: "bjRun", tics: 12 },
  { name: "s_bjrun1s", shapenum: ACTOR_SPRITES.BJ_W1, tics: 3 },
  { name: "s_bjrun2", shapenum: ACTOR_SPRITES.BJ_W2, think: "bjRun", tics: 8 },
  { name: "s_bjrun3", shapenum: ACTOR_SPRITES.BJ_W3, think: "bjRun", tics: 12 },
  { name: "s_bjrun3s", shapenum: ACTOR_SPRITES.BJ_W3, tics: 3 },
  { name: "s_bjrun4", shapenum: ACTOR_SPRITES.BJ_W4, think: "bjRun", tics: 8 }
];
const ACTOR_VICTORY_JUMP_STATES: ActorStateFrame[] = [
  { name: "s_bjjump1", shapenum: ACTOR_SPRITES.BJ_JUMP1, think: "bjJump", tics: 14 },
  { action: "bjYell", name: "s_bjjump2", shapenum: ACTOR_SPRITES.BJ_JUMP2, think: "bjJump", tics: 14 },
  { name: "s_bjjump3", shapenum: ACTOR_SPRITES.BJ_JUMP3, think: "bjJump", tics: 14 },
  { action: "bjDone", name: "s_bjjump4", shapenum: ACTOR_SPRITES.BJ_JUMP4, tics: 300 }
];
const PROJECTILE_STATES: Record<ProjectileKind, ProjectileStateFrame[]> = {
  boom: [
    { name: "s_boom1", shapenum: ACTOR_SPRITES.BOOM_1, tics: 6 },
    { name: "s_boom2", shapenum: ACTOR_SPRITES.BOOM_2, tics: 6 },
    { name: "s_boom3", shapenum: ACTOR_SPRITES.BOOM_3, tics: 6 }
  ],
  fire: [
    { name: "s_fire1", shapenum: ACTOR_SPRITES.FIRE1, tics: 6 },
    { name: "s_fire2", shapenum: ACTOR_SPRITES.FIRE2, tics: 6 }
  ],
  needle: [
    { name: "s_needle1", shapenum: ACTOR_SPRITES.HYPO1, tics: 6 },
    { name: "s_needle2", shapenum: ACTOR_SPRITES.HYPO2, tics: 6 },
    { name: "s_needle3", shapenum: ACTOR_SPRITES.HYPO3, tics: 6 },
    { name: "s_needle4", shapenum: ACTOR_SPRITES.HYPO4, tics: 6 }
  ],
  rocket: [{ name: "s_rocket", rotate: true, shapenum: ACTOR_SPRITES.ROCKET_1, tics: 3 }],
  smoke: [
    { name: "s_smoke1", shapenum: ACTOR_SPRITES.SMOKE_1, tics: 3 },
    { name: "s_smoke2", shapenum: ACTOR_SPRITES.SMOKE_2, tics: 3 },
    { name: "s_smoke3", shapenum: ACTOR_SPRITES.SMOKE_3, tics: 3 },
    { name: "s_smoke4", shapenum: ACTOR_SPRITES.SMOKE_4, tics: 3 }
  ]
};
const LOOPING_PROJECTILE_KINDS = new Set<ProjectileKind>(["fire", "needle", "rocket"]);
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
  hitler: mechaChaseFrames(),
  mutant: chaseFrames("mut", [ACTOR_SPRITES.MUT_W1_1, ACTOR_SPRITES.MUT_W2_1, ACTOR_SPRITES.MUT_W3_1, ACTOR_SPRITES.MUT_W4_1]),
  officer: chaseFrames("ofc", [ACTOR_SPRITES.OFC_W1_1, ACTOR_SPRITES.OFC_W2_1, ACTOR_SPRITES.OFC_W3_1, ACTOR_SPRITES.OFC_W4_1]),
  real_hitler: chaseFrames("hitler", [ACTOR_SPRITES.HITLER_W1, ACTOR_SPRITES.HITLER_W2, ACTOR_SPRITES.HITLER_W3, ACTOR_SPRITES.HITLER_W4], [6, 4, 2, 6, 4, 2]),
  schabbs: chaseFrames("schabb", [ACTOR_SPRITES.SCHABB_W1, ACTOR_SPRITES.SCHABB_W2, ACTOR_SPRITES.SCHABB_W3, ACTOR_SPRITES.SCHABB_W4]),
  ss: chaseFrames("ss", [ACTOR_SPRITES.SS_W1_1, ACTOR_SPRITES.SS_W2_1, ACTOR_SPRITES.SS_W3_1, ACTOR_SPRITES.SS_W4_1])
};
const ACTOR_DEATH_STATES: Record<string, ActorStateFrame[]> = {
  boss: deathFrames([
    ["s_bossdie1", ACTOR_SPRITES.BOSS_DIE1, 15, false, "deathScream"],
    ["s_bossdie2", ACTOR_SPRITES.BOSS_DIE2, 15],
    ["s_bossdie3", ACTOR_SPRITES.BOSS_DIE3, 15],
    ["s_bossdie4", ACTOR_SPRITES.BOSS_DEAD, 0, true]
  ]),
  dog: deathFrames([
    ["s_dogdie1", ACTOR_SPRITES.DOG_DIE_1, 15, false, "deathScream"],
    ["s_dogdie2", ACTOR_SPRITES.DOG_DIE_2, 15],
    ["s_dogdie3", ACTOR_SPRITES.DOG_DIE_3, 15],
    ["s_dogdead", ACTOR_SPRITES.DOG_DEAD, 15, true]
  ]),
  fake_hitler: deathFrames([
    ["s_fakedie1", ACTOR_SPRITES.FAKE_DIE1, 10, false, "deathScream"],
    ["s_fakedie2", ACTOR_SPRITES.FAKE_DIE2, 10],
    ["s_fakedie3", ACTOR_SPRITES.FAKE_DIE3, 10],
    ["s_fakedie4", ACTOR_SPRITES.FAKE_DIE4, 10],
    ["s_fakedie5", ACTOR_SPRITES.FAKE_DIE5, 10],
    ["s_fakedie6", ACTOR_SPRITES.FAKE_DEAD, 0, true]
  ]),
  fat: deathFrames([
    ["s_fatdie1", ACTOR_SPRITES.FAT_W1, 1, false, "deathScream"],
    ["s_fatdie2", ACTOR_SPRITES.FAT_W1, SOURCE_DIGITIZED_BOSS_DEATH_TICS],
    ["s_fatdie3", ACTOR_SPRITES.FAT_DIE1, 10],
    ["s_fatdie4", ACTOR_SPRITES.FAT_DIE2, 10],
    ["s_fatdie5", ACTOR_SPRITES.FAT_DIE3, 10],
    ["s_fatdie6", ACTOR_SPRITES.FAT_DEAD, 20, true, "startDeathCam"]
  ]),
  gift: deathFrames([
    ["s_giftdie1", ACTOR_SPRITES.GIFT_W1, 1, false, "deathScream"],
    ["s_giftdie2", ACTOR_SPRITES.GIFT_W1, SOURCE_DIGITIZED_BOSS_DEATH_TICS],
    ["s_giftdie3", ACTOR_SPRITES.GIFT_DIE1, 10],
    ["s_giftdie4", ACTOR_SPRITES.GIFT_DIE2, 10],
    ["s_giftdie5", ACTOR_SPRITES.GIFT_DIE3, 10],
    ["s_giftdie6", ACTOR_SPRITES.GIFT_DEAD, 20, true, "startDeathCam"]
  ]),
  gretel: deathFrames([
    ["s_greteldie1", ACTOR_SPRITES.GRETEL_DIE1, 15, false, "deathScream"],
    ["s_greteldie2", ACTOR_SPRITES.GRETEL_DIE2, 15],
    ["s_greteldie3", ACTOR_SPRITES.GRETEL_DIE3, 15],
    ["s_greteldie4", ACTOR_SPRITES.GRETEL_DEAD, 0, true]
  ]),
  guard: deathFrames([
    ["s_grddie1", ACTOR_SPRITES.GRD_DIE_1, 15, false, "deathScream"],
    ["s_grddie2", ACTOR_SPRITES.GRD_DIE_2, 15],
    ["s_grddie3", ACTOR_SPRITES.GRD_DIE_3, 15],
    ["s_grddie4", ACTOR_SPRITES.GRD_DEAD, 0, true]
  ]),
  hitler: deathFrames([
    ["s_mechadie1", ACTOR_SPRITES.MECHA_DIE1, 10, false, "deathScream"],
    ["s_mechadie2", ACTOR_SPRITES.MECHA_DIE2, 10],
    ["s_mechadie3", ACTOR_SPRITES.MECHA_DIE3, 10, false, "hitlerMorph"],
    ["s_mechadie4", ACTOR_SPRITES.MECHA_DEAD, 0, true]
  ]),
  mutant: deathFrames([
    ["s_mutdie1", ACTOR_SPRITES.MUT_DIE_1, 7, false, "deathScream"],
    ["s_mutdie2", ACTOR_SPRITES.MUT_DIE_2, 7],
    ["s_mutdie3", ACTOR_SPRITES.MUT_DIE_3, 7],
    ["s_mutdie4", ACTOR_SPRITES.MUT_DIE_4, 7],
    ["s_mutdie5", ACTOR_SPRITES.MUT_DEAD, 0, true]
  ]),
  officer: deathFrames([
    ["s_ofcdie1", ACTOR_SPRITES.OFC_DIE_1, 11, false, "deathScream"],
    ["s_ofcdie2", ACTOR_SPRITES.OFC_DIE_2, 11],
    ["s_ofcdie3", ACTOR_SPRITES.OFC_DIE_3, 11],
    ["s_ofcdie4", ACTOR_SPRITES.OFC_DIE_4, 11],
    ["s_ofcdie5", ACTOR_SPRITES.OFC_DEAD, 0, true]
  ]),
  real_hitler: deathFrames([
    ["s_hitlerdie1", ACTOR_SPRITES.HITLER_W1, 1, false, "deathScream"],
    ["s_hitlerdie2", ACTOR_SPRITES.HITLER_W1, SOURCE_DIGITIZED_BOSS_DEATH_TICS],
    ["s_hitlerdie3", ACTOR_SPRITES.HITLER_DIE1, 10, false, "slurpie"],
    ["s_hitlerdie4", ACTOR_SPRITES.HITLER_DIE2, 10],
    ["s_hitlerdie5", ACTOR_SPRITES.HITLER_DIE3, 10],
    ["s_hitlerdie6", ACTOR_SPRITES.HITLER_DIE4, 10],
    ["s_hitlerdie7", ACTOR_SPRITES.HITLER_DIE5, 10],
    ["s_hitlerdie8", ACTOR_SPRITES.HITLER_DIE6, 10],
    ["s_hitlerdie9", ACTOR_SPRITES.HITLER_DIE7, 10],
    ["s_hitlerdie10", ACTOR_SPRITES.HITLER_DEAD, 20, true, "startDeathCam"]
  ]),
  schabbs: deathFrames([
    ["s_schabbdie1", ACTOR_SPRITES.SCHABB_W1, 10, false, "deathScream"],
    ["s_schabbdie2", ACTOR_SPRITES.SCHABB_W1, SOURCE_DIGITIZED_BOSS_DEATH_TICS],
    ["s_schabbdie3", ACTOR_SPRITES.SCHABB_DIE1, 10],
    ["s_schabbdie4", ACTOR_SPRITES.SCHABB_DIE2, 10],
    ["s_schabbdie5", ACTOR_SPRITES.SCHABB_DIE3, 10],
    ["s_schabbdie6", ACTOR_SPRITES.SCHABB_DEAD, 20, true, "startDeathCam"]
  ]),
  ss: deathFrames([
    ["s_ssdie1", ACTOR_SPRITES.SS_DIE_1, 15, false, "deathScream"],
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
// WL_ACT2.C starthitpoints[4][NUMENEMIES], indexed by gd_baby..gd_hard.
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
  real_hitler: 7,
  schabbs: 5,
  ss: 2
};
const REAL_HITLER_HITPOINTS = [500, 700, 800, 900] as const;
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
const MINSIGHT_TILES = 0x18000 / 0x10000;
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
const OPPOSITE_DIRECTIONS = [4, 5, 6, 7, 0, 1, 2, 3, NODIR] as const;
const DIAGONAL_DIRECTIONS: Record<number, Partial<Record<number, number>>> = {
  0: { 2: 1, 6: 7 },
  2: { 0: 1, 4: 3 },
  4: { 2: 3, 6: 5 },
  6: { 0: 7, 4: 5 }
};
const CARDINAL_DIRECTIONS = new Set([0, 2, 4, 6]);
const CARDINAL_TILE_DELTAS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }
];
const WL6_SECRET_DEATH_SCREAM_ACTORS = new Set(["dog", "guard", "mutant", "officer", "ss"]);
const ACTOR_SIDE_DOOR_KINDS = new Set([
  "blinky",
  "boss",
  "clyde",
  "fat",
  "gift",
  "gretel",
  "guard",
  "hitler",
  "inky",
  "mutant",
  "officer",
  "pinky",
  "schabbs",
  "ss"
]);
const DEATH_CAM_SOURCE_POSITION_ACTORS = new Set(["fat", "gift", "real_hitler", "schabbs"]);

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
          <div>
            <dt>Artifacts</dt>
            <dd id="artifact-state">0</dd>
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
const artifactState = requireElement<HTMLElement>("#artifact-state");
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

  private artifactRecords: ArtifactRecord[] = [];
  private artifactSequence = 0;
  private artifactUrls: string[] = [];
  private animationStarted = false;
  private demoRunning = false;
  private demoStepIndex: number | null = null;
  private lastTime = 0;
  private readonly demoPlan: DemoPlan | null;
  private readonly startDifficulty: SourceDifficulty;
  private readonly startLevel: number;
  private transitionInProgress = false;

  constructor(screenCanvas: HTMLCanvasElement, demoPlan: DemoPlan | null) {
    this.demoPlan = demoPlan;
    this.startDifficulty = readDifficulty();
    this.startLevel = readStartLevel();
    this.id_vl = new IDVL(screenCanvas);
    this.id_in = new IDIN();
    this.id_pm = new IDPM();
    this.id_sd = new IDSD();
    this.id_us = new IDUS();
    this.id_ca = new IDCA();
    this.wl_game = new WLGame(this.id_sd, this.startDifficulty);
    this.wl_draw = new WLDraw(this.id_vl, this.id_pm);
    this.wl_play = new WLPlay(this.wl_game, this.wl_draw, this.id_in, this.id_sd);
  }

  async StartGame(): Promise<void> {
    this.id_us.US_Print("StartGame");
    statusLine.textContent = "Loading ID_CA map";
    try {
      const soundStatus = await this.id_sd.SD_Startup();
      this.id_us.US_Print(
        `SD_Startup PC sounds ${soundStatus.sounds.length} / ${soundStatus.soundServiceHz}Hz`
      );
    } catch (error) {
      this.id_us.US_Print(
        error instanceof Error ? `SD_Startup fallback: ${error.message}` : "SD_Startup fallback"
      );
    }

    try {
      const status = await this.id_ca.CacheStartup();
      renderSourceStatus(status);
      const pageStatus = await this.id_pm.PM_Startup();
      this.id_us.US_Print(
        `PM_Startup VSWAP ${pageStatus.chunksInFile} chunks / ${pageStatus.textureCount} textures / ${pageStatus.spriteCount} sprites / palette ${pageStatus.paletteSource} / first ${pageStatus.firstSpriteVisiblePixels} px`
      );
      const wolfMap = await this.id_ca.CA_CacheMap(this.startLevel);
      this.wl_game.SetupGameLevel(this.startLevel, wolfMap);
      this.id_us.US_Print(
        `CA_CacheMap ${wolfMap.header.name || `map ${wolfMap.index}`} ${wolfMap.header.width}x${wolfMap.header.height} difficulty ${this.startDifficulty}`
      );
    } catch (error) {
      this.wl_game.SetupGameLevel(this.startLevel);
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
    this.transitionInProgress = false;
    this.id_sd.SD_StopDigitized();
    this.id_sd.SD_StopSound();
    this.wl_game.NewGameState(this.startDifficulty, Math.floor(this.startLevel / 10));
    this.wl_game.SetupGameLevel(this.startLevel, this.id_ca.currentMap);
    this.wl_play.PlayLoop(1000 / 60);
    this.id_us.US_Print("ResetGame");
    this.RenderUi();
  }

  async Tick(ticMs: number): Promise<void> {
    if (this.transitionInProgress) {
      return;
    }

    this.wl_play.PlayLoop(ticMs);
    await this.ApplyGameLoopTransition();
    this.RenderUi();
  }

  private async ApplyGameLoopTransition(): Promise<boolean> {
    const playstate = this.wl_game.playstate;
    if (
      playstate !== "ex_completed" &&
      playstate !== "ex_secretlevel" &&
      playstate !== "ex_died" &&
      playstate !== "ex_victorious"
    ) {
      return false;
    }

    this.transitionInProgress = true;
    try {
      if (playstate === "ex_completed" || playstate === "ex_secretlevel") {
        const applied = this.wl_game.ApplyCompletedLevelTransition();
        if (!applied) {
          return false;
        }

        const level = this.wl_game.gamestate.level;
        this.id_us.US_Print(
          `GameLoop ${playstate} mapon ${this.wl_game.gamestate.mapon} level ${level}`
        );
        await this.SetupTransitionLevel(level, playstate);
        return true;
      }

      if (playstate === "ex_died") {
        const applied = this.wl_game.ApplyDiedTransition();
        if (!applied) {
          return false;
        }

        this.id_us.US_Print(`GameLoop ex_died lives ${this.wl_game.gamestate.lives}`);
        if (this.wl_game.gamestate.lives > -1) {
          await this.SetupTransitionLevel(this.wl_game.gamestate.level, playstate);
        }

        return true;
      }

      const applied = this.wl_game.ApplyVictoriousTransition();
      if (applied && this.wl_game.victorySummary) {
        const summary = this.wl_game.victorySummary;
        this.id_us.US_Print(
          `GameLoop ex_victorious time ${formatClockSeconds(summary.totalTime)} avg ${summary.averageKill}/${summary.averageSecret}/${summary.averageTreasure}`
        );
      }

      return applied;
    } finally {
      this.transitionInProgress = false;
    }
  }

  private async SetupTransitionLevel(level: number, playstate: SourcePlayState): Promise<void> {
    try {
      const wolfMap = await this.id_ca.CA_CacheMap(level);
      this.wl_game.SetupGameLevel(level, wolfMap);
      this.id_us.US_Print(
        `SetupGameLevel after ${playstate}: ${wolfMap.header.name || `map ${wolfMap.index}`}`
      );
    } catch (error) {
      this.wl_game.SetupGameLevel(level);
      this.id_us.US_Print(
        error instanceof Error
          ? `SetupGameLevel after ${playstate}: fallback map: ${error.message}`
          : `SetupGameLevel after ${playstate}: fallback map`
      );
    }
  }

  ApplyCompletedLevelTransition(): boolean {
    const applied = this.wl_game.ApplyCompletedLevelTransition();
    if (applied) {
      this.id_us.US_Print(
        `ApplyCompletedLevelTransition mapon ${this.wl_game.gamestate.mapon} level ${this.wl_game.gamestate.level}`
      );
    }

    this.RenderUi();
    return applied;
  }

  ApplyDiedTransition(): boolean {
    const applied = this.wl_game.ApplyDiedTransition();
    if (applied) {
      this.id_us.US_Print(`ApplyDiedTransition lives ${this.wl_game.gamestate.lives}`);
    }

    this.RenderUi();
    return applied;
  }

  ApplyVictoriousTransition(): boolean {
    const applied = this.wl_game.ApplyVictoriousTransition();
    if (applied && this.wl_game.victorySummary) {
      const summary = this.wl_game.victorySummary;
      this.id_us.US_Print(
        `ApplyVictoriousTransition time ${formatClockSeconds(summary.totalTime)} avg ${summary.averageKill}/${summary.averageSecret}/${summary.averageTreasure}`
      );
    }

    this.RenderUi();
    return applied;
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
        this.demoStepIndex = index;
        this.RenderUi();
        await this.RunDemoStep(step, index);
      }

      statusLine.textContent = `Demo complete: ${this.demoPlan.name}`;
    } catch (error) {
      statusLine.textContent = error instanceof Error ? error.message : "Demo failed";
    } finally {
      this.demoRunning = false;
      this.demoStepIndex = null;
      this.RenderUi();
    }
  }

  async ExportPng(label: string, autoDownload = true): Promise<void> {
    const blob = await this.id_vl.VL_ScreenToBlob();
    this.RegisterArtifact(blob, "frame", label, "png", autoDownload);
  }

  async ExportWav(label: string, autoDownload = true): Promise<void> {
    const wav = this.id_sd.SD_ExportWav();
    this.RegisterArtifact(
      new Blob([new Uint8Array(wav)], {
        type: "audio/wav"
      }),
      "audio",
      label,
      "wav",
      autoDownload
    );
  }

  StateSnapshot(): Record<string, unknown> {
    return {
      artifacts: this.artifactRecords.map((artifact) => ({ ...artifact })),
      audioSamples: this.id_sd.sampleCount,
      demo: this.demoPlan
        ? {
            autoStart: this.demoPlan.autoStart ?? true,
            name: this.demoPlan.name,
            running: this.demoRunning,
            stepIndex: this.demoStepIndex,
            steps: this.demoPlan.steps
          }
        : null,
      transitionInProgress: this.transitionInProgress,
      game: this.wl_game.gamestate,
      map: this.wl_game.mapMetadata,
      areas: {
        byPlayer: [...this.wl_game.map.areasByPlayer].sort((left, right) => left - right),
        connections: [...this.wl_game.map.areaConnectCounts.entries()].map(([key, count]) => {
          const [area1, area2] = parseAreaConnectionKey(key);
          return {
            area1,
            area2,
            count
          };
        }),
        playerArea: this.wl_game.PlayerAreaNumber()
      },
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
      madeNoise: this.wl_game.madeNoise,
      facecount: this.wl_game.facecount,
      gotgatgun: this.wl_game.gotgatgun,
      anglefrac: this.wl_game.anglefrac,
      thrustSpeed: this.wl_game.thrustSpeed,
      damage: {
        killer: this.wl_game.killer,
        lastAttacker: this.wl_game.lastAttacker
      },
      palette: {
        bonuscount: this.wl_game.bonuscount,
        damagecount: this.wl_game.damagecount,
        shift: this.wl_game.paletteShift ? { ...this.wl_game.paletteShift } : null
      },
      intermission: {
        highScores: this.wl_game.highScores.map((score) => ({ ...score })),
        lastHighScoreCheck: this.wl_game.lastHighScoreCheck ? { ...this.wl_game.lastHighScoreCheck } : null,
        lastLevelCompletion: this.wl_game.lastLevelCompletion ? { ...this.wl_game.lastLevelCompletion } : null,
        levelRatios: this.wl_game.levelRatios.map((ratio) => ({ ...ratio })),
        victorySummary: this.wl_game.victorySummary ? { ...this.wl_game.victorySummary } : null
      },
      objects: {
        actors: this.wl_game.map.actors.length,
        actorsDetail: this.wl_game.map.actors.map((actor) => ({
          active: actor.active,
          ambush: actor.ambush,
          area: this.wl_game.ActorAreaNumber(actor),
          attackMode: actor.attackMode,
          distance: actor.distance,
          dir: actor.dir,
          firstAttack: actor.firstAttack,
          hitpoints: actor.hitpoints,
          kind: actor.kind,
          mode: actor.mode,
          reactionTime: actor.reactionTime,
          shootable: actor.shootable,
          speed: actor.speed,
          stateIndex: actor.stateIndex,
          stateName: actor.stateName,
          stateShapenum: actor.stateShapenum,
          stateTics: actor.stateTics,
          targetX: actor.targetX,
          targetY: actor.targetY,
          tile: actor.tile,
          visible: actor.visible,
          victoryPhase: actor.victoryPhase ?? null,
          victoryTilesRemaining: actor.victoryTilesRemaining ?? null,
          x: actor.x,
          y: actor.y
        })),
        projectiles: this.wl_game.map.projectiles.length,
        projectilesDetail: this.wl_game.map.projectiles.map((projectile) => ({
          angle: projectile.angle,
          kind: projectile.kind,
          speed: projectile.speed,
          stateIndex: projectile.stateIndex,
          stateName: projectile.stateName,
          stateShapenum: projectile.stateShapenum,
          stateTics: projectile.stateTics,
          x: projectile.x,
          y: projectile.y
        })),
        pushWall: this.wl_game.map.pushWall
          ? {
              dir: this.wl_game.map.pushWall.dir,
              oldTile: this.wl_game.map.pushWall.oldTile,
              pos: this.wl_game.map.pushWall.pos,
              state: this.wl_game.map.pushWall.state,
              x: this.wl_game.map.pushWall.x,
              y: this.wl_game.map.pushWall.y
            }
          : null,
        killedActors: this.wl_game.gamestate.killcount,
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
      soundManager: this.id_sd.StateSnapshot(),
      playstate: this.wl_game.playstate,
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
      "state",
      label,
      "bin",
      autoDownload
    );
  }

  private GameLoop(time: number): void {
    const elapsed = Math.min(100, time - this.lastTime);
    this.lastTime = time;
    if (!this.demoRunning) {
      void this.Tick(elapsed);
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
    const ticMs = 1000 / SOURCE_TICS_PER_SECOND;
    let remaining = milliseconds;
    let steps = 0;
    while (remaining > 0) {
      const step = Math.min(ticMs, remaining);
      await this.Tick(step);
      remaining -= step;
      steps += 1;
      if (steps % 64 === 0) {
        await delay(0);
      }
    }

    await delay(0);
  }

  private RegisterArtifact(
    blob: Blob,
    kind: ArtifactKind,
    label: string,
    extension: string,
    autoDownload: boolean
  ): void {
    const fileName = artifactFileName(kind, label, extension);
    const url = URL.createObjectURL(blob);
    this.artifactUrls.push(url);
    const record: ArtifactRecord = {
      bytes: blob.size,
      fileName,
      kind,
      label,
      mimeType: blob.type || "application/octet-stream",
      sequence: this.artifactSequence,
      ticcount: this.wl_game.gamestate.ticcount
    };
    this.artifactSequence += 1;
    this.artifactRecords.push(record);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.dataset.artifactBytes = String(record.bytes);
    link.dataset.artifactKind = record.kind;
    link.dataset.artifactLabel = record.label;
    link.dataset.artifactSequence = String(record.sequence);
    link.dataset.artifactTiccount = String(record.ticcount);
    link.textContent = `${fileName} (${formatBytes(blob.size)})`;
    artifactList.prepend(link);
    this.RenderUi();

    if (autoDownload) {
      link.click();
    }
  }

  private RenderUi(): void {
    mapState.textContent = this.wl_game.mapMetadata;
    objectState.textContent = this.wl_game.objectMetadata;
    runtimeState.textContent = `tic ${this.wl_game.gamestate.ticcount} time ${this.wl_game.gamestate.timecount} / ${this.wl_game.gamestate.x.toFixed(2)}, ${this.wl_game.gamestate.y.toFixed(2)} / hp ${this.wl_game.gamestate.health} ammo ${this.wl_game.gamestate.ammo} wp ${this.wl_game.gamestate.weapon}:${this.wl_game.gamestate.weaponframe} atk ${this.wl_game.gamestate.attackframe}:${this.wl_game.gamestate.attackcount} keys ${this.wl_game.gamestate.keys} state ${this.wl_game.playstate}`;
    demoState.textContent = this.demoPlan
      ? this.demoRunning
        ? `Running ${this.demoPlan.name} ${this.demoStepIndex === null ? "" : `${this.demoStepIndex + 1}/`}${this.demoPlan.steps.length}`
        : `${this.demoPlan.name} (${this.demoPlan.steps.length} steps)`
      : "No plan";
    const latestArtifact = this.artifactRecords[this.artifactRecords.length - 1];
    artifactState.textContent = latestArtifact
      ? `${this.artifactRecords.length} / ${latestArtifact.fileName} / tic ${latestArtifact.ticcount}`
      : "0";
    artifactList.dataset.artifactCount = String(this.artifactRecords.length);
    artifactList.dataset.latestArtifact = latestArtifact?.fileName ?? "";
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
    if (!this.wl_game.IsStillPlaying()) {
      this.wl_draw.ThreeDRefresh(this.wl_game);
      this.id_sd.SD_Service(false, ticMs);
      return;
    }

    this.wl_game.BeginActorThinking();
    const moved = this.wl_game.PlayPlayerInput(this.id_in, ticMs, tics);
    this.wl_game.MoveDoors(tics);
    this.wl_game.MovePushWall(tics);
    this.wl_game.MoveActors(tics);
    this.wl_game.MoveProjectiles(tics);
    this.wl_game.UpdatePaletteShifts(tics);
    this.wl_draw.ThreeDRefresh(this.wl_game);
    this.wl_game.AdvanceTime(tics);
    this.id_sd.SD_Service(moved, ticMs);
  }
}

class WLGame {
  anglefrac = 0;
  facecount = 0;
  gotgatgun = false;
  bonuscount = 0;
  damagecount = 0;
  map = createFallbackMap();
  madeNoise = false;
  paletteShift: SourcePaletteShift | null = null;
  thrustSpeed = 0;
  highScores: SourceHighScore[] = createDefaultHighScores();
  lastHighScoreCheck: SourceHighScoreCheck | null = null;
  lastLevelCompletion: SourceLevelCompletionSummary | null = null;
  levelRatios: SourceLevelRatio[] = createLevelRatios();
  lastAttacker: DamageSource | null = null;
  killer: DamageSource | null = null;
  playstate: SourcePlayState = "ex_stillplaying";
  victorySummary: SourceVictorySummary | null = null;
  private attackButtonHeld = false;
  private bossDeathCamCountdown = 0;
  private completedLevelTransitionApplied = false;
  private diedTransitionApplied = false;
  private rndIndex = 0;
  private useButtonHeld = false;
  private victoriousTransitionApplied = false;
  private victorySpinTargetY: number | null = null;

  readonly gamestate = {
    angle: 0,
    ammo: STARTAMMO,
    attackcount: 0,
    attackframe: 0,
    bestweapon: WP_PISTOL,
    chosenweapon: WP_PISTOL,
    difficulty: "medium" as SourceDifficulty,
    episode: 0,
    faceframe: 0,
    health: MAX_HEALTH,
    keys: 0,
    killx: 0,
    killy: 0,
    killcount: 0,
    killtotal: 0,
    level: 0,
    lives: 3,
    mapon: 0,
    nextextra: EXTRAPOINTS,
    oldscore: 0,
    playstate: "ex_stillplaying" as SourcePlayState,
    score: 0,
    secretcount: 0,
    secrettotal: 0,
    timecount: 0,
    treasurecount: 0,
    treasuretotal: 0,
    ticcount: 0,
    victoryflag: false,
    weapon: WP_PISTOL,
    weaponframe: 0,
    x: 3.5,
    y: 3.5
  };

  constructor(
    private readonly id_sd: IDSD,
    difficulty: SourceDifficulty = "medium"
  ) {
    this.NewGameState(difficulty, 0);
  }

  get mapMetadata(): string {
    return `${this.map.name} ${this.map.width}x${this.map.height} / ${this.gamestate.difficulty}`;
  }

  get objectMetadata(): string {
    const movingDoors = this.map.doors.filter((door) => door.action !== "closed").length;
    const shootableActors = this.map.actors.filter((actor) => actor.shootable).length;
    const pushWall = this.map.pushWall ? ` / pushwall ${this.map.pushWall.state}:${this.map.pushWall.pos}` : "";
    return `${this.map.doors.length} doors (${movingDoors} active) / ${this.map.areasByPlayer.size} areas / ${this.map.statics.length} statics / ${shootableActors}/${this.map.actors.length} live actors / ${this.map.projectiles.length} projectiles${pushWall}`;
  }

  BeginActorThinking(): void {
    // WL_PLAY.C clears madenoise once per play-loop pass before actor thinking.
    this.madeNoise = false;
  }

  AdvanceTime(tics: number): void {
    // WL_PLAY.C PlayLoop adds tics to gamestate.TimeCount once per rendered loop.
    this.gamestate.timecount += tics;
  }

  ClearPaletteShifts(): void {
    this.bonuscount = 0;
    this.damagecount = 0;
    this.paletteShift = null;
  }

  StartBonusFlash(): void {
    // WL_PLAY.C StartBonusFlash seeds the white shift for three 6-tic steps.
    this.bonuscount = SOURCE_NUM_WHITE_SHIFTS * SOURCE_WHITE_TICS;
  }

  StartDamageFlash(damage: number): void {
    this.damagecount += Math.max(0, Math.trunc(damage));
  }

  UpdatePaletteShifts(tics: number): void {
    let red = 0;
    let white = 0;

    if (this.bonuscount > 0) {
      white = Math.floor(this.bonuscount / SOURCE_WHITE_TICS) + 1;
      white = Math.min(white, SOURCE_NUM_WHITE_SHIFTS);
      this.bonuscount = Math.max(0, this.bonuscount - tics);
    }

    if (this.damagecount > 0) {
      red = Math.floor(this.damagecount / 10) + 1;
      red = Math.min(red, SOURCE_NUM_RED_SHIFTS);
      this.damagecount = Math.max(0, this.damagecount - tics);
    }

    if (red > 0) {
      this.paletteShift = { kind: "red", level: red };
    } else if (white > 0) {
      this.paletteShift = { kind: "white", level: white };
    } else {
      this.paletteShift = null;
    }
  }

  IsStillPlaying(): boolean {
    return this.playstate === "ex_stillplaying";
  }

  NewGameState(difficulty: SourceDifficulty = this.gamestate.difficulty, episode = 0): void {
    this.attackButtonHeld = false;
    this.bossDeathCamCountdown = 0;
    this.completedLevelTransitionApplied = false;
    this.diedTransitionApplied = false;
    this.lastHighScoreCheck = null;
    this.lastLevelCompletion = null;
    this.levelRatios = createLevelRatios();
    this.anglefrac = 0;
    this.facecount = 0;
    this.gotgatgun = false;
    this.ClearPaletteShifts();
    this.lastAttacker = null;
    this.killer = null;
    this.madeNoise = false;
    this.playstate = "ex_stillplaying";
    this.rndIndex = 0;
    this.thrustSpeed = 0;
    this.useButtonHeld = false;
    this.victoriousTransitionApplied = false;
    this.victorySummary = null;
    this.victorySpinTargetY = null;

    this.gamestate.ammo = STARTAMMO;
    this.gamestate.attackcount = 0;
    this.gamestate.attackframe = 0;
    this.gamestate.bestweapon = WP_PISTOL;
    this.gamestate.chosenweapon = WP_PISTOL;
    this.gamestate.difficulty = difficulty;
    this.gamestate.episode = episode;
    this.gamestate.faceframe = 0;
    this.gamestate.health = MAX_HEALTH;
    this.gamestate.keys = 0;
    this.gamestate.killcount = 0;
    this.gamestate.killtotal = 0;
    this.gamestate.killx = 0;
    this.gamestate.killy = 0;
    this.gamestate.level = episode * 10;
    this.gamestate.lives = 3;
    this.gamestate.mapon = 0;
    this.gamestate.nextextra = EXTRAPOINTS;
    this.gamestate.oldscore = 0;
    this.gamestate.playstate = "ex_stillplaying";
    this.gamestate.score = 0;
    this.gamestate.secretcount = 0;
    this.gamestate.secrettotal = 0;
    this.gamestate.timecount = 0;
    this.gamestate.ticcount = 0;
    this.gamestate.treasurecount = 0;
    this.gamestate.treasuretotal = 0;
    this.gamestate.victoryflag = false;
    this.gamestate.weapon = WP_PISTOL;
    this.gamestate.weaponframe = 0;
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
        areaConnectCounts: new Map(),
        areasByPlayer: new Set(),
        blockingStaticKeys,
        doors,
        height: wolfMap.header.height,
        killTotal: scan.killTotal,
        name: `WL6 ${wolfMap.index} ${wolfMap.header.name || "unnamed"}`,
        objects: new Uint16Array(wolfMap.planes[1]),
        projectiles: [],
        pushWall: null,
        secretTotal: scan.secretTotal,
        source: "wl6",
        statics: scan.statics,
        treasureTotal: scan.treasureTotal,
        walls: new Uint16Array(wolfMap.planes[0]),
        width: wolfMap.header.width
      };
      spawn = scan.spawn ?? findPlayerSpawn(wolfMap);
    } else if (this.map.source !== "wl6") {
      this.map = createFallbackMap();
    }

    this.gamestate.angle = normalizeAngle(spawn.angle);
    this.anglefrac = 0;
    this.gotgatgun = false;
    this.gamestate.attackcount = 0;
    this.gamestate.attackframe = 0;
    this.attackButtonHeld = false;
    this.useButtonHeld = false;
    this.bossDeathCamCountdown = 0;
    this.ClearPaletteShifts();
    this.completedLevelTransitionApplied = false;
    this.diedTransitionApplied = false;
    this.madeNoise = false;
    this.lastAttacker = null;
    this.killer = null;
    this.rndIndex = 0;
    this.victorySpinTargetY = null;
    this.gamestate.episode = Math.floor(level / 10);
    this.gamestate.faceframe = 0;
    this.gamestate.killx = 0;
    this.gamestate.killy = 0;
    this.gamestate.killcount = 0;
    this.gamestate.killtotal = this.map.killTotal;
    this.gamestate.level = level;
    this.gamestate.mapon = level % 10;
    this.SetPlayState("ex_stillplaying");
    this.gamestate.secretcount = 0;
    this.gamestate.secrettotal = this.map.secretTotal;
    this.gamestate.timecount = 0;
    this.gamestate.treasurecount = 0;
    this.gamestate.treasuretotal = this.map.treasureTotal;
    this.gamestate.ticcount = 0;
    this.gamestate.victoryflag = false;
    this.gamestate.weaponframe = 0;
    this.gamestate.x = spawn.x;
    this.gamestate.y = spawn.y;
    this.ConnectAreas();
  }

  PlayPlayerInput(id_in: IDIN, ticMs: number, tics: number): boolean {
    const attackDown = id_in.IN_AttackDown();
    const useDown = id_in.IN_KeyDown(USE_KEY_CODE);
    const wasAttacking = this.gamestate.attackcount > 0;
    let moved = false;

    if (wasAttacking) {
      this.UpdateFace(tics);
      if (this.gamestate.victoryflag) {
        this.UpdateVictoryCamera(tics);
        this.gamestate.ticcount += 1;
        return false;
      }

      moved = this.ControlMovement(id_in, tics);
      if (this.gamestate.victoryflag) {
        return moved;
      }

      this.T_Attack(tics, attackDown && this.attackButtonHeld);
    } else {
      if (this.gamestate.victoryflag) {
        this.UpdateVictoryCamera(tics);
        this.gamestate.ticcount += 1;
        return false;
      }

      this.UpdateFace(tics);
      this.CheckWeaponChange(id_in);

      if (useDown) {
        this.Cmd_Use();
      }

      if (attackDown && !this.attackButtonHeld) {
        this.Cmd_Fire();
      }

      moved = this.ControlMovement(id_in, tics);
    }

    if (!attackDown) {
      this.attackButtonHeld = false;
    }

    if (!useDown) {
      this.useButtonHeld = false;
    } else if (!wasAttacking) {
      this.useButtonHeld = true;
    }

    return moved;
  }

  private UpdateFace(tics: number): void {
    if (this.id_sd.SD_SoundPlaying() === GETGATLINGSND) {
      return;
    }

    // WL_AGENT.C UpdateFace consumes the table RNG while waiting to change BJ's face frame.
    this.facecount += tics;
    if (this.facecount <= this.US_RndT()) {
      return;
    }

    let faceframe = this.US_RndT() >> 6;
    if (faceframe === 3) {
      faceframe = 1;
    }

    this.gamestate.faceframe = faceframe;
    this.facecount = 0;
  }

  CheckWeaponChange(id_in: IDIN): void {
    if (this.gamestate.ammo === 0) {
      return;
    }

    for (let weapon = WP_KNIFE; weapon <= this.gamestate.bestweapon; weapon += 1) {
      if (id_in.IN_KeyDown(49 + weapon)) {
        this.gamestate.weapon = weapon;
        this.gamestate.chosenweapon = weapon;
        return;
      }
    }
  }

  ControlMovement(id_in: IDIN, tics: number): boolean {
    const sourceMove = id_in.IN_KeyDown(RUN_KEY_CODE) ? SOURCE_RUNMOVE : SOURCE_BASEMOVE;
    const rightDown = id_in.IN_KeyDown(39) || id_in.IN_KeyDown(68);
    const leftDown = id_in.IN_KeyDown(37) || id_in.IN_KeyDown(65);
    const forwardDown = id_in.IN_KeyDown(38) || id_in.IN_KeyDown(87);
    const backwardDown = id_in.IN_KeyDown(40) || id_in.IN_KeyDown(83);
    const controlX = clampSourceControl(
      (rightDown ? sourceMove * tics : 0) - (leftDown ? sourceMove * tics : 0),
      tics
    );
    const controlY = clampSourceControl(
      (backwardDown ? sourceMove * tics : 0) - (forwardDown ? sourceMove * tics : 0),
      tics
    );
    let moved = false;
    this.thrustSpeed = 0;

    const strafeDown = id_in.IN_KeyDown(STRAFE_KEY_CODE);
    if (strafeDown) {
      if (controlX > 0) {
        moved = this.Thrust(this.gamestate.angle + Math.PI / 2, controlX * SOURCE_FORWARD_MOVESCALE) || moved;
      } else if (controlX < 0) {
        moved = this.Thrust(this.gamestate.angle - Math.PI / 2, -controlX * SOURCE_FORWARD_MOVESCALE) || moved;
      }
    } else {
      this.anglefrac += controlX;
      const angleUnits = Math.trunc(this.anglefrac / SOURCE_ANGLESCALE);
      this.anglefrac -= angleUnits * SOURCE_ANGLESCALE;
      if (angleUnits !== 0) {
        this.gamestate.angle += sourceAngleUnitsToRadians(angleUnits);
        moved = true;
      }
    }

    if (controlY < 0) {
      moved = this.Thrust(this.gamestate.angle, -controlY * SOURCE_FORWARD_MOVESCALE) || moved;
    } else if (controlY > 0) {
      moved = this.Thrust(this.gamestate.angle + Math.PI, controlY * SOURCE_BACK_MOVESCALE) || moved;
    }

    this.gamestate.angle = normalizeAngle(this.gamestate.angle);
    this.ConnectAreas();
    this.CheckVictoryTile();
    this.gamestate.ticcount += 1;
    return moved;
  }

  private Thrust(angle: number, speed: number): boolean {
    this.thrustSpeed += speed;
    const clippedSpeed = speed >= SOURCE_MINDIST * 2 ? SOURCE_MINDIST * 2 - 1 : speed;
    const moveScale = clippedSpeed / TILEGLOBAL;
    return this.ClipMove(Math.cos(angle) * moveScale, Math.sin(angle) * moveScale);
  }

  private ClipMove(xmove: number, ymove: number): boolean {
    const baseX = this.gamestate.x;
    const baseY = this.gamestate.y;
    const targetX = baseX + xmove;
    const targetY = baseY + ymove;

    if (this.TryPlayerMove(targetX, targetY)) {
      this.gamestate.x = targetX;
      this.gamestate.y = targetY;
      return true;
    }

    if (!this.id_sd.SD_SoundPlaying()) {
      this.id_sd.SD_PlaySound("HITWALLSND");
    }

    if (this.TryPlayerMove(targetX, baseY)) {
      this.gamestate.x = targetX;
      this.gamestate.y = baseY;
      return true;
    }

    if (this.TryPlayerMove(baseX, targetY)) {
      this.gamestate.x = baseX;
      this.gamestate.y = targetY;
      return true;
    }

    this.gamestate.x = baseX;
    this.gamestate.y = baseY;
    return false;
  }

  private TryPlayerMove(x: number, y: number): boolean {
    const xl = Math.floor(x - SOURCE_PLAYERSIZE_TILES);
    const xh = Math.floor(x + SOURCE_PLAYERSIZE_TILES);
    const yl = Math.floor(y - SOURCE_PLAYERSIZE_TILES);
    const yh = Math.floor(y + SOURCE_PLAYERSIZE_TILES);

    for (let tileY = yl; tileY <= yh; tileY += 1) {
      for (let tileX = xl; tileX <= xh; tileX += 1) {
        if (this.GetTile(tileX, tileY) !== 0 || this.map.blockingStaticKeys.has(tileKey(tileX, tileY))) {
          return false;
        }
      }
    }

    for (const actor of this.map.actors) {
      if (!actor.shootable) {
        continue;
      }

      const actorTileX = Math.floor(actor.x);
      const actorTileY = Math.floor(actor.y);
      if (actorTileX < xl - 1 || actorTileX > xh + 1 || actorTileY < yl - 1 || actorTileY > yh + 1) {
        continue;
      }

      const actorCenterX = actor.x + 0.5;
      const actorCenterY = actor.y + 0.5;
      if (
        x - actorCenterX >= -MINACTORDIST_TILES &&
        x - actorCenterX <= MINACTORDIST_TILES &&
        y - actorCenterY >= -MINACTORDIST_TILES &&
        y - actorCenterY <= MINACTORDIST_TILES
      ) {
        return false;
      }
    }

    return true;
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
    if ((this.map.objects[target.y * this.map.width + target.x] ?? 0) === PUSHABLETILE) {
      return this.PushWall(target.x, target.y, target.dir);
    }

    const wallTile = this.GetWallTile(target.x, target.y);
    if (!this.useButtonHeld && wallTile === ELEVATORTILE && target.elevatorOk) {
      this.useButtonHeld = true;
      this.SetWallTile(target.x, target.y, ELEVATORTILE + 1);
      this.SetPlayState(this.PlayerFloorTile() === ALTELEVATORTILE ? "ex_secretlevel" : "ex_completed");
      this.id_sd.SD_PlaySound("LEVELDONESND");
      return true;
    }

    const door = this.DoorAt(target.x, target.y);
    if (!this.useButtonHeld && door) {
      this.useButtonHeld = true;
      this.OperateDoor(door.index);
      return true;
    }

    this.id_sd.SD_PlaySound("DONOTHINGSND");
    return false;
  }

  ApplyCompletedLevelTransition(): boolean {
    if (
      this.completedLevelTransitionApplied
      || (this.playstate !== "ex_completed" && this.playstate !== "ex_secretlevel")
    ) {
      return false;
    }

    this.RecordLevelCompleted();
    this.gamestate.keys = 0;
    this.gamestate.oldscore = this.gamestate.score;

    if (this.gamestate.mapon === 9) {
      this.gamestate.mapon = ELEVATOR_BACK_TO[this.gamestate.episode] ?? this.gamestate.mapon;
    } else if (this.playstate === "ex_secretlevel") {
      this.gamestate.mapon = 9;
    } else {
      this.gamestate.mapon += 1;
    }

    this.gamestate.level = this.gamestate.episode * 10 + this.gamestate.mapon;
    this.completedLevelTransitionApplied = true;
    return true;
  }

  ApplyVictoriousTransition(): boolean {
    if (this.victoriousTransitionApplied || this.playstate !== "ex_victorious") {
      return false;
    }

    this.victorySummary = this.CalculateVictorySummary();
    this.CheckHighScore(this.gamestate.score, this.gamestate.mapon + 1);
    this.victoriousTransitionApplied = true;
    return true;
  }

  private RecordLevelCompleted(): void {
    const mapon = this.gamestate.mapon;
    const ratios = this.CurrentLevelRatios();

    if (mapon < SOURCE_LEVEL_RATIO_COUNT) {
      const parSeconds = WL6_PAR_TIMES_SECONDS[this.gamestate.episode * 10 + mapon] ?? 0;
      const timeLeft = this.gamestate.timecount < parSeconds * SOURCE_TICS_PER_SECOND
        ? Math.max(0, parSeconds - ratios.time)
        : 0;
      const bonus =
        timeLeft * SOURCE_PAR_AMOUNT
        + (ratios.kill === 100 ? SOURCE_PERCENT_100_BONUS : 0)
        + (ratios.secret === 100 ? SOURCE_PERCENT_100_BONUS : 0)
        + (ratios.treasure === 100 ? SOURCE_PERCENT_100_BONUS : 0);

      this.GivePoints(bonus);
      this.levelRatios[mapon] = ratios;
      this.lastLevelCompletion = {
        ...ratios,
        bonus,
        mapon,
        timeLeft,
        type: "regular"
      };
      return;
    }

    this.GivePoints(SOURCE_SECRET_FLOOR_BONUS);
    this.lastLevelCompletion = {
      ...ratios,
      bonus: SOURCE_SECRET_FLOOR_BONUS,
      mapon,
      timeLeft: 0,
      type: "secret"
    };
  }

  private CurrentLevelRatios(): SourceLevelRatio {
    const time = Math.min(Math.trunc(this.gamestate.timecount / SOURCE_TICS_PER_SECOND), 99 * 60);
    return {
      kill: this.gamestate.killtotal ? Math.trunc((this.gamestate.killcount * 100) / this.gamestate.killtotal) : 0,
      secret: this.gamestate.secrettotal
        ? Math.trunc((this.gamestate.secretcount * 100) / this.gamestate.secrettotal)
        : 0,
      time,
      treasure: this.gamestate.treasuretotal
        ? Math.trunc((this.gamestate.treasurecount * 100) / this.gamestate.treasuretotal)
        : 0
    };
  }

  private CalculateVictorySummary(): SourceVictorySummary {
    const totals = this.levelRatios.reduce<SourceLevelRatio>(
      (sum, ratio) => ({
        kill: sum.kill + ratio.kill,
        secret: sum.secret + ratio.secret,
        time: sum.time + ratio.time,
        treasure: sum.treasure + ratio.treasure
      }),
      { kill: 0, secret: 0, time: 0, treasure: 0 }
    );
    let displayMinutes = Math.trunc(totals.time / 60);
    let displaySeconds = totals.time % 60;
    if (displayMinutes > 99) {
      displayMinutes = 99;
      displaySeconds = 99;
    }

    return {
      averageKill: Math.trunc(totals.kill / SOURCE_LEVEL_RATIO_COUNT),
      averageSecret: Math.trunc(totals.secret / SOURCE_LEVEL_RATIO_COUNT),
      averageTreasure: Math.trunc(totals.treasure / SOURCE_LEVEL_RATIO_COUNT),
      displayMinutes,
      displaySeconds,
      highScoreCompleted: this.gamestate.mapon + 1,
      score: this.gamestate.score,
      totalTime: totals.time
    };
  }

  private CheckHighScore(score: number, completed: number): SourceHighScoreCheck {
    const myScore: SourceHighScore = {
      completed,
      episode: this.gamestate.episode,
      name: "",
      score
    };
    let rank: number | null = null;

    for (let index = 0; index < MAX_SCORES; index += 1) {
      const existing = this.highScores[index];
      if (!existing) {
        continue;
      }

      if (myScore.score > existing.score || (myScore.score === existing.score && myScore.completed > existing.completed)) {
        this.highScores.splice(index, 0, myScore);
        this.highScores = this.highScores.slice(0, MAX_SCORES);
        rank = index;
        break;
      }
    }

    this.lastHighScoreCheck = {
      ...myScore,
      inserted: rank !== null,
      rank
    };
    return this.lastHighScoreCheck;
  }

  ApplyDiedTransition(): boolean {
    if (this.diedTransitionApplied || this.playstate !== "ex_died") {
      return false;
    }

    // WL_GAME.C Died() removes the weapon during the death view, then spends a life.
    this.gamestate.weapon = -1;
    this.id_sd.SD_PlaySound("PLAYERDEATHSND");
    this.gamestate.lives -= 1;

    if (this.gamestate.lives > -1) {
      // WL_GAME.C GameLoop restores the level-start score before replaying a level after death.
      this.gamestate.score = this.gamestate.oldscore;
      this.gamestate.health = MAX_HEALTH;
      this.gamestate.weapon = WP_PISTOL;
      this.gamestate.bestweapon = WP_PISTOL;
      this.gamestate.chosenweapon = WP_PISTOL;
      this.gamestate.ammo = STARTAMMO;
      this.gamestate.keys = 0;
      this.gamestate.attackframe = 0;
      this.gamestate.attackcount = 0;
      this.gamestate.weaponframe = 0;
    } else {
      this.CheckHighScore(this.gamestate.score, this.gamestate.mapon + 1);
    }

    this.diedTransitionApplied = true;
    return true;
  }

  PushWall(checkX: number, checkY: number, dir: PushWallDirection): boolean {
    if (
      this.map.pushWall ||
      checkX < 0 ||
      checkY < 0 ||
      checkX >= this.map.width ||
      checkY >= this.map.height
    ) {
      return false;
    }

    const oldTile = this.GetWallTile(checkX, checkY);
    if (oldTile === 0) {
      return false;
    }

    const delta = pushWallDelta(dir);
    const nextX = checkX + delta.dx;
    const nextY = checkY + delta.dy;
    if (!this.CanPushWallEnterTile(nextX, nextY)) {
      this.id_sd.SD_PlaySound("NOWAYSND");
      return false;
    }

    this.SetWallTile(nextX, nextY, oldTile);
    this.map.objects[checkY * this.map.width + checkX] = 0;
    this.gamestate.secretcount += 1;
    this.map.pushWall = {
      dir,
      oldTile,
      pos: 0,
      state: 1,
      x: checkX,
      y: checkY
    };

    this.id_sd.SD_PlaySound("PUSHWALLSND");
    return true;
  }

  MoveDoors(tics: number): void {
    // WL_ACT1.C MoveDoors stops doors during the victory sequence.
    if (this.gamestate.victoryflag) {
      return;
    }

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

  MovePushWall(tics: number): void {
    const pushWall = this.map.pushWall;
    if (!pushWall) {
      return;
    }

    const oldBlock = Math.floor(pushWall.state / 128);
    pushWall.state += tics;
    if (Math.floor(pushWall.state / 128) !== oldBlock) {
      const oldTile = pushWall.oldTile;
      this.SetWallTile(pushWall.x, pushWall.y, this.OpenedAreaTile());
      if (pushWall.state > 256) {
        this.map.pushWall = null;
        return;
      }

      const delta = pushWallDelta(pushWall.dir);
      pushWall.x += delta.dx;
      pushWall.y += delta.dy;
      if (!this.CanPushWallEnterTile(pushWall.x + delta.dx, pushWall.y + delta.dy)) {
        this.SetWallTile(pushWall.x, pushWall.y, oldTile);
        this.map.pushWall = null;
        return;
      }

      this.SetWallTile(pushWall.x, pushWall.y, oldTile);
      this.SetWallTile(pushWall.x + delta.dx, pushWall.y + delta.dy, oldTile);
    }

    pushWall.pos = Math.floor(pushWall.state / 2) & 63;
  }

  private CanPushWallEnterTile(tileX: number, tileY: number): boolean {
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.map.width ||
      tileY >= this.map.height ||
      this.DoorAt(tileX, tileY) ||
      this.GetWallTile(tileX, tileY) !== 0 ||
      this.map.blockingStaticKeys.has(tileKey(tileX, tileY))
    ) {
      return false;
    }

    if (Math.floor(this.gamestate.x) === tileX && Math.floor(this.gamestate.y) === tileY) {
      return false;
    }

    return !this.map.actors.some((actor) => {
      if (!actor.shootable) {
        return false;
      }

      return (
        (Math.floor(actor.x) === tileX && Math.floor(actor.y) === tileY) ||
        (actor.targetX === tileX && actor.targetY === tileY)
      );
    });
  }

  private OpenedAreaTile(): number {
    const playerArea = this.AreaNumberAt(Math.floor(this.gamestate.x), Math.floor(this.gamestate.y));
    return playerArea === null ? 0 : playerArea + AREATILE;
  }

  private SetWallTile(tileX: number, tileY: number, tile: number): void {
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return;
    }

    this.map.walls[tileY * this.map.width + tileX] = tile;
  }

  MoveActors(tics: number): void {
    for (const actor of this.map.actors) {
      // WL_PLAY.C DoActor skips inactive actors until their area is connected to the player.
      if (!actor.active && !this.ActorAreaCanReachPlayer(actor)) {
        continue;
      }

      this.MoveActorState(actor, tics);
    }
  }

  MoveProjectiles(tics: number): void {
    const activeProjectiles: PortProjectile[] = [];
    const spawnedProjectiles: PortProjectile[] = [];
    for (const projectile of this.map.projectiles) {
      if (!this.MoveProjectileState(projectile, tics, spawnedProjectiles)) {
        continue;
      }

      if (this.ProjectileIsEffect(projectile)) {
        activeProjectiles.push(projectile);
      } else if (this.T_Projectile(projectile, tics)) {
        activeProjectiles.push(projectile);
      }
    }

    this.map.projectiles = activeProjectiles.concat(spawnedProjectiles);
  }

  private MoveActorState(actor: PortActor, tics: number): void {
    if (actor.mode === "dying") {
      this.MoveDeathState(actor, tics);
    } else if (actor.mode === "pain") {
      this.MovePainState(actor, tics);
    } else if (actor.mode === "attack") {
      this.MoveAttackState(actor, tics);
    } else if (actor.mode === "ghost") {
      this.MoveGhostState(actor, tics);
    } else if (actor.mode === "victory") {
      this.MoveVictoryState(actor, tics);
    } else if (actor.mode === "boss" || actor.mode === "stand") {
      this.T_Stand(actor, tics);
    } else if (actor.mode === "patrol" || actor.mode === "chase") {
      this.MoveLoopingActorState(actor, tics);
      if (actor.mode === "patrol") {
        this.T_Path(actor, tics);
      } else if (actor.mode === "chase") {
        if (actor.kind === "fake_hitler") {
          this.T_Fake(actor, tics);
        } else if (actor.kind === "fat" || actor.kind === "gift" || actor.kind === "schabbs") {
          this.T_ProjectileBossChase(actor, tics);
        } else {
          this.T_Chase(actor, tics);
        }
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
      const currentFrame = sequence[actor.stateIndex];
      this.RunActorFrameAction(actor, currentFrame);
      if (actor.mode !== "dying") {
        return;
      }

      if (currentFrame?.final) {
        actor.mode = "dead";
        actor.stateTics = 0;
        return;
      }

      const nextIndex = Math.min(actor.stateIndex + 1, sequence.length - 1);
      this.NewActorState(actor, sequence, nextIndex, actor.stateTics);
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

  private MoveGhostState(actor: PortActor, tics: number): void {
    const sequence = ACTOR_GHOST_STATES[actor.kind];
    if (sequence) {
      actor.stateTics -= tics;
      while (actor.stateTics <= 0) {
        const nextIndex = (actor.stateIndex + 1) % sequence.length;
        this.SetActorSequenceState(actor, sequence, nextIndex, "ghost", actor.stateTics);
      }
    }

    this.T_Ghosts(actor, tics);
  }

  private MoveVictoryState(actor: PortActor, tics: number): void {
    if (actor.stateTics === 0) {
      this.RunActorFrameThink(actor, this.VictoryActorFrame(actor), tics);
      return;
    }

    actor.stateTics -= tics;
    while (actor.mode === "victory" && actor.stateTics <= 0) {
      const frame = this.VictoryActorFrame(actor);
      this.RunActorFrameAction(actor, frame);
      if (this.playstate !== "ex_stillplaying") {
        return;
      }

      const sequence = actor.victoryPhase === "jump" ? ACTOR_VICTORY_JUMP_STATES : ACTOR_VICTORY_RUN_STATES;
      const nextIndex =
        actor.victoryPhase === "jump"
          ? Math.min(actor.stateIndex + 1, sequence.length - 1)
          : (actor.stateIndex + 1) % sequence.length;
      this.SetActorSequenceState(actor, sequence, nextIndex, "victory", actor.stateTics);
    }

    this.RunActorFrameThink(actor, this.VictoryActorFrame(actor), tics);
  }

  private VictoryActorFrame(actor: PortActor): ActorStateFrame | undefined {
    const sequence = actor.victoryPhase === "jump" ? ACTOR_VICTORY_JUMP_STATES : ACTOR_VICTORY_RUN_STATES;
    return sequence[actor.stateIndex];
  }

  private MoveAttackState(actor: PortActor, tics: number): void {
    const sequence = ACTOR_ATTACK_STATES[actor.kind];
    if (!sequence) {
      this.StartChaseState(actor);
      return;
    }

    actor.stateTics -= tics;
    while (actor.mode === "attack" && actor.stateTics <= 0) {
      const currentFrame = sequence[actor.stateIndex];
      this.RunActorFrameAction(actor, currentFrame);
      if (actor.mode !== "attack") {
        return;
      }

      if (!currentFrame || currentFrame.nextMode === "chase" || actor.stateIndex >= sequence.length - 1) {
        this.StartChaseState(actor, actor.stateTics);
        return;
      }

      const nextIndex = actor.stateIndex + 1;
      const nextFrame = sequence[nextIndex];
      if (!nextFrame) {
        this.StartChaseState(actor, actor.stateTics);
        return;
      }

      this.SetActorSequenceState(actor, sequence, nextIndex, "attack", actor.stateTics);
    }
  }

  private MoveLoopingActorState(actor: PortActor, tics: number): void {
    const sequence = actor.mode === "patrol" ? ACTOR_PATROL_STATES[actor.kind] : ACTOR_CHASE_STATES[actor.kind];
    if (!sequence) {
      return;
    }

    actor.stateTics -= tics;
    while (actor.stateTics <= 0) {
      const currentFrame = sequence[actor.stateIndex];
      this.RunActorFrameAction(actor, currentFrame);
      if (actor.mode !== "patrol" && actor.mode !== "chase") {
        return;
      }

      const nextIndex = (actor.stateIndex + 1) % sequence.length;
      this.SetActorSequenceState(actor, sequence, nextIndex, actor.mode, actor.stateTics);
    }
  }

  private MoveProjectileState(
    projectile: PortProjectile,
    tics: number,
    spawnedProjectiles: PortProjectile[]
  ): boolean {
    const sequence = PROJECTILE_STATES[projectile.kind];
    projectile.stateTics -= tics;
    while (projectile.stateTics <= 0) {
      let nextIndex = projectile.stateIndex + 1;
      if (nextIndex >= sequence.length) {
        if (!LOOPING_PROJECTILE_KINDS.has(projectile.kind)) {
          return false;
        }

        nextIndex = 0;
      }

      this.SetProjectileSequenceState(projectile, sequence, nextIndex, projectile.stateTics);
      if (projectile.kind === "rocket") {
        this.A_Smoke(projectile, spawnedProjectiles);
      }
    }

    return true;
  }

  private T_Stand(actor: PortActor, tics: number): void {
    this.SightPlayer(actor, tics);
  }

  private T_Projectile(projectile: PortProjectile, tics: number): boolean {
    const move = (projectile.speed * tics) / TILEGLOBAL;
    let dx = Math.cos(projectile.angle) * move;
    let dy = Math.sin(projectile.angle) * move;
    if (dx > TILE_DISTANCE) {
      dx = TILE_DISTANCE;
    }

    if (dy > TILE_DISTANCE) {
      dy = TILE_DISTANCE;
    }

    projectile.x += dx;
    projectile.y += dy;

    if (!this.ProjectileTryMove(projectile)) {
      if (projectile.kind === "rocket") {
        return this.StartProjectileImpact(projectile);
      }

      return false;
    }

    if (
      Math.abs(projectile.x - this.gamestate.x) < PROJECTILESIZE_TILES &&
      Math.abs(projectile.y - this.gamestate.y) < PROJECTILESIZE_TILES
    ) {
      this.TakeProjectileDamage(projectile);
      return false;
    }

    return true;
  }

  private T_Chase(actor: PortActor, tics: number): void {
    if (actor.kind === "dog") {
      this.T_DogChase(actor, tics);
      return;
    }

    let dodge = false;
    if (this.CheckLineToActor(actor)) {
      const dist = this.ActorTileDistance(actor);
      const chance = dist === 0 || (dist === 1 && actor.distance < 0.25) ? 300 : (tics << 4) / Math.max(1, dist);
      if (ACTOR_ATTACK_STATES[actor.kind] && this.US_RndT() < chance && this.StartAttackState(actor)) {
        return;
      }

      dodge = true;
    }

    if (actor.dir === NODIR) {
      if (dodge) {
        this.SelectDodgeDir(actor);
      } else {
        this.SelectChaseDir(actor);
      }

      if (actor.dir === NODIR) {
        return;
      }
    }

    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance < 0) {
        const door = this.map.doors[-actor.distance - 1];
        if (!door) {
          actor.dir = NODIR;
          return;
        }

        this.OpenDoor(door);
        if (door.action !== "open") {
          return;
        }

        actor.distance = TILE_DISTANCE;
      }

      if (actor.distance > 0 && move < actor.distance) {
        this.MoveObj(actor, move, tics);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      if (actor.distance > 0) {
        move -= actor.distance;
      }

      if (dodge) {
        this.SelectDodgeDir(actor);
      } else {
        this.SelectChaseDir(actor);
      }

      if (actor.dir === NODIR) {
        return;
      }
    }
  }

  private T_ProjectileBossChase(actor: PortActor, tics: number): void {
    let dodge = false;
    const dist = this.ActorTileDistance(actor);
    if (this.CheckLineToActor(actor)) {
      if (this.US_RndT() < (tics << 3) && this.StartAttackState(actor)) {
        return;
      }

      dodge = true;
    }

    if (actor.dir === NODIR) {
      if (dodge) {
        this.SelectDodgeDir(actor);
      } else {
        this.SelectChaseDir(actor);
      }

      if (actor.dir === NODIR) {
        return;
      }
    }

    this.MoveSourceChaseLoop(actor, tics, () => {
      if (dist < 4) {
        this.SelectRunDir(actor);
      } else if (dodge) {
        this.SelectDodgeDir(actor);
      } else {
        this.SelectChaseDir(actor);
      }
    });
  }

  private T_Fake(actor: PortActor, tics: number): void {
    if (this.CheckLineToActor(actor) && this.US_RndT() < (tics << 1) && this.StartAttackState(actor)) {
      return;
    }

    if (actor.dir === NODIR) {
      this.SelectDodgeDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }

    this.MoveSourceChaseLoop(actor, tics, () => this.SelectDodgeDir(actor), false);
  }

  private MoveSourceChaseLoop(
    actor: PortActor,
    tics: number,
    selectNextDir: () => void,
    waitForDoors = true
  ): void {
    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance < 0) {
        if (!waitForDoors) {
          actor.dir = NODIR;
          return;
        }

        const door = this.map.doors[-actor.distance - 1];
        if (!door) {
          actor.dir = NODIR;
          return;
        }

        this.OpenDoor(door);
        if (door.action !== "open") {
          return;
        }

        actor.distance = TILE_DISTANCE;
      }

      if (actor.distance > 0 && move < actor.distance) {
        this.MoveObj(actor, move, tics);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      if (actor.distance > 0) {
        move -= actor.distance;
      }

      selectNextDir();
      if (actor.dir === NODIR) {
        return;
      }
    }
  }

  private T_DogChase(actor: PortActor, tics: number): void {
    if (actor.dir === NODIR) {
      this.SelectDodgeDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }

    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (this.ActorWithinDogJumpRange(actor, move) && this.StartAttackState(actor)) {
        return;
      }

      if (actor.distance < 0) {
        const door = this.map.doors[-actor.distance - 1];
        if (!door) {
          actor.dir = NODIR;
          return;
        }

        this.OpenDoor(door);
        if (door.action !== "open") {
          return;
        }

        actor.distance = TILE_DISTANCE;
      }

      if (actor.distance > 0 && move < actor.distance) {
        this.MoveObj(actor, move, tics);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      if (actor.distance > 0) {
        move -= actor.distance;
      }

      this.SelectDodgeDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }
  }

  private T_Ghosts(actor: PortActor, tics: number): void {
    if (actor.dir === NODIR) {
      this.SelectChaseDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }

    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance > 0 && move < actor.distance) {
        this.MoveObj(actor, move, tics);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      if (actor.distance > 0) {
        move -= actor.distance;
      }

      this.SelectChaseDir(actor);
      if (actor.dir === NODIR || actor.distance <= 0) {
        return;
      }
    }
  }

  private T_Path(actor: PortActor, tics: number): void {
    if (this.SightPlayer(actor, tics)) {
      return;
    }

    if (actor.dir === NODIR) {
      this.SelectPathDir(actor);
      if (actor.dir === NODIR) {
        return;
      }
    }

    let move = (actor.speed * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance < 0) {
        const door = this.map.doors[-actor.distance - 1];
        if (!door) {
          actor.dir = NODIR;
          return;
        }

        this.OpenDoor(door);
        if (door.action !== "open") {
          return;
        }

        actor.distance = TILE_DISTANCE;
      }

      if (actor.distance <= 0) {
        this.SelectPathDir(actor);
        if (actor.dir === NODIR || actor.distance <= 0) {
          return;
        }
      }

      if (move < actor.distance) {
        this.MoveObj(actor, move, tics);
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

  private T_BJRun(actor: PortActor, tics: number): void {
    let move = (BJRUNSPEED * tics) / TILEGLOBAL;
    while (move > 0) {
      if (actor.distance > 0 && move < actor.distance) {
        this.MoveVictoryObj(actor, move);
        break;
      }

      actor.x = actor.targetX;
      actor.y = actor.targetY;
      if (actor.distance > 0) {
        move -= actor.distance;
      }

      this.SelectPathDir(actor);
      actor.victoryTilesRemaining = (actor.victoryTilesRemaining ?? 0) - 1;
      if (actor.victoryTilesRemaining <= 0) {
        this.StartBJJumpState(actor);
        return;
      }

      if (actor.dir === NODIR || actor.distance <= 0) {
        return;
      }
    }
  }

  private T_BJJump(actor: PortActor, tics: number): void {
    this.MoveVictoryObj(actor, (BJJUMPSPEED * tics) / TILEGLOBAL);
  }

  private T_BJYell(): void {
    this.id_sd.SD_PlaySound("YEAHSND");
  }

  private T_BJDone(): void {
    this.SetPlayState("ex_victorious");
  }

  private MoveVictoryObj(actor: PortActor, move: number): void {
    const delta = DIRECTION_DELTAS[actor.dir];
    if (!delta) {
      return;
    }

    actor.x += delta.dx * move;
    actor.y += delta.dy * move;
    actor.distance -= move;
  }

  private StartBJJumpState(actor: PortActor): void {
    actor.victoryPhase = "jump";
    this.SetActorSequenceState(actor, ACTOR_VICTORY_JUMP_STATES, 0, "victory");
  }

  private MoveObj(actor: PortActor, move: number, tics: number): void {
    const delta = DIRECTION_DELTAS[actor.dir];
    if (!delta) {
      return;
    }

    const previousX = actor.x;
    const previousY = actor.y;
    actor.x += delta.dx * move;
    actor.y += delta.dy * move;
    actor.distance -= move;

    if (this.ActorTouchesPlayer(actor) && this.ActorAreaCanReachPlayer(actor)) {
      if (actor.mode === "ghost") {
        this.TakeDamage(tics * 2, actor);
      }

      actor.x = previousX;
      actor.y = previousY;
      actor.distance += move;
    }
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

  private SelectDodgeDir(actor: PortActor): void {
    const turnaround = actor.firstAttack ? NODIR : OPPOSITE_DIRECTIONS[actor.dir] ?? NODIR;
    actor.firstAttack = false;
    const deltaX = Math.floor(this.gamestate.x) - Math.floor(actor.targetX);
    const deltaY = Math.floor(this.gamestate.y) - Math.floor(actor.targetY);
    const directions: [number, number, number, number, number] = [
      NODIR,
      deltaX > 0 ? 0 : 4,
      deltaY > 0 ? 6 : 2,
      deltaX > 0 ? 4 : 0,
      deltaY > 0 ? 2 : 6
    ];

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      [directions[1], directions[2]] = [directions[2], directions[1]];
      [directions[3], directions[4]] = [directions[4], directions[3]];
    }

    if (this.US_RndT() < 128) {
      [directions[1], directions[2]] = [directions[2], directions[1]];
      [directions[3], directions[4]] = [directions[4], directions[3]];
    }

    directions[0] = DIAGONAL_DIRECTIONS[directions[1]]?.[directions[2]] ?? NODIR;
    for (const dir of directions) {
      if (dir === NODIR || dir === turnaround) {
        continue;
      }

      actor.dir = dir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    if (turnaround !== NODIR) {
      actor.dir = turnaround;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    actor.dir = NODIR;
  }

  private SelectRunDir(actor: PortActor): void {
    const deltaX = Math.floor(this.gamestate.x) - Math.floor(actor.targetX);
    const deltaY = Math.floor(this.gamestate.y) - Math.floor(actor.targetY);
    const directions: [number, number] = [deltaX < 0 ? 0 : 4, deltaY < 0 ? 6 : 2];
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      [directions[0], directions[1]] = [directions[1], directions[0]];
    }

    for (const dir of directions) {
      actor.dir = dir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    const fallbackDirs = this.US_RndT() > 128 ? [2, 3, 4] : [4, 3, 2];
    for (const dir of fallbackDirs) {
      actor.dir = dir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    actor.dir = NODIR;
  }

  private SelectChaseDir(actor: PortActor): void {
    const oldDir = actor.dir;
    const turnaround = OPPOSITE_DIRECTIONS[oldDir] ?? NODIR;
    const deltaX = Math.floor(this.gamestate.x) - Math.floor(actor.targetX);
    const deltaY = Math.floor(this.gamestate.y) - Math.floor(actor.targetY);
    const directions: [number, number, number] = [NODIR, NODIR, NODIR];

    if (deltaX > 0) {
      directions[1] = 0;
    } else if (deltaX < 0) {
      directions[1] = 4;
    }

    if (deltaY > 0) {
      directions[2] = 6;
    } else if (deltaY < 0) {
      directions[2] = 2;
    }

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      [directions[1], directions[2]] = [directions[2], directions[1]];
    }

    if (directions[1] === turnaround) {
      directions[1] = NODIR;
    }

    if (directions[2] === turnaround) {
      directions[2] = NODIR;
    }

    for (const dir of [directions[1], directions[2]]) {
      if (dir === NODIR) {
        continue;
      }

      actor.dir = dir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    if (oldDir !== NODIR) {
      actor.dir = oldDir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    const fallbackDirs = this.US_RndT() > 128 ? [2, 3, 4] : [4, 3, 2];
    for (const dir of fallbackDirs) {
      if (dir === turnaround) {
        continue;
      }

      actor.dir = dir;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    if (turnaround !== NODIR) {
      actor.dir = turnaround;
      if (this.TryWalk(actor)) {
        return;
      }
    }

    actor.dir = NODIR;
  }

  private TryWalk(actor: PortActor): boolean {
    const delta = DIRECTION_DELTAS[actor.dir];
    if (!delta) {
      return false;
    }

    const nextX = actor.targetX + delta.dx;
    const nextY = actor.targetY + delta.dy;
    if (delta.dx !== 0 && delta.dy !== 0) {
      if (
        !this.CanActorEnterTile(actor, nextX, nextY) ||
        !this.CanActorEnterTile(actor, nextX, actor.targetY) ||
        !this.CanActorEnterTile(actor, actor.targetX, nextY)
      ) {
        return false;
      }

      actor.targetX = nextX;
      actor.targetY = nextY;
      actor.distance = TILE_DISTANCE;
      return true;
    }

    const door = this.DoorAt(nextX, nextY);
    if (door && door.action !== "open") {
      if (!this.CanActorWaitForDoor(actor, nextX, nextY)) {
        return false;
      }

      this.OpenDoor(door);
      actor.targetX = nextX;
      actor.targetY = nextY;
      actor.distance = -door.index - 1;
      return true;
    }

    if (!this.CanActorEnterTile(actor, nextX, nextY)) {
      return false;
    }

    actor.targetX = nextX;
    actor.targetY = nextY;
    actor.distance = TILE_DISTANCE;
    return true;
  }

  private CanActorEnterTile(actor: PortActor, tileX: number, tileY: number): boolean {
    const door = this.DoorAt(tileX, tileY);
    const wallTile = door?.action === "open" ? 0 : this.GetWallTile(tileX, tileY);
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.map.width ||
      tileY >= this.map.height ||
      wallTile !== 0 ||
      this.map.blockingStaticKeys.has(tileKey(tileX, tileY))
    ) {
      return false;
    }

    return !this.map.actors.some((other) => {
      if (other === actor || !other.shootable) {
        return false;
      }

      return other.targetX === tileX && other.targetY === tileY;
    });
  }

  private CanActorWaitForDoor(actor: PortActor, tileX: number, tileY: number): boolean {
    if (!ACTOR_SIDE_DOOR_KINDS.has(actor.kind) || !CARDINAL_DIRECTIONS.has(actor.dir)) {
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
      this.id_sd.SD_PlaySound("NOWAYSND");
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
    if (this.DoorBlockedForClose(door)) {
      return;
    }

    if (this.DoorClosingSoundAudible(door)) {
      this.id_sd.SD_PlaySound("CLOSEDOORSND");
    }

    door.action = "closing";
  }

  private DoorBlockedForClose(door: PortDoor): boolean {
    const playerTileX = Math.floor(this.gamestate.x);
    const playerTileY = Math.floor(this.gamestate.y);
    if (this.DoorCenterOccupied(door)) {
      return true;
    }

    if (door.vertical) {
      if (
        playerTileY === door.y &&
        (Math.floor(this.gamestate.x + SOURCE_PLAYERSIZE_TILES) === door.x ||
          Math.floor(this.gamestate.x - SOURCE_PLAYERSIZE_TILES) === door.x)
      ) {
        return true;
      }

      return (
        this.ActorTouchesDoorSide(door.x - 1, door.y, door.x, "x", SOURCE_PLAYERSIZE_TILES) ||
        this.ActorTouchesDoorSide(door.x + 1, door.y, door.x, "x", -SOURCE_PLAYERSIZE_TILES)
      );
    }

    if (
      playerTileX === door.x &&
      (Math.floor(this.gamestate.y + SOURCE_PLAYERSIZE_TILES) === door.y ||
        Math.floor(this.gamestate.y - SOURCE_PLAYERSIZE_TILES) === door.y)
    ) {
      return true;
    }

    return (
      this.ActorTouchesDoorSide(door.x, door.y - 1, door.y, "y", SOURCE_PLAYERSIZE_TILES) ||
      this.ActorTouchesDoorSide(door.x, door.y + 1, door.y, "y", -SOURCE_PLAYERSIZE_TILES)
    );
  }

  private ActorOccupiesDoorTile(door: PortDoor): boolean {
    return this.map.actors.some(
      (actor) => actor.shootable && Math.floor(actor.x) === door.x && Math.floor(actor.y) === door.y
    );
  }

  private DoorCenterOccupied(door: PortDoor): boolean {
    return this.PlayerIntersectsDoor(door) || this.ActorOccupiesDoorTile(door);
  }

  private ActorTouchesDoorSide(
    tileX: number,
    tileY: number,
    doorTile: number,
    axis: "x" | "y",
    offset: number
  ): boolean {
    return this.map.actors.some((actor) => {
      if (!actor.shootable || Math.floor(actor.x) !== tileX || Math.floor(actor.y) !== tileY) {
        return false;
      }

      const center = axis === "x" ? actor.x + 0.5 : actor.y + 0.5;
      return Math.floor(center + offset) === doorTile;
    });
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
    this.id_sd.SD_PlaySound("BONUS1UPSND");
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
    this.gotgatgun = false;
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
    if (door) {
      // WL_ACT1.C DoorOpening clears actorat when the door reaches dr_open.
      return door.action === "open" ? 0 : door.tile;
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

  PlayerFloorTile(): number {
    const tileX = Math.floor(this.gamestate.x);
    const tileY = Math.floor(this.gamestate.y);
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return 0;
    }

    return this.map.walls[tileY * this.map.width + tileX] ?? 0;
  }

  private ObjectPlaneTile(tileX: number, tileY: number): number {
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return 0;
    }

    return this.map.objects[tileY * this.map.width + tileX] ?? 0;
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

    const attackSound = weaponAttackSound(this.gamestate.weapon);
    if (attackSound) {
      this.id_sd.SD_PlaySound(attackSound);
    }

    this.gamestate.ammo -= 1;
    this.madeNoise = true;
    const target = this.TargetActorInCrosshair();
    if (!target) {
      return;
    }

    // WL_AGENT.C GunAttack picks the nearest centered FL_VISABLE target before tracing CheckLine.
    if (!this.CheckLineToActor(target.actor)) {
      return;
    }

    const dist = this.ActorTileDistance(target.actor);
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

    this.DamageActor(target.actor, damage);
  }

  private RunKnifeAttackFrame(): void {
    this.id_sd.SD_PlaySound("ATKKNIFESND");
    const target = this.TargetActorInCrosshair();
    if (!target) {
      return;
    }

    // WL_AGENT.C KnifeAttack does not call CheckLine; it only checks FL_VISABLE, screen center, and transx range.
    if (target.depth > KNIFE_RANGE_TILES) {
      return;
    }

    this.DamageActor(target.actor, this.US_RndT() >> 4);
  }

  private TargetActorInCrosshair(): { actor: PortActor; depth: number } | null {
    const forwardX = Math.cos(this.gamestate.angle);
    const forwardY = Math.sin(this.gamestate.angle);
    const rightX = -forwardY;
    const rightY = forwardX;
    const projectionScale = SCREEN_WIDTH / (2 * Math.tan(COMBAT_FOV / 2));
    let bestTarget: { actor: PortActor; depth: number } | null = null;
    let bestDepth = Number.POSITIVE_INFINITY;

    for (const actor of this.map.actors) {
      if (!actor.shootable || !actor.visible || actor.mode === "dead") {
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

      if (depth < bestDepth) {
        bestTarget = { actor, depth };
        bestDepth = depth;
      }
    }

    return bestTarget;
  }

  private SightPlayer(actor: PortActor, tics: number): boolean {
    if (actor.attackMode || !actor.shootable) {
      return false;
    }

    if (actor.reactionTime > 0) {
      actor.reactionTime -= tics;
      if (actor.reactionTime > 0) {
        return false;
      }

      actor.reactionTime = 0;
      this.FirstSighting(actor);
      return true;
    }

    if (!this.ActorAreaCanReachPlayer(actor)) {
      return false;
    }

    const canSeePlayer = this.CheckSight(actor);
    if (actor.ambush) {
      if (!canSeePlayer) {
        return false;
      }

      actor.ambush = false;
    } else if (!this.madeNoise && !canSeePlayer) {
      return false;
    }

    actor.reactionTime = reactionDelayForActor(actor.kind, () => this.US_RndT());
    return false;
  }

  private CheckSight(actor: PortActor): boolean {
    if (!this.ActorAreaCanReachPlayer(actor)) {
      return false;
    }

    const actorCenterX = actor.x + 0.5;
    const actorCenterY = actor.y + 0.5;
    const deltaX = this.gamestate.x - actorCenterX;
    const deltaY = this.gamestate.y - actorCenterY;
    if (
      deltaX > -MINSIGHT_TILES &&
      deltaX < MINSIGHT_TILES &&
      deltaY > -MINSIGHT_TILES &&
      deltaY < MINSIGHT_TILES
    ) {
      return true;
    }

    switch (actor.dir) {
      case 0:
        if (deltaX < 0) {
          return false;
        }
        break;
      case 2:
        if (deltaY > 0) {
          return false;
        }
        break;
      case 4:
        if (deltaX > 0) {
          return false;
        }
        break;
      case 6:
        if (deltaY < 0) {
          return false;
        }
        break;
      default:
        break;
    }

    return this.CheckLineToActor(actor);
  }

  private ActorAreaCanReachPlayer(actor: PortActor): boolean {
    // WL_STATE.C / WL_ACT2.C use areabyplayer[] as a hard gate for sight and shooting.
    const actorArea = this.ActorAreaNumber(actor);
    return actorArea !== null && this.map.areasByPlayer.has(actorArea);
  }

  ActorAreaNumber(actor: PortActor): number | null {
    return this.AreaNumberAt(Math.floor(actor.x), Math.floor(actor.y));
  }

  PlayerAreaNumber(): number | null {
    return this.AreaNumberAt(Math.floor(this.gamestate.x), Math.floor(this.gamestate.y));
  }

  private ConnectAreas(): void {
    this.map.areasByPlayer.clear();
    const playerArea = this.PlayerAreaNumber();
    if (playerArea === null) {
      return;
    }

    this.map.areasByPlayer.add(playerArea);
    const queue = [playerArea];
    while (queue.length > 0) {
      const area = queue.shift();
      if (area === undefined) {
        continue;
      }

      for (const [key, count] of this.map.areaConnectCounts.entries()) {
        if (count <= 0) {
          continue;
        }

        const [area1, area2] = parseAreaConnectionKey(key);
        const nextArea = area1 === area ? area2 : area2 === area ? area1 : null;
        if (nextArea !== null && !this.map.areasByPlayer.has(nextArea)) {
          this.map.areasByPlayer.add(nextArea);
          queue.push(nextArea);
        }
      }
    }
  }

  private AreaNumberAt(tileX: number, tileY: number): number | null {
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return null;
    }

    const tile = this.map.walls[tileY * this.map.width + tileX] ?? 0;
    if (tile >= AREATILE) {
      return tile - AREATILE;
    }

    if (tile === AMBUSHTILE) {
      return this.NeighborAreaNumber(tileX, tileY);
    }

    return null;
  }

  private NeighborAreaNumber(tileX: number, tileY: number): number | null {
    let area: number | null = null;
    for (const delta of CARDINAL_TILE_DELTAS) {
      const tile = this.map.walls[(tileY + delta.dy) * this.map.width + tileX + delta.dx] ?? 0;
      if (tile >= AREATILE) {
        area = tile - AREATILE;
      }
    }

    return area;
  }

  private CheckLineToActor(actor: PortActor): boolean {
    const actorTileX = Math.floor(actor.x);
    const actorTileY = Math.floor(actor.y);
    const targetX = actor.x + 0.5;
    const targetY = actor.y + 0.5;
    const dx = targetX - this.gamestate.x;
    const dy = targetY - this.gamestate.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance * 16));
    const dirX = distance === 0 ? 0 : dx / distance;
    const dirY = distance === 0 ? 0 : dy / distance;

    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = this.gamestate.x + dx * t;
      const y = this.gamestate.y + dy * t;
      const tileX = Math.floor(x);
      const tileY = Math.floor(y);
      if (tileX === actorTileX && tileY === actorTileY) {
        continue;
      }

      const door = this.DoorAt(tileX, tileY);
      if (door) {
        if (this.DoorBlocksLine(door, this.gamestate.x, this.gamestate.y, dirX, dirY, distance)) {
          return false;
        }

        continue;
      }

      if (this.GetTile(x, y) !== 0) {
        return false;
      }
    }

    return true;
  }

  private DoorBlocksLine(
    door: PortDoor,
    originX: number,
    originY: number,
    dirX: number,
    dirY: number,
    maxDistance: number
  ): boolean {
    // WL_STATE.C CheckLine compares a 1/256-tile absolute sight intercept against doorposition.
    if (door.action === "open") {
      return false;
    }

    if (door.vertical) {
      if (Math.abs(dirX) < 0.0001) {
        return false;
      }

      const hitDistance = (door.x + 0.5 - originX) / dirX;
      const localY = originY + dirY * hitDistance - door.y;
      const intercept = Math.trunc((originY + dirY * hitDistance) * 256);
      return (
        hitDistance >= 0 &&
        hitDistance <= maxDistance &&
        localY >= 0 &&
        localY < 1 &&
        intercept > door.position
      );
    }

    if (Math.abs(dirY) < 0.0001) {
      return false;
    }

    const hitDistance = (door.y + 0.5 - originY) / dirY;
    const localX = originX + dirX * hitDistance - door.x;
    const intercept = Math.trunc((originX + dirX * hitDistance) * 256);
    return (
      hitDistance >= 0 &&
      hitDistance <= maxDistance &&
      localX >= 0 &&
      localX < 1 &&
      intercept > door.position
    );
  }

  private ActorTileDistance(actor: PortActor): number {
    const playerTileX = Math.floor(this.gamestate.x);
    const playerTileY = Math.floor(this.gamestate.y);
    return Math.max(Math.abs(Math.floor(actor.x) - playerTileX), Math.abs(Math.floor(actor.y) - playerTileY));
  }

  private ActorTouchesPlayer(actor: PortActor): boolean {
    const actorCenterX = actor.x + 0.5;
    const actorCenterY = actor.y + 0.5;
    return (
      Math.abs(actorCenterX - this.gamestate.x) <= MINACTORDIST_TILES &&
      Math.abs(actorCenterY - this.gamestate.y) <= MINACTORDIST_TILES
    );
  }

  private ActorWithinDogJumpRange(actor: PortActor, move: number): boolean {
    const actorCenterX = actor.x + 0.5;
    const actorCenterY = actor.y + 0.5;
    const dx = Math.abs(this.gamestate.x - actorCenterX) - move;
    const dy = Math.abs(this.gamestate.y - actorCenterY) - move;
    return dx <= MINACTORDIST_TILES && dy <= MINACTORDIST_TILES;
  }

  private ActorCanBite(actor: PortActor): boolean {
    const actorCenterX = actor.x + 0.5;
    const actorCenterY = actor.y + 0.5;
    const dx = Math.abs(this.gamestate.x - actorCenterX) - TILE_DISTANCE;
    const dy = Math.abs(this.gamestate.y - actorCenterY) - TILE_DISTANCE;
    return dx <= MINACTORDIST_TILES && dy <= MINACTORDIST_TILES;
  }

  private T_Shoot(actor: PortActor): void {
    if (!this.ActorAreaCanReachPlayer(actor) || !this.CheckLineToActor(actor)) {
      return;
    }

    let dist = this.ActorTileDistance(actor);
    if (actor.kind === "ss" || actor.kind === "boss") {
      dist = Math.floor((dist * 2) / 3);
    }

    // WL_ACT2.C T_Shoot uses FL_VISABLE, which DrawScaleds refreshes once per rendered frame.
    const playerCanSeeToDodge = actor.visible;
    const hitChance =
      this.thrustSpeed >= RUNSPEED
        ? 160 - dist * (playerCanSeeToDodge ? 16 : 8)
        : 256 - dist * (playerCanSeeToDodge ? 16 : 8);
    if (this.US_RndT() < hitChance) {
      let damage: number;
      if (dist < 2) {
        damage = this.US_RndT() >> 2;
      } else if (dist < 4) {
        damage = this.US_RndT() >> 3;
      } else {
        damage = this.US_RndT() >> 4;
      }

      this.TakeDamage(damage, actor);
    }

    this.id_sd.SD_PlaySound(actorShootSound(actor.kind));
  }

  private T_Bite(actor: PortActor): void {
    this.id_sd.SD_PlaySound("DOGATTACKSND");
    if (this.ActorCanBite(actor) && this.US_RndT() < 180) {
      this.TakeDamage(this.US_RndT() >> 4, actor);
    }
  }

  private T_SchabbThrow(actor: PortActor): void {
    this.SpawnProjectile("needle", actor, 0x2000);
    this.id_sd.SD_PlaySound("SCHABBSTHROWSND");
  }

  private T_GiftThrow(actor: PortActor): void {
    this.SpawnProjectile("rocket", actor, 0x2000);
    this.id_sd.SD_PlaySound("MISSILEFIRESND");
  }

  private T_FakeFire(actor: PortActor): void {
    this.SpawnProjectile("fire", actor, 0x1200);
    this.id_sd.SD_PlaySound("FLAMETHROWERSND");
  }

  private SpawnProjectile(kind: ProjectileKind, actor: PortActor, speed: number): void {
    const sequence = PROJECTILE_STATES[kind];
    const frame = sequence[0];
    if (!frame) {
      return;
    }

    const x = actor.x + 0.5;
    const y = actor.y + 0.5;
    this.map.projectiles.push({
      angle: normalizeAngle(Math.atan2(this.gamestate.y - y, this.gamestate.x - x)),
      kind,
      speed,
      stateIndex: 0,
      stateName: frame.name,
      stateShapenum: frame.shapenum,
      stateTics: 1,
      x,
      y
    });
  }

  private A_HitlerMorph(actor: PortActor): void {
    const sequence = ACTOR_CHASE_STATES.real_hitler;
    const frame = sequence?.[0];
    if (!frame) {
      return;
    }

    this.map.actors.push({
      active: true,
      ambush: false,
      attackMode: true,
      dir: actor.dir,
      distance: actor.distance,
      firstAttack: actor.firstAttack,
      hitpoints: realHitlerHitpoints(this.gamestate.difficulty),
      kind: "real_hitler",
      mode: "chase",
      reactionTime: 0,
      shootable: true,
      speed: SPDPATROL * 5,
      stateIndex: 0,
      stateName: frame.name,
      stateShapenum: frame.shapenum,
      stateTics: frame.tics,
      targetX: actor.targetX,
      targetY: actor.targetY,
      tile: actor.tile,
      visible: false,
      x: actor.x,
      y: actor.y
    });
  }

  private A_MechaSound(actor: PortActor): void {
    if (this.ActorAreaCanReachPlayer(actor)) {
      this.id_sd.SD_PlaySound("MECHSTEPSND");
    }
  }

  private A_Slurpie(): void {
    this.id_sd.SD_PlaySound("SLURPIESND");
  }

  private A_StartDeathCam(actor: PortActor): void {
    if (this.gamestate.victoryflag) {
      this.SetPlayState("ex_victorious");
      return;
    }

    this.gamestate.victoryflag = true;
    this.bossDeathCamCountdown = SOURCE_DEATH_CAM_DONE_TICS;
    this.PlaceBossDeathCamera(actor);
  }

  private PlaceBossDeathCamera(actor: PortActor): void {
    const bossX = actor.x + 0.5;
    const bossY = actor.y + 0.5;
    const sourceX = this.gamestate.killx || this.gamestate.x;
    const sourceY = this.gamestate.killy || this.gamestate.y;
    const angle = normalizeAngle(Math.atan2(bossY - sourceY, bossX - sourceX));

    this.gamestate.angle = angle;
    this.gamestate.x = sourceX;
    this.gamestate.y = sourceY;

    for (let step = 0; step < SOURCE_DEATH_CAM_MAX_STEPS; step += 1) {
      const dist = SOURCE_DEATH_CAM_START_DISTANCE + SOURCE_DEATH_CAM_DISTANCE_STEP * step;
      const candidateX = bossX - Math.cos(angle) * dist;
      const candidateY = bossY - Math.sin(angle) * dist;
      if (this.PlayerCameraPositionOk(candidateX, candidateY)) {
        this.gamestate.x = candidateX;
        this.gamestate.y = candidateY;
        break;
      }
    }

    this.ConnectAreas();
  }

  private PlayerCameraPositionOk(x: number, y: number): boolean {
    const xl = Math.floor(x - SOURCE_PLAYERSIZE_TILES);
    const xh = Math.floor(x + SOURCE_PLAYERSIZE_TILES);
    const yl = Math.floor(y - SOURCE_PLAYERSIZE_TILES);
    const yh = Math.floor(y + SOURCE_PLAYERSIZE_TILES);

    for (let tileY = yl; tileY <= yh; tileY += 1) {
      for (let tileX = xl; tileX <= xh; tileX += 1) {
        if (this.GetTile(tileX, tileY) !== 0) {
          return false;
        }
      }
    }

    return true;
  }

  private A_Smoke(projectile: PortProjectile, spawnedProjectiles: PortProjectile[]): void {
    const frame = PROJECTILE_STATES.smoke[0];
    if (!frame) {
      return;
    }

    spawnedProjectiles.push({
      angle: 0,
      kind: "smoke",
      speed: 0,
      stateIndex: 0,
      stateName: frame.name,
      stateShapenum: frame.shapenum,
      stateTics: 6,
      x: projectile.x,
      y: projectile.y
    });
  }

  private StartProjectileImpact(projectile: PortProjectile): boolean {
    const frame = PROJECTILE_STATES.boom[0];
    if (!frame) {
      return false;
    }

    projectile.angle = 0;
    this.id_sd.SD_PlaySound("MISSILEHITSND");
    projectile.kind = "boom";
    projectile.speed = 0;
    projectile.stateIndex = 0;
    projectile.stateName = frame.name;
    projectile.stateShapenum = frame.shapenum;
    projectile.stateTics = frame.tics;
    return true;
  }

  private ProjectileIsEffect(projectile: PortProjectile): boolean {
    return projectile.kind === "boom" || projectile.kind === "smoke";
  }

  private ProjectileTryMove(projectile: PortProjectile): boolean {
    const xl = Math.floor(projectile.x - PROJECTILE_PROBE_TILES);
    const yl = Math.floor(projectile.y - PROJECTILE_PROBE_TILES);
    const xh = Math.floor(projectile.x + PROJECTILE_PROBE_TILES);
    const yh = Math.floor(projectile.y + PROJECTILE_PROBE_TILES);

    for (let y = yl; y <= yh; y += 1) {
      for (let x = xl; x <= xh; x += 1) {
        if (this.GetTile(x, y) !== 0 || this.map.blockingStaticKeys.has(tileKey(x, y))) {
          return false;
        }
      }
    }

    return true;
  }

  private TakeProjectileDamage(projectile: PortProjectile): void {
    switch (projectile.kind) {
      case "needle":
        this.TakeDamage((this.US_RndT() >> 3) + 20, projectile);
        break;
      case "rocket":
        this.TakeDamage((this.US_RndT() >> 3) + 30, projectile);
        break;
      case "fire":
        this.TakeDamage(this.US_RndT() >> 3, projectile);
        break;
      default:
        break;
    }
  }

  private TakeDamage(points: number, attacker: PortActor | PortProjectile | null = null): void {
    this.lastAttacker = attacker ? this.DamageSource(attacker) : null;
    if (this.gamestate.victoryflag) {
      return;
    }

    const sourcePoints = Math.max(0, Math.trunc(points));
    const actualPoints = this.gamestate.difficulty === "baby" ? sourcePoints >> 2 : sourcePoints;
    this.gamestate.health = Math.max(0, this.gamestate.health - actualPoints);
    if (this.gamestate.health === 0) {
      this.SetPlayState("ex_died");
      this.killer = this.lastAttacker;
    }
    this.StartDamageFlash(actualPoints);
    this.gotgatgun = false;
  }

  private CheckVictoryTile(): void {
    if (this.gamestate.victoryflag) {
      return;
    }

    const tileX = Math.floor(this.gamestate.x);
    const tileY = Math.floor(this.gamestate.y);
    if (this.ObjectPlaneTile(tileX, tileY) === EXITTILE) {
      this.VictoryTile();
    }
  }

  private VictoryTile(): void {
    this.SpawnBJVictory();
    this.gamestate.victoryflag = true;
    this.victorySpinTargetY = Math.floor(this.gamestate.y) - 5 - 0x3000 / TILEGLOBAL;
  }

  private SpawnBJVictory(): void {
    if (this.map.actors.some((actor) => actor.kind === "bj" && actor.mode === "victory")) {
      return;
    }

    const frame = ACTOR_VICTORY_RUN_STATES[0];
    if (!frame) {
      return;
    }

    const tileX = Math.floor(this.gamestate.x);
    const tileY = Math.floor(this.gamestate.y) + 1;
    this.map.actors.push({
      active: false,
      ambush: false,
      attackMode: false,
      dir: 2,
      distance: 0,
      firstAttack: false,
      hitpoints: 0,
      kind: "bj",
      mode: "victory",
      reactionTime: 0,
      shootable: false,
      speed: BJRUNSPEED,
      stateIndex: 0,
      stateName: frame.name,
      stateShapenum: frame.shapenum,
      stateTics: this.US_RndT() % frame.tics,
      targetX: tileX,
      targetY: tileY,
      tile: 0,
      visible: false,
      victoryPhase: "run",
      victoryTilesRemaining: 6,
      x: this.gamestate.x - 0.5,
      y: this.gamestate.y - 0.5
    });
  }

  private UpdateVictoryCamera(tics: number): void {
    if (this.bossDeathCamCountdown > 0) {
      this.AdvanceBossDeathCam(tics);
      return;
    }

    this.VictorySpin(tics);
  }

  private AdvanceBossDeathCam(tics: number): void {
    if (this.bossDeathCamCountdown <= 0) {
      return;
    }

    this.bossDeathCamCountdown = Math.max(0, this.bossDeathCamCountdown - tics);
    if (this.bossDeathCamCountdown === 0) {
      this.SetPlayState("ex_victorious");
    }
  }

  private VictorySpin(tics: number): void {
    const targetAngle = (Math.PI * 3) / 2;
    const angleStep = ((Math.PI * 2) / 360) * tics * 3;
    const angle = normalizeAngle(this.gamestate.angle);

    if (angle > targetAngle) {
      this.gamestate.angle = Math.max(targetAngle, angle - angleStep);
    } else if (angle < targetAngle) {
      this.gamestate.angle = Math.min(targetAngle, angle + angleStep);
    }

    const destY = this.victorySpinTargetY ?? Math.floor(this.gamestate.y) - 5 - 0x3000 / TILEGLOBAL;
    if (this.gamestate.y > destY) {
      this.gamestate.y = Math.max(destY, this.gamestate.y - (tics * 4096) / TILEGLOBAL);
    }
  }

  private SetPlayState(playstate: SourcePlayState): void {
    this.playstate = playstate;
    this.gamestate.playstate = playstate;
    this.completedLevelTransitionApplied = false;
    this.diedTransitionApplied = false;
    this.victoriousTransitionApplied = false;
  }

  private DamageSource(attacker: PortActor | PortProjectile): DamageSource {
    if ("shootable" in attacker) {
      return {
        kind: attacker.kind,
        source: "actor",
        x: attacker.x,
        y: attacker.y
      };
    }

    return {
      kind: attacker.kind,
      source: "projectile",
      x: attacker.x,
      y: attacker.y
    };
  }

  private DamageActor(actor: PortActor, damage: number): void {
    if (!actor.shootable || actor.mode === "dead") {
      return;
    }

    this.madeNoise = true;
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
    this.RecordDeathCamSourcePosition(actor);
    this.StartDeathState(actor);
    this.gamestate.killcount += 1;
    this.GivePoints(actorKillScore(actor.kind));
    this.PlaceKillDrop(actor);
  }

  private RecordDeathCamSourcePosition(actor: PortActor): void {
    if (!DEATH_CAM_SOURCE_POSITION_ACTORS.has(actor.kind)) {
      return;
    }

    this.gamestate.killx = this.gamestate.x;
    this.gamestate.killy = this.gamestate.y;
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

  private A_DeathScream(actor: PortActor): void {
    if (
      this.gamestate.mapon === 9
      && WL6_SECRET_DEATH_SCREAM_ACTORS.has(actor.kind)
      && this.US_RndT() === 0
    ) {
      this.id_sd.SD_PlaySound("DEATHSCREAM6SND");
      return;
    }

    const deathSound = this.ActorDeathSound(actor.kind);
    if (deathSound) {
      this.id_sd.SD_PlaySound(deathSound);
    }
  }

  private ActorDeathSound(kind: string): SourceSoundName | null {
    switch (kind) {
      case "boss":
        return "MUTTISND";
      case "dog":
        return "DOGDEATHSND";
      case "fake_hitler":
        return "HITLERHASND";
      case "fat":
        return "ROSESND";
      case "gift":
        return "DONNERSND";
      case "gretel":
        return "MEINSND";
      case "guard":
        return WL6_GUARD_DEATH_SCREAMS[this.US_RndT() % 8] ?? "DEATHSCREAM1SND";
      case "hitler":
        return "SCHEISTSND";
      case "mutant":
        return "AHHHGSND";
      case "officer":
        return "NEINSOVASSND";
      case "real_hitler":
        return "EVASND";
      case "schabbs":
        return "MEINGOTTSND";
      case "ss":
        return "LEBENSND";
      default:
        return null;
    }
  }

  private FirstSighting(actor: PortActor): void {
    actor.attackMode = true;
    actor.firstAttack = true;
    if (actor.distance < 0) {
      actor.distance = 0;
    }

    const sightSound = actorSightSound(actor.kind);
    if (sightSound) {
      this.id_sd.SD_PlaySound(sightSound);
    }

    actor.speed = actorChaseSpeed(actor.kind, actor.speed);
    this.StartChaseState(actor);
  }

  private StartChaseState(actor: PortActor, carry = 0): void {
    const sequence = ACTOR_CHASE_STATES[actor.kind];
    if (!sequence) {
      return;
    }

    this.SetActorSequenceState(actor, sequence, 0, "chase", carry);
  }

  private StartAttackState(actor: PortActor): boolean {
    const sequence = ACTOR_ATTACK_STATES[actor.kind];
    if (!sequence) {
      return false;
    }

    this.SetActorSequenceState(actor, sequence, 0, "attack");
    return true;
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

  private RunActorFrameAction(actor: PortActor, frame: ActorStateFrame | undefined): void {
    switch (frame?.action) {
      case "bite":
        this.T_Bite(actor);
        break;
      case "bjDone":
        this.T_BJDone();
        break;
      case "bjYell":
        this.T_BJYell();
        break;
      case "deathScream":
        this.A_DeathScream(actor);
        break;
      case "fakeFire":
        this.T_FakeFire(actor);
        break;
      case "hitlerMorph":
        this.A_HitlerMorph(actor);
        break;
      case "mechaSound":
        this.A_MechaSound(actor);
        break;
      case "shoot":
        this.T_Shoot(actor);
        break;
      case "slurpie":
        this.A_Slurpie();
        break;
      case "startDeathCam":
        this.A_StartDeathCam(actor);
        break;
      case "throwNeedle":
        this.T_SchabbThrow(actor);
        break;
      case "throwRocket":
        this.T_GiftThrow(actor);
        break;
      default:
        break;
    }
  }

  private RunActorFrameThink(actor: PortActor, frame: ActorStateFrame | undefined, tics: number): void {
    switch (frame?.think) {
      case "bjJump":
        this.T_BJJump(actor, tics);
        break;
      case "bjRun":
        this.T_BJRun(actor, tics);
        break;
      default:
        break;
    }
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

    actor.mode = frame.final && !frame.action ? "dead" : mode;
    actor.stateIndex = index;
    actor.stateName = frame.name;
    actor.stateShapenum = frame.shapenum;
    actor.stateTics = frame.final || frame.tics === 0 ? Math.max(0, frame.tics + carry) : frame.tics + carry;
  }

  private SetProjectileSequenceState(
    projectile: PortProjectile,
    sequence: ProjectileStateFrame[],
    index: number,
    carry = 0
  ): void {
    const frame = sequence[index] ?? sequence[sequence.length - 1];
    if (!frame) {
      return;
    }

    projectile.stateIndex = index;
    projectile.stateName = frame.name;
    projectile.stateShapenum = frame.shapenum;
    projectile.stateTics = frame.tics + carry;
  }

  private DoorOpen(door: PortDoor, tics: number): void {
    door.ticcount += tics;
    if (door.ticcount >= OPENTICS) {
      this.CloseDoor(door);
    }
  }

  private DoorOpening(door: PortDoor, tics: number): void {
    if (door.position === 0) {
      this.ChangeDoorAreaConnection(door, 1);
      if (this.DoorOpeningSoundAudible(door)) {
        this.id_sd.SD_PlaySound("OPENDOORSND");
      }
    }

    door.position += tics << DOOR_POSITION_RATE_SHIFT;
    if (door.position >= DOOR_POSITION_MAX) {
      door.position = DOOR_POSITION_MAX;
      door.ticcount = 0;
      door.action = "open";
    }
  }

  private DoorClosing(door: PortDoor, tics: number): void {
    if (this.DoorCenterOccupied(door)) {
      this.OpenDoor(door);
      return;
    }

    door.position -= tics << DOOR_POSITION_RATE_SHIFT;
    if (door.position <= 0) {
      door.position = 0;
      door.action = "closed";
      this.ChangeDoorAreaConnection(door, -1);
    }
  }

  private DoorAt(x: number, y: number): PortDoor | null {
    return this.map.doors.find((door) => door.x === x && door.y === y) ?? null;
  }

  private ChangeDoorAreaConnection(door: PortDoor, delta: 1 | -1): void {
    // WL_ACT1.C increments areaconnect when doors start opening and decrements it when they shut.
    const pair = this.DoorAreaPair(door);
    if (!pair) {
      return;
    }

    const key = areaConnectionKey(pair.area1, pair.area2);
    const nextCount = (this.map.areaConnectCounts.get(key) ?? 0) + delta;
    if (nextCount <= 0) {
      this.map.areaConnectCounts.delete(key);
    } else {
      this.map.areaConnectCounts.set(key, nextCount);
    }

    this.ConnectAreas();
  }

  private DoorAreaPair(door: PortDoor): { area1: number; area2: number } | null {
    const area1 = door.vertical
      ? this.AreaNumberAt(door.x + 1, door.y)
      : this.AreaNumberAt(door.x, door.y - 1);
    const area2 = door.vertical
      ? this.AreaNumberAt(door.x - 1, door.y)
      : this.AreaNumberAt(door.x, door.y + 1);
    if (area1 === null || area2 === null) {
      return null;
    }

    return {
      area1,
      area2
    };
  }

  private DoorOpeningSoundAudible(door: PortDoor): boolean {
    const pair = this.DoorAreaPair(door);
    return pair !== null && this.map.areasByPlayer.has(pair.area1);
  }

  private DoorClosingSoundAudible(door: PortDoor): boolean {
    const pair = this.DoorAreaPair(door);
    if (!pair) {
      return false;
    }

    return this.map.areasByPlayer.has(door.vertical ? pair.area2 : pair.area1);
  }

  GetBonus(stat: PortStatic): boolean {
    if (stat.collected || !stat.bonus) {
      return false;
    }

    switch (stat.item) {
      case "bo_firstaid":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.id_sd.SD_PlaySound("HEALTH2SND");
        this.HealSelf(25);
        break;
      case "bo_key1":
      case "bo_key2":
      case "bo_key3":
      case "bo_key4":
        this.GiveKey(keyNumberForBonus(stat.item));
        this.id_sd.SD_PlaySound("GETKEYSND");
        break;
      case "bo_cross":
        this.id_sd.SD_PlaySound("BONUS1SND");
        this.GivePoints(treasureScoreForBonus(stat.item));
        this.gamestate.treasurecount += 1;
        break;
      case "bo_chalice":
        this.id_sd.SD_PlaySound("BONUS2SND");
        this.GivePoints(treasureScoreForBonus(stat.item));
        this.gamestate.treasurecount += 1;
        break;
      case "bo_bible":
        this.id_sd.SD_PlaySound("BONUS3SND");
        this.GivePoints(treasureScoreForBonus(stat.item));
        this.gamestate.treasurecount += 1;
        break;
      case "bo_crown":
        this.id_sd.SD_PlaySound("BONUS4SND");
        this.GivePoints(treasureScoreForBonus(stat.item));
        this.gamestate.treasurecount += 1;
        break;
      case "bo_clip":
        if (this.gamestate.ammo === MAX_AMMO) {
          return false;
        }
        this.id_sd.SD_PlaySound("GETAMMOSND");
        this.GiveAmmo(8);
        break;
      case "bo_clip2":
        if (this.gamestate.ammo === MAX_AMMO) {
          return false;
        }
        this.id_sd.SD_PlaySound("GETAMMOSND");
        this.GiveAmmo(4);
        break;
      case "bo_machinegun":
        this.id_sd.SD_PlaySound("GETMACHINESND");
        this.GiveWeapon(WP_MACHINEGUN);
        break;
      case "bo_chaingun":
        this.id_sd.SD_PlaySound(GETGATLINGSND);
        this.GiveWeapon(WP_CHAINGUN);
        this.facecount = 0;
        this.gotgatgun = true;
        break;
      case "bo_fullheal":
        this.id_sd.SD_PlaySound("BONUS1UPSND");
        this.HealSelf(99);
        this.GiveAmmo(25);
        this.GiveExtraMan();
        this.gamestate.treasurecount += 1;
        break;
      case "bo_food":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.id_sd.SD_PlaySound("HEALTH1SND");
        this.HealSelf(10);
        break;
      case "bo_alpo":
        if (this.gamestate.health === MAX_HEALTH) {
          return false;
        }
        this.id_sd.SD_PlaySound("HEALTH1SND");
        this.HealSelf(4);
        break;
      case "bo_gibs":
        if (this.gamestate.health > 10) {
          return false;
        }
        this.id_sd.SD_PlaySound("SLURPIESND");
        this.HealSelf(1);
        break;
      default:
        return false;
    }

    stat.collected = true;
    this.StartBonusFlash();
    return true;
  }

  private PlayerIntersectsDoor(door: PortDoor): boolean {
    return Math.floor(this.gamestate.x) === door.x && Math.floor(this.gamestate.y) === door.y;
  }

  private UseTarget(): {
    dir: PushWallDirection;
    elevatorOk: boolean;
    x: number;
    y: number;
  } {
    const angle = gameAngleToSourceDegrees(this.gamestate.angle);
    const tileX = Math.floor(this.gamestate.x);
    const tileY = Math.floor(this.gamestate.y);

    if (angle < SOURCE_ANGLES / 8 || angle > (SOURCE_ANGLES * 7) / 8) {
      return {
        dir: "east",
        elevatorOk: true,
        x: tileX + 1,
        y: tileY
      };
    }

    if (angle < (SOURCE_ANGLES * 3) / 8) {
      return {
        dir: "north",
        elevatorOk: false,
        x: tileX,
        y: tileY - 1
      };
    }

    if (angle < (SOURCE_ANGLES * 5) / 8) {
      return {
        dir: "west",
        elevatorOk: true,
        x: tileX - 1,
        y: tileY
      };
    }

    return {
      dir: "south",
      elevatorOk: false,
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
    this.ApplyPaletteShift(image, wl_game.paletteShift);
    this.id_vl.VL_Present(image);
  }

  private ApplyPaletteShift(image: ImageData, shift: SourcePaletteShift | null): void {
    if (!shift) {
      return;
    }

    const target: [number, number, number] = shift.kind === "red" ? [255, 0, 0] : SOURCE_WHITE_SHIFT_TARGET;
    const steps = shift.kind === "red" ? SOURCE_RED_STEPS : SOURCE_WHITE_STEPS;
    const amount = shift.level / steps;

    for (let index = 0; index < image.data.length; index += 4) {
      const red = image.data[index] ?? 0;
      const green = image.data[index + 1] ?? 0;
      const blue = image.data[index + 2] ?? 0;
      image.data[index] = red + (target[0] - red) * amount;
      image.data[index + 1] = green + (target[1] - green) * amount;
      image.data[index + 2] = blue + (target[2] - blue) * amount;
    }
  }

  private StaticBonusInGetDistance(wl_game: WLGame, stat: PortStatic): boolean {
    // WL_DRAW.C TransformTile subtracts 0x2000 from forward depth, then grabs bonuses
    // when nx is within one tile and ny is within half a tile.
    const worldX = stat.x + 0.5;
    const worldY = stat.y + 0.5;
    const dx = worldX - wl_game.gamestate.x;
    const dy = worldY - wl_game.gamestate.y;
    const forwardX = Math.cos(wl_game.gamestate.angle);
    const forwardY = Math.sin(wl_game.gamestate.angle);
    const rightX = -forwardY;
    const rightY = forwardX;
    const sourceDepth = dx * forwardX + dy * forwardY - SOURCE_OBJECT_SIZE_TILES;
    const sourceSide = dx * rightX + dy * rightY;

    return (
      sourceDepth >= SOURCE_PLAYERSIZE_TILES &&
      sourceDepth < TILE_DISTANCE &&
      sourceSide > -TILE_DISTANCE / 2 &&
      sourceSide < TILE_DISTANCE / 2
    );
  }

  private StaticTileVisible(wl_game: WLGame, stat: PortStatic): boolean {
    // WL_DRAW.C DrawScaleds checks spotvis before TransformTile for static sprites.
    return this.TileCenterVisible(wl_game, stat.x, stat.y);
  }

  private ActorTileVisible(wl_game: WLGame, actor: PortActor): boolean {
    // WL_DRAW.C checks the actor tile plus eight open neighbor tiles against spotvis.
    const tileX = Math.floor(actor.x);
    const tileY = Math.floor(actor.y);
    if (this.TileCenterVisible(wl_game, tileX, tileY)) {
      return true;
    }

    for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
      for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
        if (xOffset === 0 && yOffset === 0) {
          continue;
        }

        const checkX = tileX + xOffset;
        const checkY = tileY + yOffset;
        if (wl_game.GetTile(checkX, checkY) === 0 && this.TileCenterVisible(wl_game, checkX, checkY)) {
          return true;
        }
      }
    }

    return false;
  }

  private TileCenterVisible(wl_game: WLGame, tileX: number, tileY: number): boolean {
    const worldX = tileX + 0.5;
    const worldY = tileY + 0.5;
    const dx = worldX - wl_game.gamestate.x;
    const dy = worldY - wl_game.gamestate.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= SOURCE_PLAYERSIZE_TILES) {
      return true;
    }

    const hit = this.CastRay(wl_game, Math.atan2(dy, dx));
    return hit.distance + 0.03 >= distance;
  }

  private CastRay(wl_game: WLGame, angle: number): RayHit {
    const step = 0.025;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const originX = wl_game.gamestate.x;
    const originY = wl_game.gamestate.y;
    const pushWallHit = this.CastPushWallRay(wl_game.map.pushWall, originX, originY, dirX, dirY);

    for (let distance = 0; distance < 16; distance += step) {
      if (pushWallHit && pushWallHit.distance <= distance) {
        return pushWallHit;
      }

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

      if (wl_game.map.pushWall && pushWallRenderTile(wl_game.map.pushWall, tileX, tileY)) {
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

  private CastPushWallRay(
    pushWall: PortPushWall | null,
    originX: number,
    originY: number,
    dirX: number,
    dirY: number
  ): RayHit | null {
    // WL_DR_A.ASM / WL_DRAW.C HitHorizPWall and HitVertPWall shift the active wall by pwallpos.
    if (!pushWall) {
      return null;
    }

    const progress = pushWallProgress(pushWall);
    if (pushWall.dir === "east" || pushWall.dir === "west") {
      if (Math.abs(dirX) < 0.0001) {
        return null;
      }

      const planeX = pushWall.dir === "east" ? pushWall.x + progress : pushWall.x + 1 - progress;
      const distance = (planeX - originX) / dirX;
      const localY = originY + dirY * distance - pushWall.y;
      if (distance < 0 || localY < 0 || localY > 1) {
        return null;
      }

      return {
        distance,
        side: 0,
        texture: dirX < 0 ? 1 - localY : localY,
        tile: pushWall.oldTile,
        type: "pushwall"
      };
    }

    if (Math.abs(dirY) < 0.0001) {
      return null;
    }

    const planeY = pushWall.dir === "south" ? pushWall.y + progress : pushWall.y + 1 - progress;
    const distance = (planeY - originY) / dirY;
    const localX = originX + dirX * distance - pushWall.x;
    if (distance < 0 || localX < 0 || localX > 1) {
      return null;
    }

    return {
      distance,
      side: 1,
      texture: dirY >= 0 ? 1 - localX : localX,
      tile: pushWall.oldTile,
      type: "pushwall"
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

      if (!this.StaticTileVisible(wl_game, stat)) {
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
        if (stat.bonus && this.StaticBonusInGetDistance(wl_game, stat)) {
          wl_game.GetBonus(stat);
          continue;
        }

        sprites.push(sprite);
      }
    }

    for (const actor of wl_game.map.actors) {
      if (!this.ActorTileVisible(wl_game, actor)) {
        actor.visible = false;
        continue;
      }

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
        actor.visible = true;
        sprites.push(sprite);
      } else {
        actor.visible = false;
      }
    }

    for (const projectile of wl_game.map.projectiles) {
      const projectileSprite = projectileSpriteDescriptor(projectile, wl_game.gamestate.angle);
      const projectileSpriteInfo = projectileSprite ? this.id_pm.PM_GetSpritePageInfo(projectileSprite.shapenum) : null;
      const sprite = this.TransformSprite(
        wl_game,
        projectile.x,
        projectile.y,
        fov,
        horizon,
        projectileRgb(projectile),
        projectileSpriteInfo?.width ?? 64,
        projectileSprite ? this.id_pm.PM_GetSpriteBitmap(projectileSprite.shapenum) : null
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
  private readonly soundCommon = new Map<SourceSoundName, SourceSoundCommonInfo>();
  private currentSound: SourceSoundName | null = null;
  private lastSound: SourceSoundName | null = null;
  private phase = 0;
  private soundPriority = 0;
  private soundSampleAccumulator = 0;
  private soundSamplesRemaining = 0;

  async SD_Startup(): Promise<{
    soundServiceHz: number;
    sounds: SourceSoundCommonInfo[];
  }> {
    const [audioHead, audioData] = await Promise.all([
      fetchBytes("/__source-typescript/asset/AUDIOHED.WL6"),
      fetchBytes("/__source-typescript/asset/AUDIOT.WL6")
    ]);
    this.soundCommon.clear();
    for (const soundName of Object.keys(SOURCE_SOUND_CHUNKS) as SourceSoundName[]) {
      const common = this.ReadSoundCommon(soundName, audioHead, audioData);
      if (common) {
        this.soundCommon.set(soundName, common);
      }
    }

    return {
      soundServiceHz: SOURCE_PC_SOUND_SERVICE_HZ,
      sounds: [...this.soundCommon.values()]
    };
  }

  SD_Service(active: boolean, ticMs: number): void {
    this.ServiceSourceSound(ticMs);
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

  SD_PlaySound(sound: SourceSoundName): boolean {
    const common = this.soundCommon.get(sound);
    if (!common || common.priority < this.soundPriority) {
      return false;
    }

    this.currentSound = sound;
    this.lastSound = sound;
    this.soundPriority = common.priority;
    this.soundSampleAccumulator = 0;
    this.soundSamplesRemaining = common.length;
    return false;
  }

  SD_SoundPlaying(): SourceSoundName | null {
    return this.currentSound;
  }

  SD_StopSound(): void {
    this.currentSound = null;
    this.soundPriority = 0;
    this.soundSampleAccumulator = 0;
    this.soundSamplesRemaining = 0;
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

  StateSnapshot(): Record<string, unknown> {
    return {
      currentSound: this.currentSound,
      lastSound: this.lastSound,
      sampleCount: this.sampleCount,
      soundPriority: this.soundPriority,
      soundSamplesRemaining: this.soundSamplesRemaining,
      sounds: [...this.soundCommon.entries()].map(([name, common]) => ({
        ...common,
        name
      }))
    };
  }

  private ReadSoundCommon(
    sound: SourceSoundName,
    audioHead: Uint8Array,
    audioData: Uint8Array
  ): SourceSoundCommonInfo | null {
    const chunk = SOURCE_SOUND_CHUNKS[sound];
    const offset = readUint32LE(audioHead, chunk * 4);
    const nextOffset = readUint32LE(audioHead, (chunk + 1) * 4);
    if (
      offset === 0xffffffff
      || nextOffset === 0xffffffff
      || nextOffset <= offset
      || offset + 6 > audioData.length
    ) {
      return null;
    }

    return {
      chunk,
      dataBytes: nextOffset - offset,
      length: readUint32LE(audioData, offset),
      offset,
      priority: readUint16LE(audioData, offset + 4)
    };
  }

  private ServiceSourceSound(ticMs: number): void {
    if (!this.currentSound) {
      return;
    }

    this.soundSampleAccumulator += (SOURCE_PC_SOUND_SERVICE_HZ * ticMs) / 1000;
    const servicedSamples = Math.floor(this.soundSampleAccumulator);
    if (servicedSamples <= 0) {
      return;
    }

    this.soundSampleAccumulator -= servicedSamples;
    this.soundSamplesRemaining = Math.max(0, this.soundSamplesRemaining - servicedSamples);
    if (this.soundSamplesRemaining === 0) {
      this.SD_StopSound();
    }
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

  IN_KeyDown(keyCode: number): boolean {
    return this.keys.has(keyCode);
  }

  IN_AttackDown(): boolean {
    return this.IN_KeyDown(ATTACK_KEY_CODE);
  }

  KeyDown(keyCode: number): void {
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
      applyCompletedLevelTransition: () => boolean;
      applyDiedTransition: () => boolean;
      applyVictoriousTransition: () => boolean;
      exportPng: () => Promise<void>;
      exportState: () => Promise<void>;
      exportWav: () => Promise<void>;
      operateDoor: (index?: number) => void;
      reset: () => void;
      runDemo: () => Promise<void>;
      state: () => Record<string, unknown>;
      tick: (ticMs?: number) => Promise<void>;
    };
  }).wolf3dTypeScriptHarness = {
    applyCompletedLevelTransition: () => wlMain.ApplyCompletedLevelTransition(),
    applyDiedTransition: () => wlMain.ApplyDiedTransition(),
    applyVictoriousTransition: () => wlMain.ApplyVictoriousTransition(),
    exportPng: () => wlMain.ExportPng("harness", false),
    exportState: () => wlMain.ExportState("harness", false),
    exportWav: () => wlMain.ExportWav("harness", false),
    operateDoor: (index = 0) => wlMain.wl_game.OperateDoor(index),
    reset: () => wlMain.ResetGame(),
    runDemo: () => wlMain.RunDemoPlan(),
    state: () => wlMain.StateSnapshot(),
    tick: (ticMs = 1000 / 60) => wlMain.Tick(ticMs)
  };

  buttonReset.addEventListener("click", () => {
    wlMain.ResetGame();
  });

  buttonTick.addEventListener("click", () => {
    void wlMain.Tick(1000 / 60);
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
    areaConnectCounts: new Map(),
    areasByPlayer: new Set(),
    blockingStaticKeys: new Set(),
    doors: [],
    height,
    killTotal: 0,
    name: "fallback scaffold",
    objects,
    projectiles: [],
    pushWall: null,
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

function scanInfoPlane(map: WolfMap, difficulty: SourceDifficulty): ScanInfoPlaneResult {
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
        if (actor.mode === "stand" && (map.planes[0][y * width + x] ?? 0) === AMBUSHTILE) {
          actor.ambush = true;
        }

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

function mechaChaseFrames(): ActorStateFrame[] {
  return [
    { action: "mechaSound", name: "s_mechachase1", shapenum: ACTOR_SPRITES.MECHA_W1, tics: 10 },
    { name: "s_mechachase1s", shapenum: ACTOR_SPRITES.MECHA_W1, tics: 6 },
    { name: "s_mechachase2", shapenum: ACTOR_SPRITES.MECHA_W2, tics: 8 },
    { action: "mechaSound", name: "s_mechachase3", shapenum: ACTOR_SPRITES.MECHA_W3, tics: 10 },
    { name: "s_mechachase3s", shapenum: ACTOR_SPRITES.MECHA_W3, tics: 6 },
    { name: "s_mechachase4", shapenum: ACTOR_SPRITES.MECHA_W4, tics: 8 }
  ];
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

function deathFrames(frames: Array<[string, number, number, boolean?, ActorFrameAction?]>): ActorStateFrame[] {
  return frames.map(([name, shapenum, tics, final, action]) => {
    const frame: ActorStateFrame = {
      name,
      shapenum,
      tics
    };
    if (action) {
      frame.action = action;
    }

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
  const sequence =
    mode === "patrol"
      ? ACTOR_PATROL_STATES[kind]
      : mode === "chase"
        ? ACTOR_CHASE_STATES[kind]
        : mode === "ghost"
          ? ACTOR_GHOST_STATES[kind]
          : null;
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

function initialActorAwareness(ambush = false): Pick<PortActor, "ambush" | "firstAttack" | "reactionTime" | "visible"> {
  return {
    ambush,
    firstAttack: false,
    reactionTime: 0,
    visible: false
  };
}

function actorBaseSpeed(kind: string): number {
  return kind === "dog" || ACTOR_GHOST_STATES[kind] ? SPDDOG : SPDPATROL;
}

function actorChaseSpeed(kind: string, currentSpeed: number): number {
  switch (kind) {
    case "boss":
      return SPDPATROL * 3;
    case "dog":
      return currentSpeed * 2;
    case "real_hitler":
      return SPDPATROL * 5;
    case "guard":
    case "mutant":
    case "fake_hitler":
    case "fat":
    case "gift":
    case "gretel":
    case "hitler":
    case "schabbs":
      return currentSpeed * 3;
    case "officer":
      return currentSpeed * 5;
    case "ss":
      return currentSpeed * 4;
    default:
      return currentSpeed;
  }
}

function reactionDelayForActor(kind: string, rnd: () => number): number {
  switch (kind) {
    case "guard":
      return 1 + Math.floor(rnd() / 4);
    case "officer":
      return 2;
    case "dog":
      return 1 + Math.floor(rnd() / 8);
    case "mutant":
    case "ss":
      return 1 + Math.floor(rnd() / 6);
    case "boss":
    case "fake_hitler":
    case "fat":
    case "gift":
    case "gretel":
    case "hitler":
    case "real_hitler":
    case "schabbs":
      return 1;
    default:
      return 1;
  }
}

function mapDirectionToSourceDir(direction: number): number {
  return direction * 2;
}

function bossInitialDirection(kind: string): number {
  switch (kind) {
    case "boss":
    case "fat":
    case "hitler":
    case "schabbs":
      return 6;
    case "gift":
    case "gretel":
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
    case "real_hitler":
      return "hitler";
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
  difficulty: SourceDifficulty
): PortActor | null {
  if (tile === 124) {
    return {
      active: false,
      attackMode: false,
      dir: NODIR,
      hitpoints: 0,
      kind: "dead_guard",
      mode: "dead",
      shootable: false,
      ...initialActorAwareness(),
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
      active: guard.mode === "patrol",
      attackMode: false,
      hitpoints: actorHitpoints(guard.kind, difficulty),
      shootable: true,
      ...initialActorAwareness(),
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
      active: false,
      attackMode: false,
      dir,
      hitpoints: actorHitpoints(bossKind, difficulty),
      kind: bossKind,
      mode: "boss",
      shootable: true,
      ...initialActorAwareness(true),
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
      active: false,
      attackMode: false,
      dir: 0,
      hitpoints: actorHitpoints(ghostKind, difficulty),
      kind: ghostKind,
      mode: "ghost",
      shootable: false,
      ...initialActorAwareness(),
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
  difficulty: SourceDifficulty,
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

function difficultyRank(difficulty: SourceDifficulty): number {
  return difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0;
}

function hitpointRowForDifficulty(difficulty: SourceDifficulty): 0 | 1 | 2 | 3 {
  switch (difficulty) {
    case "baby":
      return 0;
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
  }
}

function actorHitpoints(kind: string, difficulty: SourceDifficulty): number {
  if (kind === "real_hitler") {
    return realHitlerHitpoints(difficulty);
  }

  const enemyIndex = ENEMY_HITPOINT_INDEX[kind] ?? 0;
  return START_HITPOINTS[hitpointRowForDifficulty(difficulty)][enemyIndex] ?? 25;
}

function realHitlerHitpoints(difficulty: SourceDifficulty): number {
  return REAL_HITLER_HITPOINTS[hitpointRowForDifficulty(difficulty)] ?? 700;
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
    case "real_hitler":
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

function createLevelRatios(): SourceLevelRatio[] {
  return Array.from({ length: SOURCE_LEVEL_RATIO_COUNT }, () => ({
    kill: 0,
    secret: 0,
    time: 0,
    treasure: 0
  }));
}

function createDefaultHighScores(): SourceHighScore[] {
  return DEFAULT_HIGH_SCORES.map((score) => ({ ...score, name: clampHighScoreName(score.name) }));
}

function clampHighScoreName(name: string): string {
  return name.slice(0, MAX_HIGH_NAME);
}

function formatClockSeconds(totalSeconds: number): string {
  const minutes = Math.trunc(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

function weaponAttackSound(weapon: number): SourceSoundName | null {
  switch (weapon) {
    case WP_PISTOL:
      return "ATKPISTOLSND";
    case WP_MACHINEGUN:
      return "ATKMACHINEGUNSND";
    case WP_CHAINGUN:
      return "ATKGATLINGSND";
    default:
      return null;
  }
}

function actorSightSound(kind: string): SourceSoundName | null {
  switch (kind) {
    case "boss":
      return "GUTENTAGSND";
    case "dog":
      return "DOGBARKSND";
    case "fake_hitler":
      return "TOT_HUNDSND";
    case "fat":
      return "ERLAUBENSND";
    case "gift":
      return "EINESND";
    case "gretel":
      return "KEINSND";
    case "guard":
      return "HALTSND";
    case "hitler":
    case "real_hitler":
      return "DIESND";
    case "officer":
      return "SPIONSND";
    case "schabbs":
      return "SCHABBSHASND";
    case "ss":
      return "SCHUTZADSND";
    default:
      return null;
  }
}

function actorShootSound(kind: string): SourceSoundName {
  switch (kind) {
    case "fat":
    case "gift":
      return "MISSILEFIRESND";
    case "boss":
    case "hitler":
    case "real_hitler":
      return "BOSSFIRESND";
    case "schabbs":
      return "SCHABBSTHROWSND";
    case "ss":
      return "SSFIRESND";
    default:
      return "NAZIFIRESND";
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

function projectileRgb(projectile: PortProjectile): [number, number, number] {
  switch (projectile.kind) {
    case "boom":
      return [244, 190, 70];
    case "fire":
      return [238, 72, 48];
    case "needle":
      return [96, 212, 126];
    case "rocket":
      return [228, 132, 52];
    case "smoke":
      return [132, 132, 126];
    default:
      return [220, 220, 190];
  }
}

function actorRgb(actor: PortActor): [number, number, number] {
  if (actor.mode === "dead" || actor.mode === "dying") {
    return [96, 60, 54];
  }

  if (actor.mode === "ghost") {
    return [150, 126, 182];
  }

  if (actor.mode === "victory") {
    return [194, 154, 98];
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

function projectileSpriteDescriptor(projectile: PortProjectile, playerAngle: number): ActorSpriteDescriptor | null {
  const frame = PROJECTILE_STATES[projectile.kind]?.[projectile.stateIndex];
  if (!frame) {
    return null;
  }

  return {
    rotate: frame.rotate ?? false,
    shapenum: frame.rotate ? frame.shapenum + calcProjectileRotate(projectile, playerAngle) : frame.shapenum
  };
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

  if (actor.mode === "attack") {
    return {
      rotate: false,
      shapenum: actor.stateShapenum ?? ACTOR_STAND_SPRITES[actor.kind] ?? ACTOR_SPRITES.GRD_S_1
    };
  }

  if (actor.mode === "victory") {
    return {
      rotate: false,
      shapenum: actor.stateShapenum ?? ACTOR_SPRITES.BJ_W1
    };
  }

  if (actor.mode === "ghost") {
    const shapenum = actor.stateShapenum ?? ACTOR_GHOST_SPRITES[actor.kind];
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
  const playerAngleDegrees = gameAngleToSourceDegrees(playerAngle);
  const dirType = Math.max(0, Math.min(8, actor.dir));
  const actorDirection = DIR_ANGLE_DEGREES[dirType] ?? 0;
  const rotateAngle = normalizeDegrees(playerAngleDegrees - 180 - actorDirection + 360 / 16);
  return Math.floor(rotateAngle / (360 / 8)) % 8;
}

function calcProjectileRotate(projectile: PortProjectile, playerAngle: number): number {
  const playerAngleDegrees = gameAngleToSourceDegrees(playerAngle);
  const projectileDirection = gameAngleToSourceDegrees(projectile.angle);
  const rotateAngle = normalizeDegrees(playerAngleDegrees - 180 - projectileDirection + 360 / 16);
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
  if (tile === AMBUSHTILE || tile >= AREATILE) {
    return 0;
  }

  return tile;
}

function pushWallDelta(dir: PushWallDirection): { dx: number; dy: number } {
  switch (dir) {
    case "east":
      return { dx: 1, dy: 0 };
    case "north":
      return { dx: 0, dy: -1 };
    case "south":
      return { dx: 0, dy: 1 };
    case "west":
      return { dx: -1, dy: 0 };
  }
}

function pushWallProgress(pushWall: PortPushWall): number {
  return Math.max(0, Math.min(63, pushWall.pos)) / 64;
}

function pushWallRenderTile(pushWall: PortPushWall, tileX: number, tileY: number): boolean {
  if (tileX === pushWall.x && tileY === pushWall.y) {
    return true;
  }

  const delta = pushWallDelta(pushWall.dir);
  return tileX === pushWall.x + delta.dx && tileY === pushWall.y + delta.dy;
}

function areaConnectionKey(area1: number, area2: number): string {
  const low = Math.min(area1, area2);
  const high = Math.max(area1, area2);
  return `${low},${high}`;
}

function parseAreaConnectionKey(key: string): [number, number] {
  const [area1, area2] = key.split(",").map((part) => Number(part));
  return [area1 ?? 0, area2 ?? 0];
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

function readStartLevel(): number {
  const params = new URLSearchParams(window.location.search);
  const rawLevel = params.get("map") ?? params.get("level");
  const level = rawLevel === null ? 0 : Number(rawLevel);
  if (!Number.isInteger(level)) {
    return 0;
  }

  return Math.max(0, Math.min(59, level));
}

function readDifficulty(): SourceDifficulty {
  const params = new URLSearchParams(window.location.search);
  return normalizeDifficulty(params.get("difficulty") ?? params.get("skill")) ?? "medium";
}

function normalizeDifficulty(value: string | null): SourceDifficulty | null {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "baby"
    || normalized === "easy"
    || normalized === "medium"
    || normalized === "hard"
  ) {
    return normalized;
  }

  return null;
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
  return Math.max(1, Math.round((milliseconds * SOURCE_TICS_PER_SECOND) / 1000));
}

function clampSourceControl(value: number, tics: number): number {
  const max = SOURCE_MAX_CONTROL * tics;
  return Math.max(-max, Math.min(max, value));
}

function sourceAngleUnitsToRadians(angleUnits: number): number {
  return (angleUnits / SOURCE_ANGLES) * Math.PI * 2;
}

function gameAngleToSourceDegrees(angle: number): number {
  return normalizeDegrees((-angle * SOURCE_ANGLES) / (Math.PI * 2));
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
