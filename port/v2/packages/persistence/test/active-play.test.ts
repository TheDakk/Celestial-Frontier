import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createActivePlayClock } from '@cf/domain-progression';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  F3_REVISION_KEY,
  F4_AUTHORITY_NAMESPACE,
  V4_PRIMARY_KEY,
  createActivePlayPersistenceOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  migrateStoredV4ToV5,
  prepareV5SaveWrite,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type StorageBackend,
  type StorageCheck,
  type StorageOperation,
  type TabLeaseGrant,
  type V5WritableState,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const VETERAN_RAW = JSON.stringify(fixtures.inputs.veteran_rich);
const eligible = Object.freeze({ visible: true, answerable: true, leaseOwned: true });

function controlledClock(start = 0): { now: () => number; advance: (ms: number) => void } {
  let value = start;
  return { now: () => value, advance: (ms) => { value += ms; } };
}

async function acquire(
  backend: StorageBackend,
  ownerId: string,
  token: string,
  clock: ReturnType<typeof controlledClock>,
  ttlMs = 10,
): Promise<{ client: ReturnType<typeof createTabLeaseClient>; grant: TabLeaseGrant }> {
  const client = createTabLeaseClient(backend, { ownerId, token, ttlMs, now: clock.now });
  const outcome = await client.acquire();
  if (outcome.kind !== 'acquired') throw new Error(`expected acquisition, received ${outcome.kind}`);
  return { client, grant: outcome.grant };
}

