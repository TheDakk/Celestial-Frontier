// G5 FINISH smoke in a real browser (2026-09-26): the first real-browser run of the in-game finisher behind `?finish=1`, on a creature the
// core `Crab` painting draws (880x880 master, eligible under the finisher's alpha rule). Evidence, not a gate.
//
// Run from the repo root with approved out-of-sandbox execution (browser-owning, WebGPU):
//   node audits/G5_ROUTING_20260926/finish-smoke/finish-smoke.mjs <outDir> [--phases=control,shipped,finish,patched] [--finish-timeout-s=900]
//
// Phases (each in a FRESH headless browser profile, desktop 1280x800@1, no touch):
//   control  NEGATIVE CONTROL: `/` without ?finish=1. Opens the Crab creature's Compendium portrait, waits 30 s, reopens it.
//            PASS = nothing retained in IndexedDB `cf-ai-creature-originals-v1`, no finish worker, portrait unchanged, 0 page errors.
//   shipped  `/?finish=1` served EXACTLY as the preview server ships it. Records what happens (the worker import graph needs
//            /__local_ai/creature-finish-math.mjs, which neither the preview server nor the Vite kit plugin serves — see NOTES.md).
//   finish   `/?finish=1` with ONE addition by this smoke's loopback front proxy: /__local_ai/creature-finish-math.mjs is answered from
//            tools/local-image-generation/creature-finish-math.mjs (same COOP/COEP/CORP headers). Everything else is proxied verbatim.
//            Records what happens (run-01 found the engine refuses the source before inference: individualId = the 700-char species
//            visual key > the engine's 512 cap, "individual identity" — see NOTES.md). Observed for 120 s.
//   patched  as `finish`, plus ONE in-flight rewrite of the served (Vite-transformed) /src/creature-finish-route.ts:
//            `individualId: o.visualKey` → `individualId: sha(new TextEncoder().encode(o.visualKey))` (64 hex chars, the module's own
//            sha helper). Proves everything downstream of that bug. The source file on disk is untouched.
//            PASS = the portrait open enqueues a finish, the local model runs, one finished original is retained, the reopened portrait
//            (or, if the reopen does not redraw, the portrait after a reload) differs from the unfinished one, 0 page errors.
//
// Server: tools/local-image-generation/game-preview-server.mjs `createGamePreviewServer` in-process (verified model cache + Vite dev game +
// /__local_ai/). One process-local shim is applied BEFORE it loads: `git ls-files` gets a 256 MiB maxBuffer, because the unpatched
// assertTrackedKitSources (kit-tracked-inputs.mjs) throws `spawnSync git ENOBUFS` on this repo (~3.0 MB of tracked paths > Node's 1 MiB
// default), so the preview server cannot start at all. No source file is modified.
// Seeding: the veteran_rich fixture + the Crab-drawn procedural genome from crab-genome.json (written by resolve.test.ts with the REAL
// resolver), written into the game's own IndexedDB `cf-v2-slice` before boot (the card-smoke approach).
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto';
import { createRequire, syncBuiltinESMExports } from 'node:module'; import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '../../..');
{ const cp = createRequire(import.meta.url)('node:child_process'), orig = cp.execFileSync;
  cp.execFileSync = (f, a, o) => orig(f, a, f === 'git' && Array.isArray(a) && a[0] === 'ls-files' ? { ...o, maxBuffer: 256 * 1024 * 1024 } : o); syncBuiltinESMExports(); }
const { createGamePreviewServer } = await import(pathToFileURL(path.join(ROOT, 'tools/local-image-generation/game-preview-server.mjs')).href);
const { openChromiumCdp } = await import(pathToFileURL(path.join(ROOT, 'port/v2/tools/browsercdp.mjs')).href);

const args = process.argv.slice(2), outArg = args.find((a) => !a.startsWith('--'));
if (!outArg) throw Error('usage: finish-smoke.mjs <outDir> [--phases=control,shipped,finish] [--finish-timeout-s=720]');
const opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const PHASES = opt('phases', 'control,shipped,finish,patched').split(','), FINISH_TIMEOUT = Number(opt('finish-timeout-s', '900')) * 1000;
const out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'port/baseline-v1.8.9/save-fixtures.json'), 'utf8')).inputs.veteran_rich;
const crab = JSON.parse(fs.readFileSync(path.join(here, 'crab-genome.json'), 'utf8'));
const CRAB_NAME = 'Finish Smoke Crab', save = structuredClone(fixture); save.codex.push({ g: crab.g, f: CRAB_NAME });
const SAVE_RAW = JSON.stringify(save);
const FINISH_MATH = fs.readFileSync(path.join(ROOT, 'tools/local-image-generation/creature-finish-math.mjs'));

