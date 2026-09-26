/** Run once under the shared foreground lock, outside macOS Seatbelt.
 * Native OPFS/HTTP fixtures only; never serves or requests actual model weights. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
import {openChromiumCdp} from '../../../port/v2/tools/browsercdp.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const sha=value=>createHash('sha256').update(value).digest('hex');
const need=(condition,message)=>{if(!condition)throw Error(message);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const writeJson=(name,value)=>fs.writeFile(path.join(here,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const receipt={schema:'cf.local-model-delivery-native.v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'Actual native browser OPFS + HTTP Range + Blob URL; tiny synthetic bytes only',
  qualityAccepted:false,deviceQualified:false,actualModelDownloaded:false,sources:[],virtualSources:[],
  observations:[],requests:[],clicks:[],screenshots:[],browserEvents:[],cleanup:{}};
await writeJson('start.json',receipt);
const C=1048576;
const fixtureBytes=length=>Buffer.from(Array.from({length},(_,index)=>(index*37+(index>>>7)*13+19)&255));
const payloads={good:{'weights.bin':fixtureBytes(2*C+71),'tokenizer.json':fixtureBytes(113)},corrupt:{'broken.bin':fixtureBytes(4099)}};
const manifests=Object.fromEntries(Object.entries(payloads).map(([kind,files])=>[kind,{
  schema:'cf.local-model-delivery-manifest.v1',modelId:'synthetic/'+kind,revision:'1'.repeat(40),sourceManifestSha256:sha('CF native synthetic '+kind),
  totalBytes:Object.values(files).reduce((sum,bytes)=>sum+bytes.length,0),
  files:Object.entries(files).map(([file,bytes])=>({path:file,bytes:bytes.length,sha256:sha(bytes)}))
}]));
let server,cdp,bundle,targetId,sessionId,goodMode='hold',corruptMode='corrupt';
const sockets=new Set(),held=new Set(),sourceMap=new Map();
const remember=async file=>{
  const absolute=path.resolve(file),relative=path.relative(root,absolute);
  need(!relative.startsWith('..')&&!path.isAbsolute(relative),'External source refused');
  const bytes=await fs.readFile(absolute),value={file:relative,bytes:bytes.length,sha256:sha(bytes)};
  if(sourceMap.has(absolute))need(sourceMap.get(absolute).sha256===value.sha256,'Source changed during build');
  else sourceMap.set(absolute,value);
};
try{
  for(const file of ['run.mjs','browser-entry.mjs','index.html'])await remember(path.join(here,file));
  for(const file of ['port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs','port/v2/package-lock.json'])await remember(path.join(root,file));
  await writeJson('synthetic-manifests.json',manifests);
  receipt.syntheticBytes=Object.values(manifests).reduce((sum,value)=>sum+value.totalBytes,0);
  bundle=await rolldown({input:path.join(here,'browser-entry.mjs'),platform:'browser',plugins:[{
    name:'delivery-native-source-receipt',async transform(code,id){
      if(path.isAbsolute(id))await remember(id);
      else {need(id==='\0rolldown/runtime.js','Unknown virtual module');receipt.virtualSources.push({id,bytes:Buffer.byteLength(code),sha256:sha(code)});}
      return null;
    },generateBundle(){for(const id of this.getModuleIds())need(!this.getModuleInfo(id)?.isExternal,'External module refused: '+id);}
  }]});
  const generated=await bundle.generate({format:'es',codeSplitting:false});
  need(generated.output.length===1&&generated.output[0].type==='chunk','Expected one isolated delivery bundle');
  const code=generated.output[0].code,html=await fs.readFile(path.join(here,'index.html'));
  await fs.writeFile(path.join(here,'bundle.mjs'),code,{flag:'wx'});receipt.bundle={file:'bundle.mjs',bytes:Buffer.byteLength(code),sha256:sha(code)};
  await bundle.close();bundle=null;
  server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost'),row={path:url.pathname,search:url.search,range:request.headers.range??null,
      status:null,finished:false,closedBeforeFinish:false};receipt.requests.push(row);
    response.setHeader('Cache-Control','no-store');
    response.on('finish',()=>{row.finished=true;});response.on('close',()=>{row.closedBeforeFinish=!row.finished;held.delete(response);});
    const send=(status,type,body)=>{row.status=status;response.writeHead(status,{'Content-Type':type});response.end(body);};
    if(receipt.requests.length>80||request.method!=='GET'){send(400,'text/plain','Unexpected request');return;}
    if(url.pathname==='/'){send(200,'text/html',html);return;}
    if(url.pathname==='/bundle.mjs'){send(200,'text/javascript',code);return;}
    if(url.pathname==='/favicon.ico'){send(204,'text/plain','');return;}
    if(url.pathname==='/fixture.json'){
      const fixture=manifests[url.searchParams.get('kind')];send(fixture?200:404,'application/json',JSON.stringify(fixture??{}));return;
    }
    const match=/^\/model\/(good|corrupt)\/([A-Za-z.]+)$/.exec(url.pathname);
    if(!match){send(404,'text/plain','Unexpected audit route');return;}
    const [,kind,file]=match,original=payloads[kind][file];if(!original){send(404,'text/plain','Unexpected fixture path');return;}
    let start=0;
    if(row.range){const m=/^bytes=(\d+)-$/.exec(row.range);if(!m){send(416,'text/plain','Bad Range');return;}start=Number(m[1]);}
    if(start>=original.length){send(416,'text/plain','Range exceeds fixture');return;}
    row.fixture=kind;row.file=file;row.start=start;row.expectedBytes=original.length-start;
    const headers={'Content-Type':'application/octet-stream','Content-Length':original.length-start,'Accept-Ranges':'bytes'};
    if(start)headers['Content-Range']=`bytes ${start}-${original.length-1}/${original.length}`;
    row.status=start?206:200;response.writeHead(row.status,headers);
    if(kind==='good'&&file==='weights.bin'&&goodMode==='hold'&&start===0){
      row.heldAfterBytes=C;held.add(response);response.write(original.subarray(0,C));return;
    }
    if(kind==='corrupt'&&corruptMode==='corrupt'){
      const wrong=Buffer.from(original);wrong[57]^=1;row.control='one-byte-corruption';response.end(wrong.subarray(start));return;
    }
    response.end(original.subarray(start));
  });
  server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;receipt.origin=origin;
  cdp=await openChromiumCdp({label:'CF tiny-file local model OPFS audit',userDataPrefix:'cf-model-delivery-',commandTimeoutMs:15000,
    onEvent:event=>{if(['Runtime.exceptionThrown','Inspector.targetCrashed','Log.entryAdded'].includes(event.method))receipt.browserEvents.push(event);}});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
  ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
  await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Page.enable',{},sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
  const evaluate=async expression=>{
    const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
    if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;
  };
  async function until(label,expression,timeout=10000){
    const end=performance.now()+timeout;let value;
    do{value=await evaluate(expression);if(value)return value;await pause(50);}while(performance.now()<end);
    throw Error(`Timed out ${label}: ${JSON.stringify(value)}`);
  }
  async function click(id){
    const geometry=await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e)return null;
      e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      let visible=r.width>0&&r.height>0;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)visible=false;}
      return {id:e.id,x,y,width:r.width,height:r.height,visible,disabled:e.disabled,hit:e.contains(document.elementFromPoint(x,y))};})()`);
    need(geometry?.visible&&geometry.hit&&!geometry.disabled,'Click target not actually visible/hit: '+id);
    const before=await evaluate('window.deliveryAudit.clicks.length');
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    const event=await until('trusted click '+id,`window.deliveryAudit.clicks[${before}]??null`);
    need(event.trusted&&event.id===id,'Untrusted or wrong control');receipt.clicks.push({geometry,event});
  }
  const modelRequests=()=>receipt.requests.filter(row=>row.path.startsWith('/model/'));
  async function observe(label){
    const sample=await evaluate(`(async()=>({status:window.deliveryAudit.instance.status(),capability:window.deliveryAudit.capability,
      inventory:await window.deliveryAudit.inventory(),states:window.deliveryAudit.states,error:window.deliveryAudit.error,
      ready:window.deliveryAudit.ready,kind:window.deliveryAudit.kind,operationPending:window.deliveryAudit.operation!==null}))()`);
    receipt.observations.push({label,...sample,modelRequests:structuredClone(modelRequests())});return sample;
  }
  async function screenshot(file){const result=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
    const bytes=Buffer.from(result.data,'base64');await fs.writeFile(path.join(here,file),bytes,{flag:'wx'});
    receipt.screenshots.push({file,bytes:bytes.length,sha256:sha(bytes)});}
  const noReady=sample=>!sample.inventory.some(file=>file.path.endsWith('/ready-'+sample.status.manifestSha256+'.json'));
  const checkReady=sample=>{
    const expected=manifests[sample.kind];need(sample.status.phase==='ready'&&sample.status.ready&&sample.status.verifiedBytes===expected.totalBytes
      &&sample.status.storedBytes===expected.totalBytes&&sample.status.verifiedFiles===expected.files.length,'Ready not fully verified');
    const marker=sample.inventory.find(file=>file.path.endsWith('/ready-'+sample.status.manifestSha256+'.json'));
    need(marker?.json?.attemptId===sample.status.attemptId&&marker.json.manifestSha256===sample.status.manifestSha256,'Committed marker does not match verified attempt');
    need(sample.status.qualityAccepted===false&&sample.status.deviceQualified===false,'Delivery promoted quality/device qualification');
  };
  const checkBlobs=(rows,kind)=>{need(rows.length===manifests[kind].files.length,'Missing openFile result');
    for(let i=0;i<rows.length;i++){const row=rows[i],expected=manifests[kind].files[i];need(row.isBlob&&row.path===expected.path&&row.bytes===expected.bytes
      &&row.blobUrlBytes===expected.bytes&&row.sha256===expected.sha256&&row.blobUrlSha256===expected.sha256,'openFile/Blob URL bytes differ from manifest');}};
  await cdp.send('Page.navigate',{url:origin+'/'},sessionId);
  await until('fixture ready','window.deliveryAudit?.ready===true');
  const initial=await observe('initial-missing');need(initial.status.phase==='missing'&&noReady(initial),'Fresh synthetic origin not missing');
  need(initial.capability.secureContext&&initial.capability.opfs&&initial.capability.webLocks,'Native storage capability missing');
  await click('install');
  await until('one persisted chunk',`window.deliveryAudit.instance.status().phase==='downloading'&&window.deliveryAudit.instance.status().storedBytes===${C}`);
  await click('cancel');await until('canceled terminal',`window.deliveryAudit.operation===null&&window.deliveryAudit.instance.status().phase==='canceled'`);
  const end=performance.now()+3000;while(!modelRequests()[0]?.closedBeforeFinish&&performance.now()<end)await pause(25);
  const canceled=await observe('cancel-after-one-committed-chunk');need(noReady(canceled)&&canceled.status.storedBytes===C
    &&canceled.status.error==='canceled'&&!canceled.status.ready&&modelRequests()[0].closedBeforeFinish,'Cancel did not abort HTTP without readiness');
  await screenshot('01-canceled.png');
  const firstAttempt=canceled.status.attemptId,requestCount=modelRequests().length;
  const partialBoot=await evaluate('window.deliveryAudit.bootId');
  await cdp.send('Page.reload',{ignoreCache:true},sessionId);await until('partial after reload',`window.deliveryAudit?.ready===true&&window.deliveryAudit.bootId!==${JSON.stringify(partialBoot)}`);
  const partial=await observe('reloaded-partial');need(partial.status.phase==='partial'&&partial.status.storedBytes===C
    &&partial.status.attemptId===firstAttempt&&noReady(partial)&&modelRequests().length===requestCount,'Reload did not preserve exact partial without fetching');
  goodMode='good';await click('install');await until('resumed ready',`window.deliveryAudit.operation===null&&window.deliveryAudit.instance.status().phase==='ready'`);
  const installed=await observe('resumed-committed-ready');checkReady(installed);
  const range=modelRequests().find(row=>row.range!==null);need(range?.range===`bytes=${C}-`&&range.status===206&&range.finished,'Resume did not use exact successful HTTP Range');
  need(installed.status.attemptId===firstAttempt,'Resume replaced rather than continued the existing attempt');
  const installedBlobs=await evaluate('window.deliveryAudit.openAll()');checkBlobs(installedBlobs,'good');receipt.installedBlobs=installedBlobs;
  const goodInventory=installed.inventory,readyRequestCount=modelRequests().length;
  const readyBoot=await evaluate('window.deliveryAudit.bootId');
  await cdp.send('Page.reload',{ignoreCache:true},sessionId);await until('ready after reload',`window.deliveryAudit?.ready===true&&window.deliveryAudit.bootId!==${JSON.stringify(readyBoot)}`);
  const reopened=await observe('reloaded-verified-ready');checkReady(reopened);need(modelRequests().length===readyRequestCount,'Ready reload unexpectedly fetched model bytes');
  const reopenedBlobs=await evaluate('window.deliveryAudit.openAll()');checkBlobs(reopenedBlobs,'good');receipt.reopenedBlobs=reopenedBlobs;
  await screenshot('02-reloaded-ready.png');
  await evaluate("window.deliveryAudit.select('corrupt')");await click('install');
  await until('corrupt refused',`window.deliveryAudit.operation===null&&window.deliveryAudit.instance.status().phase==='invalid'`);
  const corrupt=await observe('one-byte-corruption-refused');need(corrupt.status.error==='hash-mismatch'&&!corrupt.status.ready&&noReady(corrupt),'Corrupt fixture published readiness');
  need(corrupt.inventory.some(file=>file.path.endsWith('/'+corrupt.status.attemptId+'/failed.json')),'Corrupt attempt failure marker missing');
  for(const file of goodInventory)need(corrupt.inventory.some(row=>JSON.stringify(row)===JSON.stringify(file)),'Prior verified blob/marker changed');
  let openError=null;try{await evaluate('window.deliveryAudit.openAll()');}catch(error){openError=String(error);}
  need(openError?.includes('model-not-verified-ready'),'Corrupt fixture openFile was not refused');receipt.corruptOpenRefusal=openError;
  await screenshot('03-corrupt-refusal.png');
  const failedAttempt=corrupt.status.attemptId;corruptMode='good';await click('install');
  await until('restored new attempt',`window.deliveryAudit.operation===null&&window.deliveryAudit.instance.status().phase==='ready'`);
  const restored=await observe('restored-response-ready-new-attempt');checkReady(restored);
  need(restored.status.attemptId!==failedAttempt&&restored.inventory.some(file=>file.path.endsWith('/'+failedAttempt+'/failed.json')),'Retry overwrote failed evidence');
  const restoredBlobs=await evaluate('window.deliveryAudit.openAll()');checkBlobs(restoredBlobs,'corrupt');receipt.restoredBlobs=restoredBlobs;
  await evaluate("window.deliveryAudit.select('good')");const original=await observe('original-verified-install-preserved');checkReady(original);
  need(original.status.attemptId===firstAttempt,'Corrupt retry replaced unrelated verified installation');
  receipt.checks={actualOpfs:true,actualWebLocks:true,trustedInstallCancel:true,actualHttpAbort:true,persistedPartialAfterReload:true,
    exactRangeResume:true,allFilesShaVerifiedBeforeReady:true,readyReverifiedAfterReload:true,noNetworkOnReadyReload:true,openFileAndBlobUrlHashes:true,
    corruptHashRefused:true,corruptOpenRefused:true,failedAttemptPreserved:true,restoredRetry:true,priorVerifiedInstallPreserved:true};
  need(receipt.browserEvents.every(event=>event.method!=='Runtime.exceptionThrown'&&event.method!=='Inspector.targetCrashed'),'Unexpected browser exception or crash');
  for(const [file,before]of sourceMap){const bytes=await fs.readFile(file);need(sha(bytes)===before.sha256,'Source changed during native audit: '+before.file);}
  receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{if(targetId){await cdp.send('Target.closeTarget',{targetId});receipt.cleanup.targetClosed=true;}}catch(error){receipt.cleanup.targetError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{if(cdp){await cdp.close();receipt.cleanup.browserClosed=true;}}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
  for(const response of held)response.destroy();
  for(const socket of sockets)socket.destroy();
  try{if(server){await new Promise(resolve=>server.close(resolve));receipt.cleanup.serverClosed=true;}}catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{await bundle?.close();}catch(error){receipt.cleanup.bundleError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.sources=[...sourceMap.values()].sort((a,b)=>a.file.localeCompare(b.file));receipt.finishedAt=new Date().toISOString();
  await writeJson('result.json',receipt);console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,
    observations:receipt.observations.length,requests:receipt.requests.length,clicks:receipt.clicks.length,result:path.join(here,'result.json')}));
}
