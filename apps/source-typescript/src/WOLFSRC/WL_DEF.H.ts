// WL_DEF.H
//
// PARTIAL PORT: constants and types needed by the modules ported so far.
// The full header (game enums, objstruct/statetype layouts, etc.) lands
// with the gameplay milestone — each block is brought over verbatim as the
// code that needs it is ported.

/*
=============================================================================

							MACROS

=============================================================================
*/

export const MAXWALLTILES = 64; // max number of wall tiles

/*
=============================================================================

						 GLOBAL CONSTANTS

=============================================================================
*/

export const PI = 3.141592657;

export const GLOBAL1 = 1 << 16;
export const TILEGLOBAL = GLOBAL1;
export const PIXGLOBAL = GLOBAL1 / 64;
export const TILESHIFT = 16;
export const UNSIGNEDSHIFT = 8;

export const ANGLES = 360; // must be divisable by 4
export const ANGLEQUAD = ANGLES / 4;
export const FINEANGLES = 3600;

export const MINDIST = 0x5800;

export const MAXVIEWWIDTH = 320;

export const PIXRADIUS = 512;

/*
=============================================================================

						   GLOBAL TYPES

=============================================================================
*/

// typedef long fixed;
export type fixed = number;
