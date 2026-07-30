// COLD-BOOT gate (ROADMAP NEXT #6 — the round-7 "cold-boot outlier").
//
// WHAT THE EXTERNAL ROUND ACTUALLY MEASURED (audits/round-7-v1.8.2/data/boot-ab.txt):
// 3 of 8 reps reached an interactive name gate in ~2.1-2.3s vs ~0.5s. They flagged
// it as possible "first-load cache warming on the larger file" and said 8 reps
// could not separate that from a real regression. But their own numbers already
// rule cache out: in the SLOW reps load=409ms and DCL=384ms — indistinguishable
// from the fast reps. The file was fully downloaded, parsed AND executed at ~400ms
// EVERY time. Nothing about the network or the payload size differed.
//
// So the ~1.85s sits entirely AFTER load, and `askExplorerName(true)` runs
// SYNCHRONOUSLY in the inline script (main.js, @section bootstrap) — the gate is in
// the DOM before DCL. A Playwright/rAF visibility poll runs IN THE PAGE, so the only
// way it can report late is a BLOCKED MAIN THREAD. That is a different defect with a
// different fix, and it is the one a player actually feels: a button that is painted
// but does not answer.
//
// THIS GATE THEREFORE DECOMPOSES first-interactive instead of timing it:
//   network      responseEnd / transferSize / encodedBodySize
//   in the DOM   DCL — the inline script has run, so the gate exists
//   painted      first rAF frame where #nameok has a real box
//   RESPONSIVE   first frame after that which arrives within FRAME_OK of its
//                predecessor — i.e. the thread is no longer blocked
//   why          longtask entries, and how much of them land after DCL
// A rAF callback cannot run while the main thread is blocked, so "painted" and
// "responsive" are late BY CONSTRUCTION when it is — that lateness is the number
// we are chasing, and the longtask list attributes it.
//
// ARMS (a paired experiment, because only paired deltas mean anything on one host):
//   --profile=fresh|warm  fresh = a brand-new user-data-dir per rep, so a true
//                         first-time visitor: cold HTTP cache AND cold V8 code
//                         cache. warm = one profile reused, i.e. a returning
//                         player. If fresh is uniformly slow and warm is fast, the
//                         "warming" story is right and it costs every new player.
//                         If BOTH are slow, it is our own boot path.
//   --save=none|done      none = no save, so boot takes the setTimeout(startNewGame,120)
//                         path (goTo builds Sol, planetThumb generates HD art).
//                         done = a seeded finished-training save, which resumes
//                         instead. This isolates startNewGame as the suspect.
//   --cpu=N               CPU throttle. Nick's primary device is an iPhone; a
//                         desktop-speed number is the best case, not the case.
//
// Usage: node tools/bootperf.js [--reps=8] [--profile=fresh] [--save=none]
//                               [--cpu=1] [--url=FILE] [--json=OUT] [--quiet]
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const os = require('os');
const { spawn } = require('child_process');
const root = path.join(__dirname, '..');

/* browser resolution — identical list to uilayout.js so both gates agree on
   which browser "a real browser" means (CF_BROWSER wins, for CI portability) */
