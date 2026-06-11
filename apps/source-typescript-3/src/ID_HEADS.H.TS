// ID_GLOB.H


// #include <ALLOC.H>
// #include <CTYPE.H>
// #include <DOS.H>
// #include <ERRNO.H>
// #include <FCNTL.H>
// #include <IO.H>
// #include <MEM.H>
// #include <PROCESS.H>
// #include <STDIO.H>
// #include <STDLIB.H>
// #include <STRING.H>
// #include <SYS\STAT.H>
// #include <VALUES.H>
// #include <DIR.H>
// #define __ID_GLOB__
export const __ID_GLOB__ = true;
// #include "VERSION.H"
export * from './VERSION.H.ts';
import './GFXV_WL6.H.ts';
import './AUDIOWL6.H.ts';
import './MAPSWL6.H.ts';
import './ID_MM.H.ts';
import './ID_PM.H.ts';
import './ID_CA.H.ts';
import './ID_VL.H.ts';
import './ID_VH.H.ts';
import './ID_IN.H.ts';
import './ID_SD.H.ts';
import './ID_US.H.ts';

//--------------------------------------------------------------------------

// extern	char		far signon;

// #define	introscn	signon
export const introscn = 'signon';

// #ifdef JAPAN
// #ifdef JAPDEMO
// #include "FOREIGN\JAPAN\GFXV_WJ1.H"
// #else
// #include "FOREIGN\JAPAN\GFXV_WJ6.H"
// #endif
// #include "AUDIOWL6.H"
// #include "MAPSWL6.H"
// #else

// #ifndef SPEAR

// #include "GFXV_WL6.H"
// #include "AUDIOWL6.H"
// #include "MAPSWL6.H"

// #else

// #ifndef SPEARDEMO
// #include "GFXV_SOD.H"
// #include "AUDIOSOD.H"
// #include "MAPSSOD.H"
// #else
// #include "GFXV_SDM.H"
// #include "AUDIOSDM.H"
// #include "MAPSSDM.H"
// #endif

// #endif
// #endif
//-----------------


// #define GREXT	"VGA"
export const GREXT = "VGA";

//
//	ID Engine
//	Types.h - Generic types, #defines, etc.
//	v1.0d1
//

// typedef	enum	{false,true}	boolean;
// C int/unsigned are 16-bit; long/fixed are 32-bit. Pointers are conceptual typed-array indices.
export type CBoolean = boolean;
// typedef	unsigned	char		byte;
export type byte = number;
// typedef	unsigned	int			word;
export type word = number;
// typedef	unsigned	long		longword;
export type longword = number;
// typedef	byte *					Ptr;
export type Ptr = number;

// typedef	struct
// 		{
// 			int	x,y;
// 		} Point;
export interface Point {
	x: number;
	y: number;
}
// typedef	struct
// 		{
// 			Point	ul,lr;
// 		} Rect;
export interface Rect {
	ul: Point;
	lr: Point;
}

// #define	nil	((void *)0)
export const nil = null;


// #include "ID_MM.H"
// #include "ID_PM.H"
// #include "ID_CA.H"
// #include "ID_VL.H"
// #include "ID_VH.H"
// #include "ID_IN.H"
// #include "ID_SD.H"
// #include "ID_US.H"


// void	Quit (char *error);		// defined in user program

//
// replacing refresh manager with custom routines
//

// #define	PORTTILESWIDE		20      // all drawing takes place inside a
export const PORTTILESWIDE = 20;      // all drawing takes place inside a
// #define	PORTTILESHIGH		13		// non displayed port of this size
export const PORTTILESHIGH = 13;		// non displayed port of this size

// #define UPDATEWIDE			PORTTILESWIDE
export const UPDATEWIDE = PORTTILESWIDE;
// #define UPDATEHIGH			PORTTILESHIGH
export const UPDATEHIGH = PORTTILESHIGH;

// #define	MAXTICS				10
export const MAXTICS = 10;
// #define DEMOTICS			4
export const DEMOTICS = 4;

// #define	UPDATETERMINATE	0x0301
export const UPDATETERMINATE = 0x0301;

// extern	unsigned	mapwidth,mapheight,tics;
// extern	boolean		compatability;

// extern	byte		*updateptr;
// extern	unsigned	uwidthtable[UPDATEHIGH];
// extern	unsigned	blockstarts[UPDATEWIDE*UPDATEHIGH];

// extern	byte		fontcolor,backcolor;

// #define SETFONTCOLOR(f,b) fontcolor=f;backcolor=b;
export function SETFONTCOLOR(f: byte, b: byte): { fontcolor: byte; backcolor: byte } {
	return { fontcolor: f, backcolor: b };
}
