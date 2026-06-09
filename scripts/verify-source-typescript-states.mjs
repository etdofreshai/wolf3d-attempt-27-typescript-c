#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceHeaderPath = path.join(repoRoot, "source", "WOLFSRC", "WL_DEF.H");
const sourceAct1Path = path.join(repoRoot, "source", "WOLFSRC", "WL_ACT1.C");
const sourceAgentPath = path.join(repoRoot, "source", "WOLFSRC", "WL_AGENT.C");
const sourcePath = path.join(repoRoot, "source", "WOLFSRC", "WL_ACT2.C");
const sourceStatePath = path.join(repoRoot, "source", "WOLFSRC", "WL_STATE.C");
const sourceUserAsmPath = path.join(repoRoot, "source", "WOLFSRC", "ID_US_A.ASM");
const typescriptPath = path.join(repoRoot, "apps", "source-typescript", "src", "main.ts");

const THINK_NAMES = new Map([
  ["T_BJJump", "bjJump"],
  ["T_BJRun", "bjRun"],
  ["T_Chase", "chase"],
  ["T_DogChase", "dogChase"],
  ["T_Fake", "fake"],
  ["T_Fat", "projectileBossChase"],
  ["T_Ghosts", "ghosts"],
  ["T_Gift", "projectileBossChase"],
  ["T_Path", "path"],
  ["T_Projectile", "projectile"],
  ["T_Schabb", "projectileBossChase"]
]);

const ACTION_NAMES = new Map([
  ["A_DeathScream", "deathScream"],
  ["A_HitlerMorph", "hitlerMorph"],
  ["A_MechaSound", "mechaSound"],
  ["A_Slurpie", "slurpie"],
  ["A_Smoke", "smoke"],
  ["A_StartDeathCam", "startDeathCam"],
  ["T_BJDone", "bjDone"],
  ["T_BJYell", "bjYell"],
  ["T_Bite", "bite"],
  ["T_FakeFire", "fakeFire"],
  ["T_GiftThrow", "throwRocket"],
  ["T_Projectile", "projectile"],
  ["T_SchabbThrow", "throwNeedle"],
  ["T_Shoot", "shoot"]
]);

const TYPESCRIPT_KIND_TO_SOURCE_ENEMY = new Map([
  ["blinky", "en_blinky"],
  ["boss", "en_boss"],
  ["clyde", "en_clyde"],
  ["dog", "en_dog"],
  ["fake_hitler", "en_fake"],
  ["fat", "en_fat"],
  ["gift", "en_gift"],
  ["gretel", "en_gretel"],
  ["guard", "en_guard"],
  ["hitler", "en_hitler"],
  ["inky", "en_inky"],
  ["mutant", "en_mutant"],
  ["officer", "en_officer"],
  ["pinky", "en_pinky"],
  ["schabbs", "en_schabbs"],
  ["ss", "en_ss"]
]);

// The TypeScript lane models the original source path where digitized boss
// death sounds are enabled, matching the runtime tictime mutations in WL_ACT2.C.
const DIGITIZED_BOSS_DEATH_TICS = new Map([
  ["s_fatdie2", 140],
  ["s_giftdie2", 140],
  ["s_hitlerdie2", 140],
  ["s_schabbdie2", 140]
]);

const [
  sourceHeaderText,
  sourceAct1Text,
  sourceAgentText,
  sourceText,
  sourceStateText,
  sourceUserAsmText,
  typescriptText
] = await Promise.all([
  readFile(sourceHeaderPath, "utf8"),
  readFile(sourceAct1Path, "utf8"),
  readFile(sourceAgentPath, "utf8"),
  readFile(sourcePath, "utf8"),
  readFile(sourceStatePath, "utf8"),
  readFile(sourceUserAsmPath, "utf8"),
  readFile(typescriptPath, "utf8")
]);

const sourceSprites = parseSourceSprites(sourceHeaderText);
const sourceDirectionIndexes = parseSourceDirectionIndexes(sourceHeaderText);
const sourceWeaponIndexes = parseSourceWeaponIndexes(sourceHeaderText);
const sourceEnemyIndexes = parseSourceEnemyIndexes(sourceHeaderText);
const sourceStaticInfo = parseSourceStaticInfo(sourceAct1Text, sourceSprites);
const sourceAttackInfo = parseSourceAttackInfo(sourceAgentText);
const sourceStartHitpoints = parseSourceStartHitpoints(sourceText);
const sourceRealHitlerHitpoints = parseSourceRealHitlerHitpoints(sourceText);
const sourceOppositeDirections = parseSourceDirectionList(sourceStateText, "opposite", sourceDirectionIndexes);
const sourceDiagonalDirections = parseSourceDirectionMatrix(sourceStateText, "diagonal", sourceDirectionIndexes);
const sourceRndTable = parseSourceRndTable(sourceUserAsmText);
const sourceStates = parseSourceStates(sourceText, sourceSprites);
const constants = parseNumericConstants(typescriptText);
const typescriptDirectionDeltas = parseTypescriptDirectionDeltas(typescriptText);
const typescriptOppositeDirections = parseTypescriptOppositeDirections(typescriptText, constants);
const typescriptDiagonalDirections = parseTypescriptDiagonalDirections(typescriptText, constants);
const typescriptWeaponIndexes = parseTypescriptWeaponIndexes(typescriptText);
const typescriptEnemyHitpointIndexes = parseTypescriptEnemyHitpointIndexes(typescriptText);
const typescriptStaticInfo = parseTypescriptStaticInfo(typescriptText);
const typescriptAttackInfo = parseTypescriptAttackInfo(typescriptText);
const typescriptStartHitpoints = parseTypescriptStartHitpoints(typescriptText);
const typescriptRealHitlerHitpoints = parseTypescriptRealHitlerHitpoints(typescriptText);
const typescriptRndTable = parseTypescriptRndTable(typescriptText);
const typescriptDroppedItemTypes = parseTypescriptDroppedItemTypes(typescriptText);
const typescriptSprites = parseTypescriptSprites(typescriptText);
const modeledFrames = parseModeledFrames(typescriptText, constants, typescriptSprites);
const problems = [];

