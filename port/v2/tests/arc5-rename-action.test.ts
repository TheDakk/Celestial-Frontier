import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_RENAME_ACTION_KIND_V1,
  ARC5_RENAME_RECEIPT_KIND_V1,
} from '@cf/domain-acquisition/rename-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  commitArc5RenameActionV1,
  publishArc5RenameAchievementFields,
  type Arc5RenameActionInputV1,
} from '../apps/game/src/arc5-rename-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

interface OwnershipFixture {
  readonly source: OwnershipStateV1;
  readonly leftId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
}

function ownershipFixture(exhibit = false): OwnershipFixture {
  const identity = canonicalGenomeIdentityV1({
    ...makeGenome(808, 'fauna', 0.54),
    ...(exhibit ? { exhibit: true } : {}),
  });
  const discoveries = [0, 1].map((index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `rename-action-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `rename-action-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const leftId = ownershipContentId('creature', 'rename-action-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'rename-action-right') as CreatureInstanceId;
  const creature = (
    creatureId: CreatureInstanceId,
    nickname: string,
    discovery: DiscoveryRecordId,
  ) => createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname,
    origin: 'legacy',
    acquisitionRecordId: discovery,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: 9,
    hurt: creatureId === leftId ? 0.7 : 0,
    fed: 4,
    brood: 2,
    assignment: creatureId === leftId
      ? { kind: 'recovery', readyAtActivePlayMs: 80_000 }
      : { kind: 'mission', missionId: 'rename-action-mission' },
    bond: null,
  });
  return Object.freeze({
    source: createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({
        identity,
        alias: 'Shared species',
        firstObservationId: discoveries[0]!.recordId,
      })],
      discoveries,
      creatures: [
        creature(leftId, 'Alpha', discoveries[0]!.recordId),
        creature(rightId, 'Beta', discoveries[1]!.recordId),
      ],
      specimenLots: [],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: leftId,
    }),
    leftId,
    rightId,
  });
}

function baseState(unlocked: readonly string[] = []): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`rename base save failed: ${imported.reason}`);
  return { ...imported.state, unlocked: [...unlocked] };
}

function authorityExtensions(source: OwnershipStateV1): Readonly<{
  extensions: V5Extensions;
  authority: ReturnType<typeof prepareF4AuthorityUpdate>['authority'];
  ownershipV2: OwnershipStateV2;
}> {
  const f4 = prepareF4AuthorityUpdate(
    {},
    { activePlayMs: 0 },
    createSessionRNG(0xA5FEE001).state(),
  );
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`rename Arc 5 fixture was ${arc5.kind}`);
  return Object.freeze({ extensions: arc5.extensions, authority: f4.authority, ownershipV2: arc5.state });
}

async function runtimeFixture(options: Readonly<{
  failStorage?: boolean;
  exhibit?: boolean;
  unlocked?: readonly string[];
}> = {}) {
  const ownership = ownershipFixture(options.exhibit ?? false);
  const prepared = authorityExtensions(ownership.source);
  const state = baseState(options.unlocked);
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: prepared.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`rename v5 fixture was ${migration.kind}`);
  await base.apply(initialSave.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Arc 5 rename storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: prepared.extensions,
    restoredAuthority: prepared.authority,
    freshSessionSeed: 0,
    ownerId: 'arc5-rename-action-tab',
    token: 'arc5-rename-action-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`rename runtime lease was ${heartbeat.kind}`);
  return {
    backend, repository, runtime, state, ownership,
    ownershipV2: prepared.ownershipV2,
    receiptCas: () => receiptCas,
  };
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  rawName = '  <Nova>&\"\'  ',
): Arc5RenameActionInputV1 {
  return {
    runtime: fixture.runtime,
    ownershipV2: fixture.ownershipV2,
    state: fixture.state,
    creatureId: fixture.ownership.leftId,
    rawName,
    codecNow: NOW,
  };
}

async function receiptKeys(backend: StorageBackend): Promise<readonly string[]> {
  return [...await backend.keys('receipts')].sort();
}

