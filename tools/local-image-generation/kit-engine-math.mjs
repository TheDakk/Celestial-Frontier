import {seededGaussianNoise,createSigmaSchedule} from './pipeline-math.mjs';
export const KIT_ENGINE_SCHEMA='cf.kit-engine.v4';
export function admitKitEngineJob(job){
  if(job?.schema!==KIT_ENGINE_SCHEMA)throw Error('Kit engine schema refused');
  const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
  if(!integer(job.width,128,2048)||!integer(job.height,128,2048)||job.width%16||job.height%16
    ||!integer(job.seed,0,0xffffffff)||!integer(job.steps,1,32)||!integer(job.passSize,128,1024)||job.passSize%16
    ||!(job.strength>0&&job.strength<=1)||!(job.finisherStrength>0&&job.finisherStrength<=0.25))throw Error('Kit engine dimensions/settings refused');
  const names=['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'];
  if(!Array.isArray(job.passes)||job.passes.length!==6||job.passes.some((p,i)=>p.name!==names[i]
    ||typeof p.identityKey!=='string'||p.identityKey.length<1||typeof p.prompt!=='string'||p.prompt.length<100
    ||!p.placement||!['x','groundY','width'].every(k=>Number.isFinite(p.placement[k])&&p.placement[k]>0&&p.placement[k]<1)
    ||typeof p.placement.flip!=='boolean'))throw Error('Kit engine residents refused');
  if(typeof job.finisherPrompt!=='string'||job.finisherPrompt.length<100)throw Error('Kit finisher prompt missing');
  for(const ref of [job.plate,job.atlas,job.triptych,...job.passes.map(p=>p.reference)]){
    if(!ref||!integer(ref.width,128,2560)||!integer(ref.height,128,2560)||ref.width%16||ref.height%16
      ||typeof ref.url!=='string'||!ref.url.startsWith('/inputs/')||!/^[a-f0-9]{64}$/.test(ref.sha256))throw Error('Kit fitted reference refused');
  }
  if(job.plate.width!==job.width||job.plate.height!==job.height||job.passes.some(p=>p.reference.width!==job.passSize||p.reference.height!==job.passSize))throw Error('Kit reference pre-fit mismatch');
  return job;
}
export function imageToImageStart(initial,seed,steps,strength){
  if(!(initial instanceof Float32Array)||initial.length%128||!initial.length||!(strength>0&&strength<=1))throw Error('Invalid image-to-image input');
  for(const x of initial)if(!Number.isFinite(x))throw Error('Nonfinite initial latent');
  const sigmas=Float32Array.from(createSigmaSchedule(initial.length/128,steps),s=>s*strength);
  const noise=seededGaussianNoise(initial.length,seed);
  const latents=Float32Array.from(initial,(x,i)=>(1-sigmas[0])*x+sigmas[0]*noise[i]);
  return {latents,sigmas};
}
export function planarToRgba(data,width,height,key=false){
  const n=width*height;if(!(data instanceof Float32Array)||data.length!==n*3)throw Error('Decoded shape refused');
  const rgba=new Uint8ClampedArray(n*4);let left=width,top=height,right=0,bottom=0;
  for(let i=0;i<n;i++){
    for(let c=0;c<3;c++){const v=data[c*n+i];if(!Number.isFinite(v))throw Error('Nonfinite decoded pixel');rgba[i*4+c]=Math.round(Math.max(0,Math.min(1,v/2+0.5))*255);}
    const r=rgba[i*4],g=rgba[i*4+1],b=rgba[i*4+2];
    // Reserved key only. No silhouette detection or species acceptance claimed.
    const isKey=key&&r>150&&b>150&&Math.min(r,b)-g>85;
    rgba[i*4+3]=isKey?0:255;
    if(!isKey){const x=i%width,y=Math.floor(i/width);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  }
  if(key&&(right===0||right-left>width*.98||bottom-top>height*.98))throw Error('Organism pass lost its isolated key or is empty');
  return {rgba,bounds:{x:left,y:top,width:right-left,height:bottom-top}};
}
export function rgbaToPlanar(rgba,width,height){
  const n=width*height;if(rgba.length!==n*4)throw Error('RGBA shape refused');
  const data=new Float32Array(n*3);
  for(let i=0;i<n;i++)for(let c=0;c<3;c++)data[c*n+i]=rgba[i*4+c]/127.5-1;
  return data;
}
export function placementBox(placement,bounds,width,height){
  const w=width*placement.width,h=w*bounds.height/bounds.width;
  const box={x:width*placement.x-w/2,y:height*placement.groundY-h,width:w,height:h};
  if(!Object.values(box).every(Number.isFinite)||box.x<0||box.y<0||box.x+w>width||box.y+h>height)throw Error('Organism placement outside plate');
  return box;
}

export const MAX_KIT_TEXT_TOKENS=5120;
export function prepareKitTextTokens(tokenizer,prompt){
  if(typeof prompt!=='string'||!prompt.length||prompt.length>65536)throw Error('Kit prompt text refused');
  const wrapped='<|im_start|>user\n'+prompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n';
  const tokens=tokenizer.encode(wrapped,{add_special_tokens:false}).ids;
  if(tokens.length<1||tokens.length>MAX_KIT_TEXT_TOKENS)throw Error('Full kit prompt exceeds 5120-token ceiling; no truncation');
  const sequence=Math.ceil(tokens.length/16)*16,pad=tokenizer.token_to_id('<|endoftext|>');
  if(!Number.isInteger(pad)||tokens.some(t=>!Number.isSafeInteger(t)||t<0))throw Error('Invalid tokenizer IDs');
  const ids=new BigInt64Array(sequence),mask=new BigInt64Array(sequence);ids.fill(BigInt(pad));tokens.forEach((v,i)=>{ids[i]=BigInt(v);mask[i]=1n;});
  return {wrapped,ids,mask,sequence,tokenCount:tokens.length};
}
