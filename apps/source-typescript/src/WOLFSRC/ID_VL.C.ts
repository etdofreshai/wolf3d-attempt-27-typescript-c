// ID_VL.C

//
// SC_INDEX is expected to stay at SC_MAPMASK for proper operation
//

// Port notes:
//  - The VGA card itself is modeled in platform/vga.ts; this module is the
//    driver, transliterated against the same port map (outportb/inportb)
//    and planar memory semantics the original programmed.
//  - Screen pointers (MK_FP(SCREENSEG,ofs)) are plane offsets into the
//    card's memory — a separate address space from DOS memory, like the
//    real A000 segment. vgaWrite/vgaRead honor map mask / write mode.
//  - Palettes are plain Uint8Array(768)s (768 6-bit values); they are never
//    serialized, so they stay ordinary data rather than DOS-memory views.
//  - VL_WaitVBL blocks via the host's VBL source (Atomics in the browser
//    worker, virtual time in tests) — see platform/vga.ts.

import {
  outportb,
  inportb,
  outport,
  vgaWrite,
  vgaRead,
  waitVBL,
  int10,
  vgastate,
} from "../platform/vga";
import {
  SC_INDEX,
  SC_MAPMASK,
  SC_MEMMODE,
  GC_INDEX,
  GC_MODE,
  GC_MISCELLANEOUS,
  CRTC_INDEX,
  CRTC_OFFSET,
  CRTC_UNDERLINE,
  CRTC_MODE,
  CRTC_LINECOMPARE,
  CRTC_OVERFLOW,
  CRTC_MAXSCANLINE,
  CRTC_STARTHIGH,
  CRTC_STARTLOW,
  ATR_INDEX,
  ATR_PELPAN,
  STATUS_REGISTER_1,
  PEL_WRITE_ADR,
  PEL_READ_ADR,
  PEL_DATA,
  MAXSCANLINES,
  SCREENSEG,
  VGAMAPMASK,
  VGAWRITEMODE,
} from "./ID_VL.H";
import { memb } from "../runtime/dosmem";
import { Quit } from "./WL_MAIN.C";

export const vl = {
  // unsigned bufferofs;
  bufferofs: 0,
  // unsigned displayofs,pelpan;
  displayofs: 0,
  pelpan: 0,

  // unsigned screenseg=SCREENSEG;  // set to 0xa000 for asm convenience
  screenseg: SCREENSEG,

  // unsigned linewidth;
  linewidth: 0,

  // boolean screenfaded;
  screenfaded: false,
  // unsigned bordercolor;
  bordercolor: 0,

  // boolean fastpalette;  // if true, use outsb to set
  fastpalette: false,
};

// unsigned ylookup[MAXSCANLINES];
export const ylookup = new Uint16Array(MAXSCANLINES);

// byte far palette1[256][3], far palette2[256][3];
export const palette1 = new Uint8Array(768);
export const palette2 = new Uint8Array(768);

//===========================================================================

// asm (ID_VL_A.ASM) — reimplemented from semantics at the bottom of this
// module: VL_VideoID, VL_SetCRTC, VL_SetScreen, VL_WaitVBL

//===========================================================================

/*
=======================
=
= VL_Startup	// WOLFENSTEIN HACK
=
=======================
*/

export function VL_Startup(): void {
  let videocard: number;

  videocard = VL_VideoID();
  // (command-line HIDDENCARD override not applicable in the port)

  if (videocard !== 5)
    Quit(
      "Improper video card!  If you really have a VGA card that I am not \n" +
        "detecting, use the -HIDDENCARD command line parameter!",
    );
}

/*
=======================
=
= VL_Shutdown
=
=======================
*/

export function VL_Shutdown(): void {
  VL_SetTextMode();
}

/*
=======================
=
= VL_SetVGAPlaneMode
=
=======================
*/

export function VL_SetVGAPlaneMode(): void {
  int10(0x13); // asm mov ax,0x13 / int 0x10
  VL_DePlaneVGA();
  VGAMAPMASK(15);
  VL_SetLineWidth(40);
}

/*
=======================
=
= VL_SetTextMode
=
=======================
*/

