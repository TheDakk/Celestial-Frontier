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
const [pkgArg, outArg, firstArg = 'Salmon,Octopus', secondArg = 'Eagle,Python'] = process.argv.slice(2).filter((a) => a !== '--no-sw' && a !== '--phone');
if (!pkgArg || !outArg) throw Error('usage: picker-smoke.mjs <packageDir> <outDir> [Left,Right] [Left2,Right2]');
const root = path.resolve(pkgArg), out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (rel.endsWith('/')) rel += 'index.html'; const file = path.join(root, rel);
  if ((NO_SW && rel === '/service-worker.js') || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream'); res.end(fs.readFileSync(file)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port, report = { package: path.basename(root), serviceWorker: NO_SW ? 'refused (--no-sw)' : 'served', viewport: PHONE ? 'phone 390x844@3 touch' : 'desktop 1280x800@1', runs: [] };
let browser;
try {
  browser = await openChromiumCdp({ label: 'battle2 matchup picker smoke', userDataPrefix: 'cf-battle2-picker', commandTimeoutMs: 60000 }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result.value; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', PHONE ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true } : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }); if (PHONE) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const waitStudy = async (label, generation) => { const deadline = Date.now() + 120000; for (;;) {
      const s = await evaluate(`(() => { const sec = document.querySelector('section[data-battle2-stage]'); const o = document.querySelector('[data-battle2-matchup] output'); return sec ? { status: sec.dataset.battle2Status, generation: sec.dataset.battle2Generation, reason: sec.dataset.battle2Reason ?? null, text: o ? o.textContent : null } : { status: 'none', text: o ? o.textContent : null }; })()`);
      if (s.status === 'failed') throw Error(`${label}: study failed — ${s.reason} (${s.text})`);
      if ((s.status === 'playing' || s.status === 'finished') && (generation === undefined || s.generation === String(generation))) return s;
      if (Date.now() > deadline) throw Error(`${label}: study did not start (${JSON.stringify(s)})`); await sleep(250); } };
  const shot = async (file) => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64')); return file; };
  // run 1: from the URL
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/?battle2=1&vs=${encodeURIComponent(firstArg)}` });
  const s1 = await waitStudy('first matchup'); await sleep(2500);
  report.runs.push({ from: 'url', vs: firstArg, status: s1.status, generation: s1.generation, text: await evaluate(`document.querySelector('[data-battle2-matchup] output').textContent`), still: await shot('picker-1.png') });
  // run 2: through the picker's own controls
  const [l2, r2] = secondArg.split(',');
  await evaluate(`(() => { const root = document.querySelector('[data-battle2-matchup]'); const [a, b] = root.querySelectorAll('select'); a.value = ${JSON.stringify(l2)}; b.value = ${JSON.stringify(r2)}; root.querySelector('button').click(); return true; })()`);
  const s2 = await waitStudy('second matchup', Number(s1.generation) + 1); await sleep(2500);
  report.runs.push({ from: 'controls', vs: secondArg, status: s2.status, generation: s2.generation, text: await evaluate(`document.querySelector('[data-battle2-matchup] output').textContent`), still: await shot('picker-2.png') });
  report.status = 'PASS';
} catch (e) { report.status = 'FAIL'; report.error = String(e?.stack ?? e).slice(0, 1200); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n'); try { await browser?.close(); } catch { /* closing */ } server.close(); }
console.log(JSON.stringify(report).slice(0, 1500));
