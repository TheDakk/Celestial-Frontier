import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { createReviewEvaluator, reviewFrameSettlement, readReviewFrameSettlements, assessReviewFrameSettlement } from './ui-review-evaluation.mjs';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const clone = value => JSON.parse(JSON.stringify(value));
function fixture({ ready = async () => {}, send = async () => ({ result: { type: 'boolean', value: true } }) } = {}) {
  const evidence = {}, records = [], calls = [];
  const evaluate = createReviewEvaluator({ evidence, ready,
    send(...args) { calls.push(args); return send(...args); },
    onRecord() { records.push(clone(evidence)); } });
  return { evidence, records, calls, evaluate };
}

test('pending readiness and exact Runtime dispatch are durably distinct before either barrier settles', async () => {
  const ready = deferred(), answer = deferred();
  const f = fixture({ ready: () => ready.promise, send: () => answer.promise });
  const promise = f.evaluate('document.fonts.ready', 'phone.portrait.fonts-two-frames');
  assert.equal(f.calls.length, 0);
  assert.equal(f.records.at(-1).evaluations[0].phase, 'ready');
  assert.equal(f.records.at(-1).evaluations[0].status, 'pending');
  ready.resolve(); await Promise.resolve();
  assert.deepEqual(f.calls, [['Runtime.evaluate', {
    expression: 'document.fonts.ready', returnByValue: true, awaitPromise: true,
  }]]);
  assert.equal(f.records.at(-1).evaluations[0].phase, 'dispatch');
  assert.equal(f.records.at(-1).evaluations[0].settled, null);
  answer.resolve({ result: { type: 'number', value: 27 } });
  assert.equal(await promise, 27);
  const row = f.records.at(-1).evaluations[0];
  assert.equal(row.status, 'answered');
  assert.deepEqual(row.phases.map(phase => phase.phase), ['ready', 'dispatch', 'answered']);
  assert(row.started.monotonicMs <= row.dispatched.monotonicMs && row.dispatched.monotonicMs <= row.settled.monotonicMs);
  assert.equal(typeof row.started.wallTime, 'string');
  assert.equal(f.records[0].evaluations[0].status, 'pending', 'older durable snapshots cannot change with the live row');
});

test('debugger readiness refusal is identified without any Runtime command', async () => {
  const rejection = new Error('resume refused');
  const f = fixture({ ready: async () => { throw rejection; } });
  await assert.rejects(f.evaluate('true', 'phone.portrait.fonts-two-frames'), error => error === rejection);
  assert.equal(f.calls.length, 0);
  const row = f.records.at(-1).evaluations[0];
  assert.equal(row.failedPhase, 'ready'); assert.equal(row.dispatched, null);
  assert.equal(row.error.message, 'resume refused'); assert.equal(f.evidence.firstFailureId, 1);
});

test('protocol rejection retains exact expression identity and first red through later successful cleanup', async () => {
  const rejection = new Error('timed out waiting for Runtime.evaluate');
  let count = 0;
  const f = fixture({ send: async () => {
    if (++count === 2) throw rejection;
    return { result: { type: 'boolean', value: true } };
  } });
  await f.evaluate('fontsThenTwoFrames()', 'phone.portrait.fonts-two-frames');
  await assert.rejects(f.evaluate('shellGeometry()', 'phone.portrait.shell-geometry'), error => error === rejection);
  const red = clone(f.evidence.evaluations[1]);
  await f.evaluate('readFrameReceipts()', 'cleanup.frame-receipts');
  assert.equal(f.calls.length, 3, 'no retry command');
  assert.equal(f.evidence.firstFailureId, red.id);
  assert.equal(red.label, 'phone.portrait.shell-geometry'); assert.equal(red.failedPhase, 'dispatch');
  assert.equal(f.evidence.expressions[red.expressionSha256], 'shellGeometry()');
  assert.deepEqual(f.evidence.evaluations[1], red);
  assert.equal(f.records.at(-1).evaluations[1].status, 'error');
  assert.equal(f.records.at(-1).evaluations[2].status, 'answered');
});

