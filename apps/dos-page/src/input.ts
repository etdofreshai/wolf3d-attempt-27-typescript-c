import type { RuntimeInput } from "./wolfDos";

const CODES_TO_CAPTURE = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "Enter"
]);

export class InputTracker {
  private pressed = new Set<string>();
  private mouseTurn = 0;
  private pointerButtonDown = false;

  constructor(private readonly target: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => {
      if (CODES_TO_CAPTURE.has(event.code)) {
        event.preventDefault();
      }
      this.pressed.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      if (CODES_TO_CAPTURE.has(event.code)) {
        event.preventDefault();
      }
      this.pressed.delete(event.code);
    });

    this.target.addEventListener("pointerdown", () => {
      this.pointerButtonDown = true;
      this.target.focus();
    });
    window.addEventListener("pointerup", () => {
      this.pointerButtonDown = false;
    });

    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === this.target) {
        this.mouseTurn += event.movementX;
      }
    });
  }

  snapshot(): RuntimeInput {
    const input: RuntimeInput = {
      forward: this.down("ArrowUp") || this.down("KeyW"),
      back: this.down("ArrowDown") || this.down("KeyS"),
      turnLeft: this.down("ArrowLeft") || this.down("KeyQ"),
      turnRight: this.down("ArrowRight") || this.down("KeyE"),
      strafeLeft: this.down("KeyA"),
      strafeRight: this.down("KeyD"),
      run: this.down("ShiftLeft") || this.down("ShiftRight"),
      attack: this.down("Space") || this.down("Enter") || this.pointerButtonDown,
      mouseTurn: this.mouseTurn
    };

    this.mouseTurn = 0;
    return input;
  }

  async togglePointerLock(): Promise<boolean> {
    if (document.pointerLockElement === this.target) {
      document.exitPointerLock();
      return false;
    }

    await this.target.requestPointerLock();
    return true;
  }

  private down(code: string): boolean {
    return this.pressed.has(code);
  }
}
