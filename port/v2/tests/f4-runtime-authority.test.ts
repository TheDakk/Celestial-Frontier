import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARC2_LOOT_NAMESPACE,
  F3_MAX_REVISION,
  V4_PRIMARY_KEY,
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  F3_ACTIVE_PLAY_LEASE_KEY,
  F4_AUTHORITY_NAMESPACE,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc2LootLegacyRestore,
  prepareF4AuthorityUpdate,
  prepareV5Replacement,
  readArc2Loot,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  createF4RuntimeAuthority,
  type F4RuntimeActionInput,
  type F4RuntimePreDrawMultiOutcomeInput,
  type F4RuntimeOutcomeInput,
  type F4RuntimeProductInput,
} from '../apps/game/src/f4-runtime-authority.js';

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

function capturePreDrawPolicy(
  witness: string,
  essenceDelta: number,
  observeDraws?: (serialized: string) => void,
): F4RuntimePreDrawMultiOutcomeInput<Readonly<{ witness: string }>, string>['preDraw'] {
  return (input, authorizer) => {
    const expectedState = { ...input.draft, essence: input.draft.essence + essenceDelta };
    const expectedF4 = prepareF4AuthorityUpdate(
      input.extensions,
      { activePlayMs: input.activePlayMs },
      input.nextSessionRng,
    );
    const expectedPrepared = input.codec.prepare({
      state: expectedState,
      extensions: expectedF4.extensions,
    });
    return authorizer.ready(
      Object.freeze({ witness }),
      ({ draws, draft }, settlementAuthorizer) => {
        observeDraws?.(JSON.stringify(draws));
        draft.essence += essenceDelta;
        return settlementAuthorizer.authorize(
          { state: draft, witness },
          expectedPrepared,
        );
      },
    );
  };
}

interface ReceiptEvidence {
  readonly keys: readonly string[];
  readonly rawByKey: Readonly<Record<string, string | undefined>>;
  readonly parsedByKey: Readonly<Record<string, unknown>>;
}

async function receiptEvidence(backend: StorageBackend): Promise<ReceiptEvidence> {
  const keys = [...await backend.keys('receipts')].sort();
  const rawByKey: Record<string, string | undefined> = {};
  const parsedByKey: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = await backend.get('receipts', key);
    rawByKey[key] = raw;
    parsedByKey[key] = raw === undefined ? undefined : JSON.parse(raw) as unknown;
  }
  return Object.freeze({
    keys: Object.freeze(keys),
    rawByKey: Object.freeze(rawByKey),
    parsedByKey: Object.freeze(parsedByKey),
  });
}