export function VL_SetTextMode(): void {
  int10(3); // asm mov ax,3 / int 0x10
}

//===========================================================================

/*
=================
=
= VL_ClearVideo
=
= Fill the entire video buffer with a given color
=
=================
*/

export function VL_ClearVideo(color: number): void {
  // asm: write mode 0, map mask 15, rep stosw 0x8000 words at A000:0
  outportb(GC_INDEX, GC_MODE);
  outportb(GC_INDEX + 1, inportb(GC_INDEX + 1) & 0xfc); // write mode 0
  outport(SC_INDEX, SC_MAPMASK + 15 * 256); // all four planes
  for (let di = 0; di < 0x10000; di++) vgaWrite(di, color);
}

/*
=============================================================================

			VGA REGISTER MANAGEMENT ROUTINES

=============================================================================
*/

/*
=================
=
= VL_DePlaneVGA
=
=================
*/

export function VL_DePlaneVGA(): void {
  //
  // change CPU addressing to non linear mode
  //

  //
  // turn off chain 4 and odd/even
  //
  outportb(SC_INDEX, SC_MEMMODE);
  outportb(SC_INDEX + 1, (inportb(SC_INDEX + 1) & ~8) | 4);

  outportb(SC_INDEX, SC_MAPMASK); // leave this set throughought

  //
  // turn off odd/even and set write mode 0
  //
  outportb(GC_INDEX, GC_MODE);
  outportb(GC_INDEX + 1, inportb(GC_INDEX + 1) & ~0x13);

  //
  // turn off chain
  //
  outportb(GC_INDEX, GC_MISCELLANEOUS);
  outportb(GC_INDEX + 1, inportb(GC_INDEX + 1) & ~2);

  //
  // clear the entire buffer space, because int 10h only did 16 k / plane
  //
  VL_ClearVideo(0);

  //
  // change CRTC scanning from doubleword to byte mode, allowing >64k scans
  //
  outportb(CRTC_INDEX, CRTC_UNDERLINE);
  outportb(CRTC_INDEX + 1, inportb(CRTC_INDEX + 1) & ~0x40);

  outportb(CRTC_INDEX, CRTC_MODE);
  outportb(CRTC_INDEX + 1, inportb(CRTC_INDEX + 1) | 0x40);
}

//===========================================================================

/*
====================
=
= VL_SetLineWidth
=
= Line witdh is in WORDS, 40 words is normal width for vgaplanegr
=
====================
*/

export function VL_SetLineWidth(width: number): void {
  let i: number, offset: number;

  //
  // set wide virtual screen
  //
  outport(CRTC_INDEX, CRTC_OFFSET + width * 256);

  //
  // set up lookup tables
  //
  vl.linewidth = width * 2;

  offset = 0;

  for (i = 0; i < MAXSCANLINES; i++) {
    ylookup[i] = offset;
    offset += vl.linewidth;
  }
}

/*
====================
=
= VL_SetSplitScreen
=
====================
*/

export function VL_SetSplitScreen(linenum: number): void {
  VL_WaitVBL(1);
  linenum = linenum * 2 - 1;
  outportb(CRTC_INDEX, CRTC_LINECOMPARE);
  outportb(CRTC_INDEX + 1, linenum % 256);
  outportb(CRTC_INDEX, CRTC_OVERFLOW);
  outportb(CRTC_INDEX + 1, 1 + 16 * Math.trunc(linenum / 256));
  outportb(CRTC_INDEX, CRTC_MAXSCANLINE);
  outportb(CRTC_INDEX + 1, inportb(CRTC_INDEX + 1) & (255 - 64));
}

/*
=============================================================================

						PALETTE OPS

		To avoid snow, do a WaitVBL BEFORE calling these

=============================================================================
*/

/*
=================
=
= VL_FillPalette
=
=================
*/

export function VL_FillPalette(red: number, green: number, blue: number): void {
  let i: number;

  outportb(PEL_WRITE_ADR, 0);
  for (i = 0; i < 256; i++) {
    outportb(PEL_DATA, red);
    outportb(PEL_DATA, green);
    outportb(PEL_DATA, blue);
  }
}

