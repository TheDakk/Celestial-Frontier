/** Only the 121 canonical tame contact samples on fit03. No ARAP, paint publication or other row. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/body-card.ts';
import {buildTimeline} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/timeline.ts';
import {createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/gsap-adapter.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/06-hopper',sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const read=name=>{const p=path.join(base,name),bytes=fs.readFileSync(p);inputs.set(p,sha(bytes));return JSON.parse(bytes.toString());};
const record=read('fit-03/record.json'),binding=read('fit-03/binding.json'),provenance=read('fit-03/intake-provenance.json');
for(const row of provenance.inputs){const bytes=fs.readFileSync(row.path);assert.equal(sha(bytes),row.sha256,'Unchanged admitted input '+row.path);inputs.set(row.path,sha(bytes));}
assert.equal(record.recipeHash,provenance.recordRecipeHash);assert.equal(binding.bindingHash,provenance.bindingHash);
const card=compileBodyCard(record,record.genome),timeline=buildTimeline(card,'tame',record.identity.seed),template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
assert.equal(template.contactStance.travel.tame,'source-steps');assert.equal(contact.chains.length,4);assert.equal(timeline.loop,false);
let rawPose:any={};const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){rawPose[j]={rotation,dx,dy};}},{now:()=>0});
const owner=createCreatureRigPerformance(record,{recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){}} as any,[{id:'tame',durationMs:timeline.durationMs,loop:false,dispose(){},seek(ms,target){rawPose={};player.seek(ms);for(const[j,k]of Object.entries(rawPose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
const samples=[];let firstRefusal:any=null,passed=0,failed=0,maxCompressionPx=0,maxPaintErrorPx=0,maxBoneLengthError=0;
try{owner.play('tame',0,0);for(let i=0;i<=120;i++){
 const ms=timeline.durationMs*i/120;let attemptedPose:any,phase:any,resolved:any=null,error:string|null=null,cause:string|null=null,paintError=0,boneError=0;
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);phase={...p,actionId:timeline.actionId,realm:card.realm};resolved=contact.resolve(pose,phase);
  assert.equal(resolved.contacts.length,4);assert(resolved.maxError<=1e-8);assert((resolved.compression??0)<=contact.scaleLength*.08);assert((resolved.maxPaintTargetErrorPx??0)<=.25);
  const matrices=program.evaluate(resolved.pose);
  for(const target of resolved.contacts){const c=contact.chains.find(c=>c.end===target.joint)!,a=transformPoint(matrices[c.hip],c.root),b=transformPoint(matrices[c.knee],c.joint),d=transformPoint(matrices[c.end],c.endPoint),paint=predictContactSupport(c.model,matrices);
   boneError=Math.max(boneError,Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-c.chain.lengths.upper),Math.abs(Math.hypot(d.x-b.x,d.y-b.y)-c.chain.lengths.lower));paintError=Math.max(paintError,Math.hypot((paint.x-target.paintedTarget.x)*record.geometry.width,(paint.y-target.paintedTarget.y)*record.geometry.height));
   for(const j of [c.knee,c.end,...c.terminal?[c.terminal]:[]]){const angle=resolved.pose[j].rotation*180/Math.PI,l=(template.contactLimitsDeg??template.limitsDeg)[j];assert(angle>=l.min-1e-7&&angle<=l.max+1e-7,'Unchanged limit '+j);}
  }
  assert(boneError<1e-12);assert(paintError<=.25);return resolved.pose;
 });}catch(e){error=String(e);cause=(e as any)?.cause?String((e as any).cause):null;}
 const row={index:i,ms,phase,status:error?'REFUSED':'PASS_CONTACT_ONLY',error,cause,attemptedRoot:attemptedPose?.root,resolvedRoot:resolved?.pose.root??null,contacts:resolved?.contacts??null,compressionPx:resolved?.compression===undefined?null:resolved.compression*record.geometry.height,maxPaintErrorPx:paintError,maxBoneLengthError:boneError};samples.push(row);
 if(error){failed++;firstRefusal??={...row,attemptedPose};}else{passed++;maxCompressionPx=Math.max(maxCompressionPx,row.compressionPx??0);maxPaintErrorPx=Math.max(maxPaintErrorPx,paintError);maxBoneLengthError=Math.max(maxBoneLengthError,boneError);}
}}finally{player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.frog-tame-contact-qualification/v1',status:failed?'RED_CONTACT':'PASS_CONTACT_ONLY',scope:'121 tame contact samples only on changed fit03, real current canonical GSAP/performance/contact owners. No source substitutions, ARAP, paint publication, other action, presentation, full static, film or CPU acceptance.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,timelineHash:timeline.hash,durationMs:timeline.durationMs,contactPolicy:template.contactStance,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,attempted:samples.length,passed,failed,firstRefusal,maxCompressionPx,maxPaintErrorPx,maxBoneLengthError,samples,inputs:receipt};
fs.writeFileSync(path.join(base,'tame-contact-03.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,attempted:report.attempted,passed,failed,firstRefusal:firstRefusal?{ms:firstRefusal.ms,error:firstRefusal.error,cause:firstRefusal.cause}:null,maxCompressionPx,maxPaintErrorPx,maxBoneLengthError}));if(failed)process.exitCode=1;
