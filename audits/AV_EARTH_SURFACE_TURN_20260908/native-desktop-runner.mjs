import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic, not certification. Root runs under the shared lock outside macOS Seatbelt.
// node audits/AV_EARTH_SURFACE_TURN_20260908/native-runner.mjs /absolute/evidence-dist /absolute/fresh-output
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(process.argv.length, 4, 'Expected evidence-dist and fresh-output arguments');
const dist = fs.realpathSync(process.argv[2]), out = path.resolve(process.argv[3]);
assert(!fs.existsSync(out) && !out.startsWith(dist + path.sep), 'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)), path.dirname(out), 'Output parent must exist and be real');
fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(out, 'runner.mjs'), fs.constants.COPYFILE_EXCL);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { schema: 'cf-native-earth-surface-turn/v1', certification: false, status: 'RUNNING',
  startedAt: new Date().toISOString(), dist, sources: {}, served: {}, steps: [], screenshots: [], errors: [],
  limitations: [
    'Fresh isolated origin; native Training Skip, canonical Earth Survey and Land. Not progression or save-migration certification.',
    'Fresh desktop-only Chromium viewport; phone proof is retained separately. Not physical iPhone/Safari/PWA or human art acceptance.',
    'Finite 18-second yaw returning to rest, not a seamless full revolution or a complete painted planet replacement.',
    'Program key, uniform UID and actual renderer cache counts are observed; native WebGLProgram handle identity/deletion is not claimed. One program intentionally remains application-owned.',
    'Preference controls and same-document re-entry are outside this desktop-only run. The preceding phone proof and resize/navigation failure remain separate.',
  ] };
for (const name of [
  'port/v2/apps/game/src/main.ts', 'port/v2/apps/game/src/planet-surface-turn-view.ts',
  'port/v2/apps/game/src/planet-surface-turn.worker.ts', 'port/v2/apps/game/src/planet-surface-turn-math.ts',
  'port/v2/apps/game/src/planet-surface-atlas.ts', 'port/v2/packages/art/src/thumbart.verbatim.js',
  'port/v2/packages/domain/starcatalog/src/index.ts', 'port/v2/packages/domain/planetgen/src/planetgen.verbatim.js',
  'port/v2/packages/domain/surveyphrases/src/surveyphrases.verbatim.js',
  'port/v2/apps/game/src/scene-texture-owner.ts', 'port/v2/apps/game/src/pixi-managed-resource-owner.ts',
  'audits/AV_EARTH_SURFACE_TURN_20260908/native-desktop-runner.mjs',
]) report.sources[name] = hash(fs.readFileSync(path.join(repo, name)));
const persist = () => fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.wav':'audio/wav', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    assert(req.method === 'GET' || req.method === 'HEAD');
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = fs.realpathSync(path.resolve(dist, '.' + (name === '/' ? '/index.html' : name)));
    assert(file.startsWith(dist + path.sep) && fs.statSync(file).isFile());
    const bytes = fs.readFileSync(file), key = path.relative(dist, file), digest = hash(bytes);
    assert(!report.served[key] || report.served[key] === digest, 'Served bytes changed');
    report.served[key] = digest;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const S = 'window.__CF_SLICE__';
