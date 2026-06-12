// ID_CA.H
//===========================================================================

import { peekl, peekw, peekstr } from "../runtime/dosmem";

export const NUMMAPS = 60;
export const MAPPLANES = 2;

// #define UNCACHEGRCHUNK(chunk) {MM_FreePtr(&grsegs[chunk]);grneeded[chunk]&=~ca_levelbit;}
// (ported as a function in ID_CA.C.ts — it touches ID_CA's state)

//===========================================================================

/**
 * typedef struct
 * {
 *     long     planestart[3];      // @0   3 x i32
 *     unsigned planelength[3];     // @12  3 x u16
 *     unsigned width,height;       // @18, @20
 *     char     name[16];           // @22
 * } maptype;                       // sizeof 38 (word-aligned, no padding)
 *
 * Lives in DOS memory (read raw from GAMEMAPS); accessed through this view.
 */
export const sizeof_maptype = 38;
export class maptype {
  constructor(readonly _addr: number) {}
  static at(addr: number): maptype {
    return new maptype(addr);
  }
  planestart(i: number): number {
    return peekl(this._addr + 0 + 4 * i);
  }
  planelength(i: number): number {
    return peekw(this._addr + 12 + 2 * i);
  }
  get width(): number {
    return peekw(this._addr + 18);
  }
  get height(): number {
    return peekw(this._addr + 20);
  }
  get name(): string {
    return peekstr(this._addr + 22, 16);
  }
}

//===========================================================================

// The externs (tinf, mapon, mapsegs, mapheaderseg, audiosegs, grsegs,
// grneeded, ca_levelbit, ca_levelnum, titleptr, profilehandle, debughandle,
// extension, g*name, m*name, a*name, grstarts, audiostarts) are defined by
// ID_CA.C.ts on its exported `ca` state record (PORTING.md §6.4 / §11#1).

// #define CA_MarkGrChunk(chunk) grneeded[chunk]|=ca_levelbit
// (ported as a function in ID_CA.C.ts)
