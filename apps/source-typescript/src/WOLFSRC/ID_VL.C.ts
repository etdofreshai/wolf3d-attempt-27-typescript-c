// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_VL.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_VL.C";
export const WOLFSRC_FUNCTIONS = [
  "VL_Bar",
  "VL_ClearVideo",
  "VL_ColorBorder",
  "VL_DePlaneVGA",
  "VL_DrawLatch8String",
  "VL_DrawTile8String",
  "VL_FadeIn",
  "VL_FadeOut",
  "VL_FillPalette",
  "VL_GetColor",
  "VL_GetPalette",
  "VL_Hlin",
  "VL_LatchToScreen",
  "VL_MaskedToScreen",
  "VL_MemToLatch",
  "VL_MemToScreen",
  "VL_Plot",
  "VL_ScreenToScreen",
  "VL_SetColor",
  "VL_SetLineWidth",
  "VL_SetPalette",
  "VL_SetSplitScreen",
  "VL_SetTextMode",
  "VL_SetVGAPlaneMode",
  "VL_Shutdown",
  "VL_SizeTile8String",
  "VL_Startup",
  "VL_TestPaletteSet",
  "VL_Vlin"
] as const;

const VGA_COLORS = 256;
const PALETTE_BYTES = VGA_COLORS * 3;
const MAXSCANLINES = 200;
const VIDEO_PLANE_BYTES = 0x10000;

export const currentPalette = new Uint8Array(PALETTE_BYTES);
export const palette1 = new Uint8Array(PALETTE_BYTES);
export const palette2 = new Uint8Array(PALETTE_BYTES);
export const videoPlanes = new Uint8Array(4 * VIDEO_PLANE_BYTES);
export const ylookup = new Uint16Array(MAXSCANLINES);
export let bufferofs = 0;
export let displayofs = 0;
export let pelpan = 0;
export let screenseg = 0xa000;
export let bordercolor = 0;
export let linewidth = 0;
export let screenfaded = false;
export let fastpalette = false;
export let videoMode = 3;
export let vgaPlaneMode = false;
export let deplaned = false;
export let mapmask = 0;
export let splitScreenLine = -1;
export let verticalBlankWaits = 0;
export let vlStarted = false;

export interface VgaColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export interface PaletteSummary {
  readonly firstColor: VgaColor;
  readonly lastColor: VgaColor;
  readonly checksum: number;
}

export interface PlanarWriteSummary {
  readonly plane: number;
  readonly offset: number;
  readonly color: number;
}

export interface PlanarFillSummary {
  readonly pixels: number;
  readonly color: number;
}

export interface PlanarCopySummary {
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
}

export interface Tile8StringSummary {
  readonly chars: number;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
}

export interface VideoModeSummary {
  readonly videoMode: number;
  readonly vgaPlaneMode: boolean;
  readonly deplaned: boolean;
  readonly mapmask: number;
  readonly linewidth: number;
  readonly bufferofs: number;
  readonly displayofs: number;
  readonly pelpan: number;
  readonly splitScreenLine: number;
  readonly screenfaded: boolean;
}

export interface SplitScreenSummary {
  readonly requestedLine: number;
  readonly registerLine: number;
  readonly lineCompareLow: number;
  readonly overflow: number;
}

export interface FadeSummary {
  readonly start: number;
  readonly end: number;
  readonly steps: number;
  readonly screenfaded: boolean;
  readonly firstColor: VgaColor;
  readonly lastColor: VgaColor;
  readonly checksum: number;
}

export function VL_DebugVideoState(): VideoModeSummary {
  return {
    videoMode,
    vgaPlaneMode,
    deplaned,
    mapmask,
    linewidth,
    bufferofs,
    displayofs,
    pelpan,
    splitScreenLine,
    screenfaded,
  };
}

export function VL_ResetVideoState(): VideoModeSummary {
  currentPalette.fill(0);
  palette1.fill(0);
  palette2.fill(0);
  videoPlanes.fill(0);
  ylookup.fill(0);
  bufferofs = 0;
  displayofs = 0;
  pelpan = 0;
  screenseg = 0xa000;
  bordercolor = 0;
  linewidth = 0;
  screenfaded = false;
  fastpalette = false;
  videoMode = 3;
  vgaPlaneMode = false;
  deplaned = false;
  mapmask = 0;
  splitScreenLine = -1;
  verticalBlankWaits = 0;
  vlStarted = false;
  return VL_DebugVideoState();
}

export function VL_Bar(x: number, y: number, width: number, height: number, color: number): PlanarFillSummary {
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      writePlanarPixel(x + col, y + row, color);
    }
  }
  return { pixels: Math.max(0, width) * Math.max(0, height), color: color & 0xff };
}

export function VL_ClearVideo(color: number): PlanarFillSummary {
  videoPlanes.fill(color & 0xff);
  return { pixels: 4 * VIDEO_PLANE_BYTES, color: color & 0xff };
}

export function VL_ColorBorder(color: number): number {
  bordercolor = color & 0xff;
  return bordercolor;
}

export function VL_DePlaneVGA(): VideoModeSummary {
  deplaned = true;
  vgaPlaneMode = true;
  VL_ClearVideo(0);
  return VL_DebugVideoState();
}

