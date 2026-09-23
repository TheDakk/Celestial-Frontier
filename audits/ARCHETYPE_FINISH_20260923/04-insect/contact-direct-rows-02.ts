/** Changed-model contact-only sweep of five red rows and the exact presentation; no ARAP or native work. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_FINISH_20260923/04-insect'),original=base;
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(original,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-01.json'),record=read('fit-04/record.json'),binding=read('fit-04/binding.json');
for(const name of ['authoring.json','presence.json','subject-source.json'])read('candidate-04-fit/'+name);
for(const input of previous.inputs){const bytes=fs.readFileSync(input.path);assert.equal(sha(bytes),input.sha256,'Exact retained static input '+input.path);inputs.set(input.path,sha(bytes));}
inputs.set(record.source,sha(fs.readFileSync(record.source)));
for(const [p,hash]of inputs){const prior=previous.inputs.find(x=>x.path===p);if(prior)assert.equal(hash,prior.sha256,'Original static input unchanged '+p);}
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const timelines:any={},players:any={};
for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){pose={};gsap.seek(ms);return pose;},stop(){gsap.stop();}};}
const schedule=createFullRowSchedule(timelines);assert.deepEqual(schedule,previous.schedule,'Exact original presentation schedule');
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
const presented=ms=>{let pose=closedLoopPose(players.idle.sample,ms,timelines.idle.durationMs),name='idle',phase:any={actionId:timelines.idle.actionId,elapsedMs:ms,durationMs:timelines.idle.durationMs,weight:1};
 for(const{id,startMs,endMs}of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160));
  const q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].bodyMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));
  pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}
 return{pose,name,phase};};
const ids=['cast','hit','dodge','victory','tame'];
assert.equal(contact.chains.length,6);assert(contact.chains.every(c=>c.endpointOnly));
const metrics=pose=>Object.fromEntries(contact.chains.flatMap(c=>[c.knee,c.end].map(j=>{const degrees=(pose[j]?.rotation??0)*180/Math.PI,limit=(template.contactLimitsDeg??template.limitsDeg)[j];return[j,{degrees,limit,inside:degrees>=limit.min-1e-7&&degrees<=limit.max+1e-7}];})));
const ownerFor=id=>createCreatureRigPerformance(record,{recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){}} as any,[{id,durationMs:id==='presentation'?schedule.durationMs:timelines[id].durationMs,loop:id==='presentation'?false:timelines[id].loop,dispose(){},seek(ms,target){const pose=id==='presentation'?presented(ms).pose:players[id].sample(ms);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
const rows=[];
(globalThis as any).__beetleDirectRigid=true;
try{for(const id of [...ids,'presentation']){
 const owner=ownerFor(id),isPresentation=id==='presentation',total=isPresentation?Math.ceil(schedule.durationMs*60/1000):120;
 owner.play(id,0,0);const row:any={id,scope:'DIRECT_EXISTING_ANALYTICAL_BLOCK_CONTACT_ONLY',attempted:0,passed:0,failed:0,firstFailures:[],failureClasses:{},samples:[],maxSuccessfulCompressionPx:0,maxSuccessfulPaintResidualPx:0,maxSuccessfulEndpointError:0};rows.push(row);
 for(let i=0;i<=total;i++){
  const ms=isPresentation?Math.min(schedule.durationMs,i*1000/60):timelines[id].durationMs*i/120;
  let attemptedPose:any=null,phase:any=null,resolved:any=null,error:string|null=null,trace:any[]=[];
  (globalThis as any).__beetleContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
  try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:timelines[id].actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};resolved=contact.resolve(pose,phase);return resolved.pose;});}catch(e){error=String(e);}
  row.attempted++;if(error)row.failed++;else row.passed++;
  const compression=trace.filter(x=>x.event==='rigid-compression').at(-1),measure=trace.filter(x=>x.event==='measure').at(-1),joints=measure?metrics(measure.pose):null;
  const worst=compression?[...compression.chains].sort((a,b)=>b.requiredShift-a.requiredShift)[0]:null;
  const entry:any={index:i,ms,action:id==='presentation'?presented(ms).name:id,phase,status:error?'REFUSED':'PASS_CONTACT_ONLY',error,attemptedRoot:attemptedPose?.root??null,attemptedThorax:attemptedPose?.thorax??null,requestedCompressionPx:compression?compression.shift*record.geometry.height:null,compressionOwner:worst?.id??null,compressionChain:worst??null,outsideJoints:joints?Object.entries(joints).filter(([,v]:any)=>!v.inside):[],contacts:resolved?.contacts.map(c=>c.joint)??null,resolvedCompressionPx:resolved?.compression===undefined?null:resolved.compression*record.geometry.height,maxPaintTargetErrorPx:resolved?.maxPaintTargetErrorPx??null,maxEndpointError:resolved?.maxError??null};
  row.samples.push(entry);
  if(error){const kind=/joint limit ([A-Za-z0-9]+)/.exec(error)?.[0]??(/compression bound/.test(error)?'compression bound':/outside accommodatable reach/.test(error)?'outside accommodatable reach':/unreachable/.test(error)?'unreachable':error.replace(/@[\d.]+/g,'@<ms>'));
   const key=entry.action+' | '+kind+' | '+(entry.compressionOwner??'unavailable');row.failureClasses[key]=(row.failureClasses[key]??0)+1;
   if(row.failureClasses[key]===1)row.firstFailures.push({...entry,attemptedPose,trace});
  }else{if(resolved){assert(resolved.maxError<=1e-8);if(resolved.maxPaintTargetErrorPx!==undefined)assert(resolved.maxPaintTargetErrorPx<=.25);if(resolved.compression!==undefined)assert(resolved.compression<=contact.scaleLength*.08);if(joints)assert(Object.values(joints).every((v:any)=>v.inside));}
   row.maxSuccessfulCompressionPx=Math.max(row.maxSuccessfulCompressionPx,entry.resolvedCompressionPx??0);row.maxSuccessfulPaintResidualPx=Math.max(row.maxSuccessfulPaintResidualPx,entry.maxPaintTargetErrorPx??0);row.maxSuccessfulEndpointError=Math.max(row.maxSuccessfulEndpointError,entry.maxEndpointError??0);}
 }
 row.status=row.failed?'RED_CONTACT':'PASS_CONTACT_ONLY';console.log(JSON.stringify({id,status:row.status,attempted:row.attempted,passed:row.passed,failed:row.failed,failureClasses:row.failureClasses,firstFailures:row.firstFailures.map(r=>({ms:r.ms,action:r.action,error:r.error,compressionOwner:r.compressionOwner,requestedCompressionPx:r.requestedCompressionPx}))}));
}}finally{delete(globalThis as any).__beetleDirectRigid;delete(globalThis as any).__beetleContactTrace;for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.beetle-direct-rigid-row-diagnosis/v1',status:rows.every(r=>!r.failed)?'PASS_CONTACT_ONLY':'RED_CONTACT',scope:'One changed-model, browser-free contact-only sweep: 121 samples of each five originally red action rows plus the exact 60Hz full presentation. Real GSAP/performance and retained historical contact owner; temporary branch invokes its existing analytical support block directly. No original static rerun, ARAP, skin publication, CPU certificate, native film, new gate or acceptance claim.',contactOwner:{moduleId:'port/v2/apps/game/src/creature-rig-contact.ts',bytes:'contact-before/creature-rig-contact.ts',sha256:'37ce18684c45eb771cbc927341c4bd6c2179145cd033b02e5db4588eddaba3e4'},recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,schedule,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,templateId:template.id,contactStance:template.contactStance??null,contactLimitsDeg:template.contactLimitsDeg??template.limitsDeg,chainCount:contact.chains.length,endpointOnly:contact.chains.every(c=>c.endpointOnly),rows,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-direct-rows-02.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
