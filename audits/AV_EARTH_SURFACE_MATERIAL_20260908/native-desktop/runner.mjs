import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Scoped diagnostic, not certification. Root runs under the shared lock outside macOS Seatbelt.
// node audits/AV_EARTH_SURFACE_MATERIAL_20260908/native-material-runner.mjs /absolute/evidence-dist /absolute/fresh-output phone|desktop
const repo = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
assert.equal(process.argv.length, 5, 'Expected evidence-dist, fresh-output and phone|desktop arguments');
const mode=process.argv[4]; assert(['phone','desktop'].includes(mode));
const dimensions=mode==='phone'?[390,844,2,true]:[1440,1000,1,false];
const dist = fs.realpathSync(process.argv[2]), out = path.resolve(process.argv[3]);
assert(!fs.existsSync(out) && !out.startsWith(dist + path.sep), 'Output must be fresh and outside dist');
assert.equal(fs.realpathSync(path.dirname(out)), path.dirname(out), 'Output parent must exist and be real');
fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(out, 'runner.mjs'), fs.constants.COPYFILE_EXCL);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { schema: 'cf-native-earth-surface-material/v1', certification: false, status: 'RUNNING',
  startedAt: new Date().toISOString(), dist, mode, viewport:dimensions.slice(0,3), sources: {}, served: {}, steps: [], screenshots: [], errors: [],
  limitations: [
    'Fresh isolated origin; native Training Skip, canonical Earth Survey and Land. Not progression or save-migration certification.',
    'One fresh fixed Chromium viewport per run. Not physical iPhone/Safari/PWA, art acceptance or a comparison between GPUs.',
    'Material comparison pauses one naturally reached angle; it does not repeat the full finite-motion proof or establish a seamless revolution.',
    'Deterministic stylized color-derived relief and sheen, not physical terrain heights or calibrated material optics.',
    'Program key, uniform UID and actual renderer cache counts are observed; native WebGLProgram handle identity/deletion is not claimed. One program intentionally remains application-owned.',
    'Only the phone run exercises native Reduced/Effects preferences. No resize, re-entry, hidden-document/context-loss or broad heap claim; the earlier resize/navigation failure remains unresolved.',
  ] };
