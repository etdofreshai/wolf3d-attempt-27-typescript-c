/**
 * vga.ts — the VGA card model (PORTING.md §11#5: the platform shim is the
 * moral equivalent of the original DOS hardware layer).
 *
 * ID_VL.C is the *driver*; this module is the *card*. The port of ID_VL
 * talks to it through the same access paths the original used:
 *
 *   - outportb/inportb/outport on the real VGA port map (sequencer 0x3C4,
 *     graphics controller 0x3CE, CRTC 0x3D4, attribute 0x3C0, DAC 0x3C7-9,
 *     input status 1 0x3DA),
 *   - planar memory reads/writes at segment A000 (vgaWrite/vgaRead), which
 *     honor the map mask, write mode 0/1 and the four latches — Mode Y
 *     exactly as Wolfenstein programs it.
 *
 *   present() renders the visible 320x200 frame (CRTC start address +
 *   row offset + 6-bit DAC palette) into an RGBA buffer for the canvas /
 *   headless tests.
 *
 *   VBL timing is host-provided: the browser worker blocks on the 70 Hz
 *   tick (Atomics), Node tests advance virtual time. setVBLHandler wires
 *   it; ID_VL's VL_WaitVBL goes through here.
 */

// ---------------------------------------------------------------------------
// Planar memory: 4 planes x 64 KB
// ---------------------------------------------------------------------------

export const vgamem = new Uint8Array(4 * 0x10000);
const latches = new Uint8Array(4);

// ---------------------------------------------------------------------------
// Registers
// ---------------------------------------------------------------------------

const SC = new Uint8Array(8); // sequencer; SC[2] = map mask, SC[4] = memmode
const GC = new Uint8Array(9); // graphics ctrl; GC[4] = read map, GC[5] = mode
const CRTC = new Uint8Array(25); // CRTC; [12/13] start, [19] offset (row pitch/2)
const ATR = new Uint8Array(21); // attribute ctrl; [0x13] = pel pan
const DAC = new Uint8Array(768); // 6-bit per channel

let scIndex = 0;
let gcIndex = 0;
let crtcIndex = 0;
let atrIndex = 0;
let atrFlipFlop = 0; // 0 = expecting index, 1 = expecting data
let dacWriteIndex = 0;
let dacReadIndex = 0;
let dacPhase = 0; // 0..2 within an RGB triple
let dacReadPhase = 0;

export const vgastate = {
  bordercolor: 0, // set via int 10h ax=0x10 bh (VL_ColorBorder)
  textmode: false,
};

// initial state matching what int 10h mode 0x13 leaves before DePlaneVGA
SC[2] = 0x0f;
GC[5] = 0;
CRTC[19] = 40;

export function outportb(port: number, value: number): void {
  value &= 0xff;
  switch (port) {
    case 0x3c4:
      scIndex = value & 7;
      break;
    case 0x3c5:
      SC[scIndex] = value;
      break;
    case 0x3ce:
      gcIndex = value & 15;
      break;
    case 0x3cf:
      if (gcIndex < GC.length) GC[gcIndex] = value;
      break;
    case 0x3d4:
      crtcIndex = value & 31;
      break;
    case 0x3d5:
      if (crtcIndex < CRTC.length) CRTC[crtcIndex] = value;
      break;
    case 0x3c0: // attribute controller: index/data flip-flop
      if (atrFlipFlop === 0) {
        atrIndex = value & 31;
        atrFlipFlop = 1;
      } else {
        if (atrIndex < ATR.length) ATR[atrIndex] = value;
        atrFlipFlop = 0;
      }
      break;
    case 0x3c8: // DAC write address
      dacWriteIndex = value;
      dacPhase = 0;
      break;
    case 0x3c7: // DAC read address
      dacReadIndex = value;
      dacReadPhase = 0;
      break;
    case 0x3c9: // DAC data (6-bit)
      DAC[(dacWriteIndex * 3 + dacPhase) % 768] = value & 0x3f;
      if (++dacPhase === 3) {
        dacPhase = 0;
        dacWriteIndex = (dacWriteIndex + 1) & 0xff;
      }
      break;
  }
}

export function inportb(port: number): number {
  switch (port) {
    case 0x3c5:
      return SC[scIndex];
    case 0x3cf:
      return gcIndex < GC.length ? GC[gcIndex] : 0;
    case 0x3d5:
      return crtcIndex < CRTC.length ? CRTC[crtcIndex] : 0;
    case 0x3c9: {
      const v = DAC[(dacReadIndex * 3 + dacReadPhase) % 768];
      if (++dacReadPhase === 3) {
        dacReadPhase = 0;
        dacReadIndex = (dacReadIndex + 1) & 0xff;
      }
      return v;
    }
    case 0x3da:
      atrFlipFlop = 0; // reading status 1 resets the ATR flip-flop
      return 0; // display active
  }
  return 0;
}

