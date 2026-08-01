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
  const boot = await evalIn(`({ canvas: !!document.querySelector('canvas'), hud: (document.getElementById('hud')||{}).innerText || '' })`);
  if (!boot.canvas) fails.push('no <canvas> — Pixi never mounted');
  if (!/universe/.test(boot.hud)) fails.push('HUD not in universe mode: ' + JSON.stringify(boot.hud));

  /* 2. not blank — via Pixi's extract, which re-renders the stage (a WebGL
     canvas reads BLACK through 2D drawImage without preserveDrawingBuffer;
     the first run failed on exactly that instrument error) */
  const painted = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; if(!S) return -1;
    const px=await S.app.renderer.extract.pixels(S.app.stage); const d=px.pixels||px;
    let lit=0; for(let i=0;i<d.length;i+=4){ if(d[i]+d[i+1]+d[i+2]>60) lit++; } return lit; })()`);
  if (painted === -1) fails.push('__CF_SLICE__ diagnostics handle missing');
  else if (!(painted > 500)) fails.push('stage nearly blank — ' + painted + ' lit pixels (painters did not paint?)');

  const shot1 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-universe.png'), Buffer.from(shot1.data, 'base64'));

  /* 3. descend: click the Milky Way (world 90,-60 → screen center + offset) */
  const cx = 1280 / 2 + 90, cy = 800 / 2 - 60;
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', clickCount: 1 }, sess);
  }
  await sleep(2500);   /* per-seed 512px painterly bake + star field */
  const hud2 = await evalIn(`(document.getElementById('hud')||{}).innerText || ''`);
  if (!/galaxy · gal 999/.test(hud2)) fails.push('descent into the Milky Way did not happen: ' + JSON.stringify(hud2));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-galaxy.png'), Buffer.from(shot2.data, 'base64'));

  /* 3b. THE FULL GATE D DESCENT: into Sol, land on EARTH, the survey card speaks */
  const landed = await evalIn(`(()=>{ const S=window.__CF_SLICE__; if(!S||!S.api) return 'no api';
    S.api.descendSystem({ seed: 424242, x: 0, y: 0 });
    return 'ok'; })()`);
  if (landed !== 'ok') fails.push('descendSystem: ' + landed);
  await sleep(1800);   /* eight painterly surfaces bake */
  const hudSys = await evalIn(`(document.getElementById('hud')||{}).innerText || ''`);
  if (!/system · gal 999 · star 424242/.test(hudSys)) fails.push('Sol descent failed: ' + JSON.stringify(hudSys));
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
  const hudSurf = await evalIn(`(document.getElementById('hud')||{}).innerText || ''`);
  if (!/surface/.test(hudSurf)) fails.push('landing did not reach surface mode: ' + JSON.stringify(hudSurf));
  await sleep(900);
  const shot4 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(path.join(OUT, 'slice-earth.png'), Buffer.from(shot4.data, 'base64'));

  /* 4. reload: the IndexedDB view survives (the save/reload leg, for real) */
  await send('Page.navigate', { url: URL0 }, sess);
  await sleep(2500);
  const hud3 = await evalIn(`(document.getElementById('hud')||{}).innerText || ''`);
  /* we landed on Earth before reloading — the SURFACE view must come back */
  if (!/surface · gal 999 · star 424242/.test(hud3)) fails.push('RELOAD lost the view — IndexedDB persistence failed: ' + JSON.stringify(hud3));

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
console.log('SLICE SMOKE: PASS — the GATE D core loop: booted · painted · Milky Way · Sol · LANDED ON EARTH with the survey card speaking (Spectral class/Life/Civilization) · surface view SURVIVED RELOAD (IndexedDB) · zero console errors.');
console.log('screenshots: apps/game/smoke/ slice-universe · slice-galaxy · slice-sol · slice-earth');
process.exit(0);
