#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const WOLFSRC_DIR = path.join(REPO_ROOT, "source", "WOLFSRC");
const TS_SRC_DIR = path.join(REPO_ROOT, "apps", "source-typescript-3", "src");
const IMPORT_SPECIFIER_PATTERN = /^\.\/[A-Z0-9_]+\.(C|H)\.ts$/;
const COMMENT_SIGNIFICANT_NON_WS = 15;
const COMMENT_REQUIRED_RATIO = 0.9;

export function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function extractComments(sourceText) {
  const comments = [];
  let i = 0;

  while (i < sourceText.length) {
    const ch = sourceText[i];
    const next = sourceText[i + 1];

    if (ch === "/" && next === "*") {
      const start = i;
      i += 2;
      while (i < sourceText.length && !(sourceText[i] === "*" && sourceText[i + 1] === "/")) {
        i += 1;
      }
      i = i < sourceText.length ? i + 2 : sourceText.length;
      comments.push(sourceText.slice(start, i));
      continue;
    }

    if (ch === "/" && next === "/") {
      const start = i;
      i += 2;
      while (i < sourceText.length && sourceText[i] !== "\n" && sourceText[i] !== "\r") {
        i += 1;
      }
      comments.push(sourceText.slice(start, i));
      continue;
    }

    if (ch === '"' || ch === "'") {
      i = skipQuotedLiteral(sourceText, i, ch);
      continue;
    }

    i += 1;
  }

  return comments;
}

function skipQuotedLiteral(sourceText, start, quote) {
  let i = start + 1;
  while (i < sourceText.length) {
    if (sourceText[i] === "\\") {
      i += 2;
      continue;
    }
    if (sourceText[i] === quote) {
      return i + 1;
    }
    i += 1;
  }
  return sourceText.length;
}

function parseArgs(argv) {
  const tierIndex = argv.indexOf("--tier");
  const tier = tierIndex >= 0 ? argv[tierIndex + 1] : undefined;
  if (tier !== "headers" && tier !== "full") {
    return {
      ok: false,
      message: "Usage: node scripts/port-parity.mjs --tier headers|full",
    };
  }
  return { ok: true, tier };
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function sourceFilesForTier(tier) {
  const entries = listFiles(WOLFSRC_DIR);
  if (!entries) {
    return { files: [], error: `missing source directory: ${relativePath(WOLFSRC_DIR)}` };
  }

  const extensions = tier === "full" ? new Set([".H", ".C"]) : new Set([".H"]);
  const files = entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toUpperCase()))
    .map((entry) => ({
      originalName: entry.name,
      originalUpperName: entry.name.toUpperCase(),
      sourcePath: path.join(WOLFSRC_DIR, entry.name),
      targetName: `${entry.name.toUpperCase()}.TS`,
      targetPath: path.join(TS_SRC_DIR, `${entry.name.toUpperCase()}.TS`),
    }))
    .sort((a, b) => a.originalUpperName.localeCompare(b.originalUpperName));

  return { files, error: null };
}

function exactDirectoryFileNames(dir) {
  const entries = listFiles(dir);
  if (!entries) {
    return { names: new Set(), files: [], dirExists: false };
  }
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  return { names: new Set(files), files, dirExists: true };
}

