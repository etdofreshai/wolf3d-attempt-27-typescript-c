import { i8, readU16LE, writeU16LE } from "./TS_C";

export const DEMOTICS = 4;
export const NUMBUTTONS = 8;
export const WL6_DEMO_CHUNKS = [139, 140, 141, 142] as const;

export interface DemoTicCommand {
  readonly byteOffset: number;
  readonly buttonbits: number;
  readonly buttonstate: readonly boolean[];
  readonly controlx: number;
  readonly controly: number;
  readonly scaledControlx: number;
  readonly scaledControly: number;
  readonly tics: typeof DEMOTICS;
}

export interface WolfDemo {
  readonly mapon: number;
  readonly length: number;
  readonly padding: number;
  readonly commands: readonly DemoTicCommand[];
}

export function parseDemo(source: Uint8Array): WolfDemo {
  if (source.length < 4) {
    throw new Error(`Demo chunk is too short: ${source.length} bytes`);
  }

  const mapon = source[0];
  const length = readU16LE(source, 1);
  const padding = source[3];
  if (length < 4) {
    throw new Error(`Demo length ${length} is smaller than its 4-byte header`);
  }
  if (length > source.length) {
    throw new Error(`Demo length ${length} exceeds decoded chunk length ${source.length}`);
  }
  if ((length - 4) % 3 !== 0) {
    throw new Error(`Demo command payload length ${length - 4} is not divisible by 3`);
  }

  const commands: DemoTicCommand[] = [];
  for (let offset = 4; offset < length; offset += 3) {
    const buttonbits = source[offset];
    const controlx = i8(source[offset + 1]);
    const controly = i8(source[offset + 2]);
    commands.push({
      byteOffset: offset,
      buttonbits,
      buttonstate: buttonStateFromBits(buttonbits),
      controlx,
      controly,
      scaledControlx: controlx * DEMOTICS,
      scaledControly: controly * DEMOTICS,
      tics: DEMOTICS,
    });
  }

  return { mapon, length, padding, commands };
}

export function serializeDemo(demo: WolfDemo): Uint8Array {
  const length = 4 + demo.commands.length * 3;
  const dest = new Uint8Array(length);
  dest[0] = demo.mapon & 0xff;
  writeU16LE(dest, 1, length);
  dest[3] = demo.padding & 0xff;

  let offset = 4;
  for (const command of demo.commands) {
    dest[offset++] = command.buttonbits & 0xff;
    dest[offset++] = command.controlx & 0xff;
    dest[offset++] = command.controly & 0xff;
  }

  return dest;
}

export function buttonStateFromBits(buttonbits: number): boolean[] {
  const state: boolean[] = [];
  let bits = buttonbits & 0xff;
  for (let i = 0; i < NUMBUTTONS; i++) {
    state.push((bits & 1) !== 0);
    bits >>= 1;
  }
  return state;
}

export function buttonBitsFromState(buttonstate: readonly boolean[]): number {
  let bits = 0;
  for (let i = NUMBUTTONS - 1; i >= 0; i--) {
    bits <<= 1;
    if (buttonstate[i]) {
      bits |= 1;
    }
  }
  return bits & 0xff;
}
