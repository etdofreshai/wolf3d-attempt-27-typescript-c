import "./styles.css";

type SourceTypescriptStatus = {
  assets: Array<{
    fileName: string;
    present: boolean;
  }>;
  sourceCounts: {
    asm: number;
    c: number;
    h: number;
  };
};

type DemoPlan = {
  name: string;
  autoStart?: boolean;
  steps: DemoPlanStep[];
};

type DemoPlanStep =
  | {
      action: "wait";
      ms: number;
    }
  | {
      action: "key";
      holdMs?: number;
      key: string | number;
    }
  | {
      action: "keydown" | "keyup";
      key: string | number;
    }
  | {
      action: "capture";
      label?: string;
      png?: boolean;
      state?: boolean;
      wav?: boolean;
    };

const KEY_CODES: Record<string, number> = {
  ALT: 18,
  ARROWDOWN: 40,
  ARROWLEFT: 37,
  ARROWRIGHT: 39,
  ARROWUP: 38,
  BACKSPACE: 8,
  CONTROL: 17,
  CTRL: 17,
  ENTER: 13,
  ESC: 27,
  ESCAPE: 27,
  KEYA: 65,
  KEYD: 68,
  KEYN: 78,
  KEYS: 83,
  KEYW: 87,
  KEYY: 89,
  SHIFT: 16,
  SPACE: 32,
  TAB: 9
};

const DEMO_DEFAULT_HOLD_MS = 90;
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}

root.innerHTML = `
  <main class="port-shell">
    <header class="port-toolbar">
      <div class="identity">
        <span>Source TypeScript</span>
        <small id="status-line">Initializing</small>
      </div>
      <div class="actions">
        <button id="reset-game" type="button">Reset</button>
        <button id="tick-game" type="button">Tick</button>
        <button id="run-demo" type="button" disabled>Demo</button>
        <button id="export-png" type="button">PNG</button>
        <button id="export-wav" type="button">WAV</button>
        <button id="export-state" type="button">BIN</button>
      </div>
    </header>
    <section class="workbench">
      <div class="stage" aria-label="TypeScript port renderer">
        <canvas id="screen" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
      </div>
      <aside class="panel">
        <dl class="status-grid">
          <div>
            <dt>Source</dt>
            <dd id="source-count">--</dd>
          </div>
          <div>
            <dt>Assets</dt>
            <dd id="asset-count">--</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd id="runtime-state">--</dd>
          </div>
          <div>
            <dt>Demo</dt>
            <dd id="demo-state">--</dd>
          </div>
        </dl>
        <div class="class-grid" id="class-grid"></div>
        <div class="artifact-list" id="artifact-list" aria-live="polite"></div>
        <pre class="trace-log" id="trace-log" aria-live="polite"></pre>
      </aside>
    </section>
  </main>
`;

const appRoot = root;
const screen = requireElement<HTMLCanvasElement>("#screen");
const statusLine = requireElement<HTMLElement>("#status-line");
const sourceCount = requireElement<HTMLElement>("#source-count");
const assetCount = requireElement<HTMLElement>("#asset-count");
const runtimeState = requireElement<HTMLElement>("#runtime-state");
const demoState = requireElement<HTMLElement>("#demo-state");
const classGrid = requireElement<HTMLElement>("#class-grid");
const artifactList = requireElement<HTMLElement>("#artifact-list");
const traceLog = requireElement<HTMLPreElement>("#trace-log");
const buttonReset = requireElement<HTMLButtonElement>("#reset-game");
const buttonTick = requireElement<HTMLButtonElement>("#tick-game");
const buttonRunDemo = requireElement<HTMLButtonElement>("#run-demo");
const buttonExportPng = requireElement<HTMLButtonElement>("#export-png");
const buttonExportWav = requireElement<HTMLButtonElement>("#export-wav");
const buttonExportState = requireElement<HTMLButtonElement>("#export-state");

class WLMain {
  readonly id_ca: IDCA;
  readonly id_in: IDIN;
  readonly id_sd: IDSD;
  readonly id_us: IDUS;
  readonly id_vl: IDVL;
  readonly wl_draw: WLDraw;
  readonly wl_game: WLGame;
  readonly wl_play: WLPlay;

  private artifactUrls: string[] = [];
  private demoRunning = false;
  private lastTime = 0;
  private readonly demoPlan: DemoPlan | null;