export function VL_DrawLatch8String(str: string | ArrayLike<number>, tile8ptr: number, printx: number, printy: number): Tile8StringSummary {
  const chars = cStringCodes(str);
  let dest = (bufferofs + ylookup[printy] + (printx >> 2)) & 0xffff;
  mapmask = 15;

  for (const ch of chars) {
    const src = (tile8ptr + (ch << 4)) & 0xffff;
    for (let plane = 0; plane < 4; plane++) {
      const base = planeBase(plane);
      for (let row = 0; row < 8; row++) {
        const source = base + ((src + row * 2) & 0xffff);
        const target = base + ((dest + row * linewidth) & 0xffff);
        videoPlanes[target] = videoPlanes[source];
        videoPlanes[target + 1] = videoPlanes[source + 1];
      }
    }
    dest = (dest + 2) & 0xffff;
  }

  return { chars: chars.length, width: chars.length * 8, height: 8, bytes: chars.length * 64 };
}

export function VL_DrawTile8String(str: string | ArrayLike<number>, tile8ptr: Uint8Array, printx: number, printy: number): Tile8StringSummary {
  const chars = cStringCodes(str);
  let dest = (bufferofs + ylookup[printy] + (printx >> 2)) & 0xffff;

  for (const ch of chars) {
    const src = ch << 6;
    if (tile8ptr.length < src + 64) {
      throw new Error(`VL_DrawTile8String requires glyph ${ch} at byte ${src}`);
    }

    for (let plane = 0; plane < 4; plane++) {
      mapmask = 1 << plane;
      const base = planeBase(plane);
      for (let row = 0; row < 8; row++) {
        const source = src + plane * 16 + row * 2;
        const target = base + ((dest + row * linewidth) & 0xffff);
        videoPlanes[target] = tile8ptr[source];
        videoPlanes[target + 1] = tile8ptr[source + 1];
      }
    }
    dest = (dest + 2) & 0xffff;
  }

  return { chars: chars.length, width: chars.length * 8, height: 8, bytes: chars.length * 64 };
}

export function VL_FadeIn(start: number, end: number, palette: Uint8Array, steps: number): FadeSummary {
  if (palette.length < PALETTE_BYTES) {
    throw new Error(`VL_FadeIn requires at least ${PALETTE_BYTES} palette bytes, got ${palette.length}`);
  }

  VL_WaitVBL(1);
  VL_GetPalette(palette1);
  palette2.set(palette1);

  const byteStart = start * 3;
  const byteEnd = end * 3 + 2;

  for (let i = 0; i < steps; i++) {
    for (let j = byteStart; j <= byteEnd; j++) {
      const delta = palette[j] - palette1[j];
      palette2[j] = (palette1[j] + Math.trunc((delta * i) / steps)) & 0xff;
    }

    VL_WaitVBL(1);
    VL_SetPalette(palette2);
  }

  VL_SetPalette(palette);
  screenfaded = false;
  return fadeSummary(start, end, steps);
}

export function VL_FadeOut(
  start: number,
  end: number,
  red: number,
  green: number,
  blue: number,
  steps: number,
): FadeSummary {
  VL_WaitVBL(1);
  VL_GetPalette(palette1);
  palette2.set(palette1);

  for (let i = 0; i < steps; i++) {
    let source = start * 3;
    let dest = start * 3;
    for (let j = start; j <= end; j++) {
      let orig = palette1[source++];
      let delta = red - orig;
      palette2[dest++] = (orig + Math.trunc((delta * i) / steps)) & 0xff;
      orig = palette1[source++];
      delta = green - orig;
      palette2[dest++] = (orig + Math.trunc((delta * i) / steps)) & 0xff;
      orig = palette1[source++];
      delta = blue - orig;
      palette2[dest++] = (orig + Math.trunc((delta * i) / steps)) & 0xff;
    }

    VL_WaitVBL(1);
    VL_SetPalette(palette2);
  }

  VL_FillPalette(red, green, blue);
  screenfaded = true;
  return fadeSummary(start, end, steps);
}

export function VL_FillPalette(red: number, green: number, blue: number): PaletteSummary {
  for (let i = 0; i < VGA_COLORS; i++) {
    const offset = i * 3;
    currentPalette[offset] = red & 0xff;
    currentPalette[offset + 1] = green & 0xff;
    currentPalette[offset + 2] = blue & 0xff;
  }
  return paletteSummary();
}

export function VL_GetColor(color: number): VgaColor {
  const offset = paletteOffset(color);
  return {
    red: currentPalette[offset],
    green: currentPalette[offset + 1],
    blue: currentPalette[offset + 2],
  };
}

export function VL_GetPalette(dest: Uint8Array = new Uint8Array(PALETTE_BYTES)): Uint8Array {
  if (dest.length < PALETTE_BYTES) {
    throw new Error(`VL_GetPalette requires at least ${PALETTE_BYTES} bytes, got ${dest.length}`);
  }
  dest.set(currentPalette);
  return dest;
}

export function VL_Hlin(x: number, y: number, width: number, color: number): PlanarFillSummary {
  for (let col = 0; col < width; col++) {
    writePlanarPixel(x + col, y, color);
  }
  return { pixels: Math.max(0, width), color: color & 0xff };
}

export function VL_LatchToScreen(source: number, width: number, height: number, x: number, y: number): PlanarCopySummary {
  const rowBytes = Math.max(0, Math.trunc(width));
  const rows = Math.max(0, Math.trunc(height));
  const sourceOffset = source & 0xffff;
  const dest = (bufferofs + ylookup[y] + (x >> 2)) & 0xffff;

  for (let plane = 0; plane < 4; plane++) {
    const base = planeBase(plane);
    for (let row = 0; row < rows; row++) {
      const sourceStart = base + ((sourceOffset + row * rowBytes) & 0xffff);
      const destStart = base + ((dest + row * linewidth) & 0xffff);
      videoPlanes.copyWithin(destStart, sourceStart, sourceStart + rowBytes);
    }
  }
  return { bytes: rowBytes * rows * 4, width: rowBytes, height: rows };
}

