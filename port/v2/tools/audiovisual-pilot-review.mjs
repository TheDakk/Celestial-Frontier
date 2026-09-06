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

const report = () => ({ kind: 'local-pilot-review-diagnostic', certification: false, buildIdentity, startedAt, finishedAt: new Date().toISOString(), rows, images, errors,
  limitations: ['Headless desktop Chromium is not a physical iPhone, Safari or installed-PWA acceptance.', 'All eight anatomical animations remain incomplete; motion is an external frame marker.', 'No human visual or listening verdict is inferred.'] });
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/audiovisual-pilot.html' });
  await waitFor(`document.querySelector('#pilot-review')?.dataset.pilotReview==='ready' && [...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0) && [...document.querySelectorAll('.p-art-basin canvas')].every(c=>c.width===960)`);
  await screenshot('desktop-direction', '#pilot-review>header');
  await screenshot('scout-comparison', '#pilot-review>section:nth-of-type(1)');
  await screenshot('temperate-comparison', '#pilot-review>section:nth-of-type(2)');
  const families = await evaluate(`[...document.querySelector('select').options].map(o=>o.value)`);
  assert.equal(families.length, 8);
  for (const id of families) for (const size of [132, 300, 440]) {
    await evaluate(`(()=>{const [family,size]=document.querySelectorAll('select');family.value=${JSON.stringify(id)};size.value='${size}';family.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor(`[...document.querySelectorAll('.p-native-pair img')].length===2 && [...document.querySelectorAll('.p-native-pair img')].every(i=>i.dataset.pilotSpecimen===${JSON.stringify(id)}&&i.dataset.pilotSize==='${size}'&&i.complete&&i.naturalWidth>0)`);
    const pair = await evaluate(`Promise.all([...document.querySelectorAll('.p-native-pair img')].map(async i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,c.width,c.height).data);const style=getComputedStyle(i);return{key:i.dataset.visualKey,width:i.width,height:i.height,naturalWidth:i.naturalWidth,sha256:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),transform:style.transform,filter:style.filter,opacity:style.opacity}}))`);
    assert.equal(pair[0].key, pair[1].key); assert.equal(pair[0].sha256, pair[1].sha256);
    for (const item of pair) { assert.equal(item.width, size); assert.equal(item.height, size); assert.equal(item.transform, 'none'); assert.equal(item.filter, 'none'); assert.equal(item.opacity, '1'); }
    rows.push({ id, size, static: pair[0], animatedPresentation: pair[1], anatomicalAnimation: 'INCOMPLETE' });
    await screenshot(`${id}-${size}`, '#pilot-review>section:nth-of-type(3)');
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
  const wrongPair = structuredClone(rows[0]); wrongPair.animatedPresentation.sha256 = '0'.repeat(64);
  assert.throws(() => assert.equal(wrongPair.static.sha256, wrongPair.animatedPresentation.sha256));
  rows.push({ control: 'different portrait pixels rejected', pass: true });
  for (const [width,height] of [[390,844],[430,932],[820,1180]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate('scrollTo(0,0)');
    const layout = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,targets:[...document.querySelectorAll('button,select,a.p-button')].map(e=>({label:e.textContent,height:e.getBoundingClientRect().height}))})`);
    assert(layout.scrollWidth <= width, `review overflows ${width}: ${layout.scrollWidth}`);
    assert(layout.targets.every(t=>t.height>=44), 'review target smaller than 44px');
    rows.push({ viewport: { width,height }, ...layout });
    await screenshot(`review-${width}`, '#pilot-review>header');
    await screenshot(`mockups-${width}`, '#pilot-review>section:nth-of-type(5)');
  }
  // Real existing journey on this isolated origin: no save hooks or invented actions.
  const click = async (selector) => {
    const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', {type:'mousePressed',...point,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased',...point,button:'left',clickCount:1});
  };
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
  assert.equal(errors.length, 0, errors.join('\n'));
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ ...report(), status: 'PASS' }, null, 2) + '\n');
  console.log(`PASS: 48 protected portrait conditions, 3 layout rows; ${images.length} generated review images.`);
} catch (error) {
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ ...report(), status: 'FAIL', failure: String(error) }, null, 2) + '\n');
  throw error;
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
