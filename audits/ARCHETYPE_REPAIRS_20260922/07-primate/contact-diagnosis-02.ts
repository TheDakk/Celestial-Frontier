/** Three changed-fit first failures only: two contact refusals and one rejected ARAP solve. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';
import {createSkeletonPoseProgram} from '../../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../../port/v2/tools/creature-animation/arap-skin.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ARCHETYPE_REPAIRS_20260922/07-primate'),original=base;
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),read=name=>{const p=path.join(original,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-02.json'),record=read('fit-02/record.json'),binding=read('fit-02/binding.json');
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height,program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h);
const area=(xy,a,b,c)=>(xy[b*2]-xy[a*2])*(xy[c*2+1]-xy[a*2+1])-(xy[b*2+1]-xy[a*2+1])*(xy[c*2]-xy[a*2]);
const triKey=t=>t.slice().sort((a,b)=>a-b).join(','),triangleOwners=new Map();
for(const part of skin.parts)for(let k=0;k<part.fieldTriangles.length;k+=3){const key=triKey(part.fieldTriangles.slice(k,k+3));if(!triangleOwners.has(key))triangleOwners.set(key,[]);triangleOwners.get(key).push(part.id);}
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
const rows=[...previous.rows,previous.presentation].filter(r=>r.firstRefusal);
assert.deepEqual(rows.map(x=>x.id),['dodge','faint','presentation']);const results=[];
try{for(const prior of rows){
 const id=prior.id,ms=prior.firstRefusal.ms,isPresentation=id==='presentation',tl=timelines[id];let attemptedPose:any,phase:any,trace:any[]=[];
 if(!isPresentation)assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120,'Exact original sample time');else assert.equal(ms,prior.firstRefusal.sampleIndex*1000/60);
 const scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),published=new Float32Array(target.length).fill(123);let attemptedResolvedPose:any=null,arapInvoked=false;
 const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(pose){assert(id==='dodge','Only retained ARAP row may reach publication');attemptedResolvedPose=structuredClone(pose);assert.deepEqual(pose,prior.firstRefusal.pose,'Actual resolved attempted pose equals stored ARAP failed pose');arapInvoked=true;applyCompiledSkinField(compiled,program.evaluate(pose),target);solveArapSkin(scratch,target,published);throw Error('Unexpected ARAP success');}};
 const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:isPresentation?schedule.durationMs:tl.durationMs,loop:isPresentation?false:tl.loop,dispose(){},seek(at,target){const pose=isPresentation?presented(at).pose:players[id].sample(at);for(const[j,k]of Object.entries(pose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__primateContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});owner.play(id,0,0);let error='';
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);const raw=isPresentation?presented(ms).phase:{...p,actionId:tl.actionId};phase={...raw,realm:card.realm,...raw.actionId.startsWith('melee:')?{travel:'stage'}:{}};return contact.resolve(pose,phase).pose;});}
 catch(e){error=String(e);}finally{delete(globalThis as any).__primateContactTrace;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal');
 let arap:any=null;
 if(arapInvoked){assert.deepEqual(scratch.stats,prior.firstRefusal.arapStats,'Exact retained ARAP stats');const folded=[];for(let k=0;k<skin.triangles.length;k+=3){const tri=skin.triangles.slice(k,k+3),ratio=area(scratch.position,...tri)/scratch.areas[k/3];if(Number.isFinite(ratio)&&ratio>0)continue;folded.push({triangle:k/3,indices:tri,parts:triangleOwners.get(triKey(tri))??[],ratio,vertices:tri.map(i=>({index:i,restPx:[skin.vertices[i].x,skin.vertices[i].y],targetPx:[target[i*2]*w,target[i*2+1]*h],privateFailedPx:[scratch.position[i*2],scratch.position[i*2+1]],pinned:skin.solver.pins.includes(i),weights:skin.vertices[i].weights}))});}const partCounts:any={};for(const f of folded)for(const part of f.parts)partCounts[part]=(partCounts[part]??0)+1;arap={stats:{...scratch.stats},recordedStatsExact:true,outputUnpublished:published.every(v=>v===123),partCounts,folded};assert(arap.outputUnpublished);}
 results.push({id,ms,phase,error,retainedErrorExact:true,attemptedPose,attemptedResolvedPose,trace,lastTrace:trace.at(-1),arap});console.log(JSON.stringify({id,ms,error,traceEvents:trace.length,lastEvent:trace.at(-1)?.event,arap:arap?{stats:arap.stats,partCounts:arap.partCounts,outputUnpublished:arap.outputUnpublished}:null}));
}}finally{for(const player of Object.values(players)as any[])player.stop();}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.primate-contact-first-refusal-diagnosis/v1',status:'EXACT_THREE_REFUSALS_REPRODUCED',scope:'Browser-free replay of exactly three changed-fit failed samples using actual GSAP/performance/contact owners and one rejected ARAP solve. Contact source receives only packet bundler trace insertions, no math or refusal edits. No full static battery, native film, performance or acceptance claim.',staticPoseCaveat:'Retained firstRefusal.pose is last successful paint publication when contact throws; attemptedPose here is captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,schedule,scaleLength:contact.scaleLength,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower})),results,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-02.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