//===========================================================================

/*
=================
=
= VL_SetColor
=
=================
*/

export function VL_SetColor(
  color: number,
  red: number,
  green: number,
  blue: number,
): void {
  outportb(PEL_WRITE_ADR, color);
  outportb(PEL_DATA, red);
  outportb(PEL_DATA, green);
  outportb(PEL_DATA, blue);
}

//===========================================================================

/*
=================
=
= VL_GetColor
=
=================
*/

export function VL_GetColor(color: number): {
  red: number;
  green: number;
  blue: number;
} {
  outportb(PEL_READ_ADR, color);
  const red = inportb(PEL_DATA);
  const green = inportb(PEL_DATA);
  const blue = inportb(PEL_DATA);
  return { red, green, blue };
}

//===========================================================================

/*
=================
=
= VL_SetPalette
=
= If fast palette setting has been tested for, it is used
= (some cards don't like outsb palette setting)
=
=================
*/

export function VL_SetPalette(palette: Uint8Array): void {
  // asm: out PEL_WRITE_ADR 0, then 768 outs to PEL_DATA (outsb when
  // fastpalette, lodsb/out x3 per color otherwise — identical data stream)
  outportb(PEL_WRITE_ADR, 0);
  for (let i = 0; i < 768; i++) outportb(PEL_DATA, palette[i]);
}

//===========================================================================

/*
=================
=
= VL_GetPalette
=
= This does not use the port string instructions,
= due to some incompatabilities
=
=================
*/

export function VL_GetPalette(palette: Uint8Array): void {
  let i: number;

  outportb(PEL_READ_ADR, 0);
  for (i = 0; i < 768; i++) palette[i] = inportb(PEL_DATA);
}

//===========================================================================

/*
=================
=
= VL_FadeOut
=
= Fades the current palette to the given color in the given number of steps
=
=================
*/

export function VL_FadeOut(
  start: number,
  end: number,
  red: number,
  green: number,
  blue: number,
  steps: number,
): void {
  let i: number, j: number, orig: number, delta: number;
  let origptr: number, newptr: number;

  VL_WaitVBL(1);
  VL_GetPalette(palette1);
  palette2.set(palette1); // _fmemcpy (palette2,palette1,768);

  //
  // fade through intermediate frames
  //
  for (i = 0; i < steps; i++) {
    origptr = start * 3; // &palette1[start][0]
    newptr = start * 3; // &palette2[start][0]
    for (j = start; j <= end; j++) {
      orig = palette1[origptr++];
      delta = red - orig;
      palette2[newptr++] = orig + Math.trunc((delta * i) / steps);
      orig = palette1[origptr++];
      delta = green - orig;
      palette2[newptr++] = orig + Math.trunc((delta * i) / steps);
      orig = palette1[origptr++];
      delta = blue - orig;
      palette2[newptr++] = orig + Math.trunc((delta * i) / steps);
    }

    VL_WaitVBL(1);
    VL_SetPalette(palette2);
  }

  //
  // final color
  //
  VL_FillPalette(red, green, blue);

  vl.screenfaded = true;
}

/*
=================
=
= VL_FadeIn
=
=================
*/

export function VL_FadeIn(
  start: number,
  end: number,
  palette: Uint8Array,
  steps: number,
): void {
  let i: number, j: number, delta: number;

  VL_WaitVBL(1);
  VL_GetPalette(palette1);
  palette2.set(palette1); // _fmemcpy(palette2,palette1,sizeof(palette1));

  start *= 3;
  end = end * 3 + 2;

  //
  // fade through intermediate frames
  //
  for (i = 0; i < steps; i++) {
    for (j = start; j <= end; j++) {
      delta = palette[j] - palette1[j];
      palette2[j] = palette1[j] + Math.trunc((delta * i) / steps);
    }

    VL_WaitVBL(1);
    VL_SetPalette(palette2);
  }

  //
  // final color
  //
  VL_SetPalette(palette);
  vl.screenfaded = false;
}

/*
=================
=
= VL_TestPaletteSet
=
= Sets the palette with outsb, then reads it in and compares
= If it compares ok, fastpalette is set to true.
=
=================
*/

