/** Audit-only SDXS candidate. Fixed conditioning; no product/runtime admission. */
import * as ort from '../../tools/local-image-generation/node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';
import {compileCreatureFinishV1} from '../../port/v2/apps/game/src/landfall-conditioning.ts';
import {seededGaussianNoise} from '../../tools/local-image-generation/pipeline-math.mjs';
import {padCreatureFinishCanvas,creatureFinishMask,conserveCreaturePixels,cropCreatureFinishCanvas} from '../../tools/local-image-generation/creature-finish-math.mjs';
import {float32Output,disposeTensors} from './proof-contract.mjs';

const state:any={status:'idle',stage:'ready',rows:[],qualityAccepted:false,cleanupErrors:[],reconstructionStatus:'DIAGNOSTIC_PENDING_VISUAL_REVIEW'};
const sha=async(b:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as BufferSource)),v=>v.toString(16).padStart(2,'0')).join('');
async function bytes(url:string){const r=await fetch(url);if(!r.ok)throw Error('Missing input '+url);return new Uint8Array(await r.arrayBuffer());}
async function post(name:string,b:Uint8Array){const r=await fetch('/output/'+name,{method:'POST',body:b as BodyInit});if(!r.ok)throw Error('Output refused '+name);}
function tensor(data:Float32Array,dims:number[]){return new ort.Tensor('float32',data,dims);}
const sessions:any[]=[];
async function model(url:string){state.stage='load '+url;const s=await ort.InferenceSession.create(url,{executionProviders:['webgpu'],graphOptimizationLevel:'all'});sessions.push(s);return s;}
function finite(a:Float32Array){if(!a.every(Number.isFinite))throw Error('Non-finite tensor');return a;}
function canvas(w:number,h:number){const c=new OffscreenCanvas(w,h);return {c,x:c.getContext('2d',{willReadFrequently:true})!};}
function rgbTensor(rgba:Uint8ClampedArray,w:number,h:number){const original=canvas(w,h);original.x.putImageData(new ImageData(rgba,w,h),0,0);const small=canvas(512,512);small.x.imageSmoothingQuality='high';small.x.drawImage(original.c,0,0,512,512);const p=small.x.getImageData(0,0,512,512).data,out=new Float32Array(3*512*512);for(let i=0;i<512*512;i++)for(let c=0;c<3;c++)out[c*512*512+i]=p[i*4+c]/255;return tensor(out,[1,3,512,512]);}
function rgbaTensor(t:any,w:number,h:number){const p=float32Output(t,[1,3,512,512],'decoder.image'),rgba=new Uint8ClampedArray(512*512*4);for(let i=0;i<512*512;i++){for(let c=0;c<3;c++)rgba[i*4+c]=Math.max(0,Math.min(255,(p[c*512*512+i]/2+.5)*255));rgba[i*4+3]=255;}const small=canvas(512,512);small.x.putImageData(new ImageData(rgba,512,512),0,0);const full=canvas(w,h);full.x.imageSmoothingQuality='high';full.x.drawImage(small.c,0,0,w,h);return full.x.getImageData(0,0,w,h).data;}
async function png(name:string,rgba:Uint8ClampedArray,w:number,h:number){const out=canvas(w,h);out.x.putImageData(new ImageData(rgba,w,h),0,0);const b=new Uint8Array(await (await out.c.convertToBlob({type:'image/png'})).arrayBuffer());await post(name,b);return await sha(b);}

