import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic, not a certificate. Run with the shared tool lock held, outside macOS Seatbelt.
// node audits/AV_TRINARY_COMPANION_20260908/native-runner.mjs /absolute/evidence-dist /absolute/fresh-output
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(process.argv.length, 4, 'Expected evidence-dist and fresh-output arguments');
const dist = fs.realpathSync(process.argv[2]), out = path.resolve(process.argv[3]);
assert(!fs.existsSync(out) && !out.startsWith(dist + path.sep), 'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)), path.dirname(out), 'Output parent must be real, existing directory');
fs.mkdirSync(out);fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'runner.mjs'),fs.constants.COPYFILE_EXCL);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const saveFile = path.join(repo, 'port/baseline-v1.8.9/save-fixtures.json');
const fixtureFile=path.join(repo,'audits/AV_TRINARY_COMPANION_20260908/fixtures.json');
const fixtureEvidence=JSON.parse(fs.readFileSync(fixtureFile,'utf8'));
assert.equal(fixtureEvidence.schema,'cf-trinary-fixtures/v1');
for(const [file,digest] of Object.entries(fixtureEvidence.sources)){assert(!path.isAbsolute(file)&&!file.split('/').includes('..'));assert.equal(hash(fs.readFileSync(path.join(repo,file))),digest,'Fixture authority changed: '+file)}
const expected=fixtureEvidence.fixtures.trinary.system.trinary;
assert(expected&&fixtureEvidence.fixtures.trinary.system.binary&&!fixtureEvidence.fixtures.binary.system.trinary&&!fixtureEvidence.fixtures.sol.system.trinary);
const polishFile=path.join(repo,'port/v2/packages/art/src/canvas-treatment.ts');
const addressFile = path.join(repo, 'port/v2/packages/scene/src/address.ts'), addressSource = fs.readFileSync(addressFile, 'utf8');
const normalizeBody = addressSource.match(/export function normalizeCF1Coordinate\(value: unknown\): number \| null \{([\s\S]*?)^\}/m)?.[1];
const coordinateConstant = name => Number(addressSource.match(new RegExp(`const ${name} = ([0-9e]+);`))?.[1]);
assert(normalizeBody && coordinateConstant('CF1_COORDINATE_SCALE')===100 && coordinateConstant('CF1_COORDINATE_LIMIT')===1e7);
const normalizeCoordinate = value => new Function('value','CF1_COORDINATE_SCALE','CF1_COORDINATE_LIMIT',normalizeBody)(value,coordinateConstant('CF1_COORDINATE_SCALE'),coordinateConstant('CF1_COORDINATE_LIMIT'));
const fixture = name => {
  const row=fixtureEvidence.fixtures[name];assert(row,'Missing canonical fixture '+name);
  const raw = structuredClone(JSON.parse(fs.readFileSync(saveFile, 'utf8')).inputs.veteran_rich);
  Object.assign(raw, { asc: 2, tut: 1, fx: 1, rm: 0, me: 'Trinary diagnostic' }); delete raw.tsnap;
  assert(Array.isArray(raw.items) && !raw.items.some(([id])=>id==='array'), 'Baseline array ownership changed');
  raw.items.push(['array',1]); // charter.ts: the owned Long-Range Array grants stage2; chapter2 alone does not.
  raw.view = { type: 'star', gal: raw.view.gal, star: structuredClone(row.star) };
  assert.deepEqual({seed:raw.view.gal.seed,x:raw.view.gal.x,y:raw.view.gal.y},row.galaxy);
  return raw;
};
const report = { schema: 'cf-native-trinary-diagnostic/v1', status: 'RUNNING', certification: false,
  startedAt: new Date().toISOString(), dist, sources: {}, served: {}, steps: [], screenshots: [], errors: [],
  limitations: ['Diagnostic asc=2/tut=1 plus owned array=1 save replacement on a fresh isolated origin; chapter2 alone grants no stage. Not fresh-player progression proof.',
    'Headless Chromium viewport emulation, not physical iPhone/Safari or human visual acceptance.',
    'Generated third companion only; not Slice/Glass certification, broad scene memory qualification or audio verification.',
    'Texture retirement checks the actual Sprite and old scene scope/lease balances; shared canvas resources need not be forcibly destroyed while another owner retains them.'] };
