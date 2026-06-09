const MAP_HEADER_SIZE = 38;
const MAP_OFFSET_COUNT = 100;
const DOS_MAP_COUNT = 60;
const MAP_PLANES_TO_DECODE = 2;
const NEAR_TAG = 0xa7;
const FAR_TAG = 0xa8;

export type MapHeader = {
  planestart: [number, number, number];
  planelength: [number, number, number];
  width: number;
  height: number;
  name: string;
};

export type MapHead = {
  rlewTag: number;
  headerOffsets: number[];
};

export type WolfMap = {
  index: number;
  header: MapHeader;
  planes: [Uint16Array, Uint16Array];
  source: {
    rlewTag: number;
    expandedPlaneBytes: number;
  };
};

export type PlayerSpawn = {
  x: number;
  y: number;
  angle: number;
  tile: number;
};

export async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export function parseMapHead(bytes: Uint8Array): MapHead {
  const minimumLength = 2 + MAP_OFFSET_COUNT * 4;
  if (bytes.byteLength < minimumLength) {
    throw new Error(`MAPHEAD is too short: expected at least ${minimumLength} bytes.`);
  }

  const view = toDataView(bytes);
  const headerOffsets: number[] = [];

  for (let index = 0; index < MAP_OFFSET_COUNT; index += 1) {
    headerOffsets.push(view.getInt32(2 + index * 4, true));
  }

  return {
    rlewTag: view.getUint16(0, true),
    headerOffsets
  };
}

export function parseWolfMap(
  mapHeadBytes: Uint8Array,
  gameMapsBytes: Uint8Array,
  mapIndex = 0
): WolfMap {
  if (mapIndex < 0 || mapIndex >= DOS_MAP_COUNT) {
    throw new Error(`Map index ${mapIndex} is outside the WL6 DOS range 0-${DOS_MAP_COUNT - 1}.`);
  }

  const mapHead = parseMapHead(mapHeadBytes);
  const offset = mapHead.headerOffsets[mapIndex];

  if (offset === undefined || offset < 0) {
    throw new Error(`Map ${mapIndex} is sparse or missing in MAPHEAD.`);
  }

  const header = parseMapHeader(gameMapsBytes, offset);
  const planeWordCount = header.width * header.height;
  const expandedPlaneBytes = planeWordCount * 2;
  const planes: Uint16Array[] = [];

  for (let plane = 0; plane < MAP_PLANES_TO_DECODE; plane += 1) {
    planes.push(decodePlane(gameMapsBytes, header, plane, mapHead.rlewTag, expandedPlaneBytes));
  }

  return {
    index: mapIndex,
    header,
    planes: [planes[0] ?? new Uint16Array(planeWordCount), planes[1] ?? new Uint16Array(planeWordCount)],
    source: {
      rlewTag: mapHead.rlewTag,
      expandedPlaneBytes
    }
  };
}

export function findPlayerSpawn(map: WolfMap): PlayerSpawn {
  const objects = map.planes[1];
  const { width, height } = map.header;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = objects[y * width + x] ?? 0;
      const angle = spawnAngleForTile(tile);

      if (angle !== null) {
        return {
          x: x + 0.5,
          y: y + 0.5,
          angle,
          tile
        };
      }
    }
  }

  return firstOpenTile(map);
}

function parseMapHeader(bytes: Uint8Array, offset: number): MapHeader {
  assertRange(bytes, offset, MAP_HEADER_SIZE, "map header");
  const view = toDataView(bytes);
  const planestart: number[] = [];
  const planelength: number[] = [];

  for (let plane = 0; plane < 3; plane += 1) {
    planestart.push(view.getInt32(offset + plane * 4, true));
  }

  const planeLengthBase = offset + 12;
  for (let plane = 0; plane < 3; plane += 1) {
    planelength.push(view.getUint16(planeLengthBase + plane * 2, true));
  }

  const width = view.getUint16(offset + 18, true);
  const height = view.getUint16(offset + 20, true);
  const name = asciiName(bytes.subarray(offset + 22, offset + 38));

  if (width <= 0 || height <= 0) {
    throw new Error(`Map header at ${offset} has invalid dimensions ${width}x${height}.`);
  }

  return {
    planestart: tuple3(planestart),
    planelength: tuple3(planelength),
    width,
    height,
    name
  };
}

function decodePlane(
  bytes: Uint8Array,
  header: MapHeader,
  plane: number,
  rlewTag: number,
  expandedPlaneBytes: number
): Uint16Array {
  const start = header.planestart[plane] ?? -1;
  const compressedLength = header.planelength[plane] ?? 0;

  if (start < 0 || compressedLength <= 2) {
    throw new Error(`Plane ${plane} is missing or too short.`);
  }

  assertRange(bytes, start, compressedLength, `plane ${plane}`);
  const source = bytes.subarray(start, start + compressedLength);
  const expandedLength = readUint16(source, 0);
  const carmackWords = carmackExpand(source.subarray(2), expandedLength);

  if (carmackWords.byteLength < 2) {
    throw new Error(`Plane ${plane} Carmack output is missing the RLEW length word.`);
  }

  return rlewExpand(carmackWords.subarray(1), expandedPlaneBytes / 2, rlewTag);
}

