import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeGenome, speciesGrade } from '@cf/domain-genome';
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
  type CreatureAssignmentV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_BREED_FAILURE_RECOVERY_MS_V1,
  ARC5_BREED_BASE_CHILD_XP_V1,
  ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1,
  ARC5_BREED_RECEIPT_KIND_V1,
  ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
  arc5BreedLegacySpeciesPairXpKeyV1,
  arc5BreedSpeciesPairXpKeyV1,
} from '@cf/domain-acquisition/breed-internal';
import { createSessionRNG, DOMAINS } from '@cf/domain-sessionrng';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  LEGACY_XP_FIRSTS_NAMESPACE,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareLegacyXpFirstClaim,
  prepareV5SaveWrite,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readF4Authority,
  readLegacyXpFirstsAuthority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  ARC5_BREED_DOMAINS_V1,
  commitArc5BreedActionV1,
  publishArc5BreedSaveFieldsV1,
  type Arc5BreedActionInputV1,
} from '../apps/game/src/arc5-breed-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_070_000;

function sessionSeedFor(predicate: (value: number) => boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (predicate(createSessionRNG(seed).at(DOMAINS.breedOutcome, 0))) return seed;
  }
  throw new Error('no bounded SessionRNG control seed found');
}

const SUCCESS_SESSION_SEED = sessionSeedFor((value) => value < 0.08);
const FAILURE_SESSION_SEED = sessionSeedFor((value) => value >= 0.97);

function faunaSeedAtOrAboveTier(minimum: number, start: number): number {
  for (let seed = start; seed < start + 100_000; seed++) {
    if (speciesGrade(makeGenome(seed, 'fauna', 0.55)).tier >= minimum) return seed;
  }
  throw new Error('no bounded legendary fauna seed found');
}

const LEGENDARY_LEFT_SEED = faunaSeedAtOrAboveTier(5, 0);
const LEGENDARY_RIGHT_SEED = faunaSeedAtOrAboveTier(5, LEGENDARY_LEFT_SEED + 1);

interface OwnershipFixtureOptions {
  readonly leftHurt?: number | null;
  readonly rightHurt?: number | null;
  readonly leftAssignment?: CreatureAssignmentV1 | null;
  readonly rightAssignment?: CreatureAssignmentV1 | null;
  readonly legendaryParents?: boolean;
  readonly leftNickname?: string | null;
  readonly rightNickname?: string | null;
}

interface OwnershipFixture {
  readonly source: OwnershipStateV1;
  readonly leftId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
}

