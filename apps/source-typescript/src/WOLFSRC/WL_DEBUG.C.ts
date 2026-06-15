// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_DEBUG.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_DEBUG.C";
export const WOLFSRC_FUNCTIONS = [
  "CountObjects",
  "DebugKeys",
  "DebugMemory",
  "OverheadRefresh",
  "PicturePause",
  "ShapeTest",
  "ViewMap"
] as const;

const MAPSIZE = 64;
const VIEWTILEX = 20;
const VIEWTILEY = 12;
const MAXWALLTILES = 64;

export const mapview = 0;
export const tilemapview = 1;
export const actoratview = 2;
export const visview = 3;

export let maporgx = 0;
export let maporgy = 0;
export let viewtype = actoratview;

export interface DebugMemoryOptions {
  readonly mainmem?: number;
  readonly unusedMemory?: number;
  readonly totalFree?: number;
}

export interface DebugMemorySummary {
  readonly title: "Memory Usage";
  readonly totalK: number;
  readonly freeK: number;
  readonly withPurgeK: number;
}

export interface CountObjectOptions {
  readonly statics?: readonly { readonly shapenum: number }[];
  readonly actors?: readonly { readonly active: boolean }[];
  readonly doornum?: number;
}

export interface CountObjectsSummary {
  readonly totalStatics: number;
  readonly inUseStatics: number;
  readonly deletedStatics: number;
  readonly doors: number;
  readonly totalActors: number;
  readonly activeActors: number;
  readonly inactiveActors: number;
}

export interface DebugKeysOptions {
  readonly key?: string;
  readonly value?: number;
  readonly godmode?: boolean;
  readonly noclip?: boolean;
  readonly singlestep?: boolean;
  readonly tedlevel?: boolean;
}

export interface DebugKeysSummary {
  readonly handled: boolean;
  readonly action: string | null;
  readonly value?: number;
  readonly godmode?: boolean;
  readonly noclip?: boolean;
  readonly singlestep?: boolean;
  readonly playstate?: "completed" | "warped";
}

export interface OverheadRefreshOptions {
  readonly originX?: number;
  readonly originY?: number;
  readonly type?: number;
  readonly map?: Uint16Array | Uint8Array | readonly number[];
  readonly tilemap?: Uint16Array | Uint8Array | readonly number[];
  readonly actorat?: Uint16Array | Uint8Array | readonly number[];
  readonly spotvis?: Uint16Array | Uint8Array | readonly number[];
  readonly width?: number;
  readonly height?: number;
}

export interface OverheadTileSummary {
  readonly x: number;
  readonly y: number;
  readonly tile: number;
  readonly wall: boolean;
}

export interface OverheadRefreshSummary {
  readonly originX: number;
  readonly originY: number;
  readonly viewtype: number;
  readonly tiles: readonly OverheadTileSummary[];
}

export interface PicturePauseSummary {
  readonly enteredMode13h: boolean;
  readonly copiedPlanes: number;
  readonly copiedBytes: number;
  readonly waitedVbls: number;
  readonly quit: boolean;
}

export interface ShapeTestOptions {
  readonly page?: number;
  readonly chunksInFile?: number;
  readonly spriteStart?: number;
  readonly soundStart?: number;
  readonly scans?: readonly string[];
}

export interface ShapeTestSummary {
  readonly page: number;
  readonly kind: "wall" | "sprite" | "sound-info" | "sound";
  readonly visited: readonly number[];
}

export interface ViewMapOptions extends OverheadRefreshOptions {
  readonly playerTileX?: number;
  readonly playerTileY?: number;
  readonly controls?: readonly { readonly x?: number; readonly y?: number }[];
}

export interface ViewMapSummary {
  readonly originX: number;
  readonly originY: number;
  readonly viewtype: number;
  readonly refreshes: readonly OverheadRefreshSummary[];
}

export function DebugMemory(options: DebugMemoryOptions = {}): DebugMemorySummary {
  return {
    title: "Memory Usage",
    totalK: Math.trunc((options.mainmem ?? 0) / 1024),
    freeK: Math.trunc((options.unusedMemory ?? 0) / 1024),
    withPurgeK: Math.trunc((options.totalFree ?? options.unusedMemory ?? 0) / 1024),
  };
}

