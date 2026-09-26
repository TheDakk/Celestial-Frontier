import fs from 'node:fs';
import { createRequire } from 'node:module';
import { COMPANION_FEED_POLICY_V2 } from '@cf/domain-acquisition/companion-care';
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
/** Feed policy v2 (D13): the taste decides the gain. */
const policyGain = (t: { preference: 'loved' | 'neutral' | 'disliked'; floraTier: number }): number => { const r = COMPANION_FEED_POLICY_V2[t.preference]; return t.floraTier >= r.rareTier ? r.fedRare : r.fed; };

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

function ownershipFixture(fed = 19, creatureCodexId = 'feed-action-creature'): OwnershipFixture {
  const fauna = canonicalGenomeIdentityV1({ seed: 11, kingdom: 'fauna', form: 3 });
  const flora = canonicalGenomeIdentityV1({ seed: 29, kingdom: 'flora', form: 1 });
  const discoveries = [
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'feed-action-creature') as DiscoveryRecordId,
      speciesId: fauna.speciesId,
      legacyCodexId: creatureCodexId,
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
  /** Seed the companion's v4 Compendium mirror row (its id by the shared companionLegacyCodexIdV1 rule) with the ownership row's XP. */
  readonly codexMirror?: boolean;
}

async function runtimeFixture(options: RuntimeFixtureOptions = {}) {
  // with a Compendium mirror, the legacy codex id is the row's real canonical id (`s<seed>`, as a v1 codex row migrates), not a label
  const ownership = ownershipFixture(options.fed, options.codexMirror === true ? 's11' : undefined);
  const prepared = authorityExtensions(ownership.source);
  const initialExtensions = options.corruptArc5 === true
    ? applyV5ExtensionWrites(prepared.extensions, [{
      ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
      carrier: { version: 2, json: '{}' },
    }]).extensions
    : prepared.extensions;
  const state = baseState();
  if (options.codexMirror === true) {
    const { companionLegacyCodexIdV1 } = await import('@cf/persistence');
    const companion = prepared.ownershipV2.creatures.find((c) => c.creatureId === ownership.creatureId)!;
    const id = companionLegacyCodexIdV1(prepared.ownershipV2, companion);
    state.codex = [[id, { id, name: 'Grazer', kind: 'Fauna', tier: null, realm: 'Wild', sapient: 0, from: 'Legacy', hybrid: false,
      g: { ...(companion.genome as unknown as Record<string, unknown>), xp: companion.xp ?? 0, hurt: companion.hurt ?? 0 }, where: null }]] as never;
  }
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
        creatureAfter: { creatureId: fixture.ownership.creatureId, fed: 19 + policyGain(outcome.settlement.preflight.taste) },
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
    ))?.fed).toBe(19 + policyGain(outcome.settlement.preflight.taste));
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

  it('D13: Main passes the active-play clock — the meal still commits (an exact-key capture once refused it as invalid input); a malformed clock is refused before any receipt', async () => {
    const fixture = await runtimeFixture();
    const bad = await commitArc5FeedActionV1({ ...actionInput(fixture), activePlayMs: -1 });
    expect(bad).toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered', transaction: null });
    expect(fixture.receiptCas()).toBe(0);
    const outcome = await commitArc5FeedActionV1({ ...actionInput(fixture), activePlayMs: 5_000 });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.witness).toContain('"activePlayMs"');
    expect(fixture.receiptCas()).toBe(1);
  });

  it('D13 Rest through the real F4 transaction: one receipt seals the heal and the boundary (the committed snapshot + 8 active minutes for hurt 0.35); a second Rest while resting is refused before any receipt', async () => {
    const fixture = await runtimeFixture();
    const { commitArc5RestActionV1 } = await import('../apps/game/src/arc5-rest-action.js');
    const rest = await commitArc5RestActionV1({ runtime: fixture.runtime, ownershipV2: fixture.ownershipV2, state: fixture.state, creatureId: fixture.ownership.creatureId, codecNow: NOW, activePlayMs: 0 });
    expect(rest.kind).toBe('committed');
    if (rest.kind !== 'committed') return;
    const row = rest.ownershipV2.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!;
    expect(row.hurt).toBe(0);
    expect(row.assignment).toEqual({ kind: 'mission', missionId: `rest:${rest.settlement.readyAtActivePlayMs}` });
    expect(rest.settlement.readyAtActivePlayMs - rest.settlement.preflight.durationActivePlayMs).toBeGreaterThanOrEqual(0);
    expect(rest.settlement.preflight.durationActivePlayMs).toBe(8 * 60_000);
    expect(rest.transaction.receipt.kind).toBe('arc5-companion-rest');
    expect(fixture.receiptCas()).toBe(1);
    const again = await commitArc5RestActionV1({ runtime: fixture.runtime, ownershipV2: rest.ownershipV2, state: rest.transaction.state, creatureId: fixture.ownership.creatureId, codecNow: NOW, activePlayMs: 1_000 });
    expect(again).toMatchObject({ kind: 'refused', detail: 'preflight:creature-assigned' });
    expect(fixture.receiptCas()).toBe(1);
  });
});

