import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, "source", "WOLFSRC");
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const dgroupLayoutPath = path.join(repoRoot, "oracle", "generated", "dgroup-layout.json");
const dgroupLayoutTsPath = path.join(targetDir, "TS_DGROUP_LAYOUT.ts");
const mirrorExtensions = new Set([".C", ".H", ".ASM"]);

const EXPECTED_WOLF3D_EXE_SHA256 =
  "48d9594649f330956e86ea1892bab76b2d83cfd4038e262ff8f3383ba945ec09";

const WL6 = {
  NUMMAPS: 60,
  MAPPLANES: 2,
  MAPSIZE: 64,
  NUMCHUNKS: 149,
  NUMSNDCHUNKS: 288,
  STRUCTPIC: 0,
  STARTTILE8: 135,
  STARTTILE8M: 136,
  STARTTILE16: 136,
  STARTTILE16M: 136,
  STARTTILE32: 136,
  STARTTILE32M: 136,
  STARTEXTERNS: 136,
  NUMTILE8: 72,
  NUMTILE8M: 0,
  NUMTILE16: 0,
  NUMTILE16M: 0,
  NUMTILE32: 0,
};

const EXPECTED = {
  mapAggregateSha256: "42be276278aafde68adaef050ea6f107f2cfb3e455903581ad152f1c939c09a1",
  mapNamesSha256: "a49f248d3d32d9eae390b198773240b131c5f686add8b5670ce453e8ba8685b4",
  demoSha256: [
    "dd4789d9e75a6c370a26479593d72fed16aec5187202962045cd8ddddb533876",
    "ee6c69446c0034b9ce7db50c671601e643c1303c67ef0340f301a93b893643d5",
    "412189a93cc759c8197b2cb1511bb5abf243eb7bf155907f1d0e8ff659b1b178",
    "de2d84a290b80fe16d6099476265ca7e406b309b3e46a2a26ba324d8984d6b7e",
  ],
  audioDirectorySha256: "2cc23cb811df16e656f1fea25cd2629859c1ec9997d35bc3b1776594094b67ef",
  vswapDirectorySha256: "cdae1921a0f6412f3f50a8d9aa57b1f2840b365f920823afe7fea0776bacaf01",
  vswapDataSha256: "966216d9d2da2c6e130d5ade5b4fadc22a0732b0dcb3b4b6d0614a114c9adc12",
};

const EXPECTED_DGROUP_LAYOUT = {
  sourceMapSha256: "1a14d6d4c61c714cca5ed0467cb8ae9754bf472edfd8a79e5b4a84e9bfe2a016",
  retailDecompressedBytes: 254014,
  dgroupSegment: "0x3A39",
  statetypeSymbols: 305,
  saveOffsets: {
    _gamestate: "0x95C2",
    _LevelRatios: "0x9906",
    _tilemap: "0x75BA",
    _actorat: "0x55BA",
    _areaconnect: "0x0000",
    _areabyplayer: "0x52DC",
    _objlist: "0xB51C",
    _statobjlist: "0x893C",
    _doorobjlist: "0x86BA",
    _doorposition: "0x5328",
    _pwallstate: "0x5326",
    _pwallx: "0x52DA",
    _pwally: "0x52D8",
    _pwalldir: "0x52D6",
    _pwallpos: "0x53A8",
  },
  runtimeOffsets: {
    _playstate: "0x95C0",
    _killerobj: "0xA2BA",
    _palshifted: "0xA41A",
    _bonuscount: "0xA41C",
    _damagecount: "0xA41E",
    _objcount: "0xA420",
    _godmode: "0xA512",
    _noclip: "0xA510",
    _doornum: "0xD85C",
    _LastAttacker: "0xE009",
    _mapwidth: "0xA2CE",
    _mapheight: "0xA2CC",
    _tics: "0xA2CA",
    _thrustspeed: "0xE00D",
    _anglefrac: "0xA4E2",
    _playerxmove: "0xE005",
    _playerymove: "0xE001",
    _buttonstate: "0xA4EA",
    _buttonheld: "0xA4FE",
    _controlx: "0xA4FC",
    _controly: "0xA4FA",
    _madenoise: "0xD844",
    _plux: "0xDFFF",
    _pluy: "0xDFFD",
    _centerx: "0x9896",
    _shootdelta: "0x9894",
    _facecount: "0xA4E0",
    _gotgatgun: "0xE00B",
    _spotvis: "0xA516",
  },
};

const EXPECTED_LEVEL_SETUP = {
  maps: 60,
  walls: 170235,
  floors: 75525,
  ambushMarkers: 3,
  doors: 1328,
  statics: 13855,
  treasureTotal: 2708,
  players: 60,
  enemies: 4034,
  killTotal: 4025,
  secretPushwalls: 474,
  // Byte digest of all 60 maps' tilemap/actorat/objlist/plane0 after SetupGameLevel.
  // Derived from the port output that the field-level checks above (full player/enemy/
  // static objects + every count) independently validate as correct.
  aggregateSha256: "f901ea104d72d31b00f17ac5c486edb3108389e006a31bb080cbc615552fd53f",
};

function fail(message) {
  throw new Error(message);
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function sha256Many(parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(part);
  }
  return hash.digest("hex");
}

function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readI32(view, offset) {
  return view.getInt32(offset, true);
}

function readU24(bytes, offset) {
  const value = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
  return value === 0xffffff ? -1 : value;
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

function normalizeSourceForScan(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/^\s*#.*$/gm, " ");
}

function findFunctionDefinitions(text) {
  const cleaned = normalizeSourceForScan(text);
  const controlWords = new Set([
    "if",
    "for",
    "while",
    "switch",
    "return",
    "sizeof",
    "defined",
  ]);
  const functions = [];
  const seen = new Set();
  const pattern =
    /(?:^|\n)\s*(?:[A-Za-z_][\w\s_*]*?\s+)+([A-Za-z_]\w*)\s*\(([^;{}()]|\([^)]*\))*\)\s*(?:\n\s*)?\{/g;
  for (const match of cleaned.matchAll(pattern)) {
    const name = match[1];
    if (controlWords.has(name) || seen.has(name)) {
      continue;
    }
    seen.add(name);
    functions.push(name);
  }
  return functions.sort((a, b) => a.localeCompare(b));
}

function parseNumberList(text) {
  const numbers = [];
  for (const match of text.matchAll(/-?\d+/g)) {
    numbers.push(Number.parseInt(match[0], 10));
  }
  return numbers;
}

function parseAsmRndTable(text) {
  const values = [];
  let collecting = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split(";")[0];
    if (/^\s*rndtable\s+db\b/i.test(line)) {
      collecting = true;
      values.push(...parseNumberList(line.replace(/^\s*rndtable\s+db\b/i, "")));
      continue;
    }
    if (collecting && /^\s*db\b/i.test(line)) {
      values.push(...parseNumberList(line.replace(/^\s*db\b/i, "")));
      continue;
    }
    if (collecting && /\bPUBLIC\s+rndtable\b/i.test(line)) {
      break;
    }
  }
  return values;
}

function parseTsRndTable(text) {
  const match = text.match(/rndtable\s*=\s*new\s+Uint8Array\s*\(\s*\[([\s\S]*?)\]\s*\)/);
  if (!match) {
    fail("ID_US_A.ASM.ts is missing rndtable Uint8Array");
  }
  return parseNumberList(match[1]);
}

function moduleSpecifier(fromDir, filePath) {
  let specifier = path.relative(fromDir, filePath).replaceAll("\\", "/");
  if (!specifier.startsWith(".")) {
    specifier = `./${specifier}`;
  }
  return specifier;
}

function decodeAscii(bytes, offset, length) {
  let end = offset;
  while (end < offset + length && bytes[end] !== 0) {
    end++;
  }
  return new TextDecoder("ascii").decode(bytes.subarray(offset, end));
}

function carmackExpand(source, expandedBytes) {
  const NEARTAG = 0xa7;
  const FARTAG = 0xa8;
  const out = new Uint16Array(expandedBytes / 2);
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  let sourceOffset = 0;
  let outOffset = 0;
  let remainingWords = expandedBytes / 2;

  while (remainingWords > 0) {
    let ch = readU16(view, sourceOffset);
    sourceOffset += 2;
    const chhigh = ch >> 8;

    if (chhigh === NEARTAG) {
      let count = ch & 0xff;
      if (count === 0) {
        ch |= source[sourceOffset++];
        out[outOffset++] = ch;
        remainingWords--;
      } else {
        const copyOffset = source[sourceOffset++];
        let copyIndex = outOffset - copyOffset;
        remainingWords -= count;
        while (count-- > 0) {
          out[outOffset++] = out[copyIndex++];
        }
      }
    } else if (chhigh === FARTAG) {
      let count = ch & 0xff;
      if (count === 0) {
        ch |= source[sourceOffset++];
        out[outOffset++] = ch;
        remainingWords--;
      } else {
        let copyIndex = readU16(view, sourceOffset);
        sourceOffset += 2;
        remainingWords -= count;
        while (count-- > 0) {
          out[outOffset++] = out[copyIndex++];
        }
      }
    } else {
      out[outOffset++] = ch;
      remainingWords--;
    }
  }

  return out;
}

function rlewExpand(source, expandedBytes, rlewtag) {
  const out = new Uint16Array(expandedBytes / 2);
  let sourceOffset = 0;
  let outOffset = 0;
  while (outOffset < out.length) {
    const value = source[sourceOffset++];
    if (value !== rlewtag) {
      out[outOffset++] = value;
      continue;
    }
    const count = source[sourceOffset++];
    const repeated = source[sourceOffset++];
    out.fill(repeated, outOffset, outOffset + count);
    outOffset += count;
  }
  return out;
}

function wordsToBytes(words) {
  return new Uint8Array(words.buffer, words.byteOffset, words.byteLength);
}

function readMapHeaders(mapHead, gameMaps) {
  const headView = new DataView(mapHead.buffer, mapHead.byteOffset, mapHead.byteLength);
  const dataView = new DataView(gameMaps.buffer, gameMaps.byteOffset, gameMaps.byteLength);
  const rlewtag = readU16(headView, 0);
  const headers = [];
  for (let i = 0; i < WL6.NUMMAPS; i++) {
    const offset = readI32(headView, 2 + i * 4);
    if (offset < 0) {
      headers.push(null);
      continue;
    }
    const planestart = [0, 1, 2].map((plane) => readI32(dataView, offset + plane * 4));
    const planelength = [0, 1, 2].map((plane) => readU16(dataView, offset + 12 + plane * 2));
    headers.push({
      offset,
      planestart,
      planelength,
      width: readU16(dataView, offset + 18),
      height: readU16(dataView, offset + 20),
      name: decodeAscii(gameMaps, offset + 22, 16),
    });
  }
  return { rlewtag, headers };
}

function loadMapPlanes(header, gameMaps, rlewtag) {
  const dataView = new DataView(gameMaps.buffer, gameMaps.byteOffset, gameMaps.byteLength);
  const planes = [];
  for (let plane = 0; plane < WL6.MAPPLANES; plane++) {
    const pos = header.planestart[plane];
    const compressed = header.planelength[plane];
    const chunk = gameMaps.subarray(pos, pos + compressed);
    const expanded = readU16(dataView, pos);
    const carmacked = carmackExpand(chunk.subarray(2), expanded);
    planes.push(rlewExpand(carmacked.subarray(1), WL6.MAPSIZE * WL6.MAPSIZE * 2, rlewtag));
  }
  return planes;
}

function readGraphOffsets(vgaHead) {
  const offsets = [];
  for (let i = 0; i < WL6.NUMCHUNKS + 1; i++) {
    offsets.push(readU24(vgaHead, i * 3));
  }
  return offsets;
}

function readHuffNodes(vgaDict) {
  const view = new DataView(vgaDict.buffer, vgaDict.byteOffset, vgaDict.byteLength);
  const nodes = [];
  for (let i = 0; i < 255; i++) {
    nodes.push({
      bit0: readU16(view, i * 4),
      bit1: readU16(view, i * 4 + 2),
    });
  }
  return nodes;
}

function huffExpand(source, expandedBytes, nodes) {
  const out = new Uint8Array(expandedBytes);
  let outOffset = 0;
  let sourceOffset = 0;
  let byteValue = source[sourceOffset++];
  let mask = 1;
  let nodeIndex = 254;

  while (outOffset < expandedBytes) {
    const node = nodes[nodeIndex];
    const value = byteValue & mask ? node.bit1 : node.bit0;
    mask <<= 1;
    if (mask === 0x100) {
      byteValue = source[sourceOffset++];
      mask = 1;
    }

    if (value < 256) {
      out[outOffset++] = value;
      nodeIndex = 254;
    } else {
      nodeIndex = value - 256;
    }
  }
  return out;
}

function graphicExpandedLength(chunk, source) {
  if (chunk >= WL6.STARTTILE8 && chunk < WL6.STARTEXTERNS) {
    if (chunk < WL6.STARTTILE8M) {
      return 64 * WL6.NUMTILE8;
    }
    if (chunk < WL6.STARTTILE16) {
      return 128 * WL6.NUMTILE8M;
    }
    if (chunk < WL6.STARTTILE16M) {
      return 64 * 4;
    }
    if (chunk < WL6.STARTTILE32) {
      return 128 * 4;
    }
    if (chunk < WL6.STARTTILE32M) {
      return 64 * 16;
    }
    return 128 * 16;
  }
  return readU32(new DataView(source.buffer, source.byteOffset, source.byteLength), 0);
}

function loadGraphicChunk(chunk, vgaHead, vgaGraph, vgaDict) {
  const offsets = readGraphOffsets(vgaHead);
  const pos = offsets[chunk];
  if (pos < 0) {
    return null;
  }
  let next = chunk + 1;
  while (offsets[next] === -1) {
    next++;
  }
  const source = vgaGraph.subarray(pos, offsets[next]);
  const expanded = graphicExpandedLength(chunk, source);
  const payload = chunk >= WL6.STARTTILE8 && chunk < WL6.STARTEXTERNS ? source : source.subarray(4);
  return huffExpand(payload, expanded, readHuffNodes(vgaDict));
}

function readAudioChunks(audioHead, audioT) {
  const view = new DataView(audioHead.buffer, audioHead.byteOffset, audioHead.byteLength);
  const chunks = [];
  for (let i = 0; i < WL6.NUMSNDCHUNKS; i++) {
    const start = readU32(view, i * 4);
    const end = readU32(view, (i + 1) * 4);
    chunks.push(audioT.subarray(start, end));
  }
  return chunks;
}

function readVswap(vswap) {
  const view = new DataView(vswap.buffer, vswap.byteOffset, vswap.byteLength);
  const chunksInFile = readU16(view, 0);
  const spriteStart = readU16(view, 2);
  const soundStart = readU16(view, 4);
  const pageOffsets = [];
  const pageLengths = [];
  for (let i = 0; i < chunksInFile; i++) {
    const raw = readU32(view, 6 + i * 4);
    pageOffsets.push(raw === 0xffffffff ? -1 : raw);
  }
  const lengthTable = 6 + chunksInFile * 4;
  for (let i = 0; i < chunksInFile; i++) {
    pageLengths.push(readU16(view, lengthTable + i * 2));
  }
  const chunks = pageOffsets.map((offset, i) =>
    offset < 0 ? null : vswap.subarray(offset, offset + pageLengths[i]),
  );
  return { chunksInFile, spriteStart, soundStart, pageOffsets, pageLengths, chunks };
}

async function checkMirror() {
  const sourceEntries = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && mirrorExtensions.has(path.extname(entry.name)))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const targetEntries = new Set(await readdir(targetDir));
  for (const sourceName of sourceEntries) {
    const targetName = `${sourceName}.ts`;
    if (!targetEntries.has(targetName)) {
      fail(`missing mirror module ${targetName}`);
    }
  }

  const cFiles = sourceEntries.filter((name) => path.extname(name) === ".C");
  let functionCount = 0;
  for (const sourceName of cFiles) {
    const source = await readFile(path.join(sourceDir, sourceName), "utf8");
    const target = await readFile(path.join(targetDir, `${sourceName}.ts`), "utf8");
    for (const fn of findFunctionDefinitions(source)) {
      functionCount++;
      if (!target.includes(`function ${fn}`)) {
        fail(`missing function ${fn} in ${sourceName}.ts`);
      }
    }
  }

  return { moduleCount: sourceEntries.length, functionCount };
}

async function checkPortHelpers() {
  const [sourceRndAsm, targetRndAsm, saveLayoutTs] = await Promise.all([
    readFile(path.join(sourceDir, "ID_US_A.ASM"), "utf8"),
    readFile(path.join(targetDir, "ID_US_A.ASM.ts"), "utf8"),
    readFile(path.join(targetDir, "TS_SAVE_LAYOUT.ts"), "utf8"),
  ]);

  const sourceRndTable = parseAsmRndTable(sourceRndAsm);
  const targetRndTable = parseTsRndTable(targetRndAsm);
  if (sourceRndTable.length !== 256) {
    fail(`source rndtable should have 256 entries, saw ${sourceRndTable.length}`);
  }
  if (targetRndTable.length !== 256) {
    fail(`target rndtable should have 256 entries, saw ${targetRndTable.length}`);
  }
  for (let i = 0; i < sourceRndTable.length; i++) {
    if (sourceRndTable[i] !== targetRndTable[i]) {
      fail(`rndtable mismatch at ${i}: ${targetRndTable[i]} !== ${sourceRndTable[i]}`);
    }
  }

  for (const snippet of [
    "export function US_InitRndT",
    "export function US_RndT",
    "export function serializeSaveGame",
    "export function parseSaveGameImage",
    "export function loadSaveGameImage",
  ]) {
    if (!`${targetRndAsm}\n${saveLayoutTs}`.includes(snippet)) {
      fail(`missing port helper snippet: ${snippet}`);
    }
  }

  const runtime = await checkPortHelperRuntime();

  return {
    rndtableEntries: targetRndTable.length,
    rndAfterSeed0: targetRndTable[1],
    rndRuntimeAfterSeed0: runtime.rndSequenceAfterSeed0,
    gameState: runtime.gameState,
    syntheticSaveBytes: runtime.syntheticSaveBytes,
    syntheticSaveChecksum: runtime.syntheticSaveChecksum,
    syntheticSaveActors: runtime.syntheticSaveActors,
    demoSummaries: runtime.demoSummaries,
    demoPlayback: runtime.demoPlayback,
    levelSetup: runtime.levelSetup,
    listSetup: runtime.listSetup,
    pathMovement: runtime.pathMovement,
    awareness: runtime.awareness,
    chase: runtime.chase,
    dogGhost: runtime.dogGhost,
    checkPosition: runtime.checkPosition,
    damage: runtime.damage,
    paletteShifts: runtime.paletteShifts,
    faceUpdate: runtime.faceUpdate,
    actorDamage: runtime.actorDamage,
    playerEquipment: runtime.playerEquipment,
    playerAttacks: runtime.playerAttacks,
    attackFrames: runtime.attackFrames,
    pickups: runtime.pickups,
    weaponChange: runtime.weaponChange,
    pollControls: runtime.pollControls,
    playLoopStep: runtime.playLoopStep,
    checkKeys: runtime.checkKeys,
    longDivide: runtime.longDivide,
    asmRuntime: runtime.asmRuntime,
    rendererMath: runtime.rendererMath,
    scalers: runtime.scalers,
    viewSize: runtime.viewSize,
    setupTables: runtime.setupTables,
    intermission: runtime.intermission,
    debugText: runtime.debugText,
    drawRuntime: runtime.drawRuntime,
    spearActions: runtime.spearActions,
    soundLoc: runtime.soundLoc,
    windowState: runtime.windowState,
    vgaPalette: runtime.vgaPalette,
    cacheManager: runtime.cacheManager,
    pageManager: runtime.pageManager,
    memoryManager: runtime.memoryManager,
    soundManager: runtime.soundManager,
    clearMemory: runtime.clearMemory,
    music: runtime.music,
    input: runtime.input,
    inputManager: runtime.inputManager,
    playerMovement: runtime.playerMovement,
    doorLifecycle: runtime.doorLifecycle,
    projectile: runtime.projectile,
    smokeAction: runtime.smokeAction,
    victoryActions: runtime.victoryActions,
    hitlerMorph: runtime.hitlerMorph,
    bjVictory: runtime.bjVictory,
    soundActions: runtime.soundActions,
    bossProjectiles: runtime.bossProjectiles,
    saveHelpers: ["serializeSaveGame", "parseSaveGameImage", "loadSaveGameImage"],
  };
}

async function checkPortHelperRuntime() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf3d-source-ts-check-"));
  try {
    const entryPath = path.join(tempDir, "entry.ts");
    const outPath = path.join(tempDir, "entry.mjs");
    await writeFile(
      entryPath,
      [
        `export { DOSMemory } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "TS_DOS_MEMORY.ts"),
        )}";`,
        `export { STRUCT_LAYOUTS, serializeSaveGame, parseSaveGameImage, loadSaveGameImage, nearOffsetForSymbol, nearOffsetForRuntimeSymbol, statetypeNearOffset } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "TS_SAVE_LAYOUT.ts"),
        )}";`,
        `export { US_InitRndT, US_RndT, rndtable } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_US_A.ASM.ts"),
        )}";`,
        `export { parseDemo, serializeDemo } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "TS_DEMO.ts"),
        )}";`,
        `export { abortprogram as ID_US_abortprogram, compatability as ID_US_compatability, MaxHighName as ID_US_MaxHighName, MaxScores as ID_US_MaxScores, NoWait as ID_US_NoWait, PrintX as ID_US_PrintX, PrintY as ID_US_PrintY, Scores as ID_US_Scores, tedlevel as ID_US_tedlevel, tedlevelnum as ID_US_tedlevelnum, US_CenterWindow as ID_US_US_CenterWindow, US_CheckParm as ID_US_US_CheckParm, US_ClearWindow as ID_US_US_ClearWindow, US_CPrint as ID_US_US_CPrint, US_CPrintLine as ID_US_US_CPrintLine, US_DrawWindow as ID_US_US_DrawWindow, US_LineInput as ID_US_US_LineInput, US_Print as ID_US_US_Print, US_PrintCentered as ID_US_US_PrintCentered, US_PrintSigned as ID_US_US_PrintSigned, US_PrintUnsigned as ID_US_US_PrintUnsigned, US_RestoreWindow as ID_US_US_RestoreWindow, US_SaveWindow as ID_US_US_SaveWindow, US_SetPrintRoutines as ID_US_US_SetPrintRoutines, US_Shutdown as ID_US_US_Shutdown, US_Started as ID_US_US_Started, US_Startup as ID_US_US_Startup, USL_HardError as ID_US_USL_HardError, USL_PrintInCenter as ID_US_USL_PrintInCenter, USL_XORICursor as ID_US_USL_XORICursor, WindowH as ID_US_WindowH, WindowW as ID_US_WindowW, WindowX as ID_US_WindowX, WindowY as ID_US_WindowY } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_US_1.C.ts"),
        )}";`,
        `export { ctrl_Joystick1 as ID_IN_ctrl_Joystick1, ctrl_Keyboard1 as ID_IN_ctrl_Keyboard1, ctrl_Mouse as ID_IN_ctrl_Mouse, demo_PlayDone as ID_IN_demo_PlayDone, dir_NorthEast as ID_IN_dir_NorthEast, dir_SouthWest as ID_IN_dir_SouthWest, key_None as ID_IN_key_None, sc_A as ID_IN_sc_A, sc_BackSpace as ID_IN_sc_BackSpace, sc_Control as ID_IN_sc_Control, sc_Delete as ID_IN_sc_Delete, sc_End as ID_IN_sc_End, sc_Enter as ID_IN_sc_Enter, sc_Escape as ID_IN_sc_Escape, sc_F1 as ID_IN_sc_F1, sc_F2 as ID_IN_sc_F2, sc_F3 as ID_IN_sc_F3, sc_F4 as ID_IN_sc_F4, sc_F5 as ID_IN_sc_F5, sc_F6 as ID_IN_sc_F6, sc_F7 as ID_IN_sc_F7, sc_F8 as ID_IN_sc_F8, sc_F9 as ID_IN_sc_F9, sc_F10 as ID_IN_sc_F10, sc_Home as ID_IN_sc_Home, sc_LeftArrow as ID_IN_sc_LeftArrow, sc_LShift as ID_IN_sc_LShift, sc_RightArrow as ID_IN_sc_RightArrow, sc_Space as ID_IN_sc_Space, sc_UpArrow as ID_IN_sc_UpArrow, sc_Y as ID_IN_sc_Y } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_IN.H.ts"),
        )}";`,
        `export { Controls as ID_IN_Controls, DemoBuffer as ID_IN_DemoBuffer, IN_Ack as ID_IN_IN_Ack, IN_CheckAck as ID_IN_IN_CheckAck, IN_ClearKeysDown as ID_IN_IN_ClearKeysDown, IN_DebugState as ID_IN_IN_DebugState, IN_Default as ID_IN_IN_Default, IN_JoyButtons as ID_IN_IN_JoyButtons, IN_KeyDown as ID_IN_IN_KeyDown, IN_MouseButtons as ID_IN_IN_MouseButtons, IN_ReadControl as ID_IN_IN_ReadControl, IN_ResetInputState as ID_IN_IN_ResetInputState, IN_SetControlType as ID_IN_IN_SetControlType, IN_SetJoyState as ID_IN_IN_SetJoyState, IN_SetKeyboardState as ID_IN_IN_SetKeyboardState, IN_SetMouseState as ID_IN_IN_SetMouseState, IN_SetPaused as ID_IN_IN_SetPaused, IN_SetupJoy as ID_IN_IN_SetupJoy, IN_StartAck as ID_IN_IN_StartAck, IN_StartDemoPlayback as ID_IN_IN_StartDemoPlayback, IN_StartDemoRecord as ID_IN_IN_StartDemoRecord, IN_Startup as ID_IN_IN_Startup, IN_UserInput as ID_IN_IN_UserInput, IN_WaitForASCII as ID_IN_IN_WaitForASCII, IN_WaitForKey as ID_IN_IN_WaitForKey, INL_GetJoyDelta as ID_IN_INL_GetJoyDelta, INL_KeyService as ID_IN_INL_KeyService } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_IN.C.ts"),
        )}";`,
        `export { audiostarts as ID_CA_audiostarts, audiosegs as ID_CA_audiosegs, audiopurge as ID_CA_audiopurge, CA_CacheAudioChunk as ID_CA_CA_CacheAudioChunk, CA_CacheGrChunk as ID_CA_CA_CacheGrChunk, CA_CacheMap as ID_CA_CA_CacheMap, CA_CacheMarks as ID_CA_CA_CacheMarks, CA_CacheScreen as ID_CA_CA_CacheScreen, CA_ClearAllMarks as ID_CA_CA_ClearAllMarks, CA_ClearMarks as ID_CA_CA_ClearMarks, CA_ClearVirtualFiles as ID_CA_CA_ClearVirtualFiles, CA_CloseDebug as ID_CA_CA_CloseDebug, CA_CloseFileHandle as ID_CA_CA_CloseFileHandle, CA_DebugCacheState as ID_CA_CA_DebugCacheState, CA_DebugFileHandle as ID_CA_CA_DebugFileHandle, CA_DownLevel as ID_CA_CA_DownLevel, CA_FarRead as ID_CA_CA_FarRead, CA_FarWrite as ID_CA_CA_FarWrite, CA_GetVirtualFile as ID_CA_CA_GetVirtualFile, CA_LoadAllSounds as ID_CA_CA_LoadAllSounds, CA_LoadFile as ID_CA_CA_LoadFile, CA_MarkGrChunk as ID_CA_CA_MarkGrChunk, CA_OpenDebug as ID_CA_CA_OpenDebug, CA_OpenFileHandle as ID_CA_CA_OpenFileHandle, CA_ReadFile as ID_CA_CA_ReadFile, CA_RLEWCompress as ID_CA_CA_RLEWCompress, CA_RLEWexpand as ID_CA_CA_RLEWexpand, CA_SetAllPurge as ID_CA_CA_SetAllPurge, CA_SetVirtualFile as ID_CA_CA_SetVirtualFile, CA_SetWL6Files as ID_CA_CA_SetWL6Files, CA_Startup as ID_CA_CA_Startup, CA_UpLevel as ID_CA_CA_UpLevel, CA_WriteFile as ID_CA_CA_WriteFile, CAL_GetGrChunkLength as ID_CA_CAL_GetGrChunkLength, CAL_HuffExpand as ID_CA_CAL_HuffExpand, CAL_SetupGrFile as ID_CA_CAL_SetupGrFile, debughandle as ID_CA_debughandle, grneeded as ID_CA_grneeded, grpurge as ID_CA_grpurge, grsegs as ID_CA_grsegs, GRFILEPOS as ID_CA_GRFILEPOS, mapon as ID_CA_mapon, mapsegs as ID_CA_mapsegs, UNCACHEGRCHUNK as ID_CA_UNCACHEGRCHUNK } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_CA.C.ts"),
        )}";`,
        `export { pml_Locked as ID_PM_pml_Locked, pml_Unlocked as ID_PM_pml_Unlocked } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_PM.H.ts"),
        )}";`,
        `export { ChunksInFile as ID_PM_ChunksInFile, MainPagesUsed as ID_PM_MainPagesUsed, PM_DebugState as ID_PM_PM_DebugState, PM_GetPage as ID_PM_PM_GetPage, PM_GetPageAddress as ID_PM_PM_GetPageAddress, PM_GetSoundPage as ID_PM_PM_GetSoundPage, PM_GetSpritePage as ID_PM_PM_GetSpritePage, PM_NextFrame as ID_PM_PM_NextFrame, PM_Preload as ID_PM_PM_Preload, PM_SetMainMemPurge as ID_PM_PM_SetMainMemPurge, PM_SetPageLock as ID_PM_PM_SetPageLock, PM_Shutdown as ID_PM_PM_Shutdown, PM_Startup as ID_PM_PM_Startup, PMFrameCount as ID_PM_PMFrameCount, PMPages as ID_PM_PMPages, PMStarted as ID_PM_PMStarted, PMSoundStart as ID_PM_PMSoundStart, PMSpriteStart as ID_PM_PMSpriteStart, PML_GiveLRUPage as ID_PM_PML_GiveLRUPage, PML_ReadFromFile as ID_PM_PML_ReadFromFile } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_PM.C.ts"),
        )}";`,
        `export { MM_BombOnError as ID_MM_MM_BombOnError, MM_DebugState as ID_MM_MM_DebugState, MM_FreePtr as ID_MM_MM_FreePtr, MM_GetPtr as ID_MM_MM_GetPtr, MM_NewPtrRef as ID_MM_MM_NewPtrRef, MM_SetLock as ID_MM_MM_SetLock, MM_SetPurge as ID_MM_MM_SetPurge, MM_Shutdown as ID_MM_MM_Shutdown, MM_SortMem as ID_MM_MM_SortMem, MM_Startup as ID_MM_MM_Startup, MM_TotalFree as ID_MM_MM_TotalFree, MM_UnusedMemory as ID_MM_MM_UnusedMemory, MML_ClearBlock as ID_MM_MML_ClearBlock, bufferseg as ID_MM_bufferseg } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_MM.C.ts"),
        )}";`,
        `export { NewGameMemory } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "TS_GAME_STATE.ts"),
        )}";`,
        `export { STATINFO_WL6, starthitpoints, copyWallDataToLevelMemory, clearAmbushMarkers, levelTilemapCell, levelActoratCell, InitActorListMemory, GetNewActorMemory, RemoveObjMemory, SpawnNewObjMemory, NewStateMemory, CheckLineMemory, CheckSightMemory, FirstSightingMemory, SightPlayerMemory, TakeDamageMemory, T_ShootMemory, T_BiteMemory, ClearPaletteShiftsMemory, StartBonusFlashMemory, StartDamageFlashMemory, UpdatePaletteShiftsMemory, FinishPaletteShiftsMemory, UpdateFaceMemory, PollControlsMemory, PlayLoopStepMemory, GiveExtraManMemory, GivePointsMemory, GivePointsSummaryMemory, GiveAmmoMemory, GiveWeaponMemory, GiveKeyMemory, HealSelfMemory, GetBonusMemory, CheckWeaponChangeMemory, CmdFireMemory, KnifeAttackMemory, GunAttackMemory, T_AttackMemory, TryMoveMemory, ClipMoveMemory, ThrustMemory, ControlMovementMemory, VictoryTileMemory, VictorySpinMemory, InitAreasMemory, ConnectAreasMemory, RecursiveConnectMemory, CloseDoorMemory, DoorOpenMemory, DoorOpeningMemory, DoorClosingMemory, MoveDoorsMemory, OperateDoorMemory, PushWallMemory, MovePWallsMemory, CmdUseMemory, T_PlayerMemory, PlaceItemTypeMemory, DropItemMemory, KillActorMemory, DamageActorMemory, T_StandMemory, ProjectileTryMoveMemory, T_ProjectileMemory, T_SchabbThrowMemory, T_GiftThrowMemory, T_FakeFireMemory, SelectChaseDirMemory, SelectDodgeDirMemory, T_ChaseMemory, T_DogChaseMemory, T_GhostsMemory, OpenDoorMemory, TryWalkMemory, MoveObjMemory, SelectPathDirMemory, T_PathMemory, DoActorMemory, SpawnStandMemory, SpawnDeadGuardMemory, SpawnPatrolMemory, SpawnGhostsMemory, SpawnBossMemory, SpawnGretelMemory, SpawnGiftMemory, SpawnFatMemory, SpawnFakeHitlerMemory, SpawnHitlerMemory, InitStaticListMemory, InitDoorListMemory, SpawnDoorMemory, spawnDoorsFromWallPlane, SpawnStaticMemory, scanStaticPlaneMemory, SpawnPlayerMemory, scanPlayerStartsMemory, scanSecretPushwallsMemory, scanEnemyPlaneMemory } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "TS_LEVEL_SETUP.ts"),
        )}";`,
        `export { ClearMemory as WL_GAME_ClearMemory, demoplayback as WL_GAME_demoplayback, demorecord as WL_GAME_demorecord, demoname as WL_GAME_demoname, Died as WL_GAME_Died, DrawAllPlayBorder as WL_GAME_DrawAllPlayBorder, DrawAllPlayBorderSides as WL_GAME_DrawAllPlayBorderSides, DrawPlayBorder as WL_GAME_DrawPlayBorder, DrawPlayBorderSides as WL_GAME_DrawPlayBorderSides, DrawPlayScreen as WL_GAME_DrawPlayScreen, FinishDemoRecord as WL_GAME_FinishDemoRecord, GameLoop as WL_GAME_GameLoop, ingame as WL_GAME_ingame, MAXDEMOSIZE as WL_GAME_MAXDEMOSIZE, PlayDemo as WL_GAME_PlayDemo, PlayDemoTrace as WL_GAME_PlayDemoTrace, PlaySoundLocGlobal as WL_GAME_PlaySoundLocGlobal, RecordDemo as WL_GAME_RecordDemo, ScanInfoPlane as WL_GAME_ScanInfoPlane, SetSoundLoc as WL_GAME_SetSoundLoc, SetupGameLevel as WL_GAME_SetupGameLevel, StartDemoRecord as WL_GAME_StartDemoRecord, UpdateSoundLoc as WL_GAME_UpdateSoundLoc } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_GAME.C.ts"),
        )}";`,
        `export { BackDoor as WL_INTER_BackDoor, BJ_Breathe as WL_INTER_BJ_Breathe, CheckHighScore as WL_INTER_CheckHighScore, ClearSplitVWB as WL_INTER_ClearSplitVWB, CopyProtection as WL_INTER_CopyProtection, DrawHighScores as WL_INTER_DrawHighScores, EndScreen as WL_INTER_EndScreen, EndSpear as WL_INTER_EndSpear, lastPreloadUpdate as WL_INTER_lastPreloadUpdate, LevelCompleted as WL_INTER_LevelCompleted, LevelRatios as WL_INTER_LevelRatios, NonShareware as WL_INTER_NonShareware, PG13 as WL_INTER_PG13, PreloadGraphics as WL_INTER_PreloadGraphics, PreloadUpdate as WL_INTER_PreloadUpdate, Victory as WL_INTER_Victory, Write as WL_INTER_Write } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_INTER.C.ts"),
        )}";`,
        `export { CountObjects as WL_DEBUG_CountObjects, DebugKeys as WL_DEBUG_DebugKeys, DebugMemory as WL_DEBUG_DebugMemory, OverheadRefresh as WL_DEBUG_OverheadRefresh, PicturePause as WL_DEBUG_PicturePause, ShapeTest as WL_DEBUG_ShapeTest, ViewMap as WL_DEBUG_ViewMap } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_DEBUG.C.ts"),
        )}";`,
        `export { BackPage as WL_TEXT_BackPage, CacheLayoutGraphics as WL_TEXT_CacheLayoutGraphics, EndText as WL_TEXT_EndText, HandleCommand as WL_TEXT_HandleCommand, HandleCtrls as WL_TEXT_HandleCtrls, HandleWord as WL_TEXT_HandleWord, HelpScreens as WL_TEXT_HelpScreens, NewLine as WL_TEXT_NewLine, PageLayout as WL_TEXT_PageLayout, ParseNumber as WL_TEXT_ParseNumber, ParsePicCommand as WL_TEXT_ParsePicCommand, ParseTimedCommand as WL_TEXT_ParseTimedCommand, RipToEOL as WL_TEXT_RipToEOL, ShowArticle as WL_TEXT_ShowArticle, TimedPicCommand as WL_TEXT_TimedPicCommand } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_TEXT.C.ts"),
        )}";`,
        `export { bordercolor as ID_VL_bordercolor, bufferofs as ID_VL_bufferofs, currentPalette as ID_VL_currentPalette, deplaned as ID_VL_deplaned, displayofs as ID_VL_displayofs, fastpalette as ID_VL_fastpalette, linewidth as ID_VL_linewidth, mapmask as ID_VL_mapmask, palette1 as ID_VL_palette1, palette2 as ID_VL_palette2, pelpan as ID_VL_pelpan, screenfaded as ID_VL_screenfaded, splitScreenLine as ID_VL_splitScreenLine, verticalBlankWaits as ID_VL_verticalBlankWaits, vgaPlaneMode as ID_VL_vgaPlaneMode, videoMode as ID_VL_videoMode, videoPlanes as ID_VL_videoPlanes, VL_Bar as ID_VL_VL_Bar, VL_ClearVideo as ID_VL_VL_ClearVideo, VL_ColorBorder as ID_VL_VL_ColorBorder, VL_DebugVideoState as ID_VL_VL_DebugVideoState, VL_DePlaneVGA as ID_VL_VL_DePlaneVGA, VL_DrawLatch8String as ID_VL_VL_DrawLatch8String, VL_DrawTile8String as ID_VL_VL_DrawTile8String, VL_FadeIn as ID_VL_VL_FadeIn, VL_FadeOut as ID_VL_VL_FadeOut, VL_FillPalette as ID_VL_VL_FillPalette, VL_GetColor as ID_VL_VL_GetColor, VL_GetPalette as ID_VL_VL_GetPalette, VL_Hlin as ID_VL_VL_Hlin, VL_LatchToScreen as ID_VL_VL_LatchToScreen, VL_MaskedToScreen as ID_VL_VL_MaskedToScreen, VL_MemToLatch as ID_VL_VL_MemToLatch, VL_MemToScreen as ID_VL_VL_MemToScreen, VL_Plot as ID_VL_VL_Plot, VL_ResetVideoState as ID_VL_VL_ResetVideoState, VL_ScreenToScreen as ID_VL_VL_ScreenToScreen, VL_SetBufferOffset as ID_VL_VL_SetBufferOffset, VL_SetColor as ID_VL_VL_SetColor, VL_SetCRTC as ID_VL_VL_SetCRTC, VL_SetLineWidth as ID_VL_VL_SetLineWidth, VL_SetPalette as ID_VL_VL_SetPalette, VL_SetScreen as ID_VL_VL_SetScreen, VL_SetSplitScreen as ID_VL_VL_SetSplitScreen, VL_SetTextMode as ID_VL_VL_SetTextMode, VL_SetVGAPlaneMode as ID_VL_VL_SetVGAPlaneMode, VL_Shutdown as ID_VL_VL_Shutdown, VL_SizeTile8String as ID_VL_VL_SizeTile8String, VL_Startup as ID_VL_VL_Startup, VL_TestPaletteSet as ID_VL_VL_TestPaletteSet, VL_Vlin as ID_VL_VL_Vlin, VL_WaitVBL as ID_VL_VL_WaitVBL, vlStarted as ID_VL_vlStarted, ylookup as ID_VL_ylookup } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_VL.C.ts"),
        )}";`,
        `export { bufferheight as ID_VH_bufferheight, bufferwidth as ID_VH_bufferwidth, FizzleFade as ID_VH_FizzleFade, fontcolor as ID_VH_fontcolor, fontnumber as ID_VH_fontnumber, freelatch as ID_VH_freelatch, lastFizzleFade as ID_VH_lastFizzleFade, latchpics as ID_VH_latchpics, LatchDrawPic as ID_VH_LatchDrawPic, LoadLatchMem as ID_VH_LoadLatchMem, px as ID_VH_px, py as ID_VH_py, update as ID_VH_update, VH_DebugPlaneByte as ID_VH_VH_DebugPlaneByte, VL_MungePic as ID_VH_VL_MungePic, VW_DebugFontState as ID_VH_VW_DebugFontState, VW_DrawColorPropString as ID_VH_VW_DrawColorPropString, VW_DrawPropString as ID_VH_VW_DrawPropString, VW_MarkUpdateBlock as ID_VH_VW_MarkUpdateBlock, VW_MeasureMPropString as ID_VH_VW_MeasureMPropString, VW_MeasurePropString as ID_VH_VW_MeasurePropString, VW_SetFontState as ID_VH_VW_SetFontState, VW_UpdateScreen as ID_VH_VW_UpdateScreen, VWB_Bar as ID_VH_VWB_Bar, VWB_DrawPic as ID_VH_VWB_DrawPic, VWB_DrawPropString as ID_VH_VWB_DrawPropString, VWB_DrawTile8 as ID_VH_VWB_DrawTile8, VWB_DrawTile8M as ID_VH_VWB_DrawTile8M, VWB_Hlin as ID_VH_VWB_Hlin, VWB_Plot as ID_VH_VWB_Plot, VWB_Vlin as ID_VH_VWB_Vlin, VWL_MeasureString as ID_VH_VWL_MeasureString } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_VH.C.ts"),
        )}";`,
        `export { VL_MungePic as MUNGE_VL_MungePic } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "MUNGE.C.ts"),
        )}";`,
        `export { sdm_AdLib as ID_SD_sdm_AdLib, sdm_Off as ID_SD_sdm_Off, sdm_PC as ID_SD_sdm_PC, sds_Off as ID_SD_sds_Off, sds_PC as ID_SD_sds_PC, sds_SoundBlaster as ID_SD_sds_SoundBlaster, sds_SoundSource as ID_SD_sds_SoundSource, smm_AdLib as ID_SD_smm_AdLib, smm_Off as ID_SD_smm_Off } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_SD.H.ts"),
        )}";`,
        `export { alRegisterWrites as ID_SD_alRegisterWrites, DigiMap as ID_SD_DigiMap, SD_DebugState as ID_SD_SD_DebugState, SD_Default as ID_SD_SD_Default, SD_FadeOutMusic as ID_SD_SD_FadeOutMusic, SD_MusicOff as ID_SD_SD_MusicOff, SD_MusicOn as ID_SD_SD_MusicOn, SD_MusicPlaying as ID_SD_SD_MusicPlaying, SD_PlayDigitized as ID_SD_SD_PlayDigitized, SD_PlaySound as ID_SD_SD_PlaySound, SD_PositionSound as ID_SD_SD_PositionSound, SD_ResetSoundState as ID_SD_SD_ResetSoundState, SD_SetDigiDevice as ID_SD_SD_SetDigiDevice, SD_SetMusicMode as ID_SD_SD_SetMusicMode, SD_SetPosition as ID_SD_SD_SetPosition, SD_SetSoundMode as ID_SD_SD_SetSoundMode, SD_SetUserHook as ID_SD_SD_SetUserHook, SD_SoundPlaying as ID_SD_SD_SoundPlaying, SD_StopSound as ID_SD_SD_StopSound, SD_WaitSoundDone as ID_SD_SD_WaitSoundDone, SDL_ALSoundService as ID_SD_SDL_ALSoundService, SDL_CheckSB as ID_SD_SDL_CheckSB, SDL_CheckSS as ID_SD_SDL_CheckSS, SDL_DetectAdLib as ID_SD_SDL_DetectAdLib, SDL_DetectSoundBlaster as ID_SD_SDL_DetectSoundBlaster, SDL_DetectSoundSource as ID_SD_SDL_DetectSoundSource, SDL_LoadDigiSegment as ID_SD_SDL_LoadDigiSegment, SDL_PCService as ID_SD_SDL_PCService, SDL_PlayDigiSegment as ID_SD_SDL_PlayDigiSegment, SDL_PositionSBP as ID_SD_SDL_PositionSBP, SDL_SBService as ID_SD_SDL_SBService, SDL_SetIntsPerSec as ID_SD_SDL_SetIntsPerSec, SDL_SetTimer0 as ID_SD_SDL_SetTimer0, SDL_SetupDigi as ID_SD_SDL_SetupDigi, SDL_t0Service as ID_SD_SDL_t0Service, SoundTable as ID_SD_SoundTable, STARTMUSIC as ID_SD_STARTMUSIC } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "ID_SD.C.ts"),
        )}";`,
        `export { sbLocation as DETECT_sbLocation, SDL_CheckSB as DETECT_SDL_CheckSB, SDL_DetectSoundBlaster as DETECT_SDL_DetectSoundBlaster } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "DETECT.C.ts"),
        )}";`,
        `export { CalcHeight as WL_DRAW_CalcHeight, CalcRotate as WL_DRAW_CalcRotate, CalcTics as WL_DRAW_CalcTics, ClearScreen as WL_DRAW_ClearScreen, costable as WL_DRAW_costable, DrawPlayerWeapon as WL_DRAW_DrawPlayerWeapon, DrawScaleds as WL_DRAW_DrawScaleds, FarScalePost as WL_DRAW_FarScalePost, finetangent as WL_DRAW_finetangent, FixedByFrac as WL_DRAW_FixedByFrac, FixOfs as WL_DRAW_FixOfs, HitHorizDoor as WL_DRAW_HitHorizDoor, HitHorizPWall as WL_DRAW_HitHorizPWall, HitHorizWall as WL_DRAW_HitHorizWall, HitVertDoor as WL_DRAW_HitVertDoor, HitVertPWall as WL_DRAW_HitVertPWall, HitVertWall as WL_DRAW_HitVertWall, horizwall as WL_DRAW_horizwall, pixelangle as WL_DRAW_pixelangle, ScalePost as WL_DRAW_ScalePost, scaledPosts as WL_DRAW_scaledPosts, SetViewSizeForRefresh as WL_DRAW_SetViewSizeForRefresh, sintable as WL_DRAW_sintable, ThreeDRefresh as WL_DRAW_ThreeDRefresh, TransformActor as WL_DRAW_TransformActor, TransformTile as WL_DRAW_TransformTile, vertwall as WL_DRAW_vertwall, VGAClearScreen as WL_DRAW_VGAClearScreen, vgaCeiling as WL_DRAW_vgaCeiling, viewheight as WL_DRAW_viewheight, viewwidth as WL_DRAW_viewwidth, wallheight as WL_DRAW_wallheight, WallRefresh as WL_DRAW_WallRefresh } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_DRAW.C.ts"),
        )}";`,
        `export { BuildCompScale as WL_SCALE_BuildCompScale, fullscalefarcall as WL_SCALE_fullscalefarcall, mapmasks1 as WL_SCALE_mapmasks1, mapmasks2 as WL_SCALE_mapmasks2, mapmasks3 as WL_SCALE_mapmasks3, ScaleLine as WL_SCALE_ScaleLine, ScaleShape as WL_SCALE_ScaleShape, SetupScaling as WL_SCALE_SetupScaling, SimpleScaleShape as WL_SCALE_SimpleScaleShape } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_SCALE.C.ts"),
        )}";`,
        `export { BuildCompScale as OLDSCALE_BuildCompScale, fullscalefarcall as OLDSCALE_fullscalefarcall, ScaleLine as OLDSCALE_ScaleLine, ScaleShape as OLDSCALE_ScaleShape, SetupScaling as OLDSCALE_SetupScaling, SimpleScaleShape as OLDSCALE_SimpleScaleShape } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "OLDSCALE.C.ts"),
        )}";`,
        `export { BuildCompScale as CONTIGSC_BuildCompScale, fullscalefarcall as CONTIGSC_fullscalefarcall, ScaleLine as CONTIGSC_ScaleLine, ScaleShape as CONTIGSC_ScaleShape, SetupScaling as CONTIGSC_SetupScaling, SimpleScaleShape as CONTIGSC_SimpleScaleShape } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "CONTIGSC.C.ts"),
        )}";`,
        `export { SPR_CHAINREADY as WL_DEF_SPR_CHAINREADY, SPR_DEATHCAM as WL_DEF_SPR_DEATHCAM, SPR_DEMO as WL_DEF_SPR_DEMO, SPR_KNIFEREADY as WL_DEF_SPR_KNIFEREADY, SPR_MACHINEGUNREADY as WL_DEF_SPR_MACHINEGUNREADY, SPR_PISTOLREADY as WL_DEF_SPR_PISTOLREADY } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_DEF.H.ts"),
        )}";`,
        `export { BuildTables as WL_MAIN_BuildTables, CalcProjection as WL_MAIN_CalcProjection, centerx as WL_MAIN_centerx, CONFIG_SIZE as WL_MAIN_CONFIG_SIZE, DemoLoop as WL_MAIN_DemoLoop, DiskFlopAnim as WL_MAIN_DiskFlopAnim, DoJukebox as WL_MAIN_DoJukebox, FinishSignon as WL_MAIN_FinishSignon, focallength as WL_MAIN_focallength, heightnumerator as WL_MAIN_heightnumerator, InitDigiMap as WL_MAIN_InitDigiMap, InitGame as WL_MAIN_InitGame, IsA386 as WL_MAIN_IsA386, JUKEBOX_SONGS as WL_MAIN_JUKEBOX_SONGS, LastDemo as WL_MAIN_LastDemo, lastSetupScalingWidth as WL_MAIN_lastSetupScalingWidth, loadedgame as WL_MAIN_loadedgame, LoadTheGame as WL_MAIN_LoadTheGame, main as WL_MAIN_main, maxslope as WL_MAIN_maxslope, minheightdiv as WL_MAIN_minheightdiv, mouseadjustment as WL_MAIN_mouseadjustment, MS_CheckParm as WL_MAIN_MS_CheckParm, MS_SetArgv as WL_MAIN_MS_SetArgv, MusicMenu as WL_MAIN_MusicMenu, NewGame as WL_MAIN_NewGame, NewViewSize as WL_MAIN_NewViewSize, Patch386 as WL_MAIN_Patch386, Quit as WL_MAIN_Quit, ReadConfig as WL_MAIN_ReadConfig, SaveTheGame as WL_MAIN_SaveTheGame, scale as WL_MAIN_scale, screenofs as WL_MAIN_screenofs, SetMainLoopState as WL_MAIN_SetMainLoopState, SetupWalls as WL_MAIN_SetupWalls, SetMouseAdjustment as WL_MAIN_SetMouseAdjustment, SetViewSize as WL_MAIN_SetViewSize, shootdelta as WL_MAIN_shootdelta, ShowViewSize as WL_MAIN_ShowViewSize, ShutdownId as WL_MAIN_ShutdownId, SignonScreen as WL_MAIN_SignonScreen, startgame as WL_MAIN_startgame, viewheight as WL_MAIN_viewheight, viewsize as WL_MAIN_viewsize, viewwidth as WL_MAIN_viewwidth, wolfdigimap as WL_MAIN_wolfdigimap, WriteConfig as WL_MAIN_WriteConfig } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_MAIN.C.ts"),
        )}";`,
        `export { basedist as WOLFHACK_basedist, DrawPlanes as WOLFHACK_DrawPlanes, DrawSpans as WOLFHACK_DrawSpans, FixedMul as WOLFHACK_FixedMul, halfheight as WOLFHACK_halfheight, mirrorofs as WOLFHACK_mirrorofs, mr_count as WOLFHACK_mr_count, mr_dest as WOLFHACK_mr_dest, planepics as WOLFHACK_planepics, planeylookup as WOLFHACK_planeylookup, psin as WOLFHACK_psin, pcos as WOLFHACK_pcos, SetPlaneViewSize as WOLFHACK_SetPlaneViewSize, spanstart as WOLFHACK_spanstart, stepscale as WOLFHACK_stepscale } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WOLFHACK.C.ts"),
        )}";`,
        `export { F_LDIV as H_LDIV_F_LDIV, F_LMOD as H_LDIV_F_LMOD, F_LUDIV as H_LDIV_F_LUDIV, F_LUMOD as H_LDIV_F_LUMOD, LDIV as H_LDIV_LDIV, LMOD as H_LDIV_LMOD, LUDIV as H_LDIV_LUDIV, LUMOD as H_LDIV_LUMOD, N_LDIV as H_LDIV_N_LDIV, N_LMOD as H_LDIV_N_LMOD, N_LUDIV as H_LDIV_N_LUDIV, N_LUMOD as H_LDIV_N_LUMOD } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "H_LDIV.ASM.ts"),
        )}";`,
        `export { CheckIs386 as WL_ASM_CheckIs386, jabhack2 as WL_ASM_jabhack2, ldivPatchApplied as WL_ASM_ldivPatchApplied } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_ASM.ASM.ts"),
        )}";`,
        `export { CheckLine as WL_STATE_CheckLine, CheckSight as WL_STATE_CheckSight, DamageActor as WL_STATE_DamageActor, DropItem as WL_STATE_DropItem, FirstSighting as WL_STATE_FirstSighting, KillActor as WL_STATE_KillActor, MoveObj as WL_STATE_MoveObj, SelectChaseDir as WL_STATE_SelectChaseDir, SelectDodgeDir as WL_STATE_SelectDodgeDir, SightPlayer as WL_STATE_SightPlayer, TryWalk as WL_STATE_TryWalk } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_STATE.C.ts"),
        )}";`,
        `export { CloseDoor as WL_ACT1_CloseDoor, ConnectAreas as WL_ACT1_ConnectAreas, DoorClosing as WL_ACT1_DoorClosing, DoorOpen as WL_ACT1_DoorOpen, DoorOpening as WL_ACT1_DoorOpening, InitAreas as WL_ACT1_InitAreas, InitDoorList as WL_ACT1_InitDoorList, InitStaticList as WL_ACT1_InitStaticList, MoveDoors as WL_ACT1_MoveDoors, MovePWalls as WL_ACT1_MovePWalls, OpenDoor as WL_ACT1_OpenDoor, OperateDoor as WL_ACT1_OperateDoor, PlaceItemType as WL_ACT1_PlaceItemType, PushWall as WL_ACT1_PushWall, RecursiveConnect as WL_ACT1_RecursiveConnect, SpawnDoor as WL_ACT1_SpawnDoor, SpawnStatic as WL_ACT1_SpawnStatic } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_ACT1.C.ts"),
        )}";`,
        `export { A_Breathing as WL_ACT2_A_Breathing, A_DeathScream as WL_ACT2_A_DeathScream, A_Dormant as WL_ACT2_A_Dormant, A_HitlerMorph as WL_ACT2_A_HitlerMorph, A_MechaSound as WL_ACT2_A_MechaSound, A_Relaunch as WL_ACT2_A_Relaunch, A_Slurpie as WL_ACT2_A_Slurpie, A_Smoke as WL_ACT2_A_Smoke, A_StartAttack as WL_ACT2_A_StartAttack, A_StartDeathCam as WL_ACT2_A_StartDeathCam, A_Victory as WL_ACT2_A_Victory, CheckPosition as WL_ACT2_CheckPosition, ProjectileTryMove as WL_ACT2_ProjectileTryMove, SelectPathDir as WL_ACT2_SelectPathDir, SpawnAngel as WL_ACT2_SpawnAngel, SpawnBJVictory as WL_ACT2_SpawnBJVictory, SpawnDeath as WL_ACT2_SpawnDeath, SpawnSpectre as WL_ACT2_SpawnSpectre, SpawnTrans as WL_ACT2_SpawnTrans, SpawnUber as WL_ACT2_SpawnUber, SpawnWill as WL_ACT2_SpawnWill, T_Bite as WL_ACT2_T_Bite, T_BJDone as WL_ACT2_T_BJDone, T_BJJump as WL_ACT2_T_BJJump, T_BJRun as WL_ACT2_T_BJRun, T_BJYell as WL_ACT2_T_BJYell, T_Chase as WL_ACT2_T_Chase, T_DogChase as WL_ACT2_T_DogChase, T_FakeFire as WL_ACT2_T_FakeFire, T_Ghosts as WL_ACT2_T_Ghosts, T_GiftThrow as WL_ACT2_T_GiftThrow, T_Launch as WL_ACT2_T_Launch, T_Path as WL_ACT2_T_Path, T_Projectile as WL_ACT2_T_Projectile, T_SchabbThrow as WL_ACT2_T_SchabbThrow, T_Shoot as WL_ACT2_T_Shoot, T_Stand as WL_ACT2_T_Stand, T_UShoot as WL_ACT2_T_UShoot, T_Will as WL_ACT2_T_Will } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_ACT2.C.ts"),
        )}";`,
        `export { CheckWeaponChange as WL_AGENT_CheckWeaponChange, ClipMove as WL_AGENT_ClipMove, Cmd_Fire as WL_AGENT_Cmd_Fire, Cmd_Use as WL_AGENT_Cmd_Use, ControlMovement as WL_AGENT_ControlMovement, DrawAmmo as WL_AGENT_DrawAmmo, DrawFace as WL_AGENT_DrawFace, DrawHealth as WL_AGENT_DrawHealth, DrawKeys as WL_AGENT_DrawKeys, DrawLevel as WL_AGENT_DrawLevel, DrawLives as WL_AGENT_DrawLives, DrawScore as WL_AGENT_DrawScore, DrawWeapon as WL_AGENT_DrawWeapon, GetBonus as WL_AGENT_GetBonus, GiveAmmo as WL_AGENT_GiveAmmo, GiveExtraMan as WL_AGENT_GiveExtraMan, GiveKey as WL_AGENT_GiveKey, GivePoints as WL_AGENT_GivePoints, GiveWeapon as WL_AGENT_GiveWeapon, GunAttack as WL_AGENT_GunAttack, HealSelf as WL_AGENT_HealSelf, KnifeAttack as WL_AGENT_KnifeAttack, LatchNumber as WL_AGENT_LatchNumber, SpawnPlayer as WL_AGENT_SpawnPlayer, StatusDrawPic as WL_AGENT_StatusDrawPic, T_Attack as WL_AGENT_T_Attack, T_Player as WL_AGENT_T_Player, TakeDamage as WL_AGENT_TakeDamage, Thrust as WL_AGENT_Thrust, TryMove as WL_AGENT_TryMove, UpdateFace as WL_AGENT_UpdateFace, VictorySpin as WL_AGENT_VictorySpin, VictoryTile as WL_AGENT_VictoryTile } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_AGENT.C.ts"),
        )}";`,
        `export { bt_attack as WL_PLAY_bt_attack, bt_nobutton as WL_PLAY_bt_nobutton, bt_run as WL_PLAY_bt_run, bt_strafe as WL_PLAY_bt_strafe, bt_use as WL_PLAY_bt_use, buttonjoy as WL_PLAY_buttonjoy, buttonmouse as WL_PLAY_buttonmouse, buttonscan as WL_PLAY_buttonscan, CenterWindow as WL_PLAY_CenterWindow, CheckKeys as WL_PLAY_CheckKeys, ClearPaletteShifts as WL_PLAY_ClearPaletteShifts, DebugOk as WL_PLAY_DebugOk, dirscan as WL_PLAY_dirscan, DoActor as WL_PLAY_DoActor, FinishPaletteShifts as WL_PLAY_FinishPaletteShifts, GetNewActor as WL_PLAY_GetNewActor, godmode as WL_PLAY_godmode, InitActorList as WL_PLAY_InitActorList, InitRedShifts as WL_PLAY_InitRedShifts, PlayLoop as WL_PLAY_PlayLoop, PollControls as WL_PLAY_PollControls, PollJoystickButtons as WL_PLAY_PollJoystickButtons, PollJoystickMove as WL_PLAY_PollJoystickMove, PollKeyboardButtons as WL_PLAY_PollKeyboardButtons, PollKeyboardMove as WL_PLAY_PollKeyboardMove, PollMouseButtons as WL_PLAY_PollMouseButtons, PollMouseMove as WL_PLAY_PollMouseMove, RemoveObj as WL_PLAY_RemoveObj, StartBonusFlash as WL_PLAY_StartBonusFlash, StartDamageFlash as WL_PLAY_StartDamageFlash, StartMusic as WL_PLAY_StartMusic, StopMusic as WL_PLAY_StopMusic, UpdatePaletteShifts as WL_PLAY_UpdatePaletteShifts } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_PLAY.C.ts"),
        )}";`,
        `export { BossKey as WL_MENU_BossKey, CacheLump as WL_MENU_CacheLump, CalibrateJoystick as WL_MENU_CalibrateJoystick, CheckForEpisodes as WL_MENU_CheckForEpisodes, CheckPause as WL_MENU_CheckPause, CleanupControlPanel as WL_MENU_CleanupControlPanel, ClearMScreen as WL_MENU_ClearMScreen, Confirm as WL_MENU_Confirm, CP_ChangeView as WL_MENU_CP_ChangeView, CP_CheckQuick as WL_MENU_CP_CheckQuick, CP_Control as WL_MENU_CP_Control, CP_EndGame as WL_MENU_CP_EndGame, CP_LoadGame as WL_MENU_CP_LoadGame, CP_NewGame as WL_MENU_CP_NewGame, CP_Quit as WL_MENU_CP_Quit, CP_ReadThis as WL_MENU_CP_ReadThis, CP_SaveGame as WL_MENU_CP_SaveGame, CP_Sound as WL_MENU_CP_Sound, CP_ViewScores as WL_MENU_CP_ViewScores, CtlItems as WL_MENU_CtlItems, CtlMenu as WL_MENU_CtlMenu, CusItems as WL_MENU_CusItems, CusMenu as WL_MENU_CusMenu, CustomControls as WL_MENU_CustomControls, DefineJoyBtns as WL_MENU_DefineJoyBtns, DefineKeyBtns as WL_MENU_DefineKeyBtns, DefineKeyMove as WL_MENU_DefineKeyMove, DefineMouseBtns as WL_MENU_DefineMouseBtns, DrawChangeView as WL_MENU_DrawChangeView, DrawCtlScreen as WL_MENU_DrawCtlScreen, DrawCustJoy as WL_MENU_DrawCustJoy, DrawCustKeybd as WL_MENU_DrawCustKeybd, DrawCustKeys as WL_MENU_DrawCustKeys, DrawCustMouse as WL_MENU_DrawCustMouse, DrawCustomScreen as WL_MENU_DrawCustomScreen, DrawGun as WL_MENU_DrawGun, DrawHalfStep as WL_MENU_DrawHalfStep, DrawLoadSaveScreen as WL_MENU_DrawLoadSaveScreen, DrawLSAction as WL_MENU_DrawLSAction, DrawMainMenu as WL_MENU_DrawMainMenu, DrawMenu as WL_MENU_DrawMenu, DrawMenuGun as WL_MENU_DrawMenuGun, DrawMouseSens as WL_MENU_DrawMouseSens, DrawNewEpisode as WL_MENU_DrawNewEpisode, DrawNewGame as WL_MENU_DrawNewGame, DrawNewGameDiff as WL_MENU_DrawNewGameDiff, DrawOutline as WL_MENU_DrawOutline, DrawSoundMenu as WL_MENU_DrawSoundMenu, DrawStripes as WL_MENU_DrawStripes, DrawWindow as WL_MENU_DrawWindow, EnterCtrlData as WL_MENU_EnterCtrlData, EpisodeSelect as WL_MENU_EpisodeSelect, EraseGun as WL_MENU_EraseGun, FixupCustom as WL_MENU_FixupCustom, FreeMusic as WL_MENU_FreeMusic, GetYorN as WL_MENU_GetYorN, HandleMenu as WL_MENU_HandleMenu, IN_GetScanName as WL_MENU_IN_GetScanName, IntroScreen as WL_MENU_IntroScreen, KEYBOARDBTNS as WL_MENU_KEYBOARDBTNS, KEYBOARDMOVE as WL_MENU_KEYBOARDMOVE, LSItems as WL_MENU_LSItems, LSMenu as WL_MENU_LSMenu, MainItems as WL_MENU_MainItems, MainMenu as WL_MENU_MainMenu, Message as WL_MENU_Message, MOUSE as WL_MENU_MOUSE, MouseSensitivity as WL_MENU_MouseSensitivity, NewEitems as WL_MENU_NewEitems, NewEmenu as WL_MENU_NewEmenu, NewItems as WL_MENU_NewItems, NewMenu as WL_MENU_NewMenu, pickquick as WL_MENU_pickquick, PrintCustJoy as WL_MENU_PrintCustJoy, PrintCustKeybd as WL_MENU_PrintCustKeybd, PrintCustKeys as WL_MENU_PrintCustKeys, PrintCustMouse as WL_MENU_PrintCustMouse, PrintLSEntry as WL_MENU_PrintLSEntry, ReadAnyControl as WL_MENU_ReadAnyControl, SaveGameNames as WL_MENU_SaveGameNames, SaveGamesAvail as WL_MENU_SaveGamesAvail, SaveName as WL_MENU_SaveName, SetTextColor as WL_MENU_SetTextColor, SetupControlPanel as WL_MENU_SetupControlPanel, ShootSnd as WL_MENU_ShootSnd, SndItems as WL_MENU_SndItems, SndMenu as WL_MENU_SndMenu, SoundStatus as WL_MENU_SoundStatus, StartCPMusic as WL_MENU_StartCPMusic, TicDelay as WL_MENU_TicDelay, TrackWhichGame as WL_MENU_TrackWhichGame, UnCacheLump as WL_MENU_UnCacheLump, US_ControlPanel as WL_MENU_US_ControlPanel, WaitKeyUp as WL_MENU_WaitKeyUp } from "${moduleSpecifier(
          tempDir,
          path.join(targetDir, "WL_MENU.C.ts"),
        )}";`,
      ].join("\n"),
    );
    await build({
      entryPoints: [entryPath],
      outfile: outPath,
      bundle: true,
      format: "esm",
      platform: "node",
      logLevel: "silent",
    });

    const [mod, layout] = await Promise.all([
      import(`${pathToFileURL(outPath).href}?cache=${Date.now()}`),
      readFile(dgroupLayoutPath, "utf8").then((text) => JSON.parse(text)),
    ]);
    mod.US_InitRndT(false);
    const rndSequenceAfterSeed0 = [mod.US_RndT(), mod.US_RndT(), mod.US_RndT()];
    const gameState = checkRuntimeGameState(mod);
    const saveResult = buildSyntheticSaveImage(mod, layout);
    const demoSummaries = await checkRuntimeDemoParsing(mod);
    const demoPlayback = await checkRuntimeDemoPlayback(mod);
    const levelSetup = await checkRuntimeLevelSetup(mod);
    const listSetup = checkRuntimeListSetup(mod);
    const pathMovement = checkRuntimePathMovement(mod);
    const awareness = checkRuntimeAwareness(mod);
    const chase = checkRuntimeChase(mod);
    const dogGhost = checkRuntimeDogGhostChase(mod);
    const checkPosition = checkRuntimeCheckPosition(mod);
    const damage = checkRuntimeDamage(mod);
    const paletteShifts = checkRuntimePaletteShifts(mod);
    const faceUpdate = checkRuntimeFaceUpdate(mod);
    const actorDamage = checkRuntimeActorDamage(mod);
    const playerEquipment = checkRuntimePlayerEquipment(mod);
    const playerAttacks = checkRuntimePlayerAttacks(mod);
    const attackFrames = checkRuntimeAttackFrames(mod);
    const pickups = checkRuntimePickups(mod);
    const weaponChange = checkRuntimeWeaponChange(mod);
    const pollControls = checkRuntimePollControls(mod);
    const playLoopStep = checkRuntimePlayLoopStep(mod);
    const checkKeys = checkRuntimeCheckKeys(mod);
    const longDivide = checkRuntimeLongDivide(mod);
    const asmRuntime = checkRuntimeAsm(mod);
    const rendererMath = checkRuntimeRendererMath(mod);
    const scalers = await checkRuntimeScalers(mod);
    const viewSize = checkRuntimeViewSize(mod);
    const setupTables = checkRuntimeSetupTables(mod);
    const intermission = checkRuntimeIntermission(mod);
    const debugText = checkRuntimeDebugText(mod);
    const drawRuntime = checkRuntimeDrawRuntime(mod);
    const spearActions = checkRuntimeSpearActions(mod);
    const soundLoc = checkRuntimeSoundLoc(mod);
    const windowState = checkRuntimeWindowState(mod);
    const vgaPalette = checkRuntimeVgaPalette(mod);
    const cacheManager = await checkRuntimeCacheManager(mod);
    const pageManager = await checkRuntimePageManager(mod);
    const memoryManager = checkRuntimeMemoryManager(mod);
    const soundManager = checkRuntimeSoundManager(mod);
    const clearMemory = checkRuntimeClearMemory(mod);
    const music = checkRuntimeMusic(mod);
    const input = checkRuntimeInput(mod);
    const inputManager = checkRuntimeInputManager(mod);
    const playerMovement = checkRuntimePlayerMovement(mod);
    const doorLifecycle = checkRuntimeDoorLifecycle(mod);
    const projectile = checkRuntimeProjectile(mod);
    const smokeAction = checkRuntimeSmokeAction(mod);
    const victoryActions = checkRuntimeVictoryActions(mod);
    const hitlerMorph = checkRuntimeHitlerMorph(mod);
    const bjVictory = checkRuntimeBJVictory(mod);
    const soundActions = checkRuntimeSoundActions(mod);
    const bossProjectiles = checkRuntimeBossProjectiles(mod);

    return {
      rndSequenceAfterSeed0,
      gameState,
      syntheticSaveBytes: saveResult.bytes.length,
      syntheticSaveChecksum: saveResult.checksum,
      syntheticSaveActors: saveResult.actorOffsets.length,
      demoSummaries,
      demoPlayback,
      levelSetup,
      listSetup,
      pathMovement,
      awareness,
      chase,
      dogGhost,
      checkPosition,
      damage,
      paletteShifts,
      faceUpdate,
      actorDamage,
      playerEquipment,
      playerAttacks,
      attackFrames,
      pickups,
      weaponChange,
      pollControls,
      playLoopStep,
      checkKeys,
      longDivide,
      asmRuntime,
      rendererMath,
      scalers,
      viewSize,
      setupTables,
      intermission,
      debugText,
      drawRuntime,
      spearActions,
      soundLoc,
      windowState,
      vgaPalette,
      cacheManager,
      pageManager,
      memoryManager,
      soundManager,
      clearMemory,
      music,
      input,
      inputManager,
      playerMovement,
      doorLifecycle,
      projectile,
      smokeAction,
      victoryActions,
      hitlerMorph,
      bjVictory,
      soundActions,
      bossProjectiles,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function checkRuntimeGameState(mod) {
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");

  function assertFreshGame(dgroup, difficulty, episode, label) {
    const expectedU16 = new Map([
      [0, difficulty],
      [16, 3],
      [18, 100],
      [20, 8],
      [24, 1],
      [26, 1],
      [28, 1],
      [38, episode],
    ]);

    for (let offset = 0; offset < 66; offset++) {
      const wordExpected = expectedU16.get(offset);
      if (wordExpected !== undefined) {
        if (dgroup.u16(gamestate + offset) !== wordExpected) {
          fail(`${label} gamestate word ${offset} mismatch`);
        }
        offset++;
        continue;
      }
      if (offset === 12) {
        if (dgroup.u32(gamestate + offset) !== 40000) {
          fail(`${label} nextextra mismatch`);
        }
        offset += 3;
        continue;
      }
      if (dgroup.u8(gamestate + offset) !== 0) {
        fail(`${label} did not clear gamestate byte ${offset}`);
      }
    }
  }

  const dgroup = new mod.DOSMemory(0x10000);
  dgroup.bytes.fill(0xaa);
  const memorySummary = mod.NewGameMemory(dgroup, 3, 5);
  if (memorySummary.difficulty !== 3 || memorySummary.episode !== 5) {
    fail(`NewGameMemory summary mismatch: ${JSON.stringify(memorySummary)}`);
  }
  assertFreshGame(dgroup, 3, 5, "NewGameMemory");

  const mainDgroup = new mod.DOSMemory(0x10000);
  mainDgroup.bytes.fill(0xbb);
  const mainSummary = mod.WL_MAIN_NewGame(mainDgroup, 1, 4);
  if (
    mainSummary.difficulty !== 1 ||
    mainSummary.episode !== 4 ||
    mainSummary.startgame !== true ||
    mod.WL_MAIN_startgame !== true
  ) {
    fail(`WL_MAIN_NewGame summary/state mismatch: ${JSON.stringify(mainSummary)}`);
  }
  assertFreshGame(mainDgroup, 1, 4, "WL_MAIN_NewGame");

  return {
    difficulty: dgroup.u16(gamestate),
    episode: dgroup.u16(gamestate + 38),
    health: dgroup.u16(gamestate + 18),
    ammo: dgroup.u16(gamestate + 20),
    nextextra: dgroup.u32(gamestate + 12),
    mainStartgame: mod.WL_MAIN_startgame,
    mainEpisode: mainDgroup.u16(gamestate + 38),
  };
}

function buildSyntheticSaveImage(mod, layout) {
  const dgroup = new mod.DOSMemory(0x10000);
  const farSegment = new Uint8Array(0x0800);
  const segments = { "0x33DA": farSegment };
  const fills = new Map();

  for (const record of layout.saveRecords) {
    if (!record.symbolInfo || typeof record.bytes !== "number" || record.name === "checksum") {
      continue;
    }
    const source =
      record.symbolInfo.segment === layout.dgroup.segment ? dgroup.bytes : farSegment;
    const offset = Number.parseInt(record.symbolInfo.nearOffset.slice(2), 16);
    const seed = record.name
      .split("")
      .reduce((value, char) => (value + char.charCodeAt(0)) & 0xff, 0);
    fillPattern(source, offset, record.bytes, seed);
    fills.set(record.name, { source, offset, bytes: record.bytes });
  }

  const objlistOffset = mod.nearOffsetForSymbol("_objlist");
  const playerPointerOffset = mod.nearOffsetForSymbol("_player");
  const actor0 = objlistOffset;
  const actor1 = objlistOffset + layout.structLayouts.objtype.bytes;
  fillPattern(dgroup.bytes, actor0, layout.structLayouts.objtype.bytes, 0x41);
  fillPattern(dgroup.bytes, actor1, layout.structLayouts.objtype.bytes, 0x82);
  dgroup.setU16(playerPointerOffset, actor0);
  dgroup.setU16(actor0, 1);
  dgroup.setU16(actor0 + 56, actor1);
  dgroup.setU16(actor0 + 58, 0);
  dgroup.setU16(actor1, 1);
  dgroup.setU16(actor1 + 56, 0);
  dgroup.setU16(actor1 + 58, actor0);

  const result = mod.serializeSaveGame({ dgroup, segments });
  const parsed = mod.parseSaveGameImage(result.bytes);
  if (!parsed.checksumMatches) {
    fail(`synthetic save checksum mismatch: ${parsed.storedChecksum} !== ${parsed.checksum}`);
  }
  if (parsed.actorRecordCount !== 2 || result.actorOffsets.length !== 2) {
    fail(`synthetic save actor chain mismatch: ${parsed.actorRecordCount}`);
  }
  if (result.actorOffsets[0] !== actor0 || result.actorOffsets[1] !== actor1) {
    fail(`synthetic save actor offsets mismatch: ${result.actorOffsets.join(",")}`);
  }

  const expectedPieceNames = [
    "gamestate",
    "LevelRatios",
    "tilemap",
    "actorat",
    "areaconnect",
    "areabyplayer",
    "objtype",
    "objtype",
    "nullobj",
    "laststatobj",
    "statobjlist",
    "doorposition",
    "doorobjlist",
    "pwallstate",
    "pwallx",
    "pwally",
    "pwalldir",
    "pwallpos",
    "checksum",
  ];
  const actualPieceNames = result.pieces.map((piece) => piece.name);
  if (actualPieceNames.join("\n") !== expectedPieceNames.join("\n")) {
    fail(`synthetic save piece order mismatch:\n${actualPieceNames.join("\n")}`);
  }
  if (result.bytes.length !== parsed.pieces.at(-1).offset + 4) {
    fail("synthetic save parser did not consume the full image");
  }

  const wlMainSaved = mod.WL_MAIN_SaveTheGame({ dgroup, segments }, 12, 34);
  if (!wlMainSaved.saved || wlMainSaved.x !== 12 || wlMainSaved.y !== 34 || !byteEqual(wlMainSaved.bytes, result.bytes)) {
    fail("WL_MAIN SaveTheGame wrapper did not produce the canonical synthetic save image");
  }

  const loadedDgroup = new mod.DOSMemory(0x10000);
  const loadedFarSegment = new Uint8Array(0x0800);
  const loadedSegments = { "0x33DA": loadedFarSegment };
  const loaded = mod.WL_MAIN_LoadTheGame(result.bytes, { dgroup: loadedDgroup, segments: loadedSegments }, 56, 78);
  if (
    !loaded.loaded ||
    !loaded.checksumMatches ||
    loaded.actorRecordCount !== 2 ||
    loaded.actorOffsets.length !== 2 ||
    loaded.x !== 56 ||
    loaded.y !== 78
  ) {
    fail(`WL_MAIN LoadTheGame wrapper did not load the synthetic save image: ${JSON.stringify(loaded)}`);
  }
  const resaved = mod.WL_MAIN_SaveTheGame({ dgroup: loadedDgroup, segments: loadedSegments });
  if (!byteEqual(resaved.bytes, result.bytes)) {
    fail("WL_MAIN LoadTheGame/SaveTheGame did not round-trip byte-identically");
  }

  const corrupt = new Uint8Array(result.bytes);
  corrupt[0] ^= 0x7f;
  const corruptDgroup = new mod.DOSMemory(0x10000);
  const corruptLoaded = mod.loadSaveGameImage(corrupt, {
    dgroup: corruptDgroup,
    segments: { "0x33DA": new Uint8Array(0x0800) },
  });
  const gamestateOffset = mod.nearOffsetForSymbol("_gamestate");
  if (
    corruptLoaded.checksumMatches ||
    !corruptLoaded.checksumPenaltyApplied ||
    corruptDgroup.u32(gamestateOffset + 8) !== 0 ||
    corruptDgroup.u16(gamestateOffset + 16) !== 1 ||
    corruptDgroup.u16(gamestateOffset + 20) !== 8 ||
    corruptDgroup.u16(gamestateOffset + 24) !== 1 ||
    corruptDgroup.u16(gamestateOffset + 26) !== 1 ||
    corruptDgroup.u16(gamestateOffset + 28) !== 1
  ) {
    fail(`loadSaveGameImage did not apply the checksum penalty: ${JSON.stringify(corruptLoaded)}`);
  }

  const baseChecksum = result.checksum;
  farSegment[fills.get("areaconnect").offset] ^= 0xff;
  const farChanged = mod.serializeSaveGame({ dgroup, segments });
  if (farChanged.checksum !== baseChecksum) {
    fail("areaconnect changed the SaveTheGame checksum but should be excluded");
  }
  dgroup.setU8(fills.get("gamestate").offset, dgroup.u8(fills.get("gamestate").offset) ^ 0xff);
  const dgroupChanged = mod.serializeSaveGame({ dgroup, segments });
  if (dgroupChanged.checksum === baseChecksum) {
    fail("gamestate did not change the SaveTheGame checksum");
  }

  return result;
}

function checkRuntimeListSetup(mod) {
  const dgroup = new mod.DOSMemory(0x10000);
  dgroup.bytes.fill(0xaa);
  const farAreaconnect = new Uint8Array(37 * 37).fill(0xbb);
  const objlist = mod.nearOffsetForRuntimeSymbol("_objlist");
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const objtypeBytes = 60;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_TICCOUNT_OFFSET = 2;
  const OBJ_NEXT_OFFSET = 56;
  const OBJ_PREV_OFFSET = 58;

  function actoratCell(tilex, tiley) {
    return actorat + (tilex * 64 + tiley) * 2;
  }

  const actorSummary = mod.InitActorListMemory(dgroup);
  const actor0 = objlist;
  const actor1 = objlist + objtypeBytes;
  if (
    actorSummary.player !== actor0 ||
    actorSummary.objfreelist !== actor1 ||
    actorSummary.lastobj !== actor0 ||
    actorSummary.objcount !== 1
  ) {
    fail(`InitActorListMemory summary mismatch: ${JSON.stringify(actorSummary)}`);
  }
  if (
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player")) !== actor0 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_new")) !== actor0 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastobj")) !== actor0 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== 1
  ) {
    fail("InitActorListMemory pointer globals mismatch");
  }
  if (dgroup.view(actor0, objtypeBytes).some((byte) => byte !== 0)) {
    fail("InitActorListMemory did not memset the player objtype");
  }

  const allocated = mod.GetNewActorMemory(dgroup);
  const actor2 = objlist + objtypeBytes * 2;
  if (
    allocated !== actor1 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objfreelist")) !== actor2 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastobj")) !== actor1 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== 2 ||
    dgroup.u16(actor0 + OBJ_NEXT_OFFSET) !== actor1 ||
    dgroup.u16(actor1 + OBJ_PREV_OFFSET) !== actor0
  ) {
    fail("GetNewActorMemory did not link the second actor like WL_PLAY.C");
  }

  const removed = mod.RemoveObjMemory(dgroup, allocated);
  if (
    removed.actor !== actor1 ||
    removed.prev !== actor0 ||
    removed.next !== 0 ||
    removed.objfreelist !== actor1 ||
    removed.lastobj !== actor0 ||
    removed.objcount !== 1 ||
    dgroup.u16(actor0 + OBJ_NEXT_OFFSET) !== 0 ||
    dgroup.u16(actor1 + OBJ_PREV_OFFSET) !== actor2 ||
    dgroup.u16(actor1 + OBJ_NEXT_OFFSET) !== 0
  ) {
    fail("RemoveObjMemory did not unlink the last actor and push it onto the free list");
  }

  const wrapperSummary = mod.WL_PLAY_InitActorList(new mod.DOSMemory(0x10000));
  if (wrapperSummary.player !== actor0 || wrapperSummary.objfreelist !== actor1 || wrapperSummary.objcount !== 1) {
    fail("WL_PLAY_InitActorList did not forward to InitActorListMemory");
  }

  const reallocated = mod.WL_PLAY_GetNewActor(dgroup);
  if (
    reallocated !== actor1 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objfreelist")) !== actor2 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastobj")) !== actor1 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== 2 ||
    dgroup.u16(actor0 + OBJ_NEXT_OFFSET) !== actor1 ||
    dgroup.u16(actor1 + OBJ_PREV_OFFSET) !== actor0
  ) {
    fail("WL_PLAY_GetNewActor did not reallocate the removed actor");
  }

  const wrapperRemoved = mod.WL_PLAY_RemoveObj(dgroup, reallocated);
  if (wrapperRemoved.objfreelist !== actor1 || dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== 1) {
    fail("WL_PLAY_RemoveObj did not forward to RemoveObjMemory");
  }

  const removeDgroup = new mod.DOSMemory(0x10000);
  const removePlane0 = new Uint16Array(64 * 64).fill(107);
  const removePlane1 = new Uint16Array(64 * 64);
  mod.copyWallDataToLevelMemory(removePlane0, removeDgroup);
  mod.InitActorListMemory(removeDgroup);
  const removable = mod.SpawnNewObjMemory(removeDgroup, removePlane0, 10, 10, "_s_smoke4").actor;
  removeDgroup.setU16(removable + OBJ_ACTIVE_OFFSET, 1);
  removeDgroup.setU16(removable + OBJ_TICCOUNT_OFFSET, 1);
  const removeCountBefore = removeDgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount"));
  const removedStep = mod.WL_PLAY_DoActor(removeDgroup, removePlane0, removePlane1, removable, { tics: 1 });
  if (
    !removedStep.removed ||
    removedStep.state !== null ||
    removeDgroup.u16(removable + OBJ_STATE_OFFSET) !== 0 ||
    removeDgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== removeCountBefore - 1 ||
    removeDgroup.u16(mod.nearOffsetForRuntimeSymbol("_objfreelist")) !== removable ||
    removeDgroup.u16(actoratCell(10, 10)) !== 0
  ) {
    fail("DoActor did not unlink an actor whose transitional state advanced to NULL");
  }

  const staticSummary = mod.InitStaticListMemory(dgroup);
  if (
    staticSummary.laststatobj !== mod.nearOffsetForRuntimeSymbol("_statobjlist") ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_laststatobj")) !== staticSummary.laststatobj
  ) {
    fail("InitStaticListMemory pointer mismatch");
  }

  dgroup.view(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 37 * 2).fill(0xcc);
  const doorSummary = mod.InitDoorListMemory(dgroup, farAreaconnect);
  if (
    doorSummary.lastdoorobj !== mod.nearOffsetForRuntimeSymbol("_doorobjlist") ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastdoorobj")) !== doorSummary.lastdoorobj ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_doornum")) !== 0 ||
    dgroup.view(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 37 * 2).some((byte) => byte !== 0) ||
    farAreaconnect.some((byte) => byte !== 0)
  ) {
    fail("InitDoorListMemory did not clear door area state");
  }

  return {
    player: actorSummary.player,
    secondActor: allocated,
    removedActor: removed.actor,
    staticsBase: staticSummary.laststatobj,
    doorsBase: doorSummary.lastdoorobj,
  };
}

function checkRuntimePathMovement(mod) {
  const plane0 = new Uint16Array(64 * 64).fill(107);
  const plane1 = new Uint16Array(64 * 64);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 3, 0);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  mod.InitDoorListMemory(dgroup);
  mod.InitStaticListMemory(dgroup);
  mod.US_InitRndT(false);

  const patrol = mod.SpawnPatrolMemory(dgroup, plane0, 0, 10, 10, 0, { loadedgame: false });
  const actor = patrol.actor;
  const startX = (10 << 16) + 32768;
  if (
    dgroup.u16(actor + 24) !== 11 ||
    dgroup.u16(actor + 26) !== 10 ||
    dgroup.u32(actor + 16) !== startX ||
    dgroup.u32(actor + 10) !== 65536
  ) {
    fail("SpawnPatrolMemory did not initialize patrol movement state");
  }

  mod.WL_STATE_MoveObj(dgroup, actor, 512);
  if (dgroup.u32(actor + 16) !== startX + 512 || dgroup.i32(actor + 10) !== 65024) {
    fail("MoveObj did not advance east and decrement distance");
  }

  plane1[10 * 64 + 11] = 90 + 6;
  mod.WL_ACT2_SelectPathDir(dgroup, plane0, plane1, actor);
  if (
    dgroup.u16(actor + 14) !== 6 ||
    dgroup.u16(actor + 24) !== 11 ||
    dgroup.u16(actor + 26) !== 11 ||
    dgroup.i32(actor + 10) !== 65536
  ) {
    fail("SelectPathDir did not consume the path arrow and TryWalk south");
  }

  dgroup.setU16(actor + 14, 0);
  dgroup.setU16(actor + 24, 20);
  dgroup.setU16(actor + 26, 20);
  dgroup.setU32(actor + 16, (20 << 16) + 32768);
  dgroup.setU32(actor + 20, (20 << 16) + 32768);
  dgroup.setU32(actor + 10, 256);
  dgroup.setU32(actor + 46, 512);
  plane1[20 * 64 + 20] = 90 + 6;
  const pathStep = mod.WL_ACT2_T_Path(dgroup, plane0, plane1, actor, { tics: 1 });
  if (
    !pathStep.moved ||
    pathStep.blocked ||
    dgroup.u16(actor + 14) !== 6 ||
    dgroup.u16(actor + 24) !== 20 ||
    dgroup.u16(actor + 26) !== 21 ||
    dgroup.u32(actor + 16) !== (20 << 16) + 32768 ||
    dgroup.u32(actor + 20) !== (20 << 16) + 32768 + 256 ||
    dgroup.i32(actor + 10) !== 65280
  ) {
    fail("T_Path did not cross a tile, select the path arrow, and continue moving");
  }

  const doorPlane0 = new Uint16Array(64 * 64).fill(107);
  const doorPlane1 = new Uint16Array(64 * 64);
  const doorDgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(doorDgroup, 3, 0);
  mod.copyWallDataToLevelMemory(doorPlane0, doorDgroup);
  mod.InitActorListMemory(doorDgroup);
  mod.InitDoorListMemory(doorDgroup);
  mod.InitStaticListMemory(doorDgroup);
  mod.SpawnDoorMemory(doorDgroup, doorPlane0, 20, 10, true, 0);
  const doorActor = mod.SpawnNewObjMemory(doorDgroup, doorPlane0, 19, 10, "_s_grdstand").actor;
  doorDgroup.setU16(doorActor + 4, 3);
  doorDgroup.setU16(doorActor + 14, 0);
  doorDgroup.setU32(doorActor + 46, 512);
  const doorTry = mod.WL_STATE_TryWalk(doorDgroup, doorPlane0, doorActor);
  const doorObj = mod.nearOffsetForRuntimeSymbol("_doorobjlist");
  if (
    !doorTry.moved ||
    doorTry.door !== 0 ||
    doorDgroup.u16(doorActor + 24) !== 20 ||
    doorDgroup.i32(doorActor + 10) !== -1 ||
    doorDgroup.u16(doorObj + 6) !== 2
  ) {
    fail("TryWalk did not enter door-wait state through OpenDoor");
  }

  const waiting = mod.WL_ACT2_T_Path(doorDgroup, doorPlane0, doorPlane1, doorActor, { tics: 1 });
  if (waiting.waitingForDoor !== 0 || doorDgroup.i32(doorActor + 10) !== -1) {
    fail("T_Path did not wait on a non-open door");
  }

  doorDgroup.setU16(doorObj + 6, 0);
  doorDgroup.setU16(doorObj + 8, 7);
  const resumed = mod.WL_ACT2_T_Path(doorDgroup, doorPlane0, doorPlane1, doorActor, { tics: 1 });
  if (
    resumed.waitingForDoor !== null ||
    !resumed.moved ||
    doorDgroup.u16(doorObj + 8) !== 0 ||
    doorDgroup.u32(doorActor + 16) !== (19 << 16) + 32768 + 512 ||
    doorDgroup.i32(doorActor + 10) !== 65024
  ) {
    fail("T_Path did not resume movement through an opened door");
  }

  const actorDgroup = new mod.DOSMemory(0x10000);
  const actorPlane0 = new Uint16Array(64 * 64).fill(107);
  const actorPlane1 = new Uint16Array(64 * 64);
  mod.NewGameMemory(actorDgroup, 3, 0);
  mod.copyWallDataToLevelMemory(actorPlane0, actorDgroup);
  mod.InitActorListMemory(actorDgroup);
  mod.InitDoorListMemory(actorDgroup);
  mod.InitStaticListMemory(actorDgroup);
  mod.US_InitRndT(false);
  const doActorPatrol = mod.SpawnPatrolMemory(actorDgroup, actorPlane0, 0, 10, 10, 0, {
    loadedgame: false,
  });
  const doActor = doActorPatrol.actor;
  actorDgroup.setU16(doActor + 2, 1);
  const firstActorStep = mod.WL_PLAY_DoActor(actorDgroup, actorPlane0, actorPlane1, doActor, {
    tics: 1,
  });
  if (
    firstActorStep.state !== "_s_grdpath1s" ||
    firstActorStep.ticcount !== 5 ||
    firstActorStep.thinkCalls !== 0 ||
    actorDgroup.u16(doActor + 6) !== mod.statetypeNearOffset("_s_grdpath1s") ||
    actorDgroup.u16(mod.nearOffsetForRuntimeSymbol("_actorat") + (11 * 64 + 10) * 2) !== doActor
  ) {
    fail("DoActor did not advance grd path1 to path1s and re-mark actorat");
  }

  const doActorStartX = actorDgroup.u32(doActor + 16);
  const secondActorStep = mod.WL_PLAY_DoActor(actorDgroup, actorPlane0, actorPlane1, doActor, {
    tics: 5,
  });
  if (
    secondActorStep.state !== "_s_grdpath2" ||
    secondActorStep.ticcount !== 15 ||
    secondActorStep.thinkCalls !== 1 ||
    actorDgroup.u16(doActor + 6) !== mod.statetypeNearOffset("_s_grdpath2") ||
    actorDgroup.u32(doActor + 16) !== doActorStartX + 2560 ||
    actorDgroup.i32(doActor + 10) !== 62976 ||
    actorDgroup.u16(mod.nearOffsetForRuntimeSymbol("_actorat") + (11 * 64 + 10) * 2) !== doActor
  ) {
    fail("DoActor did not advance grd path1s to path2 and dispatch T_Path");
  }

  return {
    partialDistance: dgroup.i32(actor + 10),
    doorDistance: doorDgroup.i32(doorActor + 10),
    doorAction: doorDgroup.u16(doorObj + 6),
    doorTiccount: doorDgroup.u16(doorObj + 8),
    doActorState: secondActorStep.state,
    doActorTiccount: secondActorStep.ticcount,
  };
}

function checkRuntimeAwareness(mod) {
  const FL_SHOOTABLE = 1;
  const FL_ATTACKMODE = 16;
  const FL_FIRSTATTACK = 32;
  const FL_AMBUSH = 64;

  function makeScene({ visibleArea = true, blocked = false, dir = 2 } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    if (blocked) {
      plane0[10 * 64 + 11] = 1;
    }
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);
    if (visibleArea) {
      dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
    }
    const actor = mod.SpawnStandMemory(dgroup, plane0, 0, 12, 10, dir, {
      loadedgame: false,
    }).actor;
    return { dgroup, plane0, plane1, actor };
  }

  const clear = makeScene();
  if (
    !mod.WL_STATE_CheckLine(clear.dgroup, clear.actor) ||
    !mod.WL_STATE_CheckSight(clear.dgroup, clear.actor)
  ) {
    fail("CheckLine/CheckSight did not accept a clear, facing line to the player");
  }

  const blocked = makeScene({ blocked: true });
  if (
    mod.WL_STATE_CheckLine(blocked.dgroup, blocked.actor) ||
    mod.WL_STATE_CheckSight(blocked.dgroup, blocked.actor)
  ) {
    fail("CheckLine/CheckSight did not reject a wall-blocked line to the player");
  }

  const firstSightCases = [
    [3, "_s_grdchase1", 512, 1536, 10],
    [4, "_s_ofcchase1", 512, 2560, 10],
    [5, "_s_sschase1", 512, 2048, 10],
    [6, "_s_dogchase1", 1500, 3000, 10],
    [7, "_s_bosschase1", 512, 1536, 10],
    [8, "_s_schabbchase1", 512, 1536, 10],
    [9, "_s_fakechase1", 512, 1536, 10],
    [10, "_s_mechachase1", 512, 1536, 10],
    [11, "_s_mutchase1", 512, 1536, 10],
    [15, "_s_blinkychase1", 1500, 3000, 10],
    [16, "_s_hitlerchase1", 512, 2560, 6],
    [17, "_s_gretelchase1", 512, 1536, 10],
    [18, "_s_giftchase1", 512, 1536, 10],
    [19, "_s_fatchase1", 512, 1536, 10],
  ];
  const firstPlane0 = new Uint16Array(64 * 64).fill(107);
  const firstDgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(firstDgroup, 3, 0);
  mod.copyWallDataToLevelMemory(firstPlane0, firstDgroup);
  mod.InitActorListMemory(firstDgroup);
  for (const [obclass, state, speed, expectedSpeed, expectedTics] of firstSightCases) {
    const actor = mod.SpawnNewObjMemory(firstDgroup, firstPlane0, 20 + obclass, 20, "_s_grdstand")
      .actor;
    firstDgroup.setU16(actor + 4, obclass);
    firstDgroup.setU32(actor + 46, speed);
    firstDgroup.setU32(actor + 10, -1);
    mod.WL_STATE_FirstSighting(firstDgroup, actor);
    if (
      firstDgroup.u16(actor + 6) !== mod.statetypeNearOffset(state) ||
      firstDgroup.u32(actor + 46) !== expectedSpeed ||
      firstDgroup.u16(actor + 2) !== expectedTics ||
      firstDgroup.i32(actor + 10) !== 0 ||
      (firstDgroup.u8(actor + 8) & (FL_ATTACKMODE | FL_FIRSTATTACK)) !==
        (FL_ATTACKMODE | FL_FIRSTATTACK)
    ) {
      fail(`FirstSighting mismatch for obclass ${obclass}`);
    }
  }

  const unseen = makeScene({ visibleArea: false });
  mod.US_InitRndT(false);
  if (mod.WL_STATE_SightPlayer(unseen.dgroup, unseen.actor) || unseen.dgroup.u16(unseen.actor + 52)) {
    fail("SightPlayer reacted while the actor area was not visible to the player");
  }

  const wrongFacing = makeScene({ dir: 0 });
  mod.US_InitRndT(false);
  if (
    mod.WL_STATE_SightPlayer(wrongFacing.dgroup, wrongFacing.actor) ||
    wrongFacing.dgroup.u16(wrongFacing.actor + 52)
  ) {
    fail("SightPlayer reacted to a quiet, wrong-facing player");
  }

  const noisy = makeScene({ dir: 0 });
  mod.US_InitRndT(false);
  if (mod.WL_STATE_SightPlayer(noisy.dgroup, noisy.actor, { madenoise: true })) {
    fail("SightPlayer should delay, not immediately chase, on first noisy notice");
  }
  const noisyDelay = noisy.dgroup.u16(noisy.actor + 52);
  if (!noisyDelay || noisy.dgroup.u16(noisy.actor + 6) !== mod.statetypeNearOffset("_s_grdstand")) {
    fail("SightPlayer did not arm a reaction delay for noise");
  }

  const ambushWrongFacing = makeScene({ dir: 0 });
  ambushWrongFacing.dgroup.setU8(ambushWrongFacing.actor + 8, FL_SHOOTABLE | FL_AMBUSH);
  mod.US_InitRndT(false);
  if (
    mod.WL_STATE_SightPlayer(ambushWrongFacing.dgroup, ambushWrongFacing.actor, {
      madenoise: true,
    }) ||
    ambushWrongFacing.dgroup.u16(ambushWrongFacing.actor + 52) ||
    !(ambushWrongFacing.dgroup.u8(ambushWrongFacing.actor + 8) & FL_AMBUSH)
  ) {
    fail("SightPlayer let noise bypass ambush sight gating");
  }

  const ambushClear = makeScene();
  ambushClear.dgroup.setU8(ambushClear.actor + 8, FL_SHOOTABLE | FL_AMBUSH);
  mod.US_InitRndT(false);
  mod.WL_STATE_SightPlayer(ambushClear.dgroup, ambushClear.actor);
  if (
    ambushClear.dgroup.u8(ambushClear.actor + 8) & FL_AMBUSH ||
    !ambushClear.dgroup.u16(ambushClear.actor + 52)
  ) {
    fail("SightPlayer did not clear ambush and arm reaction after clear sight");
  }

  const reacting = makeScene();
  mod.US_InitRndT(false);
  mod.WL_STATE_SightPlayer(reacting.dgroup, reacting.actor);
  const reactionDelay = reacting.dgroup.u16(reacting.actor + 52);
  if (!reactionDelay) {
    fail("SightPlayer did not set a reaction delay");
  }
  if (!mod.WL_STATE_SightPlayer(reacting.dgroup, reacting.actor, { tics: reactionDelay })) {
    fail("SightPlayer did not enter first sighting after reaction delay elapsed");
  }
  if (
    reacting.dgroup.u16(reacting.actor + 6) !== mod.statetypeNearOffset("_s_grdchase1") ||
    reacting.dgroup.u32(reacting.actor + 46) !== 1536 ||
    reacting.dgroup.u16(reacting.actor + 52) !== 0
  ) {
    fail("SightPlayer reaction did not transition guard to chase state");
  }

  const stand = makeScene();
  stand.dgroup.setU16(stand.actor + 52, 1);
  const standStep = mod.WL_PLAY_DoActor(stand.dgroup, stand.plane0, stand.plane1, stand.actor, {
    tics: 1,
  });
  if (
    standStep.thinkCalls !== 1 ||
    standStep.state !== "_s_grdchase1" ||
    stand.dgroup.u16(stand.actor + 6) !== mod.statetypeNearOffset("_s_grdchase1")
  ) {
    fail("DoActor did not dispatch T_Stand into SightPlayer/FirstSighting");
  }

  return {
    firstSightCases: firstSightCases.length,
    noisyDelay,
    reactionState: "_s_grdchase1",
    standState: standStep.state,
  };
}

function checkRuntimeChase(mod) {
  const FL_SHOOTABLE = 1;
  const FL_ATTACKMODE = 16;
  const FL_FIRSTATTACK = 32;
  const AC_YES = 1;
  const NODIR = 8;

  function makeScene({
    actorX = 12,
    actorY = 12,
    playerX = 10,
    playerY = 10,
    walls = [],
  } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    for (const [x, y] of walls) {
      plane0[y * 64 + x] = 1;
    }
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, "_s_grdstand").actor;
    mod.NewStateMemory(dgroup, actor, "_s_grdchase1");
    dgroup.setU16(actor + 0, AC_YES);
    dgroup.setU16(actor + 4, 3);
    dgroup.setU8(actor + 8, FL_SHOOTABLE | FL_ATTACKMODE);
    dgroup.setU32(actor + 46, 512);
    dgroup.setU32(actor + 10, 0);
    return { dgroup, plane0, plane1, actor };
  }

  const movement = makeScene({ walls: [[12, 11]] });
  mod.US_InitRndT(false);
  const startX = movement.dgroup.u32(movement.actor + 16);
  const chaseMove = mod.WL_ACT2_T_Chase(movement.dgroup, movement.plane0, movement.actor, {
    tics: 1,
  });
  if (
    !chaseMove.moved ||
    chaseMove.attacked ||
    chaseMove.blocked ||
    chaseMove.selectedDir !== 4 ||
    movement.dgroup.u16(movement.actor + 24) !== 11 ||
    movement.dgroup.u16(movement.actor + 26) !== 12 ||
    movement.dgroup.u32(movement.actor + 16) !== startX - 512 ||
    movement.dgroup.i32(movement.actor + 10) !== 65024
  ) {
    fail("T_Chase did not select west and advance a wall-blocked guard toward the player");
  }

  const attack = makeScene({ actorX: 12, actorY: 10, playerX: 11, playerY: 10 });
  mod.US_InitRndT(false);
  const attackStep = mod.WL_ACT2_T_Chase(attack.dgroup, attack.plane0, attack.actor, { tics: 1 });
  if (
    !attackStep.attacked ||
    attackStep.moved ||
    attackStep.state !== "_s_grdshoot1" ||
    attack.dgroup.u16(attack.actor + 6) !== mod.statetypeNearOffset("_s_grdshoot1") ||
    attack.dgroup.u16(attack.actor + 2) !== 20
  ) {
    fail("T_Chase did not enter guard shoot state on guaranteed close shot");
  }

  const dodge = makeScene({ actorX: 20, actorY: 20, playerX: 10, playerY: 10 });
  dodge.dgroup.setU8(dodge.actor + 8, FL_SHOOTABLE | FL_ATTACKMODE | FL_FIRSTATTACK);
  mod.US_InitRndT(false);
  const dodgeStartX = dodge.dgroup.u32(dodge.actor + 16);
  const dodgeStartY = dodge.dgroup.u32(dodge.actor + 20);
  const dodgeStep = mod.WL_ACT2_T_Chase(dodge.dgroup, dodge.plane0, dodge.actor, { tics: 1 });
  if (
    !dodgeStep.moved ||
    dodgeStep.attacked ||
    dodgeStep.selectedDir !== 3 ||
    dodge.dgroup.u8(dodge.actor + 8) & FL_FIRSTATTACK ||
    dodge.dgroup.u16(dodge.actor + 24) !== 19 ||
    dodge.dgroup.u16(dodge.actor + 26) !== 19 ||
    dodge.dgroup.u32(dodge.actor + 16) !== dodgeStartX - 512 ||
    dodge.dgroup.u32(dodge.actor + 20) !== dodgeStartY - 512
  ) {
    fail("T_Chase did not perform the first-attack dodge direction selection");
  }

  const door = makeScene({ actorX: 10, actorY: 10, playerX: 5, playerY: 5, walls: [[7, 7]] });
  mod.SpawnDoorMemory(door.dgroup, door.plane0, 11, 10, true, 0);
  door.dgroup.setU16(door.actor + 14, 0);
  door.dgroup.setU32(door.actor + 10, -1);
  const doorObj = mod.nearOffsetForRuntimeSymbol("_doorobjlist");
  const waiting = mod.WL_ACT2_T_Chase(door.dgroup, door.plane0, door.actor, { tics: 1 });
  if (
    waiting.waitingForDoor !== 0 ||
    door.dgroup.i32(door.actor + 10) !== -1 ||
    door.dgroup.u16(doorObj + 6) !== 2
  ) {
    fail("T_Chase did not wait for a closed door while chasing");
  }

  const actorStepScene = makeScene({ walls: [[12, 11]] });
  actorStepScene.dgroup.setU16(actorStepScene.actor + 2, 0);
  mod.US_InitRndT(false);
  const actorStepStartX = actorStepScene.dgroup.u32(actorStepScene.actor + 16);
  const actorStep = mod.WL_PLAY_DoActor(
    actorStepScene.dgroup,
    actorStepScene.plane0,
    actorStepScene.plane1,
    actorStepScene.actor,
    { tics: 1 },
  );
  if (
    actorStep.thinkCalls !== 1 ||
    actorStep.state !== "_s_grdchase1" ||
    actorStepScene.dgroup.u32(actorStepScene.actor + 16) !== actorStepStartX - 512
  ) {
    fail("DoActor did not dispatch T_Chase for a chase state");
  }

  const selector = makeScene({ actorX: 14, actorY: 14, playerX: 10, playerY: 14 });
  selector.dgroup.setU16(selector.actor + 14, NODIR);
  mod.WL_STATE_SelectChaseDir(selector.dgroup, selector.plane0, selector.actor);
  if (selector.dgroup.u16(selector.actor + 14) !== 4 || selector.dgroup.u16(selector.actor + 24) !== 13) {
    fail("SelectChaseDir wrapper did not choose west toward the player");
  }

  return {
    moveDir: chaseMove.selectedDir,
    attackState: attackStep.state,
    dodgeDir: dodgeStep.selectedDir,
    doorAction: door.dgroup.u16(doorObj + 6),
    doActorState: actorStep.state,
  };
}

function checkRuntimeDogGhostChase(mod) {
  const FL_SHOOTABLE = 1;
  const FL_ATTACKMODE = 16;
  const AC_YES = 1;
  const NODIR = 8;

  function makeActorScene({
    actorX,
    actorY,
    playerX,
    playerY,
    obclass,
    state,
    speed,
  }) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, "_s_grdstand").actor;
    mod.NewStateMemory(dgroup, actor, state);
    dgroup.setU16(actor + 0, AC_YES);
    dgroup.setU16(actor + 4, obclass);
    dgroup.setU8(actor + 8, FL_SHOOTABLE | FL_ATTACKMODE);
    dgroup.setU16(actor + 14, NODIR);
    dgroup.setU32(actor + 46, speed);
    dgroup.setU32(actor + 10, 0);
    return { dgroup, plane0, plane1, actor };
  }

  const ghost = makeActorScene({
    actorX: 14,
    actorY: 14,
    playerX: 10,
    playerY: 14,
    obclass: 15,
    state: "_s_blinkychase1",
    speed: 1500,
  });
  const ghostStartX = ghost.dgroup.u32(ghost.actor + 16);
  const ghostStep = mod.WL_ACT2_T_Ghosts(ghost.dgroup, ghost.plane0, ghost.actor, { tics: 1 });
  if (
    !ghostStep.moved ||
    ghostStep.selectedDir !== 4 ||
    ghost.dgroup.u16(ghost.actor + 24) !== 13 ||
    ghost.dgroup.u32(ghost.actor + 16) !== ghostStartX - 1500 ||
    ghost.dgroup.i32(ghost.actor + 10) !== 64036
  ) {
    fail("T_Ghosts did not select west and move toward the player");
  }

  const dog = makeActorScene({
    actorX: 14,
    actorY: 14,
    playerX: 10,
    playerY: 14,
    obclass: 6,
    state: "_s_dogchase1",
    speed: 1500,
  });
  mod.US_InitRndT(false);
  const dogStartX = dog.dgroup.u32(dog.actor + 16);
  const dogStartY = dog.dgroup.u32(dog.actor + 20);
  const dogStep = mod.WL_ACT2_T_DogChase(dog.dgroup, dog.plane0, dog.actor, { tics: 1 });
  if (
    !dogStep.moved ||
    dogStep.attacked ||
    dogStep.selectedDir !== 3 ||
    dog.dgroup.u16(dog.actor + 24) !== 13 ||
    dog.dgroup.u16(dog.actor + 26) !== 13 ||
    dog.dgroup.u32(dog.actor + 16) !== dogStartX - 1500 ||
    dog.dgroup.u32(dog.actor + 20) !== dogStartY - 1500
  ) {
    fail("T_DogChase did not select the deterministic dodge direction and move");
  }

  const dogJump = makeActorScene({
    actorX: 12,
    actorY: 10,
    playerX: 11,
    playerY: 10,
    obclass: 6,
    state: "_s_dogchase1",
    speed: 1500,
  });
  dogJump.dgroup.setU16(dogJump.actor + 14, 4);
  dogJump.dgroup.setU32(dogJump.actor + 10, 65536);
  const jumpStep = mod.WL_ACT2_T_DogChase(dogJump.dgroup, dogJump.plane0, dogJump.actor, {
    tics: 1,
  });
  if (
    !jumpStep.attacked ||
    jumpStep.state !== "_s_dogjump1" ||
    dogJump.dgroup.u16(dogJump.actor + 6) !== mod.statetypeNearOffset("_s_dogjump1") ||
    dogJump.dgroup.u16(dogJump.actor + 2) !== 10
  ) {
    fail("T_DogChase did not enter dog jump state inside bite range");
  }

  const ghostActorStep = makeActorScene({
    actorX: 14,
    actorY: 14,
    playerX: 10,
    playerY: 14,
    obclass: 15,
    state: "_s_blinkychase1",
    speed: 1500,
  });
  ghostActorStep.dgroup.setU16(ghostActorStep.actor + 2, 0);
  const ghostDoStartX = ghostActorStep.dgroup.u32(ghostActorStep.actor + 16);
  const ghostDo = mod.WL_PLAY_DoActor(
    ghostActorStep.dgroup,
    ghostActorStep.plane0,
    ghostActorStep.plane1,
    ghostActorStep.actor,
    { tics: 1 },
  );
  if (
    ghostDo.thinkCalls !== 1 ||
    ghostDo.state !== "_s_blinkychase1" ||
    ghostActorStep.dgroup.u32(ghostActorStep.actor + 16) !== ghostDoStartX - 1500
  ) {
    fail("DoActor did not dispatch T_Ghosts for ghost chase state");
  }

  const dogActorStep = makeActorScene({
    actorX: 12,
    actorY: 10,
    playerX: 11,
    playerY: 10,
    obclass: 6,
    state: "_s_dogchase1",
    speed: 1500,
  });
  dogActorStep.dgroup.setU16(dogActorStep.actor + 2, 0);
  dogActorStep.dgroup.setU16(dogActorStep.actor + 14, 4);
  dogActorStep.dgroup.setU32(dogActorStep.actor + 10, 65536);
  const dogDo = mod.WL_PLAY_DoActor(
    dogActorStep.dgroup,
    dogActorStep.plane0,
    dogActorStep.plane1,
    dogActorStep.actor,
    { tics: 1 },
  );
  if (dogDo.thinkCalls !== 1 || dogDo.state !== "_s_dogjump1") {
    fail("DoActor did not dispatch T_DogChase for dog chase state");
  }

  return {
    ghostDir: ghostStep.selectedDir,
    dogDir: dogStep.selectedDir,
    dogJumpState: jumpStep.state,
    ghostDoActorState: ghostDo.state,
    dogDoActorState: dogDo.state,
  };
}

function checkRuntimeCheckPosition(mod) {
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const objlist = mod.nearOffsetForSymbol("_objlist");
  const dgroup = new mod.DOSMemory(0x10000);
  mod.InitActorListMemory(dgroup);
  const actor = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  dgroup.setU32(actor + OBJ_X_OFFSET, 10 * TILEGLOBAL + TILEGLOBAL / 2);
  dgroup.setU32(actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL + TILEGLOBAL / 2);

  const clear = mod.WL_ACT2_CheckPosition(dgroup, actor);
  dgroup.setU16(actorat + (10 * 64 + 10) * 2, 7);
  const wallBlocked = mod.WL_ACT2_CheckPosition(dgroup, actor);
  dgroup.setU16(actorat + (10 * 64 + 10) * 2, objlist + 60);
  const actorAllowed = mod.WL_ACT2_CheckPosition(dgroup, actor);
  dgroup.setU32(actor + OBJ_X_OFFSET, 0x1000);
  const outOfBounds = mod.WL_ACT2_CheckPosition(dgroup, actor);

  if (!clear || wallBlocked || !actorAllowed || outOfBounds) {
    fail(`WL_ACT2_CheckPosition did not match wall/object boundary rules: ${JSON.stringify({ clear, wallBlocked, actorAllowed, outOfBounds })}`);
  }

  return { clear, wallBlocked, actorAllowed, outOfBounds };
}

function checkRuntimeDamage(mod) {
  const AC_YES = 1;
  const FL_SHOOTABLE = 1;
  const FL_VISABLE = 8;
  const FL_ATTACKMODE = 16;
  const GUARDOBJ = 3;
  const DOGOBJ = 6;
  const EX_DIED = 2;
  const RUNSPEED = 6000;
  const GAMESTATE_HEALTH_OFFSET = 18;
  const GAMESTATE_VICTORYFLAG_OFFSET = 64;
  const OBJ_TICCOUNT_OFFSET = 2;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_DISTANCE_OFFSET = 10;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_SPEED_OFFSET = 46;
  const NODIR = 8;
  const SPDPATROL = 512;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const playstate = mod.nearOffsetForRuntimeSymbol("_playstate");
  const killerobj = mod.nearOffsetForRuntimeSymbol("_killerobj");
  const damagecount = mod.nearOffsetForRuntimeSymbol("_damagecount");
  const godmode = mod.nearOffsetForRuntimeSymbol("_godmode");
  const lastAttacker = mod.nearOffsetForRuntimeSymbol("_LastAttacker");
  const thrustspeed = mod.nearOffsetForRuntimeSymbol("_thrustspeed");
  const areabyplayer = mod.nearOffsetForRuntimeSymbol("_areabyplayer");

  function health(dgroup) {
    return dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET);
  }

  function makeScene({
    actorX = 11,
    actorY = 10,
    playerX = 10,
    playerY = 10,
    obclass = GUARDOBJ,
    visible = false,
  } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    dgroup.setU16(areabyplayer, 1);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, "_s_grdstand").actor;
    dgroup.setU16(actor, AC_YES);
    dgroup.setU16(actor + OBJ_CLASS_OFFSET, obclass);
    dgroup.setU8(
      actor + OBJ_FLAGS_OFFSET,
      FL_SHOOTABLE | FL_ATTACKMODE | (visible ? FL_VISABLE : 0),
    );
    dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
    dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, 0);
    dgroup.setU32(actor + OBJ_SPEED_OFFSET, SPDPATROL);
    return { dgroup, plane0, plane1, actor };
  }

  function setActionState(scene, state, ticcount) {
    scene.dgroup.setU16(scene.actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset(state));
    scene.dgroup.setU16(scene.actor + OBJ_TICCOUNT_OFFSET, ticcount);
  }

  function expectDamage(scene, expectedHealth, expectedDamage, label) {
    if (
      health(scene.dgroup) !== expectedHealth ||
      scene.dgroup.u16(damagecount) !== expectedDamage ||
      scene.dgroup.u16(lastAttacker) !== scene.actor
    ) {
      fail(`${label} did not apply expected damage bookkeeping`);
    }
  }

  const direct = makeScene();
  mod.TakeDamageMemory(direct.dgroup, direct.actor, 32);
  expectDamage(direct, 68, 32, "TakeDamageMemory");
  if (direct.dgroup.u16(playstate) || direct.dgroup.u16(killerobj)) {
    fail("TakeDamageMemory changed playstate/killerobj for non-fatal damage");
  }

  const baby = makeScene();
  baby.dgroup.setU16(gamestate, 0);
  mod.TakeDamageMemory(baby.dgroup, baby.actor, 12);
  expectDamage(baby, 97, 3, "TakeDamageMemory baby difficulty");

  const god = makeScene();
  god.dgroup.setU16(godmode, 1);
  mod.WL_AGENT_TakeDamage(god.dgroup, 40, god.actor);
  expectDamage(god, 100, 40, "WL_AGENT_TakeDamage godmode");
  if (god.dgroup.u16(playstate) || god.dgroup.u16(killerobj)) {
    fail("WL_AGENT_TakeDamage changed playstate/killerobj in godmode");
  }

  const fatal = makeScene();
  fatal.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 5);
  mod.TakeDamageMemory(fatal.dgroup, fatal.actor, 9);
  if (
    health(fatal.dgroup) !== 0 ||
    fatal.dgroup.u16(playstate) !== EX_DIED ||
    fatal.dgroup.u16(killerobj) !== fatal.actor ||
    fatal.dgroup.u16(lastAttacker) !== fatal.actor ||
    fatal.dgroup.u16(damagecount) !== 9
  ) {
    fail("TakeDamageMemory did not set fatal damage state");
  }

  const victory = makeScene();
  victory.dgroup.setU16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET, 1);
  mod.TakeDamageMemory(victory.dgroup, victory.actor, 50);
  if (
    health(victory.dgroup) !== 100 ||
    victory.dgroup.u16(damagecount) ||
    victory.dgroup.u16(lastAttacker) !== victory.actor
  ) {
    fail("TakeDamageMemory did not preserve health/damagecount during victory damage");
  }

  const shoot = makeScene({ visible: true });
  shoot.dgroup.setU32(thrustspeed, RUNSPEED);
  mod.US_InitRndT(false);
  mod.T_ShootMemory(shoot.dgroup, shoot.actor);
  expectDamage(shoot, 73, 27, "T_ShootMemory");

  const invisibleArea = makeScene({ visible: true });
  invisibleArea.dgroup.setU16(areabyplayer, 0);
  mod.US_InitRndT(false);
  const invisibleShot = mod.T_ShootMemory(invisibleArea.dgroup, invisibleArea.actor);
  if (invisibleShot.hit || invisibleShot.damage || health(invisibleArea.dgroup) !== 100) {
    fail("T_ShootMemory damaged the player from an area not visible to the player");
  }

  const shootWrapper = makeScene({ visible: true });
  shootWrapper.dgroup.setU32(thrustspeed, RUNSPEED);
  mod.US_InitRndT(false);
  mod.WL_ACT2_T_Shoot(shootWrapper.dgroup, shootWrapper.actor);
  expectDamage(shootWrapper, 73, 27, "WL_ACT2_T_Shoot");

  const uShootClose = makeScene({ visible: true });
  uShootClose.dgroup.setU32(thrustspeed, RUNSPEED);
  mod.US_InitRndT(false);
  const uShootCloseSummary = mod.WL_ACT2_T_UShoot(uShootClose.dgroup, uShootClose.actor);
  if (
    uShootCloseSummary.dist !== 1 ||
    !uShootCloseSummary.touchDamage ||
    uShootCloseSummary.touchDamage.points !== 10 ||
    uShootCloseSummary.touchDamage.health !== 63
  ) {
    fail(`WL_ACT2_T_UShoot did not apply close-range touch damage: ${JSON.stringify(uShootCloseSummary)}`);
  }
  expectDamage(uShootClose, 63, 37, "WL_ACT2_T_UShoot close range");

  const uShootFar = makeScene({ actorX: 13, visible: true });
  uShootFar.dgroup.setU32(thrustspeed, RUNSPEED);
  mod.US_InitRndT(false);
  const uShootFarSummary = mod.WL_ACT2_T_UShoot(uShootFar.dgroup, uShootFar.actor);
  if (uShootFarSummary.dist !== 3 || uShootFarSummary.touchDamage) {
    fail(`WL_ACT2_T_UShoot applied touch damage outside adjacent range: ${JSON.stringify(uShootFarSummary)}`);
  }
  if (
    uShootFarSummary.shoot.dist !== 3 ||
    uShootFarSummary.shoot.health !== health(uShootFar.dgroup) ||
    uShootFarSummary.shoot.damage !== uShootFar.dgroup.u16(damagecount)
  ) {
    fail(`WL_ACT2_T_UShoot far shot summary did not match memory: ${JSON.stringify(uShootFarSummary)}`);
  }

  const bite = makeScene({ obclass: DOGOBJ });
  mod.US_InitRndT(false);
  mod.T_BiteMemory(bite.dgroup, bite.actor);
  expectDamage(bite, 94, 6, "T_BiteMemory");

  const biteWrapper = makeScene({ obclass: DOGOBJ });
  mod.US_InitRndT(false);
  mod.WL_ACT2_T_Bite(biteWrapper.dgroup, biteWrapper.actor);
  expectDamage(biteWrapper, 94, 6, "WL_ACT2_T_Bite");

  const shootActor = makeScene({ visible: true });
  shootActor.dgroup.setU32(thrustspeed, RUNSPEED);
  setActionState(shootActor, "_s_grdshoot2", 1);
  mod.US_InitRndT(false);
  const shootActorStep = mod.WL_PLAY_DoActor(
    shootActor.dgroup,
    shootActor.plane0,
    shootActor.plane1,
    shootActor.actor,
    { tics: 1 },
  );
  if (
    shootActorStep.state !== "_s_grdshoot3" ||
    shootActor.dgroup.u16(shootActor.actor + OBJ_STATE_OFFSET) !==
      mod.statetypeNearOffset("_s_grdshoot3")
  ) {
    fail("DoActor did not advance through T_Shoot action dispatch");
  }
  expectDamage(shootActor, 73, 27, "DoActor T_Shoot");

  const biteActor = makeScene({ obclass: DOGOBJ });
  setActionState(biteActor, "_s_dogjump2", 1);
  mod.US_InitRndT(false);
  const biteActorStep = mod.WL_PLAY_DoActor(
    biteActor.dgroup,
    biteActor.plane0,
    biteActor.plane1,
    biteActor.actor,
    { tics: 1 },
  );
  if (
    biteActorStep.state !== "_s_dogjump3" ||
    biteActor.dgroup.u16(biteActor.actor + OBJ_STATE_OFFSET) !==
      mod.statetypeNearOffset("_s_dogjump3")
  ) {
    fail("DoActor did not advance through T_Bite action dispatch");
  }
  expectDamage(biteActor, 94, 6, "DoActor T_Bite");

  return {
    directHealth: health(direct.dgroup),
    babyHealth: health(baby.dgroup),
    fatalPlaystate: fatal.dgroup.u16(playstate),
    shootDamage: shoot.dgroup.u16(damagecount),
    biteDamage: bite.dgroup.u16(damagecount),
    uShootDamage: uShootClose.dgroup.u16(damagecount),
    shootDoActorState: shootActorStep.state,
    biteDoActorState: biteActorStep.state,
  };
}

function checkRuntimePaletteShifts(mod) {
  const damagecount = mod.nearOffsetForRuntimeSymbol("_damagecount");
  const bonuscount = mod.nearOffsetForRuntimeSymbol("_bonuscount");
  const palshifted = mod.nearOffsetForRuntimeSymbol("_palshifted");
  const tics = mod.nearOffsetForRuntimeSymbol("_tics");

  const basePalette = new Uint8Array(768);
  basePalette[0] = 16;
  basePalette[1] = 24;
  basePalette[2] = 32;
  basePalette[3] = 60;
  basePalette[4] = 10;
  basePalette[5] = 1;
  const tables = mod.WL_PLAY_InitRedShifts(basePalette);
  if (
    tables.redshifts.length !== 6 ||
    tables.whiteshifts.length !== 3 ||
    tables.redshifts[0][0] !== 22 ||
    tables.redshifts[0][1] !== 21 ||
    tables.redshifts[5][0] !== 52 ||
    tables.redshifts[5][2] !== 8 ||
    tables.whiteshifts[0][0] !== 18 ||
    tables.whiteshifts[0][1] !== 25 ||
    tables.whiteshifts[2][3] !== 60 ||
    tables.whiteshifts[2][4] !== 17
  ) {
    fail("WL_PLAY_InitRedShifts did not build the red/white palette tables");
  }

  const dgroup = new mod.DOSMemory(0x10000);
  dgroup.setU16(damagecount, 7);
  dgroup.setU16(bonuscount, 9);
  const cleared = mod.WL_PLAY_ClearPaletteShifts(dgroup);
  if (cleared.damagecount !== 0 || cleared.bonuscount !== 0 || dgroup.u16(damagecount) || dgroup.u16(bonuscount)) {
    fail("ClearPaletteShifts did not clear damagecount and bonuscount");
  }

  const bonus = mod.StartBonusFlashMemory(dgroup);
  if (bonus.bonuscount !== 18 || dgroup.u16(bonuscount) !== 18) {
    fail("StartBonusFlashMemory did not seed white palette tics");
  }
  const white = mod.WL_PLAY_UpdatePaletteShifts(dgroup, { tics: 6 });
  if (
    white.palette !== "white" ||
    white.white !== 3 ||
    white.red !== 0 ||
    white.bonuscount !== 12 ||
    !white.palshifted ||
    dgroup.u16(palshifted) !== 1
  ) {
    fail("UpdatePaletteShifts did not apply the white bonus shift");
  }

  const redDgroup = new mod.DOSMemory(0x10000);
  redDgroup.setU16(tics, 5);
  mod.WL_PLAY_StartBonusFlash(redDgroup);
  mod.WL_PLAY_StartDamageFlash(redDgroup, 35);
  const red = mod.UpdatePaletteShiftsMemory(redDgroup);
  if (
    red.palette !== "red" ||
    red.red !== 4 ||
    red.white !== 3 ||
    red.damagecount !== 30 ||
    red.bonuscount !== 13 ||
    !red.palshifted
  ) {
    fail("UpdatePaletteShiftsMemory did not prioritize red damage shift over white");
  }

  const normalDgroup = new mod.DOSMemory(0x10000);
  normalDgroup.setU16(palshifted, 1);
  const normal = mod.WL_PLAY_UpdatePaletteShifts(normalDgroup, { tics: 1 });
  if (normal.palette !== "normal" || normal.palshifted || normalDgroup.u16(palshifted)) {
    fail("UpdatePaletteShifts did not restore the normal palette after shifts expired");
  }

  const finishDgroup = new mod.DOSMemory(0x10000);
  finishDgroup.setU16(palshifted, 1);
  const finish = mod.WL_PLAY_FinishPaletteShifts(finishDgroup);
  if (finish.palette !== "normal" || finish.palshifted || finishDgroup.u16(palshifted)) {
    fail("FinishPaletteShifts did not clear palshifted");
  }

  return {
    whitePalette: white.palette,
    redPalette: red.palette,
    restoredPalette: normal.palette,
    finishPalette: finish.palette,
    redShiftFrames: tables.redshifts.length,
  };
}

function checkRuntimeFaceUpdate(mod) {
  const GAMESTATE_FACEFRAME_OFFSET = 30;
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const facecount = mod.nearOffsetForRuntimeSymbol("_facecount");
  const tics = mod.nearOffsetForRuntimeSymbol("_tics");

  const held = new mod.DOSMemory(0x10000);
  mod.US_InitRndT(false);
  const heldSummary = mod.UpdateFaceMemory(held, { tics: 6 });
  if (heldSummary.changed || heldSummary.skipped || heldSummary.facecount !== 6 || heldSummary.faceframe !== 0) {
    fail("UpdateFaceMemory did not preserve the face frame below the random threshold");
  }

  const changed = new mod.DOSMemory(0x10000);
  changed.setU16(tics, 80);
  mod.US_InitRndT(false);
  const changedSummary = mod.WL_AGENT_UpdateFace(changed);
  if (
    !changedSummary.changed ||
    changedSummary.skipped ||
    changedSummary.facecount !== 0 ||
    changedSummary.faceframe !== 1 ||
    changed.u16(gamestate + GAMESTATE_FACEFRAME_OFFSET) !== 1
  ) {
    fail("WL_AGENT_UpdateFace did not update faceframe using the deterministic random frame");
  }

  const skipped = new mod.DOSMemory(0x10000);
  skipped.setU16(facecount, 22);
  mod.US_InitRndT(false);
  const skippedSummary = mod.UpdateFaceMemory(skipped, { tics: 80, gatlingSoundPlaying: true });
  if (!skippedSummary.skipped || skippedSummary.changed || skippedSummary.facecount !== 22) {
    fail("UpdateFaceMemory did not skip while the gatling sound is playing");
  }

  return {
    heldFacecount: heldSummary.facecount,
    changedFaceframe: changedSummary.faceframe,
    skippedFacecount: skippedSummary.facecount,
  };
}

function checkRuntimeLongDivide(mod) {
  if (
    mod.H_LDIV_LDIV(7, 3) !== 2 ||
    mod.H_LDIV_LDIV(-7, 3) !== -2 ||
    mod.H_LDIV_LDIV(7, -3) !== -2 ||
    mod.H_LDIV_LMOD(-7, 3) !== -1
  ) {
    fail("H_LDIV signed quotient/remainder did not truncate toward zero");
  }
  if (
    mod.H_LDIV_LUDIV(0xffffffff, 2) !== 0x7fffffff ||
    mod.H_LDIV_LUMOD(0xffffffff, 2) !== 1 ||
    mod.H_LDIV_LUDIV(0x80000000, 0x10000) !== 0x8000 ||
    mod.H_LDIV_LUMOD(0x80000001, 0x10000) !== 1
  ) {
    fail("H_LDIV unsigned quotient/remainder did not match 32-bit unsigned arithmetic");
  }
  if (
    mod.H_LDIV_F_LDIV(-9, 4) !== mod.H_LDIV_LDIV(-9, 4) ||
    mod.H_LDIV_N_LUDIV(0xffffffff, 3) !== mod.H_LDIV_LUDIV(0xffffffff, 3) ||
    mod.H_LDIV_F_LMOD(-9, 4) !== mod.H_LDIV_LMOD(-9, 4) ||
    mod.H_LDIV_N_LUMOD(0xffffffff, 3) !== mod.H_LDIV_LUMOD(0xffffffff, 3)
  ) {
    fail("H_LDIV near/far aliases did not share the base helper semantics");
  }
  let divideByZero = false;
  try {
    mod.H_LDIV_LDIV(1, 0);
  } catch (error) {
    divideByZero = error instanceof RangeError;
  }
  if (!divideByZero) {
    fail("H_LDIV_LDIV did not reject divide by zero");
  }
  return {
    signedQuotient: mod.H_LDIV_LDIV(-7, 3),
    signedRemainder: mod.H_LDIV_LMOD(-7, 3),
    unsignedQuotient: mod.H_LDIV_LUDIV(0xffffffff, 2),
    unsignedRemainder: mod.H_LDIV_LUMOD(0xffffffff, 2),
  };
}

function checkRuntimeAsm(mod) {
  const check = mod.WL_ASM_CheckIs386();
  if (check !== 1) {
    fail(`WL_ASM_CheckIs386 should report the 386+ path, saw ${check}`);
  }
  if (mod.WL_ASM_ldivPatchApplied) {
    fail("WL_ASM_ldivPatchApplied started true before jabhack2");
  }
  const patch = mod.WL_ASM_jabhack2();
  if (!patch.ldivPatchApplied || !mod.WL_ASM_ldivPatchApplied) {
    fail(`WL_ASM_jabhack2 did not mark the long divide patch as applied: ${JSON.stringify(patch)}`);
  }
  return { checkIs386: check, ldivPatchApplied: mod.WL_ASM_ldivPatchApplied };
}

function checkRuntimeRendererMath(mod) {
  const TILEGLOBAL = 1 << 16;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_VIEWX_OFFSET = 30;
  const OBJ_VIEWHEIGHT_OFFSET = 32;
  const OBJ_TRANSX_OFFSET = 34;
  const OBJ_TRANSY_OFFSET = 38;
  const OBJ_ANGLE_OFFSET = 42;
  const GUARDOBJ = 3;
  const ROCKETOBJ = 20;
  const DIR_NORTH = 2;
  const dgroup = new mod.DOSMemory(0x10000);
  const player = 0x3200;
  const actor = 0x3400;
  const centerx = 159;
  const scale = 0x100;
  const heightnumerator = (TILEGLOBAL * scale) >> 6;
  const context = {
    viewx: 10 * TILEGLOBAL,
    viewy: 10 * TILEGLOBAL,
    viewsin: 0,
    viewcos: 0xffff,
    scale,
    centerx,
    heightnumerator,
  };

  if (
    mod.WL_DRAW_FixedByFrac(0x20000, 0x8000) !== 0x10000 ||
    mod.WL_DRAW_FixedByFrac(-0x20000, 0x8000) !== -0x10000 ||
    mod.WL_DRAW_FixedByFrac(0x18000, 0x4000) !== 0x6000
  ) {
    fail("WL_DRAW_FixedByFrac did not match the 16.16 fixed-point multiply cases");
  }
  if (
    mod.WOLFHACK_FixedMul(0x10000, 0x10000) !== 0x10000 ||
    mod.WOLFHACK_FixedMul(-0x10000, 0x10000) !== -0x10000 ||
    mod.WOLFHACK_FixedMul(0x7fffffff, 0x20000) !== -512
  ) {
    fail("WOLFHACK_FixedMul did not match (a>>8)*(b>>8) with 32-bit truncation");
  }
  const buildTables = mod.WL_MAIN_BuildTables();
  if (
    buildTables.fineTangents !== 900 ||
    buildTables.sinEntries !== 451 ||
    buildTables.tangent0 !== 57 ||
    mod.WL_DRAW_finetangent[449] !== 65421 ||
    buildTables.tangentLast !== 75098708 ||
    buildTables.sin0 !== 0 ||
    mod.WL_DRAW_sintable[45] !== 46340 ||
    buildTables.sin90 !== 65535 ||
    buildTables.sin180 !== -2147483648 ||
    mod.WL_DRAW_sintable[270] !== -2147418113 ||
    mod.WL_DRAW_sintable[360] !== -2147483648 ||
    mod.WL_DRAW_sintable[450] !== 65535 ||
    mod.WL_DRAW_costable[0] !== 65535 ||
    mod.WL_DRAW_costable[90] !== -2147483648
  ) {
    fail(`WL_MAIN_BuildTables did not populate trig tables like WL_MAIN.C: ${JSON.stringify(buildTables)}`);
  }
  const ceilingPage = new Uint8Array(4096);
  const floorPage = new Uint8Array(4096);
  for (let i = 0; i < 4096; i++) {
    ceilingPage[i] = i & 0xff;
    floorPage[i] = (0x80 + i) & 0xff;
  }
  const planeView = mod.WOLFHACK_SetPlaneViewSize({
    viewheight: 8,
    scale: 196,
    ceilingPage,
    floorPage,
  });
  if (
    planeView.halfheight !== 4 ||
    mod.WOLFHACK_halfheight !== 4 ||
    planeView.row0 !== 240 ||
    planeView.rowLast !== 0 ||
    planeView.mirror0 !== 80 ||
    mod.WOLFHACK_mirrorofs[3] !== 560 ||
    planeView.stepLast !== 6144 ||
    mod.WOLFHACK_stepscale[3] !== 6144 ||
    planeView.base1 !== 6422528 ||
    mod.WOLFHACK_basedist[1] !== 6422528 ||
    planeView.planepic0 !== ceilingPage[0] ||
    planeView.planepic1 !== floorPage[0] ||
    planeView.planepicLastCeiling !== ceilingPage[4095] ||
    planeView.planepicLastFloor !== floorPage[4095] ||
    mod.WOLFHACK_planepics[2] !== ceilingPage[1] ||
    mod.WOLFHACK_planepics[3] !== floorPage[1]
  ) {
    fail(`WOLFHACK_SetPlaneViewSize did not prepare plane tables/pages like WOLFHACK.C: ${JSON.stringify(planeView)}`);
  }
  const span = mod.WOLFHACK_DrawSpans(3, 4, 1, {
    viewwidth: 8,
    viewx: 0x10000,
    viewy: 0x20000,
    bufferofs: 0x200,
  });
  if (
    span.skipped ||
    span.rows.length !== 2 ||
    span.rows[0].plane !== 3 ||
    span.rows[0].count !== 1 ||
    span.rows[1].plane !== 0 ||
    span.rows[1].dest !== 0x200 + mod.WOLFHACK_planeylookup[1] + 1 ||
    mod.WOLFHACK_mr_count !== 0
  ) {
    fail(`WOLFHACK_DrawSpans did not summarize the source MapRow loop: ${JSON.stringify(span)}`);
  }
  const spanWallheight = Uint16Array.from([32, 24, 16, 8, 8, 16, 24, 32]);
  const planes = mod.WOLFHACK_DrawPlanes({
    viewwidth: 8,
    viewheight: 8,
    scale: 196,
    viewsin: -0x8000,
    viewcos: 0x4000,
    viewx: 0x10000,
    viewy: 0x20000,
    bufferofs: 0x200,
    wallheight: spanWallheight,
  });
  if (
    planes.halfheight !== 4 ||
    planes.psin !== -0x8000 ||
    planes.pcos !== 0x4000 ||
    planes.starts !== 3 ||
    planes.spanCalls !== 3 ||
    planes.mapRows !== 10 ||
    planes.spans[0].x1 !== 3 ||
    planes.spans[0].x2 !== 4 ||
    planes.spans[0].height !== 1 ||
    planes.spans[1].rows.length !== 4 ||
    planes.spans[2].rows[0].count !== 2
  ) {
    fail(`WOLFHACK_DrawPlanes did not expand wallheight transitions into spans: ${JSON.stringify(planes)}`);
  }

  dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_player"), player);
  dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_centerx"), centerx);
  dgroup.setU16(player + OBJ_ANGLE_OFFSET, 90);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, DIR_NORTH);
  dgroup.setU32(actor + OBJ_X_OFFSET, 12 * TILEGLOBAL);
  dgroup.setU32(actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL);
  const transformed = mod.WL_DRAW_TransformActor(dgroup, actor, context);
  const expectedActorNx = 0x1fffe - 0x4000;
  const actorHeight = Math.trunc(heightnumerator / (expectedActorNx >> 8));
  if (
    !transformed.visible ||
    transformed.nx !== expectedActorNx ||
    transformed.ny !== 0 ||
    transformed.viewx !== centerx ||
    transformed.viewheight !== actorHeight ||
    dgroup.i32(actor + OBJ_TRANSX_OFFSET) !== expectedActorNx ||
    dgroup.i32(actor + OBJ_TRANSY_OFFSET) !== 0 ||
    dgroup.u16(actor + OBJ_VIEWHEIGHT_OFFSET) !== actorHeight
  ) {
    fail(`WL_DRAW_TransformActor projection mismatch: ${JSON.stringify(transformed)}`);
  }

  dgroup.setU32(actor + OBJ_X_OFFSET, 10 * TILEGLOBAL + 0x6000);
  const tooClose = mod.WL_DRAW_TransformActor(dgroup, actor, context);
  if (tooClose.visible || tooClose.viewheight !== 0 || dgroup.u16(actor + OBJ_VIEWHEIGHT_OFFSET) !== 0) {
    fail("WL_DRAW_TransformActor did not suppress a point closer than mindist");
  }

  const tile = mod.WL_DRAW_TransformTile(10, 10, context);
  const expectedTileNx = 0x7fff - 0x2000;
  const expectedTileNy = 0x7fff;
  if (
    !tile.visible ||
    !tile.grabbed ||
    tile.nx !== expectedTileNx ||
    tile.ny !== expectedTileNy ||
    tile.dispx !== centerx + Math.trunc((expectedTileNy * scale) / expectedTileNx) ||
    tile.dispheight !== Math.trunc(heightnumerator / (expectedTileNx >> 8))
  ) {
    fail(`WL_DRAW_TransformTile projection mismatch: ${JSON.stringify(tile)}`);
  }

  const wallHeight = mod.WL_DRAW_CalcHeight(12 * TILEGLOBAL, 10 * TILEGLOBAL, context);
  const expectedWallNx = 0x1fffe;
  const clampedHeight = mod.WL_DRAW_CalcHeight(10 * TILEGLOBAL + 0x1000, 10 * TILEGLOBAL, context);
  if (
    wallHeight !== Math.trunc(heightnumerator / (expectedWallNx >> 8)) ||
    clampedHeight !== Math.trunc(heightnumerator / (0x5800 >> 8))
  ) {
    fail(`WL_DRAW_CalcHeight did not match projected wall height math: ${JSON.stringify({ wallHeight, clampedHeight })}`);
  }

  dgroup.setU16(actor + OBJ_VIEWX_OFFSET, centerx - 16);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, DIR_NORTH);
  const guardRotate = mod.WL_DRAW_CalcRotate(dgroup, actor, { centerx, player, rotate: 1 });
  const guardPainRotate = mod.WL_DRAW_CalcRotate(dgroup, actor, { centerx, player, rotate: 2 });
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, ROCKETOBJ);
  dgroup.setU16(actor + OBJ_ANGLE_OFFSET, 180);
  const rocketRotate = mod.WL_DRAW_CalcRotate(dgroup, actor, { centerx, player, rotate: 1 });
  if (guardRotate !== 4 || guardPainRotate !== 4 || rocketRotate !== 2) {
    fail(`WL_DRAW_CalcRotate mismatch: ${JSON.stringify({ guardRotate, guardPainRotate, rocketRotate })}`);
  }

  const tics = mod.WL_DRAW_CalcTics(dgroup, { timeCount: 44, lasttimecount: 20 });
  if (
    tics.tics !== 10 ||
    tics.timeCount !== 30 ||
    tics.lasttimecount !== 44 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_tics")) !== 10
  ) {
    fail(`WL_DRAW_CalcTics did not match MAXTICS clamp behavior: ${JSON.stringify(tics)}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0x1000);
  mod.ID_VL_VL_SetScreen(0x3000, 0);
  mod.WL_DRAW_SetViewSizeForRefresh(32, 4);
  mod.ID_VL_videoPlanes[2 * 0x10000 + 0x3000 + 2 * 80 + 3] = 0x77;
  const fixOfs = mod.WL_DRAW_FixOfs();
  if (
    fixOfs.source !== 0x3000 ||
    fixOfs.dest !== 0x1000 ||
    fixOfs.width !== 4 ||
    fixOfs.height !== 4 ||
    fixOfs.bytes !== 64 ||
    mod.WL_DRAW_viewwidth !== 32 ||
    mod.WL_DRAW_viewheight !== 4 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 0x1000 + 2 * 80 + 3] !== 0x77
  ) {
    fail(`WL_DRAW_FixOfs did not copy displayofs back to bufferofs: ${JSON.stringify(fixOfs)}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0x4000);
  mod.WL_DRAW_SetViewSizeForRefresh(32, 4);
  const clearScreen = mod.WL_DRAW_VGAClearScreen({ episode: 1, mapon: 0 });
  if (
    clearScreen.ceiling !== 0x4e ||
    clearScreen.floor !== 0x19 ||
    clearScreen.rowBytes !== 8 ||
    clearScreen.bytes !== 128 ||
    mod.ID_VL_videoPlanes[0x4000] !== 0x4e ||
    mod.ID_VL_videoPlanes[0x4000 + 7] !== 0x4e ||
    mod.ID_VL_videoPlanes[0x4000 + 8] !== 0 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 0x4000 + 80] !== 0x4e ||
    mod.ID_VL_videoPlanes[0x4000 + 160] !== 0x19 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 0x4000 + 240 + 7] !== 0x19
  ) {
    fail(`WL_DRAW_VGAClearScreen did not fill the Mode X view bands: ${JSON.stringify(clearScreen)}`);
  }
  const clearAlias = mod.WL_DRAW_ClearScreen({ episode: 0, mapon: 9 });
  if (clearAlias.ceiling !== 0xbf || mod.ID_VL_videoPlanes[0x4000] !== 0xbf) {
    fail(`WL_DRAW_ClearScreen did not delegate to VGAClearScreen: ${JSON.stringify(clearAlias)}`);
  }

  return {
    actorViewheight: transformed.viewheight,
    tileGrabbed: tile.grabbed,
    wallHeight,
    guardRotate,
    rocketRotate,
    clampedTics: tics.tics,
    fixOfsBytes: fixOfs.bytes,
    clearCeiling: clearScreen.ceiling,
    planeFixedMul: mod.WOLFHACK_FixedMul(0x7fffffff, 0x20000),
    planeSpans: [planes.spanCalls, planes.mapRows],
  };
}

async function checkRuntimeScalers(mod) {
  const build64 = mod.WL_SCALE_BuildCompScale(64, { viewheight: 152 });
  if (
    build64.height !== 64 ||
    build64.viewheight !== 152 ||
    build64.topPix !== 44 ||
    build64.totalSize !== 773 ||
    build64.scaledPixels !== 64 ||
    build64.codeofs[0] !== 260 ||
    build64.codeofs[64] !== 772 ||
    build64.width[0] !== 1 ||
    build64.width[63] !== 1 ||
    build64.width[64] !== 1 ||
    build64.codeBytes[build64.codeBytes.length - 1] !== 0xcb
  ) {
    fail(`WL_SCALE_BuildCompScale did not match the compiled-scaler layout: ${JSON.stringify({
      height: build64.height,
      viewheight: build64.viewheight,
      topPix: build64.topPix,
      totalSize: build64.totalSize,
      scaledPixels: build64.scaledPixels,
      code0: build64.codeofs[0],
      code64: build64.codeofs[64],
      widths: [build64.width[0], build64.width[63], build64.width[64]],
    })}`);
  }

  const line = mod.WL_SCALE_ScaleLine({
    slinex: 3,
    slinewidth: 6,
    bufferofs: 0x100,
    linecmds: [{ end: 12 }, { end: 0 }],
  });
  if (
    line.byteX !== 0 ||
    line.screenOffset !== 0x100 ||
    line.sourceSegments !== 1 ||
    line.patchedRetfs !== 1 ||
    line.screenColumns !== 3 ||
    line.masks.join(",") !== "8,15,1" ||
    mod.WL_SCALE_mapmasks1[3][5] !== 8 ||
    mod.WL_SCALE_mapmasks2[3][5] !== 15 ||
    mod.WL_SCALE_mapmasks3[3][5] !== 1
  ) {
    fail(`WL_SCALE_ScaleLine did not select the three-byte map masks: ${JSON.stringify(line)}`);
  }

  const setup = mod.WL_SCALE_SetupScaling(96, { viewheight: 16 });
  const oldSetup = mod.OLDSCALE_SetupScaling(96, { viewheight: 16 });
  const contigSetup = mod.CONTIGSC_SetupScaling(96, { viewheight: 16 });
  if (
    setup.scaleCount !== 48 ||
    setup.maxscale !== 47 ||
    setup.maxscaleshl2 !== 188 ||
    setup.stepbytwo !== 8 ||
    setup.badScaleStart !== 48 ||
    setup.built.length !== 21 ||
    setup.aliases.length !== 28 ||
    mod.WL_SCALE_fullscalefarcall[0] !== mod.WL_SCALE_fullscalefarcall[1] ||
    mod.WL_SCALE_fullscalefarcall[48] !== -1 ||
    oldSetup.built.length !== setup.built.length ||
    oldSetup.scalerBytes !== setup.scalerBytes ||
    contigSetup.built.length !== setup.built.length ||
    contigSetup.freeScalerMemory === null ||
    contigSetup.built[1].address % 16 !== 0 ||
    contigSetup.scalerBytes < setup.scalerBytes
  ) {
    fail(`SetupScaling summaries did not match source scaler allocation rules: ${JSON.stringify({
      setup,
      oldSetup,
      contigSetup,
      full0: mod.WL_SCALE_fullscalefarcall[0],
      full1: mod.WL_SCALE_fullscalefarcall[1],
      full48: mod.WL_SCALE_fullscalefarcall[48],
    })}`);
  }

  const shape = {
    leftpix: 28,
    rightpix: 36,
    dataofs: Array.from({ length: 64 }, (_unused, index) => 1000 + index),
  };
  const wallheight = new Uint16Array(80);
  wallheight[39] = 96;
  const clipped = mod.WL_SCALE_ScaleShape(40, shape, 64, {
    viewwidth: 80,
    viewheight: 16,
    wallheight,
  });
  const simple = mod.WL_SCALE_SimpleScaleShape(40, shape, 64, {
    viewwidth: 80,
    viewheight: 16,
  });
  const spriteVswap = new Uint8Array(12 + 256);
  const spriteVswapView = new DataView(spriteVswap.buffer);
  spriteVswapView.setUint16(0, 1, true);
  spriteVswapView.setUint16(2, 0, true);
  spriteVswapView.setUint16(4, 1, true);
  spriteVswapView.setUint32(6, 12, true);
  spriteVswapView.setUint16(10, 256, true);
  const spritePage = spriteVswap.subarray(12);
  const spritePageView = new DataView(spritePage.buffer, spritePage.byteOffset, spritePage.byteLength);
  spritePageView.setUint16(0, 31, true);
  spritePageView.setUint16(2, 31, true);
  spritePageView.setUint16(4, 6, true);
  spritePageView.setUint16(6, 128, true);
  spritePageView.setUint16(8, 129, true);
  spritePageView.setUint16(10, 0, true);
  spritePageView.setUint16(12, 0, true);
  spritePage.fill(0x5a, 129, 129 + 64);
  mod.ID_PM_PM_Startup(spriteVswap, ["wolf3d.exe", "-noems", "-noxms"]);
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0);
  const renderedSprite = mod.WL_SCALE_SimpleScaleShape(8, 0, 16, {
    viewwidth: 16,
    viewheight: 16,
  });
  const spritePixel = mod.ID_VL_videoPlanes[8 * 80 + 2];
  mod.ID_PM_PM_Shutdown();
  const retailVswap = new Uint8Array(await readFile(path.join(wl6Dir, "VSWAP.WL6")));
  mod.ID_PM_PM_Startup(retailVswap, ["wolf3d.exe", "-noems", "-noxms"]);
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(80);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_DRAW_SetViewSizeForRefresh(320, 152);
  const pistolPage = mod.ID_PM_PM_GetSpritePage(mod.WL_DEF_SPR_PISTOLREADY);
  const pistolPageView = new DataView(pistolPage.buffer, pistolPage.byteOffset, pistolPage.byteLength);
  const pistolBounds = [pistolPageView.getUint16(0, true), pistolPageView.getUint16(2, true)];
  const realWeapon = mod.WL_DRAW_DrawPlayerWeapon({ weapon: 1, weaponframe: 0 });
  const weaponPixelCount = mod.ID_VL_videoPlanes.reduce((count, value) => count + (value ? 1 : 0), 0);
  mod.ID_PM_PM_Shutdown();
  if (
    mod.WL_DEF_SPR_DEMO !== 0 ||
    mod.WL_DEF_SPR_DEATHCAM !== 1 ||
    mod.WL_DEF_SPR_KNIFEREADY !== 416 ||
    mod.WL_DEF_SPR_PISTOLREADY !== 421 ||
    mod.WL_DEF_SPR_MACHINEGUNREADY !== 426 ||
    mod.WL_DEF_SPR_CHAINREADY !== 431 ||
    clipped.skipped ||
    clipped.scale !== 8 ||
    clipped.lines.length !== 1 ||
    clipped.lines[0].side !== "right" ||
    clipped.lines[0].srcx !== 35 ||
    clipped.lines[0].x !== 40 ||
    clipped.lines[0].width !== 1 ||
    clipped.screenColumns !== 1 ||
    clipped.lines.some((entry) => entry.x < 0 || entry.x >= 80) ||
    simple.skipped ||
    simple.scale !== 32 ||
    simple.lines.length !== 9 ||
    simple.screenColumns !== 9 ||
    renderedSprite.pixels === 0 ||
    spritePixel !== 0x5a ||
    pistolBounds.join(",") !== "25,39" ||
    realWeapon.weaponShape !== mod.WL_DEF_SPR_PISTOLREADY ||
    realWeapon.draws.length !== 1 ||
    realWeapon.draws[0].pixels === 0 ||
    weaponPixelCount === 0
  ) {
    fail(`ScaleShape/SimpleScaleShape summaries did not follow source clipping rules: ${JSON.stringify({
      clipped,
      simple,
      renderedSprite,
      spritePixel,
      pistolBounds,
      realWeapon,
      weaponPixelCount,
      spriteConstants: [
        mod.WL_DEF_SPR_DEMO,
        mod.WL_DEF_SPR_DEATHCAM,
        mod.WL_DEF_SPR_KNIFEREADY,
        mod.WL_DEF_SPR_PISTOLREADY,
        mod.WL_DEF_SPR_MACHINEGUNREADY,
        mod.WL_DEF_SPR_CHAINREADY,
      ],
    })}`);
  }

  return {
    build64: [build64.totalSize, build64.scaledPixels, build64.codeofs[64]],
    setup: [setup.built.length, setup.aliases.length, setup.badScaleStart],
    contig: [contigSetup.scalerBytes, contigSetup.freeScalerMemory],
    lineMasks: line.masks,
    shape: [clipped.lines.length, clipped.screenColumns, simple.lines.length],
    spritePixels: renderedSprite.pixels,
    weaponSprite: [realWeapon.weaponShape, realWeapon.draws[0].pixels, weaponPixelCount],
  };
}

function checkRuntimeViewSize(mod) {
  const first = mod.WL_MAIN_SetViewSize(303, 155);
  if (
    first.viewwidth !== 288 ||
    first.viewheight !== 154 ||
    first.centerx !== 143 ||
    first.shootdelta !== 28 ||
    first.screenofs !== 244 ||
    first.projection.focallength !== 0x5700 ||
    first.projection.facedist !== 0xaf00 ||
    first.projection.halfview !== 144 ||
    first.projection.scale !== 196 ||
    first.projection.heightnumerator !== 200704 ||
    first.projection.minheightdiv !== 7 ||
    first.projection.maxslope !== 185 ||
    first.setupScalingWidth !== 432 ||
    mod.WL_MAIN_viewwidth !== 288 ||
    mod.WL_MAIN_maxslope !== 185 ||
    mod.WL_DRAW_pixelangle[0] !== 359 ||
    mod.WL_DRAW_pixelangle[143] !== 0 ||
    mod.WL_DRAW_pixelangle[144] !== 0 ||
    mod.WL_DRAW_pixelangle[287] !== -359 ||
    mod.WL_DRAW_viewwidth !== 288 ||
    mod.WL_DRAW_viewheight !== 154
  ) {
    fail(`WL_MAIN_SetViewSize did not match original view arithmetic: ${JSON.stringify(first)}`);
  }

  const preview = mod.WL_MAIN_ShowViewSize(10);
  if (
    preview.previewViewwidth !== 160 ||
    preview.previewViewheight !== 80 ||
    preview.restoredViewwidth !== 288 ||
    preview.restoredViewheight !== 154 ||
    mod.WL_MAIN_viewwidth !== 288 ||
    mod.WL_MAIN_viewheight !== 154
  ) {
    fail(`WL_MAIN_ShowViewSize did not restore the active dimensions: ${JSON.stringify(preview)}`);
  }

  const second = mod.WL_MAIN_NewViewSize(12);
  if (
    mod.WL_MAIN_viewsize !== 12 ||
    second.viewwidth !== 192 ||
    second.viewheight !== 96 ||
    second.centerx !== 95 ||
    second.shootdelta !== 19 ||
    second.screenofs !== 2576 ||
    second.projection.scale !== 131 ||
    second.projection.heightnumerator !== 134144 ||
    second.projection.minheightdiv !== 5 ||
    second.setupScalingWidth !== 288 ||
    mod.WL_DRAW_viewwidth !== 192 ||
    mod.WL_DRAW_viewheight !== 96
  ) {
    fail(`WL_MAIN_NewViewSize did not set viewsize and recompute dimensions: ${JSON.stringify(second)}`);
  }

  return {
    masked: [first.viewwidth, first.viewheight],
    screenofs: first.screenofs,
    projectionScale: first.projection.scale,
    preview: [preview.previewViewwidth, preview.previewViewheight],
    newViewSize: [second.viewwidth, second.viewheight],
  };
}

function checkRuntimeSetupTables(mod) {
  const walls = mod.WL_MAIN_SetupWalls();
  if (
    walls.firstHoriz !== 0 ||
    walls.firstVert !== 1 ||
    walls.lastHoriz !== 124 ||
    walls.lastVert !== 125 ||
    mod.WL_DRAW_horizwall[1] !== 0 ||
    mod.WL_DRAW_vertwall[1] !== 1 ||
    mod.WL_DRAW_horizwall[63] !== 124 ||
    mod.WL_DRAW_vertwall[63] !== 125
  ) {
    fail(`WL_MAIN_SetupWalls did not fill horizontal/vertical wall mappings: ${JSON.stringify(walls)}`);
  }

  mod.ID_SD_SD_ResetSoundState();
  const digi = mod.WL_MAIN_InitDigiMap();
  if (
    digi.entries !== 47 ||
    digi.halt !== 0 ||
    digi.death3 !== 13 ||
    digi.yeah !== 32 ||
    digi.rose !== 45 ||
    mod.ID_SD_DigiMap[21] !== 0 ||
    mod.ID_SD_DigiMap[25] !== 13 ||
    mod.ID_SD_DigiMap[75] !== 39 ||
    mod.ID_SD_DigiMap[84] !== 45 ||
    mod.ID_SD_DigiMap[0] !== -1 ||
    mod.WL_MAIN_wolfdigimap.at(-1) !== 87
  ) {
    fail(`WL_MAIN_InitDigiMap did not install the WL6 digitized sound map: ${JSON.stringify(digi)}`);
  }

  mod.WL_MAIN_MS_SetArgv(["wolf3d.exe", "-goobers", "/DEBUGMODE", "\\virtual", "---"]);
  const matchedGoobers = mod.WL_MAIN_MS_CheckParm("goobers");
  if (
    !matchedGoobers ||
    !mod.WL_MAIN_MS_CheckParm("debugmode") ||
    !mod.WL_MAIN_MS_CheckParm("virtual") ||
    mod.WL_MAIN_MS_CheckParm("no386")
  ) {
    fail("WL_MAIN_MS_CheckParm did not match command-line parameters like the original");
  }

  mod.WL_MAIN_MS_SetArgv(["wolf3d.exe", "--no386"]);
  const blocked386 = mod.WL_MAIN_Patch386();
  if (blocked386 || mod.WL_MAIN_IsA386) {
    fail("WL_MAIN_Patch386 did not honor the no386 parameter");
  }

  mod.WL_MAIN_MS_SetArgv(["wolf3d.exe"]);
  const patched386 = mod.WL_MAIN_Patch386();
  if (!patched386 || !mod.WL_MAIN_IsA386 || !mod.WL_ASM_ldivPatchApplied) {
    fail("WL_MAIN_Patch386 did not apply the modeled 386 long-divide patch");
  }

  mod.ID_US_US_Startup(["wolf3d.exe"], 1);
  mod.ID_IN_IN_Startup(["wolf3d.exe", "-nomouse", "-nojoys"]);
  mod.ID_VL_VL_Startup();
  mod.ID_VL_VL_SetVGAPlaneMode();
  mod.ID_MM_MM_Startup(0x20000);
  const shutdownId = mod.WL_MAIN_ShutdownId();
  if (
    !shutdownId.us.wasStarted ||
    shutdownId.us.started ||
    mod.ID_US_US_Started ||
    shutdownId.in.IN_Started ||
    shutdownId.vw.videoMode !== 3 ||
    shutdownId.vw.vgaPlaneMode ||
    shutdownId.mm.started ||
    shutdownId.mm.blocks !== 0 ||
    shutdownId.pm.started ||
    shutdownId.ca.hasMapFile ||
    shutdownId.ca.hasGraphicsFile ||
    shutdownId.ca.hasAudioFile
  ) {
    fail(`WL_MAIN_ShutdownId did not shut managers down in the WL_MAIN.C order: ${JSON.stringify(shutdownId)}`);
  }

  const originalDirscan = [...mod.WL_PLAY_dirscan];
  const originalButtonscan = [...mod.WL_PLAY_buttonscan];
  const originalButtonmouse = [...mod.WL_PLAY_buttonmouse];
  const originalButtonjoy = [...mod.WL_PLAY_buttonjoy];
  const config = new Uint8Array(mod.WL_MAIN_CONFIG_SIZE);
  const configView = new DataView(config.buffer);
  const scoreBytes = mod.ID_US_MaxHighName + 1 + 4 + 2 + 2;
  const writeFixed = (offset, text, length) => {
    for (let i = 0; i < Math.min(text.length, length - 1); i++) {
      config[offset + i] = text.charCodeAt(i);
    }
  };
  writeFixed(0, "Tester", mod.ID_US_MaxHighName + 1);
  configView.setInt32(mod.ID_US_MaxHighName + 1, 12345, true);
  configView.setUint16(mod.ID_US_MaxHighName + 1 + 4, 3, true);
  configView.setUint16(mod.ID_US_MaxHighName + 1 + 6, 2, true);
  let cfgOffset = mod.ID_US_MaxScores * scoreBytes;
  configView.setUint16(cfgOffset, mod.ID_SD_sdm_AdLib, true); cfgOffset += 2;
  configView.setUint16(cfgOffset, mod.ID_SD_smm_AdLib, true); cfgOffset += 2;
  configView.setUint16(cfgOffset, mod.ID_SD_sds_SoundBlaster, true); cfgOffset += 2;
  for (const value of [1, 1, 1, 1, 1]) {
    configView.setInt16(cfgOffset, value, true);
    cfgOffset += 2;
  }
  for (const value of [11, 12, 13, 14]) {
    configView.setInt16(cfgOffset, value, true);
    cfgOffset += 2;
  }
  for (const value of [21, 22, 23, 24, 25, 26, 27, 28]) {
    configView.setInt16(cfgOffset, value, true);
    cfgOffset += 2;
  }
  for (const value of [0, 1, 3, -1]) {
    configView.setInt16(cfgOffset, value, true);
    cfgOffset += 2;
  }
  for (const value of [3, 2, 1, 0]) {
    configView.setInt16(cfgOffset, value, true);
    cfgOffset += 2;
  }
  configView.setInt16(cfgOffset, 13, true); cfgOffset += 2;
  configView.setInt16(cfgOffset, 7, true);

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true, SoundBlasterPresent: true, SoundSourcePresent: true });
  mod.ID_IN_IN_ResetInputState({ MousePresent: true, JoysPresent: [false, true] });
  const readConfig = mod.WL_MAIN_ReadConfig(config);
  const writtenConfig = mod.WL_MAIN_WriteConfig();
  const written = writtenConfig.bytesOut;
  const writtenView = new DataView(written.buffer, written.byteOffset, written.byteLength);
  if (
    !readConfig.present ||
    readConfig.bytes !== mod.WL_MAIN_CONFIG_SIZE ||
    readConfig.scores[0]?.name !== "Tester" ||
    readConfig.scores[0]?.score !== 12345 ||
    readConfig.scores[0]?.completed !== 3 ||
    readConfig.scores[0]?.episode !== 2 ||
    readConfig.sd !== mod.ID_SD_sdm_AdLib ||
    readConfig.sm !== mod.ID_SD_smm_AdLib ||
    readConfig.sds !== mod.ID_SD_sds_SoundBlaster ||
    !readConfig.controls.mouseenabled ||
    !readConfig.controls.joystickenabled ||
    !readConfig.controls.joypadenabled ||
    !readConfig.controls.joystickprogressive ||
    readConfig.controls.joystickport !== 1 ||
    JSON.stringify(readConfig.dirscan) !== JSON.stringify([11, 12, 13, 14]) ||
    JSON.stringify(readConfig.buttonscan) !== JSON.stringify([21, 22, 23, 24, 25, 26, 27, 28]) ||
    JSON.stringify(readConfig.buttonmouse) !== JSON.stringify([0, 1, 3, -1]) ||
    readConfig.viewsize !== 13 ||
    readConfig.mouseadjustment !== 7 ||
    mod.WL_MENU_MainMenu[6].active !== 1 ||
    mod.WL_MENU_MainItems.curpos !== 0 ||
    written.length !== mod.WL_MAIN_CONFIG_SIZE ||
    writtenView.getInt32(mod.ID_US_MaxHighName + 1, true) !== 12345 ||
    writtenView.getUint16(mod.ID_US_MaxScores * scoreBytes, true) !== mod.ID_SD_sdm_AdLib ||
    writtenView.getInt16(mod.ID_US_MaxScores * scoreBytes + 6 + 8, true) !== 1
  ) {
    fail(`WL_MAIN ReadConfig/WriteConfig did not mirror CONFIG.WL6 layout and hardware filtering: ${JSON.stringify({
      readConfig,
      writtenLength: written?.length,
      writtenScore: written ? writtenView.getInt32(mod.ID_US_MaxHighName + 1, true) : null,
    })}`);
  }

  mod.ID_SD_SD_ResetSoundState();
  mod.ID_IN_IN_ResetInputState();
  const defaultConfig = mod.WL_MAIN_ReadConfig(null);
  if (
    defaultConfig.present ||
    defaultConfig.sd !== mod.ID_SD_sdm_PC ||
    defaultConfig.sm !== mod.ID_SD_smm_Off ||
    defaultConfig.sds !== mod.ID_SD_sds_Off ||
    defaultConfig.controls.mouseenabled ||
    defaultConfig.controls.joystickenabled ||
    defaultConfig.viewsize !== 15 ||
    defaultConfig.mouseadjustment !== 5
  ) {
    fail(`WL_MAIN_ReadConfig did not choose original no-config defaults from hardware state: ${JSON.stringify(defaultConfig)}`);
  }
  mod.WL_PLAY_dirscan.splice(0, mod.WL_PLAY_dirscan.length, ...originalDirscan);
  mod.WL_PLAY_buttonscan.splice(0, mod.WL_PLAY_buttonscan.length, ...originalButtonscan);
  mod.WL_PLAY_buttonmouse.splice(0, mod.WL_PLAY_buttonmouse.length, ...originalButtonmouse);
  mod.WL_PLAY_buttonjoy.splice(0, mod.WL_PLAY_buttonjoy.length, ...originalButtonjoy);

  mod.ID_SD_SD_ResetSoundState();
  let jukeboxClears = 0;
  const jukeboxUnavailable = mod.WL_MAIN_DoJukebox({ clearKeysDown: () => ++jukeboxClears });
  if (
    jukeboxUnavailable.available ||
    jukeboxUnavailable.start !== null ||
    jukeboxUnavailable.initialClear !== 1 ||
    jukeboxUnavailable.actions.length !== 0
  ) {
    fail(`WL_MAIN_DoJukebox did not return immediately without AdLib/SoundBlaster hardware: ${JSON.stringify(jukeboxUnavailable)}`);
  }

  mod.WL_MAIN_MusicMenu.forEach((item) => {
    item.active = 1;
  });
  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true });
  const jukeboxPlayed = [];
  const jukeboxDraws = [];
  let jukeboxFades = 0;
  let jukeboxUpdates = 0;
  const jukebox = mod.WL_MAIN_DoJukebox({
    hsecond: 250,
    selections: [1, 4, -1],
    clearKeysDown: () => ++jukeboxClears,
    fadeOut: () => `fade-${++jukeboxFades}`,
    fadeIn: () => "fade-in",
    cacheFont: (chunk) => chunk,
    cacheLump: (start, end) => [start, end],
    loadAllSounds: () => "sounds",
    draw: (state) => {
      jukeboxDraws.push([state.phase, state.start, state.which, state.song]);
      return `${state.phase}-${state.which}`;
    },
    update: () => `update-${++jukeboxUpdates}`,
    startMusic: (song) => {
      jukeboxPlayed.push(song);
      return { song };
    },
    uncacheLump: (start, end) => [start, end, "uncache"],
  });
  if (
    !jukebox.available ||
    jukebox.start !== 6 ||
    JSON.stringify([...mod.WL_MAIN_JUKEBOX_SONGS]) !== JSON.stringify([3, 11, 9, 12, 2, 0, 8, 18, 17, 4, 1, 19, 6, 20, 22, 21, 19, 26]) ||
    JSON.stringify(jukebox.selections) !== JSON.stringify([1, 4]) ||
    JSON.stringify(jukeboxPlayed) !== JSON.stringify([18, 1]) ||
    jukebox.actions.length !== 2 ||
    jukebox.actions[0].previous !== -1 ||
    jukebox.actions[0].menuIndex !== 7 ||
    jukebox.actions[1].previous !== 1 ||
    jukebox.actions[1].previousMenuIndex !== 7 ||
    jukebox.active[7] !== 1 ||
    jukebox.active[10] !== 2 ||
    jukebox.cacheFont !== 2 ||
    JSON.stringify(jukebox.cacheLump) !== JSON.stringify([10, 42]) ||
    jukebox.loadAllSounds !== "sounds" ||
    jukebox.fadeIn !== "fade-in" ||
    jukebox.finalFadeOut !== "fade-2" ||
    JSON.stringify(jukebox.uncacheLump) !== JSON.stringify([10, 42, "uncache"]) ||
    JSON.stringify(jukeboxDraws) !== JSON.stringify([
      ["initial", 6, -1, null],
      ["selection", 6, 1, 18],
      ["selection", 6, 4, 1],
    ])
  ) {
    fail(`WL_MAIN_DoJukebox did not model the WL6 jukebox bank and menu-state loop: ${JSON.stringify({
      jukebox,
      jukeboxPlayed,
      jukeboxDraws,
    })}`);
  }

  mod.WL_MAIN_SetMainLoopState({ startgame: false, loadedgame: false, lastDemo: 0 });
  const demoMusic = [];
  let demoFades = 0;
  const demoLoop = mod.WL_MAIN_DemoLoop({
    argv: ["wolf3d.exe", "-goobers"],
    maxCycles: 1,
    maxAttractLoops: 1,
    nonShareware: () => "non-shareware",
    startCPMusic: (song) => {
      demoMusic.push(song);
      return `music-${song}-${demoMusic.length}`;
    },
    pg13: () => "pg13",
    sortMem: () => "sort",
    title: () => "title",
    credits: () => "credits",
    drawHighScores: () => "scores",
    userInput: () => false,
    playDemo: (demo) => ({ demo, playstate: 0 }),
    fadeOut: () => `fade-${++demoFades}`,
    controlPanel: () => ({ startGame: true }),
    gameLoop: () => "game-loop",
  });
  const demoStages = demoLoop.cycles[0]?.attract.map((step) => step.stage);
  if (
    demoLoop.mode !== "attract" ||
    demoLoop.nonShareware !== "non-shareware" ||
    demoLoop.introMusic !== "music-7-1" ||
    demoLoop.pg13 !== "pg13" ||
    JSON.stringify(demoStages) !== JSON.stringify(["title", "credits", "scores", "demo", "intro-music"]) ||
    demoLoop.cycles[0]?.attract[3]?.demo !== 0 ||
    demoLoop.cycles[0]?.attract[3]?.playstate !== 0 ||
    demoLoop.cycles[0]?.controlPanel?.startGame !== true ||
    !demoLoop.cycles[0]?.gameStartedOrLoaded ||
    demoLoop.cycles[0]?.gameLoop !== "game-loop" ||
    demoLoop.cycles[0]?.restartMusic !== "music-7-3" ||
    demoLoop.lastDemo !== 1 ||
    mod.WL_MAIN_LastDemo !== 1 ||
    JSON.stringify(demoMusic) !== JSON.stringify([7, 7, 7])
  ) {
    fail(`WL_MAIN_DemoLoop did not follow the bounded attract/menu/game sequence: ${JSON.stringify({
      demoLoop,
      demoStages,
      demoMusic,
    })}`);
  }

  const tedLoop = mod.WL_MAIN_DemoLoop({
    argv: ["wolf3d.exe", "hard"],
    tedlevel: true,
    tedlevelnum: 37,
    newGame: (difficulty, episode) => [difficulty, episode],
    setTedGameState: (state) => state,
    gameLoop: () => "ted-game",
    quit: (error) => error,
  });
  if (
    tedLoop.mode !== "ted" ||
    !tedLoop.noWait ||
    JSON.stringify(tedLoop.newGame) !== JSON.stringify([1, 0]) ||
    tedLoop.tedState?.difficulty !== 3 ||
    tedLoop.tedState?.episode !== 3 ||
    tedLoop.tedState?.mapon !== 7 ||
    tedLoop.setTedGameState?.mapon !== 7 ||
    tedLoop.tedGameLoop !== "ted-game" ||
    tedLoop.tedQuit !== null
  ) {
    fail(`WL_MAIN_DemoLoop did not model the TED launch shortcut: ${JSON.stringify(tedLoop)}`);
  }

  const mainCalls = [];
  const mainSummary = mod.WL_MAIN_main({
    argv: ["wolf3d.exe", "-nowait"],
    checkForEpisodes: () => { mainCalls.push("episodes"); return "episodes"; },
    patch386: (argv) => { mainCalls.push(`patch:${argv[1]}`); return "patch"; },
    initGame: (options) => { mainCalls.push(`init:${options.argv[1]}`); return "init"; },
    demoLoop: (options) => { mainCalls.push(`demo:${options.argv[1]}`); return "demo"; },
    quit: (error) => { mainCalls.push(`quit:${error}`); return error; },
  });
  if (
    JSON.stringify(mainCalls) !== JSON.stringify(["episodes", "patch:-nowait", "init:-nowait", "demo:-nowait", "quit:Demo loop exited???"]) ||
    mainSummary.argv[1] !== "-nowait" ||
    mainSummary.checkForEpisodes !== "episodes" ||
    mainSummary.patch386 !== "patch" ||
    mainSummary.initGame !== "init" ||
    mainSummary.demoLoop !== "demo" ||
    mainSummary.quit !== "Demo loop exited???"
  ) {
    fail(`WL_MAIN_main did not preserve startup order and fall-through quit: ${JSON.stringify({ mainSummary, mainCalls })}`);
  }

  const quitShutdown = { marker: "shutdown" };
  const quitNormal = mod.WL_MAIN_Quit(null, {
    virtualReality: true,
    clearMemory: () => "cleared",
    cacheGraphic: (chunk) => new Uint8Array(chunk === 136 ? 5 : 6),
    writeConfig: () => ({ bytes: 123 }),
    shutdown: () => quitShutdown,
  });
  const quitError = mod.WL_MAIN_Quit("bad wolf", {
    clearMemory: () => "cleared",
    cacheGraphic: () => new Uint8Array(7),
    shutdown: () => quitShutdown,
  });
  if (
    quitNormal.error !== null ||
    quitNormal.virtualInterrupt !== 0x61 ||
    quitNormal.clearMemory !== "cleared" ||
    quitNormal.screenChunk !== 136 ||
    quitNormal.screenBytes !== 5 ||
    quitNormal.writeConfig?.bytes !== 123 ||
    quitNormal.shutdown !== quitShutdown ||
    quitNormal.textCopy.bytes !== 4000 ||
    JSON.stringify(quitNormal.cursor) !== JSON.stringify([1, 24]) ||
    quitNormal.exitCode !== 0 ||
    quitError.error !== "bad wolf" ||
    quitError.screenChunk !== 137 ||
    quitError.screenBytes !== 7 ||
    quitError.writeConfig !== null ||
    quitError.textCopy.bytes !== 1120 ||
    quitError.printedError !== "bad wolf" ||
    JSON.stringify(quitError.cursor) !== JSON.stringify([1, 8]) ||
    quitError.exitCode !== 1
  ) {
    fail(`WL_MAIN_Quit did not follow normal/error shutdown branches: ${JSON.stringify({ quitNormal, quitError })}`);
  }

  const initPalette = new Uint8Array(768);
  for (let i = 0; i < initPalette.length; i++) {
    initPalette[i] = i & 0xff;
  }
  const init = mod.WL_MAIN_InitGame({
    argv: ["wolf3d.exe", "-virtual"],
    heapBytes: 0x50000,
    timeLowByte: 9,
    signonOptions: { palette: initPalette },
    introScreen: false,
    loadLatchMem: false,
    cacheGrChunk: () => new Uint8Array([1, 2, 3]),
  });
  if (
    !init.virtualreality ||
    !init.memory.started ||
    init.memory.mainmem < 0x4f000 ||
    !init.signon.virtualreality ||
    init.signon.hiddenScreen !== null ||
    init.video.videoMode !== 0x13 ||
    !init.input.IN_Started ||
    init.page !== null ||
    !init.sound.hasOwnProperty("SoundMode") ||
    !init.user.started ||
    init.digi.entries !== 47 ||
    init.buffer.bufferofs !== 0 ||
    init.display.displayofs !== 0 ||
    init.config.viewsize !== 15 ||
    init.intro !== null ||
    init.startFontBytes !== 3 ||
    init.latch !== null ||
    init.tables.tangent0 !== 57 ||
    init.walls.lastVert !== 125
  ) {
    fail(`WL_MAIN_InitGame did not run the deterministic startup sequence: ${JSON.stringify(init)}`);
  }
  mod.WL_MAIN_ShutdownId();

  return {
    walls: [walls.firstHoriz, walls.firstVert, walls.lastHoriz, walls.lastVert],
    digiEntries: digi.entries,
    digiSentinels: [digi.halt, digi.death3, digi.yeah, digi.rose],
    shutdown: [
      shutdownId.us.wasStarted,
      shutdownId.in.IN_Started,
      shutdownId.vw.videoMode,
      shutdownId.mm.blocks,
    ],
    config: [
      readConfig.scores[0]?.score,
      readConfig.viewsize,
      written.length,
      defaultConfig.sd,
    ],
    jukebox: [jukebox.start, jukeboxPlayed[0], jukeboxPlayed[1], jukebox.active[10]],
    demoLoop: [demoLoop.cycles.length, demoLoop.lastDemo, tedLoop.tedState?.mapon, mainCalls.length],
    quit: [quitNormal.screenChunk, quitNormal.exitCode, quitError.screenChunk, quitError.exitCode],
    init: [init.virtualreality, init.startFontBytes, init.digi.entries, init.walls.lastVert],
    parms: [
      matchedGoobers,
      blocked386,
      patched386,
    ],
  };
}

function checkRuntimeIntermission(mod) {
  const GAMESTATE_DIFFICULTY_OFFSET = 0;
  const GAMESTATE_MAPON_OFFSET = 2;
  const GAMESTATE_SCORE_OFFSET = 8;
  const GAMESTATE_EPISODE_OFFSET = 38;
  const GAMESTATE_SECRETCOUNT_OFFSET = 40;
  const GAMESTATE_TREASURECOUNT_OFFSET = 42;
  const GAMESTATE_KILLCOUNT_OFFSET = 44;
  const GAMESTATE_SECRETTOTAL_OFFSET = 46;
  const GAMESTATE_TREASURETOTAL_OFFSET = 48;
  const GAMESTATE_KILLTOTAL_OFFSET = 50;
  const GAMESTATE_TIMECOUNT_OFFSET = 52;

  const backdoor = mod.WL_INTER_BackDoor("Joshua");
  if (!backdoor.match || backdoor.index !== 2 || backdoor.response[0] !== "Greetings Professor Falken, would you") {
    fail(`WL_INTER_BackDoor did not recognize source backdoor strings: ${JSON.stringify(backdoor)}`);
  }

  const copyStaff = mod.WL_INTER_CopyProtection({
    quizType: "staffquiz",
    choice: 1,
    input: "romero",
  });
  const copyBackdoor = mod.WL_INTER_CopyProtection({
    quizType: "miscquiz",
    choice: 0,
    input: "snoops",
  });
  if (
    !copyStaff.correct ||
    !copyStaff.accepted ||
    copyStaff.backDoor.match ||
    copyBackdoor.correct ||
    !copyBackdoor.backDoor.match ||
    !copyBackdoor.accepted
  ) {
    fail(`WL_INTER_CopyProtection did not match quiz/backdoor answers: ${JSON.stringify({ copyStaff, copyBackdoor })}`);
  }

  const endScreen = mod.WL_INTER_EndScreen(154, 81);
  const endSpear = mod.WL_INTER_EndSpear();
  if (
    endScreen.palette !== 154 ||
    endScreen.screen !== 81 ||
    typeof endScreen.ack !== "boolean" ||
    !endScreen.clearKeys ||
    endSpear.screens.length !== 8 ||
    endSpear.screens[0].screen !== 81 ||
    endSpear.screens[7].screen !== 82 ||
    endSpear.storyScreens[0] !== 83 ||
    endSpear.savegameActive !== false
  ) {
    fail(`WL_INTER ending screen summaries mismatch: ${JSON.stringify({ endScreen, endSpear })}`);
  }

  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 2, 0);
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.setU16(gamestate + GAMESTATE_MAPON_OFFSET, 0);
  dgroup.setU16(gamestate + GAMESTATE_EPISODE_OFFSET, 0);
  dgroup.setU32(gamestate + GAMESTATE_TIMECOUNT_OFFSET, 70 * 60);
  dgroup.setU16(gamestate + GAMESTATE_KILLCOUNT_OFFSET, 5);
  dgroup.setU16(gamestate + GAMESTATE_KILLTOTAL_OFFSET, 5);
  dgroup.setU16(gamestate + GAMESTATE_SECRETCOUNT_OFFSET, 1);
  dgroup.setU16(gamestate + GAMESTATE_SECRETTOTAL_OFFSET, 2);
  dgroup.setU16(gamestate + GAMESTATE_TREASURECOUNT_OFFSET, 0);
  dgroup.setU16(gamestate + GAMESTATE_TREASURETOTAL_OFFSET, 4);
  const completed = mod.WL_INTER_LevelCompleted(dgroup);
  if (
    !completed.normalFloor ||
    completed.parTime !== "01:30" ||
    completed.elapsedSeconds !== 60 ||
    completed.timeLeft !== 30 ||
    completed.ratios.kill !== 100 ||
    completed.ratios.secret !== 50 ||
    completed.ratios.treasure !== 0 ||
    completed.bonus !== 25000 ||
    dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET) !== 25000 ||
    mod.WL_INTER_LevelRatios[0].time !== 60 ||
    mod.WL_INTER_LevelRatios[0].kill !== 100
  ) {
    fail(`WL_INTER_LevelCompleted did not compute par bonus and ratios: ${JSON.stringify(completed)}`);
  }

  const secretDgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(secretDgroup, 2, 0);
  secretDgroup.setU16(gamestate + GAMESTATE_MAPON_OFFSET, 9);
  const secret = mod.WL_INTER_LevelCompleted(secretDgroup);
  if (secret.normalFloor || secret.bonus !== 15000 || secret.savedRatio !== null) {
    fail(`WL_INTER_LevelCompleted did not follow secret-floor bonus path: ${JSON.stringify(secret)}`);
  }

  for (let i = 1; i < 8; i++) {
    mod.WL_INTER_LevelRatios[i].kill = 80;
    mod.WL_INTER_LevelRatios[i].secret = 40;
    mod.WL_INTER_LevelRatios[i].treasure = 20;
    mod.WL_INTER_LevelRatios[i].time = 30;
  }
  dgroup.setU16(gamestate + GAMESTATE_DIFFICULTY_OFFSET, 2);
  const victory = mod.WL_INTER_Victory(dgroup);
  if (
    victory.totalSeconds !== 270 ||
    victory.totalTime !== "04:30" ||
    victory.averages.kill !== 82 ||
    victory.averages.secret !== 41 ||
    victory.averages.treasure !== 17 ||
    victory.timeCode !== "OJF" ||
    victory.ending !== "EndText"
  ) {
    fail(`WL_INTER_Victory did not average LevelRatios/timecode: ${JSON.stringify(victory)}`);
  }

  return {
    backdoor: backdoor.index,
    copy: [copyStaff.accepted, copyBackdoor.backDoor.index],
    endSpear: endSpear.screens.length,
    completed: [completed.timeLeft, completed.bonus, completed.ratios.kill],
    secretBonus: secret.bonus,
    victory: [victory.totalSeconds, victory.averages.kill, victory.timeCode],
  };
}

function checkRuntimeDebugText(mod) {
  const memory = mod.WL_DEBUG_DebugMemory({ mainmem: 65536, unusedMemory: 16384, totalFree: 32768 });
  const counts = mod.WL_DEBUG_CountObjects({
    statics: [{ shapenum: 4 }, { shapenum: -1 }, { shapenum: 9 }],
    actors: [{ active: true }, { active: false }, { active: true }],
    doornum: 5,
  });
  const god = mod.WL_DEBUG_DebugKeys({ key: "G", godmode: false });
  const warp = mod.WL_DEBUG_DebugKeys({ key: "W", value: 5 });
  const actorat = new Uint16Array(64 * 64);
  actorat[9 * 64 + 4] = 77;
  const overhead = mod.WL_DEBUG_OverheadRefresh({ originX: 4, originY: 9, actorat });
  const view = mod.WL_DEBUG_ViewMap({
    playerTileX: 32,
    playerTileY: 32,
    actorat,
    controls: [{ x: 1 }, { y: -1 }],
  });
  const pause = mod.WL_DEBUG_PicturePause({ enterPressed: true });
  const shape = mod.WL_DEBUG_ShapeTest({
    page: 2,
    chunksInFile: 10,
    spriteStart: 4,
    soundStart: 8,
    scans: ["Right", "D", "I"],
  });

  const article = "^P\nHello world\n^G10,20,42\nNext\n^P\nSecond\n^E\n";
  const cache = mod.WL_TEXT_CacheLayoutGraphics(article);
  const shown = mod.WL_TEXT_ShowArticle({ article, renderAll: true });
  const end = mod.WL_TEXT_EndText({ episode: 2 });

  if (
    memory.totalK !== 64 ||
    memory.freeK !== 16 ||
    memory.withPurgeK !== 32 ||
    counts.inUseStatics !== 2 ||
    counts.deletedStatics !== 1 ||
    counts.activeActors !== 2 ||
    !god.godmode ||
    warp.value !== 4 ||
    overhead.tiles[0].tile !== 77 ||
    view.originX !== 23 ||
    view.originY !== 25 ||
    !pause.quit ||
    shape.page !== 9 ||
    shape.kind !== "sound-info" ||
    cache.pages !== 2 ||
    !cache.marked.includes(42) ||
    shown.pages.length !== 2 ||
    shown.totalPages !== 2 ||
    end.chunkOrFile !== 145
  ) {
    fail(
      `WL_DEBUG/WL_TEXT runtime summaries diverged: ${JSON.stringify({
        memory,
        counts,
        god,
        warp,
        overhead0: overhead.tiles[0],
        view,
        pause,
        shape,
        cache,
        shownPages: shown.pages.length,
        end,
      })}`,
    );
  }

  return {
    memory: [memory.totalK, memory.freeK, memory.withPurgeK],
    objects: [counts.inUseStatics, counts.activeActors, counts.doors],
    textPages: shown.pages.length,
    marked: cache.marked.length,
  };
}

function checkRuntimeDrawRuntime(mod) {
  const TILEGLOBAL = 1 << 16;
  mod.WL_DRAW_SetViewSizeForRefresh(64, 8);
  mod.WL_DRAW_scaledPosts.length = 0;
  mod.WL_DRAW_vertwall[1] = 12;
  const context = {
    viewx: 0,
    viewy: 0,
    viewsin: 0,
    viewcos: 0xffff,
    scale: 0x100,
    centerx: 32,
    heightnumerator: (TILEGLOBAL * 0x100) >> 6,
  };
  const first = mod.WL_DRAW_HitVertWall(context, {
    tilehit: 1,
    pixx: 1,
    xtile: 2,
    xtilestep: 1,
    xintercept: 2 * TILEGLOBAL,
    yintercept: 0x12340,
  });
  const second = mod.WL_DRAW_HitVertWall(context, {
    tilehit: 1,
    pixx: 2,
    xtile: 2,
    xtilestep: 1,
    xintercept: 2 * TILEGLOBAL,
    yintercept: 0x12340,
  });
  const post = mod.WL_DRAW_ScalePost();
  const weapon = mod.WL_DRAW_DrawPlayerWeapon({ weapon: 1, weaponframe: 2, demoplayback: true });
  const scaleds = mod.WL_DRAW_DrawScaleds({
    actors: [
      { viewx: 20, viewheight: 30, shapenum: 7 },
      { viewx: 12, viewheight: 10, shapenum: 9 },
    ],
  });
  const refresh = mod.WL_DRAW_ThreeDRefresh({
    viewx: 0,
    viewy: 0,
    viewsin: 0,
    viewcos: 0xffff,
    context,
    episode: 0,
    mapon: 0,
    actors: [{ viewx: 16, viewheight: 12, shapenum: 4 }],
    weapon: -1,
  });
  const wallVswap = new Uint8Array(12 + 4096);
  const wallVswapView = new DataView(wallVswap.buffer);
  wallVswapView.setUint16(0, 1, true);
  wallVswapView.setUint16(2, 1, true);
  wallVswapView.setUint16(4, 1, true);
  wallVswapView.setUint32(6, 12, true);
  wallVswapView.setUint16(10, 4096, true);
  for (let y = 0; y < 64; y++) {
    wallVswap[12 + y] = 0x30 + y;
  }
  mod.ID_PM_PM_Startup(wallVswap, ["wolf3d.exe", "-noems", "-noxms"]);
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_DRAW_SetViewSizeForRefresh(16, 16);
  mod.WL_DRAW_scaledPosts.length = 0;
  mod.WL_DRAW_vertwall[1] = 0;
  mod.WL_DRAW_HitVertWall(context, {
    tilehit: 1,
    pixx: 4,
    xtile: 1,
    xtilestep: 1,
    xintercept: TILEGLOBAL,
    yintercept: 0,
  });
  const wallPixelPost = mod.WL_DRAW_ScalePost();
  const wallPixel = mod.ID_VL_videoPlanes[8 * 80 + 1];
  mod.ID_PM_PM_Shutdown();

  if (
    first.optimized ||
    !second.optimized ||
    post.width !== 2 ||
    post.wallpic !== 12 ||
    weapon.weaponShape !== 423 ||
    weapon.draws.length !== 2 ||
    scaleds.drawOrder[0].shapenum !== 9 ||
    scaleds.scaled.length !== 2 ||
    refresh.clear.ceiling !== 0x1d ||
    refresh.frameon < 1 ||
    wallPixelPost.wallpic !== 0 ||
    wallPixel === 0
  ) {
    fail(`WL_DRAW post/refresh summaries diverged: ${JSON.stringify({ first, second, post, weapon, scaleds, refresh, wallPixelPost, wallPixel })}`);
  }

  return {
    post: [post.width, post.wallpic],
    wallPixel,
    weapon: [weapon.weaponShape, weapon.draws.length],
    order: scaleds.drawOrder.map((entry) => entry.shapenum),
    frameon: refresh.frameon,
  };
}

function checkRuntimeSpearActions(mod) {
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_DISTANCE_OFFSET = 10;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_ANGLE_OFFSET = 42;
  const OBJ_HITPOINTS_OFFSET = 44;
  const OBJ_SPEED_OFFSET = 46;
  const OBJ_TEMP1_OFFSET = 50;
  const FL_SHOOTABLE = 1;
  const FL_AMBUSH = 64;
  const FL_NONMARK = 128;
  const AC_YES = 1;
  const NODIR = 8;
  const ANGELOBJ = 22;
  const WILLOBJ = 25;
  const DEATHOBJ = 26;
  const HROCKETOBJ = 27;
  const SPARKOBJ = 28;

  const gamestateFieldOffset = (name) => {
    const field = mod.STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
    if (!field) {
      fail(`missing gametype field ${name}`);
    }
    return field[1];
  };

  function makeScene(playerX = 14, playerY = 10) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    return { dgroup, plane0, plane1 };
  }

  const angelScene = makeScene();
  const angel = mod.WL_ACT2_SpawnAngel(angelScene.dgroup, angelScene.plane0, 10, 10, { difficulty: 2 });
  const uber = mod.WL_ACT2_SpawnUber(angelScene.dgroup, angelScene.plane0, 11, 10, {
    difficulty: 2,
    loadedgame: true,
  });
  if (
    angelScene.dgroup.u16(angel.actor + OBJ_CLASS_OFFSET) !== ANGELOBJ ||
    angelScene.dgroup.u16(angel.actor + OBJ_HITPOINTS_OFFSET) !== mod.starthitpoints[2][17] ||
    (angelScene.dgroup.u8(angel.actor + OBJ_FLAGS_OFFSET) & (FL_SHOOTABLE | FL_AMBUSH)) !== (FL_SHOOTABLE | FL_AMBUSH) ||
    uber.which !== 19
  ) {
    fail(`Spear spawn summaries diverged: ${JSON.stringify({ angel, uber })}`);
  }

  const dormantScene = makeScene(20, 20);
  const spectre = mod.WL_ACT2_SpawnSpectre(dormantScene.dgroup, dormantScene.plane0, 10, 10, { difficulty: 1 });
  const dormant = mod.WL_ACT2_A_Dormant(dormantScene.dgroup, spectre.actor);
  if (!dormant.awakened || dormant.state !== "_s_spectrewait1" || dormantScene.dgroup.u16(spectre.actor + OBJ_DIR_OFFSET) !== NODIR) {
    fail(`A_Dormant did not wake the spectre: ${JSON.stringify(dormant)}`);
  }

  const relaunch = mod.WL_ACT2_A_Relaunch(angelScene.dgroup, angel.actor);
  if (relaunch.temp1 !== 1) {
    fail(`A_Relaunch did not increment temp1: ${JSON.stringify(relaunch)}`);
  }

  angelScene.dgroup.setU16(angel.actor + OBJ_CLASS_OFFSET, ANGELOBJ);
  angelScene.dgroup.setU32(angel.actor + OBJ_X_OFFSET, 10 * TILEGLOBAL);
  angelScene.dgroup.setU32(angel.actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL);
  const spark = mod.WL_ACT2_T_Launch(angelScene.dgroup, angel.actor);
  if (
    spark.obclass !== SPARKOBJ ||
    spark.angle !== 353 ||
    spark.sound.sound !== 69 ||
    angelScene.dgroup.u16(spark.actor + OBJ_ACTIVE_OFFSET) !== AC_YES ||
    angelScene.dgroup.u8(spark.actor + OBJ_FLAGS_OFFSET) !== FL_NONMARK
  ) {
    fail(`T_Launch angel spark diverged: ${JSON.stringify(spark)}`);
  }

  const deathScene = makeScene(14, 10);
  const death = mod.WL_ACT2_SpawnDeath(deathScene.dgroup, deathScene.plane0, 10, 10, { difficulty: 2 });
  deathScene.dgroup.setU16(death.actor + OBJ_CLASS_OFFSET, DEATHOBJ);
  deathScene.dgroup.setU32(death.actor + OBJ_X_OFFSET, 10 * TILEGLOBAL);
  deathScene.dgroup.setU32(death.actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL);
  deathScene.dgroup.setU16(death.actor + OBJ_TILEX_OFFSET, 10);
  deathScene.dgroup.setU16(death.actor + OBJ_TILEY_OFFSET, 10);
  const hrocket = mod.WL_ACT2_T_Launch(deathScene.dgroup, death.actor, { stateName: "_s_deathshoot2" });
  if (hrocket.obclass !== HROCKETOBJ || hrocket.angle !== 349 || hrocket.shoot === null) {
    fail(`T_Launch death rocket diverged: ${JSON.stringify(hrocket)}`);
  }

  const willScene = makeScene(14, 10);
  const will = mod.WL_ACT2_SpawnWill(willScene.dgroup, willScene.plane0, 10, 10, { difficulty: 2 });
  willScene.dgroup.setU16(will.actor + OBJ_CLASS_OFFSET, WILLOBJ);
  willScene.dgroup.setU32(will.actor + OBJ_SPEED_OFFSET, 512);
  willScene.dgroup.setU32(will.actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  willScene.dgroup.setU16(will.actor + OBJ_DIR_OFFSET, NODIR);
  mod.US_InitRndT(true, 82);
  const willStep = mod.WL_ACT2_T_Will(willScene.dgroup, willScene.plane0, will.actor, { tics: 1 });
  if (!willStep.attacked || willStep.state !== "_s_willshoot1") {
    fail(`T_Will did not enter attack state with a clear line: ${JSON.stringify(willStep)}`);
  }

  const deathCamScene = makeScene(20, 20);
  const boss = mod.WL_ACT2_SpawnDeath(deathCamScene.dgroup, deathCamScene.plane0, 10, 10, { difficulty: 2 });
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  deathCamScene.dgroup.setU32(gamestate + gamestateFieldOffset("killx"), 18 * TILEGLOBAL);
  deathCamScene.dgroup.setU32(gamestate + gamestateFieldOffset("killy"), 18 * TILEGLOBAL);
  const cam = mod.WL_ACT2_A_StartDeathCam(deathCamScene.dgroup, boss.actor);
  if (cam.victorious || cam.angle < 0 || deathCamScene.dgroup.u16(gamestate + gamestateFieldOffset("victoryflag")) !== 1) {
    fail(`A_StartDeathCam did not seed victory camera state: ${JSON.stringify(cam)}`);
  }

  return {
    spawns: [angel.which, uber.which],
    dormant: dormant.awakened,
    launch: [spark.obclass, hrocket.angle],
    will: willStep.state,
    deathcam: cam.victorious === false,
  };
}

function checkRuntimeSoundLoc(mod) {
  const TILEGLOBAL = 1 << 16;
  const dgroup = new mod.DOSMemory(0x10000);
  const context = {
    viewx: 10 * TILEGLOBAL,
    viewy: 10 * TILEGLOBAL,
    viewsin: 0,
    viewcos: 0xffff,
  };

  const loc = mod.WL_GAME_SetSoundLoc(dgroup, 12 * TILEGLOBAL, 12 * TILEGLOBAL, context);
  if (loc.x !== 1 || loc.y !== 1 || loc.leftchannel !== 4 || loc.rightchannel !== 0) {
    fail(`WL_GAME_SetSoundLoc table lookup mismatch: ${JSON.stringify(loc)}`);
  }

  const clamped = mod.WL_GAME_SetSoundLoc(dgroup, 100 * TILEGLOBAL, -100 * TILEGLOBAL, context);
  if (clamped.x !== 14 || clamped.y !== -15 || clamped.leftchannel !== 8 || clamped.rightchannel !== 8) {
    fail(`WL_GAME_SetSoundLoc did not clamp table coordinates: ${JSON.stringify(clamped)}`);
  }

  const played = mod.WL_GAME_PlaySoundLocGlobal(dgroup, 37, 12 * TILEGLOBAL, 12 * TILEGLOBAL, context);
  if (
    !played.positioned ||
    !played.played ||
    played.sound !== 37 ||
    played.globalsoundx !== 12 * TILEGLOBAL ||
    played.globalsoundy !== 12 * TILEGLOBAL ||
    played.leftchannel !== 4 ||
    played.rightchannel !== 0
  ) {
    fail(`WL_GAME_PlaySoundLocGlobal did not store positioned sound state: ${JSON.stringify(played)}`);
  }

  const shifted = {
    ...context,
    viewx: 11 * TILEGLOBAL,
  };
  const updated = mod.WL_GAME_UpdateSoundLoc(dgroup, shifted);
  if (
    !updated.updated ||
    updated.globalsoundx !== 12 * TILEGLOBAL ||
    updated.globalsoundy !== 12 * TILEGLOBAL ||
    updated.leftchannel !== 6 ||
    updated.rightchannel !== 0
  ) {
    fail(`WL_GAME_UpdateSoundLoc did not recompute the active positioned sound: ${JSON.stringify(updated)}`);
  }

  const silent = mod.WL_GAME_UpdateSoundLoc(new mod.DOSMemory(0x10000), context);
  if (silent.updated || silent.leftchannel !== 0 || silent.rightchannel !== 0) {
    fail(`WL_GAME_UpdateSoundLoc should be inert when no sound is positioned: ${JSON.stringify(silent)}`);
  }

  const missed = mod.WL_GAME_PlaySoundLocGlobal(
    new mod.DOSMemory(0x10000),
    38,
    12 * TILEGLOBAL,
    12 * TILEGLOBAL,
    context,
    { soundPlayed: false },
  );
  if (missed.played || missed.globalsoundx !== 0 || missed.globalsoundy !== 0) {
    fail(`WL_GAME_PlaySoundLocGlobal stored globals for a sound that did not play: ${JSON.stringify(missed)}`);
  }

  return {
    direct: [loc.leftchannel, loc.rightchannel],
    clamped: [clamped.x, clamped.y],
    updated: [updated.leftchannel, updated.rightchannel],
    missedPlayed: missed.played,
  };
}

function checkRuntimeWindowState(mod) {
  const direct = mod.ID_US_US_DrawWindow(1, 2, 3, 4);
  if (
    direct.windowX !== 8 ||
    direct.windowY !== 16 ||
    direct.windowW !== 24 ||
    direct.windowH !== 32 ||
    direct.printX !== 8 ||
    direct.printY !== 16 ||
    direct.frameX !== 0 ||
    direct.frameY !== 8 ||
    direct.frameW !== 32 ||
    direct.frameH !== 40 ||
    mod.ID_US_WindowX !== 8 ||
    mod.ID_US_PrintY !== 16
  ) {
    fail(`US_DrawWindow did not mirror window globals and frame math: ${JSON.stringify(direct)}`);
  }

  const clear = mod.ID_US_US_ClearWindow();
  if (clear.printX !== direct.windowX || clear.printY !== direct.windowY) {
    fail(`US_ClearWindow did not home the print cursor: ${JSON.stringify(clear)}`);
  }

  const centered = mod.ID_US_US_CenterWindow(30, 3);
  if (
    centered.x !== 5 ||
    centered.y !== 11 ||
    centered.windowX !== 40 ||
    centered.windowY !== 88 ||
    centered.windowW !== 240 ||
    centered.windowH !== 24
  ) {
    fail(`US_CenterWindow did not use 320x200 centering: ${JSON.stringify(centered)}`);
  }

  const play = mod.WL_PLAY_CenterWindow(8, 1);
  if (
    !play.fixOfs ||
    play.x !== 16 ||
    play.y !== 9 ||
    play.windowX !== 128 ||
    play.windowY !== 72 ||
    play.windowW !== 64 ||
    play.windowH !== 8 ||
    mod.ID_US_WindowX !== 128 ||
    mod.ID_US_WindowY !== 72
  ) {
    fail(`WL_PLAY_CenterWindow did not use 320x160 playfield centering: ${JSON.stringify(play)}`);
  }

  const saved = {};
  const savedResult = mod.ID_US_US_SaveWindow(saved);
  if (
    savedResult !== saved ||
    saved.x !== 128 ||
    saved.y !== 72 ||
    saved.w !== 64 ||
    saved.h !== 8 ||
    saved.px !== 128 ||
    saved.py !== 72
  ) {
    fail(`US_SaveWindow did not copy the active window record: ${JSON.stringify(saved)}`);
  }

  mod.ID_US_US_DrawWindow(2, 3, 4, 5);
  const restored = mod.ID_US_US_RestoreWindow(saved);
  if (
    restored.windowX !== 128 ||
    restored.windowY !== 72 ||
    restored.windowW !== 64 ||
    restored.windowH !== 8 ||
    restored.printX !== 128 ||
    restored.printY !== 72 ||
    mod.ID_US_WindowW !== 64 ||
    mod.ID_US_PrintX !== 128
  ) {
    fail(`US_RestoreWindow did not restore saved globals: ${JSON.stringify(restored)}`);
  }

  const parmStrings = ["TEDLEVEL", "NOWAIT", ""];
  const punctuation = mod.ID_US_US_CheckParm("-nowait", parmStrings);
  const mixedCase = mod.ID_US_US_CheckParm("/TeDlEvEl", parmStrings);
  const prefix = mod.ID_US_US_CheckParm("NOWAIT-extra", parmStrings);
  const missing = mod.ID_US_US_CheckParm("unknown", parmStrings);
  if (punctuation !== 1 || mixedCase !== 0 || prefix !== 1 || missing !== -1) {
    fail(`US_CheckParm did not match the original case-insensitive table scan: ${JSON.stringify({ punctuation, mixedCase, prefix, missing })}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0);
  const font = new Uint8Array(2 + 256 * 2 + 256 + 256 * 4);
  const fontLocationOffset = 2;
  const fontWidthOffset = fontLocationOffset + 256 * 2;
  const fontDataOffset = fontWidthOffset + 256;
  font[0] = 4;
  for (let ch = 1; ch < 256; ch++) {
    const location = fontDataOffset + ch * 4;
    font[fontLocationOffset + ch * 2] = location & 0xff;
    font[fontLocationOffset + ch * 2 + 1] = location >> 8;
    font[fontWidthOffset + ch] = 1;
    font.fill(1, location, location + 4);
  }
  mod.ID_US_US_SetPrintRoutines(
    (text) => mod.ID_VH_VW_MeasurePropString(text, { font }),
    (text) => mod.ID_VH_VW_DrawPropString(text, { font }),
  );
  mod.ID_US_US_DrawWindow(1, 1, 10, 5);
  mod.ID_VH_VW_SetFontState({ fontcolor: 0x2a });
  const printed = mod.ID_US_US_Print("AB\nC");
  const centeredLine = mod.ID_US_US_CPrintLine("AB");
  const centeredBlock = mod.ID_US_US_CPrint("A\n\nB\n");
  const centeredPrint = mod.ID_US_US_PrintCentered("AB");
  const inRect = mod.ID_US_USL_PrintInCenter("AB", { ul: { x: 10, y: 20 }, lr: { x: 30, y: 32 } });
  const unsignedPrint = mod.ID_US_US_PrintUnsigned(0xffffffff);
  const signedPrint = mod.ID_US_US_PrintSigned(-45);
  if (
    printed.segments.length !== 2 ||
    printed.segments[0].x !== 8 ||
    printed.segments[0].y !== 8 ||
    printed.segments[0].width !== 2 ||
    printed.segments[1].x !== 8 ||
    printed.segments[1].y !== 12 ||
    printed.printX !== 9 ||
    printed.printY !== 12 ||
    centeredLine.x !== 47 ||
    centeredLine.y !== 12 ||
    mod.ID_US_PrintY !== 28 ||
    centeredBlock.segments.length !== 3 ||
    centeredBlock.segments[1].text !== "" ||
    centeredBlock.printY !== 28 ||
    centeredPrint.x !== 47 ||
    centeredPrint.y !== 26 ||
    inRect.x !== 19 ||
    inRect.y !== 24 ||
    unsignedPrint.segments[0].text !== "4294967295" ||
    unsignedPrint.printX !== 19 ||
    signedPrint.segments[0].text !== "-45" ||
    signedPrint.printX !== 22 ||
    mod.ID_VH_px !== 22
  ) {
    fail(`ID_US print routines did not preserve window cursor and centered text behavior: ${JSON.stringify({
      printed,
      centeredLine,
      centeredBlock,
      centeredPrint,
      inRect,
      unsignedPrint,
      signedPrint,
      printX: mod.ID_US_PrintX,
      printY: mod.ID_US_PrintY,
      fontState: mod.ID_VH_VW_DebugFontState(),
    })}`);
  }

  mod.ID_US_US_Shutdown();
  const startup = mod.ID_US_US_Startup(["WOLF3D", "COMP", "TEDLEVEL", "7", "NOWAIT"], 82);
  const startupAgain = mod.ID_US_US_Startup(["WOLF3D", "NOCOMP"]);
  const shutdown = mod.ID_US_US_Shutdown();
  mod.US_InitRndT(false);
  if (
    !startup.started ||
    startup.alreadyStarted ||
    !startup.rndInitialized ||
    !startup.compatability ||
    !startup.tedlevel ||
    startup.tedlevelnum !== 7 ||
    !startup.NoWait ||
    !startupAgain.alreadyStarted ||
    startupAgain.rndInitialized ||
    !shutdown.wasStarted ||
    shutdown.started ||
    mod.ID_US_US_Started
  ) {
    fail(`US_Startup/US_Shutdown did not mirror startup flag and parm parsing: ${JSON.stringify({
      startup,
      startupAgain,
      shutdown,
      globals: {
        compatability: mod.ID_US_compatability,
        tedlevel: mod.ID_US_tedlevel,
        tedlevelnum: mod.ID_US_tedlevelnum,
        NoWait: mod.ID_US_NoWait,
        started: mod.ID_US_US_Started,
      },
    })}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_US_US_DrawWindow(1, 1, 10, 5);
  const finishSignon = mod.WL_MAIN_FinishSignon({ screenColor: 0x5c });
  const stripOffset = mod.ID_VL_ylookup[199] + (299 >> 2);
  if (
    finishSignon.clearPrompt.pixels !== 3300 ||
    finishSignon.clearPrompt.color !== 0x5c ||
    finishSignon.promptWindow.windowX !== 0 ||
    finishSignon.promptWindow.windowW !== 320 ||
    finishSignon.promptWindow.printY !== 190 ||
    finishSignon.promptColor.fontcolor !== 14 ||
    finishSignon.promptColor.backcolor !== 4 ||
    finishSignon.prompt.segments[0]?.text !== "Press a key" ||
    finishSignon.prompt.segments[0]?.x !== 154 ||
    finishSignon.noWait !== true ||
    finishSignon.ack !== null ||
    finishSignon.clearWorking.pixels !== 3300 ||
    finishSignon.workingWindow.printY !== 190 ||
    finishSignon.workingColor.fontcolor !== 10 ||
    finishSignon.working.segments[0]?.text !== "Working..." ||
    finishSignon.working.segments[0]?.x !== 155 ||
    finishSignon.finalColor.fontcolor !== 0 ||
    finishSignon.finalColor.backcolor !== 15 ||
    mod.ID_US_WindowX !== 0 ||
    mod.ID_US_WindowW !== 320 ||
    mod.ID_US_PrintY !== 194 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + stripOffset] !== 0x5c
  ) {
    fail(`WL_MAIN_FinishSignon did not mirror the WL6 signon prompt/working strip: ${JSON.stringify({
      finishSignon,
      globals: {
        windowX: mod.ID_US_WindowX,
        windowW: mod.ID_US_WindowW,
        printY: mod.ID_US_PrintY,
        strip: mod.ID_VL_videoPlanes[3 * 0x10000 + stripOffset],
      },
    })}`);
  }

  mod.ID_US_US_DrawWindow(1, 1, 10, 5);
  const hardRetry = mod.ID_US_USL_HardError(0, 0, 0, 1, { response: "retry", screenMode: 0x13 });
  const hardAbort = mod.ID_US_USL_HardError(0, 1, 0, 0, {
    response: "abort",
    screenMode: 3,
    shutdown: () => "shutdown",
  });
  if (
    hardRetry.result !== 1 ||
    hardRetry.message !== "Error on Drive A" ||
    hardRetry.center?.windowW !== 240 ||
    hardRetry.lines[0]?.text !== "Error on Drive A" ||
    hardRetry.lines[1]?.text !== "(R)etry or (A)bort?" ||
    hardRetry.restored?.windowX !== 8 ||
    hardAbort.result !== 2 ||
    hardAbort.message !== "Drive B is Write Protected" ||
    hardAbort.shutdown !== "shutdown" ||
    mod.ID_US_abortprogram !== "Drive B is Write Protected"
  ) {
    fail(`USL_HardError did not mirror retry/abort hard-error handling: ${JSON.stringify({
      hardRetry,
      hardAbort,
      abortprogram: mod.ID_US_abortprogram,
    })}`);
  }

  const cursor = mod.ID_US_USL_XORICursor(10, 20, "AB", 1);
  const lineBuffer = { value: "" };
  const lineInput = mod.ID_US_US_LineInput(20, 30, lineBuffer, "AX", true, 5, 10, {
    events: [
      { scan: mod.ID_IN_sc_LeftArrow },
      { ascii: "B" },
      { scan: mod.ID_IN_sc_End },
      { scan: mod.ID_IN_sc_BackSpace },
      { ascii: "Z" },
      { scan: mod.ID_IN_sc_Enter },
    ],
  });
  const cancelBuffer = { value: "keep" };
  const lineCancel = mod.ID_US_US_LineInput(20, 30, cancelBuffer, "NO", true, 0, 0, {
    events: [{ scan: mod.ID_IN_sc_Escape }],
  });
  if (
    cursor.drawX !== 10 ||
    cursor.drawY !== 20 ||
    cursor.width !== 1 ||
    cursor.cursor !== 1 ||
    !lineInput.result ||
    lineInput.final !== "ABZ" ||
    lineBuffer.value !== "ABZ" ||
    lineInput.steps.length !== 6 ||
    lineInput.steps[1]?.text !== "ABX" ||
    lineInput.steps[3]?.text !== "AB" ||
    lineInput.steps[5]?.accepted !== true ||
    lineInput.buffer !== "ABZ" ||
    lineCancel.result ||
    lineCancel.final !== "NO" ||
    lineCancel.steps[0]?.accepted !== false ||
    cancelBuffer.value !== "keep" ||
    lineCancel.buffer !== null
  ) {
    fail(`US_LineInput/USL_XORICursor did not mirror scripted edit and cancel flow: ${JSON.stringify({
      cursor,
      lineInput,
      lineBuffer,
      lineCancel,
      cancelBuffer,
    })}`);
  }

  return {
    draw: [direct.windowX, direct.windowY, direct.windowW, direct.windowH],
    center: [centered.x, centered.y],
    play: [play.x, play.y],
    restored: [restored.windowX, restored.windowY],
    parms: [punctuation, mixedCase, prefix, missing],
    print: [printed.printX, centeredBlock.printY, centeredPrint.x, signedPrint.printX],
    startup: [startup.tedlevelnum, startup.NoWait ? 1 : 0, startupAgain.alreadyStarted ? 1 : 0],
    finishSignon: [
      finishSignon.prompt.segments[0]?.x,
      finishSignon.working.segments[0]?.x,
      finishSignon.finalColor.backcolor,
    ],
    lineInput: [lineInput.final.length, lineInput.cursor, lineCancel.result ? 1 : 0],
  };
}

function checkRuntimeVgaPalette(mod) {
  mod.ID_VL_VL_ResetVideoState();
  const startup = mod.ID_VL_VL_Startup();
  if (!mod.ID_VL_vlStarted || startup.videoMode !== 3) {
    fail(`VL_Startup did not mark the video layer started in text mode: ${JSON.stringify(startup)}`);
  }

  const planeMode = mod.ID_VL_VL_SetVGAPlaneMode();
  if (
    planeMode.videoMode !== 0x13 ||
    !planeMode.vgaPlaneMode ||
    !planeMode.deplaned ||
    planeMode.mapmask !== 15 ||
    planeMode.linewidth !== 80 ||
    mod.ID_VL_videoPlanes[0x3ffff] !== 0
  ) {
    fail(`VL_SetVGAPlaneMode did not model Mode X planar setup: ${JSON.stringify(planeMode)}`);
  }

  const signonIntro = new Uint8Array(320 * 200);
  for (let i = 0; i < signonIntro.length; i++) {
    signonIntro[i] = i & 0xff;
  }
  const signonPalette = new Uint8Array(768);
  for (let i = 0; i < signonPalette.length; i++) {
    signonPalette[i] = i & 0xff;
  }
  const signonScreen = mod.WL_MAIN_SignonScreen({
    intro: signonIntro,
    palette: signonPalette,
    introSegment: 0x1234,
    introOffset: 5,
    virtualReality: false,
  });
  const signonPlane0 = mod.ID_VL_videoPlanes[0];
  const signonPlane1 = mod.ID_VL_videoPlanes[0x10000];
  const virtualSignon = mod.WL_MAIN_SignonScreen({
    palette: signonPalette,
    virtualReality: true,
    introSegment: 0x2222,
  });
  if (
    signonScreen.planeMode.videoMode !== 0x13 ||
    !signonScreen.paletteTest ||
    signonScreen.palette.lastColor.blue !== 255 ||
    signonScreen.virtualreality ||
    signonScreen.hiddenScreen?.displayofs !== 0x8000 ||
    signonScreen.munge?.bytes !== 64000 ||
    signonScreen.munge?.first !== 0 ||
    signonScreen.munge?.last !== 255 ||
    signonScreen.blit?.bytes !== 64000 ||
    signonScreen.visibleScreen?.displayofs !== 0 ||
    signonScreen.reclaimSegment !== 0x1235 ||
    signonScreen.reclaimLength !== 3999 ||
    signonPlane0 !== 0 ||
    signonPlane1 !== 1 ||
    !virtualSignon.virtualreality ||
    virtualSignon.hiddenScreen !== null ||
    virtualSignon.blit !== null ||
    virtualSignon.reclaimSegment !== 0x2222 ||
    virtualSignon.reclaimLength !== 4000
  ) {
    fail(`WL_MAIN_SignonScreen did not follow the VGA setup, signon blit, and reclaim sequence: ${JSON.stringify({
      signonScreen,
      virtualSignon,
      plane0: signonPlane0,
      plane1: signonPlane1,
    })}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_Startup();
  mod.ID_VL_VL_SetVGAPlaneMode();

  const split = mod.ID_VL_VL_SetSplitScreen(80);
  if (
    split.registerLine !== 159 ||
    split.lineCompareLow !== 159 ||
    split.overflow !== 1 ||
    mod.ID_VL_splitScreenLine !== 159
  ) {
    fail(`VL_SetSplitScreen did not mirror linecompare register math: ${JSON.stringify(split)}`);
  }

  const fill = mod.ID_VL_VL_FillPalette(1, 2, 3);
  if (
    fill.firstColor.red !== 1 ||
    fill.firstColor.green !== 2 ||
    fill.firstColor.blue !== 3 ||
    fill.lastColor.red !== 1 ||
    fill.lastColor.green !== 2 ||
    fill.lastColor.blue !== 3 ||
    fill.checksum !== (1 + 2 + 3) * 256
  ) {
    fail(`VL_FillPalette did not write all 256 colors: ${JSON.stringify(fill)}`);
  }

  const color = mod.ID_VL_VL_SetColor(17, 64, 65, 255);
  const readColor = mod.ID_VL_VL_GetColor(17);
  if (
    color.red !== 64 ||
    color.green !== 65 ||
    color.blue !== 255 ||
    readColor.red !== 64 ||
    readColor.green !== 65 ||
    readColor.blue !== 255 ||
    mod.ID_VL_currentPalette[17 * 3 + 2] !== 255
  ) {
    fail(`VL_SetColor/VL_GetColor did not round-trip color 17: ${JSON.stringify({ color, readColor })}`);
  }

  const copied = mod.ID_VL_VL_GetPalette();
  if (copied.length !== 768 || copied[0] !== 1 || copied[17 * 3] !== 64 || copied[17 * 3 + 2] !== 255) {
    fail("VL_GetPalette did not return a 768-byte palette copy");
  }

  const generated = new Uint8Array(768);
  for (let i = 0; i < generated.length; i++) {
    generated[i] = i & 0xff;
  }
  const set = mod.ID_VL_VL_SetPalette(generated);
  if (
    set.firstColor.red !== 0 ||
    set.firstColor.green !== 1 ||
    set.firstColor.blue !== 2 ||
    set.lastColor.red !== 253 ||
    set.lastColor.green !== 254 ||
    set.lastColor.blue !== 255 ||
    mod.ID_VL_screenfaded
  ) {
    fail(`VL_SetPalette did not copy the full 768-byte palette: ${JSON.stringify(set)}`);
  }

  const fadeOut = mod.ID_VL_VL_FadeOut(1, 2, 10, 20, 30, 4);
  if (
    !fadeOut.screenfaded ||
    fadeOut.checksum !== (10 + 20 + 30) * 256 ||
    fadeOut.firstColor.red !== 10 ||
    fadeOut.lastColor.blue !== 30 ||
    mod.ID_VL_palette1[3] !== 3 ||
    mod.ID_VL_palette2[3] !== 8 ||
    mod.ID_VL_palette2[4] !== 16 ||
    mod.ID_VL_palette2[5] !== 23
  ) {
    fail(`VL_FadeOut did not match original integer fade math: ${JSON.stringify(fadeOut)}`);
  }

  const fadeIn = mod.ID_VL_VL_FadeIn(1, 2, generated, 4);
  if (
    fadeIn.screenfaded ||
    fadeIn.checksum !== generated.reduce((sum, value) => (sum + value) >>> 0, 0) ||
    mod.ID_VL_currentPalette[3] !== 3 ||
    mod.ID_VL_currentPalette[8] !== 8 ||
    mod.ID_VL_palette1[3] !== 10 ||
    mod.ID_VL_palette2[3] !== 5 ||
    mod.ID_VL_palette2[4] !== 8 ||
    mod.ID_VL_palette2[5] !== 12
  ) {
    fail(`VL_FadeIn did not restore the target palette with C-style truncation: ${JSON.stringify(fadeIn)}`);
  }

  const border = mod.ID_VL_VL_ColorBorder(0x12f);
  if (border !== 0x2f || mod.ID_VL_bordercolor !== 0x2f) {
    fail(`VL_ColorBorder did not store an 8-bit border color: ${border}`);
  }

  const lineWidth = mod.ID_VL_VL_SetLineWidth(40);
  if (
    lineWidth.linewidth !== 80 ||
    lineWidth.lastOffset !== 15920 ||
    mod.ID_VL_linewidth !== 80 ||
    mod.ID_VL_ylookup[0] !== 0 ||
    mod.ID_VL_ylookup[1] !== 80 ||
    mod.ID_VL_ylookup[199] !== 15920
  ) {
    fail(`VL_SetLineWidth did not populate Mode X scanline offsets: ${JSON.stringify(lineWidth)}`);
  }

  const clearVideo = mod.ID_VL_VL_ClearVideo(7);
  if (
    clearVideo.pixels !== 0x40000 ||
    mod.ID_VL_videoPlanes[0] !== 7 ||
    mod.ID_VL_videoPlanes[0x10000] !== 7 ||
    mod.ID_VL_videoPlanes[0x3ffff] !== 7
  ) {
    fail(`VL_ClearVideo did not fill all four VGA planes: ${JSON.stringify(clearVideo)}`);
  }

  const plot = mod.ID_VL_VL_Plot(5, 10, 9);
  if (plot.plane !== 1 || plot.offset !== 801 || mod.ID_VL_videoPlanes[0x10000 + 801] !== 9) {
    fail(`VL_Plot did not write the expected planar byte: ${JSON.stringify(plot)}`);
  }

  mod.ID_VL_VL_Hlin(2, 11, 5, 8);
  if (mod.ID_VL_videoPlanes[2 * 0x10000 + 880] !== 8 || mod.ID_VL_videoPlanes[881] !== 8) {
    fail("VL_Hlin did not cover the expected plane/byte span");
  }

  mod.ID_VL_VL_Vlin(7, 12, 3, 6);
  if (mod.ID_VL_videoPlanes[3 * 0x10000 + 961] !== 6 || mod.ID_VL_videoPlanes[3 * 0x10000 + 1121] !== 6) {
    fail("VL_Vlin did not step by linewidth through one plane");
  }

  const bar = mod.ID_VL_VL_Bar(8, 15, 4, 2, 5);
  if (
    bar.pixels !== 8 ||
    mod.ID_VL_videoPlanes[1202] !== 5 ||
    mod.ID_VL_videoPlanes[0x10000 + 1202] !== 5 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 1282] !== 5 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 1282] !== 5
  ) {
    fail(`VL_Bar did not fill the expected planar rectangle: ${JSON.stringify(bar)}`);
  }

  const planarSource = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0xa0 + index));
  const memCopy = mod.ID_VL_VL_MemToScreen(planarSource, 8, 2, 4, 20);
  if (
    memCopy.bytes !== 16 ||
    mod.ID_VL_videoPlanes[1601] !== 0xa0 ||
    mod.ID_VL_videoPlanes[1682] !== 0xa3 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 1601] !== 0xac ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 1682] !== 0xaf
  ) {
    fail(`VL_MemToScreen did not copy planar source blocks with x-plane rotation: ${JSON.stringify(memCopy)}`);
  }

  const screenCopy = mod.ID_VL_VL_ScreenToScreen(1601, 2000, 2, 2);
  if (
    screenCopy.bytes !== 16 ||
    mod.ID_VL_videoPlanes[2000] !== 0xa0 ||
    mod.ID_VL_videoPlanes[2081] !== 0xa3 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2000] !== 0xac ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2081] !== 0xaf
  ) {
    fail(`VL_ScreenToScreen did not copy planar bytes row-by-row: ${JSON.stringify(screenCopy)}`);
  }

  const latchSource = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0xb0 + index));
  const latch = mod.ID_VL_VL_MemToLatch(latchSource, 8, 2, 0x3500);
  if (
    latch.bytes !== 16 ||
    mod.ID_VL_videoPlanes[0x3500] !== 0xb0 ||
    mod.ID_VL_videoPlanes[0x3503] !== 0xb3 ||
    mod.ID_VL_videoPlanes[0x10000 + 0x3500] !== 0xb4 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 0x3503] !== 0xbf
  ) {
    fail(`VL_MemToLatch did not store each source plane contiguously: ${JSON.stringify(latch)}`);
  }

  const latchCopy = mod.ID_VL_VL_LatchToScreen(0x3500, 2, 2, 8, 25);
  if (
    latchCopy.bytes !== 16 ||
    mod.ID_VL_videoPlanes[2002] !== 0xb0 ||
    mod.ID_VL_videoPlanes[2083] !== 0xb3 ||
    mod.ID_VL_videoPlanes[0x10000 + 2002] !== 0xb4 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2083] !== 0xbf
  ) {
    fail(`VL_LatchToScreen did not copy latched plane bytes to the active buffer: ${JSON.stringify(latchCopy)}`);
  }

  const tileGlyphs = new Uint8Array(3 * 64);
  for (let i = 0; i < 64; i++) {
    tileGlyphs[64 + i] = 0x10 + i;
    tileGlyphs[128 + i] = 0x50 + i;
  }
  const tileString = mod.ID_VL_VL_DrawTile8String("\x01\x02\x00Z", tileGlyphs, 16, 27);
  const tileStringSize = mod.ID_VL_VL_SizeTile8String("\x01\x02\x00Z");
  if (
    tileString.chars !== 2 ||
    tileString.bytes !== 128 ||
    tileStringSize.width !== 16 ||
    tileStringSize.height !== 8 ||
    mod.ID_VL_mapmask !== 8 ||
    mod.ID_VL_videoPlanes[2164] !== 0x10 ||
    mod.ID_VL_videoPlanes[2165] !== 0x11 ||
    mod.ID_VL_videoPlanes[2724] !== 0x1e ||
    mod.ID_VL_videoPlanes[0x10000 + 2164] !== 0x20 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2726] !== 0x8e
  ) {
    fail(`VL_DrawTile8String/VL_SizeTile8String did not match 8x8 tile string layout: ${JSON.stringify({ tileString, tileStringSize })}`);
  }

  const latchBase = 0x3600;
  const latchChar = latchBase + 16;
  for (let plane = 0; plane < 4; plane++) {
    for (let row = 0; row < 8; row++) {
      const value = 0x20 + plane * 0x20 + row * 2;
      const source = plane * 0x10000 + latchChar + row * 2;
      mod.ID_VL_videoPlanes[source] = value;
      mod.ID_VL_videoPlanes[source + 1] = value + 1;
    }
  }
  const latchString = mod.ID_VL_VL_DrawLatch8String("\x01", latchBase, 24, 28);
  if (
    latchString.chars !== 1 ||
    latchString.bytes !== 64 ||
    mod.ID_VL_mapmask !== 15 ||
    mod.ID_VL_videoPlanes[2246] !== 0x20 ||
    mod.ID_VL_videoPlanes[2247] !== 0x21 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 2486] !== 0x66 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2806] !== 0x8e
  ) {
    fail(`VL_DrawLatch8String did not copy 16 latch bytes per character across planes: ${JSON.stringify(latchString)}`);
  }

  const maskedSource = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0xc0 + index));
  const maskedCopy = mod.ID_VL_VL_MaskedToScreen(maskedSource, 8, 1, 12, 26);
  if (
    maskedCopy.bytes !== 8 ||
    mod.ID_VL_videoPlanes[2083] !== 0xc0 ||
    mod.ID_VL_videoPlanes[0x10000 + 2083] !== 0xc2 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 2083] !== 0xc4 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2083] !== 0xc6
  ) {
    fail(`VL_MaskedToScreen did not mirror the source planar copy path: ${JSON.stringify(maskedCopy)}`);
  }

  const mungeInput = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => index));
  const expectedMunge = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
  const vhMunged = Array.from(mod.ID_VH_VL_MungePic(mungeInput.slice(), 8, 2).subarray(0, 16));
  const standaloneMunged = Array.from(mod.MUNGE_VL_MungePic(mungeInput.slice(), 8, 2).subarray(0, 16));
  if (JSON.stringify(vhMunged) !== JSON.stringify(expectedMunge) || JSON.stringify(standaloneMunged) !== JSON.stringify(expectedMunge)) {
    fail(`VL_MungePic did not convert chunky pixels to plane-major bytes: ${JSON.stringify({ vhMunged, standaloneMunged })}`);
  }
  let mungeWidthError = false;
  try {
    mod.ID_VH_VL_MungePic(new Uint8Array(10), 5, 2);
  } catch (error) {
    mungeWidthError = error instanceof Error && /Not divisable by 4/.test(error.message);
  }
  if (!mungeWidthError) {
    fail("VL_MungePic accepted a width that is not divisible by 4");
  }

  function setPlanePixel(page, x, y, color) {
    mod.ID_VL_videoPlanes[(x & 3) * 0x10000 + page + y * 80 + (x >> 2)] = color & 0xff;
  }

  function getPlanePixel(page, x, y) {
    return mod.ID_VL_videoPlanes[(x & 3) * 0x10000 + page + y * 80 + (x >> 2)];
  }

  const fizzleSource = 0x4000;
  const fizzleDest = 0x6000;
  for (let y = 0; y <= 7; y++) {
    for (let x = 0; x <= 15; x++) {
      setPlanePixel(fizzleSource, x, y, 0x40 + y * 16 + x);
      setPlanePixel(fizzleDest, x, y, 0xee);
    }
  }
  const fizzleAborted = mod.ID_VH_FizzleFade(fizzleSource, fizzleDest, 15, 7, 70, false);
  const fizzle = mod.ID_VH_lastFizzleFade;
  let fizzleMismatches = 0;
  for (let y = 0; y <= 7; y++) {
    for (let x = 0; x <= 15; x++) {
      if (getPlanePixel(fizzleDest, x, y) !== getPlanePixel(fizzleSource, x, y)) {
        fizzleMismatches++;
      }
    }
  }
  if (
    fizzleAborted ||
    fizzle?.source !== fizzleSource ||
    fizzle.dest !== fizzleDest ||
    fizzle.pixperframe !== 914 ||
    fizzle.copied !== 128 ||
    fizzle.finalRnd !== 1 ||
    fizzleMismatches !== 0
  ) {
    fail(`ID_VH_FizzleFade did not complete the deterministic LFSR pixel copy: ${JSON.stringify({ fizzle, fizzleMismatches })}`);
  }

  mod.ID_VH_update.fill(0);
  const mark = mod.ID_VH_VW_MarkUpdateBlock(-4, 0, 40, 20);
  if (
    !mark.marked ||
    mark.xt1 !== 0 ||
    mark.yt1 !== 0 ||
    mark.xt2 !== 2 ||
    mark.yt2 !== 1 ||
    mod.ID_VH_update[0] !== 1 ||
    mod.ID_VH_update[22] !== 1
  ) {
    fail(`VW_MarkUpdateBlock did not mark clamped 16-pixel update blocks: ${JSON.stringify(mark)}`);
  }

  const offscreen = mod.ID_VH_VW_MarkUpdateBlock(400, 0, 420, 8);
  if (offscreen.marked) {
    fail(`VW_MarkUpdateBlock should reject fully offscreen x ranges: ${JSON.stringify(offscreen)}`);
  }

  const bufferedPlot = mod.ID_VH_VWB_Plot(9, 30, 0x33);
  if (
    !bufferedPlot.mark.marked ||
    bufferedPlot.draw?.plane !== 1 ||
    bufferedPlot.draw.offset !== 2402 ||
    mod.ID_VL_videoPlanes[0x10000 + 2402] !== 0x33
  ) {
    fail(`VWB_Plot did not mark and delegate to VL_Plot: ${JSON.stringify(bufferedPlot)}`);
  }

  const bufferedHlin = mod.ID_VH_VWB_Hlin(12, 15, 31, 0x44);
  if (bufferedHlin.draw?.pixels !== 4 || mod.ID_VL_videoPlanes[3 * 0x10000 + 2483] !== 0x44) {
    fail(`VWB_Hlin did not delegate inclusive x span to VL_Hlin: ${JSON.stringify(bufferedHlin)}`);
  }

  const bufferedVlin = mod.ID_VH_VWB_Vlin(32, 34, 16, 0x55);
  if (bufferedVlin.draw?.pixels !== 3 || mod.ID_VL_videoPlanes[2564] !== 0x55 || mod.ID_VL_videoPlanes[2724] !== 0x55) {
    fail(`VWB_Vlin did not delegate inclusive y span to VL_Vlin: ${JSON.stringify(bufferedVlin)}`);
  }

  const bufferedBar = mod.ID_VH_VWB_Bar(20, 36, 4, 2, 0x66);
  if (bufferedBar.draw?.pixels !== 8 || mod.ID_VL_videoPlanes[2885] !== 0x66 || mod.ID_VL_videoPlanes[3 * 0x10000 + 2965] !== 0x66) {
    fail(`VWB_Bar did not mark and delegate to VL_Bar: ${JSON.stringify(bufferedBar)}`);
  }

  function planePixel(x, y, page = 0) {
    return mod.ID_VL_videoPlanes[(x & 3) * 0x10000 + page + y * 80 + (x >> 2)];
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MAIN_SetViewSize(256, 128);
  const playBorder = mod.WL_GAME_DrawPlayBorder();
  if (
    playBorder.xl !== 32 ||
    playBorder.yl !== 16 ||
    playBorder.background.draw?.pixels !== 51200 ||
    playBorder.viewport.draw?.pixels !== 32768 ||
    playBorder.top.draw?.pixels !== 258 ||
    playBorder.left.draw?.pixels !== 130 ||
    playBorder.corner.draw?.color !== 124 ||
    planePixel(0, 0) !== 127 ||
    planePixel(32, 16) !== 0 ||
    planePixel(31, 15) !== 0 ||
    planePixel(32, 144) !== 125 ||
    planePixel(288, 16) !== 125 ||
    planePixel(31, 144) !== 124
  ) {
    fail(`WL_GAME_DrawPlayBorder did not mirror the original viewport border geometry: ${JSON.stringify(playBorder)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  const playBorderSides = mod.WL_GAME_DrawPlayBorderSides();
  if (
    playBorderSides.xl !== 32 ||
    playBorderSides.yl !== 16 ||
    playBorderSides.leftBackground.draw?.pixels !== 4960 ||
    playBorderSides.rightBackground.draw?.pixels !== 4800 ||
    playBorderSides.left.draw?.pixels !== 130 ||
    playBorderSides.right.draw?.pixels !== 130 ||
    planePixel(0, 0) !== 127 ||
    planePixel(289, 0) !== 127 ||
    planePixel(31, 16) !== 0 ||
    planePixel(288, 16) !== 125 ||
    planePixel(32, 16) !== 0
  ) {
    fail(`WL_GAME_DrawPlayBorderSides did not redraw only side strips and bevel lines: ${JSON.stringify(playBorderSides)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0x1234);
  const allBorder = mod.WL_GAME_DrawAllPlayBorder();
  if (
    allBorder.pages.length !== 3 ||
    allBorder.restoredBufferofs !== 0x1234 ||
    mod.ID_VL_bufferofs !== 0x1234 ||
    planePixel(0, 0, 0) !== 127 ||
    planePixel(0, 0, 16640) !== 127 ||
    planePixel(0, 0, 33280) !== 127
  ) {
    fail(`WL_GAME_DrawAllPlayBorder did not draw all screenloc pages and restore bufferofs: ${JSON.stringify(allBorder)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0x2345);
  const allBorderSides = mod.WL_GAME_DrawAllPlayBorderSides();
  if (
    allBorderSides.pages.length !== 3 ||
    allBorderSides.restoredBufferofs !== 0x2345 ||
    mod.ID_VL_bufferofs !== 0x2345 ||
    planePixel(31, 16, 0) !== 0 ||
    planePixel(31, 16, 16640) !== 0 ||
    planePixel(31, 16, 33280) !== 0
  ) {
    fail(`WL_GAME_DrawAllPlayBorderSides did not draw all side borders and restore bufferofs: ${JSON.stringify(allBorderSides)}`);
  }
  mod.ID_VL_VL_SetBufferOffset(0);

  mod.ID_VH_update.fill(1);
  mod.ID_US_US_RestoreWindow({ x: 24, y: 32, w: 40, h: 48, px: 0, py: 0 });
  const splitClear = mod.WL_INTER_ClearSplitVWB();
  if (
    splitClear.clearedBlocks !== mod.ID_VH_update.length ||
    mod.ID_VH_update.some((value) => value !== 0) ||
    mod.ID_US_WindowX !== 0 ||
    mod.ID_US_WindowY !== 0 ||
    mod.ID_US_WindowW !== 320 ||
    mod.ID_US_WindowH !== 160
  ) {
    fail(`WL_INTER_ClearSplitVWB did not clear update blocks and reset the window: ${JSON.stringify(splitClear)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_VL_VL_SetScreen(0x2000, 0);
  mod.ID_US_US_RestoreWindow({ x: 48, y: 56, w: 224, h: 48, px: 0, py: 0 });
  const preloadAbort = mod.WL_INTER_PreloadUpdate(3, 7);
  const preload = mod.WL_INTER_lastPreloadUpdate;
  if (
    preloadAbort !== false ||
    preload?.width !== 214 ||
    preload.filledWidth !== 91 ||
    preload.background.draw?.pixels !== 428 ||
    preload.fill?.draw?.pixels !== 182 ||
    preload.highlight?.draw?.pixels !== 90 ||
    preload.update.blocks < 1 ||
    mod.ID_VH_update.some((value) => value !== 0) ||
    planePixel(53, 101) !== 0x32 ||
    planePixel(143, 101) !== 0x37 ||
    planePixel(144, 101) !== 0 ||
    planePixel(53, 101, 0x2000) !== 0x32
  ) {
    fail(`WL_INTER_PreloadUpdate did not draw and flush the original preload meter: ${JSON.stringify(preload)}`);
  }
  mod.ID_VL_VL_SetScreen(0, 0);

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  const intermissionPictable = new Uint8Array(149 * 4);
  const intermissionChunks = [];
  for (let pic = 43; pic <= 84; pic++) {
    const tableOffset = (pic - 3) * 4;
    intermissionPictable[tableOffset] = 8;
    intermissionPictable[tableOffset + 2] = 2;
    intermissionChunks[pic] = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => (pic + index) & 0xff));
  }
  const intermissionWrite = mod.WL_INTER_Write(2, 3, "a1:% !'\nZ", {
    pictable: intermissionPictable,
    chunks: intermissionChunks,
  });
  if (
    JSON.stringify(intermissionWrite.picnums) !== JSON.stringify([56, 46, 44, 55, 82, 83, 81]) ||
    intermissionWrite.finalX !== 32 ||
    intermissionWrite.finalY !== 40 ||
    intermissionWrite.draws[0]?.x !== 16 ||
    intermissionWrite.draws[3]?.x !== 56 ||
    intermissionWrite.draws[4]?.x !== 88 ||
    intermissionWrite.draws[6]?.y !== 40 ||
    planePixel(16, 24) !== 56 ||
    planePixel(32, 24) !== 46 ||
    planePixel(48, 24) !== 44 ||
    planePixel(56, 24) !== 55 ||
    planePixel(88, 24) !== 82 ||
    planePixel(96, 24) !== 83 ||
    planePixel(16, 40) !== 81
  ) {
    fail(`WL_INTER_Write did not reproduce the original intermission text graphic mapping: ${JSON.stringify(intermissionWrite)}`);
  }

  mod.ID_SD_SD_ResetSoundState();
  while (mod.ID_SD_SD_DebugState().TimeCount <= 10) {
    mod.ID_SD_SDL_t0Service();
  }
  const firstBreath = mod.WL_INTER_BJ_Breathe({ pictable: intermissionPictable, chunks: intermissionChunks });
  if (
    !firstBreath.breathed ||
    firstBreath.which !== 1 ||
    firstBreath.max !== 35 ||
    firstBreath.picnum !== 84 ||
    firstBreath.draw?.draw?.bytes !== 16 ||
    firstBreath.update?.blocks < 1 ||
    mod.ID_SD_SD_DebugState().TimeCount !== 0 ||
    planePixel(0, 16) !== 84
  ) {
    fail(`WL_INTER_BJ_Breathe did not toggle to the second BJ picture after the initial delay: ${JSON.stringify(firstBreath)}`);
  }
  while (mod.ID_SD_SD_DebugState().TimeCount <= 35) {
    mod.ID_SD_SDL_t0Service();
  }
  const secondBreath = mod.WL_INTER_BJ_Breathe({ pictable: intermissionPictable, chunks: intermissionChunks });
  if (
    !secondBreath.breathed ||
    secondBreath.which !== 0 ||
    secondBreath.picnum !== 43 ||
    secondBreath.max !== 35 ||
    mod.ID_SD_SD_DebugState().TimeCount !== 0 ||
    planePixel(0, 16) !== 43
  ) {
    fail(`WL_INTER_BJ_Breathe did not toggle back to the first BJ picture after the long delay: ${JSON.stringify(secondBreath)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  const pg13Pictable = new Uint8Array(149 * 4);
  pg13Pictable[(88 - 3) * 4] = 16;
  pg13Pictable[(88 - 3) * 4 + 2] = 4;
  const pg13Source = new Uint8Array(64);
  for (let plane = 0; plane < 4; plane++) {
    pg13Source.fill(0x70 + plane, plane * 16, (plane + 1) * 16);
  }
  const pg13Palette = new Uint8Array(768);
  for (let i = 0; i < pg13Palette.length; i++) {
    pg13Palette[i] = i & 0xff;
  }
  const pg13 = mod.WL_INTER_PG13({
    pictable: pg13Pictable,
    chunks: { 88: pg13Source },
    palette: pg13Palette,
    userInputMaxPolls: 1,
  });
  if (
    !pg13.fadeOutBefore.screenfaded ||
    pg13.background.draw?.pixels !== 64000 ||
    pg13.cached ||
    pg13.draw.x !== 216 ||
    pg13.draw.y !== 110 ||
    pg13.draw.width !== 16 ||
    pg13.draw.height !== 4 ||
    pg13.draw.draw?.bytes !== 64 ||
    pg13.update.blocks !== 260 ||
    pg13.fadeIn.checksum !== 97920 ||
    pg13.userInput ||
    !pg13.fadeOutAfter.screenfaded ||
    mod.ID_VH_update.some((value) => value !== 0) ||
    planePixel(216, 110) !== 0x70 ||
    planePixel(219, 110) !== 0x73
  ) {
    fail(`WL_INTER_PG13 did not compose the original warning screen draw/fade flow: ${JSON.stringify(pg13)}`);
  }

  const savedScores = mod.ID_US_Scores.map((score) => ({ ...score }));
  const highScoreFixtures = [
    { name: "AAA", score: 5000, completed: 4, episode: 0 },
    { name: "BBB", score: 4000, completed: 3, episode: 1 },
    { name: "CCC", score: 3000, completed: 2, episode: 2 },
    { name: "DDD", score: 2000, completed: 1, episode: 3 },
    { name: "EEE", score: 1000, completed: 1, episode: 4 },
    { name: "FFF", score: 900, completed: 1, episode: 5 },
    { name: "GGG", score: 800, completed: 1, episode: 0 },
  ];
  mod.ID_US_Scores.splice(0, mod.ID_US_Scores.length, ...highScoreFixtures.map((score) => ({ ...score })));
  const highScorePrints = [];
  const highScorePics = [];
  const highScores = mod.WL_INTER_DrawHighScores({
    cacheGraphic: (chunk) => `cache-${chunk}`,
    uncacheGraphic: (chunk) => `uncache-${chunk}`,
    clearScreen: () => "clear",
    drawStripes: (y) => `stripes-${y}`,
    drawPic: (x, y, picnum) => {
      highScorePics.push([x, y, picnum]);
      return { x, y, picnum };
    },
    print: (x, y, text) => {
      highScorePrints.push([x, y, Array.from(text, (ch) => ch.charCodeAt(0))]);
      return { x, y, text };
    },
    measureText: (text) => text.length * 8,
    update: () => "scores-update",
  });
  const firstLevelCodes = Array.from(highScores.rows[0].levelDigits.text, (ch) => ch.charCodeAt(0));
  const firstScoreCodes = Array.from(highScores.rows[0].scoreDigits.text, (ch) => ch.charCodeAt(0));
  if (
    JSON.stringify(highScores.cached) !== JSON.stringify(["cache-90", "cache-1", "cache-38", "cache-40", "cache-39"]) ||
    highScores.clearScreen !== "clear" ||
    highScores.stripes !== "stripes-10" ||
    JSON.stringify(highScorePics.map((entry) => entry[2])) !== JSON.stringify([90, 39, 38, 40]) ||
    highScores.uncacheTitle !== "uncache-90" ||
    highScores.font.fontnumber !== 0 ||
    highScores.rows.length !== mod.ID_US_MaxScores ||
    highScores.rows[0].name.x !== 32 ||
    highScores.rows[0].name.y !== 76 ||
    highScores.rows[0].episodeLevel.text !== "E1/L" ||
    highScores.rows[0].episodeLevel.x !== 162 ||
    JSON.stringify(firstLevelCodes) !== JSON.stringify([133]) ||
    highScores.rows[0].scoreDigits.x !== 232 ||
    JSON.stringify(firstScoreCodes) !== JSON.stringify([134, 129, 129, 129]) ||
    highScorePrints.length !== mod.ID_US_MaxScores * 4 ||
    highScores.update !== "scores-update"
  ) {
    fail(`WL_INTER_DrawHighScores did not model the WL6 high-score screen rows: ${JSON.stringify({
      highScores,
      highScorePics,
      firstLevelCodes,
      firstScoreCodes,
    })}`);
  }

  const insertedScore = mod.WL_INTER_CheckHighScore(4500, 5, {
    episode: 2,
    startMusic: (song) => `music-${song}`,
    drawHighScores: () => "draw-scores",
    fadeIn: () => "fade-in",
    nameInput: () => "Commander Keen",
  });
  const missedScore = mod.WL_INTER_CheckHighScore(10, 1, {
    startMusic: (song) => `music-${song}`,
    drawHighScores: () => "draw-scores",
    fadeIn: () => "fade-in",
    clearKeysDown: () => "clear-keys",
    userInput: (ticks) => `wait-${ticks}`,
  });
  if (
    !insertedScore.inserted ||
    insertedScore.index !== 1 ||
    insertedScore.music !== "music-23" ||
    insertedScore.draw !== "draw-scores" ||
    insertedScore.fadeIn !== "fade-in" ||
    insertedScore.nameInput !== "Commander Keen" ||
    insertedScore.scores[1].score !== 4500 ||
    insertedScore.scores[1].episode !== 2 ||
    insertedScore.scores[1].completed !== 5 ||
    insertedScore.scores[2].name !== "BBB" ||
    missedScore.inserted ||
    missedScore.index !== -1 ||
    missedScore.clearKeysDown !== "clear-keys" ||
    missedScore.userInput !== "wait-500"
  ) {
    fail(`WL_INTER_CheckHighScore did not preserve insertion and no-entry branches: ${JSON.stringify({ insertedScore, missedScore })}`);
  }

  const noticePrints = [];
  const notice = mod.WL_INTER_NonShareware({
    cacheFont: (chunk) => `font-${chunk}`,
    print: (x, y, text) => {
      noticePrints.push([x, y, text]);
      return { x, y, text };
    },
    palette: pg13Palette,
    ackMaxPolls: 1,
  });
  if (
    !notice.fadeOut.screenfaded ||
    notice.cacheFont !== "font-2" ||
    notice.headingFont.fontnumber !== 1 ||
    notice.heading?.text !== "Attention" ||
    notice.body.length !== 4 ||
    noticePrints[1]?.[2] !== "This game is NOT shareware.\n" ||
    notice.update.blocks < 1 ||
    notice.fadeIn.checksum !== 97920 ||
    notice.ack
  ) {
    fail(`WL_INTER_NonShareware did not model the registered-copy warning sequence: ${JSON.stringify({ notice, noticePrints })}`);
  }
  mod.ID_US_Scores.splice(0, mod.ID_US_Scores.length, ...savedScores);

  const tile8Source = new Uint8Array(Array.from({ length: 64 }, (_unused, index) => 0x10 + index));
  const tile8Draw = mod.ID_VH_VWB_DrawTile8(24, 40, 0, { source: tile8Source });
  if (
    tile8Draw.draw?.bytes !== 64 ||
    !tile8Draw.mark.marked ||
    mod.ID_VL_videoPlanes[3206] !== 0x10 ||
    mod.ID_VL_videoPlanes[3766] !== 0x1e ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 3206] !== 0x40
  ) {
    fail(`VWB_DrawTile8 did not mark and draw an 8x8 planar tile: ${JSON.stringify(tile8Draw)}`);
  }

  const tile8MSource = new Uint8Array(Array.from({ length: 64 }, (_unused, index) => 0x50 + index));
  const tile8MDraw = mod.ID_VH_VWB_DrawTile8M(28, 56, 0, { source: tile8MSource });
  if (
    tile8MDraw.draw?.bytes !== 64 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 4487] !== 0x70 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 5047] !== 0x8e
  ) {
    fail(`VWB_DrawTile8M did not delegate masked tile bytes through VL_MemToScreen: ${JSON.stringify(tile8MDraw)}`);
  }

  const picSource = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0x90 + index));
  const picDraw = mod.ID_VH_VWB_DrawPic(31, 48, 3, { source: picSource, width: 8, height: 2 });
  if (
    picDraw.x !== 24 ||
    picDraw.draw?.bytes !== 16 ||
    mod.ID_VL_videoPlanes[3846] !== 0x90 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 3926] !== 0x9e
  ) {
    fail(`VWB_DrawPic did not align x and draw pic bytes through VL_MemToScreen: ${JSON.stringify(picDraw)}`);
  }

  const font = new Uint8Array(2 + 256 * 2 + 256 + 32);
  const fontLocationOffset = 2;
  const fontWidthOffset = fontLocationOffset + 256 * 2;
  const fontDataOffset = fontWidthOffset + 256;
  font[0] = 4;
  const charA = "A".charCodeAt(0);
  const charB = "B".charCodeAt(0);
  font[fontLocationOffset + charA * 2] = fontDataOffset & 0xff;
  font[fontLocationOffset + charA * 2 + 1] = fontDataOffset >> 8;
  font[fontWidthOffset + charA] = 3;
  font[fontLocationOffset + charB * 2] = (fontDataOffset + 12) & 0xff;
  font[fontLocationOffset + charB * 2 + 1] = (fontDataOffset + 12) >> 8;
  font[fontWidthOffset + charB] = 2;
  font.set([
    1, 0, 1,
    1, 1, 1,
    1, 0, 1,
    1, 0, 1,
  ], fontDataOffset);
  font.set([
    1, 1,
    1, 0,
    1, 1,
    1, 0,
  ], fontDataOffset + 12);
  const measureDirect = mod.ID_VH_VWL_MeasureString("AB\x00C", font);
  const measureProp = mod.ID_VH_VW_MeasurePropString("AB\x00C", { font });
  mod.ID_VH_VW_SetFontState({ px: 1, py: 60, fontcolor: 0x22, fontnumber: 0 });
  const propString = mod.ID_VH_VW_DrawPropString("AB\x00C", { font });
  if (
    measureDirect.width !== 5 ||
    measureDirect.height !== 4 ||
    measureDirect.chars !== 2 ||
    measureProp.width !== 5 ||
    propString.startX !== 1 ||
    propString.endX !== 6 ||
    propString.width !== 8 ||
    propString.height !== 4 ||
    propString.pixels !== 15 ||
    mod.ID_VH_px !== 6 ||
    mod.ID_VH_bufferwidth !== 8 ||
    mod.ID_VL_videoPlanes[0x10000 + 4800] !== 0x22 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 4800] !== 0x22 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 4880] !== 0x22 ||
    mod.ID_VL_videoPlanes[4801] !== 0x22 ||
    mod.ID_VL_videoPlanes[0x10000 + 4801] !== 0x22
  ) {
    fail(`ID_VH proportional string drawing did not follow fontstruct layout and px advancement: ${JSON.stringify({
      measureDirect,
      measureProp,
      propString,
      state: mod.ID_VH_VW_DebugFontState(),
    })}`);
  }

  mod.ID_VH_VW_SetFontState({ px: 8, py: 65, fontcolor: 0x10 });
  const colorString = mod.ID_VH_VW_DrawColorPropString("B", { font });
  if (
    !colorString.colorized ||
    colorString.endX !== 10 ||
    mod.ID_VL_videoPlanes[5202] !== 0x10 ||
    mod.ID_VL_videoPlanes[5282] !== 0x11 ||
    mod.ID_VL_videoPlanes[5442] !== 0x12
  ) {
    fail(`VW_DrawColorPropString did not reproduce the row-pair color increment path: ${JSON.stringify(colorString)}`);
  }

  mod.ID_VH_update.fill(0);
  mod.ID_VH_VW_SetFontState({ px: 12, py: 70, fontcolor: 0x33 });
  const bufferedProp = mod.ID_VH_VWB_DrawPropString("A", { font });
  if (
    bufferedProp.endX !== 15 ||
    bufferedProp.draw?.pixels !== 9 ||
    !bufferedProp.mark.marked ||
    bufferedProp.mark.xt1 !== 0 ||
    bufferedProp.mark.yt1 !== 4 ||
    mod.ID_VH_update[80] !== 1 ||
    mod.ID_VL_videoPlanes[2 * 0x10000 + 5603] !== 0x33
  ) {
    fail(`VWB_DrawPropString did not draw then mark the updated proportional-text block: ${JSON.stringify(bufferedProp)}`);
  }

  const latchPictable = new Uint8Array(149 * 4);
  const latchPicTableOffset = (91 - 3) * 4;
  latchPictable[latchPicTableOffset] = 8;
  latchPictable[latchPicTableOffset + 2] = 2;
  const latchChunks = [];
  const latchTile8 = new Uint8Array(72 * 64);
  for (let i = 0; i < latchTile8.length; i++) {
    latchTile8[i] = (0x30 + i) & 0xff;
  }
  const latchPicSource = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0xd0 + index));
  latchChunks[135] = latchTile8;
  latchChunks[91] = latchPicSource;
  const latchLoad = mod.ID_VH_LoadLatchMem({
    freeStart: 0x3000,
    chunks: latchChunks,
    pictable: latchPictable,
    start: 91,
    end: 91,
  });
  if (
    latchLoad.tile8Offset !== 0x3000 ||
    latchLoad.firstPicOffset !== 0x3480 ||
    latchLoad.endOffset !== 0x3484 ||
    latchLoad.picCount !== 1 ||
    mod.ID_VH_freelatch !== 0x3000 ||
    mod.ID_VH_latchpics[0] !== 0x3000 ||
    mod.ID_VH_latchpics[2] !== 0x3480 ||
    mod.ID_VL_videoPlanes[0x3000] !== 0x30 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 0x300f] !== 0x6f ||
    mod.ID_VL_videoPlanes[0x3480] !== 0xd0 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 0x3483] !== 0xdf
  ) {
    fail(`LoadLatchMem did not lay out tile8 and latch pics like ID_VH.C: ${JSON.stringify(latchLoad)}`);
  }
  const latchPic = mod.ID_VH_LatchDrawPic(3, 30, 91, { pictable: latchPictable });
  if (
    latchPic.source !== 0x3480 ||
    latchPic.width !== 8 ||
    latchPic.height !== 2 ||
    latchPic.draw.bytes !== 16 ||
    mod.ID_VL_videoPlanes[2406] !== 0xd0 ||
    mod.ID_VL_videoPlanes[2487] !== 0xd3 ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 2487] !== 0xdf
  ) {
    fail(`LatchDrawPic did not draw the latched picture at x*8,y: ${JSON.stringify(latchPic)}`);
  }

  const hudPictable = new Uint8Array(149 * 4);
  const hudChunks = [];
  hudChunks[135] = latchTile8;
  for (let pic = 91; pic <= 132; pic++) {
    const tableOffset = (pic - 3) * 4;
    hudPictable[tableOffset] = 8;
    hudPictable[tableOffset + 2] = 2;
    hudChunks[pic] = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => (pic + index) & 0xff));
  }
  mod.ID_VH_LoadLatchMem({ freeStart: 0x3800, chunks: hudChunks, pictable: hudPictable, start: 91, end: 132 });
  const statusPic = mod.WL_AGENT_StatusDrawPic(1, 2, 91, { pictable: hudPictable });
  if (
    statusPic.picnum !== 91 ||
    statusPic.pages[0] !== 12800 ||
    mod.ID_VL_bufferofs !== 0 ||
    mod.ID_VL_videoPlanes[12962] !== 91 ||
    mod.ID_VL_videoPlanes[29602] !== 91 ||
    mod.ID_VL_videoPlanes[46242] !== 91
  ) {
    fail(`WL_AGENT_StatusDrawPic did not draw to all three status pages and restore bufferofs: ${JSON.stringify(statusPic)}`);
  }

  const dgroupHud = new mod.DOSMemory(0x10000);
  const hudGamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  dgroupHud.setU16(hudGamestate + 2, 8);
  dgroupHud.setU32(hudGamestate + 8, 1234);
  dgroupHud.setU16(hudGamestate + 16, 5);
  dgroupHud.setU16(hudGamestate + 18, 7);
  dgroupHud.setU16(hudGamestate + 20, 15);
  dgroupHud.setU16(hudGamestate + 22, 1);
  dgroupHud.setU16(hudGamestate + 26, 2);
  dgroupHud.setU16(hudGamestate + 30, 2);

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0x3456);
  const statusBarSource = new Uint8Array(320 * 40);
  const bytesPerStatusPlane = (320 >> 2) * 40;
  for (let plane = 0; plane < 4; plane++) {
    statusBarSource.fill(0x5a + plane, plane * bytesPerStatusPlane, (plane + 1) * bytesPerStatusPlane);
  }
  const playScreen = mod.WL_GAME_DrawPlayScreen(dgroupHud, {
    pictable: hudPictable,
    statusBarSource,
    statusBarWidth: 320,
    statusBarHeight: 40,
  });
  if (
    playScreen.fade.start !== 0 ||
    playScreen.fade.end !== 255 ||
    playScreen.fade.steps !== 30 ||
    playScreen.statusBarChunk !== 86 ||
    playScreen.statusBarCached ||
    playScreen.pages.length !== 3 ||
    playScreen.restoredBufferofs !== 0x3456 ||
    mod.ID_VL_bufferofs !== 0x3456 ||
    playScreen.borders[0]?.xl !== 32 ||
    playScreen.statusBars[0]?.draw?.bytes !== 12800 ||
    playScreen.statusBars[1]?.draw?.bytes !== 12800 ||
    playScreen.statusBars[2]?.draw?.bytes !== 12800 ||
    planePixel(0, 160, 0) !== 0x5a ||
    planePixel(1, 160, 0) !== 0x5b ||
    planePixel(0, 160, 16640) !== 0x5a ||
    planePixel(0, 160, 33280) !== 0x5a ||
    planePixel(0, 0, 0) !== 127 ||
    playScreen.hud.face.picnum !== 126 ||
    JSON.stringify(playScreen.hud.health.picnums) !== JSON.stringify([98, 98, 106]) ||
    JSON.stringify(playScreen.hud.score.picnums) !== JSON.stringify([98, 98, 100, 101, 102, 103]) ||
    playScreen.hud.keys[0].picnum !== 96 ||
    playScreen.hud.weapon.picnum !== 93
  ) {
    fail(`WL_GAME_DrawPlayScreen did not compose fade, three page buffers, status bar, and HUD draws: ${JSON.stringify(playScreen)}`);
  }
  mod.ID_VL_VL_SetBufferOffset(0);

  const latchedNumber = mod.WL_AGENT_LatchNumber(5, 3, 4, 42, { pictable: hudPictable });
  const healthDraw = mod.WL_AGENT_DrawHealth(dgroupHud, { pictable: hudPictable });
  const levelDraw = mod.WL_AGENT_DrawLevel(dgroupHud, { pictable: hudPictable });
  const livesDraw = mod.WL_AGENT_DrawLives(dgroupHud, { pictable: hudPictable });
  const scoreDraw = mod.WL_AGENT_DrawScore(dgroupHud, { pictable: hudPictable });
  const weaponDraw = mod.WL_AGENT_DrawWeapon(dgroupHud, { pictable: hudPictable });
  const keysDraw = mod.WL_AGENT_DrawKeys(dgroupHud, { pictable: hudPictable });
  const ammoDraw = mod.WL_AGENT_DrawAmmo(dgroupHud, { pictable: hudPictable });
  dgroupHud.setU16(hudGamestate + 18, 84);
  const faceDraw = mod.WL_AGENT_DrawFace(dgroupHud, { pictable: hudPictable });
  dgroupHud.setU16(hudGamestate + 18, 0);
  const deadFaceDraw = mod.WL_AGENT_DrawFace(dgroupHud, { pictable: hudPictable });
  const lastAttackerOffset = mod.nearOffsetForRuntimeSymbol("_LastAttacker");
  const mutantAttacker = 0x4500;
  dgroupHud.setU16(lastAttackerOffset, mutantAttacker);
  dgroupHud.setU16(mutantAttacker + 4, 12);
  const mutantFaceDraw = mod.WL_AGENT_DrawFace(dgroupHud, { pictable: hudPictable });
  if (
    JSON.stringify(latchedNumber.picnums) !== JSON.stringify([98, 98, 103, 101]) ||
    JSON.stringify(healthDraw.picnums) !== JSON.stringify([98, 98, 106]) ||
    JSON.stringify(levelDraw.picnums) !== JSON.stringify([98, 108]) ||
    JSON.stringify(livesDraw.picnums) !== JSON.stringify([104]) ||
    JSON.stringify(scoreDraw.picnums) !== JSON.stringify([98, 98, 100, 101, 102, 103]) ||
    weaponDraw.picnum !== 93 ||
    keysDraw[0].picnum !== 96 ||
    keysDraw[1].picnum !== 95 ||
    JSON.stringify(ammoDraw.picnums) !== JSON.stringify([100, 104]) ||
    faceDraw.picnum !== 114 ||
    faceDraw.mutantDeath ||
    deadFaceDraw.picnum !== 130 ||
    deadFaceDraw.mutantDeath ||
    mutantFaceDraw.picnum !== 132 ||
    !mutantFaceDraw.mutantDeath
  ) {
    fail(`WL_AGENT status HUD drawing helpers did not select original pic numbers: ${JSON.stringify({
      latchedNumber: latchedNumber.picnums,
      health: healthDraw.picnums,
      level: levelDraw.picnums,
      lives: livesDraw.picnums,
      score: scoreDraw.picnums,
      weapon: weaponDraw.picnum,
      keys: keysDraw.map((draw) => draw.picnum),
      ammo: ammoDraw.picnums,
      faces: [faceDraw.picnum, deadFaceDraw.picnum, mutantFaceDraw.picnum],
    })}`);
  }

  mod.ID_VH_VWB_Plot(9, 30, 0x33);
  const display = mod.ID_VL_VL_SetScreen(0x2000, 3);
  if (display.displayofs !== 0x2000 || display.pelpan !== 3 || mod.ID_VL_displayofs !== 0x2000) {
    fail(`VL_SetScreen did not store display offset and pel pan state: ${JSON.stringify(display)}`);
  }
  const updateScreen = mod.ID_VH_VW_UpdateScreen();
  if (
    updateScreen.blocks < 1 ||
    updateScreen.bytes !== updateScreen.blocks * 256 ||
    mod.ID_VL_videoPlanes[0x10000 + 0x2000 + 2402] !== 0x33 ||
    mod.ID_VH_update.some((value) => value !== 0)
  ) {
    fail(`VW_UpdateScreen did not copy and clear dirty update blocks: ${JSON.stringify(updateScreen)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_VL_VL_SetScreen(0, 0);
  const menuClear = mod.WL_MENU_ClearMScreen();
  mod.ID_VH_update.fill(0);
  const menuPictable = new Uint8Array(149 * 4);
  menuPictable[(10 - 3) * 4] = 4;
  menuPictable[(10 - 3) * 4 + 2] = 2;
  menuPictable[(11 - 3) * 4] = 8;
  menuPictable[(11 - 3) * 4 + 2] = 2;
  menuPictable[(12 - 3) * 4] = 8;
  menuPictable[(12 - 3) * 4 + 2] = 2;
  for (let pic = 13; pic <= 17; pic++) {
    menuPictable[(pic - 3) * 4] = 4;
    menuPictable[(pic - 3) * 4 + 2] = 2;
  }
  menuPictable[(18 - 3) * 4] = 4;
  menuPictable[(18 - 3) * 4 + 2] = 2;
  menuPictable[(21 - 3) * 4] = 4;
  menuPictable[(21 - 3) * 4 + 2] = 2;
  menuPictable[(24 - 3) * 4] = 4;
  menuPictable[(24 - 3) * 4 + 2] = 2;
  menuPictable[(25 - 3) * 4] = 4;
  menuPictable[(25 - 3) * 4 + 2] = 2;
  menuPictable[(26 - 3) * 4] = 4;
  menuPictable[(26 - 3) * 4 + 2] = 2;
  menuPictable[(27 - 3) * 4] = 4;
  menuPictable[(27 - 3) * 4 + 2] = 2;
  menuPictable[(28 - 3) * 4] = 4;
  menuPictable[(28 - 3) * 4 + 2] = 2;
  menuPictable[(29 - 3) * 4] = 4;
  menuPictable[(29 - 3) * 4 + 2] = 2;
  for (let pic = 30; pic <= 35; pic++) {
    menuPictable[(pic - 3) * 4] = 4;
    menuPictable[(pic - 3) * 4 + 2] = 2;
  }
  for (let pic = 41; pic <= 42; pic++) {
    menuPictable[(pic - 3) * 4] = 4;
    menuPictable[(pic - 3) * 4 + 2] = 2;
  }
  const menuChunks = [];
  menuChunks[10] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0xb8 + index));
  menuChunks[11] = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0x40 + index));
  menuChunks[12] = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => 0x50 + index));
  for (let pic = 13; pic <= 17; pic++) {
    menuChunks[pic] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => (0x98 + (pic - 13) * 8 + index) & 0xff));
  }
  menuChunks[18] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0x50 + index));
  menuChunks[21] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0x60 + index));
  menuChunks[24] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0x70 + index));
  menuChunks[25] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0xa0 + index));
  menuChunks[26] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0xc0 + index));
  menuChunks[27] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0xc8 + index));
  menuChunks[28] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0x80 + index));
  menuChunks[29] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => 0x90 + index));
  for (let pic = 30; pic <= 35; pic++) {
    menuChunks[pic] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => (0xd0 + (pic - 30) * 8 + index) & 0xff));
  }
  for (let pic = 41; pic <= 42; pic++) {
    menuChunks[pic] = new Uint8Array(Array.from({ length: 8 }, (_unused, index) => (0xe0 + (pic - 41) * 8 + index) & 0xff));
  }
  mod.ID_SD_SD_ResetSoundState();
  const diskSkip = mod.WL_MAIN_DiskFlopAnim(0, 0, { pictable: menuPictable, chunks: menuChunks });
  const diskFirst = mod.WL_MAIN_DiskFlopAnim(32, 40, { pictable: menuPictable, chunks: menuChunks });
  const diskSecond = mod.WL_MAIN_DiskFlopAnim(32, 40, { pictable: menuPictable, chunks: menuChunks });
  const menuHalfStep = mod.WL_MENU_DrawHalfStep(80, 64, { pictable: menuPictable, chunks: menuChunks });
  if (
    menuClear.background.draw?.pixels !== 64000 ||
    planePixel(0, 0) !== 0x29 ||
    planePixel(319, 199) !== 0x29 ||
    !diskSkip.skipped ||
    diskSkip.nextWhich !== 0 ||
    diskFirst.picnum !== 24 ||
    diskFirst.which !== 0 ||
    diskFirst.nextWhich !== 1 ||
    diskFirst.draw?.draw?.bytes !== 8 ||
    diskSecond.picnum !== 25 ||
    diskSecond.which !== 1 ||
    diskSecond.nextWhich !== 0 ||
    diskSecond.draw?.draw?.bytes !== 8 ||
    planePixel(32, 40) !== 0xa0 ||
    menuHalfStep.draw.draw?.bytes !== 16 ||
    menuHalfStep.draw.x !== 80 ||
    menuHalfStep.update.blocks !== 1 ||
    menuHalfStep.update.bytes !== 256 ||
    menuHalfStep.soundPlayed ||
    menuHalfStep.waitedTics !== 8 ||
    menuHalfStep.timerServices !== 16 ||
    mod.ID_SD_SD_DebugState().TimeCount !== 8 ||
    mod.ID_VH_update.some((value) => value !== 0) ||
    planePixel(80, 64) !== 0x40 ||
    planePixel(81, 64) !== 0x44 ||
    planePixel(83, 65) !== 0x4e ||
    planePixel(87, 65) !== 0x4f
  ) {
    fail(`WL_MENU clear/half-step helpers did not match the original menu draw and delay sequence: ${JSON.stringify({
      menuClear,
      menuHalfStep,
      sound: mod.ID_SD_SD_DebugState(),
    })}`);
  }

  const menuOutline = mod.WL_MENU_DrawOutline(40, 10, 20, 6, 0x23, 0x2b);
  const menuWindow = mod.WL_MENU_DrawWindow(64, 20, 12, 5, 0x66);
  const menuStripes = mod.WL_MENU_DrawStripes(30);
  const newGameDiff = mod.WL_MENU_DrawNewGameDiff(2, { pictable: menuPictable, chunks: menuChunks });
  if (
    menuOutline.top.draw?.pixels !== 21 ||
    menuOutline.left.draw?.pixels !== 7 ||
    mod.ID_VL_videoPlanes[811] !== 0x2b ||
    mod.ID_VL_videoPlanes[970] !== 0x2b ||
    mod.ID_VL_videoPlanes[1291] !== 0x23 ||
    mod.ID_VL_videoPlanes[975] !== 0x23 ||
    menuWindow.fill.draw?.pixels !== 60 ||
    menuWindow.outline.bottom.draw?.pixels !== 13 ||
    mod.ID_VL_videoPlanes[1777] !== 0x66 ||
    mod.ID_VL_videoPlanes[1617] !== 0x2b ||
    mod.ID_VL_videoPlanes[2017] !== 0x23 ||
    mod.ID_VL_videoPlanes[1779] !== 0x23 ||
    menuStripes.background.draw?.pixels !== 7680 ||
    menuStripes.stripe.draw?.pixels !== 320 ||
    newGameDiff.w !== 2 ||
    newGameDiff.picnum !== 21 ||
    newGameDiff.draw.x !== 232 ||
    newGameDiff.draw.y !== 107 ||
    newGameDiff.draw.draw?.bytes !== 8 ||
    mod.ID_VL_videoPlanes[2481] !== 0 ||
    mod.ID_VL_videoPlanes[4160] !== 0x2c ||
    mod.ID_VL_videoPlanes[3 * 0x10000 + 4239] !== 0x2c ||
    planePixel(232, 107) !== 0x60
  ) {
    fail(`WL_MENU primitive drawing helpers did not match original VWB calls: ${JSON.stringify({
      menuOutline,
      menuWindow,
      menuStripes,
      newGameDiff,
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  const introScreen = mod.WL_MENU_IntroScreen({
    nearheap: 64 * 1024,
    farheap: 192 * 1024,
    EMSPresent: true,
    EMSPagesAvail: 150,
    XMSPresent: true,
    XMSPagesAvail: 250,
    mousePresent: true,
    joy0Present: false,
    joy1Present: true,
    adLibPresent: true,
    soundBlasterPresent: false,
    soundSourcePresent: true,
  });
  if (
    introScreen.memoryKb !== 256 ||
    introScreen.emsKb !== 600 ||
    introScreen.xmsKb !== 1000 ||
    introScreen.mainBars.length !== 8 ||
    introScreen.emsBars.length !== 6 ||
    introScreen.xmsBars.length !== 10 ||
    JSON.stringify(introScreen.deviceBars.map((bar) => [bar.index, bar.x, bar.y, bar.w, bar.h, bar.color])) !==
      JSON.stringify([
        [0, 164, 82, 12, 2, 14],
        [1, 164, 105, 12, 2, 14],
        [2, 164, 128, 12, 2, 14],
        [4, 164, 174, 12, 2, 14],
      ]) ||
    introScreen.mainBars.at(-1)?.y !== 107 ||
    introScreen.mainBars.at(-1)?.color !== 0x65 ||
    introScreen.emsBars.at(-1)?.y !== 123 ||
    introScreen.xmsBars.at(-1)?.y !== 91 ||
    planePixel(49, 163) !== 0x6c ||
    planePixel(49, 107) !== 0x65 ||
    planePixel(89, 123) !== 0x67 ||
    planePixel(129, 91) !== 0x63 ||
    planePixel(164, 82) !== 14 ||
    planePixel(164, 151) !== 0
  ) {
    fail(`WL_MENU IntroScreen did not mirror the original memory/device bar chart: ${JSON.stringify(introScreen)}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.ID_US_US_SetPrintRoutines(mod.ID_VH_VW_MeasurePropString, mod.ID_VH_VW_DrawPropString);
  const messageFont = new Uint8Array(770 + 21);
  messageFont[0] = 7;
  messageFont[1] = 0;
  for (let ch = 0; ch < 256; ch++) {
    messageFont[2 + ch * 2] = 770 & 0xff;
    messageFont[2 + ch * 2 + 1] = 770 >> 8;
    messageFont[514 + ch] = 3;
  }
  messageFont.fill(1, 770);
  const message = mod.WL_MENU_Message("HI\nBYE", { font: messageFont });
  const expectedMessageHeight = 14;
  const expectedMessageMaxWidth = 19;
  const expectedMessageX = 160 - Math.trunc(expectedMessageMaxWidth / 2);
  const expectedMessageY = 100 - Math.trunc(expectedMessageHeight / 2);
  if (
    message.fontChunk !== 2 ||
    message.fontCached ||
    message.fontState.fontnumber !== 1 ||
    message.measure.height !== expectedMessageHeight ||
    message.measure.maxWidth !== expectedMessageMaxWidth ||
    message.x !== expectedMessageX ||
    message.y !== expectedMessageY ||
    message.window.x !== expectedMessageX - 5 ||
    message.window.y !== expectedMessageY - 5 ||
    message.window.w !== expectedMessageMaxWidth + 10 ||
    message.window.h !== expectedMessageHeight + 10 ||
    message.window.fill.draw?.pixels !== (expectedMessageMaxWidth + 10) * (expectedMessageHeight + 10) ||
    message.outline.color1 !== 0 ||
    message.outline.color2 !== 0x13 ||
    message.color.fontcolor !== 0 ||
    message.color.backcolor !== 0x17 ||
    message.print.segments[0]?.x !== expectedMessageX ||
    message.print.segments[0]?.y !== expectedMessageY ||
    message.print.segments[1]?.x !== expectedMessageX ||
    message.print.segments[1]?.y !== expectedMessageY + 7 ||
    message.finalWindow.px !== expectedMessageX + 9 ||
    message.finalWindow.py !== expectedMessageY + 7 ||
    message.update.blocks < 1
  ) {
    fail(`WL_MENU Message did not mirror the original dialog layout/draw sequence: ${JSON.stringify({
      message,
      expectedMessageHeight,
      expectedMessageMaxWidth,
      expectedMessageX,
      expectedMessageY,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const confirmHooks = [];
  const confirm = mod.WL_MENU_Confirm("OK?", {
    font: messageFont,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      confirmHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const confirmInputState = mod.ID_IN_IN_DebugState();
  const confirmSoundState = mod.ID_SD_SD_DebugState();
  if (
    !confirm.accepted ||
    confirm.xit !== 1 ||
    confirm.message.text !== "OK?" ||
    confirm.message.x !== 151 ||
    confirm.message.y !== 97 ||
    confirm.x !== 160 ||
    confirm.y !== 97 ||
    confirm.waitPolls !== 0 ||
    confirm.releasePolls !== 1 ||
    confirmInputState.pressedKeys.length !== 0 ||
    confirmInputState.LastScan !== 0 ||
    confirmInputState.LastASCII !== 0 ||
    confirmSoundState.SoundNumber !== 32 ||
    confirmSoundState.SoundPriority !== 8 ||
    !confirmSoundState.pcSoundActive ||
    confirmHooks.length !== 2 ||
    JSON.stringify(confirmHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU Confirm did not mirror the original Y/N dialog key/sound sequencing: ${JSON.stringify({
      confirm,
      confirmHooks,
      confirmInputState,
      confirmSoundState,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const endGameDgroup = new mod.DOSMemory(0x10000);
  const endGameGamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const endGamePlaystate = mod.nearOffsetForRuntimeSymbol("_playstate");
  const ENDGAME_LIVES_OFFSET = 16;
  endGameDgroup.setU16(endGameGamestate + ENDGAME_LIVES_OFFSET, 3);
  endGameDgroup.setU16(endGamePlaystate, 0);
  mod.WL_MENU_MainMenu[4].active = 1;
  mod.WL_MENU_MainMenu[7].string = "End Game";
  mod.WL_MENU_MainMenu[7].routine = null;
  const endGameHooks = [];
  const endGame = mod.WL_MENU_CP_EndGame({
    dgroup: endGameDgroup,
    font: messageFont,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      endGameHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const endGameSoundState = mod.ID_SD_SD_DebugState();
  if (
    !endGame.ended ||
    endGame.result !== 1 ||
    !endGame.confirm.accepted ||
    endGame.confirm.message.text !== "Are you sure you want\nto end the game you\nare playing? (Y or N):" ||
    endGame.memory?.gamestateOffset !== endGameGamestate ||
    endGame.memory?.livesOffset !== endGameGamestate + ENDGAME_LIVES_OFFSET ||
    endGame.memory?.playstateOffset !== endGamePlaystate ||
    endGame.memory?.lives !== 0 ||
    endGame.memory?.playstate !== 2 ||
    endGameDgroup.u16(endGameGamestate + ENDGAME_LIVES_OFFSET) !== 0 ||
    endGameDgroup.u16(endGamePlaystate) !== 2 ||
    endGame.pickquick !== 0 ||
    mod.WL_MENU_pickquick !== 0 ||
    endGame.mainSaveActive !== 0 ||
    mod.WL_MENU_MainMenu[4].active !== 0 ||
    endGame.viewScoresString !== "View Scores" ||
    mod.WL_MENU_MainMenu[7].string !== "View Scores" ||
    endGame.viewScoresRoutine !== "CP_ViewScores" ||
    mod.WL_MENU_MainMenu[7].routine?.name !== "CP_ViewScores" ||
    endGameSoundState.SoundNumber !== 32 ||
    endGameSoundState.SoundPriority !== 8 ||
    JSON.stringify(endGameHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU CP_EndGame did not mirror the original end-game state transition: ${JSON.stringify({
      endGame,
      endGameHooks,
      endGameSoundState,
      lives: endGameDgroup.u16(endGameGamestate + ENDGAME_LIVES_OFFSET),
      playstate: endGameDgroup.u16(endGamePlaystate),
      mainMenu: mod.WL_MENU_MainMenu.slice(4, 8),
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  const quickEndDgroup = new mod.DOSMemory(0x10000);
  quickEndDgroup.setU16(endGameGamestate + ENDGAME_LIVES_OFFSET, 4);
  quickEndDgroup.setU16(endGamePlaystate, 0);
  mod.WL_MENU_MainMenu[4].active = 1;
  mod.WL_MENU_MainMenu[7].string = "End Game";
  mod.WL_MENU_MainMenu[7].routine = null;
  const quickEndHooks = [];
  const quickEnd = mod.WL_MENU_CP_CheckQuick(mod.ID_IN_sc_F7, {
    dgroup: quickEndDgroup,
    font: messageFont,
    skipFontCache: true,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      quickEndHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  if (
    quickEnd.scancode !== mod.ID_IN_sc_F7 ||
    quickEnd.branch !== "endgame" ||
    quickEnd.result !== 1 ||
    quickEnd.pending ||
    quickEnd.font !== null ||
    quickEnd.window160?.windowH !== 160 ||
    quickEnd.window200?.windowH !== 200 ||
    quickEnd.fontState?.fontnumber !== 0 ||
    !quickEnd.confirm?.accepted ||
    quickEnd.memory?.lives !== 0 ||
    quickEnd.memory?.playstate !== 2 ||
    quickEndDgroup.u16(endGameGamestate + ENDGAME_LIVES_OFFSET) !== 0 ||
    quickEndDgroup.u16(endGamePlaystate) !== 2 ||
    quickEnd.border?.pages.length !== 3 ||
    quickEnd.border?.restoredBufferofs !== 0 ||
    quickEnd.mainSaveActive !== 0 ||
    mod.WL_MENU_MainMenu[4].active !== 0 ||
    mod.WL_MENU_MainMenu[7].string !== "End Game" ||
    mod.WL_MENU_MainMenu[7].routine !== null ||
    JSON.stringify(quickEndHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU CP_CheckQuick F7 did not mirror the original in-game end branch: ${JSON.stringify({
      quickEnd,
      quickEndHooks,
      lives: quickEndDgroup.u16(endGameGamestate + ENDGAME_LIVES_OFFSET),
      playstate: quickEndDgroup.u16(endGamePlaystate),
      mainMenu: mod.WL_MENU_MainMenu.slice(4, 8),
    })}`);
  }
  mod.WL_MENU_MainMenu[7].string = "View Scores";

  mod.ID_CA_CA_ClearVirtualFiles();
  mod.WL_MENU_SaveGamesAvail.fill(0);
  mod.WL_MENU_SaveGameNames.fill("");
  mod.WL_MENU_LSItems.curpos = 3;
  mod.WL_MENU_SaveGamesAvail[3] = 1;
  mod.WL_MENU_SaveGameNames[3] = "Lab 3";
  const saveLoadDgroup = new mod.DOSMemory(0x10000);
  const saveLoadSegments = { "0x33DA": new Uint8Array(0x0800) };
  saveLoadDgroup.setU16(endGameGamestate + 2, 4);
  saveLoadDgroup.setU32(endGameGamestate + 8, 43210);
  saveLoadDgroup.setU16(endGameGamestate + 16, 6);
  saveLoadDgroup.setU16(endGameGamestate + 18, 77);
  saveLoadDgroup.setU16(endGameGamestate + 20, 12);
  saveLoadDgroup.setU16(endGameGamestate + 22, 3);
  saveLoadDgroup.setU16(endGameGamestate + 26, 2);
  saveLoadDgroup.setU16(endGameGamestate + 30, 1);
  const quickSaveDirect = mod.WL_MENU_CP_SaveGame({
    quick: true,
    slot: 3,
    dgroup: saveLoadDgroup,
    segments: saveLoadSegments,
  });
  const directSavedFile = mod.ID_CA_CA_GetVirtualFile(quickSaveDirect.filename);
  if (
    !quickSaveDirect.quick ||
    quickSaveDirect.result !== 1 ||
    quickSaveDirect.reason !== "saved" ||
    quickSaveDirect.slot !== 3 ||
    quickSaveDirect.filename !== "SAVEGAM3." ||
    quickSaveDirect.file?.headerName !== "Lab 3" ||
    quickSaveDirect.file?.headerBytes !== 32 ||
    quickSaveDirect.file?.imageBytes !== quickSaveDirect.saved?.bytes.length ||
    quickSaveDirect.file?.totalBytes !== directSavedFile?.length ||
    quickSaveDirect.saved?.x !== 0 ||
    quickSaveDirect.saved?.y !== 0 ||
    directSavedFile?.[0] !== "L".charCodeAt(0) ||
    directSavedFile?.[5] !== 0 ||
    !byteEqual(directSavedFile?.slice(32) ?? new Uint8Array(0), quickSaveDirect.saved?.bytes ?? new Uint8Array(1))
  ) {
    fail(`WL_MENU CP_SaveGame quick path did not write the original header+image save file: ${JSON.stringify({
      quickSaveDirect,
      directSavedLength: directSavedFile?.length ?? null,
      directSavedHeader: directSavedFile ? Array.from(directSavedFile.slice(0, 8)) : null,
    })}`);
  }

  saveLoadDgroup.setU32(endGameGamestate + 8, 1);
  saveLoadDgroup.setU16(endGameGamestate + 16, 1);
  saveLoadDgroup.setU16(endGameGamestate + 18, 1);
  saveLoadDgroup.setU16(endGameGamestate + 20, 1);
  saveLoadDgroup.setU16(endGameGamestate + 22, 0);
  saveLoadDgroup.setU16(endGameGamestate + 26, 0);
  saveLoadDgroup.setU16(endGameGamestate + 30, 0);
  const quickLoadDirect = mod.WL_MENU_CP_LoadGame({
    quick: true,
    slot: 3,
    dgroup: saveLoadDgroup,
    segments: saveLoadSegments,
    pictable: hudPictable,
  });
  if (
    !quickLoadDirect.quick ||
    quickLoadDirect.result !== 1 ||
    quickLoadDirect.reason !== "loaded" ||
    quickLoadDirect.file?.headerName !== "Lab 3" ||
    quickLoadDirect.file?.imageBytes !== quickSaveDirect.saved?.bytes.length ||
    !quickLoadDirect.loaded?.loaded ||
    !quickLoadDirect.loaded?.checksumMatches ||
    quickLoadDirect.status?.face.health !== 77 ||
    quickLoadDirect.status?.health.number !== 77 ||
    quickLoadDirect.status?.lives.number !== 6 ||
    quickLoadDirect.status?.ammo.number !== 12 ||
    quickLoadDirect.status?.weapon.picnum !== 93 ||
    saveLoadDgroup.u32(endGameGamestate + 8) !== 43210 ||
    saveLoadDgroup.u16(endGameGamestate + 16) !== 6 ||
    saveLoadDgroup.u16(endGameGamestate + 18) !== 77 ||
    saveLoadDgroup.u16(endGameGamestate + 20) !== 12 ||
    saveLoadDgroup.u16(endGameGamestate + 22) !== 3 ||
    saveLoadDgroup.u16(endGameGamestate + 26) !== 2
  ) {
    fail(`WL_MENU CP_LoadGame quick path did not restore the save image and redraw HUD stats: ${JSON.stringify({
      quickLoadDirect,
      gamestate: {
        score: saveLoadDgroup.u32(endGameGamestate + 8),
        lives: saveLoadDgroup.u16(endGameGamestate + 16),
        health: saveLoadDgroup.u16(endGameGamestate + 18),
        ammo: saveLoadDgroup.u16(endGameGamestate + 20),
        keys: saveLoadDgroup.u16(endGameGamestate + 22),
        weapon: saveLoadDgroup.u16(endGameGamestate + 26),
      },
    })}`);
  }

  saveLoadDgroup.setU32(endGameGamestate + 8, 9999);
  const quickSaveKey = mod.WL_MENU_CP_CheckQuick(mod.ID_IN_sc_F8, {
    dgroup: saveLoadDgroup,
    segments: saveLoadSegments,
    font: messageFont,
    skipFontCache: true,
    pickquick: 1,
  });
  const quickKeySavedFile = mod.ID_CA_CA_GetVirtualFile(quickSaveKey.save?.filename ?? "SAVEGAM3.");
  if (
    quickSaveKey.branch !== "quicksave" ||
    quickSaveKey.pending ||
    quickSaveKey.message?.text !== "Saving..." ||
    quickSaveKey.save?.result !== 1 ||
    quickSaveKey.save?.file?.headerName !== "Lab 3" ||
    quickSaveKey.fontState?.fontnumber !== 0 ||
    quickKeySavedFile?.length !== quickSaveKey.save?.file?.totalBytes
  ) {
    fail(`WL_MENU CP_CheckQuick F8 did not dispatch the guarded quicksave path: ${JSON.stringify({
      quickSaveKey,
      quickKeySavedLength: quickKeySavedFile?.length ?? null,
    })}`);
  }

  saveLoadDgroup.setU16(endGameGamestate + 18, 2);
  const quickLoadHooks = [];
  const quickLoadKey = mod.WL_MENU_CP_CheckQuick(mod.ID_IN_sc_F9, {
    dgroup: saveLoadDgroup,
    segments: saveLoadSegments,
    pictable: hudPictable,
    font: messageFont,
    skipFontCache: true,
    pickquick: 1,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      quickLoadHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  if (
    quickLoadKey.branch !== "quickload" ||
    quickLoadKey.pending ||
    quickLoadKey.confirm?.message.text !== "Load Game called\n\"Lab 3\"?" ||
    !quickLoadKey.confirm?.accepted ||
    quickLoadKey.load?.result !== 1 ||
    quickLoadKey.load?.status?.health.number !== 77 ||
    quickLoadKey.border?.pages.length !== 3 ||
    quickLoadKey.fontState?.fontnumber !== 0 ||
    saveLoadDgroup.u32(endGameGamestate + 8) !== 9999 ||
    saveLoadDgroup.u16(endGameGamestate + 18) !== 77 ||
    JSON.stringify(quickLoadHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU CP_CheckQuick F9 did not dispatch the guarded quickload path: ${JSON.stringify({
      quickLoadKey,
      quickLoadHooks,
      score: saveLoadDgroup.u32(endGameGamestate + 8),
      health: saveLoadDgroup.u16(endGameGamestate + 18),
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_US_US_RestoreWindow({ x: 11, y: 22, w: 123, h: 77, px: 3, py: 4 });
  mod.ID_VL_VL_SetBufferOffset(0);
  const quickQuitHooks = [];
  const quickQuit = mod.WL_MENU_CP_CheckQuick(mod.ID_IN_sc_F10, {
    endStringIndex: 0,
    font: messageFont,
    skipFontCache: true,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      quickQuitHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  if (
    quickQuit.branch !== "quit" ||
    quickQuit.pending ||
    quickQuit.window160?.windowX !== 0 ||
    quickQuit.window160?.windowY !== 0 ||
    quickQuit.window160?.windowW !== 320 ||
    quickQuit.window160?.windowH !== 160 ||
    quickQuit.quit?.promptIndex !== 0 ||
    quickQuit.quit?.prompt !== "Dost thou wish to\nleave with such hasty\nabandon?" ||
    quickQuit.quit?.rnd !== null ||
    !quickQuit.quit?.accepted ||
    !quickQuit.quit?.quitRequested ||
    quickQuit.quit?.redraw !== null ||
    quickQuit.quit?.adlibWrites.length !== 0xf5 ||
    quickQuit.quit?.adlibWrites[0]?.register !== 1 ||
    quickQuit.quit?.adlibWrites.at(-1)?.register !== 0xf5 ||
    quickQuit.border?.pages.length !== 3 ||
    quickQuit.window200?.windowH !== 200 ||
    quickQuit.fontState?.fontnumber !== 0 ||
    JSON.stringify(quickQuitHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU CP_CheckQuick F10 did not mirror the original in-game quit branch: ${JSON.stringify({
      quickQuit,
      quickQuitHooks,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const quitHooks = [];
  const quit = mod.WL_MENU_CP_Quit({
    endStringIndex: 0,
    font: messageFont,
    maxPolls: 8,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      quitHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  if (
    quit.promptIndex !== 0 ||
    quit.prompt !== "Dost thou wish to\nleave with such hasty\nabandon?" ||
    quit.rnd !== null ||
    !quit.accepted ||
    !quit.confirm.accepted ||
    quit.update === null ||
    quit.musicOff === null ||
    quit.stopSound === null ||
    quit.fade?.start !== 0 ||
    quit.fade?.end !== 255 ||
    quit.fade?.steps !== 10 ||
    quit.adlibWrites.length !== 0xf5 ||
    quit.adlibWrites[0]?.register !== 1 ||
    quit.adlibWrites[0]?.value !== 0 ||
    quit.adlibWrites.at(-1)?.register !== 0xf5 ||
    quit.adlibWrites.at(-1)?.value !== 0 ||
    !quit.quitRequested ||
    quit.redraw !== null ||
    JSON.stringify(quitHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ])
  ) {
    fail(`WL_MENU CP_Quit did not mirror the original accepted quit sequence: ${JSON.stringify({
      quit,
      quitHooks,
    })}`);
  }

  const readThisCalls = [];
  const readThis = mod.WL_MENU_CP_ReadThis({
    skipMusic: true,
    helpScreens: () => {
      readThisCalls.push("help");
      return "help-screens";
    },
  });
  if (
    readThis.cornerMusic !== null ||
    readThis.helpScreens !== "help-screens" ||
    readThis.menuMusic !== null ||
    JSON.stringify(readThisCalls) !== JSON.stringify(["help"])
  ) {
    fail(`WL_MENU CP_ReadThis did not mirror the original help-screen music shell: ${JSON.stringify({
      readThis,
      readThisCalls,
    })}`);
  }

  const scoreCalls = [];
  const viewScores = mod.WL_MENU_CP_ViewScores({
    skipMusic: true,
    skipFade: true,
    drawHighScores: () => {
      scoreCalls.push("draw");
      return "scores";
    },
    ackMaxPolls: 0,
  });
  if (
    viewScores.font0.fontnumber !== 0 ||
    viewScores.scoreMusic !== null ||
    viewScores.drawHighScores !== "scores" ||
    viewScores.update === null ||
    viewScores.fadeIn !== null ||
    viewScores.font1.fontnumber !== 1 ||
    viewScores.ack ||
    viewScores.menuMusic !== null ||
    viewScores.fadeOut !== null ||
    JSON.stringify(scoreCalls) !== JSON.stringify(["draw"])
  ) {
    fail(`WL_MENU CP_ViewScores did not mirror the original score-screen shell: ${JSON.stringify({
      viewScores,
      scoreCalls,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  const newGameDgroup = new mod.DOSMemory(0x10000);
  [1, 1, 1, 1, 1, 1].forEach((selected, index) => {
    mod.WL_MENU_EpisodeSelect[index] = selected;
  });
  mod.WL_MENU_MainMenu[6].active = 2;
  const newGame = mod.WL_MENU_CP_NewGame({
    dgroup: newGameDgroup,
    episodeSelection: 0,
    difficultySelection: 2,
    skipEpisodeDraw: true,
    skipDifficultyDraw: true,
    skipFade: true,
  });
  if (
    newGame.cancelled ||
    newGame.cancelReason !== null ||
    newGame.episodeSelection !== 0 ||
    newGame.episode !== 0 ||
    !newGame.episodeAllowed ||
    newGame.difficultySelection !== 2 ||
    newGame.newGame?.difficulty !== 2 ||
    newGame.newGame?.episode !== 0 ||
    !newGame.newGame?.startgame ||
    newGame.startGame !== 1 ||
    newGame.readThisActive !== 1 ||
    newGame.pickquick !== 0 ||
    newGameDgroup.u16(endGameGamestate + 0) !== 2 ||
    newGameDgroup.u32(endGameGamestate + 12) !== 40000 ||
    newGameDgroup.u16(endGameGamestate + 16) !== 3 ||
    newGameDgroup.u16(endGameGamestate + 18) !== 100 ||
    newGameDgroup.u16(endGameGamestate + 20) !== 8 ||
    newGameDgroup.u16(endGameGamestate + 24) !== 1 ||
    newGameDgroup.u16(endGameGamestate + 26) !== 1 ||
    newGameDgroup.u16(endGameGamestate + 28) !== 1 ||
    newGameDgroup.u16(endGameGamestate + 38) !== 0 ||
    mod.WL_MENU_MainMenu[6].active !== 1
  ) {
    fail(`WL_MENU CP_NewGame did not mirror the original new-game state transition: ${JSON.stringify({
      newGame,
      gamestate: {
        difficulty: newGameDgroup.u16(endGameGamestate + 0),
        nextextra: newGameDgroup.u32(endGameGamestate + 12),
        lives: newGameDgroup.u16(endGameGamestate + 16),
        health: newGameDgroup.u16(endGameGamestate + 18),
        ammo: newGameDgroup.u16(endGameGamestate + 20),
        bestweapon: newGameDgroup.u16(endGameGamestate + 24),
        weapon: newGameDgroup.u16(endGameGamestate + 26),
        chosenweapon: newGameDgroup.u16(endGameGamestate + 28),
        episode: newGameDgroup.u16(endGameGamestate + 38),
      },
    })}`);
  }
  mod.WL_MENU_MainMenu[6].active = 2;

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  const getYorNHooks = [];
  const getYorN = mod.WL_MENU_GetYorN(7, 8, 24, {
    pictable: menuPictable,
    chunks: menuChunks,
    maxPolls: 4,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll }) => {
      getYorNHooks.push([phase, poll]);
      if (phase === "wait" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Y, true, 89);
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const getYorNInputState = mod.ID_IN_IN_DebugState();
  const getYorNSoundState = mod.ID_SD_SD_DebugState();
  if (
    !getYorN.accepted ||
    getYorN.xit !== 1 ||
    getYorN.x !== 7 ||
    getYorN.y !== 8 ||
    getYorN.pic !== 24 ||
    getYorN.cached ||
    getYorN.uncached ||
    getYorN.draw.x !== 56 ||
    getYorN.draw.y !== 64 ||
    getYorN.draw.draw?.bytes !== 8 ||
    getYorN.update.blocks !== 1 ||
    getYorN.waitPolls !== 0 ||
    getYorN.releasePolls !== 1 ||
    getYorNInputState.pressedKeys.length !== 0 ||
    getYorNSoundState.SoundNumber !== 32 ||
    getYorNSoundState.SoundPriority !== 8 ||
    JSON.stringify(getYorNHooks) !== JSON.stringify([
      ["wait", 0],
      ["release", 0],
    ]) ||
    planePixel(56, 64) !== 0x70
  ) {
    fail(`WL_MENU GetYorN did not mirror the original picture prompt Y/N sequencing: ${JSON.stringify({
      getYorN,
      getYorNHooks,
      getYorNInputState,
      getYorNSoundState,
    })}`);
  }

  mod.ID_CA_grsegs[10] = new Uint8Array([1]);
  mod.ID_CA_grsegs[42] = new Uint8Array([2]);
  mod.ID_CA_grneeded[10] = 1;
  mod.ID_CA_grneeded[42] = 1;
  mod.ID_VH_VW_SetFontState({ fontnumber: 1 });
  const cleanupControl = mod.WL_MENU_CleanupControlPanel();
  if (
    cleanupControl.controls.start !== 10 ||
    cleanupControl.controls.end !== 42 ||
    cleanupControl.controls.cached !== 2 ||
    cleanupControl.controls.skipped !== 31 ||
    mod.ID_CA_grsegs[10] !== null ||
    mod.ID_CA_grsegs[42] !== null ||
    (mod.ID_CA_grneeded[10] & 1) ||
    (mod.ID_CA_grneeded[42] & 1) ||
    cleanupControl.fontState.fontnumber !== 0 ||
    mod.ID_VH_fontnumber !== 0
  ) {
    fail(`WL_MENU CleanupControlPanel did not uncache the controls lump and reset fontnumber: ${JSON.stringify(cleanupControl)}`);
  }

  mod.ID_CA_grsegs[2] = messageFont;
  mod.ID_US_US_SetPrintRoutines(mod.ID_VH_VW_MeasurePropString, mod.ID_VH_VW_DrawPropString);
  const lsAction = mod.WL_MENU_DrawLSAction(1, { pictable: menuPictable, chunks: menuChunks });
  if (
    lsAction.which !== 1 ||
    lsAction.window.x !== 96 ||
    lsAction.window.y !== 80 ||
    lsAction.window.w !== 130 ||
    lsAction.window.h !== 42 ||
    lsAction.outline.color1 !== 0 ||
    lsAction.outline.color2 !== 0x13 ||
    lsAction.disk.x !== 104 ||
    lsAction.disk.y !== 85 ||
    lsAction.disk.draw?.bytes !== 8 ||
    lsAction.fontState.fontnumber !== 1 ||
    lsAction.color.fontcolor !== 0 ||
    lsAction.color.backcolor !== 0x17 ||
    lsAction.print.segments[0]?.text !== "Saving..." ||
    lsAction.print.segments[0]?.x !== 142 ||
    lsAction.print.segments[0]?.y !== 93 ||
    lsAction.finalWindow.px !== 169 ||
    lsAction.finalWindow.py !== 93 ||
    lsAction.update.blocks < 1 ||
    planePixel(104, 85) !== 0x70
  ) {
    fail(`WL_MENU DrawLSAction did not mirror the original save/load progress box: ${JSON.stringify(lsAction)}`);
  }

  mod.ID_CA_grsegs[1] = messageFont;
  mod.ID_CA_grsegs[2] = messageFont;
  mod.WL_MENU_SaveGamesAvail.fill(0);
  mod.WL_MENU_SaveGameNames.fill("");
  mod.WL_MENU_SaveGamesAvail[2] = 1;
  mod.WL_MENU_SaveGameNames[2] = "Floor 2";
  const emptyLSEntry = mod.WL_MENU_PrintLSEntry(3, 0x17);
  const savedLSEntry = mod.WL_MENU_PrintLSEntry(2, 0x13);
  if (
    mod.WL_MENU_LSItems.x !== 85 ||
    mod.WL_MENU_LSItems.y !== 55 ||
    mod.WL_MENU_LSItems.indent !== 24 ||
    emptyLSEntry.outline.x !== 109 ||
    emptyLSEntry.outline.y !== 94 ||
    emptyLSEntry.outline.w !== 136 ||
    emptyLSEntry.outline.h !== 11 ||
    emptyLSEntry.text !== "      - empty -" ||
    emptyLSEntry.print.segments[0]?.x !== 111 ||
    emptyLSEntry.print.segments[0]?.y !== 95 ||
    emptyLSEntry.finalWindow.px !== 156 ||
    emptyLSEntry.finalFont.fontnumber !== 1 ||
    savedLSEntry.color !== 0x13 ||
    savedLSEntry.text !== "Floor 2" ||
    savedLSEntry.print.segments[0]?.x !== 111 ||
    savedLSEntry.print.segments[0]?.y !== 82 ||
    savedLSEntry.finalWindow.px !== 132 ||
    savedLSEntry.finalFont.fontnumber !== 1
  ) {
    fail(`WL_MENU PrintLSEntry did not mirror the save-slot outline/text sequencing: ${JSON.stringify({
      emptyLSEntry,
      savedLSEntry,
      LSItems: mod.WL_MENU_LSItems,
    })}`);
  }

  const trackedFirst = mod.WL_MENU_TrackWhichGame(2);
  const trackedSecond = mod.WL_MENU_TrackWhichGame(3);
  if (
    trackedFirst.previous !== 0 ||
    trackedFirst.current !== 2 ||
    trackedFirst.previousEntry.color !== 0x17 ||
    trackedFirst.currentEntry.color !== 0x13 ||
    trackedFirst.currentEntry.text !== "Floor 2" ||
    trackedSecond.previous !== 2 ||
    trackedSecond.current !== 3 ||
    trackedSecond.previousEntry.text !== "Floor 2" ||
    trackedSecond.currentEntry.text !== "      - empty -" ||
    trackedSecond.currentEntry.color !== 0x13
  ) {
    fail(`WL_MENU TrackWhichGame did not repaint previous/current save slots like the original static helper: ${JSON.stringify({
      trackedFirst,
      trackedSecond,
    })}`);
  }

  const cpAudioHead = new Uint8Array((288 + 1) * 4);
  const cpAudioHeadView = new DataView(cpAudioHead.buffer, cpAudioHead.byteOffset, cpAudioHead.byteLength);
  cpAudioHeadView.setUint32((mod.ID_SD_STARTMUSIC + 1) * 4, 3, true);
  for (let i = mod.ID_SD_STARTMUSIC + 2; i <= 288; i++) {
    cpAudioHeadView.setUint32(i * 4, 7, true);
  }
  const cpAudioT = Uint8Array.from([0xa0, 0xa1, 0xa2, 0xb0, 0xb1, 0xb2, 0xb3]);
  mod.ID_CA_audiostarts.length = 0;
  mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC] = null;
  mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC + 1] = null;
  mod.ID_CA_audiopurge[mod.ID_SD_STARTMUSIC] = 0;
  mod.ID_CA_audiopurge[mod.ID_SD_STARTMUSIC + 1] = 0;
  mod.ID_SD_SD_ResetSoundState({ MusicMode: mod.ID_SD_smm_AdLib });
  const cpMusic0 = mod.WL_MENU_StartCPMusic(0, { AUDIOHED: cpAudioHead, AUDIOT: cpAudioT });
  const cpMusic1 = mod.WL_MENU_StartCPMusic(1, { AUDIOHED: cpAudioHead, AUDIOT: cpAudioT });
  const cpMusicFreed = mod.WL_MENU_FreeMusic();
  const cpMusicState = mod.ID_SD_SD_DebugState();
  mod.ID_CA_audiostarts.length = 0;
  if (
    cpMusic0.previousSong !== 0 ||
    cpMusic0.previousChunk !== mod.ID_SD_STARTMUSIC ||
    cpMusic0.freedPrevious ||
    cpMusic0.chunk !== mod.ID_SD_STARTMUSIC ||
    cpMusic0.cacheLength !== 3 ||
    !cpMusic0.started.sqActive ||
    cpMusic1.previousSong !== 0 ||
    cpMusic1.previousChunk !== mod.ID_SD_STARTMUSIC ||
    !cpMusic1.freedPrevious ||
    cpMusic1.chunk !== mod.ID_SD_STARTMUSIC + 1 ||
    cpMusic1.cacheLength !== 4 ||
    mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC] !== null ||
    mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC + 1] !== null ||
    !cpMusicFreed.freed ||
    cpMusicFreed.chunk !== mod.ID_SD_STARTMUSIC + 1 ||
    !cpMusicState.sqActive
  ) {
    fail(`WL_MENU StartCPMusic/FreeMusic did not mirror the control-panel music cache lifetime: ${JSON.stringify({
      cpMusic0,
      cpMusic1,
      cpMusicFreed,
      cpMusicState,
      music0Cached: mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC] !== null,
      music1Cached: mod.ID_CA_audiosegs[mod.ID_SD_STARTMUSIC + 1] !== null,
    })}`);
  }

  const printedMenu = [];
  const fakeMeasure = (value) => {
    const text = String(value);
    return { width: text.length * 3, height: 7, chars: text.length };
  };
  const fakeDraw = (value) => {
    const text = String(value);
    const font = mod.ID_VH_VW_DebugFontState();
    printedMenu.push({ text, x: font.px, y: font.py, fontcolor: font.fontcolor, backcolor: font.backcolor });
    return {
      text,
      startX: font.px,
      startY: font.py,
      endX: font.px + text.length * 3,
      width: text.length * 3,
      height: 7,
      chars: text.length,
      pixels: text.length,
      colorized: false,
    };
  };
  mod.ID_US_US_SetPrintRoutines(fakeMeasure, fakeDraw);

  mod.WL_MENU_SaveGamesAvail.fill(0);
  mod.WL_MENU_SaveGameNames.fill("");
  mod.WL_MENU_MainMenu[4].active = 0;
  mod.ID_US_US_RestoreWindow({ x: 11, y: 22, w: 123, h: 77, px: 3, py: 4 });
  const controlPanelSetup = mod.WL_MENU_SetupControlPanel({
    skipResourceCache: true,
    skipLoadAllSounds: true,
    saveFiles: [
      { filename: "SAVEGAM2.WL6", data: "Floor 2\0stale tail" },
      { filename: "SAVEGAMA.WL6", data: "ignored" },
    ],
  });
  const controlPanelSetupFont = mod.ID_VH_VW_DebugFontState();
  if (
    controlPanelSetup.font !== null ||
    controlPanelSetup.controls !== null ||
    controlPanelSetup.fontState.fontnumber !== 1 ||
    controlPanelSetup.fontState.fontcolor !== 0x17 ||
    controlPanelSetup.fontState.backcolor !== 0x2d ||
    controlPanelSetup.window.windowX !== 11 ||
    controlPanelSetup.window.windowH !== 200 ||
    controlPanelSetup.ingame ||
    controlPanelSetup.loadedSounds !== null ||
    controlPanelSetup.mainSaveActive !== 0 ||
    JSON.stringify(controlPanelSetup.saves) !== JSON.stringify([{ slot: 2, filename: "SAVEGAM2.WL6", name: "Floor 2" }]) ||
    controlPanelSetup.mouseCenter[0] !== 120 ||
    controlPanelSetup.mouseCenter[1] !== 120 ||
    mod.WL_MENU_SaveGamesAvail[2] !== 1 ||
    mod.WL_MENU_SaveGameNames[2] !== "Floor 2" ||
    mod.WL_MENU_SaveGamesAvail[0] !== 0 ||
    controlPanelSetupFont.fontnumber !== 1
  ) {
    fail(`WL_MENU SetupControlPanel did not mirror the original setup/save-scan sequence: ${JSON.stringify({
      controlPanelSetup,
      controlPanelSetupFont,
      saveAvail: [...mod.WL_MENU_SaveGamesAvail],
      saveNames: [...mod.WL_MENU_SaveGameNames],
    })}`);
  }

  mod.ID_IN_IN_ResetInputState({ JoysPresent: [true, false] });
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const calibrateHooks = [];
  const calibration = mod.WL_MENU_CalibrateJoystick({
    pictable: menuPictable,
    chunks: menuChunks,
    maxPolls: 4,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll, buttons }) => {
      calibrateHooks.push([phase, poll, buttons]);
      if (phase === "first-wait" && poll === 0) {
        mod.ID_IN_IN_SetJoyState(0, { x: 100, y: 200, buttons: 1 });
      }
      if (phase === "second-wait" && poll === 0) {
        mod.ID_IN_IN_SetJoyState(0, { x: 900, y: 1000, buttons: 2 });
      }
      if (phase === "release" && poll === 0) {
        mod.ID_IN_IN_SetJoyState(0, { buttons: 0 });
      }
    },
  });
  const calibrationPrinted = printedMenu.splice(0);
  const calibrationSound = mod.ID_SD_SD_DebugState();
  if (
    !calibration.success ||
    calibration.exitReason !== "calibrated" ||
    calibration.firstScreen.window.x !== 80 ||
    calibration.firstScreen.window.y !== 35 ||
    calibration.firstScreen.window.w !== 158 ||
    calibration.firstScreen.window.h !== 140 ||
    calibration.firstScreen.picnum !== 41 ||
    calibration.firstScreen.icon.x !== 120 ||
    calibration.firstScreen.icon.y !== 70 ||
    calibration.secondScreen?.picnum !== 42 ||
    calibration.firstPolls !== 1 ||
    calibration.secondPolls !== 1 ||
    calibration.releasePolls !== 1 ||
    calibration.min?.x !== 100 ||
    calibration.min?.y !== 200 ||
    calibration.max?.x !== 900 ||
    calibration.max?.y !== 1000 ||
    calibration.firstSound !== false ||
    calibration.secondSound !== false ||
    calibration.setup?.joyMinX !== 100 ||
    calibration.setup?.joyMaxX !== 900 ||
    calibration.setup?.threshMinX !== 234 ||
    calibration.setup?.threshMaxX !== 766 ||
    calibration.setup?.joyMinY !== 200 ||
    calibration.setup?.joyMaxY !== 1000 ||
    calibration.setup?.threshMinY !== 334 ||
    calibration.setup?.threshMaxY !== 866 ||
    calibration.debugPauseRequested ||
    calibrationSound.SoundNumber !== 32 ||
    planePixel(120, 70) !== 0xe8 ||
    JSON.stringify(calibrateHooks) !== JSON.stringify([
      ["first-wait", 0, 0],
      ["second-wait", 0, 0],
      ["release", 0, 2],
    ]) ||
    !calibrationPrinted.some((entry) => entry.text === "Move joystick to") ||
    !calibrationPrinted.some((entry) => entry.text === "lower right and")
  ) {
    fail(`WL_MENU CalibrateJoystick did not mirror the original prompt/button/setup flow: ${JSON.stringify({
      calibration,
      calibrateHooks,
      calibrationSound,
      calibrationPrinted,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState({ JoysPresent: [true, false] });
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_CtlItems.curpos = -1;
  mod.WL_MENU_CusItems.curpos = 3;
  const controlHooks = [];
  const controlPanel = mod.WL_MENU_CP_Control({
    pictable: menuPictable,
    chunks: menuChunks,
    maxPolls: 4,
    selections: [0, 0, 1, 1, 2, 2, 3, 3, -1],
    calibrateOptions: {
      maxPolls: 4,
      maxReleasePolls: 4,
      pollHook: ({ phase, poll, buttons }) => {
        controlHooks.push([phase, poll, buttons]);
        if (phase === "first-wait" && poll === 0) {
          mod.ID_IN_IN_SetJoyState(0, { x: 120, y: 220, buttons: 1 });
        }
        if (phase === "second-wait" && poll === 0) {
          mod.ID_IN_IN_SetJoyState(0, { x: 920, y: 1020, buttons: 2 });
        }
        if (phase === "release" && poll === 0) {
          mod.ID_IN_IN_SetJoyState(0, { buttons: 0 });
        }
      },
    },
  });
  printedMenu.splice(0);
  const controlSound = mod.ID_SD_SD_DebugState();
  if (
    controlPanel.initial.wait !== undefined ||
    controlPanel.initialWait.polls !== 1 ||
    controlPanel.actions.length !== 8 ||
    controlPanel.exitSelection !== -1 ||
    controlPanel.actions[0].which !== 0 ||
    controlPanel.actions[0].before.mouseenabled ||
    !controlPanel.actions[0].after.mouseenabled ||
    controlPanel.actions[0].mouseCenter[0] !== 120 ||
    controlPanel.actions[1].after.mouseenabled ||
    controlPanel.actions[2].which !== 1 ||
    !controlPanel.actions[2].calibration?.success ||
    !controlPanel.actions[2].after.joystickenabled ||
    controlPanel.actions[3].calibration !== null ||
    controlPanel.actions[3].after.joystickenabled ||
    controlPanel.actions[4].after.joystickport !== 1 ||
    controlPanel.actions[5].after.joystickport !== 0 ||
    !controlPanel.actions[6].after.joypadenabled ||
    controlPanel.actions[7].after.joypadenabled ||
    controlPanel.finalState.mouseenabled ||
    controlPanel.finalState.joystickenabled ||
    controlPanel.finalState.joystickport !== 0 ||
    controlPanel.finalState.joypadenabled ||
    controlPanel.finalState.cusCurpos !== -1 ||
    controlSound.SoundNumber !== 32 ||
    JSON.stringify(controlHooks) !== JSON.stringify([
      ["first-wait", 0, 0],
      ["second-wait", 0, 0],
      ["release", 0, 2],
    ])
  ) {
    fail(`WL_MENU CP_Control did not mirror the original control toggle sequence: ${JSON.stringify({
      controlPanel,
      controlHooks,
      controlSound,
    })}`);
  }
  mod.WL_MENU_CtlItems.curpos = -1;

  mod.ID_IN_IN_ResetInputState();
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.WL_MENU_CusItems.curpos = -1;
  [1, 0, 0, 1, 0, 0, 1, 0, 1].forEach((active, index) => {
    mod.WL_MENU_CusMenu[index].active = active;
  });
  const customScreen = mod.WL_MENU_DrawCustomScreen({ pictable: menuPictable, chunks: menuChunks });
  const customPrinted = printedMenu.splice(0);
  const customPrintedText = customPrinted.filter((entry) => entry.text.length > 0);
  if (
    customScreen.background.background.draw?.pixels !== 64000 ||
    customScreen.initialWindow.windowX !== 0 ||
    customScreen.initialWindow.windowW !== 320 ||
    customScreen.mouseBack.x !== 112 ||
    customScreen.mouseBack.y !== 184 ||
    customScreen.stripes.y !== 10 ||
    customScreen.title.x !== 80 ||
    customScreen.title.y !== 0 ||
    customScreen.title.draw?.bytes !== 8 ||
    customScreen.mouse.heading?.segments[0]?.text !== "Mouse" ||
    customScreen.mouse.heading?.segments[0]?.x !== 152 ||
    customScreen.mouse.heading?.segments[0]?.y !== 48 ||
    customScreen.mouse.labels.runOrLeft.segments[0]?.text !== "Run" ||
    customScreen.mouse.labels.runOrLeft.segments[0]?.x !== 60 ||
    customScreen.mouse.labels.strafeOrBkwd.segments[0]?.text !== "Strafe" ||
    customScreen.mouse.rowWindow.y !== 61 ||
    customScreen.mouse.row.color !== 0x2b ||
    customScreen.mouse.row.menuActive !== 0 ||
    JSON.stringify(customScreen.mouse.row.prints.map((entry) => entry.text)) !== JSON.stringify([null, "b2", "b0", "b1"]) ||
    customScreen.joystick.heading?.segments[0]?.text !== "Joystick/Gravis GamePad" ||
    customScreen.joystick.rowWindow.y !== 94 ||
    customScreen.joystick.row.color !== 0x2b ||
    customScreen.joystick.row.menuActive !== 0 ||
    JSON.stringify(customScreen.joystick.row.prints.map((entry) => entry.text)) !== JSON.stringify(["b3", "b2", "b0", "b1"]) ||
    customScreen.keyboardButtons.heading?.segments[0]?.text !== "Keyboard" ||
    customScreen.keyboardButtons.rowWindow.y !== 133 ||
    customScreen.keyboardButtons.row.color !== 0x17 ||
    JSON.stringify(customScreen.keyboardButtons.row.prints.map((entry) => entry.text)) !== JSON.stringify(["RShft", "Space", "Ctrl", "Alt"]) ||
    customScreen.keyboardMove.heading !== null ||
    customScreen.keyboardMove.rowWindow.y !== 165 ||
    customScreen.keyboardMove.row.prints[0]?.x !== 60 ||
    JSON.stringify(customScreen.keyboardMove.row.prints.map((entry) => entry.text)) !== JSON.stringify(["Left", "Right", "Up", "Down"]) ||
    customScreen.pickedCurpos !== 6 ||
    customScreen.update.blocks !== 260 ||
    customScreen.fade !== null ||
    mod.WL_MENU_CusItems.curpos !== 6 ||
    mod.WL_MENU_CusMenu[0].active !== 0 ||
    mod.WL_MENU_CusMenu[3].active !== 0 ||
    planePixel(80, 0) !== 0xc8 ||
    planePixel(112, 184) !== 0x50 ||
    !customPrintedText.some((entry) => entry.text === "Joystick/Gravis GamePad") ||
    !customPrintedText.some((entry) => entry.text === "RShft")
  ) {
    fail(`WL_MENU DrawCustomScreen did not mirror the original custom-control layout: ${JSON.stringify({
      customScreen,
      customPrinted,
    })}`);
  }

  const fixKeybd = mod.WL_MENU_FixupCustom(6);
  const fixKeys = mod.WL_MENU_FixupCustom(8);
  printedMenu.splice(0);
  if (
    fixKeybd.w !== 6 ||
    fixKeybd.previous !== -1 ||
    fixKeybd.currentLines.y !== 152 ||
    fixKeybd.currentDraw?.kind !== "keybd" ||
    fixKeybd.currentDraw?.color !== 0x13 ||
    fixKeys.w !== 8 ||
    fixKeys.previous !== 6 ||
    fixKeys.currentLines.y !== 178 ||
    fixKeys.previousLines?.y !== 152 ||
    fixKeys.currentDraw?.kind !== "keys" ||
    fixKeys.currentDraw?.color !== 0x13 ||
    fixKeys.previousDraw?.kind !== "keybd" ||
    fixKeys.previousDraw?.color !== 0x17 ||
    JSON.stringify(fixKeys.currentDraw?.prints.map((entry) => entry.text)) !== JSON.stringify(["Left", "Right", "Up", "Down"])
  ) {
    fail(`WL_MENU FixupCustom did not mirror custom-row overdraw repair: ${JSON.stringify({
      fixKeybd,
      fixKeys,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_SD_SoundTable[39] = { length: 3, priority: 7, data: [1, 2, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  [0x1d, 0x38, 0x36, 0x39, 0x02, 0x03, 0x04, 0x05].forEach((scan, index) => {
    mod.WL_PLAY_buttonscan[index] = scan;
  });
  const defineHooks = [];
  const defineKeyBtns = mod.WL_MENU_DefineKeyBtns({
    maxPolls: 4,
    maxPickPolls: 4,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll, which, type }) => {
      defineHooks.push([phase, poll, which, type]);
      if (phase === "loop" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Enter, true);
      }
      if (phase === "pick" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_A, true, 65);
      }
      if (phase === "loop" && poll === 1) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Escape, true);
      }
      if (phase === "final-release" && poll === 1) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const definePrinted = printedMenu.splice(0);
  const defineInput = mod.ID_IN_IN_DebugState();
  if (
    defineKeyBtns.index !== 8 ||
    defineKeyBtns.type !== mod.WL_MENU_KEYBOARDBTNS ||
    JSON.stringify(defineKeyBtns.allowed) !== JSON.stringify([1, 1, 1, 1]) ||
    defineKeyBtns.enter.initialWhich !== 0 ||
    defineKeyBtns.enter.printY !== 152 ||
    defineKeyBtns.enter.redraws.length !== 2 ||
    defineKeyBtns.enter.redraws[0].x !== 60 ||
    defineKeyBtns.enter.redraws[0].print.text !== "RShft" ||
    defineKeyBtns.enter.redraws[1].print.text !== "A" ||
    defineKeyBtns.enter.picks.length !== 1 ||
    defineKeyBtns.enter.picks[0].scan !== mod.ID_IN_sc_A ||
    defineKeyBtns.enter.picks[0].sound !== false ||
    defineKeyBtns.enter.picks[0].bindings.buttonscan[2] !== mod.ID_IN_sc_A ||
    defineKeyBtns.enter.exit !== 1 ||
    defineKeyBtns.enter.finalWait.polls !== 2 ||
    defineKeyBtns.enter.finalClearWindow.y !== 151 ||
    defineKeyBtns.enter.finalBindings.buttonscan[2] !== mod.ID_IN_sc_A ||
    mod.WL_PLAY_buttonscan[2] !== mod.ID_IN_sc_A ||
    defineInput.pressedKeys.length !== 0 ||
    JSON.stringify(defineHooks.filter((entry) => ["loop", "pick", "final-release"].includes(entry[0]))) !==
      JSON.stringify([
        ["loop", 0, 0, mod.WL_MENU_KEYBOARDBTNS],
        ["pick", 0, 0, mod.WL_MENU_KEYBOARDBTNS],
        ["loop", 1, 0, mod.WL_MENU_KEYBOARDBTNS],
        ["final-release", 1, 0, mod.WL_MENU_KEYBOARDBTNS],
      ]) ||
    !definePrinted.some((entry) => entry.text === "A")
  ) {
    fail(`WL_MENU DefineKeyBtns/EnterCtrlData did not mirror keyboard remapping flow: ${JSON.stringify({
      defineKeyBtns,
      defineHooks,
      defineInput,
      definePrinted,
      buttonscan: mod.WL_PLAY_buttonscan,
    })}`);
  }
  [0x1d, 0x38, 0x36, 0x39, 0x02, 0x03, 0x04, 0x05].forEach((scan, index) => {
    mod.WL_PLAY_buttonscan[index] = scan;
  });

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_CusItems.curpos = -1;
  [1, 0, 0, 1, 0, 0, 1, 0, 1].forEach((active, index) => {
    mod.WL_MENU_CusMenu[index].active = active;
  });
  const customControls = mod.WL_MENU_CustomControls({ pictable: menuPictable, chunks: menuChunks, selections: [-1] });
  printedMenu.splice(0);
  if (
    customControls.initial.title.x !== 80 ||
    customControls.initial.pickedCurpos !== 6 ||
    customControls.actions.length !== 0 ||
    customControls.exitSelection !== -1 ||
    customControls.fade !== null ||
    mod.WL_MENU_CusItems.curpos !== 6
  ) {
    fail(`WL_MENU CustomControls did not mirror the custom-control dispatch shell: ${JSON.stringify({
      customControls,
      CusItems: mod.WL_MENU_CusItems,
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const mouseSens = mod.WL_MENU_DrawMouseSens({ pictable: menuPictable, chunks: menuChunks });
  const mouseSensPrinted = printedMenu.splice(0);
  if (
    mouseSens.background.background.draw?.pixels !== 64000 ||
    mouseSens.mouseBack.x !== 112 ||
    mouseSens.mouseBack.y !== 184 ||
    mouseSens.mouseBack.draw?.bytes !== 8 ||
    mouseSens.window.x !== 10 ||
    mouseSens.window.y !== 80 ||
    mouseSens.window.w !== 300 ||
    mouseSens.window.h !== 30 ||
    mouseSens.headingColor.fontcolor !== 0x4a ||
    mouseSens.heading.segments[0]?.text !== "Adjust Mouse Sensitivity" ||
    mouseSens.heading.segments[0]?.x !== 124 ||
    mouseSens.heading.segments[0]?.y !== 82 ||
    mouseSens.slow.segments[0]?.x !== 14 ||
    mouseSens.slow.segments[0]?.y !== 95 ||
    mouseSens.fast.segments[0]?.x !== 269 ||
    mouseSens.fast.segments[0]?.y !== 95 ||
    mouseSens.mouseadjustment !== mod.WL_MAIN_mouseadjustment ||
    mouseSens.mouseadjustment !== 5 ||
    mouseSens.bar.draw?.pixels !== 2000 ||
    mouseSens.barOutline.top.draw?.pixels !== 201 ||
    mouseSens.knobOutline.x !== 160 ||
    mouseSens.knob.draw?.pixels !== 171 ||
    mouseSens.update.blocks !== 260 ||
    mouseSens.fade !== null ||
    planePixel(112, 184) !== 0x50 ||
    planePixel(60, 97) !== 0x13 ||
    planePixel(161, 98) !== 0x47 ||
    JSON.stringify(mouseSensPrinted.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["Adjust Mouse Sensitivity", 124, 82, 0x4a],
        ["Slow", 14, 95, 0x17],
        ["Fast", 269, 95, 0x17],
      ])
  ) {
    fail(`WL_MENU DrawMouseSens did not mirror the original mouse sensitivity layout: ${JSON.stringify({
      mouseSens,
      mouseSensPrinted,
      mouseAdjustment: mod.WL_MAIN_mouseadjustment,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[5] = { length: 3, priority: 6, data: [1, 2, 0] };
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MAIN_SetMouseAdjustment(5);
  const mouseSensitivityHooks = [];
  const mouseSensitivity = mod.WL_MENU_MouseSensitivity({
    pictable: menuPictable,
    chunks: menuChunks,
    maxPolls: 4,
    maxReleasePolls: 4,
    pollHook: ({ phase, poll, mouseadjustment }) => {
      mouseSensitivityHooks.push([phase, poll, mouseadjustment]);
      if (phase === "loop" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_RightArrow, true);
      }
      if (phase === "release" && poll === 1) {
        mod.ID_IN_IN_ClearKeysDown();
      }
      if (phase === "loop" && poll >= 1) {
        mod.ID_IN_IN_ClearKeysDown();
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Space, true);
      }
      if (phase === "final-release" && poll === 1) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const mouseSensitivityPrinted = printedMenu.splice(0);
  const mouseSensitivitySound = mod.ID_SD_SD_DebugState();
  const mouseSensitivityInput = mod.ID_IN_IN_DebugState();
  if (
    mouseSensitivity.oldMouseAdjustment !== 5 ||
    mouseSensitivity.initial.mouseadjustment !== 5 ||
    mouseSensitivity.polls !== 2 ||
    mouseSensitivity.steps.length !== 1 ||
    mouseSensitivity.steps[0].direction !== "increase" ||
    mouseSensitivity.steps[0].mouseadjustment !== 6 ||
    mouseSensitivity.steps[0].soundPlayed !== false ||
    mouseSensitivity.steps[0].wait.polls !== 1 ||
    mouseSensitivity.steps[0].update.blocks < 1 ||
    mouseSensitivity.exit !== 1 ||
    mouseSensitivity.restored ||
    mouseSensitivity.finalMouseAdjustment !== 6 ||
    mouseSensitivity.debugPauseRequested ||
    mouseSensitivity.finalSound !== false ||
    mouseSensitivity.finalWait.polls !== 2 ||
    mouseSensitivity.fade !== null ||
    mod.WL_MAIN_mouseadjustment !== 6 ||
    mouseSensitivitySound.SoundNumber !== 32 ||
    mouseSensitivityInput.pressedKeys.length !== 0 ||
    planePixel(181, 98) !== 0x47 ||
    JSON.stringify(mouseSensitivityHooks) !==
      JSON.stringify([
        ["loop", 0, 5],
        ["loop", 1, 6],
        ["final-release", 1, 6],
      ]) ||
    mouseSensitivityPrinted.filter((entry) => entry.text === "Adjust Mouse Sensitivity").length !== 1
  ) {
    fail(`WL_MENU MouseSensitivity did not mirror the original adjustment/accept sequence: ${JSON.stringify({
      mouseSensitivity,
      mouseSensitivityHooks,
      mouseSensitivitySound,
      mouseSensitivityInput,
      mouseSensitivityPrinted,
    })}`);
  }
  mod.WL_MAIN_SetMouseAdjustment(5);

  mod.ID_IN_IN_ResetInputState();
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_SaveGamesAvail.fill(0);
  mod.WL_MENU_SaveGameNames.fill("");
  mod.WL_MENU_SaveGamesAvail[2] = 1;
  mod.WL_MENU_SaveGameNames[2] = "Floor 2";
  const loadSaveScreen = mod.WL_MENU_DrawLoadSaveScreen(1, { pictable: menuPictable, chunks: menuChunks, maxPolls: 4 });
  const loadSavePrinted = printedMenu.splice(0);
  if (
    loadSaveScreen.loadsave !== 1 ||
    loadSaveScreen.background.background.draw?.pixels !== 64000 ||
    loadSaveScreen.fontState.fontnumber !== 1 ||
    loadSaveScreen.mouseBack.draw?.bytes !== 8 ||
    loadSaveScreen.window.x !== 75 ||
    loadSaveScreen.window.y !== 50 ||
    loadSaveScreen.window.w !== 175 ||
    loadSaveScreen.window.h !== 140 ||
    loadSaveScreen.stripes.y !== 10 ||
    loadSaveScreen.titlePic !== 29 ||
    loadSaveScreen.title.x !== 56 ||
    loadSaveScreen.title.y !== 0 ||
    loadSaveScreen.title.draw?.bytes !== 8 ||
    loadSaveScreen.entries.length !== 10 ||
    loadSaveScreen.entries[2]?.text !== "Floor 2" ||
    loadSaveScreen.entries[3]?.text !== "      - empty -" ||
    loadSaveScreen.menu.rows.length !== 10 ||
    loadSaveScreen.menu.window.windowX !== 109 ||
    loadSaveScreen.menu.window.windowY !== 55 ||
    loadSaveScreen.update.blocks !== 260 ||
    loadSaveScreen.fade !== null ||
    loadSaveScreen.wait?.polls !== 1 ||
    mod.WL_MENU_LSMenu.length !== 10 ||
    planePixel(56, 0) !== 0x90 ||
    planePixel(112, 184) !== 0x2d ||
    loadSavePrinted.filter((entry) => entry.text === "Floor 2").length !== 1
  ) {
    fail(`WL_MENU DrawLoadSaveScreen did not mirror the save-game screen draw sequence: ${JSON.stringify({
      loadSaveScreen,
      loadSavePrinted,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  const newGameScreen = mod.WL_MENU_DrawNewGame({ pictable: menuPictable, chunks: menuChunks, maxPolls: 4 });
  const newGamePrinted = printedMenu.splice(0);
  const newGamePrintedText = newGamePrinted.filter((entry) => entry.text.length > 0);
  if (
    newGameScreen.background.background.draw?.pixels !== 64000 ||
    newGameScreen.mouseBack.x !== 112 ||
    newGameScreen.mouseBack.y !== 184 ||
    newGameScreen.mouseBack.draw?.bytes !== 8 ||
    newGameScreen.headingColor.fontcolor !== 0x47 ||
    newGameScreen.heading.segments[0]?.text !== "How tough are you?" ||
    newGameScreen.heading.segments[0]?.x !== 70 ||
    newGameScreen.heading.segments[0]?.y !== 68 ||
    newGameScreen.window.x !== 45 ||
    newGameScreen.window.y !== 90 ||
    newGameScreen.window.w !== 225 ||
    newGameScreen.window.h !== 67 ||
    newGameScreen.menu.iteminfo.curpos !== 2 ||
    newGameScreen.menu.window.windowX !== 74 ||
    newGameScreen.menu.window.windowY !== 100 ||
    newGameScreen.menu.rows.length !== 4 ||
    newGameScreen.menu.rows[2].textColor.fontcolor !== 0x13 ||
    newGameScreen.difficulty.w !== 2 ||
    newGameScreen.difficulty.picnum !== 21 ||
    newGameScreen.difficulty.draw.x !== 232 ||
    newGameScreen.difficulty.draw.y !== 107 ||
    newGameScreen.difficulty.draw.draw?.bytes !== 8 ||
    newGameScreen.update.blocks !== 260 ||
    newGameScreen.fade !== null ||
    newGameScreen.wait?.polls !== 1 ||
    mod.WL_MENU_NewItems.x !== 50 ||
    mod.WL_MENU_NewItems.curpos !== 2 ||
    mod.WL_MENU_NewMenu[3].string !== "I am Death incarnate!" ||
    planePixel(112, 184) !== 0x50 ||
    planePixel(232, 107) !== 0x60 ||
    JSON.stringify(newGamePrintedText.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["How tough are you?", 70, 68, 0x47],
        ["Can I play, Daddy?", 74, 100, 0x17],
        ["Don't hurt me.", 74, 113, 0x17],
        ["Bring 'em on!", 74, 126, 0x13],
        ["I am Death incarnate!", 74, 139, 0x17],
      ])
  ) {
    fail(`WL_MENU DrawNewGame did not mirror the original difficulty screen sequence: ${JSON.stringify({
      newGameScreen,
      newGamePrinted,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_NewEitems.curpos = 0;
  const newEpisodeScreen = mod.WL_MENU_DrawNewEpisode({ pictable: menuPictable, chunks: menuChunks, maxPolls: 4 });
  const newEpisodePrinted = printedMenu.splice(0);
  const newEpisodePrintedText = newEpisodePrinted.filter((entry) => entry.text.length > 0);
  if (
    newEpisodeScreen.background.background.draw?.pixels !== 64000 ||
    newEpisodeScreen.mouseBack.x !== 112 ||
    newEpisodeScreen.mouseBack.y !== 184 ||
    newEpisodeScreen.window.x !== 6 ||
    newEpisodeScreen.window.y !== 19 ||
    newEpisodeScreen.window.w !== 308 ||
    newEpisodeScreen.window.h !== 162 ||
    newEpisodeScreen.headingWindow.windowX !== 0 ||
    newEpisodeScreen.headingWindow.windowW !== 320 ||
    newEpisodeScreen.heading.segments[0]?.text !== "Which episode to play?" ||
    newEpisodeScreen.heading.segments[0]?.x !== 127 ||
    newEpisodeScreen.heading.segments[0]?.y !== 2 ||
    newEpisodeScreen.menuColor.fontcolor !== 0x17 ||
    newEpisodeScreen.menu.iteminfo.amount !== 11 ||
    newEpisodeScreen.menu.window.windowX !== 98 ||
    newEpisodeScreen.menu.window.windowY !== 23 ||
    newEpisodeScreen.menu.rows[0].textColor.fontcolor !== 0x13 ||
    newEpisodeScreen.menu.rows[2].textColor.fontcolor !== 0x6b ||
    newEpisodeScreen.episodePics.length !== 6 ||
    newEpisodeScreen.episodePics[0].x !== 40 ||
    newEpisodeScreen.episodePics[0].y !== 23 ||
    newEpisodeScreen.episodePics[5].y !== 153 ||
    newEpisodeScreen.update.blocks !== 260 ||
    newEpisodeScreen.fade !== null ||
    newEpisodeScreen.wait?.polls !== 1 ||
    mod.WL_MENU_EpisodeSelect[0] !== 1 ||
    mod.WL_MENU_NewEmenu[10].string !== "Episode 6\nConfrontation" ||
    planePixel(40, 23) !== 0xd0 ||
    planePixel(40, 49) !== 0xd8 ||
    planePixel(112, 184) !== 0x50 ||
    JSON.stringify(newEpisodePrintedText.slice(0, 4).map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["Which episode to play?", 127, 2, 0x47],
        ["Episode 1", 98, 23, 0x13],
        ["Escape from Wolfenstein", 98, 30, 0x13],
        ["Episode 2", 98, 49, 0x6b],
      ])
  ) {
    fail(`WL_MENU DrawNewEpisode did not mirror the original episode-selection screen: ${JSON.stringify({
      newEpisodeScreen,
      newEpisodePrinted,
    })}`);
  }

  const episodeDetect = mod.WL_MENU_CheckForEpisodes({ files: ["README.TXT", "GAME.WL6"] });
  if (
    episodeDetect.detected !== "WL6" ||
    episodeDetect.extension !== "WL6" ||
    episodeDetect.names.configname !== "CONFIG.WL6" ||
    episodeDetect.names.SaveName !== "SAVEGAM?.WL6" ||
    episodeDetect.names.PageFileName !== "VSWAP.WL6" ||
    episodeDetect.names.audioname !== "AUDIO.WL6" ||
    episodeDetect.names.demoname !== "DEMO?.WL6" ||
    episodeDetect.names.helpfilename !== "HELPART.WL6" ||
    episodeDetect.names.endfilename !== "ENDART1.WL6" ||
    mod.WL_MENU_SaveName !== "SAVEGAM?.WL6" ||
    JSON.stringify(mod.WL_MENU_EpisodeSelect) !== JSON.stringify([1, 1, 1, 1, 1, 1]) ||
    JSON.stringify([2, 4, 6, 8, 10].map((index) => mod.WL_MENU_NewEmenu[index].active)) !==
      JSON.stringify([1, 1, 1, 1, 1])
  ) {
    fail(`WL_MENU CheckForEpisodes did not mirror WL6 file-extension detection: ${JSON.stringify({
      episodeDetect,
      SaveName: mod.WL_MENU_SaveName,
      EpisodeSelect: mod.WL_MENU_EpisodeSelect,
      NewEmenu: mod.WL_MENU_NewEmenu.map((item) => item.active),
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  [1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1].forEach((active, index) => {
    mod.WL_MENU_SndMenu[index].active = active;
  });
  mod.ID_SD_SD_ResetSoundState({
    AdLibPresent: true,
    SoundBlasterPresent: true,
    SoundSourcePresent: true,
    SoundMode: mod.ID_SD_sdm_PC,
    DigiMode: mod.ID_SD_sds_SoundSource,
    MusicMode: mod.ID_SD_smm_AdLib,
  });
  const soundMenu = mod.WL_MENU_DrawSoundMenu({ pictable: menuPictable, chunks: menuChunks });
  const soundMenuPrinted = printedMenu.splice(0);
  const soundMenuPrintedText = soundMenuPrinted.filter((entry) => entry.text.length > 0);
  const selectedSoundButtons = soundMenu.buttons.filter((button) => button.on).map((button) => button.index);
  if (
    soundMenu.background.background.draw?.pixels !== 64000 ||
    soundMenu.mouseBack.draw?.bytes !== 8 ||
    soundMenu.windows[0].x !== 40 ||
    soundMenu.windows[0].y !== 17 ||
    soundMenu.windows[0].w !== 250 ||
    soundMenu.windows[0].h !== 45 ||
    soundMenu.windows[2].y !== 147 ||
    soundMenu.windows[2].h !== 32 ||
    soundMenu.menu.iteminfo.amount !== 12 ||
    soundMenu.menu.window.windowX !== 100 ||
    soundMenu.menu.window.windowY !== 20 ||
    soundMenu.titles[0].x !== 96 ||
    soundMenu.titles[1].y !== 65 ||
    soundMenu.titles[2].y !== 130 ||
    soundMenu.buttons.length !== 8 ||
    JSON.stringify(soundMenu.buttons.map((button) => button.index)) !== JSON.stringify([0, 1, 2, 5, 6, 7, 10, 11]) ||
    JSON.stringify(selectedSoundButtons) !== JSON.stringify([1, 6, 11]) ||
    soundMenu.buttons[1].picnum !== 14 ||
    soundMenu.buttons[0].picnum !== 13 ||
    soundMenu.buttons[1].draw.x !== 72 ||
    soundMenu.buttons[1].draw.y !== 35 ||
    soundMenu.gun.x !== 48 ||
    soundMenu.gun.y !== 18 ||
    soundMenu.update.blocks !== 260 ||
    mod.WL_MENU_SndItems.indent !== 52 ||
    mod.WL_MENU_SndMenu[2].active !== 1 ||
    planePixel(72, 22) !== 0x98 ||
    planePixel(72, 35) !== 0xa0 ||
    planePixel(96, 0) !== 0xa8 ||
    JSON.stringify(soundMenuPrintedText.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["None", 100, 20, 0x13],
        ["PC Speaker", 100, 33, 0x17],
        ["AdLib/Sound Blaster", 100, 46, 0x17],
        ["None", 100, 85, 0x17],
        ["Disney Sound Source", 100, 98, 0x17],
        ["Sound Blaster", 100, 111, 0x17],
        ["None", 100, 150, 0x17],
        ["AdLib/Sound Blaster", 100, 163, 0x17],
      ])
  ) {
    fail(`WL_MENU DrawSoundMenu did not mirror the original sound menu layout and selected buttons: ${JSON.stringify({
      soundMenu,
      soundMenuPrinted,
      selectedSoundButtons,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({
    SoundSourcePresent: true,
    SoundBlasterPresent: true,
    SoundMode: mod.ID_SD_sdm_Off,
    DigiMode: mod.ID_SD_sds_Off,
    MusicMode: mod.ID_SD_smm_Off,
  });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  const cpSound = mod.WL_MENU_CP_Sound({
    pictable: menuPictable,
    chunks: menuChunks,
    maxPolls: 4,
    skipLoadAllSounds: true,
    selections: [1, 0, 6, 5, -1],
  });
  printedMenu.splice(0);
  const cpSoundState = mod.ID_SD_SD_DebugState();
  if (
    cpSound.initialWait.polls !== 1 ||
    cpSound.actions.length !== 4 ||
    cpSound.exitSelection !== -1 ||
    cpSound.actions[0].which !== 1 ||
    !cpSound.actions[0].changed ||
    cpSound.actions[0].waitSoundDone !== true ||
    cpSound.actions[0].setSoundMode !== true ||
    cpSound.actions[0].loadedSounds !== null ||
    cpSound.actions[0].shootSound !== false ||
    cpSound.actions[0].redraw?.buttons.find((button) => button.index === 1)?.on !== 1 ||
    cpSound.actions[1].which !== 0 ||
    !cpSound.actions[1].changed ||
    cpSound.actions[1].waitSoundDone !== false ||
    cpSound.actions[1].setSoundMode !== true ||
    cpSound.actions[1].shootSound !== null ||
    cpSound.actions[2].which !== 6 ||
    !cpSound.actions[2].changed ||
    cpSound.actions[2].setDigiDevice?.DigiMode !== mod.ID_SD_sds_SoundSource ||
    cpSound.actions[2].shootSound !== false ||
    cpSound.actions[3].which !== 5 ||
    !cpSound.actions[3].changed ||
    cpSound.actions[3].setDigiDevice?.DigiMode !== mod.ID_SD_sds_Off ||
    cpSound.actions[3].shootSound !== null ||
    cpSound.fade !== null ||
    cpSoundState.SoundMode !== mod.ID_SD_sdm_Off ||
    cpSoundState.DigiMode !== mod.ID_SD_sds_Off
  ) {
    fail(`WL_MENU CP_Sound did not mirror the original sound menu transition sequence: ${JSON.stringify({
      cpSound,
      cpSoundState,
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_MainMenu[8].string = "Back to Demo";
  mod.WL_MENU_MainMenu[8].active = 1;
  const mainMenu = mod.WL_MENU_DrawMainMenu({ pictable: menuPictable, chunks: menuChunks });
  const mainMenuPrinted = printedMenu.splice(0);
  const mainMenuPrintedText = mainMenuPrinted.filter((entry) => entry.text.length > 0);
  if (
    mainMenu.background.background.draw?.pixels !== 64000 ||
    mainMenu.mouseBack.draw?.bytes !== 8 ||
    mainMenu.stripes.y !== 10 ||
    mainMenu.optionsPic.x !== 80 ||
    mainMenu.optionsPic.y !== 0 ||
    mainMenu.optionsPic.draw?.bytes !== 8 ||
    mainMenu.window.x !== 68 ||
    mainMenu.window.y !== 52 ||
    mainMenu.window.w !== 178 ||
    mainMenu.window.h !== 136 ||
    mainMenu.ingame !== mod.WL_GAME_ingame ||
    mainMenu.ingame ||
    mainMenu.backtodemoString !== "Back to Demo" ||
    mainMenu.backtodemoActive !== 1 ||
    mainMenu.menu.iteminfo.amount !== 10 ||
    mainMenu.menu.window.windowX !== 100 ||
    mainMenu.menu.window.windowY !== 55 ||
    mainMenu.menu.rows[0].textColor.fontcolor !== 0x13 ||
    mainMenu.menu.rows[4].disabledColor?.fontcolor !== 0x2b ||
    mainMenu.menu.rows[6].textColor.fontcolor !== 0x4a ||
    mainMenu.update.blocks !== 260 ||
    mod.WL_MENU_MainItems.curpos !== 0 ||
    mod.WL_MENU_MainMenu[4].active !== 0 ||
    planePixel(80, 0) !== 0xb8 ||
    planePixel(112, 184) !== 0x2d ||
    JSON.stringify(mainMenuPrintedText.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["New Game", 100, 55, 0x13],
        ["Sound", 100, 68, 0x17],
        ["Control", 100, 81, 0x17],
        ["Load Game", 100, 94, 0x17],
        ["Save Game", 100, 107, 0x2b],
        ["Change View", 100, 120, 0x17],
        ["Read This!", 100, 133, 0x4a],
        ["View Scores", 100, 146, 0x17],
        ["Back to Demo", 100, 159, 0x17],
        ["Quit", 100, 172, 0x17],
      ])
  ) {
    fail(`WL_MENU DrawMainMenu did not mirror the original not-in-game options screen: ${JSON.stringify({
      mainMenu,
      mainMenuPrinted,
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_MainMenu[8].string = "Back to Demo";
  mod.WL_MENU_MainMenu[8].active = 1;
  const inGameMainMenu = mod.WL_MENU_DrawMainMenu({ pictable: menuPictable, chunks: menuChunks, inGame: true });
  printedMenu.splice(0);
  if (
    !inGameMainMenu.ingame ||
    inGameMainMenu.backtodemoString !== "Back to Game" ||
    inGameMainMenu.backtodemoActive !== 2 ||
    mod.WL_MENU_MainMenu[8].string !== "Back to Game" ||
    mod.WL_MENU_MainMenu[8].active !== 2
  ) {
    fail(`WL_MENU DrawMainMenu did not honor the browser in-game menu override: ${JSON.stringify({
      inGameMainMenu,
      backToGameItem: mod.WL_MENU_MainMenu[8],
    })}`);
  }
  mod.WL_MENU_MainMenu[8].string = "Back to Demo";
  mod.WL_MENU_MainMenu[8].active = 1;

  mod.ID_IN_IN_ResetInputState({ MousePresent: true, JoysPresent: [true, false] });
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MENU_CtlItems.curpos = -1;
  [0, 0, 0, 0, 0, 1].forEach((active, index) => {
    mod.WL_MENU_CtlMenu[index].active = active;
  });
  const controlScreen = mod.WL_MENU_DrawCtlScreen({ pictable: menuPictable, chunks: menuChunks });
  const controlPrinted = printedMenu.splice(0);
  const controlPrintedText = controlPrinted.filter((entry) => entry.text.length > 0);
  if (
    controlScreen.background.background.draw?.pixels !== 64000 ||
    controlScreen.stripes.y !== 10 ||
    controlScreen.controlPic.x !== 80 ||
    controlScreen.controlPic.y !== 0 ||
    controlScreen.controlPic.draw?.bytes !== 8 ||
    controlScreen.mouseBack.x !== 112 ||
    controlScreen.mouseBack.y !== 184 ||
    controlScreen.window.x !== 16 ||
    controlScreen.window.y !== 65 ||
    controlScreen.window.w !== 284 ||
    controlScreen.window.h !== 84 ||
    controlScreen.color.fontcolor !== 0x17 ||
    controlScreen.menu.iteminfo.curpos !== -1 ||
    controlScreen.menu.window.windowX !== 80 ||
    controlScreen.menu.window.windowY !== 70 ||
    controlScreen.menu.rows.length !== 6 ||
    JSON.stringify(controlScreen.buttons.map((button) => [button.index, button.on, button.picnum, button.draw.x, button.draw.y])) !==
      JSON.stringify([
        [0, 0, 13, 56, 73],
        [1, 0, 13, 56, 86],
        [2, 0, 13, 56, 99],
        [3, 0, 13, 56, 112],
      ]) ||
    controlScreen.pickedCurpos !== 0 ||
    mod.WL_MENU_CtlItems.curpos !== 0 ||
    JSON.stringify(mod.WL_MENU_CtlMenu.map((item) => item.active)) !== JSON.stringify([1, 1, 0, 0, 0, 1]) ||
    controlScreen.gun.x !== 24 ||
    controlScreen.gun.y !== 68 ||
    controlScreen.update.blocks !== 260 ||
    planePixel(80, 0) !== 0xc0 ||
    planePixel(112, 184) !== 0x50 ||
    planePixel(56, 73) !== 0x98 ||
    planePixel(24, 68) !== 0x40 ||
    JSON.stringify(controlPrintedText.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["Mouse Enabled", 80, 70, 0x17],
        ["Joystick Enabled", 80, 83, 0x17],
        ["Use joystick port 2", 80, 96, 0x2b],
        ["Gravis GamePad Enabled", 80, 109, 0x2b],
        ["Mouse Sensitivity", 80, 122, 0x2b],
        ["Customize controls", 80, 135, 0x17],
      ])
  ) {
    fail(`WL_MENU DrawCtlScreen did not mirror the original control menu screen: ${JSON.stringify({
      controlScreen,
      controlPrinted,
      ctlMenu: mod.WL_MENU_CtlMenu,
    })}`);
  }

  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const changeView = mod.WL_MENU_DrawChangeView(12);
  const changeViewPrinted = printedMenu.splice(0);
  if (
    changeView.view !== 12 ||
    changeView.bar.draw?.pixels !== 12800 ||
    changeView.preview.previewViewwidth !== 192 ||
    changeView.preview.previewViewheight !== 96 ||
    changeView.printWindow.windowX !== 0 ||
    changeView.printWindow.windowY !== 320 ||
    changeView.printWindow.windowW !== 320 ||
    changeView.printWindow.printY !== 161 ||
    changeView.color.fontcolor !== 0x13 ||
    changeView.size1.segments[0]?.x !== 133 ||
    changeView.size1.segments[0]?.y !== 161 ||
    changeView.size2.segments[0]?.x !== 137 ||
    changeView.size2.segments[0]?.y !== 168 ||
    changeView.size3.segments[0]?.x !== 140 ||
    changeView.size3.segments[0]?.y !== 175 ||
    changeView.update.blocks !== 60 ||
    changeView.fade !== null ||
    planePixel(0, 160) !== 0x7f ||
    JSON.stringify(changeViewPrinted.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["Use arrows to size", 133, 161, 0x13],
        ["ENTER to accept", 137, 168, 0x13],
        ["ESC to cancel", 140, 175, 0x13],
      ])
  ) {
    fail(`WL_MENU DrawChangeView did not mirror the original resize overlay: ${JSON.stringify({
      changeView,
      changeViewPrinted,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[4] = { length: 3, priority: 2, data: [2, 2, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const handleInfo = { x: 32, y: 40, amount: 3, curpos: 0, indent: 16 };
  const handleItems = [
    { active: 1, string: "Alpha" },
    { active: 0, string: "Beta" },
    { active: 1, string: "Gamma" },
  ];
  const handleRoutineCalls = [];
  const handleHooks = [];
  const handleResult = mod.WL_MENU_HandleMenu(
    handleInfo,
    handleItems,
    (which) => {
      handleRoutineCalls.push(which);
    },
    {
      pictable: menuPictable,
      chunks: menuChunks,
      maxPolls: 4,
      pollHook: ({ phase, poll, which, exit }) => {
        handleHooks.push([phase, poll, which, exit]);
        if (phase === "loop" && poll === 0) {
          mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_A, true, 71);
        }
        if (phase === "post-move" && poll === 0) {
          mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Enter, true);
        }
      },
    },
  );
  const handlePrinted = printedMenu.splice(0).filter((entry) => entry.text.length > 0);
  const handleInputState = mod.ID_IN_IN_DebugState();
  if (
    handleResult !== 2 ||
    handleInfo.curpos !== 2 ||
    JSON.stringify(handleRoutineCalls) !== JSON.stringify([0, 2, 2]) ||
    JSON.stringify(handleHooks) !== JSON.stringify([
      ["loop", 0, 0, 0],
      ["post-move", 0, 2, 0],
    ]) ||
    handleInputState.pressedKeys.length !== 0 ||
    handleInputState.LastScan !== 0 ||
    handleInputState.LastASCII !== 0 ||
    planePixel(32, 64) !== 0x2d ||
    !handlePrinted.some((entry) => entry.text === "Alpha" && entry.x === 48 && entry.y === 40 && entry.fontcolor === 0x13) ||
    !handlePrinted.some((entry) => entry.text === "Alpha" && entry.x === 48 && entry.y === 40 && entry.fontcolor === 0x17) ||
    !handlePrinted.some((entry) => entry.text === "Gamma" && entry.x === 48 && entry.y === 66 && entry.fontcolor === 0x13)
  ) {
    fail(`WL_MENU HandleMenu did not mirror the original type-to-jump accept flow: ${JSON.stringify({
      handleResult,
      handleInfo,
      handleRoutineCalls,
      handleHooks,
      handlePrinted,
      handleInputState,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ MusicMode: mod.ID_SD_smm_AdLib });
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Escape, true);
  const bossPalette = new Uint8Array(768);
  for (let i = 0; i < bossPalette.length; i++) {
    bossPalette[i] = i & 0xff;
  }
  const bossKey = mod.WL_MENU_BossKey({ palette: bossPalette, skipLatchMem: true });
  if (
    bossKey.musicOff.sqActive !== false ||
    bossKey.textMode.videoMode !== 3 ||
    bossKey.prompt !== "C>" ||
    !bossKey.waitedForEscape ||
    !bossKey.escapeWasDown ||
    bossKey.clearDuringWait !== null ||
    bossKey.musicOn.sqActive !== true ||
    bossKey.vgaMode.videoMode !== 0x13 ||
    !bossKey.vgaMode.vgaPlaneMode ||
    !bossKey.paletteTest ||
    bossKey.palette?.checksum !== 97920 ||
    bossKey.latchMem !== null ||
    mod.ID_VL_currentPalette[765] !== 253 ||
    mod.ID_VL_currentPalette[767] !== 255
  ) {
    fail(`WL_MENU BossKey did not mirror the GOODTIMES text-mode escape shell: ${JSON.stringify({
      bossKey,
      paletteTail: Array.from(mod.ID_VL_currentPalette.slice(765, 768)),
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  const usHelpCalls = [];
  const usF1 = mod.WL_MENU_US_ControlPanel(mod.ID_IN_sc_F1, {
    skipMusic: true,
    setupOptions: { skipResourceCache: true, skipLoadAllSounds: true },
    readThisOptions: {
      helpScreens: () => {
        usHelpCalls.push("help");
        return "help-screen";
      },
    },
  });
  if (
    usF1.scancode !== mod.ID_IN_sc_F1 ||
    usF1.quick !== null ||
    usF1.music !== null ||
    usF1.setup?.fontState.fontnumber !== 1 ||
    usF1.fkey?.selection !== 6 ||
    usF1.fkey?.name !== "help" ||
    usF1.fkey?.result?.helpScreens !== "help-screen" ||
    usF1.mainDraw !== null ||
    usF1.actions.length !== 0 ||
    usF1.cleanup?.fontState.fontnumber !== 0 ||
    JSON.stringify(usHelpCalls) !== JSON.stringify(["help"])
  ) {
    fail(`WL_MENU US_ControlPanel F1 shortcut did not mirror the original help-screen finishup path: ${JSON.stringify({
      usF1,
      usHelpCalls,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.WL_MENU_MainMenu[4].active = 0;
  mod.WL_MENU_MainMenu[7].string = "View Scores";
  mod.WL_MENU_MainMenu[7].routine = mod.WL_MENU_CP_ViewScores;
  mod.WL_MENU_MainMenu[8].string = "Back to Demo";
  mod.WL_MENU_MainMenu[8].active = 1;
  const usNewGameDgroup = new mod.DOSMemory(0x10000);
  const usNewGame = mod.WL_MENU_US_ControlPanel(0, {
    skipMusic: true,
    skipFade: true,
    setupOptions: { skipResourceCache: true, skipLoadAllSounds: true },
    drawOptions: { pictable: menuPictable, chunks: menuChunks },
    newGameOptions: {
      dgroup: usNewGameDgroup,
      episodeSelection: 0,
      difficultySelection: 2,
      skipEpisodeDraw: true,
      skipDifficultyDraw: true,
      skipFade: true,
    },
    mainSelections: [0],
  });
  if (
    usNewGame.scancode !== 0 ||
    usNewGame.setup?.fontState.fontnumber !== 1 ||
    usNewGame.mainDraw?.menu.rows.length !== 10 ||
    usNewGame.mainDraw?.backtodemoString !== "Back to Demo" ||
    usNewGame.mainFadeIn !== null ||
    usNewGame.actions.length !== 1 ||
    usNewGame.actions[0]?.selection !== 0 ||
    usNewGame.actions[0]?.name !== "newgame" ||
    usNewGame.actions[0]?.result?.cancelled ||
    usNewGame.actions[0]?.result?.newGame?.startgame !== true ||
    usNewGame.actions[0]?.redraw !== null ||
    usNewGame.cleanup?.fontState.fontnumber !== 0 ||
    usNewGame.startGame !== 1 ||
    usNewGame.viewScoresString !== "End Game" ||
    usNewGame.viewScoresRoutine !== null ||
    mod.WL_MENU_MainMenu[7].string !== "End Game" ||
    mod.WL_MENU_MainMenu[7].routine !== null ||
    usNewGameDgroup.u16(endGameGamestate + 0) !== 2 ||
    usNewGameDgroup.u16(endGameGamestate + 38) !== 0
  ) {
    fail(`WL_MENU US_ControlPanel main loop did not mirror the original new-game exit and End Game menu rewrite: ${JSON.stringify({
      usNewGame,
      gamestate: {
        difficulty: usNewGameDgroup.u16(endGameGamestate + 0),
        episode: usNewGameDgroup.u16(endGameGamestate + 38),
      },
      mainMenu: mod.WL_MENU_MainMenu.slice(4, 9),
    })}`);
  }
  mod.WL_MENU_MainMenu[7].string = "View Scores";
  mod.WL_MENU_MainMenu[7].routine = mod.WL_MENU_CP_ViewScores;

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[0] = { length: 3, priority: 2, data: [1, 1, 0] };
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.WL_MAIN_SetViewSize(160, 80);
  const cpChangeHooks = [];
  const cpChange = mod.WL_MENU_CP_ChangeView({
    font: messageFont,
    maxPolls: 4,
    maxDelayPolls: 4,
    pollHook: ({ phase, poll, newview }) => {
      cpChangeHooks.push([phase, poll, newview]);
      if (phase === "loop" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_RightArrow, true);
      }
      if (phase === "post-step" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Enter, true);
      }
    },
  });
  const cpChangePrinted = printedMenu.splice(0);
  const cpChangeSound = mod.ID_SD_SD_DebugState();
  mod.ID_IN_IN_ClearKeysDown();
  if (
    cpChange.oldview !== 10 ||
    cpChange.initialWindow.windowX !== 0 ||
    cpChange.initialWindow.windowW !== 320 ||
    cpChange.initial.view !== 10 ||
    cpChange.polls !== 1 ||
    cpChange.steps.length !== 1 ||
    cpChange.steps[0].direction !== "increase" ||
    cpChange.steps[0].newview !== 11 ||
    cpChange.steps[0].preview.previewViewwidth !== 176 ||
    cpChange.steps[0].preview.restoredViewwidth !== 160 ||
    cpChange.steps[0].soundPlayed !== false ||
    cpChange.steps[0].delay.count !== 10 ||
    cpChange.steps[0].delay.polls !== 1 ||
    cpChange.exit !== 1 ||
    cpChange.cancelled ||
    cpChange.restoredViewSize !== null ||
    !cpChange.changed ||
    cpChange.changeSound !== false ||
    cpChange.thinkMessage?.text !== "Thinking..." ||
    cpChange.resize?.viewwidth !== 176 ||
    cpChange.resize?.viewheight !== 88 ||
    cpChange.shootSound !== false ||
    cpChange.debugPauseRequested ||
    cpChange.fade !== null ||
    mod.WL_MAIN_viewwidth !== 176 ||
    mod.WL_MAIN_viewheight !== 88 ||
    cpChangeSound.SoundNumber !== 32 ||
    JSON.stringify(cpChangeHooks) !== JSON.stringify([
      ["loop", 0, 10],
      ["post-step", 0, 11],
    ]) ||
    !cpChangePrinted.some((entry) => entry.text === "Thinking...")
  ) {
    fail(`WL_MENU CP_ChangeView did not mirror the original resize accept sequence: ${JSON.stringify({
      cpChange,
      cpChangeHooks,
      cpChangeSound,
      cpChangePrinted,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[0] = { length: 3, priority: 2, data: [1, 1, 0] };
  mod.ID_SD_SoundTable[39] = { length: 4, priority: 7, data: [4, 3, 2, 0] };
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 0, y: 0, w: 320, h: 200, px: 0, py: 0 });
  mod.WL_MAIN_SetViewSize(160, 80);
  const cpCancelHooks = [];
  const cpCancel = mod.WL_MENU_CP_ChangeView({
    maxPolls: 4,
    maxDelayPolls: 4,
    pollHook: ({ phase, poll, newview }) => {
      cpCancelHooks.push([phase, poll, newview]);
      if (phase === "loop" && poll === 0) {
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_RightArrow, true);
      }
      if (phase === "post-step" && poll === 0) {
        mod.ID_IN_IN_ClearKeysDown();
        mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Escape, true);
      }
    },
  });
  const cpCancelPrinted = printedMenu.splice(0);
  const cpCancelSound = mod.ID_SD_SD_DebugState();
  mod.ID_IN_IN_ClearKeysDown();
  if (
    cpCancel.oldview !== 10 ||
    cpCancel.polls !== 1 ||
    cpCancel.steps.length !== 1 ||
    cpCancel.steps[0].newview !== 11 ||
    cpCancel.exit !== 2 ||
    !cpCancel.cancelled ||
    cpCancel.restoredViewSize?.viewwidth !== 160 ||
    cpCancel.restoredViewSize?.viewheight !== 80 ||
    cpCancel.changed ||
    cpCancel.changeSound !== false ||
    cpCancel.thinkMessage !== null ||
    cpCancel.resize !== null ||
    cpCancel.shootSound !== null ||
    cpCancel.fade !== null ||
    mod.WL_MAIN_viewwidth !== 160 ||
    mod.WL_MAIN_viewheight !== 80 ||
    cpCancelSound.SoundNumber !== 39 ||
    JSON.stringify(cpCancelHooks) !== JSON.stringify([
      ["loop", 0, 10],
      ["post-step", 0, 11],
    ]) ||
    cpCancelPrinted.some((entry) => entry.text === "Thinking...")
  ) {
    fail(`WL_MENU CP_ChangeView did not mirror the original resize cancel sequence: ${JSON.stringify({
      cpCancel,
      cpCancelHooks,
      cpCancelSound,
      cpCancelPrinted,
    })}`);
  }
  mod.WL_MAIN_SetViewSize(256, 128);

  const highlightedReadColor = mod.WL_MENU_SetTextColor({ active: 2, string: "Read" }, 1);
  const normalAltColor = mod.WL_MENU_SetTextColor({ active: 3, string: "Alt" }, 0);
  const menuDraw = mod.WL_MENU_DrawMenu(
    { x: 10, y: 20, amount: 3, curpos: 1, indent: 6 },
    [
      { active: 1, string: "One" },
      { active: 2, string: "Two" },
      { active: 0, string: "Off" },
    ],
  );
  mod.ID_US_US_SetPrintRoutines(mod.ID_VH_VW_MeasurePropString, mod.ID_VH_VW_DrawPropString);
  const printedMenuText = printedMenu.filter((entry) => entry.text.length > 0);
  if (
    highlightedReadColor.fontcolor !== 0x47 ||
    highlightedReadColor.backcolor !== 0x2d ||
    normalAltColor.fontcolor !== 0x6b ||
    menuDraw.window.windowX !== 16 ||
    menuDraw.window.windowY !== 20 ||
    menuDraw.window.windowW !== 320 ||
    menuDraw.window.windowH !== 200 ||
    menuDraw.rows.length !== 3 ||
    menuDraw.rows[0].textColor.fontcolor !== 0x17 ||
    menuDraw.rows[1].textColor.fontcolor !== 0x47 ||
    menuDraw.rows[2].textColor.fontcolor !== 0x2b ||
    menuDraw.rows[2].disabledColor?.fontcolor !== 0x2b ||
    menuDraw.rows[2].restoreColor?.fontcolor !== 0x17 ||
    menuDraw.rows[0].print.segments[0]?.x !== 16 ||
    menuDraw.rows[0].print.segments[0]?.y !== 20 ||
    menuDraw.rows[1].print.segments[0]?.y !== 33 ||
    menuDraw.rows[2].print.segments[0]?.y !== 46 ||
    menuDraw.finalWindow.px !== 16 ||
    menuDraw.finalWindow.py !== 53 ||
    menuDraw.finalFont.fontcolor !== 0x17 ||
    JSON.stringify(printedMenuText.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["One", 16, 20, 0x17],
        ["Two", 16, 33, 0x47],
        ["Off", 16, 46, 0x2b],
      ])
  ) {
    fail(`WL_MENU text color/menu drawing helpers did not match the original print sequencing: ${JSON.stringify({
      highlightedReadColor,
      normalAltColor,
      menuDraw,
      printedMenu,
    })}`);
  }

  const printedGun = [];
  const fakeGunDraw = (value) => {
    const text = String(value);
    const font = mod.ID_VH_VW_DebugFontState();
    printedGun.push({ text, x: font.px, y: font.py, fontcolor: font.fontcolor, backcolor: font.backcolor });
    return {
      text,
      startX: font.px,
      startY: font.py,
      endX: font.px + text.length * 3,
      width: text.length * 3,
      height: 7,
      chars: text.length,
      pixels: text.length,
      colorized: false,
    };
  };
  mod.ID_US_US_SetPrintRoutines(fakeMeasure, fakeGunDraw);
  mod.ID_VL_videoPlanes.fill(0);
  mod.ID_VH_update.fill(0);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.ID_US_US_RestoreWindow({ x: 90, y: 91, w: 200, h: 100, px: 7, py: 8 });
  mod.ID_SD_SD_ResetSoundState();
  const gunItems = [
    { active: 1, string: "One" },
    { active: 2, string: "Two" },
    { active: 1, string: "Tre" },
  ];
  const gunItemInfo = { x: 10, y: 20, amount: 3, curpos: 1, indent: 6 };
  const erasedGun = mod.WL_MENU_EraseGun(gunItemInfo, gunItems, 72, 40, 1);
  const gunY = { value: 40 };
  let routineWhich = -1;
  const drawnGun = mod.WL_MENU_DrawGun(
    gunItemInfo,
    gunItems,
    72,
    gunY,
    2,
    18,
    (which) => {
      routineWhich = which;
    },
    { pictable: menuPictable, chunks: menuChunks },
  );
  mod.ID_VH_update.fill(0);
  const menuGun = mod.WL_MENU_DrawMenuGun({ x: 32, y: 50, amount: 3, curpos: 2, indent: 0 }, { pictable: menuPictable, chunks: menuChunks });
  mod.ID_US_US_SetPrintRoutines(mod.ID_VH_VW_MeasurePropString, mod.ID_VH_VW_DrawPropString);
  mod.ID_VH_update.fill(0);
  if (
    erasedGun.erase.draw?.pixels !== 400 ||
    erasedGun.textColor.fontcolor !== 0x4a ||
    erasedGun.print.segments[0]?.x !== 16 ||
    erasedGun.print.segments[0]?.y !== 33 ||
    erasedGun.update.blocks !== 6 ||
    erasedGun.finalWindow.x !== 90 ||
    erasedGun.finalWindow.px !== 25 ||
    drawnGun.oldY !== 40 ||
    drawnGun.newY !== 44 ||
    gunY.value !== 44 ||
    drawnGun.draw.draw?.bytes !== 16 ||
    drawnGun.textColor.fontcolor !== 0x13 ||
    !drawnGun.routineCalled ||
    routineWhich !== 2 ||
    drawnGun.update.blocks !== 6 ||
    drawnGun.soundPlayed ||
    drawnGun.finalWindow.px !== 25 ||
    drawnGun.finalWindow.py !== 46 ||
    menuGun.x !== 32 ||
    menuGun.y !== 74 ||
    menuGun.draw.draw?.bytes !== 16 ||
    planePixel(71, 40) !== 0x2d ||
    planePixel(72, 44) !== 0x40 ||
    planePixel(32, 74) !== 0x40 ||
    JSON.stringify(printedGun.map((entry) => [entry.text, entry.x, entry.y, entry.fontcolor])) !==
      JSON.stringify([
        ["Two", 16, 33, 0x4a],
        ["Tre", 16, 46, 0x13],
      ])
  ) {
    fail(`WL_MENU gun cursor helpers did not mirror the original erase/redraw/menu-gun sequence: ${JSON.stringify({
      erasedGun,
      drawnGun,
      menuGun,
      printedGun,
      routineWhich,
    })}`);
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[32] = { length: 5, priority: 8, data: [1, 2, 3, 4, 0] };
  const shootSound = mod.WL_MENU_ShootSnd();
  const shootSoundState = mod.ID_SD_SD_DebugState();
  if (
    shootSound ||
    shootSoundState.SoundNumber !== 32 ||
    shootSoundState.SoundPriority !== 8 ||
    !shootSoundState.pcSoundActive ||
    shootSoundState.pcLengthLeft !== 5
  ) {
    fail(`WL_MENU_ShootSnd did not dispatch SHOOTSND through SD_PlaySound: ${JSON.stringify({ shootSound, shootSoundState })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_A, true, 65);
  mod.ID_IN_IN_SetPaused(true);
  mod.ID_SD_SD_ResetSoundState({ MusicMode: mod.ID_SD_smm_AdLib });
  mod.ID_SD_SD_MusicOn();
  const vblBeforePause = mod.ID_VL_verticalBlankWaits;
  const pauseCheck = mod.WL_MENU_CheckPause();
  const pauseInputState = mod.ID_IN_IN_DebugState();
  const pauseSoundState = mod.ID_SD_SD_DebugState();
  const noPauseCheck = mod.WL_MENU_CheckPause();
  if (
    !pauseCheck.wasPaused ||
    pauseCheck.soundStatusBefore !== 1 ||
    pauseCheck.soundStatusAfter !== 0 ||
    pauseCheck.music?.sqActive ||
    pauseCheck.verticalBlankWaits !== vblBeforePause + 3 ||
    pauseCheck.pausedAfter ||
    pauseInputState.Paused ||
    pauseInputState.LastScan !== 0 ||
    pauseInputState.LastASCII !== 0 ||
    pauseInputState.pressedKeys.length !== 0 ||
    pauseSoundState.sqActive ||
    noPauseCheck.wasPaused ||
    noPauseCheck.soundStatusAfter !== 0
  ) {
    fail(`WL_MENU_CheckPause did not mirror the original pause/music toggle sequence: ${JSON.stringify({
      pauseCheck,
      pauseInputState,
      pauseSoundState,
      noPauseCheck,
    })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_UpArrow, true);
  const baseControl = mod.WL_MENU_ReadAnyControl();
  const mouseControl = mod.WL_MENU_ReadAnyControl(undefined, {
    mouseenabled: true,
    mouseX: 200,
    mouseY: 120,
    mouseButtons: 5,
  });
  const joyControl = mod.WL_MENU_ReadAnyControl(undefined, {
    joystickenabled: true,
    joypadenabled: true,
    joyDelta: { dx: -70, dy: 80 },
    joyButtons: 9,
  });
  mod.ID_IN_IN_ResetInputState();
  mod.ID_SD_SD_ResetSoundState();
  const inactiveDelay = mod.WL_MENU_TicDelay(5, { maxPolls: 4 });
  mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_RightArrow, true);
  const activeDelay = mod.WL_MENU_TicDelay(3, { maxPolls: 20 });
  mod.ID_IN_IN_ClearKeysDown();
  mod.ID_IN_IN_ResetInputState();
  mod.ID_IN_IN_SetKeyboardState(mod.ID_IN_sc_Space, true);
  const waitKeyUp = mod.WL_MENU_WaitKeyUp({
    maxPolls: 4,
    pollHook: (poll) => {
      if (poll === 1) {
        mod.ID_IN_IN_ClearKeysDown();
      }
    },
  });
  const scanNames = [
    mod.WL_MENU_IN_GetScanName(mod.ID_IN_sc_A),
    mod.WL_MENU_IN_GetScanName(mod.ID_IN_sc_Space),
    mod.WL_MENU_IN_GetScanName(0x4b),
    mod.WL_MENU_IN_GetScanName(0x4a),
    mod.WL_MENU_IN_GetScanName(0xff),
  ];
  if (JSON.stringify(scanNames) !== JSON.stringify(["A", "Space", "Left", "-", "?"])) {
    fail(`WL_MENU IN_GetScanName did not follow the original extended/single-char scan tables: ${JSON.stringify(scanNames)}`);
  }
  if (
    baseControl.source !== "base" ||
    baseControl.control.dir !== 0 ||
    !mouseControl.mouseactive ||
    mouseControl.source !== "mouse" ||
    mouseControl.control.dir !== 2 ||
    !mouseControl.control.button0 ||
    !mouseControl.control.button2 ||
    joyControl.source !== "joystick" ||
    joyControl.control.dir !== 6 ||
    !joyControl.control.button0 ||
    !joyControl.control.button3 ||
    inactiveDelay.polls !== 1 ||
    inactiveDelay.timerServices !== 0 ||
    inactiveDelay.finalTimeCount !== 0 ||
    inactiveDelay.lastControl.dir !== 8 ||
    activeDelay.count !== 3 ||
    activeDelay.polls !== 6 ||
    activeDelay.timerServices !== 6 ||
    activeDelay.finalTimeCount !== 3 ||
    activeDelay.lastControl.dir !== 2 ||
    waitKeyUp.polls !== 2 ||
    waitKeyUp.spaceDown ||
    waitKeyUp.enterDown ||
    waitKeyUp.escapeDown ||
    waitKeyUp.finalControl.button0 ||
    waitKeyUp.finalControl.button1
  ) {
    fail(`WL_MENU ReadAnyControl/TicDelay/WaitKeyUp did not match the original control priority and release behavior: ${JSON.stringify({
      baseControl,
      mouseControl,
      joyControl,
      inactiveDelay,
      activeDelay,
      waitKeyUp,
    })}`);
  }

  const fastPalette = mod.ID_VL_VL_TestPaletteSet();
  if (!fastPalette || !mod.ID_VL_fastpalette || mod.ID_VL_palette2[767] !== 255) {
    fail("VL_TestPaletteSet did not accept the deterministic in-memory palette round-trip");
  }

  const shutdown = mod.ID_VL_VL_Shutdown();
  if (shutdown.videoMode !== 3 || shutdown.vgaPlaneMode || mod.ID_VL_vlStarted) {
    fail(`VL_Shutdown did not return to text mode state: ${JSON.stringify(shutdown)}`);
  }

  return {
    fillChecksum: fill.checksum,
    color17: [readColor.red, readColor.green, readColor.blue],
    setLast: [set.lastColor.red, set.lastColor.green, set.lastColor.blue],
    fadeOutChecksum: fadeOut.checksum,
    fadeInChecksum: fadeIn.checksum,
    border,
    linewidth: lineWidth.linewidth,
    plot: [plot.plane, plot.offset],
    memCopyBytes: memCopy.bytes,
    latchBytes: latchCopy.bytes,
    tileStringBytes: tileString.bytes,
    latchStringBytes: latchString.bytes,
    maskedBytes: maskedCopy.bytes,
    mungeLast: vhMunged[15],
    fizzleCopied: fizzle.copied,
    tile8Bytes: tile8Draw.draw?.bytes ?? 0,
    picBytes: picDraw.draw?.bytes ?? 0,
    propStringPixels: propString.pixels,
    colorStringEnd: colorString.endX,
    latchLoadEnd: latchLoad.endOffset,
    latchPicBytes: latchPic.draw.bytes,
    hudPicCount: scoreDraw.picnums.length + keysDraw.length + 4,
    playBorder: [playBorder.xl, playBorder.yl],
    playBorderPages: allBorder.pages.length,
    splitWindow: [splitClear.window.windowW, splitClear.window.windowH],
    signon: [
      signonScreen.hiddenScreen?.displayofs ?? -1,
      signonScreen.visibleScreen?.displayofs ?? -1,
      signonScreen.reclaimLength,
    ],
    preloadWidth: preload.filledWidth,
    diskPic: diskSecond.picnum,
    menuClearPixels: menuClear.background.draw?.pixels ?? 0,
    menuPixels: menuWindow.fill.draw?.pixels ?? 0,
    menuHalfStepTicks: menuHalfStep.waitedTics,
    stripePixels: menuStripes.stripe.draw?.pixels ?? 0,
    dirtyBlocks: [mark.xt2 - mark.xt1 + 1, mark.yt2 - mark.yt1 + 1],
    updatedBlocks: updateScreen.blocks,
    splitLine: split.registerLine,
  };
}

async function checkRuntimeCacheManager(mod) {
  const [
    mapHead,
    gameMaps,
    vgaHead,
    vgaGraph,
    vgaDict,
    audioHead,
    audioT,
  ] = await Promise.all(
    [
      "MAPHEAD.WL6",
      "GAMEMAPS.WL6",
      "VGAHEAD.WL6",
      "VGAGRAPH.WL6",
      "VGADICT.WL6",
      "AUDIOHED.WL6",
      "AUDIOT.WL6",
    ].map(async (name) => new Uint8Array(await readFile(path.join(wl6Dir, name)))),
  );

  const startup = mod.ID_CA_CA_Startup({
    MAPHEAD: mapHead,
    GAMEMAPS: gameMaps,
    VGAHEAD: vgaHead,
    VGAGRAPH: vgaGraph,
    VGADICT: vgaDict,
    AUDIOHED: audioHead,
    AUDIOT: audioT,
  });
  if (startup.mapHeaders !== 60 || !startup.hasMapFile || !startup.hasGraphicsFile || !startup.hasAudioFile) {
    fail(`ID_CA startup did not parse WL6 headers: ${JSON.stringify(startup)}`);
  }

  const chunkLength = mod.ID_CA_CAL_GetGrChunkLength(0);
  const chunk0 = mod.ID_CA_CA_CacheGrChunk(0);
  if (!chunk0 || chunk0.length !== chunkLength.chunkexplen || mod.ID_CA_grsegs[0]?.length !== chunk0.length) {
    fail(`ID_CA graphic chunk cache mismatch: ${JSON.stringify({ chunkLength, chunk0: chunk0?.length })}`);
  }

  const menuCache = mod.WL_MENU_CacheLump(1, 3);
  if (
    menuCache.cached !== 3 ||
    JSON.stringify(menuCache.chunks) !== JSON.stringify([1, 2, 3]) ||
    !mod.ID_CA_grsegs[1] ||
    !mod.ID_CA_grsegs[2] ||
    !mod.ID_CA_grsegs[3] ||
    !(mod.ID_CA_grneeded[1] & 1) ||
    !(mod.ID_CA_grneeded[3] & 1)
  ) {
    fail(`WL_MENU_CacheLump did not cache an inclusive graphics lump: ${JSON.stringify(menuCache)}`);
  }
  const menuUncache = mod.WL_MENU_UnCacheLump(1, 3);
  if (
    menuUncache.cached !== 3 ||
    menuUncache.skipped !== 0 ||
    mod.ID_CA_grsegs[1] !== null ||
    mod.ID_CA_grsegs[2] !== null ||
    mod.ID_CA_grsegs[3] !== null ||
    (mod.ID_CA_grneeded[1] & 1) ||
    (mod.ID_CA_grneeded[3] & 1)
  ) {
    fail(`WL_MENU_UnCacheLump did not uncache only resident graphics chunks: ${JSON.stringify(menuUncache)}`);
  }
  const menuUncacheSkipped = mod.WL_MENU_UnCacheLump(1, 3);
  if (menuUncacheSkipped.cached !== 0 || menuUncacheSkipped.skipped !== 3) {
    fail(`WL_MENU_UnCacheLump did not skip already-free chunks: ${JSON.stringify(menuUncacheSkipped)}`);
  }

  const planes = mod.ID_CA_CA_CacheMap(0);
  if (planes.length !== 2 || planes[0].length !== 4096 || mod.ID_CA_mapon !== 0 || mod.ID_CA_mapsegs[0].length !== 4096) {
    fail(`ID_CA map cache mismatch: ${JSON.stringify({ planes: planes.map((plane) => plane.length), mapon: mod.ID_CA_mapon })}`);
  }

  const audio0 = mod.ID_CA_CA_CacheAudioChunk(0);
  if (!audio0.length || mod.ID_CA_audiosegs[0].length !== audio0.length) {
    fail(`ID_CA audio chunk cache mismatch: ${JSON.stringify({ audio0: audio0.length })}`);
  }

  const original = new Uint16Array([1, 1, 1, 1, 2, 0xabcd, 3, 3, 3]);
  const compressed = mod.ID_CA_CA_RLEWCompress(original, original.length * 2, 0xabcd);
  const expanded = mod.ID_CA_CA_RLEWexpand(compressed.data, original.length * 2, 0xabcd);
  if (!wordEqual(expanded, original) || compressed.byteLength !== 20) {
    fail(`ID_CA RLEW compress/expand mismatch: ${JSON.stringify({ data: Array.from(compressed.data), byteLength: compressed.byteLength })}`);
  }

  const tinyHuff = Array.from({ length: 255 }, () => ({ bit0: 0, bit1: 0 }));
  tinyHuff[254] = { bit0: 10, bit1: 11 };
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0);
  const screenExpanded = mod.ID_CA_CAL_HuffExpand(Uint8Array.from([0xaa]), 8, tinyHuff, true);
  if (
    JSON.stringify(Array.from(screenExpanded)) !== JSON.stringify([10, 11, 10, 11, 10, 11, 10, 11]) ||
    mod.ID_VL_videoPlanes[0] !== 10 ||
    mod.ID_VL_videoPlanes[1] !== 11 ||
    mod.ID_VL_videoPlanes[0x10000] !== 10 ||
    mod.ID_VL_videoPlanes[0x30000 + 1] !== 11
  ) {
    fail(`CAL_HuffExpand screenhack did not distribute bytes across four VGA planes: ${JSON.stringify({
      expanded: Array.from(screenExpanded),
      planes: [
        mod.ID_VL_videoPlanes[0],
        mod.ID_VL_videoPlanes[1],
        mod.ID_VL_videoPlanes[0x10000],
        mod.ID_VL_videoPlanes[0x30000 + 1],
      ],
    })}`);
  }

  const fakeHead = new Uint8Array(6);
  fakeHead[3] = 5;
  const fakeDict = new Uint8Array(255 * 4);
  fakeDict[254 * 4] = 10;
  fakeDict[254 * 4 + 2] = 11;
  const fakeGraph = Uint8Array.from([8, 0, 0, 0, 0xaa]);
  mod.ID_CA_CAL_SetupGrFile(fakeHead, fakeDict);
  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(4);
  const cacheScreen = mod.ID_CA_CA_CacheScreen(0, fakeGraph);
  mod.ID_CA_CAL_SetupGrFile(vgaHead, vgaDict);
  if (
    cacheScreen.chunk !== 0 ||
    cacheScreen.pos !== 0 ||
    cacheScreen.next !== 1 ||
    cacheScreen.compressed !== 5 ||
    cacheScreen.expanded !== 8 ||
    cacheScreen.screenhack.planeBytes !== 2 ||
    cacheScreen.screenhack.bufferofs !== 4 ||
    !cacheScreen.mark.marked ||
    mod.ID_VL_videoPlanes[4] !== 10 ||
    mod.ID_VL_videoPlanes[5] !== 11 ||
    mod.ID_VL_videoPlanes[0x20000 + 4] !== 10 ||
    mod.ID_VL_videoPlanes[0x30000 + 5] !== 11
  ) {
    fail(`CA_CacheScreen did not mirror direct-to-screen Huffman decompression: ${JSON.stringify({
      cacheScreen,
      planes: [
        mod.ID_VL_videoPlanes[4],
        mod.ID_VL_videoPlanes[5],
        mod.ID_VL_videoPlanes[0x20000 + 4],
        mod.ID_VL_videoPlanes[0x30000 + 5],
      ],
    })}`);
  }

  mod.ID_CA_CA_ClearVirtualFiles();
  mod.ID_CA_CA_SetVirtualFile("CONFIG.WL6", Uint8Array.from([0x10, 0x20, 0x30, 0x40]));
  const readBuffer = new Uint8Array([0xee, 0xee, 0xee, 0xee, 0xee]);
  const readOk = mod.ID_CA_CA_ReadFile("config.wl6", readBuffer);
  const shortRead = mod.ID_CA_CA_ReadFile("CONFIG.WL6", new Uint8Array(3));
  const missingRead = mod.ID_CA_CA_ReadFile("MISSING.WL6", new Uint8Array(4));
  const loadRef = { value: null };
  const loadOk = mod.ID_CA_CA_LoadFile("CONFIG.WL6", loadRef);
  const writeOk = mod.ID_CA_CA_WriteFile("SAVE.WL6", Uint8Array.from([1, 2, 3, 4, 5]), 3);
  const saved = mod.ID_CA_CA_GetVirtualFile("save.wl6");
  const debugState = mod.ID_CA_CA_OpenDebug();
  const debugWrite = mod.ID_CA_CA_FarWrite(mod.ID_CA_debughandle, Uint8Array.from([0x44, 0x45, 0x42]), 3);
  const debugHandleState = mod.ID_CA_CA_DebugFileHandle(mod.ID_CA_debughandle);
  const closeDebug = mod.ID_CA_CA_CloseDebug();
  const debugSaved = mod.ID_CA_CA_GetVirtualFile("DEBUG.TXT");
  const debugClosed = mod.ID_CA_CA_DebugFileHandle(mod.ID_CA_debughandle) === null;
  const writeHandle = mod.ID_CA_CA_OpenFileHandle("STREAM.BIN", "write");
  const farWriteOk = mod.ID_CA_CA_FarWrite(writeHandle, Uint8Array.from([9, 8, 7]), 2);
  const writeHandleState = mod.ID_CA_CA_DebugFileHandle(writeHandle);
  const closeWrite = mod.ID_CA_CA_CloseFileHandle(writeHandle);
  const readHandle = mod.ID_CA_CA_OpenFileHandle("STREAM.BIN", "read");
  const streamFirst = new Uint8Array(1);
  const streamSecond = new Uint8Array(1);
  const streamOverflow = new Uint8Array(1);
  const farReadFirst = mod.ID_CA_CA_FarRead(readHandle, streamFirst, 1);
  const farReadSecond = mod.ID_CA_CA_FarRead(readHandle, streamSecond, 1);
  const farReadPastEnd = mod.ID_CA_CA_FarRead(readHandle, streamOverflow, 1);
  const closeRead = mod.ID_CA_CA_CloseFileHandle(readHandle);
  let farReadHuge = "";
  try {
    mod.ID_CA_CA_FarRead(Uint8Array.from([1]), new Uint8Array(0x10000 + 1), 0x10000 + 1);
  } catch (error) {
    farReadHuge = error instanceof Error ? error.message : String(error);
  }
  if (
    !readOk ||
    shortRead ||
    missingRead ||
    readBuffer[0] !== 0x10 ||
    readBuffer[3] !== 0x40 ||
    readBuffer[4] !== 0xee ||
    !loadOk ||
    loadRef.value?.length !== 4 ||
    loadRef.value[2] !== 0x30 ||
    !writeOk ||
    saved?.length !== 3 ||
    saved[2] !== 3 ||
    debugState.filename !== "DEBUG.TXT" ||
    !debugWrite ||
    debugHandleState?.length !== 3 ||
    !closeDebug ||
    debugSaved?.length !== 3 ||
    debugSaved[0] !== 0x44 ||
    !debugClosed ||
    !farWriteOk ||
    writeHandleState?.position !== 2 ||
    writeHandleState?.length !== 2 ||
    !closeWrite ||
    !farReadFirst ||
    !farReadSecond ||
    farReadPastEnd ||
    streamFirst[0] !== 9 ||
    streamSecond[0] !== 8 ||
    !closeRead ||
    farReadHuge !== "CA_FarRead doesn't support 64K reads yet!"
  ) {
    fail(`ID_CA virtual file wrappers did not match the DOS byte-copy contract: ${JSON.stringify({
      readOk,
      shortRead,
      missingRead,
      readBuffer: Array.from(readBuffer),
      loadLength: loadRef.value?.length ?? 0,
      saved: saved ? Array.from(saved) : null,
      debugState,
      debugHandleState,
      debugSaved: debugSaved ? Array.from(debugSaved) : null,
      closeDebug,
      debugClosed,
      writeHandleState,
      farReadFirst,
      farReadSecond,
      farReadPastEnd,
      stream: [streamFirst[0], streamSecond[0]],
      farReadHuge,
    })}`);
  }

  mod.ID_CA_CA_ClearAllMarks();
  mod.ID_CA_CA_MarkGrChunk(0);
  if (mod.ID_CA_grneeded[0] !== 1) {
    fail(`ID_CA_MarkGrChunk did not set level bit 1: ${mod.ID_CA_grneeded[0]}`);
  }
  const up = mod.ID_CA_CA_UpLevel();
  mod.ID_CA_CA_MarkGrChunk(1);
  if (up.ca_levelbit !== 2 || mod.ID_CA_grneeded[1] !== 2) {
    fail(`ID_CA_UpLevel did not advance mark level: ${JSON.stringify({ up, mark1: mod.ID_CA_grneeded[1] })}`);
  }
  const down = mod.ID_CA_CA_DownLevel();
  if (down.ca_levelbit !== 1 || down.ca_levelnum !== 0) {
    fail(`ID_CA_DownLevel did not restore mark level: ${JSON.stringify(down)}`);
  }
  mod.ID_CA_CA_SetAllPurge();
  if (mod.ID_CA_grpurge[0] !== 3 || mod.ID_CA_audiopurge[0] !== 3) {
    fail(`ID_CA_SetAllPurge did not mark cached assets purgable: ${JSON.stringify({ gr: mod.ID_CA_grpurge[0], audio: mod.ID_CA_audiopurge[0] })}`);
  }
  mod.ID_CA_UNCACHEGRCHUNK(0);
  if (mod.ID_CA_grsegs[0] !== null || (mod.ID_CA_grneeded[0] & 1)) {
    fail("ID_CA_UNCACHEGRCHUNK did not free chunk 0 and clear its current mark");
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  const sounds = mod.ID_CA_CA_LoadAllSounds();
  if (sounds.cachedAudio < 87 || mod.ID_CA_audiosegs[86] === null) {
    fail(`ID_CA_LoadAllSounds did not cache PC sounds: ${JSON.stringify(sounds)}`);
  }
  const shootSound = mod.ID_SD_SoundTable[32];
  const shootSoundPrefix = shootSound?.data ? Array.from(shootSound.data).slice(0, 8) : [];
  if (
    !shootSound ||
    shootSound.length !== 27 ||
    shootSound.priority !== 20 ||
    shootSoundPrefix.join(",") !== "16,16,16,110,42,0,40,40"
  ) {
    fail(`ID_CA_LoadAllSounds did not link the PC SoundTable to real WL6 SHOOTSND data: ${JSON.stringify({
      length: shootSound?.length,
      priority: shootSound?.priority,
      prefix: shootSoundPrefix,
    })}`);
  }
  const shootPlayReturn = mod.ID_SD_SD_PlaySound(32);
  const shootPlayState = mod.ID_SD_SD_DebugState();
  if (shootPlayReturn || shootPlayState.SoundNumber !== 32 || shootPlayState.pcLengthLeft !== 27 || !shootPlayState.pcSoundActive) {
    fail(`SD_PlaySound did not consume the linked WL6 SHOOTSND PC table entry: ${JSON.stringify(shootPlayState)}`);
  }
  const shootServiceState = mod.ID_SD_SDL_PCService();
  if (shootServiceState.pcLastSample !== 16 || shootServiceState.pcLengthLeft !== 26) {
    fail(`SDL_PCService did not service the first linked WL6 SHOOTSND sample: ${JSON.stringify(shootServiceState)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true });
  mod.ID_SD_SD_SetSoundMode(mod.ID_SD_sdm_AdLib);
  const adlibSounds = mod.ID_CA_CA_LoadAllSounds();
  const adlibShootSound = mod.ID_SD_SoundTable[32];
  const adlibShootPrefix = adlibShootSound?.data ? Array.from(adlibShootSound.data).slice(0, 5) : [];
  if (
    adlibSounds.cachedAudio < 174 ||
    !adlibShootSound ||
    adlibShootSound.length !== 27 ||
    adlibShootSound.priority !== 20 ||
    adlibShootSound.block !== 4 ||
    adlibShootSound.inst?.mChar !== 33 ||
    adlibShootPrefix.join(",") !== "253,253,253,88,207"
  ) {
    fail(`ID_CA_LoadAllSounds did not link the AdLib SoundTable to real WL6 SHOOTSND data: ${JSON.stringify({
      cachedAudio: adlibSounds.cachedAudio,
      length: adlibShootSound?.length,
      priority: adlibShootSound?.priority,
      block: adlibShootSound?.block,
      inst: adlibShootSound?.inst,
      prefix: adlibShootPrefix,
    })}`);
  }
  mod.ID_SD_SD_ResetSoundState();

  return {
    mapHeaders: startup.mapHeaders,
    chunk0: chunk0.length,
    map0Plane0: planes[0].length,
    audio0: audio0.length,
    rlewBytes: compressed.byteLength,
    screenBytes: cacheScreen.screenhack.expandedBytes,
    virtualFileBytes: saved.length,
    loadedSounds: sounds.cachedAudio,
    linkedSoundLength: shootSound.length,
  };
}

async function checkRuntimePageManager(mod) {
  const vswap = new Uint8Array(await readFile(path.join(wl6Dir, "VSWAP.WL6")));
  let startup = mod.ID_PM_PM_Startup(vswap, ["wolf3d.exe", "-noems", "-noxms"]);
  if (
    startup.chunksInFile !== 663 ||
    startup.spriteStart !== 106 ||
    startup.soundStart !== 542 ||
    startup.pmNumBlocks !== 663 ||
    !startup.mainPresent ||
    startup.mainPagesAvail !== 100
  ) {
    fail(`ID_PM startup did not parse VSWAP/page memory state: ${JSON.stringify(startup)}`);
  }

  mod.ID_VL_VL_ResetVideoState();
  mod.ID_VL_VL_SetLineWidth(40);
  mod.ID_VL_VL_SetBufferOffset(0);
  mod.WL_MAIN_SetViewSize(256, 128);
  const preloadDgroup = new mod.DOSMemory(0x10000);
  preloadDgroup.setU16(mod.nearOffsetForRuntimeSymbol("_gamestate") + 2, 0);
  const preloadPictable = new Uint8Array(149 * 4);
  const preloadChunks = [];
  const preloadTile8 = new Uint8Array(72 * 64);
  for (let i = 0; i < preloadTile8.length; i++) {
    preloadTile8[i] = (0x20 + i) & 0xff;
  }
  preloadChunks[135] = preloadTile8;
  for (let pic = 91; pic <= 134; pic++) {
    const tableOffset = (pic - 3) * 4;
    preloadPictable[tableOffset] = 8;
    preloadPictable[tableOffset + 2] = 2;
    preloadChunks[pic] = new Uint8Array(Array.from({ length: 16 }, (_unused, index) => (pic + index) & 0xff));
  }
  mod.ID_VH_LoadLatchMem({ freeStart: 0x5000, chunks: preloadChunks, pictable: preloadPictable, start: 91, end: 134 });
  const gamePalette = new Uint8Array(768);
  for (let i = 0; i < gamePalette.length; i++) {
    gamePalette[i] = i & 0xff;
  }
  const preloadGraphics = mod.WL_INTER_PreloadGraphics(preloadDgroup, {
    pictable: preloadPictable,
    palette: gamePalette,
    userInputMaxPolls: 1,
  });
  if (
    JSON.stringify(preloadGraphics.level.picnums) !== JSON.stringify([98, 100]) ||
    preloadGraphics.split.window.windowW !== 320 ||
    preloadGraphics.background.draw?.pixels !== 51200 ||
    preloadGraphics.getPsyched.source !== 0x552c ||
    preloadGraphics.getPsyched.draw.bytes !== 16 ||
    preloadGraphics.window.windowX !== 48 ||
    preloadGraphics.window.windowY !== 56 ||
    preloadGraphics.window.windowW !== 224 ||
    preloadGraphics.firstUpdate.blocks !== 200 ||
    preloadGraphics.fadeIn.checksum !== 97920 ||
    preloadGraphics.preload.loaded !== 100 ||
    preloadGraphics.preload.total !== 100 ||
    preloadGraphics.lastPreload?.current !== 100 ||
    preloadGraphics.lastPreload.filledWidth !== 214 ||
    preloadGraphics.userInput ||
    !preloadGraphics.fadeOut.screenfaded ||
    preloadGraphics.border.xl !== 32 ||
    preloadGraphics.finalUpdate.blocks !== 200 ||
    mod.ID_PM_MainPagesUsed !== 100
  ) {
    fail(`WL_INTER_PreloadGraphics did not compose the original preload screen and PM_Preload path: ${JSON.stringify(preloadGraphics)}`);
  }
  mod.ID_PM_PM_Shutdown();
  if (mod.ID_PM_PMStarted) {
    fail("ID_PM_PM_Shutdown did not reset PMStarted after WL_INTER_PreloadGraphics test");
  }
  startup = mod.ID_PM_PM_Startup(vswap, ["wolf3d.exe", "-noems", "-noxms"]);
  if (startup.mainPagesUsed !== 0 || startup.cachedPages !== 0) {
    fail(`ID_PM restart after WL_INTER_PreloadGraphics was not clean: ${JSON.stringify(startup)}`);
  }

  const page0 = mod.ID_PM_PM_GetPage(0);
  if (page0.length !== 4096 || mod.ID_PM_PM_GetPageAddress(0) !== page0) {
    fail(`ID_PM wall page cache mismatch: ${JSON.stringify({ length: page0.length })}`);
  }

  const page0Entry = mod.ID_PM_PMPages[0];
  const rawPage0 = mod.ID_PM_PML_ReadFromFile(page0Entry.offset, page0Entry.length);
  if (!byteEqual(rawPage0, vswap.subarray(page0Entry.offset, page0Entry.offset + page0Entry.length))) {
    fail("ID_PM PML_ReadFromFile did not return the raw VSWAP page slice");
  }

  const sprite0 = mod.ID_PM_PM_GetSpritePage(0);
  if (!sprite0.length || sprite0.length !== mod.ID_PM_PMPages[mod.ID_PM_PMSpriteStart].length) {
    fail(`ID_PM sprite page cache mismatch: ${JSON.stringify({ length: sprite0.length })}`);
  }

  let rejectedSpriteLock = false;
  try {
    mod.ID_PM_PM_SetPageLock(mod.ID_PM_PMSpriteStart, mod.ID_PM_pml_Locked);
  } catch {
    rejectedSpriteLock = true;
  }
  if (!rejectedSpriteLock) {
    fail("ID_PM accepted a non-sound page lock");
  }

  mod.ID_PM_PM_SetPageLock(mod.ID_PM_PMSoundStart, mod.ID_PM_pml_Locked);
  if (mod.ID_PM_PMPages[mod.ID_PM_PMSoundStart].locked !== mod.ID_PM_pml_Locked) {
    fail("ID_PM did not lock a sound page");
  }
  mod.ID_PM_PM_SetPageLock(mod.ID_PM_PMSoundStart, mod.ID_PM_pml_Unlocked);

  const sound0 = mod.ID_PM_PM_GetSoundPage(0);
  if (!sound0.length || sound0.length !== mod.ID_PM_PMPages[mod.ID_PM_PMSoundStart].length) {
    fail(`ID_PM sound page cache mismatch: ${JSON.stringify({ length: sound0.length })}`);
  }

  const nextFrame = mod.ID_PM_PM_NextFrame();
  if (nextFrame.frameCount !== 1 || mod.ID_PM_PMFrameCount !== 1 || nextFrame.panicMode !== 5) {
    fail(`ID_PM_NextFrame did not advance frame/thrash state: ${JSON.stringify(nextFrame)}`);
  }
  mod.ID_PM_PM_GetPage(0);
  if (mod.ID_PM_PMPages[0].lastHit !== 1) {
    fail(`ID_PM did not update page hit frame: ${mod.ID_PM_PMPages[0].lastHit}`);
  }

  const lru = mod.ID_PM_PML_GiveLRUPage(true);
  if (!Number.isInteger(lru) || lru < 0) {
    fail(`ID_PM LRU search failed: ${lru}`);
  }

  const updates = [];
  const preload = mod.ID_PM_PM_Preload((current, total) => {
    updates.push([current, total]);
    return true;
  });
  if (
    preload.loaded !== preload.total ||
    preload.loaded !== 97 ||
    preload.cachedPages !== 100 ||
    mod.ID_PM_MainPagesUsed !== 100 ||
    updates.length !== preload.loaded + 1
  ) {
    fail(`ID_PM preload did not fill deterministic main-memory pages: ${JSON.stringify({ preload, updates: updates.length })}`);
  }

  const evictPage = mod.ID_PM_PMPages.findIndex(
    (page, index) => index < mod.ID_PM_PMSoundStart && page.offset > 0 && page.mainPage === -1,
  );
  if (evictPage === -1) {
    fail("ID_PM test could not find an uncached VSWAP page for eviction");
  }
  mod.ID_PM_PM_GetPage(evictPage);
  const afterEvict = mod.ID_PM_PM_DebugState();
  if (afterEvict.mainPagesUsed !== 100 || afterEvict.cachedPages !== 100) {
    fail(`ID_PM LRU eviction changed the fixed main page budget: ${JSON.stringify(afterEvict)}`);
  }

  const purge = mod.ID_PM_PM_SetMainMemPurge(3);
  if (purge.mainPurgeLevel !== 3) {
    fail(`ID_PM_SetMainMemPurge did not retain purge level: ${JSON.stringify(purge)}`);
  }

  const shutdown = mod.ID_PM_PM_Shutdown();
  if (shutdown.started || shutdown.pageFileOpen || shutdown.cachedPages || mod.ID_PM_PMStarted) {
    fail(`ID_PM shutdown did not clear runtime state: ${JSON.stringify(shutdown)}`);
  }

  return {
    chunksInFile: startup.chunksInFile,
    spriteStart: startup.spriteStart,
    soundStart: startup.soundStart,
    page0: page0.length,
    sprite0: sprite0.length,
    sound0: sound0.length,
    preloadGraphics: preloadGraphics.preload.loaded,
    preload: preload.loaded,
    evictedPage: evictPage,
    frameCount: nextFrame.frameCount,
  };
}

function checkRuntimeMemoryManager(mod) {
  const startup = mod.ID_MM_MM_Startup(0x20000);
  if (!startup.started || !startup.bufferAllocated || startup.allocatedBlocks !== 1) {
    fail(`ID_MM startup did not allocate the misc buffer: ${JSON.stringify(startup)}`);
  }

  const refA = mod.ID_MM_MM_NewPtrRef();
  const refB = mod.ID_MM_MM_NewPtrRef();
  const blockA = mod.ID_MM_MM_GetPtr(refA, 1024);
  const blockB = mod.ID_MM_MM_GetPtr(refB, 2048);
  if (!blockA || !blockB || refA.segment === refB.segment || refA.size !== 1024 || refB.size !== 2048) {
    fail(`ID_MM allocation mismatch: ${JSON.stringify({ refA, refB })}`);
  }
  const refASegment = refA.segment;
  const refBSegment = refB.segment;

  const unusedBeforePurge = mod.ID_MM_MM_UnusedMemory();
  mod.ID_MM_MM_SetPurge(refA, 3);
  const totalWithPurge = mod.ID_MM_MM_TotalFree();
  if (totalWithPurge < unusedBeforePurge + 1024) {
    fail(`ID_MM total free did not include purgable blocks: ${JSON.stringify({ unusedBeforePurge, totalWithPurge })}`);
  }

  mod.ID_MM_MM_SetLock(refB, true);
  const sorted = mod.ID_MM_MM_SortMem();
  if (refA.value !== null || refB.value === null || sorted.lockedBlocks < 1) {
    fail(`ID_MM sort did not purge unlocked purgable blocks while preserving locked blocks: ${JSON.stringify(sorted)}`);
  }

  const refC = mod.ID_MM_MM_NewPtrRef();
  mod.ID_MM_MM_GetPtr(refC, 512);
  mod.ID_MM_MM_SetPurge(refC, 1);
  const cleared = mod.ID_MM_MML_ClearBlock();
  if (refC.value !== null || cleared.purgableBlocks !== 0) {
    fail(`ID_MM clear block did not free the purgable block: ${JSON.stringify(cleared)}`);
  }

  mod.ID_MM_MM_BombOnError(false);
  const refHuge = mod.ID_MM_MM_NewPtrRef();
  const huge = mod.ID_MM_MM_GetPtr(refHuge, 0x400000);
  const failed = mod.ID_MM_MM_DebugState();
  if (huge !== null || !failed.mmerror || refHuge.value !== null) {
    fail(`ID_MM non-bombing allocation failure did not set mmerror: ${JSON.stringify(failed)}`);
  }
  mod.ID_MM_MM_BombOnError(true);

  mod.ID_MM_MM_FreePtr(refB);
  if (refB.value !== null) {
    fail("ID_MM_FreePtr did not clear the memptr reference");
  }
  const shutdown = mod.ID_MM_MM_Shutdown();
  if (shutdown.started || shutdown.allocatedBlocks || mod.ID_MM_bufferseg.value !== null) {
    fail(`ID_MM shutdown did not clear memory manager state: ${JSON.stringify(shutdown)}`);
  }

  return {
    startupFree: startup.unusedMemory,
    refASegment,
    refBSegment,
    totalWithPurge,
    sortedBlocks: sorted.allocatedBlocks,
    hugeFailed: failed.mmerror,
  };
}

function checkRuntimeSoundManager(mod) {
  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: false });
  const fallbackResult = mod.ID_SD_SD_SetSoundMode(mod.ID_SD_sdm_AdLib);
  const fallbackState = mod.ID_SD_SD_DebugState();
  if (!fallbackResult || fallbackState.SoundMode !== mod.ID_SD_sdm_PC || fallbackState.TimerRate !== 140) {
    fail(`SD_SetSoundMode did not fall back from absent AdLib to PC: ${JSON.stringify(fallbackState)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true });
  if (!mod.ID_SD_SD_SetSoundMode(mod.ID_SD_sdm_AdLib)) {
    fail("SD_SetSoundMode rejected present AdLib hardware");
  }
  if (!mod.ID_SD_SD_SetMusicMode(mod.ID_SD_smm_AdLib)) {
    fail("SD_SetMusicMode rejected present AdLib music hardware");
  }
  const musicMode = mod.ID_SD_SD_DebugState();
  if (
    musicMode.SoundMode !== mod.ID_SD_sdm_AdLib ||
    musicMode.MusicMode !== mod.ID_SD_smm_AdLib ||
    !musicMode.NeedsMusic ||
    musicMode.TimerRate !== 700
  ) {
    fail(`SD_SetMusicMode did not set AdLib music state: ${JSON.stringify(musicMode)}`);
  }
  mod.ID_SD_SD_MusicOn();
  if (!mod.ID_SD_SD_DebugState().sqActive || mod.ID_SD_SD_MusicPlaying()) {
    fail("SD_MusicOn/SD_MusicPlaying did not preserve the original always-false query behavior");
  }
  mod.ID_SD_SD_FadeOutMusic();
  const fadedMusic = mod.ID_SD_SD_DebugState();
  const fadeWriteCount = mod.ID_SD_alRegisterWrites.length;
  if (fadedMusic.sqActive || fadeWriteCount !== 11) {
    fail(`SD_FadeOutMusic did not emit the expected AdLib note-off writes: ${JSON.stringify(fadedMusic)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ SoundBlasterPresent: true });
  const sbDigi = mod.ID_SD_SD_SetDigiDevice(mod.ID_SD_sds_SoundBlaster);
  const sbPosition = mod.ID_SD_SD_SetPosition(3, 12);
  if (sbDigi.DigiMode !== mod.ID_SD_sds_SoundBlaster || !sbPosition.appliedToSoundBlaster) {
    fail(`SD_SetDigiDevice/SD_SetPosition did not model SoundBlaster positioning: ${JSON.stringify({ sbDigi, sbPosition })}`);
  }
  let illegalPosition = false;
  try {
    mod.ID_SD_SD_SetPosition(15, 15);
  } catch (error) {
    illegalPosition = error instanceof RangeError;
  }
  if (!illegalPosition) {
    fail("SD_SetPosition accepted the illegal 15,15 stereo position");
  }

  mod.ID_SD_SD_ResetSoundState({ SoundSourcePresent: true });
  const sourceFallback = mod.ID_SD_SD_SetDigiDevice(mod.ID_SD_sds_SoundBlaster);
  if (sourceFallback.DigiMode !== mod.ID_SD_sds_SoundSource || !sourceFallback.soundSourceActive) {
    fail(`SD_SetDigiDevice did not fall back from missing SoundBlaster to Sound Source: ${JSON.stringify(sourceFallback)}`);
  }
  mod.ID_SD_SD_ResetSoundState();
  const missingDigi = mod.ID_SD_SD_SetDigiDevice(mod.ID_SD_sds_SoundBlaster);
  if (missingDigi.DigiMode !== mod.ID_SD_sds_Off) {
    fail(`SD_SetDigiDevice changed mode even though the requested device was absent: ${JSON.stringify(missingDigi)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[5] = { length: 12, priority: 7 };
  mod.ID_SD_SoundTable[6] = { length: 12, priority: 2 };
  mod.ID_SD_SD_PositionSound(4, 9);
  const playReturn = mod.ID_SD_SD_PlaySound(5);
  const playingState = mod.ID_SD_SD_DebugState();
  if (
    playReturn ||
    playingState.SoundNumber !== 5 ||
    playingState.SoundPriority !== 7 ||
    playingState.LeftPosition !== 0 ||
    playingState.RightPosition !== 0 ||
    playingState.nextsoundpos ||
    mod.ID_SD_SD_SoundPlaying() !== 5
  ) {
    fail(`SD_PlaySound did not mirror non-digitized PC sound state: ${JSON.stringify(playingState)}`);
  }
  const lowPriorityReturn = mod.ID_SD_SD_PlaySound(6);
  if (lowPriorityReturn || mod.ID_SD_SD_DebugState().SoundNumber !== 5) {
    fail("SD_PlaySound allowed a lower-priority sound to replace the active sound");
  }
  const waitWhilePlaying = mod.ID_SD_SD_WaitSoundDone();
  if (waitWhilePlaying) {
    fail("SD_WaitSoundDone reported completion while the modeled PC sound was still active");
  }
  mod.ID_SD_SD_StopSound();
  if (mod.ID_SD_SD_SoundPlaying() !== 0 || mod.ID_SD_SD_DebugState().SoundPriority !== 0) {
    fail("SD_StopSound did not clear the active sound number and priority");
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[5] = { length: 3, priority: 7, data: [9, 9, 0] };
  mod.ID_SD_SD_PlaySound(5);
  mod.ID_SD_SDL_PCService();
  mod.ID_SD_SDL_PCService();
  const pcDrained = mod.ID_SD_SDL_PCService();
  if (mod.ID_SD_SD_SoundPlaying() !== 0 || pcDrained.pcLengthLeft !== 0 || pcDrained.pcSoundActive) {
    fail(`SDL_PCService did not drain and finish a PC sound: ${JSON.stringify(pcDrained)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  let hookTicks = 0;
  mod.ID_SD_SD_SetUserHook(() => {
    hookTicks++;
  });
  const timerRate = mod.ID_SD_SDL_SetIntsPerSec(140);
  const timerDivisor = mod.ID_SD_SD_DebugState().TimerDivisor;
  mod.ID_SD_SDL_t0Service();
  const timerTick = mod.ID_SD_SDL_t0Service();
  const pcExtremeDivisor = mod.ID_SD_SDL_SetTimer0(170);
  if (
    timerRate !== 140 ||
    timerDivisor !== 8514 ||
    timerTick.TimeCount !== 1 ||
    timerTick.HackCount !== 2 ||
    hookTicks !== 1 ||
    pcExtremeDivisor !== 1702
  ) {
    fail(`SDL timer service did not mirror the deterministic timer model: ${JSON.stringify({ timerRate, timerDivisor, timerTick, hookTicks, pcExtremeDivisor })}`);
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true, SoundMode: mod.ID_SD_sdm_AdLib });
  mod.ID_SD_SoundTable[6] = {
    length: 2,
    priority: 8,
    data: [5, 6],
    block: 1,
    inst: { mSus: 1, cSus: 1 },
  };
  mod.ID_SD_SD_PlaySound(6);
  const alPlaying = mod.ID_SD_SD_DebugState();
  if (!alPlaying.alSoundActive || alPlaying.alLengthLeft !== 2 || mod.ID_SD_alRegisterWrites.length !== 23) {
    fail(`SDL_ALPlaySound did not initialize the deterministic AdLib state: ${JSON.stringify(alPlaying)}`);
  }
  mod.ID_SD_SDL_ALSoundService();
  const alDrained = mod.ID_SD_SDL_ALSoundService();
  if (mod.ID_SD_SD_SoundPlaying() !== 0 || alDrained.alLengthLeft !== 0 || alDrained.alSoundActive) {
    fail(`SDL_ALSoundService did not drain and finish an AdLib sound: ${JSON.stringify(alDrained)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true, SoundBlasterPresent: true, SoundSourcePresent: true, DigiMode: mod.ID_SD_sds_SoundBlaster });
  if (
    !mod.ID_SD_SDL_DetectAdLib() ||
    !mod.ID_SD_SDL_DetectSoundBlaster() ||
    !mod.ID_SD_SDL_DetectSoundSource() ||
    !mod.ID_SD_SDL_CheckSB() ||
    !mod.ID_SD_SDL_CheckSS()
  ) {
    fail("SDL hardware detection helpers did not reflect the modeled present-device flags");
  }
  if (!mod.DETECT_SDL_DetectSoundBlaster(-1) || mod.DETECT_sbLocation !== 0x20) {
    fail(`DETECT SDL_DetectSoundBlaster did not find the modeled default SoundBlaster port: ${mod.DETECT_sbLocation}`);
  }
  mod.ID_SD_SD_ResetSoundState({ SoundBlasterPresent: false });
  if (mod.DETECT_SDL_DetectSoundBlaster(0) || mod.DETECT_sbLocation !== -1) {
    fail(`DETECT SDL_DetectSoundBlaster reported absent hardware as present: ${mod.DETECT_sbLocation}`);
  }
  mod.ID_SD_SD_ResetSoundState({ SoundBlasterPresent: true, DigiMode: mod.ID_SD_sds_SoundBlaster });
  const loadedDigi = mod.ID_SD_SDL_LoadDigiSegment(4, 3);
  const lowLevelSbPosition = mod.ID_SD_SDL_PositionSBP(1, 14);
  const sbSegment = mod.ID_SD_SDL_PlayDigiSegment(loadedDigi, loadedDigi.length);
  if (
    !sbSegment.DigiPlaying ||
    !sbSegment.sbSamplePlaying ||
    sbSegment.DigiCurrentSegmentLength !== 3 ||
    lowLevelSbPosition.left !== 1 ||
    lowLevelSbPosition.right !== 14
  ) {
    fail(`SDL_PlayDigiSegment did not start a positioned SoundBlaster segment: ${JSON.stringify({ sbSegment, lowLevelSbPosition })}`);
  }
  mod.ID_SD_SDL_SBService();
  mod.ID_SD_SDL_SBService();
  const sbDone = mod.ID_SD_SDL_SBService();
  if (sbDone.DigiPlaying || sbDone.sbSamplePlaying || sbDone.DigiMissed) {
    fail(`SDL_SBService did not complete the final digitized segment: ${JSON.stringify(sbDone)}`);
  }

  mod.ID_SD_SD_PositionSound(8, 1);
  const minusOneReturn = mod.ID_SD_SD_PlaySound(-1);
  const minusOneState = mod.ID_SD_SD_DebugState();
  if (minusOneReturn || minusOneState.LeftPosition !== 0 || minusOneState.RightPosition !== 0 || minusOneState.nextsoundpos) {
    fail(`SD_PlaySound(-1) did not clear the pending positioned-sound latch: ${JSON.stringify(minusOneState)}`);
  }

  mod.ID_SD_SD_ResetSoundState();
  const offReturn = mod.ID_SD_SD_PlaySound(5);
  if (offReturn || mod.ID_SD_SD_DebugState().SoundNumber !== 0) {
    fail("SD_PlaySound should be inert when SoundMode is off");
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_SD_SoundTable[5] = { length: 0, priority: 1 };
  let zeroLengthError = false;
  try {
    mod.ID_SD_SD_PlaySound(5);
  } catch (error) {
    zeroLengthError = error instanceof Error && /Zero length sound/.test(error.message);
  }
  if (!zeroLengthError) {
    fail("SD_PlaySound accepted a zero-length sound");
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: true });
  const defaultAdlib = mod.ID_SD_SD_Default(false, mod.ID_SD_sdm_PC, mod.ID_SD_smm_Off);
  if (defaultAdlib.SoundMode !== mod.ID_SD_sdm_AdLib || defaultAdlib.MusicMode !== mod.ID_SD_smm_AdLib) {
    fail(`SD_Default did not choose AdLib defaults when present: ${JSON.stringify(defaultAdlib)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ AdLibPresent: false });
  const defaultPc = mod.ID_SD_SD_Default(false, mod.ID_SD_sdm_AdLib, mod.ID_SD_smm_AdLib);
  if (defaultPc.SoundMode !== mod.ID_SD_sdm_PC || defaultPc.MusicMode !== mod.ID_SD_smm_Off) {
    fail(`SD_Default did not fall back to PC sound and no music without AdLib: ${JSON.stringify(defaultPc)}`);
  }

  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC, DigiMode: mod.ID_SD_sds_PC });
  const digiSetup = mod.ID_SD_SDL_SetupDigi(46);
  mod.WL_MAIN_InitDigiMap();
  mod.ID_SD_SoundTable[21] = { length: 4, priority: 9 };
  mod.ID_SD_SD_PositionSound(2, 4);
  const digitizedReturn = mod.ID_SD_SD_PlaySound(21);
  const digitizedState = mod.ID_SD_SD_DebugState();
  if (
    !digitizedReturn ||
    digiSetup.NumDigi !== 46 ||
    !digitizedState.DigiPlaying ||
    !digitizedState.SoundPositioned ||
    digitizedState.SoundNumber !== 21 ||
    digitizedState.SoundPriority !== 9 ||
    digitizedState.TimerRate !== 7000
  ) {
    fail(`SD_PlaySound did not take the mapped PC digitized path: ${JSON.stringify(digitizedState)}`);
  }

  return {
    fallbackMode: fallbackState.SoundMode,
    musicMode: musicMode.MusicMode,
    adlibWrites: fadeWriteCount,
    sourceFallback: sourceFallback.DigiMode,
    playingSound: playingState.SoundNumber,
    pcService: pcDrained.pcLastSample,
    timer: [timerTick.TimeCount, timerTick.HackCount, timerDivisor],
    adlibService: alDrained.alTimeCount,
    sbSegment: sbDone.DigiCurrentSegmentLength,
    waitWhilePlaying,
    defaultAdlib: [defaultAdlib.SoundMode, defaultAdlib.MusicMode],
    defaultPc: [defaultPc.SoundMode, defaultPc.MusicMode],
    digitizedSound: [digitizedState.SoundNumber, digitizedState.TimerRate],
  };
}

function checkRuntimeClearMemory(mod) {
  mod.ID_MM_MM_Startup(0x20000);
  const purgable = mod.ID_MM_MM_NewPtrRef();
  const bytes = mod.ID_MM_MM_GetPtr(purgable, 1024);
  if (!bytes) {
    fail("ClearMemory setup could not allocate a purgable memory block");
  }
  mod.ID_MM_MM_SetPurge(purgable, 3);

  mod.ID_PM_PM_SetMainMemPurge(0);
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC, DigiMode: mod.ID_SD_sds_PC });
  mod.ID_SD_SDL_SetupDigi(2);
  const playing = mod.ID_SD_SD_PlayDigitized(0, 3, 5);
  if (!playing.DigiPlaying || playing.DigiCurrentSegmentLength !== 1) {
    fail(`ClearMemory setup did not start a deterministic digitized sample: ${JSON.stringify(playing)}`);
  }

  const cleared = mod.WL_GAME_ClearMemory();
  if (
    cleared.page.mainPurgeLevel !== 3 ||
    cleared.sound.DigiPlaying ||
    cleared.sound.DigiCurrentSegmentLength !== 0 ||
    cleared.memory.purgableBlocks !== 0 ||
    purgable.value !== null
  ) {
    fail(`WL_GAME_ClearMemory did not run PM_UnlockMainMem, SD_StopDigitized, MM_SortMem: ${JSON.stringify(cleared)}`);
  }
  mod.ID_MM_MM_Shutdown();

  const demoStart = mod.WL_GAME_StartDemoRecord(12, {
    commands: [
      { buttonbits: 5, controlx: -2, controly: 3 },
      { buttonbits: 128, controlx: 7, controly: -8 },
    ],
  });
  if (
    demoStart.maxSize !== mod.WL_GAME_MAXDEMOSIZE ||
    demoStart.demoptr !== 10 ||
    demoStart.lastdemoptr !== mod.WL_GAME_MAXDEMOSIZE ||
    !demoStart.demorecord ||
    !mod.WL_GAME_demorecord ||
    JSON.stringify([...demoStart.buffer]) !== JSON.stringify([12, 0, 0, 0, 5, 254, 3, 128, 7, 248])
  ) {
    fail(`WL_GAME_StartDemoRecord did not initialize the original demo buffer layout: ${JSON.stringify(demoStart)}`);
  }
  const demoWrites = [];
  const demoFinish = mod.WL_GAME_FinishDemoRecord({
    demoNumber: "4",
    centerWindow: (w, h) => [w, h],
    print: (text) => text,
    update: () => "update",
    writeFile: (name, data) => {
      demoWrites.push([name, [...data]]);
      return { name, bytes: data.length };
    },
  });
  if (
    demoFinish.length !== 10 ||
    demoFinish.buffer[0] !== 12 ||
    demoFinish.buffer[1] !== 10 ||
    demoFinish.buffer[2] !== 0 ||
    demoFinish.filename !== "DEMO4." ||
    demoFinish.written?.bytes !== 10 ||
    JSON.stringify(demoWrites[0]?.[0]) !== JSON.stringify("DEMO4.") ||
    mod.WL_GAME_demoname !== "DEMO4." ||
    mod.WL_GAME_demorecord
  ) {
    fail(`WL_GAME_FinishDemoRecord did not patch length and write selected DEMO file: ${JSON.stringify({ demoFinish, demoWrites })}`);
  }

  mod.WL_GAME_StartDemoRecord(1);
  const skippedFinish = mod.WL_GAME_FinishDemoRecord({ demoNumber: 99, writeFile: () => "bad" });
  if (skippedFinish.filename !== null || skippedFinish.written !== null || skippedFinish.length !== 4) {
    fail(`WL_GAME_FinishDemoRecord wrote a file for an out-of-range demo number: ${JSON.stringify(skippedFinish)}`);
  }

  const recordEscaped = mod.WL_GAME_RecordDemo({ levelInput: null, update: () => "update", fadeIn: () => "fade-in" });
  const recordCalls = [];
  const recordFlow = mod.WL_GAME_RecordDemo({
    levelInput: "7",
    centerWindow: (w, h) => { recordCalls.push(`center:${w}x${h}`); return [w, h]; },
    print: (text) => { recordCalls.push(`print:${text}`); return text; },
    update: () => { recordCalls.push("update"); return "update"; },
    fadeIn: () => { recordCalls.push("fade-in"); return `fade-in-${recordCalls.length}`; },
    fadeOut: () => { recordCalls.push("fade-out"); return `fade-out-${recordCalls.length}`; },
    newGame: (difficulty, episode) => { recordCalls.push(`new:${difficulty}/${episode}`); return [difficulty, episode]; },
    setMap: (mapon) => { recordCalls.push(`map:${mapon}`); return mapon; },
    startDemoRecord: (level) => { recordCalls.push(`start:${level}`); return level; },
    drawPlayScreen: () => { recordCalls.push("draw"); return "draw"; },
    setupGameLevel: () => { recordCalls.push("setup"); return "setup"; },
    startMusic: () => { recordCalls.push("music"); return "music"; },
    checkMainMem: () => { recordCalls.push("mem"); return "mem"; },
    playLoop: () => { recordCalls.push("play"); return "play"; },
    stopMusic: () => { recordCalls.push("stop"); return "stop"; },
    clearMemory: () => { recordCalls.push("clear"); return "clear"; },
    finishDemoRecord: () => { recordCalls.push("finish"); return "finish"; },
  });
  if (
    !recordEscaped.escaped ||
    recordEscaped.level !== null ||
    recordFlow.escaped ||
    recordFlow.level !== 6 ||
    JSON.stringify(recordFlow.newGame) !== JSON.stringify([3, 0]) ||
    recordFlow.map !== 6 ||
    recordFlow.startDemoRecord !== 6 ||
    recordFlow.demorecord ||
    recordFlow.fizzlein !== true ||
    recordFlow.demoplayback ||
    recordFlow.finishDemoRecord !== "finish" ||
    mod.WL_GAME_demorecord ||
    JSON.stringify(recordCalls) !== JSON.stringify([
      "center:26x3",
      "print:  Demo which level(1-10):",
      "update",
      "fade-in",
      "fade-out",
      "new:3/0",
      "map:6",
      "start:6",
      "draw",
      "fade-in",
      "setup",
      "music",
      "mem",
      "play",
      "stop",
      "fade-out",
      "clear",
      "finish",
    ])
  ) {
    fail(`WL_GAME_RecordDemo did not preserve the bounded record-demo shell: ${JSON.stringify({ recordEscaped, recordFlow, recordCalls })}`);
  }

  const gameLoopCalls = [];
  const gameLoop = mod.WL_GAME_GameLoop({
    state: { mapon: 8, episode: 2, score: 1234, oldscore: 1000, lives: 2, keys: 3 },
    playstates: [9, 1, 6],
    maxIterations: 3,
    clearMemory: () => { gameLoopCalls.push("clear"); return "clear"; },
    setFont: () => { gameLoopCalls.push("font"); return "font"; },
    drawPlayScreen: () => { gameLoopCalls.push("screen"); return "screen"; },
    drawScore: (state) => { gameLoopCalls.push(`score:${state.score}`); return state.score; },
    setupGameLevel: (state) => { gameLoopCalls.push(`setup:${state.mapon}`); return state.mapon; },
    startMusic: () => { gameLoopCalls.push("music"); return "music"; },
    checkMainMem: () => { gameLoopCalls.push("mem"); return "mem"; },
    preloadGraphics: () => { gameLoopCalls.push("preload"); return "preload"; },
    drawLevel: (state) => { gameLoopCalls.push(`level:${state.mapon}`); return state.mapon; },
    playLoop: (iteration) => { gameLoopCalls.push(`play:${iteration}`); return null; },
    stopMusic: () => { gameLoopCalls.push("stop"); return "stop"; },
    drawKeys: (state) => { gameLoopCalls.push(`keys:${state.keys}`); return state.keys; },
    fadeOut: () => { gameLoopCalls.push("fade"); return "fade"; },
    levelCompleted: (state) => { gameLoopCalls.push(`complete:${state.mapon}`); return state.mapon; },
    victory: (state) => { gameLoopCalls.push(`victory:${state.mapon}`); return state.mapon; },
    checkHighScore: (score, completed) => { gameLoopCalls.push(`high:${score}/${completed}`); return [score, completed]; },
  });
  if (
    gameLoop.clearMemory !== "clear" ||
    gameLoop.setFont !== "font" ||
    gameLoop.drawPlayScreen !== "screen" ||
    gameLoop.iterations.length !== 3 ||
    gameLoop.iterations[0].branch !== "secretlevel" ||
    gameLoop.iterations[0].stateAfter.mapon !== 9 ||
    gameLoop.iterations[0].stateAfter.keys !== 0 ||
    gameLoop.iterations[1].branch !== "completed" ||
    gameLoop.iterations[1].stateAfter.mapon !== 7 ||
    gameLoop.iterations[2].branch !== "victorious" ||
    gameLoop.iterations[2].branchActions[4]?.[1] !== 8 ||
    gameLoop.finalState.mapon !== 7 ||
    gameLoop.ingame ||
    gameLoop.bounded
  ) {
    fail(`WL_GAME_GameLoop did not model bounded WL6 branch transitions: ${JSON.stringify({ gameLoop, gameLoopCalls })}`);
  }

  const diedRefreshAngles = [];
  const died = mod.WL_GAME_Died({
    player: {
      x: 0,
      y: 0,
      angle: 10,
      weapon: 2,
      bestweapon: 3,
      chosenweapon: 3,
      lives: 1,
      health: 12,
      ammo: 4,
      keys: 3,
      attackframe: 4,
      attackcount: 5,
      weaponframe: 6,
    },
    killer: { x: 100, y: 0, angle: 0 },
    tics: [2, 2, 2],
    playDeathSound: () => "death",
    refresh: (angle) => { diedRefreshAngles.push(angle); return angle; },
    finishPaletteShifts: () => "palette",
    redBar: () => "red",
    clearKeysDown: () => "keys",
    fizzleFade: () => "fizzle",
    userInput: (ticks) => `input-${ticks}`,
    waitSoundDone: () => "wait",
    drawKeys: (state) => state.keys,
    drawWeapon: (state) => state.weapon,
    drawAmmo: (state) => state.ammo,
    drawHealth: (state) => state.health,
    drawFace: (state) => state.angle,
    drawLives: (state) => state.lives,
  });
  if (
    died.targetAngle !== 0 ||
    died.direction !== "counterclockwise" ||
    JSON.stringify(died.rotations.map((step) => step.angle)) !== JSON.stringify([6, 2, 0]) ||
    JSON.stringify(diedRefreshAngles) !== JSON.stringify([6, 2, 0]) ||
    died.playDeathSound !== "death" ||
    died.finishPaletteShifts !== "palette" ||
    died.userInput !== "input-100" ||
    died.livesBefore !== 1 ||
    died.livesAfter !== 0 ||
    !died.reset ||
    died.player.weapon !== 1 ||
    died.player.ammo !== 8 ||
    died.player.keys !== 0 ||
    JSON.stringify(died.draws) !== JSON.stringify([0, 1, 8, 100, 0, 0])
  ) {
    fail(`WL_GAME_Died did not rotate toward killer and reset player state like the source: ${JSON.stringify({ died, diedRefreshAngles })}`);
  }

  return {
    mainPurgeLevel: cleared.page.mainPurgeLevel,
    digiPlaying: cleared.sound.DigiPlaying,
    purgableBlocks: cleared.memory.purgableBlocks,
    demoRecord: [demoFinish.length, demoFinish.filename, recordFlow.level],
    gameLoop: [gameLoop.iterations.length, gameLoop.finalState.mapon, gameLoop.iterations[2].branch],
    died: [died.targetAngle, died.livesAfter, died.player.ammo],
  };
}

function checkRuntimeActorDamage(mod) {
  const AC_YES = 1;
  const FL_SHOOTABLE = 1;
  const FL_ATTACKMODE = 16;
  const FL_FIRSTATTACK = 32;
  const FL_NONMARK = 128;
  const GUARDOBJ = 3;
  const OFFICEROBJ = 4;
  const SSOBJ = 5;
  const DOGOBJ = 6;
  const BOSSOBJ = 7;
  const SCHABBOBJ = 8;
  const MUTANTOBJ = 11;
  const REALHITLEROBJ = 16;
  const GIFTOBJ = 18;
  const FATOBJ = 19;
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const GAMESTATE_SCORE_OFFSET = 8;
  const GAMESTATE_NEXTEXTRA_OFFSET = 12;
  const GAMESTATE_LIVES_OFFSET = 16;
  const GAMESTATE_BESTWEAPON_OFFSET = 24;
  const GAMESTATE_KILLCOUNT_OFFSET = 44;
  const GAMESTATE_KILLX_OFFSET = 56;
  const GAMESTATE_KILLY_OFFSET = 60;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_HITPOINTS_OFFSET = 44;
  const STAT_TILEX_OFFSET = 0;
  const STAT_TILEY_OFFSET = 1;
  const STAT_SHAPENUM_OFFSET = 4;
  const STAT_FLAGS_OFFSET = 6;
  const STAT_ITEMNUMBER_OFFSET = 7;
  const BO_KEY1 = 5;
  const BO_CLIP2 = 14;
  const BO_MACHINEGUN = 15;
  const WP_MACHINEGUN = 2;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");

  function actoratCellOffset(tilex, tiley) {
    return actorat + (tilex * 64 + tiley) * 2;
  }

  function makeScene({
    actorX = 12,
    actorY = 10,
    playerX = 10,
    playerY = 10,
    obclass = GUARDOBJ,
    hitpoints = 25,
    attackMode = true,
    state = "_s_grdstand",
  } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, state).actor;
    dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);
    dgroup.setU16(actor + OBJ_CLASS_OFFSET, obclass);
    dgroup.setU8(actor + OBJ_FLAGS_OFFSET, FL_SHOOTABLE | (attackMode ? FL_ATTACKMODE : 0));
    dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, hitpoints);
    return { dgroup, plane0, plane1, actor };
  }

  function expectPlacedItem(dgroup, placed, itemType, tilex, tiley, label) {
    if (!placed || placed.itemType !== itemType || placed.tilex !== tilex || placed.tiley !== tiley) {
      fail(`${label} placed item summary mismatch: ${JSON.stringify(placed)}`);
    }
    if (
      dgroup.u8(placed.statobj + STAT_TILEX_OFFSET) !== tilex ||
      dgroup.u8(placed.statobj + STAT_TILEY_OFFSET) !== tiley ||
      dgroup.u16(placed.statobj + STAT_SHAPENUM_OFFSET) !== placed.picnum ||
      dgroup.u8(placed.statobj + STAT_FLAGS_OFFSET) !== 2 ||
      dgroup.u8(placed.statobj + STAT_ITEMNUMBER_OFFSET) !== itemType
    ) {
      fail(`${label} did not write the statobj entry`);
    }
  }

  const drop = makeScene();
  dgroupFillActorat(drop.dgroup, actorat, 10, 10, 0x1234);
  const dropSummary = mod.DropItemMemory(drop.dgroup, BO_CLIP2, 10, 10);
  expectPlacedItem(drop.dgroup, dropSummary.placed, BO_CLIP2, 9, 9, "DropItemMemory");

  const wrapperDrop = makeScene();
  const wrapperDropSummary = mod.WL_STATE_DropItem(wrapperDrop.dgroup, BO_KEY1, 13, 10);
  expectPlacedItem(wrapperDrop.dgroup, wrapperDropSummary.placed, BO_KEY1, 13, 10, "WL_STATE_DropItem");

  const guard = makeScene({ hitpoints: 1 });
  guard.dgroup.setU32(gamestate + GAMESTATE_SCORE_OFFSET, 39950);
  guard.dgroup.setU32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET, 40000);
  guard.dgroup.setU16(gamestate + GAMESTATE_LIVES_OFFSET, 8);
  const guardKill = mod.KillActorMemory(guard.dgroup, guard.actor);
  expectPlacedItem(guard.dgroup, guardKill.dropped, BO_CLIP2, 12, 10, "KillActorMemory guard");
  if (
    guardKill.state !== "_s_grddie1" ||
    guardKill.score !== 40050 ||
    guardKill.lives !== 9 ||
    guard.dgroup.u32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET) !== 80000 ||
    guardKill.killcount !== 1 ||
    guard.dgroup.u16(actoratCellOffset(12, 10)) !== 0 ||
    (guard.dgroup.u8(guard.actor + OBJ_FLAGS_OFFSET) & FL_SHOOTABLE) !== 0 ||
    (guard.dgroup.u8(guard.actor + OBJ_FLAGS_OFFSET) & FL_NONMARK) === 0
  ) {
    fail("KillActorMemory did not apply guard score/state/drop/bookkeeping");
  }

  const ssMachinegun = makeScene({ obclass: SSOBJ, hitpoints: 1 });
  const ssMachinegunKill = mod.WL_STATE_KillActor(ssMachinegun.dgroup, ssMachinegun.actor);
  expectPlacedItem(
    ssMachinegun.dgroup,
    ssMachinegunKill.dropped,
    BO_MACHINEGUN,
    12,
    10,
    "WL_STATE_KillActor SS machinegun",
  );

  const ssClip = makeScene({ obclass: SSOBJ, hitpoints: 1 });
  ssClip.dgroup.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, WP_MACHINEGUN);
  const ssClipKill = mod.KillActorMemory(ssClip.dgroup, ssClip.actor);
  expectPlacedItem(ssClip.dgroup, ssClipKill.dropped, BO_CLIP2, 12, 10, "KillActorMemory SS clip");

  const dog = makeScene({ obclass: DOGOBJ, hitpoints: 1 });
  const dogKill = mod.KillActorMemory(dog.dgroup, dog.actor);
  if (dogKill.state !== "_s_dogdie1" || dogKill.dropped !== null || dogKill.score !== 200) {
    fail("KillActorMemory did not apply dog death behavior");
  }

  for (const [obclass, expectedState] of [
    [BOSSOBJ, "_s_bossdie1"],
    [SCHABBOBJ, "_s_schabbdie1"],
    [REALHITLEROBJ, "_s_hitlerdie1"],
    [GIFTOBJ, "_s_giftdie1"],
    [FATOBJ, "_s_fatdie1"],
  ]) {
    const boss = makeScene({ obclass, hitpoints: 1 });
    const kill = mod.KillActorMemory(boss.dgroup, boss.actor);
    if (kill.state !== expectedState || kill.score !== 5000) {
      fail(`KillActorMemory did not set ${expectedState}`);
    }
    if (
      (obclass === BOSSOBJ && (!kill.dropped || kill.dropped.itemType !== BO_KEY1)) ||
      (obclass !== BOSSOBJ &&
        (kill.killx !== (10 << TILESHIFT) + TILEGLOBAL / 2 ||
          kill.killy !== (10 << TILESHIFT) + TILEGLOBAL / 2))
    ) {
      fail(`KillActorMemory special boss bookkeeping mismatch for ${expectedState}`);
    }
  }

  const pain = makeScene({ hitpoints: 20, attackMode: true });
  const painSummary = mod.DamageActorMemory(pain.dgroup, pain.actor, 5);
  if (
    painSummary.killed ||
    painSummary.damage !== 5 ||
    painSummary.hitpoints !== 15 ||
    painSummary.state !== "_s_grdpain"
  ) {
    fail("DamageActorMemory did not set odd guard pain state");
  }

  const sightPain = makeScene({
    obclass: OFFICEROBJ,
    hitpoints: 20,
    attackMode: false,
    state: "_s_ofcstand",
  });
  const sightPainSummary = mod.WL_STATE_DamageActor(sightPain.dgroup, sightPain.actor, 4);
  if (
    sightPainSummary.killed ||
    !sightPainSummary.doubled ||
    sightPainSummary.damage !== 8 ||
    sightPainSummary.hitpoints !== 12 ||
    sightPainSummary.state !== "_s_ofcpain1" ||
    (sightPain.dgroup.u8(sightPain.actor + OBJ_FLAGS_OFFSET) & (FL_ATTACKMODE | FL_FIRSTATTACK)) !==
      (FL_ATTACKMODE | FL_FIRSTATTACK)
  ) {
    fail("WL_STATE_DamageActor did not double non-attack damage and enter pain/attack mode");
  }

  const killed = makeScene({
    obclass: MUTANTOBJ,
    hitpoints: 10,
    attackMode: false,
    state: "_s_mutstand",
  });
  const killedSummary = mod.WL_STATE_DamageActor(killed.dgroup, killed.actor, 5);
  if (
    !killedSummary.killed ||
    killedSummary.damage !== 10 ||
    killedSummary.state !== "_s_mutdie1" ||
    killedSummary.kill?.score !== 700 ||
    killed.dgroup.u16(gamestate + GAMESTATE_KILLCOUNT_OFFSET) !== 1
  ) {
    fail("WL_STATE_DamageActor did not kill through KillActorMemory");
  }

  return {
    droppedTile: [dropSummary.placed.tilex, dropSummary.placed.tiley],
    guardScore: guardKill.score,
    guardLives: guardKill.lives,
    ssDrop: ssMachinegunKill.dropped.itemType,
    painState: painSummary.state,
    killedState: killedSummary.state,
  };
}

function dgroupFillActorat(dgroup, actorat, tilex, tiley, value) {
  dgroup.setU16(actorat + (tilex * 64 + tiley) * 2, value);
}

function checkRuntimePlayerEquipment(mod) {
  const GAMESTATE_SCORE_OFFSET = 8;
  const GAMESTATE_NEXTEXTRA_OFFSET = 12;
  const GAMESTATE_LIVES_OFFSET = 16;
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_KEYS_OFFSET = 22;
  const GAMESTATE_BESTWEAPON_OFFSET = 24;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_ATTACKFRAME_OFFSET = 32;
  const GAMESTATE_ATTACKCOUNT_OFFSET = 34;
  const GAMESTATE_WEAPONFRAME_OFFSET = 36;
  const OBJ_STATE_OFFSET = 6;
  const WP_KNIFE = 0;
  const WP_PISTOL = 1;
  const WP_MACHINEGUN = 2;
  const WP_CHAINGUN = 3;
  const BT_ATTACK = 0;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const buttonheld = mod.nearOffsetForRuntimeSymbol("_buttonheld");
  const madenoise = mod.nearOffsetForRuntimeSymbol("_madenoise");

  function makeScene() {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);
    return { dgroup, plane0, player: dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player")) };
  }

  const points = makeScene();
  points.dgroup.setU32(gamestate + GAMESTATE_SCORE_OFFSET, 39990);
  points.dgroup.setU32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET, 40000);
  points.dgroup.setU16(gamestate + GAMESTATE_LIVES_OFFSET, 8);
  const pointsSummary = mod.WL_AGENT_GivePoints(points.dgroup, 20);
  if (
    pointsSummary.score !== 40010 ||
    pointsSummary.nextextra !== 80000 ||
    pointsSummary.lives !== 9
  ) {
    fail("WL_AGENT_GivePoints did not apply score/extra-life bookkeeping");
  }
  points.dgroup.setU16(gamestate + GAMESTATE_LIVES_OFFSET, 9);
  if (mod.WL_AGENT_GiveExtraMan(points.dgroup) !== 9) {
    fail("WL_AGENT_GiveExtraMan exceeded the Wolf3D lives cap");
  }

  const ammo = makeScene();
  ammo.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 0);
  ammo.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 0);
  ammo.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_KNIFE);
  ammo.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_MACHINEGUN);
  const ammoSummary = mod.WL_AGENT_GiveAmmo(ammo.dgroup, 120);
  if (ammoSummary.ammo !== 99 || ammoSummary.weapon !== WP_MACHINEGUN) {
    fail("WL_AGENT_GiveAmmo did not cap ammo or restore chosen weapon from knife");
  }

  const midAttackAmmo = makeScene();
  midAttackAmmo.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 0);
  midAttackAmmo.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 1);
  midAttackAmmo.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_KNIFE);
  midAttackAmmo.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  const midAttackAmmoSummary = mod.GiveAmmoMemory(midAttackAmmo.dgroup, 6);
  if (midAttackAmmoSummary.ammo !== 6 || midAttackAmmoSummary.weapon !== WP_KNIFE) {
    fail("GiveAmmoMemory restored weapon during an active attack frame");
  }

  const weapon = makeScene();
  weapon.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 5);
  const weaponSummary = mod.WL_AGENT_GiveWeapon(weapon.dgroup, WP_MACHINEGUN);
  if (
    weaponSummary.ammo !== 11 ||
    weaponSummary.bestweapon !== WP_MACHINEGUN ||
    weaponSummary.weapon !== WP_MACHINEGUN ||
    weaponSummary.chosenweapon !== WP_MACHINEGUN
  ) {
    fail("WL_AGENT_GiveWeapon did not award ammo and promote weapon state");
  }

  const lowerWeapon = makeScene();
  lowerWeapon.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 97);
  lowerWeapon.dgroup.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, WP_CHAINGUN);
  lowerWeapon.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  lowerWeapon.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  const lowerWeaponSummary = mod.GiveWeaponMemory(lowerWeapon.dgroup, WP_MACHINEGUN);
  if (
    lowerWeaponSummary.ammo !== 99 ||
    lowerWeaponSummary.bestweapon !== WP_CHAINGUN ||
    lowerWeaponSummary.weapon !== WP_CHAINGUN ||
    lowerWeaponSummary.chosenweapon !== WP_CHAINGUN
  ) {
    fail("GiveWeaponMemory downgraded weapon state or failed to cap ammo");
  }

  const key = makeScene();
  key.dgroup.setU16(gamestate + GAMESTATE_KEYS_OFFSET, 1);
  const keySummary = mod.WL_AGENT_GiveKey(key.dgroup, 1);
  if (keySummary.keys !== 3) {
    fail("WL_AGENT_GiveKey did not set the expected key bit");
  }

  const fire = makeScene();
  fire.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  const fireSummary = mod.WL_AGENT_Cmd_Fire(fire.dgroup);
  if (
    fireSummary.player !== fire.player ||
    fireSummary.state !== "_s_attack" ||
    fireSummary.attackframe !== 0 ||
    fireSummary.attackcount !== 6 ||
    fireSummary.weaponframe !== 1 ||
    !fireSummary.buttonHeldAttack ||
    fire.dgroup.u16(fire.player + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_attack") ||
    fire.dgroup.u16(buttonheld + BT_ATTACK * 2) !== 1
  ) {
    fail("WL_AGENT_Cmd_Fire did not initialize attack state from attackinfo");
  }

  const directFire = makeScene();
  directFire.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  const directFireSummary = mod.CmdFireMemory(directFire.dgroup);
  if (directFireSummary.attackcount !== 6 || directFireSummary.weaponframe !== 1) {
    fail("CmdFireMemory did not initialize chaingun frame zero");
  }

  const noise = makeScene();
  const actor = mod.SpawnNewObjMemory(noise.dgroup, noise.plane0, 12, 10, "_s_grdstand").actor;
  noise.dgroup.setU16(actor + 4, 3);
  noise.dgroup.setU8(actor + 8, 1 | 16);
  noise.dgroup.setU16(actor + 44, 20);
  mod.DamageActorMemory(noise.dgroup, actor, 2);
  if (noise.dgroup.u16(madenoise) !== 1) {
    fail("DamageActorMemory did not set the real madenoise global");
  }

  return {
    score: pointsSummary.score,
    ammo: ammoSummary.ammo,
    weapon: weaponSummary.weapon,
    keys: keySummary.keys,
    attackState: fireSummary.state,
    madenoise: noise.dgroup.u16(madenoise),
  };
}

function checkRuntimePlayerAttacks(mod) {
  const FL_SHOOTABLE = 1;
  const FL_VISABLE = 8;
  const FL_ATTACKMODE = 16;
  const GUARDOBJ = 3;
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_NEXT_OFFSET = 56;
  const OBJ_VIEWX_OFFSET = 30;
  const OBJ_TRANSX_OFFSET = 34;
  const OBJ_HITPOINTS_OFFSET = 44;

  const centerx = mod.nearOffsetForRuntimeSymbol("_centerx");
  const shootdelta = mod.nearOffsetForRuntimeSymbol("_shootdelta");
  const madenoise = mod.nearOffsetForRuntimeSymbol("_madenoise");

  function makeScene({ walls = [] } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    for (const [x, y] of walls) {
      plane0[y * 64 + x] = 1;
    }
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);
    dgroup.setU16(centerx, 160);
    dgroup.setU16(shootdelta, 12);
    return { dgroup, plane0, plane1, player: dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player")) };
  }

  function addTarget(scene, { tilex, tiley = 10, viewx = 160, transx = 0x10000, hp = 50 } = {}) {
    const actor = mod.SpawnNewObjMemory(scene.dgroup, scene.plane0, tilex, tiley, "_s_grdstand").actor;
    scene.dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ);
    scene.dgroup.setU8(actor + OBJ_FLAGS_OFFSET, FL_SHOOTABLE | FL_VISABLE | FL_ATTACKMODE);
    scene.dgroup.setU16(actor + OBJ_VIEWX_OFFSET, viewx);
    scene.dgroup.setU32(actor + OBJ_TRANSX_OFFSET, transx);
    scene.dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, hp);
    return actor;
  }

  const knife = makeScene();
  const knifeFar = addTarget(knife, { tilex: 13, transx: 0x28000 });
  const knifeNear = addTarget(knife, { tilex: 11, transx: 0x10000 });
  const knifeOffCenter = addTarget(knife, { tilex: 10, tiley: 11, viewx: 200, transx: 0x08000 });
  if (
    knife.dgroup.u16(knife.player + OBJ_NEXT_OFFSET) !== knifeFar ||
    knife.dgroup.u16(knifeFar + OBJ_NEXT_OFFSET) !== knifeNear ||
    knife.dgroup.u16(knifeNear + OBJ_NEXT_OFFSET) !== knifeOffCenter
  ) {
    fail("attack fixture did not link player targets in insertion order");
  }
  mod.US_InitRndT(false);
  mod.US_RndT();
  const knifeSummary = mod.WL_AGENT_KnifeAttack(knife.dgroup, knife.player);
  if (
    !knifeSummary.hit ||
    knifeSummary.target !== knifeNear ||
    knifeSummary.damage !== 6 ||
    knife.dgroup.u16(knifeNear + OBJ_HITPOINTS_OFFSET) !== 44 ||
    knife.dgroup.u16(knifeOffCenter + OBJ_HITPOINTS_OFFSET) !== 50
  ) {
    fail("WL_AGENT_KnifeAttack did not hit the nearest centered target with deterministic damage");
  }

  const knifeMiss = makeScene();
  addTarget(knifeMiss, { tilex: 13, transx: 0x18001 });
  mod.US_InitRndT(false);
  const knifeMissSummary = mod.KnifeAttackMemory(knifeMiss.dgroup, knifeMiss.player);
  if (knifeMissSummary.hit || knifeMissSummary.target !== null || knifeMissSummary.damage !== 0) {
    fail("KnifeAttackMemory hit a target beyond knife range");
  }

  const gun = makeScene();
  const gunTarget = addTarget(gun, { tilex: 11, transx: 0x10000 });
  mod.US_InitRndT(false);
  const gunSummary = mod.WL_AGENT_GunAttack(gun.dgroup, gun.player);
  if (
    !gunSummary.hit ||
    gunSummary.target !== gunTarget ||
    gunSummary.lineClear !== true ||
    gunSummary.dist !== 1 ||
    gunSummary.damage !== 2 ||
    gun.dgroup.u16(gunTarget + OBJ_HITPOINTS_OFFSET) !== 48 ||
    gun.dgroup.u16(madenoise) !== 1
  ) {
    fail("WL_AGENT_GunAttack did not apply deterministic short-range gun damage");
  }

  const blocked = makeScene({ walls: [[11, 10]] });
  const blockedTarget = addTarget(blocked, { tilex: 12, transx: 0x10000 });
  mod.US_InitRndT(false);
  const blockedSummary = mod.GunAttackMemory(blocked.dgroup, blocked.player);
  if (
    blockedSummary.hit ||
    blockedSummary.target !== blockedTarget ||
    blockedSummary.lineClear !== false ||
    blockedSummary.damage !== 0 ||
    blocked.dgroup.u16(blockedTarget + OBJ_HITPOINTS_OFFSET) !== 50
  ) {
    fail("GunAttackMemory damaged a target through a blocked CheckLine");
  }

  const longMiss = makeScene();
  const longTarget = addTarget(longMiss, { tilex: 16, transx: 0x60000 });
  mod.US_InitRndT(false);
  const longMissSummary = mod.GunAttackMemory(longMiss.dgroup, longMiss.player);
  if (
    longMissSummary.hit ||
    longMissSummary.target !== longTarget ||
    longMissSummary.lineClear !== true ||
    longMissSummary.dist !== 6 ||
    longMissSummary.damage !== 0 ||
    longMiss.dgroup.u16(longTarget + OBJ_HITPOINTS_OFFSET) !== 50
  ) {
    fail("GunAttackMemory did not preserve the deterministic long-range miss roll");
  }

  return {
    knifeDamage: knifeSummary.damage,
    knifeTargetTransx: knifeSummary.dist,
    gunDamage: gunSummary.damage,
    blockedLine: blockedSummary.lineClear,
    longMissDist: longMissSummary.dist,
  };
}

function checkRuntimeAttackFrames(mod) {
  const FL_SHOOTABLE = 1;
  const FL_VISABLE = 8;
  const FL_ATTACKMODE = 16;
  const GUARDOBJ = 3;
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_ATTACKFRAME_OFFSET = 32;
  const GAMESTATE_ATTACKCOUNT_OFFSET = 34;
  const GAMESTATE_WEAPONFRAME_OFFSET = 36;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_VIEWX_OFFSET = 30;
  const OBJ_TRANSX_OFFSET = 34;
  const OBJ_HITPOINTS_OFFSET = 44;
  const WP_KNIFE = 0;
  const WP_PISTOL = 1;
  const WP_MACHINEGUN = 2;
  const WP_CHAINGUN = 3;
  const BT_ATTACK = 0;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const buttonstate = mod.nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = mod.nearOffsetForRuntimeSymbol("_buttonheld");
  const centerx = mod.nearOffsetForRuntimeSymbol("_centerx");
  const shootdelta = mod.nearOffsetForRuntimeSymbol("_shootdelta");

  function makeScene() {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);
    dgroup.setU16(centerx, 160);
    dgroup.setU16(shootdelta, 12);
    return { dgroup, plane0, plane1, player: dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player")) };
  }

  function addTarget(scene, tilex = 11) {
    const actor = mod.SpawnNewObjMemory(scene.dgroup, scene.plane0, tilex, 10, "_s_grdstand").actor;
    scene.dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ);
    scene.dgroup.setU8(actor + OBJ_FLAGS_OFFSET, FL_SHOOTABLE | FL_VISABLE | FL_ATTACKMODE);
    scene.dgroup.setU16(actor + OBJ_VIEWX_OFFSET, 160);
    scene.dgroup.setU32(actor + OBJ_TRANSX_OFFSET, 0x10000);
    scene.dgroup.setU16(actor + OBJ_HITPOINTS_OFFSET, 50);
    return actor;
  }

  const pistol = makeScene();
  const pistolTarget = addTarget(pistol);
  pistol.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  pistol.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  pistol.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 8);
  mod.WL_AGENT_Cmd_Fire(pistol.dgroup);
  mod.US_InitRndT(false);
  const pistolStep1 = mod.WL_AGENT_T_Attack(pistol.dgroup, pistol.plane0, pistol.plane1, pistol.player, { tics: 6 });
  if (
    pistolStep1.ended ||
    pistolStep1.attacks.length ||
    pistolStep1.attackframe !== 1 ||
    pistolStep1.attackcount !== 6 ||
    pistolStep1.weaponframe !== 2 ||
    pistolStep1.ammo !== 8 ||
    pistolStep1.state !== "_s_attack"
  ) {
    fail("WL_AGENT_T_Attack did not advance pistol windup frame");
  }
  const pistolStep2 = mod.WL_AGENT_T_Attack(pistol.dgroup, pistol.plane0, pistol.plane1, pistol.player, { tics: 6 });
  if (
    pistolStep2.ended ||
    pistolStep2.attacks.length !== 1 ||
    pistolStep2.attacks[0].target !== pistolTarget ||
    pistolStep2.attacks[0].damage !== 55 ||
    pistolStep2.attackframe !== 2 ||
    pistolStep2.weaponframe !== 3 ||
    pistolStep2.ammo !== 7 ||
    pistol.dgroup.i16(pistolTarget + OBJ_HITPOINTS_OFFSET) !== -5
  ) {
    fail("WL_AGENT_T_Attack did not fire pistol on attack frame 1");
  }
  const pistolEnd = mod.WL_AGENT_T_Attack(pistol.dgroup, pistol.plane0, pistol.plane1, pistol.player, { tics: 12 });
  if (
    !pistolEnd.ended ||
    pistolEnd.state !== "_s_player" ||
    pistolEnd.attackframe !== 0 ||
    pistolEnd.weaponframe !== 0 ||
    pistolEnd.weapon !== WP_PISTOL ||
    pistol.dgroup.u16(pistol.player + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_player")
  ) {
    fail("WL_AGENT_T_Attack did not return to player state at terminal frame");
  }

  const noAmmo = makeScene();
  noAmmo.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  noAmmo.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  noAmmo.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 0);
  noAmmo.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 3);
  noAmmo.dgroup.setU16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET, 0);
  noAmmo.dgroup.setU16(noAmmo.player + OBJ_STATE_OFFSET, mod.statetypeNearOffset("_s_attack"));
  const noAmmoEnd = mod.T_AttackMemory(noAmmo.dgroup, noAmmo.plane0, noAmmo.plane1, noAmmo.player, { tics: 1 });
  if (!noAmmoEnd.ended || noAmmoEnd.weapon !== WP_KNIFE || noAmmoEnd.state !== "_s_player") {
    fail("T_AttackMemory did not fall back to knife when attack ended with no ammo");
  }

  const machinegun = makeScene();
  machinegun.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_MACHINEGUN);
  machinegun.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_MACHINEGUN);
  machinegun.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 5);
  machinegun.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 2);
  machinegun.dgroup.setU16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET, 0);
  machinegun.dgroup.setU16(buttonstate + BT_ATTACK * 2, 1);
  machinegun.dgroup.setU16(buttonheld + BT_ATTACK * 2, 1);
  const machinegunLoop = mod.T_AttackMemory(machinegun.dgroup, machinegun.plane0, machinegun.plane1, machinegun.player, { tics: 1 });
  if (
    machinegunLoop.attacks.length ||
    machinegunLoop.attackframe !== 1 ||
    machinegunLoop.weaponframe !== 2 ||
    machinegunLoop.ammo !== 5
  ) {
    fail("T_AttackMemory did not loop held machinegun attack frame");
  }

  const chaingun = makeScene();
  const chaingunTarget = addTarget(chaingun);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 5);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 2);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET, 0);
  chaingun.dgroup.setU16(buttonstate + BT_ATTACK * 2, 1);
  chaingun.dgroup.setU16(buttonheld + BT_ATTACK * 2, 1);
  mod.US_InitRndT(false);
  const chaingunLoop = mod.WL_AGENT_T_Attack(chaingun.dgroup, chaingun.plane0, chaingun.plane1, chaingun.player, { tics: 1 });
  if (
    chaingunLoop.attacks.length !== 1 ||
    chaingunLoop.attacks[0].target !== chaingunTarget ||
    chaingunLoop.attacks[0].damage !== 27 ||
    chaingunLoop.attackframe !== 1 ||
    chaingunLoop.weaponframe !== 2 ||
    chaingunLoop.ammo !== 4
  ) {
    fail("WL_AGENT_T_Attack did not loop and fire held chaingun frame");
  }

  return {
    pistolFrame: pistolStep2.attackframe,
    pistolAmmo: pistolStep2.ammo,
    terminalState: pistolEnd.state,
    noAmmoWeapon: noAmmoEnd.weapon,
    machinegunFrame: machinegunLoop.attackframe,
    chaingunDamage: chaingunLoop.attacks[0].damage,
  };
}

function checkRuntimePickups(mod) {
  const GAMESTATE_SCORE_OFFSET = 8;
  const GAMESTATE_LIVES_OFFSET = 16;
  const GAMESTATE_HEALTH_OFFSET = 18;
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_KEYS_OFFSET = 22;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_TREASURECOUNT_OFFSET = 42;
  const STAT_SHAPENUM_OFFSET = 4;
  const STAT_ITEMNUMBER_OFFSET = 7;
  const BO_GIBS = 2;
  const BO_ALPO = 3;
  const BO_FIRSTAID = 4;
  const BO_KEY2 = 6;
  const BO_CROWN = 12;
  const BO_CLIP2 = 14;
  const BO_CHAINGUN = 16;
  const BO_FOOD = 17;
  const BO_FULLHEAL = 18;
  const WP_CHAINGUN = 3;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const facecount = mod.nearOffsetForRuntimeSymbol("_facecount");
  const gotgatgun = mod.nearOffsetForRuntimeSymbol("_gotgatgun");

  function makeScene(itemnumber) {
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    mod.InitStaticListMemory(dgroup);
    const statobj = mod.nearOffsetForRuntimeSymbol("_statobjlist");
    dgroup.setU16(statobj + STAT_SHAPENUM_OFFSET, 123);
    dgroup.setU8(statobj + STAT_ITEMNUMBER_OFFSET, itemnumber);
    return { dgroup, statobj };
  }

  const heal = makeScene(BO_FOOD);
  heal.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 90);
  heal.dgroup.setU16(gotgatgun, 1);
  const healSummary = mod.WL_AGENT_HealSelf(heal.dgroup, 25);
  if (healSummary.health !== 100 || healSummary.gotgatgun !== 0) {
    fail("WL_AGENT_HealSelf did not cap health or clear gotgatgun");
  }

  const firstAidFull = makeScene(BO_FIRSTAID);
  firstAidFull.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 100);
  const firstAidFullSummary = mod.WL_AGENT_GetBonus(firstAidFull.dgroup, firstAidFull.statobj);
  if (
    firstAidFullSummary.picked ||
    firstAidFullSummary.removed ||
    firstAidFull.dgroup.u16(firstAidFull.statobj + STAT_SHAPENUM_OFFSET) !== 123
  ) {
    fail("WL_AGENT_GetBonus removed a first aid pickup at full health");
  }

  const food = makeScene(BO_FOOD);
  food.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 91);
  const foodSummary = mod.GetBonusMemory(food.dgroup, food.statobj);
  if (!foodSummary.picked || foodSummary.health !== 100 || !foodSummary.removed) {
    fail("GetBonusMemory did not heal and remove food");
  }

  const gibsNope = makeScene(BO_GIBS);
  gibsNope.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 11);
  const gibsNopeSummary = mod.GetBonusMemory(gibsNope.dgroup, gibsNope.statobj);
  if (gibsNopeSummary.picked || gibsNopeSummary.removed || gibsNopeSummary.health !== 11) {
    fail("GetBonusMemory picked up gibs above the original health threshold");
  }

  const alpo = makeScene(BO_ALPO);
  alpo.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 96);
  const alpoSummary = mod.GetBonusMemory(alpo.dgroup, alpo.statobj);
  if (!alpoSummary.picked || alpoSummary.health !== 100) {
    fail("GetBonusMemory did not heal alpo by four points");
  }

  const key = makeScene(BO_KEY2);
  const keySummary = mod.WL_AGENT_GetBonus(key.dgroup, key.statobj);
  if (!keySummary.picked || keySummary.keys !== 2 || key.dgroup.u16(gamestate + GAMESTATE_KEYS_OFFSET) !== 2) {
    fail("WL_AGENT_GetBonus did not set the silver key bit");
  }

  const crown = makeScene(BO_CROWN);
  const crownSummary = mod.GetBonusMemory(crown.dgroup, crown.statobj);
  if (
    !crownSummary.picked ||
    crownSummary.score !== 5000 ||
    crownSummary.treasurecount !== 1 ||
    crown.dgroup.u16(gamestate + GAMESTATE_TREASURECOUNT_OFFSET) !== 1
  ) {
    fail("GetBonusMemory did not apply crown score/treasure bookkeeping");
  }

  const clipFull = makeScene(BO_CLIP2);
  clipFull.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 99);
  const clipFullSummary = mod.GetBonusMemory(clipFull.dgroup, clipFull.statobj);
  if (clipFullSummary.picked || clipFullSummary.removed || clipFullSummary.ammo !== 99) {
    fail("GetBonusMemory removed clip2 at full ammo");
  }

  const clip = makeScene(BO_CLIP2);
  clip.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 96);
  const clipSummary = mod.GetBonusMemory(clip.dgroup, clip.statobj);
  if (!clipSummary.picked || clipSummary.ammo !== 99 || !clipSummary.removed) {
    fail("GetBonusMemory did not cap clip2 ammo and remove pickup");
  }

  const chaingun = makeScene(BO_CHAINGUN);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 10);
  chaingun.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, 1);
  chaingun.dgroup.setU16(facecount, 77);
  const chaingunSummary = mod.WL_AGENT_GetBonus(chaingun.dgroup, chaingun.statobj);
  if (
    !chaingunSummary.picked ||
    chaingunSummary.weapon !== WP_CHAINGUN ||
    chaingunSummary.ammo !== 16 ||
    chaingun.dgroup.u16(gotgatgun) !== 1 ||
    chaingun.dgroup.u16(facecount) !== 0
  ) {
    fail("WL_AGENT_GetBonus did not apply chaingun pickup bookkeeping");
  }

  const fullheal = makeScene(BO_FULLHEAL);
  fullheal.dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 20);
  fullheal.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 80);
  fullheal.dgroup.setU16(gamestate + GAMESTATE_LIVES_OFFSET, 8);
  const fullhealSummary = mod.GetBonusMemory(fullheal.dgroup, fullheal.statobj);
  if (
    !fullhealSummary.picked ||
    fullhealSummary.health !== 100 ||
    fullhealSummary.ammo !== 99 ||
    fullhealSummary.lives !== 9 ||
    fullhealSummary.treasurecount !== 1
  ) {
    fail("GetBonusMemory did not apply fullheal health/ammo/life/treasure effects");
  }

  return {
    healHealth: healSummary.health,
    keyBits: keySummary.keys,
    crownScore: crown.dgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET),
    clipAmmo: clipSummary.ammo,
    chaingunWeapon: chaingunSummary.weapon,
    fullhealLives: fullhealSummary.lives,
  };
}

function checkRuntimeWeaponChange(mod) {
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_BESTWEAPON_OFFSET = 24;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const WP_KNIFE = 0;
  const WP_PISTOL = 1;
  const WP_MACHINEGUN = 2;
  const WP_CHAINGUN = 3;
  const BT_READYKNIFE = 4;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const buttonstate = mod.nearOffsetForRuntimeSymbol("_buttonstate");

  function makeScene() {
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 2, 0);
    return dgroup;
  }

  const noAmmo = makeScene();
  noAmmo.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 0);
  noAmmo.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, WP_CHAINGUN);
  noAmmo.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  noAmmo.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  noAmmo.setU16(buttonstate + (BT_READYKNIFE + WP_PISTOL) * 2, 1);
  const noAmmoSummary = mod.WL_AGENT_CheckWeaponChange(noAmmo);
  if (noAmmoSummary.changed || noAmmoSummary.weapon !== WP_CHAINGUN) {
    fail("WL_AGENT_CheckWeaponChange changed weapon with no ammo");
  }

  const priority = makeScene();
  priority.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 8);
  priority.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, WP_CHAINGUN);
  priority.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  priority.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  priority.setU16(buttonstate + (BT_READYKNIFE + WP_MACHINEGUN) * 2, 1);
  priority.setU16(buttonstate + (BT_READYKNIFE + WP_PISTOL) * 2, 1);
  const prioritySummary = mod.WL_AGENT_CheckWeaponChange(priority);
  if (
    !prioritySummary.changed ||
    prioritySummary.weapon !== WP_PISTOL ||
    prioritySummary.chosenweapon !== WP_PISTOL
  ) {
    fail("WL_AGENT_CheckWeaponChange did not pick the first pressed ready weapon");
  }

  const direct = makeScene();
  direct.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 8);
  direct.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, WP_PISTOL);
  direct.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_CHAINGUN);
  direct.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_CHAINGUN);
  direct.setU16(buttonstate + (BT_READYKNIFE + WP_CHAINGUN) * 2, 1);
  direct.setU16(buttonstate + (BT_READYKNIFE + WP_KNIFE) * 2, 1);
  const directSummary = mod.CheckWeaponChangeMemory(direct);
  if (!directSummary.changed || directSummary.weapon !== WP_KNIFE) {
    fail("CheckWeaponChangeMemory did not respect bestweapon scan bound and knife priority");
  }

  return {
    noAmmoWeapon: noAmmoSummary.weapon,
    priorityWeapon: prioritySummary.weapon,
    directWeapon: directSummary.weapon,
  };
}

function checkRuntimePollControls(mod) {
  const buttonstate = mod.nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = mod.nearOffsetForRuntimeSymbol("_buttonheld");
  const controlx = mod.nearOffsetForRuntimeSymbol("_controlx");
  const controly = mod.nearOffsetForRuntimeSymbol("_controly");
  const tics = mod.nearOffsetForRuntimeSymbol("_tics");
  const playstate = mod.nearOffsetForRuntimeSymbol("_playstate");

  const demo = mod.parseDemo(Uint8Array.of(0, 7, 0, 0, 0x89, 0xfe, 0x7f));
  const dgroup = new mod.DOSMemory(0x10000);
  dgroup.setU16(buttonstate + 2 * 2, 1);
  const summary = mod.WL_PLAY_PollControls(dgroup, {
    demoCommand: demo.commands[0],
    demoDone: true,
  });
  if (
    summary.tics !== 4 ||
    summary.controlx !== -8 ||
    summary.controly !== 508 ||
    summary.playstate !== 1 ||
    summary.buttonbits !== 0x89 ||
    !summary.buttonstate[0] ||
    !summary.buttonstate[3] ||
    !summary.buttonstate[7] ||
    summary.buttonstate[2] ||
    !summary.buttonheld[2] ||
    dgroup.i16(controlx) !== -8 ||
    dgroup.i16(controly) !== 508 ||
    dgroup.u16(tics) !== 4 ||
    dgroup.u16(playstate) !== 1 ||
    dgroup.u16(buttonheld + 2 * 2) !== 1
  ) {
    fail("PollControls demo playback did not apply button bits and scaled controls");
  }

  const idle = new mod.DOSMemory(0x10000);
  idle.setU16(buttonstate + 1 * 2, 1);
  const idleSummary = mod.PollControlsMemory(idle, { tics: 3 });
  if (
    idleSummary.tics !== 3 ||
    idleSummary.controlx !== 0 ||
    idleSummary.controly !== 0 ||
    idleSummary.buttonbits !== 0 ||
    idleSummary.buttonstate.some(Boolean) ||
    !idleSummary.buttonheld[1]
  ) {
    fail("PollControlsMemory idle path did not copy held buttons and clear current input");
  }

  return {
    demoButtonbits: summary.buttonbits,
    demoControlx: summary.controlx,
    demoControly: summary.controly,
    idleHeld: idleSummary.buttonheld[1],
  };
}

function checkRuntimePlayLoopStep(mod) {
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_TIMECOUNT_OFFSET = 52;
  const GAMESTATE_ATTACKFRAME_OFFSET = 32;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_ANGLE_OFFSET = 42;
  const PLAYEROBJ = 1;
  const WP_PISTOL = 1;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const bonuscount = mod.nearOffsetForRuntimeSymbol("_bonuscount");
  const facecount = mod.nearOffsetForRuntimeSymbol("_facecount");
  const madenoise = mod.nearOffsetForRuntimeSymbol("_madenoise");
  const plane0 = new Uint16Array(64 * 64).fill(108);
  const plane1 = new Uint16Array(64 * 64);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 3, 0);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  mod.InitDoorListMemory(dgroup);
  mod.InitStaticListMemory(dgroup);
  mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);
  const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  dgroup.setU16(player + OBJ_CLASS_OFFSET, PLAYEROBJ);
  dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  mod.WL_PLAY_StartBonusFlash(dgroup);

  const demo = mod.parseDemo(Uint8Array.of(0, 7, 0, 0, 0x01, 0x05, 0x00));
  mod.US_InitRndT(false);
  const summary = mod.PlayLoopStepMemory(dgroup, plane0, plane1, {
    demoCommand: demo.commands[0],
  });
  if (
    summary.controls.tics !== 4 ||
    summary.controls.controlx !== 20 ||
    summary.actorSteps.length !== 1 ||
    summary.actorSteps[0].state !== "_s_attack" ||
    summary.palette.palette !== "white" ||
    summary.palette.bonuscount !== 14 ||
    summary.timeCount !== 4 ||
    summary.playstate !== 0 ||
    dgroup.u32(gamestate + GAMESTATE_TIMECOUNT_OFFSET) !== 4 ||
    dgroup.u16(player + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_attack") ||
    dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) !== 0 ||
    dgroup.u16(bonuscount) !== 14 ||
    dgroup.u16(madenoise) !== 0 ||
    dgroup.u16(facecount) !== 4 ||
    dgroup.u16(player + OBJ_ANGLE_OFFSET) !== 89
  ) {
    fail("PlayLoopStepMemory did not run the logical poll/actor/palette/time loop");
  }

  const bounded = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(bounded, 3, 0);
  mod.copyWallDataToLevelMemory(plane0, bounded);
  mod.InitActorListMemory(bounded);
  mod.InitDoorListMemory(bounded);
  mod.SpawnPlayerMemory(bounded, plane0, 10, 10, 0);
  const boundedPlayer = bounded.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  bounded.setU16(boundedPlayer + OBJ_CLASS_OFFSET, PLAYEROBJ);
  bounded.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  bounded.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  const boundedLoop = mod.WL_PLAY_PlayLoop(bounded, plane0, plane1, { maxSteps: 2, tics: 1 });
  if (
    boundedLoop.steps !== 2 ||
    boundedLoop.completed ||
    boundedLoop.playstate !== 0 ||
    boundedLoop.lastStep?.timeCount !== 2 ||
    bounded.u32(gamestate + GAMESTATE_TIMECOUNT_OFFSET) !== 2
  ) {
    fail(`WL_PLAY_PlayLoop did not run a bounded logical loop: ${JSON.stringify(boundedLoop)}`);
  }

  const completed = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(completed, 3, 0);
  mod.copyWallDataToLevelMemory(plane0, completed);
  mod.InitActorListMemory(completed);
  mod.InitDoorListMemory(completed);
  mod.SpawnPlayerMemory(completed, plane0, 10, 10, 0);
  const doneLoop = mod.WL_PLAY_PlayLoop(completed, plane0, plane1, {
    maxSteps: 3,
    demoCommand: demo.commands[0],
    demoDone: true,
  });
  if (doneLoop.steps !== 1 || !doneLoop.completed || doneLoop.playstate !== 1) {
    fail(`WL_PLAY_PlayLoop did not stop when playstate changed: ${JSON.stringify(doneLoop)}`);
  }

  return {
    actorSteps: summary.actorSteps.length,
    playerState: summary.actorSteps[0].state,
    timeCount: summary.timeCount,
    palette: summary.palette.palette,
    boundedSteps: boundedLoop.steps,
    completedSteps: doneLoop.steps,
  };
}

function checkRuntimeCheckKeys(mod) {
  const SC_M = 0x32;
  const SC_L = 0x26;
  const SC_I = 0x17;
  const SC_BACKSPACE = 0x0e;
  const SC_LSHIFT = 0x2a;
  const SC_ALT = 0x38;
  const SC_F9 = 0x43;
  const SC_F8 = 0x42;
  const SC_ESCAPE = 0x01;
  const SC_TAB = 0x0f;
  const GAMESTATE_SCORE_OFFSET = 8;
  const GAMESTATE_HEALTH_OFFSET = 18;
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_KEYS_OFFSET = 22;
  const GAMESTATE_BESTWEAPON_OFFSET = 24;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_TIMECOUNT_OFFSET = 52;
  const WP_CHAINGUN = 3;
  const EX_ABORT = 7;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const playstate = mod.nearOffsetForRuntimeSymbol("_playstate");
  const mliDgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(mliDgroup, 2, 0);
  mliDgroup.setU32(gamestate + GAMESTATE_TIMECOUNT_OFFSET, 11);
  const mli = mod.WL_PLAY_CheckKeys(mliDgroup, { pressed: [SC_M, SC_L, SC_I] });
  if (
    mli.action !== "mli-cheat" ||
    !mli.ack ||
    !mli.clearKeys ||
    mli.redraw !== "all-play-border" ||
    mliDgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET) !== 100 ||
    mliDgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET) !== 99 ||
    mliDgroup.u16(gamestate + GAMESTATE_KEYS_OFFSET) !== 3 ||
    mliDgroup.u32(gamestate + GAMESTATE_SCORE_OFFSET) !== 0 ||
    mliDgroup.u32(gamestate + GAMESTATE_TIMECOUNT_OFFSET) !== 42011 ||
    mliDgroup.u16(gamestate + GAMESTATE_BESTWEAPON_OFFSET) !== WP_CHAINGUN ||
    mliDgroup.u16(gamestate + GAMESTATE_WEAPON_OFFSET) !== WP_CHAINGUN ||
    mliDgroup.u16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET) !== WP_CHAINGUN
  ) {
    fail(`WL_PLAY_CheckKeys did not apply the MLI cheat bookkeeping: ${JSON.stringify(mli)}`);
  }

  const debug = mod.WL_PLAY_CheckKeys(undefined, {
    pressed: [SC_BACKSPACE, SC_LSHIFT, SC_ALT],
    checkParm: (name) => name === "goobers",
  });
  if (
    debug.action !== "enable-debug" ||
    !debug.debugOk ||
    mod.WL_PLAY_DebugOk !== 1 ||
    debug.redraw !== "play-border-sides"
  ) {
    fail(`WL_PLAY_CheckKeys did not enable debug keys through goobers: ${JSON.stringify(debug)}`);
  }

  const quick = mod.WL_PLAY_CheckKeys(undefined, { lastScan: SC_F9 });
  if (
    quick.action !== "quick-control-panel" ||
    quick.controlPanelScan !== SC_F9 ||
    !quick.startMusic ||
    quick.redraw !== "play-border-sides"
  ) {
    fail(`WL_PLAY_CheckKeys did not route F9 through the quick control-panel path: ${JSON.stringify(quick)}`);
  }

  const panelDgroup = new mod.DOSMemory(0x10000);
  const panel = mod.WL_PLAY_CheckKeys(panelDgroup, { lastScan: SC_ESCAPE, loadedgame: true });
  if (
    panel.action !== "control-panel" ||
    panel.controlPanelScan !== SC_ESCAPE ||
    !panel.stopMusic ||
    panel.startMusic ||
    !panel.fadeOut ||
    panel.fadeIn ||
    panel.playstate !== EX_ABORT ||
    panelDgroup.u16(playstate) !== EX_ABORT
  ) {
    fail(`WL_PLAY_CheckKeys did not route loaded-game control panel abort: ${JSON.stringify(panel)}`);
  }

  const pause = mod.WL_PLAY_CheckKeys(undefined, { paused: true });
  if (pause.action !== "pause" || !pause.stopMusic || !pause.startMusic || !pause.ack || !pause.clearKeys) {
    fail(`WL_PLAY_CheckKeys did not summarize pause handling: ${JSON.stringify(pause)}`);
  }

  const debugKeys = mod.WL_PLAY_CheckKeys(undefined, { pressed: [SC_TAB], debugOk: true, lastScan: SC_F8 });
  if (debugKeys.action !== "quick-control-panel") {
    fail(`WL_PLAY_CheckKeys should give F8 quick-panel priority before TAB debug keys: ${JSON.stringify(debugKeys)}`);
  }
  const tabDebug = mod.WL_PLAY_CheckKeys(undefined, { pressed: [SC_TAB], debugOk: true });
  if (tabDebug.action !== "debug-keys") {
    fail(`WL_PLAY_CheckKeys did not enter TAB debug-key dispatch: ${JSON.stringify(tabDebug)}`);
  }

  return {
    mli: [mliDgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET), mliDgroup.u16(gamestate + GAMESTATE_AMMO_OFFSET)],
    debugOk: mod.WL_PLAY_DebugOk,
    quick: quick.controlPanelScan,
    abort: panel.playstate,
    pause: pause.action,
    tabDebug: tabDebug.action,
  };
}

function checkRuntimeMusic(mod) {
  const GAMESTATE_MAPON_OFFSET = 2;
  const GAMESTATE_EPISODE_OFFSET = 38;
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 2, 0);

  const first = mod.WL_PLAY_StartMusic(dgroup);
  if (
    first.mapon !== 0 ||
    first.episode !== 0 ||
    first.songIndex !== 0 ||
    first.chunk !== 3 ||
    first.audioChunk !== 264 ||
    !first.started ||
    !first.musicOn ||
    first.lockedChunk !== 3
  ) {
    fail(`WL_PLAY_StartMusic did not select episode-one map-zero music: ${JSON.stringify(first)}`);
  }

  const stopped = mod.WL_PLAY_StopMusic(dgroup);
  if (stopped.musicOn || stopped.purgedChunks.length !== 27 || stopped.purgedChunks[0] !== 261 || stopped.purgedChunks[26] !== 287) {
    fail(`WL_PLAY_StopMusic did not purge the WL6 music chunk range: ${JSON.stringify(stopped)}`);
  }

  dgroup.setU16(gamestate + GAMESTATE_MAPON_OFFSET, 9);
  const secret = mod.WL_PLAY_StartMusic(dgroup);
  if (secret.songIndex !== 9 || secret.chunk !== 0 || secret.audioChunk !== 261) {
    fail(`WL_PLAY_StartMusic did not select the episode-one secret music: ${JSON.stringify(secret)}`);
  }

  dgroup.setU16(gamestate + GAMESTATE_EPISODE_OFFSET, 2);
  dgroup.setU16(gamestate + GAMESTATE_MAPON_OFFSET, 9);
  const pacman = mod.WL_PLAY_StartMusic(dgroup);
  if (pacman.songIndex !== 29 || pacman.chunk !== 26 || pacman.audioChunk !== 287) {
    fail(`WL_PLAY_StartMusic did not select episode-three secret music: ${JSON.stringify(pacman)}`);
  }

  dgroup.setU16(gamestate + GAMESTATE_EPISODE_OFFSET, 5);
  dgroup.setU16(gamestate + GAMESTATE_MAPON_OFFSET, 9);
  const funkyou = mod.WL_PLAY_StartMusic(dgroup, { cacheError: true });
  if (funkyou.songIndex !== 59 || funkyou.chunk !== 15 || funkyou.audioChunk !== 276 || funkyou.started || funkyou.musicOn || funkyou.lockedChunk !== null) {
    fail(`WL_PLAY_StartMusic did not preserve cache-error behavior: ${JSON.stringify(funkyou)}`);
  }

  return {
    firstChunk: first.chunk,
    secretChunk: secret.chunk,
    pacmanChunk: pacman.chunk,
    cacheErrorStarted: funkyou.started,
  };
}

function checkRuntimeInput(mod) {
  const BT_ATTACK = 0;
  const BT_STRAFE = 1;
  const BT_RUN = 2;
  const BT_USE = 3;
  const buttonstate = mod.nearOffsetForRuntimeSymbol("_buttonstate");
  const controlx = mod.nearOffsetForRuntimeSymbol("_controlx");
  const controly = mod.nearOffsetForRuntimeSymbol("_controly");
  const tics = mod.nearOffsetForRuntimeSymbol("_tics");

  const keyboardButtons = new mod.DOSMemory(0x10000);
  const keyboardButtonSummary = mod.WL_PLAY_PollKeyboardButtons(keyboardButtons, [0x1d, 0x05]);
  if (!keyboardButtonSummary.buttonstate[BT_ATTACK] || !keyboardButtonSummary.buttonstate[7]) {
    fail(`WL_PLAY_PollKeyboardButtons did not map scan codes to buttonstate: ${JSON.stringify(keyboardButtonSummary)}`);
  }

  const mouseButtons = new mod.DOSMemory(0x10000);
  const mouseButtonSummary = mod.WL_PLAY_PollMouseButtons(mouseButtons, 5);
  if (!mouseButtonSummary.buttonstate[BT_ATTACK] || !mouseButtonSummary.buttonstate[BT_USE] || mouseButtonSummary.buttonstate[BT_STRAFE]) {
    fail(`WL_PLAY_PollMouseButtons did not map mouse bits to buttonstate: ${JSON.stringify(mouseButtonSummary)}`);
  }

  const joystickPort = new mod.DOSMemory(0x10000);
  const joystickPortSummary = mod.WL_PLAY_PollJoystickButtons(joystickPort, 12, { joystickport: 1 });
  if (!joystickPortSummary.buttonstate[BT_ATTACK] || !joystickPortSummary.buttonstate[BT_STRAFE] || joystickPortSummary.buttonstate[BT_USE]) {
    fail(`WL_PLAY_PollJoystickButtons did not map joystick-port button bits: ${JSON.stringify(joystickPortSummary)}`);
  }

  const joypad = new mod.DOSMemory(0x10000);
  const joypadSummary = mod.WL_PLAY_PollJoystickButtons(joypad, 15, { joypadenabled: true });
  if (!joypadSummary.buttonstate[BT_ATTACK] || !joypadSummary.buttonstate[BT_STRAFE] || !joypadSummary.buttonstate[BT_USE] || !joypadSummary.buttonstate[BT_RUN]) {
    fail(`WL_PLAY_PollJoystickButtons did not map joypad button bits: ${JSON.stringify(joypadSummary)}`);
  }

  const keyboardMove = new mod.DOSMemory(0x10000);
  keyboardMove.setU16(tics, 2);
  keyboardMove.setU16(buttonstate + BT_RUN * 2, 1);
  const keyboardMoveSummary = mod.WL_PLAY_PollKeyboardMove(keyboardMove, [0x48, 0x4d]);
  if (keyboardMoveSummary.controlx !== 140 || keyboardMoveSummary.controly !== -140) {
    fail(`WL_PLAY_PollKeyboardMove did not apply run movement: ${JSON.stringify(keyboardMoveSummary)}`);
  }

  const mouseMove = new mod.DOSMemory(0x10000);
  const mouseMoveSummary = mod.WL_PLAY_PollMouseMove(mouseMove, 13, -13, { mouseadjustment: 3 });
  if (mouseMoveSummary.controlx !== 13 || mouseMoveSummary.controly !== -26) {
    fail(`WL_PLAY_PollMouseMove did not apply scaled mouse deltas: ${JSON.stringify(mouseMoveSummary)}`);
  }

  const joystickMove = new mod.DOSMemory(0x10000);
  joystickMove.setU16(tics, 2);
  const joystickMoveSummary = mod.WL_PLAY_PollJoystickMove(joystickMove, 65, -65);
  if (joystickMoveSummary.controlx !== 70 || joystickMoveSummary.controly !== -70) {
    fail(`WL_PLAY_PollJoystickMove did not apply base digital joystick movement: ${JSON.stringify(joystickMoveSummary)}`);
  }

  const progressive = new mod.DOSMemory(0x10000);
  progressive.setU16(tics, 2);
  const progressiveSummary = mod.WL_PLAY_PollJoystickMove(progressive, 70, 70, { joystickprogressive: true });
  if (progressiveSummary.controlx !== 48 || progressiveSummary.controly !== 0 || progressive.i16(controlx) !== 48 || progressive.i16(controly) !== 0) {
    fail(`WL_PLAY_PollJoystickMove did not preserve progressive joystick math: ${JSON.stringify(progressiveSummary)}`);
  }

  return {
    keyboardRunX: keyboardMoveSummary.controlx,
    mouseY: mouseMoveSummary.controly,
    progressiveX: progressiveSummary.controlx,
  };
}

function checkRuntimeInputManager(mod) {
  const startup = mod.ID_IN_IN_ResetInputState({
    MousePresent: true,
    JoysPresent: [true, true],
    argv: ["wolf3d.exe", "-nomouse", "/nojoys"],
  });
  if (!startup.MousePresent || !startup.JoysPresent[0]) {
    fail(`ID_IN reset did not seed deterministic hardware state: ${JSON.stringify(startup)}`);
  }
  const disabled = mod.ID_IN_IN_Startup();
  if (disabled.MousePresent || disabled.JoysPresent[0] || disabled.JoysPresent[1]) {
    fail(`ID_IN_Startup did not honor nomouse/nojoys parms: ${JSON.stringify(disabled)}`);
  }

  mod.ID_IN_IN_ResetInputState({ MousePresent: true, JoysPresent: [true, false] });
  mod.ID_IN_IN_Startup(["wolf3d.exe"]);
  const fallback = mod.ID_IN_IN_Default(false, mod.ID_IN_ctrl_Mouse);
  if (fallback.Controls[0] !== mod.ID_IN_ctrl_Keyboard1) {
    fail(`ID_IN_Default did not fall back to keyboard: ${JSON.stringify(fallback)}`);
  }

  mod.ID_IN_IN_ClearKeysDown();
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_LShift);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_A);
  const shiftedAscii = mod.ID_IN_IN_WaitForASCII();
  if (shiftedAscii !== 65 || !mod.ID_IN_IN_KeyDown(mod.ID_IN_sc_A)) {
    fail(`ID_IN keyboard service did not preserve shifted ASCII/key state: ${shiftedAscii}`);
  }
  const waitedKey = mod.ID_IN_IN_WaitForKey();
  if (waitedKey !== mod.ID_IN_sc_A) {
    fail(`ID_IN_WaitForKey returned ${waitedKey}, expected ${mod.ID_IN_sc_A}`);
  }

  mod.ID_IN_IN_ClearKeysDown();
  mod.ID_IN_IN_SetControlType(0, mod.ID_IN_ctrl_Keyboard1);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_UpArrow);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_RightArrow);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_Control);
  const keyboard = mod.ID_IN_IN_ReadControl(0);
  if (
    keyboard.x !== 127
    || keyboard.y !== -127
    || keyboard.dir !== mod.ID_IN_dir_NorthEast
    || !keyboard.button0
  ) {
    fail(`ID_IN_ReadControl keyboard mapping mismatch: ${JSON.stringify(keyboard)}`);
  }

  mod.ID_IN_IN_SetControlType(0, mod.ID_IN_ctrl_Mouse);
  mod.ID_IN_IN_SetMouseState({ present: true, buttons: 5, deltaX: -6, deltaY: 8 });
  const mouse = mod.ID_IN_IN_ReadControl(0);
  if (mouse.x !== -6 || mouse.y !== 8 || mouse.dir !== mod.ID_IN_dir_SouthWest || !mouse.button0 || !mouse.button2) {
    fail(`ID_IN_ReadControl mouse mapping mismatch: ${JSON.stringify(mouse)}`);
  }

  mod.ID_IN_IN_SetControlType(0, mod.ID_IN_ctrl_Joystick1);
  mod.ID_IN_IN_SetupJoy(0, 0, 5000, 0, 5000);
  mod.ID_IN_IN_SetJoyState(0, { present: true, x: 5000, y: 0, buttons: 3 });
  const joyDelta = mod.ID_IN_INL_GetJoyDelta(0);
  const joystick = mod.ID_IN_IN_ReadControl(0);
  if (
    joyDelta.dx !== 127
    || joyDelta.dy !== -127
    || joystick.x !== 127
    || joystick.y !== -127
    || joystick.dir !== mod.ID_IN_dir_NorthEast
    || !joystick.button0
    || !joystick.button1
  ) {
    fail(`ID_IN joystick scaling/control mismatch: ${JSON.stringify({ joyDelta, joystick })}`);
  }

  mod.ID_IN_IN_StartDemoPlayback(new Uint8Array([2, 0x18]));
  const playback0 = mod.ID_IN_IN_ReadControl(0);
  const playback1 = mod.ID_IN_IN_ReadControl(0);
  const playbackState = mod.ID_IN_IN_DebugState();
  if (
    playback0.x !== 127
    || playback0.y !== -127
    || !playback0.button0
    || playback1.x !== 127
    || playbackState.DemoMode !== mod.ID_IN_demo_PlayDone
  ) {
    fail(`ID_IN demo playback RLE mismatch: ${JSON.stringify({ playback0, playback1, playbackState })}`);
  }

  mod.ID_IN_IN_ResetInputState();
  mod.ID_IN_IN_StartDemoRecord(8);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_UpArrow);
  mod.ID_IN_INL_KeyService(mod.ID_IN_sc_Control);
  mod.ID_IN_IN_ReadControl(0);
  mod.ID_IN_IN_ReadControl(0);
  const recorded = Array.from(mod.ID_IN_DemoBuffer.slice(0, 2));
  if (recorded[0] !== 2 || recorded[1] !== 0x14) {
    fail(`ID_IN demo record did not coalesce identical controls: ${JSON.stringify(recorded)}`);
  }

  mod.ID_IN_IN_ResetInputState({ MousePresent: true });
  mod.ID_IN_IN_SetMouseState({ present: true, buttons: 1 });
  mod.ID_IN_IN_StartAck();
  if (mod.ID_IN_IN_CheckAck()) {
    fail("ID_IN_StartAck accepted a button that was already held");
  }
  mod.ID_IN_IN_SetMouseState({ buttons: 0 });
  if (mod.ID_IN_IN_CheckAck()) {
    fail("ID_IN_CheckAck fired while the mouse button was released");
  }
  mod.ID_IN_IN_SetMouseState({ buttons: 1 });
  if (!mod.ID_IN_IN_CheckAck()) {
    fail("ID_IN_CheckAck did not fire on a newly pressed mouse button");
  }

  mod.ID_IN_IN_SetMouseState({ buttons: 0 });
  const userInput = mod.ID_IN_IN_UserInput(10, 2, (poll) => {
    if (poll === 0) {
      mod.ID_IN_IN_SetMouseState({ buttons: 1 });
    }
  });
  if (!userInput) {
    fail("ID_IN_UserInput did not observe input during its bounded polling window");
  }

  return {
    keyboardDir: keyboard.dir,
    mouseButtons: mod.ID_IN_IN_MouseButtons(),
    joyButtons: mod.ID_IN_IN_JoyButtons(),
    demoRecord: recorded,
    playbackMode: playbackState.DemoMode,
  };
}

function checkRuntimePlayerMovement(mod) {
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const MINDIST = 0x5800;
  const PLAYEROBJ = 1;
  const GUARDOBJ = 3;
  const FL_SHOOTABLE = 1;
  const BT_ATTACK = 0;
  const BT_STRAFE = 1;
  const BT_USE = 3;
  const GAMESTATE_HEALTH_OFFSET = 18;
  const GAMESTATE_AMMO_OFFSET = 20;
  const GAMESTATE_KEYS_OFFSET = 22;
  const GAMESTATE_WEAPON_OFFSET = 26;
  const GAMESTATE_CHOSENWEAPON_OFFSET = 28;
  const GAMESTATE_ATTACKFRAME_OFFSET = 32;
  const GAMESTATE_ATTACKCOUNT_OFFSET = 34;
  const GAMESTATE_WEAPONFRAME_OFFSET = 36;
  const GAMESTATE_SECRETCOUNT_OFFSET = 40;
  const GAMESTATE_VICTORYFLAG_OFFSET = 64;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_AREANUMBER_OFFSET = 28;
  const OBJ_ANGLE_OFFSET = 42;
  const DR_CLOSED = 1;
  const DR_OPEN = 0;
  const DR_OPENING = 2;
  const DR_CLOSING = 3;
  const DI_EAST = 1;
  const EX_COMPLETED = 1;
  const EX_SECRETLEVEL = 9;
  const WP_KNIFE = 0;
  const WP_PISTOL = 1;

  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const tilemap = mod.nearOffsetForRuntimeSymbol("_tilemap");
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const playstate = mod.nearOffsetForRuntimeSymbol("_playstate");
  const buttonstate = mod.nearOffsetForRuntimeSymbol("_buttonstate");
  const buttonheld = mod.nearOffsetForRuntimeSymbol("_buttonheld");
  const controlx = mod.nearOffsetForRuntimeSymbol("_controlx");
  const controly = mod.nearOffsetForRuntimeSymbol("_controly");
  const anglefrac = mod.nearOffsetForRuntimeSymbol("_anglefrac");
  const thrustspeed = mod.nearOffsetForRuntimeSymbol("_thrustspeed");
  const playerxmove = mod.nearOffsetForRuntimeSymbol("_playerxmove");
  const playerymove = mod.nearOffsetForRuntimeSymbol("_playerymove");
  const pwallstate = mod.nearOffsetForRuntimeSymbol("_pwallstate");
  const pwallx = mod.nearOffsetForRuntimeSymbol("_pwallx");
  const pwally = mod.nearOffsetForRuntimeSymbol("_pwally");
  const pwalldir = mod.nearOffsetForRuntimeSymbol("_pwalldir");

  const spawnPlane0 = new Uint16Array(64 * 64).fill(107);
  spawnPlane0[12 * 64 + 11] = 109;
  const spawnDgroup = new mod.DOSMemory(0x10000);
  mod.InitActorListMemory(spawnDgroup);
  const spawn = mod.WL_AGENT_SpawnPlayer(spawnDgroup, spawnPlane0, 11, 12, 1);
  if (
    spawn.tilex !== 11 ||
    spawn.tiley !== 12 ||
    spawn.angle !== 0 ||
    spawnDgroup.u16(spawn.player + OBJ_CLASS_OFFSET) !== PLAYEROBJ ||
    spawnDgroup.u16(spawn.player + OBJ_TILEX_OFFSET) !== 11 ||
    spawnDgroup.u16(spawn.player + OBJ_TILEY_OFFSET) !== 12 ||
    spawnDgroup.u8(spawn.player + OBJ_AREANUMBER_OFFSET) !== 109 ||
    spawnDgroup.i32(spawn.player + OBJ_X_OFFSET) !== 11 * TILEGLOBAL + TILEGLOBAL / 2 ||
    spawnDgroup.i32(spawn.player + OBJ_Y_OFFSET) !== 12 * TILEGLOBAL + TILEGLOBAL / 2 ||
    spawnDgroup.u16(spawn.player + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_player")
  ) {
    fail(`WL_AGENT_SpawnPlayer did not initialize the player object: ${JSON.stringify(spawn)}`);
  }

  function actoratCell(tilexValue, tileyValue) {
    return actorat + (tilexValue * 64 + tileyValue) * 2;
  }

  function tilemapCell(tilexValue, tileyValue) {
    return tilemap + tilexValue * 64 + tileyValue;
  }

  function setActorPosition(dgroup, actor, tilexValue, tileyValue, x, y) {
    dgroup.setU32(actor + OBJ_X_OFFSET, x ?? (tilexValue << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(actor + OBJ_Y_OFFSET, y ?? (tileyValue << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU16(actor + OBJ_TILEX_OFFSET, dgroup.u32(actor + OBJ_X_OFFSET) >> TILESHIFT);
    dgroup.setU16(actor + OBJ_TILEY_OFFSET, dgroup.u32(actor + OBJ_Y_OFFSET) >> TILESHIFT);
  }

  function makeScene({ areaTile = 108, walls = [] } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(areaTile);
    for (const [x, y, tile = 1] of walls) {
      plane0[y * 64 + x] = tile;
    }
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_mapwidth"), 64);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_mapheight"), 64);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_tics"), 1);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 1);
    const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
    dgroup.setU16(player + OBJ_CLASS_OFFSET, PLAYEROBJ);
    dgroup.setU16(player + OBJ_ANGLE_OFFSET, 0);
    setActorPosition(dgroup, player, 10, 10);
    return { dgroup, plane0, plane1, player };
  }

  const clear = makeScene();
  if (!mod.TryMoveMemory(clear.dgroup, clear.player).ok || !mod.WL_AGENT_TryMove(clear.dgroup, clear.player).ok) {
    fail("TryMoveMemory/WL_AGENT_TryMove did not accept a clear player position");
  }

  const wall = makeScene({ walls: [[11, 10]] });
  setActorPosition(
    wall.dgroup,
    wall.player,
    10,
    10,
    (11 << TILESHIFT) - MINDIST + 1,
    (10 << TILESHIFT) + TILEGLOBAL / 2,
  );
  const wallTry = mod.TryMoveMemory(wall.dgroup, wall.player);
  if (wallTry.ok || wallTry.blockedBy !== "wall" || wallTry.tilex !== 11 || wallTry.tiley !== 10) {
    fail("TryMoveMemory did not reject a wall-overlapping player");
  }

  const actorBlock = makeScene();
  const guard = mod.SpawnNewObjMemory(actorBlock.dgroup, actorBlock.plane0, 10, 10, "_s_grdstand").actor;
  actorBlock.dgroup.setU16(guard + OBJ_CLASS_OFFSET, GUARDOBJ);
  actorBlock.dgroup.setU8(guard + OBJ_FLAGS_OFFSET, FL_SHOOTABLE);
  setActorPosition(actorBlock.dgroup, guard, 10, 10);
  actorBlock.dgroup.setU16(actoratCell(10, 10), guard);
  const actorTry = mod.TryMoveMemory(actorBlock.dgroup, actorBlock.player);
  if (actorTry.ok || actorTry.blockedBy !== "actor" || actorTry.blocker !== guard) {
    fail("TryMoveMemory did not reject a close shootable actor");
  }

  const clip = makeScene({ walls: [[11, 10]] });
  const clipSummary = mod.WL_AGENT_ClipMove(clip.dgroup, clip.player, 0x9000, 512);
  if (
    !clipSummary.moved ||
    clipSummary.mode !== "y" ||
    clip.dgroup.u32(clip.player + OBJ_X_OFFSET) !== (10 << TILESHIFT) + TILEGLOBAL / 2 ||
    clip.dgroup.u32(clip.player + OBJ_Y_OFFSET) !== (10 << TILESHIFT) + TILEGLOBAL / 2 + 512
  ) {
    fail("ClipMoveMemory did not fall back to Y-only movement against a wall");
  }

  const noclip = makeScene({ walls: [[11, 10]] });
  noclip.dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_noclip"), 1);
  const noclipSummary = mod.ClipMoveMemory(noclip.dgroup, noclip.player, 0x9000, 0);
  if (!noclipSummary.moved || noclipSummary.mode !== "noclip") {
    fail("ClipMoveMemory did not honor bounded noclip movement");
  }

  const thrust = makeScene();
  const thrustSummary = mod.WL_AGENT_Thrust(thrust.dgroup, thrust.plane0, thrust.plane1, 0, TILEGLOBAL);
  if (
    thrustSummary.speed !== TILEGLOBAL ||
    thrustSummary.clippedSpeed !== MINDIST * 2 - 1 ||
    thrust.dgroup.i32(thrustspeed) !== TILEGLOBAL ||
    thrust.dgroup.u16(thrust.player + OBJ_TILEX_OFFSET) !== 11 ||
    thrustSummary.areanumber !== 1
  ) {
    fail("ThrustMemory did not clamp speed, accumulate thrustspeed, and update area/tile");
  }

  const exit = makeScene();
  exit.plane1[10 * 64 + 11] = 99;
  mod.ThrustMemory(exit.dgroup, exit.plane0, exit.plane1, 0, TILEGLOBAL);
  if (!exit.dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    fail("ThrustMemory did not trigger VictoryTile on EXITTILE");
  }

  const rotate = makeScene();
  rotate.dgroup.setU16(controlx, 25);
  rotate.dgroup.setU16(controly, -10);
  const controlSummary = mod.WL_AGENT_ControlMovement(
    rotate.dgroup,
    rotate.plane0,
    rotate.plane1,
    rotate.player,
  );
  if (
    controlSummary.angle !== 359 ||
    rotate.dgroup.i16(anglefrac) !== 5 ||
    rotate.dgroup.i32(thrustspeed) !== 1500 ||
    rotate.dgroup.i32(playerxmove) <= 0 ||
    rotate.dgroup.i32(playerymove) < 0
  ) {
    fail("ControlMovementMemory did not turn with C division and move forward");
  }

  const strafe = makeScene();
  strafe.dgroup.setU16(buttonstate + BT_STRAFE * 2, 1);
  strafe.dgroup.setU16(controlx, 10);
  const strafeSummary = mod.ControlMovementMemory(strafe.dgroup, strafe.plane0, strafe.plane1, strafe.player);
  if (strafeSummary.thrusts[0]?.angle !== 270 || strafe.dgroup.u16(strafe.player + OBJ_ANGLE_OFFSET) !== 0) {
    fail("ControlMovementMemory did not use strafe side-thrust without turning");
  }

  const door = makeScene();
  mod.SpawnDoorMemory(door.dgroup, door.plane0, 11, 10, true, 0);
  door.dgroup.setU16(buttonstate + BT_USE * 2, 1);
  const doorUse = mod.WL_AGENT_Cmd_Use(door.dgroup, door.plane0, door.plane1);
  if (
    doorUse.action !== "door" ||
    doorUse.door?.action !== DR_OPENING ||
    door.dgroup.u16(buttonheld + BT_USE * 2) !== 1 ||
    door.dgroup.u16(mod.nearOffsetForRuntimeSymbol("_doorobjlist") + 6) !== DR_OPENING
  ) {
    fail("CmdUseMemory did not operate a closed unlocked door");
  }

  const locked = makeScene();
  mod.SpawnDoorMemory(locked.dgroup, locked.plane0, 11, 10, true, 1);
  const lockedUse = mod.OperateDoorMemory(locked.dgroup, 0);
  if (!lockedUse.locked || lockedUse.operated || lockedUse.action !== DR_CLOSED) {
    fail("OperateDoorMemory did not reject a locked door without key");
  }
  locked.dgroup.setU16(gamestate + GAMESTATE_KEYS_OFFSET, 1);
  const unlockedUse = mod.WL_ACT1_OperateDoor(locked.dgroup, 0);
  if (!unlockedUse.operated || unlockedUse.action !== DR_OPENING) {
    fail("WL_ACT1_OperateDoor did not open a door after receiving the matching key");
  }

  const closing = makeScene();
  mod.SpawnDoorMemory(closing.dgroup, closing.plane0, 11, 10, true, 0);
  const doorObj = mod.nearOffsetForRuntimeSymbol("_doorobjlist");
  closing.dgroup.setU16(doorObj + 6, DR_OPEN);
  closing.dgroup.setU16(actoratCell(11, 10), 0);
  const closeSummary = mod.WL_ACT1_CloseDoor(closing.dgroup, 0);
  if (!closeSummary.closed || closeSummary.action !== DR_CLOSING || closing.dgroup.u16(actoratCell(11, 10)) !== 0x80) {
    fail("CloseDoorMemory did not make an open door solid and closing");
  }

  const push = makeScene({ walls: [[11, 10, 7]] });
  push.plane1[10 * 64 + 11] = 98;
  push.dgroup.setU16(buttonstate + BT_USE * 2, 1);
  const pushSummary = mod.CmdUseMemory(push.dgroup, push.plane0, push.plane1);
  if (
    pushSummary.action !== "pushwall" ||
    !pushSummary.pushwall?.pushed ||
    push.dgroup.u16(pwallstate) !== 1 ||
    push.dgroup.u16(pwallx) !== 11 ||
    push.dgroup.u16(pwally) !== 10 ||
    push.dgroup.u16(pwalldir) !== DI_EAST ||
    push.dgroup.u16(gamestate + GAMESTATE_SECRETCOUNT_OFFSET) !== 1 ||
    push.dgroup.u8(tilemapCell(11, 10)) !== (7 | 0xc0) ||
    push.dgroup.u8(tilemapCell(12, 10)) !== 7 ||
    push.dgroup.u16(actoratCell(12, 10)) !== 7 ||
    push.plane1[10 * 64 + 11] !== 0
  ) {
    fail("CmdUseMemory/PushWallMemory did not update push-wall state");
  }
  const busyPush = mod.WL_ACT1_PushWall(push.dgroup, push.plane1, 11, 10, DI_EAST);
  if (!busyPush.busy || busyPush.pushed) {
    fail("WL_ACT1_PushWall did not reject a push while pwallstate is active");
  }

  const elevator = makeScene({ areaTile: 108 });
  elevator.dgroup.setU8(tilemapCell(11, 10), 21);
  const elevatorUse = mod.CmdUseMemory(elevator.dgroup, elevator.plane0, elevator.plane1);
  if (
    elevatorUse.action !== "elevator" ||
    elevatorUse.playstate !== EX_COMPLETED ||
    elevator.dgroup.u8(tilemapCell(11, 10)) !== 22
  ) {
    fail("CmdUseMemory did not complete a normal elevator use");
  }
  const secretElevator = makeScene({ areaTile: 107 });
  secretElevator.dgroup.setU8(tilemapCell(11, 10), 21);
  const secretElevatorUse = mod.CmdUseMemory(secretElevator.dgroup, secretElevator.plane0, secretElevator.plane1);
  if (secretElevatorUse.playstate !== EX_SECRETLEVEL) {
    fail("CmdUseMemory did not mark an alternate elevator as secret level");
  }

  const tick = makeScene();
  tick.dgroup.setU16(controlx, 20);
  tick.dgroup.setU16(controly, -10);
  tick.dgroup.setU16(buttonstate + BT_ATTACK * 2, 1);
  tick.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  tick.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  const tickSummary = mod.WL_AGENT_T_Player(tick.dgroup, tick.plane0, tick.plane1, tick.player, { tics: 1 });
  if (
    tickSummary.state !== "_s_attack" ||
    tickSummary.fired?.state !== "_s_attack" ||
    tickSummary.plux !== (tick.dgroup.u32(tick.player + OBJ_X_OFFSET) >>> 8) ||
    tickSummary.tilex !== tick.dgroup.u16(tick.player + OBJ_TILEX_OFFSET)
  ) {
    fail("T_PlayerMemory did not fire, move, and update scaled player coordinates");
  }

  const doPlayer = makeScene();
  doPlayer.dgroup.setU16(controlx, 20);
  doPlayer.dgroup.setU16(controly, -10);
  doPlayer.dgroup.setU16(buttonstate + BT_ATTACK * 2, 1);
  doPlayer.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  doPlayer.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  const doPlayerStep = mod.WL_PLAY_DoActor(
    doPlayer.dgroup,
    doPlayer.plane0,
    doPlayer.plane1,
    doPlayer.player,
    { tics: 1 },
  );
  if (
    doPlayerStep.thinkCalls !== 1 ||
    doPlayerStep.state !== "_s_attack" ||
    doPlayer.dgroup.i32(playerxmove) <= 0 ||
    doPlayer.dgroup.u16(doPlayer.player + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_attack")
  ) {
    fail("DoActor did not dispatch _s_player through T_PlayerMemory");
  }

  const doAttack = makeScene();
  doAttack.dgroup.setU16(controlx, 20);
  doAttack.dgroup.setU16(controly, -10);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, WP_PISTOL);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, WP_PISTOL);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, 8);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET, 0);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET, 6);
  doAttack.dgroup.setU16(gamestate + GAMESTATE_WEAPONFRAME_OFFSET, 1);
  doAttack.dgroup.setU16(doAttack.player + OBJ_STATE_OFFSET, mod.statetypeNearOffset("_s_attack"));
  const doAttackStep = mod.WL_PLAY_DoActor(
    doAttack.dgroup,
    doAttack.plane0,
    doAttack.plane1,
    doAttack.player,
    { tics: 6 },
  );
  if (
    doAttackStep.thinkCalls !== 1 ||
    doAttackStep.state !== "_s_attack" ||
    doAttack.dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET) !== 1 ||
    doAttack.dgroup.u16(gamestate + GAMESTATE_ATTACKCOUNT_OFFSET) !== 6 ||
    doAttack.dgroup.i32(playerxmove) <= 0
  ) {
    fail("DoActor did not dispatch _s_attack through T_AttackMemory");
  }

  const victory = makeScene();
  victory.dgroup.setU16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET, 1);
  victory.dgroup.setU16(victory.player + OBJ_ANGLE_OFFSET, 300);
  const victorySummary = mod.WL_AGENT_VictorySpin(victory.dgroup, { tics: 5 });
  if (victorySummary.angle !== 285 || victory.dgroup.u16(victory.player + OBJ_ANGLE_OFFSET) !== 285) {
    fail("VictorySpinMemory did not rotate the player toward 270");
  }
  mod.WL_AGENT_VictoryTile(victory.dgroup);
  if (!victory.dgroup.u16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET)) {
    fail("VictoryTile wrapper did not set gamestate.victoryflag");
  }

  return {
    wallBlockedBy: wallTry.blockedBy,
    clipMode: clipSummary.mode,
    thrustTilex: thrustSummary.tilex,
    spawnAngle: spawn.angle,
    controlAngle: controlSummary.angle,
    doorAction: doorUse.door?.action,
    pushState: push.dgroup.u16(pwallstate),
    elevatorPlaystate: elevatorUse.playstate,
    tickState: tickSummary.state,
    doActorPlayerState: doPlayerStep.state,
    doActorAttackFrame: doAttack.dgroup.u16(gamestate + GAMESTATE_ATTACKFRAME_OFFSET),
  };
}

function checkRuntimeDoorLifecycle(mod) {
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const AREATILE = 107;
  const DR_OPEN = 0;
  const DR_CLOSED = 1;
  const DR_OPENING = 2;
  const DR_CLOSING = 3;
  const OBJ_AREANUMBER_OFFSET = 28;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const tilemap = mod.nearOffsetForRuntimeSymbol("_tilemap");
  const areabyplayer = mod.nearOffsetForRuntimeSymbol("_areabyplayer");
  const doorposition = mod.nearOffsetForRuntimeSymbol("_doorposition");
  const doorobjlist = mod.nearOffsetForRuntimeSymbol("_doorobjlist");
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const pwallstate = mod.nearOffsetForRuntimeSymbol("_pwallstate");
  const pwallpos = mod.nearOffsetForRuntimeSymbol("_pwallpos");
  const pwallx = mod.nearOffsetForRuntimeSymbol("_pwallx");
  const pwally = mod.nearOffsetForRuntimeSymbol("_pwally");
  const GAMESTATE_VICTORYFLAG_OFFSET = 64;
  const DI_EAST = 1;

  function actoratCell(x, y) {
    return actorat + (x * 64 + y) * 2;
  }

  function tilemapCell(x, y) {
    return tilemap + x * 64 + y;
  }

  function setPlayerPosition(dgroup, player, x, y, area) {
    dgroup.setU32(player + OBJ_X_OFFSET, (x << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU32(player + OBJ_Y_OFFSET, (y << TILESHIFT) + TILEGLOBAL / 2);
    dgroup.setU16(player + OBJ_TILEX_OFFSET, x);
    dgroup.setU16(player + OBJ_TILEY_OFFSET, y);
    dgroup.setU8(player + OBJ_AREANUMBER_OFFSET, area);
  }

  function makeDoorScene() {
    const plane0 = new Uint16Array(64 * 64).fill(AREATILE + 1);
    plane0[10 * 64 + 12] = AREATILE + 2;
    const plane1 = new Uint16Array(64 * 64);
    const areaconnect = new Uint8Array(37 * 37);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_tics"), 1);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_mapwidth"), 64);
    dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_mapheight"), 64);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.WL_ACT1_InitDoorList(dgroup, areaconnect);
    mod.WL_ACT1_InitStaticList(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 1);
    const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
    setPlayerPosition(dgroup, player, 10, 10, 1);
    mod.WL_ACT1_SpawnDoor(dgroup, plane0, 11, 10, true, 0);
    return { dgroup, plane0, plane1, areaconnect, player };
  }

  const areas = makeDoorScene();
  const initAreas = mod.WL_ACT1_InitAreas(areas.dgroup);
  if (
    initAreas.playerArea !== 1 ||
    initAreas.visibleAreas !== 1 ||
    areas.dgroup.u16(areabyplayer + 2 * 2) !== 0 ||
    areas.dgroup.u16(areabyplayer + 1 * 2) !== 1
  ) {
    fail("InitAreasMemory did not expose only the player's starting area");
  }
  areas.areaconnect[1 * 37 + 2] = 1;
  const connectedAreas = mod.WL_ACT1_ConnectAreas(areas.dgroup, areas.areaconnect);
  if (connectedAreas.visibleAreas !== 2 || areas.dgroup.u16(areabyplayer + 2 * 2) !== 1) {
    fail("ConnectAreasMemory did not recurse through areaconnect");
  }
  areas.dgroup.view(areabyplayer, 37 * 2).fill(0);
  const recursive = mod.WL_ACT1_RecursiveConnect(areas.dgroup, 1, areas.areaconnect);
  if (recursive.visibleAreas !== 2 || areas.dgroup.u16(areabyplayer + 2 * 2) !== 1) {
    fail("RecursiveConnectMemory did not mark connected areas");
  }

  const opening = makeDoorScene();
  mod.WL_ACT1_OpenDoor(opening.dgroup, 0);
  const openingStep = mod.WL_ACT1_DoorOpening(opening.dgroup, opening.plane0, 0, opening.areaconnect, {
    tics: 1,
  });
  if (
    !openingStep.connected ||
    openingStep.position !== 1024 ||
    opening.areaconnect[1 * 37 + 2] !== 1 ||
    opening.areaconnect[2 * 37 + 1] !== 1 ||
    opening.dgroup.u16(areabyplayer + 2 * 2) !== 1
  ) {
    fail("DoorOpeningMemory did not connect adjacent areas at the start of opening");
  }
  const openedStep = mod.DoorOpeningMemory(opening.dgroup, opening.plane0, 0, opening.areaconnect, {
    tics: 64,
  });
  if (
    openedStep.action !== DR_OPEN ||
    openedStep.position !== 0xffff ||
    opening.dgroup.u16(actoratCell(11, 10)) !== 0 ||
    opening.dgroup.u16(doorobjlist + 8) !== 0
  ) {
    fail("DoorOpeningMemory did not finish an opening door");
  }

  const openTimer = makeDoorScene();
  openTimer.dgroup.setU16(doorobjlist + 6, DR_OPEN);
  openTimer.dgroup.setU16(doorobjlist + 8, 299);
  openTimer.dgroup.setU16(actoratCell(11, 10), 0);
  const timerStep = mod.WL_ACT1_DoorOpen(openTimer.dgroup, 0, { tics: 1 });
  if (timerStep.action !== DR_CLOSING || openTimer.dgroup.u16(actoratCell(11, 10)) !== 0x80) {
    fail("DoorOpenMemory did not start closing after OPENTICS");
  }

  const closing = makeDoorScene();
  closing.areaconnect[1 * 37 + 2] = 1;
  closing.areaconnect[2 * 37 + 1] = 1;
  closing.dgroup.setU16(doorposition, 1024);
  closing.dgroup.setU16(doorobjlist + 6, DR_CLOSING);
  closing.dgroup.setU16(actoratCell(11, 10), 0x80);
  const closedStep = mod.WL_ACT1_DoorClosing(closing.dgroup, closing.plane0, 0, closing.areaconnect, {
    tics: 1,
  });
  if (
    !closedStep.disconnected ||
    closedStep.action !== DR_CLOSED ||
    closedStep.position !== 0 ||
    closing.areaconnect[1 * 37 + 2] !== 0 ||
    closing.dgroup.u16(areabyplayer + 2 * 2) !== 0
  ) {
    fail("DoorClosingMemory did not close and disconnect adjacent areas");
  }

  const blockedClosing = makeDoorScene();
  blockedClosing.dgroup.setU16(doorposition, 4096);
  blockedClosing.dgroup.setU16(doorobjlist + 6, DR_CLOSING);
  blockedClosing.dgroup.setU16(actoratCell(11, 10), 0);
  const blockedStep = mod.DoorClosingMemory(blockedClosing.dgroup, blockedClosing.plane0, 0, blockedClosing.areaconnect, {
    tics: 1,
  });
  if (!blockedStep.reopened || blockedStep.action !== DR_OPENING) {
    fail("DoorClosingMemory did not reopen when something entered the door");
  }

  const movingDoors = makeDoorScene();
  mod.WL_ACT1_OpenDoor(movingDoors.dgroup, 0);
  const moveDoorsSummary = mod.WL_ACT1_MoveDoors(
    movingDoors.dgroup,
    movingDoors.plane0,
    movingDoors.areaconnect,
    { tics: 64 },
  );
  if (moveDoorsSummary.moved !== 1 || moveDoorsSummary.opened !== 1 || moveDoorsSummary.doors[0]?.action !== DR_OPEN) {
    fail("MoveDoorsMemory did not dispatch an opening door");
  }
  movingDoors.dgroup.setU16(gamestate + GAMESTATE_VICTORYFLAG_OFFSET, 1);
  const skippedDoors = mod.MoveDoorsMemory(movingDoors.dgroup, movingDoors.plane0, movingDoors.areaconnect, { tics: 1 });
  if (!skippedDoors.skippedVictory || skippedDoors.moved !== 0) {
    fail("MoveDoorsMemory did not skip during victoryflag");
  }

  const push = makeDoorScene();
  push.plane0[10 * 64 + 11] = 7;
  push.dgroup.setU8(tilemapCell(11, 10), 7);
  push.dgroup.setU16(actoratCell(11, 10), 7);
  const pushed = mod.WL_ACT1_PushWall(push.dgroup, push.plane1, 11, 10, DI_EAST);
  if (!pushed.pushed) {
    fail("PushWall wrapper did not start a push wall");
  }
  const firstPushMove = mod.WL_ACT1_MovePWalls(push.dgroup, push.plane0, { tics: 127 });
  if (
    !firstPushMove.active ||
    !firstPushMove.crossedBlock ||
    push.dgroup.u16(pwallstate) !== 128 ||
    push.dgroup.u16(pwallx) !== 12 ||
    push.dgroup.u16(pwally) !== 10 ||
    push.dgroup.u8(tilemapCell(11, 10)) !== 0 ||
    push.dgroup.u16(actoratCell(11, 10)) !== 0 ||
    push.plane0[10 * 64 + 11] !== AREATILE + 1 ||
    push.dgroup.u8(tilemapCell(12, 10)) !== (7 | 0xc0) ||
    push.dgroup.u8(tilemapCell(13, 10)) !== 7 ||
    push.dgroup.u16(actoratCell(13, 10)) !== 7 ||
    push.dgroup.u16(pwallpos) !== 0
  ) {
    fail("MovePWallsMemory did not cross into the second push-wall block");
  }
  const finalPushMove = mod.MovePWallsMemory(push.dgroup, push.plane0, { tics: 129 });
  if (
    finalPushMove.active ||
    !finalPushMove.stopped ||
    push.dgroup.u16(pwallstate) !== 0 ||
    push.dgroup.u8(tilemapCell(12, 10)) !== 0 ||
    push.dgroup.u16(actoratCell(12, 10)) !== 0 ||
    push.plane0[10 * 64 + 12] !== AREATILE + 1
  ) {
    fail("MovePWallsMemory did not stop after two tiles");
  }

  return {
    openingPosition: openingStep.position,
    openedAction: openedStep.action,
    closedAction: closedStep.action,
    visibleAfterClose: closing.dgroup.u16(areabyplayer + 2 * 2),
    moveDoorsOpened: moveDoorsSummary.opened,
    pwallStateAfterFirstBlock: firstPushMove.pwallstate,
    pwallStopped: finalPushMove.stopped,
  };
}

function checkRuntimeProjectile(mod) {
  const AC_YES = 1;
  const FL_NEVERMARK = 4;
  const NEEDLEOBJ = 12;
  const FIREOBJ = 13;
  const ROCKETOBJ = 20;
  const SPARKOBJ = 28;
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const EAST_FULLSPEED_DELTA = TILEGLOBAL - 1;
  const GAMESTATE_HEALTH_OFFSET = 18;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_ANGLE_OFFSET = 42;
  const OBJ_SPEED_OFFSET = 46;
  const EAST_ANGLE = 0;

  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const damagecount = mod.nearOffsetForRuntimeSymbol("_damagecount");
  const lastAttacker = mod.nearOffsetForRuntimeSymbol("_LastAttacker");
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const boomState = mod.statetypeNearOffset("_s_boom1");

  function actoratCellOffset(tilex, tiley) {
    return actorat + (tilex * 64 + tiley) * 2;
  }

  function health(dgroup) {
    return dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET);
  }

  function setActorPosition(
    dgroup,
    actor,
    tilex,
    tiley,
    x = (tilex << TILESHIFT) + TILEGLOBAL / 2,
    y = (tiley << TILESHIFT) + TILEGLOBAL / 2,
  ) {
    dgroup.setU32(actor + OBJ_X_OFFSET, x);
    dgroup.setU32(actor + OBJ_Y_OFFSET, y);
    dgroup.setU16(actor + OBJ_TILEX_OFFSET, x >> TILESHIFT);
    dgroup.setU16(actor + OBJ_TILEY_OFFSET, y >> TILESHIFT);
  }

  function makeScene({
    actorX = 10,
    actorY = 10,
    playerX = 20,
    playerY = 10,
    obclass = ROCKETOBJ,
    state = "_s_rocket",
    speed = 512,
    walls = [],
  } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    for (const [x, y] of walls) {
      plane0[y * 64 + x] = 1;
    }
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, state).actor;
    dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);
    dgroup.setU16(actor + OBJ_CLASS_OFFSET, obclass);
    dgroup.setU16(actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset(state));
    dgroup.setU8(actor + OBJ_FLAGS_OFFSET, FL_NEVERMARK);
    dgroup.setU16(actor + OBJ_ANGLE_OFFSET, EAST_ANGLE);
    dgroup.setU32(actor + OBJ_SPEED_OFFSET, speed);
    setActorPosition(dgroup, actor, actorX, actorY);
    dgroup.setU16(actoratCellOffset(actorX, actorY), 0);
    return { dgroup, plane0, plane1, actor };
  }

  function expectTryMove(result, expected, label) {
    const ok =
      result === expected ||
      (expected && result?.moved === true) ||
      (!expected && result?.blocked === true) ||
      (!expected && result?.moved === false);
    if (!ok) {
      fail(`${label} returned unexpected ProjectileTryMove result`);
    }
  }

  const clear = makeScene();
  expectTryMove(
    mod.ProjectileTryMoveMemory(clear.dgroup, clear.plane0, clear.actor),
    true,
    "ProjectileTryMoveMemory clear space",
  );
  expectTryMove(
    mod.WL_ACT2_ProjectileTryMove(clear.dgroup, clear.plane0, clear.actor),
    true,
    "WL_ACT2_ProjectileTryMove clear space",
  );

  const moving = makeScene({ speed: TILEGLOBAL });
  const movingStartX = moving.dgroup.u32(moving.actor + OBJ_X_OFFSET);
  const moveStep = mod.T_ProjectileMemory(moving.dgroup, moving.plane0, moving.actor, { tics: 1 });
  if (
    moveStep?.blocked ||
    health(moving.dgroup) !== 100 ||
    moving.dgroup.u32(moving.actor + OBJ_X_OFFSET) !== movingStartX + EAST_FULLSPEED_DELTA ||
    moving.dgroup.u16(moving.actor + OBJ_TILEX_OFFSET) !== 11 ||
    moving.dgroup.u16(moving.actor + OBJ_TILEY_OFFSET) !== 10 ||
    moving.dgroup.u16(moving.actor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_rocket")
  ) {
    fail("T_ProjectileMemory did not move a clear projectile east by speed*tics");
  }

  const wrapperMoving = makeScene({ state: "_s_rocket", speed: TILEGLOBAL });
  mod.WL_ACT2_T_Projectile(wrapperMoving.dgroup, wrapperMoving.plane0, wrapperMoving.actor, {
    tics: 1,
  });
  if (
    wrapperMoving.dgroup.u16(wrapperMoving.actor + OBJ_TILEX_OFFSET) !== 11 ||
    wrapperMoving.dgroup.u16(wrapperMoving.actor + OBJ_TILEY_OFFSET) !== 10
  ) {
    fail("WL_ACT2_T_Projectile did not forward projectile movement");
  }

  const damageCases = [
    ["needle", NEEDLEOBJ, "_s_needle1", 21],
    ["rocket", ROCKETOBJ, "_s_rocket", 31],
    ["spark", SPARKOBJ, "_s_rocket", 31],
    ["fire", FIREOBJ, "_s_fire1", 1],
  ];
  for (const [label, obclass, state, expectedDamage] of damageCases) {
    const scene = makeScene({
      actorX: 10,
      actorY: 10,
      playerX: 10,
      playerY: 10,
      obclass,
      state,
      speed: 0,
    });
    mod.US_InitRndT(false);
    const step = mod.T_ProjectileMemory(scene.dgroup, scene.plane0, scene.actor, { tics: 1 });
    if (
      step?.hitPlayer === false ||
      health(scene.dgroup) !== 100 - expectedDamage ||
      scene.dgroup.u16(damagecount) !== expectedDamage ||
      scene.dgroup.u16(lastAttacker) !== scene.actor ||
      scene.dgroup.u16(scene.actor + OBJ_STATE_OFFSET) !== 0
    ) {
      fail(`T_ProjectileMemory ${label} did not apply deterministic projectile damage`);
    }
  }

  const wall = makeScene({
    walls: [[11, 10]],
    speed: TILEGLOBAL,
  });
  const wallStep = mod.T_ProjectileMemory(wall.dgroup, wall.plane0, wall.actor, { tics: 1 });
  const wallState = wall.dgroup.u16(wall.actor + OBJ_STATE_OFFSET);
  if (
    wallStep?.blocked === false ||
    (wallState !== 0 && wallState !== boomState) ||
    health(wall.dgroup) !== 100
  ) {
    fail("T_ProjectileMemory did not remove or explode a projectile blocked by a wall");
  }

  return {
    movedTilex: moving.dgroup.u16(moving.actor + OBJ_TILEX_OFFSET),
    movedTiley: moving.dgroup.u16(moving.actor + OBJ_TILEY_OFFSET),
    rocketDamage: 31,
    blockedState: wallState === boomState ? "_s_boom1" : null,
  };
}

function checkRuntimeSmokeAction(mod) {
  const AC_YES = 1;
  const INERTOBJ = 2;
  const FL_NEVERMARK = 4;
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_TICCOUNT_OFFSET = 2;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const dgroup = new mod.DOSMemory(0x10000);
  const plane0 = new Uint16Array(64 * 64).fill(107);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  const actor = mod.SpawnNewObjMemory(dgroup, plane0, 12, 10, "_s_rocket").actor;
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, 12);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, 10);
  dgroup.setU32(actor + OBJ_X_OFFSET, 12 * TILEGLOBAL + TILEGLOBAL / 2);
  dgroup.setU32(actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL + TILEGLOBAL / 2);

  const smoke = mod.WL_ACT2_A_Smoke(dgroup, actor);
  if (
    smoke.source !== actor ||
    smoke.state !== "_s_smoke1" ||
    smoke.ticcount !== 6 ||
    dgroup.u16(smoke.actor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_smoke1") ||
    dgroup.u16(smoke.actor + OBJ_TICCOUNT_OFFSET) !== 6 ||
    dgroup.u16(smoke.actor + OBJ_CLASS_OFFSET) !== INERTOBJ ||
    dgroup.u16(smoke.actor + OBJ_ACTIVE_OFFSET) !== AC_YES ||
    dgroup.u8(smoke.actor + OBJ_FLAGS_OFFSET) !== FL_NEVERMARK ||
    dgroup.u16(smoke.actor + OBJ_TILEX_OFFSET) !== 12 ||
    dgroup.u16(smoke.actor + OBJ_TILEY_OFFSET) !== 10 ||
    dgroup.i32(smoke.actor + OBJ_X_OFFSET) !== 12 * TILEGLOBAL + TILEGLOBAL / 2 ||
    dgroup.i32(smoke.actor + OBJ_Y_OFFSET) !== 10 * TILEGLOBAL + TILEGLOBAL / 2
  ) {
    fail(`WL_ACT2_A_Smoke did not spawn the smoke actor like WL_ACT2.C: ${JSON.stringify(smoke)}`);
  }

  return { state: smoke.state, ticcount: smoke.ticcount };
}

function checkRuntimeVictoryActions(mod) {
  const EX_VICTORIOUS = 6;
  const OBJ_TEMP1_OFFSET = 50;
  const dgroup = new mod.DOSMemory(0x10000);
  const plane0 = new Uint16Array(64 * 64).fill(107);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  const actor = mod.SpawnNewObjMemory(dgroup, plane0, 12, 10, "_s_grdstand").actor;
  dgroup.setU16(actor + OBJ_TEMP1_OFFSET, 73);

  const startAttack = mod.WL_ACT2_A_StartAttack(dgroup, actor);
  if (startAttack.actor !== actor || startAttack.temp1 !== 0 || dgroup.u16(actor + OBJ_TEMP1_OFFSET) !== 0) {
    fail(`WL_ACT2_A_StartAttack did not clear temp1 like WL_ACT2.C: ${JSON.stringify(startAttack)}`);
  }

  const playstate = mod.nearOffsetForRuntimeSymbol("_playstate");
  dgroup.setU16(playstate, 0);
  const victory = mod.WL_ACT2_A_Victory(dgroup, actor);
  if (victory.playstate !== EX_VICTORIOUS || dgroup.u16(playstate) !== EX_VICTORIOUS) {
    fail(`WL_ACT2_A_Victory did not set ex_victorious: ${JSON.stringify(victory)}`);
  }

  dgroup.setU16(playstate, 0);
  const bjDone = mod.WL_ACT2_T_BJDone(dgroup, actor);
  if (bjDone.playstate !== EX_VICTORIOUS || dgroup.u16(playstate) !== EX_VICTORIOUS) {
    fail(`WL_ACT2_T_BJDone did not set ex_victorious: ${JSON.stringify(bjDone)}`);
  }

  return { startAttackTemp1: startAttack.temp1, victoryPlaystate: victory.playstate, bjDonePlaystate: bjDone.playstate };
}

function checkRuntimeHitlerMorph(mod) {
  const FL_ATTACKMODE = 16;
  const FL_SHOOTABLE = 1;
  const FL_NONMARK = 128;
  const REALHITLEROBJ = 16;
  const SPDPATROL = 512;
  const TILEGLOBAL = 1 << 16;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_DISTANCE_OFFSET = 10;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_HITPOINTS_OFFSET = 44;
  const OBJ_SPEED_OFFSET = 46;
  const OBJTYPE_BYTES = 60;
  const plane0 = new Uint16Array(64 * 64).fill(107);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 2, 0);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  mod.InitDoorListMemory(dgroup);
  mod.InitStaticListMemory(dgroup);
  const source = mod.SpawnNewObjMemory(dgroup, plane0, 12, 10, "_s_mechadie3").actor;
  dgroup.setU32(source + OBJ_X_OFFSET, 12 * TILEGLOBAL + 1234);
  dgroup.setU32(source + OBJ_Y_OFFSET, 10 * TILEGLOBAL + 5678);
  dgroup.setU32(source + OBJ_DISTANCE_OFFSET, 321);
  dgroup.setU16(source + OBJ_DIR_OFFSET, 4);
  dgroup.setU8(source + OBJ_FLAGS_OFFSET, FL_ATTACKMODE);

  const morph = mod.WL_ACT2_A_HitlerMorph(dgroup, plane0, source);
  const expectedActor = source + OBJTYPE_BYTES;
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  if (
    morph.source !== source ||
    morph.actor !== expectedActor ||
    morph.state !== "_s_hitlerchase1" ||
    morph.hitpoints !== 800 ||
    morph.speed !== SPDPATROL * 5 ||
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_new")) !== expectedActor ||
    dgroup.u16(actorat + (12 * 64 + 10) * 2) !== expectedActor ||
    dgroup.u16(expectedActor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_hitlerchase1") ||
    dgroup.u32(expectedActor + OBJ_SPEED_OFFSET) !== SPDPATROL * 5 ||
    dgroup.u32(expectedActor + OBJ_X_OFFSET) !== dgroup.u32(source + OBJ_X_OFFSET) ||
    dgroup.u32(expectedActor + OBJ_Y_OFFSET) !== dgroup.u32(source + OBJ_Y_OFFSET) ||
    dgroup.u32(expectedActor + OBJ_DISTANCE_OFFSET) !== 321 ||
    dgroup.u16(expectedActor + OBJ_DIR_OFFSET) !== 4 ||
    dgroup.u8(expectedActor + OBJ_FLAGS_OFFSET) !== (FL_ATTACKMODE | FL_SHOOTABLE) ||
    dgroup.u16(expectedActor + OBJ_CLASS_OFFSET) !== REALHITLEROBJ ||
    dgroup.u16(expectedActor + OBJ_HITPOINTS_OFFSET) !== 800 ||
    dgroup.u16(expectedActor + OBJ_TILEX_OFFSET) !== 12 ||
    dgroup.u16(expectedActor + OBJ_TILEY_OFFSET) !== 10
  ) {
    fail(`WL_ACT2_A_HitlerMorph did not mirror the original morph bookkeeping: ${JSON.stringify(morph)}`);
  }

  const dispatchPlane0 = new Uint16Array(64 * 64).fill(107);
  const dispatchPlane1 = new Uint16Array(64 * 64);
  const dispatchDgroup = new mod.DOSMemory(0x10000);
  mod.US_InitRndT(false);
  mod.NewGameMemory(dispatchDgroup, 2, 0);
  mod.copyWallDataToLevelMemory(dispatchPlane0, dispatchDgroup);
  mod.InitActorListMemory(dispatchDgroup);
  mod.InitDoorListMemory(dispatchDgroup);
  mod.InitStaticListMemory(dispatchDgroup);
  const dispatchSource = mod.SpawnNewObjMemory(dispatchDgroup, dispatchPlane0, 14, 9, "_s_mechadie3").actor;
  dispatchDgroup.setU32(dispatchSource + OBJ_X_OFFSET, 14 * TILEGLOBAL + 2468);
  dispatchDgroup.setU32(dispatchSource + OBJ_Y_OFFSET, 9 * TILEGLOBAL + 1357);
  dispatchDgroup.setU32(dispatchSource + OBJ_DISTANCE_OFFSET, 654);
  dispatchDgroup.setU16(dispatchSource + OBJ_DIR_OFFSET, 6);
  dispatchDgroup.setU8(dispatchSource + OBJ_FLAGS_OFFSET, FL_NONMARK);
  dispatchDgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
  dispatchDgroup.setU16(dispatchSource + 2, 1);
  const dispatchStep = mod.WL_PLAY_DoActor(dispatchDgroup, dispatchPlane0, dispatchPlane1, dispatchSource, { tics: 1 });
  const dispatchMorph = dispatchStep.actions?.[0]?.morph;
  const dispatchActor = dispatchSource + OBJTYPE_BYTES;
  if (
    dispatchStep.actions?.[0]?.action !== "A_HitlerMorph" ||
    dispatchMorph?.actor !== dispatchActor ||
    dispatchMorph.hitpoints !== 800 ||
    dispatchStep.state !== "_s_mechadie4" ||
    dispatchStep.ticcount !== 0 ||
    dispatchDgroup.u16(dispatchActor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_hitlerchase1") ||
    dispatchDgroup.u16(dispatchActor + OBJ_CLASS_OFFSET) !== REALHITLEROBJ ||
    dispatchDgroup.u8(dispatchActor + OBJ_FLAGS_OFFSET) !== (FL_NONMARK | FL_SHOOTABLE) ||
    dispatchDgroup.u16(dispatchActor + OBJ_HITPOINTS_OFFSET) !== 800 ||
    dispatchDgroup.u16(actorat + (14 * 64 + 9) * 2) !== dispatchActor
  ) {
    fail(`DoActor did not dispatch A_HitlerMorph from s_mechadie3: ${JSON.stringify(dispatchStep)}`);
  }

  return {
    actor: morph.actor,
    hitpoints: morph.hitpoints,
    speed: morph.speed,
    dispatchActor,
    dispatchState: dispatchStep.state,
  };
}

function checkRuntimeBJVictory(mod) {
  const EX_VICTORIOUS = 6;
  const ICONARROWS = 90;
  const YEAHSND = 72;
  const NORTH = 2;
  const BJOBJ = 14;
  const TILEGLOBAL = 1 << 16;
  const OBJ_TICCOUNT_OFFSET = 2;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_DISTANCE_OFFSET = 10;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_TEMP1_OFFSET = 50;
  const plane0 = new Uint16Array(64 * 64).fill(107);
  const plane1 = new Uint16Array(64 * 64);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.US_InitRndT(false);
  mod.NewGameMemory(dgroup, 2, 0);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  mod.InitDoorListMemory(dgroup);
  mod.InitStaticListMemory(dgroup);
  mod.SpawnPlayerMemory(dgroup, plane0, 10, 10, 0);

  const spawn = mod.WL_ACT2_SpawnBJVictory(dgroup, plane0);
  const actor = spawn.actor;
  const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  if (
    spawn.state !== "_s_bjrun1" ||
    spawn.tilex !== 10 ||
    spawn.tiley !== 11 ||
    spawn.temp1 !== 6 ||
    dgroup.u16(actor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_bjrun1") ||
    dgroup.u16(actor + OBJ_CLASS_OFFSET) !== BJOBJ ||
    dgroup.u16(actor + OBJ_DIR_OFFSET) !== NORTH ||
    dgroup.u16(actor + OBJ_TEMP1_OFFSET) !== 6 ||
    dgroup.u32(actor + OBJ_X_OFFSET) !== dgroup.u32(player + OBJ_X_OFFSET) ||
    dgroup.u32(actor + OBJ_Y_OFFSET) !== dgroup.u32(player + OBJ_Y_OFFSET) ||
    dgroup.u16(actorat + (10 * 64 + 11) * 2) !== actor
  ) {
    fail(`WL_ACT2_SpawnBJVictory did not mirror the original spawn fields: ${JSON.stringify(spawn)}`);
  }

  plane1[11 * 64 + 10] = ICONARROWS + NORTH;
  const run = mod.WL_ACT2_T_BJRun(dgroup, plane0, plane1, actor, { tics: 1 });
  if (
    !run.moved ||
    run.jumped ||
    run.temp1 !== 5 ||
    run.distance !== TILEGLOBAL - 2048 ||
    dgroup.u16(actor + OBJ_TILEX_OFFSET) !== 10 ||
    dgroup.u16(actor + OBJ_TILEY_OFFSET) !== 10 ||
    dgroup.u32(actor + OBJ_X_OFFSET) !== 10 * TILEGLOBAL + TILEGLOBAL / 2 ||
    dgroup.u32(actor + OBJ_Y_OFFSET) !== 11 * TILEGLOBAL + TILEGLOBAL / 2 - 2048
  ) {
    fail(`WL_ACT2_T_BJRun did not consume the path arrow and advance BJ north: ${JSON.stringify(run)}`);
  }

  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, 0);
  dgroup.setU16(actor + OBJ_TILEX_OFFSET, 10);
  dgroup.setU16(actor + OBJ_TILEY_OFFSET, 11);
  dgroup.setU16(actor + OBJ_TEMP1_OFFSET, 1);
  dgroup.setU16(actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset("_s_bjrun1"));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, 12);
  const jumpTransition = mod.WL_ACT2_T_BJRun(dgroup, plane0, plane1, actor, { tics: 1 });
  if (
    !jumpTransition.jumped ||
    jumpTransition.temp1 !== 0 ||
    jumpTransition.state !== "_s_bjjump1" ||
    dgroup.u16(actor + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset("_s_bjjump1") ||
    dgroup.u16(actor + OBJ_TICCOUNT_OFFSET) !== 14
  ) {
    fail(`WL_ACT2_T_BJRun did not transition to s_bjjump1 when temp1 expired: ${JSON.stringify(jumpTransition)}`);
  }

  dgroup.setU16(actor + OBJ_DIR_OFFSET, NORTH);
  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  dgroup.setU32(actor + OBJ_X_OFFSET, 10 * TILEGLOBAL + TILEGLOBAL / 2);
  dgroup.setU32(actor + OBJ_Y_OFFSET, 10 * TILEGLOBAL + TILEGLOBAL / 2);
  const jump = mod.WL_ACT2_T_BJJump(dgroup, actor, { tics: 2 });
  if (
    jump.move !== 1360 ||
    jump.distance !== TILEGLOBAL - 1360 ||
    jump.x !== 10 * TILEGLOBAL + TILEGLOBAL / 2 ||
    jump.y !== 10 * TILEGLOBAL + TILEGLOBAL / 2 - 1360
  ) {
    fail(`WL_ACT2_T_BJJump did not MoveObj with BJJUMPSPEED*tics: ${JSON.stringify(jump)}`);
  }

  dgroup.setU16(actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset("_s_bjjump2"));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, 1);
  dgroup.setU16(actor + OBJ_DIR_OFFSET, NORTH);
  dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
  dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
  const yellStep = mod.WL_PLAY_DoActor(dgroup, plane0, plane1, actor, { tics: 1 });
  const yell = yellStep.actions?.[0]?.sound;
  if (
    yellStep.actions?.[0]?.action !== "T_BJYell" ||
    yell?.sound !== YEAHSND ||
    yell.positioned !== true ||
    yell.actor !== actor ||
    yellStep.state !== "_s_bjjump3" ||
    yellStep.ticcount !== 14
  ) {
    fail(`DoActor did not dispatch BJ yell while advancing s_bjjump2: ${JSON.stringify(yellStep)}`);
  }

  dgroup.setU16(actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset("_s_bjjump4"));
  dgroup.setU16(actor + OBJ_TICCOUNT_OFFSET, 1);
  dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_playstate"), 0);
  dgroup.setU16(mod.nearOffsetForRuntimeSymbol("_areabyplayer"), 1);
  const doneStep = mod.WL_PLAY_DoActor(dgroup, plane0, plane1, actor, { tics: 1 });
  if (
    dgroup.u16(mod.nearOffsetForRuntimeSymbol("_playstate")) !== EX_VICTORIOUS ||
    doneStep.state !== "_s_bjjump4" ||
    doneStep.ticcount !== 300
  ) {
    fail(`DoActor did not dispatch BJ victory completion: ${JSON.stringify(doneStep)}`);
  }

  return {
    actor,
    runTemp1: run.temp1,
    jumpMove: jump.move,
    yellSound: yell.sound,
    playstate: dgroup.u16(mod.nearOffsetForRuntimeSymbol("_playstate")),
  };
}

function checkRuntimeSoundActions(mod) {
  const GUARDOBJ = 3;
  const BOSSOBJ = 7;
  const DEATHSCREAM1SND = 29;
  const MUTTISND = 50;
  const SLURPIESND = 61;
  const MECHSTEPSND = 70;
  const YEAHSND = 72;
  const DEATHSCREAM6SND = 75;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_AREANUMBER_OFFSET = 28;
  const plane0 = new Uint16Array(64 * 64).fill(107);
  const dgroup = new mod.DOSMemory(0x10000);
  mod.NewGameMemory(dgroup, 2, 0);
  mod.copyWallDataToLevelMemory(plane0, dgroup);
  mod.InitActorListMemory(dgroup);
  const actor = mod.SpawnNewObjMemory(dgroup, plane0, 12, 10, "_s_grdstand").actor;
  const gamestate = mod.nearOffsetForRuntimeSymbol("_gamestate");
  const areabyplayer = mod.nearOffsetForRuntimeSymbol("_areabyplayer");

  function expectSound(actual, expected, label) {
    if (
      actual?.sound !== expected.sound ||
      actual.positioned !== expected.positioned ||
      actual.actor !== expected.actor
    ) {
      fail(`${label} sound decision did not match WL_ACT2.C: ${JSON.stringify(actual)}`);
    }
  }

  mod.US_InitRndT(false);
  dgroup.setU16(gamestate + 2, 0);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, GUARDOBJ);
  const guard = mod.WL_ACT2_A_DeathScream(dgroup, actor);
  expectSound(guard, { sound: DEATHSCREAM1SND, positioned: true, actor }, "guard A_DeathScream");

  mod.US_InitRndT(true, 82);
  dgroup.setU16(gamestate + 2, 9);
  const secret = mod.WL_ACT2_A_DeathScream(dgroup, actor);
  expectSound(secret, { sound: DEATHSCREAM6SND, positioned: true, actor }, "map 9 A_DeathScream");

  mod.US_InitRndT(false);
  dgroup.setU16(gamestate + 2, 0);
  dgroup.setU16(actor + OBJ_CLASS_OFFSET, BOSSOBJ);
  const boss = mod.WL_ACT2_A_DeathScream(dgroup, actor);
  expectSound(boss, { sound: MUTTISND, positioned: false, actor: null }, "boss A_DeathScream");

  dgroup.setU8(actor + OBJ_AREANUMBER_OFFSET, 2);
  dgroup.setU16(areabyplayer + 2 * 2, 0);
  const mechHidden = mod.WL_ACT2_A_MechaSound(dgroup, actor);
  if (mechHidden !== null) {
    fail(`A_MechaSound played while the actor area was hidden: ${JSON.stringify(mechHidden)}`);
  }
  dgroup.setU16(areabyplayer + 2 * 2, 1);
  const mechVisible = mod.WL_ACT2_A_MechaSound(dgroup, actor);
  expectSound(mechVisible, { sound: MECHSTEPSND, positioned: true, actor }, "visible A_MechaSound");

  const slurpie = mod.WL_ACT2_A_Slurpie(dgroup, actor);
  expectSound(slurpie, { sound: SLURPIESND, positioned: false, actor: null }, "A_Slurpie");

  const bjYell = mod.WL_ACT2_T_BJYell(dgroup, actor);
  expectSound(bjYell, { sound: YEAHSND, positioned: true, actor }, "T_BJYell");

  const breathing = mod.WL_ACT2_A_Breathing(dgroup, actor);
  if (breathing !== null) {
    fail(`WL6 A_Breathing should remain a no-op without Spear audio constants: ${JSON.stringify(breathing)}`);
  }

  return {
    guard: guard.sound,
    secret: secret.sound,
    boss: boss.sound,
    mechHidden: mechHidden === null,
    mechVisible: mechVisible.sound,
    slurpie: slurpie.sound,
    bjYell: bjYell.sound,
    breathing: breathing === null,
  };
}

function checkRuntimeBossProjectiles(mod) {
  const AC_YES = 1;
  const FL_NEVERMARK = 4;
  const FL_NONMARK = 128;
  const NEEDLEOBJ = 12;
  const FIREOBJ = 13;
  const ROCKETOBJ = 20;
  const TILESHIFT = 16;
  const TILEGLOBAL = 1 << TILESHIFT;
  const OBJ_ACTIVE_OFFSET = 0;
  const OBJ_CLASS_OFFSET = 4;
  const OBJ_STATE_OFFSET = 6;
  const OBJ_FLAGS_OFFSET = 8;
  const OBJ_DISTANCE_OFFSET = 10;
  const OBJ_DIR_OFFSET = 14;
  const OBJ_X_OFFSET = 16;
  const OBJ_Y_OFFSET = 20;
  const OBJ_TILEX_OFFSET = 24;
  const OBJ_TILEY_OFFSET = 26;
  const OBJ_ANGLE_OFFSET = 42;
  const OBJ_SPEED_OFFSET = 46;
  const NODIR = 8;

  const actorat = mod.nearOffsetForRuntimeSymbol("_actorat");
  const objcount = mod.nearOffsetForRuntimeSymbol("_objcount");

  function actoratCellOffset(tilex, tiley) {
    return actorat + (tilex * 64 + tiley) * 2;
  }

  function makeScene({
    actorX = 10,
    actorY = 10,
    playerX = 14,
    playerY = 10,
    state = "_s_schabbchase1",
    obclass = 8,
  } = {}) {
    const plane0 = new Uint16Array(64 * 64).fill(107);
    const plane1 = new Uint16Array(64 * 64);
    const dgroup = new mod.DOSMemory(0x10000);
    mod.NewGameMemory(dgroup, 3, 0);
    mod.copyWallDataToLevelMemory(plane0, dgroup);
    mod.InitActorListMemory(dgroup);
    mod.InitDoorListMemory(dgroup);
    mod.InitStaticListMemory(dgroup);
    mod.SpawnPlayerMemory(dgroup, plane0, playerX, playerY, 0);
    const actor = mod.SpawnNewObjMemory(dgroup, plane0, actorX, actorY, state).actor;
    dgroup.setU16(actor + OBJ_ACTIVE_OFFSET, AC_YES);
    dgroup.setU16(actor + OBJ_CLASS_OFFSET, obclass);
    dgroup.setU16(actor + OBJ_STATE_OFFSET, mod.statetypeNearOffset(state));
    dgroup.setU32(actor + OBJ_DISTANCE_OFFSET, TILEGLOBAL);
    dgroup.setU16(actor + OBJ_DIR_OFFSET, NODIR);
    return { dgroup, plane0, plane1, actor };
  }

  function assertProjectile(scene, projectile, expected, label) {
    const dgroup = scene.dgroup;
    if (
      dgroup.u16(projectile + OBJ_ACTIVE_OFFSET) !== AC_YES ||
      dgroup.u16(projectile + OBJ_CLASS_OFFSET) !== expected.obclass ||
      dgroup.u16(projectile + OBJ_STATE_OFFSET) !== mod.statetypeNearOffset(expected.state) ||
      dgroup.u8(projectile + OBJ_FLAGS_OFFSET) !== expected.flags ||
      dgroup.u16(projectile + OBJ_DIR_OFFSET) !== NODIR ||
      dgroup.u16(projectile + OBJ_ANGLE_OFFSET) !== expected.angle ||
      dgroup.u32(projectile + OBJ_SPEED_OFFSET) !== expected.speed ||
      dgroup.u16(projectile + OBJ_TILEX_OFFSET) !== dgroup.u16(scene.actor + OBJ_TILEX_OFFSET) ||
      dgroup.u16(projectile + OBJ_TILEY_OFFSET) !== dgroup.u16(scene.actor + OBJ_TILEY_OFFSET) ||
      dgroup.u32(projectile + OBJ_X_OFFSET) !== dgroup.u32(scene.actor + OBJ_X_OFFSET) ||
      dgroup.u32(projectile + OBJ_Y_OFFSET) !== dgroup.u32(scene.actor + OBJ_Y_OFFSET)
    ) {
      fail(`${label} did not initialize the projectile actor like WL_ACT2.C`);
    }
    if (dgroup.u16(actoratCellOffset(dgroup.u16(scene.actor + OBJ_TILEX_OFFSET), dgroup.u16(scene.actor + OBJ_TILEY_OFFSET))) === projectile) {
      fail(`${label} unexpectedly marked actorat for a GetNewActor projectile`);
    }
  }

  const schabb = makeScene({ obclass: 8, state: "_s_schabbchase1" });
  const schabbStartCount = schabb.dgroup.u16(objcount);
  const needle = mod.T_SchabbThrowMemory(schabb.dgroup, schabb.actor);
  if (schabb.dgroup.u16(objcount) !== schabbStartCount + 1 || needle.actor !== schabb.dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastobj"))) {
    fail("T_SchabbThrowMemory did not allocate one new actor");
  }
  assertProjectile(
    schabb,
    needle.actor,
    { obclass: NEEDLEOBJ, state: "_s_needle1", flags: FL_NONMARK, angle: 0, speed: 0x2000 },
    "T_SchabbThrowMemory",
  );

  const gift = makeScene({ obclass: 18, state: "_s_giftchase1", playerX: 10, playerY: 6 });
  const rocket = mod.WL_ACT2_T_GiftThrow(gift.dgroup, gift.actor);
  assertProjectile(
    gift,
    rocket.actor,
    { obclass: ROCKETOBJ, state: "_s_rocket", flags: FL_NONMARK, angle: 90, speed: 0x2000 },
    "WL_ACT2_T_GiftThrow",
  );

  const fake = makeScene({ obclass: 9, state: "_s_fakechase1", playerX: 6, playerY: 10 });
  const fire = mod.WL_ACT2_T_FakeFire(fake.dgroup, fake.actor);
  assertProjectile(
    fake,
    fire.actor,
    { obclass: FIREOBJ, state: "_s_fire1", flags: FL_NEVERMARK, angle: 180, speed: 0x1200 },
    "WL_ACT2_T_FakeFire",
  );
  if (fake.dgroup.u16(fire.actor + 2) !== 1) {
    fail("WL_ACT2_T_FakeFire did not seed projectile ticcount to 1");
  }

  const schabbDo = makeScene({ obclass: 8, state: "_s_schabbshoot2" });
  schabbDo.dgroup.setU16(schabbDo.actor + 2, 1);
  schabbDo.dgroup.setU16(schabbDo.actor + OBJ_DIR_OFFSET, 4);
  mod.US_InitRndT(false);
  const beforeDoCount = schabbDo.dgroup.u16(objcount);
  const doStep = mod.WL_PLAY_DoActor(schabbDo.dgroup, schabbDo.plane0, schabbDo.plane1, schabbDo.actor, {
    tics: 1,
  });
  if (
    schabbDo.dgroup.u16(objcount) !== beforeDoCount + 1 ||
    doStep.state !== "_s_schabbchase1"
  ) {
    fail("DoActor did not dispatch T_SchabbThrow action and advance to chase");
  }
  assertProjectile(
    schabbDo,
    schabbDo.dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastobj")),
    { obclass: NEEDLEOBJ, state: "_s_needle1", flags: FL_NONMARK, angle: 0, speed: 0x2000 },
    "DoActor T_SchabbThrow",
  );

  return {
    needleAngle: schabb.dgroup.u16(needle.actor + OBJ_ANGLE_OFFSET),
    rocketAngle: gift.dgroup.u16(rocket.actor + OBJ_ANGLE_OFFSET),
    fireAngle: fake.dgroup.u16(fire.actor + OBJ_ANGLE_OFFSET),
    doActorState: doStep.state,
  };
}

async function checkRuntimeLevelSetup(mod) {
  const [mapHead, gameMaps] = await Promise.all(
    ["MAPHEAD.WL6", "GAMEMAPS.WL6"].map(async (name) =>
      new Uint8Array(await readFile(path.join(wl6Dir, name))),
    ),
  );
  const { rlewtag, headers } = readMapHeaders(mapHead, gameMaps);
  const hash = createHash("sha256");
  let maps = 0;
  let walls = 0;
  let floors = 0;
  let ambushMarkers = 0;
  let doors = 0;
  let statics = 0;
  let treasureTotal = 0;
  let players = 0;
  let enemies = 0;
  let killTotal = 0;
  let secretPushwalls = 0;

  for (const header of headers) {
    if (!header) {
      continue;
    }
    const [originalPlane0, originalPlane1] = loadMapPlanes(header, gameMaps, rlewtag);
    const plane0 = new Uint16Array(originalPlane0);
    const dgroup = new mod.DOSMemory(0x10000);
    const farAreaconnect = new Uint8Array(37 * 37).fill(0xdd);
    mod.US_InitRndT(false);
    mod.NewGameMemory(dgroup, 3, 0);
    const setup = mod.WL_GAME_SetupGameLevel(plane0, originalPlane1, dgroup, {
      loadedgame: false,
      areaconnect: farAreaconnect,
    });
    const expected = modelLevelSetup(
      originalPlane0,
      originalPlane1,
      mod.STATINFO_WL6,
      mod.starthitpoints,
      Array.from(mod.rndtable),
      mod.nearOffsetForRuntimeSymbol("_objlist"),
      3,
    );
    if (setup.walls !== expected.walls || setup.floors !== expected.floors) {
      fail(`wall copy count mismatch for ${header.name}`);
    }
    if (setup.doors !== expected.doors.length) {
      fail(`door count mismatch for ${header.name}`);
    }
    if (setup.statics !== expected.statics.length) {
      fail(`static count mismatch for ${header.name}`);
    }
    if (setup.players !== expected.players.length) {
      fail(`player start count mismatch for ${header.name}`);
    }
    if (setup.secretPushwalls !== expected.secretPushwalls) {
      fail(`secret pushwall count mismatch for ${header.name}`);
    }
    if (setup.enemies !== expected.enemies.length) {
      fail(`enemy count mismatch for ${header.name}`);
    }
    if (setup.killtotal !== expected.killTotal) {
      fail(`killtotal mismatch for ${header.name}`);
    }
    if (setup.ambushMarkers !== expected.ambushMarkers) {
      fail(`ambush marker count mismatch for ${header.name}`);
    }
    if (dgroup.u16(mod.nearOffsetForRuntimeSymbol("_objcount")) !== expected.enemies.length + 1) {
      fail(`objcount mismatch for ${header.name}`);
    }

    for (let y = 0; y < WL6.MAPSIZE; y++) {
      for (let x = 0; x < WL6.MAPSIZE; x++) {
        const cell = x * WL6.MAPSIZE + y;
        if (mod.levelTilemapCell(dgroup, x, y) !== expected.tilemap[cell]) {
          fail(`tilemap mismatch for ${header.name} at ${x},${y}`);
        }
        if (mod.levelActoratCell(dgroup, x, y) !== expected.actorat[cell]) {
          fail(`actorat mismatch for ${header.name} at ${x},${y}`);
        }
      }
    }
    if (!wordEqual(plane0, expected.plane0)) {
      fail(`wall plane mutation mismatch for ${header.name}`);
    }
    for (const door of expected.doors) {
      const doorOffset = mod.nearOffsetForRuntimeSymbol("_doorobjlist") + door.index * 10;
      if (
        dgroup.u16(mod.nearOffsetForRuntimeSymbol("_doorposition") + door.index * 2) !== 0 ||
        dgroup.u8(doorOffset) !== door.x ||
        dgroup.u8(doorOffset + 1) !== door.y ||
        dgroup.u16(doorOffset + 2) !== (door.vertical ? 1 : 0) ||
        dgroup.u8(doorOffset + 4) !== door.lock ||
        dgroup.u16(doorOffset + 6) !== 1
      ) {
        fail(`door object mismatch for ${header.name} door ${door.index}`);
      }
    }
    if (
      dgroup.u16(mod.nearOffsetForRuntimeSymbol("_doornum")) !== expected.doors.length ||
      dgroup.u16(mod.nearOffsetForRuntimeSymbol("_lastdoorobj")) !==
        mod.nearOffsetForRuntimeSymbol("_doorobjlist") + expected.doors.length * 10
    ) {
      fail(`door globals mismatch for ${header.name}`);
    }
    for (const stat of expected.statics) {
      const statOffset = mod.nearOffsetForRuntimeSymbol("_statobjlist") + stat.index * 8;
      if (
        dgroup.u8(statOffset) !== stat.x ||
        dgroup.u8(statOffset + 1) !== stat.y ||
        dgroup.u16(statOffset + 2) !== mod.nearOffsetForRuntimeSymbol("_spotvis") + stat.x * 64 + stat.y ||
        dgroup.u16(statOffset + 4) !== stat.picnum ||
        dgroup.u8(statOffset + 6) !== stat.flags ||
        dgroup.u8(statOffset + 7) !== stat.itemnumber
      ) {
        fail(`static object mismatch for ${header.name} static ${stat.index}`);
      }
    }
    if (
      dgroup.u16(mod.nearOffsetForRuntimeSymbol("_laststatobj")) !==
        mod.nearOffsetForRuntimeSymbol("_statobjlist") + expected.statics.length * 8
    ) {
      fail(`laststatobj mismatch for ${header.name}`);
    }
    if (
      dgroup.u16(mod.nearOffsetForRuntimeSymbol("_gamestate") + 48) !== expected.treasureTotal
    ) {
      fail(`treasuretotal mismatch for ${header.name}`);
    }
    if (dgroup.u16(mod.nearOffsetForRuntimeSymbol("_gamestate") + 46) !== expected.secretPushwalls) {
      fail(`secrettotal mismatch for ${header.name}`);
    }
    if (dgroup.u16(mod.nearOffsetForRuntimeSymbol("_gamestate") + 50) !== expected.killTotal) {
      fail(`killtotal gamestate mismatch for ${header.name}`);
    }
    if (expected.players.length > 0) {
      const player = expected.players.at(-1);
      const playerOffset = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
      if (
        dgroup.u16(playerOffset) !== 1 ||
        dgroup.u16(playerOffset + 4) !== 1 ||
        dgroup.u16(playerOffset + 6) !== mod.statetypeNearOffset("_s_player") ||
        dgroup.u8(playerOffset + 8) !== 4 ||
        dgroup.u32(playerOffset + 16) !== player.xglobal ||
        dgroup.u32(playerOffset + 20) !== player.yglobal ||
        dgroup.u16(playerOffset + 24) !== player.x ||
        dgroup.u16(playerOffset + 26) !== player.y ||
        dgroup.u8(playerOffset + 28) !== player.areanumber ||
        dgroup.u16(playerOffset + 42) !== player.angle
      ) {
        fail(`player object mismatch for ${header.name}`);
      }
    }
    for (const enemy of expected.enemies) {
      const actualEnemy = {
        active: dgroup.u16(enemy.actor),
        ticcount: dgroup.u16(enemy.actor + 2),
        obclass: dgroup.u16(enemy.actor + 4),
        state: dgroup.u16(enemy.actor + 6),
        flags: dgroup.u8(enemy.actor + 8),
        distance: dgroup.u32(enemy.actor + 10),
        dir: dgroup.u16(enemy.actor + 14),
        xglobal: dgroup.u32(enemy.actor + 16),
        yglobal: dgroup.u32(enemy.actor + 20),
        tilex: dgroup.u16(enemy.actor + 24),
        tiley: dgroup.u16(enemy.actor + 26),
        areanumber: dgroup.u8(enemy.actor + 28),
        hitpoints: dgroup.u16(enemy.actor + 44),
        speed: dgroup.u32(enemy.actor + 46),
      };
      const expectedEnemy = {
        active: enemy.active,
        ticcount: enemy.ticcount,
        obclass: enemy.obclass,
        state: mod.statetypeNearOffset(enemy.state),
        flags: enemy.flags,
        distance: enemy.distance,
        dir: enemy.dir,
        xglobal: enemy.xglobal,
        yglobal: enemy.yglobal,
        tilex: enemy.tilex,
        tiley: enemy.tiley,
        areanumber: enemy.areanumber,
        hitpoints: enemy.hitpoints,
        speed: enemy.speed,
      };
      const diffs = Object.keys(expectedEnemy).filter((key) => expectedEnemy[key] !== actualEnemy[key]);
      if (diffs.length > 0) {
        fail(
          `enemy object mismatch for ${header.name} enemy ${enemy.index}: ${diffs
            .map((key) => `${key} expected ${expectedEnemy[key]} actual ${actualEnemy[key]}`)
            .join("; ")}`,
        );
      }
    }
    if (farAreaconnect.some((byte) => byte !== 0)) {
      fail(`areaconnect was not cleared for ${header.name}`);
    }

    hash.update(dgroup.bytes.subarray(mod.nearOffsetForSymbol("_tilemap"), mod.nearOffsetForSymbol("_tilemap") + 4096));
    hash.update(dgroup.bytes.subarray(mod.nearOffsetForSymbol("_actorat"), mod.nearOffsetForSymbol("_actorat") + 8192));
    hash.update(
      dgroup.bytes.subarray(
        mod.nearOffsetForRuntimeSymbol("_objlist"),
        mod.nearOffsetForRuntimeSymbol("_objlist") + (expected.enemies.length + 1) * 60,
      ),
    );
    hash.update(wordsToBytes(plane0));
    maps++;
    walls += setup.walls;
    floors += setup.floors;
    ambushMarkers += setup.ambushMarkers;
    doors += setup.doors;
    statics += setup.statics;
    treasureTotal += expected.treasureTotal;
    players += setup.players;
    enemies += setup.enemies;
    killTotal += expected.killTotal;
    secretPushwalls += setup.secretPushwalls;
  }

  const summary = {
    maps,
    walls,
    floors,
    ambushMarkers,
    doors,
    statics,
    treasureTotal,
    players,
    enemies,
    killTotal,
    secretPushwalls,
    aggregateSha256: hash.digest("hex"),
  };

  for (const [key, expected] of Object.entries(EXPECTED_LEVEL_SETUP)) {
    if (summary[key] !== expected) {
      fail(`level setup ${key} mismatch: ${summary[key]}`);
    }
  }

  return summary;
}

const MODEL_INITIAL_STATE_TICTIME = {
  _s_grdstand: 0,
  _s_grdpath1: 20,
  _s_grddie4: 0,
  _s_blinkychase1: 10,
  _s_inkychase1: 10,
  _s_pinkychase1: 10,
  _s_clydechase1: 10,
  _s_dogpath1: 20,
  _s_ofcstand: 0,
  _s_ofcpath1: 20,
  _s_mutstand: 0,
  _s_mutpath1: 20,
  _s_ssstand: 0,
  _s_sspath1: 20,
  _s_bossstand: 0,
  _s_gretelstand: 0,
  _s_schabbstand: 0,
  _s_giftstand: 0,
  _s_fatstand: 0,
  _s_fakestand: 0,
  _s_mechastand: 0,
};

function modelLevelSetup(
  originalPlane0,
  plane1,
  statinfo,
  starthitpoints,
  rndtable,
  objlistOffset,
  difficulty,
) {
  const plane0 = new Uint16Array(originalPlane0);
  const tilemap = new Uint8Array(WL6.MAPSIZE * WL6.MAPSIZE);
  const actorat = new Uint16Array(WL6.MAPSIZE * WL6.MAPSIZE);
  const doors = [];
  const statics = [];
  const players = [];
  const enemies = [];
  const rnd = createModelRnd(rndtable);
  let actorIndex = 1;
  let walls = 0;
  let floors = 0;
  let ambushMarkers = 0;
  let treasureTotal = 0;
  let killTotal = 0;
  let secretPushwalls = 0;

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      const tile = plane0[y * WL6.MAPSIZE + x];
      const cell = x * WL6.MAPSIZE + y;
      if (tile < 107) {
        tilemap[cell] = tile & 0xff;
        actorat[cell] = tile;
        walls++;
      } else {
        floors++;
      }
    }
  }

  function spawnBase(state, x, y) {
    const tictime = MODEL_INITIAL_STATE_TICTIME[state];
    if (tictime === undefined) {
      fail(`missing model tictime for ${state}`);
    }
    const enemy = {
      index: enemies.length,
      actor: objlistOffset + actorIndex * 60,
      active: 0,
      state,
      ticcount: tictime ? rnd() % tictime : 0,
      obclass: 0,
      flags: 0,
      distance: 0,
      dir: 8,
      xglobal: (x << 16) + 32768,
      yglobal: (y << 16) + 32768,
      tilex: x,
      tiley: y,
      areanumber: (plane0[y * WL6.MAPSIZE + x] - 107) & 0xff,
      hitpoints: 0,
      speed: 0,
    };
    actorIndex++;
    actorat[x * WL6.MAPSIZE + y] = enemy.actor;
    enemies.push(enemy);
    return enemy;
  }

  function hitpoints(which) {
    const value = starthitpoints[difficulty]?.[which];
    if (value === undefined) {
      fail(`missing hitpoints for difficulty ${difficulty} enemy ${which}`);
    }
    return value;
  }

  function addKill() {
    killTotal++;
  }

  function applyStandAmbush(enemy, x, y) {
    const index = y * WL6.MAPSIZE + x;
    if (plane0[index] !== 106) {
      return;
    }
    const cell = x * WL6.MAPSIZE + y;
    tilemap[cell] = 0;
    let tile = plane0[index];
    if (plane0[index + 1] >= 107) {
      tile = plane0[index + 1];
    }
    if (plane0[index - WL6.MAPSIZE] >= 107) {
      tile = plane0[index - WL6.MAPSIZE];
    }
    if (plane0[index + WL6.MAPSIZE] >= 107) {
      tile = plane0[index + WL6.MAPSIZE];
    }
    if (plane0[index - 1] >= 107) {
      tile = plane0[index - 1];
    }
    plane0[index] = tile;
    enemy.areanumber = (tile - 107) & 0xff;
    enemy.flags |= 64;
  }

  function spawnStand(which, state, x, y, dir) {
    const enemy = spawnBase(state, x, y);
    enemy.speed = 512;
    addKill();
    applyStandAmbush(enemy, x, y);
    enemy.obclass = 3 + which;
    enemy.hitpoints = hitpoints(which);
    enemy.dir = dir * 2;
    enemy.flags |= 1;
  }

  function spawnDeadGuard(x, y) {
    const enemy = spawnBase("_s_grddie4", x, y);
    enemy.obclass = 2;
  }

  function spawnPatrol(which, state, x, y, dir, speed = 512) {
    const enemy = spawnBase(state, x, y);
    enemy.speed = speed;
    addKill();
    enemy.obclass = 3 + which;
    enemy.dir = dir * 2;
    enemy.hitpoints = hitpoints(which);
    enemy.distance = 65536;
    enemy.flags |= 1;
    enemy.active = 1;
    actorat[x * WL6.MAPSIZE + y] = 0;
    const moved = patrolDestinationModel(x, y, dir);
    enemy.tilex = moved.x;
    enemy.tiley = moved.y;
    actorat[moved.x * WL6.MAPSIZE + moved.y] = enemy.actor;
  }

  function spawnBossLike(which, state, obclass, dir, x, y) {
    const enemy = spawnBase(state, x, y);
    enemy.speed = 512;
    enemy.obclass = obclass;
    enemy.hitpoints = hitpoints(which);
    enemy.dir = dir;
    enemy.flags |= 65;
    addKill();
  }

  function spawnGhost(which, state, x, y) {
    const enemy = spawnBase(state, x, y);
    enemy.obclass = 15;
    enemy.speed = 1500;
    enemy.dir = 0;
    enemy.flags |= 64;
    addKill();
  }

  function spawnEnemyTile(tile, x, y) {
    let dir = gatedDirectionModel(tile, 108, 144, 180, difficulty);
    if (dir !== null) {
      spawnStand(0, "_s_grdstand", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 112, 148, 184, difficulty);
    if (dir !== null) {
      spawnPatrol(0, "_s_grdpath1", x, y, dir);
      return;
    }
    if (tile === 124) {
      spawnDeadGuard(x, y);
      return;
    }
    dir = gatedDirectionModel(tile, 116, 152, 188, difficulty);
    if (dir !== null) {
      spawnStand(1, "_s_ofcstand", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 120, 156, 192, difficulty);
    if (dir !== null) {
      spawnPatrol(1, "_s_ofcpath1", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 126, 162, 198, difficulty);
    if (dir !== null) {
      spawnStand(2, "_s_ssstand", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 130, 166, 202, difficulty);
    if (dir !== null) {
      spawnPatrol(2, "_s_sspath1", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 134, 170, 206, difficulty);
    if (dir !== null) {
      fail("WL6 data used a standing dog tile, but SpawnStand has no en_dog case");
    }
    dir = gatedDirectionModel(tile, 138, 174, 210, difficulty);
    if (dir !== null) {
      spawnPatrol(3, "_s_dogpath1", x, y, dir, 1500);
      return;
    }
    switch (tile) {
      case 214:
        spawnBossLike(4, "_s_bossstand", 7, 6, x, y);
        return;
      case 197:
        spawnBossLike(13, "_s_gretelstand", 17, 2, x, y);
        return;
      case 215:
        spawnBossLike(14, "_s_giftstand", 18, 2, x, y);
        return;
      case 179:
        spawnBossLike(15, "_s_fatstand", 19, 6, x, y);
        return;
      case 196:
        spawnBossLike(5, "_s_schabbstand", 8, 6, x, y);
        return;
      case 160:
        spawnBossLike(6, "_s_fakestand", 9, 2, x, y);
        return;
      case 178:
        spawnBossLike(7, "_s_mechastand", 10, 6, x, y);
        return;
    }
    dir = gatedDirectionModel(tile, 216, 234, 252, difficulty);
    if (dir !== null) {
      spawnStand(8, "_s_mutstand", x, y, dir);
      return;
    }
    dir = gatedDirectionModel(tile, 220, 238, 256, difficulty);
    if (dir !== null) {
      spawnPatrol(8, "_s_mutpath1", x, y, dir);
      return;
    }
    switch (tile) {
      case 224:
        spawnGhost(9, "_s_blinkychase1", x, y);
        return;
      case 225:
        spawnGhost(10, "_s_clydechase1", x, y);
        return;
      case 226:
        spawnGhost(11, "_s_pinkychase1", x, y);
        return;
      case 227:
        spawnGhost(12, "_s_inkychase1", x, y);
        return;
    }
  }

  for (const tile of plane1) {
    if (tile === 98) {
      secretPushwalls++;
    }
  }

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      const tile = plane1[y * WL6.MAPSIZE + x];
      if (tile < 19 || tile > 22) {
        continue;
      }
      const dir = tile - 19;
      let angle = (1 - dir) * 90;
      if (angle < 0) {
        angle += 360;
      }
      players.push({
        x,
        y,
        dir,
        angle,
        // SpawnPlayer stores areanumber = floortile - AREATILE (107), like SpawnStand/etc.
        areanumber: (plane0[y * WL6.MAPSIZE + x] - 107) & 0xff,
        xglobal: (x << 16) + 32768,
        yglobal: (y << 16) + 32768,
      });
    }
  }

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      const tile = plane1[y * WL6.MAPSIZE + x];
      if (tile < 23 || tile > 74) {
        continue;
      }
      const type = tile - 23;
      const entry = statinfo[type];
      if (!entry) {
        fail(`missing WL6 statinfo entry for static type ${type}`);
      }
      const [picnum, itemType] = entry;
      const stat = {
        index: statics.length,
        x,
        y,
        type,
        picnum,
        itemType,
        flags: 0,
        itemnumber: 0,
      };

      if (itemType === 1) {
        actorat[x * WL6.MAPSIZE + y] = 1;
        stat.flags = 0;
      } else if ([9, 10, 11, 12, 18].includes(itemType)) {
        treasureTotal++;
        stat.flags = 2;
        stat.itemnumber = itemType;
      } else if ([2, 3, 4, 5, 6, 13, 14, 15, 16, 17].includes(itemType)) {
        stat.flags = 2;
        stat.itemnumber = itemType;
      }

      statics.push(stat);
    }
  }

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      const index = y * WL6.MAPSIZE + x;
      const tile = plane0[index];
      if (tile < 90 || tile > 101) {
        continue;
      }
      const doorIndex = doors.length;
      const cell = x * WL6.MAPSIZE + y;
      const doorValue = doorIndex | 0x80;
      actorat[cell] = doorValue;
      tilemap[cell] = doorValue;
      if ((tile & 1) === 0) {
        plane0[index] = plane0[index - 1];
        tilemap[x * WL6.MAPSIZE + (y - 1)] |= 0x40;
        tilemap[x * WL6.MAPSIZE + (y + 1)] |= 0x40;
        doors.push({ index: doorIndex, x, y, vertical: true, lock: (tile - 90) / 2 });
      } else {
        plane0[index] = plane0[index - WL6.MAPSIZE];
        tilemap[(x - 1) * WL6.MAPSIZE + y] |= 0x40;
        tilemap[(x + 1) * WL6.MAPSIZE + y] |= 0x40;
        doors.push({ index: doorIndex, x, y, vertical: false, lock: (tile - 91) / 2 });
      }
    }
  }

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      spawnEnemyTile(plane1[y * WL6.MAPSIZE + x], x, y);
    }
  }

  for (let y = 0; y < WL6.MAPSIZE; y++) {
    for (let x = 0; x < WL6.MAPSIZE; x++) {
      const index = y * WL6.MAPSIZE + x;
      let tile = plane0[index];
      if (tile !== 106) {
        continue;
      }
      const cell = x * WL6.MAPSIZE + y;
      ambushMarkers++;
      tilemap[cell] = 0;
      if (actorat[cell] === 106) {
        actorat[cell] = 0;
      }
      if (plane0[index + 1] >= 107) {
        tile = plane0[index + 1];
      }
      if (plane0[index - WL6.MAPSIZE] >= 107) {
        tile = plane0[index - WL6.MAPSIZE];
      }
      if (plane0[index + WL6.MAPSIZE] >= 107) {
        tile = plane0[index + WL6.MAPSIZE];
      }
      if (plane0[index - 1] >= 107) {
        tile = plane0[index - 1];
      }
      plane0[index] = tile;
    }
  }

  return {
    plane0,
    tilemap,
    actorat,
    doors,
    statics,
    players,
    enemies,
    walls,
    floors,
    ambushMarkers,
    treasureTotal,
    killTotal,
    secretPushwalls,
  };
}

function createModelRnd(rndtable) {
  let rndindex = 0;
  return () => {
    rndindex = (rndindex + 1) & 0xff;
    return rndtable[rndindex];
  };
}

function patrolDestinationModel(x, y, dir) {
  switch (dir) {
    case 0:
      return { x: x + 1, y };
    case 1:
      return { x, y: y - 1 };
    case 2:
      return { x: x - 1, y };
    case 3:
      return { x, y: y + 1 };
    default:
      fail(`invalid model patrol dir ${dir}`);
  }
}

function gatedDirectionModel(tile, baseTile, mediumTile, hardTile, difficulty) {
  if (tile >= hardTile && tile <= hardTile + 3) {
    return difficulty < 3 ? null : tile - hardTile;
  }
  if (tile >= mediumTile && tile <= mediumTile + 3) {
    return difficulty < 2 ? null : tile - mediumTile;
  }
  if (tile >= baseTile && tile <= baseTile + 3) {
    return tile - baseTile;
  }
  return null;
}

function wordEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

async function checkRuntimeDemoParsing(mod) {
  const [vgaHead, vgaGraph, vgaDict] = await Promise.all(
    ["VGAHEAD.WL6", "VGAGRAPH.WL6", "VGADICT.WL6"].map(async (name) =>
      new Uint8Array(await readFile(path.join(wl6Dir, name))),
    ),
  );

  return [139, 140, 141, 142].map((chunk) => {
    const bytes = loadGraphicChunk(chunk, vgaHead, vgaGraph, vgaDict);
    if (!bytes) {
      fail(`demo chunk ${chunk} did not decode`);
    }
    const demo = mod.parseDemo(bytes);
    const roundTrip = mod.serializeDemo(demo);
    const originalPayload = bytes.subarray(0, demo.length);
    if (!byteEqual(roundTrip, originalPayload)) {
      fail(`demo chunk ${chunk} did not round-trip through TS_DEMO`);
    }
    return {
      chunk,
      mapon: demo.mapon,
      length: demo.length,
      commands: demo.commands.length,
    };
  });
}

async function checkRuntimeDemoPlayback(mod) {
  const [mapHead, gameMaps, vgaHead, vgaGraph, vgaDict, audioHed, audioT] = await Promise.all(
    ["MAPHEAD.WL6", "GAMEMAPS.WL6", "VGAHEAD.WL6", "VGAGRAPH.WL6", "VGADICT.WL6", "AUDIOHED.WL6", "AUDIOT.WL6"].map(
      async (name) => new Uint8Array(await readFile(path.join(wl6Dir, name))),
    ),
  );
  const { rlewtag, headers } = readMapHeaders(mapHead, gameMaps);
  const traces = [];

  for (const chunk of [139, 140, 141, 142]) {
    const demoBytes = loadGraphicChunk(chunk, vgaHead, vgaGraph, vgaDict);
    if (!demoBytes) {
      fail(`demo chunk ${chunk} did not decode for playback`);
    }
    const demo = mod.parseDemo(demoBytes);
    const header = headers[demo.mapon];
    if (!header) {
      fail(`demo map ${demo.mapon} is sparse`);
    }
    const [plane0, plane1] = loadMapPlanes(header, gameMaps, rlewtag);
    const dgroup = new mod.DOSMemory(0x10000);
    const areaconnect = new Uint8Array(37 * 37);
    mod.US_InitRndT(false);
    mod.WL_MAIN_BuildTables();
    mod.WL_MAIN_SetupWalls();
    // The oracle plays demos at the CONFIG.WL6 viewsize (19) with AdLib sound (DOSBox
    // emulates the OPL chip, so SD_Default selects sdm_AdLib). Both feed demo determinism:
    // viewsize sets pixelangle/FL_VISABLE, and the AdLib chaingun length gates UpdateFace's
    // US_RndT skip. Replaying at viewsize 15 / sdm_PC desyncs demo 140.
    mod.WL_MAIN_NewViewSize(19);
    mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_AdLib });
    mod.ID_CA_CA_LoadAllSounds(audioHed, audioT);
    const summary = mod.WL_GAME_PlayDemoTrace(
      demoBytes,
      new Uint16Array(plane0),
      new Uint16Array(plane1),
      dgroup,
      {
        areaconnect,
      },
    );

    // Per the Borland/DOSBox per-tic oracle (apps/source-modified-dos / tmp/oracle-build),
    // ALL FOUR embedded WL6 demos end in ex_died (playstate 2), not ex_completed (1):
    // the recorded player runs every command and dies on the final tic (PollControls sets
    // ex_completed, then the last tic's enemy fire kills the low-HP player -> ex_died).
    // Oracle end states: 139 tc2764, 140 tc7596, 141 tc4560, 142 tc6624. With viewsize 19
    // + AdLib sound (the oracle's real settings) all four are now bit-exact, including
    // demo 140. The committed-fixture per-tic comparison lives in
    // `npm run check:demo-traces` (oracle/compare-demo-traces.mjs); this gate asserts the
    // weaker end-state (runs every command, dies, correct timeCount).
    if (
      summary.mapon !== demo.mapon ||
      summary.difficulty !== 3 ||
      summary.commands !== demo.commands.length ||
      summary.commandsRun !== demo.commands.length ||
      !summary.completed ||
      summary.playstate !== 2 ||
      summary.timeCount !== demo.commands.length * 4 ||
      summary.setup.players !== 1 ||
      summary.setup.enemies <= 0 ||
      summary.trace.length !== demo.commands.length
    ) {
      fail(`WL_GAME_PlayDemoTrace did not run embedded demo ${chunk} to completion: ${JSON.stringify({
        chunk,
        mapon: summary.mapon,
        commands: summary.commands,
        commandsRun: summary.commandsRun,
        completed: summary.completed,
        playstate: summary.playstate,
        timeCount: summary.timeCount,
        players: summary.setup.players,
        enemies: summary.setup.enemies,
        trace: summary.trace.length,
      })}`);
    }

    traces.push({
      chunk,
      mapon: summary.mapon,
      commands: summary.commands,
      commandsRun: summary.commandsRun,
      timeCount: summary.timeCount,
      enemies: summary.setup.enemies,
      dgroupChecksum: summary.dgroupChecksum,
      traceChecksum: summary.traceChecksum,
      traceSha256: sha256(Buffer.from(demoTraceLines(summary.trace), "ascii")),
      first: demoTracePoint(summary.trace[0]),
      last: demoTracePoint(summary.trace.at(-1)),
    });
  }

  // A demo can finish with a sound still "playing" (e.g. SoundNumber == GETGATLINGSND).
  // Reset the SD module so this leftover state does not leak into later runtime sub-checks
  // (UpdateFace skips its US_RndT when the gatling sound is playing) — matches the real
  // game stopping sound when a demo ends.
  mod.ID_SD_SD_ResetSoundState();

  return {
    demos: traces,
    aggregateSha256: sha256(Buffer.from(traces.map((trace) => `${trace.chunk}:${trace.traceSha256}`).join("\n"), "ascii")),
  };
}

function demoTracePoint(sample) {
  return {
    commandIndex: sample.commandIndex,
    timeCount: sample.timeCount,
    playstate: sample.playstate,
    dgroupChecksum: sample.dgroupChecksum,
    playerTile: [sample.playerTilex, sample.playerTiley],
    playerAngle: sample.playerAngle,
    health: sample.health,
    ammo: sample.ammo,
    actorCount: sample.actorCount,
  };
}

function demoTraceLines(trace) {
  return trace.map((sample) => [
    sample.commandIndex,
    sample.byteOffset,
    sample.buttonbits,
    sample.controlx,
    sample.controly,
    sample.timeCount,
    sample.playstate,
    sample.dgroupChecksum,
    sample.playerTilex,
    sample.playerTiley,
    sample.playerAngle,
    sample.health,
    sample.ammo,
    sample.score,
    sample.actorCount,
  ].join(",")).join("\n");
}

function byteEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function fillPattern(bytes, offset, length, seed) {
  for (let i = 0; i < length; i++) {
    bytes[offset + i] = (seed + i * 17) & 0xff;
  }
}

async function checkAssets() {
  const [
    wolf3dExe,
    mapHead,
    gameMaps,
    vgaHead,
    vgaGraph,
    vgaDict,
    audioHead,
    audioT,
    vswapBytes,
  ] = await Promise.all(
    [
      "wolf3d.exe",
      "MAPHEAD.WL6",
      "GAMEMAPS.WL6",
      "VGAHEAD.WL6",
      "VGAGRAPH.WL6",
      "VGADICT.WL6",
      "AUDIOHED.WL6",
      "AUDIOT.WL6",
      "VSWAP.WL6",
    ].map(async (name) => new Uint8Array(await readFile(path.join(wl6Dir, name)))),
  );

  const exeSha = sha256(wolf3dExe);
  if (exeSha !== EXPECTED_WOLF3D_EXE_SHA256) {
    fail(`locked wolf3d.exe sha256 mismatch: ${exeSha}`);
  }

  const { rlewtag, headers } = readMapHeaders(mapHead, gameMaps);
  if (rlewtag !== 0xabcd) {
    fail(`unexpected RLEW tag ${rlewtag.toString(16)}`);
  }
  const mapParts = [];
  const mapNames = [];
  for (const header of headers) {
    if (!header) {
      continue;
    }
    if (header.width !== WL6.MAPSIZE || header.height !== WL6.MAPSIZE) {
      fail(`unexpected map size for ${header.name}: ${header.width}x${header.height}`);
    }
    mapNames.push(header.name);
    for (const plane of loadMapPlanes(header, gameMaps, rlewtag)) {
      if (plane.length !== WL6.MAPSIZE * WL6.MAPSIZE) {
        fail(`unexpected plane length for ${header.name}`);
      }
      mapParts.push(wordsToBytes(plane));
    }
  }
  const mapAggregateSha256 = sha256Many(mapParts);
  const mapNamesSha256 = sha256(Buffer.from(mapNames.join("\n"), "ascii"));

  const demoChunks = [139, 140, 141, 142].map((chunk) =>
    loadGraphicChunk(chunk, vgaHead, vgaGraph, vgaDict),
  );
  const demoSha256 = demoChunks.map((chunk, index) => {
    if (!chunk || chunk.length === 0) {
      fail(`demo chunk ${index} did not decode`);
    }
    return sha256(chunk);
  });

  const audioChunks = readAudioChunks(audioHead, audioT);
  const audioDirectorySha256 = sha256Many(audioChunks);

  const vswap = readVswap(vswapBytes);
  if (vswap.chunksInFile !== 663 || vswap.spriteStart !== 106 || vswap.soundStart !== 542) {
    fail(
      `unexpected VSWAP header ${vswap.chunksInFile}/${vswap.spriteStart}/${vswap.soundStart}`,
    );
  }
  const vswapDirectorySha256 = sha256(
    Buffer.from(
      JSON.stringify({
        chunksInFile: vswap.chunksInFile,
        spriteStart: vswap.spriteStart,
        soundStart: vswap.soundStart,
        pageOffsets: vswap.pageOffsets,
        pageLengths: vswap.pageLengths,
      }),
    ),
  );
  const vswapDataSha256 = sha256Many(vswap.chunks.filter(Boolean));

  const actual = {
    mapAggregateSha256,
    mapNamesSha256,
    demoSha256,
    audioDirectorySha256,
    vswapDirectorySha256,
    vswapDataSha256,
  };

  if (EXPECTED.mapAggregateSha256) {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const value = actual[key];
      if (Array.isArray(expected)) {
        expected.forEach((hash, index) => {
          if (hash && value[index] !== hash) {
            fail(`${key}[${index}] mismatch: ${value[index]}`);
          }
        });
      } else if (expected && value !== expected) {
        fail(`${key} mismatch: ${value}`);
      }
    }
  }

  return {
    maps: headers.filter(Boolean).length,
    mapAggregateSha256,
    mapNamesSha256,
    demoSha256,
    audioChunks: audioChunks.length,
    audioDirectorySha256,
    vswapDirectorySha256,
    vswapDataSha256,
  };
}

async function checkDgroupLayout() {
  const [layoutText, layoutTs] = await Promise.all([
    readFile(dgroupLayoutPath, "utf8"),
    readFile(dgroupLayoutTsPath, "utf8"),
  ]);
  const layout = JSON.parse(layoutText);

  if (layout.generatedAt !== "not-recorded-for-reproducible-output") {
    fail("dgroup layout fixture is not deterministic; run npm run generate:dgroup-layout");
  }
  if (layout.sourceMap.sha256 !== EXPECTED_DGROUP_LAYOUT.sourceMapSha256) {
    fail(`dgroup layout MAP hash mismatch: ${layout.sourceMap.sha256}`);
  }
  if (layout.retailExe.sha256 !== EXPECTED_WOLF3D_EXE_SHA256) {
    fail(`dgroup layout retail EXE hash mismatch: ${layout.retailExe.sha256}`);
  }
  if (layout.retailExe.decompressedBytes !== EXPECTED_DGROUP_LAYOUT.retailDecompressedBytes) {
    fail(`retail decompressed size mismatch: ${layout.retailExe.decompressedBytes}`);
  }
  if (layout.dgroup.segment !== EXPECTED_DGROUP_LAYOUT.dgroupSegment) {
    fail(`DGROUP segment mismatch: ${layout.dgroup.segment}`);
  }
  if (layout.statetypeSymbols.length !== EXPECTED_DGROUP_LAYOUT.statetypeSymbols) {
    fail(`statetype symbol count mismatch: ${layout.statetypeSymbols.length}`);
  }
  for (const [symbol, offset] of Object.entries(EXPECTED_DGROUP_LAYOUT.saveOffsets)) {
    if (layout.saveCriticalSymbols[symbol]?.nearOffset !== offset) {
      fail(`${symbol} offset mismatch: ${layout.saveCriticalSymbols[symbol]?.nearOffset}`);
    }
  }
  for (const [symbol, offset] of Object.entries(EXPECTED_DGROUP_LAYOUT.runtimeOffsets)) {
    if (layout.runtimeSymbols[symbol]?.nearOffset !== offset) {
      fail(`${symbol} runtime offset mismatch: ${layout.runtimeSymbols[symbol]?.nearOffset}`);
    }
  }

  const structSizes = {
    statetype: 16,
    statobj_t: 8,
    doorobj_t: 10,
    objtype: 60,
    gametype: 66,
    LRstruct: 10,
  };
  for (const [name, bytes] of Object.entries(structSizes)) {
    if (layout.structLayouts[name]?.bytes !== bytes) {
      fail(`${name} size mismatch: ${layout.structLayouts[name]?.bytes}`);
    }
  }

  const checksumExcluded = new Set(
    layout.saveRecords.filter((record) => !record.checksum).map((record) => record.name),
  );
  for (const name of ["areaconnect", "areabyplayer", "objlistRecords", "checksum"]) {
    if (!checksumExcluded.has(name)) {
      fail(`${name} should be excluded from SaveTheGame checksum coverage`);
    }
  }
  for (const name of ["gamestate", "LevelRatios", "tilemap", "actorat", "statobjlist", "doorposition", "doorobjlist"]) {
    const record = layout.saveRecords.find((entry) => entry.name === name);
    if (!record?.checksum) {
      fail(`${name} should be included in SaveTheGame checksum coverage`);
    }
  }
  if (!layout.statetypeSymbols.some((symbol) => symbol.name === "_s_player" && symbol.nearOffset === "0x190C")) {
    fail("missing _s_player statetype offset");
  }
  if (!layoutTs.includes('"status": "rebuild-map-derived; retail EXE is locked and decompressed')) {
    fail("generated TS layout fixture is missing expected layout payload");
  }

  return {
    sourceMapSha256: layout.sourceMap.sha256,
    retailDecompressedBytes: layout.retailExe.decompressedBytes,
    dgroupSegment: layout.dgroup.segment,
    statetypeSymbols: layout.statetypeSymbols.length,
    saveRecords: layout.saveRecords.length,
  };
}

const mirror = await checkMirror();
const portHelpers = await checkPortHelpers();
const assets = await checkAssets();
const dgroupLayout = await checkDgroupLayout();

console.log(
  JSON.stringify(
    {
      mirror,
      portHelpers,
      assets,
      dgroupLayout,
    },
    null,
    2,
  ),
);
