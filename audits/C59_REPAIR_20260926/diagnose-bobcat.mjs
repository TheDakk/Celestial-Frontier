import fs from 'node:fs';import{createHash}from'node:crypto';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rows=['audits/G1_AUTO_AUTHOR_20260926/native-g2c56/c56-04-bobcat/report.json','audits/C59_REPAIR_20260926/bobcat-profile/report.json'].map(path=>{
 const r=JSON.parse(fs.readFileSync(path)),c=r.capture,byPhase={};
 for(const f of c.frameSamples){const k=`turn${f.turn}:${f.phase}`;(byPhase[k]??=[]).push(f.cpuMs);}
 const phases=Object.fromEntries(Object.entries(byPhase).map(([k,v])=>{v.sort((a,b)=>a-b);return[k,{frames:v.length,cpuP95Ms:v[Math.floor(v.length*.95)],cpuMaxMs:v.at(-1)}];}));
 return {path,sha256:sha(path),error:r.error,plannedDurationMs:c.plannedDurationMs,frames:c.frames,requiredFrames:Math.ceil(c.plannedDurationMs/1000*57)+1,refusals:c.refusalsAtEnd,phases,encoded:c.encodedMedia};
});
fs.writeFileSync(new URL('./bobcat-diagnosis.json',import.meta.url),JSON.stringify({schema:'cf.c59-bobcat-diagnosis/v1',rows,profile:'bobcat-profile/cpu-breakdown.json',conclusion:'Real live-frame shortfall reproduced at 4x CPU, not a count/instrument false alarm. Last lethal reaction, return and idle trigger expensive ARAP/orientation deformation. Zero rig refusals means the expensive solver succeeded, not that frames arrived on time. Aggregate p95 hides the short late stall. No threshold, capture-time or solver-limit change; no acceptance.',next:'Inspect the faint-pose shape field and source ownership; the captured profile attributes the cost to ARAP and orientation WASM. Keep Bobcat native RED until a changed source passes the same full timeline.'},null,2)+'\n');
