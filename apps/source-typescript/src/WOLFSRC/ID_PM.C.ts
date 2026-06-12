//
//	ID_PM.C
//	Id Engine's Page Manager v1.0
//	Primary coder: Jason Blochowiak
//

/*
 * PORT MODEL NOTE (PORTING.md §6.3 / §11#4, same policy as ID_MM.C.ts):
 *
 * The page manager is a three-tier cache (main memory / EMS / XMS page
 * frames with LRU replacement and thrash-panic) over the VSWAP page file.
 * Which tier a page sits in — and all of the LRU/panic machinery — is
 * UNOBSERVABLE to game logic; the observable contract is:
 *
 *   - PML_OpenPageFile's parse of the VSWAP header (ported faithfully),
 *   - PM_GetPage(n) returns the address of page n's bytes, loading from
 *     the file on first use; Quits on sparse pages ("JDC: sparse page")
 *     and out-of-range requests, exactly like the original,
 *   - lock/purge bookkeeping entry points exist and validate like the
 *     original (PM_SetPageLock refuses non-sound pages),
 *   - PM_Preload walks unloaded pages and drives the progress callback.
 *
 * The model gives every page a main-memory frame (no EMS/XMS, no pressure,
 * so LRU eviction never fires — pages once loaded stay resident). The
 * EMS/XMS-specific routines are retained as documented no-ops so call
 * sites and T0 structure survive.
 */

import { ref, lvar } from "../runtime/dosmem";
import { peekw, peekul } from "../runtime/dosmem";
import { open, close, read } from "../runtime/dosfs";
import { O_RDONLY, O_BINARY } from "../runtime/dosfs";
import { MM_GetPtr, MM_FreePtr, MM_SetLock } from "./ID_MM.C";
import { CA_FarRead } from "./ID_CA.C";
import {
  PMPageSize,
  PMLockType,
  pml_Unlocked,
  type PageListStruct,
} from "./ID_PM.H";
import { Quit } from "./WL_MAIN.C";
import { lseek, SEEK_SET } from "../runtime/dosfs";

//	Main Mem specific variables
//	EMS specific variables
//	XMS specific variables
//	File specific variables
//	General usage variables

export const pm = {
  //	Main Mem specific variables
  // boolean MainPresent;
  MainPresent: false,
  // memptr MainMemPages[PMMaxMainMem];  (model: grows to ChunksInFile)
  MainMemPages: [] as number[],
  MainPagesAvail: 0,
  MainPagesUsed: 0,

  //	EMS specific variables — absent in the model
  EMSPresent: false,
  EMSPagesAvail: 0,
  EMSPagesUsed: 0,

  //	XMS specific variables — absent in the model
  XMSPresent: false,
  XMSPagesAvail: 0,
  XMSPagesUsed: 0,

  //	File specific variables
  // char PageFileName[13] = {"VSWAP."};
  PageFileName: "VSWAP.",
  // int PageFile = -1;
  PageFile: -1,
  // word ChunksInFile;
  ChunksInFile: 0,
  // word PMSpriteStart,PMSoundStart;
  PMSpriteStart: 0,
  PMSoundStart: 0,

  //	General usage variables
  // boolean PMStarted,PMPanicMode,PMThrashing;
  PMStarted: false,
  PMPanicMode: false,
  PMThrashing: 0,
  // word XMSPagesUsed, ... PMNumBlocks;
  PMNumBlocks: 0,
  // long PMFrameCount;
  PMFrameCount: 0,
  // PageListStruct far *PMPages;
  PMPages: [] as PageListStruct[],
};

//
//	PML_ReadFromFile() - Reads some data in from the page file
//
function PML_ReadFromFile(buf: number, offset: number, length: number): void {
  if (!buf) Quit("PML_ReadFromFile: Null pointer");
  if (!offset) Quit("PML_ReadFromFile: Zero offset");
  if (lseek(pm.PageFile, offset, SEEK_SET) !== offset)
    Quit("PML_ReadFromFile: Seek failed");
  if (!CA_FarRead(pm.PageFile, buf, length))
    Quit("PML_ReadFromFile: Read failed");
}

