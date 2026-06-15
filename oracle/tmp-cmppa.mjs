import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(), targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC");
// oracle pixelangle[160..180] from ORTRACE.BIN rec 0, offset 9000+4096=13096, 21 int16 LE
const bin=new Uint8Array(await readFile(path.join(repoRoot,"tmp/oracle-build/ORTRACE.BIN")));
const dv=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
const oPA={}; for(let k=0;k<21;k++) oPA[160+k]=dv.getInt16(13096+k*2,true);
// port pixelangle
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wolf-cpa-"));
const entryPath=path.join(tempDir,"e.ts"),outPath=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entryPath,[
 `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { pixelangle } from "${rel(path.join(targetDir,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[entryPath],outfile:outPath,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(15);
let diffs=0;
console.log("idx | port | oracle");
for(let i=160;i<=180;i++){const p=mod.pixelangle[i],o=oPA[i];const m=p!==o?"  <<< DIFF":"";if(p!==o)diffs++;console.log(`${i} | ${p} | ${o}${m}`);}
console.log(`\ntotal diffs in [160..180]: ${diffs}`);
await rm(tempDir,{recursive:true,force:true});
