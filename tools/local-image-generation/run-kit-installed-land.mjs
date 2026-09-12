/** One ordinary game download/install -> Land -> finisher -> retained original proof. No painting parameter changes. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createFrozenGameViteServer} from './frozen-preview-client.mjs';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.resolve(process.argv[2]??'');
if(process.argv.length!==3||!out.startsWith(root+'/audits/'))throw Error('Usage: run-kit-installed-land.mjs NEW_AUDIT_DIRECTORY');
await fs.mkdir(out);const result={schema:'cf.kit-installed-land.v1',status:'FAIL',head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),events:[],requests:[],states:[],screenshots:[],inferenceRuns:0};
const need=(v,m)=>{if(!v)throw Error(m);};const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const accepted=await fs.readFile(path.join(root,'audits/ART_KIT_CONTACT_REVISION_20260912/native-01/painting.png'));
let release,vite,server,cdp,sid;
try{
 need(!execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim(),'Native UI proof requires committed source');
 release=acquireWorkspaceLock('one Mac installed-model ordinary Land proof');vite=await createFrozenGameViteServer();
 server=http.createServer((req,res)=>{
  for(const [k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cache-Control':'no-store'}))res.setHeader(k,v);
  if(req.url==='/__local_ai/runtime.json'){res.writeHead(404);res.end();return;}
  vite.middlewares(req,res,()=>{res.writeHead(404);res.end();});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 cdp=await openChromiumCdp({label:'Kit installed-model ordinary Land proof',userDataPrefix:'cf-kit-installed-land-',commandTimeoutMs:45000,onEvent:e=>{
  if(e.method==='Runtime.exceptionThrown'&&result.events.length<100)result.events.push(e.params);
  if(e.method==='Network.requestWillBeSent'&&result.requests.length<15000)result.requests.push(e.params.request.url);
 }});result.browser=cdp.browser;
 const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});({sessionId:sid}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
 for(const domain of ['Runtime','Page','Network'])await cdp.send(domain+'.enable',{},sid);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sid);
 const evaluate=async(expression)=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 async function until(label,expression,ms=30000){const end=performance.now()+ms;while(performance.now()<end){const v=await evaluate(expression);if(v)return v;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+label);}
 async function state(label){const value=await evaluate(`(()=>{const s=window.__CF_SLICE__.api.state();return {mode:s.mode,planet:s.planet,star:s.star,tutActive:s.tutActive,localAi:s.localAi,persistence:s.persistence,landing:s.landing};})()`);result.states.push({label,...value});console.log(label);return value;}
 async function click(selector){const g=await evaluate(`(()=>{const all=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled});if(all.length!==1)return null;const e=all[0];e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return e.contains(document.elementFromPoint(x,y))?{x,y}:null;})()`);need(g,'Unreachable '+selector);await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...g,button:'left',clickCount:1},sid);await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...g,button:'left',clickCount:1},sid);}
 async function screenshot(name){const image=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sid);const b=Buffer.from(image.data,'base64');await fs.writeFile(path.join(out,name),b);result.screenshots.push({name,sha256:sha(b)});}
 await cdp.send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`},sid);
 await until('boot',`window.__CF_SLICE__?.api?.state().tutActive`,60000);
 await click('[data-sel="tutskip"]');
 await until('ordinary game adapter ready',`(()=>{const s=window.__CF_SLICE__.api.state();return s.tutDone&&!s.tutActive&&s.mode==='system'&&s.localAi.available&&s.persistence.ready&&!s.persistence.mutationBlocked;})()`);
 need(await evaluate('window.__CF_SLICE__.api.surveyOn({seed:133,ordinal:2})'),'Earth Survey setup failed');
 await until('Land control',`!!document.querySelector('[data-act="landcta"]')`);
 await click('[data-ai-model-storage="survey"] > summary');
 const installStart=performance.now();await click('[data-ai-model-storage="survey"] [data-ai-act="install"]');
 const installEnd=performance.now()+900000;let lastInstall='';
 while(true){const text=await evaluate(`document.querySelector('[data-ai-model-storage="survey"]')?.textContent??''`);
  if(text!==lastInstall){lastInstall=text;console.log(text.slice(0,320));result.installStatus=text;}
  if(text.includes('Model ready. Land to finish a painting.'))break;
  if(performance.now()>installEnd)throw Error('Model install exceeded15minutes');
  if(!text.includes('Pause model preparation')&&!text.includes('Model downloading')&&!text.includes('Model verifying'))throw Error('Install ended without ready: '+text);
  await new Promise(r=>setTimeout(r,3000));
 }
 result.installElapsedMs=performance.now()-installStart;await state('model-installed');await screenshot('00-model-installed.png');
 const began=performance.now();await click('[data-act="landcta"]');
 await until('composite',`(()=>{const s=window.__CF_SLICE__.api.state();return s.mode==='surface'&&s.planet===133&&s.localAi.mounted;})()`);
 const first=await state('ordinary-Land-composite');result.compositeAfterClickMs=performance.now()-began;
 need(first.localAi.originalId===null&&first.localAi.jobs.length===1,'Ordinary Land did not enqueue exactly one installed-model job');result.inferenceRuns=1;
 await screenshot('01-ordinary-land-composite.png');
 const finishEnd=performance.now()+600000;let lastPhase='';
 while(true){const s=await evaluate('window.__CF_SLICE__.api.state().localAi');const job=s.jobs[0];
  need(s.jobs.length===1,'Unexpected additional painting job');
  if(job.status==='failed'||job.status==='canceled')throw Error('Installed-model finisher failed: '+JSON.stringify(job));
  if(job.progress.phase!==lastPhase){lastPhase=job.progress.phase;console.log('Finisher: '+lastPhase);}
  if(job.status==='ready'&&s.originalId===job.originalId&&!s.crossfading){result.job=job;break;}
  if(performance.now()>finishEnd)throw Error('Installed-model finisher exceeded10minutes');
  await new Promise(r=>setTimeout(r,250));
 }
 result.landToReadyMs=performance.now()-began;
 result.retained=await evaluate(`(async()=>{const s=window.__CF_SLICE__.api.state().localAi;const {createAiLandfallOriginalStoreV1}=await import('/src/ai-landfall-originals.ts');const store=createAiLandfallOriginalStoreV1();try{const original=await store.read(s.input,s.originalId);if(!original)throw Error('Original missing');const bytes=new Uint8Array(await original.blob.arrayBuffer());let binary='';for(let at=0;at<bytes.length;at+=32768)binary+=String.fromCharCode(...bytes.subarray(at,at+32768));return {originalId:original.originalId,sha256:original.sha256,png:btoa(binary),width:original.width,height:original.height,recipe:JSON.parse(s.input.recipeJson)};}finally{store.close();}})()`);
 const png=Buffer.from(result.retained.png,'base64');delete result.retained.png;await fs.writeFile(path.join(out,'painting.png'),png,{flag:'wx'});
 need(sha(png)===result.retained.sha256,'Retained output SHA mismatch');
 result.matchesAcceptedPainting=sha(png)===sha(accepted);
 const prior=JSON.parse(await fs.readFile(path.join(root,'audits/ART_KIT_CONTACT_REVISION_20260912/prepared/recipe.json'),'utf8'));
 for(const key of ['finisherPrompt','seed','width','height','passSize','steps','strength','finisherStrength','composition'])need(canonical(result.retained.recipe[key])===canonical(prior[key]),'Accepted parameter changed: '+key);
 await state('installed-finisher-ready');await screenshot('02-installed-finisher-ready.png');
 await cdp.send('Page.reload',{ignoreCache:true},sid);
 await until('retained original on ordinary reload',`(()=>{const s=window.__CF_SLICE__?.api?.state();return s?.localAi.originalId===${JSON.stringify(result.retained.originalId)};})()`,60000);
 await until('crossfade settled',`!window.__CF_SLICE__.api.state().localAi.crossfading`);
 const restored=await state('retained-original-restored');need(restored.localAi.alpha===1&&restored.localAi.jobs.length===0,'Restore lost original or started an inference');
 await screenshot('03-retained-original.png');
 await click('#docksurvey'); // surveyOn is system-only; exercise the real surface control.
 await until('Inspect',`!!document.querySelector('[data-ai-act="inspect-current"]')`);
 await click('[data-ai-act="inspect-current"]');await until('native viewer',`document.querySelector('#cf-landfall-viewer')?.open`);
 result.viewer=await evaluate(`(()=>{const d=document.querySelector('#cf-landfall-viewer');return {sha256:d.dataset.imageSha256,originalId:d.dataset.originalId,width:d.querySelector('img').naturalWidth,height:d.querySelector('img').naturalHeight};})()`);
 need(result.viewer.sha256===result.retained.sha256,'Inspect opened another original');await screenshot('04-inspect.png');
 need(result.requests.some(u=>u.startsWith('https://huggingface.co/')&&u.includes('/resolve/')),'No ordinary model download observed');
 need(result.requests.some(u=>u.includes('/__local_ai/kit-stage-worker.mjs')),'Shipped kit worker was not used');
 need(result.events.length===0,'Browser runtime exception');result.status='PASS';
}catch(error){result.error=String(error.stack??error);console.error(result.error);}
finally{try{await cdp?.close();}catch(error){result.status='FAIL';result.cleanupError=String(error);}if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await vite?.close();release?.();await fs.writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({status:result.status,compositeAfterClickMs:result.compositeAfterClickMs,error:result.error}));if(result.status!=='PASS')process.exitCode=1;
