import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewTrailDebugger } from './ui-review-trail-debugger.mjs';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function fixture(override = () => undefined) {
  const calls = [], evidence = {}, records = [];
  let nodeId = 20;
  const send = (method, params, sessionId) => {
    const call = { method, params, sessionId }; calls.push(call);
    const result = override(call);
    if (result !== undefined) return result;
    if (method === 'DOM.getDocument') return Promise.resolve({ root: { nodeId: 1 } });
    if (method === 'DOM.querySelector') return Promise.resolve({ nodeId: ++nodeId });
    return Promise.resolve({});
  };
  const helper = createReviewTrailDebugger({ send, sessionId: 'owned', evidence,
    onRecord: () => records.push(calls.map(call => call.method)) });
  const pause = (fields = {}) => helper.onEvent({ sessionId: 'owned', method: 'Debugger.paused',
    params: { reason: 'DOM', data: { nodeId, type: 'subtree-modified' },
      callFrames: [{ functionName: 'publishGalaxyDescent', location: { scriptId: 'game', lineNumber: 1, columnNumber: 2 } }],
      asyncStackTrace: { description: 'await', callFrames: [{ functionName: 'descendGalaxy', scriptId: 'game', url: '/game.js', lineNumber: 3, columnNumber: 4 }] },
      asyncStackTraceId: { id: 'async-parent' } }, ...fields });
  return { helper, calls, evidence, records, pause };
}

test('owned paused stacks survive, immediate resume precedes report, and another session is ignored', async () => {
  const resume = deferred();
  const f = fixture(({ method }) => method === 'Debugger.resume' ? resume.promise : undefined);
  await f.helper.arm('phone');
  const recordsBefore = f.records.length, callsBefore = f.calls.length;
  f.pause({ sessionId: 'other' });
  assert.equal(f.calls.length, callsBefore);
  assert.equal(f.evidence.pauses.length, 0);
  f.pause();
  assert.equal(f.calls.at(-1).method, 'Debugger.resume');
  assert.equal(f.calls.at(-1).sessionId, 'owned');
  assert.equal(f.records.length, recordsBefore);
  const pause = f.evidence.pauses[0];
  assert.equal(pause.callFrames[0].functionName, 'publishGalaxyDescent');
  assert.equal(pause.asyncStackTrace.callFrames[0].functionName, 'descendGalaxy');
  assert.deepEqual(pause.asyncStackTraceId, { id: 'async-parent' });
  assert.equal(pause.viewport, 'phone');
  assert.equal(pause.armId, 1);
  assert(Number.isFinite(pause.received.monotonicMs));
  assert(!f.calls.some(call => call.method === 'Runtime.evaluate'));
  let ready = false;
  const boundary = f.helper.ready().then(() => { ready = true; });
  await Promise.resolve(); assert.equal(ready, false);
  resume.resolve({}); await boundary;
  assert.equal(pause.resume.status, 'resumed');
  assert.equal(f.records.length, recordsBefore + 1);
  await f.helper.dispose();
});

test('disarm removes first and drains pending resume; rearm queries a fresh node', async () => {
  const resume = deferred();
  const f = fixture(({ method }) => method === 'Debugger.resume' ? resume.promise : undefined);
  const first = await f.helper.arm('phone'); f.pause();
  let disarmed = false;
  const removal = f.helper.disarm().then(result => { disarmed = true; return result; });
  assert.equal(f.calls.at(-1).method, 'DOMDebugger.removeDOMBreakpoint');
  await Promise.resolve(); assert.equal(disarmed, false);
  resume.resolve({}); assert.equal(await removal, true);
  assert.equal(await f.helper.disarm(), false);
  const second = await f.helper.arm('desktop');
  assert.notEqual(first.nodeId, second.nodeId);
  assert.equal(f.calls.filter(call => call.method === 'Debugger.enable').length, 1);
  assert.equal(f.calls.filter(call => call.method === 'DOM.querySelector').length, 2);
  assert.deepEqual(f.calls.filter(call => call.method === 'DOMDebugger.setDOMBreakpoint').map(call => call.params.nodeId), [first.nodeId, second.nodeId]);
  await f.helper.dispose();
  assert.deepEqual(f.calls.slice(-4).map(call => call.method), [
    'DOMDebugger.removeDOMBreakpoint', 'Debugger.setAsyncCallStackDepth', 'Debugger.disable', 'DOM.disable',
  ]);
  assert.equal(f.calls.at(-3).params.maxDepth, 0);
  await assert.rejects(f.helper.arm('phone'), /disposed/);
});

