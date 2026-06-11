/**
 * Minimal keyboard state tracker.
 *
 * Maps physical keys (WASD / arrows / space) to abstract actions so the engine
 * never reads `KeyboardEvent` directly. Grow the `Action` union and `KEY_MAP`
 * as the game needs more controls.
 */
export type Action = "forward" | "back" | "left" | "right" | "strafe" | "use" | "fire";

const KEY_MAP: Record<string, Action> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  AltLeft: "strafe",
  Space: "fire",
  KeyE: "use",
  Enter: "use"
};

export class Input {
  private readonly active = new Set<Action>();

  /** Begin listening on the given target (defaults to `window`). */
  attach(target: Window | HTMLElement = window): () => void {
    const onDown = (event: KeyboardEvent) => this.onKey(event, true);
    const onUp = (event: KeyboardEvent) => this.onKey(event, false);

    target.addEventListener("keydown", onDown as EventListener);
    target.addEventListener("keyup", onUp as EventListener);

    return () => {
      target.removeEventListener("keydown", onDown as EventListener);
      target.removeEventListener("keyup", onUp as EventListener);
      this.active.clear();
    };
  }

  isActive(action: Action): boolean {
    return this.active.has(action);
  }

  /** Comma-separated list of held actions, for the HUD / debugging. */
  describe(): string {
    return this.active.size > 0 ? [...this.active].join(", ") : "idle";
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    const action = KEY_MAP[event.code];
    if (!action) {
      return;
    }

    event.preventDefault();
    if (pressed) {
      this.active.add(action);
    } else {
      this.active.delete(action);
    }
  }
}
