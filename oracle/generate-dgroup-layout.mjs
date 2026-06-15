import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unlzexe } from "./unlzexe.mjs";

const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const mapPath = path.join(repoRoot, "source", "WOLFSRC", "WOLF3D.MAP");
const retailExePath = path.join(repoRoot, "steam", "base", "wolf3d.exe");
const jsonOut = path.join(repoRoot, "oracle", "generated", "dgroup-layout.json");
const tsOut = path.join(
  repoRoot,
  "apps",
  "source-typescript",
  "src",
  "WOLFSRC",
  "TS_DGROUP_LAYOUT.ts",
);

const LOCKED_RETAIL_SHA256 =
  "48d9594649f330956e86ea1892bab76b2d83cfd4038e262ff8f3383ba945ec09";

const saveSymbols = [
  "_gamestate",
  "_LevelRatios",
  "_tilemap",
  "_actorat",
  "_areaconnect",
  "_areabyplayer",
  "_objlist",
  "_player",
  "_new",
  "_obj",
  "_lastobj",
  "_objfreelist",
  "_laststatobj",
  "_statobjlist",
  "_doorposition",
  "_doorobjlist",
  "_lastdoorobj",
  "_pwallstate",
  "_pwallx",
  "_pwally",
  "_pwalldir",
  "_pwallpos",
];

const runtimeSymbols = [
  ...new Set([
    ...saveSymbols,
    "_objcount",
    "_doornum",
    "_spotvis",
    "_playstate",
    "_killerobj",
    "_palshifted",
    "_bonuscount",
    "_damagecount",
    "_godmode",
    "_noclip",
    "_LastAttacker",
    "_mapwidth",
    "_mapheight",
    "_tics",
    "_thrustspeed",
    "_anglefrac",
    "_playerxmove",
    "_playerymove",
    "_buttonstate",
    "_buttonheld",
    "_controlx",
    "_controly",
    "_madenoise",
    "_plux",
    "_pluy",
    "_centerx",
    "_shootdelta",
    "_facecount",
    "_gotgatgun",
  ]),
];

const saveRecordSpecs = [
  { name: "gamestate", symbol: "_gamestate", bytes: 66, checksum: true, source: "WL_MAIN.C SaveTheGame" },
  { name: "LevelRatios", symbol: "_LevelRatios", bytes: 80, checksum: true, source: "LRstruct[8]" },
  { name: "tilemap", symbol: "_tilemap", bytes: 64 * 64, checksum: true, source: "byte[64][64]" },
  { name: "actorat", symbol: "_actorat", bytes: 64 * 64 * 2, checksum: true, source: "near pointer[64][64]" },
  { name: "areaconnect", symbol: "_areaconnect", bytes: 37 * 37, checksum: false, source: "byte far[37][37]" },
  { name: "areabyplayer", symbol: "_areabyplayer", bytes: 37 * 2, checksum: false, source: "boolean[37]" },
  { name: "objlistRecords", symbol: "_objlist", bytes: "dynamic:activeActors*60 + nullobj(60)", checksum: false, source: "objtype linked list" },
  { name: "laststatobj", symbol: "_laststatobj", bytes: 2, checksum: true, source: "near pointer" },
  { name: "statobjlist", symbol: "_statobjlist", bytes: 400 * 8, checksum: true, source: "statobj_t[400]" },
  { name: "doorposition", symbol: "_doorposition", bytes: 64 * 2, checksum: true, source: "unsigned[64]" },
  { name: "doorobjlist", symbol: "_doorobjlist", bytes: 64 * 10, checksum: true, source: "doorobj_t[64]" },
  { name: "pwallstate", symbol: "_pwallstate", bytes: 2, checksum: true, source: "unsigned" },
  { name: "pwallx", symbol: "_pwallx", bytes: 2, checksum: true, source: "unsigned" },
  { name: "pwally", symbol: "_pwally", bytes: 2, checksum: true, source: "unsigned" },
  { name: "pwalldir", symbol: "_pwalldir", bytes: 2, checksum: true, source: "int" },
  { name: "pwallpos", symbol: "_pwallpos", bytes: 2, checksum: true, source: "unsigned" },
  { name: "checksum", symbol: null, bytes: 4, checksum: false, source: "trailing long" },
];

