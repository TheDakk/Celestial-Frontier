/** Native preparation/cancellation observer. Synthetic RGB workers only: no
 * ONNX imports, model requests, image generation, gameplay writes or art review.
 * Run once outside macOS Seatbelt using the repository-owned CDP launcher. */
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
const receipt={schema:'cf.recipe-preparation-native/v1',status:'FAIL',startedAt:new Date().toISOString(),
  scope:'Actual controller and HTTP/native trusted clicks; explicitly synthetic 2x1 RGB worker; no inference or art acceptance',
  qualityAccepted:false,sources:[],mutations:[],cases:[],browserEvents:[],requests:[],cleanup:{}};
const resultPath=path.join(directory,'result.json');
// Fail closed against overwriting an earlier attempt, even if it never completed.
await fs.writeFile(path.join(directory,'start.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
let server,cdp,activeCase=null;
const sockets=new Set(),held=new Map(),sourceBytes=new Map();
const syntheticRecipe={schema:'cf.synthetic-preparation-only/v1',width:2,height:1,steps:2,seed:133,
  modelRevision:'SYNTHETIC-NO-MODEL',chatPrompt:'Synthetic controller preparation audit only',references:[],
  appearanceSnapshot:{displayPlan:{residents:['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'].map(name=>({name}))}}};
const workerSource=`// EXPLICIT SYNTHETIC WORKER: no ORT, model loading, inference or art output.\nself.onmessage=({data:job})=>{\n  if(!['text','denoise','decode'].includes(job.stage)){self.postMessage({type:'error',message:'Unexpected synthetic stage'});return;}\n  self.postMessage({type:'progress',phase:'loading',synthetic:true});\n  self.postMessage({type:'progress',phase:'loaded',synthetic:true});\n  if(job.stage==='denoise')for(let step=1;step<=2;step++)self.postMessage({type:'progress',phase:'step',step,steps:2,synthetic:true});\n  const data=job.stage==='text'?new Uint16Array([1]):job.stage==='denoise'?new Float32Array([0]):new Float32Array([-.8,.8,-.4,.4,0,0]);\n  self.postMessage({type:'complete',data,synthetic:true},[data.buffer]);\n};\n`;
function exactMutation(text,before,after){
  assert(text.split(before).length===2,`Mutation must match exactly once: ${before}`);
  return text.replace(before,after);
}
function outcome(kind,sample,expected){
  const fail=message=>{throw Error(`${kind}: ${message}`);};
  const need=(condition,message)=>{if(!condition)fail(message);};
  const e=sample.elements,shown=id=>e[id]?.visible===true&&!e[id].hidden&&e[id].rect.width>0&&e[id].rect.height>0;
  need(sample.workerConstructed===expected.workers&&sample.workerRequests===expected.workers,'unexpected worker construction/request count');
  need(sample.completedWorkers===expected.workers&&sample.terminatedWorkers===expected.workers,'worker completion/retirement mismatch');
  need(sample.completeCount===expected.completions,'unexpected successful publication count');
  need(shown('generate')&&!e.generate.disabled&&e.cancel.disabled===true,'Land/Cancel did not settle');
  if(kind==='success'){
    need(sample.state==='complete'&&sample.landing?.state==='complete','success not published');
    need(sample.hasPng&&sample.pngPrefix&&sample.painting.width===2&&sample.painting.height===1,'missing synthetic 2x1 PNG');
    need(shown('painting')&&shown('notice')&&shown('notice-open'),'success painting/notification not visible');
    need(sample.landing.progress===1&&sample.meter.value===1,'success fraction not complete');
    return true;
  }
  need(sample.state==='failed','API did not settle failed');
  need(sample.landing?.state===(kind==='canceled'?'canceled':'failed'),'visible landing state is stale or pending');
  need(!sample.hasPng&&!shown('painting')&&e.painting.hidden===true,'failed preparation retained PNG/painting');
  need(!shown('notice')&&e.notice.hidden===true,'failed preparation retained notification');
  need(e['landing-progress'].hidden===true&&sample.landing.progress===0&&sample.meter.value===0,'failed preparation retained progress');
  need(!/Ready to view|Landing complete/i.test(e['landing-label'].text),'failed preparation retained old Ready/complete label');
  need(sample.lastFailure?.canceled===(kind==='canceled'),'failure cancellation classification');
  if(kind==='canceled')need(sample.recipeRequest?.clientClosedBeforeCleanup===true
    &&sample.recipeRequest.finished===false,'Cancel did not abort the held HTTP response before cleanup');
  else need(/HTTP503/.test(sample.error)&&sample.recipeRequest?.status===503,'expected recipe HTTP503 failure');
  return true;
}
async function saveJson(file,value){await fs.writeFile(path.join(directory,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function serverSample(entry){const {response,...retained}=entry;return retained;}
try{
  const files=['tools/local-image-generation/browser-proof.html','tools/local-image-generation/browser-proof.mjs',
    'tools/local-image-generation/landing-progress.mjs','port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs'];
  for(const file of files){const bytes=await fs.readFile(path.join(root,file));sourceBytes.set(file,bytes);receipt.sources.push({file,bytes:bytes.length,sha256:sha(bytes)});}
  const ownBytes=await fs.readFile(fileURLToPath(import.meta.url));receipt.adapter={file:path.relative(root,fileURLToPath(import.meta.url)),bytes:ownBytes.length,sha256:sha(ownBytes)};
  const current=sourceBytes.get('tools/local-image-generation/browser-proof.mjs').toString('utf8');
  const variants={current,
    'omit-fetch-signal':exactMutation(current,'fetch(url,{signal})','fetch(url)'),
    'omit-preparation-overlay':exactMutation(current,'const view=preparationView??landing.snapshot(),pending=', 'const view=landing.snapshot(),pending=')};
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
    if(pathname==='/recipe.json'){
      const entry={caseId:activeCase.id,index:activeCase.recipeRequests.length+1,mode:activeCase.mode,
        status:activeCase.mode==='failure'?503:activeCase.mode==='hold'?null:200,
        finished:false,clientClosedBeforeCleanup:false,cleanupStarted:false,response};
      activeCase.recipeRequests.push(entry);
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
  cdp=await openChromiumCdp({label:'CF recipe preparation native audit',userDataPrefix:'cf-recipe-preparation-',commandTimeoutMs:15000,onEvent:event=>{
    if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed','Network.loadingFailed'].includes(event.method)){
      if(receipt.browserEvents.length<200)receipt.browserEvents.push({caseId:activeCase?.id??null,...event});else receipt.browserEventOverflow=true;
    }
  }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  async function runCase(id,variant,kind,negative=false){
    const item={id,variant,kind,negative,status:'RUNNING',mode:kind==='cancel'?'hold':'success',workerRequests:0,
      recipeRequests:[],unexpectedRequests:[],observations:[],clicks:[],screenshots:[],cleanup:{}};
    activeCase=item;receipt.cases.push(item);
    let targetId,sessionId;
    const evaluate=async expression=>{const value=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description??value.exceptionDetails.text);return value.result.value;};
    async function observe(label){
      const sample=await evaluate(`(()=>{const inspect=id=>{const e=document.getElementById(id);if(!e)return {exists:false};const r=e.getBoundingClientRect();let visible=r.width>0&&r.height>0;
        for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(n.hidden||c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||Number(c.opacity)===0)visible=false;}
        return {exists:true,visible,hidden:e.hidden,disabled:e.disabled??null,text:e.innerText??e.textContent??'',rect:{x:r.x,y:r.y,width:r.width,height:r.height}};};
        const api=window.cfImageProof,events=api.records;return {state:api.state,landing:api.landing??null,error:api.error??null,hasPng:typeof api.png==='string',pngPrefix:api.png?.startsWith('data:image/png;base64,')??false,
          workerConstructed:window.__preparationAudit.workerConstructed,completedWorkers:events.filter(e=>e.stage&&e.type==='complete').length,terminatedWorkers:events.filter(e=>e.phase==='worker-terminated').length,
          completeCount:events.filter(e=>!e.stage&&e.phase==='complete').length,lastFailure:events.filter(e=>e.phase==='failed').at(-1)??null,events,
          painting:{width:document.getElementById('painting').width,height:document.getElementById('painting').height},
          meter:{value:document.getElementById('landing-meter').value,max:document.getElementById('landing-meter').max},
          elements:Object.fromEntries(['generate','cancel','painting','notice','notice-open','landing-progress','landing-label','planet-panel','journal-panel'].map(id=>[id,inspect(id)]))};})()`);
      sample.workerRequests=item.workerRequests;sample.recipeRequest=item.recipeRequests.length?serverSample(item.recipeRequests.at(-1)):null;
      item.observations.push({label,atMs:performance.now(),...sample});return sample;
    }
    async function until(label,predicate,timeoutMs=5000){
      const deadline=performance.now()+timeoutMs;let sample;
      do{sample=await observe(label);if(predicate(sample))return sample;await pause(50);}while(performance.now()<deadline);
      return sample;
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
    function judge(label,sample,expected,expectReject=false){
      let error=null;try{outcome(label,sample,expected);}catch(failure){error=String(failure.message);}
      const judged={outcome:label,expected,expectReject,accepted:error===null,error};(item.judgments??=[]).push(judged);
      if(expectReject){assert(error!==null,'Broken source unexpectedly passed the same outcome predicate');}
      else assert(error===null,error);
    }
    try{
      ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
      ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
      for(const domain of ['Page','Runtime','Log','Network'])await cdp.send(`${domain}.enable`,{},sessionId);
      await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
      // Constructor counter delegates immediately to the genuine browser Worker;
      // the actual controller is untouched. The served worker is explicitly synthetic.
      await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__preparationAudit={workerConstructed:0,clicks:[]};const AuditNativeWorker=window.Worker;window.Worker=class extends AuditNativeWorker{constructor(...args){super(...args);window.__preparationAudit.workerConstructed++;}};document.addEventListener('click',event=>{if(window.__preparationAudit.clicks.length>=20)throw Error('Audit click overflow');window.__preparationAudit.clicks.push({id:event.target.closest?.('button')?.id??null,isTrusted:event.isTrusted});},true);`},sessionId);
      await cdp.send('Page.navigate',{url},sessionId);
      const deadline=performance.now()+10000;while(!await evaluate('!!window.cfImageProof')){assert(performance.now()<deadline,'Actual page did not initialize');await pause(50);}
      await evaluate('window.cfImageProof.buttonOptions={referenceEnabled:false,profile:false}');
      await observe('initial');
      await click('generate');
      if(kind==='cancel'){
        const pending=await until('held-recipe',s=>item.recipeRequests.length===1&&s.state==='running');
        assert(item.recipeRequests.length===1&&pending.state==='running'&&pending.workerConstructed===0,'Held recipe did not reach real pending preparation');
        await click('cancel');
        const canceled=await until('after-cancel',s=>s.state==='failed'&&s.recipeRequest?.clientClosedBeforeCleanup===true,2000);
        await screenshot('cancel-outcome');judge('canceled',canceled,{workers:0,completions:0},negative);
        if(negative)assert(canceled.state==='running'&&canceled.recipeRequest?.clientClosedBeforeCleanup===false&&canceled.workerConstructed===0,
          'Omitted-signal negative did not reproduce pending/unaborted HTTP');
      }else{
        const first=await until('seed-success',s=>s.state!=='running');judge('success',first,{workers:3,completions:1});
        item.mode='failure';await click('generate');
        const failed=await until('after-503',s=>s.state!=='running');await screenshot('failure-outcome');
        judge('failed',failed,{workers:3,completions:1},negative);
        if(negative)assert(failed.state==='failed'&&failed.landing?.state==='complete'&&failed.meter.value===1,
          'Omitted-overlay negative did not reproduce stale successful view');
        else{
          item.mode='success';await click('generate');
          const restored=await until('retry-success',s=>s.state!=='running');judge('success',restored,{workers:6,completions:2});
          await screenshot('retry-success');
        }
      }
      assert(item.unexpectedRequests.length===0,'Unexpected source/model request');
      item.status=negative?'EXPECTED_REJECTION':'PASS';
    }catch(error){item.status='FAIL';item.error=String(error.stack??error);throw error;}
    finally{
      // Preserve the pre-cleanup HTTP outcome; destruction below cannot count as
      // cancellation evidence. Close every owned response/target before next case.
      for(const [response,entry] of held)if(entry.caseId===id){entry.cleanupStarted=true;response.destroy();held.delete(response);}
      item.recipeRequests=item.recipeRequests.map(serverSample);
      if(targetId)try{const closed=await cdp.send('Target.closeTarget',{targetId});assert(closed.success===true,'Owned target not closed');item.cleanup.targetClosed=true;}
      catch(error){item.cleanup.error=String(error);item.status='FAIL';throw error;}
      await saveJson(`${id}.json`,item);activeCase=null;
    }
  }
  await runCase('01-cancel-current','current','cancel');
  await runCase('02-cancel-without-signal','omit-fetch-signal','cancel',true);
  await runCase('03-cancel-restored','current','cancel');
  await runCase('04-success-failure-retry-current','current','retry');
  await runCase('05-stale-view-without-overlay','omit-preparation-overlay','retry',true);
  await runCase('06-success-failure-retry-restored','current','retry');
  assert(!receipt.requestOverflow&&!receipt.browserEventOverflow,'Bounded evidence overflow');
  assert(!receipt.browserEvents.some(event=>['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(event.method)),'Unexpected native exception/crash');
  receipt.status='PASS_SYNTHETIC_PREPARATION_CONTROLS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{await cdp?.close();receipt.cleanup.browserClosed=Boolean(cdp);}catch(error){receipt.cleanup.browserError=String(error);receipt.status='FAIL';process.exitCode=1;}
  for(const [response,entry] of held){entry.cleanupStarted=true;response.destroy();}held.clear();
  if(server)try{const closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));for(const socket of sockets)socket.destroy();await closed;receipt.cleanup.serverClosed=true;}
    catch(error){receipt.cleanup.serverError=String(error);receipt.status='FAIL';process.exitCode=1;}
  receipt.cleanup.sourceRecheck=[];
  for(const [file,original] of sourceBytes)try{const current=await fs.readFile(path.join(root,file));const unchanged=sha(original)===sha(current);receipt.cleanup.sourceRecheck.push({file,unchanged,sha256:sha(current)});if(!unchanged){receipt.status='FAIL';process.exitCode=1;}}
    catch(error){receipt.cleanup.sourceRecheck.push({file,error:String(error)});receipt.status='FAIL';process.exitCode=1;}
  // Remove nonserializable live responses if startup/case cleanup failed early.
  for(const item of receipt.cases)item.recipeRequests=item.recipeRequests.map(serverSample);
  receipt.completedAt=new Date().toISOString();await fs.writeFile(resultPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:receipt.status,cases:receipt.cases.map(({id,status})=>({id,status})),result:path.relative(root,resultPath)}));
