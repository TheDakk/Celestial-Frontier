import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {setup,PNG} from '../C172_SHARED_HEAD_SPIKE_20261002/publication.mjs';
import {rasterPaint} from '../C132_FAINT_GROUND_20261002/render-mesh.mjs';
import {createSourceJoinProbe,assessSourceJoinContinuity} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {createOpaqueSeamSamplingGuard,applyOpaqueSeamSamplingGuard} from '../../port/v2/tools/creature-animation/seam-sampling-guard.mjs';
const base='audits/C183_REMAINING_HOLDS_20261002',reportPath='audits/G1_AUTO_AUTHOR_20260926/native-g2c197-fishseams/flounder/native/report.json',report=JSON.parse(fs.readFileSync(reportPath)),sha=b=>createHash('sha256').update(b).digest('hex');
const native={...report.gates,turn:report.gates.turns[3],stillTime:report.stills.find(s=>s.file==='turn3-hit-idle-90.png').ms},held=native.stillTime-native.turn.offsetMs-native.turn.beats.reactionStart;
const pins=report.sources;assert(Array.isArray(pins));
for(const name of ['record.json','binding.json']) {const expected=pins.find(p=>p.path.endsWith('/flounder/fit/'+name));assert(expected);assert.equal(sha(fs.readFileSync(base+'/flounder-input/'+name)),expected.sha256);}
const rows=[];
for(const [id,fit] of [['before',base+'/flounder-input'],['candidate',base+'/flounder/fit01']]){
 const s=setup({native,fit}),probe=createSourceJoinProbe({record:s.record,binding:s.binding,atlas:{width:s.atlas.width,height:s.atlas.height,rgba:s.atlas.data}});
 try {const frame=s.publish('right',held),measurement=assessSourceJoinContinuity(probe,frame.positions),guard=createOpaqueSeamSamplingGuard({record:s.record,binding:s.binding,atlas:{width:s.atlas.width,height:s.atlas.height,rgba:s.atlas.data}}),atlas={...s.atlas,data:applyOpaqueSeamSamplingGuard(Uint8Array.from(s.atlas.data),s.atlas.width,s.atlas.height,guard)};
 fs.writeFileSync(base+'/flounder/'+id+'-held-right.png',PNG.sync.write(rasterPaint(s.record,s.binding,atlas,frame.positions,-1)),{flag:'wx'});rows.push({id,status:'PUBLISHED',measurement,pose:frame.target});
 } catch(error){rows.push({id,status:'REFUSED',error:String(error.message)});}
}
fs.writeFileSync(base+'/flounder/measurement.json',JSON.stringify({schema:'cf.c183-source-boundary-diagnostic/v1',report:reportPath,reportSha256:sha(fs.readFileSync(reportPath)),exactNativeRecordBindingVerified:true,heldElapsedMs:held,scope:'Browser-free software publication of the recorded target held pose under current motion source; not native qualification. Continuous-flank boundaries are observed before deciding whether to author a join.',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(r=>({id:r.id,status:r.status,error:r.error,excluded:r.measurement?.excluded.map(e=>({name:e.name,maxGapPx:e.maxGapPx}))}))));