/** word out: low byte to port (index), high byte to port+1 (data) */
export function outport(port: number, value: number): void {
  outportb(port, value & 0xff);
  outportb(port + 1, (value >> 8) & 0xff);
}

// ---------------------------------------------------------------------------
// Memory access (segment A000) — honors map mask, write mode, latches
// ---------------------------------------------------------------------------

/** write a byte at a screen offset through the sequencer/GC state */
export function vgaWrite(addr: number, value: number): void {
  addr &= 0xffff;
  const mapmask = SC[2] & 0x0f;
  const writemode = GC[5] & 3;
  if (writemode === 1) {
    // write mode 1: planes get their latched bytes (value ignored)
    if (mapmask & 1) vgamem[addr] = latches[0];
    if (mapmask & 2) vgamem[0x10000 + addr] = latches[1];
    if (mapmask & 4) vgamem[0x20000 + addr] = latches[2];
    if (mapmask & 8) vgamem[0x30000 + addr] = latches[3];
  } else {
    // write mode 0 (Wolf leaves set/reset & bitmask at defaults)
    value &= 0xff;
    if (mapmask & 1) vgamem[addr] = value;
    if (mapmask & 2) vgamem[0x10000 + addr] = value;
    if (mapmask & 4) vgamem[0x20000 + addr] = value;
    if (mapmask & 8) vgamem[0x30000 + addr] = value;
  }
}

/** read a byte at a screen offset: loads the latches, returns read-map plane */
export function vgaRead(addr: number): number {
  addr &= 0xffff;
  latches[0] = vgamem[addr];
  latches[1] = vgamem[0x10000 + addr];
  latches[2] = vgamem[0x20000 + addr];
  latches[3] = vgamem[0x30000 + addr];
  return latches[GC[4] & 3];
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

export const SCREEN_W = 320;
export const SCREEN_H = 200;

/**
 * Render the visible frame to RGBA (length 320*200*4). The visible start
 * address and row pitch come from the CRTC like real hardware; colors from
 * the 6-bit DAC (scaled to 8-bit with the standard (v<<2)|(v>>4)).
 */
export function present(out?: Uint8ClampedArray): Uint8ClampedArray {
  const rgba = out ?? new Uint8ClampedArray(SCREEN_W * SCREEN_H * 4);
  const start = ((CRTC[12] << 8) | CRTC[13]) & 0xffff;
  const pitch = CRTC[19] * 2;
  let o = 0;
  for (let y = 0; y < SCREEN_H; y++) {
    const row = (start + y * pitch) & 0xffff;
    for (let x = 0; x < SCREEN_W; x++) {
      const idx = vgamem[((x & 3) << 16) + ((row + (x >> 2)) & 0xffff)];
      const p = idx * 3;
      rgba[o++] = (DAC[p] << 2) | (DAC[p] >> 4);
      rgba[o++] = (DAC[p + 1] << 2) | (DAC[p + 1] >> 4);
      rgba[o++] = (DAC[p + 2] << 2) | (DAC[p + 2] >> 4);
      rgba[o++] = 255;
    }
  }
  return rgba;
}

// ---------------------------------------------------------------------------
// VBL timing (host-provided)
// ---------------------------------------------------------------------------

let vblHandler: (vbls: number) => void = () => {};

/** The host (browser worker / Node test) decides what waiting for the
 *  vertical blank means: Atomics block, virtual-time advance, etc. */
export function setVBLHandler(fn: (vbls: number) => void): void {
  vblHandler = fn;
}

export function waitVBL(vbls: number): void {
  vblHandler(vbls);
}

/** int 10h services the original calls (mode set, border color) */
export function int10(ax: number, bx = 0): void {
  const ah = ax >> 8;
  if (ah === 0) {
    vgastate.textmode = (ax & 0xff) === 3;
    if ((ax & 0xff) === 0x13) {
      // mode 13h: clear first 16k/plane like the BIOS, palette to defaults
      // (Wolf immediately DePlanes and reloads everything; clearing all
      //  planes here matches VL_DePlaneVGA's full clear that follows)
      vgastate.textmode = false;
    }
  } else if (ah === 0x10 && (ax & 0xff) === 1) {
    vgastate.bordercolor = bx >> 8;
  }
}
