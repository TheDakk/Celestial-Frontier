import {createSigmaSchedule} from './pipeline-math.mjs';
/** Explicit diagnostic only. Reuses the actual product preparation and real
 * module Workers, intercepting only the denoiser's diagnostic messages. Never
 * fabricates an ordinary completion or returns an image to the product. */
export async function runFirstStepInPage({input,config,generate,emit}) {
  const NativeWorker=globalThis.Worker,controller=new AbortController(),workers=new Set();
  const expected=['text','encode','encode','encode','encode','encode','encode','denoise'];
  const records=[];let created=0,active=0,terminal=null,fault=null,hashing=null;
  const record=value=>{const row={...value,atMs:performance.now()};records.push(row);emit(row);};
  const fail=message=>{fault??=String(message);record({kind:'observer-error',message:fault});controller.abort();};
  const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  class ObservedWorker extends NativeWorker {
    constructor(url,options) {
      if(url!==config.workerUrl||options?.type!=='module'||created>=8||active!==0)
        throw Error('Diagnostic worker creation or ownership changed');
      super(url,options);this.slot=created++;this.stage=expected[this.slot];this.sent=false;this.retired=false;
      active++;workers.add(this);record({kind:'worker-created',slot:this.slot,stage:this.stage,url});
      this.addEventListener('message',event=>{
        const value=event.data;
        try {
          if(value?.type==='diagnostic'||value?.type==='diagnostic-complete') {
            event.stopImmediatePropagation();
            if(this.stage!=='denoise')throw Error('Diagnostic reply from a preparation worker');
            const {data,...metadata}=value;
            if(value.type==='diagnostic') {
              record({kind:'worker-message',slot:this.slot,stage:this.stage,message:metadata});
              if(['device-lost','gpu-error','error'].includes(value.phase))fail(value.message??value.phase);
              return;
            }
            if(terminal||hashing||fault)throw Error('Duplicate or faulted diagnostic completion');
            if(!(data instanceof Float32Array)||data.length!==64*36*128||data.some(x=>!Number.isFinite(x)))
              throw Error('First-step latent output is malformed');
            hashing=(async()=>{
              const dataSha256=await sha(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
              terminal={...metadata,dataBytes:data.byteLength,dataSha256};
              record({kind:'worker-message',slot:this.slot,stage:this.stage,message:terminal});
              controller.abort(); // Actual product owner terminates the worker; no fake full completion.
            })().catch(error=>fail(error.message));
            return;
          }
          if(value?.type==='error'||value?.phase==='gpu-error')fault??=String(value.message??'Worker error');
          const {data,nativeProfile,...metadata}=value??{};
          record({kind:'worker-message',slot:this.slot,stage:this.stage,message:metadata,
            ...(ArrayBuffer.isView(data)?{dataType:data.constructor.name,dataElements:data.length}: {})});
          // Ordinary preparation/progress/errors go unchanged to the actual runtime.
        } catch(error){event.stopImmediatePropagation();fail(error.message);}
      });
      this.addEventListener('error',event=>record({kind:'worker-error',slot:this.slot,stage:this.stage,message:event.message}));
    }
    postMessage(job,transfers) {
      if(this.sent||job.stage!==this.stage)throw Error('Diagnostic stage order changed');this.sent=true;
      if(this.stage==='denoise') {
        if(job.q8Block32!==false||job.steps!==4||job.width!==1024||job.height!==576||job.seed!==133
          ||job.references?.length!==6)throw Error('Diagnostic changed the canonical portable workload');
        job={...job,diagnostic:{schema:'cf.denoise-first-step.v1'}};
      }
      record({kind:'stage-dispatched',slot:this.slot,stage:this.stage,
        ...(this.stage==='denoise'?{q8Block32:job.q8Block32,width:job.width,height:job.height,seed:job.seed,
          steps:job.steps,references:job.references.map(r=>({width:r.width,height:r.height,elements:r.data.length})),embeddingElements:job.embedding.length}: {})});
      return super.postMessage(job,transfers);
    }
    terminate() {
      if(this.retired)return;this.retired=true;
      try{return super.terminate();}
      finally{active--;workers.delete(this);record({kind:'worker-terminated',slot:this.slot,stage:this.stage});}
    }
  }
  globalThis.Worker=ObservedWorker;let outcome;
  try {
    try {
      await generate(input,controller.signal,progress=>record({kind:'product-progress',progress}),config);
      throw Error('Diagnostic unexpectedly produced a full painting');
    } catch(error) {
      await hashing;
      if(fault)throw Error(fault);
      if(!terminal||error?.name!=='AbortError')throw error;
      outcome={status:'FIRST_STEP_COMPLETE',terminal,createdWorkers:created,activeWorkers:active,
        productStoppedByDiagnostic:true,imageGenerated:false};
    }
  } finally {
    controller.abort();for(const worker of workers)worker.terminate();globalThis.Worker=NativeWorker;
    record({kind:'harness-cleanup',activeWorkers:active,workerConstructorRestored:globalThis.Worker===NativeWorker});
  }
  if(created!==8||active!==0)throw Error('Incomplete diagnostic worker lifecycle');
  return outcome;
}

const PHASES=['admitted','device-ready','session-create-start','session-create-complete',
  'run-start','run-complete','readback-start','readback-complete','first-step-complete',
  'session-release-start','session-release-complete','device-destroyed'];
/** Replays persisted native messages; a completed form cannot certify an image,
 * phone, complete denoise schedule, product UI, or the original failed run. */
export function assessFirstStepEvidence(records,outcome) {
  const need=(value,message)=>{if(!value)throw Error(message);};
  need(Array.isArray(records)&&records.length>0&&records.length<=200,'Missing/bounded first-step evidence');
  need(outcome?.status==='FIRST_STEP_COMPLETE'&&outcome.createdWorkers===8&&outcome.activeWorkers===0
    &&outcome.productStoppedByDiagnostic===true&&outcome.imageGenerated===false,'Incomplete diagnostic owner result');
  need(!records.some(r=>['observer-error','worker-error'].includes(r.kind)
    ||r.message?.type==='error'||['device-lost','gpu-error','error'].includes(r.message?.phase)), 'Diagnostic contains a retained failure');
  const stages=['text','encode','encode','encode','encode','encode','encode','denoise'];
  for(const kind of ['worker-created','stage-dispatched','worker-terminated']) {
    const rows=records.filter(r=>r.kind===kind);
    need(rows.length===8&&rows.every((r,i)=>r.slot===i&&r.stage===stages[i]),'Missing or unordered '+kind);
  }
  for(let slot=0;slot<8;slot++) {
    const first=records.findIndex(r=>r.kind==='worker-created'&&r.slot===slot);
    const sent=records.findIndex(r=>r.kind==='stage-dispatched'&&r.slot===slot);
    const last=records.findIndex(r=>r.kind==='worker-terminated'&&r.slot===slot);
    need(first<sent&&sent<last&&(slot===7||last<records.findIndex(r=>r.kind==='worker-created'&&r.slot===slot+1)),
      'Overlapping or unordered native worker lifetime');
    const rows=records.map((r,i)=>({r,i})).filter(({r})=>r.kind==='worker-message'&&r.slot===slot);
    need(rows.every(({r,i})=>r.stage===stages[slot]&&i>sent&&i<last),'Message outside its native worker lifetime');
    if(slot<7) {
      const complete=rows.filter(({r})=>r.message?.type==='complete');
      need(complete.length===1&&complete[0].r.dataType===(slot===0?'Uint16Array':'Float32Array')
        &&complete[0].r.dataElements===(slot===0?512*7680:30*20*128),'Preparation model output missing');
    }
  }
  const dispatched=records.find(r=>r.kind==='stage-dispatched'&&r.stage==='denoise');
  need(dispatched.q8Block32===false&&dispatched.width===1024&&dispatched.height===576
    &&dispatched.steps===4&&dispatched.seed===133&&dispatched.embeddingElements===512*7680
    &&dispatched.references?.length===6&&dispatched.references.every(r=>r.width===480&&r.height===320&&r.elements===30*20*128),
    'First-step workload identity/geometry changed');
  const messages=records.filter(r=>r.kind==='worker-message'&&r.stage==='denoise').map(r=>r.message);
  const phases=messages.filter(m=>m.type==='diagnostic');
  need(phases.length===PHASES.length&&phases.every((m,i)=>m.schema==='cf.denoise-first-step.v1'
    &&m.sequence===i+1&&m.phase===PHASES[i]&&Number.isFinite(m.elapsedMs)&&m.elapsedMs>=0
    &&(i===0||m.elapsedMs>=phases[i-1].elapsedMs)),'Missing/stale/unordered execution markers');
  const completed=messages.filter(m=>m.type==='diagnostic-complete');
  need(completed.length===1&&!messages.some(m=>m.type==='complete'),'Missing first-step-only terminal');
  need(messages.findIndex(m=>m.type==='diagnostic-complete')>messages.findIndex(m=>m.phase==='device-destroyed'),
    'Diagnostic terminal preceded completed device cleanup');
  const terminal=completed[0];
  need(JSON.stringify(terminal)===JSON.stringify(outcome.terminal)&&terminal.schema==='cf.denoise-first-step.v1'
    &&terminal.completedSteps===1&&terminal.plannedSteps===4&&JSON.stringify(terminal.dims)==='[1,128,36,64]'
    &&terminal.dataBytes===64*36*128*4&&/^[a-f0-9]{64}$/.test(terminal.dataSha256)
    &&JSON.stringify(terminal.sigmas)===JSON.stringify(Array.from(createSigmaSchedule(64*36,4))),
    'Wrong first-step output/schedule binding');
  const steps=messages.filter(m=>m.phase==='step');
  const stepIndex=messages.findIndex(m=>m.phase==='step');
  need(steps.length===1&&steps[0].step===1&&steps[0].steps===4
    &&stepIndex>messages.findIndex(m=>m.phase==='readback-complete')
    &&stepIndex<messages.findIndex(m=>m.phase==='first-step-complete'),'Wrong number or order of completed steps');
  const cleanup=records.filter(r=>r.kind==='harness-cleanup');
  need(cleanup.length===1&&cleanup[0].activeWorkers===0&&cleanup[0].workerConstructorRestored===true
    &&records.indexOf(cleanup[0])>records.findIndex(r=>r.kind==='worker-terminated'&&r.slot===7),'Incomplete native owner cleanup');
  return {status:'FIRST_STEP_COMPLETE',runMs:phases[5].elapsedMs-phases[4].elapsedMs,
    readbackMs:phases[7].elapsedMs-phases[6].elapsedMs,imageGenerated:false,qualityAccepted:false,physicalPhoneQualified:false};
}
