import { PM_GetPage } from "./ID_PM.C";
import { bufferofs as vlBufferofs } from "./ID_VL.C";
import { i32 } from "./TS_C";
import { scale as wlScale } from "./WL_MAIN.C";
import { viewheight as wlViewheight, viewwidth as wlViewwidth } from "./WL_DRAW.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WOLFHACK.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WOLFHACK.C";
export const WOLFSRC_FUNCTIONS = [
  "DrawPlanes",
  "DrawSpans",
  "FixedMul",
  "SetPlaneViewSize"
] as const;

const GLOBAL1 = 1 << 16;
const MAXVIEWHEIGHT = 200;
const SCREENBWIDE = 80;

export const spanstart = new Int16Array(MAXVIEWHEIGHT / 2);
export const stepscale = new Int32Array(MAXVIEWHEIGHT / 2);
export const basedist = new Int32Array(MAXVIEWHEIGHT / 2);
export const planepics = new Uint8Array(8192);
export let halfheight = 0;
export const planeylookup = new Uint32Array(MAXVIEWHEIGHT / 2);
export const mirrorofs = new Uint16Array(MAXVIEWHEIGHT / 2);
export let psin = 0;
export let pcos = 0;
export let mr_rowofs = 0;
export let mr_count = 0;
export let mr_xstep = 0;
export let mr_ystep = 0;
export let mr_xfrac = 0;
export let mr_yfrac = 0;
export let mr_dest = 0;

export interface PlaneViewSizeOptions {
  readonly viewheight?: number;
  readonly scale?: number;
  readonly ceilingPage?: Uint8Array;
  readonly floorPage?: Uint8Array;
}

export interface PlaneViewSizeSummary {
  readonly halfheight: number;
  readonly row0: number;
  readonly rowLast: number;
  readonly mirror0: number;
  readonly stepLast: number;
  readonly base1: number;
  readonly planepic0: number;
  readonly planepic1: number;
  readonly planepicLastCeiling: number;
  readonly planepicLastFloor: number;
  readonly bytes: number;
}

export interface DrawSpansOptions {
  readonly viewx?: number;
  readonly viewy?: number;
  readonly viewwidth?: number;
  readonly bufferofs?: number;
}

export interface MapRowSummary {
  readonly plane: number;
  readonly rowofs: number;
  readonly xstep: number;
  readonly ystep: number;
  readonly xfrac: number;
  readonly yfrac: number;
  readonly dest: number;
  readonly count: number;
}

export interface DrawSpansSummary {
  readonly x1: number;
  readonly x2: number;
  readonly height: number;
  readonly skipped: boolean;
  readonly rows: readonly MapRowSummary[];
}

export interface DrawPlanesOptions extends DrawSpansOptions {
  readonly viewheight?: number;
  readonly viewsin?: number;
  readonly viewcos?: number;
  readonly wallheight?: ArrayLike<number>;
  readonly scale?: number;
}

export interface DrawPlanesSummary {
  readonly viewwidth: number;
  readonly viewheight: number;
  readonly halfheight: number;
  readonly psin: number;
  readonly pcos: number;
  readonly starts: number;
  readonly spanCalls: number;
  readonly mapRows: number;
  readonly spans: readonly DrawSpansSummary[];
}

export function DrawSpans(x1: number, x2: number, height: number, options: DrawSpansOptions = {}): DrawSpansSummary {
  const spanHeight = Math.trunc(height);
  if (spanHeight <= 0 || spanHeight >= halfheight || x2 < x1) {
    return { x1: Math.trunc(x1), x2: Math.trunc(x2), height: spanHeight, skipped: true, rows: [] };
  }

  const activeViewwidth = Math.trunc(options.viewwidth ?? (wlViewwidth || 320));
  const activeBufferofs = Math.trunc(options.bufferofs ?? vlBufferofs);
  const viewx = i32(options.viewx ?? 0);
  const viewy = i32(options.viewy ?? 0);
  const toprow = (planeylookup[spanHeight] ?? 0) + activeBufferofs;
  mr_rowofs = mirrorofs[spanHeight] ?? 0;
  mr_xstep = i32(Math.trunc((psin * 2) / spanHeight));
  mr_ystep = i32(Math.trunc((pcos * 2) / spanHeight));

  const length = basedist[spanHeight] ?? 0;
  const startxfrac = i32(viewx + FixedMul(length, pcos));
  const startyfrac = i32(viewy - FixedMul(length, psin));
  let plane = Math.trunc(x1) & 3;
  const startplane = plane;
  let cursorX = Math.trunc(x1);
  let prestep = Math.trunc(activeViewwidth / 2) - cursorX;
  const rows: MapRowSummary[] = [];

  do {
    mr_xfrac = i32(startxfrac - (mr_xstep >> 2) * prestep);
    mr_yfrac = i32(startyfrac - (mr_ystep >> 2) * prestep);

    const startx = cursorX >> 2;
    mr_dest = toprow + startx;
    mr_count = ((Math.trunc(x2) - plane) >> 2) - startx + 1;
    if (mr_count > 0) {
      rows.push({
        plane,
        rowofs: mr_rowofs,
        xstep: mr_xstep,
        ystep: mr_ystep,
        xfrac: mr_xfrac,
        yfrac: mr_yfrac,
        dest: mr_dest,
        count: mr_count,
      });
    }
    cursorX++;
    prestep--;
    plane = (plane + 1) & 3;
  } while (plane !== startplane);

  return { x1: Math.trunc(x1), x2: Math.trunc(x2), height: spanHeight, skipped: false, rows };
}

