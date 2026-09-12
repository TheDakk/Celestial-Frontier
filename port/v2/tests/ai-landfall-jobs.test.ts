import { describe, expect, it } from 'vitest';
import { AiLandfallJobsV1, type AiLandfallProgressV1 } from '../apps/game/src/ai-landfall-jobs.js';
import { aiLandfallInputKeyV1, type AiLandfallInputV1, type AiLandfallOriginalStoreV1,
  type AiLandfallOriginalV1, type AiLandfallGeneratedV1 } from '../apps/game/src/ai-landfall-originals.js';

const input = (seed = 1): AiLandfallInputV1 => ({ recipeKey: `recipe-${seed}`, worldKey: `world-${seed}`,
  environmentId: 'environment', ecologyEpoch: 0, snapshotDigest: 'a'.repeat(64), recipeJson: JSON.stringify({ seed }) });
const image = (): AiLandfallGeneratedV1 => ({ blob: new Blob(['pixels'], { type: 'image/png' }), width: 2, height: 1 });
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function storeFixture() {
  const originals = new Map<string, AiLandfallOriginalV1>();
  let retained = 0;
  const store: AiLandfallOriginalStoreV1 = {
    async retain(value, generated) {
      retained++;
      const original: AiLandfallOriginalV1 = Object.freeze({ ...generated, input: value,
        schema: 'cf.ai-landfall-original.v1', originalId: `original-${retained}`, sha256: 'b'.repeat(64) });
      originals.set(aiLandfallInputKeyV1(value), original); return original;
    },
    async find(value) { return originals.get(aiLandfallInputKeyV1(value)) ?? null; },
    async read(value, id) { const row = originals.get(aiLandfallInputKeyV1(value)); return row?.originalId === id ? row : null; },
    close() {},
  };
  return { store, originals, retained: () => retained };
}