for (const frame of modeledFrames.values()) {
  const source = sourceStates.get(frame.name);
  if (!source) {
    problems.push(`${frame.name}: modeled in source-typescript but missing from WL_ACT2.C`);
    continue;
  }

  if (frame.tics !== source.tics) {
    problems.push(`${frame.name}: tics ${frame.tics} != source ${source.tics}`);
  }

  if (frame.shapenum !== source.shapenum) {
    problems.push(`${frame.name}: shapenum ${frame.shapenum} != source ${source.shapenum}`);
  }

  if ((frame.think ?? null) !== source.think) {
    problems.push(`${frame.name}: think ${formatNullable(frame.think)} != source ${formatNullable(source.think)}`);
  }

  if ((frame.action ?? null) !== source.action) {
    problems.push(`${frame.name}: action ${formatNullable(frame.action)} != source ${formatNullable(source.action)}`);
  }
}

compareStaticInfo(sourceStaticInfo, typescriptStaticInfo, problems);
compareDroppedItemTypes(sourceStaticInfo, typescriptDroppedItemTypes, problems);
compareWeaponIndexes(sourceWeaponIndexes, typescriptWeaponIndexes, problems);
compareAttackInfo(sourceAttackInfo, typescriptAttackInfo, problems);
compareEnemyHitpointIndexes(sourceEnemyIndexes, typescriptEnemyHitpointIndexes, problems);
compareStartHitpoints(sourceStartHitpoints, typescriptStartHitpoints, problems);
compareRealHitlerHitpoints(sourceRealHitlerHitpoints, typescriptRealHitlerHitpoints, problems);
compareDirectionDeltas(sourceDirectionIndexes, typescriptDirectionDeltas, problems);
compareDirectionList("opposite", sourceOppositeDirections, typescriptOppositeDirections, problems);
compareDiagonalDirections(sourceDiagonalDirections, typescriptDiagonalDirections, sourceDirectionIndexes, problems);
compareRndTable(sourceRndTable, typescriptRndTable, problems);

if (problems.length > 0) {
  console.error(`source-typescript source verifier failed with ${problems.length} mismatch(es):`);
  for (const problem of problems.slice(0, 80)) {
    console.error(`- ${problem}`);
  }

  if (problems.length > 80) {
    console.error(`... ${problems.length - 80} more`);
  }

  process.exit(1);
}

console.log(
  `source-typescript source verifier: ${modeledFrames.size} modeled WL_ACT2.C frames, ${sourceStaticInfo.length} WL_ACT1.C statinfo entries, ${sourceAttackInfo.length} WL_AGENT.C attackinfo rows, ${sourceStartHitpoints.length} WL_ACT2.C hitpoint rows, ${sourceOppositeDirections.length} WL_STATE.C direction entries, and ${sourceRndTable.length} ID_US_A.ASM rndtable bytes match source.`
);

function parseSourceStates(text, sprites) {
  const states = new Map();
  const activeText = filterWl6Source(text);
  const statePattern = /statetype\s+(s_[A-Za-z0-9_]+)\s*=\s*\{([^}]+)\};/g;
  for (const match of activeText.matchAll(statePattern)) {
    const [, name, body] = match;
    const fields = body.split(",").map((field) => field.trim());
    const tics = Number(fields[2]);
    if (!Number.isFinite(tics)) {
      throw new Error(`Could not parse source tics for ${name}: ${fields[2]}`);
    }

    states.set(name, {
      action: normalizeSourceSymbol(fields[4], ACTION_NAMES),
      name,
      shapenum: resolveSourceShape(fields[1], sprites),
      think: normalizeSourceSymbol(fields[3], THINK_NAMES),
      tics: DIGITIZED_BOSS_DEATH_TICS.get(name) ?? tics
    });
  }

  return states;
}

function filterWl6Source(text) {
  const activeStack = [true];
  const lines = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("#ifdef SPEAR")) {
      activeStack.push(false);
      continue;
    }

    if (trimmed.startsWith("#ifndef SPEAR")) {
      activeStack.push(true);
      continue;
    }

    if (trimmed.startsWith("#else") && activeStack.length > 1) {
      activeStack[activeStack.length - 1] = !activeStack[activeStack.length - 1];
      continue;
    }

    if (trimmed.startsWith("#endif") && activeStack.length > 1) {
      activeStack.pop();
      continue;
    }

    if (activeStack.every(Boolean)) {
      lines.push(rawLine);
    }
  }

  return lines.join("\n");
}