//
//	PML_OpenPageFile() - Opens the page file and sets up the page info
//
export function PML_OpenPageFile(): void {
  let i: number;
  let size: number;
  const buf = lvar(); // memptr buf;
  let page: PageListStruct;

  pm.PageFile = open(pm.PageFileName, O_RDONLY + O_BINARY);
  if (pm.PageFile === -1) Quit("PML_OpenPageFile: Unable to open page file");

  // Read in header variables
  read(pm.PageFile, ref(pm, "ChunksInFile"), 2 /* sizeof(ChunksInFile) */);
  read(pm.PageFile, ref(pm, "PMSpriteStart"), 2);
  read(pm.PageFile, ref(pm, "PMSoundStart"), 2);

  // Allocate and clear the page list
  pm.PMNumBlocks = pm.ChunksInFile;
  pm.PMPages = [];
  for (i = 0; i < pm.PMNumBlocks; i++)
    pm.PMPages.push({
      offset: 0,
      length: 0,
      xmsPage: -1,
      locked: pml_Unlocked,
      emsPage: -1,
      mainPage: -1,
      lastHit: 0,
    });

  // Read in the chunk offsets
  size = 4 /* sizeof(longword) */ * pm.ChunksInFile;
  MM_GetPtr(buf, size);
  if (!CA_FarRead(pm.PageFile, buf.get(), size))
    Quit("PML_OpenPageFile: Offset read failed");
  for (i = 0; i < pm.ChunksInFile; i++)
    pm.PMPages[i].offset = peekul(buf.get() + 4 * i);
  MM_FreePtr(buf);

  // Read in the chunk lengths
  size = 2 /* sizeof(word) */ * pm.ChunksInFile;
  MM_GetPtr(buf, size);
  if (!CA_FarRead(pm.PageFile, buf.get(), size))
    Quit("PML_OpenPageFile: Length read failed");
  for (i = 0; i < pm.ChunksInFile; i++)
    pm.PMPages[i].length = peekw(buf.get() + 2 * i);
  MM_FreePtr(buf);
}

//
//  PML_ClosePageFile() - Closes the page file
//
export function PML_ClosePageFile(): void {
  if (pm.PageFile !== -1) close(pm.PageFile);
}

//
//	PM_GetPageAddress() - Returns the address of a given page
//		Maps in EMS if necessary
//		Returns nil if block isn't cached into Main Memory or EMS
//
export function PM_GetPageAddress(pagenum: number): number {
  const page = pm.PMPages[pagenum];
  if (page.mainPage !== -1) return pm.MainMemPages[page.mainPage];
  // (EMS branch — absent in the model)
  else return 0; // nil
}

//
//	PML_GetAPageBuffer() - A page buffer is needed. (Model: main memory is
//		never exhausted, so the LRU/transfer path never runs.)
//
function PML_GetAPageBuffer(pagenum: number, _mainonly: boolean): number {
  const page = pm.PMPages[pagenum];

  // There's remaining main memory - use it (always true in the model)
  const cell = lvar();
  MM_GetPtr(cell, PMPageSize);
  MM_SetLock(cell, true);
  const n = pm.MainMemPages.length;
  pm.MainMemPages.push(cell.get());
  page.mainPage = n;
  pm.MainPagesUsed++;

  const addr = pm.MainMemPages[n];
  if (!addr) Quit("PML_GetPageBuffer: Search failed");
  return addr;
}

//
//	PML_LoadPage() - A page is not in main/EMS memory, and it's not in XMS.
//		Load it into either main or EMS.
//
function PML_LoadPage(pagenum: number, mainonly: boolean): void {
  const addr = PML_GetAPageBuffer(pagenum, mainonly);
  const page = pm.PMPages[pagenum];
  PML_ReadFromFile(addr, page.offset, page.length);
}

//
//	PM_GetPage() - Returns the address of the page, loading it if necessary
//		First, check if in Main Memory or EMS
//		Then, check XMS
//		If not in XMS, load into Main Memory or EMS
//
export function PM_GetPage(pagenum: number): number {
  let result: number;

  if (pagenum >= pm.ChunksInFile) Quit("PM_GetPage: Invalid page request");

  if (!(result = PM_GetPageAddress(pagenum))) {
    const mainonly = pagenum >= pm.PMSoundStart;
    if (!pm.PMPages[pagenum].offset)
      // JDC: sparse page
      Quit("Tried to load a sparse page!");
    // (XMS retrieval — absent in the model)
    {
      if (pm.PMPages[pagenum].lastHit === pm.PMFrameCount) pm.PMThrashing++;

      PML_LoadPage(pagenum, mainonly);
      result = PM_GetPageAddress(pagenum);
    }
  }
  pm.PMPages[pagenum].lastHit = pm.PMFrameCount;

  return result;
}

