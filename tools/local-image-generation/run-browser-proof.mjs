import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {createProofServer} from './proof-server.mjs';
import {fetchModel,assertIgnoredCache,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';
import {parseProofOptions} from './gpu-profile.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
import {validateUiSample,validateUiClickGeometry,validateUiClickDelivery} from './landing-ui-evidence.mjs';
import {exportCanonicalEarthSnapshot} from '../../port/v2/tools/landfall-snapshot/export.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const runCommand=promisify(execFile);
const options=parseProofOptions(process.argv.slice(2)),{output}=options;
const destination=path.resolve(output);await fs.mkdir(destination,{recursive:true});
const resultPath=path.join(destination,'result.json');
try{await fs.access(resultPath);throw Error('Evidence destination already completed; choose a new directory');}catch(e){if(e.code!=='ENOENT')throw e;}
const manifest=JSON.parse(await fs.readFile(path.join(directory,'model-manifest.json'),'utf8'));
const cacheDir=path.join(DEFAULT_CACHE_ROOT,manifest.modelId.replace('/','--'),manifest.revision);
await assertIgnoredCache(cacheDir);
const receipt={schema:'cf.browser-image-proof-run/v1',startedAt:new Date().toISOString(),status:'FAIL',
  referenceEnabled:options.referenceEnabled,preflight:options.preflight,
  identityReference:options.identityReference,identityOnly:options.identityOnly,profile:options.profile,q8Block32:options.q8Block32,fixedDenoiserShapes:options.fixedDenoiserShapes,denoiserShapeOverrides:null,width:options.width,height:options.height,profiles:[],
  modelRevision:manifest.revision,sourceSha256:{},events:[],memory:[],browserEvents:[],qualityAccepted:false};
for(const name of await fs.readdir(directory))if(/\.(mjs|json|html)$/.test(name))receipt.sourceSha256[name]=createHash('sha256').update(await fs.readFile(path.join(directory,name))).digest('hex');
await fs.writeFile(path.join(destination,'start.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
let server,cdp;
try{
  const canonical=await exportCanonicalEarthSnapshot(path.join(destination,'canonical-input'));
  receipt.canonicalExport=canonical.receipt;
  if(!receipt.preflight){
    const verified=await fetchModel({manifest,cacheDir,verifyOnly:true});
    receipt.modelVerification=verified.receipt;
  }
  server=await createProofServer({cacheDir,canonical,identityReference:receipt.identityReference,identityOnly:receipt.identityOnly,width:receipt.width,height:receipt.height,q8Block32:receipt.q8Block32,fixedDenoiserShapes:receipt.fixedDenoiserShapes});
  receipt.runtimeFiles=server.runtimeFiles;
  await fs.writeFile(path.join(destination,'recipe.json'),JSON.stringify(server.recipe,null,2)+'\n',{flag:'wx'});
  cdp=await openChromiumCdp({label:'CF browser image inference',userDataPrefix:'cf-browser-image-',commandTimeoutMs:45000,onEvent:event=>{
    if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method))receipt.browserEvents.push(event);
  }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  const {targetId}=await cdp.send('Target.createTarget',{url:server.url});
  const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
  await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Log.enable',{},sessionId);
  const evaluate=async expression=>{
    const response=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
    if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);
    return response.result.value;
  };
  const readyDeadline=performance.now()+15000;
  while(!await evaluate('!!window.cfImageProof')){if(performance.now()>readyDeadline)throw Error('Proof page failed to initialize');await new Promise(r=>setTimeout(r,100));}
  if(receipt.preflight){
    receipt.page=await evaluate(`({state:window.cfImageProof.state,crossOriginIsolated,webgpu:!!navigator.gpu})`);
    if(!receipt.page.crossOriginIsolated||!receipt.page.webgpu)throw Error('Page capability boundary failed');
    const served=await evaluate(`fetch('/recipe.json').then(response=>{if(!response.ok)throw Error('Recipe HTTP failed');return response.json();})`);
    if(JSON.stringify(served)!==JSON.stringify(server.recipe))throw Error('Served canonical recipe mismatch');
    receipt.page.servedRecipeSha256=createHash('sha256').update(JSON.stringify(served)).digest('hex');
    receipt.page.canonicalRecipeMatched=true;
    receipt.status='PREFLIGHT_PASS';
  }else{
    const desktopViewport={width:1280,height:1000,deviceScaleFactor:1,mobile:false};
    await cdp.send('Emulation.setDeviceMetricsOverride',desktopViewport,sessionId);
    const expectedNames=Array.from(server.recipe.appearanceSnapshot.displayPlan.residents,row=>row.name);
    if(expectedNames.length!==6||new Set(expectedNames).size!==6||expectedNames.some(name=>typeof name!=='string'||!name))
      throw Error('Canonical UI roster must name six distinct residents');
    const expectedUi={names:expectedNames,width:receipt.width,height:receipt.height,
      jobKey:JSON.stringify({config:server.recipe,referenceEnabled:receipt.referenceEnabled,profile:receipt.profile})};
    const expectedClickIds=['generate','explore','planet','explore','notice-open'];
    receipt.uiInteraction={schema:'cf.browser-landing-interaction/v1',status:'RUNNING',
      buttonOptions:{referenceEnabled:receipt.referenceEnabled,profile:receipt.profile},
      expectedNames,jobKey:expectedUi.jobKey,expectedClickIds,desktopViewport,clicks:[],samples:[],screenshots:[],progressObserved:false};
    await evaluate(`(() => {
      window.cfImageProof.buttonOptions=${JSON.stringify(receipt.uiInteraction.buttonOptions)};
      window.__cfProofNativeClicks=[];
      document.addEventListener('click',event=>{
        const rows=window.__cfProofNativeClicks;
        if(rows.length>=16){window.__cfProofNativeClickOverflow=true;return;}
        rows.push({id:event.target.closest?.('button')?.id??null,isTrusted:event.isTrusted,
          x:event.clientX,y:event.clientY,atMs:performance.now(),state:window.cfImageProof.state});
      },true);
    })()`);
    const sampleUi=async phase=>{
      const sample=await evaluate(`(() => {
        const inspect=id=>{
          const element=document.getElementById(id);if(!element)return {exists:false};
          const r=element.getBoundingClientRect();let visible=r.width>0&&r.height>0;
          for(let node=element;node;node=node.parentElement){const css=getComputedStyle(node);
            if(node.hidden||css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse'||Number(css.opacity)===0)visible=false;}
          return {exists:true,hidden:element.hidden,visible,disabled:element.disabled??null,
            rect:{x:r.x,y:r.y,width:r.width,height:r.height},text:element.innerText??element.textContent??''};
        };
        const elements=Object.fromEntries(['generate','planet','explore','notice-open','planet-panel','journal-panel',
          'notice','landing-progress','landing-label','landing-meter','painting','roster'].map(id=>[id,inspect(id)]));
        const meter=document.getElementById('landing-meter'),painting=document.getElementById('painting');
        return {state:window.cfImageProof.state,jobKey:window.cfImageProof.landing?.key??null,
          landingState:window.cfImageProof.landing?.state??null,
          startCount:window.cfImageProof.records.filter(row=>row.phase==='start').length,
          denoiseStep:Math.max(0,...window.cfImageProof.records.filter(row=>row.stage==='denoise'&&row.phase==='step').map(row=>row.step)),
          atMs:performance.now(),viewport:{width:innerWidth,height:innerHeight,
          scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},
          elements,meter:meter?{value:meter.value,max:meter.max,hasValue:meter.hasAttribute('value')}:null,
          painting:painting?{width:painting.width,height:painting.height}:null};
      })()`);
      receipt.uiInteraction.samples.push({phase,...sample});
      validateUiSample(phase,sample,expectedUi);
      return sample;
    };
    const takeUiScreenshot=async (file,scope='controlled desktop interaction')=>{
      const metrics=await cdp.send('Page.getLayoutMetrics',{},sessionId);
      const content=metrics.cssContentSize??metrics.contentSize;
      const width=Math.ceil(content.width),height=Math.ceil(content.height);
      if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>4096||height>8000)
        throw Error('Native screenshot content dimensions exceed the bounded UI capture');
      const clip={x:0,y:0,width,height,scale:1};
      const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip},sessionId);
      const bytes=Buffer.from(capture.data,'base64');if(!bytes.length)throw Error('Empty native UI screenshot');
      await fs.writeFile(path.join(destination,file),bytes,{flag:'wx'});
      receipt.uiInteraction.screenshots.push({file,scope,clip,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
    };
    const clickUi=async id=>{
      const interaction={id,phase:'measuring',startedAt:new Date().toISOString()};receipt.uiInteraction.clicks.push(interaction);
      try{
        const observed=await evaluate(`(() => {
          const id=${JSON.stringify(id)},button=document.getElementById(id);
          if(!button)return {exists:false};
          button.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
          const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
          let visible=r.width>0&&r.height>0;
          for(let node=button;node;node=node.parentElement){const css=getComputedStyle(node);
            if(node.hidden||css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse'||Number(css.opacity)===0)visible=false;}
          const hit=document.elementFromPoint(x,y);
          return {exists:true,visible,disabled:button.disabled,x,y,rect:{x:r.x,y:r.y,width:r.width,height:r.height},
            viewport:{width:innerWidth,height:innerHeight},hitId:hit?.id??null,hitMatches:hit?.closest('button')===button,
            clickCount:window.__cfProofNativeClicks.length};
        })()`);
        interaction.geometry=observed;
        validateUiClickGeometry(id,observed);
        interaction.phase='dispatching';
        const {x,y}=observed;
        await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1},sessionId);
        await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1},sessionId);
        const delivered=await evaluate(`({overflow:!!window.__cfProofNativeClickOverflow,events:window.__cfProofNativeClicks.slice(${observed.clickCount})})`);
        interaction.events=delivered.events;
        validateUiClickDelivery(id,delivered);
        interaction.phase='delivered';
      }catch(error){interaction.phase='FAIL';interaction.error=String(error);throw error;}
    };
    // Exercise the actual DOM sampler and the same acceptor with a hidden
    // ancestor. Retain the rejected observation and require restored admission.
    const proveHiddenControl=async(phase,id,expectedDiagnosis)=>{
      const entry={phase,id,status:'FAIL'};(receipt.uiInteraction.visibilityControls??=[]).push(entry);
      const previous=await evaluate(`(() => {const el=document.getElementById(${JSON.stringify(id)});const old=el.hidden;el.hidden=true;return old;})()`);
      let rejection;
      try{await sampleUi(phase);}catch(error){rejection=String(error.message??error);}
      finally{await evaluate(`document.getElementById(${JSON.stringify(id)}).hidden=${JSON.stringify(previous)}`);}
      entry.rejection=rejection??null;
      if(rejection!==expectedDiagnosis)throw Error('Native hidden control did not reject its exact outcome: '+id);
      await sampleUi(phase);entry.restored=true;entry.status='PASS';
    };
    await sampleUi('before-generate');
    await clickUi('generate');
    // Observe an actual worker message, not merely the button handler setting a
    // running label. This waits for settlement once; it never repeats a click.
    const workerDeadline=performance.now()+30000;
    while(true){
      const observed=await evaluate(`({state:window.cfImageProof.state,error:window.cfImageProof.error,records:window.cfImageProof.records})`);
      receipt.events=observed.records;
      if(observed.state==='failed')throw Error(observed.error);
      const loading=observed.records.find(row=>row.stage==='text'&&row.phase==='loading');
      if(loading){
        const starts=observed.records.filter(row=>row.phase==='start');
        if(observed.state!=='running'||starts.length!==1||starts[0].referenceEnabled!==receipt.referenceEnabled||starts[0].profile!==receipt.profile)
          throw Error('Native Generate did not start the requested running recipe');
        receipt.uiInteraction.workerStarted={...loading};break;
      }
      if(performance.now()>workerDeadline)throw Error('Native Generate did not start a real worker before its deadline');
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    await sampleUi('running-planet');
    await proveHiddenControl('running-planet','landing-progress','Landing UI running-planet: pending progress must replace Land and be visible on the planet');
    await clickUi('explore');
    await sampleUi('running-journal');
    await takeUiScreenshot('ui-running-journal.png');
    const deadline=performance.now()+25*60*1000;let delivered=0;
    while(true){
      const state=await evaluate(`({state:window.cfImageProof.state,error:window.cfImageProof.error,records:window.cfImageProof.records,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null})`);
      receipt.events=state.records;receipt.pageHeap=state.heap;
      if(!receipt.uiInteraction.progressObserved&&state.records.some(row=>row.stage==='denoise'&&row.phase==='step'&&row.step>=2)){
        await clickUi('planet');
        await sampleUi('denoise-progress');
        await takeUiScreenshot('ui-running-progress.png');
        await clickUi('explore');
        await sampleUi('progress-returned-journal');
        receipt.uiInteraction.progressObserved=true;
      }
      if(receipt.profile){
        // Retrieve each bounded raw trace once, outside the frequently polled
        // records/DOM text. Save partial red traces too, before propagating failure.
        const pending=await evaluate(`window.cfImageProof.profiles.slice(${receipt.profiles.length})`);
        for(const profile of pending){
          if(receipt.profiles.length>=5)throw Error('Excess profile stages');
          const index=receipt.profiles.length+1;
          if(!['text','encode','denoise','decode'].includes(profile.stage))throw Error('Unexpected profile stage');
          const file=`native-profile-${index}-${profile.stage}.json`;
          const {rawJson,...summary}=profile;
          if(typeof rawJson==='string'){
            await fs.writeFile(path.join(destination,file),rawJson,{flag:'wx'});
            summary.rawFile=file;summary.rawSha256=createHash('sha256').update(rawJson).digest('hex');
          }
          receipt.profiles.push(summary);
          await fs.writeFile(path.join(destination,`native-profile-${index}-${profile.stage}-summary.json`),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
        }
      }
      if(state.records.length>delivered){for(const row of state.records.slice(delivered))console.log(JSON.stringify(row));delivered=state.records.length;
        await fs.writeFile(path.join(destination,'progress.json'),JSON.stringify({events:receipt.events,memory:receipt.memory},null,2)+'\n');}
      const {stdout}=await runCommand('/bin/ps',['-axo','pid=,ppid=,rss=']);
      const rows=stdout.trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number));
      const owned=new Set([cdp.pid]);let grew=true;while(grew){grew=false;for(const [pid,ppid]of rows)if(owned.has(ppid)&&!owned.has(pid)){owned.add(pid);grew=true;}}
      receipt.memory.push({atMs:performance.now(),processCount:owned.size,summedProcessRssKiB:rows.filter(row=>owned.has(row[0])).reduce((sum,row)=>sum+row[2],0)});
      if(state.state==='failed')throw Error(state.error);
      if(state.state==='complete'){
        if(receipt.fixedDenoiserShapes){
          const loaded=receipt.events.filter(row=>row.stage==='denoise'&&row.phase==='loaded');
          const referenceTokens=receipt.referenceEnabled?server.recipe.references.reduce((sum,row)=>sum+(row.width/16)*(row.height/16),0):0;
          const expected={batch:1,image_sequence:(receipt.height/16)*(receipt.width/16)+referenceTokens,text_sequence:512};
          if(loaded.length!==1||JSON.stringify(loaded[0].freeDimensionOverrides)!==JSON.stringify(expected))
            throw Error('Requested fixed denoiser dimensions were not observed at session load');
          receipt.denoiserShapeOverrides={...loaded[0].freeDimensionOverrides};
        }
        if(receipt.profile){
          const expectedStages=['text',...(receipt.referenceEnabled?server.recipe.references.map(()=> 'encode'):[]),'denoise','decode'];
          if(JSON.stringify(receipt.profiles.map(x=>x.stage))!==JSON.stringify(expectedStages)
            ||receipt.profiles.some(x=>x.state!=='complete'||!x.endedBeforeRelease||!x.sessionReleased||x.summary?.status!=='COMPLETE'
              ||x.summary.dropped!==0||x.summary.invalid!==0||!x.rawFile))throw Error('Native profile completion contract failed');
        }
        const png=await evaluate('window.cfImageProof.png');if(!png?.startsWith('data:image/png;base64,'))throw Error('No generated PNG');
        const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
        receipt.output={file:'raw-output.png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
        await fs.writeFile(path.join(destination,receipt.output.file),bytes,{flag:'wx'});
        // Retain the raw model output even if this final UI boundary fails.
        if(!receipt.uiInteraction.progressObserved)throw Error('No visible denoise progress observation');
        await sampleUi('complete-still-journal');
        await proveHiddenControl('complete-still-journal','notice','Landing UI complete-still-journal: completion must notify while keeping the journal selected');
        await clickUi('notice-open');
        await sampleUi('complete-returned-planet');
        const terminalClicks=await evaluate('({overflow:!!window.__cfProofNativeClickOverflow,events:window.__cfProofNativeClicks})');
        receipt.uiInteraction.terminalClicks=terminalClicks;
        if(terminalClicks.overflow||JSON.stringify(terminalClicks.events.map(row=>row.id))!==JSON.stringify(expectedClickIds)
          ||terminalClicks.events.some(row=>row.isTrusted!==true)||receipt.uiInteraction.clicks.length!==5)
          throw Error('Expected exactly five trusted landing/navigation clicks');
        await takeUiScreenshot('ui-complete-returned-planet.png');
        // Reflow the completed image only. This is a scoped small-phone layout
        // diagnostic, not phone inference, touch qualification or another click.
        const phoneViewport={width:320,height:568,deviceScaleFactor:1,mobile:true};
        await cdp.send('Emulation.setDeviceMetricsOverride',phoneViewport,sessionId);
        await sampleUi('completed-phone-layout-diagnostic');
        receipt.uiInteraction.phoneLayout={scope:'post-completion 320x568 layout only; no inference rerun or touch/device qualification',
          viewport:phoneViewport,status:'FAIL'};
        await takeUiScreenshot('ui-complete-phone-layout.png','post-completion small-phone layout diagnostic only');
        receipt.uiInteraction.phoneLayout.status='PASS';
        receipt.uiInteraction.status='PASS';
        receipt.status='INFERENCE_COMPLETE_REVIEW_PENDING';break;
      }
      if(performance.now()>deadline)throw Error('Overall inference deadline exceeded');
      await new Promise(r=>setTimeout(r,5000));
    }
  }
}catch(error){receipt.error=String(error.stack??error);if(receipt.uiInteraction)receipt.uiInteraction.status='FAIL';process.exitCode=1;}
finally{
  try{await cdp?.close();receipt.browserClosed=true;}catch(error){receipt.cleanupError=String(error);process.exitCode=1;receipt.status='FAIL';}
  if(server){receipt.requests=server.requests;try{await server.close();}catch(error){receipt.serverCleanupError=String(error);receipt.status='FAIL';process.exitCode=1;}}
  receipt.finishedAt=new Date().toISOString();
  receipt.memoryMeaning='Sum of owned browser process RSS; shared mappings may count multiple times. Not unique RAM, VRAM or a device qualification.';
  receipt.sourceIntegrity=await recheckSourceFiles([
    ...Object.entries(receipt.sourceSha256).map(([name,hash])=>({path:'tools/local-image-generation/'+name,file:path.join(directory,name),sha256:hash})),
    ...(receipt.canonicalExport?.sources??[]).map(row=>({...row,file:path.resolve(directory,'../..',row.path)})),
  ]);
  receipt.sourceUnchanged=receipt.sourceIntegrity.unchanged;
  if(!receipt.sourceUnchanged){receipt.status='FAIL';process.exitCode=1;}
  await fs.writeFile(resultPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:receipt.status,error:receipt.error,output:receipt.output,resultPath}));
}
