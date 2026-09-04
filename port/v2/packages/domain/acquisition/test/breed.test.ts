import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  type CreatureAssignmentV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '../src/model.js';
import {
  migrateOwnershipStateV1ToV2,
  ownershipStateDigestV2,
  type OwnershipStateV2,
} from '../src/model-v2.js';
import {
  ARC5_BREED_FAILURE_RECOVERY_MS_V1,
  ARC5_BREED_BASE_CHILD_XP_V1,
  ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1,
  ARC5_BREED_INJURY_THRESHOLD_V1,
  ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
  arc5BreedLegacySpeciesPairXpKeyV1,
  arc5BreedSpeciesPairXpKeyV1,
  companionBreedOddsV1,
  earnedStardustBonusV1,
  planArc5BreedScenariosV1,
  preflightArc5BreedV1,
  settleArc5BreedScenariosV1,
} from '../src/breed.js';
import {
  companionCommandAvailableV1,
  projectCompanionAvailabilityV1,
} from '../src/companion-availability.js';

interface FixtureOptions {
  readonly leftHurt?: number | null;
  readonly rightHurt?: number | null;
  readonly leftFed?: number | null;
  readonly rightFed?: number | null;
  readonly leftBrood?: number | null;
  readonly rightBrood?: number | null;
  readonly leftAssignment?: CreatureAssignmentV1 | null;
  readonly rightAssignment?: CreatureAssignmentV1 | null;
  readonly leftExhibit?: boolean;
}

interface Fixture {
  readonly state: OwnershipStateV2;
  readonly leftId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
}

function fixture(options: FixtureOptions = {}): Fixture {
  const leftIdentity = canonicalGenomeIdentityV1({
    ...makeGenome(11, 'fauna', 0.45),
    ...(options.leftExhibit === true ? { exhibit: true } : {}),
  });
  const rightIdentity = canonicalGenomeIdentityV1(makeGenome(22, 'fauna', 0.65));
  const identities = [leftIdentity, rightIdentity] as const;
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `breed-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `breed-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const leftId = ownershipContentId('creature', 'breed-left') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'breed-right') as CreatureInstanceId;
  const creature = (
    creatureId: CreatureInstanceId,
    index: 0 | 1,
    hurt: number | null,
    fed: number | null,
    brood: number | null,
    assignment: CreatureAssignmentV1 | null,
  ) => createCreatureInstanceV1({
    creatureId,
    speciesId: identities[index].speciesId,
    genomeIdentity: identities[index].genomeIdentity,
    genome: identities[index].genome,
    nickname: index === 0 ? 'Left' : 'Right',
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identities[index].genome.gen as number },
    xp: 7,
    hurt,
    fed,
    brood,
    assignment,
    bond: null,
  });
  const source = createInitialOwnershipStateV1({
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
        options.leftFed === undefined ? 80 : options.leftFed,
        options.leftBrood === undefined ? 3 : options.leftBrood,
        options.leftAssignment ?? null,
      ),
      creature(
        rightId,
        1,
        options.rightHurt === undefined ? 0 : options.rightHurt,
        options.rightFed === undefined ? 30 : options.rightFed,
        options.rightBrood === undefined ? 4 : options.rightBrood,
        options.rightAssignment ?? null,
      ),
    ],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: leftId,
  });
  return Object.freeze({ state: migrateOwnershipStateV1ToV2(source), leftId, rightId });
}

function ready(
  value: Fixture,
  activePlayMs = 1_000,
  reversed = false,
) {
  const outcome = preflightArc5BreedV1(value.state, {
    parentCreatureIds: reversed
      ? [value.rightId, value.leftId]
      : [value.leftId, value.rightId],
    activePlayMs,
    earnedStardustBonus: earnedStardustBonusV1(750),
  });
  if (outcome.kind !== 'ready') throw new Error(`breed fixture refused: ${outcome.reason}`);
  return outcome.preflight;
}

function planned(
  value: Fixture,
  receiptOrdinal = 7,
  activePlayMs = 1_000,
  speciesPairFirst = true,
) {
  const outcome = planArc5BreedScenariosV1(
    ready(value, activePlayMs),
    receiptOrdinal,
    speciesPairFirst,
  );
  if (outcome.kind !== 'planned') throw new Error(`breed scenarios refused: ${outcome.reason}`);
  return outcome.plan;
}

