import { readU16LE } from "./TS_C";
import { PM_GetSpritePage } from "./ID_PM.C";
import { bufferofs, videoPlanes } from "./ID_VL.C";
import { viewheight as drawViewheight, viewwidth as drawViewwidth } from "./WL_DRAW.C";

export const MAXSCALEHEIGHT = 256;
export const COMPSCALECODESTART = 65 * 4;
export const SCREENBWIDE = 80;
export const MAXSCALERMEMORY = 0x10000;
const VIDEO_PLANE_BYTES = 0x10000;

export const mapmasks1 = [
  [1, 3, 7, 15, 15, 15, 15, 15],
  [2, 6, 14, 14, 14, 14, 14, 14],
  [4, 12, 12, 12, 12, 12, 12, 12],
  [8, 8, 8, 8, 8, 8, 8, 8],
] as const;

export const mapmasks2 = [
  [0, 0, 0, 0, 1, 3, 7, 15],
  [0, 0, 0, 1, 3, 7, 15, 15],
  [0, 0, 1, 3, 7, 15, 15, 15],
  [0, 1, 3, 7, 15, 15, 15, 15],
] as const;

export const mapmasks3 = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 1, 3],
  [0, 0, 0, 0, 0, 1, 3, 7],
] as const;

export const wordmasks = [
  [0x0080, 0x00c0, 0x00e0, 0x00f0, 0x00f8, 0x00fc, 0x00fe, 0x00ff],
  [0x0040, 0x0060, 0x0070, 0x0078, 0x007c, 0x007e, 0x007f, 0x807f],
  [0x0020, 0x0030, 0x0038, 0x003c, 0x003e, 0x003f, 0x803f, 0xc03f],
  [0x0010, 0x0018, 0x001c, 0x001e, 0x001f, 0x801f, 0xc01f, 0xe01f],
  [0x0008, 0x000c, 0x000e, 0x000f, 0x800f, 0xc00f, 0xe00f, 0xf00f],
  [0x0004, 0x0006, 0x0007, 0x8007, 0xc007, 0xe007, 0xf007, 0xf807],
  [0x0002, 0x0003, 0x8003, 0xc003, 0xe003, 0xf003, 0xf803, 0xfc03],
  [0x0001, 0x8001, 0xc001, 0xe001, 0xf001, 0xf801, 0xfc01, 0xfe01],
] as const;

type ScalerMemoryModel = "segmented" | "old" | "contiguous";

export interface BuildCompScaleOptions {
  readonly viewheight?: number;
}

export interface CompScale {
  readonly height: number;
  readonly viewheight: number;
  readonly topPix: number;
  readonly width: readonly number[];
  readonly codeofs: readonly number[];
  readonly codeBytes: readonly number[];
  readonly totalSize: number;
  readonly scaledPixels: number;
  readonly address: number;
}

export interface SetupScalingOptions {
  readonly viewheight?: number;
}

export interface BuiltScaleSummary {
  readonly scale: number;
  readonly height: number;
  readonly totalSize: number;
  readonly widthChecksum: number;
  readonly codeChecksum: number;
  readonly address: number;
}

export interface ScaleAliasSummary {
  readonly from: number;
  readonly to: number;
}

export interface SetupScalingSummary {
  readonly file: string;
  readonly requestedHeight: number;
  readonly scaleCount: number;
  readonly viewheight: number;
  readonly maxscale: number;
  readonly maxscaleshl2: number;
  readonly stepbytwo: number;
  readonly built: readonly BuiltScaleSummary[];
  readonly aliases: readonly ScaleAliasSummary[];
  readonly badScaleStart: number;
  readonly scalerBytes: number;
  readonly freeScalerMemory: number | null;
}

export interface ScaleLineCommand {
  readonly end: number;
  readonly top?: number;
  readonly start?: number;
}

export interface ScaleLineOptions {
  readonly slinex: number;
  readonly slinewidth: number;
  readonly linecmds?: readonly ScaleLineCommand[];
  readonly bufferofs?: number;
}

export interface ScaleLineSummary {
  readonly slinex: number;
  readonly slinewidth: number;
  readonly byteX: number;
  readonly screenOffset: number;
  readonly masks: readonly number[];
  readonly sourceSegments: number;
  readonly patchedRetfs: number;
  readonly screenColumns: number;
}

