import fs from 'node:fs';import {it,expect} from 'vitest';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
const root=new URL('../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const dir='audits/VISION_D2_GUARDIAN_20260921/fit-01/',record=read(dir+'record.json'),binding=read(dir+'binding.json'),evidence=read('audits/BEAR_CONTACT_DIAGNOSTICS_20260922/bear-diagnostic.json'),supports=observedContactSupports(record,binding);
it('analytically plants the real rigid-support refusal samples without changing anatomical lengths or terminal orientation',()=>{
 const solver=createFamilyContactSolver(record,supports),program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),snapshot=JSON.stringify({record,binding,supports});
 for(const sample of evidence.bear.filter((r:any)=>r.id!=='approach:gallop')){
  const solved=solver.resolve(sample.input,sample.phase),matrices=program.evaluate(solved.pose);
  expect(solved.maxPaintTargetErrorPx,sample.id).toBeLessThan(1e-7);
  for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,actual=predictContactSupport(c.model,matrices);
   expect(Math.hypot((actual.x-contact.paintedTarget.x)*record.geometry.width,(actual.y-contact.paintedTarget.y)*record.geometry.height),sample.id+' '+c.end).toBeLessThan(1e-7);
   const hip=transformPoint(matrices[c.hip]!,c.root),knee=transformPoint(matrices[c.knee]!,c.joint),end=transformPoint(matrices[c.end]!,c.endPoint);
   expect(Math.hypot(knee.x-hip.x,knee.y-hip.y)).toBeCloseTo(c.chain.lengths.upper,12);
   expect(Math.hypot(end.x-knee.x,end.y-knee.y)).toBeCloseTo(c.chain.lengths.lower,12);
   if(c.terminal)expect(Math.atan2(matrices[c.terminal]![1],matrices[c.terminal]![0])).toBeCloseTo(0,12);
  }
 }
 expect(JSON.stringify({record,binding,supports})).toBe(snapshot);
});
it('retains exact rest and the independent gallop compression refusal',()=>{
 const solver=createFamilyContactSolver(record,supports),program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks);
 expect(program.evaluate(solver.resolve({},{actionId:'idle',elapsedMs:0,durationMs:1000}).pose)).toEqual(program.evaluate({}));
 const gallop=evidence.bear.find((r:any)=>r.id==='approach:gallop');expect(()=>solver.resolve(gallop.input,gallop.phase)).toThrow('exceeds scale compression bound');
 const sample=evidence.bear[0];expect(()=>solver.resolve({...sample.input,root:{rotation:0,dx:99}}, {...sample.phase,travel:'solver'})).toThrow('reach');
});
it('a diffused support cannot be silently treated as rigid endpoint paint',()=>{
 const changed=Object.fromEntries(Object.entries(supports).map(([j,s])=>[j,{...s,vertices:s.vertices.map(v=>({...v,weights:[['spine',1] as const]}))}])),solver=createFamilyContactSolver(record,changed),sample=evidence.bear.find((r:any)=>r.id==='alert');
 expect(solver.chains.every(c=>!c.endpointOnly)).toBe(true);expect(()=>solver.resolve(sample.input,sample.phase)).toThrow(/Contact:/);
});
