import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Run under the shared toolchain lock, outside macOS Seatbelt; fresh isolated profile/origin only.
// node audits/AV_CHARTER_SETTLEMENT_AUDIO_20260908/native-runner.mjs /absolute/evidence-dist /absolute/fresh-output
assert.equal(process.argv.length,4,'Expected evidence-dist and fresh-output');
const repo=fs.realpathSync(fileURLToPath(new URL('../..',import.meta.url))),dist=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]);
assert(!fs.existsSync(out)&&!out.startsWith(dist+path.sep),'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)),path.dirname(out),'Output parent must be real and existing');fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'runner.mjs'),fs.constants.COPYFILE_EXCL);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={schema:'cf-native-charter-settlement-audio/v1',status:'RUNNING',certification:false,startedAt:new Date().toISOString(),dist,sources:{},served:{},steps:[],screenshots:[],errors:[],limitations:[
  'One native Starter Charter acceptance on a fresh expedition; existing read-only and pending-action hooks supply negative controls only.',
  'Actual shared AudioBuffer source start/end observation is not human listening, speaker output or physical iPhone/Safari acceptance.',
  'Scoped diagnostic, not Slice/Glass certification or a broad audio battery.']};
const sourceFiles=['apps/game/src/main.ts','apps/game/src/audiovisual-pilot.ts','apps/game/src/tame-greeting-audio.ts','apps/game/src/pilot-sound-player.ts','apps/game/src/pilot-pcm.ts','apps/game/src/pilot-assets.ts','apps/game/src/starter-charters.ts','packages/audio/src/runtime.ts','packages/persistence/src/migration-v5.ts','packages/persistence/src/export-v2.ts','apps/game/assets/pilot/audio/cf-pilot-ui-settlement.wav'];
for(const name of [...sourceFiles.map(p=>'port/v2/'+p),path.relative(repo,fileURLToPath(import.meta.url))])report.sources[name]=hash(fs.readFileSync(path.join(repo,name)));
const persist=()=>fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{try{assert(req.method==='GET'||req.method==='HEAD');const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),file=fs.realpathSync(path.resolve(dist,'.'+(name==='/'?'/index.html':name)));assert(file.startsWith(dist+path.sep)&&fs.statSync(file).isFile());const bytes=fs.readFileSync(file),key=path.relative(dist,file),digest=hash(bytes);assert(!report.served[key]||report.served[key]===digest,'Served bytes changed');report.served[key]=digest;res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes)}catch{res.writeHead(404);res.end('Not found')}});
const S='window.__CF_SLICE__',trace='window.__cfCharterAudio';
const ready=`(()=>{const s=${S}?.api.state(),p=s?.persistence,r=p?.runtime;return p?.ready===true&&p.hold===null&&p.seedBootstrapPending===false&&p.bootRouteRepairPending===false&&p.mutationBlocked===false&&p.documentToken===${S}.documentToken&&r?.visible===true&&r.answerable===true&&r.leaseOwned===true&&r.accruing===true&&r.staleBlocked===false&&s.sceneResources.pendingPersistenceWrites===0})()`;
const snapshot=`(()=>{const s=${S}?.api.state();return s?{at:performance.now(),documentToken:${S}.documentToken,mode:s.mode,navStarKey:s.navStarKey,navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,save:s.save,persistence:s.persistence,pending:s.sceneResources.pendingPersistenceWrites,panel:s.panelOpen,panelBusy:document.querySelector('#chpanel')?.getAttribute('aria-busy'),charters:document.querySelector('[data-starter-charter-board]')?.textContent,viewport:[innerWidth,innerHeight,devicePixelRatio],audio:s.audio,trace:${trace}}:null})()`;
const settlement=`${trace}.sources.filter(s=>s.startSucceeded&&Math.abs(s.duration-.7)<1e-6)`;
// Read actual V5 player segment, compatibility mirror and immutable outcome receipts in one readonly transaction.
const durable=`(async()=>{const q=indexedDB.open('cf-v2-slice'),db=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});try{const tx=db.transaction(['meta','player','receipts'],'readonly'),done=new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error);tx.onabort=()=>j(tx.error||Error('Durable read aborted'))}),get=(store,key)=>new Promise((r,j)=>{const a=tx.objectStore(store).get(key);a.onsuccess=()=>r(a.result);a.onerror=()=>j(a.error)}),all=new Promise((r,j)=>{const a=tx.objectStore('receipts').getAll();a.onsuccess=()=>r(a.result);a.onerror=()=>j(a.error)});const [revision,legacy,player,rows]=await Promise.all([get('meta','f3:revision'),get('meta','save'),get('player','v5:player'),all]);await done;const l=JSON.parse(String(legacy)),p=JSON.parse(String(player));if(p.schema!==5||p.segment!=='player')throw Error('Wrong durable player schema');return{revision:Number(revision),legacyShaInput:String(legacy),legacy:{chacc:l.chacc,chs:l.chs,chp:l.chp},player:{chacc:p.data.chacc,chs:p.data.chs,chp:p.data.chp},receipts:rows.map(r=>JSON.parse(String(r))).filter(r=>r.kind==='arc8-starter-charter-accept-v1')}}finally{db.close()}})()`;
function installAudioObserver(){
  const log=window.__cfCharterAudio={inputs:[],sources:[],faults:[]},contexts=new WeakMap();let contextCount=0;
  const contextId=context=>{if(!contexts.has(context))contexts.set(context,++contextCount);return contexts.get(context)};
  const state=()=>{const s=window.__CF_SLICE__?.api.state();return s?{at:performance.now(),documentToken:window.__CF_SLICE__.documentToken,mode:s.mode,navStarKey:s.navStarKey,navWorldKey:s.navWorldKey,chacc:s.save.chacc,chDone:s.save.chDone,revision:s.persistence.runtime.revision,ordinal:s.persistence.runtime.sessionOrdinal,lastOutcome:s.persistence.lastOutcome,mutationBlocked:s.persistence.mutationBlocked,answerable:s.persistence.runtime.answerable,leaseOwned:s.persistence.runtime.leaseOwned,pending:s.sceneResources.pendingPersistenceWrites,panelBusy:document.querySelector('#chpanel')?.getAttribute('aria-busy')}:null};
  document.addEventListener('click',e=>{if(log.inputs.length<80)log.inputs.push({at:performance.now(),trusted:e.isTrusted,charterId:e.target.closest?.('[data-starter-charter-accept]')?.dataset.starterCharterAccept??null,text:e.target.closest?.('button')?.textContent?.slice(0,100)??null})},true);
  const proto=AudioContext.prototype,create=proto.createBufferSource;
  proto.createBufferSource=function(...args){const node=create.apply(this,args),start=node.start,stop=node.stop;let item=null;
    node.start=function(...startArgs){item={createdContext:contextId(node.context),at:performance.now(),contextTime:node.context.currentTime,contextState:node.context.state,duration:node.buffer?.duration,frames:node.buffer?.length,sampleRate:node.buffer?.sampleRate,channels:node.buffer?.numberOfChannels,loop:node.loop,startArgs};
      if(Math.abs(item.duration-.7)<1e-6)try{item.publication=state()}catch(e){log.faults.push(String(e))}
      if(log.sources.length>=100){if(log.faults.length<10)log.faults.push('Audio diagnostic source bound')}else log.sources.push(item);
      try{const result=start.apply(this,startArgs);item.startSucceeded=true;return result}catch(e){item.startError=String(e);throw e}};
    node.stop=function(...stopArgs){if(item){item.stopRequestedAt=performance.now();item.stopArgs=stopArgs}return stop.apply(this,stopArgs)};
    node.addEventListener('ended',()=>{if(item){item.endedAt=performance.now();item.endedContextTime=node.context.currentTime}});return node};
}
let browser,send,evaluate,forceReadOnly=false,held=false;
try{
  await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)});report.origin=`http://127.0.0.1:${server.address().port}`;persist();
  browser=await openChromiumCdp({label:'native Charter settlement audio',userDataPrefix:'cf-charter-audio-20260908',commandTimeoutMs:15000,onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails)}});report.browser=browser.browser;
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});send=(method,params={})=>browser.send(method,params,sessionId);
  await send('Runtime.enable');await send('Page.enable');
  evaluate=async expression=>{report.pendingEvaluation={expression,sha256:hash(expression),at:new Date().toISOString()};persist();const a=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!a.exceptionDetails,JSON.stringify(a.exceptionDetails));report.pendingEvaluation=null;return a.result.value};
  const frames=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const wait=async(name,condition)=>{const step={name,condition,status:'WAITING'};report.steps.push(step);persist();const end=Date.now()+20000;while(!await evaluate(condition)){assert(Date.now()<end,'Timed out: '+name);await delay(100)}step.status='PASS';persist()};
  const click=async selector=>{const point=await evaluate(`(async()=>{const a=document.querySelectorAll(${JSON.stringify(selector)});if(a.length!==1)throw Error('Nonunique '+${JSON.stringify(selector)});const e=a[0];e.scrollIntoView({block:'center'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||b.width<=0||b.height<=0||!(h===e||e.contains(h)))throw Error('Occluded '+${JSON.stringify(selector)});return{x,y}})()`),before=await evaluate(`${trace}.inputs.length`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point,button:'none'});await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});await frames();
    const inputs=await evaluate(`${trace}.inputs.slice(${before})`);assert(inputs.length===1&&inputs[0].trusted,'Exactly one trusted click required');report.steps.push({name:'native click',selector,point,input:inputs[0]});persist();return inputs[0]};
  const shot=async name=>{const {data}=await send('Page.captureScreenshot',{format:'png'}),bytes=Buffer.from(data,'base64');fs.writeFileSync(path.join(out,name+'.png'),bytes,{flag:'wx'});report.screenshots.push({path:name+'.png',sha256:hash(bytes)});persist()};
  const readDurable=async()=>{const d=await evaluate(durable);d.legacySha256=hash(d.legacyShaInput);delete d.legacyShaInput;return d};
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(${installAudioObserver.toString()})()`});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await send('Page.navigate',{url:report.origin+'/?avpilot=1'});await wait('fresh answerable pilot',`${S}?.api&&${ready}&&document.querySelector('[data-cf-audiovisual-pilot]')`);
  if(await evaluate(`${S}.api.state().tutActive`)){await click('[data-sel=tutskip]');await wait('Training closed',`!${S}.api.state().tutActive&&${ready}`)}
  report.initial=await evaluate(snapshot);assert.deepEqual(report.initial.viewport,[390,844,2]);assert.equal(await evaluate(`${S}.app.renderer.resolution`),2);assert(await evaluate(`${S}.api.state().sndOn&&${S}.api.state().fxOn`),'Fresh Sound/Effects must be enabled');
  await click('[data-cf-pilot-controls] summary');assert.equal(await evaluate(`document.querySelector('[data-cf-pilot-controls] button:nth-of-type(2)').textContent`),'Play pilot sound');await click('[data-cf-pilot-controls] button:nth-of-type(2)');
  await wait('native pilot opt-in starts shared music',`document.querySelector('[data-cf-pilot-controls] [role=status]')?.textContent.includes('Exploration phrase playing')&&${trace}.sources.some(s=>s.startSucceeded&&Math.abs(s.duration-24)<1e-6)`);
  await click('[data-cf-pilot-controls] summary');await click('#objchip');
  const selector='#chpanel [data-starter-charter-accept="st-land"]';await wait('native Make planetfall acceptance available',`document.querySelector(${JSON.stringify(selector)})?.disabled===false&&${ready}`);
  report.before=await evaluate(snapshot);report.durableBefore=await readDurable();assert(!report.before.save.chacc.includes('st-land')&&!report.before.save.chDone.includes('st-land'));assert.equal(await evaluate(`${settlement}.length`),0);await shot('charter-available-phone');
  // Existing refusal seam keeps the visible button enabled; the native capture guard owns rejection.
  assert(await evaluate(`${S}.api.__smokeForceReadOnly(true)`));forceReadOnly=true;const blocks=report.before.persistence.mutationBlockCount;
  report.refusalInput=await click(selector);await wait('trusted acceptance refused by write guard',`${S}.api.state().persistence.mutationBlockCount===${blocks+1}`);await delay(1000);
  report.refusal=await evaluate(snapshot);report.refusalDurable=await readDurable();assert.equal(await evaluate(`${settlement}.length`),0,'Refused acceptance played settlement');assert.deepEqual(report.refusalDurable.player,report.durableBefore.player);assert.deepEqual(report.refusalDurable.receipts,report.durableBefore.receipts);
  assert.equal(report.refusal.persistence.mutationBlockWitness.action,'click:BUTTON');assert(report.refusalInput.trusted&&report.refusalInput.charterId==='st-land');
  assert.equal(await evaluate(`${S}.api.__smokeForceReadOnly(false)`),false);forceReadOnly=false;await wait('writable after refusal cleanup',ready);
  // Hold the real action before its durable write; captured native activation must stay silent while pending.
  assert(await evaluate(`${S}.api.__smokeArmProductActionHold()`));held=true;report.acceptInput=await click(selector);
  await wait('real acceptance pending',`document.querySelector('#chpanel')?.getAttribute('aria-busy')==='true'&&${S}.api.state().sceneResources.pendingPersistenceWrites===1`);await delay(200);
  report.pending=await evaluate(snapshot);assert.equal(await evaluate(`${settlement}.length`),0,'Pending acceptance played success');assert(!report.pending.save.chacc.includes('st-land')&&!report.pending.save.chDone.includes('st-land'));
  report.releasedAt=await evaluate(`(()=>{const at=performance.now();if(!${S}.api.__smokeReleaseProductActionHold())throw Error('Action hold did not release');return at})()`);held=false;
  await wait('committed Charter and exactly one finite settlement source',`${ready}&&(${S}.api.state().save.chacc.includes('st-land')||${S}.api.state().save.chDone.includes('st-land'))&&${settlement}.length===1&&${settlement}[0].endedAt!==undefined`);
  report.after=await evaluate(snapshot);report.durableAfter=await readDurable();report.settlement=await evaluate(`${settlement}[0]`);
  const cue=report.settlement,p=cue.publication;assert(report.acceptInput.trusted&&report.acceptInput.charterId==='st-land');assert(cue.contextState==='running'&&cue.loop===false&&cue.channels===1&&cue.sampleRate===48000&&cue.frames===33600);
  assert(Number.isFinite(cue.stopRequestedAt)&&cue.endedContextTime-cue.contextTime>=.67,'Finite source ended early or missed owner stop');
  assert(cue.at>=report.releasedAt&&cue.at>report.acceptInput.at&&cue.endedAt>cue.at&&cue.endedAt-cue.at<2500,'Settlement did not finish within its finite bound');
  assert(p&&p.documentToken===report.before.documentToken&&(p.chacc.includes('st-land')||p.chDone.includes('st-land'))&&p.pending===0&&p.panelBusy==='false'&&!p.mutationBlocked&&p.answerable&&p.leaseOwned,'Source started before successful publication/barrier release');
  assert.equal(p.lastOutcome,'starter-charter-accept-committed:'+p.revision);assert.equal(p.navStarKey,report.before.navStarKey);assert.equal(p.navWorldKey,report.before.navWorldKey);
  assert(report.before.trace.sources.some(s=>s.startSucceeded&&Math.abs(s.duration-24)<1e-6&&s.createdContext===cue.createdContext),'Settlement did not use the original shared context');
  const receipts=report.durableAfter.receipts.filter(r=>!report.durableBefore.receipts.some(b=>b.ordinal===r.ordinal));assert.equal(receipts.length,1,'Exactly one durable acceptance receipt required');assert(/^cf-v2-starter-charter-accept-witness\/v1:[0-9a-f]{64}$/.test(receipts[0].witness));assert.equal(receipts[0].ordinal,p.ordinal);
  const beforeIds=[...report.before.save.chacc,...report.before.save.chDone],afterIds=[...report.after.save.chacc,...report.after.save.chDone];assert.deepEqual(afterIds.filter(id=>!beforeIds.includes(id)),['st-land']);assert(beforeIds.every(id=>afterIds.includes(id)));
  assert(report.durableAfter.revision>=p.revision&&p.revision>report.durableBefore.revision);assert.deepEqual(report.durableAfter.player,report.durableAfter.legacy);assert.deepEqual(report.durableAfter.player.chacc,report.after.save.chacc);assert.deepEqual(report.durableAfter.player.chs,report.after.save.chDone);
  assert(report.durableAfter.player.chacc.includes('st-land')||report.durableAfter.player.chs.includes('st-land'));assert.equal(report.after.documentToken,report.before.documentToken);assert.equal(report.after.mode,report.before.mode);
  await delay(900);report.final=await evaluate(snapshot);assert.equal(await evaluate(`${settlement}.length`),1,'Repeated settlement source');assert.equal(report.final.trace.faults.length,0);assert.equal(report.final.audio.runtime.faults.total,0);assert(report.final.audio.runtime.voices.completed>=report.before.audio.runtime.voices.completed+1);assert(Object.values(report.final.audio.runtime.cleanup).every(n=>n===0));
  await shot('charter-accepted-phone');assert.equal(report.errors.length,0,'Browser runtime exception');report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error.stack??error);process.exitCode=1;const failedEvaluation=report.pendingEvaluation;
  try{report.failureState=await evaluate?.(snapshot)}catch(e){report.failureStateError=String(e)}report.failedEvaluation=failedEvaluation;
  try{const result=await send?.('Page.captureScreenshot',{format:'png'});if(result)fs.writeFileSync(path.join(out,'failure.png'),Buffer.from(result.data,'base64'),{flag:'wx'})}catch(e){report.failureScreenshotError=String(e)}
}finally{const cleanup=[];
  if(forceReadOnly)try{await evaluate?.(`${S}.api.__smokeForceReadOnly(false)`)}catch(e){cleanup.push('Read-only cleanup: '+e)}
  if(held)try{await evaluate?.(`${S}.api.__smokeReleaseProductActionHold()`)}catch(e){cleanup.push('Pending action cleanup: '+e)}
  try{await browser?.close()}catch(e){cleanup.push(String(e))}if(server.listening){server.closeAllConnections();await new Promise(r=>server.close(r))}
  try{for(const [name,digest]of Object.entries(report.sources))assert.equal(hash(fs.readFileSync(path.join(repo,name))),digest,'Source changed: '+name);for(const [name,digest]of Object.entries(report.served))assert.equal(hash(fs.readFileSync(path.join(dist,name))),digest,'Dist changed: '+name)}catch(e){cleanup.push(String(e))}
  if(cleanup.length){report.cleanupFailures=cleanup;report.status='FAIL';process.exitCode=1}report.endedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,output:out,failure:report.failure}));
