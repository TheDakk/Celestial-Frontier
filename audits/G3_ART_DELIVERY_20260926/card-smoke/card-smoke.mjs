// G3 COMPENDIUM CARD smoke in a real browser (2026-09-26): the painted card path over the on-demand art LIBRARY, and its offline
// fallback to the body family's CORE painting. Serves a built game package on loopback (node http), seeds a save into the game's own
// IndexedDB before boot, opens the Compendium through its own button, and reads what every row's thumbnail <img> actually shows.
//
// Run from port/v2 with approved out-of-sandbox execution (browser-owning):
//   node ../../audits/G3_ART_DELIVERY_20260926/card-smoke/card-smoke.mjs <packageDir> <outDir> [--offline-library] [--control] [--no-sw] [--desktop]
//
//   (default)          phase A ONLINE, then phase B OFFLINE-LIBRARY in a second browser with a FRESH profile; B is compared to A.
//   --offline-library  phase B only (every /library/ request answered 404 from the first request; nothing can be cached).
//   --control          NEGATIVE CONTROL: seeds the unmodified veteran_rich fixture (its fauna resolve to NO painting), runs phase A's
//                      assertions and PASSES only if they FAIL (no painted rows, no library fetches) — proves the checks can see absence.
//   --no-sw            answer 404 for /service-worker.js (the page is never worker-controlled). Default: the worker is served.
//   --desktop          1280x800@1 instead of the default iPhone-class 390x844@3 touch viewport.
//
// The seeded save = the baseline veteran_rich fixture + five procedural fauna from seeded-genomes.json (written by resolve.test.ts
// with the REAL resolver): Wolf, Cougar, Pike, Racer (LIBRARY paintings; core fallbacks Civet/Civet/Salmon/Python) and a Civet-drawn
// creature (CORE painting: the in-run control that must look identical online and offline).
//
// DOM signal (species-art-loader.ts): a painted card's thumb url is the painted source's `data:image/png;base64,…`; the procedural
// painter's thumb is always a revocable `blob:` URL (defaultCreateThumbObjectUrl). A row counts as PAINTED iff its <img> src is a data
// PNG. Which painting drew it is proven by the server log (library files served per archetype) and, offline, by the pixels changing
// (sha256 of the data URL) on exactly the library rows while the core row stays byte-identical.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../../../port/v2/tools/browsercdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const flag = (f) => process.argv.includes(f);
const OFFLINE_ONLY = flag('--offline-library'), CONTROL = flag('--control'), NO_SW = flag('--no-sw'), DESKTOP = flag('--desktop');
if (OFFLINE_ONLY && CONTROL) throw Error('--offline-library and --control are exclusive');
const [pkgArg, outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pkgArg || !outArg) throw Error('usage: card-smoke.mjs <packageDir> <outDir> [--offline-library] [--control] [--no-sw] [--desktop]');
const root = path.resolve(pkgArg), out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('not a built package (no index.html): ' + root);

// ---- the seeded save ----
const fixture = JSON.parse(fs.readFileSync(path.join(here, '../../../port/baseline-v1.8.9/save-fixtures.json'), 'utf8')).inputs.veteran_rich;
const seeded = JSON.parse(fs.readFileSync(path.join(here, 'seeded-genomes.json'), 'utf8'));
const save = structuredClone(fixture);
if (!CONTROL) for (const p of seeded.picked) save.codex.push({ g: p.g, f: 'Card Smoke ' + p.target });
const SAVE_RAW = JSON.stringify(save);
const LIB_SLUG = (n) => n.toLowerCase().replace(/ /g, '-');
const expectedLibrary = CONTROL ? [] : seeded.picked.filter((p) => p.library).map((p) => p.target);
const expectedCore = CONTROL ? [] : seeded.picked.filter((p) => !p.library).map((p) => p.target);
const EXPECTED_PAINTED = expectedLibrary.length + expectedCore.length;

