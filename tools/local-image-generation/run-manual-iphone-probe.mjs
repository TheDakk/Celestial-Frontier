/** Single ordinary-Safari probe through the same pinned worker. No automation TLS bypass. */
import fs from 'node:fs/promises';import {createReadStream} from 'node:fs';import https from 'node:https';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {admitManualPhoneStart,admitManualPhoneResult} from './manual-iphone-probe-contract.mjs';
import {fetchModel,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir=path.join(root,'tools/local-image-generation'),host='192.168.1.62',port=49765,tls='/private/tmp/cf-iphone-trusted-tls-20260912';
if(process.argv.length!==3)throw Error('Usage: run-manual-iphone-probe.mjs NEW_AUDIT_DIRECTORY');
const out=path.resolve(process.argv[2]);if(!out.startsWith(root+'/audits/'))throw Error('Audit root required');await fs.mkdir(out);
const sha=b=>createHash('sha256').update(b).digest('hex'),report={schema:'cf.manual-iphone-kit-probe.v1',status:'PREPARING',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),target:{userModel:'iPhone17Pro',userIos:'26.6.2',connection:'USB-C/same LAN',browser:'ordinary Safari',identityEvidence:'User-operated physical phone; prior physical WebDriver session identifies device/OS; this run is not WebDriver-attested'},requests:[],events:[],inferenceRuns:0,textEncoderRequests:[],deliveryWrites:0};
let server,release,ending=false,lastContact=0,started=0,timer,finish;const done=new Promise(r=>finish=r);
let saving=Promise.resolve();const save=()=>{const bytes=JSON.stringify(report,null,2)+'\n';saving=saving.then(async()=>{const p=path.join(out,'result.json');await fs.writeFile(p+'.tmp',bytes);await fs.rename(p+'.tmp',p);});return saving;};
async function end(status,error){if(ending)return;ending=true;if(status)report.status=status;if(error)report.error=String(error);clearInterval(timer);await save();finish();}
try{
 if(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim())throw Error('Committed source required');release=acquireWorkspaceLock('one ordinary Safari iPhone probe');
 const pin=JSON.parse(await fs.readFile(path.join(dir,'model-manifest.json'))),cache=path.join(DEFAULT_CACHE_ROOT,pin.modelId.replace('/','--'),pin.revision),prepared=path.join(root,'audits/ART_KIT_WEATHER_MAT_20260912/prepared'),manifest=JSON.parse(await fs.readFile(path.join(prepared,'prepared-manifest.json')));
 report.modelVerification=(await fetchModel({manifest:pin,cacheDir:cache,verifyOnly:true})).receipt;
 const recipe=await fs.readFile(path.join(prepared,'recipe.json'));if(sha(recipe)!==manifest.recipeSha256)throw Error('Recipe changed');report.recipeSha256=sha(recipe);
 const cert=await fs.readFile(path.join(tls,'server.pem'));report.serverCertificatePemSha256=sha(cert);
 const routes=new Map([['/recipe.json',path.join(prepared,'recipe.json')],['/kit-client.mjs',path.join(prepared,'kit-client.mjs')],['/stage-worker.mjs',path.join(dir,'kit-phone-stage-worker.mjs')]]);
 for(const n of ['manual-iphone-probe-client.mjs','kit-proof-client.mjs','kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs','kit-weather-math.mjs','pipeline-math.mjs','browser-variant-plan.json'])routes.set('/'+n,path.join(dir,n));
 for(const f of manifest.files){const file=path.join(prepared,'inputs',path.basename(f.url));if(sha(await fs.readFile(file))!==f.sha256)throw Error('Fitted input changed');routes.set(f.url,file);}
 for(const f of pin.files)if(!f.path.startsWith('text_encoder')&&!f.path.startsWith('tokenizer/'))routes.set('/model/'+f.path,path.join(cache,f.path));
 for(const ext of ['json','f16'])routes.set('/__local_ai/embeddings/earth-rain-v1.'+ext,path.join(root,'port/v2/apps/game/public/__local_ai/embeddings/earth-rain-v1.'+ext));
 const dist=path.join(dir,'node_modules/onnxruntime-web/dist');for(const n of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(n))routes.set('/node_modules/onnxruntime-web/dist/'+n,path.join(dist,n));
 report.sources=[];for(const [url,p]of routes)if(!url.startsWith('/model/'))report.sources.push({url,path:path.relative(root,p),sha256:sha(await fs.readFile(p))});
 report.initializerAudit=JSON.parse(await fs.readFile(path.join(root,'audits/IPHONE_EMBEDDED_PROBE_20260912/initializer-audit.json')));if(report.initializerAudit.status!=='PASS'||report.initializerAudit.revision!==pin.revision)throw Error('Initializer audit mismatch');
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Celestial Frontier phone probe</title><style>body{background:#12222d;color:white;font:18px system-ui;margin:24px}button{padding:18px;font:20px system-ui}img{max-width:100%}</style><h1>One phone finisher probe</h1><p id="status">Checking secure WebGPU…</p><button id="start" disabled>Start probe</button><p>Leave Safari open and the phone unlocked. Text encoder is skipped. No automatic retries.</p><img id="painting" hidden alt="Phone finisher result"><script type="module" src="/manual-iphone-probe-client.mjs"></script>';
 server=https.createServer({key:await fs.readFile(path.join(tls,'server-key.pem')),cert},async(req,res)=>{
  const url=new URL(req.url,'https://'+host);if(report.requests.length<2500)report.requests.push({path:url.pathname,method:req.method,range:req.headers.range??null});if(/text_encoder|tokenizer/.test(url.pathname))report.textEncoderRequests.push(url.pathname);
  for(const [k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}))res.setHeader(k,v);
  try{
   if(req.method==='POST'&&['/probe-ready','/probe-start','/probe-progress','/probe-heartbeat','/probe-result'].includes(url.pathname)){
    if(req.headers.origin!==`https://${host}:${port}`)throw Error('Unexpected report origin');let body='';for await(const chunk of req){body+=chunk;if(body.length>16*1024*1024)throw Error('Report oversized');}const data=JSON.parse(body);lastContact=performance.now();
    if(url.pathname==='/probe-ready'){if(!started){report.capabilityProbe=data;report.status='READY';}}
    else if(url.pathname==='/probe-start'){admitManualPhoneStart(data,started,ending,report.initializerAudit.worker.largest.bytes);started=lastContact;report.inferenceRuns=1;report.status='RUNNING';report.capabilityProbe=data;console.log(JSON.stringify({phase:'capabilities',...data}));}
    else if(!started||ending){throw Error('No active probe');}
    else if(url.pathname==='/probe-progress'){report.events=data.events??[];report.details=data.details;report.modelError=data.error;console.log(JSON.stringify({phase:'progress',last:report.events.at(-1)}));}
    else if(url.pathname==='/probe-result'){
     report.events=data.events??[];report.details=data.details;report.modelError=data.error;
     if(data.status==='complete'){
      const d=data.details;admitManualPhoneResult(d,report.textEncoderRequests);
      for(const [field,file]of [['painting','painting.png'],['finisherOriginal','finisher-before-weather.png']]){const bytes=Buffer.from(data[field]??'','base64');if(bytes.length<1000||!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))throw Error('PNG missing');await fs.writeFile(path.join(out,file),bytes,{flag:'wx'});if(field==='painting')report.paintingSha256=sha(bytes);}
      report.warmFinisherMs=d.elapsedMs;report.sessionPreparationMs=d.coldPreparationMs;res.writeHead(204).end();await end('PASS');return;
     }res.writeHead(204).end();await end('MODEL_LOAD_OR_INFERENCE_FAILED',data.error);return;
    }
    await save();res.writeHead(204).end();return;
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
   if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(req.method==='HEAD'?undefined:html);return;}
   const file=routes.get(url.pathname);if(!file){res.writeHead(404).end();return;}if(url.pathname.startsWith('/model/')&&!started){res.writeHead(403).end();return;}
   const stat=await fs.stat(file);let start=0,stop=stat.size-1;if(req.headers.range){const m=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range);if(!m)throw Error('Range');start=Number(m[1]);stop=Number(m[2]);if(start>stop||stop>=stat.size)throw Error('Range bounds');res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${stop}/${stat.size}`);}
   res.setHeader('Content-Type',({'.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[path.extname(file)]??'application/octet-stream');res.setHeader('Content-Length',stop-start+1);if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(file,{start,end:stop});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(e){if(!res.headersSent)res.writeHead(400);res.end();if(started)await end('INSTRUMENT_FAILED',e);}
 });await new Promise((r,j)=>{server.once('error',j);server.listen(port,host,r);});report.status='WAITING_FOR_PHONE';await save();console.log(JSON.stringify({status:report.status,url:`https://${host}:${port}/`}));
 timer=setInterval(()=>{if(started&&!ending){if(performance.now()-lastContact>60000)void end('CONNECTION_LOST','No page heartbeat for60s; no retry');else if(performance.now()-started>900000)void end('DEADLINE','One probe exceeded15minutes');}},3000);
 process.once('SIGINT',()=>{void end('STOPPED','Stopped without retry');});await done;
}catch(e){await end('INSTRUMENT_FAILED',e);}
finally{clearInterval(timer);if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}release?.();const loaded=report.events.find(e=>e.phase==='loaded'&&e.stage==='denoise');report.transformerLoad={reached:report.events.some(e=>e.phase==='loading'&&e.stage==='denoise'),completed:!!loaded,memory:loaded?.memory??null};report.memoryScope='Exposed browser/worker JS heap only; native/GPU memory unavailable via these APIs';await save();}
console.log(JSON.stringify({status:report.status,warmFinisherMs:report.warmFinisherMs,transformerLoad:report.transformerLoad,error:report.error}));if(report.status!=='PASS')process.exitCode=1;
