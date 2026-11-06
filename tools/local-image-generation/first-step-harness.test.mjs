import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {runFirstStepInPage,assessFirstStepEvidence} from './first-step-harness.mjs';
import {createSigmaSchedule} from './pipeline-math.mjs';
const phases=['admitted','device-ready','session-create-start','session-create-complete','run-start','run-complete',
  'readback-start','readback-complete','first-step-complete','session-release-start','session-release-complete','device-destroyed'];

/** Synthetic native-event adapter exercises the real harness ownership path.
 * It is not inference or a browser/device qualification. */
async function exercise({fault=null,wrongUrl=false,fullPainting=false}={}) {
  const previous=globalThis.Worker,priorCrypto=globalThis.crypto,records=[],native=[];
  let forwardedDiagnostic=null;
  class FakeNativeWorker extends EventTarget {
    constructor(){super();this.terminated=false;native.push(this);}
    set onmessage(callback){this.addEventListener('message',callback);}
    send(value){this.dispatchEvent(new MessageEvent('message',{data:value}));}
    postMessage(job) {
      queueMicrotask(()=>{
        this.send({type:'progress',phase:'loading'});this.send({type:'progress',phase:'loaded'});
        if(job.stage!=='denoise') {
          this.send({type:'complete',data:job.stage==='text'?new Uint16Array(512*7680):new Float32Array(30*20*128)});return;
        }
        forwardedDiagnostic=job;
        for(let i=0;i<phases.length;i++) {
          if(phases[i]==='first-step-complete')this.send({type:'progress',phase:'step',step:1,steps:4});
          this.send({type:'diagnostic',schema:'cf.denoise-first-step.v1',phase:phases[i],sequence:i+1,elapsedMs:i*10});
          if(fault&&phases[i]==='run-start') {this.send({type:'diagnostic',schema:'cf.denoise-first-step.v1',
            phase:'device-lost',sequence:i+2,elapsedMs:i*10+1,message:fault});return;}
        }
        this.send({type:'diagnostic-complete',schema:'cf.denoise-first-step.v1',completedSteps:1,plannedSteps:4,
          sigmas:Array.from(createSigmaSchedule(64*36,4)),data:new Float32Array(64*36*128),dims:[1,128,36,64],elapsedMs:121});
      });
    }
    terminate(){assert.equal(this.terminated,false);this.terminated=true;}
  }
  globalThis.Worker=FakeNativeWorker;
  if(!globalThis.crypto)globalThis.crypto=webcrypto;
  const config={workerUrl:'/__local_ai/stage-worker.mjs'};
  const generate=async (_input,signal,_progress,cfg)=>{
    if(fullPainting)return {blob:'not-a-diagnostic'};
    const stage=(job)=>new Promise((resolve,reject)=>{
      const worker=new Worker(wrongUrl?'/wrong-worker':cfg.workerUrl,{type:'module'});
      const abort=()=>{worker.terminate();reject(new DOMException('Diagnostic canceled','AbortError'));};
      signal.addEventListener('abort',abort,{once:true});
      worker.onmessage=({data})=>{
        if(data.type==='complete'){signal.removeEventListener('abort',abort);worker.terminate();resolve(data.data);}
        else if(data.type!=='progress')reject(Error('New diagnostic message leaked into product'));
      };
      worker.postMessage(job,[]);
    });
    const embedding=await stage({stage:'text'}),references=[];
    for(let i=0;i<6;i++)references.push({data:await stage({stage:'encode'}),width:480,height:320});
    await stage({stage:'denoise',q8Block32:false,profile:false,width:1024,height:576,steps:4,seed:133,embedding,references});
    throw Error('Unexpected return from denoise');
  };
  try {
    const result=await runFirstStepInPage({input:{},config,generate,emit:r=>records.push(r)});
    assert.equal(globalThis.Worker,FakeNativeWorker);assert.equal(native.length,8);
    assert.ok(native.every(w=>w.terminated));assert.deepEqual(forwardedDiagnostic.diagnostic,{schema:'cf.denoise-first-step.v1'});
    assert.equal(forwardedDiagnostic.steps,4);return {records,result};
  } finally {
    assert.equal(globalThis.Worker,FakeNativeWorker,'harness must restore even on refusal');
    globalThis.Worker=previous;if(!priorCrypto)delete globalThis.crypto;
  }
}
test('real harness owns eight serial workers, stops after the diagnostic result, restores constructor and never returns an image',async()=>{
  const {records,result}=await exercise();const assessed=assessFirstStepEvidence(records,result);
  assert.equal(assessed.status,'FIRST_STEP_COMPLETE');assert.equal(assessed.runMs,10);assert.equal(assessed.readbackMs,10);
  assert.equal(assessed.imageGenerated,false);assert.equal(assessed.qualityAccepted,false);assert.equal(assessed.physicalPhoneQualified,false);
});
test('native device failure, wrong worker target and unexpected painting refuse with restored global ownership',async()=>{
  await assert.rejects(()=>exercise({fault:'device reset'}),/device reset/);
  await assert.rejects(()=>exercise({wrongUrl:true}),/creation or ownership/);
  await assert.rejects(()=>exercise({fullPainting:true}),/unexpectedly produced/);
});
test('same replay rejects missing, reordered, stale, cross-worker and faulted evidence',async()=>{
  const {records,result}=await exercise();
  for(const change of [
    r=>r.splice(r.findIndex(x=>x.message?.phase==='run-complete'),1),
    r=>{r.find(x=>x.message?.phase==='readback-start').message.sequence=5;},
    r=>{r.find(x=>x.message?.phase==='run-complete').message.elapsedMs=1;},
    r=>{r.find(x=>x.message?.phase==='run-start').stage='text';},
    r=>{r.find(x=>x.kind==='stage-dispatched'&&x.stage==='denoise').references.pop();},
    r=>{r.find(x=>x.kind==='stage-dispatched'&&x.stage==='denoise').q8Block32=true;},
    r=>r.push({kind:'observer-error',message:'real failure'}),
    r=>{r.find(x=>x.kind==='worker-terminated').slot=3;},
    r=>{r.find(x=>x.kind==='harness-cleanup').workerConstructorRestored=false;},
    r=>{r.find(x=>x.kind==='worker-message'&&x.slot===0&&x.message.type==='complete').dataElements=0;},
  ]) {const mutated=structuredClone(records);change(mutated);assert.throws(()=>assessFirstStepEvidence(mutated,result));}
  for(const key of ['sigmas','completedSteps','plannedSteps','dataSha256','dataBytes','dims']) {
    const changed=structuredClone(records),outcome=structuredClone(result),terminal=changed.find(x=>x.message?.type==='diagnostic-complete').message;
    terminal[key]=key==='sigmas'?[1,.9,.6,.1,0]:null;outcome.terminal=structuredClone(terminal);
    assert.throws(()=>assessFirstStepEvidence(changed,outcome));
  }
  assert.equal(assessFirstStepEvidence(records,result).status,'FIRST_STEP_COMPLETE');
});
test('replay refuses a terminal, step or cleanup moved before its actual prerequisite',async()=>{
  const {records,result}=await exercise();
  for(const [target,before] of [
    [r=>r.message?.type==='diagnostic-complete',r=>r.message?.phase==='device-destroyed'],
    [r=>r.message?.phase==='step',r=>r.message?.phase==='readback-complete'],
    [r=>r.kind==='harness-cleanup',r=>r.kind==='worker-terminated'&&r.slot===7],
  ]) {
    const changed=structuredClone(records),[row]=changed.splice(changed.findIndex(target),1);
    changed.splice(changed.findIndex(before),0,row);assert.throws(()=>assessFirstStepEvidence(changed,result));
  }
  assert.equal(assessFirstStepEvidence(records,result).status,'FIRST_STEP_COMPLETE');
});