export function VL_TestPaletteSet(): void {
  let i: number;

  for (i = 0; i < 768; i++) palette1[i] = i & 0xff;

  vl.fastpalette = true;
  VL_SetPalette(palette1);
  VL_GetPalette(palette2);
  // the model DAC keeps only 6 bits per channel, like real hardware —
  // the comparison fails just as it does on cards that drop outsb writes
  let same = true;
  for (i = 0; i < 768; i++)
    if (palette1[i] !== palette2[i]) {
      same = false;
      break;
    }
  if (!same) vl.fastpalette = false;
}

/*
==================
=
= VL_ColorBorder
=
==================
*/

export function VL_ColorBorder(color: number): void {
  int10(0x1001, color << 8); // _AH=0x10; _AL=1; _BH=color; geninterrupt(0x10);
  vl.bordercolor = color;
}

/*
=============================================================================

							PIXEL OPS

=============================================================================
*/

export const pixmasks = new Uint8Array([1, 2, 4, 8]);
export const leftmasks = new Uint8Array([15, 14, 12, 8]);
export const rightmasks = new Uint8Array([1, 3, 7, 15]);

/*
=================
=
= VL_Plot
=
=================
*/

export function VL_Plot(x: number, y: number, color: number): void {
  let mask: number;

  mask = pixmasks[x & 3];
  VGAMAPMASK(mask);
  vgaWrite(vl.bufferofs + (ylookup[y] + (x >> 2)), color);
  VGAMAPMASK(15);
}

/*
=================
=
= VL_Hlin
=
=================
*/

export function VL_Hlin(
  x: number,
  y: number,
  width: number,
  color: number,
): void {
  let xbyte: number;
  let dest: number;
  let leftmask: number, rightmask: number;
  let midbytes: number;

  xbyte = x >> 2;
  leftmask = leftmasks[x & 3];
  rightmask = rightmasks[(x + width - 1) & 3];
  midbytes = ((x + width + 3) >> 2) - xbyte - 2;

  dest = vl.bufferofs + ylookup[y] + xbyte;

  if (midbytes < 0) {
    // all in one byte
    VGAMAPMASK(leftmask & rightmask);
    vgaWrite(dest, color);
    VGAMAPMASK(15);
    return;
  }

  VGAMAPMASK(leftmask);
  vgaWrite(dest, color);
  dest++;

  VGAMAPMASK(15);
  for (let i = 0; i < midbytes; i++) vgaWrite(dest + i, color); // _fmemset
  dest += midbytes;

  VGAMAPMASK(rightmask);
  vgaWrite(dest, color);

  VGAMAPMASK(15);
}

/*
=================
=
= VL_Vlin
=
=================
*/

export function VL_Vlin(
  x: number,
  y: number,
  height: number,
  color: number,
): void {
  let dest: number, mask: number;

  mask = pixmasks[x & 3];
  VGAMAPMASK(mask);

  dest = vl.bufferofs + ylookup[y] + (x >> 2);

  while (height--) {
    vgaWrite(dest, color);
    dest += vl.linewidth;
  }

  VGAMAPMASK(15);
}

/*
=================
=
= VL_Bar
=
=================
*/

export function VL_Bar(
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
): void {
  let dest: number;
  let leftmask: number, rightmask: number;
  let midbytes: number, linedelta: number;

  leftmask = leftmasks[x & 3];
  rightmask = rightmasks[(x + width - 1) & 3];
  midbytes = ((x + width + 3) >> 2) - (x >> 2) - 2;
  linedelta = vl.linewidth - (midbytes + 1);

  dest = vl.bufferofs + ylookup[y] + (x >> 2);

  if (midbytes < 0) {
    // all in one byte
    VGAMAPMASK(leftmask & rightmask);
    while (height--) {
      vgaWrite(dest, color);
      dest += vl.linewidth;
    }
    VGAMAPMASK(15);
    return;
  }

  while (height--) {
    VGAMAPMASK(leftmask);
    vgaWrite(dest, color);
    dest++;

    VGAMAPMASK(15);
    for (let i = 0; i < midbytes; i++) vgaWrite(dest + i, color); // _fmemset
    dest += midbytes;

    VGAMAPMASK(rightmask);
    vgaWrite(dest, color);

    dest += linedelta;
  }

  VGAMAPMASK(15);
}

