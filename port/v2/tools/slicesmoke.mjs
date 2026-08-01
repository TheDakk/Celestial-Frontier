/* slicesmoke.mjs — the Phase 3 slice in a REAL browser (headless Edge over
   raw CDP, the uilayout.js pattern; zero new dependencies).

   PROVES what vite build cannot: the bundle BOOTS (Pixi WebGL init, the
   verbatim painters bake their canvases, IndexedDB opens), renders the
   painterly universe, and DESCENDS into the Milky Way on a real click —
   with zero console errors or uncaught exceptions. Saves screenshots as
   the visual record (the thing a human judges; a smoke can only prove it
   isn't blank).

   Usage: node tools/slicesmoke.mjs   (builds first if dist/ is missing) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.join(here, '..', 'apps', 'game', 'smoke');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.log('dist missing — building…');
  execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
}
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* ---- tiny static server over dist (vite preview without the dep surface) ---- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try {
    const body = fs.readFileSync(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/';
const server2 = http.createServer(server.listeners('request')[0]);
await new Promise((r) => server2.listen(0, '127.0.0.1', r));
const URL2 = 'http://127.0.0.1:' + server2.address().port + '/';   /* different origin ⇒ fresh IndexedDB ⇒ a NEW expedition */

/* ---- headless Edge + CDP ---- */
const udd = path.join(os.tmpdir(), 'cf-slicesmoke-' + Date.now());
const port = 9333 + (process.pid % 500);
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run',
  /* Edge's bundled component extensions emit "message channel closed"
     uncaught rejections into the page on longer runs — browser noise that
     would fail the zero-error bar for the wrong reason. Suppress the
     components rather than filtering the error text (a filter would also
     hide a REAL app error that happened to match). */
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let browserWs = null;
for (let t = 0; t < 60 && !browserWs; t++) {
  await sleep(400);
  try { const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); browserWs = v.webSocketDebuggerUrl; } catch { /* not up yet */ }
}
if (!browserWs) { console.error('CDP endpoint never came up'); edge.kill(); process.exit(2); }

const ws = new WebSocket(browserWs);
let mid = 0; const pend = new Map();
const events = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  else if (m.method) events.push(m);
};
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++mid; pend.set(id, { res, rej });
  ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
});

