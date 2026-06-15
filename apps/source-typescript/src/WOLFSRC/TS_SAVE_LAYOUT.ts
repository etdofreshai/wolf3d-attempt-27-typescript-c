import { i32, readI16LE, readI32LE, readU16LE, writeU16LE, writeU32LE } from "./TS_C";
import { DGROUP_LAYOUT } from "./TS_DGROUP_LAYOUT";
import { DOSMemory } from "./TS_DOS_MEMORY";

export const SAVE_RECORDS = DGROUP_LAYOUT.saveRecords;
export const SAVE_CRITICAL_SYMBOLS = DGROUP_LAYOUT.saveCriticalSymbols;
export const RUNTIME_SYMBOLS = DGROUP_LAYOUT.runtimeSymbols;
export const STATETYPE_SYMBOLS = DGROUP_LAYOUT.statetypeSymbols;
export const STRUCT_LAYOUTS = DGROUP_LAYOUT.structLayouts;

export type SaveRecord = (typeof SAVE_RECORDS)[number];
export type SaveRecordName = SaveRecord["name"];
export type SaveCriticalSymbol = keyof typeof SAVE_CRITICAL_SYMBOLS;
export type RuntimeSymbol = keyof typeof RUNTIME_SYMBOLS;
export type DOSByteSource = DOSMemory | Uint8Array;

export interface SaveGameMemory {
  dgroup: DOSByteSource;
  // Far save records such as areaconnect live outside DGROUP.
  segments?: Partial<Record<string, DOSByteSource>>;
}

export interface SerializeSaveGameOptions {
  maxActors?: number;
  // SaveTheGame only assigns nullobj.active; oracle byte-identity may need the rest captured.
  nullObjectBytes?: Uint8Array;
  validateObjlistPointers?: boolean;
}

export interface SaveGamePiece {
  name: SaveRecordName | "objtype" | "nullobj";
  offset: number;
  bytes: number;
  checksum: boolean;
  sourceOffset?: number;
}

export interface SerializedSaveGame {
  bytes: Uint8Array;
  checksum: number;
  actorOffsets: number[];
  pieces: SaveGamePiece[];
}

export interface ParsedSaveGameImage {
  checksum: number;
  storedChecksum: number;
  checksumMatches: boolean;
  actorRecordCount: number;
  pieces: SaveGamePiece[];
}

export interface LoadSaveGameOptions extends Pick<SerializeSaveGameOptions, "maxActors"> {
  applyChecksumPenalty?: boolean;
  setupGameLevel?: () => void;
}

export interface LoadedSaveGameImage extends ParsedSaveGameImage {
  loaded: true;
  actorOffsets: number[];
  checksumPenaltyApplied: boolean;
}

const DGROUP_SEGMENT = DGROUP_LAYOUT.dgroup.segment;
const OBJTYPE_BYTES = STRUCT_LAYOUTS.objtype.bytes;
const OBJTYPE_ACTIVE_OFFSET = 0;
const OBJTYPE_NEXT_OFFSET = 56;
const OBJTYPE_PREV_OFFSET = 58;
const AC_BADOBJECT = -1;
const DEFAULT_MAX_ACTORS = 150;
const WP_PISTOL = 1;

const PRE_ACTOR_SAVE_RECORDS: readonly SaveRecordName[] = [
  "gamestate",
  "LevelRatios",
  "tilemap",
  "actorat",
  "areaconnect",
  "areabyplayer",
];

const POST_ACTOR_SAVE_RECORDS: readonly SaveRecordName[] = [
  "laststatobj",
  "statobjlist",
  "doorposition",
  "doorobjlist",
  "pwallstate",
  "pwallx",
  "pwally",
  "pwalldir",
  "pwallpos",
];

export function DoChecksum(source: Uint8Array, size = source.length, checksum = 0): number {
  let result = i32(checksum);
  for (let i = 0; i < size - 1; i++) {
    result = i32(result + (source[i] ^ source[i + 1]));
  }
  return result;
}

