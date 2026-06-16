import { cdiv, i16, i32, readU16LE } from "./TS_C";
import { MAPSIZE } from "./TS_WL6_ASSETS";
import { DOSMemory } from "./TS_DOS_MEMORY";
import { US_RndT } from "./ID_US_A.ASM";
import { SD_PlaySound, SD_Poll, SD_SoundPlaying, SDL_t0Service, type SoundModeSummary } from "./ID_SD.C";
import { DEMOTICS, NUMBUTTONS, type DemoTicCommand } from "./TS_DEMO";
import {
  STRUCT_LAYOUTS,
  type DOSByteSource,
  STATETYPE_SYMBOLS,
  nearOffsetForRuntimeSymbol,
  nearOffsetForSymbol,
  statetypeNearOffset,
} from "./TS_SAVE_LAYOUT";

export const AREATILE = 107;
export const AMBUSHTILE = 106;
export const MAXACTORS = 150;
export const MAXSTATS = 400;
export const MAXDOORS = 64;
export const NUMAREAS = 37;

const OBJTYPE_BYTES = STRUCT_LAYOUTS.objtype.bytes;
const OBJ_ACTIVE_OFFSET = 0;
const OBJ_TICCOUNT_OFFSET = 2;
const OBJ_CLASS_OFFSET = 4;
const OBJ_STATE_OFFSET = 6;
const OBJ_FLAGS_OFFSET = 8;
const OBJ_DISTANCE_OFFSET = 10;
const OBJ_DIR_OFFSET = 14;
const OBJ_X_OFFSET = 16;
const OBJ_Y_OFFSET = 20;
const OBJ_TILEX_OFFSET = 24;
const OBJ_TILEY_OFFSET = 26;
const OBJ_AREANUMBER_OFFSET = 28;
const OBJ_VIEWX_OFFSET = 30;
const OBJ_VIEWHEIGHT_OFFSET = 32;
const OBJ_TRANSX_OFFSET = 34;
const OBJ_TRANSY_OFFSET = 38;
const OBJ_ANGLE_OFFSET = 42;
const OBJ_HITPOINTS_OFFSET = 44;
const OBJ_SPEED_OFFSET = 46;
const OBJ_TEMP1_OFFSET = 50;
const OBJ_TEMP2_OFFSET = 52;
const OBJ_NEXT_OFFSET = 56;
const OBJ_PREV_OFFSET = 58;
const AC_YES = 1;
const PLAYEROBJ = 1;
const INERTOBJ = 2;
const GUARDOBJ = 3;
const OFFICEROBJ = 4;
const SSOBJ = 5;
const DOGOBJ = 6;
const BOSSOBJ = 7;
const SCHABBOBJ = 8;
const FAKEOBJ = 9;
const MECHAHITLEROBJ = 10;
const MUTANTOBJ = 11;
const GHOSTOBJ = 15;
const REALHITLEROBJ = 16;
const SPECTREOBJ = 21;
const GRETELOBJ = 17;
const GIFTOBJ = 18;
const FATOBJ = 19;
const NEEDLEOBJ = 12;
const FIREOBJ = 13;
const ROCKETOBJ = 20;
const BJOBJ = 14;
const HROCKETOBJ = 27;
const SPARKOBJ = 28;
const FL_SHOOTABLE = 1;
const FL_NEVERMARK = 4;
const FL_VISABLE = 8;
const FL_ATTACKMODE = 16;
const FL_FIRSTATTACK = 32;
const FL_AMBUSH = 64;
const FL_NONMARK = 128;
const GLOBAL1 = 1 << 16;
const TILEGLOBAL = GLOBAL1;
const TILESHIFT = 16;
const UNSIGNEDSHIFT = 8;
const ACTORSIZE = 0x4000;
const TILE_OBJECT_SIZE = 0x2000;
const PROJSIZE = 0x2000;
const PROJECTILESIZE = 0xc000;
const FOCALLENGTH = 0x5700;
const VIEWGLOBAL = 0x10000;
const DEFAULT_VIEW_SIZE = 15;
const NORTH = 0;
const EAST = 0;
const NORTHEAST = 1;
const DIR_NORTH = 2;
const NORTHWEST = 3;
const WEST = 4;
const SOUTHWEST = 5;
const SOUTH = 6;
const SOUTHEAST = 7;
const NODIR = 8;
const ANGLES = 360;
const ANGLEQUAD = ANGLES / 4;
const SPDPATROL = 512;
const SPDDOG = 1500;
const BJRUNSPEED = 2048;
const BJJUMPSPEED = 680;
const HITLER_MORPH_HITPOINTS = [500, 700, 800, 900] as const;
const YEAHSND = 72;
const DOGDEATHSND = 10;
const DEATHSCREAM2SND = 22;
const DEATHSCREAM3SND = 25;
const DEATHSCREAM1SND = 29;
const AHHHGSND = 52;
const LEBENSND = 56;
const NEINSOVASSND = 67;
// AUDIOWL6 sound indices used by the in-game feedback restored from WL_STATE/WL_ACT/WL_AGENT.
const NOWAYSND = 6;
const GETKEYSND = 12;
const OPENDOORSND = 18;
const CLOSEDOORSND = 19;
const HALTSND = 21;
const GETAMMOSND = 31;
const HEALTH1SND = 33;
const HEALTH2SND = 34;
const BONUS1SND = 35;
const BONUS2SND = 36;
const BONUS3SND = 37;
const BONUS4SND = 45;
const LEVELDONESND = 40;
const DOGBARKSND = 41;
const BONUS1UPSND = 44;
const PUSHWALLSND = 46;
const MUTTISND = 50;
const SCHUTZADSND = 51;
const DIESND = 53;
const EVASND = 54;
const GUTENTAGSND = 55;
const SCHEISTSND = 57;
const NAZIFIRESND = 58;
const BOSSFIRESND = 59;
const SSFIRESND = 60;
const TOT_HUNDSND = 62;
const MEINGOTTSND = 63;
const SCHABBSHASND = 64;
const HITLERHASND = 65;
const SPIONSND = 66;
const DOGATTACKSND = 68;
const FLAMETHROWERSND = 69;
const DONNERSND = 79;
const EINESND = 80;
const ERLAUBENSND = 81;
const KEINSND = 82;
const MEINSND = 83;
const ROSESND = 84;
const MISSILEFIRESND = 85;
const DEATHSCREAM4SND = 73;
const DEATHSCREAM5SND = 74;
const DEATHSCREAM6SND = 75;
const DEATHSCREAM7SND = 76;
const DEATHSCREAM8SND = 77;
const DEATHSCREAM9SND = 78;
const MINSIGHT = 0x18000;
const DOOR_TILEX_OFFSET = 0;
const DOOR_TILEY_OFFSET = 1;
const DOOR_VERTICAL_OFFSET = 2;
const DOOR_LOCK_OFFSET = 4;
const DOOR_ACTION_OFFSET = 6;
const DOOR_TICCOUNT_OFFSET = 8;
const DR_OPEN = 0;
const DR_CLOSED = 1;
const DR_OPENING = 2;
const DR_CLOSING = 3;
const OPENTICS = 300;
const NUMREDSHIFTS = 6;
const NUMWHITESHIFTS = 3;
const WHITETICS = 6;
const STAT_TILEX_OFFSET = 0;
const STAT_TILEY_OFFSET = 1;
const STAT_VISSPOT_OFFSET = 2;
const STAT_SHAPENUM_OFFSET = 4;
const STAT_FLAGS_OFFSET = 6;
const STAT_ITEMNUMBER_OFFSET = 7;
const FL_BONUS = 2;
const GAMESTATE_SCORE_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "score");
const GAMESTATE_NEXTEXTRA_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "nextextra");
const GAMESTATE_LIVES_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "lives");
const GAMESTATE_AMMO_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "ammo");
const GAMESTATE_KEYS_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "keys");
const GAMESTATE_BESTWEAPON_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "bestweapon");
const GAMESTATE_WEAPON_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "weapon");
const GAMESTATE_CHOSENWEAPON_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "chosenweapon");
const GAMESTATE_ATTACKFRAME_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "attackframe");
const GAMESTATE_ATTACKCOUNT_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "attackcount");
const GAMESTATE_WEAPONFRAME_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "weaponframe");
const GAMESTATE_FACEFRAME_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "faceframe");
const GAMESTATE_MAPON_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "mapon");
const GAMESTATE_DIFFICULTY_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "difficulty");
const GAMESTATE_TREASURECOUNT_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "treasurecount");
const GAMESTATE_TIMECOUNT_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "TimeCount");
const GAMESTATE_KILLCOUNT_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "killcount");
const GAMESTATE_SECRETTOTAL_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "secrettotal");
const GAMESTATE_TREASURETOTAL_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "treasuretotal");
const GAMESTATE_KILLTOTAL_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "killtotal");
const GAMESTATE_SECRETCOUNT_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "secretcount");
const GAMESTATE_HEALTH_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "health");
const GAMESTATE_KILLX_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "killx");
const GAMESTATE_KILLY_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "killy");
const GAMESTATE_VICTORYFLAG_OFFSET = structFieldOffset(STRUCT_LAYOUTS.gametype, "victoryflag");
const MINACTORDIST = 0x10000;
const MINDIST = 0x5800;
const PLAYERSIZE = MINDIST;
const ICONARROWS = 90;
const RUNSPEED = 6000;
const GD_BABY = 0;
const EX_COMPLETED = 1;
const EX_DIED = 2;
const EX_VICTORIOUS = 6;
const EX_SECRETLEVEL = 9;
const ATKGATLINGSND = 11;
const ATKKNIFESND = 23;
const ATKPISTOLSND = 24;
const ATKMACHINEGUNSND = 26;
const GETMACHINESND = 30;
const GETGATLINGSND = 38;
const SLURPIESND = 61;
const EXTRAPOINTS = 40000;
const WP_KNIFE = 0;
const WP_PISTOL = 1;
const WP_MACHINEGUN = 2;
const WP_CHAINGUN = 3;
const BT_ATTACK = 0;
const BT_STRAFE = 1;
const BT_USE = 3;
const BT_READYKNIFE = 4;
const MOVESCALE = 150;
const BACKMOVESCALE = 100;
const ANGLESCALE = 20;
const PUSHABLETILE = 98;
const EXITTILE = 99;
const ELEVATORTILE = 21;
const ALTELEVATORTILE = 107;
const DI_NORTH = 0;
const DI_EAST = 1;
const DI_SOUTH = 2;
const DI_WEST = 3;

const dressing = 0;
const block = 1;
const bo_gibs = 2;
const bo_alpo = 3;
const bo_firstaid = 4;
const bo_key1 = 5;
const bo_key2 = 6;
const bo_key3 = 7;
const bo_key4 = 8;
const bo_cross = 9;
const bo_chalice = 10;
const bo_bible = 11;
const bo_crown = 12;
const bo_clip = 13;
const bo_clip2 = 14;
const bo_machinegun = 15;
const bo_chaingun = 16;
const bo_food = 17;
const bo_fullheal = 18;
const bo_25clip = 19;
const bo_spear = 20;

const OPPOSITE_DIR = [
  WEST,
  SOUTHWEST,
  SOUTH,
  SOUTHEAST,
  EAST,
  NORTHEAST,
  DIR_NORTH,
  NORTHWEST,
  NODIR,
] as const;

const DIAGONAL_DIR = [
  [NODIR, NODIR, NORTHEAST, NODIR, NODIR, NODIR, SOUTHEAST, NODIR, NODIR],
  [NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR],
  [NORTHEAST, NODIR, NODIR, NODIR, NORTHWEST, NODIR, NODIR, NODIR, NODIR],
  [NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR],
  [NODIR, NODIR, NORTHWEST, NODIR, NODIR, NODIR, SOUTHWEST, NODIR, NODIR],
  [NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR],
  [SOUTHEAST, NODIR, NODIR, NODIR, SOUTHWEST, NODIR, NODIR, NODIR, NODIR],
  [NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR],
  [NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR, NODIR],
] as const;

export const en_guard = 0;
export const en_officer = 1;
export const en_ss = 2;
export const en_dog = 3;
export const en_boss = 4;
export const en_schabbs = 5;
export const en_fake = 6;
export const en_hitler = 7;
export const en_mutant = 8;
export const en_blinky = 9;
export const en_clyde = 10;
export const en_pinky = 11;
export const en_inky = 12;
export const en_gretel = 13;
export const en_gift = 14;
export const en_fat = 15;
export const en_spectre = 16;
export const en_angel = 17;
export const en_trans = 18;
export const en_uber = 19;
export const en_will = 20;
export const en_death = 21;

export const starthitpoints = [
  [
    25, 50, 100, 1, 850, 850, 200, 800, 45, 25, 25, 25, 25, 850, 850, 850, 5,
    1450, 850, 1050, 950, 1250,
  ],
  [
    25, 50, 100, 1, 950, 950, 300, 950, 55, 25, 25, 25, 25, 950, 950, 950, 10,
    1550, 950, 1150, 1050, 1350,
  ],
  [
    25, 50, 100, 1, 1050, 1550, 400, 1050, 55, 25, 25, 25, 25, 1050, 1050,
    1050, 15, 1650, 1050, 1250, 1150, 1450,
  ],
  [
    25, 50, 100, 1, 1200, 2400, 500, 1200, 65, 25, 25, 25, 25, 1200, 1200,
    1200, 25, 2000, 1200, 1400, 1300, 1600,
  ],
] as const;

const INITIAL_STATE_TICTIME: Readonly<Record<string, number>> = {
  _s_grdstand: 0,
  _s_grdpath1: 20,
  _s_grddie4: 0,
  _s_grdshoot1: 20,
  _s_blinkychase1: 10,
  _s_inkychase1: 10,
  _s_pinkychase1: 10,
  _s_clydechase1: 10,
  _s_dogjump1: 10,
  _s_dogchase1: 10,
  _s_dogpath1: 20,
  _s_ofcstand: 0,
  _s_ofcshoot1: 6,
  _s_ofcpath1: 20,
  _s_mutstand: 0,
  _s_mutshoot1: 6,
  _s_mutpath1: 20,
  _s_ssstand: 0,
  _s_ssshoot1: 20,
  _s_sspath1: 20,
  _s_bossstand: 0,
  _s_bossshoot1: 30,
  _s_gretelstand: 0,
  _s_gretelshoot1: 30,
  _s_schabbstand: 0,
  _s_schabbchase1: 10,
  _s_giftstand: 0,
  _s_giftchase1: 10,
  _s_fatstand: 0,
  _s_fatchase1: 10,
  _s_fakestand: 0,
  _s_fakechase1: 10,
  _s_mechastand: 0,
  _s_mechashoot1: 30,
  _s_hitlershoot1: 30,
};

const STAND_STATE_NAMES = [
  "_s_grdstand",
  "_s_ofcstand",
  "_s_mutstand",
  "_s_ssstand",
  "_s_bossstand",
  "_s_gretelstand",
  "_s_schabbstand",
  "_s_giftstand",
  "_s_fatstand",
  "_s_fakestand",
  "_s_mechastand",
] as const;
const PATH_STATE_GROUPS = ["grd", "dog", "ofc", "mut", "ss"] as const;
const PATH_STATE_STEPS = [
  ["path1", 20, "T_Path", "path1s"],
  ["path1s", 5, null, "path2"],
  ["path2", 15, "T_Path", "path3"],
  ["path3", 20, "T_Path", "path3s"],
  ["path3s", 5, null, "path4"],
  ["path4", 15, "T_Path", "path1"],
] as const;

const CHASE_STATE_GROUPS = [
  ["grd", 10, 3, 8, 10, 3, 8],
  ["ofc", 10, 3, 8, 10, 3, 8],
  ["mut", 10, 3, 8, 10, 3, 8],
  ["ss", 10, 3, 8, 10, 3, 8],
  ["boss", 10, 3, 8, 10, 3, 8],
  ["gretel", 10, 3, 8, 10, 3, 8],
  ["mecha", 10, 6, 8, 10, 6, 8],
  ["hitler", 6, 4, 2, 6, 4, 2],
] as const;

const DOG_CHASE_STATE_GROUP = ["dog", 10, 3, 8, 10, 3, 8] as const;
const CHASE_STATE_SUFFIXES = ["chase1", "chase1s", "chase2", "chase3", "chase3s", "chase4"] as const;
const CHASE_STATE_THINKS = ["T_Chase", null, "T_Chase", "T_Chase", null, "T_Chase"] as const;
const CHASE_STATE_NEXT_SUFFIXES = [
  "chase1s",
  "chase2",
  "chase3",
  "chase3s",
  "chase4",
  "chase1",
] as const;
const PROJECTILE_BOSS_CHASE_TICTIMES = [10, 3, 8, 10, 3, 8] as const;

const GHOST_CHASE_STATE_GROUPS = ["blinky", "inky", "pinky", "clyde"] as const;
const BOSS_PROJECTILE_CHASE_STATE_GROUPS = [
  ["schabb", "T_Schabb"],
  ["gift", "T_Gift"],
  ["fat", "T_Fat"],
  ["fake", "T_Fake"],
] as const;
const SINTABLE = buildSinTable();
const ATTACK_INFO = [
  [
    { tics: 6, attack: 0, frame: 1 },
    { tics: 6, attack: 2, frame: 2 },
    { tics: 6, attack: 0, frame: 3 },
    { tics: 6, attack: -1, frame: 4 },
  ],
  [
    { tics: 6, attack: 0, frame: 1 },
    { tics: 6, attack: 1, frame: 2 },
    { tics: 6, attack: 0, frame: 3 },
    { tics: 6, attack: -1, frame: 4 },
  ],
  [
    { tics: 6, attack: 0, frame: 1 },
    { tics: 6, attack: 1, frame: 2 },
    { tics: 6, attack: 3, frame: 3 },
    { tics: 6, attack: -1, frame: 4 },
  ],
  [
    { tics: 6, attack: 0, frame: 1 },
    { tics: 6, attack: 1, frame: 2 },
    { tics: 6, attack: 4, frame: 3 },
    { tics: 6, attack: -1, frame: 4 },
  ],
] as const;

type StateThink =
  | "T_Player"
  | "T_Attack"
  | "T_Path"
  | "T_Stand"
  | "T_Chase"
  | "T_DogChase"
  | "T_Ghosts"
  | "T_Schabb"
  | "T_Gift"
  | "T_Fat"
  | "T_Fake"
  | "T_Projectile"
  | "T_BJRun"
  | "T_BJJump"
  | null;
type ProjectileSpawnAction = "T_SchabbThrow" | "T_GiftThrow" | "T_FakeFire";
type StateAction =
  | "T_Shoot"
  | "T_Bite"
  | "T_Projectile"
  | "A_DeathScream"
  | "A_HitlerMorph"
  | "A_StartDeathCam"
  | "A_Smoke"
  | "T_BJYell"
  | "T_BJDone"
  | ProjectileSpawnAction
  | null;

interface StateDefinition {
  readonly name: string;
  readonly tictime: number;
  readonly think: StateThink;
  readonly action: StateAction;
  readonly next: string | null;
}

const STATE_DEFINITIONS: Readonly<Record<string, StateDefinition>> = buildStateDefinitions();

export const STATINFO_WL6 = [
  [2, dressing],
  [3, block],
  [4, block],
  [5, block],
  [6, dressing],
  [7, block],
  [8, bo_alpo],
  [9, block],
  [10, block],
  [11, dressing],
  [12, block],
  [13, block],
  [14, block],
  [15, block],
  [16, dressing],
  [17, dressing],
  [18, block],
  [19, block],
  [20, block],
  [21, dressing],
  [22, bo_key1],
  [23, bo_key2],
  [24, block],
  [25, dressing],
  [26, bo_food],
  [27, bo_firstaid],
  [28, bo_clip],
  [29, bo_machinegun],
  [30, bo_chaingun],
  [31, bo_cross],
  [32, bo_chalice],
  [33, bo_bible],
  [34, bo_crown],
  [35, bo_fullheal],
  [36, bo_gibs],
  [37, block],
  [38, block],
  [39, block],
  [40, bo_gibs],
  [41, block],
  [42, block],
  [43, dressing],
  [44, dressing],
  [45, dressing],
  [46, dressing],
  [47, block],
  [48, block],
  [49, dressing],
  [28, bo_clip2],
] as const;

export interface WallPlaneCopySummary {
  readonly walls: number;
  readonly floors: number;
}

export interface AmbushCleanupSummary {
  readonly ambushMarkers: number;
}

export interface ActorListSummary {
  readonly player: number;
  readonly objfreelist: number;
  readonly lastobj: number;
  readonly objcount: number;
}

export interface RemoveObjSummary {
  readonly actor: number;
  readonly prev: number;
  readonly next: number;
  readonly objfreelist: number;
  readonly lastobj: number;
  readonly objcount: number;
}

export interface StaticListSummary {
  readonly laststatobj: number;
  readonly capacity: typeof MAXSTATS;
}

export interface DoorListSummary {
  readonly lastdoorobj: number;
  readonly doornum: 0;
  readonly areaconnectCleared: boolean;
}

export interface DoorSpawnSummary {
  readonly door: number;
  readonly doorIndex: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly vertical: boolean;
  readonly lock: number;
}

export interface DoorScanSummary {
  readonly doors: number;
}

export interface StaticSpawnOptions {
  readonly loadedgame?: boolean;
}

export interface StaticSpawnSummary {
  readonly statobj: number;
  readonly type: number;
  readonly picnum: number;
  readonly itemType: number;
}

export interface StaticScanSummary {
  readonly statics: number;
}

export interface PlayerSpawnSummary {
  readonly player: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly dir: number;
  readonly angle: number;
}

export interface PlayerStartScanSummary {
  readonly players: number;
}

export interface SecretPushwallScanSummary {
  readonly secretPushwalls: number;
}

export interface SpawnNewObjSummary {
  readonly actor: number;
  readonly state: string;
  readonly tilex: number;
  readonly tiley: number;
  readonly ticcount: number;
}

export interface EnemySpawnOptions {
  readonly loadedgame?: boolean;
  readonly difficulty?: number;
}

export interface EnemySpawnSummary {
  readonly actor: number;
  readonly which: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly state: string;
}

export interface EnemyScanSummary {
  readonly enemies: number;
  readonly killtotal: number;
  readonly actors: number;
}

export interface TryWalkSummary {
  readonly moved: boolean;
  readonly door: number | null;
}

export interface SightPlayerOptions {
  readonly tics?: number;
  readonly madenoise?: boolean;
  readonly plux?: number;
  readonly pluy?: number;
  readonly gatlingSoundPlaying?: boolean;
}

export interface PathStepOptions extends SightPlayerOptions {
  readonly sightPlayer?: boolean | ((actor: number, dgroup: DOSMemory) => boolean);
}

export interface PathStepSummary {
  readonly actor: number;
  readonly moved: boolean;
  readonly blocked: boolean;
  readonly waitingForDoor: number | null;
  readonly sightedPlayer: boolean;
}

export interface ChaseStepSummary {
  readonly actor: number;
  readonly moved: boolean;
  readonly attacked: boolean;
  readonly blocked: boolean;
  readonly waitingForDoor: number | null;
  readonly selectedDir: number;
  readonly state: string | null;
}

export interface DamageSummary {
  readonly attacker: number;
  readonly points: number;
  readonly health: number;
  readonly died: boolean;
  readonly damagecount: number;
}

export interface PaletteShiftSummary {
  readonly damagecount: number;
  readonly bonuscount: number;
  readonly red: number;
  readonly white: number;
  readonly palshifted: boolean;
  readonly palette: "red" | "white" | "normal" | "none";
}

export interface FaceUpdateSummary {
  readonly facecount: number;
  readonly faceframe: number;
  readonly changed: boolean;
  readonly skipped: boolean;
}

export interface PollControlsOptions {
  readonly demoCommand?: DemoTicCommand;
  readonly demoDone?: boolean;
  readonly tics?: number;
  readonly pollControls?: (dgroup: DOSMemory, tics: number) => unknown;
}

export interface PollControlsSummary {
  readonly tics: number;
  readonly controlx: number;
  readonly controly: number;
  readonly playstate: number;
  readonly buttonbits: number;
  readonly buttonstate: readonly boolean[];
  readonly buttonheld: readonly boolean[];
}

export interface PlayLoopStepOptions extends PollControlsOptions, SightPlayerOptions {
  readonly areaconnect?: DOSByteSource;
  readonly projectActorVisibility?: boolean;
  readonly viewwidth?: number;
  readonly scale?: number;
  readonly focallength?: number;
  readonly centerx?: number;
  readonly shootdelta?: number;
}

export interface PlayLoopStepSummary {
  readonly controls: PollControlsSummary;
  readonly doors: MoveDoorsSummary;
  readonly pwalls: MovePWallsSummary;
  readonly actorSteps: readonly ActorStepSummary[];
  readonly palette: PaletteShiftSummary;
  readonly viewProjection: ViewProjectionSummary | null;
  readonly sound: SoundModeSummary;
  readonly timeCount: number;
  readonly playstate: number;
}

export interface ViewProjectionSummary {
  readonly centerx: number;
  readonly shootdelta: number;
  readonly viewx: number;
  readonly viewy: number;
  readonly viewangle: number;
  readonly scale: number;
  readonly pickedBonuses: number;
  readonly visibleActors: number;
}

export interface PlacedItemSummary {
  readonly statobj: number;
  readonly type: number;
  readonly picnum: number;
  readonly itemType: number;
  readonly tilex: number;
  readonly tiley: number;
}

export interface DropItemSummary {
  readonly placed: PlacedItemSummary | null;
}

export interface KillActorSummary {
  readonly actor: number;
  readonly obclass: number;
  readonly state: string | null;
  readonly score: number;
  readonly lives: number;
  readonly killcount: number;
  readonly dropped: PlacedItemSummary | null;
  readonly killx: number;
  readonly killy: number;
}

export interface ActorDamageSummary {
  readonly actor: number;
  readonly damage: number;
  readonly doubled: boolean;
  readonly hitpoints: number;
  readonly killed: boolean;
  readonly madenoise: true;
  readonly state: string | null;
  readonly kill: KillActorSummary | null;
}

export interface PointsSummary {
  readonly score: number;
  readonly nextextra: number;
  readonly lives: number;
}

export interface AmmoSummary {
  readonly ammo: number;
  readonly weapon: number;
}

export interface WeaponSummary {
  readonly ammo: number;
  readonly bestweapon: number;
  readonly weapon: number;
  readonly chosenweapon: number;
}

export interface KeySummary {
  readonly keys: number;
}

export interface HealSummary {
  readonly health: number;
  readonly gotgatgun: number;
}

export interface BonusSummary {
  readonly statobj: number;
  readonly itemnumber: number;
  readonly picked: boolean;
  readonly health: number;
  readonly ammo: number;
  readonly score: number;
  readonly lives: number;
  readonly keys: number;
  readonly treasurecount: number;
  readonly weapon: number;
  readonly removed: boolean;
}

export interface WeaponChangeSummary {
  readonly changed: boolean;
  readonly weapon: number;
  readonly chosenweapon: number;
}

export interface CmdFireSummary {
  readonly player: number;
  readonly state: string | null;
  readonly attackframe: number;
  readonly attackcount: number;
  readonly weaponframe: number;
  readonly buttonHeldAttack: boolean;
}

export interface PlayerAttackSummary {
  readonly actor: number;
  readonly target: number | null;
  readonly hit: boolean;
  readonly damage: number;
  readonly dist: number;
  readonly lineClear: boolean | null;
  readonly madenoise: boolean;
  readonly damageResult: ActorDamageSummary | null;
}

export interface AttackTickSummary {
  readonly actor: number;
  readonly state: string | null;
  readonly attackframe: number;
  readonly attackcount: number;
  readonly weaponframe: number;
  readonly ammo: number;
  readonly weapon: number;
  readonly ended: boolean;
  readonly attacks: readonly PlayerAttackSummary[];
  readonly movement: ControlMovementSummary | VictorySpinSummary | null;
}

export interface PlayerTryMoveSummary {
  readonly actor: number;
  readonly ok: boolean;
  readonly blockedBy: "wall" | "actor" | null;
  readonly blocker: number | null;
  readonly tilex: number | null;
  readonly tiley: number | null;
}

export interface ClipMoveSummary {
  readonly actor: number;
  readonly moved: boolean;
  readonly mode: "both" | "noclip" | "x" | "y" | "none";
  readonly x: number;
  readonly y: number;
}

export interface ThrustSummary {
  readonly player: number;
  readonly angle: number;
  readonly speed: number;
  readonly clippedSpeed: number;
  readonly xmove: number;
  readonly ymove: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly areanumber: number;
  readonly victory: boolean;
  readonly clip: ClipMoveSummary;
}