/* D13 stage 1e: OUTCOMES through the real controls — the real Compendium Feed controller and the care panel, the real F4
   transaction, and a durable read-back from the runtime's committed extensions. */
describe('D13 companion care — outcomes through the real controls', () => {
  const readBack = async (fixture: Awaited<ReturnType<typeof runtimeFixture>>) => {
    const { readArc5OwnershipMigration } = await import('@cf/persistence'); const { SCENE_OWNERSHIP_ADDRESS_RESOLVER } = await import('@cf/domain-acquisition');
    const loaded = readArc5OwnershipMigration(fixture.runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    if (loaded.kind !== 'loaded') throw new Error(`durable ownership ${loaded.kind}`);
    return loaded.state.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!;
  };

  it('Use 1 on the real Feed controller: the meal follows the taste table (fed, mend, +3 first-time XP), is read back durably, and the same flavour again pays no XP', async () => {
    const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: { document: Document } } };
    const { CompendiumFeedController, projectCompendiumFeedV1 } = await import('../apps/game/src/compendium-feed.js');
    const fixture = await runtimeFixture();
    const fauna = fixture.ownershipV2.catalogSpecies.find((row) => row.kingdom === 'fauna')!;
    const dom = new JSDOM('<!doctype html><body><aside id="codexpanel"><div data-arc5-feed-body></div></aside></body>');
    const root = dom.window.document.getElementById('codexpanel') as HTMLElement, mount = dom.window.document.querySelector('[data-arc5-feed-body]') as HTMLElement;
    const requests: { creatureId: string; foodLotId: string; fedAfter: number }[] = [];
    const controller = new CompendiumFeedController({ root, isCurrent: () => true, onAction: (request) => { requests.push(request); } });
    const press = (ownership: typeof fixture.ownershipV2) => {
      controller.setState(projectCompendiumFeedV1({ generation: 1, logicalId: 'row-1', record: { id: 'row-1', name: 'Grazer', g: fauna.genome as unknown as Record<string, unknown> }, ownership, protected: false, fixture: false, activePlayMs: 0 }));
      controller.attach(mount);
      mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-creature-id="${fixture.ownership.creatureId}"]`)!.click();
      mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-food-lot-id="${fixture.ownership.foodLotId}"]`)!.click();
      mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();
    };
    const before = fixture.ownershipV2.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!;
    press(fixture.ownershipV2);
    expect(requests).toHaveLength(1);
    const first = await commitArc5FeedActionV1({ ...actionInput(fixture), creatureId: requests[0]!.creatureId as never, foodLotId: requests[0]!.foodLotId as never, activePlayMs: 0 });
    if (first.kind !== 'committed') throw new Error(first.kind);
    const pre = first.settlement.preflight, mend = COMPANION_FEED_POLICY_V2[pre.taste.preference].mend;
    expect(requests[0]!.fedAfter).toBe(pre.fedAfter); // the preview the player confirmed is exactly what committed
    const durable = await readBack(fixture);
    expect(durable.fed).toBe(19 + policyGain(pre.taste));
    expect(durable.hurt).toBeCloseTo(Math.max(0, (before.hurt ?? 0) - mend), 6);
    expect(pre.taste.preference === 'disliked' ? durable.hurt === before.hurt : (durable.hurt ?? 0) < (before.hurt ?? 0)).toBe(true); // disliked is harmless; any other mends
    expect(durable.xp).toBe((before.xp ?? 0) + 3);
    expect(durable.bond?.memories.map((m) => m.id)).toEqual(['meal:first', `taste:${pre.taste.flavour}`]);
    // the taste is now known on the preview; a second meal of the same flavour pays no XP
    controller.detach(); press(first.ownershipV2);
    expect(mount.querySelector('[data-arc5-feed-summary]')?.textContent).not.toMatch(/A new taste/u);
    const second = await commitArc5FeedActionV1({ runtime: fixture.runtime, ownershipV2: first.ownershipV2, state: first.transaction.state, creatureId: fixture.ownership.creatureId, foodLotId: fixture.ownership.foodLotId, codecNow: NOW, activePlayMs: 0 });
    if (second.kind !== 'committed') throw new Error(second.kind);
    expect((await readBack(fixture)).xp).toBe(durable.xp);
    controller.detach();
  });

  it('Rest from the care panel: Injured → Resting; moving the DEVICE clock ±1 day releases nothing — only active play does (clock-skew guard)', async () => {
    const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: { document: Document } } };
    const { CompanionCareController, projectCompanionCareV1 } = await import('../apps/game/src/companion-care-panel.js');
    const { commitArc5RestActionV1 } = await import('../apps/game/src/arc5-rest-action.js');
    const fixture = await runtimeFixture();
    const fauna = fixture.ownershipV2.catalogSpecies.find((row) => row.kingdom === 'fauna')!;
    const record = { name: 'Grazer', g: fauna.genome as unknown as Record<string, unknown> };
    const dom = new JSDOM('<!doctype html><body><section data-care></section></body>');
    const mount = dom.window.document.querySelector('[data-care]') as HTMLElement;
    let ownership = fixture.ownershipV2, pressed: Promise<unknown> | null = null as Promise<unknown> | null;
    const controller = new CompanionCareController({ onRest: (creatureId) => { pressed = commitArc5RestActionV1({ runtime: fixture.runtime, ownershipV2: ownership, state: fixture.state, creatureId, codecNow: NOW, activePlayMs: fixture.runtime.diagnostics().activePlayMs }); } });
    controller.setState(projectCompanionCareV1({ record, ownership, activePlayMs: 0, writable: true })); controller.attach(mount);
    const row = `[data-companion-care-row="${fixture.ownership.creatureId}"]`;
    const button = mount.querySelector<HTMLButtonElement>(`[data-companion-care-rest="${fixture.ownership.creatureId}"]`)!;
    expect(mount.querySelector(`${row} [data-companion-care-condition]`)?.getAttribute('data-companion-care-condition')).toBe('Injured');
    expect(button.textContent).toBe('Rest (8 min of play)'); expect(button.disabled).toBe(false);
    expect(mount.querySelector(`${row} [data-companion-care-tastes]`)?.textContent).toBe('♥ Favors ?, ? · ⊘ Dislikes ?');
    button.click();
    expect(pressed).not.toBeNull();
    const outcome = (await (pressed as unknown as Promise<unknown>)) as Awaited<ReturnType<typeof commitArc5RestActionV1>>;
    if (outcome.kind !== 'committed') throw new Error(outcome.kind);
    ownership = outcome.ownershipV2;
    const durable = await readBack(fixture);
    expect(durable.hurt).toBe(0); expect(durable.assignment).toEqual({ kind: 'mission', missionId: `rest:${outcome.settlement.readyAtActivePlayMs}` });
    const shown = (activePlayMs: number) => { controller.setState(projectCompanionCareV1({ record, ownership, activePlayMs, writable: true })); return mount.querySelector(`${row} [data-companion-care-condition]`)?.getAttribute('data-companion-care-condition'); };
    expect(shown(fixture.runtime.diagnostics().activePlayMs)).toBe('Resting');
    // the device clock a day forward and a day back: the active-play clock does not move, the lock holds, a meal is refused
    for (const codecNow of [NOW + 86_400_000, NOW - 86_400_000]) {
      const meal = await commitArc5FeedActionV1({ runtime: fixture.runtime, ownershipV2: ownership, state: outcome.transaction.state, creatureId: fixture.ownership.creatureId, foodLotId: fixture.ownership.foodLotId, codecNow, activePlayMs: fixture.runtime.diagnostics().activePlayMs });
      expect(meal).toMatchObject({ kind: 'refused', detail: 'preflight:creature-assigned' });
      expect(shown(fixture.runtime.diagnostics().activePlayMs)).toBe('Resting');
    }
    // control: reaching the ACTIVE-PLAY boundary releases it, healed, with nothing left to rest
    expect(shown(outcome.settlement.readyAtActivePlayMs)).toBe('Healthy');
    expect(mount.querySelector<HTMLButtonElement>(`[data-companion-care-rest="${fixture.ownership.creatureId}"]`)!.disabled).toBe(true);
  });
});

