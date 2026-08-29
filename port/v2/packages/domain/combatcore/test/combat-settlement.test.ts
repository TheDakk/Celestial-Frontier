import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  COMBAT_SETTLEMENT_SCOPE_V1,
  battleStats,
  isCombatSettlementPlanV1,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatLossXpAuthorityV1,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
  type DuelResult,
  type GuardianPrimeEncounterV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';

beforeAll(() => installCaptureHooks());

const CANDIDATES = Object.freeze({
  flame: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
    planet: Object.freeze({ seed: 2481585519 }),
  }),
  guardian: Object.freeze({
    galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
    star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
    planet: Object.freeze({ seed: 2456455053 }),
  }),
  ordinary: Object.freeze({
    galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
    star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
  ordinaryCollision: Object.freeze({
    galaxy: Object.freeze({ seed: 1336287406, x: -2657.91, y: -11817.01 }),
    star: Object.freeze({ seed: 1391422746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
} as const);

type WorldFixture = keyof typeof CANDIDATES;
const ADDRESSES = new Map<WorldFixture, CanonicalCF1WorldAddress>();

function address(fixture: WorldFixture): CanonicalCF1WorldAddress {
  const cached = ADDRESSES.get(fixture);
  if (cached !== undefined) return cached;
  const resolved = resolveCF1WorldAddress(CANDIDATES[fixture]);
  if (!resolved.ok) throw new Error(`failed to resolve ${fixture}: ${resolved.reason}`);
  ADDRESSES.set(fixture, resolved.address);
  return resolved.address;
}

function encounter(options: Readonly<{
  world: WorldFixture;
  worldType: string;
  regionIndex?: number;
  defenderGenome?: Genome;
  claimed?: readonly PrimeSignatureIdV1[];
}>): GuardianPrimeEncounterV1 {
  const projected = projectGuardianPrimeEncounterV1({
    world: address(options.world),
    descriptor: { worldType: options.worldType },
    regionIndex: options.regionIndex ?? 0,
    faunaRoster: options.defenderGenome === undefined
      ? []
      : [{ speciesId: 'native-fixture', genome: options.defenderGenome }],
    claimedSignatureIds: options.claimed ?? [],
    conquered: false,
  });
  if (projected === null) throw new Error('fixture did not project an encounter');
  return projected;
}

function owned(seed: number, options: Readonly<{
  creatureId?: string;
  hurt?: number;
  bred?: boolean;
  strengthen?: boolean;
}> = {}): CombatSettlementChampionV1 {
  const genome = makeGenome(seed, 'fauna', 0.5);
  if (options.hurt !== undefined) genome.hurt = options.hurt;
  if (options.strengthen) {
    genome.brood = 200;
    genome.fed = 200;
    genome.xp = 486;
  }
  return {
    kind: 'owned-fauna',
    creatureId: options.creatureId ?? `creature-${seed}`,
    name: `Champion ${seed}`,
    genome,
    legacyBredLineage: options.bred ?? true,
  };
}

function duel(champion: CombatSettlementChampionV1, target: GuardianPrimeEncounterV1): DuelResult {
  const mine = champion.kind === 'player'
    ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats }
    : { name: champion.name, genome: champion.genome as Genome };
  return runDuel(mine, { name: target.defender.name, genome: target.defender.battleGenome as Genome });
}

function outcome(result: DuelResult): CombatSettlementOutcomeV1 {
  const winner = (result as { winner?: unknown }).winner;
  return winner === 'A' ? 'champion-win' : winner === 'B' ? 'defender-win' : 'draw';
}

function planned(options: Readonly<{
  champion: CombatSettlementChampionV1;
  encounter: GuardianPrimeEncounterV1;
  lossXp?: CombatLossXpAuthorityV1 | null;
  worldTier?: number;
  battleId?: string;
  receiptOrdinal?: number;
  transcript?: DuelResult;
  declaredOutcome?: CombatSettlementOutcomeV1;
  conquered?: boolean;
  claimed?: readonly PrimeSignatureIdV1[];
}>): CombatSettlementPlanV1 {
  const transcript = options.transcript ?? duel(options.champion, options.encounter);
  const result = planCombatSettlementV1({
    battleId: options.battleId ?? 'battle-fixture',
    receiptOrdinal: options.receiptOrdinal ?? 17,
    encounter: options.encounter,
    champion: options.champion,
    transcript,
    outcome: options.declaredOutcome ?? outcome(transcript),
    worldTier: options.worldTier ?? 4,
    authority: {
      worldConquered: options.conquered ?? false,
      claimedPrimeSignatureIds: options.claimed ?? [],
      lossXp: options.champion.kind === 'player'
        ? null
        : (options.lossXp ?? { kind: 'known-target', awardedTarget: 0 }),
    },
  });
  expect(result.status).toBe('planned');
  if (result.status !== 'planned') throw new Error(`settlement refused: ${result.reason}`);
  return result;
}

interface LossFixtures {
  readonly ordinaryLoss: CombatSettlementChampionV1;
  readonly nearBrinkLoss: CombatSettlementChampionV1;
  readonly woundedWin: CombatSettlementChampionV1;
}

function findLossFixtures(target: GuardianPrimeEncounterV1): LossFixtures {
  const ordinaryLoss = owned(2, { creatureId: 'ordered-loss-companion' });
  const nearBrinkLoss = owned(51, { creatureId: 'ordered-loss-companion' });
  const woundedWin = owned(3, { creatureId: 'ordered-loss-companion' });
  const ordinaryResult = duel(ordinaryLoss, target) as {
    winner: 'A' | 'B' | null; hpB: number; maxB: number;
  };
  const brinkResult = duel(nearBrinkLoss, target) as {
    winner: 'A' | 'B' | null; hpB: number; maxB: number;
  };
  const winResult = duel(woundedWin, target) as {
    winner: 'A' | 'B' | null; hpA: number; maxA: number;
  };
  if (ordinaryResult.winner === 'A' || ordinaryResult.hpB / Math.max(1, ordinaryResult.maxB) < 0.3
    || brinkResult.winner === 'A' || brinkResult.hpB / Math.max(1, brinkResult.maxB) >= 0.3
    || winResult.winner !== 'A' || winResult.hpA / winResult.maxA >= 0.55) {
    throw new Error('golden conquest outcome fixtures drifted');
  }
  return { ordinaryLoss, nearBrinkLoss, woundedWin };
}

describe('Arc 6 combat settlement evidence binding', () => {
  it('binds the registered encounter, complete transcript, declared outcome, battle id, and receipt ordinal', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const champion = findLossFixtures(target).ordinaryLoss;
    const transcript = duel(champion, target);
    const first = planned({ champion, encounter: target, transcript });
    const second = planned({ champion, encounter: target, transcript });
    expect(second).toEqual(first);
    expect(second.witness).toBe(first.witness);
    expect(second.receipt).toEqual({ ordinal: 17, kind: 'combat-settlement', witness: second.witness });
    expect(second.witness.length).toBeLessThanOrEqual(4_096);
    expect(Object.isFrozen(second)).toBe(true);
    expect(Object.isFrozen(second.transcript)).toBe(true);
    expect(Object.isFrozen(second.transcript.log)).toBe(true);
    expect(isCombatSettlementPlanV1(second)).toBe(true);
    expect(isCombatSettlementPlanV1({ ...second })).toBe(false);

    const mutatedTranscript = {
      ...(transcript as Record<string, unknown>),
      hpA: ((transcript as { hpA: number }).hpA + 1),
    };
    expect(planCombatSettlementV1({
      battleId: 'battle-fixture', receiptOrdinal: 17, encounter: target, champion,
      transcript: mutatedTranscript, outcome: outcome(transcript), worldTier: 4,
      authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 } },
    })).toEqual({ status: 'refused', reason: 'transcript-mismatch' });
    expect(planCombatSettlementV1({
      battleId: 'battle-fixture', receiptOrdinal: 17,
      encounter: { ...target }, champion, transcript, outcome: outcome(transcript), worldTier: 4,
      authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 } },
    })).toEqual({ status: 'refused', reason: 'encounter-unregistered' });
    expect(planCombatSettlementV1({
      battleId: 'battle-fixture', receiptOrdinal: 17, encounter: target, champion, transcript,
      outcome: outcome(transcript) === 'draw' ? 'champion-win' : 'draw', worldTier: 4,
      authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 } },
    })).toEqual({ status: 'refused', reason: 'outcome-mismatch' });

    expect(planned({ champion, encounter: target, battleId: 'other-battle' }).witness).not.toBe(first.witness);
    expect(planned({ champion, encounter: target, receiptOrdinal: 18 }).witness).not.toBe(first.witness);
    const collidingWorld = encounter({
      world: 'ordinaryCollision', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    expect(collidingWorld.identity.world.planet.seed).toBe(target.identity.world.planet.seed);
    expect(planned({ champion, encounter: collidingWorld }).witness).not.toBe(first.witness);
  });

  it('refuses stale conquest and Prime authority before producing settlement facts', () => {
    const titan = encounter({ world: 'flame', worldType: 'lava' });
    const champion = owned(42, { strengthen: true });
    const transcript = duel(champion, titan);
    const base = {
      battleId: 'stale', receiptOrdinal: 8, encounter: titan, champion, transcript,
      outcome: outcome(transcript), worldTier: 5,
    } as const;
    expect(planCombatSettlementV1({
      ...base,
      authority: { worldConquered: true, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 } },
    })).toEqual({ status: 'refused', reason: 'already-conquered' });
    expect(planCombatSettlementV1({
      ...base,
      authority: { worldConquered: false, claimedPrimeSignatureIds: ['flame'], lossXp: { kind: 'known-target', awardedTarget: 0 } },
    })).toEqual({ status: 'refused', reason: 'encounter-authority-mismatch' });
  });
});

