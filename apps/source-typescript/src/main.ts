import "./styles.css";
import { findPlayerSpawn, parseWolfMap, type PlayerSpawn, type WolfMap } from "./wl6Map";

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

type PortMap = {
  actors: PortActor[];
  blockingStaticKeys: Set<string>;
  doors: PortDoor[];
  height: number;
  killTotal: number;
  name: string;
  objects: Uint16Array;
  secretTotal: number;
  source: "fallback" | "wl6";
  statics: PortStatic[];
  treasureTotal: number;
  walls: Uint16Array;
  width: number;
};

type PortDoor = {
  action: "closed" | "open" | "opening" | "closing";
  index: number;
  lock: number;
  position: number;
  tile: number;
  vertical: boolean;
  x: number;
  y: number;
};

type PortStatic = {
  blocking: boolean;
  bonus: boolean;
  treasure: boolean;
  type: number;
  x: number;
  y: number;
};

type PortActor = {
  dir: number;
  kind: string;
  mode: "boss" | "dead" | "ghost" | "patrol" | "stand";
  tile: number;
  x: number;
  y: number;
};

type ScanInfoPlaneResult = {
  actors: PortActor[];
  killTotal: number;
  secretTotal: number;
  spawn: PlayerSpawn | null;
  statics: PortStatic[];
  treasureTotal: number;
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
const AREATILE = 107;
const PUSHABLETILE = 98;
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const STATIC_INFO_TYPES = [
  "dressing",
  "block",
  "block",
  "block",
  "dressing",
  "block",
  "bo_alpo",
  "block",
  "block",
  "dressing",
  "block",
  "block",
  "block",
  "block",
  "dressing",
  "dressing",
  "block",
  "block",
  "block",
  "dressing",
  "bo_key1",
  "bo_key2",
  "block",
  "dressing",
  "bo_food",
  "bo_firstaid",
  "bo_clip",
  "bo_machinegun",
  "bo_chaingun",
  "bo_cross",
  "bo_chalice",
  "bo_bible",
  "bo_crown",
  "bo_fullheal",
  "bo_gibs",
  "block",
  "block",
  "block",
  "bo_gibs",
  "block",
  "block",
  "dressing",
  "dressing",
  "dressing",
  "dressing",
  "block",
  "block",
  "dressing",
  "bo_clip2"
] as const;
const TREASURE_STAT_TYPES = new Set(["bo_cross", "bo_chalice", "bo_bible", "bo_crown", "bo_fullheal"]);
const BOSS_INFO_TILES: Record<number, string> = {
  160: "fake_hitler",
  178: "hitler",
  179: "fat",
  196: "schabbs",
  197: "gretel",
  214: "boss",
  215: "gift"
};
const GHOST_INFO_TILES: Record<number, string> = {
  224: "blinky",
  225: "clyde",
  226: "pinky",
  227: "inky"
};

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
            <dt>Map</dt>
            <dd id="map-state">fallback</dd>
          </div>
          <div>
            <dt>Objects</dt>
            <dd id="object-state">--</dd>
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
const mapState = requireElement<HTMLElement>("#map-state");
const objectState = requireElement<HTMLElement>("#object-state");
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
  private animationStarted = false;
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

  async StartGame(): Promise<void> {
    this.id_us.US_Print("StartGame");
    statusLine.textContent = "Loading ID_CA map";
    try {
      const status = await this.id_ca.CacheStartup();
      renderSourceStatus(status);
      const wolfMap = await this.id_ca.CA_CacheMap(0);
      this.wl_game.SetupGameLevel(0, wolfMap);
      this.id_us.US_Print(
        `CA_CacheMap ${wolfMap.header.name || `map ${wolfMap.index}`} ${wolfMap.header.width}x${wolfMap.header.height}`
      );
    } catch (error) {
      this.wl_game.SetupGameLevel(0);
      this.id_us.US_Print(error instanceof Error ? `Fallback map: ${error.message}` : "Fallback map");
    }

    this.lastTime = window.performance.now();
    if (!this.animationStarted) {
      this.animationStarted = true;
      requestAnimationFrame((time) => this.GameLoop(time));
    }

    this.RenderUi();
  }

  ResetGame(): void {
    this.id_sd.SD_StopDigitized();
    this.wl_game.SetupGameLevel(0, this.id_ca.currentMap);
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
        map: this.wl_game.mapMetadata,
        objects: {
          actors: this.wl_game.map.actors.length,
          blockingStatics: this.wl_game.map.blockingStaticKeys.size,
          doors: this.wl_game.map.doors.length,
          statics: this.wl_game.map.statics.length
        },
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
    mapState.textContent = this.wl_game.mapMetadata;
    objectState.textContent = this.wl_game.objectMetadata;
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
  map = createFallbackMap();

  readonly gamestate = {
    angle: 0,
    difficulty: "medium" as "easy" | "medium" | "hard",
    health: 100,
    killcount: 0,
    killtotal: 0,
    level: 0,
    score: 0,
    secretcount: 0,
    secrettotal: 0,
    treasurecount: 0,
    treasuretotal: 0,
    ticcount: 0,
    x: 3.5,
    y: 3.5
  };

  get mapMetadata(): string {
    return `${this.map.name} ${this.map.width}x${this.map.height}`;
  }

  get objectMetadata(): string {
    return `${this.map.doors.length} doors / ${this.map.statics.length} statics / ${this.map.actors.length} actors`;
  }

  SetupGameLevel(level: number, wolfMap: WolfMap | null = null): void {
    let spawn: PlayerSpawn = {
      angle: 0,
      tile: 0,
      x: 3.5,
      y: 3.5
    };

    if (wolfMap) {
      const scan = scanInfoPlane(wolfMap, this.gamestate.difficulty);
      const doors = scanWallPlaneForDoors(wolfMap);
      const blockingStaticKeys = new Set(
        scan.statics.filter((stat) => stat.blocking).map((stat) => tileKey(stat.x, stat.y))
      );

      this.map = {
        actors: scan.actors,
        blockingStaticKeys,
        doors,
        height: wolfMap.header.height,
        killTotal: scan.killTotal,
        name: `WL6 ${wolfMap.index} ${wolfMap.header.name || "unnamed"}`,
        objects: wolfMap.planes[1],
        secretTotal: scan.secretTotal,
        source: "wl6",
        statics: scan.statics,
        treasureTotal: scan.treasureTotal,
        walls: wolfMap.planes[0],
        width: wolfMap.header.width
      };
      spawn = scan.spawn ?? findPlayerSpawn(wolfMap);
    } else if (this.map.source !== "wl6") {
      this.map = createFallbackMap();
    }

    this.gamestate.angle = normalizeAngle(spawn.angle);
    this.gamestate.health = 100;
    this.gamestate.killcount = 0;
    this.gamestate.killtotal = this.map.killTotal;
    this.gamestate.level = level;
    this.gamestate.score = 0;
    this.gamestate.secretcount = 0;
    this.gamestate.secrettotal = this.map.secretTotal;
    this.gamestate.treasurecount = 0;
    this.gamestate.treasuretotal = this.map.treasureTotal;
    this.gamestate.ticcount = 0;
    this.gamestate.x = spawn.x;
    this.gamestate.y = spawn.y;
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
    return this.GetTile(x, y) !== 0 || this.map.blockingStaticKeys.has(tileKey(tileX, tileY));
  }

  GetTile(x: number, y: number): number {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return 1;
    }

    return collisionTile(this.map.walls[tileY * this.map.width + tileX] ?? 1);
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
      const wall = wallRgb(hit.tile, shade / 255, channelOffset);

      for (let y = y0; y <= y1; y += 1) {
        this.id_vl.VL_Plot(image, x, y, wall[0], wall[1], wall[2]);
      }
    }

    this.DrawWeapon(image, wl_game.gamestate.ticcount);
    this.id_vl.VL_Present(image);
  }

  private CastRay(wl_game: WLGame, angle: number): { distance: number; side: number; tile: number } {
    const step = 0.025;
    let distance = 0;
    while (distance < 16) {
      const x = wl_game.gamestate.x + Math.cos(angle) * distance;
      const y = wl_game.gamestate.y + Math.sin(angle) * distance;
      const tile = wl_game.GetTile(x, y);
      if (tile !== 0) {
        return {
          distance,
          side: Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)) ? 0 : 1,
          tile
        };
      }

      distance += step;
    }

    return {
      distance: 16,
      side: 0,
      tile: 1
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
  currentMap: WolfMap | null = null;

  async CacheStartup(): Promise<SourceTypescriptStatus> {
    const response = await fetch("/__source-typescript/status");
    if (!response.ok) {
      throw new Error(`Status returned ${response.status}`);
    }

    return (await response.json()) as SourceTypescriptStatus;
  }

  async CA_CacheMap(mapIndex: number): Promise<WolfMap> {
    const [mapHeadBytes, gameMapsBytes] = await Promise.all([
      fetchBytes("/__source-typescript/asset/MAPHEAD.WL6"),
      fetchBytes("/__source-typescript/asset/GAMEMAPS.WL6")
    ]);

    this.currentMap = parseWolfMap(mapHeadBytes, gameMapsBytes, mapIndex);
    return this.currentMap;
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

  void wlMain.StartGame();
  if (demoPlan && demoPlan.autoStart !== false) {
    window.setTimeout(() => {
      void wlMain.RunDemoPlan();
    }, 500);
  }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function renderSourceStatus(status: SourceTypescriptStatus): void {
  const presentAssets = status.assets.filter((asset) => asset.present).length;
  sourceCount.textContent = `${status.sourceCounts.c} C / ${status.sourceCounts.asm} ASM / ${status.sourceCounts.h} H`;
  assetCount.textContent = `${presentAssets}/${status.assets.length} WL6`;
}

function createFallbackMap(): PortMap {
  const rows = [
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
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  const walls = new Uint16Array(width * height);
  const objects = new Uint16Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const row = rows[y] ?? "";
    for (let x = 0; x < width; x += 1) {
      walls[y * width + x] = row[x] === "0" ? 0 : 1;
    }
  }

  return {
    actors: [],
    blockingStaticKeys: new Set(),
    doors: [],
    height,
    killTotal: 0,
    name: "fallback scaffold",
    objects,
    secretTotal: 0,
    source: "fallback",
    statics: [],
    treasureTotal: 0,
    walls,
    width
  };
}

function scanWallPlaneForDoors(map: WolfMap): PortDoor[] {
  const doors: PortDoor[] = [];
  const { width, height } = map.header;
  const walls = map.planes[0];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = walls[y * width + x] ?? 0;
      if (tile < 90 || tile > 101) {
        continue;
      }

      const vertical = tile % 2 === 0;
      doors.push({
        action: "closed",
        index: doors.length,
        lock: vertical ? (tile - 90) / 2 : (tile - 91) / 2,
        position: 0,
        tile,
        vertical,
        x,
        y
      });
    }
  }

  return doors;
}