/*
============================================================================

							MEMORY OPS

============================================================================
*/

/*
=================
=
= VL_MemToLatch
=
=================
*/

export function VL_MemToLatch(
  source: number,
  width: number,
  height: number,
  dest: number,
): void {
  let count: number;
  let plane: number, mask: number;

  count = Math.trunc((width + 3) / 4) * height;
  mask = 1;
  for (plane = 0; plane < 4; plane++) {
    VGAMAPMASK(mask);
    mask <<= 1;

    // asm: rep movsb DS:source -> A000:dest through the map mask
    for (let i = 0; i < count; i++) vgaWrite(dest + i, memb[source + i]);

    source += count;
  }
}

//===========================================================================

/*
=================
=
= VL_MemToScreen
=
= Draws a block of data to the screen.
=
=================
*/

export function VL_MemToScreen(
  source: number,
  width: number,
  height: number,
  x: number,
  y: number,
): void {
  let screen: number, dest: number, mask: number;
  let plane: number;

  width >>= 2;
  dest = vl.bufferofs + ylookup[y] + (x >> 2);
  mask = 1 << (x & 3);

  for (plane = 0; plane < 4; plane++) {
    VGAMAPMASK(mask);
    mask <<= 1;
    if (mask === 16) mask = 1;

    screen = dest;
    for (let yy = 0; yy < height; yy++, screen += vl.linewidth, source += width)
      for (let i = 0; i < width; i++) vgaWrite(screen + i, memb[source + i]); // _fmemcpy
  }
}

//==========================================================================

/*
=================
=
= VL_MaskedToScreen
=
= Masks a block of main memory to the screen.
=
=================
*/

export function VL_MaskedToScreen(
  source: number,
  width: number,
  height: number,
  x: number,
  y: number,
): void {
  let screen: number, dest: number, mask: number;
  let plane: number;

  width >>= 2;
  dest = vl.bufferofs + ylookup[y] + (x >> 2);
  //	mask = 1 << (x&3);
  mask = 0; // (uninitialized in the original — the commented-out line above
  //          is the intended value; the function is unreferenced in WL6)

  //	maskptr = source;

  for (plane = 0; plane < 4; plane++) {
    VGAMAPMASK(mask);
    mask <<= 1;
    if (mask === 16) mask = 1;

    screen = dest;
    for (let yy = 0; yy < height; yy++, screen += vl.linewidth, source += width)
      for (let i = 0; i < width; i++) vgaWrite(screen + i, memb[source + i]); // _fmemcpy
  }
}

//==========================================================================

/*
=================
=
= VL_LatchToScreen
=
=================
*/

export function VL_LatchToScreen(
  source: number,
  width: number,
  height: number,
  x: number,
  y: number,
): void {
  VGAWRITEMODE(1);
  VGAMAPMASK(15);

  // asm: dest = bufferofs+ylookup[y]+(x>>2); per row: movsb width bytes
  // (write mode 1: each read loads the latches, each write stores them)
  let di = vl.bufferofs + ylookup[y] + (x >> 2);
  let si = source;
  const linedelta = vl.linewidth - width;
  for (let dy = 0; dy < height; dy++) {
    for (let i = 0; i < width; i++) {
      vgaRead(si++); // load latches
      vgaWrite(di++, 0); // store latches (value ignored in WM1)
    }
    di += linedelta;
    si += linedelta;
  }

  VGAWRITEMODE(0);
}

//===========================================================================

/*
=================
=
= VL_ScreenToScreen
=
=================
*/

export function VL_ScreenToScreen(
  source: number,
  dest: number,
  width: number,
  height: number,
): void {
  VGAWRITEMODE(1);
  VGAMAPMASK(15);

  // asm: per row movsb width bytes, advancing both by linewidth
  let si = source;
  let di = dest;
  const linedelta = vl.linewidth - width;
  for (let dy = 0; dy < height; dy++) {
    for (let i = 0; i < width; i++) {
      vgaRead(si++);
      vgaWrite(di++, 0);
    }
    si += linedelta;
    di += linedelta;
  }

  VGAWRITEMODE(0);
}

