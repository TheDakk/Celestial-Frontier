import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {createHash} from 'node:crypto';
import {validatePhoneManifest,phoneRequest,PHONE_BYTE_LIMIT} from './phone-route-contract.mjs';import {phoneHandler} from './serve-phone.mjs';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),manifest=JSON.parse(await fs.readFile(path.join(dir,'phone-probe/manifest.json')));
test('actual phone route closure has only three image graphs, fixed embedding and bounded exact bytes',()=>{
 const routes=validatePhoneManifest(manifest);assert.equal(routes.size,20);assert(manifest.budget.servedBytes<PHONE_BYTE_LIMIT);
 for(const route of routes.keys())assert.equal(phoneRequest('GET',route,routes,manifest.subjectIds).status,200);
 for(const edit of [m=>m.qualityAccepted=true,m=>m.deviceQualified=true,m=>m.visualVerdict='ACCEPTED',m=>m.routes.push({...m.routes[0],route:'/models/text_encoder.onnx'}),m=>m.routes.push({...m.routes[0],route:'/tokenizer.mjs'}),m=>m.routes.pop(),m=>m.routes.push({...m.routes[0]}),m=>m.routes[0].file='/outside/file',m=>m.routes[0].file='../outside/file',m=>m.embedding.sha256='0'.repeat(64),m=>m.budget.servedBytes++,m=>m.budget.limitBytes++]){
  const candidate=structuredClone(manifest);edit(candidate);assert.throws(()=>validatePhoneManifest(candidate));
 }
 assert.equal(validatePhoneManifest(manifest).size,20);
});
test('forbidden routes and path variants cannot resolve to a pinned file or permitted output',()=>{
 const routes=validatePhoneManifest(manifest);
 for(const target of ['/models/text_encoder.onnx','/tokenizer.mjs','/tokenizer.json','/tokenizer-config.json','/ort/other.wasm','/models/unet.onnx?x=1','/models/%75net.onnx','/models/../models/unet.onnx','//models/unet.onnx','http://elsewhere/models/unet.onnx','/model-cache/sdxs/text_encoder.onnx'])assert.notEqual(phoneRequest('GET',target,routes,manifest.subjectIds).status,200,target);
 assert.equal(phoneRequest('GET','/embedding.f32',routes,manifest.subjectIds,true).status,403);
 assert.equal(phoneRequest('HEAD','/models/unet.onnx',routes,manifest.subjectIds).status,405);
 for(const target of ['/output/embedding.f32','/output/unknown-finished.png','/output/../result.json','/models/unet.onnx'])assert.equal(phoneRequest('POST',target,routes,manifest.subjectIds).status,403);
 assert.equal(phoneRequest('POST','/output/'+manifest.subjectIds[0]+'-finished.png',routes,manifest.subjectIds).status,200);
});
test('actual HTTP handler serves exact embedding bytes and rejects text/tokenizer, unknown, query, range and duplicate writes',async()=>{
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'cf-phone-route-controls-')),errors=[],requests=[];
 const server=http.createServer(phoneHandler({root,routes:validatePhoneManifest(manifest),subjectIds:manifest.subjectIds,output,errors,requests}));
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const port=server.address().port;
  const request=(method,target,body='',headers={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,method,path:target,headers},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks),headers:res.headers}));});req.on('error',reject);req.end(body);});
  const good=await request('GET','/embedding.f32');assert.equal(good.status,200);assert.equal(good.body.length,236544);assert.equal(createHash('sha256').update(good.body).digest('hex'),manifest.embedding.sha256);assert.equal(good.headers['cross-origin-embedder-policy'],'require-corp');
  for(const target of ['/models/text_encoder.onnx','/tokenizer.mjs','/tokenizer.json','/tokenizer-config.json','/ort/other.wasm','/model-cache/sdxs/text_encoder.onnx'])assert.equal((await request('GET',target)).status,404);
  for(const target of ['/models/unet.onnx?x=1','/models/%75net.onnx','/models/../models/unet.onnx','//models/unet.onnx'])assert.equal((await request('GET',target)).status,403);
  assert.equal((await request('GET','/embedding.f32','',{Range:'bytes=0-3'})).status,403);
  assert.equal((await request('POST','/output/embedding.f32','wrong')).status,403);
  const target='/output/'+manifest.subjectIds[0]+'-finished.png';assert.equal((await request('POST',target,'first')).status,200);assert.equal((await request('POST',target,'second')).status,500);
  assert.equal(await fs.readFile(path.join(output,manifest.subjectIds[0]+'-finished.png'),'utf8'),'first');assert.equal(errors.length,1);assert.match(errors[0],/EEXIST/);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(output,{recursive:true,force:true});}
});
