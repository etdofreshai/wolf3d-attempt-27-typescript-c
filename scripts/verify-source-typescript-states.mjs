#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceAudioPath = path.join(repoRoot, "source", "WOLFSRC", "AUDIOWL6.H");
const sourceHeaderPath = path.join(repoRoot, "source", "WOLFSRC", "WL_DEF.H");
const sourceAct1Path = path.join(repoRoot, "source", "WOLFSRC", "WL_ACT1.C");
const sourceAgentPath = path.join(repoRoot, "source", "WOLFSRC", "WL_AGENT.C");
const sourceDrawPath = path.join(repoRoot, "source", "WOLFSRC", "WL_DRAW.C");
const sourceGamePath = path.join(repoRoot, "source", "WOLFSRC", "WL_GAME.C");
const sourceInterPath = path.join(repoRoot, "source", "WOLFSRC", "WL_INTER.C");
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

const SOURCE_KILL_CLASS_TO_TYPESCRIPT_KIND = new Map([
  ["bossobj", "boss"],
  ["dogobj", "dog"],
  ["fakeobj", "fake_hitler"],
  ["fatobj", "fat"],
  ["giftobj", "gift"],
  ["gretelobj", "gretel"],
  ["guardobj", "guard"],
  ["mechahitlerobj", "hitler"],
  ["mutantobj", "mutant"],
  ["officerobj", "officer"],
  ["realhitlerobj", "real_hitler"],
  ["schabbobj", "schabbs"],
  ["ssobj", "ss"]
]);

const SOURCE_ONLY_BONUS_ITEMS = new Set(["bo_spear"]);
const BONUS_REWARD_FIELDS = ["condition", "sound", "heal", "ammo", "weapon", "key", "score", "extraLife", "treasure"];

// The TypeScript lane models the original source path where digitized boss
// death sounds are enabled, matching the runtime tictime mutations in WL_ACT2.C.
const DIGITIZED_BOSS_DEATH_TICS = new Map([
  ["s_fatdie2", 140],
  ["s_giftdie2", 140],
  ["s_hitlerdie2", 140],
  ["s_schabbdie2", 140]
]);

const [
  sourceAudioText,
  sourceHeaderText,
  sourceAct1Text,
  sourceAgentText,
  sourceDrawText,
  sourceGameText,
  sourceInterText,
  sourceText,
  sourceStateText,
  sourceUserAsmText,
  typescriptText
] = await Promise.all([
  readFile(sourceAudioPath, "utf8"),
  readFile(sourceHeaderPath, "utf8"),
  readFile(sourceAct1Path, "utf8"),
  readFile(sourceAgentPath, "utf8"),
  readFile(sourceDrawPath, "utf8"),
  readFile(sourceGamePath, "utf8"),
  readFile(sourceInterPath, "utf8"),
  readFile(sourcePath, "utf8"),
  readFile(sourceStatePath, "utf8"),
  readFile(sourceUserAsmPath, "utf8"),
  readFile(typescriptPath, "utf8")
]);

const sourceSprites = parseSourceSprites(sourceHeaderText);
const sourceSoundIndexes = parseSourceSoundIndexes(sourceAudioText);
const sourceDirectionIndexes = parseSourceDirectionIndexes(sourceHeaderText);
const sourceWeaponIndexes = parseSourceWeaponIndexes(sourceHeaderText);
const sourceEnemyIndexes = parseSourceEnemyIndexes(sourceHeaderText);
const sourceDefines = parseSourceNumericDefines(sourceHeaderText);
const sourceAct1Defines = parseSourceNumericDefines(sourceAct1Text);
const sourceAgentDefines = parseSourceNumericDefines(sourceAgentText);
const sourceMovementDefines = mergeNumberMaps(sourceDefines, sourceAgentDefines);
const sourceWeaponReadySprites = parseSourceWeaponReadySprites(sourceDrawText, sourceSprites);
const sourceStaticInfo = parseSourceStaticInfo(sourceAct1Text, sourceSprites);
const sourceDoorPushwallContracts = parseSourceDoorPushwallContracts(sourceAct1Text, sourceAct1Defines);
const sourceAttackInfo = parseSourceAttackInfo(sourceAgentText);
const sourcePlayerAttackContracts = parseSourcePlayerAttackContracts(sourceAgentText);
const sourcePlayerCommandContracts = parseSourcePlayerCommandContracts(sourceAgentText);
const sourcePlayerMovementContracts = parseSourcePlayerMovementContracts(sourceAgentText, sourceMovementDefines);
const sourceAgentHelperContracts = parseSourceAgentHelperContracts(sourceAgentText, sourceDefines);
const sourceStartHitpoints = parseSourceStartHitpoints(sourceText);
const sourceRealHitlerHitpoints = parseSourceRealHitlerHitpoints(sourceText);
const sourceBonusRewards = parseSourceBonusRewards(sourceAgentText);
const sourceTreasureScores = parseSourceTreasureScores(sourceAgentText);
const sourceOppositeDirections = parseSourceDirectionList(sourceStateText, "opposite", sourceDirectionIndexes);
const sourceDiagonalDirections = parseSourceDirectionMatrix(sourceStateText, "diagonal", sourceDirectionIndexes);
const sourceDamageActorContract = parseSourceDamageActorContract(sourceStateText);
const sourceDamagePainStates = parseSourceDamagePainStates(sourceStateText);
const sourceKillActorRewards = parseSourceKillActorRewards(sourceStateText);
const sourceElevatorBackTo = parseSourceElevatorBackTo(sourceGameText);
const sourceParTimesSeconds = parseSourceParTimesSeconds(sourceInterText);
const sourceRndTable = parseSourceRndTable(sourceUserAsmText);
const sourceStates = parseSourceStates(sourceText, sourceSprites);
const constants = parseNumericConstants(typescriptText);
const stringConstants = parseStringConstants(typescriptText);
const typescriptSoundChunks = parseTypescriptSoundChunks(typescriptText);
const typescriptDirectionDeltas = parseTypescriptDirectionDeltas(typescriptText);
const typescriptOppositeDirections = parseTypescriptOppositeDirections(typescriptText, constants);
const typescriptDiagonalDirections = parseTypescriptDiagonalDirections(typescriptText, constants);
const typescriptWeaponReadySprites = parseTypescriptWeaponReadySprites(typescriptText, constants);
const typescriptElevatorBackTo = parseTypescriptElevatorBackTo(typescriptText, constants);
const typescriptParTimesSeconds = parseTypescriptParTimesSeconds(typescriptText, constants);
const typescriptWeaponIndexes = parseTypescriptWeaponIndexes(typescriptText);
const typescriptEnemyHitpointIndexes = parseTypescriptEnemyHitpointIndexes(typescriptText);
const typescriptStaticInfo = parseTypescriptStaticInfo(typescriptText);
const typescriptDoorPushwallContracts = parseTypescriptDoorPushwallContracts(typescriptText, constants, stringConstants);
const typescriptAttackInfo = parseTypescriptAttackInfo(typescriptText);
const typescriptPlayerAttackContracts = parseTypescriptPlayerAttackContracts(typescriptText, constants, stringConstants);
const typescriptPlayerCommandContracts = parseTypescriptPlayerCommandContracts(typescriptText, stringConstants);
const typescriptPlayerMovementContracts = parseTypescriptPlayerMovementContracts(typescriptText, constants, stringConstants);
const typescriptAgentHelperContracts = parseTypescriptAgentHelperContracts(typescriptText, constants, stringConstants);
const typescriptStartHitpoints = parseTypescriptStartHitpoints(typescriptText);
const typescriptRealHitlerHitpoints = parseTypescriptRealHitlerHitpoints(typescriptText);
const typescriptRndTable = parseTypescriptRndTable(typescriptText);
const typescriptActorKillScores = parseTypescriptActorKillScores(typescriptText);
const typescriptKillDrops = parseTypescriptKillDrops(typescriptText);
const typescriptTreasureScores = parseTypescriptTreasureScores(typescriptText);
const typescriptBonusRewards = parseTypescriptBonusRewards(typescriptText, typescriptTreasureScores, stringConstants);
const typescriptDroppedItemTypes = parseTypescriptDroppedItemTypes(typescriptText);
const typescriptDamageActorContract = parseTypescriptDamageActorContract(typescriptText);
const typescriptDamagePainStates = parseTypescriptDamagePainStates(typescriptText);
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
compareContractMap("WL_ACT1.C door/pushwall", sourceDoorPushwallContracts, typescriptDoorPushwallContracts, problems);
compareSoundChunks(sourceSoundIndexes, typescriptSoundChunks, problems);
compareWeaponReadySprites(sourceWeaponReadySprites, typescriptWeaponReadySprites, problems);
compareWeaponIndexes(sourceWeaponIndexes, typescriptWeaponIndexes, problems);
compareAttackInfo(sourceAttackInfo, typescriptAttackInfo, problems);
compareContractMap("WL_AGENT.C player attack", sourcePlayerAttackContracts, typescriptPlayerAttackContracts, problems);
compareContractMap("WL_AGENT.C player command", sourcePlayerCommandContracts, typescriptPlayerCommandContracts, problems);
compareContractMap("WL_AGENT.C player movement", sourcePlayerMovementContracts, typescriptPlayerMovementContracts, problems);
compareAgentHelperContracts(sourceAgentHelperContracts, typescriptAgentHelperContracts, problems);
compareEnemyHitpointIndexes(sourceEnemyIndexes, typescriptEnemyHitpointIndexes, problems);
compareStartHitpoints(sourceStartHitpoints, typescriptStartHitpoints, problems);
compareRealHitlerHitpoints(sourceRealHitlerHitpoints, typescriptRealHitlerHitpoints, problems);
compareBonusRewards(sourceBonusRewards, typescriptBonusRewards, problems);
compareTreasureScores(sourceTreasureScores, typescriptTreasureScores, problems);
compareKillActorRewards(sourceKillActorRewards, typescriptActorKillScores, typescriptKillDrops, problems);
compareContractObject("WL_STATE.C DamageActor", sourceDamageActorContract, typescriptDamageActorContract, problems);
comparePainStates(sourceDamagePainStates, typescriptDamagePainStates, problems);
compareDirectionDeltas(sourceDirectionIndexes, typescriptDirectionDeltas, problems);
compareDirectionList("opposite", sourceOppositeDirections, typescriptOppositeDirections, problems);
compareDiagonalDirections(sourceDiagonalDirections, typescriptDiagonalDirections, sourceDirectionIndexes, problems);
compareElevatorBackTo(sourceElevatorBackTo, typescriptElevatorBackTo, problems);
compareParTimesSeconds(sourceParTimesSeconds, typescriptParTimesSeconds, problems);
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
  `source-typescript source verifier: ${modeledFrames.size} modeled WL_ACT2.C frames, ${sourceStaticInfo.length} WL_ACT1.C statinfo entries, ${sourceDoorPushwallContracts.size} WL_ACT1.C door/pushwall contracts, ${sourceSoundIndexes.size} AUDIOWL6.H sounds, ${sourceWeaponReadySprites.length} WL_DRAW.C weapon sprites, ${sourceAttackInfo.length} WL_AGENT.C attackinfo rows, ${sourcePlayerAttackContracts.size} WL_AGENT.C player attack contracts, ${sourcePlayerCommandContracts.size} WL_AGENT.C player command contracts, ${sourcePlayerMovementContracts.size} WL_AGENT.C player movement contracts, ${sourceAgentHelperContracts.size} WL_AGENT.C helper contracts, ${countComparedBonusRewards(sourceBonusRewards)} WL_AGENT.C bonus reward rows, ${sourceTreasureScores.size} WL_AGENT.C treasure score rows, ${sourceStartHitpoints.length} WL_ACT2.C hitpoint rows, ${sourceKillActorRewards.size} WL_STATE.C kill reward rows, ${sourceDamagePainStates.size} WL_STATE.C damage pain rows, ${sourceOppositeDirections.length} WL_STATE.C direction entries, ${sourceParTimesSeconds.length} WL_INTER.C par times, and ${sourceRndTable.length} ID_US_A.ASM rndtable bytes match source.`
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