//
//	PM_SetPageLock() - Sets the lock type on a given page
//		pml_Unlocked: Normal, page can be purged
//		pml_Locked: Cannot be purged
//
export function PM_SetPageLock(pagenum: number, lock: PMLockType): void {
  if (pagenum < pm.PMSoundStart)
    Quit("PM_SetPageLock: Locking/unlocking non-sound page");

  pm.PMPages[pagenum].locked = lock;
}

//
//	PM_Preload() - Loads as many pages as possible into all types of memory.
//		Calls the update function after each load, indicating the current
//		page, and the total pages that need to be loaded (for thermometer).
//
export function PM_Preload(
  update: (current: number, total: number) => boolean,
): void {
  let page: number;
  let current: number, total: number, maintotal: number;

  let mainfree = pm.ChunksInFile; // model: every page fits in "main"

  maintotal = 0;

  for (let i = 0; i < pm.ChunksInFile; i++) {
    if (!pm.PMPages[i].offset) continue; // sparse

    if (pm.PMPages[i].emsPage !== -1 || pm.PMPages[i].mainPage !== -1)
      continue; // already in main mem

    if (mainfree) {
      maintotal++;
      mainfree--;
    }
  }

  total = maintotal;

  if (!total) return;

  page = 0;
  current = 0;

  //
  // cache main/ems blocks
  //
  while (maintotal) {
    while (
      !pm.PMPages[page].offset ||
      pm.PMPages[page].mainPage !== -1 ||
      pm.PMPages[page].emsPage !== -1
    )
      page++;

    if (page >= pm.ChunksInFile) Quit("PM_Preload: Pages>=ChunksInFile");

    PM_GetPage(page);

    page++;
    current++;
    maintotal--;
    update(current, total);
  }

  // (XMS staging loop — absent in the model)

  update(total, total);
}

//
//	PM_NextFrame() - Increments the frame counter and adjusts the thrash
//		avoidence variables (model: panic mode never engages — no pressure)
//
export function PM_NextFrame(): void {
  pm.PMThrashing = 0;
  pm.PMFrameCount++;
}

//
//	PM_Reset() - Sets up release version dynamic allocation
//
export function PM_Reset(): void {
  pm.XMSPagesUsed = 0;
  pm.EMSPagesUsed = 0;
  pm.MainPagesUsed = 0;

  pm.PMPanicMode = false;

  // Initialize page list
  for (let i = 0; i < pm.PMNumBlocks; i++) {
    const page = pm.PMPages[i];
    page.mainPage = -1;
    page.emsPage = -1;
    page.xmsPage = -1;
    page.locked = pml_Unlocked;
  }
  pm.MainMemPages = [];
}

//
//	PM_Startup() - Start up the Page Mgr
//
export function PM_Startup(): void {
  if (pm.PMStarted) return;

  PML_OpenPageFile();

  // model: main memory only — EMS/XMS detection elided, frames unlimited
  pm.MainPresent = true;
  pm.MainPagesAvail = pm.ChunksInFile;

  PM_Reset();

  pm.PMStarted = true;
  pm.PMFrameCount = 0;
  pm.PMPanicMode = false;
}

//
//	PM_Shutdown() - Shut down the Page Mgr
//
export function PM_Shutdown(): void {
  if (!pm.PMStarted) return;

  PML_ClosePageFile();
  pm.PMStarted = false;
  pm.PMPages = [];
  pm.MainMemPages = [];
}

//
//	PM_SetMainMemPurge / PM_CheckMainMem — main-memory purge management.
//	Model no-ops: the model's page frames are MM blocks that never come
//	under pressure, so purge level changes have no observable effect.
//
export function PM_SetMainMemPurge(_level: number): void {}
export function PM_SetMainPurge(_level: number): void {}
export function PM_CheckMainMem(): void {}

//===========================================================================
//
// Header macros carried as functions (they touch ID_PM state):
//

// #define PM_GetSoundPage(v)  PM_GetPage(PMSoundStart + (v))
export function PM_GetSoundPage(v: number): number {
  return PM_GetPage(pm.PMSoundStart + v);
}
// #define PM_GetSpritePage(v) PM_GetPage(PMSpriteStart + (v))
export function PM_GetSpritePage(v: number): number {
  return PM_GetPage(pm.PMSpriteStart + v);
}
// #define PM_LockMainMem()    PM_SetMainMemPurge(0)
export function PM_LockMainMem(): void {
  PM_SetMainMemPurge(0);
}
// #define PM_UnlockMainMem()  PM_SetMainMemPurge(3)
export function PM_UnlockMainMem(): void {
  PM_SetMainMemPurge(3);
}