// ---- loopback server: counts (and optionally refuses) every /library/ request ----
let refuseLibrary = false; let libraryLog = [];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/__cardsmoke_seed') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta charset="utf-8"><title>card-smoke seed</title>'); return; }
  if (rel.endsWith('/')) rel += 'index.html'; const file = path.join(root, rel);
  if (rel.startsWith('/library/')) { libraryLog.push({ path: rel, refused: refuseLibrary }); if (refuseLibrary) { res.writeHead(404).end(); return; } }
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

async function phase(name, { offline }) {
  refuseLibrary = offline; libraryLog = [];
  const r = { phase: name, libraryRefused: offline, pageErrors: [], checks: {} };
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
    await send('Page.navigate', { url: origin + '/' });
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
  const byArchetype = {}; for (const h of libraryLog) { const m = /^\/library\/cards\/([^/]+)\//.exec(h.path); const k = m ? m[1] : '(other)'; byArchetype[k] ??= { served: 0, refused: 0 }; byArchetype[k][h.refused ? 'refused' : 'served']++; }
  r.library = { served: libraryLog.filter((h) => !h.refused).length, refused: libraryLog.filter((h) => h.refused).length, byArchetype, paths: [...new Set(libraryLog.map((h) => (h.refused ? 'REFUSED ' : '') + h.path))].sort() };
  return r;
}

const check = (r, key, ok, detail) => { r.checks[key] = { ok: !!ok, detail }; return ok; };
function assertOnline(A) {
  check(A, 'rows present', A.counts.rows === save.codex.length, `${A.counts.rows} rows for ${save.codex.length} seeded entries`);
  check(A, 'painted rows = expected', A.counts.painted === EXPECTED_PAINTED && EXPECTED_PAINTED > 0, `${A.counts.painted} painted (data:image/png) thumbs, expected ${EXPECTED_PAINTED} (${[...expectedLibrary, ...expectedCore].join(', ')})`);
  for (const n of expectedLibrary) { const s = A.library.byArchetype[LIB_SLUG(n)]; check(A, `library served: ${n}`, s && s.served >= 4 && s.refused === 0 && A.library.paths.includes(`/library/cards/${LIB_SLUG(n)}/card/master-512.png`), JSON.stringify(s ?? null)); }
  check(A, 'no library refusal online', A.library.refused === 0, `${A.library.refused} refused`);
  check(A, 'zero page errors', A.pageErrors.length === 0, A.pageErrors.join(' | ').slice(0, 600));
}
function assertOffline(B, A) {
  check(B, 'library requested and refused', B.library.refused > 0 && B.library.served === 0, `${B.library.refused} refused, ${B.library.served} served`);
  check(B, 'painted rows = expected (drawn by core fallback)', B.counts.painted === EXPECTED_PAINTED, `${B.counts.painted} painted thumbs offline, expected ${EXPECTED_PAINTED}`);
  // the art library admits nothing before its pinned manifest (/library/art-library.json) verifies, so a refused manifest is the one
  // refusal that denies every library card; no library card file may be served in this phase
  check(B, 'library manifest refused, no card file served', B.library.paths.includes('REFUSED /library/art-library.json') && !B.library.paths.some((p) => p.startsWith('/library/')), B.library.paths.join(', '));
  check(B, 'zero page errors', B.pageErrors.length === 0, B.pageErrors.join(' | ').slice(0, 600));
  if (A) { // same rows, same painted set; the pixels change on exactly the library rows, never on the core row
    const a = new Map(A.rows.map((x) => [x.cid, x])), painted = B.rows.filter((x) => x.kind === 'painted');
    const changed = painted.filter((x) => a.get(x.cid)?.kind === 'painted' && a.get(x.cid).srcSha !== x.srcSha), same = painted.filter((x) => a.get(x.cid)?.kind === 'painted' && a.get(x.cid).srcSha === x.srcSha);
    check(B, 'same painted rows as online', painted.length === A.rows.filter((x) => x.kind === 'painted').length && painted.every((x) => a.get(x.cid)?.kind === 'painted'), painted.map((x) => x.cid).join(','));
    check(B, 'library rows redrawn by a different (core) painting', changed.length === expectedLibrary.length, `${changed.length} painted rows changed pixels vs online, expected ${expectedLibrary.length}`);
    check(B, 'core row byte-identical online/offline', same.length === expectedCore.length, `${same.length} painted rows unchanged, expected ${expectedCore.length}`);
    B.compare = { changed: changed.map((x) => x.cid), unchanged: same.map((x) => x.cid) };
  }
}

const report = { tool: 'card-smoke.mjs', package: path.basename(root), preview: (() => { try { const p = JSON.parse(fs.readFileSync(path.join(root, 'preview.json'), 'utf8')); return { sourceCommit: p.source?.commit ?? p.sourceCommit ?? null, publishable: p.publishable ?? null }; } catch { return null; } })(),
  mode: CONTROL ? 'control' : OFFLINE_ONLY ? 'offline-library' : 'online+offline', serviceWorker: NO_SW ? 'refused (--no-sw)' : 'served', viewport: DESKTOP ? 'desktop 1280x800@1' : 'phone 390x844@3 touch',
  seeded: CONTROL ? 'veteran_rich unmodified' : { base: 'veteran_rich', added: seeded.picked.map((p) => ({ target: p.target, library: p.library, kind: p.art.kind, family: p.family, coreFallback: p.coreFallback, seed: p.g.seed })) }, phases: [] };
try {
  if (CONTROL) {
    const A = await phase('control-online', { offline: false }); report.phases.push(A);
    const seededExpected = seeded.picked.filter((p) => p.library).map((p) => p.target); // what a real run asserts
    check(A, 'rows present', A.counts.rows >= 1, `${A.counts.rows} rows`);
    check(A, '[control] a real run would require painted rows', A.counts.painted >= seeded.picked.length, `${A.counts.painted} painted, a real run requires ${seeded.picked.length}`);
    for (const n of seededExpected) { const s = A.library.byArchetype[LIB_SLUG(n)]; check(A, `[control] library served: ${n}`, s && s.served >= 4, JSON.stringify(s ?? null)); }
    const failed = Object.entries(A.checks).filter(([k, v]) => k.startsWith('[control]') && !v.ok).length, total = Object.keys(A.checks).filter((k) => k.startsWith('[control]')).length;
    report.control = { realRunChecksFailed: failed, of: total, rowsPresent: A.checks['rows present'].ok, pageErrors: A.pageErrors.length };
    report.status = failed === total && A.checks['rows present'].ok && A.pageErrors.length === 0 ? 'PASS' : 'FAIL';
    if (report.status !== 'PASS') throw Error('control: the smoke did not detect the absence of painted library cards ' + JSON.stringify(report.control));
  } else {
    let A = null; if (!OFFLINE_ONLY) { A = await phase('A-online', { offline: false }); report.phases.push(A); assertOnline(A); }
    const B = await phase('B-offline-library', { offline: true }); report.phases.push(B); assertOffline(B, A);
    const failed = report.phases.flatMap((p) => Object.entries(p.checks).filter(([, v]) => !v.ok).map(([k, v]) => `${p.phase}: ${k} — ${v.detail}`));
    report.failed = failed; report.status = failed.length ? 'FAIL' : 'PASS';
    if (failed.length) process.exitCode = 1;
  }
} catch (e) { report.status = 'FAIL'; report.error = String(e?.stack ?? e).slice(0, 1500); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n'); server.close(); }
console.log(JSON.stringify({ status: report.status, mode: report.mode, error: report.error, failed: report.failed, phases: report.phases.map((p) => ({ phase: p.phase, counts: p.counts, library: { served: p.library?.served, refused: p.library?.refused }, pageErrors: p.pageErrors?.length, compare: p.compare })) }, null, 1));
