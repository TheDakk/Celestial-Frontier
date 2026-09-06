#!/usr/bin/env node
/* Local, non-certifying review of a previously built pilot. Uses an isolated
 * headless browser and generated game files only; never a user's browser/UI. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { init, parse } from 'es-module-lexer';
import { openChromiumCdp } from './browsercdp.mjs';

const [buildArgument, outputArgument, baselineArgument] = process.argv.slice(2);
assert(buildArgument && outputArgument, 'usage: audiovisual-pilot-review.mjs BUILD_DIRECTORY OUTPUT_DIRECTORY');
const build = fs.realpathSync(buildArgument), output = path.resolve(outputArgument);
assert(fs.existsSync(path.join(build, 'audiovisual-pilot.html')), 'build must contain the pilot entry');
fs.mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(build, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(build + path.sep) || !fs.statSync(file).isFile()) throw new Error('missing');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [], rows = [], images = [];
let browser;
const startedAt = new Date().toISOString();
const workerBytes = fs.readFileSync(path.join(build, 'service-worker.js'));
const inventory = JSON.parse(/const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(workerBytes.toString())[1]);
for (const row of inventory) {
  const bytes = fs.readFileSync(path.join(build, row.path.replace(/^\//u, '')));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), row.sha256);
  row.bytes = bytes.length;
}
await init;
function initialGraph(directory) {
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const pending = [...html.matchAll(/<script[^>]*src="([^"]+)"/gu)].map(m=>m[1].replace(/^\//u,''));
  const seen = new Set(), files = [];
  while (pending.length) {
    const name = pending.pop(); if (seen.has(name)) continue; seen.add(name);
    const bytes = fs.readFileSync(path.join(directory,name));
    files.push({ file:name, bytes:bytes.length, gzipBytes:gzipSync(bytes).length });
    for (const entry of parse(bytes.toString())[0]) {
      if (entry.d === -1 && entry.n && (entry.n.startsWith('.') || entry.n.startsWith('/'))) {
        pending.push(entry.n.startsWith('/') ? entry.n.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(name),entry.n)));
      }
    }
  }
  return { files:files.sort((a,b)=>a.file.localeCompare(b.file)), bytes:files.reduce((n,f)=>n+f.bytes,0), gzipBytes:files.reduce((n,f)=>n+f.gzipBytes,0) };
}
const initialJavaScript = { candidate:initialGraph(build), baseline:baselineArgument?initialGraph(fs.realpathSync(baselineArgument)):null };
const buildIdentity = { initialJavaScript, serviceWorkerSha256: crypto.createHash('sha256').update(workerBytes).digest('hex'),
  completePackBytes: inventory.reduce((sum,row)=>sum+row.bytes,workerBytes.length), assets: inventory };

// A default-sized canvas is not paint evidence. This marker is set only after
// the existing canonical worker's bitmap has been drawn into both study panes.
function canonicalVistaReady(canvases) {
  return Array.isArray(canvases) && canvases.length === 2 && canvases.every(canvas =>
    canvas.canonicalVista === 'ready' && canvas.width === 960 && canvas.height === 430
    && Number.isFinite(canvas.displayWidth) && canvas.displayWidth > 0
    && Number.isFinite(canvas.displayHeight) && canvas.displayHeight > 0);
}
const report = () => ({ kind: 'local-pilot-review-diagnostic', certification: false, buildIdentity, startedAt, finishedAt: new Date().toISOString(), rows, images, errors,
  limitations: ['Headless desktop Chromium is not a physical iPhone, Safari or installed-PWA acceptance.', 'All eight anatomical animations remain incomplete; motion is an external frame marker.', 'No human visual or listening verdict is inferred.', 'Native panel and font-size checks are scoped diagnostics, not Slice/Glass certification; zero-range panels do not establish long-content scroll coverage.'] });
try {
  browser = await openChromiumCdp({ label: 'isolated audiovisual pilot review', userDataPrefix: 'cf-pilot-review',
    onEvent: (event) => { if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text + ': ' + (event.params.exceptionDetails.exception?.description ?? '')); } });
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => browser.send(method, params, sessionId);
  await send('Runtime.enable'); await send('Page.enable');
  const evaluate = async (expression) => {
    const answer = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!answer.exceptionDetails, answer.exceptionDetails?.text); return answer.result.value;
  };
  const waitFor = (condition) => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+25000;const tick=()=>{if(${condition})resolve(true);else if(performance.now()>end)reject(new Error('pilot readiness deadline'));else setTimeout(tick,50)};tick()})`);
  const screenshot = async (name, selector) => {
    const clip = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.max(0,r.x+scrollX),y:Math.max(0,r.y+scrollY),width:Math.min(r.width,1440),height:Math.min(r.height,2600),scale:1}})()`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    const bytes = Buffer.from(data, 'base64'); fs.writeFileSync(path.join(output, name + '.png'), bytes);
    images.push({ file: name + '.png', bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  };
  const click = async (selector, { scroll = true } = {}) => {
    const point = await evaluate(`(async()=>{
      const matches=document.querySelectorAll(${JSON.stringify(selector)});
      if(matches.length!==1)throw new Error('native target must be unique: '+${JSON.stringify(selector)});
      const e=matches[0];if(${scroll})e.scrollIntoView({block:'center',inline:'nearest'});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),style=getComputedStyle(e);
      if(e.disabled||e.closest('[inert]')||style.display==='none'||style.visibility==='hidden'||r.width<=0||r.height<=0||x<0||y<0||x>=innerWidth||y>=innerHeight||!(hit===e||e.contains(hit)))
        throw new Error('native target center is not actionable: '+${JSON.stringify(selector)}+' '+JSON.stringify({x,y,width:r.width,height:r.height,hit:hit?.id||hit?.tagName}));
      return{x,y};})()`);
    await send('Input.dispatchMouseEvent', {type:'mousePressed',...point,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased',...point,button:'left',clickCount:1});
  };
  const studyVistaState = `[...document.querySelectorAll('#pilot-earth .p-art-basin canvas')].map(c=>{const r=c.getBoundingClientRect();return{canonicalVista:c.dataset.canonicalVista,width:c.width,height:c.height,displayWidth:r.width,displayHeight:r.height}})`;
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/audiovisual-pilot.html' });
  await waitFor(`document.querySelector('#pilot-review')?.dataset.pilotReview==='ready' && [...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0) && (${canonicalVistaReady.toString()})(${studyVistaState})`);
  await evaluate('document.fonts.ready.then(()=>true)');
  const paintedVista = await evaluate(studyVistaState);
  assert(canonicalVistaReady(paintedVista), JSON.stringify(paintedVista));
  for (const [name, mutate] of [
    ['default dimensions without paint', canvas => { delete canvas.canonicalVista; }],
    ['zero backing height', canvas => { canvas.height = 0; }],
    ['hidden painted pane', canvas => { canvas.displayHeight = 0; }],
  ]) {
    const emptyVista = structuredClone(paintedVista); mutate(emptyVista[1]);
    assert.equal(canonicalVistaReady(emptyVista), false, name);
  }
  assert.equal(canonicalVistaReady([]), false, 'missing panes cannot pass vacuously');
  rows.push({control:'canonical vista ready after paint; empty and hidden pane mutations rejected',pass:true,paintedVista});
  await screenshot('desktop-direction', '#pilot-review>header');
  await screenshot('scout-comparison', '#pilot-ship');
  await screenshot('temperate-comparison', '#pilot-earth');
  const families = await evaluate(`[...document.querySelector('#pilot-specimens select[aria-label="Body plan specimen"]').options].map(o=>o.value)`);
  assert.equal(families.length, 8);
  for (const id of families) for (const size of [132, 300, 440]) {
    await evaluate(`(()=>{const family=document.querySelector('#pilot-specimens select[aria-label="Body plan specimen"]'),size=document.querySelector('#pilot-specimens select[aria-label="Actual portrait size"]');family.value=${JSON.stringify(id)};size.value='${size}';family.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor(`[...document.querySelectorAll('.p-native-pair img')].length===2 && [...document.querySelectorAll('.p-native-pair img')].every(i=>i.dataset.pilotSpecimen===${JSON.stringify(id)}&&i.dataset.pilotSize==='${size}'&&i.complete&&i.naturalWidth>0)`);
    const pair = await evaluate(`Promise.all([...document.querySelectorAll('.p-native-pair img')].map(async i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,c.width,c.height).data);const style=getComputedStyle(i);return{key:i.dataset.visualKey,width:i.width,height:i.height,naturalWidth:i.naturalWidth,sha256:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),transform:style.transform,filter:style.filter,opacity:style.opacity}}))`);
    assert.equal(pair[0].key, pair[1].key); assert.equal(pair[0].sha256, pair[1].sha256);
    for (const item of pair) { assert.equal(item.width, size); assert.equal(item.height, size); assert.equal(item.transform, 'none'); assert.equal(item.filter, 'none'); assert.equal(item.opacity, '1'); }
    rows.push({ id, size, static: pair[0], animatedPresentation: pair[1], anatomicalAnimation: 'INCOMPLETE' });
    await screenshot(`${id}-${size}`, '#pilot-specimens');
  }
  const markerExpression = `[...document.querySelectorAll('.p-native-pair .p-portrait-accent')].map(e=>({animation:getComputedStyle(e).animationName,transform:getComputedStyle(e).transform}))`;
  const firstMarkers = await evaluate(markerExpression);
  await evaluate('new Promise(resolve=>setTimeout(resolve,400))');
  const nextMarkers = await evaluate(markerExpression);
  assert.equal(firstMarkers[0].animation, 'none');
  assert.equal(firstMarkers[1].animation, 'cf-pilot-portrait-accent');
  assert.notEqual(firstMarkers[1].transform, nextMarkers[1].transform);
  await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-reduced-motion', value:'reduce' }] });
  await waitFor(`getComputedStyle(document.querySelectorAll('.p-native-pair .p-portrait-accent')[1]).animationName==='none'`);
  rows.push({ control:'external marker moves; reduced motion disables it', pass:true, firstMarkers, nextMarkers });
  await send('Emulation.setEmulatedMedia', { features: [] });
  // Negative control the reported identity comparison, without modifying the painter.
  const wrongPair = structuredClone(rows.find(row=>row.anatomicalAnimation==='INCOMPLETE')); wrongPair.animatedPresentation.sha256 = '0'.repeat(64);
  assert.throws(() => assert.equal(wrongPair.static.sha256, wrongPair.animatedPresentation.sha256));
  rows.push({ control: 'different portrait pixels rejected', pass: true });
  for (const [width,height] of [[390,844],[430,932],[820,1180]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate('scrollTo(0,0)');
    const layout = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('button,select,a.p-button,summary')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').map(e=>({label:e.textContent,height:e.getBoundingClientRect().height}))})`);
    assert(layout.scrollWidth <= width, `review overflows ${width}: ${layout.scrollWidth}`);
    assert(layout.targets.every(t=>t.height>=44), 'review target smaller than 44px');
    rows.push({ viewport: { width,height }, ...layout });
    await screenshot(`review-${width}`, '#pilot-review>header');
    if (!await evaluate(`document.querySelector('#pilot-mockups details').open`)) await click('#pilot-mockups summary');
    await screenshot(`mockups-${width}`, '#pilot-mockups');
  }
  // Real existing journey on this isolated origin: no save hooks or invented actions.
  await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:false });
  await send('Page.navigate', { url:origin+'/?avpilot=1' });
  await waitFor(`document.querySelector('[data-sel=tutskip]') && document.querySelector('[data-cf-audiovisual-pilot]')`);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-cf-pilot-controls]')).display`), 'none');
  await click('[data-sel=tutskip]');
  await waitFor(`!document.querySelector('[data-sel=tutskip]')`);
  await screenshot('playable-system-390','body');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await waitFor(`document.querySelector('[data-act=landcta]')?.getAttribute('data-landing-world')==='CF1|g:999@90,-60|s:424242@560,170|p:133#2'`);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-cf-pilot-controls]')).display`),'none');
  await screenshot('playable-approach-390','body');
  await click('[data-act=landcta]');
  await waitFor(`document.body.classList.contains('surface-mode') && document.querySelector('[data-cf-pilot-scene]')?.hidden===false`);
  await click('[data-survey-close]');
  await waitFor(`!document.body.classList.contains('card-open')`);
  await waitFor(`document.querySelectorAll('#planetside img.planetside-thumb').length>0 && [...document.querySelectorAll('#planetside img.planetside-thumb')].every(i=>i.complete&&i.naturalWidth>0)`);
  await screenshot('playable-landed-390','body');
  await click('[data-cf-pilot-controls] summary');
  await click('[data-cf-pilot-controls] button:nth-of-type(2)');
  await waitFor(`document.querySelector('[data-cf-pilot-controls] [role=status]').textContent.includes('Exploration phrase playing')`);
  await click('[data-cf-pilot-controls] button:nth-of-type(3)');
  assert.equal(await evaluate(`document.querySelector('[data-cf-pilot-controls] [role=status]').textContent`),'Pilot sound stopped.');
  await click('[data-cf-pilot-controls] button:nth-of-type(1)');
  assert.equal(await evaluate(`document.querySelector('[data-cf-pilot-scene]').hidden`),true);
  await click('[data-cf-pilot-controls] summary');
  await screenshot('playable-current-landed-390','body');
  rows.push({journey:'Sol system → Earth Survey → durable Land safely → canonical biosphere',nativeInput:true,importDoor:false,
    worldKey:'CF1|g:999@90,-60|s:424242@560,170|p:133#2',pilotSoundStarted:true,explicitStop:true,baselineComparison:true,
    controlsYieldedToTrainingAndSurvey:true,viewport:{width:390,height:844},humanListening:'PENDING'});
  // Continue through the existing native owners on the same landed save. The
  // fs-xl class is a presentation fixture only; no save or game action is injected.
  await click('[data-cf-pilot-controls] summary');
  await click('[data-cf-pilot-controls] button:nth-of-type(1)');
  await waitFor(`document.body.hasAttribute('data-cf-pilot-look') && document.querySelector('[data-cf-pilot-scene]').hidden===false`);
  await click('[data-cf-pilot-controls] summary');
  const dockIds = ['docksurvey','dockcodex','dockrecords','dockcharters','dockatlas','dockcharts','dockshipyard','dockinventory','docksets','dockguide'];
  const panelState = (id) => evaluate(`(()=>{
    const panel=document.querySelector('#'+${JSON.stringify(id)}+'panel'),close=panel.querySelector('[data-pnx]'),controls=document.querySelector('[data-cf-pilot-controls]');
    const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const shown=e=>e.getClientRects().length>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
    const centerHit=e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===e||e.contains(hit)};
    return{panel:rect(panel),shown:shown(panel),ariaHidden:panel.getAttribute('aria-hidden'),inert:panel.inert,
      scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,scrollTop:panel.scrollTop,
      close:{count:panel.querySelectorAll('[data-pnx]').length,rect:rect(close),shown:shown(close),disabled:close.disabled,centerHit:centerHit(close),focused:document.activeElement===close},
      openerExpanded:document.querySelector('#dock'+${JSON.stringify(id)}).getAttribute('aria-expanded'),
      controls:{display:getComputedStyle(controls).display,pointerEvents:getComputedStyle(controls).pointerEvents},
      dock:[...document.querySelectorAll('#dock>button')].map(e=>({id:e.id,rect:rect(e),shown:shown(e),centerHit:centerHit(e)})),
      viewport:{width:innerWidth,height:innerHeight},fontSize:getComputedStyle(document.body).fontSize};})()`);
  const assertPanel = (state, { initial = false } = {}) => {
    const { panel,close,viewport,dock } = state, detail=JSON.stringify(state);
    assert(state.shown && state.ariaHidden==='false' && !state.inert && state.openerExpanded==='true', detail);
    assert.equal(state.fontSize, '17px', detail);
    assert(panel.x>=0 && panel.y>=0 && panel.right<=viewport.width+1 && panel.bottom<=viewport.height+1, detail);
    assert(state.scrollWidth<=state.clientWidth, detail);
    assert.equal(close.count,1,detail);
    assert(close.shown && !close.disabled && close.centerHit && close.rect.width>=44 && close.rect.height>=44,detail);
    assert(close.rect.x>=panel.x && close.rect.y>=panel.y && close.rect.right<=panel.right+1 && close.rect.bottom<=panel.bottom+1,detail);
    if(initial)assert(close.focused,detail);
    assert.deepEqual(state.controls,{display:'none',pointerEvents:'none'},detail);
    assert.deepEqual(dock.map(button=>button.id),dockIds,detail);
    assert(dock.every(button=>button.shown&&button.rect.width>=44&&button.rect.height>=44&&button.rect.x>=0&&button.rect.y>=0&&button.rect.right<=viewport.width+1&&button.rect.bottom<=viewport.height+1),detail);
    if(viewport.height>viewport.width){
      for(let i=0;i<5;i++){
        assert(Math.abs(dock[i].rect.y-dock[0].rect.y)<=1 && Math.abs(dock[i+5].rect.y-dock[5].rect.y)<=1,detail);
        assert(Math.abs(dock[i].rect.x-dock[i+5].rect.x)<=1,detail);
        if(i>0)assert(Math.abs((dock[i].rect.x-dock[i-1].rect.right)-(dock[1].rect.x-dock[0].rect.right))<=1,detail);
      }
      assert(dock[5].rect.y>=dock[0].rect.bottom,detail);
      assert(Math.abs((dock[0].rect.x+dock[4].rect.right)/2-viewport.width/2)<=1,detail);
    }
  };
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate(`document.body.classList.remove('fs-sm','fs-lg');document.body.classList.add('fs-xl');document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))))`);
    for(const id of ['shipyard','inventory','atlas']){
      await click('#dock'+id);
      await waitFor(`document.querySelector('#${id}panel')?.getAttribute('aria-hidden')==='false'`);
      const opened=await panelState(id);assertPanel(opened,{initial:true});
      if(width===390 && id==='shipyard'){
        for(const [name,mutate] of [
          ['covered Close', state=>{state.close.centerHit=false}],
          ['undersized Close', state=>{state.close.rect.height=43}],
          ['lost opening focus', state=>{state.close.focused=false}],
          ['pilot controls cover a native panel', state=>{state.controls.display='block'}],
          ['horizontal panel overflow', state=>{state.scrollWidth=state.clientWidth+1}],
          ['missing dock control', state=>{state.dock.pop()}],
        ]){
          const broken=structuredClone(opened);mutate(broken);
          assert.throws(()=>assertPanel(broken,{initial:true}),undefined,name);
        }
        rows.push({control:'native panel geometry, focus, suppression and dock mutations rejected',pass:true});
      }
      if(id==='shipyard') await waitFor(`document.querySelector('#shipyardpanel [data-visual-treatment="pilot-scout"]')!==null`);
      // Open the existing fabrication disclosure to exercise genuine long content.
      if(id==='shipyard' && !await evaluate(`document.querySelector('#shipyardpanel details[data-engineering-section="fabricator"]').open`))
        await click('#shipyardpanel details[data-engineering-section="fabricator"]>summary');
      await screenshot(`native-${id}-${width}x${height}-xl-open`,'body');
      const beforeScroll=await panelState(id);assertPanel(beforeScroll);
      const range=Math.max(0,beforeScroll.scrollHeight-beforeScroll.clientHeight);
      if(range>0){
        await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:beforeScroll.panel.x+Math.min(30,beforeScroll.panel.width/2),y:beforeScroll.panel.bottom-16,deltaX:0,deltaY:beforeScroll.scrollHeight+height});
        await waitFor(`(()=>{const p=document.querySelector('#${id}panel');return p.scrollTop>=p.scrollHeight-p.clientHeight-1})()`);
      }
      const atEnd=await panelState(id);assertPanel(atEnd);
      assert(atEnd.scrollTop>=Math.max(0,atEnd.scrollHeight-atEnd.clientHeight)-1,JSON.stringify(atEnd));
      await screenshot(`native-${id}-${width}x${height}-xl-end`,'body');
      // Do not scroll the Close back into view: its actual end-position must work.
      await click('#'+id+'panel [data-pnx="'+id+'"]',{scroll:false});
      await waitFor(`document.querySelector('#${id}panel').getAttribute('aria-hidden')==='true'`);
      const closed=await evaluate(`({activeId:document.activeElement?.id,expanded:document.querySelector('#dock${id}').getAttribute('aria-expanded'),panelOpen:document.body.classList.contains('panel-open'),controlsDisplay:getComputedStyle(document.querySelector('[data-cf-pilot-controls]')).display})`);
      assert.equal(closed.activeId,'dock'+id,JSON.stringify(closed));
      assert.equal(closed.expanded,'false',JSON.stringify(closed));assert.equal(closed.panelOpen,false,JSON.stringify(closed));assert.notEqual(closed.controlsDisplay,'none',JSON.stringify(closed));
      rows.push({nativePanel:id,viewport:{width,height},font:'fs-xl',opened,beforeScroll,atEnd,closed,scrollRange:range,scrollCoverage:range>0?'native wheel to existing content end':'no scroll range in this save',trustedOpenClose:true});
    }
    await click('[data-cf-pilot-controls] summary');
    const controls=await evaluate(`(()=>{const e=document.querySelector('[data-cf-pilot-controls]'),r=e.getBoundingClientRect(),style=getComputedStyle(e);return{open:e.open,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overflowY:style.overflowY,targets:[...e.querySelectorAll('summary,button')].map(target=>{const bounds=target.getBoundingClientRect();return{label:target.textContent,width:bounds.width,height:bounds.height}})}})()`);
    assert(controls.open&&controls.x>=0&&controls.y>=0&&controls.right<=width+1&&controls.bottom<=height+1&&controls.height>0,JSON.stringify(controls));
    assert(controls.scrollWidth<=controls.clientWidth,JSON.stringify(controls));
    assert(controls.targets.every(target=>target.width>=44&&target.height>=44),JSON.stringify(controls));
    if(controls.scrollHeight>controls.clientHeight)assert(['auto','scroll'].includes(controls.overflowY)&&controls.clientHeight>=44,JSON.stringify(controls));
    await screenshot(`native-pilot-controls-${width}x${height}-xl`,'body');
    await click('[data-cf-pilot-controls] button:nth-of-type(3)');
    assert.equal(await evaluate(`document.querySelector('[data-cf-pilot-controls] [role=status]').textContent`),'Pilot sound stopped.');
    await click('[data-cf-pilot-controls] summary');
    assert.equal(await evaluate(`document.querySelector('[data-cf-pilot-controls]').open`),false);
    rows.push({nativePilotControls:true,viewport:{width,height},font:'fs-xl',expanded:controls,explicitStop:true,trustedInput:true});
  }
  assert.equal(errors.length, 0, errors.join('\n'));
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ ...report(), status: 'PASS' }, null, 2) + '\n');
  console.log(`PASS: 48 protected portrait conditions, 3 study layout rows, 9 native panel paths and 3 expanded-control viewports; ${images.length} generated review images.`);
} catch (error) {
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ ...report(), status: 'FAIL', failure: String(error) }, null, 2) + '\n');
  throw error;
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