function parseSourceSprites(text) {
  const enumStartMatch = /enum\s*\{/.exec(text);
  if (!enumStartMatch) {
    throw new Error("Could not find sprite enum in WL_DEF.H");
  }

  const enumStart = enumStartMatch.index;
  const enumEnd = text.indexOf("};", enumStart);
  if (enumEnd < 0) {
    throw new Error("Could not find end of sprite enum in WL_DEF.H");
  }

  const sprites = new Map();
  const activeStack = [true];
  let value = 0;
  for (const rawLine of text.slice(enumStart, enumEnd).split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("#ifdef SPEAR")) {
      activeStack.push(false);
      continue;
    }

    if (trimmed.startsWith("#ifndef SPEAR")) {
      activeStack.push(true);
      continue;
    }

    if (trimmed.startsWith("#else") && activeStack.length > 1) {
      activeStack[activeStack.length - 1] = !activeStack[activeStack.length - 1];
      continue;
    }

    if (trimmed.startsWith("#endif") && activeStack.length > 1) {
      activeStack.pop();
      continue;
    }

    if (!activeStack.every(Boolean)) {
      continue;
    }

    const line = rawLine.replace(/\/\/.*$/, "");
    for (const match of line.matchAll(/\b(SPR_[A-Z0-9_]+)\b/g)) {
      sprites.set(match[1], value);
      value += 1;
    }
  }

  return sprites;
}

function parseSourceDirectionIndexes(text) {
  const enumMatch = text.match(/typedef\s+enum\s*\{(?<body>[\s\S]*?)\}\s*dirtype;/);
  if (!enumMatch?.groups?.body) {
    throw new Error("Could not find dirtype enum in WL_DEF.H");
  }

  const directions = new Map();
  let value = 0;
  for (const match of enumMatch.groups.body.matchAll(/\b(east|northeast|north|northwest|west|southwest|south|southeast|nodir)\b/g)) {
    directions.set(match[1], value);
    value += 1;
  }

  return directions;
}

function parseSourceStaticInfo(text, sprites) {
  const activeText = filterWl6Source(text);
  const start = activeText.indexOf("statinfo[]");
  if (start < 0) {
    throw new Error("Could not find statinfo[] in WL_ACT1.C");
  }

  const end = activeText.indexOf("{-1}", start);
  if (end < 0) {
    throw new Error("Could not find statinfo[] terminator in WL_ACT1.C");
  }

  const entries = [];
  const entryPattern = /\{\s*(SPR_STAT_[0-9]+)\s*(?:,\s*([A-Za-z0-9_]+))?\s*\}/g;
  for (const match of activeText.slice(start, end).matchAll(entryPattern)) {
    entries.push({
      shapenum: resolveSourceShape(match[1], sprites),
      type: match[2] ?? "dressing"
    });
  }

  return entries;
}

function parseSourceWeaponIndexes(text) {
  const enumMatch = text.match(/typedef\s+enum\s*\{(?<body>[\s\S]*?)\}\s*weapontype;/);
  if (!enumMatch?.groups?.body) {
    throw new Error("Could not find weapontype enum in WL_DEF.H");
  }

  const weapons = new Map();
  let value = 0;
  for (const match of enumMatch.groups.body.matchAll(/\b(wp_[a-z0-9_]+)\b/g)) {
    weapons.set(match[1].toUpperCase(), value);
    value += 1;
  }

  return weapons;
}

function parseSourceEnemyIndexes(text) {
  const enumMatch = text.match(/typedef\s+enum\s*\{(?<body>[\s\S]*?)\}\s*enemy_t;/);
  if (!enumMatch?.groups?.body) {
    throw new Error("Could not find enemy_t enum in WL_DEF.H");
  }

  const enemies = new Map();
  let value = 0;
  for (const match of enumMatch.groups.body.matchAll(/\b(en_[a-z0-9_]+)\b/g)) {
    enemies.set(match[1], value);
    value += 1;
  }

  return enemies;
}

function parseSourceAttackInfo(text) {
  const start = text.indexOf("attackinfo[4][14]");
  if (start < 0) {
    throw new Error("Could not find attackinfo[4][14] in WL_AGENT.C");
  }

  const tableStart = text.indexOf("{", start);
  const tableEnd = text.indexOf("};", tableStart);
  if (tableStart < 0 || tableEnd < 0) {
    throw new Error("Could not parse attackinfo initializer in WL_AGENT.C");
  }

  const rows = [];
  const rowPattern = /\{\s*((?:\{\s*-?[0-9]+\s*,\s*-?[0-9]+\s*,\s*-?[0-9]+\s*\}\s*,?\s*)+)\}/g;
  for (const rowMatch of text.slice(tableStart, tableEnd).matchAll(rowPattern)) {
    const entries = [];
    for (const entryMatch of rowMatch[1].matchAll(/\{\s*(-?[0-9]+)\s*,\s*(-?[0-9]+)\s*,\s*(-?[0-9]+)\s*\}/g)) {
      entries.push({
        attack: Number(entryMatch[2]),
        frame: Number(entryMatch[3]),
        tics: Number(entryMatch[1])
      });
    }

    if (entries.length > 0) {
      rows.push(entries);
    }
  }

  if (rows.length === 0) {
    throw new Error("Could not parse any attackinfo rows in WL_AGENT.C");
  }

  return rows;
}

