// ID_VL.H

// wolf compatability

// #define MS_Quit	Quit
declare const Quit: unknown;
export const MS_Quit = Quit;

// void Quit (char *error);

//===========================================================================


export const SC_INDEX = 0x3C4;
export const SC_RESET = 0;
export const SC_CLOCK = 1;
export const SC_MAPMASK = 2;
export const SC_CHARMAP = 3;
export const SC_MEMMODE = 4;

export const CRTC_INDEX = 0x3D4;
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


export const GC_INDEX = 0x3CE;
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

export const SCREENWIDTH = 80;			// default screen width in bytes
export const MAXSCANLINES = 200;			// size of ylookup table

export const CHARWIDTH = 2;
export const TILEWIDTH = 4;

//===========================================================================

// extern	unsigned	bufferofs;			// all drawing is reletive to this
// extern	unsigned	displayofs,pelpan;	// last setscreen coordinates

// extern	unsigned	screenseg;			// set to 0xa000 for asm convenience

// extern	unsigned	linewidth;
// extern	unsigned	ylookup[MAXSCANLINES];

// extern	boolean		screenfaded;
// extern	unsigned	bordercolor;

//===========================================================================

//
// VGA hardware routines
//

// #define VGAWRITEMODE(x) asm{\
// cli;\
// mov dx,GC_INDEX;\
// mov al,GC_MODE;\
// out dx,al;\
// inc dx;\
// in al,dx;\
// and al,252;\
// or al,x;\
// out dx,al;\
// sti;}
export function VGAWRITEMODE(x: number): never {
	void x;
	throw new Error("VGAWRITEMODE inline assembly macro is not available in TypeScript");
}

// #define VGAMAPMASK(x) asm{cli;mov dx,SC_INDEX;mov al,SC_MAPMASK;mov ah,x;out dx,ax;sti;}
export function VGAMAPMASK(x: number): never {
	void x;
	throw new Error("VGAMAPMASK inline assembly macro is not available in TypeScript");
}

// #define VGAREADMAP(x) asm{cli;mov dx,GC_INDEX;mov al,GC_READMAP;mov ah,x;out dx,ax;sti;}
export function VGAREADMAP(x: number): never {
	void x;
	throw new Error("VGAREADMAP inline assembly macro is not available in TypeScript");
}


// void VL_Startup (void);
// void VL_Shutdown (void);

// void VL_SetVGAPlane (void);
// void VL_SetTextMode (void);
// void VL_DePlaneVGA (void);
// void VL_SetVGAPlaneMode (void);
// void VL_ClearVideo (byte color);

// void VL_SetLineWidth (unsigned width);
// void VL_SetSplitScreen (int linenum);

// void VL_WaitVBL (int vbls);
// void VL_CrtcStart (int crtc);
// void VL_SetScreen (int crtc, int pelpan);

// void VL_FillPalette (int red, int green, int blue);
// void VL_SetColor	(int color, int red, int green, int blue);
// void VL_GetColor	(int color, int *red, int *green, int *blue);
// void VL_SetPalette (byte far *palette);
// void VL_GetPalette (byte far *palette);
// void VL_FadeOut (int start, int end, int red, int green, int blue, int steps);
// void VL_FadeIn (int start, int end, byte far *palette, int steps);
// void VL_ColorBorder (int color);

// void VL_Plot (int x, int y, int color);
// void VL_Hlin (unsigned x, unsigned y, unsigned width, unsigned color);
// void VL_Vlin (int x, int y, int height, int color);
// void VL_Bar (int x, int y, int width, int height, int color);

// void VL_MungePic (byte far *source, unsigned width, unsigned height);
// void VL_DrawPicBare (int x, int y, byte far *pic, int width, int height);
// void VL_MemToLatch (byte far *source, int width, int height, unsigned dest);
// void VL_ScreenToScreen (unsigned source, unsigned dest,int width, int height);
// void VL_MemToScreen (byte far *source, int width, int height, int x, int y);
// void VL_MaskedToScreen (byte far *source, int width, int height, int x, int y);

// void VL_DrawTile8String (char *str, char far *tile8ptr, int printx, int printy);
// void VL_DrawLatch8String (char *str, unsigned tile8ptr, int printx, int printy);
// void VL_SizeTile8String (char *str, int *width, int *height);
// void VL_DrawPropString (char *str, unsigned tile8ptr, int printx, int printy);
// void VL_SizePropString (char *str, int *width, int *height, char far *font);

// void VL_TestPaletteSet (void);

