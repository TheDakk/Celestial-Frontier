/* Bounded dock-layout observation only. Run from the committed owned checkout:
 * node audits/UI_U1_SURVEY_TOP_ROW_PROBE_20260906.mjs DIST NEW_OUTPUT
 * This is not a retry/replacement of the stopped whole U1 navigation/restoration review. */
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {openChromiumCdp} from '../port/v2/tools/browsercdp.mjs';
import {readU1PhoneShell,installNativeReviewTrace,assessNativeReviewDelivery} from '../port/v2/tools/ui-shell-review.mjs';
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),source=git(['rev-parse','HEAD']),build=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(git(['diff','--name-only','HEAD']),'');assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const index=fs.readFileSync(path.join(build,'index.html')),worker=fs.readFileSync(path.join(build,'service-worker.js'));
assert(/name="cf-build-mode" content="distributable"/.test(index.toString()));
const assets=JSON.parse(/const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(worker.toString())[1]);
for(const a of assets){const file=path.resolve(build,'.'+a.path);assert(file.startsWith(build+path.sep));assert.equal(sha(fs.readFileSync(file)),a.sha256);}
const report={schema:'cf-u1-survey-top-dock-probe/v1',source,certification:false,status:'RUNNING',startedAt:new Date().toISOString(),build:{indexSha256:sha(index),serviceWorkerSha256:sha(worker),assets},rows:[],errors:[],limitations:['Dock geometry and hit ownership only; fresh isolated contexts at each size, no navigation normalization or viewport restoration.', 'Prior navigation and Runtime.evaluate restoration blockers remain OPEN regardless of this result. No full U1, Slice, Glass, Safari, physical-device or visual-acceptance claim.']};
const write=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(build,'.'+(name==='/'?'/index.html':name));assert(file.startsWith(build+path.sep)&&fs.statSync(file).isFile());res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end();}});
let browser;
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 browser=await openChromiumCdp({label:'U1 Survey top-row scoped layout',userDataPrefix:'cf-u1-survey-top',onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text)}});report.browser=browser.browser;
 for(const [width,height,panel]of [[390,844,false],[320,740,false],[430,932,false],[667,375,true]]){
  const row={width,height,panel,phase:'new-context',inputs:[],controls:[]};report.rows.push(row);write();
  const {browserContextId}=await browser.send('Target.createBrowserContext');
  try{
   const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
   const send=(m,p={})=>browser.send(m,p,sessionId),evalIn=async(label,expression)=>{row.phase=label;write();const a=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!a.exceptionDetails,a.exceptionDetails?.exception?.description);return a.result?.value;};
   const waitFor=async(label,expression)=>{const end=performance.now()+10000;while(performance.now()<end){if(await evalIn(label,expression))return;await new Promise(r=>setTimeout(r,25));}throw Error(label+' readiness expired');};
   const frames=()=>evalIn('fonts and two frames',`(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true;})()`);
   const read=()=>evalIn('dock geometry',`(${readU1PhoneShell.toString()})(false)`);
   const press=async selector=>{
    const p=await evalIn('prepare native '+selector,`(()=>{const t=window.__cfU1ReviewNativeTrace,e=document.querySelector(${JSON.stringify(selector)}),r=e?.getBoundingClientRect();if(!e||e.disabled||e.closest('[inert]')||!r||r.width<1||r.height<1)throw Error('unavailable native control');const x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);if(h!==e&&!e.contains(h))throw Error('covered native control');const id=++t.nextId;t.active={id,selector:${JSON.stringify(selector)},node:e};return{id,selector:${JSON.stringify(selector)},point:{x,y},eventStart:t.events.length,beforePress:t.snapshot()};})()`);
    row.inputs.push(p);write();await send('Input.dispatchMouseEvent',{type:'mousePressed',...p.point,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p.point,button:'left',clickCount:1});
    Object.assign(p,await evalIn('native receipt',`(()=>{const t=window.__cfU1ReviewNativeTrace;t.active=null;return{events:t.events.slice(${p.eventStart}),overflow:t.overflow};})()`));p.delivery=assessNativeReviewDelivery(p);assert(p.delivery.pass);write();
   };
   await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
   await waitFor('game ready',`!!document.querySelector('canvas')&&document.getElementById('primechip')?.textContent.includes('/9')`);
   await evalIn('install input trace',`(${installNativeReviewTrace.toString()})(${JSON.stringify(width+'x'+height)})`);
   if(await evalIn('Training state',`!!document.querySelector('[data-sel=tutskip]')`))await press('[data-sel=tutskip]');
   await waitFor('Training closed',`!document.body.classList.contains('training')&&!document.querySelector('[data-sel=tutskip]')`);await frames();
   if(panel){await press('#docksets');await waitFor('Settings open',`getComputedStyle(document.getElementById('setpanel')).display!=='none'`);await frames();}
   row.baseline=await read();assert(row.baseline.ok,JSON.stringify(row.baseline.errors));
   if(panel)assert(row.baseline.rect.left>=width/2,'dock crosses Settings safe column');
   const image=Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64'),file=`survey-top-${width}x${height}.png`;fs.writeFileSync(path.join(out,file),image);row.image={file,bytes:image.length,sha256:sha(image)};write();
   for(const [selector,property,value]of [['#docksurvey','grid-row','2'],['#docksurvey','width','43px'],['#docksurvey','pointer-events','none'],['#dockcharts','display','flex'],['#dock','width','500px']]){
    const proof=await evalIn('dock negative control '+selector+'/'+property,`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),prior={present:n.hasAttribute('style'),value:n.getAttribute('style')};let broken;try{n.style.setProperty(${JSON.stringify(property)},${JSON.stringify(value)},'important');broken=(${readU1PhoneShell.toString()})(false);}finally{n.setAttribute('style','');n.removeAttribute('style');if(prior.present)n.setAttribute('style',prior.value);}return{styleBefore:prior,styleAfter:{present:n.hasAttribute('style'),value:n.getAttribute('style')},broken,restored:(${readU1PhoneShell.toString()})(false),styleRestored:n.hasAttribute('style')===prior.present&&n.getAttribute('style')===prior.value};})()`);
    row.controls.push({selector,property,value,...proof});write();assert(!proof.broken.ok&&proof.restored.ok&&proof.styleRestored);
   }
   if(!panel){row.largeText=await evalIn('large-text dock and exact class restoration',`(()=>{const n=document.body,prior={present:n.hasAttribute('class'),value:n.getAttribute('class')};let large;try{n.classList.remove('fs-lg');n.classList.add('fs-xl');large=(${readU1PhoneShell.toString()})(false);}finally{n.removeAttribute('class');if(prior.present)n.setAttribute('class',prior.value);}return{large,restored:(${readU1PhoneShell.toString()})(false),classRestored:n.hasAttribute('class')===prior.present&&n.getAttribute('class')===prior.value};})()`);assert(row.largeText.large.ok&&row.largeText.restored.ok&&row.largeText.classRestored);}
   row.trace=await evalIn('final public trace',`(()=>{const t=window.__cfU1ReviewNativeTrace;return{events:t.events,changes:t.changes,overflow:t.overflow,final:t.snapshot()};})()`);assert(!row.trace.overflow);row.phase='complete';row.pass=true;write();
  }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});}
 }
 assert.equal(report.errors.length,0);assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only','HEAD']),'');report.status='PASS';
}catch(e){report.status='FAIL';report.failure=String(e);throw e;}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));report.endedAt=new Date().toISOString();write();}