function sameReceiptEvidence(left: ReceiptEvidence, right: ReceiptEvidence): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function seedPriorTrainingOutcome(
  runtime: ReturnType<typeof createF4RuntimeAuthority>,
  state: SaveStateV2,
): Promise<SaveStateV2> {
  const outcome = await runtime.commitOutcome({
    state,
    domain: 'training.preexisting',
    receiptKind: 'training-prior-outcome',
    codecNow: NOW,
    derive: ({ draft, receiptOrdinal }) => ({
      state: draft,
      witness: `training-prior:${receiptOrdinal}`,
    }),
  });
  if (outcome.kind !== 'committed') throw new Error(`prior Training outcome was ${outcome.kind}`);
  return outcome.state;
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

  it('classifies an exhausted F3 revision as terminal without publishing product or receipt state', async () => {
    const { backend, loaded } = await migrated();
    await backend.apply([{
      store: 'meta', key: 'f3:revision', value: String(F3_MAX_REVISION - 1),
    }]);
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: F3_MAX_REVISION - 1,
      initialExtensions: loaded.extensions,
      restoredAuthority: null,
      freshSessionSeed: 0x11223344,
      ownerId: 'revision-limit-tab', token: 'revision-limit-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toMatchObject({
      kind: 'committed', revision: F3_MAX_REVISION,
    });
    const before = await readSaveV5(backend, REGISTRY, NOW);
    if (before.kind !== 'loaded') throw new Error(`revision-limit baseline was ${before.kind}`);
    const receiptsBefore = await receiptEvidence(backend);

    const exhausted = await runtime.commitProduct({
      state: before.state,
      operation: 'salvage',
      codecNow: NOW,
      derive: ({ draft, receiptOrdinal }) => {
        draft.essence += 1;
        return {
          state: draft,
          extensionWrites: [{
            segment: 'inventory', namespace: 'test.revision-limit',
            carrier: { version: 1, json: '{"mustNotLand":true}' },
          }],
          witness: `revision-limit:${receiptOrdinal}`,
        };
      },
    });
    expect(exhausted).toMatchObject({
      kind: 'revision-exhausted',
      revision: F3_MAX_REVISION,
      plan: { receiptOrdinal: 0 },
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: F3_MAX_REVISION,
      commits: 1,
      staleWrites: 0,
      staleBlocked: true,
      leaseOwned: false,
      accruing: false,
      sessionOrdinal: 0,
      sessionDraws: {},
    });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'lost' });
    const after = await readSaveV5(backend, REGISTRY, NOW);
    if (after.kind !== 'loaded') throw new Error(`revision-limit reload was ${after.kind}`);
    expect(JSON.stringify(after.state)).toBe(JSON.stringify(before.state));
    expect(after.extensions).toEqual(before.extensions);
    expect(sameReceiptEvidence(await receiptEvidence(backend), receiptsBefore)).toBe(true);
    expect(await repository.revision()).toBe(F3_MAX_REVISION);
  });

  it('accepts the readable maximum revision at F4 join and terminally refuses its next checkpoint', async () => {
    const { backend, loaded } = await migrated();
    await backend.apply([{
      store: 'meta', key: 'f3:revision', value: String(F3_MAX_REVISION),
    }]);
    const repository = createRevisionedRepository(backend);
    const before = await readSaveV5(backend, REGISTRY, NOW);
    if (before.kind !== 'loaded') throw new Error(`maximum-revision baseline was ${before.kind}`);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: F3_MAX_REVISION,
      initialExtensions: loaded.extensions,
      restoredAuthority: null,
      freshSessionSeed: 0x55667788,
      ownerId: 'maximum-revision-tab', token: 'maximum-revision-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });

    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({
      kind: 'revision-exhausted', revision: F3_MAX_REVISION,
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: F3_MAX_REVISION,
      commits: 0,
      staleWrites: 0,
      staleBlocked: true,
      leaseOwned: false,
      accruing: false,
    });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'lost' });
    const after = await readSaveV5(backend, REGISTRY, NOW);
    if (after.kind !== 'loaded') throw new Error(`maximum-revision reload was ${after.kind}`);
    expect(JSON.stringify(after.state)).toBe(JSON.stringify(before.state));
    expect(after.extensions).toEqual(before.extensions);
    expect(readF4Authority(after.extensions)).toEqual({ kind: 'absent' });
    expect(await repository.revision()).toBe(F3_MAX_REVISION);
  });

  it('holds a loaded maximum revision at the app boot classifier before F4 runtime creation', () => {
    const source = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
    const assess = (candidate: string): string[] => {
      const errors: string[] = [];
      const acceptStart = candidate.indexOf('const acceptCurrent = async (');
      const acceptEnd = candidate.indexOf('\n  };', acceptStart);
      const acceptCurrent = acceptStart >= 0 && acceptEnd > acceptStart
        ? candidate.slice(acceptStart, acceptEnd) : '';
      const revisionAssignment = acceptCurrent.indexOf('initialRevision = current.revision;');
      const exhaustion = acceptCurrent.indexOf('if (!persistHold && initialRevision === F3_MAX_REVISION)');
      const protectedHold = acceptCurrent.indexOf("persistHold = 'protected-payload';", exhaustion);
      const protectedKind = acceptCurrent.indexOf(
        "persistenceBootKind = 'revision-exhausted-protected';",
        exhaustion,
      );
      const writableContinuation = acceptCurrent.indexOf('if (!persistHold) {', exhaustion + 1);
      if (!candidate.includes('F3_ACTIVE_PLAY_LEASE_KEY, F3_MAX_REVISION,')) errors.push('shared-limit');
      if (!(revisionAssignment >= 0 && exhaustion > revisionAssignment
        && protectedHold > exhaustion && protectedKind > protectedHold
        && writableContinuation > protectedKind)) errors.push('boot-protection-order');
      if (!candidate.includes("| 'corrupt-protected' | 'revision-exhausted-protected' | 'transient-protected';")) {
        errors.push('typed-boot-kind');
      }
      return errors;
    };

    expect(assess(source)).toEqual([]);
    expect(assess(source.replace(
      'if (!persistHold && initialRevision === F3_MAX_REVISION)',
      'if (!persistHold && false)',
    ))).toContain('boot-protection-order');
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

  it('fails closed when initial lease acquisition storage rejects, then reacquires only on an explicit heartbeat', async () => {
    const { backend: base, loaded } = await migrated();
    let rejectLeaseRead = true;
    const backend: StorageBackend = {
      ...base,
      async get(store, key) {
        if (rejectLeaseRead && store === 'meta' && key === F3_ACTIVE_PLAY_LEASE_KEY) {
          throw new Error('injected lease acquire rejection');
        }
        return base.get(store, key);
      },
    };
    const time = controlledClock(100);
    const runtime = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 7, ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });

    time.advance(40);
    await expect(runtime.heartbeat()).resolves.toEqual({
      kind: 'storage-error',
      operation: 'acquire',
      message: 'injected lease acquire rejection',
    });
    time.advance(5_000);
    expect(runtime.diagnostics()).toMatchObject({
      activePlayMs: 0,
      accruing: false,
      leaseOwned: false,
      leaseHeartbeat: null,
      leaseLosses: 0,
    });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    rejectLeaseRead = false;
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(25);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 25, accruing: true, leaseOwned: true });
  });

  it('revokes lease and accrual immediately when renewal storage rejects', async () => {
    const { backend: base, loaded } = await migrated();
    let rejectLeaseRead = false;
    const backend: StorageBackend = {
      ...base,
      async get(store, key) {
        if (rejectLeaseRead && store === 'meta' && key === F3_ACTIVE_PLAY_LEASE_KEY) {
          throw new Error('injected lease renew rejection');
        }
        return base.get(store, key);
      },
    };
    const time = controlledClock();
    const runtime = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 8, ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });

    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(40);
    rejectLeaseRead = true;
    await expect(runtime.heartbeat()).resolves.toEqual({
      kind: 'storage-error',
      operation: 'renew',
      message: 'injected lease renew rejection',
    });
    expect(runtime.diagnostics()).toMatchObject({
      activePlayMs: 40,
      accruing: false,
      leaseOwned: false,
      leaseHeartbeat: null,
      leaseLosses: 1,
    });
    time.advance(5_000);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 40, accruing: false, leaseOwned: false });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    rejectLeaseRead = false;
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 1 });
    time.advance(25);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 65, accruing: true, leaseOwned: true });
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

  it('refuses an ephemeral first roll, then atomically publishes canonical product + RNG + receipt after durable seed bootstrap', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0x1234ABCD, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    let derivations = 0;
    const derive: F4RuntimeOutcomeInput['derive'] = ({ draft, value }) => {
      derivations++;
      draft.essence += value < 0.5 ? 1 : 2;
      return { state: draft, witness: `arc2:${draft.essence}` };
    };
    await expect(runtime.commitOutcome({
      state: loaded.state, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW, derive,
    })).resolves.toEqual({ kind: 'protected', reason: 'authority-absent' });
    expect(derivations).toBe(0);
    expect(await repository.readReceipt(0)).toBeUndefined();

    const seeded = await runtime.commit(loaded.state, NOW);
    expect(seeded.kind).toBe('committed');
    const beforeEssence = loaded.state.essence;
    const outcome = await runtime.commitOutcome({
      state: loaded.state, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW, derive,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(derivations).toBe(1);
    expect(outcome.state).toBe(outcome.saved.canonicalState);
    expect(outcome.state.essence).toBe(beforeEssence + (outcome.plan.value < 0.5 ? 1 : 2));
    expect(loaded.state.essence).toBe(beforeEssence);
    expect(runtime.revision).toBe(2);
    expect(runtime.sessionRng).toEqual({ seed: 0x1234ABCD, ordinal: 1, draws: { 'loot.rarity': 1 } });
    expect(await repository.readReceipt(0)).toEqual(outcome.receipt);
  });

  it('binds concurrent same-parent outcomes before queueing so the loser cannot erase the winner', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0x13579BDF, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');

    const beforeEssence = loaded.state.essence;
    const first = runtime.commitOutcome({
      state: loaded.state,
      domain: 'concurrent.first',
      receiptKind: 'concurrent-first-settlement',
      codecNow: NOW,
      derive: ({ draft }) => {
        draft.essence += 11;
        return { state: draft, witness: `first:${draft.essence}` };
      },
    });
    const second = runtime.commitOutcome({
      state: loaded.state,
      domain: 'concurrent.second',
      receiptKind: 'concurrent-second-settlement',
      codecNow: NOW,
      derive: ({ draft }) => {
        draft.essence += 101;
        return { state: draft, witness: `second:${draft.essence}` };
      },
    });
    const [winner, loser] = await Promise.all([first, second]);

    expect(winner.kind).toBe('committed');
    expect(loser).toMatchObject({
      kind: 'stale', expectedRevision: 1, actualRevision: 2,
      plan: { domain: 'concurrent.second', receiptOrdinal: 0 },
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: 2,
      commits: 2,
      staleWrites: 1,
      staleBlocked: true,
      leaseOwned: false,
      sessionOrdinal: 1,
      sessionDraws: { 'concurrent.first': 1 },
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    expect((await repository.readReceipt(0))?.kind).toBe('concurrent-first-settlement');

    const stored = await readSaveV5(backend, REGISTRY, NOW);
    expect(stored.kind).toBe('loaded');
    if (stored.kind !== 'loaded') return;
    expect(stored.state.essence).toBe(beforeEssence + 11);
    expect(readF4Authority(stored.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: 0,
        sessionRng: {
          seed: 0x13579BDF,
          ordinal: 1,
          draws: { 'concurrent.first': 1 },
        },
      },
    });
  });

  it('publishes one ordered capture transaction from an immutable submission snapshot', async () => {
    const migratedCase = await migrated();
    const base = migratedCase.backend;
    let receiptMutations = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (operations.some(({ store }) => store === 'receipts')) receiptMutations++;
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const repository = createRevisionedRepository(backend);
    const time = controlledClock();
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: migratedCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE, ownerId: 'tab-a', token: 'capture-document', leaseTtlMs: 1_000,
      now: time.now, visible: true, answerable: true,
    });
    await runtime.heartbeat();

    let protectedDerivations = 0;
    await expect(runtime.commitOutcomes({
      state: migratedCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      derive: ({ draft }) => {
        protectedDerivations++;
        return { state: draft, witness: 'must-not-run' };
      },
    })).resolves.toEqual({ kind: 'protected', reason: 'authority-absent' });
    expect(protectedDerivations).toBe(0);
    expect(receiptMutations).toBe(0);

    expect((await runtime.commit(migratedCase.loaded.state, NOW)).kind).toBe('committed');
    time.advance(345);
    const liveExtensions = runtime.extensions;
    const domains = ['capture.candidate', 'capture.success'];
    Object.defineProperty(domains, Symbol.iterator, {
      value: function* () { yield 'caller.iterator-forgery'; },
    });
    const beforeEssence = migratedCase.loaded.state.essence;
    let observedDerivations = 0;
    const pending = runtime.commitOutcomes({
      state: migratedCase.loaded.state,
      domains,
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      derive: ({ draws, receiptOrdinal, activePlayMs, draft, extensions }) => {
        observedDerivations++;
        expect(draws).toEqual([
          { domain: 'capture.candidate', value: 0.022386470576748252 },
          { domain: 'capture.success', value: 0.7921125674620271 },
        ]);
        expect(Object.isFrozen(draws)).toBe(true);
        expect(draws.every(Object.isFrozen)).toBe(true);
        expect(() => {
          (draws[0] as { domain: string }).domain = 'caller.forgery';
        }).toThrow();
        expect(receiptOrdinal).toBe(0);
        expect(activePlayMs).toBe(345);
        expect(draft).not.toBe(migratedCase.loaded.state);
        expect(extensions).not.toBe(liveExtensions);
        draft.essence += 2;
        return {
          state: draft,
          witness: 'capture:0:candidate=0.022386470576748252:success=0.7921125674620271',
          extensionWrites: [{
            segment: 'inventory',
            namespace: 'test.arc4-capture',
            carrier: { version: 1, json: '{"captured":true}' },
          }],
        };
      },
    });
    domains.reverse();
    domains[0] = 'caller.replacement';
    const outcome = await pending;

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(observedDerivations).toBe(1);
    expect(outcome.plan.draws.map(({ domain }) => domain)).toEqual([
      'capture.candidate', 'capture.success',
    ]);
    expect(outcome.state).toBe(outcome.saved.canonicalState);
    expect(outcome.state.essence).toBe(beforeEssence + 2);
    expect(migratedCase.loaded.state.essence).toBe(beforeEssence);
    expect(receiptMutations).toBe(1);
    expect(runtime.revision).toBe(2);
    expect(runtime.sessionRng).toEqual({
      seed: 0xC0FFEE,
      ordinal: 1,
      draws: { 'capture.candidate': 1, 'capture.success': 1 },
    });
    expect(runtime.extensions.inventory?.['test.arc4-capture']).toEqual({
      version: 1, json: '{"captured":true}',
    });
    expect(await repository.readReceipt(0)).toEqual(outcome.receipt);
    expect(outcome.receipt).toMatchObject({ ordinal: 0, kind: 'capture-attempt' });

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`capture reload was ${reloaded.kind}`);
    expect(reloaded.state.essence).toBe(beforeEssence + 2);
    expect(readF4Authority(reloaded.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: 345,
        sessionRng: {
          seed: 0xC0FFEE,
          ordinal: 1,
          draws: { 'capture.candidate': 1, 'capture.success': 1 },
        },
      },
    });
  });

  it('owns the pre-draw capacity callback lifecycle without changing commitOutcomes', async () => {
    const migratedCase = await migrated();
    const repository = createRevisionedRepository(migratedCase.backend);
    const runtime = createF4RuntimeAuthority({
      backend: migratedCase.backend,
      repository,
      registry: REGISTRY,
      initialRevision: 0,
      initialExtensions: migratedCase.loaded.extensions,
      restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE,
      ownerId: 'tab-a', token: 'pre-draw-document', leaseTtlMs: 1_000,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(migratedCase.loaded.state, NOW)).kind).toBe('committed');
    const beforeRevision = runtime.revision;
    const beforeRng = runtime.sessionRng;
    let refusedSettlement = 0;
    const refused = await runtime.commitOutcomesPreDraw({
      state: migratedCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: (input) => {
        expect(JSON.stringify(input)).not.toContain('"value"');
        return { kind: 'refused', reason: 'capacity' };
      },
    });
    expect(refused).toEqual({ kind: 'pre-draw-refused', reason: 'capacity' });
    expect(refusedSettlement).toBe(0);
    expect(runtime.revision).toBe(beforeRevision);
    expect(runtime.sessionRng).toEqual(beforeRng);
    expect(await repository.readReceipt(0)).toBeUndefined();

    const domains = ['capture.candidate', 'capture.success'];
    const trace: string[] = [];
    const pending = runtime.commitOutcomesPreDraw({
      state: migratedCase.loaded.state,
      domains,
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: (input, authorizer) => {
        trace.push('pre-draw');
        expect(input.domains).toEqual(['capture.candidate', 'capture.success']);
        expect(input.counters).toEqual([
          { domain: 'capture.candidate', counter: 0 },
          { domain: 'capture.success', counter: 0 },
        ]);
        const expectedState = { ...input.draft, essence: input.draft.essence + 1 };
        const expectedF4 = prepareF4AuthorityUpdate(
          input.extensions,
          { activePlayMs: input.activePlayMs },
          input.nextSessionRng,
        );
        const expectedPrepared = input.codec.prepare({
          state: expectedState,
          extensions: expectedF4.extensions,
        });
        return authorizer.ready(
          Object.freeze({ ok: true as const }),
          ({ plan, proof, draws, draft },
            settlementAuthorizer) => {
            trace.push('derive');
            expect(proof).toEqual({ ok: true });
            expect(plan.draws).toBe(draws);
            draft.essence += 1;
            return settlementAuthorizer.authorize(
              { state: draft, witness: 'runtime-pre-draw' },
              expectedPrepared,
            );
          },
        );
      },
    });
    domains.reverse();
    const committed = await pending;
    expect(committed.kind).toBe('committed');
    if (committed.kind !== 'committed') return;
    expect(trace).toEqual(['pre-draw', 'derive']);
    expect(committed.plan.draws.map(({ domain }) => domain)).toEqual([
      'capture.candidate', 'capture.success',
    ]);
    expect(runtime.revision).toBe(beforeRevision + 1);
    expect(runtime.sessionRng).toEqual({
      seed: 0xC0FFEE,
      ordinal: 1,
      draws: { 'capture.candidate': 1, 'capture.success': 1 },
    });
    expect(await repository.readReceipt(0)).toEqual(committed.receipt);
  });

  it('keeps rejected and storage-aborted capture plans private, then reloads and retries identically', async () => {
    const migratedCase = await migrated();
    const base = migratedCase.backend;
    let failNextCapture = false;
    let receiptMutations = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (operations.some(({ store }) => store === 'receipts')) {
          receiptMutations++;
          if (failNextCapture) {
            failNextCapture = false;
            throw new Error('injected capture transaction abort');
          }
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const repository = createRevisionedRepository(backend);
    const first = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: migratedCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE, ownerId: 'tab', token: 'capture-one', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await first.heartbeat();
    expect((await first.commit(migratedCase.loaded.state, NOW)).kind).toBe('committed');
    const baselineExtensions = first.extensions;
    const baselineRng = first.sessionRng;
    const rejected = await first.commitOutcomes({
      state: migratedCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: '' }),
    });
    expect(rejected).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(receiptMutations).toBe(0);
    expect(first.revision).toBe(1);
    expect(first.extensions).toBe(baselineExtensions);
    expect(first.sessionRng).toEqual(baselineRng);

    const forged = await first.commitOutcomes({
      state: migratedCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      derive: ({ draft }) => ({
        state: draft,
        witness: 'forged-authority',
        extensionWrites: [{
          segment: 'player', namespace: F4_AUTHORITY_NAMESPACE,
          carrier: { version: 1, json: '{"forged":true}' },
        }],
      }),
    });
    expect(forged).toMatchObject({ kind: 'rejected', stage: 'extension-writes' });
    expect(receiptMutations).toBe(0);
    expect(first.extensions).toBe(baselineExtensions);
    expect(first.sessionRng).toEqual(baselineRng);

    const observedPlans: string[] = [];
    failNextCapture = true;
    const failed = await first.commitOutcomesPreDraw({
      state: migratedCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy(
        'capture-retry:0',
        3,
        (serialized) => observedPlans.push(serialized),
      ),
    });
    expect(failed).toMatchObject({
      kind: 'storage-error',
      message: 'injected capture transaction abort',
      plan: { receiptOrdinal: 0 },
    });
    expect(receiptMutations).toBe(1);
    expect(first.revision).toBe(1);
    expect(first.extensions).toBe(baselineExtensions);
    expect(first.sessionRng).toEqual(baselineRng);
    expect(await repository.readReceipt(0)).toBeUndefined();
    await first.release();

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`failed capture reload was ${reloaded.kind}`);
    const restored = readF4Authority(reloaded.extensions);
    if (restored.kind !== 'loaded') throw new Error(`failed capture authority was ${restored.kind}`);
    expect(restored.authority.sessionRng).toEqual(baselineRng);
    const second = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 1, initialExtensions: reloaded.extensions, restoredAuthority: restored.authority,
      freshSessionSeed: 7, ownerId: 'tab', token: 'capture-two', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await second.heartbeat();
    const retry = await second.commitOutcomesPreDraw({
      state: reloaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy(
        'capture-retry:0',
        3,
        (serialized) => observedPlans.push(serialized),
      ),
    });
    expect(retry.kind).toBe('committed');
    if (failed.kind !== 'storage-error' || retry.kind !== 'committed') return;
    expect(retry.plan.draws).toEqual(failed.plan.draws);
    expect(observedPlans).toEqual([JSON.stringify(failed.plan.draws), JSON.stringify(failed.plan.draws)]);
    expect(receiptMutations).toBe(2);
    expect(second.revision).toBe(2);
    expect(second.sessionRng).toEqual({
      seed: 0xC0FFEE,
      ordinal: 1,
      draws: { 'capture.candidate': 1, 'capture.success': 1 },
    });
  });

  it('binds concurrent same-parent capture plans and publishes only the winner counters', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE, ownerId: 'tab-a', token: 'capture-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const beforeEssence = loaded.state.essence;
    const winnerPending = runtime.commitOutcomesPreDraw({
      state: loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy('capture-winner', 4),
    });
    const loserPending = runtime.commitOutcomesPreDraw({
      state: loaded.state,
      domains: ['capture.success', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy('capture-loser', 40),
    });
    const [winner, loser] = await Promise.all([winnerPending, loserPending]);
    expect(winner.kind).toBe('committed');
    expect(loser).toMatchObject({
      kind: 'stale', expectedRevision: 1, actualRevision: 2,
      plan: { receiptOrdinal: 0 },
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: 2,
      commits: 2,
      staleWrites: 1,
      staleBlocked: true,
      leaseOwned: false,
      sessionOrdinal: 1,
      sessionDraws: { 'capture.candidate': 1, 'capture.success': 1 },
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    const stored = await readSaveV5(backend, REGISTRY, NOW);
    if (stored.kind !== 'loaded') throw new Error(`concurrent capture reload was ${stored.kind}`);
    expect(stored.state.essence).toBe(beforeEssence + 4);
    expect(readF4Authority(stored.extensions)).toMatchObject({
      kind: 'loaded',
      authority: {
        sessionRng: {
          seed: 0xC0FFEE,
          ordinal: 1,
          draws: { 'capture.candidate': 1, 'capture.success': 1 },
        },
      },
    });
  });

  it('fails closed without publishing capture state or RNG on duplicate receipts and lost leases', async () => {
    const duplicateCase = await migrated();
    const duplicateRepository = createRevisionedRepository(duplicateCase.backend);
    const duplicateRuntime = createF4RuntimeAuthority({
      backend: duplicateCase.backend, repository: duplicateRepository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: duplicateCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE, ownerId: 'tab', token: 'duplicate-capture', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await duplicateRuntime.heartbeat();
    expect((await duplicateRuntime.commit(duplicateCase.loaded.state, NOW)).kind).toBe('committed');
    const duplicateExtensions = duplicateRuntime.extensions;
    const duplicateRng = duplicateRuntime.sessionRng;
    const duplicateEssence = duplicateCase.loaded.state.essence;
    const existingReceipt = { ordinal: 0, kind: 'preexisting', witness: 'already-committed' };
    await duplicateCase.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existingReceipt),
    }]);
    let duplicateSettlements = 0;
    await expect(duplicateRuntime.commitOutcomesPreDraw({
      state: duplicateCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy('must-not-land', 5, () => { duplicateSettlements++; }),
    })).resolves.toMatchObject({ kind: 'duplicate-receipt', existing: existingReceipt });
    expect(duplicateSettlements).toBe(1);
    expect(duplicateRuntime.revision).toBe(1);
    expect(duplicateRuntime.extensions).toBe(duplicateExtensions);
    expect(duplicateRuntime.sessionRng).toEqual(duplicateRng);
    expect(duplicateRuntime.diagnostics()).toMatchObject({
      staleBlocked: true, leaseOwned: false, sessionOrdinal: 0, sessionDraws: {},
    });
    const duplicateReload = await readSaveV5(duplicateCase.backend, REGISTRY, NOW);
    if (duplicateReload.kind !== 'loaded') throw new Error(`duplicate capture reload was ${duplicateReload.kind}`);
    expect(duplicateReload.state.essence).toBe(duplicateEssence);
    expect(readF4Authority(duplicateReload.extensions)).toMatchObject({
      kind: 'loaded', authority: { sessionRng: duplicateRng },
    });

    const lostCase = await migrated();
    const time = controlledClock();
    const lostRepository = createRevisionedRepository(lostCase.backend);
    const lostRuntime = createF4RuntimeAuthority({
      backend: lostCase.backend, repository: lostRepository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: lostCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xC0FFEE, ownerId: 'tab', token: 'old-capture', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await lostRuntime.heartbeat();
    expect((await lostRuntime.commit(lostCase.loaded.state, NOW)).kind).toBe('committed');
    const lostExtensions = lostRuntime.extensions;
    const lostRng = lostRuntime.sessionRng;
    const lostEssence = lostCase.loaded.state.essence;
    time.advance(101);
    const successor = createTabLeaseClient(lostCase.backend, {
      ownerId: 'tab', token: 'successor-capture', ttlMs: 100, now: time.now,
    });
    await expect(successor.acquire()).resolves.toMatchObject({
      kind: 'held-by-other', holder: { token: 'old-capture' }, remainingMs: 100,
    });
    time.advance(101);
    await expect(successor.acquire()).resolves.toMatchObject({ kind: 'acquired' });
    let lostSettlements = 0;
    await expect(lostRuntime.commitOutcomesPreDraw({
      state: lostCase.loaded.state,
      domains: ['capture.candidate', 'capture.success'],
      receiptKind: 'capture-attempt',
      codecNow: NOW,
      preDraw: capturePreDrawPolicy('lost-capture', 6, () => { lostSettlements++; }),
    })).resolves.toMatchObject({ kind: 'lost', reason: 'lease-lost' });
    expect(lostSettlements).toBe(1);
    expect(lostRuntime.revision).toBe(1);
    expect(lostRuntime.extensions).toBe(lostExtensions);
    expect(lostRuntime.sessionRng).toEqual(lostRng);
    expect(lostRuntime.diagnostics()).toMatchObject({
      leaseOwned: false, leaseLosses: 1, sessionOrdinal: 0, sessionDraws: {},
    });
    expect(await lostRepository.readReceipt(0)).toBeUndefined();
    const lostReload = await readSaveV5(lostCase.backend, REGISTRY, NOW);
    if (lostReload.kind !== 'loaded') throw new Error(`lost capture reload was ${lostReload.kind}`);
    expect(lostReload.state.essence).toBe(lostEssence);
    expect(readF4Authority(lostReload.extensions)).toMatchObject({
      kind: 'loaded', authority: { sessionRng: lostRng },
    });
  });

  it('publishes an arc-neutral deterministic action without consuming a random-domain draw', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const time = controlledClock();
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xA3C30001, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const prior = await runtime.commitOutcome({
      state: loaded.state,
      domain: 'preexisting.random-domain',
      receiptKind: 'preexisting-random-outcome',
      codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'prior-random:0' }),
    });
    expect(prior.kind).toBe('committed');
    time.advance(80);

    const beforeEssence = loaded.state.essence;
    const derive: F4RuntimeActionInput['derive'] = ({
      operation, receiptOrdinal, activePlayMs, draft, extensions,
    }) => {
      expect(operation).toBe('research:drive2');
      expect(receiptOrdinal).toBe(1);
      expect(activePlayMs).toBe(80);
      expect(extensions.player?.['test.arc3-engineering']).toBeUndefined();
      draft.essence -= 25;
      return {
        state: draft,
        witness: 'research:drive2:cost=25',
        extensionWrites: [{
          segment: 'player',
          namespace: 'test.arc3-engineering',
          carrier: { version: 1, json: '{"owned":["drive2"]}' },
        }],
      };
    };
    const action = await runtime.commitAction({
      state: loaded.state,
      operation: 'research:drive2',
      receiptKind: 'arc3-research',
      codecNow: NOW,
      derive,
    });
    expect(action.kind).toBe('committed');
    if (action.kind !== 'committed') return;
    expect(action.state.essence).toBe(beforeEssence - 25);
    expect(loaded.state.essence).toBe(beforeEssence);
    expect(action.receipt).toEqual({
      ordinal: 1,
      kind: 'arc3-research',
      witness: 'research:drive2:cost=25',
    });
    expect(runtime.revision).toBe(3);
    expect(runtime.sessionRng).toEqual({
      seed: 0xA3C30001,
      ordinal: 2,
      draws: { 'preexisting.random-domain': 1 },
    });
    expect(runtime.extensions.player?.['test.arc3-engineering']).toEqual({
      version: 1, json: '{"owned":["drive2"]}',
    });
    expect(readF4Authority(runtime.extensions)).toMatchObject({
      kind: 'loaded', authority: {
        activePlayMs: 80,
        sessionRng: {
          seed: 0xA3C30001,
          ordinal: 2,
          draws: { 'preexisting.random-domain': 1 },
        },
      },
    });
    expect(await repository.readReceipt(1)).toEqual(action.receipt);
  });

  it('publishes sequential no-RNG extension writes while preserving prior draws and active-play authority', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const time = controlledClock();
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0x2468ACE0, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    let protectedDerivations = 0;
    await expect(runtime.commitProduct({
      state: loaded.state, operation: 'equip', codecNow: NOW,
      derive: ({ draft }) => {
        protectedDerivations++;
        return { state: draft, witness: 'must-not-run' };
      },
    })).resolves.toEqual({ kind: 'protected', reason: 'authority-absent' });
    expect(protectedDerivations).toBe(0);
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');

    const priorDraw = await runtime.commitOutcome({
      state: loaded.state,
      domain: 'preexisting.random-domain',
      receiptKind: 'preexisting-random-outcome',
      codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'prior-draw:0' }),
    });
    expect(priorDraw.kind).toBe('committed');
    time.advance(250);

    const originalEssence = loaded.state.essence;
    const derive: F4RuntimeProductInput['derive'] = ({ operation, receiptOrdinal, draft, extensions }) => {
      expect(operation).toBe('equip');
      expect(receiptOrdinal).toBe(1);
      expect(extensions.inventory?.['test.arc2-runtime']).toBeUndefined();
      draft.essence += 7;
      return {
        state: draft,
        witness: `equip:${receiptOrdinal}:${draft.essence}`,
        extensionWrites: [{
          segment: 'inventory', namespace: 'test.arc2-runtime',
          carrier: { version: 1, json: '{"step":1}' },
        }],
      };
    };
    const outcome = await runtime.commitProduct({
      state: loaded.state, operation: 'equip', codecNow: NOW, derive,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.essence).toBe(originalEssence + 7);
    expect(loaded.state.essence).toBe(originalEssence);
    expect(outcome.receipt).toMatchObject({ ordinal: 1, kind: 'arc2-equip' });
    expect(runtime.sessionRng).toEqual({
      seed: 0x2468ACE0, ordinal: 2, draws: { 'preexisting.random-domain': 1 },
    });
    expect(runtime.extensions).toBe(outcome.saved.extensions);
    expect(runtime.extensions.inventory?.['test.arc2-runtime']).toEqual({
      version: 1, json: '{"step":1}',
    });
    expect(readF4Authority(runtime.extensions)).toMatchObject({
      kind: 'loaded', authority: { activePlayMs: 250 },
    });
    expect(runtime.revision).toBe(3);
    expect(await repository.readReceipt(1)).toEqual(outcome.receipt);

    time.advance(50);
    const second = await runtime.commitProduct({
      state: outcome.state, operation: 'unequip', codecNow: NOW,
      derive: ({ receiptOrdinal, draft, extensions }) => {
        expect(receiptOrdinal).toBe(2);
        expect(extensions.inventory?.['test.arc2-runtime']).toEqual({
          version: 1, json: '{"step":1}',
        });
        return {
          state: draft,
          witness: `unequip:${receiptOrdinal}`,
          extensionWrites: [{
            segment: 'inventory', namespace: 'test.arc2-runtime',
            carrier: { version: 1, json: '{"step":2}' },
          }],
        };
      },
    });
    expect(second.kind).toBe('committed');
    if (second.kind !== 'committed') return;
    expect(runtime.revision).toBe(4);
    expect(runtime.sessionRng).toEqual({
      seed: 0x2468ACE0, ordinal: 3, draws: { 'preexisting.random-domain': 1 },
    });
    expect(runtime.extensions).toBe(second.saved.extensions);
    expect(runtime.extensions.inventory?.['test.arc2-runtime']).toEqual({
      version: 1, json: '{"step":2}',
    });
    expect(readF4Authority(runtime.extensions)).toMatchObject({
      kind: 'loaded', authority: {
        activePlayMs: 300,
        sessionRng: {
          seed: 0x2468ACE0, ordinal: 3, draws: { 'preexisting.random-domain': 1 },
        },
      },
    });
  });

  it('binds concurrent no-RNG product actions to one parent so a double action cannot silently rebase', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0x10203040, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');

    const first = runtime.commitProduct({
      state: loaded.state, operation: 'equip', codecNow: NOW,
      derive: ({ draft }) => {
        draft.essence += 11;
        return { state: draft, witness: `equip:${draft.essence}` };
      },
    });
    const second = runtime.commitProduct({
      state: loaded.state, operation: 'unequip', codecNow: NOW,
      derive: ({ draft }) => {
        draft.essence += 101;
        return { state: draft, witness: `unequip:${draft.essence}` };
      },
    });
    const [winner, loser] = await Promise.all([first, second]);
    expect(winner.kind).toBe('committed');
    expect(loser).toMatchObject({
      kind: 'stale', expectedRevision: 1, actualRevision: 2,
      plan: { operation: 'unequip', receiptOrdinal: 0 },
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: 2, staleBlocked: true, leaseOwned: false,
      sessionOrdinal: 1, sessionDraws: {},
    });
    const stored = await readSaveV5(backend, REGISTRY, NOW);
    expect(stored.kind).toBe('loaded');
    if (stored.kind !== 'loaded') return;
    expect(stored.state.essence).toBe(loaded.state.essence + 11);
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    expect((await repository.readReceipt(0))?.kind).toBe('arc2-equip');
  });

  it('does not publish or retry rejected and storage-aborted no-RNG product actions', async () => {
    const base = createMemoryBackend();
    let failNextProduct = false;
    let productAttempts = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (operations.some((operation) => operation.store === 'receipts')) {
          productAttempts++;
          if (failNextProduct) {
            failNextProduct = false;
            throw new Error('injected product transaction abort');
          }
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error('expected loaded state');
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0x55667788, ownerId: 'tab-a', token: 'document-a', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const baselineExtensions = runtime.extensions;
    const baselineRng = runtime.sessionRng;

    const rejected = await runtime.commitProduct({
      state: loaded.state, operation: 'salvage', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: '' }),
    });
    expect(rejected).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(productAttempts).toBe(0);
    expect(runtime.revision).toBe(1);
    expect(runtime.extensions).toBe(baselineExtensions);
    expect(runtime.sessionRng).toEqual(baselineRng);
    expect(runtime.diagnostics()).toMatchObject({ commits: 1, leaseOwned: true, staleBlocked: false });

    failNextProduct = true;
    const derive: F4RuntimeProductInput['derive'] = ({ draft, receiptOrdinal }) => ({
      state: draft,
      witness: `claim:${receiptOrdinal}`,
      extensionWrites: [{
        segment: 'inventory', namespace: 'test.arc2-runtime',
        carrier: { version: 1, json: '{"claim":true}' },
      }],
    });
    const failed = await runtime.commitProduct({
      state: loaded.state, operation: 'pending-claim', codecNow: NOW, derive,
    });
    expect(failed).toMatchObject({
      kind: 'storage-error', message: 'injected product transaction abort',
      plan: { receiptOrdinal: 0 },
    });
    expect(productAttempts).toBe(1);
    expect(runtime.revision).toBe(1);
    expect(runtime.extensions).toBe(baselineExtensions);
    expect(runtime.sessionRng).toEqual(baselineRng);
    expect(await repository.readReceipt(0)).toBeUndefined();

    const retry = await runtime.commitProduct({
      state: loaded.state, operation: 'pending-claim', codecNow: NOW, derive,
    });
    expect(retry).toMatchObject({ kind: 'committed', plan: { receiptOrdinal: 0 } });
    expect(productAttempts).toBe(2);
    expect(runtime.revision).toBe(2);
    expect(runtime.sessionRng).toEqual({ seed: 0x55667788, ordinal: 1, draws: {} });
  });

  it('fails closed and releases authority on duplicate or lost no-RNG receipts', async () => {
    const duplicateCase = await migrated();
    const duplicateRepository = createRevisionedRepository(duplicateCase.backend);
    const duplicateRuntime = createF4RuntimeAuthority({
      backend: duplicateCase.backend, repository: duplicateRepository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: duplicateCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 91, ownerId: 'tab', token: 'duplicate-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await duplicateRuntime.heartbeat();
    expect((await duplicateRuntime.commit(duplicateCase.loaded.state, NOW)).kind).toBe('committed');
    const existingReceipt = { ordinal: 0, kind: 'preexisting', witness: 'already-committed' };
    await duplicateCase.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existingReceipt),
    }]);
    await expect(duplicateRuntime.commitProduct({
      state: duplicateCase.loaded.state, operation: 'equip', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'must-not-land' }),
    })).resolves.toMatchObject({ kind: 'duplicate-receipt', existing: existingReceipt });
    expect(duplicateRuntime.diagnostics()).toMatchObject({
      revision: 1, commits: 1, staleBlocked: true, leaseOwned: false,
      sessionOrdinal: 0, sessionDraws: {},
    });
    expect(await duplicateRepository.readReceipt(0)).toEqual(existingReceipt);

    const lostCase = await migrated();
    const time = controlledClock();
    const lostRepository = createRevisionedRepository(lostCase.backend);
    const lostRuntime = createF4RuntimeAuthority({
      backend: lostCase.backend, repository: lostRepository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: lostCase.loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 92, ownerId: 'tab', token: 'old-document', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await lostRuntime.heartbeat();
    expect((await lostRuntime.commit(lostCase.loaded.state, NOW)).kind).toBe('committed');
    time.advance(101);
    const successor = createTabLeaseClient(lostCase.backend, {
      ownerId: 'tab', token: 'successor-document', ttlMs: 100, now: time.now,
    });
    await expect(successor.acquire()).resolves.toMatchObject({
      kind: 'held-by-other', holder: { token: 'old-document' }, remainingMs: 100,
    });
    time.advance(101);
    await expect(successor.acquire()).resolves.toMatchObject({ kind: 'acquired' });
    await expect(lostRuntime.commitProduct({
      state: lostCase.loaded.state, operation: 'equip', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'lost-fence' }),
    })).resolves.toMatchObject({ kind: 'lost', reason: 'lease-lost' });
    expect(lostRuntime.diagnostics()).toMatchObject({
      revision: 1, commits: 1, leaseOwned: false, sessionOrdinal: 0, leaseLosses: 1,
    });
    expect(await lostRepository.readReceipt(0)).toBeUndefined();
  });

  it('persists a minted seed before a failed outcome so reload replays the identical value', async () => {
    const base = createMemoryBackend();
    let failOutcome = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (failOutcome && operations.some((operation) => operation.store === 'receipts')) {
          failOutcome = false;
          throw new Error('injected outcome abort');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const firstLoaded = await readSaveV5(backend, REGISTRY, NOW);
    if (firstLoaded.kind !== 'loaded') throw new Error('expected first loaded state');
    const first = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: firstLoaded.extensions, restoredAuthority: null,
      freshSessionSeed: 0xCAFEBABE, ownerId: 'tab', token: 'document-one', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await first.heartbeat();
    expect((await first.commit(firstLoaded.state, NOW)).kind).toBe('committed');
    const values: number[] = [];
    const derive: F4RuntimeOutcomeInput['derive'] = ({ draft, value }) => {
      values.push(value);
      draft.essence += 1;
      return { state: draft, witness: `retry:${draft.essence}` };
    };
    failOutcome = true;
    const failed = await first.commitOutcome({
      state: firstLoaded.state, domain: 'capture.success', receiptKind: 'capture-settlement', codecNow: NOW, derive,
    });
    expect(failed).toMatchObject({ kind: 'storage-error', message: 'injected outcome abort' });
    await first.release();

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error('expected reloaded state');
    const restored = readF4Authority(reloaded.extensions);
    if (restored.kind !== 'loaded') throw new Error('expected durable F4 authority');
    expect(restored.authority.sessionRng.seed).toBe(0xCAFEBABE);
    expect(restored.authority.sessionRng.ordinal).toBe(0);
    const second = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 1, initialExtensions: reloaded.extensions, restoredAuthority: restored.authority,
      freshSessionSeed: 7, ownerId: 'tab', token: 'document-two', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await second.heartbeat();
    const committed = await second.commitOutcome({
      state: reloaded.state, domain: 'capture.success', receiptKind: 'capture-settlement', codecNow: NOW, derive,
    });
    expect(committed.kind).toBe('committed');
    if (failed.kind === 'storage-error' && committed.kind === 'committed') {
      expect(committed.plan.value).toBe(failed.plan.value);
    }
    expect(values).toHaveLength(2);
    expect(values[1]).toBe(values[0]);
  });

  it('clears the prior receipt namespace on exact replacement before a new ordinal-zero expedition outcome', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const first = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 11, ownerId: 'tab', token: 'old-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await first.heartbeat();
    expect((await first.commit(loaded.state, NOW)).kind).toBe('committed');
    expect((await first.commitOutcome({
      state: loaded.state, domain: 'old.roll', receiptKind: 'old-settlement', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'old:0' }),
    })).kind).toBe('committed');
    expect(await repository.readReceipt(0)).toBeDefined();

    const replacementRaw = JSON.stringify({
      ...(fixtures.inputs.veteran_rich as Record<string, unknown>), me: 'Replacement Owner', essence: 9,
    });
    const prepared = prepareV5Replacement(replacementRaw, REGISTRY, NOW);
    if (prepared.kind !== 'prepared') throw new Error('expected replacement preparation');
    await expect(first.replace(prepared.operations)).resolves.toMatchObject({ kind: 'committed', revision: 3 });
    expect(await backend.keys('receipts')).toEqual([]);
    await first.release();

    const replacement = await readSaveV5(backend, REGISTRY, NOW);
    if (replacement.kind !== 'loaded') throw new Error('expected replacement read');
    expect(readF4Authority(replacement.extensions)).toEqual({ kind: 'absent' });
    const second = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 3, initialExtensions: replacement.extensions, restoredAuthority: null,
      freshSessionSeed: 22, ownerId: 'tab', token: 'new-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await second.heartbeat();
    expect((await second.commit(replacement.state, NOW)).kind).toBe('committed');
    const freshOutcome = await second.commitOutcome({
      state: replacement.state, domain: 'new.roll', receiptKind: 'new-settlement', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'new:0' }),
    });
    expect(freshOutcome.kind).toBe('committed');
    if (freshOutcome.kind === 'committed') expect(freshOutcome.plan.receiptOrdinal).toBe(0);
    expect((await repository.readReceipt(0))?.kind).toBe('new-settlement');
  });

  it('serializes hide/show/release around an in-flight heartbeat so no late grant survives', async () => {
    const base = createMemoryBackend();
    const control: { release: (() => void) | null } = { release: null };
    let delayNext = false;
    let entered: Promise<void> = Promise.resolve();
    let markEntered: (() => void) | null = null;
    const armDelay = (): void => {
      delayNext = true;
      entered = new Promise<void>((resolve) => { markEntered = resolve; });
    };
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (delayNext) {
          delayNext = false;
          markEntered?.();
          await new Promise<void>((resolve) => { control.release = resolve; });
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error('expected loaded state');
    const runtime = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 1, ownerId: 'tab', token: 'one-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });

    armDelay();
    const heartbeat = runtime.heartbeat();
    await entered;
    const hidden = runtime.setVisible(false);
    const shown = runtime.setVisible(true);
    control.release?.();
    await expect(heartbeat).resolves.toEqual({ kind: 'lost' });
    await hidden;
    await expect(shown).resolves.toMatchObject({ kind: 'owned' });
    expect(runtime.diagnostics()).toMatchObject({ visible: true, leaseOwned: true, accruing: true });

    armDelay();
    const renewing = runtime.heartbeat();
    await entered;
    const released = runtime.release();
    control.release?.();
    await expect(renewing).resolves.toEqual({ kind: 'lost' });
    await released;
    expect(runtime.diagnostics()).toMatchObject({ visible: false, leaseOwned: false, accruing: false });
    const leaseRaw = await backend.get('meta', 'f3:lease:active-play');
    expect(JSON.parse(leaseRaw!).held).toBe(false);
  });

  it('retries one rejected hide release without reaccruing or releasing a successor twice', async () => {
    const base = createMemoryBackend();
    let rejectNextRelease = true;
    let releaseAttempts = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        const releasesFirstDocument = operations.some((operation) => {
          if (operation.store !== 'meta' || operation.key !== 'f3:lease:active-play'
            || operation.value === undefined) return false;
          const record = JSON.parse(operation.value) as { held?: unknown; token?: unknown };
          return record.held === false && record.token === 'document-a';
        });
        if (releasesFirstDocument) {
          releaseAttempts++;
          if (rejectNextRelease) {
            rejectNextRelease = false;
            throw new Error('injected first lease release rejection');
          }
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error('expected loaded state');
    const time = controlledClock();
    const first = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 44, ownerId: 'tab', token: 'document-a', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    time.advance(40);

    await expect(first.setVisible(false)).rejects.toThrow('injected first lease release rejection');
    expect(first.diagnostics()).toMatchObject({
      visible: false, leaseOwned: false, accruing: false, activePlayMs: 40,
    });
    time.advance(500);
    expect(first.diagnostics()).toMatchObject({
      leaseOwned: false, accruing: false, activePlayMs: 40,
    });
    await expect(first.setVisible(true)).resolves.toEqual({ kind: 'lost' });
    time.advance(500);
    expect(first.diagnostics()).toMatchObject({
      visible: true, leaseOwned: false, accruing: false, activePlayMs: 40,
    });

    /* This is main's hide-failure fallback. It must retry the exact pending
       token even though the local grant was synchronously revoked. */
    await first.release();
    expect(releaseAttempts).toBe(2);
    const releasedRaw = await backend.get('meta', 'f3:lease:active-play');
    expect(JSON.parse(releasedRaw!)).toMatchObject({ held: false, token: 'document-a' });

    const successor = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 55, ownerId: 'tab', token: 'document-b', leaseTtlMs: 100,
      now: time.now, visible: true, answerable: true,
    });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const successorRaw = await backend.get('meta', 'f3:lease:active-play');
    await first.release();
    expect(releaseAttempts).toBe(2);
    expect(await backend.get('meta', 'f3:lease:active-play')).toBe(successorRaw);
    expect(JSON.parse(successorRaw!)).toMatchObject({ held: true, token: 'document-b' });
  });

  it('blocks and releases its exact lease after an ambiguous replacement conflict', async () => {
    const { backend, loaded } = await migrated();
    const repository = createRevisionedRepository(backend);
    const conflictingRepository = {
      ...repository,
      replace: async (replacement: Parameters<typeof repository.replace>[0]) => ({
        kind: 'conflict' as const,
        expectedRevision: replacement.expectedRevision,
      }),
    };
    const first = createF4RuntimeAuthority({
      backend, repository: conflictingRepository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 66, ownerId: 'tab', token: 'document-a', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    await expect(first.replace([])).resolves.toEqual({ kind: 'conflict', expectedRevision: 0 });
    expect(first.diagnostics()).toMatchObject({
      staleBlocked: true, leaseOwned: false, accruing: false,
    });
    const releasedRaw = await backend.get('meta', 'f3:lease:active-play');
    expect(JSON.parse(releasedRaw!)).toMatchObject({ held: false, token: 'document-a' });

    const successor = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 77, ownerId: 'tab', token: 'document-b', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const successorRaw = await backend.get('meta', 'f3:lease:active-play');
    expect(JSON.parse(successorRaw!)).toMatchObject({ held: true, token: 'document-b' });
    await first.release();
    expect(await backend.get('meta', 'f3:lease:active-play')).toBe(successorRaw);
  });

  it('checkpoints the exact visible interval before hide so a successor reload retains it', async () => {
    const { backend, loaded } = await migrated();
    const clockA = controlledClock();
    const runtimeA = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: loaded.extensions, restoredAuthority: null,
      freshSessionSeed: 33, ownerId: 'tab', token: 'document-a', leaseTtlMs: 100,
      now: clockA.now, visible: true, answerable: true,
    });
    await runtimeA.heartbeat();
    clockA.advance(450);
    runtimeA.setAnswerable(false);
    expect((await runtimeA.commit(loaded.state, NOW)).kind).toBe('committed');
    await runtimeA.setVisible(false);

    const stored = await readSaveV5(backend, REGISTRY, NOW);
    if (stored.kind !== 'loaded') throw new Error('expected checkpointed state');
    const authority = readF4Authority(stored.extensions);
    if (authority.kind !== 'loaded') throw new Error('expected checkpointed authority');
    expect(authority.authority.activePlayMs).toBe(450);
    const runtimeB = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 1, initialExtensions: stored.extensions, restoredAuthority: authority.authority,
      freshSessionSeed: 99, ownerId: 'tab', token: 'document-b', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await expect(runtimeB.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    expect(runtimeB.diagnostics().activePlayMs).toBe(450);
  });

  it('commits restored Training gear and its Arc 2 carrier without adding a receipt or random draw', async () => {
    const { backend, loaded } = await migrated();
    const old = prepareArc2LootLegacyMigration({
      extensions: {
        ...loaded.extensions,
        settings: { 'arc7.audio': { version: 3, json: '{"muted":false}' } },
      },
      legacy: loaded.state,
      capacity: 200,
    });
    if (old.kind !== 'prepared') throw new Error(`old Arc 2 setup was ${old.kind}`);
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: old.extensions, restoredAuthority: null,
      freshSessionSeed: 0xD7A11, ownerId: 'tab', token: 'training-document', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const priorState = await seedPriorTrainingOutcome(runtime, loaded.state);
    const oldCarrier = runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE];
    const oldRng = runtime.sessionRng;
    const oldF4Carrier = runtime.extensions.player?.['f4.authority'];
    const oldReceipts = await receiptEvidence(backend);
    expect(oldReceipts).toEqual({
      keys: ['receipt:0'],
      rawByKey: {
        'receipt:0': '{"ordinal":0,"kind":"training-prior-outcome","witness":"training-prior:0"}',
      },
      parsedByKey: {
        'receipt:0': { ordinal: 0, kind: 'training-prior-outcome', witness: 'training-prior:0' },
      },
    });
    expect(oldRng).toEqual({
      seed: 0xD7A11, ordinal: 1, draws: { 'training.preexisting': 1 },
    });

    const restoredState = structuredClone(priorState);
    restoredState.items = [['plate', 8], ['lens', 1], ['cell', 2], ['headlamp', 1]];
    restoredState.equip = { helmet: 'headlamp' };
    restoredState.equipAff = { helmet: { k: 'strike', v: 0.05, forId: 'headlamp' } };
    const restored = prepareArc2LootLegacyRestore({
      extensions: runtime.extensions,
      legacy: restoredState,
      capacity: 200,
    });
    if (restored.kind !== 'prepared') throw new Error(`restored Arc 2 setup was ${restored.kind}`);
    expect(restored.write.carrier).not.toEqual(oldCarrier);

    const committed = await runtime.commit(restoredState, NOW, [restored.write]);
    expect(committed.kind).toBe('committed');
    if (committed.kind !== 'committed') return;
    expect(runtime.revision).toBe(3);
    expect(runtime.sessionRng).toEqual(oldRng);
    expect(runtime.extensions.player?.['f4.authority']).toEqual(oldF4Carrier);
    const afterReceipts = await receiptEvidence(backend);
    expect(afterReceipts).toEqual(oldReceipts);
    expect(sameReceiptEvidence(afterReceipts, oldReceipts)).toBe(true);
    const rawMutation = structuredClone(oldReceipts) as {
      keys: string[]; rawByKey: Record<string, string | undefined>; parsedByKey: Record<string, unknown>;
    };
    rawMutation.rawByKey['receipt:0'] = `${rawMutation.rawByKey['receipt:0']} `;
    expect(sameReceiptEvidence(rawMutation, oldReceipts)).toBe(false);
    const semanticMutation = structuredClone(oldReceipts) as {
      keys: string[]; rawByKey: Record<string, string | undefined>; parsedByKey: Record<string, unknown>;
    };
    (semanticMutation.parsedByKey['receipt:0'] as Record<string, unknown>).witness = 'mutated';
    expect(sameReceiptEvidence(semanticMutation, oldReceipts)).toBe(false);
    expect(runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(restored.write.carrier);
    expect(runtime.extensions.settings?.['arc7.audio']).toEqual({
      version: 3, json: '{"muted":false}',
    });
    expect(readF4Authority(runtime.extensions)).toEqual({
      kind: 'loaded', authority: { activePlayMs: 0, sessionRng: oldRng },
    });

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`restored reload was ${reloaded.kind}`);
    const reloadedLoot = readArc2Loot(reloaded.extensions);
    expect(reloadedLoot).toEqual({ kind: 'loaded', state: restored.state });
    expect(reloaded.extensions.player?.['f4.authority']).toEqual(oldF4Carrier);
    if (reloadedLoot.kind !== 'loaded') return;
    expect(arc2LootLegacyMirrorMatches(reloadedLoot.state, reloaded.state)).toBe(true);
    expect(reloaded.state.items).toEqual(restoredState.items);
    expect(reloaded.state.equip).toEqual(restoredState.equip);
    expect(reloaded.state.equipAff).toEqual(restoredState.equipAff);
  });

  it('leaves the old Training state and carrier durable when the coupled checkpoint is stale', async () => {
    const { backend, loaded } = await migrated();
    const old = prepareArc2LootLegacyMigration({
      extensions: loaded.extensions, legacy: loaded.state, capacity: 200,
    });
    if (old.kind !== 'prepared') throw new Error(`old Arc 2 setup was ${old.kind}`);
    const repository = createRevisionedRepository(backend);
    const runtime = createF4RuntimeAuthority({
      backend, repository, registry: REGISTRY,
      initialRevision: 0, initialExtensions: old.extensions, restoredAuthority: null,
      freshSessionSeed: 0xD7A12, ownerId: 'tab', token: 'stale-training', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const priorState = await seedPriorTrainingOutcome(runtime, loaded.state);
    const priorCarrier = runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE];
    const priorRng = runtime.sessionRng;
    const priorF4Carrier = runtime.extensions.player?.['f4.authority'];
    const priorReceipts = await receiptEvidence(backend);
    const candidate = structuredClone(priorState);
    candidate.items = [['headlamp', 1]];
    candidate.equip = { helmet: 'headlamp' };
    candidate.equipAff = {};
    const restored = prepareArc2LootLegacyRestore({
      extensions: runtime.extensions, legacy: candidate, capacity: 200,
    });
    if (restored.kind !== 'prepared') throw new Error(`restored Arc 2 setup was ${restored.kind}`);
    await repository.mutate({
      expectedRevision: 2,
      writes: [{ store: 'player', key: 'stale-control', value: 'winner' }],
    });

    await expect(runtime.commit(candidate, NOW, [restored.write])).resolves.toEqual({
      kind: 'stale', expectedRevision: 2, actualRevision: 3,
    });
    expect(runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(priorCarrier);
    expect(runtime.extensions.player?.['f4.authority']).toEqual(priorF4Carrier);
    expect(runtime.sessionRng).toEqual(priorRng);
    expect(await receiptEvidence(backend)).toEqual(priorReceipts);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`stale reload was ${reloaded.kind}`);
    expect(reloaded.state.items).toEqual(priorState.items);
    expect(reloaded.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(priorCarrier);
    expect(reloaded.extensions.player?.['f4.authority']).toEqual(priorF4Carrier);
    expect(await receiptEvidence(backend)).toEqual(priorReceipts);
  });

  it('leaves the old Training state and carrier durable after a storage-aborted coupled checkpoint', async () => {
    const base = createMemoryBackend();
    let rejectNextCheckpoint = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (rejectNextCheckpoint && operations.some(({ store, value }) => (
          store === 'inventory' && value?.includes(ARC2_LOOT_NAMESPACE)
        ))) {
          rejectNextCheckpoint = false;
          throw new Error('injected Training carrier transaction abort');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error(`expected loaded v5; got ${loaded.kind}`);
    const old = prepareArc2LootLegacyMigration({
      extensions: loaded.extensions, legacy: loaded.state, capacity: 200,
    });
    if (old.kind !== 'prepared') throw new Error(`old Arc 2 setup was ${old.kind}`);
    const runtime = createF4RuntimeAuthority({
      backend, repository: createRevisionedRepository(backend), registry: REGISTRY,
      initialRevision: 0, initialExtensions: old.extensions, restoredAuthority: null,
      freshSessionSeed: 0xD7A13, ownerId: 'tab', token: 'aborted-training', leaseTtlMs: 100,
      now: () => 0, visible: true, answerable: true,
    });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const priorState = await seedPriorTrainingOutcome(runtime, loaded.state);
    const priorCarrier = runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE];
    const priorRng = runtime.sessionRng;
    const priorF4Carrier = runtime.extensions.player?.['f4.authority'];
    const priorReceipts = await receiptEvidence(backend);
    const candidate = structuredClone(priorState);
    candidate.items = [['headlamp', 1]];
    candidate.equip = { helmet: 'headlamp' };
    candidate.equipAff = {};
    const restored = prepareArc2LootLegacyRestore({
      extensions: runtime.extensions, legacy: candidate, capacity: 200,
    });
    if (restored.kind !== 'prepared') throw new Error(`restored Arc 2 setup was ${restored.kind}`);
    rejectNextCheckpoint = true;

    await expect(runtime.commit(candidate, NOW, [restored.write]))
      .rejects.toThrow('injected Training carrier transaction abort');
    expect(runtime.revision).toBe(2);
    expect(runtime.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(priorCarrier);
    expect(runtime.extensions.player?.['f4.authority']).toEqual(priorF4Carrier);
    expect(runtime.sessionRng).toEqual(priorRng);
    expect(await receiptEvidence(backend)).toEqual(priorReceipts);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`aborted reload was ${reloaded.kind}`);
    expect(reloaded.state.items).toEqual(priorState.items);
    expect(reloaded.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(priorCarrier);
    expect(reloaded.extensions.player?.['f4.authority']).toEqual(priorF4Carrier);
    expect(await receiptEvidence(backend)).toEqual(priorReceipts);
  });
});
