/* Focused native Back regression diagnostic; NOT a calibration or certificate. */
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import assert from 'node:assert/strict';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {buildCompendiumFixture} from '../../port/v2/tools/compendiummem-fixture.mjs';
import {candidateForegroundServiceExpression,candidateForegroundCleanupExpression} from '../../port/v2/tools/compendiummem.mjs';
import {classifyCompendiumForegroundServiceTurn} from '../../port/v2/tools/compendiummem-contract.mjs';
const out=process.argv[2];assert(out&&!fs.existsSync(out),'fresh output required');fs.mkdirSync(out,{recursive:true});
const root=path.resolve('port/v2/apps/game/dist'),fixture=buildCompendiumFixture(),report={scope:'Focused native foreground diagnosis; not calibration/certification',steps:[]};
const server=http.createServer((q,r)=>{const u=new URL(q.url,'http://localhost'),f=path.join(root,u.pathname==='/'?'index.html':u.pathname);r.setHeader('Cross-Origin-Opener-Policy','same-origin');r.setHeader('Cross-Origin-Embedder-Policy','require-corp');if(u.pathname==='/seed'){r.end('<!doctype html><title>seed</title>');return;}if(!f.startsWith(root+'/')||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return;}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(r)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser; let heapFile=null;
try{
 browser=await openChromiumCdp({label:'I5 Back focus diagnosis',userDataPrefix:'cf-i5-heap',startupTimeoutMs:45000,onEvent:e=>{if(heapFile&&e.method==='HeapProfiler.addHeapSnapshotChunk')fs.appendFileSync(heapFile,e.params.chunk)}});report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});const{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});const send=(m,p={})=>browser.send(m,p,sessionId);
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',process.argv.includes('--desktop')?{width:1280,height:800,deviceScaleFactor:1,mobile:false}:{width:390,height:844,deviceScaleFactor:3,mobile:true});await send('Page.bringToFront');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.equal(r.exceptionDetails,undefined,JSON.stringify(r.exceptionDetails));return r.result.value};
 const wait=async(expression,label)=>{for(let i=0;i<150;i++){const v=await ev(expression);if(v)return v;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+label)};
 const unusedSnap=async label=>{const s=await ev(`(()=>{const d=window.__CF_SLICE__?.api?.compendiumDiagnostics();return {active:document.activeElement?.outerHTML?.slice(0,650),panel:d?.panel,window:d?.window,events:window.__backEvents,scroll:document.querySelector('[data-sel="codex-scroll"]')?.scrollTop}})()`);report.steps.push({label,...s});console.log(label,JSON.stringify({active:s.active,panel:s.panel,window:s.window}));return s};
 const click=async selector=>{const p=await ev(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.top>=0&&r.bottom<=innerHeight});if(!e)return null;const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return e.contains(document.elementFromPoint(x,y))?{x,y}:null})()`);assert(p,'native click unavailable '+selector);for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...p,button:'left',clickCount:1})};
 await send('Page.navigate',{url:origin+'/seed'});await wait("document.readyState==='complete'",'seed');const raw=JSON.stringify(JSON.parse(fs.readFileSync('port/baseline-v1.8.9/save-fixtures.json')).inputs.veteran_rich);
 await ev(`(async()=>{const raw=${JSON.stringify(raw)},stores=['meta','player','creatures','catalog','inventory','settings','journal','assetcache'];const db=await new Promise((res,rej)=>{const q=indexedDB.open('cf-v2-slice',1);q.onupgradeneeded=()=>stores.forEach(s=>q.result.createObjectStore(s));q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});await new Promise((res,rej)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put(raw,'save');t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();return true})()`);
 await send('Page.navigate',{url:origin+'/'});await wait('window.__CF_SLICE__?.api?.__compendiumEvidence','boot');await ev(`window.__CF_SLICE__.api.__compendiumEvidence.installFixture(${JSON.stringify(fixture.rows)})`);await wait("[...document.querySelectorAll('#dockcodex,#railcodex')].some(e=>e.getBoundingClientRect().height)",'dock');await click('#dockcodex,#railcodex');await wait("window.__CF_SLICE__.api.compendiumDiagnostics().panel.mode==='list'",'list');

 // Diagnostic only: exercise the same attached page through a long hidden interval.
 const main={targetId,sessionId,documentToken:await ev('window.__CF_SLICE__.documentToken')};
 const other=await browser.send('Target.createTarget',{url:origin+'/seed'});
 const attached=await browser.send('Target.attachToTarget',{targetId:other.targetId,flatten:true});
 await send('Emulation.setFocusEmulationEnabled',{enabled:false});
 await browser.send('Target.activateTarget',{targetId:other.targetId});
 await browser.send('Page.bringToFront',{},attached.sessionId);
 report.hidden=await ev('({visibilityState:document.visibilityState,hidden:document.hidden,focused:document.hasFocus()})');
 const hiddenMs=Number(process.argv.find(a=>a.startsWith('--hidden-ms='))?.split('=')[1]||320000);
 report.hiddenMs=hiddenMs; console.log('hidden interval',hiddenMs,report.hidden);
 await new Promise(r=>setTimeout(r,hiddenMs));
 await browser.send('Target.activateTarget',{targetId});
 await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront');
 const serviceToken='focused-diagnostic-one',expression=candidateForegroundServiceExpression({activationTargetId:targetId,sessionId,serviceToken});
 const start=performance.now();report.foreground=[];
 while(performance.now()-start<30000){
   const value=await ev(expression), decision=classifyCompendiumForegroundServiceTurn(value,{...main,serviceToken});
   report.foreground.push({elapsedMs:performance.now()-start,value,decision});
   if(decision.status!=='pending')break;await new Promise(r=>setTimeout(r,100));
 }
 report.cleanup=await ev(candidateForegroundCleanupExpression());
 console.log('foreground result',JSON.stringify(report.foreground.at(-1)));
 report.status='CAPTURED';
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
