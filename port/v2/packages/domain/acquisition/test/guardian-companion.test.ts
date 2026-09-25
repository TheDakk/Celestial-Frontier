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
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  createInitialOwnershipStateV1,
  migrateOwnershipStateV1ToV2,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
} from '@cf/domain-acquisition';
import {
  createEmptyGuardianAcquisitionStateV1,
  decodeGuardianAcquisitionStateV1,
  encodeGuardianAcquisitionStateV1,
  prepareGuardianAcquisitionV1,
  type GuardianAcquisitionStateV1,
} from '../src/guardian-acquisition.js';
import {
  createEmptyGuardianCompanionStateV1,
  decodeGuardianCompanionStateV1,
  encodeGuardianCompanionStateV1,
  guardianCompanionStateDigestV1,
  prepareGuardianCompanionCombatV1,
  projectGuardianCompanionsV1,
} from '../src/guardian-companion.js';

beforeAll(() => installCaptureHooks());

const GUARDIAN_INPUT = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
  planet: Object.freeze({ seed: 2456455053 }),
});
const ORDINARY_INPUT = Object.freeze({
  galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
  star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
  planet: Object.freeze({ seed: 488332735 }),
});

function emptyOwnership() {
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  }));
}

function guardianEncounter(): GuardianPrimeEncounterV1 {
  const resolved = resolveCF1WorldAddress(GUARDIAN_INPUT);
  if (!resolved.ok) throw new Error(resolved.reason);
  const encounter = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: 'airless' },
    regionIndex: 0,
    faunaRoster: [{ speciesId: 'guardian-companion-native', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
    conquered: false,
  });
  if (encounter === null || encounter.defender.kind !== 'guardian') {
    throw new Error('Guardian companion capture fixture drifted');
  }
  return encounter;
}

function capturedSource(): GuardianAcquisitionStateV1 {
  const encounter = guardianEncounter();
  const genome = makeGenome(42, 'fauna', 0.5);
  genome.fed = 200;
  genome.brood = 200;
  genome.xp = 486;
  const champion = Object.freeze({
    kind: 'owned-fauna' as const,
    creatureId: 'guardian-capture-fixture',
    name: 'Capture fixture',
    genome,
    legacyBredLineage: true,
  });
  const transcript = runDuel(
    { name: champion.name, genome },
    { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
  );
  if (transcript.winner !== 'A') throw new Error('capture fixture no longer wins');
  const plan = planCombatSettlementV1({
    battleId: 'guardian-companion-capture',
    receiptOrdinal: 31,
    encounter,
    champion,
    transcript,
    outcome: 'champion-win',
    worldTier: 4,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: PRIME_SIGNATURE_IDS_V1,
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (plan.status !== 'planned') throw new Error(plan.reason);
  const prepared = prepareGuardianAcquisitionV1({
    parent: createEmptyGuardianAcquisitionStateV1(),
    ownership: emptyOwnership(),
    plan,
  });
  if (prepared.kind !== 'prepared') throw new Error(`capture refused ${prepared.reason}`);
  return prepared.successor;
}

function ordinaryEncounter(defender: Genome): GuardianPrimeEncounterV1 {
  const resolved = resolveCF1WorldAddress(ORDINARY_INPUT);
  if (!resolved.ok) throw new Error(resolved.reason);
  const encounter = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: 'airless' },
    regionIndex: 0,
    faunaRoster: [{ speciesId: `guardian-companion-target-${defender.seed}`, genome: defender }],
    claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
    conquered: false,
  });
  if (encounter === null || encounter.defender.kind !== 'fauna') {
    throw new Error('Guardian companion target fixture drifted');
  }
  return encounter;
}

