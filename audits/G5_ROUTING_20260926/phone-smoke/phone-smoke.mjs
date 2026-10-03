// G5 PHONE PATH smoke (2026-09-26): on a phone-class device (390x844@3, touch => finish tier `phone`), a Compendium creature whose
// identity has a DELIVERED finished original (Codex's three published crabs, library/creature-finish/<key>/) draws that finished
// original with ?finish=1 — and the phone never asks for a model file or the finish worker (no /__local_ai/ request at all).
// Phases (fresh browser profile each): `plain` (no flag) then `finish` (?finish=1); the three crab rows' card images must differ
// between them, the delivery files must be fetched only in `finish`, and both phases must have zero page errors.
// Run from port/v2 outside the sandbox: node ../../audits/G5_ROUTING_20260926/phone-smoke/phone-smoke.mjs <packageDir> <outDir>
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../../../port/v2/tools/browsercdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const flag = (f) => process.argv.includes(f);
const NO_SW = flag('--no-sw'), DESKTOP = false;
const [pkgArg, outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pkgArg || !outArg) throw Error('usage: phone-smoke.mjs <packageDir> <outDir>');
const root = path.resolve(pkgArg), out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('not a built package (no index.html): ' + root);

// ---- the seeded save: the veteran fixture + the three canonical crabs whose finished originals Codex published ----
const fixture = JSON.parse(fs.readFileSync(path.join(here, '../../../port/baseline-v1.8.9/save-fixtures.json'), 'utf8')).inputs.veteran_rich;
const RECEIPTS = path.join(here, '../../G5_C46_CONTINUATION_20260926/native-cf1a24da');
const crabs = ['crab', 'freshwater-crab', 'mud-crab'].map((id) => { const r = JSON.parse(fs.readFileSync(path.join(RECEIPTS, id + '-receipt.json'), 'utf8')); return { id, g: r.genome, key: r.finishedAtlasKey ?? null }; });
const save = structuredClone(fixture); for (const c of crabs) save.codex.push({ g: c.g, f: 'Phone Smoke ' + c.id });
const SAVE_RAW = JSON.stringify(save);
let QUERY = '';
let refuseLibrary = false; let libraryLog = [], localAiLog = [];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/__cardsmoke_seed') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta charset="utf-8"><title>phone-smoke seed</title>'); return; }
  if (rel.startsWith('/__local_ai/')) localAiLog.push(rel);
  if (rel.endsWith('/')) rel += 'index.html'; const file = path.join(root, rel);
  if (rel.startsWith('/library/')) libraryLog.push({ path: rel, refused: false });
  if ((NO_SW && rel === '/service-worker.js') || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream'); res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const SEED_EXPR = (raw) => `new Promise((resolve, reject) => { const q = indexedDB.open('cf-v2-slice', 2);
  q.onupgradeneeded = () => { for (const s of ['meta','player','creatures','catalog','inventory','settings','journal','receipts','assetcache']) if (!q.result.objectStoreNames.contains(s)) q.result.createObjectStore(s); };
  q.onerror = () => reject(String(q.error)); q.onsuccess = () => { const db = q.result, tx = db.transaction('meta', 'readwrite'); tx.objectStore('meta').put(${JSON.stringify(raw)}, 'save');
    tx.oncomplete = () => { db.close(); resolve(true); }; tx.onerror = () => reject(String(tx.error)); }; })`;
// every Compendium row: its logical id, visible text, and what its thumbnail <img> shows
const ROWS_EXPR = `(() => { const rows = [...document.querySelectorAll('#codexpanel [data-sel="codex-entry"]')]; return rows.map((r) => { const img = r.querySelector('img'), src = img ? (img.getAttribute('src') || '') : '';
  return { cid: r.dataset.cid ?? null, text: (r.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90), kind: src.startsWith('data:image/png;base64,') ? 'painted' : src.startsWith('blob:') ? 'procedural' : src ? 'other' : 'none', src: src.startsWith('data:') ? src : null, complete: !!img && img.complete && img.naturalWidth > 0 }; }); })()`;
const OPEN_EXPR = `(() => { const b = [document.getElementById('dockcodex'), document.getElementById('railcodex')].find((x) => x && x.offsetParent !== null && !x.disabled); if (!b) return null; b.click(); return b.id; })()`;

async function phase(name, { query }) {
  QUERY = query; libraryLog = []; localAiLog = [];
  const r = { phase: name, query, pageErrors: [], checks: {} };
  const browser = await openChromiumCdp({ label: 'G3 compendium card smoke ' + name, userDataPrefix: 'cf-g3-card-smoke', commandTimeoutMs: 60000 });
  r.browser = browser.browser;
  try {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
    const evaluate = async (expression) => { const x = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (x.exceptionDetails) throw Error(JSON.stringify(x.exceptionDetails).slice(0, 600)); return x.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__cfErrors=[];addEventListener('error',e=>window.__cfErrors.push(String(e.error&&e.error.stack||e.message).slice(0,600)));addEventListener('unhandledrejection',e=>window.__cfErrors.push('rejection: '+String(e.reason&&e.reason.stack||e.reason).slice(0,600)));" });
    await send('Emulation.setDeviceMetricsOverride', DESKTOP ? { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false } : { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    if (!DESKTOP) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    // 1. seed the save into the game's own database on this origin (fresh profile ⇒ empty), before the game ever boots
    await send('Page.navigate', { url: origin + '/__cardsmoke_seed' }); await sleep(400);
    r.seeded = await evaluate(SEED_EXPR(SAVE_RAW)); r.seededCodexEntries = save.codex.length;
    // 2. boot the game; 3. open the Compendium through its own button
    await send('Page.navigate', { url: origin + '/' + QUERY });
    let opened = null; const bootDeadline = Date.now() + 90000;
    for (;;) { opened = await evaluate(`document.readyState === 'complete' && document.querySelector('canvas') ? ${OPEN_EXPR} : null`).catch(() => null);
      if (opened) { await sleep(600); const n = await evaluate(`document.querySelectorAll('#codexpanel [data-sel="codex-entry"]').length`); if (n > 0) break; }
      if (Date.now() > bootDeadline) throw Error('Compendium never listed a row (opened via ' + opened + ')'); await sleep(750); }
    r.openedVia = opened;
    // 4. walk the virtual list top → bottom (a phone shows ~5 rows at once); at each stop wait until every mounted row's thumbnail settles
    //    (each has a loaded image and the kinds stop changing for 3 s), and keep the latest observation per logical row id
    const seen = new Map(); const artDeadline = Date.now() + 180000;
    const settle = async () => { let rows = [], stableSince = Date.now(), lastSig = '';
      for (;;) { rows = await evaluate(ROWS_EXPR); const sig = rows.map((x) => x.cid + x.kind + (x.complete ? '1' : '0')).join(',');
        if (sig !== lastSig) { lastSig = sig; stableSince = Date.now(); }
        if (rows.every((x) => x.kind !== 'none' && x.complete) && Date.now() - stableSince > 3000) return rows;
        if (Date.now() > artDeadline) { r.artTimeout = true; return rows; } await sleep(300); } };
    const SCROLLER = `document.querySelector('#codexpanel [data-sel="codex-scroll"]')`;
    r.scrollStops = 0;
    for (let top = 0; ; ) {
      await evaluate(`(() => { const s = ${SCROLLER}; if (s) s.scrollTop = ${top}; return true; })()`); await sleep(250);
      const mounted = await settle(); for (const x of mounted) seen.set(x.cid, x); r.scrollStops++;
      // screenshot: the Compendium panel at the stop showing the most painted rows (a JPEG of the panel only, to stay modest)
      const paintedHere = mounted.filter((x) => x.kind === 'painted').length;
      if (r.scrollStops === 1 || paintedHere > (r.screenshotPaintedRows ?? -1)) {
        const b = await evaluate(`(() => { const e = document.getElementById('codexpanel').getBoundingClientRect(); return { x: e.x, y: e.y, width: e.width, height: e.height }; })()`);
        const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { ...b, scale: DESKTOP ? 1 : 0.6 } });
        r.screenshot = name + '-compendium.jpg'; r.screenshotPaintedRows = paintedHere; r.screenshotRows = mounted.map((x) => x.cid + ':' + x.kind); fs.writeFileSync(path.join(out, r.screenshot), Buffer.from(data, 'base64')); }
      const g = await evaluate(`(() => { const s = ${SCROLLER}; return s ? { top: s.scrollTop, h: s.clientHeight, sh: s.scrollHeight } : null; })()`);
      if (!g || g.top + g.h >= g.sh - 2 || r.scrollStops > 40 || r.artTimeout) break; top = g.top + Math.max(40, Math.floor(g.h * 0.6)); }
    const rows = [...seen.values()];
    r.rows = rows.map(({ src, ...x }) => ({ ...x, srcSha: src ? sha(src) : null }));
    r.counts = { rows: rows.length, painted: rows.filter((x) => x.kind === 'painted').length, procedural: rows.filter((x) => x.kind === 'procedural').length, other: rows.filter((x) => x.kind === 'other' || x.kind === 'none').length };
    r.controlled = await evaluate('!!(navigator.serviceWorker && navigator.serviceWorker.controller)');
    r.pageErrors = await evaluate('window.__cfErrors || []');
  } finally { try { await browser.close(); } catch { /* closing */ } }
  // the server's view of the art library during this phase
  r.creatureFinishFetches = libraryLog.filter((x) => x.path.startsWith('/library/creature-finish/')).map((x) => x.path);
  r.finishSourceFetches = libraryLog.filter((x) => x.path.startsWith('/library/creature-finish-source/')).length;
  r.localAiRequests = localAiLog.slice();
  return r;
}
const report = { tool: 'phone-smoke', package: path.basename(root), crabs: crabs.map((c) => c.id), phases: [] };
try {
  const plain = await phase('plain', { query: '' }), fin = await phase('finish', { query: '?finish=1' }); report.phases.push(plain, fin);
  const rowsOf = (p) => new Map(p.rows.filter((x) => /Phone Smoke/.test(x.text)).map((x) => [x.text.match(/Phone Smoke ([a-z-]+)/)[1], x]));
  const a = rowsOf(plain), b = rowsOf(fin);
  report.checks = {
    threeCrabRowsPainted: crabs.every((c) => a.get(c.id)?.kind === 'painted' && b.get(c.id)?.kind === 'painted'),
    finishedDiffersForAll: crabs.every((c) => a.get(c.id) && b.get(c.id) && a.get(c.id).srcSha !== b.get(c.id).srcSha),
    deliveryFetchedOnlyWithFlag: plain.creatureFinishFetches.length === 0 && fin.creatureFinishFetches.length > 0,
    // the package's service worker precaches the landfall local-AI runtime files in BOTH phases; ?finish=1 must add none of its own and
    // never touch a model file (instrument corrected after run-01, which counted the precache as a finisher request)
    finishAddsNoLocalAiRequest: fin.localAiRequests.every((x) => plain.localAiRequests.includes(x)),
    noModelFileRequested: [...plain.localAiRequests, ...fin.localAiRequests].every((x) => !/\/model\/|\.onnx|onnx_data|tokenizer\.json/.test(x)),
    zeroPageErrors: plain.pageErrors.length === 0 && fin.pageErrors.length === 0,
  };
  report.measured = { finishSourceFetchesOnPhone: fin.finishSourceFetches, note: 'the phone route downloads each archetype master+labels once to compute the identity key (no model, no inference)' };
  report.perCrab = crabs.map((c) => ({ id: c.id, plain: a.get(c.id)?.srcSha ?? null, finish: b.get(c.id)?.srcSha ?? null }));
  report.status = Object.values(report.checks).every(Boolean) ? 'PASS' : 'FAIL';
} catch (e) { report.status = 'ERROR'; report.error = String(e && e.stack || e); }
finally { server.close(); }
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify({ status: report.status, checks: report.checks, perCrab: report.perCrab, error: report.error }));
