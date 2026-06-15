import { readI16LE, readU16LE } from "./TS_C";
import {
  bufferofs,
  displayofs,
  VL_Bar,
  VL_Hlin,
  VL_LatchToScreen,
  VL_MemToLatch,
  VL_MemToScreen,
  VL_Plot,
  VL_ScreenToScreen,
  videoPlanes,
  VL_Vlin,
  ylookup,
  type PlanarCopySummary,
  type PlanarFillSummary,
  type PlanarWriteSummary,
} from "./ID_VL.C";
import { IN_CheckAck, IN_StartAck } from "./ID_IN.C";
import { grsegs } from "./ID_CA.C";
import {
  LATCHPICS_LUMP_END,
  LATCHPICS_LUMP_START,
  NUMTILE8,
  STARTFONT,
  STARTFONTM,
  STARTPICS,
  STARTTILE8,
  STARTTILE8M,
  STRUCTPIC,
} from "./TS_WL6_ASSETS";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_VH.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_VH.C";
export const WOLFSRC_FUNCTIONS = [
  "FizzleFade",
  "LatchDrawPic",
  "LoadLatchMem",
  "VL_MungePic",
  "VW_DrawColorPropString",
  "VW_DrawPropString",
  "VW_MarkUpdateBlock",
  "VW_MeasureMPropString",
  "VW_MeasurePropString",
  "VW_UpdateScreen",
  "VWB_Bar",
  "VWB_DrawPic",
  "VWB_DrawPropString",
  "VWB_DrawTile8",
  "VWB_DrawTile8M",
  "VWB_Hlin",
  "VWB_Plot",
  "VWB_Vlin",
  "VWL_MeasureString"
] as const;

const UPDATEWIDE = 20;
const UPDATEHIGH = 13;
const PIXTOBLOCK = 4;
const SCREENWIDTH = 80;
const TILEWIDTH = 4;
const VIDEO_PLANE_BYTES = 0x10000;
const NUMLATCHPICS = 100;
const SCREENBWIDE = 80;
const SCREENSIZE = SCREENBWIDE * 208;
const FREESTART = SCREENSIZE * 3;
const FONT_LOCATION_OFFSET = 2;
const FONT_WIDTH_OFFSET = FONT_LOCATION_OFFSET + 256 * 2;

export const update = new Uint8Array(UPDATEWIDE * UPDATEHIGH);
export const latchpics = new Uint16Array(NUMLATCHPICS);
export let freelatch = FREESTART;
export let px = 0;
export let py = 0;
export let fontcolor = 0;
export let backcolor = 0;
export let fontnumber = 0;
export let bufferwidth = 0;
export let bufferheight = 0;

export interface MarkUpdateSummary {
  readonly marked: boolean;
  readonly xt1: number;
  readonly yt1: number;
  readonly xt2: number;
  readonly yt2: number;
}

export interface BufferedDrawSummary<T> {
  readonly mark: MarkUpdateSummary;
  readonly draw: T | null;
}

export interface UpdateScreenSummary {
  readonly blocks: number;
  readonly bytes: number;
  readonly firstCopy: PlanarCopySummary | null;
  readonly lastBlock: number | null;
}

export interface DrawPicOptions {
  readonly source?: Uint8Array;
  readonly width?: number;
  readonly height?: number;
  readonly pictable?: Uint8Array;
}

export interface BufferedPicDrawSummary extends BufferedDrawSummary<PlanarCopySummary> {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly sourceBytes: number;
}

export interface LoadLatchMemOptions {
  readonly freeStart?: number;
  readonly chunks?: readonly (Uint8Array | null | undefined)[];
  readonly pictable?: Uint8Array;
  readonly start?: number;
  readonly end?: number;
}

export interface LoadLatchMemSummary {
  readonly tile8Offset: number;
  readonly firstPicOffset: number;
  readonly endOffset: number;
  readonly tile8Count: number;
  readonly picCount: number;
}

export interface LatchDrawPicOptions {
  readonly pictable?: Uint8Array;
}

export interface LatchDrawPicSummary {
  readonly source: number;
  readonly width: number;
  readonly height: number;
  readonly draw: PlanarCopySummary;
}

export interface FontStateOptions {
  readonly px?: number;
  readonly py?: number;
  readonly fontcolor?: number;
  readonly backcolor?: number;
  readonly fontnumber?: number;
}

export interface FontStateSummary {
  readonly px: number;
  readonly py: number;
  readonly fontcolor: number;
  readonly backcolor: number;
  readonly fontnumber: number;
  readonly bufferwidth: number;
  readonly bufferheight: number;
}

