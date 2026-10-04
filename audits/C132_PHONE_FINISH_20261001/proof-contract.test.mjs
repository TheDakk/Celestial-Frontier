import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {float32Output,disposeTensors,conservationTerminal} from './proof-contract.mjs';
import {hashFile,verifyInputPins} from './verify-pins.mjs';

test('decoded ONNX outputs require exact float32 backing, dimensions, count and finite values',()=>{
 const good={type:'float32',dims:[1,2],data:new Float32Array([.5,-.25])};
 assert.equal(float32Output(good,[1,2],'output'),good.data);
 for(const mutant of [null,{...good,type:'float16'},{...good,data:new Uint16Array([1,2])},{...good,dims:[2,1]},{...good,data:new Float32Array([1])},{...good,data:new Float32Array([NaN,0])},{...good,data:new Float32Array([Infinity,0])}])assert.throws(()=>float32Output(mutant,[1,2],'output'));
 assert.equal(float32Output(good,[1,2],'output'),good.data);
});
test('every owned tensor is disposed even when one fails; duplicates are released once',()=>{
 let a=0,b=0;const first={dispose(){a++;throw Error('release failed');}},second={dispose(){b++;}};
 const owned=new Set([first,second,first]);assert.throws(()=>disposeTensors(owned),/Tensor cleanup/);
 assert.deepEqual([a,b,owned.size],[1,1,0]);disposeTensors(owned);assert.deepEqual([a,b],[1,1]);
});
test('conservation success never hides a missing/duplicate subject, native failure or cleanup/server error',()=>{
 const good=[{id:'a',status:'PASS'},{id:'b',status:'PASS'}],ids=['a','b'];
 assert.equal(conservationTerminal('complete',good,ids),'CONSERVATION_PASS');
 for(const [status,rows,errors]of[['failed',good,[]],['complete',good,['cleanup']],['complete',good,['server']],['complete',[good[0],good[0]],[]],['complete',[good[0]],[]],['complete',[good[0],{id:'b',status:'FAIL'}],[]]])assert.equal(conservationTerminal(status,rows,ids,errors),'LEAF_RED');
 assert.equal(conservationTerminal('complete',[...good].reverse(),ids),'CONSERVATION_PASS');
});
test('same pin verifier rejects source, prepared, model, tokenizer/runtime, manifest and HEAD drift at either boundary',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'cf-phone-pins-')),dir=path.join(root,'audit');
 try{
  await fs.mkdir(path.join(dir,'model-cache'),{recursive:true});
  const cases=[['sources',root,'runner.mjs'],['prepared',dir,'client.mjs'],['models',path.join(dir,'model-cache'),'image.onnx'],['runtimeFiles',root,'tokenizer.mjs']];
  const pin={};
  for(const[k,base,file]of cases){await fs.writeFile(path.join(base,file),'original-'+k);pin[k]=[{file,...await hashFile(path.join(base,file))}];}
  const manifest=path.join(dir,'prepared-manifest.json');await fs.writeFile(manifest,JSON.stringify(pin));
  const opts={root,dir,pin,manifestSha256:(await hashFile(manifest)).sha256,head:'head-a',readHead:()=> 'head-a'};
  for(const phase of ['start','end']){
   await verifyInputPins({...opts,phase});
   for(const[k,base,file]of cases){const p=path.join(base,file),original=await fs.readFile(p);await fs.writeFile(p,'changed');await assert.rejects(verifyInputPins({...opts,phase}),/drift/);await fs.writeFile(p,original);await verifyInputPins({...opts,phase});}
   await assert.rejects(verifyInputPins({...opts,phase,readHead:()=> 'head-b'}),/HEAD drift/);
   const original=await fs.readFile(manifest);await fs.writeFile(manifest,'changed');await assert.rejects(verifyInputPins({...opts,phase}),/manifest drift/);await fs.writeFile(manifest,original);
   await verifyInputPins({...opts,phase});
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