function validatePortedFile(sourceFile, targetNames) {
  const result = {
    sourceName: sourceFile.originalName,
    targetName: sourceFile.targetName,
    passed: true,
    issues: [],
    details: [],
  };

  if (!targetNames.has(sourceFile.targetName)) {
    result.passed = false;
    result.issues.push(`missing file: ${relativePath(sourceFile.targetPath)}`);
    return result;
  }

  const stat = fs.statSync(sourceFile.targetPath);
  if (stat.size === 0) {
    result.passed = false;
    result.issues.push(`empty file: ${relativePath(sourceFile.targetPath)}`);
    return result;
  }

  const sourceText = fs.readFileSync(sourceFile.sourcePath, "latin1");
  const targetText = fs.readFileSync(sourceFile.targetPath, "utf8");
  const targetNormalized = normalizeWhitespace(targetText);
  const comments = extractComments(sourceText);
  const normalizedComments = comments.map((comment, index) => ({
    index: index + 1,
    text: comment,
    normalized: normalizeWhitespace(comment),
    nonWhitespaceLength: comment.replace(/\s+/g, "").length,
  }));

  if (normalizedComments.length > 0 && !targetNormalized.includes(normalizedComments[0].normalized)) {
    result.passed = false;
    result.issues.push(
      `missing first comment/banner: comment #1 ${formatCommentPreview(normalizedComments[0].normalized)}`,
    );
  }

  const significant = normalizedComments.filter(
    (comment) => comment.nonWhitespaceLength >= COMMENT_SIGNIFICANT_NON_WS,
  );
  const missingSignificant = significant.filter((comment) => !targetNormalized.includes(comment.normalized));
  const presentCount = significant.length - missingSignificant.length;
  const ratio = significant.length === 0 ? 1 : presentCount / significant.length;

  result.details.push(
    `comments: ${presentCount}/${significant.length} significant preserved (${Math.round(ratio * 100)}%)`,
  );

  if (ratio < COMMENT_REQUIRED_RATIO) {
    result.passed = false;
    result.issues.push(
      `comment preservation below 90%: ${presentCount}/${significant.length} significant comments preserved`,
    );
    for (const comment of missingSignificant) {
      result.issues.push(`missing comment #${comment.index}: ${formatCommentPreview(comment.normalized)}`);
    }
  }

  return result;
}

function validateFullTierSrcRules() {
  const result = {
    passed: true,
    issues: [],
  };
  const { files, dirExists } = exactDirectoryFileNames(TS_SRC_DIR);
  if (!dirExists) {
    return result;
  }

  const asmFiles = files.filter((name) => /\.ASM\.TS$/i.test(name)).sort();
  for (const file of asmFiles) {
    result.passed = false;
    result.issues.push(`ASM TypeScript file is not allowed: ${relativePath(path.join(TS_SRC_DIR, file))}`);
  }

  const lowercaseBasenameFiles = files
    .filter((name) => /[a-z]/.test(path.parse(name).name))
    .filter((name) => name !== "main.ts")
    .sort();
  for (const file of lowercaseBasenameFiles) {
    result.passed = false;
    result.issues.push(
      `lowercase basename is only allowed for src/main.ts: ${relativePath(path.join(TS_SRC_DIR, file))}`,
    );
  }

  return result;
}

function validateImports() {
  const result = {
    passed: true,
    fileResults: [],
  };

  const tsFiles = collectTypeScriptFiles(TS_SRC_DIR);
  for (const tsFile of tsFiles) {
    const text = fs.readFileSync(tsFile, "utf8");
    const badImports = extractImportSpecifiers(text)
      .filter((importItem) => importItem.specifier.startsWith("."))
      .filter((importItem) => !IMPORT_SPECIFIER_PATTERN.test(importItem.specifier));

    const fileResult = {
      filePath: tsFile,
      passed: badImports.length === 0,
      issues: badImports.map(
        (importItem) =>
          `bad import at line ${lineNumberAt(text, importItem.index)}: ${JSON.stringify(importItem.specifier)}`,
      ),
    };
    if (!fileResult.passed) {
      result.passed = false;
    }
    result.fileResults.push(fileResult);
  }

  return result;
}