export function CountObjects(options: CountObjectOptions = {}): CountObjectsSummary {
  const statics = options.statics ?? [];
  const actors = options.actors ?? [];
  const inUseStatics = statics.reduce((count, stat) => count + (stat.shapenum !== -1 ? 1 : 0), 0);
  const activeActors = actors.reduce((count, actor) => count + (actor.active ? 1 : 0), 0);
  return {
    totalStatics: statics.length,
    inUseStatics,
    deletedStatics: statics.length - inUseStatics,
    doors: options.doornum ?? 0,
    totalActors: actors.length,
    activeActors,
    inactiveActors: actors.length - activeActors,
  };
}

export function PicturePause(options: { readonly enterPressed?: boolean } = {}): PicturePauseSummary {
  const enterPressed = options.enterPressed ?? true;
  return {
    enteredMode13h: enterPressed,
    copiedPlanes: enterPressed ? 4 : 0,
    copiedBytes: enterPressed ? 64000 : 0,
    waitedVbls: enterPressed ? 140 : 0,
    quit: enterPressed,
  };
}

export function ShapeTest(options: ShapeTestOptions = {}): ShapeTestSummary {
  const chunksInFile = options.chunksInFile ?? 1;
  const spriteStart = options.spriteStart ?? chunksInFile;
  const soundStart = options.soundStart ?? chunksInFile;
  let page = clamp(Math.trunc(options.page ?? 0), 0, Math.max(0, chunksInFile - 1));
  const visited = [page];
  for (const scan of options.scans ?? []) {
    switch (scan) {
      case "Left":
        if (page) page--;
        break;
      case "Right":
        if (page + 1 < chunksInFile) page++;
        break;
      case "W":
        page = 0;
        break;
      case "S":
        page = clamp(spriteStart, 0, Math.max(0, chunksInFile - 1));
        break;
      case "D":
        page = clamp(soundStart, 0, Math.max(0, chunksInFile - 1));
        break;
      case "I":
        page = Math.max(0, chunksInFile - 1);
        break;
      case "Escape":
        visited.push(page);
        return { page, kind: shapePageKind(page, chunksInFile, spriteStart, soundStart), visited };
    }
    visited.push(page);
  }
  return { page, kind: shapePageKind(page, chunksInFile, spriteStart, soundStart), visited };
}

export function DebugKeys(options: DebugKeysOptions = {}): DebugKeysSummary {
  switch ((options.key ?? "").toUpperCase()) {
    case "B":
      return { handled: true, action: "border-color", value: clamp(options.value ?? 0, 0, 15) };
    case "C":
      return { handled: true, action: "count-objects" };
    case "E":
      return options.tedlevel
        ? { handled: true, action: "quit" }
        : { handled: true, action: "quit-level", playstate: "completed" };
    case "F":
      return { handled: true, action: "facing-spot" };
    case "G":
      return { handled: true, action: "god-mode", godmode: !(options.godmode ?? false) };
    case "H":
      return { handled: true, action: "hurt-self", value: 16 };
    case "I":
      return { handled: true, action: "free-items" };
    case "M":
      return { handled: true, action: "memory-info" };
    case "N":
      return { handled: true, action: "no-clip", noclip: !(options.noclip ?? false) };
    case "P":
      return { handled: true, action: "picture-pause" };
    case "Q":
      return { handled: true, action: "fast-quit" };
    case "S":
      return { handled: true, action: "slow-motion", singlestep: !(options.singlestep ?? false) };
    case "T":
      return { handled: true, action: "shape-test" };
    case "V":
      return { handled: true, action: "extra-vbls", value: clamp(options.value ?? 0, 0, 8) };
    case "W":
      return { handled: true, action: "warp", value: clamp(options.value ?? 1, 1, 10) - 1, playstate: "warped" };
    case "X":
      return { handled: true, action: "extra-stuff" };
    default:
      return { handled: false, action: null };
  }
}

export function OverheadRefresh(options: OverheadRefreshOptions = {}): OverheadRefreshSummary {
  const originX = clamp(Math.trunc(options.originX ?? maporgx), 0, MAPSIZE - VIEWTILEX);
  const originY = clamp(Math.trunc(options.originY ?? maporgy), 0, MAPSIZE - VIEWTILEY);
  const width = options.width ?? MAPSIZE;
  const source = overheadSource(options);
  const type = options.type ?? viewtype;
  const tiles: OverheadTileSummary[] = [];

  for (let y = originY; y < originY + VIEWTILEY; y++) {
    for (let x = originX; x < originX + VIEWTILEX; x++) {
      const tile = source[y * width + x] ?? 0;
      tiles.push({ x, y, tile, wall: tile < MAXWALLTILES });
    }
  }

  maporgx = originX;
  maporgy = originY;
  viewtype = type;
  return { originX, originY, viewtype: type, tiles };
}

