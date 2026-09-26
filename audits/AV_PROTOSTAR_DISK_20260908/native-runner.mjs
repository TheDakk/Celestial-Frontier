import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic, not a certificate. Run with the shared tool lock held, outside macOS Seatbelt.
// node audits/AV_PROTOSTAR_DISK_20260908/native-runner.mjs /absolute/evidence-dist /absolute/fresh-output
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
const legacyFile=path.join(repo,'celestial-frontier.html'), legacySource=fs.readFileSync(legacyFile,'utf8');
const marker='/* a star being born inside its protoplanetary disk */';
assert.equal(legacySource.split(marker).length,2,'Legacy PROTO marker must be unique');
const legacyBody=legacySource.split(marker)[1].split('} else {')[0];
assert(legacyBody.includes('const dk=ctx.createRadialGradient')&&legacyBody.includes('const pg=ctx.createRadialGradient'));
const diskBlock=legacyBody.match(/ctx\.save\(\);[\s\S]*?ctx\.restore\(\);/g);
assert.equal(diskBlock?.length,1,'Legacy dust-disk block must be unique');
const omittedDiskBody=legacyBody.replace(diskBlock[0],'');
const addressFile = path.join(repo, 'port/v2/packages/scene/src/address.ts'), addressSource = fs.readFileSync(addressFile, 'utf8');
const normalizeBody = addressSource.match(/export function normalizeCF1Coordinate\(value: unknown\): number \| null \{([\s\S]*?)^\}/m)?.[1];
const coordinateConstant = name => Number(addressSource.match(new RegExp(`const ${name} = ([0-9e]+);`))?.[1]);
assert(normalizeBody && coordinateConstant('CF1_COORDINATE_SCALE')===100 && coordinateConstant('CF1_COORDINATE_LIMIT')===1e7);
const normalizeCoordinate = value => new Function('value','CF1_COORDINATE_SCALE','CF1_COORDINATE_LIMIT',normalizeBody)(value,coordinateConstant('CF1_COORDINATE_SCALE'),coordinateConstant('CF1_COORDINATE_LIMIT'));
const fixture = name => {
  const row = starSource.match(new RegExp(`^  ${name}: Object\\.freeze\\(\\{ galaxy: HOME_GALAXY, star: Object\\.freeze\\(\\{ seed: ([0-9]+), x: ([-.0-9]+), y: ([-.0-9]+) \\}`, 'm'));
  assert(row, 'Canonical star fixture missing: ' + name);
  const raw = structuredClone(JSON.parse(fs.readFileSync(saveFile, 'utf8')).inputs.veteran_rich);
  Object.assign(raw, { asc: 2, tut: 1, fx: 1, rm: 0, me: 'Protostar diagnostic' }); delete raw.tsnap;
  assert(Array.isArray(raw.items) && !raw.items.some(([id])=>id==='array'), 'Baseline array ownership changed');
  raw.items.push(['array',1]); // charter.ts: the owned Long-Range Array grants stage2; chapter2 alone does not.
  raw.view = { type: 'star', gal: raw.view.gal, star: { seed: +row[1], x: +row[2], y: +row[3] } };
  assert(raw.view.gal.seed === 999 && raw.view.gal.x === 90 && raw.view.gal.y === -60);
  return raw;
};
const report = { schema: 'cf-native-protostar-diagnostic/v1', status: 'RUNNING', certification: false,
  startedAt: new Date().toISOString(), dist, sources: {}, served: {}, steps: [], screenshots: [], errors: [],
  limitations: ['Diagnostic asc=2/tut=1 plus owned array=1 save replacement on a fresh isolated origin; chapter2 alone grants no stage. Not fresh-player progression proof.',
    'Headless Chromium viewport emulation, not physical iPhone/Safari or human visual acceptance.',
    'Static PROTO disk only; not Slice/Glass certification, broad scene memory qualification or audio verification.'] };
