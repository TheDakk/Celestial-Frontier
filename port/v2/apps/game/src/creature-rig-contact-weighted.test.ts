import fs from 'node:fs';import {it,expect} from 'vitest';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {familyContractForRecord,familyContactChains} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
const model=(rest:readonly[number,number],weights:ReadonlyArray<readonly[string,number]>)=>({rest,vertices:[{rest,barycentric:1,weights}]});
const root=new URL('../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
it('terminal-only needs zero first correction; half endpoint and half terminal needs half the rigid correction',()=>{
 const r=structuredClone(read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records.quadruped),t=familyContractForRecord(r);
 for(const c of familyContactChains(t)){const a=r.landmarks[c.hip],b=r.landmarks[c.end];r.landmarks[c.knee]=[(a[0]+b[0])/2+.025,(a[1]+b[1])/2-.02];}
 const solver=createFamilyContactSolver(r),pose=solver.resolve({root:{rotation:0,dx:.001,dy:.01}},{actionId:'hit',elapsedMs:200,durationMs:1000}).pose,matrices=createSkeletonPoseProgram(t,r.landmarks).evaluate(pose);
 for(const c of solver.chains){const rest=[c.endPoint.x+.004,c.endPoint.y+.004] as const,rigid=predictContactSupport(model(rest,[[c.end,1]]),matrices),terminal=predictContactSupport(model(rest,[[c.terminal!,1]]),matrices),half=predictContactSupport(model(rest,[[c.end,.5],[c.terminal!,.5]]),matrices);
  expect(Math.hypot(terminal.x-rest[0],terminal.y-rest[1])).toBeLessThan(1e-12);
  expect(rest[0]-half.x).toBeCloseTo((rest[0]-rigid.x)*.5,12);expect(rest[1]-half.y).toBeCloseTo((rest[1]-rigid.y)*.5,12);
  expect(Math.hypot(rigid.x-rest[0],rigid.y-rest[1])).toBeGreaterThan(1e-6);
 }
});
it('reads every actual Civet triangle weight without changing binding data',()=>{
 const dir='audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/',r=read(dir+'record.json'),b=read(dir+'binding.json'),before=JSON.stringify(b),s=observedContactSupports(r,b),c=s.foreNearAnkle!;
 const weights=new Map<string,number>();for(const v of c.vertices)for(const [j,w]of v.weights)weights.set(j,(weights.get(j)??0)+v.barycentric*w);const blended=[...weights];expect(blended.length).toBeGreaterThan(2);expect(blended.find(([j])=>j==='foreNearPaw')![1]).toBeGreaterThan(.8);expect(blended.find(([j])=>j==='foreNearAnkle')![1]).toBeLessThan(.2);
 expect(blended.reduce((sum,[,w])=>sum+w,0)).toBeCloseTo(1,14);expect(JSON.stringify(b)).toBe(before);
 const regenerated=read('audits/ANATOMY_SINGLE_RUN_20260919/R2c-double-prime/civet-input/binding.json'),unchanged=JSON.stringify(regenerated);expect(createFamilyContactSolver(r,observedContactSupports(r,regenerated)).chains).toHaveLength(4);expect(JSON.stringify(regenerated)).toBe(unchanged);
});

it('predicts per-vertex LBS before interpolation, rejecting the old weighted-point covariance',()=>{
 const rest=[.125,.15] as const,vertices=[{rest:[.1,.1] as const,barycentric:.25,weights:[['a',1] as const]},{rest:[.2,.1] as const,barycentric:.25,weights:[['b',1] as const]},{rest:[.1,.2] as const,barycentric:.5,weights:[['a',.5] as const,['b',.5] as const]}],matrices={a:[1,0,0,1,0,0] as const,b:[0,1,-1,0,.5,0] as const},p=predictContactSupport({rest,vertices},matrices);
 expect(p.x).toBeCloseTo(.225,14);expect(p.y).toBeCloseTo(.15,14);const old=predictContactSupport(model(rest,[['a',.5],['b',.5]]),matrices);expect(Math.hypot(p.x-old.x,p.y-old.y)*1000).toBeGreaterThan(1);
});

it('accepts stored edge rounding unchanged but rejects a genuinely negative barycentric coefficient',()=>{
 const dir='audits/ANATOMY_SINGLE_RUN_20260919/R2c-double-prime/civet-input/',r=read(dir+'record.json'),b=read(dir+'binding.json'),supports=observedContactSupports(r,b),support=supports.foreNearAnkle!,before=JSON.stringify(supports),noise=support.vertices.findIndex(v=>v.barycentric===-8.975276662232845e-16);
 expect(noise).toBe(1);const actual=createFamilyContactSolver(r,supports),zero={...supports,foreNearAnkle:{...support,vertices:support.vertices.map((v,i)=>({...v,barycentric:i===noise?0:v.barycentric}))}},control=createFamilyContactSolver(r,zero),matrices=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks).evaluate({root:{rotation:.2,dx:.01,dy:.02}}),a=predictContactSupport(actual.chains.find(c=>c.end==='foreNearAnkle')!.model,matrices),z=predictContactSupport(control.chains.find(c=>c.end==='foreNearAnkle')!.model,matrices);
 const predictionDifference=Math.hypot(a.x-z.x,a.y-z.y),pixelDifference=Math.hypot((a.x-z.x)*r.geometry.width,(a.y-z.y)*r.geometry.height);console.log(JSON.stringify({control:'stored edge noise versus positive zero',predictionDifference,pixelDifference,threshold:1e-12,thresholdUnits:'normalized prediction coordinates'}));expect(predictionDifference).toBeLessThanOrEqual(1e-12);expect(JSON.stringify(supports)).toBe(before);expect(actual.chains.find(c=>c.end==='foreNearAnkle')!.model.vertices[noise]!.barycentric).toBe(-8.975276662232845e-16);
 const mutant={...supports,foreNearAnkle:{...support,vertices:support.vertices.map((v,i)=>({...v,barycentric:i===noise?-1e-3:i===0?v.barycentric+1e-3+support.vertices[noise]!.barycentric:v.barycentric}))}};
 expect(()=>createFamilyContactSolver(r,mutant)).toThrow('invalid support weights');
});
