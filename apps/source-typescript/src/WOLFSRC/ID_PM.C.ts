import { US_CheckParm } from "./ID_US_1.C";
import {
  EMSFrameCount,
  EMSPageSizeKB,
  PMMaxMainMem,
  PMMinMainMem,
  PMPageSize,
  PMPageSizeKB,
  PMThrashThreshold,
  PMUnThrashThreshold,
  pml_Unlocked,
  pmba_Allocated,
  pmba_Used,
  type EMSListStruct,
  type PageListStruct,
  type PMLockType,
} from "./ID_PM.H";
import { readVswap, type VSwapFile } from "./TS_WL6_ASSETS";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_PM.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_PM.C";
export const WOLFSRC_FUNCTIONS = [
  "PM_CheckMainMem",
  "PM_GetPage",
  "PM_GetPageAddress",
  "PM_NextFrame",
  "PM_Preload",
  "PM_Reset",
  "PM_SetMainMemPurge",
  "PM_SetPageLock",
  "PM_Shutdown",
  "PM_Startup",
  "PML_ClosePageFile",
  "PML_CopyFromXMS",
  "PML_CopyToXMS",
  "PML_GetAPageBuffer",
  "PML_GetEMSAddress",
  "PML_GetPageFromXMS",
  "PML_GiveLRUPage",
  "PML_GiveLRUXMSPage",
  "PML_LoadPage",
  "PML_MapEMS",
  "PML_OpenPageFile",
  "PML_PutPageInXMS",
  "PML_ReadFromFile",
  "PML_ShutdownEMS",
  "PML_ShutdownMainMem",
  "PML_ShutdownXMS",
  "PML_StartupEMS",
  "PML_StartupMainMem",
  "PML_StartupXMS",
  "PML_TransferPageSpace",
  "PML_XMSCopy"
] as const;

const MAXLONG = 0x7fffffff;
const ParmStrings = ["nomain", "noems", "noxms", ""];

export interface PageManagerSummary {
  readonly started: boolean;
  readonly pageFileOpen: boolean;
  readonly chunksInFile: number;
  readonly spriteStart: number;
  readonly soundStart: number;
  readonly pmNumBlocks: number;
  readonly cachedPages: number;
  readonly mainPresent: boolean;
  readonly mainPagesAvail: number;
  readonly mainPagesUsed: number;
  readonly emsPresent: boolean;
  readonly emsPagesAvail: number;
  readonly emsPagesUsed: number;
  readonly xmsPresent: boolean;
  readonly xmsPagesAvail: number;
  readonly xmsPagesUsed: number;
  readonly frameCount: number;
  readonly panicMode: number;
  readonly thrashing: number;
  readonly mainPurgeLevel: number;
}

export interface PagePreloadSummary {
  readonly loaded: number;
  readonly total: number;
  readonly cachedPages: number;
  readonly mainPagesUsed: number;
}

export let MainPresent = false;
export const MainMemPages: Array<Uint8Array | null> = new Array(PMMaxMainMem).fill(null);
export const MainMemUsed = new Uint8Array(PMMaxMainMem);
export let MainPagesAvail = 0;

export let EMSPresent = false;
export let EMSAvail = 0;
export let EMSPagesAvail = 0;
export let EMSHandle = 0;
export let EMSPageFrame = 0;
export let EMSPhysicalPage = 0;
export const EMSList: EMSListStruct[] = Array.from({ length: EMSFrameCount }, () => ({
  baseEMSPage: -1,
  lastHit: 0,
}));

export let XMSPresent = false;
export let XMSAvail = 0;
export let XMSPagesAvail = 0;
export let XMSHandle = 0;
export let XMSDriver = 0;
export let XMSProtectPage = -1;

export let PageFileName = "VSWAP.";
export let PageFile = -1;
export let ChunksInFile = 0;
export let PMSpriteStart = 0;
export let PMSoundStart = 0;

export let PMStarted = false;
export let PMPanicMode = 0;
export let PMThrashing = 0;
export let XMSPagesUsed = 0;
export let EMSPagesUsed = 0;
export let MainPagesUsed = 0;
export let PMNumBlocks = 0;
export let PMFrameCount = 0;
export let PMPages: PageListStruct[] = [];
export let PMSegPages: PageListStruct[] = PMPages;

let configuredVswap: Uint8Array | null = null;
let pageFile: VSwapFile | null = null;
let mainPurgeLevel = 0;

function quit(message: string): never {
  throw new Error(message);
}

function cachedPageCount(): number {
  return PMPages.filter((page) => page.mainPage !== -1 || page.emsPage !== -1 || page.xmsPage !== -1).length;
}

function requirePageFile(): VSwapFile {
  if (!pageFile) {
    quit("Page manager has no open VSWAP page file");
  }
  return pageFile;
}

function validatePageNumber(pagenum: number): PageListStruct {
  if (!Number.isInteger(pagenum) || pagenum < 0 || pagenum >= ChunksInFile) {
    quit("PM_GetPage: Invalid page request");
  }
  return PMPages[pagenum];
}

function cloneBytes(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy;
}

function resetMainMemorySlots(): void {
  MainPagesUsed = 0;
  for (let i = 0; i < PMMaxMainMem; i++) {
    if (MainMemUsed[i] & pmba_Allocated) {
      MainMemPages[i] = new Uint8Array(PMPageSize);
      MainMemUsed[i] = pmba_Allocated;
    } else {
      MainMemPages[i] = null;
      MainMemUsed[i] = 0;
    }
  }
}

function assignMainPage(pagenum: number, mainonly: boolean): number {
  const page = validatePageNumber(pagenum);
  if (page.mainPage !== -1) {
    return page.mainPage;
  }

  for (let i = 0; i < PMMaxMainMem; i++) {
    if ((MainMemUsed[i] & pmba_Allocated) && !(MainMemUsed[i] & pmba_Used)) {
      MainMemUsed[i] |= pmba_Used;
      page.mainPage = i;
      MainPagesUsed++;
      return i;
    }
  }

  const lru = PML_GiveLRUPage(mainonly);
  const slot = PMPages[lru].mainPage;
  if (slot === -1) {
    quit("PML_GetPageBuffer: LRU page was not in main memory");
  }
  PML_TransferPageSpace(lru, pagenum);
  return slot;
}

function pageDataFor(pagenum: number): Uint8Array {
  const file = requirePageFile();
  validatePageNumber(pagenum);
  const chunk = file.chunks[pagenum];
  if (!chunk || PMPages[pagenum].offset < 0 || PMPages[pagenum].length <= 0) {
    quit("Tried to load a sparse page!");
  }
  return chunk;
}

export function PM_DebugState(): PageManagerSummary {
  return {
    started: PMStarted,
    pageFileOpen: PageFile !== -1 && pageFile !== null,
    chunksInFile: ChunksInFile,
    spriteStart: PMSpriteStart,
    soundStart: PMSoundStart,
    pmNumBlocks: PMNumBlocks,
    cachedPages: cachedPageCount(),
    mainPresent: MainPresent,
    mainPagesAvail: MainPagesAvail,
    mainPagesUsed: MainPagesUsed,
    emsPresent: EMSPresent,
    emsPagesAvail: EMSPagesAvail,
    emsPagesUsed: EMSPagesUsed,
    xmsPresent: XMSPresent,
    xmsPagesAvail: XMSPagesAvail,
    xmsPagesUsed: XMSPagesUsed,
    frameCount: PMFrameCount,
    panicMode: PMPanicMode,
    thrashing: PMThrashing,
    mainPurgeLevel,
  };
}

