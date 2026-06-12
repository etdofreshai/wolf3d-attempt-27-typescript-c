/**
 * worker.ts — the game thread.
 *
 * The original is a synchronous DOS program; to keep every ported function
 * synchronous (1:1 with the C), the game runs in a Web Worker and BLOCKS on
 * the 70 Hz vertical-blank tick via Atomics.wait. The main thread owns the
 * canvas: it bumps the VBL counter, notifies, and blits the latest frame.
 *
 * The worker SELF-PACES at 70 Hz (Atomics.wait with a timeout against
 * performance.now bookkeeping) — worker threads are not throttled by page
 * visibility, so the game keeps real time even when the tab is hidden.
 *
 * Shared memory protocol (host <-> worker):
 *   ctl[0] : reserved (input events come in a later milestone)
 *   ctl[1] : frame-dirty flag (worker sets after writing fb)
 *   fb     : 320*200*4 RGBA, written by the worker on every VBL
 */

import { dosfs_mount } from "../runtime/dosfs";
import { MM_Startup } from "../WOLFSRC/ID_MM.C";
import { ca, CA_Startup, CA_CacheScreen } from "../WOLFSRC/ID_CA.C";
import { pm, PM_Startup } from "../WOLFSRC/ID_PM.C";
import {
  wm,
  SignonScreen,
  BuildTables,
  CalcProjection,
  FOCALLENGTH,
  DosQuit,
} from "../WOLFSRC/WL_MAIN.C";
import { VL_FadeIn, VL_FadeOut, VL_WaitVBL } from "../WOLFSRC/ID_VL.C";
import { gamepal } from "../WOLFSRC/GAMEPAL.OBJ";
import { TITLEPIC, CREDITSPIC, PG13PIC } from "../WOLFSRC/GFXV_WL6.H";
import { UPDATEWIDE, PORTTILESHIGH } from "../WOLFSRC/ID_HEADS.H";
import { uwidthtable, wp } from "../WOLFSRC/WL_PLAY.C";
import { setVBLHandler, present, SCREEN_W, SCREEN_H } from "./vga";

interface BootMessage {
  files: Record<string, ArrayBuffer>;
  ctl: SharedArrayBuffer;
  fb: SharedArrayBuffer;
}

onmessage = (e: MessageEvent<BootMessage>) => {
  const ctl = new Int32Array(e.data.ctl);
  const fb = new Uint8Array(e.data.fb);
  const rgba = new Uint8ClampedArray(SCREEN_W * SCREEN_H * 4);

  // VL_WaitVBL blocks here: render the current frame, then sleep until the
  // next self-paced 70 Hz tick.
  let nextTick = 0;
  setVBLHandler((vbls: number) => {
    for (let i = 0; i < vbls; i++) {
      present(rgba);
      fb.set(rgba);
      Atomics.store(ctl, 1, 1);

      const now = performance.now();
      if (nextTick === 0) nextTick = now;
      nextTick += 1000 / 70;
      const delay = nextTick - now;
      if (delay > 0)
        Atomics.wait(ctl, 0, Atomics.load(ctl, 0), delay); // timed sleep
      else if (delay < -250) nextTick = now; // fell badly behind — resync
    }
  });

  for (const [name, buf] of Object.entries(e.data.files))
    dosfs_mount(name, new Uint8Array(buf));

  try {
    boot();
  } catch (err) {
    if (err instanceof DosQuit) {
      postMessage({ quit: err.message });
      return;
    }
    throw err;
  }
};

/**
 * Interim boot: the original main() -> InitGame() -> DemoLoop() chain, cut
 * down to what is ported so far (signon + title/credits attract loop, real
 * data, real fades). Replaced by the faithful main() as WL_MAIN's port
 * completes. Comments reference the original lines being mirrored.
 */
function boot(): void {
  // CheckForEpisodes: registered six-episode data
  ca.extension = "WL6";
  pm.PageFileName += "WL6"; // strcat(PageFileName,extension)

  // InitGame startup order (WL_MAIN.C): MM, SignonScreen, VW(VL), CA, PM ...
  MM_Startup();
  SignonScreen();
  CA_Startup();
  PM_Startup();

  // InitGame's "build some tables" block (WL_MAIN.C:1196-1207)
  for (let i = 0; i < PORTTILESHIGH; i++) uwidthtable[i] = UPDATEWIDE * i;
  wp.updateptr = 0; // updateptr = &update[0];

  BuildTables();
  wm.viewwidth = 304;
  wm.viewheight = 152;
  CalcProjection(FOCALLENGTH);

  // hold the signon screen (FinishSignon waits for a key; interim: ~3s)
  VL_WaitVBL(3 * 70);

  // DemoLoop's attract sequence (PG13 -> title -> credits, looping)
  VL_FadeOut(0, 255, 0, 0, 0, 30);
  CA_CacheScreen(PG13PIC);
  VL_FadeIn(0, 255, gamepal, 30);
  VL_WaitVBL(3 * 70);

  for (;;) {
    VL_FadeOut(0, 255, 0, 0, 0, 30);
    CA_CacheScreen(TITLEPIC);
    VL_FadeIn(0, 255, gamepal, 30);
    VL_WaitVBL(15 * 70); // IN_UserInput(TickBase*15)

    VL_FadeOut(0, 255, 0, 0, 0, 30);
    CA_CacheScreen(CREDITSPIC);
    VL_FadeIn(0, 255, gamepal, 30);
    VL_WaitVBL(10 * 70); // IN_UserInput(TickBase*10)
  }
}