async function start(){
 if(state.status!=='idle')throw Error('One attempt per page');state.status='running';const begin=performance.now(),owned=new Set<any>();
 const own=(t:any)=>{owned.add(t);return t;};
 const outputs=(values:any)=>{for(const t of Object.values(values))owned.add(t);return values;};
 try{
  const inputs=await (await fetch('/inputs.json')).json();
  if(!['mac','phone'].includes(inputs.mode)||!Array.isArray(inputs.subjects)||!inputs.subjects.length)throw Error('Input mode/subjects');
  state.mode=inputs.mode;
  ort.env.wasm.wasmPaths='/ort/';ort.env.wasm.numThreads=1;
  const adapter=await navigator.gpu?.requestAdapter();if(!adapter?.features.has('shader-f16'))throw Error('WebGPU shader-f16 unavailable');
  state.adapter={features:[...adapter.features],limits:{maxBufferSize:adapter.limits.maxBufferSize,maxStorageBufferBindingSize:adapter.limits.maxStorageBufferBindingSize},info:{vendor:adapter.info.vendor,architecture:adapter.info.architecture,device:adapter.info.device}};
  const first=inputs.subjects[0],job=compileCreatureFinishV1(first),prompt=job.prompt;
  state.promptSha256=await sha(new TextEncoder().encode(prompt));
  let embedding:Float32Array;
  if(inputs.mode==='phone'){
   const b=await bytes('/embedding.f32');if(await sha(b)!==inputs.embedding.sha256||b.byteLength!==77*768*4||state.promptSha256!==inputs.embedding.promptSha256)throw Error('Embedding identity mismatch');embedding=new Float32Array(b.buffer);state.textEncoderLoaded=false;
  }else{
   // Mac-only preprocessing. Phone serving never exposes this module, tokenizer or text encoder.
   const {Tokenizer}=await import(/* @vite-ignore */ '/tokenizer.mjs');
   const tok=new Tokenizer(await (await fetch('/tokenizer.json')).json(),await (await fetch('/tokenizer-config.json')).json());
   const encoded=tok.encode(prompt).ids;const ids=encoded.slice(0,77);if(ids.length===77)ids[76]=49407;while(ids.length<77)ids.push(49407);
   if(ids[0]!==49406||ids[76]!==49407)throw Error('CLIP token boundaries');
   state.tokenizer={tokensBeforeTruncation:encoded.length,truncated:encoded.length>77,tokenIds:ids};
   const text=await model('/models/text_encoder.onnx');state.stage='precompute embedding';const tokenTensor=own(new ort.Tensor('int64',BigInt64Array.from(ids,BigInt),[1,77])),e=outputs(await text.run({input_ids:tokenTensor}));
   embedding=new Float32Array(float32Output(e.last_hidden_state,[1,77,768],'text.last_hidden_state'));
   state.embedding={sha256:await sha(new Uint8Array(embedding.buffer)),promptSha256:state.promptSha256,bytes:embedding.byteLength,dims:[1,77,768]};await post('embedding.f32',new Uint8Array(embedding.buffer));
   disposeTensors(owned);await text.release();sessions.splice(sessions.indexOf(text),1);state.textEncoderLoaded=true;state.textEncoderReleased=true;
  }
  const encoder=await model('/models/encoder.onnx'),decoder=await model('/models/vae_decoder.onnx'),unet=await model('/models/unet.onnx');
  const cond=tensor(finite(embedding),[1,77,768]);
  const conditional=new Set<any>([cond]);
  try{
  for(const input of inputs.subjects){
   state.stage='infer '+input.id;const t0=performance.now(),j=compileCreatureFinishV1(input);
   if(j.prompt!==prompt)throw Error('Per-subject prompt drift');
   const mb=await bytes(input.master.url),lb=await bytes(input.labels.url);if(await sha(mb)!==input.master.sha256||await sha(lb)!==input.labels.sha256)throw Error('Input hash drift');
   const master=new Uint8ClampedArray(mb.buffer),labels=new Uint8ClampedArray(lb.buffer),work=padCreatureFinishCanvas(master,labels,input.width,input.height),mask=creatureFinishMask(work.master,work.labels,work.width,work.height);
   const im=own(rgbTensor(master,input.width,input.height)),e=outputs(await encoder.run({image:im})),latent=new Float32Array(float32Output(e.latent,[1,4,64,64],'encoder.latent'));
   const reconstruction=outputs(await decoder.run({latent:own(tensor(latent,[1,4,64,64]))}));const reconstructionSha256=await png(input.id+'-reconstruction.png',rgbaTensor(reconstruction.image,input.width,input.height),input.width,input.height);
   // Experimental image conditioning: SDXS is distilled for t=999. The source latent is mixed with seeded noise at strength .35,
   // evaluated once at its trained endpoint. This is a candidate, not a validated img2img scheduler or a claim of FLUX parity.
   const sigma=14.614646911621094,noise=seededGaussianNoise(latent.length,j.seed),noisy=new Float32Array(latent.length),scaled=new Float32Array(latent.length);
   for(let i=0;i<latent.length;i++){noisy[i]=latent[i]+noise[i]*sigma*j.settings.strength;scaled[i]=noisy[i]/Math.sqrt(sigma*sigma+1);}
   const u=outputs(await unet.run({sample:own(tensor(scaled,[1,4,64,64])),timestep:own(tensor(new Float32Array([999]),[1])),encoder_hidden_states:cond})),eps=float32Output(u.out_sample,[1,4,64,64],'unet.out_sample'),clean=new Float32Array(latent.length);
   for(let i=0;i<clean.length;i++)clean[i]=noisy[i]-sigma*eps[i];finite(clean);
   const d=outputs(await decoder.run({latent:own(tensor(clean,[1,4,64,64]))})),generated=rgbaTensor(d.image,input.width,input.height),padded=new Uint8ClampedArray(work.master.length);
   for(let y=0;y<input.height;y++)padded.set(generated.subarray(y*input.width*4,(y+1)*input.width*4),y*work.width*4);
   const composite=conserveCreaturePixels(work.master,padded,mask.editable),finished=cropCreatureFinishCanvas(composite,input.width,input.height,work.width,work.height);
   const hash=await png(input.id+'-finished.png',finished,input.width,input.height);
   state.rows.push({id:input.id,status:'GENERATED',sha256:hash,reconstructionSha256,seed:j.seed,elapsedMs:performance.now()-t0,settings:j.settings,modelSize:512,originalSize:[input.width,input.height],qualityAccepted:false});
   disposeTensors(owned);
  }
  }finally{try{disposeTensors(conditional);}catch(e){state.cleanupErrors.push(String(e));}}
  state.status='complete';state.elapsedMs=performance.now()-begin;
 }catch(e){state.status='failed';state.error=String(e);}finally{
  try{disposeTensors(owned);}catch(e){state.cleanupErrors.push(String(e));}
  for(const s of sessions)try{await s.release();}catch(e){state.cleanupErrors.push(String(e));}
  if(state.cleanupErrors.length)state.status='failed';state.stage='terminal';
 }
}
(window as any).phoneFinish={start,snapshot:()=>structuredClone(state)};