for (const synchronous of [false, true]) test(`resume ${synchronous ? 'throw' : 'rejection'} is retained and fails closed`, async () => {
  const f = fixture(({ method }) => {
    if (method === 'Debugger.resume') {
      if (synchronous) throw new Error('resume refused');
      return Promise.reject(new Error('resume refused'));
    }
  });
  await f.helper.arm('phone');
  assert.doesNotThrow(() => f.pause());
  await assert.rejects(f.helper.ready(), /Debugger.resume: resume refused/);
  assert.equal(f.evidence.pauses[0].resume.status, 'failed');
  await assert.rejects(f.helper.dispose(), /resume refused/);
  assert(f.calls.some(call => call.method === 'Debugger.disable'));
});

test('removal failure retains identity and cannot prevent remaining cleanup', async () => {
  const f = fixture(({ method }) => method === 'DOMDebugger.removeDOMBreakpoint'
    ? Promise.reject(new Error('remove refused')) : undefined);
  await f.helper.arm('phone');
  await assert.rejects(f.helper.disarm(), /remove refused/);
  await assert.rejects(f.helper.dispose(), /remove refused/);
  assert.equal(f.evidence.arms[0].status, 'armed');
  assert(f.calls.some(call => call.method === 'Debugger.disable'));
  assert(f.calls.some(call => call.method === 'DOM.disable'));
});

test('missing trail, missing stack, and unowned pauses cannot yield instrument green', async () => {
  const missing = fixture(({ method }) => method === 'DOM.querySelector' ? Promise.resolve({ nodeId: 0 }) : undefined);
  await assert.rejects(missing.helper.arm('phone'), /no current DOM node/);
  assert(!missing.calls.some(call => call.method === 'DOMDebugger.setDOMBreakpoint'));
  await assert.rejects(missing.helper.dispose(), /no current DOM node/);
  const f = fixture(); await f.helper.arm('phone');
  f.pause({ params: { reason: 'DOM', callFrames: [] } });
  await assert.rejects(f.helper.ready(), /no synchronous call frames/);
  assert.equal(f.calls.at(-1).method, 'Debugger.resume');
  await assert.rejects(f.helper.dispose(), /no synchronous call frames/);
  const unowned = fixture();
  unowned.pause();
  await assert.rejects(unowned.helper.ready(), /outside the owned/);
  assert.equal(unowned.calls.at(-1).method, 'Debugger.resume');
});

test('pause overflow is bounded, resumes every event, and fails closed', async () => {
  const f = fixture(); await f.helper.arm('phone');
  for (let i = 0; i < 1001; i++) f.pause();
  await assert.rejects(f.helper.ready(), /evidence overflow/);
  assert.equal(f.evidence.pauses.length, 1000);
  assert.equal(f.calls.filter(call => call.method === 'Debugger.resume').length, 1001);
  await assert.rejects(f.helper.dispose(), /evidence overflow/);
});

test('a report callback failure is retained after resume and still permits cleanup', async () => {
  const evidence = {}, calls = [];
  const helper = createReviewTrailDebugger({ evidence, sessionId: 'owned',
    send: (method) => { calls.push(method); return Promise.resolve({}); },
    onRecord: () => { throw new Error('report refused'); } });
  helper.onEvent({ sessionId: 'owned', method: 'Debugger.paused', params: { reason: 'DOM', callFrames: [{}] } });
  await assert.rejects(helper.ready(), /onRecord: report refused/);
  assert.equal(calls[0], 'Debugger.resume');
  await assert.rejects(helper.dispose(), /report refused/);
});
