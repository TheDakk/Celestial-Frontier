import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createSourceJoinProbe} from '../../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {insideSourcePolygon} from '../regional-influences.mjs';

// Retained-data geometry only: no contact, skin, solver, intake or pose execution.
const base=import.meta.dirname,packet=path.dirname(base),repo='/Users/nick/Projects/celestial-frontier-openai-mac';
const hashes=[],sha=b=>createHash('sha256').update(b).digest('hex');
function read(file){const bytes=fs.readFileSync(file);hashes.push({file,sha256:sha(bytes)});return bytes;}
const json=rel=>JSON.parse(read(path.join(packet,rel)));
const binding=json('fit-10/pre-regional-binding.json'),pre=json('fit-10/pre-split-binding.json'),record=json('fit-10/record.json'),author=json('candidate-12/authoring.json');
read(path.join(repo,'port/v2/tools/quadruped-proof/source-join-continuity.mjs'));read(path.join(packet,'regional-influences.mjs'));
read(path.join(repo,'port/v2/tools/creature-animation/split-observed-surfaces.mjs'));
const req=createRequire(path.join(repo,'port/v2/package.json')),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const master=PNG.sync.read(read(path.join(packet,'candidate-12/master.png'))),labels=PNG.sync.read(read(path.join(packet,'fit-10/labels.png'))),atlas=PNG.sync.read(read(path.join(packet,'fit-10/parts/atlas/'+author.id+'.png')));
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.width,height:atlas.height}});
const fields=new Map(binding.paintSkin.parts.map(p=>[p.id,p])),preFields=new Map(pre.paintSkin.parts.map(p=>[p.id,p]));
const join=probe.joins.find(j=>j.name==='body--leg3-far'),bodyLabel=author.parts.findIndex(p=>p.id==='body')+1;
assert(join&&bodyLabel>0);
function pixel(x,y){const k=(y*master.width+x)*4;return {pixel:[x,y],label:labels.data[k],rgba:Array.from(master.data.subarray(k,k+4))};}
function supportSet(part,s){return new Set(s.triangle.flatMap(i=>fields.get(part).vertices[i].triangle));}
function contribution(part,s,index){
  const field=fields.get(part),terms=[];
  for(let k=0;k<3;k++){const pv=field.vertices[s.triangle[k]];for(let j=0;j<3;j++)if(pv.triangle[j]===index)terms.push({projectedVertex:s.triangle[k],outerCorner:k,outerWeight:s.weights[k],fieldTriangle:pv.triangle,innerCorner:j,innerWeight:pv.barycentric[j],product:s.weights[k]*pv.barycentric[j]});}
  return {coefficient:terms.reduce((n,t)=>n+t.product,0),terms};
}
function coordinate(part,projectedIndex){const v=fields.get(part).vertices[projectedIndex];return [0,1].map(axis=>v.triangle.reduce((n,id,j)=>n+(axis===0?binding.paintSkin.vertices[id].x:binding.paintSkin.vertices[id].y)*v.barycentric[j],0));}
function sampleCoordinate(part,s){return [0,1].map(axis=>s.triangle.reduce((n,id,j)=>n+coordinate(part,id)[axis]*s.weights[j],0));}
function edgeContains([a,b],p){return p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);}
function edgePixels([a,b]){return a[0]===b[0]?[[a[0]-1,Math.min(a[1],b[1])],[a[0],Math.min(a[1],b[1])]]:[[Math.min(a[0],b[0]),a[1]-1],[Math.min(a[0],b[0]),a[1]]];}
// Outcome controls distinguish actual zero contribution from conservative membership.
const synthetic={triangle:[0,1,2],weights:[1,0,0]};
fields.set('_control',{vertices:[{triangle:[3,4,5],barycentric:[1,0,0]},{triangle:[6,7,8],barycentric:[1,0,0]},{triangle:[9,10,11],barycentric:[1,0,0]}]});
assert(supportSet('_control',synthetic).has(6));assert.equal(contribution('_control',synthetic,6).coefficient,0);assert.equal(contribution('_control',synthetic,3).coefficient,1);assert.equal(contribution('_control',{...synthetic,weights:[0,1,0]},6).coefficient,1);fields.delete('_control');
const pins=new Set(binding.paintSkin.solver.pins),regionRows=author.regionalInfluences.map(region=>{const field=fields.get(region.partId),members=[...new Set([...field.fieldTriangles,...field.vertices.flatMap(v=>v.triangle)])],selected=members.filter(i=>{const v=binding.paintSkin.vertices[i];return insideSourcePolygon(v.x,v.y,region.polygonPx);}).sort((a,b)=>a-b);return {id:region.id,joint:region.joint,selected,conflicts:selected.filter(i=>pins.has(i)&&JSON.stringify(binding.paintSkin.vertices[i].weights)!==JSON.stringify([[region.joint,1]]))};});
const wanted=[...new Set(regionRows.flatMap(r=>r.conflicts))];assert.deepEqual(wanted,[1621,1643]);
const rows=wanted.map(index=>{
  const v=binding.paintSkin.vertices[index],samples=[];
  for(const [sampleIndex,s] of join.samples.entries())if(supportSet(join.ancestorPart,s.ancestor).has(index)&&supportSet(join.descendantPart,s.descendant).has(index)){
    const ancestor=contribution(join.ancestorPart,s.ancestor,index),descendant=contribution(join.descendantPart,s.descendant,index);
    const adjacent=new Map();for(const edge of join.sourceEdges.filter(e=>edgeContains(e,s.source)))for(const [x,y]of edgePixels(edge)){const p=pixel(x,y);if(p.label===bodyLabel)adjacent.set(x+':'+y,p);}
    samples.push({sampleIndex,source:s.source,distancePx:Math.hypot(v.x-s.source[0],v.y-s.source[1]),ancestor,descendant,ancestorReconstructed:sampleCoordinate(join.ancestorPart,s.ancestor),descendantReconstructed:sampleCoordinate(join.descendantPart,s.descendant),adjacentBodyPixels:[...adjacent.values()]});
  }
  const bodyPixels=[...new Map(samples.flatMap(s=>s.adjacentBodyPixels).map(p=>[p.pixel.join(':'),p])).values()].map(p=>({...p,distanceToPixelCenterPx:Math.hypot(v.x-p.pixel[0]-.5,v.y-p.pixel[1]-.5)}));
  const correspondingPreIds=new Set();for(const part of [join.ancestorPart,join.descendantPart])for(const [i,pv]of fields.get(part).vertices.entries())for(let j=0;j<3;j++)if(pv.triangle[j]===index)correspondingPreIds.add(preFields.get(part).vertices[i].triangle[j]);
  assert.equal(correspondingPreIds.size,1);const preIndex=[...correspondingPreIds][0];assert.equal(pre.paintSkin.vertices[preIndex].x,v.x);assert.equal(pre.paintSkin.vertices[preIndex].y,v.y);
  return {index,preIndex,sourcePx:[v.x,v.y],weights:v.weights,sourcePixel:pixel(Math.floor(v.x),Math.floor(v.y)),sampleCount:samples.length,bothCoefficientZero:samples.filter(s=>s.ancestor.coefficient===0&&s.descendant.coefficient===0).length,bothCoefficientPositive:samples.filter(s=>s.ancestor.coefficient>0&&s.descendant.coefficient>0).length,eitherCoefficientPositive:samples.filter(s=>s.ancestor.coefficient>0||s.descendant.coefficient>0).length,maxCoefficient:Math.max(...samples.flatMap(s=>[s.ancestor.coefficient,s.descendant.coefficient])),minSampleDistancePx:Math.min(...samples.map(s=>s.distancePx)),maxSampleDistancePx:Math.max(...samples.map(s=>s.distancePx)),bodyPixels,samples};
});
const sourcePointErrors=rows.flatMap(r=>r.samples.flatMap(s=>[s.ancestorReconstructed,s.descendantReconstructed].map(p=>Math.hypot(p[0]-s.source[0],p[1]-s.source[1]))));
const result={scope:'Retained fit10 field region-conflict membership and rebuilt source-seam geometry only, then two-level interpolation and exact split conservative support membership; no pose, contact, solve, split, intake, or acceptance rerun.',conventions:{fieldCoordinates:'source pixel coordinates',pixelDistance:'Euclidean distance to the center [pixelX+0.5,pixelY+0.5]',positiveCoefficient:'strict >0; no epsilon or alpha threshold used',zeroCoefficient:'strict ===0'},bodyLabel,joinName:join.name,regionRows,maxReconstructionErrorPx:Math.max(...sourcePointErrors),controls:{zeroWeightConservativeMemberDetected:true,positiveWeightMutantDetected:true},rows,inputs:hashes.map(h=>({...h,unchanged:sha(fs.readFileSync(h.file))===h.sha256}))};
assert(result.inputs.every(h=>h.unchanged));
fs.writeFileSync(path.join(base,'weld-stencil-fit10.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({rows:rows.map(({samples,bodyPixels,...row})=>({...row,nearestBodyPixels:bodyPixels.slice().sort((a,b)=>a.distanceToPixelCenterPx-b.distanceToPixelCenterPx).slice(0,6)})),inputs:hashes.length,allUnchanged:true,maxReconstructionErrorPx:result.maxReconstructionErrorPx},null,2));
