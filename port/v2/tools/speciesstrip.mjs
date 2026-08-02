/* speciesstrip.mjs — THE EYEBALL INSTRUMENT. Renders a handful of named
   species BIG and labelled into one PNG, through the same genome the audit
   uses, so what a human judges is exactly what the audit measured.
   The audit answers "did 1,254 paint?"; this answers "does it look right?".
   Usage: node tools/speciesstrip.mjs "Cobra,Rabbit,Gorilla" [out.png] */
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const names = process.argv[2];
if (!names) { console.error('usage: node tools/speciesstrip.mjs "Name,Name,…" [out.png]'); process.exit(2); }
const out = path.join(appDir, 'smoke', process.argv[3] || 'strip.png');

execSync('npx vite build', { cwd: appDir, stdio: 'ignore' });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?strip=' + encodeURIComponent(names);

const udd = path.join(os.tmpdir(), 'cf-strip-' + process.pid);
const port = 9833 + (process.pid % 100);
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
let url = null;
for (let s = 0; s < 300 && !url; s++) { await sleep(200); url = await evalIn('(window.__CF_STRIP__&&window.__CF_STRIP__.url)||null'); }
if (!url) { console.error('strip never rendered'); ws.close(); edge.kill(); server.close(); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('strip: ' + out + ' (' + names.split(',').length + ' species)' + (errs.length ? ' ⚠ ' + errs.length + ' console errors' : ''));
ws.close(); edge.kill(); server.close();
process.exit(errs.length ? 1 : 0);
