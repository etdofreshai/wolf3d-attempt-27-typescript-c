/**
 * Determinism prerequisites (PORTING.md §4): the fixed-point trig/projection
 * tables and Carmack's table-driven RNG.
 *
 * - rndtable/US_RndT: ground truth is the table in ID_US_A.ASM itself.
 * - sintable/finetangent/pixelangle: generated with the exact C arithmetic
 *   (float stores via fround, double trig, truncate-toward-zero on fixed
 *   conversion). Structural identities are asserted here; exact values are
 *   pinned in a fixture for regression and for the future oracle cross-check
 *   (the original generates these at startup with Borland's float libm —
 *   any last-ulp divergence will surface in the T2 oracle comparison).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  wm,
  BuildTables,
  CalcProjection,
  FOCALLENGTH,
  radtoint,
} from "../src/WOLFSRC/WL_MAIN.C";
import {
  sintable,
  costable,
  finetangent,
  pixelangle,
} from "../src/WOLFSRC/WL_DRAW.C";
import { ANGLES, FINEANGLES } from "../src/WOLFSRC/WL_DEF.H";
import { us_a, rndtable, US_InitRndT, US_RndT } from "../src/WOLFSRC/ID_US_A.ASM";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "fixtures", "wl6-tables.json");
const sha256 = (b: Uint8Array) =>
  createHash("sha256").update(b).digest("hex");

beforeAll(() => {
  BuildTables();
  wm.viewwidth = 304; // viewsize 19 — the classic large view window
  wm.viewheight = 152;
  CalcProjection(FOCALLENGTH);
});

describe("US_RndT (Carmack's table-driven RNG)", () => {
  it("has the canonical 256-entry table", () => {
    expect(rndtable.length).toBe(256);
    expect(rndtable[0]).toBe(0);
    expect(rndtable[1]).toBe(8);
    expect(rndtable[255]).toBe(249);
  });

  it("US_InitRndT(false) gives the deterministic sequence", () => {
    US_InitRndT(false);
    expect(us_a.rndindex).toBe(0);
    expect(US_RndT()).toBe(8); // rndtable[1]
    expect(US_RndT()).toBe(109); // rndtable[2]
    expect(US_RndT()).toBe(220);
    expect(US_RndT()).toBe(222);
    expect(US_RndT()).toBe(241);
  });

  it("wraps the index at 256 like the asm (and bx,0ffh)", () => {
    US_InitRndT(false);
    for (let i = 0; i < 255; i++) US_RndT();
    expect(us_a.rndindex).toBe(255);
    expect(US_RndT()).toBe(rndtable[0]); // index wraps to 0
    expect(us_a.rndindex).toBe(0);
  });
});

describe("BuildTables (sintable/costable/finetangent)", () => {
  it("radtoint matches the float constant", () => {
    expect(radtoint).toBe(Math.fround(FINEANGLES / 2 / 3.141592657));
  });

  it("sintable has the sign-bit fixed-point format", () => {
    expect(sintable[0]).toBe(0);
    // sin(90°) lands at 65535, NOT 65536: `angle` is a float accumulated in
    // 90 steps of fround(PI/2/90), which never hits pi/2 exactly, so
    // sin(angle) < 1.0 and the truncation gives 0.99998... in 16.16.
    // The original's float accumulation behaves identically — the table
    // never contains an exact 1.0.
    expect(sintable[90]).toBe(65535);
    expect(sintable[180] | 0).toBe(0x80000000 | 0); // negative zero (sign bit)
    expect(sintable[270]).toBe((65535 | 0x80000000) | 0);
    expect(sintable[360] | 0).toBe(0x80000000 | 0);
  });

  it("preserves the original one-past-the-end write (sintable[450])", () => {
    expect(sintable.length).toBe(ANGLES + ANGLES / 4 + 1);
    expect(sintable[450]).toBe(65535); // i=90: sintable[i+ANGLES]
  });

  it("costable overlays sintable with quarter phase shift", () => {
    expect(costable[0]).toBe(sintable[90]);
    expect(costable[270]).toBe(sintable[360]);
    for (let a = 0; a < ANGLES; a++) expect(costable[a]).toBe(sintable[a + 90]);
  });

  it("finetangent is positive and strictly increasing", () => {
    expect(finetangent[0]).toBeGreaterThan(0);
    for (let i = 1; i < FINEANGLES / 4; i++)
      expect(finetangent[i]).toBeGreaterThan(finetangent[i - 1]);
  });
});

describe("CalcProjection (viewwidth 304)", () => {
  it("computes the known projection constants", () => {
    // scale = trunc(152 * (0x5700+0x5800) / 0x8000) = trunc(207.8125)
    expect(wm.scale).toBe(207);
    // heightnumerator = (TILEGLOBAL*scale)>>6
    expect(wm.heightnumerator).toBe((65536 * 207) >> 6);
    expect(wm.minheightdiv).toBe(Math.trunc(wm.heightnumerator / 0x7fff) + 1);
  });

  it("pixelangle is antisymmetric about the view center", () => {
    const halfview = wm.viewwidth / 2;
    for (let i = 0; i < halfview; i++)
      expect(pixelangle[halfview - 1 - i]).toBe(-pixelangle[halfview + i] | 0);
    expect(pixelangle[0]).toBeGreaterThan(0);
  });

  it("maxslope derives from the edge ray", () => {
    expect(wm.maxslope).toBe(finetangent[pixelangle[0]] >> 8);
  });

  it("matches the committed table fixture bit-for-bit", () => {
    const extracted: Record<string, string | number> = {
      sintable: sha256(new Uint8Array(sintable.buffer.slice(0))),
      finetangent: sha256(new Uint8Array(finetangent.buffer.slice(0))),
      pixelangle_304: sha256(new Uint8Array(pixelangle.buffer.slice(0))),
      scale: wm.scale,
      heightnumerator: wm.heightnumerator,
      minheightdiv: wm.minheightdiv,
      maxslope: wm.maxslope,
      pixelangle0: pixelangle[0],
      finetangent0: finetangent[0],
      finetangent899: finetangent[899],
      sintable45: sintable[45],
    };

    if (process.env.UPDATE_FIXTURES || !existsSync(fixturePath)) {
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, JSON.stringify(extracted, null, 1));
      console.log(`fixture written: ${fixturePath}`);
      console.log(extracted);
      return;
    }
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
    expect(extracted).toEqual(fixture);
  });
});