  constructor(screenCanvas: HTMLCanvasElement, demoPlan: DemoPlan | null) {
    this.demoPlan = demoPlan;
    this.id_vl = new IDVL(screenCanvas);
    this.id_in = new IDIN();
    this.id_sd = new IDSD();
    this.id_us = new IDUS();
    this.id_ca = new IDCA();
    this.wl_game = new WLGame();
    this.wl_draw = new WLDraw(this.id_vl);
    this.wl_play = new WLPlay(this.wl_game, this.wl_draw, this.id_in, this.id_sd);
  }

  StartGame(): void {
    this.id_us.US_Print("StartGame");
    this.wl_game.SetupGameLevel(0);
    this.lastTime = window.performance.now();
    requestAnimationFrame((time) => this.GameLoop(time));
    this.RenderUi();
  }

  ResetGame(): void {
    this.id_sd.SD_StopDigitized();
    this.wl_game.SetupGameLevel(0);
    this.wl_play.PlayLoop(1000 / 60);
    this.id_us.US_Print("ResetGame");
    this.RenderUi();
  }

  Tick(ticMs: number): void {
    this.wl_play.PlayLoop(ticMs);
    this.RenderUi();
  }

  async RunDemoPlan(): Promise<void> {
    if (!this.demoPlan || this.demoRunning) {
      return;
    }

    this.demoRunning = true;
    statusLine.textContent = `Demo running: ${this.demoPlan.name}`;
    this.RenderUi();

    try {
      for (const [index, step] of this.demoPlan.steps.entries()) {
        await this.RunDemoStep(step, index);
      }

      statusLine.textContent = `Demo complete: ${this.demoPlan.name}`;
    } catch (error) {
      statusLine.textContent = error instanceof Error ? error.message : "Demo failed";
    } finally {
      this.demoRunning = false;
      this.RenderUi();
    }
  }

  async ExportPng(label: string, autoDownload = true): Promise<void> {
    const blob = await this.id_vl.VL_ScreenToBlob();
    this.RegisterArtifact(blob, artifactFileName("frame", label, "png"), autoDownload);
  }

  async ExportWav(label: string, autoDownload = true): Promise<void> {
    const wav = this.id_sd.SD_ExportWav();
    this.RegisterArtifact(
      new Blob([new Uint8Array(wav)], {
        type: "audio/wav"
      }),
      artifactFileName("audio", label, "wav"),
      autoDownload
    );
  }

  async ExportState(label: string, autoDownload = true): Promise<void> {
    const bytes = encodeText(
      JSON.stringify({
        audioSamples: this.id_sd.sampleCount,
        game: this.wl_game.gamestate,
        runner: "source-typescript",
        ticcount: this.wl_game.gamestate.ticcount
      })
    );
    this.RegisterArtifact(
      new Blob([new Uint8Array(bytes)], {
        type: "application/octet-stream"
      }),
      artifactFileName("state", label, "bin"),
      autoDownload
    );
  }

  private GameLoop(time: number): void {
    const elapsed = Math.min(100, time - this.lastTime);
    this.lastTime = time;
    this.Tick(elapsed);
    requestAnimationFrame((nextTime) => this.GameLoop(nextTime));
  }

  private async RunDemoStep(step: DemoPlanStep, index: number): Promise<void> {
    if (step.action === "wait") {
      await delay(Math.max(0, step.ms));
      return;
    }

    if (step.action === "capture") {
      const label = step.label ?? `step-${index + 1}`;
      if (step.png !== false) {
        await this.ExportPng(label, false);
      }

      if (step.wav) {
        await this.ExportWav(label, false);
      }

      if (step.state) {
        await this.ExportState(label, false);
      }

      return;
    }

    const keyCode = keyCodeFor(step.key);
    if (step.action === "keydown") {
      this.id_in.KeyDown(keyCode);
      return;
    }

    if (step.action === "keyup") {
      this.id_in.KeyUp(keyCode);
      return;
    }

    if (step.action === "key") {
      this.id_in.KeyDown(keyCode);
      await delay(Math.max(1, step.holdMs ?? DEMO_DEFAULT_HOLD_MS));
      this.id_in.KeyUp(keyCode);
    }
  }

  private RegisterArtifact(blob: Blob, fileName: string, autoDownload: boolean): void {
    const url = URL.createObjectURL(blob);
    this.artifactUrls.push(url);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.textContent = `${fileName} (${formatBytes(blob.size)})`;
    artifactList.prepend(link);

    if (autoDownload) {
      link.click();
    }
  }

