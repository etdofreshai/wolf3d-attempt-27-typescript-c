import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const traceOptions = {
  ...(process.env.WOLF3D_PROBE_GATLING_FACE ? { gatlingSoundPlaying: true } : {}),
  ...(process.env.WOLF3D_PROBE_LIGHT_VISIBILITY ? { refreshVisibility: false, projectActorVisibility: true } : {}),
  ...(process.env.WOLF3D_PROBE_NO_VISIBILITY ? { refreshVisibility: false, projectActorVisibility: false } : {}),
};

const WL6 = {
  MAPPLANES: 2,
  MAPSIZE: 64,
  NUMMAPS: 60,
  NUMCHUNKS: 149,
  STARTTILE8: 135,
  STARTTILE8M: 136,
  STARTTILE16: 136,
  STARTTILE16M: 136,
  STARTTILE32: 136,
  STARTTILE32M: 136,
  STARTEXTERNS: 136,
  NUMTILE8: 72,
  NUMTILE8M: 0,
};

function moduleSpecifier(fromDir, filePath) {
  let specifier = path.relative(fromDir, filePath).replaceAll("\\", "/");
  if (!specifier.startsWith(".")) {
    specifier = `./${specifier}`;
  }
  return specifier;
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

async function loadRuntime() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf3d-demo139-probe-"));
  const entryPath = path.join(tempDir, "entry.ts");
  const outPath = path.join(tempDir, "entry.mjs");
  await writeFile(
    entryPath,
    [
      `export { DOSMemory } from "${moduleSpecifier(tempDir, path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
      `export { US_InitRndT, rndindex } from "${moduleSpecifier(tempDir, path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
      `export { parseDemo } from "${moduleSpecifier(tempDir, path.join(targetDir, "TS_DEMO.ts"))}";`,
      `export { nearOffsetForRuntimeSymbol, STATETYPE_SYMBOLS, STRUCT_LAYOUTS } from "${moduleSpecifier(tempDir, path.join(targetDir, "TS_SAVE_LAYOUT.ts"))}";`,
      `export { BuildTables as WL_MAIN_BuildTables, NewViewSize as WL_MAIN_NewViewSize, SetupWalls as WL_MAIN_SetupWalls } from "${moduleSpecifier(tempDir, path.join(targetDir, "WL_MAIN.C.ts"))}";`,
      `export { CA_LoadAllSounds as ID_CA_CA_LoadAllSounds } from "${moduleSpecifier(tempDir, path.join(targetDir, "ID_CA.C.ts"))}";`,
      `export { SD_ResetSoundState as ID_SD_SD_ResetSoundState, SD_SetSoundMode as ID_SD_SD_SetSoundMode } from "${moduleSpecifier(tempDir, path.join(targetDir, "ID_SD.C.ts"))}";`,
      `export { sdm_PC as ID_SD_sdm_PC } from "${moduleSpecifier(tempDir, path.join(targetDir, "ID_SD.H.ts"))}";`,
      `export { PlayDemoTrace as WL_GAME_PlayDemoTrace } from "${moduleSpecifier(tempDir, path.join(targetDir, "WL_GAME.C.ts"))}";`,
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
  const mod = await import(`${pathToFileURL(outPath).href}?cache=${Date.now()}`);
  return { mod, cleanup: () => rm(tempDir, { recursive: true, force: true }) };
}

function compactSample(sample, previous) {
  const eventful =
    sample.shotActions.length > 0 ||
    sample.damageActions.length > 0 ||
    sample.playerAttacks.length > 0;
  const healthChanged = previous && sample.health !== previous.health;
  const ammoChanged = previous && sample.ammo !== previous.ammo;
  const scoreChanged = previous && sample.score !== previous.score;
  const weaponChanged = previous && (
    sample.weapon !== previous.weapon ||
    sample.chosenweapon !== previous.chosenweapon
  );
  const soundChanged = previous && (
    sample.soundPlaying !== previous.soundPlaying ||
    sample.pcLengthLeft !== previous.pcLengthLeft
  );
  if (!eventful && !healthChanged && !ammoChanged && !scoreChanged && !weaponChanged && !soundChanged) {
    return null;
  }
  return {
    i: sample.commandIndex,
    tc: sample.timeCount,
    ps: sample.playstate,
    bits: sample.buttonbits,
    rnd: sample.rndindex,
    ctl: [sample.controlx, sample.controly],
    xy: [sample.playerTilex, sample.playerTiley],
    angle: sample.playerAngle,
    hp: sample.health,
    ammo: sample.ammo,
    weapon: sample.weapon,
    chosen: sample.chosenweapon,
    attack: [sample.attackframe, sample.attackcount, sample.weaponframe],
    face: [sample.faceframe, sample.facecount],
    sound: [sample.soundMode, sample.soundPlaying, sample.pcSoundActive ? 1 : 0, sample.pcLengthLeft, sample.soundPriority],
    score: sample.score,
    shots: sample.shotActions,
    attacks: sample.playerAttacks,
    damage: sample.damageActions,
  };
}

function fieldOffset(mod, structName, fieldName) {
  const field = mod.STRUCT_LAYOUTS[structName].fields.find((entry) => entry[0] === fieldName);
  if (!field) {
    throw new Error(`Missing ${structName}.${fieldName}`);
  }
  return field[1];
}

function stateNameFor(mod, stateOffset) {
  return mod.STATETYPE_SYMBOLS.find((entry) => {
    const offset = Number.parseInt(entry.nearOffset ?? entry.offset, 16);
    return offset === stateOffset;
  })?.name ?? `0x${stateOffset.toString(16)}`;
}

const ITEM_NAMES = new Map([
  [2, "bo_gibs"],
  [3, "bo_alpo"],
  [4, "bo_firstaid"],
  [5, "bo_key1"],
  [6, "bo_key2"],
  [7, "bo_key3"],
  [8, "bo_key4"],
  [9, "bo_cross"],
  [10, "bo_chalice"],
  [11, "bo_bible"],
  [12, "bo_crown"],
  [13, "bo_clip"],
  [14, "bo_clip2"],
  [15, "bo_machinegun"],
  [16, "bo_chaingun"],
  [17, "bo_food"],
  [18, "bo_fullheal"],
  [19, "bo_25clip"],
  [20, "bo_spear"],
]);

function dumpStatics(mod, dgroup, playerTile) {
  const statobjlist = mod.nearOffsetForRuntimeSymbol("_statobjlist");
  const laststatobj = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_laststatobj"));
  const size = mod.STRUCT_LAYOUTS.statobj_t.bytes;
  const offsets = {
    tilex: fieldOffset(mod, "statobj_t", "tilex"),
    tiley: fieldOffset(mod, "statobj_t", "tiley"),
    visspot: fieldOffset(mod, "statobj_t", "visspot"),
    shapenum: fieldOffset(mod, "statobj_t", "shapenum"),
    flags: fieldOffset(mod, "statobj_t", "flags"),
    itemnumber: fieldOffset(mod, "statobj_t", "itemnumber"),
  };
  const statics = [];
  for (let statobj = statobjlist; statobj < laststatobj; statobj += size) {
    const tilex = dgroup.u8(statobj + offsets.tilex);
    const tiley = dgroup.u8(statobj + offsets.tiley);
    const shapenum = dgroup.i16(statobj + offsets.shapenum);
    const flags = dgroup.u8(statobj + offsets.flags);
    const itemnumber = dgroup.u8(statobj + offsets.itemnumber);
    const nearPlayer = Math.abs(tilex - playerTile[0]) <= 4 && Math.abs(tiley - playerTile[1]) <= 4;
    const healthOrAmmo =
      itemnumber === 2 ||
      itemnumber === 3 ||
      itemnumber === 4 ||
      itemnumber === 13 ||
      itemnumber === 14 ||
      itemnumber === 17 ||
      itemnumber === 18 ||
      itemnumber === 19;
    if (!nearPlayer && !healthOrAmmo) {
      continue;
    }
    const visspot = dgroup.u16(statobj + offsets.visspot);
    statics.push({
      statobj,
      tile: [tilex, tiley],
      shapenum,
      removed: shapenum === -1,
      flags,
      bonus: (flags & 2) !== 0,
      itemnumber,
      item: ITEM_NAMES.get(itemnumber) ?? `item${itemnumber}`,
      visspot,
      visible: visspot ? dgroup.u8(visspot) !== 0 : false,
      nearPlayer,
    });
  }
  return statics;
}

function dumpActors(mod, dgroup) {
  const player = dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
  const areabyplayer = mod.nearOffsetForRuntimeSymbol("_areabyplayer");
  const offsets = {
    next: fieldOffset(mod, "objtype", "next"),
    state: fieldOffset(mod, "objtype", "state"),
    ticcount: fieldOffset(mod, "objtype", "ticcount"),
    tilex: fieldOffset(mod, "objtype", "tilex"),
    tiley: fieldOffset(mod, "objtype", "tiley"),
    x: fieldOffset(mod, "objtype", "x"),
    y: fieldOffset(mod, "objtype", "y"),
    dir: fieldOffset(mod, "objtype", "dir"),
    active: fieldOffset(mod, "objtype", "active"),
    flags: fieldOffset(mod, "objtype", "flags"),
    distance: fieldOffset(mod, "objtype", "distance"),
    obclass: fieldOffset(mod, "objtype", "obclass"),
    hitpoints: fieldOffset(mod, "objtype", "hitpoints"),
    areanumber: fieldOffset(mod, "objtype", "areanumber"),
    viewx: fieldOffset(mod, "objtype", "viewx"),
    transx: fieldOffset(mod, "objtype", "transx"),
  };
  const playerArea = dgroup.u8(player + offsets.areanumber);
  const playerStateOffset = dgroup.u16(player + offsets.state);
  const playerSummary = {
    actor: player,
    state: stateNameFor(mod, playerStateOffset),
    tic: dgroup.u16(player + offsets.ticcount),
    tile: [dgroup.u16(player + offsets.tilex), dgroup.u16(player + offsets.tiley)],
    pos: [dgroup.i32(player + offsets.x), dgroup.i32(player + offsets.y)],
    dir: dgroup.u16(player + offsets.dir),
    flags: dgroup.u8(player + offsets.flags),
    area: playerArea,
    viewx: dgroup.i16(player + offsets.viewx),
    transx: dgroup.i32(player + offsets.transx),
  };
  const actors = [];
  let actor = dgroup.u16(player + offsets.next);
  while (actor && actors.length < 150) {
    const stateOffset = dgroup.u16(actor + offsets.state);
    const area = dgroup.u8(actor + offsets.areanumber);
    const flags = dgroup.u8(actor + offsets.flags);
    const tilex = dgroup.u16(actor + offsets.tilex);
    const tiley = dgroup.u16(actor + offsets.tiley);
    const state = stateNameFor(mod, stateOffset);
    const active = dgroup.u16(actor + offsets.active);
    if (
      active ||
      state.includes("shoot") ||
      state.includes("pain") ||
      (flags & 0x04) !== 0 ||
      (tilex >= 8 && tilex <= 22 && tiley >= 8 && tiley <= 12)
    ) {
      actors.push({
        actor,
        class: dgroup.u16(actor + offsets.obclass),
        state,
        tic: dgroup.u16(actor + offsets.ticcount),
        tile: [tilex, tiley],
        pos: [dgroup.i32(actor + offsets.x), dgroup.i32(actor + offsets.y)],
        dir: dgroup.u16(actor + offsets.dir),
        active,
        flags,
        area,
        areaVisible: area < 37 ? dgroup.u16(areabyplayer + area * 2) !== 0 : false,
        hp: dgroup.i16(actor + offsets.hitpoints),
        distance: dgroup.i32(actor + offsets.distance),
        viewx: dgroup.i16(actor + offsets.viewx),
        transx: dgroup.i32(actor + offsets.transx),
      });
    }
    actor = dgroup.u16(actor + offsets.next);
  }
  return {
    player: playerSummary,
    playerArea,
    playerAreaVisible: playerArea < 37 ? dgroup.u16(areabyplayer + playerArea * 2) !== 0 : false,
    actors,
  };
}

const { mod, cleanup } = await loadRuntime();
try {
  const [mapHead, gameMaps, vgaHead, vgaGraph, vgaDict, audioHed, audioT] = await Promise.all(
    ["MAPHEAD.WL6", "GAMEMAPS.WL6", "VGAHEAD.WL6", "VGAGRAPH.WL6", "VGADICT.WL6", "AUDIOHED.WL6", "AUDIOT.WL6"].map(
      async (name) => new Uint8Array(await readFile(path.join(wl6Dir, name))),
    ),
  );
  const { rlewtag, headers } = readMapHeaders(mapHead, gameMaps);
  const demoBytes = loadGraphicChunk(139, vgaHead, vgaGraph, vgaDict);
  const demo = mod.parseDemo(demoBytes);
  const [plane0, plane1] = loadMapPlanes(headers[demo.mapon], gameMaps, rlewtag);
  mod.US_InitRndT(false);
  mod.WL_MAIN_BuildTables();
  mod.WL_MAIN_SetupWalls();
  mod.WL_MAIN_NewViewSize(15);

  const snapshotPoints = process.env.WOLF3D_PROBE_SNAPSHOTS === "0" ? [] : [
    65,
    104,
    116,
    140,
    188,
    203,
    212,
    480,
    500,
    510,
    519,
    530,
    540,
    550,
    560,
    570,
    587,
    592,
    593,
  ];
  for (const maxCommands of snapshotPoints) {
    const snapshotDgroup = new mod.DOSMemory(0x10000);
    mod.US_InitRndT(false);
    mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
    mod.ID_CA_CA_LoadAllSounds(audioHed, audioT);
    const snapshot = mod.WL_GAME_PlayDemoTrace(
      demoBytes,
      new Uint16Array(plane0),
      new Uint16Array(plane1),
      snapshotDgroup,
      {
        areaconnect: new Uint8Array(37 * 37),
        maxCommands,
        ...traceOptions,
      },
    );
    const last = snapshot.trace.at(-1);
    const playerTile = last ? [last.playerTilex, last.playerTiley] : [0, 0];
    console.log(JSON.stringify({
      snapshot: maxCommands,
      commandsRun: snapshot.commandsRun,
      playstate: snapshot.playstate,
      last: last && {
        i: last.commandIndex,
        hp: last.health,
        ammo: last.ammo,
        score: last.score,
        tile: [last.playerTilex, last.playerTiley],
        angle: last.playerAngle,
      },
      rndindex: mod.rndindex,
      actors: dumpActors(mod, snapshotDgroup),
      statics: dumpStatics(mod, snapshotDgroup, playerTile),
    }));
  }

  const dgroup = new mod.DOSMemory(0x10000);
  mod.US_InitRndT(false);
  mod.ID_SD_SD_ResetSoundState({ SoundMode: mod.ID_SD_sdm_PC });
  mod.ID_CA_CA_LoadAllSounds(audioHed, audioT);
  const summary = mod.WL_GAME_PlayDemoTrace(
    demoBytes,
    new Uint16Array(plane0),
    new Uint16Array(plane1),
    dgroup,
    {
      areaconnect: new Uint8Array(37 * 37),
      ...traceOptions,
    },
  );

  console.log(JSON.stringify({
    mapon: summary.mapon,
    commands: summary.commands,
    commandsRun: summary.commandsRun,
    playstate: summary.playstate,
    timeCount: summary.timeCount,
    traceChecksum: summary.traceChecksum,
  }));

  let previous = null;
  for (const sample of summary.trace) {
    const compact = compactSample(sample, previous);
    previous = sample;
    if (compact) {
      console.log(JSON.stringify(compact));
    }
  }
} finally {
  await cleanup();
}