export function ViewMap(options: ViewMapOptions = {}): ViewMapSummary {
  viewtype = options.type ?? actoratview;
  maporgx = clamp(Math.trunc((options.playerTileX ?? 0) - Math.trunc(VIEWTILEX / 2)), 0, MAPSIZE - VIEWTILEX);
  maporgy = clamp(Math.trunc((options.playerTileY ?? 0) - Math.trunc(VIEWTILEY / 2)), 0, MAPSIZE - VIEWTILEY);

  const refreshes: OverheadRefreshSummary[] = [];
  for (const control of options.controls ?? [{}]) {
    if ((control.x ?? 0) < 0 && maporgx > 0) maporgx--;
    if ((control.x ?? 0) > 0 && maporgx < MAPSIZE - VIEWTILEX) maporgx++;
    if ((control.y ?? 0) < 0 && maporgy > 0) maporgy--;
    if ((control.y ?? 0) > 0 && maporgy < MAPSIZE - VIEWTILEY) maporgy++;
    refreshes.push(OverheadRefresh({ ...options, originX: maporgx, originY: maporgy, type: viewtype }));
  }

  return { originX: maporgx, originY: maporgy, viewtype, refreshes };
}

function overheadSource(options: OverheadRefreshOptions): Uint16Array | Uint8Array | readonly number[] {
  switch (options.type ?? viewtype) {
    case mapview:
      return options.map ?? [];
    case tilemapview:
      return options.tilemap ?? [];
    case visview:
      return options.spotvis ?? [];
    case actoratview:
    default:
      return options.actorat ?? [];
  }
}

