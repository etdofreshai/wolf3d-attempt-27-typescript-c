import { cdiv, i16, i32 } from "./TS_C";
import { DOSMemory } from "./TS_DOS_MEMORY";
import { STRUCT_LAYOUTS, STATETYPE_SYMBOLS, nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";
import { FixedByFracMemory, GetBonusMemory } from "./TS_LEVEL_SETUP";
import { buildCompScale, type CompScale, type ScaleShapeSummary } from "./TS_SCALE_MODEL";
import { ScaleShape, SimpleScaleShape } from "./WL_SCALE.C";
import { PM_GetPage } from "./ID_PM.C";
import { SPR_CHAINREADY, SPR_DEATHCAM, SPR_DEMO, SPR_KNIFEREADY, SPR_MACHINEGUNREADY, SPR_PISTOLREADY } from "./WL_DEF.H";
import {
  bufferofs,
  displayofs,
  videoPlanes,
  VL_ScreenToScreen,
  VL_SetBufferOffset,
  VL_SetScreen,
  type PlanarCopySummary,
} from "./ID_VL.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_DRAW.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_DRAW.C";
export const WOLFSRC_FUNCTIONS = [
  "CalcHeight",
  "CalcRotate",
  "CalcTics",
  "ClearScreen",
  "DrawPlayerWeapon",
  "DrawScaleds",
  "FarScalePost",
  "FixedByFrac",
  "FixOfs",
  "HitHorizDoor",
  "HitHorizPWall",
  "HitHorizWall",
  "HitVertDoor",
  "HitVertPWall",
  "HitVertWall",
  "ScalePost",
  "ThreeDRefresh",
  "TransformActor",
  "TransformTile",
  "VGAClearScreen",
  "WallRefresh"
] as const;

const ANGLES = 360;
const ANGLES_16 = cdiv(ANGLES, 16);
const ANGLEQUAD = ANGLES / 4;
const FINEANGLES = 3600;
const DEG90 = 900;
const DEG180 = 1800;
const DEG270 = 2700;
const DEG360 = 3600;
const MAXVIEWWIDTH = 320;
const TILEGLOBAL = 1 << 16;
const TILESHIFT = 16;
const ACTORSIZE = 0x4000;
const TILE_OBJECT_SIZE = 0x2000;
const MINDIST = 0x5800;
const MAXTICS = 10;
const ROCKETOBJ = 20;
const HROCKETOBJ = 27;
const MAXWALLTILES = 64;
const MAPSIZE = 64;
const DOORWALL = 98;
const VIDEO_PLANE_BYTES = 0x10000;
const VGA_SCREEN_STRIDE = 80;
const SCREENSIZE = VGA_SCREEN_STRIDE * 208;
const PAGE1START = 0;
const PAGE3START = SCREENSIZE * 2;
const FL_BONUS = 2;
const FL_VISABLE = 8;
const AC_YES = 1;
const DR_NORMAL = 0;
const DR_LOCK1 = 1;
const DR_LOCK4 = 4;
const DR_ELEVATOR = 5;
const WEAPONSCALE = [SPR_KNIFEREADY, SPR_PISTOLREADY, SPR_MACHINEGUNREADY, SPR_CHAINREADY] as const;
const STATE_RENDER_INFO: Readonly<Record<string, { readonly rotate: number; readonly shapenum: number }>> = {
  _s_dogchase1: { rotate: 1, shapenum: 99 },
  _s_dogchase1s: { rotate: 1, shapenum: 99 },
  _s_dogchase2: { rotate: 1, shapenum: 107 },
  _s_dogchase3: { rotate: 1, shapenum: 115 },
  _s_dogchase3s: { rotate: 1, shapenum: 115 },
  _s_dogchase4: { rotate: 1, shapenum: 123 },
  _s_dogdead: { rotate: 0, shapenum: 134 },
  _s_dogdie1: { rotate: 0, shapenum: 131 },
  _s_dogdie2: { rotate: 0, shapenum: 132 },
  _s_dogdie3: { rotate: 0, shapenum: 133 },
  _s_dogjump1: { rotate: 0, shapenum: 135 },
  _s_dogjump2: { rotate: 0, shapenum: 136 },
  _s_dogjump3: { rotate: 0, shapenum: 137 },
  _s_dogjump4: { rotate: 0, shapenum: 135 },
  _s_dogjump5: { rotate: 0, shapenum: 99 },
  _s_dogpath1: { rotate: 1, shapenum: 99 },
  _s_dogpath1s: { rotate: 1, shapenum: 99 },
  _s_dogpath2: { rotate: 1, shapenum: 107 },
  _s_dogpath3: { rotate: 1, shapenum: 115 },
  _s_dogpath3s: { rotate: 1, shapenum: 115 },
  _s_dogpath4: { rotate: 1, shapenum: 123 },
  _s_grdchase1: { rotate: 1, shapenum: 58 },
  _s_grdchase1s: { rotate: 1, shapenum: 58 },
  _s_grdchase2: { rotate: 1, shapenum: 66 },
  _s_grdchase3: { rotate: 1, shapenum: 74 },
  _s_grdchase3s: { rotate: 1, shapenum: 74 },
  _s_grdchase4: { rotate: 1, shapenum: 82 },
  _s_grddie1: { rotate: 0, shapenum: 91 },
  _s_grddie2: { rotate: 0, shapenum: 92 },
  _s_grddie3: { rotate: 0, shapenum: 93 },
  _s_grddie4: { rotate: 0, shapenum: 95 },
  _s_grdpain: { rotate: 2, shapenum: 90 },
  _s_grdpain1: { rotate: 2, shapenum: 94 },
  _s_grdpath1: { rotate: 1, shapenum: 58 },
  _s_grdpath1s: { rotate: 1, shapenum: 58 },
  _s_grdpath2: { rotate: 1, shapenum: 66 },
  _s_grdpath3: { rotate: 1, shapenum: 74 },
  _s_grdpath3s: { rotate: 1, shapenum: 74 },
  _s_grdpath4: { rotate: 1, shapenum: 82 },
  _s_grdshoot1: { rotate: 0, shapenum: 96 },
  _s_grdshoot2: { rotate: 0, shapenum: 97 },
  _s_grdshoot3: { rotate: 0, shapenum: 98 },
  _s_grdstand: { rotate: 1, shapenum: 50 },
  _s_mutchase1: { rotate: 1, shapenum: 195 },
  _s_mutchase1s: { rotate: 1, shapenum: 195 },
  _s_mutchase2: { rotate: 1, shapenum: 203 },
  _s_mutchase3: { rotate: 1, shapenum: 211 },
  _s_mutchase3s: { rotate: 1, shapenum: 211 },
  _s_mutchase4: { rotate: 1, shapenum: 219 },
  _s_mutdie1: { rotate: 0, shapenum: 228 },
  _s_mutdie2: { rotate: 0, shapenum: 229 },
  _s_mutdie3: { rotate: 0, shapenum: 230 },
  _s_mutdie4: { rotate: 0, shapenum: 232 },
  _s_mutdie5: { rotate: 0, shapenum: 233 },
  _s_mutpain: { rotate: 2, shapenum: 227 },
  _s_mutpain1: { rotate: 2, shapenum: 231 },
  _s_mutpath1: { rotate: 1, shapenum: 195 },
  _s_mutpath1s: { rotate: 1, shapenum: 195 },
  _s_mutpath2: { rotate: 1, shapenum: 203 },
  _s_mutpath3: { rotate: 1, shapenum: 211 },
  _s_mutpath3s: { rotate: 1, shapenum: 211 },
  _s_mutpath4: { rotate: 1, shapenum: 219 },
  _s_mutshoot1: { rotate: 0, shapenum: 234 },
  _s_mutshoot2: { rotate: 0, shapenum: 235 },
  _s_mutshoot3: { rotate: 0, shapenum: 236 },
  _s_mutshoot4: { rotate: 0, shapenum: 237 },
  _s_mutstand: { rotate: 1, shapenum: 187 },
  _s_ofcchase1: { rotate: 1, shapenum: 246 },
  _s_ofcchase1s: { rotate: 1, shapenum: 246 },
  _s_ofcchase2: { rotate: 1, shapenum: 254 },
  _s_ofcchase3: { rotate: 1, shapenum: 262 },
  _s_ofcchase3s: { rotate: 1, shapenum: 262 },
  _s_ofcchase4: { rotate: 1, shapenum: 270 },
  _s_ofcdie1: { rotate: 0, shapenum: 279 },
  _s_ofcdie2: { rotate: 0, shapenum: 280 },
  _s_ofcdie3: { rotate: 0, shapenum: 281 },
  _s_ofcdie4: { rotate: 0, shapenum: 283 },
  _s_ofcdie5: { rotate: 0, shapenum: 284 },
  _s_ofcpain: { rotate: 2, shapenum: 278 },
  _s_ofcpain1: { rotate: 2, shapenum: 282 },
  _s_ofcpath1: { rotate: 1, shapenum: 246 },
  _s_ofcpath1s: { rotate: 1, shapenum: 246 },
  _s_ofcpath2: { rotate: 1, shapenum: 254 },
  _s_ofcpath3: { rotate: 1, shapenum: 262 },
  _s_ofcpath3s: { rotate: 1, shapenum: 262 },
  _s_ofcpath4: { rotate: 1, shapenum: 270 },
  _s_ofcshoot1: { rotate: 0, shapenum: 285 },
  _s_ofcshoot2: { rotate: 0, shapenum: 286 },
  _s_ofcshoot3: { rotate: 0, shapenum: 287 },
  _s_ofcstand: { rotate: 1, shapenum: 238 },
  _s_sschase1: { rotate: 1, shapenum: 146 },
  _s_sschase1s: { rotate: 1, shapenum: 146 },
  _s_sschase2: { rotate: 1, shapenum: 154 },
  _s_sschase3: { rotate: 1, shapenum: 162 },
  _s_sschase3s: { rotate: 1, shapenum: 162 },
  _s_sschase4: { rotate: 1, shapenum: 170 },
  _s_ssdie1: { rotate: 0, shapenum: 179 },
  _s_ssdie2: { rotate: 0, shapenum: 180 },
  _s_ssdie3: { rotate: 0, shapenum: 181 },
  _s_ssdie4: { rotate: 0, shapenum: 183 },
  _s_sspain: { rotate: 2, shapenum: 178 },
  _s_sspain1: { rotate: 2, shapenum: 182 },
  _s_sspath1: { rotate: 1, shapenum: 146 },
  _s_sspath1s: { rotate: 1, shapenum: 146 },
  _s_sspath2: { rotate: 1, shapenum: 154 },
  _s_sspath3: { rotate: 1, shapenum: 162 },
  _s_sspath3s: { rotate: 1, shapenum: 162 },
  _s_sspath4: { rotate: 1, shapenum: 170 },
  _s_ssshoot1: { rotate: 0, shapenum: 184 },
  _s_ssshoot2: { rotate: 0, shapenum: 185 },
  _s_ssshoot3: { rotate: 0, shapenum: 186 },
  _s_ssshoot4: { rotate: 0, shapenum: 185 },
  _s_ssshoot5: { rotate: 0, shapenum: 186 },
  _s_ssshoot6: { rotate: 0, shapenum: 185 },
  _s_ssshoot7: { rotate: 0, shapenum: 186 },
  _s_ssshoot8: { rotate: 0, shapenum: 185 },
  _s_ssshoot9: { rotate: 0, shapenum: 186 },
  _s_ssstand: { rotate: 1, shapenum: 138 },
};
const OBJ_ACTIVE_OFFSET = 0;
const OBJ_CLASS_OFFSET = 4;
const OBJ_STATE_OFFSET = 6;
const OBJ_FLAGS_OFFSET = 8;
const OBJ_NEXT_OFFSET = 56;
const OBJ_DIR_OFFSET = 14;
const OBJ_X_OFFSET = 16;
const OBJ_Y_OFFSET = 20;
const OBJ_TILEX_OFFSET = 24;
const OBJ_TILEY_OFFSET = 26;
const OBJ_VIEWX_OFFSET = 30;
const OBJ_VIEWHEIGHT_OFFSET = 32;
const OBJ_TRANSX_OFFSET = 34;
const OBJ_TRANSY_OFFSET = 38;
const OBJ_ANGLE_OFFSET = 42;
const OBJ_TEMP1_OFFSET = 50;
const STAT_TILEX_OFFSET = 0;
const STAT_TILEY_OFFSET = 1;
const STAT_VISSPOT_OFFSET = 2;
const STAT_SHAPENUM_OFFSET = 4;
const STAT_FLAGS_OFFSET = 6;
const STATE_SHAPENUM_OFFSET = 2;
const STATE_ROTATE_OFFSET = 0;
const DIRANGLE = [0, 45, 90, 135, 180, 225, 270, 315, 360] as const;
export const vgaCeiling = [
  0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0xbfbf,
  0x4e4e, 0x4e4e, 0x4e4e, 0x1d1d, 0x8d8d, 0x4e4e, 0x1d1d, 0x2d2d, 0x1d1d, 0x8d8d,
  0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0x2d2d, 0xdddd, 0x1d1d, 0x1d1d, 0x9898,
  0x1d1d, 0x9d9d, 0x2d2d, 0xdddd, 0xdddd, 0x9d9d, 0x2d2d, 0x4d4d, 0x1d1d, 0xdddd,
  0x7d7d, 0x1d1d, 0x2d2d, 0x2d2d, 0xdddd, 0xd7d7, 0x1d1d, 0x1d1d, 0x1d1d, 0x2d2d,
  0x1d1d, 0x1d1d, 0x1d1d, 0x1d1d, 0xdddd, 0xdddd, 0x7d7d, 0xdddd, 0xdddd, 0xdddd,
] as const;

export let viewwidth = 0;
export let viewheight = 0;
export let lasttimecount = 0;
export let frameon = 0;
export const wallheight = new Uint16Array(MAXVIEWWIDTH);
export const horizwall = new Int16Array(MAXWALLTILES);
export const vertwall = new Int16Array(MAXWALLTILES);
export const pixelangle = new Int16Array(MAXVIEWWIDTH);
export const finetangent = new Int32Array(FINEANGLES / 4);
export const sintable = new Int32Array(ANGLES + ANGLEQUAD + 1);
export const costable = sintable.subarray(ANGLEQUAD);
export let tileglobal = TILEGLOBAL;
export let mindist = MINDIST;
export let viewx = 0;
export let viewy = 0;
export let viewangle = 0;
export let viewsin = 0;
export let viewcos = 0;
export let focaltx = 0;
export let focalty = 0;
export let viewtx = 0;
export let viewty = 0;
export let midangle = 0;
export let angle = 0;
export let xpartial = 0;
export let ypartial = 0;
export let xpartialup = 0;
export let xpartialdown = 0;
export let ypartialup = 0;
export let ypartialdown = 0;
export let xinttile = 0;
export let yinttile = 0;
export let tilehit = 0;
export let pixx = 0;
export let xtile = 0;
export let ytile = 0;
export let xtilestep = 0;
export let ytilestep = 0;
// Inert diagnostic hook (demo-140 raycaster localization). Disabled unless RAY_DEBUG.active.
export const RAY_DEBUG: { active: boolean; tiles: Set<number>; log: unknown[]; refreshIdx: number; onlyPixx: number; onlyRefresh: number; iters: unknown[] } = {
  active: false,
  tiles: new Set<number>(),
  log: [],
  refreshIdx: -1,
  onlyPixx: -1,
  onlyRefresh: -1,
  iters: [],
};
export let xintercept = 0;
export let yintercept = 0;
export let xstep = 0;
export let ystep = 0;
export let lastside = -1;
export let lastintercept = 0;
export let lasttilehit = 0;
export let postsource = 0;
export let postx = 0;
export let postwidth = 0;
export let postwallpic = 0;
export let fizzlein = false;
export const screenloc = [PAGE1START, SCREENSIZE, PAGE3START] as const;
export const scaledPosts: ScalePostSummary[] = [];

export interface ProjectionContext {
  readonly viewx: number;
  readonly viewy: number;
  readonly viewsin: number;
  readonly viewcos: number;
  readonly scale: number;
  readonly centerx?: number;
  readonly heightnumerator?: number;
  readonly mindist?: number;
}

export interface TransformActorSummary {
  readonly actor: number;
  readonly visible: boolean;
  readonly nx: number;
  readonly ny: number;
  readonly viewx: number;
  readonly viewheight: number;
  readonly transx: number;
  readonly transy: number;
}

export interface TransformTileSummary {
  readonly tx: number;
  readonly ty: number;
  readonly grabbed: boolean;
  readonly visible: boolean;
  readonly nx: number;
  readonly ny: number;
  readonly dispx: number;
  readonly dispheight: number;
}

export interface CalcRotateOptions {
  readonly centerx?: number;
  readonly player?: number;
  readonly rotate?: number;
}

export interface CalcTicsOptions {
  readonly timeCount: number;
  readonly lasttimecount: number;
  readonly maxTics?: number;
}

export interface CalcTicsSummary {
  readonly tics: number;
  readonly timeCount: number;
  readonly lasttimecount: number;
}

export interface FixOfsOptions {
  readonly viewwidth?: number;
  readonly viewheight?: number;
}

export interface FixOfsSummary extends PlanarCopySummary {
  readonly source: number;
  readonly dest: number;
  readonly viewwidth: number;
  readonly viewheight: number;
}

export interface VGAClearScreenOptions {
  readonly episode?: number;
  readonly mapon?: number;
}

export interface VGAClearScreenSummary {
  readonly ceiling: number;
  readonly floor: number;
  readonly rowBytes: number;
  readonly topRows: number;
  readonly bottomRows: number;
  readonly bytes: number;
}

export interface ScalePostSummary {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly texture: number;
  readonly wallpic: number;
  readonly side: number;
}

export interface RayStateOptions {
  readonly tilehit?: number;
  readonly pixx?: number;
  readonly xtile?: number;
  readonly ytile?: number;
  readonly xtilestep?: number;
  readonly ytilestep?: number;
  readonly xintercept?: number;
  readonly yintercept?: number;
  readonly pwallpos?: number;
}

export interface HitWallOptions extends RayStateOptions {
  readonly dgroup?: DOSMemory;
  readonly tilemap?: Uint8Array | Uint16Array | readonly number[];
  readonly doorLocks?: readonly number[];
  readonly doorPositions?: readonly number[];
  readonly pwallpos?: number;
}

export interface HitWallSummary {
  readonly kind: "wall" | "door" | "pwall";
  readonly side: "horiz" | "vert";
  readonly optimized: boolean;
  readonly texture: number;
  readonly height: number;
  readonly postx: number;
  readonly postwidth: number;
  readonly wallpic: number;
  readonly flushed: ScalePostSummary | null;
}

export interface StaticRenderObject {
  readonly statobj?: number;
  readonly tilex: number;
  readonly tiley: number;
  readonly shapenum: number;
  readonly visible?: boolean;
  readonly flags?: number;
}

export interface ActiveRenderObject {
  readonly actor?: number;
  readonly viewx: number;
  readonly viewheight: number;
  readonly shapenum: number;
  readonly rotate?: number;
}

export interface DrawScaledsOptions {
  readonly context?: ProjectionContext;
  readonly statics?: readonly StaticRenderObject[];
  readonly actors?: readonly ActiveRenderObject[];
  readonly spotvis?: Uint8Array | Uint16Array | readonly number[];
  readonly tilemap?: Uint8Array | Uint16Array | readonly number[];
  readonly wallheight?: ArrayLike<number>;
  readonly maxVisible?: number;
}

export interface VisibleObjectSummary {
  readonly viewx: number;
  readonly viewheight: number;
  readonly shapenum: number;
  readonly source: "static" | "actor";
}

export interface DrawScaledsSummary {
  readonly visible: readonly VisibleObjectSummary[];
  readonly drawOrder: readonly VisibleObjectSummary[];
  readonly scaled: readonly ScaleShapeSummary[];
}

export interface DrawPlayerWeaponOptions {
  readonly weapon?: number;
  readonly weaponframe?: number;
  readonly victoryflag?: boolean;
  readonly playerStateDeathCam?: boolean;
  readonly timeCount?: number;
  readonly demorecord?: boolean;
  readonly demoplayback?: boolean;
}

export interface DrawPlayerWeaponSummary {
  readonly draws: readonly ScaleShapeSummary[];
  readonly weaponShape: number | null;
  readonly demoShape: boolean;
  readonly deathCamShape: boolean;
}

export interface WallRefreshOptions {
  readonly dgroup?: DOSMemory;
  readonly player?: number;
  readonly focallength?: number;
  readonly scale?: number;
  readonly centerx?: number;
  readonly heightnumerator?: number;
  readonly context?: ProjectionContext;
  readonly tilemap?: Uint8Array | Uint16Array | readonly number[];
  readonly spotvis?: Uint8Array | Uint16Array | readonly number[];
}

export interface WallRefreshSummary {
  readonly viewx: number;
  readonly viewy: number;
  readonly viewangle: number;
  readonly focaltx: number;
  readonly focalty: number;
  readonly viewtx: number;
  readonly viewty: number;
  readonly flushed: ScalePostSummary | null;
  readonly traced: number;
  readonly posts: number;
}

export interface ThreeDRefreshOptions extends WallRefreshOptions, DrawScaledsOptions, DrawPlayerWeaponOptions {
  readonly dgroup?: DOSMemory;
  readonly screenofs?: number;
  readonly episode?: number;
  readonly mapon?: number;
  readonly fizzlein?: boolean;
}

export interface ThreeDRefreshSummary {
  readonly clear: VGAClearScreenSummary;
  readonly wall: WallRefreshSummary;
  readonly scaleds: DrawScaledsSummary;
  readonly weapon: DrawPlayerWeaponSummary;
  readonly displayofs: number;
  readonly nextBufferofs: number;
  readonly frameon: number;
  readonly fizzlein: boolean;
}

export function SetViewSizeForRefresh(width: number, height: number): { readonly viewwidth: number; readonly viewheight: number } {
  viewwidth = width & ~15;
  viewheight = height & ~1;
  return { viewwidth, viewheight };
}

export function CalcHeight(
  xintercept: number,
  yintercept: number,
  context: ProjectionContext,
): number {
  const gx = i32(xintercept - context.viewx);
  const gy = i32(yintercept - context.viewy);
  const gxt = FixedByFracMemory(gx, context.viewcos);
  const gyt = FixedByFracMemory(gy, context.viewsin);
  let nx = i32(gxt - gyt);
  const nxMindist = context.mindist ?? MINDIST;
  if (nx < nxMindist) {
    nx = nxMindist;
  }
  const heightnumerator = context.heightnumerator ?? ((TILEGLOBAL * context.scale) >> 6);
  const heightDivisor = nx >> 8;
  return heightDivisor ? cdiv(heightnumerator, heightDivisor) : 0;
}

export function CalcRotate(
  dgroup: DOSMemory,
  actor: number,
  options: CalcRotateOptions = {},
): number {
  const player = options.player ?? dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const centerx = options.centerx ?? dgroup.i16(nearOffsetForRuntimeSymbol("_centerx"));
  const playerAngle = dgroup.i16(player + OBJ_ANGLE_OFFSET);
  const viewangle = i16(playerAngle + cdiv(centerx - dgroup.i16(actor + OBJ_VIEWX_OFFSET), 8));
  const obclass = dgroup.u16(actor + OBJ_CLASS_OFFSET);
  const facing = obclass === ROCKETOBJ || obclass === HROCKETOBJ
    ? dgroup.i16(actor + OBJ_ANGLE_OFFSET)
    : DIRANGLE[dgroup.u16(actor + OBJ_DIR_OFFSET)] ?? 0;
  let angle = viewangle - 180 - facing + ANGLES_16;
  while (angle >= ANGLES) {
    angle -= ANGLES;
  }
  while (angle < 0) {
    angle += ANGLES;
  }

  const rotate = options.rotate ?? actorStateRotate(dgroup, actor);
  if (rotate === 2) {
    return 4 * cdiv(angle, ANGLES / 2);
  }
  return cdiv(angle, ANGLES / 8);
}

export function CalcTics(dgroup: DOSMemory, options: CalcTicsOptions): CalcTicsSummary {
  const maxTics = options.maxTics ?? MAXTICS;
  let timeCount = options.timeCount;
  let lasttimecount = options.lasttimecount;
  if (lasttimecount > timeCount) {
    timeCount = lasttimecount;
  }
  let tics = timeCount - lasttimecount;
  if (!tics) {
    tics = 1;
    timeCount = lasttimecount + 1;
  }
  lasttimecount = timeCount;
  if (tics > maxTics) {
    timeCount -= tics - maxTics;
    tics = maxTics;
  }
  dgroup.setU16(nearOffsetForRuntimeSymbol("_tics"), tics);
  return { tics, timeCount, lasttimecount };
}

export function ClearScreen(options: VGAClearScreenOptions = {}): VGAClearScreenSummary {
  return VGAClearScreen(options);
}

export function DrawPlayerWeapon(
  dgroupOrOptions: DOSMemory | DrawPlayerWeaponOptions = {},
  maybeOptions: DrawPlayerWeaponOptions = {},
): DrawPlayerWeaponSummary {
  const dgroup = dgroupOrOptions instanceof DOSMemory ? dgroupOrOptions : null;
  const options: DrawPlayerWeaponOptions = dgroup ? maybeOptions : dgroupOrOptions as DrawPlayerWeaponOptions;
  const gamestate = dgroup ? nearOffsetForRuntimeSymbol("_gamestate") : 0;
  const weapon = options.weapon ?? (dgroup ? dgroup.i16(gamestate + gamestateFieldOffset("weapon")) : -1);
  const weaponframe = options.weaponframe ?? (dgroup ? dgroup.u16(gamestate + gamestateFieldOffset("weaponframe")) : 0);
  const victoryflag = options.victoryflag ?? (dgroup ? dgroup.u16(gamestate + gamestateFieldOffset("victoryflag")) !== 0 : false);
  const timeCount = options.timeCount ?? (dgroup ? dgroup.u32(gamestate + gamestateFieldOffset("TimeCount")) : 0);
  const draws: ScaleShapeSummary[] = [];
  let weaponShape: number | null = null;
  let deathCamShape = false;

  if (victoryflag) {
    if (options.playerStateDeathCam && (timeCount & 32)) {
      draws.push(SimpleScaleShape(viewwidth >> 1, SPR_DEATHCAM, viewheight + 1));
      deathCamShape = true;
    }
    return { draws, weaponShape, demoShape: false, deathCamShape };
  }

  if (weapon !== -1) {
    const base = WEAPONSCALE[weapon as 0 | 1 | 2 | 3];
    if (base !== undefined) {
      const shape = base + weaponframe;
      weaponShape = shape;
      draws.push(SimpleScaleShape(viewwidth >> 1, shape, viewheight + 1));
    }
  }

  if (options.demorecord || options.demoplayback) {
    draws.push(SimpleScaleShape(viewwidth >> 1, SPR_DEMO, viewheight + 1));
  }

  return { draws, weaponShape, demoShape: Boolean(options.demorecord || options.demoplayback), deathCamShape };
}

export function DrawScaleds(
  dgroupOrOptions: DOSMemory | DrawScaledsOptions = {},
  maybeOptions: DrawScaledsOptions = {},
): DrawScaledsSummary {
  const dgroup = dgroupOrOptions instanceof DOSMemory ? dgroupOrOptions : null;
  const options: DrawScaledsOptions = dgroup ? maybeOptions : dgroupOrOptions as DrawScaledsOptions;
  const maxVisible = options.maxVisible ?? 50;
  const visible: VisibleObjectSummary[] = [];

  for (const stat of options.statics ?? readStaticObjects(dgroup, options)) {
    if (stat.shapenum === -1 || stat.visible === false) continue;
    let viewxValue = stat.tilex;
    let viewheightValue = 0;
    if (options.context) {
      const transformed = TransformTile(stat.tilex, stat.tiley, options.context);
      if (transformed.grabbed && (stat.flags ?? 0) & FL_BONUS) {
        if (dgroup && stat.statobj !== undefined) {
          GetBonusMemory(dgroup, stat.statobj);
        }
        continue;
      }
      if (!transformed.dispheight) {
        continue;
      }
      viewxValue = transformed.dispx;
      viewheightValue = transformed.dispheight;
    }
    if (visible.length < maxVisible - 1) {
      visible.push({ viewx: viewxValue, viewheight: viewheightValue, shapenum: stat.shapenum, source: "static" });
    }
  }

  for (const actor of options.actors ?? readActiveObjects(dgroup, options)) {
    if (!actor.shapenum || !actor.viewheight) continue;
    if (visible.length < maxVisible - 1) {
      visible.push({ viewx: actor.viewx, viewheight: actor.viewheight, shapenum: actor.shapenum, source: "actor" });
    }
  }

  const drawOrder = visible.slice().sort((a, b) => a.viewheight - b.viewheight);
  const scaled = drawOrder.map((entry) =>
    ScaleShape(entry.viewx, entry.shapenum, entry.viewheight, {
      viewwidth,
      viewheight,
      wallheight: options.wallheight ?? wallheight,
    }),
  );
  return { visible, drawOrder, scaled };
}

export function FarScalePost(): ScalePostSummary | null {
  return ScalePost();
}

export function FixedByFrac(a: number, b: number): number {
  return FixedByFracMemory(a, b);
}

export function FixOfs(options: FixOfsOptions = {}): FixOfsSummary {
  const width = options.viewwidth ?? viewwidth;
  const height = options.viewheight ?? viewheight;
  const copy = VL_ScreenToScreen(displayofs, bufferofs, width >> 3, height);
  return {
    ...copy,
    source: displayofs,
    dest: bufferofs,
    viewwidth: width,
    viewheight: height,
  };
}

export function HitHorizDoor(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  const doornum = tilehit & 0x7f;
  const texture = ((xintercept - doorPosition(doornum, options)) >> 4) & 0xfc0;
  const height = setWallHeight(context);
  return hitDoor("horiz", texture, height, doorPage(doornum, options));
}

export function HitHorizPWall(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  const offset = (options.pwallpos ?? 0) << 10;
  let texture = (xintercept >> 4) & 0xfc0;
  if (ytilestep === -1) {
    yintercept = i32(yintercept + TILEGLOBAL - offset);
  } else {
    texture = 0xfc0 - texture;
    yintercept = i32(yintercept + offset);
  }
  const height = setWallHeight(context);
  return hitPost("pwall", "horiz", texture, height, horizwall[tilehit & 63], null);
}

export function HitHorizWall(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  let texture = (xintercept >> 4) & 0xfc0;
  if (ytilestep === -1) {
    yintercept = i32(yintercept + TILEGLOBAL);
  } else {
    texture = 0xfc0 - texture;
  }
  const height = setWallHeight(context);
  const adjacentX = xintercept >> TILESHIFT;
  const wallpic = (tilehit & 0x40) && (tilemapAt(options.tilemap, adjacentX, ytile - ytilestep) & 0x80)
    ? DOORWALL + 2
    : horizwall[tilehit & ~0x40];
  return hitPost("wall", "horiz", texture, height, wallpic, { requiredSide: 0, intercept: ytile });
}

export function HitVertDoor(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  const doornum = tilehit & 0x7f;
  const texture = ((yintercept - doorPosition(doornum, options)) >> 4) & 0xfc0;
  const height = setWallHeight(context);
  return hitDoor("vert", texture, height, doorPage(doornum, options) + 1);
}

export function HitVertPWall(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  const offset = (options.pwallpos ?? 0) << 10;
  let texture = (yintercept >> 4) & 0xfc0;
  if (xtilestep === -1) {
    xintercept = i32(xintercept + TILEGLOBAL - offset);
    texture = 0xfc0 - texture;
  } else {
    xintercept = i32(xintercept + offset);
  }
  const height = setWallHeight(context);
  return hitPost("pwall", "vert", texture, height, vertwall[tilehit & 63], null);
}

export function HitVertWall(context: ProjectionContext, options: HitWallOptions = {}): HitWallSummary {
  applyRayState(options);
  let texture = (yintercept >> 4) & 0xfc0;
  if (xtilestep === -1) {
    texture = 0xfc0 - texture;
    xintercept = i32(xintercept + TILEGLOBAL);
  } else {
    texture &= 0xfc0;
  }
  const height = setWallHeight(context);
  const adjacentY = yintercept >> TILESHIFT;
  const wallpic = (tilehit & 0x40) && (tilemapAt(options.tilemap, xtile - xtilestep, adjacentY) & 0x80)
    ? DOORWALL + 3
    : vertwall[tilehit & ~0x40];
  return hitPost("wall", "vert", texture, height, wallpic, { requiredSide: 1, intercept: xtile });
}

export function ScalePost(): ScalePostSummary | null {
  if (postwidth <= 0) {
    return null;
  }
  const summary = {
    x: postx,
    width: postwidth,
    height: wallheight[postx] ?? 0,
    texture: postsource & 0xffff,
    wallpic: postwallpic,
    side: lastside,
  };
  scaledPosts.push(summary);
  drawScalePost(summary);
  return summary;
}

export function ThreeDRefresh(options: ThreeDRefreshOptions = {}): ThreeDRefreshSummary {
  if (options.dgroup) {
    options.dgroup.view(nearOffsetForRuntimeSymbol("_spotvis"), 64 * 64).fill(0);
  }
  const screenofs = options.screenofs ?? 0;
  const originalBuffer = bufferofs;
  VL_SetBufferOffset((bufferofs + screenofs) & 0xffff);
  const clear = VGAClearScreen({ episode: options.episode, mapon: options.mapon });
  // WallRefresh's HitHoriz/VertWall need the tilemap to detect door-adjacent jamb walls
  // (`(tilehit&0x40) && (tilemap[adjacent]&0x80)` → dark DOORWALL+2/+3). Derive it from the
  // dgroup like DrawScaleds does; without it the jambs render as light regular walls.
  const wall = WallRefresh({
    ...options,
    tilemap: options.tilemap ?? options.dgroup?.view(nearOffsetForRuntimeSymbol("_tilemap"), MAPSIZE * MAPSIZE),
  });
  const drawContext: ProjectionContext = {
    viewx,
    viewy,
    viewsin,
    viewcos,
    scale: options.scale ?? 0x100,
    centerx: options.centerx ?? Math.trunc(viewwidth / 2) - 1,
    heightnumerator: options.heightnumerator ?? ((TILEGLOBAL * (options.scale ?? 0x100)) >> 6),
  };
  const scaleds = DrawScaleds(options.dgroup ?? options, {
    ...options,
    context: options.context ?? drawContext,
    spotvis: options.spotvis ?? options.dgroup?.view(nearOffsetForRuntimeSymbol("_spotvis"), MAPSIZE * MAPSIZE),
    tilemap: options.tilemap ?? options.dgroup?.view(nearOffsetForRuntimeSymbol("_tilemap"), MAPSIZE * MAPSIZE),
    wallheight,
  });
  const weapon = DrawPlayerWeapon(options.dgroup ?? options, options);
  fizzlein = options.fizzlein ?? fizzlein;
  if (fizzlein) {
    fizzlein = false;
    lasttimecount = 0;
  }
  const shown = bufferofs;
  VL_SetBufferOffset((bufferofs - screenofs) & 0xffff);
  VL_SetScreen(shown, 0);
  let nextBufferofs = bufferofs + SCREENSIZE;
  if (nextBufferofs > PAGE3START) {
    nextBufferofs = PAGE1START;
  }
  VL_SetBufferOffset(nextBufferofs);
  frameon++;
  if (!screenofs) {
    void originalBuffer;
  }
  return {
    clear,
    wall,
    scaleds,
    weapon,
    displayofs,
    nextBufferofs,
    frameon,
    fizzlein,
  };
}

export function TransformActor(
  dgroup: DOSMemory,
  actor: number,
  context: ProjectionContext,
): TransformActorSummary {
  const projection = projectPoint(
    dgroup.i32(actor + OBJ_X_OFFSET) - context.viewx,
    dgroup.i32(actor + OBJ_Y_OFFSET) - context.viewy,
    ACTORSIZE,
    context,
  );
  dgroup.setU32(actor + OBJ_TRANSX_OFFSET, projection.nx);
  dgroup.setU32(actor + OBJ_TRANSY_OFFSET, projection.ny);

  if (!projection.visible) {
    dgroup.setU16(actor + OBJ_VIEWHEIGHT_OFFSET, 0);
    return {
      actor,
      visible: false,
      nx: projection.nx,
      ny: projection.ny,
      viewx: dgroup.i16(actor + OBJ_VIEWX_OFFSET),
      viewheight: 0,
      transx: projection.nx,
      transy: projection.ny,
    };
  }

  dgroup.setU16(actor + OBJ_VIEWX_OFFSET, projection.screenx);
  dgroup.setU16(actor + OBJ_VIEWHEIGHT_OFFSET, projection.height);
  return {
    actor,
    visible: true,
    nx: projection.nx,
    ny: projection.ny,
    viewx: dgroup.i16(actor + OBJ_VIEWX_OFFSET),
    viewheight: dgroup.u16(actor + OBJ_VIEWHEIGHT_OFFSET),
    transx: projection.nx,
    transy: projection.ny,
  };
}

export function TransformTile(tx: number, ty: number, context: ProjectionContext): TransformTileSummary {
  const gx = i32((tx << TILESHIFT) + 0x8000 - context.viewx);
  const gy = i32((ty << TILESHIFT) + 0x8000 - context.viewy);
  const projection = projectPoint(gx, gy, TILE_OBJECT_SIZE, context);
  const grabbed =
    projection.visible &&
    projection.nx < TILEGLOBAL &&
    projection.ny > -TILEGLOBAL / 2 &&
    projection.ny < TILEGLOBAL / 2;
  return {
    tx,
    ty,
    grabbed,
    visible: projection.visible,
    nx: projection.nx,
    ny: projection.ny,
    dispx: projection.screenx,
    dispheight: projection.height,
  };
}

export function VGAClearScreen(options: VGAClearScreenOptions = {}): VGAClearScreenSummary {
  const episode = Math.max(0, Math.trunc(options.episode ?? 0));
  const mapon = Math.max(0, Math.trunc(options.mapon ?? 0));
  const ceilingIndex = episode * 10 + mapon;
  if (ceilingIndex >= vgaCeiling.length) {
    throw new RangeError(`VGAClearScreen ceiling index out of range: ${ceilingIndex}`);
  }

  const ceiling = vgaCeiling[ceilingIndex] & 0xff;
  const floor = 0x19;
  const rowBytes = viewwidth >> 2;
  const halfRows = viewheight >> 1;
  for (let row = 0; row < halfRows; row++) {
    fillVgaClearRow(row, rowBytes, ceiling);
  }
  for (let row = 0; row < halfRows; row++) {
    fillVgaClearRow(halfRows + row, rowBytes, floor);
  }

  return {
    ceiling,
    floor,
    rowBytes,
    topRows: halfRows,
    bottomRows: halfRows,
    bytes: rowBytes * halfRows * 2 * 4,
  };
}

export function WallRefresh(options: WallRefreshOptions = {}): WallRefreshSummary {
  if (RAY_DEBUG.active) RAY_DEBUG.refreshIdx++;
  const dgroup = options.dgroup ?? null;
  const player = options.player ?? (dgroup ? dgroup.u16(nearOffsetForRuntimeSymbol("_player")) : 0);
  const scaleValue = options.scale ?? 0x100;
  const focallength = options.focallength ?? 0;
  if (dgroup && player) {
    viewangle = dgroup.u16(player + OBJ_ANGLE_OFFSET);
    viewsin = sintable[viewangle] ?? 0;
    viewcos = costable[viewangle] ?? 0;
    viewx = i32(dgroup.i32(player + OBJ_X_OFFSET) - FixedByFrac(focallength, viewcos));
    viewy = i32(dgroup.i32(player + OBJ_Y_OFFSET) + FixedByFrac(focallength, viewsin));
    viewtx = dgroup.u16(player + OBJ_TILEX_OFFSET);
    viewty = dgroup.u16(player + OBJ_TILEY_OFFSET);
  } else if (options.context) {
    viewx = options.context.viewx;
    viewy = options.context.viewy;
    viewsin = options.context.viewsin;
    viewcos = options.context.viewcos;
  }
  viewangle = normalizeAngleForDraw(viewangle);
  midangle = viewangle * (FINEANGLES / ANGLES);
  if (!options.context) {
    viewsin = sintable[viewangle] ?? 0;
    viewcos = costable[viewangle] ?? 0;
    if (!dgroup) {
      viewx = i32(viewx - FixedByFrac(focallength, viewcos));
      viewy = i32(viewy + FixedByFrac(focallength, viewsin));
    }
  }
  void scaleValue;
  focaltx = viewx >> TILESHIFT;
  focalty = viewy >> TILESHIFT;
  if (!dgroup || !player) {
    viewtx = viewx >> TILESHIFT;
    viewty = viewy >> TILESHIFT;
  }
  xpartialdown = viewx & (TILEGLOBAL - 1);
  xpartialup = TILEGLOBAL - xpartialdown;
  ypartialdown = viewy & (TILEGLOBAL - 1);
  ypartialup = TILEGLOBAL - ypartialdown;
  lastside = -1;
  postwidth = 0;
  scaledPosts.length = 0;
  const context: ProjectionContext = {
    viewx,
    viewy,
    viewsin,
    viewcos,
    scale: scaleValue,
    centerx: options.centerx ?? Math.trunc(viewwidth / 2) - 1,
    heightnumerator: options.heightnumerator ?? ((TILEGLOBAL * scaleValue) >> 6),
  };
  const traced = AsmRefreshRuntime(context, options);
  const flushed = ScalePost();
  return {
    viewx,
    viewy,
    viewangle,
    focaltx,
    focalty,
    viewtx,
    viewty,
    flushed,
    traced,
    posts: scaledPosts.length,
  };
}

function AsmRefreshRuntime(context: ProjectionContext, options: WallRefreshOptions): number {
  if (viewwidth <= 0) {
    return 0;
  }

  const dgroup = options.dgroup ?? null;
  const tilemapOffset = dgroup ? nearOffsetForRuntimeSymbol("_tilemap") : 0;
  const spotvisOffset = dgroup ? nearOffsetForRuntimeSymbol("_spotvis") : 0;
  const doorpositionOffset = dgroup ? nearOffsetForRuntimeSymbol("_doorposition") : 0;
  const pwallposValue = dgroup ? dgroup.u16(nearOffsetForRuntimeSymbol("_pwallpos")) : 0;
  let traced = 0;

  for (pixx = 0; pixx < viewwidth; pixx++) {
    let rayAngle = midangle + (pixelangle[pixx] ?? 0);
    if (rayAngle < 0) {
      rayAngle += FINEANGLES;
    } else if (rayAngle >= DEG360) {
      rayAngle -= FINEANGLES;
    }

    const partials = setupRayPartials(rayAngle);
    xtilestep = partials.xtilestep;
    ytilestep = partials.ytilestep;
    xstep = partials.xstep;
    ystep = partials.ystep;

    yintercept = i32(viewy + fixedStepByPartial(ystep, partials.xpartial));
    xtile = focaltx + xtilestep;
    let yinttile = yintercept >> TILESHIFT;

    xintercept = i32(viewx + fixedStepByPartial(xstep, partials.ypartial));
    let xinttile = xintercept >> TILESHIFT;
    ytile = focalty + ytilestep;

    let entry: "vertcheck" | "horizcheck" = "vertcheck";
    let guard = 0;
    const traceThis = RAY_DEBUG.active && pixx === RAY_DEBUG.onlyPixx && RAY_DEBUG.refreshIdx === RAY_DEBUG.onlyRefresh;
    if (traceThis) {
      RAY_DEBUG.iters.push({ k: "init", xtile, ytile, yinttile, xinttile, xintercept, yintercept, xstep, ystep, xtilestep, ytilestep, focaltx, focalty });
    }
    while (guard++ < MAPSIZE * 4) {
      let verticalEntry: boolean;
      if (entry === "vertcheck") {
        const enterHorizontal =
          ytilestep === -1
            ? yinttile <= ytile
            : yinttile >= ytile;
        verticalEntry = !enterHorizontal;
      } else {
        verticalEntry =
          xtilestep === -1
            ? xinttile <= xtile
            : xinttile >= xtile;
      }

      if (traceThis) {
        const checkX = verticalEntry ? xtile : xinttile;
        const checkY = verticalEntry ? yinttile : ytile;
        RAY_DEBUG.iters.push({ k: verticalEntry ? "vert" : "horiz", entry, xtile, ytile, yinttile, xinttile, xintercept, yintercept, check: [checkX, checkY], hit: readRayTile(dgroup, tilemapOffset, options.tilemap, checkX, checkY) });
      }

      if (verticalEntry) {
        const hit = readRayTile(dgroup, tilemapOffset, options.tilemap, xtile, yinttile);
        if (hit) {
          if (
            handleVerticalHit(context, options, dgroup, doorpositionOffset, pwallposValue, hit, xtile, yinttile)
          ) {
            traced++;
            break;
          }
        }
        markRaySpot(dgroup, spotvisOffset, options.spotvis, xtile, yinttile);
        if (RAY_DEBUG.active && RAY_DEBUG.tiles.has(xtile * 64 + yinttile)) {
          RAY_DEBUG.log.push({ tile: [xtile, yinttile], side: "vert", refreshIdx: RAY_DEBUG.refreshIdx, pixx, rayAngle, xstep, ystep, xtilestep, ytilestep, xintercept, yintercept, xtile, ytile, xinttile, yinttile });
        }
        xtile += xtilestep;
        yintercept = i32(yintercept + ystep);
        yinttile = yintercept >> TILESHIFT;
        entry = "vertcheck";
        continue;
      }

      const hit = readRayTile(dgroup, tilemapOffset, options.tilemap, xinttile, ytile);
      if (hit) {
        if (
          handleHorizontalHit(context, options, dgroup, doorpositionOffset, pwallposValue, hit, xinttile, ytile)
        ) {
          traced++;
          break;
        }
      }
      markRaySpot(dgroup, spotvisOffset, options.spotvis, xinttile, ytile);
      if (RAY_DEBUG.active && RAY_DEBUG.tiles.has(xinttile * 64 + ytile)) {
        RAY_DEBUG.log.push({ tile: [xinttile, ytile], side: "horiz", refreshIdx: RAY_DEBUG.refreshIdx, pixx, rayAngle, xstep, ystep, xtilestep, ytilestep, xintercept, yintercept, xtile, ytile, xinttile, yinttile });
      }
      ytile += ytilestep;
      xintercept = i32(xintercept + xstep);
      xinttile = xintercept >> TILESHIFT;
      entry = "horizcheck";
    }
  }

  return traced;
}

function setupRayPartials(rayAngle: number): {
  readonly xtilestep: number;
  readonly ytilestep: number;
  readonly xstep: number;
  readonly ystep: number;
  readonly xpartial: number;
  readonly ypartial: number;
} {
  if (rayAngle < DEG90) {
    return {
      xtilestep: 1,
      ytilestep: -1,
      xstep: tangentAt(DEG90 - 1 - rayAngle),
      ystep: -tangentAt(rayAngle),
      xpartial: xpartialup,
      ypartial: ypartialdown,
    };
  }
  if (rayAngle < DEG180) {
    return {
      xtilestep: -1,
      ytilestep: -1,
      xstep: -tangentAt(rayAngle - DEG90),
      ystep: -tangentAt(DEG180 - 1 - rayAngle),
      xpartial: xpartialdown,
      ypartial: ypartialdown,
    };
  }
  if (rayAngle < DEG270) {
    return {
      xtilestep: -1,
      ytilestep: 1,
      xstep: -tangentAt(DEG270 - 1 - rayAngle),
      ystep: tangentAt(rayAngle - DEG180),
      xpartial: xpartialdown,
      ypartial: ypartialup,
    };
  }
  return {
    xtilestep: 1,
    ytilestep: 1,
    xstep: tangentAt(rayAngle - DEG270),
    ystep: tangentAt(DEG360 - 1 - rayAngle),
    xpartial: xpartialup,
    ypartial: ypartialup,
  };
}

function tangentAt(index: number): number {
  const clamped = Math.max(0, Math.min(finetangent.length - 1, Math.trunc(index)));
  return finetangent[clamped] ?? 0;
}

function fixedStepByPartial(step: number, partial: number): number {
  const product = Math.abs(step) * (partial & 0xffff);
  const value = Math.floor(product / TILEGLOBAL);
  return i32(step < 0 ? -value : value);
}

function halfFixedStep(step: number): number {
  return i32(step) >> 1;
}

function fixedStepByPWall(step: number, pwallpos: number): number {
  const product = Math.abs(step) * (pwallpos & 63);
  const value = Math.floor(product / 64);
  return i32(step < 0 ? -value : value);
}

function readRayTile(
  dgroup: DOSMemory | null,
  tilemapOffset: number,
  map: Uint8Array | Uint16Array | readonly number[] | undefined,
  x: number,
  y: number,
): number {
  if (x < 0 || y < 0 || x >= MAPSIZE || y >= MAPSIZE) {
    return 1;
  }
  const index = x * MAPSIZE + y;
  if (map) {
    return (map[index] ?? 0) & 0xff;
  }
  return dgroup ? dgroup.u8(tilemapOffset + index) : 0;
}

function markRaySpot(
  dgroup: DOSMemory | null,
  spotvisOffset: number,
  spotvis: Uint8Array | Uint16Array | readonly number[] | undefined,
  x: number,
  y: number,
): void {
  if (x < 0 || y < 0 || x >= MAPSIZE || y >= MAPSIZE) {
    return;
  }
  const index = x * MAPSIZE + y;
  if (dgroup) {
    dgroup.setU8(spotvisOffset + index, 1);
  } else if (spotvis instanceof Uint8Array || spotvis instanceof Uint16Array) {
    spotvis[index] = 1;
  }
}

function handleVerticalHit(
  context: ProjectionContext,
  options: WallRefreshOptions,
  dgroup: DOSMemory | null,
  doorpositionOffset: number,
  pwallposValue: number,
  hit: number,
  hitX: number,
  hitY: number,
): boolean {
  // NOTE: do NOT assign the DDA's module-level xtile/ytile here. In the asm
  // (WL_DR_A.ASM vertdoor) xtile/yinttile are saved+restored and ytile (bp) is
  // never touched, so a *passed* door leaves the trace variables intact. Render
  // hit-functions receive their coords via options (xtile/ytile below), so the
  // globals are unneeded — and assigning ytile=hitY here corrupted the
  // horizontal track on every passed vertical door (demo-140 raycaster bug).
  tilehit = hit;

  if (hit & 0x80) {
    if (hit & 0x40) {
      const movedIntercept = i32(yintercept + fixedStepByPWall(ystep, pwallposValue));
      if ((movedIntercept >> TILESHIFT) !== hitY) {
        return false;
      }
      yintercept = movedIntercept;
      xintercept = hitX << TILESHIFT;
      HitVertPWall(context, {
        ...options,
        tilehit: hit,
        pixx,
        xtile: hitX,
        ytile: hitY,
        xtilestep,
        ytilestep,
        xintercept,
        yintercept,
        pwallpos: pwallposValue,
      });
      return true;
    }

    const doorIntercept = i32(yintercept + halfFixedStep(ystep));
    if ((doorIntercept >> TILESHIFT) !== hitY) {
      return false;
    }
    const doornum = hit & 0x7f;
    if ((doorIntercept & 0xffff) < readDoorPosition(dgroup, doorpositionOffset, doornum)) {
      return false;
    }
    yintercept = doorIntercept;
    xintercept = (hitX << TILESHIFT) + 0x8000;
    HitVertDoor(context, {
      ...options,
      tilehit: hit,
      pixx,
      xtile: hitX,
      ytile: hitY,
      xtilestep,
      ytilestep,
      xintercept,
      yintercept,
    });
    return true;
  }

  xintercept = hitX << TILESHIFT;
  HitVertWall(context, {
    ...options,
    tilehit: hit,
    pixx,
    xtile: hitX,
    ytile: hitY,
    xtilestep,
    ytilestep,
    xintercept,
    yintercept,
  });
  return true;
}

function handleHorizontalHit(
  context: ProjectionContext,
  options: WallRefreshOptions,
  dgroup: DOSMemory | null,
  doorpositionOffset: number,
  pwallposValue: number,
  hit: number,
  hitX: number,
  hitY: number,
): boolean {
  // See handleVerticalHit: a *passed* horizontal door must not corrupt the DDA's
  // xtile (vertical track). The asm (horizdoor) saves+restores xtile/yinttile and
  // never touches it on a pass; render coords come via options.
  tilehit = hit;

  if (hit & 0x80) {
    if (hit & 0x40) {
      const movedIntercept = i32(xintercept + fixedStepByPWall(xstep, pwallposValue));
      if ((movedIntercept >> TILESHIFT) !== hitX) {
        return false;
      }
      xintercept = movedIntercept;
      yintercept = hitY << TILESHIFT;
      HitHorizPWall(context, {
        ...options,
        tilehit: hit,
        pixx,
        xtile: hitX,
        ytile: hitY,
        xtilestep,
        ytilestep,
        xintercept,
        yintercept,
        pwallpos: pwallposValue,
      });
      return true;
    }

    const doorIntercept = i32(xintercept + halfFixedStep(xstep));
    if ((doorIntercept >> TILESHIFT) !== hitX) {
      return false;
    }
    const doornum = hit & 0x7f;
    if ((doorIntercept & 0xffff) < readDoorPosition(dgroup, doorpositionOffset, doornum)) {
      return false;
    }
    xintercept = doorIntercept;
    yintercept = (hitY << TILESHIFT) + 0x8000;
    HitHorizDoor(context, {
      ...options,
      tilehit: hit,
      pixx,
      xtile: hitX,
      ytile: hitY,
      xtilestep,
      ytilestep,
      xintercept,
      yintercept,
    });
    return true;
  }

  yintercept = hitY << TILESHIFT;
  HitHorizWall(context, {
    ...options,
    tilehit: hit,
    pixx,
    xtile: hitX,
    ytile: hitY,
    xtilestep,
    ytilestep,
    xintercept,
    yintercept,
  });
  return true;
}

function readDoorPosition(dgroup: DOSMemory | null, doorpositionOffset: number, door: number): number {
  return dgroup ? dgroup.u16(doorpositionOffset + door * 2) : 0;
}

function applyRayState(options: RayStateOptions): void {
  tilehit = options.tilehit ?? tilehit;
  pixx = options.pixx ?? pixx;
  xtile = options.xtile ?? xtile;
  ytile = options.ytile ?? ytile;
  xtilestep = options.xtilestep ?? xtilestep;
  ytilestep = options.ytilestep ?? ytilestep;
  xintercept = options.xintercept ?? xintercept;
  yintercept = options.yintercept ?? yintercept;
}

function setWallHeight(context: ProjectionContext): number {
  const height = CalcHeight(xintercept, yintercept, context);
  wallheight[pixx] = height;
  return height;
}

function hitDoor(
  side: "horiz" | "vert",
  texture: number,
  height: number,
  wallpic: number,
): HitWallSummary {
  if (lasttilehit === tilehit) {
    if (texture === (postsource & 0xffff)) {
      postwidth++;
      wallheight[pixx] = wallheight[pixx - 1] ?? height;
      return hitSummary("door", side, true, texture, height, wallpic, null);
    }
    const flushed = ScalePost();
    postsource = texture;
    postwidth = 1;
    postx = pixx;
    postwallpic = wallpic;
    return hitSummary("door", side, false, texture, height, wallpic, flushed);
  }

  const flushed = lastside !== -1 ? ScalePost() : null;
  lastside = 2;
  lasttilehit = tilehit;
  postx = pixx;
  postwidth = 1;
  postsource = texture;
  postwallpic = wallpic;
  return hitSummary("door", side, false, texture, height, wallpic, flushed);
}

function hitPost(
  kind: "wall" | "pwall",
  side: "horiz" | "vert",
  texture: number,
  height: number,
  wallpic: number,
  continuity: { readonly requiredSide: number; readonly intercept: number } | null,
): HitWallSummary {
  const sameWall = continuity
    ? lastside === continuity.requiredSide &&
      lastintercept === continuity.intercept &&
      lasttilehit === tilehit
    : lasttilehit === tilehit;
  if (sameWall) {
    if (texture === (postsource & 0xffff)) {
      postwidth++;
      wallheight[pixx] = wallheight[pixx - 1] ?? height;
      return hitSummary(kind, side, true, texture, height, wallpic, null);
    }
    const flushed = ScalePost();
    postsource = texture;
    postwidth = 1;
    postx = pixx;
    postwallpic = wallpic;
    return hitSummary(kind, side, false, texture, height, wallpic, flushed);
  }

  const flushed = lastside !== -1 ? ScalePost() : null;
  if (continuity) {
    lastside = continuity.requiredSide;
    lastintercept = continuity.intercept;
  } else {
    lastside = side === "vert" ? 1 : 0;
  }
  lasttilehit = tilehit;
  postx = pixx;
  postwidth = 1;
  postsource = texture;
  postwallpic = wallpic;
  return hitSummary(kind, side, false, texture, height, wallpic, flushed);
}

function hitSummary(
  kind: "wall" | "door" | "pwall",
  side: "horiz" | "vert",
  optimized: boolean,
  texture: number,
  height: number,
  wallpic: number,
  flushed: ScalePostSummary | null,
): HitWallSummary {
  return { kind, side, optimized, texture, height, postx, postwidth, wallpic, flushed };
}

function doorPosition(door: number, options: HitWallOptions): number {
  if (options.doorPositions?.[door] !== undefined) {
    return options.doorPositions[door];
  }
  if (options.dgroup) {
    return options.dgroup.u16(nearOffsetForRuntimeSymbol("_doorposition") + door * 2);
  }
  return 0;
}

function doorPage(door: number, options: HitWallOptions): number {
  let lock = options.doorLocks?.[door] ?? DR_NORMAL;
  if (options.dgroup) {
    const doorobj = nearOffsetForRuntimeSymbol("_doorobjlist") + door * STRUCT_LAYOUTS.doorobj_t.bytes;
    lock = options.dgroup.u16(doorobj + 4);
  }
  if (lock >= DR_LOCK1 && lock <= DR_LOCK4) {
    return DOORWALL + 6;
  }
  if (lock === DR_ELEVATOR) {
    return DOORWALL + 4;
  }
  return DOORWALL;
}

function tilemapAt(map: Uint8Array | Uint16Array | readonly number[] | undefined, x: number, y: number): number {
  if (!map || x < 0 || y < 0 || x >= MAPSIZE || y >= MAPSIZE) {
    return 0;
  }
  return map[x * MAPSIZE + y] ?? 0;
}

function readStaticObjects(dgroup: DOSMemory | null, options: DrawScaledsOptions): StaticRenderObject[] {
  if (!dgroup) {
    return [];
  }
  const statobjlist = nearOffsetForRuntimeSymbol("_statobjlist");
  const laststatobj = dgroup.u16(nearOffsetForRuntimeSymbol("_laststatobj"));
  const bytes = STRUCT_LAYOUTS.statobj_t.bytes;
  const statics: StaticRenderObject[] = [];
  for (let stat = statobjlist; stat < laststatobj; stat += bytes) {
    const visspot = dgroup.u16(stat + STAT_VISSPOT_OFFSET);
    statics.push({
      statobj: stat,
      tilex: dgroup.u8(stat + STAT_TILEX_OFFSET),
      tiley: dgroup.u8(stat + STAT_TILEY_OFFSET),
      shapenum: dgroup.i16(stat + STAT_SHAPENUM_OFFSET),
      visible: visspot ? dgroup.u8(visspot) !== 0 : false,
      flags: dgroup.u8(stat + STAT_FLAGS_OFFSET),
    });
  }
  void options;
  return statics;
}

function readActiveObjects(dgroup: DOSMemory | null, options: DrawScaledsOptions): ActiveRenderObject[] {
  if (!dgroup) {
    return [];
  }
  const player = dgroup.u16(nearOffsetForRuntimeSymbol("_player"));
  const actors: ActiveRenderObject[] = [];
  for (let actor = dgroup.u16(player + OBJ_NEXT_OFFSET); actor; actor = dgroup.u16(actor + OBJ_NEXT_OFFSET)) {
    let shapenum = shapeForActorState(dgroup, actor);
    if (!shapenum) {
      continue;
    }
    if (!actorVisible(dgroup, actor, options)) {
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) & ~FL_VISABLE);
      continue;
    }
    if (options.context) {
      const transformed = TransformActor(dgroup, actor, options.context);
      dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);
      if (!transformed.viewheight) {
        continue;
      }
      if (shapenum === -1) {
        shapenum = dgroup.u16(actor + OBJ_TEMP1_OFFSET);
      }
      if (actorStateRotate(dgroup, actor)) {
        shapenum += CalcRotate(dgroup, actor);
      }
      dgroup.setU8(actor + OBJ_FLAGS_OFFSET, dgroup.u8(actor + OBJ_FLAGS_OFFSET) | FL_VISABLE);
      actors.push({ actor, viewx: transformed.viewx, viewheight: transformed.viewheight, shapenum });
    } else {
      actors.push({
        actor,
        viewx: dgroup.i16(actor + OBJ_VIEWX_OFFSET),
        viewheight: dgroup.u16(actor + OBJ_VIEWHEIGHT_OFFSET),
        shapenum,
      });
    }
  }
  return actors;
}

