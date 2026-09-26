/** Native optional-pack delivery diagnostic. Explicit UI controls own installation;
 * read-only diagnostics measure OPFS/CacheStorage. Optional --landfall also tests
 * actual normal offline inference. No remote model download, personal profile,
 * shipping/phone qualification or hosted work.
 * Run once only after source/pack freeze, outside Seatbelt under toolchain lock. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {compileNativeDeliveryDiagnostic} from './compile-delivery-diagnostic.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {PINNED_LOCAL_MODEL_MANIFEST_V1 as model} from '../../port/v2/apps/game/src/local-model-manifest.ts';
import {createMobilePackServer,inspectPwaInventory,verifyMobilePack} from './mobile-pack.mjs';
import {createNativeModelMirror} from './native-model-mirror.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
import {assessOfflineWorkerReply} from './run-offline-runtime.mjs';
import {runOfflineLandfallProof} from './offline-landfall-proof.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sourceNames=[
  'port/v2/apps/game/src/main.ts','port/v2/apps/game/index.html','port/v2/apps/game/vite.config.ts',
  'port/v2/apps/game/pwa-build.ts','port/v2/apps/game/src/pwa-update.ts','port/v2/apps/game/src/local-ai-game.ts',
  'port/v2/apps/game/src/local-ai-runtime.ts','port/v2/apps/game/src/local-model-delivery.ts',
  'port/v2/apps/game/src/local-model-manifest.ts','port/v2/apps/game/src/local-model-sha256.ts',
  'port/v2/apps/game/src/landfall-conditioning.ts','port/v2/apps/game/src/ai-landfall-originals.ts',
  'tools/local-image-generation/run-mobile-model-delivery.mjs','tools/local-image-generation/native-model-mirror.mjs',
  'tools/local-image-generation/compile-delivery-diagnostic.mjs',
  'tools/local-image-generation/offline-landfall-proof.mjs','tools/local-image-generation/run-offline-runtime.mjs',
  'port/v2/apps/game/src/landfall-viewer.ts','port/v2/apps/game/src/ai-landfall-jobs.ts',
  'tools/local-image-generation/mobile-pack.mjs','tools/local-image-generation/runtime-pack.mjs',
  'tools/local-image-generation/game-preview-server.mjs','tools/local-image-generation/source-integrity.mjs',
  'tools/local-image-generation/fetch-model.mjs','tools/local-image-generation/q8-block32.mjs',
  'tools/local-image-generation/model-manifest.json','tools/local-image-generation/stage-worker.mjs',
  'tools/local-image-generation/package-lock.json','port/v2/package-lock.json',
  'port/v2/tools/browsercdp.mjs','port/v2/tools/workspacelock.mjs',
];
const inventoryExpression=`(async()=>{const root=await navigator.storage.getDirectory();let dir;try{dir=await root.getDirectoryHandle('cf-local-model-delivery-v1');}catch(e){if(e.name==='NotFoundError')return {markers:[],attempts:[],totalBytes:0};throw e;}
 const markers=[],attempts=[];let totalBytes=0;
 for await(const [name,entry] of dir.entries()){
   if(entry.kind==='file'){const f=await entry.getFile();if(f.size>65536)throw Error('Oversized delivery marker');markers.push({name,bytes:f.size,value:JSON.parse(await f.text())});}
   else{let bytes=0,chunks=0;const files=[];for await(const [part,handle] of entry.entries()){if(handle.kind!=='file')throw Error('Unexpected nested model directory');const f=await handle.getFile();bytes+=f.size;chunks++;if(chunks>10000)throw Error('Too many model chunks');files.push({name:part,bytes:f.size});}attempts.push({name,bytes,chunks,files});totalBytes+=bytes;}
 }return {markers,attempts,totalBytes,estimate:await navigator.storage.estimate()};})()`;
export function assessNativeController(result,origin,previousDocument=null){
  need(result?.controlled===true&&result.controllerState==='activated'
    &&result.controllerScriptURL===new URL('/service-worker.js',origin).href&&result.origin===origin
    &&typeof result.documentToken==='string'&&result.documentToken.length>0
    &&result.documentToken!==previousDocument,'Native document lacks its exact activated static-package controller');
}
export function assessNativeReadback(result,expected){
  need(result?.status?.ready===true&&result.status.phase==='ready'&&result.status.error===null
    &&result.status.manifestSha256===hash(JSON.stringify(model))&&result.status.totalBytes===model.totalBytes
    &&result.status.verifiedBytes===model.totalBytes&&result.status.verifiedFiles===model.files.length
    &&result.status.totalFiles===model.files.length,'Native model verifier did not prove all pinned bytes');
  need(Array.isArray(result.files)&&result.files.length===expected.length,'Missing native Blob files');
  for(let i=0;i<expected.length;i++){
    const actual=result.files[i],pin=expected[i];
    need(actual.path===pin.path&&actual.bytes===pin.bytes&&actual.headSha256===pin.headSha256
      &&actual.tailSha256===pin.tailSha256,'Native model Blob identity/size/head/tail mismatch: '+pin.path);
  }
}
export async function runMobileModelDelivery({pack,sha256,output,landfall=false}){
  need(typeof landfall==='boolean','Landfall option must be boolean');
  need(typeof sha256==='string'&&/^[a-f0-9]{64}$/.test(sha256),'External exact mobile-pack manifest SHA required');
  output=path.resolve(output);pack=path.resolve(pack);
  need(output.startsWith(path.join(root,'audits')+path.sep),'New repository audit directory required');
  await fs.mkdir(output,{recursive:false});
  const write=(name,value)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  const receipt={schema:'cf.native-optional-mobile-model-delivery.v1',status:'FAIL',startedAt:new Date().toISOString(),
    sourcePack:{directory:pack,manifestSha256:sha256},sources:[],observations:[],controllers:[],clicks:[],screenshots:[],browserEvents:[],network:[],workerTargetEvents:[],interceptions:[],cleanup:{},
    actualRemoteDownload:false,modelExecuted:false,physicalPhoneQualified:false,qualityAccepted:false,
    scope:'Desktop native browser: actual optional static package, explicit native install/pause/resume/verify; exact pinned model bytes from disclosed loopback transport; full OPFS verification and offline app/runtime.',normalOfflineLandfallRequested:landfall};
  await write('start.json',receipt);
  let release,server,mirror,cdp,targetId,sessionId,evaluate,offline=false,fatal=null;
  const workers=new Map(),pending=new Set(),allSessions=new Set();
  const track=task=>{pending.add(task);task.catch(error=>{fatal??=error;}).finally(()=>pending.delete(task));};
  try{
    release=acquireWorkspaceLock('native optional mobile model delivery');
    for(const name of sourceNames){const file=path.join(root,name),bytes=await fs.readFile(file);receipt.sources.push({path:name,file,bytes:bytes.length,sha256:hash(bytes)});}
    await write('source-before.json',receipt.sources);
    const diagnostic=await compileNativeDeliveryDiagnostic({receiptDirectory:path.join(output,'diagnostic-owner')});
    receipt.diagnosticCompiler=diagnostic.provenance;
    server=await createMobilePackServer({directory:pack,expectedManifestSha256:sha256});receipt.pack=server.verified;
    const pwa=inspectPwaInventory(await fs.readFile(path.join(pack,'service-worker.js'),'utf8'));
    const runtime=JSON.parse(await fs.readFile(path.join(pack,'__local_ai/runtime.json'),'utf8'));
    need(runtime.schema==='cf.local-ai-runtime-pack.v1'&&runtime.modelSource==='verified-opfs-only'&&runtime.autoDownload===false
      &&runtime.q8Block32===false&&Object.keys(runtime.modelFiles).length===0,'Package did not preserve installed-only model delivery');
    const origin=new URL(server.url).origin;
    mirror=await createNativeModelMirror({frontOrigin:origin});
    receipt.modelMirror=mirror.verification;await write('model-mirror.json',receipt.modelMirror);
    const pinnedUrls=new Map(model.files.map(file=>[new URL(file.path.split('/').map(encodeURIComponent).join('/'),`https://huggingface.co/${model.modelId}/resolve/${model.revision}/`).href,file]));
    async function intercept(event){
      const sid=event.sessionId,id=event.params.requestId,request=event.params.request,url=new URL(request.url);
      const worker=[...workers.values()].find(row=>row.sessionId===sid);
      const owner=sid===sessionId?{type:'page',targetId,url:server?.url??origin+'/'}
        :worker?{type:worker.info.type,targetId:worker.info.targetId,url:worker.info.url}:{type:'unknown',targetId:null,url:null};
      const provenance={sessionId:sid,owner,networkId:event.params.networkId??null,frameId:event.params.frameId??null};
      if(url.origin===origin){await cdp.send('Fetch.continueRequest',{requestId:id},sid);return;}
      const file=pinnedUrls.get(url.href);
      if(!file||request.method!=='GET'||offline){
        receipt.interceptions.push({...provenance,url:url.href,method:request.method,action:'blocked'});
        await cdp.send('Fetch.failRequest',{requestId:id,errorReason:'BlockedByClient'},sid);
        throw Error('Unexpected or offline external model request: '+url.href);
      }
      const headers=Object.entries(request.headers),range=headers.find(([key])=>key.toLowerCase()==='range')?.[1]??null;
      const requestOrigin=headers.find(([key])=>key.toLowerCase()==='origin')?.[1]??null;
      need(requestOrigin===origin&&!headers.some(([key])=>key.toLowerCase()==='cookie'),'Model request origin/credentials differ from actual CORS owner');
      if(range!==null)need(/^bytes=\d+-$/.test(range)&&Number(range.slice(6,-1))<file.bytes,'Unexpected model resume range');
      const rewritten=mirror.files.find(row=>row.path===file.path)?.mirrorUrl;need(rewritten,'Pinned mirror route absent');
      receipt.interceptions.push({...provenance,url:url.href,rewritten,path:file.path,method:request.method,range,origin:requestOrigin,action:'loopback-byte-mirror'});
      need(receipt.interceptions.length<=100,'Unexpected repeated model request growth');
      await cdp.send('Fetch.continueRequest',{requestId:id,url:rewritten},sid);
    }
    async function attachWorker(info){
      if(workers.has(info.targetId))return;
      workers.set(info.targetId,{info,sessionId:null,ready:false});
      const attached=await cdp.send('Target.attachToTarget',{targetId:info.targetId,flatten:true});
      workers.get(info.targetId).sessionId=attached.sessionId;allSessions.add(attached.sessionId);
      await cdp.send('Network.enable',{},attached.sessionId);
      await cdp.send('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]},attached.sessionId);
      if(offline)await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},attached.sessionId);
      workers.get(info.targetId).ready=true;
    }
    cdp=await openChromiumCdp({label:'CF optional model delivery',userDataPrefix:'cf-mobile-model-delivery-',commandTimeoutMs:60000,
      onEvent:event=>{
        if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method)){
          if(receipt.browserEvents.length<500)receipt.browserEvents.push(event);else fatal??=Error('Browser evidence overflow');
        }
        if(event.method==='Fetch.requestPaused')track(intercept(event));
        // Only the service worker needs interception for explicit downloads.
        // Observe dedicated workers without debugger commands that can stall startup.
        if(['Target.targetCreated','Target.targetInfoChanged','Target.targetDestroyed'].includes(event.method)){
          if(receipt.workerTargetEvents.length<1000)receipt.workerTargetEvents.push(event);else fatal??=Error('Worker target evidence overflow');
        }
        if(event.method==='Target.targetCreated'&&event.params?.targetInfo?.type==='service_worker')track(attachWorker(event.params.targetInfo));
        if(event.method==='Target.targetDestroyed'){const prior=workers.get(event.params.targetId);if(prior?.sessionId)allSessions.delete(prior.sessionId);workers.delete(event.params.targetId);}
        if(event.method==='Network.responseReceived'){
          if(receipt.network.length<10000)receipt.network.push({sessionId:event.sessionId,url:event.params.response.url,status:event.params.response.status,
            fromServiceWorker:event.params.response.fromServiceWorker??false,mimeType:event.params.response.mimeType});
          else fatal??=Error('Network evidence overflow');
        }
      }});
    receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
    await cdp.send('Target.setDiscoverTargets',{discover:true});
    ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
    ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));allSessions.add(sessionId);
    await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Page.enable',{},sessionId);await cdp.send('Log.enable',{},sessionId);await cdp.send('Network.enable',{},sessionId);
    await cdp.send('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]},sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
    evaluate=async expression=>{if(fatal)throw fatal;const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;};
    async function until(label,expression,timeout=30000){
      const deadline=performance.now()+timeout;let value;
      do{if(fatal)throw fatal;value=await evaluate(expression);if(value)return value;await pause(200);}while(performance.now()<deadline);
      throw Error('Timed out '+label+': '+JSON.stringify(value));
    }
    const state=`(()=>{const h=window.__CF_SLICE__;if(!h)return null;const s=h.api.state();return {documentToken:h.documentToken,mode:s.mode,star:s.star,planet:s.planet,
      panelOpen:s.panelOpen,tutActive:s.tutActive,tutDone:s.tutDone,persistence:s.persistence,localAi:s.localAi,
      text:document.querySelector('#notificationpanel [data-local-ai]')?.textContent??'',controlled:!!navigator.serviceWorker.controller};})()`;
    async function observe(label){const value=await evaluate(state);receipt.observations.push({label,...value});return value;}
    async function requireController(label,previousDocument=null){
      const sample=`(()=>{const controller=navigator.serviceWorker?.controller;return {controlled:!!controller,controllerState:controller?.state??null,
        controllerScriptURL:controller?.scriptURL??null,origin:location.origin,documentToken:window.__CF_SLICE__?.documentToken??null};})()`;
      const value=await until(label,`(()=>{const value=${sample};return value.controlled&&value.controllerState==='activated'&&value.documentToken&&value.documentToken!==${JSON.stringify(previousDocument)}?value:null;})()`,120000);
      receipt.controllers.push({label,...value});assessNativeController(value,origin,previousDocument);
      return value;
    }
    async function click(selector,label){
      const geometry=await evaluate(`(()=>{const nodes=Array.from(document.querySelectorAll(${JSON.stringify(selector)}));const visible=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||e.disabled)return false;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(p.hidden||p.inert||s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)return false;}return true;};const rows=nodes.filter(visible);if(rows.length!==1)return {count:rows.length};const e=rows[0];e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return {count:1,x,y,width:r.width,height:r.height,hit:e.contains(document.elementFromPoint(x,y)),visible:visible(e),inViewport:x>=0&&x<innerWidth&&y>=0&&y<innerHeight};})()`);
      receipt.lastControl={selector,label,geometry};need(geometry.count===1&&geometry.visible&&geometry.hit&&geometry.inViewport,'Native control is not a visible hit target: '+selector);
      await evaluate(`(()=>{window.__cfMobileClick=null;const selector=${JSON.stringify(selector)};document.addEventListener('click',function listener(e){if(!(e.target instanceof Element)||!e.target.closest(selector))return;document.removeEventListener('click',listener,true);window.__cfMobileClick={selector,trusted:e.isTrusted};},true);})()`);
      await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
      const delivered=await until(label+' trusted delivery','window.__cfMobileClick',5000);need(delivered.trusted,'Control did not receive trusted native input');receipt.clicks.push({selector,label,geometry,delivered});
    }
    async function openStorage(){
      const opened=await evaluate(`window.__CF_SLICE__.api.state().panelOpen==='notifications'`);
      if(!opened){const selector=await evaluate(`(()=>{for(const id of ['shelfnotifications','docknotifications']){const e=document.getElementById(id),r=e?.getBoundingClientRect();if(r&&r.width>0&&r.height>0)return '#'+id;}return null;})()`);need(selector,'No native Notifications opener');await click(selector,'Open Notifications');}
      await until('model storage controls','!!document.querySelector(\'#notificationpanel [data-ai-model-storage="notifications"]\')');
      if(!await evaluate(`document.querySelector('#notificationpanel [data-ai-model-storage="notifications"]').open`))
        await click('#notificationpanel [data-ai-model-storage="notifications"] summary','Open model storage');
    }
    async function screenshot(file){const result=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);const bytes=Buffer.from(result.data,'base64');await fs.writeFile(path.join(output,file),bytes,{flag:'wx'});receipt.screenshots.push({file,bytes:bytes.length,sha256:hash(bytes)});}
    await cdp.send('Page.navigate',{url:server.url+'?localai=1'},sessionId);
    await until('actual static game','!!window.__CF_SLICE__?.api',90000);
    await click('[data-sel="tutskip"]','Skip training');
    await until('durable local-AI game',`(()=>{const s=window.__CF_SLICE__.api.state();return !s.tutActive&&s.tutDone&&s.persistence.ready&&!s.persistence.mutationBlocked&&s.localAi.available;})()`,60000);
    await requireController('exact controller before explicit install');
    await Promise.all([...pending]);need([...workers.values()].some(row=>row.info.type==='service_worker'&&row.sessionId),'No measured service worker interception owner');
    const empty=await evaluate(inventoryExpression);receipt.emptyModelStore=empty;need(empty.totalBytes===0&&empty.markers.length===0&&receipt.interceptions.length===0,'Game auto-downloaded or preseeded model bytes');
    await openStorage();await screenshot('01-before-explicit-install.png');
    await click('#notificationpanel [data-ai-act="install"]','Explicitly install pinned browser model');
    await until('persisted model prefix',`(${inventoryExpression}).then(s=>s.totalBytes>=4*1048576?s:null)`,60000);
    await click('#notificationpanel [data-ai-act="stop-download"]','Pause model after persisted chunks');
    await until('native canceled status',`/Model canceled/.test(document.querySelector('#notificationpanel [data-local-ai]')?.textContent??'')`,30000);
    const partial=await evaluate(inventoryExpression);receipt.partial=partial;await write('partial-opfs.json',partial);
    need(partial.totalBytes>=1048576&&partial.totalBytes<model.totalBytes&&partial.attempts.length===1
      &&partial.markers.some(row=>row.name.startsWith('active-'))&&!partial.markers.some(row=>row.name.startsWith('ready-')),'Pause did not retain one unready partial attempt');
    await screenshot('02-paused-resumable-model.png');
    const pauseRequests=receipt.interceptions.length,oldDocument=(await observe('paused')).documentToken;
    await cdp.send('Page.reload',{ignoreCache:false},sessionId);
    await until('new document without automatic resume',`window.__CF_SLICE__?.documentToken!==${JSON.stringify(oldDocument)}&&window.__CF_SLICE__?.api.state().localAi.available`,90000);
    await requireController('exact new-document controller before explicit resume',oldDocument);
    await openStorage();need(receipt.interceptions.length===pauseRequests,'Reload resumed model download without explicit action');
    const reopened=await evaluate(inventoryExpression);need(reopened.totalBytes===partial.totalBytes&&reopened.attempts[0]?.name===partial.attempts[0].name,'Reload lost or replaced persisted prefix');
    await click('#notificationpanel [data-ai-act="install"]','Resume same browser model attempt');
    const installStart=performance.now(),deadline=installStart+900000;let lastProgress=0;
    while(true){
      const current=await observe('resume-progress');
      if(/Model (failed|invalid|paused|canceled)/.test(current.text))throw Error('Actual model install stopped: '+current.text);
      if(/Model ready/.test(current.text)&&!await evaluate(`!!document.querySelector('#notificationpanel [data-ai-act="stop-download"]')`))break;
      need(performance.now()<deadline,'Full local-byte install exceeded one 15-minute attempt');
      if(performance.now()-lastProgress>15000){console.log(JSON.stringify({phase:'installing',elapsedMs:Math.round(performance.now()-installStart),text:current.text.slice(-500)}));lastProgress=performance.now();}
      await pause(1000);
    }
    receipt.installMs=performance.now()-installStart;
    const installed=await evaluate(inventoryExpression);receipt.installed=installed;await write('installed-opfs.json',installed);
    need(installed.totalBytes===model.totalBytes&&installed.attempts.length===1&&installed.attempts[0].name===partial.attempts[0].name
      &&installed.markers.some(row=>row.name.startsWith('ready-')),'Actual full install did not retain all pinned chunks in the same attempt');
    need(receipt.interceptions.slice(pauseRequests).some(row=>row.range&&Number(row.range.slice(6,-1))>0),'Resume did not make a real nonzero Range request');
    receipt.modelRequestOwners=Object.fromEntries(['page','service_worker','worker','unknown'].map(type=>[type,receipt.interceptions.filter(row=>row.action==='loopback-byte-mirror'&&row.owner.type===type).length]));
    await screenshot('03-full-model-installed.png');
    // Read/hash every exact precache response, including the AI runtime closure.
    // Models remain in OPFS; neither external HF URLs nor mirror paths may enter CacheStorage.
    const cacheRead=`(async()=>{const expected=${JSON.stringify(pwa.assets)},rows=[];for(const name of await caches.keys()){
      const cache=await caches.open(name);for(const request of await cache.keys()){
        const url=new URL(request.url),response=await cache.match(request),bytes=await response.arrayBuffer();
        if(bytes.byteLength>128*1024*1024)throw Error('Oversized cache response');
        rows.push({cache:name,url:request.url,path:url.pathname,status:response.status,bytes:bytes.byteLength,
          sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('')});
      }}return {rows,controlled:!!navigator.serviceWorker.controller,origin:location.origin};})()`;
    const cache=await evaluate(cacheRead);receipt.cache=cache;await write('verified-cache.json',cache);
    need(cache.controlled&&cache.origin===origin,'Static package is not service-worker controlled');
    for(const asset of pwa.assets){const rows=cache.rows.filter(row=>row.cache==='cf-v2-build-'+pwa.buildId&&row.path===asset.path);
      need(rows.length===1&&rows[0].status===200&&rows[0].sha256===asset.sha256,'Exact cached asset missing/changed: '+asset.path);}
    need(cache.rows.every(row=>new URL(row.url).origin===origin&&!row.path.includes('__cf_pinned_model')
      &&(pwa.assets.some(asset=>asset.path===row.path)||row.path.startsWith('/__cf_pwa_complete__/')||row.path.startsWith('/__cf_pwa_control__/'))),
      'Uninventoried or model bytes entered CacheStorage');
    receipt.cachePayloadBytes=cache.rows.reduce((sum,row)=>sum+row.bytes,0);
    need(receipt.cachePayloadBytes<128*1024*1024,'One current static cache exceeded app admission');
    const beforeOfflineRequests=receipt.interceptions.length,installedDocument=(await observe('installed')).documentToken;
    offline=true;
    for(const sid of allSessions)await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},sid);
    receipt.staticRequests=server.requests.map(row=>({...row}));
    await server.close();receipt.cleanup.staticServerClosedBeforeOffline=true;server=null;
    receipt.mirrorCleanup=await mirror.close();receipt.cleanup.mirrorClosedBeforeOffline=true;
    need(receipt.mirrorCleanup.sourceStatsUnchanged&&!receipt.mirrorCleanup.requestOverflow,'Mirror source/ledger failed at offline boundary');
    await cdp.send('Page.reload',{ignoreCache:false},sessionId);
    await until('offline package and optional runtime boot',`window.__CF_SLICE__?.documentToken!==${JSON.stringify(installedDocument)}&&window.__CF_SLICE__?.api.state().localAi.available&&!!navigator.serviceWorker.controller`,120000);
    await requireController('exact offline new-document controller before verify',installedDocument);
    await openStorage();need(receipt.interceptions.length===beforeOfflineRequests,'Offline reload attempted model download');
    await click('#notificationpanel [data-ai-act="verify"]','Verify installed model with origin servers offline');
    const verifyStart=performance.now();
    await until('native offline model verification',`(()=>{const t=document.querySelector('#notificationpanel [data-local-ai]')?.textContent??'';if(/Model (invalid|failed|paused|canceled)/.test(t))throw Error(t);return /Model ready/.test(t)&&!document.querySelector('#notificationpanel [data-ai-act="stop-download"]');})()`,900000);
    receipt.offlineVerifyMs=performance.now()-verifyStart;
    await observe('offline-full-model-verified');await screenshot('04-offline-model-verified.png');
    need(receipt.interceptions.length===beforeOfflineRequests,'Offline verification fetched model bytes');
    // Use the measured production owner, transpiled without logic changes, only
    // as a detached read-only diagnostic to access its native openFile API. Normal
    // UI above performed install/pause/resume/verify; no probe installed anything.
    const {shaModule,deliveryModule,shaImport}=diagnostic;
    receipt.readOnlyOwner={shaSource:hash(shaModule),deliverySource:hash(deliveryModule),purpose:'Actual production verify/openFile API on existing native OPFS; no storage injection or model download'};
    await evaluate(`(()=>{window.__cfModelReadback={phase:'verifying'};void(async()=>{let shaUrl,ownerUrl;try{
      shaUrl=URL.createObjectURL(new Blob([${JSON.stringify(shaModule)}],{type:'text/javascript'}));
      ownerUrl=URL.createObjectURL(new Blob([${JSON.stringify(deliveryModule)}.replace(${JSON.stringify(shaImport)},JSON.stringify(shaUrl))],{type:'text/javascript'}));
      const {createLocalModelDeliveryV1}=await import(ownerUrl),owner=createLocalModelDeliveryV1({manifest:${JSON.stringify(model)},onStatus:s=>{window.__cfModelReadback={phase:'verifying',status:s};}});
      const status=await owner.verify();if(!status.ready)throw Error('Read-only owner refused installed model');const files=[];
      const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
      for(const file of owner.manifest.files){const blob=await owner.openFile(file.path);files.push({path:file.path,bytes:blob.size,
        headSha256:await digest(blob.slice(0,Math.min(512,blob.size))),tailSha256:await digest(blob.slice(Math.max(0,blob.size-512))),
        shiftedHeadSha256:await digest(blob.slice(1,Math.min(513,blob.size)))});}
      window.__cfModelReadback={phase:'complete',status,files};
      }catch(e){window.__cfModelReadback={phase:'failed',error:String(e.stack??e)};}finally{if(ownerUrl)URL.revokeObjectURL(ownerUrl);if(shaUrl)URL.revokeObjectURL(shaUrl);}})();return true;})()`);
    await until('read-only native Blob access',`(()=>{const r=window.__cfModelReadback;if(r?.phase==='failed')throw Error(r.error);return r?.phase==='complete'?r:null;})()`,900000);
    const readback=await evaluate('window.__cfModelReadback');receipt.readback=readback;await write('native-blob-readback.json',readback);
    assessNativeReadback(readback,mirror.files);
    const wrong=structuredClone(readback),mutantIndex=wrong.files.findIndex(row=>row.path.endsWith('.manifest.json'));
    need(mutantIndex>=0,'No pinned JSON Blob available for shifted-slice control');
    wrong.files[mutantIndex].headSha256=wrong.files[mutantIndex].shiftedHeadSha256;
    let rejected=false;try{assessNativeReadback(wrong,mirror.files);}catch{rejected=true;}
    need(rejected&&wrong.files[mutantIndex].headSha256!==readback.files[mutantIndex].headSha256,'Same acceptor failed to reject actual shifted native Blob slice');
    assessNativeReadback(readback,mirror.files);receipt.shiftedBlobSliceRejected=true;
    // Exercise the real worker message channel through its unchanged pre-GPU
    // guard. Dedicated-worker debugger attachment is neither needed nor trusted.
    await evaluate(`(()=>{window.__cfOfflineModule={messages:[],error:null};const worker=new Worker('/__local_ai/stage-worker.mjs',{type:'module',name:'cf-module-only-offline'});window.__cfOfflineModuleWorker=worker;
      worker.onmessage=e=>window.__cfOfflineModule.messages.push(e.data);worker.onerror=e=>{window.__cfOfflineModule.error={type:e.type,message:typeof e.message==='string'?e.message:null};};worker.postMessage({profile:'intentional-invalid-profile-for-module-proof'});return true;})()`);
    receipt.moduleOnlyWorker=await until('actual offline module guard reply',`(()=>{const r=window.__cfOfflineModule;if(r?.error)throw Error(JSON.stringify(r.error));return r?.messages.length?r:null;})()`,45000);
    assessOfflineWorkerReply(receipt.moduleOnlyWorker.messages);
    await evaluate('window.__cfOfflineModuleWorker.terminate();delete window.__cfOfflineModuleWorker;true');
    need(receipt.interceptions.length===beforeOfflineRequests,'Module-only offline load requested model bytes');
    if(landfall)await runOfflineLandfallProof({evaluate,until,click,screenshot,cdp,sessionId,receipt,output,
      modelRequests:()=>receipt.interceptions.length,
      workerEvidence:()=>({requests:receipt.network.filter(row=>new URL(row.url).pathname==='/__local_ai/stage-worker.mjs'),
        targets:receipt.workerTargetEvents.filter(event=>event.params?.targetInfo?.type==='worker'&&event.params.targetInfo.url.includes('/__local_ai/stage-worker.mjs'))})});
    need(receipt.browserEvents.every(event=>event.method!=='Runtime.exceptionThrown'&&event.method!=='Inspector.targetCrashed'),'Native browser exception or crash');
    receipt.finalOpfs=await evaluate(inventoryExpression);
    need(receipt.finalOpfs.totalBytes===model.totalBytes&&receipt.finalOpfs.attempts[0].name===partial.attempts[0].name,'Offline access changed retained model storage');
    receipt.status='PASS';
  }catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
  finally{
    if(receipt.status!=='PASS'&&cdp&&sessionId)try{
      const image=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId),bytes=Buffer.from(image.data,'base64');
      await fs.writeFile(path.join(output,'failure.png'),bytes,{flag:'wx'});receipt.failureScreenshot={bytes:bytes.length,sha256:hash(bytes)};
      const failed=await cdp.send('Runtime.evaluate',{expression:`({text:document.querySelector('#notificationpanel')?.textContent,storageOpen:document.querySelector('[data-ai-model-storage]')?.open,readback:window.__cfModelReadback})`,returnByValue:true},sessionId);
      receipt.failureUi=failed.result?.value??failed.exceptionDetails??null;
    }catch(error){receipt.failureCaptureError=String(error);}
    try{await Promise.all([...pending]);if(fatal)throw fatal;}catch(error){receipt.eventError=String(error);receipt.status='FAIL';process.exitCode=1;}
    if(mirror)receipt.mirrorRequests=mirror.requests.map(row=>({...row}));
    if(server)receipt.staticRequests=server.requests.map(row=>({...row}));
    try{if(targetId){await cdp.send('Target.closeTarget',{targetId});receipt.cleanup.targetClosed=true;}}catch(error){receipt.cleanup.targetError=String(error);receipt.status='FAIL';process.exitCode=1;}
    try{if(cdp){await cdp.close();receipt.cleanup.browserAndOwnedProfileRemoved=true;}}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
    try{if(server){await server.close();receipt.cleanup.serverClosed=true;}}catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
    try{if(mirror&&!receipt.cleanup.mirrorClosedBeforeOffline){receipt.mirrorCleanup=await mirror.close();receipt.cleanup.mirrorClosed=true;
      need(receipt.mirrorCleanup.sourceStatsUnchanged&&!receipt.mirrorCleanup.requestOverflow,'Mirror source/ledger failed during cleanup');}}catch(error){receipt.cleanup.mirrorError=String(error);receipt.status='FAIL';process.exitCode=1;}
    try{receipt.finalPackVerification=await verifyMobilePack({directory:pack,expectedManifestSha256:sha256});}catch(error){receipt.packChanged=String(error);receipt.status='FAIL';process.exitCode=1;}
    receipt.sourceIntegrity=await recheckSourceFiles(receipt.sources);
    if(!receipt.sourceIntegrity.unchanged){receipt.status='FAIL';process.exitCode=1;}
    try{release?.();receipt.cleanup.workspaceReleased=Boolean(release);}catch(error){receipt.cleanup.workspaceError=String(error);receipt.status='FAIL';process.exitCode=1;}
    receipt.finishedAt=new Date().toISOString();await write('result.json',receipt);
    console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,modelBytes:receipt.finalOpfs?.totalBytes??null,result:path.join(output,'result.json')}));
  }
  return receipt;
}
async function main(){const options={};for(const argument of process.argv.slice(2)){if(argument==='--landfall'&&!options.landfall){options.landfall=true;continue;}const match=/^--(pack|sha256|output)=(.+)$/.exec(argument);need(match&&!Object.hasOwn(options,match[1]),'Usage: run-mobile-model-delivery.mjs --pack=EXACT_STATIC_PACK --sha256=EXTERNAL_MANIFEST_SHA --output=NEW_AUDIT_DIRECTORY [--landfall]');options[match[1]]=match[2];}need(options.pack&&options.sha256&&options.output,'All three arguments required');await runMobileModelDelivery(options);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
