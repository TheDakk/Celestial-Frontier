/** Execute the actual worker body with stub ORT/device boundaries. No model,
 * native GPU, browser, download or real performance/quality claim. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import * as math from './pipeline-math.mjs';
import {denoiserShapeSessionOptions} from './denoiser-shapes.mjs';

const moduleSource=readFileSync(new URL('./stage-worker.mjs',import.meta.url),'utf8');
const imports=[
  "import * as ort from './node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';\n",
  "import { Tokenizer } from './node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';\n",
  "import {\n  encodeFloat16, decodeFloat16, copyFloat16Bits, seededGaussianNoise, createSigmaSchedule,\n  packedLatentsToTokens, tokensToPackedLatents, createImageIds, eulerOutputStep,\n} from './pipeline-math.mjs';\n",
  "import {createNativeProfileCapture} from './gpu-profile.mjs';\n",
  "import {denoiserShapeSessionOptions} from './denoiser-shapes.mjs';\n",
];
let actualBody=moduleSource;
for(const statement of imports){assert.equal(actualBody.split(statement).length,2);actualBody=actualBody.replace(statement,'');}
assert.equal(actualBody.split('import.meta.url').length,2);
actualBody=actualBody.replace('import.meta.url',JSON.stringify('http://127.0.0.1:4141/stage-worker.mjs'));
const schema='cf.denoise-first-step.v1';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function job(overrides={}){
  return {stage:'denoise',width:1024,height:576,seed:133,steps:4,q8Block32:false,profile:false,
    diagnostic:{schema},embedding:new Uint16Array(512*7680),
    references:Array.from({length:6},()=>({width:480,height:320,data:new Float32Array(30*20*128)})),...overrides};
}
function harness({holdRun=false,holdReadback=false,runError=false,readbackError=false,releaseError=false,mutate=null}={}){
  const messages=[],transfers=[],runs=[],trace=[];let adapterCalls=0,releaseCalls=0,destroyCalls=0,readbackCalls=0,disposed=0,tick=0;
  const runGate=deferred(),readbackGate=deferred(),lost=deferred(),listeners=new Map();
  class Tensor{
    constructor(type,data,dims){this.type=type;this.data=data;this.dims=dims;}
    dispose(){disposed++;}
  }
  const device={lost:lost.promise,
    addEventListener(name,listener){listeners.set(name,listener);},
    destroy(){destroyCalls++;trace.push('destroy');lost.resolve({reason:'destroyed',message:'intentional fixture cleanup'});},
  };
  const session={inputNames:['hidden_states','encoder_hidden_states','timestep','img_ids','txt_ids'],outputNames:['noise_pred'],
    async run(feeds){
      runs.push({hiddenDims:[...feeds.hidden_states.dims],textDims:[...feeds.encoder_hidden_states.dims],
        imageIdDims:[...feeds.img_ids.dims],timestep:feeds.timestep.data[0]});trace.push('run');
      if(runError)throw Error('fixture run rejection');if(holdRun)await runGate.promise;
      const data=new Uint16Array(feeds.hidden_states.data.length);
      return {noise_pred:{type:'float16',dims:[...feeds.hidden_states.dims],
        async getData(){readbackCalls++;trace.push('getData');if(readbackError)throw Error('fixture readback rejection');
          if(holdReadback)await readbackGate.promise;return data;},
        dispose(){disposed++;},
      }};
    },
    async release(){releaseCalls++;trace.push('release');if(releaseError)throw Error('fixture release rejection');},
  };
  const ort={env:{versions:{web:'1.29.0'},webgpu:{},wasm:{}},Tensor,InferenceSession:{
    async create(url,options){trace.push('create');assert.equal(url,'/model/transformer_q8.onnx');
      assert.deepEqual(Array.from(options.executionProviders),['webgpu']);return session;},
  }};
  const sandbox={...math,ort,denoiserShapeSessionOptions,
    createNativeProfileCapture(){throw Error('Unexpected profile request');},Tokenizer:class{},
    Uint16Array,Float32Array,BigInt64Array,Uint8Array,ArrayBuffer,URL,Promise,console,setTimeout,clearTimeout,
    performance:{now:()=>tick++},self:{location:{href:'http://127.0.0.1:4141/stage-worker.mjs'}},onmessage:null,
    navigator:{gpu:{async requestAdapter(){adapterCalls++;return {features:new Set(['shader-f16']),info:{isFallbackAdapter:false},
      limits:{maxBufferSize:4294967292,maxStorageBufferBindingSize:4294967292,maxStorageBuffersPerShaderStage:10},
      async requestDevice(){return device;}};}}},
    postMessage(message,moved=[]){messages.push(message);transfers.push(moved);},
  };
  let body=actualBody;if(mutate)body=mutate(body);
  runInNewContext("'use strict';\n"+body,sandbox,{filename:'actual-stage-worker.mjs'});
  return {messages,runs,trace,transfers,run:value=>sandbox.onmessage({data:value}),
    stats:()=>({adapterCalls,releaseCalls,destroyCalls,readbackCalls,disposed}),
    resolveRun:()=>runGate.resolve(),resolveReadback:()=>readbackGate.resolve(),
    loseDevice:(message='fixture device lost')=>lost.resolve({reason:'unknown',message}),
    gpuError:(message='fixture GPU error')=>listeners.get('uncapturederror')?.({error:{message}}),
  };
}
const phases=h=>h.messages.filter(row=>row.type==='diagnostic').map(row=>row.phase);
const complete=h=>h.messages.filter(row=>row.type==='diagnostic-complete');
const expectedPhases=['admitted','device-ready','session-create-start','session-create-complete','run-start',
  'run-complete','readback-start','readback-complete','first-step-complete','session-release-start',
  'session-release-complete','device-destroyed'];
function assessSuccessfulFixture(h){
  assert.deepEqual(phases(h),expectedPhases);
  const events=h.messages.filter(row=>row.type==='diagnostic');
  assert.deepEqual(events.map(row=>row.sequence),Array.from({length:12},(_,index)=>index+1));
  assert.ok(events.every((row,index)=>row.schema===schema&&Number.isFinite(row.elapsedMs)&&row.elapsedMs>=0
    &&(!index||row.elapsedMs>=events[index-1].elapsedMs)));
  assert.equal(h.runs.length,1);assert.equal(h.stats().readbackCalls,1);
  assert.deepEqual(h.runs[0].hiddenDims,[1,5904,128]);assert.deepEqual(h.runs[0].textDims,[1,512,7680]);
  assert.deepEqual(h.runs[0].imageIdDims,[1,5904,4]);
  assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);
  assert.equal(complete(h).length,1);assert.equal(h.messages.some(row=>row.type==='complete'||row.type==='error'),false);
  const result=complete(h)[0];assert.equal(result.schema,schema);assert.equal(result.completedSteps,1);assert.equal(result.plannedSteps,4);
  assert.deepEqual(Array.from(result.sigmas),Array.from(math.createSigmaSchedule(64*36,4)));
  assert.deepEqual(Array.from(result.dims),[1,128,36,64]);assert.ok(result.data instanceof Float32Array);
  assert.equal(result.data.length,128*36*64);assert.equal(h.transfers.at(-1)[0],result.data.buffer);
  assert.equal(h.messages.filter(row=>row.type==='progress'&&row.phase==='step').length,1);
  return result;
}

test('actual diagnostic worker executes one step at the exact shape, retains four-step sigmas and releases before a distinct partial result',async()=>{
  const h=harness(),input=job();await h.run(input);await flush();const result=assessSuccessfulFixture(h);
  const expected=math.tokensToPackedLatents(math.seededGaussianNoise(64*36*128,133),36,64);
  assert.deepEqual(result.data,expected); // Stub noise prediction is exactly zero; real Euler math must preserve these latents.
  assert.equal(h.runs[0].timestep,math.encodeFloat16(new Float32Array([1]))[0]);
  assert.equal(h.messages.some(row=>row.phase==='device-lost'),false); // Deliberate device.destroy() is not a fault.
  await h.run(input);assert.equal(h.runs.length,1); // Single-use worker must not accept another job.
});

test('ordinary worker preserves four runs, original progress/completion type and math without diagnostic messages',async()=>{
  const h=harness();await h.run(job({diagnostic:undefined}));await flush();
  assert.equal(h.runs.length,4);assert.equal(h.stats().readbackCalls,4);assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);
  assert.equal(phases(h).length,0);assert.equal(complete(h).length,0);
  assert.deepEqual(h.messages.filter(row=>row.type==='progress'&&row.phase==='step').map(row=>[row.step,row.steps]),[[1,4],[2,4],[3,4],[4,4]]);
  const result=h.messages.find(row=>row.type==='complete');assert.ok(result);assert.equal(h.messages.some(row=>row.type==='error'),false);
  assert.deepEqual(Array.from(result.sigmas),Array.from(math.createSigmaSchedule(64*36,4)));
  assert.deepEqual(result.data,math.tokensToPackedLatents(math.seededGaussianNoise(64*36*128,133),36,64));
});

test('invalid diagnostic mode/schema/model/profile/seed/schedule/shapes are refused before any GPU request',async()=>{
  const base=job();const variants=[{diagnostic:null},{diagnostic:{}},{diagnostic:{schema:'other'}},{diagnostic:{schema,extra:true}},
    {stage:'encode'},{q8Block32:true},{q8Block32:undefined},{profile:true},{profile:undefined},{fixedDenoiserShapes:true},
    {width:768,height:432},{seed:134},{steps:1},{steps:5},{embedding:new Uint16Array(5)},
    {embedding:new Float32Array(512*7680)},{references:base.references.slice(0,5)},
    {references:[...base.references,base.references[0]]},
    {references:base.references.map((row,index)=>index===2?{...row,width:512,height:288}:row)},
    {references:base.references.map((row,index)=>index===2?{...row,data:new Uint16Array(30*20*128)}:row)}];
  for(const fields of variants){const h=harness();await h.run({...base,...fields});
    assert.equal(h.stats().adapterCalls,0);assert.equal(h.messages.filter(row=>row.type==='error').length,1);assert.equal(complete(h).length,0);}
});

test('nonfinite float16 embeddings and reference data are refused before allocation or model creation',async()=>{
  const base=job(),badEmbedding=new Uint16Array(base.embedding);badEmbedding[19]=0x7c00;
  const badReference=new Float32Array(base.references[0].data);badReference[37]=NaN;
  for(const input of [{...base,embedding:badEmbedding},{...base,references:[{...base.references[0],data:badReference},...base.references.slice(1)]}]){
    const h=harness();await h.run(input);assert.equal(h.stats().adapterCalls,0);assert.match(h.messages.at(-1).message,/Nonfinite/);
  }
});

test('deferred actual run and readback promises expose different durable boundaries',async()=>{
  const h=harness({holdRun:true,holdReadback:true}),running=h.run(job());await flush();
  assert.equal(phases(h).at(-1),'run-start');assert.equal(h.stats().readbackCalls,0);assert.equal(complete(h).length,0);
  h.resolveRun();await flush();assert.equal(phases(h).at(-1),'readback-start');assert.equal(h.stats().readbackCalls,1);assert.equal(complete(h).length,0);
  h.resolveReadback();await running;assessSuccessfulFixture(h);
});

test('run rejection cannot be reported as readback or completion and preserves the failed boundary',async()=>{
  const h=harness({runError:true});await h.run(job());
  assert.equal(h.stats().readbackCalls,0);assert.equal(complete(h).length,0);
  const failure=h.messages.find(row=>row.type==='diagnostic'&&row.phase==='error');assert.equal(failure.atPhase,'run-start');
  assert.match(failure.message,/fixture run rejection/);assert.equal(phases(h).includes('run-complete'),false);
  assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);
});

test('readback rejection is distinct from completed execution and cannot publish partial success',async()=>{
  const h=harness({readbackError:true});await h.run(job());
  assert.equal(phases(h).includes('run-complete'),true);assert.equal(phases(h).includes('readback-complete'),false);
  assert.equal(h.messages.find(row=>row.type==='diagnostic'&&row.phase==='error').atPhase,'readback-start');
  assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);assert.equal(complete(h).length,0);
});

test('device loss or repeated uncaptured errors while run is pending produce one bounded fault and prevent late success',async()=>{
  for(const type of ['lost','uncaptured']){
    const h=harness({holdRun:true}),running=h.run(job());await flush();
    if(type==='lost')h.loseDevice('x'.repeat(5000));else{h.gpuError('x'.repeat(5000));h.gpuError('second error');}
    await running;h.resolveRun();await flush();
    const faults=h.messages.filter(row=>row.type==='diagnostic'&&['device-lost','gpu-error'].includes(row.phase));
    assert.equal(faults.length,1);assert.equal(faults[0].atPhase,'run-start');assert.ok(faults[0].message.length<=1024);
    assert.equal(h.messages.filter(row=>row.type==='error').length,1);assert.ok(h.messages.find(row=>row.type==='error').message.length<=2048);
    assert.equal(complete(h).length,0);assert.equal(phases(h).includes('run-complete'),false);
    assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);
  }
});

test('failed release cannot become diagnostic completion after one executed step',async()=>{
  const h=harness({releaseError:true});await h.run(job());
  assert.equal(phases(h).includes('first-step-complete'),true);assert.equal(phases(h).includes('session-release-complete'),false);
  assert.equal(h.messages.find(row=>row.type==='diagnostic'&&row.phase==='error').atPhase,'session-release-start');
  assert.equal(complete(h).length,0);assert.equal(h.stats().releaseCalls,1);assert.equal(h.stats().destroyCalls,1);
});

test('the same outcome oracle rejects an actual missing-boundary mutant and a removed first-step stop',async()=>{
  const mutations=[
    body=>{const old="        boundary('readback-complete',{step:step+1});\n";assert.equal(body.split(old).length,2);return body.replace(old,'');},
    body=>{const old="        if(diagnostic){boundary('first-step-complete',{step:step+1,plannedSteps:job.steps});break;}";
      assert.equal(body.split(old).length,2);return body.replace(old,"        if(diagnostic){boundary('first-step-complete',{step:step+1,plannedSteps:job.steps});}");},
  ];
  for(const mutate of mutations){const h=harness({mutate});await h.run(job());assert.throws(()=>assessSuccessfulFixture(h));}
});