export function FixedMul(a: number, b: number): number {
  return i32(Math.imul(i32(a) >> 8, i32(b) >> 8));
}

export function SetPlaneViewSize(options: PlaneViewSizeOptions = {}): PlaneViewSizeSummary {
  const activeViewheight = options.viewheight ?? wlViewheight;
  const activeScale = options.scale ?? wlScale;
  const ceilingPage = options.ceilingPage ?? PM_GetPage(0);
  const floorPage = options.floorPage ?? PM_GetPage(1);

  if (ceilingPage.length < 4096 || floorPage.length < 4096) {
    throw new Error("SetPlaneViewSize: plane pages must be at least 4096 bytes");
  }

  halfheight = i32(activeViewheight) >> 1;
  if (halfheight < 0 || halfheight > MAXVIEWHEIGHT / 2) {
    throw new Error(`SetPlaneViewSize: invalid halfheight ${halfheight}`);
  }

  for (let y = 0; y < halfheight; y++) {
    planeylookup[y] = (halfheight - 1 - y) * SCREENBWIDE;
    mirrorofs[y] = (y * 2 + 1) * SCREENBWIDE;
    stepscale[y] = i32(Math.trunc((y * GLOBAL1) / 32));
    if (y > 0) {
      basedist[y] = i32(Math.trunc(((GLOBAL1 / 2) * activeScale) / y));
    }
  }

  for (let x = 0; x < 4096; x++) {
    planepics[x * 2] = ceilingPage[x];
    planepics[x * 2 + 1] = floorPage[x];
  }

  return {
    halfheight,
    row0: halfheight > 0 ? planeylookup[0] : 0,
    rowLast: halfheight > 0 ? planeylookup[halfheight - 1] : 0,
    mirror0: halfheight > 0 ? mirrorofs[0] : 0,
    stepLast: halfheight > 0 ? stepscale[halfheight - 1] : 0,
    base1: halfheight > 1 ? basedist[1] : 0,
    planepic0: planepics[0],
    planepic1: planepics[1],
    planepicLastCeiling: planepics[8190],
    planepicLastFloor: planepics[8191],
    bytes: planepics.length,
  };
}

