// ID_GLOB.H
//
// Port note: the original #includes the Borland runtime headers and the
// variant graphics/audio/map headers (WL6 path: GFXV_WL6 / AUDIOWL6 /
// MAPSWL6 — see VERSION.H.ts for the locked variant switches). TS modules
// import what they need directly; this mirror carries the declarations the
// header itself contributes.

//--------------------------------------------------------------------------

// extern char far signon;  (the linked SIGNON.OBJ screen — provided when the
//                           signon screen is ported)
// #define introscn signon

export const GREXT = "VGA";

//
//	ID Engine
//	Types.h - Generic types, #defines, etc.
//	v1.0d1
//

// typedef enum {false,true} boolean;     -> TS boolean
// typedef unsigned char     byte;        -> number (u8)
// typedef unsigned int      word;        -> number (u16)
// typedef unsigned long     longword;    -> number (u32)
// typedef byte *            Ptr;         -> number (DOS linear address)
export type boolean_ = boolean;
export type byte = number;
export type word = number;
export type longword = number;
export type Ptr = number;

export interface Point {
  x: number;
  y: number;
}
export interface Rect {
  ul: Point;
  lr: Point;
}

// #define nil ((void *)0)
export const nil = 0;

// void Quit (char *error);  // defined in user program (WL_MAIN.C)

//
// replacing refresh manager with custom routines
//

export const PORTTILESWIDE = 20; // all drawing takes place inside a
export const PORTTILESHIGH = 13; // non displayed port of this size

export const UPDATEWIDE = PORTTILESWIDE;
export const UPDATEHIGH = PORTTILESHIGH;

export const MAXTICS = 10;
export const DEMOTICS = 4;

export const UPDATETERMINATE = 0x0301;

// extern unsigned mapwidth,mapheight,tics;   (defined in WL_DRAW.C / WL_PLAY.C)
// extern boolean  compatability;
// extern byte     *updateptr;
// extern unsigned uwidthtable[UPDATEHIGH];
// extern unsigned blockstarts[UPDATEWIDE*UPDATEHIGH];
// extern byte     fontcolor,backcolor;       (defined in ID_VH.C)

// #define SETFONTCOLOR(f,b) fontcolor=f;backcolor=b;
// (ported as a function where used, once ID_VH lands)