export interface ControlMovementSummary {
  readonly actor: number;
  readonly angle: number;
  readonly thrustspeed: number;
  readonly playerxmove: number;
  readonly playerymove: number;
  readonly victory: boolean;
  readonly thrusts: readonly ThrustSummary[];
}

export interface VictorySpinSummary {
  readonly player: number;
  readonly angle: number;
  readonly y: number;
  readonly desty: number;
}

export interface CloseDoorSummary {
  readonly door: number;
  readonly closed: boolean;
  readonly blocked: boolean;
  readonly action: number;
}

export interface AreaConnectSummary {
  readonly playerArea: number;
  readonly visibleAreas: number;
}

export interface DoorTickSummary {
  readonly door: number;
  readonly action: number;
  readonly position: number;
  readonly ticcount: number;
  readonly connected: boolean;
  readonly disconnected: boolean;
  readonly blocked: boolean;
  readonly reopened: boolean;
}

export interface MoveDoorsSummary {
  readonly moved: number;
  readonly opened: number;
  readonly closed: number;
  readonly skippedVictory: boolean;
  readonly doors: readonly DoorTickSummary[];
}

export interface OperateDoorSummary {
  readonly door: number;
  readonly operated: boolean;
  readonly locked: boolean;
  readonly action: number;
  readonly close: CloseDoorSummary | null;
}

export interface PushWallSummary {
  readonly pushed: boolean;
  readonly blocked: boolean;
  readonly busy: boolean;
  readonly tilex: number;
  readonly tiley: number;
  readonly dir: number;
}

export interface MovePWallsSummary {
  readonly active: boolean;
  readonly crossedBlock: boolean;
  readonly stopped: boolean;
  readonly pwallstate: number;
  readonly pwallpos: number;
  readonly pwallx: number;
  readonly pwally: number;
}

export interface CmdUseSummary {
  readonly checkx: number;
  readonly checky: number;
  readonly dir: number;
  readonly action: "pushwall" | "elevator" | "door" | "nothing";
  readonly playstate: number;
  readonly door: OperateDoorSummary | null;
  readonly pushwall: PushWallSummary | null;
}

export interface PlayerTickSummary {
  readonly actor: number;
  readonly state: string | null;
  readonly plux: number;
  readonly pluy: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly victory: boolean;
  readonly weaponChange: WeaponChangeSummary | null;
  readonly fired: CmdFireSummary | null;
  readonly used: CmdUseSummary | null;
  readonly movement: ControlMovementSummary | VictorySpinSummary;
}

export interface ShootSummary {
  readonly actor: number;
  readonly areaVisible: boolean;
  readonly lineClear: boolean;
  readonly visible: boolean;
  readonly hit: boolean;
  readonly damage: number;
  readonly hitchance: number;
  readonly hitRoll: number | null;
  readonly damageRoll: number | null;
  readonly dist: number;
  readonly thrustspeed: number;
  readonly health: number;
}

export interface BiteSummary {
  readonly actor: number;
  readonly close: boolean;
  readonly hit: boolean;
  readonly damage: number;
  readonly health: number;
}

export interface SmokeSummary {
  readonly actor: number;
  readonly source: number;
  readonly state: string;
  readonly ticcount: number;
}

export interface HitlerMorphSummary {
  readonly source: number;
  readonly actor: number;
  readonly state: string;
  readonly hitpoints: number;
  readonly speed: number;
}

export interface BJVictorySpawnSummary {
  readonly actor: number;
  readonly state: "_s_bjrun1";
  readonly tilex: number;
  readonly tiley: number;
  readonly temp1: number;
}

export interface BJRunSummary {
  readonly actor: number;
  readonly moved: boolean;
  readonly jumped: boolean;
  readonly temp1: number;
  readonly distance: number;
  readonly state: string | null;
}

export interface BJJumpSummary {
  readonly actor: number;
  readonly move: number;
  readonly distance: number;
  readonly x: number;
  readonly y: number;
}

export interface BJDoneSummary {
  readonly playstate: number;
}

export interface ActorSoundSummary {
  readonly sound: number;
  readonly positioned: boolean;
  readonly actor: number | null;
}

export interface ProjectileStepSummary {
  readonly actor: number;
  readonly moved: boolean;
  readonly blocked: boolean;
  readonly hitPlayer: boolean;
  readonly damage: number;
  readonly state: string | null;
  readonly tilex: number;
  readonly tiley: number;
}

export interface ProjectileSpawnSummary {
  readonly actor: number;
  readonly source: number;
  readonly state: string;
  readonly obclass: number;
  readonly angle: number;
  readonly speed: number;
  readonly flags: number;
  readonly ticcount: number;
}

export type DispatchedActionSummary =
  | { readonly action: "T_Shoot"; readonly shoot: ShootSummary }
  | { readonly action: "T_Bite"; readonly bite: BiteSummary }
  | { readonly action: "T_Projectile"; readonly projectile: ProjectileStepSummary }
  | { readonly action: "A_DeathScream"; readonly sound: ActorSoundSummary }
  | { readonly action: "A_HitlerMorph"; readonly morph: HitlerMorphSummary }
  | { readonly action: "T_BJYell"; readonly sound: ActorSoundSummary };

export type DispatchedThinkSummary =
  | { readonly think: "T_Player"; readonly player: PlayerTickSummary }
  | { readonly think: "T_Attack"; readonly attack: AttackTickSummary };

export interface ActorStepSummary {
  readonly actor: number;
  readonly active: boolean;
  readonly state: string | null;
  readonly ticcount: number;
  readonly thinkCalls: number;
  readonly removed: boolean;
  readonly thinkResults?: readonly DispatchedThinkSummary[];
  readonly actions?: readonly DispatchedActionSummary[];
}

export function copyWallDataToLevelMemory(
  plane0: Uint16Array,
  dgroup: DOSMemory,
): WallPlaneCopySummary {
  requireMapPlane(plane0);
  const tilemap = nearOffsetForSymbol("_tilemap");
  const actorat = nearOffsetForSymbol("_actorat");
  let walls = 0;
  let floors = 0;

  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const tile = plane0[y * MAPSIZE + x];
      const tileOffset = tilemapCellOffset(tilemap, x, y);
      const actorOffset = actoratCellOffset(actorat, x, y);

      if (tile < AREATILE) {
        dgroup.setU8(tileOffset, tile);
        dgroup.setU16(actorOffset, tile);
        walls++;
      } else {
        dgroup.setU8(tileOffset, 0);
        dgroup.setU16(actorOffset, 0);
        floors++;
      }
    }
  }

  return { walls, floors };
}

export function clearAmbushMarkers(plane0: Uint16Array, dgroup: DOSMemory): AmbushCleanupSummary {
  requireMapPlane(plane0);
  const tilemap = nearOffsetForSymbol("_tilemap");
  const actorat = nearOffsetForSymbol("_actorat");
  let ambushMarkers = 0;

  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const index = y * MAPSIZE + x;
      let tile = plane0[index];
      if (tile !== AMBUSHTILE) {
        continue;
      }

      ambushMarkers++;
      dgroup.setU8(tilemapCellOffset(tilemap, x, y), 0);
      const actorOffset = actoratCellOffset(actorat, x, y);
      if (dgroup.u16(actorOffset) === AMBUSHTILE) {
        dgroup.setU16(actorOffset, 0);
      }

      if (plane0[index + 1] >= AREATILE) {
        tile = plane0[index + 1];
      }
      if (plane0[index - MAPSIZE] >= AREATILE) {
        tile = plane0[index - MAPSIZE];
      }
      if (plane0[index + MAPSIZE] >= AREATILE) {
        tile = plane0[index + MAPSIZE];
      }
      if (plane0[index - 1] >= AREATILE) {
        tile = plane0[index - 1];
      }
      plane0[index] = tile;
    }
  }

  return { ambushMarkers };
}

export function InitActorListMemory(dgroup: DOSMemory): ActorListSummary {
  const objlist = nearOffsetForRuntimeSymbol("_objlist");

  for (let i = 0; i < MAXACTORS; i++) {
    const actor = objlist + i * OBJTYPE_BYTES;
    dgroup.setU16(actor + OBJ_PREV_OFFSET, objlist + (i + 1) * OBJTYPE_BYTES);
    dgroup.setU16(actor + OBJ_NEXT_OFFSET, 0);
  }

  dgroup.setU16(objlist + (MAXACTORS - 1) * OBJTYPE_BYTES + OBJ_PREV_OFFSET, 0);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_objfreelist"), objlist);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_lastobj"), 0);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_objcount"), 0);

  const player = GetNewActorMemory(dgroup);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_player"), player);

  return {
    player,
    objfreelist: dgroup.u16(nearOffsetForRuntimeSymbol("_objfreelist")),
    lastobj: dgroup.u16(nearOffsetForRuntimeSymbol("_lastobj")),
    objcount: dgroup.u16(nearOffsetForRuntimeSymbol("_objcount")),
  };
}

export function GetNewActorMemory(dgroup: DOSMemory): number {
  const objfreelistPointer = nearOffsetForRuntimeSymbol("_objfreelist");
  const newPointer = nearOffsetForRuntimeSymbol("_new");
  const lastobjPointer = nearOffsetForRuntimeSymbol("_lastobj");
  const objcount = nearOffsetForRuntimeSymbol("_objcount");
  const actor = dgroup.u16(objfreelistPointer);
  if (actor === 0) {
    throw new Error("GetNewActor: No free spots in objlist!");
  }

  dgroup.setU16(newPointer, actor);
  dgroup.setU16(objfreelistPointer, dgroup.u16(actor + OBJ_PREV_OFFSET));
  dgroup.view(actor, OBJTYPE_BYTES).fill(0);

  const lastobj = dgroup.u16(lastobjPointer);
  if (lastobj !== 0) {
    dgroup.setU16(lastobj + OBJ_NEXT_OFFSET, actor);
  }
  dgroup.setU16(actor + OBJ_PREV_OFFSET, lastobj);
  dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, 0);
  dgroup.setU16(lastobjPointer, actor);
  dgroup.setU16(objcount, dgroup.u16(objcount) + 1);
  return actor;
}

export function RemoveObjMemory(dgroup: DOSMemory, actor: number): RemoveObjSummary {
  if (actor === dgroup.u16(nearOffsetForRuntimeSymbol("_player"))) {
    throw new Error("RemoveObj: Tried to remove the player!");
  }

  const objfreelist = nearOffsetForRuntimeSymbol("_objfreelist");
  const lastobj = nearOffsetForRuntimeSymbol("_lastobj");
  const objcount = nearOffsetForRuntimeSymbol("_objcount");
  const prev = dgroup.u16(actor + OBJ_PREV_OFFSET);
  const next = dgroup.u16(actor + OBJ_NEXT_OFFSET);

  dgroup.setU16(actor + OBJ_STATE_OFFSET, 0);

  if (actor === dgroup.u16(lastobj)) {
    dgroup.setU16(lastobj, prev);
  } else {
    dgroup.setU16(next + OBJ_PREV_OFFSET, prev);
  }

  dgroup.setU16(prev + OBJ_NEXT_OFFSET, next);
  dgroup.setU16(actor + OBJ_PREV_OFFSET, dgroup.u16(objfreelist));
  dgroup.setU16(objfreelist, actor);
  dgroup.setU16(objcount, dgroup.u16(objcount) - 1);

  return {
    actor,
    prev,
    next,
    objfreelist: dgroup.u16(objfreelist),
    lastobj: dgroup.u16(lastobj),
    objcount: dgroup.u16(objcount),
  };
}

export function SpawnNewObjMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  state: string,
): SpawnNewObjSummary {
  requireMapPlane(plane0);
  requireMapCell(tilex, tiley);
  const actor = GetNewActorMemory(dgroup);
  const tictime = initialStateTicTime(state);
  const ticcount = tictime ? US_RndT() % tictime : 0;

  dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset(state));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, ticcount);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, tilex);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, tiley);
  dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
  dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
  dgroup.setU16(actoratCellOffset(nearOffsetForRuntimeSymbol("_actorat"), tilex, tiley), actor);
  dgroup.setU8(actor + OBJ_AREANUMBER_OFFSET, plane0[tiley * MAPSIZE + tilex] - AREATILE);

  return { actor, state, tilex, tiley, ticcount };
}

export function NewStateMemory(dgroup: DOSMemory, actor: number, state: string): void {
  dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset(state));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, initialStateTicTime(state));
}

export function CheckLineMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): boolean {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const tilemap = nearOffsetForRuntimeSymbol("_tilemap");
  const doorposition = nearOffsetForRuntimeSymbol("_doorposition");
  const x1 = dgroup.u32(actor + OBJ_X_OFFSET) >>> UNSIGNEDSHIFT;
  const y1 = dgroup.u32(actor + OBJ_Y_OFFSET) >>> UNSIGNEDSHIFT;
  const xt1 = x1 >>> 8;
  const yt1 = y1 >>> 8;
  const x2 = options.plux ?? dgroup.u16(nearOffsetForRuntimeSymbol("_plux"));
  const y2 = options.pluy ?? dgroup.u16(nearOffsetForRuntimeSymbol("_pluy"));
  let xt2 = dgroup.u16(player + OBJ_TILEX_OFFSET);
  let yt2 = dgroup.u16(player + OBJ_TILEY_OFFSET);

  const xdist = Math.abs(xt2 - xt1);
  if (xdist > 0) {
    let partial: number;
    let xstep: number;
    if (xt2 > xt1) {
      partial = 256 - (x1 & 0xff);
      xstep = 1;
    } else {
      partial = x1 & 0xff;
      xstep = -1;
    }

    const deltafrac = Math.abs(x2 - x1);
    const delta = y2 - y1;
    const ltemp = cdiv(delta << 8, deltafrac);
    let ystep = ltemp;
    if (ltemp > 0x7fff) {
      ystep = 0x7fff;
    } else if (ltemp < -0x7fff) {
      ystep = -0x7fff;
    }

    let yfrac = i16(y1 + ((i32(ystep * partial)) >> 8));
    let x = xt1 + xstep;
    xt2 += xstep;
    do {
      const y = yfrac >> 8;
      yfrac = i16(yfrac + ystep);
      requireMapCell(x, y);
      let value = dgroup.u8(tilemapCellOffset(tilemap, x, y));
      x += xstep;
      if (!value) {
        continue;
      }
      if (value < 128 || value > 256) {
        return false;
      }

      value &= ~0x80;
      const intercept = i16(yfrac - cdiv(ystep, 2)) & 0xffff;
      if (intercept > dgroup.u16(doorposition + value * 2)) {
        return false;
      }
    } while (x !== xt2);
  }

  const ydist = Math.abs(yt2 - yt1);
  if (ydist > 0) {
    let partial: number;
    let ystep: number;
    if (yt2 > yt1) {
      partial = 256 - (y1 & 0xff);
      ystep = 1;
    } else {
      partial = y1 & 0xff;
      ystep = -1;
    }

    const deltafrac = Math.abs(y2 - y1);
    const delta = x2 - x1;
    const ltemp = cdiv(delta << 8, deltafrac);
    let xstep = ltemp;
    if (ltemp > 0x7fff) {
      xstep = 0x7fff;
    } else if (ltemp < -0x7fff) {
      xstep = -0x7fff;
    }

    let xfrac = i16(x1 + ((i32(xstep * partial)) >> 8));
    let y = yt1 + ystep;
    yt2 += ystep;
    do {
      const x = xfrac >> 8;
      xfrac = i16(xfrac + xstep);
      requireMapCell(x, y);
      let value = dgroup.u8(tilemapCellOffset(tilemap, x, y));
      y += ystep;
      if (!value) {
        continue;
      }
      if (value < 128 || value > 256) {
        return false;
      }

      value &= ~0x80;
      const intercept = i16(xfrac - cdiv(xstep, 2)) & 0xffff;
      if (intercept > dgroup.u16(doorposition + value * 2)) {
        return false;
      }
    } while (y !== yt2);
  }

  return true;
}

export function CheckSightMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): boolean {
  if (!areaVisibleToPlayer(dgroup, dgroup.u8(actor + OBJ_AREANUMBER_OFFSET))) {
    return false;
  }

  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const deltax = dgroup.i32(player + OBJ_X_OFFSET) - dgroup.i32(actor + OBJ_X_OFFSET);
  const deltay = dgroup.i32(player + OBJ_Y_OFFSET) - dgroup.i32(actor + OBJ_Y_OFFSET);
  if (deltax > -MINSIGHT && deltax < MINSIGHT && deltay > -MINSIGHT && deltay < MINSIGHT) {
    return true;
  }

  switch (dgroup.u16(actor + OBJ_DIR_OFFSET)) {
    case DIR_NORTH:
      if (deltay > 0) {
        return false;
      }
      break;
    case EAST:
      if (deltax < 0) {
        return false;
      }
      break;
    case SOUTH:
      if (deltay < 0) {
        return false;
      }
      break;
    case WEST:
      if (deltax > 0) {
        return false;
      }
      break;
  }

  return CheckLineMemory(dgroup, actor, options);
}

export function FirstSightingMemory(dgroup: DOSMemory, actor: number): void {
  // Alert shout on first sighting (WL_STATE.C FirstSighting) — these never consume RNG, so the
  // bit-exact demos are unaffected. Mutants/ghosts are silent in the original.
  const sightSound: Record<number, number> = {
    [GUARDOBJ]: HALTSND,
    [OFFICEROBJ]: SPIONSND,
    [SSOBJ]: SCHUTZADSND,
    [DOGOBJ]: DOGBARKSND,
    [BOSSOBJ]: GUTENTAGSND,
    [GRETELOBJ]: KEINSND,
    [GIFTOBJ]: EINESND,
    [FATOBJ]: ERLAUBENSND,
    [SCHABBOBJ]: SCHABBSHASND,
    [FAKEOBJ]: TOT_HUNDSND,
    [MECHAHITLEROBJ]: DIESND,
    [REALHITLEROBJ]: DIESND,
  };
  const alert = sightSound[dgroup.u16(actor + OBJ_CLASS_OFFSET)];
  if (alert) {
    SD_PlaySound(alert);
  }
  switch (dgroup.u16(actor + OBJ_CLASS_OFFSET)) {
    case GUARDOBJ:
      NewStateMemory(dgroup, actor, "_s_grdchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case OFFICEROBJ:
      NewStateMemory(dgroup, actor, "_s_ofcchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 5);
      break;
    case MUTANTOBJ:
      NewStateMemory(dgroup, actor, "_s_mutchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case SSOBJ:
      NewStateMemory(dgroup, actor, "_s_sschase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 4);
      break;
    case DOGOBJ:
      NewStateMemory(dgroup, actor, "_s_dogchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 2);
      break;
    case BOSSOBJ:
      NewStateMemory(dgroup, actor, "_s_bosschase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, SPDPATROL * 3);
      break;
    case GRETELOBJ:
      NewStateMemory(dgroup, actor, "_s_gretelchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case GIFTOBJ:
      NewStateMemory(dgroup, actor, "_s_giftchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case FATOBJ:
      NewStateMemory(dgroup, actor, "_s_fatchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case SCHABBOBJ:
      NewStateMemory(dgroup, actor, "_s_schabbchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case FAKEOBJ:
      NewStateMemory(dgroup, actor, "_s_fakechase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case MECHAHITLEROBJ:
      NewStateMemory(dgroup, actor, "_s_mechachase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 3);
      break;
    case REALHITLEROBJ:
      NewStateMemory(dgroup, actor, "_s_hitlerchase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 5);
      break;
    case GHOSTOBJ:
      NewStateMemory(dgroup, actor, "_s_blinkychase1");
      dgroup.setU32(actor + OBJ_SPEED_OFFSET, dgroup.u32(actor + OBJ_SPEED_OFFSET) * 2);
      break;
  }

  if (dgroup.i32(actor + OBJ_DISTANCE_OFFSET) < 0) {
    dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, 0);
  }
  orObjFlags(dgroup, actor, FL_ATTACKMODE | FL_FIRSTATTACK);
}

export function SightPlayerMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): boolean {
  if (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & FL_ATTACKMODE) {
    throw new Error("An actor in ATTACKMODE called SightPlayer!");
  }

  const tics = options.tics ?? 1;
  let reaction = dgroup.i16(actor + OBJ_TEMP2_OFFSET);
  if (reaction) {
    reaction -= tics;
    dgroup.setU16(actor + OBJ_TEMP2_OFFSET, reaction);
    if (reaction > 0) {
      return false;
    }
    dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 0);
  } else {
    if (!areaVisibleToPlayer(dgroup, dgroup.u8(actor + OBJ_AREANUMBER_OFFSET))) {
      return false;
    }

    const madenoise = options.madenoise ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_madenoise")) !== 0);
    if (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & FL_AMBUSH) {
      if (!CheckSightMemory(dgroup, actor, options)) {
        return false;
      }
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_AMBUSH);
    } else if (!madenoise && !CheckSightMemory(dgroup, actor, options)) {
      return false;
    }

    switch (dgroup.u16(actor + OBJ_CLASS_OFFSET)) {
      case GUARDOBJ:
        dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 1 + Math.trunc(US_RndT() / 4));
        break;
      case OFFICEROBJ:
        dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 2);
        break;
      case MUTANTOBJ:
      case SSOBJ:
        dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 1 + Math.trunc(US_RndT() / 6));
        break;
      case DOGOBJ:
        dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 1 + Math.trunc(US_RndT() / 8));
        break;
      case BOSSOBJ:
      case SCHABBOBJ:
      case FAKEOBJ:
      case MECHAHITLEROBJ:
      case REALHITLEROBJ:
      case GRETELOBJ:
      case GIFTOBJ:
      case FATOBJ:
      case SPECTREOBJ:
        dgroup.setU16(actor + OBJ_TEMP2_OFFSET, 1);
        break;
    }
    return false;
  }

  FirstSightingMemory(dgroup, actor);
  return true;
}

export function T_StandMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): boolean {
  return SightPlayerMemory(dgroup, actor, options);
}

export function SelectDodgeDirMemory(dgroup: DOSMemory, plane0: Uint16Array, actor: number): void {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  let turnaround: number;
  if (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & FL_FIRSTATTACK) {
    turnaround = NODIR;
    dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_FIRSTATTACK);
  } else {
    turnaround = OPPOSITE_DIR[dgroup.u16(actor + OBJ_DIR_OFFSET)] ?? NODIR;
  }

  const deltax = dgroup.u16(player + OBJ_TILEX_OFFSET) - dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const deltay = dgroup.u16(player + OBJ_TILEY_OFFSET) - dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const dirtry = [NODIR, NODIR, NODIR, NODIR, NODIR];

  if (deltax > 0) {
    dirtry[1] = EAST;
    dirtry[3] = WEST;
  } else {
    dirtry[1] = WEST;
    dirtry[3] = EAST;
  }

  if (deltay > 0) {
    dirtry[2] = SOUTH;
    dirtry[4] = DIR_NORTH;
  } else {
    dirtry[2] = DIR_NORTH;
    dirtry[4] = SOUTH;
  }

  if (Math.abs(deltax) > Math.abs(deltay)) {
    [dirtry[1], dirtry[2]] = [dirtry[2], dirtry[1]];
    [dirtry[3], dirtry[4]] = [dirtry[4], dirtry[3]];
  }

  if (US_RndT() < 128) {
    [dirtry[1], dirtry[2]] = [dirtry[2], dirtry[1]];
    [dirtry[3], dirtry[4]] = [dirtry[4], dirtry[3]];
  }

  dirtry[0] = DIAGONAL_DIR[dirtry[1]]?.[dirtry[2]] ?? NODIR;
  for (const dir of dirtry) {
    if (dir === NODIR || dir === turnaround) {
      continue;
    }
    dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  if (turnaround !== NODIR) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, turnaround);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
}

export function SelectChaseDirMemory(dgroup: DOSMemory, plane0: Uint16Array, actor: number): void {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const olddir = dgroup.u16(actor + OBJ_DIR_OFFSET);
  const turnaround = OPPOSITE_DIR[olddir] ?? NODIR;
  const deltax = dgroup.u16(player + OBJ_TILEX_OFFSET) - dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const deltay = dgroup.u16(player + OBJ_TILEY_OFFSET) - dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const dirs = [NODIR, NODIR, NODIR];

  if (deltax > 0) {
    dirs[1] = EAST;
  } else if (deltax < 0) {
    dirs[1] = WEST;
  }
  if (deltay > 0) {
    dirs[2] = SOUTH;
  } else if (deltay < 0) {
    dirs[2] = DIR_NORTH;
  }

  if (Math.abs(deltay) > Math.abs(deltax)) {
    [dirs[1], dirs[2]] = [dirs[2], dirs[1]];
  }

  if (dirs[1] === turnaround) {
    dirs[1] = NODIR;
  }
  if (dirs[2] === turnaround) {
    dirs[2] = NODIR;
  }

  for (const dir of [dirs[1], dirs[2]]) {
    if (dir === NODIR) {
      continue;
    }
    dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  if (olddir !== NODIR) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, olddir);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  if (US_RndT() > 128) {
    for (let dir = DIR_NORTH; dir <= WEST; dir++) {
      if (dir === turnaround) {
        continue;
      }
      dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
      if (TryWalkMemory(dgroup, plane0, actor).moved) {
        return;
      }
    }
  } else {
    for (let dir = WEST; dir >= DIR_NORTH; dir--) {
      if (dir === turnaround) {
        continue;
      }
      dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
      if (TryWalkMemory(dgroup, plane0, actor).moved) {
        return;
      }
    }
  }

  if (turnaround !== NODIR) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, turnaround);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
}

export function SelectRunDirMemory(dgroup: DOSMemory, plane0: Uint16Array, actor: number): void {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const deltax = dgroup.u16(player + OBJ_TILEX_OFFSET) - dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const deltay = dgroup.u16(player + OBJ_TILEY_OFFSET) - dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const dirs = [NODIR, deltax < 0 ? EAST : WEST, deltay < 0 ? SOUTH : DIR_NORTH];

  if (Math.abs(deltay) > Math.abs(deltax)) {
    [dirs[1], dirs[2]] = [dirs[2], dirs[1]];
  }

  for (const dir of [dirs[1], dirs[2]]) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
    if (TryWalkMemory(dgroup, plane0, actor).moved) {
      return;
    }
  }

  if (US_RndT() > 128) {
    for (let dir = DIR_NORTH; dir <= WEST; dir++) {
      dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
      if (TryWalkMemory(dgroup, plane0, actor).moved) {
        return;
      }
    }
  } else {
    for (let dir = WEST; dir >= DIR_NORTH; dir--) {
      dgroup.setU16(actor + OBJ_DIR_OFFSET, dir);
      if (TryWalkMemory(dgroup, plane0, actor).moved) {
        return;
      }
    }
  }

  dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
}

export function T_ChaseMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  const tics = options.tics ?? 1;
  if (dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return chaseSummary(dgroup, actor, false, false, false, null);
  }

  let dodge = false;
  if (CheckLineMemory(dgroup, actor, options)) {
    const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    const dx = Math.abs(dgroup.u16(actor + OBJ_TILEX_OFFSET) - dgroup.u16(player + OBJ_TILEX_OFFSET));
    const dy = Math.abs(dgroup.u16(actor + OBJ_TILEY_OFFSET) - dgroup.u16(player + OBJ_TILEY_OFFSET));
    const dist = dx > dy ? dx : dy;
    const chance =
      !dist || (dist === 1 && dgroup.i32(actor + OBJ_DISTANCE_OFFSET) < 0x4000)
        ? 300
        : cdiv(tics << 4, dist);
    if (US_RndT() < chance) {
      const attackState = attackStateForClass(dgroup.u16(actor + OBJ_CLASS_OFFSET));
      if (attackState) {
        NewStateMemory(dgroup, actor, attackState);
      }
      return chaseSummary(dgroup, actor, false, true, false, null);
    }
    dodge = true;
  }

  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    if (dodge) {
      SelectDodgeDirMemory(dgroup, plane0, actor);
    } else {
      SelectChaseDirMemory(dgroup, plane0, actor);
    }
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, false, false, true, null);
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics;
  while (move) {
    let distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (distance < 0) {
      const door = -distance - 1;
      OpenDoorMemory(dgroup, door);
      const doorobj = nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
      if (dgroup.u16(doorobj + DOOR_ACTION_OFFSET) !== DR_OPEN) {
        return chaseSummary(dgroup, actor, moved, false, false, door);
      }
      distance = TILEGLOBAL;
      dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, distance);
    }

    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    if (dodge) {
      SelectDodgeDirMemory(dgroup, plane0, actor);
    } else {
      SelectChaseDirMemory(dgroup, plane0, actor);
    }

    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, moved, false, true, null);
    }
  }

  return chaseSummary(dgroup, actor, moved, false, false, null);
}

