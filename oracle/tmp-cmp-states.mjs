import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const TS = "apps/source-typescript/src/WOLFSRC";

// --- parse original state definitions ---
const cFiles = ["WL_ACT2.C", "WL_STATE.C", "WL_ACT1.C", "WL_AGENT.C", "WL_GAME.C", "WL_PLAY.C"];
const orig = new Map();
for (const f of cFiles) {
  let txt;
  try { txt = await readFile(`source/WOLFSRC/${f}`, "utf8"); } catch { continue; }
  const re = /statetype\s+(s_\w+)\s*=\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(txt))) {
    const name = m[1];
    const fl = m[2].split(",").map((s) => s.trim());
    const tictime = parseInt(fl[2], 10);
    const think = fl[3] === "NULL" ? null : fl[3];
    const action = fl[4] === "NULL" ? null : fl[4];
    let next = fl[5];
    next = (!next || next === "NULL") ? null : next.replace(/^&/, "");
    orig.set(name, { tictime, think, action, next });
  }
}

// --- bundle port and read STATE_DEFINITIONS ---
const tempDir = await mkdtemp(path.join(os.tmpdir(), "wolf-states-"));
const entry = path.join(tempDir, "e.ts");
const out = path.join(tempDir, "e.mjs");
const rel = (p) => {
  let r = path.relative(tempDir, p).split(path.sep).join("/");
  return r.startsWith(".") ? r : "./" + r;
};
await writeFile(entry, `export { STATE_DEFINITIONS } from "${rel(path.resolve(TS, "TS_LEVEL_SETUP.ts"))}";`);
await build({ entryPoints: [entry], outfile: out, bundle: true, format: "esm", platform: "node", logLevel: "silent" });
const mod = await import(`${pathToFileURL(out).href}?c=${Date.now()}`);
const port = mod.STATE_DEFINITIONS;
await rm(tempDir, { recursive: true, force: true });

const norm = (s) => (s ? s.replace(/^_/, "") : null);
let ticMis = 0, nextMis = 0, thinkMis = 0, actMis = 0, missing = 0;
const ticZero = [], nextBad = [], thinkBad = [], actBad = [];
for (const [name, o] of orig) {
  const p = port["_" + name];
  if (!p) { missing++; continue; }
  if (p.tictime !== o.tictime) {
    ticMis++;
    if ((o.tictime === 0) !== (p.tictime === 0)) ticZero.push(`${name}: orig=${o.tictime} port=${p.tictime}`);
  }
  const pn = norm(p.next), pt = norm(p.think), pa = norm(p.action);
  if (pn !== o.next) { nextMis++; nextBad.push(`${name}: orig.next=${o.next} port.next=${pn}`); }
  if (pt !== o.think) { thinkMis++; thinkBad.push(`${name}: orig.think=${o.think} port.think=${pt}`); }
  if (pa !== o.action) { actMis++; actBad.push(`${name}: orig.action=${o.action} port.action=${pa}`); }
}
console.log(`orig states=${orig.size} port states=${Object.keys(port).length} missing-in-port=${missing}`);
console.log(`tictime mismatches=${ticMis} (zero-flips=${ticZero.length})`);
ticZero.forEach((s) => console.log("  ZERO-FLIP " + s));
console.log(`next-link mismatches=${nextMis}`);
nextBad.slice(0, 25).forEach((s) => console.log("  " + s));
console.log(`think mismatches=${thinkMis}`);
thinkBad.slice(0, 25).forEach((s) => console.log("  " + s));
console.log(`action mismatches=${actMis}`);
actBad.slice(0, 25).forEach((s) => console.log("  " + s));
