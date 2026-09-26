import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {CREATURE_FINISH_SETTINGS,admitCreatureFinishJob,prepareCreatureFinishJob,readCreatureFinishRef,padCreatureFinishCanvas,cropCreatureFinishCanvas,creatureFinishMask,conserveCreaturePixels} from './creature-finish-math.mjs';
import {finishConservation} from '../../port/v2/tools/painted-creature/finish-conservation.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(w=1254,h=w){const master=new Uint8ClampedArray(w*h*4),labels=new Uint8ClampedArray(master.length);for(let y=8;y<h-8;y++)for(let x=8;x<w-8;x++){const i=(y*w+x)*4;master.set(x<w/2?[30,50,80,255]:[200,160,90,255],i);labels.set([x<w/2?1:2,0,0,255],i);}master.set([19,21,23,0],0);master.set([50,70,90,127],(w+1)*4);return {w,h,master,labels};}
function job(f=fixture(129)){const ref=bytes=>({width:f.w,height:f.h,buffer:bytes.slice().buffer,sha256:hash(bytes)});return {schema:'cf.creature-finish.v1',tier:'desktop',width:f.w,height:f.h,seed:1,settings:CREATURE_FINISH_SETTINGS,prompt:'p'.repeat(120),master:ref(f.master),labels:ref(f.labels)};}
test('1254 master pads to1264 without moving, scaling, relabeling or mutating original pixels',()=>{
 const f=fixture(),before=f.master.slice(),labelsBefore=f.labels.slice(),p=padCreatureFinishCanvas(f.master,f.labels,f.w,f.h);
 assert.equal(p.width,1264);assert.equal(p.height,1264);assert.equal(p.paddingRight,10);assert.equal(p.paddingBottom,10);
 assert.deepEqual(cropCreatureFinishCanvas(p.master,f.w,f.h,p.width,p.height),f.master);assert.deepEqual(cropCreatureFinishCanvas(p.labels,f.w,f.h,p.width,p.height),f.labels);
 const m=creatureFinishMask(p.master,p.labels,p.width,p.height),paint=new Uint8ClampedArray(p.master.length).fill(111),result=conserveCreaturePixels(p.master,paint,m.editable);
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(x>=f.w||y>=f.h){const i=y*p.width+x;assert.equal(m.editable[i],0);assert.deepEqual([...result.subarray(i*4,i*4+4)],[0,0,0,0]);assert.equal(p.labels[i*4],0);}
 const cropped=cropCreatureFinishCanvas(result,f.w,f.h,p.width,p.height);assert.notDeepEqual(cropped,f.master);assert.equal(finishConservation(f.master,cropped,f.labels,f.w,f.h).status,'PASS');assert.deepEqual([...cropped.subarray(0,4)],[19,21,23,0]);assert.equal(cropped[(f.w+1)*4+3],127);assert.deepEqual(f.master,before);assert.deepEqual(f.labels,labelsBefore);
 const alpha=cropped.slice();alpha[3]=1;assert.equal(finishConservation(f.master,alpha,f.labels,f.w,f.h).status,'FAIL');
 const shifted=p.master.slice();shifted.copyWithin(4,0);assert.equal(finishConservation(f.master,cropCreatureFinishCanvas(shifted,f.w,f.h,p.width,p.height),f.labels,f.w,f.h).status,'FAIL');
});
test('aligned old dimensions remain byte-identical; invalid dimensions/crop/source shapes refuse',()=>{
 const f=fixture(128),p=padCreatureFinishCanvas(f.master,f.labels,128,128);assert.equal(p.paddingRight,0);assert.equal(p.paddingBottom,0);assert.deepEqual(p.master,f.master);assert.deepEqual(p.labels,f.labels);
 for(const size of [0,127,2049,Infinity,NaN,128.5])assert.throws(()=>admitCreatureFinishJob({...job(f),width:size},'Macintosh'),/dimensions/);
 for(const size of [128,129,1254,2048]){const j=job(f);j.width=size;j.master.width=size;j.labels.width=size;j.master.buffer=new ArrayBuffer(size*128*4);j.labels.buffer=new ArrayBuffer(size*128*4);assert.equal(admitCreatureFinishJob(j,'Macintosh').width,size);}
 assert.throws(()=>cropCreatureFinishCanvas(p.master,128,128,144,128),/crop shape/);assert.throws(()=>padCreatureFinishCanvas(f.master.subarray(4),f.labels,128,128),/source shape/);
});
test('transferred buffers retain exact SHA/byte checks and old URL transport stays supported',async()=>{
 const original=job(),expected=new Uint8Array(original.master.buffer).slice(),j=structuredClone(original,{transfer:[original.master.buffer,original.labels.buffer]});assert.equal(original.master.buffer.byteLength,0);
 let fetches=0;const noFetch=async()=>{fetches++;throw Error('unexpected fetch');};
 const admitted=await prepareCreatureFinishJob(j,noFetch,'Macintosh');assert.deepEqual(new Uint8Array(admitted.master.buffer),expected);assert.equal(fetches,0);
 const legacy=job();const source=new Map();for(const kind of ['master','labels']){const r=legacy[kind];source.set('/inputs/'+kind+'.rgba',r.buffer);legacy[kind]={width:r.width,height:r.height,sha256:r.sha256,url:'/inputs/'+kind+'.rgba'};}
 const fromUrl=await prepareCreatureFinishJob(legacy,async url=>({ok:true,arrayBuffer:async()=>source.get(url)}),'Macintosh');assert.deepEqual(new Uint8Array(fromUrl.master.buffer),expected);assert.equal('url' in fromUrl.master,false);
});
test('corrupt, detached, ambiguous, shared, resized or wrong-size references fail closed',async()=>{
 const j=job(),ref=j.master;
 const corrupt=ref.buffer.slice(0);new Uint8Array(corrupt)[0]^=1;await assert.rejects(readCreatureFinishRef({...ref,buffer:corrupt}),/hash mismatch/);
 for(const mutant of [{...ref,buffer:ref.buffer.slice(4)},{...ref,buffer:new SharedArrayBuffer(ref.buffer.byteLength)},{...ref,buffer:new ArrayBuffer(ref.buffer.byteLength,{maxByteLength:ref.buffer.byteLength+4})},{...ref,url:'/inputs/master.rgba'},{...ref,buffer:undefined}])await assert.rejects(readCreatureFinishRef(mutant),/size|type|ambiguity/);
 const detached=ref.buffer.slice(0);structuredClone(detached,{transfer:[detached]});await assert.rejects(readCreatureFinishRef({...ref,buffer:detached}),/size/);
 const {buffer,...pin}=ref;await assert.rejects(readCreatureFinishRef(pin),/ambiguity/);await assert.rejects(readCreatureFinishRef({...pin,url:'blob:local'}),/URL/);
 await assert.rejects(readCreatureFinishRef({...pin,url:'/inputs/master.rgba'},async()=>({ok:true,arrayBuffer:async()=>buffer.slice(4)})),/size mismatch/);
 await assert.rejects(readCreatureFinishRef({...pin,url:'/inputs/master.rgba'},async()=>({ok:true,arrayBuffer:async()=>corrupt})),/hash mismatch/);
});
test('actual worker dispatch validates transferred bytes before constructing model engine',async()=>{
 let source=await fs.readFile(new URL('./kit-stage-worker.mjs',import.meta.url),'utf8');source=source.replace(/^import .+;\n/gm,'');let creates=0,finishes=0;const messages=[];
 const context={ort:{},Tokenizer:class{},onmessage:null,postMessage:m=>messages.push(m),prepareCreatureFinishJob,admitKitEngineJob(){throw Error('unexpected kit');},createKitWorkerEngine:async()=>{creates++;return {async finishCreature(recipe){finishes++;assert.ok(recipe.master.buffer instanceof ArrayBuffer);assert.equal('url' in recipe.master,false);return {status:'fixture'};},async dispose(){}};}};
 vm.runInNewContext(source,context);
 const bad=job();new Uint8Array(bad.labels.buffer)[8]^=1;await context.onmessage({data:{stage:'creature-finish-v1',requestId:1,recipe:bad}});assert.equal(messages.at(-1).type,'error');assert.match(messages.at(-1).message,/hash mismatch/);assert.equal(creates,0);assert.equal(finishes,0);
 const partial=fixture(129);for(let i=3;i<partial.master.length;i+=4)if(partial.master[i]===255)partial.master[i]=253;
 await context.onmessage({data:{stage:'creature-finish-v1',requestId:2,recipe:job(partial)}});assert.equal(messages.at(-1).type,'error');assert.match(messages.at(-1).message,/No editable creature interior/);assert.equal(creates,0);assert.equal(finishes,0);
 await context.onmessage({data:{stage:'creature-finish-v1',requestId:3,recipe:job()}});assert.equal(messages.at(-1).type,'complete');assert.equal(creates,1);assert.equal(finishes,1);
});