export function VL_MaskedToScreen(source: Uint8Array, width: number, height: number, x: number, y: number): PlanarCopySummary {
  return VL_MemToScreen(source, width, height, x, y);
}

export function VL_MemToLatch(source: Uint8Array, width: number, height: number, dest: number): PlanarCopySummary {
  const rowBytes = Math.max(0, Math.trunc((width + 3) / 4));
  const rows = Math.max(0, Math.trunc(height));
  const count = rowBytes * rows;
  const required = count * 4;
  if (source.length < required) {
    throw new Error(`VL_MemToLatch requires ${required} source bytes, got ${source.length}`);
  }

  const destOffset = dest & 0xffff;
  let sourceOffset = 0;
  for (let plane = 0; plane < 4; plane++) {
    const target = planeBase(plane) + destOffset;
    videoPlanes.set(source.subarray(sourceOffset, sourceOffset + count), target);
    sourceOffset += count;
  }
  return { bytes: required, width, height: rows };
}

export function VL_MemToScreen(source: Uint8Array, width: number, height: number, x: number, y: number): PlanarCopySummary {
  const bytesPerPlane = width >> 2;
  const required = bytesPerPlane * height * 4;
  if (source.length < required) {
    throw new Error(`VL_MemToScreen requires ${required} source bytes, got ${source.length}`);
  }

  const dest = bufferofs + ylookup[y] + (x >> 2);
  let maskPlane = x & 3;
  let sourceOffset = 0;
  for (let plane = 0; plane < 4; plane++) {
    const targetPlane = maskPlane;
    for (let row = 0; row < height; row++) {
      const target = planeBase(targetPlane) + ((dest + row * linewidth) & 0xffff);
      videoPlanes.set(source.subarray(sourceOffset, sourceOffset + bytesPerPlane), target);
      sourceOffset += bytesPerPlane;
    }
    maskPlane = (maskPlane + 1) & 3;
  }
  return { bytes: required, width, height };
}

export function VL_Plot(x: number, y: number, color: number): PlanarWriteSummary {
  return writePlanarPixel(x, y, color);
}

export function VL_ScreenToScreen(source: number, dest: number, width: number, height: number): PlanarCopySummary {
  for (let plane = 0; plane < 4; plane++) {
    const base = planeBase(plane);
    for (let row = 0; row < height; row++) {
      const sourceOffset = base + ((source + row * linewidth) & 0xffff);
      const destOffset = base + ((dest + row * linewidth) & 0xffff);
      videoPlanes.copyWithin(destOffset, sourceOffset, sourceOffset + width);
    }
  }
  return { bytes: width * height * 4, width, height };
}

export function VL_SetColor(color: number, red: number, green: number, blue: number): VgaColor {
  const offset = paletteOffset(color);
  currentPalette[offset] = red & 0xff;
  currentPalette[offset + 1] = green & 0xff;
  currentPalette[offset + 2] = blue & 0xff;
  return VL_GetColor(color);
}

export function VL_SetLineWidth(width: number): { readonly linewidth: number; readonly lastOffset: number } {
  linewidth = (width * 2) & 0xffff;
  let offset = 0;
  for (let i = 0; i < MAXSCANLINES; i++) {
    ylookup[i] = offset & 0xffff;
    offset += linewidth;
  }
  return { linewidth, lastOffset: ylookup[MAXSCANLINES - 1] };
}

export function VL_SetPalette(palette: Uint8Array): PaletteSummary {
  if (palette.length < PALETTE_BYTES) {
    throw new Error(`VL_SetPalette requires at least ${PALETTE_BYTES} bytes, got ${palette.length}`);
  }
  currentPalette.set(palette.subarray(0, PALETTE_BYTES));
  screenfaded = false;
  return paletteSummary();
}

export function VL_SetSplitScreen(linenum: number): SplitScreenSummary {
  VL_WaitVBL(1);
  const registerLine = linenum * 2 - 1;
  splitScreenLine = registerLine;
  return {
    requestedLine: linenum,
    registerLine,
    lineCompareLow: registerLine & 0xff,
    overflow: (1 + 16 * Math.trunc(registerLine / 256)) & 0xff,
  };
}

export function VL_SetTextMode(): VideoModeSummary {
  videoMode = 3;
  vgaPlaneMode = false;
  deplaned = false;
  return VL_DebugVideoState();
}

export function VL_SetVGAPlaneMode(): VideoModeSummary {
  videoMode = 0x13;
  VL_DePlaneVGA();
  mapmask = 15;
  VL_SetLineWidth(40);
  return VL_DebugVideoState();
}

export function VL_Shutdown(): VideoModeSummary {
  VL_SetTextMode();
  vlStarted = false;
  return VL_DebugVideoState();
}

export function VL_SizeTile8String(str: string | ArrayLike<number>): { readonly width: number; readonly height: number } {
  return { width: cStringCodes(str).length * 8, height: 8 };
}

export function VL_Startup(): VideoModeSummary {
  vlStarted = true;
  return VL_DebugVideoState();
}