const ready = `(()=>{const s=${S}?.api.state(),p=s?.persistence,r=p?.runtime;return p?.ready===true&&p.hold===null&&p.seedBootstrapPending===false&&p.bootRouteRepairPending===false&&p.mutationBlocked===false&&p.documentToken===${S}.documentToken&&r?.visible===true&&r.answerable===true&&r.leaseOwned===true&&r.accruing===true&&r.staleBlocked===false&&s.sceneResources.pendingPersistenceWrites===0})()`;
const turn = `${S}.api.sceneResourceDiagnostics().surfacePlanetTurn`;
const earthAddress = 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,gal:s.gal,galX:s.galX,galY:s.galY,star:s.star,starX:s.starX,starY:s.starY,planet:s.planet,planetOrdinal:s.planetOrdinal,navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,panelOpen:s.panelOpen,motionMode:s.motionMode,fxOn:s.fxOn,persistence:s.persistence,resources:s.sceneResources,worldVisible:${S}.world.visible,at:performance.now(),viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfEarthTurnInputs}:null})()`;
const actualMesh = `(()=>{const key=${turn}?.appProgramKey;const matches=${S}.world.children.filter(c=>c.shader?.glProgram?._key===key&&key!=null);if(matches.length!==1)throw Error('Expected one actual Earth turn Mesh');return matches[0]})()`;
let browser, send, evaluate, deadline = Infinity;
const guard = () => {
  assert(Date.now() < deadline, '90-second native-work deadline exceeded');
  assert.equal(report.errors.length, 0, 'Runtime exception observed');
};
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`; persist();
  browser = await openChromiumCdp({ label:'native Earth finite surface turn', userDataPrefix:'cf-earth-turn-20260908',
    commandTimeoutMs:15000, onEvent:e=>{ if(e.method==='Runtime.exceptionThrown') report.errors.push(e.params.exceptionDetails); } });
  report.browser = browser.browser;
  deadline = Date.now() + 90000;
  const { targetId } = await browser.send('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten:true });
  send = (method, params={}) => browser.send(method, params, sessionId);
  await send('Runtime.enable'); await send('Page.enable');
  evaluate = async expression => {
    report.pendingEvaluation = { expression, sha256:hash(expression), at:new Date().toISOString() }; persist();
    const result = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    report.pendingEvaluation = null; return result.result.value;
  };
  const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const wait = async (name, condition, timeoutMs=15000) => {
    const step = { name, condition, status:'WAITING' }; report.steps.push(step); persist();
    const end = Math.min(deadline, Date.now()+timeoutMs);
    while (true) {
      guard();
      const failed = await evaluate(`${S}?.api?.sceneResourceDiagnostics().surfacePlanetTurn?.status==='failed'`);
      assert(!failed, 'Planet surface turn failed: '+JSON.stringify(await evaluate(`${S}?.api?.sceneResourceDiagnostics().surfacePlanetTurn`)));
      if (await evaluate(condition)) break;
      assert(Date.now()<end, 'Timed out: '+name); await delay(100);
    }
    step.status='PASS'; persist();
  };
  await send('Page.addScriptToEvaluateOnNewDocument', { source:`window.__cfEarthTurnInputs=[];for(const type of ['click','contextmenu','keydown'])document.addEventListener(type,e=>{if(window.__cfEarthTurnInputs.length<120)window.__cfEarthTurnInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,sel:e.target.closest?.('[data-sel]')?.dataset.sel,key:e.key,x:e.clientX,y:e.clientY,at:performance.now()})},true)` });
  const native = async (point, button='left') => {
    guard(); const count=await evaluate('window.__cfEarthTurnInputs.length');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point,button:'none'});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button,buttons:button==='right'?2:1,clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button,buttons:0,clickCount:1});
    await frames();
    assert(await evaluate(`window.__cfEarthTurnInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`),'Native input receipt missing');
    report.steps.push({name:'native input',point,button}); persist();
  };
  const click = async selector => {
    const point=await evaluate(`(async()=>{const a=document.querySelectorAll(${JSON.stringify(selector)});if(a.length!==1)throw Error('Nonunique control '+${JSON.stringify(selector)});const e=a[0];e.scrollIntoView({block:'center'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||b.width<=0||b.height<=0||!(h===e||e.contains(h)))throw Error('Control occluded '+${JSON.stringify(selector)});return{x,y}})()`);
    await native(point);
  };
  const escape = async () => {
    const count=await evaluate('window.__cfEarthTurnInputs.length');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await frames();
    assert(await evaluate(`window.__cfEarthTurnInputs.slice(${count}).some(e=>e.trusted&&e.type==='keydown'&&e.key==='Escape')`));
  };
  const shot = async name => {
    guard(); const {data}=await send('Page.captureScreenshot',{format:'png'}), bytes=Buffer.from(data,'base64');
    fs.writeFileSync(path.join(out,name+'.png'),bytes,{flag:'wx'});
    report.screenshots.push({path:name+'.png',sha256:hash(bytes)}); persist();
  };
  const viewport = async (width,height,dpr,touch) => {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:touch});
    await send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  };
  const checkRegistry = r => {
    assert(r.balanced&&r.coherent&&r.externalDestroyFaults===0,'Incoherent texture registry');
    assert.equal(r.leaseAcquisitions-r.leaseReleases,r.activeLeaseCount);
    assert.equal(r.textureCreations-r.textureDisposals,r.liveTextureCount);
  };
  const checkTurn = async name => {
    guard(); const s=await evaluate(snapshot),v=s.resources.surfacePlanetTurn;
    report.steps.push({name,state:s}); persist();
    assert.equal(s.mode,'surface'); assert.deepEqual([s.gal,s.star,s.planet,s.planetOrdinal],[999,424242,133,2]);
    assert.deepEqual([s.galX,s.galY,s.starX,s.starY],[90,-60,560,170]);
    assert.equal(s.renderedScene.mode,'surface'); assert.equal(s.renderedScene.worldKey,s.navWorldKey);
    assert(v&&v.status==='ready'&&v.error===null&&v.shown&&v.meshLive&&v.textureLive&&!v.workerActive&&v.workerStarts===1&&!v.canonicalVisible&&s.worldVisible);
    assert.equal(v.canvasPixels,768*384); assert(Number.isInteger(v.appProgramKey)&&Number.isInteger(v.appUniformUid));
    const expected=v.elapsedSeconds>=18?0:.22*Math.sin(Math.PI*v.elapsedSeconds/18)**2;
    assert(Math.abs(v.angle-expected)<1e-10,'Actual uniform owner violates finite motion law');
    assert(s.resources.surfacePlanetTurnProgramCache.turnProgramPresent);
    checkRegistry(s.resources.registry); return s;
  };
  const meshPixels = async () => evaluate(`(()=>{const s=${S},m=${actualMesh},started=s.app.ticker.started,wasGroup=m.isRenderGroup;s.app.ticker.stop();try{const r=s.app.renderer.extract.pixels({target:m,resolution:1});let h=2166136261,opaque=0;for(let i=0;i<r.pixels.length;i++){h=Math.imul(h^r.pixels[i],16777619);if((i&3)===3&&r.pixels[i]>0)opaque++}if(!opaque)throw Error('Actual mesh extract is empty');return{width:r.width,height:r.height,hash:(h>>>0).toString(16),nontransparentPixels:opaque,uniform:m.shader.resources.turnUniforms.uniforms.uAngle}}finally{if(!wasGroup)m.disableRenderGroup();if(m.isRenderGroup!==wasGroup)throw Error('Mesh extraction failed to restore group topology');s.app.renderer.render(s.app.stage);if(started)s.app.ticker.start()}})()`);
  const enterEarth = async name => {
    await wait(name+' canonical Sol system',`${S}.api.state().mode==='system'&&${S}.api.state().gal===999&&${S}.api.state().star===424242&&${ready}`);
    await wait(name+' system camera settled',`Math.abs(${S}.cam.z-${S}.camT.z)<.001`);
    await wait(name+' distinct rendered planet positions',`(()=>{const p=${S}.api.planetScreenTarget({seed:133,ordinal:2}),m=${S}.api.planetScreenTarget({seed:134,ordinal:3});return p&&m&&p.width>0&&Math.hypot(p.screenX-m.screenX,p.screenY-m.screenY)>8})()`);
    const point=await evaluate(`(()=>{const p=${S}.api.planetScreenTarget({seed:133,ordinal:2});if(!p||document.elementFromPoint(p.screenX,p.screenY)!==${S}.app.canvas)throw Error('Exact Earth target unavailable or occluded');return{x:p.screenX,y:p.screenY}})()`);
    await native(point);
    await wait(name+' exact Earth Survey',`document.querySelector('[data-act=landcta]')?.getAttribute('data-landing-world')===${JSON.stringify(earthAddress)}&&${ready}`);
    await click('[data-act=landcta]');
    await wait(name+' current turn visible',`${S}.api.state().mode==='surface'&&${turn}?.status==='ready'&&${turn}.shown&&${ready}`);
    await click('[data-survey-close]'); await frames();
    const s=await checkTurn(name+' initial attachment');
    assert(s.resources.surfacePlanetTurn.elapsedSeconds<4,'Initial turn capture missed');
    assert(!await evaluate("document.querySelector('[data-cf-audiovisual-pilot]')!==null"),'avpilot must be absent');
    assert(await evaluate("window.__cfEarthTurnInputs.some(e=>e.trusted&&e.act==='landcta')"));
    return s;
  };
  const checkUniformOwners = async name => {
    const owners=await evaluate(`(()=>{const s=${S},v=${turn},r=s.app.renderer,g=r.globalUniforms,p=r.shader._programDataHash[v.appProgramKey];return{key:v.appProgramKey,turn:v.appUniformUid,mesh:r.renderPipes.mesh.localUniforms.uid,global:[...g._activeUniforms,...g._uniformsPool].map(u=>u.uid),cached:Object.keys(p.uniformDirtyGroups).map(Number)}})()`);
    const allowed=new Set([owners.turn,owners.mesh,...owners.global]);
    const valid=keys=>keys.length===new Set(keys).size&&keys.includes(owners.turn)&&keys.every(k=>allowed.has(k));
    assert(valid(owners.cached),'Native program retains a uniform with no live owner');
    assert(!valid([...owners.cached,Number.MAX_SAFE_INTEGER]),'Orphan uniform negative control escaped');
    report.steps.push({name:name+' exact uniform ownership',owners,orphanControlRejected:true});persist();
  };
  const captureCycle = async name => {
    const initial=await checkTurn(name+' initial'),initialPixels=await meshPixels(); await shot(name+'-initial');
    await wait(name+' midpoint',`${turn}.elapsedSeconds>=8.6`,11000);
    const mid=await checkTurn(name+' midpoint'); assert(mid.resources.surfacePlanetTurn.elapsedSeconds<10.6);
    const midPixels=await meshPixels(); await shot(name+'-midpoint');
    assert.notEqual(initialPixels.hash,midPixels.hash,'Actual mesh pixels did not move');
    await wait(name+' finite settlement',`${turn}.elapsedSeconds===18&&${turn}.angle===0`,11000);
    const settled=await checkTurn(name+' settled'),settledPixels=await meshPixels(); await shot(name+'-settled');
    await delay(250); await frames(); const laterPixels=await meshPixels();
    assert.equal(laterPixels.hash,settledPixels.hash,'Settled mesh keeps moving');
    const cache=settled.resources.surfacePlanetTurnProgramCache;
    assert.equal(cache.programCount,initial.resources.surfacePlanetTurnProgramCache.programCount);
    await checkUniformOwners(name);
    const control=await evaluate(`(()=>{const s=${S},m=${actualMesh},started=s.app.ticker.started,visible=m.visible,frame=s.app.screen.clone();s.app.ticker.stop();try{const read=()=>s.app.renderer.extract.pixels({target:s.app.stage,frame,resolution:s.app.renderer.resolution}),a=read();m.visible=false;const b=read();m.visible=visible;const c=read();const diff=q=>{if(q.pixels.length!==a.pixels.length)throw Error('Pixel dimensions changed');let n=0;for(let i=0;i<a.pixels.length;i++)if(a.pixels[i]!==q.pixels[i])n++;return n};return{method:'actual scene frame, ticker paused, only Earth turn Mesh hidden and restored',width:a.width,height:a.height,hiddenDifference:diff(b),restoredDifference:diff(c)}}finally{m.visible=visible;s.app.renderer.render(s.app.stage);if(started)s.app.ticker.start()}})()`);
    assert(control.hiddenDifference>0&&control.restoredDifference===0,'Visible-paint hide/restore control failed');
    report.steps.push({name:name+' actual motion and painted-output controls',initialPixels,midPixels,settledPixels,laterPixels,control});persist();
    return settled;
  };
  const exitEarth = async name => {
    await evaluate(`(()=>{const m=${actualMesh},r=${S}.api.sceneResourceDiagnostics();window.__cfEarthTurnRetired={mesh:m,geometry:m.geometry,buffers:[...m.geometry.buffers],shader:m.shader,texture:m.texture,source:m.texture.source,canvas:m.texture.source.resource,scope:r.registry.activeScopes.find(x=>x.label.startsWith('scene:')),registry:r.registry,view:r.surfacePlanetTurn,cache:r.surfacePlanetTurnProgramCache};return true})()`);
    const point=await evaluate(`(()=>{const p=${S}.world.toGlobal({x:0,y:0});if(document.elementFromPoint(p.x,p.y)!==${S}.app.canvas)throw Error('Native exit canvas occluded');return{x:p.x,y:p.y}})()`);
    await native(point,'right');
    await wait(name+' native exit',`${S}.api.state().mode==='system'&&${S}.api.sceneResourceDiagnostics().surfacePlanetTurn===null&&!${S}.api.sceneResourceDiagnostics().surfacePlanetTurnPending&&${ready}`);
    const retired=await evaluate(`(()=>{const p=window.__cfEarthTurnRetired,r=${S}.api.sceneResourceDiagnostics();return{meshDestroyed:p.mesh.destroyed,parentNull:p.mesh.parent===null,buffersDestroyed:p.buffers.map(b=>b.destroyed),shaderDestroyed:p.shader.glProgram===null,textureDestroyed:p.texture.destroyed,sourceDestroyed:p.source.destroyed,canvasSize:[p.canvas.width,p.canvas.height],oldScopeAbsent:!!p.scope&&!r.registry.activeScopes.some(x=>x.label===p.scope.label),oldView:p.view,oldCache:p.cache,resources:r}})()`);
    report.steps.push({name:name+' actual resource retirement',retired});persist();
    const last=retired.resources.surfacePlanetTurnLast;
    assert(retired.meshDestroyed&&retired.parentNull&&retired.buffersDestroyed.length===3&&retired.buffersDestroyed.every(Boolean)&&retired.shaderDestroyed&&retired.textureDestroyed&&retired.sourceDestroyed&&retired.oldScopeAbsent);
    assert.deepEqual(retired.canvasSize,[1,1]);
    assert(last?.status==='disposed'&&last.error===null&&!last.workerActive&&!last.meshLive&&!last.textureLive&&!last.shown&&last.canvasPixels===0&&last.workerStarts===1);
    assert.equal(last.appProgramKey,retired.oldView.appProgramKey);assert.equal(last.appUniformUid,retired.oldView.appUniformUid);
    assert(retired.resources.surfacePlanetTurnProgramCache.turnProgramPresent,'Application-owned program unexpectedly vanished');
    assert.equal(retired.resources.surfacePlanetTurnProgramCache.turnUniformGroupCount,retired.oldCache.turnUniformGroupCount);
    checkRegistry(retired.resources.registry);
    await evaluate('delete window.__cfEarthTurnRetired;true');return retired;
  };
  await viewport(1440,1000,1,false);
  await send('Page.navigate',{url:report.origin+'/?planetturn=1'});
  await wait('first answerable document',`${S}?.api&&${ready}`);
  if(await evaluate(`${S}.api.state().tutActive`)) { await click('[data-sel=tutskip]');await wait('native Training Skip',`!${S}.api.state().tutActive&&${ready}`); }
  const desktopEntry=await enterEarth('fresh desktop');assert.deepEqual(desktopEntry.viewport,[1440,1000,1]);
  await captureCycle('earth-desktop');
  await exitEarth('fresh desktop');
  guard();report.status='PASS';
} catch(error) {
  report.status='FAIL';report.failure=String(error.stack??error);process.exitCode=1;
  const failedEvaluation=report.pendingEvaluation;
  try { report.failureState=await evaluate?.(snapshot); } catch(e) { report.failureStateError=String(e); }
  report.failedEvaluation=failedEvaluation;
  try { const shot=await send?.('Page.captureScreenshot',{format:'png'});if(shot)fs.writeFileSync(path.join(out,'failure.png'),Buffer.from(shot.data,'base64'),{flag:'wx'}); } catch(e) { report.failureScreenshotError=String(e); }
} finally {
  const cleanup=[];
  try { await browser?.close(); } catch(e) { cleanup.push(String(e)); }
  if(server.listening) { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
  try {
    for(const [file,digest] of Object.entries(report.sources))assert.equal(hash(fs.readFileSync(path.join(repo,file))),digest,'Source changed: '+file);
    for(const [file,digest] of Object.entries(report.served))assert.equal(hash(fs.readFileSync(path.join(dist,file))),digest,'Dist changed: '+file);
  } catch(e) { cleanup.push(String(e)); }
  if(cleanup.length){report.cleanupFailures=cleanup;report.status='FAIL';process.exitCode=1;}
  report.endedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,output:out,failure:report.failure}));
