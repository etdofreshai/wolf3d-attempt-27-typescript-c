import "./styles.css";

/**
 * Host side of the faithful Wolfenstein 3D → TypeScript port.
 *
 * The game itself runs synchronously (like the original DOS program) in a
 * Web Worker — see platform/worker.ts. This thread:
 *   - fetches and mounts the WL6 data files,
 *   - drives the 70 Hz vertical-blank tick the game blocks on,
 *   - blits each presented frame from shared memory onto the canvas.
 */

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

const WL6_FILES = [
  "MAPHEAD.WL6",
  "GAMEMAPS.WL6",
  "VGADICT.WL6",
  "VGAHEAD.WL6",
  "VGAGRAPH.WL6",
  "AUDIOHED.WL6",
  "AUDIOT.WL6",
  "VSWAP.WL6",
  "CONFIG.WL6",
];

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

function fatal(message: string): never {
  const pre = document.createElement("pre");
  pre.textContent = message;
  pre.style.color = "#f55";
  root!.appendChild(pre);
  throw new Error(message);
}

async function start(): Promise<void> {
  if (!crossOriginIsolated)
    fatal(
      "SharedArrayBuffer unavailable: the server must send COOP/COEP headers\n" +
        "(vite dev/preview are configured to — is something else serving this?)",
    );

  // fetch + mount the WL6 data
  const files: Record<string, ArrayBuffer> = {};
  for (const name of WL6_FILES) {
    const res = await fetch(`/wl6data/${name}`);
    if (!res.ok) fatal(`Missing game data: ${name} (${res.status})`);
    files[name] = await res.arrayBuffer();
  }

  // shared memory: VBL counter + frame-dirty flag, and the RGBA framebuffer
  const ctlSab = new SharedArrayBuffer(8);
  const fbSab = new SharedArrayBuffer(SCREEN_WIDTH * SCREEN_HEIGHT * 4);
  const ctl = new Int32Array(ctlSab);
  const fb = new Uint8Array(fbSab);

  const worker = new Worker(new URL("./platform/worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (e) => {
    if (e.data?.quit !== undefined) fatal(`Quit: ${e.data.quit}`);
  };
  worker.onerror = (e) => fatal(`Game thread error: ${e.message}`);
  worker.postMessage({ files, ctl: ctlSab, fb: fbSab });

  // blit dirty frames — the game worker self-paces at 70 Hz; we just paint.
  // rAF for smooth foreground updates, plus a timer fallback so hidden tabs
  // (where rAF is paused) still get frames for screenshots/automation.
  const image = ctx!.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  const blit = () => {
    if (Atomics.compareExchange(ctl, 1, 1, 0) === 1) {
      image.data.set(fb);
      ctx!.putImageData(image, 0, 0);
    }
  };
  const rafLoop = () => {
    blit();
    requestAnimationFrame(rafLoop);
  };
  requestAnimationFrame(rafLoop);
  setInterval(blit, 100);
}

void start();
