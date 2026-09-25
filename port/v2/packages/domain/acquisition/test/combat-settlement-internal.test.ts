import { describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '@cf/domain-acquisition';
import { prepareArc6CombatOwnershipV1 } from '@cf/domain-acquisition/combat-settlement-internal';
import {
  COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  COMBAT_DEFEAT_WOUND_STEP_V1,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
} from '@cf/domain-combatcore';

installCaptureHooks();

const resolved = resolveCF1WorldAddress({
  galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
  star: { seed: 4077594722, x: -271.54, y: -67.36 },
  planet: { seed: 488332735 },
});
if (!resolved.ok) throw new Error(resolved.reason);
const defenderGenome = makeGenome(999, 'fauna', 0.5);
const projectedEncounter = projectGuardianPrimeEncounterV1({
  world: resolved.address,
  descriptor: { worldType: 'airless' },
  regionIndex: 0,
  faunaRoster: [{ speciesId: 'defender', genome: defenderGenome }],
  claimedSignatureIds: [],
  conquered: false,
});
if (!projectedEncounter) throw new Error('encounter fixture missing');
const encounter = projectedEncounter;

function fixture(suffix = '', bred = true, assignment: { readonly kind: 'recovery'; readonly readyAtActivePlayMs: number } | null = null) {
  const genome = makeGenome(2, 'fauna', 0.5);
  if (bred) {
    genome.gen = 1;
    genome.parents = [101, 202];
  }
  genome.xp = 0;
  genome.hurt = 0;
  const identity = canonicalGenomeIdentityV1(genome);
  const recordId = ownershipContentId('discovery', `combat-internal${suffix}`) as DiscoveryRecordId;
  const creatureId = ownershipContentId('creature', `combat-internal${suffix}`) as CreatureInstanceId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId, speciesId: identity.speciesId, legacyCodexId: 's2', legacySourceIndex: 0,
    from: bred ? 'Fixture (bred)' : 'Fixture wild', legacyLocation: null, firstForSpecies: true,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity, alias: null, firstObservationId: recordId,
    })],
    discoveries: [discovery],
    creatures: [createCreatureInstanceV1({
      creatureId, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
      genome: identity.genome, nickname: null, origin: 'legacy', acquisitionRecordId: recordId,
      lineage: bred
        ? { kind: 'legacy-parent-seeds', generation: 1, parentSeeds: [101, 202] }
        : { kind: 'none', generation: 0 },
      xp: 0, hurt: 0, fed: null, brood: null, assignment, bond: null,
    })],
    specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: creatureId,
  });
  const ownership = migrateOwnershipStateV1ToV2(source);
  const champion = {
    kind: 'owned-fauna' as const,
    creatureId,
    name: 'Champion 2',
    genome,
    legacyBredLineage: bred,
  };
  const transcript = runDuel(
    { name: champion.name, genome },
    { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
  );
  const outcome = transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
  const plan = planCombatSettlementV1({
    battleId: 'combat-internal', receiptOrdinal: 0, encounter, champion, transcript, outcome,
    worldTier: 4,
    authority: {
      worldConquered: false, claimedPrimeSignatureIds: [],
      lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: 90_000,
    },
  });
  if (plan.status !== 'planned') throw new Error(plan.reason);
  return { ownership, plan, creatureId };
}

describe('Arc 6 internal ownership combat bridge', () => {
  it('mints one combined XP/injury successor and keeps the parent untouched', () => {
    const { ownership, plan, creatureId } = fixture();
    const prepared = prepareArc6CombatOwnershipV1(ownership, plan);
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.settlement.parentRevision).toBe(0);
    expect(prepared.settlement.successor.revision).toBe(1);
    expect(prepared.settlement.successor.scoutCreatureId).toBe(creatureId);
    // §20: the bred loser is wounded and enters active-play Recovery (it used to crawl home Critical at 0.85)
    expect(prepared.settlement.successor.creatures[0]).toMatchObject({
      xp: 3, hurt: COMBAT_DEFEAT_WOUND_STEP_V1,
      assignment: { kind: 'recovery', readyAtActivePlayMs: 90_000 + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 },
    });
    expect(ownership.creatures[0]).toMatchObject({ xp: 0, hurt: 0, assignment: null });
  });

  it('rejects a cloned plan and a source-mismatched champion before minting a successor', () => {
    const { ownership, plan } = fixture();
    expect(prepareArc6CombatOwnershipV1(ownership, { ...plan })).toEqual({
      kind: 'refused', reason: 'plan-unregistered',
    });
    const other = fixture('-other');
    expect(prepareArc6CombatOwnershipV1(other.ownership, plan)).toEqual({
      kind: 'refused', reason: 'champion-not-found',
    });
  });

  it('§20: an unbred (wild) loser is KEPT — wounded, in Recovery, still the Scout, no tombstone (v1 removed it permanently)', () => {
    const { ownership, plan, creatureId } = fixture('-fatal', false);
    expect(plan.injury).toMatchObject({ status: 'set-recovery', reason: 'defeat-recovery', creatureId });
    const prepared = prepareArc6CombatOwnershipV1(ownership, plan);
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.settlement.creatureAfter).toMatchObject({ creatureId, assignment: { kind: 'recovery' } });
    expect(prepared.settlement.creatureTombstone).toBeNull();
    expect(prepared.settlement.successor.creatures.map((row) => row.creatureId)).toEqual([creatureId]);
    expect(prepared.settlement.successor.creatureTombstones).toHaveLength(0);
    expect(prepared.settlement.successor.scoutCreatureId).toBe(creatureId);
  });

  it('a defeat may replace only a FINISHED Recovery; an unfinished one refuses (Recovery never stacks)', () => {
    // the settlement clock is 90,000 ms of active play (fixture authority)
    const finished = fixture('-stale', false, { kind: 'recovery', readyAtActivePlayMs: 90_000 });
    const replaced = prepareArc6CombatOwnershipV1(finished.ownership, finished.plan);
    expect(replaced.kind).toBe('prepared');
    if (replaced.kind === 'prepared') {
      expect(replaced.settlement.creatureAfter?.assignment).toEqual({ kind: 'recovery', readyAtActivePlayMs: 90_000 + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 });
    }
    const busy = fixture('-busy', false, { kind: 'recovery', readyAtActivePlayMs: 90_001 });
    expect(prepareArc6CombatOwnershipV1(busy.ownership, busy.plan)).toEqual({ kind: 'refused', reason: 'settlement-shape-mismatch' });
  });
});