export function PM_SetVSwap(VSWAP: Uint8Array | null): PageManagerSummary {
  configuredVswap = VSWAP;
  if (!VSWAP) {
    PML_ClosePageFile();
    return PM_DebugState();
  }
  PML_OpenPageFile(VSWAP);
  return PM_DebugState();
}

export function PM_CheckMainMem(): PageManagerSummary {
  if (!MainPresent) {
    return PM_DebugState();
  }

  for (const page of PMPages) {
    const n = page.mainPage;
    if (n !== -1 && !MainMemPages[n]) {
      page.mainPage = -1;
      page.locked = pml_Unlocked;
      if (MainMemUsed[n] & pmba_Used) {
        MainMemUsed[n] &= ~pmba_Used;
        MainPagesUsed = Math.max(0, MainPagesUsed - 1);
      }
    }
  }

  for (let i = 0; i < PMMaxMainMem; i++) {
    if (!MainMemPages[i] && (MainMemUsed[i] & pmba_Allocated)) {
      MainMemPages[i] = new Uint8Array(PMPageSize);
    }
  }

  return PM_DebugState();
}

export function PM_GetPage(pagenum: number): Uint8Array {
  const page = validatePageNumber(pagenum);
  let result = PM_GetPageAddress(pagenum);

  if (!result) {
    const mainonly = pagenum >= PMSoundStart;
    if (page.offset <= 0) {
      quit("Tried to load a sparse page!");
    }
    result = PML_GetPageFromXMS(pagenum, mainonly);
    if (!result) {
      if (page.lastHit === PMFrameCount) {
        PMThrashing++;
      }
      PML_LoadPage(pagenum, mainonly);
      result = PM_GetPageAddress(pagenum);
    }
  }

  if (!result) {
    quit("PM_GetPage: Page load failed");
  }
  page.lastHit = PMFrameCount;
  return result;
}

export function PM_GetSoundPage(v: number): Uint8Array {
  return PM_GetPage(PMSoundStart + v);
}

export function PM_GetSpritePage(v: number): Uint8Array {
  return PM_GetPage(PMSpriteStart + v);
}

export function PM_GetPageAddress(pagenum: number): Uint8Array | null {
  const page = validatePageNumber(pagenum);
  if (page.mainPage !== -1) {
    return MainMemPages[page.mainPage];
  }
  if (page.emsPage !== -1) {
    return PML_GetEMSAddress(page.emsPage, page.locked);
  }
  return null;
}

export function PM_NextFrame(): PageManagerSummary {
  PMFrameCount++;
  if (PMFrameCount >= MAXLONG - 4) {
    for (const page of PMPages) {
      page.lastHit = 0;
    }
    PMFrameCount = 0;
  }

  if (PMPanicMode && !PMThrashing) {
    PMPanicMode--;
  }
  if (PMThrashing >= PMThrashThreshold) {
    PMPanicMode = PMUnThrashThreshold;
  }
  PMThrashing = 0;

  return PM_DebugState();
}

export function PM_Preload(
  update?: (current: number, total: number) => boolean | void,
): PagePreloadSummary {
  const candidates = PMPages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => page.offset > 0 && page.mainPage === -1 && page.emsPage === -1);
  const total = Math.min(candidates.length, Math.max(0, MainPagesAvail - MainPagesUsed));
  let loaded = 0;

  for (const { index } of candidates) {
    if (loaded >= total) {
      break;
    }
    PM_GetPage(index);
    loaded++;
    update?.(loaded, total);
  }
  if (total) {
    update?.(total, total);
  }

  return {
    loaded,
    total,
    cachedPages: cachedPageCount(),
    mainPagesUsed: MainPagesUsed,
  };
}

export function PM_Reset(): PageManagerSummary {
  XMSPagesAvail = Math.trunc(XMSAvail / PMPageSizeKB);
  EMSPagesAvail = EMSAvail * (EMSPageSizeKB / PMPageSizeKB);
  EMSPhysicalPage = 0;
  EMSPagesUsed = 0;
  XMSPagesUsed = 0;
  PMPanicMode = 0;
  PMThrashing = 0;

  resetMainMemorySlots();
  for (const page of PMPages) {
    page.mainPage = -1;
    page.emsPage = -1;
    page.xmsPage = -1;
    page.locked = pml_Unlocked;
    page.lastHit = 0;
  }

  return PM_DebugState();
}

export function PM_SetMainMemPurge(level: number): PageManagerSummary {
  mainPurgeLevel = level;
  return PM_DebugState();
}

export function PM_SetMainPurge(level: number): PageManagerSummary {
  return PM_SetMainMemPurge(level);
}

export function PM_LockMainMem(): PageManagerSummary {
  return PM_SetMainMemPurge(0);
}

export function PM_UnlockMainMem(): PageManagerSummary {
  return PM_SetMainMemPurge(3);
}

export function PM_SetPageLock(pagenum: number, lock: PMLockType): PageManagerSummary {
  if (pagenum < PMSoundStart) {
    quit("PM_SetPageLock: Locking/unlocking non-sound page");
  }
  validatePageNumber(pagenum).locked = lock;
  return PM_DebugState();
}

export function PM_Shutdown(): PageManagerSummary {
  PML_ShutdownXMS();
  PML_ShutdownEMS();

  if (PMStarted) {
    PML_ClosePageFile();
    PML_ShutdownMainMem();
  }

  PMStarted = false;
  PMPanicMode = 0;
  PMThrashing = 0;
  return PM_DebugState();
}

export function PM_Startup(
  VSWAP?: Uint8Array,
  argv: readonly string[] = ["wolf3d.exe"],
): PageManagerSummary {
  if (PMStarted) {
    return PM_DebugState();
  }

  let nomain = false;
  let noems = false;
  let noxms = false;
  for (let i = 1; i < argv.length; i++) {
    switch (US_CheckParm(argv[i], ParmStrings)) {
      case 0:
        nomain = true;
        break;
      case 1:
        noems = true;
        break;
      case 2:
        noxms = true;
        break;
    }
  }

  PML_OpenPageFile(VSWAP);

  if (!noems) {
    PML_StartupEMS();
  }
  if (!noxms) {
    PML_StartupXMS();
  }
  if (nomain && !EMSPresent) {
    quit("PM_Startup: No main or EMS");
  }
  PML_StartupMainMem();
  PM_Reset();

  PMStarted = true;
  return PM_DebugState();
}

export function PML_ClosePageFile(): PageManagerSummary {
  PageFile = -1;
  pageFile = null;
  ChunksInFile = 0;
  PMSpriteStart = 0;
  PMSoundStart = 0;
  PMNumBlocks = 0;
  PMPages = [];
  PMSegPages = PMPages;
  return PM_DebugState();
}

export function PML_CopyFromXMS(
  target: Uint8Array | null,
  sourcepage: number,
  length: number,
): void {
  PML_XMSCopy(false, target, sourcepage, length);
}

export function PML_CopyToXMS(
  source: Uint8Array | null,
  targetpage: number,
  length: number,
): void {
  PML_XMSCopy(true, source, targetpage, length);
}

export function PML_GetAPageBuffer(pagenum: number, mainonly = false): Uint8Array {
  const page = validatePageNumber(pagenum);
  const slot = assignMainPage(pagenum, mainonly);
  const buffer = new Uint8Array(Math.max(page.length, 1));
  MainMemPages[slot] = buffer;
  return buffer;
}

export function PML_GetEMSAddress(page: number, _lock: PMLockType = pml_Unlocked): Uint8Array | null {
  if (!EMSPresent) {
    return null;
  }
  const mapped = PMPages.find((candidate) => candidate.emsPage === page);
  if (!mapped) {
    quit("PML_GetEMSAddress: EMS find failed");
  }
  return mapped.mainPage === -1 ? null : MainMemPages[mapped.mainPage];
}