const EDGE = process.env.CF_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => { try { return fs.existsSync(p); } catch (_) { return false; } }) ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const arg = (name, dflt) => {
  const a = process.argv.find((x) => x.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : dflt;
};
const REPS = Math.max(1, parseInt(arg('reps', '8'), 10) || 8);
const PROFILE = arg('profile', 'fresh');
const SAVEARM = arg('save', 'none');
const CPU = Math.max(1, parseFloat(arg('cpu', '1')) || 1);
const QUIET = process.argv.includes('--quiet');
const JSONOUT = arg('json', '');
const GAME_FILE = arg('url', path.join(root, 'celestial-frontier.html'));
/* a frame arriving within this of its predecessor means the thread is free.
   60Hz is 16.7ms; 50ms is ~3 dropped frames — generous, so "responsive" is a
   claim we can defend rather than a knife-edge. */
const FRAME_OK = 50;
/* how long to let a rep run before giving up on a responsive gate */
const REP_TIMEOUT_MS = 30000;
/* KEEP OBSERVING THIS LONG PAST `load`. The first cut of this gate stopped the
   instant the gate went responsive, so a stall that began later was invisible —
   the negative control (a deliberate 1500ms block at 600ms) reported 0ms and
   "passed". A longtask census whose window closes at TTI is not a census. */
const SETTLE_MS = Math.max(0, parseInt(arg('settle', '2500'), 10) || 0);
/* the round-7 signature threshold: they saw ~2.1s vs a ~0.5s baseline, so 1000ms
   sits clear of both. A rep at or above this is the defect reproducing. */
const SIG_MS = Math.max(1, parseInt(arg('sig', '1000'), 10) || 1000);
/* the surface whose answerability we time. Defaults to the first-run name gate,
   because that is the screen every new player meets first. --save=done never
   shows it, so that arm must anchor somewhere else. */
const GATE = arg('gate', '#nameok');
const CPUPROF = process.argv.includes('--cpuprofile');
const ASSERT = process.argv.includes('--assert');
/* 900ms sits clear of both measured states (3,874 before / ~438 after) rather
   than hugging either — a threshold tuned to the current number would fail on
   host noise and teach everyone to ignore it. */
const BUDGET = Math.max(1, parseInt(arg('budget', '900'), 10) || 900);

/* ---- the seeded save for --save=done. Deliberately minimal: enough for
   loadSaveWithRecovery to take the "had a save, training finished" branch, so
   boot resumes instead of calling startNewGame. Absent fields must default
   safely (CLAUDE.md rule 6), which is exactly why this can stay this small. */
const SEED_SAVE = JSON.stringify({ me: 'Boot Gate', tut: true, tips: true });

/* ================= the in-page probe =================
   Installed via Page.addScriptToEvaluateOnNewDocument, so it runs BEFORE the
   game's inline script — nothing it measures can already have happened. */
function probeSource(saveArm) {
  return `(function(){
  var B = window.__BP__ = { lt: [], frames: [], paintedAt: null, domNameAt: null };
  try{ localStorage.clear();
       ${saveArm === 'done' ? 'localStorage.setItem("cfcc_save_v2", ' + JSON.stringify(SEED_SAVE) + ');' : ''}
  }catch(_){}
  /* WHY longtask and not a wall-clock guess: a longtask entry is the browser's
     own report that the main thread was occupied for >50ms, with a start and a
     duration. Summing the ones after DCL attributes the stall to our code
     rather than inferring it. */
  try {
    new PerformanceObserver(function(l){
      l.getEntries().forEach(function(e){
        if (B.lt.length < 400) B.lt.push({ s: Math.round(e.startTime), d: Math.round(e.duration) });
      });
    }).observe({ entryTypes: ['longtask'], buffered: true });
  } catch(_){}
  /* A MutationObserver callback is a microtask: it cannot run mid-longtask
     either, but it DOES fire the instant one ends, and it tells us the gate was
     put in the DOM by the synchronous boot rather than by later async work.
     (The authoritative "in the DOM" number is DCL; this is the corroboration.) */
  try {
    var mo = new MutationObserver(function(){
      if (B.domNameAt === null && document.getElementById('nameok')) {
        B.domNameAt = Math.round(performance.now()); mo.disconnect();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch(_){}
  function tick(now){
    if (B.frames.length < 2000) B.frames.push(Math.round(now));
    if (B.paintedAt === null) {
      var el = document.querySelector(${JSON.stringify(GATE)});
      if (el) {
        var r = el.getBoundingClientRect();
        /* a real box AND actually laid out — display:none yields 0x0, and an
           element the player cannot see is not a gate they can answer */
        if (r.width > 0 && r.height > 0) {
          B.paintedAt = Math.round(now);
          /* EVIDENCE, not decoration: the first run of this gate reported a
             painted gate BEFORE DCL, which is impossible if the synchronous
             boot is what reveals it. Recording the state at the paint frame is
             what distinguishes "boot ran early" from "the check is lying" —
             and it showed readyState:'loading' with an inline display:flex,
             i.e. boot really had already run. */
          var host = el.closest('div[id]');
          B.paintState = { rs: document.readyState, inline: host ? host.style.display : '-',
            disp: host ? getComputedStyle(host).display : '-', w: Math.round(r.width), h: Math.round(r.height) };
        }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();`;
}

/* ================= CDP plumbing (stdlib only: fetch + native WebSocket) ================= */
let seq = 0, ws = null, pend = new Map();
function send(method, params, sessionId) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
  return new Promise((res, rej) => pend.set(id, { res, rej }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evalIn(sess, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('page eval: ' + String((d.exception && d.exception.description) || d.text).slice(0, 300));
  }
  return r.result && r.result.value;
}

async function launch() {
  const udd = path.join(os.tmpdir(), 'cf-bootperf-' + process.pid + '-' + (seq + Math.floor(process.hrtime()[1] / 1e3)));
  const port = 9600 + (process.pid % 300);
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
  let browserWs = null;
  for (let t = 0; t < 60 && !browserWs; t++) {
    await sleep(300);
    try { const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); browserWs = v.webSocketDebuggerUrl; } catch (_) {}
  }
  if (!browserWs) { try { proc.kill(); } catch (_) {} throw new Error('CDP endpoint never came up'); }
  ws = new WebSocket(browserWs);
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  };
  await new Promise((r) => { ws.onopen = r; });
  return { proc, udd };
}
async function shutdown(br) {
  try { ws && ws.close(); } catch (_) {}
  pend.clear();
  try { br.proc.kill(); } catch (_) {}
  await sleep(250);
  try { fs.rmSync(br.udd, { recursive: true, force: true }); } catch (_) {}
}

