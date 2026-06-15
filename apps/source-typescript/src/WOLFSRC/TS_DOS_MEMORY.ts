import { readI16LE, readI32LE, readU16LE, readU32LE, writeU16LE, writeU32LE } from "./TS_C";

export class DOSMemory {
  readonly buffer: ArrayBuffer;
  readonly bytes: Uint8Array;

  constructor(sizeOrBytes: number | ArrayBuffer | Uint8Array) {
    if (typeof sizeOrBytes === "number") {
      this.buffer = new ArrayBuffer(sizeOrBytes);
      this.bytes = new Uint8Array(this.buffer);
      return;
    }

    if (sizeOrBytes instanceof Uint8Array) {
      this.buffer = new ArrayBuffer(sizeOrBytes.byteLength);
      this.bytes = new Uint8Array(this.buffer);
      this.bytes.set(sizeOrBytes);
      return;
    }

    this.buffer = sizeOrBytes.slice(0);
    this.bytes = new Uint8Array(this.buffer);
  }

  u8(offset: number): number {
    this.checkRange(offset, 1);
    return this.bytes[offset];
  }

  setU8(offset: number, value: number): void {
    this.checkRange(offset, 1);
    this.bytes[offset] = value & 0xff;
  }

  u16(offset: number): number {
    this.checkRange(offset, 2);
    return readU16LE(this.bytes, offset);
  }

  i16(offset: number): number {
    this.checkRange(offset, 2);
    return readI16LE(this.bytes, offset);
  }

  setU16(offset: number, value: number): void {
    this.checkRange(offset, 2);
    writeU16LE(this.bytes, offset, value);
  }

  u32(offset: number): number {
    this.checkRange(offset, 4);
    return readU32LE(this.bytes, offset);
  }

  i32(offset: number): number {
    this.checkRange(offset, 4);
    return readI32LE(this.bytes, offset);
  }

  setU32(offset: number, value: number): void {
    this.checkRange(offset, 4);
    writeU32LE(this.bytes, offset, value);
  }

  view(offset: number, length: number): Uint8Array {
    this.checkRange(offset, length);
    return this.bytes.subarray(offset, offset + length);
  }

  copyInto(offset: number, source: Uint8Array): void {
    this.checkRange(offset, source.length);
    this.bytes.set(source, offset);
  }

  private checkRange(offset: number, length: number): void {
    if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0) {
      throw new RangeError(`Invalid DOS memory range ${offset}+${length}`);
    }
    if (offset + length > this.bytes.length) {
      throw new RangeError(
        `DOS memory range ${offset}+${length} exceeds ${this.bytes.length} bytes`,
      );
    }
  }
}