// ---- the preview server (in-process) behind a loopback front proxy that logs every request with timings ----
const t00 = Date.now(); const preview = await createGamePreviewServer({ port: 0, referenceIdentity: 'finish-smoke' });
const serverStartMs = Date.now() - t00, inner = new URL(preview.url), innerHost = `127.0.0.1:${inner.port}`;
let serveFinishMath = false, patchIdentity = false, identityRewrites = 0, reqLog = [];
// the two in-flight rewrites of the `patched` phase (served Vite output only; the files on disk are untouched): [module, old, new]
const REWRITES = [
  ['/src/creature-finish-route.ts', 'individualId: o.visualKey,', 'individualId: sha(new TextEncoder().encode(o.visualKey)),'],
  ['/src/creature-finish-app.ts', 'data.rgba instanceof Uint8Array ? data.rgba :', 'data.rgba instanceof Uint8Array ? data.rgba : data.rgba instanceof Uint8ClampedArray ? new Uint8Array(data.rgba.buffer, data.rgba.byteOffset, data.rgba.byteLength) :'],
];
const proxy = http.createServer((req, res) => {
  const p = req.url.split('?')[0], row = { t: Date.now(), path: p, status: null, bytes: 0, done: null }; reqLog.push(row); if (reqLog.length > 20000) reqLog.shift();
  if (p === '/__finishsmoke_seed') { row.status = 200; res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta charset="utf-8"><title>finish-smoke seed</title>'); return; }
  if (serveFinishMath && p === '/__local_ai/creature-finish-math.mjs') { row.status = 200; row.shim = true; row.bytes = FINISH_MATH.length; row.done = Date.now();
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cross-Origin-Resource-Policy': 'same-origin', 'Cache-Control': 'no-store' }); res.end(FINISH_MATH); return; }
  const outer = `http://${req.headers.host}`, headers = { ...req.headers, host: innerHost };
  if (headers.origin) headers.origin = `http://${innerHost}`; if (headers.referer) headers.referer = headers.referer.replace(outer, `http://${innerHost}`);
  const rw = patchIdentity ? REWRITES.find(([m]) => m === p) : null;
  if (rw) { delete headers['if-none-match']; delete headers['if-modified-since']; delete headers['accept-encoding'];
    const up = http.request({ host: '127.0.0.1', port: inner.port, method: req.method, path: req.url, headers }, (ur) => { const chunks = []; ur.on('data', (c) => chunks.push(c)); ur.on('end', () => {
      let body = Buffer.concat(chunks).toString('utf8'); const n = body.split(rw[1]).length - 1; identityRewrites += n; row.rewrites = n; body = body.split(rw[1]).join(rw[2]);
      const h = { ...ur.headers }; delete h['content-length']; delete h['etag']; row.status = ur.statusCode; row.bytes = Buffer.byteLength(body); row.done = Date.now(); res.writeHead(ur.statusCode, h); res.end(body); }); });
    up.on('error', () => { row.status = 502; if (!res.headersSent) res.writeHead(502); res.end(); }); req.pipe(up); return; }
  const up = http.request({ host: '127.0.0.1', port: inner.port, method: req.method, path: req.url, headers }, (ur) => {
    row.status = ur.statusCode; res.writeHead(ur.statusCode, ur.headers); ur.on('data', (c) => { row.bytes += c.length; }); ur.on('end', () => { row.done = Date.now(); }); ur.pipe(res); });
  up.on('error', () => { row.status = 502; if (!res.headersSent) res.writeHead(502); res.end(); }); res.on('close', () => { if (!row.done) up.destroy(); }); req.pipe(up);
});
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${proxy.address().port}`;

// ---- page-side expressions ----
const INIT = `window.__cfErrors=[];addEventListener('error',e=>window.__cfErrors.push(String(e.error&&e.error.stack||e.message).slice(0,600)));addEventListener('unhandledrejection',e=>window.__cfErrors.push('rejection: '+String(e.reason&&e.reason.stack||e.reason).slice(0,600)));
(()=>{const W=window.Worker;if(!W)return;const now=()=>performance.timeOrigin+performance.now();window.__cfWorkerLog=[];const log=window.__cfWorkerLog,push=x=>{log.push(x);if(log.length>3000)log.splice(0,log.length-3000);};
window.Worker=class extends W{constructor(u,o){super(u,o);const name=o&&o.name||null;push({t:now(),ev:'construct',url:String(u),name});
 this.addEventListener('message',e=>{const d=e.data||{},x={t:now(),ev:'message',name,type:d.type};for(const k of Object.keys(d))if(k!=='type'&&(d[k]===null||['string','number','boolean'].includes(typeof d[k])))x[k]=typeof d[k]==='string'?d[k].slice(0,900):d[k];
  if(d.type==='complete')x.keys=Object.keys(d);push(x);});
 this.addEventListener('error',e=>push({t:now(),ev:'error',name,message:String(e.message||'(no message: module script failed to load)'),filename:e.filename||null,lineno:e.lineno||null}));
 const pm=this.postMessage.bind(this);this.postMessage=(m,tr)=>{push({t:now(),ev:'post',name,stage:m&&m.stage||null,requestId:m&&m.requestId||null});return pm(m,tr);};}};})();`;
const SEED_EXPR = `new Promise((resolve, reject) => { const q = indexedDB.open('cf-v2-slice', 2);
  q.onupgradeneeded = () => { for (const s of ['meta','player','creatures','catalog','inventory','settings','journal','receipts','assetcache']) if (!q.result.objectStoreNames.contains(s)) q.result.createObjectStore(s); };
  q.onerror = () => reject(String(q.error)); q.onsuccess = () => { const db = q.result, tx = db.transaction('meta', 'readwrite'); tx.objectStore('meta').put(${JSON.stringify(SAVE_RAW)}, 'save');
    tx.oncomplete = () => { db.close(); resolve(true); }; tx.onerror = () => reject(String(tx.error)); }; })`;
const OPEN_CODEX = `(() => { const b = [document.getElementById('dockcodex'), document.getElementById('railcodex')].find((x) => x && x.offsetParent !== null && !x.disabled); if (!b) return null; b.click(); return b.id; })()`;
const CRAB_ROW = `[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"]')].find((r) => (r.textContent || '').includes(${JSON.stringify(CRAB_NAME)}))`;
const PORTRAIT = `document.querySelector('#codexpanel [data-sel="detail-portrait"]')`;
// what the portrait <img> shows: sha256 of the bytes behind its src (data: or blob:), its kind and size
const PORTRAIT_STATE = `(async () => { const i = ${PORTRAIT}; if (!i) return null; const src = i.getAttribute('src') || '';
  let sha = null, bytes = null; if (src && i.complete && i.naturalWidth > 0) { try { const b = await (await fetch(src)).arrayBuffer(); bytes = b.byteLength; sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { sha = 'fetch-failed: ' + e; } }
  return { artState: i.dataset.artState || null, srcKind: src.startsWith('data:image/png') ? 'data-png' : src.startsWith('blob:') ? 'blob' : src ? 'other' : 'none', complete: i.complete, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, bytes, sha }; })()`;
// pixel difference between the first portrait (kept in the page) and the one shown now: changed pixels, max channel delta, mean |delta|
const KEEP_FIRST = `(() => { window.__firstPortraitSrc = ${PORTRAIT}.getAttribute('src'); return true; })()`;
const PORTRAIT_DIFF = `(async () => { const load = async (src) => { const bm = await createImageBitmap(await (await fetch(src)).blob()); const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0); return g.getImageData(0, 0, bm.width, bm.height).data; };
  const a = await load(window.__firstPortraitSrc), b = await load(${PORTRAIT}.getAttribute('src')); if (a.length !== b.length) return { sizeMismatch: true };
  let changed = 0, maxDelta = 0, sum = 0, opaque = 0; for (let i = 0; i < a.length; i += 4) { let d = 0; for (let c = 0; c < 4; c++) { const x = Math.abs(a[i + c] - b[i + c]); d = Math.max(d, x); sum += x; } if (a[i + 3]) opaque++; if (d) changed++; maxDelta = Math.max(maxDelta, d); }
  return { pixels: a.length / 4, changedPixels: changed, changedPct: +(100 * changed / (a.length / 4)).toFixed(3), maxChannelDelta: maxDelta, meanAbsChannelDelta: +(sum / a.length).toFixed(4) }; })()`;
const STORE = `(async () => { const dbs = indexedDB.databases ? await indexedDB.databases() : []; if (!dbs.some((d) => d.name === 'cf-ai-creature-originals-v1')) return { exists: false, count: 0, rows: [] };
  const db = await new Promise((res, rej) => { const q = indexedDB.open('cf-ai-creature-originals-v1'); q.onsuccess = () => res(q.result); q.onerror = () => rej(String(q.error)); });
  try { if (!db.objectStoreNames.contains('originals')) return { exists: true, count: 0, rows: [], stores: [...db.objectStoreNames] };
    const [keys, vals] = await Promise.all(['getAllKeys', 'getAll'].map((m) => new Promise((res, rej) => { const q = db.transaction('originals').objectStore('originals')[m](); q.onsuccess = () => res(q.result); q.onerror = () => rej(String(q.error)); })));
    return { exists: true, count: keys.length, rows: vals.map((v, n) => { const o = { key: String(keys[n]).slice(0, 300) }; if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) o[k] = x instanceof Blob ? { blob: x.type, size: x.size } : (x === null || ['string', 'number', 'boolean'].includes(typeof x)) ? (typeof x === 'string' ? x.slice(0, 200) : x) : Array.isArray(x) ? '[array ' + x.length + ']' : '[object]'; return o; }) };
  } finally { db.close(); } })()`;
// the retained original, downscaled to a 440 JPEG for the report (modest size), plus its PNG dimensions
const ORIGINAL_JPEG = `(async () => { const db = await new Promise((res, rej) => { const q = indexedDB.open('cf-ai-creature-originals-v1'); q.onsuccess = () => res(q.result); q.onerror = () => rej(String(q.error)); });
  try { const vals = await new Promise((res, rej) => { const q = db.transaction('originals').objectStore('originals').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(String(q.error)); });
    const v = vals[0]; const blob = v && Object.values(v).find((x) => x instanceof Blob); if (!blob) return null; const bm = await createImageBitmap(blob);
    const c = new OffscreenCanvas(440, 440), g = c.getContext('2d'); g.fillStyle = '#20242c'; g.fillRect(0, 0, 440, 440); g.drawImage(bm, 0, 0, 440, 440);
    const j = await c.convertToBlob({ type: 'image/jpeg', quality: 0.82 }); const b = new Uint8Array(await j.arrayBuffer()); let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
    return { width: bm.width, height: bm.height, jpeg: btoa(s) }; } finally { db.close(); } })()`;
const CAPABILITY = `(async () => { const r = { secureContext: isSecureContext, webgpu: false, shaderF16: false, fallbackAdapter: null, opfs: typeof navigator.storage?.getDirectory === 'function', webLocks: typeof navigator.locks?.request === 'function', maxTouchPoints: navigator.maxTouchPoints, coarse: matchMedia('(pointer: coarse)').matches, crossOriginIsolated };
  try { const a = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' }); if (a) { r.webgpu = true; r.shaderF16 = a.features.has('shader-f16'); r.fallbackAdapter = a.info.isFallbackAdapter; r.adapter = { vendor: a.info.vendor, architecture: a.info.architecture, description: a.info.description }; } } catch (e) { r.error = String(e); }
  try { const e = await navigator.storage.estimate(); r.quotaBytes = e.quota; } catch {} return r; })()`;

async function phase(name, { query, shim, patch = false, observeMs, finishTimeoutMs }) {
  serveFinishMath = shim; patchIdentity = patch; identityRewrites = 0; reqLog = []; const t0 = Date.now();
  const r = { phase: name, url: '/' + query, finishMathServedBySmoke: shim, identityPatchedInFlight: patch, checks: {}, console: [] };
  const browser = await openChromiumCdp({ label: 'G5 finish smoke ' + name, userDataPrefix: 'cf-g5-finish-smoke', commandTimeoutMs: 120000,
    onEvent: (m) => { if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) r.console.push({ t: Date.now() - t0, type: m.params.type, text: m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500) });
      if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) r.console.push({ t: Date.now() - t0, type: 'log-' + m.params.entry.level, text: (m.params.entry.text + ' ' + (m.params.entry.url ?? '')).slice(0, 500) });
      if (r.console.length > 300) r.console.shift(); } });
  r.browser = browser.browser;
  const shot = async (send, evaluate, file) => { const b = await evaluate(`(() => { const e = ${PORTRAIT}.getBoundingClientRect(); return { x: e.x, y: e.y, width: e.width, height: e.height }; })()`);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85, clip: { ...b, scale: 1 } }); fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64')); return file; };
  try {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
    const evaluate = async (expression) => { const x = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (x.exceptionDetails) throw Error(JSON.stringify(x.exceptionDetails).slice(0, 600)); return x.result.value; };
    await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: INIT });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: origin + '/__finishsmoke_seed' }); await sleep(400);
    r.seeded = await evaluate(SEED_EXPR); r.capability = await evaluate(CAPABILITY);
    // boot → Compendium → the Crab row → its detail portrait, settled (ready, loaded, src stable 2.5 s)
    const openPortrait = async (label) => {
      const deadline = Date.now() + 120000;
      for (;;) { const opened = await evaluate(`(() => { if (${PORTRAIT}) return 'detail'; if (${CRAB_ROW}) return 'list'; if (document.readyState !== 'complete' || !document.querySelector('canvas')) return null; return ${OPEN_CODEX} ? 'opening' : null; })()`).catch(() => null);
        if (opened === 'list') break; if (Date.now() > deadline) throw Error(label + ': the Crab row never listed'); await sleep(600); }
      await sleep(400); const tOpen = Date.now(); await evaluate(`${CRAB_ROW}.click()`);
      let last = '', since = Date.now(), st = null;
      for (;;) { st = await evaluate(PORTRAIT_STATE).catch(() => null); const sig = JSON.stringify(st);
        if (sig !== last) { last = sig; since = Date.now(); }
        if (st && st.artState === 'ready' && st.sha && Date.now() - since > 2500) break;
        if (Date.now() - tOpen > 90000) throw Error(label + ': portrait never settled ' + sig); await sleep(250); }
      return { ...st, openedAtMs: tOpen - t0, settledMs: since - tOpen };
    };
    const closePortrait = async () => { await evaluate(`document.getElementById('codexback').click()`); await sleep(800); };
    await send('Page.navigate', { url: origin + '/' + query });
    r.first = await openPortrait('first open'); await evaluate(KEEP_FIRST); r.screenshotUnfinished = await shot(send, evaluate, name + '-portrait-first.jpg');
    if (patch) { await sleep(3000); if (identityRewrites < REWRITES.length) throw Error('patched: the served route module was not rewritten; module requests seen: ' + JSON.stringify(reqLog.filter((x) => x.path.includes('creature-finish')).map((x) => x.status + ' ' + x.path))); }
    // wait: control/shipped observe a fixed window; finish polls the store until a retained original (or a finish-worker failure)
    const tWait = Date.now(), limit = finishTimeoutMs ?? observeMs;
    for (;;) { const s = await evaluate(STORE), wl = await evaluate('window.__cfWorkerLog || []'), fw = wl.filter((x) => x.name === 'cf-creature-finish-v1');
      const failed = fw.some((x) => x.ev === 'error' || (x.ev === 'message' && x.type === 'error'));
      const done = fw.find((x) => x.ev === 'message' && x.type === 'complete'); // the engine verifies + retains right after the worker completes
      if (finishTimeoutMs && (s.count > 0 || failed || (done && Date.now() > done.t + 20000))) break; if (Date.now() - tWait > limit) { if (finishTimeoutMs) r.finishTimedOut = true; break; } await sleep(finishTimeoutMs ? 5000 : 2000); }
    r.waitedMs = Date.now() - tWait; r.store = await evaluate(STORE);
    const wl = await evaluate('window.__cfWorkerLog || []'); r.finishWorker = wl.filter((x) => x.name === 'cf-creature-finish-v1').map((x) => ({ ...x, t: Math.round(x.t - t0) }));
    r.otherWorkers = [...new Set(wl.filter((x) => x.ev === 'construct' && x.name !== 'cf-creature-finish-v1').map((x) => x.url.split('?')[0] + ' (' + x.name + ')'))];
    if (r.store.count > 0) { const o = await evaluate(ORIGINAL_JPEG); if (o) { r.retainedOriginal = { width: o.width, height: o.height }; r.retainedOriginalJpeg = name + '-retained-original-440.jpg'; fs.writeFileSync(path.join(out, r.retainedOriginalJpeg), Buffer.from(o.jpeg, 'base64')); } }
    // reopen the portrait (close → reopen) — the card hook redraws only on the next render
    await closePortrait(); r.reopen = await openPortrait('reopen');
    if (r.reopen.sha !== r.first.sha || r.store.count === 0) r.screenshotReopen = await shot(send, evaluate, name + '-portrait-reopen.jpg');
    else { // the reopen still showed the unfinished image: a reload (fresh session over the same profile and store)
      await send('Page.navigate', { url: origin + '/' + query }); r.afterReload = await openPortrait('after reload'); r.screenshotReopen = await shot(send, evaluate, name + '-portrait-after-reload.jpg'); }
    r.portraitPixelDiff = await evaluate(PORTRAIT_DIFF).catch((e) => ({ error: String(e).slice(0, 300) }));
    r.storeFinal = await evaluate(STORE);
    r.pageErrors = await evaluate('window.__cfErrors || []');
  } finally { try { await browser.close(); } catch { /* closing */ } }
  // server-side view: the local-AI transport this phase used
  const ai = reqLog.filter((x) => x.path.startsWith('/__local_ai/')), model = ai.filter((x) => x.path.startsWith('/__local_ai/model/'));
  r.localAi = { runtimeJson: ai.filter((x) => x.path === '/__local_ai/runtime.json').length, requests: ai.filter((x) => !x.path.startsWith('/__local_ai/model/')).map((x) => `${x.status} ${x.path}${x.shim ? ' (served by smoke)' : ''}`),
    modelRequests: model.length, modelBytes: model.reduce((a, x) => a + x.bytes, 0), modelFirstRequestMs: model.length ? Math.min(...model.map((x) => x.t)) - t0 : null, modelLastDoneMs: model.length ? Math.max(...model.map((x) => x.done ?? 0)) - t0 : null };
  const lib = reqLog.filter((x) => x.path.startsWith('/library/creature-finish-source/')); r.finishSourceRequests = lib.map((x) => `${x.status} ${x.path}`);
  r.finishModuleRequests = reqLog.filter((x) => x.path.includes('creature-finish') && !x.path.startsWith('/library/')).map((x) => `${x.status} ${x.path}${x.rewrites !== undefined ? ' (rewrites ' + x.rewrites + ')' : ''}`);
  r.identityRewrites = identityRewrites; r.phaseMs = Date.now() - t0;
  return r;
}

