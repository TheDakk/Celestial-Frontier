import {admitKitEngineJob,imageToImageStart,planarToRgba,rgbaToPlanar,placementBox,prepareKitTextTokens,MAX_KIT_TEXT_TOKENS} from './kit-engine-math.mjs';
import {expandPinnedTransformer,sha256} from './kit-worker-expansion.mjs';
import {encodeFloat16,decodeFloat16,packedLatentsToTokens,tokensToPackedLatents,createImageIds,eulerOutputStep} from './pipeline-math.mjs';
const parse=async path=>{const r=await fetch(path);if(!r.ok)throw Error('Missing '+path);return r.json();};
export async function createKitWorkerEngine({ort,Tokenizer,progress,expand=expandPinnedTransformer}){
  const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});
  if(!adapter||!adapter.features.has('shader-f16')||adapter.info.isFallbackAdapter)throw Error('Native f16 GPU required');
  const device=await adapter.requestDevice({requiredFeatures:['shader-f16'],requiredLimits:{maxBufferSize:adapter.limits.maxBufferSize,maxStorageBufferBindingSize:adapter.limits.maxStorageBufferBindingSize,maxStorageBuffersPerShaderStage:adapter.limits.maxStorageBuffersPerShaderStage}});
  let fault=null,closed=false,busy=false,tokenizer,expanded;
  const sessions=new Map(),cache=new Map(),creates={text:0,encode:0,denoise:0,decode:0};
  device.addEventListener('uncapturederror',event=>{fault=Error(event.error.message);progress({phase:'gpu-error',message:fault.message});});
  device.lost.then(info=>{if(!closed){fault=Error('GPU device lost: '+info.message);progress({phase:'gpu-error',message:fault.message});}});
  ort.env.webgpu.device=device;ort.env.wasm.numThreads=1;
  ort.env.wasm.wasmPaths=new URL('./node_modules/onnxruntime-web/dist/',import.meta.url).href;
  const check=()=>{if(closed)throw Error('Kit engine closed');if(fault)throw fault;};
  const specs={text:['text_encoder_q4.onnx',['text_encoder_q4-00000.data','text_encoder_q4-00001.data']],encode:['vae_encoder.onnx',['vae_encoder.onnx.data']],decode:['vae_decoder.onnx',['vae_decoder.onnx.data']]};
  async function session(kind){
    check();if(sessions.has(kind)){progress({phase:'session-reused',stage:kind});return sessions.get(kind);}
    const start=performance.now();progress({phase:'loading',stage:kind});let graph,externalData;
    if(kind==='denoise'){
      expanded??=await expand(fetch,e=>progress(e));
      graph=expanded.graph;externalData=['transformer_q8-00000.data','transformer_q8-00001.data','transformer_q8-00002.data'].map(path=>({path,data:'/model/'+path}));
      externalData.push({path:'repacked-scale-zero.data',data:expanded.data});
    }else{const [file,shards]=specs[kind];graph='/model/'+file;externalData=shards.map(path=>({path,data:'/model/'+path}));}
    const created=await ort.InferenceSession.create(graph,{executionProviders:['webgpu'],graphOptimizationLevel:'all',externalData});
    check();sessions.set(kind,created);creates[kind]++;progress({phase:'loaded',stage:kind,elapsedMs:performance.now()-start,creates:{...creates},memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null});return created;
  }
  async function run(kind,feeds,outputName,type,shape){
    let outputs;
    try{
      check();const s=await session(kind);const inferenceStart=performance.now();progress({phase:'inference-start',stage:kind,outputShape:shape});
      outputs=await s.run(feeds);check();progress({phase:'inference-complete',stage:kind,elapsedMs:performance.now()-inferenceStart});const output=outputs[outputName];
      if(!output||output.type!==type||output.dims.join(',')!==shape.join(','))throw Error(kind+' output shape/type mismatch');
      const raw=await output.getData();check();progress({phase:'readback-complete',stage:kind});let data;
      if(type==='float16'){
        if(!ArrayBuffer.isView(raw)||raw.BYTES_PER_ELEMENT!==2||raw.length>MAX_KIT_TEXT_TOKENS*7680)throw Error('Float16 output storage refused');
        data=new Uint16Array(raw.buffer,raw.byteOffset,raw.length).slice();
        for(const v of data)if((v&0x7c00)===0x7c00)throw Error('Nonfinite model output');
      }else{data=new Float32Array(raw);for(const v of data)if(!Number.isFinite(v))throw Error('Nonfinite model output');}
      return data;
    }finally{if(outputs)for(const tensor of Object.values(outputs))tensor.dispose();for(const tensor of Object.values(feeds))tensor.dispose();}
  }
  async function embedding(prompt){
    check();tokenizer??=new Tokenizer(await parse('/model/tokenizer/tokenizer.json'),await parse('/model/tokenizer/tokenizer_config.json'));
    const {wrapped,ids,mask,sequence,tokenCount}=prepareKitTextTokens(tokenizer,prompt);
    const data=await run('text',{input_ids:new ort.Tensor('int64',ids,[1,sequence]),attention_mask:new ort.Tensor('int64',mask,[1,sequence])},'prompt_embeds','float16',[1,sequence,7680]);
    return {data,sequence,tokenCount,promptSha256:await sha256(new TextEncoder().encode(prompt)),chatPromptSha256:await sha256(new TextEncoder().encode(wrapped))};
  }
  async function pixels(ref){
    const r=await fetch(ref.url);if(!r.ok)throw Error('Fitted input unavailable');
    const bytes=new Uint8Array(await r.arrayBuffer());
    if(bytes.length!==ref.width*ref.height*4||await sha256(bytes)!==ref.sha256)throw Error('Fitted RGBA hash/size mismatch');
    return new Uint8ClampedArray(bytes.buffer);
  }
  async function encode(rgba,width,height){
    const data=await run('encode',{sample:new ort.Tensor('float32',rgbaToPlanar(rgba,width,height),[1,3,height,width])},'packed_latent','float32',[1,128,height/16,width/16]);
    return packedLatentsToTokens(data,height/16,width/16);
  }
  async function reference(ref){
    const key=ref.sha256+':'+ref.width+'x'+ref.height;if(cache.has(key))return cache.get(key);
    const rgba=await pixels(ref),data=await encode(rgba,ref.width,ref.height),value={rgba,data,width:ref.width,height:ref.height};
    if(cache.size>=16)cache.delete(cache.keys().next().value);cache.set(key,value);return value;
  }
  async function paintPass({prompt,width,height,seed,steps,strength,initial,references}){
    const text=await embedding(prompt),n=width/16*(height/16),total=n+references.reduce((sum,r)=>sum+r.data.length/128,0);
    if(total>16384)throw Error('Image token allocation refused');
    const ids=new BigInt64Array(total*4);ids.set(createImageIds(height/16,width/16));let at=n*4;
    references.forEach((r,i)=>{const value=createImageIds(r.height/16,r.width/16,i);ids.set(value,at);at+=value.length;});
    const txtIds=new BigInt64Array(text.sequence*4);for(let i=0;i<text.sequence;i++)txtIds[i*4+3]=BigInt(i);
    let {latents,sigmas}=imageToImageStart(initial,seed,steps,strength);
    for(let step=0;step<steps;step++){
      const combined=new Float32Array(total*128);combined.set(latents);let offset=latents.length;
      for(const r of references){combined.set(r.data,offset);offset+=r.data.length;}
      const data=await run('denoise',{
        encoder_hidden_states:new ort.Tensor('float16',text.data,[1,text.sequence,7680]),
        hidden_states:new ort.Tensor('float16',encodeFloat16(combined),[1,total,128]),
        img_ids:new ort.Tensor('int64',ids,[1,total,4]),txt_ids:new ort.Tensor('int64',txtIds,[1,text.sequence,4]),
        timestep:new ort.Tensor('float16',encodeFloat16(new Float32Array([sigmas[step]])),[1]),
      },'noise_pred','float16',[1,total,128]);
      latents=eulerOutputStep(latents,decodeFloat16(data),sigmas[step],sigmas[step+1]);
      progress({phase:'step',step:step+1,steps,imageTokens:total,textTokens:text.sequence});
    }
    const decoded=await run('decode',{packed_latent:new ort.Tensor('float32',tokensToPackedLatents(latents,height/16,width/16),[1,128,height/16,width/16])},'sample','float32',[1,3,height,width]);
    return {decoded,text:{sequence:text.sequence,tokenCount:text.tokenCount,promptSha256:text.promptSha256,chatPromptSha256:text.chatPromptSha256},sigmas:Array.from(sigmas)};
  }
  async function paint(input){
    if(busy)throw Error('Kit engine already painting');check();const job=admitKitEngineJob(input);busy=true;const started=performance.now(),captures=[],boxes=[],measurements=[];
    const canvas=new OffscreenCanvas(job.width,job.height),ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx){busy=false;throw Error('Compositor unavailable');}
    try{
      const plate=await pixels(job.plate);ctx.putImageData(new ImageData(plate,job.width,job.height),0,0);
      const atlas=await reference(job.atlas);
      for(const [i,p]of job.passes.entries()){
        check();const start=performance.now();progress({phase:'organism-start',name:p.name,index:i+1,total:job.passes.length});
        const initial=await reference(p.reference),result=await paintPass({prompt:p.prompt,width:job.passSize,height:job.passSize,seed:(job.seed+i)>>>0,steps:job.steps,strength:job.strength,initial:initial.data,references:[atlas]});
        const rawCanvas=new OffscreenCanvas(job.passSize,job.passSize),rawCtx=rawCanvas.getContext('2d');if(!rawCtx)throw Error('Capture context unavailable');
        try{rawCtx.putImageData(new ImageData(planarToRgba(result.decoded,job.passSize,job.passSize).rgba,job.passSize,job.passSize),0,0);progress({phase:'organism-capture',name:p.name,blob:await rawCanvas.convertToBlob({type:'image/png'})});}finally{rawCanvas.width=1;rawCanvas.height=1;}
        const {rgba,bounds}=planarToRgba(result.decoded,job.passSize,job.passSize,true),box=placementBox(p.placement,bounds,job.width,job.height);
        const cutout=new OffscreenCanvas(job.passSize,job.passSize),cutctx=cutout.getContext('2d');if(!cutctx)throw Error('Cutout compositor unavailable');
        try{
          cutctx.putImageData(new ImageData(rgba,job.passSize,job.passSize),0,0);ctx.save();
          try{if(p.placement.flip){ctx.translate(box.x+box.width,box.y);ctx.scale(-1,1);ctx.drawImage(cutout,bounds.x,bounds.y,bounds.width,bounds.height,0,0,box.width,box.height);}else ctx.drawImage(cutout,bounds.x,bounds.y,bounds.width,bounds.height,box.x,box.y,box.width,box.height);}finally{ctx.restore();}
          captures.push({name:p.name,blob:await cutout.convertToBlob({type:'image/png'})});
        }finally{cutout.width=1;cutout.height=1;}
        boxes.push({name:p.name,identityKey:p.identityKey,...box,preFinisherBounds:true,postFinisherIdentityAccepted:false});
        measurements.push({name:p.name,elapsedMs:performance.now()-start,...result.text,sigmas:result.sigmas});
        progress({phase:'organism-complete',name:p.name,elapsedMs:performance.now()-start});
      }
      const composite=await canvas.convertToBlob({type:'image/png'}),initial=await encode(ctx.getImageData(0,0,job.width,job.height).data,job.width,job.height),triptych=await reference(job.triptych);
      progress({phase:'finisher-start'});const finishStart=performance.now();
      const finished=await paintPass({prompt:job.finisherPrompt,width:job.width,height:job.height,seed:job.seed,steps:1,strength:job.finisherStrength,initial,references:[triptych]});
      const {rgba}=planarToRgba(finished.decoded,job.width,job.height);ctx.putImageData(new ImageData(rgba,job.width,job.height),0,0);
      const painting=await canvas.convertToBlob({type:'image/png'});
      measurements.push({name:'finisher',elapsedMs:performance.now()-finishStart,...finished.text,sigmas:finished.sigmas});
      return {schema:'cf.kit-engine-result.v4',painting,composite,captures,boxes,measurements,elapsedMs:performance.now()-started,
        width:job.width,height:job.height,sessionCreates:{...creates},expansion:expanded?.receipt,qualityAccepted:false,
        capabilities:{maxBufferSize:adapter.limits.maxBufferSize,shaderF16:adapter.features.has('shader-f16'),adapterInfo:{...adapter.info}}};
    }finally{canvas.width=1;canvas.height=1;busy=false;}
  }
  async function dispose(){if(closed)return;closed=true;cache.clear();try{for(const s of sessions.values())await s.release();}finally{sessions.clear();expanded=null;device.destroy();}}
  return {paint,dispose};
}
