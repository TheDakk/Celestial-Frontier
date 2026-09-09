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
  else throw Error('Usage: run-game-integration.mjs --output=NEW_AUDITS_DIRECTORY');
}
need(output&&output.startsWith(path.join(root,'audits')+path.sep),'A new repository audit directory is required');
await fs.mkdir(output,{recursive:false});
const writeJson=(file,value)=>fs.writeFile(path.join(output,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const receipt={schema:'cf.real-game-local-ai-integration.v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'One actual Earth Land action, native Notifications during inference, explicit View, retained exact original and reload',
  qualityAccepted:false,deviceQualified:false,actualModelDownloaded:false,synthetic:false,
  sources:[],observations:[],clicks:[],screenshots:[],browserEvents:[],targetEvents:[],cleanup:{}};
await writeJson('start.json',receipt);
let preview,cdp,targetId,sessionId,originalJob,releaseWorkspace;
const bindingPath=path.join(root,'audits/AI_GAME_INTEGRATION_20260909/platypus-reference-binding.json');
const sourceNames=[
  'port/v2/apps/game/src/main.ts','port/v2/apps/game/index.html','port/v2/apps/game/vite.config.ts',
  'port/v2/apps/game/src/local-ai-game.ts','port/v2/apps/game/src/local-ai-runtime.ts',
  'port/v2/apps/game/src/ai-landfall-jobs.ts','port/v2/apps/game/src/ai-landfall-originals.ts',
  'port/v2/apps/game/src/local-model-delivery.ts','port/v2/apps/game/src/local-model-sha256.ts',
  'port/v2/apps/game/src/local-model-manifest.ts','port/v2/apps/game/src/landfall-conditioning.ts',
  'port/v2/apps/game/src/world-roster.ts','port/v2/apps/game/src/product-action-coordinator.ts',
  'port/v2/apps/game/src/training.ts','port/v2/apps/game/pwa-build.ts',
  'port/v2/apps/game/src/landfall-appearance-snapshot.ts','port/v2/apps/game/src/earth-layered-recipe.ts',
  'tools/local-image-generation/run-game-integration.mjs','tools/local-image-generation/game-preview-server.mjs',
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
  releaseWorkspace=acquireWorkspaceLock('real game native local AI integration');
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
  cdp=await openChromiumCdp({label:'CF real game native local AI integration',userDataPrefix:'cf-game-local-ai-',commandTimeoutMs:45000,
    onEvent:event=>{
      if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method)){
        if(receipt.browserEvents.length>=300)throw Error('Browser event evidence overflow');receipt.browserEvents.push(event);
      }
      if(['Target.targetCreated','Target.targetInfoChanged','Target.targetDestroyed','Target.targetCrashed'].includes(event.method)){
        if(receipt.targetEvents.length>=300)throw Error('Target event evidence overflow');receipt.targetEvents.push(event);
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
    const value=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
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
    need(geometry.count===1&&geometry.visible&&geometry.inViewport&&geometry.hit&&!geometry.disabled,'Control is not a unique visible hit target: '+selector);
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
  await cdp.send('Page.navigate',{url:preview.url+'?localai=1'},sessionId);
  await until('real game evidence handle','!!window.__CF_SLICE__?.api',60000);
  const boot=await observe('fresh-training');need(boot.tutActive===true,'Fresh isolated profile did not start training');
  await click('[data-sel="tutskip"]','Skip training');
  await until('durable Sol after training skip',`(()=>{const s=window.__CF_SLICE__.api.state();return !s.tutActive&&s.tutDone
    &&!s.trainingCheckpointWriteHeld&&!s.savedRouteWriteHeld&&s.persistence.ready&&!s.persistence.mutationBlocked
    &&s.mode==='system'&&s.star===424242&&s.localAi.available;})()`,30000);
  const sol=await observe('durable-Sol-ready');idleProduct(sol);need(sol.localAi.jobs.length===0&&workerRequests().length===0,'Generation began before Land');
  // Diagnostic setup selects the existing Earth Survey card only. Landing is
  // exclusively the following native user control; api.landOn/landHere are unused.
  receipt.surveySetup=await evaluate('window.__CF_SLICE__.api.surveyOn({seed:133,ordinal:2})');
  need(receipt.surveySetup===true,'Canonical Earth survey setup refused');
  await until('Earth land control','!!document.querySelector(\'[data-act="landcta"]\')');
  await screenshot('01-earth-survey-before-land.png','Desktop real Earth Survey before native Land');
  const started=performance.now();await click('[data-act="landcta"]','Land on Earth');
  await until('durable Earth and real drawing job',`(()=>{const s=window.__CF_SLICE__.api.state();return s.mode==='surface'&&s.planet===133
    &&s.localAi.jobs.length===1;})()`,30000);
  const landed=await observe('durable-Earth-generation-started');sameEarth(landed);idleProduct(landed);
  const firstJob=activeJob(landed);need(firstJob.status==='generating'&&landed.localAi.mounted===false,'Expected unmounted live generation');
  need(/^committed:\d+$/.test(landed.landing.lastOutcome)&&landed.renderedScene.worldKey===landed.navWorldKey,
    'Land was not independently committed and rendered before drawing');
  const recipe=JSON.parse(firstJob.input.recipeJson);
  need(recipe.qualityAccepted===false&&recipe.reference.sha256===binding.image.sha256
    &&recipe.reference.speciesVisualKey===binding.binding.subjectIdentityKey&&recipe.q8Block32===true,
    'Actual job does not match pinned diagnostic reference/model route');
  const residents=recipe.conditioning?.residents;
  need(Array.isArray(residents)&&residents.length===6&&JSON.stringify(residents.map(row=>row.name).sort())
    ===JSON.stringify(['Civet','Platypus','Frog','Persimmon',"Devil's Club",'Cranberry'].sort())
    &&residents.find(row=>row.name==='Platypus').identityKey===binding.binding.subjectIdentityKey
    &&sha(firstJob.input.recipeJson)===firstJob.input.recipeKey,'Actual recipe lost canonical resident/identity binding');
  await writeJson('actual-landfall-input.json',firstJob.input);await writeJson('actual-landfall-recipe.json',recipe);
  receipt.jobId=firstJob.jobId;receipt.recipeKey=firstJob.input.recipeKey;
  const notificationSelector=await evaluate(`(()=>{for(const id of ['shelfnotifications','docknotifications']){
    const e=document.getElementById(id);if(!e||e.disabled)continue;const r=e.getBoundingClientRect();let visible=r.width>0&&r.height>0;
    for(let n=e;n;n=n.parentElement){const css=getComputedStyle(n);if(n.hidden||css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse'||Number(css.opacity)===0)visible=false;}
    if(visible)return '#'+id;}return null;})()`);
  need(notificationSelector!==null,'No visible canonical Notifications control');receipt.notificationSelector=notificationSelector;
  await click(notificationSelector,'Open Notifications during inference');
  await until('Notifications responds during generation',`window.__CF_SLICE__.api.state().panelOpen==='notifications'`,5000);
  const notifications=await observe('notifications-during-inference');sameEarth(notifications);idleProduct(notifications);
  need(activeJob(notifications).status==='generating','Notifications was only tested after inference ended');
  await screenshot('02-notifications-during-inference.png','Real Notifications remains usable while native model worker runs');
  const deadline=started+600000;let priorProgress='',sawDenoise=false,progressUiObserved=false,completed;
  while(performance.now()<deadline){
    const sample=await captureState();sameEarth(sample);idleProduct(sample);
    need(sample.panelOpen==='notifications','Generation completion auto-navigated away from Notifications');
    need(sample.localAi.mounted===false,'Painting mounted without explicit View');
    const job=activeJob(sample),key=JSON.stringify({status:job.status,progress:job.progress});
    need(job.jobId===firstJob.jobId&&JSON.stringify(job.input)===JSON.stringify(firstJob.input),'Job/recipe identity changed during inference');
    if(key!==priorProgress){priorProgress=key;receipt.observations.push({label:'native-progress',...sample});
      console.log(JSON.stringify({phase:job.progress.phase,status:job.status,completed:job.progress.completed,etaMs:job.progress.etaMs}));}
    if(/^Drawing [1-4] of 4$/.test(job.progress.phase))sawDenoise=true;
    if(!progressUiObserved&&/^Drawing [2-4] of 4$/.test(job.progress.phase)){
      const ui=await evaluate(`(()=>{const row=document.querySelector('#notificationpanel [data-ai-landfall-job]');
        if(!row)return null;row.scrollIntoView({block:'center',behavior:'instant'});const meter=row.querySelector('progress');if(!meter)return null;
        const r=meter.getBoundingClientRect();let visible=r.width>0&&r.height>0;
        for(let n=meter;n;n=n.parentElement){const css=getComputedStyle(n);if(n.hidden||css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0)visible=false;}
        return {text:row.innerText,visible,value:meter.value,max:meter.max,rect:{x:r.x,y:r.y,width:r.width,height:r.height},
          inViewport:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth};})()`);
      need(ui?.visible&&ui.inViewport&&ui.max===100&&ui.value>0&&ui.value<100&&/Landing/.test(ui.text)
        &&/About \d+s drawing/.test(ui.text),'Drawing progress/ETA was not actually visible in Notifications');
      receipt.visibleDrawingProgress={jobProgress:job.progress,ui};progressUiObserved=true;
      await screenshot('02b-visible-drawing-progress.png','Visible live drawing progress and ETA in real Notifications');
    }
    if(job.status==='ready'){completed=sample;originalJob=job;break;}
    await sleep(250);
  }
  need(completed&&sawDenoise&&progressUiObserved,'Native inference did not complete after visible drawing within ten minutes');
  receipt.generationToReadyMs=performance.now()-started;need(originalJob.originalId&&originalJob.progress.completed===100,'Ready lacks retained original');
  need(workerRequests().length===4&&workerRequests().every(row=>row.status===200),'Expected exactly four actual stage-worker requests');
  receipt.inferenceWorkerTargetIds=[...inferenceTargets];
  const retireDeadline=performance.now()+5000;let liveInferenceWorkers;
  do{const targetList=await cdp.send('Target.getTargets');liveInferenceWorkers=targetList.targetInfos.filter(info=>info.type==='worker'&&info.url.includes('/__local_ai/stage-worker.mjs'));
    if(!liveInferenceWorkers.length)break;await sleep(50);
  }while(performance.now()<retireDeadline);
  need(liveInferenceWorkers.length===0,'Inference worker remained alive after ready');
  await screenshot('03-ready-without-autonavigation.png','Painting ready; Notifications retained until explicit View');
  const originalExpression=`(async()=>{const module=await import('/src/ai-landfall-originals.ts');const store=module.createAiLandfallOriginalStoreV1();
    try{const row=await store.read(${JSON.stringify(originalJob.input)},${JSON.stringify(originalJob.originalId)});if(!row)throw Error('Retained original missing');
      const bytes=new Uint8Array(await row.blob.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));
      return {schema:row.schema,originalId:row.originalId,input:row.input,sha256:row.sha256,width:row.width,height:row.height,
        bytes:row.blob.size,type:row.blob.type,base64:btoa(text)};}finally{store.close();}})()`;
  const original=await evaluate(originalExpression),png=Buffer.from(original.base64,'base64');
  need(png.length===original.bytes&&png.length>24&&png.length<=16*1024*1024&&sha(png)===original.sha256
    &&original.width===1024&&original.height===576&&original.type==='image/png'
    &&png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    &&png.readUInt32BE(16)===1024&&png.readUInt32BE(20)===576
    &&JSON.stringify(original.input)===JSON.stringify(originalJob.input),'Stored original PNG/input verification failed');
  await fs.writeFile(path.join(output,'raw-original.png'),png,{flag:'wx'});delete original.base64;receipt.original=original;
  await writeJson('retained-original.json',original);
  await click('#notificationpanel [data-ai-act="view"]','View retained landfall');
  await until('explicit original mounted','window.__CF_SLICE__.api.state().localAi.mounted===true',15000);
  const viewed=await observe('explicit-View-mounted-original');sameEarth(viewed);idleProduct(viewed);
  need(viewed.panelOpen===null,'View did not close Notifications');
  await screenshot('04-viewed-landfall.png','Actual game mounts the unchanged generated original after explicit View');
  const requestCounts={workers:workerRequests().length,models:modelRequests().length,targets:inferenceTargets.size};
  const oldDocument=viewed.documentToken;
  await cdp.send('Page.reload',{ignoreCache:true},sessionId);
  await until('new document remounts retained original',`(()=>{const handle=window.__CF_SLICE__;if(!handle||handle.documentToken===${JSON.stringify(oldDocument)})return false;
    const s=handle.api.state();return s.persistence.ready&&s.localAi.available&&s.localAi.mounted&&s.mode==='surface'&&s.planet===133;})()`,30000);
  const reloaded=await observe('reloaded-retained-original-mounted');sameEarth(reloaded);idleProduct(reloaded);
  need(reloaded.localAi.jobs.length===0,'Reload created a new inference job');
  need(workerRequests().length===requestCounts.workers&&modelRequests().length===requestCounts.models&&inferenceTargets.size===requestCounts.targets,
    'Reload started a second local worker/model request');
  const reloadedOriginal=await evaluate(originalExpression),reloadedBytes=Buffer.from(reloadedOriginal.base64,'base64');
  need(sha(reloadedBytes)===original.sha256&&reloadedOriginal.originalId===original.originalId
    &&reloadedBytes.equals(png),'Reload changed or lost the exact retained original');
  delete reloadedOriginal.base64;receipt.reloadedOriginal=reloadedOriginal;
  await screenshot('05-reloaded-retained-landfall.png','New game document remounts the same retained original without inference');
  // Layout-only diagnostic after completion. This does not emulate phone GPU,
  // memory, touch behavior, performance, Safari, persistence or device support.
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true},sessionId);
  // Resize invalidates the old scene before its asynchronous original remount.
  // Viewport dimensions alone can be ready during that legitimate transition.
  // Keep exact route/environment identity, then require quiescent art and stable
  // scene generations across at least two ticker frames before taking evidence.
  const resizeDeadline=performance.now()+15000;let stableResize=null,lastResizeKey='',resizeReady=false;
  receipt.resizeObservations=[];
  while(performance.now()<resizeDeadline){
    const resized=await evaluate(`(()=>{const handle=window.__CF_SLICE__;const s=handle.api.state();return {
      documentToken:handle.documentToken,width:innerWidth,height:innerHeight,viewportWidth:s.viewportWidth,
      scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
      mounted:s.localAi.mounted,jobs:s.localAi.jobs,mode:s.mode,navWorldKey:s.navWorldKey,
      renderedScene:s.renderedScene,sceneResources:s.sceneResources,tickerTicks:s.tickerTicks,
      productAction:s.landing.actionCoordinator,atMs:performance.now()};})()`);
    const art=resized.sceneResources;
    need(resized.documentToken===reloaded.documentToken,'Resize changed the document instead of remounting the retained original');
    need(resized.mode==='surface'&&resized.navWorldKey===original.input.worldKey,
      'Resize changed the canonical world route; this is not a transient remount');
    const identityMatches=art.surfaceVistaEnvironmentFingerprint===original.input.environmentId
      &&resized.renderedScene.worldKey===original.input.worldKey
      &&resized.renderedScene.ecologyEpoch===original.input.ecologyEpoch;
    const quiescent=art.pendingSurfaceRefreshes===0&&art.surfaceVistaWorkerActive===false
      &&art.surfacePlanetTurnPending===false;
    const geometryReady=resized.width===320&&resized.height===568&&resized.viewportWidth===320;
    const mountedIdentity=resized.mounted&&art.surfaceVistaMounted===true
      &&art.surfaceVistaArtVariant==='cf-local-ai-landfall-v1'&&identityMatches;
    need(!quiescent||art.surfaceVistaEnvironmentFingerprint===null||identityMatches,
      'Resize settled on a different canonical environment/epoch');
    need(resized.jobs.length===0,'Resize queued a second inference instead of restoring the original');
    need(resized.productAction.inFlight===false&&resized.productAction.owner.busy===false,
      'Resize/remount held a product transaction');
    const key=JSON.stringify({geometryReady,mountedIdentity,quiescent,identityMatches,
      generation:art.generation,vistaGeneration:art.surfaceVistaGeneration,renderSerial:resized.renderedScene.serial});
    if(key!==lastResizeKey){lastResizeKey=key;receipt.resizeObservations.push({classification:geometryReady&&mountedIdentity&&quiescent
      ?'mounted-awaiting-stable-frames':'transient-resize-remount',...resized});}
    if(geometryReady&&mountedIdentity&&quiescent){
      if(stableResize?.key===key&&resized.tickerTicks>=stableResize.tickerTicks+2&&resized.atMs-stableResize.atMs>=100){
        receipt.smallViewport=resized;resizeReady=true;break;
      }
      if(stableResize?.key!==key)stableResize={key,tickerTicks:resized.tickerTicks,atMs:resized.atMs};
    }else stableResize=null;
    await sleep(50);
  }
  need(resizeReady,'Resize did not finish the same-original remount with stable, quiescent art within 15 seconds');
  need(workerRequests().length===requestCounts.workers&&modelRequests().length===requestCounts.models&&inferenceTargets.size===requestCounts.targets,
    'Resize started another inference worker/model request');
  const resizedOriginal=await evaluate(originalExpression),resizedBytes=Buffer.from(resizedOriginal.base64,'base64');
  need(resizedOriginal.originalId===original.originalId&&sha(resizedBytes)===original.sha256&&resizedBytes.equals(png),
    'Resize changed or lost the exact retained original input/PNG');
  delete resizedOriginal.base64;receipt.resizedOriginal=resizedOriginal;
  receipt.smallViewport.layoutOnly=true;receipt.smallViewport.documentContained=receipt.smallViewport.scrollWidth<=320;
  await screenshot('06-small-viewport-layout-only.png','320×568 desktop-browser layout diagnostic; not phone qualification');
  receipt.checks={trustedLand:true,durableLandingBeforeDrawing:true,productTransactionIdleAtObservations:true,
    notificationsResponsiveDuringInference:true,drawingProgressObserved:true,noCompletionAutonavigation:true,
    explicitView:true,originalRetainedAndHashed:true,originalExactAfterReload:true,noReloadInference:true};
  need(receipt.browserEvents.every(event=>event.method!=='Runtime.exceptionThrown'&&event.method!=='Inspector.targetCrashed'),
    'Unexpected browser exception/crash');
  receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  // Always retain final requests and source-integrity failures, including an
  // early browser/worker failure. A red attempt never starts another inference.
  if(preview)receipt.requests=preview.requests.map(row=>({...row}));
  try{if(cdp&&sessionId){const last=await cdp.send('Runtime.evaluate',{expression:'window.__CF_SLICE__?.api.state().localAi??null',returnByValue:true},sessionId);
    receipt.finalLocalAi=last.result?.value??null;}}catch(error){receipt.finalObservationError=String(error);}
  try{if(targetId){await cdp.send('Target.closeTarget',{targetId});receipt.cleanup.targetClosed=true;}}catch(error){receipt.cleanup.targetError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{if(cdp){await cdp.close();receipt.cleanup.browserClosed=true;}}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
  try{if(preview){await preview.close();receipt.cleanup.serverClosed=true;}}catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.sourceIntegrity=await recheckSourceFiles(receipt.sources);
  if(!receipt.sourceIntegrity.unchanged){receipt.status='FAIL';process.exitCode=1;}
  try{releaseWorkspace?.();receipt.cleanup.workspaceReleased=Boolean(releaseWorkspace);}
  catch(error){receipt.cleanup.workspaceError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.finishedAt=new Date().toISOString();await writeJson('result.json',receipt);
  console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,observations:receipt.observations.length,
    clicks:receipt.clicks.length,generationToReadyMs:receipt.generationToReadyMs??null,original:receipt.original?.sha256??null,
    result:path.join(output,'result.json')}));
}
