/**
 * T1 asset-extraction verification (PORTING.md §9 T1).
 *
 * Drives the ported ID_CA against the real registered-WL6 data in
 * steam/base/ and verifies:
 *  - structural ground truths (RLEW tag, table sizes, pic dimensions,
 *    64x64 maps, exactly one player start per map),
 *  - and a committed SHA-256 fixture over every extracted artifact
 *    (all 60 maps x 2 planes, every graphics chunk, every audio chunk),
 *    so any future change to the decompression path is caught bit-exactly.
 *    The fixture also becomes the comparison point for the DOS oracle's
 *    own extraction (PORTING.md §8).
 *
 * Regenerate the fixture with:  UPDATE_FIXTURES=1 npm test
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { dosfs_mount, dosfs_reset } from "../src/runtime/dosfs";
import { memread, peekw, peekl } from "../src/runtime/dosmem";
import { MM_Startup } from "../src/WOLFSRC/ID_MM.C";
import {
  ca,
  CA_Startup,
  CA_CacheMap,
  CA_CacheGrChunk,
  CA_CacheAudioChunk,
  GRFILEPOS,
} from "../src/WOLFSRC/ID_CA.C";
import { NUMMAPS, maptype } from "../src/WOLFSRC/ID_CA.H";
import {
  NUMCHUNKS,
  NUMTILE8,
  STARTTILE8,
  STARTTILE8M,
  STARTTILE16,
  STARTTILE16M,
  STARTTILE32,
  STARTTILE32M,
  STARTEXTERNS,
  STARTPICS,
  TITLEPIC,
  STATUSBARPIC,
  T_DEMO0,
  T_DEMO3,
} from "../src/WOLFSRC/GFXV_WL6.H";
import { NUMSNDCHUNKS } from "../src/WOLFSRC/AUDIOWL6.H";
import { vh } from "../src/WOLFSRC/ID_VH.C";
import { pictabletype } from "../src/WOLFSRC/ID_VH.H";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(here, "../../../steam/base");
const fixturePath = path.join(here, "fixtures", "wl6-extraction.json");

const WL6_FILES = [
  "MAPHEAD.WL6",
  "GAMEMAPS.WL6",
  "VGADICT.WL6",
  "VGAHEAD.WL6",
  "VGAGRAPH.WL6",
  "AUDIOHED.WL6",
  "AUDIOT.WL6",
];

const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

let vgagraphLen = 0;
let audiotLen = 0;

beforeAll(() => {
  dosfs_reset();
  for (const name of WL6_FILES) {
    const data = new Uint8Array(readFileSync(path.join(base, name)));
    dosfs_mount(name, data);
    if (name === "VGAGRAPH.WL6") vgagraphLen = data.length;
    if (name === "AUDIOT.WL6") audiotLen = data.length;
  }

  MM_Startup();
  ca.extension = "WL6"; // what WL_MAIN's CheckForEpisodes sets for registered six-episode data
  CA_Startup();
});

/** expanded length of a graphics chunk, per CAL_ExpandGrChunk's rules */
function grExpandedLength(chunk: number): number {
  const BLOCK = 64,
    MASKBLOCK = 128;
  if (chunk >= STARTTILE8 && chunk < STARTEXTERNS) {
    if (chunk < STARTTILE8M) return BLOCK * NUMTILE8;
    else if (chunk < STARTTILE16) return MASKBLOCK * 0;
    else if (chunk < STARTTILE16M) return BLOCK * 4;
    else if (chunk < STARTTILE32) return MASKBLOCK * 4;
    else if (chunk < STARTTILE32M) return BLOCK * 16;
    else return MASKBLOCK * 16;
  }
  // explicit longword at the start of the compressed chunk
  const raw = readFileSync(path.join(base, "VGAGRAPH.WL6"));
  return raw.readInt32LE(GRFILEPOS(chunk));
}