const fails = [];
try {
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const sess = at.sessionId;
  await send('Runtime.enable', {}, sess);
  await send('Page.enable', {}, sess);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, sess);
  await send('Page.navigate', { url: URL0 }, sess);
  await sleep(3000);

  const evalIn = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
    if (r.exceptionDetails) throw new Error('page eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };

  /* 1. booted: canvas mounted, HUD says universe */
  const boot = await evalIn(`({ canvas: !!document.querySelector('canvas'), topbar: !!document.getElementById('topbar'), st: window.__CF_SLICE__ ? window.__CF_SLICE__.api.state() : null })`);
  if (!boot.canvas) fails.push('no <canvas> — Pixi never mounted');
  if (!boot.topbar) fails.push('no #topbar — the Phase 4 shell is missing');
  if (!boot.st || boot.st.mode !== 'universe') fails.push('not in universe mode at boot: ' + JSON.stringify(boot.st && boot.st.mode));
  if (boot.st && boot.st.trail !== 'Cosmos') fails.push('trail at boot is not Cosmos: ' + JSON.stringify(boot.st.trail));
  if (boot.st && !(parseFloat(boot.st.topbarH) > 20)) fails.push('--topbar-h not measured: ' + JSON.stringify(boot.st.topbarH));
  if (boot.st && !boot.st.ctx) fails.push('the caption line is empty at boot');
  if (boot.st && !/Make planetfall on 2 worlds of Sol/.test(boot.st.objective)) fails.push('objective chip wrong at fresh boot: ' + JSON.stringify(boot.st.objective));

  /* 1a-training. a FRESH boot TRAINS (the game's new-expedition rule); the
     classic legs run as a veteran — Skip first, the game's own path, and
     skipping must persist. The full six-step drill runs later on its own
     fresh origin. */
  const tut0 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (!tut0.tutActive || tut0.tutStep !== 'welcome') fails.push('a fresh boot did not open Field Training at welcome: ' + JSON.stringify([tut0.tutActive, tut0.tutStep]));
  const tutCardDock = await evalIn(`(()=>{ const c=document.getElementById('tutcard'); const d=document.getElementById('dock');
    if(!c||!d) return null; const cr=c.getBoundingClientRect(), dr=d.getBoundingClientRect();
    return { clear: cr.bottom <= dr.top + 2, tutBot: getComputedStyle(document.documentElement).getPropertyValue('--tut-bot') }; })()`);
  if (!tutCardDock || !tutCardDock.clear) fails.push('the lesson card covers the dock (CF1806-02 family): ' + JSON.stringify(tutCardDock));
  if (!tutCardDock || !/px/.test(tutCardDock.tutBot)) fails.push('--tut-bot not published (CF1805-01 contract): ' + JSON.stringify(tutCardDock && tutCardDock.tutBot));
  await evalIn(`(()=>{ document.querySelector('[data-sel=tutskip]').click(); return 1; })()`);
  await sleep(300);
  const tut1 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (tut1.tutActive || !tut1.tutDone) fails.push('Skip training did not close + mark done: ' + JSON.stringify([tut1.tutActive, tut1.tutDone]));

  /* 1b. THE GOLDEN-LAYOUT GEOMETRY CONTRACT (ui-main-desktop.png positions;
     uilayout.js discipline: measure the REAL boxes, then prove the checker
     can catch a moved element before trusting its pass). */
  const geoCheck = `(()=>{ const W=innerWidth, H=innerHeight;
    const r=(id)=>{ const el=document.getElementById(id); if(!el) return null;
      const b=el.getBoundingClientRect(); return { l:b.left, t:b.top, r:b.right, b:b.bottom, cx:(b.left+b.right)/2, w:b.width, vis: b.width>0&&b.height>0 }; };
    const pc=r('playerchip'), hp=r('hpbar'), pr=r('primechip'), obj=r('objchip'),
      hint=r('hintpill'), ctx=r('ctxbar'), dock=r('dock'), rail=r('raillft'), dcx=r('dockcodex'),
      srch=r('searchbox');
    const bad=[];
    if(!pc || pc.l>80 || pc.t>60) bad.push('playerchip not top-left');
    if(!hp || !pc || hp.t < pc.b-4) bad.push('HP bar not under the player chip');
    if(!srch || !srch.vis || W-srch.r>40 || srch.t>60) bad.push('search bar not top-right');
    if(srch && pc && pc.r > srch.l+4) bad.push('player chip overlaps the search bar');
    if(W>900 && (!pr || Math.abs(pr.cx-W/2)>70 || pr.t>60)) bad.push('Prime Codex pill not top-center');
    if(W<=900 && pr && pr.vis) bad.push('Prime pill should hide on phone (it rides the dock tier in the golden)');
    if(!obj || obj.l>40 || obj.t<H*0.18 || obj.t>H*0.42) bad.push('objective chip not left @~26vh: '+JSON.stringify(obj));
    if(!hint || Math.abs(hint.cx-W/2)>90 || hint.b<H-160) bad.push('hint pill not bottom-center');
    if(ctx && hint && ctx.b>hint.t+6) bad.push('caption not ABOVE the hint pill');
    if(W>900){
      if(!dock || dock.cx<W*0.6) bad.push('desktop cluster not bottom-RIGHT (ROADMAP #11 rail lesson)');
      if(!rail || !rail.vis) bad.push('left rail missing on desktop');
      if(dcx && dcx.vis) bad.push('dock codex should hide on desktop (rail owns it)');
    } else {
      if(!dock || Math.abs(dock.cx-W/2)>60) bad.push('phone dock not bottom-center');
      if(rail && rail.vis) bad.push('left rail should hide on phone');
    }
    return bad; })()`;
  const geo = await evalIn(geoCheck);
  if (geo.length) fails.push('GOLDEN LAYOUT drift: ' + geo.join(' · '));
  /* the self-control: move the objective chip to the right, the checker
     MUST see it (reproduce-the-reported-geometry law), then restore */
  const geoCtl = await evalIn(`(()=>{ const o=document.getElementById('objchip'); o.style.left='900px';
    const bad=${geoCheck}; o.style.left=''; return bad; })()`);
  if (!geoCtl.some((b) => b.includes('objective chip'))) fails.push('GEOMETRY CHECKER CONTROL FAILED — a moved objective chip went unseen');

  /* 2. not blank — via Pixi's extract, which re-renders the stage (a WebGL
     canvas reads BLACK through 2D drawImage without preserveDrawingBuffer;
     the first run failed on exactly that instrument error) */
  const painted = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; if(!S) return -1;
    /* frame-bounded: the stage's LOCAL bounds now span the observable
       universe (~10,700px) — an unframed extract exceeds the max texture
       size and reads back black while the SCREEN is fine (instrument-first:
       the check went red with a healthy build; renderer.screen bounds it) */
    const px=await S.app.renderer.extract.pixels({ target: S.app.stage, frame: S.app.renderer.screen });
    const d=px.pixels||px;
    let lit=0; for(let i=0;i<d.length;i+=4){ if(d[i]+d[i+1]+d[i+2]>60) lit++; } return lit; })()`);
  if (painted === -1) fails.push('__CF_SLICE__ diagnostics handle missing');
  else if (!(painted > 500)) fails.push('stage nearly blank — ' + painted + ' lit pixels (painters did not paint?)');

  const shot1 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-universe.png'), Buffer.from(shot1.data, 'base64'));

  /* 3. SURVEY-FIRST (the game's flow): ONE tap on the Milky Way opens its
     survey card — it must NOT teleport; a quick second tap dives. */
  const cx = 1280 / 2 + 90, cy = 800 / 2 - 60;
  const click = async () => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', clickCount: 1 }, sess);
    }
  };
  await click();
  await sleep(700);
  const st1 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (st1.mode !== 'universe') fails.push('a SINGLE tap descended (survey-first broken): ' + st1.mode);
  if (!st1.cardOpen || !st1.cardTitle) fails.push('single tap did not open the galaxy survey card: ' + JSON.stringify({ open: st1.cardOpen, title: st1.cardTitle }));
  if (typeof st1.epoch !== 'number') fails.push('COSMIC_EPOCH clock not running: ' + JSON.stringify(st1.epoch));
  await click(); await click();   /* the quick double-tap = dive */
  await sleep(2500);   /* per-seed 512px painterly bake + star field */
  const st2 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (st2.mode !== 'galaxy' || st2.gal !== 999) fails.push('double-tap descent into the Milky Way did not happen: ' + JSON.stringify([st2.mode, st2.gal]));
  if (!/Milky Way/.test(st2.trail)) fails.push('galaxy trail missing Milky Way: ' + JSON.stringify(st2.trail));
  if (!/stars sharing/.test(st2.ctx)) fails.push('galaxy caption (galaxyStats) missing: ' + JSON.stringify(st2.ctx));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-galaxy.png'), Buffer.from(shot2.data, 'base64'));

  /* 3a-charter. THE ASCENT GATE, fresh save = stage 0 = SOL ONLY: a non-Sol
     dive must be REFUSED with the charter toast naming the build. This
     doubles as the gate's live negative control — if gating ever breaks,
     this dive succeeds and fails the run. */
  const gated = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    S.api.descendSystem({ seed: 31337, x: 300, y: 300 });
    const st=S.api.state();
    return { mode: st.mode, stage: st.stage, toastOn: st.toastOn, toastText: st.toastText }; })()`);
  if (gated.stage !== 0) fails.push('fresh save is not charter stage 0: ' + JSON.stringify(gated.stage));
  if (gated.mode !== 'galaxy') fails.push('CHARTER GATE BROKEN — a stage-0 save dove into a non-Sol star: ' + gated.mode);
  if (!gated.toastOn || !/Charter/.test(gated.toastText)) fails.push('charter block did not toast the build hint: ' + JSON.stringify(gated.toastText));
  const perf = await evalIn(`window.__CF_SLICE__.api.state().galaxyBuildMs`);
  console.log('  (galaxy rebuild: ' + (typeof perf === 'number' ? perf.toFixed(0) : '?') + 'ms)');

  /* 3b. THE FULL GATE D DESCENT: into Sol, land on EARTH, the survey card speaks */
  const landed = await evalIn(`(()=>{ const S=window.__CF_SLICE__; if(!S||!S.api) return 'no api';
    S.api.descendSystem({ seed: 424242, x: 0, y: 0 });
    return 'ok'; })()`);
  if (landed !== 'ok') fails.push('descendSystem: ' + landed);
  await sleep(1800);   /* eight painterly surfaces bake */
  const stSys = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stSys.mode !== 'system' || stSys.star !== 424242) fails.push('Sol descent failed: ' + JSON.stringify([stSys.mode, stSys.star]));
  if (!stSys.trail.includes('Sun (Sol)')) fails.push('system trail missing Sun (Sol): ' + JSON.stringify(stSys.trail));
  if (!/8 worlds orbit Sol/.test(stSys.ctx)) fails.push('Sol caption wrong: ' + JSON.stringify(stSys.ctx));
  /* the DOCK press must LAND (simrun-dom law): charts OFF by default
     (v1.3.6, Nick's call) → press → the chart layer becomes VISIBLE and the
     save field flips */
  if (stSys.chartsOn !== false || stSys.chartsVisible !== false) fails.push('charts not OFF by default: ' + JSON.stringify([stSys.chartsOn, stSys.chartsVisible]));
  const chToggle = await evalIn(`(()=>{ document.getElementById('dockcharts').click(); const s=window.__CF_SLICE__.api.state(); return { on: s.chartsOn, vis: s.chartsVisible }; })()`);
  if (!chToggle.on || !chToggle.vis) fails.push('DOCK PRESS DID NOT LAND — charts toggle had no effect: ' + JSON.stringify(chToggle));
  await evalIn(`(()=>{ document.getElementById('dockcharts').click(); return 1; })()`);   /* back OFF for the visual record */
  /* THE ONE-PANEL LAW (UI_PRESENTATION): settings opens → codex opens →
     settings must CLOSE; tap empty space closes; the corner ✕ closes;
     the volume slider drives the REAL save field through the shared bus. */
  const law = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; const st=()=>S.api.state();
    document.getElementById('docksets').click();
    const a = st().panelOpen;
    document.getElementById('dockcodex').click();
    const b = st().panelOpen;
    const setsHidden = document.getElementById('setpanel').style.display === 'none';
    document.getElementById('docksets').click();
    const vol = document.getElementById('setvol');
    vol.value = '30'; vol.dispatchEvent(new Event('input'));
    const v = st().sfxVol;
    document.querySelector('#setpanel [data-pnx]').click();
    const c = st().panelOpen;
    return { a, b, setsHidden, v, c }; })()`);
  if (law.a !== 'set') fails.push('settings panel did not open: ' + JSON.stringify(law.a));
  if (law.b !== 'codex' || !law.setsHidden) fails.push('ONE-PANEL LAW BROKEN — opening codex left settings up: ' + JSON.stringify(law));
  if (Math.abs(law.v - 0.3) > 1e-9) fails.push('volume slider did not drive save.sfxVol: ' + JSON.stringify(law.v));
  if (law.c !== null) fails.push('the corner ✕ did not close the panel: ' + JSON.stringify(law.c));
  /* FOCUS RESTORATION: closing returns focus to the opener button */
  const focusBack = await evalIn(`(()=>{ const b=document.getElementById('docksets');
    b.focus(); b.click();
    document.querySelector('#setpanel [data-pnx]').click();
    return document.activeElement && document.activeElement.id; })()`);
  if (focusBack !== 'docksets') fails.push('closing a panel did not restore focus to its opener: ' + JSON.stringify(focusBack));
  /* tap empty space closes (the document pointerdown law) */
  await evalIn(`(()=>{ document.getElementById('docksets').click(); return 1; })()`);
  await sleep(250);
  const shotSet = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-settings.png'), Buffer.from(shotSet.data, 'base64'));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 900, y: 300, button: 'left', clickCount: 1 }, sess);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 900, y: 300, button: 'left', clickCount: 1 }, sess);
  await sleep(200);
  const tapClose = await evalIn(`window.__CF_SLICE__.api.state().panelOpen`);
  if (tapClose !== null) fails.push('tap-empty-to-close did not close the panel: ' + JSON.stringify(tapClose));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-sol.png'), Buffer.from(shot3.data, 'base64'));
  const surveyed = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    if(!S.api.landOn(2)) return { ok:false, why:'landOn refused' };
    const card=document.getElementById('survey');
    const rows=[...card.querySelectorAll('[data-row]')].map(r=>r.getAttribute('data-row'));
    const title=(card.querySelector('[data-sel=title]')||{}).textContent;
    return { ok:true, visible:card.style.display!=='none', title, rows, n:rows.length }; })()`);
  if (!surveyed.ok || !surveyed.visible) fails.push('survey card did not open: ' + JSON.stringify(surveyed));
  else {
    if (surveyed.title !== 'Earth') fails.push('landed planet 2 of Sol but the card says: ' + JSON.stringify(surveyed.title));
    for (const want of ['Spectral class', 'Life', 'Civilization']) {
      if (!surveyed.rows.includes(want)) fails.push('survey card missing the "' + want + '" row (rows: ' + surveyed.rows.join(', ') + ')');
    }
  }
  /* THE LIVING PLANETSIDE: Earth's ground survey shows its real roster,
     each specimen wearing an hdart portrait */
  const side = await evalIn(`(()=>{ const el=document.getElementById('planetside');
    if(!el || el.style.display==='none') return { on:false };
    const sp=[...el.querySelectorAll('[data-sel=planetside-sp]')];
    const imgs=sp.filter(x=>x.querySelector('img') && String(x.querySelector('img').src||'').length>2000).length;
    return { on:true, n:sp.length, imgs }; })()`);
  if (!side.on || !(side.n >= 3)) fails.push('the planetside strip did not show Earth’s roster: ' + JSON.stringify(side));
  else if (!(side.imgs >= 3)) fails.push('planetside portraits did not paint: ' + JSON.stringify(side));
  const stSurf = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stSurf.mode !== 'surface') fails.push('landing did not reach surface mode: ' + stSurf.mode);
  if (!/Earth/.test(stSurf.trail)) fails.push('surface trail missing Earth: ' + JSON.stringify(stSurf.trail));
  if (!stSurf.objective.includes('1 / 2')) fails.push('objective chip did not bank the Sol landfall (want 1 / 2): ' + JSON.stringify(stSurf.objective));
  await sleep(900);
  const shot4 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-earth.png'), Buffer.from(shot4.data, 'base64'));

  /* 4. reload: the REAL SAVE survives (importSaveV2 ⇄ exportSaveV2 through
     IndexedDB — not a side JSON). The view must come back AND the landing
     must be in the save's `land` set. */
  await send('Page.navigate', { url: URL0 }, sess);
  await sleep(2500);
  const st3 = await evalIn(`window.__CF_SLICE__.api.state()`);
  /* we landed on Earth before reloading — the SURFACE view must come back */
  if (st3.mode !== 'surface' || st3.gal !== 999 || st3.star !== 424242) fails.push('RELOAD lost the view — IndexedDB persistence failed: ' + JSON.stringify([st3.mode, st3.gal, st3.star]));
  const saved = await evalIn(`window.__CF_SLICE__.api.state().save`);
  if (!saved) fails.push('api.state().save missing');
  else {
    if (saved.viewType !== 'planet') fails.push('restored savedView.type is not "planet": ' + JSON.stringify(saved.viewType));
    if (!Array.isArray(saved.landed) || !saved.landed.includes(133)) fails.push('Earth (133) not in the save’s landed set after reload: ' + JSON.stringify(saved.landed));
    if (typeof saved.essence !== 'number') fails.push('save.essence is not a number — importSaveV2 did not run');
  }

  /* 4a-search. THE SHARE-CODE ROUND TRIP: encode Earth's surface, climb to
     the universe, paste the code in the search bar → travel straight back
     (decodeWhere → the sanitized view → the same charter gates). */
  const shareCode = await evalIn(`window.__CF_SLICE__.api.encodeHere()`);
  if (!shareCode || !/^CF1-/.test(shareCode)) fails.push('encodeHere did not produce a CF1 code: ' + JSON.stringify(shareCode));
  for (let i = 0; i < 3; i++) {   /* surface → system → galaxy → universe */
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
    await sleep(500);
  }
  const preJump = await evalIn(`window.__CF_SLICE__.api.state().mode`);
  if (preJump !== 'universe') fails.push('Escape ladder did not reach the universe before the code jump: ' + preJump);
  /* THE CMB BAND-PICK, while we're at the universe: zoom out to the orange
     ring and tap ON it — the origin card must speak; a tap far INSIDE the
     ring must NOT (the band, not the box) */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=0; S.camT.y=0; S.cam.x=0; S.cam.y=0;
    S.camT.z=0.07; S.cam.z=0.07; return 1; })()`);
  await sleep(600);
  const ringX = 1280 / 2 + Math.round(5200 * 0.07), ringY = 800 / 2;
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: 640, y: 400, button: 'left', clickCount: 1 }, sess);
  await sleep(300);
  const inRing = await evalIn(`window.__CF_SLICE__.api.state().cardTitle`);
  if (inRing === 'The Observable Universe') fails.push('a tap far INSIDE the ring opened the CMB card (band-pick became box-pick)');
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: ringX, y: ringY, button: 'left', clickCount: 1 }, sess);
  await sleep(400);
  const cmb = await evalIn(`window.__CF_SLICE__.api.state().cardTitle`);
  if (cmb !== 'The Observable Universe') fails.push('the CMB band tap did not open the origin card: ' + JSON.stringify(cmb));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);   /* close the card (Escape order) */
  await sleep(200);
  /* a NON-code string must only filter the codex, never move the camera */
  const nonCode = await evalIn(`(()=>{ const s=document.getElementById('searchbox');
    s.value='garbage that is not a code';
    s.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    const st=window.__CF_SLICE__.api.state(); return { mode: st.mode, panel: st.panelOpen }; })()`);
  if (nonCode.mode !== preJump) fails.push('a NON-code search string moved the camera: ' + nonCode.mode);
  if (nonCode.panel !== 'codex') fails.push('a NON-code search did not open the Compendium filter: ' + JSON.stringify(nonCode.panel));
  await evalIn(`(()=>{ document.querySelector('#codexpanel [data-pnx]').click(); return 1; })()`);   /* the ✕, so the next Escape reaches nav */
  await evalIn(`(()=>{ const s=document.getElementById('searchbox');
    s.value=${JSON.stringify(String(shareCode))};
    s.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    return 1; })()`);
  await sleep(1500);
  const back = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (back.mode !== 'surface' || back.star !== 424242) fails.push('the share code did not travel back to Earth: ' + JSON.stringify([back.mode, back.star]));

  /* 4b. THE ZOOM-DRIVEN TRANSITIONS (checkTransitions semantics) — the leg
     the click-descent tests structurally cannot see. We are on Earth's
     surface after the reload; ride the zoom ladder all the way up and back
     down to Sol. Every step reads camT (intent), exactly as the app does. */
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await sleep(700);
  const stEsc = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stEsc.mode !== 'system' || stEsc.gal !== 999) fails.push('Escape did not ascend surface→system: ' + JSON.stringify([stEsc.mode, stEsc.gal]));
  await evalIn(`(()=>{ window.__CF_SLICE__.camT.z = 0.01; return 1; })()`);   /* zoom out hard */
  await sleep(700);
  const stG = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stG.mode !== 'galaxy' || stG.gal !== 999) fails.push('zoom-out did not rise system→galaxy: ' + JSON.stringify([stG.mode, stG.gal]));
  await evalIn(`(()=>{ window.__CF_SLICE__.camT.z = 0.05; return 1; })()`);
  await sleep(700);
  const stU = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stU.mode !== 'universe') fails.push('zoom-out did not rise galaxy→universe: ' + stU.mode);
  /* negative control: deep zoom in EMPTY space must NOT dive */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=5000; S.camT.y=5000; S.camT.z=28; return 1; })()`);
  await sleep(700);
  const stEmpty = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stEmpty.mode !== 'universe') fails.push('CONTROL FAILED — deep zoom in empty space dove somewhere: ' + stEmpty.mode);
  /* zoom INTO the Milky Way at HOME_POS → galaxy */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=90; S.camT.y=-60; S.camT.z=28; return 1; })()`);
  await sleep(900);
  const stG2 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stG2.mode !== 'galaxy' || stG2.gal !== 999) fails.push('zoom-in did not dive universe→galaxy: ' + JSON.stringify([stG2.mode, stG2.gal]));
  /* hold deep over SOL_POS below the dive threshold: the Sun marker + the
     fine-star resolve layer must both be up (Renderer LOD gates) */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=560; S.camT.y=170; S.camT.z=8; S.cam.x=560; S.cam.y=170; S.cam.z=8; return 1; })()`);
  await sleep(1600);
  const deep = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (!deep.fine) fails.push('deep zoom did not build the fine-star layer');
  if (!deep.solVisible) fails.push('Sun marker not visible at deep zoom over SOL_POS');
  const shot5 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-solmark.png'), Buffer.from(shot5.data, 'base64'));
  /* and the final dive: past starZ over the Sun → system 424242 */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.z=30; return 1; })()`);
  await sleep(1200);
  const stS2 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stS2.mode !== 'system' || stS2.star !== 424242) fails.push('zoom-in over the Sun did not dive into Sol: ' + JSON.stringify([stS2.mode, stS2.star]));

  /* 4c. GATE C's FRONT DOOR, rehearsed with the veteran fixture: the import
     sheet's own path (api.importBlob = the button's handler) must validate,
     store VERBATIM, and reboot into the veteran — name, stardust and view. */
  const vrRaw = JSON.stringify(JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'save-fixtures.json'), 'utf8')).inputs.veteran_rich);
  /* a garbage blob must be REFUSED with nothing stored */
  const refuse = await evalIn(`window.__CF_SLICE__.api.importBlob('{"not":"a save"' )`).catch(() => 'navigated');
  if (refuse === null || refuse === 'navigated') fails.push('importBlob accepted garbage (or reloaded on it)');
  try {
    await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(vrRaw)})`);
  } catch { /* success path reloads the page — the eval context dies with it */ }
  await sleep(2800);
  const vet = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (vet.save.name !== 'Dakk') fails.push('veteran import did not boot as Dakk: ' + JSON.stringify(vet.save.name));
  if (vet.save.essence !== 5000) fails.push('veteran essence wrong: ' + JSON.stringify(vet.save.essence));
  if (vet.mode !== 'surface') fails.push('veteran savedView (surface) not restored: ' + vet.mode);
  if (vet.codexCount !== 3) fails.push('veteran Compendium count wrong (want 3): ' + JSON.stringify(vet.codexCount));
  /* 4c-detail. the Compendium DETAIL CARD: click a veteran species row →
     describeSpecies + battleStats speak; ‹ back returns to the list */
  const detail = await evalIn(`(()=>{ document.getElementById('dockcodex').click();
    const row=document.querySelector('#codexpanel [data-ci]');
    if(!row) return { ok:false, why:'no rows' };
    row.click();
    const det=document.querySelector('#codexpanel [data-sel=codex-detail]');
    const stats=document.querySelectorAll('#codexpanel [data-sel=detail-stat]').length;
    const desc=(document.querySelector('#codexpanel [data-sel=detail-desc]')||{}).textContent||'';
    const port=document.querySelector('#codexpanel [data-sel=detail-portrait]');
    const portLen=port?String(port.getAttribute('src')||'').length:0;
    window.__CF_DETAIL_OPEN__=1;
    return { ok:!!det, stats, descLen:desc.trim().length, portLen, backRows:-1, holdOpen:true }; })()`);
  const shotDet = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-codex.png'), Buffer.from(shotDet.data, 'base64'));
  const detailBack = await evalIn(`(()=>{ document.getElementById('codexback').click();
    const backRows=document.querySelectorAll('#codexpanel [data-ci]').length;
    document.querySelector('#codexpanel [data-pnx]').click();
    return { backRows }; })()`);
  detail.backRows = detailBack.backRows;
  if (!detail.ok) fails.push('codex detail card did not open: ' + JSON.stringify(detail));
  if (detail.ok && !(detail.portLen > 5000)) fails.push('THE LIVING PORTRAIT did not paint (hdart real-render proof): src length ' + detail.portLen);
  else {
    if (detail.stats !== 5) fails.push('detail card missing the five stat bars: ' + detail.stats);
    if (!(detail.descLen > 20)) fails.push('detail card description empty (describeSpecies silent): ' + detail.descLen);
    if (detail.backRows !== 3) fails.push('‹ back did not return to the list: ' + detail.backRows);
  }
  /* 4c-records. Records over the real save: counts + the journal empty state */
  const rec = await evalIn(`(()=>{ document.getElementById('dockrecords').click();
    const landed=[...document.querySelectorAll('#recpanel .row')].map(r=>r.textContent).find(t=>/worlds landed/.test(t))||'';
    const jempty=!!document.querySelector('#recpanel [data-sel=journal-empty]');
    const jn=document.querySelectorAll('#recpanel [data-sel=journal-entry]').length;
    document.querySelector('#recpanel [data-pnx]').click();
    return { landed, jempty, jn }; })()`);
  if (!/worlds landed2$/.test(rec.landed.trim())) fails.push('Records did not count the veteran’s 2 landed worlds (fixture land=[133,134]): ' + JSON.stringify(rec.landed));
  if (!rec.jempty && rec.jn === 0) fails.push('Records journal rendered nothing at all');

  /* 4d. THE PHONE LEG (emulated): 390×844 @ DPR 3, touch. The physical
     hand-feel stays Nick's; this catches layout, touch wiring and pinch. */
  const t2 = await send('Target.createTarget', { url: 'about:blank' });
  const at2 = await send('Target.attachToTarget', { targetId: t2.targetId, flatten: true });
  const ph = at2.sessionId;
  await send('Runtime.enable', {}, ph);
  await send('Page.enable', {}, ph);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, ph);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, ph);
  await send('Page.navigate', { url: URL0 }, ph);
  await sleep(3000);
  const evalPh = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, ph);
    if (r.exceptionDetails) throw new Error('phone eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const phBoot = await evalPh(`({ canvas: !!document.querySelector('canvas'), name: window.__CF_SLICE__ ? window.__CF_SLICE__.api.state().save.name : null, w: innerWidth })`);
  if (!phBoot.canvas) fails.push('PHONE: no canvas');
  if (phBoot.w !== 390) fails.push('PHONE: viewport not 390: ' + phBoot.w);
  if (phBoot.name !== 'Dakk') fails.push('PHONE: the veteran save did not follow across targets (IndexedDB): ' + JSON.stringify(phBoot.name));
  /* the phone golden: the FULL geometry contract runs here too — the
     player-chip/search overlap hid in a phone-only branch the first time */
  const phGeo = await evalPh(geoCheck);
  if (phGeo.length) fails.push('PHONE GOLDEN LAYOUT drift: ' + phGeo.join(' · '));
  const phPainted = await evalPh(`(async()=>{ const S=window.__CF_SLICE__;
    const px=await S.app.renderer.extract.pixels({ target: S.app.stage, frame: S.app.renderer.screen });
    const d=px.pixels||px; let lit=0; for(let i=0;i<d.length;i+=4){ if(d[i]+d[i+1]+d[i+2]>60) lit++; } return lit; })()`);
  if (!(phPainted > 300)) fails.push('PHONE: stage nearly blank — ' + phPainted);
  /* pinch: two fingers spread → camT.z must grow (the touch input path, live) */
  const z0 = await evalPh(`window.__CF_SLICE__.camT.z`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }, { x: 240, y: 400, id: 2 }] }, ph);
  for (let s = 1; s <= 4; s++) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - s * 15, y: 400, id: 1 }, { x: 240 + s * 15, y: 400, id: 2 }] }, ph);
    await sleep(40);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, ph);
  await sleep(300);
  const z1 = await evalPh(`window.__CF_SLICE__.camT.z`);
  if (!(z1 > z0 * 1.15)) fails.push('PHONE: pinch-out did not zoom (z ' + z0 + ' → ' + z1 + ')');
  const shotPh = await send('Page.captureScreenshot', { format: 'png' }, ph);
  fs.writeFileSync(path.join(OUT, 'slice-phone.png'), Buffer.from(shotPh.data, 'base64'));

  /* 4d2. THE RESOLUTION MATRIX (uilayout discipline, first slice tier):
     the geometry contract on tablet-portrait and a small phone too — the
     window furniture must sit in the golden places at EVERY size. */
  for (const [vw, vh, name] of [[820, 1180, 'tablet-portrait'], [360, 640, 'small-phone']]) {
    const tR = await send('Target.createTarget', { url: 'about:blank' });
    const aR = await send('Target.attachToTarget', { targetId: tR.targetId, flatten: true });
    const sR = aR.sessionId;
    await send('Runtime.enable', {}, sR);
    await send('Page.enable', {}, sR);
    await send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 2, mobile: true }, sR);
    await send('Page.navigate', { url: URL0 }, sR);
    await sleep(2600);
    const evalR = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sR);
      if (r.exceptionDetails) throw new Error(name + ' eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };
    const g = await evalR(geoCheck).catch((e) => ['harness: ' + e.message]);
    if (g.length) fails.push('MATRIX ' + name + ' (' + vw + '×' + vh + ') layout drift: ' + g.join(' · '));
    await send('Target.closeTarget', { targetId: tR.targetId });
  }

  /* 4e. THE TRAINING DRILL — the six live lessons end-to-end on a FRESH
     ORIGIN (its own IndexedDB ⇒ a new expedition): welcome → find-earth →
     survey-tour → atlas-add → atlas-open → land → graduation, every advance
     on the REAL gameEvent the lesson teaches. */
  const t3 = await send('Target.createTarget', { url: 'about:blank' });
  const at3 = await send('Target.attachToTarget', { targetId: t3.targetId, flatten: true });
  const tr = at3.sessionId;
  await send('Runtime.enable', {}, tr);
  await send('Page.enable', {}, tr);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, tr);
  await send('Page.navigate', { url: URL2 }, tr);
  await sleep(3000);
  const evalT = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, tr);
    if (r.exceptionDetails) throw new Error('training eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const step = async () => evalT(`window.__CF_SLICE__.api.state().tutStep`);
  if (await step() !== 'welcome') fails.push('DRILL: no welcome on the fresh origin: ' + await step());
  await evalT(`(()=>{ document.querySelector('[data-sel=tutbtn]').click(); return 1; })()`);
  if (await step() !== 'find-earth') fails.push('DRILL: Begin did not reach find-earth: ' + await step());
  await evalT(`(()=>{ window.__CF_SLICE__.api.descendGalaxy(999); return 1; })()`);
  await sleep(2200);
  await evalT(`(()=>{ const S=window.__CF_SLICE__; S.api.descendSystem({ seed: 424242, x: 0, y: 0 }); return 1; })()`);
  await sleep(1500);
  await evalT(`(()=>{ window.__CF_SLICE__.api.surveyOn(2); return 1; })()`);   /* tap Earth = survey */
  if (await step() !== 'survey-tour') fails.push('DRILL: surveying Earth did not advance find-earth: ' + await step());
  const shotTut = await send('Page.captureScreenshot', { format: 'png' }, tr);
  fs.writeFileSync(path.join(OUT, 'slice-training.png'), Buffer.from(shotTut.data, 'base64'));
  await evalT(`(()=>{ document.querySelector('[data-sel=tutbtn]').click(); return 1; })()`);
  if (await step() !== 'atlas-add') fails.push('DRILL: Got It did not reach atlas-add: ' + await step());
  await evalT(`(()=>{ document.querySelector('#survey [data-act=add]').click(); return 1; })()`);
  if (await step() !== 'atlas-open') fails.push('DRILL: +Add did not advance (atlas-add event): ' + await step());
  const atl = await evalT(`window.__CF_SLICE__.api.state().atlasCount`);
  if (atl !== 1) fails.push('DRILL: Earth did not land in the Atlas: ' + atl);
  await evalT(`(()=>{ document.getElementById('railatlas').click(); return 1; })()`);
  await sleep(200);
  if (await step() !== 'land') fails.push('DRILL: opening the Atlas did not advance: ' + await step());
  await evalT(`(()=>{ document.querySelector('#atlaspanel [data-pnx]').click(); return 1; })()`);
  await evalT(`(()=>{ document.querySelector('#survey [data-act=landcta]').click(); return 1; })()`);
  await sleep(700);
  if (await step() !== 'grad') fails.push('DRILL: landing on Earth did not graduate: ' + await step());
  await evalT(`(()=>{ document.querySelector('[data-sel=tutbtn]').click(); return 1; })()`);
  await sleep(400);
  const done3 = await evalT(`window.__CF_SLICE__.api.state()`);
  if (done3.tutActive || !done3.tutDone) fails.push('DRILL: graduation did not close training: ' + JSON.stringify([done3.tutActive, done3.tutDone]));
  if (done3.mode !== 'surface') fails.push('DRILL: the drill should end planetside: ' + done3.mode);
  /* the promise: training persists as DONE across reload */
  await send('Page.navigate', { url: URL2 }, tr);
  await sleep(2500);
  const done4 = await evalT(`window.__CF_SLICE__.api.state()`);
  if (done4.tutActive) fails.push('DRILL: training re-opened after graduation + reload');

  /* 5. zero console errors / exceptions across the whole run */
  const errs = events.filter((e) =>
    (e.method === 'Runtime.exceptionThrown') ||
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'));
  if (errs.length) fails.push(errs.length + ' console errors/exceptions, first: ' + JSON.stringify(errs[0].params).slice(0, 300));
} catch (e) {
  fails.push('harness: ' + e.message);
} finally {
  try { ws.close(); } catch { /* closing */ }
  edge.kill();
  server.close();
}

if (fails.length) { console.error('SLICE SMOKE: FAIL\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log('SLICE SMOKE: PASS — the GATE D core loop: booted · painted · SURVEY-FIRST (one tap = the galaxy card + ping, double-tap dives; COSMIC_EPOCH ticking) · CHARTER stage-0 gate live · Milky Way · Sol · LANDED ON EARTH with the survey card speaking · THE REAL SAVE SURVIVED RELOAD (importSaveV2 ⇄ exportSaveV2 through IndexedDB) · ZOOM LADDER with the empty-space control · Sun marker + fine stars at depth · GATE C REHEARSED (garbage refused; the veteran fixture imported through the sheet path and booted as Dakk, surface view restored) · THE PHONE LEG (390×844 @3x, touch): veteran followed across targets, painted, pinch zooms · zero console errors.');
console.log('screenshots: apps/game/smoke/ slice-universe · slice-galaxy · slice-sol · slice-earth · slice-solmark · slice-phone');
process.exit(0);
