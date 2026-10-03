import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {registerHooks}from'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';registerHooks({resolve});
const {compileBodyCard}=await import('../../port/v2/apps/game/src/motion/body-card.ts');
const {makeClip,sampleClip,addPose}=await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const {createFamilyContactSolver}=await import('../../port/v2/apps/game/src/creature-rig-contact.ts');
const {familyContractForRecord}=await import('../../port/v2/tools/creature-animation/family-contracts.mjs');
const {createSkeletonPoseProgram}=await import('../../port/v2/tools/creature-animation/skeleton-pose.mjs');
const {createCompiledSkinField,applyCompiledSkinField}=await import('../../port/v2/tools/creature-animation/compiled-skin-field.mjs');
const {createArapScratch,solveArapSkin}=await import('../../port/v2/tools/creature-animation/arap-skin.mjs');
const base=import.meta.dirname,root=path.resolve(base,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),sha=b=>createHash('sha256').update(b).digest('hex');
const capturePath='audits/C132_C12_20261001/native-baseline-correct-fit-02/report.json',capture=read(capturePath),fit='audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11',record=read(fit+'/record.json'),binding=read(fit+'/binding.json'),recipe=read('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json');
for(const p of [fit+'/record.json',fit+'/binding.json','audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json'])assert.equal(sha(fs.readFileSync(path.join(root,p))),capture.sources.find(s=>s.path===p).sha256);
const event=capture.capture.refusalLog[0],turn=capture.gates.turns[event.turn],index=capture.capture.frameSamples.findIndex(f=>f.ms===event.ms),previous=capture.capture.frameSamples[index-1];assert.equal(event.error,'ARAP skin: unresolved folded triangles: 1');
const card=compileBodyCard(record,record.genome),combatant={side:'right',mass:card.massClass.multiplier,card,seed:2,label:'Centipede'},seed=(recipe.seed^2)>>>0,idle=makeClip(combatant,'idle',seed),approach=makeClip(combatant,'approach',seed),solver=createFamilyContactSolver(record),skeleton=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),field=createCompiledSkinField(binding.paintSkin,record.geometry.width,record.geometry.height),scratch=createArapScratch(binding.paintSkin.vertices,binding.paintSkin.triangles,record.geometry.width,record.geometry.height,binding.paintSkin.solver);
const duration=event.context.durationMs,within=event.context.elapsedMs/duration,perCycle=event.context.stageDisplacement/(within-.5),rows=[];
for(const [name,frame] of [['previous',previous],['refusal',capture.capture.frameSamples[index]]]){
 const local=frame.localMs,since=local-turn.beats.commandEnd,k=(since/duration)%1,half=k>=.5?1:0,context=name==='refusal'?event.context:{...event.context,elapsedMs:k*duration,stageDisplacement:perCycle*(k-half*.5)};
 const pose=addPose(sampleClip(idle,local),sampleClip(approach,context.elapsedMs)),solved=solver.resolve(pose,{...context,realm:card.realm}),matrices=skeleton.evaluate(solved.pose),target=new Float32Array(binding.paintSkin.vertices.length*2),output=target.slice();applyCompiledSkinField(field,matrices,target);
 const before=performance.now();let error=null;try{solveArapSkin(scratch,target,output);}catch(e){error=String(e.message);}const elapsedMs=performance.now()-before;
 const folded=[];for(let t=0;t<scratch.areas.length;t++){const [a,b,c]=scratch.triangleDofs.slice(t*3,t*3+3),p=scratch.position,ratio=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))/scratch.areas[t];if(ratio<=0||!Number.isFinite(ratio))folded.push({triangle:t,ratio,vertices:[a/2,b/2,c/2],pins:[scratch.pins[a/2],scratch.pins[b/2],scratch.pins[c/2]]});}
 fs.writeFileSync(path.join(base,name+'-target.f32'),Buffer.from(target.buffer));fs.writeFileSync(path.join(base,name+'-pose.json'),JSON.stringify({context,pose,resolved:solved.pose},null,2)+'\n');
 rows.push({name,globalMs:frame.ms,localMs:local,context,error,elapsedMs,targetSha256:sha(Buffer.from(target.buffer)),stats:{...scratch.stats},orientationQueue:{size:scratch.orientationQueue.size,projections:scratch.orientationQueue.projections,visits:scratch.orientationQueue.visits,stalled:scratch.orientationQueue.stalled},folded});
}
const report={schema:'cf.c132-centipede-reproduction/v1',scope:'Deterministic captured-time pose/contact/skin reconstruction; Node timing is diagnostic only, not native60fps.',capture:capturePath,captureSha256:sha(fs.readFileSync(path.join(root,capturePath))),fit,seed,vertices:binding.paintSkin.vertices.length,triangles:binding.paintSkin.triangles.length/3,rows};
fs.writeFileSync(path.join(base,'reproduction.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
assert.equal(rows[0].error,null,'Preceding native frame must pass');assert.equal(rows[1].error,event.error,'Exact recorded refused pose must reproduce');