export function VL_TestPaletteSet(): boolean {
  for (let i = 0; i < PALETTE_BYTES; i++) {
    palette1[i] = i & 0xff;
  }

  fastpalette = true;
  VL_SetPalette(palette1);
  VL_GetPalette(palette2);
  for (let i = 0; i < PALETTE_BYTES; i++) {
    if (palette1[i] !== palette2[i]) {
      fastpalette = false;
      break;
    }
  }
  return fastpalette;
}

export function VL_Vlin(x: number, y: number, height: number, color: number): PlanarFillSummary {
  for (let row = 0; row < height; row++) {
    writePlanarPixel(x, y + row, color);
  }
  return { pixels: Math.max(0, height), color: color & 0xff };
}

function paletteOffset(color: number): number {
  if (color < 0 || color >= VGA_COLORS) {
    throw new RangeError(`VGA color index out of range: ${color}`);
  }
  return color * 3;
}

function paletteSummary(): PaletteSummary {
  return {
    firstColor: VL_GetColor(0),
    lastColor: VL_GetColor(255),
    checksum: currentPalette.reduce((sum, value) => (sum + value) >>> 0, 0),
  };
}

function fadeSummary(start: number, end: number, steps: number): FadeSummary {
  const summary = paletteSummary();
  return {
    start,
    end,
    steps,
    screenfaded,
    firstColor: summary.firstColor,
    lastColor: summary.lastColor,
    checksum: summary.checksum,
  };
}

export function VL_WaitVBL(vbls: number): number {
  verticalBlankWaits += Math.max(0, Math.trunc(vbls));
  return verticalBlankWaits;
}

export function VL_SetCRTC(crtc: number): VideoModeSummary {
  displayofs = crtc & 0xffff;
  return VL_DebugVideoState();
}

export function VL_SetScreen(crtc: number, pel: number): VideoModeSummary {
  displayofs = crtc & 0xffff;
  pelpan = pel & 0xff;
  return VL_DebugVideoState();
}

export function VL_SetBufferOffset(offset: number): VideoModeSummary {
  bufferofs = offset & 0xffff;
  return VL_DebugVideoState();
}

function cStringCodes(str: string | ArrayLike<number>): number[] {
  const codes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = (typeof str === "string" ? str.charCodeAt(i) : str[i]) & 0xff;
    if (code === 0) {
      break;
    }
    codes.push(code);
  }
  return codes;
}

function writePlanarPixel(x: number, y: number, color: number): PlanarWriteSummary {
  if (x < 0 || y < 0 || y >= MAXSCANLINES) {
    throw new RangeError(`VGA pixel out of range: ${x},${y}`);
  }
  const plane = x & 3;
  const offset = (bufferofs + ylookup[y] + (x >> 2)) & 0xffff;
  videoPlanes[planeBase(plane) + offset] = color & 0xff;
  return { plane, offset, color: color & 0xff };
}