function actorVisible(dgroup: DOSMemory, actor: number, options: DrawScaledsOptions): boolean {
  if (!options.spotvis) {
    return true;
  }
  const x = dgroup.u16(actor + OBJ_TILEX_OFFSET);
  const y = dgroup.u16(actor + OBJ_TILEY_OFFSET);
  const offsets = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 1],
    [0, 1],
    [1, 1],
  ] as const;
  return offsets.some(([dx, dy]) => {
    const sx = x + dx;
    const sy = y + dy;
    if (sx < 0 || sy < 0 || sx >= MAPSIZE || sy >= MAPSIZE) {
      return false;
    }
    const spot = options.spotvis?.[sx * MAPSIZE + sy] ?? 0;
    const tile = options.tilemap?.[sx * MAPSIZE + sy] ?? 0;
    return spot !== 0 && (dx === 0 && dy === 0 || tile === 0);
  });
}

function shapeForActorState(dgroup: DOSMemory, actor: number): number {
  const renderInfo = stateRenderInfoForActor(dgroup, actor);
  if (renderInfo) {
    return renderInfo.shapenum;
  }
  const state = dgroup.u16(actor + OBJ_STATE_OFFSET);
  return state ? dgroup.i16(state + STATE_SHAPENUM_OFFSET) : 0;
}

