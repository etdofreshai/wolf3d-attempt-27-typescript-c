// ID_MM.H

// #ifndef __ID_CA__

// #define __ID_CA__

export const SAVENEARHEAP = 0x400;		// space to leave in data segment
export const SAVEFARHEAP = 0;			// space to leave in far heap

export const BUFFERSIZE = 0x1000;		// miscelanious, allways available buffer

export const MAXBLOCKS = 700;


//--------

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
// #define	XMS_CALL(v)		_AH = (v);\
// 						asm call [DWORD PTR XMSDriver]
export function XMS_CALL(v: number): void {
	void v;
	throw new Error("XMS_CALL requires DOS XMS driver assembly support");
}

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
export const XMS_FREE = 0x0A;
export const XMS_MOVE = 0x0B;
export const XMS_LOCK = 0x0C;
export const XMS_UNLOCK = 0x0D;
export const XMS_GETINFO = 0x0E;
export const XMS_RESIZE = 0x0F;

export const XMS_ALLOCUMB = 0x10;
export const XMS_FREEUMB = 0x11;

//==========================================================================

export type memptr = unknown;

export interface mminfotype
{
	nearheap: number;
	farheap: number;
	EMSmem: number;
	XMSmem: number;
	mainmem: number;
}

//==========================================================================

// extern	mminfotype	mminfo;
// extern	memptr		bufferseg;
// extern	boolean		mmerror;

// extern	void		(* beforesort) (void);
// extern	void		(* aftersort) (void);

//==========================================================================

// void MM_Startup (void);
// void MM_Shutdown (void);
// void MM_MapEMS (void);

// void MM_GetPtr (memptr *baseptr,unsigned long size);
// void MM_FreePtr (memptr *baseptr);

// void MM_SetPurge (memptr *baseptr, int purge);
// void MM_SetLock (memptr *baseptr, boolean locked);
// void MM_SortMem (void);

// void MM_ShowMemory (void);

// long MM_UnusedMemory (void);
// long MM_TotalFree (void);

// void MM_BombOnError (boolean bomb);

// void MML_UseSpace (unsigned segstart, unsigned seglength);

// #endif
