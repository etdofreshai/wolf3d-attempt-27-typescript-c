// ID_VL.H

// wolf compatability

// #define MS_Quit Quit   (re-exported alias below)
export { Quit as MS_Quit } from "./WL_MAIN.C";

//===========================================================================

export const SC_INDEX = 0x3c4;
export const SC_RESET = 0;
export const SC_CLOCK = 1;
export const SC_MAPMASK = 2;
export const SC_CHARMAP = 3;
export const SC_MEMMODE = 4;

export const CRTC_INDEX = 0x3d4;
export const CRTC_H_TOTAL = 0;
export const CRTC_H_DISPEND = 1;
export const CRTC_H_BLANK = 2;
export const CRTC_H_ENDBLANK = 3;
export const CRTC_H_RETRACE = 4;
export const CRTC_H_ENDRETRACE = 5;
export const CRTC_V_TOTAL = 6;
export const CRTC_OVERFLOW = 7;
export const CRTC_ROWSCAN = 8;
export const CRTC_MAXSCANLINE = 9;
export const CRTC_CURSORSTART = 10;
export const CRTC_CURSOREND = 11;
export const CRTC_STARTHIGH = 12;
export const CRTC_STARTLOW = 13;
export const CRTC_CURSORHIGH = 14;
export const CRTC_CURSORLOW = 15;
export const CRTC_V_RETRACE = 16;
export const CRTC_V_ENDRETRACE = 17;
export const CRTC_V_DISPEND = 18;
export const CRTC_OFFSET = 19;
export const CRTC_UNDERLINE = 20;
export const CRTC_V_BLANK = 21;
export const CRTC_V_ENDBLANK = 22;
export const CRTC_MODE = 23;
export const CRTC_LINECOMPARE = 24;

export const GC_INDEX = 0x3ce;
export const GC_SETRESET = 0;
export const GC_ENABLESETRESET = 1;
export const GC_COLORCOMPARE = 2;
export const GC_DATAROTATE = 3;
export const GC_READMAP = 4;
export const GC_MODE = 5;
export const GC_MISCELLANEOUS = 6;
export const GC_COLORDONTCARE = 7;
export const GC_BITMASK = 8;

export const ATR_INDEX = 0x3c0;
export const ATR_MODE = 16;
export const ATR_OVERSCAN = 17;
export const ATR_COLORPLANEENABLE = 18;
export const ATR_PELPAN = 19;
export const ATR_COLORSELECT = 20;

export const STATUS_REGISTER_1 = 0x3da;

export const PEL_WRITE_ADR = 0x3c8;
export const PEL_READ_ADR = 0x3c7;
export const PEL_DATA = 0x3c9;

//===========================================================================

export const SCREENSEG = 0xa000;

export const SCREENWIDTH = 80; // default screen width in bytes
export const MAXSCANLINES = 200; // size of ylookup table

export const CHARWIDTH = 2;
export const TILEWIDTH = 4;

//===========================================================================

// The externs (bufferofs, displayofs, pelpan, screenseg, linewidth, ylookup,
// screenfaded, bordercolor) are defined by ID_VL.C.ts on its exported `vl`
// state record (PORTING.md §11#1).

//===========================================================================

//
// VGA hardware routines
//

import { outportb, inportb } from "../platform/vga";

// #define VGAWRITEMODE(x) asm{cli; out GC_MODE = (in GC_MODE & 252) | x; sti}
export function VGAWRITEMODE(x: number): void {
  outportb(GC_INDEX, GC_MODE);
  outportb(GC_INDEX + 1, (inportb(GC_INDEX + 1) & 252) | x);
}

// #define VGAMAPMASK(x) asm{cli; out SC_INDEX, SC_MAPMASK + x<<8; sti}
export function VGAMAPMASK(x: number): void {
  outportb(SC_INDEX, SC_MAPMASK);
  outportb(SC_INDEX + 1, x);
}

// #define VGAREADMAP(x) asm{cli; out GC_INDEX, GC_READMAP + x<<8; sti}
export function VGAREADMAP(x: number): void {
  outportb(GC_INDEX, GC_READMAP);
  outportb(GC_INDEX + 1, x);
}
