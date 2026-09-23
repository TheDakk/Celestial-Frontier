/** Current production contact-only sweep. Real GSAP/performance/contact, no paint or ARAP. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_FINISH_20260923/04-insect');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(base,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-01.json'),record=read('fit-04/record.json'),binding=read('fit-04/binding.json');
for(const name of ['authoring.json','presence.json','subject-source.json'])read('candidate-04-fit/'+name);
for(const input of previous.inputs){const bytes=fs.readFileSync(input.path);assert.equal(sha(bytes),input.sha256,'Exact retained static input '+input.path);inputs.set(input.path,sha(bytes));}
inputs.set(record.source,sha(fs.readFileSync(record.source)));
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const timelines:any={},players:any={};
for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){pose={};gsap.seek(ms);return pose;},stop(){gsap.stop();}};}
const schedule=createFullRowSchedule(timelines);assert.deepEqual(schedule,previous.schedule,'Exact original presentation schedule');
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
const presented=ms=>{let pose=closedLoopPose(players.idle.sample,ms,timelines.idle.durationMs),name='idle',phase:any={actionId:timelines.idle.actionId,elapsedMs:ms,durationMs:timelines.idle.durationMs,weight:1};
 for(const{id,startMs,endMs}of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160));
  const q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].bodyMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));
  pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}
 return{pose,name,phase};};
assert.equal(contact.chains.length,6);assert(contact.chains.every(c=>c.endpointOnly));
const ownerFor=id=>createCreatureRigPerformance(record,{recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){}} as any,[{id,durationMs:id==='presentation'?schedule.durationMs:timelines[id].durationMs,loop:id==='presentation'?false:timelines[id].loop,dispose(){},seek(ms,target){const pose=id==='presentation'?presented(ms).pose:players[id].sample(ms);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
const validate=(resolved,phase)=>{
 const expected=phase.actionId==='dodge'||/:(flight|fly|swim|jet|hop|leap|climb)$/.test(phase.actionId)?[]:contact.chains.filter(c=>!['cast','victory'].includes(phase.actionId)||c.id.startsWith('legHind')).map(c=>c.end);
 assert.deepEqual(resolved.contacts.map(c=>c.joint).sort(),expected.sort(),'Exact Beetle contact inventory for '+phase.actionId);
 assert(resolved.maxError<=1e-8);if(resolved.compression!==undefined)assert(resolved.compression<=contact.scaleLength*.08);
 if(resolved.maxPaintTargetErrorPx!==undefined)assert(resolved.maxPaintTargetErrorPx<=.25);
 const matrices=program.evaluate(resolved.pose);let maxLengthError=0,maxPaintError=0;
 for(const p of resolved.contacts){const c=contact.chains.find(c=>c.end===p.joint)!;
  const a=transformPoint(matrices[c.hip]!,c.root),b=transformPoint(matrices[c.knee]!,c.joint),d=transformPoint(matrices[c.end]!,c.endPoint);
  maxLengthError=Math.max(maxLengthError,Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-c.chain.lengths.upper),Math.abs(Math.hypot(d.x-b.x,d.y-b.y)-c.chain.lengths.lower));
  const paint=predictContactSupport(c.model,matrices);maxPaintError=Math.max(maxPaintError,Math.hypot((paint.x-p.paintedTarget.x)*record.geometry.width,(paint.y-p.paintedTarget.y)*record.geometry.height));
  for(const j of [c.knee,c.end]){const degrees=resolved.pose[j].rotation*180/Math.PI,limit=(template.contactLimitsDeg??template.limitsDeg)[j];assert(degrees>=limit.min-1e-7&&degrees<=limit.max+1e-7,'Original joint bound '+j);}
 }
 assert(maxLengthError<1e-12);assert(maxPaintError<=.25);return{maxLengthError,maxPaintError};
};
const cases=[...Object.keys(timelines).map(id=>({id,stage:false})),{id:'presentation',stage:false},...['cast','hit','dodge','victory','tame'].map(id=>({id,stage:true}))],rows=[];
try{for(const item of cases){
 const{id,stage}=item,owner=ownerFor(id),isPresentation=id==='presentation',total=isPresentation?Math.ceil(schedule.durationMs*60/1000):120;
 owner.play(id,0,0);const row:any={id,variant:stage?'stage-travel':'original-static-context',attempted:0,passed:0,failed:0,firstFailures:[],failureClasses:{},samples:[],maxSuccessfulCompressionPx:0,maxSuccessfulPaintResidualPx:0,maxSuccessfulEndpointError:0,maxBoneLengthError:0};rows.push(row);
 for(let i=0;i<=total;i++){
  const ms=isPresentation?Math.min(schedule.durationMs,i*1000/60):timelines[id].durationMs*i/120;
  let attemptedPose:any=null,phase:any=null,resolved:any=null,error:string|null=null,verification:any=null;
  try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:timelines[id].actionId};phase={...raw,realm:card.realm,...(stage||raw.actionId.startsWith('melee:')?{travel:'stage'}:{})};resolved=contact.resolve(pose,phase);verification=validate(resolved,phase);return resolved.pose;});}catch(e){error=String(e);}
  row.attempted++;if(error)row.failed++;else row.passed++;
  const entry:any={index:i,ms,action:isPresentation?presented(ms).name:id,phase,status:error?'REFUSED':'PASS_CONTACT_ONLY',error,attemptedRoot:attemptedPose?.root??null,resolvedRoot:resolved?.pose.root??null,contacts:resolved?.contacts.map(c=>({joint:c.joint,stance:c.stance,target:c.target,paintedTarget:c.paintedTarget}))??null,resolvedCompressionPx:resolved?.compression===undefined?null:resolved.compression*record.geometry.height,maxPaintTargetErrorPx:resolved?.maxPaintTargetErrorPx??null,maxEndpointError:resolved?.maxError??null,verification};
  row.samples.push(entry);
  if(error){const kind=/joint limit ([A-Za-z0-9]+)/.exec(error)?.[0]??(/compression bound/.test(error)?'compression bound':/outside accommodatable reach/.test(error)?'outside accommodatable reach':/unreachable/.test(error)?'unreachable':error.replace(/@[\d.]+/g,'@<ms>'));
   const key=entry.action+' | '+kind;row.failureClasses[key]=(row.failureClasses[key]??0)+1;if(row.failureClasses[key]===1)row.firstFailures.push({...entry,attemptedPose});
  }else{row.maxSuccessfulCompressionPx=Math.max(row.maxSuccessfulCompressionPx,entry.resolvedCompressionPx??0);row.maxSuccessfulPaintResidualPx=Math.max(row.maxSuccessfulPaintResidualPx,entry.maxPaintTargetErrorPx??0);row.maxSuccessfulEndpointError=Math.max(row.maxSuccessfulEndpointError,entry.maxEndpointError??0);row.maxBoneLengthError=Math.max(row.maxBoneLengthError,verification.maxLengthError);}
 }
 row.status=row.failed?'RED_CONTACT':'PASS_CONTACT_ONLY';console.log(JSON.stringify({id,variant:row.variant,status:row.status,attempted:row.attempted,passed:row.passed,failed:row.failed,failureClasses:row.failureClasses,firstFailure:row.firstFailures.length?{ms:row.firstFailures[0].ms,action:row.firstFailures[0].action,error:row.firstFailures[0].error}:null}));
}}finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.beetle-current-contact-sweep/v1',status:rows.every(r=>!r.failed)?'PASS_CONTACT_ONLY':'RED_CONTACT',scope:'One changed-source browser-free contact-only sweep: 121 samples of every action and each stage variant of the five originally red actions, plus exact 60Hz full presentation. Actual unmodified current GSAP/performance/contact owners. No ARAP, skin publication, CPU certificate, native film or complete item acceptance claim.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,schedule,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,templateId:template.id,contactStance:template.contactStance??null,contactLimitsDeg:template.contactLimitsDeg??template.limitsDeg,chainCount:contact.chains.length,endpointOnly:contact.chains.every(c=>c.endpointOnly),rows,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-current-03.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
if(report.status!=='PASS_CONTACT_ONLY')process.exitCode=1;
