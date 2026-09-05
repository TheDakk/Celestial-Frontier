/* sliceperf.mjs — the bootperf discipline for the slice: measure BOOT →
   PAINTED → ANSWERABLE on a 4×-THROTTLED CPU (the window a new player judges
   the game in; painted ≠ answerable is the v1.8.5 law). Also times the
   galaxy rebuild throttled. A PROFILE, not a gate — numbers print, budgets
   land when Phase 4 sets them (plan §20 answerability budget).
   Usage: node tools/sliceperf.mjs [throttle=4] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';
import { assertBuiltGameMode } from './build-mode.mjs';

const THROTTLE = +(process.argv[2] || 4);
if (!Number.isFinite(THROTTLE) || THROTTLE < 1) throw new RangeError('CPU throttle must be a finite number >= 1');
const here = path.dirname(fileURLToPath(import.meta.url));
acquireWorkspaceLock('v2 performance build and browser profile');
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ALWAYS REBUILD. This was "build only if index.html is missing", so once
   dist/ existed the perf probe measured whatever bundle happened to be on
   disk — a boot time for code nobody is running. Second tool caught doing
   it (D-ART-36); the art audit now checks for the pattern. */
execSync('npx vite build --mode evidence', { cwd: appDir, stdio: 'inherit' });
assertBuiltGameMode(dist, 'evidence');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try {
    const body = fs.readFileSync(p);   /* read FIRST — a throw after writeHead(200) double-sends */
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/';

let browser;
try {
  browser = await openChromiumCdp({
    label: 'slice performance profile',
    userDataPrefix: 'cf-sliceperf',
    commandTimeoutMs: 30000,
  });
} catch (error) {
  server.close();
  throw error;
}
const send = browser.send;

try {
const t = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
await send('Page.enable', {}, sess);
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, sess);
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sess);
await send('Emulation.setCPUThrottlingRate', { rate: THROTTLE }, sess);

const t0 = Date.now();
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
};
/* PAINTED: poll until the stage has lit pixels */
let painted = -1;
for (let i = 0; i < 120; i++) {
  await sleep(250);
  try {
    const lit = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; if(!S||!S.app||!S.app.renderer) return -1;
      const px=await S.app.renderer.extract.pixels({ target: S.app.stage, frame: S.app.renderer.screen });
      const d=px.pixels||px; let n=0; for(let i=0;i<d.length;i+=400){ if(d[i]+d[i+1]+d[i+2]>60) n++; } return n; })()`).catch(() => -1);
    if (lit > 20) { painted = Date.now() - t0; break; }
  } catch { /* booting */ }
}
/* ANSWERABLE: a survey tap must produce a card (main-thread responsive) */
let answerable = -1;
for (let i = 0; i < 80; i++) {
  const ok = await evalIn(`(()=>{ const S=window.__CF_SLICE__; if(!S||!S.api) return false;
    const st=S.api.state(); return st.mode==='universe' && st.trail==='Cosmos'; })()`).catch(() => false);
  if (ok) {
    /* ANSWERABLE = the main thread answers a press with its EFFECT (a dock
       press opening its panel) — the v1.8.5 distinction, without canvas
       hit-testing. ⚠ Pixi pointertap does NOT fire from CDP-emulated touch
       in headless (raw pointer events do — the pinch leg proves the path);
       canvas taps on REAL phone hardware are Nick's leg to verify. */
    const tapT = Date.now();
    await evalIn(`(()=>{ document.getElementById('dockcodex').click(); return 1; })()`);
    for (let j = 0; j < 40; j++) {
      await sleep(60);
      const open = await evalIn(`window.__CF_SLICE__.api.state().panelOpen`).catch(() => null);
      if (open === 'codex') { answerable = Date.now() - t0; break; }
    }
    console.log('  (press→panel: ' + (answerable > 0 ? (Date.now() - tapT) + 'ms' : 'NEVER') + ')');
    await evalIn(`(()=>{ const x=document.querySelector('#codexpanel [data-pnx]'); x && x.click(); return 1; })()`).catch(() => 0);
    break;
  }
  await sleep(250);
}
const galMs = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
  if(!S.api.descendGalaxy||!S.api.descendGalaxy({seed:999,x:90,y:-60})) return -1;
  return new Promise(r=>setTimeout(()=>r(S.api.state().galaxyBuildMs), 800)); })()`).catch(() => -1);

console.log(`SLICE PERF @ ${THROTTLE}× CPU (phone 390×844@3x):`);
console.log(`  painted:    ${painted > 0 ? painted + 'ms' : 'NEVER'}`);
console.log(`  answerable: ${answerable > 0 ? answerable + 'ms' : (answerable === -2 ? '(tap missed — reposition the probe)' : 'NEVER')}`);
console.log(`  galaxy rebuild (throttled): ${typeof galMs === 'number' ? Math.round(galMs) + 'ms' : galMs}`);
console.log('  (v1.8.5 law: painted ≠ answerable — budgets land with plan §20)');
if (!(painted > 0) || !(answerable > 0) || !(typeof galMs === 'number' && galMs >= 0)) {
  console.error('SLICE PERF: measurement incomplete — painted, answerable, and galaxy rebuild must all resolve');
  process.exitCode = 1;
}
} finally {
  try { await browser.close(); }
  finally { server.close(); }
}
