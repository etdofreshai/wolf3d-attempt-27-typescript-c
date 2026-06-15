import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"); const wl6Dir=path.join(repoRoot,"steam/base");
const K=Number(process.argv[2]??66); const lo=Number(process.argv[3]??1119), hi=Number(process.argv[4]??1123);
const oracle=readFileSync("tmp/oracle-build/ORTRACE.BIN");
const OBJSIZE=60,MAXACTORS=150,REC=150*60+64*64+320*2+10;
const F={active:[0,2],ticcount:[2,2],obclass:[4,2],state:[6,2],flags:[8,1],distance:[10,4],dir:[14,2],x:[16,4],y:[20,4],tilex:[24,2],tiley:[26,2]};
const rd=(b,base,off,sz)=>sz===1?b[base+off]:sz===2?(b[base+off]|(b[base+off+1]<<8)):(b[base+off]|(b[base+off+1]<<8)|(b[base+off+2]<<16)|(b[base+off+3]<<24));
const fmt=(b,base)=>Object.entries(F).map(([n,[o,s]])=>`${n}=${rd(b,base,o,s)}`).join(" ");
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wsl-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
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
function runTo(mc){ mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
 mod.SD_ResetSoundState({SoundMode:mod.sdm_PC}); mod.CA_LoadAllSounds(files.AUDIOHED,files.AUDIOT);
 const db=mod.CA_CacheGrChunk(140); const demo=mod.parseDemo(db); const [p0,p1]=mod.CA_CacheMap(demo.mapon);
 const dg=new mod.DOSMemory(0x10000); mod.PlayDemoTrace(db,new Uint16Array(p0),new Uint16Array(p1),dg,{areaconnect:new Uint8Array(37*37),sampleEvery:1,maxCommands:mc}); return dg; }
const objlist=mod.nearOffsetForRuntimeSymbol("_objlist");
for(let N=lo;N<=hi;N++){
  const dg=runTo(N+1); const pSlot=objlist+K*OBJSIZE; const oBase=N*REC+K*OBJSIZE;
  console.log(`cmd ${N} K=${K}:`);
  console.log(`  PORT: ${fmt(dg.bytes,pSlot)}`);
  console.log(`  ORAC: ${fmt(oracle,oBase)}`);
}
await rm(tempDir,{recursive:true,force:true});
