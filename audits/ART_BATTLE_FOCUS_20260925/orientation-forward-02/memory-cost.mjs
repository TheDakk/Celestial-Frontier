import fs from 'node:fs';import path from 'node:path';
import {createArapScratch} from '../../../port/v2/tools/creature-animation/arap-skin.mjs';
import {createWasmOrientationForward as old} from './before/wasm-orientation-forward.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),rows=[];
for(const [name,fit] of [['cattle','audits/ART_BATTLE_FOCUS_20260925/quadruped-repair-04/cattle-fit-02'],['centipede','audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11']]){
 const b=JSON.parse(fs.readFileSync(root+'/'+fit+'/binding.json')),skin=b.paintSkin,s=createArapScratch(skin.vertices,skin.triangles,1254,1254,skin.solver),prior=old({position:s.rest,triangleDofs:s.triangleDofs,triangleSigns:s.triangleSigns,triangleFloors:s.triangleFloors,triangleMovable:s.triangleMovable});if(!prior||!s.orientationKernel)throw Error('Real kernel required');rows.push({name,vertices:skin.vertices.length,triangles:skin.triangles.length/3,beforeLinearMemoryBytes:prior.byteLength,afterLinearMemoryBytes:s.orientationKernel.byteLength,deltaBytes:s.orientationKernel.byteLength-prior.byteLength});
}
fs.writeFileSync(import.meta.dirname+'/memory-cost.json',JSON.stringify({scope:'Measured private forward WASM linear memory per rig; excludes unchanged owner and other kernels',rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