describe('Arc 5 headless durable companion rename action', () => {
  it('commits one exact assigned twin through five writes and reloads byte-identically', async () => {
    const fixture = await runtimeFixture();
    const beforeState = JSON.stringify(fixture.state);
    const expectedCommittedState = JSON.stringify({
      ...fixture.state,
      unlocked: [...fixture.state.unlocked, 'namer'],
    });
    const sourceBefore = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (sourceBefore.kind !== 'loaded') throw new Error(`rename source was ${sourceBefore.kind}`);
    const arc4Before = ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ));
    const twinBefore = fixture.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.rightId,
    )!;

    const pending = commitArc5RenameActionV1(actionInput(fixture));
    expect(fixture.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.leftId,
    )?.nickname).toBe('Alpha');
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome).toMatchObject({
      durability: 'committed',
      convergence: 'none',
      transaction: {
        revision: 1,
        plan: { operation: ARC5_RENAME_ACTION_KIND_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC5_RENAME_RECEIPT_KIND_V1 },
      },
      settlement: {
        creatureBefore: { creatureId: fixture.ownership.leftId, nickname: 'Alpha' },
        creatureAfter: { creatureId: fixture.ownership.leftId, nickname: 'Nova' },
      },
      namerAchievementAdded: true,
    });
    expect(outcome.ownershipWrites.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(outcome.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.rightId,
    )).toEqual(twinBefore);
    expect(JSON.stringify(outcome.transaction.state)).toBe(expectedCommittedState);
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA5FEE001, ordinal: 1, draws: {},
    });
    const sourceAfter = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (sourceAfter.kind !== 'loaded') throw new Error(`rename reload source was ${sourceAfter.kind}`);
    expect(ownershipStateDigestV1(sourceAfter.state)).toBe(ownershipStateDigestV1(sourceBefore.state));
    expect(ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ))).toEqual(arc4Before);
    const reloaded = readArc5OwnershipMigration(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(ownershipStateDigestV2(reloaded.state)).toBe(ownershipStateDigestV2(outcome.ownershipV2));
      expect(reloaded.evidence).toEqual(outcome.ownershipV2Evidence);
    }
    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(JSON.stringify(saved.state)).toBe(expectedCommittedState);
      expect(readF4Authority(saved.extensions)).toEqual({
        kind: 'loaded',
        authority: { activePlayMs: 0, sessionRng: { seed: 0xA5FEE001, ordinal: 1, draws: {} } },
      });
    }
    await fixture.runtime.release();
  });

  it('preserves one existing namer idempotently across another companion rename', async () => {
    const fixture = await runtimeFixture({ unlocked: ['namer'] });
    const outcome = await commitArc5RenameActionV1(actionInput(fixture, 'Solace'));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.creatureAfter.nickname).toBe('Solace');
    expect(outcome.namerAchievementAdded).toBe(false);
    expect(outcome.transaction.state.unlocked).toEqual(['namer']);
    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') expect(saved.state.unlocked).toEqual(['namer']);
    await fixture.runtime.release();
  });

  it('refuses achievement capacity before any rename receipt or CAS', async () => {
    const fullUnlocked = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat-rename-${index}`,
    );
    const fixture = await runtimeFixture({ unlocked: fullUnlocked });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5RenameActionV1(actionInput(fixture, 'Capacity'));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'achievement:achievement-capacity', transaction: null,
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA5FEE001, ordinal: 0, draws: {},
    });
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await fixture.runtime.release();
  });

  it('publishes only a detached, independently verified namer carrier', () => {
    const target = baseState(['compat-before']);
    const items = target.items;
    const stats = target.stats;
    const committed: SaveStateV2 = {
      ...target,
      unlocked: ['compat-before', 'namer'],
    };
    publishArc5RenameAchievementFields(target, committed);
    expect(target.unlocked).toEqual(['compat-before', 'namer']);
    expect(target.unlocked).not.toBe(committed.unlocked);
    expect(target.items).toBe(items);
    expect(target.stats).toBe(stats);
    expect(() => publishArc5RenameAchievementFields(target, baseState()))
      .toThrow('requires a committed fixed point');
  });

  it('refuses normalized-empty, unchanged, and exhibition targets before receipt planning', async () => {
    const fixture = await runtimeFixture();
    let calls = 0;
    const runtime = { async commitAction() { calls++; return { kind: 'lease-unavailable' as const }; } };
    await expect(commitArc5RenameActionV1({
      ...actionInput(fixture, '<>&\"\'   '), runtime,
    })).resolves.toMatchObject({ kind: 'refused', detail: 'preflight:name-invalid', transaction: null });
    await expect(commitArc5RenameActionV1({
      ...actionInput(fixture, '  Alpha  '), runtime,
    })).resolves.toMatchObject({ kind: 'refused', detail: 'preflight:name-unchanged', transaction: null });
    const exhibit = await runtimeFixture({ exhibit: true });
    await expect(commitArc5RenameActionV1({
      ...actionInput(exhibit, 'Arena'), runtime,
    })).resolves.toMatchObject({ kind: 'refused', detail: 'preflight:creature-exhibit', transaction: null });
    expect(calls).toBe(0);
    await fixture.runtime.release();
    await exhibit.runtime.release();
  });

  it('fails stale once without receipt, retry, carrier publication, or name change', async () => {
    const fixture = await runtimeFixture();
    const extensionsBefore = JSON.stringify(fixture.runtime.extensions);
    await fixture.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'rename-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc5RenameActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(JSON.stringify(fixture.runtime.extensions)).toBe(extensionsBefore);
    expect(fixture.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.leftId,
    )?.nickname).toBe('Alpha');
  });

  it('maps duplicate receipt to one read-only refusal with no CAS retry', async () => {
    const fixture = await runtimeFixture();
    const existing = Object.freeze({
      ordinal: 0, kind: 'preexisting-rename-control', witness: 'another-owner',
    });
    await fixture.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existing),
    }]);
    const outcome = await commitArc5RenameActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:duplicate-receipt',
      transaction: { kind: 'duplicate-receipt', existing },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.revision()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual(['receipt:0']);
  });

  it('contains storage failure after one CAS with no receipt, revision, or optimistic name', async () => {
    const fixture = await runtimeFixture({ failStorage: true });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5RenameActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 5 rename storage failure',
      transaction: { kind: 'storage-error', message: 'forced Arc 5 rename storage failure' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    expect(fixture.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.leftId,
    )?.nickname).toBe('Alpha');
    await fixture.runtime.release();
  });

  it('classifies a committed postcommit carrier mismatch as reload-only convergence', async () => {
    const fixture = await runtimeFixture();
    const runtime = {
      async commitAction(input: Readonly<{
        operation: string;
        receiptKind: string;
        codecNow: number;
        derive: (input: Readonly<{
          receiptOrdinal: number;
          draft: SaveStateV2;
          extensions: V5Extensions;
        }>) => Readonly<{
          state: SaveStateV2;
          extensionWrites: readonly unknown[];
          witness: string;
        }>;
      }>) {
        const derived = input.derive({
          receiptOrdinal: 0,
          draft: fixture.state,
          extensions: fixture.runtime.extensions,
        });
        return {
          kind: 'committed' as const,
          revision: 1,
          state: derived.state,
          saved: {
            canonicalState: derived.state,
            /* Deliberately omit the derived exact-five writes after the CAS
               claims durability: publication must fail closed to reload. */
            extensions: fixture.runtime.extensions,
          },
          plan: { operation: input.operation, receiptOrdinal: 0 },
          receipt: { ordinal: 0, kind: input.receiptKind, witness: derived.witness },
          authority: { activePlayMs: 0, sessionRng: { seed: 0xA5FEE001, ordinal: 1, draws: {} } },
        };
      },
    };
    const outcome = await commitArc5RenameActionV1({
      ...actionInput(fixture),
      runtime: runtime as unknown as Arc5RenameActionInputV1['runtime'],
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-rename-fixed-point-mismatch',
      transaction: { kind: 'committed', revision: 1 },
    });
    expect(fixture.ownershipV2.creatures.find(
      (row) => row.creatureId === fixture.ownership.leftId,
    )?.nickname).toBe('Alpha');
    await fixture.runtime.release();
  });

  it('rejects hostile action accessors without touching them', async () => {
    const fixture = await runtimeFixture();
    let reads = 0;
    const hostile = { ...actionInput(fixture) } as Record<string, unknown>;
    Object.defineProperty(hostile, 'rawName', {
      enumerable: true,
      get() { reads++; return 'Wrong'; },
    });
    await expect(commitArc5RenameActionV1(hostile as unknown as Arc5RenameActionInputV1))
      .resolves.toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered' });
    expect(reads).toBe(0);
    await fixture.runtime.release();
  });
});