const check = (r, key, ok, detail) => { r.checks[key] = { ok: !!ok, detail }; return ok; };
const shown = (r) => r.afterReload ?? r.reopen;
const report = { tool: 'finish-smoke.mjs', date: new Date().toISOString(), serverStartMs, previewUrlInner: preview.url, origin, crab: { family: crab.family, card: crab.card.earthName, fit: crab.fit.earthName, seed: crab.g.seed },
  shims: ['git ls-files maxBuffer (process-local; unpatched preview server throws spawnSync git ENOBUFS)', 'finish phase only: /__local_ai/creature-finish-math.mjs served by the smoke proxy'], phases: [] };
try {
  for (const p of PHASES) {
    if (p === 'control') { const r = await phase('control', { query: '', shim: true, observeMs: 30000 }); report.phases.push(r);
      check(r, 'nothing retained', r.storeFinal.count === 0, JSON.stringify(r.storeFinal).slice(0, 300));
      check(r, 'no finish worker', r.finishWorker.length === 0, `${r.finishWorker.length} finish-worker events`);
      // (the game's boot always reads /__local_ai/runtime.json for local-ai-game; the finisher's own traffic is the model files + finish sources)
      check(r, 'no model files or finish sources fetched', r.localAi.modelRequests === 0 && r.finishSourceRequests.length === 0, JSON.stringify({ model: r.localAi.modelRequests, finishSources: r.finishSourceRequests }));
      check(r, 'portrait unchanged on reopen', r.first.sha === shown(r).sha, `${r.first.sha} vs ${shown(r).sha}`);
      check(r, 'zero page errors', r.pageErrors.length === 0, r.pageErrors.join(' | ').slice(0, 600)); }
    else if (p === 'shipped') { const r = await phase('shipped', { query: '?finish=1', shim: false, finishTimeoutMs: 120000 }); report.phases.push(r);
      r.observed = { retained: r.storeFinal.count, finishWorkerEvents: r.finishWorker.map((x) => x.ev + (x.type ? ':' + x.type : '') + (x.message ? ' ' + x.message.slice(0, 160) : '')), finishMath: r.localAi.requests.filter((x) => x.includes('creature-finish-math')) };
      check(r, 'zero page errors', r.pageErrors.length === 0, r.pageErrors.join(' | ').slice(0, 600)); }
    else if (p === 'finish') { const r = await phase('finish', { query: '?finish=1', shim: true, finishTimeoutMs: 120000 }); report.phases.push(r);
      r.observed = { retained: r.storeFinal.count, finishWorkerEvents: r.finishWorker.length, finishSourcesFetched: r.finishSourceRequests.length, modelRequests: r.localAi.modelRequests, portraitChanged: shown(r).sha !== r.first.sha };
      check(r, 'zero page errors', r.pageErrors.length === 0, r.pageErrors.join(' | ').slice(0, 600)); }
    else if (p === 'patched') { const r = await phase('patched', { query: '?finish=1', shim: true, patch: true, finishTimeoutMs: FINISH_TIMEOUT }); report.phases.push(r);
      check(r, 'both in-flight rewrites applied', r.identityRewrites >= REWRITES.length && REWRITES.every(([m]) => r.finishModuleRequests.some((x) => x.includes(m) && x.includes('(rewrites 1)'))), `${r.identityRewrites} rewrites; ${r.finishModuleRequests.join(', ')}`);
      const post = r.finishWorker.find((x) => x.ev === 'post'), done = r.finishWorker.find((x) => x.ev === 'message' && x.type === 'complete');
      const loaded = r.finishWorker.filter((x) => x.type === 'progress' && x.phase === 'loaded'), inf = r.finishWorker.filter((x) => x.type === 'progress' && x.phase === 'inference-complete');
      r.timings = { portraitOpenToJobPostMs: post ? post.t - r.first.openedAtMs : null, jobPostToCompleteMs: post && done ? done.t - post.t : null,
        modelSessionsLoaded: loaded.map((x) => ({ stage: x.stage, elapsedMs: Math.round(x.elapsedMs) })), inferences: inf.map((x) => ({ stage: x.stage, elapsedMs: Math.round(x.elapsedMs) })),
        steps: r.finishWorker.filter((x) => x.type === 'progress' && x.phase === 'step').length, modelTransferMs: r.localAi.modelLastDoneMs !== null ? r.localAi.modelLastDoneMs - r.localAi.modelFirstRequestMs : null, modelBytes: r.localAi.modelBytes };
      check(r, 'finish job posted after portrait open', !!post && post.stage === 'creature-finish-v1', JSON.stringify(post ?? null));
      check(r, 'model ran (worker complete)', !!done, JSON.stringify(done ?? r.finishWorker.filter((x) => x.ev === 'error' || x.type === 'error')).slice(0, 600));
      check(r, 'one finished original retained', r.storeFinal.count === 1, JSON.stringify(r.storeFinal.rows).slice(0, 600));
      check(r, 'portrait differs from unfinished', !!shown(r).sha && shown(r).sha !== r.first.sha, `first ${r.first.sha} → ${r.afterReload ? 'after reload' : 'reopen'} ${shown(r).sha}${r.afterReload ? ` (reopen alone: ${r.reopen.sha})` : ''}`);
      check(r, 'zero page errors', r.pageErrors.length === 0, r.pageErrors.join(' | ').slice(0, 600)); }
  }
  const failed = report.phases.flatMap((p) => Object.entries(p.checks).filter(([, v]) => !v.ok).map(([k, v]) => `${p.phase}: ${k} — ${v.detail}`));
  report.failed = failed; report.status = failed.length ? 'FAIL' : 'PASS'; if (failed.length) process.exitCode = 1;
} catch (e) { report.status = 'FAIL'; report.error = String(e?.stack ?? e).slice(0, 2000); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n'); proxy.closeAllConnections(); proxy.close(); await preview.close().catch(() => {}); }
console.log(JSON.stringify({ status: report.status, error: report.error, failed: report.failed, phases: report.phases.map((p) => ({ phase: p.phase, first: p.first?.sha?.slice(0, 16), reopen: p.reopen?.sha?.slice(0, 16), afterReload: p.afterReload?.sha?.slice(0, 16), retained: p.storeFinal?.count, timings: p.timings, observed: p.observed, pageErrors: p.pageErrors?.length })) }, null, 1));