export function serializeSaveGame(
  memory: SaveGameMemory,
  options: SerializeSaveGameOptions = {},
): SerializedSaveGame {
  const chunks: Uint8Array[] = [];
  const pieces: SaveGamePiece[] = [];
  const actorOffsets: number[] = [];
  let checksum = 0;
  let offset = 0;

  const appendChunk = (
    name: SaveGamePiece["name"],
    bytes: Uint8Array,
    checksumCovered: boolean,
    sourceOffset?: number,
  ): void => {
    chunks.push(bytes);
    pieces.push({ name, offset, bytes: bytes.length, checksum: checksumCovered, sourceOffset });
    if (checksumCovered) {
      checksum = DoChecksum(bytes, bytes.length, checksum);
    }
    offset += bytes.length;
  };

  const appendRecord = (name: SaveRecordName): void => {
    const record = getSaveRecord(name);
    const bytes = copySaveRecordFromMemory(record, memory);
    appendChunk(record.name, bytes, record.checksum, recordSymbolOffset(record));
  };

  for (const name of PRE_ACTOR_SAVE_RECORDS) {
    appendRecord(name);
  }

  for (const actor of copyActorChainFromMemory(memory.dgroup, options)) {
    actorOffsets.push(actor.sourceOffset);
    appendChunk("objtype", actor.bytes, false, actor.sourceOffset);
  }

  appendChunk("nullobj", makeNullObjectBytes(options.nullObjectBytes), false);

  for (const name of POST_ACTOR_SAVE_RECORDS) {
    appendRecord(name);
  }

  const checksumBytes = new Uint8Array(4);
  writeU32LE(checksumBytes, 0, checksum);
  appendChunk("checksum", checksumBytes, false);

  const bytes = new Uint8Array(offset);
  let cursor = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, cursor);
    cursor += chunk.length;
  }

  return { bytes, checksum, actorOffsets, pieces };
}

export function parseSaveGameImage(
  bytes: Uint8Array,
  options: Pick<SerializeSaveGameOptions, "maxActors"> = {},
): ParsedSaveGameImage {
  const pieces: SaveGamePiece[] = [];
  let checksum = 0;
  let offset = 0;

  const takeRecord = (name: SaveRecordName): void => {
    const record = getSaveRecord(name);
    const count = numericRecordBytes(record);
    ensureRange(bytes, offset, count, record.name);
    const chunk = bytes.subarray(offset, offset + count);
    pieces.push({ name: record.name, offset, bytes: count, checksum: record.checksum });
    if (record.checksum) {
      checksum = DoChecksum(chunk, chunk.length, checksum);
    }
    offset += count;
  };

  for (const name of PRE_ACTOR_SAVE_RECORDS) {
    takeRecord(name);
  }

  let actorRecordCount = 0;
  const maxActors = options.maxActors ?? DEFAULT_MAX_ACTORS;
  while (true) {
    ensureRange(bytes, offset, OBJTYPE_BYTES, "objtype/nullobj");
    const active = readI16LE(bytes, offset + OBJTYPE_ACTIVE_OFFSET);
    const isNullObject = active === AC_BADOBJECT;
    pieces.push({
      name: isNullObject ? "nullobj" : "objtype",
      offset,
      bytes: OBJTYPE_BYTES,
      checksum: false,
    });
    offset += OBJTYPE_BYTES;

    if (isNullObject) {
      break;
    }
    actorRecordCount++;
    if (actorRecordCount > maxActors) {
      throw new Error(`Save image has more than ${maxActors} actor records before nullobj`);
    }
  }

  for (const name of POST_ACTOR_SAVE_RECORDS) {
    takeRecord(name);
  }

  ensureRange(bytes, offset, 4, "checksum");
  const storedChecksum = readI32LE(bytes, offset);
  pieces.push({ name: "checksum", offset, bytes: 4, checksum: false });
  offset += 4;

  if (offset !== bytes.length) {
    throw new Error(`Save image has ${bytes.length - offset} trailing bytes after checksum`);
  }

  return {
    checksum,
    storedChecksum,
    checksumMatches: storedChecksum === checksum,
    actorRecordCount,
    pieces,
  };
}

