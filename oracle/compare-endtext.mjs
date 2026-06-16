// Gate the per-episode end-of-game story article (WL_TEXT.C EndText/ShowArticle) that main.ts now
// shows on victory. Loads the REAL ENDART chunk from VGAGRAPH (not a synthetic article), lays it
// out through the exact path main.ts uses (CacheLayoutGraphics → cache marked chunks → ShowArticle),
// and asserts every episode's ending renders multiple pages of real content (the help-window frame
// + text/graphics) without throwing — i.e. the article markup is handled.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-endtext-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_CacheGrChunk, grsegs } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export * as WL_MAIN from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { EndText, HelpScreens, ShowArticle, CacheLayoutGraphics } from "${rel(path.join(targetDir, "WL_TEXT.C.ts"))}";`,
  `export { VWB_Bar, VWB_DrawPic, VWB_DrawPropString, VW_SetFontState } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { STRUCTPIC, STARTFONT } from "${rel(path.join(targetDir, "TS_WL6_ASSETS.ts"))}";`,
  `export { videoPlanes, displayofs, linewidth, VL_ResetVideoState, VL_SetVGAPlaneMode, VL_SetBufferOffset, VL_SetScreen } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const M = mod.WL_MAIN;

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) {
  files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
}
const GAMEPAL = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));
mod.CA_Startup(files);
M.gamepal.set(GAMEPAL.subarray(0x77, 0x77 + 768));
mod.CA_CacheGrChunk(mod.STRUCTPIC);
mod.CA_CacheGrChunk(mod.STARTFONT);
mod.CA_CacheGrChunk(mod.STARTFONT + 1);

mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
mod.VL_SetBufferOffset(0);
mod.VL_SetScreen(0, 0);

const W = 320, H = 200, VIDEO_PLANE_BYTES = 0x10000, VGA_PAGE_BYTES = 80 * 208;
function deplanarStats() {
  const display = Math.trunc((mod.displayofs & 0xffff) / VGA_PAGE_BYTES) * VGA_PAGE_BYTES;
  const stride = (mod.linewidth & 0xffff) || 80;
  const colors = new Set(); let nonZero = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = mod.videoPlanes[(x & 3) * VIDEO_PLANE_BYTES + (((display + y * stride) & 0xffff) + (x >> 2)) & 0xffff] ?? 0;
    colors.add(v); if (v !== 0) nonZero++;
  }
  return { colors: colors.size, nonZero };
}

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// Execute a page's computed draw operations (mirrors main.ts executeTextOperations).
function executeOps(ops, pictable) {
  for (const op of ops) {
    if (op.type === "bar") mod.VWB_Bar(op.x, op.y, op.width, op.height, op.color);
    else if (op.type === "pic") mod.VWB_DrawPic(op.x, op.y, op.pic, { source: mod.grsegs[op.pic] ?? undefined, pictable });
    else if (op.type === "word") { mod.VW_SetFontState({ fontnumber: 0, fontcolor: op.color, px: op.x, py: op.y }); mod.VWB_DrawPropString(op.word); }
    else if (op.type === "page-number") { mod.VW_SetFontState({ fontnumber: 0, fontcolor: op.color, px: op.x, py: op.y }); mod.VWB_DrawPropString(op.text); }
  }
}
const pictable = mod.grsegs[mod.STRUCTPIC];

// Render the ending article for all 6 WL6 episodes the way main.ts.showEndText does.
for (let episode = 0; episode < 6; episode++) {
  const info = mod.EndText({ episode });
  let threw = null, pages = 0;
  try {
    const bytes = mod.CA_CacheGrChunk(info.chunkOrFile);
    let article = "";
    for (let i = 0; i < bytes.length; i++) article += String.fromCharCode(bytes[i]);
    const layout = mod.CacheLayoutGraphics(article);
    for (const chunk of layout.marked) mod.CA_CacheGrChunk(chunk);
    pages = layout.pages;
    // render page 1 (renderAll up to maxPages, exactly as main.ts renderEndTextPage)
    mod.VL_SetBufferOffset(0);
    const shown = mod.ShowArticle({ article, renderAll: true, maxPages: 1 });
    executeOps(shown.pages[shown.pages.length - 1].operations, pictable);
  } catch (e) {
    threw = e;
  }
  if (threw) { expect(false, `episode ${episode + 1} ending (chunk ${info.chunkOrFile}) rendered without throwing — ${threw.message}`); continue; }
  const s = deplanarStats();
  console.log(`episode ${episode + 1}: chunk ${info.chunkOrFile}, ${pages} page(s), page1 ${s.colors} colors ${s.nonZero}px`);
  expect(pages >= 1, `episode ${episode + 1}: article has at least one page`);
  expect(s.nonZero > 8000, `episode ${episode + 1}: page 1 drew substantial content (window frame + text)`);
  expect(s.colors > 3, `episode ${episode + 1}: page 1 is multi-color`);
  // render the LAST page too, to exercise multi-page layout end-to-end
  if (pages > 1) {
    try {
      mod.VL_SetBufferOffset(0);
      const bytes = mod.CA_CacheGrChunk(info.chunkOrFile);
      let article = ""; for (let i = 0; i < bytes.length; i++) article += String.fromCharCode(bytes[i]);
      const shownLast = mod.ShowArticle({ article, renderAll: true, maxPages: pages });
      executeOps(shownLast.pages[shownLast.pages.length - 1].operations, pictable);
      const last = deplanarStats();
      expect(last.nonZero > 4000, `episode ${episode + 1}: last page (${pages}) also drew content`);
    } catch (e) {
      expect(false, `episode ${episode + 1}: last page rendered without throwing — ${e.message}`);
    }
  }
}

// The "Read This!" help article (WL_TEXT.C HelpScreens, T_HELPART) renders through the same path.
{
  const info = mod.HelpScreens();
  let threw = null, pages = 0;
  try {
    const bytes = mod.CA_CacheGrChunk(info.chunkOrFile);
    let article = ""; for (let i = 0; i < bytes.length; i++) article += String.fromCharCode(bytes[i]);
    const layout = mod.CacheLayoutGraphics(article);
    for (const chunk of layout.marked) mod.CA_CacheGrChunk(chunk);
    pages = layout.pages;
    mod.VL_SetBufferOffset(0);
    const shown = mod.ShowArticle({ article, renderAll: true, maxPages: 1 });
    executeOps(shown.pages[shown.pages.length - 1].operations, pictable);
  } catch (e) { threw = e; }
  if (threw) { expect(false, `help article (chunk ${info.chunkOrFile}) rendered without throwing — ${threw.message}`); }
  else {
    const s = deplanarStats();
    console.log(`help article: chunk ${info.chunkOrFile}, ${pages} page(s), page1 ${s.colors} colors ${s.nonZero}px`);
    expect(pages >= 1, "help article has at least one page");
    expect(s.nonZero > 8000, "help article page 1 drew substantial content");

    // Page-advance regression: ShowArticle must WALK FORWARD — page 2's words must differ from page 1.
    // (The bug re-passed `article` to PageLayout each iteration, resetting textOffset so every page
    // re-rendered page 1; only the "pg N of M" counter changed.)
    if (pages >= 2) {
      const bytes = mod.CA_CacheGrChunk(info.chunkOrFile);
      let article = ""; for (let i = 0; i < bytes.length; i++) article += String.fromCharCode(bytes[i]);
      const wordsOf = (k) => mod.ShowArticle({ article, renderAll: true, maxPages: k }).pages.at(-1)
        .operations.filter((o) => o.type === "word").map((o) => o.word).join(" ");
      const p1 = wordsOf(1), p2 = wordsOf(2);
      console.log(`help page1 words: "${p1.slice(0, 40)}…"  page2 words: "${p2.slice(0, 40)}…"`);
      expect(p1.length > 0 && p2.length > 0 && p1 !== p2, "help page 2 text differs from page 1 (paging walks forward)");
    }
  }
}

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ END TEXT: all 6 episode-ending ENDART articles + the Read This! help article render real content (multi-page)."
  : `\n❌ END TEXT: ${fail} check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
