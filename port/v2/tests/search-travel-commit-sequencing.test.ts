import { describe, expect, it } from 'vitest';
import { createProductActionCoordinator } from '../apps/game/src/product-action-coordinator.js';
import { commitSearchTravelSequence } from '../apps/game/src/search-travel.js';

interface SequenceFixtureOptions {
  readonly named: boolean;
  readonly followCommits: boolean;
  /** Negative control for the former world-name finally regression. */
  readonly queueRefreshFromNameFinally?: boolean;
  /** Exercise an ordinary debounce firing behind the name's active barrier. */
  readonly queueOrdinaryPersistBehindName?: boolean;
  /** Negative control for the former sequence without a persistence hold. */
  readonly disablePersistenceReservation?: boolean;
}

async function runFollowSequence(options: SequenceFixtureOptions): Promise<Readonly<{
  result: boolean;
  trace: readonly string[];
  refreshQueues: number;
  refreshClaims: number;
  persistAttempts: number;
  persistDeferrals: number;
  persistRearms: number;
  persistRuns: number;
  persistBusy: boolean;
  busy: boolean;
}>> {
  const coordinator = createProductActionCoordinator();
  const trace: string[] = [];
  let refreshQueues = 0;
  let refreshClaims = 0;
  const earlyRefreshHold: { release: (() => void) | null } = { release: null };
  let persistenceHeld = false;
  let persistDeferred = false;
  let persistAttempts = 0;
  let persistDeferrals = 0;
  let persistRearms = 0;
  let persistRuns = 0;
  const activePersistState: { current: Promise<void> | null } = { current: null };
  const persistHold: { release: (() => void) | null } = { release: null };

  const attemptOrdinaryPersist = (prior: Promise<unknown>): void => {
    persistAttempts += 1;
    if (persistenceHeld) {
      persistDeferred = true;
      persistDeferrals += 1;
      trace.push('persist:deferred');
      return;
    }
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const run = prior.then(async () => {
      persistRuns += 1;
      trace.push('persist:run');
      await gate;
      trace.push('persist:settled');
    });
    activePersistState.current = run;
    persistHold.release = release;
    trace.push('persist:queued');
    void run.finally(() => {
      if (activePersistState.current === run) activePersistState.current = null;
    });
  };

  const queueRefresh = (): void => {
    refreshQueues += 1;
    const ordinal = refreshQueues;
    trace.push(`refresh:${ordinal}:queued`);
    queueMicrotask(() => {
      trace.push(`refresh:${ordinal}:run`);
      if (activePersistState.current !== null) {
        trace.push(`refresh:${ordinal}:deferred-by-persist`);
        return;
      }
      const claim = coordinator.tryClaim('arc9-progression-refresh-v1');
      if (claim === null) {
        trace.push(`refresh:${ordinal}:blocked`);
        return;
      }
      refreshClaims += 1;
      trace.push(`refresh:${ordinal}:claimed`);
      if (options.queueRefreshFromNameFinally === true && ordinal === 1) {
        /* Hold the old early refresh through Follow's synchronous claim. This
           is the production race in bounded form, not a timer simulation. */
        earlyRefreshHold.release = () => claim.settle(false);
        return;
      }
      claim.settle(false);
      trace.push(`refresh:${ordinal}:settled`);
    });
  };

  let result = false;
  try {
    result = await commitSearchTravelSequence({
      commitName: options.named
        ? async () => {
          const claim = coordinator.tryClaim('arc0.world-name:earth');
          if (claim === null) throw new Error('name fixture unexpectedly starved');
          trace.push('name:claimed');
          if (options.queueOrdinaryPersistBehindName === true) {
            attemptOrdinaryPersist(claim.barrier);
          }
          await Promise.resolve();
          claim.settle(true);
          trace.push('name:settled');
          if (options.queueRefreshFromNameFinally === true) queueRefresh();
          return 'committed' as const;
        }
        : null,
      commitRoute: async (nameCommitted) => {
        trace.push(`follow:input:${nameCommitted ? 'named' : 'unnamed'}`);
        if (activePersistState.current !== null) {
          trace.push('follow:blocked-by-persist');
          return Object.freeze({ committed: false, progressionJoined: false });
        }
        const claim = coordinator.tryClaim('arc9-share-follow-v1');
        if (claim === null) {
          trace.push('follow:starved');
          return Object.freeze({ committed: false, progressionJoined: false });
        }
        trace.push('follow:claimed');
        await Promise.resolve();
        claim.settle(options.followCommits);
        trace.push(options.followCommits ? 'follow:committed' : 'follow:refused');
        return Object.freeze({
          committed: options.followCommits,
          progressionJoined: options.followCommits,
        });
      },
      queueUnjoinedNameProgression: queueRefresh,
      reserveInterposedPersistence: () => {
        if (options.disablePersistenceReservation === true) return () => {};
        if (persistenceHeld) return null;
        persistenceHeld = true;
        return () => {
          persistenceHeld = false;
          if (persistDeferred) {
            persistDeferred = false;
            persistRearms += 1;
            trace.push('persist:rearmed');
          }
        };
      },
    });
  } finally {
    if (earlyRefreshHold.release !== null) {
      earlyRefreshHold.release();
      trace.push('refresh:1:released');
    }
    if (persistHold.release !== null) {
      persistHold.release();
      persistHold.release = null;
    }
    const pendingPersist = activePersistState.current;
    if (pendingPersist !== null) await pendingPersist.catch(() => undefined);
  }
  await Promise.resolve();
  await Promise.resolve();
  return Object.freeze({
    result,
    trace: Object.freeze(trace.slice()),
    refreshQueues,
    refreshClaims,
    persistAttempts,
    persistDeferrals,
    persistRearms,
    persistRuns,
    persistBusy: activePersistState.current !== null,
    busy: coordinator.busy,
  });
}

