import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { ARC4_DURABLE_READ_EXPRESSION } from '../../port/v2/tools/arc4-browser-contract.mjs';

// Scoped diagnostic; root owns native runs under the shared lock outside macOS Seatbelt.
// Run only after parent source freeze, under shared foreground and checkout locks outside macOS Seatbelt.
// node audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-v2-runner.mjs DIST FRESH_OUTPUT phone|desktop|blocked|default
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
const report = { schema: 'cf-native-earth-landing-still/v2', certification: false, status: 'RUNNING',
  startedAt: new Date().toISOString(), dist, mode, viewport: dimensions.slice(0, 3), sources: {}, served: {},
  steps: [], screenshots: [], errors: [], network: [], intercepted: [], interceptionErrors: [], frameServices: [],
  predecessor: 'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-runner.mjs',
  limitations: [
    'Fresh fixed Chromium origin and viewport; no resize/re-entry, physical iPhone/Safari, PWA, broad heap, human art acceptance or certification claim.',
    'Native Training Skip, exact canonical Earth Survey and Land; no navigation or persistence fixture writes.',
    'Native current roster count/fingerprint is observed through existing DOM fields. Full19 genome equality and every-resident mutation rejection are source-bound focused admission-test evidence, not a native private-roster read.',
    'Canonical safe Earth: one native Land, one durable receipt, zero RNG draws and zero damage; no retry or forced outcome.',
    'Blocked control returns an unchanged prior valid Earth WebP prefix plus explicit zero padding to the exact new asset byte length, only at the new URL. SHA must reject before decode; padded-image decoder compatibility is not invoked or claimed.',
    'One actual flattened opaque sprite represents the Earth scene and Civet hero. No empty resident layer, individually separable animals, animation, added roster, or Compendium integration is claimed.',
    'The actual owned still canvas/texture retire on native exit and the canvas shrinks to 1x1. Canonical fallback retains its existing one-canvas cache.',
    'Pixel comparison pauses the ticker and extracts the same explicit full-stage frame; DOM rectangles and 35 native hit samples independently establish placement. Native GPU-driver release and species art quality are unmeasured.',
    'Phone exit uses existing native Survey / Leave world; right-click exit coverage is not claimed.',
    'A passive journal samples at most 120 frames for at most 2000 ms around one native Land. Missing transient motion is a limitation; no Land replay, shake, or forced layout synchronization.',
  ] };
