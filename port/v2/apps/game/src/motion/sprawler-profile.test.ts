import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,buildActionTimeline,sampleTimeline} from './timeline.js';
import {actionsFor} from './family-actions.js';
import {isSprawler,sprawlerAction} from './sprawler-profile.js';
import {createFamilyContactSolver} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
const dir=new URL('audits/C163_SPRAWLER_MOTION_20261002/records/',root);
const records=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(new URL(f,dir),'utf8')));
const supports=JSON.parse(fs.readFileSync(new URL('../painted-supports.json',dir),'utf8'));
const pose=(t:ReturnType<typeof buildTimeline>,ms:number)=>{const p=sampleTimeline(t,ms);return {...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};};
it.each(records.map(r=>[r.identity.earthName,r] as const))('keeps the actual %s support geometry through every action',(_,r)=>{
 const c=compileBodyCard(r,r.genome),solver=createFamilyContactSolver(r,supports[r.identity.earthName]);expect(isSprawler(c)).toBe(true);
 for(const id of Object.keys(actionsFor(c.template.id,c.anatomy)!)){
  const t=buildTimeline(c,id,c.identity.seed);
  for(let i=0;i<=120;i++){const ms=t.durationMs*i/120;expect(()=>solver.resolve(pose(t,ms),{actionId:id,elapsedMs:ms,durationMs:t.durationMs,weight:1,realm:c.realm,...id.startsWith('melee:')?{travel:'stage' as const}:{}})).not.toThrow();}
 }
 const idle=buildTimeline(c,'idle',c.identity.seed);
 for(let i=0;i<=240;i++){const p=sampleTimeline(idle,idle.durationMs*i/240);expect(p.joints.head).toBe(0);expect(p.joints.neck).toBe(0);}
 expect(idle.secondary.some(s=>s.keys.some(k=>k.value!==0))).toBe(true);
});
it('retains refusal of the reported compression fault and externally excessive poses',()=>{
 const r=records.find(r=>r.identity.earthName==='Komodo Dragon')!,c=compileBodyCard(r,r.genome),a=actionsFor('quadruped',c.anatomy)!.hit!,old=buildActionTimeline(c,a,c.identity.seed),solver=createFamilyContactSolver(r,supports[r.identity.earthName]);let refusals=0;
 for(let i=0;i<=120;i++){const ms=old.durationMs*i/120;try{solver.resolve(pose(old,ms),{actionId:'hit',elapsedMs:ms,durationMs:old.durationMs,weight:1,realm:c.realm});}catch{refusals++;}}
 expect(refusals).toBeGreaterThan(0);expect(()=>solver.resolve({root:{rotation:1,dy:2}},{actionId:'hit',elapsedMs:200,durationMs:old.durationMs,weight:1,realm:c.realm})).toThrow();
 const n=buildTimeline(c,'hit',c.identity.seed);expect(n.phases).toEqual(old.phases);expect(n.durationMs).toBe(old.durationMs);expect(n.limitsRad).toEqual(old.limitsRad);
});
it('uses morphology independent of name, scale and seed; leaves tall and other-family actions intact',()=>{
 const r=records[0]!,c=compileBodyCard(r,r.genome),a=actionsFor('quadruped',c.anatomy)!.cast!;
 const renamed={...c,identity:{...c.identity,earthName:'Unknown',seed:987}};expect(sprawlerAction(renamed,a)).toEqual(sprawlerAction(c,a));
 const scaled={...c,bodyLength:c.bodyLength*.8,landmarks:Object.fromEntries(Object.entries(c.landmarks).map(([j,p])=>[j,[p[0]*.8,p[1]*.8] as const]))};expect(isSprawler(scaled)).toBe(true);
 expect(sprawlerAction({...c,realm:'aquatic'},a)).toBe(a);
 const tall={...c,landmarks:{...c.landmarks,foreNearAnkle:[c.landmarks.foreNearAnkle![0],c.landmarks.foreNearRoot![1]+c.bodyLength] as const}};expect(sprawlerAction(tall,a)).toBe(a);
 expect(buildTimeline(c,'cast',5)).toEqual(buildTimeline(JSON.parse(JSON.stringify(c)),'cast',5));
});
