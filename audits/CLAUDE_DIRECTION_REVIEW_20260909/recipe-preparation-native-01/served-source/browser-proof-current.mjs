import {createLandingProgress} from './landing-progress.mjs';
const byId=id=>document.getElementById(id);
const landing=createLandingProgress();
let preparationView=null;
const showPanel=panel=>{byId('planet-panel').hidden=panel!=='planet';byId('journal-panel').hidden=panel!=='journal';};
function renderLanding(){
  const view=preparationView??landing.snapshot(),pending=['queued','running'].includes(view.state);
  window.cfImageProof.landing=view;
  byId('generate').hidden=pending;byId('landing-progress').hidden=!pending;
  byId('landing-meter').value=view.progress;
  byId('landing-label').textContent=`Landing · ${view.stageLabel} · ${view.etaLabel}`;
  byId('landing-meter').setAttribute('aria-valuetext',byId('landing-label').textContent);
}

const records=[];
let running=false,activeWorker=null,abortStage=null,generationController=null;
const record=entry=>{const event={...entry,atMs:performance.now()};records.push(event);landing.observe(event);renderLanding();byId('events').textContent=records.map(x=>JSON.stringify(x)).join('\n');};
window.cfImageProof={state:'ready',records,profiles:[]};
const checkedJson=async (url,signal)=>{const r=await fetch(url,{signal});if(!r.ok)throw Error(`HTTP${r.status}: ${url}`);return r.json();};
function stage(job,transfers=[]) {
  return new Promise((resolve,reject)=>{
    if(generationController?.signal.aborted){reject(Error('Canceled'));return;}
    const worker=new Worker('/stage-worker.mjs',{type:'module'});activeWorker=worker;
    let settled=false;
    const finish=(error,result)=>{
      if(settled)return;settled=true;clearTimeout(timer);worker.terminate();
      if(activeWorker===worker){activeWorker=null;abortStage=null;}
      record({stage:job.stage,phase:'worker-terminated'});
      error?reject(error):resolve(result);
    };
    const timer=setTimeout(()=>finish(Error('Stage exceeded10minute deadline')),600000);
    abortStage=()=>finish(Error('Canceled'));
    worker.onerror=e=>finish(Error(e.message));
    worker.onmessage=({data})=>{
      if(settled)return;
      try {
      if(data.nativeProfile){
        if(!job.profile||window.cfImageProof.profiles.length>=5){finish(Error('Unexpected/excess native profile'));return;}
        window.cfImageProof.profiles.push({stage:job.stage,...data.nativeProfile});
      }
      if(data.type==='complete') {
        if(job.profile&&(data.nativeProfile?.state!=='complete'||!data.nativeProfile.endedBeforeRelease||!data.nativeProfile.sessionReleased)){
          finish(Error('Native profile incomplete or ownership boundary absent'));return;
        }
        const {data:_,nativeProfile:__,...meta}=data;record({stage:job.stage,...meta});finish(null,data);
      }
      else if(data.type==='error')finish(Error(data.message));
      else {record({stage:job.stage,...data});byId('status').textContent=`${job.stage}: ${data.phase}`;
        if(data.phase==='gpu-error')finish(Error('WebGPU error: '+data.message));}
      }catch(error){finish(error);}
    };
    worker.postMessage(job,transfers);
  });
}
async function referencePixels(reference) {
  const signal=generationController?.signal;
  const checkCurrent=()=>{if(!signal||signal.aborted)throw Error('Canceled');};
  checkCurrent();
  const {width,height,matte}=reference;
  if(matte!==undefined&&matte!==null&&(typeof matte!=='string'||!/^#[0-9a-f]{6}$/i.test(matte)))throw Error('Invalid explicit reference matte');
  const response=await fetch(reference.url,{signal});checkCurrent();if(!response.ok)throw Error('Reference fetch failed');
  const bytes=await response.arrayBuffer();checkCurrent();
  const digest=await crypto.subtle.digest('SHA-256',bytes);checkCurrent();
  const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==reference.sha256)throw Error('Reference hash mismatch');
  let bitmap=null,canvas=null,pixels,preparationFailure=null;
  try {
    bitmap=await createImageBitmap(new Blob([bytes]));checkCurrent();
    canvas=new OffscreenCanvas(width,height);
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)throw Error('Reference 2D context unavailable');
    if(matte){context.fillStyle=matte;context.fillRect(0,0,width,height);}
    context.drawImage(bitmap,0,0,width,height);
    const rgba=context.getImageData(0,0,width,height).data;
    const count=width*height;pixels=new Float32Array(count*3);
    for(let i=0;i<count;i++){if(rgba[i*4+3]!==255)throw Error('Reference must be opaque');for(let c=0;c<3;c++)pixels[c*count+i]=rgba[i*4+c]/127.5-1;}
  }catch(error){preparationFailure=error;throw error;}
  finally {
    const failures=[];
    if(bitmap)try{bitmap.close();}catch(error){failures.push(error);}
    // The tensor owns its copied values before either scratch dimension is
    // retired. Attempt both dimensions even if another cleanup step fails.
    if(canvas)for(const key of ['width','height'])try{canvas[key]=1;}catch(error){failures.push(error);}
    if(failures.length){
      const detail=failures.map(error=>String(error?.message??error)).join('; ');
      throw new AggregateError(preparationFailure?[preparationFailure,...failures]:failures,
        preparationFailure?`Reference preparation failed: ${preparationFailure.message}; cleanup failed: ${detail}`:`Reference cleanup failed: ${detail}`);
    }
  }
  checkCurrent();
  const pixelDigest=await crypto.subtle.digest('SHA-256',pixels.buffer);checkCurrent();
  const pixelSha256=Array.from(new Uint8Array(pixelDigest),x=>x.toString(16).padStart(2,'0')).join('');
  record({phase:'reference-prepared',url:reference.url,width,height,matte:matte??null,pixelSha256});
  return pixels;
}
async function generate({referenceEnabled=true,profile=false}={}) {
  if(typeof profile!=='boolean')throw Error('Profile option must be boolean');
  if(running)throw Error('Generation already running');
  running=true;byId('generate').disabled=true;byId('cancel').disabled=false;
  byId('generate').hidden=true;byId('landing-progress').hidden=false;
  byId('landing-meter').value=0;byId('landing-label').textContent='Landing · Queued · ETA estimating…';
  generationController=new AbortController();delete window.cfImageProof.png;window.cfImageProof.profiles=[];
  const started=performance.now();window.cfImageProof.state='running';
  preparationView={state:'queued',key:null,progress:0,stageLabel:'Preparing landing',etaLabel:'ETA estimating…'};renderLanding();
  byId('notice').hidden=true;byId('painting').hidden=true;delete window.cfImageProof.error;
  try {
    const config=await checkedJson('/recipe.json',generationController.signal);
    if(generationController.signal.aborted)throw Error('Canceled');
    window.cfImageProof.recipe=config;
    landing.begin({key:JSON.stringify({config,referenceEnabled,profile}),steps:config.steps,referenceCount:referenceEnabled?config.references.length:0,nowMs:started});preparationView=null;renderLanding();
    byId('roster').textContent=(config.appearanceSnapshot?.displayPlan?.residents??[]).map(row=>row.name).join('\n');
    const q8Block32=config.modelDerivative?.variant==='q8-block32-repacked-v1';
    if(config.modelDerivative&&!q8Block32)throw Error('Unknown model derivative');
    record({phase:'start',seed:config.seed,modelRevision:config.modelRevision,referenceEnabled,profile,q8Block32});
    const embedding=await stage({stage:'text',profile,chatPrompt:config.chatPrompt});
    const references=[];
    if(referenceEnabled)for(const ref of config.references){
      const pixels=await referencePixels(ref);
      const encoded=await stage({stage:'encode',profile,pixels,width:ref.width,height:ref.height},[pixels.buffer]);
      references.push({data:encoded.data,width:ref.width,height:ref.height});
    }
    const denoised=await stage({stage:'denoise',profile,q8Block32,fixedDenoiserShapes:config.fixedDenoiserShapes===true,width:config.width,height:config.height,seed:config.seed,steps:config.steps,embedding:embedding.data,references},[embedding.data.buffer,...references.map(r=>r.data.buffer)]);
    const decoded=await stage({stage:'decode',profile,latents:denoised.data,width:config.width,height:config.height},[denoised.data.buffer]);
    const canvas=byId('painting');canvas.width=config.width;canvas.height=config.height;
    const context=canvas.getContext('2d');const image=context.createImageData(canvas.width,canvas.height);
    const count=canvas.width*canvas.height;
    let clipped=0,min=Infinity,max=-Infinity;
    for(let i=0;i<count;i++){
      for(let c=0;c<3;c++){const value=decoded.data[c*count+i];if(!Number.isFinite(value))throw Error('Nonfinite RGB');min=Math.min(min,value);max=Math.max(max,value);if(value<-1||value>1)clipped++;image.data[i*4+c]=Math.round(Math.min(1,Math.max(0,value/2+0.5))*255);}
      image.data[i*4+3]=255;
    }
    context.putImageData(image,0,0);
    window.cfImageProof.png=canvas.toDataURL('image/png');
    window.cfImageProof.state='complete';
    record({phase:'complete',elapsedMs:performance.now()-started,clipped,min,max,qualityAccepted:false});
    byId('painting').hidden=false;byId('notice-text').textContent='Earth landing ready. The painting is available for review.';byId('notice').hidden=false;
    byId('status').textContent='Landing complete · visual review pending';
  }catch(error){
    if(preparationView)preparationView={state:generationController?.signal.aborted?'canceled':'failed',key:null,progress:0,stageLabel:'Landing unavailable',etaLabel:''};
    window.cfImageProof.state='failed';window.cfImageProof.error=String(error.stack??error);record({phase:'failed',canceled:generationController?.signal.aborted===true,message:window.cfImageProof.error});byId('status').textContent=error.message;}
  finally{abortStage?.();generationController=null;running=false;byId('generate').disabled=false;byId('cancel').disabled=true;renderLanding();}
  return window.cfImageProof.state;
}
window.cfImageProof.generate=generate;
window.cfImageProof.cancel=()=>{generationController?.abort();abortStage?.();};
byId('generate').onclick=()=>generate(window.cfImageProof.buttonOptions);byId('cancel').onclick=()=>window.cfImageProof.cancel();
byId('explore').onclick=()=>showPanel('journal');byId('planet').onclick=()=>showPanel('planet');
byId('notice-open').onclick=()=>{if(window.cfImageProof.state!=='complete'||window.cfImageProof.landing?.state!=='complete'||!window.cfImageProof.png)return;showPanel('planet');byId('notice').hidden=true;};
