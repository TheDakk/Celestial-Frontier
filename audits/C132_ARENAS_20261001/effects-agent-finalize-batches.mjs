import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {assertReceipt} from './finalize-one.mjs';
const root=process.cwd(),base='audits/C132_ARENAS_20261001';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const groups=[
 {batch:'02',ids:['karst','saltpan-r2','fungal','geode'],evidenceIds:['karst','saltpan','saltpan-r2','fungal','geode'],held:['saltpan/intake-held.json']},
 {batch:'03',ids:['emberfield','stormeye','acidhaze','hotglow'],evidenceIds:['emberfield','stormeye','acidhaze','hotglow'],held:[]}
];
for(const group of groups){
 const rows=[],receipts=[],corrections=[],holdBindings=[];let bound=0,privacyChecked=0,runtimeBytes=0;
 for(const id of group.ids){
  const prefix=base+'/'+id,reportPath=prefix+'/d29/delivery-review.json',r=json(reportPath),manifestPath=prefix+'/d29/delivery.pending.json',m=json(manifestPath);
  assert.equal(r.masterCandidate.ok,true);assert.equal(r.runtimeCandidate.ok,true);assert.equal(r.registration.ok,false);assert.equal(r.qualityAccepted,false);assert.equal(r.registered,false);
  assert(r.registration.failures.some(s=>s.startsWith('acceptance.qualityAccepted:')));
  assert.deepEqual(r.nativeCanvas,{width:1672,height:941});
  for(const b of r.sourceAndInputBindings){assert.equal(sha(read(b.path)),b.sha256,b.path);bound++;}
  const plateBytes=Object.values(m.plates).reduce((n,p)=>n+read(p.runtime).length,0);runtimeBytes+=plateBytes;
  rows.push({id,biome:r.biome,status:r.status,review:reportPath,reviewSha256:sha(read(reportPath)),manifest:manifestPath,manifestSha256:sha(read(manifestPath)),notes:r.review.notes,notesSha256:sha(read(r.review.notes)),masterCandidatePass:true,runtimeCandidatePass:true,falseAcceptanceRegistrationRefused:true,runtimeBytes:plateBytes,findings:r.review.findings});
 }
 for(const id of group.evidenceIds){
  const prefix=base+'/'+id;
  for(const name of fs.readdirSync(path.join(root,prefix))){
   const p=prefix+'/'+name;
   if(/\.(json|txt|mjs|md)$/.test(name)){
    assert(!/\/Users\//.test(read(p).toString()),'absolute home path');assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(read(p).toString()),'email');privacyChecked++;
   }
   if(name.endsWith('.generation.json')){
    const r=json(p);assertReceipt(r,read(r.retainedMaster));const source=path.join(os.homedir(),r.sourceToolOutput.slice(2));assert.equal(sha(fs.readFileSync(source)),r.sourceSha256,'original tool output still exact');
    const meta=await sharp(read(r.retainedMaster)).metadata();
    receipts.push({receipt:p,receiptSha256:sha(read(p)),master:r.retainedMaster,masterSha256:r.retainedSha256,width:meta.width,height:meta.height,status:r.status,reusedUnmodifiedOriginalFrom:r.reusedUnmodifiedOriginalFrom??null});
   }
   if(name.endsWith('-correction.prompt.txt')){
    const original=prefix+'/'+name.replace('-correction',''),a=read(original).toString().trimEnd(),b=read(p).toString().trimEnd();
    const split=s=>{const [before,rest]=s.split('\nSUBJECT\n');assert(rest);const marker=rest.includes('\nACCURACY\n')?'\nACCURACY\n':'\nLAYOUT\n';const [subject,after]=rest.split(marker);assert(after);return {before,subject,after:marker+after};};
    const aa=split(a),bb=split(b);assert.equal(aa.before,bb.before);assert.equal(aa.after,bb.after);
    corrections.push({original,originalSha256:sha(read(original)),correction:p,correctionSha256:sha(read(p)),scope:'SUBJECT only; frozen reference/style/layout/accuracy/technical/negative paragraphs unchanged'});
   }
  }
 }
 for(const p of group.held){const rel=base+'/'+p;holdBindings.push({path:rel,sha256:sha(read(rel)),hold:json(rel)});}
 const free=fs.statfsSync(root);const record={schema:'cf.c132-arena-effects-agent-batch/v1',date:'2026-10-02',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:'FOUR_MECHANICAL_CANDIDATES_VISUAL_REVIEW_HELD',newTriplets:4,selectedNewOriginals:12,retainedUniqueOriginals:new Set(receipts.map(r=>r.masterSha256)).size,reusedOriginalCopies:receipts.filter(r=>r.reusedUnmodifiedOriginalFrom).length,upscaled:false,originalPixelsModified:false,qualityAccepted:false,registered:false,nativeRun:false,validation:{masterAndRuntimeCandidatePasses:8,falseAcceptanceRegistrationRefusals:4,sourceAndInputHashesChecked:bound,generationReceiptAndOriginalToolHashesChecked:receipts.length,selectedNativeCanvas:[1672,941],subjectOnlyCorrectionsVerified:corrections.length,privacyRecordsChecked:privacyChecked},runtimeBytes,packBudgetAdmission:'HELD: additive delivery only; current aggregate arena PNG pack exceeds the unchanged 128MiB cap. No original/registry/budget change.',diskFreeGiBAtCompletion:Math.round(free.bavail*free.bsize/2**30*100)/100,rows,originals:receipts,promptCorrections:corrections,predecessorHolds:holdBindings,remainingAssignedQueue:group.batch==='02'?['emberfield','stormeye','acidhaze','hotglow']:[]};
 const dest=base+'/effects-agent-batch-'+group.batch+'.json';fs.writeFileSync(dest,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({path:dest,sha256:sha(read(dest)),validation:record.validation,runtimeBytes,uniqueOriginals:record.retainedUniqueOriginals}));
}

