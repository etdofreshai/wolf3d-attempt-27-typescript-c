import { BUFFERSIZE, MAXBLOCKS, type memptr, type mminfotype } from "./ID_MM.H";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_MM.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_MM.C";
export const WOLFSRC_FUNCTIONS = [
  "MM_BombOnError",
  "MM_DumpData",
  "MM_FreePtr",
  "MM_GetPtr",
  "MM_SetLock",
  "MM_SetPurge",
  "MM_ShowMemory",
  "MM_Shutdown",
  "MM_SortMem",
  "MM_Startup",
  "MM_TotalFree",
  "MM_UnusedMemory",
  "MML_CheckForXMS",
  "MML_ClearBlock",
  "MML_SetupXMS",
  "MML_ShutdownXMS",
  "MML_UseSpace"
] as const;

const LOCKBIT = 0x80;
const PURGEBITS = 3;
const BASEATTRIBUTES = 0;
const DEFAULT_HEAP_BYTES = 0x100000;
const PARAGRAPH_BYTES = 16;

interface MMBlock {
  start: number;
  length: number;
  attributes: number;
  useptr: memptr | null;
  data: Uint8Array | null;
}

export interface MMBlockSummary {
  readonly start: number;
  readonly length: number;
  readonly bytes: number;
  readonly locked: boolean;
  readonly purge: number;
  readonly allocated: boolean;
  readonly size: number;
}

export interface MMSummary {
  readonly started: boolean;
  readonly blocks: number;
  readonly allocatedBlocks: number;
  readonly purgableBlocks: number;
  readonly lockedBlocks: number;
  readonly unusedMemory: number;
  readonly totalFree: number;
  readonly mmerror: boolean;
  readonly bombonerror: boolean;
  readonly mainmem: number;
  readonly bufferAllocated: boolean;
}

export const mminfo: mminfotype = {
  nearheap: 0,
  farheap: 0,
  EMSmem: 0,
  XMSmem: 0,
  mainmem: 0,
};
export let bufferseg: memptr = MM_NewPtrRef();
export let mmerror = false;
export let beforesort: (() => void) | null = null;
export let aftersort: (() => void) | null = null;
export let mmstarted = false;
export let bombonerror = true;
export let numUMBs = 0;
export const UMBbase: number[] = [];

let heapParagraphs = Math.trunc(DEFAULT_HEAP_BYTES / PARAGRAPH_BYTES);
let mmblocks: MMBlock[] = [];
let usedSpaces: { start: number; length: number }[] = [];

export function MM_NewPtrRef(): memptr {
  return { value: null, segment: 0, size: 0 };
}

export function MM_DebugState(): MMSummary {
  const allocated = allocatedBlocks();
  return {
    started: mmstarted,
    blocks: mmblocks.length,
    allocatedBlocks: allocated.length,
    purgableBlocks: allocated.filter((block) => (block.attributes & PURGEBITS) !== 0).length,
    lockedBlocks: allocated.filter((block) => (block.attributes & LOCKBIT) !== 0).length,
    unusedMemory: MM_UnusedMemory(),
    totalFree: MM_TotalFree(),
    mmerror,
    bombonerror,
    mainmem: mminfo.mainmem,
    bufferAllocated: bufferseg.value !== null,
  };
}

export function MM_BombOnError(bomb: boolean): boolean {
  bombonerror = bomb;
  return bombonerror;
}

export function MM_DumpData(): readonly MMBlockSummary[] {
  return MM_ShowMemory();
}

export function MM_FreePtr(baseptr: memptr | Uint8Array): MMSummary {
  const block = findBlock(baseptr);
  clearBlockRef(block);
  mmblocks = mmblocks.filter((candidate) => candidate !== block);
  return MM_DebugState();
}

export function MM_GetPtr(baseptr: memptr, size: number): Uint8Array | null {
  ensureStarted();
  if (!Number.isFinite(size) || size <= 0) {
    return allocationFailed("MM_GetPtr: Invalid size", baseptr);
  }
  if (baseptr.value) {
    MM_FreePtr(baseptr);
  }

  const needed = Math.max(1, Math.ceil(size / PARAGRAPH_BYTES));
  if (allocatedBlocks().length + 2 >= MAXBLOCKS) {
    MML_ClearBlock();
  }

  let start = findFreeGap(needed);
  if (start === -1) {
    MM_SortMem();
    start = findFreeGap(needed);
  }
  if (start === -1) {
    return allocationFailed("MM_GetPtr: Out of memory!", baseptr);
  }

  const data = new Uint8Array(size);
  const block: MMBlock = {
    start,
    length: needed,
    attributes: BASEATTRIBUTES,
    useptr: baseptr,
    data,
  };
  mmblocks.push(block);
  sortBlocks();
  baseptr.value = data;
  baseptr.segment = start;
  baseptr.size = size;
  mmerror = false;
  return data;
}