const sourceNames = [
  'port/v2/apps/game/src/main.ts',
  'port/v2/apps/game/src/painted-earth-landing-recipe.ts',
  'port/v2/tests/painted-earth-landing-binding.test.ts',
  'port/v2/apps/game/src/pilot-canonical-vista.ts',
  'port/v2/apps/game/src/earth-layered-recipe.ts',
  'port/v2/apps/game/src/earth-layered-layout.ts',
  'port/v2/apps/game/src/earth-layered-resources.ts',
  'port/v2/apps/game/src/painted-vista-load.ts',
  'port/v2/apps/game/src/biome-vista-surface.ts',
  'port/v2/apps/game/src/biome-vista-protocol.ts',
  'port/v2/apps/game/src/biome-vista-cache.ts',
  'port/v2/apps/game/src/biome-vista.worker.ts',
  'port/v2/apps/game/src/world-roster.ts',
  'port/v2/apps/game/src/scene-texture-owner.ts',
  'port/v2/apps/game/src/pixi-managed-resource-owner.ts',
  'port/v2/apps/game/src/descent-policy.ts',
  'port/v2/apps/game/src/arc0-landing-action.ts',
  'port/v2/packages/persistence/src/outcome-transaction.ts',
  'port/v2/packages/art/src/earth-resident-plan.ts',
  'port/v2/apps/game/src/assets/painted/earth-civet-landing-v1.webp',
  'port/v2/apps/game/src/assets/painted/earth-riverbank-v1.webp',
  'audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json',
  'audits/AV_EARTH_LAYERED_SCENE_20260908/native-earth-layers-settled-runner.mjs',
  'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-runner.mjs',
  'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-v2-runner.mjs',
  'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-v2-chain.mjs',
  'port/v2/apps/game/src/painted-vista-load.test.ts',
  'port/v2/tests/earth-layered-shake-settlement.test.ts',
  'port/v2/tests/painted-earth-mount-ownership.test.ts',
  'port/v2/tools/arc4-browser-contract.mjs', 'port/v2/tools/browsercdp.mjs',
  'port/v2/apps/game/src/app-chrome.ts',
  'port/v2/apps/game/src/ui-sheet-style.ts',
  'port/v2/apps/game/index.html',
  'port/v2/packages/domain/strays/src/index.ts',
  'port/v2/packages/domain/strays/src/strays.verbatim.js',
  'port/v2/packages/domain/biome-profile/src/index.ts',
];
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
const address = 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
const variant = 'painted-earth-civet-landing-v1';
const canonicalEarth = JSON.parse(fs.readFileSync(path.join(repo, 'audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json'), 'utf8'));
assert.equal(canonicalEarth.roster.view.all.length, 19);
const expectedAssetBytes = 600756;
const wrongAssetSourcePath = 'port/v2/apps/game/src/assets/painted/earth-riverbank-v1.webp';
const wrongAssetSource = fs.readFileSync(path.join(repo, wrongAssetSourcePath));
assert(wrongAssetSource.length > 0 && wrongAssetSource.length < expectedAssetBytes, 'Wrong-asset padding must be nonempty');
const wrongAssetBytes = Buffer.alloc(expectedAssetBytes);
wrongAssetSource.copy(wrongAssetBytes);
report.wrongAsset = {
  source: { path: wrongAssetSourcePath, bytes: wrongAssetSource.length, sha256: hash(wrongAssetSource) },
  bytes: wrongAssetBytes.length, sha256: hash(wrongAssetBytes),
  mutation: { kind: 'append-zero-padding', preservedPrefixBytes: wrongAssetSource.length,
    paddingOffset: wrongAssetSource.length, paddingBytes: expectedAssetBytes - wrongAssetSource.length,
    paddingByteValue: 0, originalRiffHeaderAndPayloadUnchanged: true },
  purpose: 'Match the exact 600756-byte response contract while preserving a wrong SHA; reject before image decode',
  limitation: 'The original valid WebP is only a preserved prefix. Padded-payload decoder compatibility is not exercised or required.',
};
const resources = `${S}.api.sceneResourceDiagnostics()`;
const ready = `(()=>{const s=${S}?.api.state(),p=s?.persistence,r=p?.runtime;return p?.ready===true&&p.hold===null&&p.seedBootstrapPending===false&&p.bootRouteRepairPending===false&&p.mutationBlocked===false&&p.documentToken===${S}.documentToken&&r?.visible===true&&r.answerable===true&&r.leaseOwned===true&&r.accruing===true&&r.staleBlocked===false&&s.sceneResources.pendingPersistenceWrites===0})()`;
const snapshot = `(()=>{const s=${S}?.api.state();return s?{documentToken:${S}.documentToken,mode:s.mode,gal:s.gal,galX:s.galX,galY:s.galY,star:s.star,starX:s.starX,starY:s.starY,planet:s.planet,planetOrdinal:s.planetOrdinal,navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,cardOpen:s.cardOpen,panelOpen:s.panelOpen,motionMode:s.motionMode,fxOn:s.fxOn,persistence:s.persistence,landing:s.landing,save:s.save,hp:{value:document.getElementById('hpbar')?.getAttribute('aria-valuenow'),text:document.querySelector('#hpbar .txt')?.textContent},resources:${resources},rosterDom:(()=>{const d=document.getElementById('planetside')?.dataset;return d?{state:d.rosterState,total:Number(d.fullRosterCount),preview:Number(d.previewCount),fingerprint:d.fullRosterFingerprint,ecologyEpoch:Number(d.ecologyEpoch)}:null})(),worldVisible:${S}.world.visible,at:performance.now(),viewport:[innerWidth,innerHeight,devicePixelRatio],inputs:window.__cfEarthLayersInputs}:null})()`;
const actualLayers = `(()=>{
  const stage=${S}.app.stage;
  const matches=stage.children.filter(c=>c.texture?.source?.resource instanceof HTMLCanvasElement
    &&c.texture.source.resource.width===960&&c.texture.source.resource.height===430);
  if(matches.length!==1)throw Error('Expected exactly one actual 960x430 scene sprite: '+matches.length);
  if(stage.children.some(c=>c.label==='earth-painted-background'||c.label==='earth-canonical-residents'))
    throw Error('Flattened still/fallback retained old Earth layers');
  if(${painted}){
    if(matches[0].label!=='earth-painted-landing-still')throw Error('Missing unique labeled Earth still');
  }else if(matches[0].label==='earth-painted-landing-still')throw Error('Fallback retains painted Earth still');
  return matches;
})()`;
const actualVista = `(${actualLayers})[0]`;
const actualGlobe = `(()=>{const matches=${S}.world.children.filter(c=>c.texture?.source?.resource instanceof HTMLCanvasElement&&Math.abs(c.width-420)<.001&&Math.abs(c.height-420)<.001);if(matches.length!==1)throw Error('Expected one actual decorative surface globe');return matches[0]})()`;
const actualCloud = `(()=>{const a=${S}.world.children.filter(c=>c.label==='surface-cloud-deck');if(a.length!==1)throw Error('Expected one actual surface cloud container');return a[0]})()`;
const compositionState = `(()=>{
  const s=${S},layers=${actualLayers},globe=${actualGlobe},cloud=${actualCloud},canvasRect=s.app.canvas.getBoundingClientRect();
  const paintedElement=e=>{if(!e||e.getClientRects().length===0)return false;const b=e.getBoundingClientRect();if(b.width<=0||b.height<=0)return false;for(let p=e;p instanceof Element;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)===0)return false}return true};
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const identify=e=>e?{tag:e.tagName,id:e.id||null,classes:e.className,role:e.getAttribute('role'),text:(e.textContent||'').trim().slice(0,100)}:null;
  const controls=[...document.querySelectorAll('button,input,select,textarea,[role="button"]')].filter(paintedElement).map((e,i)=>{
    const r=rect(e),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{key:e.id||e.tagName+':'+i,...r,disabled:!!e.disabled,inert:!!e.closest('[inert]'),hit:h===e||e.contains(h)}});
  const topElements=[...document.querySelectorAll('#topbar,#searchbox,#objchip,#sceneactions')].filter(paintedElement).map(e=>({key:e.id,...rect(e)}));
  const dock=document.getElementById('dock');if(!paintedElement(dock))throw Error('Visible dock unavailable');
  const side=document.getElementById('planetside'),planetside=paintedElement(side)?rect(side):null;
  const blockers=[...document.querySelectorAll('#topbar,#searchbox,#objchip,#sceneactions,#planetside,#dock,#railrgt,#raillft,#survey,#ctxbar,#hintpill,#trail,#toast,[role="dialog"],.panel')]
    .filter(paintedElement).map(e=>({key:e.id||e.tagName,...rect(e),pointerEvents:getComputedStyle(e).pointerEvents}));
  const describe=m=>{const b=m.getBounds();return{label:m.label,visible:m.visible,renderable:m.renderable,alpha:m.alpha,eventMode:m.eventMode,
    index:s.app.stage.getChildIndex(m),parentIsStage:m.parent===s.app.stage,
    bounds:{x:b.x,y:b.y,width:b.width,height:b.height},
    cssBounds:{x:canvasRect.x+b.x*canvasRect.width/s.app.screen.width,y:canvasRect.y+b.y*canvasRect.height/s.app.screen.height,
      width:b.width*canvasRect.width/s.app.screen.width,height:b.height*canvasRect.height/s.app.screen.height},sourceSize:[m.texture.source.resource.width,m.texture.source.resource.height],
    position:[m.x,m.y],scale:[m.scale.x,m.scale.y],anchor:[m.anchor.x,m.anchor.y],rotation:m.rotation,
    spriteFrame:{x:m.texture.frame.x,y:m.texture.frame.y,width:m.texture.frame.width,height:m.texture.frame.height}}};
  const descriptions=layers.map(describe),b=descriptions[0].cssBounds;
  const overlaps=blockers.filter(r=>Math.min(b.x+b.width,r.right)-Math.max(b.x,r.x)>.02
    &&Math.min(b.y+b.height,r.bottom)-Math.max(b.y,r.y)>.02);
  const points=[];
  for(const fy of [.01,.25,.5,.75,.99])for(const fx of [.01,.1,.25,.5,.75,.9,.99]){
    const x=b.x+b.width*fx,y=b.y+b.height*fy,hit=document.elementFromPoint(x,y);
    points.push({fx,fy,x,y,canvas:hit===s.app.canvas,hit:identify(hit)});
  }
  const r=s.api.sceneResourceDiagnostics();
  return{globeVisible:globe.visible,globeRenderable:globe.renderable,worldVisible:s.world.visible,
    cloud:{label:cloud.label,visible:cloud.visible,renderable:cloud.renderable,parentIsWorld:cloud.parent===s.world,children:cloud.children.length},
    diagnostic:r.surfacePaintedComposition,residentDiagnostic:r.surfaceEarthResidentLayer,canvasDiagnostic:r.surfaceEarthLayeredCanvasCount,
    viewport:[innerWidth,innerHeight,devicePixelRatio],screen:[s.app.screen.width,s.app.screen.height],canvasRect:rect(s.app.canvas),layers:descriptions,worldIndex:s.app.stage.getChildIndex(s.world),
    controls,topElements,topBottom:Math.max(0,...topElements.map(r=>r.bottom)),dock:rect(dock),planetside,
    dom:{blockers,overlaps,points}};
})()`;
// Independently observed browser rectangles/hits, not Pixi extraction, own DOM visibility.
// This same acceptor receives the real frame, hidden-layer/cloud/globe mutants,
// and the legacy H/2 placement that put the phone residents behind Planetside.
const acceptComposition = value => {
  const [width,height]=dimensions;
  assert.deepEqual(value.viewport,dimensions.slice(0,3));
  assert.deepEqual(value.screen,dimensions.slice(0,2));assert(value.canvasRect.width>0&&value.canvasRect.height>0);
  assert(value.worldVisible&&value.globeRenderable,'Scene render ownership changed');
  assert.equal(value.globeVisible,!painted,'Actual globe has the wrong visibility');
  assert(value.cloud.parentIsWorld&&value.cloud.renderable&&value.cloud.children>0,'Cloud container ownership changed');
  assert.equal(value.cloud.visible,!painted,'Actual cloud deck has the wrong visibility');
  assert.equal(value.diagnostic,painted);assert.equal(value.residentDiagnostic,false);
  assert.equal(value.canvasDiagnostic,painted?1:0);assert.equal(value.layers.length,1);
  assert(value.controls.length>0,'Empty control observer');
  const gutter=Math.min(24,Math.max(8,width*.03));
  let scale=Math.min((width-gutter*2)/960,(height-gutter*2)/430);
  let expectedY=height/width<1.25?height/2:Math.max(gutter+430*scale/2,
    height/2-Math.min(420,Math.min(width,height)*.78)/2-gutter-430*scale/2);
  if(painted){
    assert(value.topElements.length>0,'Top-chrome observer is empty');
    assert(value.planetside,'Canonical Earth Biosphere panel is absent');
    assert.deepEqual(value.dom.overlaps,[],'Panorama is obscured by visible DOM chrome');
    assert.equal(value.dom.points.length,35,'Panorama hit sampling is incomplete');
    assert(value.dom.points.every(p=>p.canvas),'Panorama contains a DOM-occluded native canvas point');
    const toLocalY=y=>(y-value.canvasRect.y)*height/value.canvasRect.height;
    const top=toLocalY(value.topBottom)+12,bottom=toLocalY(value.planetside?.y??value.dock.y)-12;
    assert(bottom>top,'No free Earth scene band between existing chrome');
    scale=Math.min((width-24)/960,(bottom-top)/430);expectedY=(top+bottom)/2;
  }
  const expectedHeight=430*scale,expectedWidth=960*scale;
  const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<.02,label);
  for(const layer of value.layers){
    assert(layer.visible&&layer.renderable&&layer.alpha===1,'Actual scene layer is hidden or faded');
    assert(layer.parentIsStage&&layer.index<value.worldIndex&&layer.eventMode==='none','Layer ownership/input order changed');
    assert.deepEqual(layer.sourceSize,[960,430]);assert.deepEqual(layer.anchor,[.5,.5]);assert.equal(layer.rotation,0);
    assert.deepEqual(layer.spriteFrame,{x:0,y:0,width:960,height:430});
    near(layer.bounds.width,expectedWidth,'Vista width changed');near(layer.bounds.height,expectedHeight,'Vista height changed');
    near(layer.bounds.x+layer.bounds.width/2,width/2,'Vista x is not centered');
    near(layer.bounds.y+layer.bounds.height/2,expectedY,'Vista y violates measured chrome band');
    if(painted){
      assert(layer.bounds.x>=12-.02&&layer.bounds.x+layer.bounds.width<=width-12+.02,'Panorama breaches horizontal margin');
      const marginY=12*value.canvasRect.height/height;
      assert(layer.cssBounds.y>=value.topBottom+marginY-.02,'Panorama intersects upper chrome');
      assert(layer.cssBounds.y+layer.cssBounds.height<=(value.planetside?.y??value.dock.y)-marginY+.02,'Panorama intersects Biosphere/dock');
    }
  }
  if(painted)assert.equal(value.layers[0].label,'earth-painted-landing-still');
};
const startSettlementJournal = `(()=>{
  if(window.__cfEarthSettlementJournal)throw Error('Settlement journal already exists');
  const s=${S},canvas=s.app.canvas,start=performance.now();
  const q={schema:'cf-earth-native-settlement-journal/v1',startedAt:start,maxFrames:120,maxMs:2000,
    rows:[],errors:[],stopped:false,reason:null,raf:null,timer:null};
  const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};
  const visible=e=>{if(!e)return false;const b=e.getBoundingClientRect();if(b.width<=0||b.height<=0)return false;
    for(let a=e;a instanceof Element;a=a.parentElement){const style=getComputedStyle(a);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false}return true};
  q.stop=reason=>{if(q.stopped)return;q.stopped=true;q.reason=reason;q.stoppedAt=performance.now();
    if(q.raf!==null)cancelAnimationFrame(q.raf);q.raf=null;if(q.timer!==null)clearTimeout(q.timer);q.timer=null};
  const take=()=>{
    q.raf=null;if(q.stopped)return;
    const at=performance.now();if(at-start>=q.maxMs){q.stop('time-bound');return}
    if(q.rows.length>=q.maxFrames){q.stop('frame-bound');return}
    try{
      const state=s.api.state(),upper=[...document.querySelectorAll('#topbar,#searchbox,#objchip,#sceneactions')]
        .filter(visible).map(e=>({id:e.id,...rect(e)}));
      const side=document.getElementById('planetside'),dock=document.getElementById('dock');
      const layers=s.app.stage.children.filter(c=>c.label==='earth-painted-landing-still')
        .map(c=>({label:c.label,visible:c.visible,position:[c.x,c.y],scale:[c.scale.x,c.scale.y],
          canvasSize:c.texture?.source?.resource?[c.texture.source.resource.width,c.texture.source.resource.height]:null}));
      q.rows.push({at,elapsedMs:at-start,mode:state.mode,cardOpen:state.cardOpen,activeCameraShakes:state.activeCameraShakes,
        canvasRect:rect(canvas),transform:getComputedStyle(canvas).transform,screen:[s.app.screen.width,s.app.screen.height],
        animations:canvas.getAnimations().map(a=>({playState:a.playState,currentTime:a.currentTime,
          pending:a.pending,duration:a.effect?.getTiming().duration??null})),
        upper,topBottom:Math.max(0,...upper.map(r=>r.bottom)),planetside:visible(side)?rect(side):null,
        dock:visible(dock)?rect(dock):null,layers});
    }catch(error){q.errors.push(String(error));q.stop('observer-error');return}
    if(q.rows.length>=q.maxFrames){q.stop('frame-bound');return}
    q.raf=requestAnimationFrame(take);
  };
  window.__cfEarthSettlementJournal=q;q.timer=setTimeout(()=>q.stop('time-bound'),q.maxMs);take();
  return{startedAt:start,maxFrames:q.maxFrames,maxMs:q.maxMs};
})()`;
const readSettlementJournal = `(()=>{const q=window.__cfEarthSettlementJournal;return q?{schema:q.schema,startedAt:q.startedAt,
  maxFrames:q.maxFrames,maxMs:q.maxMs,rows:q.rows,errors:q.errors,stopped:q.stopped,reason:q.reason,stoppedAt:q.stoppedAt??null}:null})()`;