  private RenderUi(): void {
    runtimeState.textContent = `tic ${this.wl_game.gamestate.ticcount} / ${this.wl_game.gamestate.x.toFixed(2)}, ${this.wl_game.gamestate.y.toFixed(2)}`;
    demoState.textContent = this.demoPlan
      ? this.demoRunning
        ? `Running ${this.demoPlan.name}`
        : `${this.demoPlan.name} (${this.demoPlan.steps.length} steps)`
      : "No plan";
    buttonRunDemo.disabled = !this.demoPlan || this.demoRunning;
    traceLog.textContent = this.id_us.lines.slice(-18).join("\n");
    statusLine.textContent = this.demoRunning ? statusLine.textContent : "Running";
  }
}

class WLPlay {
  constructor(
    private readonly wl_game: WLGame,
    private readonly wl_draw: WLDraw,
    private readonly id_in: IDIN,
    private readonly id_sd: IDSD
  ) {}

  PlayLoop(ticMs: number): void {
    const moved = this.wl_game.ControlMovement(this.id_in, ticMs);
    this.wl_draw.ThreeDRefresh(this.wl_game);
    this.id_sd.SD_Service(moved, ticMs);
  }
}

class WLGame {
  readonly gamestate = {
    angle: 0,
    health: 100,
    level: 0,
    score: 0,
    ticcount: 0,
    x: 3.5,
    y: 3.5
  };

  readonly map = [
    "111111111111",
    "100000000001",
    "101110111101",
    "100010100001",
    "111010101111",
    "100010100001",
    "101110111101",
    "100000000001",
    "101011110101",
    "100000000001",
    "100001000001",
    "111111111111"
  ];

  SetupGameLevel(level: number): void {
    this.gamestate.angle = 0;
    this.gamestate.health = 100;
    this.gamestate.level = level;
    this.gamestate.score = 0;
    this.gamestate.ticcount = 0;
    this.gamestate.x = 3.5;
    this.gamestate.y = 3.5;
  }

  ControlMovement(id_in: IDIN, ticMs: number): boolean {
    const seconds = ticMs / 1000;
    const moveSpeed = 2.4 * seconds;
    const turnSpeed = 2.6 * seconds;
    let moved = false;

    if (id_in.IN_KeyDown(37) || id_in.IN_KeyDown(65)) {
      this.gamestate.angle -= turnSpeed;
      moved = true;
    }

    if (id_in.IN_KeyDown(39) || id_in.IN_KeyDown(68)) {
      this.gamestate.angle += turnSpeed;
      moved = true;
    }

    const forward =
      (id_in.IN_KeyDown(38) || id_in.IN_KeyDown(87) ? 1 : 0) -
      (id_in.IN_KeyDown(40) || id_in.IN_KeyDown(83) ? 1 : 0);

    if (forward !== 0) {
      const nextX = this.gamestate.x + Math.cos(this.gamestate.angle) * moveSpeed * forward;
      const nextY = this.gamestate.y + Math.sin(this.gamestate.angle) * moveSpeed * forward;
      if (!this.IsWall(nextX, this.gamestate.y)) {
        this.gamestate.x = nextX;
      }

      if (!this.IsWall(this.gamestate.x, nextY)) {
        this.gamestate.y = nextY;
      }

      moved = true;
    }

    this.gamestate.angle = normalizeAngle(this.gamestate.angle);
    this.gamestate.ticcount += 1;
    return moved;
  }

  IsWall(x: number, y: number): boolean {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    const row = this.map[tileY];
    if (!row) {
      return true;
    }

    return row[tileX] !== "0";
  }
}

class WLDraw {
  constructor(private readonly id_vl: IDVL) {}

  ThreeDRefresh(wl_game: WLGame): void {
    const image = this.id_vl.VL_BeginFrame();
    const fov = Math.PI / 3;
    const horizon = SCREEN_HEIGHT / 2;

    for (let y = 0; y < SCREEN_HEIGHT; y += 1) {
      const color: [number, number, number] = y < horizon ? [32, 41, 50] : [76, 67, 54];
      for (let x = 0; x < SCREEN_WIDTH; x += 1) {
        this.id_vl.VL_Plot(image, x, y, color[0], color[1], color[2]);
      }
    }

    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      const rayAngle = wl_game.gamestate.angle + (x / SCREEN_WIDTH - 0.5) * fov;
      const hit = this.CastRay(wl_game, rayAngle);
      const corrected = hit.distance * Math.cos(rayAngle - wl_game.gamestate.angle);
      const wallHeight = Math.min(SCREEN_HEIGHT, Math.floor(SCREEN_HEIGHT / Math.max(0.08, corrected)));
      const y0 = Math.max(0, Math.floor(horizon - wallHeight / 2));
      const y1 = Math.min(SCREEN_HEIGHT - 1, Math.floor(horizon + wallHeight / 2));
      const shade = Math.max(48, Math.floor(196 - corrected * 24));
      const channelOffset = hit.side === 0 ? 0 : -24;

      for (let y = y0; y <= y1; y += 1) {
        this.id_vl.VL_Plot(image, x, y, shade, Math.max(40, shade + channelOffset), Math.max(36, shade - 72));
      }
    }