export interface FontOptions {
  readonly font?: Uint8Array;
  readonly fontnumber?: number;
}

export interface PropStringSummary {
  readonly text: string;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly width: number;
  readonly height: number;
  readonly chars: number;
  readonly pixels: number;
  readonly colorized: boolean;
}

export interface MeasureStringSummary {
  readonly width: number;
  readonly height: number;
  readonly chars: number;
}

export interface BufferedPropStringSummary extends BufferedDrawSummary<PropStringSummary> {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
}

export interface FizzleFadeSummary {
  readonly source: number;
  readonly dest: number;
  readonly width: number;
  readonly height: number;
  readonly frames: number;
  readonly pixperframe: number;
  readonly copied: number;
  readonly skipped: number;
  readonly framesElapsed: number;
  readonly finalRnd: number;
  readonly aborted: boolean;
}

export let lastFizzleFade: FizzleFadeSummary | null = null;

export function FizzleFade(
  source: number,
  dest: number,
  width: number,
  height: number,
  frames: number,
  abortable: boolean,
): boolean {
  const sourceOffset = source & 0xffff;
  const destOffset = dest & 0xffff;
  const pagedelta = (destOffset - sourceOffset) & 0xffff;
  const pixperframe = Math.trunc(64000 / frames);
  let rndval = 1;
  let frame = 0;
  let copied = 0;
  let skipped = 0;

  IN_StartAck();
  for (;;) {
    if (abortable && IN_CheckAck()) {
      lastFizzleFade = {
        source: sourceOffset,
        dest: destOffset,
        width,
        height,
        frames,
        pixperframe,
        copied,
        skipped,
        framesElapsed: frame,
        finalRnd: rndval >>> 0,
        aborted: true,
      };
      return true;
    }

    for (let p = 0; p < pixperframe; p++) {
      const y = ((rndval & 0xff) - 1) & 0xff;
      const x = (rndval >>> 8) & 0xffff;
      const carry = rndval & 1;
      rndval >>>= 1;
      if (carry) {
        rndval = (rndval ^ 0x00012000) >>> 0;
      }

      if (x > width || y > height || y >= ylookup.length) {
        skipped++;
      } else {
        const plane = x & 3;
        const drawofs = (sourceOffset + ylookup[y] + (x >> 2)) & 0xffff;
        const sourceIndex = plane * VIDEO_PLANE_BYTES + drawofs;
        const destIndex = plane * VIDEO_PLANE_BYTES + ((drawofs + pagedelta) & 0xffff);
        videoPlanes[destIndex] = videoPlanes[sourceIndex];
        copied++;
      }

      if (rndval === 1) {
        lastFizzleFade = {
          source: sourceOffset,
          dest: destOffset,
          width,
          height,
          frames,
          pixperframe,
          copied,
          skipped,
          framesElapsed: frame,
          finalRnd: rndval,
          aborted: false,
        };
        return false;
      }
    }
    frame++;
  }
}

export function LatchDrawPic(x: number, y: number, picnum: number, options: LatchDrawPicOptions = {}): LatchDrawPicSummary {
  const pictable = options.pictable ?? grsegs[STRUCTPIC];
  if (!pictable) {
    throw new Error("LatchDrawPic requires pictable data");
  }
  const tableIndex = picnum - STARTPICS;
  const width = readU16LE(pictable, tableIndex * 4);
  const height = readU16LE(pictable, tableIndex * 4 + 2);
  const source = latchpics[2 + picnum - LATCHPICS_LUMP_START];
  const draw = VL_LatchToScreen(source, width >> 2, height, x * 8, y);
  return { source, width, height, draw };
}

export function LoadLatchMem(options: LoadLatchMemOptions = {}): LoadLatchMemSummary {
  const chunks = options.chunks ?? grsegs;
  const pictable = options.pictable ?? grsegs[STRUCTPIC];
  if (!pictable) {
    throw new Error("LoadLatchMem requires pictable data");
  }

  freelatch = (options.freeStart ?? freelatch) & 0xffff;
  latchpics.fill(0);
  latchpics[0] = freelatch;
  let destoff = freelatch;

  const tile8 = chunks[STARTTILE8];
  if (!tile8) {
    throw new Error("LoadLatchMem requires STARTTILE8 graphics");
  }
  for (let i = 0; i < NUMTILE8; i++) {
    VL_MemToLatch(tile8.subarray(i * 64, i * 64 + 64), 8, 8, destoff);
    destoff = (destoff + 16) & 0xffff;
  }

  const start = options.start ?? LATCHPICS_LUMP_START;
  const end = options.end ?? LATCHPICS_LUMP_END;
  let firstPicOffset = destoff;
  let picCount = 0;
  for (let i = start; i <= end; i++) {
    const source = chunks[i];
    if (!source) {
      throw new Error(`LoadLatchMem requires graphics chunk ${i}`);
    }
    latchpics[2 + i - LATCHPICS_LUMP_START] = destoff;
    const width = readU16LE(pictable, (i - STARTPICS) * 4);
    const height = readU16LE(pictable, (i - STARTPICS) * 4 + 2);
    VL_MemToLatch(source, width, height, destoff);
    destoff = (destoff + ((width >> 2) * height)) & 0xffff;
    picCount++;
  }

  if (!picCount) {
    firstPicOffset = destoff;
  }

  return {
    tile8Offset: latchpics[0],
    firstPicOffset,
    endOffset: destoff,
    tile8Count: NUMTILE8,
    picCount,
  };
}

