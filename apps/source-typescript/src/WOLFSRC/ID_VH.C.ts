// ID_VH.C
//
// PARTIAL PORT: the globals/functions the modules ported so far reference
// (pictable, the update-block machinery, VL_MungePic). Pic/font drawing
// lands with the menu/UI milestone.

import { UPDATEHIGH, UPDATEWIDE } from "./ID_HEADS.H";
import { memb } from "../runtime/dosmem";
import { lvar } from "../runtime/dosmem";
import { MM_GetPtr, MM_FreePtr } from "./ID_MM.C";
import { MS_Quit } from "./ID_VL.H";
import { wp, uwidthtable } from "./WL_PLAY.C";

const PIXTOBLOCK = 4; // 16 pixels to an update block

// byte update[UPDATEHIGH][UPDATEWIDE];
export const update = new Uint8Array(UPDATEHIGH * UPDATEWIDE);

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
=================
=
= VL_MungePic
=
=================
*/

export function VL_MungePic(source: number, width: number, height: number): void {
  let x: number, y: number, plane: number, size: number, pwidth: number;
  const temp = lvar(); // byte _seg *temp
  let dest: number, srcline: number;

  size = width * height;

  if (width & 3) MS_Quit("VL_MungePic: Not divisable by 4!");

  //
  // copy the pic to a temp buffer
  //
  MM_GetPtr(temp, size);
  memb.copyWithin(temp.get(), source, source + size); // _fmemcpy (temp,source,size);

  //
  // munge it back into the original buffer
  //
  dest = source;
  pwidth = Math.trunc(width / 4);

  for (plane = 0; plane < 4; plane++) {
    srcline = temp.get();
    for (y = 0; y < height; y++) {
      for (x = 0; x < pwidth; x++) memb[dest++] = memb[srcline + x * 4 + plane];
      srcline += width;
    }
  }

  MM_FreePtr(temp);
}

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
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  let x: number, y: number, xt1: number, yt1: number, xt2: number, yt2: number;
  let nextline: number;
  let mark: number;

  xt1 = x1 >> PIXTOBLOCK;
  yt1 = y1 >> PIXTOBLOCK;

  xt2 = x2 >> PIXTOBLOCK;
  yt2 = y2 >> PIXTOBLOCK;

  if (xt1 < 0) xt1 = 0;
  else if (xt1 >= UPDATEWIDE) return 0;

  if (yt1 < 0) yt1 = 0;
  else if (yt1 > UPDATEHIGH) return 0;

  if (xt2 < 0) return 0;
  else if (xt2 >= UPDATEWIDE) xt2 = UPDATEWIDE - 1;

  if (yt2 < 0) return 0;
  else if (yt2 >= UPDATEHIGH) yt2 = UPDATEHIGH - 1;

  mark = wp.updateptr + uwidthtable[yt1] + xt1;
  nextline = UPDATEWIDE - (xt2 - xt1) - 1;

  for (y = yt1; y <= yt2; y++) {
    for (x = xt1; x <= xt2; x++) update[mark++] = 1; // this tile will need to be updated

    mark += nextline;
  }

  return 1;
}
