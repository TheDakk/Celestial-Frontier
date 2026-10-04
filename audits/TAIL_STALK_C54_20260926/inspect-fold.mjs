import fs from 'node:fs';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
const dir=process.argv[2],r=JSON.parse(fs.readFileSync(dir+'/fit/record.json')),b=JSON.parse(fs.readFileSync(dir+'/fit/binding.json')),report=JSON.parse(fs.readFileSync(dir+'/static.json')),skin=b.paintSkin;
const pose=report.rows.find(r=>r.firstRefusal)?.firstRefusal.pose??report.presentation.firstRefusal.pose;
const {width:w,height:h}=r.geometry,t=new Float32Array(skin.vertices.length*2),o=t.slice();
applyCompiledSkinField(createCompiledSkinField(skin,w,h),createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks).evaluate(pose),t);
const s=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver);try{solveArapSkin(s,t,o);}catch{}
const rows=[],area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
for(let k=0;k<skin.triangles.length;k+=3){const ix=skin.triangles.slice(k,k+3),v=ix.map(i=>skin.vertices[i]),rest=area(...v.map(v=>[v.x,v.y])),target=area(...ix.map(i=>[t[i*2]*w,t[i*2+1]*h])),posed=area(...ix.map(i=>[s.position[i*2],s.position[i*2+1]]));if(posed/rest<=0)rows.push({triangle:k/3,ix,rest,targetRatio:target/rest,posedRatio:posed/rest,vertices:v,pinned:ix.map(i=>s.pins[i]),owners:skin.parts.filter(p=>p.fieldTriangles.some((_,j,a)=>j%3===0&&a.slice(j,j+3).every(x=>ix.includes(x)))).map(p=>p.id)});}
console.log(JSON.stringify(rows,null,2));fs.writeFileSync(dir+'/folds.json',JSON.stringify(rows,null,2)+'\n');
