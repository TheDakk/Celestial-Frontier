/** Actual engine orchestration with fake GPU/ORT/canvas only: no checkout lock,
 * browser, model load or inference. These are lifecycle controls, not art proof. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createKitWorkerEngine} from './kit-worker-engine.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const names=['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'];
async function exercise(factory){
  const prior={navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),fetch:globalThis.fetch,OffscreenCanvas:globalThis.OffscreenCanvas,ImageData:globalThis.ImageData};
  const calls={create:{text:0,encode:0,denoise:0,decode:0},run:{text:0,encode:0,denoise:0,decode:0},release:0,draw:0,expansion:0,destroy:0};
  const bytes=new Uint8Array(128*128*4);
  for(let i=0;i<128*128;i++){bytes.set([255,0,255,255],i*4);const x=i%128,y=Math.floor(i/128);if(x>=16&&x<112&&y>=16&&y<112)bytes.set([80,90,40,255],i*4);}
  const plate=new Uint8Array(1024*576*4).fill(128),foreground=new Uint8Array(64*64*4).fill(255);
  const sha=hash(bytes);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{gpu:{async requestAdapter(){return {features:new Set(['shader-f16']),info:{isFallbackAdapter:false},limits:{maxBufferSize:1e9,maxStorageBufferBindingSize:1e9,maxStorageBuffersPerShaderStage:10},async requestDevice(){return {lost:new Promise(()=>{}),addEventListener(){},destroy(){calls.destroy++;}};}};}}}});
  globalThis.fetch=async url=>String(url).startsWith('/model/tokenizer/')?{ok:true,json:async()=>({})}:{ok:true,arrayBuffer:async()=>(String(url).includes('plate')?plate:String(url).includes('foreground')?foreground:bytes).slice().buffer};
  globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
  globalThis.OffscreenCanvas=class{constructor(width,height){Object.assign(this,{width,height});}getContext(){return {putImageData(){},getImageData:()=>({data:new Uint8ClampedArray(bytes)}),save(){},restore(){},translate(){},scale(){},drawImage(){calls.draw++;}};}async convertToBlob(){return new Blob(['explicit fixture bytes'],{type:'image/png'});}};
  const ort={env:{webgpu:{},wasm:{}},Tensor:class{constructor(type,data,dims){Object.assign(this,{type,data,dims});}dispose(){}},InferenceSession:{async create(graph){
    const kind=graph instanceof Uint8Array?'denoise':String(graph).includes('text_encoder')?'text':String(graph).includes('vae_encoder')?'encode':'decode';calls.create[kind]++;
    return {async run(feeds){calls.run[kind]++;let name,type,dims,data;
      if(kind==='text'){name='prompt_embeds';type='float16';dims=[1,feeds.input_ids.dims[1],7680];data=new Uint16Array(dims[1]*7680);}
      else if(kind==='encode'){name='packed_latent';type='float32';dims=[1,128,feeds.sample.dims[2]/16,feeds.sample.dims[3]/16];data=new Float32Array(dims[1]*dims[2]*dims[3]).fill(.25);}
      else if(kind==='denoise'){name='noise_pred';type='float16';dims=feeds.hidden_states.dims;data=new Uint16Array(feeds.hidden_states.data.length);}
      else{calls.protectedValues=feeds.packed_latent.data.filter(v=>v===.25).length;name='sample';type='float32';dims=[1,3,feeds.packed_latent.dims[2]*16,feeds.packed_latent.dims[3]*16];const n=dims[2]*dims[3];data=new Float32Array(n*3).fill(1);data.fill(-1,n,n*2);for(let y=32;y<96;y++)for(let x=32;x<96;x++)for(let c=0;c<3;c++)data[c*n+y*dims[3]+x]=0;}
      return {[name]:{type,dims,getData:async()=>data,dispose(){}}};},async release(){calls.release++;}};
  }}};
  const Tokenizer=class{encode(){return {ids:[1,2,3,4]};}token_to_id(){return 9;}};
  const ref={url:'/inputs/fixture.rgba',sha256:sha,width:128,height:128};
  const job={schema:'cf.kit-engine.v4',experiment:'cf.kit-contact.v1',skipOrganismPasses:true,textTokenCeiling:512,finisherSteps:1,
    width:1024,height:576,passSize:128,seed:133,steps:4,strength:.2,finisherStrength:.35,
    plate:{url:'/inputs/plate.rgba',sha256:hash(plate),width:1024,height:576},atlas:ref,triptych:ref,
    foreground:{url:'/inputs/foreground.rgba',sha256:hash(foreground),width:64,height:64},
    composition:{foreground:{width:.04,height:.04,groundOffset:1,placements:[{name:'Civet',centreAcrossBody:.5},{name:'Platypus',centreAcrossBody:.5}]}},
    finisherPrompt:'f'.repeat(120),passes:names.map((name,i)=>({name,identityKey:'identity-'+i,reference:ref,placement:{x:.12+i*.14,groundY:.8,width:.12,flip:i%2===0}}))};
  let engine;
  try{
    engine=await factory({ort,Tokenizer,progress(){},expand:async()=>{calls.expansion++;return {graph:Uint8Array.of(1),data:Uint8Array.of(2),receipt:{storageWrites:0}};}});
    const first=await engine.paint(job),second=await engine.paint(job);
    return {first,second,calls};
  }finally{await engine?.dispose();Object.defineProperty(globalThis,'navigator',prior.navigator);globalThis.fetch=prior.fetch;globalThis.OffscreenCanvas=prior.OffscreenCanvas;globalThis.ImageData=prior.ImageData;}
}
const reuseOracle=r=>{assert.deepEqual(r.calls.create,{text:1,encode:1,denoise:1,decode:1});assert.equal(r.calls.expansion,1);assert.equal(r.calls.draw,0);assert.equal(r.calls.run.decode,2);assert.equal(r.calls.run.denoise,2);assert.equal(r.calls.run.text,2);assert.equal(r.calls.run.encode,3);assert.equal(r.second.organismPasses,0);assert.ok(r.calls.protectedValues>128);assert.equal(r.second.boxes.length,6);assert.equal(r.second.qualityAccepted,false);};
test('actual engine skips organism inference and runs one protected finisher; all four sessions stay warm',async()=>{const r=await exercise(createKitWorkerEngine);reuseOracle(r);assert.equal(r.calls.release,4);assert.equal(r.calls.destroy,1);});
test('same reuse oracle rejects actual engine with its session cache bypassed',async()=>{
  const url=new URL('./kit-worker-engine.mjs',import.meta.url);let source=await fs.readFile(url,'utf8');
  const needle='if(sessions.has(kind))';assert.equal(source.split(needle).length,2);source=source.replace(needle,'if(false)');
  source=source.replace(/from '(\.\/[^']+)'/g,(_,relative)=>'from '+JSON.stringify(new URL(relative,url).href)).replace('import.meta.url',JSON.stringify(url.href));
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const r=await exercise(module.createKitWorkerEngine);assert.throws(()=>reuseOracle(r));assert.ok(r.calls.create.encode>1);assert.ok(r.calls.create.denoise>1);
});
