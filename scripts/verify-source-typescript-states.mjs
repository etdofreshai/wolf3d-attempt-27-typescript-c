#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceHeaderPath = path.join(repoRoot, "source", "WOLFSRC", "WL_DEF.H");
const sourceAct1Path = path.join(repoRoot, "source", "WOLFSRC", "WL_ACT1.C");
const sourcePath = path.join(repoRoot, "source", "WOLFSRC", "WL_ACT2.C");
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

// The TypeScript lane models the original source path where digitized boss
// death sounds are enabled, matching the runtime tictime mutations in WL_ACT2.C.
const DIGITIZED_BOSS_DEATH_TICS = new Map([
  ["s_fatdie2", 140],
  ["s_giftdie2", 140],
  ["s_hitlerdie2", 140],
  ["s_schabbdie2", 140]
]);

const [sourceHeaderText, sourceAct1Text, sourceText, typescriptText] = await Promise.all([
  readFile(sourceHeaderPath, "utf8"),
  readFile(sourceAct1Path, "utf8"),
  readFile(sourcePath, "utf8"),
  readFile(typescriptPath, "utf8")
]);

const sourceSprites = parseSourceSprites(sourceHeaderText);
const sourceStaticInfo = parseSourceStaticInfo(sourceAct1Text, sourceSprites);
const sourceStates = parseSourceStates(sourceText, sourceSprites);
const constants = parseNumericConstants(typescriptText);
const typescriptStaticInfo = parseTypescriptStaticInfo(typescriptText);
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
  `source-typescript source verifier: ${modeledFrames.size} modeled WL_ACT2.C frames and ${sourceStaticInfo.length} WL_ACT1.C statinfo entries match source.`
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

function parseNumericConstants(text) {
  const constants = new Map();
  const constantPattern = /const\s+([A-Z0-9_]+)\s*=\s*([0-9]+);/g;
  for (const match of text.matchAll(constantPattern)) {
    constants.set(match[1], Number(match[2]));
  }

  return constants;
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

function formatNullable(value) {
  return value ?? "NULL";
}
