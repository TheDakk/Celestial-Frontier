/** Six retained Beetle contact refusals; optional existing analytical-block comparison, no skin solve or film. */
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
const rows=[...previous.rows,previous.presentation].filter(r=>r.firstRefusal?.error.startsWith('Error: Contact:'));
assert.deepEqual(rows.map(x=>x.id),['cast','hit','dodge','victory','tame','presentation']);const results=[];
assert.equal(contact.chains.length,6);
const program=createSkeletonPoseProgram(template,record.landmarks);
const jointMetrics=pose=>Object.fromEntries(contact.chains.flatMap(c=>[c.knee,c.end].map(j=>{const degrees=(pose[j]?.rotation??0)*180/Math.PI,limit=(template.contactLimitsDeg??template.limitsDeg)[j];return[j,{degrees,limit,inside:degrees>=limit.min-1e-7&&degrees<=limit.max+1e-7}];})));
const candidateFor=(input,phase)=>{
 if(!contact.chains.every(c=>c.endpointOnly))return{scope:'Analytical block requires wholly endpoint-owned supports',status:'NOT_APPLICABLE',error:null,resolved:null,independent:null,lastMeasuredJoints:null,trace:[]};
 const trace:any[]=[];let resolved:any=null,error:string|null=null;
 (globalThis as any).__beetleContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
 (globalThis as any).__beetleDirectRigid=true;
 try{resolved=createFamilyContactSolver(record,observedContactSupports(record,binding)).resolve(structuredClone(input),structuredClone(phase));}catch(e){error=String(e);}finally{delete(globalThis as any).__beetleDirectRigid;delete(globalThis as any).__beetleContactTrace;}
 let independent:any=null;
 if(resolved){const matrices=program.evaluate(resolved.pose),checks=resolved.contacts.map(p=>{const c=contact.chains.find(c=>c.end===p.joint)!,a=transformPoint(matrices[c.hip],c.root),b=transformPoint(matrices[c.knee],c.joint),end=transformPoint(matrices[c.end],c.endPoint),paint=transformPoint(matrices[c.end],c.support);return{joint:p.joint,upperLengthError:Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-c.chain.lengths.upper),lowerLengthError:Math.abs(Math.hypot(end.x-b.x,end.y-b.y)-c.chain.lengths.lower),endpointError:Math.hypot(end.x-p.endpointTarget.x,end.y-p.endpointTarget.y),paintResidualPx:Math.hypot((paint.x-p.paintedTarget.x)*record.geometry.width,(paint.y-p.paintedTarget.y)*record.geometry.height)};});independent={checks,allSixContacts:resolved.contacts.length===6,joints:jointMetrics(resolved.pose),compressionInside:resolved.compression<=contact.scaleLength*.08,sourceLimitsUnchanged:true};assert(independent.allSixContacts&&independent.compressionInside&&Object.values(independent.joints).every((x:any)=>x.inside));assert(checks.every(c=>c.upperLengthError<1e-10&&c.lowerLengthError<1e-10&&c.endpointError<=1e-8&&c.paintResidualPx<=.25));}
 const lastMeasure=trace.filter(x=>x.event==='measure').at(-1);
 return{scope:'Existing analytical rigid-support block, reached directly from authored root in temporary bundle; original limits and final measure retained; no paint publication',status:resolved?'VALID_CONTACT_ONLY':'REFUSED',error,resolved,independent,lastMeasuredJoints:lastMeasure?jointMetrics(lastMeasure.pose):null,trace};
};
try{for(const prior of rows){
 const id=prior.id,ms=prior.firstRefusal.ms,isPresentation=id==='presentation',tl=timelines[id];let attemptedPose:any,phase:any,trace:any[]=[];
 if(!isPresentation)assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120,'Exact original sample time');else assert.equal(ms,prior.firstRefusal.sampleIndex*1000/60);
 const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){throw Error('Unexpected contact success; no paint publication authorized');}};
 const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:isPresentation?schedule.durationMs:tl.durationMs,loop:isPresentation?false:tl.loop,dispose(){},seek(at,target){const pose=isPresentation?presented(at).pose:players[id].sample(at);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__beetleContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});owner.play(id,0,0);let error='';
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:tl.actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};return contact.resolve(pose,phase).pose;});}
 catch(e){error=String(e);}finally{delete(globalThis as any).__beetleContactTrace;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal');
 const candidate=candidateFor(attemptedPose,phase),measured=trace.filter(x=>x.event==='measure').at(-1);
 results.push({id,ms,phase,error,retainedErrorExact:true,attemptedPose,trace,lastTrace:trace.at(-1),lastMeasuredJoints:measured?jointMetrics(measured.pose):null,analyticalCandidate:candidate});console.log(JSON.stringify({id,ms,error,traceEvents:trace.length,lastEvent:trace.at(-1)?.event,analyticalStatus:candidate.status,analyticalError:candidate.error,analyticalCompressionPx:candidate.resolved?candidate.resolved.compression*record.geometry.height:null}));
}}finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.beetle-contact-first-refusal-diagnosis/v1',status:'EXACT_SIX_REFUSALS_REPRODUCED',scope:'Six browser-free exact failed sample replays using unchanged GSAP/performance/contact owners, plus one direct analytical-block comparison per captured attempted pose. Temporary bundle adds reversible observation hooks and diagnostic branch selection only; original numeric checks remain. No production edit, ARAP, static battery, native film, performance or acceptance claim.',staticPoseCaveat:'Retained firstRefusal.pose is last successful paint publication when contact throws; attemptedPose here is captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,schedule,scaleLength:contact.scaleLength,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower})),results,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-01.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
