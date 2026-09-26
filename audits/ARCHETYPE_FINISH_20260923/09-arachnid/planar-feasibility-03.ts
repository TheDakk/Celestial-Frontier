/** One actual fit02 victory refusal; finite geometric candidates only. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createTwoBoneChain,transformPoint} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/kinematics.ts';
import {planarContactCandidates} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-planar-contact.ts';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/09-arachnid',inputs=[],sha=b=>createHash('sha256').update(b).digest('hex');
const read=n=>{const file=path.join(base,n),bytes=fs.readFileSync(file);inputs.push({file,sha256:sha(bytes)});return JSON.parse(bytes.toString());};
const record=read('fit-02/record.json'),binding=read('fit-02/binding.json'),previous=read('static-02.json'),prior=previous.rows.find(r=>r.id==='victory').firstRefusal;
assert.equal(record.recipeHash,previous.recordRecipeHash);assert.equal(binding.bindingHash,previous.bindingHash);
for(const input of inputs){const reference=previous.inputs.find(r=>r.path===input.file);if(reference)assert.equal(input.sha256,reference.sha256);}
const template=familyContractForRecord(record);assert.equal(template.contactStance.rootAccommodation,undefined);
const card=compileBodyCard(record,record.genome),tl=buildTimeline(card,'victory',record.identity.seed),program=createSkeletonPoseProgram(template,record.landmarks),solver=createFamilyContactSolver(record,observedContactSupports(record,binding));
let input:any={};const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){input[j]={rotation,dx,dy};}},{now:()=>0});player.seek(prior.ms);player.stop();
const phase={actionId:'victory',elapsedMs:prior.ms,durationMs:tl.durationMs,realm:card.realm};let oldRefusal:any;
try{solver.resolve(input,phase);}catch(e){oldRefusal={error:String(e),cause:String(e.cause)};}
assert.equal(oldRefusal?.error,prior.error.split('\n')[0]);
const active=solver.chains.filter(c=>template.contactStance.hind.includes(c.id)),matrices=program.evaluate(input),bound=solver.scaleLength*.08;
assert.equal(active.length,4);assert(active.every(c=>c.endpointOnly));
const rigid=active.map(c=>{const cross=(c.support.x-c.root.x)*(c.joint.y-c.root.y)-(c.support.y-c.root.y)*(c.joint.x-c.root.x);return createTwoBoneChain({root:c.root,joint:c.joint,end:c.support,bend:cross<0?-1:1});});
const reach=active.map((c,i)=>{const h=transformPoint(matrices[c.hip],c.root),lengths=rigid[i].lengths;return {center:{x:c.support.x-h.x,y:c.support.y-h.y},min:Math.abs(lengths.upper-lengths.lower),max:lengths.upper+lengths.lower};});
const candidates=planarContactCandidates(reach,bound),attempts=[];let admitted:any=null;
const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
for(const delta of candidates){const pose=structuredClone(input);pose.root={rotation:0,...pose.root,dx:(pose.root?.dx??0)+delta.x/program.bodyLength,dy:(pose.root?.dy??0)+delta.y/program.bodyLength};let error=null,checks=[];
 try{assert(delta.y>=0&&Math.hypot(delta.x,delta.y)<=bound);const parent=program.evaluate(pose),endpoints=[];
  for(let i=0;i<active.length;i++){const c=active[i],m=parent[c.hip],root=transformPoint(m,c.root),solved=rigid[i].solve(root,c.support),upper=wrap(angle(solved.root,solved.joint)-angle(c.root,c.joint)),lower=wrap(angle(solved.joint,solved.end)-angle(c.joint,c.support));
   pose[c.knee]={rotation:wrap(upper-Math.atan2(m[1],m[0]))};pose[c.end]={rotation:wrap(lower-upper)};
   const x=c.endPoint.x-c.joint.x,y=c.endPoint.y-c.joint.y;endpoints.push({x:solved.joint.x+Math.cos(lower)*x-Math.sin(lower)*y,y:solved.joint.y+Math.sin(lower)*x+Math.cos(lower)*y});
  }
  const final=program.evaluate(pose);
  for(let i=0;i<active.length;i++){const c=active[i],end=transformPoint(final[c.end],c.endPoint),paint=predictContactSupport(c.model,final),error=Math.hypot(end.x-endpoints[i].x,end.y-endpoints[i].y),paintErrorPx=Math.hypot((paint.x-c.support.x)*record.geometry.width,(paint.y-c.support.y)*record.geometry.height),angles={};
   for(const joint of [c.knee,c.end]){const l=(template.contactLimitsDeg??template.limitsDeg)[joint],degrees=pose[joint].rotation*180/Math.PI;assert(degrees>=l.min-1e-7&&degrees<=l.max+1e-7,'original angle bound '+joint);angles[joint]=degrees;}
   const h=transformPoint(final[c.hip],c.root),k=transformPoint(final[c.knee],c.joint),lengthErrors={upper:Math.abs(Math.hypot(k.x-h.x,k.y-h.y)-c.chain.lengths.upper),lower:Math.abs(Math.hypot(end.x-k.x,end.y-k.y)-c.chain.lengths.lower)};
   assert(error<=1e-8);assert(paintErrorPx<=.25);assert(Math.max(...Object.values(lengthErrors))<=1e-12);checks.push({joint:c.end,angles,error,paintErrorPx,lengthErrors});
  }
  admitted={delta,deltaPx:{x:delta.x*record.geometry.width,y:delta.y*record.geometry.height,norm:Math.hypot(delta.x,delta.y)*record.geometry.width},pose,checks};
 }catch(e){error=String(e);}
 attempts.push({delta,error,checks});if(admitted)break;
}
const report={schema:'cf.planar-contact-first-feasibility/v1',status:admitted?'FEASIBLE_CONTACT_ONLY':'NO_SAMPLED_ADMISSIBLE_CANDIDATE',scope:'One unchanged fit02 victory first refusal, actual canonical GSAP and existing contact refusal, followed by finite planar candidates and actual unchanged two-bone/angle/endpoint/paint admission. No production integration, ARAP, published mesh, static battery or film.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,phase,input,oldRefusal,bound,boundPx:bound*record.geometry.width,reach,candidates,attempts,admitted,inputs:inputs.map(r=>({...r,unchanged:sha(fs.readFileSync(r.file))===r.sha256}))};
assert(report.inputs.every(r=>r.unchanged));fs.writeFileSync(path.join(base,'planar-feasibility-03.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,phase,oldRefusal,boundPx:report.boundPx,candidates:candidates.length,attempts:attempts.length,deltaPx:admitted?.deltaPx,checks:admitted?.checks}));if(!admitted)process.exitCode=1;