test('page exception details survive assertion failure and cannot become an answered result', async () => {
  const details = { text: 'Uncaught', exceptionId: 9, lineNumber: 2,
    exception: { description: 'Error: font wait failed', className: 'Error' } };
  const f = fixture({ send: async () => ({ result: { type: 'undefined' }, exceptionDetails: details }) });
  await assert.rejects(f.evaluate('throwFontError()', 'phone.portrait.fonts-two-frames'), /font wait failed/);
  const row = f.records.at(-1).evaluations[0];
  assert.equal(row.status, 'error'); assert.equal(row.failedPhase, 'answered');
  assert.deepEqual(row.exceptionDetails, details);
  assert.deepEqual(row.phases.map(phase => phase.phase), ['ready', 'dispatch', 'answered', 'error']);
});

test('exact sources deduplicate independently of invocation labels and IDs', async () => {
  const f = fixture();
  await f.evaluate('true', 'first'); await f.evaluate('true', 'second'); await f.evaluate(' true');
  assert.deepEqual(f.evidence.evaluations.map(row => row.id), [1, 2, 3]);
  assert.deepEqual(f.evidence.evaluations.map(row => row.label), ['first', 'second', 'runtime-evaluate']);
  assert.equal(Object.keys(f.evidence.expressions).length, 2);
  const hash = createHash('sha256').update('true').digest('hex');
  assert.equal(f.evidence.evaluations[0].expressionSha256, hash);
  assert.equal(f.evidence.evaluations[1].expressionSha256, hash);
  assert.equal(f.evidence.expressions[hash], 'true');
});

test('evidence overflow refuses dispatch and remains explicit', async () => {
  const f = fixture();
  f.evidence.overflow = true;
  await assert.rejects(f.evaluate('true'), /evidence overflow/);
  assert.equal(f.calls.length, 0); assert.equal(f.records.at(-1).overflow, true);
});

function frameFixture() {
  const font = deferred(), callbacks = [], events = [];
  let tick = 0;
  const page = { document: { fonts: { status: 'loading', ready: font.promise }, visibilityState: 'visible' },
    innerWidth: 390, innerHeight: 844,
    performance: { now: () => ++tick, timeOrigin: 1000 },
    requestAnimationFrame(callback) { events.push('request-frame'); callbacks.push(callback); },
  };
  page.window = page;
  const invoke = runInNewContext(`(${reviewFrameSettlement.toString()})`, page);
  const read = runInNewContext(`(${readReviewFrameSettlements.toString()})`, page);
  return { page, font, callbacks, events, invoke, read };
}

test('one serialized fonts/two-rAF promise retains each pending phase without an added frame or wait', async () => {
  const f = frameFixture();
  assert.equal(f.read(), null);
  let resolved = false;
  const promise = f.invoke('phone.portrait.fonts-two-frames').then(value => { resolved = true; return value; });
  const phases = () => Array.from(f.read().invocations[0].phases, row => row.phase);
  assert.deepEqual(phases(), ['fonts-wait']); assert.equal(f.callbacks.length, 0);
  const waiting = clone(f.read());
  f.page.document.fonts.status = 'loaded'; f.font.resolve(); await Promise.resolve();
  assert.equal(resolved, false);
  assert.deepEqual(phases(), ['fonts-wait', 'fonts-ready']); assert.equal(f.callbacks.length, 1);
  f.callbacks.shift()();
  assert.deepEqual(phases(), ['fonts-wait', 'fonts-ready', 'frame1']); assert.equal(f.callbacks.length, 1);
  assert.equal(resolved, false);
  f.page.innerHeight = 845; f.callbacks.shift()();
  assert.equal(await promise, true);
  const receipt = clone(f.read()).invocations[0];
  assert.equal(receipt.status, 'settled'); assert.equal(receipt.label, 'phone.portrait.fonts-two-frames');
  assert.deepEqual(phases(), ['fonts-wait', 'fonts-ready', 'frame1', 'frame2', 'settled']);
  assert.equal(f.events.length, 2); assert.equal(f.callbacks.length, 0);
  assert.equal(receipt.phases[0].fontsStatus, 'loading'); assert.equal(receipt.phases[1].fontsStatus, 'loaded');
  assert.equal(receipt.phases.at(-1).viewport.height, 845);
  assert(receipt.phases.every((row, index) => row.at === index + 1 && row.timeOrigin === 1000));
  assert.equal(waiting.invocations[0].status, 'pending', 'cleanup reads are detached observations');
  assert.deepEqual(waiting.invocations[0].phases.map(row => row.phase), ['fonts-wait']);
});