export function T_SchabbMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  return T_BossProjectileChaseMemory(dgroup, plane0, actor, "_s_schabbshoot1", options);
}

export function T_GiftMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  return T_BossProjectileChaseMemory(dgroup, plane0, actor, "_s_giftshoot1", options);
}

export function T_FatMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  return T_BossProjectileChaseMemory(dgroup, plane0, actor, "_s_fatshoot1", options);
}

function T_BossProjectileChaseMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  attackState: string,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  const tics = options.tics ?? 1;
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const dx = Math.abs(dgroup.u16(actor + OBJ_TILEX_OFFSET) - dgroup.u16(player + OBJ_TILEX_OFFSET));
  const dy = Math.abs(dgroup.u16(actor + OBJ_TILEY_OFFSET) - dgroup.u16(player + OBJ_TILEY_OFFSET));
  const dist = dx > dy ? dx : dy;
  let dodge = false;

  if (CheckLineMemory(dgroup, actor, options)) {
    if (US_RndT() < (tics << 3)) {
      NewStateMemory(dgroup, actor, attackState);
      return chaseSummary(dgroup, actor, false, true, false, null);
    }
    dodge = true;
  }

  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    if (dodge) {
      SelectDodgeDirMemory(dgroup, plane0, actor);
    } else {
      SelectChaseDirMemory(dgroup, plane0, actor);
    }
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, false, false, true, null);
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics;
  while (move) {
    let distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (distance < 0) {
      const door = -distance - 1;
      OpenDoorMemory(dgroup, door);
      const doorobj = nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
      if (dgroup.u16(doorobj + DOOR_ACTION_OFFSET) !== DR_OPEN) {
        return chaseSummary(dgroup, actor, moved, false, false, door);
      }
      distance = TILEGLOBAL;
      dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, distance);
    }

    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    if (dist < 4) {
      SelectRunDirMemory(dgroup, plane0, actor);
    } else if (dodge) {
      SelectDodgeDirMemory(dgroup, plane0, actor);
    } else {
      SelectChaseDirMemory(dgroup, plane0, actor);
    }

    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, moved, false, true, null);
    }
  }

  return chaseSummary(dgroup, actor, moved, false, false, null);
}

export function T_FakeMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  const tics = options.tics ?? 1;
  if (CheckLineMemory(dgroup, actor, options) && US_RndT() < (tics << 1)) {
    NewStateMemory(dgroup, actor, "_s_fakeshoot1");
    return chaseSummary(dgroup, actor, false, true, false, null);
  }

  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    SelectDodgeDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, false, false, true, null);
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics;
  while (move) {
    const distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    SelectDodgeDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, moved, false, true, null);
    }
  }

  return chaseSummary(dgroup, actor, moved, false, false, null);
}

export function T_GhostsMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  const tics = options.tics ?? 1;
  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    SelectChaseDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, false, false, true, null);
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics;
  while (move) {
    const distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    SelectChaseDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, moved, false, true, null);
    }
  }

  return chaseSummary(dgroup, actor, moved, false, false, null);
}

export function T_DogChaseMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): ChaseStepSummary {
  const tics = options.tics ?? 1;
  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    SelectDodgeDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, false, false, true, null);
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics;
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  while (move) {
    let dx = Math.abs(dgroup.i32(player + OBJ_X_OFFSET) - dgroup.i32(actor + OBJ_X_OFFSET));
    dx -= move;
    if (dx <= MINACTORDIST) {
      let dy = Math.abs(dgroup.i32(player + OBJ_Y_OFFSET) - dgroup.i32(actor + OBJ_Y_OFFSET));
      dy -= move;
      if (dy <= MINACTORDIST) {
        NewStateMemory(dgroup, actor, "_s_dogjump1");
        return chaseSummary(dgroup, actor, moved, true, false, null);
      }
    }

    const distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    SelectDodgeDirMemory(dgroup, plane0, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return chaseSummary(dgroup, actor, moved, false, true, null);
    }
  }

  return chaseSummary(dgroup, actor, moved, false, false, null);
}

export function UpdateFaceMemory(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): FaceUpdateSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const facecount = nearOffsetForRuntimeSymbol("_facecount");
  const gatlingSoundPlaying = options.gatlingSoundPlaying ?? (SD_SoundPlaying() === GETGATLINGSND);
  if (gatlingSoundPlaying) {
    return faceUpdateSummary(dgroup, false, true);
  }

  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  dgroup.setU16(facecount, i16(dgroup.i16(facecount) + tics));
  if (dgroup.i16(facecount) > US_RndT()) {
    let frame = US_RndT() >> 6;
    if (frame === 3) {
      frame = 1;
    }
    dgroup.setU16(gamestate + GAMESTATE_FACEFRAME_OFFSET, frame);
    dgroup.setU16(facecount, 0);
    return faceUpdateSummary(dgroup, true, false);
  }

  return faceUpdateSummary(dgroup, false, false);
}

export function TakeDamageMemory(dgroup: DOSMemory, attacker: number, points: number): DamageSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const damagecount = nearOffsetForRuntimeSymbol("_damagecount");
  const playstate = nearOffsetForRuntimeSymbol("_playstate");
  const killerobj = nearOffsetForRuntimeSymbol("_killerobj");

  dgroup.setU16(nearOffsetForRuntimeSymbol("_LastAttacker"), attacker);
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return {
      attacker,
      points,
      health: dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET),
      died: false,
      damagecount: dgroup.u16(damagecount),
    };
  }

  let adjustedPoints = points;
  if (dgroup.u16(gamestate + GAMESTATE_DIFFICULTY_OFFSET) === GD_BABY) {
    adjustedPoints >>= 2;
  }

  let health = dgroup.i16(gamestate + GAMESTATE_HEALTH_OFFSET);
  let died = false;
  if (!dgroup.u16(nearOffsetForRuntimeSymbol("_godmode"))) {
    health = i16(health - adjustedPoints);
  }

  if (health <= 0) {
    health = 0;
    died = true;
    dgroup.setU16(playstate, EX_DIED);
    dgroup.setU16(killerobj, attacker);
  }

  if (!dgroup.u16(nearOffsetForRuntimeSymbol("_godmode")) || died) {
    dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, health);
  }

  StartDamageFlashMemory(dgroup, adjustedPoints);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_gotgatgun"), 0);
  return {
    attacker,
    points: adjustedPoints,
    health: dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET),
    died,
    damagecount: dgroup.u16(damagecount),
  };
}

export function ClearPaletteShiftsMemory(dgroup: DOSMemory): PaletteShiftSummary {
  dgroup.setU16(nearOffsetForRuntimeSymbol("_bonuscount"), 0);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_damagecount"), 0);
  return paletteShiftSummary(dgroup, 0, 0, "none");
}

export function StartBonusFlashMemory(dgroup: DOSMemory): PaletteShiftSummary {
  dgroup.setU16(nearOffsetForRuntimeSymbol("_bonuscount"), NUMWHITESHIFTS * WHITETICS);
  return paletteShiftSummary(dgroup, 0, 0, "none");
}

export function StartDamageFlashMemory(dgroup: DOSMemory, damage: number): PaletteShiftSummary {
  const damagecount = nearOffsetForRuntimeSymbol("_damagecount");
  dgroup.setU16(damagecount, i16(dgroup.i16(damagecount) + damage));
  return paletteShiftSummary(dgroup, 0, 0, "none");
}

export function UpdatePaletteShiftsMemory(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): PaletteShiftSummary {
  const bonuscount = nearOffsetForRuntimeSymbol("_bonuscount");
  const damagecount = nearOffsetForRuntimeSymbol("_damagecount");
  const palshifted = nearOffsetForRuntimeSymbol("_palshifted");
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  let white = 0;
  let red = 0;

  if (dgroup.i16(bonuscount)) {
    white = cdiv(dgroup.i16(bonuscount), WHITETICS) + 1;
    if (white > NUMWHITESHIFTS) {
      white = NUMWHITESHIFTS;
    }
    let bonus = i16(dgroup.i16(bonuscount) - tics);
    if (bonus < 0) {
      bonus = 0;
    }
    dgroup.setU16(bonuscount, bonus);
  }

  if (dgroup.i16(damagecount)) {
    red = cdiv(dgroup.i16(damagecount), 10) + 1;
    if (red > NUMREDSHIFTS) {
      red = NUMREDSHIFTS;
    }
    let damage = i16(dgroup.i16(damagecount) - tics);
    if (damage < 0) {
      damage = 0;
    }
    dgroup.setU16(damagecount, damage);
  }

  if (red) {
    dgroup.setU16(palshifted, 1);
    return paletteShiftSummary(dgroup, red, white, "red");
  }
  if (white) {
    dgroup.setU16(palshifted, 1);
    return paletteShiftSummary(dgroup, red, white, "white");
  }
  if (dgroup.u16(palshifted)) {
    dgroup.setU16(palshifted, 0);
    return paletteShiftSummary(dgroup, red, white, "normal");
  }
  return paletteShiftSummary(dgroup, red, white, "none");
}

export function FinishPaletteShiftsMemory(dgroup: DOSMemory): PaletteShiftSummary {
  if (dgroup.u16(nearOffsetForRuntimeSymbol("_palshifted"))) {
    dgroup.setU16(nearOffsetForRuntimeSymbol("_palshifted"), 0);
    return paletteShiftSummary(dgroup, 0, 0, "normal");
  }
  return paletteShiftSummary(dgroup, 0, 0, "none");
}

export function T_ShootMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): ShootSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const healthOffset = gamestate + GAMESTATE_HEALTH_OFFSET;
  const areaVisible = areaVisibleToPlayer(dgroup, dgroup.u8(actor + OBJ_AREANUMBER_OFFSET));
  const visible = (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & FL_VISABLE) !== 0;
  const thrustspeed = dgroup.i32(nearOffsetForRuntimeSymbol("_thrustspeed"));
  let hitchance = 128;
  let dist = 0;

  if (!areaVisible) {
    return {
      actor,
      areaVisible,
      lineClear: false,
      visible,
      hit: false,
      damage: 0,
      hitchance,
      hitRoll: null,
      damageRoll: null,
      dist,
      thrustspeed,
      health: dgroup.u16(healthOffset),
    };
  }

  const lineClear = CheckLineMemory(dgroup, actor, options);
  if (!lineClear) {
    return {
      actor,
      areaVisible,
      lineClear,
      visible,
      hit: false,
      damage: 0,
      hitchance,
      hitRoll: null,
      damageRoll: null,
      dist,
      thrustspeed,
      health: dgroup.u16(healthOffset),
    };
  }

  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const dx = Math.abs(dgroup.u16(actor + OBJ_TILEX_OFFSET) - dgroup.u16(player + OBJ_TILEX_OFFSET));
  const dy = Math.abs(dgroup.u16(actor + OBJ_TILEY_OFFSET) - dgroup.u16(player + OBJ_TILEY_OFFSET));
  dist = Math.max(dx, dy);

  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);
  if (obclass === SSOBJ || obclass === BOSSOBJ) {
    dist = cdiv(dist * 2, 3);
  }

  if (thrustspeed >= RUNSPEED) {
    hitchance = visible ? 160 - dist * 16 : 160 - dist * 8;
  } else {
    hitchance = visible ? 256 - dist * 16 : 256 - dist * 8;
  }

  let damage = 0;
  const hitRoll = US_RndT();
  let damageRoll: number | null = null;
  const hit = hitRoll < hitchance;
  if (hit) {
    damageRoll = US_RndT();
    if (dist < 2) {
      damage = damageRoll >> 2;
    } else if (dist < 4) {
      damage = damageRoll >> 3;
    } else {
      damage = damageRoll >> 4;
    }
    TakeDamageMemory(dgroup, actor, damage);
  }

  // Enemy fire sound (WL_ACT2.C T_Shoot) — does not consume RNG, so demos stay bit-exact.
  const fireSound =
    obclass === SSOBJ ? SSFIRESND
      : obclass === GIFTOBJ || obclass === FATOBJ ? MISSILEFIRESND
        : obclass === MECHAHITLEROBJ || obclass === REALHITLEROBJ || obclass === BOSSOBJ ? BOSSFIRESND
          : obclass === FAKEOBJ ? FLAMETHROWERSND
            : NAZIFIRESND;
  SD_PlaySound(fireSound);

  return {
    actor,
    areaVisible,
    lineClear,
    visible,
    hit,
    damage,
    hitchance,
    hitRoll,
    damageRoll,
    dist,
    thrustspeed,
    health: dgroup.u16(healthOffset),
  };
}

export function T_BiteMemory(dgroup: DOSMemory, actor: number): BiteSummary {
  SD_PlaySound(DOGATTACKSND); // the dog's snap (WL_ACT2.C T_Bite); no RNG, demos unaffected
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const healthOffset = gamestate + GAMESTATE_HEALTH_OFFSET;
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const dx = Math.abs(dgroup.i32(player + OBJ_X_OFFSET) - dgroup.i32(actor + OBJ_X_OFFSET)) - TILEGLOBAL;
  const dy = Math.abs(dgroup.i32(player + OBJ_Y_OFFSET) - dgroup.i32(actor + OBJ_Y_OFFSET)) - TILEGLOBAL;
  const close = dx <= MINACTORDIST && dy <= MINACTORDIST;
  let damage = 0;
  let hit = false;

  if (close && US_RndT() < 180) {
    hit = true;
    damage = US_RndT() >> 4;
    TakeDamageMemory(dgroup, actor, damage);
  }

  return {
    actor,
    close,
    hit,
    damage,
    health: dgroup.u16(healthOffset),
  };
}

export function GivePointsMemory(dgroup: DOSMemory, points: number): void {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU32(gamestate + GAMESTATE_SCORE_OFFSET, dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET) + points);
  while (dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET) >= dgroup.u32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET)) {
    dgroup.setU32(
      gamestate + GAMESTATE_NEXTEXTRA_OFFSET,
      dgroup.u32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET) + EXTRAPOINTS,
    );
    GiveExtraManMemory(dgroup);
  }
}

export function GiveExtraManMemory(dgroup: DOSMemory): number {
  SD_PlaySound(BONUS1UPSND); // 1-up chime (WL_AGENT.C GiveExtraMan)
  const livesOffset = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_LIVES_OFFSET;
  const lives = dgroup.u16(livesOffset);
  if (lives < 9) {
    dgroup.setU16(livesOffset, lives + 1);
  }
  return dgroup.u16(livesOffset);
}

export function GivePointsSummaryMemory(dgroup: DOSMemory, points: number): PointsSummary {
  GivePointsMemory(dgroup, points);
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  return {
    score: dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET),
    nextextra: dgroup.u32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET),
    lives: dgroup.u16(gamestate + GAMESTATE_LIVES_OFFSET),
  };
}

export function GiveAmmoMemory(dgroup: DOSMemory, ammo: number): AmmoSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const ammoOffset = gamestate + GAMESTATE_AMMO_OFFSET;

  if (!dgroup.u16(ammoOffset) && !dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET)) {
    dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, dgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET));
  }

  const nextAmmo = Math.min(99, dgroup.u16(ammoOffset) + ammo);
  dgroup.setU16(ammoOffset, nextAmmo);
  return {
    ammo: dgroup.u16(ammoOffset),
    weapon: dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET),
  };
}

export function GiveWeaponMemory(dgroup: DOSMemory, weapon: number): WeaponSummary {
  GiveAmmoMemory(dgroup, 6);
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  if (dgroup.u16(gamestate + GAMESTATE_BESTWEAPON_OFFSET) < weapon) {
    dgroup.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, weapon);
    dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, weapon);
    dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, weapon);
  }

  return {
    ammo: dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET),
    bestweapon: dgroup.u16(gamestate + GAMESTATE_BESTWEAPON_OFFSET),
    weapon: dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET),
    chosenweapon: dgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET),
  };
}

export function GiveKeyMemory(dgroup: DOSMemory, key: number): KeySummary {
  const keysOffset = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_KEYS_OFFSET;
  dgroup.setU16(keysOffset, dgroup.u16(keysOffset) | (1 << key));
  return { keys: dgroup.u16(keysOffset) };
}

export function HealSelfMemory(dgroup: DOSMemory, points: number): HealSummary {
  const healthOffset = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_HEALTH_OFFSET;
  dgroup.setU16(healthOffset, Math.min(100, dgroup.u16(healthOffset) + points));
  dgroup.setU16(nearOffsetForRuntimeSymbol("_gotgatgun"), 0);
  return {
    health: dgroup.u16(healthOffset),
    gotgatgun: dgroup.u16(nearOffsetForRuntimeSymbol("_gotgatgun")),
  };
}

export function GetBonusMemory(dgroup: DOSMemory, statobj: number): BonusSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const itemnumber = dgroup.u8(statobj + STAT_ITEMNUMBER_OFFSET);

  switch (itemnumber) {
    case bo_firstaid:
      if (dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET) === 100) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(HEALTH2SND); // pickup SFX (WL_AGENT.C GetBonus); no RNG, demos unaffected
      HealSelfMemory(dgroup, 25);
      break;

    case bo_key1:
    case bo_key2:
    case bo_key3:
    case bo_key4:
      SD_PlaySound(GETKEYSND);
      GiveKeyMemory(dgroup, itemnumber - bo_key1);
      break;

    case bo_cross:
      SD_PlaySound(BONUS1SND);
      GivePointsMemory(dgroup, 100);
      incrementGamestateWord(dgroup, GAMESTATE_TREASURECOUNT_OFFSET);
      break;
    case bo_chalice:
      SD_PlaySound(BONUS2SND); // WL_AGENT.C GetBonus bo_chalice -> BONUS2SND (each treasure differs)
      GivePointsMemory(dgroup, 500);
      incrementGamestateWord(dgroup, GAMESTATE_TREASURECOUNT_OFFSET);
      break;
    case bo_bible:
      SD_PlaySound(BONUS3SND); // WL_AGENT.C GetBonus bo_bible -> BONUS3SND
      GivePointsMemory(dgroup, 1000);
      incrementGamestateWord(dgroup, GAMESTATE_TREASURECOUNT_OFFSET);
      break;
    case bo_crown:
      SD_PlaySound(BONUS4SND); // WL_AGENT.C GetBonus bo_crown -> BONUS4SND
      GivePointsMemory(dgroup, 5000);
      incrementGamestateWord(dgroup, GAMESTATE_TREASURECOUNT_OFFSET);
      break;

    case bo_clip:
      if (dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) === 99) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(GETAMMOSND);
      GiveAmmoMemory(dgroup, 8);
      break;
    case bo_clip2:
      if (dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) === 99) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(GETAMMOSND);
      GiveAmmoMemory(dgroup, 4);
      break;
    case bo_25clip:
      if (dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) === 99) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(GETAMMOSND);
      GiveAmmoMemory(dgroup, 25);
      break;

    case bo_machinegun:
      SD_PlaySound(GETMACHINESND);
      GiveWeaponMemory(dgroup, WP_MACHINEGUN);
      break;
    case bo_chaingun:
      SD_PlaySound(GETGATLINGSND);
      GiveWeaponMemory(dgroup, WP_CHAINGUN);
      dgroup.setU16(nearOffsetForRuntimeSymbol("_facecount"), 0);
      dgroup.setU16(nearOffsetForRuntimeSymbol("_gotgatgun"), 1);
      break;

    case bo_fullheal:
      HealSelfMemory(dgroup, 99);
      GiveAmmoMemory(dgroup, 25);
      GiveExtraManMemory(dgroup);
      incrementGamestateWord(dgroup, GAMESTATE_TREASURECOUNT_OFFSET);
      break;

    case bo_food:
      if (dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET) === 100) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(HEALTH1SND);
      HealSelfMemory(dgroup, 10);
      break;
    case bo_alpo:
      if (dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET) === 100) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(HEALTH1SND);
      HealSelfMemory(dgroup, 4);
      break;
    case bo_gibs:
      if (dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET) > 10) {
        return bonusSummary(dgroup, statobj, itemnumber, false);
      }
      SD_PlaySound(SLURPIESND); // WL_AGENT.C GetBonus bo_gibs plays SLURPIESND (was silent); after the guard
      HealSelfMemory(dgroup, 1);
      break;

    case bo_spear:
      dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), EX_COMPLETED);
      break;
  }

  StartBonusFlashMemory(dgroup);
  dgroup.setU16(statobj + STAT_SHAPENUM_OFFSET, 0xffff);
  return bonusSummary(dgroup, statobj, itemnumber, true);
}

export function CheckWeaponChangeMemory(dgroup: DOSMemory): WeaponChangeSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  if (!dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET)) {
    return weaponChangeSummary(dgroup, false);
  }

  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  for (let weapon = WP_KNIFE; weapon <= dgroup.u16(gamestate + GAMESTATE_BESTWEAPON_OFFSET); weapon++) {
    if (dgroup.u16(buttonstate + (BT_READYKNIFE + weapon - WP_KNIFE) * 2)) {
      dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, weapon);
      dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, weapon);
      return weaponChangeSummary(dgroup, true);
    }
  }

  return weaponChangeSummary(dgroup, false);
}

export function CmdFireMemory(dgroup: DOSMemory): CmdFireSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const weapon = dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET);
  const attack = ATTACK_INFO[weapon]?.[0];
  if (!attack) {
    throw new RangeError(`Invalid gamestate.weapon ${weapon}`);
  }

  dgroup.setU16(nearOffsetForRuntimeSymbol("_buttonheld") + BT_ATTACK * 2, 1);
  dgroup.setU16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET, 0);
  dgroup.setU16(player + OBJ_STATE_OFFSET, statetypeNearOffset("_s_attack"));
  dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 0);
  dgroup.setU16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET, attack.tics);
  dgroup.setU16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET, attack.frame);

  return {
    player,
    state: stateNameForActor(dgroup, player),
    attackframe: dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET),
    attackcount: dgroup.u16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET),
    weaponframe: dgroup.u16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET),
    buttonHeldAttack: dgroup.u16(nearOffsetForRuntimeSymbol("_buttonheld") + BT_ATTACK * 2) !== 0,
  };
}

export function KnifeAttackMemory(dgroup: DOSMemory, actor: number): PlayerAttackSummary {
  SD_PlaySound(ATKKNIFESND); // WL_AGENT.C KnifeAttack: stab sound first, before the target scan (every swing)
  const closest = closestCenteredTarget(dgroup, actor);
  if (!closest || closest.dist > 0x18000) {
    return {
      actor,
      target: null,
      hit: false,
      damage: 0,
      dist: closest?.dist ?? 0x7fffffff,
      lineClear: null,
      madenoise: dgroup.u16(nearOffsetForRuntimeSymbol("_madenoise")) !== 0,
      damageResult: null,
    };
  }

  const damage = US_RndT() >> 4;
  const damageResult = DamageActorMemory(dgroup, closest.actor, damage);
  return {
    actor,
    target: closest.actor,
    hit: true,
    damage,
    dist: closest.dist,
    lineClear: null,
    madenoise: dgroup.u16(nearOffsetForRuntimeSymbol("_madenoise")) !== 0,
    damageResult,
  };
}

export function GunAttackMemory(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): PlayerAttackSummary {
  switch (dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_WEAPON_OFFSET)) {
    case WP_PISTOL:
      SD_PlaySound(ATKPISTOLSND);
      break;
    case WP_MACHINEGUN:
      SD_PlaySound(ATKMACHINEGUNSND);
      break;
    case WP_CHAINGUN:
      SD_PlaySound(ATKGATLINGSND);
      break;
  }

  dgroup.setU16(nearOffsetForRuntimeSymbol("_madenoise"), 1);

  const closest = closestCenteredTarget(dgroup, actor);
  if (!closest) {
    return {
      actor,
      target: null,
      hit: false,
      damage: 0,
      dist: 0x7fffffff,
      lineClear: null,
      madenoise: true,
      damageResult: null,
    };
  }

  const lineClear = CheckLineMemory(dgroup, closest.actor, options);
  if (!lineClear) {
    return {
      actor,
      target: closest.actor,
      hit: false,
      damage: 0,
      dist: closest.dist,
      lineClear,
      madenoise: true,
      damageResult: null,
    };
  }

  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const dx = Math.abs(
    dgroup.u16(closest.actor + OBJ_TILEX_OFFSET) - dgroup.u16(player + OBJ_TILEX_OFFSET),
  );
  const dy = Math.abs(
    dgroup.u16(closest.actor + OBJ_TILEY_OFFSET) - dgroup.u16(player + OBJ_TILEY_OFFSET),
  );
  const dist = Math.max(dx, dy);
  let damage = 0;

  if (dist < 2) {
    damage = cdiv(US_RndT(), 4);
  } else if (dist < 4) {
    damage = cdiv(US_RndT(), 6);
  } else {
    if (cdiv(US_RndT(), 12) < dist) {
      return {
        actor,
        target: closest.actor,
        hit: false,
        damage: 0,
        dist,
        lineClear,
        madenoise: true,
        damageResult: null,
      };
    }
    damage = cdiv(US_RndT(), 6);
  }

  const damageResult = DamageActorMemory(dgroup, closest.actor, damage);
  return {
    actor,
    target: closest.actor,
    hit: true,
    damage,
    dist,
    lineClear,
    madenoise: true,
    damageResult,
  };
}

export function T_AttackMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions = {},
): AttackTickSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = nearOffsetForRuntimeSymbol("_buttonheld");
  const tics = options.tics ?? 1;
  const attacks: PlayerAttackSummary[] = [];

  UpdateFaceMemory(dgroup, options);
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    const movement = VictorySpinMemory(dgroup, options);
    return attackTickSummary(dgroup, actor, false, attacks, movement);
  }

  if (dgroup.u16(buttonstate + BT_USE * 2) && !dgroup.u16(buttonheld + BT_USE * 2)) {
    dgroup.setU16(buttonstate + BT_USE * 2, 0);
  }
  if (dgroup.u16(buttonstate + BT_ATTACK * 2) && !dgroup.u16(buttonheld + BT_ATTACK * 2)) {
    dgroup.setU16(buttonstate + BT_ATTACK * 2, 0);
  }

  const movement = ControlMovementMemory(dgroup, plane0, plane1, actor);
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return attackTickSummary(dgroup, actor, false, attacks, movement);
  }

  dgroup.setU16(nearOffsetForRuntimeSymbol("_plux"), dgroup.u32(actor + OBJ_X_OFFSET) >>> UNSIGNEDSHIFT);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pluy"), dgroup.u32(actor + OBJ_Y_OFFSET) >>> UNSIGNEDSHIFT);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, dgroup.u32(actor + OBJ_X_OFFSET) >> TILESHIFT);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, dgroup.u32(actor + OBJ_Y_OFFSET) >> TILESHIFT);

  dgroup.setU16(
    gamestate + GAMESTATE_ATTACKCOUNT_OFFSET,
    dgroup.i16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET) - tics,
  );

  let guard = 0;
  while (dgroup.i16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET) <= 0) {
    if (++guard > 16) {
      throw new Error("T_AttackMemory exceeded attack frame guard");
    }

    const weapon = dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET);
    const frame = dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET);
    const cur = attackInfoFor(weapon, frame);

    switch (cur.attack) {
      case -1:
        dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset("_s_player"));
        if (!dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET)) {
          dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_KNIFE);
        } else if (
          dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET) !==
          dgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET)
        ) {
          dgroup.setU16(
            gamestate + GAMESTATE_WEAPON_OFFSET,
            dgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET),
          );
        }
        dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 0);
        dgroup.setU16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET, 0);
        return attackTickSummary(dgroup, actor, true, attacks, movement);

      case 4:
        if (!dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET)) {
          break;
        }
        if (dgroup.u16(buttonstate + BT_ATTACK * 2)) {
          dgroup.setU16(
            gamestate + GAMESTATE_ATTACKFRAME_OFFSET,
            dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) - 2,
          );
        }
        attacks.push(GunAttackMemory(dgroup, actor, options));
        dgroup.setU16(
          gamestate + GAMESTATE_AMMO_OFFSET,
          dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) - 1,
        );
        break;

      case 1:
        if (!dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET)) {
          dgroup.setU16(
            gamestate + GAMESTATE_ATTACKFRAME_OFFSET,
            dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) + 1,
          );
          break;
        }
        attacks.push(GunAttackMemory(dgroup, actor, options));
        dgroup.setU16(
          gamestate + GAMESTATE_AMMO_OFFSET,
          dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) - 1,
        );
        break;

      case 2:
        attacks.push(KnifeAttackMemory(dgroup, actor));
        break;

      case 3:
        if (dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) && dgroup.u16(buttonstate + BT_ATTACK * 2)) {
          dgroup.setU16(
            gamestate + GAMESTATE_ATTACKFRAME_OFFSET,
            dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) - 2,
          );
        }
        break;
    }

    dgroup.setU16(
      gamestate + GAMESTATE_ATTACKCOUNT_OFFSET,
      dgroup.i16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET) + cur.tics,
    );
    dgroup.setU16(
      gamestate + GAMESTATE_ATTACKFRAME_OFFSET,
      dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) + 1,
    );
    dgroup.setU16(
      gamestate + GAMESTATE_WEAPONFRAME_OFFSET,
      attackInfoFor(weapon, dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET)).frame,
    );
  }

  return attackTickSummary(dgroup, actor, false, attacks, movement);
}

