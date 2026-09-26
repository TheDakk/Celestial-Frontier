/** Six retained first-refusal contact samples only; no skin solve, battery or film. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_REPAIRS_20260922/06-hopper';
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const read=name=>{const p=path.join(base,name),b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const previous=read('static-02.json'),record=read('fit-02/record.json'),binding=read('fit-02/binding.json');
for(const name of ['authoring.json','presence.json','subject-source.json'])read(name);
for(const [p,hash]of inputs){const prior=previous.inputs.find(x=>x.path===p);if(prior)assert.equal(hash,prior.sha256,'Static input unchanged '+p);}
const card=compileBodyCard(record,record.genome),template=familyContractForRecord(record),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const rows=previous.rows.filter(r=>r.firstRefusal?.error.startsWith('Error: Contact:'));
assert.equal(rows.length,6,'Bounded exact six contact rows');
const results=[];
for(const prior of rows){
 const id=prior.id,ms=prior.firstRefusal.ms,tl=buildTimeline(card,id,record.identity.seed);let rawPose:any={},attemptedPose:any,phase:any,trace:any[]=[];
 assert.equal(ms,tl.durationMs*prior.firstRefusal.sampleIndex/120,'Exact original sample time');
 const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){rawPose[j]={rotation,dx,dy};}},{now:()=>0});
 const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){throw Error('Unexpected contact success; no paint publication authorized');}};
 const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:tl.durationMs,loop:tl.loop,dispose(){},seek(at,target){rawPose={};player.seek(at);for(const[j,k]of Object.entries(rawPose)as any)target.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 (globalThis as any).__frogContactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
 owner.play(id,0,0);let error='';
 try{owner.update(ms,(pose,p)=>{attemptedPose=structuredClone(pose);phase={...p,actionId:tl.actionId,realm:card.realm,...tl.actionId.startsWith('melee:')?{travel:'stage'}:{}};return contact.resolve(pose,phase).pose;});}
 catch(e){error=String(e);}
 finally{player.stop();delete(globalThis as any).__frogContactTrace;}
 assert.equal(error,prior.firstRefusal.error.split('\n')[0],'Exact retained contact refusal');
 const terminal=trace.at(-1),result={id,ms,phase,error,retainedErrorExact:true,attemptedPose,trace,lastTrace:terminal};results.push(result);
 console.log(JSON.stringify({id,ms,error,traceEvents:trace.length,lastEvent:terminal?.event}));
}
const receipt=[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));assert(receipt.every(x=>x.unchanged));
const report={schema:'cf.frog-contact-first-refusal-diagnosis/v1',status:'EXACT_SIX_REFUSALS_REPRODUCED',scope:'Browser-free exact failed sample replay using real GSAP/performance/contact owners. Contact source receives only packet bundler trace insertions, no math or refusal edits. No ARAP, static battery, native film, performance or acceptance claim.',staticPoseCaveat:'Retained firstRefusal.pose is last successful paint publication when contact throws; attemptedPose here is captured before contact.resolve.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,card,template,scaleLength:contact.scaleLength,compressionBound:contact.scaleLength*.08,compressionBoundPx:contact.scaleLength*.08*record.geometry.height,chains:contact.chains.map(c=>({id:c.id,hip:c.hip,knee:c.knee,end:c.end,terminal:c.terminal,root:c.root,joint:c.joint,endPoint:c.endPoint,support:c.support,model:c.model,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths,minReach:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maxReach:c.chain.lengths.upper+c.chain.lengths.lower})),results,inputs:receipt};
fs.writeFileSync(path.join(base,'contact-diagnosis-02.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
