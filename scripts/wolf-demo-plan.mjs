#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGETS = {
  modified: { label: "source-modified-dos", port: 5176 },
  "source-modified": { label: "source-modified-dos", port: 5176 },
  "source-modified-dos": { label: "source-modified-dos", port: 5176 },
  "source-typescript": { label: "source-typescript", port: 5177 },
  ts: { label: "source-typescript", port: 5177 },
  typescript: { label: "source-typescript", port: 5177 }
};

const args = process.argv.slice(2);
const plan = {
  autoStart: true,
  name: "cli-demo",
  steps: []
};
let target = "source-modified-dos";
let mapIndex = null;
let outPath = null;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  }

  if (arg === "--target") {
    target = needValue(args, ++index, arg);
    continue;
  }

  if (arg === "--name") {
    plan.name = needValue(args, ++index, arg);
    continue;
  }

  if (arg === "--map" || arg === "--level") {
    mapIndex = numberValue(needValue(args, ++index, arg), arg);
    continue;
  }

  if (arg === "--out") {
    outPath = needValue(args, ++index, arg);
    continue;
  }

  if (arg === "--no-autorun") {
    plan.autoStart = false;
    continue;
  }

  if (arg === "--wait") {
    plan.steps.push({
      action: "wait",
      ms: numberValue(needValue(args, ++index, arg), arg)
    });
    continue;
  }

  if (arg === "--key") {
    plan.steps.push(parseKeySpec(needValue(args, ++index, arg)));
    continue;
  }

  if (arg === "--hold") {
    const last = plan.steps.at(-1);
    if (!last || last.action !== "key") {
      throw new Error("--hold must follow --key.");
    }

    last.holdMs = numberValue(needValue(args, ++index, arg), arg);
    continue;
  }

  if (arg === "--down" || arg === "--keyup") {
    plan.steps.push({
      action: arg === "--down" ? "keydown" : "keyup",
      key: needValue(args, ++index, arg)
    });
    continue;
  }

  if (arg === "--up" || arg === "--keydown") {
    plan.steps.push({
      action: arg === "--up" ? "keyup" : "keydown",
      key: needValue(args, ++index, arg)
    });
    continue;
  }

  if (arg === "--capture") {
    const next = args[index + 1];
    const label = next && !next.startsWith("--") ? args[++index] : undefined;
    plan.steps.push({
      ...(label ? { label } : {}),
      action: "capture",
      png: true
    });
    continue;
  }

  if (arg === "--png" || arg === "--wav" || arg === "--state") {
    const last = plan.steps.at(-1);
    const field = arg === "--png" ? "png" : arg === "--wav" ? "wav" : "state";
    if (last && last.action === "capture") {
      last[field] = true;
    } else {
      plan.steps.push({
        action: "capture",
        [field]: true
      });
    }
    continue;
  }

  throw new Error(`Unknown argument: ${arg}`);
}

if (plan.steps.length === 0) {
  plan.steps.push(
    {
      action: "wait",
      ms: 1200
    },
    {
      action: "capture",
      label: "boot",
      png: true,
      state: true
    }
  );
}

const targetInfo = TARGETS[target];
if (!targetInfo) {
  throw new Error(`Unknown target "${target}". Use source-modified-dos or source-typescript.`);
}

const encoded = Buffer.from(JSON.stringify(plan), "utf8").toString("base64url");
const query = new URLSearchParams({ demo: encoded });
if (!plan.autoStart) {
  query.set("autorun", "0");
}

if (mapIndex !== null) {
  query.set("map", String(clampMapIndex(mapIndex)));
}

const url = `http://127.0.0.1:${targetInfo.port}/?${query.toString()}`;

if (outPath) {
  const absoluteOut = path.resolve(outPath);
  await mkdir(path.dirname(absoluteOut), { recursive: true });
  await writeFile(absoluteOut, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
}

console.log(`Target: ${targetInfo.label}`);
console.log(`Demo URL: ${url}`);
if (outPath) {
  console.log(`Plan JSON: ${path.resolve(outPath)}`);
}
console.log(JSON.stringify(plan, null, 2));

function parseKeySpec(value) {
  const separator = value.lastIndexOf(":");
  if (separator <= 0) {
    return {
      action: "key",
      key: value
    };
  }

  const key = value.slice(0, separator);
  const holdMs = numberValue(value.slice(separator + 1), "--key");
  return {
    action: "key",
    holdMs,
    key
  };
}

function needValue(values, index, flag) {
  const value = values[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} needs a value.`);
  }

  return value;
}

function numberValue(value, flag) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${flag} needs a numeric value.`);
  }

  return number;
}

function clampMapIndex(value) {
  return Math.max(0, Math.min(59, Math.trunc(value)));
}

function printHelp() {
  console.log(`
Usage:
  node scripts/wolf-demo-plan.mjs --target source-modified-dos --name boot --wait 1200 --key Enter:90 --wait 500 --capture menu --state --wav
  node scripts/wolf-demo-plan.mjs --target source-typescript --map 29 --wait 600 --capture ghosts --state

Targets:
  source-modified-dos   Original C/ASM DOS lane with capture hooks on port 5176
  source-typescript     TypeScript source-port scaffold on port 5177

Steps:
  --wait <ms>           Wait for a duration
  --key <name[:hold]>   Press and release a key
  --down <name>         Hold a key down
  --up <name>           Release a key
  --map <index>         Load a WL6 map index, 0-59
  --level <index>       Alias for --map
  --capture [label]     Capture a PNG at this point
  --state               Include a BIN state artifact in the latest capture
  --wav                 Include a WAV artifact in the latest capture
  --out <file>          Write the JSON plan as well as printing the launch URL
`);
}