export function TryMoveMemory(dgroup: DOSMemory, actor: number): PlayerTryMoveSummary {
  const objlist = nearOffsetForRuntimeSymbol("_objlist");
  let xl = (dgroup.i32(actor + OBJ_X_OFFSET) - PLAYERSIZE) >> TILESHIFT;
  let yl = (dgroup.i32(actor + OBJ_Y_OFFSET) - PLAYERSIZE) >> TILESHIFT;
  let xh = (dgroup.i32(actor + OBJ_X_OFFSET) + PLAYERSIZE) >> TILESHIFT;
  let yh = (dgroup.i32(actor + OBJ_Y_OFFSET) + PLAYERSIZE) >> TILESHIFT;

  for (let y = yl; y <= yh; y++) {
    for (let x = xl; x <= xh; x++) {
      requireMapCell(x, y);
      const check = actoratAt(dgroup, x, y);
      if (check && check < objlist) {
        return { actor, ok: false, blockedBy: "wall", blocker: check, tilex: x, tiley: y };
      }
    }
  }

  if (yl > 0) {
    yl--;
  }
  if (yh < MAPSIZE - 1) {
    yh++;
  }
  if (xl > 0) {
    xl--;
  }
  if (xh < MAPSIZE - 1) {
    xh++;
  }

  for (let y = yl; y <= yh; y++) {
    for (let x = xl; x <= xh; x++) {
      requireMapCell(x, y);
      const check = actoratAt(dgroup, x, y);
      if (check > objlist && (dgroup.u8(check + OBJ_FLAGS_OFFSET) & FL_SHOOTABLE)) {
        const deltax = dgroup.i32(actor + OBJ_X_OFFSET) - dgroup.i32(check + OBJ_X_OFFSET);
        if (deltax < -MINACTORDIST || deltax > MINACTORDIST) {
          continue;
        }
        const deltay = dgroup.i32(actor + OBJ_Y_OFFSET) - dgroup.i32(check + OBJ_Y_OFFSET);
        if (deltay < -MINACTORDIST || deltay > MINACTORDIST) {
          continue;
        }
        return { actor, ok: false, blockedBy: "actor", blocker: check, tilex: x, tiley: y };
      }
    }
  }

  return { actor, ok: true, blockedBy: null, blocker: null, tilex: null, tiley: null };
}

export function ClipMoveMemory(
  dgroup: DOSMemory,
  actor: number,
  xmove: number,
  ymove: number,
): ClipMoveSummary {
  const basex = dgroup.i32(actor + OBJ_X_OFFSET);
  const basey = dgroup.i32(actor + OBJ_Y_OFFSET);

  dgroup.setU32(actor + OBJ_X_OFFSET, i32(basex + xmove));
  dgroup.setU32(actor + OBJ_Y_OFFSET, i32(basey + ymove));
  if (TryMoveMemory(dgroup, actor).ok) {
    return clipMoveSummary(dgroup, actor, true, "both");
  }

  if (
    dgroup.u16(nearOffsetForRuntimeSymbol("_noclip")) &&
    dgroup.i32(actor + OBJ_X_OFFSET) > 2 * TILEGLOBAL &&
    dgroup.i32(actor + OBJ_Y_OFFSET) > 2 * TILEGLOBAL &&
    dgroup.i32(actor + OBJ_X_OFFSET) <
      ((dgroup.u16(nearOffsetForRuntimeSymbol("_mapwidth")) - 1) << TILESHIFT) &&
    dgroup.i32(actor + OBJ_Y_OFFSET) <
      ((dgroup.u16(nearOffsetForRuntimeSymbol("_mapheight")) - 1) << TILESHIFT)
  ) {
    return clipMoveSummary(dgroup, actor, true, "noclip");
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, i32(basex + xmove));
  dgroup.setU32(actor + OBJ_Y_OFFSET, basey);
  if (TryMoveMemory(dgroup, actor).ok) {
    return clipMoveSummary(dgroup, actor, true, "x");
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, basex);
  dgroup.setU32(actor + OBJ_Y_OFFSET, i32(basey + ymove));
  if (TryMoveMemory(dgroup, actor).ok) {
    return clipMoveSummary(dgroup, actor, true, "y");
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, basex);
  dgroup.setU32(actor + OBJ_Y_OFFSET, basey);
  return clipMoveSummary(dgroup, actor, false, "none");
}

export function VictoryTileMemory(dgroup: DOSMemory, plane0?: Uint16Array): void {
  // WL_AGENT.C VictoryTile: spawn BJ to run off the exit, then latch the victory flag. T_BJRun/
  // T_BJDone then end the episode (ex_victorious) for the exit-elevator endings (E1, E5, etc.).
  if (plane0) {
    SpawnBJVictoryMemory(dgroup, plane0);
  }
  dgroup.setU16(
    nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_VICTORYFLAG_OFFSET,
    1,
  );
}

export function ThrustMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  angle: number,
  speed: number,
): ThrustSummary {
  requireMapPlane(plane0);
  requireMapPlane(plane1);
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const thrustspeed = nearOffsetForRuntimeSymbol("_thrustspeed");
  dgroup.setU32(thrustspeed, i32(dgroup.i32(thrustspeed) + speed));

  let clippedSpeed = speed;
  if (clippedSpeed >= MINDIST * 2) {
    clippedSpeed = MINDIST * 2 - 1;
  }

  const normalizedAngle = normalizeAngle(angle);
  const xmove = FixedByFracMemory(clippedSpeed, costableAt(normalizedAngle));
  const ymove = i32(-FixedByFracMemory(clippedSpeed, sintableAt(normalizedAngle)));
  const clip = ClipMoveMemory(dgroup, player, xmove, ymove);

  const tilex = dgroup.i32(player + OBJ_X_OFFSET) >> TILESHIFT;
  const tiley = dgroup.i32(player + OBJ_Y_OFFSET) >> TILESHIFT;
  requireMapCell(tilex, tiley);
  dgroup.setU16(player + OBJ_TILEX_OFFSET, tilex);
  dgroup.setU16(player + OBJ_TILEY_OFFSET, tiley);

  const areaTile = plane0[tiley * MAPSIZE + tilex];
  const areanumber = areaTile - AREATILE;
  dgroup.setU8(player + OBJ_AREANUMBER_OFFSET, areanumber);
  if (plane1[tiley * MAPSIZE + tilex] === EXITTILE) {
    VictoryTileMemory(dgroup, plane0);
  }

  return {
    player,
    angle: normalizedAngle,
    speed,
    clippedSpeed,
    xmove,
    ymove,
    tilex,
    tiley,
    areanumber: dgroup.u8(player + OBJ_AREANUMBER_OFFSET),
    victory: dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_VICTORYFLAG_OFFSET) !== 0,
    clip,
  };
}

export function ControlMovementMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor = dgroup.u16(nearOffsetForRuntimeSymbol("_player")),
): ControlMovementSummary {
  const thrusts: ThrustSummary[] = [];
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  const controlx = dgroup.i16(nearOffsetForRuntimeSymbol("_controlx"));
  const controly = dgroup.i16(nearOffsetForRuntimeSymbol("_controly"));
  const anglefracOffset = nearOffsetForRuntimeSymbol("_anglefrac");
  const thrustspeed = nearOffsetForRuntimeSymbol("_thrustspeed");
  const oldx = dgroup.i32(player + OBJ_X_OFFSET);
  const oldy = dgroup.i32(player + OBJ_Y_OFFSET);

  dgroup.setU32(thrustspeed, 0);

  if (dgroup.u16(buttonstate + BT_STRAFE * 2)) {
    if (controlx > 0) {
      let angle = dgroup.i16(actor + OBJ_ANGLE_OFFSET) - ANGLES / 4;
      if (angle < 0) {
        angle += ANGLES;
      }
      thrusts.push(ThrustMemory(dgroup, plane0, plane1, angle, controlx * MOVESCALE));
    } else if (controlx < 0) {
      let angle = dgroup.i16(actor + OBJ_ANGLE_OFFSET) + ANGLES / 4;
      if (angle >= ANGLES) {
        angle -= ANGLES;
      }
      thrusts.push(ThrustMemory(dgroup, plane0, plane1, angle, -controlx * MOVESCALE));
    }
  } else {
    let anglefrac = i16(dgroup.i16(anglefracOffset) + controlx);
    const angleunits = cdiv(anglefrac, ANGLESCALE);
    anglefrac = i16(anglefrac - angleunits * ANGLESCALE);
    dgroup.setU16(anglefracOffset, anglefrac);

    let angle = dgroup.i16(actor + OBJ_ANGLE_OFFSET) - angleunits;
    if (angle >= ANGLES) {
      angle -= ANGLES;
    }
    if (angle < 0) {
      angle += ANGLES;
    }
    dgroup.setU16(actor + OBJ_ANGLE_OFFSET, angle);
  }

  if (controly < 0) {
    thrusts.push(ThrustMemory(dgroup, plane0, plane1, dgroup.i16(actor + OBJ_ANGLE_OFFSET), -controly * MOVESCALE));
  } else if (controly > 0) {
    let angle = dgroup.i16(actor + OBJ_ANGLE_OFFSET) + ANGLES / 2;
    if (angle >= ANGLES) {
      angle -= ANGLES;
    }
    thrusts.push(ThrustMemory(dgroup, plane0, plane1, angle, controly * BACKMOVESCALE));
  }

  if (dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return controlMovementSummary(dgroup, actor, thrusts, true);
  }

  dgroup.setU32(nearOffsetForRuntimeSymbol("_playerxmove"), i32(dgroup.i32(player + OBJ_X_OFFSET) - oldx));
  dgroup.setU32(nearOffsetForRuntimeSymbol("_playerymove"), i32(dgroup.i32(player + OBJ_Y_OFFSET) - oldy));
  return controlMovementSummary(dgroup, actor, thrusts, false);
}

export function VictorySpinMemory(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): VictorySpinSummary {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  let angle = dgroup.i16(player + OBJ_ANGLE_OFFSET);
  if (angle > 270) {
    angle -= tics * 3;
    if (angle < 270) {
      angle = 270;
    }
  } else if (angle < 270) {
    angle += tics * 3;
    if (angle > 270) {
      angle = 270;
    }
  }
  dgroup.setU16(player + OBJ_ANGLE_OFFSET, angle);

  const desty = (((dgroup.u16(player + OBJ_TILEY_OFFSET) - 5) << TILESHIFT) - 0x3000) | 0;
  let y = dgroup.i32(player + OBJ_Y_OFFSET);
  if (y > desty) {
    y -= tics * 4096;
    if (y < desty) {
      y = desty;
    }
    dgroup.setU32(player + OBJ_Y_OFFSET, y);
  }

  return { player, angle: dgroup.u16(player + OBJ_ANGLE_OFFSET), y: dgroup.i32(player + OBJ_Y_OFFSET), desty };
}

export function CloseDoorMemory(dgroup: DOSMemory, door: number): CloseDoorSummary {
  const doorobj = doorObjectAt(door);
  const tilex = dgroup.u8(doorobj + DOOR_TILEX_OFFSET);
  const tiley = dgroup.u8(doorobj + DOOR_TILEY_OFFSET);
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));

  if (actoratAt(dgroup, tilex, tiley)) {
    return closeDoorSummary(dgroup, door, false, true);
  }
  if (dgroup.u16(player + OBJ_TILEX_OFFSET) === tilex && dgroup.u16(player + OBJ_TILEY_OFFSET) === tiley) {
    return closeDoorSummary(dgroup, door, false, true);
  }

  if (dgroup.u16(doorobj + DOOR_VERTICAL_OFFSET)) {
    if (dgroup.u16(player + OBJ_TILEY_OFFSET) === tiley) {
      if (((dgroup.i32(player + OBJ_X_OFFSET) + MINDIST) >> TILESHIFT) === tilex) {
        return closeDoorSummary(dgroup, door, false, true);
      }
      if (((dgroup.i32(player + OBJ_X_OFFSET) - MINDIST) >> TILESHIFT) === tilex) {
        return closeDoorSummary(dgroup, door, false, true);
      }
    }
    if (doorActorBlocksX(dgroup, tilex - 1, tiley, MINDIST, tilex)) {
      return closeDoorSummary(dgroup, door, false, true);
    }
    if (doorActorBlocksX(dgroup, tilex + 1, tiley, -MINDIST, tilex)) {
      return closeDoorSummary(dgroup, door, false, true);
    }
  } else {
    if (dgroup.u16(player + OBJ_TILEX_OFFSET) === tilex) {
      if (((dgroup.i32(player + OBJ_Y_OFFSET) + MINDIST) >> TILESHIFT) === tiley) {
        return closeDoorSummary(dgroup, door, false, true);
      }
      if (((dgroup.i32(player + OBJ_Y_OFFSET) - MINDIST) >> TILESHIFT) === tiley) {
        return closeDoorSummary(dgroup, door, false, true);
      }
    }
    if (doorActorBlocksY(dgroup, tilex, tiley - 1, MINDIST, tiley)) {
      return closeDoorSummary(dgroup, door, false, true);
    }
    if (doorActorBlocksY(dgroup, tilex, tiley + 1, -MINDIST, tiley)) {
      return closeDoorSummary(dgroup, door, false, true);
    }
  }

  SD_PlaySound(CLOSEDOORSND); // door commits to closing (WL_ACT1.C CloseDoor)
  dgroup.setU16(doorobj + DOOR_ACTION_OFFSET, DR_CLOSING);
  dgroup.setU16(actoratCellOffset(nearOffsetForRuntimeSymbol("_actorat"), tilex, tiley), door | 0x80);
  return closeDoorSummary(dgroup, door, true, false);
}

export function InitAreasMemory(dgroup: DOSMemory): AreaConnectSummary {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const playerArea = dgroup.u8(player + OBJ_AREANUMBER_OFFSET);
  const areabyplayer = nearOffsetForRuntimeSymbol("_areabyplayer");
  dgroup.view(areabyplayer, NUMAREAS * 2).fill(0);
  if (playerArea < NUMAREAS) {
    dgroup.setU16(areabyplayer + playerArea * 2, 1);
  }
  return { playerArea, visibleAreas: playerArea < NUMAREAS ? 1 : 0 };
}

export function ConnectAreasMemory(
  dgroup: DOSMemory,
  areaconnect?: DOSByteSource,
): AreaConnectSummary {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const playerArea = dgroup.u8(player + OBJ_AREANUMBER_OFFSET);
  const areabyplayer = nearOffsetForRuntimeSymbol("_areabyplayer");
  dgroup.view(areabyplayer, NUMAREAS * 2).fill(0);
  if (playerArea >= NUMAREAS) {
    return { playerArea, visibleAreas: 0 };
  }

  const connections = areaconnectBytes(dgroup, areaconnect);
  let visibleAreas = 0;
  const visit = (area: number): void => {
    if (dgroup.u16(areabyplayer + area * 2)) {
      return;
    }
    dgroup.setU16(areabyplayer + area * 2, 1);
    visibleAreas++;
    for (let i = 0; i < NUMAREAS; i++) {
      if (connections[area * NUMAREAS + i] && !dgroup.u16(areabyplayer + i * 2)) {
        visit(i);
      }
    }
  };

  visit(playerArea);
  return { playerArea, visibleAreas };
}

export function RecursiveConnectMemory(
  dgroup: DOSMemory,
  areanumber: number,
  areaconnect?: DOSByteSource,
): AreaConnectSummary {
  const areabyplayer = nearOffsetForRuntimeSymbol("_areabyplayer");
  const connections = areaconnectBytes(dgroup, areaconnect);
  let visibleAreas = 0;
  const visit = (area: number): void => {
    if (area < 0 || area >= NUMAREAS || dgroup.u16(areabyplayer + area * 2)) {
      return;
    }
    dgroup.setU16(areabyplayer + area * 2, 1);
    visibleAreas++;
    for (let i = 0; i < NUMAREAS; i++) {
      if (connections[area * NUMAREAS + i] && !dgroup.u16(areabyplayer + i * 2)) {
        visit(i);
      }
    }
  };
  visit(areanumber);
  return { playerArea: areanumber, visibleAreas };
}

export function DoorOpenMemory(
  dgroup: DOSMemory,
  door: number,
  options: SightPlayerOptions = {},
): DoorTickSummary {
  const doorobj = doorObjectAt(door);
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  dgroup.setU16(doorobj + DOOR_TICCOUNT_OFFSET, dgroup.u16(doorobj + DOOR_TICCOUNT_OFFSET) + tics);
  let blocked = false;
  if (dgroup.u16(doorobj + DOOR_TICCOUNT_OFFSET) >= OPENTICS) {
    const closed = CloseDoorMemory(dgroup, door);
    blocked = closed.blocked;
  }
  return doorTickSummary(dgroup, door, false, false, blocked, false);
}

export function DoorOpeningMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  door: number,
  areaconnect?: DOSByteSource,
  options: SightPlayerOptions = {},
): DoorTickSummary {
  requireMapPlane(plane0);
  const doorobj = doorObjectAt(door);
  const doorposition = nearOffsetForRuntimeSymbol("_doorposition");
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  let position = dgroup.u16(doorposition + door * 2);
  let connected = false;

  if (!position) {
    const [area1, area2] = doorAreas(dgroup, plane0, door);
    const connections = areaconnectBytes(dgroup, areaconnect);
    connections[area1 * NUMAREAS + area2] = (connections[area1 * NUMAREAS + area2] + 1) & 0xff;
    connections[area2 * NUMAREAS + area1] = (connections[area2 * NUMAREAS + area1] + 1) & 0xff;
    ConnectAreasMemory(dgroup, areaconnect);
    connected = true;
    SD_PlaySound(OPENDOORSND); // door starts opening (WL_ACT1.C DoorOpening)
  }

  position += tics << 10;
  if (position >= 0xffff) {
    position = 0xffff;
    dgroup.setU16(doorobj + DOOR_TICCOUNT_OFFSET, 0);
    dgroup.setU16(doorobj + DOOR_ACTION_OFFSET, DR_OPEN);
    dgroup.setU16(
      actoratCellOffset(
        nearOffsetForRuntimeSymbol("_actorat"),
        dgroup.u8(doorobj + DOOR_TILEX_OFFSET),
        dgroup.u8(doorobj + DOOR_TILEY_OFFSET),
      ),
      0,
    );
  }

  dgroup.setU16(doorposition + door * 2, position);
  return doorTickSummary(dgroup, door, connected, false, false, false);
}

export function DoorClosingMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  door: number,
  areaconnect?: DOSByteSource,
  options: SightPlayerOptions = {},
): DoorTickSummary {
  requireMapPlane(plane0);
  const doorobj = doorObjectAt(door);
  const tilex = dgroup.u8(doorobj + DOOR_TILEX_OFFSET);
  const tiley = dgroup.u8(doorobj + DOOR_TILEY_OFFSET);
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  if (
    actoratAt(dgroup, tilex, tiley) !== (door | 0x80) ||
    (dgroup.u16(player + OBJ_TILEX_OFFSET) === tilex && dgroup.u16(player + OBJ_TILEY_OFFSET) === tiley)
  ) {
    OpenDoorMemory(dgroup, door);
    return doorTickSummary(dgroup, door, false, false, true, true);
  }

  const doorposition = nearOffsetForRuntimeSymbol("_doorposition");
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  let position = dgroup.u16(doorposition + door * 2) - (tics << 10);
  let disconnected = false;

  if (position <= 0) {
    position = 0;
    dgroup.setU16(doorobj + DOOR_ACTION_OFFSET, DR_CLOSED);
    const [area1, area2] = doorAreas(dgroup, plane0, door);
    const connections = areaconnectBytes(dgroup, areaconnect);
    connections[area1 * NUMAREAS + area2] = (connections[area1 * NUMAREAS + area2] - 1) & 0xff;
    connections[area2 * NUMAREAS + area1] = (connections[area2 * NUMAREAS + area1] - 1) & 0xff;
    ConnectAreasMemory(dgroup, areaconnect);
    disconnected = true;
  }

  dgroup.setU16(doorposition + door * 2, position);
  return doorTickSummary(dgroup, door, false, disconnected, false, false);
}

export function MoveDoorsMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  areaconnect?: DOSByteSource,
  options: SightPlayerOptions = {},
): MoveDoorsSummary {
  if (dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return { moved: 0, opened: 0, closed: 0, skippedVictory: true, doors: [] };
  }

  const doors: DoorTickSummary[] = [];
  const doornum = dgroup.u16(nearOffsetForRuntimeSymbol("_doornum"));
  let opened = 0;
  let closed = 0;
  for (let door = 0; door < doornum; door++) {
    const action = dgroup.u16(doorObjectAt(door) + DOOR_ACTION_OFFSET);
    let tick: DoorTickSummary | null = null;
    switch (action) {
      case DR_OPEN:
        tick = DoorOpenMemory(dgroup, door, options);
        break;
      case DR_OPENING:
        tick = DoorOpeningMemory(dgroup, plane0, door, areaconnect, options);
        break;
      case DR_CLOSING:
        tick = DoorClosingMemory(dgroup, plane0, door, areaconnect, options);
        break;
    }
    if (tick) {
      if (tick.action === DR_OPEN) {
        opened++;
      }
      if (tick.action === DR_CLOSED) {
        closed++;
      }
      doors.push(tick);
    }
  }

  return { moved: doors.length, opened, closed, skippedVictory: false, doors };
}

export function OperateDoorMemory(dgroup: DOSMemory, door: number): OperateDoorSummary {
  if (!Number.isInteger(door) || door < 0 || door >= MAXDOORS) {
    throw new RangeError(`OperateDoor: invalid door ${door}`);
  }
  const doorobj = doorObjectAt(door);
  const lock = dgroup.u8(doorobj + DOOR_LOCK_OFFSET);
  if (lock >= 1 && lock <= 4) {
    const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
    if (!(dgroup.u16(gamestate + GAMESTATE_KEYS_OFFSET) & (1 << (lock - 1)))) {
      SD_PlaySound(NOWAYSND); // locked door, no key (WL_ACT1.C OperateDoor)
      return {
        door,
        operated: false,
        locked: true,
        action: dgroup.u16(doorobj + DOOR_ACTION_OFFSET),
        close: null,
      };
    }
  }

  const action = dgroup.u16(doorobj + DOOR_ACTION_OFFSET);
  switch (action) {
    case DR_CLOSED:
    case DR_CLOSING:
      OpenDoorMemory(dgroup, door);
      return {
        door,
        operated: true,
        locked: false,
        action: dgroup.u16(doorobj + DOOR_ACTION_OFFSET),
        close: null,
      };
    case DR_OPEN:
    case DR_OPENING: {
      const close = CloseDoorMemory(dgroup, door);
      return {
        door,
        operated: close.closed,
        locked: false,
        action: dgroup.u16(doorobj + DOOR_ACTION_OFFSET),
        close,
      };
    }
    default:
      return {
        door,
        operated: false,
        locked: false,
        action,
        close: null,
      };
  }
}

export function PushWallMemory(
  dgroup: DOSMemory,
  plane1: Uint16Array,
  checkx: number,
  checky: number,
  dir: number,
): PushWallSummary {
  requireMapPlane(plane1);
  requireMapCell(checkx, checky);
  const pwallstate = nearOffsetForRuntimeSymbol("_pwallstate");
  if (dgroup.u16(pwallstate)) {
    return { pushed: false, blocked: false, busy: true, tilex: checkx, tiley: checky, dir };
  }

  const tilemap = nearOffsetForRuntimeSymbol("_tilemap");
  const actorat = nearOffsetForRuntimeSymbol("_actorat");
  const oldtile = dgroup.u8(tilemapCellOffset(tilemap, checkx, checky));
  if (!oldtile) {
    return { pushed: false, blocked: false, busy: false, tilex: checkx, tiley: checky, dir };
  }

  const [targetx, targety] = pushWallTarget(checkx, checky, dir);
  if (actoratAt(dgroup, targetx, targety)) {
    return { pushed: false, blocked: true, busy: false, tilex: checkx, tiley: checky, dir };
  }

  dgroup.setU16(actoratCellOffset(actorat, targetx, targety), oldtile);
  dgroup.setU8(tilemapCellOffset(tilemap, targetx, targety), oldtile);
  const secretcount = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_SECRETCOUNT_OFFSET;
  dgroup.setU16(secretcount, dgroup.u16(secretcount) + 1);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pwallx"), checkx);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pwally"), checky);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pwalldir"), dir);
  SD_PlaySound(PUSHWALLSND); // secret push-wall starts moving (WL_ACT1.C PushWall)
  dgroup.setU16(pwallstate, 1);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pwallpos"), 0);
  orTilemapCell(dgroup, tilemap, checkx, checky, 0xc0);
  plane1[checky * MAPSIZE + checkx] = 0;
  return { pushed: true, blocked: false, busy: false, tilex: checkx, tiley: checky, dir };
}

export function MovePWallsMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  options: SightPlayerOptions = {},
): MovePWallsSummary {
  requireMapPlane(plane0);
  const pwallstateOffset = nearOffsetForRuntimeSymbol("_pwallstate");
  let pwallstate = dgroup.u16(pwallstateOffset);
  if (!pwallstate) {
    return movePWallsSummary(dgroup, false, false, false);
  }

  const oldblock = cdiv(pwallstate, 128);
  const tics = options.tics ?? (dgroup.u16(nearOffsetForRuntimeSymbol("_tics")) || 1);
  pwallstate += tics;
  dgroup.setU16(pwallstateOffset, pwallstate);
  let crossedBlock = false;

  if (cdiv(pwallstate, 128) !== oldblock) {
    crossedBlock = true;
    const tilemap = nearOffsetForRuntimeSymbol("_tilemap");
    const actorat = nearOffsetForRuntimeSymbol("_actorat");
    let pwallx = dgroup.u16(nearOffsetForRuntimeSymbol("_pwallx"));
    let pwally = dgroup.u16(nearOffsetForRuntimeSymbol("_pwally"));
    const oldtile = dgroup.u8(tilemapCellOffset(tilemap, pwallx, pwally)) & 63;
    const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));

    dgroup.setU8(tilemapCellOffset(tilemap, pwallx, pwally), 0);
    dgroup.setU16(actoratCellOffset(actorat, pwallx, pwally), 0);
    plane0[pwally * MAPSIZE + pwallx] = dgroup.u8(player + OBJ_AREANUMBER_OFFSET) + AREATILE;

    if (pwallstate > 256) {
      dgroup.setU16(pwallstateOffset, 0);
      return movePWallsSummary(dgroup, false, true, true);
    }

    const pwalldir = dgroup.u16(nearOffsetForRuntimeSymbol("_pwalldir"));
    [pwallx, pwally] = pushWallTarget(pwallx, pwally, pwalldir);
    const [targetx, targety] = pushWallTarget(pwallx, pwally, pwalldir);
    if (actoratAt(dgroup, targetx, targety)) {
      dgroup.setU16(pwallstateOffset, 0);
      dgroup.setU16(nearOffsetForRuntimeSymbol("_pwallx"), pwallx);
      dgroup.setU16(nearOffsetForRuntimeSymbol("_pwally"), pwally);
      return movePWallsSummary(dgroup, false, true, true);
    }

    dgroup.setU16(actoratCellOffset(actorat, targetx, targety), oldtile);
    dgroup.setU8(tilemapCellOffset(tilemap, targetx, targety), oldtile);
    dgroup.setU16(nearOffsetForRuntimeSymbol("_pwallx"), pwallx);
    dgroup.setU16(nearOffsetForRuntimeSymbol("_pwally"), pwally);
    dgroup.setU8(tilemapCellOffset(tilemap, pwallx, pwally), oldtile | 0xc0);
  }

  dgroup.setU16(nearOffsetForRuntimeSymbol("_pwallpos"), cdiv(dgroup.u16(pwallstateOffset), 2) & 63);
  return movePWallsSummary(dgroup, dgroup.u16(pwallstateOffset) !== 0, crossedBlock, false);
}

