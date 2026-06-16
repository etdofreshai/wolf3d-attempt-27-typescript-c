import "./styles.css";
import "./dev.css";
import { AUDIO, HEADER, PARITY, STATS, type AudioPlayer, type AudioTake } from "./dev-content";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}

// ----------------------------------------------------------------------------------------------
// A/B/C audio bench. One shared AudioContext; each player decodes its three takes lazily and can
// flip between Before / After / Reference WITHOUT losing its place — the whole point of an A/B test
// is to hear the same moment two ways. A live waveform scope (AnalyserNode) animates while playing.
// ----------------------------------------------------------------------------------------------
let sharedCtx: AudioContext | null = null;
function audioCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

class ABCPlayer {
  // The audio graph is built lazily on the first user gesture (autoplay policy) — not on page load.
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private source: AudioBufferSourceNode | null = null;
  private take: AudioTake;
  private startedAt = 0; // ctx time when the current segment started
  private offset = 0; // buffer position where the current segment started
  private playing = false;
  private loop = true;
  private raf = 0;
  private startToken = 0; // re-entrancy guard: only the latest startAt() wins

  constructor(
    private readonly player: AudioPlayer,
    private readonly ui: {
      buttons: Map<string, HTMLButtonElement>;
      play: HTMLButtonElement;
      loopBtn: HTMLButtonElement;
      canvas: HTMLCanvasElement;
      time: HTMLElement;
      note: HTMLElement;
    },
  ) {
    this.take = player.takes.find((t) => t.id === "after") ?? player.takes[0];
    this.syncButtons();
    // Defer the first idle draw until the canvas is laid out in the DOM (clientWidth is 0 before that),
    // and redraw the idle baseline on resize so it never stretches.
    requestAnimationFrame(() => this.drawScope());
    window.addEventListener("resize", () => {
      if (!this.playing) {
        this.drawScope();
      }
    });
  }

  /** Build the shared AudioContext + this player's analyser on demand (first gesture). */
  private graph(): { ctx: AudioContext; analyser: AnalyserNode } {
    if (!this.ctx || !this.analyser) {
      this.ctx = audioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.9;
      this.analyser.connect(gain).connect(this.ctx.destination);
    }
    return { ctx: this.ctx, analyser: this.analyser };
  }

  private async buffer(take: AudioTake): Promise<AudioBuffer> {
    const cached = this.buffers.get(take.id);
    if (cached) {
      return cached;
    }
    const { ctx } = this.graph();
    const res = await fetch(take.src);
    if (!res.ok) {
      throw new Error(`audio ${take.src} → HTTP ${res.status}`);
    }
    const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
    this.buffers.set(take.id, decoded);
    return decoded;
  }

  private get duration(): number {
    return this.buffers.get(this.take.id)?.duration ?? 0;
  }

  private position(): number {
    const raw = this.playing && this.ctx ? this.offset + (this.ctx.currentTime - this.startedAt) : this.offset;
    const dur = this.duration;
    if (dur === 0) {
      return 0;
    }
    return this.loop ? raw % dur : Math.min(raw, dur);
  }