function parseSourceStartHitpoints(text) {
  const start = text.indexOf("starthitpoints[4][NUMENEMIES]");
  if (start < 0) {
    throw new Error("Could not find starthitpoints[4][NUMENEMIES] in WL_ACT2.C");
  }

  const tableStart = text.indexOf("{", start);
  const tableEnd = text.indexOf(";", tableStart);
  if (tableStart < 0 || tableEnd < 0) {
    throw new Error("Could not parse starthitpoints initializer in WL_ACT2.C");
  }

  return parseNumericRows(text.slice(tableStart, tableEnd));
}

function parseSourceRealHitlerHitpoints(text) {
  const start = text.indexOf("void A_HitlerMorph");
  if (start < 0) {
    throw new Error("Could not find A_HitlerMorph in WL_ACT2.C");
  }

  const match = text.slice(start).match(/hitpoints\[4\]\s*=\s*\{([^}]+)\}/);
  if (!match) {
    throw new Error("Could not find A_HitlerMorph hitpoints[4] in WL_ACT2.C");
  }

  return parseNumberList(match[1]);
}

function parseSourceDirectionList(text, name, directions) {
  const match = text.match(new RegExp(`dirtype\\s+${name}\\[9\\]\\s*=\\s*\\{(?<body>[\\s\\S]*?)\\};`));
  if (!match?.groups?.body) {
    throw new Error(`Could not find ${name}[9] in WL_STATE.C`);
  }

  return parseDirectionSymbols(match.groups.body, directions);
}

function parseSourceDirectionMatrix(text, name, directions) {
  const match = text.match(new RegExp(`dirtype\\s+${name}\\[9\\]\\[9\\]\\s*=\\s*\\{(?<body>[\\s\\S]*?)\\};`));
  if (!match?.groups?.body) {
    throw new Error(`Could not find ${name}[9][9] in WL_STATE.C`);
  }

  const rows = [];
  const stripped = match.groups.body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const rowMatch of stripped.matchAll(/\{([^{}]+)\}/g)) {
    rows.push(parseDirectionSymbols(rowMatch[1], directions));
  }

  return rows;
}

function parseDirectionSymbols(text, directions) {
  return [...text.matchAll(/\b(east|northeast|north|northwest|west|southwest|south|southeast|nodir)\b/g)].map(
    (match) => {
      const value = directions.get(match[1]);
      if (!Number.isFinite(value)) {
        throw new Error(`Could not resolve source direction: ${match[1]}`);
      }

      return value;
    }
  );
}

function parseSourceRndTable(text) {
  const start = text.indexOf("rndtable db");
  const end = text.indexOf("PUBLIC", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find rndtable in ID_US_A.ASM");
  }

  return parseNumberList(text.slice(start, end));
}

function parseTypescriptDirectionDeltas(text) {
  const objectMatch = text.match(/const DIRECTION_DELTAS:\s*Record<number,\s*\{ dx: number; dy: number \}>\s*=\s*\{(?<body>[\s\S]*?)\};/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find DIRECTION_DELTAS in source-typescript main.ts");
  }

  const deltas = new Map();
  for (const match of objectMatch.groups.body.matchAll(/\b([0-9]+):\s*\{\s*dx:\s*(-?[0-9]+),\s*dy:\s*(-?[0-9]+)\s*\}/g)) {
    deltas.set(Number(match[1]), {
      dx: Number(match[2]),
      dy: Number(match[3])
    });
  }

  return deltas;
}

function parseTypescriptOppositeDirections(text, constants) {
  const match = text.match(/const OPPOSITE_DIRECTIONS\s*=\s*\[(?<body>[^\]]+)\]\s*as const;/);
  if (!match?.groups?.body) {
    throw new Error("Could not find OPPOSITE_DIRECTIONS in source-typescript main.ts");
  }

  return match.groups.body.split(",").map((part) => resolveTypescriptNumber(part, constants));
}

function parseTypescriptDiagonalDirections(text, constants) {
  const objectMatch = text.match(/const DIAGONAL_DIRECTIONS:\s*Record<number,\s*Partial<Record<number,\s*number>>>\s*=\s*\{(?<body>[\s\S]*?)\};/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find DIAGONAL_DIRECTIONS in source-typescript main.ts");
  }

  const rows = new Map();
  for (const rowMatch of objectMatch.groups.body.matchAll(/\b([0-9]+):\s*\{([^{}]*)\}/g)) {
    const row = new Map();
    for (const valueMatch of rowMatch[2].matchAll(/\b([0-9]+):\s*([A-Z0-9_]+|-?[0-9]+)/g)) {
      row.set(Number(valueMatch[1]), resolveTypescriptNumber(valueMatch[2], constants));
    }

    rows.set(Number(rowMatch[1]), row);
  }

  return rows;
}

