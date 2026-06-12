// WL_MAIN.C
//
// PARTIAL PORT: Quit(), the view/projection globals, BuildTables() and
// CalcProjection() so far. The rest (DemoLoop, InitGame, episode checks,
// SignonScreen, ...) lands with the game-loop milestone.

import { idiv, i16, mul32 } from "../runtime/ctypes";
import { memwrite } from "../runtime/dosmem";
import {
  PI,
  GLOBAL1,
  TILEGLOBAL,
  ANGLES,
  ANGLEQUAD,
  FINEANGLES,
  MINDIST,
} from "./WL_DEF.H";
import { sintable, finetangent, pixelangle } from "./WL_DRAW.C";
import {
  VL_SetVGAPlaneMode,
  VL_TestPaletteSet,
  VL_SetPalette,
  VL_SetScreen,
  VL_MemToScreen,
} from "./ID_VL.C";
import { VL_MungePic } from "./ID_VH.C";
import { gamepal } from "./GAMEPAL.OBJ";
import { signon } from "./SIGNON.OBJ";

/*
=============================================================================

						 LOCAL CONSTANTS

=============================================================================
*/

export const FOCALLENGTH = 0x5700; // in global coordinates
export const VIEWGLOBAL = 0x10000; // globals visable flush to wall

export const VIEWWIDTH = 256; // size of view window
export const VIEWHEIGHT = 144;

/*
=============================================================================

						 GLOBAL VARIABLES

=============================================================================
*/

export const wm = {
  // unsigned screenofs;
  screenofs: 0,
  // int  viewwidth;
  viewwidth: 0,
  // int  viewheight;
  viewheight: 0,
  // int  centerx;
  centerx: 0,
  // int  shootdelta;   // pixels away from centerx a target can be
  shootdelta: 0,
  // fixed scale,maxslope;
  scale: 0,
  maxslope: 0,
  // long heightnumerator;
  heightnumerator: 0,
  // int  minheightdiv;
  minheightdiv: 0,
  // fixed focallength;
  focallength: 0,

  // boolean startgame,loadedgame,virtualreality;
  startgame: false,
  loadedgame: false,
  virtualreality: false,
};

/**
 * extern char far signon;  (ID_HEADS.H — the linked-in SIGNON.OBJ screen)
 *
 * The original links the 64000-byte signon screen into the EXE's data; the
 * port places those identical bytes (extracted from SIGNON.OBJ) into DOS
 * memory at a fixed address below the heap on first use.
 */
const introscn = 0x60000; // &introscn — modeled static-data placement

/** Error thrown by Quit — the port's stand-in for exit(1) with a message. */
export class DosQuit extends Error {
  constructor(error: string) {
    super(error);
    this.name = "DosQuit";
  }
}

/*
==========================
=
= Quit
=
==========================
*/

export function Quit(error: string | null): never {
  // Full original body (shutdown of all managers, error/ordering screen,
  // exit) lands with the game-loop milestone.
  throw new DosQuit(error ?? "");
}

//===========================================================================

/*
==========================
=
= SignonScreen
=
==========================
*/

export function SignonScreen(): void {
  // VGA version
  VL_SetVGAPlaneMode();
  VL_TestPaletteSet();
  VL_SetPalette(gamepal);

  if (!wm.virtualreality) {
    memwrite(introscn, signon); // (port: place the linked-in screen bytes)
    VL_SetScreen(0x8000, 0); // VW_SetScreen(0x8000,0);
    VL_MungePic(introscn, 320, 200);
    VL_MemToScreen(introscn, 320, 200, 0, 0);
    VL_SetScreen(0, 0); // VW_SetScreen(0,0);
  }

  //
  // reclaim the memory from the linked in signon screen
  //
  // MML_UseSpace — the modeled heap needs no reclamation (see ID_MM.C.ts)
}

//===========================================================================

/*
==================
=
= BuildTables
=
= Calculates:
=
= scale                 projection constant
= sintable/costable     overlapping fractional tables
=
==================
*/

// const float radtoint = (float)FINEANGLES/2/PI;
export const radtoint = Math.fround(FINEANGLES / 2 / PI);

export function BuildTables(): void {
  let i: number;
  let angle: number, anglestep: number; // float
  let tang: number; // double
  let value: number; // fixed

  //
  // calculate fine tangents
  //

  for (i = 0; i < FINEANGLES / 8; i++) {
    tang = Math.tan((i + 0.5) / radtoint);
    finetangent[i] = Math.trunc(tang * TILEGLOBAL); // (fixed)<-double truncates
    finetangent[FINEANGLES / 4 - 1 - i] = Math.trunc((1 / tang) * TILEGLOBAL);
  }

  //
  // costable overlays sintable with a quarter phase shift
  // ANGLES is assumed to be divisable by four
  //
  // The low word of the value is the fraction, the high bit is the sign bit,
  // bits 16-30 should be 0
  //

  angle = 0;
  anglestep = Math.fround(PI / 2 / ANGLEQUAD); // float
  for (i = 0; i <= ANGLEQUAD; i++) {
    value = Math.trunc(GLOBAL1 * Math.sin(angle)); // fixed value=GLOBAL1*sin(angle);
    sintable[i] = sintable[i + ANGLES] = sintable[ANGLES / 2 - i] = value;
    sintable[ANGLES - i] = sintable[ANGLES / 2 + i] = value | 0x80000000;
    angle = Math.fround(angle + anglestep); // float accumulation
  }
}

//===========================================================================

/*
====================
=
= CalcProjection
=
= Uses focallength
=
====================
*/

export function CalcProjection(focal: number): void {
  let i: number;
  let intang: number; // long
  let angle: number; // float
  let tang: number; // double
  let halfview: number; // int
  let facedist: number; // double

  wm.focallength = focal;
  facedist = focal + MINDIST;
  halfview = idiv(wm.viewwidth, 2); // half view in pixels

  //
  // calculate scale value for vertical height calculations
  // and sprite x calculations
  //
  wm.scale = Math.trunc((halfview * facedist) / (VIEWGLOBAL / 2));

  //
  // divide heightnumerator by a posts distance to get the posts height for
  // the heightbuffer.  The pixel height is height>>2
  //
  wm.heightnumerator = mul32(TILEGLOBAL, wm.scale) >> 6;
  wm.minheightdiv = i16(idiv(wm.heightnumerator, 0x7fff) + 1);

  //
  // calculate the angle offset from view angle of each pixel's ray
  //

  for (i = 0; i < halfview; i++) {
    // start 1/2 pixel over, so viewangle bisects two middle pixels
    // tang = (long)i*VIEWGLOBAL/viewwidth/facedist;
    //        ^^^ long multiply, then LONG (truncating) divide by viewwidth,
    //            then double divide by facedist
    tang = idiv(mul32(i, VIEWGLOBAL), wm.viewwidth) / facedist;
    angle = Math.fround(Math.atan(tang)); // float angle = atan(tang);
    intang = Math.trunc(angle * radtoint);
    pixelangle[halfview - 1 - i] = intang;
    pixelangle[halfview + i] = -intang;
  }

  //
  // if a point's abs(y/x) is greater than maxslope, the point is outside
  // the view area
  //
  wm.maxslope = finetangent[pixelangle[0]];
  wm.maxslope >>= 8;
}
