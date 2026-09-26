// G5 STAGE smoke (2026-09-26): the battle stage draws a creature's admitted FINISHED atlas (Codex's delivered crab originals; phone tier,
// so no model) with the individual's morph on top, only under ?finish=1. Opens `?battle2=1&vs=<A>,<B>[&finish=1]` on a built package at
// 390x844@3 touch, waits for the study to play, and reads the stage's data-battle2-finished + label + page errors, with a still.
// Run from port/v2 outside the sandbox: node ../../audits/G5_ROUTING_20260926/stage-smoke/stage-smoke.mjs <packageDir> <outDir> [A,B]
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { openChromiumCdp } from '../../../port/v2/tools/browsercdp.mjs';
const [pkg, outArg, vs = 'Crab,Mud Crab'] = process.argv.slice(2); const root = path.resolve(pkg), out = path.resolve(outArg); fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.gz': 'application/gzip' };
let log = [];
const server = http.createServer((req, res) => { let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); log.push(rel); if (rel.endsWith('/')) rel += 'index.html'; const f = path.join(root, rel);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', TYPES[path.extname(f)] ?? 'application/octet-stream'); res.end(fs.readFileSync(f)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const origin = `http://127.0.0.1:${server.address().port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(name, query) {
  log = []; const r = { name, query };
  const browser = await openChromiumCdp({ label: 'G5 stage smoke ' + name, userDataPrefix: 'cf-g5-stage-smoke', commandTimeoutMs: 60000 });
  try {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
    const evaluate = async (e) => { const x = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (x.exceptionDetails) throw Error(JSON.stringify(x.exceptionDetails).slice(0, 400)); return x.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__cfErrors=[];addEventListener('error',e=>window.__cfErrors.push(String(e.error&&e.error.stack||e.message).slice(0,400)));addEventListener('unhandledrejection',e=>window.__cfErrors.push(String(e.reason&&e.reason.stack||e.reason).slice(0,400)));" });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.navigate', { url: `${origin}/?battle2=1&vs=${encodeURIComponent(vs)}${query}` });
    const deadline = Date.now() + 180000; let s = null;
    for (;;) { s = await evaluate(`(() => { const sec = document.querySelector('section[data-battle2-stage]'); return sec ? { status: sec.dataset.battle2Status ?? null, finished: sec.dataset.battle2Finished ?? null, label: sec.dataset.battle2Label ?? null } : null; })()`).catch(() => null);
      if (s && (s.status === 'playing' || s.status === 'finished' || s.status === 'failed')) break; if (Date.now() > deadline) break; await sleep(500); }
    await sleep(2500); r.stage = s; r.errors = await evaluate('window.__cfErrors || []');
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); r.still = name + '.jpg'; fs.writeFileSync(path.join(out, r.still), Buffer.from(data, 'base64'));
  } finally { try { await browser.close(); } catch {} }
  r.finishDeliveryFetches = log.filter((x) => x.startsWith('/library/creature-finish/')).length; r.finishSourceFetches = log.filter((x) => x.startsWith('/library/creature-finish-source/')).length;
  return r;
}
const report = { tool: 'stage-smoke', package: path.basename(root), vs, runs: [] };
try { const plain = await run('plain', ''), fin = await run('finish', '&finish=1'); report.runs.push(plain, fin);
  report.checks = { bothPlayed: [plain, fin].every((x) => x.stage && (x.stage.status === 'playing' || x.stage.status === 'finished')), plainHasNoFinishAttr: plain.stage?.finished === null,
    bothSidesFinished: fin.stage?.finished === 'left:true right:true', deliveryOnlyWithFlag: plain.finishDeliveryFetches === 0 && fin.finishDeliveryFetches > 0, zeroErrors: plain.errors.length === 0 && fin.errors.length === 0 };
  report.status = Object.values(report.checks).every(Boolean) ? 'PASS' : 'FAIL';
} catch (e) { report.status = 'ERROR'; report.error = String(e && e.stack || e); } finally { server.close(); }
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify({ status: report.status, checks: report.checks, stages: report.runs.map((x) => ({ n: x.name, s: x.stage?.status, f: x.stage?.finished, e: x.errors.length, d: x.finishDeliveryFetches })), error: report.error }));