/* ================= one rep ================= */
async function measure(url) {
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const sess = at.sessionId;
  await send('Runtime.enable', {}, sess);
  await send('Page.enable', {}, sess);
  /* 393x852 = iPhone 14 Pro, the primary device (CLAUDE.md rule 11) */
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true }, sess);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sess);
  if (CPU > 1) await send('Emulation.setCPUThrottlingRate', { rate: CPU }, sess);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: probeSource(SAVEARM) }, sess);
  /* ATTRIBUTION, not inference. The longtask list says WHEN the thread was
     blocked; only a sampling profile says by WHAT. Started before navigate so
     the whole boot is covered. */
  if (CPUPROF) {
    await send('Profiler.enable', {}, sess);
    await send('Profiler.setSamplingInterval', { interval: 200 }, sess);
    await send('Profiler.start', {}, sess);
  }
  await send('Page.navigate', { url }, sess);

  /* Poll from OUTSIDE the page for a responsive gate. The poll itself is a page
     eval, so it too is blocked while the thread is — which is fine: we read the
     probe's frame log, not the poll's own timing. */
  const t0 = Date.now();
  let out = null;
  while (Date.now() - t0 < REP_TIMEOUT_MS) {
    await sleep(150);
    try {
      out = await evalIn(sess, `(function(){
        var B = window.__BP__; if (!B) return null;
        var nav = performance.getEntriesByType('navigation')[0] || null;
        var fcpE = performance.getEntriesByName('first-contentful-paint')[0] || null;
        /* RESPONSIVE = the first frame at/after the paint whose gap from its
           predecessor is small. Before that the thread is still stalling. */
        var resp = null;
        if (B.paintedAt !== null) {
          for (var i = 1; i < B.frames.length; i++) {
            if (B.frames[i] >= B.paintedAt && (B.frames[i] - B.frames[i-1]) <= ${FRAME_OK}) { resp = B.frames[i]; break; }
          }
        }
        return {
          painted: B.paintedAt, responsive: resp, domName: B.domNameAt, now: Math.round(performance.now()),
          frames: B.frames.length, lt: B.lt, paintState: B.paintState || null,
          dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          load: nav ? Math.round(nav.loadEventEnd) : null,
          resp_end: nav ? Math.round(nav.responseEnd) : null,
          transfer: nav ? (nav.transferSize || 0) : null,
          encoded: nav ? (nav.encodedBodySize || 0) : null,
          fcp: fcpE ? Math.round(fcpE.startTime) : null
        };
      })()`);
    } catch (_) { out = out; }
    /* two conditions, both required: the gate has gone responsive, AND we have
       watched for SETTLE_MS past `load` so a later stall cannot hide */
    if (out && out.responsive !== null && out.load && out.now >= out.load + SETTLE_MS) break;
  }
  if (CPUPROF) {
    try {
      const prof = await send('Profiler.stop', {}, sess);
      out = out || {};
      out.hot = topSelfTime(prof.profile);
      out.art = artSelfTime(prof.profile);
    } catch (e) { /* a profile is evidence, not a gate — never fail the rep for it */ }
  }
  await send('Target.closeTarget', { targetId: t.targetId });
  if (!out) return { fail: 'probe never reported' };
  /* LONGTASK CENSUS, split at the moment the gate went responsive.
     before = main-thread time that DELAYS interactivity (the round-7 symptom)
     after  = jank a player meets once the gate is already up (a real but
              different defect — do not let one hide the other) */
  const gate = out.responsive != null ? out.responsive : (out.painted != null ? out.painted : 0);
  const clip = (e, lo, hi) => Math.max(0, Math.min(e.s + e.d, hi) - Math.max(e.s, lo));
  out.ltBeforeGate = out.lt.reduce((a, e) => a + clip(e, 0, gate), 0);
  out.ltAfterGate = out.lt.reduce((a, e) => a + clip(e, gate, Infinity), 0);
  out.ltWorst = out.lt.reduce((a, e) => Math.max(a, e.d), 0);
  out.ltWorstAt = (out.lt.find((e) => e.d === out.ltWorst) || {}).s;
  if (out.ltWorstAt === undefined) out.ltWorstAt = null;
  out.window = out.now;
  return out;
}