export function MM_SetLock(baseptr: memptr | Uint8Array, locked: boolean): MMSummary {
  const block = findBlock(baseptr);
  if (locked) {
    block.attributes |= LOCKBIT;
  } else {
    block.attributes &= ~LOCKBIT;
  }
  return MM_DebugState();
}

export function MM_SetPurge(baseptr: memptr | Uint8Array, purge: number): MMSummary {
  const block = findBlock(baseptr);
  block.attributes &= ~PURGEBITS;
  block.attributes |= purge & PURGEBITS;
  return MM_DebugState();
}

export function MM_ShowMemory(): readonly MMBlockSummary[] {
  return [...mmblocks].sort(compareBlocks).map((block) => ({
    start: block.start,
    length: block.length,
    bytes: block.length * PARAGRAPH_BYTES,
    locked: (block.attributes & LOCKBIT) !== 0,
    purge: block.attributes & PURGEBITS,
    allocated: block.useptr !== null,
    size: block.useptr?.size ?? 0,
  }));
}

export function MM_Shutdown(): MMSummary {
  for (const block of allocatedBlocks()) {
    clearBlockRef(block);
  }
  mmblocks = [];
  usedSpaces = [];
  mmstarted = false;
  mmerror = false;
  bufferseg = MM_NewPtrRef();
  mminfo.nearheap = 0;
  mminfo.farheap = 0;
  mminfo.EMSmem = 0;
  mminfo.XMSmem = 0;
  mminfo.mainmem = 0;
  return MM_DebugState();
}

export function MM_SortMem(): MMSummary {
  beforesort?.();
  sortBlocks();
  const head = mmblocks[0];
  const tail = mmblocks.at(-1);
  if (!head || !tail) {
    return MM_DebugState();
  }

  const survivors: MMBlock[] = [head];
  let cursor = head.start + head.length;
  for (const block of mmblocks.slice(1, -1)) {
    if ((block.attributes & PURGEBITS) && !(block.attributes & LOCKBIT)) {
      clearBlockRef(block);
      continue;
    }
    if (!(block.attributes & LOCKBIT)) {
      block.start = cursor;
      if (block.useptr) {
        block.useptr.segment = block.start;
      }
    }
    cursor = Math.max(cursor, block.start + block.length);
    survivors.push(block);
  }
  survivors.push(tail);
  mmblocks = survivors;
  aftersort?.();
  return MM_DebugState();
}

export function MM_Startup(heapBytes = DEFAULT_HEAP_BYTES): MMSummary {
  if (mmstarted) {
    MM_Shutdown();
  }
  heapParagraphs = Math.max(2, Math.trunc(heapBytes / PARAGRAPH_BYTES));
  mmstarted = true;
  bombonerror = true;
  mmerror = false;
  numUMBs = 0;
  UMBbase.length = 0;
  usedSpaces = [];
  bufferseg = MM_NewPtrRef();
  mmblocks = [
    { start: 0, length: 1, attributes: LOCKBIT, useptr: null, data: null },
    { start: heapParagraphs, length: 0, attributes: LOCKBIT, useptr: null, data: null },
  ];
  mminfo.nearheap = Math.trunc((heapParagraphs * PARAGRAPH_BYTES) / 3);
  mminfo.farheap = heapParagraphs * PARAGRAPH_BYTES - mminfo.nearheap;
  mminfo.EMSmem = 0;
  mminfo.XMSmem = 0;
  mminfo.mainmem = (heapParagraphs - 1) * PARAGRAPH_BYTES;
  MM_GetPtr(bufferseg, BUFFERSIZE);
  return MM_DebugState();
}

export function MM_TotalFree(): number {
  if (!mmstarted || mmblocks.length < 2) {
    return 0;
  }
  let free = 0;
  sortBlocks();
  for (let i = 0; i < mmblocks.length - 1; i++) {
    const block = mmblocks[i];
    const next = mmblocks[i + 1];
    if ((block.attributes & PURGEBITS) && !(block.attributes & LOCKBIT)) {
      free += block.length;
    }
    free += Math.max(0, next.start - (block.start + block.length));
  }
  return free * PARAGRAPH_BYTES;
}