function collectTypeScriptFiles(dir) {
  const entries = listFiles(dir);
  if (!entries) {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(entryPath));
    } else if (entry.isFile() && /\.ts$/i.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files.sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

function extractImportSpecifiers(sourceText) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[\s\S]*?\s+from\s*)?(["'])([^"']+)\1/g,
    /\bexport\s+(?:type\s+)?[\s\S]*?\s+from\s*(["'])([^"']+)\1/g,
    /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g,
    /\brequire\s*\(\s*(["'])([^"']+)\1\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(sourceText)) !== null) {
      specifiers.push({ specifier: match[2], index: match.index });
    }
  }

  return specifiers.sort((a, b) => a.index - b.index);
}

function runTypecheck() {
  const result = spawnSync("npm", ["--workspace", "@wolf3d/source-typescript-3", "run", "check"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    passed: result.status === 0,
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text[i] === "\n") {
      line += 1;
    }
  }
  return line;
}

function formatCommentPreview(normalizedComment) {
  const maxLength = 160;
  const preview =
    normalizedComment.length > maxLength
      ? `${normalizedComment.slice(0, maxLength - 3)}...`
      : normalizedComment;
  return JSON.stringify(preview);
}

function relativePath(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).replaceAll(path.sep, "/");
}

function printReport(report) {
  console.log("Wolf3D TypeScript port parity");
  console.log(`tier: ${report.tier}`);
  console.log(`repo: ${REPO_ROOT}`);
  console.log(`source: ${relativePath(WOLFSRC_DIR)}`);
  console.log(`target: ${relativePath(TS_SRC_DIR)}`);
  console.log("");

  if (report.sourceError) {
    console.log(`[FAIL] ${report.sourceError}`);
    console.log("");
  }

  console.log(`Ported files (${report.fileResults.length})`);
  for (const fileResult of report.fileResults) {
    console.log(
      `[${fileResult.passed ? "PASS" : "FAIL"}] ${fileResult.sourceName} -> ${fileResult.targetName}`,
    );
    for (const detail of fileResult.details) {
      console.log(`  ${detail}`);
    }
    for (const issue of fileResult.issues) {
      console.log(`  ${issue}`);
    }
  }
  console.log("");

  if (report.fullTierRules) {
    console.log(`Full-tier src rules: ${report.fullTierRules.passed ? "PASS" : "FAIL"}`);
    for (const issue of report.fullTierRules.issues) {
      console.log(`  ${issue}`);
    }
    console.log("");
  }

  console.log("Import style");
  if (report.imports.fileResults.length === 0) {
    console.log("  no TypeScript files found");
  }
  for (const fileResult of report.imports.fileResults) {
    console.log(`[${fileResult.passed ? "PASS" : "FAIL"}] ${relativePath(fileResult.filePath)}`);
    for (const issue of fileResult.issues) {
      console.log(`  ${issue}`);
    }
  }
  console.log("");

  console.log(`Typecheck: ${report.typecheck.passed ? "PASS" : "FAIL"}`);
  if (report.typecheck.error) {
    console.log(`  ${report.typecheck.error.message}`);
  } else if (!report.typecheck.passed) {
    const statusText = report.typecheck.signal
      ? `signal ${report.typecheck.signal}`
      : `exit ${report.typecheck.status ?? "unknown"}`;
    console.log(`  npm --workspace @wolf3d/source-typescript-3 run check failed with ${statusText}`);
  }
  printIndentedOutput("stdout", report.typecheck.stdout);
  printIndentedOutput("stderr", report.typecheck.stderr);
  console.log("");

  console.log(`Result: ${report.passed ? "PASS" : "FAIL"}`);
}

function printIndentedOutput(label, text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  console.log(`  ${label}:`);
  for (const line of trimmed.split(/\r?\n/)) {
    console.log(`    ${line}`);
  }
}

function buildReport(tier) {
  const { files: sourceFiles, error: sourceError } = sourceFilesForTier(tier);
  const { names: targetNames } = exactDirectoryFileNames(TS_SRC_DIR);
  const fileResults = sourceFiles.map((sourceFile) => validatePortedFile(sourceFile, targetNames));
  const fullTierRules = tier === "full" ? validateFullTierSrcRules() : null;
  const imports = validateImports();
  const typecheck = runTypecheck();

  const passed =
    !sourceError &&
    fileResults.every((fileResult) => fileResult.passed) &&
    (!fullTierRules || fullTierRules.passed) &&
    imports.passed &&
    typecheck.passed;

  return {
    tier,
    sourceError,
    fileResults,
    fullTierRules,
    imports,
    typecheck,
    passed,
  };
}

export function validatePortParity(tier) {
  return buildReport(tier);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.ok) {
    console.error(args.message);
    process.exitCode = 2;
    return;
  }

  const report = buildReport(args.tier);
  printReport(report);
  process.exitCode = report.passed ? 0 : 1;
}

const isEntrypoint =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  });
}
