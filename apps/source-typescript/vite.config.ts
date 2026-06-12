import { defineConfig, type Plugin } from "vite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

// The game runs synchronously in a worker blocking on Atomics.wait, which
// requires SharedArrayBuffer => cross-origin isolation headers.
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

// Serve the canonical WL6 data (PORTING.md §2) from steam/base at /wl6data/.
const wl6base = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../steam/base",
);

function wl6data(): Plugin {
  const serve = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (!req.url?.startsWith("/wl6data/")) return next();
    const name = decodeURIComponent(req.url.slice("/wl6data/".length));
    if (!/^[A-Za-z0-9._-]+$/.test(name)) {
      res.statusCode = 400;
      return res.end("bad name");
    }
    const file = path.join(wl6base, name.toUpperCase());
    if (!existsSync(file)) {
      res.statusCode = 404;
      return res.end("not found");
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.end(readFileSync(file));
  };
  return {
    name: "wl6data",
    configureServer(server) {
      server.middlewares.use(serve);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve);
    },
  };
}

// Fixed port so the launcher (apps/home) can link here reliably. Keep this in
// sync with the `devPort` for "source-typescript" in apps/home/src/versions.ts.
export default defineConfig({
  plugins: [wl6data()],
  server: {
    port: 5174,
    strictPort: true,
    headers: isolationHeaders,
  },
  preview: {
    headers: isolationHeaders,
  },
});