    this.DrawWeapon(image, wl_game.gamestate.ticcount);
    this.id_vl.VL_Present(image);
  }

  private CastRay(wl_game: WLGame, angle: number): { distance: number; side: number } {
    const step = 0.025;
    let distance = 0;
    while (distance < 16) {
      const x = wl_game.gamestate.x + Math.cos(angle) * distance;
      const y = wl_game.gamestate.y + Math.sin(angle) * distance;
      if (wl_game.IsWall(x, y)) {
        return {
          distance,
          side: Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)) ? 0 : 1
        };
      }

      distance += step;
    }

    return {
      distance: 16,
      side: 0
    };
  }

  private DrawWeapon(image: ImageData, ticcount: number): void {
    const bob = Math.floor(Math.sin(ticcount / 8) * 3);
    for (let y = 156 + bob; y < SCREEN_HEIGHT; y += 1) {
      for (let x = 132; x < 188; x += 1) {
        const grip = x > 148 && x < 172 && y > 170;
        this.id_vl.VL_Plot(image, x, y, grip ? 42 : 118, grip ? 38 : 112, grip ? 34 : 96);
      }
    }
  }
}

class IDVL {
  private readonly context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    this.context = context;
  }

  VL_BeginFrame(): ImageData {
    return this.context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  VL_Plot(image: ImageData, x: number, y: number, red: number, green: number, blue: number): void {
    const index = (y * SCREEN_WIDTH + x) * 4;
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = 255;
  }

  VL_Present(image: ImageData): void {
    this.context.putImageData(image, 0, 0);
  }

  VL_ScreenToBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG export failed."));
        }
      }, "image/png");
    });
  }
}

class IDSD {
  readonly sampleRate = 44100;
  sampleCount = 0;
  private readonly chunks: Float32Array[] = [];
  private phase = 0;

  SD_Service(active: boolean, ticMs: number): void {
    const count = Math.max(1, Math.floor((this.sampleRate * ticMs) / 1000));
    const samples = new Float32Array(count);
    const frequency = active ? 132 : 0;

    for (let index = 0; index < count; index += 1) {
      if (frequency > 0) {
        samples[index] = Math.sin(this.phase) * 0.08;
        this.phase += (Math.PI * 2 * frequency) / this.sampleRate;
      }
    }

    this.chunks.push(samples);
    this.sampleCount += samples.length;
    while (this.sampleCount > this.sampleRate * 120 && this.chunks.length > 0) {
      const removed = this.chunks.shift();
      this.sampleCount -= removed?.length ?? 0;
    }
  }

  SD_StopDigitized(): void {
    this.chunks.length = 0;
    this.phase = 0;
    this.sampleCount = 0;
  }

  SD_ExportWav(): Uint8Array {
    const samples = new Float32Array(this.sampleCount);
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    return encodeWav(samples, this.sampleRate);
  }
}

class IDCA {
  async CacheStartup(): Promise<SourceTypescriptStatus> {
    const response = await fetch("/__source-typescript/status");
    if (!response.ok) {
      throw new Error(`Status returned ${response.status}`);
    }

    return (await response.json()) as SourceTypescriptStatus;
  }
}

class IDIN {
  private readonly keys = new Set<number>();

  IN_KeyDown(keyCode: number): boolean {
    return this.keys.has(keyCode);
  }

  KeyDown(keyCode: number): void {
    this.keys.add(keyCode);
  }

  KeyUp(keyCode: number): void {
    this.keys.delete(keyCode);
  }
}

class IDUS {
  readonly lines: string[] = [];

  US_Print(line: string): void {
    this.lines.push(`${new Date().toLocaleTimeString()} ${line}`);
  }
}

startSourceTypescriptApp();

