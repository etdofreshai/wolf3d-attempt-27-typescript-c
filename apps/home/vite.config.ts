import { defineConfig } from "vite";

// The launcher links to every game app by its fixed dev-server port, so this
// port (and the game ports in apps/*/vite.config.ts) must stay stable.
export default defineConfig({
  server: {
    port: 5170,
    strictPort: true
  }
});
