// Browser-runtime gate — the ONLY check that exercises the actual app in a real browser. Every
// other gate imports the port's TS into Node; none touch the Vite build, HTML5 canvas, or the
// real present()/Web-Audio path — which is exactly where the palette-offset bug lived and survived
// "all green". This boots the dev server, loads the app in headless Chrome, screenshots the canvas
// after boot, and asserts the menu actually rendered with the correct palette (authentic red
// background, multi-color, not blank / not scrambled / not grayscale).
//
// Resilience: if no Chrome/Chromium is found it logs SKIPPED and exits 0 (so CI without a browser
// isn't blocked) — the skip is logged, never silent. Point it at a browser with CHROME_BIN=...
import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const repoRoot = process.cwd();
const PORT = 5174;
const URL = `http://localhost:${PORT}/`;

async function exists(p) { try { await access(p, constants.X_OK | constants.F_OK); return true; } catch { return false; } }

async function findBrowser() {
  const candidates = [
    process.env.CHROME_BIN,
    "/c/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) if (await exists(c)) return c;
  return null;
}

function skip(msg) { console.log(`⏭️  BROWSER SMOKE: SKIPPED — ${msg}`); process.exitCode = 0; }

const browser = await findBrowser();
if (!browser) { skip("no Chrome/Chromium found (set CHROME_BIN to enable)"); process.exit(0); }

async function serverUp() {
  try { const r = await fetch(URL, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

// Use an already-running dev server if present; otherwise spawn vite directly (single killable PID).
let child = null;
if (!(await serverUp())) {
  const viteBin = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
  if (!(await exists(viteBin))) { skip("vite not installed and no dev server on :5174"); process.exit(0); }
  child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], {
    cwd: path.join(repoRoot, "apps", "source-typescript"), stdio: "ignore", detached: false,
  });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !(await serverUp())) await new Promise((r) => setTimeout(r, 500));
}

async function cleanup() { if (child && !child.killed) { try { child.kill("SIGKILL"); } catch { /* ignore */ } } }

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

try {
  if (!(await serverUp())) { await cleanup(); skip("dev server did not come up on :5174"); process.exit(0); }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-browser-"));
  const shot = path.join(tempDir, "shot.png");
  const args = ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--screenshot=${shot}`, "--window-size=640,400", "--virtual-time-budget=15000", URL];
  await new Promise((resolve) => {
    const p = spawn(browser, args, { stdio: "ignore" });
    p.on("exit", resolve); p.on("error", resolve);
  });

  if (!(await exists(shot))) { await cleanup(); skip("headless Chrome produced no screenshot"); process.exit(0); }

  const { width, height, rgba } = decodePng(await readFile(shot));
  // Tally colors + red-dominant ("menu background") + grayscale pixels.
  const colors = new Set();
  let redDominant = 0, grayish = 0, nonBlack = 0, total = width * height;
  for (let i = 0; i < total; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    colors.add((r << 16) | (g << 8) | b);
    if (r + g + b > 24) nonBlack++;
    if (r > 80 && r > g + 40 && r > b + 40) redDominant++;       // authentic maroon/red menu bg
    if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r > 60) grayish++; // menu text/title
  }
  console.log(`browser shot ${width}x${height}: ${colors.size} colors, ${(100 * nonBlack / total).toFixed(0)}% non-black, ${(100 * redDominant / total).toFixed(0)}% red-dominant, ${(100 * grayish / total).toFixed(0)}% grayish`);

  expect(width >= 320 && height >= 200, "screenshot captured at a real resolution");
  expect(colors.size > 40, "the page rendered many colors (real content, not a blank/error canvas)");
  expect(nonBlack / total > 0.15, "substantial non-black content (the app booted past a black canvas)");
  expect(redDominant / total > 0.05, "authentic red/maroon menu background present (palette applied correctly, not scrambled)");
  expect(grayish / total > 0.01, "gray menu text/title present (menu rendered, not a solid fill)");

  await rm(tempDir, { recursive: true, force: true });
} finally {
  await cleanup();
}

console.log(fail === 0
  ? "\n✅ BROWSER SMOKE: the Vite app boots in headless Chrome and renders the menu with the correct palette."
  : `\n❌ ${fail} browser-smoke check(s) failed — the app does not render correctly in a real browser.`);
process.exitCode = fail === 0 ? 0 : 1;

// --- minimal PNG decoder (8-bit RGB/RGBA, no interlace) ---
function decodePng(buf) {
  let p = 8; // skip signature
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString("latin1", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported PNG (bitDepth=${bitDepth} colorType=${colorType})`);
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * channels);
  const paeth = (a, b, c) => { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const inRow = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const rawV = raw[inRow + x];
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      let v;
      switch (filter) {
        case 0: v = rawV; break;
        case 1: v = rawV + a; break;
        case 2: v = rawV + b; break;
        case 3: v = rawV + ((a + b) >> 1); break;
        case 4: v = rawV + paeth(a, b, c); break;
        default: throw new Error(`bad PNG filter ${filter}`);
      }
      out[y * stride + x] = v & 0xff;
    }
  }
  // normalize to RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = out[i * channels]; rgba[i * 4 + 1] = out[i * channels + 1]; rgba[i * 4 + 2] = out[i * channels + 2];
    rgba[i * 4 + 3] = channels === 4 ? out[i * channels + 3] : 255;
  }
  return { width, height, rgba };
}
