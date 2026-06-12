/**
 * ctypes.ts — C integer semantics for the Wolfenstein 3D port.
 *
 * PORTING.md §6.1: Borland C on 16-bit DOS has 16-bit `int`/`unsigned` and
 * 32-bit `long`. JS numbers are float64, so every arithmetic result the
 * original would have truncated MUST be truncated through these helpers.
 * Do not scatter ad-hoc `& 0xffff` — use this layer.
 *
 * Mapping:
 *   char / signed char          -> i8
 *   unsigned char (byte)        -> u8
 *   int / short                 -> i16
 *   unsigned / word             -> u16
 *   long / fixed                -> i32
 *   unsigned long / longword    -> u32
 */

/** signed char wrap */
export const i8 = (x: number): number => (x << 24) >> 24;
/** unsigned char wrap */
export const u8 = (x: number): number => x & 0xff;
/** 16-bit signed int wrap (Borland `int`) */
export const i16 = (x: number): number => (x << 16) >> 16;
/** 16-bit unsigned wrap (Borland `unsigned`) */
export const u16 = (x: number): number => x & 0xffff;
/** 32-bit signed wrap (Borland `long`) */
export const i32 = (x: number): number => x | 0;
/** 32-bit unsigned wrap (Borland `unsigned long`) */
export const u32 = (x: number): number => x >>> 0;

/**
 * C integer division: truncates toward zero (NOT Math.floor).
 * `idiv(-7, 2) === -3`, like Borland C, while `Math.floor(-7/2) === -4`.
 */
export const idiv = (a: number, b: number): number => Math.trunc(a / b);

/** C integer modulo: sign follows the dividend (matches Math.trunc division). */
export const imod = (a: number, b: number): number => a % b;

/**
 * 16-bit multiplies. Inputs are first wrapped to their C width, the product
 * computed exactly (max 0xffff*0xffff < 2^32, exact in float64), then wrapped.
 */
export const mul16 = (a: number, b: number): number => i16(i16(a) * i16(b));
export const mulu16 = (a: number, b: number): number => u16(u16(a) * u16(b));

/**
 * 32-bit multiply with C wraparound. Math.imul gives the exact low 32 bits.
 */
export const mul32 = (a: number, b: number): number => Math.imul(a, b);
export const mulu32 = (a: number, b: number): number => Math.imul(a, b) >>> 0;
