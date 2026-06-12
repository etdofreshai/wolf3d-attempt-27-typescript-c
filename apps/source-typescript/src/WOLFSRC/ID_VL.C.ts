// ID_VL.C
//
// PARTIAL PORT: only the VGA memory model and the globals ID_CA touches.
// The full VGA low-level module is ported in the game-loop milestone.
//
// VGA Mode Y model: 4 planes x 64 KB. A "screen address" is a 16-bit offset
// within a plane; the sequencer map mask selects which plane(s) a write
// lands in. The browser canvas presents plane-interleaved pixels once ID_VL
// is fully ported; until then this buffer just receives faithful writes
// (e.g. CA_CacheScreen's four-plane Huffman screen hack).

export const vgamem = new Uint8Array(4 * 0x10000);

export const vl = {
  // unsigned bufferofs;   // all drawing is reletive to this
  bufferofs: 0,
  // unsigned displayofs,pelpan;   // last setscreen coordinates
  displayofs: 0,
  pelpan: 0,
  // unsigned screenseg;   // set to 0xa000 / segment of the screen
  screenseg: 0xa000,
};