export function loadSaveGameImage(
  bytes: Uint8Array,
  memory: SaveGameMemory,
  options: LoadSaveGameOptions = {},
): LoadedSaveGameImage {
  const parsed = parseSaveGameImage(bytes, options);
  const dgroup = bytesOf(memory.dgroup);
  let actorsInitialized = false;
  let actorRecordsLoaded = 0;
  const actorOffsets: number[] = [];

  const ensureActorsInitialized = (): void => {
    if (actorsInitialized) {
      return;
    }
    initializeActorList(dgroup, options.maxActors ?? DEFAULT_MAX_ACTORS);
    actorsInitialized = true;
  };

  for (const piece of parsed.pieces) {
    if (piece.name === "checksum") {
      continue;
    }

    const source = bytes.subarray(piece.offset, piece.offset + piece.bytes);
    if (piece.name === "objtype") {
      ensureActorsInitialized();
      const actor =
        actorRecordsLoaded === 0
          ? readU16LE(dgroup, nearOffsetForRuntimeSymbol("_player"))
          : allocateActor(dgroup);
      const copyBytes = actorRecordsLoaded === 0 ? OBJTYPE_BYTES : OBJTYPE_BYTES - 4;
      dgroup.set(source.subarray(0, copyBytes), actor);
      actorOffsets.push(actor);
      actorRecordsLoaded++;
      continue;
    }

    if (piece.name === "nullobj") {
      ensureActorsInitialized();
      continue;
    }

    const record = getSaveRecord(piece.name);
    writeSaveRecordToMemory(record, memory, source);
    if (piece.name === "LevelRatios") {
      options.setupGameLevel?.();
    }
  }

  if (actorRecordsLoaded !== parsed.actorRecordCount) {
    throw new Error(
      `Loaded ${actorRecordsLoaded} actor records, expected ${parsed.actorRecordCount}`,
    );
  }

  const checksumPenaltyApplied =
    !parsed.checksumMatches && (options.applyChecksumPenalty ?? true);
  if (checksumPenaltyApplied) {
    applyChecksumPenalty(memory.dgroup);
  }

  return {
    ...parsed,
    loaded: true,
    actorOffsets,
    checksumPenaltyApplied,
  };
}

export function getSaveRecord(name: SaveRecordName): SaveRecord {
  const record = SAVE_RECORDS.find((entry) => entry.name === name);
  if (!record) {
    throw new Error(`Unknown save record ${name}`);
  }
  return record;
}

export function nearOffsetForSymbol(symbol: SaveCriticalSymbol): number {
  return parseHexOffset(SAVE_CRITICAL_SYMBOLS[symbol].nearOffset);
}

export function nearOffsetForRuntimeSymbol(symbol: RuntimeSymbol): number {
  return parseHexOffset(RUNTIME_SYMBOLS[symbol].nearOffset);
}

export function statetypeNearOffset(name: string): number {
  const symbol = STATETYPE_SYMBOLS.find((entry) => entry.name === name);
  if (!symbol) {
    throw new Error(`Unknown statetype symbol ${name}`);
  }
  return parseHexOffset(symbol.nearOffset);
}

function copySaveRecordFromMemory(record: SaveRecord, memory: SaveGameMemory): Uint8Array {
  const bytes = numericRecordBytes(record);
  const source = bytesForRecord(record, memory);
  const sourceOffset = recordSymbolOffset(record);
  ensureRange(source, sourceOffset, bytes, record.name);
  return new Uint8Array(source.subarray(sourceOffset, sourceOffset + bytes));
}

