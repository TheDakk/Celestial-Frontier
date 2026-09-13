/** Single user-requested local visual experiment; no canonical encounter or game integration. */
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {fetchModel,DEFAULT_CACHE_ROOT} from '../../tools/local-image-generation/fetch-model.mjs';
import {openBlock32Derivative} from '../../tools/local-image-generation/q8-block32.mjs';
const output=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(output,'../..'),dir=path.join(root,'tools/local-image-generation');
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipt={schema:'cf.local-visual-experiment.v1',status:'FAIL',scope:'One native browser local-model alien desert scene from text only; conceptual identities; no game/offline/phone/quality qualification',startedAt:new Date().toISOString(),qualityAccepted:false,modelDownloaded:false,sourceFiles:[],runtimeFiles:[],events:[],browserEvents:[]};
try{await fs.access(path.join(output,'result.json'));throw Error('Completed destination already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
let release,server,cdp;
function assessRuntimeIntegrity(value){
 if(!Array.isArray(value.browserEvents)||value.browserEvents.length)throw Error('Observed browser exception/crash');
 if(value.sourcesUnchanged!==true||value.runtimeUnchanged!==true)throw Error('Source/runtime changed during experiment');
}

const prompt="A richly detailed natural-history landscape painting of a remote alien desert at late afternoon. Wide cinematic landfall view: sweeping copper-red sand dunes, pale eroded sandstone arches, dark wind-polished basalt outcrops and a distant dry salt basin beneath a dusty lavender sky with one faint huge crescent planet. Warm low sunlight and cool violet shadows. This is an arid world with a completely open sky and no forest, mushrooms, moss, streams or lush vegetation. Three distinct organisms fit naturally into the terrain. Left foreground on firm sand beside a rock: one stocky four-legged sand grazer with overlapping matte ochre bony armor plates, a blunt wedge-shaped head, dark watchful eyes, sturdy broad padded feet and one heavy tapered tail. Its silhouette is grounded and believable, the full body visible. Right foreground: one much smaller slender rust-colored lizard-like animal with four delicate legs and a long tail, resting beside a silver-blue succulent rosette. High in the middle distance, one small leathery-winged desert glider crosses the sky. Sparse alien plants include waxy silver-blue rosettes rooted in rock fissures, thin dark stems with dry amber seed pods, and low straw-colored grass tufts. Distinct animal bodies, natural anatomy and perspective, subtle footprints, sand partly covering plant roots, soft contact shadows, reflected red light on undersides, windblown dust and decreasing contrast with distance. The entire scene feels like one magnificent hand-painted scientific expedition plate with intricate organic textures and restrained brushwork. Immersive environment, generous landscape depth, not a creature lineup. No text, UI, border, neon, glowing crystals, plastic surfaces, shiny CGI, giant insects or extra limbs.";
const recipe={schema:'cf.local-concept-recipe.v1',width:1024,height:576,steps:4,seed:48291,prompt,chatPrompt:'<|im_start|>user\n'+prompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n',q8Block32:true,reference:null,referenceEnabled:false,canonicalEncounter:false};
try{
release=acquireWorkspaceLock('one text-only alien desert local experiment');
for(const file of [fileURLToPath(import.meta.url),...['stage-worker.mjs','pipeline-math.mjs','gpu-profile.mjs','denoiser-shapes.mjs','fetch-model.mjs','q8-block32.mjs','model-manifest.json','q8-block32-manifest.json','package-lock.json'].map(n=>path.join(dir,n))]){const b=await fs.readFile(file);receipt.sourceFiles.push({path:path.relative(root,file),bytes:b.length,sha256:sha(b)});}
const manifest=JSON.parse(await fs.readFile(path.join(dir,'model-manifest.json'),'utf8'));
const cacheDir=path.join(DEFAULT_CACHE_ROOT,manifest.modelId.replace('/','--'),manifest.revision);
console.log('Verifying existing local model and derivative');
receipt.modelVerification=(await fetchModel({manifest,cacheDir,verifyOnly:true})).receipt;
const derivative=await openBlock32Derivative(manifest);receipt.derivative=derivative.pin;recipe.modelId=manifest.modelId;recipe.modelRevision=manifest.revision;
await fs.writeFile(path.join(output,'recipe.json'),JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
const routes=new Map([...manifest.files.map(f=>['/model/'+f.path,path.join(cacheDir,f.path)]),...derivative.files.map(f=>['/model/'+f.path,f.file]),...['stage-worker.mjs','pipeline-math.mjs','gpu-profile.mjs','denoiser-shapes.mjs'].map(n=>['/'+n,path.join(dir,n)])]);
const dist=path.join(dir,'node_modules/onnxruntime-web/dist');
for(const name of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(name))routes.set('/node_modules/onnxruntime-web/dist/'+name,path.join(dist,name));
routes.set('/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',path.join(dir,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
for(const [url,file]of routes)if(url.startsWith('/node_modules/')){const b=await fs.readFile(file);receipt.runtimeFiles.push({url,bytes:b.length,sha256:sha(b)});}
server=http.createServer(async(req,res)=>{res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; img-src 'self' blob: data:; object-src 'none'");
if(req.method!=='GET'){res.writeHead(405);res.end();return;}const url=new URL(req.url,'http://127.0.0.1').pathname;if(url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Local alien desert text-only visual experiment</title><canvas id="painting"></canvas>');return;}const file=routes.get(url);if(!file){res.writeHead(404);res.end();return;}try{const s=await fs.stat(file);res.setHeader('Content-Type',({'.mjs':'text/javascript','.wasm':'application/wasm','.png':'image/png','.json':'application/json'})[path.extname(file)]??'application/octet-stream');res.setHeader('Content-Length',s.size);const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);}catch{res.writeHead(404);res.end();}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
cdp=await openChromiumCdp({label:'CF local alien desert concept',userDataPrefix:'cf-desert-test-',commandTimeoutMs:30000,onEvent:e=>{if(['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(e.method))receipt.browserEvents.push(e);}});receipt.browser=cdp.browser;
const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`});const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});await cdp.send('Runtime.enable',{},sessionId);
const evaluate=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
for(let i=0;!await evaluate('!!document.getElementById("painting")');i++){if(i>100)throw Error('Page not ready');await new Promise(r=>setTimeout(r,100));}
async function render(config){
window.visual={state:'running',events:[],started:performance.now()};const state=window.visual;
function stage(job,transfers=[]){return new Promise((resolve,reject)=>{const worker=new Worker('/stage-worker.mjs',{type:'module'});let done=false;const finish=(e,v)=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();state.events.push({stage:job.stage,phase:'terminated',atMs:performance.now()});e?reject(e):resolve(v);};const timer=setTimeout(()=>finish(Error('Stage deadline600s')),600000);worker.onerror=e=>finish(Error(e.message));worker.onmessage=({data})=>{const {data:tensor,nativeProfile,...meta}=data;state.events.push({stage:job.stage,...meta,atMs:performance.now()});if(data.type==='error'||data.phase==='gpu-error')finish(Error(data.message));else if(data.type==='complete')finish(null,data);};worker.postMessage({...job,profile:false},transfers);});}
try{if(!crossOriginIsolated||!navigator.gpu)throw Error('Native WebGPU unavailable');if(config.reference!==null||config.referenceEnabled!==false)throw Error('Text-only experiment cannot accept image references');
const embedding=await stage({stage:'text',chatPrompt:config.chatPrompt});
const denoised=await stage({stage:'denoise',q8Block32:true,width:config.width,height:config.height,seed:config.seed,steps:4,embedding:embedding.data,references:[]},[embedding.data.buffer]);const decoded=await stage({stage:'decode',latents:denoised.data,width:config.width,height:config.height},[denoised.data.buffer]);
const out=document.getElementById('painting');out.width=config.width;out.height=config.height;const context=out.getContext('2d'),img=context.createImageData(out.width,out.height),count=out.width*out.height;for(let i=0;i<count;i++){for(let c=0;c<3;c++){const v=decoded.data[c*count+i];if(!Number.isFinite(v))throw Error('Nonfinite RGB');img.data[i*4+c]=Math.round(Math.min(1,Math.max(0,v/2+0.5))*255);}img.data[i*4+3]=255;}context.putImageData(img,0,0);state.png=out.toDataURL('image/png');state.elapsedMs=performance.now()-state.started;state.state='complete';}catch(e){state.error=String(e.stack??e);state.state='failed';}}
await evaluate(`void (${render.toString()})(${JSON.stringify(recipe)})`);
const deadline=performance.now()+900000;let prior='';
for(;;){const state=await evaluate('(()=>{const {png,...rest}=window.visual;return rest;})()');receipt.events=state.events;receipt.observation=state;await fs.writeFile(path.join(output,'progress.json'),JSON.stringify(state,null,2)+'\n');const latest=state.events.at(-1);const label=latest?`${latest.stage}: ${latest.phase??latest.type}`:'Preparing text-only request';if(label!==prior){console.log(label);prior=label;}if(state.state==='failed')throw Error(state.error);if(state.state==='complete'){const png=await evaluate('window.visual.png');if(!png.startsWith('data:image/png;base64,'))throw Error('Missing PNG');const b=Buffer.from(png.split(',')[1],'base64');if(b.readUInt32BE(16)!==1024||b.readUInt32BE(20)!==576)throw Error('PNG dimensions');await fs.writeFile(path.join(output,'raw-output.png'),b,{flag:'wx'});receipt.output={path:'raw-output.png',bytes:b.length,sha256:sha(b),width:1024,height:576};receipt.status='IMAGE_GENERATED_REVIEW_PENDING';break;}if(performance.now()>deadline)throw Error('Overall900s deadline');await new Promise(r=>setTimeout(r,5000));}
}catch(e){receipt.error=String(e.stack??e);process.exitCode=1;}
finally{
const fail=(field,e)=>{receipt[field]=String(e?.stack??e);receipt.status='FAIL';process.exitCode=1;};
try{await cdp?.close();receipt.browserClosed=true;}catch(e){fail('cleanupError',e);}
try{if(server){server.closeAllConnections();await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));receipt.serverClosed=true;}}catch(e){fail('serverCleanupError',e);}
receipt.sourceReadback=[];
for(const row of receipt.sourceFiles){try{const b=await fs.readFile(path.join(root,row.path));receipt.sourceReadback.push({path:row.path,matches:b.length===row.bytes&&sha(b)===row.sha256});}catch(e){receipt.sourceReadback.push({path:row.path,matches:false,error:String(e)});}}
receipt.sourcesUnchanged=receipt.sourceReadback.length>0&&receipt.sourceReadback.every(r=>r.matches);
receipt.runtimeReadback=[];
for(const row of receipt.runtimeFiles){try{const b=await fs.readFile(path.join(dir,row.url.slice(1)));receipt.runtimeReadback.push({url:row.url,bytes:b.length,sha256:sha(b),matches:b.length===row.bytes&&sha(b)===row.sha256});}catch(e){receipt.runtimeReadback.push({url:row.url,matches:false,error:String(e)});}}
receipt.runtimeUnchanged=receipt.runtimeReadback.length>0&&receipt.runtimeReadback.every(r=>r.matches);
try{assessRuntimeIntegrity(receipt);const controls=[];for(const [name,mutation]of [['browser-exception',{browserEvents:[{method:'Runtime.exceptionThrown'}]}],['runtime-change',{runtimeUnchanged:false}],['source-change',{sourcesUnchanged:false}]]){let refused=false;try{assessRuntimeIntegrity({...receipt,...mutation});}catch{refused=true;}if(!refused)throw Error('Integrity negative control missed '+name);controls.push({name,refused});}assessRuntimeIntegrity(receipt);receipt.integrityControls={positiveRestored:true,controls};}catch(e){fail('integrityError',e);}
try{release?.();receipt.workspaceReleased=true;}catch(e){fail('workspaceCleanupError',e);}
receipt.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status,error:receipt.error,output:receipt.output}));
}