export function MM_UnusedMemory(): number {
  if (!mmstarted || mmblocks.length < 2) {
    return 0;
  }
  let free = 0;
  sortBlocks();
  for (let i = 0; i < mmblocks.length - 1; i++) {
    const block = mmblocks[i];
    const next = mmblocks[i + 1];
    free += Math.max(0, next.start - (block.start + block.length));
  }
  return free * PARAGRAPH_BYTES;
}

export function MML_CheckForXMS(): boolean {
  numUMBs = 0;
  return false;
}

export function MML_ClearBlock(): MMSummary {
  const block = allocatedBlocks().find(
    (candidate) => (candidate.attributes & PURGEBITS) && !(candidate.attributes & LOCKBIT),
  );
  if (!block) {
    throw new Error("MM_ClearBlock: No purgable blocks!");
  }
  clearBlockRef(block);
  mmblocks = mmblocks.filter((candidate) => candidate !== block);
  return MM_DebugState();
}

export function MML_SetupXMS(): MMSummary {
  numUMBs = 0;
  UMBbase.length = 0;
  mminfo.XMSmem = 0;
  return MM_DebugState();
}

export function MML_ShutdownXMS(): MMSummary {
  numUMBs = 0;
  UMBbase.length = 0;
  mminfo.XMSmem = 0;
  return MM_DebugState();
}

export function MML_UseSpace(segstart: number, seglength: number): MMSummary {
  if (!Number.isInteger(segstart) || !Number.isInteger(seglength) || segstart < 0 || seglength < 0) {
    throw new RangeError(`Invalid memory range ${segstart}+${seglength}`);
  }
  usedSpaces.push({ start: segstart, length: seglength });
  return MM_DebugState();
}

export function MM_SetSortHooks(
  before: (() => void) | null,
  after: (() => void) | null,
): MMSummary {
  beforesort = before;
  aftersort = after;
  return MM_DebugState();
}

function ensureStarted(): void {
  if (!mmstarted) {
    MM_Startup();
  }
}

function allocatedBlocks(): MMBlock[] {
  return mmblocks.filter((block) => block.useptr !== null);
}

function findBlock(baseptr: memptr | Uint8Array): MMBlock {
  const block =
    baseptr instanceof Uint8Array
      ? allocatedBlocks().find((candidate) => candidate.data === baseptr)
      : allocatedBlocks().find((candidate) => candidate.useptr === baseptr);
  if (!block) {
    throw new Error("MM_FreePtr: Block not found!");
  }
  return block;
}

function clearBlockRef(block: MMBlock): void {
  if (block.useptr) {
    block.useptr.value = null;
    block.useptr.segment = 0;
    block.useptr.size = 0;
  }
  block.useptr = null;
  block.data = null;
}

function findFreeGap(needed: number): number {
  sortBlocks();
  for (let i = 0; i < mmblocks.length - 1; i++) {
    const block = mmblocks[i];
    const next = mmblocks[i + 1];
    const start = block.start + block.length;
    if (next.start - start >= needed) {
      return start;
    }
  }
  return -1;
}

function allocationFailed(message: string, baseptr: memptr): null {
  baseptr.value = null;
  baseptr.segment = 0;
  baseptr.size = 0;
  mmerror = true;
  if (bombonerror) {
    throw new Error(message);
  }
  return null;
}

function sortBlocks(): void {
  mmblocks.sort(compareBlocks);
}