function parseTypescriptWeaponIndexes(text) {
  const weapons = new Map();
  for (const match of text.matchAll(/\bconst\s+(WP_[A-Z0-9_]+)\s*=\s*([0-9]+);/g)) {
    weapons.set(match[1], Number(match[2]));
  }

  return weapons;
}

function parseTypescriptEnemyHitpointIndexes(text) {
  const objectMatch = text.match(/const ENEMY_HITPOINT_INDEX:\s*Record<string, number>\s*=\s*\{(?<body>[\s\S]*?)\};/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find ENEMY_HITPOINT_INDEX in source-typescript main.ts");
  }

  const enemies = new Map();
  for (const match of objectMatch.groups.body.matchAll(/\b([a-z_]+):\s*([0-9]+),?/g)) {
    enemies.set(match[1], Number(match[2]));
  }

  return enemies;
}

function parseTypescriptAttackInfo(text) {
  const start = text.indexOf("const ATTACK_INFO");
  const end = text.indexOf("const STATIC_INFO_TYPES", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find ATTACK_INFO in source-typescript main.ts");
  }

  const rows = [];
  const rowPattern =
    /\[\s*((?:\{\s*attack:\s*-?[0-9]+\s*,\s*frame:\s*-?[0-9]+\s*,\s*tics:\s*-?[0-9]+\s*\}\s*,?\s*)+)\]/g;
  for (const rowMatch of text.slice(start, end).matchAll(rowPattern)) {
    const entries = [];
    for (const entryMatch of rowMatch[1].matchAll(
      /\{\s*attack:\s*(-?[0-9]+)\s*,\s*frame:\s*(-?[0-9]+)\s*,\s*tics:\s*(-?[0-9]+)\s*\}/g
    )) {
      entries.push({
        attack: Number(entryMatch[1]),
        frame: Number(entryMatch[2]),
        tics: Number(entryMatch[3])
      });
    }

    if (entries.length > 0) {
      rows.push(entries);
    }
  }

  if (rows.length === 0) {
    throw new Error("Could not parse any ATTACK_INFO rows in source-typescript main.ts");
  }

  return rows;
}

function parseTypescriptStartHitpoints(text) {
  const start = text.indexOf("const START_HITPOINTS");
  const end = text.indexOf("const ENEMY_HITPOINT_INDEX", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find START_HITPOINTS in source-typescript main.ts");
  }

  return parseNumericRows(text.slice(start, end));
}

function parseTypescriptRealHitlerHitpoints(text) {
  const match = text.match(/const REAL_HITLER_HITPOINTS\s*=\s*\[([^\]]+)\]\s*as const;/);
  if (!match) {
    throw new Error("Could not find REAL_HITLER_HITPOINTS in source-typescript main.ts");
  }

  return parseNumberList(match[1]);
}

function parseTypescriptRndTable(text) {
  const match = text.match(/const US_RND_TABLE\s*=\s*\[(?<body>[\s\S]*?)\]\s*as const;/);
  if (!match?.groups?.body) {
    throw new Error("Could not find US_RND_TABLE in source-typescript main.ts");
  }

  return parseNumberList(match.groups.body);
}

