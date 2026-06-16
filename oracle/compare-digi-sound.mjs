// Feature gate — browser digitized (Sound Blaster) sound playback. WL6 plays digitized samples for
// many effects when a Sound Blaster is present (gunshots, deaths, boss speech). The port runs the
// AdLib FM path by default; this wires up the digi path: SDL_SetupDigi builds DigiList from VSWAP,
// InitDigiMap maps sounds → digi indices, and SD_PlaySound (with DigiMode on) hands the assembled
// PCM to a playback hook (main.ts → Web Audio). This gate verifies the DATA path end to end:
//   - DigiList parsed from VSWAP (cumulative pages, sane lengths);
//   - assembleDigiSound returns real, varied 8-bit PCM of the right length;
//   - a mapped sound ROUTES to the digi hook when DigiMode is on;
//   - with DigiMode OFF, that same sound goes to AdLib instead (so check:opl* stay unaffected).
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-digi-"));
const entryPath = path.join(tempDir, "entry.ts");
const outPath = path.join(tempDir, "entry.mjs");
const rel = (p) => { let r = path.relative(tempDir, p).split(path.sep).join("/"); return r.startsWith(".") ? r : "./" + r; };
await writeFile(entryPath, [
  `export { CA_Startup, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
  `export { PM_Startup } from "${rel(path.join(targetDir, "ID_PM.C.ts"))}";`,
  `export { InitDigiMap } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
  `export { SD_ResetSoundState, SD_Startup, SD_SetSoundMode, SDL_SetupDigi, SD_SetDigiDevice, SD_SetDigiPlaybackHook, SD_PlaySound, SD_StopSound, assembleDigiSound, DigiMap, DigiList, NumDigi, alRegisterWrites } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
  `export { sdm_AdLib, sds_SoundBlaster, sds_Off } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
].join("\n"));
await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

const files = {};
for (const n of ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"]) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));
mod.CA_Startup(files);
mod.SD_ResetSoundState({ AdLibPresent: true, SoundBlasterPresent: true });
mod.SD_Startup();
mod.SD_SetSoundMode(mod.sdm_AdLib);
mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);
mod.PM_Startup(files.VSWAP, ["wolf3d.exe", "-noems", "-noxms"]);
mod.SDL_SetupDigi();
mod.InitDigiMap();
mod.SD_SetDigiDevice(mod.sds_SoundBlaster);

let fail = 0;
const expect = (c, m) => { console.log(`${c ? "  ok  " : " FAIL "} ${m}`); if (!c) fail++; };

// 1. DigiList parsed from VSWAP.
const numDigi = mod.NumDigi;
console.log(`SDL_SetupDigi: NumDigi=${numDigi}, DigiList[0]=(page ${mod.DigiList[0]}, len ${mod.DigiList[1]})`);
expect(numDigi >= 40 && numDigi <= 64, `NumDigi parsed to a plausible count (got ${numDigi})`);
expect(mod.DigiList.length === numDigi * 2, "DigiList has a (page,length) pair per digi sound");
expect(mod.DigiList[0] === 0, "first digi sound starts at sound page 0 (relative to PMSoundStart)");
let cumulativeOk = true, pg = 0;
for (let i = 0; i < numDigi; i++) { if (mod.DigiList[i * 2] !== pg) cumulativeOk = false; pg += Math.ceil(mod.DigiList[i * 2 + 1] / 4096); }
expect(cumulativeOk, "DigiList start pages are cumulative (page[i] == sum of ceil(len/4096) before it)");

// 2. assembleDigiSound returns real, varied PCM of the right length.
const pcm0 = mod.assembleDigiSound(0);
expect(!!pcm0 && pcm0.length === mod.DigiList[1], `assembleDigiSound(0) length matches DigiList (${pcm0?.length} vs ${mod.DigiList[1]})`);
const distinct = new Set(pcm0).size;
let min = 255, max = 0; for (const v of pcm0) { if (v < min) min = v; if (v > max) max = v; }
console.log(`digi sound 0: ${pcm0.length} bytes, ${distinct} distinct sample values, range ${min}..${max}`);
expect(distinct > 16 && max - min > 32, "the PCM is real, varied audio (not flat silence / fake ramp)");

// 3. A mapped sound routes to the digi hook when DigiMode is on.
let mappedSound = -1;
for (let s = 0; s < mod.DigiMap.length; s++) { if (mod.DigiMap[s] !== -1) { mappedSound = s; break; } }
expect(mappedSound >= 0, `InitDigiMap mapped at least one sound to a digi index (sound ${mappedSound} → digi ${mod.DigiMap[mappedSound]})`);
let captured = null;
mod.SD_SetDigiPlaybackHook((pcm) => { captured = pcm; });
mod.SD_StopSound();
mod.SD_PlaySound(mappedSound);
expect(captured !== null, "with DigiMode on, a mapped sound is handed to the Web Audio digi hook");
expect(captured && captured.length === mod.DigiList[mod.DigiMap[mappedSound] * 2 + 1], "the hook received the full assembled PCM for that sound");

// 4. With DigiMode OFF, the same sound goes to AdLib (FM) instead — the digi path is opt-in, so the
//    OPL register-stream gates (which never enable digi) are unaffected.
mod.SD_SetDigiDevice(mod.sds_Off);
captured = null;
mod.SD_StopSound();
mod.alRegisterWrites.length = 0;
mod.SD_PlaySound(mappedSound);
expect(captured === null, "with DigiMode off, the digi hook is NOT called");
expect(mod.alRegisterWrites.length > 0, "with DigiMode off, the sound plays through the AdLib FM path (register writes produced)");

await rm(tempDir, { recursive: true, force: true });
console.log(fail === 0
  ? "\n✅ DIGI SOUND: VSWAP digitized sounds load + assemble correctly and route to Web Audio when DigiMode is on; AdLib otherwise."
  : `\n❌ ${fail} digi-sound check(s) failed.`);
process.exitCode = fail === 0 ? 0 : 1;
