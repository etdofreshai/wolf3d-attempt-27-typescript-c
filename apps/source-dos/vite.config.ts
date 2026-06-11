import { createReadStream } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

const DOS_ASSET_FILES = [
  "AUDIOHED.WL6",
  "AUDIOT.WL6",
  "CONFIG.WL6",
  "GAMEMAPS.WL6",
  "MAPHEAD.WL6",
  "VGADICT.WL6",
  "VGAGRAPH.WL6",
  "VGAHEAD.WL6",
  "VSWAP.WL6"
] as const;

type SourceEntry = {
  path: string;
  size: number;
  kind: "source" | "build" | "binary" | "doc";
};

type ToolchainEntry = {
  path: string;
  size: number;
};

export default defineConfig({
  // Fixed port so the launcher (apps/home) can link here reliably.
  server: {
    port: 5172,
    strictPort: true
  },
  plugins: [sourceDosPlugin()]
});

function sourceDosPlugin(): Plugin {
  const repoRoot = path.resolve(__dirname, "../..");
  const sourceRoot = path.join(repoRoot, "source", "WOLFSRC");
  const steamBase = path.join(repoRoot, "steam", "base");
  const emulatorsDir = path.join(repoRoot, "node_modules", "js-dos", "dist", "emulators");
  const privateToolchainRoot = path.join(repoRoot, "deps", "borland");

  return {
    name: "source-dos-data",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url ?? "";

        if (requestUrl.startsWith("/emulators/")) {
          const relativePath = decodeURIComponent(requestUrl.replace("/emulators/", ""));
          const filePath = path.resolve(emulatorsDir, relativePath);

          if (!filePath.startsWith(emulatorsDir) || !(await isFile(filePath))) {
            next();
            return;
          }

          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Type", contentType(filePath));
          createReadStream(filePath).pipe(response);
          return;
        }

        if (requestUrl === "/__source-dos/status") {
          const sourceFiles = await sourceManifest(sourceRoot);
          const toolchain = await detectToolchain(privateToolchainRoot);
          const assets = await Promise.all(
            DOS_ASSET_FILES.map(async (fileName) => ({
              fileName,
              present: await exists(path.join(steamBase, fileName))
            }))
          );

          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              assets,
              sourceExe: {
                fileName: "source/WOLFSRC/WOLF3D.EXE",
                present: await exists(path.join(sourceRoot, "WOLF3D.EXE"))
              },
              sourceCounts: countSourceFiles(sourceFiles),
              sourceFiles,
              toolchain
            })
          );
          return;
        }

        if (requestUrl.startsWith("/__source-dos/asset/")) {
          const fileName = decodeURIComponent(requestUrl.replace("/__source-dos/asset/", "")).toUpperCase();
          if (!DOS_ASSET_FILES.includes(fileName as (typeof DOS_ASSET_FILES)[number])) {
            next();
            return;
          }

          const filePath = path.join(steamBase, fileName);
          if (!(await exists(filePath))) {
            response.statusCode = 404;
            response.end("Missing local DOS asset");
            return;
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(response);
          return;
        }

        if (requestUrl.startsWith("/__source-dos/toolchain/")) {
          const toolchain = await detectToolchain(privateToolchainRoot);
          if (!toolchain.foundRoot) {
            response.statusCode = 404;
            response.end("Missing local toolchain root");
            return;
          }

          const relativePath = decodeURIComponent(requestUrl.replace("/__source-dos/toolchain/", ""));
          const filePath = path.resolve(toolchain.foundRoot, relativePath);

          if (!isInside(toolchain.foundRoot, filePath) || !(await isFile(filePath))) {
            next();
            return;
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(response);
          return;
        }

        if (requestUrl.startsWith("/__source-dos/source/")) {
          const relativePath = decodeURIComponent(requestUrl.replace("/__source-dos/source/", ""));
          const filePath = path.resolve(sourceRoot, relativePath);

          if (!isInside(sourceRoot, filePath) || !(await isFile(filePath))) {
            next();
            return;
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(response);
          return;
        }

        next();
      });
    }
  };
}

