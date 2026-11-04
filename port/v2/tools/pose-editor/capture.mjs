#!/usr/bin/env node
/* Evidence capture for the pose editor: starts the dev server, drives a Chromium-family browser over CDP
 * (browser-owning: run OUTSIDE the macOS sandbox), waits for READY, selects an action and key pose, then
 * writes skeleton.png, painted.png, editor.png and report.json into a NEW directory.
 * Usage: node tools/pose-editor/capture.mjs <newEvidenceDir> [--action=melee:bite] [--pose=2] [--set=joint:deg]
 * --set applies one slider edit through the page API after the table screenshots and records both hashes. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../browsercdp.mjs'; import { startPoseEditorServer } from './serve.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..'), out = path.resolve(process.argv[2] ?? '');
const flag = (k, d) => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) ?? d;
const ACTION = flag('action', 'melee:bite'), POSE = Number(flag('pose', 2));
if (!process.argv[2] || fs.existsSync(out)) throw Error('Evidence directory must be new');
fs.mkdirSync(out, { recursive: true });
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'), git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).trim();
const report = { status: 'RUNNING', source: git('rev-parse', 'HEAD'), action: ACTION, pose: POSE, errors: [], files: [] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); persist();
let browser, server;
try {
  server = await startPoseEditorServer(); report.origin = server.origin; report.assets = Object.fromEntries(Object.entries(server.assets).map(([k, p]) => [k, { path: path.relative(repo, p), sha256: sha(fs.readFileSync(p)) }]));
  browser = await openChromiumCdp({ label: 'pose editor capture', userDataPrefix: 'cf-pose-editor', commandTimeoutMs: 60000, onEvent: (e) => { if (e.method === 'Runtime.exceptionThrown') report.errors.push(e.params.exceptionDetails); } }); report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' }), { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p = {}) => browser.send(m, p, sessionId), evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: server.origin + '/' });
  const deadline = performance.now() + 90000;
  for (;;) { const s = await evaluate('window.cfPoseEditor?.state.status'); if (s === 'FAIL') throw Error('Page failed: ' + await evaluate('window.cfPoseEditor.state.error')); if (s === 'READY') break; if (performance.now() > deadline) throw Error('Readiness deadline'); await new Promise((r) => setTimeout(r, 100)); }
  await evaluate(`window.cfPoseEditor.selectAction(${JSON.stringify(ACTION)}); window.cfPoseEditor.selectPose(${POSE}); 'ok'`);
  report.page = await evaluate('(() => { const s = window.cfPoseEditor.state; return { status: s.status, actionId: s.actionId, sel: s.sel, painted: s.painted, paintedLabel: s.paintedLabel, actionHash: s.result.hash, overlayHash: s.result.overlayHash, timelineHash: s.timeline.hash, scrubMs: s.scrubMs, statusLine: document.getElementById("status").textContent }; })()');
  report.exportedOverlay = await evaluate('window.cfPoseEditor.exportOverlay()');
  const shot = async (name, selector) => {
    const clip = selector ? await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 }; })()`) : undefined;
    const { data } = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' }); const file = path.join(out, name); fs.writeFileSync(file, Buffer.from(data, 'base64')); report.files.push({ file: name, selector: selector ?? 'page', sha256: sha(fs.readFileSync(file)) });
  };
  await shot('skeleton.png', '#skeleton'); await shot('painted.png', '#painted'); await shot('editor.png');
  const set = flag('set', null);
  if (set) { const [joint, deg] = set.split(':'); await evaluate(`window.cfPoseEditor.setJoint(${JSON.stringify(joint)}, ${Number(deg)}); 'ok'`);
    report.edit = { joint, deg: Number(deg), page: await evaluate('(() => { const s = window.cfPoseEditor.state; return { actionHash: s.result.hash, overlayHash: s.result.overlayHash, timelineHash: s.timeline.hash, statusLine: document.getElementById("status").textContent }; })()'), exportedOverlay: await evaluate('window.cfPoseEditor.exportOverlay()') };
    await shot('skeleton-edited.png', '#skeleton'); await shot('painted-edited.png', '#painted'); }
  report.status = report.errors.length ? 'FAIL' : 'REVIEW';
} catch (error) { report.status = 'FAIL'; report.error = String(error.stack ?? error); process.exitCode = 1; }
finally { await browser?.close(); await server?.close(); persist(); }
console.log(JSON.stringify({ status: report.status, out, page: report.page, files: report.files.map((f) => f.file), error: report.error }));
