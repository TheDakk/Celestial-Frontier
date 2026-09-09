/** One no-inference native boot/reload of the real game through the same
 * frozen Vite server used by local generation. No model scan, download,
 * inference, error filtering, dependency mutation or WebSocket replacement. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {createFrozenGameViteServer,FROZEN_VITE_CLIENT_PIN} from './frozen-preview-client.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const args=process.argv.slice(2);
need(args.length===1&&args[0].startsWith('--output='),'Usage: run-frozen-preview-boot.mjs --output=NEW_AUDITS_DIRECTORY');
const output=path.resolve(args[0].slice(9));
need(output.startsWith(path.join(root,'audits')+path.sep),'A new repository audit directory is required');
await fs.mkdir(output,{recursive:false});
const json=(name,value)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const receipt={schema:'cf.frozen-preview-native-boot.v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'Real game boot, trusted Skip training and reload through frozen local Vite; no AI model access or inference',
  sources:[],observations:[],browserEvents:[],targetEvents:[],requests:[],webSockets:[],clients:[],screenshots:[],cleanup:{}};
await json('start.json',receipt);
let releaseWorkspace,vite,server,cdp,targetId,sessionId,eventOverflow=false;
const sourceNames=[
  'tools/local-image-generation/run-frozen-preview-boot.mjs',
  'tools/local-image-generation/frozen-preview-client.mjs','tools/local-image-generation/game-preview-server.mjs',
  'tools/local-image-generation/source-integrity.mjs',FROZEN_VITE_CLIENT_PIN.source,
  'port/v2/node_modules/vite/package.json','port/v2/package-lock.json',
  'port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs','port/v2/tools/workspacelock.mjs',
  'port/v2/apps/game/index.html','port/v2/apps/game/vite.config.ts','port/v2/apps/game/pwa-build.ts',
  'port/v2/apps/game/src/main.ts','port/v2/apps/game/src/training.ts','port/v2/apps/game/src/release-content.ts',
  'port/v2/apps/game/src/local-ai-game.ts','port/v2/apps/game/src/local-ai-runtime.ts',
  'port/v2/apps/game/src/local-model-delivery.ts','port/v2/apps/game/src/local-model-manifest.ts',
];
const append=(rows,value,limit=2000)=>{if(rows.length>=limit){eventOverflow=true;return;}rows.push(value);};
const failures=[];
try{
  releaseWorkspace=acquireWorkspaceLock('frozen preview native boot without inference');
  for(const name of sourceNames){const file=path.join(root,name),bytes=await fs.readFile(file);
    receipt.sources.push({path:name,file,bytes:bytes.length,sha256:sha(bytes)});}
  await json('source-before.json',receipt.sources);
  for(const name of ['run-frozen-preview-boot.mjs','frozen-preview-client.mjs','game-preview-server.mjs'])
    await fs.copyFile(path.join(root,'tools/local-image-generation',name),path.join(output,name),fs.constants.COPYFILE_EXCL);
  await fs.copyFile(path.join(root,FROZEN_VITE_CLIENT_PIN.source),path.join(output,'installed-vite-client.mjs'),fs.constants.COPYFILE_EXCL);
  vite=await createFrozenGameViteServer();
  server=http.createServer((request,response)=>{
    response.setHeader('Cross-Origin-Opener-Policy','same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy','require-corp');
    response.setHeader('Cross-Origin-Resource-Policy','same-origin');
    response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Cache-Control','no-store');
    vite.middlewares(request,response,()=>{response.writeHead(404);response.end();});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  receipt.url='http://127.0.0.1:'+server.address().port+'/';
  const clientResponses=[];
  cdp=await openChromiumCdp({label:'CF frozen preview no-inference boot',userDataPrefix:'cf-frozen-preview-boot-',commandTimeoutMs:45000,
    onEvent:event=>{
      if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method))append(receipt.browserEvents,event);
      if(['Target.targetCreated','Target.targetInfoChanged','Target.targetDestroyed','Target.targetCrashed'].includes(event.method))append(receipt.targetEvents,event);
      if(event.method==='Network.webSocketCreated')append(receipt.webSockets,event);
      if(event.method==='Network.requestWillBeSent')append(receipt.requests,{requestId:event.params.requestId,
        url:event.params.request.url,method:event.params.request.method,type:event.params.type,sessionId:event.sessionId});
      if(event.method==='Network.responseReceived'&&event.params.response.url===receipt.url+'@vite/client')
        append(clientResponses,{requestId:event.params.requestId,response:event.params.response,sessionId:event.sessionId});
    }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  await cdp.send('Target.setDiscoverTargets',{discover:true});
  ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
  ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
  for(const domain of ['Runtime','Log','Network','Page'])await cdp.send(domain+'.enable',{},sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
  const evaluate=async expression=>{const response=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
    if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);
    return response.result.value;};
  async function until(label,expression,timeout=30000){const deadline=performance.now()+timeout;let value;
    do{value=await evaluate(expression);if(value)return value;await sleep(100);}while(performance.now()<deadline);
    throw Error('Timed out '+label+': '+JSON.stringify(value));}
  const state=`(()=>{const h=window.__CF_SLICE__;if(!h?.api)return null;const s=h.api.state();return {
    documentToken:h.documentToken,mode:s.mode,star:s.star,planet:s.planet,tutActive:s.tutActive,tutDone:s.tutDone,
    trainingCheckpointWriteHeld:s.trainingCheckpointWriteHeld,savedRouteWriteHeld:s.savedRouteWriteHeld,
    persistence:s.persistence,renderedScene:s.renderedScene,tickerTicks:s.tickerTicks,localAi:s.localAi,
    canvasCount:document.querySelectorAll('canvas').length,crossOriginIsolated,atMs:performance.now()};})()`;
  async function observe(label){const value=await evaluate(state);need(value,'Missing live game state');
    receipt.observations.push({label,...value});return value;}
  async function screenshot(file,scope){const result=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
    const bytes=Buffer.from(result.data,'base64');await fs.writeFile(path.join(output,file),bytes,{flag:'wx'});
    receipt.screenshots.push({file,scope,bytes:bytes.length,sha256:sha(bytes)});}
  async function captureClient(label){need(clientResponses.length>0,'Browser did not receive the actual Vite client');
    const response=clientResponses.at(-1);need(response.response.status===200,'Actual Vite client was not served successfully');
    const result=await cdp.send('Network.getResponseBody',{requestId:response.requestId},sessionId);
    const bytes=Buffer.from(result.body,result.base64Encoded?'base64':'utf8'),code=bytes.toString('utf8');
    need(code.includes('Celestial Frontier frozen preview: no HMR connection is started.')
      &&!code.includes('transport.connect(createHMRHandler(handleMessage));'),'Browser received an eager or unrecognized client');
    const file=label+'-served-vite-client.mjs';await fs.writeFile(path.join(output,file),bytes,{flag:'wx'});
    receipt.clients.push({label,file,bytes:bytes.length,sha256:sha(bytes),response});}
  await cdp.send('Page.navigate',{url:receipt.url},sessionId);
  await until('live normal game training',`(()=>{const h=window.__CF_SLICE__;return h?.api&&h.api.state().tutActive;})()`,60000);
  const boot=await observe('fresh-training');need(boot.crossOriginIsolated===true&&boot.canvasCount>0,'Real isolated game renderer did not boot');
  await captureClient('boot');await screenshot('01-training.png','Normal game training; transport scope only');
  // Native input must reach the visible product control, not a game-state API.
  const geometry=await evaluate(`(()=>{const candidates=Array.from(document.querySelectorAll('[data-sel="tutskip"]')).filter(e=>{
    const r=e.getBoundingClientRect();if(e.disabled||r.width<=0||r.height<=0)return false;
    for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;});
    if(candidates.length!==1)return {count:candidates.length};const e=candidates[0],r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    document.addEventListener('click',function handler(event){if(!(event.target instanceof Element)||!event.target.closest('[data-sel="tutskip"]'))return;
      document.removeEventListener('click',handler,true);window.__cfFrozenBootClick={trusted:event.isTrusted,x:event.clientX,y:event.clientY};},true);
    return {count:1,x,y,width:r.width,height:r.height,inViewport:x>=0&&y>=0&&x<innerWidth&&y<innerHeight,hit:e.contains(document.elementFromPoint(x,y))};})()`);
  receipt.skipGeometry=geometry;need(geometry.count===1&&geometry.inViewport&&geometry.hit,'Skip training is not a unique visible hit target');
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
  receipt.skipClick=await until('trusted Skip training','window.__cfFrozenBootClick',5000);
  need(receipt.skipClick.trusted===true,'Skip training did not receive trusted native input');
  const ready=`(()=>{const h=window.__CF_SLICE__;if(!h?.api)return false;const s=h.api.state();return !s.tutActive&&s.tutDone
    &&!s.trainingCheckpointWriteHeld&&!s.savedRouteWriteHeld&&s.persistence.ready&&!s.persistence.mutationBlocked
    &&s.mode==='system'&&s.star===424242;})()`;
  await until('durable Sol after Skip training',ready);
  const sol=await observe('durable-Sol');need(sol.localAi.available===false&&sol.localAi.jobs.length===0,'Plain boot unexpectedly enabled or queued AI');
  await cdp.send('Page.reload',{ignoreCache:true},sessionId);
  await until('new document restores Sol',`(()=>{const h=window.__CF_SLICE__;return h?.documentToken!==${JSON.stringify(sol.documentToken)}&&${ready};})()`,60000);
  const reloaded=await observe('reloaded-Sol');need(reloaded.documentToken!==sol.documentToken,'Reload reused the old document');
  // Observe a continuing renderer and an elapsed interval after the new document
  // is ready. The previous socket defect fired during initial client startup.
  await until('reloaded renderer remains answerable',`(()=>{const s=window.__CF_SLICE__.api.state();return s.tickerTicks>=${reloaded.tickerTicks}+2
    &&performance.now()>=${reloaded.atMs}+1000;})()`,10000);
  const settled=await observe('reloaded-Sol-settled');need(settled.localAi.available===false&&settled.localAi.jobs.length===0,'Reload queued AI');
  need(clientResponses.length===2,'Expected one actual Vite client response per document');
  await captureClient('reload');await screenshot('02-reloaded-Sol.png','Normal game restores Sol after reload; transport scope only');
  receipt.checks={realGameRendered:true,trustedSkip:true,durableSolAfterReload:true,newDocument:true,rendererAdvanced:true,
    actualServedClientCapturedTwice:true,noWebSocketCreated:receipt.webSockets.length===0,
    noModelOrInferenceRequests:!receipt.requests.some(row=>row.url.includes('/__local_ai/')||/\.onnx(?:[?.]|$)|\.data(?:[?]|$)/.test(row.url)),
    noRuntimeExceptionOrCrash:!receipt.browserEvents.some(event=>['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(event.method))
      &&!receipt.targetEvents.some(event=>event.method==='Target.targetCrashed'),evidenceComplete:!eventOverflow};
  for(const [name,passed] of Object.entries(receipt.checks))need(passed,'Failed '+name);
  receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;
  if(cdp&&sessionId){try{const value=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
    await fs.writeFile(path.join(output,'failure.png'),Buffer.from(value.data,'base64'),{flag:'wx'});}catch(capture){receipt.failureScreenshotError=String(capture);}}}
finally{
  for(const [label,close] of [
    ['target',async()=>{if(targetId)await cdp.send('Target.closeTarget',{targetId});}],
    ['browser',async()=>{if(cdp)await cdp.close();}],
    ['server',async()=>{if(server)await new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();});}],
    ['vite',async()=>{if(vite)await vite.close();}],
  ]){try{await close();receipt.cleanup[label+'Closed']=true;}catch(error){failures.push({label,error:String(error)});}}
  receipt.sourceIntegrity=await recheckSourceFiles(receipt.sources);
  try{releaseWorkspace?.();receipt.cleanup.workspaceReleased=Boolean(releaseWorkspace);}catch(error){failures.push({label:'workspace',error:String(error)});}
  receipt.cleanup.failures=failures;receipt.eventOverflow=eventOverflow;
  if(failures.length||!receipt.sourceIntegrity.unchanged||eventOverflow){receipt.status='FAIL';process.exitCode=1;}
  receipt.finishedAt=new Date().toISOString();await json('result.json',receipt);
  console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,webSockets:receipt.webSockets.length,
    clientResponses:receipt.clients.length,observations:receipt.observations.length,result:path.join(output,'result.json')}));
}
