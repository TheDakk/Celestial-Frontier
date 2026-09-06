/* Review-owned evaluation receipts. No transport retry, deadline change or
 * product settlement claim: an answered evaluation only proves its own answer. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const SCHEMA = 'cf-u1-review-evaluation/v1';
const LIMIT = 1000;
const time = () => ({ wallTime: new Date().toISOString(), monotonicMs: performance.now() });
const describeError = error => ({ name: error?.name ?? 'Error', message: error?.message ?? String(error) });

export function createReviewEvaluator({ send, ready, evidence, onRecord = () => {} }) {
  assert.equal(typeof send, 'function');
  assert.equal(typeof ready, 'function');
  assert.equal(typeof onRecord, 'function');
  assert(evidence && typeof evidence === 'object' && !Array.isArray(evidence));
  evidence.schema ??= SCHEMA;
  assert.equal(evidence.schema, SCHEMA);
  evidence.expressions ??= {};
  evidence.evaluations ??= [];
  evidence.overflow ??= false;
  assert(evidence.expressions && typeof evidence.expressions === 'object' && !Array.isArray(evidence.expressions));
  assert(Array.isArray(evidence.evaluations) && evidence.evaluations.length <= LIMIT);
  const ids = evidence.evaluations.map(row => row.id);
  assert(ids.every(id => Number.isSafeInteger(id) && id > 0) && new Set(ids).size === ids.length);
  let nextId = Math.max(0, ...ids);

  return async function evaluate(expression, label = 'runtime-evaluate') {
    assert.equal(typeof expression, 'string');
    assert(typeof label === 'string' && label.trim().length > 0);
    if (evidence.overflow || evidence.evaluations.length >= LIMIT) {
      evidence.overflow = true; onRecord(); throw new Error('U1 review evaluation evidence overflow');
    }
    const expressionSha256 = createHash('sha256').update(expression).digest('hex');
    if (Object.hasOwn(evidence.expressions, expressionSha256)) assert.equal(evidence.expressions[expressionSha256], expression);
    else evidence.expressions[expressionSha256] = expression;
    const row = { id: ++nextId, label, expressionSha256, status: 'pending', phase: 'ready',
      started: time(), dispatched: null, settled: null, phases: [] };
    row.phases.push({ phase: 'ready', at: row.started });
    evidence.evaluations.push(row);
    try {
      onRecord();
      await ready();
      row.phase = 'dispatch'; row.dispatched = time();
      row.phases.push({ phase: 'dispatch', at: row.dispatched }); onRecord();
      const answer = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      row.answered = time();
      row.phase = 'answered'; row.phases.push({ phase: 'answered', at: row.answered });
      if (answer.exceptionDetails) row.exceptionDetails = answer.exceptionDetails;
      assert(!answer.exceptionDetails, answer.exceptionDetails?.exception?.description ?? answer.exceptionDetails?.text);
      row.status = 'answered'; row.settled = row.answered;
      row.resultType = answer.result?.type ?? null; onRecord();
      return answer.result.value;
    } catch (error) {
      row.failedPhase = row.phase; row.phase = 'error'; row.status = 'error'; row.settled = time();
      row.error = describeError(error); row.phases.push({ phase: 'error', at: row.settled });
      evidence.firstFailureId ??= row.id;
      try { onRecord(); } catch (recordError) { row.persistenceError = describeError(recordError); }
      throw error;
    }
  };
}

/** Validate the observed boundary independently of its resolved promise. */
export function assessReviewFrameSettlement(receipt, { width, height }) {
  const errors = [], expected = ['fonts-wait', 'fonts-ready', 'frame1', 'frame2', 'settled'];
  if (!receipt || typeof receipt !== 'object') return { pass: false, errors: ['frame settlement receipt is missing'] };
  if (!Number.isSafeInteger(receipt.id) || receipt.id <= 0 || typeof receipt.label !== 'string' || !receipt.label.trim())
    errors.push('frame settlement identity is missing');
  if (receipt.status !== 'settled') errors.push('frame settlement did not settle');
  const phases = Array.isArray(receipt.phases) ? receipt.phases : [];
  if (JSON.stringify(phases.map(row => row?.phase)) !== JSON.stringify(expected)) errors.push('frame settlement phases are missing or out of order');
  if (!phases.every((row, index) => row && Number.isFinite(row.at) && Number.isFinite(row.timeOrigin)
    && (index === 0 || (row.at >= phases[index - 1].at && row.timeOrigin === phases[0].timeOrigin))))
    errors.push('frame settlement timestamps are invalid');
  const settled = phases.at(-1);
  if (!Number.isFinite(width) || !Number.isFinite(height) || settled?.viewport?.width !== width || settled?.viewport?.height !== height)
    errors.push('frame settlement viewport does not match the requested restoration');
  return { pass: errors.length === 0, errors };
}

/** Serialize into the owned review document. Keep the original single
 * fonts.ready -> first rAF -> second rAF promise and resolve value unchanged. */
export function reviewFrameSettlement(label) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('U1 frame settlement needs a name');
  const schema = 'cf-u1-review-frame-settlement/v1';
  const evidence = window.__cfU1ReviewFrameSettlements ??= { schema, invocations: [], overflow: false };
  if (evidence.schema !== schema || !Array.isArray(evidence.invocations)) throw new Error('U1 frame settlement evidence shape');
  if (evidence.overflow || evidence.invocations.length >= 1000) {
    evidence.overflow = true; throw new Error('U1 frame settlement evidence overflow');
  }
  const row = { id: evidence.invocations.length + 1, label, status: 'pending', phases: [] };
  evidence.invocations.push(row);
  const mark = phase => row.phases.push({ phase, at: performance.now(), timeOrigin: performance.timeOrigin,
    fontsStatus: document.fonts.status, visibility: document.visibilityState,
    viewport: { width: innerWidth, height: innerHeight },
    visualViewport: window.visualViewport ? { width: window.visualViewport.width, height: window.visualViewport.height,
      scale: window.visualViewport.scale } : null });
  mark('fonts-wait');
  return document.fonts.ready.then(() => {
    mark('fonts-ready');
    return new Promise(resolve => requestAnimationFrame(() => {
      mark('frame1');
      requestAnimationFrame(() => {
        mark('frame2'); row.status = 'settled'; mark('settled'); resolve(true);
      });
    }));
  }, error => {
    row.status = 'error'; row.error = { name: error?.name ?? 'Error', message: error?.message ?? String(error) };
    mark('error'); throw error;
  });
}

/** Read-only cleanup observation; it neither completes nor repeats a wait. */
export function readReviewFrameSettlements() {
  const evidence = window.__cfU1ReviewFrameSettlements;
  return evidence ? JSON.parse(JSON.stringify(evidence)) : null;
}