function scanInfoPlane(map: WolfMap, difficulty: "easy" | "medium" | "hard"): ScanInfoPlaneResult {
  const statics: PortStatic[] = [];
  const actors: PortActor[] = [];
  let secretTotal = 0;
  let treasureTotal = 0;
  let spawn: PlayerSpawn | null = null;
  const { width, height } = map.header;
  const info = map.planes[1];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = info[y * width + x] ?? 0;
      if (tile === 0) {
        continue;
      }

      if (tile >= 19 && tile <= 22) {
        spawn = {
          angle: spawnAngleForInfoTile(tile),
          tile,
          x: x + 0.5,
          y: y + 0.5
        };
        continue;
      }

      if (tile >= 23 && tile <= 74) {
        const stat = staticFromInfoTile(tile, x, y);
        statics.push(stat);
        if (stat.treasure) {
          treasureTotal += 1;
        }
        continue;
      }

      if (tile === PUSHABLETILE) {
        secretTotal += 1;
        continue;
      }

      const actor = actorFromInfoTile(tile, x, y, difficulty);
      if (actor) {
        actors.push(actor);
      }
    }
  }

  return {
    actors,
    killTotal: actors.filter((actor) => actor.mode !== "ghost" && actor.mode !== "dead").length,
    secretTotal,
    spawn,
    statics,
    treasureTotal
  };
}