export function VL_MungePic(source: Uint8Array, width: number, height: number): Uint8Array {
  if (width & 3) {
    throw new Error("VL_MungePic: Not divisable by 4!");
  }

  const size = Math.max(0, Math.trunc(width)) * Math.max(0, Math.trunc(height));
  if (source.length < size) {
    throw new Error(`VL_MungePic requires ${size} source bytes, got ${source.length}`);
  }

  const temp = source.slice(0, size);
  let dest = 0;
  const pwidth = width >> 2;
  for (let plane = 0; plane < 4; plane++) {
    let srcline = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < pwidth; x++) {
        source[dest++] = temp[srcline + x * 4 + plane];
      }
      srcline += width;
    }
  }
  return source;
}

export function VW_DebugFontState(): FontStateSummary {
  return { px, py, fontcolor, backcolor, fontnumber, bufferwidth, bufferheight };
}

export function VW_SetFontState(options: FontStateOptions = {}): FontStateSummary {
  px = options.px ?? px;
  py = options.py ?? py;
  fontcolor = options.fontcolor ?? fontcolor;
  backcolor = options.backcolor ?? backcolor;
  fontnumber = options.fontnumber ?? fontnumber;
  return VW_DebugFontState();
}

export function VW_DrawColorPropString(str: string | ArrayLike<number>, options: FontOptions = {}): PropStringSummary {
  return drawPropString(str, options, true);
}

export function VW_DrawPropString(str: string | ArrayLike<number>, options: FontOptions = {}): PropStringSummary {
  return drawPropString(str, options, false);
}

export function VW_MarkUpdateBlock(x1: number, y1: number, x2: number, y2: number): MarkUpdateSummary {
  let xt1 = x1 >> PIXTOBLOCK;
  let yt1 = y1 >> PIXTOBLOCK;
  let xt2 = x2 >> PIXTOBLOCK;
  let yt2 = y2 >> PIXTOBLOCK;

  if (xt1 < 0) {
    xt1 = 0;
  } else if (xt1 >= UPDATEWIDE) {
    return { marked: false, xt1, yt1, xt2, yt2 };
  }

  if (yt1 < 0) {
    yt1 = 0;
  } else if (yt1 > UPDATEHIGH) {
    return { marked: false, xt1, yt1, xt2, yt2 };
  }

  if (xt2 < 0) {
    return { marked: false, xt1, yt1, xt2, yt2 };
  } else if (xt2 >= UPDATEWIDE) {
    xt2 = UPDATEWIDE - 1;
  }

  if (yt2 < 0) {
    return { marked: false, xt1, yt1, xt2, yt2 };
  } else if (yt2 >= UPDATEHIGH) {
    yt2 = UPDATEHIGH - 1;
  }

  for (let y = yt1; y <= yt2; y++) {
    for (let x = xt1; x <= xt2; x++) {
      update[y * UPDATEWIDE + x] = 1;
    }
  }

  return { marked: true, xt1, yt1, xt2, yt2 };
}

export function VW_MeasureMPropString(str: string | ArrayLike<number>, options: FontOptions = {}): MeasureStringSummary {
  return VWL_MeasureString(str, resolveFont(STARTFONTM, options));
}

export function VW_MeasurePropString(str: string | ArrayLike<number>, options: FontOptions = {}): MeasureStringSummary {
  return VWL_MeasureString(str, resolveFont(STARTFONT, options));
}

