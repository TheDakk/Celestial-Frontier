import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';
import{admitRecord,hashBytes,hashJSON}from'../creature-animation/quadruped-template.mjs';import{verifyPartsDirectory}from'../creature-animation/verify-parts.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),base='audits/BATTLE_FACING_20260916/platypus-02/';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
test('Platypus intake preserves every atlas channel and binds named Earth anatomy; old straight chains fail 3% slack',async()=>{
 const record=json(base+'record.json'),master=read(record.source),png=PNG.sync.read(read(base+'parts/keyed.png')),alpha=Uint8Array.from({length:png.width*png.height},(_,i)=>png.data[i*4+3]);await admitRecord(record,master,alpha);
 const verified=await verifyPartsDirectory(path.join(root,base,'parts'));assert.equal(verified.receipt.changedChannels,0);assert.equal(verified.binding.parts.length,17);assert.deepEqual(verified.binding.parts.filter(p=>p.joint.endsWith('Paw')).map(p=>p.joint).sort(),['foreFarPaw','foreNearPaw','hindNearPaw']);
 const slack=r=>{const j=r.landmarks,d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),body=d(j.chest,j.pelvis);return ['hindFar','foreFar','hindNear','foreNear'].map(n=>(d(j[n+'Root'],j[n+'Knee'])+d(j[n+'Knee'],j[n+'Ankle'])-d(j[n+'Root'],j[n+'Ankle']))/body);};
 assert.ok(slack(record).every(v=>v>=.03));assert.ok(slack(json('audits/BATTLE_FACING_20260916/platypus-01/record.json')).some(v=>v<.03));
 const broken=structuredClone(record);broken.landmarks.head[0]+=.01;await assert.rejects(()=>admitRecord(broken,master,alpha),/corrupted/);const badBytes=master.slice();badBytes[100]^=1;await assert.rejects(()=>admitRecord(record,badBytes,alpha),/hash/);
});
test('head views bind the unchanged accepted turnaround and record, and have real source pixels',async()=>{
 const binding=json('audits/BATTLE_THROAT_JOIN_20260916/head-04/views.json'),{bindingHash,...body}=binding;
 assert.equal(await hashJSON(body),bindingHash);assert.equal(await hashBytes(read(binding.source)),binding.sourceSha256);assert.equal(binding.recordRecipeHash,json('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json').recipeHash);
 for(const v of binding.views){const bytes=read('audits/BATTLE_THROAT_JOIN_20260916/head-04/'+v.file),png=PNG.sync.read(bytes);assert.equal(await hashBytes(bytes),v.sha256);assert.equal(png.width,v.width);assert.equal(png.height,v.height);assert.ok(v.paintedPixels>30000);}
 const corrupt=structuredClone(body);corrupt.views[0].scale+=.01;assert.notEqual(await hashJSON(corrupt),bindingHash);
});
