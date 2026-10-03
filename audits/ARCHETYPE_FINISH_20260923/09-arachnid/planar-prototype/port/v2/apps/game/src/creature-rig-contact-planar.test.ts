import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import * as planar from './creature-planar-contact.js';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
const root=new URL('../../../../../',import.meta.url),base='audits/ARCHETYPE_FINISH_20260923/09-arachnid/';
const read=(p:string)=>JSON.parse(fs.readFileSync(new URL(base+p,root),'utf8'));
const record=read('fit-02/record.json'),binding=read('fit-02/binding.json'),evidence=read('planar-feasibility-03.json');
const template=contracts.familyContractForRecord(record),supports=observedContactSupports(record,binding);
const withoutPlanar=()=>{const stance={...template.contactStance!};delete stance.rootAccommodation;return {...template,contactStance:stance};};
function using(t:typeof template,run:()=>void){const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(t);try{run();}finally{spy.mockRestore();}}
function failure(run:()=>unknown){let error:unknown;try{run();}catch(e){error=e;}expect(error).toBeInstanceOf(Error);return error as Error;}
it('admits the retained failed victory pose with all posterior contacts and independently conserved geometry',()=>{
 const before=JSON.stringify({record,binding,input:evidence.input}),solver=createFamilyContactSolver(record,supports),solved=solver.resolve(evidence.input,evidence.phase);
 expect('rootAccommodation' in solved&&solved.rootAccommodation).toBeTruthy();if(!('rootAccommodation'in solved)||!solved.rootAccommodation)throw Error('missing planar receipt');
 const receipt=solved.rootAccommodation,program=createSkeletonPoseProgram(template,record.landmarks),baseline=program.evaluate(evidence.input),matrices=program.evaluate(solved.pose),r={x:record.landmarks.root[0],y:record.landmarks.root[1]},a=transformPoint(baseline.root!,r),b=transformPoint(matrices.root!,r),actual={x:b.x-a.x,y:b.y-a.y};
 expect(receipt.translation).toEqual(actual);expect(receipt.norm).toBe(Math.hypot(actual.x,actual.y));expect(receipt.norm).toBeLessThanOrEqual(solver.scaleLength*.08);expect(actual.y).toBeGreaterThanOrEqual(0);expect(solved.compression).toBe(actual.y);
 expect(receipt.attemptedCandidates).toBe(2);expect(receipt.requestedTranslation).toEqual(evidence.admitted.delta);expect(solved.pose).toEqual(evidence.admitted.pose);
 expect(solved.pose.root!.rotation).toBe(evidence.input.root.rotation);expect(solved.contacts.map(c=>c.joint)).toEqual(['leg3FarFoot','leg3NearFoot','leg4FarFoot','leg4NearFoot']);
 expect(solved.contacts.every(c=>c.stance)).toBe(true);expect(solved.maxError).toBeLessThanOrEqual(1e-8);expect(solved.maxPaintTargetErrorPx).toBeLessThanOrEqual(.25);
 for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,h=transformPoint(matrices[c.hip]!,c.root),k=transformPoint(matrices[c.knee]!,c.joint),e=transformPoint(matrices[c.end]!,c.endPoint),paint=predictContactSupport(c.model,matrices);
  expect(Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);
  expect(Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height)).toBeLessThanOrEqual(.25);
  expect(Math.hypot(k.x-h.x,k.y-h.y)).toBeCloseTo(c.chain.lengths.upper,12);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,12);
  const bend=(e.x-h.x)*(k.y-h.y)-(e.y-h.y)*(k.x-h.x),source=(c.endPoint.x-c.root.x)*(c.joint.y-c.root.y)-(c.endPoint.y-c.root.y)*(c.joint.x-c.root.x);expect(Math.sign(bend)).toBe(Math.sign(source));
  for(const joint of [c.knee,c.end]){const limit=(template.contactLimitsDeg??template.limitsDeg)[joint]!,degrees=solved.pose[joint]!.rotation*180/Math.PI;expect(degrees).toBeGreaterThanOrEqual(limit.min-1e-7);expect(degrees).toBeLessThanOrEqual(limit.max+1e-7);}
 }
 for(const [joint,key] of Object.entries(evidence.input))if(joint!=='root'&&!/leg[34](Far|Near)(Knee|Foot)/.test(joint))expect(solved.pose[joint]).toEqual(key);
 expect(JSON.stringify({record,binding,input:evidence.input})).toBe(before);
});
it('preserves the exact non-opted refusal and its rigid fallback cause',()=>using(withoutPlanar(),()=>{
 const error=failure(()=>createFamilyContactSolver(record,supports).resolve(evidence.input,evidence.phase));expect(String(error)).toBe(evidence.oldRefusal.error);expect(String(error.cause)).toBe(evidence.oldRefusal.cause);expect((error.cause as Error).cause).toBeUndefined();
}));
it('does not enter the candidate planner for an already accepted pose',()=>{
 const phase={actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'},solver=createFamilyContactSolver(record,supports),spy=vi.spyOn(planar,'planarContactCandidates').mockImplementation(()=>{throw Error('old success entered planar');});
 try{const actual=solver.resolve({},phase);expect('rootAccommodation'in actual).toBe(false);using(withoutPlanar(),()=>expect(actual).toEqual(createFamilyContactSolver(record,supports).resolve({},phase)));}finally{spy.mockRestore();}
});
it('rejects an impossible external offset and preserves nested original causes without mutating the caller',()=>{
 const input={...evidence.input,root:{...evidence.input.root,dx:99}},before=JSON.stringify(input),error=failure(()=>createFamilyContactSolver(record,supports).resolve(input,evidence.phase));
 expect(error.message).toContain('reach');expect(error.cause).toBeInstanceOf(Error);const rigid=error.cause as Error;expect(rigid.message).toContain('rigid support');expect((rigid.cause as Error).message).toBe('Contact: no sampled admissible planar root candidate');expect(JSON.stringify(input)).toBe(before);
});
it('never treats an out-of-cap candidate or impossible local joint bound as an admitted solution',()=>{
 const solver=createFamilyContactSolver(record,supports),spy=vi.spyOn(planar,'planarContactCandidates').mockReturnValue([{x:solver.scaleLength*.16,y:0}]);
 try{const error=failure(()=>solver.resolve(evidence.input,evidence.phase)),planarError=(error.cause as Error).cause as Error&{attempts:Array<{reason:string}>};expect(planarError.attempts[0]!.reason).toContain('planar root exceeds accommodation bound');}finally{spy.mockRestore();}
 const limit=template.limitsDeg.leg3FarKnee!;using({...template,contactLimitsDeg:{...template.limitsDeg,leg3FarKnee:{...limit,min:0,max:0}}},()=>{
  const error=failure(()=>createFamilyContactSolver(record,supports).resolve(evidence.input,evidence.phase)),planarError=(error.cause as Error).cause as Error&{attempts:Array<{reason:string}>};expect(planarError.attempts.some(a=>a.reason.includes('joint limit leg3FarKnee'))).toBe(true);
 });
});
it('requires the exact support inventory and refuses mixed-weight fallback eligibility',()=>{
 const missing={...supports};delete missing.leg1FarFoot;expect(()=>createFamilyContactSolver(record,missing)).toThrow('exact painted support inventory');
 const mixed=Object.fromEntries(Object.entries(supports).map(([joint,s])=>[joint,{...s,vertices:s.vertices.map(v=>({...v,weights:[[joint,.5] as const,['cephalothorax',.5] as const]}))}])),solver=createFamilyContactSolver(record,mixed),spy=vi.spyOn(planar,'planarContactCandidates').mockImplementation(()=>{throw Error('mixed support entered planar');});
 try{expect(solver.chains.every(c=>!c.endpointOnly)).toBe(true);const error=failure(()=>solver.resolve(evidence.input,evidence.phase));expect(error.message).toContain('compression bound');expect(error.cause).toBeUndefined();}finally{spy.mockRestore();}
});
it.each([undefined,null,'vertical','planar-clamped'])('refuses unsupported explicit root accommodation (%j)',rootAccommodation=>using({...template,contactStance:{...template.contactStance!,rootAccommodation} as any},()=>expect(()=>createFamilyContactSolver(record,supports)).toThrow('unsupported root accommodation model')));
it('refuses the planar opt-in for a different family',()=>{
 const r=JSON.parse(fs.readFileSync(new URL('audits/ARCHETYPE_FINISH_20260923/04-insect/fit-04/record.json',root),'utf8')),t=contracts.familyContractForRecord(r);
 using({...t,contactStance:{...t.contactStance!,rootAccommodation:'planar'}},()=>expect(()=>createFamilyContactSolver(r)).toThrow('unsupported root accommodation model'));
});
