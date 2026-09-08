import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic, not a certificate. Run with the shared tool lock held, outside macOS Seatbelt.
// node audits/AV_MAGNETAR_FIELD_20260908/native-runner.mjs /absolute/evidence-dist /absolute/fresh-output
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(process.argv.length, 4, 'Expected evidence-dist and fresh-output arguments');
const dist = fs.realpathSync(process.argv[2]), out = path.resolve(process.argv[3]);
assert(!fs.existsSync(out) && !out.startsWith(dist + path.sep), 'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)), path.dirname(out), 'Output parent must be real, existing directory');
fs.mkdirSync(out);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const saveFile = path.join(repo, 'port/baseline-v1.8.9/save-fixtures.json');
const starFile = path.join(repo, 'port/v2/tests/arc9-survey-action.test.ts');
const starSource = fs.readFileSync(starFile, 'utf8');
const fixture = name => {
  const row = starSource.match(new RegExp(`^  ${name}: Object\\.freeze\\(\\{ galaxy: HOME_GALAXY, star: Object\\.freeze\\(\\{ seed: ([0-9]+), x: ([-.0-9]+), y: ([-.0-9]+) \\}`, 'm'));
  assert(row, 'Canonical star fixture missing: ' + name);
  const raw = structuredClone(JSON.parse(fs.readFileSync(saveFile, 'utf8')).inputs.veteran_rich);
  Object.assign(raw, { asc: 2, tut: 1, fx: 1, rm: 0, me: 'Magnetar diagnostic' }); delete raw.tsnap;
  raw.view = { type: 'star', gal: raw.view.gal, star: { seed: +row[1], x: +row[2], y: +row[3] } };
  assert(raw.view.gal.seed === 999 && raw.view.gal.x === 90 && raw.view.gal.y === -60);
  return raw;
};
const report = { schema: 'cf-native-magnetar-diagnostic/v1', status: 'RUNNING', certification: false,
  startedAt: new Date().toISOString(), dist, sources: {}, served: {}, steps: [], screenshots: [], errors: [],
  limitations: ['Diagnostic asc=2/tut=1 save replacement on a fresh isolated origin; not fresh-player progression proof.',
    'Headless Chromium viewport emulation, not physical iPhone/Safari or human visual acceptance.',
    'Static MAG field only; not Slice/Glass certification, broad scene memory qualification or audio verification.'] };
for (const file of [saveFile, starFile, path.join(repo, 'port/v2/apps/game/src/main.ts'), path.join(repo, 'port/v2/apps/game/src/system-star-field.ts'), fileURLToPath(import.meta.url)]) report.sources[path.relative(repo, file)] = hash(fs.readFileSync(file));
const persist = () => fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.wav':'audio/wav', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    assert(req.method === 'GET' || req.method === 'HEAD');
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = fs.realpathSync(path.resolve(dist, '.' + (name === '/' ? '/index.html' : name)));
    assert(file.startsWith(dist + path.sep) && fs.statSync(file).isFile());
    const bytes = fs.readFileSync(file), key = path.relative(dist, file), digest = hash(bytes);
    assert(!report.served[key] || report.served[key] === digest, 'Served bytes changed'); report.served[key] = digest;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
let browser, send, evaluate;
const S = 'window.__CF_SLICE__';
const ready = `(()=>{const s=${S}?.api.state(),p=s?.persistence,r=p?.runtime;return p?.ready===true&&p.hold===null&&p.seedBootstrapPending===false&&p.bootRouteRepairPending===false&&p.mutationBlocked===false&&p.documentToken===${S}.documentToken&&r?.visible===true&&r.answerable===true&&r.leaseOwned===true&&r.accruing===true&&r.staleBlocked===false&&s.sceneResources.pendingPersistenceWrites===0})()`;
const fields = `${S}.world.children.filter(c=>c.label==='system-magnetar-field')`;
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,star:s.star,starX:s.starX,starY:s.starY,navStarKey:s.navStarKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,fxOn:s.fxOn,motionMode:s.motionMode,persistence:s.persistence,resources:s.sceneResources,viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfMagInputs,fields:${fields}.map(f=>({visible:f.visible,alpha:f.alpha,destroyed:f.destroyed,bounds:{x:f.getBounds().x,y:f.getBounds().y,width:f.getBounds().width,height:f.getBounds().height},arcs:f.children.map(a=>({rotation:a.rotation,visible:a.visible,eventMode:a.eventMode,destroyed:a.destroyed,instructions:a.context.instructions.map(i=>({action:i.action,width:i.data?.style?.width,color:i.data?.style?.color,alpha:i.data?.style?.alpha}))}))}))}:null})()`;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`; persist();
  browser = await openChromiumCdp({ label: 'scoped native magnetar field', userDataPrefix: 'cf-mag-20260908', commandTimeoutMs: 15000,
    onEvent: e => { if (e.method === 'Runtime.exceptionThrown') report.errors.push(e.params.exceptionDetails); } });
  report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  send = (method, params = {}) => browser.send(method, params, sessionId);
  await send('Runtime.enable'); await send('Page.enable');
  evaluate = async expression => {
    report.pendingEvaluation = { expression, sha256: hash(expression), at: new Date().toISOString() }; persist();
    const answer = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!answer.exceptionDetails, JSON.stringify(answer.exceptionDetails)); report.pendingEvaluation = null;
    return answer.result.value;
  };
  const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const wait = async (name, condition) => {
    const step = { name, condition, status: 'WAITING' }; report.steps.push(step); persist();
    const end = Date.now() + 20000;
    while (!await evaluate(condition)) { assert(Date.now() < end, 'Timed out: ' + name); await delay(100); }
    step.status = 'PASS'; persist();
  };
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cfMagInputs=[];for(const type of ['click','contextmenu','wheel','keydown'])document.addEventListener(type,e=>{if(window.__cfMagInputs.length<180)window.__cfMagInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,key:e.key,x:e.clientX,y:e.clientY})},true)` });
  const native = async (point, button = 'left') => {
    const count = await evaluate('window.__cfMagInputs.length');
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...point, button:'none' });
    await send('Input.dispatchMouseEvent', { type:'mousePressed', ...point, button, buttons:button==='right'?2:1, clickCount:1 });
    await send('Input.dispatchMouseEvent', { type:'mouseReleased', ...point, button, buttons:0, clickCount:1 });
    await frames();
    assert(await evaluate(`window.__cfMagInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`), 'Native input receipt missing');
    report.steps.push({ name:'native input', button, point }); persist();
  };
  const click = async selector => {
    const point = await evaluate(`(async()=>{const a=document.querySelectorAll(${JSON.stringify(selector)});if(a.length!==1)throw Error('Nonunique control');const e=a[0];e.scrollIntoView({block:'center'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||b.width<=0||b.height<=0||!(h===e||e.contains(h)))throw Error('Control occluded: '+${JSON.stringify(selector)});return{x,y}})()`);
    await native(point);
  };
  const canvasPoint = async (x = 0, y = 0) => evaluate(`(()=>{const p=${S}.world.toGlobal({x:${x},y:${y}});if(document.elementFromPoint(p.x,p.y)!==${S}.app.canvas)throw Error('Canvas point occluded '+JSON.stringify(p));return{x:p.x,y:p.y}})()`);
  const shot = async name => {
    const { data } = await send('Page.captureScreenshot', { format:'png' }); const bytes=Buffer.from(data,'base64');
    fs.writeFileSync(path.join(out, name+'.png'), bytes, { flag:'wx' }); report.screenshots.push({ path:name+'.png', sha256:hash(bytes) }); persist();
  };
  const checkField = async name => {
    const s = await evaluate(snapshot); report.steps.push({ name, state:s });
    assert.equal(s.fields.length, 1); const f=s.fields[0]; assert(f.visible && f.alpha===1 && !f.destroyed);
    assert.equal(f.arcs.length, 2); assert.deepEqual(f.arcs.map(a=>a.rotation), [.5,-.5]);
    assert(f.arcs.every(a=>!a.destroyed&&a.visible&&a.eventMode==='none'&&a.instructions.length===1&&a.instructions[0].action==='stroke'&&a.instructions[0].width===1.2&&a.instructions[0].color===0x96c8ff&&a.instructions[0].alpha===.45));
    assert(await evaluate(`(()=>{const a=${fields}[0].children;return a[0].context!==a[1].context})()`), 'Arcs must own distinct contexts'); persist(); return s;
  };
  const load = async name => {
    await wait('writable before '+name, ready); const previous=await evaluate(`${S}.documentToken`), raw=fixture(name);
    report.steps.push({ name:'source-derived isolated fixture', kind:name, star:raw.view.star, fixtureSha256:hash(JSON.stringify(raw)), previous }); persist();
    // Schedule once so this CDP reply precedes the import owner's intentional document replacement.
    await evaluate(`setTimeout(()=>{${S}.api.importBlob(${JSON.stringify(JSON.stringify(raw))}).then(e=>{if(e)window.__cfMagImportError=e}).catch(e=>{window.__cfMagImportError=String(e)})},0);true`);
    await wait('new writable '+name+' document', `(()=>{if(window.__cfMagImportError)throw Error(window.__cfMagImportError);return ${S}?.documentToken!==${JSON.stringify(previous)}&&${ready}&&${S}.api.state().mode==='system'&&${S}.api.state().star===${raw.view.star.seed}})()`);
    const s=await evaluate(snapshot); assert.equal(s.navStarKey, s.renderedScene.starKey); assert.equal(s.renderedScene.mode,'system');
    assert.equal(s.starX,raw.view.star.x); assert.equal(s.starY,raw.view.star.y); return raw.view.star;
  };
  const viewport = async (width,height,dpr,touch) => {
    await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:dpr,mobile:touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled:touch,maxTouchPoints:1 });
    await send('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion',value:'no-preference' }] });
  };
  await viewport(390,844,2,true); await send('Page.navigate', { url:report.origin+'/' });
  await wait('first answerable document', `${S}?.api&&${ready}`);
  if (await evaluate(`${S}.api.state().tutActive`)) { await click('[data-sel=tutskip]'); await wait('Training closed', `!${S}.api.state().tutActive&&${ready}`); }
  const star=await load('MAG');
  assert.equal(await evaluate(`${S}.api.state().cardOpen`), false);
  await native(await canvasPoint(), 'right');
  await wait('native MAG exit to galaxy', `${S}.api.state().mode==='galaxy'&&${S}.api.state().fine&&${ready}`);
  await native(await canvasPoint(star.x,star.y));
  await wait('native MAG Survey offers Enter', `document.querySelector('#survey [data-act="travel"]')?.textContent.includes('Enter system')&&${ready}`);
  await click('#survey [data-act="travel"]');
  await wait('native MAG rendered entry', `${S}.api.state().mode==='system'&&${S}.api.state().star===${star.seed}&&${S}.api.state().renderedScene.starKey===${S}.api.state().navStarKey&&${ready}`);
  assert(await evaluate(`window.__cfMagInputs.some(e=>e.trusted&&e.act==='travel')`));
  const closeup = async name => {
    // Ordinary cursor-anchored wheel input, bounded to a readable central field width.
    for(let i=0;i<45;i++) {
      const width=await evaluate(`${fields}[0].getBounds().width`); if(width>=140)break;
      await send('Input.dispatchMouseEvent', { type:'mouseWheel', ...await canvasPoint(), deltaX:0, deltaY:-100 }); await frames();
    }
    await wait('camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`); const s=await checkField(name);
    assert.deepEqual(s.viewport, name.includes('desktop') ? [1440,1000,1] : [390,844,2]);
    assert.equal(await evaluate(`${S}.app.renderer.resolution`), name.includes('desktop') ? 1 : 2);
    assert(s.fields[0].bounds.width>=140 && s.fields[0].bounds.width<innerLimit(s.viewport[0]), 'Close-up bounds invalid');
    await shot(name);
  };
  const innerLimit = width => width*.9;
  await closeup('mag-phone-390x844-dpr2');
  report.pixelControl = await evaluate(`(()=>{const s=${S},f=${fields}[0],started=s.app.ticker.started,visible=f.visible,frame=s.app.screen.clone();s.app.ticker.stop();try{const read=()=>s.app.renderer.extract.pixels({target:s.app.stage,frame,resolution:s.app.renderer.resolution});const a=read();f.visible=false;const b=read();f.visible=visible;const c=read();if(a.width<=0||a.height<=0||a.width!==b.width||a.width!==c.width||a.height!==b.height||a.height!==c.height||a.pixels.length!==b.pixels.length||a.pixels.length!==c.pixels.length||a.pixels.length!==a.width*a.height*4)throw Error('Pixel dimensions changed');let changed=0,restoredDifferences=0;for(let i=0;i<a.pixels.length;i++){if(a.pixels[i]!==b.pixels[i])changed++;if(a.pixels[i]!==c.pixels[i])restoredDifferences++}return{method:'actual stage; explicit identical screen frame and renderer resolution; ticker stopped; field visibility only',width:a.width,height:a.height,changedChannels:changed,restoredDifferences}}finally{f.visible=visible;s.app.renderer.render(s.app.stage);if(started)s.app.ticker.start()}})()`);
  assert(report.pixelControl.changedChannels>0 && report.pixelControl.restoredDifferences===0, 'Hidden-field/restored pixel control failed'); persist();
  await click('#docksets'); await click('[data-motion="1"]'); await wait('Reduced setting committed', `${S}.api.state().motionMode===1&&${ready}`); await checkField('reduced retains MAG');
  await click('[data-sel="set-effects"]'); await wait('Effects Off committed', `${S}.api.state().fxOn===false&&${ready}`); await checkField('effects off retains MAG');
  await send('Input.dispatchKeyEvent', { type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 });
  await send('Input.dispatchKeyEvent', { type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 }); await frames();
  await closeup('mag-phone-reduced-effects-off');
  await viewport(1440,1000,1,false); await frames(); await closeup('mag-desktop-1440x1000-dpr1');
  await evaluate(`(()=>{const f=${fields}[0];window.__cfMagRetired={field:f,arcs:[...f.children],contexts:f.children.map(a=>a.context)};return true})()`);
  await native(await canvasPoint(), 'right'); await wait('native exit destroys MAG owner', `${S}.api.state().mode==='galaxy'&&${fields}.length===0&&${ready}`);
  report.retired=await evaluate(`(()=>{const r=window.__cfMagRetired;return{fieldDestroyed:r.field.destroyed,parentNull:r.field.parent===null,arcs:r.arcs.map(a=>a.destroyed),contexts:r.contexts.map(c=>({destroyed:c.destroyed,instructionsNull:c.instructions===null})),resources:${S}.api.sceneResourceDiagnostics()}})()`);
  assert(report.retired.fieldDestroyed&&report.retired.parentNull&&report.retired.arcs.every(Boolean)&&report.retired.contexts.every(c=>c.destroyed&&c.instructionsNull));
  await evaluate('delete window.__cfMagRetired;true');
  for(const name of ['NS','sol']) { await load(name); const s=await evaluate(snapshot); report.steps.push({ name:name+' absence control',state:s }); assert.equal(s.fields.length,0); }
  assert.equal(report.errors.length,0,'Runtime exception observed'); report.status='PASS';
} catch(error) {
  report.status='FAIL'; report.failure=String(error.stack??error); process.exitCode=1;
  const failedEvaluation=report.pendingEvaluation;
  try { report.failureState=await evaluate?.(snapshot); } catch(e) { report.failureStateError=String(e); }
  report.failedEvaluation=failedEvaluation;
  try { const shot=await send?.('Page.captureScreenshot',{format:'png'}); if(shot)fs.writeFileSync(path.join(out,'failure.png'),Buffer.from(shot.data,'base64'),{flag:'wx'}); } catch(e) { report.failureScreenshotError=String(e); }
} finally {
  const cleanup=[];
  try { await browser?.close(); } catch(e) { cleanup.push(String(e)); }
  if(server.listening) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
  try {
    for(const [file,digest] of Object.entries(report.sources)) assert.equal(hash(fs.readFileSync(path.join(repo,file))),digest,'Source changed: '+file);
    for(const [file,digest] of Object.entries(report.served)) assert.equal(hash(fs.readFileSync(path.join(dist,file))),digest,'Dist changed: '+file);
  } catch(e) { cleanup.push(String(e)); }
  if(cleanup.length) { report.cleanupFailures=cleanup;report.status='FAIL';process.exitCode=1; }
  report.endedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,output:out,failure:report.failure}));
