import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"); const wl6Dir=path.join(repoRoot,"steam/base");
const buf=readFileSync("tmp/oracle-build/ORTRACE.BIN");
const BLOCK=150*60+64*64+320*2; const PIXBASE=150*60+64*64; // pixelangle start within block
const TIC=562;
const opix=(i)=>{ const o=TIC*BLOCK+PIXBASE+i*2; return buf[o]|(buf[o+1]<<8)|((buf[o+1]&0x80)?~0xffff:0); };
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wpc-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entry,[
 `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { pixelangle, finetangent } from "${rel(path.join(targetDir,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
console.log("pixx : port_pixelangle  oracle_pixelangle  (diff)");
for(let i=212;i<=222;i++){ const p=mod.pixelangle[i], o=opix(i); console.log(`${i} : ${p}  ${o}  ${p===o?"":"<<< DIFF "+(p-o)}`); }
await rm(tempDir,{recursive:true,force:true});
