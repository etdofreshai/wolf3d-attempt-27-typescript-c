import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "apps", "source-typescript", "src", "WOLFSRC");
const wl6Dir = path.join(repoRoot, "steam", "base");
const chunkArg = Number(process.argv[2] ?? "139");

async function main() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-demo-trace-"));
  const entryPath = path.join(tempDir, "entry.ts");
  const outPath = path.join(tempDir, "entry.mjs");
  const rel = (p) => {
    let r = path.relative(tempDir, p).replace(/\\/g, "/");
    if (!r.startsWith(".")) r = "./" + r;
    return r;
  };
  await writeFile(
    entryPath,
    [
      `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir, "ID_CA.C.ts"))}";`,
      `export { parseDemo } from "${rel(path.join(targetDir, "TS_DEMO.ts"))}";`,
      `export { DOSMemory } from "${rel(path.join(targetDir, "TS_DOS_MEMORY.ts"))}";`,
      `export { US_InitRndT } from "${rel(path.join(targetDir, "ID_US_A.ASM.ts"))}";`,
      `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir, "WL_MAIN.C.ts"))}";`,
      `export { SD_ResetSoundState } from "${rel(path.join(targetDir, "ID_SD.C.ts"))}";`,
      `export { sdm_PC } from "${rel(path.join(targetDir, "ID_SD.H.ts"))}";`,
      `export { PlayDemoTrace } from "${rel(path.join(targetDir, "WL_GAME.C.ts"))}";`,
    ].join("\n"),
  );
  await build({ entryPoints: [entryPath], outfile: outPath, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
  const mod = await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);

  const names = ["MAPHEAD", "GAMEMAPS", "VGAHEAD", "VGAGRAPH", "VGADICT", "VSWAP", "AUDIOHED", "AUDIOT", "CONFIG"];
  const files = {};
  for (const n of names) files[n] = new Uint8Array(await readFile(path.join(wl6Dir, `${n}.WL6`)));

  mod.CA_Startup(files);
  mod.US_InitRndT(false);
  mod.BuildTables();
  mod.SetupWalls();
  mod.NewViewSize(15);
  mod.SD_ResetSoundState({ SoundMode: mod.sdm_PC });
  mod.CA_LoadAllSounds(files.AUDIOHED, files.AUDIOT);

  const demoBytes = mod.CA_CacheGrChunk(chunkArg);
  const demo = mod.parseDemo(demoBytes);
  const [plane0, plane1] = mod.CA_CacheMap(demo.mapon);
  const dgroup = new mod.DOSMemory(0x10000);
  const areaconnect = new Uint8Array(37 * 37);

  const summary = mod.PlayDemoTrace(demoBytes, new Uint16Array(plane0), new Uint16Array(plane1), dgroup, {
    areaconnect,
    sampleEvery: 1,
  });

  console.log(JSON.stringify({
    chunk: chunkArg,
    mapon: summary.mapon,
    commands: summary.commands,
    commandsRun: summary.commandsRun,
    completed: summary.completed,
    playstate: summary.playstate,
    timeCount: summary.timeCount,
    enemies: summary.setup.enemies,
    traceLen: summary.trace.length,
  }));

  const trace = summary.trace;
  // Health timeline: print only when health changes, plus damage events.
  let prevHealth = null;
  console.log("--- health changes & damage events ---");
  for (const s of trace) {
    const dmg = (s.damageActions ?? []).filter((d) => d.hit);
    if (s.health !== prevHealth || dmg.length) {
      const dmgStr = dmg.map((d) => `${d.action}(obcl=${d.obclass},dmg=${d.damage},hpAfter=${d.health})`).join(" ");
      console.log(
        `cmd=${String(s.commandIndex).padStart(4)} t=${String(s.timeCount).padStart(5)} hp=${String(s.health).padStart(4)} ammo=${s.ammo} ps=${s.playstate} tile=${s.playerTilex},${s.playerTiley} ang=${s.playerAngle} actors=${s.actorCount} ${dmgStr}`,
      );
      prevHealth = s.health;
    }
  }
  console.log("--- last 5 samples ---");
  for (const s of trace.slice(-5)) {
    console.log(`cmd=${s.commandIndex} hp=${s.health} ps=${s.playstate} tile=${s.playerTilex},${s.playerTiley} actors=${s.actorCount}`);
  }

  // Player attack aggregate
  let pa = 0, hits = 0, kills = 0, firstAttackCmd = null;
  const sampleAttacks = [];
  for (const s of trace) {
    for (const a of s.playerAttacks ?? []) {
      pa++;
      if (firstAttackCmd === null) firstAttackCmd = s.commandIndex;
      if (a.hit) hits++;
      if (a.killed) kills++;
      if (sampleAttacks.length < 12) {
        sampleAttacks.push(`cmd=${s.commandIndex} tgt=${a.target} obcl=${a.obclass} dist=${a.dist} hit=${a.hit} dmg=${a.damage} hp=${a.hitpoints} killed=${a.killed} lineClear=${a.lineClear}`);
      }
    }
  }
  console.log("--- player attacks ---");
  console.log(`totalAttacks=${pa} hits=${hits} kills=${kills} firstAttackCmd=${firstAttackCmd} finalScore=${trace.at(-1)?.score}`);
  for (const line of sampleAttacks) console.log("  " + line);

  await rm(tempDir, { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exit(1); });
