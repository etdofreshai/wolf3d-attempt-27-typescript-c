#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT_EXTENSIONS = new Set([".bin", ".png", ".wav"]);
const KIND_EXTENSION = new Map([
  ["audio", ".wav"],
  ["frame", ".png"],
  ["state", ".bin"]
]);

const options = parseArgs(process.argv.slice(2));

if (!options.left || !options.right) {
  printHelp();
  process.exit(1);
}

const leftManifest = await buildManifest(options.left, options.leftName);
const rightManifest = await buildManifest(options.right, options.rightName);
const report = compareManifests(leftManifest, rightManifest);

if (options.report) {
  const reportPath = path.resolve(options.report);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else if (!options.quiet) {
  printReport(report, options.report);
}

if (!options.allowDiff && report.summary.different + report.summary.missing > 0) {
  process.exit(1);
}

function parseArgs(args) {
  const parsed = {
    allowDiff: false,
    json: false,
    left: null,
    leftName: "left",
    quiet: false,
    report: null,
    right: null,
    rightName: "right"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--left" || arg === "--dos" || arg === "--source-modified") {
      parsed.left = needValue(args, ++index, arg);
      parsed.leftName = arg === "--left" ? parsed.leftName : "source-modified-dos";
      continue;
    }

    if (arg === "--right" || arg === "--ts" || arg === "--source-typescript") {
      parsed.right = needValue(args, ++index, arg);
      parsed.rightName = arg === "--right" ? parsed.rightName : "source-typescript";
      continue;
    }

    if (arg === "--left-name") {
      parsed.leftName = needValue(args, ++index, arg);
      continue;
    }

    if (arg === "--right-name") {
      parsed.rightName = needValue(args, ++index, arg);
      continue;
    }

    if (arg === "--report") {
      parsed.report = needValue(args, ++index, arg);
      continue;
    }

    if (arg === "--allow-diff") {
      parsed.allowDiff = true;
      continue;
    }

    if (arg === "--json") {
      parsed.json = true;
      continue;
    }

    if (arg === "--quiet") {
      parsed.quiet = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

async function buildManifest(inputPath, name) {
  const absoluteInput = path.resolve(inputPath);
  const files = await collectArtifactFiles(absoluteInput);
  const entries = new Map();

  for (const file of files) {
    const bytes = await readFile(file);
    const identity = inferArtifactIdentity(file);
    const entry = {
      ...identity,
      bytes: bytes.byteLength,
      file: path.relative(absoluteInput, file) || path.basename(file),
      metadata: readArtifactMetadata(bytes, identity),
      sha256: sha256(bytes)
    };

    if (entries.has(entry.key)) {
      throw new Error(`${name}: duplicate artifact key ${entry.key}`);
    }

    entries.set(entry.key, entry);
  }

  return {
    count: entries.size,
    input: absoluteInput,
    name,
    artifacts: Object.fromEntries([...entries.entries()].sort(([left], [right]) => left.localeCompare(right)))
  };
}

async function collectArtifactFiles(inputPath) {
  const info = await stat(inputPath);
  if (info.isFile()) {
    return ARTIFACT_EXTENSIONS.has(path.extname(inputPath).toLowerCase()) ? [inputPath] : [];
  }

  if (!info.isDirectory()) {
    return [];
  }

  const files = [];
  const entries = await readdir(inputPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(inputPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectArtifactFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && ARTIFACT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function inferArtifactIdentity(file) {
  const extension = path.extname(file).toLowerCase();
  const stem = path.basename(file, extension);
  const lowerStem = stem.toLowerCase();

  for (const [kind, expectedExtension] of KIND_EXTENSION.entries()) {
    const marker = `-${kind}`;
    const markerIndex = lowerStem.lastIndexOf(marker);
    if (markerIndex < 0 || extension !== expectedExtension) {
      continue;
    }

    const rawLabel = stem.slice(markerIndex + marker.length).replace(/^-/, "");
    const label = rawLabel || "default";
    return {
      extension: extension.slice(1),
      key: `${kind}:${label}.${extension.slice(1)}`,
      kind,
      label
    };
  }

  const kind = extension === ".png" ? "frame" : extension === ".wav" ? "audio" : "state";
  const label = stem || "default";
  return {
    extension: extension.slice(1),
    key: `${kind}:${label}.${extension.slice(1)}`,
    kind,
    label
  };
}

function readArtifactMetadata(bytes, identity) {
  if (identity.kind === "frame") {
    return readPngMetadata(bytes);
  }

  if (identity.kind === "audio") {
    return readWavMetadata(bytes);
  }

  return readStateMetadata(bytes);
}

function readPngMetadata(bytes) {
  if (
    bytes.byteLength < 26 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47 ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return { png: false };
  }

  return {
    bitDepth: bytes.readUInt8(24),
    colorType: bytes.readUInt8(25),
    height: bytes.readUInt32BE(20),
    png: true,
    width: bytes.readUInt32BE(16)
  };
}

function readWavMetadata(bytes) {
  if (bytes.byteLength < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    return { wav: false };
  }

  let cursor = 12;
  let fmt = null;
  let dataBytes = null;

  while (cursor + 8 <= bytes.byteLength) {
    const id = bytes.toString("ascii", cursor, cursor + 4);
    const size = bytes.readUInt32LE(cursor + 4);
    const start = cursor + 8;

    if (id === "fmt " && size >= 16 && start + 16 <= bytes.byteLength) {
      fmt = {
        audioFormat: bytes.readUInt16LE(start),
        bitsPerSample: bytes.readUInt16LE(start + 14),
        channels: bytes.readUInt16LE(start + 2),
        sampleRate: bytes.readUInt32LE(start + 4)
      };
    } else if (id === "data" && start + size <= bytes.byteLength) {
      dataBytes = size;
    }

    cursor = start + size + (size % 2);
  }

  if (!fmt || dataBytes === null) {
    return { wav: false };
  }

  const bytesPerSampleFrame = (fmt.bitsPerSample / 8) * fmt.channels;
  const sampleFrames = bytesPerSampleFrame > 0 ? dataBytes / bytesPerSampleFrame : 0;

  return {
    ...fmt,
    dataBytes,
    durationSeconds: fmt.sampleRate > 0 ? Number((sampleFrames / fmt.sampleRate).toFixed(6)) : 0,
    sampleFrames,
    wav: true
  };
}

function readStateMetadata(bytes) {
  const text = bytes.toString("utf8").trim();
  if (!text.startsWith("{")) {
    return {
      json: false
    };
  }

  try {
    const parsed = JSON.parse(text);
    return {
      artifactCount: Array.isArray(parsed.artifacts) ? parsed.artifacts.length : null,
      gameKeys: parsed.game && typeof parsed.game === "object" ? Object.keys(parsed.game).sort() : [],
      json: true,
      runner: typeof parsed.runner === "string" ? parsed.runner : null,
      topLevelKeys: Object.keys(parsed).sort()
    };
  } catch {
    return {
      json: false
    };
  }
}

function compareManifests(left, right) {
  const keys = uniqueSorted([...Object.keys(left.artifacts), ...Object.keys(right.artifacts)]);
  const pairs = [];
  const summary = {
    different: 0,
    exact: 0,
    missing: 0,
    total: keys.length
  };

  for (const key of keys) {
    const leftArtifact = left.artifacts[key] ?? null;
    const rightArtifact = right.artifacts[key] ?? null;
    const differences = [];

    if (!leftArtifact || !rightArtifact) {
      differences.push(leftArtifact ? `missing ${right.name}` : `missing ${left.name}`);
      summary.missing += 1;
    } else {
      if (leftArtifact.bytes !== rightArtifact.bytes) {
        differences.push(`bytes ${leftArtifact.bytes} != ${rightArtifact.bytes}`);
      }

      if (leftArtifact.sha256 !== rightArtifact.sha256) {
        differences.push("sha256 differs");
      }

      if (stableJson(leftArtifact.metadata) !== stableJson(rightArtifact.metadata)) {
        differences.push("metadata differs");
      }

      if (differences.length === 0) {
        summary.exact += 1;
      } else {
        summary.different += 1;
      }
    }

    pairs.push({
      differences,
      key,
      left: leftArtifact,
      right: rightArtifact,
      status: differences.length === 0 ? "exact" : leftArtifact && rightArtifact ? "different" : "missing"
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    left,
    pairs,
    right,
    summary
  };
}

function printReport(report, reportPath) {
  const { summary } = report;
  console.log(
    `wolf artifact compare: ${summary.exact} exact, ${summary.different} different, ${summary.missing} missing, ${summary.total} total`
  );

  for (const pair of report.pairs) {
    const marker = pair.status === "exact" ? "=" : pair.status === "different" ? "!" : "?";
    const details = pair.differences.length > 0 ? ` (${pair.differences.join("; ")})` : "";
    const metadata = pair.left?.metadata ?? pair.right?.metadata ?? {};
    console.log(`${marker} ${pair.key}${formatMetadata(metadata)}${details}`);
  }

  if (reportPath) {
    console.log(`report: ${path.resolve(reportPath)}`);
  }
}

function formatMetadata(metadata) {
  if (metadata.png) {
    return ` ${metadata.width}x${metadata.height}`;
  }

  if (metadata.wav) {
    return ` ${metadata.sampleRate}Hz ${metadata.durationSeconds}s`;
  }

  if (metadata.json) {
    return metadata.runner ? ` ${metadata.runner}` : " json";
  }

  return "";
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function needValue(values, index, flag) {
  const value = values[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} needs a value.`);
  }

  return value;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/wolf-artifact-compare.mjs --dos artifacts/source-modified --ts artifacts/source-typescript --allow-diff --report artifacts/latest-parity-report.json
  node scripts/wolf-artifact-compare.mjs --left wolf3d-source-modified-frame-boot.png --right wolf3d-source-typescript-frame-boot.png

Inputs:
  --dos, --source-modified <path>   Source-modified DOS artifact file or folder
  --ts, --source-typescript <path>  Source TypeScript artifact file or folder
  --left <path>                     Generic left artifact file or folder
  --right <path>                    Generic right artifact file or folder

Options:
  --allow-diff                      Exit 0 even when artifacts differ
  --report <file>                   Write a local JSON comparison report
  --json                            Print the full JSON report
`);
}
