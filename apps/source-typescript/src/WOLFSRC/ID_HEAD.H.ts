// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_HEAD.H
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_HEAD.H";
export const WOLFSRC_FUNCTIONS = [] as const;

// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // ID_HEAD.H
// 
// 
// #define	EXTENSION	"WLF"
// #define WOLF
// 
// #define	TEXTGR	0
// #define	CGAGR	1
// #define	EGAGR	2
// #define	VGAGR	3
// 
// #define GRMODE	VGAGR
// 
// #include "VERSION.H"
// 
// typedef	enum	{false,true}	boolean;
// typedef	unsigned	char		byte;
// typedef	unsigned	int			word;
// typedef	unsigned	long		longword;
// typedef	byte *					Ptr;
// 
// typedef	struct
// 		{
// 			int	x,y;
// 		} Point;
// 
// typedef	struct
// 		{
// 			Point	ul,lr;
// 		} Rect;
// 
// 
// void	Quit (char *error);		// defined in user program
// 
// 