describe('page-owned landfall jobs', () => {
  it('runs one generator at a time, admits only three waiting jobs and reuses complete identities', async () => {
    const fixture = storeFixture();
    const held: ReturnType<typeof deferred<AiLandfallGeneratedV1>>[] = [];
    let active = 0, peak = 0;
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async () => {
      active++; peak = Math.max(peak, active); const pending = deferred<AiLandfallGeneratedV1>();
      held.push(pending); const result = await pending.promise; active--; return result;
    } });
    const firstInput = input();
    const first = jobs.enqueue(firstInput);
    expect(jobs.enqueue({ ...firstInput })).toBe(first);
    (firstInput as { recipeJson: string }).recipeJson = 'changed after admission';
    expect(jobs.snapshot()[0]!.input.recipeJson).toBe('{"seed":1}');
    jobs.enqueue(input(2)); jobs.enqueue(input(3)); jobs.enqueue(input(4));
    expect(() => jobs.enqueue(input(5))).toThrow(/full/);
    await tick(); expect(held).toHaveLength(1);
    for (let index = 0; index < 4; index++) { held[index]!.resolve(image()); await tick(); }
    await jobs.settled();
    expect(peak).toBe(1); expect(fixture.retained()).toBe(4);
    expect(jobs.snapshot().every(row => row.status === 'ready')).toBe(true);
    expect(jobs.enqueue(input())).toBe(first);
    expect(fixture.retained()).toBe(4);
  });

  it('publishes ready only after original retention settles and never at drawing completion', async () => {
    const fixture = storeFixture(); const retention = deferred<AiLandfallOriginalV1>();
    const notices: string[] = [];
    fixture.store.retain = () => retention.promise;
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async (_input, _signal, emit) => {
      emit({ phase: 'Drawing 4 of 4', completed: 4, total: 4, etaMs: null }); return image();
    }, onReady: job => notices.push(job.jobId) });
    jobs.enqueue(input()); await tick();
    expect(jobs.snapshot()[0]!.status).toBe('retaining');
    expect(jobs.snapshot()[0]!.progress.completed).toBe(99);
    expect(notices).toEqual([]);
    retention.resolve({ ...image(), schema: 'cf.ai-landfall-original.v1', input: input(),
      originalId: 'retained', sha256: 'b'.repeat(64) });
    await jobs.settled();
    expect(notices).toHaveLength(1);
    expect(jobs.snapshot()[0]).toMatchObject({ status: 'ready', originalId: 'retained' });
  });

  it('suppresses ready after storage failure or a stale retained identity', async () => {
    for (const failure of ['quota', 'identity']) {
      const fixture = storeFixture(); const notices: string[] = [];
      fixture.store.retain = async () => {
        if (failure === 'quota') throw new Error('QuotaExceededError');
        return { ...image(), schema: 'cf.ai-landfall-original.v1', input: input(9), originalId: 'wrong', sha256: 'b'.repeat(64) };
      };
      const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async () => image(), onReady: row => notices.push(row.jobId) });
      jobs.enqueue(input()); await jobs.settled();
      expect(jobs.snapshot()[0]!.status).toBe('failed'); expect(notices).toEqual([]);
      expect(jobs.snapshot()[0]!.originalId).toBeNull();
    }
  });

  it('cancels queued and running jobs explicitly without starting overlapping generation', async () => {
    const fixture = storeFixture(); const first = deferred<AiLandfallGeneratedV1>();
    const signals: AbortSignal[] = [];
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async (_input, signal) => {
      signals.push(signal); return first.promise;
    } });
    const running = jobs.enqueue(input()); const waiting = jobs.enqueue(input(2));
    await tick(); expect(jobs.cancel(waiting)).toBe(true); expect(jobs.cancel(running)).toBe(true);
    expect(signals[0]!.aborted).toBe(true);
    expect(jobs.snapshot()[0]!.status).toBe('canceling');
    first.resolve(image()); await jobs.settled();
    expect(signals).toHaveLength(1); expect(fixture.retained()).toBe(0);
    expect(jobs.snapshot().every(row => row.status === 'canceled')).toBe(true);
  });

  it('publishes ready when retention commits before cancellation; early cancellation remains canceled', async () => {
    const fixture = storeFixture(); const hold = deferred<void>();
    const retain = fixture.store.retain; let committed = false;
    fixture.store.retain = async (...args) => {
      const original = await retain(...args); committed = true; await hold.promise; return original;
    };
    const notices: string[] = [];
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async () => image(), onReady: job => notices.push(job.jobId) });
    const id = jobs.enqueue(input()); await tick(); expect(committed).toBe(true);
    expect(jobs.cancel(id)).toBe(true); hold.resolve(); await jobs.settled();
    expect(jobs.snapshot()[0]!.status).toBe('ready'); expect(notices).toEqual([id]);
    expect(await fixture.store.find(input())).not.toBeNull();
    const restored = new AiLandfallJobsV1({ store: fixture.store, generate: async () => { throw new Error('must reuse'); } });
    restored.enqueue(input()); await restored.settled();
    expect(restored.snapshot()[0]!.status).toBe('ready'); expect(fixture.retained()).toBe(1);
    expect(restored.cancel(restored.snapshot()[0]!.jobId)).toBe(false);
  });

  it('rejects regressing progress even if a provider swallows the callback error', async () => {
    const fixture = storeFixture(); let emitLate: ((value: AiLandfallProgressV1) => void) | null = null;
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async (_input, _signal, emit) => {
      emitLate = emit; emit({ phase: 'Drawing 3 of 4', completed: 3, total: 4, etaMs: 1 });
      try { emit({ phase: 'Drawing 2 of 4', completed: 2, total: 4, etaMs: 1 }); } catch { /* hostile provider */ }
      return image();
    } });
    jobs.enqueue(input()); await jobs.settled();
    expect(jobs.snapshot()[0]!.status).toBe('failed'); expect(fixture.retained()).toBe(0);
    const late = emitLate as unknown as (value: AiLandfallProgressV1) => void;
    late({ phase: 'Late', completed: 4, total: 4, etaMs: null });
    expect(jobs.snapshot()[0]!.status).toBe('failed');
  });

  it('bounds terminal metadata to twelve rows without deleting stored originals', async () => {
    const fixture = storeFixture();
    const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async () => image() });
    for (let seed = 1; seed <= 14; seed++) { jobs.enqueue(input(seed)); await jobs.settled(); }
    expect(jobs.snapshot()).toHaveLength(12); expect(fixture.originals.size).toBe(14);
    expect(jobs.snapshot()[0]!.input.recipeKey).toBe('recipe-3');
    expect(Object.isFrozen(jobs.snapshot())).toBe(true);
    expect(Object.isFrozen(jobs.snapshot()[0]!.progress)).toBe(true);
  });
});

it('retry replaces the failed row instead of leaving two Retry controls', async () => {
  const fixture = storeFixture(); let fail = true;
  const jobs = new AiLandfallJobsV1({ store: fixture.store, generate: async () => { if (fail) throw Error('control'); return image(); } });
  const first = jobs.enqueue(input()); await jobs.settled(); expect(jobs.snapshot()[0]!.status).toBe('failed');
  fail = false; const second = jobs.enqueue(input()); await jobs.settled();
  expect(second).not.toBe(first); expect(jobs.snapshot()).toHaveLength(1); expect(jobs.snapshot()[0]!.status).toBe('ready');
});
