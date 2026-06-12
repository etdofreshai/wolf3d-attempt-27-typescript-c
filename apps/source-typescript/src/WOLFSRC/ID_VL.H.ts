// ID_VL.H
//
// PARTIAL PORT: only what ID_CA needs so far (SCREENSEG and the sequencer
// constants referenced by the screen-hack decompressor). The full VGA
// low-level header lands with the ID_VL.C port.

export const SCREENSEG = 0xa000;

export const SCREENWIDTH = 80; // default screen width in bytes
export const MAXSCANLINES = 200; // size of ylookup table

export const SC_INDEX = 0x3c4;
export const SC_MAPMASK = 2;