  private stopSource(): void {
    if (this.source) {
      this.source.onended = null;
      try {
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
      this.source = null;
    }
  }

  private fail(message: string): void {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.syncButtons();
    this.drawScope();
    this.ui.note.textContent = message;
  }

  private async startAt(seconds: number): Promise<void> {
    const token = ++this.startToken;
    const { ctx, analyser } = this.graph();
    await ctx.resume();
    const buf = await this.buffer(this.take);
    if (token !== this.startToken) {
      return; // a newer play/select superseded this one while we awaited — drop it
    }
    this.stopSource();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = this.loop;
    src.connect(analyser);
    const at = this.loop ? seconds % buf.duration : Math.min(seconds, buf.duration);
    this.offset = at;
    this.startedAt = ctx.currentTime;
    src.onended = () => {
      if (!this.loop && this.source === src) {
        this.playing = false;
        this.offset = 0;
        this.syncButtons();
        cancelAnimationFrame(this.raf);
        this.drawScope();
      }
    };
    src.start(0, at);
    this.source = src;
    this.playing = true;
    this.syncButtons();
    this.animate();
  }

  async toggle(): Promise<void> {
    try {
      if (this.playing) {
        this.offset = this.position();
        this.stopSource();
        this.playing = false;
        this.syncButtons();
        cancelAnimationFrame(this.raf);
        this.drawScope();
      } else {
        await this.startAt(this.offset);
      }
    } catch {
      this.fail("Couldn't load this clip — try again.");
    }
  }

  async select(takeId: string): Promise<void> {
    if (takeId === this.take.id) {
      return;
    }
    const next = this.player.takes.find((t) => t.id === takeId);
    if (!next) {
      return;
    }
    const wasPlaying = this.playing;
    const pos = this.position();
    this.take = next;
    this.ui.note.textContent = next.note;
    this.syncButtons();
    try {
      if (wasPlaying) {
        await this.startAt(pos); // seamless A/B/C at the same moment in playback
      } else {
        this.offset = pos;
        await this.buffer(next);
        // re-normalize the kept position against the newly-active take, then redraw idle.
        const dur = this.duration;
        this.offset = dur ? (this.loop ? this.offset % dur : Math.min(this.offset, dur)) : 0;
        this.drawScope();
      }
    } catch {
      this.fail("Couldn't load this clip — try again.");
    }
  }

  toggleLoop(): void {
    this.loop = !this.loop;
    if (this.source) {
      this.source.loop = this.loop;
    }
    this.ui.loopBtn.setAttribute("aria-pressed", String(this.loop));
    this.ui.loopBtn.classList.toggle("on", this.loop);
  }

  private syncButtons(): void {
    for (const [id, btn] of this.ui.buttons) {
      const active = id === this.take.id;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-checked", String(active));
    }
    this.ui.play.textContent = this.playing ? "❚❚ Pause" : "▶ Play";
    this.ui.play.classList.toggle("playing", this.playing);
    this.ui.play.setAttribute("aria-pressed", String(this.playing));
  }

  private animate(): void {
    cancelAnimationFrame(this.raf); // never stack two rAF loops
    const tick = (): void => {
      this.drawScope();
      this.ui.time.textContent = `${fmt(this.position())} / ${fmt(this.duration)}`;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private drawScope(): void {
    const canvas = this.ui.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 96;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const g = canvas.getContext("2d");
    if (!g) {
      return;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    // centerline
    g.strokeStyle = "rgba(154, 165, 109, 0.25)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, h / 2);
    g.lineTo(w, h / 2);
    g.stroke();

    const data = new Uint8Array(2048);
    if (this.playing && this.analyser) {
      this.analyser.getByteTimeDomainData(data);
    } else {
      data.fill(128); // flat line at rest
    }
    g.strokeStyle = this.playing ? "#f2d077" : "rgba(242, 208, 119, 0.4)";
    g.lineWidth = 2;
    g.beginPath();
    const step = data.length / w;
    for (let x = 0; x < w; x++) {
      const v = data[Math.floor(x * step)] / 128 - 1; // -1..1
      const y = h / 2 + v * (h / 2 - 4);
      if (x === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.stroke();
  }
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `0:${String(s).padStart(2, "0")}`;
}

// ----------------------------------------------------------------------------------------------
// Small DOM helpers
// ----------------------------------------------------------------------------------------------
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) {
    node.className = cls;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
}

function promptLine(text: string): HTMLElement {
  const p = el("p", "prompt");
  p.append(el("span", "prompt-caret", "> "), document.createTextNode(text));
  return p;
}

// ----------------------------------------------------------------------------------------------
// Page assembly
// ----------------------------------------------------------------------------------------------
function buildHeader(): HTMLElement {
  const header = el("header", "dev-masthead");
  const brand = el("div", "brand");
  brand.append(
    el("span", "kicker", HEADER.kicker),
    el("h1", undefined, HEADER.title),
    el("p", "subtitle", HEADER.subtitle),
  );
  const back = el("a", "back-link", "‹ Back to launcher");
  back.href = "/";
  header.append(brand, back);
  return header;
}

function buildStats(): HTMLElement {
  const section = el("section", "dev-panel stats-panel");
  section.append(promptLine("stats --summary"));
  const grid = el("div", "stat-grid");
  for (const s of STATS) {
    const tile = el("div", "stat-tile");
    tile.append(el("div", "stat-value", s.value), el("div", "stat-label", s.label), el("div", "stat-detail", s.detail));
    grid.append(tile);
  }
  section.append(grid);
  return section;
}

function buildAudio(): HTMLElement {
  const section = el("section", "dev-panel audio-panel");
  section.append(promptLine("audio --compare before after reference"));
  section.append(el("h2", "panel-title", AUDIO.heading), el("p", "panel-intro", AUDIO.intro));

  const bench = el("div", "audio-bench");
  for (const player of AUDIO.players) {
    bench.append(buildPlayer(player));
  }
  section.append(bench);

  // The five bugs + before/after metrics + takeaway
  const details = el("div", "audio-details");

  const bugs = el("div", "bug-list");
  bugs.append(el("h3", "subhead", "Five FM bugs, fixed"));
  const ol = el("ol", "bugs");
  for (const bug of AUDIO.bugs) {
    const li = el("li");
    li.append(el("span", "bug-title", bug.title), el("span", "bug-detail", bug.detail));
    ol.append(li);
  }
  bugs.append(ol);

  const metrics = el("div", "metrics");
  metrics.append(el("h3", "subhead", "Measured against a faithful OPL2"));
  const table = el("table", "metric-table");
  const thead = el("thead");
  const hr = el("tr");
  hr.append(el("th", undefined, "Metric"), el("th", "col-before", "Before"), el("th", "col-after", "After"));
  thead.append(hr);
  const tbody = el("tbody");
  for (const m of AUDIO.metrics) {
    const tr = el("tr");
    tr.append(el("td", "m-label", m.label), el("td", "m-before", m.before), el("td", "m-after", m.after));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  metrics.append(table, el("p", "takeaway", AUDIO.takeaway));

  details.append(bugs, metrics);
  section.append(details);
  return section;
}

function buildPlayer(player: AudioPlayer): HTMLElement {
  const card = el("div", "player-card");
  card.append(el("h3", "player-label", player.label), el("p", "player-desc", player.description));

  const canvas = el("canvas", "scope");
  canvas.setAttribute("aria-hidden", "true"); // decorative — play state is carried by the button + time
  card.append(canvas);

  const controls = el("div", "player-controls");
  const segmented = el("div", "segmented");
  segmented.setAttribute("role", "radiogroup");
  segmented.setAttribute("aria-label", `Compare takes — ${player.label}`);
  const buttons = new Map<string, HTMLButtonElement>();
  for (const take of player.takes) {
    const btn = el("button", "seg-btn", take.label);
    btn.type = "button";
    btn.setAttribute("role", "radio");
    btn.dataset.take = take.id;
    segmented.append(btn);
    buttons.set(take.id, btn);
  }

  const transport = el("div", "transport");
  const play = el("button", "play-btn", "▶ Play");
  play.type = "button";
  const loopBtn = el("button", "loop-btn on", "↻ Loop");
  loopBtn.type = "button";
  loopBtn.setAttribute("aria-pressed", "true");
  const time = el("span", "time", "0:00 / 0:00");
  transport.append(play, loopBtn, time);

  controls.append(segmented, transport);
  const note = el("p", "take-note", player.takes.find((t) => t.id === "after")?.note ?? "");
  card.append(controls, note);

  const handle = new ABCPlayer(player, { buttons, play, loopBtn, canvas, time, note });
  play.addEventListener("click", () => void handle.toggle());
  loopBtn.addEventListener("click", () => handle.toggleLoop());
  for (const [id, btn] of buttons) {
    btn.addEventListener("click", () => void handle.select(id));
  }
  return card;
}

function buildParity(): HTMLElement {
  const section = el("section", "dev-panel parity-panel");
  section.append(promptLine("render --map E1M1 --diff"));
  section.append(el("h2", "panel-title", PARITY.heading), el("p", "panel-intro", PARITY.intro));

  // Palette before/after
  const pal = el("div", "palette-compare");
  const before = el("figure", "frame");
  const bimg = el("img");
  bimg.src = "/dev/img/palette-before.png";
  bimg.alt = "E1M1 with the palette offset bug — walls render red";
  bimg.loading = "lazy";
  before.append(bimg, el("figcaption", "cap cap-bad", PARITY.palette.beforeCaption));
  const after = el("figure", "frame");
  const aimg = el("img");
  aimg.src = "/dev/img/palette-after.png";
  aimg.alt = "E1M1 with the correct palette — walls render blue/gray";
  aimg.loading = "lazy";
  after.append(aimg, el("figcaption", "cap cap-good", PARITY.palette.afterCaption));
  pal.append(before, after);
  section.append(el("h3", "subhead", "The one-byte palette bug"), pal, el("p", "palette-note", PARITY.palette.caption));

  // Gallery
  section.append(el("h3", "subhead", "Reproduced, pixel for pixel"));
  const gallery = el("div", "gallery");
  for (const item of PARITY.gallery) {
    const fig = el("figure", "shot");
    const img = el("img");
    img.src = `/dev/img/${item.img}`;
    img.alt = item.title;
    img.loading = "lazy";
    const cap = el("figcaption");
    cap.append(el("span", "shot-title", item.title), el("span", "shot-caption", item.caption));
    fig.append(img, cap);
    gallery.append(fig);
  }
  section.append(gallery);

  // Method + gate chips
  section.append(el("p", "method-note", PARITY.methodNote));
  const chips = el("div", "gate-chips");
  chips.append(el("span", "chips-label", "32 gates:"));
  for (const gate of PARITY.gates) {
    chips.append(el("span", "gate-chip", `#${gate}`));
  }
  section.append(chips);
  return section;
}

root.innerHTML = "";
const shell = el("div", "dev-shell");
shell.append(buildHeader(), buildStats(), buildAudio(), buildParity());
const footer = el("footer", "dev-footer");
footer.append(
  el("span", undefined, "Built from the id Software source · verified against a DOSBox oracle · audio vs npm opl3"),
  (() => {
    const a = el("a", "back-link", "‹ Back to launcher");
    a.href = "/";
    return a;
  })(),
);
shell.append(footer);
root.append(shell);
