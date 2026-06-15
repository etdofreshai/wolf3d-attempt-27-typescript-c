import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"); const wl6Dir=path.join(repoRoot,"steam/base");
const PIXX=Number(process.argv[2]??218), M=563, REFRESH=562;
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wrp-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entry,[
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
await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
const names=["MAPHEAD","GAMEMAPS","VGAHEAD","VGAGRAPH","VGADICT","VSWAP","AUDIOHED","AUDIOT","CONFIG"]; const files={};
for(const n of names) files[n]=new Uint8Array(await readFile(path.join(wl6Dir,`${n}.WL6`)));
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
mod.SD_ResetSoundState({SoundMode:mod.sdm_PC}); mod.CA_LoadAllSounds(files.AUDIOHED,files.AUDIOT);
mod.RAY_DEBUG.active=true; mod.RAY_DEBUG.onlyPixx=PIXX; mod.RAY_DEBUG.onlyRefresh=REFRESH;
const db=mod.CA_CacheGrChunk(140); const demo=mod.parseDemo(db); const [p0,p1]=mod.CA_CacheMap(demo.mapon);
const dg=new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(db,new Uint16Array(p0),new Uint16Array(p1),dg,{areaconnect:new Uint8Array(37*37),sampleEvery:1,maxCommands:M});
console.log(`pixx=${PIXX} refresh=${REFRESH} DDA iters=${mod.RAY_DEBUG.iters.length}`);
for(const it of mod.RAY_DEBUG.iters){
  if(it.k==="init"){ console.log(`init xtile=${it.xtile} ytile=${it.ytile} yinttile=${it.yinttile} xinttile=${it.xinttile} xint=${it.xintercept} yint=${it.yintercept} xstep=${it.xstep} ystep=${it.ystep}`); }
  else { console.log(`${it.k.padEnd(5)} check=${it.check} hit=${it.hit}  [xtile=${it.xtile} yinttile=${it.yinttile} xinttile=${it.xinttile} ytile=${it.ytile} xint=${it.xintercept} yint=${it.yintercept}]`); }
}
await rm(tempDir,{recursive:true,force:true});
