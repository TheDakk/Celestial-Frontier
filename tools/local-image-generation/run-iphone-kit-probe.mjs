/** One physical-iPhone capability/model-load/unchanged warm-finisher probe.
 * Transient HTTPS read-only model transport; no installer, OPFS derivative or delivery tier. */
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fetchModel,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {admitPhysicalPhone} from './iphone-probe-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir=path.join(root,'tools/local-image-generation');
if(process.argv.length!==7)throw Error('Usage: run-iphone-kit-probe.mjs SESSION_JSON HTTPS_KEY HTTPS_CERT HOST NEW_AUDIT_DIRECTORY');
const [sessionFile,keyFile,certFile,host,outArg]=process.argv.slice(2),out=path.resolve(outArg);
if(!out.startsWith(root+'/audits/')||!/^192\.168\.1\.62$/.test(host))throw Error('Only observed local probe host/audit root admitted');
await fs.mkdir(out);
const session=JSON.parse(await fs.readFile(sessionFile,'utf8')).response.value,cap=session.capabilities;
admitPhysicalPhone(cap);
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={schema:'cf.iphone-kit-probe.v1',status:'INCOMPLETE',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd:root}).trim(),target:{userModel:'iPhone 17 Pro',userIos:'26.6.2',connection:'USB-C',capabilities:{...cap,'safari:deviceUDID':undefined},deviceIdSha256:sha(cap['safari:deviceUDID'])},sources:[],requests:[],events:[],inferenceRuns:0,deliveryWrites:0};
const endpoint='http://127.0.0.1:49763/session/'+session.sessionId;
async function command(method,suffix,body){const r=await fetch(endpoint+suffix,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)});const d=await r.json();if(!r.ok||d.value?.error)throw Error(JSON.stringify(d.value));return d.value;}
const evaluate=script=>command('POST','/execute/sync',{script,args:[]});
const save=()=>fs.writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');
let server,release;
try{
 if(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8',cwd:root}).trim())throw Error('Native probe requires committed source');
 release=acquireWorkspaceLock('one physical iPhone kit probe');
 const prepared=path.join(root,'audits/KIT_NORMAL_LAND_20260912/warm-prepared');
 const manifest=JSON.parse(await fs.readFile(path.join(prepared,'prepared-manifest.json'),'utf8'));
 const pin=JSON.parse(await fs.readFile(path.join(dir,'model-manifest.json'),'utf8'));
 const cacheDir=path.join(DEFAULT_CACHE_ROOT,pin.modelId.replace('/','--'),pin.revision);
 report.modelVerification=(await fetchModel({manifest:pin,cacheDir,verifyOnly:true})).receipt;
 const recipe=await fs.readFile(path.join(prepared,'recipe.json'));if(sha(recipe)!==manifest.recipeSha256)throw Error('Accepted recipe changed');report.recipeSha256=sha(recipe);
 const routes=new Map([['/recipe.json',path.join(prepared,'recipe.json')],['/kit-client.mjs',path.join(prepared,'kit-client.mjs')]]);
 for(const name of ['kit-proof-client.mjs','kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs','pipeline-math.mjs','browser-variant-plan.json'])routes.set('/'+name,path.join(dir,name));
 routes.set('/stage-worker.mjs',path.join(dir,'kit-stage-worker.mjs'));
 for(const row of manifest.files){const file=path.join(prepared,'inputs',path.basename(row.url));if(sha(await fs.readFile(file))!==row.sha256)throw Error('Fitted input changed');routes.set(row.url,file);}
 for(const row of pin.files)routes.set('/model/'+row.path,path.join(cacheDir,row.path));
 const dist=path.join(dir,'node_modules/onnxruntime-web/dist');for(const name of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(name))routes.set('/node_modules/onnxruntime-web/dist/'+name,path.join(dist,name));
 routes.set('/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',path.join(dir,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
 for(const [url,file]of routes)if(!url.startsWith('/model/')){const b=await fs.readFile(file);report.sources.push({url,path:path.relative(root,file),sha256:sha(b)});}
 const html='<!doctype html><meta name="viewport" content="width=device-width"><title>Celestial Frontier iPhone probe</title><h1>iPhone engine probe</h1><p id="status">Capability check</p><img id="painting" hidden alt="Unchanged baseline timing run"><script type="module" src="/kit-proof-client.mjs"></script>';
 server=https.createServer({key:await fs.readFile(keyFile),cert:await fs.readFile(certFile)},async(req,res)=>{
  const u=new URL(req.url,'https://'+host);if(report.requests.length<2500)report.requests.push({path:u.pathname,range:req.headers.range??null});
  for(const [k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}))res.setHeader(k,v);
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
  if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  const file=routes.get(u.pathname);if(!file){res.writeHead(404).end();return;}
  try{const stat=await fs.stat(file);let start=0,end=stat.size-1;
   if(req.headers.range){const m=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range);if(!m)throw Error('Range');start=Number(m[1]);end=Number(m[2]);if(start>end||end>=stat.size)throw Error('Range bounds');res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
   res.setHeader('Content-Type',({'.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[path.extname(file)]??'application/octet-stream');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
   if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{if(!res.headersSent)res.writeHead(416);res.end();}
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,host,resolve);});
 report.probeOrigin=`https://${host}:${server.address().port}`;await save();
 await command('POST','/timeouts',{pageLoad:30000,script:30000});
 await command('POST','/url',{url:report.probeOrigin+'/'});
 report.capabilityProbe=await command('POST','/execute/async',{script:`const done=arguments[arguments.length-1];(async()=>{const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});let storage;try{storage=await navigator.storage.estimate();}catch(e){storage={unavailable:String(e)}};return {userAgent:navigator.userAgent,secureContext:isSecureContext,crossOriginIsolated,webgpu:!!navigator.gpu,adapterAvailable:!!adapter,maxBufferSize:adapter?.limits.maxBufferSize??null,maxStorageBufferBindingSize:adapter?.limits.maxStorageBufferBindingSize??null,shaderF16:adapter?.features.has('shader-f16')??null,storage,jsHeap:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null,nativeGpuMemory:null,memoryNote:'Standard Safari page APIs may not expose native or GPU memory; null means unavailable.'};})().then(done).catch(e=>done({error:String(e)}));`,args:[]});
 console.log(JSON.stringify({phase:'capabilities',...report.capabilityProbe}));await save();
 const c=report.capabilityProbe;if(!c.secureContext||c.error)throw Error('Capability instrument did not reach secure origin');
 if(!c.adapterAvailable||!c.shaderF16){report.status='DEVICE_UNSUPPORTED';report.modelLoad='Not attempted: required WebGPU/f16 unavailable';}
 else{
  if(!await evaluate('return !!window.kitProof'))throw Error('Kit probe client unavailable');
  await evaluate('void window.kitProof.start();return true');report.inferenceRuns=1;const deadline=performance.now()+900000;let last=-1;
  while(true){const state=await evaluate('return window.kitProof.snapshot()');
   const partial=await evaluate('return window.kitProof.report()');report.events=partial.events;report.details=partial.details;report.modelError=partial.error;await save();
   if(state.last?.sequence!==last){last=state.last?.sequence;console.log(JSON.stringify(state));}
   if(state.status==='complete'){report.status='PASS';report.warmFinisherMs=partial.details.elapsedMs;report.sessionPreparationMs=partial.details.coldPreparationMs;break;}
   if(state.status==='failed'){report.status='MODEL_LOAD_OR_INFERENCE_FAILED';break;}
   if(performance.now()>deadline)throw Error('One phone model attempt exceeded15minutes');
   await new Promise(r=>setTimeout(r,3000));
  }
  const loaded=report.events.find(e=>e.phase==='loaded'&&e.stage==='denoise');
  report.transformerLoad={reached:report.events.some(e=>e.phase==='loading'&&e.stage==='denoise'),completed:!!loaded,memory:loaded?.memory??null,memoryScope:loaded?.memory?'Worker JavaScript heap only; not native/GPU memory':'Unavailable through existing Safari/worker API, or transformer load not reached'};
  if(report.status==='PASS'){const data=await command('POST','/execute/async',{script:'const done=arguments[arguments.length-1];window.kitProof.artifact("painting").then(done).catch(e=>done({error:String(e)}));',args:[]});if(typeof data!=='string')throw Error('Painting capture failed');const png=Buffer.from(data,'base64');await fs.writeFile(path.join(out,'painting.png'),png,{flag:'wx'});report.paintingSha256=sha(png);}
 }
 for(const s of report.sources)if(sha(await fs.readFile(path.join(root,s.path)))!==s.sha256)throw Error('Source changed during phone probe');
}catch(e){report.status='INSTRUMENT_OR_CONNECTION_FAILED';report.error=String(e.stack??e);console.error(report.error);}
finally{
 try{await evaluate('window.kitProof?.dispose();return true');}catch(e){report.disposeError=String(e);}
 try{await command('DELETE','');report.sessionClosed=true;}catch(e){report.sessionCloseError=String(e);}
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}release?.();await save();
}
console.log(JSON.stringify({status:report.status,capabilityProbe:report.capabilityProbe,transformerLoad:report.transformerLoad,warmFinisherMs:report.warmFinisherMs,error:report.error}));
if(report.status==='INSTRUMENT_OR_CONNECTION_FAILED')process.exitCode=1;
