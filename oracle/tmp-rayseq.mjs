import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(), targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"), wl6Dir=path.join(repoRoot,"steam/base");
const M=563, FOCUS=Number(process.argv[2]??"170");
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wolf-rs-"));
const entryPath=path.join(tempDir,"e.ts"),outPath=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entryPath,[
 `export { CA_Startup, CA_CacheGrChunk, CA_CacheMap, CA_LoadAllSounds } from "${rel(path.join(targetDir,"ID_CA.C.ts"))}";`,
 `export { parseDemo } from "${rel(path.join(targetDir,"TS_DEMO.ts"))}";`,
 `export { DOSMemory } from "${rel(path.join(targetDir,"TS_DOS_MEMORY.ts"))}";`,
 `export { US_InitRndT } from "${rel(path.join(targetDir,"ID_US_A.ASM.ts"))}";`,
 `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { SD_ResetSoundState } from "${rel(path.join(targetDir,"ID_SD.C.ts"))}";`,
 `export { sdm_PC } from "${rel(path.join(targetDir,"ID_SD.H.ts"))}";`,
 `export { PlayDemoTrace } from "${rel(path.join(targetDir,"WL_GAME.C.ts"))}";`,
 `export { RAY_DEBUG } from "${rel(path.join(targetDir,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[entryPath],outfile:outPath,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const names=["MAPHEAD","GAMEMAPS","VGAHEAD","VGAGRAPH","VGADICT","VSWAP","AUDIOHED","AUDIOT","CONFIG"];
const files={}; for(const n of names) files[n]=new Uint8Array(await readFile(path.join(wl6Dir,`${n}.WL6`)));
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(15);
mod.SD_ResetSoundState({SoundMode:mod.sdm_PC}); mod.CA_LoadAllSounds(files.AUDIOHED,files.AUDIOT);
mod.RAY_DEBUG.active=true;
for(let x=20;x<=52;x++) for(let y=38;y<=48;y++) mod.RAY_DEBUG.tiles.add(x*64+y);
const demoBytes=mod.CA_CacheGrChunk(140); const demo=mod.parseDemo(demoBytes);
const [plane0,plane1]=mod.CA_CacheMap(demo.mapon);
const dgroup=new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(demoBytes,new Uint16Array(plane0),new Uint16Array(plane1),dgroup,{areaconnect:new Uint8Array(37*37),sampleEvery:1,maxCommands:M});
const last=mod.RAY_DEBUG.refreshIdx;
const seq=mod.RAY_DEBUG.log.filter(e=>e.refreshIdx===last && e.pixx===FOCUS);
console.log(`pixx=${FOCUS} refresh ${last} tile sequence (${seq.length} marks):`);
for(const e of seq){const xi=(e.xintercept/65536).toFixed(3),yi=(e.yintercept/65536).toFixed(3);console.log(`  mark(${e.tile[0]},${e.tile[1]}) ${e.side.padEnd(5)} | xtile=${e.xtile} yinttile=${e.yinttile} xinttile=${e.xinttile} ytile=${e.ytile} | xint=${xi} yint=${yi}`);}
await rm(tempDir,{recursive:true,force:true});
