import { beforeAll, describe, expect, it } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  canonicalJson,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createEmptyOwnershipStateV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  createEmptyGuardianAcquisitionStateV1,
  prepareGuardianAcquisitionV1,
  type GuardianAcquisitionEntryV1,
  type GuardianAcquisitionStateV1,
} from '@cf/domain-acquisition/guardian-acquisition-internal';
import {
  GUARDIAN_COMPANION_STATE_SCHEMA_V1,
  GUARDIAN_COMPANION_STATE_VERSION_V1,
  decodeGuardianCompanionStateV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import {
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementPlanV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { projectWorldOpportunity, type WorldOpportunitySnapshot } from '@cf/domain-opportunity';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  GUARDIAN_ACQUISITION_NAMESPACE_V1,
  GUARDIAN_COMPANION_NAMESPACE_V1,
  applyV5ExtensionWrites,
  guardianAcquisitionCarrierWriteV1,
  guardianCompanionCarrierWriteV1,
  prepareF4AuthorityUpdate,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  commitArc6CombatActionV1,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionRosterV1,
  projectArc6CombatChampionV1,
  type Arc6CombatChampionRosterV1,
} from '../apps/game/src/arc6-combat-action.js';
import { projectCombatCardReadModelV1 } from '../apps/game/src/combat-card.js';

beforeAll(() => installCaptureHooks());

const CAPTURE_WORLDS = Object.freeze({
  guardian: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
    planet: Object.freeze({ seed: 2456455053 }),
  }),
  titan: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 2481585519 }),
  }),
} as const);

function encounterFixture(kind: 'guardian' | 'titan'): Readonly<{
  encounter: GuardianPrimeEncounterV1;
  opportunity: WorldOpportunitySnapshot;
}> {
  const resolved = resolveCF1WorldAddress(CAPTURE_WORLDS[kind]);
  if (!resolved.ok) throw new Error(`${kind} world failed: ${resolved.reason}`);
  const opportunity = projectWorldOpportunity(resolved.address);
  const encounter = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: kind === 'titan' ? 'lava' : 'airless' },
    regionIndex: 0,
    faunaRoster: kind === 'titan'
      ? []
      : [{ speciesId: 'guardian-champion-capture-native', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: kind === 'titan'
      ? []
      : ['stone', 'flame', 'sky', 'star', 'ocean', 'mind', 'life', 'void', 'prism'],
    conquered: false,
  });
  if (encounter === null || encounter.defender.kind !== kind) {
    throw new Error(`${kind} encounter drifted`);
  }
  return Object.freeze({ encounter, opportunity });
}

