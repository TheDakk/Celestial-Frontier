import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import {
  PRIME_SIGNATURE_IDS_V1,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementPlanV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  createEmptyGuardianAcquisitionStateV1,
  decodeGuardianAcquisitionStateV1,
  encodeGuardianAcquisitionStateV1,
  guardianAcquisitionStateDigestV1,
  isGuardianAcquisitionStateV1,
  prepareGuardianAcquisitionV1,
} from '../src/guardian-acquisition.js';

beforeAll(() => installCaptureHooks());

const CANDIDATES = Object.freeze({
  titan: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 2481585519 }),
  }),
  guardian: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
    planet: Object.freeze({ seed: 2456455053 }),
  }),
} as const);

function encounter(kind: 'guardian' | 'titan'): GuardianPrimeEncounterV1 {
  const resolved = resolveCF1WorldAddress(CANDIDATES[kind]);
  if (!resolved.ok) throw new Error(`${kind} acquisition world failed: ${resolved.reason}`);
  const projected = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: kind === 'titan' ? 'lava' : 'airless' },
    regionIndex: 0,
    faunaRoster: kind === 'titan'
      ? []
      : [{ speciesId: 'guardian-acquisition-native', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: kind === 'titan' ? [] : PRIME_SIGNATURE_IDS_V1,
    conquered: false,
  });
  if (projected === null || projected.defender.kind !== kind) {
    throw new Error(`${kind} acquisition encounter drifted`);
  }
  return projected;
}

function plan(kind: 'guardian' | 'titan', ordinal = kind === 'titan' ? 31 : 33): CombatSettlementPlanV1 {
  const target = encounter(kind);
  const championGenome = makeGenome(42, 'fauna', 0.5);
  championGenome.fed = 200;
  championGenome.brood = 200;
  championGenome.xp = 486;
  const champion = {
    kind: 'owned-fauna' as const,
    creatureId: `guardian-champion-${kind}`,
    name: 'Guardian champion',
    genome: championGenome,
    legacyBredLineage: true,
  };
  const transcript = runDuel(
    { name: champion.name, genome: champion.genome },
    { name: target.defender.name, genome: target.defender.battleGenome as Genome },
  );
  if (transcript.winner !== 'A') throw new Error(`${kind} champion no longer wins`);
  const planned = planCombatSettlementV1({
    battleId: `guardian-acquisition-${kind}-${ordinal}`,
    receiptOrdinal: ordinal,
    encounter: target,
    champion,
    transcript,
    outcome: 'champion-win',
    worldTier: kind === 'titan' ? 5 : 4,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: kind === 'titan' ? [] : PRIME_SIGNATURE_IDS_V1,
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (planned.status !== 'planned') throw new Error(`capture plan refused ${planned.reason}`);
  return planned;
}

function emptyOwnership(): OwnershipStateV2 {
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  }));
}

function ownershipWithSpecies(capturePlan: CombatSettlementPlanV1): OwnershipStateV2 {
  if (capturePlan.guardianCapture.status !== 'ownership-writer-required') {
    throw new Error('dedup fixture has no capture');
  }
  const identity = canonicalGenomeIdentityV1(capturePlan.guardianCapture.portableGenome);
  const recordId = ownershipContentId('discovery', 'known-Guardian-species') as DiscoveryRecordId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    legacyCodexId: `s${capturePlan.guardianCapture.portableGenome.seed}`,
    legacySourceIndex: 0,
    from: 'Known before conquest',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const creature = createCreatureInstanceV1({
    creatureId: ownershipContentId('creature', 'known-Guardian-species') as CreatureInstanceId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'legacy',
    acquisitionRecordId: recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null, hurt: null, fed: null, brood: null,
    assignment: null, bond: null,
  });
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity, alias: null, firstObservationId: recordId,
    })],
    discoveries: [discovery], creatures: [creature], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  }));
}

