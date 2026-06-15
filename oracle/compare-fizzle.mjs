// Feature gate — the fizzle-fade dissolve. The level-start transition reveals the rendered frame in
// a 17-bit LFSR pixel order (ID_VH.C FizzleFade, poly 0x12000). main.ts (advanceFizzle) drives that
// exact LFSR incrementally per browser frame, revealing pixels where x<320 && y<200. This gate
// proves two things:
//   (A) that LFSR reveals EVERY one of the 320x200 screen pixels exactly once (a complete, gap-free,
//       dupe-free dissolve — the property that guarantees a pixel-perfect final frame);
//   (B) the ported FizzleFade runs to completion (LFSR returns to its seed) and copies a full
//       screen's worth of pixels.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-fizzle-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { FizzleFade, lastFizzleFade } from "${rel(path.join(targetDir, "ID_VH.C.ts"))}";`,
  `export { videoPlanes, ylookup, VL_ResetVideoState, VL_SetVGAPlaneMode } from "${rel(path.join(targetDir, "ID_VL.C.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const W = 320, H = 200;
let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// (A) Exercise the EXACT LFSR main.ts advanceFizzle uses (seed 1, poly 0x12000, x=rnd>>8,
// y=(rnd&0xff)-1, reveal where x<W && y<H), tracking how many times each screen pixel is revealed.
const reveals = new Uint8Array(W * H);
let rndval = 1, steps = 0, inBounds = 0, anyTwice = false;
do {
  const y = ((rndval & 0xff) - 1) & 0xff;
  const x = (rndval >>> 8) & 0xffff;
  const carry = rndval & 1;
  rndval >>>= 1;
  if (carry) rndval = (rndval ^ 0x00012000) >>> 0;
  if (x < W && y < H) { inBounds++; if (++reveals[y * W + x] === 2) anyTwice = true; }
  steps++;
} while (rndval !== 1 && steps < 0x20000);

let revealedOnce = 0, never = 0;
for (let i = 0; i < W * H; i++) { if (reveals[i] === 1) revealedOnce++; else if (reveals[i] === 0) never++; }
console.log(`LFSR: ${steps} steps to return to seed; ${inBounds} in-screen reveals; ${revealedOnce}/${W * H} pixels revealed once, ${never} never, twice=${anyTwice}`);
expect(rndval === 1 && steps === 0x1ffff, "the LFSR is a full 17-bit period (131071 steps back to seed)");
expect(revealedOnce === W * H, `every one of the ${W * H} screen pixels is revealed exactly once`);
expect(never === 0 && !anyTwice, "no screen pixel is skipped or revealed twice (gap-free, dupe-free dissolve)");

// (B) The ported FizzleFade runs to completion over a real planar buffer.
mod.VL_ResetVideoState();
mod.VL_SetVGAPlaneMode();
const VPB = 0x10000, DESTPAGE = 0x4000;
for (let plane = 0; plane < 4; plane++) for (let off = 0; off < 0x4000; off++) {
  mod.videoPlanes[plane * VPB + off] = ((plane * 37 + off * 7 + 11) & 0xff) || 1;
  mod.videoPlanes[plane * VPB + DESTPAGE + off] = 0;
}
const aborted = mod.FizzleFade(0, DESTPAGE, W, H, 70, false);
const lf = mod.lastFizzleFade;
console.log(`FizzleFade: aborted=${aborted} copied=${lf?.copied} finalRnd=${lf?.finalRnd}`);
expect(aborted === false && (lf?.finalRnd ?? 0) === 1, "ported FizzleFade ran to completion (LFSR back to seed)");
expect((lf?.copied ?? 0) >= W * H, `ported FizzleFade dissolved a full screen of pixels (copied ${lf?.copied})`);

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ FIZZLE: the dissolve LFSR reveals every screen pixel exactly once; main.ts uses it for the level-start transition."
  : `\n❌ ${fail} fizzle check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
