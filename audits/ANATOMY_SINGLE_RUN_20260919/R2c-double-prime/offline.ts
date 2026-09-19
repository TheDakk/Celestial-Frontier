import {sampleSupportResidual} from '../../../port/v2/tools/animation-completion/contact-support-probe.mjs';
/** Bounded offline replay of retained failure times. No rendering, acceptance,
 * changed source/bindings, per-species repair, CPU qualification or native rerun. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.ts';
import {buildTimeline} from '../../../port/v2/apps/game/src/motion/timeline.ts';
import {createGsapPlayer} from '../../../port/v2/apps/game/src/motion/gsap-adapter.ts';
import {createCreatureRigPerformance} from '../../../port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,contactPaintDriftPx,observedContactSupports,predictContactSupport} from '../../../port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '../../../port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../../port/v2/tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,assertPaintPartShape} from '../../../port/v2/tools/creature-animation/paint-skin.mjs';
const base=path.resolve('audits/ANATOMY_COMPLETION_20260917');
const hashes=new Map(),read=p=>{const b=fs.readFileSync(p);hashes.set(p,createHash('sha256').update(b).digest('hex'));return JSON.parse(b.toString());};
function fixture(folder){
 const record=read(path.resolve(base,folder,'record.json')),binding=read(path.resolve(base,folder,'binding.json')),skin=binding.paintSkin,{width:w,height:h}=record.geometry;
 const program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),field=target.slice(),positions={};
 const card=compileBodyCard(record,record.genome),contact=createFamilyContactSolver(record,observedContactSupports(record,binding)),players={},timelines={};let lastContact,lastPose;
 const rig={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(pose){lastPose=pose;const matrices=program.evaluate(pose);applyCompiledSkinField(compiled,matrices,target);solveArapSkin(scratch,target,field);for(const p of skin.parts){const buf=new Float32Array(p.vertices.length*2);applyPaintPart(p,field,buf);assertPaintPartShape(p,skin,buf,w,h);positions[p.id]=buf;}}};
 function player(id){if(!players[id]){const tl=buildTimeline(card,id,record.identity.seed);let pose={};const p=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){pose={};p.seek(ms);return pose;},stop:()=>p.stop()};timelines[id]=tl;}return players[id];}
 function action(id,ms){lastContact=undefined;const p=player(id),tl=timelines[id];const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:tl.durationMs,loop:tl.loop,dispose(){},seek(at,t){for(const[j,k]of Object.entries(p.sample(at)))t.setJoint(j,k.rotation,k.dx,k.dy);}}]);owner.play(id,0,0);return owner.update(ms,(pose,phase)=>{lastContact=contact.resolve(pose,{...phase,actionId:tl.actionId});return lastContact.pose;});}
 function presentation(ms){const idle=card.template.id.startsWith('plant-')?'sway':'idle',sequence=idle==='sway'?['disturb','harvest','grow']:['approach',...(record.template.id.includes('quadruped')?['melee:bite','melee:body','melee:tail']:['melee:pinch']),'hit'],slot=8000/sequence.length;player(idle);let pose=closedLoopPose(player(idle).sample,ms,timelines[idle].durationMs),phase={actionId:timelines[idle].actionId,elapsedMs:ms,durationMs:timelines[idle].durationMs,weight:1};const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};for(let i=0;i<sequence.length;i++){const id=sequence[i],start=1000+i*slot,end=start+slot;if(ms>=start&&ms<end){player(id);const age=ms-start,weight=Math.min(smooth(age/120),smooth((end-ms)/160)),q=id==='approach'?closedLoopPose(player(id).sample,age,timelines[id].bodyMs):player(id).sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));pose=blendCreaturePoses(pose,q,weight);phase={actionId:timelines[id].actionId,elapsedMs:id==='approach'?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}}lastContact=contact.resolve(pose,phase);rig.applyPose(lastContact.pose);return lastContact.pose;}
 return {record,binding,skin,w,h,program,scratch,target,field,positions,card,contact,rig,action,presentation,player,timelines,get lastContact(){return lastContact;},get lastPose(){return lastPose;},close(){for(const p of Object.values(players))p.stop();}};
}
function marks(f){return f.contact.chains.map(c=>{const owner=f.binding.parts.find(p=>p.joint===c.end),part=f.skin.parts.find(p=>p.id===owner.id),end=f.record.landmarks[c.end];let best;part.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){const p=f.skin.vertices[v.triangle[k]];xy[0]+=p.x*v.barycentric[k]/f.w;xy[1]+=p.y*v.barycentric[k]/f.h;}const distance=Math.hypot(xy[0]-end[0],xy[1]-end[1]);if(!best||distance<best.distance)best={joint:c.end,part:part.id,index,xy,distance,vertex:v};});return best;});}
function supportResiduals(f,pose){const matrices=f.program.evaluate(pose);return marks(f).map(mark=>{const c=f.lastContact?.contacts.find(c=>c.joint===mark.joint),p=f.positions[mark.part],current=[p[mark.index*2],p[mark.index*2+1]];return {...sampleSupportResidual({mark,skin:f.skin,matrices,prediction:(()=>{const p=predictContactSupport(f.contact.chains.find(c=>c.end===mark.joint).model,matrices);return[p.x,p.y];})(),current,target:c?[c.paintedTarget.x,c.paintedTarget.y]:null,width:f.w,height:f.h}),stance:c?.stance??false};});}
function contactRows(f,pose){return marks(f).flatMap(mark=>{const c=f.lastContact?.contacts.find(c=>c.joint===mark.joint);if(!c?.stance)return [];const p=f.positions[mark.part],current=[p[mark.index*2],p[mark.index*2+1]],rest=f.record.landmarks[mark.joint];return [{joint:mark.joint,part:mark.part,index:mark.index,driftPx:contactPaintDriftPx(current,mark.xy,[c.target.x,c.target.y],rest,[f.w,f.h]),supports:mark.vertex.triangle.flatMap((i,k)=>mark.vertex.barycentric[k]!==0?[{i,barycentric:mark.vertex.barycentric[k],pinned:!!f.scratch.pins[i],weights:f.skin.vertices[i].weights}]:[])}];});}
export {fixture,marks,contactRows,supportResiduals,hashes};
