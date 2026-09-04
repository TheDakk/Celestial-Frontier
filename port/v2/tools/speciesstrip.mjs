/* speciesstrip.mjs — THE EYEBALL INSTRUMENT. Renders a handful of named
   species BIG and labelled into one PNG, through the same genome the audit
   uses, so what a human judges is exactly what the audit measured.
   The audit answers "did 1,254 paint?"; this answers "does it look right?".
   Usage: node tools/speciesstrip.mjs "Cobra,Rabbit,Gorilla" [out.png] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import { spawn, execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertBrowserLaunchAllowed, findChromiumBrowser } from './browserpath.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Bidirectional instrument control: a known Earth + procedural pair must
   paint, while an intentionally unknown identity must be rejected. The old
   strip tool returned success for the latter and left only a red rectangle in
   the image, which made 57 procedural assets look like art failures. */
if (process.argv.includes('--selftest')) {
  const invoke = (input, output) => spawnSync(process.execPath,
    [fileURLToPath(import.meta.url), input, output], { cwd: path.join(here, '..'), encoding: 'utf8' });
  const good = invoke('Cobra,proc:fauna:h0:s0', 'speciesstrip-selftest/valid.png');
  if (good.status !== 0) {
    console.error('SPECIES STRIP SELFTEST FAILED: valid Earth/procedural control did not render');
    console.error((good.stderr || good.stdout || '').trim());
    process.exit(1);
  }
  const bad = invoke('__CF_INTENTIONAL_UNKNOWN_SPECIES__',
    'speciesstrip-selftest/intentional-invalid.png');
  if (bad.status === 0 || !/unrendered species/i.test(bad.stderr || '')) {
    console.error('SPECIES STRIP SELFTEST FAILED: invalid-name control was not rejected');
    console.error((bad.stderr || bad.stdout || '').trim());
    process.exit(1);
  }
  console.log('SPECIES STRIP SELFTEST PASS');
  console.log('  valid Earth + procedural render: PASS');
  console.log('  intentional unknown species: rejected');
  process.exit(0);
}

const names = process.argv[2];
if (!names) { console.error('usage: node tools/speciesstrip.mjs "Name,Name,…" [out.png]'); process.exit(2); }
const out = path.join(appDir, 'smoke', process.argv[3] || 'strip.png');

/* ★ CONCURRENCY-SAFE BUILD. Several agents run this tool at once during a
   review wave; a shared dist plus two simultaneous vite builds means one of
   them reads a half-written bundle. Take an exclusive lock: whoever gets it
   builds, everyone else waits and then uses the bundle it produced. */
{
  const lock = path.join(appDir, '.strip-build.lock');
  const stale = () => {
    try { return Date.now() - fs.statSync(lock).mtimeMs > 180000; } catch { return false; }
  };
  let held = false;
  for (let i = 0; i < 600; i++) {
    try { fs.mkdirSync(lock); held = true; break; } catch {
      if (stale()) { try { fs.rmSync(lock, { recursive: true, force: true }); } catch { /* raced */ } continue; }
      /* someone else is building — wait for them rather than racing */
      execSync(process.platform === 'win32' ? 'powershell -NoProfile -Command "Start-Sleep -Milliseconds 500"' : 'sleep 0.5');
    }
  }
  try {
    const built = fs.existsSync(path.join(dist, 'audit.html'));
    const newest = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => {
      const q = path.join(d, e.name);
      return Math.max(a, e.isDirectory() ? newest(q) : fs.statSync(q).mtimeMs);
    }, 0);
    const srcMs = Math.max(
      newest(path.join(appDir, 'src')),
      newest(path.join(here, '..', 'packages')),
    );
    /* Rebuild if any bundled source is newer. Looking only at packages/art
       left audit.ts changes behind a fresh-looking but stale audit.html — the
       invalid-strip negative control then passed for exactly the wrong reason.
       The lock still stops concurrent judges doing identical builds. */
    if (!built || fs.statSync(path.join(dist, 'audit.html')).mtimeMs < srcMs) {
      execSync('npx vite build', { cwd: appDir, stdio: 'ignore' });
    }
  } finally {
    if (held) { try { fs.rmSync(lock, { recursive: true, force: true }); } catch { /* gone */ } }
  }
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?strip=' + encodeURIComponent(names);

const udd = path.join(os.tmpdir(), 'cf-strip-' + process.pid);
/* ★ A REAL FREE PORT, not a pid guess. `9833 + pid % 100` collides for any
   two agents whose pids differ by 100, and the symptom is not an error — both
   drive the same browser and each gets whatever the other last navigated to,
   i.e. the wrong species' picture, silently. */
const port = await new Promise((resolve, reject) => {
  /* ⚠ listen() is ASYNC — address() straight after it returns null, which is
     how the first cut of this crashed. Wait for the listening event. */
  const probe = net.createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const pnum = probe.address().port;
    probe.close(() => resolve(pnum));
  });
});
assertBrowserLaunchAllowed();
const browserFile = findChromiumBrowser();
const edge = spawn(browserFile, ['--headless=new', '--no-sandbox', '--no-first-run',
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 50 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('no CDP'); edge.kill(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })); });
const t0 = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t0.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
const errs = [];
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Runtime.exceptionThrown') errs.push(String(m.params?.exceptionDetails?.exception?.description || 'exception')); });
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};
let rendered = null;
for (let s = 0; s < 300 && !rendered; s++) {
  await sleep(200);
  rendered = await evalIn('(window.__CF_STRIP__&&window.__CF_STRIP__.done&&window.__CF_STRIP__)||null');
}
if (!rendered?.url) { console.error('strip never rendered'); ws.close(); edge.kill(); server.close(); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(rendered.url.split(',')[1], 'base64'));
console.log('strip: ' + out + ' (' + names.split(',').length + ' species)' + (errs.length ? ' ⚠ ' + errs.length + ' console errors' : ''));
if (rendered.failed?.length) {
  console.error('unrendered species: ' + rendered.failed.join(', '));
  ws.close(); edge.kill(); server.close(); process.exit(1);
}
ws.close(); edge.kill(); server.close();
process.exit(errs.length ? 1 : 0);
