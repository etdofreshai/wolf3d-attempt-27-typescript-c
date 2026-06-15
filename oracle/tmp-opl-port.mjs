// T4-audio (port side): play the chaingun sound (38) in AdLib mode and capture the OPL
// register-write stream (alOut -> alRegisterWrites), to validate the port's AdLib modeling
// and set up the eventual oracle comparison.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-opl-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_PlaySound, SD_SetSoundMode, alRegisterWrites, SDL_ALSoundService } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.SD_ResetSoundState({ SoundMode: mod.sdm_AdLib, AdLibPresent: true });
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);

const CHAINGUN = 38;
mod.alRegisterWrites.length = 0;
mod.SD_PlaySound(CHAINGUN);
const instWrites = mod.alRegisterWrites.map((w) => `${(w.register).toString(16)}=${(w.value).toString(16)}`);
console.log(`SD_PlaySound(${CHAINGUN}) AdLib instrument writes: ${instWrites.length}`);
console.log(`  ${instWrites.join(" ")}`);

// service the sound a few ticks -> frequency-register writes from the sound data
const serviceWrites = [];
for (let t = 0; t < 4; t++) {
  mod.alRegisterWrites.length = 0;
  mod.SDL_ALSoundService();
  serviceWrites.push(mod.alRegisterWrites.map((w) => `${(w.register).toString(16)}=${(w.value).toString(16)}`).join(","));
}
console.log(`per-service writes (4 ticks): ${serviceWrites.map((s, i) => `[t${i}: ${s || "-"}]`).join(" ")}`);
await rm(tempDir, { recursive: true, force: true });