/* THE ART-HOLD LAW, measured (see main.js _hdLater).
   No HD sprite synthesis may run while the first-run naming screen is modal
   over the world: it is invisible there, and each render is a 300-800ms
   main-thread block standing between the player and the only control on screen.
   WHY THIS IS SOUND WITHOUT CORRELATING CLOCKS: in the --save=none arm the
   harness never types a name, so the intro screen is up for the WHOLE observed
   window. Art self-time over the entire profile therefore IS art time spent
   behind the intro — no mapping from profiler microseconds to performance.now()
   is needed, which is exactly where such a check would otherwise go wrong.
   Measured: 3,874ms before the fix, ~438ms after (the remainder is the
   synchronous galaxy-thumbnail path, which _hdLater deliberately does not gate). */
const ART_FNS = ['renderPlanetSprite', 'makeGalaxySprite', 'n2', 'fbm', 'surfaceColor', 'mix', 'hsl'];
function artSelfTime(profile) {
  if (!profile || !profile.nodes || !profile.samples) return null;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const d = profile.timeDeltas || [];
  let ms = 0;
  for (let i = 0; i < profile.samples.length; i++) {
    const n = byId.get(profile.samples[i]);
    if (n && n.callFrame && ART_FNS.indexOf(n.callFrame.functionName) >= 0) ms += Math.max(0, d[i] || 0) / 1000;
  }
  return Math.round(ms);
}

/* Aggregate a CDP sampling profile into self-time per function. The samples
   array is node ids at timeDeltas microsecond gaps, so self time is just the
   delta charged to whichever node was on top. */
function topSelfTime(profile, limit) {
  if (!profile || !profile.nodes || !profile.samples) return [];
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const d = profile.timeDeltas || [];
  for (let i = 0; i < profile.samples.length; i++) {
    const n = byId.get(profile.samples[i]);
    if (!n) continue;
    const cf = n.callFrame || {};
    /* (program)/(idle)/(garbage collector) are real but not actionable here */
    const name = (cf.functionName || '(anonymous)') + (cf.lineNumber >= 0 ? ':' + (cf.lineNumber + 1) : '');
    self.set(name, (self.get(name) || 0) + Math.max(0, d[i] || 0) / 1000);
  }
  return [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit || 12)
    .map(([name, ms]) => name + ' ' + Math.round(ms) + 'ms');
}

/* ================= gzipped static host (GitHub Pages conditions) =================
   file:// was never the right surface for this question: it has no transfer
   size, no Content-Encoding and a different cache path from the live site. */
