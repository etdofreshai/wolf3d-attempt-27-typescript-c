import { readFileSync } from "node:fs";
const buf=readFileSync("tmp/oracle-build/ORTRACE.BIN");
const REC=13744; const VBASE=150*60+64*64+320*2; // 13736
const i32=(o)=>buf[o]|(buf[o+1]<<8)|(buf[o+2]<<16)|(buf[o+3]<<24);
const player=(t)=>({x:i32(t*REC+16),y:i32(t*REC+20),ang:buf[t*REC+42]|(buf[t*REC+43]<<8)});
for(const T of [560,561,562,563]){
  const vx=i32(T*REC+VBASE), vy=i32(T*REC+VBASE+4); const p=player(T);
  console.log(`block ${T}: oracle viewx=${vx} viewy=${vy}  player x=${p.x} y=${p.y} ang=${p.ang}`);
}