describe('Search name -> Follow composite predecessor sequencing', () => {
  it('lets a named Follow claim immediately after name settlement without an early refresh', async () => {
    const outcome = await runFollowSequence({ named: true, followCommits: true });
    expect(outcome).toMatchObject({
      result: true,
      refreshQueues: 0,
      refreshClaims: 0,
      busy: false,
    });
    expect(outcome.trace).toEqual([
      'name:claimed',
      'name:settled',
      'follow:input:named',
      'follow:claimed',
      'follow:committed',
    ]);
  });

  it('leaves an unnamed Follow on the same direct claim path', async () => {
    const outcome = await runFollowSequence({ named: false, followCommits: true });
    expect(outcome).toMatchObject({
      result: true,
      refreshQueues: 0,
      refreshClaims: 0,
      busy: false,
    });
    expect(outcome.trace).toEqual([
      'follow:input:unnamed',
      'follow:claimed',
      'follow:committed',
    ]);
  });

  it('queues exactly one name catch-up only after a post-name Follow refusal', async () => {
    const outcome = await runFollowSequence({ named: true, followCommits: false });
    expect(outcome).toMatchObject({
      result: false,
      refreshQueues: 1,
      refreshClaims: 1,
      busy: false,
    });
    expect(outcome.trace).toEqual([
      'name:claimed',
      'name:settled',
      'follow:input:named',
      'follow:claimed',
      'follow:refused',
      'refresh:1:queued',
      'refresh:1:run',
      'refresh:1:claimed',
      'refresh:1:settled',
    ]);
  });

  it('negative-controls the old early microtask: it claims first and starves Follow', async () => {
    const outcome = await runFollowSequence({
      named: true,
      followCommits: true,
      queueRefreshFromNameFinally: true,
    });
    expect(outcome.result).toBe(false);
    expect(outcome.trace.indexOf('refresh:1:claimed'))
      .toBeLessThan(outcome.trace.indexOf('follow:starved'));
    expect(outcome.trace).toContain('follow:starved');
    expect(outcome.busy).toBe(false);
  });

  it('defers and re-arms an ordinary persist instead of letting it interpose before Follow', async () => {
    const outcome = await runFollowSequence({
      named: true,
      followCommits: true,
      queueOrdinaryPersistBehindName: true,
    });
    expect(outcome).toMatchObject({
      result: true,
      persistAttempts: 1,
      persistDeferrals: 1,
      persistRearms: 1,
      persistRuns: 0,
      persistBusy: false,
      refreshQueues: 0,
      busy: false,
    });
    expect(outcome.trace.indexOf('persist:deferred'))
      .toBeLessThan(outcome.trace.indexOf('follow:claimed'));
    expect(outcome.trace.indexOf('follow:committed'))
      .toBeLessThan(outcome.trace.indexOf('persist:rearmed'));
  });

  it('negative-controls the old ordinary-persist tail starving Follow and its catch-up', async () => {
    const outcome = await runFollowSequence({
      named: true,
      followCommits: true,
      queueOrdinaryPersistBehindName: true,
      disablePersistenceReservation: true,
    });
    expect(outcome).toMatchObject({
      result: false,
      persistAttempts: 1,
      persistDeferrals: 0,
      persistRearms: 0,
      persistRuns: 1,
      persistBusy: false,
      refreshQueues: 1,
      refreshClaims: 0,
      busy: false,
    });
    expect(outcome.trace).toContain('follow:blocked-by-persist');
    expect(outcome.trace).toContain('refresh:1:deferred-by-persist');
  });
});
