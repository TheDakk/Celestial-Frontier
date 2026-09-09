/** Bounded native review-controller observer. Actual controller, trusted clicks
 * and real loopback HTTP; explicit synthetic 2x1 RGB workers. No ONNX, model
 * requests, inference, gameplay writes or art acceptance. Run once outside
 * macOS Seatbelt. Existing attempts and all evidence are immutable wx files. */
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../../port/v2/tools/browsercdp.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
const receipt={schema:'cf.review-controller-native/v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'Actual controller, HTTP and trusted Land/navigation/View clicks; synthetic 2x1 RGB only; visible friendly failure/cancel, identity refusal and restored Earth return; no inference or art acceptance',
  qualityAccepted:false,sources:[],mutations:[],cases:[],browserEvents:[],requests:[],cleanup:{}};
const resultPath=path.join(directory,'result.json');
// Fail closed against overwriting an earlier attempt, even if it never completed.
await fs.writeFile(path.join(directory,'start.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
let server,cdp,activeCase=null;
const sockets=new Set(),held=new Map(),sourceBytes=new Map();
const earthWorldKey='CF1|g:999@90,-60|s:424242@560,170|p:133#2';
const environmentFingerprint='synthetic-review-environment';
const snapshotSha256='a'.repeat(64);
const expectedDestination={worldKey:earthWorldKey,environmentFingerprint,ecologyEpoch:0,snapshotSha256};
const syntheticRecipe={schema:'cf.synthetic-review-controller-only/v1',width:2,height:1,steps:2,seed:133,
  modelRevision:'SYNTHETIC-NO-MODEL',chatPrompt:'Synthetic controller review audit only',references:[],
  request:{worldKey:earthWorldKey,environmentFingerprint},roster:{worldKey:earthWorldKey,environmentFingerprint,ecologyEpoch:0},
  appearanceSnapshot:{sha256:snapshotSha256,displayPlan:{worldKey:earthWorldKey,environmentFingerprint,
    residents:['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'].map(name=>({name}))}}};
const workerSource=`// EXPLICIT SYNTHETIC WORKER: no ORT, model loading, inference or art output.\nself.onmessage=({data:job})=>{\n  if(!['text','denoise','decode'].includes(job.stage)){self.postMessage({type:'error',message:'Unexpected synthetic stage'});return;}\n  self.postMessage({type:'progress',phase:'loading',synthetic:true});\n  self.postMessage({type:'progress',phase:'loaded',synthetic:true});\n  if(job.stage==='denoise')for(let step=1;step<=2;step++)self.postMessage({type:'progress',phase:'step',step,steps:2,synthetic:true});\n  const data=job.stage==='text'?new Uint16Array([1]):job.stage==='denoise'?new Float32Array([0]):new Float32Array([-.8,.8,-.4,.4,0,0]);\n  self.postMessage({type:'complete',data,synthetic:true},[data.buffer]);\n};\n`;
function outcome(kind,sample,expected){
  const need=(condition,message)=>assert(condition,`${kind}: ${message}`);
  const e=sample.elements,shown=id=>e[id]?.visible===true&&!e[id].hidden&&e[id].rect.width>0&&e[id].rect.height>0;
  need(sample.workerConstructed===expected.workers&&sample.workerRequests===expected.workers,'unexpected worker construction/request count');
  need(sample.completedWorkers===expected.workers&&sample.terminatedWorkers===expected.workers,'worker completion/retirement mismatch');
  need(sample.completeCount===expected.completions,'unexpected successful publication count');
  need(!e.generate.disabled&&e.cancel.disabled===true,'Land/Cancel did not settle');
  const inJournal=expected.panel==='journal';
  need(shown(inJournal?'journal-panel':'planet-panel')&&!shown(inJournal?'planet-panel':'journal-panel'),'wrong visible destination panel');
  if(kind==='success'||kind==='return'){
    need(sample.state==='complete'&&sample.landing?.state==='complete','success not published');
    need(sample.hasPng&&sample.pngPrefix&&sample.painting.width===2&&sample.painting.height===1,'missing synthetic 2x1 PNG');
    need(sample.landing.progress===1&&sample.meter.value===1,'success fraction not complete');
    need(JSON.stringify(sample.completionDestination)===JSON.stringify(expectedDestination),'completion destination not bound to submitted synthetic identity');
    need(sample.boundWorld===earthWorldKey&&sample.noticeWorld===earthWorldKey,'Earth/notification binding drifted');
    need(!shown('landing-error'),'success retained friendly failure');
    if(kind==='return'){
      need(shown('painting')&&!shown('notice')&&e.notice.hidden===true,'explicit return did not reveal painting and consume notice');
      need(sample.png===expected.png&&sample.landing.key===expected.key,'return changed the completed image/job');
    }else need(shown('notice')&&shown('notice-open')&&!shown('painting'),'completion did not remain in journal with visible return notification');
    return true;
  }
  need(sample.state==='failed'&&sample.landing?.state===(kind==='canceled'?'canceled':'failed'),'API/landing did not settle failed or canceled');
  need(!sample.hasPng&&!shown('painting')&&e.painting.hidden===true,'failure retained PNG/painting');
  need(!shown('notice')&&e.notice.hidden===true,'failure retained completion notification');
  need(e['landing-progress'].hidden===true&&sample.landing.progress===0&&sample.meter.value===0,'failure retained progress');
  need(!/Ready to view|Landing complete/i.test(e['landing-label'].text),'failure retained Ready/complete label');
  const message=kind==='canceled'?'Landing canceled. Select Earth to start again.':'Landing unavailable. Select Earth to try again.';
  need(shown('landing-error')&&e['landing-error'].text===message,'friendly outcome is absent, wrong or hidden by an ancestor');
  need(e.status.text===(kind==='canceled'?'Landing canceled':'Landing unavailable'),'technical error leaked into player status');
  need(sample.lastFailure?.canceled===(kind==='canceled'),'failure cancellation classification');
  if(kind==='canceled')need(sample.recipeRequest?.clientClosedBeforeCleanup===true&&sample.recipeRequest.finished===false,'Cancel did not abort held HTTP before cleanup');
  else need(/HTTP503/.test(sample.error)&&sample.recipeRequest?.status===503,'expected real recipe HTTP503 failure');
  return true;
}
const serializeEvidence=value=>JSON.stringify(value,null,2)+'\n';
async function saveJson(file,value){await fs.writeFile(path.join(directory,file),serializeEvidence(value),{flag:'wx'});}
function recipeEntry(caseId,index,mode){return {caseId,index,mode,status:mode==='failure'?503:mode==='hold'?null:200,
  finished:false,clientClosedBeforeCleanup:false,cleanupStarted:false};}
function serverSample(entry){return {...entry};}
function serializationControl(){
  // Exercise the actual entry factory and serializer, including a callback that
  // changes pending evidence during cleanup. No HTTP objects belong in entries.
  const entry=recipeEntry('synthetic-serialization-control',1,'hold');
  const sample={closing:false,recipeRequests:[entry],cleanupRequests:[]};
  const cleanupCallback=()=>{sample.closing=true;entry.cleanupStarted=true;
    sample.cleanupRequests.push({path:'/recipe.json',status:410,cleanupTime:true});};
  cleanupCallback();
  const restored=JSON.parse(serializeEvidence(sample));
  assert(restored.recipeRequests.length===1&&restored.recipeRequests[0].cleanupStarted
    &&restored.cleanupRequests[0].status===410&&!Object.hasOwn(restored.recipeRequests[0],'response'),
    'Data-only pending/cleanup serialization control failed');
  const oldSocket={};oldSocket.socket=oldSocket;
  const broken={...sample,recipeRequests:[{...entry,response:oldSocket}]};
  let rejected=false;try{serializeEvidence(broken);}catch(error){rejected=error instanceof TypeError;}
  assert(rejected,'Circular legacy response control unexpectedly serialized');
  assert(JSON.parse(serializeEvidence(sample)).closing===true,'Restored serialization control failed');
  return {status:'PASS',syntheticEntry:true,pendingCleanupCallbackSerialized:true,circularResponseRejected:true,restorationSerialized:true};
}
try{
  receipt.readOnlyTemplate={file:'audits/CLAUDE_DIRECTION_REVIEW_20260909/recipe-preparation-native-02/run.mjs',
    immutable:true,reused:'Data-only serializer controls, owned HTTP/target/browser cleanup, trusted CDP clicks and wx evidence'};
  receipt.serializationControl=serializationControl();
  const files=['tools/local-image-generation/browser-proof.html','tools/local-image-generation/browser-proof.mjs',
    'tools/local-image-generation/landing-progress.mjs','port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs',
    receipt.readOnlyTemplate.file];
  for(const file of files){const bytes=await fs.readFile(path.join(root,file));sourceBytes.set(file,bytes);receipt.sources.push({file,bytes:bytes.length,sha256:sha(bytes)});}
  const ownBytes=await fs.readFile(fileURLToPath(import.meta.url));receipt.adapter={file:path.relative(root,fileURLToPath(import.meta.url)),bytes:ownBytes.length,sha256:sha(ownBytes)};
  const current=sourceBytes.get('tools/local-image-generation/browser-proof.mjs').toString('utf8');
  const variants={current};
  await fs.mkdir(path.join(directory,'served-source'));
  for(const [name,source] of Object.entries(variants)){
    const file=`served-source/browser-proof-${name}.mjs`;await fs.writeFile(path.join(directory,file),source,{flag:'wx'});
    receipt.mutations.push({variant:name,file,bytes:Buffer.byteLength(source),sha256:sha(source),trackedSourceModified:false});
  }
  for(const name of ['browser-proof.html','landing-progress.mjs'])await fs.writeFile(path.join(directory,'served-source',name),sourceBytes.get(`tools/local-image-generation/${name}`),{flag:'wx'});
  await fs.writeFile(path.join(directory,'served-source','synthetic-stage-worker.mjs'),workerSource,{flag:'wx'});
  receipt.syntheticWorker={file:'served-source/synthetic-stage-worker.mjs',bytes:Buffer.byteLength(workerSource),sha256:sha(workerSource)};
  await saveJson('synthetic-recipe.json',syntheticRecipe);
  server=http.createServer((request,response)=>{
    response.setHeader('Cache-Control','no-store');response.setHeader('Cross-Origin-Opener-Policy','same-origin');response.setHeader('Cross-Origin-Embedder-Policy','require-corp');
    const pathname=new URL(request.url,'http://localhost').pathname;
    const row={caseId:activeCase?.id??null,path:pathname,method:request.method,atMs:performance.now(),status:null};
    receipt.requests.push(row);
    if(receipt.requests.length>150){receipt.requestOverflow=true;response.writeHead(500).end();return;}
    const send=(status,type,body)=>{row.status=status;response.writeHead(status,{'Content-Type':type});response.end(body);};
    if(!activeCase||request.method!=='GET'){send(400,'text/plain','No active owned case');return;}
    if(activeCase.closing){
      row.cleanupTime=true;activeCase.cleanupRequests.push({path:pathname,method:request.method,status:410,atMs:row.atMs});
      send(410,'text/plain','Owned case is closing');return;
    }
    if(pathname==='/recipe.json'){
      const entry=recipeEntry(activeCase.id,activeCase.recipeRequests.length+1,activeCase.mode);
      entry.requestRowIndex=receipt.requests.length-1;activeCase.recipeRequests.push(entry);
      response.on('finish',()=>{entry.finished=true;});
      response.on('close',()=>{if(!entry.finished&&!entry.cleanupStarted)entry.clientClosedBeforeCleanup=true;held.delete(response);});
      request.on('aborted',()=>{entry.requestAbortedEvent=true;});
      if(activeCase.mode==='hold'){held.set(response,entry);return;}
      if(activeCase.mode==='failure'){send(503,'application/json',JSON.stringify({error:'Controlled preparation failure'}));return;}
      send(200,'application/json',JSON.stringify(syntheticRecipe));return;
    }
    if(pathname==='/stage-worker.mjs'){activeCase.workerRequests++;send(200,'text/javascript',workerSource);return;}
    if(pathname==='/browser-proof.mjs'){send(200,'text/javascript',variants[activeCase.variant]);return;}
    if(pathname==='/landing-progress.mjs'){send(200,'text/javascript',sourceBytes.get('tools/local-image-generation/landing-progress.mjs'));return;}
    if(pathname==='/'){send(200,'text/html',sourceBytes.get('tools/local-image-generation/browser-proof.html'));return;}
    activeCase.unexpectedRequests.push(pathname);send(404,'text/plain','Unexpected audit request');
  });
  server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const url=`http://127.0.0.1:${server.address().port}/`;receipt.server={url,loopbackOnly:true};
  cdp=await openChromiumCdp({label:'CF review controller native audit',userDataPrefix:'cf-review-controller-',commandTimeoutMs:15000,onEvent:event=>{
    if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed','Network.loadingFailed'].includes(event.method)){
      if(receipt.browserEvents.length<200)receipt.browserEvents.push({caseId:activeCase?.id??null,...event});else receipt.browserEventOverflow=true;
    }
  }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  function releaseRecipe(mode){
    assert(['success','failure'].includes(mode),'Unknown controlled HTTP release');
    assert(held.size===1,'Expected one held HTTP response');
    for(const [response,entry] of held){
      assert(entry.caseId===activeCase.id&&!entry.clientClosedBeforeCleanup,'Held response is stale');
      entry.status=mode==='failure'?503:200;entry.releasedAs=mode;
      receipt.requests[entry.requestRowIndex].status=entry.status;
      response.writeHead(entry.status,{'Content-Type':'application/json'});
      response.end(JSON.stringify(mode==='failure'?{error:'Controlled review preparation failure'}:syntheticRecipe));
      held.delete(response);
    }
  }
  async function runCase(id,kind){
    const item={id,variant:'current',kind,status:'RUNNING',mode:'hold',workerRequests:0,
      closing:false,recipeRequests:[],cleanupRequests:[],unexpectedRequests:[],observations:[],clicks:[],screenshots:[],cleanup:{}};
    activeCase=item;receipt.cases.push(item);
    let targetId,sessionId;
    const evaluate=async expression=>{const value=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description??value.exceptionDetails.text);return value.result.value;};
    async function observe(label){
      assert(item.observations.length<180,'Bounded observation overflow');
      const sample=await evaluate(`(()=>{const inspect=id=>{const e=document.getElementById(id);if(!e)return {exists:false};const r=e.getBoundingClientRect();let visible=r.width>0&&r.height>0;
        for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(n.hidden||c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||Number(c.opacity)===0)visible=false;}
        return {exists:true,visible,hidden:e.hidden,disabled:e.disabled??null,text:e.innerText??e.textContent??'',rect:{x:r.x,y:r.y,width:r.width,height:r.height}};};
        const api=window.cfImageProof,events=api.records;return {state:api.state,landing:api.landing??null,error:api.error??null,hasPng:typeof api.png==='string',png:api.png??null,pngPrefix:api.png?.startsWith('data:image/png;base64,')??false,
          completionDestination:api.completionDestination??null,boundWorld:document.getElementById('planet').getAttribute('data-world-key'),noticeWorld:document.getElementById('notice-open').getAttribute('data-world-key'),
          workerConstructed:window.__preparationAudit.workerConstructed,completedWorkers:events.filter(e=>e.stage&&e.type==='complete').length,terminatedWorkers:events.filter(e=>e.phase==='worker-terminated').length,
          completeCount:events.filter(e=>!e.stage&&e.phase==='complete').length,lastFailure:events.filter(e=>e.phase==='failed').at(-1)??null,events,
          painting:{width:document.getElementById('painting').width,height:document.getElementById('painting').height},
          meter:{value:document.getElementById('landing-meter').value,max:document.getElementById('landing-meter').max},
          elements:Object.fromEntries(['generate','cancel','painting','notice','notice-open','landing-progress','landing-label','landing-error','status','planet-panel','journal-panel'].map(id=>[id,inspect(id)]))};})()`);
      sample.workerRequests=item.workerRequests;sample.recipeRequest=item.recipeRequests.length?serverSample(item.recipeRequests.at(-1)):null;
      item.observations.push({label,atMs:performance.now(),...sample});return sample;
    }
    async function until(label,predicate,timeoutMs=5000){
      const deadline=performance.now()+timeoutMs;let sample;
      do{sample=await observe(label);if(predicate(sample))return sample;await pause(50);}while(performance.now()<deadline);
      assert(false,`${label}: expected state did not arrive within ${timeoutMs} ms`);
    }
    async function click(id){
      const entry={id};item.clicks.push(entry);
      entry.geometry=await evaluate(`(()=>{const b=document.getElementById(${JSON.stringify(id)});b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;let visible=r.width>0&&r.height>0;
        for(let n=b;n;n=n.parentElement){const c=getComputedStyle(n);if(n.hidden||c.display==='none'||c.visibility==='hidden'||Number(c.opacity)===0)visible=false;}
        return {visible,disabled:b.disabled,x,y,width:innerWidth,height:innerHeight,hit:document.elementFromPoint(x,y)?.closest('button')?.id,count:window.__preparationAudit.clicks.length};})()`);
      const g=entry.geometry;assert(g.visible&&!g.disabled&&g.hit===id&&g.x>=0&&g.x<g.width&&g.y>=0&&g.y<g.height,`${id}: native control not actionable`);
      await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:g.x,y:g.y,button:'left',buttons:1,clickCount:1},sessionId);
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:g.x,y:g.y,button:'left',buttons:0,clickCount:1},sessionId);
      entry.delivered=await evaluate(`window.__preparationAudit.clicks.slice(${g.count})`);
      assert(entry.delivered.length===1&&entry.delivered[0].id===id&&entry.delivered[0].isTrusted===true,`${id}: one trusted click not delivered`);
    }
    async function screenshot(label){
      const file=`${id}-${label}.png`,capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);
      const bytes=Buffer.from(capture.data,'base64');assert(bytes.length>0,'Empty native screenshot');
      await fs.writeFile(path.join(directory,file),bytes,{flag:'wx'});item.screenshots.push({file,bytes:bytes.length,sha256:sha(bytes)});
    }
    function judge(label,kind,sample,expected,expectReject=false,expectedError=null){
      let error=null;try{outcome(kind,sample,expected);}catch(failure){error=String(failure.message);}
      const judged={label,outcome:kind,expected,expectReject,accepted:error===null,error};(item.judgments??=[]).push(judged);
      if(expectReject){assert(error!==null,'Broken observed state unexpectedly passed the same outcome predicate');
        if(expectedError)assert(error.includes(expectedError),`Wrong rejection diagnosis: ${error}`);}
      else assert(error===null,error);
    }
    async function hiddenOutcomeControl(kind,expected){
      const mutation={caseId:id,kind:'actual-DOM-hidden-ancestor',target:'landing-error',trackedSourceModified:false};receipt.mutations.push(mutation);
      mutation.applied=await evaluate(`(()=>{const e=document.getElementById('landing-error');if(document.getElementById('audit-hidden-outcome'))throw Error('Duplicate audit wrapper');const wrapper=document.createElement('div');wrapper.id='audit-hidden-outcome';wrapper.hidden=true;e.before(wrapper);wrapper.append(e);return e.parentElement.hidden;})()`);
      assert(mutation.applied,'Hidden-ancestor control did not mutate actual DOM');
      try{
        const hidden=await observe('friendly-outcome-hidden-ancestor');
        assert(hidden.elements['landing-error'].hidden===false&&!hidden.elements['landing-error'].visible,'Control did not specifically hide an unhidden child through its ancestor');
        judge('hidden ancestor rejected',kind,hidden,expected,true,'friendly outcome is absent, wrong or hidden by an ancestor');
        await screenshot('friendly-hidden-control');
      }finally{
        mutation.restored=await evaluate(`(()=>{const wrapper=document.getElementById('audit-hidden-outcome'),e=document.getElementById('landing-error');if(e.parentElement!==wrapper)throw Error('Owned wrapper changed');wrapper.replaceWith(e);return !document.getElementById('audit-hidden-outcome')&&!e.hidden;})()`);
      }
      assert(mutation.restored,'Friendly outcome DOM restoration failed');
      judge('hidden ancestor restored',kind,await observe('friendly-outcome-restored'),expected);
    }
    try{
      ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
      ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
      for(const domain of ['Page','Runtime','Log','Network'])await cdp.send(`${domain}.enable`,{},sessionId);
      await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
      // Count genuine Worker construction; the served worker is synthetic.
      await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__preparationAudit={workerConstructed:0,clicks:[]};const AuditNativeWorker=window.Worker;window.Worker=class extends AuditNativeWorker{constructor(...args){super(...args);window.__preparationAudit.workerConstructed++;}};document.addEventListener('click',event=>{if(window.__preparationAudit.clicks.length>=30)throw Error('Audit click overflow');window.__preparationAudit.clicks.push({id:event.target.closest?.('button')?.id??null,isTrusted:event.isTrusted});},true);`},sessionId);
      await cdp.send('Page.navigate',{url},sessionId);
      const deadline=performance.now()+10000;while(!await evaluate('!!window.cfImageProof')){assert(performance.now()<deadline,'Actual page did not initialize');await pause(50);}
      await evaluate('window.cfImageProof.buttonOptions={referenceEnabled:false,profile:false}');
      await observe('initial');await click('generate');
      const pending=await until('held-recipe',s=>item.recipeRequests.length===1&&s.state==='running');
      assert(pending.workerConstructed===0,'Held preparation unexpectedly constructed workers');
      if(kind==='canceled')await click('cancel');
      await click('explore');
      const journalPending=await observe('trusted-navigation-to-journal');
      assert(journalPending.elements['journal-panel'].visible&&!journalPending.elements['planet-panel'].visible,'Trusted navigation did not show journal');
      if(kind==='failed')releaseRecipe('failure');
      if(kind==='success')releaseRecipe('success');
      if(kind!=='success'){
        const settled=await until('friendly-settled-in-journal',s=>s.state==='failed'&&(kind!=='canceled'||s.recipeRequest?.clientClosedBeforeCleanup===true));
        const expected={workers:0,completions:0,panel:'journal'};
        judge('friendly outcome in journal',kind,settled,expected);await screenshot('friendly-journal');
        await hiddenOutcomeControl(kind,expected);
        await click('planet');
        judge('friendly outcome in Earth',kind,await observe('friendly-settled-in-Earth'),{...expected,panel:'planet'});
        await screenshot('friendly-Earth');
      }else{
        const complete=await until('complete-in-journal',s=>s.state==='complete');
        const expected={workers:3,completions:1,panel:'journal'};
        judge('completion retains journal',kind,complete,expected);await screenshot('complete-in-journal');
        const returnExpected={workers:3,completions:1,panel:'planet',png:complete.png,key:complete.landing.key};
        const identityMutations=[
          {name:'recipe-world',get:'window.cfImageProof.recipe.request.worldKey',value:earthWorldKey+'-MUTANT'},
          {name:'recipe-environment',get:'window.cfImageProof.recipe.request.environmentFingerprint',value:environmentFingerprint+'-MUTANT'},
          {name:'recipe-epoch',get:'window.cfImageProof.recipe.roster.ecologyEpoch',value:1},
          {name:'recipe-snapshot',get:'window.cfImageProof.recipe.appearanceSnapshot.sha256',value:'b'.repeat(64)},
          {name:'notice-world',attribute:'notice-open',value:earthWorldKey+'-MUTANT'},
          {name:'panel-world',attribute:'planet',value:earthWorldKey+'-MUTANT'}
        ];
        for(const spec of identityMutations){
          const read=spec.attribute?`document.getElementById(${JSON.stringify(spec.attribute)}).getAttribute('data-world-key')`:spec.get;
          const write=value=>spec.attribute?`document.getElementById(${JSON.stringify(spec.attribute)}).setAttribute('data-world-key',${JSON.stringify(value)})`:`${spec.get}=${JSON.stringify(value)}`;
          const original=await evaluate(read),mutation={caseId:id,kind:'actual-completion-identity',name:spec.name,original,mutated:spec.value,trackedSourceModified:false};receipt.mutations.push(mutation);
          await evaluate(write(spec.value));assert(await evaluate(read)===spec.value,`${spec.name}: identity mutation was not applied`);
          try{
            await click('notice-open');const refused=await observe(`${spec.name}-trusted-View-refused`);
            judge(`${spec.name} cannot satisfy the same return outcome`,'return',refused,returnExpected,true,'wrong visible destination panel');
            assert(refused.elements['journal-panel'].visible&&!refused.elements['planet-panel'].visible
              &&refused.elements.notice.visible&&refused.elements['notice-open'].visible&&refused.png===complete.png
              &&refused.state==='complete'&&refused.landing.key===complete.landing.key,
              `${spec.name}: refusal consumed notice, changed the completed image or navigated`);
            mutation.refusalVerified=true;
          }finally{
            await evaluate(write(original));mutation.restored=await evaluate(read)===original;
          }
          assert(mutation.restored,`${spec.name}: identity restoration failed`);
          judge(`${spec.name} restored available completion`,'success',await observe(`${spec.name}-restored`),expected);
        }
        await screenshot('all-identities-restored');await click('notice-open');
        judge('restored trusted return','return',await observe('restored-return-Earth'),returnExpected);
        await screenshot('restored-return-Earth');
      }
      assert(item.recipeRequests.length===1,'A flow unexpectedly made another recipe request');
      assert(item.unexpectedRequests.length===0,'Unexpected source/model request');
      item.status='PASS';
    }catch(error){item.status='FAIL';item.error=String(error.stack??error);throw error;}
    finally{
      // Evidence stores only data. Refuse late requests, close the owned target,
      // retire unfinished responses, and only then serialize the case.
      item.closing=true;for(const entry of item.recipeRequests)entry.cleanupStarted=true;
      let cleanupFailure=null;
      if(targetId)try{const closed=await cdp.send('Target.closeTarget',{targetId});assert(closed.success===true,'Owned target not closed');item.cleanup.targetClosed=true;}
      catch(error){item.cleanup.error=String(error);item.status='FAIL';cleanupFailure=error;}
      for(const [response,entry] of held)if(entry.caseId===id){entry.cleanupStarted=true;response.destroy();held.delete(response);}
      item.cleanup.heldResponsesRetired=true;await saveJson(`${id}.json`,item);activeCase=null;
      if(cleanupFailure)throw cleanupFailure;
    }
  }
  await runCase('01-friendly-HTTP503','failed');
  await runCase('02-friendly-cancel','canceled');
  await runCase('03-identity-bound-return','success');
  assert(!receipt.requestOverflow&&!receipt.browserEventOverflow,'Bounded evidence overflow');
  assert(!receipt.browserEvents.some(event=>['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(event.method)),'Unexpected native exception/crash');
  receipt.status='PASS_SYNTHETIC_REVIEW_CONTROLLER_CONTROLS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{await cdp?.close();receipt.cleanup.browserClosed=Boolean(cdp);}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
  for(const [response,entry] of held){entry.cleanupStarted=true;response.destroy();}held.clear();
  if(server)try{const closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));for(const socket of sockets)socket.destroy();await closed;receipt.cleanup.serverClosed=true;}
    catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.cleanup.sourceRecheck=[];
  for(const [file,original] of sourceBytes)try{const current=await fs.readFile(path.join(root,file));const unchanged=sha(original)===sha(current);receipt.cleanup.sourceRecheck.push({file,unchanged,sha256:sha(current)});if(!unchanged){receipt.status='FAIL';process.exitCode=1;}}
    catch(error){receipt.cleanup.sourceRecheck.push({file,error:String(error)});receipt.status='FAIL';process.exitCode=1;}
  // The same serializer is used by the unit control, per-case and final receipt.
  receipt.completedAt=new Date().toISOString();await fs.writeFile(resultPath,serializeEvidence(receipt),{flag:'wx'});
}
console.log(JSON.stringify({status:receipt.status,cases:receipt.cases.map(({id,status})=>({id,status})),result:path.relative(root,resultPath)}));
