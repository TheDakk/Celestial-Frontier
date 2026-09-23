import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';

const root=new URL('../../../../../',import.meta.url);
const read=(name:string)=>JSON.parse(fs.readFileSync(new URL('audits/ARCHETYPE_REPAIRS_20260922/07-primate/'+name,root),'utf8'));
const record=read('fit-02/record.json'),binding=read('fit-02/binding.json'),evidence=read('contact-diagnosis-02.json');
const template=contracts.familyContractForRecord(record),supports=observedContactSupports(record,binding);
const source=(id:string)=>evidence.results.find((row:any)=>row.id===id);

it('releases both primate feet for the retained authored dodge and presentation poses without changing their keys',()=>{
 expect(record.recipeHash).toBe('49fcaa4a87a2c1210f5c4fa550ede4da2312a9f3d5ebea62d963db86ee20c3d9');
 expect(binding.bindingHash).toBe('7af573437412e3a82de82f412fb0320506a7e06b66b93afc19fc6411cf87ec43');
 const solver=createFamilyContactSolver(record,supports),before=JSON.stringify({record,binding,evidence});
 expect(solver.chains.map(c=>c.end).sort()).toEqual(['legFarFoot','legNearFoot']);
 for(const id of ['dodge','presentation']){const sample=source(id),input=sample.attemptedPose;
  expect(sample.phase.actionId).toBe('dodge');expect(input.root.dx).toBeLessThan(0);expect(input.root.dy).toBeLessThan(0);
  expect(input.legNearHip.rotation).not.toBe(0);expect(input.legFarHip.rotation).not.toBe(0);
  const solved=solver.resolve(input,sample.phase);expect(solved.contacts).toEqual([]);expect(solved.pose).toBe(input);
 }
 expect(JSON.stringify({record,binding,evidence})).toBe(before);
});

it('keeps the existing raw bounds on every released hip, knee and foot',()=>{
 const solver=createFamilyContactSolver(record,supports),sample=source('dodge');
 for(const chain of solver.chains)for(const joint of [chain.hip,chain.knee,chain.end]){
  const limit=template.limitsDeg[joint]!;
  for(const degrees of [limit.min-1,limit.max+1]){
   const pose={...sample.attemptedPose,[joint]:{rotation:degrees*Math.PI/180}};
   expect(()=>solver.resolve(pose,sample.phase)).toThrow('Contact: raw clip joint limit '+joint);
  }
 }
});

it('keeps all other primate action policies grounded, with both real painted foot constraints at faint rest',()=>{
 const solver=createFamilyContactSolver(record,supports),program=createSkeletonPoseProgram(template,record.landmarks);
 for(const id of ['idle','alert','approach:walk','melee:punch','melee:bite','cast','hit','faint','victory','tame','feed'])expect(contracts.contactStanceForAction(template,id)).toBe('all');
 for(const actionId of ['idle','faint']){
  const solved=solver.resolve({}, {actionId,elapsedMs:0,durationMs:520,realm:'land'}),matrices=program.evaluate(solved.pose);
  expect(solved.contacts.map(c=>c.joint).sort()).toEqual(['legFarFoot','legNearFoot']);
  for(const c of solved.contacts){expect(c.stance).toBe(true);const point=predictContactSupport(supports[c.joint]!,matrices);
   expect(Math.hypot((point.x-c.paintedTarget.x)*record.geometry.width,(point.y-c.paintedTarget.y)*record.geometry.height)).toBeLessThanOrEqual(.25);
  }
 }
});

it('the former all-foot policy fails the released-contact outcome and retains the measured presentation compression refusal',()=>{
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...template,contactStance:{default:'all',actions:{}}});
 try{const solver=createFamilyContactSolver(record,supports),rest=solver.resolve({}, {actionId:'dodge',elapsedMs:0,durationMs:280,realm:'land'});
  expect(rest.contacts.map(c=>c.joint).sort()).toEqual(['legFarFoot','legNearFoot']);expect(rest.contacts).not.toEqual([]);
  const sample=source('presentation');expect(()=>solver.resolve(sample.attemptedPose,sample.phase)).toThrow('compression bound');
 }finally{spy.mockRestore();}
});

it('faint still refuses the retained excessive compression and external impossible travel',()=>{
 const solver=createFamilyContactSolver(record,supports),sample=source('faint');
 expect(()=>solver.resolve(sample.attemptedPose,sample.phase)).toThrow('compression bound');
 expect(()=>solver.resolve({root:{rotation:0,dx:99}},sample.phase)).toThrow('reach');
});
