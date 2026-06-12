// ID_MM.H

export const SAVENEARHEAP = 0x400; // space to leave in data segment
export const SAVEFARHEAP = 0; // space to leave in far heap

export const BUFFERSIZE = 0x1000; // miscelanious, allways available buffer

export const MAXBLOCKS = 700;

//--------

// EMS / XMS interface constants — dead-but-present for the WL6 port
// (the modeled memory manager has no expanded/extended memory; see ID_MM.C.ts)

export const EMS_INT = 0x67;

export const EMS_STATUS = 0x40;
export const EMS_GETFRAME = 0x41;
export const EMS_GETPAGES = 0x42;
export const EMS_ALLOCPAGES = 0x43;
export const EMS_MAPPAGE = 0x44;
export const EMS_FREEPAGES = 0x45;
export const EMS_VERSION = 0x46;

//--------

export const XMS_INT = 0x2f;
// #define XMS_CALL(v) ...  (real-mode driver call — N/A in the model)

export const XMS_VERSION = 0x00;

export const XMS_ALLOCHMA = 0x01;
export const XMS_FREEHMA = 0x02;

export const XMS_GENABLEA20 = 0x03;
export const XMS_GDISABLEA20 = 0x04;
export const XMS_LENABLEA20 = 0x05;
export const XMS_LDISABLEA20 = 0x06;
export const XMS_QUERYA20 = 0x07;

export const XMS_QUERYFREE = 0x08;
export const XMS_ALLOC = 0x09;
export const XMS_FREE = 0x0a;
export const XMS_MOVE = 0x0b;
export const XMS_LOCK = 0x0c;
export const XMS_UNLOCK = 0x0d;
export const XMS_GETINFO = 0x0e;
export const XMS_RESIZE = 0x0f;

export const XMS_ALLOCUMB = 0x10;
export const XMS_FREEUMB = 0x11;

//==========================================================================

// typedef void _seg * memptr;
// In the port a memptr is a linear address into DOS memory (see dosmem.ts);
// 0 is the null pointer, matching zero-initialized C globals.
export type memptr = number;

export interface mminfotype {
  nearheap: number;
  farheap: number;
  EMSmem: number;
  XMSmem: number;
  mainmem: number;
}

//==========================================================================

// extern mminfotype mminfo;        (defined in ID_MM.C.ts: mm.mminfo)
// extern memptr     bufferseg;     (defined in ID_MM.C.ts: mm.bufferseg)
// extern boolean    mmerror;       (defined in ID_MM.C.ts: mm.mmerror)
