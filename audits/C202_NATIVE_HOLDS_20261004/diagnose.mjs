/** Exact captured solved poses through the unchanged current leaf publication.
 * This does not resample motion or disable any fold/strain guard. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import{createCompiledSkinField,applyCompiledSkinField}from'../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import{createArapScratch,solveArapSkin}from'../../port/v2/tools/creature-animation/arap-skin.mjs';
const base='audits/C202_NATIVE_HOLDS_20261004',sha=x=>createHash('sha256').update(x).digest('hex'),J=p=>JSON.parse(fs.readFileSync(p));
for(const id of ['tortoise-replay-03']){
 const dir=`${base}/${id}`,fit='audits/C198_TORTOISE_CAPTURE_20261003/02-both-far-leg-fringes/fit01',record=J(`${fit}/record.json`),binding=J(`${fit}/binding.json`),report=J(`${dir}/review.json`),skin=binding.paintSkin,{width:w,height:h}=record.geometry,rows=[];
 for(const row of report.rows.filter(r=>r.status==='REFUSED')){
  const first=row,program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h),s=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),field=target.slice();
  applyCompiledSkinField(compiled,program.evaluate(first.solved.pose),target);let error=null;try{solveArapSkin(s,target,field);}catch(e){error=e.message;}
  assert.equal(error,first.error.split('\n')[0].replace(/^RecoverablePoseError: /,''),'same recorded original refusal');
  const folds=[];for(let k=0;k<s.triangles.length;k+=3){const ids=Array.from(s.triangles.slice(k,k+3)),[a,c,d]=ids.map(i=>i*2),p=s.position,ratio=((p[c]-p[a])*(p[d+1]-p[a+1])-(p[c+1]-p[a+1])*(p[d]-p[a]))/s.areas[k/3];if(ratio>0)continue;
   folds.push({triangle:k/3,ratio,vertices:ids.map(i=>({index:i,x:skin.vertices[i].x,y:skin.vertices[i].y,source:skin.vertices[i],pinned:!!s.pins[i]})),parts:skin.parts.filter(part=>part.vertices.some(v=>v.triangle.some(i=>ids.includes(i)))).map(p=>p.id)});
  }rows.push({action:first.phase.actionId,ms:first.phase.elapsedMs,error,folds});
 }
 const files=['review.json'];fs.writeFileSync(`${dir}/fold-diagnosis.json`,JSON.stringify({schema:'cf.c196-source-fold-localization/v1',scope:'Captured contact-resolved poses, unchanged leaf solve; no motion or native qualification',inputs:files.map(p=>({path:`${dir}/${p}`,sha256:sha(fs.readFileSync(`${dir}/${p}`))})),rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({id,rows:rows.map(r=>({action:r.action,ms:r.ms,error:r.error,folds:r.folds.map(f=>({triangle:f.triangle,vertices:f.vertices.map(v=>({x:v.x,y:v.y,pinned:v.pinned,weights:v.source.weights})),parts:f.parts}))}))}));
}
