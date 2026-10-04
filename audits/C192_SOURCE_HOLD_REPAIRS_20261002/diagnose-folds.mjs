/** Exact captured solved poses through the unchanged current leaf publication.
 * This does not resample motion or disable any fold/strain guard. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import{createCompiledSkinField,applyCompiledSkinField}from'../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import{createArapScratch,solveArapSkin}from'../../port/v2/tools/creature-animation/arap-skin.mjs';
const base='audits/C192_SOURCE_HOLD_REPAIRS_20261002',sha=x=>createHash('sha256').update(x).digest('hex'),J=p=>JSON.parse(fs.readFileSync(p));
for(const id of ['horse','serval']){
 const dir=`${base}/baseline-${id}`,record=J(`${dir}/fit/record.json`),binding=J(`${dir}/fit/binding.json`),report=J(`${dir}/static.json`),skin=binding.paintSkin,{width:w,height:h}=record.geometry,rows=[];
 for(const row of report.rows.filter(r=>r.status==='RED')){
  const first=row.firstRefusal,program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h),s=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),field=target.slice();
  applyCompiledSkinField(compiled,program.evaluate(first.contact.pose),target);let error=null;try{solveArapSkin(s,target,field);}catch(e){error=e.message;}
  assert.equal(error,first.error.split('\n')[0].replace(/^RecoverablePoseError: /,''),'same recorded original refusal');
  const folds=[];for(let k=0;k<s.triangles.length;k+=3){const ids=Array.from(s.triangles.slice(k,k+3)),[a,c,d]=ids.map(i=>i*2),p=s.position,ratio=((p[c]-p[a])*(p[d+1]-p[a+1])-(p[c+1]-p[a+1])*(p[d]-p[a]))/s.areas[k/3];if(ratio>0)continue;
   folds.push({triangle:k/3,ratio,vertices:ids.map(i=>({index:i,x:skin.vertices[i].x,y:skin.vertices[i].y,source:skin.vertices[i],pinned:!!s.pins[i]})),parts:skin.parts.filter(part=>part.vertices.some(v=>v.triangle.some(i=>ids.includes(i)))).map(p=>p.id)});
  }rows.push({action:row.id,ms:first.ms,error,folds});
 }
 const files=['fit/record.json','fit/binding.json','static.json'];fs.writeFileSync(`${dir}/fold-diagnosis.json`,JSON.stringify({schema:'cf.c192-original-fold-localization/v1',scope:'Captured contact-resolved poses, unchanged leaf solve; no motion or native qualification',inputs:files.map(p=>({path:`${dir}/${p}`,sha256:sha(fs.readFileSync(`${dir}/${p}`))})),rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({id,rows}));
}