export interface ScaleShapeSprite {
  readonly leftpix: number;
  readonly rightpix: number;
  readonly dataofs?: readonly number[];
  readonly page?: Uint8Array;
}

export interface ScaleShapeOptions {
  readonly viewwidth?: number;
  readonly viewheight?: number;
  readonly wallheight?: ArrayLike<number>;
}

export interface ScaleShapeLine {
  readonly side: "left" | "right";
  readonly srcx: number;
  readonly x: number;
  readonly width: number;
  readonly command: number;
  readonly masks: readonly number[];
}

export interface ScaleShapeSummary {
  readonly file: string;
  readonly xcenter: number;
  readonly shapenum: number | null;
  readonly height: number;
  readonly scale: number;
  readonly viewwidth: number;
  readonly skipped: boolean;
  readonly reason: string | null;
  readonly lines: readonly ScaleShapeLine[];
  readonly screenColumns: number;
  readonly pixels: number;
}

interface ScalerState {
  readonly scaledirectory: Array<CompScale | null>;
  readonly fullscalefarcall: number[];
  maxscale: number;
  maxscaleshl2: number;
  stepbytwo: number;
  scalerBytes: number;
  freeScalerMemory: number | null;
}

export interface ScaleRuntime {
  readonly scaledirectory: Array<CompScale | null>;
  readonly fullscalefarcall: number[];
  readonly BadScale: () => never;
  readonly BuildCompScale: (height: number, options?: BuildCompScaleOptions) => CompScale;
  readonly ScaleLine: (options: ScaleLineOptions) => ScaleLineSummary;
  readonly ScaleShape: (
    xcenter: number,
    shapeOrNumber: number | ScaleShapeSprite,
    height: number,
    options?: ScaleShapeOptions,
  ) => ScaleShapeSummary;
  readonly SetupScaling: (maxscaleheight: number, options?: SetupScalingOptions) => SetupScalingSummary;
  readonly SimpleScaleShape: (
    xcenter: number,
    shapeOrNumber: number | ScaleShapeSprite,
    height: number,
    options?: ScaleShapeOptions,
  ) => ScaleShapeSummary;
}

function activeViewheight(value?: number): number {
  return Math.max(1, Math.trunc(value ?? (drawViewheight || 152)));
}

function activeViewwidth(value?: number): number {
  return Math.max(1, Math.trunc(value ?? (drawViewwidth || 320)));
}

