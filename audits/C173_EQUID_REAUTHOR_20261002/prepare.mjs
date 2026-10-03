// Preparation is deferred until the shared native reservation is terminal.
// This creates new audit packets; it never modifies the source packets or runtime.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {plans} from './authoring-plan.mjs';

const base='audits/C173_EQUID_REAUTHOR_20261002';
const sourceBase='audits/C163_REFERENCE_REPAIR_20261002/retained-heads';
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const [id,plan] of Object.entries(plans)){
  const source=sourceBase+'/'+id+'/original',fit=sourceBase+'/'+id+'/baseline-fit';
  const original=json(source+'/authoring.json'),candidate=structuredClone(original);
  const rootPart=original.parts.find(p=>p.id==='root');
  assert(rootPart,'fixed root paint must retain its exact original contour');
  assert.equal(original.parts.filter(p=>p.id==='root').length,1);
  const changedPartIds=Object.keys(plan.polygons);
  for(const partId of changedPartIds)assert.equal(original.parts.filter(p=>p.id===partId).length,1,'exact unique original part '+partId);
  for(const [joint,point] of Object.entries(plan.ears)){
    assert(/^ear(Near|Far)(Root|Tip)$/.test(joint));
    assert(Object.hasOwn(candidate.landmarksPx,joint));
    candidate.landmarksPx[joint]=point;
  }
  for(const part of candidate.parts)if(Object.hasOwn(plan.polygons,part.id))part.polygonPx=plan.polygons[part.id];
  // The fixed interior root remains exactly painted after broadening the chest.
  // Priority order is recorded as an explicit edit; no other part order changes.
  candidate.parts=[candidate.parts.find(p=>p.id==='root'),...candidate.parts.filter(p=>p.id!=='root')];
  assert.deepEqual(candidate.parts.map(p=>p.id).sort(),original.parts.map(p=>p.id).sort());
  for(const [joint,point] of Object.entries(original.landmarksPx))if(!Object.hasOwn(plan.ears,joint))assert.deepEqual(candidate.landmarksPx[joint],point);
  assert.equal(candidate.groundLineY,original.groundLineY);
  for(const part of original.parts)if(!changedPartIds.includes(part.id))assert.deepEqual(candidate.parts.find(p=>p.id===part.id),part);
  const out=base+'/'+id;
  fs.mkdirSync(out);
  fs.mkdirSync(out+'/original');
  fs.mkdirSync(out+'/candidate');
  const inputs=[];
  for(const name of ['master.png','authoring.json','subject-source.json','presence.json']){
    const bytes=read(source+'/'+name);
    fs.writeFileSync(out+'/original/'+name,bytes,{flag:'wx'});
    if(name!=='authoring.json')fs.writeFileSync(out+'/candidate/'+name,bytes,{flag:'wx'});
    inputs.push({path:source+'/'+name,snapshot:out+'/original/'+name,sha256:sha(bytes),bytes:bytes.length});
  }
  write(out+'/candidate/authoring.json',candidate);
  const record=json(fit+'/record.json');
  assert.equal(record.provenance.authoringSha256,sha(read(source+'/authoring.json')),'baseline fit must bind this exact authoring');
  assert.equal(record.geometry.cutoutAssetHash,sha(read(source+'/master.png')),'baseline fit must bind this exact painting');
  for(const name of ['record.json','binding.json'])inputs.push({path:fit+'/'+name,sha256:sha(read(fit+'/'+name))});
  const delta={schema:'cf.c173-equid-authoring-delta/v1',id,sourcePixelsChanged:false,groundLineChanged:false,nonEarLandmarksChanged:false,
    sourceLandmarksReused:true,sourceLabelsReused:false,coordinateUnit:'pixels of the original 1254-square painting',
    earLandmarks:Object.fromEntries(Object.keys(plan.ears).map(j=>[j,{original:original.landmarksPx[j],candidate:candidate.landmarksPx[j]}])),
    parts:changedPartIds.map(partId=>({id:partId,joint:original.parts.find(p=>p.id===partId).joint,original:original.parts.find(p=>p.id===partId).polygonPx,candidate:plan.polygons[partId]})),
    partOrder:{original:original.parts.map(p=>p.id),candidate:candidate.parts.map(p=>p.id),reason:'Keep the exact fixed interior root contour ahead of the broadened chest; every other relative order stays unchanged.'},
    reviewedSourceObservation:plan.review,
    scope:'Complete source-specific ears, head/neck/mane/chest and sixteen existing limb contours. Remaining original parts and anatomical owner IDs/layers stay exact. No source paint deletion, joint invention, ground shift, runtime change or cap change.',
    qualityAccepted:false,nativeAcceptance:false};
  write(out+'/authoring-delta.json',delta);
  rows.push({id,packet:out+'/candidate',fit:out+'/fit01',originalPacket:out+'/original',originalFit:fit,inputs,
    originalAuthoringSha256:sha(read(out+'/original/authoring.json')),candidateAuthoringSha256:sha(read(out+'/candidate/authoring.json'))});
}

// Retain the established audit intake checks. Only its prose/provenance changes
// from new-painting authoring to a successor that retains non-ear coordinates.
const oldHarness='audits/C163_REFERENCE_REPAIR_20261002/intake-v2.mjs';
let harness=read(oldHarness).toString();
const count=harness.split('sourceLandmarksReused:false').length-1;
assert.equal(count,3,'review every provenance declaration before deriving intake');
harness=harness.replaceAll('sourceLandmarksReused:false','sourceLandmarksReused:true');
const oldScope='One manually observed sprint painting; no family-wide visual acceptance';
assert.equal(harness.split(oldScope).length-1,1);
harness=harness.replace(oldScope,'One source-specific equid contour successor; four corrected ear landmarks and original non-ear landmarks; no family-wide visual acceptance');
fs.writeFileSync(base+'/intake.mjs',harness,{flag:'wx'});
write(base+'/harness-derivation.json',{schema:'cf.c173-audit-intake-derivation/v1',source:oldHarness,sourceSha256:sha(read(oldHarness)),target:base+'/intake.mjs',targetSha256:sha(Buffer.from(harness)),
  changes:[{from:'sourceLandmarksReused:false',to:'sourceLandmarksReused:true',count},{from:oldScope,to:'One source-specific equid contour successor; four corrected ear landmarks and original non-ear landmarks; no family-wide visual acceptance',count:1}],
  reason:'Truthful successor provenance; unchanged pixel intake, source joins, skin compilation, anatomical checks and thresholds.',checksChanged:false});
write(base+'/inputs.json',{schema:'cf.c173-equid-inputs/v1',rows,sourcePlan:{path:base+'/authoring-plan.mjs',sha256:sha(read(base+'/authoring-plan.mjs'))},nativeAcceptance:false});
console.log(JSON.stringify({prepared:rows.map(r=>r.id),sourcePaintingsChanged:false,compiled:false}));
