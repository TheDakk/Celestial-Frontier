import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport,type WeightedContactSupport} from './creature-rig-contact.js';
const root=new URL('../../../../../',import.meta.url),packet=new URL('audits/ARCHETYPE_FINISH_20260923/12-myriapod/',root);
const read=(name:string)=>JSON.parse(fs.readFileSync(new URL(name,packet),'utf8'));
const record=read('fit-06/record.json'),binding=read('fit-06/binding.json'),diagnosis=read('static-contact-diagnosis02.json'),prior=read('static-paint-diagnosis03/report.json');
const supports=observedContactSupports(record,binding),template=contracts.familyContractForRecord(record);
function errorOf(run:()=>unknown):Error{try{run();}catch(error){expect(error).toBeInstanceOf(Error);return error as Error;}throw Error('Expected refusal');}
function physical(solver:ReturnType<typeof createFamilyContactSolver>,result:ReturnType<typeof solver.resolve>){
 const matrices=createSkeletonPoseProgram(template,record.landmarks).evaluate(result.pose);
 expect(result.contacts).toHaveLength(28);expect(result.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);expect(result.maxError).toBeLessThanOrEqual(1e-8);expect(result.maxPaintTargetErrorPx).toBeLessThanOrEqual(.25);
 for(const contact of result.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,hip=transformPoint(matrices[c.hip]!,c.root),knee=transformPoint(matrices[c.knee]!,c.joint),end=transformPoint(matrices[c.end]!,c.endPoint),paint=predictContactSupport(c.model,matrices);
  expect(Math.hypot(knee.x-hip.x,knee.y-hip.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(end.x-knee.x,end.y-knee.y)).toBeCloseTo(c.chain.lengths.lower,13);
  expect(Math.hypot(end.x-contact.endpointTarget.x,end.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height)).toBeLessThanOrEqual(.25);
  for(const joint of[c.knee,c.end]){const l=(template.contactLimitsDeg??template.limitsDeg)[joint]!,deg=result.pose[joint]!.rotation*180/Math.PI;expect(deg).toBeGreaterThanOrEqual(l.min-1e-7);expect(deg).toBeLessThanOrEqual(l.max+1e-7);}
 }
}
it.each(['hit','dodge'])('admits the retained %s failure only with all 28 actual weighted supports and original physical guards',id=>{
 expect(record.recipeHash).toBe(diagnosis.recordRecipeHash);expect(binding.bindingHash).toBe(diagnosis.bindingHash);const row=diagnosis.results.find((r:any)=>r.id===id),solver=createFamilyContactSolver(record,supports),before=JSON.stringify({record,binding,supports,pose:row.attemptedPose});
 expect(row.retainedErrorExact).toBe(true);expect(row.error).toContain('outside accommodatable reach');expect(solver.chains.filter(c=>!c.endpointOnly).map(c=>c.id)).toEqual(['leg0Far','leg8Far','leg12Far']);
 const solved=solver.resolve(row.attemptedPose,row.phase);physical(solver,solved);expect(JSON.stringify({record,binding,supports,pose:row.attemptedPose})).toBe(before);
 // The nonzero foreign contribution remains present and the support is never
 // reclassified, even though its provisional geometric candidate is admissible.
 const c=solver.chains.find(c=>c.id==='leg0Far')!;expect(c.endpointOnly).toBe(false);expect(c.model.vertices.some(v=>v.barycentric!==0&&v.weights.some(([j])=>j==='leg1NearFoot'))).toBe(true);
});
it('preserves complete successful iterative results byte-for-byte from the pre-change owner',()=>{
 expect(record.recipeHash).toBe(prior.recordRecipeHash);expect(binding.bindingHash).toBe(prior.bindingHash);const solver=createFamilyContactSolver(record,supports);
 for(const row of prior.findings){expect(row.reconstructedContactEqualsRecorded).toBe(true);expect(JSON.stringify(solver.resolve(row.rawPose,row.phase))).toBe(JSON.stringify(row.firstRefusal.contact));}
});
function heavySupports(){const changed:Record<string,WeightedContactSupport>={...supports},j='leg0FarFoot',s=changed[j]!;changed[j]={...s,vertices:s.vertices.map(v=>({...v,weights:[[j,.5],['root',.5]]}))};return changed;}
it('rejects a heavy foreign contribution through actual LBS after an otherwise legal geometric candidate',()=>{
 const changed=heavySupports(),solver=createFamilyContactSolver(record,changed),row=diagnosis.results.find((r:any)=>r.id==='dodge'),before=JSON.stringify({changed,pose:row.attemptedPose}),error=errorOf(()=>solver.resolve(row.attemptedPose,row.phase));
 expect(String(error)).toBe(row.error);expect(String(error.cause)).toMatch(/painted support candidate residual/);expect(Number(String(error.cause).split(' ').at(-1))).toBeGreaterThan(.25);expect(JSON.stringify({changed,pose:row.attemptedPose})).toBe(before);
 // A rejected call cannot leak its partially solved pose or failed targets into
 // the next call. The same heavy model is legal at its explicitly fixed rest.
 const rest=solver.resolve({},{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'});physical(solver,rest);
});
it('preserves impossible external translations and both original/candidate refusal causes',()=>{
 const solver=createFamilyContactSolver(record,supports),row=diagnosis.results[0],pose={...row.attemptedPose,root:{...row.attemptedPose.root,dx:99}},error=errorOf(()=>solver.resolve(pose,row.phase));
 expect(error.message).toContain('outside accommodatable reach');expect(String(error.cause)).toContain('support candidate outside accommodatable reach');expect(pose.root.dx).toBe(99);
});
it('a legal support candidate cannot bypass original joint limits',()=>{
 const row=diagnosis.results.find((r:any)=>r.id==='hit'),changed={...template,contactLimitsDeg:{...template.limitsDeg,leg13FarFoot:{min:0,max:0}}},spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(changed);
 try{const error=errorOf(()=>createFamilyContactSolver(record,supports).resolve(row.attemptedPose,row.phase));expect(String(error)).toBe(row.error);expect(String(error.cause)).toContain('joint limit leg13FarFoot');}finally{spy.mockRestore();}
});