function capturePlan(kind: 'guardian' | 'titan', ordinal: number): CombatSettlementPlanV1 {
  const { encounter, opportunity } = encounterFixture(kind);
  const genome = makeGenome(42, 'fauna', 0.5);
  genome.fed = 200;
  genome.brood = 200;
  genome.xp = 486;
  const champion = Object.freeze({
    kind: 'owned-fauna' as const,
    creatureId: `guardian-champion-capture-${kind}`,
    name: 'Capture fixture champion',
    genome,
    legacyBredLineage: true,
  });
  const transcript = runDuel(
    { name: champion.name, genome },
    { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
  );
  if (transcript.winner !== 'A') throw new Error(`${kind} capture fixture no longer wins`);
  const plan = planCombatSettlementV1({
    battleId: `guardian-champion-capture-${kind}-${ordinal}`,
    receiptOrdinal: ordinal,
    encounter,
    champion,
    transcript,
    outcome: 'champion-win',
    worldTier: opportunity.effectiveTier,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: encounter.identity.claimedSignatureIds,
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (plan.status !== 'planned') throw new Error(`capture fixture refused ${plan.reason}`);
  return plan;
}

function emptyOwnershipV2(): OwnershipStateV2 {
  return migrateOwnershipStateV1ToV2(createEmptyOwnershipStateV1());
}

function capturedCarrier(): Readonly<{
  state: GuardianAcquisitionStateV1;
  guardian: GuardianAcquisitionEntryV1;
  titan: GuardianAcquisitionEntryV1;
  extensions: V5Extensions;
}> {
  const ownership = emptyOwnershipV2();
  const guardian = prepareGuardianAcquisitionV1({
    parent: createEmptyGuardianAcquisitionStateV1(),
    ownership,
    plan: capturePlan('guardian', 41),
  });
  if (guardian.kind !== 'prepared') throw new Error(`Guardian fixture failed: ${guardian.kind}`);
  const titan = prepareGuardianAcquisitionV1({
    parent: guardian.successor,
    ownership,
    plan: capturePlan('titan', 43),
  });
  if (titan.kind !== 'prepared') throw new Error(`Titan fixture failed: ${titan.kind}`);
  return Object.freeze({
    state: titan.successor,
    guardian: guardian.entry,
    titan: titan.entry,
    extensions: applyV5ExtensionWrites({}, [
      guardianAcquisitionCarrierWriteV1(titan.successor),
    ]).extensions,
  });
}

function actionTarget(): Readonly<{
  encounter: GuardianPrimeEncounterV1;
  opportunity: WorldOpportunitySnapshot;
}> {
  const resolved = resolveCF1WorldAddress({
    galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
    star: { seed: 4077594722, x: -271.54, y: -67.36 },
    planet: { seed: 488332735 },
  });
  if (!resolved.ok) throw new Error(`action target failed: ${resolved.reason}`);
  const opportunity = projectWorldOpportunity(resolved.address);
  const encounter = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: opportunity.source.planetType },
    regionIndex: 0,
    faunaRoster: [{ speciesId: 'guardian-champion-target', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: [],
    conquered: false,
  });
  if (encounter === null || encounter.defender.kind !== 'fauna') {
    throw new Error('action target encounter drifted');
  }
  return Object.freeze({ encounter, opportunity });
}

function saveState(): SaveStateV2 {
  return {
    explorerName: 'Explorer',
    hp: 100,
    HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 },
    chacc: [],
    equip: {},
    equipAff: {},
    xpFirsts: [],
    xpFirstsBinding: null,
  } as unknown as SaveStateV2;
}

function projectedRoster(
  ownershipV2: OwnershipStateV2,
  extensions: V5Extensions,
): Arc6CombatChampionRosterV1 {
  const roster = projectArc6CombatChampionRosterV1({ ownershipV2, extensions });
  if (roster.kind !== 'projected') throw new Error(`roster protected: ${roster.reason}`);
  return roster;
}

function companionOverlay(rows: readonly Record<string, unknown>[]): V5Extensions {
  const state = decodeGuardianCompanionStateV1(canonicalJson({
    schema: GUARDIAN_COMPANION_STATE_SCHEMA_V1,
    version: GUARDIAN_COMPANION_STATE_VERSION_V1,
    revision: rows.length,
    rows,
  }));
  return applyV5ExtensionWrites({}, [guardianCompanionCarrierWriteV1(state)]).extensions;
}

function collisionOwnership(entry: GuardianAcquisitionEntryV1): OwnershipStateV2 {
  const identity = canonicalGenomeIdentityV1(makeGenome(1777, 'fauna', 0.5));
  const recordId = ownershipContentId(
    'discovery',
    'guardian-champion-cross-authority-collision',
  ) as DiscoveryRecordId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    legacyCodexId: `s${identity.genome.seed}`,
    legacySourceIndex: 0,
    from: 'Collision fixture',
    legacyLocation: null,
    firstForSpecies: true,
  });
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: recordId,
    })],
    discoveries: [discovery],
    creatures: [createCreatureInstanceV1({
      creatureId: entry.creature.creatureId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'legacy',
      acquisitionRecordId: recordId,
      lineage: { kind: 'none', generation: 0 },
      xp: 0,
      hurt: 0,
      fed: 0,
      brood: 0,
      assignment: null,
      bond: null,
    })],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  }));
}

