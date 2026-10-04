import fs from 'node:fs';import path from 'node:path';import {performance} from 'node:perf_hooks';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '../../port/v2/apps/game/src/motion/index.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
const base=path.resolve('audits/REPAIR_FOLLOWUP_C82_20260927'),rows=[];
for(const name of ['bobcat-side-01','donkey-side-01']){
 const read=n=>JSON.parse(fs.readFileSync(base+'/'+name+'/fit/'+n,'utf8')),r=read('record.json'),b=read('binding.json'),skin=b.paintSkin,card=compileBodyCard(r,r.genome),tl=buildTimeline(card,'faint',card.identity.seed),program=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks),contact=createFamilyContactSolver(r,observedContactSupports(r,b)),compiled=createCompiledSkinField(skin,r.geometry.width,r.geometry.height),scratch=createArapScratch(skin.vertices,skin.triangles,r.geometry.width,r.geometry.height,skin.solver),target=new Float32Array(skin.vertices.length*2),output=target.slice();let pose:any={};
 const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0}),samples=[];
 try{for(const fraction of [0,.25,.5,.75,1]){
  pose={};const ms=tl.durationMs*fraction;player.seek(ms);const solved=contact.resolve(pose,{actionId:'faint',elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm});applyCompiledSkinField(compiled,program.evaluate(solved.pose),target);
  const bad=[];for(let i=0;i<skin.triangles.length;i+=3){const ids=skin.triangles.slice(i,i+3),[a,c,d]=ids.map(v=>v*2),area=(target[c]-target[a])*(target[d+1]-target[a+1])-(target[c+1]-target[a+1])*(target[d]-target[a]),ratio=area*r.geometry.width*r.geometry.height/scratch.areas[i/3];if(ratio<=0)bad.push({triangle:i/3,ratio,vertices:ids.map(v=>({id:v,x:skin.vertices[v].x,y:skin.vertices[v].y,weights:skin.vertices[v].weights}))});}
  const begin=performance.now();let error=null;try{solveArapSkin(scratch,target,output);}catch(e){error=String(e);}
  samples.push({fraction,ms,cpuMs:performance.now()-begin,stats:{...scratch.stats},activeVisits:scratch.orientationQueue.visits,activeProjections:scratch.orientationQueue.projections,badTargetTriangles:bad.length,mostInverted:bad.sort((a,b)=>a.ratio-b.ratio).slice(0,12),error});
 }}finally{player.stop();}
 rows.push({name,vertices:skin.vertices.length,triangles:skin.triangles.length/3,extraCacheBytes:skin.vertices.length*2*4*2,samples});
}
fs.writeFileSync(base+'/faint-deformation.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(x=>({name:x.name,samples:x.samples.map(s=>({fraction:s.fraction,cpuMs:s.cpuMs,bad:s.badTargetTriangles,visits:s.activeVisits,error:s.error}))})),null,2));
