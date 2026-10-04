import fs from 'node:fs';
import {expect,it} from 'vitest';
import {familyContract,familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {resolveFixedAttachments} from '../../../tools/creature-animation/fixed-attachments.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {measureFamilyBounds} from '../../../tools/creature-animation/family-record.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,predictContactSupport} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
const base=JSON.parse(fs.readFileSync(new URL('../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records.insect;
function fixture(){
 const r=structuredClone(base);r.geometry.fixedAttachments={};
 for(const [i,id]of ['legFrontFar','legMidFar','legHindFar','legFrontNear','legMidNear','legHindNear'].entries()){
  const x=.64-(i%3)*.1,y=i<3?.50:.54;
  r.geometry.fixedAttachments[id+'Knee']=[x,y];r.landmarks[id+'Knee']=[x+.07,y+.09];r.landmarks[id+'Foot']=[x-.025,y+.20];
 }
 return r;
}
it('six observed sockets bind skeleton, admission, card and all planted contacts without extra joints',()=>{
 const r=fixture(),before=JSON.stringify(r),definition=familyContractForRecord(r),program=createSkeletonPoseProgram(definition,r.landmarks),card=compileBodyCard(r),bounds=measureFamilyBounds(definition,r.landmarks),solver=createFamilyContactSolver(r);
 expect(definition.anatomyModel).toBe('insect-observed-sockets-v1');expect(definition.joints).toHaveLength(21);expect(solver.chains).toHaveLength(6);
 const solved=solver.resolve({root:{rotation:0,dx:.001,dy:0}},{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'}),matrices=program.evaluate(solved.pose);
 expect(solved.contacts).toHaveLength(6);expect(solved.contacts.every(c=>c.stance)).toBe(true);expect(solved.maxError).toBeLessThanOrEqual(1e-8);
 for(const c of solver.chains){
  const socket=r.geometry.fixedAttachments[c.knee],part=card.parts.find(p=>p.joint===c.knee)!,contact=solved.contacts.find(p=>p.joint===c.end)!;
  expect(c.root).toEqual({x:socket[0],y:socket[1]});expect(program.pivot(c.knee)).toEqual(c.root);expect(part.pivot).toEqual(socket);expect(part.boneLength).toBe(bounds.boneLengths[c.knee]);expect(c.chain.lengths.upper).toBe(part.boneLength);
  const a=transformPoint(matrices[c.hip]!,c.root),k=transformPoint(matrices[c.knee]!,c.joint),end=transformPoint(matrices[c.end]!,c.endPoint),paint=predictContactSupport(c.model,matrices);
  expect(Math.hypot(k.x-a.x,k.y-a.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(end.x-k.x,end.y-k.y)).toBeCloseTo(c.chain.lengths.lower,13);expect(Math.hypot(end.x-contact.endpointTarget.x,end.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((paint.x-contact.paintedTarget.x)*r.geometry.width,(paint.y-contact.paintedTarget.y)*r.geometry.height)).toBeLessThanOrEqual(.25);
 }
 expect(JSON.stringify(r)).toBe(before);
});
it('incomplete, added, off-source and source-substituted sockets refuse instead of falling back to thorax',()=>{
 const r=fixture(),d=familyContract('insect');
 const missing=structuredClone(r);delete missing.geometry.fixedAttachments.legHindNearKnee;expect(()=>compileBodyCard(missing)).toThrow(/socket inventory/);expect(()=>createFamilyContactSolver(missing)).toThrow(/socket inventory/);
 const extra=structuredClone(r);extra.geometry.fixedAttachments.extra=[.5,.5];expect(()=>familyContractForRecord(extra)).toThrow(/socket inventory/);
 const alpha=new Uint8Array(r.geometry.width*r.geometry.height);for(const p of Object.values(r.geometry.fixedAttachments)as number[][])alpha[Math.floor(p[1]! *r.geometry.height)*r.geometry.width+Math.floor(p[0]! *r.geometry.width)]=255;
 expect(resolveFixedAttachments(d,r,alpha).fixedPivots).toBeDefined();alpha.fill(0);expect(()=>resolveFixedAttachments(d,r,alpha)).toThrow(/outside painted alpha/);
 const resolved=familyContractForRecord(r),changed=structuredClone(r);changed.geometry.fixedAttachments.legFrontFarKnee[0]+=.001;expect(()=>resolveFixedAttachments(resolved,changed)).toThrow(/differ from source/);
 expect(()=>createFamilyContactSolver(r).resolve({root:{rotation:0,dx:99}},{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'})).toThrow(/reach/);
});
it('undeclared legacy insects retain original graph, limits, pivot matrices and contact model',()=>{
 const original=familyContract('insect'),resolved=familyContractForRecord(base);expect(resolveFixedAttachments(original,base)).toBe(original);expect(resolved).toEqual(original);
 const a=createSkeletonPoseProgram(original,base.landmarks),b=createSkeletonPoseProgram(resolved,base.landmarks),pose={root:{rotation:.02},legMidNearKnee:{rotation:.03}};expect(b.evaluate(pose)).toEqual(a.evaluate(pose));for(const id of original.legs)expect(b.pivot(id+'Knee')).toEqual({x:base.landmarks.thorax[0],y:base.landmarks.thorax[1]});
 expect(resolved.limitsDeg).toEqual(original.limitsDeg);expect(resolved.bounds).toBe(original.bounds);
});
