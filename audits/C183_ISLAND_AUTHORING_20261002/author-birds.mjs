// Run only in an agreed offline preparation slot; older packets are immutable.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {contours} from './bird-contours.mjs';
const base='audits/C183_ISLAND_AUTHORING_20261002',read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const input of json(base+'/bird-inputs.json').rows){
 const original=json(input.packet+'/authoring.json'),candidate=structuredClone(original),at=candidate.parts.findIndex(p=>p.id===candidate.remainderPart),plan=contours[input.id];
 assert(at>=0);assert(plan);assert(plan.every(p=>original.parts.some(o=>o.joint===p.joint)),'existing anatomical owners only');
 const regions=plan.map(({reason,...p})=>p);candidate.parts.splice(at,0,...regions);
 assert.deepEqual(candidate.landmarksPx,original.landmarksPx);assert.equal(candidate.groundLineY,original.groundLineY);
 assert.deepEqual(candidate.parts.filter(p=>!p.id.startsWith('reviewed-')),original.parts,'all prior anatomical regions and order stay exact');
 const packet=base+'/'+input.id+'/candidate';fs.mkdirSync(packet);
 for(const name of ['master.png','subject-source.json','presence.json'])fs.writeFileSync(packet+'/'+name,read(input.packet+'/'+name),{flag:'wx'});
 write(packet+'/authoring.json',candidate);
 const delta={schema:'cf.c183-bird-contour-delta/v1',id:input.id,originalAuthoringSha256:sha(read(input.packet+'/authoring.json')),candidateAuthoringSha256:sha(read(packet+'/authoring.json')),sourcePlanSha256:sha(read(base+'/bird-contours.mjs')),regions:plan,
  scope:'Manual source-contour additions after all original anatomical owners and before the original remainder. Only previously remainder-owned paint may move; old landmarks, ground, presence, materials, part regions and prior anatomical ownership remain unchanged.',
  originalOrigin:'Automatic same-family reference transfer retained; only the additive contours are manually source-reviewed. This is not an independent family reference.',sourcePaintChanged:false,nativeAcceptance:false};
 write(base+'/'+input.id+'/contour-delta.json',delta);rows.push({id:input.id,packet,fit:base+'/'+input.id+'/fit01',originalPacket:input.packet,originalFit:input.fit});
}
const source='audits/C163_REFERENCE_REPAIR_20261002/intake-v2.mjs';let harness=read(source).toString();
assert.equal(harness.split('sourceLandmarksReused:false').length-1,3);harness=harness.replaceAll('sourceLandmarksReused:false','sourceLandmarksReused:true');
const from='One manually observed sprint painting; no family-wide visual acceptance',to='Exact native-selected C211 bird with original transferred geometry and manual additive source contours; not an independent reference or quality acceptance';assert.equal(harness.split(from).length-1,1);harness=harness.replace(from,to);
fs.writeFileSync(base+'/intake.mjs',harness,{flag:'wx'});
write(base+'/intake-derivation.json',{schema:'cf.c183-intake-derivation/v1',source,sourceSha256:sha(read(source)),target:base+'/intake.mjs',targetSha256:sha(Buffer.from(harness)),changes:[{from:'sourceLandmarksReused:false',to:'sourceLandmarksReused:true',count:3},{from,to,count:1}],checksChanged:false,reason:'Truthful successor provenance only.'});
write(base+'/bird-candidates.json',{schema:'cf.c183-bird-candidates/v1',rows,nativeAcceptance:false});
console.log(JSON.stringify({prepared:rows.map(r=>r.id),compiled:false}));
