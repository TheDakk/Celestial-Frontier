// The MATCHUP PICKER in the real built game, in Edge (2026-09-24): serves a built playtest package on loopback, opens
// `/?battle2=1&vs=<L>,<R>`, waits for the battle2 study to report `playing` (or fails with its reason), screenshots mid-fight,
// then drives the picker's own controls (two selects + Play) to a second matchup and screenshots again. Writes a report.
// Run from port/v2 with approved out-of-sandbox execution (browser-owning):
//   node ../../audits/BATTLE2_LIBRARY_20260924/picker-smoke.mjs <packageDir> <outDir> <Left,Right> <Left2,Right2>
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// --no-sw: answer 404 for /service-worker.js so the page is never worker-controlled — separates the arena from the production worker's
// known /battle2/ 503 (Codex's pwa-build.ts; picker-smoke-03-sw-503 is that run). Mirrors the dev server, which registers no worker.
const NO_SW = process.argv.includes('--no-sw');
// --phone: an iPhone-class portrait viewport (390×844 CSS px, DPR 3, touch) instead of the 1280×800 desktop (mobile-first law)
const PHONE = process.argv.includes('--phone');
// --sw-control: the page must be CONTROLLED by the production service worker for every run (register, wait until ready, reload),
// then a third run reloads with the server refusing every /battle2/ file: the arena must stage from the worker's first-use cache.
const SW_CONTROL = process.argv.includes('--sw-control');
if (SW_CONTROL && NO_SW) throw Error('--sw-control and --no-sw are exclusive');
// --duel: a REAL duel with the Combat Chronicle under the stage (&duel=1): samples every 200 ms when each log row appears
// against the stage's turn, and requires the log to be PACED by the stage (rows spread over the fight, not the 240 ms cadence).
const DUEL = process.argv.includes('--duel');
let refuseArena = false; const arenaHits = { served: 0, refused: 0 }, libraryHits = { served: 0, refused: 0 };
const [pkgArg, outArg, firstArg = 'Salmon,Octopus', secondArg = 'Eagle,Python'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pkgArg || !outArg) throw Error('usage: picker-smoke.mjs <packageDir> <outDir> [Left,Right] [Left2,Right2]');
const root = path.resolve(pkgArg), out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (rel.endsWith('/')) rel += 'index.html'; const file = path.join(root, rel);
  // G3: the on-demand art library (/library/) is refused offline too, so the third run proves it is served from the worker's verified cache
  if (rel.startsWith('/battle2/') || rel.startsWith('/library/')) { if (rel.startsWith('/library/')) libraryHits[refuseArena ? 'refused' : 'served']++; if (refuseArena) { arenaHits.refused++; res.writeHead(404).end(); return; } arenaHits.served++; }
  if ((NO_SW && rel === '/service-worker.js') || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream'); res.end(fs.readFileSync(file)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port, report = { package: path.basename(root), serviceWorker: NO_SW ? 'refused (--no-sw)' : 'served', viewport: PHONE ? 'phone 390x844@3 touch' : 'desktop 1280x800@1', swControl: SW_CONTROL, runs: [] };
let browser;
try {
  browser = await openChromiumCdp({ label: 'battle2 matchup picker smoke', userDataPrefix: 'cf-battle2-picker', commandTimeoutMs: 60000 }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result.value; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await send('Page.enable'); await send('Runtime.enable');
  // every page error (a throw inside a ticker callback stops Pixi's shared ticker, so it must be seen) — reported in the report
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__cfErrors=[];addEventListener('error',e=>window.__cfErrors.push(String(e.error&&e.error.stack||e.message).slice(0,600)));addEventListener('unhandledrejection',e=>window.__cfErrors.push('rejection: '+String(e.reason&&e.reason.stack||e.reason).slice(0,600)));" }); await send('Emulation.setDeviceMetricsOverride', PHONE ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true } : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }); if (PHONE) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const waitStudy = async (label, generation, textIncludes) => { const deadline = Date.now() + 120000; for (;;) {
      const s = await evaluate(`(() => { const sec = document.querySelector('section[data-battle2-stage]'); const o = document.querySelector('[data-battle2-matchup] output'); return sec ? { status: sec.dataset.battle2Status, generation: sec.dataset.battle2Generation, reason: sec.dataset.battle2Reason ?? null, text: o ? o.textContent : null } : { status: 'none', text: o ? o.textContent : null }; })()`);
      if (s.status === 'failed') throw Error(`${label}: study failed — ${s.reason} (${s.text})`);
      if ((s.status === 'playing' || s.status === 'finished') && (generation === undefined || s.generation === String(generation)) && (textIncludes === undefined || (s.text ?? '').includes(textIncludes))) return s;
      if (Date.now() > deadline) throw Error(`${label}: study did not start (${JSON.stringify(s)})`); await sleep(250); } };
  const shot = async (file) => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64')); return file; };
  const controlled = () => evaluate('!!(navigator.serviceWorker && navigator.serviceWorker.controller)');
  // how many sides are PAINTED parts rigs (not the fixture/portrait fallback): the stage label names each side's rig
  const paintedSides = async () => { const l = await evaluate(`document.querySelector('section[data-battle2-stage]')?.dataset.battle2Label ?? ''`); return { label: l, painted: (l.match(/contact: /g) ?? []).length }; };
  const firstUrl = `http://127.0.0.1:${port}/?battle2=1&vs=${encodeURIComponent(firstArg)}${DUEL ? '&duel=1' : ''}`;
  if (SW_CONTROL) { // install the worker on a plain page first, then come back controlled
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); const until = Date.now() + 120000;
    for (;;) { const ok = await evaluate('navigator.serviceWorker ? navigator.serviceWorker.ready.then(() => true) : false').catch(() => false); if (ok) break; if (Date.now() > until) throw Error('service worker never became ready'); await sleep(500); }
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await sleep(1500);
    if (!(await controlled())) throw Error('page is not controlled by the service worker after reload');
  }
  // run 1: from the URL
  await send('Page.navigate', { url: firstUrl });
  const s1 = await waitStudy('first matchup');
  if (DUEL) { // sample the log against the stage until the Chronicle completes (share button) or 90 s pass
    const samples = [], t0 = Date.now(); let shot1 = null;
    for (;;) { const x = await evaluate(`(() => { const m = document.querySelector('[data-battle2-matchup]'); const sec = m?.querySelector('section[data-battle2-stage]'); return { rows: m ? m.querySelectorAll('[data-combat-chronicle-kind]').length : 0, done: !!m?.querySelector('[data-combat-chronicle-share]'), phase: sec?.dataset.battle2Status ?? null, turn: sec?.dataset.battle2Turn ?? null, ticks: sec?.dataset.battle2Ticks ?? null }; })()`);
      samples.push({ ms: Date.now() - t0, ...x }); if (!shot1 && Date.now() - t0 > 3500) shot1 = await shot('picker-duel-mid.png');
      if (x.done || Date.now() - t0 > 90000) break; await sleep(200); }
    const increments = samples.filter((x, i) => i > 0 && x.rows > samples[i - 1].rows), firstRow = increments[0]?.ms ?? null, lastRow = increments.at(-1)?.ms ?? null;
    report.pageErrorsDuringDuel = await evaluate('window.__cfErrors');
    report.duel = { trace: samples.filter((x, i) => i % 10 === 0).map((x) => [x.ms, x.rows, x.turn, x.ticks, x.phase]), samples: samples.length, increments: increments.map((x) => ({ ms: x.ms, rows: x.rows, stage: x.phase })), completed: samples.at(-1).done, spreadMs: firstRow !== null && lastRow !== null ? lastRow - firstRow : null };
    await shot('picker-duel-end.png');
    if (!report.duel.completed) throw Error('duel: the Chronicle never completed');
    // the legacy cadence reveals every step within ~steps × 240 ms; paced by the stage the rows spread over several seconds
    if (!(report.duel.spreadMs > 3000) || increments.length < 3) throw Error('duel: the log was not paced by the stage ' + JSON.stringify(report.duel.increments));
  } else await sleep(2500);
  report.runs.push({ from: 'url', vs: firstArg, status: s1.status, generation: s1.generation, text: await evaluate(`document.querySelector('[data-battle2-matchup] output').textContent`), still: await shot('picker-1.png') });
  { const l = await evaluate(`document.querySelector('[data-battle2-matchup] section[data-battle2-stage]')?.dataset.battle2Label ?? ''`); report.runs[0].rigs = { label: l, painted: (l.match(/contact: /g) ?? []).length }; }
  // run 2: through the picker's own controls
  const [l2, r2] = secondArg.split(',');
  await evaluate(`(() => { const root = document.querySelector('[data-battle2-matchup]'); const [a, b] = root.querySelectorAll('select'); a.value = ${JSON.stringify(l2)}; b.value = ${JSON.stringify(r2)}; root.querySelector('button').click(); return true; })()`);
  const s2 = DUEL ? await waitStudy('second matchup', undefined, `real duel · ${l2} vs`) : await waitStudy('second matchup', Number(s1.generation) + 1); await sleep(2500);
  report.runs.push({ from: 'controls', vs: secondArg, status: s2.status, generation: s2.generation, text: await evaluate(`document.querySelector('[data-battle2-matchup] output').textContent`), still: await shot('picker-2.png') });
  if (SW_CONTROL) {
    report.runs[0].controlled = report.runs[1].controlled = await controlled(); report.arenaHitsBeforeOffline = { ...arenaHits };
    report.runs[1].rigs = await paintedSides(); if (report.runs[1].rigs.painted !== 2) throw Error('run 2 is not two painted rigs: ' + report.runs[1].rigs.label);
    if (!report.runs[0].controlled) throw Error('the arena was not staged under the service worker');
    // run 3: the server now refuses every arena file; a controlled reload must stage from the first-use cache
    refuseArena = true; await send('Page.navigate', { url: firstUrl });
    const s3 = await waitStudy('offline reuse'); await sleep(2500);
    report.runs.push({ from: 'reload, arena refused by the server', vs: firstArg, status: s3.status, controlled: await controlled(), text: await evaluate(`document.querySelector('[data-battle2-matchup] output').textContent`), still: await shot('picker-3-offline.png') });
    report.arenaHits = { ...arenaHits }; report.libraryHits = { ...libraryHits }; report.runs[2].rigs = await paintedSides();
    if (!report.runs[2].controlled) throw Error('offline run was not controlled');
    if (report.runs[2].rigs.painted !== 2 || arenaHits.refused !== 0) throw Error('offline reuse did not stage both painted rigs from the cache: ' + JSON.stringify({ rigs: report.runs[2].rigs, arenaHits }));
    // control: a pair never staged before has nothing cached, so with the arena refused it must FAIL (else run 3 proved nothing)
    // the cold pair must be two creatures NEITHER run staged (else their files are legitimately cached)
    const used = new Set([...firstArg.split(','), ...secondArg.split(',')]), cold = ['Starfish', 'Octopus', 'Tarantula', 'Centipede', 'Fruit Bat', 'Chimpanzee', 'Crab', 'Beetle', 'Eagle', 'Python'].filter((n) => !used.has(n)).slice(0, 2).join(','); let coldFailed = null;
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/?battle2=1&vs=${encodeURIComponent(cold)}` });
    let coldRigs = null; try { await waitStudy('cold control'); coldRigs = await paintedSides(); } catch (e) { coldFailed = String(e.message).slice(0, 300); }
    report.coldControl = { vs: cold, failed: coldFailed, rigs: coldRigs, arenaHits: { ...arenaHits } };
    // an uncached pair cannot stage PAINTED rigs with the arena refused (it fails, or falls back to fixture/portrait rigs)
    if (coldFailed === null && coldRigs?.painted === 2) throw Error('control: an uncached pair staged two painted rigs with the arena refused — the refusal never applied');
    if (arenaHits.refused === 0) throw Error('control: the server refused nothing');
  }
  report.pageErrors = await evaluate('window.__cfErrors'); if (report.pageErrors.length) throw Error('page errors: ' + report.pageErrors.join(' | ').slice(0, 900));
  report.status = 'PASS';
} catch (e) { report.status = 'FAIL'; report.error = String(e?.stack ?? e).slice(0, 1200); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n'); try { await browser?.close(); } catch { /* closing */ } server.close(); }
console.log(JSON.stringify(report).slice(0, 1500));
