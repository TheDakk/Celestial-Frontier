import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  migrateStoredV4ToV5,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
} from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;

function controlledClock(start = 0) {
  let value = start;
  return { now: () => value, advance: (amount: number) => { value += amount; } };
}

async function migrated() {
  const backend = createMemoryBackend();
  await backend.apply([{
    store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
  }]);
  expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected loaded v5; got ${loaded.kind}`);
  return { backend, loaded };
}

describe('F4 runtime authority join', () => {
  it('accrues only under visible + answerable + lease and commits clock/RNG with the save', async () => {
    const { backend, loaded } = await migrated();
    const time = controlledClock(100);
    const runtime = createF4RuntimeAuthority({
      backend,
      repository: createRevisionedRepository(backend),
      registry: REGISTRY,
      initialRevision: 0,
      initialExtensions: loaded.extensions,
      restoredAuthority: null,
      freshSessionSeed: 0xAABBCCDD,
      ownerId: 'test-tab',
      token: 'test-session-a',
      leaseTtlMs: 1_000,
      now: time.now,
      visible: true,
      answerable: false,
    });

    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(300);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 0, accruing: false, leaseOwned: true });
    runtime.setAnswerable(true);
    time.advance(450);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 450, accruing: true });

    const outcome = await runtime.commit(loaded.state, NOW);
    expect(outcome.kind).toBe('committed');
    expect(runtime.revision).toBe(1);
    const stored = await readSaveV5(backend, REGISTRY, NOW);
    expect(stored.kind).toBe('loaded');
    if (stored.kind !== 'loaded') return;
    expect(readF4Authority(stored.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: 450,
        sessionRng: { seed: 0xAABBCCDD, ordinal: 0, draws: {} },
      },
    });
    expect(runtime.diagnostics()).toMatchObject({ commits: 1, staleWrites: 0, leaseLosses: 0 });
  });

  it('stops while hidden, releases ownership, and resumes only after reacquisition', async () => {
    const { backend, loaded } = await migrated();
    const time = controlledClock();
    const runtime = createF4RuntimeAuthority({
      backend,
      repository: createRevisionedRepository(backend),
      registry: REGISTRY,
      initialRevision: 0,
      initialExtensions: loaded.extensions,
      restoredAuthority: null,
      freshSessionSeed: 7,
      ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100, now: time.now,
      visible: true, answerable: true,
    });
    await runtime.heartbeat();
    time.advance(50);
    await expect(runtime.setVisible(false)).resolves.toEqual({ kind: 'lost' });
    time.advance(5_000);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 50, accruing: false, leaseOwned: false });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    await expect(runtime.setVisible(true)).resolves.toMatchObject({ kind: 'owned' });
    time.advance(25);
    expect(runtime.diagnostics().activePlayMs).toBe(75);
  });

  it('fails closed after a stale writer without silently rebasing or retrying', async () => {
    const { backend, loaded } = await migrated();
    const time = controlledClock();
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 8, ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    await repository.mutate({ expectedRevision: 0, writes: [{ store: 'player', key: 'race', value: 'won' }] });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({
      kind: 'stale', expectedRevision: 0, actualRevision: 1,
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: 0, leaseOwned: false, staleBlocked: true, accruing: false, staleWrites: 1,
    });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'lost' });
  });

  it('restores persisted authority exactly and never lets Reduced Motion enter eligibility', async () => {
    const { backend, loaded } = await migrated();
    const time = controlledClock(10);
    const runtime = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions,
      restoredAuthority: {
        activePlayMs: 9_000,
        sessionRng: { seed: 42, ordinal: 3, draws: { capture: 2 } },
      },
      freshSessionSeed: 999,
      ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    time.advance(5);
    expect(runtime.diagnostics()).toMatchObject({
      activePlayMs: 9_005,
      sessionSeed: 42,
      sessionOrdinal: 3,
      sessionDraws: { capture: 2 },
    });
    expect(JSON.stringify(runtime.diagnostics())).not.toMatch(/motion/i);
  });
});