export function VW_UpdateScreen(): UpdateScreenSummary {
  let blocks = 0;
  let bytes = 0;
  let firstCopy: PlanarCopySummary | null = null;
  let lastBlock: number | null = null;

  for (let block = UPDATEWIDE * UPDATEHIGH - 1; block >= 0; block--) {
    if (!(update[block] & 1)) {
      continue;
    }

    update[block] = 0;
    const x = block % UPDATEWIDE;
    const y = Math.trunc(block / UPDATEWIDE);
    const blockStart = SCREENWIDTH * 16 * y + x * TILEWIDTH;
    const copy = VL_ScreenToScreen(bufferofs + blockStart, displayofs + blockStart, TILEWIDTH, 16);
    firstCopy ??= copy;
    lastBlock = block;
    blocks++;
    bytes += copy.bytes;
  }

  return { blocks, bytes, firstCopy, lastBlock };
}

export function VWB_Bar(
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
): BufferedDrawSummary<PlanarFillSummary> {
  const mark = VW_MarkUpdateBlock(x, y, x + width, y + height - 1);
  return { mark, draw: mark.marked ? VL_Bar(x, y, width, height, color) : null };
}

export function VWB_DrawPic(x: number, y: number, chunknum: number, options: DrawPicOptions = {}): BufferedPicDrawSummary {
  const picnum = chunknum - STARTPICS;
  const pictable = options.pictable ?? grsegs[STRUCTPIC];
  const width = options.width ?? (pictable ? readU16LE(pictable, picnum * 4) : 0);
  const height = options.height ?? (pictable ? readU16LE(pictable, picnum * 4 + 2) : 0);
  const source = options.source ?? grsegs[chunknum];
  if (!source) {
    throw new Error(`VWB_DrawPic: uncached graphic chunk ${chunknum}`);
  }
  if (!width || !height) {
    throw new Error(`VWB_DrawPic: missing dimensions for chunk ${chunknum}`);
  }

  const alignedX = x & ~7;
  const mark = VW_MarkUpdateBlock(alignedX, y, alignedX + width - 1, y + height - 1);
  return {
    mark,
    draw: mark.marked ? VL_MemToScreen(source, width, height, alignedX, y) : null,
    x: alignedX,
    y,
    width,
    height,
    sourceBytes: source.length,
  };
}

export function VWB_DrawPropString(str: string | ArrayLike<number>, options: FontOptions = {}): BufferedPropStringSummary {
  const x = px;
  const y = py;
  const draw = VW_DrawPropString(str, options);
  const mark = VW_MarkUpdateBlock(x, py, px - 1, py + bufferheight - 1);
  return { mark, draw, startX: x, startY: y, endX: px };
}

export function VWB_DrawTile8(x: number, y: number, tile: number, options: DrawPicOptions = {}): BufferedPicDrawSummary {
  return drawTile8FromChunk(STARTTILE8, x, y, tile, options);
}

export function VWB_DrawTile8M(x: number, y: number, tile: number, options: DrawPicOptions = {}): BufferedPicDrawSummary {
  return drawTile8FromChunk(STARTTILE8M, x, y, tile, options);
}

export function VWB_Hlin(x1: number, x2: number, y: number, color: number): BufferedDrawSummary<PlanarFillSummary> {
  const mark = VW_MarkUpdateBlock(x1, y, x2, y);
  return { mark, draw: mark.marked ? VL_Hlin(x1, y, x2 - x1 + 1, color) : null };
}

export function VWB_Plot(x: number, y: number, color: number): BufferedDrawSummary<PlanarWriteSummary> {
  const mark = VW_MarkUpdateBlock(x, y, x, y);
  return { mark, draw: mark.marked ? VL_Plot(x, y, color) : null };
}

export function VWB_Vlin(y1: number, y2: number, x: number, color: number): BufferedDrawSummary<PlanarFillSummary> {
  const mark = VW_MarkUpdateBlock(x, y1, x, y2);
  return { mark, draw: mark.marked ? VL_Vlin(x, y1, y2 - y1 + 1, color) : null };
}

export function VWL_MeasureString(str: string | ArrayLike<number>, font: Uint8Array): MeasureStringSummary {
  const height = fontHeight(font);
  let width = 0;
  const chars = cStringCodes(str);
  for (const ch of chars) {
    width += fontWidth(font, ch);
  }
  return { width, height, chars: chars.length };
}

function drawTile8FromChunk(chunk: number, x: number, y: number, tile: number, options: DrawPicOptions): BufferedPicDrawSummary {
  const sourceChunk = options.source ?? grsegs[chunk];
  if (!sourceChunk) {
    throw new Error(`VWB_DrawTile8: uncached tile chunk ${chunk}`);
  }
  const tileOffset = options.source ? 0 : Math.max(0, Math.trunc(tile)) * 64;
  const source = sourceChunk.subarray(tileOffset, tileOffset + 64);
  if (source.length < 64) {
    throw new Error(`VWB_DrawTile8: tile ${tile} is outside chunk ${chunk}`);
  }

  const mark = VW_MarkUpdateBlock(x, y, x + 7, y + 7);
  return {
    mark,
    draw: mark.marked ? VL_MemToScreen(source, 8, 8, x, y) : null,
    x,
    y,
    width: 8,
    height: 8,
    sourceBytes: source.length,
  };
}