function startSourceTypescriptApp(): void {
  const demoPlan = readDemoPlan();
  const wlMain = new WLMain(screen, demoPlan);

  (window as Window & {
    wolf3dTypeScriptHarness?: {
      exportPng: () => Promise<void>;
      exportState: () => Promise<void>;
      exportWav: () => Promise<void>;
      reset: () => void;
      runDemo: () => Promise<void>;
    };
  }).wolf3dTypeScriptHarness = {
    exportPng: () => wlMain.ExportPng("harness", false),
    exportState: () => wlMain.ExportState("harness", false),
    exportWav: () => wlMain.ExportWav("harness", false),
    reset: () => wlMain.ResetGame(),
    runDemo: () => wlMain.RunDemoPlan()
  };

  buttonReset.addEventListener("click", () => {
    wlMain.ResetGame();
  });

  buttonTick.addEventListener("click", () => {
    wlMain.Tick(1000 / 60);
  });

  buttonRunDemo.addEventListener("click", () => {
    void wlMain.RunDemoPlan();
  });

  buttonExportPng.addEventListener("click", () => {
    void wlMain.ExportPng("manual");
  });

  buttonExportWav.addEventListener("click", () => {
    void wlMain.ExportWav("manual");
  });

  buttonExportState.addEventListener("click", () => {
    void wlMain.ExportState("manual");
  });

  window.addEventListener("keydown", (event) => {
    wlMain.id_in.KeyDown(event.keyCode);
  });

  window.addEventListener("keyup", (event) => {
    wlMain.id_in.KeyUp(event.keyCode);
  });

  classGrid.replaceChildren(
    ...["WLMain", "WLGame", "WLPlay", "WLDraw", "IDCA", "IDIN", "IDSD", "IDUS", "IDVL"].map((name) => {
      const span = document.createElement("span");
      span.textContent = name;
      return span;
    })
  );

  void wlMain.id_ca.CacheStartup().then((status) => {
    const presentAssets = status.assets.filter((asset) => asset.present).length;
    sourceCount.textContent = `${status.sourceCounts.c} C / ${status.sourceCounts.asm} ASM / ${status.sourceCounts.h} H`;
    assetCount.textContent = `${presentAssets}/${status.assets.length} WL6`;
  });

  wlMain.StartGame();
  if (demoPlan && demoPlan.autoStart !== false) {
    window.setTimeout(() => {
      void wlMain.RunDemoPlan();
    }, 500);
  }
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = appRoot.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function readDemoPlan(): DemoPlan | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("demo");
  if (!encoded) {
    return null;
  }

  try {
    const plan = normalizeDemoPlan(JSON.parse(decodeBase64Url(encoded)));
    if (!plan) {
      return null;
    }

    const autoStart = params.get("autorun") === "0" ? false : (plan.autoStart ?? true);
    return {
      ...plan,
      autoStart
    };
  } catch {
    statusLine.textContent = "Invalid demo plan";
    return null;
  }
}

function normalizeDemoPlan(value: unknown): DemoPlan | null {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    return null;
  }

  const steps = value.steps.filter(isDemoPlanStep);
  if (steps.length === 0) {
    return null;
  }

  const name = typeof value.name === "string" && value.name.trim().length > 0
    ? value.name.trim()
    : "cli-demo";

  return {
    ...(typeof value.autoStart === "boolean" ? { autoStart: value.autoStart } : {}),
    name,
    steps
  };
}

function isDemoPlanStep(value: unknown): value is DemoPlanStep {
  if (!isRecord(value) || typeof value.action !== "string") {
    return false;
  }

  if (value.action === "wait") {
    return typeof value.ms === "number";
  }

  if (value.action === "capture") {
    return true;
  }

  if (value.action === "key" || value.action === "keydown" || value.action === "keyup") {
    return typeof value.key === "string" || typeof value.key === "number";
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function keyCodeFor(key: string | number): number {
  if (typeof key === "number") {
    return key;
  }

  const normalized = key.replace(/[\s_-]/g, "").toUpperCase();
  const mapped = KEY_CODES[normalized] ?? KEY_CODES[`KEY${normalized}`];
  if (mapped) {
    return mapped;
  }

  if (normalized.length === 1) {
    return normalized.charCodeAt(0);
  }

  throw new Error(`Unknown demo key: ${key}`);
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function artifactFileName(kind: string, label: string, extension: string): string {
  const suffix = label.trim().length > 0 ? `-${slug(label)}` : "";
  return `wolf3d-source-typescript-${kind}${suffix}.${extension}`;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function normalizeAngle(angle: number): number {
  const tau = Math.PI * 2;
  return ((angle % tau) + tau) % tau;
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const channelCount = 1;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}
