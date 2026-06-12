// ID_VH.H
//
// PARTIAL PORT: pictabletype, and the VW_* compatibility aliases the game
// code uses. The full view-hardware header lands with the menu/UI milestone.

/**
 * typedef struct
 * {
 *     int width,height;        // @0, @2 (i16)
 * } pictabletype;              // sizeof 4
 *
 * pictable lives in DOS memory (Huff-expanded from the STRUCTPIC chunk).
 */
export const sizeof_pictabletype = 4;

import { peekws } from "../runtime/dosmem";

export class pictabletype {
  constructor(readonly _addr: number) {}
  static at(addr: number): pictabletype {
    return new pictabletype(addr);
  }
  get width(): number {
    return peekws(this._addr + 0);
  }
  get height(): number {
    return peekws(this._addr + 2);
  }
}

// extern pictabletype _seg *pictable;   (defined in ID_VH.C.ts: vh.pictable)

//
// wolf compatability
//

// #define VW_SetScreen  VL_SetScreen
export { VL_SetScreen as VW_SetScreen } from "./ID_VL.C";
// #define VW_WaitVBL    VL_WaitVBL
export { VL_WaitVBL as VW_WaitVBL } from "./ID_VL.C";
// #define VW_FadeIn()   VL_FadeIn(0,255,gamepal,30);
// #define VW_FadeOut()  VL_FadeOut(0,255,0,0,0,30);
// (ported as functions where first used — they reference gamepal)
// #define VW_Bar        VL_Bar
export { VL_Bar as VW_Bar } from "./ID_VL.C";
// #define VW_Hlin(x,z,y,c) VL_Hlin(x,y,(z)-(x)+1,c)
// #define VW_Vlin(y,z,x,c) VL_Vlin(x,y,(z)-(y)+1,c)
