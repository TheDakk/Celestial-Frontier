/* speciesexport.mjs — FULL-SIZE portrait export: every Earth-catalog +
   procedural portrait at the engine's NATIVE resolution, written as PNGs
   and zipped per set (Nick's system-check deliverable).
   Usage: node tools/speciesexport.mjs → smoke/species-fullsize/*.zip */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const OUT = path.join(appDir, 'smoke', 'species-fullsize');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ★ ALWAYS REBUILD. This was 'build only if audit.html is missing', so
   once dist existed the audit measured a STALE BUNDLE forever — it spent a
   whole batch reporting a duplicate pair that the source had already fixed,
   and would just as happily have reported a PASS for code that no longer
   existed. An instrument that reads yesterday's build is not an instrument. */
execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?full=1';

const udd = path.join(os.tmpdir(), 'cf-spx-' + Date.now());
/* A pid-derived port can collide with another audit and silently attach to the
   wrong browser. Reserve a real free port, as speciesstrip does. */
const port = await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const portNumber = probe.address().port;
    probe.close(() => resolve(portNumber));
  });
});
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run',
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 50 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('no CDP'); edge.kill(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
});
const t = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};
const safe = (s) => s.replace(/[^A-Za-z0-9 _\-·’']/g, '').replace(/\s+/g, '_').slice(0, 60);
let written = 0;
let firstDims = null;
let completed = false;
for (let spins = 0; spins < 36000; spins++) {   /* drain until done+empty */
  const item = await evalIn(`(()=>{ const F=window.__CF_FULL__; if(!F) return null;
    if(F.q.length) return F.q.shift();
    return F.done ? 'DONE' : 'WAIT'; })()`).catch(() => 'WAIT');
  if (item === 'DONE') { completed = true; break; }
  if (item === 'WAIT' || item === null) { await sleep(120); continue; }
  const dir = path.join(OUT, item.k);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(item.url.split(',')[1], 'base64');
  if (!firstDims && buf.length > 24) firstDims = buf.readUInt32BE(16) + '×' + buf.readUInt32BE(20);
  fs.writeFileSync(path.join(dir, safe(item.name) + '.png'), buf);
  written++;
  if (written % 100 === 0) console.log('  …' + written + ' portraits written');
}
if (!completed) throw new Error('full-size export timed out before the audit reported DONE');
if (written !== 1250) throw new Error(`full-size export expected 1250 portraits, wrote ${written}`);
if (firstDims !== '440×440') throw new Error(`full-size export expected native 440×440 portraits, got ${firstDims}`);
console.log('written: ' + written + ' full-size portraits (native ' + firstDims + ')');
/* zip per set */
const zips = [];
for (const set of fs.readdirSync(OUT)) {
  const dir = path.join(OUT, set);
  if (!fs.statSync(dir).isDirectory()) continue;
  const zip = path.join(OUT, 'cf-species-' + set + '.zip');
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${dir}\\*' -DestinationPath '${zip}' -Force"`);
  zips.push(zip);
  console.log('zipped: ' + path.basename(zip) + ' (' + (fs.statSync(zip).size / 1e6).toFixed(1) + ' MB)');
}
ws.close(); edge.kill(); server.close();
console.log('EXPORT DONE → ' + OUT);
