import assert from'node:assert/strict';import{test}from'node:test';import fs from'node:fs/promises';import path from'node:path';import{createHash}from'node:crypto';import{loadContract,readSource,root}from'./phone-contract-loader.mjs';
const api=await loadContract(),modelHash=createHash('sha256').update(await fs.readFile(path.join(root,'tools/local-image-generation/model-manifest.json'))).digest('hex');
for(const id of api.IDS)test('canonical '+id+' source/receipt roundtrip; old proof keys, altered alpha, wrong model and labels refuse',async()=>{
 const bytes=await readSource(api,id),input=await api.admittedSource(id,bytes,modelHash);assert.equal(input.source.individualId,input.source.visualKey);assert.ok(input.source.individualId.length>512);assert.equal(input.source.modelHash,api.creatureFinishModelHashV1());let row;
 const engine=api.createCreatureFinishEngineV1({tier:'desktop',store:{find:async()=>null,read:async()=>null,close(){},async retain(identity,blob,receipt){const r=JSON.parse(receipt);return row={key:r.key,blob,receipt,sha256:api.sha(new Uint8Array(await blob.arrayBuffer()))};}},createInfer:async()=>async s=>({rgba:s.rgba.slice(),labels:s.labels.slice(),binding:s.binding.slice()})});
 try{const result=await engine.request(input.source);assert.equal(result.status,'original');const v=await api.verifyFinished(id,bytes,modelHash,row);assert.equal(v.key,row.key);
  await assert.rejects(api.verifyFinished(id,bytes,modelHash,{...row,key:'0'.repeat(64)}),/identity mismatch/);
  const receipt=JSON.parse(row.receipt);receipt.individualId=id;await assert.rejects(api.verifyFinished(id,bytes,modelHash,{...row,receipt:JSON.stringify(receipt)}),/identity mismatch/);
  await assert.rejects(api.admittedSource(id,bytes,'f'.repeat(64)),/model manifest pin/);
  const labels=bytes.labels.slice();labels[0]^=1;await assert.rejects(api.admittedSource(id,{...bytes,labels},modelHash),/labels pin/);
  const png=new Uint8Array(await row.blob.arrayBuffer());png[png.length-1]^=1;await assert.rejects(api.verifyFinished(id,bytes,modelHash,{...row,blob:new Blob([png],{type:'image/png'})}),/hash|digest|CRC|crc/);
 }finally{engine.close();}
});