function writeSaveRecordToMemory(
  record: SaveRecord,
  memory: SaveGameMemory,
  source: Uint8Array,
): void {
  const bytes = numericRecordBytes(record);
  if (source.length !== bytes) {
    throw new Error(`${record.name} source length ${source.length} does not match ${bytes}`);
  }
  const target = bytesForRecord(record, memory);
  const targetOffset = recordSymbolOffset(record);
  ensureRange(target, targetOffset, bytes, record.name);
  target.set(source, targetOffset);
}

function copyActorChainFromMemory(
  dgroupSource: DOSByteSource,
  options: SerializeSaveGameOptions,
): { bytes: Uint8Array; sourceOffset: number }[] {
  const dgroup = bytesOf(dgroupSource);
  const maxActors = options.maxActors ?? DEFAULT_MAX_ACTORS;
  const objlistStart = nearOffsetForSymbol("_objlist");
  const objlistBytes = OBJTYPE_BYTES * maxActors;
  let actorOffset = readU16LE(dgroup, nearOffsetForSymbol("_player"));
  const seen = new Set<number>();
  const actors: { bytes: Uint8Array; sourceOffset: number }[] = [];

  while (actorOffset !== 0) {
    if (seen.has(actorOffset)) {
      throw new Error(`Cycle in objtype next chain at near offset ${formatHex(actorOffset)}`);
    }
    if (actors.length >= maxActors) {
      throw new Error(`objtype next chain exceeded ${maxActors} actors`);
    }
    seen.add(actorOffset);

    if (options.validateObjlistPointers !== false) {
      const insideObjlist =
        actorOffset >= objlistStart &&
        actorOffset + OBJTYPE_BYTES <= objlistStart + objlistBytes &&
        (actorOffset - objlistStart) % OBJTYPE_BYTES === 0;
      if (!insideObjlist) {
        throw new Error(`objtype near offset ${formatHex(actorOffset)} is outside objlist`);
      }
    }

    ensureRange(dgroup, actorOffset, OBJTYPE_BYTES, "objtype");
    const bytes = new Uint8Array(dgroup.subarray(actorOffset, actorOffset + OBJTYPE_BYTES));
    actors.push({ bytes, sourceOffset: actorOffset });
    actorOffset = readU16LE(bytes, OBJTYPE_NEXT_OFFSET);
  }

  return actors;
}

function initializeActorList(dgroup: Uint8Array, maxActors: number): void {
  const objlist = nearOffsetForRuntimeSymbol("_objlist");
  for (let i = 0; i < maxActors; i++) {
    const actor = objlist + i * OBJTYPE_BYTES;
    writeU16LE(dgroup, actor + OBJTYPE_PREV_OFFSET, i + 1 < maxActors ? actor + OBJTYPE_BYTES : 0);
    writeU16LE(dgroup, actor + OBJTYPE_NEXT_OFFSET, 0);
  }

  writeU16LE(dgroup, nearOffsetForRuntimeSymbol("_objfreelist"), objlist);
  writeU16LE(dgroup, nearOffsetForRuntimeSymbol("_lastobj"), 0);
  writeU16LE(dgroup, nearOffsetForRuntimeSymbol("_objcount"), 0);
  const player = allocateActor(dgroup);
  writeU16LE(dgroup, nearOffsetForRuntimeSymbol("_player"), player);
}

