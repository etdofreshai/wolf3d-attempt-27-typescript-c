import "./styles.css";
import { Engine, SCREEN_HEIGHT, SCREEN_WIDTH, type EngineHud } from "./engine";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

root.innerHTML = `
  <div class="ts-shell">
    <header class="ts-toolbar">
      <div class="identity">
        <span>Source TypeScript</span>
        <small>Native browser port — ${SCREEN_WIDTH}×${SCREEN_HEIGHT} framebuffer</small>
      </div>
      <dl class="ts-readouts">
        <div><dt>FPS</dt><dd id="fps">--</dd></div>
        <div><dt>Input</dt><dd id="input">idle</dd></div>
      </dl>
    </header>
    <main class="ts-stage">
      <canvas id="screen" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
    </main>
    <footer class="ts-footer">
      Scaffold only — the raycaster, asset loader, and game logic go in
      <code>src/</code>. Move with <kbd>WASD</kbd> / arrows to see input wired up.
    </footer>
  </div>
`;

const canvas = requireElement<HTMLCanvasElement>("#screen");
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas 2D context unavailable.");
}

// Nearest-neighbour upscale: keep the chunky DOS pixels crisp.
ctx.imageSmoothingEnabled = false;

const fpsReadout = requireElement<HTMLElement>("#fps");
const inputReadout = requireElement<HTMLElement>("#input");

const hud: EngineHud = {
  setFps: (fps) => {
    fpsReadout.textContent = String(fps);
  },
  setInput: (description) => {
    inputReadout.textContent = description;
  }
};

const engine = new Engine(ctx, hud);
engine.start(performance.now());

if (import.meta.hot) {
  import.meta.hot.dispose(() => engine.stop());
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = root!.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}
