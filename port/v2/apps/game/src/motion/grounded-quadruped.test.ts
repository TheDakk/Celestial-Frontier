import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,buildActionTimeline,sampleTimeline,type MotionTimeline} from './timeline.js';
import {actionsFor} from './family-actions.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url),base='audits/ART_BATTLE_FOCUS_20260925/';
const read=(fit:string,file:string)=>JSON.parse(fs.readFileSync(new URL(base+fit+'/'+file,root),'utf8'));
const pose=(tl:MotionTimeline,ms:number)=>{const p=sampleTimeline(tl,ms);return {...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};};
it.each(['approach:gallop','cast'])('keeps Salamander %s inside contact without erasing limb/expression motion',id=>{
 const r=read('26-salamander/fit-05','record.json'),b=read('26-salamander/fit-05','binding.json'),card=compileBodyCard(r,r.genome),action=actionsFor('quadruped',card.anatomy)![id]!;
 const before=buildActionTimeline(card,action,card.identity.seed),after=buildTimeline(card,id,card.identity.seed);
 expect(after.notes.some(n=>n.startsWith('grounded-quadruped:torso-gain='))).toBe(true);
 expect(after.phases).toEqual(before.phases);expect(after.durationMs).toBe(before.durationMs);expect(after.secondary).toEqual(before.secondary);
 for(const[j,keys]of Object.entries(before.tracks))if(!['root','pelvis','spine','chest'].includes(j))expect(after.tracks[j]).toEqual(keys);
 expect(after.tracks.spine).not.toEqual(before.tracks.spine);
 expect(buildTimeline(JSON.parse(JSON.stringify(card)),id,card.identity.seed)).toEqual(after);
 expect(buildActionTimeline(card,action,card.identity.seed)).toEqual(before);
 for(const support of [{},observedContactSupports(r,b)]){
  const solver=createFamilyContactSolver(r,support);let refused=0;
  for(let i=0;i<=240;i++){const ms=after.durationMs*i/240,phase={actionId:id,elapsedMs:ms,durationMs:after.durationMs,weight:1,realm:card.realm};
   expect(()=>solver.resolve(pose(after,ms),phase)).not.toThrow();try{solver.resolve(pose(before,ms),phase);}catch{refused++;}
  }expect(refused).toBeGreaterThan(0);
 }
});
it.each(['25-wild-horse/fit-05','18-ibex/fit-02','quadruped-repair-04/lizard-fit-03','interior-root-repair-05/impala-fit-02'])('preserves passing %s gallop/cast byte-for-byte',fit=>{
 const r=read(fit,'record.json'),card=compileBodyCard(r,r.genome);
 for(const id of ['approach:gallop','cast'])expect(buildTimeline(card,id,card.identity.seed)).toEqual(buildActionTimeline(card,actionsFor('quadruped',card.anatomy)![id]!,card.identity.seed));
});
it('invalidates the canonical cache after geometry changes and preserves seed provenance',()=>{
 const r=read('26-salamander/fit-05','record.json'),card=compileBodyCard(r,r.genome);const a=buildTimeline(card,'cast',1),b=buildTimeline(card,'cast',2);expect(a.seed).toBe(1);expect(b.seed).toBe(2);expect(a.hash).not.toBe(b.hash);expect(a.tracks).toEqual(b.tracks);
 const mutable=card as unknown as {landmarks:Record<string,[number,number]>};mutable.landmarks.foreNearRoot=[mutable.landmarks.foreNearRoot![0]-.005,mutable.landmarks.foreNearRoot![1]-.005];
 expect(buildTimeline(card,'cast',2)).toEqual(buildTimeline(JSON.parse(JSON.stringify(card)),'cast',2));
});
