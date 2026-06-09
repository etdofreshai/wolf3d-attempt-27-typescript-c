import { createReadStream } from "node:fs";
import { access, readdir } from "node:fs/promises";
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

export default defineConfig({
  plugins: [sourceTypescriptStatusPlugin()]
});

function sourceTypescriptStatusPlugin(): Plugin {
  const repoRoot = path.resolve(__dirname, "../..");
  const steamBase = path.join(repoRoot, "steam", "base");
  const sourceRoot = path.join(repoRoot, "source", "WOLFSRC");

  return {
    name: "source-typescript-status",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url ?? "";

        if (requestUrl.startsWith("/__source-typescript/asset/")) {
          const fileName = decodeURIComponent(
            requestUrl.replace("/__source-typescript/asset/", "")
          ).toUpperCase();
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

        if (requestUrl !== "/__source-typescript/status") {
          next();
          return;
        }

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
            sourceCounts: await countSourceTree(sourceRoot)
          })
        );
      });
    }
  };
}

async function countSourceTree(root: string): Promise<{ asm: number; c: number; h: number }> {
  const counts = {
    asm: 0,
    c: 0,
    h: 0
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

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
