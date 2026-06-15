export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 200;
export const VGA_COLORS = 256;

const VIDEO_PLANE_BYTES = 0x10000;

export class IndexedVgaSurface {
  readonly pixels = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
  readonly palette = new Uint8Array(VGA_COLORS * 3);
  readonly imageData: ImageData;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  clear(color = 0): void {
    this.pixels.fill(color & 0xff);
  }

  setPalette(index: number, red: number, green: number, blue: number): void {
    const offset = index * 3;
    this.palette[offset] = red & 0xff;
    this.palette[offset + 1] = green & 0xff;
    this.palette[offset + 2] = blue & 0xff;
  }

  setPaletteFromVgaDac(palette: Uint8Array): void {
    for (let color = 0; color < VGA_COLORS; color++) {
      const offset = color * 3;
      this.setPalette(
        color,
        dacToCanvasByte(palette[offset] ?? 0),
        dacToCanvasByte(palette[offset + 1] ?? 0),
        dacToCanvasByte(palette[offset + 2] ?? 0),
      );
    }
  }

  copyFromPlanarVga(videoPlanes: Uint8Array, displayOffset = 0, lineWidth = 80): void {
    const display = displayOffset & 0xffff;
    const stride = lineWidth & 0xffff;

    for (let y = 0; y < SCREEN_HEIGHT; y++) {
      const rowOffset = (display + y * stride) & 0xffff;
      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const plane = x & 3;
        const planeOffset = (rowOffset + (x >> 2)) & 0xffff;
        this.pixels[y * SCREEN_WIDTH + x] = videoPlanes[plane * VIDEO_PLANE_BYTES + planeOffset] ?? 0;
      }
    }
  }

  present(): void {
    const rgba = this.imageData.data;
    for (let i = 0, j = 0; i < this.pixels.length; i++, j += 4) {
      const color = this.pixels[i] * 3;
      rgba[j] = this.palette[color];
      rgba[j + 1] = this.palette[color + 1];
      rgba[j + 2] = this.palette[color + 2];
      rgba[j + 3] = 0xff;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}

function dacToCanvasByte(value: number): number {
  const dac = Math.max(0, Math.min(63, value));
  return Math.round(dac * 255 / 63);
}
