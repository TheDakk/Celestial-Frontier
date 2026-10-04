/** Three browser-free causal probes; no asset generation or acceptance claim. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,assertPaintPartShape} from '../../port/v2/tools/creature-animation/paint-skin.mjs';
import {createSourceJoinProbe,assessSourceJoinContinuity} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
const root=process.cwd(),fit=path.join(root,'audits/PYTHON_VISUAL_DIAGNOSIS_20260923/candidate-01');
const req=createRequire(path.join(root,'port/v2/package.json')),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const inputs=[],read=f=>{const bytes=fs.readFileSync(f);inputs.push({path:f,sha256:createHash('sha256').update(bytes).digest('hex')});return bytes;};
const record=JSON.parse(read(path.join(fit,'record.json'))),binding=JSON.parse(read(path.join(fit,'binding.json'))),atlas=PNG.sync.read(read(path.join(fit,'parts/atlas/python.png')));
const skin=binding.paintSkin,{width:w,height:h}=record.geometry,program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h);
const probe=createSourceJoinProbe({record,binding,atlas:{width:atlas.width,height:atlas.height,rgba:atlas.data}});
const cases=[{id:'rest',pose:{}},{id:'rigid-root-control',pose:{root:{rotation:0.1}}},{id:'seg5-differential-control',pose:{seg5:{rotation:0.1}}}];
const results=[];
for(const c of cases){const scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),field=target.slice(),positions={};let error=null;
try{applyCompiledSkinField(compiled,program.evaluate(c.pose),target);solveArapSkin(scratch,target,field);for(const part of skin.parts){const p=new Float32Array(part.vertices.length*2);applyPaintPart(part,field,p);assertPaintPartShape(part,skin,p,w,h);positions[part.id]=p;}}catch(e){error=String(e.stack??e);}
results.push({id:c.id,pose:c.pose,error,shapeAccepted:!error,joins:error?null:assessSourceJoinContinuity(probe,positions)});}
const out=path.join(import.meta.dirname,'candidate-join-diagnosis.json');fs.writeFileSync(out,JSON.stringify({scope:'Three synthetic pose diagnostics of unchanged source-owned mesh, not a native pose reproduction, threshold or new admission test. Root rigid motion is the negative control for differential separation.',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,inputs,results},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results.map(r=>({id:r.id,error:r.error,requiredStatus:r.joins?.status,requiredMaxGapPx:r.joins?.maxGapPx,largestExcluded:r.joins?.excluded.toSorted((a,b)=>b.maxGapPx-a.maxGapPx).slice(0,3)})),null,2));
