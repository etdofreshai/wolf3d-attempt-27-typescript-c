import "./styles.css";
import { VERSIONS, type GameVersion, type VersionStatus } from "./versions";

const STATUS_LABELS: Record<VersionStatus, string> = {
  playable: "Playable",
  experimental: "Experimental",
  planned: "Planned"
};

const PROBE_TIMEOUT_MS = 2500;
const PROBE_INTERVAL_MS = 5000;

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

root.innerHTML = `
  <div class="launcher">
    <header class="masthead">
      <div class="brand">
        <span class="kicker">Monorepo</span>
        <h1>Wolfenstein 3D</h1>
        <p class="subtitle">
          Every build we have, launchable from one place. Run
          <code>npm run dev</code> at the repo root to start them all.
        </p>
      </div>
      <button id="recheck" type="button" class="recheck">Re-check servers</button>
    </header>
    <main id="grid" class="grid"></main>
    <footer class="footer">
      <span id="summary" class="summary"></span>
      <span class="hint">Each card opens its game on a fixed local port.</span>
    </footer>
  </div>
`;

const grid = requireElement<HTMLElement>("#grid");
const summary = requireElement<HTMLElement>("#summary");
const recheckButton = requireElement<HTMLButtonElement>("#recheck");

type CardHandle = {
  version: GameVersion;
  url: string | null;
  statusDot: HTMLElement;
  liveness: HTMLElement;
};

const cards: CardHandle[] = VERSIONS.map((version) => renderCard(version));

recheckButton.addEventListener("click", () => {
  void probeAll();
});

void probeAll();
window.setInterval(() => {
  void probeAll();
}, PROBE_INTERVAL_MS);

function renderCard(version: GameVersion): CardHandle {
  const url = devUrl(version);

  const card = document.createElement("article");
  card.className = `card card--${version.status}`;
  card.dataset.versionId = version.id;

  const head = document.createElement("div");
  head.className = "card-head";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = version.name;

  const badge = document.createElement("span");
  badge.className = `badge badge--${version.status}`;
  badge.textContent = STATUS_LABELS[version.status];

  head.append(title, badge);

  const tagline = document.createElement("p");
  tagline.className = "card-tagline";
  tagline.textContent = version.tagline;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = version.description;

  const tagRow = document.createElement("ul");
  tagRow.className = "tag-row";
  for (const tag of version.tags) {
    const chip = document.createElement("li");
    chip.className = "chip";
    chip.textContent = tag;
    tagRow.append(chip);
  }

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const liveness = document.createElement("span");
  liveness.className = "liveness";

  const statusDot = document.createElement("span");
  statusDot.className = "dot dot--unknown";

  const livenessText = document.createElement("span");
  livenessText.className = "liveness-text";
  livenessText.textContent = url ? "Checking…" : "Not available yet";
  liveness.append(statusDot, livenessText);

  const launch = document.createElement("a");
  launch.className = "launch";
  if (url) {
    launch.href = url;
    launch.target = "_blank";
    launch.rel = "noopener";
    launch.textContent = "Launch ▶";
    launch.title = `Open ${version.name} (${url})`;
  } else {
    launch.classList.add("launch--disabled");
    launch.setAttribute("aria-disabled", "true");
    launch.textContent = "Coming soon";
  }

  footer.append(liveness, launch);
  card.append(head, tagline, description, tagRow, footer);
  grid.append(card);

  return { version, url, statusDot, liveness };
}

async function probeAll(): Promise<void> {
  recheckButton.disabled = true;
  try {
    const results = await Promise.all(
      cards.map(async (card) => {
        if (!card.url) {
          setLiveness(card, "unavailable");
          return "unavailable" as const;
        }

        const online = await probe(card.url);
        setLiveness(card, online ? "online" : "offline");
        return online ? ("online" as const) : ("offline" as const);
      })
    );

    const online = results.filter((result) => result === "online").length;
    const launchable = cards.filter((card) => card.url).length;
    summary.textContent = `${online}/${launchable} dev servers online`;
  } finally {
    recheckButton.disabled = false;
  }
}

function setLiveness(card: CardHandle, state: "online" | "offline" | "unavailable"): void {
  card.statusDot.className = `dot dot--${state}`;
  const text = card.liveness.querySelector<HTMLElement>(".liveness-text");
  if (!text) {
    return;
  }

  text.textContent =
    state === "online" ? "Server online" : state === "offline" ? "Server offline" : "Not available yet";
}

/**
 * Best-effort liveness check. A `no-cors` fetch to a running Vite server
 * resolves (opaque); a refused connection rejects. We can't read the response,
 * only whether the port answered.
 */
async function probe(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

function devUrl(version: GameVersion): string | null {
  if (version.devPort == null) {
    return null;
  }

  return `${window.location.protocol}//${window.location.hostname}:${version.devPort}/`;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = root!.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}