for (const file of [saveFile, fixtureFile, addressFile, path.join(repo, 'port/v2/packages/scene/src/charter.ts'), path.join(repo, 'port/v2/apps/game/src/main.ts'), path.join(repo, 'port/v2/apps/game/src/scene-texture-owner.ts'), polishFile, path.join(repo,'port/v2/packages/art/src/surface-polish.ts'), ...Object.keys(fixtureEvidence.sources).map(f=>path.join(repo,f)), fileURLToPath(import.meta.url)]) report.sources[path.relative(repo, file)] = hash(fs.readFileSync(file));
report.fixtureEvidence=fixtureEvidence;
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
const fields = `${S}.world.children.filter(c=>c.label==='system-trinary-companion')`;
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,star:s.star,starX:s.starX,starY:s.starY,navStarKey:s.navStarKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,fxOn:s.fxOn,motionMode:s.motionMode,persistence:s.persistence,resources:s.sceneResources,at:performance.now(),caption:document.querySelector('#ctxbar')?.textContent,viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfTrinaryInputs,fields:${fields}.map(f=>({visible:f.visible,alpha:f.alpha,eventMode:f.eventMode,destroyed:f.destroyed,width:f.width,height:f.height,anchor:[f.anchor.x,f.anchor.y],position:[f.x,f.y],rotation:f.rotation,textureDestroyed:f.texture.destroyed,sourceDestroyed:f.texture.source.destroyed,canvasSize:[f.texture.source.resource.width,f.texture.source.resource.height],bounds:{x:f.getBounds().x,y:f.getBounds().y,width:f.getBounds().width,height:f.getBounds().height}}))}:null})()`;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`; persist();
  browser = await openChromiumCdp({ label: 'scoped native trinary field', userDataPrefix: 'cf-trinary-20260908', commandTimeoutMs: 15000,
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
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cfTrinaryInputs=[];for(const type of ['click','contextmenu','wheel','keydown'])document.addEventListener(type,e=>{if(window.__cfTrinaryInputs.length<180)window.__cfTrinaryInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,key:e.key,x:e.clientX,y:e.clientY})},true)` });
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const canvases=new WeakMap(),gradients=new WeakMap(),create=CanvasRenderingContext2D.prototype.createRadialGradient,stop=CanvasGradient.prototype.addColorStop;CanvasRenderingContext2D.prototype.createRadialGradient=function(...args){const gradient=create.apply(this,args),record={coords:args,stops:[]},records=canvases.get(this.canvas)??[];if(records.length<64){records.push(record);canvases.set(this.canvas,records);gradients.set(gradient,record)}return gradient};CanvasGradient.prototype.addColorStop=function(...args){const result=stop.apply(this,args),record=gradients.get(this);if(record&&record.stops.length<32)record.stops.push(args);return result};window.__cfTrinaryGradients=canvases})()`});
  const native = async (point, button = 'left') => {
    const count = await evaluate('window.__cfTrinaryInputs.length');
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...point, button:'none' });
    await send('Input.dispatchMouseEvent', { type:'mousePressed', ...point, button, buttons:button==='right'?2:1, clickCount:1 });
    await send('Input.dispatchMouseEvent', { type:'mouseReleased', ...point, button, buttons:0, clickCount:1 });
    await frames();
    assert(await evaluate(`window.__cfTrinaryInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`), 'Native input receipt missing');
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
    assert(Math.abs(f.width-expected.r2*4.8)<1e-9&&Math.abs(f.height-expected.r2*4.8)<1e-9&&f.eventMode==='none'&&!f.textureDestroyed&&!f.sourceDestroyed);
    assert.deepEqual(f.canvasSize,[256,256]);assert.deepEqual(f.anchor,[.5,.5]);assert(Math.abs(Math.hypot(...f.position)-expected.sep)<1e-6);assert.equal(f.rotation,0);
    assert(s.caption.includes('a triple system — three suns share this sky')&&!s.caption.includes('a binary pair'));
    if(s.motionMode===1){assert(Math.abs(f.position[0]-Math.cos(2.1)*expected.sep)<1e-6);assert(Math.abs(f.position[1]-Math.sin(2.1)*expected.sep)<1e-6)}
    const r=s.resources.registry;assert(r.balanced&&r.coherent&&r.externalDestroyFaults===0&&r.liveLeasesByKind['scene-canvas']>=1);persist();return s;
  };
  const load = async name => {
    await wait('writable before '+name, ready); const previous=await evaluate(`${S}.documentToken`), raw=fixture(name);
    const canonicalStar={seed:raw.view.star.seed,x:normalizeCoordinate(raw.view.star.x),y:normalizeCoordinate(raw.view.star.y)};
    report.steps.push({ name:'source-derived isolated fixture', kind:name, star:raw.view.star, canonicalStar, ownedArray:1, chapter:raw.asc, fixtureSha256:hash(JSON.stringify(raw)), previous }); persist();
    // Schedule once so this CDP reply precedes the import owner's intentional document replacement.
    await evaluate(`setTimeout(()=>{${S}.api.importBlob(${JSON.stringify(JSON.stringify(raw))}).then(e=>{if(e)window.__cfTrinaryImportError=e}).catch(e=>{window.__cfTrinaryImportError=String(e)})},0);true`);
    await wait('new writable '+name+' document', `(()=>{if(window.__cfTrinaryImportError)throw Error(window.__cfTrinaryImportError);return ${S}?.documentToken!==${JSON.stringify(previous)}&&${ready}&&${S}.api.state().mode==='system'&&${S}.api.state().star===${raw.view.star.seed}})()`);
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
  const star=await load('trinary');
  const address=await evaluate(`${S}.api.encodeHere()`);assert(typeof address==='string'&&address.startsWith('CF1'),'Exact rendered star code missing');
  report.nativeEntry={method:'native exact-address Search → Follow',address,expectedStar:star};persist();
  assert.equal(await evaluate(`${S}.api.state().cardOpen`), false);
  await native(await canvasPoint(), 'right');
  await wait('native trinary exit to galaxy', `${S}.api.state().mode==='galaxy'&&${S}.api.state().fine&&${ready}`);
  await click('#searchbox');await send('Input.insertText',{text:address});
  assert.equal(await evaluate("document.querySelector('#searchbox').value"),address);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait('native exact-address Follow renders system',`${S}.api.state().mode==='system'&&${S}.api.state().sharing.followOutcome.startsWith('committed:')&&${ready}`);
  const entered=await evaluate(snapshot);report.nativeEntry.state=entered;
  assert.equal(entered.star,star.seed);assert.equal(entered.starX,star.x);assert.equal(entered.starY,star.y);assert.equal(entered.renderedScene.starKey,entered.navStarKey);
  assert.equal(await evaluate("document.querySelector('#searchbox').value"),'');
  assert(await evaluate(`window.__cfTrinaryInputs.some(e=>e.trusted&&e.type==='keydown'&&e.key==='Enter')`));persist();
  await wait('overview camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`);
  await checkField('trinary phone overview'); await shot('trinary-phone-overview');
  const first=await checkField('normal orbit first sample');await delay(350);await frames();const second=await checkField('normal orbit second sample');
  const phase=p=>Math.atan2(p[1],p[0]),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  report.motion={elapsed:(second.at-first.at)/1000,advance:wrap(phase(second.fields[0].position)-phase(first.fields[0].position)),phaseError:wrap(phase(second.fields[0].position)-(second.at*.00016+2.1))};
  assert(report.motion.advance>.025&&Math.abs(report.motion.advance-report.motion.elapsed*.16)<.02&&Math.abs(report.motion.phaseError)<.02,'Actual third companion violates time*.16+2.1');persist();
  report.gradient=await evaluate(`(()=>{const f=${fields}[0],records=window.__cfTrinaryGradients.get(f.texture.source.resource),others=${S}.world.children.filter(c=>c!==f&&c.texture?.source?.resource).map(c=>({width:c.width,records:window.__cfTrinaryGradients.get(c.texture.source.resource)??[]}));return{method:'pre-boot native Canvas methods forwarded unchanged; WeakMap provenance on the actual Sprite TextureSource canvas; V2 grade remains applied in place',records,others}})()`);
  const glow=records=>(records??[]).filter(r=>JSON.stringify(r.coords)===JSON.stringify([128,128,0,128,128,128]));
  assert.equal(glow(report.gradient.records).length,1);assert.deepEqual(glow(report.gradient.records)[0].stops,[[0,'#ffffff'],[.25,expected.col2],[1,'transparent']]);
  for(const col of [expected.col2,fixtureEvidence.fixtures.trinary.system.binary.col2])assert(report.gradient.others.some(o=>glow(o.records).some(r=>JSON.stringify(r.stops)===JSON.stringify([[0,'#ffffff'],[.25,col],[.6,col+'66'],[1,'transparent']]))),'Actual primary/binary must preserve ordinary four-stop corona');persist();
  const closeup=async name=>{
    let s=await checkField(name+' before close-up'),f=s.fields[0];const from=await canvasPoint(...f.position),to={x:s.viewport[0]/2,y:s.viewport[1]/2};
    assert(await evaluate(`document.elementFromPoint(${to.x},${to.y})===${S}.app.canvas`));await send('Input.dispatchMouseEvent',{type:'mousePressed',...from,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',...to,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...to,button:'left',buttons:0,clickCount:1});await frames();
    const target=name.includes('desktop')?300:140;
    for(let i=0;i<40;i++){const g=await evaluate(snapshot);if(g.fields[0].bounds.width>=target)break;await send('Input.dispatchMouseEvent',{type:'mouseWheel',...await canvasPoint(...g.fields[0].position),deltaX:0,deltaY:-25});await frames()}
    await wait('close-up camera settled',`Math.abs(${S}.cam.z-${S}.camT.z)<.001`);s=await checkField(name);f=s.fields[0];assert.deepEqual(s.viewport,name.includes('desktop')?[1440,1000,1]:[390,844,2]);assert(f.bounds.width>=target-.2&&f.bounds.x>=0&&f.bounds.y>=0&&f.bounds.x+f.bounds.width<=s.viewport[0]&&f.bounds.y+f.bounds.height<=s.viewport[1]);await shot(name);
    const control=await evaluate(`(()=>{const s=${S},f=${fields}[0],started=s.app.ticker.started,visible=f.visible,parent=f.parent,index=parent.getChildIndex(f),frame=s.app.screen.clone();s.app.ticker.stop();try{const read=()=>s.app.renderer.extract.pixels({target:s.app.stage,frame,resolution:s.app.renderer.resolution}),a=read();f.visible=false;const b=read();f.visible=visible;const c=read();parent.removeChild(f);const d=read();parent.addChildAt(f,index);const e=read();const diff=q=>{if(q.width!==a.width||q.height!==a.height||q.pixels.length!==a.width*a.height*4)throw Error('Pixel dimensions changed');let n=0;for(let i=0;i<a.pixels.length;i++)if(a.pixels[i]!==q.pixels[i])n++;return n};return{method:'explicit identical screen frame; ticker paused; mutate only third visibility or detach it without destruction; restore child index and all pixels',width:a.width,height:a.height,hidden:diff(b),hiddenRestored:diff(c),removed:diff(d),removedRestored:diff(e),sameParent:f.parent===parent,sameIndex:parent.getChildIndex(f)===index}}finally{f.visible=visible;if(f.parent!==parent)parent.addChildAt(f,index);s.app.renderer.render(s.app.stage);if(started)s.app.ticker.start()}})()`);
    assert(control.hidden>0&&control.removed>0&&control.hiddenRestored===0&&control.removedRestored===0&&control.sameParent&&control.sameIndex);report.steps.push({name:name+' third-only pixel controls',control});persist();
  };
  await click('#docksets'); await click('[data-motion="1"]'); await wait('Reduced setting committed', `${S}.api.state().motionMode===1&&${ready}`); await checkField('reduced retains trinary');
  await click('[data-sel="set-effects"]'); await wait('Effects Off committed', `${S}.api.state().fxOn===false&&${ready}`); await checkField('effects off retains trinary');
  await send('Input.dispatchKeyEvent', { type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 });
  await send('Input.dispatchKeyEvent', { type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 }); await frames();
  await closeup('trinary-phone-reduced-effects-off');
  await viewport(1440,1000,1,false); await frames(); await closeup('trinary-desktop-1440x1000-dpr1');
  await evaluate(`(()=>{const f=${fields}[0],r=${S}.api.sceneResourceDiagnostics().registry;window.__cfTrinaryRetired={field:f,texture:f.texture,source:f.texture.source,canvas:f.texture.source.resource,registry:r,scope:r.activeScopes.find(s=>s.label.startsWith('scene:'))};return true})()`);
  await native(await canvasPoint(...(await evaluate(snapshot)).fields[0].position), 'right'); await wait('native exit destroys trinary owner', `${S}.api.state().mode==='galaxy'&&${fields}.length===0&&${ready}`);
  report.retired=await evaluate(`(()=>{const r=window.__cfTrinaryRetired,a=${S}.api.sceneResourceDiagnostics().registry;return{spriteDestroyed:r.field.destroyed,parentNull:r.field.parent===null,textureDestroyed:r.texture.destroyed,sourceDestroyed:r.source.destroyed,sourceResourceNull:r.source.resource===null,priorCanvasSize:[r.canvas.width,r.canvas.height],oldScope:r.scope,oldScopeAbsent:!!r.scope&&!a.activeScopes.some(s=>s.label===r.scope.label),leaseReleases:a.leaseReleases-r.registry.leaseReleases,textureDisposals:a.textureDisposals-r.registry.textureDisposals,registry:a,resources:${S}.api.sceneResourceDiagnostics()}})()`);
  const retired=report.retired,r=retired.registry;
  assert(retired.spriteDestroyed&&retired.parentNull&&retired.oldScopeAbsent);
  assert(retired.leaseReleases>=retired.oldScope.leaseCount&&retired.textureDisposals>=0&&r.balanced&&r.coherent&&r.externalDestroyFaults===0);
  assert.equal(r.leaseAcquisitions-r.leaseReleases,r.activeLeaseCount); assert.equal(r.textureCreations-r.textureDisposals,r.liveTextureCount);
  await evaluate('delete window.__cfTrinaryRetired;true');
  for(const name of ['binary','sol']){await load(name);const s=await evaluate(snapshot);report.steps.push({name:name+' absence control',state:s});assert.equal(s.fields.length,0);assert(!s.caption.includes('a triple system'));if(name==='binary')assert(s.caption.includes('a binary pair — two suns share this sky'))}
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
