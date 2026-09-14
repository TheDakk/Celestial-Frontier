#!/usr/bin/env node
// A source-support diagnosis of the saved first failing pair, not a new renderer/gate.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';
import{rolldown}from'rolldown';import{acquireWorkspaceLock}from'../workspacelock.mjs';
import{verifyPartsDirectory}from'./verify-parts.mjs';import{rigidUnderlapSupport}from'./underlap-support.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=[];
const read=rel=>{const bytes=fs.readFileSync(path.join(root,rel));inputs.push({path:rel,sha256:sha(bytes)});return bytes;};
const release=acquireWorkspaceLock('C2 saved ear source-support diagnosis'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-ear-support-'));
try{
 const diagnostic=JSON.parse(read('audits/C_LANE_REPAIRS_20260914/cut-seams.json'));
 for(const old of diagnostic.inputs)if(sha(read(old.path))!==old.sha256)throw Error('Changed retained input: '+old.path);
 const native=JSON.parse(read('audits/C2_PAIR_BANDS_20260913/native-gates-01/report.json'));
 for(const rel of ['port/v2/apps/game/src/creature-rig.ts','port/v2/apps/game/src/creature-rig-contact.ts','port/v2/tools/creature-animation/kinematics.ts','port/v2/tools/creature-animation/quadruped-template.mjs']){
  const old=native.sources.find(row=>row.path===path.join(root,rel));if(!old||sha(read(rel))!==old.sha256)throw Error('Changed native transform owner: '+rel);
 }
 const record=JSON.parse(read('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'));
 const base='audits/C2_PAIR_BANDS_20260913/civet',verified=await verifyPartsDirectory(path.join(root,base));
 const ear=verified.binding.parts.find(p=>p.id==='ear-far'&&p.kind==='part');if(!ear)throw Error('Missing bound ear');
 const png=PNG.sync.read(read(base+'/parts/ear-far.png'));if(png.width!==ear.cutout.width||png.height!==ear.cutout.height)throw Error('Ear size mismatch');
 const bundle=await rolldown({input:path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts'),platform:'node'});
 try{await bundle.write({file:path.join(scratch,'pose.mjs'),format:'es'});}finally{await bundle.close();}
 const{poseMatrices}=await import(pathToFileURL(path.join(scratch,'pose.mjs')).href),rows=[];
 for(const old of diagnostic.rows.filter(r=>r.pair==='head--ear-far'&&r.variant==='bands'&&r.uncoveredPixels>0)){
  const pose=native.pairGates.poses[old.frame]?.pose;if(!pose)throw Error('Missing saved pose');
  const matrices=poseMatrices(record,pose),render=PNG.sync.read(read('audits/C2_PAIR_BANDS_20260913/native-gates-01/head--ear-far/bands-'+old.frame+'.png'));
  for(const i of old.missingPixelIndices){if(render.data[i*4+3]!==0)throw Error('Expected retained zero-alpha sample');
   rows.push({frame:old.frame,nativeAlpha:0,...rigidUnderlapSupport({width:record.geometry.width,height:record.geometry.height,cutout:ear.cutout,rgba:png.data,ancestorMatrix:matrices.head,target:[i%render.width,Math.floor(i/render.width)]})});
  }
 }
 if(rows.length!==6)throw Error('Unexpected saved failure inventory');
 const unsupported=rows.filter(r=>r.status==='NO_SOURCE_INK').length;
 console.log(JSON.stringify({schema:'cf.c2-ear-support/v1',nativeSource:native.source,status:'REPAIR_NOT_CLOSED',
  method:'Counterfactual complete-ear source is a superset of every depth-capped descendant band; no whole-ear asset is built or adopted',
  unsupported,rows,packedParts:verified.receipt,inputs,
  unchanged:['painting','masks','record/pivots','band depth/caps/ink/attachment','curves','atlas','native gate/threshold'],
  conclusion:unsupported===rows.length?'All six saved gap samples lack static descendant source ink; increasing band depth cannot close them. A cut/pivot or deformation change requires separate shape/rest qualification.':'Some samples have possible source support; inspect rows before attributing the gaps to missing source ink.'},null,2));
}finally{fs.rmSync(scratch,{recursive:true,force:true});release();}
