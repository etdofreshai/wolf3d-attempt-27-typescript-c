// Color gate — validates the VGA palette the browser actually displays with. GAMEPAL.OBJ is an
// OMF object file; the 768-byte _gamepal array lives in its LEDATA record (type 0xA0), whose
// payload is [segIndex][dataOffset:2][raw bytes]. The port (main.ts readGamePaletteObject) reads
// the palette at file offset 0x77. A regression here (e.g. the old off-by-one 0x76) shifts every
// RGB triplet and scrambles ALL on-screen colors — yet leaves the indexed framebuffer (and thus
// check:frame, which compares palette INDICES) completely green. This gate guards the colors:
//   1. parse the OMF LEDATA record to DERIVE the true palette offset (no hardcoding),
//   2. assert the port's hardcoded 0x77 matches that derived offset,
//   3. assert the extracted palette is valid 6-bit DAC (0..63) and matches canonical Wolf3D colors.
import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const PORT_OFFSET = 0x77; // must match main.ts readGamePaletteObject payloadOffset
const obj = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// 1. Walk OMF records to find the LEDATA (0xA0) holding _gamepal and derive its data offset.
let p = 0, ledataOffset = null;
while (p < obj.length) {
  const type = obj[p];
  const len = obj[p + 1] | (obj[p + 2] << 8);
  if (len === 0) break;
  if (type === 0xa0) {
    // LEDATA payload: segIndex (1 byte for index<=0x7f, else 2) + dataOffset(2) + raw data.
    const payload = p + 3;
    const segIndexBytes = obj[payload] & 0x80 ? 2 : 1;
    ledataOffset = payload + segIndexBytes + 2; // skip segIndex + 2-byte enumerated data offset
    break;
  }
  p += 3 + len;
}
expect(ledataOffset !== null, "found the LEDATA (0xA0) record carrying _gamepal");
expect(ledataOffset === PORT_OFFSET, `port offset 0x${PORT_OFFSET.toString(16)} matches OMF-derived 0x${(ledataOffset ?? 0).toString(16)}`);

// 2. Extract the palette the port uses and validate its range + canonical colors.
const pal = obj.subarray(PORT_OFFSET, PORT_OFFSET + 768);
expect(pal.length === 768, "extracted a full 256-color (768-byte) palette");
let min = 255, max = 0;
for (const v of pal) { if (v < min) min = v; if (v > max) max = v; }
expect(min === 0 && max === 63, `palette is 6-bit VGA DAC (range ${min}..${max}, expected 0..63)`);

// Canonical Wolf3D gamepal head (6-bit). Index 0 = black, index 1 = blue (the off-by-one made
// index 1 read black), through the EGA-style first 8 entries.
const canon = [
  [0, 0, 0], [0, 0, 42], [0, 42, 0], [0, 42, 42],
  [42, 0, 0], [42, 0, 42], [42, 21, 0], [42, 42, 42],
];
let mismatches = 0;
for (let i = 0; i < canon.length; i++) {
  const got = [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
  if (got[0] !== canon[i][0] || got[1] !== canon[i][1] || got[2] !== canon[i][2]) {
    mismatches++;
    console.log(`   color ${i}: got (${got}) expected (${canon[i]})`);
  }
}
expect(mismatches === 0, "first 8 colors match the canonical Wolf3D palette (black, blue, green, … not scrambled)");
expect(pal[0] === 0 && pal[1] === 0 && pal[2] === 0, "color 0 is black");
expect(pal[3] === 0 && pal[4] === 0 && pal[5] === 42, "color 1 is blue (the classic blue status bar / E1M1 walls)");

console.log(fail === 0
  ? "\n✅ PALETTE: GAMEPAL.OBJ palette extraction is byte-correct (colors render with the true Wolf3D VGA palette)."
  : `\n❌ ${fail} palette check(s) failed — on-screen colors would be wrong.`);
process.exitCode = fail === 0 ? 0 : 1;