/* D13 care XP parity (2026-09-26): the XP a meal teaches lands on the ownership row AND the companion's v4 Compendium mirror row `g.xp`
   (the rule the friendly duel uses), durably — read back from a FRESH v5 load of the backend (a reboot), not from the returned state. */
describe('D13 care XP reaches the Compendium mirror row', () => {
  it('a real Feed press: the ownership row and the Compendium row read back the same XP after a reboot; control: the Compendium row really changed', async () => {
    const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: { document: Document } } };
    const { CompendiumFeedController, projectCompendiumFeedV1 } = await import('../apps/game/src/compendium-feed.js');
    const { companionLegacyCodexIdV1, readArc5OwnershipMigration } = await import('@cf/persistence');
    const { SCENE_OWNERSHIP_ADDRESS_RESOLVER } = await import('@cf/domain-acquisition');
    const { mirrorCompanionCodexXpV1 } = await import('../apps/game/src/companion-codex-mirror.js');
    const fixture = await runtimeFixture({ codexMirror: true });
    const companion = fixture.ownershipV2.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!;
    const id = companionLegacyCodexIdV1(fixture.ownershipV2, companion), xpBefore = companion.xp ?? 0;
    expect((fixture.state.codex.find(([rowId]) => rowId === id)![1].g as { xp?: number }).xp).toBe(xpBefore);
    const fauna = fixture.ownershipV2.catalogSpecies.find((row) => row.kingdom === 'fauna')!;
    const dom = new JSDOM('<!doctype html><body><aside id="codexpanel"><div data-arc5-feed-body></div></aside></body>');
    const root = dom.window.document.getElementById('codexpanel') as HTMLElement, mount = dom.window.document.querySelector('[data-arc5-feed-body]') as HTMLElement;
    const requests: { creatureId: string; foodLotId: string }[] = [];
    const controller = new CompendiumFeedController({ root, isCurrent: () => true, onAction: (request) => { requests.push(request); } });
    controller.setState(projectCompendiumFeedV1({ generation: 1, logicalId: 'row-1', record: { id: 'row-1', name: 'Grazer', g: fauna.genome as unknown as Record<string, unknown> }, ownership: fixture.ownershipV2, protected: false, fixture: false, activePlayMs: 0 } as never));
    controller.attach(mount);
    mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-creature-id="${fixture.ownership.creatureId}"]`)!.click();
    mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-food-lot-id="${fixture.ownership.foodLotId}"]`)!.click();
    mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();
    expect(requests).toHaveLength(1);
    const outcome = await commitArc5FeedActionV1({ ...actionInput(fixture), creatureId: requests[0]!.creatureId as never, foodLotId: requests[0]!.foodLotId as never, activePlayMs: 0 });
    if (outcome.kind !== 'committed') throw new Error(outcome.kind);
    // reboot: a fresh load of the durable save
    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    if (saved.kind !== 'loaded') throw new Error(saved.kind);
    const owned = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    if (owned.kind !== 'loaded') throw new Error(owned.kind);
    const ownXp = owned.state.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!.xp ?? 0;
    expect(id).toBe('s11');
    const rowXp = (saved.state.codex.find(([rowId]) => rowId === id)![1].g as { xp?: number }).xp;
    expect(ownXp).toBe(xpBefore + 3); // +1 first meal, +2 first taste
    expect(rowXp, 'the Compendium mirror row carries the same XP after a reboot').toBe(ownXp);
    // the live publication (Main) uses the same shared rule: the live list takes exactly the committed row's XP
    const live = mirrorCompanionCodexXpV1(fixture.state.codex as never, outcome.transaction.state.codex as never) as typeof fixture.state.codex;
    expect((live.find(([rowId]) => rowId === id)![1].g as { xp?: number }).xp).toBe(ownXp);
    controller.detach();
  });
});