export function carmackExpand(source: Uint8Array, expandedLength: number): Uint16Array {
  if (expandedLength % 2 !== 0) {
    throw new Error(`Carmack expanded length must be even, got ${expandedLength}.`);
  }

  const out = new Uint16Array(expandedLength / 2);
  let inOffset = 0;
  let outOffset = 0;
  let remainingWords = out.length;

  while (remainingWords > 0) {
    const ch = readUint16(source, inOffset);
    inOffset += 2;

    const chHigh = ch >> 8;
    const count = ch & 0xff;

    if (chHigh === NEAR_TAG) {
      if (count === 0) {
        out[outOffset] = ch | readUint8(source, inOffset);
        inOffset += 1;
        outOffset += 1;
        remainingWords -= 1;
      } else {
        const offset = readUint8(source, inOffset);
        inOffset += 1;
        copyCarmackRun(out, outOffset - offset, outOffset, count, "near");
        outOffset += count;
        remainingWords -= count;
      }
    } else if (chHigh === FAR_TAG) {
      if (count === 0) {
        out[outOffset] = ch | readUint8(source, inOffset);
        inOffset += 1;
        outOffset += 1;
        remainingWords -= 1;
      } else {
        const offset = readUint16(source, inOffset);
        inOffset += 2;
        copyCarmackRun(out, offset, outOffset, count, "far");
        outOffset += count;
        remainingWords -= count;
      }
    } else {
      out[outOffset] = ch;
      outOffset += 1;
      remainingWords -= 1;
    }
  }

  return out;
}

export function rlewExpand(source: Uint16Array, outputWords: number, rlewTag: number): Uint16Array {
  const out = new Uint16Array(outputWords);
  let inOffset = 0;
  let outOffset = 0;

  while (outOffset < outputWords) {
    const value = readWord(source, inOffset);
    inOffset += 1;

    if (value !== rlewTag) {
      out[outOffset] = value;
      outOffset += 1;
      continue;
    }

    const count = readWord(source, inOffset);
    const repeatedValue = readWord(source, inOffset + 1);
    inOffset += 2;

    if (outOffset + count > outputWords) {
      throw new Error(`RLEW run exceeds output plane: ${outOffset} + ${count} > ${outputWords}.`);
    }

    out.fill(repeatedValue, outOffset, outOffset + count);
    outOffset += count;
  }

  return out;
}

function firstOpenTile(map: WolfMap): PlayerSpawn {
  const walls = map.planes[0];
  const { width, height } = map.header;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if ((walls[y * width + x] ?? 1) === 0) {
        return {
          x: x + 0.5,
          y: y + 0.5,
          angle: 0,
          tile: 0
        };
      }
    }
  }

  return {
    x: 1.5,
    y: 1.5,
    angle: 0,
    tile: 0
  };
}

function spawnAngleForTile(tile: number): number | null {
  switch (tile) {
    case 19:
      return -Math.PI / 2;
    case 20:
      return 0;
    case 21:
      return Math.PI / 2;
    case 22:
      return Math.PI;
    default:
      return null;
  }
}

function copyCarmackRun(
  out: Uint16Array,
  sourceOffset: number,
  destOffset: number,
  count: number,
  tagName: string
): void {
  if (count <= 0 || sourceOffset < 0 || sourceOffset >= out.length) {
    throw new Error(`Invalid Carmack ${tagName} copy source ${sourceOffset}.`);
  }

  if (destOffset + count > out.length) {
    throw new Error(`Carmack ${tagName} copy exceeds output length.`);
  }

  for (let index = 0; index < count; index += 1) {
    out[destOffset + index] = out[sourceOffset + index] ?? 0;
  }
}

function asciiName(bytes: Uint8Array): string {
  let end = bytes.indexOf(0);
  if (end < 0) {
    end = bytes.length;
  }

  return Array.from(bytes.subarray(0, end), (byte) =>
    byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ""
  ).join("");
}

function assertRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (!Number.isInteger(offset) || offset < 0 || offset + length > bytes.byteLength) {
    throw new Error(`${label} range ${offset}+${length} exceeds ${bytes.byteLength} bytes.`);
  }
}

function readUint8(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset];
  if (value === undefined) {
    throw new Error(`Unexpected end of Carmack stream at byte ${offset}.`);
  }

  return value;
}

function readUint16(bytes: Uint8Array, offset: number): number {
  if (offset + 1 >= bytes.byteLength) {
    throw new Error(`Unexpected end of word stream at byte ${offset}.`);
  }

  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function readWord(words: Uint16Array, offset: number): number {
  const value = words[offset];
  if (value === undefined) {
    throw new Error(`Unexpected end of RLEW stream at word ${offset}.`);
  }

  return value;
}

function toDataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function tuple3(values: number[]): [number, number, number] {
  const first = values[0];
  const second = values[1];
  const third = values[2];

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error("Expected exactly three values.");
  }

  return [first, second, third];
}
