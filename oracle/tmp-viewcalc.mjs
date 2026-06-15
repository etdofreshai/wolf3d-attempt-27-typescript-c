import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url"; import { build } from "esbuild";
const repoRoot=process.cwd(); const targetDir=path.join(repoRoot,"apps/source-typescript/src/WOLFSRC");
const tempDir=await mkdtemp(path.join(os.tmpdir(),"wvc-")); const entry=path.join(tempDir,"e.ts"); const out=path.join(tempDir,"e.mjs");
const rel=(p)=>{let r=path.relative(tempDir,p).split(path.sep).join("/");return r.startsWith(".")?r:"./"+r;};
await writeFile(entry,[
 `export { BuildTables, SetupWalls, NewViewSize, focallength } from "${rel(path.join(targetDir,"WL_MAIN.C.ts"))}";`,
 `export { sintable, costable, FixedByFrac } from "${rel(path.join(targetDir,"WL_DRAW.C.ts"))}";`,
].join("\n"));
await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",logLevel:"silent"});
const mod=await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
mod.BuildTables(); mod.SetupWalls(); mod.NewViewSize(19);
const A=189, px=3120481, py=3037963;
const vcos=mod.costable[A], vsin=mod.sintable[A], fl=mod.focallength;
const cosTerm=mod.FixedByFrac(fl, vcos), sinTerm=mod.FixedByFrac(fl, vsin);
const vx=(px - cosTerm)|0, vy=(py + sinTerm)|0;
console.log(`port: focallength=${fl} costable[189]=${vcos} sintable[189]=${vsin}`);
console.log(`port: FixedByFrac(fl,cos)=${cosTerm} (oracle=-21997)  FixedByFrac(fl,sin)=${sinTerm} (oracle=-3484)`);
console.log(`port: viewx=${vx} (oracle=3142478)  viewy=${vy} (oracle=3034479)`);
console.log(`MATCH viewx=${vx===3142478} viewy=${vy===3034479}`);
await rm(tempDir,{recursive:true,force:true});