function staticFromInfoTile(tile: number, x: number, y: number): PortStatic {
  const type = tile - 23;
  const statType = STATIC_INFO_TYPES[type] ?? "dressing";

  return {
    blocking: statType === "block",
    bonus: statType.startsWith("bo_"),
    treasure: TREASURE_STAT_TYPES.has(statType),
    type,
    x,
    y
  };
}

function actorFromInfoTile(
  tile: number,
  x: number,
  y: number,
  difficulty: "easy" | "medium" | "hard"
): PortActor | null {
  if (tile === 124) {
    return {
      dir: 0,
      kind: "dead_guard",
      mode: "dead",
      tile,
      x,
      y
    };
  }

  const guard = directionalEnemy(tile, difficulty, "guard", 108, 144, 180, "stand")
    ?? directionalEnemy(tile, difficulty, "guard", 112, 148, 184, "patrol")
    ?? directionalEnemy(tile, difficulty, "officer", 116, 152, 188, "stand")
    ?? directionalEnemy(tile, difficulty, "officer", 120, 156, 192, "patrol")
    ?? directionalEnemy(tile, difficulty, "ss", 126, 162, 198, "stand")
    ?? directionalEnemy(tile, difficulty, "ss", 130, 166, 202, "patrol")
    ?? directionalEnemy(tile, difficulty, "dog", 134, 170, 206, "stand")
    ?? directionalEnemy(tile, difficulty, "dog", 138, 174, 210, "patrol")
    ?? directionalEnemy(tile, difficulty, "mutant", 216, 234, 252, "stand")
    ?? directionalEnemy(tile, difficulty, "mutant", 220, 238, 256, "patrol");
  if (guard) {
    return {
      ...guard,
      x,
      y
    };
  }

  const bossKind = BOSS_INFO_TILES[tile];
  if (bossKind) {
    return {
      dir: 0,
      kind: bossKind,
      mode: "boss",
      tile,
      x,
      y
    };
  }

  const ghostKind = GHOST_INFO_TILES[tile];
  if (ghostKind) {
    return {
      dir: 0,
      kind: ghostKind,
      mode: "ghost",
      tile,
      x,
      y
    };
  }

  return null;
}

