/** Native UI outcome proof after explicit full-model installation and offline
 * verification. No model injection, source-module import, fabricated readiness,
 * image edit or inferred phone/art qualification. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function assessOfflineOriginal(value,input){
  need(value&&value.schema==='cf.offline-viewer-original.v1'&&value.width===1024&&value.height===576
    &&value.type==='image/png'&&Number.isSafeInteger(value.bytes)&&value.bytes>24&&value.bytes<=16*1024*1024
    &&typeof value.base64==='string'&&/^[a-f0-9]{64}$/.test(value.sha256),'Invalid native viewer original');
  const bytes=Buffer.from(value.base64,'base64');
  need(bytes.length===value.bytes&&sha(bytes)===value.sha256
    &&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    &&bytes.readUInt32BE(16)===1024&&bytes.readUInt32BE(20)===576,'Native original bytes or PNG dimensions changed');
  need(value.originalId===sha(JSON.stringify(input))+':'+value.sha256,'Native original lost its full input identity');
  return bytes;
}
export async function runOfflineLandfallProof({evaluate,until,click,screenshot,cdp,sessionId,receipt,output,modelRequests,workerEvidence,q8Block32=false}){
  need(typeof q8Block32==='boolean'&&(!q8Block32||receipt.variant?.status==='VERIFIED_NATIVE_VARIANT'),'Derived Land requires the completed native variant proof');
  const proof={scope:'One actual '+(q8Block32?'browser-derived block32':'portable')+' offline Land, progress, retained original, View and reload. Desktop native browser only.',
    status:'FAIL',modelExecuted:false,qualityAccepted:false,physicalPhoneQualified:false,observations:[],progress:[]};
  receipt.landfall=proof;
  const write=(name,value)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  const expression=`(()=>{const h=window.__CF_SLICE__;if(!h)return null;const s=h.api.state();return {
    documentToken:h.documentToken,mode:s.mode,star:s.star,planet:s.planet,planetOrdinal:s.planetOrdinal,
    navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,persistence:s.persistence,landing:s.landing,
    localAi:s.localAi,panelOpen:s.panelOpen,tickerTicks:s.tickerTicks,sceneResources:s.sceneResources,
    controller:navigator.serviceWorker.controller?.scriptURL,atMs:performance.now()};})()`;
  async function observe(label){const value=await evaluate(expression);proof.observations.push({label,...value});return value;}
  const sameEarth=value=>need(value.mode==='surface'&&value.star===424242&&value.planet===133&&value.planetOrdinal===2,
    'Normal offline landing lost canonical Earth');
  const idle=value=>need(!value.landing.actionCoordinator.inFlight&&!value.landing.actionCoordinator.owner.busy,
    'Painting held an active gameplay transaction');
  function jobOf(value){need(value.localAi.jobs.length===1,'Expected one exact normal-game painting job');
    const job=value.localAi.jobs[0];need(!['failed','canceled','canceling'].includes(job.status),'Actual offline painting failed: '+JSON.stringify(job));return job;}
  const originalRequestCount=modelRequests();
  const initial=await observe('verified-offline-before-land');
  need(initial.mode==='system'&&initial.star===424242&&initial.localAi.jobs.length===0&&initial.controller,
    'Expected controlled offline Sol without an existing drawing job');idle(initial);
  if(initial.panelOpen==='notifications'){
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27},sessionId);
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27},sessionId);
    await until('close model storage panel before Survey',`window.__CF_SLICE__.api.state().panelOpen===null`);
  }
  proof.workerEvidenceBefore=workerEvidence();
  // This setup selects a real Survey card only. Land is the trusted UI action.
  proof.surveySetup=await evaluate('window.__CF_SLICE__.api.surveyOn({seed:133,ordinal:2})');
  need(proof.surveySetup===true,'Canonical Earth Survey setup refused');
  await until('normal offline Land control','!!document.querySelector(\'[data-act="landcta"]\')');
  await screenshot('05-offline-earth-before-land.png');
  const started=performance.now();await click('[data-act="landcta"]','Land using the verified offline browser model');
  await until('durable Earth and one local model job',`(()=>{const s=window.__CF_SLICE__.api.state();return s.mode==='surface'&&s.planet===133&&s.localAi.jobs.length===1;})()`,30000);
  const first=await observe('offline-land-committed');sameEarth(first);idle(first);const initialJob=jobOf(first);
  need(initialJob.status==='generating'&&!first.localAi.mounted&&/^committed:\d+$/.test(first.landing.lastOutcome)
    &&first.renderedScene.worldKey===first.navWorldKey,'Land was not independently committed before painting');
  const recipe=JSON.parse(initialJob.input.recipeJson);
  need(recipe.schema==='cf.ai-landfall-render.v2'&&recipe.qualityAccepted===false&&recipe.q8Block32===q8Block32
    &&recipe.references?.length===6&&recipe.conditioning?.residents?.length===6
    &&JSON.stringify(recipe.conditioning.residents.map(r=>r.name))===JSON.stringify(['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'])
    &&sha(initialJob.input.recipeJson)===initialJob.input.recipeKey,'Actual job is not the full-identity selected V2 recipe');
  proof.modelExecutionAttempted=true;receipt.modelExecutionAttempted=true;
  proof.jobId=initialJob.jobId;proof.input=initialJob.input;proof.recipeKey=initialJob.input.recipeKey;
  await write('actual-landfall-input.json',initialJob.input);await write('actual-landfall-recipe.json',recipe);
  const opener=await evaluate(`(()=>{for(const id of ['shelfnotifications','docknotifications']){const e=document.getElementById(id),r=e?.getBoundingClientRect();if(r?.width&&r.height&&!e.disabled)return '#'+id;}return null;})()`);
  need(opener,'No native Notifications opener');
  if(!await evaluate(`window.__CF_SLICE__.api.state().panelOpen==='notifications'`))
    await click(opener,'Open Notifications while the offline model draws');
  await until('responsive Notifications during offline inference',`window.__CF_SLICE__.api.state().panelOpen==='notifications'`,5000);
  const live=await observe('notifications-responsive-during-offline-inference');sameEarth(live);idle(live);
  need(jobOf(live).status==='generating','Notifications was measured only after inference');
  await screenshot('06-offline-live-notifications.png');
  let previous='',completed=null,sawStep=false;
  const deadline=started+900000; // Observer bound; each unchanged product stage retains its 600s timeout.
  while(performance.now()<deadline){
    const value=await evaluate(expression);sameEarth(value);idle(value);
    need(value.panelOpen==='notifications'&&!value.localAi.mounted,'Generation auto-navigated or mounted without View');
    const job=jobOf(value);need(job.jobId===initialJob.jobId&&JSON.stringify(job.input)===JSON.stringify(initialJob.input),
      'The live job changed its original recipe or identity');
    const key=JSON.stringify({status:job.status,progress:job.progress});
    if(key!==previous){previous=key;proof.progress.push({elapsedMs:performance.now()-started,status:job.status,progress:job.progress});
      console.log(JSON.stringify({offlineLandfall:job.status,...job.progress}));}
    if(/^Drawing [1-4] of 4$/.test(job.progress.phase)){sawStep=true;proof.modelExecuted=true;receipt.modelExecuted=true;}
    if(!proof.visibleProgress&&/^Drawing [2-3] of 4$/.test(job.progress.phase)){
      const ui=await evaluate(`(()=>{const row=document.querySelector('#notificationpanel [data-ai-landfall-job]');if(!row)return null;row.scrollIntoView({block:'center',behavior:'instant'});const p=row.querySelector('progress');if(!p)return null;const r=p.getBoundingClientRect();return {text:row.innerText,value:p.value,max:p.max,visible:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight&&p.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})};})()`);
      need(ui?.visible&&ui.max===100&&ui.value>0&&ui.value<100&&/Landing/.test(ui.text)&&/About \d+s drawing/.test(ui.text),
        'Actual drawing progress and ETA are not visible');proof.visibleProgress=ui;await screenshot('07-offline-visible-drawing-progress.png');
    }
    need(modelRequests()===originalRequestCount,'Offline inference attempted an external model request');
    if(job.status==='ready'){completed={value,job};break;}await pause(250);
  }
  need(completed&&sawStep&&proof.visibleProgress&&completed.job.originalId&&completed.job.progress.completed===100,
    'Actual offline generation failed to reach verified Ready with measured progress');
  proof.generationToReadyMs=performance.now()-started;proof.originalId=completed.job.originalId;
  await screenshot('08-offline-ready-without-auto-view.png');
  // The actual Inspect action reads and verifies through the product store.
  // Fetch its already displayed Blob read-only; no diagnostic writes or TS import.
  const viewerExpression=`(async()=>{const d=document.querySelector('#cf-landfall-viewer[data-ready="true"]'),img=d?.querySelector('img');if(!d?.open||!img?.complete||!img.naturalWidth||img.hidden||!img.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))throw Error('Actual original viewer is not ready');const r=await fetch(img.src);if(!r.ok)throw Error('Viewer Blob unavailable');const b=await r.blob();if(b.size>16*1024*1024)throw Error('Oversized original');const bytes=new Uint8Array(await b.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return {schema:'cf.offline-viewer-original.v1',originalId:d.dataset.originalId,sha256:d.dataset.imageSha256,width:img.naturalWidth,height:img.naturalHeight,type:b.type,bytes:b.size,base64:btoa(text)};})()`;
  await click('#notificationpanel [data-ai-act="inspect"]','Inspect the actual retained offline painting');
  await until('verified original viewer','!!document.querySelector(\'#cf-landfall-viewer[data-ready="true"]\')');
  const original=await evaluate(viewerExpression),bytes=assessOfflineOriginal(original,initialJob.input);
  need(original.originalId===completed.job.originalId,'Viewer read a different Ready original');
  const mutant={...original,sha256:'0'.repeat(64)};let rejected=false;try{assessOfflineOriginal(mutant,initialJob.input);}catch{rejected=true;}
  need(rejected,'Original content/identity mutation was accepted');assessOfflineOriginal(original,initialJob.input);proof.originalMutationRejected=true;
  await fs.writeFile(path.join(output,'raw-original.png'),bytes,{flag:'wx'});
  const {base64,...metadata}=original;proof.original=metadata;await write('retained-original.json',metadata);
  await screenshot('09-offline-full-painting-inspection.png');
  await click('#cf-landfall-viewer [data-landfall-viewer-action="close"]','Close offline painting inspection');
  await click('#notificationpanel [data-ai-act="view"]','Explicitly view the offline painting in the world');
  await until('normal original mount','window.__CF_SLICE__.api.state().localAi.mounted===true');
  const viewed=await observe('explicit-offline-view');sameEarth(viewed);idle(viewed);need(viewed.panelOpen===null,'View did not close Notifications');
  await screenshot('10-offline-viewed-landfall.png');
  proof.workerEvidenceBeforeReload=workerEvidence();
  proof.workerStartupEvidenceAvailable=proof.workerEvidenceBeforeReload.requests.length>proof.workerEvidenceBefore.requests.length
    ||proof.workerEvidenceBeforeReload.targets.length>proof.workerEvidenceBefore.targets.length;
  // Empty native observer arrays cannot certify absence of worker startup.
  // Keep that limit explicit while still proving UI/job and retained-byte outcomes.
  await cdp.send('Page.reload',{ignoreCache:false},sessionId);
  await until('new offline document restores original',`(()=>{const h=window.__CF_SLICE__;if(!h||h.documentToken===${JSON.stringify(viewed.documentToken)})return false;const s=h.api.state();return s.persistence.ready&&s.localAi.available&&s.localAi.mounted&&s.mode==='surface'&&s.planet===133;})()`,60000);
  const reloaded=await observe('offline-original-restored-after-reload');sameEarth(reloaded);idle(reloaded);
  need(reloaded.localAi.jobs.length===0&&reloaded.controller===initial.controller&&modelRequests()===originalRequestCount,
    'Offline reload started another model job/download or changed controller');
  const surveyOpener=await evaluate(`(()=>{for(const id of ['shelfsurvey','docksurvey']){const e=document.getElementById(id),r=e?.getBoundingClientRect();if(r?.width&&r.height&&!e.disabled)return '#'+id;}return null;})()`);
  need(surveyOpener,'No actual Survey opener after reload');await click(surveyOpener,'Open restored Earth Survey');
  await until('retained inspection from normal Survey','!!document.querySelector(\'#survey [data-ai-act="inspect-current"]\')');
  await click('#survey [data-ai-act="inspect-current"]','Inspect the original after offline reload');
  await until('reloaded verified original viewer','!!document.querySelector(\'#cf-landfall-viewer[data-ready="true"]\')');
  const after=await evaluate(viewerExpression),afterBytes=assessOfflineOriginal(after,initialJob.input);
  need(afterBytes.equals(bytes)&&after.originalId===original.originalId,'Reload changed retained PNG or full identity');
  const {base64:afterBase64,...afterMetadata}=after;proof.reloadedOriginal=afterMetadata;
  await screenshot('11-offline-reloaded-exact-original.png');
  await click('#cf-landfall-viewer [data-landfall-viewer-action="close"]','Close reloaded original inspection');
  proof.workerEvidenceAfterReload=workerEvidence();
  need(proof.workerEvidenceBeforeReload.requests.length===proof.workerEvidenceAfterReload.requests.length
    &&proof.workerEvidenceBeforeReload.targets.length===proof.workerEvidenceAfterReload.targets.length,
    'Reload or inspection started an additional measured inference worker');
  const finalState=await observe('reloaded-inspection-closed');sameEarth(finalState);idle(finalState);
  need(finalState.localAi.jobs.length===0,'Reload/inspection created a drawing job');
  proof.noReloadJobObserved=true;
  proof.status='PASS';proof.noOfflineModelRequests=true;
  proof.noReloadInference=proof.workerStartupEvidenceAvailable?true:null;
}
