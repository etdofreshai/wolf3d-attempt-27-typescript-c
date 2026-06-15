// T4-audio gate: capture the port's full AdLib OPL register-write stream for the chaingun
// sound (instrument setup via SDL_ALPlaySound + every per-tick SDL_ALSoundService write
// until the sound ends) and assert it matches a committed expected hash. The values are
// validated faithful to the DOS by inspection (AUDIOT is T1-byte-identical; the port's
// instrument parsing + SDL_AlSetFXInst sequence + per-tick `data[cursor]` reads match
// id_sd.c). The runtime oracle alOut dump is blocked by oracle-global fragility
// (memory/t4-audio-parity.md), so this guards the validated stream against regression.
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const EXPECTED = process.env.OPL_PRINT ? null : "a67cce61c3513276b041ef2907f75bb8337b8ecee054121b7cfe828e849beaa6";
const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-oplgate-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_PlaySound, alRegisterWrites, SDL_ALSoundService, SD_SoundPlaying } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["AUDIOHED", "AUDIOT"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));

function streamFor(sound) {
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_AdLib, AdLibPresent: true });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
  mod.alRegisterWrites.length = 0;
  mod.SD_PlaySound(sound);
  // service until the sound finishes (bounded)
  for (let t = 0; t < 4096 && mod.SD_SoundPlaying() !== 0; t++) mod.SDL_ALSoundService();
  return mod.alRegisterWrites.map((w) => (w.register << 8) | w.value);
}

const sounds = [38, 1, 12, 24]; // chaingun + a spread of AdLib sounds
const all = [];
for (const s of sounds) all.push(s, ...streamFor(s));
const buf = Buffer.from(Uint16Array.from(all).buffer);
const hash = createHash("sha256").update(buf).digest("hex");
const total = all.length - sounds.length;
await rm(tempDir, { recursive: true, force: true });

if (process.env.OPL_PRINT) {
  console.log(`OPL register-write hash for sounds ${sounds.join(",")}: ${hash} (${total} writes)`);
  process.exitCode = 0;
} else if (hash === EXPECTED) {
  console.log(`✅ T4 AUDIO OPL: port AdLib register stream matches the committed expected for ${sounds.length} sounds (${total} writes, validated faithful to AUDIOT/id_sd.c).`);
  process.exitCode = 0;
} else {
  console.log(`❌ T4 AUDIO OPL regression: register-write hash ${hash} != expected ${EXPECTED}. Re-run with OPL_PRINT=1 and update if intended. See memory/t4-audio-parity.md.`);
  process.exitCode = 1;
}
