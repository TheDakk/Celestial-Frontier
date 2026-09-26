#!/usr/bin/env node
// Synthetic CDP calibration only. Never navigate to the game or a player profile.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {acquireWorkspaceLock} from './workspacelock.mjs';
import { openChromiumCdp } from './browsercdp.mjs';
import { createReviewTrailDebugger } from './ui-review-trail-debugger.mjs';
import { installNativeReviewTrace } from './ui-shell-review.mjs';

// Lock is retained through process exit, including receipt/cleanup failures.
acquireWorkspaceLock('navigation debugger review', {inheritFromParent:true});
const output = path.resolve(process.argv[2] ?? '');
assert(process.argv[2] && !fs.existsSync(output), 'supply a new calibration JSON path');
const report = { schema: 'cf-u1-navigation-debugger-calibration/v1', certification: false,
  startedAt: new Date().toISOString(), status: 'RUNNING', debugger: {}, controls: [] };
const write = () => fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
let browser, observer;
try {
  browser = await openChromiumCdp({ label: 'U1 synthetic navigation debugger calibration',
    userDataPrefix: 'cf-u1-nav-calibration', onEvent: event => observer?.onEvent(event) });
  report.browser = browser.browser;
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => browser.send(method, params, sessionId);
  observer = createReviewTrailDebugger({ send, sessionId, evidence: report.debugger, onRecord: write });
  await send('Runtime.enable'); await send('Page.enable');
  const evaluate = async expression => {
    await observer.ready();
    const answer = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!answer.exceptionDetails, JSON.stringify(answer.exceptionDetails));
    return answer.result.value;
  };
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`document.head.innerHTML='<meta name="viewport" content="width=device-width,initial-scale=1">';
    document.body.innerHTML='<div id="trail" style="display:none"><span class="seg">Cosmos</span></div><div id="ctxbar"></div>';
    (${installNativeReviewTrace.toString()})('synthetic');
    window.expectedTrailWriter=function expectedTrailWriter(text){document.querySelector('#trail .seg').textContent=text;return text;};
    window.scheduleTrailWriter=function scheduleTrailWriter(text){return new Promise(resolve=>setTimeout(function deferredTrailWrite(){resolve(expectedTrailWriter(text));},0));};true`);
  const hasWriter = pauses => pauses.some(p => p.callFrames.some(f => f.functionName === 'expectedTrailWriter'));
  const expectWriter = pauses => assert(hasWriter(pauses), 'required writer stack absent');
  await evaluate(`scheduleTrailWriter('missing-breakpoint control')`);
  assert.throws(() => expectWriter(report.debugger.pauses), /required writer stack absent/);
  report.controls.push({ name: 'missing breakpoint rejected', pass: true });
  await observer.arm('synthetic');
  const before = report.debugger.pauses.length;
  assert.equal(await evaluate(`scheduleTrailWriter('Cosmos')`), 'Cosmos');
  await observer.ready();
  const captured = report.debugger.pauses.slice(before);
  expectWriter(captured);
  const hasScheduler = stack => !!stack && (stack.callFrames?.some(frame => frame.functionName === 'scheduleTrailWriter') || hasScheduler(stack.parent));
  const expectScheduler = pauses => assert(pauses.some(p => hasScheduler(p.asyncStackTrace)), 'named async scheduler stack missing');
  expectScheduler(captured);
  assert.throws(() => expectScheduler(captured.map(p => ({ ...p, asyncStackTrace: { callFrames: [] } }))), /named async scheduler stack missing/);
  report.controls.push({ name: 'named synchronous and async writer captured; evaluation resumed', pass: true });
  const disarmed = await observer.disarm(); assert(disarmed);
  const after = report.debugger.pauses.length;
  await evaluate(`scheduleTrailWriter('disarmed control')`);
  assert.equal(report.debugger.pauses.length, after);
  report.controls.push({ name: 'breakpoint removal stops capture', pass: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 330, deviceScaleFactor: 1, mobile: true });
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  report.trace = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;return {changes:t.changes,final:t.snapshot(),overflow:t.overflow}})()`);
  assert(report.trace.changes.some(c => c.kind === 'window-resize' && c.viewport.height === 330));
  assert(report.trace.changes.some(c => c.kind === 'visual-viewport-resize' && c.visualViewport.height === 330));
  report.controls.push({ name: 'native window and visual viewport resize facts captured', pass: true });
  await observer.dispose();
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1; }
finally {
  try { await observer?.dispose(); } catch (error) { report.status = 'FAIL'; report.cleanupError = String(error); process.exitCode = 1; }
  await browser?.close(); report.endedAt = new Date().toISOString(); write();
}
console.log(`U1 NAVIGATION CALIBRATION ${report.status}: ${report.controls.length} controls; ${output}`);
