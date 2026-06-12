// WL_DRAW.C
//
// PARTIAL PORT: the math tables and refresh globals (filled by WL_MAIN's
// BuildTables/CalcProjection). The renderer itself (AsmRefresh, wall
// drawing, sprites) lands with the renderer milestone.

import {
  MAXVIEWWIDTH,
  FINEANGLES,
  ANGLES,
  TILEGLOBAL,
  MINDIST,
} from "./WL_DEF.H";

/*
=============================================================================

						 GLOBAL VARIABLES

=============================================================================
*/

// long lasttimecount;  long frameon;
export const wd = {
  lasttimecount: 0,
  frameon: 0,

  // fixed tileglobal = TILEGLOBAL;
  tileglobal: TILEGLOBAL,
  // fixed mindist = MINDIST;
  mindist: MINDIST,

  //
  // refresh variables
  //
  // fixed viewx,viewy;     // the focal point
  viewx: 0,
  viewy: 0,
  // int viewangle;
  viewangle: 0,
  // fixed viewsin,viewcos;
  viewsin: 0,
  viewcos: 0,
};

// unsigned wallheight[MAXVIEWWIDTH];
export const wallheight = new Uint16Array(MAXVIEWWIDTH);

//
// math tables
//

// int pixelangle[MAXVIEWWIDTH];
export const pixelangle = new Int16Array(MAXVIEWWIDTH);

// long far finetangent[FINEANGLES/4];
export const finetangent = new Int32Array(FINEANGLES / 4);

// fixed far sintable[ANGLES+ANGLES/4], far *costable = sintable+(ANGLES/4);
//
// ORIGINAL BUG, PRESERVED: sintable is declared with ANGLES+ANGLES/4 = 450
// elements, but BuildTables writes sintable[i+ANGLES] for i up to ANGLEQUAD
// = 90, i.e. index 450 — one past the end. In the DOS build that write lands
// on whatever follows sintable in DGROUP. Until the retail DGROUP layout
// fixture places these tables (PORTING.md §10), the port gives the array one
// extra slot so the out-of-bounds write is captured harmlessly.
export const sintable = new Int32Array(ANGLES + ANGLES / 4 + 1);
export const costable = sintable.subarray(ANGLES / 4);