/*
=============================================================================

						STRING OUTPUT ROUTINES

=============================================================================
*/

/*
===================
=
= VL_DrawTile8String
=
===================
*/

export function VL_DrawTile8String(
  str: string,
  tile8ptr: number,
  printx: number,
  printy: number,
): void {
  let i: number;
  let dest: number, screen: number, src: number;

  dest = vl.bufferofs + ylookup[printy] + (printx >> 2);

  for (let c = 0; c < str.length; c++) {
    src = tile8ptr + (str.charCodeAt(c) << 6);
    // each character is 64 bytes

    for (let plane = 0; plane < 4; plane++) {
      VGAMAPMASK(1 << plane);
      screen = dest;
      for (i = 0; i < 8; i++, screen += vl.linewidth) {
        // *screen = *src++ (word writes: 2 bytes per row per plane)
        vgaWrite(screen, memb[src]);
        vgaWrite(screen + 1, memb[src + 1]);
        src += 2;
      }
    }

    printx += 8;
    dest += 2;
  }
}

/*
===================
=
= VL_DrawLatch8String
=
===================
*/

export function VL_DrawLatch8String(
  str: string,
  tile8ptr: number,
  printx: number,
  printy: number,
): void {
  let src: number, dest: number;

  dest = vl.bufferofs + ylookup[printy] + (printx >> 2);

  VGAWRITEMODE(1);
  VGAMAPMASK(15);

  for (let c = 0; c < str.length; c++) {
    src = tile8ptr + (str.charCodeAt(c) << 4); // each character is 16 latch bytes

    // asm: 8 rows of lodsw/mov [di] — 2 latch-copied bytes per row
    let di = dest;
    let si = src;
    for (let row = 0; row < 8; row++) {
      vgaRead(si++);
      vgaWrite(di, 0);
      vgaRead(si++);
      vgaWrite(di + 1, 0);
      di += vl.linewidth;
    }

    printx += 8;
    dest += 2;
  }

  VGAWRITEMODE(0);
}

/*
===================
=
= VL_SizeTile8String
=
===================
*/

export function VL_SizeTile8String(str: string): {
  width: number;
  height: number;
} {
  return { height: 8, width: 8 * str.length };
}

/*
=============================================================================

	ID_VL_A.ASM routines — reimplemented from semantics (PORTING.md §7)

=============================================================================
*/

/*
;==============
;
; VL_WaitVBL
;
; Wait for the vertical retrace (returns before the actual vertical sync)
;
;==============
*/

export function VL_WaitVBL(num: number): void {
  waitVBL(num); // host-provided 70 Hz blocking (browser: Atomics; tests: virtual)
}

/*
;==============
;
; VL_SetCRTC
;
;==============
*/

export function VL_SetCRTC(crtc: number): void {
  // wait for display, then set CRTC start high/low
  outportb(CRTC_INDEX, CRTC_STARTHIGH);
  outportb(CRTC_INDEX + 1, (crtc >> 8) & 0xff);
  outportb(CRTC_INDEX, CRTC_STARTLOW);
  outportb(CRTC_INDEX + 1, crtc & 0xff);
}

/*
;==============
;
; VL_SetScreen
;
;==============
*/

export function VL_SetScreen(crtc: number, pel: number): void {
  // waits for the vertical retrace, then sets the CRTC start address and
  // the attribute-controller pel pan
  VL_WaitVBL(1);
  VL_SetCRTC(crtc);
  inportb(STATUS_REGISTER_1); // reset ATR flip-flop
  outportb(ATR_INDEX, ATR_PELPAN | 0x20);
  outportb(ATR_INDEX, pel);
}

/*
;==============
;
; VL_VideoID
;
; Returns the video card id (5 = VGA) — the model is always a VGA.
;
;==============
*/

export function VL_VideoID(): number {
  return 5;
}

// keep vgastate referenced (border color reads come with the menu port)
void vgastate;
