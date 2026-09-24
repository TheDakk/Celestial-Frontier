/** One retained real return-phase control; no ARAP, film or complete presentation. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{createFamilyContactSolver,observedContactSupports,predictContactSupport}from'/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import{familyContractForRecord}from'/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import{transformPoint}from'/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/12-myriapod',sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const read=name=>{const file=path.join(base,name),bytes=fs.readFileSync(file);inputs.set(file,sha(bytes));return JSON.parse(bytes.toString());};
const record=read('fit-11/record.json'),binding=read('fit-11/binding.json'),diagnosis=read('static-contact-diagnosis04.json'),supports=observedContactSupports(record,binding),solver=createFamilyContactSolver(record,supports);
assert.equal(record.recipeHash,diagnosis.recordRecipeHash);assert.equal(binding.bindingHash,diagnosis.bindingHash);
assert.equal(diagnosis.first.phase.elapsedMs,722.6853397116065);assert.equal(diagnosis.first.phase.weight,.4748343953390537);assert.equal(solver.chains.length,28);
(globalThis as any).__oldTameCadence=true;let old;try{old=createFamilyContactSolver(record,supports);}finally{delete(globalThis as any).__oldTameCadence;}
const {rawPose,phase}=diagnosis.first,before=JSON.stringify(rawPose);let refusal:any;
try{old.resolve(rawPose,phase);}catch(error){refusal=error;}
assert.equal(String(refusal),diagnosis.first.errors[0].message);assert.equal(String(refusal.cause),diagnosis.first.errors[1].message);
const result=solver.resolve(rawPose,phase),template=familyContractForRecord(record),matrices=createSkeletonPoseProgram(template,record.landmarks).evaluate(result.pose),checks=[];
assert.equal(result.contacts.length,28);assert(result.maxError<=1e-8);assert((result.compression??0)<=solver.scaleLength*.08);assert(result.maxPaintTargetErrorPx<=.25);
assert(Object.is(result.pose.root.dx,diagnosis.rootAfterSourceTravel.dx));assert.equal(JSON.stringify(rawPose),before);
for(const c of solver.chains){const contact=result.contacts.find(v=>v.joint===c.end),h=transformPoint(matrices[c.hip],c.root),k=transformPoint(matrices[c.knee],c.joint),e=transformPoint(matrices[c.end],c.endPoint),paint=predictContactSupport(c.model,matrices),upperError=Math.abs(Math.hypot(k.x-h.x,k.y-h.y)-c.chain.lengths.upper),lowerError=Math.abs(Math.hypot(e.x-k.x,e.y-k.y)-c.chain.lengths.lower),endpointError=Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y),paintErrorPx=Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height);
 assert(upperError<=1e-13&&lowerError<=1e-13);assert(endpointError<=1e-8);assert(paintErrorPx<=.25);
 const limits=[c.knee,c.end].map(j=>{const deg=result.pose[j].rotation*180/Math.PI,l=(template.contactLimitsDeg??template.limitsDeg)[j];assert(deg>=l.min-1e-7&&deg<=l.max+1e-7);return{joint:j,deg,min:l.min,max:l.max};});checks.push({id:c.id,endpointOnly:c.endpointOnly,upperError,lowerError,endpointError,paintErrorPx,limits,target:contact.target,paintedTarget:contact.paintedTarget,stance:contact.stance});
}
const report={schema:'cf.compact-tame-return-qualification/v1',status:'PASS_CONTACT_ONLY',scope:'One retained actual GSAP presentation pose, current full28-contact resolve versus exact prior declaration lacking only tame:2. No published mesh, ARAP, static battery, native or CPU claim.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,phase,oldRefusal:String(refusal),oldNestedRefusal:String(refusal.cause),rawPose,result,rootArithmeticExact:true,checks,inputs:[...inputs].map(([file,hash])=>({file,sha256:hash,unchanged:sha(fs.readFileSync(file))===hash}))};assert(report.inputs.every(row=>row.unchanged));
fs.writeFileSync(path.join(base,'tame-substeps-return-01.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,contacts:checks.length,maxEndpointError:result.maxError,maxPaintTargetErrorPx:result.maxPaintTargetErrorPx,compression:result.compression,rootArithmeticExact:true,oldRefusal:report.oldRefusal,oldNestedRefusal:report.oldNestedRefusal}));
