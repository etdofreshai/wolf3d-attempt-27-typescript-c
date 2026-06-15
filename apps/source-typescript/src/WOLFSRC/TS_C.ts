export type byte = number;
export type word = number;
export type longword = number;
export type fixed = number;
export type c_boolean = boolean;

export const BYTE_MIN = 0;
export const BYTE_MAX = 0xff;
export const WORD_MAX = 0xffff;
export const LONGWORD_MAX = 0xffffffff;

export function u8(value: number): byte {
  return value & BYTE_MAX;
}

export function i8(value: number): number {
  const coerced = u8(value);
  return coerced & 0x80 ? coerced - 0x100 : coerced;
}

export function u16(value: number): word {
  return value & WORD_MAX;
}

export function i16(value: number): number {
  const coerced = u16(value);
  return coerced & 0x8000 ? coerced - 0x10000 : coerced;
}

export function u32(value: number): longword {
  return value >>> 0;
}

export function i32(value: number): number {
  return value | 0;
}

export function imul16(a: number, b: number): number {
  return i16(Math.imul(i16(a), i16(b)));
}

export function cdiv(a: number, b: number): number {
  return i32(a / b);
}

export function cmod(a: number, b: number): number {
  return i32(a - cdiv(a, b) * b);
}

export function readU16LE(bytes: Uint8Array, offset: number): word {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function readI16LE(bytes: Uint8Array, offset: number): number {
  return i16(readU16LE(bytes, offset));
}

export function readU24LE(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
  return value === 0xffffff ? -1 : value;
}

export function readU32LE(bytes: Uint8Array, offset: number): longword {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

export function readI32LE(bytes: Uint8Array, offset: number): number {
  return readU32LE(bytes, offset) | 0;
}

export function writeU16LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

export function writeU32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}
