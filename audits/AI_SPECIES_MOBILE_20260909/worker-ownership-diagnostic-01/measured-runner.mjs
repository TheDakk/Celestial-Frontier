/** Isolated offline ESM/runtime proof, separate from full model delivery. Uses
 * the actual static package and an existing pre-GPU validation response; no
 * model mirror/download, graph initialization or worker debugger attachment. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createMobilePackServer,inspectPwaInventory} from './mobile-pack.mjs';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const need=(value,message)=>{if(!value)throw Error(message);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function assessOfflineWorkerReply(messages){
  need(Array.isArray(messages)&&messages.length===1,'Expected one actual worker validation reply');
  const message=messages[0];
  need(message?.type==='error'&&typeof message.message==='string'
    &&/^Error: Profile option must be boolean(?:\n|$)/.test(message.message),
    'Actual worker did not reach its pinned pre-GPU validation guard');
}
export async function runOfflineRuntime({pack,sha256,output}){
  output=path.resolve(output);pack=path.resolve(pack);
  need(output.startsWith(path.join(root,'audits')+path.sep)&&/^[a-f0-9]{64}$/.test(sha256),'Exact package SHA/new audit directory required');
  await fs.mkdir(output,{recursive:false});
  const write=(name,value)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  const result={schema:'cf.offline-runtime-module-diagnostic.v1',status:'FAIL',startedAt:new Date().toISOString(),
    scope:'Actual static PWA offline app/runtime modules; one deliberately invalid profile request reaches existing guard before GPU/model work. No model delivery or inference.',
    sources:[],clicks:[],network:[],browserEvents:[],cleanup:{},modelExecuted:false,modelDownloaded:false,physicalPhoneQualified:false};
  await write('start.json',result);
  let release,server,backend,cdp,targetId,sessionId,overflow=false;
  try{
    release=acquireWorkspaceLock('isolated offline runtime module diagnostic');
    for(const name of ['tools/local-image-generation/run-offline-runtime.mjs','tools/local-image-generation/mobile-pack.mjs',
      'tools/local-image-generation/runtime-pack.mjs','tools/local-image-generation/stage-worker.mjs',
      'tools/local-image-generation/source-integrity.mjs','port/v2/tools/browsercdp.mjs','port/v2/tools/workspacelock.mjs',
      'port/v2/apps/game/pwa-build.ts','port/v2/apps/game/src/local-ai-game.ts','port/v2/apps/game/src/local-ai-runtime.ts',
      'port/v2/apps/game/src/main.ts','port/v2/apps/game/src/local-model-delivery.ts']){
      const file=path.join(root,name),bytes=await fs.readFile(file);result.sources.push({path:name,file,bytes:bytes.length,sha256:hash(bytes)});
    }
    await write('source-before.json',result.sources);
    await fs.copyFile(path.join(root,'tools/local-image-generation/run-offline-runtime.mjs'),path.join(output,'measured-runner.mjs'),fs.constants.COPYFILE_EXCL);
    backend=await createMobilePackServer({directory:pack,expectedManifestSha256:sha256});
    const originalWorker=await fs.readFile(path.join(pack,'service-worker.js'));
    const telemetry="self.addEventListener('fetch',event=>{const row={type:'CF_READ_ONLY_FETCH_DIAGNOSTIC',url:event.request.url,destination:event.request.destination,mode:event.request.mode,clientId:event.clientId,resultingClientId:event.resultingClientId};event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>Promise.all(cs.map(c=>c.postMessage(row)))));});\n";
    const observedWorker=Buffer.concat([Buffer.from(telemetry),originalWorker]);
    result.instrumentedServiceWorker={qualification:false,scope:'Diagnostic served copy: read-only initial fetch telemetry listener, original response policy untouched',originalSha256:hash(originalWorker),servedSha256:hash(observedWorker),prefix:telemetry};
    const requests=[];const proxy=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');if(!['GET','HEAD'].includes(req.method)||url.origin!=='http://127.0.0.1')throw Error('Unexpected diagnostic proxy request');
      const upstream=await fetch(new URL(url.pathname+url.search,backend.url),{method:req.method,redirect:'error'});const bytes=url.pathname==='/service-worker.js'?observedWorker:Buffer.from(await upstream.arrayBuffer());
      const headers=Object.fromEntries(upstream.headers);delete headers['transfer-encoding'];delete headers['content-encoding'];headers['content-length']=String(bytes.length);
      requests.push({method:req.method,path:url.pathname,status:upstream.status,observedWorker:url.pathname==='/service-worker.js'});res.writeHead(upstream.status,headers);res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){res.writeHead(500);res.end(String(error));}});
    await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen(0,'127.0.0.1',resolve);});
    let closed=false;server={url:'http://127.0.0.1:'+proxy.address().port+'/',verified:backend.verified,requests,close:async()=>{if(closed)return;closed=true;await new Promise((resolve,reject)=>{proxy.close(e=>e?reject(e):resolve());proxy.closeAllConnections();});await backend.close();}};
    result.pack=server.verified;result.url=server.url;
    const origin=new URL(server.url).origin,pwa=inspectPwaInventory(await fs.readFile(path.join(pack,'service-worker.js'),'utf8'));
    const workerSource=await fs.readFile(path.join(pack,'__local_ai/stage-worker.mjs'),'utf8');
    const guard="if(job.profile!==undefined&&typeof job.profile!=='boolean')throw Error('Profile option must be boolean');";
    need(workerSource.split(guard).length===2&&workerSource.indexOf(guard)<workerSource.indexOf('navigator.gpu?.requestAdapter'),
      'Pinned worker guard no longer precedes GPU admission');
    result.preGpuGuard={workerSha256:hash(workerSource),guardOffset:workerSource.indexOf(guard),gpuOffset:workerSource.indexOf('navigator.gpu?.requestAdapter')};
    cdp=await openChromiumCdp({label:'CF isolated offline runtime',userDataPrefix:'cf-offline-runtime-',commandTimeoutMs:30000,onEvent:event=>{
      if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method)){
        if(result.browserEvents.length<200)result.browserEvents.push(event);else overflow=true;
      }
      if(event.method==='Network.loadingFailed'){result.network.push({failure:event.params,sessionId:event.sessionId});}
      if(event.method==='Network.responseReceived'){
        if(result.network.length<2000)result.network.push({url:event.params.response.url,status:event.params.response.status,fromServiceWorker:event.params.response.fromServiceWorker??false});else overflow=true;
      }
    }});result.browser=cdp.browser;
    ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
    ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
    for(const domain of ['Runtime','Page','Log','Network'])await cdp.send(domain+'.enable',{},sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
    const evaluate=async expression=>{const response=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);return response.result.value;};
    async function until(label,expression,timeout=45000){const end=performance.now()+timeout;let last;
      do{last=await evaluate(expression);if(last)return last;await pause(100);}while(performance.now()<end);throw Error('Timeout '+label+': '+JSON.stringify(last));}
    const controlled=`(()=>{const h=window.__CF_SLICE__,c=navigator.serviceWorker.controller;if(!h?.api||!c)return false;
      const s=h.api.state();return s.localAi.available&&s.persistence.ready&&!s.persistence.mutationBlocked&&c.state==='activated'&&c.scriptURL===${JSON.stringify(origin+'/service-worker.js')};})()`;
    await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__cfObservedFetches=[];navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='CF_READ_ONLY_FETCH_DIAGNOSTIC')window.__cfObservedFetches.push(e.data);});"},sessionId);
    await cdp.send('Page.navigate',{url:server.url+'?localai=1'},sessionId);
    await until('game training','!!window.__CF_SLICE__?.api.state().tutActive');
    const geometry=await evaluate(`(()=>{const es=Array.from(document.querySelectorAll('[data-sel="tutskip"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled;});if(es.length!==1)return {count:es.length};const e=es[0],r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;document.addEventListener('click',function onClick(ev){if(!(ev.target instanceof Element)||!ev.target.closest('[data-sel="tutskip"]'))return;document.removeEventListener('click',onClick,true);window.__cfOfflineClick={trusted:ev.isTrusted};},true);return {count:1,x,y,hit:e.contains(document.elementFromPoint(x,y))};})()`);
    need(geometry.count===1&&geometry.hit&&geometry.x>=0&&geometry.x<1280&&geometry.y>=0&&geometry.y<1000,'Training Skip is not a visible hit target');
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    const click=await until('trusted Skip','window.__cfOfflineClick');need(click.trusted,'Skip was not trusted');result.clicks.push({geometry,...click});
    await until('exact installed PWA owner',controlled,90000);
    const before=await evaluate('window.__CF_SLICE__.documentToken');
    // The actual complete cache inventory is verified before taking the origin away.
    result.cached=await evaluate(`(async()=>{const cache=await caches.open(${JSON.stringify('cf-v2-build-'+pwa.buildId)}),rows=[];for(const a of ${JSON.stringify(pwa.assets)}){const r=await cache.match(a.path);if(!r)throw Error('Missing exact cache entry '+a.path);const b=await r.arrayBuffer();rows.push({path:a.path,bytes:b.byteLength,sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('')});}return rows;})()`);
    need(result.cached.length===pwa.assets.length&&result.cached.every((r,i)=>r.path===pwa.assets[i].path&&r.sha256===pwa.assets[i].sha256),'Exact cache payload changed');
    await write('verified-cache.json',result.cached);
    result.workerReplies=[];
    async function observeWorker(label){
    // No debugger attachment to dedicated workers: observe the unchanged worker's
    // real message channel. The malformed profile value is rejected before GPU.
    await evaluate(`(()=>{window.__cfOfflineRuntime={messages:[],error:null};const w=new Worker('/__local_ai/stage-worker.mjs',{type:'module',name:'cf-offline-validation-only'});window.__cfOfflineRuntimeWorker=w;w.onmessage=e=>{window.__cfOfflineRuntime.messages.push(e.data);};w.onerror=e=>{window.__cfOfflineRuntime.error={type:e.type,eventClass:e.constructor.name,message:typeof e.message==='string'?e.message:null,filename:e.filename??null,line:e.lineno??null};};w.postMessage({profile:'intentional-invalid-profile-for-module-proof'});return true;})()`);
    await until('actual offline module validation reply',`(()=>{const r=window.__cfOfflineRuntime;if(r?.error)throw Error(JSON.stringify(r.error));return r?.messages.length?r:null;})()`,45000);
    result.workerReply=await evaluate('window.__cfOfflineRuntime');result.workerReplies.push({label,...result.workerReply});assessOfflineWorkerReply(result.workerReply.messages);
    const mutant=structuredClone(result.workerReply.messages);mutant[0].message='Error: unrelated failure';let refused=false;
    try{assessOfflineWorkerReply(mutant);}catch{refused=true;}need(refused,'Actual reply mutant was accepted');assessOfflineWorkerReply(result.workerReply.messages);result.replyNegativeControlRejected=true;
    await evaluate('window.__cfOfflineRuntimeWorker.terminate();delete window.__cfOfflineRuntimeWorker;true');
    }
    await observeWorker('online-controlled');
    result.staticRequests=server.requests.map(r=>({...r}));await server.close();server=null;result.cleanup.originClosedBeforeOffline=true;
    await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},sessionId);
    await cdp.send('Page.reload',{ignoreCache:false},sessionId);
    await until('offline new controlled game',`window.__CF_SLICE__?.documentToken!==${JSON.stringify(before)}&&${controlled}`,90000);
    result.offlineDocument=await evaluate('({documentToken:window.__CF_SLICE__.documentToken,controller:navigator.serviceWorker.controller.scriptURL,origin:location.origin})');
    await observeWorker('offline');
    // Lazy WASM bytes are requested explicitly offline and compared with the
    // exact inventory. This does not instantiate WASM or load a graph.
    const wasm=pwa.assets.find(a=>a.path.endsWith('.asyncify.wasm'));need(wasm,'Exact lazy Asyncify WASM absent');
    result.offlineWasm=await evaluate(`(async()=>{const r=await fetch(${JSON.stringify(wasm.path)});if(!r.ok)throw Error('Offline WASM '+r.status);const b=await r.arrayBuffer();return {path:${JSON.stringify(wasm.path)},bytes:b.byteLength,sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('')};})()`);
    need(result.offlineWasm.sha256===wasm.sha256,'Offline lazy WASM bytes changed');
    result.modelStore=await evaluate(`(async()=>{const root=await navigator.storage.getDirectory();try{await root.getDirectoryHandle('cf-local-model-delivery-v1');return 'present';}catch(e){if(e.name==='NotFoundError')return 'absent';throw e;}})()`);
    need(result.modelStore==='absent','Module-only proof wrote model storage');
    need(!overflow&&!result.browserEvents.some(e=>e.method==='Runtime.exceptionThrown'||e.method==='Inspector.targetCrashed'),'Browser exception/crash or evidence overflow');
    const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);const bytes=Buffer.from(shot.data,'base64');await fs.writeFile(path.join(output,'offline-runtime.png'),bytes,{flag:'wx'});result.screenshot={bytes:bytes.length,sha256:hash(bytes)};
    result.status='PASS';
  }catch(error){result.error=String(error.stack??error);process.exitCode=1;

  }
  finally{
    if(cdp&&sessionId){await pause(500);try{const capture=await cdp.send('Runtime.evaluate',{expression:'window.__cfObservedFetches',returnByValue:true},sessionId);result.observedFetches=capture.result?.value??capture.exceptionDetails;}catch(e){result.observerCaptureError=String(e);}}
    if(server)result.staticRequests=server.requests.map(r=>({...r}));
    if(cdp&&sessionId&&result.status!=='PASS')try{const state=await cdp.send('Runtime.evaluate',{expression:'({runtime:window.__cfOfflineRuntime,document:window.__CF_SLICE__?.documentToken,controlled:!!navigator.serviceWorker.controller})',returnByValue:true},sessionId);result.failureState=state.result?.value;const s=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);await fs.writeFile(path.join(output,'failure.png'),Buffer.from(s.data,'base64'),{flag:'wx'});}catch(e){result.captureError=String(e);}
    for(const [label,action] of [['target',async()=>{if(targetId)await cdp.send('Target.closeTarget',{targetId});}],['browser',async()=>{if(cdp)await cdp.close();}],['origin',async()=>{if(server)await server.close();}]])try{await action();result.cleanup[label+'Closed']=true;}catch(error){result.cleanup[label+'Error']=String(error);result.status='FAIL';process.exitCode=1;}
    result.sourceIntegrity=await recheckSourceFiles(result.sources);if(!result.sourceIntegrity.unchanged){result.status='FAIL';process.exitCode=1;}
    try{release?.();result.cleanup.workspaceReleased=Boolean(release);}catch(e){result.cleanup.workspaceError=String(e);result.status='FAIL';process.exitCode=1;}
    result.finishedAt=new Date().toISOString();await write('result.json',result);console.log(JSON.stringify({status:result.status,error:result.error??null,result:path.join(output,'result.json')}));
  }
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const options={};for(const arg of process.argv.slice(2)){const m=/^--(pack|sha256|output)=(.+)$/.exec(arg);need(m&&!Object.hasOwn(options,m[1]),'Expected unique --pack --sha256 --output');options[m[1]]=m[2];}need(options.pack&&options.sha256&&options.output,'All options required');await runOfflineRuntime(options);}