async function migrated(backend: StorageBackend): Promise<V5WritableState> {
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
  expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected loaded v5, received ${loaded.kind}`);
  return { state: loaded.state, extensions: loaded.extensions };
}

describe('@cf/persistence — F3/F4 active-play persistence owner', () => {
  it('writes the versioned authority, all v5 rows, mirror, and next revision in one fenced transaction', async () => {
    const base = createMemoryBackend();
    let activeTransaction: { checks: readonly StorageCheck[]; operations: readonly StorageOperation[] } | null = null;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations) {
        if (operations.some((operation) => operation.store === 'meta' && operation.key === F3_REVISION_KEY)) {
          activeTransaction = { checks: [...checks], operations: [...operations] };
        }
        return base.compareAndApply(checks, operations);
      },
    };
    const writable = await migrated(backend);
    const revisioned = createRevisionedRepository(backend);
    const owner = createActivePlayPersistenceOwner(revisioned, REGISTRY);
    const { grant } = await acquire(backend, 'tab-a', 'session-a', controlledClock());
    const snapshot = createActivePlayClock(1_000, eligible, 100).current(350);
    const sessionRng = createSessionRNG(77, { zeta: 2, alpha: 1 }, 3).state();

    const outcome = await owner.commit({
      expectedRevision: 0, grant, writable, snapshot, sessionRng, now: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.revision).toBe(1);
    expect(outcome.authority).toEqual({
      activePlayMs: 1_250,
      sessionRng: { seed: 77, ordinal: 3, draws: { alpha: 1, zeta: 2 } },
    });
    expect(await base.get('meta', F3_REVISION_KEY)).toBe('1');
    expect(await base.get('player', 'activePlayMs')).toBeUndefined();
    expect(activeTransaction).not.toBeNull();
    expect(activeTransaction!.checks).toEqual([
      { store: 'meta', key: F3_REVISION_KEY, value: undefined },
      grant.check,
    ]);
    expect(activeTransaction!.operations).toEqual([
      ...outcome.saved.operations,
      { store: 'meta', key: F3_REVISION_KEY, value: '1' },
    ]);

    const loaded = await readSaveV5(base, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(readF4Authority(loaded.extensions)).toEqual({ kind: 'loaded', authority: outcome.authority });
    expect(loaded.legacyV4Raw).not.toContain('activePlayMs');
    expect(prepareV5SaveWrite({ state: loaded.state, extensions: loaded.extensions }, REGISTRY, NOW).operations)
      .toEqual(outcome.saved.operations);
  });

  it('returns lost and leaves every v5 row/revision unchanged after successor takeover', async () => {
    const backend = createMemoryBackend();
    const writable = await migrated(backend);
    const playerBefore = await backend.get('player', 'v5:player');
    const mirrorBefore = await backend.get('meta', V4_PRIMARY_KEY);
    const oldClock = controlledClock(50_000);
    const newClock = controlledClock(3);
    const old = await acquire(backend, 'old-tab', 'old-session', oldClock, 10);
    const successor = createTabLeaseClient(backend, {
      ownerId: 'new-tab', token: 'new-session', ttlMs: 10, now: newClock.now,
    });
    await successor.acquire();
    newClock.advance(10);
    await expect(successor.acquire()).resolves.toMatchObject({ kind: 'acquired' });

    const owner = createActivePlayPersistenceOwner(createRevisionedRepository(backend), REGISTRY);
    await expect(owner.commit({
      expectedRevision: 0,
      grant: old.grant,
      writable,
      snapshot: { activePlayMs: 500 },
      sessionRng: createSessionRNG(1).state(),
      now: NOW,
    })).resolves.toEqual({ kind: 'lost', reason: 'lease-lost' });
    expect(await backend.get('player', 'v5:player')).toBe(playerBefore);
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(mirrorBefore);
    expect(await backend.get('meta', F3_REVISION_KEY)).toBeUndefined();
  });

  it('returns stale and leaves active-play authority absent when the revision advanced first', async () => {
    const backend = createMemoryBackend();
    const writable = await migrated(backend);
    const revisioned = createRevisionedRepository(backend);
    const { grant } = await acquire(backend, 'tab-a', 'session-a', controlledClock());
    await revisioned.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'unrelated', value: 'committed-first' }],
    });

    const owner = createActivePlayPersistenceOwner(revisioned, REGISTRY);
    await expect(owner.commit({
      expectedRevision: 0,
      grant,
      writable,
      snapshot: { activePlayMs: 500 },
      sessionRng: createSessionRNG(2).state(),
      now: NOW,
    })).resolves.toEqual({ kind: 'stale', expectedRevision: 0, actualRevision: 1 });
    expect(await revisioned.revision()).toBe(1);
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') expect(readF4Authority(loaded.extensions)).toEqual({ kind: 'absent' });
  });

  it('preserves unrelated v5 extensions while replacing only the F4 authority namespace', async () => {
    const backend = createMemoryBackend();
    const loaded = await migrated(backend);
    const writable: V5WritableState = {
      state: loaded.state,
      extensions: {
        player: { 'arc2.inventory': { version: 1, json: '{"slots":12}' } },
        settings: { 'arc7.audio': { version: 1, json: '{"muted":false}' } },
      },
    };
    const { grant } = await acquire(backend, 'tab-a', 'session-a', controlledClock());
    const owner = createActivePlayPersistenceOwner(createRevisionedRepository(backend), REGISTRY);
    const outcome = await owner.commit({
      expectedRevision: 0,
      grant,
      writable,
      snapshot: { activePlayMs: 900 },
      sessionRng: createSessionRNG(3).state(),
      now: NOW,
    });
    expect(outcome.kind).toBe('committed');
    const after = await readSaveV5(backend, REGISTRY, NOW);
    expect(after.kind).toBe('loaded');
    if (after.kind !== 'loaded') return;
    expect(after.extensions.player?.['arc2.inventory']).toEqual({ version: 1, json: '{"slots":12}' });
    expect(after.extensions.settings?.['arc7.audio']).toEqual({ version: 1, json: '{"muted":false}' });
    expect(after.extensions.player?.[F4_AUTHORITY_NAMESPACE]).toBeDefined();
  });

  it('protects future/corrupt authority and rejects rollback or forged lease grants', async () => {
    expect(readF4Authority({ player: {
      [F4_AUTHORITY_NAMESPACE]: { version: 2, json: '{"future":true}' },
    } })).toEqual({ kind: 'future-version', version: 2 });
    expect(readF4Authority({ player: {
      [F4_AUTHORITY_NAMESPACE]: { version: 1, json: '{"activePlayMs":-1,"sessionRng":{}}' },
    } })).toEqual({ kind: 'corrupt' });

    const backend = createMemoryBackend();
    const writable = await migrated(backend);
    const { grant } = await acquire(backend, 'tab-a', 'session-a', controlledClock());
    const owner = createActivePlayPersistenceOwner(createRevisionedRepository(backend), REGISTRY);
    const counterfeit = Object.freeze({ ...grant, check: Object.freeze({ ...grant.check }) });
    await expect(owner.commit({
      expectedRevision: 0,
      grant: counterfeit,
      writable,
      snapshot: { activePlayMs: 10 },
      sessionRng: createSessionRNG(4).state(),
      now: NOW,
    })).rejects.toThrow('grant was not minted');

    const prior: V5WritableState = {
      state: writable.state,
      extensions: { player: {
        [F4_AUTHORITY_NAMESPACE]: {
          version: 1,
          json: '{"activePlayMs":20,"sessionRng":{"seed":4,"ordinal":0,"draws":{}}}',
        },
      } },
    };
    await expect(owner.commit({
      expectedRevision: 0,
      grant,
      writable: prior,
      snapshot: { activePlayMs: 19 },
      sessionRng: createSessionRNG(4).state(),
      now: NOW,
    })).rejects.toThrow('activePlayMs cannot move backwards');
    expect(await backend.get('meta', F3_REVISION_KEY)).toBeUndefined();
  });
});
