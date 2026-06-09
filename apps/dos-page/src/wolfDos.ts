import { SOURCE_ANCHORS } from "./sourceAnchors";
import {
  type PlayerSpawn,
  type WolfMap,
  findPlayerSpawn,
  parseWolfMap,
  readFileBytes
} from "./wl6Map";

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 200;
const FOV = Math.PI / 3;
const TIC_MS = 1000 / 70;
const MOVE_PER_TIC = 0.045;
const STRAFE_PER_TIC = 0.038;
const TURN_PER_TIC = Math.PI / 90;
const COLLISION_RADIUS = 0.19;
const FIXED_SCALE = 65536;

type WorldMap = {
  width: number;
  height: number;
  walls: Uint16Array;
  label: string;
  source: "procedural" | "wl6";
};

type Player = {
  x: number;
  y: number;
  angle: number;
};

type Controls = {
  forward: number;
  strafe: number;
  turn: number;
};

type Hit = {
  distance: number;
  tile: number;
  side: 0 | 1;
};

export function createWolfDosApp(root: HTMLElement): void {
  root.innerHTML = appMarkup();

  const canvas = requireElement<HTMLCanvasElement>(root, "#screen");
  const rawContext = canvas.getContext("2d");
  if (!rawContext) {
    throw new Error("2D canvas context is not available.");
  }

  const context: CanvasRenderingContext2D = rawContext;
  context.imageSmoothingEnabled = false;

  const runButton = requireElement<HTMLButtonElement>(root, "#run-button");
  const stepButton = requireElement<HTMLButtonElement>(root, "#step-button");
  const resetButton = requireElement<HTMLButtonElement>(root, "#reset-button");
  const loadButton = requireElement<HTMLButtonElement>(root, "#load-button");
  const localButton = requireElement<HTMLButtonElement>(root, "#local-button");
  const mapHeadInput = requireElement<HTMLInputElement>(root, "#maphead-input");
  const gameMapsInput = requireElement<HTMLInputElement>(root, "#gamemaps-input");
  const mapIndexInput = requireElement<HTMLInputElement>(root, "#map-index");
  const status = requireElement<HTMLElement>(root, "#status");
  const loadStatus = requireElement<HTMLElement>(root, "#load-status");
  const mapReadout = requireElement<HTMLElement>(root, "#map-readout");
  const positionReadout = requireElement<HTMLElement>(root, "#position-readout");
  const sourceList = requireElement<HTMLElement>(root, "#source-list");

  let mapHeadBytes: Uint8Array | null = null;
  let gameMapsBytes: Uint8Array | null = null;
  let world = createProceduralWorld();
  let initialPlayer = createProceduralSpawn();
  let player: Player = { ...initialPlayer };
  let running = false;
  let lastFrameTime = performance.now();
  let accumulator = 0;
  let tic = 0;
  const keys = new Set<string>();

  sourceList.innerHTML = SOURCE_ANCHORS.map(
    (anchor) => `
      <li>
        <span>${anchor.label}</span>
        <code>${anchor.file}:${anchor.lines}</code>
        <small>${anchor.detail}</small>
      </li>
    `
  ).join("");

  render();
  void probeLocalData();

  runButton.addEventListener("click", () => {
    running = !running;
    runButton.textContent = running ? "||" : ">";
    runButton.setAttribute("aria-label", running ? "Pause" : "Run");
    status.textContent = running ? "Running" : "Paused";
  });

  stepButton.addEventListener("click", () => {
    stepTic(readControls(keys));
    render();
  });

  resetButton.addEventListener("click", () => {
    player = { ...initialPlayer };
    tic = 0;
    render();
  });

  mapHeadInput.addEventListener("change", async () => {
    mapHeadBytes = await bytesFromInput(mapHeadInput);
    loadStatus.textContent = mapHeadBytes ? "MAPHEAD ready" : "MAPHEAD missing";
  });

  gameMapsInput.addEventListener("change", async () => {
    gameMapsBytes = await bytesFromInput(gameMapsInput);
    loadStatus.textContent = gameMapsBytes ? "GAMEMAPS ready" : "GAMEMAPS missing";
  });

  loadButton.addEventListener("click", () => {
    loadCurrentMap("WL6");
  });

  localButton.addEventListener("click", async () => {
    try {
      [mapHeadBytes, gameMapsBytes] = await Promise.all([
        fetchBytes("/__local-wl6/MAPHEAD.WL6"),
        fetchBytes("/__local-wl6/GAMEMAPS.WL6")
      ]);
      loadCurrentMap("Local WL6");
    } catch (error) {
      loadStatus.textContent = error instanceof Error ? error.message : "Unable to read local WL6 files";
    }
  });

  window.addEventListener("keydown", (event) => {
    if (isInputKey(event)) {
      keys.add(event.code);
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  requestAnimationFrame(frame);

  function frame(now: number): void {
    const elapsed = now - lastFrameTime;
    lastFrameTime = now;

    if (running) {
      accumulator += Math.min(elapsed, 100);

      while (accumulator >= TIC_MS) {
        stepTic(readControls(keys));
        accumulator -= TIC_MS;
      }

      render();
    }

    requestAnimationFrame(frame);
  }

  function stepTic(controls: Controls): void {
    player.angle = normalizeAngle(player.angle + controls.turn * TURN_PER_TIC);

    const forwardX = Math.cos(player.angle);
    const forwardY = Math.sin(player.angle);
    const rightX = Math.cos(player.angle + Math.PI / 2);
    const rightY = Math.sin(player.angle + Math.PI / 2);
    const dx = forwardX * controls.forward * MOVE_PER_TIC + rightX * controls.strafe * STRAFE_PER_TIC;
    const dy = forwardY * controls.forward * MOVE_PER_TIC + rightY * controls.strafe * STRAFE_PER_TIC;

    moveWithCollision(dx, dy);
    tic += 1;
  }

  function moveWithCollision(dx: number, dy: number): void {
    const nextX = fixed(player.x + dx);
    const nextY = fixed(player.y + dy);

    if (!collides(nextX, player.y)) {
      player.x = nextX;
    }

    if (!collides(player.x, nextY)) {
      player.y = nextY;
    }
  }

  function collides(x: number, y: number): boolean {
    const checks = [
      [x - COLLISION_RADIUS, y - COLLISION_RADIUS],
      [x + COLLISION_RADIUS, y - COLLISION_RADIUS],
      [x - COLLISION_RADIUS, y + COLLISION_RADIUS],
      [x + COLLISION_RADIUS, y + COLLISION_RADIUS]
    ] as const;

    return checks.some(([checkX, checkY]) => isSolidTile(world, Math.floor(checkX), Math.floor(checkY)));
  }

  function render(): void {
    drawView(context, world, player);
    drawOverlay(context, world, player);
    mapReadout.textContent = world.label;
    positionReadout.textContent = `x ${player.x.toFixed(2)} y ${player.y.toFixed(2)} a ${degrees(player.angle)} tic ${tic}`;
  }

  function loadCurrentMap(sourceLabel: string): void {
    try {
      if (!mapHeadBytes || !gameMapsBytes) {
        throw new Error("Select both WL6 map files.");
      }

      const mapIndex = clamp(Math.trunc(Number(mapIndexInput.value) || 0), 0, 59);
      const wolfMap = parseWolfMap(mapHeadBytes, gameMapsBytes, mapIndex);
      const spawn = findPlayerSpawn(wolfMap);
      world = worldFromWolfMap(wolfMap);
      initialPlayer = playerFromSpawn(spawn);
      player = { ...initialPlayer };
      tic = 0;
      loadStatus.textContent = `${sourceLabel} map ${mapIndex} loaded`;
      status.textContent = "Paused";
      render();
    } catch (error) {
      loadStatus.textContent = error instanceof Error ? error.message : "Unable to load map";
    }
  }

  async function probeLocalData(): Promise<void> {
    try {
      const response = await fetch("/__local-wl6/status", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const availability = (await response.json()) as { maphead?: boolean; gamemaps?: boolean };
      localButton.hidden = !(availability.maphead && availability.gamemaps);
    } catch {
      localButton.hidden = true;
    }
  }
}

function appMarkup(): string {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="identity">
          <span>Wolf3D DOS Page</span>
          <small id="status">Paused</small>
        </div>
        <div class="transport" aria-label="Transport controls">
          <button id="run-button" type="button" aria-label="Run" title="Run">></button>
          <button id="step-button" type="button" title="Step one tic">Step</button>
          <button id="reset-button" type="button" title="Reset player">Reset</button>
        </div>
      </header>
      <main class="workbench">
        <section class="viewport-shell" aria-label="Raycast viewport">
          <canvas id="screen" width="${VIEW_WIDTH}" height="${VIEW_HEIGHT}"></canvas>
          <div class="readout">
            <span id="map-readout">Procedural fallback</span>
            <span id="position-readout"></span>
          </div>
        </section>
        <aside class="tool-panel">
          <div class="file-grid">
            <label class="file-control">
              <span>MAPHEAD.WL6</span>
              <input id="maphead-input" type="file" accept=".WL6,.wl6" />
            </label>
            <label class="file-control">
              <span>GAMEMAPS.WL6</span>
              <input id="gamemaps-input" type="file" accept=".WL6,.wl6" />
            </label>
          </div>
          <div class="load-row">
            <label class="number-control">
              <span>Map</span>
              <input id="map-index" type="number" min="0" max="59" value="0" />
            </label>
            <button id="load-button" type="button">Load</button>
            <button id="local-button" type="button" hidden>Local WL6</button>
          </div>
          <p id="load-status" class="status-line">Procedural fallback active</p>
          <ol id="source-list" class="source-list" aria-label="Source anchors"></ol>
        </aside>
      </main>
    </div>
  `;
}

function drawView(context: CanvasRenderingContext2D, world: WorldMap, player: Player): void {
  context.fillStyle = "#1e3340";
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT / 2);
  context.fillStyle = "#2b2319";
  context.fillRect(0, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT / 2);

  for (let x = 0; x < VIEW_WIDTH; x += 1) {
    const cameraX = (x / VIEW_WIDTH - 0.5) * 2;
    const rayAngle = player.angle + cameraX * (FOV / 2);
    const hit = castRay(world, player.x, player.y, rayAngle);
    const correctedDistance = Math.max(0.001, hit.distance * Math.cos(rayAngle - player.angle));
    const wallHeight = Math.min(VIEW_HEIGHT * 1.6, VIEW_HEIGHT / correctedDistance);
    const y = Math.floor((VIEW_HEIGHT - wallHeight) / 2);
    const shade = hit.side === 1 ? 0.7 : 1;

    context.fillStyle = wallColor(hit.tile, shade);
    context.fillRect(x, y, 1, Math.ceil(wallHeight));

    if (hit.tile > 0 && x % 3 === 0) {
      context.fillStyle = wallColor(hit.tile, shade * 0.72);
      context.fillRect(x, y, 1, Math.ceil(wallHeight));
    }
  }
}

function drawOverlay(context: CanvasRenderingContext2D, world: WorldMap, player: Player): void {
  const size = 58;
  const pad = 7;
  const scale = size / Math.max(world.width, world.height);

  context.fillStyle = "rgba(7, 9, 8, 0.76)";
  context.fillRect(pad - 2, pad - 2, size + 4, size + 4);

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const tile = getTile(world, x, y);
      if (tile === 0) {
        continue;
      }

      context.fillStyle = world.source === "wl6" ? "#d0b15e" : "#7db35b";
      context.fillRect(pad + x * scale, pad + y * scale, Math.max(1, scale), Math.max(1, scale));
    }
  }

  const px = pad + player.x * scale;
  const py = pad + player.y * scale;
  context.fillStyle = "#ec4f42";
  context.fillRect(px - 1.5, py - 1.5, 3, 3);
  context.strokeStyle = "#ec4f42";
  context.beginPath();
  context.moveTo(px, py);
  context.lineTo(px + Math.cos(player.angle) * 7, py + Math.sin(player.angle) * 7);
  context.stroke();
}

function castRay(world: WorldMap, startX: number, startY: number, angle: number): Hit {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let mapX = Math.floor(startX);
  let mapY = Math.floor(startY);

  const deltaDistX = Math.abs(1 / (dirX || 0.00001));
  const deltaDistY = Math.abs(1 / (dirY || 0.00001));
  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;
  let sideDistX = dirX < 0 ? (startX - mapX) * deltaDistX : (mapX + 1 - startX) * deltaDistX;
  let sideDistY = dirY < 0 ? (startY - mapY) * deltaDistY : (mapY + 1 - startY) * deltaDistY;
  let side: 0 | 1 = 0;

  for (let step = 0; step < 96; step += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    const tile = getTile(world, mapX, mapY);
    if (tile !== 0) {
      const distance =
        side === 0
          ? (mapX - startX + (1 - stepX) / 2) / (dirX || 0.00001)
          : (mapY - startY + (1 - stepY) / 2) / (dirY || 0.00001);

      return {
        distance: Math.abs(distance),
        tile,
        side
      };
    }
  }

  return {
    distance: 96,
    tile: 1,
    side: 0
  };
}

function createProceduralWorld(): WorldMap {
  const rows = [
    "111111111111111111111111",
    "100000000000000000000001",
    "101111011111011111011101",
    "101000010001010001010001",
    "101011110101010101011101",
    "100010000101000101000001",
    "111010111101111101111101",
    "100010100000000001000001",
    "101110101111011101011101",
    "100000101000010001000001",
    "101111101011110111111101",
    "100000001000000000000001",
    "101111111111011111011101",
    "101000000001010001010001",
    "101011111101010101010101",
    "100010000001000101000101",
    "111010111111110101110101",
    "100010000000000100000001",
    "101111011111111111111101",
    "100000010000000000000001",
    "101111110111111011111101",
    "100000000100000010000001",
    "100000000000000000000001",
    "111111111111111111111111"
  ];
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  const walls = new Uint16Array(width * height);

  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      walls[y * width + x] = cell === "1" ? 1 + ((x + y) % 8) : 0;
    });
  });

  return {
    width,
    height,
    walls,
    label: "Procedural fallback",
    source: "procedural"
  };
}

function createProceduralSpawn(): Player {
  return {
    x: 2.5,
    y: 2.5,
    angle: 0
  };
}

function worldFromWolfMap(map: WolfMap): WorldMap {
  return {
    width: map.header.width,
    height: map.header.height,
    walls: map.planes[0],
    label: `WL6 map ${map.index} ${map.header.width}x${map.header.height}`,
    source: "wl6"
  };
}

function playerFromSpawn(spawn: PlayerSpawn): Player {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: spawn.angle
  };
}

function wallColor(tile: number, shade: number): string {
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
  return `rgb(${Math.floor(base[0] * shade)}, ${Math.floor(base[1] * shade)}, ${Math.floor(
    base[2] * shade
  )})`;
}

function getTile(world: WorldMap, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) {
    return 1;
  }

  return world.walls[y * world.width + x] ?? 1;
}

function isSolidTile(world: WorldMap, x: number, y: number): boolean {
  return getTile(world, x, y) !== 0;
}

function readControls(keys: Set<string>): Controls {
  const forward =
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const strafe = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  const turn =
    (keys.has("ArrowRight") || keys.has("KeyE") ? 1 : 0) -
    (keys.has("ArrowLeft") || keys.has("KeyQ") ? 1 : 0);

  return {
    forward,
    strafe,
    turn
  };
}

function isInputKey(event: KeyboardEvent): boolean {
  return [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyQ",
    "KeyE",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
  ].includes(event.code);
}

async function bytesFromInput(input: HTMLInputElement): Promise<Uint8Array | null> {
  const file = input.files?.[0];
  return file ? readFileBytes(file) : null;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function fixed(value: number): number {
  return Math.round(value * FIXED_SCALE) / FIXED_SCALE;
}

function normalizeAngle(angle: number): number {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function degrees(angle: number): number {
  return Math.round((normalizeAngle(angle) * 180) / Math.PI);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element ${selector}.`);
  }

  return element;
}
