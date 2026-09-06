import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { installNativeReviewTrace } from './ui-shell-review.mjs';

test('resize facts remain distinct from a real canonical trail change', async () => {
  const dom = new JSDOM('<body><div id="trail" style="display:none"><span class="seg">Cosmos</span></div><div id="ctxbar"></div>', { runScripts: 'outside-only' });
  const w = dom.window;
  try {
    const visual = new w.EventTarget();
    Object.assign(visual, { width: 390, height: 844, scale: 1, offsetLeft: 0, offsetTop: 0 });
    Object.defineProperty(w, 'visualViewport', { value: visual });
    w.innerWidth = 390; w.innerHeight = 844;
    w.eval(`(${installNativeReviewTrace.toString()})('phone')`);
    const trace = w.__cfU1ReviewNativeTrace;
    w.innerHeight = 330; visual.height = 310;
    w.dispatchEvent(new w.Event('resize')); visual.dispatchEvent(new w.Event('resize'));
    assert.deepEqual(Array.from(trace.changes, row => row.kind), ['initial', 'window-resize', 'visual-viewport-resize']);
    assert.equal(trace.changes[1].viewport.height, 330);
    assert.equal(trace.changes[2].visualViewport.height, 310);
    assert.equal(trace.changes[2].trailVisible, false);
    assert.equal(typeof trace.changes[2].timeOrigin, 'number');
    w.document.querySelector('#trail').innerHTML = '<span class="seg">Cosmos</span>';
    await new Promise(setImmediate);
    assert.equal(trace.changes.length, 3, 'same-text redraw must not masquerade as navigation');
    w.document.querySelector('#trail').innerHTML += '<span class="seg">Milky Way</span>';
    await new Promise(setImmediate);
    assert.equal(trace.changes.at(-1).kind, 'trail-change');
    assert.deepEqual(Array.from(trace.changes.at(-1).trail), ['Cosmos', 'Milky Way']);
    for (let i = 0; i < 1005; i++) w.dispatchEvent(new w.Event('resize'));
    assert.equal(trace.changes.length, 1000);
    assert.equal(trace.overflow, true, 'overflow must remain explicit');
  } finally { w.close(); }
});

test('shipped native input routine rejects wrong scope before dispatch and accepts Cosmos', async () => {
  const source = readFileSync(new URL('./ui-shell-review.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('const clickNative = async') + 'const clickNative = '.length;
  const end = source.indexOf('    for (const [name, width, height, mobile]', start);
  const expression = source.slice(start, end).trim().replace(/;$/, '');
  const createClick = new Function('deps', `const {trailDebugger,evaluate,report,writeReport,send,assert,assessNativeReviewDelivery}=deps; return (${expression});`);
  const fixture = trail => {
    const order = [], sends = [];
    const proof = { id: 1, selector: '#docknotifications', viewport: 'phone', point: { x: 50, y: 50 },
      eventStart: 0, changeStart: 0, beforePress: { trail } };
    let reads = 0;
    const click = createClick({ assert, report: { nativeInputs: [] }, writeReport() {},
      trailDebugger: { async disarm() { order.push('disarm'); return true; }, async arm() { order.push('arm'); } },
      async evaluate() { order.push('evaluate'); return ++reads === 1 ? proof : {}; },
      async send(method, params) { order.push('send'); sends.push({ method, params }); },
      // This fixture isolates the scene admission, not the already separate delivery assessor.
      assessNativeReviewDelivery() { return { pass: true }; } });
    return { click, order, sends };
  };
  const red = fixture(['Cosmos', 'Milky Way']);
  await assert.rejects(red.click('#docknotifications'), /native input predecessor changed scope/);
  assert.deepEqual(red.order, ['disarm', 'evaluate']);
  assert.equal(red.sends.length, 0);
  const green = fixture(['Cosmos']);
  await green.click('#docknotifications');
  assert.deepEqual(green.order.slice(0, 3), ['disarm', 'evaluate', 'send']);
  assert.deepEqual(green.sends.map(row => [row.method, row.params.type]), [
    ['Input.dispatchMouseEvent', 'mousePressed'], ['Input.dispatchMouseEvent', 'mouseReleased'],
  ]);
  assert.equal(green.order.at(-1), 'arm');
});
