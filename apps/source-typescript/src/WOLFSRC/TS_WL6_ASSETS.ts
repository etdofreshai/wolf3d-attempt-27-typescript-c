import { readI32LE, readU16LE, readU24LE, readU32LE } from "./TS_C";

export const NUMMAPS = 60;
export const MAPPLANES = 2;
export const MAPSIZE = 64;
export const NUMCHUNKS = 149;
export const NUMSNDCHUNKS = 288;

export const STRUCTPIC = 0;
export const STARTFONT = 1;
export const STARTFONTM = 3;
export const STARTPICS = 3;
export const C_OPTIONSPIC = 10;
export const C_CURSOR1PIC = 11;
export const C_CURSOR2PIC = 12;
export const C_NOTSELECTEDPIC = 13;
export const C_SELECTEDPIC = 14;
export const C_FXTITLEPIC = 15;
export const C_DIGITITLEPIC = 16;
export const C_MUSICTITLEPIC = 17;
export const C_MOUSELBACKPIC = 18;
export const C_BABYMODEPIC = 19;
export const C_DISKLOADING1PIC = 24;
export const C_CONTROLPIC = 26;
export const C_CUSTOMIZEPIC = 27;
export const C_LOADGAMEPIC = 28;
export const C_SAVEGAMEPIC = 29;
export const C_EPISODE1PIC = 30;
export const C_EPISODE2PIC = 31;
export const C_EPISODE3PIC = 32;
export const C_EPISODE4PIC = 33;
export const C_EPISODE5PIC = 34;
export const C_EPISODE6PIC = 35;
export const C_JOY1PIC = 41;
export const C_JOY2PIC = 42;
export const L_GUYPIC = 43;
export const L_COLONPIC = 44;
export const L_NUM0PIC = 45;
export const L_PERCENTPIC = 55;
export const L_APIC = 56;
export const L_EXPOINTPIC = 82;
export const L_APOSTROPHEPIC = 83;
export const L_GUY2PIC = 84;
export const STATUSBARPIC = 86;
export const TITLEPIC = 87;
export const PG13PIC = 88;
export const CREDITSPIC = 89;
export const HIGHSCORESPIC = 90;
export const PAUSEDPIC = 133; // WL6 GFXV_WL6.H — the "PAUSED" latch pic (in the LATCHPICS range)
export const STARTTILE8 = 135;
export const STARTTILE8M = 136;
export const STARTTILE16 = 136;
export const STARTTILE16M = 136;
export const STARTTILE32 = 136;
export const STARTTILE32M = 136;
export const STARTEXTERNS = 136;
export const GETPSYCHEDPIC = 134;
export const CONTROLS_LUMP_START = 10;
export const CONTROLS_LUMP_END = 42;
export const LATCHPICS_LUMP_START = 91;
export const LATCHPICS_LUMP_END = 134;
export const NUMTILE8 = 72;
export const NUMTILE8M = 0;
export const NUMTILE16 = 0;
export const NUMTILE32 = 0;
export const HITWALLSND = 0;
export const MOVEGUN2SND = 4;
export const MOVEGUN1SND = 5;
export const SHOOTDOORSND = 28;
export const SHOOTSND = 32;
export const ESCPRESSEDSND = 39;

export interface MapType {
  readonly offset: number;
  readonly planestart: readonly [number, number, number];
  readonly planelength: readonly [number, number, number];
  readonly width: number;
  readonly height: number;
  readonly name: string;
}

export interface MapFile {
  readonly RLEWtag: number;
  readonly headers: readonly (MapType | null)[];
}

export interface VSwapFile {
  readonly ChunksInFile: number;
  readonly PMSpriteStart: number;
  readonly PMSoundStart: number;
  readonly pageOffsets: readonly number[];
  readonly pageLengths: readonly number[];
  readonly chunks: readonly (Uint8Array | null)[];
}

export interface HuffNode {
  readonly bit0: number;
  readonly bit1: number;
}

const decoder = new TextDecoder("ascii");

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset;
  while (end < offset + length && bytes[end] !== 0) {
    end++;
  }
  return decoder.decode(bytes.subarray(offset, end));
}

