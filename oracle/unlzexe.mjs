// unlzexe.mjs — decompress an LZEXE 0.90/0.91-packed DOS .EXE to its raw load image.
//
// The shipped Wolfenstein 3D `steam/base/wolf3d.exe` is LZEXE 0.91-compressed
// ("LZ91" at file offset 0x1C). This recovers the uncompressed real-mode load
// image (code + DGROUP data) so it can be compared against our Borland rebuild
// and mined for the data-segment (save) layout (see oracle/README.md, PORTING.md §10).
//
// Usage:  node oracle/unlzexe.mjs <packed.exe> [out.bin]
//   - <packed.exe>  LZEXE-compressed input
//   - [out.bin]     optional; if given, the decompressed load image is written here
// Prints the load-image size and a few sanity strings.
//
// Algorithm = the classic `unlzexe` unpack loop. The one subtle detail: the
// 16-bit control word is refilled EAGERLY — on the call that consumes its 16th
// bit, before that iteration reads its data byte. Refilling lazily desyncs the
// stream the moment a literal/match byte read lands on a word boundary.

import fs from 'fs';

const u16 = (b, o) => b[o] | (b[o + 1] << 8);

export function unlzexe(buf) {
  if (buf[0] !== 0x4d || buf[1] !== 0x5a) throw new Error('not an MZ executable');
  const sig = buf.slice(0x1c, 0x20).toString('latin1');
  if (sig !== 'LZ91' && sig !== 'LZ09') throw new Error('not LZEXE-packed (sig="' + sig + '")');

  let p = u16(buf, 0x08) * 16;                 // compressed data begins at the load-image start
  const rd16 = () => { const v = buf[p] | (buf[p + 1] << 8); p += 2; return v; };
  const gc = () => buf[p++];
  let bbuf = rd16(), cnt = 16;                 // initbits: pre-read first control word
  const getbit = () => {
    const b = bbuf & 1;
    if (--cnt === 0) { bbuf = rd16(); cnt = 16; } else bbuf >>>= 1;
    return b;
  };

  const out = [];
  for (;;) {
    if (getbit()) { out.push(gc()); continue; }              // 1 => literal byte
    let len, span;
    if (!getbit()) {                                         // 00 => short match
      len = (getbit() << 1); len |= getbit(); len += 2;      // length 2..5
      span = gc() - 256;                                     // distance -256..-1
    } else {                                                 // 01 => long match
      const b0 = gc(), b1 = gc();
      span = (b0 | ((b1 & 0xF8) << 5) | 0xE000) - 0x10000;   // distance -8192..-1 (int16)
      len = (b1 & 0x07) + 2;
      if (len === 2) {                                       // length-field 0 => escape
        const c = gc();
        if (c === 0) break;                                  // end of stream
        if (c === 1) continue;                               // 64K segment boundary, no copy
        len = c + 1;
      }
    }
    for (; len > 0; len--) out.push(out[out.length + span]); // copy (handles RLE overlap)
  }
  return Buffer.from(out);
}

// CLI
const [, , inPath, outPath] = process.argv;
if (!inPath) { console.error('usage: node oracle/unlzexe.mjs <packed.exe> [out.bin]'); process.exit(2); }
const img = unlzexe(fs.readFileSync(inPath));
if (outPath) fs.writeFileSync(outPath, img);
console.log('decompressed load image:', img.length, 'bytes', outPath ? `-> ${outPath}` : '');
const t = img.toString('latin1');
console.log('sanity strings:', ['Wolfenstein', 'Episode', 'VSWAP'].map(s => s + (t.includes(s) ? '✓' : '✗')).join('  '));