function directionalEnemy(
  tile: number,
  difficulty: "easy" | "medium" | "hard",
  kind: string,
  easyBase: number,
  mediumBase: number,
  hardBase: number,
  mode: "patrol" | "stand"
): Omit<PortActor, "x" | "y"> | null {
  if (tile >= hardBase && tile <= hardBase + 3) {
    if (difficultyRank(difficulty) < difficultyRank("hard")) {
      return null;
    }

    return {
      dir: tile - hardBase,
      kind,
      mode,
      tile
    };
  }

  if (tile >= mediumBase && tile <= mediumBase + 3) {
    if (difficultyRank(difficulty) < difficultyRank("medium")) {
      return null;
    }

    return {
      dir: tile - mediumBase,
      kind,
      mode,
      tile
    };
  }

  if (tile >= easyBase && tile <= easyBase + 3) {
    return {
      dir: tile - easyBase,
      kind,
      mode,
      tile
    };
  }

  return null;
}

function difficultyRank(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0;
}

function spawnAngleForInfoTile(tile: number): number {
  switch (tile) {
    case 19:
      return -Math.PI / 2;
    case 20:
      return 0;
    case 21:
      return Math.PI / 2;
    case 22:
      return Math.PI;
    default:
      return 0;
  }
}

function wallRgb(tile: number, shade: number, channelOffset: number): [number, number, number] {
  if (tile >= 90 && tile <= 101) {
    return [
      clampByte(88 * shade),
      clampByte(116 * shade + channelOffset),
      clampByte(136 * shade)
    ];
  }

  const fallback: [number, number, number] = [143, 54, 45];
  const palette: Array<[number, number, number]> = [
    fallback,
    [96, 126, 70],
    [69, 109, 154],
    [185, 155, 80],
    [118, 79, 132],
    [157, 82, 54],
    [78, 139, 132],
    [176, 176, 148]
  ];
  const base = palette[Math.abs(tile) % palette.length] ?? fallback;

  return [
    clampByte(base[0] * shade),
    clampByte(base[1] * shade + channelOffset),
    clampByte(base[2] * shade - 24)
  ];
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

function collisionTile(tile: number): number {
  if (tile >= AREATILE) {
    return 0;
  }

  return tile;
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
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
