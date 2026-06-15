import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, "source", "WOLFSRC");
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const mirroredExtensions = new Set([".C", ".H", ".ASM"]);
const controlWords = new Set([
  "if",
  "for",
  "while",
  "switch",
  "return",
  "sizeof",
  "defined",
]);

function normalizeSourceForScan(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/^\s*#.*$/gm, " ");
}

function findFunctionDefinitions(text) {
  const cleaned = normalizeSourceForScan(text);
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

function lineCommentSource(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => `// ${line}`)
    .join("\n");
}

function makeModule(sourceName, sourceText) {
  const ext = path.extname(sourceName);
  const functions = ext === ".C" ? findFunctionDefinitions(sourceText) : [];
  const importLine =
    functions.length > 0
      ? 'import { unimplemented } from "./TS_PORT_STATUS";\n\n'
      : "";
  const original = lineCommentSource(sourceText);
  const stubs = functions
    .map(
      (name) => `export function ${name}(..._args: unknown[]): never {
  return unimplemented("${sourceName}", "${name}", _args);
}
`,
    )
    .join("\n");

  return `${importLine}// @generated-from-wolfsrc
// Original file: source/WOLFSRC/${sourceName}
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "${sourceName}";
export const WOLFSRC_FUNCTIONS = ${JSON.stringify(functions, null, 2)} as const;

${stubs}// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
${original}
`;
}

await mkdir(targetDir, { recursive: true });

const entries = await readdir(sourceDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile()) {
    continue;
  }
  const ext = path.extname(entry.name);
  if (!mirroredExtensions.has(ext)) {
    continue;
  }
  const sourcePath = path.join(sourceDir, entry.name);
  const targetPath = path.join(targetDir, `${entry.name}.ts`);
  const sourceText = await readFile(sourcePath, "utf8");
  await writeFile(targetPath, makeModule(entry.name, sourceText), "utf8");
}

console.log(`Generated WOLFSRC mirror modules in ${path.relative(repoRoot, targetDir)}`);
