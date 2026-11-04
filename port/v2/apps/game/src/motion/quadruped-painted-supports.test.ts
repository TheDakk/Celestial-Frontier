import fs from 'node:fs';import{it,expect}from'vitest';
import{compileBodyCard}from'./body-card.js';import{withPaintedContactSupports}from'./painted-supports.js';import{actionsFor}from'./family-actions.js';import{buildActionTimeline,buildTimeline,sampleTimeline}from'./timeline.js';import{createFamilyContactSolver,observedContactSupports}from'../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
for(const[id,actionId]of [['g2c87-20-striped-hyena','cast'],['c203creaturesupplyb-01-okapi','approach:gallop']] as const)it(id+' authors against the actual painted support offsets',()=>{
 const dir='audits/G1_AUTO_AUTHOR_20260926/auto-c221p2/'+id+'/fit/',read=(n:string)=>JSON.parse(fs.readFileSync(new URL(dir+n,root),'utf8')),r=read('record.json'),b=read('binding.json'),card=withPaintedContactSupports(compileBodyCard(r,r.genome),r,b),action=actionsFor('quadruped',card.anatomy)![actionId]!,raw=buildActionTimeline(card,action,card.identity.seed),next=buildTimeline(card,actionId,card.identity.seed),solver=createFamilyContactSolver(r,observedContactSupports(r,b));
 const failures=(tl:typeof raw)=>{let n=0;for(let i=0;i<=240;i++){const ms=tl.durationMs*i/240,p=sampleTimeline(tl,ms);try{solver.resolve({...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root},{actionId,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm});}catch{n++;}}return n;};
 expect(failures(raw)).toBeGreaterThan(0);expect(failures(next)).toBe(0);expect(next.phases).toEqual(raw.phases);expect(next.durationMs).toBe(raw.durationMs);expect(next.limitsRad).toEqual(raw.limitsRad);
 expect(()=>solver.resolve({root:{rotation:1,dy:2}},{actionId,elapsedMs:100,durationMs:next.durationMs,realm:card.realm})).toThrow();
});