function compareBlocks(a: MMBlock, b: MMBlock): number {
  return a.start - b.start;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // NEWMM.C
// 
// /*
// =============================================================================
// 
// 		   ID software memory manager
// 		   --------------------------
// 
// Primary coder: John Carmack
// 
// RELIES ON
// ---------
// Quit (char *error) function
// 
// 
// WORK TO DO
// ----------
// MM_SizePtr to change the size of a given pointer
// 
// Multiple purge levels utilized
// 
// EMS / XMS unmanaged routines
// 
// =============================================================================
// */
// 
// #include "ID_HEADS.H"
// #pragma hdrstop
// 
// #pragma warn -pro
// #pragma warn -use
// 
// /*
// =============================================================================
// 
// 							LOCAL INFO
// 
// =============================================================================
// */
// 
// #define LOCKBIT		0x80	// if set in attributes, block cannot be moved
// #define PURGEBITS	3		// 0-3 level, 0= unpurgable, 3= purge first
// #define PURGEMASK	0xfffc
// #define BASEATTRIBUTES	0	// unlocked, non purgable
// 
// #define MAXUMBS		10
// 
// typedef struct mmblockstruct
// {
// 	unsigned	start,length;
// 	unsigned	attributes;
// 	memptr		*useptr;	// pointer to the segment start
// 	struct mmblockstruct far *next;
// } mmblocktype;
// 
// 
// //#define GETNEWBLOCK {if(!(mmnew=mmfree))Quit("MM_GETNEWBLOCK: No free blocks!")\
// //	;mmfree=mmfree->next;}
// 
// #define GETNEWBLOCK {if(!mmfree)MML_ClearBlock();mmnew=mmfree;mmfree=mmfree->next;}
// 
// #define FREEBLOCK(x) {*x->useptr=NULL;x->next=mmfree;mmfree=x;}
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// mminfotype	mminfo;
// memptr		bufferseg;
// boolean		mmerror;
// 
// void		(* beforesort) (void);
// void		(* aftersort) (void);
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// boolean		mmstarted;
// 
// void far	*farheap;
// void		*nearheap;
// 
// mmblocktype	far mmblocks[MAXBLOCKS]
// 			,far *mmhead,far *mmfree,far *mmrover,far *mmnew;
// 
// boolean		bombonerror;
// 
// //unsigned	totalEMSpages,freeEMSpages,EMSpageframe,EMSpagesmapped,EMShandle;
// 
// void		(* XMSaddr) (void);		// far pointer to XMS driver
// 
// unsigned	numUMBs,UMBbase[MAXUMBS];
// 
// //==========================================================================
// 
// //
// // local prototypes
// //
// 
// boolean		MML_CheckForEMS (void);
// void 		MML_ShutdownEMS (void);
// void 		MM_MapEMS (void);
// boolean 	MML_CheckForXMS (void);
// void 		MML_ShutdownXMS (void);
// void		MML_UseSpace (unsigned segstart, unsigned seglength);
// void 		MML_ClearBlock (void);
// 
// //==========================================================================
// 
// /*
// ======================
// =
// = MML_CheckForXMS
// =
// = Check for XMM driver
// =
// =======================
// */
// 
// boolean MML_CheckForXMS (void)
// {
// 	numUMBs = 0;
// 
// asm {
// 	mov	ax,0x4300
// 	int	0x2f				// query status of installed diver
// 	cmp	al,0x80
// 	je	good
// 	}
// 
// 	return false;
// good:
// 	return true;
// }
// 
// 
// /*
// ======================
// =
// = MML_SetupXMS
// =
// = Try to allocate all upper memory block
// =
// =======================
// */
// 
// void MML_SetupXMS (void)
// {
// 	unsigned	base,size;
// 
// asm	{
// 	mov	ax,0x4310
// 	int	0x2f
// 	mov	[WORD PTR XMSaddr],bx
// 	mov	[WORD PTR XMSaddr+2],es		// function pointer to XMS driver
// 	}
// 
// getmemory:
// asm	{
// 	mov	ah,XMS_ALLOCUMB
// 	mov	dx,0xffff					// try for largest block possible
// 	call	[DWORD PTR XMSaddr]
// 	or	ax,ax
// 	jnz	gotone
// 
// 	cmp	bl,0xb0						// error: smaller UMB is available
// 	jne	done;
// 
// 	mov	ah,XMS_ALLOCUMB
// 	call	[DWORD PTR XMSaddr]		// DX holds largest available UMB
// 	or	ax,ax
// 	jz	done						// another error...
// 	}
// 
// gotone:
// asm	{
// 	mov	[base],bx
// 	mov	[size],dx
// 	}
// 	MML_UseSpace (base,size);
// 	mminfo.XMSmem += size*16;
// 	UMBbase[numUMBs] = base;
// 	numUMBs++;
// 	if (numUMBs < MAXUMBS)
// 		goto getmemory;
// 
// done:;
// }
// 
// 
// /*
// ======================
// =
// = MML_ShutdownXMS
// =
// ======================
// */
// 
// void MML_ShutdownXMS (void)
// {
// 	int	i;
// 	unsigned	base;
// 
// 	for (i=0;i<numUMBs;i++)
// 	{
// 		base = UMBbase[i];
// 
// asm	mov	ah,XMS_FREEUMB
// asm	mov	dx,[base]
// asm	call	[DWORD PTR XMSaddr]
// 	}
// }
// 
// //==========================================================================
// 
// /*
// ======================
// =
// = MML_UseSpace
// =
// = Marks a range of paragraphs as usable by the memory manager
// = This is used to mark space for the near heap, far heap, ems page frame,
// = and upper memory blocks
// =
// ======================
// */
// 
// void MML_UseSpace (unsigned segstart, unsigned seglength)
// {
// 	mmblocktype far *scan,far *last;
// 	unsigned	oldend;
// 	long		extra;
// 
// 	scan = last = mmhead;
// 	mmrover = mmhead;		// reset rover to start of memory
// 
// //
// // search for the block that contains the range of segments
// //
// 	while (scan->start+scan->length < segstart)
// 	{
// 		last = scan;
// 		scan = scan->next;
// 	}
// 
// //
// // take the given range out of the block
// //
// 	oldend = scan->start + scan->length;
// 	extra = oldend - (segstart+seglength);
// 	if (extra < 0)
// 		Quit ("MML_UseSpace: Segment spans two blocks!");
// 
// 	if (segstart == scan->start)
// 	{
// 		last->next = scan->next;			// unlink block
// 		FREEBLOCK(scan);
// 		scan = last;
// 	}
// 	else
// 		scan->length = segstart-scan->start;	// shorten block
// 
// 	if (extra > 0)
// 	{
// 		GETNEWBLOCK;
// 		mmnew->useptr = NULL;
// 
// 		mmnew->next = scan->next;
// 		scan->next = mmnew;
// 		mmnew->start = segstart+seglength;
// 		mmnew->length = extra;
// 		mmnew->attributes = LOCKBIT;
// 	}
// 
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = MML_ClearBlock
// =
// = We are out of blocks, so free a purgable block
// =
// ====================
// */
// 
// void MML_ClearBlock (void)
// {
// 	mmblocktype far *scan,far *last;
// 
// 	scan = mmhead->next;
// 
// 	while (scan)
// 	{
// 		if (!(scan->attributes&LOCKBIT) && (scan->attributes&PURGEBITS) )
// 		{
// 			MM_FreePtr(scan->useptr);
// 			return;
// 		}
// 		scan = scan->next;
// 	}
// 
// 	Quit ("MM_ClearBlock: No purgable blocks!");
// }
// 
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = MM_Startup
// =
// = Grabs all space from turbo with malloc/farmalloc
// = Allocates bufferseg misc buffer
// =
// ===================
// */
// 
// static	char *ParmStrings[] = {"noems","noxms",""};
// 
// void MM_Startup (void)
// {
// 	int i;
// 	unsigned 	long length;
// 	void far 	*start;
// 	unsigned 	segstart,seglength,endfree;
// 
// 	if (mmstarted)
// 		MM_Shutdown ();
// 
// 
// 	mmstarted = true;
// 	bombonerror = true;
// //
// // set up the linked list (everything in the free list;
// //
// 	mmhead = NULL;
// 	mmfree = &mmblocks[0];
// 	for (i=0;i<MAXBLOCKS-1;i++)
// 		mmblocks[i].next = &mmblocks[i+1];
// 	mmblocks[i].next = NULL;
// 
// //
// // locked block of all memory until we punch out free space
// //
// 	GETNEWBLOCK;
// 	mmhead = mmnew;				// this will allways be the first node
// 	mmnew->start = 0;
// 	mmnew->length = 0xffff;
// 	mmnew->attributes = LOCKBIT;
// 	mmnew->next = NULL;
// 	mmrover = mmhead;
// 
// 
// //
// // get all available near conventional memory segments
// //
// 	length=coreleft();
// 	start = (void far *)(nearheap = malloc(length));
// 
// 	length -= 16-(FP_OFF(start)&15);
// 	length -= SAVENEARHEAP;
// 	seglength = length / 16;			// now in paragraphs
// 	segstart = FP_SEG(start)+(FP_OFF(start)+15)/16;
// 	MML_UseSpace (segstart,seglength);
// 	mminfo.nearheap = length;
// 
// //
// // get all available far conventional memory segments
// //
// 	length=farcoreleft();
// 	start = farheap = farmalloc(length);
// 	length -= 16-(FP_OFF(start)&15);
// 	length -= SAVEFARHEAP;
// 	seglength = length / 16;			// now in paragraphs
// 	segstart = FP_SEG(start)+(FP_OFF(start)+15)/16;
// 	MML_UseSpace (segstart,seglength);
// 	mminfo.farheap = length;
// 	mminfo.mainmem = mminfo.nearheap + mminfo.farheap;
// 
// //
// // allocate the misc buffer
// //
// 	mmrover = mmhead;		// start looking for space after low block
// 
// 	MM_GetPtr (&bufferseg,BUFFERSIZE);
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = MM_Shutdown
// =
// = Frees all conventional, EMS, and XMS allocated
// =
// ====================
// */
// 
// void MM_Shutdown (void)
// {
//   if (!mmstarted)
// 	return;
// 
//   farfree (farheap);
//   free (nearheap);
// //  MML_ShutdownXMS ();
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = MM_GetPtr
// =
// = Allocates an unlocked, unpurgable block
// =
// ====================
// */
// 
// void MM_GetPtr (memptr *baseptr,unsigned long size)
// {
// 	mmblocktype far *scan,far *lastscan,far *endscan
// 				,far *purge,far *next;
// 	int			search;
// 	unsigned	needed,startseg;
// 
// 	needed = (size+15)/16;		// convert size from bytes to paragraphs
// 
// 	GETNEWBLOCK;				// fill in start and next after a spot is found
// 	mmnew->length = needed;
// 	mmnew->useptr = baseptr;
// 	mmnew->attributes = BASEATTRIBUTES;
// 
// tryagain:
// 	for (search = 0; search<3; search++)
// 	{
// 	//
// 	// first search:	try to allocate right after the rover, then on up
// 	// second search: 	search from the head pointer up to the rover
// 	// third search:	compress memory, then scan from start
// 		if (search == 1 && mmrover == mmhead)
// 			search++;
// 
// 		switch (search)
// 		{
// 		case 0:
// 			lastscan = mmrover;
// 			scan = mmrover->next;
// 			endscan = NULL;
// 			break;
// 		case 1:
// 			lastscan = mmhead;
// 			scan = mmhead->next;
// 			endscan = mmrover;
// 			break;
// 		case 2:
// 			MM_SortMem ();
// 			lastscan = mmhead;
// 			scan = mmhead->next;
// 			endscan = NULL;
// 			break;
// 		}
// 
// 		startseg = lastscan->start + lastscan->length;
// 
// 		while (scan != endscan)
// 		{
// 			if (scan->start - startseg >= needed)
// 			{
// 			//
// 			// got enough space between the end of lastscan and
// 			// the start of scan, so throw out anything in the middle
// 			// and allocate the new block
// 			//
// 				purge = lastscan->next;
// 				lastscan->next = mmnew;
// 				mmnew->start = *(unsigned *)baseptr = startseg;
// 				mmnew->next = scan;
// 				while ( purge != scan)
// 				{	// free the purgable block
// 					next = purge->next;
// 					FREEBLOCK(purge);
// 					purge = next;		// purge another if not at scan
// 				}
// 				mmrover = mmnew;
// 				return;	// good allocation!
// 			}
// 
// 			//
// 			// if this block is purge level zero or locked, skip past it
// 			//
// 			if ( (scan->attributes & LOCKBIT)
// 				|| !(scan->attributes & PURGEBITS) )
// 			{
// 				lastscan = scan;
// 				startseg = lastscan->start + lastscan->length;
// 			}
// 
// 
// 			scan=scan->next;		// look at next line
// 		}
// 	}
// 
// 	if (bombonerror)
// 	{
// 
// extern char configname[];
// extern	boolean	insetupscaling;
// extern	int	viewsize;
// boolean SetViewSize (unsigned width, unsigned height);
// #define HEIGHTRATIO		0.50
// //
// // wolf hack -- size the view down
// //
// 		if (!insetupscaling && viewsize>10)
// 		{
// mmblocktype	far *savedmmnew;
// 			savedmmnew = mmnew;
// 			viewsize -= 2;
// 			SetViewSize (viewsize*16,viewsize*16*HEIGHTRATIO);
// 			mmnew = savedmmnew;
// 			goto tryagain;
// 		}
// 
// //		unlink(configname);
// 		Quit ("MM_GetPtr: Out of memory!");
// 	}
// 	else
// 		mmerror = true;
// }
// 
// //==========================================================================
// 
// /*
// ====================
// =
// = MM_FreePtr
// =
// = Deallocates an unlocked, purgable block
// =
// ====================
// */
// 
// void MM_FreePtr (memptr *baseptr)
// {
// 	mmblocktype far *scan,far *last;
// 
// 	last = mmhead;
// 	scan = last->next;
// 
// 	if (baseptr == mmrover->useptr)	// removed the last allocated block
// 		mmrover = mmhead;
// 
// 	while (scan->useptr != baseptr && scan)
// 	{
// 		last = scan;
// 		scan = scan->next;
// 	}
// 
// 	if (!scan)
// 		Quit ("MM_FreePtr: Block not found!");
// 
// 	last->next = scan->next;
// 
// 	FREEBLOCK(scan);
// }
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_SetPurge
// =
// = Sets the purge level for a block (locked blocks cannot be made purgable)
// =
// =====================
// */
// 
// void MM_SetPurge (memptr *baseptr, int purge)
// {
// 	mmblocktype far *start;
// 
// 	start = mmrover;
// 
// 	do
// 	{
// 		if (mmrover->useptr == baseptr)
// 			break;
// 
// 		mmrover = mmrover->next;
// 
// 		if (!mmrover)
// 			mmrover = mmhead;
// 		else if (mmrover == start)
// 			Quit ("MM_SetPurge: Block not found!");
// 
// 	} while (1);
// 
// 	mmrover->attributes &= ~PURGEBITS;
// 	mmrover->attributes |= purge;
// }
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_SetLock
// =
// = Locks / unlocks the block
// =
// =====================
// */
// 
// void MM_SetLock (memptr *baseptr, boolean locked)
// {
// 	mmblocktype far *start;
// 
// 	start = mmrover;
// 
// 	do
// 	{
// 		if (mmrover->useptr == baseptr)
// 			break;
// 
// 		mmrover = mmrover->next;
// 
// 		if (!mmrover)
// 			mmrover = mmhead;
// 		else if (mmrover == start)
// 			Quit ("MM_SetLock: Block not found!");
// 
// 	} while (1);
// 
// 	mmrover->attributes &= ~LOCKBIT;
// 	mmrover->attributes |= locked*LOCKBIT;
// }
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_SortMem
// =
// = Throws out all purgable stuff and compresses movable blocks
// =
// =====================
// */
// 
// void MM_SortMem (void)
// {
// 	mmblocktype far *scan,far *last,far *next;
// 	unsigned	start,length,source,dest;
// 	int			playing;
// 
// 	//
// 	// lock down a currently playing sound
// 	//
// 	playing = SD_SoundPlaying ();
// 	if (playing)
// 	{
// 		switch (SoundMode)
// 		{
// 		case sdm_PC:
// 			playing += STARTPCSOUNDS;
// 			break;
// 		case sdm_AdLib:
// 			playing += STARTADLIBSOUNDS;
// 			break;
// 		}
// 		MM_SetLock(&(memptr)audiosegs[playing],true);
// 	}
// 
// 
// 	SD_StopSound();
// 
// 	if (beforesort)
// 		beforesort();
// 
// 	scan = mmhead;
// 
// 	last = NULL;		// shut up compiler warning
// 
// 	while (scan)
// 	{
// 		if (scan->attributes & LOCKBIT)
// 		{
// 		//
// 		// block is locked, so try to pile later blocks right after it
// 		//
// 			start = scan->start + scan->length;
// 		}
// 		else
// 		{
// 			if (scan->attributes & PURGEBITS)
// 			{
// 			//
// 			// throw out the purgable block
// 			//
// 				next = scan->next;
// 				FREEBLOCK(scan);
// 				last->next = next;
// 				scan = next;
// 				continue;
// 			}
// 			else
// 			{
// 			//
// 			// push the non purgable block on top of the last moved block
// 			//
// 				if (scan->start != start)
// 				{
// 					length = scan->length;
// 					source = scan->start;
// 					dest = start;
// 					while (length > 0xf00)
// 					{
// 						movedata(source,0,dest,0,0xf00*16);
// 						length -= 0xf00;
// 						source += 0xf00;
// 						dest += 0xf00;
// 					}
// 					movedata(source,0,dest,0,length*16);
// 
// 					scan->start = start;
// 					*(unsigned *)scan->useptr = start;
// 				}
// 				start = scan->start + scan->length;
// 			}
// 		}
// 
// 		last = scan;
// 		scan = scan->next;		// go to next block
// 	}
// 
// 	mmrover = mmhead;
// 
// 	if (aftersort)
// 		aftersort();
// 
// 	if (playing)
// 		MM_SetLock(&(memptr)audiosegs[playing],false);
// }
// 
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_ShowMemory
// =
// =====================
// */
// 
// void MM_ShowMemory (void)
// {
// 	mmblocktype far *scan;
// 	unsigned color,temp,x,y;
// 	long	end,owner;
// 	char    scratch[80],str[10];
// 
// 	temp = bufferofs;
// 	bufferofs = displayofs;
// 	scan = mmhead;
// 
// 	end = -1;
// 
// 	while (scan)
// 	{
// 		if (scan->attributes & PURGEBITS)
// 			color = 5;		// dark purple = purgable
// 		else
// 			color = 9;		// medium blue = non purgable
// 		if (scan->attributes & LOCKBIT)
// 			color = 12;		// red = locked
// 		if (scan->start<=end)
// 			Quit ("MM_ShowMemory: Memory block order currupted!");
// 		end = scan->length-1;
// 		y = scan->start/320;
// 		x = scan->start%320;
// 		VW_Hlin(x,x+end,y,color);
// 		VW_Plot(x,y,15);
// 		if (scan->next && scan->next->start > end+1)
// 			VW_Hlin(x+end+1,x+(scan->next->start-scan->start),y,0);	// black = free
// 
// 		scan = scan->next;
// 	}
// 
// 	VW_FadeIn ();
// 	IN_Ack();
// 
// 	bufferofs = temp;
// }
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_DumpData
// =
// =====================
// */
// 
// void MM_DumpData (void)
// {
// 	mmblocktype far *scan,far *best;
// 	long	lowest,oldlowest;
// 	unsigned	owner;
// 	char	lock,purge;
// 	FILE	*dumpfile;
// 
// 
// 	free (nearheap);
// 	dumpfile = fopen ("MMDUMP.TXT","w");
// 	if (!dumpfile)
// 		Quit ("MM_DumpData: Couldn't open MMDUMP.TXT!");
// 
// 	lowest = -1;
// 	do
// 	{
// 		oldlowest = lowest;
// 		lowest = 0xffff;
// 
// 		scan = mmhead;
// 		while (scan)
// 		{
// 			owner = (unsigned)scan->useptr;
// 
// 			if (owner && owner<lowest && owner > oldlowest)
// 			{
// 				best = scan;
// 				lowest = owner;
// 			}
// 
// 			scan = scan->next;
// 		}
// 
// 		if (lowest != 0xffff)
// 		{
// 			if (best->attributes & PURGEBITS)
// 				purge = 'P';
// 			else
// 				purge = '-';
// 			if (best->attributes & LOCKBIT)
// 				lock = 'L';
// 			else
// 				lock = '-';
// 			fprintf (dumpfile,"0x%p (%c%c) = %u\n"
// 			,(unsigned)lowest,lock,purge,best->length);
// 		}
// 
// 	} while (lowest != 0xffff);
// 
// 	fclose (dumpfile);
// 	Quit ("MMDUMP.TXT created.");
// }
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = MM_UnusedMemory
// =
// = Returns the total free space without purging
// =
// ======================
// */
// 
// long MM_UnusedMemory (void)
// {
// 	unsigned free;
// 	mmblocktype far *scan;
// 
// 	free = 0;
// 	scan = mmhead;
// 
// 	while (scan->next)
// 	{
// 		free += scan->next->start - (scan->start + scan->length);
// 		scan = scan->next;
// 	}
// 
// 	return free*16l;
// }
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = MM_TotalFree
// =
// = Returns the total free space with purging
// =
// ======================
// */
// 
// long MM_TotalFree (void)
// {
// 	unsigned free;
// 	mmblocktype far *scan;
// 
// 	free = 0;
// 	scan = mmhead;
// 
// 	while (scan->next)
// 	{
// 		if ((scan->attributes&PURGEBITS) && !(scan->attributes&LOCKBIT))
// 			free += scan->length;
// 		free += scan->next->start - (scan->start + scan->length);
// 		scan = scan->next;
// 	}
// 
// 	return free*16l;
// }
// 
// //==========================================================================
// 
// /*
// =====================
// =
// = MM_BombOnError
// =
// =====================
// */
// 
// void MM_BombOnError (boolean bomb)
// {
// 	bombonerror = bomb;
// }
// 
// 
// 