function parseTypescriptStaticInfo(text) {
  const staticTypesMatch = text.match(/const STATIC_INFO_TYPES = \[(?<body>[\s\S]*?)\] as const;/);
  if (!staticTypesMatch?.groups?.body) {
    throw new Error("Could not find STATIC_INFO_TYPES in source-typescript main.ts");
  }

  const types = [...staticTypesMatch.groups.body.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const clip2Shape = Number(text.match(/if \(item === "bo_clip2"\) \{\s*return ([0-9]+);/m)?.[1]);
  const defaultOffset = Number(text.match(/return type \+ ([0-9]+);/m)?.[1]);
  if (!Number.isFinite(clip2Shape) || !Number.isFinite(defaultOffset)) {
    throw new Error("Could not parse statShapenumForType in source-typescript main.ts");
  }

  return types.map((type, index) => ({
    shapenum: type === "bo_clip2" ? clip2Shape : index + defaultOffset,
    type
  }));
}

function parseTypescriptDroppedItemTypes(text) {
  const objectMatch = text.match(/const DROPPED_ITEM_TYPES = \{(?<body>[\s\S]*?)\} as const;/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find DROPPED_ITEM_TYPES in source-typescript main.ts");
  }

  const entries = new Map();
  for (const match of objectMatch.groups.body.matchAll(/\b(bo_[A-Za-z0-9_]+):\s*([0-9]+)/g)) {
    entries.set(match[1], Number(match[2]));
  }

  return entries;
}

function parseTypescriptSprites(text) {
  const objectMatch = text.match(/const ACTOR_SPRITES = \{(?<body>[\s\S]*?)\} as const;/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find ACTOR_SPRITES in source-typescript main.ts");
  }

  const sprites = new Map();
  const entryPattern = /\b([A-Z0-9_]+):\s*([0-9]+),?/g;
  for (const match of objectMatch.groups.body.matchAll(entryPattern)) {
    sprites.set(match[1], Number(match[2]));
  }

  return sprites;
}

function compareStaticInfo(sourceEntries, typescriptEntries, problems) {
  if (sourceEntries.length !== typescriptEntries.length) {
    problems.push(`statinfo length ${typescriptEntries.length} != source ${sourceEntries.length}`);
  }

  const count = Math.min(sourceEntries.length, typescriptEntries.length);
  for (let index = 0; index < count; index += 1) {
    const source = sourceEntries[index];
    const current = typescriptEntries[index];
    if (current.type !== source.type) {
      problems.push(`statinfo[${index}]: type ${current.type} != source ${source.type}`);
    }

    if (current.shapenum !== source.shapenum) {
      problems.push(`statinfo[${index}]: shapenum ${current.shapenum} != source ${source.shapenum}`);
    }
  }
}

function compareDroppedItemTypes(sourceEntries, typescriptEntries, problems) {
  for (const [item, typeIndex] of typescriptEntries.entries()) {
    const sourceIndex = sourceEntries.findIndex((entry) => entry.type === item);
    if (sourceIndex < 0) {
      problems.push(`DROPPED_ITEM_TYPES.${item}: missing from source statinfo[]`);
      continue;
    }

    if (typeIndex !== sourceIndex) {
      problems.push(`DROPPED_ITEM_TYPES.${item}: type ${typeIndex} != source first type ${sourceIndex}`);
    }
  }
}

function compareWeaponIndexes(sourceEntries, typescriptEntries, problems) {
  for (const [weapon, sourceIndex] of sourceEntries.entries()) {
    const currentIndex = typescriptEntries.get(weapon);
    if (!Number.isFinite(currentIndex)) {
      problems.push(`${weapon}: missing TypeScript weapon index`);
      continue;
    }

    if (currentIndex !== sourceIndex) {
      problems.push(`${weapon}: index ${currentIndex} != source ${sourceIndex}`);
    }
  }
}

function compareAttackInfo(sourceRows, typescriptRows, problems) {
  if (sourceRows.length !== typescriptRows.length) {
    problems.push(`attackinfo row count ${typescriptRows.length} != source ${sourceRows.length}`);
  }

  const rowCount = Math.min(sourceRows.length, typescriptRows.length);
  for (let row = 0; row < rowCount; row += 1) {
    if (sourceRows[row].length !== typescriptRows[row].length) {
      problems.push(`attackinfo[${row}] populated frame count ${typescriptRows[row].length} != source ${sourceRows[row].length}`);
    }

    const frameCount = Math.min(sourceRows[row].length, typescriptRows[row].length);
    for (let frame = 0; frame < frameCount; frame += 1) {
      const source = sourceRows[row][frame];
      const current = typescriptRows[row][frame];
      for (const field of ["tics", "attack", "frame"]) {
        if (current[field] !== source[field]) {
          problems.push(`attackinfo[${row}][${frame}].${field} ${current[field]} != source ${source[field]}`);
        }
      }
    }
  }
}

function compareEnemyHitpointIndexes(sourceEntries, typescriptEntries, problems) {
  for (const [kind, sourceEnemy] of TYPESCRIPT_KIND_TO_SOURCE_ENEMY.entries()) {
    const sourceIndex = sourceEntries.get(sourceEnemy);
    const currentIndex = typescriptEntries.get(kind);
    if (!Number.isFinite(sourceIndex)) {
      problems.push(`${kind}: missing source enemy index ${sourceEnemy}`);
      continue;
    }

    if (!Number.isFinite(currentIndex)) {
      problems.push(`${kind}: missing TypeScript enemy hitpoint index`);
      continue;
    }

    if (currentIndex !== sourceIndex) {
      problems.push(`${kind}: hitpoint index ${currentIndex} != source ${sourceEnemy} index ${sourceIndex}`);
    }
  }
}

function compareStartHitpoints(sourceRows, typescriptRows, problems) {
  compareNumberRows("starthitpoints", sourceRows, typescriptRows, problems);
}

function compareRealHitlerHitpoints(sourceValues, typescriptValues, problems) {
  compareNumberList("A_HitlerMorph.hitpoints", sourceValues, typescriptValues, problems);
}

function compareDirectionDeltas(sourceDirections, typescriptDeltas, problems) {
  const expected = new Map([
    ["east", { dx: 1, dy: 0 }],
    ["northeast", { dx: 1, dy: -1 }],
    ["north", { dx: 0, dy: -1 }],
    ["northwest", { dx: -1, dy: -1 }],
    ["west", { dx: -1, dy: 0 }],
    ["southwest", { dx: -1, dy: 1 }],
    ["south", { dx: 0, dy: 1 }],
    ["southeast", { dx: 1, dy: 1 }]
  ]);

  for (const [name, delta] of expected.entries()) {
    const sourceIndex = sourceDirections.get(name);
    const current = typescriptDeltas.get(sourceIndex);
    if (!current) {
      problems.push(`DIRECTION_DELTAS.${sourceIndex}: missing TypeScript delta for source ${name}`);
      continue;
    }

    if (current.dx !== delta.dx || current.dy !== delta.dy) {
      problems.push(`DIRECTION_DELTAS.${sourceIndex}: (${current.dx},${current.dy}) != source ${name} (${delta.dx},${delta.dy})`);
    }
  }
}

function compareDirectionList(name, sourceValues, typescriptValues, problems) {
  compareNumberList(name, sourceValues, typescriptValues, problems);
}

function compareDiagonalDirections(sourceRows, typescriptRows, sourceDirections, problems) {
  const nodir = sourceDirections.get("nodir");
  if (!Number.isFinite(nodir)) {
    problems.push("diagonal: missing source nodir direction");
    return;
  }

  if (sourceRows.length !== 9) {
    problems.push(`diagonal row count ${sourceRows.length} != source 9`);
  }

  for (let row = 0; row < sourceRows.length; row += 1) {
    if (sourceRows[row].length !== 9) {
      problems.push(`diagonal[${row}] length ${sourceRows[row].length} != source 9`);
    }

    for (let column = 0; column < sourceRows[row].length; column += 1) {
      const source = sourceRows[row][column];
      const current = typescriptRows.get(row)?.get(column) ?? nodir;
      if (current !== source) {
        problems.push(`diagonal[${row}][${column}] ${current} != source ${source}`);
      }
    }
  }
}

function compareRndTable(sourceValues, typescriptValues, problems) {
  compareNumberList("US_RND_TABLE", sourceValues, typescriptValues, problems);
}

function parseNumericConstants(text) {
  const constants = new Map();
  const constantPattern = /const\s+([A-Z0-9_]+)\s*=\s*([0-9]+);/g;
  for (const match of text.matchAll(constantPattern)) {
    constants.set(match[1], Number(match[2]));
  }

  return constants;
}

function parseNumericRows(text) {
  const rows = [];
  const stripped = text.replace(/\/\/.*$/gm, "");
  for (const rowMatch of stripped.matchAll(/[\{\[]([^\{\}\[\]]+)[\}\]]/g)) {
    const values = parseNumberList(rowMatch[1]);
    if (values.length > 0) {
      rows.push(values);
    }
  }

  if (rows.length === 0) {
    throw new Error("Could not parse numeric rows");
  }

  return rows;
}

function parseNumberList(text) {
  return [...text.matchAll(/-?[0-9]+/g)].map((match) => Number(match[0]));
}

function compareNumberRows(name, sourceRows, typescriptRows, problems) {
  if (sourceRows.length !== typescriptRows.length) {
    problems.push(`${name} row count ${typescriptRows.length} != source ${sourceRows.length}`);
  }

  const rowCount = Math.min(sourceRows.length, typescriptRows.length);
  for (let row = 0; row < rowCount; row += 1) {
    compareNumberList(`${name}[${row}]`, sourceRows[row], typescriptRows[row], problems);
  }
}

function compareNumberList(name, sourceValues, typescriptValues, problems) {
  if (sourceValues.length !== typescriptValues.length) {
    problems.push(`${name} length ${typescriptValues.length} != source ${sourceValues.length}`);
  }

  const count = Math.min(sourceValues.length, typescriptValues.length);
  for (let index = 0; index < count; index += 1) {
    if (typescriptValues[index] !== sourceValues[index]) {
      problems.push(`${name}[${index}] ${typescriptValues[index]} != source ${sourceValues[index]}`);
    }
  }
}

function parseModeledFrames(text, constants, sprites) {
  const frames = new Map();
  const errors = [];
  const addFrame = (frame) => {
    const existing = frames.get(frame.name);
    if (existing) {
      const same =
        existing.tics === frame.tics &&
        existing.shapenum === frame.shapenum &&
        (existing.think ?? null) === (frame.think ?? null) &&
        (existing.action ?? null) === (frame.action ?? null);
      if (!same) {
        errors.push(
          `${frame.name}: duplicate modeled frame differs (${JSON.stringify(existing)} vs ${JSON.stringify(frame)})`
        );
      }

      return;
    }

    frames.set(frame.name, frame);
  };

  parseObjectFrames(text, constants, sprites, addFrame);
  parseDeathTuples(text, constants, sprites, addFrame);
  parsePathFrames(text, sprites, addFrame);
  parseChaseFrames(text, sprites, addFrame);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return frames;
}

function parseObjectFrames(text, constants, sprites, addFrame) {
  const objectPattern = /\{[^{}]*name:\s*"(?<name>s_[A-Za-z0-9_]+)"[^{}]*\}/gs;
  for (const match of text.matchAll(objectPattern)) {
    const body = match[0];
    const name = match.groups.name;
    const ticsMatch = body.match(/\btics:\s*([^,\n}]+)/);
    if (!ticsMatch) {
      continue;
    }

    const shapenumMatch = body.match(/\bshapenum:\s*([^,\n}]+)/);
    if (!shapenumMatch) {
      continue;
    }

    addFrame({
      action: readStringProperty(body, "action"),
      name,
      shapenum: resolveTypescriptShape(shapenumMatch[1], sprites),
      think: readStringProperty(body, "think"),
      tics: resolveTics(ticsMatch[1], constants)
    });
  }
}

