/**
 * dosmem.ts — the modeled DOS memory image (PORTING.md §6.3, §11#4).
 *
 * Wolf3D's pointer arithmetic and (eventually) byte-identical saves require
 * objects at stable addresses, so heap-resident data lives in one backing
 * ArrayBuffer ("DOS memory"). Pointers in the port are linear addresses
 * (plain numbers) into this buffer; structs are views at offsets.
 *
 * Divergences from real DOS, by design (documented; revisit in the
 * byte-identical-save milestone):
 *  - The buffer is 16 MiB instead of <1 MiB so the modeled memory manager
 *    never comes under pressure (purging never has to trigger). Addresses
 *    are still paragraph (16-byte) aligned like real MM blocks.
 *  - Where the original stores a `_seg` pointer (a 16-bit paragraph), the
 *    port stores the linear address. The data segment (DGROUP) image will be
 *    laid out at retail offsets when the save-layout fixture lands.
 */

export const MEMSIZE = 0x1000000; // 16 MiB

export const mem = new ArrayBuffer(MEMSIZE);
export const memb = new Uint8Array(mem);
export const memv = new DataView(mem);

// ---------------------------------------------------------------------------
// Little-endian peek/poke (x86 is little-endian; PORTING.md §6.5)
// ---------------------------------------------------------------------------

/** read byte (unsigned char) */
export const peekb = (addr: number): number => memb[addr];
/** write byte */
export const pokeb = (addr: number, v: number): void => {
  memb[addr] = v;
};
/** read 16-bit unsigned (C `unsigned`) */
export const peekw = (addr: number): number => memv.getUint16(addr, true);
/** read 16-bit signed (C `int`) */
export const peekws = (addr: number): number => memv.getInt16(addr, true);
/** write 16-bit word */
export const pokew = (addr: number, v: number): void =>
  memv.setUint16(addr, v & 0xffff, true);
/** read 32-bit signed (C `long`) */
export const peekl = (addr: number): number => memv.getInt32(addr, true);
/** read 32-bit unsigned (C `unsigned long`) */
export const peekul = (addr: number): number => memv.getUint32(addr, true);
/** write 32-bit long */
export const pokel = (addr: number, v: number): void =>
  memv.setInt32(addr, v | 0, true);

/** read a fixed-size C char[] field as a string (stops at NUL) */
export function peekstr(addr: number, maxlen: number): string {
  let s = "";
  for (let i = 0; i < maxlen; i++) {
    const c = memb[addr + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/** copy bytes into DOS memory */
export function memwrite(addr: number, src: Uint8Array): void {
  memb.set(src, addr);
}

/** copy bytes out of DOS memory */
export function memread(addr: number, length: number): Uint8Array {
  return memb.slice(addr, addr + length);
}

// ---------------------------------------------------------------------------
// Pointer cells — the port's `memptr *baseptr`
// ---------------------------------------------------------------------------
//
// The memory manager identifies blocks by the ADDRESS OF THE OWNING POINTER
// VARIABLE (`useptr` in ID_MM.C), and writes the allocated segment back
// through it. JS has no address-of, so a PtrCell carries a stable
// (owner, key) identity — two cells made from the same variable compare
// equal, exactly like two `&grsegs[chunk]` expressions in C.

export interface PtrCell {
  /** identity: the object holding the pointer variable */
  readonly owner: object;
  /** identity: the property/index of the pointer variable */
  readonly key: PropertyKey;
  get(): number;
  set(v: number): void;
}

/** `ref(obj, "field")` / `ref(array, index)` — the port's `&obj.field`. */
export function ref(owner: object, key: PropertyKey): PtrCell {
  return {
    owner,
    key,
    get: () => (owner as Record<PropertyKey, number>)[key as never],
    set: (v: number) => {
      (owner as Record<PropertyKey, number>)[key as never] = v;
    },
  };
}

/** A function-local `memptr` variable (C stack local used with `&local`). */
export function lvar(initial = 0): PtrCell {
  const box = { v: initial };
  return ref(box, "v");
}

/** `useptr` equality — same pointer variable? */
export function sameCell(a: PtrCell, b: PtrCell): boolean {
  return a.owner === b.owner && a.key === b.key;
}
