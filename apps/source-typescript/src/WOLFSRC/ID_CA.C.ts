import { readU32LE } from "./TS_C";
import {
  CA_CacheGrChunk as port_CA_CacheGrChunk,
  CA_CacheMap as port_CA_CacheMap,
  CA_RLEWexpand as port_CA_RLEWexpand,
  CAL_CarmackExpand as port_CAL_CarmackExpand,
  CAL_ExpandGrChunk as port_CAL_ExpandGrChunk,
  CAL_HuffExpand as port_CAL_HuffExpand,
  MAPPLANES,
  MAPSIZE,
  NUMCHUNKS,
  NUMMAPS,
  NUMSNDCHUNKS,
  readGraphicOffsets,
  readHuffNodes,
  readMapFile,
  type HuffNode,
  type MapFile,
  type MapType,
} from "./TS_WL6_ASSETS";
import { LASTSOUND, SD_LinkSoundTable, STARTADLIBSOUNDS, STARTPCSOUNDS, SoundMode } from "./ID_SD.C";
import { sdm_AdLib, sdm_Off, sdm_PC, type SDMode } from "./ID_SD.H";
import { bufferofs, videoPlanes } from "./ID_VL.C";
import { VW_MarkUpdateBlock, type MarkUpdateSummary } from "./ID_VH.C";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_CA.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_CA.C";
export const WOLFSRC_FUNCTIONS = [
  "CA_CacheAudioChunk",
  "CA_CacheGrChunk",
  "CA_CacheMap",
  "CA_CacheMarks",
  "CA_CacheScreen",
  "CA_CannotOpen",
  "CA_ClearAllMarks",
  "CA_ClearMarks",
  "CA_CloseDebug",
  "CA_DownLevel",
  "CA_FarRead",
  "CA_FarWrite",
  "CA_LoadAllSounds",
  "CA_LoadFile",
  "CA_OpenDebug",
  "CA_ReadFile",
  "CA_RLEWCompress",
  "CA_RLEWexpand",
  "CA_SetAllPurge",
  "CA_SetGrPurge",
  "CA_Shutdown",
  "CA_Startup",
  "CA_UpLevel",
  "CA_WriteFile",
  "CAL_CarmackExpand",
  "CAL_ExpandGrChunk",
  "CAL_GetGrChunkLength",
  "CAL_HuffExpand",
  "CAL_OptimizeNodes",
  "CAL_SetupAudioFile",
  "CAL_SetupGrFile",
  "CAL_SetupMapFile",
  "GRFILEPOS"
] as const;

export interface CacheFiles {
  readonly MAPHEAD: Uint8Array;
  readonly GAMEMAPS: Uint8Array;
  readonly VGAHEAD: Uint8Array;
  readonly VGAGRAPH: Uint8Array;
  readonly VGADICT: Uint8Array;
  readonly AUDIOHED: Uint8Array;
  readonly AUDIOT: Uint8Array;
}

export interface CacheManagerSummary {
  readonly mapon: number;
  readonly ca_levelbit: number;
  readonly ca_levelnum: number;
  readonly cachedGraphics: number;
  readonly cachedAudio: number;
  readonly markedGraphics: number;
  readonly mapHeaders: number;
  readonly hasMapFile: boolean;
  readonly hasGraphicsFile: boolean;
  readonly hasAudioFile: boolean;
  readonly chunkcomplen: number;
  readonly chunkexplen: number;
}

export interface GrChunkLengthSummary {
  readonly chunk: number;
  readonly pos: number;
  readonly next: number;
  readonly chunkcomplen: number;
  readonly chunkexplen: number;
}

export interface HuffScreenHackSummary {
  readonly expandedBytes: number;
  readonly planeBytes: number;
  readonly bufferofs: number;
}

export interface CacheScreenSummary {
  readonly chunk: number;
  readonly pos: number;
  readonly next: number;
  readonly compressed: number;
  readonly expanded: number;
  readonly screenhack: HuffScreenHackSummary;
  readonly mark: MarkUpdateSummary;
}

export interface RLEWCompressSummary {
  readonly data: Uint16Array;
  readonly byteLength: number;
}

export interface MemptrRef {
  value: Uint8Array | null;
}

export interface VirtualFileHandleState {
  readonly handle: number;
  readonly filename: string;
  readonly position: number;
  readonly length: number;
  readonly writable: boolean;
}

export let tinf: MapFile | null = null;
export let mapon = -1;
export const mapsegs: Array<Uint16Array | null> = new Array(MAPPLANES).fill(null);
export const mapheaderseg: Array<MapType | null> = new Array(NUMMAPS).fill(null);
export const audiosegs: Array<Uint8Array | null> = new Array(NUMSNDCHUNKS).fill(null);
export const grsegs: Array<Uint8Array | null> = new Array(NUMCHUNKS).fill(null);
export const grneeded = new Uint8Array(NUMCHUNKS);
export let ca_levelbit = 1;
export let ca_levelnum = 0;
export let profilehandle = 0;
export let debughandle = 0;
export let audioname = "AUDIO.";
export let extension = "WL6";
export let gheadname = "VGAHEAD.";
export let gfilename = "VGAGRAPH.";
export let gdictname = "VGADICT.";
export let mheadname = "MAPHEAD.";
export let mfilename = "MAPTEMP.";
export let aheadname = "AUDIOHED.";
export let afilename = "AUDIOT.";
export let grstarts: number[] = [];
export let audiostarts: number[] = [];
export let grhuffman: HuffNode[] = [];
export let audiohuffman: HuffNode[] = [];
export let chunkcomplen = 0;
export let chunkexplen = 0;
export let oldsoundmode: SDMode = sdm_Off;

export const grpurge = new Uint8Array(NUMCHUNKS);
export const audiopurge = new Uint8Array(NUMSNDCHUNKS);

let cacheFiles: Partial<CacheFiles> = {};
let nextVirtualHandle = 3;

const virtualFiles = new Map<string, Uint8Array>();
const virtualHandles = new Map<number, {
  filename: string;
  data: Uint8Array;
  length: number;
  position: number;
  writable: boolean;
}>();

export function CA_DebugCacheState(): CacheManagerSummary {
  return {
    mapon,
    ca_levelbit,
    ca_levelnum,
    cachedGraphics: grsegs.filter(Boolean).length,
    cachedAudio: audiosegs.filter(Boolean).length,
    markedGraphics: Array.from(grneeded).filter((mark) => (mark & ca_levelbit) !== 0).length,
    mapHeaders: mapheaderseg.filter(Boolean).length,
    hasMapFile: Boolean(cacheFiles.MAPHEAD && cacheFiles.GAMEMAPS),
    hasGraphicsFile: Boolean(cacheFiles.VGAHEAD && cacheFiles.VGAGRAPH && cacheFiles.VGADICT),
    hasAudioFile: Boolean(cacheFiles.AUDIOHED && cacheFiles.AUDIOT),
    chunkcomplen,
    chunkexplen,
  };
}

export function CA_SetWL6Files(files: Partial<CacheFiles>): CacheManagerSummary {
  cacheFiles = { ...cacheFiles, ...files };
  return CA_DebugCacheState();
}

function normalizeFilename(filename: string): string {
  return filename.replace(/\\/g, "/").toUpperCase();
}

function cloneBytes(bytes: Uint8Array, length = bytes.length): Uint8Array {
  const copy = new Uint8Array(length);
  copy.set(bytes.subarray(0, length));
  return copy;
}

function openVirtualFile(filename: string, writable: boolean): number {
  const normalized = normalizeFilename(filename);
  const existing = virtualFiles.get(normalized);
  if (!writable && !existing) {
    return -1;
  }

  const handle = nextVirtualHandle++;
  virtualHandles.set(handle, {
    filename: normalized,
    data: writable ? new Uint8Array(0) : cloneBytes(existing ?? new Uint8Array(0)),
    length: writable ? 0 : (existing?.length ?? 0),
    position: 0,
    writable,
  });
  return handle;
}

function growHandleData(handle: NonNullable<ReturnType<typeof virtualHandles.get>>, length: number): void {
  if (length <= handle.data.length) {
    return;
  }
  const grown = new Uint8Array(Math.max(length, handle.data.length * 2, 16));
  grown.set(handle.data.subarray(0, handle.length));
  handle.data = grown;
}

export function CA_ClearVirtualFiles(): void {
  virtualFiles.clear();
  virtualHandles.clear();
  nextVirtualHandle = 3;
}

export function CA_SetVirtualFile(filename: string, bytes: Uint8Array): VirtualFileHandleState {
  const normalized = normalizeFilename(filename);
  virtualFiles.set(normalized, cloneBytes(bytes));
  return { handle: -1, filename: normalized, position: 0, length: bytes.length, writable: false };
}

export function CA_GetVirtualFile(filename: string): Uint8Array | null {
  const file = virtualFiles.get(normalizeFilename(filename));
  return file ? cloneBytes(file) : null;
}