function stateRenderInfoForActor(
  dgroup: DOSMemory,
  actor: number,
): { readonly rotate: number; readonly shapenum: number } | null {
  const state = dgroup.u16(actor + OBJ_STATE_OFFSET);
  if (!state) {
    return null;
  }
  for (const symbol of STATETYPE_SYMBOLS) {
    if (Number.parseInt(symbol.nearOffset, 16) === state) {
      return STATE_RENDER_INFO[symbol.name] ?? null;
    }
  }
  return null;
}

function gamestateFieldOffset(name: string): number {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing gamestate field ${name}`);
  }
  return field[1];
}

function normalizeAngleForDraw(value: number): number {
  let normalized = value % ANGLES;
  if (normalized < 0) {
    normalized += ANGLES;
  }
  return normalized;
}

function projectPoint(
  gx: number,
  gy: number,
  forwardFudge: number,
  context: ProjectionContext,
): { readonly visible: boolean; readonly nx: number; readonly ny: number; readonly screenx: number; readonly height: number } {
  const gxt = FixedByFracMemory(gx, context.viewcos);
  const gyt = FixedByFracMemory(gy, context.viewsin);
  const nx = i32(gxt - gyt - forwardFudge);
  const nxMindist = context.mindist ?? MINDIST;

  const yGxt = FixedByFracMemory(gx, context.viewsin);
  const yGyt = FixedByFracMemory(gy, context.viewcos);
  const ny = i32(yGyt + yGxt);

  if (nx < nxMindist) {
    return { visible: false, nx, ny, screenx: 0, height: 0 };
  }

  const centerx = context.centerx ?? 0;
  const heightnumerator = context.heightnumerator ?? ((TILEGLOBAL * context.scale) >> 6);
  const screenxNumerator = i32(ny * context.scale);
  const screenx = i16(centerx + cdiv(screenxNumerator, nx));
  const heightDivisor = nx >> 8;
  const height = heightDivisor ? cdiv(heightnumerator, heightDivisor) : 0;
  return { visible: true, nx, ny, screenx, height };
}

function actorStateRotate(dgroup: DOSMemory, actor: number): number {
  const renderInfo = stateRenderInfoForActor(dgroup, actor);
  if (renderInfo) {
    return renderInfo.rotate;
  }
  const state = dgroup.u16(actor + OBJ_STATE_OFFSET);
  return state ? dgroup.u16(state + STATE_ROTATE_OFFSET) : 0;
}

// Compiled-scaler comptable cache by (post-height, viewheight). The wall scaler maps each
// SOURCE texel to a fixed-point run of screen rows (`fix += step`), exactly like the DOS
// compiled scalers and the sprite scaler — not a naive screen->source division.
const wallScaleCache = new Map<string, CompScale>();
function wallCompScale(scaledHeight: number): CompScale {
  const key = `${scaledHeight},${viewheight}`;
  let comp = wallScaleCache.get(key);
  if (!comp) {
    comp = buildCompScale(scaledHeight, { viewheight });
    wallScaleCache.set(key, comp);
  }
  return comp;
}

function drawScalePost(summary: ScalePostSummary): void {
  if (viewheight <= 0 || summary.wallpic < 0) {
    return;
  }

  let page: Uint8Array;
  try {
    page = PM_GetPage(summary.wallpic);
  } catch {
    return;
  }
  if (page.length < 64 * 64) {
    return;
  }

  const textureBase = summary.texture & 0xfc0;
  const startX = Math.max(0, summary.x);
  const endX = Math.min(viewwidth, summary.x + summary.width);
  for (let x = startX; x < endX; x++) {
    const rawHeight = wallheight[x] || summary.height;
    // DOS ScalePost: `mov bp,[wallheight]; and bp,0xfff8 (=heightscaler*4); call the
    // compiled scaler` — the drawn post height is `(wallheight & 0xfff8) >> 2` (~2x the
    // integer height; the low 3 bits are fractional). `>> 3` drew walls at HALF height.
    const scaledHeight = Math.max(1, (rawHeight & 0xfff8) >> 2);
    const comp = wallCompScale(scaledHeight);
    let screenRow = comp.topPix;
    for (let src = 0; src < 64; src++) {
      const runLength = comp.width[src] ?? 0;
      if (runLength <= 0) {
        continue;
      }
      const color = page[textureBase + src] ?? 0;
      for (let i = 0; i < runLength; i++) {
        const y = screenRow + i;
        if (y >= 0 && y < viewheight) {
          writeViewPixel(x, y, color);
        }
      }
      screenRow += runLength;
    }
  }
}

