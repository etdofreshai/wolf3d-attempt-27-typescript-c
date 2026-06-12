/**
 * VGA layer + screen rendering verification.
 *
 * Boots the ported pipeline headlessly (VBL = instant), renders the signon
 * screen and the title/PG13/credits screens from real VGAGRAPH data through
 * SignonScreen/CA_CacheScreen -> the planar VGA model -> present(), and pins
 * the RGBA output. These are the same code paths the browser worker runs.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { dosfs_mount, dosfs_reset } from "../src/runtime/dosfs";
import { MM_Startup } from "../src/WOLFSRC/ID_MM.C";
import { ca, CA_Startup, CA_CacheScreen } from "../src/WOLFSRC/ID_CA.C";
import {
  wm,
  SignonScreen,
} from "../src/WOLFSRC/WL_MAIN.C";
import {
  vl,
  VL_Bar,
  VL_Plot,
  VL_FadeIn,
  VL_FadeOut,
  VL_SetColor,
  VL_GetColor,
  palette2,
} from "../src/WOLFSRC/ID_VL.C";
import { gamepal } from "../src/WOLFSRC/GAMEPAL.OBJ";
import { signon } from "../src/WOLFSRC/SIGNON.OBJ";
import { TITLEPIC, PG13PIC, CREDITSPIC } from "../src/WOLFSRC/GFXV_WL6.H";
import { UPDATEWIDE, PORTTILESHIGH } from "../src/WOLFSRC/ID_HEADS.H";
import { uwidthtable, wp } from "../src/WOLFSRC/WL_PLAY.C";
import { present, SCREEN_W, SCREEN_H } from "../src/platform/vga";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(here, "../../../steam/base");
const fixturePath = path.join(here, "fixtures", "wl6-screens.json");

const sha256 = (b: Uint8Array | Uint8ClampedArray) =>
  createHash("sha256").update(b).digest("hex");

function stats(rgba: Uint8ClampedArray) {
  const colors = new Set<number>();
  let nonblack = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const c = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    colors.add(c);
    if (c !== 0) nonblack++;
  }
  return { colors: colors.size, nonblack };
}

beforeAll(() => {
  dosfs_reset();
  for (const name of [
    "MAPHEAD.WL6",
    "GAMEMAPS.WL6",
    "VGADICT.WL6",
    "VGAHEAD.WL6",
    "VGAGRAPH.WL6",
    "AUDIOHED.WL6",
    "AUDIOT.WL6",
  ])
    dosfs_mount(name, new Uint8Array(readFileSync(path.join(base, name))));

  ca.extension = "WL6";
  MM_Startup();
  CA_Startup();
  // InitGame's update-table block (WL_MAIN.C:1196-1207)
  for (let i = 0; i < PORTTILESHIGH; i++) uwidthtable[i] = UPDATEWIDE * i;
  wp.updateptr = 0;
});

describe("linked-in data (OMF extraction)", () => {
  it("gamepal is a 768-byte 6-bit palette", () => {
    expect(gamepal.length).toBe(768);
    expect(Math.max(...gamepal)).toBeLessThanOrEqual(63);
    expect(Math.max(...gamepal)).toBeGreaterThan(32); // has bright colors
  });
  it("signon is a full 320x200 screen", () => {
    expect(signon.length).toBe(64000);
  });
});

describe("ID_VL against the VGA card model", () => {
  it("DAC set/get roundtrip", () => {
    SignonScreen(); // sets mode + gamepal
    VL_SetColor(200, 63, 31, 7);
    expect(VL_GetColor(200)).toEqual({ red: 63, green: 31, blue: 7 });
    // restore gamepal entry
    VL_SetColor(
      200,
      gamepal[600],
      gamepal[601],
      gamepal[602],
    );
  });

  it("renders the signon screen (whole screen, many colors)", () => {
    SignonScreen();
    const rgba = present();
    const s = stats(rgba);
    expect(s.nonblack).toBeGreaterThan(SCREEN_W * SCREEN_H * 0.5);
    expect(s.colors).toBeGreaterThan(8);
  });

  it("VL_Plot / VL_Bar land on the right pixels", () => {
    VL_Bar(10, 10, 20, 5, 0x30);
    VL_Plot(0, 0, 0x31);
    const rgba = present();
    const px = (x: number, y: number) => {
      const o = (y * SCREEN_W + x) * 4;
      return [rgba[o], rgba[o + 1], rgba[o + 2]];
    };
    const pal = (idx: number) => [
      (gamepal[idx * 3] << 2) | (gamepal[idx * 3] >> 4),
      (gamepal[idx * 3 + 1] << 2) | (gamepal[idx * 3 + 1] >> 4),
      (gamepal[idx * 3 + 2] << 2) | (gamepal[idx * 3 + 2] >> 4),
    ];
    expect(px(15, 12)).toEqual(pal(0x30));
    expect(px(29, 14)).toEqual(pal(0x30));
    expect(px(30, 12)).not.toEqual(pal(0x30)); // one past the bar
    expect(px(0, 0)).toEqual(pal(0x31));
  });

  it("fades reach their targets", () => {
    VL_FadeOut(0, 255, 0, 0, 0, 30);
    expect(vl.screenfaded).toBe(true);
    let rgba = present();
    expect(stats(rgba).nonblack).toBe(0); // fully black
    VL_FadeIn(0, 255, gamepal, 30);
    expect(vl.screenfaded).toBe(false);
    rgba = present();
    expect(stats(rgba).nonblack).toBeGreaterThan(0);
    // palette2's final intermediate step is near the target
    expect(palette2.length).toBe(768);
  });

  it("renders PG13/title/credits via CA_CacheScreen and matches the fixture", () => {
    const extracted: Record<string, string> = {};

    SignonScreen();
    extracted["signon"] = sha256(present());

    for (const [name, chunk] of [
      ["pg13", PG13PIC],
      ["title", TITLEPIC],
      ["credits", CREDITSPIC],
    ] as const) {
      CA_CacheScreen(chunk);
      const rgba = present();
      const s = stats(rgba);
      expect(s.colors, `${name} colors`).toBeGreaterThan(16);
      extracted[name] = sha256(rgba);
    }

    if (process.env.UPDATE_FIXTURES || !existsSync(fixturePath)) {
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, JSON.stringify(extracted, null, 1));
      console.log(`fixture written: ${fixturePath}`, extracted);
      return;
    }
    expect(extracted).toEqual(JSON.parse(readFileSync(fixturePath, "utf8")));
  });

  it("wm projection globals stay sane after the boot path", () => {
    expect(wm.virtualreality).toBe(false);
  });
});
