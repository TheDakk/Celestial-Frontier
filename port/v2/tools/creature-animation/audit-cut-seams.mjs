#!/usr/bin/env node
// Re-evaluate retained native frames without launching a browser or touching originals.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';import {acquireWorkspaceLock} from '../workspacelock.mjs';
import {verifyPartsDirectory} from './verify-parts.mjs';import {sharedCutEdges,measureCutSeam} from './cut-seam.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const sha=b=>createHash('sha256').update(b).digest('hex'),native=path.join(root,'audits/C2_PAIR_BANDS_20260913/native-gates-01'),base=path.join(root,'audits/C2_PAIR_BANDS_20260913/civet');
const report=JSON.parse(fs.readFileSync(path.join(native,'report.json'))),recordPath=path.join(root,'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json');
const release=acquireWorkspaceLock('C2 retained-frame cut diagnostic'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-cut-seam-'));
const inputs=[];const remember=p=>{const bytes=fs.readFileSync(p);inputs.push({path:path.relative(root,p),sha256:sha(bytes)});return bytes;};
try{
 for(const rel of ['port/v2/apps/game/src/creature-rig-contact.ts','port/v2/tools/creature-animation/kinematics.ts','port/v2/tools/creature-animation/quadruped-template.mjs','audits/CIVET_2D_PROOF_20260912/civet.landmarks.json','audits/C2_PAIR_BANDS_20260913/civet/binding.json','audits/C2_PAIR_BANDS_20260913/civet/atlas/civet.png','audits/C2_PAIR_BANDS_20260913/civet/declaration.json']){
  const absolute=path.join(root,rel),old=report.sources.find(s=>s.path===absolute);if(!old||sha(remember(absolute))!==old.sha256)throw Error('Native pose provenance mismatch: '+rel);
 }
 remember(path.join(native,'report.json'));const record=JSON.parse(fs.readFileSync(recordPath)),w=record.geometry.width,h=record.geometry.height;
 const bundle=await rolldown({input:path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts'),platform:'node'});try{await bundle.write({file:path.join(scratch,'pose.mjs'),format:'es'});}finally{await bundle.close();}
 const {poseMatrices}=await import(pathToFileURL(path.join(scratch,'pose.mjs')).href),verified=await verifyPartsDirectory(base);
 const mask=id=>{const p=verified.binding.parts.find(p=>p.id===id);if(!p||p.kind!=='part')throw Error('Missing base part');const src=PNG.sync.read(verified.sources.get(id)),out=new Uint8Array(w*h);
  for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(src.data[(y*src.width+x)*4+3]>8)out[(y+p.cutout.y)*w+x+p.cutout.x]=1;return out;};
 const rows=[];
 for(const old of report.pairGates.pairs){const cut=report.pairGates.cuts.find(c=>c.ancestor+'--'+c.descendant===old.name);if(!cut)throw Error('Missing declared cut');
  const edges=sharedCutEdges(mask(cut.ancestor),mask(cut.descendant),w,h);
  for(const [frame,value]of Object.entries(report.pairGates.poses)){
   const m=poseMatrices(record,value.pose);
   for(const variant of ['disc-only','bands']){
    const p=path.join(native,old.name,variant+'-'+frame+'.png'),png=PNG.sync.read(remember(p));if(png.width!==w||png.height!==h)throw Error('Wrong native frame size');
    const result=measureCutSeam({edges,ancestorMatrix:m[cut.ancestorJoint],descendantMatrix:m[cut.descendantJoint],rgba:png.data,width:w,height:h});
    rows.push({pair:old.name,frame,variant,...result});
   }
  }
 }
 console.log(JSON.stringify({schema:'cf.cut-seam-diagnostic/v1',nativeSource:report.source,originalGateStatus:report.status,scope:'Only pairs captured in the retained native report; no new native capture or shape acceptance',packedParts:verified.receipt,rows,inputs},null,2));
}finally{fs.rmSync(scratch,{recursive:true,force:true});release();}
