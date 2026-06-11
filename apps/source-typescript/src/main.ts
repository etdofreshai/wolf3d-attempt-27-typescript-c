import "./styles.css";

/**
 * Entry point for the faithful Wolfenstein 3D → TypeScript port.
 *
 * This is intentionally near-empty. The port follows PORTING.md (repo root):
 *   - WOLFSRC/   one .C.ts / .H.ts module per original C file (1:1 mirror)
 *   - platform/  the browser hardware layer (canvas / keyboard / audio) that
 *                backs the ID_VL / ID_IN / ID_SD ports — the modern stand-in
 *                for the original's DOS hardware layer.
 *
 * For now this just mounts the 320x200 VGA surface so the build boots to a
 * black screen. The ported entry point (the equivalent of WL_MAIN's `main`)
 * will take over rendering into this canvas.
 */

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}

const canvas = document.createElement("canvas");
canvas.id = "screen";
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
root.appendChild(canvas);

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas 2D context unavailable.");
}
ctx.imageSmoothingEnabled = false; // keep the chunky DOS pixels crisp
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

// Porting starts here: wire up platform/ then call into WOLFSRC/.
