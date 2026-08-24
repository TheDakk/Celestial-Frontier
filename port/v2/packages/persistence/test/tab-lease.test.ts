import { describe, expect, it } from 'vitest';
import {
  F3_ACTIVE_PLAY_LEASE_KEY,
  TabLeaseRecordError,
  createMemoryBackend,
  createTabLeaseClient,
  type StorageBackend,
} from '@cf/persistence';

function controlledClock(start = 0): { now: () => number; advance: (ms: number) => void; set: (ms: number) => void } {
  let value = start;
  return {
    now: () => value,
    advance: (ms) => { value += ms; },
    set: (ms) => { value = ms; },
  };
}

function client(
  backend: StorageBackend,
  ownerId: string,
  token: string,
  clock: ReturnType<typeof controlledClock>,
  ttlMs = 100,
) {
  return createTabLeaseClient(backend, { ownerId, token, ttlMs, now: clock.now });
}

describe('@cf/persistence — F3 active-play tab lease', () => {
  it('acquires an empty lease and renews the same exact tab token', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock();
    const owner = client(backend, 'tab-a', 'session-a', clock);

    const acquired = await owner.acquire();
    expect(acquired).toMatchObject({
      kind: 'acquired',
      grant: { ownerId: 'tab-a', token: 'session-a', heartbeat: 0 },
    });
    if (acquired.kind !== 'acquired') throw new Error('expected acquisition');
    expect(acquired.grant.check).toEqual({
      store: 'meta',
      key: F3_ACTIVE_PLAY_LEASE_KEY,
      value: await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY),
    });

    clock.advance(25);
    await expect(owner.renew()).resolves.toMatchObject({
      kind: 'renewed',
      grant: { ownerId: 'tab-a', token: 'session-a', heartbeat: 1 },
    });
    await expect(owner.acquire()).resolves.toMatchObject({
      kind: 'renewed',
      grant: { heartbeat: 2 },
    });
  });

  it('keeps a live lease with its owner before the exact expiry boundary', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock();
    const owner = client(backend, 'tab-a', 'session-a', clock);
    const contender = client(backend, 'tab-b', 'session-b', clock);
    await owner.acquire();

    await expect(contender.acquire()).resolves.toEqual({
      kind: 'held-by-other',
      holder: { ownerId: 'tab-a', token: 'session-a', heartbeat: 0 },
      remainingMs: 100,
    });
    clock.advance(99.999);
    const held = await contender.acquire();
    expect(held.kind).toBe('held-by-other');
    if (held.kind !== 'held-by-other') throw new Error('expected held lease');
    expect(held.remainingMs).toBeCloseTo(0.001, 9);

    expect(JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({
      ownerId: 'tab-a', token: 'session-a', heartbeat: 0,
    });
  });

  it('acquires at exact expiry only after observing one unchanged persisted heartbeat for the TTL', async () => {
    const backend = createMemoryBackend();
    const ownerClock = controlledClock(50_000);
    const contenderClock = controlledClock(7);
    const owner = client(backend, 'tab-a', 'session-a', ownerClock);
    const successor = client(backend, 'tab-b', 'session-b', contenderClock);
    await owner.acquire();
    await successor.acquire();

    contenderClock.advance(100);
    const result = await successor.acquire();
    expect(result).toMatchObject({
      kind: 'acquired',
      grant: { ownerId: 'tab-b', token: 'session-b', heartbeat: 1 },
    });
  });

  it('lets only one of two expired contenders win the checked takeover', async () => {
    const backend = createMemoryBackend();
    const ownerClock = controlledClock(90_000);
    const leftClock = controlledClock(0);
    const rightClock = controlledClock(700);
    const owner = client(backend, 'owner', 'owner-session', ownerClock, 20);
    const left = client(backend, 'left', 'left-session', leftClock, 20);
    const right = client(backend, 'right', 'right-session', rightClock, 20);
    await owner.acquire();
    await Promise.all([left.acquire(), right.acquire()]);
    leftClock.advance(20);
    rightClock.advance(20);

    const outcomes = await Promise.all([left.acquire(), right.acquire()]);
    expect(outcomes.map((outcome) => outcome.kind).sort()).toEqual(['acquired', 'lost']);
    const winner = outcomes.find((outcome) => outcome.kind === 'acquired');
    if (winner?.kind !== 'acquired') throw new Error('expected one checked takeover winner');
    expect(JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({
      ownerId: winner.grant.ownerId,
      token: winner.grant.token,
      heartbeat: 1,
    });
  });

  it('a changed heartbeat restarts a contender’s local expiry observation', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock();
    const owner = client(backend, 'tab-a', 'session-a', clock, 10);
    const contender = client(backend, 'tab-b', 'session-b', clock, 10);
    await owner.acquire();
    await contender.acquire();

    clock.advance(9);
    await owner.renew();
    await expect(contender.acquire()).resolves.toMatchObject({ kind: 'held-by-other', remainingMs: 10 });
    clock.advance(9);
    await expect(contender.acquire()).resolves.toMatchObject({ kind: 'held-by-other', remainingMs: 1 });
    clock.advance(1);
    await expect(contender.acquire()).resolves.toMatchObject({ kind: 'acquired', grant: { token: 'session-b' } });
  });

  it('a stale predecessor cannot renew or release its successor', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock();
    const predecessor = client(backend, 'tab', 'old-session', clock, 10);
    const successor = client(backend, 'tab', 'new-session', clock, 10);
    await predecessor.acquire();
    await successor.acquire();
    clock.advance(10);
    await successor.acquire();

    await expect(predecessor.renew()).resolves.toEqual({
      kind: 'lost',
      reason: 'superseded',
      holder: { ownerId: 'tab', token: 'new-session', heartbeat: 1 },
    });
    await expect(predecessor.release()).resolves.toEqual({
      kind: 'lost',
      reason: 'superseded',
      holder: { ownerId: 'tab', token: 'new-session', heartbeat: 1 },
    });
    expect(JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({
      token: 'new-session', heartbeat: 1,
    });

    await expect(successor.release()).resolves.toEqual({
      kind: 'released',
      holder: { ownerId: 'tab', token: 'new-session', heartbeat: 1 },
    });
    expect(JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({
      held: false, token: 'new-session', heartbeat: 2,
    });
    await expect(successor.release()).resolves.toEqual({ kind: 'lost', reason: 'not-held', holder: null });
  });

  it('never recreates an old fence when the same token releases and reacquires', async () => {
    const backend = createMemoryBackend();
    const owner = client(backend, 'tab', 'session', controlledClock());
    const first = await owner.acquire();
    if (first.kind !== 'acquired') throw new Error('expected initial acquisition');
    await owner.release();
    const second = await owner.acquire();
    if (second.kind !== 'acquired') throw new Error('expected immediate tombstone acquisition');

    expect(second.grant.heartbeat).toBe(2);
    expect(second.grant.check.value).not.toBe(first.grant.check.value);
    expect(await backend.compareAndApply(
      [first.grant.check],
      [{ store: 'player', key: 'stale-accrual', value: 'must-not-land' }],
    )).toBe(false);
  });

  it('exposes an exact fence so F4 accrual cannot commit after lease succession', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock();
    const predecessor = client(backend, 'tab-a', 'session-a', clock, 5);
    const successor = client(backend, 'tab-b', 'session-b', clock, 5);
    const first = await predecessor.acquire();
    if (first.kind !== 'acquired') throw new Error('expected first acquisition');

    expect(await backend.compareAndApply(
      [first.grant.check],
      [{ store: 'player', key: 'fenced-candidate', value: '5' }],
    )).toBe(true);
    await successor.acquire();
    clock.advance(5);
    await successor.acquire();

    expect(await backend.compareAndApply(
      [first.grant.check],
      [{ store: 'player', key: 'fenced-candidate', value: '10' }],
    )).toBe(false);
    expect(await backend.get('player', 'fenced-candidate')).toBe('5');
  });

  it('reports a checked-transaction race as lost without overwriting the winner', async () => {
    const base = createMemoryBackend();
    const clock = controlledClock();
    let injectRace = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (injectRace) {
          injectRace = false;
          await base.apply([{
            store: 'meta', key: F3_ACTIVE_PLAY_LEASE_KEY,
            value: '{"schema":1,"held":true,"ownerId":"tab-b","token":"session-b","heartbeat":1}',
          }]);
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const owner = client(backend, 'tab-a', 'session-a', clock);
    await owner.acquire();
    injectRace = true;

    await expect(owner.renew()).resolves.toEqual({
      kind: 'lost',
      reason: 'race',
      holder: { ownerId: 'tab-b', token: 'session-b', heartbeat: 1 },
    });
    expect(JSON.parse((await base.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({ token: 'session-b' });
  });

  it('rejects invalid identities, TTLs, and non-monotonic clocks before they can mutate storage', async () => {
    const backend = createMemoryBackend();
    const clock = controlledClock(5);
    expect(() => client(backend, '', 'token', clock)).toThrow('ownerId must be');
    expect(() => client(backend, 'tab', 'contains space', clock)).toThrow('token must be');
    expect(() => client(backend, 'tab', 'token', clock, 0)).toThrow('ttlMs must be');

    const owner = client(backend, 'tab', 'token', clock);
    await owner.acquire();
    clock.set(4);
    await expect(owner.renew()).rejects.toThrow('monotonic clock moved backwards');
    expect(JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({ heartbeat: 0 });
  });

  it('fails closed on corrupt or future lease rows and preserves their exact bytes', async () => {
    for (const raw of [
      '{"schema":2,"held":true,"ownerId":"future","token":"future-token","heartbeat":0}',
      '{"schema":1,"held":true,"ownerId":"tab","token":"token","heartbeat":-1}',
      '{"schema":1,"held":true,"ownerId":"tab","token":"token","heartbeat":0,"extra":true}',
      'not-json',
    ]) {
      const backend = createMemoryBackend();
      await backend.apply([{ store: 'meta', key: F3_ACTIVE_PLAY_LEASE_KEY, value: raw }]);
      const owner = client(backend, 'tab-a', 'session-a', controlledClock());
      await expect(owner.acquire(), raw).rejects.toBeInstanceOf(TabLeaseRecordError);
      expect(await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY), raw).toBe(raw);
    }
  });
});