export function PollControlsMemory(
  dgroup: DOSMemory,
  options: PollControlsOptions = {},
): PollControlsSummary {
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = nearOffsetForRuntimeSymbol("_buttonheld");
  const controlx = nearOffsetForRuntimeSymbol("_controlx");
  const controly = nearOffsetForRuntimeSymbol("_controly");
  const ticOffset = nearOffsetForRuntimeSymbol("_tics");
  const tics = options.demoCommand ? DEMOTICS : options.tics ?? (dgroup.u16(ticOffset) || 1);

  dgroup.setU16(ticOffset, tics);
  dgroup.setU16(controlx, 0);
  dgroup.setU16(controly, 0);

  for (let i = 0; i < NUMBUTTONS; i++) {
    dgroup.setU16(buttonheld + i * 2, dgroup.u16(buttonstate + i * 2));
    dgroup.setU16(buttonstate + i * 2, 0);
  }

  if (options.demoCommand) {
    for (let i = 0; i < NUMBUTTONS; i++) {
      dgroup.setU16(buttonstate + i * 2, options.demoCommand.buttonstate[i] ? 1 : 0);
    }
    dgroup.setU16(controlx, i16(options.demoCommand.controlx * tics));
    dgroup.setU16(controly, i16(options.demoCommand.controly * tics));
    if (options.demoDone) {
      dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), EX_COMPLETED);
    }
  } else {
    options.pollControls?.(dgroup, tics);
    // WL_PLAY.C PollControls clamps the summed control deltas to ±100*tics after polling, so a fast
    // mouse/joystick flick can't turn or move faster than DOS permits. Live path only — the
    // demoCommand branch sets pre-bounded values (int8 * tics) and must stay byte-exact for demos.
    const max = 100 * tics;
    const clampControl = (v: number): number => (v > max ? max : v < -max ? -max : v);
    dgroup.setU16(controlx, i16(clampControl(i16(dgroup.u16(controlx)))));
    dgroup.setU16(controly, i16(clampControl(i16(dgroup.u16(controly)))));
  }

  return pollControlsSummary(dgroup);
}

export function PlayLoopStepMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  options: PlayLoopStepOptions = {},
): PlayLoopStepSummary {
  const controls = PollControlsMemory(dgroup, options);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_madenoise"), 0);

  const stepOptions = { ...options, tics: controls.tics };
  // Sound is serviced by the t0 ISR during the CalcTics/PollControls wait at the TOP of
  // the original PlayLoop, so actors (and UpdateFace's SD_SoundPlaying check) think with
  // the POST-service sound state for this tic. Servicing here (not at the end) is what
  // makes a sound's stop boundary visible to UpdateFace on the correct tic (demo 140).
  for (let soundTick = 0; soundTick < controls.tics * 2; soundTick++) {
    SDL_t0Service();
  }
  const doors = MoveDoorsMemory(dgroup, plane0, options.areaconnect, stepOptions);
  const pwalls = MovePWallsMemory(dgroup, plane0, stepOptions);
  const actorSteps: ActorStepSummary[] = [];

  let actor = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  let guard = 0;
  while (actor) {
    if (++guard > MAXACTORS) {
      throw new Error("PlayLoopStepMemory actor list exceeded MAXACTORS");
    }
    const step = DoActorMemory(dgroup, plane0, plane1, actor, stepOptions);
    actorSteps.push(step);
    actor = dgroup.u16(actor + OBJ_NEXT_OFFSET);
  }

  const palette = UpdatePaletteShiftsMemory(dgroup, stepOptions);
  const viewProjection = options.projectActorVisibility === false
    ? null
    : ProjectActorVisibilityMemory(dgroup, stepOptions);
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU32(
    gamestate + GAMESTATE_TIMECOUNT_OFFSET,
    i32(dgroup.i32(gamestate + GAMESTATE_TIMECOUNT_OFFSET) + controls.tics),
  );
  const sound = SD_Poll();

  return {
    controls,
    doors,
    pwalls,
    actorSteps,
    palette,
    viewProjection,
    sound,
    timeCount: dgroup.u32(gamestate + GAMESTATE_TIMECOUNT_OFFSET),
    playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
  };
}

export function ProjectActorVisibilityMemory(
  dgroup: DOSMemory,
  options: PlayLoopStepOptions = {},
): ViewProjectionSummary | null {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  if (!player) {
    return null;
  }

  const viewwidth = Math.trunc(options.viewwidth ?? (DEFAULT_VIEW_SIZE * 16));
  const centerxOffset = nearOffsetForRuntimeSymbol("_centerx");
  const shootdeltaOffset = nearOffsetForRuntimeSymbol("_shootdelta");
  const centerx = Math.trunc(options.centerx ?? (dgroup.i16(centerxOffset) || (Math.trunc(viewwidth / 2) - 1)));
  const shootdelta = Math.trunc(options.shootdelta ?? (dgroup.i16(shootdeltaOffset) || Math.trunc(viewwidth / 10)));
  const focallength = Math.trunc(options.focallength ?? FOCALLENGTH);
  const facedist = focallength + MINDIST;
  const scale = Math.trunc(options.scale ?? (Math.trunc(viewwidth / 2) * facedist / (VIEWGLOBAL / 2)));
  const viewangle = normalizeAngle(dgroup.u16(player + OBJ_ANGLE_OFFSET));
  const viewsin = sintableAt(viewangle);
  const viewcos = costableAt(viewangle);
  const viewx = i32(dgroup.i32(player + OBJ_X_OFFSET) - FixedByFracMemory(focallength, viewcos));
  const viewy = i32(dgroup.i32(player + OBJ_Y_OFFSET) + FixedByFracMemory(focallength, viewsin));

  dgroup.setU16(centerxOffset, centerx);
  dgroup.setU16(shootdeltaOffset, shootdelta);

  const pickedBonuses = ProjectBonusPickupsMemory(dgroup, viewx, viewy, viewsin, viewcos);
  let visibleActors = 0;
  for (let actor = dgroup.u16(player + OBJ_NEXT_OFFSET); actor; actor = dgroup.u16(actor + OBJ_NEXT_OFFSET)) {
    if (!actorHasRenderableState(dgroup, actor) || !CheckLineMemory(dgroup, actor, options)) {
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_VISABLE);
      continue;
    }

    const gx = i32(dgroup.i32(actor + OBJ_X_OFFSET) - viewx);
    const gy = i32(dgroup.i32(actor + OBJ_Y_OFFSET) - viewy);
    const gxt = FixedByFracMemory(gx, viewcos);
    const gyt = FixedByFracMemory(gy, viewsin);
    const nx = i32(gxt - gyt - ACTORSIZE);
    const yGxt = FixedByFracMemory(gx, viewsin);
    const yGyt = FixedByFracMemory(gy, viewcos);
    const ny = i32(yGyt + yGxt);

    dgroup.setU32(actor + OBJ_TRANSX_OFFSET, nx);
    dgroup.setU32(actor + OBJ_TRANSY_OFFSET, ny);
    if (nx < MINDIST) {
      dgroup.setU16(actor + OBJ_VIEWHEIGHT_OFFSET, 0);
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_VISABLE);
      continue;
    }

    const screenxNumerator = i32(ny * scale);
    const screenx = i16(centerx + cdiv(screenxNumerator, nx));
    const heightDivisor = nx >> 8;
    const height = heightDivisor ? cdiv((TILEGLOBAL * scale) >> 6, heightDivisor) : 0;
    if (screenx < 0 || screenx >= viewwidth || height <= 0) {
      dgroup.setU16(actor + OBJ_VIEWX_OFFSET, screenx);
      dgroup.setU16(actor + OBJ_VIEWHEIGHT_OFFSET, 0);
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_VISABLE);
      continue;
    }
    dgroup.setU16(actor + OBJ_VIEWX_OFFSET, screenx);
    dgroup.setU16(actor + OBJ_VIEWHEIGHT_OFFSET, height);
    dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) | FL_VISABLE);
    visibleActors++;
  }

  return {
    centerx,
    shootdelta,
    viewx,
    viewy,
    viewangle,
    scale,
    pickedBonuses,
    visibleActors,
  };
}

function ProjectBonusPickupsMemory(
  dgroup: DOSMemory,
  viewx: number,
  viewy: number,
  viewsin: number,
  viewcos: number,
): number {
  const statobjBytes = STRUCT_LAYOUTS.statobj_t.bytes;
  const statobjlist = nearOffsetForRuntimeSymbol("_statobjlist");
  const laststatobj = dgroup.u16(nearOffsetForRuntimeSymbol("_laststatobj"));
  let picked = 0;

  for (let statobj = statobjlist; statobj < laststatobj; statobj += statobjBytes) {
    if (
      dgroup.i16(statobj + STAT_SHAPENUM_OFFSET) === -1 ||
      !(dgroup.u8(statobj + STAT_FLAGS_OFFSET) & FL_BONUS)
    ) {
      continue;
    }
    const visspot = dgroup.u16(statobj + STAT_VISSPOT_OFFSET);
    if (!visspot || !dgroup.u8(visspot)) {
      continue;
    }

    const gx = i32(((dgroup.u8(statobj + STAT_TILEX_OFFSET) << TILESHIFT) + TILEGLOBAL / 2) - viewx);
    const gy = i32(((dgroup.u8(statobj + STAT_TILEY_OFFSET) << TILESHIFT) + TILEGLOBAL / 2) - viewy);
    const gxt = FixedByFracMemory(gx, viewcos);
    const gyt = FixedByFracMemory(gy, viewsin);
    const nx = i32(gxt - gyt - TILE_OBJECT_SIZE);
    const yGxt = FixedByFracMemory(gx, viewsin);
    const yGyt = FixedByFracMemory(gy, viewcos);
    const ny = i32(yGyt + yGxt);
    const visible = nx >= MINDIST;
    const grabbed = visible && nx < TILEGLOBAL && ny > -TILEGLOBAL / 2 && ny < TILEGLOBAL / 2;
    if (grabbed && GetBonusMemory(dgroup, statobj).picked) {
      picked++;
    }
  }

  return picked;
}

export function CmdUseMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
): CmdUseSummary {
  requireMapPlane(plane0);
  requireMapPlane(plane1);
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const buttonheld = nearOffsetForRuntimeSymbol("_buttonheld");
  let checkx: number;
  let checky: number;
  let dir: number;
  let elevatorok: boolean;
  const angle = dgroup.i16(player + OBJ_ANGLE_OFFSET);

  if (angle < ANGLES / 8 || angle > (7 * ANGLES) / 8) {
    checkx = dgroup.u16(player + OBJ_TILEX_OFFSET) + 1;
    checky = dgroup.u16(player + OBJ_TILEY_OFFSET);
    dir = DI_EAST;
    elevatorok = true;
  } else if (angle < (3 * ANGLES) / 8) {
    checkx = dgroup.u16(player + OBJ_TILEX_OFFSET);
    checky = dgroup.u16(player + OBJ_TILEY_OFFSET) - 1;
    dir = DI_NORTH;
    elevatorok = false;
  } else if (angle < (5 * ANGLES) / 8) {
    checkx = dgroup.u16(player + OBJ_TILEX_OFFSET) - 1;
    checky = dgroup.u16(player + OBJ_TILEY_OFFSET);
    dir = DI_WEST;
    elevatorok = true;
  } else {
    checkx = dgroup.u16(player + OBJ_TILEX_OFFSET);
    checky = dgroup.u16(player + OBJ_TILEY_OFFSET) + 1;
    dir = DI_SOUTH;
    elevatorok = false;
  }

  const doornum = dgroup.u8(tilemapCellOffset(nearOffsetForRuntimeSymbol("_tilemap"), checkx, checky));
  if (plane1[checky * MAPSIZE + checkx] === PUSHABLETILE) {
    const pushwall = PushWallMemory(dgroup, plane1, checkx, checky, dir);
    return {
      checkx,
      checky,
      dir,
      action: "pushwall",
      playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
      door: null,
      pushwall,
    };
  }

  if (!dgroup.u16(buttonheld + BT_USE * 2) && doornum === ELEVATORTILE && elevatorok) {
    dgroup.setU16(buttonheld + BT_USE * 2, 1);
    SD_PlaySound(LEVELDONESND); // exit elevator activated (WL_AGENT.C Cmd_Use)
    const tilemap = nearOffsetForRuntimeSymbol("_tilemap");
    dgroup.setU8(tilemapCellOffset(tilemap, checkx, checky), doornum + 1);
    const playerIndex = dgroup.u16(player + OBJ_TILEY_OFFSET) * MAPSIZE + dgroup.u16(player + OBJ_TILEX_OFFSET);
    dgroup.setU16(
      nearOffsetForRuntimeSymbol("_playstate"),
      plane0[playerIndex] === ALTELEVATORTILE ? EX_SECRETLEVEL : EX_COMPLETED,
    );
    return {
      checkx,
      checky,
      dir,
      action: "elevator",
      playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
      door: null,
      pushwall: null,
    };
  }

  if (!dgroup.u16(buttonheld + BT_USE * 2) && doornum & 0x80) {
    dgroup.setU16(buttonheld + BT_USE * 2, 1);
    const door = OperateDoorMemory(dgroup, doornum & ~0x80);
    return {
      checkx,
      checky,
      dir,
      action: "door",
      playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
      door,
      pushwall: null,
    };
  }

  return {
    checkx,
    checky,
    dir,
    action: "nothing",
    playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
    door: null,
    pushwall: null,
  };
}

export function T_PlayerMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): PlayerTickSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    const movement = VictorySpinMemory(dgroup, options);
    return playerTickSummary(dgroup, actor, true, null, null, null, movement);
  }

  UpdateFaceMemory(dgroup, options);
  const weaponChange = CheckWeaponChangeMemory(dgroup);
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = nearOffsetForRuntimeSymbol("_buttonheld");
  const used = dgroup.u16(buttonstate + BT_USE * 2) ? CmdUseMemory(dgroup, plane0, plane1) : null;
  const fired =
    dgroup.u16(buttonstate + BT_ATTACK * 2) && !dgroup.u16(buttonheld + BT_ATTACK * 2)
      ? CmdFireMemory(dgroup)
      : null;
  const movement = ControlMovementMemory(dgroup, plane0, plane1, actor);
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    return playerTickSummary(dgroup, actor, true, weaponChange, fired, used, movement);
  }

  dgroup.setU16(nearOffsetForRuntimeSymbol("_plux"), dgroup.u32(actor + OBJ_X_OFFSET) >>> UNSIGNEDSHIFT);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_pluy"), dgroup.u32(actor + OBJ_Y_OFFSET) >>> UNSIGNEDSHIFT);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, dgroup.u32(actor + OBJ_X_OFFSET) >> TILESHIFT);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, dgroup.u32(actor + OBJ_Y_OFFSET) >> TILESHIFT);
  return playerTickSummary(dgroup, actor, false, weaponChange, fired, used, movement);
}

function closestCenteredTarget(
  dgroup: DOSMemory,
  actor: number,
): { readonly actor: number; readonly dist: number } | null {
  const centerx = dgroup.i16(nearOffsetForRuntimeSymbol("_centerx"));
  const shootdelta = dgroup.i16(nearOffsetForRuntimeSymbol("_shootdelta"));
  let closest: number | null = null;
  let dist = 0x7fffffff;

  for (let check = dgroup.u16(actor + OBJ_NEXT_OFFSET); check; check = dgroup.u16(check + OBJ_NEXT_OFFSET)) {
    const flags = dgroup.u8(check + OBJ_FLAGS_OFFSET);
    if (
      (flags & FL_SHOOTABLE) !== 0 &&
      (flags & FL_VISABLE) !== 0 &&
      Math.abs(dgroup.i16(check + OBJ_VIEWX_OFFSET) - centerx) < shootdelta
    ) {
      const transx = dgroup.i32(check + OBJ_TRANSX_OFFSET);
      if (transx < dist) {
        dist = transx;
        closest = check;
      }
    }
  }

  return closest === null ? null : { actor: closest, dist };
}

function attackInfoFor(
  weapon: number,
  frame: number,
): { readonly tics: number; readonly attack: number; readonly frame: number } {
  const entry = ATTACK_INFO[weapon]?.[frame];
  if (!entry) {
    return { tics: 0, attack: 0, frame: 0 };
  }
  return entry;
}

function attackTickSummary(
  dgroup: DOSMemory,
  actor: number,
  ended: boolean,
  attacks: readonly PlayerAttackSummary[],
  movement: ControlMovementSummary | VictorySpinSummary | null,
): AttackTickSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  return {
    actor,
    state: stateNameForActor(dgroup, actor),
    attackframe: dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET),
    attackcount: dgroup.i16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET),
    weaponframe: dgroup.u16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET),
    ammo: dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET),
    weapon: dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET),
    ended,
    attacks,
    movement,
  };
}

function paletteShiftSummary(
  dgroup: DOSMemory,
  red: number,
  white: number,
  palette: PaletteShiftSummary["palette"],
): PaletteShiftSummary {
  return {
    damagecount: dgroup.i16(nearOffsetForRuntimeSymbol("_damagecount")),
    bonuscount: dgroup.i16(nearOffsetForRuntimeSymbol("_bonuscount")),
    red,
    white,
    palshifted: dgroup.u16(nearOffsetForRuntimeSymbol("_palshifted")) !== 0,
    palette,
  };
}

function faceUpdateSummary(
  dgroup: DOSMemory,
  changed: boolean,
  skipped: boolean,
): FaceUpdateSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  return {
    facecount: dgroup.i16(nearOffsetForRuntimeSymbol("_facecount")),
    faceframe: dgroup.u16(gamestate + GAMESTATE_FACEFRAME_OFFSET),
    changed,
    skipped,
  };
}

function pollControlsSummary(dgroup: DOSMemory): PollControlsSummary {
  const buttonstate = nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = nearOffsetForRuntimeSymbol("_buttonheld");
  const state: boolean[] = [];
  const held: boolean[] = [];
  let buttonbits = 0;
  for (let i = NUMBUTTONS - 1; i >= 0; i--) {
    buttonbits <<= 1;
    if (dgroup.u16(buttonstate + i * 2)) {
      buttonbits |= 1;
    }
  }
  for (let i = 0; i < NUMBUTTONS; i++) {
    state.push(dgroup.u16(buttonstate + i * 2) !== 0);
    held.push(dgroup.u16(buttonheld + i * 2) !== 0);
  }
  return {
    tics: dgroup.u16(nearOffsetForRuntimeSymbol("_tics")),
    controlx: dgroup.i16(nearOffsetForRuntimeSymbol("_controlx")),
    controly: dgroup.i16(nearOffsetForRuntimeSymbol("_controly")),
    playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")),
    buttonbits: buttonbits & 0xff,
    buttonstate: state,
    buttonheld: held,
  };
}

function clipMoveSummary(
  dgroup: DOSMemory,
  actor: number,
  moved: boolean,
  mode: ClipMoveSummary["mode"],
): ClipMoveSummary {
  return {
    actor,
    moved,
    mode,
    x: dgroup.i32(actor + OBJ_X_OFFSET),
    y: dgroup.i32(actor + OBJ_Y_OFFSET),
  };
}

function controlMovementSummary(
  dgroup: DOSMemory,
  actor: number,
  thrusts: readonly ThrustSummary[],
  victory: boolean,
): ControlMovementSummary {
  return {
    actor,
    angle: dgroup.u16(actor + OBJ_ANGLE_OFFSET),
    thrustspeed: dgroup.i32(nearOffsetForRuntimeSymbol("_thrustspeed")),
    playerxmove: dgroup.i32(nearOffsetForRuntimeSymbol("_playerxmove")),
    playerymove: dgroup.i32(nearOffsetForRuntimeSymbol("_playerymove")),
    victory,
    thrusts,
  };
}

function doorObjectAt(door: number): number {
  if (!Number.isInteger(door) || door < 0 || door >= MAXDOORS) {
    throw new RangeError(`Invalid door ${door}`);
  }
  return nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
}

function closeDoorSummary(
  dgroup: DOSMemory,
  door: number,
  closed: boolean,
  blocked: boolean,
): CloseDoorSummary {
  return {
    door,
    closed,
    blocked,
    action: dgroup.u16(doorObjectAt(door) + DOOR_ACTION_OFFSET),
  };
}

function doorActorBlocksX(
  dgroup: DOSMemory,
  tilex: number,
  tiley: number,
  offset: number,
  doorTilex: number,
): boolean {
  const check = actoratAt(dgroup, tilex, tiley);
  return (
    check > nearOffsetForRuntimeSymbol("_objlist") &&
    ((dgroup.i32(check + OBJ_X_OFFSET) + offset) >> TILESHIFT) === doorTilex
  );
}

function doorActorBlocksY(
  dgroup: DOSMemory,
  tilex: number,
  tiley: number,
  offset: number,
  doorTiley: number,
): boolean {
  const check = actoratAt(dgroup, tilex, tiley);
  return (
    check > nearOffsetForRuntimeSymbol("_objlist") &&
    ((dgroup.i32(check + OBJ_Y_OFFSET) + offset) >> TILESHIFT) === doorTiley
  );
}

function pushWallTarget(checkx: number, checky: number, dir: number): [number, number] {
  switch (dir) {
    case DI_NORTH:
      return [checkx, checky - 1];
    case DI_EAST:
      return [checkx + 1, checky];
    case DI_SOUTH:
      return [checkx, checky + 1];
    case DI_WEST:
      return [checkx - 1, checky];
    default:
      throw new RangeError(`Invalid push wall dir ${dir}`);
  }
}

function playerTickSummary(
  dgroup: DOSMemory,
  actor: number,
  victory: boolean,
  weaponChange: WeaponChangeSummary | null,
  fired: CmdFireSummary | null,
  used: CmdUseSummary | null,
  movement: ControlMovementSummary | VictorySpinSummary,
): PlayerTickSummary {
  return {
    actor,
    state: stateNameForActor(dgroup, actor),
    plux: dgroup.u16(nearOffsetForRuntimeSymbol("_plux")),
    pluy: dgroup.u16(nearOffsetForRuntimeSymbol("_pluy")),
    tilex: dgroup.u16(actor + OBJ_TILEX_OFFSET),
    tiley: dgroup.u16(actor + OBJ_TILEY_OFFSET),
    victory,
    weaponChange,
    fired,
    used,
    movement,
  };
}

function areaconnectBytes(dgroup: DOSMemory, areaconnect?: DOSByteSource): Uint8Array {
  const bytes = bytesOf(areaconnect ?? dgroup);
  const offset = nearOffsetForRuntimeSymbol("_areaconnect");
  if (offset + NUMAREAS * NUMAREAS > bytes.length) {
    throw new RangeError("areaconnect buffer is too small");
  }
  return bytes.subarray(offset, offset + NUMAREAS * NUMAREAS);
}

function doorAreas(dgroup: DOSMemory, plane0: Uint16Array, door: number): [number, number] {
  const doorobj = doorObjectAt(door);
  const tilex = dgroup.u8(doorobj + DOOR_TILEX_OFFSET);
  const tiley = dgroup.u8(doorobj + DOOR_TILEY_OFFSET);
  requireMapCell(tilex, tiley);
  let area1: number;
  let area2: number;
  if (dgroup.u16(doorobj + DOOR_VERTICAL_OFFSET)) {
    area1 = plane0[tiley * MAPSIZE + tilex + 1];
    area2 = plane0[tiley * MAPSIZE + tilex - 1];
  } else {
    area1 = plane0[(tiley - 1) * MAPSIZE + tilex];
    area2 = plane0[(tiley + 1) * MAPSIZE + tilex];
  }
  area1 -= AREATILE;
  area2 -= AREATILE;
  if (area1 < 0 || area1 >= NUMAREAS || area2 < 0 || area2 >= NUMAREAS) {
    throw new RangeError(`Door ${door} connects invalid areas ${area1}, ${area2}`);
  }
  return [area1, area2];
}

function doorTickSummary(
  dgroup: DOSMemory,
  door: number,
  connected: boolean,
  disconnected: boolean,
  blocked: boolean,
  reopened: boolean,
): DoorTickSummary {
  const doorobj = doorObjectAt(door);
  return {
    door,
    action: dgroup.u16(doorobj + DOOR_ACTION_OFFSET),
    position: dgroup.u16(nearOffsetForRuntimeSymbol("_doorposition") + door * 2),
    ticcount: dgroup.u16(doorobj + DOOR_TICCOUNT_OFFSET),
    connected,
    disconnected,
    blocked,
    reopened,
  };
}

function movePWallsSummary(
  dgroup: DOSMemory,
  active: boolean,
  crossedBlock: boolean,
  stopped: boolean,
): MovePWallsSummary {
  return {
    active,
    crossedBlock,
    stopped,
    pwallstate: dgroup.u16(nearOffsetForRuntimeSymbol("_pwallstate")),
    pwallpos: dgroup.u16(nearOffsetForRuntimeSymbol("_pwallpos")),
    pwallx: dgroup.u16(nearOffsetForRuntimeSymbol("_pwallx")),
    pwally: dgroup.u16(nearOffsetForRuntimeSymbol("_pwally")),
  };
}

function incrementGamestateWord(dgroup: DOSMemory, offset: number): number {
  const address = nearOffsetForRuntimeSymbol("_gamestate") + offset;
  dgroup.setU16(address, dgroup.u16(address) + 1);
  return dgroup.u16(address);
}

function bonusSummary(
  dgroup: DOSMemory,
  statobj: number,
  itemnumber: number,
  picked: boolean,
): BonusSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  return {
    statobj,
    itemnumber,
    picked,
    health: dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET),
    ammo: dgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET),
    score: dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET),
    lives: dgroup.u16(gamestate + GAMESTATE_LIVES_OFFSET),
    keys: dgroup.u16(gamestate + GAMESTATE_KEYS_OFFSET),
    treasurecount: dgroup.u16(gamestate + GAMESTATE_TREASURECOUNT_OFFSET),
    weapon: dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET),
    removed: dgroup.u16(statobj + STAT_SHAPENUM_OFFSET) === 0xffff,
  };
}

function weaponChangeSummary(dgroup: DOSMemory, changed: boolean): WeaponChangeSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  return {
    changed,
    weapon: dgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET),
    chosenweapon: dgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET),
  };
}

export function PlaceItemTypeMemory(
  dgroup: DOSMemory,
  itemType: number,
  tilex: number,
  tiley: number,
): PlacedItemSummary | null {
  requireMapCell(tilex, tiley);
  const type = STATINFO_WL6.findIndex(([, statItemType]) => statItemType === itemType);
  if (type < 0) {
    throw new Error(`PlaceItemType: unknown item type ${itemType}`);
  }

  const statobjBytes = STRUCT_LAYOUTS.statobj_t.bytes;
  const statobjlist = nearOffsetForRuntimeSymbol("_statobjlist");
  const laststatobjPointer = nearOffsetForRuntimeSymbol("_laststatobj");
  const end = statobjlist + MAXSTATS * statobjBytes;
  const laststatobj = dgroup.u16(laststatobjPointer);
  let statobj = statobjlist;

  for (;;) {
    if (statobj === laststatobj) {
      if (statobj === end) {
        return null;
      }
      dgroup.setU16(laststatobjPointer, statobj + statobjBytes);
      break;
    }

    if (dgroup.u16(statobj + STAT_SHAPENUM_OFFSET) === 0xffff) {
      break;
    }
    statobj += statobjBytes;
    if (statobj > end) {
      return null;
    }
  }

  const [picnum, statItemType] = STATINFO_WL6[type];
  dgroup.setU16(statobj + STAT_SHAPENUM_OFFSET, picnum);
  dgroup.setU8(statobj + STAT_TILEX_OFFSET, tilex);
  dgroup.setU8(statobj + STAT_TILEY_OFFSET, tiley);
  dgroup.setU16(
    statobj + STAT_VISSPOT_OFFSET,
    nearOffsetForRuntimeSymbol("_spotvis") + tilex * MAPSIZE + tiley,
  );
  dgroup.setU8(statobj + STAT_FLAGS_OFFSET, FL_BONUS);
  dgroup.setU8(statobj + STAT_ITEMNUMBER_OFFSET, statItemType);

  return { statobj, type, picnum, itemType: statItemType, tilex, tiley };
}

