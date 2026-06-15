import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
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
  "VSWAP.WL6",
] as const;

// Fixed port so the launcher (apps/home) can link here reliably. Keep this in
// sync with the `devPort` for "source-typescript" in apps/home/src/versions.ts.
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true
  },
  plugins: [sourceTypescriptAssetsPlugin()]
});

function sourceTypescriptAssetsPlugin(): Plugin {
  const repoRoot = path.resolve(__dirname, "../..");
  const steamBase = path.join(repoRoot, "steam", "base");
  const wolfsrcRoot = path.join(repoRoot, "source", "WOLFSRC");

  return {
    name: "source-typescript-assets",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url ?? "";

        if (requestUrl.startsWith("/__source-typescript/asset/")) {
          const fileName = decodeURIComponent(requestUrl.replace("/__source-typescript/asset/", "")).toUpperCase();
          if (!DOS_ASSET_FILES.includes(fileName as (typeof DOS_ASSET_FILES)[number])) {
            next();
            return;
          }

          const filePath = path.join(steamBase, fileName);
          if (!(await isFile(filePath))) {
            response.statusCode = 404;
            response.end("Missing local WL6 asset");
            return;
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(response);
          return;
        }

        if (requestUrl.startsWith("/__source-typescript/source/")) {
          const relativePath = decodeURIComponent(requestUrl.replace("/__source-typescript/source/", ""));
          const filePath = path.resolve(wolfsrcRoot, relativePath);

          if (!isInside(wolfsrcRoot, filePath) || !(await isFile(filePath))) {
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

async function isFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
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
