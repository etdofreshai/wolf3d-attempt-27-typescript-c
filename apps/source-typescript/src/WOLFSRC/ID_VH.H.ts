// ID_VH.H
//
// PARTIAL PORT: only what ID_CA needs so far (pictabletype). The full
// view-hardware header lands with the ID_VH.C port.

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
