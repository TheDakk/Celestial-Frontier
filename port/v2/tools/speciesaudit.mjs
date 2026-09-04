/* speciesaudit.mjs — drive audit.html headless: the FULL Earth catalog + the
   procedural spread through the verbatim hdart engine; save the contact
   sheets, print counts, fail loudly on unpainted species (the game's own
   "rendered clean" audit, ported).
   Usage: node tools/speciesaudit.mjs [--browser=<absolute-path>] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { closeArtToolServer, withArtBrowserCdp } from './art-browser-contract.mjs';
import {
  assertBrowserLaunchAllowed, browserCandidates, findChromiumBrowser,
} from './browserpath.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const OUT = path.join(appDir, 'smoke');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const browserArguments = argv.filter((argument) => argument.startsWith('--browser='));
if (argv.length !== browserArguments.length || browserArguments.length > 1) {
  console.error('usage: node tools/speciesaudit.mjs [--browser=<absolute-path>]');
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

/* THE FRESHNESS GUARD — belt and braces for the bug above. Even with an
   unconditional build, assert the bundle is newer than every art source, so
   a future 'optimisation' that skips the build cannot silently reintroduce a
   check that reports on code nobody is running. */
{
  const newest = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, e) => {
    const p = path.join(dir, e.name);
    return Math.max(acc, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs);
  }, 0);
  const srcMs = newest(path.join(here, '..', 'packages', 'art', 'src'));
  const distMs = fs.statSync(path.join(dist, 'audit.html')).mtimeMs;
  if (distMs < srcMs) {
    console.error('speciesaudit: THE BUNDLE IS STALE — art source is newer than dist. Refusing to report on code nobody is running.');
    process.exit(2);
  }
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html';

const done = await withArtBrowserCdp({
  browserFile,
  tool: 'speciesaudit',
  userDataPrefix: 'cf-spaudit',
  startupTimeoutMs: 20_000,
  cleanup: () => closeArtToolServer(server),
}, async ({ send, provenance }) => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'speciesaudit-browser-provenance.json'),
    JSON.stringify(provenance, null, 2) + '\n');
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Page.navigate', { url: URL0 }, sessionId);

  const evalIn = async (expr) => {
    const result = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (result.exceptionDetails) {
      throw new Error('eval threw: ' + JSON.stringify(
        result.exceptionDetails.exception?.description || result.exceptionDetails.text).slice(0, 300));
    }
    return result.result.value;
  };
  let audit = null;
  for (let i = 0; i < 900; i++) {   /* up to ~7.5 min — the full catalog is >1000 paints */
    await sleep(500);
    const state = await evalIn(`(()=>{ const A=window.__CF_AUDIT__; if(A&&A.done) return { total:A.total, ok:A.ok, fails:A.fails.slice(0,20), nf:A.fails.length, dupes:(A.dupes||[]).slice(0,12), nd:(A.dupes||[]).length, clipped:(A.clipped||[]).slice(0,12), nc:(A.clipped||[]).length, keys:Object.keys(A.sheetUrls) };
      return { progress: (document.getElementById('log')||{}).textContent||'' }; })()`).catch(() => null);
    if (state && state.total !== undefined) { audit = state; break; }
    if (state && i % 20 === 0) console.log('  …' + (state.progress || '').slice(0, 80));
  }
  if (!audit) throw new Error('SPECIES AUDIT: TIMEOUT');
  for (const key of audit.keys) {
    const url = await evalIn(`window.__CF_AUDIT__.sheetUrls[${JSON.stringify(key)}]`);
    fs.writeFileSync(path.join(OUT, 'sheet-' + key + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  return audit;
});
console.log(`SPECIES AUDIT: ${done.ok}/${done.total} painted · ${done.nf} failures · ${done.nd} duplicate pairs · ${done.nc} clipped`);
if (done.nf) { console.error('  first failures: ' + done.fails.join(' · ')); }
if (done.nd) { console.error('  ★ DUPLICATE EARTH SPECIES (Blocker 3 regression): ' + done.dupes.join(' · ')); }
if (done.nc) { console.error('  ★ CLIPPED SUBJECTS (cut at draw time — the frame law): ' + done.clipped.join(' · ')); }
console.log('contact sheets: ' + done.keys.map((k) => 'smoke/sheet-' + k + '.png').join(' · '));
process.exitCode = (done.nf || done.nd || done.nc) ? 1 : 0;
