import * as ort from './node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';
import { Tokenizer } from './node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
import {
  encodeFloat16, decodeFloat16, copyFloat16Bits, seededGaussianNoise, createSigmaSchedule,
  packedLatentsToTokens, tokensToPackedLatents, createImageIds, eulerOutputStep,
} from './pipeline-math.mjs';
import {createNativeProfileCapture} from './gpu-profile.mjs';
import {denoiserShapeSessionOptions} from './denoiser-shapes.mjs';

// Legacy diagnostics own one graph per worker; kit-v4 retains its four sessions
// behind the app-owned warm worker and disposes on cancellation/fault.
const progress = (phase, details={}) => postMessage({type:'progress',phase,...details});
const json = async path => { const r=await fetch(path); if(!r.ok) throw Error(`HTTP ${r.status}: ${path}`); return r.json(); };
const FIRST_STEP_DIAGNOSTIC='cf.denoise-first-step.v1';
// Opt-in proof only. Ordinary callers never receive partial output as complete.
function admitsFirstStepDiagnostic(job){
  if(job.diagnostic===undefined)return false;
  const option=job.diagnostic;
  if(option===null||typeof option!=='object'||Array.isArray(option)
    ||Object.keys(option).length!==1||option.schema!==FIRST_STEP_DIAGNOSTIC
    ||job.stage!=='denoise'||job.q8Block32!==false||job.profile!==false
    ||(job.fixedDenoiserShapes!==undefined&&job.fixedDenoiserShapes!==false)
    ||job.width!==1024||job.height!==576||job.seed!==133||job.steps!==4
    ||!(job.embedding instanceof Uint16Array)||job.embedding.length!==512*7680
    ||!Array.isArray(job.references)||job.references.length!==6)
    throw Error('Invalid exact-shape first-step diagnostic');
  for(const value of job.embedding)if((value&0x7c00)===0x7c00)throw Error('Nonfinite diagnostic embedding');
  for(const reference of job.references){
    if(!reference||reference.width!==480||reference.height!==320
      ||!(reference.data instanceof Float32Array)||reference.data.length!==30*20*128)
      throw Error('Invalid diagnostic reference tensor');
    for(const value of reference.data)if(!Number.isFinite(value))throw Error('Nonfinite diagnostic reference');
  }
  return true;
}
let used=false,kitEnginePromise=null,kitBusy=false;
onmessage=async ({data:job}) => {
  if(job?.stage==='kit-v4'){
    if(kitBusy){postMessage({type:'error',requestId:job.requestId,message:'Kit worker busy'});return;}
    kitBusy=true;
    try{
      if(used)throw Error('Cannot mix a legacy diagnostic and kit engine in one worker');
      const {admitKitEngineJob}=await import('./kit-engine-math.mjs');admitKitEngineJob(job.recipe);
      kitEnginePromise??=import('./kit-worker-engine.mjs').then(({createKitWorkerEngine})=>createKitWorkerEngine({ort,Tokenizer,progress:details=>postMessage({type:'progress',...details})}));
      const engine=await kitEnginePromise;
      const result=await engine.paint(job.recipe);
      postMessage({type:'complete',requestId:job.requestId,...result});
    }catch(error){postMessage({type:'error',requestId:job.requestId,message:String(error.stack??error)});
      try{await (await kitEnginePromise)?.dispose();}catch{}kitEnginePromise=null;
    }finally{kitBusy=false;}
    return;
  }
  if(used) return; used=true;
  let session,device,profileCapture,nativeProfile,restoreStdout;
  let capturingProfile=false,profileResolve,profileReject,profileTimer;
  const started=performance.now();
  let diagnostic=false,diagnosticSequence=0,diagnosticBoundary='admission',diagnosticFault=null;
  let rejectDiagnosticFault,intentionalDeviceDestroy=false,diagnosticErrorReported=false,diagnosticReleaseStarted=false;
  const diagnosticFaultPromise=new Promise((_,reject)=>{rejectDiagnosticFault=reject;});
  // A device can fail between awaited boundaries; keep its rejection observed.
  diagnosticFaultPromise.catch(()=>{});
  const diagnosticEvent=(phase,details={})=>{
    if(!diagnostic)return;
    if(diagnosticSequence>=24)return;
    postMessage({type:'diagnostic',schema:FIRST_STEP_DIAGNOSTIC,sequence:++diagnosticSequence,
      phase,elapsedMs:performance.now()-started,...details});
  };
  const boundary=(phase,details={})=>{if(diagnostic){diagnosticBoundary=phase;diagnosticEvent(phase,details);}};
  const deviceFault=(phase,message)=>{
    if(!diagnostic||intentionalDeviceDestroy||diagnosticFault)return;
    diagnosticFault=new Error(String(message).slice(0,1024));
    diagnosticEvent(phase,{atPhase:diagnosticBoundary,message:diagnosticFault.message});
    rejectDiagnosticFault(diagnosticFault);
  };
  const waitForDevice=promise=>diagnostic?Promise.race([promise,diagnosticFaultPromise]):promise;
  try {
    diagnostic=admitsFirstStepDiagnostic(job);
    boundary('admitted',{width:job.width,height:job.height,referenceCount:job.references?.length,
      imageTokens:5904,textTokens:512,seed:job.seed,plannedSteps:job.steps});
    if(job.profile!==undefined&&typeof job.profile!=='boolean')throw Error('Profile option must be boolean');
    if(job.q8Block32!==undefined&&typeof job.q8Block32!=='boolean')throw Error('Derivative choice must be boolean');
    if(job.q8Block32&&job.stage!=='denoise')throw Error('Derivative belongs only to denoise');
    const modelUrl=path=>{
      if(job.modelFiles===undefined)return '/model/'+path;
      if(!job.modelFiles||typeof job.modelFiles!=='object'||Array.isArray(job.modelFiles)
        ||!Object.hasOwn(job.modelFiles,path)||typeof job.modelFiles[path]!=='string')throw Error('Missing installed model file: '+path);
      const url=new URL(job.modelFiles[path],self.location.href);
      if(!['http:','https:','blob:'].includes(url.protocol)||url.origin!==self.location.origin
        ||url.username||url.password)throw Error('Installed model source must belong to this origin');
      return url.href;
    };
    const fixedShapeOptions=denoiserShapeSessionOptions(job);
    if(job.profile){
      profileCapture=createNativeProfileCapture({ortVersion:ort.env.versions.web});
      // Emscripten binds console.log when its WASM module initializes, so wrap
      // before create(). Only endProfiling's bounded stdout frame is retained.
      const original=console.log;
      console.log=(...args)=>{
        if(!capturingProfile)return original.apply(console,args);
        if(profileCapture.state==='failed')return; // bound work after the first retained red
        if(args.length!==1)profileCapture.fail('Native stdout argument contract changed');
        else profileCapture.pushLine(args[0]);
        if(profileCapture.state==='complete')profileResolve?.();
        else if(profileCapture.state==='failed')profileReject?.(Error(profileCapture.snapshot().error));
      };
      restoreStdout=()=>{console.log=original;};
    }
    const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});
    if(!adapter || !adapter.features.has('shader-f16') || adapter.info.isFallbackAdapter) throw Error('Native WebGPU f16 required');
    if(job.profile&&!adapter.features.has('timestamp-query'))throw Error('Profiling refused: WebGPU timestamp-query unavailable');
    device=await adapter.requestDevice({requiredFeatures:job.profile?['shader-f16','timestamp-query']:['shader-f16'],requiredLimits:{
      maxBufferSize:adapter.limits.maxBufferSize,
      maxStorageBufferBindingSize:adapter.limits.maxStorageBufferBindingSize,
      maxStorageBuffersPerShaderStage:adapter.limits.maxStorageBuffersPerShaderStage,
    }});
    device.addEventListener('uncapturederror', e => {
      if(diagnostic)deviceFault('gpu-error',e.error.message);
      else progress('gpu-error',{message:e.error.message});
    });
    if(diagnostic)device.lost.then(info=>deviceFault('device-lost',String(info.reason)+': '+String(info.message)),
      error=>deviceFault('device-lost',String(error)));
    boundary('device-ready');
    ort.env.webgpu.device=device;
    ort.env.wasm.numThreads=1;
    ort.env.wasm.wasmPaths=new URL('./node_modules/onnxruntime-web/dist/',import.meta.url).href;
    const specs={text:['text_encoder_q4.onnx',['text_encoder_q4-00000.data','text_encoder_q4-00001.data']],
      encode:['vae_encoder.onnx',['vae_encoder.onnx.data']],
      denoise:job.q8Block32?['transformer-q8-block32.onnx',['transformer_q8-00000.data','transformer_q8-00001.data','transformer_q8-00002.data','repacked-scale-zero.data']]:['transformer_q8.onnx',['transformer_q8-00000.data','transformer_q8-00001.data','transformer_q8-00002.data']],
      decode:['vae_decoder.onnx',['vae_decoder.onnx.data']]};
    if(!specs[job.stage]) throw Error('Unknown stage');
    const [graph,shards]=specs[job.stage];
    progress('loading',{graph});
    boundary('session-create-start',{graph});
    session=await waitForDevice(ort.InferenceSession.create(modelUrl(graph),{
      executionProviders:['webgpu'],graphOptimizationLevel:'all',
      ...(job.profile?{enableProfiling:true}:{}),
      ...fixedShapeOptions,
      externalData:shards.map(path=>({path,data:modelUrl(path)})),
    }));
    boundary('session-create-complete',{graph});
    progress('loaded',{graph,inputNames:session.inputNames,outputNames:session.outputNames,...fixedShapeOptions,
      ...(job.fixedDenoiserShapes?{inputMetadata:session.inputMetadata}:{}),elapsedMs:performance.now()-started});
    let result;
    if(job.stage==='text') {
      const tokenizer=new Tokenizer(await json(modelUrl('tokenizer/tokenizer.json')),await json(modelUrl('tokenizer/tokenizer_config.json')));
      const tokens=tokenizer.encode(job.chatPrompt,{add_special_tokens:false}).ids;
      if(tokens.length>512) throw Error(`Prompt has ${tokens.length} tokens; refusing silent truncation beyond512`);
      const ids=new BigInt64Array(512),mask=new BigInt64Array(512);
      const pad=tokenizer.token_to_id('<|endoftext|>');
      if(!Number.isInteger(pad)) throw Error('Missing Qwen padding token');
      ids.fill(BigInt(pad));
      tokens.forEach((x,i)=>{ids[i]=BigInt(x);mask[i]=1n;});
      const feeds={input_ids:new ort.Tensor('int64',ids,[1,512]),attention_mask:new ort.Tensor('int64',mask,[1,512])};
      const outputs=await session.run(feeds);
      const out=outputs.prompt_embeds;
      if(!out || out.type!=='float16' || out.dims.join(',')!=='1,512,7680') throw Error('Text graph contract mismatch');
      result={data:copyFloat16Bits(await out.getData()),dims:[...out.dims],tokenCount:tokens.length};
      for(const t of Object.values(outputs))t.dispose();for(const t of Object.values(feeds))t.dispose();
    } else if(job.stage==='encode') {
      const tensor=new ort.Tensor('float32',job.pixels,[1,3,job.height,job.width]);
      const outputs=await session.run({sample:tensor});const out=outputs.packed_latent;
      if(!out || out.type!=='float32' || out.dims.join(',')!==`1,128,${job.height/16},${job.width/16}`)throw Error('Encoder graph contract mismatch');
      result={data:packedLatentsToTokens(new Float32Array(await out.getData()),job.height/16,job.width/16)};
      for(const t of Object.values(outputs))t.dispose();tensor.dispose();
    } else if(job.stage==='denoise') {
      const h=job.height/16,w=job.width/16,n=h*w;
      let latents=seededGaussianNoise(n*128,job.seed);
      const references=job.references??[];
      const total=n+references.reduce((sum,r)=>sum+r.data.length/128,0);
      const ids=new BigInt64Array(total*4);ids.set(createImageIds(h,w));
      let offset=n*4;
      references.forEach((r,i)=>{const refIds=createImageIds(r.height/16,r.width/16,i);ids.set(refIds,offset);offset+=refIds.length;});
      const txtIds=new BigInt64Array(512*4);
      for(let i=0;i<512;i++)txtIds[i*4+3]=BigInt(i);
      const stable={encoder_hidden_states:new ort.Tensor('float16',job.embedding,[1,512,7680]),
        img_ids:new ort.Tensor('int64',ids,[1,total,4]),txt_ids:new ort.Tensor('int64',txtIds,[1,512,4])};
      const sigmas=createSigmaSchedule(n,job.steps);
      for(let step=0;step<job.steps;step++) {
        const combined=new Float32Array(total*128);combined.set(latents);let at=latents.length;
        for(const r of references){combined.set(r.data,at);at+=r.data.length;}
        const hidden=new ort.Tensor('float16',encodeFloat16(combined),[1,total,128]);
        const time=new ort.Tensor('float16',encodeFloat16(new Float32Array([sigmas[step]])),[1]);
        boundary('run-start',{step:step+1});
        const outputs=await waitForDevice(session.run({...stable,hidden_states:hidden,timestep:time}));
        boundary('run-complete',{step:step+1});
        const out=outputs.noise_pred;
        if(!out || out.type!=='float16' || out.dims.join(',')!==`1,${total},128`)throw Error('Transformer graph contract mismatch');
        boundary('readback-start',{step:step+1});
        const outputData=await waitForDevice(out.getData());
        boundary('readback-complete',{step:step+1});
        latents=eulerOutputStep(latents,decodeFloat16(copyFloat16Bits(outputData)),sigmas[step],sigmas[step+1]);
        for(const t of Object.values(outputs))t.dispose();hidden.dispose();time.dispose();
        progress('step',{step:step+1,steps:job.steps,elapsedMs:performance.now()-started});
        if(diagnostic){boundary('first-step-complete',{step:step+1,plannedSteps:job.steps});break;}
      }
      for(const t of Object.values(stable))t.dispose();
      result={data:tokensToPackedLatents(latents,h,w),sigmas:Array.from(sigmas)};
    } else {
      const tensor=new ort.Tensor('float32',job.latents,[1,128,job.height/16,job.width/16]);
      const outputs=await session.run({packed_latent:tensor});const out=outputs.sample;
      if(!out || out.type!=='float32' || out.dims.join(',')!==`1,3,${job.height},${job.width}`)throw Error('Decoder graph contract mismatch');
      result={data:new Float32Array(await out.getData()),dims:[...out.dims]};
      for(const t of Object.values(outputs))t.dispose();tensor.dispose();
    }
    for(const value of result.data)if(!Number.isFinite(value)
      || (result.data instanceof Uint16Array && (value & 0x7c00)===0x7c00))throw Error('Nonfinite output');
    if(job.profile){
      profileCapture.begin();capturingProfile=true;
      try{
        await new Promise((resolve,reject)=>{
          profileResolve=resolve;profileReject=reject;
          profileTimer=setTimeout(()=>{profileCapture.fail('Native stdout profile deadline; no complete end observed');reject(Error('Native stdout profile deadline'));},30000);
          // Public API returns void. Only actual complete stdout resolves this
          // promise, never endProfiling's return, release, or a quiet interval.
          try{session.endProfiling();}catch(error){profileCapture.fail(error.message);reject(error);}
        });
        nativeProfile={...profileCapture.finish(),endedBeforeRelease:true};
      }finally{clearTimeout(profileTimer);capturingProfile=false;restoreStdout?.();}
      progress('profile-complete',{eventCount:nativeProfile.summary.eventCount,unit:nativeProfile.summary.unit,
        gpuDurationUs:nativeProfile.summary.gpuDispatches.durationUs,nodeDurationUs:nativeProfile.summary.nodeSpans.durationUs});
    }
    boundary('session-release-start');
    if(diagnostic)diagnosticReleaseStarted=true;
    await waitForDevice(session.release());session=null;
    boundary('session-release-complete');
    if(diagnosticFault)throw diagnosticFault;
    intentionalDeviceDestroy=true;device.destroy();device=null;
    boundary('device-destroyed');
    if(diagnostic)postMessage({type:'diagnostic-complete',schema:FIRST_STEP_DIAGNOSTIC,
      completedSteps:1,plannedSteps:4,sigmas:result.sigmas,data:result.data,dims:[1,128,36,64],
      elapsedMs:performance.now()-started},[result.data.buffer]);
    else postMessage({type:'complete',...result,...(job.profile?{nativeProfile:{...nativeProfile,sessionReleased:true}}:{}),elapsedMs:performance.now()-started},[result.data.buffer]);
  } catch(error) {
    clearTimeout(profileTimer);capturingProfile=false;restoreStdout?.();
    if(profileCapture&&profileCapture.state!=='complete')profileCapture.fail(error.message);
    if(diagnostic){
      const message=String(error.stack??error).slice(0,2048);
      diagnosticEvent('error',{atPhase:diagnosticBoundary,message:message.slice(0,1024)});
      postMessage({type:'error',schema:FIRST_STEP_DIAGNOSTIC,message,elapsedMs:performance.now()-started});
      diagnosticErrorReported=true;
    }
    // The diagnostic must not start a second release after a failed/pending one.
    try{if(!diagnostic||!diagnosticReleaseStarted)await session?.release();}catch{}
    intentionalDeviceDestroy=true;device?.destroy();
    if(!diagnosticErrorReported)postMessage({type:'error',message:String(error.stack??error),
      ...(job.profile?{nativeProfile:nativeProfile??profileCapture?.snapshot()??{state:'failed',error:String(error)}}:{}),elapsedMs:performance.now()-started});
  }
};
