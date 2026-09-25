import {it,expect} from 'vitest';
import fs from 'node:fs';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,sampleTimeline,type MotionTimeline} from './timeline.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
const read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const paths=['04-wall-lizard/fit-06','cougar-repair-03/fit-01','06-impala/fit-01','07-marmot/fit-01','09-cattle/fit-04'];
const directory=(p:string)=>'audits/ART_BATTLE_FOCUS_20260925/'+p;
const poseAt=(tl:MotionTimeline,ms:number)=>{const p=sampleTimeline(tl,ms);return {...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};};
it.each(paths)('keeps the actual painted contacts inside unchanged faint limits for %s',(p)=>{
 const r=read(directory(p)+'/record.json'),b=read(directory(p)+'/binding.json'),c=compileBodyCard(r,r.genome),tl=buildTimeline(c,'faint',c.identity.seed),gain=tl.stanceEnvelope!.torsoGain;
 expect(gain).toBeGreaterThan(0);expect(gain).toBeLessThan(1);
 for(const support of [{},observedContactSupports(r,b)]){const solver=createFamilyContactSolver(r,support);for(let i=0;i<=120;i++)expect(()=>solver.resolve(poseAt(tl,i*tl.durationMs/120),{actionId:'faint',elapsedMs:i*tl.durationMs/120,durationMs:tl.durationMs,weight:1,realm:c.realm})).not.toThrow();}
 // Negative control restores the old excursion, leaving the guard untouched.
 const old={...tl,tracks:Object.fromEntries(Object.entries(tl.tracks).map(([j,keys])=>[j,['root','pelvis','spine','chest'].includes(j)?keys.map(k=>({...k,value:k.value/gain})):keys])),root:{dx:tl.root.dx.map(k=>({...k,value:k.value/gain})),dy:tl.root.dy.map(k=>({...k,value:k.value/gain}))}};
 const solver=createFamilyContactSolver(r,observedContactSupports(r,b));let failures=0;for(let i=0;i<=120;i++){try{solver.resolve(poseAt(old,i*old.durationMs/120),{actionId:'faint',elapsedMs:i*old.durationMs/120,durationMs:old.durationMs,weight:1,realm:c.realm});}catch{failures++;}}expect(failures).toBeGreaterThan(0);
 // Retargeting never permits an externally supplied over-limit pose.
 expect(()=>solver.resolve({...poseAt(tl,tl.durationMs),root:{rotation:1,dy:2}},{actionId:'faint',elapsedMs:tl.durationMs,durationMs:tl.durationMs,weight:1,realm:c.realm})).toThrow();
});
it('preserves Civet, other actions, timing, scale invariance and source identity independence',()=>{
 const civet=read('audits/ANATOMY_SINGLE_RUN_20260919/R3-S/civet-input-01/record.json'),c=compileBodyCard(civet,civet.genome);expect(buildTimeline(c,'faint',c.identity.seed).stanceEnvelope).toBeUndefined();
 const r=read(directory(paths[1]!)+'/record.json'),card=compileBodyCard(r,r.genome),tl=buildTimeline(card,'faint',card.identity.seed);
 expect(buildTimeline(card,'approach:walk',card.identity.seed).stanceEnvelope).toBeUndefined();
 const scaled={...r,landmarks:Object.fromEntries(Object.entries(r.landmarks as Record<string,number[]>).map(([j,p])=>[j,p.map(v=>.5+(v-.5)*.8)]))},renamed={...r,habitat:{realm:card.realm,gait:card.locomotion.gait,source:'geometry-invariance test declaration'},identity:{...r.identity,earthName:'Unlisted fixture',seed:125}};
 for(const x of [scaled,renamed]){const other=compileBodyCard(x,x.genome),t=buildTimeline(other,'faint',other.identity.seed);expect(t.stanceEnvelope).toEqual(tl.stanceEnvelope);expect(t.phases).toEqual(tl.phases);expect(t.durationMs).toBe(tl.durationMs);}
 const air=buildTimeline({...card,realm:'aerial'},'faint',card.identity.seed);expect(air.stanceEnvelope).toBeUndefined();
 expect(tl.durationMs).toBe(air.durationMs);expect(tl.secondary).toEqual(air.secondary);
 for(const[j,keys]of Object.entries(tl.tracks))if(!['root','pelvis','spine','chest'].includes(j))expect(keys).toEqual(air.tracks[j]);
});

it('does not invent a bend for an existing straight-leg preview or bypass contact admission',()=>{
 const r=read(directory(paths[1]! )+'/record.json'),a=r.landmarks.foreNearRoot,b=r.landmarks.foreNearAnkle;r.landmarks.foreNearKnee=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const c=compileBodyCard(r,r.genome);expect(buildTimeline(c,'faint',c.identity.seed).stanceEnvelope).toBeUndefined();expect(()=>createFamilyContactSolver(r)).toThrow('source bend direction missing');
});
