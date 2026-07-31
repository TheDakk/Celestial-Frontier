/* Fleet runner — one worker process, a slice of the session plan.
   Usage: node fleet.mjs <workerIndex> <workerCount> <planFile> <outJsonl>
   Appends one JSON line per finished session so partial results always survive. */
import { runSession, launch } from './bot9.mjs';
import fs from 'fs';

const [,, wiRaw, wcRaw, planFile, outFile] = process.argv;
const wi = +wiRaw, wc = +wcRaw;
const plan = JSON.parse(fs.readFileSync(planFile,'utf8'));
const mine = plan.filter((_,i)=> i % wc === wi);

// resume: skip anything already recorded
const done = new Set();
if (fs.existsSync(outFile)){
  for (const line of fs.readFileSync(outFile,'utf8').split('\n')){
    if(!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch(_){}
  }
}
const todo = mine.filter(c=>!done.has(c.id));
console.error(`[w${wi}] ${todo.length} sessions (of ${mine.length}; ${mine.length-todo.length} already done)`);

let br = await launch();
let sinceRestart = 0;
const t0 = Date.now();

for (let i=0;i<todo.length;i++){
  const cfg = todo[i];
  let rec;
  try {
    rec = await Promise.race([
      runSession(cfg, br),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('session-timeout')), cfg.budgetMs + 90000)),
    ]);
  } catch(e){
    rec = { id:cfg.id, persona:cfg.persona, device:cfg.device, tier:cfg.tier,
            ok:false, fatal:String(e.message).slice(0,120) };
    // a timed-out session can leave the browser wedged — restart it
    try { await br.close(); } catch(_){}
    br = await launch(); sinceRestart = 0;
  }
  fs.appendFileSync(outFile, JSON.stringify(rec)+'\n');

  // periodic browser recycle keeps memory flat over a long run
  if (++sinceRestart >= 40){
    try { await br.close(); } catch(_){}
    br = await launch(); sinceRestart = 0;
  }
  if ((i+1) % 10 === 0){
    const rate = (Date.now()-t0)/(i+1);
    console.error(`[w${wi}] ${i+1}/${todo.length}  ${(rate/1000).toFixed(1)}s/session  eta ${((todo.length-i-1)*rate/60000).toFixed(0)}min`);
  }
}
try { await br.close(); } catch(_){}
console.error(`[w${wi}] complete in ${((Date.now()-t0)/60000).toFixed(1)} min`);