describe('Arc 6 captured Guardian champion admission', () => {
  it('adds live Guardians and Titans to the exact card roster with permanent-loss stakes', () => {
    const captured = capturedCarrier();
    const ownership = emptyOwnershipV2();
    const roster = projectedRoster(ownership, captured.extensions);
    expect(roster.champions.map((row) => [row.source, row.creature.creatureId])).toEqual([
      ['guardian', captured.guardian.creature.creatureId],
      ['guardian', captured.titan.creature.creatureId],
    ]);
    const champion = projectArc6CombatChampionV1({
      state: saveState(),
      ownershipV2: ownership,
      guardianRoster: roster,
      championId: captured.guardian.creature.creatureId,
    });
    expect(champion).toMatchObject({
      kind: 'owned-fauna',
      creatureId: captured.guardian.creature.creatureId,
      legacyBredLineage: false,
    });
    expect(projectArc6CombatChampionAvailabilityV1({
      ownershipV2: ownership,
      guardianRoster: roster,
      championId: captured.guardian.creature.creatureId,
      observedActivePlayMs: 12_345,
    })).toEqual({ kind: 'available', activePlayMs: 12_345 });

    const { encounter } = actionTarget();
    const card = projectCombatCardReadModelV1({
      contextKey: 'arc6:guardian-champion-card',
      encounter,
      state: saveState(),
      ownershipV2: ownership,
      championRoster: roster,
      observedActivePlayMs: 12_345,
      selectedChampionId: captured.guardian.creature.creatureId,
      unavailableReason: null,
    });
    expect(card?.championOptions).toHaveLength(3);
    expect(card?.selectedChampionId).toBe(captured.guardian.creature.creatureId);
    expect(card?.championOptions.find((row) => (
      row.id === captured.guardian.creature.creatureId
    ))).toMatchObject({ kind: 'owned-fauna', disabled: false, disabledReason: null });
    expect(card?.stakes).toBe(
      'Defeat: this wild or unbred champion is permanently lost.',
    );
  });

  it('plans a Guardian as existing owned-fauna through Guardian loss-XP authority and the writer seam', async () => {
    const captured = capturedCarrier();
    const ownership = emptyOwnershipV2();
    const extensions = prepareF4AuthorityUpdate(
      captured.extensions,
      { activePlayMs: 12_345 },
      createSessionRNG(0xace5eed).state(),
    ).extensions;
    const roster = projectedRoster(ownership, extensions);
    const target = actionTarget();
    let writerCalls = 0;
    const writerWitness: { plan: CombatSettlementPlanV1 | null } = { plan: null };
    const outcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement(input) {
          writerCalls++;
          writerWitness.plan = input.plan;
          return Object.freeze({ kind: 'lease-unavailable' as const });
        },
      }),
      state: saveState(),
      extensions,
      encounter: target.encounter,
      opportunity: target.opportunity,
      ownershipV2: ownership,
      championId: captured.guardian.creature.creatureId,
      championRosterAuthorityKey: roster.authorityKey,
      observedActivePlayMs: 12_345,
      codecNow: 1_753_900_060_000,
    });
    expect(writerCalls).toBe(1);
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'lease-unavailable',
    });
    const plan = writerWitness.plan;
    expect(plan?.champion).toMatchObject({
      kind: 'owned-fauna',
      creatureId: captured.guardian.creature.creatureId,
      legacyBredLineage: false,
    });
    expect(plan?.authority.claimedPrimeSignatureIds)
      .toEqual(target.encounter.identity.claimedSignatureIds);
    expect(plan?.authority.lossXp).toEqual({ kind: 'known-target', awardedTarget: 0 });
  });

  it('omits tombstones and protects corrupt carriers, detached overlays, and Arc5 ID collisions', async () => {
    const captured = capturedCarrier();
    const ownership = emptyOwnershipV2();
    const tombstoneOnly = companionOverlay([{
      kind: 'tombstone',
      sourceRecordId: captured.guardian.acquisition.recordId,
      tombstone: {
        kind: 'creature',
        creatureId: captured.guardian.creature.creatureId,
        snapshot: captured.guardian.creature,
        disposition: {
          ordinal: 55,
          actionKind: 'combat-settlement',
          witnessDigest: 'a'.repeat(64),
        },
      },
    }]);
    const tombstonedExtensions = applyV5ExtensionWrites(captured.extensions, [{
      segment: 'creatures',
      namespace: GUARDIAN_COMPANION_NAMESPACE_V1,
      carrier: tombstoneOnly.creatures![GUARDIAN_COMPANION_NAMESPACE_V1]!,
    }]).extensions;
    const tombstoned = projectedRoster(ownership, tombstonedExtensions);
    expect(tombstoned.champions.some((row) => (
      row.creature.creatureId === captured.guardian.creature.creatureId
    ))).toBe(false);
    expect(tombstoned.champions.some((row) => (
      row.creature.creatureId === captured.titan.creature.creatureId
    ))).toBe(true);

    const corrupt: V5Extensions = {
      creatures: {
        [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 1, json: '{}' },
      },
    };
    expect(projectArc6CombatChampionRosterV1({ ownershipV2: ownership, extensions: corrupt }))
      .toEqual({ kind: 'protected', reason: 'guardian-acquisition-corrupt' });
    let writerCalls = 0;
    const target = actionTarget();
    const corruptOutcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement() {
          writerCalls++;
          throw new Error('protected Guardian authority must not reach the writer');
        },
      }),
      state: saveState(),
      extensions: corrupt,
      encounter: target.encounter,
      opportunity: target.opportunity,
      ownershipV2: ownership,
      championId: captured.guardian.creature.creatureId,
      championRosterAuthorityKey: tombstoned.authorityKey,
      observedActivePlayMs: 12_345,
      codecNow: 1_753_900_060_000,
    });
    expect(corruptOutcome).toMatchObject({
      kind: 'refused', detail: 'champion-roster:guardian-acquisition-corrupt',
    });
    expect(writerCalls).toBe(0);

    const current = projectedRoster(ownership, captured.extensions);
    const staleOutcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement() {
          writerCalls++;
          throw new Error('stale Guardian authority must not reach the writer');
        },
      }),
      state: saveState(),
      extensions: captured.extensions,
      encounter: target.encounter,
      opportunity: target.opportunity,
      ownershipV2: ownership,
      championId: captured.guardian.creature.creatureId,
      championRosterAuthorityKey: `${current.authorityKey}:stale`,
      observedActivePlayMs: 12_345,
      codecNow: 1_753_900_060_000,
    });
    expect(staleOutcome).toMatchObject({
      kind: 'refused', detail: 'champion-roster:stale-or-forged',
    });
    expect(writerCalls).toBe(0);

    const detachedRecordId = ownershipContentId(
      'discovery',
      'guardian-champion-detached-overlay',
    ) as DiscoveryRecordId;
    const detached = companionOverlay([{
      kind: 'live',
      sourceRecordId: detachedRecordId,
      creature: {
        ...captured.guardian.creature,
        acquisitionRecordId: detachedRecordId,
      },
      lastReceipt: {
        ordinal: 57,
        actionKind: 'combat-settlement',
        witnessDigest: 'b'.repeat(64),
      },
    }]);
    const detachedExtensions = applyV5ExtensionWrites(captured.extensions, [{
      segment: 'creatures',
      namespace: GUARDIAN_COMPANION_NAMESPACE_V1,
      carrier: detached.creatures![GUARDIAN_COMPANION_NAMESPACE_V1]!,
    }]).extensions;
    expect(projectArc6CombatChampionRosterV1({
      ownershipV2: ownership,
      extensions: detachedExtensions,
    })).toEqual({ kind: 'protected', reason: 'guardian-projection-source-row-mismatch' });

    expect(projectArc6CombatChampionRosterV1({
      ownershipV2: collisionOwnership(captured.guardian),
      extensions: captured.extensions,
    })).toEqual({ kind: 'protected', reason: 'arc5-guardian-id-collision' });
  });
});