export function DropItemMemory(
  dgroup: DOSMemory,
  itemType: number,
  tilex: number,
  tiley: number,
): DropItemSummary {
  requireMapCell(tilex, tiley);
  if (!actoratAt(dgroup, tilex, tiley)) {
    return { placed: PlaceItemTypeMemory(dgroup, itemType, tilex, tiley) };
  }

  for (let x = tilex - 1; x <= tilex + 1; x++) {
    for (let y = tiley - 1; y <= tiley + 1; y++) {
      if (x < 0 || y < 0 || x >= MAPSIZE || y >= MAPSIZE) {
        continue;
      }
      if (!actoratAt(dgroup, x, y)) {
        return { placed: PlaceItemTypeMemory(dgroup, itemType, x, y) };
      }
    }
  }

  return { placed: null };
}

export function KillActorMemory(dgroup: DOSMemory, actor: number): KillActorSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);
  const tilex = dgroup.i32(actor + OBJ_X_OFFSET) >> TILESHIFT;
  const tiley = dgroup.i32(actor + OBJ_Y_OFFSET) >> TILESHIFT;
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, tilex);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, tiley);

  let points = 0;
  let state: string | null = null;
  let itemType: number | null = null;
  let setKillSpot = false;

  switch (obclass) {
    case GUARDOBJ:
      points = 100;
      state = "_s_grddie1";
      itemType = bo_clip2;
      break;
    case OFFICEROBJ:
      points = 400;
      state = "_s_ofcdie1";
      itemType = bo_clip2;
      break;
    case MUTANTOBJ:
      points = 700;
      state = "_s_mutdie1";
      itemType = bo_clip2;
      break;
    case SSOBJ:
      points = 500;
      state = "_s_ssdie1";
      itemType =
        dgroup.u16(gamestate + GAMESTATE_BESTWEAPON_OFFSET) < WP_MACHINEGUN
          ? bo_machinegun
          : bo_clip2;
      break;
    case DOGOBJ:
      points = 200;
      state = "_s_dogdie1";
      break;
    case BOSSOBJ:
      points = 5000;
      state = "_s_bossdie1";
      itemType = bo_key1;
      break;
    case GRETELOBJ:
      points = 5000;
      state = "_s_greteldie1";
      itemType = bo_key1;
      break;
    case GIFTOBJ:
      points = 5000;
      state = "_s_giftdie1";
      setKillSpot = true;
      break;
    case FATOBJ:
      points = 5000;
      state = "_s_fatdie1";
      setKillSpot = true;
      break;
    case SCHABBOBJ:
      points = 5000;
      state = "_s_schabbdie1";
      setKillSpot = true;
      break;
    case FAKEOBJ:
      points = 2000;
      state = "_s_fakedie1";
      break;
    case MECHAHITLEROBJ:
      points = 5000;
      state = "_s_mechadie1";
      break;
    case REALHITLEROBJ:
      points = 5000;
      state = "_s_hitlerdie1";
      setKillSpot = true;
      break;
  }

  if (points) {
    GivePointsMemory(dgroup, points);
  }
  if (setKillSpot) {
    dgroup.setU32(gamestate + GAMESTATE_KILLX_OFFSET, dgroup.u32(player + OBJ_X_OFFSET));
    dgroup.setU32(gamestate + GAMESTATE_KILLY_OFFSET, dgroup.u32(player + OBJ_Y_OFFSET));
  }
  if (state) {
    NewStateMemory(dgroup, actor, state);
  }
  const dropped = itemType === null ? null : PlaceItemTypeMemory(dgroup, itemType, tilex, tiley);

  dgroup.setU16(
    gamestate + GAMESTATE_KILLCOUNT_OFFSET,
    dgroup.u16(gamestate + GAMESTATE_KILLCOUNT_OFFSET) + 1,
  );
  dgroup.setU8(actor + OBJ_FLAGS_OFFSET, (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_SHOOTABLE) | FL_NONMARK);
  dgroup.setU16(actoratCellOffset(nearOffsetForRuntimeSymbol("_actorat"), tilex, tiley), 0);

  return {
    actor,
    obclass,
    state: stateNameForActor(dgroup, actor),
    score: dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET),
    lives: dgroup.u16(gamestate + GAMESTATE_LIVES_OFFSET),
    killcount: dgroup.u16(gamestate + GAMESTATE_KILLCOUNT_OFFSET),
    dropped,
    killx: dgroup.u32(gamestate + GAMESTATE_KILLX_OFFSET),
    killy: dgroup.u32(gamestate + GAMESTATE_KILLY_OFFSET),
  };
}

export function DamageActorMemory(
  dgroup: DOSMemory,
  actor: number,
  damage: number,
): ActorDamageSummary {
  dgroup.setU16(nearOffsetForRuntimeSymbol("_madenoise"), 1);
  const attackMode = (dgroup.u8(actor + OBJ_FLAGS_OFFSET) & FL_ATTACKMODE) !== 0;
  const adjustedDamage = attackMode ? damage : damage << 1;
  const hitpoints = dgroup.i16(actor + OBJ_HITPOINTS_OFFSET) - adjustedDamage;
  dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, hitpoints);

  let kill: KillActorSummary | null = null;
  if (hitpoints <= 0) {
    kill = KillActorMemory(dgroup, actor);
  } else {
    if (!attackMode) {
      FirstSightingMemory(dgroup, actor);
    }

    switch (dgroup.u16(actor + OBJ_CLASS_OFFSET)) {
      case GUARDOBJ:
        NewStateMemory(dgroup, actor, hitpoints & 1 ? "_s_grdpain" : "_s_grdpain1");
        break;
      case OFFICEROBJ:
        NewStateMemory(dgroup, actor, hitpoints & 1 ? "_s_ofcpain" : "_s_ofcpain1");
        break;
      case MUTANTOBJ:
        NewStateMemory(dgroup, actor, hitpoints & 1 ? "_s_mutpain" : "_s_mutpain1");
        break;
      case SSOBJ:
        NewStateMemory(dgroup, actor, hitpoints & 1 ? "_s_sspain" : "_s_sspain1");
        break;
    }
  }

  return {
    actor,
    damage: adjustedDamage,
    doubled: !attackMode,
    hitpoints: dgroup.i16(actor + OBJ_HITPOINTS_OFFSET),
    killed: kill !== null,
    madenoise: true,
    state: stateNameForActor(dgroup, actor),
    kill,
  };
}

export function A_SmokeMemory(dgroup: DOSMemory, actor: number): SmokeSummary {
  const smoke = GetNewActorMemory(dgroup);
  dgroup.setU16(smoke + OBJ_STATE_OFFSET, statetypeNearOffset("_s_smoke1"));
  dgroup.setU16(smoke + OBJ_TICCOUNT_OFFSET, 6);
  dgroup.setU16(smoke + OBJ_TILEX_OFFSET, dgroup.u16(actor + OBJ_TILEX_OFFSET));
  dgroup.setU16(smoke + OBJ_TILEY_OFFSET, dgroup.u16(actor + OBJ_TILEY_OFFSET));
  dgroup.setU32(smoke + OBJ_X_OFFSET, dgroup.u32(actor + OBJ_X_OFFSET));
  dgroup.setU32(smoke + OBJ_Y_OFFSET, dgroup.u32(actor + OBJ_Y_OFFSET));
  dgroup.setU16(smoke + OBJ_CLASS_OFFSET, INERTOBJ);
  dgroup.setU16(smoke + OBJ_ACTIVE_OFFSET, AC_YES);
  dgroup.setU8(smoke + OBJ_FLAGS_OFFSET, FL_NEVERMARK);
  return { actor: smoke, source: actor, state: "_s_smoke1", ticcount: 6 };
}

// WL_ACT2.C A_StartDeathCam: the looping final die-state of the death-cam bosses (Schabbs, Hitler,
// Otto Giftmacher, Fettgesicht). First pass latches the victory flag (the DOS cinematic plays here);
// the next pass through the same looping state ends the episode by entering ex_victorious.
export function A_StartDeathCamMemory(dgroup: DOSMemory): void {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  if (dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), EX_VICTORIOUS);
    return;
  }
  dgroup.setU16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET, 1);
}

export function A_DeathScreamMemory(dgroup: DOSMemory, actor: number): ActorSoundSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  const mapon = dgroup.u16(gamestate + GAMESTATE_MAPON_OFFSET);
  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);

  if (
    mapon === 9 &&
    !US_RndT() &&
    (obclass === MUTANTOBJ || obclass === GUARDOBJ || obclass === OFFICEROBJ || obclass === SSOBJ || obclass === DOGOBJ)
  ) {
    SD_PlaySound(DEATHSCREAM6SND);
    return { sound: DEATHSCREAM6SND, positioned: true, actor };
  }

  let sound = 0;
  switch (obclass) {
    case MUTANTOBJ:
      sound = AHHHGSND;
      break;
    case GUARDOBJ: {
      const sounds = [
        DEATHSCREAM1SND,
        DEATHSCREAM2SND,
        DEATHSCREAM3SND,
        DEATHSCREAM4SND,
        DEATHSCREAM5SND,
        DEATHSCREAM7SND,
        DEATHSCREAM8SND,
        DEATHSCREAM9SND,
      ] as const;
      sound = sounds[US_RndT() % 8];
      break;
    }
    case OFFICEROBJ:
      sound = NEINSOVASSND;
      break;
    case SSOBJ:
      sound = LEBENSND;
      break;
    case DOGOBJ:
      sound = DOGDEATHSND;
      break;
    // Boss death shouts (WL_ACT2.C A_DeathScream) — non-random, so determinism is unaffected.
    case BOSSOBJ:
      sound = MUTTISND;
      break;
    case SCHABBOBJ:
      sound = MEINGOTTSND;
      break;
    case FAKEOBJ:
      sound = HITLERHASND;
      break;
    case MECHAHITLEROBJ:
      sound = SCHEISTSND;
      break;
    case REALHITLEROBJ:
      sound = EVASND;
      break;
    case GRETELOBJ:
      sound = MEINSND;
      break;
    case GIFTOBJ:
      sound = DONNERSND;
      break;
    case FATOBJ:
      sound = ROSESND;
      break;
    default:
      sound = 0;
      break;
  }

  if (sound) {
    SD_PlaySound(sound);
  }
  return { sound, positioned: true, actor };
}

export function A_HitlerMorphMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
): HitlerMorphSummary {
  const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const { actor: morphed } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, "_s_hitlerchase1");
  const difficulty = dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate"));
  const hitpoints = HITLER_MORPH_HITPOINTS[difficulty];
  if (hitpoints === undefined) {
    throw new RangeError(`Invalid gamestate.difficulty ${difficulty}`);
  }

  dgroup.setU32(morphed + OBJ_SPEED_OFFSET, SPDPATROL * 5);
  dgroup.setU32(morphed + OBJ_X_OFFSET, dgroup.u32(actor + OBJ_X_OFFSET));
  dgroup.setU32(morphed + OBJ_Y_OFFSET, dgroup.u32(actor + OBJ_Y_OFFSET));
  dgroup.setU32(morphed + OBJ_DISTANCE_OFFSET, dgroup.u32(actor + OBJ_DISTANCE_OFFSET));
  dgroup.setU16(morphed + OBJ_DIR_OFFSET, dgroup.u16(actor + OBJ_DIR_OFFSET));
  dgroup.setU8(morphed + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) | FL_SHOOTABLE);
  dgroup.setU16(morphed + OBJ_CLASS_OFFSET, REALHITLEROBJ);
  dgroup.setU16(morphed + OBJ_HITPOINTS_OFFSET, hitpoints);

  return { source: actor, actor: morphed, state: "_s_hitlerchase1", hitpoints, speed: SPDPATROL * 5 };
}

export function T_BJYellMemory(dgroup: DOSMemory, actor: number): ActorSoundSummary {
  void dgroup;
  return { sound: YEAHSND, positioned: true, actor };
}

export function ProjectileTryMoveMemory(
  dgroup: DOSMemory,
  actorOrPlane0: number | Uint16Array,
  maybeActor?: number,
): boolean {
  const actor = typeof actorOrPlane0 === "number" ? actorOrPlane0 : maybeActor;
  if (typeof actor !== "number") {
    throw new TypeError("ProjectileTryMoveMemory expected an actor pointer");
  }
  const xl = (dgroup.i32(actor + OBJ_X_OFFSET) - PROJSIZE) >> TILESHIFT;
  const yl = (dgroup.i32(actor + OBJ_Y_OFFSET) - PROJSIZE) >> TILESHIFT;
  const xh = (dgroup.i32(actor + OBJ_X_OFFSET) + PROJSIZE) >> TILESHIFT;
  const yh = (dgroup.i32(actor + OBJ_Y_OFFSET) + PROJSIZE) >> TILESHIFT;
  const objlist = nearOffsetForRuntimeSymbol("_objlist");

  for (let y = yl; y <= yh; y++) {
    for (let x = xl; x <= xh; x++) {
      requireMapCell(x, y);
      const check = actoratAt(dgroup, x, y);
      if (check && check < objlist) {
        return false;
      }
    }
  }

  return true;
}

export function T_ProjectileMemory(
  dgroup: DOSMemory,
  actorOrPlane0: number | Uint16Array,
  maybeActorOrOptions: number | { readonly tics?: number } = {},
  maybeOptions: { readonly tics?: number } = {},
): ProjectileStepSummary {
  const actor = typeof actorOrPlane0 === "number" ? actorOrPlane0 : maybeActorOrOptions;
  if (typeof actor !== "number") {
    throw new TypeError("T_ProjectileMemory expected an actor pointer");
  }
  const options =
    typeof actorOrPlane0 === "number"
      ? (maybeActorOrOptions as { readonly tics?: number })
      : maybeOptions;
  const tics = options.tics ?? 1;
  const speed = i32(dgroup.u32(actor + OBJ_SPEED_OFFSET) * tics);
  const angle = normalizeAngle(dgroup.u16(actor + OBJ_ANGLE_OFFSET));
  let deltax = FixedByFracMemory(speed, costableAt(angle));
  let deltay = -FixedByFracMemory(speed, sintableAt(angle));

  if (deltax > TILEGLOBAL) {
    deltax = TILEGLOBAL;
  }
  if (deltay > TILEGLOBAL) {
    deltay = TILEGLOBAL;
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, dgroup.i32(actor + OBJ_X_OFFSET) + deltax);
  dgroup.setU32(actor + OBJ_Y_OFFSET, dgroup.i32(actor + OBJ_Y_OFFSET) + deltay);

  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const playerDeltaX = Math.abs(dgroup.i32(actor + OBJ_X_OFFSET) - dgroup.i32(player + OBJ_X_OFFSET));
  const playerDeltaY = Math.abs(dgroup.i32(actor + OBJ_Y_OFFSET) - dgroup.i32(player + OBJ_Y_OFFSET));
  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);

  if (!ProjectileTryMoveMemory(dgroup, actor)) {
    if (obclass === ROCKETOBJ) {
      dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset("_s_boom1"));
    } else {
      dgroup.setU16(actor + OBJ_STATE_OFFSET, 0);
    }
    return projectileSummary(dgroup, actor, false, true, false, 0);
  }

  if (playerDeltaX < PROJECTILESIZE && playerDeltaY < PROJECTILESIZE) {
    const damage = projectileDamageForClass(obclass);
    TakeDamageMemory(dgroup, actor, damage);
    dgroup.setU16(actor + OBJ_STATE_OFFSET, 0);
    return projectileSummary(dgroup, actor, true, false, true, damage);
  }

  dgroup.setU16(actor + OBJ_TILEX_OFFSET, dgroup.i32(actor + OBJ_X_OFFSET) >> TILESHIFT);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, dgroup.i32(actor + OBJ_Y_OFFSET) >> TILESHIFT);
  return projectileSummary(dgroup, actor, true, false, false, 0);
}

export function T_SchabbThrowMemory(dgroup: DOSMemory, actor: number): ProjectileSpawnSummary {
  return spawnBossProjectile(dgroup, actor, {
    state: "_s_needle1",
    obclass: NEEDLEOBJ,
    speed: 0x2000,
    flags: FL_NONMARK,
  });
}

export function T_GiftThrowMemory(dgroup: DOSMemory, actor: number): ProjectileSpawnSummary {
  return spawnBossProjectile(dgroup, actor, {
    state: "_s_rocket",
    obclass: ROCKETOBJ,
    speed: 0x2000,
    flags: FL_NONMARK,
  });
}

export function T_FakeFireMemory(dgroup: DOSMemory, actor: number): ProjectileSpawnSummary {
  return spawnBossProjectile(dgroup, actor, {
    state: "_s_fire1",
    obclass: FIREOBJ,
    speed: 0x1200,
    flags: FL_NEVERMARK,
  });
}

export function OpenDoorMemory(dgroup: DOSMemory, door: number): void {
  if (!Number.isInteger(door) || door < 0 || door >= MAXDOORS) {
    throw new RangeError(`OpenDoor: invalid door ${door}`);
  }
  const doorobj = nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
  if (dgroup.u16(doorobj + DOOR_ACTION_OFFSET) === DR_OPEN) {
    dgroup.setU16(doorobj + DOOR_TICCOUNT_OFFSET, 0);
  } else {
    dgroup.setU16(doorobj + DOOR_ACTION_OFFSET, DR_OPENING);
  }
}

export function TryWalkMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
): TryWalkSummary {
  requireMapPlane(plane0);
  let doornum = -1;
  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);
  const dir = dgroup.u16(actor + OBJ_DIR_OFFSET);
  let tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
  let tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);

  const CHECKDIAG = (x: number, y: number): boolean => {
    const temp = actoratAt(dgroup, x, y);
    if (temp) {
      if (temp < 256) {
        return false;
      }
      if (dgroup.u8(temp + OBJ_FLAGS_OFFSET) & FL_SHOOTABLE) {
        return false;
      }
    }
    return true;
  };

  const CHECKSIDE = (x: number, y: number): boolean => {
    const temp = actoratAt(dgroup, x, y);
    if (temp) {
      if (temp < 128) {
        return false;
      }
      if (temp < 256) {
        doornum = temp & 63;
      } else if (dgroup.u8(temp + OBJ_FLAGS_OFFSET) & FL_SHOOTABLE) {
        return false;
      }
    }
    return true;
  };

  const moveTo = (x: number, y: number): void => {
    tilex = x;
    tiley = y;
  };

  if (obclass === INERTOBJ) {
    moveTo(...directionDestination(tilex, tiley, dir));
  } else {
    switch (dir) {
      case DIR_NORTH:
        if (obclass === DOGOBJ || obclass === FAKEOBJ) {
          if (!CHECKDIAG(tilex, tiley - 1)) return { moved: false, door: null };
        } else if (!CHECKSIDE(tilex, tiley - 1)) return { moved: false, door: null };
        moveTo(tilex, tiley - 1);
        break;
      case NORTHEAST:
        if (!CHECKDIAG(tilex + 1, tiley - 1)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex + 1, tiley)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex, tiley - 1)) return { moved: false, door: null };
        moveTo(tilex + 1, tiley - 1);
        break;
      case EAST:
        if (obclass === DOGOBJ || obclass === FAKEOBJ) {
          if (!CHECKDIAG(tilex + 1, tiley)) return { moved: false, door: null };
        } else if (!CHECKSIDE(tilex + 1, tiley)) return { moved: false, door: null };
        moveTo(tilex + 1, tiley);
        break;
      case SOUTHEAST:
        if (!CHECKDIAG(tilex + 1, tiley + 1)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex + 1, tiley)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex, tiley + 1)) return { moved: false, door: null };
        moveTo(tilex + 1, tiley + 1);
        break;
      case SOUTH:
        if (obclass === DOGOBJ || obclass === FAKEOBJ) {
          if (!CHECKDIAG(tilex, tiley + 1)) return { moved: false, door: null };
        } else if (!CHECKSIDE(tilex, tiley + 1)) return { moved: false, door: null };
        moveTo(tilex, tiley + 1);
        break;
      case SOUTHWEST:
        if (!CHECKDIAG(tilex - 1, tiley + 1)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex - 1, tiley)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex, tiley + 1)) return { moved: false, door: null };
        moveTo(tilex - 1, tiley + 1);
        break;
      case WEST:
        if (obclass === DOGOBJ || obclass === FAKEOBJ) {
          if (!CHECKDIAG(tilex - 1, tiley)) return { moved: false, door: null };
        } else if (!CHECKSIDE(tilex - 1, tiley)) return { moved: false, door: null };
        moveTo(tilex - 1, tiley);
        break;
      case NORTHWEST:
        if (!CHECKDIAG(tilex - 1, tiley - 1)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex - 1, tiley)) return { moved: false, door: null };
        if (!CHECKDIAG(tilex, tiley - 1)) return { moved: false, door: null };
        moveTo(tilex - 1, tiley - 1);
        break;
      case NODIR:
        return { moved: false, door: null };
      default:
        throw new Error("Walk: Bad dir");
    }
  }

  dgroup.setU16(actor + OBJ_TILEX_OFFSET, tilex);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, tiley);

  if (doornum !== -1) {
    OpenDoorMemory(dgroup, doornum);
    dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, -doornum - 1);
    return { moved: true, door: doornum };
  }

  dgroup.setU8(actor + OBJ_AREANUMBER_OFFSET, plane0[tiley * MAPSIZE + tilex] - AREATILE);
  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  return { moved: true, door: null };
}

export function MoveObjMemory(
  dgroup: DOSMemory,
  actor: number,
  move: number,
  options: { readonly tics?: number } = {},
): void {
  const dir = dgroup.u16(actor + OBJ_DIR_OFFSET);
  const [dx, dy] = directionDelta(dir);
  if (dir === NODIR) {
    return;
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, dgroup.i32(actor + OBJ_X_OFFSET) + dx * move);
  dgroup.setU32(actor + OBJ_Y_OFFSET, dgroup.i32(actor + OBJ_Y_OFFSET) + dy * move);

  const area = dgroup.u8(actor + OBJ_AREANUMBER_OFFSET);
  const areabyplayer = nearOffsetForRuntimeSymbol("_areabyplayer");
  if (area < NUMAREAS && dgroup.u16(areabyplayer + area * 2)) {
    const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
    const deltax = dgroup.i32(actor + OBJ_X_OFFSET) - dgroup.i32(player + OBJ_X_OFFSET);
    const deltay = dgroup.i32(actor + OBJ_Y_OFFSET) - dgroup.i32(player + OBJ_Y_OFFSET);
    if (
      deltax >= -MINACTORDIST &&
      deltax <= MINACTORDIST &&
      deltay >= -MINACTORDIST &&
      deltay <= MINACTORDIST
    ) {
      const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);
      if (obclass === GHOSTOBJ || obclass === SPECTREOBJ) {
        const tics = options.tics ?? dgroup.u16(nearOffsetForRuntimeSymbol("_tics"));
        TakeDamageMemory(dgroup, actor, tics * 2);
      }
      dgroup.setU32(actor + OBJ_X_OFFSET, dgroup.i32(actor + OBJ_X_OFFSET) - dx * move);
      dgroup.setU32(actor + OBJ_Y_OFFSET, dgroup.i32(actor + OBJ_Y_OFFSET) - dy * move);
      return;
    }
  }

  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, dgroup.i32(actor + OBJ_DISTANCE_OFFSET) - move);
}

export function SelectPathDirMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
): void {
  requireMapPlane(plane1);
  const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const spot = (plane1[tiley * MAPSIZE + tilex] - ICONARROWS) & 0xffff;
  if (spot < 8) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, spot);
  }

  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  if (!TryWalkMemory(dgroup, plane0, actor).moved) {
    dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
  }
}

export function T_PathMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions = {},
): PathStepSummary {
  const sightedPlayer =
    typeof options.sightPlayer === "function"
      ? options.sightPlayer(actor, dgroup)
      : typeof options.sightPlayer === "boolean"
        ? options.sightPlayer
        : SightPlayerMemory(dgroup, actor, options);
  if (sightedPlayer) {
    return { actor, moved: false, blocked: false, waitingForDoor: null, sightedPlayer };
  }

  if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
    SelectPathDirMemory(dgroup, plane0, plane1, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return { actor, moved: false, blocked: true, waitingForDoor: null, sightedPlayer };
    }
  }

  let moved = false;
  let move = dgroup.u32(actor + OBJ_SPEED_OFFSET) * (options.tics ?? 1);
  while (move) {
    let distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (distance < 0) {
      const door = -distance - 1;
      OpenDoorMemory(dgroup, door);
      const doorobj = nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
      if (dgroup.u16(doorobj + DOOR_ACTION_OFFSET) !== DR_OPEN) {
        return { actor, moved, blocked: false, waitingForDoor: door, sightedPlayer };
      }
      distance = TILEGLOBAL;
      dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, distance);
    }

    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, { tics: options.tics });
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    if (tilex > MAPSIZE || tiley > MAPSIZE) {
      throw new Error(`T_Path hit a wall at ${tilex},${tiley}, dir ${dgroup.u16(actor + OBJ_DIR_OFFSET)}`);
    }

    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    moved = true;

    SelectPathDirMemory(dgroup, plane0, plane1, actor);
    if (dgroup.u16(actor + OBJ_DIR_OFFSET) === NODIR) {
      return { actor, moved, blocked: true, waitingForDoor: null, sightedPlayer };
    }
  }

  return { actor, moved, blocked: false, waitingForDoor: null, sightedPlayer };
}

export function SpawnBJVictoryMemory(dgroup: DOSMemory, plane0: Uint16Array): BJVictorySpawnSummary {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const tilex = dgroup.u16(player + OBJ_TILEX_OFFSET);
  const tiley = dgroup.u16(player + OBJ_TILEY_OFFSET) + 1;
  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, "_s_bjrun1");
  dgroup.setU32(actor + OBJ_X_OFFSET, dgroup.u32(player + OBJ_X_OFFSET));
  dgroup.setU32(actor + OBJ_Y_OFFSET, dgroup.u32(player + OBJ_Y_OFFSET));
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, BJOBJ);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, DIR_NORTH);
  dgroup.setU16(actor + OBJ_TEMP1_OFFSET, 6);
  return { actor, state: "_s_bjrun1", tilex, tiley, temp1: dgroup.u16(actor + OBJ_TEMP1_OFFSET) };
}

