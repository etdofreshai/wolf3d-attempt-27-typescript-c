import net from "node:net";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

const STEAM_DOS_FILES = [
  "WOLF3D.EXE",
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

export default defineConfig({
  plugins: [launcherStatusPlugin()]
});

function launcherStatusPlugin(): Plugin {
  const repoRoot = path.resolve(__dirname, "../..");
  const steamBase = path.join(repoRoot, "steam", "base");
  const sourceRoot = path.join(repoRoot, "source", "WOLFSRC");
  const privateToolchainRoot = path.join(repoRoot, "deps", "borland");

  return {
    name: "launcher-status",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if ((request.url ?? "") !== "/__launcher/status") {
          next();
          return;
        }

        const steamPresent = await Promise.all(
          STEAM_DOS_FILES.map(async (fileName) => exists(path.join(steamBase, fileName)))
        );
        const sourceCounts = await countSourceTree(sourceRoot);
        const toolchain = await detectToolchain(privateToolchainRoot);

        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            servers: {
              launcher: true,
              steam: await checkPort(5174),
              source: await checkPort(5175)
            },
            source: {
              ...sourceCounts,
              canBuild: toolchain.canBuild,
              missingToolchain: toolchain.missing,
              ready: await exists(sourceRoot),
              sourceExe: await exists(path.join(sourceRoot, "WOLF3D.EXE"))
            },
            steam: {
              filesPresent: steamPresent.filter(Boolean).length,
              filesTotal: STEAM_DOS_FILES.length,
              ready: steamPresent.every(Boolean)
            }
          })
        );
      });
    }
  };
}

async function countSourceTree(root: string): Promise<{
  asm: number;
  c: number;
  h: number;
  mounted: number;
}> {
  const counts = {
    asm: 0,
    c: 0,
    h: 0,
    mounted: 0
  };

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      counts.mounted += 1;
      const extension = path.extname(entry.name).toUpperCase();
      if (extension === ".ASM") {
        counts.asm += 1;
      } else if (extension === ".C") {
        counts.c += 1;
      } else if (extension === ".H") {
        counts.h += 1;
      }
    }
  }

  if (await exists(root)) {
    await walk(root);
  }

  return counts;
}

async function detectToolchain(privateRoot: string): Promise<{ canBuild: boolean; missing: string[] }> {
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

  let bestMissing: string[] | null = null;

  for (const root of roots) {
    const missing = await missingToolchainFiles(root);
    if (missing.length === 0) {
      return {
        canBuild: true,
        missing: []
      };
    }

    if (missing.length < 5 && (!bestMissing || missing.length < bestMissing.length)) {
      bestMissing = missing;
    }
  }

  return {
    canBuild: false,
    missing: bestMissing ?? ["BCC.EXE", "TASM.EXE", "TLINK.EXE", "INCLUDE", "LIB"]
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

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: "127.0.0.1",
      port,
      timeout: 350
    });

    let settled = false;
    const finish = (online: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(online);
    };

    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}
