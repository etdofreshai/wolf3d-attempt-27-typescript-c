/**
 * VSWAP page-manager verification (PORTING.md §9 T1, requirement #2).
 *
 * Drives the ported ID_PM against the real VSWAP.WL6 and pins every page's
 * bytes in a SHA-256 fixture (walls / sprites / digitized sounds), plus the
 * header layout. Regenerate with UPDATE_FIXTURES=1 npm test.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { dosfs_mount, dosfs_reset } from "../src/runtime/dosfs";
import { memread } from "../src/runtime/dosmem";
import { MM_Startup } from "../src/WOLFSRC/ID_MM.C";
import {
  pm,
  PM_Startup,
  PM_GetPage,
  PM_GetPageAddress,
  PM_Preload,
  PM_SetPageLock,
} from "../src/WOLFSRC/ID_PM.C";
import { pml_Locked } from "../src/WOLFSRC/ID_PM.H";
import { DosQuit } from "../src/WOLFSRC/WL_MAIN.C";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(here, "../../../steam/base");
const fixturePath = path.join(here, "fixtures", "wl6-vswap.json");

const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

let vswapLen = 0;

beforeAll(() => {
  dosfs_reset();
  const data = new Uint8Array(readFileSync(path.join(base, "VSWAP.WL6")));
  dosfs_mount("VSWAP.WL6", data);
  vswapLen = data.length;

  MM_Startup();
  pm.PageFileName += "WL6"; // strcat(PageFileName,extension) — WL_MAIN CheckForEpisodes
  PM_Startup();
});

describe("ID_PM vs real VSWAP.WL6", () => {
  it("parses a sane header (walls < sprites < sounds < end)", () => {
    expect(pm.ChunksInFile).toBeGreaterThan(0);
    expect(pm.PMSpriteStart).toBeGreaterThan(0);
    expect(pm.PMSoundStart).toBeGreaterThan(pm.PMSpriteStart);
    expect(pm.ChunksInFile).toBeGreaterThan(pm.PMSoundStart);
    // every non-sparse page lies inside the file
    for (let i = 0; i < pm.ChunksInFile; i++) {
      const p = pm.PMPages[i];
      if (!p.offset) continue;
      expect(p.offset + p.length).toBeLessThanOrEqual(vswapLen);
    }
  });

  it("wall pages are full 64x64 textures (4096 bytes)", () => {
    for (let i = 0; i < pm.PMSpriteStart; i++) {
      const p = pm.PMPages[i];
      if (!p.offset) continue; // sparse
      expect(p.length, `wall page ${i}`).toBe(4096);
    }
  });

  it("PM_GetPage loads once and caches", () => {
    const a = PM_GetPage(0);
    expect(a).not.toBe(0);
    expect(PM_GetPage(0)).toBe(a);
    expect(PM_GetPageAddress(0)).toBe(a);
  });

  it("guards match the original (range, sparse, lock domain)", () => {
    expect(() => PM_GetPage(pm.ChunksInFile)).toThrow(DosQuit);
    expect(() => PM_SetPageLock(0, pml_Locked)).toThrow(
      /non-sound page/, // PM_SetPageLock: Locking/unlocking non-sound page
    );
    PM_SetPageLock(pm.PMSoundStart, pml_Locked); // sound pages are lockable
  });

  it("PM_Preload loads every non-sparse page and drives the callback", () => {
    let calls = 0;
    let lastCurrent = 0;
    PM_Preload((current, total) => {
      calls++;
      lastCurrent = current;
      expect(current).toBeLessThanOrEqual(total);
      return true;
    });
    for (let i = 0; i < pm.ChunksInFile; i++) {
      const p = pm.PMPages[i];
      if (!p.offset) continue;
      expect(p.mainPage, `page ${i} resident`).not.toBe(-1);
    }
    expect(calls).toBeGreaterThan(0);
    expect(lastCurrent).toBeGreaterThan(0);
  });

  it("matches the committed VSWAP page fixture bit-for-bit", () => {
    const extracted: Record<string, string | number> = {
      ChunksInFile: pm.ChunksInFile,
      PMSpriteStart: pm.PMSpriteStart,
      PMSoundStart: pm.PMSoundStart,
    };
    for (let i = 0; i < pm.ChunksInFile; i++) {
      const p = pm.PMPages[i];
      if (!p.offset) {
        extracted[`page${i}`] = "sparse";
        continue;
      }
      const addr = PM_GetPage(i);
      extracted[`page${i}`] = sha256(memread(addr, p.length));
    }

    if (process.env.UPDATE_FIXTURES || !existsSync(fixturePath)) {
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, JSON.stringify(extracted, null, 1));
      console.log(`fixture written: ${fixturePath}`);
      console.log(
        `VSWAP: ChunksInFile=${pm.ChunksInFile} PMSpriteStart=${pm.PMSpriteStart} PMSoundStart=${pm.PMSoundStart}`,
      );
      return;
    }
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
    expect(extracted).toEqual(fixture);
  });
});
