import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

const LOCAL_MAP_FILES = {
  "MAPHEAD.WL6": "maphead",
  "GAMEMAPS.WL6": "gamemaps"
} as const;

const LOCAL_DOS_FILES = [
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
  plugins: [localWolfDataPlugin()]
});

function localWolfDataPlugin(): Plugin {
  const repoRoot = path.resolve(__dirname, "../..");
  const steamBase = path.join(repoRoot, "steam", "base");
  const emulatorsDir = path.join(repoRoot, "node_modules", "js-dos", "dist", "emulators");

  return {
    name: "local-wolf-data",
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

        if (requestUrl === "/__local-dos/status") {
          const files = await Promise.all(
            LOCAL_DOS_FILES.map(async (fileName) => ({
              fileName,
              present: await exists(path.join(steamBase, fileName))
            }))
          );

          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ files }));
          return;
        }

        if (requestUrl.startsWith("/__local-dos/")) {
          const fileName = requestUrl.replace("/__local-dos/", "").toUpperCase();
          if (!LOCAL_DOS_FILES.includes(fileName as (typeof LOCAL_DOS_FILES)[number])) {
            next();
            return;
          }

          const filePath = path.join(steamBase, fileName);
          if (!(await exists(filePath))) {
            response.statusCode = 404;
            response.end("Missing local DOS file");
            return;
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(response);
          return;
        }

        if (requestUrl === "/__local-wl6/status") {
          const status = {
            maphead: await exists(path.join(steamBase, "MAPHEAD.WL6")),
            gamemaps: await exists(path.join(steamBase, "GAMEMAPS.WL6"))
          };

          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify(status));
          return;
        }

        const fileName = requestUrl.replace("/__local-wl6/", "");
        if (!Object.hasOwn(LOCAL_MAP_FILES, fileName)) {
          next();
          return;
        }

        const filePath = path.join(steamBase, fileName);
        if (!(await exists(filePath))) {
          response.statusCode = 404;
          response.end("Missing local WL6 file");
          return;
        }

        response.setHeader("Content-Type", "application/octet-stream");
        response.setHeader("Cache-Control", "no-store");
        createReadStream(filePath).pipe(response);
      });
    }
  };
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
