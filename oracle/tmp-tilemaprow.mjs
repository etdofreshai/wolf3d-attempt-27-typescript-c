import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(), targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"), wl6Dir=path.join(repoRoot,"steam/base");
const M=563;
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wolf-tm-"));
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
 `export { nearOffsetForRuntimeSymbol, STRUCT_LAYOUTS } from "${rel(path.join(targetDir,"TS_SAVE_LAYOUT.ts"))}";`,
].join("\n"));
await build({entryPoints:[entryPath],outfile:outPath,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
const names=["MAPHEAD","GAMEMAPS","VGAHEAD","VGAGRAPH","VGADICT","VSWAP","AUDIOHED","AUDIOT","CONFIG"];
const files={}; for(const n of names) files[n]=new Uint8Array(await readFile(path.join(wl6Dir,`${n}.WL6`)));
mod.CA_Startup(files); mod.US_InitRndT(false); mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(15);
mod.SD_ResetSoundState({SoundMode:mod.sdm_PC}); mod.CA_LoadAllSounds(files.AUDIOHED,files.AUDIOT);
const demoBytes=mod.CA_CacheGrChunk(140); const demo=mod.parseDemo(demoBytes);
const [plane0,plane1]=mod.CA_CacheMap(demo.mapon);
const dgroup=new mod.DOSMemory(0x10000);
mod.PlayDemoTrace(demoBytes,new Uint16Array(plane0),new Uint16Array(plane1),dgroup,{areaconnect:new Uint8Array(37*37),sampleEvery:1,maxCommands:M});
const tm=mod.nearOffsetForRuntimeSymbol("_tilemap");
const player=dgroup.u16(mod.nearOffsetForRuntimeSymbol("_player"));
const fo=(n)=>mod.STRUCT_LAYOUTS.objtype.fields.find(f=>f[0]===n)[1];
console.log(`player tile=${dgroup.u16(player+fo("tilex"))},${dgroup.u16(player+fo("tiley"))} x=${dgroup.i32(player+fo("x"))} y=${dgroup.i32(player+fo("y"))} angle=${dgroup.u16(player+fo("angle"))}`);
console.log("tilemap rows y=42..46, x=28..50 (value; 0=floor, <128 wall, >=128 door):");
for(let y=42;y<=46;y++){
  let row=`y=${y}: `;
  for(let x=28;x<=50;x++){ const v=dgroup.u8(tm+x*64+y); row+=String(v).padStart(4); }
  console.log(row);
}
await rm(tempDir,{recursive:true,force:true});