/* A5 — the Feed XP ledger (2026-09-26): a real Feed press pays D13's first-award XP (first meal +1, first taste +2) EXACTLY ONCE into the
   durable save. The second meal of the same flavour is pressed against ownership read back from a FRESH v5 load (as Main has after a
   reboot) and pays nothing; the paid-once key is the persisted bond memory. Controls: (1) the same meal WOULD pay again if the memory
   had not persisted (so the zero is not vacuous); (2) a stale-publication mutant — pressing against the pre-meal ownership instead of
   the durable read-back — is refused by the durable transaction and pays nothing. */
describe('A5 Feed XP ledger after a UI action', () => {
  it('first-award XP lands once, survives a reboot, and a repeat of the flavour pays nothing', async () => {
    const { CompendiumFeedController, projectCompendiumFeedV1 } = await import('../apps/game/src/compendium-feed.js');
    const { readArc5OwnershipMigration } = await import('@cf/persistence');
    const { SCENE_OWNERSHIP_ADDRESS_RESOLVER } = await import('@cf/domain-acquisition');
    const { companionMealOutcomeV2 } = await import('@cf/domain-acquisition/companion-care');
    const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: { document: Document } } };
    const fixture = await runtimeFixture();
    const fauna = fixture.ownershipV2.catalogSpecies.find((row) => row.kingdom === 'fauna')!;
    const dom = new JSDOM('<!doctype html><body><aside id="codexpanel"><div data-arc5-feed-body></div></aside></body>');
    const root = dom.window.document.getElementById('codexpanel') as HTMLElement, mount = dom.window.document.querySelector('[data-arc5-feed-body]') as HTMLElement;
    const requests: { creatureId: string; foodLotId: string }[] = [];
    const controller = new CompendiumFeedController({ root, isCurrent: () => true, onAction: (request) => { requests.push(request); } });
    const press = (ownership: typeof fixture.ownershipV2) => {
      controller.detach();
      controller.setState(projectCompendiumFeedV1({ generation: 1, logicalId: 'row-1', record: { id: 'row-1', name: 'Grazer', g: fauna.genome as unknown as Record<string, unknown> }, ownership, protected: false, fixture: false, activePlayMs: 0 } as never));
      controller.attach(mount);
      mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-creature-id="${fixture.ownership.creatureId}"]`)!.click();
      mount.querySelector<HTMLInputElement>(`input[data-arc5-feed-food-lot-id="${fixture.ownership.foodLotId}"]`)!.click();
      mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();
      return requests.at(-1)!;
    };
    const reboot = async () => {
      const saved = await readSaveV5(fixture.backend, REGISTRY, NOW); if (saved.kind !== 'loaded') throw new Error(saved.kind);
      const owned = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER); if (owned.kind !== 'loaded') throw new Error(owned.kind);
      return { state: saved.state, ownership: owned.state, companion: owned.state.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)! };
    };
    const xpStart = fixture.ownershipV2.creatures.find((c) => c.creatureId === fixture.ownership.creatureId)!.xp ?? 0;
    const r1 = press(fixture.ownershipV2);
    const first = await commitArc5FeedActionV1({ ...actionInput(fixture), creatureId: r1.creatureId as never, foodLotId: r1.foodLotId as never, activePlayMs: 0 });
    if (first.kind !== 'committed') throw new Error(first.kind);
    const afterFirst = await reboot();
    expect(afterFirst.companion.xp).toBe(xpStart + 3);
    expect(afterFirst.companion.bond?.memories.map((m) => m.id).sort()).toEqual(['meal:first', `taste:${first.settlement.preflight.taste.flavour}`].sort());
    // control 1: without the persisted memories the SAME meal would pay again — the zero below is the ledger's doing
    // (the pure meal rule the preflight uses, on the durable companion with and without its memories — a cloned ownership state would be
    // refused as unregistered before the rule under test)
    const flora = fixture.ownershipV2.catalogSpecies.find((row) => row.kingdom === 'flora')!.genome as unknown as Record<string, unknown>;
    expect(companionMealOutcomeV2({ ...afterFirst.companion, bond: null } as never, flora).xpGain).toBeGreaterThan(0);
    expect(companionMealOutcomeV2(afterFirst.companion as never, flora).xpGain).toBe(0);
    // control 2 (stale-publication mutant): pressing against the PRE-meal ownership is refused durably and pays nothing
    const stale = await commitArc5FeedActionV1({ runtime: fixture.runtime, ownershipV2: fixture.ownershipV2, state: afterFirst.state, creatureId: fixture.ownership.creatureId, foodLotId: fixture.ownership.foodLotId, codecNow: NOW, activePlayMs: 0 });
    expect(stale.kind).toBe('refused');
    expect((await reboot()).companion.xp).toBe(xpStart + 3);
    // the second meal of the same flavour, pressed against the durable read-back: committed, and pays nothing
    const r2 = press(afterFirst.ownership);
    const second = await commitArc5FeedActionV1({ runtime: fixture.runtime, ownershipV2: afterFirst.ownership, state: afterFirst.state, creatureId: r2.creatureId as never, foodLotId: r2.foodLotId as never, codecNow: NOW, activePlayMs: 0 });
    if (second.kind !== 'committed') throw new Error(`second meal ${second.kind}${second.kind === 'refused' ? ':' + second.detail : ''}`);
    const afterSecond = await reboot();
    expect(afterSecond.companion.xp).toBe(xpStart + 3);
    expect(afterSecond.companion.fed).toBeGreaterThanOrEqual(afterFirst.companion.fed ?? 0); // the meal itself did land
    expect(await receiptKeys(fixture.backend)).toHaveLength(2);
    controller.detach();
  });
});