function parseSourceSoundIndexes(text) {
  const enumMatch = text.match(/typedef\s+enum\s*\{(?<body>[\s\S]*?)LASTSOUND\s*\}\s*soundnames;/);
  if (!enumMatch?.groups?.body) {
    throw new Error("Could not find soundnames enum in AUDIOWL6.H");
  }

  const sounds = new Map();
  let value = 0;
  for (const match of enumMatch.groups.body.matchAll(/\b([A-Z0-9_]+SND)\b/g)) {
    sounds.set(match[1], value);
    value += 1;
  }

  return sounds;
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

function parseSourceDoorPushwallContracts(text, defines) {
  const contracts = new Map();
  contracts.set("DoorOpen", parseSourceDoorOpenContract(extractCFunctionBody(text, "DoorOpen"), defines));
  contracts.set("DoorOpening", parseSourceDoorOpeningContract(extractCFunctionBody(text, "DoorOpening")));
  contracts.set("DoorClosing", parseSourceDoorClosingContract(extractCFunctionBody(text, "DoorClosing")));
  contracts.set("MoveDoors", parseSourceMoveDoorsContract(extractCFunctionBody(text, "MoveDoors")));
  contracts.set("OperateDoor", parseSourceOperateDoorContract(extractCFunctionBody(text, "OperateDoor")));
  contracts.set("PushWall", parseSourcePushWallContract(extractCFunctionBody(text, "PushWall")));
  contracts.set("MovePushWall", parseSourceMovePushWallContract(extractCFunctionBody(text, "MovePWalls")));
  return contracts;
}

function parseSourceDoorOpenContract(body, defines) {
  const openTicsSymbol = body.match(/>=\s*([A-Z0-9_]+)/)?.[1] ?? null;
  return {
    closeAfterTics: resolveSourceDefine(openTicsSymbol, defines),
    closesWhenElapsed: /\bCloseDoor\s*\(\s*door\s*\)/.test(body)
  };
}

function parseSourceDoorOpeningContract(body) {
  return {
    actionWhenComplete: body.match(/action\s*=\s*(dr_[a-z0-9_]+)/)?.[1] ?? null,
    connectWhenClosed: /if\s*\(\s*!position\s*\)[\s\S]*areaconnect/.test(body),
    maxPosition: parseRequiredNumberLiteral(body, /position\s*=\s*(0x[0-9a-fA-F]+|[0-9]+)/, "DoorOpening max position"),
    openSound: body.match(/PlaySoundLocTile\s*\(\s*([A-Z0-9_]+)/)?.[1] ?? null,
    resetTiccount: /ticcount\s*=\s*0/.test(body),
    slideShift: parseRequiredNumberLiteral(body, /position\s*\+=\s*tics\s*<<\s*([0-9]+)/, "DoorOpening slide shift")
  };
}

function parseSourceDoorClosingContract(body) {
  return {
    actionWhenComplete: body.match(/action\s*=\s*(dr_[a-z0-9_]+)/)?.[1] ?? null,
    disconnectWhenClosed: /position\s*=\s*0[\s\S]*areaconnect[\s\S]*--/.test(body),
    reopensWhenBlocked: /\bOpenDoor\s*\(\s*door\s*\)/.test(body),
    slideShift: parseRequiredNumberLiteral(body, /position\s*-=\s*tics\s*<<\s*([0-9]+)/, "DoorClosing slide shift")
  };
}

function parseSourceMoveDoorsContract(body) {
  return {
    handlesClosing: /case\s+dr_closing\s*:[\s\S]*DoorClosing\s*\(\s*door\s*\)/.test(body),
    handlesOpen: /case\s+dr_open\s*:[\s\S]*DoorOpen\s*\(\s*door\s*\)/.test(body),
    handlesOpening: /case\s+dr_opening\s*:[\s\S]*DoorOpening\s*\(\s*door\s*\)/.test(body),
    stopsDuringVictory: /if\s*\(\s*gamestate\.victoryflag\s*\)[\s\S]*return/.test(body)
  };
}

function parseSourceOperateDoorContract(body) {
  return {
    lockedSound: body.match(/SD_PlaySound\s*\(\s*([A-Z0-9_]+)\s*\)/)?.[1] ?? null,
    lockHigh: 4,
    lockLow: 1,
    opensClosedOrClosing: /case\s+dr_closed\s*:[\s\S]*case\s+dr_closing\s*:[\s\S]*OpenDoor\s*\(\s*door\s*\)/.test(body),
    closesOpenOrOpening: /case\s+dr_open\s*:[\s\S]*case\s+dr_opening\s*:[\s\S]*CloseDoor\s*\(\s*door\s*\)/.test(body)
  };
}

function parseSourcePushWallContract(body) {
  return {
    blockedSound: body.match(/SD_PlaySound\s*\(\s*NOWAYSND\s*\)/)?.[1] ?? "NOWAYSND",
    incrementsSecret: /gamestate\.secretcount\s*\+\+/.test(body),
    initialPos: parseRequiredNumberLiteral(body, /pwallpos\s*=\s*([0-9]+)/, "PushWall initial position"),
    initialState: parseRequiredNumberLiteral(body, /pwallstate\s*=\s*([0-9]+)/, "PushWall initial state"),
    oneActiveOnly: /if\s*\(\s*pwallstate\s*\)[\s\S]*return/.test(body),
    pushSound: body.match(/SD_PlaySound\s*\(\s*(PUSHWALLSND)\s*\)/)?.[1] ?? null,
    requiresWallTile: /if\s*\(\s*!oldtile\s*\)[\s\S]*return/.test(body)
  };
}

function parseSourceMovePushWallContract(body) {
  return {
    blockStep: parseRequiredNumberLiteral(body, /oldblock\s*=\s*pwallstate\s*\/\s*([0-9]+)/, "MovePWalls block step"),
    clearsAfterState: parseRequiredNumberLiteral(body, /if\s*\(\s*pwallstate\s*>\s*([0-9]+)/, "MovePWalls clear threshold"),
    incrementsByTics: /pwallstate\s*\+=\s*tics/.test(body),
    posDivisor: parseRequiredNumberLiteral(body, /pwallpos\s*=\s*\(\s*pwallstate\s*\/\s*([0-9]+)\s*\)/, "MovePWalls pos divisor"),
    posMask: parseRequiredNumberLiteral(body, /pwallpos\s*=\s*\(\s*pwallstate\s*\/\s*[0-9]+\s*\)\s*&\s*([0-9]+)/, "MovePWalls pos mask"),
    returnsWhenInactive: /if\s*\(\s*!pwallstate\s*\)[\s\S]*return/.test(body)
  };
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

function parseSourcePlayerAttackContracts(text) {
  const activeText = filterWl6Source(text);
  const cmdFireBody = extractCFunctionBody(activeText, "Cmd_Fire");
  const knifeBody = extractCFunctionBody(activeText, "KnifeAttack");
  const gunBody = extractCFunctionBody(activeText, "GunAttack");
  const attackBody = extractCFunctionBody(activeText, "T_Attack");
  const contracts = new Map();
  contracts.set("Cmd_Fire", parseSourceCmdFireContract(cmdFireBody));
  contracts.set("KnifeAttack", parseSourceKnifeAttackContract(knifeBody));
  contracts.set("GunAttackFrame", parseSourceGunAttackFrameContract(gunBody, attackBody));
  contracts.set("AttackLoop", parseSourceAttackLoopContract(attackBody));
  return contracts;
}

function parseSourceCmdFireContract(body) {
  return {
    attackCountFromAttackInfo:
      /gamestate\.attackcount\s*=[\s\S]*?attackinfo\s*\[\s*gamestate\.weapon\s*\]\s*\[\s*gamestate\.attackframe\s*\]\.tics/.test(body),
    holdsAttackButton: /buttonheld\s*\[\s*bt_attack\s*\]\s*=\s*true/.test(body),
    resetsAttackFrame: /gamestate\.attackframe\s*=\s*0/.test(body),
    resetsWeaponFrame: /gamestate\.weaponframe\s*=\s*0/.test(body),
    weaponFrameFromAttackInfo:
      /gamestate\.weaponframe\s*=[\s\S]*?attackinfo\s*\[\s*gamestate\.weapon\s*\]\s*\[\s*gamestate\.attackframe\s*\]\.frame/.test(body)
  };
}

function parseSourceKnifeAttackContract(body) {
  return {
    damageShift: parseRequiredNumber(body, /US_RndT\s*\(\s*\)\s*>>\s*([0-9]+)/, "KnifeAttack damage shift"),
    filtersCentered: /abs\s*\(\s*check->viewx\s*-\s*centerx\s*\)\s*<\s*shootdelta/.test(body),
    filtersShootable: /check->flags\s*&\s*FL_SHOOTABLE/.test(body),
    filtersVisible: /check->flags\s*&\s*FL_VISABLE/.test(body),
    lineCheck: /\bCheckLine\s*\(/.test(body),
    maxRangeFixed: parseRequiredNumberLiteral(body, /dist\s*>\s*(0x[0-9a-fA-F]+)\s*l?/i, "KnifeAttack max range"),
    selectsNearest: /check->transx\s*<\s*dist[\s\S]*?dist\s*=\s*check->transx[\s\S]*?closest\s*=\s*check/.test(body),
    sound: body.match(/SD_PlaySound\s*\(\s*([A-Z0-9_]+)\s*\)/)?.[1] ?? null
  };
}

function parseSourceGunAttackFrameContract(gunBody, attackBody) {
  return {
    callsDamageActor: /DamageActor\s*\(\s*closest\s*,\s*damage\s*\)/.test(gunBody),
    chaingunSound: parseSourceSwitchSound(gunBody, "wp_chaingun"),
    checksLine: /\bCheckLine\s*\(\s*closest\s*\)/.test(gunBody),
    closeDamageDivisor: parseRequiredNumber(
      gunBody,
      /if\s*\(\s*dist\s*<\s*[0-9]+\s*\)\s*damage\s*=\s*US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)/,
      "GunAttack close damage divisor"
    ),
    closeDistance: parseRequiredNumber(gunBody, /if\s*\(\s*dist\s*<\s*([0-9]+)\s*\)/, "GunAttack close distance"),
    distanceUsesMaxTileDelta: /dist\s*=\s*dx\s*>\s*dy\s*\?\s*dx\s*:\s*dy/.test(gunBody),
    farDamageDivisor: parseRequiredNumber(
      gunBody,
      /else\s*\{[\s\S]*?damage\s*=\s*US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)/,
      "GunAttack far damage divisor"
    ),
    farMissDivisor: parseRequiredNumber(gunBody, /US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)\s*\)\s*<\s*dist/, "GunAttack far miss divisor"),
    filtersCentered: /abs\s*\(\s*check->viewx\s*-\s*centerx\s*\)\s*<\s*shootdelta/.test(gunBody),
    filtersShootable: /check->flags\s*&\s*FL_SHOOTABLE/.test(gunBody),
    filtersVisible: /check->flags\s*&\s*FL_VISABLE/.test(gunBody),
    machinegunSound: parseSourceSwitchSound(gunBody, "wp_machinegun"),
    marksNoise: /\bmadenoise\s*=\s*true/.test(gunBody),
    mediumDamageDivisor: parseRequiredNumber(
      gunBody,
      /else\s+if\s*\(\s*dist\s*<\s*[0-9]+\s*\)\s*damage\s*=\s*US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)/,
      "GunAttack medium damage divisor"
    ),
    mediumDistance: parseRequiredNumber(gunBody, /else\s+if\s*\(\s*dist\s*<\s*([0-9]+)\s*\)/, "GunAttack medium distance"),
    noAmmoAdvancesAttackFrame: /case\s+1\s*:[\s\S]*!gamestate\.ammo[\s\S]*gamestate\.attackframe\+\+/.test(attackBody),
    pistolSound: parseSourceSwitchSound(gunBody, "wp_pistol"),
    selectsNearest: /check->transx\s*<\s*viewdist[\s\S]*?viewdist\s*=\s*check->transx[\s\S]*?closest\s*=\s*check/.test(gunBody),
    spendsAmmoOnGunFrame: /GunAttack\s*\(\s*ob\s*\)[\s\S]*?gamestate\.ammo--/.test(attackBody)
  };
}

function parseSourceAttackLoopContract(body) {
  return {
    advancesAttackCountByFrameTics: /gamestate\.attackcount\s*\+=\s*cur->tics/.test(body),
    advancesAttackFrame: /gamestate\.attackframe\+\+/.test(body),
    attack4RequiresAmmo: /case\s+4\s*:[\s\S]*?if\s*\(\s*!gamestate\.ammo\s*\)[\s\S]*?break/.test(body),
    chainRefireAttack4: /case\s+4\s*:[\s\S]*?buttonstate\s*\[\s*bt_attack\s*\][\s\S]*?gamestate\.attackframe\s*-=\s*2/.test(body),
    finishNoAmmoWeaponKnife: /case\s+-1\s*:[\s\S]*?!gamestate\.ammo[\s\S]*?gamestate\.weapon\s*=\s*wp_knife/.test(body),
    finishRestoresChosenWeapon: /case\s+-1\s*:[\s\S]*?gamestate\.weapon\s*!=\s*gamestate\.chosenweapon[\s\S]*?gamestate\.weapon\s*=\s*gamestate\.chosenweapon/.test(body),
    finishSentinel: /case\s+-1\s*:/.test(body),
    gunFrameOnAttack1: /case\s+1\s*:[\s\S]*?GunAttack\s*\(\s*ob\s*\)/.test(body),
    knifeFrameOnAttack2: /case\s+2\s*:[\s\S]*?KnifeAttack\s*\(\s*ob\s*\)/.test(body),
    refireAttack3: /case\s+3\s*:[\s\S]*?gamestate\.ammo\s*&&\s*buttonstate\s*\[\s*bt_attack\s*\][\s\S]*?gamestate\.attackframe\s*-=\s*2/.test(body),
    weaponFrameFromAttackInfo:
      /gamestate\.weaponframe\s*=[\s\S]*?attackinfo\s*\[\s*gamestate\.weapon\s*\]\s*\[\s*gamestate\.attackframe\s*\]\.frame/.test(body)
  };
}

function parseSourceSwitchSound(body, label) {
  return body.match(new RegExp(`case\\s+${label}\\s*:[\\s\\S]*?SD_PlaySound\\s*\\(\\s*([A-Z0-9_]+)\\s*\\)`))?.[1] ?? null;
}

function parseSourcePlayerCommandContracts(text) {
  const activeText = filterWl6Source(text);
  const cmdUseBody = extractCFunctionBody(activeText, "Cmd_Use");
  const playerBody = extractCFunctionBody(activeText, "T_Player");
  const contracts = new Map();
  contracts.set("Cmd_Use", parseSourceCmdUseContract(cmdUseBody));
  contracts.set("T_Player", parseSourceTPlayerContract(playerBody));
  return contracts;
}

function parseSourceCmdUseContract(body) {
  return {
    completedLevelOtherwise: /else\s+playstate\s*=\s*ex_completed/.test(body),
    doorRequiresUseNotHeld: /else\s+if\s*\(\s*!\s*buttonheld\s*\[\s*bt_use\s*\]\s*&&\s*doornum\s*&\s*0x80\s*\)/.test(body),
    doorUsesDoorMarker: /doornum\s*&\s*0x80/.test(body),
    eastTarget: /player->angle\s*<\s*ANGLES\s*\/\s*8\s*\|\|\s*player->angle\s*>\s*7\s*\*\s*ANGLES\s*\/\s*8[\s\S]*?checkx\s*=\s*player->tilex\s*\+\s*1[\s\S]*?checky\s*=\s*player->tiley[\s\S]*?dir\s*=\s*di_east[\s\S]*?elevatorok\s*=\s*true/.test(body),
    elevatorRequiresElevatorTile: /doornum\s*==\s*ELEVATORTILE/.test(body),
    elevatorRequiresHorizontalTarget: /&&\s*elevatorok/.test(body),
    elevatorRequiresUseNotHeld: /!\s*buttonheld\s*\[\s*bt_use\s*\]\s*&&\s*doornum\s*==\s*ELEVATORTILE/.test(body),
    flipsElevatorSwitch: /tilemap\s*\[\s*checkx\s*\]\s*\[\s*checky\s*\]\s*\+\+/.test(body),
    holdsUseOnDoor: /else\s+if[\s\S]*?buttonheld\s*\[\s*bt_use\s*\]\s*=\s*true[\s\S]*?OperateDoor/.test(body),
    holdsUseOnElevator: /doornum\s*==\s*ELEVATORTILE[\s\S]*?buttonheld\s*\[\s*bt_use\s*\]\s*=\s*true/.test(body),
    levelDoneSound: body.match(/SD_PlaySound\s*\(\s*(LEVELDONESND)\s*\)/)?.[1] ?? null,
    noActionSound: body.match(/SD_PlaySound\s*\(\s*(DONOTHINGSND)\s*\)/)?.[1] ?? null,
    northTarget: /player->angle\s*<\s*3\s*\*\s*ANGLES\s*\/\s*8[\s\S]*?checkx\s*=\s*player->tilex[\s\S]*?checky\s*=\s*player->tiley\s*-\s*1[\s\S]*?dir\s*=\s*di_north[\s\S]*?elevatorok\s*=\s*false/.test(body),
    operatesDoor: /OperateDoor\s*\(\s*doornum\s*&\s*~0x80\s*\)/.test(body),
    pushwallBeforeElevator: body.indexOf("PushWall") >= 0 && body.indexOf("PushWall") < body.indexOf("ELEVATORTILE"),
    pushwallPassesDirection: /PushWall\s*\(\s*checkx\s*,\s*checky\s*,\s*dir\s*\)/.test(body),
    pushwallUsesObjectPlane: /mapsegs\s*\[\s*1\s*\][\s\S]*?PUSHABLETILE/.test(body),
    secretLevelFromAltElevator: /ALTELEVATORTILE[\s\S]*?playstate\s*=\s*ex_secretlevel/.test(body),
    southTarget: /else\s*\{[\s\S]*?checkx\s*=\s*player->tilex[\s\S]*?checky\s*=\s*player->tiley\s*\+\s*1[\s\S]*?dir\s*=\s*di_south[\s\S]*?elevatorok\s*=\s*false/.test(body),
    westTarget: /player->angle\s*<\s*5\s*\*\s*ANGLES\s*\/\s*8[\s\S]*?checkx\s*=\s*player->tilex\s*-\s*1[\s\S]*?checky\s*=\s*player->tiley[\s\S]*?dir\s*=\s*di_west[\s\S]*?elevatorok\s*=\s*true/.test(body)
  };
}

function parseSourceTPlayerContract(body) {
  return {
    attackButtonStartsFireWhenNotHeld:
      /buttonstate\s*\[\s*bt_attack\s*\]\s*&&\s*!\s*buttonheld\s*\[\s*bt_attack\s*\][\s\S]*?Cmd_Fire\s*\(\s*\)/.test(body),
    controlAfterCommands: /Cmd_Fire\s*\(\s*\)[\s\S]*?ControlMovement\s*\(\s*ob\s*\)/.test(body),
    secondVictoryCheckAfterMovement: /ControlMovement\s*\(\s*ob\s*\)[\s\S]*?if\s*\(\s*gamestate\.victoryflag\s*\)[\s\S]*?return/.test(body),
    updateFaceBeforeWeaponChange: /UpdateFace\s*\(\s*\)[\s\S]*?CheckWeaponChange\s*\(\s*\)/.test(body),
    useButtonCallsCmdUse: /buttonstate\s*\[\s*bt_use\s*\][\s\S]*?Cmd_Use\s*\(\s*\)/.test(body),
    victoryBeforeFace: /if\s*\(\s*gamestate\.victoryflag\s*\)[\s\S]*?VictorySpin\s*\(\s*\)[\s\S]*?return[\s\S]*?UpdateFace\s*\(\s*\)/.test(body),
    weaponChangeBeforeUse: /CheckWeaponChange\s*\(\s*\)[\s\S]*?buttonstate\s*\[\s*bt_use\s*\]/.test(body)
  };
}

function parseSourcePlayerMovementContracts(text, defines) {
  const activeText = filterWl6Source(text);
  const checkWeaponBody = extractCFunctionBody(activeText, "CheckWeaponChange");
  const movementBody = extractCFunctionBody(activeText, "ControlMovement");
  const thrustBody = extractCFunctionBody(activeText, "Thrust");
  const clipBody = extractCFunctionBody(activeText, "ClipMove");
  const tryMoveBody = extractCFunctionBody(activeText, "TryMove");
  const contracts = new Map();
  contracts.set("CheckWeaponChange", parseSourceCheckWeaponChangeContract(checkWeaponBody));
  contracts.set("ControlMovement", parseSourceControlMovementContract(movementBody, defines));
  contracts.set("Thrust", parseSourceThrustContract(thrustBody, defines));
  contracts.set("ClipMove", parseSourceClipMoveContract(clipBody));
  contracts.set("TryMove", parseSourceTryMoveContract(tryMoveBody, defines));
  return contracts;
}

function parseSourceCheckWeaponChangeContract(body) {
  return {
    iteratesKnifeToBestWeapon: /for\s*\(\s*i\s*=\s*wp_knife\s*;\s*i\s*<=\s*gamestate\.bestweapon/.test(body),
    returnsWhenNoAmmo: /!\s*gamestate\.ammo[\s\S]*?return/.test(body),
    selectsByWeaponReadyButton: /buttonstate\s*\[\s*bt_readyknife\s*\+\s*i\s*-\s*wp_knife\s*\]/.test(body),
    setsWeaponAndChosen: /gamestate\.weapon\s*=\s*gamestate\.chosenweapon\s*=\s*i/.test(body)
  };
}

function parseSourceControlMovementContract(body, defines) {
  return {
    appliesTurnAngleUnits: /ob->angle\s*-=\s*angleunits/.test(body),
    backMoveScale: resolveSourceDefine("BACKMOVESCALE", defines),
    backwardUsesHalfTurn: /controly\s*>\s*0[\s\S]*?angle\s*=\s*ob->angle\s*\+\s*ANGLES\s*\/\s*2[\s\S]*?Thrust\s*\(\s*angle\s*,\s*controly\s*\*\s*BACKMOVESCALE\s*\)/.test(body),
    forwardMoveScale: resolveSourceDefine("MOVESCALE", defines),
    forwardUsesCurrentAngle: /controly\s*<\s*0[\s\S]*?Thrust\s*\(\s*ob->angle\s*,\s*-\s*controly\s*\*\s*MOVESCALE\s*\)/.test(body),
    negativeStrafeQuarterTurn: /controlx\s*<\s*0[\s\S]*?angle\s*=\s*ob->angle\s*\+\s*ANGLES\s*\/\s*4[\s\S]*?Thrust\s*\(\s*angle\s*,\s*-\s*controlx\s*\*\s*MOVESCALE\s*\)/.test(body),
    normalizesTurnAngle: /ob->angle\s*>=\s*ANGLES[\s\S]*?ob->angle\s*-=\s*ANGLES[\s\S]*?ob->angle\s*<\s*0[\s\S]*?ob->angle\s*\+=\s*ANGLES/.test(body),
    positiveStrafeQuarterTurn: /controlx\s*>\s*0[\s\S]*?angle\s*=\s*ob->angle\s*-\s*ANGLES\s*\/\s*4[\s\S]*?Thrust\s*\(\s*angle\s*,\s*controlx\s*\*\s*MOVESCALE\s*\)/.test(body),
    resetsThrustSpeed: /\bthrustspeed\s*=\s*0/.test(body),
    strafeUsesButton: /buttonstate\s*\[\s*bt_strafe\s*\]/.test(body),
    turnAngleScale: resolveSourceDefine("ANGLESCALE", defines),
    usesAnglefracAccumulator: /anglefrac\s*\+=\s*controlx[\s\S]*?angleunits\s*=\s*anglefrac\s*\/\s*ANGLESCALE[\s\S]*?anglefrac\s*-=\s*angleunits\s*\*\s*ANGLESCALE/.test(body)
  };
}

function parseSourceThrustContract(body, defines) {
  const minDist = resolveSourceDefine("MINDIST", defines);
  return {
    addsThrustSpeed: /\bthrustspeed\s*\+=\s*speed/.test(body),
    callsClipMove: /ClipMove\s*\(\s*player\s*,\s*xmove\s*,\s*ymove\s*\)/.test(body),
    checksVictoryAfterClipMove: /ClipMove\s*\(\s*player\s*,\s*xmove\s*,\s*ymove\s*\)[\s\S]*?EXITTILE[\s\S]*?VictoryTile\s*\(\s*\)/.test(body),
    speedClipMaxFixed: minDist * 2 - 1,
    speedClipThresholdFixed: minDist * 2,
    usesCosForXMove: /xmove\s*=\s*FixedByFrac\s*\(\s*speed\s*,\s*costable\s*\[\s*angle\s*\]\s*\)/.test(body),
    usesSineForYMove: /ymove\s*=\s*-\s*FixedByFrac\s*\(\s*speed\s*,\s*sintable\s*\[\s*angle\s*\]\s*\)/.test(body)
  };
}

function parseSourceClipMoveContract(body) {
  return {
    fullMoveFirst: /ob->x\s*=\s*basex\s*\+\s*xmove[\s\S]*?ob->y\s*=\s*basey\s*\+\s*ymove[\s\S]*?TryMove\s*\(\s*ob\s*\)/.test(body),
    restoresBaseOnFullBlock: /ob->x\s*=\s*basex\s*;\s*ob->y\s*=\s*basey/.test(body),
    slidesXBeforeY:
      /ob->x\s*=\s*basex\s*\+\s*xmove\s*;\s*ob->y\s*=\s*basey\s*;[\s\S]*?TryMove\s*\(\s*ob\s*\)[\s\S]*?ob->x\s*=\s*basex\s*;\s*ob->y\s*=\s*basey\s*\+\s*ymove/.test(
        body
      ),
    wallHitSound: body.match(/SD_PlaySound\s*\(\s*(HITWALLSND)\s*\)/)?.[1] ?? null,
    wallSoundRequiresNoSoundPlaying: /!\s*SD_SoundPlaying\s*\(\s*\)[\s\S]*?SD_PlaySound\s*\(\s*HITWALLSND\s*\)/.test(body)
  };
}

function parseSourceTryMoveContract(body, defines) {
  return {
    blocksShootableActors: /check\s*>\s*objlist[\s\S]*?check->flags\s*&\s*FL_SHOOTABLE[\s\S]*?return\s+false/.test(body),
    blocksSolidTiles: /check\s*=\s*actorat\s*\[\s*x\s*\]\s*\[\s*y\s*\][\s\S]*?check\s*&&\s*check\s*<\s*objlist[\s\S]*?return\s+false/.test(body),
    expandsActorSearch: /if\s*\(\s*yl\s*>\s*0\s*\)\s*yl--[\s\S]*?if\s*\(\s*yh\s*<\s*MAPSIZE\s*-\s*1\s*\)\s*yh\+\+[\s\S]*?if\s*\(\s*xl\s*>\s*0\s*\)\s*xl--[\s\S]*?if\s*\(\s*xh\s*<\s*MAPSIZE\s*-\s*1\s*\)\s*xh\+\+/.test(body),
    minActorDistanceFixed: resolveSourceDefine("MINACTORDIST", defines),
    playerSizeFixed: resolveSourceDefine("MINDIST", defines),
    usesAxisAlignedActorDistance: /deltax\s*=\s*ob->x\s*-\s*check->x[\s\S]*?deltay\s*=\s*ob->y\s*-\s*check->y/.test(body)
  };
}

function parseSourceAgentHelperContracts(text, defines) {
  const helpers = new Map();
  helpers.set("GiveAmmo", parseSourceGiveAmmoContract(extractCFunctionBody(text, "GiveAmmo")));
  helpers.set("GiveExtraMan", parseSourceGiveExtraManContract(extractCFunctionBody(text, "GiveExtraMan")));
  helpers.set("GiveKey", parseSourceGiveKeyContract(extractCFunctionBody(text, "GiveKey")));
  helpers.set("GivePoints", parseSourceGivePointsContract(extractCFunctionBody(text, "GivePoints"), defines));
  helpers.set("GiveWeapon", parseSourceGiveWeaponContract(extractCFunctionBody(text, "GiveWeapon")));
  helpers.set("HealSelf", parseSourceHealSelfContract(extractCFunctionBody(text, "HealSelf")));
  return helpers;
}

function parseSourceGiveAmmoContract(body) {
  return {
    maxAmmo: parseRequiredNumber(body, /gamestate\.ammo\s*>\s*([0-9]+)/, "GiveAmmo max ammo"),
    restoresWeaponWhenAmmoEmptyAndNotAttacking:
      /if\s*\(\s*!gamestate\.ammo\s*\)[\s\S]*if\s*\(\s*!gamestate\.attackframe\s*\)[\s\S]*gamestate\.weapon\s*=\s*gamestate\.chosenweapon/.test(body)
  };
}

function parseSourceGiveExtraManContract(body) {
  return {
    maxLives: parseRequiredNumber(body, /gamestate\.lives\s*<\s*([0-9]+)/, "GiveExtraMan max lives"),
    sound: body.match(/SD_PlaySound\s*\(\s*([A-Z0-9_]+)\s*\)/)?.[1] ?? null
  };
}

function parseSourceGiveKeyContract(body) {
  return {
    orKeyBit: /gamestate\.keys\s*\|=\s*\(\s*1\s*<<\s*key\s*\)/.test(body)
  };
}

function parseSourceGivePointsContract(body, defines) {
  const extraSymbol = body.match(/gamestate\.nextextra\s*\+=\s*([A-Z0-9_]+)/)?.[1] ?? null;
  return {
    addsScore: /gamestate\.score\s*\+=\s*points/.test(body),
    callsExtraMan: /\bGiveExtraMan\s*\(/.test(body),
    extraPoints: resolveSourceDefine(extraSymbol, defines),
    loopsExtraLives: /while\s*\(\s*gamestate\.score\s*>=\s*gamestate\.nextextra\s*\)/.test(body)
  };
}

function parseSourceGiveWeaponContract(body) {
  const normalized = body.replace(/\s+/g, " ");
  return {
    ammoGrant: parseRequiredNumber(body, /GiveAmmo\s*\(\s*([0-9]+)\s*\)/, "GiveWeapon ammo grant"),
    setsChosenWeaponOnUpgrade: /gamestate\.chosenweapon\s*=\s*weapon/.test(normalized),
    setsCurrentWeaponOnUpgrade: /gamestate\.weapon\s*=\s*gamestate\.chosenweapon\s*=\s*weapon/.test(normalized),
    setsBestWeaponOnUpgrade: /gamestate\.bestweapon\s*=\s*gamestate\.weapon\s*=/.test(normalized),
    upgradesOnlyWhenBetter: /gamestate\.bestweapon\s*<\s*weapon/.test(body)
  };
}

function parseSourceHealSelfContract(body) {
  return {
    clearsGotgatgun: /gotgatgun\s*=\s*0/.test(body),
    maxHealth: parseRequiredNumber(body, /gamestate\.health\s*>\s*([0-9]+)/, "HealSelf max health")
  };
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

function parseSourceBonusRewards(text) {
  const body = extractCFunctionBody(filterWl6Source(text), "GetBonus");
  const switchBody = extractFirstSwitchBody(body, "GetBonus");
  return parseSourceCaseGroups(switchBody, (item, caseBody) => parseSourceBonusReward(item, caseBody));
}

function parseSourceBonusReward(item, body) {
  const reward = createEmptyBonusReward();
  reward.condition = parseSourceBonusCondition(body);
  reward.sound = body.match(/SD_PlaySound\s*\(\s*([A-Z0-9_]+)\s*\)/)?.[1] ?? null;
  reward.heal = parseOptionalNumber(body, /HealSelf\s*\(\s*([0-9]+)\s*\)/);
  reward.ammo = parseOptionalNumber(body, /GiveAmmo\s*\(\s*([0-9]+)\s*\)/);
  reward.weapon = normalizeWeaponSymbol(body.match(/GiveWeapon\s*\(\s*(wp_[a-z0-9_]+)\s*\)/)?.[1] ?? null);
  reward.key = /GiveKey\s*\(\s*check->itemnumber\s*-\s*bo_key1\s*\)/.test(body) ? "item-bo_key1" : null;
  reward.score = parseOptionalNumber(body, /GivePoints\s*\(\s*([0-9]+)\s*\)/);
  reward.extraLife = /\bGiveExtraMan\s*\(/.test(body);
  reward.treasure = /gamestate\.treasurecount\s*\+\+/.test(body);
  return reward;
}

function parseSourceBonusCondition(body) {
  if (/gamestate\.health\s*==\s*100/.test(body)) {
    return "health<100";
  }

  if (/gamestate\.health\s*>\s*10/.test(body)) {
    return "health<=10";
  }

  if (/gamestate\.ammo\s*==\s*99/.test(body)) {
    return "ammo<99";
  }

  return null;
}

function parseSourceTreasureScores(text) {
  const body = extractCFunctionBody(filterWl6Source(text), "GetBonus");
  const switchBody = extractFirstSwitchBody(body, "GetBonus");
  const scores = new Map();
  for (const block of parseSourceCaseBlocks(switchBody)) {
    const scoreMatch = block.body.match(/GivePoints\s*\(\s*([0-9]+)\s*\)/);
    if (!scoreMatch) {
      continue;
    }

    scores.set(block.label, Number(scoreMatch[1]));
  }

  return scores;
}

function parseSourceKillActorRewards(text) {
  const body = extractCFunctionBody(filterWl6Source(text), "KillActor");
  const switchBody = extractFirstSwitchBody(body, "KillActor");
  const rewards = new Map();
  for (const block of parseSourceCaseBlocks(switchBody)) {
    const kind = SOURCE_KILL_CLASS_TO_TYPESCRIPT_KIND.get(block.label);
    if (!kind) {
      continue;
    }

    const scoreMatch = block.body.match(/GivePoints\s*\(\s*([0-9]+)\s*\)/);
    if (!scoreMatch) {
      throw new Error(`Could not parse KillActor GivePoints for ${block.label}`);
    }

    const drops = [...block.body.matchAll(/PlaceItemType\s*\(\s*(bo_[A-Za-z0-9_]+)/g)].map((match) => match[1]);
    rewards.set(kind, {
      drop: drops.length > 0 ? uniqueList(drops).join("|") : null,
      score: Number(scoreMatch[1])
    });
  }

  return rewards;
}

function parseSourceDamageActorContract(text) {
  const body = extractCFunctionBody(filterWl6Source(text), "DamageActor");
  return {
    callsFirstSightingWhenNotAttackMode: /!\s*\(\s*ob->flags\s*&\s*FL_ATTACKMODE\s*\)[\s\S]*FirstSighting\s*\(\s*ob\s*\)/.test(body),
    doublesDamageWhenNotAttackMode: /!\s*\(\s*ob->flags\s*&\s*FL_ATTACKMODE\s*\)[\s\S]*damage\s*<<=\s*1/.test(body),
    killsAtZeroOrBelow: /ob->hitpoints\s*<=\s*0[\s\S]*KillActor\s*\(\s*ob\s*\)/.test(body),
    marksNoise: /madenoise\s*=\s*true/.test(body),
    painStateUsesHitpointParity: /ob->hitpoints\s*&\s*1/.test(body),
    subtractsDamage: /ob->hitpoints\s*-=\s*damage/.test(body)
  };
}

function parseSourceDamagePainStates(text) {
  const body = extractCFunctionBody(filterWl6Source(text), "DamageActor");
  const switchBody = extractFirstSwitchBody(body, "DamageActor");
  const states = new Map();
  for (const block of parseSourceCaseBlocks(switchBody)) {
    const kind = SOURCE_KILL_CLASS_TO_TYPESCRIPT_KIND.get(block.label);
    if (!kind) {
      continue;
    }

    const matches = [...block.body.matchAll(/NewState\s*\(\s*ob\s*,\s*&\s*(s_[A-Za-z0-9_]+)\s*\)/g)].map(
      (match) => match[1]
    );
    if (matches.length > 0) {
      states.set(kind, matches);
    }
  }

  return states;
}

function parseSourceWeaponReadySprites(text, sprites) {
  const start = text.indexOf("weaponscale[NUMWEAPONS]");
  if (start < 0) {
    throw new Error("Could not find weaponscale[NUMWEAPONS] in WL_DRAW.C");
  }

  const match = text.slice(start).match(/\{([^}]+)\}/);
  if (!match) {
    throw new Error("Could not parse weaponscale[] initializer in WL_DRAW.C");
  }

  return [...match[1].matchAll(/\b(SPR_[A-Z0-9_]+)\b/g)].map((shape) => resolveSourceShape(shape[1], sprites));
}

function parseSourceElevatorBackTo(text) {
  const match = text.match(/int\s+ElevatorBackTo\[\]\s*=\s*\{([^}]+)\}/);
  if (!match) {
    throw new Error("Could not find ElevatorBackTo[] in WL_GAME.C");
  }

  return parseNumberList(match[1]);
}

function parseSourceParTimesSeconds(text) {
  const activeText = filterWl6Source(text);
  const start = activeText.indexOf("times parTimes[]");
  if (start < 0) {
    throw new Error("Could not find parTimes[] in WL_INTER.C");
  }

  const end = activeText.indexOf("};", start);
  if (end < 0) {
    throw new Error("Could not find parTimes[] terminator in WL_INTER.C");
  }

  const entries = [];
  for (const match of activeText.slice(start, end).matchAll(/\{\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*"[^"]+"\s*\}/g)) {
    entries.push(Math.round(Number(match[1]) * 60));
  }

  return entries;
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

function parseTypescriptSoundChunks(text) {
  const objectMatch = text.match(/const SOURCE_SOUND_CHUNKS:\s*Record<SourceSoundName,\s*number>\s*=\s*\{(?<body>[\s\S]*?)\};/);
  if (!objectMatch?.groups?.body) {
    throw new Error("Could not find SOURCE_SOUND_CHUNKS in source-typescript main.ts");
  }

  const sounds = new Map();
  for (const match of objectMatch.groups.body.matchAll(/\b([A-Z0-9_]+SND):\s*([0-9]+),?/g)) {
    sounds.set(match[1], Number(match[2]));
  }

  return sounds;
}

function parseTypescriptElevatorBackTo(text, constants) {
  const match = text.match(/const ELEVATOR_BACK_TO\s*=\s*\[(?<body>[^\]]+)\]\s*as const;/);
  if (!match?.groups?.body) {
    throw new Error("Could not find ELEVATOR_BACK_TO in source-typescript main.ts");
  }

  return match.groups.body.split(",").map((part) => resolveTypescriptNumber(part, constants));
}

function parseTypescriptParTimesSeconds(text, constants) {
  const match = text.match(/const WL6_PAR_TIMES_SECONDS\s*=\s*\[(?<body>[\s\S]*?)\]\s*as const;/);
  if (!match?.groups?.body) {
    throw new Error("Could not find WL6_PAR_TIMES_SECONDS in source-typescript main.ts");
  }

  return match.groups.body.split(",").filter((part) => part.trim()).map((part) => resolveTypescriptNumber(part, constants));
}

function parseTypescriptWeaponReadySprites(text, constants) {
  const match = text.match(/const WEAPON_READY_SPRITES\s*=\s*\[(?<body>[^\]]+)\]\s*as const;/);
  if (!match?.groups?.body) {
    throw new Error("Could not find WEAPON_READY_SPRITES in source-typescript main.ts");
  }

  return match.groups.body.split(",").map((part) => resolveTypescriptNumber(part, constants));
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

function parseTypescriptPlayerAttackContracts(text, constants, stringConstants) {
  const cmdFireBody = extractTypescriptFunctionBody(text, "Cmd_Fire");
  const knifeBody = extractTypescriptFunctionBody(text, "RunKnifeAttackFrame");
  const gunBody = extractTypescriptFunctionBody(text, "RunGunAttackFrame");
  const targetBody = extractTypescriptFunctionBody(text, "TargetActorInCrosshair");
  const distanceBody = extractTypescriptFunctionBody(text, "ActorTileDistance");
  const attackBody = extractTypescriptFunctionBody(text, "T_Attack");
  const finishBody = extractTypescriptFunctionBody(text, "FinishAttack");
  const weaponSoundBody = extractTypescriptFunctionBody(text, "weaponAttackSound");
  const contracts = new Map();
  contracts.set("Cmd_Fire", parseTypescriptCmdFireContract(cmdFireBody));
  contracts.set("KnifeAttack", parseTypescriptKnifeAttackContract(text, knifeBody, targetBody, constants));
  contracts.set(
    "GunAttackFrame",
    parseTypescriptGunAttackFrameContract(gunBody, targetBody, distanceBody, weaponSoundBody, stringConstants)
  );
  contracts.set("AttackLoop", parseTypescriptAttackLoopContract(attackBody, finishBody));
  return contracts;
}

function parseTypescriptCmdFireContract(body) {
  return {
    attackCountFromAttackInfo: /this\.gamestate\.attackcount\s*=\s*firstFrame\.tics/.test(body),
    holdsAttackButton: /this\.attackButtonHeld\s*=\s*true/.test(body),
    resetsAttackFrame: /this\.gamestate\.attackframe\s*=\s*0/.test(body),
    resetsWeaponFrame: /this\.gamestate\.weaponframe\s*=\s*0/.test(body),
    weaponFrameFromAttackInfo: /this\.gamestate\.weaponframe\s*=\s*firstFrame\.frame/.test(body)
  };
}

function parseTypescriptKnifeAttackContract(text, knifeBody, targetBody, constants) {
  return {
    damageShift: parseRequiredNumber(knifeBody, /this\.US_RndT\s*\(\s*\)\s*>>\s*([0-9]+)/, "RunKnifeAttackFrame damage shift"),
    filtersCentered: /Math\.abs\s*\(\s*screenX\s*-\s*SCREEN_WIDTH\s*\/\s*2\s*\)\s*>\s*SHOOT_CENTER_DELTA_PIXELS/.test(targetBody),
    filtersShootable: /!\s*actor\.shootable/.test(targetBody),
    filtersVisible: /!\s*actor\.visible/.test(targetBody),
    lineCheck: /\bCheckLineToActor\s*\(/.test(knifeBody),
    maxRangeFixed: parseTypescriptFixedRangeConstant(text, "KNIFE_RANGE_TILES", constants),
    selectsNearest: /depth\s*<\s*bestDepth[\s\S]*?bestTarget\s*=\s*\{\s*actor,\s*depth\s*\}/.test(targetBody),
    sound: knifeBody.match(/SD_PlaySound\s*\(\s*"([^"]+)"\s*\)/)?.[1] ?? null
  };
}

function parseTypescriptGunAttackFrameContract(gunBody, targetBody, distanceBody, weaponSoundBody, stringConstants) {
  return {
    callsDamageActor: /this\.DamageActor\s*\(\s*target\.actor\s*,\s*damage\s*\)/.test(gunBody),
    chaingunSound: parseTypescriptSwitchReturnString(weaponSoundBody, "WP_CHAINGUN", stringConstants),
    checksLine: /\bthis\.CheckLineToActor\s*\(\s*target\.actor\s*\)/.test(gunBody),
    closeDamageDivisor: parseRequiredNumber(
      gunBody,
      /if\s*\(\s*dist\s*<\s*[0-9]+\s*\)\s*\{[\s\S]*?Math\.floor\s*\(\s*this\.US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)\s*\)/,
      "RunGunAttackFrame close damage divisor"
    ),
    closeDistance: parseRequiredNumber(gunBody, /if\s*\(\s*dist\s*<\s*([0-9]+)\s*\)/, "RunGunAttackFrame close distance"),
    distanceUsesMaxTileDelta:
      /Math\.max\s*\([\s\S]*?Math\.abs\s*\(\s*this\.ActorSourceTileX\s*\(\s*actor\s*\)\s*-\s*playerTileX\s*\)[\s\S]*?Math\.abs\s*\(\s*this\.ActorSourceTileY\s*\(\s*actor\s*\)\s*-\s*playerTileY\s*\)/.test(distanceBody),
    farDamageDivisor: parseRequiredNumber(
      gunBody,
      /Math\.floor\s*\(\s*this\.US_RndT\s*\(\s*\)\s*\/\s*[0-9]+\s*\)\s*<\s*dist[\s\S]*?return\s*;[\s\S]*?damage\s*=\s*Math\.floor\s*\(\s*this\.US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)\s*\)/,
      "RunGunAttackFrame far damage divisor"
    ),
    farMissDivisor: parseRequiredNumber(
      gunBody,
      /Math\.floor\s*\(\s*this\.US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)\s*\)\s*<\s*dist/,
      "RunGunAttackFrame far miss divisor"
    ),
    filtersCentered: /Math\.abs\s*\(\s*screenX\s*-\s*SCREEN_WIDTH\s*\/\s*2\s*\)\s*>\s*SHOOT_CENTER_DELTA_PIXELS/.test(targetBody),
    filtersShootable: /!\s*actor\.shootable/.test(targetBody),
    filtersVisible: /!\s*actor\.visible/.test(targetBody),
    machinegunSound: parseTypescriptSwitchReturnString(weaponSoundBody, "WP_MACHINEGUN", stringConstants),
    marksNoise: /this\.madeNoise\s*=\s*true/.test(gunBody),
    mediumDamageDivisor: parseRequiredNumber(
      gunBody,
      /else\s+if\s*\(\s*dist\s*<\s*[0-9]+\s*\)\s*\{[\s\S]*?Math\.floor\s*\(\s*this\.US_RndT\s*\(\s*\)\s*\/\s*([0-9]+)\s*\)/,
      "RunGunAttackFrame medium damage divisor"
    ),
    mediumDistance: parseRequiredNumber(gunBody, /else\s+if\s*\(\s*dist\s*<\s*([0-9]+)\s*\)/, "RunGunAttackFrame medium distance"),
    noAmmoAdvancesAttackFrame: /this\.gamestate\.ammo\s*===\s*0[\s\S]*?this\.gamestate\.attackframe\s*\+=\s*1/.test(gunBody),
    pistolSound: parseTypescriptSwitchReturnString(weaponSoundBody, "WP_PISTOL", stringConstants),
    selectsNearest: /depth\s*<\s*bestDepth[\s\S]*?bestTarget\s*=\s*\{\s*actor,\s*depth\s*\}/.test(targetBody),
    spendsAmmoOnGunFrame: /this\.gamestate\.ammo\s*-=\s*1/.test(gunBody)
  };
}

function parseTypescriptAttackLoopContract(attackBody, finishBody) {
  return {
    advancesAttackCountByFrameTics: /this\.gamestate\.attackcount\s*\+=\s*current\.tics/.test(attackBody),
    advancesAttackFrame: /this\.gamestate\.attackframe\s*\+=\s*1/.test(attackBody),
    attack4RequiresAmmo: /current\.attack\s*===\s*4[\s\S]*?this\.gamestate\.ammo\s*>\s*0/.test(attackBody),
    chainRefireAttack4: /current\.attack\s*===\s*4[\s\S]*?attackDown[\s\S]*?this\.gamestate\.attackframe\s*-=\s*2/.test(attackBody),
    finishNoAmmoWeaponKnife: /this\.gamestate\.ammo\s*===\s*0[\s\S]*?this\.gamestate\.weapon\s*=\s*WP_KNIFE/.test(finishBody),
    finishRestoresChosenWeapon:
      /this\.gamestate\.weapon\s*!==\s*this\.gamestate\.chosenweapon[\s\S]*?this\.gamestate\.weapon\s*=\s*this\.gamestate\.chosenweapon/.test(
        finishBody
      ),
    finishSentinel: /current\.attack\s*===\s*-1[\s\S]*?this\.FinishAttack\s*\(\s*\)/.test(attackBody),
    gunFrameOnAttack1: /current\.attack\s*===\s*1[\s\S]*?this\.RunGunAttackFrame\s*\(\s*\)/.test(attackBody),
    knifeFrameOnAttack2: /current\.attack\s*===\s*2[\s\S]*?this\.RunKnifeAttackFrame\s*\(\s*\)/.test(attackBody),
    refireAttack3: /current\.attack\s*===\s*3[\s\S]*?this\.gamestate\.ammo\s*>\s*0\s*&&\s*attackDown[\s\S]*?this\.gamestate\.attackframe\s*-=\s*2/.test(
      attackBody
    ),
    weaponFrameFromAttackInfo:
      /this\.gamestate\.weaponframe\s*=[\s\S]*?attackInfo\?\.\[\s*this\.gamestate\.attackframe\s*\][\s\S]*?\.frame/.test(
        attackBody
      )
  };
}

function parseTypescriptSwitchReturnString(body, label, stringConstants) {
  const match = body.match(new RegExp(`case\\s+${label}\\s*:[\\s\\S]*?return\\s+([^;]+);`));
  return match ? resolveTypescriptString(match[1], stringConstants) : null;
}

function parseTypescriptPlayerCommandContracts(text, stringConstants) {
  const cmdUseBody = extractTypescriptFunctionBody(text, "Cmd_Use");
  const useTargetBody = extractTypescriptFunctionBody(text, "UseTarget");
  const inputBody = extractTypescriptFunctionBody(text, "PlayPlayerInput");
  const contracts = new Map();
  contracts.set("Cmd_Use", parseTypescriptCmdUseContract(cmdUseBody, useTargetBody, stringConstants));
  contracts.set("T_Player", parseTypescriptTPlayerContract(inputBody));
  return contracts;
}

function parseTypescriptCmdUseContract(cmdUseBody, useTargetBody, stringConstants) {
  const levelDoneSoundMatch = cmdUseBody.match(/SD_PlaySound\s*\(\s*([^)]*LEVELDONESND[^)]*)\)/);
  const noActionSoundMatch = cmdUseBody.match(/SD_PlaySound\s*\(\s*([^)]*DONOTHINGSND[^)]*)\)/);
  return {
    completedLevelOtherwise: /:\s*"ex_completed"/.test(cmdUseBody),
    doorRequiresUseNotHeld: /if\s*\(\s*!\s*this\.useButtonHeld\s*&&\s*door\s*\)/.test(cmdUseBody),
    doorUsesDoorMarker: /\bthis\.DoorAt\s*\(\s*target\.x\s*,\s*target\.y\s*\)/.test(cmdUseBody),
    eastTarget: /angle\s*<\s*SOURCE_ANGLES\s*\/\s*8\s*\|\|\s*angle\s*>\s*\(\s*SOURCE_ANGLES\s*\*\s*7\s*\)\s*\/\s*8[\s\S]*?dir:\s*"east"[\s\S]*?elevatorOk:\s*true[\s\S]*?x:\s*tileX\s*\+\s*1[\s\S]*?y:\s*tileY/.test(useTargetBody),
    elevatorRequiresElevatorTile: /wallTile\s*===\s*ELEVATORTILE/.test(cmdUseBody),
    elevatorRequiresHorizontalTarget: /&&\s*target\.elevatorOk/.test(cmdUseBody),
    elevatorRequiresUseNotHeld: /!\s*this\.useButtonHeld\s*&&\s*wallTile\s*===\s*ELEVATORTILE/.test(cmdUseBody),
    flipsElevatorSwitch: /this\.SetWallTile\s*\(\s*target\.x\s*,\s*target\.y\s*,\s*ELEVATORTILE\s*\+\s*1\s*\)/.test(cmdUseBody),
    holdsUseOnDoor: /if\s*\(\s*!\s*this\.useButtonHeld\s*&&\s*door\s*\)[\s\S]*?this\.useButtonHeld\s*=\s*true[\s\S]*?this\.OperateDoor/.test(cmdUseBody),
    holdsUseOnElevator:
      /wallTile\s*===\s*ELEVATORTILE[\s\S]*?this\.useButtonHeld\s*=\s*true/.test(cmdUseBody),
    levelDoneSound: levelDoneSoundMatch ? resolveTypescriptString(levelDoneSoundMatch[1], stringConstants) : null,
    noActionSound: noActionSoundMatch ? resolveTypescriptString(noActionSoundMatch[1], stringConstants) : null,
    northTarget: /angle\s*<\s*\(\s*SOURCE_ANGLES\s*\*\s*3\s*\)\s*\/\s*8[\s\S]*?dir:\s*"north"[\s\S]*?elevatorOk:\s*false[\s\S]*?x:\s*tileX[\s\S]*?y:\s*tileY\s*-\s*1/.test(useTargetBody),
    operatesDoor: /this\.OperateDoor\s*\(\s*door\.index\s*\)/.test(cmdUseBody),
    pushwallBeforeElevator: cmdUseBody.indexOf("PushWall") >= 0 && cmdUseBody.indexOf("PushWall") < cmdUseBody.indexOf("ELEVATORTILE"),
    pushwallPassesDirection: /this\.PushWall\s*\(\s*target\.x\s*,\s*target\.y\s*,\s*target\.dir\s*\)/.test(cmdUseBody),
    pushwallUsesObjectPlane: /this\.map\.objects\s*\[[^\]]+\][\s\S]*?PUSHABLETILE/.test(cmdUseBody),
    secretLevelFromAltElevator: /PlayerFloorTile\s*\(\s*\)\s*===\s*ALTELEVATORTILE[\s\S]*?"ex_secretlevel"/.test(cmdUseBody),
    southTarget: /return\s*\{[\s\S]*?dir:\s*"south"[\s\S]*?elevatorOk:\s*false[\s\S]*?x:\s*tileX[\s\S]*?y:\s*tileY\s*\+\s*1/.test(useTargetBody),
    westTarget: /angle\s*<\s*\(\s*SOURCE_ANGLES\s*\*\s*5\s*\)\s*\/\s*8[\s\S]*?dir:\s*"west"[\s\S]*?elevatorOk:\s*true[\s\S]*?x:\s*tileX\s*-\s*1[\s\S]*?y:\s*tileY/.test(useTargetBody)
  };
}

function parseTypescriptTPlayerContract(body) {
  const readyBody = extractReadyPlayerInputBranch(body);
  return {
    attackButtonStartsFireWhenNotHeld: /attackDown\s*&&\s*!\s*this\.attackButtonHeld[\s\S]*?this\.Cmd_Fire\s*\(\s*\)/.test(readyBody),
    controlAfterCommands: /this\.Cmd_Fire\s*\(\s*\)[\s\S]*?this\.ControlMovement\s*\(\s*id_in\s*,\s*tics\s*\)/.test(readyBody),
    secondVictoryCheckAfterMovement:
      /this\.ControlMovement\s*\(\s*id_in\s*,\s*tics\s*\)[\s\S]*?if\s*\(\s*this\.gamestate\.victoryflag\s*\)[\s\S]*?return\s+moved/.test(
        readyBody
      ),
    updateFaceBeforeWeaponChange: /this\.UpdateFace\s*\(\s*tics\s*\)[\s\S]*?this\.CheckWeaponChange\s*\(\s*id_in\s*\)/.test(readyBody),
    useButtonCallsCmdUse: /if\s*\(\s*useDown\s*\)[\s\S]*?this\.Cmd_Use\s*\(\s*\)/.test(readyBody),
    victoryBeforeFace: /if\s*\(\s*this\.gamestate\.victoryflag\s*\)[\s\S]*?return\s+false[\s\S]*?this\.UpdateFace\s*\(\s*tics\s*\)/.test(readyBody),
    weaponChangeBeforeUse: /this\.CheckWeaponChange\s*\(\s*id_in\s*\)[\s\S]*?if\s*\(\s*useDown\s*\)/.test(readyBody)
  };
}

function extractReadyPlayerInputBranch(body) {
  const marker = "} else {";
  const start = body.indexOf(marker);
  if (start < 0) {
    throw new Error("Could not find ready-state PlayPlayerInput branch");
  }

  const openIndex = body.indexOf("{", start);
  if (openIndex < 0) {
    throw new Error("Could not find ready-state PlayPlayerInput opening brace");
  }

  return extractBraceBody(body, openIndex);
}

function parseTypescriptPlayerMovementContracts(text, constants, stringConstants) {
  const checkWeaponBody = extractTypescriptFunctionBody(text, "CheckWeaponChange");
  const movementBody = extractTypescriptFunctionBody(text, "ControlMovement");
  const thrustBody = extractTypescriptFunctionBody(text, "Thrust");
  const clipBody = extractTypescriptFunctionBody(text, "ClipMove");
  const tryMoveBody = extractTypescriptFunctionBody(text, "TryPlayerMove");
  const contracts = new Map();
  contracts.set("CheckWeaponChange", parseTypescriptCheckWeaponChangeContract(checkWeaponBody));
  contracts.set("ControlMovement", parseTypescriptControlMovementContract(movementBody, constants));
  contracts.set("Thrust", parseTypescriptThrustContract(thrustBody, constants));
  contracts.set("ClipMove", parseTypescriptClipMoveContract(clipBody, stringConstants));
  contracts.set("TryMove", parseTypescriptTryMoveContract(text, tryMoveBody, constants));
  return contracts;
}

function parseTypescriptCheckWeaponChangeContract(body) {
  return {
    iteratesKnifeToBestWeapon: /for\s*\(\s*let\s+weapon\s*=\s*WP_KNIFE\s*;\s*weapon\s*<=\s*this\.gamestate\.bestweapon/.test(body),
    returnsWhenNoAmmo: /this\.gamestate\.ammo\s*===\s*0[\s\S]*?return/.test(body),
    selectsByWeaponReadyButton: /id_in\.IN_KeyDown\s*\(\s*49\s*\+\s*weapon\s*\)/.test(body),
    setsWeaponAndChosen: /this\.gamestate\.weapon\s*=\s*weapon[\s\S]*?this\.gamestate\.chosenweapon\s*=\s*weapon/.test(body)
  };
}

function parseTypescriptControlMovementContract(body, constants) {
  return {
    appliesTurnAngleUnits: /this\.gamestate\.angle\s*\+=\s*sourceAngleUnitsToRadians\s*\(\s*angleUnits\s*\)/.test(body),
    backMoveScale: resolveTypescriptNumber("SOURCE_BACK_MOVESCALE", constants),
    backwardUsesHalfTurn: /controlY\s*>\s*0[\s\S]*?this\.Thrust\s*\(\s*this\.gamestate\.angle\s*\+\s*Math\.PI\s*,\s*controlY\s*\*\s*SOURCE_BACK_MOVESCALE\s*\)/.test(body),
    forwardMoveScale: resolveTypescriptNumber("SOURCE_FORWARD_MOVESCALE", constants),
    forwardUsesCurrentAngle: /controlY\s*<\s*0[\s\S]*?this\.Thrust\s*\(\s*this\.gamestate\.angle\s*,\s*-\s*controlY\s*\*\s*SOURCE_FORWARD_MOVESCALE\s*\)/.test(body),
    negativeStrafeQuarterTurn: /controlX\s*<\s*0[\s\S]*?this\.Thrust\s*\(\s*this\.gamestate\.angle\s*-\s*Math\.PI\s*\/\s*2\s*,\s*-\s*controlX\s*\*\s*SOURCE_FORWARD_MOVESCALE\s*\)/.test(body),
    normalizesTurnAngle: /this\.gamestate\.angle\s*=\s*normalizeAngle\s*\(\s*this\.gamestate\.angle\s*\)/.test(body),
    positiveStrafeQuarterTurn: /controlX\s*>\s*0[\s\S]*?this\.Thrust\s*\(\s*this\.gamestate\.angle\s*\+\s*Math\.PI\s*\/\s*2\s*,\s*controlX\s*\*\s*SOURCE_FORWARD_MOVESCALE\s*\)/.test(body),
    resetsThrustSpeed: /\bthis\.thrustSpeed\s*=\s*0/.test(body),
    strafeUsesButton: /id_in\.IN_KeyDown\s*\(\s*STRAFE_KEY_CODE\s*\)/.test(body),
    turnAngleScale: resolveTypescriptNumber("SOURCE_ANGLESCALE", constants),
    usesAnglefracAccumulator: /this\.anglefrac\s*\+=\s*controlX[\s\S]*?this\.anglefrac\s*\/\s*SOURCE_ANGLESCALE[\s\S]*?this\.anglefrac\s*-=\s*angleUnits\s*\*\s*SOURCE_ANGLESCALE/.test(body)
  };
}

function parseTypescriptThrustContract(body, constants) {
  const minDist = resolveTypescriptNumber("SOURCE_MINDIST", constants);
  return {
    addsThrustSpeed: /\bthis\.thrustSpeed\s*\+=\s*speed/.test(body),
    callsClipMove: /this\.ClipMove\s*\(\s*Math\.cos\s*\(\s*angle\s*\)\s*\*\s*moveScale\s*,\s*Math\.sin\s*\(\s*angle\s*\)\s*\*\s*moveScale\s*\)/.test(body),
    checksVictoryAfterClipMove: /this\.ClipMove\s*\([\s\S]*?\)[\s\S]*?this\.CheckVictoryTile\s*\(\s*\)/.test(body),
    speedClipMaxFixed: minDist * 2 - 1,
    speedClipThresholdFixed: minDist * 2,
    usesCosForXMove: /Math\.cos\s*\(\s*angle\s*\)\s*\*\s*moveScale/.test(body),
    usesSineForYMove: /Math\.sin\s*\(\s*angle\s*\)\s*\*\s*moveScale/.test(body)
  };
}

function parseTypescriptClipMoveContract(body, stringConstants) {
  const wallSoundMatch = body.match(/SD_PlaySound\s*\(\s*([^)]*HITWALLSND[^)]*)\)/);
  return {
    fullMoveFirst: /this\.TryPlayerMove\s*\(\s*targetX\s*,\s*targetY\s*\)[\s\S]*?this\.gamestate\.x\s*=\s*targetX[\s\S]*?this\.gamestate\.y\s*=\s*targetY/.test(body),
    restoresBaseOnFullBlock: /this\.gamestate\.x\s*=\s*baseX\s*;\s*this\.gamestate\.y\s*=\s*baseY/.test(body),
    slidesXBeforeY: body.indexOf("this.TryPlayerMove(targetX, baseY)") >= 0 &&
      body.indexOf("this.TryPlayerMove(baseX, targetY)") > body.indexOf("this.TryPlayerMove(targetX, baseY)"),
    wallHitSound: wallSoundMatch ? resolveTypescriptString(wallSoundMatch[1], stringConstants) : null,
    wallSoundRequiresNoSoundPlaying: /!\s*this\.id_sd\.SD_SoundPlaying\s*\(\s*\)[\s\S]*?this\.id_sd\.SD_PlaySound\s*\(\s*"HITWALLSND"\s*\)/.test(body)
  };
}

function parseTypescriptTryMoveContract(text, body, constants) {
  return {
    blocksShootableActors: /!\s*actor\.shootable[\s\S]*?continue[\s\S]*?return\s+false/.test(body),
    blocksSolidTiles: /this\.GetTile\s*\(\s*tileX\s*,\s*tileY\s*\)\s*!==\s*0[\s\S]*?this\.map\.blockingStaticKeys\.has/.test(body),
    expandsActorSearch: /actorTileX\s*<\s*xl\s*-\s*1[\s\S]*?actorTileX\s*>\s*xh\s*\+\s*1[\s\S]*?actorTileY\s*<\s*yl\s*-\s*1[\s\S]*?actorTileY\s*>\s*yh\s*\+\s*1/.test(body),
    minActorDistanceFixed: parseTypescriptFixedRangeConstant(text, "MINACTORDIST_TILES", constants),
    playerSizeFixed: parseTypescriptFixedRangeConstant(text, "SOURCE_PLAYERSIZE_TILES", constants),
    usesAxisAlignedActorDistance: /x\s*-\s*actorCenterX[\s\S]*?y\s*-\s*actorCenterY/.test(body)
  };
}

function parseTypescriptAgentHelperContracts(text, constants, stringConstants) {
  const helpers = new Map();
  helpers.set("GiveAmmo", parseTypescriptGiveAmmoContract(extractTypescriptFunctionBody(text, "GiveAmmo"), constants));
  helpers.set("GiveExtraMan", parseTypescriptGiveExtraManContract(extractTypescriptFunctionBody(text, "GiveExtraMan"), constants, stringConstants));
  helpers.set("GiveKey", parseTypescriptGiveKeyContract(extractTypescriptFunctionBody(text, "GiveKey")));
  helpers.set("GivePoints", parseTypescriptGivePointsContract(extractTypescriptFunctionBody(text, "GivePoints"), constants));
  helpers.set("GiveWeapon", parseTypescriptGiveWeaponContract(extractTypescriptFunctionBody(text, "GiveWeapon")));
  helpers.set("HealSelf", parseTypescriptHealSelfContract(extractTypescriptFunctionBody(text, "HealSelf"), constants));
  return helpers;
}

function parseTypescriptGiveAmmoContract(body, constants) {
  return {
    maxAmmo: parseRequiredTypescriptNumber(body, /Math\.min\(\s*([A-Z0-9_]+|[0-9]+)\s*,\s*this\.gamestate\.ammo/, constants, "GiveAmmo max ammo"),
    restoresWeaponWhenAmmoEmptyAndNotAttacking:
      /this\.gamestate\.ammo\s*===\s*0\s*&&\s*this\.gamestate\.attackframe\s*===\s*0[\s\S]*this\.gamestate\.weapon\s*=\s*this\.gamestate\.chosenweapon/.test(body)
  };
}

function parseTypescriptGiveExtraManContract(body, constants, stringConstants) {
  const soundMatch = body.match(/SD_PlaySound\(([^)]+)\)/);
  return {
    maxLives: parseRequiredTypescriptNumber(body, /this\.gamestate\.lives\s*<\s*([A-Z0-9_]+|[0-9]+)/, constants, "GiveExtraMan max lives"),
    sound: soundMatch ? resolveTypescriptString(soundMatch[1], stringConstants) : null
  };
}

function parseTypescriptGiveKeyContract(body) {
  return {
    orKeyBit: /this\.gamestate\.keys\s*\|=\s*1\s*<<\s*key/.test(body)
  };
}

function parseTypescriptGivePointsContract(body, constants) {
  return {
    addsScore: /this\.gamestate\.score\s*\+=\s*points/.test(body),
    callsExtraMan: /\bthis\.GiveExtraMan\(\)/.test(body),
    extraPoints: parseRequiredTypescriptNumber(body, /this\.gamestate\.nextextra\s*\+=\s*([A-Z0-9_]+|[0-9]+)/, constants, "GivePoints extra points"),
    loopsExtraLives: /while\s*\(\s*this\.gamestate\.score\s*>=\s*this\.gamestate\.nextextra\s*\)/.test(body)
  };
}

function parseTypescriptGiveWeaponContract(body) {
  return {
    ammoGrant: parseRequiredNumber(body, /this\.GiveAmmo\(\s*([0-9]+)\s*\)/, "GiveWeapon ammo grant"),
    setsChosenWeaponOnUpgrade: /this\.gamestate\.chosenweapon\s*=\s*weapon/.test(body),
    setsCurrentWeaponOnUpgrade: /this\.gamestate\.weapon\s*=\s*weapon/.test(body),
    setsBestWeaponOnUpgrade: /this\.gamestate\.bestweapon\s*=\s*weapon/.test(body),
    upgradesOnlyWhenBetter: /this\.gamestate\.bestweapon\s*<\s*weapon/.test(body)
  };
}

function parseTypescriptHealSelfContract(body, constants) {
  return {
    clearsGotgatgun: /this\.gotgatgun\s*=\s*false/.test(body),
    maxHealth: parseRequiredTypescriptNumber(body, /Math\.min\(\s*([A-Z0-9_]+|[0-9]+)\s*,\s*this\.gamestate\.health/, constants, "HealSelf max health")
  };
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

function parseTypescriptDoorPushwallContracts(text, constants, stringConstants) {
  const contracts = new Map();
  contracts.set("DoorOpen", parseTypescriptDoorOpenContract(extractTypescriptFunctionBody(text, "DoorOpen"), constants));
  contracts.set("DoorOpening", parseTypescriptDoorOpeningContract(extractTypescriptFunctionBody(text, "DoorOpening"), constants, stringConstants));
  contracts.set("DoorClosing", parseTypescriptDoorClosingContract(extractTypescriptFunctionBody(text, "DoorClosing"), constants));
  contracts.set("MoveDoors", parseTypescriptMoveDoorsContract(extractTypescriptFunctionBody(text, "MoveDoors")));
  contracts.set("OperateDoor", parseTypescriptOperateDoorContract(extractTypescriptFunctionBody(text, "OperateDoor"), stringConstants));
  contracts.set("PushWall", parseTypescriptPushWallContract(extractTypescriptFunctionBody(text, "PushWall"), stringConstants));
  contracts.set("MovePushWall", parseTypescriptMovePushWallContract(extractTypescriptFunctionBody(text, "MovePushWall")));
  return contracts;
}

function parseTypescriptDoorOpenContract(body, constants) {
  return {
    closeAfterTics: parseRequiredTypescriptNumber(body, /door\.ticcount\s*>=\s*([A-Z0-9_]+|[0-9]+)/, constants, "DoorOpen close tics"),
    closesWhenElapsed: /\bthis\.CloseDoor\s*\(\s*door\s*\)/.test(body)
  };
}

function parseTypescriptDoorOpeningContract(body, constants, stringConstants) {
  const soundMatch = body.match(/SD_PlaySound\(([^)]+)\)/);
  return {
    actionWhenComplete: `dr_${body.match(/door\.action\s*=\s*"([^"]+)"/)?.[1] ?? ""}`,
    connectWhenClosed: /door\.position\s*===\s*0[\s\S]*ChangeDoorAreaConnection\s*\(\s*door\s*,\s*1\s*\)/.test(body),
    maxPosition: parseRequiredTypescriptNumber(body, /door\.position\s*=\s*([A-Z0-9_]+|0x[0-9a-fA-F]+|[0-9]+)/, constants, "DoorOpening max position"),
    openSound: soundMatch ? resolveTypescriptString(soundMatch[1], stringConstants) : null,
    resetTiccount: /door\.ticcount\s*=\s*0/.test(body),
    slideShift: parseRequiredTypescriptNumber(body, /door\.position\s*\+=\s*tics\s*<<\s*([A-Z0-9_]+|[0-9]+)/, constants, "DoorOpening slide shift")
  };
}

function parseTypescriptDoorClosingContract(body, constants) {
  return {
    actionWhenComplete: `dr_${body.match(/door\.action\s*=\s*"([^"]+)"/)?.[1] ?? ""}`,
    disconnectWhenClosed: /door\.position\s*=\s*0[\s\S]*ChangeDoorAreaConnection\s*\(\s*door\s*,\s*-1\s*\)/.test(body),
    reopensWhenBlocked: /\bthis\.OpenDoor\s*\(\s*door\s*\)/.test(body),
    slideShift: parseRequiredTypescriptNumber(body, /door\.position\s*-=\s*tics\s*<<\s*([A-Z0-9_]+|[0-9]+)/, constants, "DoorClosing slide shift")
  };
}

function parseTypescriptMoveDoorsContract(body) {
  return {
    handlesClosing: /door\.action\s*===\s*"closing"[\s\S]*this\.DoorClosing\s*\(\s*door/.test(body),
    handlesOpen: /door\.action\s*===\s*"open"[\s\S]*this\.DoorOpen\s*\(\s*door/.test(body),
    handlesOpening: /door\.action\s*===\s*"opening"[\s\S]*this\.DoorOpening\s*\(\s*door/.test(body),
    stopsDuringVictory: /if\s*\(\s*this\.gamestate\.victoryflag\s*\)[\s\S]*return/.test(body)
  };
}

function parseTypescriptOperateDoorContract(body, stringConstants) {
  const soundMatch = body.match(/SD_PlaySound\(([^)]+)\)/);
  return {
    lockedSound: soundMatch ? resolveTypescriptString(soundMatch[1], stringConstants) : null,
    lockHigh: parseRequiredNumber(body, /door\.lock\s*<\s*([0-9]+)/, "OperateDoor lock high exclusive") - 1,
    lockLow: parseRequiredNumber(body, /door\.lock\s*>\s*([0-9]+)/, "OperateDoor lock low exclusive") + 1,
    opensClosedOrClosing: /door\.action\s*===\s*"closed"[\s\S]*door\.action\s*===\s*"closing"[\s\S]*this\.OpenDoor\s*\(\s*door\s*\)/.test(body),
    closesOpenOrOpening: /door\.action\s*===\s*"open"[\s\S]*door\.action\s*===\s*"opening"[\s\S]*this\.CloseDoor\s*\(\s*door\s*\)/.test(body)
  };
}

function parseTypescriptPushWallContract(body, stringConstants) {
  const soundMatches = [...body.matchAll(/SD_PlaySound\(([^)]+)\)/g)].map((match) =>
    resolveTypescriptString(match[1], stringConstants)
  );
  return {
    blockedSound: soundMatches.find((sound) => sound === "NOWAYSND") ?? null,
    incrementsSecret: /this\.gamestate\.secretcount\s*\+=\s*1/.test(body),
    initialPos: parseRequiredNumber(body, /pos:\s*([0-9]+)/, "PushWall initial position"),
    initialState: parseRequiredNumber(body, /state:\s*([0-9]+)/, "PushWall initial state"),
    oneActiveOnly: /this\.map\.pushWall/.test(body),
    pushSound: soundMatches.find((sound) => sound === "PUSHWALLSND") ?? null,
    requiresWallTile: /oldTile\s*===\s*0[\s\S]*return\s+false/.test(body)
  };
}

function parseTypescriptMovePushWallContract(body) {
  return {
    blockStep: parseRequiredNumber(body, /Math\.floor\(pushWall\.state\s*\/\s*([0-9]+)\)/, "MovePushWall block step"),
    clearsAfterState: parseRequiredNumber(body, /if\s*\(\s*pushWall\.state\s*>\s*([0-9]+)/, "MovePushWall clear threshold"),
    incrementsByTics: /pushWall\.state\s*\+=\s*tics/.test(body),
    posDivisor: parseRequiredNumber(body, /pushWall\.pos\s*=\s*Math\.floor\(pushWall\.state\s*\/\s*([0-9]+)\)/, "MovePushWall pos divisor"),
    posMask: parseRequiredNumber(body, /pushWall\.pos\s*=\s*Math\.floor\(pushWall\.state\s*\/\s*[0-9]+\)\s*&\s*([0-9]+)/, "MovePushWall pos mask"),
    returnsWhenInactive: /if\s*\(\s*!pushWall\s*\)[\s\S]*return/.test(body)
  };
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

function parseTypescriptActorKillScores(text) {
  const body = extractTypescriptFunctionBody(text, "actorKillScore");
  return parseTypescriptSwitchStringReturns(extractFirstSwitchBody(body, "actorKillScore"));
}

function parseTypescriptTreasureScores(text) {
  const body = extractTypescriptFunctionBody(text, "treasureScoreForBonus");
  return parseTypescriptSwitchStringReturns(extractFirstSwitchBody(body, "treasureScoreForBonus"));
}

function parseTypescriptBonusRewards(text, treasureScores, stringConstants) {
  const body = extractTypescriptFunctionBody(text, "GetBonus");
  const switchBody = extractFirstSwitchBody(body, "GetBonus");
  return parseTypescriptCaseGroups(switchBody, (item, caseBody) =>
    parseTypescriptBonusReward(item, caseBody, treasureScores, stringConstants)
  );
}

function parseTypescriptBonusReward(item, body, treasureScores, stringConstants) {
  const reward = createEmptyBonusReward();
  reward.condition = parseTypescriptBonusCondition(body);
  const soundMatch = body.match(/SD_PlaySound\(([^)]+)\)/);
  reward.sound = soundMatch ? resolveTypescriptString(soundMatch[1], stringConstants) : null;
  reward.heal = parseOptionalNumber(body, /HealSelf\(\s*([0-9]+)\s*\)/);
  reward.ammo = parseOptionalNumber(body, /GiveAmmo\(\s*([0-9]+)\s*\)/);
  reward.weapon = normalizeWeaponSymbol(body.match(/GiveWeapon\(\s*(WP_[A-Z0-9_]+)\s*\)/)?.[1] ?? null);
  reward.key = /GiveKey\(\s*keyNumberForBonus\(stat\.item\)\s*\)/.test(body) ? "item-bo_key1" : null;
  reward.score = /GivePoints\(\s*treasureScoreForBonus\(stat\.item\)\s*\)/.test(body)
    ? treasureScores.get(item) ?? null
    : parseOptionalNumber(body, /GivePoints\(\s*([0-9]+)\s*\)/);
  reward.extraLife = /\bGiveExtraMan\(/.test(body);
  reward.treasure = /this\.gamestate\.treasurecount\s*\+=\s*1/.test(body);
  return reward;
}

function parseTypescriptBonusCondition(body) {
  if (/this\.gamestate\.health\s*===\s*MAX_HEALTH/.test(body)) {
    return "health<100";
  }

  if (/this\.gamestate\.health\s*>\s*10/.test(body)) {
    return "health<=10";
  }

  if (/this\.gamestate\.ammo\s*===\s*MAX_AMMO/.test(body)) {
    return "ammo<99";
  }

  return null;
}

function parseTypescriptKillDrops(text) {
  const body = extractTypescriptFunctionBody(text, "PlaceKillDrop");
  const switchBody = extractFirstSwitchBody(body, "PlaceKillDrop");
  const drops = new Map();
  let pendingCases = [];
  for (const line of switchBody.split(/\r?\n/)) {
    if (line.includes("default:")) {
      pendingCases = [];
    }

    for (const caseMatch of line.matchAll(/case\s+"([^"]+)"\s*:/g)) {
      pendingCases.push(caseMatch[1]);
    }

    const dropCall = line.match(/PlaceItemType\(([^;]+)\);/);
    if (dropCall && pendingCases.length > 0) {
      const items = uniqueList([...dropCall[1].matchAll(/"(bo_[A-Za-z0-9_]+)"/g)].map((match) => match[1]));
      if (items.length === 0) {
        throw new Error(`Could not parse PlaceKillDrop item from: ${line.trim()}`);
      }

      for (const kind of pendingCases) {
        drops.set(kind, items.join("|"));
      }
    }

    if (line.includes("break;")) {
      pendingCases = [];
    }
  }

  return drops;
}

function parseTypescriptDamageActorContract(text) {
  const damageBody = extractTypescriptFunctionBody(text, "DamageActor");
  const painBody = extractTypescriptFunctionBody(text, "StartPainState");
  return {
    callsFirstSightingWhenNotAttackMode: /if\s*\(\s*!wasAttackMode\s*\)[\s\S]*this\.FirstSighting\s*\(\s*actor\s*\)/.test(damageBody),
    doublesDamageWhenNotAttackMode: /wasAttackMode\s*\?\s*damage\s*:\s*damage\s*\*\s*2/.test(damageBody),
    killsAtZeroOrBelow: /actor\.hitpoints\s*<=\s*0[\s\S]*this\.KillActor\s*\(\s*actor\s*\)/.test(damageBody),
    marksNoise: /this\.madeNoise\s*=\s*true/.test(damageBody),
    painStateUsesHitpointParity: /actor\.hitpoints\s*&\s*1\s*\?\s*0\s*:\s*1/.test(painBody),
    subtractsDamage: /actor\.hitpoints\s*-=\s*actualDamage/.test(damageBody)
  };
}

function parseTypescriptDamagePainStates(text) {
  const start = text.indexOf("const ACTOR_PAIN_STATES");
  const end = text.indexOf("const ACTOR_ATTACK_STATES", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find ACTOR_PAIN_STATES in source-typescript main.ts");
  }

  const states = new Map();
  const body = text.slice(start, end);
  const pattern =
    /\b([a-z_]+):\s*\[\s*\{[^{}]*name:\s*"([^"]+)"[^{}]*\}\s*,\s*\{[^{}]*name:\s*"([^"]+)"[^{}]*\}\s*\]/g;
  for (const match of body.matchAll(pattern)) {
    states.set(match[1], [match[2], match[3]]);
  }

  return states;
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

function compareBonusRewards(sourceEntries, typescriptEntries, problems) {
  for (const [item, sourceReward] of sourceEntries.entries()) {
    if (SOURCE_ONLY_BONUS_ITEMS.has(item)) {
      continue;
    }

    const currentReward = typescriptEntries.get(item);
    if (!currentReward) {
      problems.push(`${item}: missing TypeScript GetBonus reward`);
      continue;
    }

    for (const field of BONUS_REWARD_FIELDS) {
      if (currentReward[field] !== sourceReward[field]) {
        problems.push(
          `${item}: GetBonus ${field} ${formatNullable(currentReward[field])} != source ${formatNullable(sourceReward[field])}`
        );
      }
    }
  }

  for (const item of typescriptEntries.keys()) {
    if (!sourceEntries.has(item) && !SOURCE_ONLY_BONUS_ITEMS.has(item)) {
      problems.push(`${item}: TypeScript GetBonus reward missing from WL_AGENT.C GetBonus`);
    }
  }
}

function countComparedBonusRewards(sourceEntries) {
  let count = 0;
  for (const item of sourceEntries.keys()) {
    if (!SOURCE_ONLY_BONUS_ITEMS.has(item)) {
      count += 1;
    }
  }

  return count;
}

function compareTreasureScores(sourceEntries, typescriptEntries, problems) {
  for (const [item, sourceScore] of sourceEntries.entries()) {
    const currentScore = typescriptEntries.get(item);
    if (!Number.isFinite(currentScore)) {
      problems.push(`${item}: missing TypeScript treasure score`);
      continue;
    }

    if (currentScore !== sourceScore) {
      problems.push(`${item}: treasure score ${currentScore} != source ${sourceScore}`);
    }
  }

  for (const item of typescriptEntries.keys()) {
    if (!sourceEntries.has(item)) {
      problems.push(`${item}: TypeScript treasure score missing from WL_AGENT.C GetBonus`);
    }
  }
}

function compareKillActorRewards(sourceEntries, typescriptScores, typescriptDrops, problems) {
  for (const [kind, sourceReward] of sourceEntries.entries()) {
    const currentScore = typescriptScores.get(kind);
    if (!Number.isFinite(currentScore)) {
      problems.push(`${kind}: missing TypeScript KillActor score`);
      continue;
    }

    if (currentScore !== sourceReward.score) {
      problems.push(`${kind}: KillActor score ${currentScore} != source ${sourceReward.score}`);
    }

    const currentDrop = typescriptDrops.get(kind) ?? null;
    if (currentDrop !== sourceReward.drop) {
      problems.push(`${kind}: KillActor drop ${formatNullable(currentDrop)} != source ${formatNullable(sourceReward.drop)}`);
    }
  }

  for (const kind of typescriptScores.keys()) {
    if (!sourceEntries.has(kind)) {
      problems.push(`${kind}: TypeScript KillActor score missing from WL_STATE.C KillActor`);
    }
  }

  for (const kind of typescriptDrops.keys()) {
    if (!sourceEntries.has(kind)) {
      problems.push(`${kind}: TypeScript KillActor drop missing from WL_STATE.C KillActor`);
    }
  }
}

function comparePainStates(sourceEntries, typescriptEntries, problems) {
  for (const [kind, sourceStates] of sourceEntries.entries()) {
    const currentStates = typescriptEntries.get(kind);
    if (!currentStates) {
      problems.push(`${kind}: missing TypeScript DamageActor pain states`);
      continue;
    }

    compareStringList(`${kind}.DamageActor.painStates`, sourceStates, currentStates, problems);
  }

  for (const kind of typescriptEntries.keys()) {
    if (!sourceEntries.has(kind)) {
      problems.push(`${kind}: TypeScript pain states missing from WL_STATE.C DamageActor`);
    }
  }
}

function compareSoundChunks(sourceEntries, typescriptEntries, problems) {
  for (const [sound, sourceIndex] of sourceEntries.entries()) {
    const currentIndex = typescriptEntries.get(sound);
    if (!Number.isFinite(currentIndex)) {
      problems.push(`${sound}: missing TypeScript sound chunk`);
      continue;
    }

    if (currentIndex !== sourceIndex) {
      problems.push(`${sound}: sound chunk ${currentIndex} != source ${sourceIndex}`);
    }
  }

  for (const sound of typescriptEntries.keys()) {
    if (!sourceEntries.has(sound)) {
      problems.push(`${sound}: TypeScript sound chunk missing from AUDIOWL6.H`);
    }
  }
}

function compareWeaponReadySprites(sourceValues, typescriptValues, problems) {
  compareNumberList("WEAPON_READY_SPRITES", sourceValues, typescriptValues, problems);
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

function compareContractMap(name, sourceEntries, typescriptEntries, problems) {
  for (const [contractName, sourceContract] of sourceEntries.entries()) {
    const currentContract = typescriptEntries.get(contractName);
    if (!currentContract) {
      problems.push(`${name}.${contractName}: missing TypeScript contract`);
      continue;
    }

    for (const [field, sourceValue] of Object.entries(sourceContract)) {
      const currentValue = currentContract[field];
      if (currentValue !== sourceValue) {
        problems.push(`${name}.${contractName}.${field}: ${formatNullable(currentValue)} != source ${formatNullable(sourceValue)}`);
      }
    }
  }

  for (const contractName of typescriptEntries.keys()) {
    if (!sourceEntries.has(contractName)) {
      problems.push(`${name}.${contractName}: TypeScript contract missing from source`);
    }
  }
}

function compareContractObject(name, sourceContract, typescriptContract, problems) {
  for (const [field, sourceValue] of Object.entries(sourceContract)) {
    const currentValue = typescriptContract[field];
    if (currentValue !== sourceValue) {
      problems.push(`${name}.${field}: ${formatNullable(currentValue)} != source ${formatNullable(sourceValue)}`);
    }
  }
}

function compareAgentHelperContracts(sourceEntries, typescriptEntries, problems) {
  compareContractMap("WL_AGENT.C helper", sourceEntries, typescriptEntries, problems);
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

function compareElevatorBackTo(sourceValues, typescriptValues, problems) {
  compareNumberList("ELEVATOR_BACK_TO", sourceValues, typescriptValues, problems);
}

function compareParTimesSeconds(sourceValues, typescriptValues, problems) {
  compareNumberList("WL6_PAR_TIMES_SECONDS", sourceValues, typescriptValues, problems);
}

function compareRndTable(sourceValues, typescriptValues, problems) {
  compareNumberList("US_RND_TABLE", sourceValues, typescriptValues, problems);
}

function parseNumericConstants(text) {
  const constants = new Map();
  const constantPattern = /const\s+([A-Z0-9_]+)\s*=\s*(0x[0-9a-fA-F]+|[0-9]+);/g;
  for (const match of text.matchAll(constantPattern)) {
    constants.set(match[1], parseNumberLiteral(match[2]));
  }

  return constants;
}

function parseSourceNumericDefines(text) {
  const constants = new Map();
  const definePattern = /^\s*#define\s+([A-Z0-9_]+)\s+\(?\s*(0x[0-9a-fA-F]+|[0-9]+)\s*[lLuU]*\s*\)?(?:\s|$)/gm;
  for (const match of text.matchAll(definePattern)) {
    constants.set(match[1], parseNumberLiteral(match[2]));
  }

  return constants;
}

function mergeNumberMaps(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [key, value] of map.entries()) {
      merged.set(key, value);
    }
  }

  return merged;
}

function parseStringConstants(text) {
  const constants = new Map();
  const constantPattern = /const\s+([A-Z0-9_]+)(?::\s*[A-Za-z0-9_<>| ]+)?\s*=\s*"([^"]+)";/g;
  for (const match of text.matchAll(constantPattern)) {
    constants.set(match[1], match[2]);
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

function parseNumberLiteral(value) {
  const normalized = value.trim().replace(/[lLuU]+$/g, "");
  return normalized.toLowerCase().startsWith("0x") ? Number.parseInt(normalized, 16) : Number(normalized);
}

function parseOptionalNumber(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

function parseOptionalNumberLiteral(text, pattern) {
  const match = text.match(pattern);
  return match ? parseNumberLiteral(match[1]) : null;
}

function parseRequiredNumber(text, pattern, label) {
  const value = parseOptionalNumber(text, pattern);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not parse ${label}`);
  }

  return value;
}

function parseRequiredNumberLiteral(text, pattern, label) {
  const value = parseOptionalNumberLiteral(text, pattern);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not parse ${label}`);
  }

  return value;
}

function parseRequiredTypescriptNumber(text, pattern, constants, label) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not parse ${label}`);
  }

  return resolveTypescriptNumber(match[1], constants);
}

function parseTypescriptFixedRangeConstant(text, name, constants) {
  const match = text.match(new RegExp(`const\\s+${name}\\s*=\\s*([^;]+);`));
  if (!match) {
    throw new Error(`Could not find TypeScript fixed range constant: ${name}`);
  }

  const expression = match[1].trim();
  const division = expression.match(/^([A-Z0-9_]+|0x[0-9a-fA-F]+|[0-9]+)\s*\/\s*([A-Z0-9_]+|0x[0-9a-fA-F]+|[0-9]+)$/);
  if (division) {
    const tileglobal = constants.get("TILEGLOBAL");
    if (!Number.isFinite(tileglobal)) {
      throw new Error(`Could not resolve TILEGLOBAL for ${name}`);
    }

    return Math.trunc(
      (resolveTypescriptNumberOperand(division[1], constants) / resolveTypescriptNumberOperand(division[2], constants)) *
        tileglobal
    );
  }

  return resolveTypescriptNumber(expression, constants);
}

function resolveTypescriptNumberOperand(expression, constants) {
  const normalized = expression.trim();
  if (/^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(normalized)) {
    return parseNumberLiteral(normalized);
  }

  return resolveTypescriptNumber(normalized, constants);
}

function resolveSourceDefine(symbol, defines) {
  if (!symbol) {
    return null;
  }

  const value = defines.get(symbol);
  if (!Number.isFinite(value)) {
    throw new Error(`Could not resolve source define: ${symbol}`);
  }

  return value;
}

function createEmptyBonusReward() {
  return {
    ammo: null,
    condition: null,
    extraLife: false,
    heal: null,
    key: null,
    score: null,
    sound: null,
    treasure: false,
    weapon: null
  };
}

function normalizeWeaponSymbol(symbol) {
  return symbol ? symbol.toUpperCase() : null;
}

function resolveTypescriptString(expression, stringConstants) {
  const normalized = expression.trim();
  const quoted = normalized.match(/^"([^"]+)"$/);
  if (quoted) {
    return quoted[1];
  }

  const constant = stringConstants.get(normalized);
  if (constant) {
    return constant;
  }

  throw new Error(`Could not resolve TypeScript string expression: ${expression}`);
}

function parseSourceCaseGroups(switchBody, parseReward) {
  return parseSwitchCaseGroups(parseSourceCaseBlocks(switchBody), parseReward);
}

function parseTypescriptCaseGroups(switchBody, parseReward) {
  return parseSwitchCaseGroups(parseTypescriptCaseBlocks(switchBody), parseReward);
}

function parseSwitchCaseGroups(blocks, parseReward) {
  const entries = new Map();
  let labels = [];
  let body = "";
  for (const block of blocks) {
    labels.push(block.label);
    body += block.bodyWithoutLabel;
    if (/\bbreak\s*;/.test(block.bodyWithoutLabel)) {
      for (const label of labels) {
        entries.set(label, parseReward(label, body));
      }

      labels = [];
      body = "";
    }
  }

  if (labels.length > 0) {
    for (const label of labels) {
      entries.set(label, parseReward(label, body));
    }
  }

  return entries;
}

function parseSourceCaseBlocks(switchBody) {
  const caseMatches = [...switchBody.matchAll(/^\s*case\s+([A-Za-z0-9_]+)\s*:/gm)];
  return caseMatches.map((match, index) => {
    const next = caseMatches[index + 1];
    const body = switchBody.slice(match.index, next?.index ?? switchBody.length);
    return {
      body,
      bodyWithoutLabel: body.replace(/^\s*case\s+[A-Za-z0-9_]+\s*:\s*/, ""),
      label: match[1]
    };
  });
}

function parseTypescriptCaseBlocks(switchBody) {
  const caseMatches = [...switchBody.matchAll(/^\s*case\s+"([^"]+)"\s*:/gm)];
  return caseMatches.map((match, index) => {
    const next = caseMatches[index + 1];
    const body = switchBody.slice(match.index, next?.index ?? switchBody.length);
    return {
      body,
      bodyWithoutLabel: body.replace(/^\s*case\s+"[^"]+"\s*:\s*/, ""),
      label: match[1]
    };
  });
}

function parseTypescriptSwitchStringReturns(switchBody) {
  const values = new Map();
  let pendingCases = [];
  for (const line of switchBody.split(/\r?\n/)) {
    if (line.includes("default:")) {
      pendingCases = [];
    }

    for (const caseMatch of line.matchAll(/case\s+"([^"]+)"\s*:/g)) {
      pendingCases.push(caseMatch[1]);
    }

    const returnMatch = line.match(/\breturn\s+([0-9]+(?:e[0-9]+)?)\s*;/i);
    if (returnMatch && pendingCases.length > 0) {
      for (const label of pendingCases) {
        values.set(label, Number(returnMatch[1]));
      }

      pendingCases = [];
    }
  }

  return values;
}

function extractCFunctionBody(text, name) {
  const pattern = new RegExp(`\\b[A-Za-z_][A-Za-z0-9_\\s\\*]*\\s+${name}\\s*\\([^;]*?\\)\\s*\\{`);
  return extractBodyAfterPattern(text, pattern, name);
}

function extractTypescriptFunctionBody(text, name) {
  const pattern = new RegExp(`(?:^|\\n)\\s*(?:function\\s+|private\\s+)?${name}\\s*\\([^)]*\\)`);
  const match = pattern.exec(text);
  if (!match) {
    throw new Error(`Could not find ${name} body`);
  }

  const openIndex = findTypescriptFunctionOpeningBrace(text, match.index + match[0].length, name);
  return extractBraceBody(text, openIndex);
}

function findTypescriptFunctionOpeningBrace(text, startIndex, label) {
  let typeBraceDepth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      if (typeBraceDepth > 0) {
        typeBraceDepth += 1;
        continue;
      }

      const previous = previousNonWhitespace(text, index);
      if (previous === ":") {
        typeBraceDepth = 1;
        continue;
      }

      return index;
    }

    if (char === "}" && typeBraceDepth > 0) {
      typeBraceDepth -= 1;
    }
  }

  throw new Error(`Could not find ${label} opening brace`);
}

function previousNonWhitespace(text, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (!/\s/.test(text[cursor])) {
      return text[cursor];
    }
  }

  return null;
}

function extractBodyAfterPattern(text, pattern, label) {
  const match = pattern.exec(text);
  if (!match) {
    throw new Error(`Could not find ${label} body`);
  }

  const openIndex = text.indexOf("{", match.index);
  if (openIndex < 0) {
    throw new Error(`Could not find ${label} opening brace`);
  }

  return extractBraceBody(text, openIndex);
}

function extractFirstSwitchBody(text, label) {
  const switchIndex = text.indexOf("switch");
  if (switchIndex < 0) {
    throw new Error(`Could not find ${label} switch`);
  }

  const openIndex = text.indexOf("{", switchIndex);
  if (openIndex < 0) {
    throw new Error(`Could not find ${label} switch opening brace`);
  }

  return extractBraceBody(text, openIndex);
}

function extractBraceBody(text, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(openIndex + 1, index);
      }
    }
  }

  throw new Error(`Could not find closing brace from index ${openIndex}`);
}

function uniqueList(values) {
  return [...new Set(values)];
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

function compareStringList(name, sourceValues, typescriptValues, problems) {
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
  if (/^-?(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(normalized)) {
    return parseNumberLiteral(normalized);
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