function allocateActor(dgroup: Uint8Array): number {
  const objfreelistPointer = nearOffsetForRuntimeSymbol("_objfreelist");
  const newPointer = nearOffsetForRuntimeSymbol("_new");
  const lastobjPointer = nearOffsetForRuntimeSymbol("_lastobj");
  const objcountPointer = nearOffsetForRuntimeSymbol("_objcount");
  const actor = readU16LE(dgroup, objfreelistPointer);
  if (actor === 0) {
    throw new Error("GetNewActor: No free spots in objlist!");
  }

  writeU16LE(dgroup, newPointer, actor);
  writeU16LE(dgroup, objfreelistPointer, readU16LE(dgroup, actor + OBJTYPE_PREV_OFFSET));
  dgroup.fill(0, actor, actor + OBJTYPE_BYTES);

  const lastobj = readU16LE(dgroup, lastobjPointer);
  if (lastobj !== 0) {
    writeU16LE(dgroup, lastobj + OBJTYPE_NEXT_OFFSET, actor);
  }
  writeU16LE(dgroup, actor + OBJTYPE_PREV_OFFSET, lastobj);
  writeU16LE(dgroup, actor + OBJTYPE_ACTIVE_OFFSET, 0);
  writeU16LE(dgroup, lastobjPointer, actor);
  writeU16LE(dgroup, objcountPointer, readU16LE(dgroup, objcountPointer) + 1);
  return actor;
}

function makeNullObjectBytes(template?: Uint8Array): Uint8Array {
  if (template && template.length !== OBJTYPE_BYTES) {
    throw new Error(`nullObjectBytes must be ${OBJTYPE_BYTES} bytes`);
  }
  const bytes = template ? new Uint8Array(template) : new Uint8Array(OBJTYPE_BYTES);
  writeU16LE(bytes, OBJTYPE_ACTIVE_OFFSET, AC_BADOBJECT);
  return bytes;
}

function applyChecksumPenalty(dgroupSource: DOSByteSource): void {
  const dgroup = bytesOf(dgroupSource);
  const gamestate = nearOffsetForSymbol("_gamestate");
  writeU32LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "score"), 0);
  writeU16LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "lives"), 1);
  writeU16LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "weapon"), WP_PISTOL);
  writeU16LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "chosenweapon"), WP_PISTOL);
  writeU16LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "bestweapon"), WP_PISTOL);
  writeU16LE(dgroup, gamestate + structFieldOffset(STRUCT_LAYOUTS.gametype, "ammo"), 8);
}

function bytesForRecord(record: SaveRecord, memory: SaveGameMemory): Uint8Array {
  if (!record.symbolInfo) {
    throw new Error(`${record.name} is not backed by a symbol`);
  }
  if (record.symbolInfo.segment === DGROUP_SEGMENT) {
    return bytesOf(memory.dgroup);
  }

  const segment = record.symbolInfo.segment;
  const source =
    memory.segments?.[segment] ??
    memory.segments?.[segment.toUpperCase()] ??
    memory.segments?.[segment.toLowerCase()];
  if (!source) {
    throw new Error(
      `${record.name} lives in segment ${segment}; pass memory.segments["${segment}"]`,
    );
  }
  return bytesOf(source);
}

function bytesOf(source: DOSByteSource): Uint8Array {
  return source instanceof DOSMemory ? source.bytes : source;
}

function numericRecordBytes(record: SaveRecord): number {
  if (typeof record.bytes !== "number") {
    throw new Error(`${record.name} has dynamic byte length: ${record.bytes}`);
  }
  return record.bytes;
}

function recordSymbolOffset(record: SaveRecord): number {
  if (!record.symbolInfo) {
    throw new Error(`${record.name} is not backed by a symbol`);
  }
  return parseHexOffset(record.symbolInfo.nearOffset);
}

function structFieldOffset(
  layout: { fields: readonly (readonly [string, number, number, string])[] },
  field: string,
): number {
  const entry = layout.fields.find(([name]) => name === field);
  if (!entry) {
    throw new Error(`Unknown struct field ${field}`);
  }
  return entry[1];
}

function ensureRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0) {
    throw new RangeError(`Invalid ${label} byte range ${offset}+${length}`);
  }
  if (offset + length > bytes.length) {
    throw new RangeError(`${label} byte range ${offset}+${length} exceeds ${bytes.length}`);
  }
}

function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function parseHexOffset(value: string): number {
  if (!/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error(`Invalid layout offset ${value}`);
  }
  return Number.parseInt(value.slice(2), 16);
}
