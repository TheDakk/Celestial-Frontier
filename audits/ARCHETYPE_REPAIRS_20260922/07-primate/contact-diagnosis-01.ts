/** Replay only three retained first contact refusals, with no skin solve or film. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_REPAIRS_20260922/07-primate'),original=path.join(root,'audits/ARCHETYPE_SPRINT_20260922/07-primate');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(original,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static.json'),record=read('fit-01/record.json'),binding=read('fit-01/binding.json');
for(const name of ['authoring.json','presence.json','subject-source.json'])read(name);
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
assert.deepEqual(rows.map(x=>x.id),['dodge','faint','presentation']);const results=[];
try{for(const prior of rows){
 const id=prior.id,ms=prior.firstRefusal.ms,isPresentation=id==='presentation',tl=timelines[id];let attemptedPose:any,phase:any,trace:any[]=[];
 if(!isPresentation)assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120,'Exact original sample time');else assert.equal(ms,prior.firstRefusal.sampleIndex*1000/60);
 const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){throw Error('Unexpected contact success; no paint publication authorized');}};
 const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:isPresentation?schedule.durationMs:tl.durationMs,loop:isPresentation?false:tl.loop,dispose(){},seek(at,target){const pose=isPresentation?presented(at).pose:players[id].sample(at);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__primateContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});owner.play(id,0,0);let error='';
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:tl.actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};return contact.resolve(pose,phase).pose;});}
 catch(e){error=String(e);}finally{delete(globalThis as any).__primateContactTrace;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal');
 results.push({id,ms,phase,error,retainedErrorExact:true,attemptedPose,trace,lastTrace:trace.at(-1)});console.log(JSON.stringify({id,ms,error,traceEvents:trace.length,lastEvent:trace.at(-1)?.event}));
}}finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.primate-contact-first-refusal-diagnosis/v1',status:'EXACT_THREE_REFUSALS_REPRODUCED',scope:'Browser-free exact failed sample replay using actual unchanged GSAP/performance/contact owners. Contact source receives only packet bundler trace insertions, no math or refusal edits. No ARAP, static battery, native film, performance or acceptance claim.',staticPoseCaveat:'Retained firstRefusal.pose is last successful paint publication when contact throws; attemptedPose here is captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,schedule,scaleLength:contact.scaleLength,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower})),results,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-01.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