export function CAL_CarmackExpand(source: Uint8Array, length: number): Uint16Array {
  const NEARTAG = 0xa7;
  const FARTAG = 0xa8;
  const out = new Uint16Array(length / 2);
  let sourceOffset = 0;
  let outOffset = 0;
  let remainingWords = length / 2;

  while (remainingWords > 0) {
    let ch = readU16LE(source, sourceOffset);
    sourceOffset += 2;
    const chhigh = ch >> 8;

    if (chhigh === NEARTAG) {
      let count = ch & 0xff;
      if (!count) {
        ch |= source[sourceOffset++];
        out[outOffset++] = ch;
        remainingWords--;
      } else {
        const offset = source[sourceOffset++];
        let copyOffset = outOffset - offset;
        remainingWords -= count;
        while (count-- > 0) {
          out[outOffset++] = out[copyOffset++];
        }
      }
    } else if (chhigh === FARTAG) {
      let count = ch & 0xff;
      if (!count) {
        ch |= source[sourceOffset++];
        out[outOffset++] = ch;
        remainingWords--;
      } else {
        let copyOffset = readU16LE(source, sourceOffset);
        sourceOffset += 2;
        remainingWords -= count;
        while (count-- > 0) {
          out[outOffset++] = out[copyOffset++];
        }
      }
    } else {
      out[outOffset++] = ch;
      remainingWords--;
    }
  }

  return out;
}

export function CA_RLEWexpand(source: Uint16Array, length: number, rlewtag: number): Uint16Array {
  const dest = new Uint16Array(length / 2);
  let sourceOffset = 0;
  let destOffset = 0;

  while (destOffset < dest.length) {
    const value = source[sourceOffset++];
    if (value !== rlewtag) {
      dest[destOffset++] = value;
      continue;
    }

    const count = source[sourceOffset++];
    const repeated = source[sourceOffset++];
    dest.fill(repeated, destOffset, destOffset + count);
    destOffset += count;
  }

  return dest;
}

export function readMapFile(MAPHEAD: Uint8Array, GAMEMAPS: Uint8Array): MapFile {
  const RLEWtag = readU16LE(MAPHEAD, 0);
  const headers: (MapType | null)[] = [];

  for (let mapnum = 0; mapnum < NUMMAPS; mapnum++) {
    const offset = readI32LE(MAPHEAD, 2 + mapnum * 4);
    if (offset < 0) {
      headers.push(null);
      continue;
    }

    headers.push({
      offset,
      planestart: [
        readI32LE(GAMEMAPS, offset),
        readI32LE(GAMEMAPS, offset + 4),
        readI32LE(GAMEMAPS, offset + 8),
      ],
      planelength: [
        readU16LE(GAMEMAPS, offset + 12),
        readU16LE(GAMEMAPS, offset + 14),
        readU16LE(GAMEMAPS, offset + 16),
      ],
      width: readU16LE(GAMEMAPS, offset + 18),
      height: readU16LE(GAMEMAPS, offset + 20),
      name: ascii(GAMEMAPS, offset + 22, 16),
    });
  }

  return { RLEWtag, headers };
}

export function CA_CacheMap(mapnum: number, mapFile: MapFile, GAMEMAPS: Uint8Array): Uint16Array[] {
  const header = mapFile.headers[mapnum];
  if (!header) {
    throw new Error(`Map ${mapnum} is sparse.`);
  }

  const planes: Uint16Array[] = [];
  for (let plane = 0; plane < MAPPLANES; plane++) {
    const pos = header.planestart[plane];
    const compressed = header.planelength[plane];
    const source = GAMEMAPS.subarray(pos, pos + compressed);
    const expanded = readU16LE(source, 0);
    const carmacked = CAL_CarmackExpand(source.subarray(2), expanded);
    planes.push(CA_RLEWexpand(carmacked.subarray(1), MAPSIZE * MAPSIZE * 2, mapFile.RLEWtag));
  }
  return planes;
}

export function readGraphicOffsets(VGAHEAD: Uint8Array): number[] {
  const offsets: number[] = [];
  for (let chunk = 0; chunk < NUMCHUNKS + 1; chunk++) {
    offsets.push(readU24LE(VGAHEAD, chunk * 3));
  }
  return offsets;
}