describe('legacy conquest outcome preservation', () => {
  it('plans ordinary victory XP, conquest, Stardust, counters, affix delegation, and wound math exactly', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const champion = findLossFixtures(target).woundedWin;
    const plan = planned({ champion, encounter: target, worldTier: 4 });
    expect(plan.outcome).toBe('champion-win');
    expect(plan.counters).toEqual({ duels: 1, duelWins: 1, guardians: 0 });
    expect(plan.xp).toEqual({
      status: 'award', source: 'conquest-win', creatureId: 'ordered-loss-companion', amount: 24,
    });
    expect(plan.conquest).toMatchObject({
      status: 'settle', worldKey: target.identity.world.key, tier: 4, legacyEpoch: 0,
    });
    expect(plan.guardianCapture).toEqual({ status: 'none' });
    expect(plan.primeClaim).toEqual({ status: 'none' });
    expect(plan.rewards).toEqual({
      stardust: { status: 'award', amount: 28, lifetimeEarnedDelta: 28 },
      legacyConquestAffix: {
        status: 'delegated-exact', owner: 'loot-and-equipped-state-writer',
        planetSeed: 488332735, gateSalt: 0x5901, selectionSalt: 0x5902, gateChance: 0.4,
      },
      guardianAuthoredReward: {
        status: 'none', owner: 'Arc-6-loot-design',
        reason: 'authored-Guardian-reward-table-not-authoritative',
      },
    });
    expect(plan.injury.status).toBe('set-hurt');
    if (plan.injury.status !== 'set-hurt') throw new Error('wound fixture did not wound');
    const last = plan.transcript.log[plan.transcript.log.length - 1]!;
    const fraction = Math.max(0, (last.hpA as number) / plan.transcript.maxA);
    expect(plan.injury.reason).toBe('hard-won-conquest');
    expect(plan.injury.hurtAfter).toBe(Math.min(0.85, (0.55 - fraction) * 0.7));
  });

  it('plans exact Guardian and Titan capture/Prime facts while leaving the unauthoritative authored reward open', () => {
    const guardian = encounter({
      world: 'guardian', worldType: 'airless', defenderGenome: makeGenome(1, 'fauna', 0.5),
    });
    expect(guardian.defender.kind).toBe('guardian');
    const guardianChampion = owned(7, { strengthen: true });
    const guardianPlan = planned({ champion: guardianChampion, encounter: guardian, worldTier: 6 });
    expect(guardianPlan.outcome).toBe('champion-win');
    expect(guardianPlan.xp).toMatchObject({ status: 'award', source: 'guardian-win', amount: 66 });
    expect(guardianPlan.counters.guardians).toBe(1);
    expect(guardianPlan.guardianCapture).toMatchObject({
      status: 'ownership-writer-required', source: 'Apex Guardian',
      battlefieldModifiersStripped: true, cataloguePolicy: 'legacy-store-species-deduplication',
    });
    if (guardianPlan.guardianCapture.status !== 'ownership-writer-required') throw new Error('Guardian capture missing');
    expect(guardianPlan.guardianCapture.portableGenome).not.toHaveProperty('_mult');
    expect(guardianPlan.guardianCapture.portableGenome).not.toHaveProperty('_wf');
    expect(guardianPlan.rewards.stardust).toEqual({ status: 'award', amount: 78, lifetimeEarnedDelta: 78 });
    expect(guardianPlan.rewards.guardianAuthoredReward.status).toBe('unsupported-open');

    const titan = encounter({ world: 'flame', worldType: 'lava' });
    const titanChampion = owned(42, { strengthen: true });
    const titanPlan = planned({ champion: titanChampion, encounter: titan, worldTier: 5 });
    expect(titanPlan.outcome).toBe('champion-win');
    expect(titanPlan.guardianCapture).toMatchObject({
      status: 'ownership-writer-required', source: 'Elemental Titan',
    });
    expect(titanPlan.primeClaim).toMatchObject({
      status: 'claim', signatureId: 'flame', title: 'Fire — Pyraxis, the Ember Tyrant',
      sub: 'titan felled', tier: 14, hex: '#ffd96a', world: titan.identity.world,
    });
    expect(titanPlan.rewards.stardust).toEqual({ status: 'award', amount: 73, lifetimeEarnedDelta: 73 });
  });

  it('preserves player mercy damage and owned-creature crawl-home/death outcomes', () => {
    const titan = encounter({ world: 'flame', worldType: 'lava' });
    const weakGenome = makeGenome(1, 'fauna', 0.5);
    const weakStats = { ...battleStats(weakGenome), vit: 1, fer: 1, res: 1, agi: 1, ins: 1, total: 5 };
    const player: CombatSettlementChampionV1 = {
      kind: 'player', explorerId: 'explorer', name: 'Explorer', genomeSeed: 0x50a1e5,
      stats: weakStats, currentHp: 20,
    };
    const playerPlan = planned({ champion: player, encounter: titan });
    expect(playerPlan.outcome).not.toBe('champion-win');
    expect(playerPlan.xp).toEqual({ status: 'not-applicable', reason: 'player-champion' });
    expect(playerPlan.injury).toEqual({
      status: 'damage-player', hpBefore: 20, hpAfter: 1, damage: 19, mercyFloor: 1,
    });
    expect(playerPlan.conquest.status).toBe('unchanged');
    expect(playerPlan.rewards.stardust.amount).toBe(0);

    const ordinary = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const loss = findLossFixtures(ordinary).ordinaryLoss;
    const bredPlan = planned({ champion: loss, encounter: ordinary });
    expect(bredPlan.injury).toMatchObject({
      status: 'set-hurt', reason: 'bred-crawl-home', hurtBefore: 0, hurtAfter: 0.85,
    });
    const unbred = { ...loss, legacyBredLineage: false } as CombatSettlementChampionV1;
    expect(planned({ champion: unbred, encounter: ordinary }).injury).toMatchObject({
      status: 'remove-creature', reason: 'wild-or-unbred-defeat',
    });
    const critical = owned(
      (loss as { genome: Genome }).genome.seed,
      { creatureId: 'ordered-loss-companion', hurt: 0.85, bred: true },
    );
    expect(planned({ champion: critical, encounter: ordinary }).injury).toMatchObject({
      status: 'remove-creature', reason: 'critical-repeat-defeat',
    });
  });
});

