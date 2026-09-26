/** Four retained first contact refusals only; no ARAP, paint, film or optimization. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_FINISH_20260923/09-arachnid');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(base,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-01.json'),record=read('fit-01/record.json'),binding=read('fit-01/binding.json');
assert.equal(previous.recordRecipeHash,record.recipeHash);assert.equal(previous.bindingHash,binding.bindingHash);
for(const [p,hash]of inputs){const prior=previous.inputs.find(x=>x.path===p);if(prior)assert.equal(hash,prior.sha256,'Static input unchanged '+p);}
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const timelines:any={},players:any={};
for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){pose={};gsap.seek(ms);return pose;},stop(){gsap.stop();}};}
assert.deepEqual(Object.keys(timelines),previous.actionInventory);
const schedule=createFullRowSchedule(timelines);assert.deepEqual(schedule,previous.schedule,'Exact static presentation schedule');
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
const presented=ms=>{let pose=closedLoopPose(players.idle.sample,ms,timelines.idle.durationMs),name='idle',phase:any={actionId:timelines.idle.actionId,elapsedMs:ms,durationMs:timelines.idle.durationMs,weight:1};
 for(const{id,startMs,endMs}of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160));
  const q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].bodyMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));
  pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}
 return{pose,name,phase};};
const rows=[...previous.rows,previous.presentation].filter(r=>r.firstRefusal);assert.deepEqual(rows.map(x=>x.id),['hit','victory','tame','presentation']);const results=[];
try{for(const prior of rows){
 const id=prior.id,ms=prior.firstRefusal.ms,isPresentation=id==='presentation',tl=timelines[id];let attemptedPose:any,phase:any,trace:any[]=[],publicationCalls=0;
 if(!isPresentation)assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120);else assert.equal(ms,prior.firstRefusal.sampleIndex*1000/60);
 const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){publicationCalls++;throw Error('Unexpected contact success: no publication authorized in this diagnostic');}};
 const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:isPresentation?schedule.durationMs:tl.durationMs,loop:isPresentation?false:tl.loop,dispose(){},seek(at,target){const pose=isPresentation?presented(at).pose:players[id].sample(at);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__tarantulaContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});owner.play(id,0,0);let error='',causes:string[]=[];
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:tl.actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};return contact.resolve(pose,phase).pose;});}
 catch(e){error=String(e);for(let cause=(e as any).cause;cause;cause=cause.cause)causes.push(String(cause));}finally{delete(globalThis as any).__tarantulaContactTrace;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal');assert.equal(publicationCalls,0,'No ARAP or publication reached');
 const compression=trace.filter(t=>t.event==='compression'||t.event==='rigid-compression').map(t=>({event:t.event,pass:t.pass??null,totalPx:((t.compression??0)+t.shift)*record.geometry.height,boundPx:t.bound*record.geometry.height,dominant:t.chains.slice().sort((a,b)=>b.requiredShift-a.requiredShift)[0]}));
 results.push({id,ms,phase,error,causes,retainedErrorExact:true,attemptedPose,storedPoseIsPreviousPublication:JSON.stringify(attemptedPose)!==JSON.stringify(prior.firstRefusal.pose),trace,compression,publicationCalls});
 console.log(JSON.stringify({id,ms,phase,error,causes,compression:compression.map(t=>({...t,dominant:{id:t.dominant.id,requiredShiftPx:t.dominant.requiredShift*record.geometry.height,distancePx:t.dominant.distance*record.geometry.height,minPx:t.dominant.min*record.geometry.height,maxPx:t.dominant.max*record.geometry.height}}))}));
}}finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.arachnid-first-contact-refusals/v1',status:'EXACT_FOUR_REFUSALS_REPRODUCED',scope:'Only four retained static first failures, current canonical GSAP/performance/contact and exact presentation schedule. Invertible observational inserts in a temporary bundle. No ARAP, paint publication, full static, native film, pose optimization or acceptance claim.',staticPoseCaveat:'firstRefusal.pose is the previous successful publication when contact refuses; attemptedPose here was captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,schedule,scaleLength:contact.scaleLength,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,group:c.group,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower,restSlackPx:(c.chain.lengths.upper+c.chain.lengths.lower-Math.hypot(c.endPoint.x-c.root.x,c.endPoint.y-c.root.y))*record.geometry.width})),results,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-01.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