export function PML_GetPageFromXMS(pagenum: number, _mainonly = false): Uint8Array | null {
  validatePageNumber(pagenum);
  if (!XMSPresent || PMPages[pagenum].xmsPage === -1) {
    return null;
  }
  quit("PML_GetPageFromXMS: XMS page retrieval is unavailable in this runtime");
}

export function PML_GiveLRUPage(mainonly = false): number {
  let lru = -1;
  let last = MAXLONG;

  for (let i = 0; i < ChunksInFile; i++) {
    const page = PMPages[i];
    if (
      page.lastHit < last &&
      (page.emsPage !== -1 || page.mainPage !== -1) &&
      page.locked === pml_Unlocked &&
      (!mainonly || page.mainPage !== -1)
    ) {
      last = page.lastHit;
      lru = i;
    }
  }

  if (lru === -1) {
    quit("PML_GiveLRUPage: LRU Search failed");
  }
  return lru;
}

export function PML_GiveLRUXMSPage(): number {
  let lru = -1;
  let last = MAXLONG;

  for (let i = 0; i < ChunksInFile; i++) {
    const page = PMPages[i];
    if (page.xmsPage !== -1 && page.lastHit < last && i !== XMSProtectPage) {
      last = page.lastHit;
      lru = i;
    }
  }

  return lru;
}

export function PML_LoadPage(pagenum: number, mainonly = false): Uint8Array {
  const addr = PML_GetAPageBuffer(pagenum, mainonly);
  const data = pageDataFor(pagenum);
  addr.set(data);
  return addr;
}

export function PML_MapEMS(logical: number, physical: number): PageManagerSummary {
  if (logical < 0 || physical < 0) {
    quit("PML_MapEMS: Page mapping failed");
  }
  if (physical < EMSList.length) {
    EMSList[physical].baseEMSPage = logical;
    EMSList[physical].lastHit = PMFrameCount;
  }
  return PM_DebugState();
}

export function PML_OpenPageFile(VSWAP?: Uint8Array): PageManagerSummary {
  if (VSWAP) {
    configuredVswap = VSWAP;
  }
  if (!configuredVswap) {
    quit("PML_OpenPageFile: Unable to open page file");
  }

  pageFile = readVswap(configuredVswap);
  PageFile = 1;
  ChunksInFile = pageFile.ChunksInFile;
  PMSpriteStart = pageFile.PMSpriteStart;
  PMSoundStart = pageFile.PMSoundStart;
  PMNumBlocks = ChunksInFile;
  PMPages = pageFile.pageOffsets.map((offset, index) => ({
    offset,
    length: pageFile?.pageLengths[index] ?? 0,
    xmsPage: -1,
    locked: pml_Unlocked,
    emsPage: -1,
    mainPage: -1,
    lastHit: 0,
  }));
  PMSegPages = PMPages;
  return PM_DebugState();
}

export function PML_PutPageInXMS(pagenum: number): PageManagerSummary {
  validatePageNumber(pagenum);
  if (!XMSPresent) {
    return PM_DebugState();
  }
  quit("PML_PutPageInXMS: XMS storage is unavailable in this runtime");
}

export function PML_ReadFromFile(offset: number, length: number): Uint8Array {
  if (!offset) {
    quit("PML_ReadFromFile: Zero offset");
  }
  if (length < 0) {
    quit("PML_ReadFromFile: Read failed");
  }
  const file = requirePageFile();
  const index = file.pageOffsets.findIndex(
    (pageOffset, pageIndex) => pageOffset === offset && file.pageLengths[pageIndex] === length,
  );
  if (index !== -1) {
    const chunk = file.chunks[index];
    if (!chunk) {
      quit("PML_ReadFromFile: Read failed");
    }
    return cloneBytes(chunk);
  }
  if (!configuredVswap || offset < 0 || offset + length > configuredVswap.length) {
    quit("PML_ReadFromFile: Seek failed");
  }
  return cloneBytes(configuredVswap.subarray(offset, offset + length));
}

export function PML_ShutdownEMS(): PageManagerSummary {
  EMSPresent = false;
  EMSAvail = 0;
  EMSPagesAvail = 0;
  EMSPagesUsed = 0;
  EMSHandle = 0;
  EMSPageFrame = 0;
  EMSPhysicalPage = 0;
  for (const frame of EMSList) {
    frame.baseEMSPage = -1;
    frame.lastHit = 0;
  }
  return PM_DebugState();
}

export function PML_ShutdownMainMem(): PageManagerSummary {
  MainPresent = false;
  MainPagesAvail = 0;
  MainPagesUsed = 0;
  for (let i = 0; i < PMMaxMainMem; i++) {
    MainMemPages[i] = null;
    MainMemUsed[i] = 0;
  }
  return PM_DebugState();
}

export function PML_ShutdownXMS(): PageManagerSummary {
  XMSPresent = false;
  XMSAvail = 0;
  XMSPagesAvail = 0;
  XMSPagesUsed = 0;
  XMSHandle = 0;
  XMSDriver = 0;
  XMSProtectPage = -1;
  return PM_DebugState();
}

export function PML_StartupEMS(): boolean {
  EMSPresent = false;
  EMSAvail = 0;
  EMSPagesAvail = 0;
  return EMSPresent;
}

export function PML_StartupMainMem(): PageManagerSummary {
  MainPagesAvail = 0;
  MainPagesUsed = 0;
  for (let i = 0; i < PMMaxMainMem; i++) {
    MainMemPages[i] = new Uint8Array(PMPageSize);
    MainMemUsed[i] = pmba_Allocated;
    MainPagesAvail++;
  }
  if (MainPagesAvail < PMMinMainMem) {
    quit("PM_SetupMainMem: Not enough main memory");
  }
  MainPresent = true;
  return PM_DebugState();
}

export function PML_StartupXMS(): boolean {
  XMSPresent = false;
  XMSAvail = 0;
  XMSPagesAvail = 0;
  return XMSPresent;
}

export function PML_TransferPageSpace(orig: number, replacement: number): Uint8Array {
  if (orig === replacement) {
    quit("PML_TransferPageSpace: Identity replacement");
  }
  const origpage = validatePageNumber(orig);
  const newpage = validatePageNumber(replacement);
  if (origpage.locked !== pml_Unlocked) {
    quit("PML_TransferPageSpace: Killing locked page");
  }
  if (origpage.emsPage === -1 && origpage.mainPage === -1) {
    quit("PML_TransferPageSpace: Reusing non-existent page");
  }

  PML_PutPageInXMS(orig);
  const addr = PM_GetPageAddress(orig);
  newpage.emsPage = origpage.emsPage;
  newpage.mainPage = origpage.mainPage;
  origpage.mainPage = -1;
  origpage.emsPage = -1;

  if (!addr) {
    quit("PML_TransferPageSpace: Zero replacement");
  }
  return addr;
}

