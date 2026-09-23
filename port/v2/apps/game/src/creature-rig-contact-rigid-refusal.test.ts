import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
const root=new URL('../../../../../',import.meta.url),base='audits/ARCHETYPE_FINISH_20260923/04-insect/';
const read=(p:string)=>JSON.parse(fs.readFileSync(new URL(base+p,root),'utf8'));
const record=read('fit-04/record.json'),binding=read('fit-04/binding.json'),evidence=read('contact-diagnosis-01.json');
// Keep the original all-six-planted condition explicit: action stance changes
// cannot make these numerical solver regressions pass by removing contacts.
function allSix(check:(solver:ReturnType<typeof createFamilyContactSolver>,template:any)=>void){
 const template={...contracts.familyContractForRecord(record),contactStance:{default:'all' as const,actions:{}}};
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(template);
 try{check(createFamilyContactSolver(record,observedContactSupports(record,binding)),template);}finally{spy.mockRestore();}
}
it('tries exact rigid paint after the measured iterative compression or joint-limit refusal',()=>allSix((solver,template)=>{
 const before=JSON.stringify({record,binding,evidence}),program=createSkeletonPoseProgram(template,record.landmarks);
 for(const id of ['cast','hit','victory','tame']){
  const sample=evidence.results.find((r:any)=>r.id===id);expect(sample.retainedErrorExact).toBe(true);
  const solved=solver.resolve(sample.attemptedPose,sample.phase),matrices=program.evaluate(solved.pose);
  expect(solved.contacts).toHaveLength(6);expect(solved.compression).toBeLessThanOrEqual(solver.scaleLength*.08);
  expect(solved.maxError).toBeLessThanOrEqual(1e-8);expect(solved.maxPaintTargetErrorPx).toBeLessThan(1e-7);
  for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,paint=predictContactSupport(c.model,matrices);
   expect(Math.hypot((paint.x-contact.paintedTarget.x)*1254,(paint.y-contact.paintedTarget.y)*1254),id+' '+c.end).toBeLessThan(1e-7);
   const hip=transformPoint(matrices[c.hip]!,c.root),knee=transformPoint(matrices[c.knee]!,c.joint),end=transformPoint(matrices[c.end]!,c.endPoint);
   expect(Math.hypot(knee.x-hip.x,knee.y-hip.y)).toBeCloseTo(c.chain.lengths.upper,12);
   expect(Math.hypot(end.x-knee.x,end.y-knee.y)).toBeCloseTo(c.chain.lengths.lower,12);
   for(const j of [c.knee,c.end]){const degrees=solved.pose[j]!.rotation*180/Math.PI,limit=template.limitsDeg[j];expect(degrees).toBeGreaterThanOrEqual(limit.min-1e-7);expect(degrees).toBeLessThanOrEqual(limit.max+1e-7);}
  }
 }
 expect(JSON.stringify({record,binding,evidence})).toBe(before);
}));
it('retains true rigid-support compression failures and rejects a mixed-weight substitute',()=>allSix((solver)=>{
 for(const id of ['dodge','presentation']){const s=evidence.results.find((r:any)=>r.id===id);expect(()=>solver.resolve(s.attemptedPose,s.phase)).toThrow('compression bound');}
 const supports=observedContactSupports(record,binding),changed=Object.fromEntries(Object.entries(supports).map(([j,s])=>[j,{...s,vertices:s.vertices.map(v=>({...v,weights:[[j,.5] as const,['thorax',.5] as const]}))}]));
 const mixed=createFamilyContactSolver(record,changed),sample=evidence.results.find((r:any)=>r.id==='cast');
 expect(mixed.chains.every(c=>!c.endpointOnly)).toBe(true);expect(()=>mixed.resolve(sample.attemptedPose,sample.phase)).toThrow(/Contact:/);
}));

it('independently rejects a rigid-eligible final joint limit and preserves both refusal causes',()=>allSix((solver,template)=>{
 const sample=evidence.results.find((r:any)=>r.id==='hit'),joint='legHindFarFoot';
 const analyticalDegrees=sample.analyticalCandidate.resolved.pose[joint].rotation*180/Math.PI;
 expect(solver.chains.every(c=>c.endpointOnly)).toBe(true);
 expect(solver.chains.some(c=>c.offset.x!==0||c.offset.y!==0)).toBe(true);
 expect(analyticalDegrees).toBeGreaterThan(template.limitsDeg[joint].min);
 // Tighten only this in-memory control. The real template and every numerical
 // admission bound on disk remain unchanged; neither solve may bypass the guard.
 const minimum=Math.ceil(analyticalDegrees);
 expect(minimum).toBeGreaterThan(analyticalDegrees);
 template.contactLimitsDeg={...template.limitsDeg,[joint]:{...template.limitsDeg[joint],min:minimum}};
 let refusal:unknown;
 try{solver.resolve(sample.attemptedPose,sample.phase);}catch(error){refusal=error;}
 expect(refusal).toBeInstanceOf(Error);
 const outer=refusal as Error;
 expect(String(outer)).toBe(sample.error);
 expect(outer.cause).toBeInstanceOf(Error);
 const final=outer.cause as Error;
 expect(final.message).toContain('Contact: joint limit '+joint);
 expect(final.message).not.toBe(outer.message);
}));
