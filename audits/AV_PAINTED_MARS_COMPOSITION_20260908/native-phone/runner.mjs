import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic; root owns native runs under the shared lock outside macOS Seatbelt.
// node audits/AV_PAINTED_MARS_COMPOSITION_20260908/native-composition-runner.mjs DIST FRESH_OUTPUT phone|desktop|blocked|default
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(process.argv.length, 5, 'Expected evidence-dist, fresh-output and phone|desktop|blocked|default');
const mode = process.argv[4]; assert(['phone', 'desktop', 'blocked', 'default'].includes(mode));
const blocked = mode === 'blocked';
const painted = mode === 'phone' || mode === 'desktop';
const expectedRequests = mode === 'default' ? 0 : 1;
const dimensions = mode === 'desktop' ? [1440, 1000, 1, false] : [390, 844, 2, true];
const dist = fs.realpathSync(process.argv[2]), out = path.resolve(process.argv[3]);
assert(!fs.existsSync(out) && !out.startsWith(dist + path.sep), 'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)), path.dirname(out), 'Output parent must exist and be real');
fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(out, 'runner.mjs'), fs.constants.COPYFILE_EXCL);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { schema: 'cf-native-painted-mars-composition/v1', certification: false, status: 'RUNNING',
  startedAt: new Date().toISOString(), dist, mode, viewport: dimensions.slice(0, 3), sources: {}, served: {},
  steps: [], screenshots: [], errors: [], network: [], intercepted: [], interceptionErrors: [],
  limitations: [
    'Fresh fixed Chromium origin and viewport; no resize/re-entry, physical iPhone/Safari, PWA, broad heap, art acceptance or certification claim.',
    'Native Training Skip, exact canonical Mars Survey and Land; no navigation or persistence fixture writes.',
    'Service-worker bypass keeps the page asset request observable. The blocked control targets only the exact built Mars WebP URL.',
    'Actual canvas-backed sprite paint and scene-resource retirement are observed. One bounded CPU canvas intentionally remains cached after exit.',
    'Pixel comparison pauses the app ticker and extracts the same explicit full-stage frame; it does not compare different GPUs or prove native driver allocation release.',
  ] };
const sourceNames = [
  'port/v2/apps/game/src/main.ts', 'port/v2/apps/game/src/painted-mars-binding.ts',
  'port/v2/apps/game/src/painted-vista-load.ts', 'port/v2/apps/game/src/biome-vista-surface.ts',
  'port/v2/apps/game/src/biome-vista-protocol.ts', 'port/v2/apps/game/src/biome-vista-cache.ts',
  'port/v2/apps/game/src/biome-vista.worker.ts', 'port/v2/apps/game/src/world-roster.ts',
  'port/v2/apps/game/src/scene-texture-owner.ts', 'port/v2/apps/game/src/pixi-managed-resource-owner.ts',
  'port/v2/apps/game/src/assets/painted/mars-dunesea-v1.webp',
  'audits/AV_PAINTED_MARS_20260908/canonical-mars.json',
  'audits/AV_PAINTED_MARS_20260908/native-painted-mars-runner.mjs',
  'audits/AV_PAINTED_MARS_COMPOSITION_20260908/native-composition-runner.mjs',
];
for (const name of sourceNames) report.sources[name] = hash(fs.readFileSync(path.join(repo, name)));
const persist = () => fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    assert(req.method === 'GET' || req.method === 'HEAD');
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = fs.realpathSync(path.resolve(dist, '.' + (name === '/' ? '/index.html' : name)));
    assert(file.startsWith(dist + path.sep) && fs.statSync(file).isFile());
    const bytes = fs.readFileSync(file), key = path.relative(dist, file), digest = hash(bytes);
    assert(!report.served[key] || report.served[key] === digest, 'Served bytes changed');
    report.served[key] = digest;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const S = 'window.__CF_SLICE__';
