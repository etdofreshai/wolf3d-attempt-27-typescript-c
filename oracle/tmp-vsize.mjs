import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const r=process.cwd(), t=path.join(r,"apps/source-typescript/src/WOLFSRC"), wl6=path.join(r,"steam/base");
const td=await mkdtemp(path.join(os.tmpdir(),"vs-")); const e=path.join(td,"e.ts"),o=path.join(td,"e.mjs");
const rel=(p)=>{let x=path.relative(td,p).split(path.sep).join("/");return x.startsWith(".")?x:"./"+x;};
await writeFile(e,[
 `export { BuildTables, SetupWalls, NewViewSize, ReadConfig, viewwidth } from "${rel(path.join(t,"WL_MAIN.C.ts"))}";`,
 `export { pixelangle } from "${rel(path.join(t,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[e],outfile:o,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const m=await import(`${pathToFileURL(o).href}?c=${Date.now()}`);
const cfg=new Uint8Array(await readFile(path.join(wl6,"CONFIG.WL6")));
m.BuildTables(); m.SetupWalls();
try{ const c=m.ReadConfig(cfg); console.log("ReadConfig result:", JSON.stringify(c).slice(0,200)); }catch(err){ console.log("ReadConfig err:", err.message); }
for(const vs of [14,15,16,17,18,19,20]){ m.NewViewSize(vs); console.log(`viewsize ${vs}: viewwidth=${m.viewwidth} pixelangle[170]=${m.pixelangle[170]} [160]=${m.pixelangle[160]} [180]=${m.pixelangle[180]}`); }
console.log("ORACLE target: pixelangle[170]=-49 [160]=-22 [180]=-76");
await rm(td,{recursive:true,force:true});
