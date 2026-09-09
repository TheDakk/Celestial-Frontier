import * as ort from './node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';
import { Tokenizer } from './node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
import {
  encodeFloat16, decodeFloat16, copyFloat16Bits, seededGaussianNoise, createSigmaSchedule,
  packedLatentsToTokens, tokensToPackedLatents, createImageIds, eulerOutputStep,
} from './pipeline-math.mjs';
import {createNativeProfileCapture} from './gpu-profile.mjs';

// One graph per worker. The owner terminates this worker before the next stage.
const progress = (phase, details={}) => postMessage({type:'progress',phase,...details});
const json = async path => { const r=await fetch(path); if(!r.ok) throw Error(`HTTP ${r.status}: ${path}`); return r.json(); };
let used=false;
onmessage=async ({data:job}) => {
  if(used) return; used=true;
  let session,device,profileCapture,nativeProfile,restoreStdout;
  let capturingProfile=false,profileResolve,profileReject,profileTimer;
  const started=performance.now();
  try {
    if(job.profile!==undefined&&typeof job.profile!=='boolean')throw Error('Profile option must be boolean');
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
    device.addEventListener('uncapturederror', e => progress('gpu-error',{message:e.error.message}));
    ort.env.webgpu.device=device;
    ort.env.wasm.numThreads=1;
    ort.env.wasm.wasmPaths=new URL('./node_modules/onnxruntime-web/dist/',import.meta.url).href;
    const specs={text:['text_encoder_q4.onnx',['text_encoder_q4-00000.data','text_encoder_q4-00001.data']],
      encode:['vae_encoder.onnx',['vae_encoder.onnx.data']],
      denoise:['transformer_q8.onnx',['transformer_q8-00000.data','transformer_q8-00001.data','transformer_q8-00002.data']],
      decode:['vae_decoder.onnx',['vae_decoder.onnx.data']]};
    if(!specs[job.stage]) throw Error('Unknown stage');
    const [graph,shards]=specs[job.stage];
    progress('loading',{graph});
    session=await ort.InferenceSession.create('/model/'+graph,{
      executionProviders:['webgpu'],graphOptimizationLevel:'all',
      ...(job.profile?{enableProfiling:true}:{}),
      externalData:shards.map(path=>({path,data:'/model/'+path})),
    });
    progress('loaded',{graph,inputNames:session.inputNames,outputNames:session.outputNames,elapsedMs:performance.now()-started});
    let result;
    if(job.stage==='text') {
      const tokenizer=new Tokenizer(await json('/model/tokenizer/tokenizer.json'),await json('/model/tokenizer/tokenizer_config.json'));
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
        const outputs=await session.run({...stable,hidden_states:hidden,timestep:time});
        const out=outputs.noise_pred;
        if(!out || out.type!=='float16' || out.dims.join(',')!==`1,${total},128`)throw Error('Transformer graph contract mismatch');
        latents=eulerOutputStep(latents,decodeFloat16(copyFloat16Bits(await out.getData())),sigmas[step],sigmas[step+1]);
        for(const t of Object.values(outputs))t.dispose();hidden.dispose();time.dispose();
        progress('step',{step:step+1,steps:job.steps,elapsedMs:performance.now()-started});
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
    await session.release();session=null;device.destroy();device=null;
    postMessage({type:'complete',...result,...(job.profile?{nativeProfile:{...nativeProfile,sessionReleased:true}}:{}),elapsedMs:performance.now()-started},[result.data.buffer]);
  } catch(error) {
    clearTimeout(profileTimer);capturingProfile=false;restoreStdout?.();
    if(profileCapture&&profileCapture.state!=='complete')profileCapture.fail(error.message);
    try{await session?.release();}catch{}device?.destroy();
    postMessage({type:'error',message:String(error.stack??error),
      ...(job.profile?{nativeProfile:nativeProfile??profileCapture?.snapshot()??{state:'failed',error:String(error)}}:{}),elapsedMs:performance.now()-started});
  }
};
