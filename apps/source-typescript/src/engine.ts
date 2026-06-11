import { Input } from "./input";

/**
 * Wolfenstein 3D rendered at its native 320x200 into an offscreen framebuffer,
 * then scaled up (nearest-neighbour) onto the visible canvas. The real port
 * will fill `frame` from a raycaster; for now it draws a placeholder so the
 * loop, timing, and input are visibly wired end to end.
 */
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 200;

/** Fixed simulation step — id's game logic ran at a steady 70 Hz tic. */
const TICS_PER_SECOND = 70;
const STEP_MS = 1000 / TICS_PER_SECOND;
const MAX_FRAME_MS = 250;

export interface EngineHud {
  setFps(fps: number): void;
  setInput(description: string): void;
}

export class Engine {
  private readonly frame: ImageData;
  private readonly input = new Input();

  private running = false;
  private rafId = 0;
  private detachInput: (() => void) | null = null;

  private lastTime = 0;
  private accumulatorMs = 0;
  private tic = 0;

  private fpsFrames = 0;
  private fpsElapsedMs = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly hud: EngineHud
  ) {
    this.frame = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  start(startTime: number): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = startTime;
    this.detachInput = this.input.attach();
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.detachInput?.();
    this.detachInput = null;
  }

  private loop(time: number): void {
    if (!this.running) {
      return;
    }

    const deltaMs = Math.min(time - this.lastTime, MAX_FRAME_MS);
    this.lastTime = time;
    this.accumulatorMs += deltaMs;

    // Fixed-timestep update: run whole tics, keep the remainder for next frame.
    while (this.accumulatorMs >= STEP_MS) {
      this.update();
      this.accumulatorMs -= STEP_MS;
    }

    this.render();
    this.trackFps(deltaMs);

    this.rafId = requestAnimationFrame((next) => this.loop(next));
  }

  /** Advance the simulation by one tic. Placeholder until game logic lands. */
  private update(): void {
    this.tic += 1;
  }

  private render(): void {
    const pixels = this.frame.data;
    const horizon = SCREEN_HEIGHT >> 1;
    const pulse = 40 + Math.floor(20 * Math.sin(this.tic / 20));

    for (let y = 0; y < SCREEN_HEIGHT; y += 1) {
      // Classic Wolf3D split: lit ceiling above the horizon, dark floor below.
      const grey = y < horizon ? 0x38 : 0x20;
      for (let x = 0; x < SCREEN_WIDTH; x += 1) {
        const offset = (y * SCREEN_WIDTH + x) << 2;
        pixels[offset] = grey + (y < horizon ? 0 : pulse);
        pixels[offset + 1] = grey;
        pixels[offset + 2] = grey + (y < horizon ? pulse : 0);
        pixels[offset + 3] = 0xff;
      }
    }

    this.ctx.putImageData(this.frame, 0, 0);
    this.hud.setInput(this.input.describe());
  }

  private trackFps(deltaMs: number): void {
    this.fpsFrames += 1;
    this.fpsElapsedMs += deltaMs;
    if (this.fpsElapsedMs >= 500) {
      this.hud.setFps(Math.round((this.fpsFrames * 1000) / this.fpsElapsedMs));
      this.fpsFrames = 0;
      this.fpsElapsedMs = 0;
    }
  }
}