export function PML_XMSCopy(
  _toxms: boolean,
  addr: Uint8Array | null,
  _xmspage: number,
  length: number,
): void {
  if (!addr) {
    quit("PML_XMSCopy: zero address");
  }
  if (length < 0 || length > addr.length) {
    quit("PML_XMSCopy: Error on copy");
  }
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID_PM.C
// //	Id Engine's Page Manager v1.0
// //	Primary coder: Jason Blochowiak
// //
// 
// #include "ID_HEADS.H"
// #pragma hdrstop
// 
// //	Main Mem specific variables
// 	boolean			MainPresent;
// 	memptr			MainMemPages[PMMaxMainMem];
// 	PMBlockAttr		MainMemUsed[PMMaxMainMem];
// 	int				MainPagesAvail;
// 
// //	EMS specific variables
// 	boolean			EMSPresent;
// 	word			EMSAvail,EMSPagesAvail,EMSHandle,
// 					EMSPageFrame,EMSPhysicalPage;
// 	EMSListStruct	EMSList[EMSFrameCount];
// 
// //	XMS specific variables
// 	boolean			XMSPresent;
// 	word			XMSAvail,XMSPagesAvail,XMSHandle;
// 	longword		XMSDriver;
// 	int				XMSProtectPage = -1;
// 
// //	File specific variables
// 	char			PageFileName[13] = {"VSWAP."};
// 	int				PageFile = -1;
// 	word			ChunksInFile;
// 	word			PMSpriteStart,PMSoundStart;
// 
// //	General usage variables
// 	boolean			PMStarted,
// 					PMPanicMode,
// 					PMThrashing;
// 	word			XMSPagesUsed,
// 					EMSPagesUsed,
// 					MainPagesUsed,
// 					PMNumBlocks;
// 	long			PMFrameCount;
// 	PageListStruct	far *PMPages,
// 					_seg *PMSegPages;
// 
// static	char		*ParmStrings[] = {"nomain","noems","noxms",nil};
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	EMS Management code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PML_MapEMS() - Maps a logical page to a physical page
// //
// void
// PML_MapEMS(word logical,word physical)
// {
// 	_AL = physical;
// 	_BX = logical;
// 	_DX = EMSHandle;
// 	_AH = EMS_MAPPAGE;
// asm	int	EMS_INT
// 
// 	if (_AH)
// 		Quit("PML_MapEMS: Page mapping failed");
// }
// 
// //
// //	PML_StartupEMS() - Sets up EMS for Page Mgr's use
// //		Checks to see if EMS driver is present
// //      Verifies that EMS hardware is present
// //		Make sure that EMS version is 3.2 or later
// //		If there's more than our minimum (2 pages) available, allocate it (up
// //			to the maximum we need)
// //
// 
// 	char	EMMDriverName[9] = "EMMXXXX0";
// 
// boolean
// PML_StartupEMS(void)
// {
// 	int		i;
// 	long	size;
// 
// 	EMSPresent = false;			// Assume that we'll fail
// 	EMSAvail = 0;
// 
// 	_DX = (word)EMMDriverName;
// 	_AX = 0x3d00;
// 	geninterrupt(0x21);			// try to open EMMXXXX0 device
// asm	jnc	gothandle
// 	goto error;
// 
// gothandle:
// 	_BX = _AX;
// 	_AX = 0x4400;
// 	geninterrupt(0x21);			// get device info
// asm	jnc	gotinfo;
// 	goto error;
// 
// gotinfo:
// asm	and	dx,0x80
// 	if (!_DX)
// 		goto error;
// 
// 	_AX = 0x4407;
// 	geninterrupt(0x21);			// get status
// asm	jc	error
// 	if (!_AL)
// 		goto error;
// 
// 	_AH = 0x3e;
// 	geninterrupt(0x21);			// close handle
// 
// 	_AH = EMS_STATUS;
// 	geninterrupt(EMS_INT);
// 	if (_AH)
// 		goto error;				// make sure EMS hardware is present
// 
// 	_AH = EMS_VERSION;
// 	geninterrupt(EMS_INT);
// 	if (_AH || (_AL < 0x32))	// only work on EMS 3.2 or greater (silly, but...)
// 		goto error;
// 
// 	_AH = EMS_GETFRAME;
// 	geninterrupt(EMS_INT);
// 	if (_AH)
// 		goto error;				// find the page frame address
// 	EMSPageFrame = _BX;
// 
// 	_AH = EMS_GETPAGES;
// 	geninterrupt(EMS_INT);
// 	if (_AH)
// 		goto error;
// 	if (_BX < 2)
// 		goto error;         	// Require at least 2 pages (32k)
// 	EMSAvail = _BX;
// 
// 	// Don't hog all available EMS
// 	size = EMSAvail * (long)EMSPageSize;
// 	if (size - (EMSPageSize * 2) > (ChunksInFile * (long)PMPageSize))
// 	{
// 		size = (ChunksInFile * (long)PMPageSize) + EMSPageSize;
// 		EMSAvail = size / EMSPageSize;
// 	}
// 
// 	_AH = EMS_ALLOCPAGES;
// 	_BX = EMSAvail;
// 	geninterrupt(EMS_INT);
// 	if (_AH)
// 		goto error;
// 	EMSHandle = _DX;
// 
// 	mminfo.EMSmem += EMSAvail * (long)EMSPageSize;
// 
// 	// Initialize EMS mapping cache
// 	for (i = 0;i < EMSFrameCount;i++)
// 		EMSList[i].baseEMSPage = -1;
// 
// 	EMSPresent = true;			// We have EMS
// 
// error:
// 	return(EMSPresent);
// }
// 
// //
// //	PML_ShutdownEMS() - If EMS was used, deallocate it
// //
// void
// PML_ShutdownEMS(void)
// {
// 	if (EMSPresent)
// 	{
// 	asm	mov	ah,EMS_FREEPAGES
// 	asm	mov	dx,[EMSHandle]
// 	asm	int	EMS_INT
// 		if (_AH)
// 			Quit ("PML_ShutdownEMS: Error freeing EMS");
// 	}
// }
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	XMS Management code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PML_StartupXMS() - Starts up XMS for the Page Mgr's use
// //		Checks for presence of an XMS driver
// //		Makes sure that there's at least a page of XMS available
// //		Allocates any remaining XMS (rounded down to the nearest page size)
// //
// boolean
// PML_StartupXMS(void)
// {
// 	XMSPresent = false;					// Assume failure
// 	XMSAvail = 0;
// 
// asm	mov	ax,0x4300
// asm	int	XMS_INT         				// Check for presence of XMS driver
// 	if (_AL != 0x80)
// 		goto error;
// 
// 
// asm	mov	ax,0x4310
// asm	int	XMS_INT							// Get address of XMS driver
// asm	mov	[WORD PTR XMSDriver],bx
// asm	mov	[WORD PTR XMSDriver+2],es		// function pointer to XMS driver
// 
// 	XMS_CALL(XMS_QUERYFREE);			// Find out how much XMS is available
// 	XMSAvail = _AX;
// 	if (!_AX)				// AJR: bugfix 10/8/92
// 		goto error;
// 
// 	XMSAvail &= ~(PMPageSizeKB - 1);	// Round off to nearest page size
// 	if (XMSAvail < (PMPageSizeKB * 2))	// Need at least 2 pages
// 		goto error;
// 
// 	_DX = XMSAvail;
// 	XMS_CALL(XMS_ALLOC);				// And do the allocation
// 	XMSHandle = _DX;
// 
// 	if (!_AX)				// AJR: bugfix 10/8/92
// 	{
// 		XMSAvail = 0;
// 		goto error;
// 	}
// 
// 	mminfo.XMSmem += XMSAvail * 1024;
// 
// 	XMSPresent = true;
// error:
// 	return(XMSPresent);
// }
// 
// //
// //	PML_XMSCopy() - Copies a main/EMS page to or from XMS
// //		Will round an odd-length request up to the next even value
// //
// void
// PML_XMSCopy(boolean toxms,byte far *addr,word xmspage,word length)
// {
// 	longword	xoffset;
// 	struct
// 	{
// 		longword	length;
// 		word		source_handle;
// 		longword	source_offset;
// 		word		target_handle;
// 		longword	target_offset;
// 	} copy;
// 
// 	if (!addr)
// 		Quit("PML_XMSCopy: zero address");
// 
// 	xoffset = (longword)xmspage * PMPageSize;
// 
// 	copy.length = (length + 1) & ~1;
// 	copy.source_handle = toxms? 0 : XMSHandle;
// 	copy.source_offset = toxms? (long)addr : xoffset;
// 	copy.target_handle = toxms? XMSHandle : 0;
// 	copy.target_offset = toxms? xoffset : (long)addr;
// 
// asm	push si
// 	_SI = (word)&copy;
// 	XMS_CALL(XMS_MOVE);
// asm	pop	si
// 	if (!_AX)
// 		Quit("PML_XMSCopy: Error on copy");
// }
// 
// #if 1
// #define	PML_CopyToXMS(s,t,l)	PML_XMSCopy(true,(s),(t),(l))
// #define	PML_CopyFromXMS(t,s,l)	PML_XMSCopy(false,(t),(s),(l))
// #else
// //
// //	PML_CopyToXMS() - Copies the specified number of bytes from the real mode
// //		segment address to the specified XMS page
// //
// void
// PML_CopyToXMS(byte far *source,int targetpage,word length)
// {
// 	PML_XMSCopy(true,source,targetpage,length);
// }
// 
// //
// //	PML_CopyFromXMS() - Copies the specified number of bytes from an XMS
// //		page to the specified real mode address
// //
// void
// PML_CopyFromXMS(byte far *target,int sourcepage,word length)
// {
// 	PML_XMSCopy(false,target,sourcepage,length);
// }
// #endif
// 
// //
// //	PML_ShutdownXMS()
// //
// void
// PML_ShutdownXMS(void)
// {
// 	if (XMSPresent)
// 	{
// 		_DX = XMSHandle;
// 		XMS_CALL(XMS_FREE);
// 		if (_BL)
// 			Quit("PML_ShutdownXMS: Error freeing XMS");
// 	}
// }
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	Main memory code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PM_SetMainMemPurge() - Sets the purge level for all allocated main memory
// //		blocks. This shouldn't be called directly - the PM_LockMainMem() and
// //		PM_UnlockMainMem() macros should be used instead.
// //
// void
// PM_SetMainMemPurge(int level)
// {
// 	int	i;
// 
// 	for (i = 0;i < PMMaxMainMem;i++)
// 		if (MainMemPages[i])
// 			MM_SetPurge(&MainMemPages[i],level);
// }
// 
// //
// //	PM_CheckMainMem() - If something besides the Page Mgr makes requests of
// //		the Memory Mgr, some of the Page Mgr's blocks may have been purged,
// //		so this function runs through the block list and checks to see if
// //		any of the blocks have been purged. If so, it marks the corresponding
// //		page as purged & unlocked, then goes through the block list and
// //		tries to reallocate any blocks that have been purged.
// //	This routine now calls PM_LockMainMem() to make sure that any allocation
// //		attempts made during the block reallocation sweep don't purge any
// //		of the other blocks. Because PM_LockMainMem() is called,
// //		PM_UnlockMainMem() needs to be called before any other part of the
// //		program makes allocation requests of the Memory Mgr.
// //
// void
// PM_CheckMainMem(void)
// {
// 	boolean			allocfailed;
// 	int				i,n;
// 	memptr			*p;
// 	PMBlockAttr		*used;
// 	PageListStruct	far *page;
// 
// 	if (!MainPresent)
// 		return;
// 
// 	for (i = 0,page = PMPages;i < ChunksInFile;i++,page++)
// 	{
// 		n = page->mainPage;
// 		if (n != -1)						// Is the page using main memory?
// 		{
// 			if (!MainMemPages[n])			// Yep, was the block purged?
// 			{
// 				page->mainPage = -1;		// Yes, mark page as purged & unlocked
// 				page->locked = pml_Unlocked;
// 			}
// 		}
// 	}
// 
// 	// Prevent allocation attempts from purging any of our other blocks
// 	PM_LockMainMem();
// 	allocfailed = false;
// 	for (i = 0,p = MainMemPages,used = MainMemUsed;i < PMMaxMainMem;i++,p++,used++)
// 	{
// 		if (!*p)							// If the page got purged
// 		{
// 			if (*used & pmba_Allocated)		// If it was allocated
// 			{
// 				*used &= ~pmba_Allocated;	// Mark as unallocated
// 				MainPagesAvail--;			// and decrease available count
// 			}
// 
// 			if (*used & pmba_Used)			// If it was used
// 			{
// 				*used &= ~pmba_Used;		// Mark as unused
// 				MainPagesUsed--;			// and decrease used count
// 			}
// 
// 			if (!allocfailed)
// 			{
// 				MM_BombOnError(false);
// 				MM_GetPtr(p,PMPageSize);		// Try to reallocate
// 				if (mmerror)					// If it failed,
// 					allocfailed = true;			//  don't try any more allocations
// 				else							// If it worked,
// 				{
// 					*used |= pmba_Allocated;	// Mark as allocated
// 					MainPagesAvail++;			// and increase available count
// 				}
// 				MM_BombOnError(true);
// 			}
// 		}
// 	}
// 	if (mmerror)
// 		mmerror = false;
// }
// 
// //
// //	PML_StartupMainMem() - Allocates as much main memory as is possible for
// //		the Page Mgr. The memory is allocated as non-purgeable, so if it's
// //		necessary to make requests of the Memory Mgr, PM_UnlockMainMem()
// //		needs to be called.
// //
// void
// PML_StartupMainMem(void)
// {
// 	int		i,n;
// 	memptr	*p;
// 
// 	MainPagesAvail = 0;
// 	MM_BombOnError(false);
// 	for (i = 0,p = MainMemPages;i < PMMaxMainMem;i++,p++)
// 	{
// 		MM_GetPtr(p,PMPageSize);
// 		if (mmerror)
// 			break;
// 
// 		MainPagesAvail++;
// 		MainMemUsed[i] = pmba_Allocated;
// 	}
// 	MM_BombOnError(true);
// 	if (mmerror)
// 		mmerror = false;
// 	if (MainPagesAvail < PMMinMainMem)
// 		Quit("PM_SetupMainMem: Not enough main memory");
// 	MainPresent = true;
// }
// 
// //
// //	PML_ShutdownMainMem() - Frees all of the main memory blocks used by the
// //		Page Mgr.
// //
// void
// PML_ShutdownMainMem(void)
// {
// 	int		i;
// 	memptr	*p;
// 
// 	// DEBUG - mark pages as unallocated & decrease page count as appropriate
// 	for (i = 0,p = MainMemPages;i < PMMaxMainMem;i++,p++)
// 		if (*p)
// 			MM_FreePtr(p);
// }
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	File management code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PML_ReadFromFile() - Reads some data in from the page file
// //
// void
// PML_ReadFromFile(byte far *buf,long offset,word length)
// {
// 	if (!buf)
// 		Quit("PML_ReadFromFile: Null pointer");
// 	if (!offset)
// 		Quit("PML_ReadFromFile: Zero offset");
// 	if (lseek(PageFile,offset,SEEK_SET) != offset)
// 		Quit("PML_ReadFromFile: Seek failed");
// 	if (!CA_FarRead(PageFile,buf,length))
// 		Quit("PML_ReadFromFile: Read failed");
// }
// 
// //
// //	PML_OpenPageFile() - Opens the page file and sets up the page info
// //
// void
// PML_OpenPageFile(void)
// {
// 	int				i;
// 	long			size;
// 	void			_seg *buf;
// 	longword		far *offsetptr;
// 	word			far *lengthptr;
// 	PageListStruct	far *page;
// 
// 	PageFile = open(PageFileName,O_RDONLY + O_BINARY);
// 	if (PageFile == -1)
// 		Quit("PML_OpenPageFile: Unable to open page file");
// 
// 	// Read in header variables
// 	read(PageFile,&ChunksInFile,sizeof(ChunksInFile));
// 	read(PageFile,&PMSpriteStart,sizeof(PMSpriteStart));
// 	read(PageFile,&PMSoundStart,sizeof(PMSoundStart));
// 
// 	// Allocate and clear the page list
// 	PMNumBlocks = ChunksInFile;
// 	MM_GetPtr(&(memptr)PMSegPages,sizeof(PageListStruct) * PMNumBlocks);
// 	MM_SetLock(&(memptr)PMSegPages,true);
// 	PMPages = (PageListStruct far *)PMSegPages;
// 	_fmemset(PMPages,0,sizeof(PageListStruct) * PMNumBlocks);
// 
// 	// Read in the chunk offsets
// 	size = sizeof(longword) * ChunksInFile;
// 	MM_GetPtr(&buf,size);
// 	if (!CA_FarRead(PageFile,(byte far *)buf,size))
// 		Quit("PML_OpenPageFile: Offset read failed");
// 	offsetptr = (longword far *)buf;
// 	for (i = 0,page = PMPages;i < ChunksInFile;i++,page++)
// 		page->offset = *offsetptr++;
// 	MM_FreePtr(&buf);
// 
// 	// Read in the chunk lengths
// 	size = sizeof(word) * ChunksInFile;
// 	MM_GetPtr(&buf,size);
// 	if (!CA_FarRead(PageFile,(byte far *)buf,size))
// 		Quit("PML_OpenPageFile: Length read failed");
// 	lengthptr = (word far *)buf;
// 	for (i = 0,page = PMPages;i < ChunksInFile;i++,page++)
// 		page->length = *lengthptr++;
// 	MM_FreePtr(&buf);
// }
// 
// //
// //  PML_ClosePageFile() - Closes the page file
// //
// void
// PML_ClosePageFile(void)
// {
// 	if (PageFile != -1)
// 		close(PageFile);
// 	if (PMSegPages)
// 	{
// 		MM_SetLock(&(memptr)PMSegPages,false);
// 		MM_FreePtr(&(void _seg *)PMSegPages);
// 	}
// }
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	Allocation, etc., code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PML_GetEMSAddress()
// //
// // 		Page is in EMS, so figure out which EMS physical page should be used
// //  		to map our page in. If normal page, use EMS physical page 3, else
// //  		use the physical page specified by the lock type
// //
// #if 1
// #pragma argsused	// DEBUG - remove lock parameter
// memptr
// PML_GetEMSAddress(int page,PMLockType lock)
// {
// 	int		i,emspage;
// 	word	emsoff,emsbase,offset;
// 
// 	emsoff = page & (PMEMSSubPage - 1);
// 	emsbase = page - emsoff;
// 
// 	emspage = -1;
// 	// See if this page is already mapped in
// 	for (i = 0;i < EMSFrameCount;i++)
// 	{
// 		if (EMSList[i].baseEMSPage == emsbase)
// 		{
// 			emspage = i;	// Yep - don't do a redundant remapping
// 			break;
// 		}
// 	}
// 
// 	// If page isn't already mapped in, find LRU EMS frame, and use it
// 	if (emspage == -1)
// 	{
// 		longword last = MAXLONG;
// 		for (i = 0;i < EMSFrameCount;i++)
// 		{
// 			if (EMSList[i].lastHit < last)
// 			{
// 				emspage = i;
// 				last = EMSList[i].lastHit;
// 			}
// 		}
// 
// 		EMSList[emspage].baseEMSPage = emsbase;
// 		PML_MapEMS(page / PMEMSSubPage,emspage);
// 	}
// 
// 	if (emspage == -1)
// 		Quit("PML_GetEMSAddress: EMS find failed");
// 
// 	EMSList[emspage].lastHit = PMFrameCount;
// 	offset = emspage * EMSPageSizeSeg;
// 	offset += emsoff * PMPageSizeSeg;
// 	return((memptr)(EMSPageFrame + offset));
// }
// #else
// memptr
// PML_GetEMSAddress(int page,PMLockType lock)
// {
// 	word	emspage;
// 
// 	emspage = (lock < pml_EMSLock)? 3 : (lock - pml_EMSLock);
// 
// 	PML_MapEMS(page / PMEMSSubPage,emspage);
// 
// 	return((memptr)(EMSPageFrame + (emspage * EMSPageSizeSeg)
// 			+ ((page & (PMEMSSubPage - 1)) * PMPageSizeSeg)));
// }
// #endif
// 
// //
// //	PM_GetPageAddress() - Returns the address of a given page
// //		Maps in EMS if necessary
// //		Returns nil if block isn't cached into Main Memory or EMS
// //
// //
// memptr
// PM_GetPageAddress(int pagenum)
// {
// 	PageListStruct	far *page;
// 
// 	page = &PMPages[pagenum];
// 	if (page->mainPage != -1)
// 		return(MainMemPages[page->mainPage]);
// 	else if (page->emsPage != -1)
// 		return(PML_GetEMSAddress(page->emsPage,page->locked));
// 	else
// 		return(nil);
// }
// 
// //
// //	PML_GiveLRUPage() - Returns the page # of the least recently used
// //		present & unlocked main/EMS page (or main page if mainonly is true)
// //
// int
// PML_GiveLRUPage(boolean mainonly)
// {
// 	int				i,lru;
// 	long			last;
// 	PageListStruct	far *page;
// 
// 	for (i = 0,page = PMPages,lru = -1,last = MAXLONG;i < ChunksInFile;i++,page++)
// 	{
// 		if
// 		(
// 			(page->lastHit < last)
// 		&&	((page->emsPage != -1) || (page->mainPage != -1))
// 		&& 	(page->locked == pml_Unlocked)
// 		&&	(!(mainonly && (page->mainPage == -1)))
// 		)
// 		{
// 			last = page->lastHit;
// 			lru = i;
// 		}
// 	}
// 
// 	if (lru == -1)
// 		Quit("PML_GiveLRUPage: LRU Search failed");
// 	return(lru);
// }
// 
// //
// //	PML_GiveLRUXMSPage() - Returns the page # of the least recently used
// //		(and present) XMS page.
// //	This routine won't return the XMS page protected (by XMSProtectPage)
// //
// int
// PML_GiveLRUXMSPage(void)
// {
// 	int				i,lru;
// 	long			last;
// 	PageListStruct	far *page;
// 
// 	for (i = 0,page = PMPages,lru = -1,last = MAXLONG;i < ChunksInFile;i++,page++)
// 	{
// 		if
// 		(
// 			(page->xmsPage != -1)
// 		&&	(page->lastHit < last)
// 		&&	(i != XMSProtectPage)
// 		)
// 		{
// 			last = page->lastHit;
// 			lru = i;
// 		}
// 	}
// 	return(lru);
// }
// 
// //
// //	PML_PutPageInXMS() - If page isn't in XMS, find LRU XMS page and replace
// //		it with the main/EMS page
// //
// void
// PML_PutPageInXMS(int pagenum)
// {
// 	int				usexms;
// 	PageListStruct	far *page;
// 
// 	if (!XMSPresent)
// 		return;
// 
// 	page = &PMPages[pagenum];
// 	if (page->xmsPage != -1)
// 		return;					// Already in XMS
// 
// 	if (XMSPagesUsed < XMSPagesAvail)
// 		page->xmsPage = XMSPagesUsed++;
// 	else
// 	{
// 		usexms = PML_GiveLRUXMSPage();
// 		if (usexms == -1)
// 			Quit("PML_PutPageInXMS: No XMS LRU");
// 		page->xmsPage = PMPages[usexms].xmsPage;
// 		PMPages[usexms].xmsPage = -1;
// 	}
// 	PML_CopyToXMS(PM_GetPageAddress(pagenum),page->xmsPage,page->length);
// }
// 
// //
// //	PML_TransferPageSpace() - A page is being replaced, so give the new page
// //		the old one's address space. Returns the address of the new page.
// //
// memptr
// PML_TransferPageSpace(int orig,int new)
// {
// 	memptr			addr;
// 	PageListStruct	far *origpage,far *newpage;
// 
// 	if (orig == new)
// 		Quit("PML_TransferPageSpace: Identity replacement");
// 
// 	origpage = &PMPages[orig];
// 	newpage = &PMPages[new];
// 
// 	if (origpage->locked != pml_Unlocked)
// 		Quit("PML_TransferPageSpace: Killing locked page");
// 
// 	if ((origpage->emsPage == -1) && (origpage->mainPage == -1))
// 		Quit("PML_TransferPageSpace: Reusing non-existent page");
// 
// 	// Copy page that's about to be purged into XMS
// 	PML_PutPageInXMS(orig);
// 
// 	// Get the address, and force EMS into a physical page if necessary
// 	addr = PM_GetPageAddress(orig);
// 
// 	// Steal the address
// 	newpage->emsPage = origpage->emsPage;
// 	newpage->mainPage = origpage->mainPage;
// 
// 	// Mark replaced page as purged
// 	origpage->mainPage = origpage->emsPage = -1;
// 
// 	if (!addr)
// 		Quit("PML_TransferPageSpace: Zero replacement");
// 
// 	return(addr);
// }
// 
// //
// //	PML_GetAPageBuffer() - A page buffer is needed. Either get it from the
// //		main/EMS free pool, or use PML_GiveLRUPage() to find which page to
// //		steal the buffer from. Returns a far pointer to the page buffer, and
// //		sets the fields inside the given page structure appropriately.
// //		If mainonly is true, free EMS will be ignored, and only main pages
// //		will be looked at by PML_GiveLRUPage().
// //
// byte far *
// PML_GetAPageBuffer(int pagenum,boolean mainonly)
// {
// 	byte			far *addr = nil;
// 	int				i,n;
// 	PMBlockAttr		*used;
// 	PageListStruct	far *page;
// 
// 	page = &PMPages[pagenum];
// 	if ((EMSPagesUsed < EMSPagesAvail) && !mainonly)
// 	{
// 		// There's remaining EMS - use it
// 		page->emsPage = EMSPagesUsed++;
// 		addr = PML_GetEMSAddress(page->emsPage,page->locked);
// 	}
// 	else if (MainPagesUsed < MainPagesAvail)
// 	{
// 		// There's remaining main memory - use it
// 		for (i = 0,n = -1,used = MainMemUsed;i < PMMaxMainMem;i++,used++)
// 		{
// 			if ((*used & pmba_Allocated) && !(*used & pmba_Used))
// 			{
// 				n = i;
// 				*used |= pmba_Used;
// 				break;
// 			}
// 		}
// 		if (n == -1)
// 			Quit("PML_GetPageBuffer: MainPagesAvail lied");
// 		addr = MainMemPages[n];
// 		if (!addr)
// 			Quit("PML_GetPageBuffer: Purged main block");
// 		page->mainPage = n;
// 		MainPagesUsed++;
// 	}
// 	else
// 		addr = PML_TransferPageSpace(PML_GiveLRUPage(mainonly),pagenum);
// 
// 	if (!addr)
// 		Quit("PML_GetPageBuffer: Search failed");
// 	return(addr);
// }
// 
// //
// //	PML_GetPageFromXMS() - If page is in XMS, find LRU main/EMS page and
// //		replace it with the page from XMS. If mainonly is true, will only
// //		search for LRU main page.
// //	XMSProtectPage is set to the page to be retrieved from XMS, so that if
// //		the page from which we're stealing the main/EMS from isn't in XMS,
// //		it won't copy over the page that we're trying to get from XMS.
// //		(pages that are being purged are copied into XMS, if possible)
// //
// memptr
// PML_GetPageFromXMS(int pagenum,boolean mainonly)
// {
// 	byte			far *checkaddr;
// 	memptr			addr = nil;
// 	PageListStruct	far *page;
// 
// 	page = &PMPages[pagenum];
// 	if (XMSPresent && (page->xmsPage != -1))
// 	{
// 		XMSProtectPage = pagenum;
// 		checkaddr = PML_GetAPageBuffer(pagenum,mainonly);
// 		if (FP_OFF(checkaddr))
// 			Quit("PML_GetPageFromXMS: Non segment pointer");
// 		addr = (memptr)FP_SEG(checkaddr);
// 		PML_CopyFromXMS(addr,page->xmsPage,page->length);
// 		XMSProtectPage = -1;
// 	}
// 
// 	return(addr);
// }
// 
// //
// //	PML_LoadPage() - A page is not in main/EMS memory, and it's not in XMS.
// //		Load it into either main or EMS. If mainonly is true, the page will
// //		only be loaded into main.
// //
// void
// PML_LoadPage(int pagenum,boolean mainonly)
// {
// 	byte			far *addr;
// 	PageListStruct	far *page;
// 
// 	addr = PML_GetAPageBuffer(pagenum,mainonly);
// 	page = &PMPages[pagenum];
// 	PML_ReadFromFile(addr,page->offset,page->length);
// }
// 
// //
// //	PM_GetPage() - Returns the address of the page, loading it if necessary
// //		First, check if in Main Memory or EMS
// //		Then, check XMS
// //		If not in XMS, load into Main Memory or EMS
// //
// #pragma warn -pia
// memptr
// PM_GetPage(int pagenum)
// {
// 	memptr	result;
// 
// 	if (pagenum >= ChunksInFile)
// 		Quit("PM_GetPage: Invalid page request");
// 
// #if 0	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,10	// bright green
// asm	out	dx,al
// #endif
// 
// 	if (!(result = PM_GetPageAddress(pagenum)))
// 	{
// 		boolean mainonly = (pagenum >= PMSoundStart);
// if (!PMPages[pagenum].offset)	// JDC: sparse page
// 	Quit ("Tried to load a sparse page!");
// 		if (!(result = PML_GetPageFromXMS(pagenum,mainonly)))
// 		{
// 			if (PMPages[pagenum].lastHit == PMFrameCount)
// 				PMThrashing++;
// 
// 			PML_LoadPage(pagenum,mainonly);
// 			result = PM_GetPageAddress(pagenum);
// 		}
// 	}
// 	PMPages[pagenum].lastHit = PMFrameCount;
// 
// #if 0	// for debugging
// asm	mov	dx,STATUS_REGISTER_1
// asm	in	al,dx
// asm	mov	dx,ATR_INDEX
// asm	mov	al,ATR_OVERSCAN
// asm	out	dx,al
// asm	mov	al,3	// blue
// asm	out	dx,al
// asm	mov	al,0x20	// normal
// asm	out	dx,al
// #endif
// 
// 	return(result);
// }
// #pragma warn +pia
// 
// //
// //	PM_SetPageLock() - Sets the lock type on a given page
// //		pml_Unlocked: Normal, page can be purged
// //		pml_Locked: Cannot be purged
// //		pml_EMS?: Same as pml_Locked, but if in EMS, use the physical page
// //					specified when returning the address. For sound stuff.
// //
// void
// PM_SetPageLock(int pagenum,PMLockType lock)
// {
// 	if (pagenum < PMSoundStart)
// 		Quit("PM_SetPageLock: Locking/unlocking non-sound page");
// 
// 	PMPages[pagenum].locked = lock;
// }
// 
// //
// //	PM_Preload() - Loads as many pages as possible into all types of memory.
// //		Calls the update function after each load, indicating the current
// //		page, and the total pages that need to be loaded (for thermometer).
// //
// void
// PM_Preload(boolean (*update)(word current,word total))
// {
// 	int				i,j,
// 					page,oogypage;
// 	word			current,total,
// 					totalnonxms,totalxms,
// 					mainfree,maintotal,
// 					emsfree,emstotal,
// 					xmsfree,xmstotal;
// 	memptr			addr;
// 	PageListStruct	far *p;
// 
// 	mainfree = (MainPagesAvail - MainPagesUsed) + (EMSPagesAvail - EMSPagesUsed);
// 	xmsfree = (XMSPagesAvail - XMSPagesUsed);
// 
// 	xmstotal = maintotal = 0;
// 
// 	for (i = 0;i < ChunksInFile;i++)
// 	{
// 		if (!PMPages[i].offset)
// 			continue;			// sparse
// 
// 		if ( PMPages[i].emsPage != -1 || PMPages[i].mainPage != -1 )
// 			continue;			// already in main mem
// 
// 		if ( mainfree )
// 		{
// 			maintotal++;
// 			mainfree--;
// 		}
// 		else if ( xmsfree && (PMPages[i].xmsPage == -1) )
// 		{
// 			xmstotal++;
// 			xmsfree--;
// 		}
// 	}
// 
// 
// 	total = maintotal + xmstotal;
// 
// 	if (!total)
// 		return;
// 
// 	page = 0;
// 	current = 0;
// 
// //
// // cache main/ems blocks
// //
// 	while (maintotal)
// 	{
// 		while ( !PMPages[page].offset || PMPages[page].mainPage != -1
// 			||	PMPages[page].emsPage != -1 )
// 			page++;
// 
// 		if (page >= ChunksInFile)
// 			Quit ("PM_Preload: Pages>=ChunksInFile");
// 
// 		PM_GetPage(page);
// 
// 		page++;
// 		current++;
// 		maintotal--;
// 		update(current,total);
// 	}
// 
// //
// // load stuff to XMS
// //
// 	if (xmstotal)
// 	{
// 		for (oogypage = 0 ; PMPages[oogypage].mainPage == -1 ; oogypage++)
// 		;
// 		addr = PM_GetPage(oogypage);
// 		if (!addr)
// 			Quit("PM_Preload: XMS buffer failed");
// 
// 		while (xmstotal)
// 		{
// 			while ( !PMPages[page].offset || PMPages[page].xmsPage != -1 )
// 				page++;
// 
// 			if (page >= ChunksInFile)
// 				Quit ("PM_Preload: Pages>=ChunksInFile");
// 
// 			p = &PMPages[page];
// 
// 			p->xmsPage = XMSPagesUsed++;
// 			if (XMSPagesUsed > XMSPagesAvail)
// 				Quit("PM_Preload: Exceeded XMS pages");
// 			if (p->length > PMPageSize)
// 				Quit("PM_Preload: Page too long");
// 
// 			PML_ReadFromFile((byte far *)addr,p->offset,p->length);
// 			PML_CopyToXMS((byte far *)addr,p->xmsPage,p->length);
// 
// 			page++;
// 			current++;
// 			xmstotal--;
// 			update(current,total);
// 		}
// 
// 		p = &PMPages[oogypage];
// 		PML_ReadFromFile((byte far *)addr,p->offset,p->length);
// 	}
// 
// 	update(total,total);
// }
// 
// /////////////////////////////////////////////////////////////////////////////
// //
// //	General code
// //
// /////////////////////////////////////////////////////////////////////////////
// 
// //
// //	PM_NextFrame() - Increments the frame counter and adjusts the thrash
// //		avoidence variables
// //
// //		If currently in panic mode (to avoid thrashing), check to see if the
// //			appropriate number of frames have passed since the last time that
// //			we would have thrashed. If so, take us out of panic mode.
// //
// //
// void
// PM_NextFrame(void)
// {
// 	int	i;
// 
// 	// Frame count overrun - kill the LRU hit entries & reset frame count
// 	if (++PMFrameCount >= MAXLONG - 4)
// 	{
// 		for (i = 0;i < PMNumBlocks;i++)
// 			PMPages[i].lastHit = 0;
// 		PMFrameCount = 0;
// 	}
// 
// #if 0
// 	for (i = 0;i < PMSoundStart;i++)
// 	{
// 		if (PMPages[i].locked)
// 		{
// 			char buf[40];
// 			sprintf(buf,"PM_NextFrame: Page %d is locked",i);
// 			Quit(buf);
// 		}
// 	}
// #endif
// 
// 	if (PMPanicMode)
// 	{
// 		// DEBUG - set border color
// 		if ((!PMThrashing) && (!--PMPanicMode))
// 		{
// 			// DEBUG - reset border color
// 		}
// 	}
// 	if (PMThrashing >= PMThrashThreshold)
// 		PMPanicMode = PMUnThrashThreshold;
// 	PMThrashing = false;
// }
// 
// //
// //	PM_Reset() - Sets up caching structures
// //
// void
// PM_Reset(void)
// {
// 	int				i;
// 	PageListStruct	far *page;
// 
// 	XMSPagesAvail = XMSAvail / PMPageSizeKB;
// 
// 	EMSPagesAvail = EMSAvail * (EMSPageSizeKB / PMPageSizeKB);
// 	EMSPhysicalPage = 0;
// 
// 	MainPagesUsed = EMSPagesUsed = XMSPagesUsed = 0;
// 
// 	PMPanicMode = false;
// 
// 	// Initialize page list
// 	for (i = 0,page = PMPages;i < PMNumBlocks;i++,page++)
// 	{
// 		page->mainPage = -1;
// 		page->emsPage = -1;
// 		page->xmsPage = -1;
// 		page->locked = false;
// 	}
// }
// 
// //
// //	PM_Startup() - Start up the Page Mgr
// //
// void
// PM_Startup(void)
// {
// 	boolean	nomain,noems,noxms;
// 	int		i;
// 
// 	if (PMStarted)
// 		return;
// 
// 	nomain = noems = noxms = false;
// 	for (i = 1;i < _argc;i++)
// 	{
// 		switch (US_CheckParm(_argv[i],ParmStrings))
// 		{
// 		case 0:
// 			nomain = true;
// 			break;
// 		case 1:
// 			noems = true;
// 			break;
// 		case 2:
// 			noxms = true;
// 			break;
// 		}
// 	}
// 
// 	PML_OpenPageFile();
// 
// 	if (!noems)
// 		PML_StartupEMS();
// 	if (!noxms)
// 		PML_StartupXMS();
// 
// 	if (nomain && !EMSPresent)
// 		Quit("PM_Startup: No main or EMS");
// 	else
// 		PML_StartupMainMem();
// 
// 	PM_Reset();
// 
// 	PMStarted = true;
// }
// 
// //
// //	PM_Shutdown() - Shut down the Page Mgr
// //
// void
// PM_Shutdown(void)
// {
// 	PML_ShutdownXMS();
// 	PML_ShutdownEMS();
// 
// 	if (!PMStarted)
// 		return;
// 
// 	PML_ClosePageFile();
// 
// 	PML_ShutdownMainMem();
// }
// 
