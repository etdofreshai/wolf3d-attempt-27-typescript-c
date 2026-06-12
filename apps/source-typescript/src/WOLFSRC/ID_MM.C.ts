// ID_MM.C

/*
=============================================================================

		   ID software memory manager
		   --------------------------

Primary coder: John Carmack

RELIES ON
---------
Quit (char *error) function


WORK TO DO
----------
MM_SizePtr to change the size of a given pointer

Multiple purge levels utilized

EMS / XMS unmanaged routines

=============================================================================
*/

/*
 * PORT MODEL NOTE (PORTING.md §6.3 / §11#4):
 *
 * This module is ported as a BEHAVIORAL MODEL, not yet a line-for-line
 * transliteration. The original manages real-mode conventional memory plus
 * EMS/XMS, with block moving/compaction (MM_SortMem) and purging under
 * memory pressure. The port allocates paragraph-aligned blocks from the
 * 16 MiB modeled DOS memory (dosmem.ts), which is sized so that pressure
 * NEVER occurs — so purging/compaction never fire in the original's
 * algorithm either, and observable behavior is identical:
 *
 *  - blocks are identified by their OWNER POINTER (`useptr`), exactly like
 *    the original — MM_GetPtr writes the new address back through it;
 *  - purge/lock attributes are tracked faithfully;
 *  - mmerror semantics preserved (never set, since allocation can't fail).
 *
 * The full transliteration (mmblocktype chain, MML_* routines, EMS/XMS as
 * dead code) is scheduled with the byte-identical-save milestone, which is
 * when block placement starts to matter.
 */

import { ref, lvar, sameCell, type PtrCell } from "../runtime/dosmem";
import { BUFFERSIZE, type mminfotype } from "./ID_MM.H";
import { Quit } from "./WL_MAIN.C";

/*
=============================================================================

						 GLOBAL VARIABLES

=============================================================================
*/

export const mm = {
  mminfo: {
    nearheap: 0,
    farheap: 0,
    EMSmem: 0,
    XMSmem: 0,
    mainmem: 0,
  } as mminfotype,
  // memptr bufferseg;
  bufferseg: 0,
  // boolean mmerror;
  mmerror: false,

  mmstarted: false,
};

/*
=============================================================================

						 LOCAL VARIABLES

=============================================================================
*/

interface mmblocktype {
  start: number; // linear address (paragraph aligned)
  length: number; // bytes reserved (paragraph rounded)
  attributes: number; // purge level (0-3) | LOCKBIT
  useptr: PtrCell; // pointer to the segment start
}

const LOCKBIT = 0x80;

// heap region inside modeled DOS memory: keep low addresses clear (future
// DGROUP image + VGA window live below) — heap runs from 1 MiB up.
const HEAPSTART = 0x100000;
const HEAPEND = 0x1000000;

let mmblocks: mmblocktype[] = []; // kept sorted by start

function MML_FindBlock(baseptr: PtrCell): mmblocktype | undefined {
  return mmblocks.find((b) => sameCell(b.useptr, baseptr));
}

/*
===================
=
= MM_Startup
=
= Grabs all space from turbo with malloc/farmalloc
= Allocates bufferseg misc buffer
=
===================
*/

export function MM_Startup(): void {
  if (mm.mmstarted) MM_Shutdown();
  mm.mmstarted = true;
  mm.mmerror = false;
  mmblocks = [];
  mm.mminfo.mainmem = HEAPEND - HEAPSTART;

  //
  // allocate the misc buffer
  //
  MM_GetPtr(ref(mm, "bufferseg"), BUFFERSIZE);
}

/*
====================
=
= MM_Shutdown
=
= Frees all conventional, EMS, and XMS allocated
=
====================
*/

export function MM_Shutdown(): void {
  if (!mm.mmstarted) return;
  mm.mmstarted = false;
  mmblocks = [];
  mm.bufferseg = 0;
}

