/** Four action failures and one presentation failure only, plus two declared travel candidate samples. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/06-hopper';
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(base,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-01.json'),record=read('fit-01/record.json'),binding=read('fit-01/binding.json');
for(const name of ['authoring.json','presence.json','subject-source.json'])read(name);
for(const input of previous.inputs){const bytes=fs.readFileSync(input.path);assert.equal(sha(bytes),input.sha256,'Exact static input '+input.path);inputs.set(input.path,sha(bytes));}
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),supports=observedContactSupports(record,binding),contact=createFamilyContactSolver(record,supports),timelines:any={},players:any={};
for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){pose={};gsap.seek(ms);return pose;},stop(){gsap.stop();}};}
const schedule=createFullRowSchedule(timelines);assert.deepEqual(schedule,previous.schedule);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
const presented=ms=>{let pose=closedLoopPose(players.idle.sample,ms,timelines.idle.durationMs),name='idle',phase:any={actionId:timelines.idle.actionId,elapsedMs:ms,durationMs:timelines.idle.durationMs,weight:1};
 for(const{id,startMs,endMs}of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160)),q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].bodyMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}return{pose,name,phase};};
const rows=previous.rows.filter(r=>r.firstRefusal?.error.startsWith('Error: Contact:'));assert.equal(rows.length,4);
assert(previous.presentation.firstRefusal.error.startsWith('Error: Contact:'));
const results=[],candidates=[];
try{for(const prior of [...rows,{...previous.presentation,id:'presentation'}]){
 const id=prior.id,ms=prior.firstRefusal.ms,tl=timelines[id],durationMs=id==='presentation'?schedule.durationMs:tl.durationMs;
 if(id!=='presentation')assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120);
 let attemptedPose:any,phase:any,trace:any[]=[],resolved:any=null,error='',cause:string|null=null;
 const owner=createCreatureRigPerformance(record,{recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){}} as any,[{id,durationMs,loop:id==='presentation'?false:tl.loop,dispose(){},seek(at,target){const pose=id==='presentation'?presented(at).pose:players[id].sample(at);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__frogContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});owner.play(id,0,0);
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=id==='presentation'?presented(ms).phase:{...p,actionId:tl.actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};resolved=contact.resolve(pose,phase);return resolved.pose;});}catch(e){error=String(e);cause=(e as any)?.cause?String((e as any).cause):null;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal '+id);
 const result={id,ms,phase,error,cause,retainedErrorExact:true,attemptedPose,trace};results.push(result);console.log(JSON.stringify({id,ms,error,cause,traceEvents:trace.length}));
 }
 for(const id of ['hit','tame']){
  const sample=results.find(r=>r.id===id)!;let trace:any[]=[],resolved:any=null,error='',cause:string|null=null;
  (globalThis as any).__frogSourceStepCandidate=true;const candidate=createFamilyContactSolver(record,supports);delete(globalThis as any).__frogSourceStepCandidate;
  (globalThis as any).__frogContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
  try{resolved=candidate.resolve(structuredClone(sample.attemptedPose),sample.phase);}catch(e){error=String(e);cause=(e as any)?.cause?String((e as any).cause):null;}
  candidates.push({id,ms:sample.ms,scope:'Single exact failing pose with only an in-memory hopper travel:{hit:source-steps,tame:source-steps} contract declaration',status:error?'REFUSED':'PASS_CONTACT_SAMPLE_ONLY',error:error||null,cause,phase:sample.phase,resolved,trace});console.log(JSON.stringify({candidate:id,ms:sample.ms,status:error?'REFUSED':'PASS_CONTACT_SAMPLE_ONLY',error:error||null,cause}));
 }
}finally{delete(globalThis as any).__frogContactTrace;delete(globalThis as any).__frogSourceStepCandidate;for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.frog-contact-first-refusal-diagnosis/v1',status:'EXACT_FIVE_REFUSALS_REPRODUCED',scope:'Five retained failures reproduced once with real GSAP/performance/contact and observational hooks only. Two additional single-pose hit/tame comparisons change only an in-memory contract travel declaration; no solver/limit/gate/source edit. No ARAP, full static, film or CPU certificate.',staticPoseCaveat:'firstRefusal.pose may be last successfully published pose; attemptedPose here is captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,scaleLength:contact.scaleLength,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower})),results,candidates,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-01.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
