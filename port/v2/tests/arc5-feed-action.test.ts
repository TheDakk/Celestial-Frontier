import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  MAX_OWNERSHIP_REVISION,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  ownershipContentId,
  ownershipStateMirrorV2,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  registerOwnershipStateMirrorV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type OwnershipStateV2,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import {
  ARC5_FEED_ACTION_KIND_V1,
  ARC5_FEED_RECEIPT_KIND_V1,
} from '@cf/domain-acquisition/feed-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
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
  commitArc5FeedActionV1,
  type Arc5FeedActionInputV1,
} from '../apps/game/src/arc5-feed-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;

interface OwnershipFixture {
  readonly source: OwnershipStateV1;
  readonly creatureId: CreatureInstanceId;
  readonly twinId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
}

function ownershipFixture(fed = 19): OwnershipFixture {
  const fauna = canonicalGenomeIdentityV1({ seed: 11, kingdom: 'fauna', form: 3 });
  const flora = canonicalGenomeIdentityV1({ seed: 29, kingdom: 'flora', form: 1 });
  const discoveries = [
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'feed-action-creature') as DiscoveryRecordId,
      speciesId: fauna.speciesId,
      legacyCodexId: 'feed-action-creature',
      legacySourceIndex: 0,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: true,
    }),
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'feed-action-twin') as DiscoveryRecordId,
      speciesId: fauna.speciesId,
      legacyCodexId: 'feed-action-twin',
      legacySourceIndex: 1,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: false,
    }),
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'feed-action-flora') as DiscoveryRecordId,
      speciesId: flora.speciesId,
      legacyCodexId: 'feed-action-flora',
      legacySourceIndex: 2,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: true,
    }),
  ] as const;
  const creatureId = ownershipContentId('creature', 'feed-action-creature') as CreatureInstanceId;
  const twinId = ownershipContentId('creature', 'feed-action-twin') as CreatureInstanceId;
  const foodLotId = ownershipContentId('specimen', 'feed-action-flora') as SpecimenLotId;
  const creature = (
    id: CreatureInstanceId,
    discoveryIndex: 0 | 1,
    currentFed: number,
  ) => createCreatureInstanceV1({
    creatureId: id,
    speciesId: fauna.speciesId,
    genomeIdentity: fauna.genomeIdentity,
    genome: fauna.genome,
    nickname: null,
    origin: 'legacy',
    acquisitionRecordId: discoveries[discoveryIndex].recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: 7,
    hurt: 0.35,
    fed: currentFed,
    brood: null,
    assignment: null,
    bond: null,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [
      createCatalogSpeciesV1({
        identity: fauna,
        alias: null,
        firstObservationId: discoveries[0].recordId,
      }),
      createCatalogSpeciesV1({
        identity: flora,
        alias: null,
        firstObservationId: discoveries[2].recordId,
      }),
    ],
    discoveries,
    creatures: [creature(creatureId, 0, fed), creature(twinId, 1, 91)],
    specimenLots: [createSpecimenLotV1({
      lotId: foodLotId,
      speciesId: flora.speciesId,
      kind: 'flora',
      quantity: 2,
      origin: 'legacy',
      acquisitionRecordId: discoveries[2].recordId,
    })],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: creatureId,
  });
  return Object.freeze({ source, creatureId, twinId, foodLotId });
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`feed base save failed: ${imported.reason}`);
  return imported.state;
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
  const arc4 = applyV5ExtensionWrites(
    f4.extensions,
    encodeArc4Ownership(source).writes,
  ).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`feed Arc 5 fixture was ${arc5.kind}`);
  return Object.freeze({
    extensions: arc5.extensions,
    authority: f4.authority,
    ownershipV2: arc5.state,
  });
}

interface RuntimeFixtureOptions {
  readonly fed?: number;
  readonly corruptArc5?: boolean;
  readonly failReceiptCommit?: boolean;
}