export function readHuffNodes(VGADICT: Uint8Array): HuffNode[] {
  const nodes: HuffNode[] = [];
  for (let node = 0; node < 255; node++) {
    nodes.push({
      bit0: readU16LE(VGADICT, node * 4),
      bit1: readU16LE(VGADICT, node * 4 + 2),
    });
  }
  return nodes;
}

export function CAL_HuffExpand(source: Uint8Array, length: number, hufftable: readonly HuffNode[]): Uint8Array {
  const dest = new Uint8Array(length);
  let sourceOffset = 0;
  let destOffset = 0;
  let ch = source[sourceOffset++];
  let mask = 1;
  let nodeIndex = 254;

  while (destOffset < length) {
    const node = hufftable[nodeIndex];
    const value = ch & mask ? node.bit1 : node.bit0;

    mask <<= 1;
    if (mask === 0x100) {
      ch = source[sourceOffset++];
      mask = 1;
    }

    if (value < 256) {
      dest[destOffset++] = value;
      nodeIndex = 254;
    } else {
      nodeIndex = value - 256;
    }
  }

  return dest;
}

export function CAL_ExpandGrChunk(
  chunk: number,
  source: Uint8Array,
  hufftable: readonly HuffNode[],
): Uint8Array {
  const expanded =
    chunk >= STARTTILE8 && chunk < STARTEXTERNS
      ? implicitTileChunkLength(chunk)
      : readU32LE(source, 0);
  const payload = chunk >= STARTTILE8 && chunk < STARTEXTERNS ? source : source.subarray(4);
  return CAL_HuffExpand(payload, expanded, hufftable);
}

export function CA_CacheGrChunk(
  chunk: number,
  VGAHEAD: Uint8Array,
  VGAGRAPH: Uint8Array,
  VGADICT: Uint8Array,
): Uint8Array | null {
  const offsets = readGraphicOffsets(VGAHEAD);
  const pos = offsets[chunk];
  if (pos < 0) {
    return null;
  }

  let next = chunk + 1;
  while (offsets[next] === -1) {
    next++;
  }

  return CAL_ExpandGrChunk(
    chunk,
    VGAGRAPH.subarray(pos, offsets[next]),
    readHuffNodes(VGADICT),
  );
}

export function readAudioChunks(AUDIOHED: Uint8Array, AUDIOT: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let chunk = 0; chunk < NUMSNDCHUNKS; chunk++) {
    const start = readU32LE(AUDIOHED, chunk * 4);
    const end = readU32LE(AUDIOHED, (chunk + 1) * 4);
    chunks.push(AUDIOT.subarray(start, end));
  }
  return chunks;
}

export function readVswap(VSWAP: Uint8Array): VSwapFile {
  const ChunksInFile = readU16LE(VSWAP, 0);
  const PMSpriteStart = readU16LE(VSWAP, 2);
  const PMSoundStart = readU16LE(VSWAP, 4);
  const pageOffsets: number[] = [];
  const pageLengths: number[] = [];

  for (let chunk = 0; chunk < ChunksInFile; chunk++) {
    const raw = readU32LE(VSWAP, 6 + chunk * 4);
    pageOffsets.push(raw === 0xffffffff ? -1 : raw);
  }

  const pageLengthsOffset = 6 + ChunksInFile * 4;
  for (let chunk = 0; chunk < ChunksInFile; chunk++) {
    pageLengths.push(readU16LE(VSWAP, pageLengthsOffset + chunk * 2));
  }

  return {
    ChunksInFile,
    PMSpriteStart,
    PMSoundStart,
    pageOffsets,
    pageLengths,
    chunks: pageOffsets.map((offset, chunk) =>
      offset < 0 ? null : VSWAP.subarray(offset, offset + pageLengths[chunk]),
    ),
  };
}

function implicitTileChunkLength(chunk: number): number {
  if (chunk < STARTTILE8M) {
    return 64 * NUMTILE8;
  }
  if (chunk < STARTTILE16) {
    return 128 * NUMTILE8M;
  }
  if (chunk < STARTTILE16M) {
    return 64 * 4;
  }
  if (chunk < STARTTILE32) {
    return 128 * 4;
  }
  if (chunk < STARTTILE32M) {
    return 64 * NUMTILE16;
  }
  return 128 * NUMTILE32;
}
