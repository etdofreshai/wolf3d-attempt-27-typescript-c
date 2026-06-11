// ID_HEAD.H

export * from './VERSION.H.ts';

// #define	EXTENSION	"WLF"
export const EXTENSION = "WLF";
// #define WOLF
export const WOLF = true;

// #define	TEXTGR	0
export const TEXTGR = 0;
// #define	CGAGR	1
export const CGAGR = 1;
// #define	EGAGR	2
export const EGAGR = 2;
// #define	VGAGR	3
export const VGAGR = 3;

// #define GRMODE	VGAGR
export const GRMODE = VGAGR;

// #include "VERSION.H"

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


// void	Quit (char *error);		// defined in user program