describe("ID_CA vs real WL6 data", () => {
  it("reads the map file header (RLEW tag, all 60 maps present, 64x64)", () => {
    expect(peekw(ca.tinf)).toBe(0xabcd); // RLEWtag
    for (let i = 0; i < NUMMAPS; i++) {
      expect(ca.mapheaderseg[i]).not.toBe(0);
      const hdr = maptype.at(ca.mapheaderseg[i]);
      expect(hdr.width).toBe(64);
      expect(hdr.height).toBe(64);
      expect(hdr.name.length).toBeGreaterThan(0);
    }
    expect(maptype.at(ca.mapheaderseg[0]).name).toMatch(/^Wolf1/);
  });

  it("grstarts covers the whole VGAGRAPH file", () => {
    expect(GRFILEPOS(NUMCHUNKS)).toBe(vgagraphLen);
  });

  it("audiostarts covers the whole AUDIOT file", () => {
    expect(peekl(ca.audiostarts + NUMSNDCHUNKS * 4)).toBe(audiotLen);
  });

  it("expands STRUCTPIC into pictable with known dimensions", () => {
    const title = pictabletype.at(vh.pictable + (TITLEPIC - STARTPICS) * 4);
    expect(title.width).toBe(320);
    expect(title.height).toBe(200);
    const statusbar = pictabletype.at(
      vh.pictable + (STATUSBARPIC - STARTPICS) * 4,
    );
    expect(statusbar.width).toBe(320);
    expect(statusbar.height).toBe(40);
  });

  it("caches every map; each has exactly one player start", () => {
    for (let m = 0; m < NUMMAPS; m++) {
      CA_CacheMap(m);
      let starts = 0;
      for (let i = 0; i < 64 * 64; i++) {
        const obj = peekw(ca.mapsegs[1] + i * 2);
        if (obj >= 19 && obj <= 22) starts++; // player start N/E/S/W
      }
      expect(starts, `map ${m} player starts`).toBe(1);
    }
  });

  it("caches every graphics chunk (incl. the four demos)", () => {
    for (let chunk = 0; chunk < NUMCHUNKS; chunk++) {
      if (GRFILEPOS(chunk) === -1) continue; // sparse
      CA_CacheGrChunk(chunk);
      expect(ca.grsegs[chunk], `grsegs[${chunk}]`).not.toBe(0);
    }
    for (let demo = T_DEMO0; demo <= T_DEMO3; demo++) {
      expect(ca.grsegs[demo], `demo chunk ${demo}`).not.toBe(0);
      expect(grExpandedLength(demo)).toBeGreaterThan(100);
    }
  });

  it("caches every audio chunk", () => {
    for (let chunk = 0; chunk < NUMSNDCHUNKS; chunk++) {
      CA_CacheAudioChunk(chunk);
      expect(ca.audiosegs[chunk], `audiosegs[${chunk}]`).not.toBe(0);
    }
  });

  it("matches the committed extraction fixture bit-for-bit", () => {
    const extracted: Record<string, string> = {};

    for (let m = 0; m < NUMMAPS; m++) {
      CA_CacheMap(m);
      extracted[`map${m}.plane0`] = sha256(memread(ca.mapsegs[0], 64 * 64 * 2));
      extracted[`map${m}.plane1`] = sha256(memread(ca.mapsegs[1], 64 * 64 * 2));
      extracted[`map${m}.name`] = maptype.at(ca.mapheaderseg[m]).name;
    }

    for (let chunk = 0; chunk < NUMCHUNKS; chunk++) {
      if (GRFILEPOS(chunk) === -1) continue;
      const len = grExpandedLength(chunk);
      extracted[`gr${chunk}`] = sha256(memread(ca.grsegs[chunk], len));
    }

    for (let chunk = 0; chunk < NUMSNDCHUNKS; chunk++) {
      const len =
        peekl(ca.audiostarts + (chunk + 1) * 4) -
        peekl(ca.audiostarts + chunk * 4);
      extracted[`audio${chunk}`] = sha256(memread(ca.audiosegs[chunk], len));
    }

    if (process.env.UPDATE_FIXTURES || !existsSync(fixturePath)) {
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, JSON.stringify(extracted, null, 1));
      console.log(`fixture written: ${fixturePath}`);
      return;
    }
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
    expect(extracted).toEqual(fixture);
  });
});
