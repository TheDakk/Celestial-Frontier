import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateBlock32Pin,verifyPinnedFile,PARAMETER_BYTES,BLOCK32_VARIANT} from './q8-block32.mjs';
const parent={modelId:'cgb/flux2-klein-4b-onnx-webgpu',revision:'b'.repeat(40),files:[{path:'transformer_q8.onnx',sha256:'c'.repeat(64)}]};
const fixture=()=>({schema:'cf.q8-block32-runtime-pin/v1',variant:BLOCK32_VARIANT,runtimeQualified:false,qualityAccepted:false,changedNodes:103,
 parent:{modelId:parent.modelId,revision:parent.revision,graphSha256:'c'.repeat(64)},
 files:[{path:'transformer-q8-block32.onnx',bytes:123,sha256:'d'.repeat(64)},{path:'repacked-scale-zero.data',bytes:PARAMETER_BYTES,sha256:'e'.repeat(64)}]});
test('Runtime derivative pin binds exact parent and explicit unqualified child files',()=>{const pin=fixture();assert.equal(validateBlock32Pin(pin,parent),pin);});
test('Changed parent, arbitrary paths, missing bytes and manufactured acceptance are refused',()=>{
 const mutants=[p=>p.parent.revision='a'.repeat(40),p=>p.parent.graphSha256='0'.repeat(64),p=>p.parent.modelId='other/model',
 p=>p.files[0].path='../private',p=>p.files[1].bytes--,p=>p.files[0].sha256='no',p=>p.files.push(p.files[0]),
 p=>p.runtimeQualified=true,p=>p.qualityAccepted=true,p=>p.changedNodes=102,p=>p.variant='other'];
 for(const mutate of mutants){const p=fixture();mutate(p);assert.throws(()=>validateBlock32Pin(p,parent));}
});
test('Actual same-length corruption, truncation and symlink are rejected, then restored bytes pass',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cf-derivative-pin-'));
 try{
  const file=path.join(dir,'fixture.data'),data=Buffer.from([2,4,6,8,10]);
  const entry={path:'fixture.data',bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
  await fs.writeFile(file,data);assert.deepEqual(await verifyPinnedFile(file,entry),entry);
  await fs.writeFile(file,Buffer.from([2,4,0,8,10]));await assert.rejects(verifyPinnedFile(file,entry),/SHA mismatch/);
  await fs.writeFile(file,data.subarray(0,4));await assert.rejects(verifyPinnedFile(file,entry),/size mismatch/);
  await fs.writeFile(file,data);const link=path.join(dir,'link.data');await fs.symlink(file,link);await assert.rejects(verifyPinnedFile(link,entry),/type\/size/);
  assert.deepEqual(await verifyPinnedFile(file,entry),entry);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
