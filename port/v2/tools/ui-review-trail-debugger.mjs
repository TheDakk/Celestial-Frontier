/* Review-owned DOM breakpoint. It observes the isolated session and resumes
 * from the protocol event handler; it never evaluates a paused document. */
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

const LIMIT = 1000;
const time = () => ({ wallTime: new Date().toISOString(), monotonicMs: performance.now() });

export function createReviewTrailDebugger({ send, sessionId, evidence, onRecord = () => {} }) {
  assert.equal(typeof send, 'function');
  assert.equal(typeof sessionId, 'string');
  assert(sessionId.length > 0 && evidence && typeof evidence === 'object');
  assert.equal(typeof onRecord, 'function');
  for (const key of ['arms', 'pauses', 'errors']) {
    evidence[key] ??= [];
    assert(Array.isArray(evidence[key]) && evidence[key].length <= LIMIT);
  }
  evidence.overflow ??= false;
  let initialized = false, debuggerEnabled = false, domEnabled = false, disposed = false;
  let active = null, nextArm = evidence.arms.length, nextPause = evidence.pauses.length;
  const pending = new Set();
  const append = (key, value) => {
    if (evidence[key].length < LIMIT) evidence[key].push(value);
    else evidence.overflow = true;
  };
  const error = (operation, failure) => append('errors', {
    operation, message: failure instanceof Error ? failure.message : String(failure), at: time(),
  });
  const notify = () => { try { onRecord(); } catch (failure) { error('onRecord', failure); } };
  const command = async (method, params = {}) => {
    try { return await send(method, params, sessionId); }
    catch (failure) { error(method, failure); throw failure; }
  };
  const drain = async () => { while (pending.size) await Promise.all([...pending]); };
  const check = () => {
    if (evidence.overflow || evidence.errors.length) throw new Error('U1 trail debugger instrument failed: '
      + (evidence.overflow ? 'evidence overflow; ' : '')
      + evidence.errors.map(entry => entry.operation + ': ' + entry.message).join('; '));
  };
  const ready = async () => { await drain(); check(); };

  function onEvent(event) {
    if (disposed || event.sessionId !== sessionId || event.method !== 'Debugger.paused') return;
    const params = event.params ?? {};
    const pause = { id: ++nextPause, armId: active?.id ?? null, viewport: active?.viewport ?? null,
      received: time(), reason: params.reason ?? null, data: params.data ?? null,
      callFrames: params.callFrames ?? null, asyncStackTrace: params.asyncStackTrace ?? null,
      asyncStackTraceId: params.asyncStackTraceId ?? null, hitBreakpoints: params.hitBreakpoints ?? null,
      resume: { status: 'pending', requested: time() } };
    append('pauses', pause);
    // Dispatch resume before any report callback, evaluation or asynchronous
    // inspection. The launcher deliberately does not await onEvent callbacks.
    let resume;
    try { resume = send('Debugger.resume', {}, sessionId); }
    catch (failure) { resume = Promise.reject(failure); }
    if (!active || params.reason !== 'DOM') error('Debugger.paused', 'pause outside the owned trail breakpoint');
    if (!Array.isArray(params.callFrames) || params.callFrames.length === 0)
      error('Debugger.paused', 'pause has no synchronous call frames');
    const flight = Promise.resolve(resume).then(() => {
      pause.resume = { ...pause.resume, status: 'resumed', completed: time() };
    }, failure => {
      pause.resume = { ...pause.resume, status: 'failed', completed: time() };
      error('Debugger.resume', failure);
    }).then(() => { pending.delete(flight); notify(); });
    pending.add(flight);
  }

  async function disarm() {
    const arm = active;
    if (arm) {
      try {
        await command('DOMDebugger.removeDOMBreakpoint', { nodeId: arm.nodeId, type: 'subtree-modified' });
        arm.status = 'removed'; arm.removed = time(); active = null;
      } catch { /* Retain identity for cleanup; command retained the failure. */ }
    }
    await drain();
    notify(); check();
    return !!arm;
  }

  async function arm(viewport) {
    assert(!disposed, 'trail debugger was disposed');
    await ready();
    if (active) await disarm();
    if (!initialized) {
      // Mark attempted enables so dispose still disables an uncertain command.
      debuggerEnabled = true; await command('Debugger.enable');
      domEnabled = true; await command('DOM.enable');
      await command('Debugger.setAsyncCallStackDepth', { maxDepth: 16 });
      initialized = true;
    }
    const { root } = await command('DOM.getDocument', { depth: 0 });
    const { nodeId } = await command('DOM.querySelector', { nodeId: root.nodeId, selector: '#trail' });
    if (!Number.isInteger(nodeId) || nodeId <= 0) {
      error('arm', '#trail has no current DOM node'); await ready();
    }
    active = { id: ++nextArm, viewport, nodeId, status: 'arming', requested: time() };
    append('arms', active);
    await command('DOMDebugger.setDOMBreakpoint', { nodeId, type: 'subtree-modified' });
    active.status = 'armed'; active.armed = time();
    await ready(); notify(); check();
    return active;
  }

  async function dispose() {
    if (disposed) return ready();
    try { await disarm(); } catch { /* Still complete every cleanup command. */ }
    if (debuggerEnabled) {
      try { await command('Debugger.setAsyncCallStackDepth', { maxDepth: 0 }); } catch { /* retained */ }
      try { await command('Debugger.disable'); } catch { /* retained */ }
    }
    if (domEnabled) try { await command('DOM.disable'); } catch { /* retained */ }
    await drain();
    active = null; disposed = true; notify();
    await ready();
  }
  return { onEvent, arm, disarm, ready, dispose };
}
