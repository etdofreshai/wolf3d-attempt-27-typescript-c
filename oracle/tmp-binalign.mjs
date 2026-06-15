// Parse ORTRACE.BIN (per-tic objlist dump, 150 actors x 60 bytes) and print
// player (slot 0) state for a record range, to align oracle tic index vs port command index.
import { readFile } from "node:fs/promises";
import path from "node:path";

const REC = 150 * 60;
const buf = new Uint8Array(await readFile(path.join(process.cwd(), "tmp/oracle-build/ORTRACE.BIN")));
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const nrec = buf.length / REC;
console.log("records:", nrec);

const lo = Number(process.argv[2] ?? "560");
const hi = Number(process.argv[3] ?? "570");
// objtype offsets
const O = { active: 0, ticcount: 2, obclass: 4, state: 6, flags: 8, distance: 10, dir: 14, x: 16, y: 20, tilex: 24, tiley: 26 };
const slotBase = (rec, slot) => rec * REC + slot * 60;
const u16 = (rec, slot, off) => dv.getUint16(slotBase(rec, slot) + off, true);
const i32 = (rec, slot, off) => dv.getInt32(slotBase(rec, slot) + off, true);

for (let r = lo; r <= hi && r < nrec; r++) {
  const x = i32(r, 0, O.x), y = i32(r, 0, O.y);
  console.log(`rec ${r}: player tile=${u16(r, 0, O.tilex)},${u16(r, 0, O.tiley)} x=${x} y=${y} ang? state=0x${u16(r,0,O.state).toString(16)} hp/active=${u16(r,0,O.active)}`);
}
