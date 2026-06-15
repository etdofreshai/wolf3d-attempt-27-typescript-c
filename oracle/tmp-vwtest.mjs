import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const r=process.cwd(), t=path.join(r,"apps/source-typescript/src/WOLFSRC");
const td=await mkdtemp(path.join(os.tmpdir(),"vwt-")); const e=path.join(td,"e.ts"),o=path.join(td,"e.mjs");
const rel=(p)=>{let x=path.relative(td,p).split(path.sep).join("/");return x.startsWith(".")?x:"./"+x;};
await writeFile(e,[
 `export { BuildTables, SetupWalls, NewViewSize } from "${rel(path.join(t,"WL_MAIN.C.ts"))}";`,
 `import * as WLM from "${rel(path.join(t,"WL_MAIN.C.ts"))}";`,
 `import * as WLD from "${rel(path.join(t,"WL_DRAW.C.ts"))}";`,
 `export function probe(){ return { mainVW: WLM.viewwidth, drawVW: WLD.viewwidth, mainCx: WLM.centerx, drawPA170: WLD.pixelangle[170] }; }`,
].join("\n"));
await build({entryPoints:[e],outfile:o,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const m=await import(`${pathToFileURL(o).href}?c=${Date.now()}`);
m.BuildTables(); m.SetupWalls();
m.NewViewSize(15); console.log("after NewViewSize(15):", JSON.stringify(m.probe()));
m.NewViewSize(19); console.log("after NewViewSize(19):", JSON.stringify(m.probe()));
await rm(td,{recursive:true,force:true});
