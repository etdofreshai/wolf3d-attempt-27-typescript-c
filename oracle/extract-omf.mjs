#!/usr/bin/env node
/**
 * extract-omf.mjs — pull the raw data payload out of an Intel-OMF object
 * file (Borland .OBJ). Used for the two linked-data objects in WOLFSRC/OBJ
 * that cannot be produced from C source:
 *
 *   GAMEPAL.OBJ  -> the 768-byte VGA palette (gamepal)
 *   SIGNON.OBJ   -> the 64000-byte signon screen (signon / introscn)
 *
 * OMF records: [type:1][len:2 LE][payload:len-1][checksum:1]
 *   LEDATA (0xA0): [segment index:1..2][data offset:2 LE][bytes...]
 *   LIDATA (0xA2): repeated blocks — not used by these objects (we error).
 *
 * Usage: node oracle/extract-omf.mjs <in.obj> <out.bin|out.ts> [exportName]
 *   .ts output writes a base64-embedded module with the given export name.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath, exportName] = process.argv;
if (!inPath || !outPath) {
  console.error(
    "usage: node extract-omf.mjs <in.obj> <out.bin|out.ts> [exportName]",
  );
  process.exit(1);
}

const obj = readFileSync(inPath);
const chunks = []; // {offset, bytes}
let pos = 0;
let maxEnd = 0;

while (pos + 3 <= obj.length) {
  const type = obj[pos];
  const len = obj.readUInt16LE(pos + 1);
  const payload = obj.subarray(pos + 3, pos + 3 + len - 1); // sans checksum
  if (type === 0xa0) {
    // LEDATA: segment index (OMF "index" encoding: 1 byte if < 0x80)
    let p = 0;
    p += payload[0] < 0x80 ? 1 : 2;
    const offset = payload.readUInt16LE(p);
    p += 2;
    const bytes = payload.subarray(p);
    chunks.push({ offset, bytes });
    maxEnd = Math.max(maxEnd, offset + bytes.length);
  } else if (type === 0xa2) {
    console.error("LIDATA records not supported (none expected here)");
    process.exit(1);
  }
  pos += 3 + len;
}

const data = Buffer.alloc(maxEnd);
for (const { offset, bytes } of chunks) bytes.copy(data, offset);
console.log(`${inPath}: ${chunks.length} LEDATA records, ${maxEnd} bytes`);

if (outPath.endsWith(".ts")) {
  const name = exportName ?? "data";
  const b64 = data.toString("base64");
  const src = `// GENERATED from ${inPath.replace(/\\/g, "/")} by oracle/extract-omf.mjs — do not edit.
//
// The original links this object's data segment directly into the EXE
// (no C source exists for it). The port embeds the identical bytes.

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const ${name}: Uint8Array = /* ${maxEnd} bytes */ b64ToBytes(
  "${b64}",
);
`;
  writeFileSync(outPath, src);
} else {
  writeFileSync(outPath, data);
}
console.log(`wrote ${outPath}`);
