// ID_VH.H

type byte = number;
type word = number;

const cglobal = globalThis as any;


export const WHITE = 15;			// graphics mode independant colors
export const BLACK = 0;
export const FIRSTCOLOR = 1;
export const SECONDCOLOR = 12;
export const F_WHITE = 15;
export const F_BLACK = 0;
export const F_FIRSTCOLOR = 1;
export const F_SECONDCOLOR = 12;

//===========================================================================

export const MAXSHIFTS = 1;

export interface spritetabletype
{
  width: number;
	height: number;
	orgx: number;
	orgy: number;
	xl: number;
	yl: number;
	xh: number;
	yh: number;
	shifts: number;
}

export interface spritetype
{
	sourceoffset: number[];
	planesize: number[];
	width: number[];
	data: byte[];
}		// the memptr for each sprite points to this

export interface pictabletype
{
	width: number;
	height: number;
}


export interface fontstruct
{
	height: number;
	location: number[];
	width: number[];
}


//===========================================================================


// extern	pictabletype	_seg *pictable;
// extern	pictabletype	_seg *picmtable;
// extern	spritetabletype _seg *spritetable;

// extern	byte	fontcolor;
// extern	int	fontnumber;
// extern	int	px,py;

//
// Double buffer management routines
//

// void VW_InitDoubleBuffer (void);
// int	 VW_MarkUpdateBlock (int x1, int y1, int x2, int y2);
// void VW_UpdateScreen (void);

//
// mode independant routines
// coordinates in pixels, rounded to best screen res
// regions marked in double buffer
//

// void VWB_DrawTile8 (int x, int y, int tile);
// void VWB_DrawTile8M (int x, int y, int tile);
// void VWB_DrawTile16 (int x, int y, int tile);
// void VWB_DrawTile16M (int x, int y, int tile);
// void VWB_DrawPic (int x, int y, int chunknum);
// void VWB_DrawMPic(int x, int y, int chunknum);
// void VWB_Bar (int x, int y, int width, int height, int color);

// void VWB_DrawPropString	 (char far *string);
// void VWB_DrawMPropString (char far *string);
// void VWB_DrawSprite (int x, int y, int chunknum);
// void VWB_Plot (int x, int y, int color);
// void VWB_Hlin (int x1, int x2, int y, int color);
// void VWB_Vlin (int y1, int y2, int x, int color);


//
// wolfenstein EGA compatability stuff
//
// extern byte far gamepal;

// void VH_SetDefaultColors (void);

export const VW_Startup = cglobal.VL_Startup;
export const VW_Shutdown = cglobal.VL_Shutdown;
export const VW_SetCRTC = cglobal.VL_SetCRTC;
export const VW_SetScreen = cglobal.VL_SetScreen;
export const VW_Bar = cglobal.VL_Bar;
export const VW_Plot = cglobal.VL_Plot;
export function VW_Hlin(x: number, z: number, y: number, c: number): unknown { return cglobal.VL_Hlin(x, y, (z) - (x) + 1, c); }
export function VW_Vlin(y: number, z: number, x: number, c: number): unknown { return cglobal.VL_Vlin(x, y, (z) - (y) + 1, c); }
export const VW_DrawPic = cglobal.VH_DrawPic;
export const VW_SetSplitScreen = cglobal.VL_SetSplitScreen;
export const VW_SetLineWidth = cglobal.VL_SetLineWidth;
export const VW_ColorBorder = cglobal.VL_ColorBorder;
export const VW_WaitVBL = cglobal.VL_WaitVBL;
export function VW_FadeIn(): unknown { return cglobal.VL_FadeIn(0, 255, cglobal.gamepal, 30); }
export function VW_FadeOut(): unknown { return cglobal.VL_FadeOut(0, 255, 0, 0, 0, 30); }
export const VW_ScreenToScreen = cglobal.VL_ScreenToScreen;
export const VW_SetDefaultColors = cglobal.VH_SetDefaultColors;
// void	VW_MeasurePropString (char far *string, word *width, word *height);
export function EGAMAPMASK(x: number): unknown { return cglobal.VGAMAPMASK(x); }
export function EGAWRITEMODE(x: number): unknown { return cglobal.VGAWRITEMODE(x); }

//#define VW_MemToScreen	VL_MemToLatch

export const MS_Quit = cglobal.Quit;


export function LatchDrawChar(x: number, y: number, p: number): unknown { return cglobal.VL_LatchToScreen(cglobal.latchpics[0] + (p) * 16, 2, 8, x, y); }
export function LatchDrawTile(x: number, y: number, p: number): unknown { return cglobal.VL_LatchToScreen(cglobal.latchpics[1] + (p) * 64, 4, 16, x, y); }

// void LatchDrawPic (unsigned x, unsigned y, unsigned picnum);
// void 	LoadLatchMem (void);
// boolean 	FizzleFade (unsigned source, unsigned dest,
// 	unsigned width,unsigned height, unsigned frames,boolean abortable);


export const NUMLATCHPICS = 100;
// extern	unsigned	latchpics[NUMLATCHPICS];
// extern	unsigned freelatch;
