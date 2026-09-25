import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,sampleTimeline,type MotionTimeline} from './timeline.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
const read=(fit:string,file:string)=>JSON.parse(fs.readFileSync(new URL(fit+'/'+file,root),'utf8'));
const base='audits/ART_BATTLE_FOCUS_20260925/';
const pose=(tl:MotionTimeline,ms:number)=>{const p=sampleTimeline(tl,ms);return {...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};};
it.each([
 ['quadruped-repair-04/lizard-fit-03','hit'],
 ['quadruped-repair-04/lizard-fit-03','tame'],
 ['14-brown-bear/fit-02','tame'],
])('keeps %s %s expressive and inside the unchanged contact guard',(fit,id)=>{
 const r=read(base+fit,'record.json'),b=read(base+fit,'binding.json'),card=compileBodyCard(r,r.genome),{contactGeometry:_,...legacy}=card;
 const before=buildTimeline(legacy,id,card.identity.seed),after=buildTimeline(card,id,card.identity.seed);
 expect(after.stanceEnvelope?.schema).toBe('cf.motion.contact-envelope/v1');
 expect(after.stanceEnvelope!.torsoGain).toBeGreaterThan(0);expect(after.stanceEnvelope!.torsoGain).toBeLessThan(1);
 expect(after.phases).toEqual(before.phases);expect(after.durationMs).toBe(before.durationMs);expect(after.secondary).toEqual(before.secondary);
 for(const[j,keys]of Object.entries(before.tracks))if(!['root','pelvis','spine','chest'].includes(j))expect(after.tracks[j]).toEqual(keys);
 // Compilation remains pure across JSON transport of the complete body card.
 expect(buildTimeline(JSON.parse(JSON.stringify(card)),id,card.identity.seed)).toEqual(after);
 for(const support of [{},observedContactSupports(r,b)]){
  const solver=createFamilyContactSolver(r,support);let originalRefusals=0;
  for(let i=0;i<=120;i++){
   const ms=after.durationMs*i/120,phase={actionId:id,elapsedMs:ms,durationMs:after.durationMs,weight:1,realm:card.realm};
   expect(()=>solver.resolve(pose(after,ms),phase)).not.toThrow();
   try{solver.resolve(pose(before,ms),phase);}catch{originalRefusals++;}
  }
  expect(originalRefusals).toBeGreaterThan(0);
 }
});
it.each([
 'audits/ANATOMY_SINGLE_RUN_20260919/R3-S/civet-input-01',
 base+'06-impala/fit-01',base+'07-marmot/fit-01',base+'09-cattle/fit-04',
])('preserves already admitted stationary motion byte-for-byte: %s',fit=>{
 const r=read(fit,'record.json'),card=compileBodyCard(r,r.genome),{contactGeometry:_,...legacy}=card;
 for(const id of ['hit','tame'])expect(JSON.stringify(buildTimeline(card,id,card.identity.seed))).toBe(JSON.stringify(buildTimeline(legacy,id,card.identity.seed)));
});

it('retains true seed provenance and recomputes after a card or curve changes',()=>{
 const r=read(base+'quadruped-repair-04/lizard-fit-03','record.json'),card=compileBodyCard(r,r.genome);
 const a=buildTimeline(card,'hit',1),b=buildTimeline(card,'hit',2);
 expect(a.stanceEnvelope).toEqual(b.stanceEnvelope);expect(a.seed).toBe(1);expect(b.seed).toBe(2);expect(a.hash).not.toBe(b.hash);
 // A mutable caller must not reuse a result measured against the prior geometry.
 const changed=card as unknown as {landmarks:Record<string,[number,number]>};
 changed.landmarks.foreNearRoot=[changed.landmarks.foreNearRoot![0]-.005,changed.landmarks.foreNearRoot![1]-.005];
 expect(buildTimeline(card,'hit',2)).toEqual(buildTimeline(JSON.parse(JSON.stringify(card)),'hit',2));
 const fresh=JSON.parse(JSON.stringify(compileBodyCard(r,r.genome))) as ReturnType<typeof compileBodyCard>,altered=fresh as unknown as {amplitudeProfile:{scales:Record<string,number>}};
 buildTimeline(fresh,'hit',3);altered.amplitudeProfile.scales.spine=(altered.amplitudeProfile.scales.spine??1)*.8;
 expect(buildTimeline(fresh,'hit',3)).toEqual(buildTimeline(JSON.parse(JSON.stringify(fresh)),'hit',3));
});
