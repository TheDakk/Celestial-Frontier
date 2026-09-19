import fs from 'node:fs';import {it,expect} from 'vitest';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {familyContractForRecord,familyContactChains} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
const root=new URL('../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
it('terminal-only needs zero first correction; half endpoint and half terminal needs half the rigid correction',()=>{
 const r=structuredClone(read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records.quadruped),t=familyContractForRecord(r);
 for(const c of familyContactChains(t)){const a=r.landmarks[c.hip],b=r.landmarks[c.end];r.landmarks[c.knee]=[(a[0]+b[0])/2+.025,(a[1]+b[1])/2-.02];}
 const solver=createFamilyContactSolver(r),pose=solver.resolve({root:{rotation:0,dx:.001,dy:.01}},{actionId:'dodge',elapsedMs:200,durationMs:1000}).pose,matrices=createSkeletonPoseProgram(t,r.landmarks).evaluate(pose);
 for(const c of solver.chains){const rest=[c.endPoint.x+.004,c.endPoint.y+.004] as const,rigid=predictContactSupport({rest,weights:[[c.end,1]]},matrices),terminal=predictContactSupport({rest,weights:[[c.terminal!,1]]},matrices),half=predictContactSupport({rest,weights:[[c.end,.5],[c.terminal!,.5]]},matrices);
  expect(Math.hypot(terminal.x-rest[0],terminal.y-rest[1])).toBeLessThan(1e-12);
  expect(rest[0]-half.x).toBeCloseTo((rest[0]-rigid.x)*.5,12);expect(rest[1]-half.y).toBeCloseTo((rest[1]-rigid.y)*.5,12);
  expect(Math.hypot(rigid.x-rest[0],rigid.y-rest[1])).toBeGreaterThan(1e-6);
 }
});
it('reads every actual Civet triangle weight without changing binding data',()=>{
 const dir='audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/',r=read(dir+'record.json'),b=read(dir+'binding.json'),before=JSON.stringify(b),s=observedContactSupports(r,b),c=s.foreNearAnkle!;
 expect(c.weights.length).toBeGreaterThan(2);expect(c.weights.find(([j])=>j==='foreNearPaw')![1]).toBeGreaterThan(.8);expect(c.weights.find(([j])=>j==='foreNearAnkle')![1]).toBeLessThan(.2);
 expect(c.weights.reduce((sum,[,w])=>sum+w,0)).toBeCloseTo(1,14);expect(JSON.stringify(b)).toBe(before);
});