describe('Arc 6 Guardian/Titan acquisition carrier', () => {
  it.each(['guardian', 'titan'] as const)(
    'binds one %s capture to species, living creature, world, encounter, and F4 receipt',
    (kind) => {
      const capturePlan = plan(kind);
      const prepared = prepareGuardianAcquisitionV1({
        parent: createEmptyGuardianAcquisitionStateV1(),
        ownership: emptyOwnership(),
        plan: capturePlan,
      });
      expect(prepared.kind).toBe('prepared');
      if (prepared.kind !== 'prepared') return;
      expect(prepared.successor).toMatchObject({ revision: 1 });
      expect(prepared.entry.acquisition).toMatchObject({
        acquisition: 'guardian-conquest', firstForSpecies: true,
        provenance: {
          defenderKind: kind,
          sourceId: capturePlan.encounter.defender.sourceId,
          signatureId: kind === 'titan' ? 'flame' : null,
          worldKey: capturePlan.encounter.identity.world.key,
          receipt: { ordinal: capturePlan.receiptOrdinal, actionKind: 'combat-settlement' },
        },
      });
      expect(prepared.entry.acquisition.provenance.worldAddress)
        .toBe(capturePlan.encounter.identity.world);
      expect(prepared.entry.creature).toMatchObject({
        speciesId: prepared.entry.catalogSpecies.speciesId,
        origin: 'guardian',
        acquisitionRecordId: prepared.entry.acquisition.recordId,
        lineage: { kind: 'none', generation: 0 },
        xp: null, hurt: null, fed: null, brood: null,
      });
      expect(prepared.entry.catalogSpecies.genome).not.toHaveProperty('_mult');
      expect(prepared.entry.catalogSpecies.genome).not.toHaveProperty('_wf');
      if (kind === 'titan') expect(prepared.entry.catalogSpecies.genome._titan).toBe('flame');

      const encoded = encodeGuardianAcquisitionStateV1(prepared.successor);
      const reloaded = decodeGuardianAcquisitionStateV1(
        encoded,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(isGuardianAcquisitionStateV1(reloaded)).toBe(true);
      expect(encodeGuardianAcquisitionStateV1(reloaded)).toBe(encoded);
      expect(guardianAcquisitionStateDigestV1(reloaded)).toBe(prepared.successorDigest);
      expect(reloaded.entries[0]!.acquisition.provenance.worldAddress)
        .not.toBe(prepared.entry.acquisition.provenance.worldAddress);
      expect(reloaded.entries[0]!.acquisition.provenance.worldAddress.key)
        .toBe(prepared.entry.acquisition.provenance.worldAddress.key);
    },
  );

  it('is a deterministic fixed point and preserves exact legacy species deduplication', () => {
    const capturePlan = plan('guardian');
    const first = prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(), ownership: emptyOwnership(), plan: capturePlan,
    });
    const second = prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(), ownership: emptyOwnership(), plan: capturePlan,
    });
    expect(first.kind).toBe('prepared');
    expect(second.kind).toBe('prepared');
    if (first.kind !== 'prepared' || second.kind !== 'prepared') return;
    expect(encodeGuardianAcquisitionStateV1(second.successor))
      .toBe(encodeGuardianAcquisitionStateV1(first.successor));

    expect(prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(),
      ownership: ownershipWithSpecies(capturePlan),
      plan: capturePlan,
    })).toMatchObject({
      kind: 'deduplicated', reason: 'legacy-store-species-deduplication',
      speciesId: first.entry.acquisition.speciesId,
    });
  });

  it('rejects forged authorities, duplicate receipt/source, and world/source mutations', () => {
    const firstPlan = plan('guardian', 41);
    const first = prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(), ownership: emptyOwnership(), plan: firstPlan,
    });
    expect(first.kind).toBe('prepared');
    if (first.kind !== 'prepared') return;
    expect(prepareGuardianAcquisitionV1({
      parent: first.successor, ownership: emptyOwnership(), plan: firstPlan,
    })).toEqual({ kind: 'refused', reason: 'duplicate-receipt' });
    expect(prepareGuardianAcquisitionV1({
      parent: first.successor, ownership: emptyOwnership(), plan: plan('guardian', 43),
    })).toEqual({ kind: 'refused', reason: 'duplicate-source-world' });
    expect(prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(),
      ownership: emptyOwnership(),
      plan: { ...firstPlan },
    })).toEqual({ kind: 'refused', reason: 'plan-unregistered' });
    expect(prepareGuardianAcquisitionV1({
      parent: { ...createEmptyGuardianAcquisitionStateV1() },
      ownership: emptyOwnership(),
      plan: firstPlan,
    })).toEqual({ kind: 'refused', reason: 'state-unregistered' });
    expect(prepareGuardianAcquisitionV1({
      parent: createEmptyGuardianAcquisitionStateV1(),
      ownership: { ...emptyOwnership() },
      plan: firstPlan,
    })).toEqual({ kind: 'refused', reason: 'ownership-unregistered' });

    const encoded = encodeGuardianAcquisitionStateV1(first.successor);
    const mirror = JSON.parse(encoded) as {
      revision: number;
      entries: Array<{ acquisition: { recordId: string; provenance: {
        sourceId: string;
        receipt: { actionKind: string };
        worldAddress: { galaxy: { x: number } };
      } } }>;
    };
    mirror.entries[0]!.acquisition.provenance.worldAddress.galaxy.x += 1;
    expect(() => decodeGuardianAcquisitionStateV1(
      JSON.stringify(mirror), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow();
    mirror.entries[0]!.acquisition.provenance.worldAddress.galaxy.x -= 1;
    mirror.entries[0]!.acquisition.provenance.sourceId += ':forged';
    expect(() => decodeGuardianAcquisitionStateV1(
      JSON.stringify(mirror), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow();

    const wrongRevision = JSON.parse(encoded) as { revision: number };
    wrongRevision.revision += 1;
    expect(() => decodeGuardianAcquisitionStateV1(
      JSON.stringify(wrongRevision), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow(/append-only history/u);

    const wrongReceiptKind = JSON.parse(encoded) as {
      entries: Array<{ acquisition: { provenance: { receipt: { actionKind: string } } } }>;
    };
    wrongReceiptKind.entries[0]!.acquisition.provenance.receipt.actionKind = 'breed';
    expect(() => decodeGuardianAcquisitionStateV1(
      JSON.stringify(wrongReceiptKind), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow(/receipt kind/u);
  });
});
