//
//	ID_PM.H
//	Header file for Id Engine's Page Manager
//

//	NOTE! PMPageSize must be an even divisor of EMSPageSize, and >= 1024
export const EMSPageSize = 16384;
export const EMSPageSizeSeg = EMSPageSize >> 4;
export const EMSPageSizeKB = EMSPageSize >> 10;
export const EMSFrameCount = 4;
export const PMPageSize = 4096;
export const PMPageSizeSeg = PMPageSize >> 4;
export const PMPageSizeKB = PMPageSize >> 10;
export const PMEMSSubPage = EMSPageSize / PMPageSize;

export const PMMinMainMem = 10; // Min acceptable # of pages from main
export const PMMaxMainMem = 100; // Max number of pages in main memory

export const PMThrashThreshold = 1; // Number of page thrashes before panic mode
export const PMUnThrashThreshold = 5; // Number of non-thrashing frames before leaving panic mode

export enum PMLockType {
  pml_Unlocked,
  pml_Locked,
}
export const { pml_Unlocked, pml_Locked } = PMLockType;

export enum PMBlockAttr {
  pmba_Unused = 0,
  pmba_Used = 1,
  pmba_Allocated = 2,
}
export const { pmba_Unused, pmba_Used, pmba_Allocated } = PMBlockAttr;

/**
 * PageListStruct — modeled as a TS object (never serialized; the page cache
 * bookkeeping has no observable layout). Field meanings preserved.
 */
export interface PageListStruct {
  offset: number; // longword: Offset of chunk into file
  length: number; // word: Length of the chunk

  xmsPage: number; // If in XMS, (xmsPage * PMPageSize) gives offset into XMS handle

  locked: PMLockType; // If set, this page can't be purged
  emsPage: number; // If in EMS, logical page/offset into page
  mainPage: number; // If in Main, index into handle array

  lastHit: number; // longword: Last frame number of hit
}

// The externs (XMSPresent, EMSPresent, ChunksInFile, PMSpriteStart,
// PMSoundStart, PMPages, PageFileName, ...) are defined by ID_PM.C.ts on its
// exported `pm` state record (PORTING.md §11#1).

// #define PM_GetSoundPage(v)  PM_GetPage(PMSoundStart + (v))
// #define PM_GetSpritePage(v) PM_GetPage(PMSpriteStart + (v))
// #define PM_LockMainMem()    PM_SetMainMemPurge(0)
// #define PM_UnlockMainMem()  PM_SetMainMemPurge(3)
// (ported as functions in ID_PM.C.ts — they touch ID_PM state)
