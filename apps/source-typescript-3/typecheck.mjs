#!/usr/bin/env node
// Typecheck driver for the faithful-name port.
//
// The ported modules use UPPERCASE on-disk names with an UPPERCASE ".TS"
// extension (e.g. src/WL_DEF.H.TS). TypeScript's `include` globs only
// enumerate files with the standard lowercase extensions (.ts/.tsx/.d.ts),
// so `tsc -p tsconfig.json` silently skips every ported module unless it is
// transitively imported from an included file. Explicit `files` entries DO
// work, so this script generates tsconfig.typecheck.json with every
// src/*.TS module listed explicitly (plus the normal include set) and runs
// tsc against it. This makes `npm run check` actually typecheck the port.
import { readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Only the faithful UPPERCASE ".TS" files need explicit listing; lowercase
// .ts files (src/main.ts, tests, vite.config.ts) are picked up by `include`.
const files = readdirSync(join(here, "src"))
  .filter((name) => name.endsWith(".TS"))
  .sort()
  .map((name) => `src/${name}`);

const config = {
  extends: "./tsconfig.json",
  files,
  include: ["src", "tests", "vite.config.ts"],
};
writeFileSync(
  join(here, "tsconfig.typecheck.json"),
  `${JSON.stringify(config, null, 2)}\n`,
);

const tscBin = require.resolve("typescript/bin/tsc");
const result = spawnSync(
  process.execPath,
  [tscBin, "-p", "tsconfig.typecheck.json", "--noEmit"],
  { cwd: here, stdio: "inherit" },
);
process.exit(result.status ?? 1);
