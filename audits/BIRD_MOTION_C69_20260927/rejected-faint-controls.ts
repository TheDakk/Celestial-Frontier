import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import * as envelopes from './stance-envelope.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from '../creature-rig-contact.js';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../../tools/creature-animation/kinematics.js';
const root=new URL('../../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const cases=['BIRD_MOTION_C69_20260927/inputs/c56-15-dove','G2_REFERENCES_C62_20260927/04-hawk-v2/fit-01'];
const poseAt=(tl:ReturnType<typeof buildTimeline>,ms:number)=>{const p=sampleTimeline(tl,ms);return{...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};};
it.each(cases)('authors a nonzero continuous faint within unchanged actual painted contacts: %s',dir=>{
 const r=read('audits/'+dir+'/record.json'),b=read('audits/'+dir+'/binding.json'),before=JSON.stringify({r,b}),card=compileBodyCard(r,r.genome),tl=buildTimeline(card,'faint',card.identity.seed);
 expect(tl.stanceEnvelope!.torsoGain).toBeGreaterThan(0);expect(tl.stanceEnvelope!.torsoGain).toBeLessThan(1);
 const template=familyContractForRecord(r),program=createSkeletonPoseProgram(template,r.landmarks),solver=createFamilyContactSolver(r,observedContactSupports(r,b));
 for(let i=0;i<=120;i++){
  const ms=tl.durationMs*i/120,phase={actionId:'faint',elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm},result=solver.resolve(poseAt(tl,ms),phase),m=program.evaluate(result.pose);
  expect(result.contacts).toHaveLength(2);expect(result.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);
  for(const c of solver.chains){
   const contact=result.contacts.find(x=>x.joint===c.end)!,paint=predictContactSupport(c.model,m),a=transformPoint(m[c.hip]!,c.root),k=transformPoint(m[c.knee]!,c.joint),e=transformPoint(m[c.end]!,c.endPoint);
   expect(Math.hypot((paint.x-contact.paintedTarget.x)*r.geometry.width,(paint.y-contact.paintedTarget.y)*r.geometry.height)).toBeLessThanOrEqual(.25);
   expect(Math.hypot(k.x-a.x,k.y-a.y)).toBeCloseTo(c.chain.lengths.upper,12);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,12);
   for(const j of[c.knee,c.end]){const bound=(template.contactLimitsDeg??template.limitsDeg)[j]!,deg=result.pose[j]!.rotation*180/Math.PI;expect(deg).toBeGreaterThanOrEqual(bound.min-1e-7);expect(deg).toBeLessThanOrEqual(bound.max+1e-7);}
  }
 }
 // Restore the actual old author, not a simulated guard failure.
 const spy=vi.spyOn(envelopes,'faintStanceEnvelope').mockReturnValue(null);let old:ReturnType<typeof buildTimeline>;
 try{const fresh=compileBodyCard(r,r.genome);old=buildTimeline(fresh,'faint',fresh.identity.seed);}finally{spy.mockRestore();}
 expect(old.durationMs).toBe(tl.durationMs);expect(old.secondary).toEqual(tl.secondary);
 for(const[j,keys]of Object.entries(tl.tracks))if(!['root','pelvis','spine','chest'].includes(j))expect(keys).toEqual(old.tracks[j]);
 let refused=0;for(let i=0;i<=120;i++){const ms=old.durationMs*i/120;try{solver.resolve(poseAt(old,ms),{actionId:'faint',elapsedMs:ms,durationMs:old.durationMs,realm:card.realm});}catch{refused++;}}
 expect(refused).toBeGreaterThan(0);expect(()=>solver.resolve({...poseAt(tl,tl.durationMs),root:{rotation:1,dy:2}},{actionId:'faint',elapsedMs:tl.durationMs,durationMs:tl.durationMs,realm:card.realm})).toThrow();
 expect(JSON.stringify({r,b})).toBe(before);
});

it('preserves the shipped Goose faint exactly when it already fits original endpoint limits',()=>{
 const r=read('audits/ART_BATTLE_FOCUS_20260925/15-goose/fit-02/record.json'),card=compileBodyCard(r,r.genome),actual=buildTimeline(card,'faint',card.identity.seed);
 const spy=vi.spyOn(envelopes,'faintStanceEnvelope').mockReturnValue(null);
 try{const old=compileBodyCard(r,r.genome);expect(actual).toEqual(buildTimeline(old,'faint',old.identity.seed));}finally{spy.mockRestore();}
});