export function CA_OpenFileHandle(filename: string, mode: "read" | "write" = "read"): number {
  return openVirtualFile(filename, mode === "write");
}

export function CA_CloseFileHandle(handle: number): boolean {
  const file = virtualHandles.get(handle);
  if (!file) {
    return false;
  }
  if (file.writable) {
    virtualFiles.set(file.filename, cloneBytes(file.data, file.length));
  }
  virtualHandles.delete(handle);
  return true;
}

export function CA_DebugFileHandle(handle: number): VirtualFileHandleState | null {
  const file = virtualHandles.get(handle);
  if (!file) {
    return null;
  }
  return {
    handle,
    filename: file.filename,
    position: file.position,
    length: file.length,
    writable: file.writable,
  };
}

export function CA_CacheAudioChunk(
  chunk: number,
  AUDIOHED: Uint8Array = requiredFile("AUDIOHED"),
  AUDIOT: Uint8Array = requiredFile("AUDIOT"),
): Uint8Array {
  if (audiosegs[chunk]) {
    audiopurge[chunk] = 0;
    return audiosegs[chunk];
  }

  if (!audiostarts.length) {
    setupAudioStarts(AUDIOHED);
  }

  const pos = audiostarts[chunk];
  const next = audiostarts[chunk + 1];
  if (pos === undefined || next === undefined) {
    throw new RangeError(`CA_CacheAudioChunk: bad chunk ${chunk}`);
  }

  const loaded = AUDIOT.slice(pos, next);
  audiosegs[chunk] = loaded;
  audiopurge[chunk] = 0;
  return loaded;
}

export function CA_CacheGrChunk(
  chunk: number,
  VGAHEAD: Uint8Array = requiredFile("VGAHEAD"),
  VGAGRAPH: Uint8Array = requiredFile("VGAGRAPH"),
  VGADICT: Uint8Array = requiredFile("VGADICT"),
): Uint8Array | null {
  grneeded[chunk] |= ca_levelbit;
  if (grsegs[chunk]) {
    grpurge[chunk] = 0;
    return grsegs[chunk];
  }

  const expanded = port_CA_CacheGrChunk(chunk, VGAHEAD, VGAGRAPH, VGADICT);
  if (expanded) {
    grsegs[chunk] = expanded;
    grpurge[chunk] = 0;
  }
  return expanded;
}

export function CA_CacheMap(
  mapnum: number,
  mapFile: MapFile = requiredMapFile(),
  GAMEMAPS: Uint8Array = requiredFile("GAMEMAPS"),
): Uint16Array[] {
  mapon = mapnum;
  const planes = port_CA_CacheMap(mapnum, mapFile, GAMEMAPS);
  for (let plane = 0; plane < MAPPLANES; plane++) {
    mapsegs[plane] = planes[plane];
  }
  return planes;
}

export function CA_CacheMarks(): CacheManagerSummary {
  for (let i = 0; i < NUMCHUNKS; i++) {
    if (grneeded[i] & ca_levelbit) {
      if (grsegs[i]) {
        grpurge[i] = 0;
      }
    } else if (grsegs[i]) {
      grpurge[i] = 3;
    }
  }

  if (cacheFiles.VGAHEAD && cacheFiles.VGAGRAPH && cacheFiles.VGADICT) {
    for (let i = 0; i < NUMCHUNKS; i++) {
      if ((grneeded[i] & ca_levelbit) && !grsegs[i]) {
        CA_CacheGrChunk(i, cacheFiles.VGAHEAD, cacheFiles.VGAGRAPH, cacheFiles.VGADICT);
      }
    }
  }

  return CA_DebugCacheState();
}

export function CA_CacheScreen(
  chunk: number,
  VGAGRAPH: Uint8Array = requiredFile("VGAGRAPH"),
): CacheScreenSummary {
  const chunkIndex = Math.trunc(chunk);
  const pos = GRFILEPOS(chunkIndex);
  if (pos < 0) {
    throw new Error(`CA_CacheScreen: sparse chunk ${chunkIndex}`);
  }

  let next = chunkIndex + 1;
  while (GRFILEPOS(next) === -1) {
    next++;
  }

  const compressed = GRFILEPOS(next) - pos;
  const source = VGAGRAPH.subarray(pos, pos + compressed);
  const expanded = readU32LE(source, 0);
  const payload = source.subarray(4);
  CAL_HuffExpand(payload, expanded, grhuffman, true);
  const mark = VW_MarkUpdateBlock(0, 0, 319, 199);
  return {
    chunk: chunkIndex,
    pos,
    next,
    compressed,
    expanded,
    screenhack: {
      expandedBytes: Math.trunc(expanded / 4) * 4,
      planeBytes: Math.trunc(expanded / 4),
      bufferofs,
    },
    mark,
  };
}

export function CA_CannotOpen(filename: string): never {
  throw new Error(`Can't open ${filename}!\n`);
}

export function CA_ClearAllMarks(): CacheManagerSummary {
  grneeded.fill(0);
  ca_levelbit = 1;
  ca_levelnum = 0;
  return CA_DebugCacheState();
}

export function CA_ClearMarks(): CacheManagerSummary {
  for (let i = 0; i < NUMCHUNKS; i++) {
    grneeded[i] &= (~ca_levelbit) & 0xff;
  }
  return CA_DebugCacheState();
}

export function CA_CloseDebug(): boolean {
  return CA_CloseFileHandle(debughandle);
}

export function CA_DownLevel(): CacheManagerSummary {
  if (!ca_levelnum) {
    throw new Error("CA_DownLevel: Down past level 0!");
  }
  ca_levelbit >>= 1;
  ca_levelnum--;
  return CA_CacheMarks();
}

export function CA_FarRead(handle: number | Uint8Array, dest: Uint8Array, length = dest.length): boolean {
  if (length > 0xffff) {
    throw new Error("CA_FarRead doesn't support 64K reads yet!");
  }
  if (dest.length < length) {
    return false;
  }

  if (typeof handle !== "number") {
    if (handle.length < length) {
      return false;
    }
    dest.set(handle.subarray(0, length));
    return true;
  }

  const file = virtualHandles.get(handle);
  if (!file || file.writable || file.position + length > file.length) {
    return false;
  }
  dest.set(file.data.subarray(file.position, file.position + length));
  file.position += length;
  return true;
}

export function CA_FarWrite(handle: number | Uint8Array, source: Uint8Array, length = source.length): boolean {
  if (length > 0xffff) {
    throw new Error("CA_FarWrite doesn't support 64K reads yet!");
  }
  if (source.length < length) {
    return false;
  }

  if (typeof handle !== "number") {
    if (handle.length < length) {
      return false;
    }
    handle.set(source.subarray(0, length));
    return true;
  }

  const file = virtualHandles.get(handle);
  if (!file || !file.writable) {
    return false;
  }
  growHandleData(file, file.position + length);
  file.data.set(source.subarray(0, length), file.position);
  file.position += length;
  file.length = Math.max(file.length, file.position);
  return true;
}

export function CA_LoadAllSounds(
  AUDIOHED: Uint8Array = requiredFile("AUDIOHED"),
  AUDIOT: Uint8Array = requiredFile("AUDIOT"),
): CacheManagerSummary {
  let start = 0;

  switch (oldsoundmode) {
    case sdm_Off:
      break;
    case sdm_PC:
      start = STARTPCSOUNDS;
      for (let i = 0; i < LASTSOUND; i++, start++) {
        if (audiosegs[start]) {
          audiopurge[start] = 3;
        }
      }
      break;
    case sdm_AdLib:
      start = STARTADLIBSOUNDS;
      for (let i = 0; i < LASTSOUND; i++, start++) {
        if (audiosegs[start]) {
          audiopurge[start] = 3;
        }
      }
      break;
  }

  switch (SoundMode) {
    case sdm_Off:
      SD_LinkSoundTable(sdm_Off, audiosegs, 0);
      return CA_DebugCacheState();
    case sdm_PC:
      start = STARTPCSOUNDS;
      break;
    case sdm_AdLib:
      start = STARTADLIBSOUNDS;
      break;
  }

  const tableoffset = start;
  for (let i = 0; i < LASTSOUND; i++, start++) {
    CA_CacheAudioChunk(start, AUDIOHED, AUDIOT);
  }

  SD_LinkSoundTable(SoundMode, audiosegs, tableoffset);
  oldsoundmode = SoundMode;
  return CA_DebugCacheState();
}

export function CA_LoadFile(filename: string, ptr: MemptrRef): boolean {
  const handle = openVirtualFile(filename, false);
  if (handle === -1) {
    return false;
  }

  const file = virtualHandles.get(handle);
  const size = file?.length ?? 0;
  const dest = new Uint8Array(size);
  if (!CA_FarRead(handle, dest, size)) {
    CA_CloseFileHandle(handle);
    return false;
  }
  CA_CloseFileHandle(handle);
  ptr.value = dest;
  return true;
}