export function T_BJRunMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: { readonly tics?: number } = {},
): BJRunSummary {
  let move = BJRUNSPEED * (options.tics ?? 1);
  let moved = false;
  let jumped = false;

  while (move) {
    const distance = dgroup.i32(actor + OBJ_DISTANCE_OFFSET);
    if (move < distance) {
      MoveObjMemory(dgroup, actor, move, options);
      moved = true;
      break;
    }

    const tilex = dgroup.u16(actor + OBJ_TILEX_OFFSET);
    const tiley = dgroup.u16(actor + OBJ_TILEY_OFFSET);
    dgroup.setU32(actor + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
    move -= distance;
    SelectPathDirMemory(dgroup, plane0, plane1, actor);

    const temp1 = dgroup.u16(actor + OBJ_TEMP1_OFFSET) - 1;
    dgroup.setU16(actor + OBJ_TEMP1_OFFSET, temp1);
    if (!temp1) {
      NewStateMemory(dgroup, actor, "_s_bjjump1");
      jumped = true;
      return bjRunSummary(dgroup, actor, moved, jumped);
    }
  }

  return bjRunSummary(dgroup, actor, moved, jumped);
}

export function T_BJJumpMemory(
  dgroup: DOSMemory,
  actor: number,
  options: { readonly tics?: number } = {},
): BJJumpSummary {
  const move = BJJUMPSPEED * (options.tics ?? 1);
  MoveObjMemory(dgroup, actor, move, options);
  return {
    actor,
    move,
    distance: dgroup.i32(actor + OBJ_DISTANCE_OFFSET),
    x: dgroup.i32(actor + OBJ_X_OFFSET),
    y: dgroup.i32(actor + OBJ_Y_OFFSET),
  };
}

export function T_BJDoneMemory(dgroup: DOSMemory): BJDoneSummary {
  dgroup.setU16(nearOffsetForRuntimeSymbol("_playstate"), EX_VICTORIOUS);
  return { playstate: dgroup.u16(nearOffsetForRuntimeSymbol("_playstate")) };
}

export function DoActorMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions = {},
): ActorStepSummary {
  const area = dgroup.u8(actor + OBJ_AREANUMBER_OFFSET);
  const areabyplayer = nearOffsetForRuntimeSymbol("_areabyplayer");
  if (!dgroup.u16(actor + OBJ_ACTIVE_OFFSET) && !dgroup.u16(areabyplayer + area * 2)) {
    return {
      actor,
      active: false,
      state: stateNameForActor(dgroup, actor),
      ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
      thinkCalls: 0,
      removed: false,
    };
  }

  const flags = dgroup.u8(actor + OBJ_FLAGS_OFFSET);
  if (!(flags & (FL_NONMARK | FL_NEVERMARK))) {
    dgroup.setU16(
      actoratCellOffset(
        nearOffsetForRuntimeSymbol("_actorat"),
        dgroup.u16(actor + OBJ_TILEX_OFFSET),
        dgroup.u16(actor + OBJ_TILEY_OFFSET),
      ),
      0,
    );
  }

  let thinkCalls = 0;
  let removed = false;
  const thinkResults: DispatchedThinkSummary[] = [];
  const actions: DispatchedActionSummary[] = [];
  const thinkResultSummaries = (): readonly DispatchedThinkSummary[] | undefined =>
    thinkResults.length ? thinkResults : undefined;
  const actionResults = (): readonly DispatchedActionSummary[] | undefined =>
    actions.length ? actions : undefined;

  if (!dgroup.u16(actor + OBJ_TICCOUNT_OFFSET)) {
    const state = stateDefinitionForActor(dgroup, actor);
    if (state?.think) {
      const think = dispatchThink(state.think, dgroup, plane0, plane1, actor, options);
      if (think) {
        thinkResults.push(think);
      }
      thinkCalls++;
      if (!dgroup.u16(actor + OBJ_STATE_OFFSET)) {
        removed = true;
        RemoveObjMemory(dgroup, actor);
        return {
          actor,
          active: true,
          state: stateNameForActor(dgroup, actor),
          ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
          thinkCalls,
          removed,
          thinkResults: thinkResultSummaries(),
        };
      }
    }
    markActorIfNeeded(dgroup, actor);
    return {
      actor,
      active: true,
      state: stateNameForActor(dgroup, actor),
      ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
      thinkCalls,
      removed,
      thinkResults: thinkResultSummaries(),
    };
  }

  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, dgroup.u16(actor + OBJ_TICCOUNT_OFFSET) - (options.tics ?? 1));
  while (dgroup.i16(actor + OBJ_TICCOUNT_OFFSET) <= 0) {
    const state = stateDefinitionForActor(dgroup, actor);
    if (!state) {
      break;
    }
    if (state.action) {
      const action = dispatchAction(state.action, dgroup, plane0, actor, options);
      if (action) {
        actions.push(action);
      }
      if (!dgroup.u16(actor + OBJ_STATE_OFFSET)) {
        removed = true;
        RemoveObjMemory(dgroup, actor);
        return {
          actor,
          active: true,
          state: stateNameForActor(dgroup, actor),
          ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
          thinkCalls,
          removed,
          thinkResults: thinkResultSummaries(),
          actions: actionResults(),
        };
      }
    }

    const actionState = stateDefinitionForActor(dgroup, actor);
    if (!actionState?.next) {
      dgroup.setU16(actor + OBJ_STATE_OFFSET, 0);
      removed = true;
      RemoveObjMemory(dgroup, actor);
      return {
        actor,
        active: true,
        state: stateNameForActor(dgroup, actor),
        ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
        thinkCalls,
        removed,
        thinkResults: thinkResultSummaries(),
        actions: actionResults(),
      };
    }

    const next = stateDefinitionForName(actionState.next);
    dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset(next.name));
    if (!next.tictime) {
      dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, 0);
      break;
    }
    dgroup.setU16(
      actor + OBJ_TICCOUNT_OFFSET,
      dgroup.i16(actor + OBJ_TICCOUNT_OFFSET) + next.tictime,
    );
  }

  if (!removed) {
    const state = stateDefinitionForActor(dgroup, actor);
    if (state?.think) {
      const think = dispatchThink(state.think, dgroup, plane0, plane1, actor, options);
      if (think) {
        thinkResults.push(think);
      }
      thinkCalls++;
      if (!dgroup.u16(actor + OBJ_STATE_OFFSET)) {
        removed = true;
        RemoveObjMemory(dgroup, actor);
        return {
          actor,
          active: true,
          state: stateNameForActor(dgroup, actor),
          ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
          thinkCalls,
          removed,
          thinkResults: thinkResultSummaries(),
          actions: actionResults(),
        };
      }
    }
  }

  markActorIfNeeded(dgroup, actor);
  return {
    actor,
    active: true,
    state: stateNameForActor(dgroup, actor),
    ticcount: dgroup.u16(actor + OBJ_TICCOUNT_OFFSET),
    thinkCalls,
    removed,
    thinkResults: thinkResultSummaries(),
    actions: actionResults(),
  };
}

export function SpawnStandMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  which: number,
  tilex: number,
  tiley: number,
  dir: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  let state: string;
  switch (which) {
    case en_guard:
      state = "_s_grdstand";
      break;
    case en_officer:
      state = "_s_ofcstand";
      break;
    case en_mutant:
      state = "_s_mutstand";
      break;
    case en_ss:
      state = "_s_ssstand";
      break;
    default:
      throw new Error(`SpawnStand: unsupported enemy_t ${which}`);
  }

  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, state);
  dgroup.setU32(actor + OBJ_SPEED_OFFSET, SPDPATROL);
  incrementKillTotal(dgroup, options);
  applyStandAmbush(dgroup, plane0, actor, tilex, tiley);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ + which);
  dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, enemyHitpoints(dgroup, which, options));
  dgroup.setU16(actor + OBJ_DIR_OFFSET, dir * 2);
  orObjFlags(dgroup, actor, FL_SHOOTABLE);
  return { actor, which, tilex, tiley, state };
}

export function SpawnDeadGuardMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
): EnemySpawnSummary {
  const state = "_s_grddie4";
  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, state);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, INERTOBJ);
  return { actor, which: en_guard, tilex, tiley, state };
}

export function SpawnPatrolMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  which: number,
  tilex: number,
  tiley: number,
  dir: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  let state: string;
  let speed = SPDPATROL;
  switch (which) {
    case en_guard:
      state = "_s_grdpath1";
      break;
    case en_officer:
      state = "_s_ofcpath1";
      break;
    case en_ss:
      state = "_s_sspath1";
      break;
    case en_mutant:
      state = "_s_mutpath1";
      break;
    case en_dog:
      state = "_s_dogpath1";
      speed = SPDDOG;
      break;
    default:
      throw new Error(`SpawnPatrol: unsupported enemy_t ${which}`);
  }

  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, state);
  dgroup.setU32(actor + OBJ_SPEED_OFFSET, speed);
  incrementKillTotal(dgroup, options);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ + which);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, dir * 2);
  dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, enemyHitpoints(dgroup, which, options));
  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  orObjFlags(dgroup, actor, FL_SHOOTABLE);
  dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);

  const actorat = nearOffsetForRuntimeSymbol("_actorat");
  dgroup.setU16(actoratCellOffset(actorat, tilex, tiley), 0);
  const moved = patrolDestination(tilex, tiley, dir);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, moved.tilex);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, moved.tiley);
  dgroup.setU16(actoratCellOffset(actorat, moved.tilex, moved.tiley), actor);

  return { actor, which, tilex: moved.tilex, tiley: moved.tiley, state };
}

export function SpawnGhostsMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  which: number,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  let state: string;
  switch (which) {
    case en_blinky:
      state = "_s_blinkychase1";
      break;
    case en_clyde:
      state = "_s_clydechase1";
      break;
    case en_pinky:
      state = "_s_pinkychase1";
      break;
    case en_inky:
      state = "_s_inkychase1";
      break;
    default:
      throw new Error(`SpawnGhosts: unsupported enemy_t ${which}`);
  }

  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, state);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GHOSTOBJ);
  dgroup.setU32(actor + OBJ_SPEED_OFFSET, SPDDOG);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, EAST);
  orObjFlags(dgroup, actor, FL_AMBUSH);
  incrementKillTotal(dgroup, options);
  return { actor, which, tilex, tiley, state };
}

export function SpawnBossMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_boss,
    state: "_s_bossstand",
    obclass: BOSSOBJ,
    dir: SOUTH,
    options,
  });
}

export function SpawnGretelMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_gretel,
    state: "_s_gretelstand",
    obclass: GRETELOBJ,
    dir: DIR_NORTH,
    options,
  });
}

export function SpawnSchabbsMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_schabbs,
    state: "_s_schabbstand",
    obclass: SCHABBOBJ,
    dir: SOUTH,
    options,
  });
}

export function SpawnGiftMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_gift,
    state: "_s_giftstand",
    obclass: GIFTOBJ,
    dir: DIR_NORTH,
    options,
  });
}

export function SpawnFatMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_fat,
    state: "_s_fatstand",
    obclass: FATOBJ,
    dir: SOUTH,
    options,
  });
}

export function SpawnFakeHitlerMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_fake,
    state: "_s_fakestand",
    obclass: FAKEOBJ,
    dir: DIR_NORTH,
    options,
  });
}

export function SpawnHitlerMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  options: EnemySpawnOptions = {},
): EnemySpawnSummary {
  return spawnBossLike(dgroup, plane0, tilex, tiley, {
    which: en_hitler,
    state: "_s_mechastand",
    obclass: MECHAHITLEROBJ,
    dir: SOUTH,
    options,
  });
}

export function scanEnemyPlaneMemory(
  plane1: Uint16Array,
  plane0: Uint16Array,
  dgroup: DOSMemory,
  options: EnemySpawnOptions = {},
): EnemyScanSummary {
  requireMapPlane(plane1);
  requireMapPlane(plane0);
  let enemies = 0;

  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const tile = plane1[y * MAPSIZE + x];
      if (spawnEnemyTile(dgroup, plane0, tile, x, y, options)) {
        enemies++;
      }
    }
  }

  return {
    enemies,
    killtotal: dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_KILLTOTAL_OFFSET),
    actors: dgroup.u16(nearOffsetForRuntimeSymbol("_objcount")),
  };
}

export function InitStaticListMemory(dgroup: DOSMemory): StaticListSummary {
  const statobjlist = nearOffsetForRuntimeSymbol("_statobjlist");
  dgroup.setU16(nearOffsetForRuntimeSymbol("_laststatobj"), statobjlist);
  return { laststatobj: statobjlist, capacity: MAXSTATS };
}

export function InitDoorListMemory(
  dgroup: DOSMemory,
  areaconnect?: DOSByteSource,
): DoorListSummary {
  dgroup.view(nearOffsetForRuntimeSymbol("_areabyplayer"), NUMAREAS * 2).fill(0);
  const areaconnectCleared = areaconnect !== undefined;
  if (areaconnect) {
    const offset = nearOffsetForRuntimeSymbol("_areaconnect");
    bytesOf(areaconnect).fill(0, offset, offset + NUMAREAS * NUMAREAS);
  }

  const doorobjlist = nearOffsetForRuntimeSymbol("_doorobjlist");
  dgroup.setU16(nearOffsetForRuntimeSymbol("_lastdoorobj"), doorobjlist);
  dgroup.setU16(nearOffsetForRuntimeSymbol("_doornum"), 0);
  return { lastdoorobj: doorobjlist, doornum: 0, areaconnectCleared };
}

export function SpawnDoorMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  vertical: boolean,
  lock: number,
): DoorSpawnSummary {
  requireMapPlane(plane0);
  requireMapCell(tilex, tiley);
  const doornumPointer = nearOffsetForRuntimeSymbol("_doornum");
  const doornum = dgroup.u16(doornumPointer);
  if (doornum === MAXDOORS) {
    throw new Error("64+ doors on level!");
  }

  const doorposition = nearOffsetForRuntimeSymbol("_doorposition");
  const lastdoorobjPointer = nearOffsetForRuntimeSymbol("_lastdoorobj");
  const door = dgroup.u16(lastdoorobjPointer);
  dgroup.setU16(doorposition + doornum * 2, 0);
  dgroup.setU8(door + DOOR_TILEX_OFFSET, tilex);
  dgroup.setU8(door + DOOR_TILEY_OFFSET, tiley);
  dgroup.setU16(door + DOOR_VERTICAL_OFFSET, vertical ? 1 : 0);
  dgroup.setU8(door + DOOR_LOCK_OFFSET, lock);
  dgroup.setU16(door + DOOR_ACTION_OFFSET, DR_CLOSED);

  const tileValue = doornum | 0x80;
  const tilemap = nearOffsetForRuntimeSymbol("_tilemap");
  const actorat = nearOffsetForRuntimeSymbol("_actorat");
  dgroup.setU16(actoratCellOffset(actorat, tilex, tiley), tileValue);
  dgroup.setU8(tilemapCellOffset(tilemap, tilex, tiley), tileValue);

  const mapIndex = tiley * MAPSIZE + tilex;
  if (vertical) {
    plane0[mapIndex] = plane0[mapIndex - 1];
    orTilemapCell(dgroup, tilemap, tilex, tiley - 1, 0x40);
    orTilemapCell(dgroup, tilemap, tilex, tiley + 1, 0x40);
  } else {
    plane0[mapIndex] = plane0[mapIndex - MAPSIZE];
    orTilemapCell(dgroup, tilemap, tilex - 1, tiley, 0x40);
    orTilemapCell(dgroup, tilemap, tilex + 1, tiley, 0x40);
  }

  dgroup.setU16(doornumPointer, doornum + 1);
  dgroup.setU16(lastdoorobjPointer, door + STRUCT_LAYOUTS.doorobj_t.bytes);
  return { door, doorIndex: doornum, tilex, tiley, vertical, lock };
}

export function spawnDoorsFromWallPlane(plane0: Uint16Array, dgroup: DOSMemory): DoorScanSummary {
  requireMapPlane(plane0);
  let doors = 0;
  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const tile = plane0[y * MAPSIZE + x];
      if (tile < 90 || tile > 101) {
        continue;
      }
      if ((tile & 1) === 0) {
        SpawnDoorMemory(dgroup, plane0, x, y, true, (tile - 90) / 2);
      } else {
        SpawnDoorMemory(dgroup, plane0, x, y, false, (tile - 91) / 2);
      }
      doors++;
    }
  }
  return { doors };
}

export function SpawnStaticMemory(
  dgroup: DOSMemory,
  tilex: number,
  tiley: number,
  type: number,
  options: StaticSpawnOptions = {},
): StaticSpawnSummary {
  requireMapCell(tilex, tiley);
  const statinfo = STATINFO_WL6[type];
  if (!statinfo) {
    throw new Error(`SpawnStatic: unknown WL6 static type ${type}`);
  }

  const picnum = statinfo[0];
  const itemType = statinfo[1] as number;
  const laststatobjPointer = nearOffsetForRuntimeSymbol("_laststatobj");
  const statobj = dgroup.u16(laststatobjPointer);
  dgroup.setU16(statobj + STAT_SHAPENUM_OFFSET, picnum);
  dgroup.setU8(statobj + STAT_TILEX_OFFSET, tilex);
  dgroup.setU8(statobj + STAT_TILEY_OFFSET, tiley);
  dgroup.setU16(
    statobj + STAT_VISSPOT_OFFSET,
    nearOffsetForRuntimeSymbol("_spotvis") + tilex * MAPSIZE + tiley,
  );

  switch (itemType) {
    case block:
      dgroup.setU16(
        actoratCellOffset(nearOffsetForRuntimeSymbol("_actorat"), tilex, tiley),
        1,
      );
      dgroup.setU8(statobj + STAT_FLAGS_OFFSET, 0);
      break;

    case dressing:
      dgroup.setU8(statobj + STAT_FLAGS_OFFSET, 0);
      break;

    case bo_cross:
    case bo_chalice:
    case bo_bible:
    case bo_crown:
    case bo_fullheal:
      if (!options.loadedgame) {
        const treasuretotal = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_TREASURETOTAL_OFFSET;
        dgroup.setU16(treasuretotal, dgroup.u16(treasuretotal) + 1);
      }
      dgroup.setU8(statobj + STAT_FLAGS_OFFSET, FL_BONUS);
      dgroup.setU8(statobj + STAT_ITEMNUMBER_OFFSET, itemType);
      break;

    case bo_firstaid:
    case bo_key1:
    case bo_key2:
    case bo_key3:
    case bo_key4:
    case bo_clip:
    case bo_25clip:
    case bo_machinegun:
    case bo_chaingun:
    case bo_food:
    case bo_alpo:
    case bo_gibs:
    case bo_spear:
      dgroup.setU8(statobj + STAT_FLAGS_OFFSET, FL_BONUS);
      dgroup.setU8(statobj + STAT_ITEMNUMBER_OFFSET, itemType);
      break;
  }

  const next = statobj + STRUCT_LAYOUTS.statobj_t.bytes;
  dgroup.setU16(laststatobjPointer, next);
  if (next === nearOffsetForRuntimeSymbol("_statobjlist") + MAXSTATS * STRUCT_LAYOUTS.statobj_t.bytes) {
    throw new Error("Too many static objects!");
  }

  return { statobj, type, picnum, itemType };
}

export function scanStaticPlaneMemory(
  plane1: Uint16Array,
  dgroup: DOSMemory,
  options: StaticSpawnOptions = {},
): StaticScanSummary {
  requireMapPlane(plane1);
  let statics = 0;
  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const tile = plane1[y * MAPSIZE + x];
      if (tile >= 23 && tile <= 74) {
        SpawnStaticMemory(dgroup, x, y, tile - 23, options);
        statics++;
      }
    }
  }
  return { statics };
}

export function SpawnPlayerMemory(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  dir: number,
): PlayerSpawnSummary {
  requireMapPlane(plane0);
  requireMapCell(tilex, tiley);
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  let angle = (1 - dir) * 90;
  if (angle < 0) {
    angle += ANGLES;
  }

  dgroup.setU16(player + OBJ_CLASS_OFFSET, PLAYEROBJ);
  dgroup.setU16(player + OBJ_ACTIVE_OFFSET, AC_YES);
  dgroup.setU16(player + OBJ_TILEX_OFFSET, tilex);
  dgroup.setU16(player + OBJ_TILEY_OFFSET, tiley);
  dgroup.setU8(player + OBJ_AREANUMBER_OFFSET, plane0[tiley * MAPSIZE + tilex]);
  dgroup.setU32(player + OBJ_X_OFFSET, (tilex << TILESHIFT) + TILEGLOBAL / 2);
  dgroup.setU32(player + OBJ_Y_OFFSET, (tiley << TILESHIFT) + TILEGLOBAL / 2);
  dgroup.setU16(player + OBJ_STATE_OFFSET, statetypeNearOffset("_s_player"));
  dgroup.setU16(player + OBJ_ANGLE_OFFSET, angle);
  dgroup.setU8(player + OBJ_FLAGS_OFFSET, FL_NEVERMARK);

  return { player, tilex, tiley, dir, angle };
}

export function scanPlayerStartsMemory(
  plane1: Uint16Array,
  plane0: Uint16Array,
  dgroup: DOSMemory,
): PlayerStartScanSummary {
  requireMapPlane(plane1);
  requireMapPlane(plane0);
  let players = 0;
  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      const tile = plane1[y * MAPSIZE + x];
      if (tile >= 19 && tile <= 22) {
        SpawnPlayerMemory(dgroup, plane0, x, y, NORTH + tile - 19);
        ThrustMemory(dgroup, plane0, plane1, 0, 0);
        InitAreasMemory(dgroup);
        players++;
      }
    }
  }
  return { players };
}

export function scanSecretPushwallsMemory(
  plane1: Uint16Array,
  dgroup: DOSMemory,
  options: StaticSpawnOptions = {},
): SecretPushwallScanSummary {
  requireMapPlane(plane1);
  let secretPushwalls = 0;
  for (let y = 0; y < MAPSIZE; y++) {
    for (let x = 0; x < MAPSIZE; x++) {
      if (plane1[y * MAPSIZE + x] !== 98) {
        continue;
      }
      secretPushwalls++;
      if (!options.loadedgame) {
        const secrettotal = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_SECRETTOTAL_OFFSET;
        dgroup.setU16(secrettotal, dgroup.u16(secrettotal) + 1);
      }
    }
  }
  return { secretPushwalls };
}

export function levelTilemapCell(dgroup: DOSMemory, x: number, y: number): number {
  return dgroup.u8(tilemapCellOffset(nearOffsetForSymbol("_tilemap"), x, y));
}

export function levelActoratCell(dgroup: DOSMemory, x: number, y: number): number {
  return readU16LE(dgroup.bytes, actoratCellOffset(nearOffsetForSymbol("_actorat"), x, y));
}

function tilemapCellOffset(tilemap: number, x: number, y: number): number {
  requireMapCell(x, y);
  return tilemap + x * MAPSIZE + y;
}

function actoratCellOffset(actorat: number, x: number, y: number): number {
  requireMapCell(x, y);
  return actorat + (x * MAPSIZE + y) * 2;
}

function orTilemapCell(dgroup: DOSMemory, tilemap: number, x: number, y: number, value: number): void {
  const offset = tilemapCellOffset(tilemap, x, y);
  dgroup.setU8(offset, dgroup.u8(offset) | value);
}

function initialStateTicTime(state: string): number {
  const tictime = INITIAL_STATE_TICTIME[state] ?? STATE_DEFINITIONS[state]?.tictime;
  if (tictime === undefined) {
    throw new Error(`Missing initial statetype tictime for ${state}`);
  }
  return tictime;
}

