//
//	ID_PM.H
//	Header file for Id Engine's Page Manager
//

//	NOTE! PMPageSize must be an even divisor of EMSPageSize, and >= 1024
export const EMSPageSize = 16384;
export const EMSPageSizeSeg = (EMSPageSize >> 4);
export const EMSPageSizeKB = (EMSPageSize >> 10);
export const EMSFrameCount = 4;
export const PMPageSize = 4096;
export const PMPageSizeSeg = (PMPageSize >> 4);
export const PMPageSizeKB = (PMPageSize >> 10);
export const PMEMSSubPage = (EMSPageSize / PMPageSize);

export const PMMinMainMem = 10;			// Min acceptable # of pages from main
export const PMMaxMainMem = 100;			// Max number of pages in main memory

export const PMThrashThreshold = 1;	// Number of page thrashes before panic mode
export const PMUnThrashThreshold = 5;	// Number of non-thrashing frames before leaving panic mode

export enum PMLockType
		{
			pml_Unlocked,
			pml_Locked
		}

export enum PMBlockAttr
		{
			pmba_Unused = 0,
			pmba_Used = 1,
			pmba_Allocated = 2
		}

export interface PageListStruct
		{
			offset: longword;		// Offset of chunk into file
			length: word;		// Length of the chunk

			xmsPage: number;	// If in XMS, (xmsPage * PMPageSize) gives offset into XMS handle

			locked: PMLockType;		// If set, this page can't be purged
			emsPage: number;	// If in EMS, logical page/offset into page
			mainPage: number;	// If in Main, index into handle array

			lastHit: longword;	// Last frame number of hit
		}

export interface EMSListStruct
		{
			baseEMSPage: number;	// Base EMS page for this phys frame
			lastHit: longword;		// Last frame number of hit
		}

// extern	boolean			XMSPresent,EMSPresent;
// extern	word			XMSPagesAvail,EMSPagesAvail;

// extern	word			ChunksInFile,
// 						PMSpriteStart,PMSoundStart;
// extern	PageListStruct	far *PMPages;

export function PM_GetSoundPage(v: number): memptr
{
	return pmRuntimeBindings.PM_GetPage(pmRuntimeBindings.PMSoundStart + (v));
}

export function PM_GetSpritePage(v: number): memptr
{
	return pmRuntimeBindings.PM_GetPage(pmRuntimeBindings.PMSpriteStart + (v));
}

export function PM_LockMainMem(): void
{
	return pmRuntimeBindings.PM_SetMainMemPurge(0);
}

export function PM_UnlockMainMem(): void
{
	return pmRuntimeBindings.PM_SetMainMemPurge(3);
}


// extern	char	PageFileName[13];


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

// void PM_SetMainMemPurge(int level);

type word = number;
type longword = number;
type memptr = unknown;

interface PMRuntimeBindings
{
	PMSoundStart: word;
	PMSpriteStart: word;
	PM_GetPage(pagenum: number): memptr;
	PM_SetMainMemPurge(level: number): void;
}

const pmRuntimeBindings = globalThis as unknown as PMRuntimeBindings;