function parseDeathTuples(text, constants, sprites, addFrame) {
  const tuplePattern =
    /\[\s*"(?<name>s_[A-Za-z0-9_]+)"\s*,\s*(?<shape>[^,\]]+)\s*,\s*(?<tics>[A-Z0-9_]+|[0-9]+)(?:\s*,\s*(?:true|false))?(?:\s*,\s*"(?<action>[^"]+)")?\s*\]/g;
  for (const match of text.matchAll(tuplePattern)) {
    addFrame({
      action: match.groups.action ?? null,
      name: match.groups.name,
      shapenum: resolveTypescriptShape(match.groups.shape, sprites),
      think: null,
      tics: resolveTics(match.groups.tics, constants)
    });
  }
}

function parsePathFrames(text, sprites, addFrame) {
  const pathPattern = /pathFrames\("(?<prefix>[^"]+)"\s*,\s*(?<sprites>\[[^\]]+\])/g;
  for (const match of text.matchAll(pathPattern)) {
    const walkSprites = parseSpriteArray(match.groups.sprites, sprites);
    addWalkFrames(match.groups.prefix, "path", walkSprites, [20, 5, 15, 20, 5, 15], "path", addFrame);
  }
}

function parseChaseFrames(text, sprites, addFrame) {
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("chaseFrames(")) {
      continue;
    }

    const prefixMatch = line.match(/chaseFrames\("(?<prefix>[^"]+)"/);
    if (!prefixMatch) {
      continue;
    }

    const arrays = [...line.matchAll(/\[[^\]]+\]/g)].map((match) => match[0]);
    const spriteArray = arrays.find((array) => array.includes("ACTOR_SPRITES."));
    if (!spriteArray) {
      throw new Error(`Could not find sprite array for ${prefixMatch.groups.prefix} chase frames`);
    }

    const ticArray = arrays.find((array, index) => index > 0 && /^\[[0-9,\s]+\]$/.test(array));
    const tics = ticArray ? ticArray.slice(1, -1).split(",").map((part) => Number(part.trim())) : [10, 3, 8, 10, 3, 8];
    const think = line.match(/,\s*"(?<think>[^"]+)"\s*\)/)?.groups.think ?? "chase";
    addWalkFrames(prefixMatch.groups.prefix, "chase", parseSpriteArray(spriteArray, sprites), tics, think, addFrame);
  }
}