function combatPlan(
  source: GuardianAcquisitionStateV1,
  desired: 'champion-win' | 'defender-win',
  ordinal: number,
): CombatSettlementPlanV1 {
  const creature = source.entries[0]!.creature;
  const championGenome = { ...creature.genome } as Genome;
  if (creature.xp !== null) championGenome.xp = creature.xp;
  if (creature.hurt !== null) championGenome.hurt = creature.hurt;
  const champion = Object.freeze({
    kind: 'owned-fauna' as const,
    creatureId: creature.creatureId,
    name: 'Captured Guardian',
    genome: championGenome,
    legacyBredLineage: false,
  });
  for (let seed = 1; seed <= 2_000; seed++) {
    const defender = makeGenome(seed, 'fauna', desired === 'champion-win' ? 0.15 : 0.95);
    if (desired === 'champion-win') defender.hurt = 0.85;
    else {
      defender.xp = 486;
      defender.fed = 200;
      defender.brood = 200;
    }
    const encounter = ordinaryEncounter(defender);
    const transcript = runDuel(
      { name: champion.name, genome: champion.genome },
      { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
    );
    const outcome = transcript.winner === 'A' ? 'champion-win'
      : transcript.winner === 'B' ? 'defender-win' : 'draw';
    if (outcome !== desired) continue;
    const planned = planCombatSettlementV1({
      battleId: `guardian-companion-${desired}-${ordinal}`,
      receiptOrdinal: ordinal,
      encounter,
      champion,
      transcript,
      outcome,
      worldTier: 4,
      authority: {
        worldConquered: false,
        claimedPrimeSignatureIds: PRIME_SIGNATURE_IDS_V1,
        lossXp: { kind: 'known-target', awardedTarget: 0 },
      },
    });
    if (planned.status === 'planned') return planned;
  }
  throw new Error(`could not find deterministic ${desired} fixture`);
}

describe('captured Guardian companion overlay', () => {
  it('projects absence as every exact acquisition creature live', () => {
    const source = capturedSource();
    const overlay = createEmptyGuardianCompanionStateV1();
    const projected = projectGuardianCompanionsV1({ source, overlay });
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.creatures).toEqual([source.entries[0]!.creature]);
    expect(projected.tombstones).toEqual([]);
    expect(projected.sourceRevision).toBe(1);
    expect(projected.overlayRevision).toBe(0);
  });

  it('persists a registered XP/injury successor and exact encode/decode fixed point', () => {
    const source = capturedSource();
    const plan = combatPlan(source, 'champion-win', 41);
    const prepared = prepareGuardianCompanionCombatV1({
      source, parent: createEmptyGuardianCompanionStateV1(), plan,
    });
    if (prepared.kind === 'refused') throw new Error(prepared.reason);
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.settlement.creatureAfter?.xp).toBeGreaterThan(0);
    expect(prepared.settlement.creatureTombstone).toBeNull();
    const encoded = encodeGuardianCompanionStateV1(prepared.settlement.successor);
    const reloaded = decodeGuardianCompanionStateV1(encoded);
    expect(encodeGuardianCompanionStateV1(reloaded)).toBe(encoded);
    expect(guardianCompanionStateDigestV1(reloaded))
      .toBe(prepared.settlement.successorDigest);
    const projected = projectGuardianCompanionsV1({
      source: decodeGuardianAcquisitionStateV1(
        encodeGuardianAcquisitionStateV1(source),
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ),
      overlay: reloaded,
    });
    expect(projected.kind).toBe('projected');
    if (projected.kind === 'projected') {
      expect(projected.creatures[0]).toEqual(prepared.settlement.creatureAfter);
    }
  });

  it('§20: a defeated captured Guardian is KEPT — wounded and in active-play Recovery, no tombstone; its overlay round-trips', () => {
    const source = capturedSource();
    const plan = combatPlan(source, 'defender-win', 43);
    expect(plan.injury).toMatchObject({ status: 'set-recovery', reason: 'defeat-recovery' });
    const prepared = prepareGuardianCompanionCombatV1({
      source, parent: createEmptyGuardianCompanionStateV1(), plan,
    });
    if (prepared.kind === 'refused') throw new Error(prepared.reason);
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.settlement.creatureTombstone).toBeNull();
    expect(prepared.settlement.creatureAfter).toMatchObject({
      creatureId: source.entries[0]!.creature.creatureId, assignment: { kind: 'recovery' },
    });
    const projected = projectGuardianCompanionsV1({ source, overlay: prepared.settlement.successor });
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.creatures.map((row) => row.creatureId)).toEqual([source.entries[0]!.creature.creatureId]);
    expect(projected.tombstones).toHaveLength(0);
    // the saved overlay keeps the Recovery through its own codec
    const reread = decodeGuardianCompanionStateV1(encodeGuardianCompanionStateV1(prepared.settlement.successor));
    expect(JSON.stringify(reread)).toContain('"recovery"');
  });

  it('rejects cloned plans/states and protects overlay rows detached from their source', () => {
    const source = capturedSource();
    const plan = combatPlan(source, 'champion-win', 47);
    const empty = createEmptyGuardianCompanionStateV1();
    expect(prepareGuardianCompanionCombatV1({ source, parent: empty, plan: { ...plan } }))
      .toEqual({ kind: 'refused', reason: 'plan-unregistered' });
    expect(prepareGuardianCompanionCombatV1({ source, parent: { ...empty }, plan }))
      .toEqual({ kind: 'refused', reason: 'overlay-unregistered' });
    const prepared = prepareGuardianCompanionCombatV1({ source, parent: empty, plan });
    if (prepared.kind !== 'prepared') throw new Error('mutation fixture refused');
    const unrelated = createEmptyGuardianAcquisitionStateV1();
    expect(projectGuardianCompanionsV1({
      source: unrelated, overlay: prepared.settlement.successor,
    })).toEqual({ kind: 'protected', reason: 'source-row-missing' });

    const mirror = JSON.parse(
      encodeGuardianCompanionStateV1(prepared.settlement.successor),
    ) as { rows: Array<{ creature: { genome: { seed: number } } }> };
    mirror.rows[0]!.creature.genome.seed += 1;
    expect(() => decodeGuardianCompanionStateV1(JSON.stringify(mirror))).toThrow();
  });
});
