// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_MM.H
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_MM.H";
export const WOLFSRC_FUNCTIONS = [] as const;

export const SAVENEARHEAP = 0x400;
export const SAVEFARHEAP = 0;
export const BUFFERSIZE = 0x1000;
export const MAXBLOCKS = 700;

export const EMS_INT = 0x67;
export const EMS_STATUS = 0x40;
export const EMS_GETFRAME = 0x41;
export const EMS_GETPAGES = 0x42;
export const EMS_ALLOCPAGES = 0x43;
export const EMS_MAPPAGE = 0x44;
export const EMS_FREEPAGES = 0x45;
export const EMS_VERSION = 0x46;

export const XMS_INT = 0x2f;
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

export interface memptr {
  value: Uint8Array | null;
  segment: number;
  size: number;
}

export interface mminfotype {
  nearheap: number;
  farheap: number;
  EMSmem: number;
  XMSmem: number;
  mainmem: number;
}

// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // ID_MM.H
// 
// #ifndef __ID_CA__
// 
// #define __ID_CA__
// 
// #define SAVENEARHEAP	0x400		// space to leave in data segment
// #define SAVEFARHEAP		0			// space to leave in far heap
// 
// #define	BUFFERSIZE		0x1000		// miscelanious, allways available buffer
// 
// #define MAXBLOCKS		700
// 
// 
// //--------
// 
// #define	EMS_INT			0x67
// 
// #define	EMS_STATUS		0x40
// #define	EMS_GETFRAME	0x41
// #define	EMS_GETPAGES	0x42
// #define	EMS_ALLOCPAGES	0x43
// #define	EMS_MAPPAGE		0x44
// #define	EMS_FREEPAGES	0x45
// #define	EMS_VERSION		0x46
// 
// //--------
// 
// #define	XMS_INT			0x2f
// #define	XMS_CALL(v)		_AH = (v);\
// 						asm call [DWORD PTR XMSDriver]
// 
// #define	XMS_VERSION		0x00
// 
// #define	XMS_ALLOCHMA	0x01
// #define	XMS_FREEHMA		0x02
// 
// #define	XMS_GENABLEA20	0x03
// #define	XMS_GDISABLEA20	0x04
// #define	XMS_LENABLEA20	0x05
// #define	XMS_LDISABLEA20	0x06
// #define	XMS_QUERYA20	0x07
// 
// #define	XMS_QUERYFREE	0x08
// #define	XMS_ALLOC		0x09
// #define	XMS_FREE		0x0A
// #define	XMS_MOVE		0x0B
// #define	XMS_LOCK		0x0C
// #define	XMS_UNLOCK		0x0D
// #define	XMS_GETINFO		0x0E
// #define	XMS_RESIZE		0x0F
// 
// #define	XMS_ALLOCUMB	0x10
// #define	XMS_FREEUMB		0x11
// 
// //==========================================================================
// 
// typedef void _seg * memptr;
// 
// typedef struct
// {
// 	long	nearheap,farheap,EMSmem,XMSmem,mainmem;
// } mminfotype;
// 
// //==========================================================================
// 
// extern	mminfotype	mminfo;
// extern	memptr		bufferseg;
// extern	boolean		mmerror;
// 
// extern	void		(* beforesort) (void);
// extern	void		(* aftersort) (void);
// 
// //==========================================================================
// 
// void MM_Startup (void);
// void MM_Shutdown (void);
// void MM_MapEMS (void);
// 
// void MM_GetPtr (memptr *baseptr,unsigned long size);
// void MM_FreePtr (memptr *baseptr);
// 
// void MM_SetPurge (memptr *baseptr, int purge);
// void MM_SetLock (memptr *baseptr, boolean locked);
// void MM_SortMem (void);
// 
// void MM_ShowMemory (void);
// 
// long MM_UnusedMemory (void);
// long MM_TotalFree (void);
// 
// void MM_BombOnError (boolean bomb);
// 
// void MML_UseSpace (unsigned segstart, unsigned seglength);
// 
// #endif
