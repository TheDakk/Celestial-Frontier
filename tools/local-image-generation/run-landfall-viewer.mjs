/** One real-game local-AI landing observation. Authoring source only; execute
 * after the parent freezes source, under the shared foreground lock and outside
 * macOS Seatbelt. No downloads, synthetic workers, source patches or auto retry. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {createGamePreviewServer} from './game-preview-server.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let output=null;
for(const argument of process.argv.slice(2)){
  if(argument.startsWith('--output=')&&output===null)output=path.resolve(argument.slice(9));
  else throw Error('Usage: run-landfall-viewer.mjs --output=NEW_AUDITS_DIRECTORY');
}
need(output&&output.startsWith(path.join(root,'audits')+path.sep),'A new repository audit directory is required');
await fs.mkdir(output,{recursive:false});
const writeJson=(file,value)=>fs.writeFile(path.join(output,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const receipt={schema:'cf.native-retained-landfall-viewer.v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'UI-only: reuse the unchanged native02 original through the real IDB store; trusted Land/Inspect/fit/pan/close, viewport and reload. No new model execution.',
  qualityAccepted:false,deviceQualified:false,actualModelDownloaded:false,modelExecuted:false,retainedImageFixture:true,
  sources:[],observations:[],clicks:[],screenshots:[],browserEvents:[],targetEvents:[],cleanup:{}};
await writeJson('start.json',receipt);
let preview,cdp,targetId,sessionId,originalJob,releaseWorkspace;
let eventFault=null;
const bindingPath=path.join(root,'audits/AI_GAME_INTEGRATION_20260909/platypus-reference-binding.json');
const sourceNames=[
  'port/v2/apps/game/src/main.ts','port/v2/apps/game/index.html','port/v2/apps/game/vite.config.ts',
  'port/v2/apps/game/src/local-ai-game.ts','port/v2/apps/game/src/local-ai-runtime.ts',
  'port/v2/apps/game/src/landfall-viewer.ts','port/v2/apps/game/src/release-content.ts',
  'port/v2/apps/game/src/ai-landfall-jobs.ts','port/v2/apps/game/src/ai-landfall-originals.ts',
  'port/v2/apps/game/src/local-model-delivery.ts','port/v2/apps/game/src/local-model-sha256.ts',
  'port/v2/apps/game/src/local-model-manifest.ts','port/v2/apps/game/src/landfall-conditioning.ts',
  'port/v2/apps/game/src/world-roster.ts','port/v2/apps/game/src/product-action-coordinator.ts',
  'port/v2/apps/game/src/training.ts','port/v2/apps/game/pwa-build.ts',
  'port/v2/apps/game/src/landfall-appearance-snapshot.ts','port/v2/apps/game/src/earth-layered-recipe.ts',
  'tools/local-image-generation/run-landfall-viewer.mjs','tools/local-image-generation/game-preview-server.mjs',
  'tools/local-image-generation/stage-worker.mjs','tools/local-image-generation/pipeline-math.mjs',
  'tools/local-image-generation/denoiser-shapes.mjs','tools/local-image-generation/gpu-profile.mjs',
  'tools/local-image-generation/q8-block32.mjs','tools/local-image-generation/fetch-model.mjs',
  'tools/local-image-generation/source-integrity.mjs','tools/local-image-generation/model-manifest.json',
  'tools/local-image-generation/package-lock.json','port/v2/package-lock.json',
  'port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs','port/v2/tools/workspacelock.mjs',
  'audits/AI_GAME_INTEGRATION_20260909/platypus-reference-binding.json',
];
const collectSource=async relative=>{const file=path.join(root,relative),bytes=await fs.readFile(file);
  receipt.sources.push({path:relative,file,bytes:bytes.length,sha256:sha(bytes)});};
try{
  releaseWorkspace=acquireWorkspaceLock('native retained painting viewer');
  receipt.workspaceLockAcquired=true;
  for(const name of sourceNames)await collectSource(name);
  const binding=JSON.parse(await fs.readFile(bindingPath,'utf8'));
  need(binding.binding?.name==='Platypus'&&typeof binding.binding.subjectIdentityKey==='string'
    &&binding.qualityAccepted===false&&binding.image?.path==='audits/AI_GAME_INTEGRATION_20260909/platypus-reference.png',
    'Expected retained Platypus diagnostic reference binding');
  const reference=path.join(root,binding.image.path),referenceBytes=await fs.readFile(reference);
  need(referenceBytes.length===binding.image.bytes&&sha(referenceBytes)===binding.image.sha256,'Reference binding image changed');
  await collectSource(binding.image.path);receipt.referenceBinding=binding;
  await writeJson('source-before.json',receipt.sources);
  // This server hashes the already installed cache and pinned derivative before
  // listening. No fetch-model download API or synthetic seam is used here.
  preview=await createGamePreviewServer({mode:'evidence',reference,
    referenceIdentity:binding.binding.subjectIdentityKey,q8Block32:'auto'});
  need(preview.config.fixture===false&&preview.config.qualityAccepted===false
    &&preview.config.modelSource==='verified-installed-developer-cache'&&preview.config.q8Block32===true,
    'Expected verified installed native block32 runtime');
  need(preview.config.reference.sha256===binding.image.sha256
    &&preview.config.reference.speciesVisualKey===binding.binding.subjectIdentityKey,'Served reference binding mismatch');
  receipt.preview={url:preview.url,config:preview.config,modelFiles:preview.modelFiles,runtimeFiles:preview.runtimeFiles};
  await writeJson('verified-preview.json',receipt.preview);
  const inferenceTargets=new Set();

  cdp=await openChromiumCdp({label:'CF native retained painting viewer',userDataPrefix:'cf-game-local-ai-',commandTimeoutMs:45000,
    onEvent:event=>{
      if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method)){
        if(receipt.browserEvents.length>=300){eventFault??=Error('Browser event evidence overflow');return;}receipt.browserEvents.push(event);
      }
      if(['Target.targetCreated','Target.targetInfoChanged','Target.targetDestroyed','Target.targetCrashed'].includes(event.method)){
        if(receipt.targetEvents.length>=300){eventFault??=Error('Target event evidence overflow');return;}receipt.targetEvents.push(event);
        const info=event.params?.targetInfo;if(info?.type==='worker'&&info.url?.includes('/__local_ai/stage-worker.mjs'))inferenceTargets.add(info.targetId);
      }
    }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  await cdp.send('Target.setDiscoverTargets',{discover:true});
  ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
  ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
  await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Log.enable',{},sessionId);await cdp.send('Page.enable',{},sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
  const evaluate=async expression=>{
    if(eventFault)throw eventFault;
    const value=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
    if(eventFault)throw eventFault;
    if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description??value.exceptionDetails.text);return value.result.value;
  };
  async function until(label,expression,timeout=15000){
    const deadline=performance.now()+timeout;let value;
    do{value=await evaluate(expression);if(value)return value;await sleep(100);}while(performance.now()<deadline);
    throw Error(`Timed out ${label}: ${JSON.stringify(value)}`);
  }
  const stateExpression=`(()=>{const handle=window.__CF_SLICE__;if(!handle)return null;const s=handle.api.state();return {
    documentToken:handle.documentToken,mode:s.mode,star:s.star,planet:s.planet,planetOrdinal:s.planetOrdinal,navWorldKey:s.navWorldKey,
    renderedScene:s.renderedScene,persistence:s.persistence,landing:s.landing,localAi:s.localAi,
    panelOpen:s.panelOpen,cardOpen:s.cardOpen,cardTitle:s.cardTitle,tutActive:s.tutActive,tutDone:s.tutDone,
    trainingCheckpointWriteHeld:s.trainingCheckpointWriteHeld,savedRouteWriteHeld:s.savedRouteWriteHeld,
    tickerTicks:s.tickerTicks,sceneResources:s.sceneResources,saveLanded:s.save.landed,
    toastText:s.toastText,toastSerial:s.toastSerial,atMs:performance.now()};})()`;
  const captureState=()=>evaluate(stateExpression);
  async function observe(label){const sample=await captureState();receipt.observations.push({label,...sample});return sample;}
  const idleProduct=sample=>need(sample.landing.actionCoordinator.inFlight===false
    &&sample.landing.actionCoordinator.owner.busy===false,'Painting held an active product transaction');
  const sameEarth=sample=>need(sample.mode==='surface'&&sample.star===424242&&sample.planet===133&&sample.planetOrdinal===2,'Expected actual canonical Earth surface');
  const activeJob=sample=>{
    need(sample.localAi.jobs.length===1,'Expected exactly one local landing job');const job=sample.localAi.jobs[0];
    if(['failed','canceled','canceling'].includes(job.status))throw Error('Native local landing failed: '+JSON.stringify(job));
    return job;
  };
  async function click(selector,label){
    const geometry=await evaluate(`(()=>{const nodes=Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const inspect=e=>{const r=e.getBoundingClientRect();let visible=r.width>0&&r.height>0;
        for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)visible=false;}return {e,r,visible};};
      const candidates=nodes.map(inspect).filter(x=>x.visible&&!x.e.disabled);if(candidates.length!==1)return {count:candidates.length};
      const e=candidates[0].e;e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const x=inspect(e),r=x.r;
      const cx=r.left+r.width/2,cy=r.top+r.height/2;return {count:1,visible:x.visible,disabled:e.disabled??false,
        x:cx,y:cy,width:r.width,height:r.height,inViewport:cx>=0&&cx<innerWidth&&cy>=0&&cy<innerHeight,
        hit:e.contains(document.elementFromPoint(cx,cy)),label:e.textContent,id:e.id};})()`);
    receipt.lastControl={label,selector,geometry};
    need(geometry.count===1&&geometry.visible&&geometry.inViewport&&geometry.hit&&!geometry.disabled,'Control is not a unique visible hit target: '+selector+' '+JSON.stringify(geometry));
    await evaluate(`(()=>{const selector=${JSON.stringify(selector)};window.__cfIntegrationClick=null;
      document.addEventListener('click',function evidence(event){const target=event.target instanceof Element?event.target.closest(selector):null;
        if(!target)return;document.removeEventListener('click',evidence,true);
        window.__cfIntegrationClick={selector,isTrusted:event.isTrusted,x:event.clientX,y:event.clientY,atMs:performance.now()};},true);})()`);
    const started=performance.now();
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:geometry.x,y:geometry.y,button:'left',clickCount:1},sessionId);
    const delivered=await until('trusted '+label,'window.__cfIntegrationClick',5000);
    need(delivered.isTrusted&&delivered.selector===selector,'Native click not received by intended control');
    receipt.clicks.push({label,selector,geometry,delivered,deliveryMs:performance.now()-started});
  }
  async function screenshot(file,scope){
    const result=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
    const bytes=Buffer.from(result.data,'base64');await fs.writeFile(path.join(output,file),bytes,{flag:'wx'});
    receipt.screenshots.push({file,scope,bytes:bytes.length,sha256:sha(bytes)});
  }
  const workerRequests=()=>preview.requests.filter(row=>row.path?.split('?')[0]==='/__local_ai/stage-worker.mjs');
  const modelRequests=()=>preview.requests.filter(row=>row.path?.startsWith('/__local_ai/model/'));
  const priorDir=path.join(root,'audits/AI_GAME_INTEGRATION_20260909/native-game-02');
  const input=JSON.parse(await fs.readFile(path.join(priorDir,'actual-landfall-input.json'),'utf8'));
  const pixels=await fs.readFile(path.join(priorDir,'raw-original.png'));
  const pixelHash='aebec1c3b9cf9bb3761ff0178d77b7d525aa7683d5ee5f448408a5f0949fd7e5';
  need(sha(pixels)===pixelHash&&sha(input.recipeJson)===input.recipeKey,'Retained source fixture changed');
  receipt.fixture={pixelSha256:pixelHash,recipeKey:input.recipeKey,bytes:pixels.length,source:'native-game-02/raw-original.png'};
  await cdp.send('Page.navigate',{url:preview.url+'?localai=1'},sessionId);
  await until('real game evidence handle','!!window.__CF_SLICE__?.api',60000);
  await click('[data-sel="tutskip"]','Skip training');
  await until('durable Sol',`(()=>{const s=window.__CF_SLICE__.api.state();return !s.tutActive&&s.tutDone
    &&!s.trainingCheckpointWriteHeld&&!s.savedRouteWriteHeld&&s.persistence.ready&&!s.persistence.mutationBlocked
    &&s.mode==='system'&&s.star===424242&&s.localAi.available;})()`,30000);
  // Explicit retained-image fixture only. Use the actual owner to commit/readback,
  // never mutate the database directly or replace inference/storage functions.
  const retained=await evaluate(`(async()=>{const m=await import('/src/ai-landfall-originals.ts');
    const store=m.createAiLandfallOriginalStoreV1();try{const text=atob(${JSON.stringify(pixels.toString('base64'))});
      const bytes=Uint8Array.from(text,c=>c.charCodeAt(0));const row=await store.retain(${JSON.stringify(input)},
      {blob:new Blob([bytes],{type:'image/png'}),width:1024,height:576});
      return {originalId:row.originalId,sha256:row.sha256};}finally{store.close();}})()`);
  need(retained.sha256===pixelHash,'Native owner changed fixture pixels');receipt.retained=retained;
  need(await evaluate('window.__CF_SLICE__.api.surveyOn({seed:133,ordinal:2})')===true,'Earth Survey fixture refused');
  await click('[data-act="landcta"]','Land with retained original');
  await until('actual cached job ready',`(()=>{const s=window.__CF_SLICE__.api.state();return s.mode==='surface'&&s.planet===133&&s.localAi.jobs[0]?.status==='ready';})()`,30000);
  const landed=await observe('durable-Land-cached-original');sameEarth(landed);idleProduct(landed);
  need(landed.localAi.jobs[0].originalId===retained.originalId&&landed.localAi.jobs[0].input.recipeKey===input.recipeKey,'Game did not reuse the exact fixture');
  need(workerRequests().length===0&&modelRequests().length===0,'Cached landing requested inference/model files');
  const notificationSelector=await evaluate(`(()=>{for(const id of ['shelfnotifications','docknotifications']){const e=document.getElementById(id);if(e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0)return '#'+id;}return null;})()`);
  need(notificationSelector,'No Notifications control');
  await click(notificationSelector,'Open Notifications');
  await click('#notificationpanel [data-ai-act="view"]','View retained painting in world');
  await until('View settled with painting and closed Notifications',`(()=>{const s=window.__CF_SLICE__.api.state();return s.localAi.mounted===true&&s.panelOpen!=='notifications';})()`);
  await click(notificationSelector,'Reopen Notifications');
  await until('Notifications inspection entry is revealed',`window.__CF_SLICE__.api.state().panelOpen==='notifications'&&!!document.querySelector('#notificationpanel [data-ai-act="inspect"]')`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await click('#notificationpanel [data-ai-act="inspect"]','Inspect retained painting');
  const viewerState=`(()=>{const d=document.getElementById('cf-landfall-viewer');if(!d)return null;
    const img=d.querySelector('img'),v=d.querySelector('[data-landfall-viewport]');const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    return {open:d.open,modal:d.matches(':modal'),ready:d.dataset.ready,originalId:d.dataset.originalId,sha256:d.dataset.imageSha256,
      dialog:rect(d),image:rect(img),viewport:rect(v),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      scrollLeft:v.scrollLeft,scrollTop:v.scrollTop,scrollWidth:v.scrollWidth,focus:d.contains(document.activeElement),
      focusAction:document.activeElement?.dataset?.landfallViewerAction??null,focusViewport:document.activeElement===v,
      backgroundLocked:Array.from(document.body.children).filter(e=>e!==d&&e instanceof HTMLElement).every(e=>e.inert&&e.getAttribute('aria-hidden')==='true'),
      width:innerWidth,height:innerHeight,documentScrollWidth:document.documentElement.scrollWidth,
      buttons:Array.from(d.querySelectorAll('button')).map(e=>({action:e.dataset.landfallViewerAction,rect:rect(e)}))};})()`;
  const readViewer=()=>evaluate(viewerState);
  const acceptFit=(s,minWidth)=>need(s?.open&&s.modal&&s.ready==='true'&&s.originalId===retained.originalId&&s.sha256===pixelHash
    &&s.naturalWidth===1024&&s.naturalHeight===576&&s.focus&&s.backgroundLocked
    &&s.dialog.x>=0&&s.dialog.y>=0&&s.dialog.right<=s.width&&s.dialog.bottom<=s.height
    &&s.image.width>=minWidth&&s.image.right<=s.viewport.right+.5&&s.image.bottom<=s.viewport.bottom+.5
    &&s.image.x>=s.viewport.x-.5&&s.image.y>=s.viewport.y-.5&&Math.abs(s.image.width/s.image.height-1024/576)<.01
    &&s.buttons.every(b=>b.rect.height>=44&&b.rect.x>=0&&b.rect.right<=s.width&&b.rect.y>=0&&b.rect.bottom<=s.height),
    'Viewer fit/identity/focus/clearance outcome failed');
  await until('viewer decoded',`document.getElementById('cf-landfall-viewer')?.dataset.ready==='true'`);
  let view=await readViewer();acceptFit(view,900);receipt.observations.push({label:'desktop-viewer',...view});
  const displayedHash=await evaluate(`(async()=>{const b=await(await fetch(document.querySelector('#cf-landfall-viewer img').src)).arrayBuffer();
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');})()`);
  need(displayedHash===pixelHash,'Viewer did not use exact retained PNG bytes');receipt.displayedBlobSha256=displayedHash;
  await screenshot('01-desktop-full-painting.png','Native actual-game inspection of unchanged retained original; no new model render');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:false},sessionId);
  await until('small viewer native layout',`(()=>{const d=document.getElementById('cf-landfall-viewer');return innerWidth===320&&d?.getBoundingClientRect().right<=320;})()`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  view=await readViewer();acceptFit(view,250);receipt.observations.push({label:'small-fit-layout-only',...view});
  need(view.documentScrollWidth<=320,'Viewer expanded the document horizontally');
  await screenshot('02-small-full-painting.png','320x568 desktop browser layout, not physical phone qualification');
  // Native negative control: actually shrink the displayed image, reject it
  // with the same fit ruler, restore exact style bytes, and re-prove visibility.
  const beforeStyle=await evaluate(`document.querySelector('#cf-landfall-viewer img').getAttribute('style')`);
  await evaluate(`document.querySelector('#cf-landfall-viewer img').style.maxWidth='40px'`);
  const shrunk=await readViewer();let rejected=false;try{acceptFit(shrunk,250);}catch{rejected=true;}
  need(rejected&&shrunk.image.width<=40.5,'Tiny-picture negative control was not detected');
  await evaluate(`document.querySelector('#cf-landfall-viewer img').setAttribute('style',${JSON.stringify(beforeStyle)})`);
  acceptFit(await readViewer(),250);receipt.negativeControl={rejected,shrunk,restored:true};
  await click('[data-landfall-viewer-action="actual"]','Actual-size detail');
  view=await readViewer();need(view.image.width===1024&&view.image.height===576&&view.scrollWidth>=1024,'Actual size does not expose native resolution');
  const vp=view.viewport;
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:vp.x+vp.width/2,y:vp.y+vp.height/2,deltaX:320,deltaY:120},sessionId);
  await until('actual-size native panning',`document.querySelector('[data-landfall-viewport]').scrollLeft>0`);
  receipt.observations.push({label:'small-actual-size-panned',...await readViewer()});
  await screenshot('03-small-actual-size-detail.png','Actual native pixels panned within the game dialog');
  await click('[data-landfall-viewer-action="fit"]','Restore entire painting');
  acceptFit(await readViewer(),250);
  await click('[data-landfall-viewer-action="close"]','Close without leaving world');
  await until('viewer closed','!document.getElementById("cf-landfall-viewer")');
  const closed=await observe('small-close-stays-Earth');sameEarth(closed);idleProduct(closed);
  const restoredFocus=await evaluate(`(()=>{const e=document.activeElement,r=e?.getBoundingClientRect();return {id:e?.id,action:e?.dataset?.aiAct,job:e?.dataset?.aiJob,visible:!!r&&r.width>0&&r.height>0,scope:!!e?.closest('#notificationpanel')};})()`);
  need(restoredFocus.visible&&(closed.panelOpen==='notifications' ? restoredFocus.scope&&restoredFocus.action==='inspect'
    : ['shelfnotifications','docknotifications'].includes(restoredFocus.id)),'Close did not restore the live inspection or visible panel opener');
  receipt.restoredFocus=restoredFocus;
  if(closed.panelOpen!=='notifications'){
    await click('#'+restoredFocus.id,'Reopen Notifications after resize');
    await until('Notifications reopened','window.__CF_SLICE__.api.state().panelOpen==="notifications"');
  }
  await click('#notificationpanel [data-ai-act="inspect"]','Reopen for keyboard check');
  await until('reopened decode','document.getElementById("cf-landfall-viewer")?.dataset.ready==="true"');
  await evaluate(`window.__cfViewerKeys=[];document.getElementById('cf-landfall-viewer').addEventListener('keydown',e=>window.__cfViewerKeys.push({key:e.key,shift:e.shiftKey,isTrusted:e.isTrusted}),true)`);
  async function key(key,code,vk,modifiers=0){await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk,modifiers},sessionId);await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk,modifiers},sessionId);}
  await key('Tab','Tab',9,8);need((await readViewer()).focusViewport,'Shift-Tab escaped the dialog');
  await key('Tab','Tab',9);need((await readViewer()).focusAction==='close','Tab did not wrap to Close');
  await key('Escape','Escape',27);
  await until('Escape closes only painting','!document.getElementById("cf-landfall-viewer")');
  const escaped=await observe('keyboard-Escape-stays-Earth');sameEarth(escaped);
  receipt.keys=await evaluate('window.__cfViewerKeys');need(receipt.keys.length===3&&receipt.keys.every(e=>e.isTrusted),'Keyboard actions were not native');
  // Reload erases page job rows; the mounted original must still expose Inspect
  // through the actual Survey action after normal original restoration.
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
  const oldToken=escaped.documentToken;await cdp.send('Page.reload',{ignoreCache:true},sessionId);
  await until('same retained painting after reload',`(()=>{const h=window.__CF_SLICE__;if(!h||h.documentToken===${JSON.stringify(oldToken)})return false;const s=h.api.state();return s.mode==='surface'&&s.planet===133&&s.localAi.mounted===true;})()`,60000);
  const reload=await observe('reload-exact-original');sameEarth(reload);need(reload.localAi.jobs.length===0,'Reload invented page job history');
  await click('#docksurvey','Open Survey after reload');
  await click('#survey [data-ai-act="inspect-current"]','Inspect restored original after reload');
  await until('restored viewer ready','document.getElementById("cf-landfall-viewer")?.dataset.ready==="true"');
  acceptFit(await readViewer(),900);await screenshot('04-reloaded-original-inspection.png','Real Survey retains full-painting inspection after reload, without inference');
  await click('[data-landfall-viewer-action="close"]','Close restored painting');
  need(workerRequests().length===0&&modelRequests().length===0&&inferenceTargets.size===0,'Viewer/reload triggered model work');
  receipt.noInferenceOrModelRequests=true;receipt.original={sha256:pixelHash};
  need(receipt.browserEvents.every(event=>event.method!=='Runtime.exceptionThrown'&&event.method!=='Inspector.targetCrashed'),'Native viewer game exception/crash');
  if(eventFault)throw eventFault;
  receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  if(eventFault){receipt.status='FAIL';receipt.error??=String(eventFault);process.exitCode=1;}
  // Always retain final requests and source-integrity failures, including an
  // early browser/worker failure. A red attempt never starts another inference.
  if(preview)receipt.requests=preview.requests.map(row=>({...row}));
  if(receipt.status==='FAIL'&&cdp&&sessionId)try{
    const image=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
    const bytes=Buffer.from(image.data,'base64');await fs.writeFile(path.join(output,'failure.png'),bytes,{flag:'wx'});
    receipt.failureScreenshot={sha256:sha(bytes),bytes:bytes.length};
    const ui=await cdp.send('Runtime.evaluate',{expression:`(()=>{const s=window.__CF_SLICE__?.api.state();return {mode:s?.mode,panelOpen:s?.panelOpen,cardOpen:s?.cardOpen,localAi:s?.localAi,dialog:document.getElementById('cf-landfall-viewer')?.outerHTML.slice(0,12000)};})()`,returnByValue:true},sessionId);
    receipt.failureUi=ui.result?.value??null;
  }catch(error){receipt.failureCaptureError=String(error);}
  try{if(cdp&&sessionId){const last=await cdp.send('Runtime.evaluate',{expression:'window.__CF_SLICE__?.api.state().localAi??null',returnByValue:true},sessionId);
    receipt.finalLocalAi=last.result?.value??null;}}catch(error){receipt.finalObservationError=String(error);}
  try{if(targetId){await cdp.send('Target.closeTarget',{targetId});receipt.cleanup.targetClosed=true;}}catch(error){receipt.cleanup.targetError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{if(cdp){await cdp.close();receipt.cleanup.browserClosed=true;}}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{if(preview){await preview.close();receipt.cleanup.serverClosed=true;}}catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.sourceIntegrity=await recheckSourceFiles(receipt.sources);
  if(!receipt.sourceIntegrity.unchanged){receipt.status='FAIL';process.exitCode=1;}
  try{releaseWorkspace?.();receipt.cleanup.workspaceReleased=Boolean(releaseWorkspace);}
  catch(error){receipt.cleanup.workspaceError=String(error);receipt.status='FAIL';process.exitCode=1;}
  if(eventFault){receipt.status='FAIL';receipt.error??=String(eventFault);process.exitCode=1;}
  receipt.finishedAt=new Date().toISOString();await writeJson('result.json',receipt);
  console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,observations:receipt.observations.length,
    clicks:receipt.clicks.length,generationToReadyMs:receipt.generationToReadyMs??null,original:receipt.original?.sha256??null,
    result:path.join(output,'result.json')}));
}