function serve(file) {
  const raw = fs.readFileSync(file);
  const gz = zlib.gzipSync(raw, { level: 9 });
  const srv = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', String(gz.length));
    /* GitHub Pages serves a 10-minute max-age with an ETag; matching it keeps
       the warm-profile arm honest rather than accidentally uncacheable */
    res.setHeader('Cache-Control', 'max-age=600');
    res.setHeader('ETag', '"cf-' + gz.length + '"');
    res.end(req.method === 'HEAD' ? undefined : gz);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port, raw: raw.length, gz: gz.length })));
}

const med = (a) => { const s = a.filter((x) => x != null).slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const pad = (v, n) => String(v == null ? '-' : v).padStart(n);

async function main() {
  if (!fs.existsSync(EDGE)) { console.error('Browser not found at ' + EDGE); process.exit(2); }
  if (!fs.existsSync(GAME_FILE)) { console.error('Build not found: ' + GAME_FILE); process.exit(2); }
  const host = await serve(GAME_FILE);
  const url = 'http://127.0.0.1:' + host.port + '/game.html';
  console.log('BOOTPERF  ' + path.basename(GAME_FILE) + '  ' + host.raw.toLocaleString() + ' raw / ' +
    host.gz.toLocaleString() + ' gzip   profile=' + PROFILE + '  save=' + SAVEARM + '  cpu=' + CPU + 'x  reps=' + REPS);
  console.log('  viewport 393x852 dpr3 (iPhone 14 Pro).  RESPONSIVE = first frame within ' + FRAME_OK + 'ms of its predecessor at/after the gate paints.\n');

  const rows = [];
  let br = null;
  try {
    if (PROFILE === 'warm') br = await launch();
    for (let rep = 0; rep < REPS; rep++) {
      /* fresh = a whole new browser + profile, which is the only way to get a
         genuinely cold V8 code cache; a new incognito-ish context does not */
      if (PROFILE === 'fresh') { if (br) await shutdown(br); br = await launch(); }
      const m = await measure(url);
      m.rep = rep;
      rows.push(m);
      if (!QUIET) {
        if (m.fail) console.log('rep' + rep + '  FAIL — ' + m.fail);
        else console.log('rep' + rep +
          '  resp_end=' + pad(m.resp_end, 5) + '  DCL=' + pad(m.dcl, 5) + '  FCP=' + pad(m.fcp, 5) +
          '  load=' + pad(m.load, 5) + '  painted=' + pad(m.painted, 5) + '  TTI=' + pad(m.responsive, 5) +
          '  | blocked pre-gate=' + pad(m.ltBeforeGate, 5) + '  post-gate=' + pad(m.ltAfterGate, 5) +
          '  worst=' + pad(m.ltWorst, 5) + '@' + pad(m.ltWorstAt, 5) + '  win=' + pad(m.window, 5));
      }
    }
  } finally {
    if (br) await shutdown(br);
    host.srv.close();
  }

  const ok = rows.filter((r) => !r.fail);
  if (!ok.length) { console.error('\nno rep produced a measurement'); process.exit(1); }
  const M = (k) => med(ok.map((r) => r[k]));
  console.log('\n=== medians over ' + ok.length + ' reps ===');
  for (const k of ['resp_end', 'dcl', 'fcp', 'load', 'painted', 'responsive', 'ltBeforeGate', 'ltAfterGate', 'ltWorst']) {
    const vals = ok.map((r) => r[k]).filter((v) => v != null);
    console.log('  ' + k.padEnd(11) + pad(M(k), 6) + 'ms   (min ' + pad(Math.min.apply(null, vals), 5) +
      '  max ' + pad(Math.max.apply(null, vals), 5) + ')');
  }
  /* ===== THE VERDICT =====
     The question this gate exists to answer is not "how fast is boot" but
     "does the round-7 signature reproduce": a gate that is PAINTED but not
     ANSWERABLE for ~1.6s. That signature is `ltBeforeGate` being large — main
     thread time standing between the player and their first tap. TTI alone
     cannot distinguish it from a slow network, which is the confusion that
     produced the "cache warming" hypothesis in the first place. */
  const ttis = ok.map((r) => r.responsive).filter((v) => v != null);
  const slow = ttis.filter((v) => v >= SIG_MS);
  /* an arm can legitimately have NO TTI sample — --save=done never shows the
     name gate at all. Say so, rather than printing a median of nothing. The
     first cut reported "0/0 reps" and "slowest was -Infinity", which reads
     like a pass and is the shape of an assertion that cannot fail. */
  if (!ttis.length) {
    console.log('\n  NO TTI SAMPLE — the gate "' + GATE + '" never appeared in any rep.');
    console.log('  For --save=done that is expected (a returning player skips the name gate);');
    console.log('  pass --gate=SELECTOR to anchor on a surface this arm actually renders.');
    console.log('  main thread blocked, whole window ... ' + pad(M('ltAfterGate'), 6) + 'ms  (worst single ' + pad(M('ltWorst'), 5) + 'ms)');
    if (JSONOUT) writeJson(host, rows);
    return;
  }
  console.log('\n  network done by ................ ' + pad(M('resp_end'), 6) + 'ms   (' + (M('transfer') || 0).toLocaleString() + ' B over the wire)');
  console.log('  gate PAINTED ................... ' + pad(M('painted'), 6) + 'ms');
  console.log('  gate ANSWERABLE (TTI) .......... ' + pad(M('responsive'), 6) + 'ms   (worst rep ' + (ttis.length ? Math.max.apply(null, ttis) : '-') + 'ms)');
  console.log('  main thread blocked pre-gate ... ' + pad(M('ltBeforeGate'), 6) + 'ms   <-- the round-7 signature');
  console.log('  main thread blocked post-gate .. ' + pad(M('ltAfterGate'), 6) + 'ms   (jank after the gate is up)');
  console.log('\n  ---> ' + (slow.length
    ? 'REPRODUCED: ' + slow.length + '/' + ttis.length + ' reps took >=' + SIG_MS + 'ms to an answerable gate  [' + slow.join(', ') + ']'
    : 'NOT REPRODUCED: 0/' + ttis.length + ' reps reached ' + SIG_MS + 'ms; slowest was ' + Math.max.apply(null, ttis) + 'ms'));
  if (process.argv.includes('--verbose')) {
    for (const r of ok) console.log('  rep' + r.rep + ' longtasks: ' + (r.lt.length ? r.lt.map((e) => e.d + 'ms@' + e.s).join('  ') : '(none)'));
  }
  if (CPUPROF) for (const r of ok) if (r.hot) console.log('\n  rep' + r.rep + ' hottest (self time):\n    ' + r.hot.join('\n    '));

  /* ===== the ART-HOLD assertion (opt-in via --assert) ===== */
  if (ASSERT) {
    const arts = ok.map((r) => r.art).filter((v) => v != null);
    if (!CPUPROF || !arts.length) { console.error('\nASSERT needs --cpuprofile (no art self-time captured)'); process.exit(2); }
    if (SAVEARM !== 'none') { console.error('\nASSERT is only sound with --save=none (the intro must stay up all window)'); process.exit(2); }
    const worst = Math.max.apply(null, arts);
    console.log('\n  ART-HOLD  art self-time behind the intro: median ' + med(arts) + 'ms, worst ' + worst +
      'ms   budget ' + BUDGET + 'ms  [' + arts.join(', ') + ']');
    if (worst > BUDGET) {
      console.log('  FAIL  HD art is being synthesised while the first-run naming screen is modal.');
      console.log('        That work is invisible there and blocks the only control on screen.');
      console.log('        See main.js _hdLater — a scheduled upgrade must re-poll while _introUp().');
      process.exit(1);
    }
    console.log('  PASS  no HD synthesis behind the intro.');
  }
  if (JSONOUT) writeJson(host, rows);
}
function writeJson(host, rows) {
  fs.writeFileSync(path.join(root, JSONOUT), JSON.stringify({
    build: path.basename(GAME_FILE), raw: host.raw, gz: host.gz,
    profile: PROFILE, save: SAVEARM, cpu: CPU, gate: GATE,
    frameOk: FRAME_OK, settleMs: SETTLE_MS, sigMs: SIG_MS, rows,
  }, null, 2));
  console.log('\n  wrote ' + JSONOUT);
}
main().catch((e) => { console.error(e); process.exit(2); });
