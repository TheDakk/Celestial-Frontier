import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { installNativeReviewTrace, assessNativeReviewKeyboardDelivery } from './ui-shell-review.mjs';

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


test('native Escape delivery rejects repeated, unowned, missing and untrusted key edges', () => {
  const good = { id: 7, overflow: false, events: ['keydown', 'keyup'].map(type => ({
    type, key: 'Escape', code: 'Escape', keyId: 7, trusted: true, repeat: false,
  })) };
  assert(assessNativeReviewKeyboardDelivery(good).pass);
  for (const fault of [
    { ...good, events: good.events.slice(0, 1) },
    { ...good, events: [...good.events, { ...good.events[0], key: 'Unidentified', code: 'Minus' }] },
    { ...good, events: good.events.map(event => ({ ...event, keyId: null })) },
    { ...good, events: good.events.map(event => ({ ...event, trusted: false })) },
    { ...good, events: good.events.map(event => ({ ...event, repeat: true })) },
    { ...good, overflow: true },
  ]) assert(!assessNativeReviewKeyboardDelivery(fault).pass);
  assert(assessNativeReviewKeyboardDelivery(good).pass);
});

test('shipped Escape helper uses portable renderer input and retains a rejected delivery', async () => {
  const source = readFileSync(new URL('./ui-shell-review.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('const escapeNative = async') + 'const escapeNative = '.length;
  const end = source.indexOf('    const clickNative = async', start);
  assert(start > 0 && end > start);
  const expression = source.slice(start, end).trim().replace(/;$/, '');
  const createEscape = new Function('deps', `const {evaluate,report,writeReport,send,assert,assessNativeReviewKeyboardDelivery}=deps; return (${expression});`);
  const fixture = extra => {
    const report = { nativeKeys: [] }, sends = [], writes = [];
    let reads = 0;
    const escape = createEscape({ report, assert, assessNativeReviewKeyboardDelivery,
      writeReport() { writes.push(structuredClone(report)); },
      async evaluate() { return ++reads === 1 ? { id: 1, viewport: 'phone', eventStart: 0, before: { trail: ['Milky Way', 'Sun (Sol)'] } }
        : { overflow: false, events: [
          { type: 'keydown', key: 'Escape', code: 'Escape', keyId: 1, trusted: true, repeat: false },
          { type: 'keyup', key: 'Escape', code: 'Escape', keyId: 1, trusted: true, repeat: false },
          ...extra,
        ] }; },
      async send(method, params) { sends.push({ method, params }); },
    });
    return { escape, report, sends, writes };
  };
  const green = fixture([]); await green.escape();
  assert.deepEqual(green.sends, ['keyDown', 'keyUp'].map(type => ({ method: 'Input.dispatchKeyEvent',
    params: { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 } })));
  assert.equal(green.writes[0].nativeKeys[0].delivery, undefined, 'intent is durable before dispatch');
  assert(green.report.nativeKeys[0].delivery.pass);
  const red = fixture([{ type: 'keydown', key: 'Unidentified', code: 'Minus', keyId: null, trusted: true, repeat: true }]);
  await assert.rejects(red.escape(), /exactly two trusted key edges/);
  assert.equal(red.report.nativeKeys[0].delivery.pass, false);
  assert.equal(red.writes.at(-1).nativeKeys[0].delivery.pass, false, 'rejected delivery survives in the report');
});


test('terminal collection rejects missing or malformed trace rather than accepting absent keyboard evidence', async () => {
  const source = readFileSync(new URL('./ui-shell-review.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('collectNativeTrace = async') + 'collectNativeTrace = '.length;
  const end = source.indexOf('    const escapeNative = async', start);
  const expression = source.slice(start, end).trim().replace(/;$/, '');
  const createCollect = new Function('deps', `const {evaluate,report,writeReport,assert}=deps; return (${expression});`);
  const valid = { viewport: 'phone', events: [], keys: [], changes: [], overflow: false };
  const fixture = trace => {
    const report = { nativeTraces: [], nativeKeys: [] };
    return { report, collect: createCollect({ report, assert, writeReport() {}, async evaluate() { return trace; } }) };
  };
  for (const value of [null, { ...valid, keys: null }, { ...valid, events: {} }, { ...valid, changes: undefined }])
    await assert.rejects(fixture(value).collect(), /trace is missing or malformed/);
  const extra = fixture({ ...valid, keys: [{ type: 'keydown', code: 'Minus', keyId: null }] });
  await assert.rejects(extra.collect(), /unexpected key events/);
  assert.equal(extra.report.nativeTraces[0].keyboardComplete, false);
  const good = fixture(structuredClone(valid)); await good.collect();
  assert(good.report.nativeTraces[0].keyboardComplete);
});