const address = 'CF1|g:999@90,-60|s:424242@560,170|p:134#3';
const variant = 'painted-mars-dunesea-v1';
const resources = `${S}.api.sceneResourceDiagnostics()`;
const ready = `(()=>{const s=${S}?.api.state(),p=s?.persistence,r=p?.runtime;return p?.ready===true&&p.hold===null&&p.seedBootstrapPending===false&&p.bootRouteRepairPending===false&&p.mutationBlocked===false&&p.documentToken===${S}.documentToken&&r?.visible===true&&r.answerable===true&&r.leaseOwned===true&&r.accruing===true&&r.staleBlocked===false&&s.sceneResources.pendingPersistenceWrites===0})()`;
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,gal:s.gal,galX:s.galX,galY:s.galY,star:s.star,starX:s.starX,starY:s.starY,planet:s.planet,planetOrdinal:s.planetOrdinal,navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,panelOpen:s.panelOpen,motionMode:s.motionMode,fxOn:s.fxOn,persistence:s.persistence,resources:${resources},worldVisible:${S}.world.visible,at:performance.now(),viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfPaintedMarsInputs}:null})()`;
const actualVista = `(()=>{const matches=${S}.app.stage.children.filter(c=>c.texture?.source?.resource instanceof HTMLCanvasElement&&c.texture.source.resource.width===960&&c.texture.source.resource.height===430);if(matches.length!==1)throw Error('Expected one actual 960x430 vista sprite');return matches[0]})()`;
const actualGlobe = `(()=>{const matches=${S}.world.children.filter(c=>c.texture?.source?.resource instanceof HTMLCanvasElement&&Math.abs(c.width-420)<.001&&Math.abs(c.height-420)<.001);if(matches.length!==1)throw Error('Expected one actual decorative surface globe');return matches[0]})()`;
const compositionState = `(()=>{
  const s=${S},m=${actualVista},globe=${actualGlobe},b=m.getBounds();
  const paintedElement=e=>{if(!e||e.getClientRects().length===0)return false;for(let p=e;p instanceof Element;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)===0)return false}return true};
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
  const controls=[...document.querySelectorAll('button,input,select,textarea,[role="button"]')].filter(paintedElement).map((e,i)=>{
    const r=rect(e),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{key:e.id||e.tagName+':'+i,...r,disabled:!!e.disabled,inert:!!e.closest('[inert]'),hit:h===e||e.contains(h)}});
  const topElements=[...new Set([...document.querySelectorAll('#topbar button,#topbar input,#playerchip,#hpbar,#objchip,#searchbox'),
    ...document.querySelectorAll('button,input,select,textarea,[role="button"]')])].filter(paintedElement)
    .map(e=>({key:e.id||e.tagName,...rect(e)})).filter(r=>r.y+r.height/2<innerHeight/2);
  const dock=document.getElementById('dock');if(!paintedElement(dock))throw Error('Visible dock unavailable');
  return{globeVisible:globe.visible,globeRenderable:globe.renderable,worldVisible:s.world.visible,vistaVisible:m.visible,
    diagnostic:s.api.sceneResourceDiagnostics().surfacePaintedComposition,viewport:[innerWidth,innerHeight,devicePixelRatio],
    bounds:{x:b.x,y:b.y,width:b.width,height:b.height},sourceSize:[m.texture.source.resource.width,m.texture.source.resource.height],
    spriteFrame:{x:m.texture.frame.x,y:m.texture.frame.y,width:m.texture.frame.width,height:m.texture.frame.height},
    controls,topElements,topBottom:Math.max(0,...topElements.map(r=>r.bottom)),dock:rect(dock)};
})()`;
// This acceptor reads actual sprites/rectangles. A diagnostic flag alone cannot pass it.
const acceptComposition = value => {
  const [width,height]=dimensions;
  assert.deepEqual(value.viewport,dimensions.slice(0,3));
  assert(value.worldVisible&&value.vistaVisible&&value.globeRenderable,'Scene render ownership changed');
  assert.equal(value.globeVisible,!painted,'Actual globe has the wrong visibility');
  assert.equal(value.diagnostic,painted);
  assert.deepEqual(value.sourceSize,[960,430]);
  assert.deepEqual(value.spriteFrame,{x:0,y:0,width:960,height:430});
  const gutter=Math.min(24,Math.max(8,width*.03));
  const scale=Math.min((width-gutter*2)/960,(height-gutter*2)/430);
  const expectedHeight=430*scale,expectedWidth=960*scale;
  const expectedY=painted||height/width<1.25?height/2:Math.max(gutter+expectedHeight/2,
    height/2-Math.min(420,Math.min(width,height)*.78)/2-gutter-expectedHeight/2);
  const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<.02,label);
  near(value.bounds.width,expectedWidth,'Vista width changed');near(value.bounds.height,expectedHeight,'Vista height changed');
  near(value.bounds.x+value.bounds.width/2,width/2,'Vista x is not centered');
  near(value.bounds.y+value.bounds.height/2,expectedY,'Vista y violates selected composition');
  if(painted&&mode==='phone'){
    assert(value.topElements.length>0,'Top-control observer is empty');
    assert(value.bounds.y>value.topBottom,'Panorama intersects upper controls');
    assert(value.bounds.y+value.bounds.height<value.dock.y,'Panorama intersects dock');
  }
};
let browser, send, evaluate, pageSession, assetUrl, deadline = Infinity;
const assetRequests = new Set(), interceptionJobs = new Set();
const guard = () => {
  assert(Date.now() < deadline, '90-second native-work deadline exceeded');
  assert.equal(report.errors.length, 0, 'Runtime exception observed');
  assert.equal(report.interceptionErrors.length, 0, 'Asset interception failed');
};
try {
  const assets = fs.readdirSync(path.join(dist, 'assets')).filter(name => /^mars-dunesea[^/]*\.webp$/u.test(name));
  assert.equal(assets.length, 1, 'Expected one built Mars WebP');
  const assetPath = path.join('assets', assets[0]);
  const assetDigest = hash(fs.readFileSync(path.join(dist, assetPath)));
  assert.equal(assetDigest, report.sources['port/v2/apps/game/src/assets/painted/mars-dunesea-v1.webp'], 'Built Mars bytes differ from owned asset');
  report.asset = { path: assetPath, sha256: assetDigest };
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`;
  assetUrl = report.origin + '/' + assetPath.split(path.sep).join('/'); report.asset.url = assetUrl; persist();
  browser = await openChromiumCdp({ label: 'native Mars composition ' + mode,
    userDataPrefix: 'cf-mars-composition-' + mode + '-20260908', commandTimeoutMs: 15000,
    onEvent: event => {
      if (event.method === 'Runtime.exceptionThrown') report.errors.push(event.params.exceptionDetails);
      if (event.sessionId !== pageSession) return;
      const p = event.params;
      if (event.method === 'Network.requestWillBeSent' && p.request.url === assetUrl) {
        assetRequests.add(p.requestId); report.network.push({ method: event.method, requestId: p.requestId, url: p.request.url, initiator: p.initiator?.type });
      }
      if (['Network.responseReceived', 'Network.loadingFailed', 'Network.loadingFinished'].includes(event.method) && assetRequests.has(p.requestId)) {
        report.network.push({ method: event.method, requestId: p.requestId, status: p.response?.status,
          errorText: p.errorText, blockedReason: p.blockedReason, encodedDataLength: p.encodedDataLength });
      }
      if (event.method === 'Fetch.requestPaused') {
        const job = (async () => {
          assert(blocked && p.request.url === assetUrl, 'Unexpected intercepted request');
          report.intercepted.push({ requestId: p.requestId, networkId: p.networkId, url: p.request.url, errorReason: 'Failed' });
          assert.equal(report.intercepted.length, 1, 'Mars asset was retried');
          await send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' });
        })().catch(error => { report.interceptionErrors.push(String(error)); });
        interceptionJobs.add(job); void job.finally(() => interceptionJobs.delete(job));
      }
    },
  });
  report.browser = browser.browser; deadline = Date.now() + 90000;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const attached = await browser.send('Target.attachToTarget', { targetId, flatten: true }); pageSession = attached.sessionId;
  send = (method, params = {}) => browser.send(method, params, pageSession);
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setBypassServiceWorker', { bypass: true });
  if (blocked) await send('Fetch.enable', { patterns: [{ urlPattern: assetUrl, requestStage: 'Request' }] });
  evaluate = async expression => {
    report.pendingEvaluation = { expression, sha256: hash(expression), at: new Date().toISOString() }; persist();
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    report.pendingEvaluation = null; return result.result.value;
  };
  const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const wait = async (name, condition, timeoutMs = 15000) => {
    const step = { name, condition, status: 'WAITING' }; report.steps.push(step); persist();
    const end = Math.min(deadline, Date.now() + timeoutMs);
    while (true) {
      guard();
      const vista = await evaluate(`${S}?.api?.sceneResourceDiagnostics()`);
      if (vista) assert(vista.surfaceVistaFaults <= (blocked ? 1 : 0),
        'Unexpected vista fault: ' + JSON.stringify({ count: vista.surfaceVistaFaults, error: vista.surfaceVistaLastError }));
      if (await evaluate(condition)) break;
      assert(Date.now() < end, 'Timed out: ' + name); await delay(100);
    }
    step.status = 'PASS'; persist();
  };
  await send('Page.addScriptToEvaluateOnNewDocument', { source:`window.__cfPaintedMarsInputs=[];for(const type of ['click','contextmenu','keydown'])document.addEventListener(type,e=>{if(window.__cfPaintedMarsInputs.length<120)window.__cfPaintedMarsInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,sel:e.target.closest?.('[data-sel]')?.dataset.sel,key:e.key,x:e.clientX,y:e.clientY,at:performance.now()})},true)` });
  const native = async (point, button='left') => {
    guard(); const count=await evaluate('window.__cfPaintedMarsInputs.length');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point,button:'none'});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button,buttons:button==='right'?2:1,clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button,buttons:0,clickCount:1});
    await frames();
    assert(await evaluate(`window.__cfPaintedMarsInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`),'Native input receipt missing');
    report.steps.push({name:'native input',point,button}); persist();
  };
  const click = async selector => {
    const point=await evaluate(`(async()=>{const a=document.querySelectorAll(${JSON.stringify(selector)});if(a.length!==1)throw Error('Nonunique control '+${JSON.stringify(selector)});const e=a[0];e.scrollIntoView({block:'center'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||b.width<=0||b.height<=0||!(h===e||e.contains(h)))throw Error('Control occluded '+${JSON.stringify(selector)});return{x,y}})()`);
    await native(point);
  };
  const escape = async () => {
    const count=await evaluate('window.__cfPaintedMarsInputs.length');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await frames();
    assert(await evaluate(`window.__cfPaintedMarsInputs.slice(${count}).some(e=>e.trusted&&e.type==='keydown'&&e.key==='Escape')`));
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

  const checkVista = async (name, initial = false) => {
    const state = await evaluate(snapshot), r = state.resources;
    report.steps.push({ name, state }); persist();
    assert.equal(state.mode, 'surface'); assert.equal(state.navWorldKey, address);
    assert.deepEqual([state.gal, state.star, state.planet, state.planetOrdinal], [999, 424242, 134, 3]);
    assert.deepEqual([state.galX, state.galY, state.starX, state.starY], [90, -60, 560, 170]);
    assert.equal(state.renderedScene.worldKey, address); assert.equal(state.renderedScene.mode, 'surface');
    assert.deepEqual(state.viewport, dimensions.slice(0, 3)); assert(state.worldVisible);
    assert(r.surfaceVistaMounted && !r.surfaceVistaWorkerActive);
    assert.equal(r.surfaceVistaArtVariant, painted ? variant : 'canonical-v1');
    assert.equal(r.surfaceVistaLastBiome, 'dunesea');
    assert.equal(r.surfaceVistaEnvironmentFingerprint, 'cwe1:145:0d97c0f8');
    assert.equal(r.surfaceVistaCacheEntries, 1); assert.equal(r.surfaceVistaCachePixels, 960 * 430);
    assert.equal(r.surfaceVistaWorkerStarts, painted ? 0 : 1); assert.equal(r.surfaceVistaFaults, blocked ? 1 : 0);
    assert.equal(r.surfaceVistaStaleDrops, 0);
    if (initial && mode !== 'default') {
      assert.equal(r.surfacePaintedVista?.status, blocked ? 'failed' : 'ready');
      assert.equal(r.surfacePaintedVista.fetchStarts, 1);
      assert.equal(r.surfacePaintedVista.decodePending, false);
      assert.equal(r.surfacePaintedVista.canvasPixels, 0); assert(r.surfacePaintedVista.aborted);
      if (blocked) assert(r.surfacePaintedVista.error); else assert.equal(r.surfacePaintedVista.error, null);
    }
    if (mode === 'default') { assert.equal(r.surfacePaintedVista, null); assert.equal(r.surfacePaintedVistaLast, null); }
    assert.equal(r.surfacePaintedComposition, painted);
    if (!blocked) assert.equal(r.surfaceVistaLastError, null);
    assert.equal(r.surfacePlanetTurn, null); assert.equal(r.surfacePlanetTurnPending, false);
    checkRegistry(r.registry);
    const composition=await evaluate(compositionState); acceptComposition(composition);
    report.steps.push({name:name+' actual composition',composition});persist();
    return state;
  };
  const capturePaint = async name => {
    let firstFailure = null;
    try {
      const control = await evaluate(`(()=>{
        const s=${S},r=s.app.renderer,m=${actualVista},globe=${actualGlobe},canvas=m.texture.source.resource;
        const q={sprite:m,globe,globeVisible:globe.visible,texture:m.texture,source:m.texture.source,canvas,parent:m.parent,index:m.parent.getChildIndex(m),
          visible:m.visible,started:s.app.ticker.started,frame:s.app.screen.clone(),resolution:r.resolution,wasGroup:s.app.stage.isRenderGroup};
        window.__cfPaintedMarsProbe=q;s.app.ticker.stop();
        q.restore=()=>{const errors=[],attempt=f=>{try{f()}catch(e){errors.push(String(e))}};
          attempt(()=>{m.visible=q.visible;globe.visible=q.globeVisible});attempt(()=>{r.render(s.app.stage)});
          attempt(()=>{if(q.started)s.app.ticker.start();else s.app.ticker.stop()});
          return{errors,visible:m.visible,globeVisible:globe.visible,originalGlobe:q.globeVisible,tickerStarted:s.app.ticker.started,originalTicker:q.started}};
        if(!q.visible||m.eventMode!=='none'||q.index>=s.app.stage.getChildIndex(s.world))throw Error('Vista layer/interaction contract failed');
        const bounds=m.getBounds();
        const shape=()=>JSON.stringify({position:[m.x,m.y],scale:[m.scale.x,m.scale.y],rotation:m.rotation,alpha:m.alpha,
          world:[m.worldTransform.a,m.worldTransform.b,m.worldTransform.c,m.worldTransform.d,m.worldTransform.tx,m.worldTransform.ty]});
        const pools=()=>({programs:Object.keys(r.shader?._programDataHash??{}).sort(),
          global:r.globalUniforms?[...new Set([...r.globalUniforms._activeUniforms,...r.globalUniforms._uniformsPool].map(u=>u.uid))].sort((a,b)=>a-b):[]});
        const sample=visible=>{m.visible=visible;r.render(s.app.stage);
          const pixels=r.extract.pixels({target:s.app.stage,frame:q.frame,resolution:q.resolution});r.render(s.app.stage);return pixels};
        sample(true);sample(false);sample(true);
        if(${painted}){globe.visible=true;sample(true);globe.visible=q.globeVisible;sample(true)}
        q.shape=shape();q.pools=JSON.stringify(pools());q.registry=JSON.stringify(s.api.sceneResourceDiagnostics().registry);
        const diff=(a,b)=>{if(a.width!==b.width||a.height!==b.height||a.pixels.length!==b.pixels.length||a.pixels.length!==a.width*a.height*4)throw Error('Pixel frame changed');
          let changedPixels=0,nontransparent=0;let ah=2166136261,bh=2166136261;
          for(let i=0;i<a.pixels.length;i+=4){let changed=false;if(a.pixels[i+3])nontransparent++;
            for(let c=0;c<4;c++){ah=Math.imul(ah^a.pixels[i+c],16777619);bh=Math.imul(bh^b.pixels[i+c],16777619);if(a.pixels[i+c]!==b.pixels[i+c])changed=true}if(changed)changedPixels++}
          return{width:a.width,height:a.height,changedPixels,nontransparent,baselineHash:(ah>>>0).toString(16),sampleHash:(bh>>>0).toString(16)}};
        const inspect=()=>${compositionState};
        const composition=inspect();
        const visible=sample(true),repeat=sample(true),hidden=sample(false),restored=sample(true);
        let globeControl=null;
        if(${painted}){
          globe.visible=true;const forced=sample(true),forcedComposition=inspect();
          globe.visible=q.globeVisible;const reset=sample(true),restoredComposition=inspect();
          globeControl={forcedOn:diff(visible,forced),restored:diff(visible,reset),forcedComposition,restoredComposition,
            controlsUnchanged:JSON.stringify(composition.controls)===JSON.stringify(forcedComposition.controls)
              &&JSON.stringify(composition.controls)===JSON.stringify(restoredComposition.controls)};
        }

        const actual=canvas.getContext('2d').getImageData(0,0,960,430).data;
        let nontransparent=0;for(let i=3;i<actual.length;i+=4)if(actual[i])nontransparent++;
        q.identities={texture:m.texture===q.texture,source:m.texture.source===q.source,canvas:m.texture.source.resource===q.canvas,
          parent:m.parent===q.parent,index:m.parent.getChildIndex(m)===q.index,visible:m.visible===q.visible,shape:shape()===q.shape,
          pools:JSON.stringify(pools())===q.pools,registry:JSON.stringify(s.api.sceneResourceDiagnostics().registry)===q.registry,
          frame:s.app.screen.width===q.frame.width&&s.app.screen.height===q.frame.height&&r.resolution===q.resolution,
          stageRenderGroup:s.app.stage.isRenderGroup===q.wasGroup};
        return{method:'One actual vista visible/hidden/restored; app ticker paused; explicit unchanged full-stage frame; warm owned renderer pools',
          noOp:diff(visible,repeat),hidden:diff(visible,hidden),restored:diff(visible,restored),
          canvas:{width:canvas.width,height:canvas.height,nontransparent},bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},
          identities:q.identities,pools:pools(),composition,globeControl,eventMode:m.eventMode,tickerStopped:!s.app.ticker.started};
      })()`);
      report.steps.push({ name: name + ' actual paint controls', control }); persist();
      acceptComposition(control.composition);
      if(painted){
        assert(control.globeControl,'Missing actual globe control');
        assert.throws(()=>acceptComposition(control.globeControl.forcedComposition),'Forced-on globe escaped composition acceptor');
        acceptComposition(control.globeControl.restoredComposition);
        assert(control.globeControl.forcedOn.changedPixels>0,'Forced-on globe did not visibly change the scene');
        assert.equal(control.globeControl.restored.changedPixels,0,'Globe restoration changed scene pixels');
        assert(control.globeControl.controlsUnchanged,'Globe mutant moved a control or altered its hit target');
        report.steps.push({name:name+' actual forced-on globe rejected',sameAcceptor:true});persist();
      }

      const visibleDelta = sample => assert(sample.changedPixels > 0 && sample.nontransparent > 0, 'Vista has no visible scene paint');
      visibleDelta(control.hidden); assert.throws(() => visibleDelta(control.noOp), 'No-op escaped paint acceptor');
      assert.equal(control.noOp.changedPixels, 0); assert.equal(control.restored.changedPixels, 0);
      assert(control.canvas.nontransparent > 0 && control.tickerStopped);
      assert(Object.values(control.identities).every(value => value === true), 'Paint probe changed an owner, pool or frame');
      report.steps.push({ name: name + ' no-op negative control rejected', sameAcceptor: true }); persist();
      await shot(name);
    } catch (error) { firstFailure = error; report.paintFailure = String(error.stack ?? error); throw error; }
    finally {
      try {
        const restored = await evaluate(`(()=>{const q=window.__cfPaintedMarsProbe;if(!q)return{errors:[]};if(!q.restore)return{errors:['Restoration unavailable']};const result=q.restore();delete window.__cfPaintedMarsProbe;return result})()`);
        report.steps.push({ name: name + ' probe restoration', restored }); persist();
        assert.deepEqual(restored.errors, []);
        if ('visible' in restored) assert(restored.visible && restored.globeVisible===restored.originalGlobe && restored.tickerStarted === restored.originalTicker);
      } catch (error) { report.restorationErrors ??= []; report.restorationErrors.push(String(error)); persist(); if (!firstFailure) throw error; }
    }
  };
  const exitMars = async () => {
    await evaluate(`(()=>{const m=${actualVista},r=${resources};window.__cfPaintedMarsRetired={sprite:m,texture:m.texture,source:m.texture.source,
      canvas:m.texture.source.resource,parent:m.parent,scope:r.registry.activeScopes.find(x=>x.label.startsWith('scene:')),loader:r.surfacePaintedVista??r.surfacePaintedVistaLast};return true})()`);
    if(mode==='phone'){
      const point = await evaluate(`(()=>{const p=${S}.world.toGlobal({x:0,y:0});if(document.elementFromPoint(p.x,p.y)!==${S}.app.canvas)throw Error('Native exit canvas occluded');return{x:p.x,y:p.y}})()`);
      await native(point,'right');
    }else if(mode==='desktop')await escape();
    else{
      await click('#docksurvey');
      await wait('Survey Leave world available',`${S}.api.state().cardOpen&&document.querySelector('[data-act=leaveworld]')&&${ready}`);
      await click('[data-act=leaveworld]');
    }

    await wait('native Mars exit', `${S}.api.state().mode==='system'&&!${resources}.surfaceVistaMounted&&${ready}`);
    const retired = await evaluate(`(()=>{const p=window.__cfPaintedMarsRetired,r=${resources};return{spriteDestroyed:p.sprite.destroyed,parentNull:p.sprite.parent===null,
      textureDestroyed:p.texture.destroyed,sourceDestroyed:p.source.destroyed,canvasSize:[p.canvas.width,p.canvas.height],
      oldParentDetached:!p.parent.children.includes(p.sprite),oldScopeAbsent:!!p.scope&&!r.registry.activeScopes.some(x=>x.label===p.scope.label),
      loaderBefore:p.loader,resources:r}})()`);
    report.steps.push({ name: 'actual Mars resource retirement', retired }); persist();
    assert(retired.spriteDestroyed && retired.parentNull && retired.textureDestroyed && retired.sourceDestroyed && retired.oldParentDetached && retired.oldScopeAbsent);
    assert.deepEqual(retired.canvasSize, [960, 430]);
    const r = retired.resources;
    assert(!r.surfaceVistaMounted && !r.surfaceVistaWorkerActive && r.surfacePaintedVista === null);
    assert.equal(r.surfaceVistaArtVariant, null); assert.equal(r.surfaceVistaEnvironmentFingerprint, null);
    assert.equal(r.surfaceVistaCacheEntries, 1); assert.equal(r.surfaceVistaCachePixels, 960 * 430);
    assert.equal(r.surfacePaintedComposition,false);
    if(mode==='default')assert.equal(r.surfacePaintedVistaLast,null);
    else{
      assert.equal(r.surfacePaintedVistaLast?.status,'disposed');
      assert.equal(r.surfacePaintedVistaLast.fetchStarts,1);assert(!r.surfacePaintedVistaLast.decodePending);
      assert.equal(r.surfacePaintedVistaLast.canvasPixels,0);assert(r.surfacePaintedVistaLast.aborted);
    }

    assert.equal(r.surfaceVistaFaults, blocked ? 1 : 0); assert.equal(r.surfaceVistaWorkerStarts, painted ? 0 : 1);
    checkRegistry(r.registry); await evaluate('delete window.__cfPaintedMarsRetired;true');
  };
  await viewport(...dimensions);
  await send('Page.navigate', { url: report.origin + (mode==='default'?'/':'/?paintedvista=1') });
  await wait('first answerable document', `${S}?.api&&${ready}`);
  if (await evaluate(`${S}.api.state().tutActive`)) {
    await click('[data-sel=tutskip]'); await wait('native Training Skip', `!${S}.api.state().tutActive&&${ready}`);
  }
  await wait('canonical Sol system', `${S}.api.state().mode==='system'&&${S}.api.state().gal===999&&${S}.api.state().star===424242&&${ready}`);
  await wait('system camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`);
  await wait('distinct rendered Earth and Mars positions', `(()=>{const p=${S}.api.planetScreenTarget({seed:134,ordinal:3}),e=${S}.api.planetScreenTarget({seed:133,ordinal:2});return p&&e&&p.width>0&&Math.hypot(p.screenX-e.screenX,p.screenY-e.screenY)>8})()`);
  const target = await evaluate(`(()=>{const p=${S}.api.planetScreenTarget({seed:134,ordinal:3});if(!p||document.elementFromPoint(p.screenX,p.screenY)!==${S}.app.canvas)throw Error('Exact Mars target unavailable or occluded');return{x:p.screenX,y:p.screenY}})()`);
  await native(target);
  await wait('exact Mars Survey', `document.querySelector('[data-act=landcta]')?.getAttribute('data-landing-world')===${JSON.stringify(address)}&&${ready}`);
  await click('[data-act=landcta]');
  await wait('selected Mars composition ready', `${S}.api.state().mode==='surface'&&${resources}.surfaceVistaMounted&&${resources}.surfaceVistaArtVariant===${JSON.stringify(painted ? variant : 'canonical-v1')}&&${mode==='default'?`${resources}.surfacePaintedVista===null`:`${resources}.surfacePaintedVista?.status===${JSON.stringify(blocked?'failed':'ready')}`}&&${ready}`);
  await click('[data-survey-close]'); await frames();
  await checkVista('initial Mars attachment', true);
  assert(!await evaluate("document.querySelector('[data-cf-audiovisual-pilot]')!==null"), 'avpilot must be absent');
  assert(await evaluate("window.__cfPaintedMarsInputs.some(e=>e.trusted&&e.act==='landcta')"));
  assert.equal(assetRequests.size, expectedRequests, 'Unexpected observed page requests for Mars asset');
  if (blocked) {
    await Promise.all(interceptionJobs); assert.equal(report.intercepted.length, 1);
    assert(report.network.some(event => event.method === 'Network.loadingFailed'), 'Controlled asset failure was not observed');
  } else if(painted) {
    assert.equal(report.intercepted.length, 0);
    assert(report.network.some(event => event.method === 'Network.responseReceived' && event.status === 200), 'Actual Mars asset response absent');
    assert.equal(report.served[report.asset.path], report.asset.sha256);
  } else { assert.equal(report.intercepted.length,0);assert.deepEqual(report.network,[]); }
  await capturePaint('mars-composition-' + mode);
  await click('#docksurvey');
  await wait('native Survey reopens on same Mars',`${S}.api.state().cardOpen&&${S}.api.state().navWorldKey===${JSON.stringify(address)}&&document.querySelector('[data-act=leaveworld]')&&${ready}`);
  await click('[data-survey-close]');
  await wait('native Survey Close retains Mars',`!${S}.api.state().cardOpen&&${S}.api.state().navWorldKey===${JSON.stringify(address)}&&${ready}`);
  await checkVista('native Survey reopen and Close');

  if (mode === 'phone') {
    await click('#docksets'); await click('[data-motion="1"]');
    await wait('native Reduced retains static painted vista', `${S}.api.state().motionMode===1&&${resources}.surfaceVistaArtVariant===${JSON.stringify(variant)}&&${resources}.surfaceVistaMounted&&${ready}`);
    await escape(); await checkVista('Reduced static painted vista'); await capturePaint('mars-phone-reduced');
    await click('#docksets'); await click('[data-sel="set-effects"]');
    await wait('native Effects Off committed', `${S}.api.state().fxOn===false&&${ready}`);
    await click('[data-motion="0"]');
    await wait('Effects Off independently retains static painted vista', `${S}.api.state().motionMode===0&&!${S}.api.state().fxOn&&${resources}.surfaceVistaArtVariant===${JSON.stringify(variant)}&&${resources}.surfaceVistaMounted&&${ready}`);
    await escape(); await checkVista('Effects Off static painted vista'); await capturePaint('mars-phone-effects-off');
  }
  await exitMars(); guard(); assert.equal(assetRequests.size, expectedRequests, 'Asset fetch repeated'); report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.failure = String(error.stack ?? error); process.exitCode = 1;
  const failedEvaluation = report.pendingEvaluation;
  try { report.failureState = await evaluate?.(snapshot); } catch (e) { report.failureStateError = String(e); }
  report.failedEvaluation = failedEvaluation;
  try { const shot = await send?.('Page.captureScreenshot', { format: 'png' }); if (shot) fs.writeFileSync(path.join(out, 'failure.png'), Buffer.from(shot.data, 'base64'), { flag: 'wx' }); }
  catch (e) { report.failureScreenshotError = String(e); }
} finally {
  const cleanup = [];
  try { await Promise.all(interceptionJobs); } catch (e) { cleanup.push(String(e)); }
  try { await browser?.close(); } catch (e) { cleanup.push(String(e)); }
  if (server.listening) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  try {
    for (const [file, digest] of Object.entries(report.sources)) assert.equal(hash(fs.readFileSync(path.join(repo, file))), digest, 'Source changed: ' + file);
    for (const [file, digest] of Object.entries(report.served)) assert.equal(hash(fs.readFileSync(path.join(dist, file))), digest, 'Dist changed: ' + file);
    if (report.asset) assert.equal(hash(fs.readFileSync(path.join(dist, report.asset.path))), report.asset.sha256, 'Built asset changed');
  } catch (e) { cleanup.push(String(e)); }
  if (cleanup.length) { report.cleanupFailures = cleanup; report.status = 'FAIL'; process.exitCode = 1; }
  report.endedAt = new Date().toISOString(); persist();
}
console.log(JSON.stringify({ status: report.status, output: out, failure: report.failure }));
