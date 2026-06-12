/**
 * dosfs.ts — the DOS file API the original calls through Borland's runtime
 * (open/read/write/lseek/close/filelength/unlink).
 *
 * The game data (*.WL6, CONFIG.WL6, saves) is mounted as in-memory byte
 * arrays: from `fetch()` in the browser, from node:fs in tests. Filenames
 * are case-insensitive like DOS.
 *
 * `read`/`write` move bytes between files and DOS memory (linear addresses,
 * see dosmem.ts). Two extra destination forms exist for the places the
 * original reads straight into data-segment globals:
 *   - a PtrCell        : a 4-byte little-endian long  (e.g. &chunkexplen)
 *   - a Uint16Array    : little-endian words          (e.g. &grhuffman)
 */

import { memb } from "./dosmem";
import type { PtrCell } from "./dosmem";

// open() flags — values irrelevant in the shim, kept so call sites mirror the C.
export const O_RDONLY = 0x0;
export const O_WRONLY = 0x1;
export const O_CREAT = 0x100;
export const O_BINARY = 0x8000;
export const O_TEXT = 0x4000;
export const S_IREAD = 0x100;
export const S_IWRITE = 0x80;
export const S_IFREG = 0x8000;

export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

// errno model (CA_FarRead/CA_FarWrite report failures through errno)
export const EINVFMT = 104;
export const ENOMEM = 8;
export const cerr = { errno: 0 };

interface DosFile {
  name: string;
  data: Uint8Array;
  pos: number;
  writable: boolean;
}

const volume = new Map<string, Uint8Array>();
const handles = new Map<number, DosFile>();
let nexthandle = 5; // 0-4 are DOS standard handles

/** Mount a file into the DOS volume (browser: after fetch; tests: from fs). */
export function dosfs_mount(name: string, data: Uint8Array): void {
  volume.set(name.toUpperCase(), data);
}

/** Drop everything (test isolation). */
export function dosfs_reset(): void {
  volume.clear();
  handles.clear();
  nexthandle = 5;
}

/** List mounted names (diagnostics). */
export function dosfs_names(): string[] {
  return [...volume.keys()];
}

/** Read back a (possibly written) file, or undefined. */
export function dosfs_file(name: string): Uint8Array | undefined {
  return volume.get(name.toUpperCase());
}

export function open(name: string, flags: number, _mode?: number): number {
  const key = name.toUpperCase();
  const creating = (flags & O_CREAT) !== 0;
  let data = volume.get(key);
  if (data === undefined) {
    if (!creating) return -1;
    data = new Uint8Array(0);
    volume.set(key, data);
  }
  const handle = nexthandle++;
  handles.set(handle, {
    name: key,
    data,
    pos: 0,
    writable: (flags & (O_WRONLY | O_CREAT)) !== 0,
  });
  return handle;
}

export function close(handle: number): number {
  return handles.delete(handle) ? 0 : -1;
}

export function unlink(name: string): number {
  return volume.delete(name.toUpperCase()) ? 0 : -1;
}

export function filelength(handle: number): number {
  const f = handles.get(handle);
  return f ? f.data.length : -1;
}

export function lseek(handle: number, offset: number, whence: number): number {
  const f = handles.get(handle);
  if (!f) return -1;
  if (whence === SEEK_SET) f.pos = offset;
  else if (whence === SEEK_CUR) f.pos += offset;
  else if (whence === SEEK_END) f.pos = f.data.length + offset;
  return f.pos;
}

/**
 * read(handle, dest, length) -> bytes read, or -1.
 * dest: linear DOS-memory address | PtrCell (4-byte long) | Uint16Array (LE words)
 */
export function read(
  handle: number,
  dest: number | PtrCell | Uint16Array,
  length: number,
): number {
  const f = handles.get(handle);
  if (!f) return -1;
  const avail = Math.max(0, Math.min(length, f.data.length - f.pos));
  const chunk = f.data.subarray(f.pos, f.pos + avail);
  f.pos += avail;

  if (typeof dest === "number") {
    memb.set(chunk, dest);
  } else if (dest instanceof Uint16Array) {
    for (let i = 0; i * 2 + 1 < avail; i++)
      dest[i] = chunk[i * 2] | (chunk[i * 2 + 1] << 8);
  } else {
    // 4-byte little-endian long into a scalar global
    let v = 0;
    for (let i = 0; i < Math.min(4, avail); i++) v |= chunk[i] << (8 * i);
    dest.set(v | 0);
  }
  return avail;
}

/** write(handle, src, length) -> bytes written, or -1. src: DOS address. */
export function write(handle: number, src: number, length: number): number {
  const f = handles.get(handle);
  if (!f || !f.writable) return -1;
  const chunk = memb.slice(src, src + length);
  const grown = new Uint8Array(Math.max(f.data.length, f.pos + length));
  grown.set(f.data, 0);
  grown.set(chunk, f.pos);
  f.data = grown;
  f.pos += length;
  volume.set(f.name, grown);
  return length;
}
