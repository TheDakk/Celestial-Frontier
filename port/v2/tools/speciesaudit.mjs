/* speciesaudit.mjs — drive audit.html headless: the FULL Earth catalog + the
   procedural spread through the verbatim hdart engine; save the contact
   sheets, print counts, fail loudly on unpainted species (the game's own
   "rendered clean" audit, ported). Usage: node tools/speciesaudit.mjs */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const OUT = path.join(appDir, 'smoke');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(path.join(dist, 'audit.html'))) execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html';

const udd = path.join(os.tmpdir(), 'cf-spaudit-' + Date.now());
const port = 9633 + (process.pid % 100);
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
const t = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
await send('Page.enable', {}, sess);
await send('Page.navigate', { url: URL0 }, sess);

const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 300));
  return r.result.value;
};
let done = null;
for (let i = 0; i < 900; i++) {   /* up to ~7.5 min — the full catalog is >1000 paints */
  await sleep(500);
  const st = await evalIn(`(()=>{ const A=window.__CF_AUDIT__; if(A&&A.done) return { total:A.total, ok:A.ok, fails:A.fails.slice(0,20), nf:A.fails.length, dupes:(A.dupes||[]).slice(0,12), nd:(A.dupes||[]).length, keys:Object.keys(A.sheetUrls) };
    return { progress: (document.getElementById('log')||{}).textContent||'' }; })()`).catch(() => null);
  if (st && st.total !== undefined) { done = st; break; }
  if (st && i % 20 === 0) console.log('  …' + (st.progress || '').slice(0, 80));
}
if (!done) { console.error('SPECIES AUDIT: TIMEOUT'); edge.kill(); server.close(); process.exit(1); }
for (const key of done.keys) {
  const url = await evalIn(`window.__CF_AUDIT__.sheetUrls[${JSON.stringify(key)}]`);
  fs.writeFileSync(path.join(OUT, 'sheet-' + key + '.png'), Buffer.from(url.split(',')[1], 'base64'));
}
console.log(`SPECIES AUDIT: ${done.ok}/${done.total} painted · ${done.nf} failures · ${done.nd} duplicate pairs`);
if (done.nf) { console.error('  first failures: ' + done.fails.join(' · ')); }
if (done.nd) { console.error('  ★ DUPLICATE EARTH SPECIES (Blocker 3 regression): ' + done.dupes.join(' · ')); }
console.log('contact sheets: ' + done.keys.map((k) => 'smoke/sheet-' + k + '.png').join(' · '));
ws.close(); edge.kill(); server.close();
process.exit((done.nf || done.nd) ? 1 : 0);
