#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
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

const [sourceText, typescriptText] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(typescriptPath, "utf8")
]);

const sourceStates = parseSourceStates(sourceText);
const constants = parseNumericConstants(typescriptText);
const modeledFrames = parseModeledFrames(typescriptText, constants);
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

  if ((frame.think ?? null) !== source.think) {
    problems.push(`${frame.name}: think ${formatNullable(frame.think)} != source ${formatNullable(source.think)}`);
  }

  if ((frame.action ?? null) !== source.action) {
    problems.push(`${frame.name}: action ${formatNullable(frame.action)} != source ${formatNullable(source.action)}`);
  }
}

if (problems.length > 0) {
  console.error(`source-typescript state verifier failed with ${problems.length} mismatch(es):`);
  for (const problem of problems.slice(0, 80)) {
    console.error(`- ${problem}`);
  }

  if (problems.length > 80) {
    console.error(`... ${problems.length - 80} more`);
  }

  process.exit(1);
}

console.log(
  `source-typescript state verifier: ${modeledFrames.size} modeled WL_ACT2.C frames match source tics/actions/thinks.`
);

function parseSourceStates(text) {
  const states = new Map();
  const statePattern = /statetype\s+(s_[A-Za-z0-9_]+)\s*=\s*\{([^}]+)\};/g;
  for (const match of text.matchAll(statePattern)) {
    const [, name, body] = match;
    const fields = body.split(",").map((field) => field.trim());
    const tics = Number(fields[2]);
    if (!Number.isFinite(tics)) {
      throw new Error(`Could not parse source tics for ${name}: ${fields[2]}`);
    }

    states.set(name, {
      action: normalizeSourceSymbol(fields[4], ACTION_NAMES),
      name,
      think: normalizeSourceSymbol(fields[3], THINK_NAMES),
      tics: DIGITIZED_BOSS_DEATH_TICS.get(name) ?? tics
    });
  }

  return states;
}

function parseNumericConstants(text) {
  const constants = new Map();
  const constantPattern = /const\s+([A-Z0-9_]+)\s*=\s*([0-9]+);/g;
  for (const match of text.matchAll(constantPattern)) {
    constants.set(match[1], Number(match[2]));
  }

  return constants;
}

function parseModeledFrames(text, constants) {
  const frames = new Map();
  const errors = [];
  const addFrame = (frame) => {
    const existing = frames.get(frame.name);
    if (existing) {
      const same =
        existing.tics === frame.tics &&
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

  parseObjectFrames(text, constants, addFrame);
  parseDeathTuples(text, constants, addFrame);
  parsePathFrames(text, addFrame);
  parseChaseFrames(text, addFrame);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return frames;
}

function parseObjectFrames(text, constants, addFrame) {
  const objectPattern = /\{[^{}]*name:\s*"(?<name>s_[A-Za-z0-9_]+)"[^{}]*\}/gs;
  for (const match of text.matchAll(objectPattern)) {
    const body = match[0];
    const name = match.groups.name;
    const ticsMatch = body.match(/\btics:\s*([^,\n}]+)/);
    if (!ticsMatch) {
      continue;
    }

    addFrame({
      action: readStringProperty(body, "action"),
      name,
      think: readStringProperty(body, "think"),
      tics: resolveTics(ticsMatch[1], constants)
    });
  }
}

function parseDeathTuples(text, constants, addFrame) {
  const tuplePattern =
    /\[\s*"(?<name>s_[A-Za-z0-9_]+)"\s*,\s*[^,\]]+\s*,\s*(?<tics>[A-Z0-9_]+|[0-9]+)(?:\s*,\s*(?:true|false))?(?:\s*,\s*"(?<action>[^"]+)")?\s*\]/g;
  for (const match of text.matchAll(tuplePattern)) {
    addFrame({
      action: match.groups.action ?? null,
      name: match.groups.name,
      think: null,
      tics: resolveTics(match.groups.tics, constants)
    });
  }
}

function parsePathFrames(text, addFrame) {
  const pathPattern = /pathFrames\("(?<prefix>[^"]+)"/g;
  for (const match of text.matchAll(pathPattern)) {
    addWalkFrames(match.groups.prefix, "path", [20, 5, 15, 20, 5, 15], "path", addFrame);
  }
}

function parseChaseFrames(text, addFrame) {
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("chaseFrames(")) {
      continue;
    }

    const prefixMatch = line.match(/chaseFrames\("(?<prefix>[^"]+)"/);
    if (!prefixMatch) {
      continue;
    }

    const arrays = [...line.matchAll(/\[[^\]]+\]/g)].map((match) => match[0]);
    const ticArray = arrays.find((array, index) => index > 0 && /^\[[0-9,\s]+\]$/.test(array));
    const tics = ticArray ? ticArray.slice(1, -1).split(",").map((part) => Number(part.trim())) : [10, 3, 8, 10, 3, 8];
    const think = line.match(/,\s*"(?<think>[^"]+)"\s*\)/)?.groups.think ?? "chase";
    addWalkFrames(prefixMatch.groups.prefix, "chase", tics, think, addFrame);
  }
}

function addWalkFrames(prefix, stateKind, tics, think, addFrame) {
  const suffixes = ["1", "1s", "2", "3", "3s", "4"];
  for (let index = 0; index < suffixes.length; index += 1) {
    addFrame({
      action: null,
      name: `s_${prefix}${stateKind}${suffixes[index]}`,
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
