import { defineConfig } from "vite";

// Fixed port so the launcher (apps/home) can link here reliably. Keep this in
// sync with the `devPort` for "source-typescript" in apps/home/src/versions.ts.
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true
  }
});
