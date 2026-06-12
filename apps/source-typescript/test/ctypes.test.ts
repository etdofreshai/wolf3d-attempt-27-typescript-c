import { describe, it, expect } from "vitest";
import {
  i8,
  u8,
  i16,
  u16,
  i32,
  u32,
  idiv,
  mul16,
  mulu16,
  mul32,
  mulu32,
} from "../src/runtime/ctypes";

describe("C integer semantics (PORTING.md §6.1)", () => {
  it("wraps 16-bit signed like Borland int", () => {
    expect(i16(0x7fff)).toBe(32767);
    expect(i16(0x8000)).toBe(-32768);
    expect(i16(0xffff)).toBe(-1);
    expect(i16(0x10000)).toBe(0);
    expect(i16(32767 + 1)).toBe(-32768); // classic overflow
  });

  it("wraps 16-bit unsigned", () => {
    expect(u16(-1)).toBe(0xffff);
    expect(u16(0x12345)).toBe(0x2345);
    expect(u16(65535 + 1)).toBe(0);
  });

  it("wraps 8-bit", () => {
    expect(u8(256)).toBe(0);
    expect(u8(-1)).toBe(255);
    expect(i8(128)).toBe(-128);
    expect(i8(255)).toBe(-1);
  });

  it("wraps 32-bit", () => {
    expect(i32(0x7fffffff + 1)).toBe(-2147483648);
    expect(u32(-1)).toBe(0xffffffff);
  });

  it("divides like C (truncation toward zero, not floor)", () => {
    expect(idiv(7, 2)).toBe(3);
    expect(idiv(-7, 2)).toBe(-3); // Math.floor would give -4
    expect(idiv(7, -2)).toBe(-3);
    expect(idiv(-7, -2)).toBe(3);
  });

  it("multiplies with C wraparound", () => {
    expect(mul16(300, 300)).toBe(i16(90000)); // 90000 wraps in 16-bit
    expect(mul16(300, 300)).toBe(24464);
    expect(mulu16(0x8000, 2)).toBe(0);
    expect(mul32(0x10000, 0x10000)).toBe(0);
    expect(mulu32(0xffffffff, 2)).toBe(0xfffffffe);
  });
});
