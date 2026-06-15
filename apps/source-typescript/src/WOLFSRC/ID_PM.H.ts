// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_PM.H
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_PM.H";
export const WOLFSRC_FUNCTIONS = [] as const;

export const EMSPageSize = 16384;
export const EMSPageSizeSeg = EMSPageSize >> 4;
export const EMSPageSizeKB = EMSPageSize >> 10;
export const EMSFrameCount = 4;

export const PMPageSize = 4096;
export const PMPageSizeSeg = PMPageSize >> 4;
export const PMPageSizeKB = PMPageSize >> 10;
export const PMEMSSubPage = EMSPageSize / PMPageSize;

export const PMMinMainMem = 10;
export const PMMaxMainMem = 100;

export const PMThrashThreshold = 1;
export const PMUnThrashThreshold = 5;

export const pml_Unlocked = 0;
export const pml_Locked = 1;
export type PMLockType = typeof pml_Unlocked | typeof pml_Locked;

export const pmba_Unused = 0;
export const pmba_Used = 1;
export const pmba_Allocated = 2;
export type PMBlockAttr = typeof pmba_Unused | typeof pmba_Used | typeof pmba_Allocated;

export interface PageListStruct {
  offset: number;
  length: number;
  xmsPage: number;
  locked: PMLockType;
  emsPage: number;
  mainPage: number;
  lastHit: number;
}

export interface EMSListStruct {
  baseEMSPage: number;
  lastHit: number;
}

// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID_PM.H
// //	Header file for Id Engine's Page Manager
// //
// 
// //	NOTE! PMPageSize must be an even divisor of EMSPageSize, and >= 1024
// #define	EMSPageSize		16384
// #define	EMSPageSizeSeg	(EMSPageSize >> 4)
// #define	EMSPageSizeKB	(EMSPageSize >> 10)
// #define	EMSFrameCount	4
// #define	PMPageSize		4096
// #define	PMPageSizeSeg	(PMPageSize >> 4)
// #define	PMPageSizeKB	(PMPageSize >> 10)
// #define	PMEMSSubPage	(EMSPageSize / PMPageSize)
// 
// #define	PMMinMainMem	10			// Min acceptable # of pages from main
// #define	PMMaxMainMem	100			// Max number of pages in main memory
// 
// #define	PMThrashThreshold	1	// Number of page thrashes before panic mode
// #define	PMUnThrashThreshold	5	// Number of non-thrashing frames before leaving panic mode
// 
// typedef	enum
// 		{
// 			pml_Unlocked,
// 			pml_Locked
// 		} PMLockType;
// 
// typedef	enum
// 		{
// 			pmba_Unused = 0,
// 			pmba_Used = 1,
// 			pmba_Allocated = 2
// 		} PMBlockAttr;
// 
// typedef	struct
// 		{
// 			longword	offset;		// Offset of chunk into file
// 			word		length;		// Length of the chunk
// 
// 			int			xmsPage;	// If in XMS, (xmsPage * PMPageSize) gives offset into XMS handle
// 
// 			PMLockType	locked;		// If set, this page can't be purged
// 			int			emsPage;	// If in EMS, logical page/offset into page
// 			int			mainPage;	// If in Main, index into handle array
// 
// 			longword	lastHit;	// Last frame number of hit
// 		} PageListStruct;
// 
// typedef	struct
// 		{
// 			int			baseEMSPage;	// Base EMS page for this phys frame
// 			longword	lastHit;		// Last frame number of hit
// 		} EMSListStruct;
// 
// extern	boolean			XMSPresent,EMSPresent;
// extern	word			XMSPagesAvail,EMSPagesAvail;
// 
// extern	word			ChunksInFile,
// 						PMSpriteStart,PMSoundStart;
// extern	PageListStruct	far *PMPages;
// 
// #define	PM_GetSoundPage(v)	PM_GetPage(PMSoundStart + (v))
// #define	PM_GetSpritePage(v)	PM_GetPage(PMSpriteStart + (v))
// 
// #define	PM_LockMainMem()	PM_SetMainMemPurge(0)
// #define	PM_UnlockMainMem()	PM_SetMainMemPurge(3)
// 
// 
// extern	char	PageFileName[13];
// 
// 
// extern	void	PM_Startup(void),
// 				PM_Shutdown(void),
// 				PM_Reset(void),
// 				PM_Preload(boolean (*update)(word current,word total)),
// 				PM_NextFrame(void),
// 				PM_SetPageLock(int pagenum,PMLockType lock),
// 				PM_SetMainPurge(int level),
// 				PM_CheckMainMem(void);
// extern	memptr	PM_GetPageAddress(int pagenum),
// 				PM_GetPage(int pagenum);		// Use this one to cache page
// 
// void PM_SetMainMemPurge(int level);
// 
