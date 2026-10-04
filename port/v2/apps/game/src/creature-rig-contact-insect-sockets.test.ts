import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {familyContract,familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {resolveFixedAttachments} from '../../../tools/creature-animation/fixed-attachments.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {measureFamilyBounds} from '../../../tools/creature-animation/family-record.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
import {withPaintedContactSupports} from './motion/painted-supports.js';
import {buildTimeline,sampleTimeline} from './motion/timeline.js';
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

const root=new URL('../../../../../',import.meta.url),packet=new URL('audits/C202_ARTHROPOD_REFERENCES_20261004/11-beetle-relaxed-legs/fit01/',root),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,packet),'utf8'));
function beetle(){return{record:read('record.json'),binding:read('binding.json')};}
function sample(card:ReturnType<typeof compileBodyCard>,id:string,ms:number,weight=1){const timeline=buildTimeline(card,id,card.identity.seed),p=sampleTimeline(timeline,ms);return{timeline,pose:{...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation:rotation*weight}])),root:{...p.root,rotation:p.root.rotation*weight,dx:p.root.dx*weight,dy:p.root.dy*weight}},phase:{actionId:id,elapsedMs:ms,durationMs:timeline.durationMs,realm:card.realm,weight}};}
function withoutSteps(record:any,supports:Parameters<typeof createFamilyContactSolver>[1]){const t=familyContractForRecord(record),{travelSubsteps,...stance}=t.contactStance!,spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactStance:stance});try{return createFamilyContactSolver(record,supports);}finally{spy.mockRestore();}}
function physical(record:any,solver:ReturnType<typeof createFamilyContactSolver>,r:ReturnType<typeof solver.resolve>){expect(r.contacts).toHaveLength(6);expect(r.maxError).toBeLessThanOrEqual(1e-8);expect(r.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);expect(r.maxPaintTargetErrorPx).toBeLessThanOrEqual(.25);const t=familyContractForRecord(record),m=createSkeletonPoseProgram(t,record.landmarks).evaluate(r.pose);
 for(const c of solver.chains){const contact=r.contacts.find(x=>x.joint===c.end)!,h=transformPoint(m[c.hip]!,c.root),k=transformPoint(m[c.knee]!,c.joint),e=transformPoint(m[c.end]!,c.endPoint),paint=predictContactSupport(c.model,m);expect(Math.hypot(k.x-h.x,k.y-h.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,13);expect(Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height)).toBeLessThanOrEqual(.25);}
}
it('observed Beetle completes hit and translated tame return; old single-step owner fails the retained poses',()=>{
 const{record,binding}=beetle(),before=JSON.stringify({record,binding}),supports=observedContactSupports(record,binding),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),solver=createFamilyContactSolver(record,supports),old=withoutSteps(record,supports);
 const first=sample(card,'hit',352.5);expect(()=>old.resolve(first.pose,first.phase)).toThrow('exceeds scale compression bound');physical(record,solver,solver.resolve(first.pose,first.phase));
 for(const id of['hit','tame']){const tl=buildTimeline(card,id,card.identity.seed);for(let i=0;i<=128;i++){const s=sample(card,id,tl.durationMs*i/128);physical(record,solver,solver.resolve(s.pose,s.phase));physical(record,solver,solver.resolve(s.pose,{...s.phase,travel:'stage'}));}}
 const tl=buildTimeline(card,'tame',card.identity.seed);let oldReturnRefusals=0;for(let i=0;i<=64;i++){const s=sample(card,'tame',tl.durationMs+100,1-i/64);try{old.resolve(s.pose,s.phase);}catch{oldReturnRefusals++;}physical(record,solver,solver.resolve(s.pose,s.phase));}expect(oldReturnRefusals).toBeGreaterThan(0);
 expect(JSON.stringify({record,binding})).toBe(before);
});
it('observed dorsal feet swing toward real sockets on both sides, while stage hit keeps old results',()=>{
 const{record,binding}=beetle(),supports=observedContactSupports(record,binding),solver=createFamilyContactSolver(record,supports),old=withoutSteps(record,supports),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),seen=new Set<string>();let up=0,down=0;
 for(const elapsedMs of[250,750]){const r=solver.resolve({},{actionId:'approach:crawl',elapsedMs,durationMs:1000,realm:'land',travel:'stage'});for(const p of r.contacts.filter(x=>!x.stance)){const c=solver.chains.find(x=>x.end===p.joint)!,delta=p.target.y-c.endPoint.y;expect(Math.sign(delta)).toBe(Math.sign(c.root.y-c.endPoint.y));if(delta<0)up++;if(delta>0)down++;seen.add(c.end);}}
 expect(seen.size).toBe(6);expect(up).toBeGreaterThan(0);expect(down).toBeGreaterThan(0);
 for(const ms of[0,55,110,270,352.5,450]){const s=sample(card,'hit',ms),phase={...s.phase,travel:'stage'as const};expect(solver.resolve(s.pose,phase)).toEqual(old.resolve(s.pose,phase));}
 expect(familyContractForRecord(base).contactStance?.swingLift).toBeUndefined();expect(familyContractForRecord(base).contactStance?.travelSubsteps).toBeUndefined();
});
it.each([null,0,true,'2',{},[],{hit:1,tame:2},{hit:3,tame:2},{hit:2.5,tame:2},{hit:'2',tame:2},{hit:2},{hit:2,tame:2,dodge:2},{hit:2,tame:2,other:2},Object.create({hit:2,tame:2}),{hit:2,tame:2,[Symbol('x')]:2}])('refuses malformed or expanded observed-insect cadence (%j)',travelSubsteps=>{
 const{record}=beetle(),t=familyContractForRecord(record),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactStance:{...t.contactStance!,travelSubsteps}as any});try{expect(()=>createFamilyContactSolver(record)).toThrow('invalid travel substeps declaration');}finally{spy.mockRestore();}
});
it('preserves impossible offsets, source-step declaration and joint-limit refusals',()=>{
 const{record,binding}=beetle(),t=familyContractForRecord(record),supports=observedContactSupports(record,binding),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),s=sample(card,'hit',55);
 expect(()=>createFamilyContactSolver(record,supports).resolve({...s.pose,root:{...s.pose.root,dx:99}},s.phase)).toThrow('reach');
 for(const changed of[{...t,contactStance:{...t.contactStance!,travel:{hit:'source-steps'}}},{...t,contactStance:{...t.contactStance!,swingLift:'always-up'}}]){const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(changed as any);try{expect(()=>createFamilyContactSolver(record,supports)).toThrow(/invalid travel substeps declaration|invalid swing lift declaration/);}finally{spy.mockRestore();}}
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactLimitsDeg:{...t.limitsDeg,legFrontFarFoot:{min:0,max:0}}});try{expect(()=>createFamilyContactSolver(record,supports).resolve(s.pose,s.phase)).toThrow('joint limit');}finally{spy.mockRestore();}
});