function drawPropString(str: string | ArrayLike<number>, options: FontOptions, colorized: boolean): PropStringSummary {
  const font = resolveFont(STARTFONT, options);
  const startX = px;
  const startY = py;
  const chars = cStringCodes(str);
  const height = fontHeight(font);
  let drawnPixels = 0;
  let destByte = px >> 2;
  let mask = 1 << (px & 3);

  bufferheight = height;
  for (const ch of chars) {
    const width = fontWidth(font, ch);
    const source = fontLocation(font, ch);
    for (let column = 0; column < width; column++) {
      let color = fontcolor & 0xff;
      for (let row = 0; row < height; row++) {
        if (font[source + column + row * width]) {
          VL_Plot(px, py + row, color);
          drawnPixels++;
        }
        if (colorized && (((height - row) & 1) === 0)) {
          color = (color + 1) & 0xff;
        }
      }

      px++;
      mask <<= 1;
      if (mask === 16) {
        mask = 1;
        destByte++;
      }
    }
  }

  bufferwidth = ((destByte + 1) - (startX >> 2)) * 4;
  return {
    text: asciiString(chars),
    startX,
    startY,
    endX: px,
    width: bufferwidth,
    height,
    chars: chars.length,
    pixels: drawnPixels,
    colorized,
  };
}

function resolveFont(baseChunk: number, options: FontOptions): Uint8Array {
  if (options.font) {
    return options.font;
  }

  const chunk = baseChunk + (options.fontnumber ?? fontnumber);
  const font = grsegs[chunk];
  if (!font) {
    throw new Error(`ID_VH proportional font chunk ${chunk} is not cached`);
  }
  return font;
}

function fontHeight(font: Uint8Array): number {
  return readI16LE(font, 0);
}

function fontLocation(font: Uint8Array, ch: number): number {
  return readU16LE(font, FONT_LOCATION_OFFSET + (ch & 0xff) * 2);
}