describe('conquest-loss XP correction', () => {
  it('settles +3 base and at most +2 near-brink delta in either order with stable replays', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const fixtures = findLossFixtures(target);
    expect([
      (fixtures.ordinaryLoss as { genome: Genome }).genome.seed,
      (fixtures.nearBrinkLoss as { genome: Genome }).genome.seed,
      (fixtures.woundedWin as { genome: Genome }).genome.seed,
    ]).toEqual([2, 51, 3]);

    const ordinaryFirst = planned({
      champion: fixtures.ordinaryLoss, encounter: target,
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    });
    expect(ordinaryFirst.xp).toMatchObject({
      status: 'loss-target', nearBrink: false, previousTarget: 0, outcomeTarget: 3,
      nextTarget: 3, baseDelta: 3, nearBrinkDelta: 0, totalDelta: 3,
    });
    const brinkSecond = planned({
      champion: fixtures.nearBrinkLoss, encounter: target,
      lossXp: { kind: 'known-target', awardedTarget: 3 },
    });
    expect(brinkSecond.xp).toMatchObject({
      status: 'loss-target', nearBrink: true, previousTarget: 3, outcomeTarget: 5,
      nextTarget: 5, baseDelta: 0, nearBrinkDelta: 2, totalDelta: 2,
    });

    const brinkFirst = planned({
      champion: fixtures.nearBrinkLoss, encounter: target,
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    });
    expect(brinkFirst.xp).toMatchObject({
      status: 'loss-target', nearBrink: true, previousTarget: 0, outcomeTarget: 5,
      nextTarget: 5, baseDelta: 3, nearBrinkDelta: 2, totalDelta: 5,
    });
    const ordinarySecond = planned({
      champion: fixtures.ordinaryLoss, encounter: target,
      lossXp: { kind: 'known-target', awardedTarget: 5 },
    });
    expect(ordinarySecond.xp).toMatchObject({
      status: 'loss-target', nearBrink: false, previousTarget: 5, outcomeTarget: 3,
      nextTarget: 5, baseDelta: 0, nearBrinkDelta: 0, totalDelta: 0,
    });
    const brinkReplay = planned({
      champion: fixtures.nearBrinkLoss, encounter: target,
      lossXp: { kind: 'known-target', awardedTarget: 5 },
    });
    expect(brinkReplay.xp).toMatchObject({
      status: 'loss-target', nextTarget: 5, baseDelta: 0, nearBrinkDelta: 0, totalDelta: 0,
    });
    expect((ordinaryFirst.xp as { ledgerIdentity: string }).ledgerIdentity)
      .toBe((brinkFirst.xp as { ledgerIdentity: string }).ledgerIdentity);
  });

  it('protects an ambiguous legacy shared key instead of guessing whether it paid 3 or 5', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const loss = findLossFixtures(target).nearBrinkLoss;
    expect(planned({
      champion: loss, encounter: target, lossXp: { kind: 'legacy-shared-key-ambiguous' },
    }).xp).toEqual({
      status: 'protected-unsupported',
      creatureId: 'ordered-loss-companion',
      reason: 'legacy-shared-key-amount-ambiguous',
      nearBrink: true,
      totalDelta: 0,
    });
  });

  it('keeps policies that lack authoritative designs explicitly open', () => {
    expect(COMBAT_SETTLEMENT_SCOPE_V1).toEqual({
      supportedMode: 'legacy-v1.8.9-conquest-only',
      friendlyDuelProgression: 'unsupported-open-active-play-policy',
      partyRolesAndRetreat: 'unsupported-open-design-gate',
      guardianAuthoredReward: 'unsupported-open-loot-table',
    });
  });
});
