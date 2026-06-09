import { createIcons, Crosshair, Pause, Play, RotateCcw, StepForward } from "lucide";
import "./styles.css";
import { InputTracker } from "./input";
import { sourceAnchors } from "./sourceAnchors";
import { SCREEN_HEIGHT, SCREEN_WIDTH, WolfDosMachine } from "./wolfDos";

const canvas = document.querySelector<HTMLCanvasElement>("#screen");
if (!canvas) {
  throw new Error("Missing #screen canvas");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D rendering context");
}
const renderContext: CanvasRenderingContext2D = ctx;

const machine = new WolfDosMachine();
const input = new InputTracker(canvas);
let paused = false;
let lastFrame = performance.now();

const pauseButton = mustGet<HTMLButtonElement>("#pause-toggle");
const stepButton = mustGet<HTMLButtonElement>("#step-frame");
const resetButton = mustGet<HTMLButtonElement>("#reset-scene");
const pointerButton = mustGet<HTMLButtonElement>("#pointer-look");
const metricTics = mustGet<HTMLElement>("#metric-tics");
const metricAngle = mustGet<HTMLElement>("#metric-angle");
const metricTile = mustGet<HTMLElement>("#metric-tile");
const metricRays = mustGet<HTMLElement>("#metric-rays");
const sourceStack = mustGet<HTMLOListElement>("#source-stack");

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
renderContext.imageSmoothingEnabled = false;

sourceStack.replaceChildren(
  ...sourceAnchors.map((anchor) => {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    const file = document.createElement("span");
    const note = document.createElement("small");

    name.textContent = anchor.name;
    file.textContent = `${anchor.file}:${anchor.line}`;
    note.textContent = anchor.note;
    item.append(name, file, note);
    return item;
  })
);

pauseButton.addEventListener("click", () => {
  paused = !paused;
  syncToolbar();
});

stepButton.addEventListener("click", () => {
  paused = true;
  machine.step(input.snapshot());
  machine.render(renderContext);
  updateMetrics();
  syncToolbar();
});

resetButton.addEventListener("click", () => {
  machine.reset();
  lastFrame = performance.now();
  machine.render(renderContext);
  updateMetrics();
});

pointerButton.addEventListener("click", async () => {
  const locked = await input.togglePointerLock();
  pointerButton.classList.toggle("is-active", locked);
});

document.addEventListener("pointerlockchange", () => {
  pointerButton.classList.toggle("is-active", document.pointerLockElement === canvas);
});

function frame(now: number): void {
  const elapsed = now - lastFrame;
  lastFrame = now;

  if (!paused) {
    machine.update(input.snapshot(), elapsed);
  }

  machine.render(renderContext);
  updateMetrics();
  requestAnimationFrame(frame);
}

function updateMetrics(): void {
  const diagnostics = machine.diagnostics();
  metricTics.textContent = String(diagnostics.tics);
  metricAngle.textContent = String(diagnostics.angle);
  metricTile.textContent = diagnostics.tile;
  metricRays.textContent = String(diagnostics.rays);
}

function syncToolbar(): void {
  pauseButton.innerHTML = `<i data-lucide="${paused ? "play" : "pause"}"></i>`;
  stepButton.innerHTML = '<i data-lucide="step-forward"></i>';
  resetButton.innerHTML = '<i data-lucide="rotate-ccw"></i>';
  pointerButton.innerHTML = '<i data-lucide="crosshair"></i>';
  pauseButton.setAttribute("title", paused ? "Resume" : "Pause");
  pauseButton.setAttribute("aria-label", paused ? "Resume" : "Pause");
  createIcons({
    icons: {
      Crosshair,
      Pause,
      Play,
      RotateCcw,
      StepForward
    }
  });
}

function mustGet<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

syncToolbar();
machine.render(renderContext);
updateMetrics();
requestAnimationFrame(frame);
