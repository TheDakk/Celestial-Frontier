/** Contact-only victory row plus exact retained presentation refusal; no ARAP or publication. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createTwoBoneChain,transformPoint} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_FINISH_20260923/09-arachnid');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(base,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-03.json'),record=read('fit-02/record.json'),binding=read('fit-02/binding.json');
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
const program=createSkeletonPoseProgram(template,record.landmarks),bound=contact.scaleLength*.08,results=[];
const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){throw Error('No publication authorized');}};
const makeOwner=id=>{const tl=timelines[id];const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:id==='presentation'?schedule.durationMs:tl.durationMs,loop:id==='presentation'?false:tl.loop,dispose(){},seek(ms,t){for(const[j,k]of Object.entries(id==='presentation'?presented(ms).pose:players[id].sample(ms))as any)t.setJoint(j,k.rotation,k.dx,k.dy);}}]);owner.play(id,0,0);return owner;};
const victory=makeOwner('victory'),presentation=makeOwner('presentation');
const serializeError=(e:any):any=>e?{error:String(e),...Array.isArray(e.attempts)?{attempts:e.attempts}:{},...e.cause?{cause:serializeError(e.cause)}:{}}:null;
try{for(const query of [...Array.from({length:121},(_,i)=>({id:'victory',ms:timelines.victory.durationMs*i/120,index:i})),{id:'presentation',ms:previous.presentation.firstRefusal.ms,index:previous.presentation.firstRefusal.sampleIndex}]){
 const {id,ms,index}=query,owner=id==='presentation'?presentation:victory,input=owner.sample(ms),raw=id==='presentation'?presented(ms).phase:{actionId:timelines.victory.actionId,elapsedMs:ms,durationMs:timelines.victory.durationMs},phase={...raw,realm:card.realm};
 const trace=[];(globalThis as any).__planarSweepTrace=(event,data)=>trace.push({event,...structuredClone(data)});let solved:any=null,error:any=null;
 try{solved=contact.resolve(input,phase);}catch(e){error=serializeError(e);}finally{delete(globalThis as any).__planarSweepTrace;}
 const targets=trace.find(t=>t.event==='targets');assert(targets,'baseline observation required');const matrices=program.evaluate(targets.pose);
 const lowerBounds=targets.activeChains.map(({id})=>{const c=contact.chains.find(c=>c.id===id),target=targets.contacts.find(c=>c.joint===contact.chains.find(c=>c.id===id).end).paintedTarget,h=transformPoint(matrices[c.hip],c.root),cross=(c.support.x-c.root.x)*(c.joint.y-c.root.y)-(c.support.y-c.root.y)*(c.joint.x-c.root.x),rigid=createTwoBoneChain({root:c.root,joint:c.joint,end:c.support,bend:cross<0?-1:1}),distance=Math.hypot(target.x-h.x,target.y-h.y),maximum=rigid.lengths.upper+rigid.lengths.lower,minimum=Math.abs(rigid.lengths.upper-rigid.lengths.lower),translationLowerBound=Math.max(0,distance-maximum),innerTranslationLowerBound=Math.max(0,minimum-distance);return{id,hip:h,target,distance,minimum,maximum,translationLowerBound,translationLowerBoundPx:translationLowerBound*record.geometry.width,innerTranslationLowerBound,exceedsCap:translationLowerBound>bound};});
 const maximumLowerBound=Math.max(...lowerBounds.map(c=>c.translationLowerBound)),row={id,ms,index,phase,input,status:error?'REFUSED':'CONTACT_PASS',error,lowerBounds,maximumLowerBound,maximumLowerBoundPx:maximumLowerBound*record.geometry.width,impossibleWithinCap:maximumLowerBound>bound,trace,solved:solved?{pose:solved.pose,contacts:solved.contacts,maxError:solved.maxError,maxPaintTargetErrorPx:solved.maxPaintTargetErrorPx,compression:solved.compression,rootAccommodation:solved.rootAccommodation??null}:null};results.push(row);
 if((id==='victory'&&index===previous.rows.find(r=>r.id==='victory').firstRefusal.sampleIndex)||id==='presentation')assert.equal(error?.error,(id==='presentation'?previous.presentation:previous.rows.find(r=>r.id==='victory')).firstRefusal.error.split('\n')[0],'Retained first refusal exact');
}}
finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const refused=results.filter(r=>r.error),impossible=results.filter(r=>r.impossibleWithinCap),worst=results.reduce((a,b)=>a.maximumLowerBound>b.maximumLowerBound?a:b),summary={sampleCount:results.length,passed:results.length-refused.length,refused:refused.length,provenOverCapSamples:impossible.length,boundPx:bound*record.geometry.width,firstRefusal:refused[0]?{id:refused[0].id,ms:refused[0].ms,maximumLowerBoundPx:refused[0].maximumLowerBoundPx,error:refused[0].error}:null,firstProvenOverCap:impossible[0]?{id:impossible[0].id,ms:impossible[0].ms,maximumLowerBoundPx:impossible[0].maximumLowerBoundPx,chains:impossible[0].lowerBounds.filter(c=>c.exceedsCap)}:null,worst:{id:worst.id,ms:worst.ms,maximumLowerBoundPx:worst.maximumLowerBoundPx,chains:worst.lowerBounds.filter(c=>c.translationLowerBound===worst.maximumLowerBound)}};
fs.writeFileSync(path.join(base,'planar-contact-sweep-01.json'),JSON.stringify({schema:'cf.planar-contact-row-diagnosis/v1',scope:'121 actual canonical victory samples and one exact presentation first refusal, current unchanged contact solver with invertible observational hooks. No ARAP, published mesh, full static or native film. Per-chain max(0,distance-minus-rigid-maximum) is a necessary translation-norm lower bound, not a sufficient multi-chain solution.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,summary,results,inputs:receipt},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary,null,2));