function planeBase(plane: number): number {
  return (plane & 3) * VIDEO_PLANE_BYTES;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // ID_VL.C
// 
// #include <dos.h>
// #include <alloc.h>
// #include <mem.h>
// #include <string.h>
// #include "ID_HEAD.H"
// #include "ID_VL.H"
// #pragma hdrstop
// 
// //
// // SC_INDEX is expected to stay at SC_MAPMASK for proper operation
// //
// 
// unsigned	bufferofs;
// unsigned	displayofs,pelpan;
// 
// unsigned	screenseg=SCREENSEG;		// set to 0xa000 for asm convenience
// 
// unsigned	linewidth;
// unsigned	ylookup[MAXSCANLINES];
// 
// boolean		screenfaded;
// unsigned	bordercolor;
// 
// boolean		fastpalette;				// if true, use outsb to set
// 
// byte		far	palette1[256][3],far palette2[256][3];
// 
// //===========================================================================
// 
// // asm
// 
// int	 VL_VideoID (void);
// void VL_SetCRTC (int crtc);
// void VL_SetScreen (int crtc, int pelpan);
// void VL_WaitVBL (int vbls);
// 
// //===========================================================================
// 
// 
// /*
// =======================
// =
// = VL_Startup
// =
// =======================
// */
// 
// #if 0
// void	VL_Startup (void)
// {
// 	if ( !MS_CheckParm ("HIDDENCARD") && VL_VideoID () != 5)
// 		MS_Quit ("You need a VGA graphics card to run this!");
// 
// 	asm	cld;				// all string instructions assume forward
// }
// 
// #endif
// 
// /*
// =======================
// =
// = VL_Startup	// WOLFENSTEIN HACK
// =
// =======================
// */
// 
// static	char *ParmStrings[] = {"HIDDENCARD",""};
// 
// void	VL_Startup (void)
// {
// 	int i,videocard;
// 
// 	asm	cld;
// 
// 	videocard = VL_VideoID ();
// 	for (i = 1;i < _argc;i++)
// 		if (US_CheckParm(_argv[i],ParmStrings) == 0)
// 		{
// 			videocard = 5;
// 			break;
// 		}
// 
// 	if (videocard != 5)
// Quit ("Improper video card!  If you really have a VGA card that I am not \n"
// 	  "detecting, use the -HIDDENCARD command line parameter!");
// 
// }
// 
// 
// 
// /*
// =======================
// =
// = VL_Shutdown
// =
// =======================
// */
// 
// void	VL_Shutdown (void)
// {
// 	VL_SetTextMode ();
// }
// 
// 
// /*
// =======================
// =
// = VL_SetVGAPlaneMode
// =
// =======================
// */
// 
// void	VL_SetVGAPlaneMode (void)
// {
// asm	mov	ax,0x13
// asm	int	0x10
// 	VL_DePlaneVGA ();
// 	VGAMAPMASK(15);
// 	VL_SetLineWidth (40);
// }
// 
// 
// /*
// =======================
// =
// = VL_SetTextMode
// =
// =======================
// */
// 
// void	VL_SetTextMode (void)
// {
// asm	mov	ax,3
// asm	int	0x10
// }
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_ClearVideo
// =
// = Fill the entire video buffer with a given color
// =
// =================
// */
// 
// void VL_ClearVideo (byte color)
// {
// asm	mov	dx,GC_INDEX
// asm	mov	al,GC_MODE
// asm	out	dx,al
// asm	inc	dx
// asm	in	al,dx
// asm	and	al,0xfc				// write mode 0 to store directly to video
// asm	out	dx,al
// 
// asm	mov	dx,SC_INDEX
// asm	mov	ax,SC_MAPMASK+15*256
// asm	out	dx,ax				// write through all four planes
// 
// asm	mov	ax,SCREENSEG
// asm	mov	es,ax
// asm	mov	al,[color]
// asm	mov	ah,al
// asm	mov	cx,0x8000			// 0x8000 words, clearing 8 video bytes/word
// asm	xor	di,di
// asm	rep	stosw
// }
// 
// 
// /*
// =============================================================================
// 
// 			VGA REGISTER MANAGEMENT ROUTINES
// 
// =============================================================================
// */
// 
// 
// /*
// =================
// =
// = VL_DePlaneVGA
// =
// =================
// */
// 
// void VL_DePlaneVGA (void)
// {
// 
// //
// // change CPU addressing to non linear mode
// //
// 
// //
// // turn off chain 4 and odd/even
// //
// 	outportb (SC_INDEX,SC_MEMMODE);
// 	outportb (SC_INDEX+1,(inportb(SC_INDEX+1)&~8)|4);
// 
// 	outportb (SC_INDEX,SC_MAPMASK);		// leave this set throughought
// 
// //
// // turn off odd/even and set write mode 0
// //
// 	outportb (GC_INDEX,GC_MODE);
// 	outportb (GC_INDEX+1,inportb(GC_INDEX+1)&~0x13);
// 
// //
// // turn off chain
// //
// 	outportb (GC_INDEX,GC_MISCELLANEOUS);
// 	outportb (GC_INDEX+1,inportb(GC_INDEX+1)&~2);
// 
// //
// // clear the entire buffer space, because int 10h only did 16 k / plane
// //
// 	VL_ClearVideo (0);
// 
// //
// // change CRTC scanning from doubleword to byte mode, allowing >64k scans
// //
// 	outportb (CRTC_INDEX,CRTC_UNDERLINE);
// 	outportb (CRTC_INDEX+1,inportb(CRTC_INDEX+1)&~0x40);
// 
// 	outportb (CRTC_INDEX,CRTC_MODE);
// 	outportb (CRTC_INDEX+1,inportb(CRTC_INDEX+1)|0x40);
// }
// 
// //===========================================================================
// 
// /*
// ====================
// =
// = VL_SetLineWidth
// =
// = Line witdh is in WORDS, 40 words is normal width for vgaplanegr
// =
// ====================
// */
// 
// void VL_SetLineWidth (unsigned width)
// {
// 	int i,offset;
// 
// //
// // set wide virtual screen
// //
// 	outport (CRTC_INDEX,CRTC_OFFSET+width*256);
// 
// //
// // set up lookup tables
// //
// 	linewidth = width*2;
// 
// 	offset = 0;
// 
// 	for (i=0;i<MAXSCANLINES;i++)
// 	{
// 		ylookup[i]=offset;
// 		offset += linewidth;
// 	}
// }
// 
// /*
// ====================
// =
// = VL_SetSplitScreen
// =
// ====================
// */
// 
// void VL_SetSplitScreen (int linenum)
// {
// 	VL_WaitVBL (1);
// 	linenum=linenum*2-1;
// 	outportb (CRTC_INDEX,CRTC_LINECOMPARE);
// 	outportb (CRTC_INDEX+1,linenum % 256);
// 	outportb (CRTC_INDEX,CRTC_OVERFLOW);
// 	outportb (CRTC_INDEX+1, 1+16*(linenum/256));
// 	outportb (CRTC_INDEX,CRTC_MAXSCANLINE);
// 	outportb (CRTC_INDEX+1,inportb(CRTC_INDEX+1) & (255-64));
// }
// 
// 
// /*
// =============================================================================
// 
// 						PALETTE OPS
// 
// 		To avoid snow, do a WaitVBL BEFORE calling these
// 
// =============================================================================
// */
// 
// 
// /*
// =================
// =
// = VL_FillPalette
// =
// =================
// */
// 
// void VL_FillPalette (int red, int green, int blue)
// {
// 	int	i;
// 
// 	outportb (PEL_WRITE_ADR,0);
// 	for (i=0;i<256;i++)
// 	{
// 		outportb (PEL_DATA,red);
// 		outportb (PEL_DATA,green);
// 		outportb (PEL_DATA,blue);
// 	}
// }
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_SetColor
// =
// =================
// */
// 
// void VL_SetColor	(int color, int red, int green, int blue)
// {
// 	outportb (PEL_WRITE_ADR,color);
// 	outportb (PEL_DATA,red);
// 	outportb (PEL_DATA,green);
// 	outportb (PEL_DATA,blue);
// }
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_GetColor
// =
// =================
// */
// 
// void VL_GetColor	(int color, int *red, int *green, int *blue)
// {
// 	outportb (PEL_READ_ADR,color);
// 	*red = inportb (PEL_DATA);
// 	*green = inportb (PEL_DATA);
// 	*blue = inportb (PEL_DATA);
// }
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_SetPalette
// =
// = If fast palette setting has been tested for, it is used
// = (some cards don't like outsb palette setting)
// =
// =================
// */
// 
// void VL_SetPalette (byte far *palette)
// {
// 	int	i;
// 
// //	outportb (PEL_WRITE_ADR,0);
// //	for (i=0;i<768;i++)
// //		outportb(PEL_DATA,*palette++);
// 
// 	asm	mov	dx,PEL_WRITE_ADR
// 	asm	mov	al,0
// 	asm	out	dx,al
// 	asm	mov	dx,PEL_DATA
// 	asm	lds	si,[palette]
// 
// 	asm	test	[ss:fastpalette],1
// 	asm	jz	slowset
// //
// // set palette fast for cards that can take it
// //
// 	asm	mov	cx,768
// 	asm	rep outsb
// 	asm	jmp	done
// 
// //
// // set palette slowly for some video cards
// //
// slowset:
// 	asm	mov	cx,256
// setloop:
// 	asm	lodsb
// 	asm	out	dx,al
// 	asm	lodsb
// 	asm	out	dx,al
// 	asm	lodsb
// 	asm	out	dx,al
// 	asm	loop	setloop
// 
// done:
// 	asm	mov	ax,ss
// 	asm	mov	ds,ax
// 
// }
// 
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_GetPalette
// =
// = This does not use the port string instructions,
// = due to some incompatabilities
// =
// =================
// */
// 
// void VL_GetPalette (byte far *palette)
// {
// 	int	i;
// 
// 	outportb (PEL_READ_ADR,0);
// 	for (i=0;i<768;i++)
// 		*palette++ = inportb(PEL_DATA);
// }
// 
// 
// //===========================================================================
// 
// /*
// =================
// =
// = VL_FadeOut
// =
// = Fades the current palette to the given color in the given number of steps
// =
// =================
// */
// 
// void VL_FadeOut (int start, int end, int red, int green, int blue, int steps)
// {
// 	int		i,j,orig,delta;
// 	byte	far *origptr, far *newptr;
// 
// 	VL_WaitVBL(1);
// 	VL_GetPalette (&palette1[0][0]);
// 	_fmemcpy (palette2,palette1,768);
// 
// //
// // fade through intermediate frames
// //
// 	for (i=0;i<steps;i++)
// 	{
// 		origptr = &palette1[start][0];
// 		newptr = &palette2[start][0];
// 		for (j=start;j<=end;j++)
// 		{
// 			orig = *origptr++;
// 			delta = red-orig;
// 			*newptr++ = orig + delta * i / steps;
// 			orig = *origptr++;
// 			delta = green-orig;
// 			*newptr++ = orig + delta * i / steps;
// 			orig = *origptr++;
// 			delta = blue-orig;
// 			*newptr++ = orig + delta * i / steps;
// 		}
// 
// 		VL_WaitVBL(1);
// 		VL_SetPalette (&palette2[0][0]);
// 	}
// 
// //
// // final color
// //
// 	VL_FillPalette (red,green,blue);
// 
// 	screenfaded = true;
// }
// 
// 
// /*
// =================
// =
// = VL_FadeIn
// =
// =================
// */
// 
// void VL_FadeIn (int start, int end, byte far *palette, int steps)
// {
// 	int		i,j,delta;
// 
// 	VL_WaitVBL(1);
// 	VL_GetPalette (&palette1[0][0]);
// 	_fmemcpy (&palette2[0][0],&palette1[0][0],sizeof(palette1));
// 
// 	start *= 3;
// 	end = end*3+2;
// 
// //
// // fade through intermediate frames
// //
// 	for (i=0;i<steps;i++)
// 	{
// 		for (j=start;j<=end;j++)
// 		{
// 			delta = palette[j]-palette1[0][j];
// 			palette2[0][j] = palette1[0][j] + delta * i / steps;
// 		}
// 
// 		VL_WaitVBL(1);
// 		VL_SetPalette (&palette2[0][0]);
// 	}
// 
// //
// // final color
// //
// 	VL_SetPalette (palette);
// 	screenfaded = false;
// }
// 
// 
// 
// /*
// =================
// =
// = VL_TestPaletteSet
// =
// = Sets the palette with outsb, then reads it in and compares
// = If it compares ok, fastpalette is set to true.
// =
// =================
// */
// 
// void VL_TestPaletteSet (void)
// {
// 	int	i;
// 
// 	for (i=0;i<768;i++)
// 		palette1[0][i] = i;
// 
// 	fastpalette = true;
// 	VL_SetPalette (&palette1[0][0]);
// 	VL_GetPalette (&palette2[0][0]);
// 	if (_fmemcmp (&palette1[0][0],&palette2[0][0],768))
// 		fastpalette = false;
// }
// 
// 
// /*
// ==================
// =
// = VL_ColorBorder
// =
// ==================
// */
// 
// void VL_ColorBorder (int color)
// {
// 	_AH=0x10;
// 	_AL=1;
// 	_BH=color;
// 	geninterrupt (0x10);
// 	bordercolor = color;
// }
// 
// 
// 
// /*
// =============================================================================
// 
// 							PIXEL OPS
// 
// =============================================================================
// */
// 
// byte	pixmasks[4] = {1,2,4,8};
// byte	leftmasks[4] = {15,14,12,8};
// byte	rightmasks[4] = {1,3,7,15};
// 
// 
// /*
// =================
// =
// = VL_Plot
// =
// =================
// */
// 
// void VL_Plot (int x, int y, int color)
// {
// 	byte mask;
// 
// 	mask = pixmasks[x&3];
// 	VGAMAPMASK(mask);
// 	*(byte far *)MK_FP(SCREENSEG,bufferofs+(ylookup[y]+(x>>2))) = color;
// 	VGAMAPMASK(15);
// }
// 
// 
// /*
// =================
// =
// = VL_Hlin
// =
// =================
// */
// 
// void VL_Hlin (unsigned x, unsigned y, unsigned width, unsigned color)
// {
// 	unsigned		xbyte;
// 	byte			far *dest;
// 	byte			leftmask,rightmask;
// 	int				midbytes;
// 
// 	xbyte = x>>2;
// 	leftmask = leftmasks[x&3];
// 	rightmask = rightmasks[(x+width-1)&3];
// 	midbytes = ((x+width+3)>>2) - xbyte - 2;
// 
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[y]+xbyte);
// 
// 	if (midbytes<0)
// 	{
// 	// all in one byte
// 		VGAMAPMASK(leftmask&rightmask);
// 		*dest = color;
// 		VGAMAPMASK(15);
// 		return;
// 	}
// 
// 	VGAMAPMASK(leftmask);
// 	*dest++ = color;
// 
// 	VGAMAPMASK(15);
// 	_fmemset (dest,color,midbytes);
// 	dest+=midbytes;
// 
// 	VGAMAPMASK(rightmask);
// 	*dest = color;
// 
// 	VGAMAPMASK(15);
// }
// 
// 
// /*
// =================
// =
// = VL_Vlin
// =
// =================
// */
// 
// void VL_Vlin (int x, int y, int height, int color)
// {
// 	byte	far *dest,mask;
// 
// 	mask = pixmasks[x&3];
// 	VGAMAPMASK(mask);
// 
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[y]+(x>>2));
// 
// 	while (height--)
// 	{
// 		*dest = color;
// 		dest += linewidth;
// 	}
// 
// 	VGAMAPMASK(15);
// }
// 
// 
// /*
// =================
// =
// = VL_Bar
// =
// =================
// */
// 
// void VL_Bar (int x, int y, int width, int height, int color)
// {
// 	byte	far *dest;
// 	byte	leftmask,rightmask;
// 	int		midbytes,linedelta;
// 
// 	leftmask = leftmasks[x&3];
// 	rightmask = rightmasks[(x+width-1)&3];
// 	midbytes = ((x+width+3)>>2) - (x>>2) - 2;
// 	linedelta = linewidth-(midbytes+1);
// 
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[y]+(x>>2));
// 
// 	if (midbytes<0)
// 	{
// 	// all in one byte
// 		VGAMAPMASK(leftmask&rightmask);
// 		while (height--)
// 		{
// 			*dest = color;
// 			dest += linewidth;
// 		}
// 		VGAMAPMASK(15);
// 		return;
// 	}
// 
// 	while (height--)
// 	{
// 		VGAMAPMASK(leftmask);
// 		*dest++ = color;
// 
// 		VGAMAPMASK(15);
// 		_fmemset (dest,color,midbytes);
// 		dest+=midbytes;
// 
// 		VGAMAPMASK(rightmask);
// 		*dest = color;
// 
// 		dest+=linedelta;
// 	}
// 
// 	VGAMAPMASK(15);
// }
// 
// /*
// ============================================================================
// 
// 							MEMORY OPS
// 
// ============================================================================
// */
// 
// /*
// =================
// =
// = VL_MemToLatch
// =
// =================
// */
// 
// void VL_MemToLatch (byte far *source, int width, int height, unsigned dest)
// {
// 	unsigned	count;
// 	byte	plane,mask;
// 
// 	count = ((width+3)/4)*height;
// 	mask = 1;
// 	for (plane = 0; plane<4 ; plane++)
// 	{
// 		VGAMAPMASK(mask);
// 		mask <<= 1;
// 
// asm	mov	cx,count
// asm mov ax,SCREENSEG
// asm mov es,ax
// asm	mov	di,[dest]
// asm	lds	si,[source]
// asm	rep movsb
// asm mov	ax,ss
// asm	mov	ds,ax
// 
// 		source+= count;
// 	}
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// =================
// =
// = VL_MemToScreen
// =
// = Draws a block of data to the screen.
// =
// =================
// */
// 
// void VL_MemToScreen (byte far *source, int width, int height, int x, int y)
// {
// 	byte    far *screen,far *dest,mask;
// 	int		plane;
// 
// 	width>>=2;
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[y]+(x>>2) );
// 	mask = 1 << (x&3);
// 
// 	for (plane = 0; plane<4; plane++)
// 	{
// 		VGAMAPMASK(mask);
// 		mask <<= 1;
// 		if (mask == 16)
// 			mask = 1;
// 
// 		screen = dest;
// 		for (y=0;y<height;y++,screen+=linewidth,source+=width)
// 			_fmemcpy (screen,source,width);
// 	}
// }
// 
// //==========================================================================
// 
// 
// /*
// =================
// =
// = VL_MaskedToScreen
// =
// = Masks a block of main memory to the screen.
// =
// =================
// */
// 
// void VL_MaskedToScreen (byte far *source, int width, int height, int x, int y)
// {
// 	byte    far *screen,far *dest,mask;
// 	byte	far *maskptr;
// 	int		plane;
// 
// 	width>>=2;
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[y]+(x>>2) );
// //	mask = 1 << (x&3);
// 
// //	maskptr = source;
// 
// 	for (plane = 0; plane<4; plane++)
// 	{
// 		VGAMAPMASK(mask);
// 		mask <<= 1;
// 		if (mask == 16)
// 			mask = 1;
// 
// 		screen = dest;
// 		for (y=0;y<height;y++,screen+=linewidth,source+=width)
// 			_fmemcpy (screen,source,width);
// 	}
// }
// 
// //==========================================================================
// 
// /*
// =================
// =
// = VL_LatchToScreen
// =
// =================
// */
// 
// void VL_LatchToScreen (unsigned source, int width, int height, int x, int y)
// {
// 	VGAWRITEMODE(1);
// 	VGAMAPMASK(15);
// 
// asm	mov	di,[y]				// dest = bufferofs+ylookup[y]+(x>>2)
// asm	shl	di,1
// asm	mov	di,[WORD PTR ylookup+di]
// asm	add	di,[bufferofs]
// asm	mov	ax,[x]
// asm	shr	ax,2
// asm	add	di,ax
// 
// asm	mov	si,[source]
// asm	mov	ax,[width]
// asm	mov	bx,[linewidth]
// asm	sub	bx,ax
// asm	mov	dx,[height]
// asm	mov	cx,SCREENSEG
// asm	mov	ds,cx
// asm	mov	es,cx
// 
// drawline:
// asm	mov	cx,ax
// asm	rep movsb
// asm	add	di,bx
// asm	dec	dx
// asm	jnz	drawline
// 
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// 	VGAWRITEMODE(0);
// }
// 
// 
// //===========================================================================
// 
// #if 0
// 
// /*
// =================
// =
// = VL_ScreenToScreen
// =
// =================
// */
// 
// void VL_ScreenToScreen (unsigned source, unsigned dest,int width, int height)
// {
// 	VGAWRITEMODE(1);
// 	VGAMAPMASK(15);
// 
// asm	mov	si,[source]
// asm	mov	di,[dest]
// asm	mov	ax,[width]
// asm	mov	bx,[linewidth]
// asm	sub	bx,ax
// asm	mov	dx,[height]
// asm	mov	cx,SCREENSEG
// asm	mov	ds,cx
// asm	mov	es,cx
// 
// drawline:
// asm	mov	cx,ax
// asm	rep movsb
// asm	add	si,bx
// asm	add	di,bx
// asm	dec	dx
// asm	jnz	drawline
// 
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// 	VGAWRITEMODE(0);
// }
// 
// 
// #endif
// 
// /*
// =============================================================================
// 
// 						STRING OUTPUT ROUTINES
// 
// =============================================================================
// */
// 
// 
// 
// 
// /*
// ===================
// =
// = VL_DrawTile8String
// =
// ===================
// */
// 
// void VL_DrawTile8String (char *str, char far *tile8ptr, int printx, int printy)
// {
// 	int		i;
// 	unsigned	far *dest,far *screen,far *src;
// 
// 	dest = MK_FP(SCREENSEG,bufferofs+ylookup[printy]+(printx>>2));
// 
// 	while (*str)
// 	{
// 		src = (unsigned far *)(tile8ptr + (*str<<6));
// 		// each character is 64 bytes
// 
// 		VGAMAPMASK(1);
// 		screen = dest;
// 		for (i=0;i<8;i++,screen+=linewidth)
// 			*screen = *src++;
// 		VGAMAPMASK(2);
// 		screen = dest;
// 		for (i=0;i<8;i++,screen+=linewidth)
// 			*screen = *src++;
// 		VGAMAPMASK(4);
// 		screen = dest;
// 		for (i=0;i<8;i++,screen+=linewidth)
// 			*screen = *src++;
// 		VGAMAPMASK(8);
// 		screen = dest;
// 		for (i=0;i<8;i++,screen+=linewidth)
// 			*screen = *src++;
// 
// 		str++;
// 		printx += 8;
// 		dest+=2;
// 	}
// }
// 
// 
// 
// /*
// ===================
// =
// = VL_DrawLatch8String
// =
// ===================
// */
// 
// void VL_DrawLatch8String (char *str, unsigned tile8ptr, int printx, int printy)
// {
// 	int		i;
// 	unsigned	src,dest;
// 
// 	dest = bufferofs+ylookup[printy]+(printx>>2);
// 
// 	VGAWRITEMODE(1);
// 	VGAMAPMASK(15);
// 
// 	while (*str)
// 	{
// 		src = tile8ptr + (*str<<4);		// each character is 16 latch bytes
// 
// asm	mov	si,[src]
// asm	mov	di,[dest]
// asm	mov	dx,[linewidth]
// 
// asm	mov	ax,SCREENSEG
// asm	mov	ds,ax
// 
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// asm	lodsw
// asm	mov	[di],ax
// asm	add	di,dx
// 
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// 		str++;
// 		printx += 8;
// 		dest+=2;
// 	}
// 
// 	VGAWRITEMODE(0);
// }
// 
// 
// /*
// ===================
// =
// = VL_SizeTile8String
// =
// ===================
// */
// 
// void VL_SizeTile8String (char *str, int *width, int *height)
// {
// 	*height = 8;
// 	*width = 8*strlen(str);
// }
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
