import "./styles.css";

type LauncherStatus = {
  servers: {
    launcher: boolean;
    steam: boolean;
    source: boolean;
  };
  steam: {
    ready: boolean;
    filesPresent: number;
    filesTotal: number;
  };
  source: {
    ready: boolean;
    sourceExe: boolean;
    c: number;
    asm: number;
    h: number;
    mounted: number;
    canBuild: boolean;
    missingToolchain: string[];
  };
};

type Lane = {
  id: "steam" | "source" | "port";
  title: string;
  label: string;
  href?: string;
  command: string;
};

const LANES: Lane[] = [
  {
    id: "steam",
    title: "Steam DOS",
    label: "Retail EXE + WL6",
    href: "http://127.0.0.1:5174/",
    command: "Launch"
  },
  {
    id: "source",
    title: "Original Source DOS",
    label: "source/WOLFSRC + WL6",
    href: "http://127.0.0.1:5175/",
    command: "Launch"
  },
  {
    id: "port",
    title: "Port",
    label: "Portable browser target",
    command: "Pending"
  }
];

const TOOLS = [
  {
    title: "WL6 Map Probe",
    label: "MAPHEAD/GAMEMAPS",
    href: "http://127.0.0.1:5174/#probe-root"
  },
  {
    title: "Source Build Status",
    label: "Borland/TASM lane",
    href: "http://127.0.0.1:5175/"
  },
  {
    title: "Data Inventory",
    label: "Local status",
    href: "#inventory"
  }
];

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

const appRoot = root;

appRoot.innerHTML = `
  <main class="launcher-shell">
    <section class="hero">
      <canvas id="scene" aria-hidden="true"></canvas>
      <div class="hero-copy">
        <p class="eyebrow">Wolfenstein 3D</p>
        <h1>Wolf3D Browser Lab</h1>
        <div class="mode-strip">
          <span>Steam DOS</span>
          <span>Source DOS</span>
          <span>Port</span>
        </div>
      </div>
      <aside class="hero-status" id="hero-status" aria-live="polite">
        <span>Checking local apps</span>
      </aside>
    </section>

    <section class="launch-grid" aria-label="Game versions">
      ${LANES.map(renderLane).join("")}
    </section>

    <section class="tool-band" aria-label="Tools">
      ${TOOLS.map(renderTool).join("")}
    </section>

    <section class="inventory" id="inventory" aria-label="Inventory">
      <div>
        <span>Steam Assets</span>
        <strong id="steam-assets">--</strong>
      </div>
      <div>
        <span>Source Tree</span>
        <strong id="source-tree">--</strong>
      </div>
      <div>
        <span>Toolchain</span>
        <strong id="toolchain">--</strong>
      </div>
    </section>
  </main>
`;

const scene = requireElement<HTMLCanvasElement>("#scene");
const heroStatus = requireElement<HTMLElement>("#hero-status");
const steamAssets = requireElement<HTMLElement>("#steam-assets");
const sourceTree = requireElement<HTMLElement>("#source-tree");
const toolchain = requireElement<HTMLElement>("#toolchain");

startScene(scene);
void refreshStatus();

setInterval(() => {
  void refreshStatus();
}, 10000);

async function refreshStatus(): Promise<void> {
  try {
    const response = await fetch("/__launcher/status");
    if (!response.ok) {
      throw new Error(`Status returned ${response.status}`);
    }

    const status = (await response.json()) as LauncherStatus;
    renderStatus(status);
  } catch (error) {
    heroStatus.textContent = error instanceof Error ? error.message : "Status unavailable";
  }
}

function renderLane(lane: Lane): string {
  const action = lane.href
    ? `<a class="launch-action" href="${lane.href}">${lane.command}</a>`
    : `<span class="launch-action disabled">${lane.command}</span>`;

  return `
    <article class="launch-card" data-lane="${lane.id}">
      <div class="card-top">
        <span class="lane-mark"></span>
        <span class="lane-state" id="${lane.id}-state">--</span>
      </div>
      <h2>${lane.title}</h2>
      <p>${lane.label}</p>
      <div class="metric-row" id="${lane.id}-metrics"></div>
      ${action}
    </article>
  `;
}

function renderTool(tool: (typeof TOOLS)[number]): string {
  return `
    <a class="tool-link" href="${tool.href}">
      <span>${tool.title}</span>
      <small>${tool.label}</small>
    </a>
  `;
}

function renderStatus(status: LauncherStatus): void {
  setText("#steam-state", status.steam.ready ? "Ready" : "Missing");
  setText("#source-state", status.source.ready ? "Ready" : "Check");
  setText("#port-state", "Future");

  setText("#steam-metrics", `${status.steam.filesPresent}/${status.steam.filesTotal} files`);
  setText(
    "#source-metrics",
    `${status.source.c} C / ${status.source.asm} ASM / ${status.source.h} H`
  );
  setText("#port-metrics", "Not scaffolded");

  steamAssets.textContent = `${status.steam.filesPresent}/${status.steam.filesTotal}`;
  sourceTree.textContent = status.source.ready ? `${status.source.mounted} mounted` : "Missing";
  toolchain.textContent = status.source.canBuild ? "Ready" : status.source.missingToolchain.join(", ");

  const online = [
    status.servers.steam ? "Steam online" : "Steam offline",
    status.servers.source ? "Source online" : "Source offline"
  ];
  heroStatus.replaceChildren(...online.map(statusPill));
}

function statusPill(text: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = text;
  span.className = text.endsWith("online") ? "online" : "offline";
  return span;
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = value;
  }
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = appRoot.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function startScene(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  const buffer = document.createElement("canvas");
  buffer.width = 320;
  buffer.height = 180;
  const low = buffer.getContext("2d");

  if (!context || !low) {
    return;
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
  };

  const draw = (time: number) => {
    const sweep = Math.floor((time / 36) % 320);
    low.fillStyle = "#090b0b";
    low.fillRect(0, 0, 320, 180);

    low.fillStyle = "#1d2020";
    low.fillRect(0, 0, 320, 72);
    low.fillStyle = "#33231e";
    low.fillRect(0, 72, 320, 108);

    for (let x = 0; x < 320; x += 16) {
      const shade = x % 48 === 0 ? "#6d2d2a" : "#8b3631";
      low.fillStyle = shade;
      low.fillRect(x, 28, 14, 70);
      low.fillStyle = "#2a1718";
      low.fillRect(x + 12, 28, 2, 70);
    }

    for (let y = 82; y < 180; y += 10) {
      const width = (y - 76) * 3.2;
      const x = 160 - width / 2;
      low.strokeStyle = y % 20 === 0 ? "#9b8a57" : "#50483a";
      low.beginPath();
      low.moveTo(x, y);
      low.lineTo(320 - x, y);
      low.stroke();
    }

    low.fillStyle = "#111313";
    low.fillRect(122, 43, 76, 68);
    low.fillStyle = "#c7aa58";
    low.fillRect(128, 49, 64, 6);
    low.fillRect(128, 101, 64, 5);
    low.fillStyle = "#3f7771";
    low.fillRect(150, 62, 20, 28);

    low.globalAlpha = 0.32;
    low.fillStyle = "#d8c26a";
    low.fillRect(sweep, 0, 3, 180);
    low.globalAlpha = 1;

    for (let y = 0; y < 180; y += 4) {
      low.fillStyle = "rgba(0, 0, 0, 0.16)";
      low.fillRect(0, y, 320, 1);
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}