export function MM_MapEMS(): void {
  // EMS page mapping — N/A in the model
}

/*
====================
=
= MM_GetPtr
=
= Allocates an unlocked, unpurgable block
=
====================
*/

export function MM_GetPtr(baseptr: PtrCell, size: number): void {
  const needed = Math.ceil(size / 16) * 16; // paragraph granularity

  // first fit in the gaps between blocks (blocks sorted by start)
  let start = HEAPSTART;
  let insertAt = mmblocks.length;
  for (let i = 0; i < mmblocks.length; i++) {
    if (mmblocks[i].start - start >= needed) {
      insertAt = i;
      break;
    }
    start = mmblocks[i].start + mmblocks[i].length;
  }
  if (start + needed > HEAPEND) {
    // The original would purge/compact here, and Quit on true exhaustion.
    Quit("MM_GetPtr: Out of memory!");
  }

  const block: mmblocktype = {
    start,
    length: needed,
    attributes: 0, // BASEATTRIBUTES: unlocked, unpurgable
    useptr: baseptr,
  };
  mmblocks.splice(insertAt, 0, block);
  baseptr.set(start); // mmnew->start = *(unsigned *)baseptr = startseg;
}

/*
====================
=
= MM_FreePtr
=
= Deallocates an unlocked, purgable block
=
====================
*/

export function MM_FreePtr(baseptr: PtrCell): void {
  const idx = mmblocks.findIndex((b) => sameCell(b.useptr, baseptr));
  if (idx < 0) Quit("MM_FreePtr: Block not found!");
  mmblocks.splice(idx, 1);
}

/*
=====================
=
= MM_SetPurge
=
= Sets the purge level for a block (locked blocks cannot be made purgable)
=
=====================
*/

export function MM_SetPurge(baseptr: PtrCell, purge: number): void {
  const block = MML_FindBlock(baseptr);
  if (!block) Quit("MM_SetPurge: Block not found!");
  block.attributes = (block.attributes & ~0x3) | purge;
}

/*
=====================
=
= MM_SetLock
=
= Locks / unlocks the block
=
=====================
*/

export function MM_SetLock(baseptr: PtrCell, locked: boolean): void {
  const block = MML_FindBlock(baseptr);
  if (!block) Quit("MM_SetLock: Block not found!");
  block.attributes = (block.attributes & ~LOCKBIT) | (locked ? LOCKBIT : 0);
}

/*
=====================
=
= MM_SortMem
=
= Throws out all purgable stuff and compresses movable blocks
=
=====================
*/

export function MM_SortMem(): void {
  // never needed in the model: no memory pressure, addresses are stable
}

/*
=====================
=
= MM_ShowMemory
=
=====================
*/

export function MM_ShowMemory(): void {
  // diagnostic screen — N/A until video lands
}

/*
======================
=
= MM_UnusedMemory
=
= Returns the total free space without purging
=
======================
*/

export function MM_UnusedMemory(): number {
  let used = 0;
  for (const b of mmblocks) used += b.length;
  return HEAPEND - HEAPSTART - used;
}

/*
======================
=
= MM_TotalFree
=
= Returns the total free space with purging
=
======================
*/

export function MM_TotalFree(): number {
  let used = 0;
  for (const b of mmblocks)
    if ((b.attributes & 0x3) === 0 || b.attributes & LOCKBIT) used += b.length;
  return HEAPEND - HEAPSTART - used;
}

/*
=====================
=
= MM_BombOnError
=
=====================
*/

export function MM_BombOnError(_bomb: boolean): void {
  // the model never sets mmerror, so bombing/not-bombing is moot
}

export function MML_UseSpace(_segstart: number, _seglength: number): void {
  // marks real-mode segments as usable heap — N/A in the model
}

/** test/diagnostic helper (not part of the original API) */
export function MM_BlockCount(): number {
  return mmblocks.length;
}

export { lvar as MM_LocalPtr };