function writeViewPixel(x: number, y: number, color: number): void {
  const plane = x & 3;
  const offset = (bufferofs + y * VGA_SCREEN_STRIDE + (x >> 2)) & 0xffff;
  videoPlanes[plane * VIDEO_PLANE_BYTES + offset] = color & 0xff;
}

function fillVgaClearRow(row: number, rowBytes: number, color: number): void {
  const offset = (bufferofs + row * VGA_SCREEN_STRIDE) & 0xffff;
  for (let plane = 0; plane < 4; plane++) {
    videoPlanes.fill(color & 0xff, plane * VIDEO_PLANE_BYTES + offset, plane * VIDEO_PLANE_BYTES + offset + rowBytes);
  }
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_DRAW.C
// 
// #include "WL_DEF.H"
// #include <DOS.H>
// #pragma hdrstop
// 
// //#define DEBUGWALLS
// //#define DEBUGTICS
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// // the door is the last picture before the sprites
// #define DOORWALL	(PMSpriteStart-8)
// 
// #define ACTORSIZE	0x4000
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// #ifdef DEBUGWALLS
// unsigned screenloc[3]= {0,0,0};
// #else
// unsigned screenloc[3]= {PAGE1START,PAGE2START,PAGE3START};
// #endif
// unsigned freelatch = FREESTART;
// 
// long 	lasttimecount;
// long 	frameon;
// 
// unsigned	wallheight[MAXVIEWWIDTH];
// 
// fixed	tileglobal	= TILEGLOBAL;
// fixed	mindist		= MINDIST;
// 
// 
// //
// // math tables
// //
// int			pixelangle[MAXVIEWWIDTH];
// long		far finetangent[FINEANGLES/4];
// fixed 		far sintable[ANGLES+ANGLES/4],far *costable = sintable+(ANGLES/4);
// 
// //
// // refresh variables
// //
// fixed	viewx,viewy;			// the focal point
// int		viewangle;
// fixed	viewsin,viewcos;
// 
// 
// 
// fixed	FixedByFrac (fixed a, fixed b);
// void	TransformActor (objtype *ob);
// void	BuildTables (void);
// void	ClearScreen (void);
// int		CalcRotate (objtype *ob);
// void	DrawScaleds (void);
// void	CalcTics (void);
// void	FixOfs (void);
// void	ThreeDRefresh (void);
// 
// 
// 
// //
// // wall optimization variables
// //
// int		lastside;		// true for vertical
// long	lastintercept;
// int		lasttilehit;
// 
// 
// //
// // ray tracing variables
// //
// int			focaltx,focalty,viewtx,viewty;
// 
// int			midangle,angle;
// unsigned	xpartial,ypartial;
// unsigned	xpartialup,xpartialdown,ypartialup,ypartialdown;
// unsigned	xinttile,yinttile;
// 
// unsigned	tilehit;
// unsigned	pixx;
// 
// int		xtile,ytile;
// int		xtilestep,ytilestep;
// long	xintercept,yintercept;
// long	xstep,ystep;
// 
// int		horizwall[MAXWALLTILES],vertwall[MAXWALLTILES];
// 
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
// void AsmRefresh (void);			// in WL_DR_A.ASM
// 
// /*
// ============================================================================
// 
// 			   3 - D  DEFINITIONS
// 
// ============================================================================
// */
// 
// 
// //==========================================================================
// 
// 
// /*
// ========================
// =
// = FixedByFrac
// =
// = multiply a 16/16 bit, 2's complement fixed point number by a 16 bit
// = fraction, passed as a signed magnitude 32 bit number
// =
// ========================
// */
// 
// #pragma warn -rvl			// I stick the return value in with ASMs
// 
// fixed FixedByFrac (fixed a, fixed b)
// {
// //
// // setup
// //
// asm	mov	si,[WORD PTR b+2]	// sign of result = sign of fraction
// 
// asm	mov	ax,[WORD PTR a]
// asm	mov	cx,[WORD PTR a+2]
// 
// asm	or	cx,cx
// asm	jns	aok:				// negative?
// asm	neg	cx
// asm	neg	ax
// asm	sbb	cx,0
// asm	xor	si,0x8000			// toggle sign of result
// aok:
// 
// //
// // multiply  cx:ax by bx
// //
// asm	mov	bx,[WORD PTR b]
// asm	mul	bx					// fraction*fraction
// asm	mov	di,dx				// di is low word of result
// asm	mov	ax,cx				//
// asm	mul	bx					// units*fraction
// asm add	ax,di
// asm	adc	dx,0
// 
// //
// // put result dx:ax in 2's complement
// //
// asm	test	si,0x8000		// is the result negative?
// asm	jz	ansok:
// asm	neg	dx
// asm	neg	ax
// asm	sbb	dx,0
// 
// ansok:;
// 
// }
// 
// #pragma warn +rvl
// 
// //==========================================================================
// 
// /*
// ========================
// =
// = TransformActor
// =
// = Takes paramaters:
// =   gx,gy		: globalx/globaly of point
// =
// = globals:
// =   viewx,viewy		: point of view
// =   viewcos,viewsin	: sin/cos of viewangle
// =   scale		: conversion from global value to screen value
// =
// = sets:
// =   screenx,transx,transy,screenheight: projected edge location and size
// =
// ========================
// */
// 
// 
// //
// // transform actor
// //
// void TransformActor (objtype *ob)
// {
// 	int ratio;
// 	fixed gx,gy,gxt,gyt,nx,ny;
// 	long	temp;
// 
// //
// // translate point to view centered coordinates
// //
// 	gx = ob->x-viewx;
// 	gy = ob->y-viewy;
// 
// //
// // calculate newx
// //
// 	gxt = FixedByFrac(gx,viewcos);
// 	gyt = FixedByFrac(gy,viewsin);
// 	nx = gxt-gyt-ACTORSIZE;		// fudge the shape forward a bit, because
// 								// the midpoint could put parts of the shape
// 								// into an adjacent wall
// 
// //
// // calculate newy
// //
// 	gxt = FixedByFrac(gx,viewsin);
// 	gyt = FixedByFrac(gy,viewcos);
// 	ny = gyt+gxt;
// 
// //
// // calculate perspective ratio
// //
// 	ob->transx = nx;
// 	ob->transy = ny;
// 
// 	if (nx<mindist)			// too close, don't overflow the divide
// 	{
// 	  ob->viewheight = 0;
// 	  return;
// 	}
// 
// 	ob->viewx = centerx + ny*scale/nx;	// DEBUG: use assembly divide
// 
// //
// // calculate height (heightnumerator/(nx>>8))
// //
// 	asm	mov	ax,[WORD PTR heightnumerator]
// 	asm	mov	dx,[WORD PTR heightnumerator+2]
// 	asm	idiv	[WORD PTR nx+1]			// nx>>8
// 	asm	mov	[WORD PTR temp],ax
// 	asm	mov	[WORD PTR temp+2],dx
// 
// 	ob->viewheight = temp;
// }
// 
// //==========================================================================
// 
// /*
// ========================
// =
// = TransformTile
// =
// = Takes paramaters:
// =   tx,ty		: tile the object is centered in
// =
// = globals:
// =   viewx,viewy		: point of view
// =   viewcos,viewsin	: sin/cos of viewangle
// =   scale		: conversion from global value to screen value
// =
// = sets:
// =   screenx,transx,transy,screenheight: projected edge location and size
// =
// = Returns true if the tile is withing getting distance
// =
// ========================
// */
// 
// boolean TransformTile (int tx, int ty, int *dispx, int *dispheight)
// {
// 	int ratio;
// 	fixed gx,gy,gxt,gyt,nx,ny;
// 	long	temp;
// 
// //
// // translate point to view centered coordinates
// //
// 	gx = ((long)tx<<TILESHIFT)+0x8000-viewx;
// 	gy = ((long)ty<<TILESHIFT)+0x8000-viewy;
// 
// //
// // calculate newx
// //
// 	gxt = FixedByFrac(gx,viewcos);
// 	gyt = FixedByFrac(gy,viewsin);
// 	nx = gxt-gyt-0x2000;		// 0x2000 is size of object
// 
// //
// // calculate newy
// //
// 	gxt = FixedByFrac(gx,viewsin);
// 	gyt = FixedByFrac(gy,viewcos);
// 	ny = gyt+gxt;
// 
// 
// //
// // calculate perspective ratio
// //
// 	if (nx<mindist)			// too close, don't overflow the divide
// 	{
// 		*dispheight = 0;
// 		return false;
// 	}
// 
// 	*dispx = centerx + ny*scale/nx;	// DEBUG: use assembly divide
// 
// //
// // calculate height (heightnumerator/(nx>>8))
// //
// 	asm	mov	ax,[WORD PTR heightnumerator]
// 	asm	mov	dx,[WORD PTR heightnumerator+2]
// 	asm	idiv	[WORD PTR nx+1]			// nx>>8
// 	asm	mov	[WORD PTR temp],ax
// 	asm	mov	[WORD PTR temp+2],dx
// 
// 	*dispheight = temp;
// 
// //
// // see if it should be grabbed
// //
// 	if (nx<TILEGLOBAL && ny>-TILEGLOBAL/2 && ny<TILEGLOBAL/2)
// 		return true;
// 	else
// 		return false;
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = CalcHeight
// =
// = Calculates the height of xintercept,yintercept from viewx,viewy
// =
// ====================
// */
// 
// #pragma warn -rvl			// I stick the return value in with ASMs
// 
// int	CalcHeight (void)
// {
// 	int	transheight;
// 	int ratio;
// 	fixed gxt,gyt,nx,ny;
// 	long	gx,gy;
// 
// 	gx = xintercept-viewx;
// 	gxt = FixedByFrac(gx,viewcos);
// 
// 	gy = yintercept-viewy;
// 	gyt = FixedByFrac(gy,viewsin);
// 
// 	nx = gxt-gyt;
// 
//   //
//   // calculate perspective ratio (heightnumerator/(nx>>8))
//   //
// 	if (nx<mindist)
// 		nx=mindist;			// don't let divide overflow
// 
// 	asm	mov	ax,[WORD PTR heightnumerator]
// 	asm	mov	dx,[WORD PTR heightnumerator+2]
// 	asm	idiv	[WORD PTR nx+1]			// nx>>8
// }
// 
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = ScalePost
// =
// ===================
// */
// 
// long		postsource;
// unsigned	postx;
// unsigned	postwidth;
// 
// void	near ScalePost (void)		// VGA version
// {
// 	asm	mov	ax,SCREENSEG
// 	asm	mov	es,ax
// 
// 	asm	mov	bx,[postx]
// 	asm	shl	bx,1
// 	asm	mov	bp,WORD PTR [wallheight+bx]		// fractional height (low 3 bits frac)
// 	asm	and	bp,0xfff8				// bp = heightscaler*4
// 	asm	shr	bp,1
// 	asm	cmp	bp,[maxscaleshl2]
// 	asm	jle	heightok
// 	asm	mov	bp,[maxscaleshl2]
// heightok:
// 	asm	add	bp,OFFSET fullscalefarcall
// 	//
// 	// scale a byte wide strip of wall
// 	//
// 	asm	mov	bx,[postx]
// 	asm	mov	di,bx
// 	asm	shr	di,2						// X in bytes
// 	asm	add	di,[bufferofs]
// 
// 	asm	and	bx,3
// 	asm	shl	bx,3						// bx = pixel*8+pixwidth
// 	asm	add	bx,[postwidth]
// 
// 	asm	mov	al,BYTE PTR [mapmasks1-1+bx]	// -1 because no widths of 0
// 	asm	mov	dx,SC_INDEX+1
// 	asm	out	dx,al						// set bit mask register
// 	asm	lds	si,DWORD PTR [postsource]
// 	asm	call DWORD PTR [bp]				// scale the line of pixels
// 
// 	asm	mov	al,BYTE PTR [ss:mapmasks2-1+bx]   // -1 because no widths of 0
// 	asm	or	al,al
// 	asm	jz	nomore
// 
// 	//
// 	// draw a second byte for vertical strips that cross two bytes
// 	//
// 	asm	inc	di
// 	asm	out	dx,al						// set bit mask register
// 	asm	call DWORD PTR [bp]				// scale the line of pixels
// 
// 	asm	mov	al,BYTE PTR [ss:mapmasks3-1+bx]	// -1 because no widths of 0
// 	asm	or	al,al
// 	asm	jz	nomore
// 	//
// 	// draw a third byte for vertical strips that cross three bytes
// 	//
// 	asm	inc	di
// 	asm	out	dx,al						// set bit mask register
// 	asm	call DWORD PTR [bp]				// scale the line of pixels
// 
// 
// nomore:
// 	asm	mov	ax,ss
// 	asm	mov	ds,ax
// }
// 
// void  FarScalePost (void)				// just so other files can call
// {
// 	ScalePost ();
// }
// 
// 
// /*
// ====================
// =
// = HitVertWall
// =
// = tilehit bit 7 is 0, because it's not a door tile
// = if bit 6 is 1 and the adjacent tile is a door tile, use door side pic
// =
// ====================
// */
// 
// void HitVertWall (void)
// {
// 	int			wallpic;
// 	unsigned	texture;
// 
// 	texture = (yintercept>>4)&0xfc0;
// 	if (xtilestep == -1)
// 	{
// 		texture = 0xfc0-texture;
// 		xintercept += TILEGLOBAL;
// 	}
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lastside==1 && lastintercept == xtile && lasttilehit == tilehit)
// 	{
// 		// in the same wall type as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 	// new wall
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();
// 
// 		lastside = true;
// 		lastintercept = xtile;
// 
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		if (tilehit & 0x40)
// 		{								// check for adjacent doors
// 			ytile = yintercept>>TILESHIFT;
// 			if ( tilemap[xtile-xtilestep][ytile]&0x80 )
// 				wallpic = DOORWALL+3;
// 			else
// 				wallpic = vertwall[tilehit & ~0x40];
// 		}
// 		else
// 			wallpic = vertwall[tilehit];
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(wallpic);
// 		(unsigned)postsource = texture;
// 
// 	}
// }
// 
// 
// /*
// ====================
// =
// = HitHorizWall
// =
// = tilehit bit 7 is 0, because it's not a door tile
// = if bit 6 is 1 and the adjacent tile is a door tile, use door side pic
// =
// ====================
// */
// 
// void HitHorizWall (void)
// {
// 	int			wallpic;
// 	unsigned	texture;
// 
// 	texture = (xintercept>>4)&0xfc0;
// 	if (ytilestep == -1)
// 		yintercept += TILEGLOBAL;
// 	else
// 		texture = 0xfc0-texture;
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lastside==0 && lastintercept == ytile && lasttilehit == tilehit)
// 	{
// 		// in the same wall type as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 	// new wall
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();
// 
// 		lastside = 0;
// 		lastintercept = ytile;
// 
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		if (tilehit & 0x40)
// 		{								// check for adjacent doors
// 			xtile = xintercept>>TILESHIFT;
// 			if ( tilemap[xtile][ytile-ytilestep]&0x80 )
// 				wallpic = DOORWALL+2;
// 			else
// 				wallpic = horizwall[tilehit & ~0x40];
// 		}
// 		else
// 			wallpic = horizwall[tilehit];
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(wallpic);
// 		(unsigned)postsource = texture;
// 	}
// 
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = HitHorizDoor
// =
// ====================
// */
// 
// void HitHorizDoor (void)
// {
// 	unsigned	texture,doorpage,doornum;
// 
// 	doornum = tilehit&0x7f;
// 	texture = ( (xintercept-doorposition[doornum]) >> 4) &0xfc0;
// 
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lasttilehit == tilehit)
// 	{
// 	// in the same door as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();			// draw last post
// 	// first pixel in this door
// 		lastside = 2;
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		switch (doorobjlist[doornum].lock)
// 		{
// 		case dr_normal:
// 			doorpage = DOORWALL;
// 			break;
// 		case dr_lock1:
// 		case dr_lock2:
// 		case dr_lock3:
// 		case dr_lock4:
// 			doorpage = DOORWALL+6;
// 			break;
// 		case dr_elevator:
// 			doorpage = DOORWALL+4;
// 			break;
// 		}
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(doorpage);
// 		(unsigned)postsource = texture;
// 	}
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = HitVertDoor
// =
// ====================
// */
// 
// void HitVertDoor (void)
// {
// 	unsigned	texture,doorpage,doornum;
// 
// 	doornum = tilehit&0x7f;
// 	texture = ( (yintercept-doorposition[doornum]) >> 4) &0xfc0;
// 
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lasttilehit == tilehit)
// 	{
// 	// in the same door as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();			// draw last post
// 	// first pixel in this door
// 		lastside = 2;
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		switch (doorobjlist[doornum].lock)
// 		{
// 		case dr_normal:
// 			doorpage = DOORWALL;
// 			break;
// 		case dr_lock1:
// 		case dr_lock2:
// 		case dr_lock3:
// 		case dr_lock4:
// 			doorpage = DOORWALL+6;
// 			break;
// 		case dr_elevator:
// 			doorpage = DOORWALL+4;
// 			break;
// 		}
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(doorpage+1);
// 		(unsigned)postsource = texture;
// 	}
// }
// 
// //==========================================================================
// 
// 
// /*
// ====================
// =
// = HitHorizPWall
// =
// = A pushable wall in action has been hit
// =
// ====================
// */
// 
// void HitHorizPWall (void)
// {
// 	int			wallpic;
// 	unsigned	texture,offset;
// 
// 	texture = (xintercept>>4)&0xfc0;
// 	offset = pwallpos<<10;
// 	if (ytilestep == -1)
// 		yintercept += TILEGLOBAL-offset;
// 	else
// 	{
// 		texture = 0xfc0-texture;
// 		yintercept += offset;
// 	}
// 
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lasttilehit == tilehit)
// 	{
// 		// in the same wall type as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 	// new wall
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();
// 
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		wallpic = horizwall[tilehit&63];
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(wallpic);
// 		(unsigned)postsource = texture;
// 	}
// 
// }
// 
// 
// /*
// ====================
// =
// = HitVertPWall
// =
// = A pushable wall in action has been hit
// =
// ====================
// */
// 
// void HitVertPWall (void)
// {
// 	int			wallpic;
// 	unsigned	texture,offset;
// 
// 	texture = (yintercept>>4)&0xfc0;
// 	offset = pwallpos<<10;
// 	if (xtilestep == -1)
// 	{
// 		xintercept += TILEGLOBAL-offset;
// 		texture = 0xfc0-texture;
// 	}
// 	else
// 		xintercept += offset;
// 
// 	wallheight[pixx] = CalcHeight();
// 
// 	if (lasttilehit == tilehit)
// 	{
// 		// in the same wall type as last time, so check for optimized draw
// 		if (texture == (unsigned)postsource)
// 		{
// 		// wide scale
// 			postwidth++;
// 			wallheight[pixx] = wallheight[pixx-1];
// 			return;
// 		}
// 		else
// 		{
// 			ScalePost ();
// 			(unsigned)postsource = texture;
// 			postwidth = 1;
// 			postx = pixx;
// 		}
// 	}
// 	else
// 	{
// 	// new wall
// 		if (lastside != -1)				// if not the first scaled post
// 			ScalePost ();
// 
// 		lasttilehit = tilehit;
// 		postx = pixx;
// 		postwidth = 1;
// 
// 		wallpic = vertwall[tilehit&63];
// 
// 		*( ((unsigned *)&postsource)+1) = (unsigned)PM_GetPage(wallpic);
// 		(unsigned)postsource = texture;
// 	}
// 
// }
// 
// //==========================================================================
// 
// //==========================================================================
// 
// #if 0
// /*
// =====================
// =
// = ClearScreen
// =
// =====================
// */
// 
// void ClearScreen (void)
// {
//  unsigned floor=egaFloor[gamestate.episode*10+mapon],
// 	  ceiling=egaCeiling[gamestate.episode*10+mapon];
// 
//   //
//   // clear the screen
//   //
// asm	mov	dx,GC_INDEX
// asm	mov	ax,GC_MODE + 256*2		// read mode 0, write mode 2
// asm	out	dx,ax
// asm	mov	ax,GC_BITMASK + 255*256
// asm	out	dx,ax
// 
// asm	mov	dx,40
// asm	mov	ax,[viewwidth]
// asm	shr	ax,3
// asm	sub	dx,ax					// dx = 40-viewwidth/8
// 
// asm	mov	bx,[viewwidth]
// asm	shr	bx,4					// bl = viewwidth/16
// asm	mov	bh,BYTE PTR [viewheight]
// asm	shr	bh,1					// half height
// 
// asm	mov	ax,[ceiling]
// asm	mov	es,[screenseg]
// asm	mov	di,[bufferofs]
// 
// toploop:
// asm	mov	cl,bl
// asm	rep	stosw
// asm	add	di,dx
// asm	dec	bh
// asm	jnz	toploop
// 
// asm	mov	bh,BYTE PTR [viewheight]
// asm	shr	bh,1					// half height
// asm	mov	ax,[floor]
// 
// bottomloop:
// asm	mov	cl,bl
// asm	rep	stosw
// asm	add	di,dx
// asm	dec	bh
// asm	jnz	bottomloop
// 
// 
// asm	mov	dx,GC_INDEX
// asm	mov	ax,GC_MODE + 256*10		// read mode 1, write mode 2
// asm	out	dx,ax
// asm	mov	al,GC_BITMASK
// asm	out	dx,al
// 
// }
// #endif
// //==========================================================================
// 
// unsigned vgaCeiling[]=
// {
// #ifndef SPEAR
//  0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0xbfbf,
//  0x4e4e,0x4e4e,0x4e4e,0x1d1d,0x8d8d,0x4e4e,0x1d1d,0x2d2d,0x1d1d,0x8d8d,
//  0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x1d1d,0x2d2d,0xdddd,0x1d1d,0x1d1d,0x9898,
// 
//  0x1d1d,0x9d9d,0x2d2d,0xdddd,0xdddd,0x9d9d,0x2d2d,0x4d4d,0x1d1d,0xdddd,
//  0x7d7d,0x1d1d,0x2d2d,0x2d2d,0xdddd,0xd7d7,0x1d1d,0x1d1d,0x1d1d,0x2d2d,
//  0x1d1d,0x1d1d,0x1d1d,0x1d1d,0xdddd,0xdddd,0x7d7d,0xdddd,0xdddd,0xdddd
// #else
//  0x6f6f,0x4f4f,0x1d1d,0xdede,0xdfdf,0x2e2e,0x7f7f,0x9e9e,0xaeae,0x7f7f,
//  0x1d1d,0xdede,0xdfdf,0xdede,0xdfdf,0xdede,0xe1e1,0xdcdc,0x2e2e,0x1d1d,0xdcdc
// #endif
// };
// 
// /*
// =====================
// =
// = VGAClearScreen
// =
// =====================
// */
// 
// void VGAClearScreen (void)
// {
//  unsigned ceiling=vgaCeiling[gamestate.episode*10+mapon];
// 
//   //
//   // clear the screen
//   //
// asm	mov	dx,SC_INDEX
// asm	mov	ax,SC_MAPMASK+15*256	// write through all planes
// asm	out	dx,ax
// 
// asm	mov	dx,80
// asm	mov	ax,[viewwidth]
// asm	shr	ax,2
// asm	sub	dx,ax					// dx = 40-viewwidth/2
// 
// asm	mov	bx,[viewwidth]
// asm	shr	bx,3					// bl = viewwidth/8
// asm	mov	bh,BYTE PTR [viewheight]
// asm	shr	bh,1					// half height
// 
// asm	mov	es,[screenseg]
// asm	mov	di,[bufferofs]
// asm	mov	ax,[ceiling]
// 
// toploop:
// asm	mov	cl,bl
// asm	rep	stosw
// asm	add	di,dx
// asm	dec	bh
// asm	jnz	toploop
// 
// asm	mov	bh,BYTE PTR [viewheight]
// asm	shr	bh,1					// half height
// asm	mov	ax,0x1919
// 
// bottomloop:
// asm	mov	cl,bl
// asm	rep	stosw
// asm	add	di,dx
// asm	dec	bh
// asm	jnz	bottomloop
// }
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = CalcRotate
// =
// =====================
// */
// 
// int	CalcRotate (objtype *ob)
// {
// 	int	angle,viewangle;
// 
// 	// this isn't exactly correct, as it should vary by a trig value,
// 	// but it is close enough with only eight rotations
// 
// 	viewangle = player->angle + (centerx - ob->viewx)/8;
// 
// 	if (ob->obclass == rocketobj || ob->obclass == hrocketobj)
// 		angle =  (viewangle-180)- ob->angle;
// 	else
// 		angle =  (viewangle-180)- dirangle[ob->dir];
// 
// 	angle+=ANGLES/16;
// 	while (angle>=ANGLES)
// 		angle-=ANGLES;
// 	while (angle<0)
// 		angle+=ANGLES;
// 
// 	if (ob->state->rotate == 2)             // 2 rotation pain frame
// 		return 4*(angle/(ANGLES/2));        // seperated by 3 (art layout...)
// 
// 	return angle/(ANGLES/8);
// }
// 
// 
// /*
// =====================
// =
// = DrawScaleds
// =
// = Draws all objects that are visable
// =
// =====================
// */
// 
// #define MAXVISABLE	50
// 
// typedef struct
// {
// 	int	viewx,
// 		viewheight,
// 		shapenum;
// } visobj_t;
// 
// visobj_t	vislist[MAXVISABLE],*visptr,*visstep,*farthest;
// 
// void DrawScaleds (void)
// {
// 	int 		i,j,least,numvisable,height;
// 	memptr		shape;
// 	byte		*tilespot,*visspot;
// 	int			shapenum;
// 	unsigned	spotloc;
// 
// 	statobj_t	*statptr;
// 	objtype		*obj;
// 
// 	visptr = &vislist[0];
// 
// //
// // place static objects
// //
// 	for (statptr = &statobjlist[0] ; statptr !=laststatobj ; statptr++)
// 	{
// 		if ((visptr->shapenum = statptr->shapenum) == -1)
// 			continue;						// object has been deleted
// 
// 		if (!*statptr->visspot)
// 			continue;						// not visable
// 
// 		if (TransformTile (statptr->tilex,statptr->tiley
// 			,&visptr->viewx,&visptr->viewheight) && statptr->flags & FL_BONUS)
// 		{
// 			GetBonus (statptr);
// 			continue;
// 		}
// 
// 		if (!visptr->viewheight)
// 			continue;						// to close to the object
// 
// 		if (visptr < &vislist[MAXVISABLE-1])	// don't let it overflow
// 			visptr++;
// 	}
// 
// //
// // place active objects
// //
// 	for (obj = player->next;obj;obj=obj->next)
// 	{
// 		if (!(visptr->shapenum = obj->state->shapenum))
// 			continue;						// no shape
// 
// 		spotloc = (obj->tilex<<6)+obj->tiley;	// optimize: keep in struct?
// 		visspot = &spotvis[0][0]+spotloc;
// 		tilespot = &tilemap[0][0]+spotloc;
// 
// 		//
// 		// could be in any of the nine surrounding tiles
// 		//
// 		if (*visspot
// 		|| ( *(visspot-1) && !*(tilespot-1) )
// 		|| ( *(visspot+1) && !*(tilespot+1) )
// 		|| ( *(visspot-65) && !*(tilespot-65) )
// 		|| ( *(visspot-64) && !*(tilespot-64) )
// 		|| ( *(visspot-63) && !*(tilespot-63) )
// 		|| ( *(visspot+65) && !*(tilespot+65) )
// 		|| ( *(visspot+64) && !*(tilespot+64) )
// 		|| ( *(visspot+63) && !*(tilespot+63) ) )
// 		{
// 			obj->active = true;
// 			TransformActor (obj);
// 			if (!obj->viewheight)
// 				continue;						// too close or far away
// 
// 			visptr->viewx = obj->viewx;
// 			visptr->viewheight = obj->viewheight;
// 			if (visptr->shapenum == -1)
// 				visptr->shapenum = obj->temp1;	// special shape
// 
// 			if (obj->state->rotate)
// 				visptr->shapenum += CalcRotate (obj);
// 
// 			if (visptr < &vislist[MAXVISABLE-1])	// don't let it overflow
// 				visptr++;
// 			obj->flags |= FL_VISABLE;
// 		}
// 		else
// 			obj->flags &= ~FL_VISABLE;
// 	}
// 
// //
// // draw from back to front
// //
// 	numvisable = visptr-&vislist[0];
// 
// 	if (!numvisable)
// 		return;									// no visable objects
// 
// 	for (i = 0; i<numvisable; i++)
// 	{
// 		least = 32000;
// 		for (visstep=&vislist[0] ; visstep<visptr ; visstep++)
// 		{
// 			height = visstep->viewheight;
// 			if (height < least)
// 			{
// 				least = height;
// 				farthest = visstep;
// 			}
// 		}
// 		//
// 		// draw farthest
// 		//
// 		ScaleShape(farthest->viewx,farthest->shapenum,farthest->viewheight);
// 
// 		farthest->viewheight = 32000;
// 	}
// 
// }
// 
// //==========================================================================
// 
// /*
// ==============
// =
// = DrawPlayerWeapon
// =
// = Draw the player's hands
// =
// ==============
// */
// 
// int	weaponscale[NUMWEAPONS] = {SPR_KNIFEREADY,SPR_PISTOLREADY
// 	,SPR_MACHINEGUNREADY,SPR_CHAINREADY};
// 
// void DrawPlayerWeapon (void)
// {
// 	int	shapenum;
// 
// #ifndef SPEAR
// 	if (gamestate.victoryflag)
// 	{
// 		if (player->state == &s_deathcam && (TimeCount&32) )
// 			SimpleScaleShape(viewwidth/2,SPR_DEATHCAM,viewheight+1);
// 		return;
// 	}
// #endif
// 
// 	if (gamestate.weapon != -1)
// 	{
// 		shapenum = weaponscale[gamestate.weapon]+gamestate.weaponframe;
// 		SimpleScaleShape(viewwidth/2,shapenum,viewheight+1);
// 	}
// 
// 	if (demorecord || demoplayback)
// 		SimpleScaleShape(viewwidth/2,SPR_DEMO,viewheight+1);
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// =====================
// =
// = CalcTics
// =
// =====================
// */
// 
// void CalcTics (void)
// {
// 	long	newtime,oldtimecount;
// 
// //
// // calculate tics since last refresh for adaptive timing
// //
// 	if (lasttimecount > TimeCount)
// 		TimeCount = lasttimecount;		// if the game was paused a LONG time
// 
// 	do
// 	{
// 		newtime = TimeCount;
// 		tics = newtime-lasttimecount;
// 	} while (!tics);			// make sure at least one tic passes
// 
// 	lasttimecount = newtime;
// 
// #ifdef FILEPROFILE
// 		strcpy (scratch,"\tTics:");
// 		itoa (tics,str,10);
// 		strcat (scratch,str);
// 		strcat (scratch,"\n");
// 		write (profilehandle,scratch,strlen(scratch));
// #endif
// 
// 	if (tics>MAXTICS)
// 	{
// 		TimeCount -= (tics-MAXTICS);
// 		tics = MAXTICS;
// 	}
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// ========================
// =
// = FixOfs
// =
// ========================
// */
// 
// void	FixOfs (void)
// {
// 	VW_ScreenToScreen (displayofs,bufferofs,viewwidth/8,viewheight);
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// ====================
// =
// = WallRefresh
// =
// ====================
// */
// 
// void WallRefresh (void)
// {
// //
// // set up variables for this view
// //
// 	viewangle = player->angle;
// 	midangle = viewangle*(FINEANGLES/ANGLES);
// 	viewsin = sintable[viewangle];
// 	viewcos = costable[viewangle];
// 	viewx = player->x - FixedByFrac(focallength,viewcos);
// 	viewy = player->y + FixedByFrac(focallength,viewsin);
// 
// 	focaltx = viewx>>TILESHIFT;
// 	focalty = viewy>>TILESHIFT;
// 
// 	viewtx = player->x >> TILESHIFT;
// 	viewty = player->y >> TILESHIFT;
// 
// 	xpartialdown = viewx&(TILEGLOBAL-1);
// 	xpartialup = TILEGLOBAL-xpartialdown;
// 	ypartialdown = viewy&(TILEGLOBAL-1);
// 	ypartialup = TILEGLOBAL-ypartialdown;
// 
// 	lastside = -1;			// the first pixel is on a new wall
// 	AsmRefresh ();
// 	ScalePost ();			// no more optimization on last post
// }
// 
// //==========================================================================
// 
// /*
// ========================
// =
// = ThreeDRefresh
// =
// ========================
// */
// 
// void	ThreeDRefresh (void)
// {
// 	int tracedir;
// 
// // this wouldn't need to be done except for my debugger/video wierdness
// 	outportb (SC_INDEX,SC_MAPMASK);
// 
// //
// // clear out the traced array
// //
// asm	mov	ax,ds
// asm	mov	es,ax
// asm	mov	di,OFFSET spotvis
// asm	xor	ax,ax
// asm	mov	cx,2048							// 64*64 / 2
// asm	rep stosw
// 
// 	bufferofs += screenofs;
// 
// //
// // follow the walls from there to the right, drawwing as we go
// //
// 	VGAClearScreen ();
// 
// 	WallRefresh ();
// 
// //
// // draw all the scaled images
// //
// 	DrawScaleds();			// draw scaled stuff
// 	DrawPlayerWeapon ();	// draw player's hands
// 
// //
// // show screen and time last cycle
// //
// 	if (fizzlein)
// 	{
// 		FizzleFade(bufferofs,displayofs+screenofs,viewwidth,viewheight,20,false);
// 		fizzlein = false;
// 
// 		lasttimecount = TimeCount = 0;		// don't make a big tic count
// 
// 	}
// 
// 	bufferofs -= screenofs;
// 	displayofs = bufferofs;
// 
// 	asm	cli
// 	asm	mov	cx,[displayofs]
// 	asm	mov	dx,3d4h		// CRTC address register
// 	asm	mov	al,0ch		// start address high register
// 	asm	out	dx,al
// 	asm	inc	dx
// 	asm	mov	al,ch
// 	asm	out	dx,al   	// set the high byte
// 	asm	sti
// 
// 	bufferofs += SCREENSIZE;
// 	if (bufferofs > PAGE3START)
// 		bufferofs = PAGE1START;
// 
// 	frameon++;
// 	PM_NextFrame();
// }
// 
// 
// //===========================================================================
// 
// 
