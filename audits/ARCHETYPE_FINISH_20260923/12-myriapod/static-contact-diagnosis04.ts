/** Exact retained presentation replay through one failure; contact only, no ARAP or film. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
import {sampleKeys} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/timeline.ts';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/12-myriapod',sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const read=name=>{const file=path.join(base,name),bytes=fs.readFileSync(file);inputs.set(file,sha(bytes));return JSON.parse(bytes.toString());};
const previous=read('static-07.json'),record=read('fit-11/record.json'),binding=read('fit-11/binding.json');
assert.equal(record.recipeHash,previous.recordRecipeHash);assert.equal(binding.bindingHash,previous.bindingHash);
for(const [file,hash] of inputs){const retained=previous.inputs.find(row=>row.path===file);if(retained)assert.equal(hash,retained.sha256);}
const expected=previous.presentation.firstRefusal;assert.equal(expected.sampleIndex,704);assert.equal(expected.action,'tame');
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const timelines:any={},players:any={};
for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){
 const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};
 const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});
 players[id]={sample(ms){pose={};player.seek(ms);return pose;},stop(){player.stop();}};
}
const schedule=createFullRowSchedule(timelines);assert.deepEqual(schedule,previous.schedule,'Exact retained canonical schedule');
const idleId='idle',smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
const presented=ms=>{
 let pose=closedLoopPose(players[idleId].sample,ms,timelines[idleId].durationMs),name=idleId,phase:any={actionId:timelines[idleId].actionId,elapsedMs:ms,durationMs:timelines[idleId].durationMs,weight:1};
 for(const {id,startMs,endMs} of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160));
  const q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].bodyMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));
  pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};
 }return {pose,name,phase};
};
let rawPose:any,phase:any,trace:any[]=[],successfulContacts=0,first:any=null,lastSuccess:any=null;
const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){}},owner=createCreatureRigPerformance(record,rig,[{id:'presentation',durationMs:schedule.durationMs,loop:false,dispose(){},seek(ms,target){for(const [j,k] of Object.entries(presented(ms).pose) as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
owner.play('presentation',0,0);
try{
 for(let i=0;i<=expected.sampleIndex;i++){
  const ms=Math.min(schedule.durationMs,i*1000/60);trace=[];
  if(i>=expected.sampleIndex-1)(globalThis as any).__compactContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
  try{
   let resolved:any;
   owner.update(ms,pose=>{rawPose=structuredClone(pose);phase={...presented(ms).phase,realm:card.realm,...presented(ms).phase.actionId.startsWith('melee:')?{travel:'stage'}:{}};resolved=contact.resolve(pose,phase);return resolved.pose;});
   successfulContacts++;
   if(i===expected.sampleIndex-1)lastSuccess={sampleIndex:i,ms,phase,rawPose,resolved,trace};
  }catch(error){
   const errors=[];for(let e:any=error;e;e=e.cause)errors.push({message:String(e),stack:e.stack??null});
   first={sampleIndex:i,ms,phase,rawPose,errors,trace};break;
  }finally{delete(globalThis as any).__compactContactTrace;}
 }
}finally{for(const player of Object.values(players) as any[])player.stop();}
assert(first,'Expected first refusal');assert.equal(first.sampleIndex,expected.sampleIndex);assert.equal(first.ms,expected.ms);assert.equal(first.errors[0].message,expected.error.split('\n')[0]);
const w=record.geometry.width,h=record.geometry.height,px=p=>({x:p.x*w,y:p.y*h});
const reaches=first.trace.filter(t=>(t.event==='endpoint-reach'||t.event==='rigid-reach')&&t.id==='leg0Far').map(t=>({event:t.event,pass:t.pass??null,rootPx:px(t.root),targetPx:px(t.target),distancePx:t.distance*w,minPx:t.min*w,maxPx:t.max*w,outerExcessPx:(t.distance-t.max)*w,aboveHip:t.target.y<t.root.y,horizontalRefusal:Math.abs(t.dx)>=t.max}));
const targets=first.trace.find(t=>t.event==='targets'),detail=first.trace.find(t=>t.event==='target-detail'&&t.id==='leg0Far'),tl=timelines.tame;
const summary={status:'EXACT_PRESENTATION_CONTACT_REFUSAL_REPRODUCED',successfulContacts,firstSampleIndex:first.sampleIndex,globalMs:first.ms,phase:first.phase,errors:first.errors.map(e=>e.message),rootBeforeContact:first.rawPose.root,rootAfterSourceTravel:targets.pose.root,sourceTravel:targets.sourceTravel,limitingTarget:detail,reaches,rootKeys:tl.root,bodyMs:tl.bodyMs,durationMs:tl.durationMs,authoredDxAtElapsed:sampleKeys(tl.root.dx,first.phase.elapsedMs),weightedAuthoredDxAtElapsed:sampleKeys(tl.root.dx,first.phase.elapsedMs)*first.phase.weight};
const report={schema:'cf.compact-myriapod-presentation-contact-refusal/v1',...summary,scope:'Canonical GSAP/performance/presentation/contact replay from sample0 through the first retained refusal only. No compiled-field, ARAP, published paint, full static, browser, film, CPU certificate or policy changes. Source observer inserts are exactly invertible.',staticPoseCaveat:'The stored static firstRefusal.pose is the last successfully published pose. This report captures rawPose immediately before the failing contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,bodyLength:card.bodyLength,scaleLength:contact.scaleLength,compressionBoundPx:contact.scaleLength*.08*h,template,schedule,chains:contact.chains.map(c=>({id:c.id,group:c.group,hip:c.hip,knee:c.knee,end:c.end,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths})),lastSuccess,first,inputs:[...inputs].map(([file,hash])=>({file,sha256:hash,unchanged:sha(fs.readFileSync(file))===hash}))};
assert(report.inputs.every(i=>i.unchanged));fs.writeFileSync(path.join(base,'static-contact-diagnosis04.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