describe('@cf/domain-acquisition — Arc 5 Breed + Recovery authority', () => {
  it('reproduces the immutable v1 Earth-species pair alias in either parent order', () => {
    const wolf = canonicalGenomeIdentityV1({
      ...makeGenome(101, 'fauna', 0.45),
      _earthName: 'Wolf',
    }).genome;
    const bat = canonicalGenomeIdentityV1({
      ...makeGenome(202, 'fauna', 0.65),
      _earthName: 'Bat',
    }).genome;
    expect(arc5BreedLegacySpeciesPairXpKeyV1(wolf, bat)).toBe('pair|1lrozfz');
    expect(arc5BreedLegacySpeciesPairXpKeyV1(bat, wolf)).toBe('pair|1lrozfz');
  });

  it('preserves the transparent legacy odds formula and audited earned-Stardust cap', () => {
    expect(earnedStardustBonusV1(0)).toBe(0);
    expect(earnedStardustBonusV1(49)).toBe(0);
    expect(earnedStardustBonusV1(50)).toBe(0.01);
    expect(earnedStardustBonusV1(750)).toBe(0.15);
    expect(earnedStardustBonusV1(50_000)).toBe(0.15);
    expect(companionBreedOddsV1(2, 3, 0.07)).toBeCloseTo(0.72, 12);
    expect(companionBreedOddsV1(0, 0, 0.15)).toBe(0.97);
    expect(companionBreedOddsV1(14, 14, 0)).toBe(0.08);
    expect(() => earnedStardustBonusV1(-1)).toThrow(/non-negative/u);
    expect(() => companionBreedOddsV1(1, 2, 0.151)).toThrow(/0 through 0\.15/u);
  });

  it('prebuilds nonlethal success and failure, retaining both parents in exact Recovery', () => {
    const f = fixture();
    const plan = planned(f, 9, 50_000);
    const success = plan.success;
    const failure = plan.failure;

    expect(success.result).toBe('success');
    expect(success.recoveryDurationMs).toBe(ARC5_BREED_SUCCESS_RECOVERY_MS_V1);
    expect(success.recoveryReadyAtActivePlayMs).toBe(530_000);
    expect(success.successor.creatures).toHaveLength(f.state.creatures.length + 1);
    expect(success.successor.creatureTombstones).toEqual([]);
    expect(success.parentsAfter.map((row) => row.assignment)).toEqual([
      { kind: 'recovery', readyAtActivePlayMs: 530_000 },
      { kind: 'recovery', readyAtActivePlayMs: 530_000 },
    ]);
    for (let index = 0; index < success.parentsBefore.length; index++) {
      expect({
        ...success.parentsAfter[index]!,
        assignment: success.parentsBefore[index]!.assignment,
      }).toEqual(success.parentsBefore[index]);
    }
    expect(success.child).toMatchObject({
      origin: 'bred',
      xp: ARC5_BREED_BASE_CHILD_XP_V1 + ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1,
      fed: 15,
      brood: 8,
      hurt: 0,
      assignment: null,
    });
    expect(success.child?.lineage).toEqual({
      kind: 'parent-creatures',
      generation: success.preflight.childGeneration,
      parentCreatureIds: [f.leftId, f.rightId],
    });
    expect(success.acquisition?.provenance.parentSeeds)
      .toEqual(success.preflight.parentSeeds);
    expect(canonicalGenomeIdentityV1(success.child!.genome).genomeIdentity)
      .toBe(success.child?.genomeIdentity);
    expect(success.speciesPairFirst).toBe(true);
    expect(success.childXpAwarded).toBe(7);
    expect(success.speciesPairXpKey).toBe(arc5BreedSpeciesPairXpKeyV1(
      success.preflight.parentSpeciesIds[0],
      success.preflight.parentSpeciesIds[1],
    ));
    expect(success.preflight.legacySpeciesPairXpKey).toBe('pair|v3hssb');
    expect(success.preflight.legacySpeciesPairXpKey).toBe(
      arc5BreedLegacySpeciesPairXpKeyV1(
        success.parentsBefore[0].genome,
        success.parentsBefore[1].genome,
      ),
    );
    expect(success.speciesPairXpKey).not.toBe(success.preflight.legacySpeciesPairXpKey);

    expect(failure.result).toBe('failure');
    expect(failure.recoveryDurationMs).toBe(ARC5_BREED_FAILURE_RECOVERY_MS_V1);
    expect(failure.recoveryReadyAtActivePlayMs).toBe(170_000);
    expect(failure.successor.creatures).toHaveLength(f.state.creatures.length);
    expect(failure.successor.bredAcquisitions).toEqual([]);
    expect(failure.acquisition).toBeNull();
    expect(failure.child).toBeNull();
    expect(failure.speciesPairFirst).toBe(false);
    expect(failure.childXpAwarded).toBe(0);
    expect(failure.parentsAfter.map((row) => row.assignment)).toEqual([
      { kind: 'recovery', readyAtActivePlayMs: 170_000 },
      { kind: 'recovery', readyAtActivePlayMs: 170_000 },
    ]);
    for (let index = 0; index < failure.parentsBefore.length; index++) {
      expect({
        ...failure.parentsAfter[index]!,
        assignment: failure.parentsBefore[index]!.assignment,
      }).toEqual(failure.parentsBefore[index]);
    }
    expect(f.state.creatures.every((row) => row.assignment === null)).toBe(true);
  });

  it('selects the prebuilt scenario from one exact draw and replays byte-identically', () => {
    const first = fixture();
    const second = fixture();
    const left = planned(first, 17);
    const right = planned(second, 17);
    const hitDraw = Math.max(0, left.preflight.odds - 0.000_001);
    const missDraw = Math.min(0.999_999, left.preflight.odds + 0.000_001);
    const hit = settleArc5BreedScenariosV1(left, hitDraw);
    const replay = settleArc5BreedScenariosV1(right, hitDraw);
    const miss = settleArc5BreedScenariosV1(left, missDraw);

    expect(hit.scenario).toBe(left.success);
    expect(miss.scenario).toBe(left.failure);
    expect(hit.scenario.witness).toBe(replay.scenario.witness);
    expect(hit.scenario.receiptEvidence).toEqual(replay.scenario.receiptEvidence);
    expect(ownershipStateDigestV2(hit.scenario.successor))
      .toBe(ownershipStateDigestV2(replay.scenario.successor));
    expect(() => settleArc5BreedScenariosV1({ ...left }, hitDraw)).toThrow(/owner-minted/u);
    expect(() => settleArc5BreedScenariosV1(left, 1)).toThrow(/1 exclusive/u);
  });

  it('preserves ordered parent identity and deterministic hybrid direction', () => {
    const forwardFixture = fixture();
    const reverseFixture = fixture();
    const forwardPreflight = ready(forwardFixture);
    const reversePreflight = ready(reverseFixture, 1_000, true);
    const forward = planArc5BreedScenariosV1(forwardPreflight, 21, true);
    const reverse = planArc5BreedScenariosV1(reversePreflight, 21, true);
    if (forward.kind !== 'planned' || reverse.kind !== 'planned') throw new Error('reverse plan refused');

    expect(reverse.plan.preflight.parentCreatureIds)
      .toEqual([...forward.plan.preflight.parentCreatureIds].reverse());
    expect(reverse.plan.preflight.parentSeeds)
      .toEqual([...forward.plan.preflight.parentSeeds].reverse());
    expect(reverse.plan.preflight.parentSpeciesIds)
      .toEqual([...forward.plan.preflight.parentSpeciesIds].reverse());
    expect(reverse.plan.success.speciesPairXpKey)
      .toBe(forward.plan.success.speciesPairXpKey);
    expect(reverse.plan.preflight.legacySpeciesPairXpKey)
      .toBe(forward.plan.preflight.legacySpeciesPairXpKey);
    expect(reverse.plan.preflight.odds).toBe(forward.plan.preflight.odds);
    expect(reverse.plan.success.acquisition?.provenance.parentCreatureIds)
      .toEqual([reverseFixture.rightId, reverseFixture.leftId]);
    expect(reverse.plan.success.child?.genome.parents)
      .toEqual(reverse.plan.preflight.parentSeeds);
    expect(reverse.plan.success.witness).not.toBe(forward.plan.success.witness);
  });

  it('adds only base XP when the canonical unordered species pair is not first', () => {
    const f = fixture();
    const first = planned(f, 22, 1_000, true);
    const repeatFixture = fixture();
    const repeat = planned(repeatFixture, 22, 1_000, false);
    expect(first.success.child?.xp).toBe(7);
    expect(first.success.childXpAwarded).toBe(7);
    expect(first.success.speciesPairFirst).toBe(true);
    expect(repeat.success.child?.xp).toBe(2);
    expect(repeat.success.childXpAwarded).toBe(2);
    expect(repeat.success.speciesPairFirst).toBe(false);
    expect(repeat.success.speciesPairXpKey).toBe(first.success.speciesPairXpKey);
    expect(repeat.failure.childXpAwarded).toBe(0);
  });

  it('refuses same, absent, exhibit, assigned, recovering, and injured parents before planning', () => {
    const ordinary = fixture();
    const request = (state: OwnershipStateV2, ids: readonly [CreatureInstanceId, CreatureInstanceId], active = 0) => (
      preflightArc5BreedV1(state, {
        parentCreatureIds: ids,
        activePlayMs: active,
        earnedStardustBonus: 0,
      })
    );
    expect(request(ordinary.state, [ordinary.leftId, ordinary.leftId]))
      .toEqual({ kind: 'refused', reason: 'same-parent' });
    expect(request(ordinary.state, [
      ordinary.leftId,
      ownershipContentId('creature', 'absent-breed-parent') as CreatureInstanceId,
    ])).toEqual({ kind: 'refused', reason: 'parent-not-owned' });

    const exhibit = fixture({ leftExhibit: true });
    expect(request(exhibit.state, [exhibit.leftId, exhibit.rightId]))
      .toEqual({ kind: 'refused', reason: 'parent-exhibit' });
    const mission = fixture({ leftAssignment: { kind: 'mission', missionId: 'mission-1' } });
    expect(request(mission.state, [mission.leftId, mission.rightId]))
      .toEqual({ kind: 'refused', reason: 'parent-assigned' });
    const recovering = fixture({
      leftAssignment: { kind: 'recovery', readyAtActivePlayMs: 10_000 },
    });
    expect(request(recovering.state, [recovering.leftId, recovering.rightId], 9_999))
      .toEqual({ kind: 'refused', reason: 'parent-recovering' });
    const injured = fixture({ leftHurt: ARC5_BREED_INJURY_THRESHOLD_V1 });
    expect(request(injured.state, [injured.leftId, injured.rightId]))
      .toEqual({ kind: 'refused', reason: 'parent-injured' });
    const critical = fixture({ rightHurt: 0.9 });
    expect(request(critical.state, [critical.leftId, critical.rightId]))
      .toEqual({ kind: 'refused', reason: 'parent-injured' });
    expect(request(ordinary.state, [ordinary.leftId, ordinary.rightId],
      MAX_ACTIVE_PLAY_MS - ARC5_BREED_SUCCESS_RECOVERY_MS_V1 + 1))
      .toEqual({ kind: 'refused', reason: 'active-play-overflow' });
  });

  it('canonicalizes Recovery at the exact F4 edge and shares one lock across commands', () => {
    const f = fixture({
      leftAssignment: { kind: 'recovery', readyAtActivePlayMs: 10_000 },
    });
    const left = f.state.creatures.find((row) => row.creatureId === f.leftId)!;
    const before = projectCompanionAvailabilityV1(left, 9_999);
    expect(before).toMatchObject({
      assignment: { kind: 'recovery', readyAtActivePlayMs: 10_000 },
      recovered: false,
      recoveryRemainingActivePlayMs: 1,
      blocks: { breed: true, combat: true, dispatch: true },
    });
    const readyAt = projectCompanionAvailabilityV1(left, 10_000);
    expect(readyAt).toMatchObject({
      assignment: null,
      recovered: true,
      recoveryRemainingActivePlayMs: 0,
      blocks: { breed: false, combat: false, dispatch: false },
    });
    expect(companionCommandAvailableV1(left, 10_000, 'breed')).toBe(true);
    expect(companionCommandAvailableV1(left, 10_000, 'combat')).toBe(true);
    expect(companionCommandAvailableV1(left, 10_000, 'dispatch')).toBe(true);
    expect(preflightArc5BreedV1(f.state, {
      parentCreatureIds: [f.leftId, f.rightId],
      activePlayMs: 10_000,
      earnedStardustBonus: 0,
    }).kind).toBe('ready');
  });

  it('rejects hostile assignment accessors without invoking them', () => {
    let touched = 0;
    const hostileAssignment: Record<string, unknown> = {};
    Object.defineProperty(hostileAssignment, 'kind', {
      enumerable: true,
      get: () => {
        touched++;
        return 'mission';
      },
    });
    Object.defineProperty(hostileAssignment, 'missionId', {
      enumerable: true,
      value: 'must-not-be-read',
    });
    expect(() => projectCompanionAvailabilityV1({
      assignment: hostileAssignment as unknown as CreatureAssignmentV1,
    }, 0)).toThrow(/own data field/u);
    expect(touched).toBe(0);

    const hostileCreature: Record<string, unknown> = {};
    Object.defineProperty(hostileCreature, 'assignment', {
      enumerable: true,
      get: () => {
        touched++;
        return null;
      },
    });
    expect(() => projectCompanionAvailabilityV1(
      hostileCreature as unknown as { assignment: CreatureAssignmentV1 | null },
      0,
    )).toThrow(/own data field/u);
    expect(touched).toBe(0);
  });

  it('refuses a success-capacity overflow before a draw can be selected', () => {
    const identity = canonicalGenomeIdentityV1(makeGenome(101, 'fauna', 0.5));
    const discoveries = Array.from({ length: 152 }, (_, index) => createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', `breed-capacity-${index}`) as DiscoveryRecordId,
      speciesId: identity.speciesId,
      legacyCodexId: `breed-capacity-${index}`,
      legacySourceIndex: index,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: index === 0,
    }));
    const memories = Object.freeze(Array.from({ length: 128 }, (_, index) => Object.freeze({
      id: `memory-${index}`,
      kind: 'capacity-control',
      worldKey: null,
      atActivePlayMs: index,
    })));
    const creatures = discoveries.map((discovery, index) => {
      const mementoCount = index === 0 ? 128 : index === 1 ? 110 : 0;
      return createCreatureInstanceV1({
        creatureId: ownershipContentId('creature', `breed-capacity-${index}`) as CreatureInstanceId,
        speciesId: identity.speciesId,
        genomeIdentity: identity.genomeIdentity,
        genome: identity.genome,
        nickname: null,
        origin: 'legacy',
        acquisitionRecordId: discovery.recordId,
        lineage: { kind: 'none', generation: identity.genome.gen as number },
        xp: 0,
        hurt: 0,
        fed: 0,
        brood: 0,
        assignment: null,
        bond: {
          level: 0,
          memories,
          preferredRole: null,
          worldsSurvived: 0,
          guardianVictories: 0,
          mementoIds: Array.from({ length: mementoCount }, (_, item) => `memento-${item}`),
        },
      });
    });
    const source = createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({
        identity,
        alias: null,
        firstObservationId: discoveries[0]!.recordId,
      })],
      discoveries,
      creatures,
      specimenLots: [],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: null,
    });
    const state = migrateOwnershipStateV1ToV2(source);
    const preflight = preflightArc5BreedV1(state, {
      parentCreatureIds: [creatures[0]!.creatureId, creatures[1]!.creatureId],
      activePlayMs: 0,
      earnedStardustBonus: 0,
    });
    if (preflight.kind !== 'ready') throw new Error(preflight.reason);
    expect(planArc5BreedScenariosV1(preflight.preflight, 3, true)).toEqual({
      kind: 'refused',
      reason: 'ownership-capacity-exceeded',
    });
  });

  it('contains no ambient entropy, wall clock, DOM, or mutable-global dependency', () => {
    const breedSource = readFileSync(new URL('../src/breed.ts', import.meta.url), 'utf8');
    const availabilitySource = readFileSync(
      new URL('../src/companion-availability.ts', import.meta.url),
      'utf8',
    );
    for (const source of [breedSource, availabilitySource]) {
      expect(source).not.toMatch(/Math\.random|Date\.|performance\.|globalThis|window\.|document\./u);
    }
  });
});
