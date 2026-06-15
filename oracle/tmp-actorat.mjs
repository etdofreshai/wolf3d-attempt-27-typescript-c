import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"); const wl6Dir=path.join(repoRoot,"steam/base");
const N=Number(process.argv[2]??1122);
const oracle=readFileSync("tmp/oracle-build/ORTRACE.BIN");
const REC=21938, ABASE=13746; // actorat starts at 13746 within block
const oaa=(T,x,y)=>{const o=T*REC+ABASE+(x*64+y)*2; return oracle[o]|(oracle[o+1]<<8);};
const tempDir=await mkdtemp(path.join(os.tmpdir(),"waa-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
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
 `export { nearOffsetForRuntimeSymbol } from "${rel(path.join(targetDir,"TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
const names=["MAPHEAD","GAMEMAPS","VGAHEAD","VGAGRAPH","VGADICT","VSWAP","AUDIOHED","AUDIOT","CONFIG"]; const files={};
for(const n of names) files[n]=new Uint8Array(await readFile(path.join(wl6Dir,`${n}.WL6`)));
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
mod.SD_ResetSoundState({SoundMode:mod.sdm_PC}); mod.CA_LoadAllSounds(files.AUDIOHED,files.AUDIOT);
const db=mod.CA_CacheGrChunk(140); const demo=mod.parseDemo(db); const [p0,p1]=mod.CA_CacheMap(demo.mapon);
const dg=new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(db,new Uint16Array(p0),new Uint16Array(p1),dg,{areaconnect:new Uint8Array(37*37),sampleEvery:1,maxCommands:N+1});
const aaOff=mod.nearOffsetForRuntimeSymbol("_actorat");
const paa=(x,y)=>dg.u16(aaOff+(x*64+y)*2);
console.log(`cmd ${N} actorat near dog(23,45) — PORT vs ORACLE (END-of-command):`);
let diffs=0;
for(let x=20;x<=26;x++)for(let y=43;y<=48;y++){ const p=paa(x,y), o=oaa(N,x,y); if(p!==o){ console.log(`  (${x},${y}): port=${p} orac=${o}`); diffs++; } }
console.log(`diffs in 20-26 x 43-48: ${diffs}`);
console.log(`(22,45): port=${paa(22,45)} orac=${oaa(N,22,45)}   (23,46): port=${paa(23,46)} orac=${oaa(N,23,46)}`);
await rm(tempDir,{recursive:true,force:true});