async function sourceManifest(root: string): Promise<SourceEntry[]> {
  const files: SourceEntry[] = [];

  async function walk(directory: string, prefix = ""): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      files.push({
        kind: classify(relativePath),
        path: relativePath,
        size: (await stat(absolutePath)).size
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function toolchainManifest(root: string): Promise<ToolchainEntry[]> {
  const files: ToolchainEntry[] = [];

  async function walk(directory: string, prefix = ""): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (entry.name.startsWith("_")) {
          continue;
        }

        await walk(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name === ".gitkeep") {
        continue;
      }

      files.push({
        path: relativePath,
        size: (await stat(absolutePath)).size
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function classify(relativePath: string): SourceEntry["kind"] {
  const extension = path.extname(relativePath).toUpperCase();
  if (extension === ".C" || extension === ".H" || extension === ".ASM" || extension === ".EQU" || extension === ".ASI") {
    return "source";
  }

  if (extension === ".PRJ" || extension === ".IDE" || extension === ".DSK" || extension === ".OBR" || extension === ".MAP" || extension === ".OBJ" || extension === ".BAT") {
    return "build";
  }

  if (extension === ".EXE") {
    return "binary";
  }

  return "doc";
}

function countSourceFiles(files: SourceEntry[]): { asm: number; c: number; h: number; mounted: number } {
  return {
    asm: files.filter((file) => file.path.toUpperCase().endsWith(".ASM")).length,
    c: files.filter((file) => file.path.toUpperCase().endsWith(".C")).length,
    h: files.filter((file) => file.path.toUpperCase().endsWith(".H")).length,
    mounted: files.length
  };
}

async function detectToolchain(privateRoot: string): Promise<{
  canBuild: boolean;
  checkedRoots: string[];
  files: ToolchainEntry[];
  foundRoot: string | null;
  missing: string[];
}> {
  const roots = [
    process.env.BORLANDC_ROOT,
    process.env.BC_ROOT,
    privateRoot,
    "C:\\BC30",
    "C:\\BC31",
    "C:\\BC4",
    "C:\\BORLANDC",
    "C:\\TC"
  ].filter((root): root is string => Boolean(root));

  let bestPartial: { root: string; missing: string[] } | null = null;

  for (const root of roots) {
    const missing = await missingToolchainFiles(root);
    if (missing.length === 0) {
      return {
        canBuild: true,
        checkedRoots: roots,
        files: await toolchainManifest(root),
        foundRoot: root,
        missing: []
      };
    }

    if (missing.length < 5 && (!bestPartial || missing.length < bestPartial.missing.length)) {
      bestPartial = { root, missing };
    }
  }

  if (bestPartial) {
    return {
      canBuild: false,
      checkedRoots: roots,
      files: await toolchainManifest(bestPartial.root),
      foundRoot: bestPartial.root,
      missing: bestPartial.missing
    };
  }

  return {
    canBuild: false,
    checkedRoots: roots,
    files: [],
    foundRoot: null,
    missing: ["BCC.EXE", "TASM.EXE", "TLINK.EXE", "INCLUDE", "LIB"]
  };
}

async function missingToolchainFiles(root: string): Promise<string[]> {
  const required: Array<[string, string[]]> = [
    ["BCC.EXE", [path.join(root, "BIN", "BCC.EXE"), path.join(root, "BCC.EXE")]],
    ["TASM.EXE", [path.join(root, "BIN", "TASM.EXE"), path.join(root, "TASM.EXE")]],
    ["TLINK.EXE", [path.join(root, "BIN", "TLINK.EXE"), path.join(root, "TLINK.EXE")]],
    ["INCLUDE", [path.join(root, "INCLUDE")]],
    ["LIB", [path.join(root, "LIB")]]
  ];

  const missing: string[] = [];
  for (const [name, candidates] of required) {
    if (!(await anyExists(candidates))) {
      missing.push(name);
    }
  }

  return missing;
}

async function anyExists(paths: string[]): Promise<boolean> {
  for (const filePath of paths) {
    if (await exists(filePath)) {
      return true;
    }
  }

  return false;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function isInside(root: string, filePath: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`);
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".wasm")) {
    return "application/wasm";
  }

  if (filePath.endsWith(".js")) {
    return "text/javascript";
  }

  if (filePath.endsWith(".map")) {
    return "application/json";
  }

  return "application/octet-stream";
}
