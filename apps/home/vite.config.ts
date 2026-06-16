import { defineConfig } from "vite";
import { resolve } from "node:path";

// The launcher links to every game app by its fixed dev-server port, so this
// port (and the game ports in apps/*/vite.config.ts) must stay stable.
export default defineConfig({
  server: {
    port: 5170,
    strictPort: true
  },
  // Multi-page: the launcher (index.html) plus the Developer's Corner (dev.html).
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dev: resolve(__dirname, "dev.html")
      }
    }
  }
});