function fontWidth(font: Uint8Array, ch: number): number {
  return font[FONT_WIDTH_OFFSET + (ch & 0xff)] ?? 0;
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

function asciiString(chars: readonly number[]): string {
  return String.fromCharCode(...chars);
}

export function VH_DebugPlaneByte(plane: number, offset: number): number {
  return videoPlanes[(plane & 3) * VIDEO_PLANE_BYTES + (offset & 0xffff)];
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // ID_VH.C
// 
// #include "ID_HEADS.H"
// 
// #define	SCREENWIDTH		80
// #define CHARWIDTH		2
// #define TILEWIDTH		4
// #define GRPLANES		4
// #define BYTEPIXELS		4
// 
// #define SCREENXMASK		(~3)
// #define SCREENXPLUS		(3)
// #define SCREENXDIV		(4)
// 
// #define VIEWWIDTH		80
// 
// #define PIXTOBLOCK		4		// 16 pixels to an update block
// 
// #define UNCACHEGRCHUNK(chunk)	{MM_FreePtr(&grsegs[chunk]);grneeded[chunk]&=~ca_levelbit;}
// 
// byte	update[UPDATEHIGH][UPDATEWIDE];
// 
// //==========================================================================
// 
// pictabletype	_seg *pictable;
// 
// 
// int	px,py;
// byte	fontcolor,backcolor;
// int	fontnumber;
// int bufferwidth,bufferheight;
// 
// 
// //==========================================================================
// 
// void	VWL_UpdateScreenBlocks (void);
// 
// //==========================================================================
// 
// void VW_DrawPropString (char far *string)
// {
// 	fontstruct	far	*font;
// 	int		width,step,height,i;
// 	byte	far *source, far *dest, far *origdest;
// 	byte	ch,mask;
// 
// 	font = (fontstruct far *)grsegs[STARTFONT+fontnumber];
// 	height = bufferheight = font->height;
// 	dest = origdest = MK_FP(SCREENSEG,bufferofs+ylookup[py]+(px>>2));
// 	mask = 1<<(px&3);
// 
// 
// 	while ((ch = *string++)!=0)
// 	{
// 		width = step = font->width[ch];
// 		source = ((byte far *)font)+font->location[ch];
// 		while (width--)
// 		{
// 			VGAMAPMASK(mask);
// 
// asm	mov	ah,[BYTE PTR fontcolor]
// asm	mov	bx,[step]
// asm	mov	cx,[height]
// asm	mov	dx,[linewidth]
// asm	lds	si,[source]
// asm	les	di,[dest]
// 
// vertloop:
// asm	mov	al,[si]
// asm	or	al,al
// asm	je	next
// asm	mov	[es:di],ah			// draw color
// 
// next:
// asm	add	si,bx
// asm	add	di,dx
// asm	loop	vertloop
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// 			source++;
// 			px++;
// 			mask <<= 1;
// 			if (mask == 16)
// 			{
// 				mask = 1;
// 				dest++;
// 			}
// 		}
// 	}
// bufferheight = height;
// bufferwidth = ((dest+1)-origdest)*4;
// }
// 
// 
// void VW_DrawColorPropString (char far *string)
// {
// 	fontstruct	far	*font;
// 	int		width,step,height,i;
// 	byte	far *source, far *dest, far *origdest;
// 	byte	ch,mask;
// 
// 	font = (fontstruct far *)grsegs[STARTFONT+fontnumber];
// 	height = bufferheight = font->height;
// 	dest = origdest = MK_FP(SCREENSEG,bufferofs+ylookup[py]+(px>>2));
// 	mask = 1<<(px&3);
// 
// 
// 	while ((ch = *string++)!=0)
// 	{
// 		width = step = font->width[ch];
// 		source = ((byte far *)font)+font->location[ch];
// 		while (width--)
// 		{
// 			VGAMAPMASK(mask);
// 
// asm	mov	ah,[BYTE PTR fontcolor]
// asm	mov	bx,[step]
// asm	mov	cx,[height]
// asm	mov	dx,[linewidth]
// asm	lds	si,[source]
// asm	les	di,[dest]
// 
// vertloop:
// asm	mov	al,[si]
// asm	or	al,al
// asm	je	next
// asm	mov	[es:di],ah			// draw color
// 
// next:
// asm	add	si,bx
// asm	add	di,dx
// 
// asm rcr cx,1				// inc font color
// asm jc  cont
// asm	inc ah
// 
// cont:
// asm rcl cx,1
// asm	loop	vertloop
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// 			source++;
// 			px++;
// 			mask <<= 1;
// 			if (mask == 16)
// 			{
// 				mask = 1;
// 				dest++;
// 			}
// 		}
// 	}
// bufferheight = height;
// bufferwidth = ((dest+1)-origdest)*4;
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// =================
// =
// = VL_MungePic
// =
// =================
// */
// 
// void VL_MungePic (byte far *source, unsigned width, unsigned height)
// {
// 	unsigned	x,y,plane,size,pwidth;
// 	byte		_seg *temp, far *dest, far *srcline;
// 
// 	size = width*height;
// 
// 	if (width&3)
// 		MS_Quit ("VL_MungePic: Not divisable by 4!");
// 
// //
// // copy the pic to a temp buffer
// //
// 	MM_GetPtr (&(memptr)temp,size);
// 	_fmemcpy (temp,source,size);
// 
// //
// // munge it back into the original buffer
// //
// 	dest = source;
// 	pwidth = width/4;
// 
// 	for (plane=0;plane<4;plane++)
// 	{
// 		srcline = temp;
// 		for (y=0;y<height;y++)
// 		{
// 			for (x=0;x<pwidth;x++)
// 				*dest++ = *(srcline+x*4+plane);
// 			srcline+=width;
// 		}
// 	}
// 
// 	MM_FreePtr (&(memptr)temp);
// }
// 
// void VWL_MeasureString (char far *string, word *width, word *height
// 	, fontstruct _seg *font)
// {
// 	*height = font->height;
// 	for (*width = 0;*string;string++)
// 		*width += font->width[*((byte far *)string)];	// proportional width
// }
// 
// void	VW_MeasurePropString (char far *string, word *width, word *height)
// {
// 	VWL_MeasureString(string,width,height,(fontstruct _seg *)grsegs[STARTFONT+fontnumber]);
// }
// 
// void	VW_MeasureMPropString  (char far *string, word *width, word *height)
// {
// 	VWL_MeasureString(string,width,height,(fontstruct _seg *)grsegs[STARTFONTM+fontnumber]);
// }
// 
// 
// 
// /*
// =============================================================================
// 
// 				Double buffer management routines
// 
// =============================================================================
// */
// 
// 
// /*
// =======================
// =
// = VW_MarkUpdateBlock
// =
// = Takes a pixel bounded block and marks the tiles in bufferblocks
// = Returns 0 if the entire block is off the buffer screen
// =
// =======================
// */
// 
// int VW_MarkUpdateBlock (int x1, int y1, int x2, int y2)
// {
// 	int	x,y,xt1,yt1,xt2,yt2,nextline;
// 	byte *mark;
// 
// 	xt1 = x1>>PIXTOBLOCK;
// 	yt1 = y1>>PIXTOBLOCK;
// 
// 	xt2 = x2>>PIXTOBLOCK;
// 	yt2 = y2>>PIXTOBLOCK;
// 
// 	if (xt1<0)
// 		xt1=0;
// 	else if (xt1>=UPDATEWIDE)
// 		return 0;
// 
// 	if (yt1<0)
// 		yt1=0;
// 	else if (yt1>UPDATEHIGH)
// 		return 0;
// 
// 	if (xt2<0)
// 		return 0;
// 	else if (xt2>=UPDATEWIDE)
// 		xt2 = UPDATEWIDE-1;
// 
// 	if (yt2<0)
// 		return 0;
// 	else if (yt2>=UPDATEHIGH)
// 		yt2 = UPDATEHIGH-1;
// 
// 	mark = updateptr + uwidthtable[yt1] + xt1;
// 	nextline = UPDATEWIDE - (xt2-xt1) - 1;
// 
// 	for (y=yt1;y<=yt2;y++)
// 	{
// 		for (x=xt1;x<=xt2;x++)
// 			*mark++ = 1;			// this tile will need to be updated
// 
// 		mark += nextline;
// 	}
// 
// 	return 1;
// }
// 
// void VWB_DrawTile8 (int x, int y, int tile)
// {
// 	if (VW_MarkUpdateBlock (x,y,x+7,y+7))
// 		LatchDrawChar(x,y,tile);
// }
// 
// void VWB_DrawTile8M (int x, int y, int tile)
// {
// 	if (VW_MarkUpdateBlock (x,y,x+7,y+7))
// 		VL_MemToScreen (((byte far *)grsegs[STARTTILE8M])+tile*64,8,8,x,y);
// }
// 
// 
// void VWB_DrawPic (int x, int y, int chunknum)
// {
// 	int	picnum = chunknum - STARTPICS;
// 	unsigned width,height;
// 
// 	x &= ~7;
// 
// 	width = pictable[picnum].width;
// 	height = pictable[picnum].height;
// 
// 	if (VW_MarkUpdateBlock (x,y,x+width-1,y+height-1))
// 		VL_MemToScreen (grsegs[chunknum],width,height,x,y);
// }
// 
// 
// 
// void VWB_DrawPropString	 (char far *string)
// {
// 	int x;
// 	x=px;
// 	VW_DrawPropString (string);
// 	VW_MarkUpdateBlock(x,py,px-1,py+bufferheight-1);
// }
// 
// 
// void VWB_Bar (int x, int y, int width, int height, int color)
// {
// 	if (VW_MarkUpdateBlock (x,y,x+width,y+height-1) )
// 		VW_Bar (x,y,width,height,color);
// }
// 
// void VWB_Plot (int x, int y, int color)
// {
// 	if (VW_MarkUpdateBlock (x,y,x,y))
// 		VW_Plot(x,y,color);
// }
// 
// void VWB_Hlin (int x1, int x2, int y, int color)
// {
// 	if (VW_MarkUpdateBlock (x1,y,x2,y))
// 		VW_Hlin(x1,x2,y,color);
// }
// 
// void VWB_Vlin (int y1, int y2, int x, int color)
// {
// 	if (VW_MarkUpdateBlock (x,y1,x,y2))
// 		VW_Vlin(y1,y2,x,color);
// }
// 
// void VW_UpdateScreen (void)
// {
// 	VH_UpdateScreen ();
// }
// 
// 
// /*
// =============================================================================
// 
// 						WOLFENSTEIN STUFF
// 
// =============================================================================
// */
// 
// /*
// =====================
// =
// = LatchDrawPic
// =
// =====================
// */
// 
// void LatchDrawPic (unsigned x, unsigned y, unsigned picnum)
// {
// 	unsigned wide, height, source;
// 
// 	wide = pictable[picnum-STARTPICS].width;
// 	height = pictable[picnum-STARTPICS].height;
// 	source = latchpics[2+picnum-LATCHPICS_LUMP_START];
// 
// 	VL_LatchToScreen (source,wide/4,height,x*8,y);
// }
// 
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = LoadLatchMem
// =
// ===================
// */
// 
// void LoadLatchMem (void)
// {
// 	int	i,j,p,m,width,height,start,end;
// 	byte	far *src;
// 	unsigned	destoff;
// 
// //
// // tile 8s
// //
// 	latchpics[0] = freelatch;
// 	CA_CacheGrChunk (STARTTILE8);
// 	src = (byte _seg *)grsegs[STARTTILE8];
// 	destoff = freelatch;
// 
// 	for (i=0;i<NUMTILE8;i++)
// 	{
// 		VL_MemToLatch (src,8,8,destoff);
// 		src += 64;
// 		destoff +=16;
// 	}
// 	UNCACHEGRCHUNK (STARTTILE8);
// 
// #if 0	// ran out of latch space!
// //
// // tile 16s
// //
// 	src = (byte _seg *)grsegs[STARTTILE16];
// 	latchpics[1] = destoff;
// 
// 	for (i=0;i<NUMTILE16;i++)
// 	{
// 		CA_CacheGrChunk (STARTTILE16+i);
// 		src = (byte _seg *)grsegs[STARTTILE16+i];
// 		VL_MemToLatch (src,16,16,destoff);
// 		destoff+=64;
// 		if (src)
// 			UNCACHEGRCHUNK (STARTTILE16+i);
// 	}
// #endif
// 
// //
// // pics
// //
// 	start = LATCHPICS_LUMP_START;
// 	end = LATCHPICS_LUMP_END;
// 
// 	for (i=start;i<=end;i++)
// 	{
// 		latchpics[2+i-start] = destoff;
// 		CA_CacheGrChunk (i);
// 		width = pictable[i-STARTPICS].width;
// 		height = pictable[i-STARTPICS].height;
// 		VL_MemToLatch (grsegs[i],width,height,destoff);
// 		destoff += width/4 *height;
// 		UNCACHEGRCHUNK(i);
// 	}
// 
// 	EGAMAPMASK(15);
// }
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = FizzleFade
// =
// = returns true if aborted
// =
// ===================
// */
// 
// extern	ControlInfo	c;
// 
// boolean FizzleFade (unsigned source, unsigned dest,
// 	unsigned width,unsigned height, unsigned frames, boolean abortable)
// {
// 	int			pixperframe;
// 	unsigned	drawofs,pagedelta;
// 	byte 		mask,maskb[8] = {1,2,4,8};
// 	unsigned	x,y,p,frame;
// 	long		rndval;
// 
// 	pagedelta = dest-source;
// 	rndval = 1;
// 	y = 0;
// 	pixperframe = 64000/frames;
// 
// 	IN_StartAck ();
// 
// 	TimeCount=frame=0;
// 	do	// while (1)
// 	{
// 		if (abortable && IN_CheckAck () )
// 			return true;
// 
// 		asm	mov	es,[screenseg]
// 
// 		for (p=0;p<pixperframe;p++)
// 		{
// 			//
// 			// seperate random value into x/y pair
// 			//
// 			asm	mov	ax,[WORD PTR rndval]
// 			asm	mov	dx,[WORD PTR rndval+2]
// 			asm	mov	bx,ax
// 			asm	dec	bl
// 			asm	mov	[BYTE PTR y],bl			// low 8 bits - 1 = y xoordinate
// 			asm	mov	bx,ax
// 			asm	mov	cx,dx
// 			asm	mov	[BYTE PTR x],ah			// next 9 bits = x xoordinate
// 			asm	mov	[BYTE PTR x+1],dl
// 			//
// 			// advance to next random element
// 			//
// 			asm	shr	dx,1
// 			asm	rcr	ax,1
// 			asm	jnc	noxor
// 			asm	xor	dx,0x0001
// 			asm	xor	ax,0x2000
// noxor:
// 			asm	mov	[WORD PTR rndval],ax
// 			asm	mov	[WORD PTR rndval+2],dx
// 
// 			if (x>width || y>height)
// 				continue;
// 			drawofs = source+ylookup[y] + (x>>2);
// 
// 			//
// 			// copy one pixel
// 			//
// 			mask = x&3;
// 			VGAREADMAP(mask);
// 			mask = maskb[mask];
// 			VGAMAPMASK(mask);
// 
// 			asm	mov	di,[drawofs]
// 			asm	mov	al,[es:di]
// 			asm add	di,[pagedelta]
// 			asm	mov	[es:di],al
// 
// 			if (rndval == 1)		// entire sequence has been completed
// 				return false;
// 		}
// 		frame++;
// 		while (TimeCount<frame)		// don't go too fast
// 		;
// 	} while (1);
// 
// 
// }
// 