const stopSettlementJournal = `(()=>{const q=window.__cfEarthSettlementJournal;if(q)q.stop('runner-cleanup');return ${readSettlementJournal}})()`;
const summarizeSettlementJournal = journal => {
  if(!journal)return{available:false};
  const rows=journal.rows,first=rows[0],activeIndex=rows.findIndex(r=>r.activeCameraShakes>0);
  const shifted=first?rows.filter(r=>Math.abs(r.canvasRect.y-first.canvasRect.y)>1e-6||Math.abs(r.canvasRect.x-first.canvasRect.x)>1e-6):[];
  const ended=activeIndex<0?[]:rows.slice(activeIndex+1).filter(r=>r.activeCameraShakes===0);
  const restingPairs=ended.filter(r=>r.layers.length===1&&r.animations.every(a=>a.playState!=='running'&&!a.pending)
    &&Math.abs(r.canvasRect.x-first.canvasRect.x)<1e-6&&Math.abs(r.canvasRect.y-first.canvasRect.y)<1e-6);
  const bands=restingPairs.map(r=>{const lower=r.planetside??r.dock,scaleY=r.screen[1]/r.canvasRect.height;
    const expectedCenterY=lower?((r.topBottom+lower.y)/2-r.canvasRect.y)*scaleY:null;
    return{at:r.at,cardOpen:r.cardOpen,expectedCenterY,positions:r.layers.map(l=>l.position),
      errorsY:expectedCenterY===null?[]:r.layers.map(l=>l.position[1]-expectedCenterY)};});
  const transientFormula=shifted.filter(r=>(r.planetside??r.dock)!==null).map(r=>{
    const lower=r.planetside??r.dock,scaleY=r.screen[1]/r.canvasRect.height;
    const rawRectCenterY=((r.topBottom+lower.y)/2-r.canvasRect.y)*scaleY;
    const baselineRectCenterY=((r.topBottom+lower.y)/2-first.canvasRect.y)*scaleY;
    return{at:r.at,canvasDeltaY:r.canvasRect.y-first.canvasRect.y,rawRectCenterY,baselineRectCenterY,
      rawMinusBaseline:rawRectCenterY-baselineRectCenterY,observedLayerY:r.layers.map(l=>l.position[1])};
  });
  return{available:true,frameCount:rows.length,observedActiveImpulse:activeIndex>=0,observedTranslatedCanvas:shifted.length>0,
    observedEndAfterImpulse:ended.length>0,restingPairSamples:bands,transientFormula,
    limitation:activeIndex<0||shifted.length===0||ended.length===0?'Native transient motion was not fully observed within the passive bound; no replay was attempted.':null};
};
let browser, send, evaluate, pageSession, assetUrl, pageDocumentToken = null, pageAuthorityLosses = null, deadline = Infinity;
const assetRequests = new Set(), interceptionJobs = new Set();
const guard = () => {
  assert(Date.now() < deadline, '90-second native-work deadline exceeded');
  assert.equal(report.errors.length, 0, 'Runtime exception observed');
  assert.equal(report.interceptionErrors.length, 0, 'Asset interception failed');
};
persist();
try {
  for (const name of sourceNames) report.sources[name] = hash(fs.readFileSync(path.join(repo, name)));
  persist();
  const assets = fs.readdirSync(path.join(dist, 'assets')).filter(name => /^earth-civet-landing-v1[^/]*\.webp$/u.test(name));
  assert.equal(assets.length, 1, 'Expected one built Earth WebP');
  const assetPath = path.join('assets', assets[0]);
  const assetBytes = fs.readFileSync(path.join(dist, assetPath));
  assert.equal(assetBytes.length, expectedAssetBytes, 'Built still exact byte contract changed');
  const assetDigest = hash(assetBytes);
  assert.equal(assetDigest, report.sources['port/v2/apps/game/src/assets/painted/earth-civet-landing-v1.webp'], 'Built still bytes differ from owned asset');
  assert.notEqual(assetDigest, report.wrongAsset.sha256, 'Wrong-asset control is vacuous');
  report.asset = { path: assetPath, bytes: assetBytes.length, sha256: assetDigest,
    width: 960, height: 430, rgba8BytesPerBacking: 960 * 430 * 4,
    limitation: 'RGBA8 arithmetic per canvas/texture backing; browser decoder, driver allocation and peak residency are not measured here.' };
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  report.origin = `http://127.0.0.1:${server.address().port}`;
  assetUrl = report.origin + '/' + assetPath.split(path.sep).join('/'); report.asset.url = assetUrl; persist();
  browser = await openChromiumCdp({ label: 'native static Earth landing ' + mode,
    userDataPrefix: 'cf-earth-still-v2-' + mode + '-20260908', commandTimeoutMs: 15000,
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
          report.intercepted.push({ requestId: p.requestId, networkId: p.networkId, url: p.request.url, status: 200, bytes: wrongAssetBytes.length, sha256: report.wrongAsset.sha256 });
          assert.equal(report.intercepted.length, 1, 'Earth asset was retried');
          await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [
            { name: 'Content-Type', value: 'image/webp' }, { name: 'Content-Length', value: String(wrongAssetBytes.length) },
            { name: 'Cache-Control', value: 'no-store' }], body: wrongAssetBytes.toString('base64') });
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
  await browser.send('Target.activateTarget', { targetId });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.bringToFront');
  report.pageOwner = { targetId, sessionId: pageSession, activated: true, focusEmulation: true }; persist();
  await send('Network.setBypassServiceWorker', { bypass: true });
  if (blocked) await send('Fetch.enable', { patterns: [{ urlPattern: assetUrl, requestStage: 'Request' }] });
  evaluate = async expression => {
    report.pendingEvaluation = { expression, sha256: hash(expression), at: new Date().toISOString() }; persist();
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    report.pendingEvaluation = null; return result.result.value;
  };
  const frames = async () => {
    guard();
    const proof = await evaluate(`new Promise(resolve=>{
      const take=()=>({at:performance.now(),documentToken:${S}?.documentToken??null,
        visibility:document.visibilityState,focused:document.hasFocus(),losses:window.__cfEarthFrameLosses??null});
      const rows=[take()];requestAnimationFrame(()=>{rows.push(take());requestAnimationFrame(()=>{
        rows.push(take());setTimeout(()=>{rows.push(take());resolve(rows)},0)
      })})
    })`);
    report.frameServices.push({targetId,sessionId:pageSession,rows:proof});persist();
    assert(Array.isArray(proof)&&proof.length===4,'Missing bound frame/task service');
    const token=proof[0].documentToken;
    assert(typeof token==='string'&&token.length>0,'Frame service has no document identity');
    if(pageDocumentToken===null)pageDocumentToken=token;
    assert.equal(token,pageDocumentToken,'Native observer document was replaced');
    if(pageAuthorityLosses===null)pageAuthorityLosses=proof[0].losses;
    assert.equal(proof[0].losses,pageAuthorityLosses,'Page authority was lost between native observations');
    for(const row of proof){
      assert.equal(row.documentToken,token);assert.equal(row.visibility,'visible');assert.equal(row.focused,true);
      assert(Number.isSafeInteger(row.losses)&&row.losses>=0);assert.equal(row.losses,proof[0].losses,'Page lost authority during frame service');
      assert(Number.isFinite(row.at));
    }
    assert(proof[1].at>=proof[0].at&&proof[2].at>proof[1].at&&proof[3].at>=proof[2].at,'Frame/task order invalid');
    guard();return proof;
  };
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
  await send('Page.addScriptToEvaluateOnNewDocument', { source:`window.__cfEarthFrameLosses=0;document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')window.__cfEarthFrameLosses++});window.addEventListener('blur',()=>{window.__cfEarthFrameLosses++});window.__cfEarthLayersInputs=[];for(const type of ['click','contextmenu','keydown'])document.addEventListener(type,e=>{if(window.__cfEarthLayersInputs.length<120)window.__cfEarthLayersInputs.push({type,trusted:e.isTrusted,act:e.target.closest?.('[data-act]')?.dataset.act,sel:e.target.closest?.('[data-sel]')?.dataset.sel,key:e.key,x:e.clientX,y:e.clientY,at:performance.now()})},true)` });
  const native = async (point, button='left') => {
    guard(); await frames(); const count=await evaluate('window.__cfEarthLayersInputs.length');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point,button:'none'});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button,buttons:button==='right'?2:1,clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button,buttons:0,clickCount:1});
    await frames();
    assert(await evaluate(`window.__cfEarthLayersInputs.slice(${count}).some(e=>e.trusted&&e.type===${JSON.stringify(button==='right'?'contextmenu':'click')})`),'Native input receipt missing');
    report.steps.push({name:'native input',point,button}); persist();
  };
  const click = async selector => {
    const point=await evaluate(`(async()=>{const a=document.querySelectorAll(${JSON.stringify(selector)});if(a.length!==1)throw Error('Nonunique control '+${JSON.stringify(selector)});const e=a[0];e.scrollIntoView({block:'center'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||b.width<=0||b.height<=0||!(h===e||e.contains(h)))throw Error('Control occluded '+${JSON.stringify(selector)});return{x,y}})()`);
    await native(point);
  };
  const landingCta = `(()=>{const a=[...document.querySelectorAll('[data-act=landcta]')];if(a.length!==1)return null;const e=a[0],r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{world:e.getAttribute('data-landing-world'),success:Number(e.getAttribute('data-landing-success')),label:e.textContent.trim(),enabled:!e.disabled&&!e.closest('[inert]'),hit:hit===e||e.contains(hit),width:r.width,height:r.height}})()`;
  const idleLanding = s => {
    const c=s.landing?.actionCoordinator;
    assert(c&&!c.inFlight&&!c.owner.busy&&c.owner.operation===null,'Landing action did not retire');
    assert.equal(c.hold.phase,'idle');assert.equal(c.lastFault,null);
    assert.deepEqual(c.faultArmed,{storageFailure:false,staleAuthority:false,publicationFailure:false});
  };
  const landCheckpoint = async name => {
    const raw=await evaluate(ARC4_DURABLE_READ_EXPRESSION),state=await evaluate(snapshot);
    const item={name,raw,state,cta:await evaluate(landingCta)};
    report.steps.push(item);persist(); // Keep complete read-only rows before interpreting the witness.
    const runtime=state.persistence.runtime,rng=raw.authority.sessionRng;
    assert.equal(state.documentToken,state.persistence.documentToken);idleLanding(state);
    assert.equal(raw.revision,runtime.revision);
    assert.deepEqual(rng,{seed:runtime.sessionSeed,ordinal:runtime.sessionOrdinal,draws:runtime.sessionDraws});
    assert.deepEqual(JSON.parse(raw.authorityJson),raw.authority);
    assert.equal(raw.playerRow.extensions['f4.authority'].json,raw.authorityJson);
    assert.equal(raw.legacy.hp,raw.playerRow.data.hp);assert.equal(Number(state.hp.value),raw.legacy.hp);
    assert.equal(state.hp.text,`${raw.legacy.hp}/100`);
    return item;
  };
  const landReceipt = (before,after) => {
    assert.equal(after.state.documentToken,before.state.documentToken,'Landing replaced the document');
    assert.equal(after.raw.revision,before.raw.revision+1,'Land was not one exact durable commit');
    const br=before.raw.authority.sessionRng,ar=after.raw.authority.sessionRng,key=`receipt:${br.ordinal}`;
    assert.equal(ar.seed,br.seed,'Landing changed the session RNG seed');
    assert.equal(after.raw.receiptKeys.length,before.raw.receiptKeys.length+1);
    assert.equal(new Set(after.raw.receiptKeys).size,after.raw.receiptKeys.length);
    assert(!before.raw.receiptKeys.includes(key),'Predecessor already contained the Land receipt');
    for(let i=0;i<before.raw.receiptKeys.length;i++){
      const j=after.raw.receiptKeys.indexOf(before.raw.receiptKeys[i]);assert(j>=0);
      assert.equal(after.raw.receiptRawRows[j],before.raw.receiptRawRows[i],'Prior receipt changed');
    }
    const index=after.raw.receiptKeys.indexOf(key);assert(index>=0,'Exact Land receipt missing');
    const receipt=JSON.parse(after.raw.receiptRawRows[index]);
    assert.deepEqual(receipt,after.raw.receiptRows[index]);assert.equal(receipt.kind,'arc0-land');
    assert.equal(receipt.ordinal,br.ordinal);
    const facts=JSON.parse(receipt.witness),d=facts.descent;
    after.receipt={key,receipt,facts};persist();
    assert.equal(facts.schema,'cf-v2-arc0-landing-witness/v1');
    assert.equal(facts.worldKey,address);assert.equal(facts.planetSeed,133);assert.equal(facts.planetOrdinal,2);
    assert.equal(facts.receiptOrdinal,br.ordinal);assert.equal(facts.training,false);
    assert.equal(d.kind,'landed','Canonical safe Earth cannot wave off');
    // Landing uses biomeFor, which deliberately returns null for Earth.
    // The separate canonical presentation profile remains temperate below.
    assert.equal(d.policy.key,address);assert.equal(d.policy.planetType,'terran');assert.equal(d.policy.biomeKey,null);
    assert.equal(d.policy.safeReason,'earth');assert.equal(d.policy.successPercent,100);assert.equal(before.cta.success,100);
    assert.equal(d.policy.stormActive,facts.descentWeather!==null);
    assert.deepEqual(d.policy.requiredDomains,[]);assert.equal(d.drawsConsumed,0);assert.equal(ar.ordinal,br.ordinal+1);
    assert.deepEqual(ar.draws,br.draws,'Safe Earth Land consumed random draws');
    assert.equal(after.state.persistence.lastOutcome,`arc0-land-committed:${after.raw.revision}`);
    assert.equal(after.state.landing.lastOutcome,`committed:${after.raw.revision}`);
    assert.equal(d.hpBefore,before.raw.legacy.hp);assert.equal(d.hpAfter,after.raw.legacy.hp);
    assert.equal(d.hpAfter,d.hpBefore-d.damage);assert(d.hpAfter>=1);
    const presses=after.state.inputs.slice(before.state.inputs.length).filter(e=>e.type==='click'&&e.act==='landcta');
    assert.equal(presses.length,1);assert.equal(presses[0].trusted,true,'Land did not come from native input');
    return facts;
  };
  const nativeLandAttempt = async (before,name) => {
    assert.equal(before.state.mode,'system');assert.equal(before.cta?.world,address);
    assert(before.cta.enabled&&before.cta.hit&&before.cta.width>0&&before.cta.height>=44);
    await click('[data-act=landcta]');
    await wait(name+' durable idle settlement',`${ready}&&${S}.api.state().persistence.runtime.revision>${before.raw.revision}&&!${S}.api.state().landing.actionCoordinator.inFlight`);
    const after=await landCheckpoint(name);return{after,facts:landReceipt(before,after)};
  };
  const landEarth = async () => {
    const before=await landCheckpoint('Earth Land predecessor');
    const result=await nativeLandAttempt(before,'Earth single native Land');
    assert.equal(result.facts.descent.kind,'landed','No further Land is permitted');
    assert.equal(result.facts.descent.navigation,'surface');assert.equal(result.facts.descent.persistenceOutcome,'success');
    assert.equal(result.facts.descent.waveOffCountAfter,0);assert.equal(result.facts.descent.damage,0);
    assert.equal(result.after.raw.legacy.hp,before.raw.legacy.hp);
    assert.equal(result.after.state.mode,'surface');assert.equal(result.after.state.navWorldKey,address);
    assert.equal(result.after.state.renderedScene.worldKey,address);
  };
  const escape = async () => {
    const count=await evaluate('window.__cfEarthLayersInputs.length');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await frames();
    assert(await evaluate(`window.__cfEarthLayersInputs.slice(${count}).some(e=>e.trusted&&e.type==='keydown'&&e.key==='Escape')`));
  };
  const shot = async name => {
    guard(); const {data}=await send('Page.captureScreenshot',{format:'png'}), bytes=Buffer.from(data,'base64');
    fs.writeFileSync(path.join(out,name+'.png'),bytes,{flag:'wx'});
    assert(bytes.length>24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Native screenshot is not PNG');
    report.screenshots.push({path:name+'.png',bytes:bytes.length,sha256:hash(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),
      method:'Page.captureScreenshot PNG of bound native viewport after frame/task service'}); persist();
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

  const checkVista = async name => {
    const state=await evaluate(snapshot),r=state.resources;
    report.steps.push({name,state});persist();
    assert.equal(state.mode,'surface');assert.equal(state.navWorldKey,address);
    assert.deepEqual([state.gal,state.star,state.planet,state.planetOrdinal],[999,424242,133,2]);
    assert.deepEqual([state.galX,state.galY,state.starX,state.starY],[90,-60,560,170]);
    assert.equal(state.renderedScene.worldKey,address);assert.equal(state.renderedScene.mode,'surface');
    assert.deepEqual(state.viewport,dimensions.slice(0,3));assert(state.worldVisible);
    assert(r.surfaceVistaMounted&&!r.surfaceVistaWorkerActive);
    assert.equal(r.surfaceVistaArtVariant,painted?variant:'canonical-v1');
    assert.equal(r.surfaceVistaLastBiome,'temperate');
    assert.equal(r.surfaceVistaEnvironmentFingerprint,'cwe1:148:50c1b7d6');
    assert.deepEqual(state.rosterDom,{state:'ready',total:19,preview:canonicalEarth.roster.view.preview.length,
      fingerprint:canonicalEarth.roster.fullRosterFingerprint,ecologyEpoch:canonicalEarth.roster.ecologyEpoch},'Native canonical roster count/fingerprint changed');
    assert.equal(r.surfaceVistaCacheEntries,painted?0:1);assert.equal(r.surfaceVistaCachePixels,painted?0:960*430);
    assert.equal(r.surfaceVistaWorkerStarts,painted?0:1);assert.equal(r.surfaceVistaFaults,blocked?1:0);
    assert.equal(r.surfaceVistaStaleDrops,0);
    assert.equal(r.surfaceEarthResidentLayer,false);assert.equal(r.surfaceEarthLayeredCanvasCount,painted?1:0);
    assert.equal(r.surfaceEarthLayeredLoad,null);
    const loader=r.surfacePaintedVista;
    if(mode==='default')assert.equal(loader,null);
    else{
      assert.equal(loader?.status,blocked?'failed':'ready');assert.equal(loader.fetchStarts,1);
      assert(!loader.decodePending&&loader.aborted);assert.equal(loader.canvasPixels,0);
      if(blocked)assert.equal(loader.error,'painted vista SHA-256 mismatch');else assert.equal(loader.error,null);
    }
    assert.equal(r.surfacePaintedVistaLast,null);
    assert.equal(r.surfacePaintedComposition,painted);
    if(!blocked)assert.equal(r.surfaceVistaLastError,null);
    assert.equal(r.surfacePlanetTurn,null);assert.equal(r.surfacePlanetTurnPending,false);
    checkRegistry(r.registry);
    const composition=await evaluate(compositionState);
    report.steps.push({name:name+' actual composition',composition});persist();
    acceptComposition(composition);return state;
  };
  const capturePaint = async name => {
    let firstFailure=null;
    try{
      const control=await evaluate(`(()=>{
        const s=${S},r=s.app.renderer,layers=${actualLayers},globe=${actualGlobe},cloud=${actualCloud};
        const q={layers:layers.map(m=>({sprite:m,texture:m.texture,source:m.texture.source,canvas:m.texture.source.resource,
          parent:m.parent,index:m.parent.getChildIndex(m),visible:m.visible,x:m.x,y:m.y})),globe,globeVisible:globe.visible,cloud,cloudVisible:cloud.visible,
          started:s.app.ticker.started,frame:s.app.screen.clone(),resolution:r.resolution,wasGroup:s.app.stage.isRenderGroup};
        window.__cfEarthLayersProbe=q;s.app.ticker.stop();
        q.restore=()=>{const errors=[],attempt=f=>{try{f()}catch(e){errors.push(String(e))}};
          for(const a of q.layers)attempt(()=>{a.sprite.visible=a.visible;a.sprite.position.set(a.x,a.y)});
          attempt(()=>{globe.visible=q.globeVisible;cloud.visible=q.cloudVisible});attempt(()=>{r.render(s.app.stage)});
          attempt(()=>{if(q.started)s.app.ticker.start();else s.app.ticker.stop()});
          return{errors,visible:q.layers.every(a=>a.sprite.visible===a.visible&&a.sprite.x===a.x&&a.sprite.y===a.y),globeVisible:globe.visible,cloudRestored:cloud.visible===q.cloudVisible,
            originalGlobe:q.globeVisible,tickerStarted:s.app.ticker.started,originalTicker:q.started}};
        const shape=()=>JSON.stringify(layers.map(m=>({position:[m.x,m.y],scale:[m.scale.x,m.scale.y],rotation:m.rotation,alpha:m.alpha,
          world:[m.worldTransform.a,m.worldTransform.b,m.worldTransform.c,m.worldTransform.d,m.worldTransform.tx,m.worldTransform.ty]})));
        const pools=()=>({programs:Object.keys(r.shader?._programDataHash??{}).sort(),
          global:r.globalUniforms?[...new Set([...r.globalUniforms._activeUniforms,...r.globalUniforms._uniformsPool].map(u=>u.uid))].sort((a,b)=>a-b):[]});
        const sample=()=>{r.render(s.app.stage);const pixels=r.extract.pixels({target:s.app.stage,frame:q.frame,resolution:q.resolution});r.render(s.app.stage);return pixels};
        const diff=(a,b)=>{if(a.width!==b.width||a.height!==b.height||a.pixels.length!==b.pixels.length||a.pixels.length!==a.width*a.height*4)throw Error('Pixel frame changed');
          let changedPixels=0,nontransparent=0;let ah=2166136261,bh=2166136261;
          for(let i=0;i<a.pixels.length;i+=4){let changed=false;if(a.pixels[i+3])nontransparent++;
            for(let c=0;c<4;c++){ah=Math.imul(ah^a.pixels[i+c],16777619);bh=Math.imul(bh^b.pixels[i+c],16777619);if(a.pixels[i+c]!==b.pixels[i+c])changed=true}if(changed)changedPixels++}
          return{width:a.width,height:a.height,changedPixels,nontransparent,baselineHash:(ah>>>0).toString(16),sampleHash:(bh>>>0).toString(16)}};
        const inspect=()=>${compositionState};
        // Warm all visibility variants before measuring renderer pools and exact restoration.
        sample();for(const m of layers){m.visible=false;sample();m.visible=true;sample()}
        if(${painted}){
          globe.visible=true;sample();globe.visible=q.globeVisible;sample();
          cloud.visible=true;sample();cloud.visible=q.cloudVisible;sample();
          for(const m of layers)m.y=s.app.screen.height/2;sample();
          for(const a of q.layers)a.sprite.position.set(a.x,a.y);sample();
        }
        q.shape=shape();q.pools=JSON.stringify(pools());q.registry=JSON.stringify(s.api.sceneResourceDiagnostics().registry);
        const composition=inspect(),baseline=sample(),repeat=sample(),layerControls=[];
        for(const m of layers){
          m.visible=false;const hidden=sample(),forcedComposition=inspect();
          m.visible=true;const restored=sample(),restoredComposition=inspect();
          layerControls.push({label:m.label,hidden:diff(baseline,hidden),restored:diff(baseline,restored),forcedComposition,restoredComposition,
            controlsUnchanged:JSON.stringify(composition.controls)===JSON.stringify(forcedComposition.controls)
              &&JSON.stringify(composition.controls)===JSON.stringify(restoredComposition.controls)});
        }
        let globeControl=null;
        if(${painted}){
          globe.visible=true;const forced=sample(),forcedComposition=inspect();
          globe.visible=q.globeVisible;const restored=sample(),restoredComposition=inspect();
          globeControl={forcedOn:diff(baseline,forced),restored:diff(baseline,restored),forcedComposition,restoredComposition,
            controlsUnchanged:JSON.stringify(composition.controls)===JSON.stringify(forcedComposition.controls)
              &&JSON.stringify(composition.controls)===JSON.stringify(restoredComposition.controls)};
        }
        let cloudControl=null,legacyPlacementControl=null;
        if(${painted}){
          cloud.visible=true;const forcedCloud=sample(),forcedCloudComposition=inspect();
          cloud.visible=q.cloudVisible;const restoredCloud=sample(),restoredCloudComposition=inspect();
          cloudControl={forcedOn:diff(baseline,forcedCloud),restored:diff(baseline,restoredCloud),
            forcedComposition:forcedCloudComposition,restoredComposition:restoredCloudComposition,
            controlsUnchanged:JSON.stringify(composition.controls)===JSON.stringify(forcedCloudComposition.controls)
              &&JSON.stringify(composition.controls)===JSON.stringify(restoredCloudComposition.controls)};
          for(const m of layers)m.y=s.app.screen.height/2;
          const legacy=sample(),forcedComposition=inspect();
          for(const a of q.layers)a.sprite.position.set(a.x,a.y);
          const restored=sample(),restoredComposition=inspect();
          legacyPlacementControl={centerY:s.app.screen.height/2,moved:diff(baseline,legacy),restored:diff(baseline,restored),
            forcedComposition,restoredComposition,
            controlsUnchanged:JSON.stringify(composition.controls)===JSON.stringify(forcedComposition.controls)
              &&JSON.stringify(composition.controls)===JSON.stringify(restoredComposition.controls)};
        }
        const alpha=canvas=>{
          const bytes=canvas.getContext('2d').getImageData(0,0,960,430).data;
          let nontransparent=0,opaque=0,partial=0,sky=0,corners=0,h=2166136261;
          const thirds=[0,0,0],bounds={minX:960,minY:430,maxX:-1,maxY:-1};
          for(let y=0;y<430;y++)for(let x=0;x<960;x++){
            const a=bytes[(y*960+x)*4+3];h=Math.imul(h^a,16777619);if(a){nontransparent++;
              if(a===255)opaque++;else partial++;if(y<64)sky++;
              if((x<16||x>=944)&&(y<16||y>=414))corners++;
              thirds[Math.floor(x/320)]++;bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);
              bounds.minY=Math.min(bounds.minY,y);bounds.maxY=Math.max(bounds.maxY,y);
            }
          }
          return{width:canvas.width,height:canvas.height,nontransparent,opaque,partial,sky,corners,thirds,bounds,alphaHash:(h>>>0).toString(16)};
        };
        const canvasAlpha=q.layers.map(a=>({label:a.sprite.label,...alpha(a.canvas)}));
        const identities={layers:q.layers.every(a=>a.sprite.texture===a.texture&&a.sprite.texture.source===a.source
          &&a.sprite.texture.source.resource===a.canvas&&a.sprite.parent===a.parent&&a.parent.getChildIndex(a.sprite)===a.index&&a.sprite.visible===a.visible),
          shape:shape()===q.shape,pools:JSON.stringify(pools())===q.pools,registry:JSON.stringify(s.api.sceneResourceDiagnostics().registry)===q.registry,
          frame:s.app.screen.width===q.frame.width&&s.app.screen.height===q.frame.height&&r.resolution===q.resolution,
          stageRenderGroup:s.app.stage.isRenderGroup===q.wasGroup,cloud:cloud===q.cloud&&cloud.visible===q.cloudVisible};
        return{method:'Each actual layer independently visible/hidden/restored in one full-stage frame with paused ticker; real source alpha read separately',
          noOp:diff(baseline,repeat),frame:{x:q.frame.x,y:q.frame.y,width:q.frame.width,height:q.frame.height,resolution:q.resolution},
          layerControls,canvasAlpha,identities,pools:pools(),composition,globeControl,cloudControl,legacyPlacementControl,tickerStopped:!s.app.ticker.started};
      })()`);
      report.steps.push({name:name+' actual paint controls',control});persist();acceptComposition(control.composition);
      const visibleDelta=sample=>assert(sample.changedPixels>0&&sample.nontransparent>0,'Layer has no visible scene paint');
      assert.deepEqual([control.frame.x,control.frame.y,control.frame.width,control.frame.height],[0,0,...dimensions.slice(0,2)]);
      assert(Number.isFinite(control.frame.resolution)&&control.frame.resolution>0);
      assert.equal(control.noOp.width,Math.round(control.frame.width*control.frame.resolution));
      assert.equal(control.noOp.height,Math.round(control.frame.height*control.frame.resolution));
      assert.equal(control.noOp.changedPixels,0);assert.throws(()=>visibleDelta(control.noOp),'No-op escaped paint acceptor');
      for(const layer of control.layerControls){
        visibleDelta(layer.hidden);assert.equal(layer.restored.changedPixels,0);
        assert.throws(()=>acceptComposition(layer.forcedComposition),'Hidden actual layer escaped composition acceptor');
        acceptComposition(layer.restoredComposition);assert(layer.controlsUnchanged,'Layer mutant moved or occluded a control');
      }
      if(painted){
        assert.equal(control.layerControls.length,1);assert(control.globeControl,'Missing globe mutant');
        assert.throws(()=>acceptComposition(control.globeControl.forcedComposition),'Forced-on globe escaped composition acceptor');
        acceptComposition(control.globeControl.restoredComposition);visibleDelta(control.globeControl.forcedOn);
        assert.equal(control.globeControl.restored.changedPixels,0);assert(control.globeControl.controlsUnchanged);
        assert(control.cloudControl,'Missing actual cloud-deck mutant');
        assert.throws(()=>acceptComposition(control.cloudControl.forcedComposition),'Forced-on cloud escaped composition acceptor');
        acceptComposition(control.cloudControl.restoredComposition);visibleDelta(control.cloudControl.forcedOn);
        assert.equal(control.cloudControl.restored.changedPixels,0);assert(control.cloudControl.controlsUnchanged);
        const legacy=control.legacyPlacementControl;assert(legacy,'Missing actual legacy-placement mutant');
        assert.equal(legacy.centerY,dimensions[1]/2);
        assert.throws(()=>acceptComposition(legacy.forcedComposition),'Legacy H/2 placement escaped composition acceptor');
        acceptComposition(legacy.restoredComposition);visibleDelta(legacy.moved);
        assert.equal(legacy.restored.changedPixels,0);assert(legacy.controlsUnchanged,'Legacy placement moved a DOM control');
        if(mode==='phone'){
          assert(legacy.forcedComposition.dom.overlaps.some(r=>r.key==='planetside'),'Legacy phone mutant did not reproduce Biosphere overlap');
          assert(legacy.forcedComposition.dom.points.some(p=>!p.canvas),'Legacy phone mutant lacked actual DOM occlusion');
        }
        assert.equal(control.canvasAlpha.length,1);
        const still=control.canvasAlpha[0];
        assert.equal(still.label,'earth-painted-landing-still');
        assert.equal(still.opaque,960*430,'Still is not one full opaque painting');
        assert.equal(still.partial,0);assert.equal(still.nontransparent,960*430);
      }else assert(control.canvasAlpha[0].nontransparent>0);
      assert(control.tickerStopped&&Object.values(control.identities).every(value=>value===true),'Paint probe changed owners, pools or frame');
      report.steps.push({name:name+' same acceptors reject hidden layers, visible globe/cloud, legacy placement and no-op',sameAcceptor:true});persist();
      await frames(); // Let the actual restored canvas reach the native compositor while Pixi remains paused.
      await shot(name);
    }catch(error){firstFailure=error;report.paintFailure=String(error.stack??error);throw error}
    finally{
      try{
        const restored=await evaluate(`(()=>{const q=window.__cfEarthLayersProbe;if(!q)return{errors:[]};if(!q.restore)return{errors:['Restoration unavailable']};const result=q.restore();delete window.__cfEarthLayersProbe;return result})()`);
        report.steps.push({name:name+' probe restoration',restored});persist();assert.deepEqual(restored.errors,[]);
        if('visible'in restored)assert(restored.visible&&restored.cloudRestored&&restored.globeVisible===restored.originalGlobe&&restored.tickerStarted===restored.originalTicker);
      }catch(error){report.restorationErrors??=[];report.restorationErrors.push(String(error));persist();if(!firstFailure)throw error}
    }
  };
  const exitEarth = async () => {
    await evaluate(`(()=>{const layers=${actualLayers},r=${resources},cloud=${actualCloud};window.__cfEarthLayersRetired={cloud:{container:cloud,parent:cloud.parent,children:[...cloud.children]},layers:layers.map(m=>({sprite:m,texture:m.texture,source:m.texture.source,
      canvas:m.texture.source.resource,parent:m.parent})),scope:r.registry.activeScopes.find(x=>x.label.startsWith('scene:')),loader:r.surfacePaintedVista};return true})()`);
    if(mode==='desktop')await escape();
    else{
      await click('#docksurvey');await wait('Survey Leave world available',`${S}.api.state().cardOpen&&document.querySelector('[data-act=leaveworld]')&&${ready}`);
      await click('[data-act=leaveworld]');
    }
    await wait('native Earth exit',`${S}.api.state().mode==='system'&&!${resources}.surfaceVistaMounted&&${ready}`);
    const retired=await evaluate(`(()=>{const p=window.__cfEarthLayersRetired,r=${resources};return{layers:p.layers.map(a=>({spriteDestroyed:a.sprite.destroyed,parentNull:a.sprite.parent===null,
      textureDestroyed:a.texture.destroyed,sourceDestroyed:a.source.destroyed,canvasSize:[a.canvas.width,a.canvas.height],oldParentDetached:!a.parent.children.includes(a.sprite)})),
      oldScopeAbsent:!!p.scope&&!r.registry.activeScopes.some(x=>x.label===p.scope.label),
      cloud:{containerDestroyed:p.cloud.container.destroyed,parentNull:p.cloud.container.parent===null,
        oldParentDetached:!p.cloud.parent.children.includes(p.cloud.container),childrenCount:p.cloud.children.length,
        childrenDestroyed:p.cloud.children.every(c=>c.destroyed&&c.parent===null)},loaderBefore:p.loader,resources:r}})()`);
    report.steps.push({name:'actual Earth resource retirement',retired});persist();
    assert.equal(retired.layers.length,1);assert(retired.oldScopeAbsent);
    assert(retired.cloud.containerDestroyed&&retired.cloud.parentNull&&retired.cloud.oldParentDetached
      &&retired.cloud.childrenCount>0&&retired.cloud.childrenDestroyed,'Actual old cloud container did not retire');
    for(const layer of retired.layers){
      assert(layer.spriteDestroyed&&layer.parentNull&&layer.textureDestroyed&&layer.sourceDestroyed&&layer.oldParentDetached);
      assert.deepEqual(layer.canvasSize,painted?[1,1]:[960,430]);
    }
    const r=retired.resources;
    assert(!r.surfaceVistaMounted&&!r.surfaceVistaWorkerActive&&!r.surfaceEarthResidentLayer);
    assert.equal(r.surfaceEarthLayeredCanvasCount,0);assert.equal(r.surfaceVistaArtVariant,null);assert.equal(r.surfaceVistaEnvironmentFingerprint,null);
    assert.equal(r.surfaceVistaCacheEntries,painted?0:1);assert.equal(r.surfaceVistaCachePixels,painted?0:960*430);
    assert.equal(r.surfacePaintedComposition,false);assert.equal(r.surfacePaintedVista,null);
    assert.equal(r.surfaceEarthLayeredLoad,null);
    if(mode==='default')assert.equal(r.surfacePaintedVistaLast,null);
    else{
      const loader=r.surfacePaintedVistaLast;assert.equal(loader?.status,'disposed');assert.equal(loader.fetchStarts,1);
      assert(!loader.decodePending&&loader.aborted);assert.equal(loader.canvasPixels,0);
      if(blocked)assert.equal(loader.error,'painted vista SHA-256 mismatch');else assert.equal(loader.error,null);
    }
    assert.equal(r.surfaceVistaFaults,blocked?1:0);assert.equal(r.surfaceVistaWorkerStarts,painted?0:1);
    checkRegistry(r.registry);await evaluate('delete window.__cfEarthLayersRetired;true');
  };
  await viewport(...dimensions);
  await send('Page.navigate', { url: report.origin + (mode==='default'?'/':'/?paintedlanding=1') });
  await wait('first answerable document', `${S}?.api&&${ready}`);
  await frames();
  if (await evaluate(`${S}.api.state().tutActive`)) {
    await click('[data-sel=tutskip]'); await wait('native Training Skip', `!${S}.api.state().tutActive&&${ready}`);
  }
  await wait('canonical Sol system', `${S}.api.state().mode==='system'&&${S}.api.state().gal===999&&${S}.api.state().star===424242&&${ready}`);
  await wait('system camera settled', `Math.abs(${S}.cam.z-${S}.camT.z)<.001`);
  await wait('distinct rendered Earth and Mars positions', `(()=>{const p=${S}.api.planetScreenTarget({seed:134,ordinal:3}),e=${S}.api.planetScreenTarget({seed:133,ordinal:2});return p&&e&&p.width>0&&Math.hypot(p.screenX-e.screenX,p.screenY-e.screenY)>8})()`);
  const target = await evaluate(`(()=>{const p=${S}.api.planetScreenTarget({seed:133,ordinal:2});if(!p||document.elementFromPoint(p.screenX,p.screenY)!==${S}.app.canvas)throw Error('Exact Earth target unavailable or occluded');return{x:p.screenX,y:p.screenY}})()`);
  await native(target);
  await wait('exact Earth Survey', `document.querySelector('[data-act=landcta]')?.getAttribute('data-landing-world')===${JSON.stringify(address)}&&${ready}`);
  report.steps.push({name:'passive native Land settlement journal begins',journal:await evaluate(startSettlementJournal)});persist();
  await landEarth();
  await wait('selected Earth composition ready', `${S}.api.state().mode==='surface'&&${resources}.surfaceVistaMounted&&${resources}.surfaceVistaArtVariant===${JSON.stringify(painted ? variant : 'canonical-v1')}&&${mode==='default'?`${resources}.surfacePaintedVista===null`:`${resources}.surfacePaintedVista?.status===${JSON.stringify(blocked?'failed':'ready')}`}&&${ready}`);
  await wait('initial native landing impulses finished',`${S}.api.state().activeCameraShakes===0&&${ready}`);
  await frames();
  report.initialSettlementJournal=await evaluate(readSettlementJournal);
  report.initialSettlementSummary=summarizeSettlementJournal(report.initialSettlementJournal);
  report.steps.push({name:'resting Earth before any native Survey Close',composition:await evaluate(compositionState)});persist();
  await click('[data-survey-close]'); await frames();
  await checkVista('initial Earth attachment', true);
  assert(!await evaluate("document.querySelector('[data-cf-audiovisual-pilot]')!==null"), 'avpilot must be absent');
  assert(await evaluate("window.__cfEarthLayersInputs.some(e=>e.trusted&&e.act==='landcta')"));
  assert.equal(assetRequests.size, expectedRequests, 'Unexpected observed page requests for Earth asset');
  if (blocked) {
    await Promise.all(interceptionJobs); assert.equal(report.intercepted.length, 1);
    assert(report.network.some(event => event.method === 'Network.responseReceived' && event.status === 200), 'Same-length wrong-SHA asset response absent');
    assert.equal(report.served[report.asset.path],undefined,'Blocked URL leaked to real server');
  } else if(painted) {
    assert.equal(report.intercepted.length, 0);
    assert(report.network.some(event => event.method === 'Network.responseReceived' && event.status === 200), 'Actual Earth asset response absent');
    assert.equal(report.served[report.asset.path], report.asset.sha256);
  } else { assert.equal(report.intercepted.length,0);assert.deepEqual(report.network,[]); }
  await capturePaint('earth-landing-still-' + mode);
  await click('#docksurvey');
  await wait('native Survey reopens on same Earth',`${S}.api.state().cardOpen&&${S}.api.state().navWorldKey===${JSON.stringify(address)}&&document.querySelector('[data-act=leaveworld]')&&${ready}`);
  await click('[data-survey-close]');
  await wait('native Survey Close retains Earth',`!${S}.api.state().cardOpen&&${S}.api.state().navWorldKey===${JSON.stringify(address)}&&${ready}`);
  await checkVista('native Survey reopen and Close');

  await exitEarth(); guard(); assert.equal(assetRequests.size, expectedRequests, 'Asset fetch repeated'); report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.failure = String(error.stack ?? error); process.exitCode = 1;
  const failedEvaluation = report.pendingEvaluation;
  try { report.failureState = await evaluate?.(snapshot); } catch (e) { report.failureStateError = String(e); }
  try { report.failureComposition = await evaluate?.(compositionState); } catch (e) { report.failureCompositionError = String(e); }
  report.failedEvaluation = failedEvaluation;
  try { const shot = await send?.('Page.captureScreenshot', { format: 'png' }); if (shot) { const bytes=Buffer.from(shot.data,'base64');fs.writeFileSync(path.join(out,'failure.png'),bytes,{flag:'wx'});report.screenshots.push({path:'failure.png',bytes:bytes.length,sha256:hash(bytes)}); } }
  catch (e) { report.failureScreenshotError = String(e); }
} finally {
  const cleanup = [];
  try {
    report.settlementJournal=await evaluate?.(stopSettlementJournal);
    report.settlementSummary=summarizeSettlementJournal(report.settlementJournal);
    if(report.settlementSummary.limitation)report.limitations.push(report.settlementSummary.limitation);
    if(report.settlementJournal?.errors.length)cleanup.push('Passive settlement journal errors: '+JSON.stringify(report.settlementJournal.errors));
    persist();
  } catch(e) { report.settlementJournalCleanupError=String(e);cleanup.push('Settlement journal cleanup: '+String(e)); }
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