function addWalkFrames(prefix, stateKind, walkSprites, tics, think, addFrame) {
  const suffixes = ["1", "1s", "2", "3", "3s", "4"];
  const spriteIndexes = [0, 0, 1, 2, 2, 3];
  for (let index = 0; index < suffixes.length; index += 1) {
    addFrame({
      action: null,
      name: `s_${prefix}${stateKind}${suffixes[index]}`,
      shapenum: walkSprites[spriteIndexes[index]],
      think: index === 1 || index === 4 ? null : think,
      tics: tics[index]
    });
  }
}

function normalizeSourceSymbol(symbol, names) {
  if (!symbol || symbol === "NULL") {
    return null;
  }

  return names.get(symbol) ?? `source:${symbol}`;
}

function resolveSourceShape(expression, sprites) {
  const normalized = expression.trim();
  if (/^[0-9]+$/.test(normalized)) {
    return Number(normalized);
  }

  const value = sprites.get(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not resolve source shapenum: ${normalized}`);
  }

  return value;
}

function resolveTypescriptShape(expression, sprites) {
  const normalized = expression.trim();
  if (/^[0-9]+$/.test(normalized)) {
    return Number(normalized);
  }

  const spriteName = normalized.match(/^ACTOR_SPRITES\.([A-Z0-9_]+)$/)?.[1];
  const value = spriteName ? sprites.get(spriteName) : undefined;
  if (!Number.isFinite(value)) {
    throw new Error(`Could not resolve TypeScript shapenum: ${normalized}`);
  }

  return value;
}

function parseSpriteArray(expression, sprites) {
  const values = [];
  for (const match of expression.matchAll(/ACTOR_SPRITES\.([A-Z0-9_]+)/g)) {
    const value = sprites.get(match[1]);
    if (!Number.isFinite(value)) {
      throw new Error(`Could not resolve TypeScript sprite: ${match[1]}`);
    }

    values.push(value);
  }

  if (values.length !== 4) {
    throw new Error(`Expected four walk sprites, found ${values.length}: ${expression}`);
  }

  return values;
}

function readStringProperty(body, key) {
  return body.match(new RegExp(`\\b${key}:\\s*"([^"]+)"`))?.[1] ?? null;
}

function resolveTics(expression, constants) {
  const normalized = expression.trim();
  if (/^[0-9]+$/.test(normalized)) {
    return Number(normalized);
  }

  const value = constants.get(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not resolve tics expression: ${normalized}`);
  }

  return value;
}

function resolveTypescriptNumber(expression, constants) {
  const normalized = expression.trim();
  if (/^-?[0-9]+$/.test(normalized)) {
    return Number(normalized);
  }

  const value = constants.get(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not resolve TypeScript number expression: ${normalized}`);
  }

  return value;
}

function formatNullable(value) {
  return value ?? "NULL";
}