function buildStateDefinitions(): Readonly<Record<string, StateDefinition>> {
  const states: Record<string, StateDefinition> = {};
  // The looping final die-state of the four death-cam bosses (WL_ACT2.C: s_schabbdie6/s_giftdie6/
  // s_fatdie6/s_hitlerdie10 all run A_StartDeathCam) — killing them ends the episode (ex_victorious).
  const deathCamStates = new Set([
    "_s_schabbdie6",
    "_s_giftdie6",
    "_s_fatdie6",
    "_s_hitlerdie10",
  ]);
  const deathScreamStates = new Set([
    "_s_grddie1",
    "_s_dogdie1",
    "_s_ofcdie1",
    "_s_mutdie1",
    "_s_ssdie1",
    "_s_bossdie1",
    "_s_greteldie1",
    "_s_schabbdie1",
    "_s_giftdie1",
    "_s_fatdie1",
    "_s_fakedie1",
    "_s_mechadie1",
    "_s_hitlerdie1",
  ]);
  states._s_player = {
    name: "_s_player",
    tictime: 0,
    think: "T_Player",
    action: null,
    next: null,
  };
  states._s_attack = {
    name: "_s_attack",
    tictime: 0,
    think: "T_Attack",
    action: null,
    next: null,
  };
  for (const name of STAND_STATE_NAMES) {
    states[name] = {
      name,
      tictime: 0,
      think: "T_Stand",
      action: null,
      next: name,
    };
  }
  for (const group of PATH_STATE_GROUPS) {
    for (const [suffix, tictime, think, nextSuffix] of PATH_STATE_STEPS) {
      const name = `_s_${group}${suffix}`;
      states[name] = {
        name,
        tictime,
        think,
        action: null,
        next: nextSuffix ? `_s_${group}${nextSuffix}` : null,
      };
    }
  }
  for (const [group, ...tictimes] of CHASE_STATE_GROUPS) {
    for (let i = 0; i < CHASE_STATE_SUFFIXES.length; i++) {
      const name = `_s_${group}${CHASE_STATE_SUFFIXES[i]}`;
      states[name] = {
        name,
        tictime: tictimes[i],
        think: CHASE_STATE_THINKS[i],
        action: null,
        next: `_s_${group}${CHASE_STATE_NEXT_SUFFIXES[i]}`,
      };
    }
  }
  const [dogGroup, ...dogTictimes] = DOG_CHASE_STATE_GROUP;
  for (let i = 0; i < CHASE_STATE_SUFFIXES.length; i++) {
    const name = `_s_${dogGroup}${CHASE_STATE_SUFFIXES[i]}`;
    states[name] = {
      name,
      tictime: dogTictimes[i],
      think: i === 1 || i === 4 ? null : "T_DogChase",
      action: null,
      next: `_s_${dogGroup}${CHASE_STATE_NEXT_SUFFIXES[i]}`,
    };
  }
  for (const group of GHOST_CHASE_STATE_GROUPS) {
    for (const suffix of ["chase1", "chase2"] as const) {
      const nextSuffix = suffix === "chase1" ? "chase2" : "chase1";
      const name = `_s_${group}${suffix}`;
      states[name] = {
        name,
        tictime: 10,
        think: "T_Ghosts",
        action: null,
        next: `_s_${group}${nextSuffix}`,
      };
    }
  }
  for (const [group, think] of BOSS_PROJECTILE_CHASE_STATE_GROUPS) {
    for (let i = 0; i < CHASE_STATE_SUFFIXES.length; i++) {
      const name = `_s_${group}${CHASE_STATE_SUFFIXES[i]}`;
      states[name] = {
        name,
        tictime: PROJECTILE_BOSS_CHASE_TICTIMES[i],
        think: CHASE_STATE_THINKS[i] ? think : null,
        action: null,
        next: `_s_${group}${CHASE_STATE_NEXT_SUFFIXES[i]}`,
      };
    }
  }
  for (const [pain, pain1, chase] of [
    ["_s_grdpain", "_s_grdpain1", "_s_grdchase1"],
    ["_s_ofcpain", "_s_ofcpain1", "_s_ofcchase1"],
    ["_s_mutpain", "_s_mutpain1", "_s_mutchase1"],
    ["_s_sspain", "_s_sspain1", "_s_sschase1"],
  ] as const) {
    states[pain] = {
      name: pain,
      tictime: 10,
      think: null,
      action: null,
      next: chase,
    };
    states[pain1] = {
      name: pain1,
      tictime: 10,
      think: null,
      action: null,
      next: chase,
    };
  }
  for (const chain of [
    [
      ["_s_grddie1", 15],
      ["_s_grddie2", 15],
      ["_s_grddie3", 15],
      ["_s_grddie4", 0],
    ],
    [
      ["_s_dogdie1", 15],
      ["_s_dogdie2", 15],
      ["_s_dogdie3", 15],
      ["_s_dogdead", 15],
    ],
    [
      ["_s_ofcdie1", 11],
      ["_s_ofcdie2", 11],
      ["_s_ofcdie3", 11],
      ["_s_ofcdie4", 11],
      ["_s_ofcdie5", 0],
    ],
    [
      ["_s_mutdie1", 7],
      ["_s_mutdie2", 7],
      ["_s_mutdie3", 7],
      ["_s_mutdie4", 7],
      ["_s_mutdie5", 0],
    ],
    [
      ["_s_ssdie1", 15],
      ["_s_ssdie2", 15],
      ["_s_ssdie3", 15],
      ["_s_ssdie4", 0],
    ],
    [
      ["_s_bossdie1", 15],
      ["_s_bossdie2", 15],
      ["_s_bossdie3", 15],
      ["_s_bossdie4", 0],
    ],
    [
      ["_s_greteldie1", 15],
      ["_s_greteldie2", 15],
      ["_s_greteldie3", 15],
      ["_s_greteldie4", 0],
    ],
    [
      ["_s_schabbdie1", 10],
      ["_s_schabbdie2", 140], // WL_ACT2.C patches die2 to 140 with digi on (else 5) so the boss death cry plays fully; the browser runs digi

      ["_s_schabbdie3", 10],
      ["_s_schabbdie4", 10],
      ["_s_schabbdie5", 10],
      ["_s_schabbdie6", 20],
    ],
    [
      ["_s_giftdie1", 1],
      ["_s_giftdie2", 140], // digi death-cry duration (WL_ACT2.C)

      ["_s_giftdie3", 10],
      ["_s_giftdie4", 10],
      ["_s_giftdie5", 10],
      ["_s_giftdie6", 20],
    ],
    [
      ["_s_fatdie1", 1],
      ["_s_fatdie2", 140], // digi death-cry duration (WL_ACT2.C)

      ["_s_fatdie3", 10],
      ["_s_fatdie4", 10],
      ["_s_fatdie5", 10],
      ["_s_fatdie6", 20],
    ],
    [
      ["_s_fakedie1", 10],
      ["_s_fakedie2", 10],
      ["_s_fakedie3", 10],
      ["_s_fakedie4", 10],
      ["_s_fakedie5", 10],
      ["_s_fakedie6", 0],
    ],
    [
      ["_s_mechadie1", 10],
      ["_s_mechadie2", 10],
      ["_s_mechadie3", 10],
      ["_s_mechadie4", 0],
    ],
    [
      ["_s_hitlerdie1", 1],
      ["_s_hitlerdie2", 140], // digi death-cry duration (WL_ACT2.C)

      ["_s_hitlerdie3", 10],
      ["_s_hitlerdie4", 10],
      ["_s_hitlerdie5", 10],
      ["_s_hitlerdie6", 10],
      ["_s_hitlerdie7", 10],
      ["_s_hitlerdie8", 10],
      ["_s_hitlerdie9", 10],
      ["_s_hitlerdie10", 20],
    ],
  ] as const) {
    for (let i = 0; i < chain.length; i++) {
      const [name, tictime] = chain[i];
      states[name] = {
        name,
        tictime,
        think: null,
        action: deathScreamStates.has(name)
          ? "A_DeathScream"
          : name === "_s_mechadie3"
            ? "A_HitlerMorph"
            : deathCamStates.has(name)
              ? "A_StartDeathCam"
              : null,
        next: i === chain.length - 1 ? name : chain[i + 1][0],
      };
    }
  }
  for (const [name, tictime, action, next] of [
    ["_s_grdshoot1", 20, null, "_s_grdshoot2"],
    ["_s_grdshoot2", 20, "T_Shoot", "_s_grdshoot3"],
    ["_s_grdshoot3", 20, null, "_s_grdchase1"],
    ["_s_dogjump1", 10, null, "_s_dogjump2"],
    ["_s_dogjump2", 10, "T_Bite", "_s_dogjump3"],
    ["_s_dogjump3", 10, null, "_s_dogjump4"],
    ["_s_dogjump4", 10, null, "_s_dogjump5"],
    ["_s_dogjump5", 10, null, "_s_dogchase1"],
    ["_s_ofcshoot1", 6, null, "_s_ofcshoot2"],
    ["_s_ofcshoot2", 20, "T_Shoot", "_s_ofcshoot3"],
    ["_s_ofcshoot3", 10, null, "_s_ofcchase1"],
    ["_s_mutshoot1", 6, "T_Shoot", "_s_mutshoot2"],
    ["_s_mutshoot2", 20, null, "_s_mutshoot3"],
    ["_s_mutshoot3", 10, "T_Shoot", "_s_mutshoot4"],
    ["_s_mutshoot4", 20, null, "_s_mutchase1"],
    ["_s_ssshoot1", 20, null, "_s_ssshoot2"],
    ["_s_ssshoot2", 20, "T_Shoot", "_s_ssshoot3"],
    ["_s_ssshoot3", 10, null, "_s_ssshoot4"],
    ["_s_ssshoot4", 10, "T_Shoot", "_s_ssshoot5"],
    ["_s_ssshoot5", 10, null, "_s_ssshoot6"],
    ["_s_ssshoot6", 10, "T_Shoot", "_s_ssshoot7"],
    ["_s_ssshoot7", 10, null, "_s_ssshoot8"],
    ["_s_ssshoot8", 10, "T_Shoot", "_s_ssshoot9"],
    ["_s_ssshoot9", 10, null, "_s_sschase1"],
    ["_s_bossshoot1", 30, null, "_s_bossshoot2"],
    ["_s_bossshoot2", 10, "T_Shoot", "_s_bossshoot3"],
    ["_s_bossshoot3", 10, "T_Shoot", "_s_bossshoot4"],
    ["_s_bossshoot4", 10, "T_Shoot", "_s_bossshoot5"],
    ["_s_bossshoot5", 10, "T_Shoot", "_s_bossshoot6"],
    ["_s_bossshoot6", 10, "T_Shoot", "_s_bossshoot7"],
    ["_s_bossshoot7", 10, "T_Shoot", "_s_bossshoot8"],
    ["_s_bossshoot8", 10, null, "_s_bosschase1"],
    ["_s_gretelshoot1", 30, null, "_s_gretelshoot2"],
    ["_s_gretelshoot2", 10, "T_Shoot", "_s_gretelshoot3"],
    ["_s_gretelshoot3", 10, "T_Shoot", "_s_gretelshoot4"],
    ["_s_gretelshoot4", 10, "T_Shoot", "_s_gretelshoot5"],
    ["_s_gretelshoot5", 10, "T_Shoot", "_s_gretelshoot6"],
    ["_s_gretelshoot6", 10, "T_Shoot", "_s_gretelshoot7"],
    ["_s_gretelshoot7", 10, "T_Shoot", "_s_gretelshoot8"],
    ["_s_gretelshoot8", 10, null, "_s_gretelchase1"],
    ["_s_mechashoot1", 30, null, "_s_mechashoot2"],
    ["_s_mechashoot2", 10, "T_Shoot", "_s_mechashoot3"],
    ["_s_mechashoot3", 10, "T_Shoot", "_s_mechashoot4"],
    ["_s_mechashoot4", 10, "T_Shoot", "_s_mechashoot5"],
    ["_s_mechashoot5", 10, "T_Shoot", "_s_mechashoot6"],
    ["_s_mechashoot6", 10, "T_Shoot", "_s_mechachase1"],
    ["_s_hitlershoot1", 30, null, "_s_hitlershoot2"],
    ["_s_hitlershoot2", 10, "T_Shoot", "_s_hitlershoot3"],
    ["_s_hitlershoot3", 10, "T_Shoot", "_s_hitlershoot4"],
    ["_s_hitlershoot4", 10, "T_Shoot", "_s_hitlershoot5"],
    ["_s_hitlershoot5", 10, "T_Shoot", "_s_hitlershoot6"],
    ["_s_hitlershoot6", 10, "T_Shoot", "_s_hitlerchase1"],
    ["_s_schabbshoot1", 30, null, "_s_schabbshoot2"],
    ["_s_schabbshoot2", 10, "T_SchabbThrow", "_s_schabbchase1"],
    ["_s_giftshoot1", 30, null, "_s_giftshoot2"],
    ["_s_giftshoot2", 10, "T_GiftThrow", "_s_giftchase1"],
    ["_s_fatshoot1", 30, null, "_s_fatshoot2"],
    ["_s_fatshoot2", 10, "T_GiftThrow", "_s_fatshoot3"],
    ["_s_fatshoot3", 10, "T_Shoot", "_s_fatshoot4"],
    ["_s_fatshoot4", 10, "T_Shoot", "_s_fatshoot5"],
    ["_s_fatshoot5", 10, "T_Shoot", "_s_fatshoot6"],
    ["_s_fatshoot6", 10, "T_Shoot", "_s_fatchase1"],
    ["_s_fakeshoot1", 8, "T_FakeFire", "_s_fakeshoot2"],
    ["_s_fakeshoot2", 8, "T_FakeFire", "_s_fakeshoot3"],
    ["_s_fakeshoot3", 8, "T_FakeFire", "_s_fakeshoot4"],
    ["_s_fakeshoot4", 8, "T_FakeFire", "_s_fakeshoot5"],
    ["_s_fakeshoot5", 8, "T_FakeFire", "_s_fakeshoot6"],
    ["_s_fakeshoot6", 8, "T_FakeFire", "_s_fakeshoot7"],
    ["_s_fakeshoot7", 8, "T_FakeFire", "_s_fakeshoot8"],
    ["_s_fakeshoot8", 8, "T_FakeFire", "_s_fakeshoot9"],
    ["_s_fakeshoot9", 8, null, "_s_fakechase1"],
  ] as const) {
    states[name] = {
      name,
      tictime,
      think: null,
      action,
      next,
    };
  }
  for (const [name, tictime, think, action, next] of [
    ["_s_bjrun1", 12, "T_BJRun", null, "_s_bjrun1s"],
    ["_s_bjrun1s", 3, null, null, "_s_bjrun2"],
    ["_s_bjrun2", 8, "T_BJRun", null, "_s_bjrun3"],
    ["_s_bjrun3", 12, "T_BJRun", null, "_s_bjrun3s"],
    ["_s_bjrun3s", 3, null, null, "_s_bjrun4"],
    ["_s_bjrun4", 8, "T_BJRun", null, "_s_bjrun1"],
    ["_s_bjjump1", 14, "T_BJJump", null, "_s_bjjump2"],
    ["_s_bjjump2", 14, "T_BJJump", "T_BJYell", "_s_bjjump3"],
    ["_s_bjjump3", 14, "T_BJJump", null, "_s_bjjump4"],
    ["_s_bjjump4", 300, null, "T_BJDone", "_s_bjjump4"],
  ] as const) {
    states[name] = {
      name,
      tictime,
      think,
      action,
      next,
    };
  }
  for (const [name, tictime, think, action, next] of [
    ["_s_rocket", 3, "T_Projectile", "A_Smoke", "_s_rocket"],
    ["_s_smoke1", 3, null, null, "_s_smoke2"],
    ["_s_smoke2", 3, null, null, "_s_smoke3"],
    ["_s_smoke3", 3, null, null, "_s_smoke4"],
    ["_s_smoke4", 3, null, null, null],
    ["_s_boom1", 6, null, null, "_s_boom2"],
    ["_s_boom2", 6, null, null, "_s_boom3"],
    ["_s_boom3", 6, null, null, null],
    ["_s_needle1", 6, "T_Projectile", null, "_s_needle2"],
    ["_s_needle2", 6, "T_Projectile", null, "_s_needle3"],
    ["_s_needle3", 6, "T_Projectile", null, "_s_needle4"],
    ["_s_needle4", 6, "T_Projectile", null, "_s_needle1"],
    ["_s_fire1", 6, null, "T_Projectile", "_s_fire2"],
    ["_s_fire2", 6, null, "T_Projectile", "_s_fire1"],
  ] as const) {
    states[name] = {
      name,
      tictime,
      think,
      action,
      next,
    };
  }
  return states;
}

function stateDefinitionForName(name: string): StateDefinition {
  const state = STATE_DEFINITIONS[name];
  if (!state) {
    throw new Error(`Unsupported statetype ${name}`);
  }
  return state;
}

function stateDefinitionForActor(dgroup: DOSMemory, actor: number): StateDefinition | null {
  const name = stateNameForActor(dgroup, actor);
  return name ? (STATE_DEFINITIONS[name] ?? null) : null;
}

function stateNameForActor(dgroup: DOSMemory, actor: number): string | null {
  const offset = dgroup.u16(actor + OBJ_STATE_OFFSET);
  if (!offset) {
    return null;
  }
  for (const symbol of STATETYPE_SYMBOLS) {
    if (Number.parseInt(symbol.nearOffset, 16) === offset) {
      return symbol.name;
    }
  }
  return null;
}

function actorHasRenderableState(dgroup: DOSMemory, actor: number): boolean {
  return stateNameForActor(dgroup, actor) !== null;
}

function dispatchThink(
  think: StateDefinition["think"],
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions,
): DispatchedThinkSummary | null {
  switch (think) {
    case "T_Player":
      return { think, player: T_PlayerMemory(dgroup, plane0, plane1, actor, options) };
    case "T_Attack":
      return { think, attack: T_AttackMemory(dgroup, plane0, plane1, actor, options) };
    case "T_Path":
      T_PathMemory(dgroup, plane0, plane1, actor, options);
      break;
    case "T_Stand":
      T_StandMemory(dgroup, actor, options);
      break;
    case "T_Chase":
      T_ChaseMemory(dgroup, plane0, actor, options);
      break;
    case "T_DogChase":
      T_DogChaseMemory(dgroup, plane0, actor, options);
      break;
    case "T_Ghosts":
      T_GhostsMemory(dgroup, plane0, actor, options);
      break;
    case "T_Schabb":
      T_SchabbMemory(dgroup, plane0, actor, options);
      break;
    case "T_Gift":
      T_GiftMemory(dgroup, plane0, actor, options);
      break;
    case "T_Fat":
      T_FatMemory(dgroup, plane0, actor, options);
      break;
    case "T_Fake":
      T_FakeMemory(dgroup, plane0, actor, options);
      break;
    case "T_Projectile":
      T_ProjectileMemory(dgroup, actor, options);
      break;
    case "T_BJRun":
      T_BJRunMemory(dgroup, plane0, plane1, actor, options);
      break;
    case "T_BJJump":
      T_BJJumpMemory(dgroup, actor, options);
      break;
    case null:
      break;
    default:
      throw new Error(`Unsupported statetype think ${think}`);
  }
  return null;
}

function dispatchAction(
  action: StateAction,
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  options: SightPlayerOptions,
): DispatchedActionSummary | null {
  switch (action) {
    case "T_Shoot":
      return { action, shoot: T_ShootMemory(dgroup, actor, options) };
    case "T_Bite":
      return { action, bite: T_BiteMemory(dgroup, actor) };
    case "T_Projectile":
      return { action, projectile: T_ProjectileMemory(dgroup, actor, options) };
    case "A_DeathScream":
      return { action, sound: A_DeathScreamMemory(dgroup, actor) };
    case "A_HitlerMorph":
      return { action, morph: A_HitlerMorphMemory(dgroup, plane0, actor) };
    case "A_StartDeathCam":
      A_StartDeathCamMemory(dgroup);
      break;
    case "A_Smoke":
      A_SmokeMemory(dgroup, actor);
      break;
    case "T_SchabbThrow":
      T_SchabbThrowMemory(dgroup, actor);
      break;
    case "T_GiftThrow":
      T_GiftThrowMemory(dgroup, actor);
      break;
    case "T_FakeFire":
      T_FakeFireMemory(dgroup, actor);
      break;
    case "T_BJYell":
      return { action, sound: T_BJYellMemory(dgroup, actor) };
    case "T_BJDone":
      T_BJDoneMemory(dgroup);
      break;
    case null:
      break;
    default:
      throw new Error(`Unsupported statetype action ${action}`);
  }
  return null;
}

function markActorIfNeeded(dgroup: DOSMemory, actor: number): void {
  const flags = dgroup.u8(actor + OBJ_FLAGS_OFFSET);
  if (flags & FL_NEVERMARK) {
    return;
  }
  if (
    (flags & FL_NONMARK) &&
    actoratAt(dgroup, dgroup.u16(actor + OBJ_TILEX_OFFSET), dgroup.u16(actor + OBJ_TILEY_OFFSET))
  ) {
    return;
  }
  dgroup.setU16(
    actoratCellOffset(
      nearOffsetForRuntimeSymbol("_actorat"),
      dgroup.u16(actor + OBJ_TILEX_OFFSET),
      dgroup.u16(actor + OBJ_TILEY_OFFSET),
    ),
    actor,
  );
}

function currentDifficulty(dgroup: DOSMemory, options: EnemySpawnOptions): number {
  const difficulty =
    options.difficulty ??
    dgroup.u16(nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_DIFFICULTY_OFFSET);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty >= starthitpoints.length) {
    throw new RangeError(`Invalid gamestate.difficulty ${difficulty}`);
  }
  return difficulty;
}

function enemyHitpoints(
  dgroup: DOSMemory,
  which: number,
  options: EnemySpawnOptions,
): number {
  const row = starthitpoints[currentDifficulty(dgroup, options)];
  const hitpoints = row[which];
  if (hitpoints === undefined) {
    throw new RangeError(`Invalid enemy_t ${which}`);
  }
  return hitpoints;
}

function incrementKillTotal(dgroup: DOSMemory, options: EnemySpawnOptions): void {
  if (options.loadedgame) {
    return;
  }
  const killtotal = nearOffsetForRuntimeSymbol("_gamestate") + GAMESTATE_KILLTOTAL_OFFSET;
  dgroup.setU16(killtotal, dgroup.u16(killtotal) + 1);
}

function orObjFlags(dgroup: DOSMemory, actor: number, flags: number): void {
  dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) | flags);
}

function applyStandAmbush(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  actor: number,
  tilex: number,
  tiley: number,
): void {
  const index = tiley * MAPSIZE + tilex;
  if (plane0[index] !== AMBUSHTILE) {
    return;
  }

  dgroup.setU8(tilemapCellOffset(nearOffsetForRuntimeSymbol("_tilemap"), tilex, tiley), 0);
  let tile = plane0[index];
  if (plane0[index + 1] >= AREATILE) {
    tile = plane0[index + 1];
  }
  if (plane0[index - MAPSIZE] >= AREATILE) {
    tile = plane0[index - MAPSIZE];
  }
  if (plane0[index + MAPSIZE] >= AREATILE) {
    tile = plane0[index + MAPSIZE];
  }
  if (plane0[index - 1] >= AREATILE) {
    tile = plane0[index - 1];
  }
  plane0[index] = tile;
  dgroup.setU8(actor + OBJ_AREANUMBER_OFFSET, tile - AREATILE);
  orObjFlags(dgroup, actor, FL_AMBUSH);
}

function patrolDestination(tilex: number, tiley: number, dir: number): { tilex: number; tiley: number } {
  switch (dir) {
    case 0:
      return { tilex: tilex + 1, tiley };
    case 1:
      return { tilex, tiley: tiley - 1 };
    case 2:
      return { tilex: tilex - 1, tiley };
    case 3:
      return { tilex, tiley: tiley + 1 };
    default:
      throw new RangeError(`Invalid patrol dir ${dir}`);
  }
}

function spawnBossLike(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  config: {
    readonly which: number;
    readonly state: string;
    readonly obclass: number;
    readonly dir: number;
    readonly options: EnemySpawnOptions;
  },
): EnemySpawnSummary {
  const { actor } = SpawnNewObjMemory(dgroup, plane0, tilex, tiley, config.state);
  dgroup.setU32(actor + OBJ_SPEED_OFFSET, SPDPATROL);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, config.obclass);
  dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, enemyHitpoints(dgroup, config.which, config.options));
  dgroup.setU16(actor + OBJ_DIR_OFFSET, config.dir);
  orObjFlags(dgroup, actor, FL_SHOOTABLE | FL_AMBUSH);
  incrementKillTotal(dgroup, config.options);
  return { actor, which: config.which, tilex, tiley, state: config.state };
}

function spawnEnemyTile(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tile: number,
  x: number,
  y: number,
  options: EnemySpawnOptions,
): boolean {
  const difficulty = currentDifficulty(dgroup, options);
  let dir = gatedDirection(tile, 108, 144, 180, difficulty);
  if (dir !== null) {
    SpawnStandMemory(dgroup, plane0, en_guard, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 112, 148, 184, difficulty);
  if (dir !== null) {
    SpawnPatrolMemory(dgroup, plane0, en_guard, x, y, dir, options);
    return true;
  }

  if (tile === 124) {
    SpawnDeadGuardMemory(dgroup, plane0, x, y);
    return true;
  }

  dir = gatedDirection(tile, 116, 152, 188, difficulty);
  if (dir !== null) {
    SpawnStandMemory(dgroup, plane0, en_officer, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 120, 156, 192, difficulty);
  if (dir !== null) {
    SpawnPatrolMemory(dgroup, plane0, en_officer, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 126, 162, 198, difficulty);
  if (dir !== null) {
    SpawnStandMemory(dgroup, plane0, en_ss, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 130, 166, 202, difficulty);
  if (dir !== null) {
    SpawnPatrolMemory(dgroup, plane0, en_ss, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 134, 170, 206, difficulty);
  if (dir !== null) {
    throw new Error("ScanInfoPlane hit a standing dog tile, but SpawnStand has no en_dog case");
  }

  dir = gatedDirection(tile, 138, 174, 210, difficulty);
  if (dir !== null) {
    SpawnPatrolMemory(dgroup, plane0, en_dog, x, y, dir, options);
    return true;
  }

  switch (tile) {
    case 214:
      SpawnBossMemory(dgroup, plane0, x, y, options);
      return true;
    case 197:
      SpawnGretelMemory(dgroup, plane0, x, y, options);
      return true;
    case 215:
      SpawnGiftMemory(dgroup, plane0, x, y, options);
      return true;
    case 179:
      SpawnFatMemory(dgroup, plane0, x, y, options);
      return true;
    case 196:
      SpawnSchabbsMemory(dgroup, plane0, x, y, options);
      return true;
    case 160:
      SpawnFakeHitlerMemory(dgroup, plane0, x, y, options);
      return true;
    case 178:
      SpawnHitlerMemory(dgroup, plane0, x, y, options);
      return true;
  }

  dir = gatedDirection(tile, 216, 234, 252, difficulty);
  if (dir !== null) {
    SpawnStandMemory(dgroup, plane0, en_mutant, x, y, dir, options);
    return true;
  }

  dir = gatedDirection(tile, 220, 238, 256, difficulty);
  if (dir !== null) {
    SpawnPatrolMemory(dgroup, plane0, en_mutant, x, y, dir, options);
    return true;
  }

  switch (tile) {
    case 224:
      SpawnGhostsMemory(dgroup, plane0, en_blinky, x, y, options);
      return true;
    case 225:
      SpawnGhostsMemory(dgroup, plane0, en_clyde, x, y, options);
      return true;
    case 226:
      SpawnGhostsMemory(dgroup, plane0, en_pinky, x, y, options);
      return true;
    case 227:
      SpawnGhostsMemory(dgroup, plane0, en_inky, x, y, options);
      return true;
    default:
      return false;
  }
}

function gatedDirection(
  tile: number,
  baseTile: number,
  mediumTile: number,
  hardTile: number,
  difficulty: number,
): number | null {
  if (tile >= hardTile && tile <= hardTile + 3) {
    return difficulty < 3 ? null : tile - hardTile;
  }
  if (tile >= mediumTile && tile <= mediumTile + 3) {
    return difficulty < 2 ? null : tile - mediumTile;
  }
  if (tile >= baseTile && tile <= baseTile + 3) {
    return tile - baseTile;
  }
  return null;
}

function actoratAt(dgroup: DOSMemory, x: number, y: number): number {
  return dgroup.u16(actoratCellOffset(nearOffsetForRuntimeSymbol("_actorat"), x, y));
}

function attackStateForClass(obclass: number): string | null {
  switch (obclass) {
    case GUARDOBJ:
      return "_s_grdshoot1";
    case OFFICEROBJ:
      return "_s_ofcshoot1";
    case MUTANTOBJ:
      return "_s_mutshoot1";
    case SSOBJ:
      return "_s_ssshoot1";
    case BOSSOBJ:
      return "_s_bossshoot1";
    case GRETELOBJ:
      return "_s_gretelshoot1";
    case MECHAHITLEROBJ:
      return "_s_mechashoot1";
    case REALHITLEROBJ:
      return "_s_hitlershoot1";
    default:
      return null;
  }
}

function chaseSummary(
  dgroup: DOSMemory,
  actor: number,
  moved: boolean,
  attacked: boolean,
  blocked: boolean,
  waitingForDoor: number | null,
): ChaseStepSummary {
  return {
    actor,
    moved,
    attacked,
    blocked,
    waitingForDoor,
    selectedDir: dgroup.u16(actor + OBJ_DIR_OFFSET),
    state: stateNameForActor(dgroup, actor),
  };
}

function bjRunSummary(dgroup: DOSMemory, actor: number, moved: boolean, jumped: boolean): BJRunSummary {
  return {
    actor,
    moved,
    jumped,
    temp1: dgroup.u16(actor + OBJ_TEMP1_OFFSET),
    distance: dgroup.i32(actor + OBJ_DISTANCE_OFFSET),
    state: stateNameForActor(dgroup, actor),
  };
}

function areaVisibleToPlayer(dgroup: DOSMemory, area: number): boolean {
  return area < NUMAREAS && dgroup.u16(nearOffsetForRuntimeSymbol("_areabyplayer") + area * 2) !== 0;
}

function directionDestination(tilex: number, tiley: number, dir: number): [number, number] {
  const [dx, dy] = directionDelta(dir);
  return [tilex + dx, tiley + dy];
}

function directionDelta(dir: number): [number, number] {
  switch (dir) {
    case DIR_NORTH:
      return [0, -1];
    case NORTHEAST:
      return [1, -1];
    case EAST:
      return [1, 0];
    case SOUTHEAST:
      return [1, 1];
    case SOUTH:
      return [0, 1];
    case SOUTHWEST:
      return [-1, 1];
    case WEST:
      return [-1, 0];
    case NORTHWEST:
      return [-1, -1];
    case NODIR:
      return [0, 0];
    default:
      throw new Error("MoveObj: bad dir!");
  }
}

export function FixedByFracMemory(a: number, b: number): number {
  const fraction = b & 0xffff;
  let sign = b & 0x80000000;
  let value = i32(a);
  if (value < 0) {
    value = i32(-value);
    sign ^= 0x80000000;
  }

  const fracProduct = Math.imul(value & 0xffff, fraction) >>> 0;
  const unitProduct = Math.imul((value >>> 16) & 0xffff, fraction) >>> 0;
  let result = (unitProduct + (fracProduct >>> 16)) >>> 0;
  if (sign) {
    result = (~result + 1) >>> 0;
  }
  return result | 0;
}

function buildSinTable(): readonly number[] {
  const table = new Array<number>(ANGLES + ANGLEQUAD + 1).fill(0);
  let angle = 0;
  const anglestep = Math.fround(Math.PI / 2 / ANGLEQUAD);

  for (let i = 0; i <= ANGLEQUAD; i++) {
    const value = Math.min(0xffff, Math.trunc(GLOBAL1 * Math.sin(angle)));
    const positive = value >>> 0;
    const negative = (value | 0x80000000) >>> 0;
    table[i] = positive;
    table[i + ANGLES] = positive;
    table[ANGLES / 2 - i] = positive;
    table[ANGLES - i] = negative;
    table[ANGLES / 2 + i] = negative;
    angle = Math.fround(angle + anglestep);
  }

  return table;
}

function normalizeAngle(angle: number): number {
  let normalized = angle % ANGLES;
  if (normalized < 0) {
    normalized += ANGLES;
  }
  return normalized;
}

function sintableAt(angle: number): number {
  return SINTABLE[normalizeAngle(angle)];
}

function costableAt(angle: number): number {
  return SINTABLE[normalizeAngle(angle) + ANGLEQUAD];
}

function projectileDamageForClass(obclass: number): number {
  switch (obclass) {
    case NEEDLEOBJ:
      return (US_RndT() >> 3) + 20;
    case ROCKETOBJ:
    case HROCKETOBJ:
    case SPARKOBJ:
      return (US_RndT() >> 3) + 30;
    case FIREOBJ:
      return US_RndT() >> 3;
    default:
      return 0;
  }
}

function projectileSummary(
  dgroup: DOSMemory,
  actor: number,
  moved: boolean,
  blocked: boolean,
  hitPlayer: boolean,
  damage: number,
): ProjectileStepSummary {
  return {
    actor,
    moved,
    blocked,
    hitPlayer,
    damage,
    state: stateNameForActor(dgroup, actor),
    tilex: dgroup.u16(actor + OBJ_TILEX_OFFSET),
    tiley: dgroup.u16(actor + OBJ_TILEY_OFFSET),
  };
}

function spawnBossProjectile(
  dgroup: DOSMemory,
  source: number,
  config: {
    readonly state: string;
    readonly obclass: number;
    readonly speed: number;
    readonly flags: number;
  },
): ProjectileSpawnSummary {
  const actor = GetNewActorMemory(dgroup);
  const angle = angleToPlayer(dgroup, source);
  dgroup.setU16(actor + OBJ_STATE_OFFSET, statetypeNearOffset(config.state));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, 1);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, dgroup.u16(source + OBJ_TILEX_OFFSET));
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, dgroup.u16(source + OBJ_TILEY_OFFSET));
  dgroup.setU32(actor + OBJ_X_OFFSET, dgroup.u32(source + OBJ_X_OFFSET));
  dgroup.setU32(actor + OBJ_Y_OFFSET, dgroup.u32(source + OBJ_Y_OFFSET));
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, config.obclass);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
  dgroup.setU16(actor + OBJ_ANGLE_OFFSET, angle);
  dgroup.setU32(actor + OBJ_SPEED_OFFSET, config.speed);
  dgroup.setU8(actor + OBJ_FLAGS_OFFSET, config.flags);
  dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);
  return {
    actor,
    source,
    state: config.state,
    obclass: config.obclass,
    angle,
    speed: config.speed,
    flags: config.flags,
    ticcount: 1,
  };
}

function angleToPlayer(dgroup: DOSMemory, actor: number): number {
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const deltax = dgroup.i32(player + OBJ_X_OFFSET) - dgroup.i32(actor + OBJ_X_OFFSET);
  const deltay = dgroup.i32(actor + OBJ_Y_OFFSET) - dgroup.i32(player + OBJ_Y_OFFSET);
  let angle = Math.atan2(deltay, deltax);
  if (angle < 0) {
    angle = Math.PI * 2 + angle;
  }
  return normalizeAngle(Math.trunc((angle / (Math.PI * 2)) * ANGLES));
}

function bytesOf(source: DOSByteSource): Uint8Array {
  return source instanceof DOSMemory ? source.bytes : source;
}

function structFieldOffset(
  layout: { readonly fields: readonly (readonly [string, number, number, string])[] },
  name: string,
): number {
  const field = layout.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing struct field ${name}`);
  }
  return field[1];
}

function requireMapPlane(plane: Uint16Array): void {
  if (plane.length !== MAPSIZE * MAPSIZE) {
    throw new Error(`Expected ${MAPSIZE}x${MAPSIZE} map plane, saw ${plane.length} words`);
  }
}

function requireMapCell(x: number, y: number): void {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= MAPSIZE ||
    y >= MAPSIZE
  ) {
    throw new RangeError(`Map cell ${x},${y} is outside ${MAPSIZE}x${MAPSIZE}`);
  }
}
