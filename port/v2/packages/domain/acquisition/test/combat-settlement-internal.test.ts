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
import { prepareArc6CombatOwnershipV1, prepareArc6PartyOwnershipV1 } from '@cf/domain-acquisition/combat-settlement-internal';
import {
  COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  COMBAT_DEFEAT_WOUND_STEP_V1,
  planCombatPartySettlementV1,
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

describe('§20 party ownership (S2b step 2): one Arc 5 successor for a whole party', () => {
  function partyFixture(seeds: readonly number[], assignments: readonly ({ kind: 'recovery'; readyAtActivePlayMs: number } | null)[] = []) {
    const rows = seeds.map((seed, index) => {
      const genome = makeGenome(seed, 'fauna', 0.15);
      genome.xp = 0; genome.hurt = 0;
      const identity = canonicalGenomeIdentityV1(genome);
      const recordId = ownershipContentId('discovery', `party-${seed}`) as DiscoveryRecordId;
      const creatureId = ownershipContentId('creature', `party-${seed}`) as CreatureInstanceId;
      return { genome, identity, recordId, creatureId, assignment: assignments[index] ?? null };
    });
    const source = createInitialOwnershipStateV1({
      catalogSpecies: rows.filter((r, i) => rows.findIndex((o) => o.identity.speciesId === r.identity.speciesId) === i)
        .map((r) => createCatalogSpeciesV1({ identity: r.identity, alias: null, firstObservationId: r.recordId })),
      discoveries: rows.map((r, i) => createLegacyDiscoveryRecordV1({ recordId: r.recordId, speciesId: r.identity.speciesId, legacyCodexId: `s${seeds[i]}`,
        legacySourceIndex: i, from: 'Fixture wild', legacyLocation: null, firstForSpecies: true })),
      creatures: rows.map((r) => createCreatureInstanceV1({ creatureId: r.creatureId, speciesId: r.identity.speciesId, genomeIdentity: r.identity.genomeIdentity,
        genome: r.identity.genome, nickname: null, origin: 'legacy', acquisitionRecordId: r.recordId, lineage: { kind: 'none', generation: 0 },
        xp: 0, hurt: 0, fed: null, brood: null, assignment: r.assignment, bond: null })),
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    });
    const ownership = migrateOwnershipStateV1ToV2(source);
    const party = rows.map((r, i) => ({ champion: { kind: 'owned-fauna' as const, creatureId: r.creatureId, name: `P${i}`, genome: r.genome, legacyBredLineage: false }, stance: 'balanced' as const }));
    const plan = planCombatPartySettlementV1({ battleId: `party-${seeds.join('-')}`, receiptOrdinal: 3, encounter, worldTier: 4, mode: 'auto', party,
      authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: 40_000 } });
    return { ownership, plan, rows };
  }
  function findMulti() {
    for (let base = 3; base < 400; base += 3) {
      const f = partyFixture([base, base + 1000, base + 2000]);
      if (f.plan.status === 'planned' && f.plan.party && f.plan.party.members.some((m) => m.injury?.status === 'set-recovery')) return f;
    }
    throw new Error('no multi-leg party fixture');
  }

  it('the decisive champion and every fallen member settle in ONE successor (revision +1); others are untouched', () => {
    const f = findMulti();
    if (f.plan.status !== 'planned' || !f.plan.party) throw new Error('fixture');
    const prepared = prepareArc6PartyOwnershipV1(f.ownership, f.plan);
    if (prepared.kind !== 'prepared') throw new Error(JSON.stringify(prepared));
    expect(prepared.settlement.successor.revision).toBe(f.ownership.revision + 1);
    const recovered = f.plan.party.members.filter((m) => m.injury?.status === 'set-recovery');
    expect(prepared.settlement.members.map((c) => c.creatureAfter.creatureId).sort())
      .toEqual(recovered.map((m) => (m.champion as { creatureId: string }).creatureId).sort());
    for (const change of prepared.settlement.members) {
      expect(change.creatureAfter.assignment).toEqual({ kind: 'recovery', readyAtActivePlayMs: 40_000 + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 });
      expect(change.creatureAfter.hurt).toBe(change.creatureBefore.hurt);   // §20: no wound
    }
    expect(prepared.settlement.champion?.creatureAfter.creatureId).toBe((f.plan.champion as { creatureId: string }).creatureId);
    const untouched = f.plan.party.members.filter((m) => m.legEnd === 'not-fought').map((m) => (m.champion as { creatureId: string }).creatureId);
    for (const id of untouched) expect(prepared.settlement.successor.creatures.find((r) => r.creatureId === id)?.assignment).toBeNull();
    expect(f.ownership.creatures.every((r) => r.assignment === null)).toBe(true);   // the parent is never mutated
  });

  it('a member still in an unfinished Recovery refuses the whole party settlement; a finished one is replaced', () => {
    const probe = findMulti();
    if (probe.plan.status !== 'planned' || !probe.plan.party) throw new Error('fixture');
    const recoveredIndex = probe.plan.party.members.findIndex((m) => m.injury?.status === 'set-recovery');
    const seeds = probe.rows.map((r) => r.genome.seed);
    const busyAssignments = seeds.map((_, i) => (i === recoveredIndex ? { kind: 'recovery' as const, readyAtActivePlayMs: 40_001 } : null));
    const busy = partyFixture(seeds, busyAssignments);
    if (busy.plan.status !== 'planned') throw new Error('busy fixture');
    expect(prepareArc6PartyOwnershipV1(busy.ownership, busy.plan)).toEqual({ kind: 'refused', reason: 'settlement-shape-mismatch' });
    const finished = partyFixture(seeds, seeds.map((_, i) => (i === recoveredIndex ? { kind: 'recovery' as const, readyAtActivePlayMs: 40_000 } : null)));
    if (finished.plan.status !== 'planned') throw new Error('finished fixture');
    expect(prepareArc6PartyOwnershipV1(finished.ownership, finished.plan).kind).toBe('prepared');
  });

  it('refuses a single-champion plan (it has no party block) and is not-applicable when no member lives in Arc 5', () => {
    const { ownership, plan } = fixture('-single');
    expect(prepareArc6PartyOwnershipV1(ownership, plan)).toEqual({ kind: 'refused', reason: 'plan-unregistered' });
    const f = findMulti();
    if (f.plan.status !== 'planned') throw new Error('fixture');
    const empty = migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({ catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null }));
    expect(prepareArc6PartyOwnershipV1(empty, f.plan)).toEqual({ kind: 'not-applicable', reason: 'no-arc5-party-member' });
  });
});