for (const name of [
  'port/v2/apps/game/src/main.ts', 'port/v2/apps/game/src/planet-surface-turn-view.ts',
  'port/v2/apps/game/src/planet-surface-material.ts',
  'port/v2/apps/game/src/planet-surface-turn.worker.ts', 'port/v2/apps/game/src/planet-surface-turn-math.ts',
  'port/v2/apps/game/src/planet-surface-atlas.ts', 'port/v2/packages/art/src/thumbart.verbatim.js',
  'port/v2/packages/domain/starcatalog/src/index.ts', 'port/v2/packages/domain/planetgen/src/planetgen.verbatim.js',
  'port/v2/packages/domain/surveyphrases/src/surveyphrases.verbatim.js',
  'port/v2/apps/game/src/scene-texture-owner.ts', 'port/v2/apps/game/src/pixi-managed-resource-owner.ts',
  'audits/AV_EARTH_SURFACE_TURN_20260908/native-desktop-runner.mjs',
  'audits/AV_EARTH_SURFACE_MATERIAL_20260908/native-material-runner.mjs',
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
  browser = await openChromiumCdp({ label:'native Earth material '+mode, userDataPrefix:'cf-earth-material-'+mode+'-20260908',
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
    assert(v&&v.materialEnabled===true&&v.status==='ready'&&v.error===null&&v.shown&&v.meshLive&&v.textureLive&&!v.workerActive&&v.workerStarts===1&&!v.canonicalVisible&&s.worldVisible);
    assert.equal(v.canvasPixels,768*384); assert(Number.isInteger(v.appProgramKey)&&Number.isInteger(v.appUniformUid));
    const expected=v.elapsedSeconds>=18?0:.22*Math.sin(Math.PI*v.elapsedSeconds/18)**2;
    assert(Math.abs(v.angle-expected)<1e-10,'Actual uniform owner violates finite motion law');
    assert(s.resources.surfacePlanetTurnProgramCache.turnProgramPresent);
    checkRegistry(s.resources.registry); return s;
  };
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
  const assertMaterialDelta = delta => {
    assert(delta.mesh.changedPixels>0&&delta.stage.changedPixels>0,'Material did not change both actual mesh and scene pixels');
    assert.equal(delta.mesh.alphaChanged,0,'Material changed the sphere alpha silhouette');
    assert.equal(delta.stage.outsidePixels,0,'Material changed pixels outside the actual projected mesh bounds');
  };
  const captureMaterial = async name => {
    await wait(name+' natural comparison angle',`${turn}.elapsedSeconds>=5.5`,10000);
    const state=await checkTurn(name+' before pause');
    assert(state.resources.surfacePlanetTurn.elapsedSeconds<9.5,'Natural comparison angle missed');
    try {
      const control=await evaluate(`(()=>{
        const s=${S},m=${actualMesh},r=s.app.renderer,group=m.shader.resources.turnUniforms,u=group.uniforms;
        if(u.uMaterial!==1||!m.visible)throw Error('Material route did not enable the actual visible uniform');
        const q={m,group,shader:m.shader,program:m.shader.glProgram,texture:m.texture,source:m.texture.source,
          canvas:m.texture.source.resource,parent:m.parent,index:m.parent.getChildIndex(m),visible:m.visible,
          started:s.app.ticker.started,wasGroup:m.isRenderGroup,originalMaterial:u.uMaterial,angle:u.uAngle,
          extent:u.uExtent,frame:s.app.screen.clone(),resolution:r.resolution};
        window.__cfMaterialProbe=q;s.app.ticker.stop();
        const transform=()=>JSON.stringify({position:[m.x,m.y],scale:[m.scale.x,m.scale.y],pivot:[m.pivot.x,m.pivot.y],
          skew:[m.skew.x,m.skew.y],rotation:m.rotation,alpha:m.alpha,world:[m.worldTransform.a,m.worldTransform.b,
          m.worldTransform.c,m.worldTransform.d,m.worldTransform.tx,m.worldTransform.ty]});
        const bytesEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
        const digest=a=>{let h=2166136261;for(const v of a)h=Math.imul(h^v,16777619);return(h>>>0).toString(16)};
        const atlas=()=>q.canvas.getContext('2d').getImageData(0,0,q.canvas.width,q.canvas.height).data;
        q.restore=()=>{const errors=[],attempt=f=>{try{f()}catch(e){errors.push(String(e))}};
          attempt(()=>{u.uMaterial=q.originalMaterial});
          attempt(()=>{if(!q.wasGroup&&m.isRenderGroup)m.disableRenderGroup();if(m.isRenderGroup!==q.wasGroup)throw Error('Render group restoration failed')});
          attempt(()=>{r.render(s.app.stage)});
          attempt(()=>{if(q.started)s.app.ticker.start();else s.app.ticker.stop()});
          return{errors,material:u.uMaterial,angle:u.uAngle,tickerStarted:s.app.ticker.started,renderGroup:m.isRenderGroup,
            originalMaterial:q.originalMaterial,originalTicker:q.started,originalRenderGroup:q.wasGroup}};
        const local=m.getLocalBounds().rectangle;
        if(local.width!==420||local.height!==420)throw Error('Unexpected actual mesh dimensions');
        q.meshFrame=local.clone();
        const mesh=()=>{try{return r.extract.pixels({target:m,frame:q.meshFrame,resolution:1})}
          finally{if(!q.wasGroup&&m.isRenderGroup)m.disableRenderGroup();if(m.isRenderGroup!==q.wasGroup)throw Error('Mesh extraction changed group topology');r.render(s.app.stage)}};
        const stage=()=>r.extract.pixels({target:s.app.stage,frame:q.frame,resolution:q.resolution});
        const sample=value=>{u.uMaterial=value;const a=mesh(),b=stage();r.render(s.app.stage);return{mesh:a,stage:b}};
        q.transform=transform();q.atlas=new Uint8ClampedArray(atlas());
        q.registry=JSON.stringify(s.api.sceneResourceDiagnostics().registry);
        // Warm extraction-owned global uniform pool entries; preserve pre-toggle scene and atlas state.
        sample(0);sample(1);r.render(s.app.stage);
        q.programCount=s.api.sceneResourceDiagnostics().surfacePlanetTurnProgramCache.programCount;
        const b=m.getBounds();q.bounds={x:b.x,y:b.y,width:b.width,height:b.height};
        const diff=(a,b,scene=false)=>{if(a.width!==b.width||a.height!==b.height||a.pixels.length!==a.width*a.height*4||a.pixels.length!==b.pixels.length)throw Error('Pixel frame changed');
          let changedPixels=0,changedChannels=0,alphaChanged=0,outsidePixels=0,nontransparent=0;
          const loX=Math.floor((q.bounds.x-q.frame.x)*q.resolution)-1,hiX=Math.ceil((q.bounds.x+q.bounds.width-q.frame.x)*q.resolution)+1;
          const loY=Math.floor((q.bounds.y-q.frame.y)*q.resolution)-1,hiY=Math.ceil((q.bounds.y+q.bounds.height-q.frame.y)*q.resolution)+1;
          for(let i=0;i<a.pixels.length;i+=4){let changed=false;if(a.pixels[i+3]>0)nontransparent++;
            for(let c=0;c<4;c++)if(a.pixels[i+c]!==b.pixels[i+c]){changed=true;changedChannels++;if(c===3)alphaChanged++}
            if(changed){changedPixels++;const x=(i/4)%a.width,y=Math.floor(i/4/a.width);if(scene&&(x<loX||x>=hiX||y<loY||y>=hiY))outsidePixels++}}
          return{width:a.width,height:a.height,changedPixels,changedChannels,alphaChanged,outsidePixels,nontransparent,
            baselineHash:digest(a.pixels),sampleHash:digest(b.pixels)}};
        const pair=(a,b)=>({mesh:diff(a.mesh,b.mesh),stage:diff(a.stage,b.stage,true)});
        q.plain=sample(0);const repeat=sample(0),rich=sample(1),restored=sample(0),forcedOff=sample(0);
        const noOp=pair(q.plain,repeat),material=pair(q.plain,rich),restore=pair(q.plain,restored),forced=pair(q.plain,forcedOff);
        if(!noOp.mesh.nontransparent||!noOp.stage.nontransparent)throw Error('Empty pixel owner');
        q.rich=rich;
        q.identities=()=>({texture:m.texture===q.texture,source:m.texture.source===q.source,canvas:m.texture.source.resource===q.canvas,
          shader:m.shader===q.shader,program:m.shader.glProgram===q.program,group:m.shader.resources.turnUniforms===q.group,
          parent:m.parent===q.parent,index:m.parent?.getChildIndex(m)===q.index,visible:m.visible===q.visible,
          transform:transform()===q.transform,angle:u.uAngle===q.angle,extent:u.uExtent===q.extent,
          atlasBytes:bytesEqual(q.atlas,atlas()),atlasDimensions:q.canvas.width===768&&q.canvas.height===384,
          sceneRegistry:JSON.stringify(s.api.sceneResourceDiagnostics().registry)===q.registry,
          programCount:s.api.sceneResourceDiagnostics().surfacePlanetTurnProgramCache.programCount===q.programCount});
        q.present=value=>{u.uMaterial=value;r.render(s.app.stage);const pixels=stage(),expected=value===0?q.plain.stage:q.rich.stage;
          const comparison=diff(expected,pixels,true);r.render(s.app.stage);return{comparison,identities:q.identities(),angle:u.uAngle,material:u.uMaterial,tickerStopped:!s.app.ticker.started}};
        return{method:'Actual uniform 0/1/0; natural angle frozen; explicit 420-square mesh frame and unchanged screen frame; one device-pixel bounds padding',
          angle:q.angle,elapsedSeconds:${turn}.elapsedSeconds,frame:{x:q.frame.x,y:q.frame.y,width:q.frame.width,height:q.frame.height},
          bounds:q.bounds,resolution:q.resolution,atlasBytes:q.atlas.length,atlasHash:digest(q.atlas),
          noOp,material,restore,forcedOff:forced,identities:q.identities()};
      })()`);
      report.steps.push({name:name+' frozen material controls',control});persist();
      for(const sample of [control.noOp,control.restore])for(const owner of ['mesh','stage'])assert.equal(sample[owner].changedPixels,0,'No-op/restoration pixels differ');
      assertMaterialDelta(control.material);
      assert.throws(()=>assertMaterialDelta(control.forcedOff),'Forced-off sample escaped the same material delta assertion');
      assert(Object.values(control.identities).every(v=>v===true),'Toggle changed an existing owner or atlas bytes');
      report.steps.push({name:name+' forced-off negative control rejected',sameAcceptor:true});persist();
      for(const [value,label] of [[0,'plain'],[1,'material']]) {
        const present=await evaluate(`window.__cfMaterialProbe.present(${value})`);
        assert.equal(present.comparison.changedPixels,0,'Screenshot frame differs from compared variant');
        assert(present.tickerStopped&&present.material===value&&present.angle===control.angle);
        assert(Object.values(present.identities).every(v=>v===true));
        await shot(name+'-'+label);report.steps.push({name:name+' '+label+' screenshot state',present});persist();
      }
    } catch(error) {
      report.materialComparisonFailure={error:String(error.stack??error),pendingEvaluation:report.pendingEvaluation};persist();throw error;
    } finally {
      try {
        const restoration=await evaluate(`(()=>{const q=window.__cfMaterialProbe;if(!q)return{errors:[]};if(!q.restore)return{errors:['Probe restoration unavailable']};const result=q.restore();delete window.__cfMaterialProbe;return result})()`);
        report.steps.push({name:name+' probe restoration',restoration});persist();
        assert.deepEqual(restoration.errors,[],'Material probe restoration failed');
        if('material' in restoration)assert(restoration.material===1&&restoration.material===restoration.originalMaterial&&restoration.tickerStarted===restoration.originalTicker&&restoration.renderGroup===restoration.originalRenderGroup);
      } catch(error) {report.restorationErrors??=[];report.restorationErrors.push(String(error));persist();if(!report.materialComparisonFailure)throw error;}
    }
    await checkUniformOwners(name);
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
  await viewport(...dimensions);
  await send('Page.navigate',{url:report.origin+'/?planetturn=1&planetmaterial=1'});
  await wait('first answerable document',`${S}?.api&&${ready}`);
  if(await evaluate(`${S}.api.state().tutActive`)) { await click('[data-sel=tutskip]');await wait('native Training Skip',`!${S}.api.state().tutActive&&${ready}`); }
  const entry=await enterEarth('fresh '+mode);assert.deepEqual(entry.viewport,dimensions.slice(0,3));
  await captureMaterial('earth-'+mode);
  if(mode==='phone') {
    await click('#docksets');await click('[data-motion="1"]');
    await wait('native Reduced restores canonical globe',`${S}.api.state().motionMode===1&&${turn}?.status==='ready'&&!${turn}.shown&&${turn}.canonicalVisible&&${turn}.elapsedSeconds===0&&${ready}`);
    await escape();await shot('earth-phone-reduced');
    await click('#docksets');await click('[data-sel="set-effects"]');
    await wait('native Effects Off committed',`${S}.api.state().fxOn===false&&${ready}`);
    await click('[data-motion="0"]');
    await wait('Effects Off independently holds fallback with Full motion',`${S}.api.state().motionMode===0&&!${S}.api.state().fxOn&&!${turn}.shown&&${turn}.canonicalVisible&&${turn}.elapsedSeconds===0&&${ready}`);
    await escape();await shot('earth-phone-effects-off');
    await click('#docksets');await click('[data-sel="set-effects"]');
    await wait('native Effects On resumes current turn',`${S}.api.state().fxOn&&${turn}.shown&&${ready}`);
    await escape();
  }
  await exitEarth('fresh '+mode);
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
