import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC"); const wl6Dir=path.join(repoRoot,"steam/base");
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wcs-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entry,[
 `export { ReadConfig } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { sdm_Off, sdm_PC, sdm_AdLib } from "${rel(path.join(targetDir,"ID_SD.H.ts"))}";`,
].join("\n"));
await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
const cfg=new Uint8Array(await readFile(path.join(wl6Dir,"CONFIG.WL6")));
const r=mod.ReadConfig(cfg);
console.log("sdm_Off=",mod.sdm_Off,"sdm_PC=",mod.sdm_PC,"sdm_AdLib=",mod.sdm_AdLib);
console.log("ReadConfig result keys:", Object.keys(r).filter(k=>/sound|sd|mode|music/i.test(k)));
console.log("full:", JSON.stringify(r).slice(0,400));
await rm(tempDir,{recursive:true,force:true});