async function runtimeFixture(options: RuntimeFixtureOptions = {}) {
  const ownership = ownershipFixture(options.fed);
  const prepared = authorityExtensions(ownership.source);
  const initialExtensions = options.corruptArc5 === true
    ? applyV5ExtensionWrites(prepared.extensions, [{
      ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
      carrier: { version: 2, json: '{}' },
    }]).extensions
    : prepared.extensions;
  const state = baseState();
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: initialExtensions }, REGISTRY, NOW);
  await base.apply([{
    store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw,
  }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`feed v5 fixture was ${migration.kind}`);
  await base.apply(initialSave.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failReceiptCommit === true) {
          throw new Error('forced Arc 5 feed storage failure');
        }
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
    initialExtensions,
    restoredAuthority: prepared.authority,
    freshSessionSeed: 0,
    ownerId: 'arc5-feed-action-tab',
    token: 'arc5-feed-action-document',
    leaseTtlMs: 1_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`feed runtime lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state,
    ownership,
    ownershipV2: prepared.ownershipV2,
    receiptCas: () => receiptCas,
  };
}

async function receiptKeys(backend: StorageBackend): Promise<readonly string[]> {
  return [...await backend.keys('receipts')].sort();
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
): Arc5FeedActionInputV1 {
  return {
    runtime: fixture.runtime,
    ownershipV2: fixture.ownershipV2,
    state: fixture.state,
    creatureId: fixture.ownership.creatureId,
    foodLotId: fixture.ownership.foodLotId,
    codecNow: NOW,
  };
}

describe('Arc 5 headless durable feed action', () => {
  it('commits one exact creature/flora successor with five compact writes and one F3/F4 receipt', async () => {
    const fixture = await runtimeFixture();
    const beforeState = JSON.stringify(fixture.state);
    const beforeSource = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (beforeSource.kind !== 'loaded') throw new Error(`feed Arc 4 source was ${beforeSource.kind}`);
    const beforeArc4 = ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ));
    const beforeCreature = fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))!;
    const beforeTwin = fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.twinId
    ))!;

    const pending = commitArc5FeedActionV1(actionInput(fixture));
    expect(fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))?.fed).toBe(19);
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;

    expect(outcome).toMatchObject({
      durability: 'committed',
      convergence: 'none',
      transaction: {
        revision: 1,
        plan: { operation: ARC5_FEED_ACTION_KIND_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC5_FEED_RECEIPT_KIND_V1 },
      },
      settlement: {
        creatureBefore: { creatureId: fixture.ownership.creatureId, fed: 19 },
        creatureAfter: { creatureId: fixture.ownership.creatureId, fed: 20 },
        foodBefore: { lotId: fixture.ownership.foodLotId, quantity: 2 },
        foodAfter: { lotId: fixture.ownership.foodLotId, quantity: 1 },
      },
    });
    expect(outcome.transaction.receipt.witness).toBe(outcome.settlement.witness);
    expect(outcome.ownershipWrites).toHaveLength(5);
    expect(outcome.ownershipWrites.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.revision()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA5FEE001,
      ordinal: 1,
      draws: {},
    });
    expect(JSON.stringify(outcome.transaction.state)).toBe(beforeState);
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    expect(beforeCreature.fed).toBe(19);
    expect(outcome.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))?.fed).toBe(20);
    expect(outcome.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.twinId
    ))).toEqual(beforeTwin);
    expect(outcome.ownershipV2.creatures).toHaveLength(fixture.ownershipV2.creatures.length);

    const afterSource = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (afterSource.kind !== 'loaded') throw new Error(`feed Arc 4 reload was ${afterSource.kind}`);
    expect(ownershipStateDigestV1(afterSource.state)).toBe(ownershipStateDigestV1(beforeSource.state));
    expect(ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ))).toEqual(beforeArc4);
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
      expect(saved.extensions).toEqual(fixture.runtime.extensions);
      expect(JSON.stringify(saved.state)).toBe(beforeState);
      expect(readF4Authority(saved.extensions)).toEqual({
        kind: 'loaded',
        authority: { activePlayMs: 0, sessionRng: { seed: 0xA5FEE001, ordinal: 1, draws: {} } },
      });
    }
    await fixture.runtime.release();
  });

  it('captures inputs before queueing and never rewrites the caller save object', async () => {
    const fixture = await runtimeFixture();
    const input = actionInput(fixture);
    const originalEssence = fixture.state.essence;
    const pending = commitArc5FeedActionV1(input);
    fixture.state.essence += 777;
    Object.assign(input as unknown as Record<string, unknown>, {
      creatureId: fixture.ownership.twinId,
      codecNow: -1,
    });
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.creatureAfter.creatureId).toBe(fixture.ownership.creatureId);
    expect(outcome.transaction.state.essence).toBe(originalEssence);
    expect(fixture.state.essence).toBe(originalEssence + 777);
    await fixture.runtime.release();
  });

  it('fails stale without retry, receipt, fed publication, or compact-carrier mutation', async () => {
    const fixture = await runtimeFixture();
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const extensionsBefore = JSON.stringify(fixture.runtime.extensions);
    await fixture.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'feed-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc5FeedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(fixture.runtime.sessionRng).toEqual({ seed: 0xA5FEE001, ordinal: 0, draws: {} });
    expect(JSON.stringify(fixture.runtime.extensions)).toBe(extensionsBefore);
    expect(fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))?.fed).toBe(19);
    const savedAfter = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(JSON.stringify(savedAfter)).toBe(JSON.stringify(savedBefore));
  });

  it('fails storage once with no receipt, revision, product bytes, or optimistic publication', async () => {
    const fixture = await runtimeFixture({ failReceiptCommit: true });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5FeedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 5 feed storage failure',
      transaction: { kind: 'storage-error', message: 'forced Arc 5 feed storage failure' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    expect(fixture.runtime.sessionRng).toEqual({ seed: 0xA5FEE001, ordinal: 0, draws: {} });
    expect(fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))?.fed).toBe(19);
    await fixture.runtime.release();
  });

  it('maps a duplicate receipt to one read-only refusal with no publication or CAS retry', async () => {
    const fixture = await runtimeFixture();
    const existingReceipt = Object.freeze({
      ordinal: 0,
      kind: 'preexisting-feed-control',
      witness: 'another-owner-already-committed',
    });
    await fixture.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existingReceipt),
    }]);
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const extensionsBefore = JSON.stringify(fixture.runtime.extensions);
    const ownershipBefore = ownershipStateDigestV2(fixture.ownershipV2);

    const outcome = await commitArc5FeedActionV1(actionInput(fixture));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:duplicate-receipt',
      transaction: {
        kind: 'duplicate-receipt',
        receiptKey: 'receipt:0',
        existing: existingReceipt,
        plan: { operation: ARC5_FEED_ACTION_KIND_V1, receiptOrdinal: 0 },
      },
    });
    /* The repository detects the occupied ordinal before compare-and-apply;
       the app wrapper must not turn that refusal into a second attempt. */
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual(['receipt:0']);
    expect(await fixture.repository.readReceipt(0)).toEqual(existingReceipt);
    expect(await fixture.repository.revision()).toBe(0);
    expect(JSON.stringify(fixture.runtime.extensions)).toBe(extensionsBefore);
    expect(fixture.runtime.sessionRng).toEqual({ seed: 0xA5FEE001, ordinal: 0, draws: {} });
    expect(fixture.runtime.diagnostics()).toMatchObject({
      revision: 0, commits: 0, staleBlocked: true, leaseOwned: false,
    });
    expect(ownershipStateDigestV2(fixture.ownershipV2)).toBe(ownershipBefore);
    expect(fixture.ownershipV2.creatures.find((row) => (
      row.creatureId === fixture.ownership.creatureId
    ))?.fed).toBe(19);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
  });

  it('fails a protected compact carrier before CAS and consumes no receipt or revision', async () => {
    const fixture = await runtimeFixture({ corruptArc5: true });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5FeedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'ownership-carrier:base-corrupt',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    expect(fixture.runtime.sessionRng).toEqual({ seed: 0xA5FEE001, ordinal: 0, draws: {} });
    await fixture.runtime.release();
  });

  it('spends no F4 authority for product refusal or hostile input accessors', async () => {
    const fixture = await runtimeFixture({ fed: 200 });
    let calls = 0;
    const runtime = {
      async commitAction() {
        calls++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    const capped = await commitArc5FeedActionV1({
      ...actionInput(fixture),
      runtime,
    });
    expect(capped).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'preflight:creature-fed-cap',
      transaction: null,
    });
    expect(calls).toBe(0);

    const exhausted = registerOwnershipStateMirrorV2({
      ...ownershipStateMirrorV2(fixture.ownershipV2),
      revision: MAX_OWNERSHIP_REVISION,
    }, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    const ceiling = await commitArc5FeedActionV1({
      ...actionInput(fixture),
      runtime,
      ownershipV2: exhausted,
    });
    expect(ceiling).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'preflight:ownership-revision-exhausted',
      transaction: null,
    });
    expect(calls).toBe(0);

    let reads = 0;
    const hostile = { ...actionInput(fixture) } as Record<string, unknown>;
    Object.defineProperty(hostile, 'creatureId', {
      enumerable: true,
      get() { reads++; return fixture.ownership.creatureId; },
    });
    await expect(commitArc5FeedActionV1(hostile as unknown as Arc5FeedActionInputV1))
      .resolves.toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered' });
    expect(reads).toBe(0);
    await fixture.runtime.release();
  });
});
