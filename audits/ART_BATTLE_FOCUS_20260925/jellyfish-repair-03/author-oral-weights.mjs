import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {hashJSON} from '../../../port/v2/tools/creature-animation/quadruped-template.mjs';
import {familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {validatePaintSkin} from '../../../port/v2/tools/creature-animation/paint-skin.mjs';
const d=import.meta.dirname,source=d+'/fit-04',out=d+'/fit-05';assert(!fs.existsSync(out));
const read=f=>JSON.parse(fs.readFileSync(source+'/'+f)),record=read('record.json'),binding=read('binding.json'),original=structuredClone(binding),author=JSON.parse(fs.readFileSync(d+'/authoring.json'));
const arms=[8,9,10,11],starts=new Map(arms.map(i=>['arm'+i+'Seg0',i])),clamp=t=>Math.max(0,Math.min(1,t));let changed=0,pruned=0;const released=[];
for(let n=0;n<binding.paintSkin.vertices.length;n++){
 const v=binding.paintSkin.vertices[n];if(!v.weights.some(([j])=>starts.has(j)))continue;
 const weights=new Map();const add=(j,w)=>{if(w>0)weights.set(j,(weights.get(j)??0)+w);};
 for(const[j,w]of v.weights){const i=starts.get(j);if(i===undefined){add(j,w);continue;}
  const names=[0,1,2].map(k=>'arm'+i+'Seg'+k),ys=names.map(j=>author.landmarksPx[j][1]),k=v.y<=ys[1]?0:1,t=clamp((v.y-ys[k])/(ys[k+1]-ys[k]));add(names[k],w*(1-t));add(names[k+1],w*t);
 }
 let selected=[...weights].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));if(selected.length>8){pruned++;selected=selected.slice(0,8);}const sum=selected.reduce((s,[,w])=>s+w,0);v.weights=selected.map(([j,w])=>[j,w/sum]);
 if(JSON.stringify(v.weights)!==JSON.stringify(original.paintSkin.vertices[n].weights)){changed++;if(binding.paintSkin.solver.pins.includes(n))released.push(n);}
}
const releasedSet=new Set(released);binding.paintSkin.solver.pins=binding.paintSkin.solver.pins.filter(i=>!releasedSet.has(i));
assert.deepEqual(binding.paintSkin.vertices.map(v=>[v.x,v.y]),original.paintSkin.vertices.map(v=>[v.x,v.y]));assert.deepEqual(binding.paintSkin.parts,original.paintSkin.parts);assert.deepEqual(binding.paintSkin.triangles,original.paintSkin.triangles);
const joints=familyContractForRecord(record).joints,used=new Set(binding.paintSkin.vertices.flatMap(v=>v.weights.map(([j])=>j)));for(const j of joints)assert(used.has(j),'No paint influence for '+j);
validatePaintSkin(binding.paintSkin,binding.parts,1254,1254,joints);
const {bindingHash:old,...body}=binding;binding.bindingHash=await hashJSON(body);fs.cpSync(source,out,{recursive:true});fs.writeFileSync(out+'/binding.json',JSON.stringify(binding,null,2)+'\n');
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const receipt={schema:'cf.manual-oral-skin/v1',sourceBindingSha256:sha(source+'/binding.json'),sourceRecordSha256:sha(source+'/record.json'),authoringSha256:sha(d+'/authoring.json'),helperSha256:sha(import.meta.filename),textureParts:binding.parts.length,skeletonJoints:joints.length,paintedJoints:used.size,changedWeightVertices:changed,verticesLimitedToExistingEightInfluenceCap:pruned,releasedAuthoredShapePins:released,sourceCoordinateChanges:0,sourceUvChanges:0,topologyChanges:0,solverParametersChanged:false,bindingHash:binding.bindingHash,scope:'Only this new unadmitted candidate. Four single-texture oral arms have manually declared three-bone skin weights; exact source pixels and every joint retained. Prior copied intake/weld receipts describe inputs; this receipt owns the new binding.'};
fs.writeFileSync(out+'/oral-skin-receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({...receipt,releasedAuthoredShapePins:released.length}));
