// Settings → Mono audio / Reduced intensity on the LIVE dev site, through the real controls (2026-09-25): press each switch, read the
// button state and this device's stored preference, reload, and prove the choice came back. Run from port/v2, out of the sandbox.
import fs from 'node:fs'; import path from 'node:path';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
const url = process.argv[2] ?? 'https://dev-celestialfrontier.github.io/', out = path.resolve(process.argv[3] ?? '.');
const report = { url, steps: [] }; let browser;
try {
  browser = await openChromiumCdp({ label: 'audio settings smoke', userDataPrefix: 'cf-audio-settings', commandTimeoutMs: 60000 });
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true }), send = (m, p = {}) => browser.send(m, p, sessionId);
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result.value; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__cfErrors=[];addEventListener('error',e=>window.__cfErrors.push(String(e.error&&e.error.stack||e.message).slice(0,400)));" });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  const diag = () => evaluate(`(() => { const p = document.getElementById('setpanel'), d = document.getElementById('docksets'); return { panelDisplay: p ? getComputedStyle(p).display : null, panelHasVoice: !!document.querySelector('#setvoice'), panelHtml: p ? p.innerHTML.slice(0, 200) : null, dockDisabled: d ? (d.disabled || d.getAttribute('aria-disabled')) : null, training: !!document.querySelector('[data-training], .training, #tut'), title: document.title }; })()`).catch((e) => String(e));
  const waitFor = async (expr, label, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await evaluate(expr).catch(() => false)) return; await sleep(250); } throw Error('timed out: ' + label + ' · ' + JSON.stringify(await diag())); };
  const state = () => evaluate(`(() => { const m = document.querySelector('#setmono'), s = document.querySelector('#setsoft'); let stored = null; try { stored = localStorage.getItem('cf-v2-audio-accessibility/v1'); } catch {} return { mono: m?.getAttribute('aria-pressed') ?? null, soft: s?.getAttribute('aria-pressed') ?? null, stored }; })()`);
  // a fresh device starts Field Training, which holds panels closed: press its real Skip first (the slicesmoke way)
  const skipTraining = async () => { const end = Date.now() + 30000; while (Date.now() < end) { if (await evaluate(`(() => { const b = document.querySelector('[data-sel=tutskip]'); if (b) { b.click(); return true; } return false; })()`)) { await sleep(1000); return true; } await sleep(250); } return false; };
  const openSettings = async () => { await waitFor(`!!document.getElementById('docksets')`, 'settings dock button'); await evaluate(`document.getElementById('docksets').click()`); await waitFor(`!!document.querySelector('#setmono')`, 'Settings panel with #setmono'); };
  await send('Page.navigate', { url: url + '?cb=' + Date.now() }); report.trainingSkipped = await skipTraining(); await openSettings();
  report.steps.push({ step: 'fresh device', ...(await state()) });
  await evaluate(`document.querySelector('#setmono').click()`); report.steps.push({ step: 'pressed Mono', ...(await state()) });
  await evaluate(`document.querySelector('#setsoft').click()`); report.steps.push({ step: 'pressed Reduced intensity', ...(await state()) });
  await send('Page.reload', {}); await sleep(1500); await openSettings(); report.steps.push({ step: 'after reload', ...(await state()) });
  await evaluate(`document.querySelector('#setmono').click()`); report.steps.push({ step: 'pressed Mono again', ...(await state()) });
  const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'audio-settings.png'), Buffer.from(shot.data, 'base64'));
  report.pageErrors = await evaluate('window.__cfErrors');
  const want = [['false', 'false'], ['true', 'false'], ['true', 'true'], ['true', 'true'], ['false', 'true']];
  report.steps.forEach((s, i) => { if (s.mono !== want[i][0] || s.soft !== want[i][1]) throw Error(`step ${s.step}: got mono=${s.mono} soft=${s.soft}`); });
  if (JSON.parse(report.steps[4].stored ?? 'null')?.reducedIntensity !== true || JSON.parse(report.steps[4].stored).mono !== false) throw Error('stored preference wrong: ' + report.steps[4].stored);
  if (report.pageErrors.length) throw Error('page errors: ' + report.pageErrors.join(' | '));
  report.status = 'PASS';
} catch (e) { report.status = 'FAIL'; report.error = String(e?.stack ?? e).slice(0, 900); process.exitCode = 1; }
finally { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'audio-settings-report.json'), JSON.stringify(report, null, 1) + '\n'); console.log(JSON.stringify(report)); try { await browser?.close(); } catch {} }