test('separate reads preserve font/frame stalls and another invocation cannot overwrite their identities', async () => {
  const f = frameFixture();
  const first = f.invoke('font-and-first-frame');
  const second = f.invoke('font-and-second-frame');
  assert.deepEqual(Array.from(f.read().invocations, row => row.id), [1, 2]);
  assert(f.read().invocations.every(row => row.status === 'pending' && row.phases.length === 1));
  f.font.resolve(); await Promise.resolve();
  f.callbacks.shift()();
  let receipt = clone(f.read());
  assert.equal(receipt.invocations[0].phases.at(-1).phase, 'frame1');
  assert.equal(receipt.invocations[1].phases.at(-1).phase, 'fonts-ready');
  f.callbacks.shift()(); f.callbacks.shift()(); await first;
  receipt = clone(f.read());
  assert.equal(receipt.invocations[0].status, 'settled');
  assert.equal(receipt.invocations[1].status, 'pending');
  assert.equal(receipt.invocations[1].phases.at(-1).phase, 'frame1');
  f.callbacks.shift()(); await second;
  assert.equal(f.read().invocations[1].status, 'settled');
});

test('settlement assessor rejects absent, pending, omitted, reordered and wrong-viewport receipts', async () => {
  const f = frameFixture(), promise = f.invoke('phone.portrait-restore.fonts-two-frames');
  const target = { width: 390, height: 844 };
  assert.equal(assessReviewFrameSettlement(null, target).pass, false);
  assert.equal(assessReviewFrameSettlement(clone(f.read()).invocations[0], target).pass, false);
  f.font.resolve(); await Promise.resolve(); f.callbacks.shift()(); f.callbacks.shift()(); await promise;
  const receipt = clone(f.read()).invocations[0];
  assert.equal(assessReviewFrameSettlement(receipt, target).pass, true);
  for (const mutate of [
    row => { row.status = 'pending'; },
    row => { row.phases.splice(2, 1); },
    row => { [row.phases[2], row.phases[3]] = [row.phases[3], row.phases[2]]; },
    row => { row.phases.at(-1).viewport.width = 844; },
    row => { row.phases.at(-1).timeOrigin++; },
    row => { row.phases.at(-1).at = -1; },
    row => { row.phases[0] = null; },
  ]) {
    const broken = clone(receipt); mutate(broken);
    assert.equal(assessReviewFrameSettlement(broken, target).pass, false);
  }
  assert.equal(assessReviewFrameSettlement(receipt, target).pass, true, 'independent faults must leave the accepted receipt intact');
});

test('font rejection is retained without scheduling frames or replacing its original rejection', async () => {
  const f = frameFixture(), rejection = new Error('fonts unavailable');
  const promise = f.invoke('phone.portrait.fonts-two-frames');
  f.font.reject(rejection);
  await assert.rejects(promise, error => error === rejection);
  const receipt = clone(f.read()).invocations[0];
  assert.equal(receipt.status, 'error'); assert.equal(receipt.error.message, 'fonts unavailable');
  assert.deepEqual(receipt.phases.map(row => row.phase), ['fonts-wait', 'error']);
  assert.equal(f.callbacks.length, 0);
});
