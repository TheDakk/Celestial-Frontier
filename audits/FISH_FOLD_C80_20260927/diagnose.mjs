import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{createCompiledSkinField,applyCompiledSkinField}from'../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import{createArapScratch,solveArapSkin}from'../../port/v2/tools/creature-animation/arap-skin.mjs';
const[fit,report,out]=process.argv.slice(2),read=n=>JSON.parse(fs.readFileSync(path.join(fit,n))),record=read('record.json'),binding=read('binding.json'),skin=binding.paintSkin,prior=JSON.parse(fs.readFileSync(report)),w=record.geometry.width,h=record.geometry.height;
if(fs.existsSync(out))throw Error('New diagnostic required');
const program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h),rows=[];
const owners=new Map();for(const p of skin.parts){for(const v of new Set([...p.fieldTriangles,...p.vertices.flatMap(v=>v.triangle)])){if(!owners.has(v))owners.set(v,[]);owners.get(v).push(p.id);}}
for(const row of [...prior.rows,prior.presentation].filter(r=>r?.firstRefusal?.pose)){
 const scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),output=target.slice(),pose=row.firstRefusal.pose;applyCompiledSkinField(compiled,program.evaluate(pose),target);let error=null;try{solveArapSkin(scratch,target,output);}catch(e){error=String(e);}
 const triangles=[];for(let k=0;k<skin.triangles.length;k+=3){const indices=skin.triangles.slice(k,k+3),[a,b,c]=indices.map(i=>i*2),p=scratch.position,ratio=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))/scratch.areas[k/3];if(ratio<=0)triangles.push({triangle:k/3,ratio,vertices:indices.map(i=>({index:i,owners:owners.get(i),rest:[skin.vertices[i].x,skin.vertices[i].y],weights:skin.vertices[i].weights,pin:!!scratch.pins[i],target:[target[i*2]*w,target[i*2+1]*h],solved:[p[i*2],p[i*2+1]]}))});}
 rows.push({id:row.id,ms:row.firstRefusal.ms,originalError:row.firstRefusal.error.split('\n')[0],error,triangles});
}
fs.writeFileSync(out,JSON.stringify({fit,report,recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,reportSha256:createHash('sha256').update(fs.readFileSync(report)).digest('hex'),scope:'Replay retained first-refusal poses through unchanged compiled field and solver; no acceptance or guard change',rows},null,2)+'\n',{flag:'wx'});console.log(rows.map(r=>({id:r.id,error:r.error,triangles:r.triangles.map(t=>({id:t.triangle,owners:t.vertices.map(v=>v.owners),rest:t.vertices.map(v=>v.rest),pins:t.vertices.map(v=>v.pin)}))})));