for (const file of [saveFile, starFile, addressFile, path.join(repo, 'port/v2/packages/scene/src/charter.ts'), path.join(repo, 'port/v2/apps/game/src/main.ts'), path.join(repo, 'port/v2/apps/game/src/system-protostar.ts'), path.join(repo, 'port/v2/apps/game/src/scene-texture-owner.ts'), legacyFile, fileURLToPath(import.meta.url)]) report.sources[path.relative(repo, file)] = hash(fs.readFileSync(file));
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
const fields = `${S}.world.children.filter(c=>c.label==='system-protostar-disk')`;
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,star:s.star,starX:s.starX,starY:s.starY,navStarKey:s.navStarKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,fxOn:s.fxOn,motionMode:s.motionMode,persistence:s.persistence,resources:s.sceneResources,viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfProtoInputs,fields:${fields}.map(f=>({visible:f.visible,alpha:f.alpha,eventMode:f.eventMode,destroyed:f.destroyed,width:f.width,height:f.height,anchor:[f.anchor.x,f.anchor.y],position:[f.x,f.y],rotation:f.rotation,textureDestroyed:f.texture.destroyed,sourceDestroyed:f.texture.source.destroyed,canvasSize:[f.texture.source.resource.width,f.texture.source.resource.height],bounds:{x:f.getBounds().x,y:f.getBounds().y,width:f.getBounds().width,height:f.getBounds().height}}))}:null})()`;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`; persist();
  browser = await openChromiumCdp({ label: 'scoped native protostar field', userDataPrefix: 'cf-proto-20260908', commandTimeoutMs: 15000,
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
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cfProtoInputs=[];for(const type of ['click','contextmenu','wheel','keydown'])document.addEventListener(type,e=>{if(window.__cfProtoInputs.length<180)window.__cfProtoInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,key:e.key,x:e.clientX,y:e.clientY})},true)` });
  const native = async (point, button = 'left') => {
    const count = await evaluate('window.__cfProtoInputs.length');
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...point, button:'none' });
    await send('Input.dispatchMouseEvent', { type:'mousePressed', ...point, button, buttons:button==='right'?2:1, clickCount:1 });
    await send('Input.dispatchMouseEvent', { type:'mouseReleased', ...point, button, buttons:0, clickCount:1 });
    await frames();
    assert(await evaluate(`window.__cfProtoInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`), 'Native input receipt missing');
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
    assert(Math.abs(f.width-140)<1e-9&&Math.abs(f.height-80)<1e-9&&f.eventMode==='none'&&!f.textureDestroyed&&!f.sourceDestroyed);
    assert.deepEqual(f.canvasSize,[420,240]); assert.deepEqual(f.anchor,[.5,.5]); assert.deepEqual(f.position,[0,0]); assert.equal(f.rotation,0);
    const r=s.resources.registry; assert(r.balanced&&r.coherent&&r.externalDestroyFaults===0&&r.liveLeasesByKind['scene-canvas']>=1); assert.equal(r.liveLeasesByKind['star-surface'],0,'PROTO must not allocate an ordinary stellar close-up'); persist(); return s;
  };
  const load = async name => {
    await wait('writable before '+name, ready); const previous=await evaluate(`${S}.documentToken`), raw=fixture(name);
    const canonicalStar={seed:raw.view.star.seed,x:normalizeCoordinate(raw.view.star.x),y:normalizeCoordinate(raw.view.star.y)};
    report.steps.push({ name:'source-derived isolated fixture', kind:name, star:raw.view.star, canonicalStar, ownedArray:1, chapter:raw.asc, fixtureSha256:hash(JSON.stringify(raw)), previous }); persist();
    // Schedule once so this CDP reply precedes the import owner's intentional document replacement.
    await evaluate(`setTimeout(()=>{${S}.api.importBlob(${JSON.stringify(JSON.stringify(raw))}).then(e=>{if(e)window.__cfProtoImportError=e}).catch(e=>{window.__cfProtoImportError=String(e)})},0);true`);
    await wait('new writable '+name+' document', `(()=>{if(window.__cfProtoImportError)throw Error(window.__cfProtoImportError);return ${S}?.documentToken!==${JSON.stringify(previous)}&&${ready}&&${S}.api.state().mode==='system'&&${S}.api.state().star===${raw.view.star.seed}})()`);
    const s=await evaluate(snapshot); assert.equal(s.navStarKey, s.renderedScene.starKey); assert.equal(s.renderedScene.mode,'system');
    assert.equal(s.starX,canonicalStar.x); assert.equal(s.starY,canonicalStar.y); return canonicalStar;
  };
  const viewport = async (width,height,dpr,touch) => {
    await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:dpr,mobile:touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled:touch,maxTouchPoints:1 });
    await send('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion',value:'no-preference' }] });
  };
  await viewport(390,844,2,true); await send('Page.navigate', { url:report.origin+'/' });
  await wait('first answerable document', `${S}?.api&&${ready}`);
  if (await evaluate(`${S}.api.state().tutActive`)) { await click('[data-sel=tutskip]'); await wait('Training closed', `!${S}.api.state().tutActive&&${ready}`); }
  const star=await load('PROTO');
  assert.equal(await evaluate(`${S}.api.state().cardOpen`), false);
  await native(await canvasPoint(), 'right');
  await wait('native PROTO exit to galaxy', `${S}.api.state().mode==='galaxy'&&${S}.api.state().fine&&${ready}`);
  await native(await canvasPoint(star.x,star.y));
  await wait('native PROTO Survey offers Enter', `document.querySelector('#survey [data-act="travel"]')?.textContent.includes('Enter system')&&${ready}`);
  await click('#survey [data-act="travel"]');
  await wait('native PROTO rendered entry', `${S}.api.state().mode==='system'&&${S}.api.state().star===${star.seed}&&${S}.api.state().renderedScene.starKey===${S}.api.state().navStarKey&&${ready}`);
  assert(await evaluate(`window.__cfProtoInputs.some(e=>e.trusted&&e.act==='travel')`));
  await wait('overview camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`);
  await checkField('PROTO phone overview'); await shot('proto-phone-overview');
  report.canonicalCanvas=await evaluate(`(async()=>{const actual=${fields}[0].texture.source.resource;if(!(actual instanceof HTMLCanvasElement)||actual.width!==420||actual.height!==240)throw Error('Actual PROTO canvas absent');const refs=[];try{const read=body=>{const c=document.createElement('canvas');refs.push(c);c.width=420;c.height=240;const ctx=c.getContext('2d');ctx.translate(210,120);ctx.scale(3,3);new Function('ctx','TAU',body)(ctx,Math.PI*2);return ctx.getImageData(0,0,420,240).data};const a=actual.getContext('2d').getImageData(0,0,420,240).data,b=read(${JSON.stringify(legacyBody)}),n=read(${JSON.stringify(omittedDiskBody)});let different=0,omittedDifferent=0,paintedPixels=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])different++;if(a[i]!==n[i])omittedDifferent++;if(i%4===3&&a[i]>0)paintedPixels++}const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');return{method:'Actual Sprite TextureSource canvas RGBA versus independent legacy HTML block; 420x240,translate210/120,scale3,TAU2PI',differentChannels:different,omittedDiskDifferentChannels:omittedDifferent,paintedPixels,actualSha256:await digest(a),legacySha256:await digest(b),omittedDiskSha256:await digest(n)}}finally{for(const c of refs)c.width=c.height=0}})()`);
  assert(report.canonicalCanvas.differentChannels===0&&report.canonicalCanvas.omittedDiskDifferentChannels>0&&report.canonicalCanvas.paintedPixels>0,'Canonical PROTO canvas comparison failed'); persist();
  const closeup = async name => {
    // Desktop zoom deliberately exceeds the old ordinary-surface threshold.
    const targetWidth=name.includes('desktop')?840:200;
    for(let i=0;i<100;i++) {
      const width=await evaluate(`140*${S}.camT.z`); if(width>=targetWidth)break;
      await send('Input.dispatchMouseEvent', { type:'mouseWheel', ...await canvasPoint(), deltaX:0, deltaY:-25 }); await frames();
    }
    await wait('camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`); const s=await checkField(name);
    assert.deepEqual(s.viewport, name.includes('desktop') ? [1440,1000,1] : [390,844,2]);
    assert.equal(await evaluate(`${S}.app.renderer.resolution`), name.includes('desktop') ? 1 : 2);
    assert(s.fields[0].bounds.width>=targetWidth-.15 && s.fields[0].bounds.width<innerLimit(s.viewport[0]), 'Close-up bounds invalid');
    if(name.includes('desktop'))assert(await evaluate(`16*${S}.camT.z*${S}.app.renderer.resolution>90`),'Old ordinary-surface threshold must be exceeded');
    await shot(name);
  };
  const innerLimit = width => width*.9;
  await closeup('proto-phone-390x844-dpr2');
  report.pixelControl = await evaluate(`(()=>{const s=${S},f=${fields}[0],started=s.app.ticker.started,visible=f.visible,frame=s.app.screen.clone();s.app.ticker.stop();try{const read=()=>s.app.renderer.extract.pixels({target:s.app.stage,frame,resolution:s.app.renderer.resolution});const a=read();f.visible=false;const b=read();f.visible=visible;const c=read();if(a.width<=0||a.height<=0||a.width!==b.width||a.width!==c.width||a.height!==b.height||a.height!==c.height||a.pixels.length!==b.pixels.length||a.pixels.length!==c.pixels.length||a.pixels.length!==a.width*a.height*4)throw Error('Pixel dimensions changed');let changed=0,restoredDifferences=0;for(let i=0;i<a.pixels.length;i++){if(a.pixels[i]!==b.pixels[i])changed++;if(a.pixels[i]!==c.pixels[i])restoredDifferences++}return{method:'actual stage; explicit identical screen frame and renderer resolution; ticker stopped; field visibility only',width:a.width,height:a.height,changedChannels:changed,restoredDifferences}}finally{f.visible=visible;s.app.renderer.render(s.app.stage);if(started)s.app.ticker.start()}})()`);
  assert(report.pixelControl.changedChannels>0 && report.pixelControl.restoredDifferences===0, 'Hidden-field/restored pixel control failed'); persist();
  await click('#docksets'); await click('[data-motion="1"]'); await wait('Reduced setting committed', `${S}.api.state().motionMode===1&&${ready}`); await checkField('reduced retains PROTO');
  await click('[data-sel="set-effects"]'); await wait('Effects Off committed', `${S}.api.state().fxOn===false&&${ready}`); await checkField('effects off retains PROTO');
  await send('Input.dispatchKeyEvent', { type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 });
  await send('Input.dispatchKeyEvent', { type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 }); await frames();
  await closeup('proto-phone-reduced-effects-off');
  await viewport(1440,1000,1,false); await frames(); await closeup('proto-desktop-1440x1000-dpr1');
  await evaluate(`(()=>{const f=${fields}[0],r=${S}.api.sceneResourceDiagnostics().registry;window.__cfProtoRetired={field:f,texture:f.texture,source:f.texture.source,canvas:f.texture.source.resource,registry:r,scope:r.activeScopes.find(s=>s.label.startsWith('scene:'))};return true})()`);
  await native(await canvasPoint(), 'right'); await wait('native exit destroys PROTO owner', `${S}.api.state().mode==='galaxy'&&${fields}.length===0&&${ready}`);
  report.retired=await evaluate(`(()=>{const r=window.__cfProtoRetired,a=${S}.api.sceneResourceDiagnostics().registry;return{spriteDestroyed:r.field.destroyed,parentNull:r.field.parent===null,textureDestroyed:r.texture.destroyed,sourceDestroyed:r.source.destroyed,sourceResourceNull:r.source.resource===null,priorCanvasSize:[r.canvas.width,r.canvas.height],oldScope:r.scope,oldScopeAbsent:!!r.scope&&!a.activeScopes.some(s=>s.label===r.scope.label),leaseReleases:a.leaseReleases-r.registry.leaseReleases,textureDisposals:a.textureDisposals-r.registry.textureDisposals,registry:a,resources:${S}.api.sceneResourceDiagnostics()}})()`);
  const retired=report.retired,r=retired.registry;
  assert(retired.spriteDestroyed&&retired.parentNull&&retired.textureDestroyed&&retired.sourceDestroyed&&retired.sourceResourceNull&&retired.oldScopeAbsent);
  assert(retired.leaseReleases>=retired.oldScope.leaseCount&&retired.textureDisposals>=1&&r.balanced&&r.coherent&&r.externalDestroyFaults===0);
  assert.equal(r.leaseAcquisitions-r.leaseReleases,r.activeLeaseCount); assert.equal(r.textureCreations-r.textureDisposals,r.liveTextureCount);
  await evaluate('delete window.__cfProtoRetired;true');
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