function ownershipFixture(options: OwnershipFixtureOptions = {}): OwnershipFixture {
  const left = canonicalGenomeIdentityV1(makeGenome(
    options.legendaryParents === true ? LEGENDARY_LEFT_SEED : 11,
    'fauna',
    options.legendaryParents === true ? 0.55 : 0.45,
  ));
  const right = canonicalGenomeIdentityV1(makeGenome(
    options.legendaryParents === true ? LEGENDARY_RIGHT_SEED : 22,
    'fauna',
    options.legendaryParents === true ? 0.55 : 0.65,
  ));
  const identities = [left, right] as const;
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `breed-action-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `breed-action-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const leftId = ownershipContentId('creature', 'breed-action-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'breed-action-right') as CreatureInstanceId;
  const creature = (
    id: CreatureInstanceId,
    index: 0 | 1,
    hurt: number | null,
    fed: number,
    assignment: CreatureAssignmentV1 | null,
  ) => createCreatureInstanceV1({
    creatureId: id,
    speciesId: identities[index].speciesId,
    genomeIdentity: identities[index].genomeIdentity,
    genome: identities[index].genome,
    nickname: index === 0
      ? options.leftNickname === undefined ? 'Aster' : options.leftNickname
      : options.rightNickname === undefined ? 'Comet' : options.rightNickname,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identities[index].genome.gen as number },
    xp: 7,
    hurt,
    fed,
    brood: index === 0 ? 3 : 4,
    assignment,
    bond: null,
  });
  return Object.freeze({
    source: createInitialOwnershipStateV1({
      catalogSpecies: identities.map((identity, index) => createCatalogSpeciesV1({
        identity,
        alias: null,
        firstObservationId: discoveries[index]!.recordId,
      })),
      discoveries,
      creatures: [
        creature(
          leftId,
          0,
          options.leftHurt === undefined ? null : options.leftHurt,
          80,
          options.leftAssignment ?? null,
        ),
        creature(
          rightId,
          1,
          options.rightHurt === undefined ? 0 : options.rightHurt,
          30,
          options.rightAssignment ?? null,
        ),
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

function baseState(earnedStardust = 750, unlocked: readonly string[] = []): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`breed base save failed: ${imported.reason}`);
  return {
    ...imported.state,
    stats: { ...imported.state.stats, essenceEarned: earnedStardust },
    unlocked: [...unlocked],
  };
}

function authorityExtensions(
  source: OwnershipStateV1,
  sessionSeed: number,
): Readonly<{
  extensions: V5Extensions;
  authority: ReturnType<typeof prepareF4AuthorityUpdate>['authority'];
  ownershipV2: OwnershipStateV2;
}> {
  const f4 = prepareF4AuthorityUpdate(
    {},
    { activePlayMs: 0 },
    createSessionRNG(sessionSeed).state(),
  );
  const arc4 = applyV5ExtensionWrites(
    f4.extensions,
    encodeArc4Ownership(source).writes,
  ).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`breed Arc 5 fixture was ${arc5.kind}`);
  return Object.freeze({
    extensions: arc5.extensions,
    authority: f4.authority,
    ownershipV2: arc5.state,
  });
}

interface RuntimeFixtureOptions extends OwnershipFixtureOptions {
  readonly sessionSeed?: number;
  readonly activePlayMs?: number;
  readonly earnedStardust?: number;
  readonly corruptArc5?: boolean;
  readonly failReceiptCommit?: boolean;
  readonly unlocked?: readonly string[];
  readonly xpFirsts?: readonly string[];
  readonly xpFirstClaims?: readonly string[];
  readonly xpCarrierWithoutBinding?: boolean;
}

async function runtimeFixture(options: RuntimeFixtureOptions = {}) {
  const ownership = ownershipFixture(options);
  const prepared = authorityExtensions(
    ownership.source,
    options.sessionSeed ?? SUCCESS_SESSION_SEED,
  );
  let initialExtensions = options.corruptArc5 === true
    ? applyV5ExtensionWrites(prepared.extensions, [{
      ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
      carrier: { version: 2, json: '{}' },
    }]).extensions
    : prepared.extensions;
  let state: SaveStateV2 = {
    ...baseState(options.earnedStardust, options.unlocked),
    xpFirsts: [...(options.xpFirsts ?? [])],
  };
  if (options.xpCarrierWithoutBinding === true) {
    initialExtensions = applyV5ExtensionWrites(initialExtensions, [{
      segment: 'inventory',
      namespace: LEGACY_XP_FIRSTS_NAMESPACE,
      carrier: { version: 1, json: '{}' },
    }]).extensions;
  }
  for (const key of options.xpFirstClaims ?? []) {
    const claimed = prepareLegacyXpFirstClaim({ state, extensions: initialExtensions, key });
    if (claimed.kind !== 'prepared') {
      throw new Error(`breed XP-first fixture claim was ${claimed.kind}`);
    }
    state = claimed.state;
    initialExtensions = claimed.extensions;
  }
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: initialExtensions }, REGISTRY, NOW);
  await base.apply([{
    store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw,
  }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`breed v5 fixture was ${migration.kind}`);
  await base.apply(initialSave.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failReceiptCommit === true) {
          throw new Error('forced Arc 5 breed storage failure');
        }
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  let monotonicNow = 0;
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions,
    restoredAuthority: prepared.authority,
    freshSessionSeed: 0,
    ownerId: 'arc5-breed-action-tab',
    token: 'arc5-breed-action-document',
    leaseTtlMs: 1_000_000,
    now: () => monotonicNow,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`breed runtime lease was ${heartbeat.kind}`);
  monotonicNow = options.activePlayMs ?? 60_000;
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

function speciesPairKey(ownership: OwnershipStateV2): string {
  const [left, right] = ownership.creatures;
  if (left === undefined || right === undefined) throw new Error('breed pair fixture is incomplete');
  return arc5BreedSpeciesPairXpKeyV1(left.speciesId, right.speciesId);
}

function legacySpeciesPairKey(ownership: OwnershipStateV2): string {
  const [left, right] = ownership.creatures;
  if (left === undefined || right === undefined) throw new Error('breed pair fixture is incomplete');
  return arc5BreedLegacySpeciesPairXpKeyV1(left.genome, right.genome);
}

function fixtureSpeciesPairKey(options: OwnershipFixtureOptions = {}): string {
  const [left, right] = ownershipFixture(options).source.creatures;
  if (left === undefined || right === undefined) throw new Error('breed source pair is incomplete');
  return arc5BreedSpeciesPairXpKeyV1(left.speciesId, right.speciesId);
}

function fixtureLegacySpeciesPairKey(options: OwnershipFixtureOptions = {}): string {
  const [left, right] = ownershipFixture(options).source.creatures;
  if (left === undefined || right === undefined) throw new Error('breed source pair is incomplete');
  return arc5BreedLegacySpeciesPairXpKeyV1(left.genome, right.genome);
}

async function receiptKeys(backend: StorageBackend): Promise<readonly string[]> {
  return [...await backend.keys('receipts')].sort();
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  reversed = false,
): Arc5BreedActionInputV1 {
  return {
    runtime: fixture.runtime,
    ownershipV2: fixture.ownershipV2,
    state: fixture.state,
    parentCreatureIds: reversed
      ? [fixture.ownership.rightId, fixture.ownership.leftId]
      : [fixture.ownership.leftId, fixture.ownership.rightId],
    codecNow: NOW,
  };
}

describe('Arc 5 headless durable Breed + Recovery action', () => {
  it('commits one success with child, nonlethal parents, eight-minute Recovery, and exact-five reload', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      activePlayMs: 60_000,
    });
    const beforeState = JSON.stringify(fixture.state);
    const pairKey = speciesPairKey(fixture.ownershipV2);
    const legacyPairKey = legacySpeciesPairKey(fixture.ownershipV2);
    expect(pairKey).toMatch(/^[0-9a-f]{64}$/u);
    expect(legacyPairKey).toBe('pair|v3hssb');
    expect(pairKey).not.toBe(legacyPairKey);
    const expectedCommittedState = JSON.stringify({
      ...fixture.state,
      ascProg: { ...fixture.state.ascProg, 'c3-breed': 1 },
      xpFirsts: [pairKey],
    });
    const beforeSource = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (beforeSource.kind !== 'loaded') throw new Error(`breed source was ${beforeSource.kind}`);
    const beforeArc4 = ARC4_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
      fixture.runtime.extensions[target.segment]?.[target.namespace]
    ));

    const pending = commitArc5BreedActionV1(actionInput(fixture));
    expect(fixture.ownershipV2.creatures).toHaveLength(2);
    expect(fixture.ownershipV2.creatures.every((row) => row.assignment === null)).toBe(true);
    expect(fixture.state.xpFirsts).toEqual([]);
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;

    expect(outcome.transaction).toMatchObject({
      revision: 1,
      plan: { receiptOrdinal: 0, draws: [{ domain: DOMAINS.breedOutcome }] },
      receipt: { ordinal: 0, kind: ARC5_BREED_RECEIPT_KIND_V1 },
    });
    expect(outcome.settlement.scenario).toMatchObject({
      result: 'success',
      recoveryDurationMs: ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
      recoveryReadyAtActivePlayMs: 540_000,
      child: {
        origin: 'bred',
        xp: ARC5_BREED_BASE_CHILD_XP_V1 + ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1,
        fed: 15,
        brood: 8,
        hurt: 0,
      },
      speciesPairXpKey: pairKey,
      speciesPairFirst: true,
      childXpAwarded: 7,
    });
    expect(outcome.settlement.scenario.parentsAfter.map((row) => row.assignment)).toEqual([
      { kind: 'recovery', readyAtActivePlayMs: 540_000 },
      { kind: 'recovery', readyAtActivePlayMs: 540_000 },
    ]);
    expect(outcome.transaction.receipt.witness).toBe(outcome.settlement.scenario.witness);
    expect(outcome.charterBredBanked).toBe(true);
    expect(outcome.bredLegendAchievementAdded).toBe(false);
    expect(outcome.childXpAwarded).toBe(7);
    expect(outcome.speciesPairXpKey).toBe(pairKey);
    expect(outcome.speciesPairFirstXpAwarded).toBe(true);
    expect(outcome.xpFirstsTotalCount).toBe(1);
    expect(outcome.transaction.state.ascProg).toEqual({
      ...fixture.state.ascProg,
      'c3-breed': 1,
    });
    expect(outcome.ownershipWrites).toHaveLength(5);
    expect(outcome.ownershipWrites.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(outcome.ownershipV2.creatures).toHaveLength(3);
    expect(fixture.ownershipV2.creatures).toHaveLength(2);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.revision()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED,
      ordinal: 1,
      draws: { [DOMAINS.breedOutcome]: 1 },
    });
    expect(JSON.stringify(outcome.transaction.state)).toBe(expectedCommittedState);
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    const afterSource = readArc4Ownership(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (afterSource.kind !== 'loaded') throw new Error(`breed reload source was ${afterSource.kind}`);
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
      expect(JSON.stringify(saved.state)).toBe(expectedCommittedState);
      expect(readLegacyXpFirstsAuthority(saved.state, saved.extensions)).toEqual({
        kind: 'loaded', mode: 'legacy-tail', window: [pairKey], archived: [], totalCount: 1,
      });
      expect(saved.state.xpFirsts).not.toContain(legacyPairKey);
      expect(readF4Authority(saved.extensions)).toEqual({
        kind: 'loaded',
        authority: {
          activePlayMs: 60_000,
          sessionRng: {
            seed: SUCCESS_SESSION_SEED,
            ordinal: 1,
            draws: { [DOMAINS.breedOutcome]: 1 },
          },
        },
      });
    }
    await fixture.runtime.release();
  });

  it('appends bredlegend only when a successful outcome used two Legendary-or-better parents', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      activePlayMs: 60_000,
      legendaryParents: true,
    });
    const beforeState = JSON.stringify(fixture.state);
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.result).toBe('success');
    expect(outcome.settlement.scenario.preflight.parentTiers[0]).toBeGreaterThanOrEqual(5);
    expect(outcome.settlement.scenario.preflight.parentTiers[1]).toBeGreaterThanOrEqual(5);
    expect(outcome.bredLegendAchievementAdded).toBe(true);
    expect(outcome.transaction.state.unlocked).toEqual(['bredlegend']);
    expect(outcome.transaction.saved.canonicalState.unlocked).toEqual(['bredlegend']);
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') expect(saved.state.unlocked).toEqual(['bredlegend']);
    await fixture.runtime.release();
  });

  it('does not append bredlegend when the same Legendary pair rolls failure', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: FAILURE_SESSION_SEED,
      legendaryParents: true,
    });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.result).toBe('failure');
    expect(outcome.settlement.scenario.preflight.parentTiers.every((tier) => tier >= 5)).toBe(true);
    expect(outcome.bredLegendAchievementAdded).toBe(false);
    expect(outcome.transaction.state.unlocked).toEqual([]);
    await fixture.runtime.release();
  });

  it('preserves one existing bredlegend idempotently on a qualifying success', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      legendaryParents: true,
      unlocked: ['bredlegend'],
    });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.result).toBe('success');
    expect(outcome.bredLegendAchievementAdded).toBe(false);
    expect(outcome.transaction.state.unlocked).toEqual(['bredlegend']);
    await fixture.runtime.release();
  });

  it('refuses a qualifying success-capacity overflow before any draw or CAS', async () => {
    const fullUnlocked = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat-breed-${index}`,
    );
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      legendaryParents: true,
      unlocked: fullUnlocked,
    });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'capacity:achievement:achievement-capacity',
      transaction: {
        kind: 'pre-draw-refused',
        reason: 'capacity:achievement:achievement-capacity',
      },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED, ordinal: 0, draws: {},
    });
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await fixture.runtime.release();
  });

  it('commits one failure with no child and two-minute Recovery', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: FAILURE_SESSION_SEED,
      activePlayMs: 1_000,
    });
    const beforeState = JSON.stringify(fixture.state);
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario).toMatchObject({
      result: 'failure',
      recoveryDurationMs: ARC5_BREED_FAILURE_RECOVERY_MS_V1,
      recoveryReadyAtActivePlayMs: 121_000,
      speciesPairFirst: false,
      childXpAwarded: 0,
      acquisition: null,
      child: null,
    });
    expect(outcome.ownershipV2.creatures).toHaveLength(2);
    expect(outcome.charterBredBanked).toBe(false);
    expect(outcome.bredLegendAchievementAdded).toBe(false);
    expect(outcome.childXpAwarded).toBe(0);
    expect(outcome.speciesPairFirstXpAwarded).toBe(false);
    expect(outcome.transaction.state.xpFirsts).toEqual([]);
    expect(JSON.stringify(outcome.transaction.state)).toBe(beforeState);
    expect(outcome.ownershipV2.bredAcquisitions).toEqual([]);
    expect(outcome.settlement.scenario.parentsAfter.map((row) => row.assignment)).toEqual([
      { kind: 'recovery', readyAtActivePlayMs: 121_000 },
      { kind: 'recovery', readyAtActivePlayMs: 121_000 },
    ]);
    expect(fixture.runtime.sessionRng.draws).toEqual({ [DOMAINS.breedOutcome]: 1 });
    await fixture.runtime.release();
  });

  it('keeps reversed parent order in the committed child lineage', async () => {
    const fixture = await runtimeFixture({ sessionSeed: SUCCESS_SESSION_SEED });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture, true));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.preflight.parentCreatureIds).toEqual([
      fixture.ownership.rightId,
      fixture.ownership.leftId,
    ]);
    expect(outcome.settlement.scenario.child?.lineage).toMatchObject({
      parentCreatureIds: [fixture.ownership.rightId, fixture.ownership.leftId],
    });
    expect(outcome.settlement.scenario.child?.genome.parents)
      .toEqual(outcome.settlement.scenario.preflight.parentSeeds);
    expect(outcome.speciesPairXpKey).toBe(fixtureSpeciesPairKey());
    await fixture.runtime.release();
  });

  it('pays only +2 for a reversed, renamed repeat of the exact species pair', async () => {
    const pairKey = fixtureSpeciesPairKey();
    const legacyPairKey = fixtureLegacySpeciesPairKey();
    expect(fixtureLegacySpeciesPairKey({
      leftNickname: 'Display-only A',
      rightNickname: 'Display-only B',
    })).toBe(legacyPairKey);
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      leftNickname: 'Nova Prime',
      rightNickname: 'Echo-7',
      xpFirsts: [legacyPairKey],
    });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture, true));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.result).toBe('success');
    expect(outcome.settlement.scenario.parentsBefore.map((row) => row.nickname))
      .toEqual(['Echo-7', 'Nova Prime']);
    expect(outcome.settlement.scenario.child?.xp).toBe(ARC5_BREED_BASE_CHILD_XP_V1);
    expect(outcome.childXpAwarded).toBe(2);
    expect(outcome.speciesPairXpKey).toBe(pairKey);
    expect(outcome.settlement.scenario.preflight.legacySpeciesPairXpKey).toBe(legacyPairKey);
    expect(outcome.speciesPairFirstXpAwarded).toBe(false);
    expect(outcome.xpFirstsTotalCount).toBe(1);
    expect(outcome.transaction.state.xpFirsts).toEqual([legacyPairKey]);
    expect(outcome.transaction.state.xpFirsts).not.toContain(pairKey);
    expect(outcome.transaction.state.xpFirstsBinding).toBeNull();
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED,
      ordinal: 1,
      draws: { [DOMAINS.breedOutcome]: 1 },
    });
    await fixture.runtime.release();
  });

  it('keeps an archived species-pair claim authoritative across reload and repeat', async () => {
    const pairKey = fixtureSpeciesPairKey();
    const legacyPairKey = fixtureLegacySpeciesPairKey();
    const window = [
      legacyPairKey,
      ...Array.from({ length: 3_999 }, (_, index) => `archive-fill-${index}`),
    ];
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      xpFirsts: window,
      xpFirstClaims: ['archive-displacement-control'],
    });
    const before = readLegacyXpFirstsAuthority(fixture.state, fixture.runtime.extensions);
    expect(before).toMatchObject({
      kind: 'loaded', mode: 'overflow', totalCount: 4_001,
      archived: [legacyPairKey],
    });
    const bindingBefore = fixture.state.xpFirstsBinding;
    const carrierBefore = fixture.runtime.extensions.inventory?.[LEGACY_XP_FIRSTS_NAMESPACE];
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.child?.xp).toBe(2);
    expect(outcome.speciesPairXpKey).toBe(pairKey);
    expect(outcome.speciesPairFirstXpAwarded).toBe(false);
    expect(outcome.xpFirstsTotalCount).toBe(4_001);
    expect(outcome.transaction.state.xpFirstsBinding).toEqual(bindingBefore);
    expect(outcome.transaction.saved.extensions.inventory?.[LEGACY_XP_FIRSTS_NAMESPACE])
      .toEqual(carrierBefore);
    expect(readLegacyXpFirstsAuthority(
      outcome.transaction.state,
      outcome.transaction.saved.extensions,
    )).toMatchObject({
      kind: 'loaded', mode: 'overflow', totalCount: 4_001,
      archived: [legacyPairKey],
    });
    expect(outcome.transaction.state.xpFirsts).not.toContain(pairKey);
    await fixture.runtime.release();
  });

  it('rotates the 4,001st first into xpa while keeping five ownership writes and one CAS', async () => {
    const pairKey = fixtureSpeciesPairKey();
    const window = Array.from({ length: 4_000 }, (_, index) => `window-fill-${index}`);
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      xpFirsts: window,
    });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.scenario.child?.xp).toBe(7);
    expect(outcome.speciesPairFirstXpAwarded).toBe(true);
    expect(outcome.xpFirstsTotalCount).toBe(4_001);
    expect(outcome.ownershipWrites).toHaveLength(5);
    expect(fixture.receiptCas()).toBe(1);
    const authority = readLegacyXpFirstsAuthority(
      outcome.transaction.state,
      outcome.transaction.saved.extensions,
    );
    expect(authority).toMatchObject({
      kind: 'loaded',
      mode: 'overflow',
      totalCount: 4_001,
      archived: ['window-fill-0'],
    });
    if (authority.kind === 'loaded') {
      expect(authority.window).toHaveLength(4_000);
      expect(authority.window.at(-1)).toBe(pairKey);
    }
    expect(outcome.transaction.state.xpFirstsBinding).not.toBeNull();
    expect(outcome.transaction.saved.extensions.inventory?.[LEGACY_XP_FIRSTS_NAMESPACE])
      .toBeDefined();
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED,
      ordinal: 1,
      draws: { [DOMAINS.breedOutcome]: 1 },
    });
    await fixture.runtime.release();
  });

  it('refuses eligibility and corrupt-carrier capacity before any draw, receipt, or revision', async () => {
    const cases = [
      await runtimeFixture({ leftHurt: 0.3 }),
      await runtimeFixture({ leftAssignment: { kind: 'mission', missionId: 'away-1' } }),
      await runtimeFixture({ corruptArc5: true }),
      await runtimeFixture({ xpCarrierWithoutBinding: true }),
    ] as const;
    const expected = [
      'preflight:parent-injured',
      'preflight:parent-assigned',
      'ownership-carrier:base-corrupt',
      'capacity:xp-firsts:carrier-without-binding',
    ] as const;
    const convergence = [
      'none',
      'none',
      'read-only-reload',
      'read-only-reload',
    ] as const;
    for (let index = 0; index < cases.length; index++) {
      const fixture = cases[index]!;
      const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
      const outcome = await commitArc5BreedActionV1(actionInput(fixture));
      expect(outcome).toMatchObject({
        kind: 'refused',
        durability: 'none',
        convergence: convergence[index],
        detail: expected[index],
        transaction: { kind: 'pre-draw-refused', reason: expected[index] },
      });
      expect(fixture.receiptCas()).toBe(0);
      expect(await receiptKeys(fixture.backend)).toEqual([]);
      expect(await fixture.repository.revision()).toBe(0);
      expect(fixture.runtime.sessionRng).toEqual({
        seed: SUCCESS_SESSION_SEED,
        ordinal: 0,
        draws: {},
      });
      expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
        .toBe(JSON.stringify(savedBefore));
      await fixture.runtime.release();
    }
  });

  it('fails stale without retry, receipt, Recovery publication, or RNG advance', async () => {
    const fixture = await runtimeFixture({ sessionSeed: SUCCESS_SESSION_SEED });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const extensionsBefore = JSON.stringify(fixture.runtime.extensions);
    await fixture.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'breed-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED, ordinal: 0, draws: {},
    });
    expect(JSON.stringify(fixture.runtime.extensions)).toBe(extensionsBefore);
    expect(fixture.ownershipV2.creatures.every((row) => row.assignment === null)).toBe(true);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
  });

  it('fails storage once with no receipt, revision, product bytes, or optimistic publication', async () => {
    const fixture = await runtimeFixture({
      sessionSeed: SUCCESS_SESSION_SEED,
      failReceiptCommit: true,
    });
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 5 breed storage failure',
      transaction: { kind: 'storage-error', message: 'forced Arc 5 breed storage failure' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await receiptKeys(fixture.backend)).toEqual([]);
    expect(await fixture.repository.revision()).toBe(0);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED, ordinal: 0, draws: {},
    });
    expect(fixture.ownershipV2.creatures.every((row) => row.assignment === null)).toBe(true);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await fixture.runtime.release();
  });

  it('maps a duplicate receipt to one read-only refusal with no CAS retry', async () => {
    const fixture = await runtimeFixture({ sessionSeed: SUCCESS_SESSION_SEED });
    const existingReceipt = Object.freeze({
      ordinal: 0,
      kind: 'preexisting-breed-control',
      witness: 'another-owner-already-committed',
    });
    await fixture.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existingReceipt),
    }]);
    const savedBefore = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc5BreedActionV1(actionInput(fixture));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:duplicate-receipt',
      transaction: {
        kind: 'duplicate-receipt',
        receiptKey: 'receipt:0',
        existing: existingReceipt,
        plan: { receiptOrdinal: 0, draws: [{ domain: DOMAINS.breedOutcome }] },
      },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await receiptKeys(fixture.backend)).toEqual(['receipt:0']);
    expect(await fixture.repository.readReceipt(0)).toEqual(existingReceipt);
    expect(await fixture.repository.revision()).toBe(0);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: SUCCESS_SESSION_SEED, ordinal: 0, draws: {},
    });
    expect(fixture.runtime.diagnostics()).toMatchObject({
      revision: 0, commits: 0, staleBlocked: true, leaseOwned: false,
    });
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
  });

  it('captures exact inputs before queueing and rejects hostile accessors', async () => {
    const fixture = await runtimeFixture({ sessionSeed: SUCCESS_SESSION_SEED });
    const input = actionInput(fixture);
    const originalEssence = fixture.state.essence;
    const pending = commitArc5BreedActionV1(input);
    fixture.state.essence += 777;
    Object.assign(input as unknown as Record<string, unknown>, {
      parentCreatureIds: [fixture.ownership.leftId, fixture.ownership.leftId],
      codecNow: -1,
    });
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind === 'committed') {
      expect(outcome.settlement.scenario.preflight.parentCreatureIds).toEqual([
        fixture.ownership.leftId,
        fixture.ownership.rightId,
      ]);
      expect(outcome.transaction.state.essence).toBe(originalEssence);
    }
    expect(fixture.state.essence).toBe(originalEssence + 777);
    await fixture.runtime.release();

    const hostileFixture = await runtimeFixture();
    let reads = 0;
    const hostile = { ...actionInput(hostileFixture) } as Record<string, unknown>;
    Object.defineProperty(hostile, 'parentCreatureIds', {
      enumerable: true,
      get() { reads++; return [hostileFixture.ownership.leftId, hostileFixture.ownership.rightId]; },
    });
    await expect(commitArc5BreedActionV1(hostile as unknown as Arc5BreedActionInputV1))
      .resolves.toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered' });
    expect(reads).toBe(0);
    await hostileFixture.runtime.release();
  });

  it('publishes only detached Charter, achievement, xpf, and xpa fields into the live outer save', () => {
    const target = baseState();
    const items = target.items;
    const stats = target.stats;
    const committed: SaveStateV2 = {
      ...target,
      ascCh: 2,
      ascProg: { ...target.ascProg, 'c3-breed': 1 },
      unlocked: ['compat-before', 'bredlegend'],
      xpFirsts: ['pair-first-control'],
      xpFirstsBinding: {
        v: 1,
        totalCount: 4_001,
        carrierDigest: 'a'.repeat(64),
      },
    };
    publishArc5BreedSaveFieldsV1(target, committed);
    expect(target.ascCh).toBe(2);
    expect(target.ascProg).toEqual({ ...committed.ascProg });
    expect(target.ascProg).not.toBe(committed.ascProg);
    expect(target.unlocked).toEqual(['compat-before', 'bredlegend']);
    expect(target.unlocked).not.toBe(committed.unlocked);
    expect(target.xpFirsts).toEqual(['pair-first-control']);
    expect(target.xpFirsts).not.toBe(committed.xpFirsts);
    expect(target.xpFirstsBinding).toEqual(committed.xpFirstsBinding);
    expect(target.xpFirstsBinding).not.toBe(committed.xpFirstsBinding);
    expect(target.items).toBe(items);
    expect(target.stats).toBe(stats);

    const withoutBinding = { ...committed };
    delete withoutBinding.xpFirstsBinding;
    publishArc5BreedSaveFieldsV1(target, withoutBinding);
    expect(Object.prototype.hasOwnProperty.call(target, 'xpFirstsBinding')).toBe(false);
  });

  it('pins one semantic outcome domain and contains no bare entropy or wall clock', () => {
    expect(ARC5_BREED_DOMAINS_V1).toEqual([DOMAINS.breedOutcome]);
    const source = fs.readFileSync(
      path.join(here, '..', 'apps', 'game', 'src', 'arc5-breed-action.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/Math\.random|Date\.|performance\.|globalThis/u);
    for (const marker of [
      'bankBredSuccess(base.ascCh, progress, true)',
      "scenario.result !== 'success'",
      "prepareArc9EventAchievementJoinV1(charter.state, 'bredlegend')",
      'prepareLegacyXpFirstClaim({',
      'extensionWrites: prepared.extensionWrites',
      'failureSaveDigest',
      'successSaveDigest',
      'charterBredBanked: committedSelection.prepared.charterBredBanked',
    ]) expect(source, marker).toContain(marker);
  });
});
