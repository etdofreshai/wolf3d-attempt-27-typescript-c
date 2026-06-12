// ID_VH.C
//
// PARTIAL PORT: only the globals/functions ID_CA references so far.
// The full view-hardware module is ported in the game-loop milestone.

import { Quit } from "./WL_MAIN.C";

//==========================================================================

export const vh = {
  // pictabletype _seg *pictable;
  pictable: 0,

  // int  px,py;
  px: 0,
  py: 0,
  // byte fontcolor,backcolor;
  fontcolor: 0,
  backcolor: 0,
  // int  fontnumber;
  fontnumber: 0,
  // int bufferwidth,bufferheight;
  bufferwidth: 0,
  bufferheight: 0,
};

//==========================================================================

/*
=======================
=
= VW_MarkUpdateBlock
=
= Takes a pixel bounded block and marks the tiles in bufferblocks
= Returns 0 if the entire block is off the buffer screen
=
=======================
*/

export function VW_MarkUpdateBlock(
  _x1: number,
  _y1: number,
  _x2: number,
  _y2: number,
): number {
  // NOT YET PORTED — needs updateptr/uwidthtable (game-loop milestone).
  // Faithful body comes with the ID_VH.C port; nothing calls this until
  // CA_CacheScreen is exercised by the menu/signon flow.
  Quit("VW_MarkUpdateBlock: not yet ported");
}