function positiveMod(value: number, divisor: number): number {
  return ((Math.trunc(value) % divisor) + divisor) % divisor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function checksum(values: readonly number[]): number {
  let result = 0;
  for (const value of values) {
    result = (Math.imul(result, 131) + (value & 0xffff)) >>> 0;
  }
  return result;
}

function align16(value: number): number {
  return (value + 15) & ~15;
}

function cloneWithAddress(scale: CompScale, address: number): CompScale {
  return { ...scale, address };
}

function makeShape(shapeOrNumber: number | ScaleShapeSprite): {
  readonly leftpix: number;
  readonly rightpix: number;
  readonly dataofs: readonly number[];
  readonly shapenum: number | null;
  readonly page: Uint8Array | null;
} {
  if (typeof shapeOrNumber === "number") {
    try {
      const page = PM_GetSpritePage(Math.trunc(shapeOrNumber));
      const parsed = parseSpritePage(page);
      if (parsed) {
        return {
          ...parsed,
          shapenum: Math.trunc(shapeOrNumber),
          page,
        };
      }
    } catch {
      // Tests and non-visual summary calls may run before the page manager starts.
    }
    return {
      leftpix: 0,
      rightpix: 63,
      dataofs: Array.from({ length: 64 }, (_unused, index) => index),
      shapenum: Math.trunc(shapeOrNumber),
      page: null,
    };
  }

  return {
    leftpix: clamp(shapeOrNumber.leftpix, 0, 63),
    rightpix: clamp(shapeOrNumber.rightpix, 0, 63),
    dataofs: shapeOrNumber.dataofs ?? Array.from({ length: 64 }, (_unused, index) => index),
    shapenum: null,
    page: shapeOrNumber.page ?? null,
  };
}

function parseSpritePage(page: Uint8Array): {
  readonly leftpix: number;
  readonly rightpix: number;
  readonly dataofs: readonly number[];
} | null {
  if (page.length < 4) {
    return null;
  }
  const leftpix = readU16LE(page, 0);
  const rightpix = readU16LE(page, 2);
  if (leftpix > rightpix || rightpix >= 64) {
    return null;
  }
  const offsetCount = rightpix - leftpix + 1;
  if (page.length < 4 + offsetCount * 2) {
    return null;
  }
  const dataofs = Array.from({ length: offsetCount }, (_unused, index) => readU16LE(page, 4 + index * 2));
  return { leftpix, rightpix, dataofs };
}

function makeState(): ScalerState {
  return {
    scaledirectory: new Array<CompScale | null>(MAXSCALEHEIGHT + 3).fill(null),
    fullscalefarcall: new Array<number>(MAXSCALEHEIGHT + 3).fill(0),
    maxscale: 0,
    maxscaleshl2: 0,
    stepbytwo: 0,
    scalerBytes: 0,
    freeScalerMemory: null,
  };
}

export function buildCompScale(height: number, options: BuildCompScaleOptions = {}): CompScale {
  const scaleHeight = Math.max(0, Math.trunc(height));
  const viewheight = activeViewheight(options.viewheight);
  const step = Math.trunc((scaleHeight * 0x10000) / 64);
  const toppix = Math.trunc((viewheight - scaleHeight) / 2);
  const width = new Array<number>(65).fill(0);
  const codeofs = new Array<number>(65).fill(0);
  const code: number[] = [];
  let fix = 0;
  let scaledPixels = 0;

  for (let src = 0; src <= 64; src++) {
    let startpix = fix >> 16;
    fix += step;
    let endpix = fix >> 16;
    width[src] = endpix > startpix ? endpix - startpix : 0;
    codeofs[src] = COMPSCALECODESTART + code.length;

    startpix += toppix;
    endpix += toppix;
    if (startpix === endpix || endpix < 0 || startpix >= viewheight || src === 64) {
      continue;
    }

    code.push(0x8a, 0x44, src & 0xff);
    for (; startpix < endpix; startpix++) {
      if (startpix >= viewheight) {
        break;
      }
      if (startpix < 0) {
        continue;
      }
      const offset = startpix * SCREENBWIDE;
      code.push(0x26, 0x88, 0x85, offset & 0xff, (offset >>> 8) & 0xff);
      scaledPixels++;
    }
  }

  code.push(0xcb);
  return {
    height: scaleHeight,
    viewheight,
    topPix: toppix,
    width,
    codeofs,
    codeBytes: code,
    totalSize: COMPSCALECODESTART + code.length,
    scaledPixels,
    address: 0,
  };
}

export function scaleLine(options: ScaleLineOptions): ScaleLineSummary {
  const slinex = Math.trunc(options.slinex);
  const slinewidth = clamp(options.slinewidth, 1, 8);
  const pixel = positiveMod(slinex, 4);
  const widthIndex = slinewidth - 1;
  const mask1 = mapmasks1[pixel][widthIndex];
  const mask2 = mapmasks2[pixel][widthIndex];
  const mask3 = mapmasks3[pixel][widthIndex];
  const masks = mask3 ? [mask1, mask2, mask3] : mask2 ? [mask1, mask2] : [mask1];
  const commands = options.linecmds ?? [];
  let sourceSegments = 0;
  for (const command of commands) {
    if (command.end === 0) {
      break;
    }
    sourceSegments++;
  }

  return {
    slinex,
    slinewidth,
    byteX: slinex >> 2,
    screenOffset: (options.bufferofs ?? 0) + (slinex >> 2),
    masks,
    sourceSegments,
    patchedRetfs: sourceSegments,
    screenColumns: masks.length * sourceSegments,
  };
}

function getScaleForShape(state: ScalerState, scale: number, viewheight: number): CompScale | null {
  if (scale <= 0 || scale >= state.scaledirectory.length) {
    return null;
  }
  const existing = state.scaledirectory[scale];
  if (existing) {
    return existing;
  }
  const built = buildCompScale(scale * 2, { viewheight });
  state.scaledirectory[scale] = built;
  return built;
}

function wallAt(options: ScaleShapeOptions, x: number): number {
  if (x < 0) {
    return Number.POSITIVE_INFINITY;
  }
  return options.wallheight?.[x] ?? 0;
}

function lineSummary(side: "left" | "right", srcx: number, x: number, width: number, command: number): ScaleShapeLine {
  const masks = scaleLine({ slinex: x, slinewidth: width, linecmds: [{ end: 1 }] }).masks;
  return { side, srcx, x, width, command, masks };
}

function scaleShapeImpl(
  file: string,
  state: ScalerState,
  xcenter: number,
  shapeOrNumber: number | ScaleShapeSprite,
  height: number,
  options: ScaleShapeOptions,
  simple: boolean,
): ScaleShapeSummary {
  const shape = makeShape(shapeOrNumber);
  const viewheight = activeViewheight(options.viewheight);
  const viewwidth = activeViewwidth(options.viewwidth);
  const scale = Math.trunc(height) >> (simple ? 1 : 3);
  const comptable = getScaleForShape(state, scale, viewheight);
  if (!comptable) {
    return {
      file,
      xcenter: Math.trunc(xcenter),
      shapenum: shape.shapenum,
      height: Math.trunc(height),
      scale,
      viewwidth,
      skipped: true,
      reason: "scale-out-of-range",
      lines: [],
      screenColumns: 0,
      pixels: 0,
    };
  }

  const lines: ScaleShapeLine[] = [];
  let srcx = 32;
  let slinex = Math.trunc(xcenter);
  let stopx = shape.leftpix;
  let cmdIndex = 31 - stopx;

  while (--srcx >= stopx && (simple || slinex > 0)) {
    const command = shape.dataofs[cmdIndex--] ?? 0;
    let slinewidth = comptable.width[srcx] ?? 0;
    if (!slinewidth) {
      continue;
    }

    if (simple) {
      slinex -= slinewidth;
      lines.push(lineSummary("left", srcx, slinex, slinewidth, command));
      continue;
    }

    if (slinewidth === 1) {
      slinex--;
      if (slinex < viewwidth && wallAt(options, slinex) < height) {
        lines.push(lineSummary("left", srcx, slinex, slinewidth, command));
      }
      continue;
    }

    if (slinex > viewwidth) {
      slinex -= slinewidth;
      slinewidth = viewwidth - slinex;
      if (slinewidth < 1) {
        continue;
      }
    } else {
      if (slinewidth > slinex) {
        slinewidth = slinex;
      }
      slinex -= slinewidth;
    }

    const leftvis = wallAt(options, slinex) < height;
    const rightvis = wallAt(options, slinex + slinewidth - 1) < height;
    if (leftvis) {
      if (!rightvis) {
        while (slinewidth > 0 && wallAt(options, slinex + slinewidth - 1) >= height) {
          slinewidth--;
        }
      }
      if (slinewidth > 0) {
        lines.push(lineSummary("left", srcx, slinex, slinewidth, command));
      }
    } else if (rightvis) {
      while (slinewidth > 0 && wallAt(options, slinex) >= height) {
        slinex++;
        slinewidth--;
      }
      if (slinewidth > 0) {
        lines.push(lineSummary("left", srcx, slinex, slinewidth, command));
      }
      break;
    }
  }

  slinex = Math.trunc(xcenter);
  stopx = shape.rightpix;
  let slinewidth = 0;
  if (shape.leftpix < 31) {
    srcx = 31;
    cmdIndex = 32 - shape.leftpix;
  } else {
    srcx = shape.leftpix - 1;
    cmdIndex = 0;
  }

  while (true) {
    srcx++;
    slinex += slinewidth;
    if (srcx > stopx || (!simple && slinex >= viewwidth)) {
      break;
    }

    const command = shape.dataofs[cmdIndex++] ?? 0;
    slinewidth = comptable.width[srcx] ?? 0;
    if (!slinewidth) {
      continue;
    }

    if (simple) {
      lines.push(lineSummary("right", srcx, slinex, slinewidth, command));
      continue;
    }

    if (slinewidth === 1) {
      if (slinex >= 0 && wallAt(options, slinex) < height) {
        lines.push(lineSummary("right", srcx, slinex, slinewidth, command));
      }
      continue;
    }

    if (slinex < 0) {
      if (slinewidth <= -slinex) {
        continue;
      }
      slinewidth += slinex;
      slinex = 0;
    } else if (slinex + slinewidth > viewwidth) {
      slinewidth = viewwidth - slinex;
    }

    const leftvis = wallAt(options, slinex) < height;
    const rightvis = wallAt(options, slinex + slinewidth - 1) < height;
    if (leftvis) {
      if (!rightvis) {
        while (slinewidth > 0 && wallAt(options, slinex + slinewidth - 1) >= height) {
          slinewidth--;
        }
        if (slinewidth > 0) {
          lines.push(lineSummary("right", srcx, slinex, slinewidth, command));
        }
        break;
      }
      lines.push(lineSummary("right", srcx, slinex, slinewidth, command));
    } else if (rightvis) {
      while (slinewidth > 0 && wallAt(options, slinex) >= height) {
        slinex++;
        slinewidth--;
      }
      if (slinewidth > 0) {
        lines.push(lineSummary("right", srcx, slinex, slinewidth, command));
      }
    }
  }

  const spritePage = shape.page;
  const pixels = spritePage
    ? lines.reduce((total, line) => total + drawSpriteLine(spritePage, comptable, line, viewheight, viewwidth), 0)
    : 0;

  return {
    file,
    xcenter: Math.trunc(xcenter),
    shapenum: shape.shapenum,
    height: Math.trunc(height),
    scale,
    viewwidth,
    skipped: false,
    reason: null,
    lines,
    screenColumns: lines.reduce((total, line) => total + line.width, 0),
    pixels,
  };
}

function drawSpriteLine(
  page: Uint8Array,
  comptable: CompScale,
  line: ScaleShapeLine,
  viewheight: number,
  viewwidth: number,
): number {
  let command = line.command;
  let writes = 0;
  let guard = 0;
  while (command > 0 && command + 5 < page.length && guard++ < 32) {
    const end = readU16LE(page, command);
    if (!end) {
      break;
    }
    const top = readU16LE(page, command + 2);
    const start = readU16LE(page, command + 4);
    const startSrc = start >> 1;
    const endSrc = Math.min(64, end >> 1);
    for (let src = startSrc; src < endSrc; src++) {
      // DOS reads the source texel via a 16-bit segment offset `[es:di]` where di = top + src.
      // `top` is a signed/near offset that can be "negative" (e.g. 0xFFF5); the add wraps mod
      // 0x10000. Masking replicates that wraparound — without it, large unsigned `top` values
      // overflow past page.length and the post's pixels (the sprite's bottom rows) are skipped.
      const source = (top + src) & 0xffff;
      if (source < 0 || source >= page.length) {
        continue;
      }
      const color = page[source];
      const yStart = sourceTop(comptable, src);
      const yEnd = yStart + (comptable.width[src] ?? 0);
      for (let y = Math.max(0, yStart); y < Math.min(viewheight, yEnd); y++) {
        for (let dx = 0; dx < line.width; dx++) {
          writes += writeScalePixel(line.x + dx, y, color, viewwidth, viewheight);
        }
      }
    }
    command += 6;
  }
  return writes;
}

function sourceTop(comptable: CompScale, src: number): number {
  let top = comptable.topPix;
  for (let i = 0; i < src; i++) {
    top += comptable.width[i] ?? 0;
  }
  return top;
}

function writeScalePixel(x: number, y: number, color: number, viewwidth: number, viewheight: number): number {
  if (x < 0 || y < 0 || x >= viewwidth || y >= viewheight) {
    return 0;
  }
  const plane = x & 3;
  const offset = (bufferofs + y * SCREENBWIDE + (x >> 2)) & 0xffff;
  videoPlanes[plane * VIDEO_PLANE_BYTES + offset] = color & 0xff;
  return 1;
}

function setupScalingImpl(
  file: string,
  memoryModel: ScalerMemoryModel,
  state: ScalerState,
  maxscaleheight: number,
  options: SetupScalingOptions = {},
): SetupScalingSummary {
  const requestedHeight = Math.max(0, Math.trunc(maxscaleheight));
  const scaleCount = Math.min(MAXSCALEHEIGHT, Math.trunc(requestedHeight / 2));
  const viewheight = activeViewheight(options.viewheight);
  state.scaledirectory.fill(null);
  state.fullscalefarcall.fill(0);
  state.maxscale = scaleCount - 1;
  state.maxscaleshl2 = state.maxscale << 2;
  state.stepbytwo = Math.trunc(viewheight / 2);
  state.scalerBytes = 0;
  state.freeScalerMemory = memoryModel === "contiguous" ? MAXSCALERMEMORY : null;

  const built: BuiltScaleSummary[] = [];
  const aliases: ScaleAliasSummary[] = [];
  let nextAddress = 0;

  for (let i = 1; i <= scaleCount; i++) {
    const baseAddress = memoryModel === "contiguous" ? align16(nextAddress) : i * 0x10000;
    const scaler = cloneWithAddress(buildCompScale(i * 2, { viewheight }), baseAddress);
    state.scaledirectory[i] = scaler;
    nextAddress = baseAddress + scaler.totalSize;
    state.scalerBytes += scaler.totalSize;
    built.push({
      scale: i,
      height: scaler.height,
      totalSize: scaler.totalSize,
      widthChecksum: checksum(scaler.width),
      codeChecksum: checksum(scaler.codeBytes),
      address: scaler.address,
    });
    if (i >= state.stepbytwo) {
      i += 2;
    }
  }

  for (let i = 1; i <= scaleCount; i++) {
    const scaler = state.scaledirectory[i];
    if (scaler) {
      state.fullscalefarcall[i] = scaler.address + scaler.codeofs[0];
    }
    if (i >= state.stepbytwo) {
      const source = state.scaledirectory[i];
      const sourceCall = state.fullscalefarcall[i];
      for (const alias of [i + 1, i + 2]) {
        if (alias < state.scaledirectory.length) {
          state.scaledirectory[alias] = source;
          state.fullscalefarcall[alias] = sourceCall;
          aliases.push({ from: i, to: alias });
        }
      }
      i += 2;
    }
  }

  state.scaledirectory[0] = state.scaledirectory[1];
  state.fullscalefarcall[0] = state.fullscalefarcall[1] ?? 0;
  for (let i = scaleCount; i < MAXSCALEHEIGHT; i++) {
    state.fullscalefarcall[i] = -1;
  }

  if (memoryModel === "contiguous") {
    state.scalerBytes = nextAddress;
    state.freeScalerMemory = MAXSCALERMEMORY - 16 - state.scalerBytes;
  }

  return {
    file,
    requestedHeight,
    scaleCount,
    viewheight,
    maxscale: state.maxscale,
    maxscaleshl2: state.maxscaleshl2,
    stepbytwo: state.stepbytwo,
    built,
    aliases,
    badScaleStart: scaleCount,
    scalerBytes: state.scalerBytes,
    freeScalerMemory: state.freeScalerMemory,
  };
}

export function createScaleRuntime(file: string, memoryModel: ScalerMemoryModel): ScaleRuntime {
  const state = makeState();
  return {
    scaledirectory: state.scaledirectory,
    fullscalefarcall: state.fullscalefarcall,
    BadScale: () => {
      throw new Error(`${file}: BadScale called!`);
    },
    BuildCompScale: (height, options = {}) => buildCompScale(height, options),
    ScaleLine: (options) => scaleLine(options),
    ScaleShape: (xcenter, shapeOrNumber, height, options = {}) =>
      scaleShapeImpl(file, state, xcenter, shapeOrNumber, height, options, false),
    SetupScaling: (maxscaleheight, options = {}) =>
      setupScalingImpl(file, memoryModel, state, maxscaleheight, options),
    SimpleScaleShape: (xcenter, shapeOrNumber, height, options = {}) =>
      scaleShapeImpl(file, state, xcenter, shapeOrNumber, height, options, true),
  };
}