const structSpecs = {
  statetype: {
    bytes: 16,
    fields: [
      ["rotate", 0, 2, "boolean enum"],
      ["shapenum", 2, 2, "int"],
      ["tictime", 4, 2, "int"],
      ["think", 6, 4, "medium-model code pointer"],
      ["action", 10, 4, "medium-model code pointer"],
      ["next", 14, 2, "near data pointer"],
    ],
  },
  statobj_t: {
    bytes: 8,
    fields: [
      ["tilex", 0, 1, "byte"],
      ["tiley", 1, 1, "byte"],
      ["visspot", 2, 2, "near byte pointer"],
      ["shapenum", 4, 2, "int"],
      ["flags", 6, 1, "byte"],
      ["itemnumber", 7, 1, "byte"],
    ],
  },
  doorobj_t: {
    bytes: 10,
    fields: [
      ["tilex", 0, 1, "byte"],
      ["tiley", 1, 1, "byte"],
      ["vertical", 2, 2, "boolean enum"],
      ["lock", 4, 1, "byte"],
      ["padding", 5, 1, "word alignment"],
      ["action", 6, 2, "enum"],
      ["ticcount", 8, 2, "int"],
    ],
  },
  objtype: {
    bytes: 60,
    fields: [
      ["active", 0, 2, "activetype enum"],
      ["ticcount", 2, 2, "int"],
      ["obclass", 4, 2, "classtype enum"],
      ["state", 6, 2, "near statetype pointer"],
      ["flags", 8, 1, "byte"],
      ["padding", 9, 1, "word alignment"],
      ["distance", 10, 4, "long"],
      ["dir", 14, 2, "dirtype enum"],
      ["x", 16, 4, "fixed long"],
      ["y", 20, 4, "fixed long"],
      ["tilex", 24, 2, "unsigned"],
      ["tiley", 26, 2, "unsigned"],
      ["areanumber", 28, 1, "byte"],
      ["padding", 29, 1, "word alignment"],
      ["viewx", 30, 2, "int"],
      ["viewheight", 32, 2, "unsigned"],
      ["transx", 34, 4, "fixed long"],
      ["transy", 38, 4, "fixed long"],
      ["angle", 42, 2, "int"],
      ["hitpoints", 44, 2, "int"],
      ["speed", 46, 4, "long"],
      ["temp1", 50, 2, "int"],
      ["temp2", 52, 2, "int"],
      ["temp3", 54, 2, "int"],
      ["next", 56, 2, "near objstruct pointer"],
      ["prev", 58, 2, "near objstruct pointer"],
    ],
  },
  gametype: {
    bytes: 66,
    fields: [
      ["difficulty", 0, 2, "int"],
      ["mapon", 2, 2, "int"],
      ["oldscore", 4, 4, "long"],
      ["score", 8, 4, "long"],
      ["nextextra", 12, 4, "long"],
      ["lives", 16, 2, "int"],
      ["health", 18, 2, "int"],
      ["ammo", 20, 2, "int"],
      ["keys", 22, 2, "int"],
      ["bestweapon", 24, 2, "weapontype enum"],
      ["weapon", 26, 2, "weapontype enum"],
      ["chosenweapon", 28, 2, "weapontype enum"],
      ["faceframe", 30, 2, "int"],
      ["attackframe", 32, 2, "int"],
      ["attackcount", 34, 2, "int"],
      ["weaponframe", 36, 2, "int"],
      ["episode", 38, 2, "int"],
      ["secretcount", 40, 2, "int"],
      ["treasurecount", 42, 2, "int"],
      ["killcount", 44, 2, "int"],
      ["secrettotal", 46, 2, "int"],
      ["treasuretotal", 48, 2, "int"],
      ["killtotal", 50, 2, "int"],
      ["TimeCount", 52, 4, "long"],
      ["killx", 56, 4, "long"],
      ["killy", 60, 4, "long"],
      ["victoryflag", 64, 2, "boolean enum"],
    ],
  },
  LRstruct: {
    bytes: 10,
    fields: [
      ["kill", 0, 2, "int"],
      ["secret", 2, 2, "int"],
      ["treasure", 4, 2, "int"],
      ["time", 6, 4, "long"],
    ],
  },
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hex(value, width = 4) {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`;
}

function parseHex(value) {
  return Number.parseInt(value, 16);
}

function parseMap(mapText) {
  const segments = [];
  const publics = new Map();
  let inSegmentSummary = true;

  for (const line of mapText.split(/\r?\n/)) {
    if (line.includes("Detailed map of segments")) {
      inSegmentSummary = false;
    }

    if (inSegmentSummary) {
      const segment = line.match(
        /^\s*([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+(\S+)\s+(\S+)/,
      );
      if (segment) {
        segments.push({
          start: parseHex(segment[1]),
          stop: parseHex(segment[2]),
          length: parseHex(segment[3]),
          name: segment[4],
          className: segment[5],
        });
      }
    }

    const pub = line.match(/^\s*([0-9A-F]{4}):([0-9A-F]{4})\s+(?:idle\s+)?([_A-Za-z@][^\s]*)/);
    if (pub) {
      const symbol = pub[3];
      if (!publics.has(symbol)) {
        const segment = parseHex(pub[1]);
        const offset = parseHex(pub[2]);
        publics.set(symbol, {
          name: symbol,
          segment: hex(segment),
          offset: hex(offset),
          segmentValue: segment,
          offsetValue: offset,
          linear: segment * 16 + offset,
        });
      }
    }
  }

  return { segments, publics };
}

function requiredPublic(publics, symbol) {
  const value = publics.get(symbol);
  if (!value) {
    throw new Error(`Missing public symbol ${symbol} in WOLF3D.MAP`);
  }
  return value;
}

function symbolForOutput(symbol) {
  return {
    name: symbol.name,
    segment: symbol.segment,
    offset: symbol.offset,
    linear: hex(symbol.linear, 5),
    nearOffset: symbol.offset,
  };
}

const mapBytes = await readFile(mapPath);
const retailExe = await readFile(retailExePath);
const retailSha = sha256(retailExe);
if (retailSha !== LOCKED_RETAIL_SHA256) {
  throw new Error(`Locked retail EXE hash mismatch: ${retailSha}`);
}

const retailImage = unlzexe(retailExe);
const mapText = mapBytes.toString("utf8");
const { segments, publics } = parseMap(mapText);
const dgroup = requiredPublic(publics, "DATASEG@");
const dgroupSegments = segments.filter((segment) =>
  ["DATA", "CONST", "INITDATA", "EXITDATA", "BSS", "BSSEND"].includes(segment.className),
);
const farBssSegments = segments.filter((segment) => segment.className === "FAR_BSS");
const statetypeSymbols = [...publics.values()]
  .filter((symbol) => symbol.name.startsWith("_s_"))
  .sort((a, b) => a.linear - b.linear)
  .map(symbolForOutput);

const layout = {
  generatedBy: "oracle/generate-dgroup-layout.mjs",
  generatedAt: "not-recorded-for-reproducible-output",
  status:
    "rebuild-map-derived; retail EXE is locked and decompressed, but retail DGROUP symbol equality still requires instrumented/extracted confirmation",
  sourceMap: {
    path: "source/WOLFSRC/WOLF3D.MAP",
    sha256: sha256(mapBytes),
    note: "Checked-in Borland debug MAP; offsets are strong rebuild evidence, not yet retail-authoritative.",
  },
  retailExe: {
    path: "steam/base/wolf3d.exe",
    sha256: retailSha,
    packedBytes: retailExe.length,
    decompressedBytes: retailImage.length,
    sanityStrings: Object.fromEntries(
      ["Wolfenstein", "Episode", "VSWAP"].map((needle) => [
        needle,
        retailImage.toString("latin1").includes(needle),
      ]),
    ),
  },
  dgroup: {
    segment: dgroup.segment,
    linear: hex(dgroup.linear, 5),
    dataStart: hex(Math.min(...dgroupSegments.map((segment) => segment.start)), 5),
    bssEnd: hex(Math.max(...dgroupSegments.map((segment) => segment.stop + 1)), 5),
    segments: dgroupSegments.map((segment) => ({
      name: segment.name,
      className: segment.className,
      start: hex(segment.start, 5),
      stop: hex(segment.stop, 5),
      length: hex(segment.length, 5),
    })),
  },
  farBss: {
    segments: farBssSegments.map((segment) => ({
      name: segment.name,
      className: segment.className,
      start: hex(segment.start, 5),
      stop: hex(segment.stop, 5),
      length: hex(segment.length, 5),
    })),
  },
  structLayouts: structSpecs,
  saveRecords: saveRecordSpecs.map((record) => ({
    ...record,
    symbolInfo: record.symbol ? symbolForOutput(requiredPublic(publics, record.symbol)) : null,
  })),
  saveCriticalSymbols: Object.fromEntries(
    saveSymbols.map((symbol) => [symbol, symbolForOutput(requiredPublic(publics, symbol))]),
  ),
  runtimeSymbols: Object.fromEntries(
    runtimeSymbols.map((symbol) => [symbol, symbolForOutput(requiredPublic(publics, symbol))]),
  ),
  statetypeSymbols,
};

await mkdir(path.dirname(jsonOut), { recursive: true });
await writeFile(jsonOut, `${JSON.stringify(layout, null, 2)}\n`, "utf8");

const ts = `// @generated by oracle/generate-dgroup-layout.mjs
// Do not edit by hand; regenerate after oracle MAP / locked binary changes.

export const DGROUP_LAYOUT = ${JSON.stringify(layout, null, 2)} as const;

export type DGroupLayout = typeof DGROUP_LAYOUT;
export type SaveRecordName = DGroupLayout["saveRecords"][number]["name"];
`;

await writeFile(tsOut, ts, "utf8");
console.log(`wrote ${path.relative(repoRoot, jsonOut)}`);
console.log(`wrote ${path.relative(repoRoot, tsOut)}`);
console.log(`statetype symbols: ${statetypeSymbols.length}`);