export function CA_OpenDebug(): VirtualFileHandleState {
  debughandle = openVirtualFile("DEBUG.TXT", true);
  const state = CA_DebugFileHandle(debughandle);
  if (!state) {
    throw new Error("CA_OpenDebug failed to open DEBUG.TXT");
  }
  return state;
}

export function CA_ReadFile(filename: string, ptr: Uint8Array): boolean {
  const handle = openVirtualFile(filename, false);
  if (handle === -1) {
    return false;
  }

  const file = virtualHandles.get(handle);
  const size = file?.length ?? 0;
  const ok = CA_FarRead(handle, ptr, size);
  CA_CloseFileHandle(handle);
  return ok;
}

export function CA_RLEWCompress(
  source: Uint16Array,
  length = source.length * 2,
  rlewtag = 0xabcd,
): RLEWCompressSummary {
  const dest: number[] = [];
  const end = Math.trunc((length + 1) / 2);
  let sourceOffset = 0;

  while (sourceOffset < end) {
    let count = 1;
    const value = source[sourceOffset++];
    while ((sourceOffset < end) && (source[sourceOffset] === value)) {
      count++;
      sourceOffset++;
    }

    if ((count > 3) || (value === rlewtag)) {
      dest.push(rlewtag, count, value);
    } else {
      for (let i = 1; i <= count; i++) {
        dest.push(value);
      }
    }
  }

  return { data: Uint16Array.from(dest), byteLength: dest.length * 2 };
}

export function CA_RLEWexpand(source: Uint16Array, length: number, rlewtag: number): Uint16Array {
  return port_CA_RLEWexpand(source, length, rlewtag);
}

export function CA_SetAllPurge(): CacheManagerSummary {
  for (let i = 0; i < NUMSNDCHUNKS; i++) {
    if (audiosegs[i]) {
      audiopurge[i] = 3;
    }
  }

  CA_SetGrPurge();
  return CA_DebugCacheState();
}

export function CA_SetGrPurge(): CacheManagerSummary {
  CA_ClearMarks();

  for (let i = 0; i < NUMCHUNKS; i++) {
    if (grsegs[i]) {
      grpurge[i] = 3;
    }
  }

  return CA_DebugCacheState();
}

export function CA_Shutdown(): CacheManagerSummary {
  cacheFiles = {};
  return CA_DebugCacheState();
}

export function CA_Startup(files?: Partial<CacheFiles>): CacheManagerSummary {
  if (files) {
    CA_SetWL6Files(files);
  }
  if (cacheFiles.MAPHEAD && cacheFiles.GAMEMAPS) {
    CAL_SetupMapFile(cacheFiles.MAPHEAD, cacheFiles.GAMEMAPS);
  }
  if (cacheFiles.VGAHEAD && cacheFiles.VGAGRAPH && cacheFiles.VGADICT) {
    CAL_SetupGrFile(cacheFiles.VGAHEAD, cacheFiles.VGADICT);
  }
  if (cacheFiles.AUDIOHED) {
    CAL_SetupAudioFile(cacheFiles.AUDIOHED);
  }

  mapon = -1;
  ca_levelbit = 1;
  ca_levelnum = 0;
  return CA_DebugCacheState();
}

export function CA_UpLevel(): CacheManagerSummary {
  if (ca_levelnum === 7) {
    throw new Error("CA_UpLevel: Up past level 7!");
  }

  for (let i = 0; i < NUMCHUNKS; i++) {
    if (grsegs[i]) {
      grpurge[i] = 3;
    }
  }
  ca_levelbit <<= 1;
  ca_levelnum++;
  return CA_DebugCacheState();
}

export function CA_WriteFile(filename: string, ptr: Uint8Array, length = ptr.length): boolean {
  const handle = openVirtualFile(filename, true);
  if (handle === -1) {
    return false;
  }

  const ok = CA_FarWrite(handle, ptr, length);
  CA_CloseFileHandle(handle);
  return ok;
}

export function CAL_CarmackExpand(source: Uint8Array, length: number): Uint16Array {
  return port_CAL_CarmackExpand(source, length);
}

export function CAL_ExpandGrChunk(
  chunk: number,
  source: Uint8Array,
  hufftable: readonly HuffNode[],
): Uint8Array {
  return port_CAL_ExpandGrChunk(chunk, source, hufftable);
}

export function CAL_GetGrChunkLength(
  chunk: number,
  VGAGRAPH: Uint8Array = requiredFile("VGAGRAPH"),
): GrChunkLengthSummary {
  const pos = GRFILEPOS(chunk);
  const next = GRFILEPOS(chunk + 1);
  if (pos < 0 || next < 0) {
    throw new Error(`CAL_GetGrChunkLength: sparse chunk ${chunk}`);
  }

  chunkexplen = readU32LE(VGAGRAPH, pos);
  chunkcomplen = next - pos - 4;

  return { chunk, pos, next, chunkcomplen, chunkexplen };
}

export function CAL_HuffExpand(
  source: Uint8Array,
  length: number,
  hufftable: readonly HuffNode[],
  screenhack = false,
): Uint8Array {
  if (screenhack) {
    const screenLength = Math.trunc(length / 4) * 4;
    const expanded = port_CAL_HuffExpand(source, screenLength, hufftable);
    writeHuffScreenHack(expanded, screenLength);
    return expanded;
  }
  return port_CAL_HuffExpand(source, length, hufftable);
}

export function CAL_OptimizeNodes(table: readonly HuffNode[]): readonly HuffNode[] {
  return table;
}

function writeHuffScreenHack(expanded: Uint8Array, length: number): HuffScreenHackSummary {
  const planeBytes = Math.trunc(length / 4);
  for (let plane = 0; plane < 4; plane++) {
    const planeBase = plane * 0x10000;
    const sourceBase = plane * planeBytes;
    for (let i = 0; i < planeBytes; i++) {
      videoPlanes[planeBase + ((bufferofs + i) & 0xffff)] = expanded[sourceBase + i];
    }
  }
  return { expandedBytes: planeBytes * 4, planeBytes, bufferofs };
}

export function CAL_SetupAudioFile(AUDIOHED: Uint8Array = requiredFile("AUDIOHED")): CacheManagerSummary {
  setupAudioStarts(AUDIOHED);
  return CA_DebugCacheState();
}

export function CAL_SetupGrFile(
  VGAHEAD: Uint8Array = requiredFile("VGAHEAD"),
  VGADICT: Uint8Array = requiredFile("VGADICT"),
): CacheManagerSummary {
  grstarts = readGraphicOffsets(VGAHEAD);
  grhuffman = readHuffNodes(VGADICT);
  return CA_DebugCacheState();
}

export function CAL_SetupMapFile(
  MAPHEAD: Uint8Array = requiredFile("MAPHEAD"),
  GAMEMAPS: Uint8Array = requiredFile("GAMEMAPS"),
): CacheManagerSummary {
  tinf = readMapFile(MAPHEAD, GAMEMAPS);
  for (let i = 0; i < NUMMAPS; i++) {
    mapheaderseg[i] = tinf.headers[i];
  }
  for (let i = 0; i < MAPPLANES; i++) {
    mapsegs[i] = new Uint16Array(MAPSIZE * MAPSIZE);
  }
  return CA_DebugCacheState();
}

export function GRFILEPOS(chunk: number, starts: readonly number[] = grstarts): number {
  return starts[chunk] ?? -1;
}

export function CA_MarkGrChunk(chunk: number): CacheManagerSummary {
  grneeded[chunk] |= ca_levelbit;
  return CA_DebugCacheState();
}

export function UNCACHEGRCHUNK(chunk: number): CacheManagerSummary {
  grsegs[chunk] = null;
  grneeded[chunk] &= (~ca_levelbit) & 0xff;
  grpurge[chunk] = 0;
  return CA_DebugCacheState();
}

function setupAudioStarts(AUDIOHED: Uint8Array): void {
  audiostarts = [];
  for (let i = 0; i < NUMSNDCHUNKS + 1; i++) {
    audiostarts.push(readU32LE(AUDIOHED, i * 4));
  }
}

function requiredMapFile(): MapFile {
  if (!tinf) {
    if (cacheFiles.MAPHEAD && cacheFiles.GAMEMAPS) {
      CAL_SetupMapFile(cacheFiles.MAPHEAD, cacheFiles.GAMEMAPS);
    } else {
      throw new Error("ID_CA map file is not set up");
    }
  }
  if (!tinf) {
    throw new Error("ID_CA map file setup failed");
  }
  return tinf;
}

