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
  ARC5_SCOUT_ACTION_KIND_V1,
  ARC5_SCOUT_RECEIPT_KIND_V1,
} from '@cf/domain-acquisition/scout-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
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
  commitArc5ScoutActionV1,
  publishArc5ScoutCharterFieldsV1,
  type Arc5ScoutActionInputV1,
} from '../apps/game/src/arc5-scout-action.js';
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
    ...makeGenome(1_208, 'fauna', 0.54),
    ...(exhibit ? { exhibit: true } : {}),
  });
  const discoveries = [0, 1].map((index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `scout-action-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `scout-action-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const leftId = ownershipContentId('creature', 'scout-action-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'scout-action-right') as CreatureInstanceId;
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
      : { kind: 'mission', missionId: 'scout-action-mission' },
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

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Field Scout base save failed: ${imported.reason}`);
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
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`Field Scout Arc 5 fixture was ${arc5.kind}`);
  return Object.freeze({ extensions: arc5.extensions, authority: f4.authority, ownershipV2: arc5.state });
}

async function runtimeFixture(options: Readonly<{
  failStorage?: boolean;
  exhibit?: boolean;
  configureState?: (state: SaveStateV2) => void;
}> = {}) {
  const ownership = ownershipFixture(options.exhibit ?? false);
  const prepared = authorityExtensions(ownership.source);
  const state = baseState();
  options.configureState?.(state);
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: prepared.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Field Scout v5 fixture was ${migration.kind}`);
  await base.apply(initialSave.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Arc 5 Field Scout storage failure');
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
    ownerId: 'arc5-scout-action-tab',
    token: 'arc5-scout-action-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Field Scout runtime lease was ${heartbeat.kind}`);
  return {
    backend, repository, runtime, state, ownership,
    ownershipV2: prepared.ownershipV2,
    receiptCas: () => receiptCas,
  };
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  scoutCreatureId: CreatureInstanceId | null = fixture.ownership.rightId,
): Arc5ScoutActionInputV1 {
  return {
    runtime: fixture.runtime,
    ownershipV2: fixture.ownershipV2,
    state: fixture.state,
    scoutCreatureId,
    codecNow: NOW,
  };
}

async function receiptKeys(backend: StorageBackend): Promise<readonly string[]> {
  return [...await backend.keys('receipts')].sort();
}

describe('Arc 5 headless durable Field Scout action', () => {
  it('commits the codec-canonical scout state when an unrelated veteran mining stamp moves', async () => {
    const fixture = await runtimeFixture({
      configureState(state) {
        state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
        state.mineX = [['veteran-clock-floor', 1]];
      },
    });
    const before = JSON.stringify(fixture.state);
    const outcome = await commitArc5ScoutActionV1({
      ...actionInput(fixture),
      codecNow: NOW + 1,
    });

    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.transaction.state.mined).get('veteran-clock-floor'))
      .toBe(NOW + 1 - 30 * 6e5);
    await fixture.runtime.release();
  });

  it('switches one exact twin through five writes and reloads byte-identically', async () => {
    const fixture = await runtimeFixture();
    const beforeState = JSON.stringify(fixture.state);
    const sourceBefore = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (sourceBefore.kind !== 'loaded') throw new Error(`Field Scout source was ${sourceBefore.kind}`);
    const arc4Before = ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ));

    const pending = commitArc5ScoutActionV1(actionInput(fixture));
    expect(fixture.ownershipV2.scoutCreatureId).toBe(fixture.ownership.leftId);
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome).toMatchObject({
      durability: 'committed',
      convergence: 'none',
      transaction: {
        revision: 1,
        plan: { operation: ARC5_SCOUT_ACTION_KIND_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC5_SCOUT_RECEIPT_KIND_V1 },
      },
      settlement: {
        preflight: {
          scoutBefore: fixture.ownership.leftId,
          scoutAfter: fixture.ownership.rightId,
        },
      },
      ownershipV2: { scoutCreatureId: fixture.ownership.rightId },
    });
    expect(outcome.ownershipWrites.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(outcome.ownershipV2.creatures).toEqual(fixture.ownershipV2.creatures);
    expect(JSON.stringify(outcome.transaction.state)).toBe(beforeState);
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA5FEE001, ordinal: 1, draws: {},
    });
    const sourceAfter = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (sourceAfter.kind !== 'loaded') throw new Error(`Field Scout reload source was ${sourceAfter.kind}`);
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
      expect(readF4Authority(saved.extensions)).toEqual({
        kind: 'loaded',
        authority: { activePlayMs: 0, sessionRng: { seed: 0xA5FEE001, ordinal: 1, draws: {} } },
      });
    }
    await fixture.runtime.release();
  });

  it('joins the accepted Scout Charter, reward, and progression into the same exact-five CAS', async () => {
    const fixture = await runtimeFixture({
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scout'];
        state.stats = { ...state.stats, charters: 2 };
      },
    });
    const sourceBefore = JSON.stringify(fixture.state);
    const essenceBefore = fixture.state.essence;
    const outcome = await commitArc5ScoutActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.ownershipWrites).toHaveLength(5);
    expect(outcome.extensionWrites).toHaveLength(5);
    expect(outcome.starterCharter).toMatchObject({
      changed: true,
      event: { kind: 'scout-set', scoutId: fixture.ownership.rightId },
      progressIds: ['st-scout'],
      completions: [{ id: 'st-scout', stardust: 15, gearId: null }],
    });
    expect(JSON.parse(outcome.transaction.receipt.witness)).toMatchObject({
      starterCharter: {
        event: { kind: 'scout-set', scoutId: fixture.ownership.rightId },
      },
    });
    expect(outcome.transaction.state).toMatchObject({
      chDone: ['st-land', 'st-mine', 'st-scout'],
      chacc: [],
      chProg: { 'st-scout': 1 },
      essence: essenceBefore + 15,
      stats: { charters: 3 },
    });
    expect(JSON.stringify(fixture.state)).toBe(sourceBefore);
    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state).toEqual(outcome.transaction.state);
    }

    const logIdentity = fixture.state.logMap;
    publishArc5ScoutCharterFieldsV1(fixture.state, outcome.transaction.state);
    expect(fixture.state.logMap).toBe(logIdentity);
    expect(fixture.state).toMatchObject({
      chDone: ['st-land', 'st-mine', 'st-scout'],
      chacc: [],
      essence: essenceBefore + 15,
    });
    await fixture.runtime.release();
  });

  it('stands down durably and refuses unchanged or exhibition targets before planning', async () => {
    const fixture = await runtimeFixture({
      configureState(state) { state.chacc = ['st-scout']; },
    });
    const stoodDown = await commitArc5ScoutActionV1(actionInput(fixture, null));
    expect(stoodDown).toMatchObject({
      kind: 'committed',
      settlement: { preflight: { scoutBefore: fixture.ownership.leftId, scoutAfter: null } },
      ownershipV2: { scoutCreatureId: null },
      starterCharter: null,
      transaction: { state: { chacc: ['st-scout'], chDone: [] } },
    });
    await fixture.runtime.release();

    const unchanged = await runtimeFixture({
      configureState(state) { state.chacc = ['st-scout']; },
    });
    let calls = 0;
    const runtime = { async commitAction() { calls++; return { kind: 'lease-unavailable' as const }; } };
    await expect(commitArc5ScoutActionV1({
      ...actionInput(unchanged, unchanged.ownership.leftId), runtime,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:scout-unchanged', transaction: null,
    });
    const exhibit = await runtimeFixture({ exhibit: true });
    await expect(commitArc5ScoutActionV1({
      ...actionInput(exhibit, exhibit.ownership.rightId), runtime,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:creature-exhibit', transaction: null,
    });
    expect(calls).toBe(0);
    expect(unchanged.state.chacc).toEqual(['st-scout']);
    await unchanged.runtime.release();
    await exhibit.runtime.release();
  });

  it('fails a stale competitor once with no receipt, retry, or Scout publication', async () => {
    const fixture = await runtimeFixture({
      configureState(state) { state.chacc = ['st-scout']; },
    });
    const extensionsBefore = JSON.stringify(fixture.runtime.extensions);
    const stateBefore = JSON.stringify(fixture.state);
    await fixture.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'scout-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc5ScoutActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(JSON.stringify(fixture.runtime.extensions)).toBe(extensionsBefore);
    expect(JSON.stringify(fixture.state)).toBe(stateBefore);
    expect(fixture.state).toMatchObject({ chacc: ['st-scout'], chDone: [] });
    expect(fixture.ownershipV2.scoutCreatureId).toBe(fixture.ownership.leftId);
  });

  it('contains one storage failure with no receipt, revision, or optimistic Scout', async () => {
    const fixture = await runtimeFixture({
      failStorage: true,
      configureState(state) { state.chacc = ['st-scout']; },
    });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const sourceBefore = JSON.stringify(fixture.state);
    const outcome = await commitArc5ScoutActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 5 Field Scout storage failure',
      transaction: { kind: 'storage-error', message: 'forced Arc 5 Field Scout storage failure' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    expect(JSON.stringify(fixture.state)).toBe(sourceBefore);
    expect(fixture.state).toMatchObject({ chacc: ['st-scout'], chDone: [] });
    expect(fixture.ownershipV2.scoutCreatureId).toBe(fixture.ownership.leftId);
    await fixture.runtime.release();
  });

  it('classifies a committed carrier mismatch as reload-only convergence', async () => {
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
          canonicalizeState: (state: SaveStateV2) => SaveStateV2;
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
          canonicalizeState: (state) => prepareV5SaveWrite(
            { state, extensions: {} }, REGISTRY, input.codecNow,
          ).canonicalState,
        });
        return {
          kind: 'committed' as const,
          revision: 1,
          state: derived.state,
          saved: {
            canonicalState: derived.state,
            /* Durability is reported while the exact-five Scout writes are
               deliberately absent: publication must fail closed to reload. */
            extensions: fixture.runtime.extensions,
          },
          plan: { operation: input.operation, receiptOrdinal: 0 },
          receipt: { ordinal: 0, kind: input.receiptKind, witness: derived.witness },
          authority: {
            activePlayMs: 0,
            sessionRng: { seed: 0xA5FEE001, ordinal: 1, draws: {} },
          },
        };
      },
    };
    const outcome = await commitArc5ScoutActionV1({
      ...actionInput(fixture),
      runtime: runtime as unknown as Arc5ScoutActionInputV1['runtime'],
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-scout-fixed-point-mismatch',
      transaction: { kind: 'committed', revision: 1 },
    });
    expect(fixture.ownershipV2.scoutCreatureId).toBe(fixture.ownership.leftId);
    await fixture.runtime.release();
  });

  it('refuses malformed Charter state before any Scout receipt or durable mutation', async () => {
    const fixture = await runtimeFixture({
      configureState(state) { state.chacc = ['st-scout', 'st-scout']; },
    });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const sourceBefore = JSON.stringify(fixture.state);
    const outcome = await commitArc5ScoutActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none',
      detail: expect.stringContaining('starter Charter refused'),
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    expect(JSON.stringify(fixture.state)).toBe(sourceBefore);
    expect(fixture.ownershipV2.scoutCreatureId).toBe(fixture.ownership.leftId);
    await fixture.runtime.release();
  });

  it('rejects hostile action accessors without touching them', async () => {
    const fixture = await runtimeFixture();
    let reads = 0;
    const hostile = { ...actionInput(fixture) } as Record<string, unknown>;
    Object.defineProperty(hostile, 'scoutCreatureId', {
      enumerable: true,
      get() { reads++; return fixture.ownership.rightId; },
    });
    await expect(commitArc5ScoutActionV1(hostile as unknown as Arc5ScoutActionInputV1))
      .resolves.toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered' });
    expect(reads).toBe(0);
    await fixture.runtime.release();
  });
});