function shapePageKind(
  page: number,
  chunksInFile: number,
  spriteStart: number,
  soundStart: number,
): ShapeTestSummary["kind"] {
  if (page < spriteStart) return "wall";
  if (page < soundStart) return "sprite";
  if (page === chunksInFile - 1) return "sound-info";
  return "sound";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_DEBUG.C
// 
// #include "WL_DEF.H"
// #pragma hdrstop
// #include <BIOS.H>
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// #define VIEWTILEX	(viewwidth/16)
// #define VIEWTILEY	(viewheight/16)
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// int DebugKeys (void);
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// int	maporgx;
// int	maporgy;
// enum {mapview,tilemapview,actoratview,visview}	viewtype;
// 
// void ViewMap (void);
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = DebugMemory
// =
// ==================
// */
// 
// void DebugMemory (void)
// {
// 	int	i;
// 	char    scratch[80],str[10];
// 	long	mem;
// 	spritetype _seg	*block;
// 
// 	CenterWindow (16,7);
// 
// 	US_CPrint ("Memory Usage");
// 	US_CPrint ("------------");
// 	US_Print ("Total     :");
// 	US_PrintUnsigned (mminfo.mainmem/1024);
// 	US_Print ("k\nFree      :");
// 	US_PrintUnsigned (MM_UnusedMemory()/1024);
// 	US_Print ("k\nWith purge:");
// 	US_PrintUnsigned (MM_TotalFree()/1024);
// 	US_Print ("k\n");
// 	VW_UpdateScreen();
// 	IN_Ack ();
// }
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = CountObjects
// =
// ==================
// */
// 
// void CountObjects (void)
// {
// 	int	i,total,count,active,inactive,doors;
// 	objtype	*obj;
// 
// 	CenterWindow (16,7);
// 	active = inactive = count = doors = 0;
// 
// 	US_Print ("Total statics :");
// 	total = laststatobj-&statobjlist[0];
// 	US_PrintUnsigned (total);
// 
// 	US_Print ("\nIn use statics:");
// 	for (i=0;i<total;i++)
// 		if (statobjlist[i].shapenum != -1)
// 			count++;
// 		else
// 			doors++;	//debug
// 	US_PrintUnsigned (count);
// 
// 	US_Print ("\nDoors         :");
// 	US_PrintUnsigned (doornum);
// 
// 	for (obj=player->next;obj;obj=obj->next)
// 	{
// 		if (obj->active)
// 			active++;
// 		else
// 			inactive++;
// 	}
// 
// 	US_Print ("\nTotal actors  :");
// 	US_PrintUnsigned (active+inactive);
// 
// 	US_Print ("\nActive actors :");
// 	US_PrintUnsigned (active);
// 
// 	VW_UpdateScreen();
// 	IN_Ack ();
// }
// 
// //===========================================================================
// 
// /*
// ================
// =
// = PicturePause
// =
// ================
// */
// 
// void PicturePause (void)
// {
// 	int			i;
// 	byte		p;
// 	unsigned	x;
// 	byte		far	*dest,far *src;
// 	memptr		buffer;
// 
// 	VW_ColorBorder (15);
// 	FinishPaletteShifts ();
// 
// 	LastScan = 0;
// 	while (!LastScan)
// 	;
// 	if (LastScan != sc_Enter)
// 	{
// 		VW_ColorBorder (0);
// 		return;
// 	}
// 
// 	VW_ColorBorder (1);
// 	VW_SetScreen (0,0);
// //
// // vga stuff...
// //
// 
// 	ClearMemory ();
// 	CA_SetAllPurge();
// 	MM_GetPtr (&buffer,64000);
// 	for (p=0;p<4;p++)
// 	{
// 	   src = MK_FP(0xa000,displayofs);
// 	   dest = (byte far *)buffer+p;
// 	   VGAREADMAP(p);
// 	   for (x=0;x<16000;x++,dest+=4)
// 		   *dest = *src++;
// 	}
// 
// 
// #if 0
// 	for (p=0;p<4;p++)
// 	{
// 		src = MK_FP(0xa000,0);
// 		dest = (byte far *)buffer+51200+p;
// 		VGAREADMAP(p);
// 		for (x=0;x<3200;x++,dest+=4)
// 			*dest = *src++;
// 	}
// #endif
// 
// 	asm	mov	ax,0x13
// 	asm	int	0x10
// 
// 	dest = MK_FP(0xa000,0);
// 	_fmemcpy (dest,buffer,64000);
// 
// 	VL_SetPalette (&gamepal);
// 
// 
// 	IN_Shutdown ();
// 
// 	VW_WaitVBL(70);
// 	bioskey(0);
// 	VW_WaitVBL(70);
// 	Quit (NULL);
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// ================
// =
// = ShapeTest
// =
// ================
// */
// 
// #pragma warn -pia
// void ShapeTest (void)
// {
// extern	word	NumDigi;
// extern	word	_seg *DigiList;
// static	char	buf[10];
// 
// 	boolean			done;
// 	ScanCode		scan;
// 	int				i,j,k,x;
// 	longword		l;
// 	memptr			addr;
// 	PageListStruct	far *page;
// 
// 	CenterWindow(20,16);
// 	VW_UpdateScreen();
// 	for (i = 0,done = false;!done;)
// 	{
// 		US_ClearWindow();
// //		sound = -1;
// 
// 		page = &PMPages[i];
// 		US_Print(" Page #");
// 		US_PrintUnsigned(i);
// 		if (i < PMSpriteStart)
// 			US_Print(" (Wall)");
// 		else if (i < PMSoundStart)
// 			US_Print(" (Sprite)");
// 		else if (i == ChunksInFile - 1)
// 			US_Print(" (Sound Info)");
// 		else
// 			US_Print(" (Sound)");
// 
// 		US_Print("\n XMS: ");
// 		if (page->xmsPage != -1)
// 			US_PrintUnsigned(page->xmsPage);
// 		else
// 			US_Print("No");
// 
// 		US_Print("\n Main: ");
// 		if (page->mainPage != -1)
// 			US_PrintUnsigned(page->mainPage);
// 		else if (page->emsPage != -1)
// 		{
// 			US_Print("EMS ");
// 			US_PrintUnsigned(page->emsPage);
// 		}
// 		else
// 			US_Print("No");
// 
// 		US_Print("\n Last hit: ");
// 		US_PrintUnsigned(page->lastHit);
// 
// 		US_Print("\n Address: ");
// 		addr = PM_GetPageAddress(i);
// 		sprintf(buf,"0x%04x",(word)addr);
// 		US_Print(buf);
// 
// 		if (addr)
// 		{
// 			if (i < PMSpriteStart)
// 			{
// 			//
// 			// draw the wall
// 			//
// 				bufferofs += 32*SCREENWIDTH;
// 				postx = 128;
// 				postwidth = 1;
// 				postsource = ((long)((unsigned)addr))<<16;
// 				for (x=0;x<64;x++,postx++,postsource+=64)
// 				{
// 					wallheight[postx] = 256;
// 					FarScalePost ();
// 				}
// 				bufferofs -= 32*SCREENWIDTH;
// 			}
// 			else if (i < PMSoundStart)
// 			{
// 			//
// 			// draw the sprite
// 			//
// 				bufferofs += 32*SCREENWIDTH;
// 				SimpleScaleShape (160, i-PMSpriteStart, 64);
// 				bufferofs -= 32*SCREENWIDTH;
// 			}
// 			else if (i == ChunksInFile - 1)
// 			{
// 				US_Print("\n\n Number of sounds: ");
// 				US_PrintUnsigned(NumDigi);
// 				for (l = j = k = 0;j < NumDigi;j++)
// 				{
// 					l += DigiList[(j * 2) + 1];
// 					k += (DigiList[(j * 2) + 1] + (PMPageSize - 1)) / PMPageSize;
// 				}
// 				US_Print("\n Total bytes: ");
// 				US_PrintUnsigned(l);
// 				US_Print("\n Total pages: ");
// 				US_PrintUnsigned(k);
// 			}
// 			else
// 			{
// 				byte far *dp = (byte far *)MK_FP(addr,0);
// 				for (j = 0;j < NumDigi;j++)
// 				{
// 					k = (DigiList[(j * 2) + 1] + (PMPageSize - 1)) / PMPageSize;
// 					if
// 					(
// 						(i >= PMSoundStart + DigiList[j * 2])
// 					&&	(i < PMSoundStart + DigiList[j * 2] + k)
// 					)
// 						break;
// 				}
// 				if (j < NumDigi)
// 				{
// //					sound = j;
// 					US_Print("\n Sound #");
// 					US_PrintUnsigned(j);
// 					US_Print("\n Segment #");
// 					US_PrintUnsigned(i - PMSoundStart - DigiList[j * 2]);
// 				}
// 				for (j = 0;j < page->length;j += 32)
// 				{
// 					byte v = dp[j];
// 					int v2 = (unsigned)v;
// 					v2 -= 128;
// 					v2 /= 4;
// 					if (v2 < 0)
// 						VWB_Vlin(WindowY + WindowH - 32 + v2,
// 								WindowY + WindowH - 32,
// 								WindowX + 8 + (j / 32),BLACK);
// 					else
// 						VWB_Vlin(WindowY + WindowH - 32,
// 								WindowY + WindowH - 32 + v2,
// 								WindowX + 8 + (j / 32),BLACK);
// 				}
// 			}
// 		}
// 
// 		VW_UpdateScreen();
// 
// 		while (!(scan = LastScan))
// 			SD_Poll();
// 
// 		IN_ClearKey(scan);
// 		switch (scan)
// 		{
// 		case sc_LeftArrow:
// 			if (i)
// 				i--;
// 			break;
// 		case sc_RightArrow:
// 			if (++i >= ChunksInFile)
// 				i--;
// 			break;
// 		case sc_W:	// Walls
// 			i = 0;
// 			break;
// 		case sc_S:	// Sprites
// 			i = PMSpriteStart;
// 			break;
// 		case sc_D:	// Digitized
// 			i = PMSoundStart;
// 			break;
// 		case sc_I:	// Digitized info
// 			i = ChunksInFile - 1;
// 			break;
// 		case sc_L:	// Load all pages
// 			for (j = 0;j < ChunksInFile;j++)
// 				PM_GetPage(j);
// 			break;
// 		case sc_P:
// //			if (sound != -1)
// //				SD_PlayDigitized(sound);
// 			break;
// 		case sc_Escape:
// 			done = true;
// 			break;
// 		case sc_Enter:
// 			PM_GetPage(i);
// 			break;
// 		}
// 	}
// 	SD_StopDigitized();
// }
// #pragma warn +pia
// 
// 
// 
// //===========================================================================
// 
// 
// /*
// ================
// =
// = DebugKeys
// =
// ================
// */
// 
// int DebugKeys (void)
// {
// 	boolean esc;
// 	int level,i;
// 
// 	if (Keyboard[sc_B])		// B = border color
// 	{
// 		CenterWindow(24,3);
// 		PrintY+=6;
// 		US_Print(" Border color (0-15):");
// 		VW_UpdateScreen();
// 		esc = !US_LineInput (px,py,str,NULL,true,2,0);
// 		if (!esc)
// 		{
// 			level = atoi (str);
// 			if (level>=0 && level<=15)
// 				VW_ColorBorder (level);
// 		}
// 		return 1;
// 	}
// 
// 	if (Keyboard[sc_C])		// C = count objects
// 	{
// 		CountObjects();
// 		return 1;
// 	}
// 
// 	if (Keyboard[sc_E])		// E = quit level
// 	{
// 		if (tedlevel)
// 			Quit (NULL);
// 		playstate = ex_completed;
// //		gamestate.mapon++;
// 	}
// 
// 	if (Keyboard[sc_F])		// F = facing spot
// 	{
// 		CenterWindow (14,4);
// 		US_Print ("X:");
// 		US_PrintUnsigned (player->x);
// 		US_Print ("\nY:");
// 		US_PrintUnsigned (player->y);
// 		US_Print ("\nA:");
// 		US_PrintUnsigned (player->angle);
// 		VW_UpdateScreen();
// 		IN_Ack();
// 		return 1;
// 	}
// 
// 	if (Keyboard[sc_G])		// G = god mode
// 	{
// 		CenterWindow (12,2);
// 		if (godmode)
// 		  US_PrintCentered ("God mode OFF");
// 		else
// 		  US_PrintCentered ("God mode ON");
// 		VW_UpdateScreen();
// 		IN_Ack();
// 		godmode ^= 1;
// 		return 1;
// 	}
// 	if (Keyboard[sc_H])		// H = hurt self
// 	{
// 		IN_ClearKeysDown ();
// 		TakeDamage (16,NULL);
// 	}
// 	else if (Keyboard[sc_I])			// I = item cheat
// 	{
// 		CenterWindow (12,3);
// 		US_PrintCentered ("Free items!");
// 		VW_UpdateScreen();
// 		GivePoints (100000);
// 		HealSelf (99);
// 		if (gamestate.bestweapon<wp_chaingun)
// 			GiveWeapon (gamestate.bestweapon+1);
// 		gamestate.ammo += 50;
// 		if (gamestate.ammo > 99)
// 			gamestate.ammo = 99;
// 		DrawAmmo ();
// 		IN_Ack ();
// 		return 1;
// 	}
// 	else if (Keyboard[sc_M])			// M = memory info
// 	{
// 		DebugMemory();
// 		return 1;
// 	}
// #ifdef SPEAR
// 	else if (Keyboard[sc_N])			// N = no clip
// 	{
// 		noclip^=1;
// 		CenterWindow (18,3);
// 		if (noclip)
// 			US_PrintCentered ("No clipping ON");
// 		else
// 			US_PrintCentered ("No clipping OFF");
// 		VW_UpdateScreen();
// 		IN_Ack ();
// 		return 1;
// 	}
// #endif
// #if 0
// 	else if (Keyboard[sc_O])			// O = overhead
// 	{
// 		ViewMap();
// 		return 1;
// 	}
// #endif
// 	else if (Keyboard[sc_P])			// P = pause with no screen disruptioon
// 	{
// 		PicturePause ();
// 		return 1;
// 	}
// 	else if (Keyboard[sc_Q])			// Q = fast quit
// 		Quit (NULL);
// 	else if (Keyboard[sc_S])			// S = slow motion
// 	{
// 		singlestep^=1;
// 		CenterWindow (18,3);
// 		if (singlestep)
// 			US_PrintCentered ("Slow motion ON");
// 		else
// 			US_PrintCentered ("Slow motion OFF");
// 		VW_UpdateScreen();
// 		IN_Ack ();
// 		return 1;
// 	}
// 	else if (Keyboard[sc_T])			// T = shape test
// 	{
// 		ShapeTest ();
// 		return 1;
// 	}
// 	else if (Keyboard[sc_V])			// V = extra VBLs
// 	{
// 		CenterWindow(30,3);
// 		PrintY+=6;
// 		US_Print("  Add how many extra VBLs(0-8):");
// 		VW_UpdateScreen();
// 		esc = !US_LineInput (px,py,str,NULL,true,2,0);
// 		if (!esc)
// 		{
// 			level = atoi (str);
// 			if (level>=0 && level<=8)
// 				extravbls = level;
// 		}
// 		return 1;
// 	}
// 	else if (Keyboard[sc_W])			// W = warp to level
// 	{
// 		CenterWindow(26,3);
// 		PrintY+=6;
// #ifndef SPEAR
// 		US_Print("  Warp to which level(1-10):");
// #else
// 		US_Print("  Warp to which level(1-21):");
// #endif
// 		VW_UpdateScreen();
// 		esc = !US_LineInput (px,py,str,NULL,true,2,0);
// 		if (!esc)
// 		{
// 			level = atoi (str);
// #ifndef SPEAR
// 			if (level>0 && level<11)
// #else
// 			if (level>0 && level<22)
// #endif
// 			{
// 				gamestate.mapon = level-1;
// 				playstate = ex_warped;
// 			}
// 		}
// 		return 1;
// 	}
// 	else if (Keyboard[sc_X])			// X = item cheat
// 	{
// 		CenterWindow (12,3);
// 		US_PrintCentered ("Extra stuff!");
// 		VW_UpdateScreen();
// 		// DEBUG: put stuff here
// 		IN_Ack ();
// 		return 1;
// 	}
// 
// 	return 0;
// }
// 
// 
// #if 0
// /*
// ===================
// =
// = OverheadRefresh
// =
// ===================
// */
// 
// void OverheadRefresh (void)
// {
// 	unsigned	x,y,endx,endy,sx,sy;
// 	unsigned	tile;
// 
// 
// 	endx = maporgx+VIEWTILEX;
// 	endy = maporgy+VIEWTILEY;
// 
// 	for (y=maporgy;y<endy;y++)
// 		for (x=maporgx;x<endx;x++)
// 		{
// 			sx = (x-maporgx)*16;
// 			sy = (y-maporgy)*16;
// 
// 			switch (viewtype)
// 			{
// #if 0
// 			case mapview:
// 				tile = *(mapsegs[0]+farmapylookup[y]+x);
// 				break;
// 
// 			case tilemapview:
// 				tile = tilemap[x][y];
// 				break;
// 
// 			case visview:
// 				tile = spotvis[x][y];
// 				break;
// #endif
// 			case actoratview:
// 				tile = (unsigned)actorat[x][y];
// 				break;
// 			}
// 
// 			if (tile<MAXWALLTILES)
// 				LatchDrawTile(sx,sy,tile);
// 			else
// 			{
// 				LatchDrawChar(sx,sy,NUMBERCHARS+((tile&0xf000)>>12));
// 				LatchDrawChar(sx+8,sy,NUMBERCHARS+((tile&0x0f00)>>8));
// 				LatchDrawChar(sx,sy+8,NUMBERCHARS+((tile&0x00f0)>>4));
// 				LatchDrawChar(sx+8,sy+8,NUMBERCHARS+(tile&0x000f));
// 			}
// 		}
// 
// }
// #endif
// 
// #if 0
// /*
// ===================
// =
// = ViewMap
// =
// ===================
// */
// 
// void ViewMap (void)
// {
// 	boolean		button0held;
// 
// 	viewtype = actoratview;
// //	button0held = false;
// 
// 
// 	maporgx = player->tilex - VIEWTILEX/2;
// 	if (maporgx<0)
// 		maporgx = 0;
// 	if (maporgx>MAPSIZE-VIEWTILEX)
// 		maporgx=MAPSIZE-VIEWTILEX;
// 	maporgy = player->tiley - VIEWTILEY/2;
// 	if (maporgy<0)
// 		maporgy = 0;
// 	if (maporgy>MAPSIZE-VIEWTILEY)
// 		maporgy=MAPSIZE-VIEWTILEY;
// 
// 	do
// 	{
// //
// // let user pan around
// //
// 		PollControls ();
// 		if (controlx < 0 && maporgx>0)
// 			maporgx--;
// 		if (controlx > 0 && maporgx<mapwidth-VIEWTILEX)
// 			maporgx++;
// 		if (controly < 0 && maporgy>0)
// 			maporgy--;
// 		if (controly > 0 && maporgy<mapheight-VIEWTILEY)
// 			maporgy++;
// 
// #if 0
// 		if (c.button0 && !button0held)
// 		{
// 			button0held = true;
// 			viewtype++;
// 			if (viewtype>visview)
// 				viewtype = mapview;
// 		}
// 		if (!c.button0)
// 			button0held = false;
// #endif
// 
// 		OverheadRefresh ();
// 
// 	} while (!Keyboard[sc_Escape]);
// 
// 	IN_ClearKeysDown ();
// }
// #endif
// 
// 