function requiredFile<K extends keyof CacheFiles>(name: K): CacheFiles[K] {
  const file = cacheFiles[name];
  if (!file) {
    throw new Error(`ID_CA ${name} data is not set up`);
  }
  return file;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // ID_CA.C
// 
// // this has been customized for WOLF
// 
// /*
// =============================================================================
// 
// Id Software Caching Manager
// ---------------------------
// 
// Must be started BEFORE the memory manager, because it needs to get the headers
// loaded into the data segment
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
// #define THREEBYTEGRSTARTS
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// typedef struct
// {
//   unsigned bit0,bit1;	// 0-255 is a character, > is a pointer to a node
// } huffnode;
// 
// 
// typedef struct
// {
// 	unsigned	RLEWtag;
// 	long		headeroffsets[100];
// 	byte		tileinfo[];
// } mapfiletype;
// 
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// byte 		_seg	*tinf;
// int			mapon;
// 
// unsigned	_seg	*mapsegs[MAPPLANES];
// maptype		_seg	*mapheaderseg[NUMMAPS];
// byte		_seg	*audiosegs[NUMSNDCHUNKS];
// void		_seg	*grsegs[NUMCHUNKS];
// 
// byte		far	grneeded[NUMCHUNKS];
// byte		ca_levelbit,ca_levelnum;
// 
// int			profilehandle,debughandle;
// 
// char		audioname[13]="AUDIO.";
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// extern	long	far	CGAhead;
// extern	long	far	EGAhead;
// extern	byte	CGAdict;
// extern	byte	EGAdict;
// extern	byte	far	maphead;
// extern	byte	mapdict;
// extern	byte	far	audiohead;
// extern	byte	audiodict;
// 
// 
// char extension[5],	// Need a string, not constant to change cache files
//      gheadname[10]=GREXT"HEAD.",
//      gfilename[10]=GREXT"GRAPH.",
//      gdictname[10]=GREXT"DICT.",
//      mheadname[10]="MAPHEAD.",
//      mfilename[10]="MAPTEMP.",
//      aheadname[10]="AUDIOHED.",
//      afilename[10]="AUDIOT.";
// 
// void CA_CannotOpen(char *string);
// 
// long		_seg *grstarts;	// array of offsets in egagraph, -1 for sparse
// long		_seg *audiostarts;	// array of offsets in audio / audiot
// 
// #ifdef GRHEADERLINKED
// huffnode	*grhuffman;
// #else
// huffnode	grhuffman[255];
// #endif
// 
// #ifdef AUDIOHEADERLINKED
// huffnode	*audiohuffman;
// #else
// huffnode	audiohuffman[255];
// #endif
// 
// 
// int			grhandle;		// handle to EGAGRAPH
// int			maphandle;		// handle to MAPTEMP / GAMEMAPS
// int			audiohandle;	// handle to AUDIOT / AUDIO
// 
// long		chunkcomplen,chunkexplen;
// 
// SDMode		oldsoundmode;
// 
// 
// 
// void	CAL_CarmackExpand (unsigned far *source, unsigned far *dest,
// 		unsigned length);
// 
// 
// #ifdef THREEBYTEGRSTARTS
// #define FILEPOSSIZE	3
// //#define	GRFILEPOS(c) (*(long far *)(((byte far *)grstarts)+(c)*3)&0xffffff)
// long GRFILEPOS(int c)
// {
// 	long value;
// 	int	offset;
// 
// 	offset = c*3;
// 
// 	value = *(long far *)(((byte far *)grstarts)+offset);
// 
// 	value &= 0x00ffffffl;
// 
// 	if (value == 0xffffffl)
// 		value = -1;
// 
// 	return value;
// };
// #else
// #define FILEPOSSIZE	4
// #define	GRFILEPOS(c) (grstarts[c])
// #endif
// 
// /*
// =============================================================================
// 
// 					   LOW LEVEL ROUTINES
// 
// =============================================================================
// */
// 
// /*
// ============================
// =
// = CA_OpenDebug / CA_CloseDebug
// =
// = Opens a binary file with the handle "debughandle"
// =
// ============================
// */
// 
// void CA_OpenDebug (void)
// {
// 	unlink ("DEBUG.TXT");
// 	debughandle = open("DEBUG.TXT", O_CREAT | O_WRONLY | O_TEXT);
// }
// 
// void CA_CloseDebug (void)
// {
// 	close (debughandle);
// }
// 
// 
// 
// /*
// ============================
// =
// = CAL_GetGrChunkLength
// =
// = Gets the length of an explicit length chunk (not tiles)
// = The file pointer is positioned so the compressed data can be read in next.
// =
// ============================
// */
// 
// void CAL_GetGrChunkLength (int chunk)
// {
// 	lseek(grhandle,GRFILEPOS(chunk),SEEK_SET);
// 	read(grhandle,&chunkexplen,sizeof(chunkexplen));
// 	chunkcomplen = GRFILEPOS(chunk+1)-GRFILEPOS(chunk)-4;
// }
// 
// 
// /*
// ==========================
// =
// = CA_FarRead
// =
// = Read from a file to a far pointer
// =
// ==========================
// */
// 
// boolean CA_FarRead (int handle, byte far *dest, long length)
// {
// 	if (length>0xffffl)
// 		Quit ("CA_FarRead doesn't support 64K reads yet!");
// 
// asm		push	ds
// asm		mov	bx,[handle]
// asm		mov	cx,[WORD PTR length]
// asm		mov	dx,[WORD PTR dest]
// asm		mov	ds,[WORD PTR dest+2]
// asm		mov	ah,0x3f				// READ w/handle
// asm		int	21h
// asm		pop	ds
// asm		jnc	good
// 	errno = _AX;
// 	return	false;
// good:
// asm		cmp	ax,[WORD PTR length]
// asm		je	done
// 	errno = EINVFMT;			// user manager knows this is bad read
// 	return	false;
// done:
// 	return	true;
// }
// 
// 
// /*
// ==========================
// =
// = CA_SegWrite
// =
// = Write from a file to a far pointer
// =
// ==========================
// */
// 
// boolean CA_FarWrite (int handle, byte far *source, long length)
// {
// 	if (length>0xffffl)
// 		Quit ("CA_FarWrite doesn't support 64K reads yet!");
// 
// asm		push	ds
// asm		mov	bx,[handle]
// asm		mov	cx,[WORD PTR length]
// asm		mov	dx,[WORD PTR source]
// asm		mov	ds,[WORD PTR source+2]
// asm		mov	ah,0x40			// WRITE w/handle
// asm		int	21h
// asm		pop	ds
// asm		jnc	good
// 	errno = _AX;
// 	return	false;
// good:
// asm		cmp	ax,[WORD PTR length]
// asm		je	done
// 	errno = ENOMEM;				// user manager knows this is bad write
// 	return	false;
// 
// done:
// 	return	true;
// }
// 
// 
// /*
// ==========================
// =
// = CA_ReadFile
// =
// = Reads a file into an allready allocated buffer
// =
// ==========================
// */
// 
// boolean CA_ReadFile (char *filename, memptr *ptr)
// {
// 	int handle;
// 	long size;
// 
// 	if ((handle = open(filename,O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		return false;
// 
// 	size = filelength (handle);
// 	if (!CA_FarRead (handle,*ptr,size))
// 	{
// 		close (handle);
// 		return false;
// 	}
// 	close (handle);
// 	return true;
// }
// 
// 
// /*
// ==========================
// =
// = CA_WriteFile
// =
// = Writes a file from a memory buffer
// =
// ==========================
// */
// 
// boolean CA_WriteFile (char *filename, void far *ptr, long length)
// {
// 	int handle;
// 	long size;
// 
// 	handle = open(filename,O_CREAT | O_BINARY | O_WRONLY,
// 				S_IREAD | S_IWRITE | S_IFREG);
// 
// 	if (handle == -1)
// 		return false;
// 
// 	if (!CA_FarWrite (handle,ptr,length))
// 	{
// 		close (handle);
// 		return false;
// 	}
// 	close (handle);
// 	return true;
// }
// 
// 
// 
// /*
// ==========================
// =
// = CA_LoadFile
// =
// = Allocate space for and load a file
// =
// ==========================
// */
// 
// boolean CA_LoadFile (char *filename, memptr *ptr)
// {
// 	int handle;
// 	long size;
// 
// 	if ((handle = open(filename,O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		return false;
// 
// 	size = filelength (handle);
// 	MM_GetPtr (ptr,size);
// 	if (!CA_FarRead (handle,*ptr,size))
// 	{
// 		close (handle);
// 		return false;
// 	}
// 	close (handle);
// 	return true;
// }
// 
// /*
// ============================================================================
// 
// 		COMPRESSION routines, see JHUFF.C for more
// 
// ============================================================================
// */
// 
// 
// 
// /*
// ===============
// =
// = CAL_OptimizeNodes
// =
// = Goes through a huffman table and changes the 256-511 node numbers to the
// = actular address of the node.  Must be called before CAL_HuffExpand
// =
// ===============
// */
// 
// void CAL_OptimizeNodes (huffnode *table)
// {
//   huffnode *node;
//   int i;
// 
//   node = table;
// 
//   for (i=0;i<255;i++)
//   {
// 	if (node->bit0 >= 256)
// 	  node->bit0 = (unsigned)(table+(node->bit0-256));
// 	if (node->bit1 >= 256)
// 	  node->bit1 = (unsigned)(table+(node->bit1-256));
// 	node++;
//   }
// }
// 
// 
// 
// /*
// ======================
// =
// = CAL_HuffExpand
// =
// = Length is the length of the EXPANDED data
// = If screenhack, the data is decompressed in four planes directly
// = to the screen
// =
// ======================
// */
// 
// void CAL_HuffExpand (byte huge *source, byte huge *dest,
//   long length,huffnode *hufftable, boolean screenhack)
// {
// //  unsigned bit,byte,node,code;
//   unsigned sourceseg,sourceoff,destseg,destoff,endoff;
//   huffnode *headptr;
//   byte		mapmask;
// //  huffnode *nodeon;
// 
//   headptr = hufftable+254;	// head node is allways node 254
// 
//   source++;	// normalize
//   source--;
//   dest++;
//   dest--;
// 
//   if (screenhack)
//   {
// 	mapmask = 1;
// asm	mov	dx,SC_INDEX
// asm	mov	ax,SC_MAPMASK + 256
// asm	out	dx,ax
// 	length >>= 2;
//   }
// 
//   sourceseg = FP_SEG(source);
//   sourceoff = FP_OFF(source);
//   destseg = FP_SEG(dest);
//   destoff = FP_OFF(dest);
//   endoff = destoff+length;
// 
// //
// // ds:si source
// // es:di dest
// // ss:bx node pointer
// //
// 
// 	if (length <0xfff0)
// 	{
// 
// //--------------------------
// // expand less than 64k of data
// //--------------------------
// 
// asm mov	bx,[headptr]
// 
// asm	mov	si,[sourceoff]
// asm	mov	di,[destoff]
// asm	mov	es,[destseg]
// asm	mov	ds,[sourceseg]
// asm	mov	ax,[endoff]
// 
// asm	mov	ch,[si]				// load first byte
// asm	inc	si
// asm	mov	cl,1
// 
// expandshort:
// asm	test	ch,cl			// bit set?
// asm	jnz	bit1short
// asm	mov	dx,[ss:bx]			// take bit0 path from node
// asm	shl	cl,1				// advance to next bit position
// asm	jc	newbyteshort
// asm	jnc	sourceupshort
// 
// bit1short:
// asm	mov	dx,[ss:bx+2]		// take bit1 path
// asm	shl	cl,1				// advance to next bit position
// asm	jnc	sourceupshort
// 
// newbyteshort:
// asm	mov	ch,[si]				// load next byte
// asm	inc	si
// asm	mov	cl,1				// back to first bit
// 
// sourceupshort:
// asm	or	dh,dh				// if dx<256 its a byte, else move node
// asm	jz	storebyteshort
// asm	mov	bx,dx				// next node = (huffnode *)code
// asm	jmp	expandshort
// 
// storebyteshort:
// asm	mov	[es:di],dl
// asm	inc	di					// write a decopmpressed byte out
// asm	mov	bx,[headptr]		// back to the head node for next bit
// 
// asm	cmp	di,ax				// done?
// asm	jne	expandshort
// 
// //
// // perform screenhack if needed
// //
// asm	test	[screenhack],1
// asm	jz	notscreen
// asm	shl	[mapmask],1
// asm	mov	ah,[mapmask]
// asm	cmp	ah,16
// asm	je	notscreen			// all four planes done
// asm	mov	dx,SC_INDEX
// asm	mov	al,SC_MAPMASK
// asm	out	dx,ax
// asm	mov	di,[destoff]
// asm	mov	ax,[endoff]
// asm	jmp	expandshort
// 
// notscreen:;
// 	}
// 	else
// 	{
// 
// //--------------------------
// // expand more than 64k of data
// //--------------------------
// 
//   length--;
// 
// asm mov	bx,[headptr]
// asm	mov	cl,1
// 
// asm	mov	si,[sourceoff]
// asm	mov	di,[destoff]
// asm	mov	es,[destseg]
// asm	mov	ds,[sourceseg]
// 
// asm	lodsb			// load first byte
// 
// expand:
// asm	test	al,cl		// bit set?
// asm	jnz	bit1
// asm	mov	dx,[ss:bx]	// take bit0 path from node
// asm	jmp	gotcode
// bit1:
// asm	mov	dx,[ss:bx+2]	// take bit1 path
// 
// gotcode:
// asm	shl	cl,1		// advance to next bit position
// asm	jnc	sourceup
// asm	lodsb
// asm	cmp	si,0x10		// normalize ds:si
// asm  	jb	sinorm
// asm	mov	cx,ds
// asm	inc	cx
// asm	mov	ds,cx
// asm	xor	si,si
// sinorm:
// asm	mov	cl,1		// back to first bit
// 
// sourceup:
// asm	or	dh,dh		// if dx<256 its a byte, else move node
// asm	jz	storebyte
// asm	mov	bx,dx		// next node = (huffnode *)code
// asm	jmp	expand
// 
// storebyte:
// asm	mov	[es:di],dl
// asm	inc	di		// write a decopmpressed byte out
// asm	mov	bx,[headptr]	// back to the head node for next bit
// 
// asm	cmp	di,0x10		// normalize es:di
// asm  	jb	dinorm
// asm	mov	dx,es
// asm	inc	dx
// asm	mov	es,dx
// asm	xor	di,di
// dinorm:
// 
// asm	sub	[WORD PTR ss:length],1
// asm	jnc	expand
// asm  	dec	[WORD PTR ss:length+2]
// asm	jns	expand		// when length = ffff ffff, done
// 
// 	}
// 
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// }
// 
// 
// /*
// ======================
// =
// = CAL_CarmackExpand
// =
// = Length is the length of the EXPANDED data
// =
// ======================
// */
// 
// #define NEARTAG	0xa7
// #define FARTAG	0xa8
// 
// void CAL_CarmackExpand (unsigned far *source, unsigned far *dest, unsigned length)
// {
// 	unsigned	ch,chhigh,count,offset;
// 	unsigned	far *copyptr, far *inptr, far *outptr;
// 
// 	length/=2;
// 
// 	inptr = source;
// 	outptr = dest;
// 
// 	while (length)
// 	{
// 		ch = *inptr++;
// 		chhigh = ch>>8;
// 		if (chhigh == NEARTAG)
// 		{
// 			count = ch&0xff;
// 			if (!count)
// 			{				// have to insert a word containing the tag byte
// 				ch |= *((unsigned char far *)inptr)++;
// 				*outptr++ = ch;
// 				length--;
// 			}
// 			else
// 			{
// 				offset = *((unsigned char far *)inptr)++;
// 				copyptr = outptr - offset;
// 				length -= count;
// 				while (count--)
// 					*outptr++ = *copyptr++;
// 			}
// 		}
// 		else if (chhigh == FARTAG)
// 		{
// 			count = ch&0xff;
// 			if (!count)
// 			{				// have to insert a word containing the tag byte
// 				ch |= *((unsigned char far *)inptr)++;
// 				*outptr++ = ch;
// 				length --;
// 			}
// 			else
// 			{
// 				offset = *inptr++;
// 				copyptr = dest + offset;
// 				length -= count;
// 				while (count--)
// 					*outptr++ = *copyptr++;
// 			}
// 		}
// 		else
// 		{
// 			*outptr++ = ch;
// 			length --;
// 		}
// 	}
// }
// 
// 
// 
// /*
// ======================
// =
// = CA_RLEWcompress
// =
// ======================
// */
// 
// long CA_RLEWCompress (unsigned huge *source, long length, unsigned huge *dest,
//   unsigned rlewtag)
// {
//   long complength;
//   unsigned value,count,i;
//   unsigned huge *start,huge *end;
// 
//   start = dest;
// 
//   end = source + (length+1)/2;
// 
// //
// // compress it
// //
//   do
//   {
// 	count = 1;
// 	value = *source++;
// 	while (*source == value && source<end)
// 	{
// 	  count++;
// 	  source++;
// 	}
// 	if (count>3 || value == rlewtag)
// 	{
//     //
//     // send a tag / count / value string
//     //
//       *dest++ = rlewtag;
//       *dest++ = count;
//       *dest++ = value;
//     }
//     else
//     {
//     //
//     // send word without compressing
//     //
//       for (i=1;i<=count;i++)
// 	*dest++ = value;
// 	}
// 
//   } while (source<end);
// 
//   complength = 2*(dest-start);
//   return complength;
// }
// 
// 
// /*
// ======================
// =
// = CA_RLEWexpand
// = length is EXPANDED length
// =
// ======================
// */
// 
// void CA_RLEWexpand (unsigned huge *source, unsigned huge *dest,long length,
//   unsigned rlewtag)
// {
// //  unsigned value,count,i;
//   unsigned huge *end;
//   unsigned sourceseg,sourceoff,destseg,destoff,endseg,endoff;
// 
// 
// //
// // expand it
// //
// #if 0
//   do
//   {
// 	value = *source++;
// 	if (value != rlewtag)
// 	//
// 	// uncompressed
// 	//
// 	  *dest++=value;
// 	else
// 	{
// 	//
// 	// compressed string
// 	//
// 	  count = *source++;
// 	  value = *source++;
// 	  for (i=1;i<=count;i++)
// 	*dest++ = value;
// 	}
//   } while (dest<end);
// #endif
// 
//   end = dest + (length)/2;
//   sourceseg = FP_SEG(source);
//   sourceoff = FP_OFF(source);
//   destseg = FP_SEG(dest);
//   destoff = FP_OFF(dest);
//   endseg = FP_SEG(end);
//   endoff = FP_OFF(end);
// 
// 
// //
// // ax = source value
// // bx = tag value
// // cx = repeat counts
// // dx = scratch
// //
// // NOTE: A repeat count that produces 0xfff0 bytes can blow this!
// //
// 
// asm	mov	bx,rlewtag
// asm	mov	si,sourceoff
// asm	mov	di,destoff
// asm	mov	es,destseg
// asm	mov	ds,sourceseg
// 
// expand:
// asm	lodsw
// asm	cmp	ax,bx
// asm	je	repeat
// asm	stosw
// asm	jmp	next
// 
// repeat:
// asm	lodsw
// asm	mov	cx,ax		// repeat count
// asm	lodsw			// repeat value
// asm	rep stosw
// 
// next:
// 
// asm	cmp	si,0x10		// normalize ds:si
// asm  	jb	sinorm
// asm	mov	ax,si
// asm	shr	ax,1
// asm	shr	ax,1
// asm	shr	ax,1
// asm	shr	ax,1
// asm	mov	dx,ds
// asm	add	dx,ax
// asm	mov	ds,dx
// asm	and	si,0xf
// sinorm:
// asm	cmp	di,0x10		// normalize es:di
// asm  	jb	dinorm
// asm	mov	ax,di
// asm	shr	ax,1
// asm	shr	ax,1
// asm	shr	ax,1
// asm	shr	ax,1
// asm	mov	dx,es
// asm	add	dx,ax
// asm	mov	es,dx
// asm	and	di,0xf
// dinorm:
// 
// asm	cmp     di,ss:endoff
// asm	jne	expand
// asm	mov	ax,es
// asm	cmp	ax,ss:endseg
// asm	jb	expand
// 
// asm	mov	ax,ss
// asm	mov	ds,ax
// 
// }
// 
// 
// 
// /*
// =============================================================================
// 
// 					 CACHE MANAGER ROUTINES
// 
// =============================================================================
// */
// 
// 
// /*
// ======================
// =
// = CAL_SetupGrFile
// =
// ======================
// */
// 
// void CAL_SetupGrFile (void)
// {
// 	char fname[13];
// 	int handle;
// 	memptr compseg;
// 
// #ifdef GRHEADERLINKED
// 
// 	grhuffman = (huffnode *)&EGAdict;
// 	grstarts = (long _seg *)FP_SEG(&EGAhead);
// 
// 	CAL_OptimizeNodes (grhuffman);
// 
// #else
// 
// //
// // load ???dict.ext (huffman dictionary for graphics files)
// //
// 
// 	strcpy(fname,gdictname);
// 	strcat(fname,extension);
// 
// 	if ((handle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// 
// 	read(handle, &grhuffman, sizeof(grhuffman));
// 	close(handle);
// 	CAL_OptimizeNodes (grhuffman);
// //
// // load the data offsets from ???head.ext
// //
// 	MM_GetPtr (&(memptr)grstarts,(NUMCHUNKS+1)*FILEPOSSIZE);
// 
// 	strcpy(fname,gheadname);
// 	strcat(fname,extension);
// 
// 	if ((handle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// 
// 	CA_FarRead(handle, (memptr)grstarts, (NUMCHUNKS+1)*FILEPOSSIZE);
// 
// 	close(handle);
// 
// 
// #endif
// 
// //
// // Open the graphics file, leaving it open until the game is finished
// //
// 	strcpy(fname,gfilename);
// 	strcat(fname,extension);
// 
// 	grhandle = open(fname, O_RDONLY | O_BINARY);
// 	if (grhandle == -1)
// 		CA_CannotOpen(fname);
// 
// 
// //
// // load the pic and sprite headers into the arrays in the data segment
// //
// 	MM_GetPtr(&(memptr)pictable,NUMPICS*sizeof(pictabletype));
// 	CAL_GetGrChunkLength(STRUCTPIC);		// position file pointer
// 	MM_GetPtr(&compseg,chunkcomplen);
// 	CA_FarRead (grhandle,compseg,chunkcomplen);
// 	CAL_HuffExpand (compseg, (byte huge *)pictable,NUMPICS*sizeof(pictabletype),grhuffman,false);
// 	MM_FreePtr(&compseg);
// }
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = CAL_SetupMapFile
// =
// ======================
// */
// 
// void CAL_SetupMapFile (void)
// {
// 	int	i;
// 	int handle;
// 	long length,pos;
// 	char fname[13];
// 
// //
// // load maphead.ext (offsets and tileinfo for map file)
// //
// #ifndef MAPHEADERLINKED
// 	strcpy(fname,mheadname);
// 	strcat(fname,extension);
// 
// 	if ((handle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// 
// 	length = filelength(handle);
// 	MM_GetPtr (&(memptr)tinf,length);
// 	CA_FarRead(handle, tinf, length);
// 	close(handle);
// #else
// 
// 	tinf = (byte _seg *)FP_SEG(&maphead);
// 
// #endif
// 
// //
// // open the data file
// //
// #ifdef CARMACIZED
// 	strcpy(fname,"GAMEMAPS.");
// 	strcat(fname,extension);
// 
// 	if ((maphandle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// #else
// 	strcpy(fname,mfilename);
// 	strcat(fname,extension);
// 
// 	if ((maphandle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// #endif
// 
// //
// // load all map header
// //
// 	for (i=0;i<NUMMAPS;i++)
// 	{
// 		pos = ((mapfiletype	_seg *)tinf)->headeroffsets[i];
// 		if (pos<0)						// $FFFFFFFF start is a sparse map
// 			continue;
// 
// 		MM_GetPtr(&(memptr)mapheaderseg[i],sizeof(maptype));
// 		MM_SetLock(&(memptr)mapheaderseg[i],true);
// 		lseek(maphandle,pos,SEEK_SET);
// 		CA_FarRead (maphandle,(memptr)mapheaderseg[i],sizeof(maptype));
// 	}
// 
// //
// // allocate space for 3 64*64 planes
// //
// 	for (i=0;i<MAPPLANES;i++)
// 	{
// 		MM_GetPtr (&(memptr)mapsegs[i],64*64*2);
// 		MM_SetLock (&(memptr)mapsegs[i],true);
// 	}
// }
// 
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = CAL_SetupAudioFile
// =
// ======================
// */
// 
// void CAL_SetupAudioFile (void)
// {
// 	int handle;
// 	long length;
// 	char fname[13];
// 
// //
// // load maphead.ext (offsets and tileinfo for map file)
// //
// #ifndef AUDIOHEADERLINKED
// 	strcpy(fname,aheadname);
// 	strcat(fname,extension);
// 
// 	if ((handle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// 
// 	length = filelength(handle);
// 	MM_GetPtr (&(memptr)audiostarts,length);
// 	CA_FarRead(handle, (byte far *)audiostarts, length);
// 	close(handle);
// #else
// 	audiohuffman = (huffnode *)&audiodict;
// 	CAL_OptimizeNodes (audiohuffman);
// 	audiostarts = (long _seg *)FP_SEG(&audiohead);
// #endif
// 
// //
// // open the data file
// //
// #ifndef AUDIOHEADERLINKED
// 	strcpy(fname,afilename);
// 	strcat(fname,extension);
// 
// 	if ((audiohandle = open(fname,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		CA_CannotOpen(fname);
// #else
// 	if ((audiohandle = open("AUDIO."EXTENSION,
// 		 O_RDONLY | O_BINARY, S_IREAD)) == -1)
// 		Quit ("Can't open AUDIO."EXTENSION"!");
// #endif
// }
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = CA_Startup
// =
// = Open all files and load in headers
// =
// ======================
// */
// 
// void CA_Startup (void)
// {
// #ifdef PROFILE
// 	unlink ("PROFILE.TXT");
// 	profilehandle = open("PROFILE.TXT", O_CREAT | O_WRONLY | O_TEXT);
// #endif
// 
// 	CAL_SetupMapFile ();
// 	CAL_SetupGrFile ();
// 	CAL_SetupAudioFile ();
// 
// 	mapon = -1;
// 	ca_levelbit = 1;
// 	ca_levelnum = 0;
// 
// }
// 
// //==========================================================================
// 
// 
// /*
// ======================
// =
// = CA_Shutdown
// =
// = Closes all files
// =
// ======================
// */
// 
// void CA_Shutdown (void)
// {
// #ifdef PROFILE
// 	close (profilehandle);
// #endif
// 
// 	close (maphandle);
// 	close (grhandle);
// 	close (audiohandle);
// }
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_CacheAudioChunk
// =
// ======================
// */
// 
// void CA_CacheAudioChunk (int chunk)
// {
// 	long	pos,compressed;
// #ifdef AUDIOHEADERLINKED
// 	long	expanded;
// 	memptr	bigbufferseg;
// 	byte	far *source;
// #endif
// 
// 	if (audiosegs[chunk])
// 	{
// 		MM_SetPurge (&(memptr)audiosegs[chunk],0);
// 		return;							// allready in memory
// 	}
// 
// //
// // load the chunk into a buffer, either the miscbuffer if it fits, or allocate
// // a larger buffer
// //
// 	pos = audiostarts[chunk];
// 	compressed = audiostarts[chunk+1]-pos;
// 
// 	lseek(audiohandle,pos,SEEK_SET);
// 
// #ifndef AUDIOHEADERLINKED
// 
// 	MM_GetPtr (&(memptr)audiosegs[chunk],compressed);
// 	if (mmerror)
// 		return;
// 
// 	CA_FarRead(audiohandle,audiosegs[chunk],compressed);
// 
// #else
// 
// 	if (compressed<=BUFFERSIZE)
// 	{
// 		CA_FarRead(audiohandle,bufferseg,compressed);
// 		source = bufferseg;
// 	}
// 	else
// 	{
// 		MM_GetPtr(&bigbufferseg,compressed);
// 		if (mmerror)
// 			return;
// 		MM_SetLock (&bigbufferseg,true);
// 		CA_FarRead(audiohandle,bigbufferseg,compressed);
// 		source = bigbufferseg;
// 	}
// 
// 	expanded = *(long far *)source;
// 	source += 4;			// skip over length
// 	MM_GetPtr (&(memptr)audiosegs[chunk],expanded);
// 	if (mmerror)
// 		goto done;
// 	CAL_HuffExpand (source,audiosegs[chunk],expanded,audiohuffman,false);
// 
// done:
// 	if (compressed>BUFFERSIZE)
// 		MM_FreePtr(&bigbufferseg);
// #endif
// }
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_LoadAllSounds
// =
// = Purges all sounds, then loads all new ones (mode switch)
// =
// ======================
// */
// 
// void CA_LoadAllSounds (void)
// {
// 	unsigned	start,i;
// 
// 	switch (oldsoundmode)
// 	{
// 	case sdm_Off:
// 		goto cachein;
// 	case sdm_PC:
// 		start = STARTPCSOUNDS;
// 		break;
// 	case sdm_AdLib:
// 		start = STARTADLIBSOUNDS;
// 		break;
// 	}
// 
// 	for (i=0;i<NUMSOUNDS;i++,start++)
// 		if (audiosegs[start])
// 			MM_SetPurge (&(memptr)audiosegs[start],3);		// make purgable
// 
// cachein:
// 
// 	switch (SoundMode)
// 	{
// 	case sdm_Off:
// 		return;
// 	case sdm_PC:
// 		start = STARTPCSOUNDS;
// 		break;
// 	case sdm_AdLib:
// 		start = STARTADLIBSOUNDS;
// 		break;
// 	}
// 
// 	for (i=0;i<NUMSOUNDS;i++,start++)
// 		CA_CacheAudioChunk (start);
// 
// 	oldsoundmode = SoundMode;
// }
// 
// //===========================================================================
// 
// 
// /*
// ======================
// =
// = CAL_ExpandGrChunk
// =
// = Does whatever is needed with a pointer to a compressed chunk
// =
// ======================
// */
// 
// void CAL_ExpandGrChunk (int chunk, byte far *source)
// {
// 	long	expanded;
// 
// 
// 	if (chunk >= STARTTILE8 && chunk < STARTEXTERNS)
// 	{
// 	//
// 	// expanded sizes of tile8/16/32 are implicit
// 	//
// 
// #define BLOCK		64
// #define MASKBLOCK	128
// 
// 		if (chunk<STARTTILE8M)			// tile 8s are all in one chunk!
// 			expanded = BLOCK*NUMTILE8;
// 		else if (chunk<STARTTILE16)
// 			expanded = MASKBLOCK*NUMTILE8M;
// 		else if (chunk<STARTTILE16M)	// all other tiles are one/chunk
// 			expanded = BLOCK*4;
// 		else if (chunk<STARTTILE32)
// 			expanded = MASKBLOCK*4;
// 		else if (chunk<STARTTILE32M)
// 			expanded = BLOCK*16;
// 		else
// 			expanded = MASKBLOCK*16;
// 	}
// 	else
// 	{
// 	//
// 	// everything else has an explicit size longword
// 	//
// 		expanded = *(long far *)source;
// 		source += 4;			// skip over length
// 	}
// 
// //
// // allocate final space, decompress it, and free bigbuffer
// // Sprites need to have shifts made and various other junk
// //
// 	MM_GetPtr (&grsegs[chunk],expanded);
// 	if (mmerror)
// 		return;
// 	CAL_HuffExpand (source,grsegs[chunk],expanded,grhuffman,false);
// }
// 
// 
// /*
// ======================
// =
// = CA_CacheGrChunk
// =
// = Makes sure a given chunk is in memory, loadiing it if needed
// =
// ======================
// */
// 
// void CA_CacheGrChunk (int chunk)
// {
// 	long	pos,compressed;
// 	memptr	bigbufferseg;
// 	byte	far *source;
// 	int		next;
// 
// 	grneeded[chunk] |= ca_levelbit;		// make sure it doesn't get removed
// 	if (grsegs[chunk])
// 	{
// 		MM_SetPurge (&grsegs[chunk],0);
// 		return;							// allready in memory
// 	}
// 
// //
// // load the chunk into a buffer, either the miscbuffer if it fits, or allocate
// // a larger buffer
// //
// 	pos = GRFILEPOS(chunk);
// 	if (pos<0)							// $FFFFFFFF start is a sparse tile
// 	  return;
// 
// 	next = chunk +1;
// 	while (GRFILEPOS(next) == -1)		// skip past any sparse tiles
// 		next++;
// 
// 	compressed = GRFILEPOS(next)-pos;
// 
// 	lseek(grhandle,pos,SEEK_SET);
// 
// 	if (compressed<=BUFFERSIZE)
// 	{
// 		CA_FarRead(grhandle,bufferseg,compressed);
// 		source = bufferseg;
// 	}
// 	else
// 	{
// 		MM_GetPtr(&bigbufferseg,compressed);
// 		MM_SetLock (&bigbufferseg,true);
// 		CA_FarRead(grhandle,bigbufferseg,compressed);
// 		source = bigbufferseg;
// 	}
// 
// 	CAL_ExpandGrChunk (chunk,source);
// 
// 	if (compressed>BUFFERSIZE)
// 		MM_FreePtr(&bigbufferseg);
// }
// 
// 
// 
// //==========================================================================
// 
// /*
// ======================
// =
// = CA_CacheScreen
// =
// = Decompresses a chunk from disk straight onto the screen
// =
// ======================
// */
// 
// void CA_CacheScreen (int chunk)
// {
// 	long	pos,compressed,expanded;
// 	memptr	bigbufferseg;
// 	byte	far *source;
// 	int		next;
// 
// //
// // load the chunk into a buffer
// //
// 	pos = GRFILEPOS(chunk);
// 	next = chunk +1;
// 	while (GRFILEPOS(next) == -1)		// skip past any sparse tiles
// 		next++;
// 	compressed = GRFILEPOS(next)-pos;
// 
// 	lseek(grhandle,pos,SEEK_SET);
// 
// 	MM_GetPtr(&bigbufferseg,compressed);
// 	MM_SetLock (&bigbufferseg,true);
// 	CA_FarRead(grhandle,bigbufferseg,compressed);
// 	source = bigbufferseg;
// 
// 	expanded = *(long far *)source;
// 	source += 4;			// skip over length
// 
// //
// // allocate final space, decompress it, and free bigbuffer
// // Sprites need to have shifts made and various other junk
// //
// 	CAL_HuffExpand (source,MK_FP(SCREENSEG,bufferofs),expanded,grhuffman,true);
// 	VW_MarkUpdateBlock (0,0,319,199);
// 	MM_FreePtr(&bigbufferseg);
// }
// 
// //==========================================================================
// 
// /*
// ======================
// =
// = CA_CacheMap
// =
// = WOLF: This is specialized for a 64*64 map size
// =
// ======================
// */
// 
// void CA_CacheMap (int mapnum)
// {
// 	long	pos,compressed;
// 	int		plane;
// 	memptr	*dest,bigbufferseg;
// 	unsigned	size;
// 	unsigned	far	*source;
// #ifdef CARMACIZED
// 	memptr	buffer2seg;
// 	long	expanded;
// #endif
// 
// 	mapon = mapnum;
// 
// //
// // load the planes into the allready allocated buffers
// //
// 	size = 64*64*2;
// 
// 	for (plane = 0; plane<MAPPLANES; plane++)
// 	{
// 		pos = mapheaderseg[mapnum]->planestart[plane];
// 		compressed = mapheaderseg[mapnum]->planelength[plane];
// 
// 		dest = &(memptr)mapsegs[plane];
// 
// 		lseek(maphandle,pos,SEEK_SET);
// 		if (compressed<=BUFFERSIZE)
// 			source = bufferseg;
// 		else
// 		{
// 			MM_GetPtr(&bigbufferseg,compressed);
// 			MM_SetLock (&bigbufferseg,true);
// 			source = bigbufferseg;
// 		}
// 
// 		CA_FarRead(maphandle,(byte far *)source,compressed);
// #ifdef CARMACIZED
// 		//
// 		// unhuffman, then unRLEW
// 		// The huffman'd chunk has a two byte expanded length first
// 		// The resulting RLEW chunk also does, even though it's not really
// 		// needed
// 		//
// 		expanded = *source;
// 		source++;
// 		MM_GetPtr (&buffer2seg,expanded);
// 		CAL_CarmackExpand (source, (unsigned far *)buffer2seg,expanded);
// 		CA_RLEWexpand (((unsigned far *)buffer2seg)+1,*dest,size,
// 		((mapfiletype _seg *)tinf)->RLEWtag);
// 		MM_FreePtr (&buffer2seg);
// 
// #else
// 		//
// 		// unRLEW, skipping expanded length
// 		//
// 		CA_RLEWexpand (source+1, *dest,size,
// 		((mapfiletype _seg *)tinf)->RLEWtag);
// #endif
// 
// 		if (compressed>BUFFERSIZE)
// 			MM_FreePtr(&bigbufferseg);
// 	}
// }
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_UpLevel
// =
// = Goes up a bit level in the needed lists and clears it out.
// = Everything is made purgable
// =
// ======================
// */
// 
// void CA_UpLevel (void)
// {
// 	int	i;
// 
// 	if (ca_levelnum==7)
// 		Quit ("CA_UpLevel: Up past level 7!");
// 
// 	for (i=0;i<NUMCHUNKS;i++)
// 		if (grsegs[i])
// 			MM_SetPurge (&(memptr)grsegs[i],3);
// 	ca_levelbit<<=1;
// 	ca_levelnum++;
// }
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_DownLevel
// =
// = Goes down a bit level in the needed lists and recaches
// = everything from the lower level
// =
// ======================
// */
// 
// void CA_DownLevel (void)
// {
// 	if (!ca_levelnum)
// 		Quit ("CA_DownLevel: Down past level 0!");
// 	ca_levelbit>>=1;
// 	ca_levelnum--;
// 	CA_CacheMarks();
// }
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_ClearMarks
// =
// = Clears out all the marks at the current level
// =
// ======================
// */
// 
// void CA_ClearMarks (void)
// {
// 	int i;
// 
// 	for (i=0;i<NUMCHUNKS;i++)
// 		grneeded[i]&=~ca_levelbit;
// }
// 
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_ClearAllMarks
// =
// = Clears out all the marks on all the levels
// =
// ======================
// */
// 
// void CA_ClearAllMarks (void)
// {
// 	_fmemset (grneeded,0,sizeof(grneeded));
// 	ca_levelbit = 1;
// 	ca_levelnum = 0;
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// ======================
// =
// = CA_FreeGraphics
// =
// ======================
// */
// 
// 
// void CA_SetGrPurge (void)
// {
// 	int i;
// 
// //
// // free graphics
// //
// 	CA_ClearMarks ();
// 
// 	for (i=0;i<NUMCHUNKS;i++)
// 		if (grsegs[i])
// 			MM_SetPurge (&(memptr)grsegs[i],3);
// }
// 
// 
// 
// /*
// ======================
// =
// = CA_SetAllPurge
// =
// = Make everything possible purgable
// =
// ======================
// */
// 
// void CA_SetAllPurge (void)
// {
// 	int i;
// 
// 
// //
// // free sounds
// //
// 	for (i=0;i<NUMSNDCHUNKS;i++)
// 		if (audiosegs[i])
// 			MM_SetPurge (&(memptr)audiosegs[i],3);
// 
// //
// // free graphics
// //
// 	CA_SetGrPurge ();
// }
// 
// 
// //===========================================================================
// 
// /*
// ======================
// =
// = CA_CacheMarks
// =
// ======================
// */
// #define MAXEMPTYREAD	1024
// 
// void CA_CacheMarks (void)
// {
// 	int 	i,next,numcache;
// 	long	pos,endpos,nextpos,nextendpos,compressed;
// 	long	bufferstart,bufferend;	// file position of general buffer
// 	byte	far *source;
// 	memptr	bigbufferseg;
// 
// 	numcache = 0;
// //
// // go through and make everything not needed purgable
// //
// 	for (i=0;i<NUMCHUNKS;i++)
// 		if (grneeded[i]&ca_levelbit)
// 		{
// 			if (grsegs[i])					// its allready in memory, make
// 				MM_SetPurge(&grsegs[i],0);	// sure it stays there!
// 			else
// 				numcache++;
// 		}
// 		else
// 		{
// 			if (grsegs[i])					// not needed, so make it purgeable
// 				MM_SetPurge(&grsegs[i],3);
// 		}
// 
// 	if (!numcache)			// nothing to cache!
// 		return;
// 
// 
// //
// // go through and load in anything still needed
// //
// 	bufferstart = bufferend = 0;		// nothing good in buffer now
// 
// 	for (i=0;i<NUMCHUNKS;i++)
// 		if ( (grneeded[i]&ca_levelbit) && !grsegs[i])
// 		{
// 			pos = GRFILEPOS(i);
// 			if (pos<0)
// 				continue;
// 
// 			next = i +1;
// 			while (GRFILEPOS(next) == -1)		// skip past any sparse tiles
// 				next++;
// 
// 			compressed = GRFILEPOS(next)-pos;
// 			endpos = pos+compressed;
// 
// 			if (compressed<=BUFFERSIZE)
// 			{
// 				if (bufferstart<=pos
// 				&& bufferend>= endpos)
// 				{
// 				// data is allready in buffer
// 					source = (byte _seg *)bufferseg+(pos-bufferstart);
// 				}
// 				else
// 				{
// 				// load buffer with a new block from disk
// 				// try to get as many of the needed blocks in as possible
// 					while ( next < NUMCHUNKS )
// 					{
// 						while (next < NUMCHUNKS &&
// 						!(grneeded[next]&ca_levelbit && !grsegs[next]))
// 							next++;
// 						if (next == NUMCHUNKS)
// 							continue;
// 
// 						nextpos = GRFILEPOS(next);
// 						while (GRFILEPOS(++next) == -1)	// skip past any sparse tiles
// 							;
// 						nextendpos = GRFILEPOS(next);
// 						if (nextpos - endpos <= MAXEMPTYREAD
// 						&& nextendpos-pos <= BUFFERSIZE)
// 							endpos = nextendpos;
// 						else
// 							next = NUMCHUNKS;			// read pos to posend
// 					}
// 
// 					lseek(grhandle,pos,SEEK_SET);
// 					CA_FarRead(grhandle,bufferseg,endpos-pos);
// 					bufferstart = pos;
// 					bufferend = endpos;
// 					source = bufferseg;
// 				}
// 			}
// 			else
// 			{
// 			// big chunk, allocate temporary buffer
// 				MM_GetPtr(&bigbufferseg,compressed);
// 				if (mmerror)
// 					return;
// 				MM_SetLock (&bigbufferseg,true);
// 				lseek(grhandle,pos,SEEK_SET);
// 				CA_FarRead(grhandle,bigbufferseg,compressed);
// 				source = bigbufferseg;
// 			}
// 
// 			CAL_ExpandGrChunk (i,source);
// 			if (mmerror)
// 				return;
// 
// 			if (compressed>BUFFERSIZE)
// 				MM_FreePtr(&bigbufferseg);
// 
// 		}
// }
// 
// void CA_CannotOpen(char *string)
// {
//  char str[30];
// 
//  strcpy(str,"Can't open ");
//  strcat(str,string);
//  strcat(str,"!\n");
//  Quit (str);
// }
