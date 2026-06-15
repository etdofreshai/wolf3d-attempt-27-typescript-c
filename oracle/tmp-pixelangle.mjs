import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(), targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"), wl6Dir=path.join(repoRoot,"steam/base");
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wolf-pa-"));
const entryPath=path.join(tempDir,"e.ts"),outPath=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entryPath,[
 `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { pixelangle, midangle } from "${rel(path.join(targetDir,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[entryPath],outfile:outPath,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(outPath).href}?c=${Date.now()}`);
mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(15);
console.log("port pixelangle[165..175]:");
for(let i=165;i<=175;i++) console.log(`  [${i}] = ${mod.pixelangle[i]}`);
await rm(tempDir,{recursive:true,force:true});
