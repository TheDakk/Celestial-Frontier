/* speciesexport.mjs — FULL-SIZE portrait export: every Earth-catalog +
   procedural portrait at the engine's NATIVE resolution, written as PNGs
   and zipped per set (Nick's system-check deliverable).
   Usage: node tools/speciesexport.mjs [--browser=<absolute-path>]
          → smoke/species-fullsize/*.zip */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { closeArtToolServer, withArtBrowserCdp } from './art-browser-contract.mjs';
import {
  assertBrowserLaunchAllowed, browserCandidates, findChromiumBrowser,
} from './browserpath.mjs';
import { createDirectoryContentsZip } from './speciesexport-support.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const OUT = path.join(appDir, 'smoke', 'species-fullsize');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const browserArguments = argv.filter((argument) => argument.startsWith('--browser='));
if (argv.length !== browserArguments.length || browserArguments.length > 1) {
  console.error('usage: node tools/speciesexport.mjs [--browser=<absolute-path>]');
  process.exit(2);
}
const browserOverride = browserArguments[0]?.slice('--browser='.length);
assertBrowserLaunchAllowed();
const browserFile = findChromiumBrowser(browserCandidates(browserOverride));

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
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?full=1';

const summary = await withArtBrowserCdp({
  browserFile,
  tool: 'speciesexport',
  userDataPrefix: 'cf-speciesexport',
  startupTimeoutMs: 20_000,
  cleanup: () => closeArtToolServer(server),
}, async ({ send, provenance }) => {
  fs.writeFileSync(path.join(OUT, 'browser-provenance.json'),
    JSON.stringify(provenance, null, 2) + '\n');
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url: URL0 }, sessionId);
  const evalIn = async (expr) => {
    const result = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (result.exceptionDetails) {
      throw new Error('eval threw: '
        + JSON.stringify(result.exceptionDetails.exception?.description || '').slice(0, 200));
    }
    return result.result.value;
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
  /* ZIP each set's contents without interpolating paths into a shell command. */
  const archives = [];
  for (const set of fs.readdirSync(OUT).sort()) {
    const dir = path.join(OUT, set);
    if (!fs.statSync(dir).isDirectory()) continue;
    const zip = path.join(OUT, 'cf-species-' + set + '.zip');
    createDirectoryContentsZip(dir, zip);
    archives.push({ name: path.basename(zip), megabytes: (fs.statSync(zip).size / 1e6).toFixed(1) });
  }
  return { written, firstDims, archives };
});
console.log('written: ' + summary.written + ' full-size portraits (native ' + summary.firstDims + ')');
for (const archive of summary.archives) {
  console.log('zipped: ' + archive.name + ' (' + archive.megabytes + ' MB)');
}
console.log('EXPORT DONE → ' + OUT);