export function DrawPlanes(options: DrawPlanesOptions = {}): DrawPlanesSummary {
  const activeViewheight = Math.trunc(options.viewheight ?? (wlViewheight || 152));
  const activeViewwidth = Math.trunc(options.viewwidth ?? (wlViewwidth || 320));
  if ((activeViewheight >> 1) !== halfheight) {
    SetPlaneViewSize({ viewheight: activeViewheight, scale: options.scale });
  }

  psin = i32(options.viewsin ?? 0);
  if (psin < 0) {
    psin = -(psin & 0xffff);
  }
  pcos = i32(options.viewcos ?? GLOBAL1);
  if (pcos < 0) {
    pcos = -(pcos & 0xffff);
  }

  let lastheight = halfheight;
  let starts = 0;
  const spans: DrawSpansSummary[] = [];
  let x = 0;

  for (; x < activeViewwidth; x++) {
    let height = (options.wallheight?.[x] ?? 0) >> 3;
    if (height < lastheight) {
      do {
        spanstart[--lastheight] = x;
        starts++;
      } while (lastheight > height);
    } else if (height > lastheight) {
      if (height > halfheight) {
        height = halfheight;
      }
      for (; lastheight < height; lastheight++) {
        spans.push(DrawSpans(spanstart[lastheight], x - 1, lastheight, options));
      }
    }
  }

  for (const height = halfheight; lastheight < height; lastheight++) {
    spans.push(DrawSpans(spanstart[lastheight], x - 1, lastheight, options));
  }

  return {
    viewwidth: activeViewwidth,
    viewheight: activeViewheight,
    halfheight,
    psin,
    pcos,
    starts,
    spanCalls: spans.length,
    mapRows: spans.reduce((total, span) => total + span.rows.length, 0),
    spans,
  };
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WOLFHACK.C
// 
// #include "WL_DEF.H"
// 
// #define	MAXVIEWHEIGHT	200
// 
// int		spanstart[MAXVIEWHEIGHT/2];
// 
// fixed	stepscale[MAXVIEWHEIGHT/2];
// fixed	basedist[MAXVIEWHEIGHT/2];
// 
// extern	char	far	planepics[8192];	// 4k of ceiling, 4k of floor
// 
// int		halfheight = 0;
// 
// byte	far *planeylookup[MAXVIEWHEIGHT/2];
// unsigned	mirrorofs[MAXVIEWHEIGHT/2];
// 
// fixed	psin, pcos;
// 
// fixed FixedMul (fixed a, fixed b)
// {
// 	return (a>>8)*(b>>8);
// }
// 
// 
// int		mr_rowofs;
// int		mr_count;
// int		mr_xstep;
// int		mr_ystep;
// int		mr_xfrac;
// int		mr_yfrac;
// int		mr_dest;
// 
// 
// /*
// ==============
// =
// = DrawSpans
// =
// = Height ranges from 0 (infinity) to viewheight/2 (nearest)
// ==============
// */
// 
// void DrawSpans (int x1, int x2, int height)
// {
// 	fixed		length;
// 	int			ofs;
// 	int			prestep;
// 	fixed		startxfrac, startyfrac;
// 
// 	int			x, startx, count, plane, startplane;
// 	byte		far	*toprow, far *dest;
// 
// 	toprow = planeylookup[height]+bufferofs;
// 	mr_rowofs = mirrorofs[height];
// 
// 	mr_xstep = (psin<<1)/height;
// 	mr_ystep = (pcos<<1)/height;
// 
// 	length = basedist[height];
// 	startxfrac = (viewx + FixedMul(length,pcos));
// 	startyfrac = (viewy - FixedMul(length,psin));
// 
// // draw two spans simultaniously
// 
// 	plane = startplane = x1&3;
// 	prestep = viewwidth/2 - x1;
// 	do
// 	{
// 		outportb (SC_INDEX+1,1<<plane);
// 		mr_xfrac = startxfrac - (mr_xstep>>2)*prestep;
// 		mr_yfrac = startyfrac - (mr_ystep>>2)*prestep;
// 
// 		startx = x1>>2;
// 		mr_dest = (unsigned)toprow + startx;
// 		mr_count = ((x2-plane)>>2) - startx + 1;
// 		x1++;
// 		prestep--;
// 		if (mr_count)
// 			MapRow ();
// 		plane = (plane+1)&3;
// 	} while (plane != startplane);
// 
// }
// 
// 
// 
// 
// /*
// ===================
// =
// = SetPlaneViewSize
// =
// ===================
// */
// 
// void SetPlaneViewSize (void)
// {
// 	int		x,y;
// 	byte 	far *dest, far *src;
// 
// 	halfheight = viewheight>>1;
// 
// 
// 	for (y=0 ; y<halfheight ; y++)
// 	{
// 		planeylookup[y] = (byte far *)0xa0000000l + (halfheight-1-y)*SCREENBWIDE;;
// 		mirrorofs[y] = (y*2+1)*SCREENBWIDE;
// 
// 		stepscale[y] = y*GLOBAL1/32;
// 		if (y>0)
// 			basedist[y] = GLOBAL1/2*scale/y;
// 	}
// 
// 	src = PM_GetPage(0);
// 	dest = planepics;
// 	for (x=0 ; x<4096 ; x++)
// 	{
// 		*dest = *src++;
// 		dest += 2;
// 	}
// 	src = PM_GetPage(1);
// 	dest = planepics+1;
// 	for (x=0 ; x<4096 ; x++)
// 	{
// 		*dest = *src++;
// 		dest += 2;
// 	}
// 
// }
// 
// 
// /*
// ===================
// =
// = DrawPlanes
// =
// ===================
// */
// 
// void DrawPlanes (void)
// {
// 	int		height, lastheight;
// 	int		x;
// 
// 	if (viewheight>>1 != halfheight)
// 		SetPlaneViewSize ();		// screen size has changed
// 
// 
// 	psin = viewsin;
// 	if (psin < 0)
// 		psin = -(psin&0xffff);
// 	pcos = viewcos;
// 	if (pcos < 0)
// 		pcos = -(pcos&0xffff);
// 
// //
// // loop over all columns
// //
// 	lastheight = halfheight;
// 
// 	for (x=0 ; x<viewwidth ; x++)
// 	{
// 		height = wallheight[x]>>3;
// 		if (height < lastheight)
// 		{	// more starts
// 			do
// 			{
// 				spanstart[--lastheight] = x;
// 			} while (lastheight > height);
// 		}
// 		else if (height > lastheight)
// 		{	// draw spans
// 			if (height > halfheight)
// 				height = halfheight;
// 			for ( ; lastheight < height ; lastheight++)
// 				DrawSpans (spanstart[lastheight], x-1, lastheight);
// 		}
// 	}
// 
// 	height = halfheight;
// 	for ( ; lastheight < height ; lastheight++)
// 		DrawSpans (spanstart[lastheight], x-1, lastheight);
// }
// 
// 
