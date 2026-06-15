// Color gate — the index→RGB present path (platform/vga.ts IndexedVgaSurface). The browser turns
// the indexed VGA framebuffer into canvas RGBA here: setPaletteFromVgaDac() scales the 6-bit DAC
// palette to 8-bit, and present() looks each pixel's index up in that palette. NO gate exercised
// this conversion before — the palette-offset bug proved index-level checks (check:frame) can be
// green while on-screen color is wrong. This drives the REAL IndexedVgaSurface with a fake 2D
// context and asserts exact RGBA for known indices (correct 6→8-bit scale, RGB order, indexing).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, "apps", "source-typescript", "src");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-present-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, `export { IndexedVgaSurface } from "${rel(path.join(srcDir, "platform", "vga.ts"))}";`);
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

// Minimal fake canvas 2D context: present() only needs createImageData + putImageData.
let presented = null;
const fakeCtx = {
  createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: (img) => { presented = img; },
};
const surface = new mod.IndexedVgaSurface(fakeCtx);

// Base 6-bit DAC palette from GAMEPAL.OBJ (offset 0x77).
const obj = new Uint8Array(await readFile(path.join(repoRoot, "source", "WOLFSRC", "OBJ", "GAMEPAL.OBJ")));
const gamepal = obj.subarray(0x77, 0x77 + 768);
surface.setPaletteFromVgaDac(gamepal);

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };
const dac = (v) => Math.round(v * 255 / 63); // the exact 6→8-bit scaling present must use

// Put a handful of known indices into the framebuffer and present.
surface.pixels.fill(0);
surface.pixels[0] = 0;    // black
surface.pixels[1] = 1;    // blue   gamepal (0,0,42)
surface.pixels[2] = 7;    // l.gray gamepal (42,42,42)
surface.pixels[3] = 6;    // brown  gamepal (42,21,0)
surface.pixels[4] = 255;  // last color
surface.present();

const data = presented?.data;
expect(!!data && data.length === 320 * 200 * 4, "present() wrote a full 320x200 RGBA buffer to the canvas");
const rgba = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
const eqColor = (idx, r, g, b) => { const c = rgba(idx); return c[0] === r && c[1] === g && c[2] === b && c[3] === 255; };

expect(eqColor(0, 0, 0, 0), "index 0 → pure black with full alpha");
expect(eqColor(1, 0, 0, dac(42)), `index 1 → blue (0,0,${dac(42)}); 6→8-bit DAC scaled, not raw 6-bit or *4`);
expect(eqColor(2, dac(42), dac(42), dac(42)), `index 7 → gray (${dac(42)},${dac(42)},${dac(42)})`);
expect(eqColor(3, dac(42), dac(21), 0), `index 6 → brown (${dac(42)},${dac(21)},0): R>G, B=0 (channel order R,G,B not B,G,R)`);
const last = rgba(4);
expect(last[3] === 255 && (last[0] | last[1] | last[2]) !== 0 || gamepal[255 * 3] + gamepal[255 * 3 + 1] + gamepal[255 * 3 + 2] === 0, "last palette index maps to its gamepal color");

// Guard the exact scaling: 42 must map to 170 (round(42*255/63)), NOT 168 (the lossy *4 shortcut).
expect(dac(42) === 170 && rgba(1)[2] === 170, "scaling is *255/63 (42→170), not the lossy <<2 (42→168)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ PRESENT PATH: IndexedVgaSurface maps indexed pixels to canvas RGBA with correct DAC scaling + channel order."
  : `\n❌ ${fail} present-path check(s) failed — on-screen colors would be wrong.`);
process.exitCode = fail === 0 ? 0 : 1;
