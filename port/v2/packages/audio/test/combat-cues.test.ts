import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  battleStats,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
  type DuelResult,
  type GuardianPrimeEncounterV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';
import {
  auditAudioStaticPurity,
  combatCuePlan,
  inspectAudioStaticPurity,
  isCombatCueParticipantsV1,
  isCombatCuePlanV1,
  projectCombatCueParticipantsV1,
  type CombatCueFamily,
} from '../src/index.js';

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
  defenderGenome?: Genome;
  claimed?: readonly PrimeSignatureIdV1[];
}>): GuardianPrimeEncounterV1 {
  const projected = projectGuardianPrimeEncounterV1({
    world: address(options.world),
    descriptor: { worldType: options.worldType },
    regionIndex: 0,
    faunaRoster: options.defenderGenome === undefined
      ? [] : [{ speciesId: 'audio-defender-fixture', genome: options.defenderGenome }],
    claimedSignatureIds: options.claimed ?? [],
    conquered: false,
  });
  if (projected === null) throw new Error('audio fixture did not project an encounter');
  return projected;
}

function owned(seed: number, strengthen = false): CombatSettlementChampionV1 {
  const genome = makeGenome(seed, 'fauna', 0.5);
  if (strengthen) {
    genome.brood = 200;
    genome.fed = 200;
    genome.xp = 486;
  }
  return {
    kind: 'owned-fauna', creatureId: `audio-champion-${seed}`,
    name: `Audio Champion ${seed}`, genome, legacyBredLineage: true,
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

function planned(
  champion: CombatSettlementChampionV1,
  target: GuardianPrimeEncounterV1,
  battleId: string,
): CombatSettlementPlanV1 {
  const transcript = duel(champion, target);
  const result = planCombatSettlementV1({
    battleId, receiptOrdinal: 31, encounter: target, champion, transcript,
    outcome: outcome(transcript), worldTier: 5,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: target.identity.claimedSignatureIds,
      lossXp: champion.kind === 'player' ? null : { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (result.status !== 'planned') throw new Error(`audio settlement refused: ${result.reason}`);
  return result;
}

describe('Arc 8 completed-transcript combat cue owner', () => {
  it('maps every existing transcript event family with stable paired caption/visual tokens', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const found = new Set<CombatCueFamily>();
    let firstStable: ReturnType<typeof combatCuePlan> | null = null;
    for (let seed = 1; seed <= 768; seed++) {
      const settlement = planned(owned(seed), target, `audio-family-${seed}`);
      const participants = projectCombatCueParticipantsV1(settlement);
      const first = combatCuePlan(settlement, participants);
      const second = combatCuePlan(settlement, participants);
      if (firstStable === null) firstStable = first;
      expect(second).toEqual(first);
      expect(second.planId).toBe(first.planId);
      expect(isCombatCuePlanV1(first)).toBe(true);
      for (const cue of first.cues) {
        cue.families.forEach((family) => found.add(family));
        expect(cue.counterparts.map((row) => row.family)).toEqual(cue.families);
        expect(cue.counterparts.every((row) =>
          row.captionToken.includes(cue.cueId)
          && row.visualToken.includes(cue.cueId))).toBe(true);
        expect(new Set(cue.counterparts.map((row) => row.captionToken)).size)
          .toBe(cue.counterparts.length);
      }
    }
    expect(firstStable).not.toBeNull();
    expect(found).toEqual(new Set<CombatCueFamily>([
      'initiative', 'dodge', 'stun-skipped', 'damage', 'critical', 'first-strike',
      'execute', 'thorns', 'lifesteal', 'stun-applied', 'burn', 'regen',
      'defeat', 'resolution',
    ]));
  });

  it('binds exact ability and raw body/material weight inputs without fabricating a material mapping', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const settlement = planned(owned(3), target, 'audio-weight-facts');
    const participants = projectCombatCueParticipantsV1(settlement);
    expect(isCombatCueParticipantsV1(participants)).toBe(true);
    expect(participants.champion.ability).toMatchObject({
      theme: settlement.transcript.A.ab.theme,
      themeLabel: settlement.transcript.A.ab.themeLabel,
      color: settlement.transcript.A.ab.col,
      fields: settlement.transcript.A.ab,
    });
    expect(participants.champion.bodyMaterial).toEqual({
      policy: 'legacy-genome-weight-inputs-unmapped',
      genomeSeed: (settlement.champion as { genome: Genome }).genome.seed,
      sizeIndex: (settlement.champion as { genome: Genome }).genome.size,
      bodyIndex: (settlement.champion as { genome: Genome }).genome.body,
      skinIndex: (settlement.champion as { genome: Genome }).genome.skin,
      detailIndex: (settlement.champion as { genome: Genome }).genome.detail,
      luminous: (settlement.champion as { genome: Genome }).genome.lumin,
    });
    const plan = combatCuePlan(settlement, participants);
    const strike = plan.cues.find((cue) => cue.impact !== null)!;
    expect(strike.ability).not.toBeNull();
    expect(strike.bodyMaterial?.policy).toBe('legacy-genome-weight-inputs-unmapped');
    expect(strike.impact?.damageFraction)
      .toBe(strike.impact!.damage / strike.impact!.targetMaxHp);
    expect(Object.isFrozen(participants)).toBe(true);
    expect(Object.isFrozen(participants.champion.ability.fields)).toBe(true);
    expect(Object.isFrozen(plan.cues)).toBe(true);
  });

  it('projects Guardian/Titan entrance, phase, and settled victory/defeat motifs from exact source facts', () => {
    const guardianTarget = encounter({
      world: 'guardian', worldType: 'airless', defenderGenome: makeGenome(1, 'fauna', 0.5),
    });
    const guardianSettlement = planned(owned(7, true), guardianTarget, 'audio-guardian-win');
    const guardianParticipants = projectCombatCueParticipantsV1(guardianSettlement);
    const guardianPlan = combatCuePlan(guardianSettlement, guardianParticipants);
    expect(guardianTarget.defender.kind).toBe('guardian');
    expect(guardianParticipants.guardian).toMatchObject({
      kind: 'guardian', sourceId: guardianTarget.defender.sourceId,
      planetSeed: guardianTarget.identity.world.planet.seed,
      tier: guardianTarget.defender.tier,
      abilityTheme: guardianSettlement.transcript.B.ab.theme,
    });
    expect(guardianTarget.defender.name.endsWith(guardianParticipants.guardian!.epithet)).toBe(true);
    expect(guardianPlan.cues.map((cue) => cue.guardianMotif?.motif).filter(Boolean))
      .toEqual(['entrance', 'phase', 'defeat']);

    const titanTarget = encounter({ world: 'flame', worldType: 'lava' });
    const weakGenome = makeGenome(1, 'fauna', 0.5);
    const player: CombatSettlementChampionV1 = {
      kind: 'player', explorerId: 'audio-explorer', name: 'Audio Explorer', genomeSeed: 0x50a1e5,
      stats: { ...battleStats(weakGenome), vit: 1, fer: 1, res: 1, agi: 1, ins: 1, total: 5 },
      currentHp: 20,
    };
    const titanSettlement = planned(player, titanTarget, 'audio-titan-loss');
    const titanParticipants = projectCombatCueParticipantsV1(titanSettlement);
    const titanPlan = combatCuePlan(titanSettlement, titanParticipants);
    expect(titanTarget.defender.kind).toBe('titan');
    expect(titanParticipants.champion.bodyMaterial).toBeNull();
    expect(titanParticipants.guardian).toMatchObject({
      kind: 'titan', signatureId: 'flame', epithet: 'the Ember Tyrant',
      planetSeed: titanTarget.identity.world.planet.seed, tier: 14,
    });
    expect(titanPlan.cues.map((cue) => cue.guardianMotif?.motif).filter(Boolean))
      .toEqual(['entrance', 'victory']);
  });

  it('fails closed on transcript reorder/tamper, malformed events, and participant or Guardian drift', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const settlement = planned(owned(3), target, 'audio-authority');
    const participants = projectCombatCueParticipantsV1(settlement);
    const reversed = {
      ...settlement,
      transcript: { ...settlement.transcript, log: [...settlement.transcript.log].reverse() },
    };
    expect(() => combatCuePlan(reversed as never, participants)).toThrow(/registered completed/u);
    const tampered = {
      ...settlement,
      transcript: { ...settlement.transcript, hpA: settlement.transcript.hpA + 1 },
    };
    expect(() => combatCuePlan(tampered as never, participants)).toThrow(/registered completed/u);
    const malformed = {
      ...settlement,
      transcript: { ...settlement.transcript, log: [{ tick: true, hpA: 1 }] },
    };
    expect(() => combatCuePlan(malformed as never, participants)).toThrow(/registered completed/u);
    expect(() => combatCuePlan(settlement, { ...participants } as never))
      .toThrow(/participants do not match/u);

    const guardianTarget = encounter({
      world: 'guardian', worldType: 'airless', defenderGenome: makeGenome(1, 'fauna', 0.5),
    });
    const otherSettlement = planned(owned(7, true), guardianTarget, 'audio-authority-other');
    const otherParticipants = projectCombatCueParticipantsV1(otherSettlement);
    expect(() => combatCuePlan(settlement, otherParticipants)).toThrow(/participants do not match/u);
    expect(() => combatCuePlan(otherSettlement, {
      ...otherParticipants,
      guardian: { ...otherParticipants.guardian!, planetSeed: 1 },
    } as never)).toThrow(/participants do not match/u);
    expect(isCombatCuePlanV1({ ...combatCuePlan(settlement, participants) })).toBe(false);
  });

  it('keeps skip silent and refuses to invent a result-only skip motif', () => {
    const target = encounter({
      world: 'ordinary', worldType: 'airless', defenderGenome: makeGenome(999, 'fauna', 0.5),
    });
    const settlement = planned(owned(3), target, 'audio-skip-policy');
    const plan = combatCuePlan(settlement, projectCombatCueParticipantsV1(settlement));
    expect(plan).toMatchObject({
      skipPolicy: 'legacy-silent', resultOnlySkipMotif: 'unsupported-open-policy',
    });
    expect(plan.cues.some((cue) => cue.cueId.includes('skip-result'))).toBe(false);
  });

  it('passes static purity and mutation-controls clock, entropy, and gameplay-RNG regressions', () => {
    const sourceText = readFileSync(fileURLToPath(
      new URL('../src/combat-cues.ts', import.meta.url),
    ), 'utf8');
    expect(auditAudioStaticPurity([{ sourceId: 'combat-cues.ts', sourceText }])).toEqual({
      sourceCount: 1, ruleCount: 10, violationCount: 0,
    });
    const mutants = [
      ['math-random', '\nconst mutation = Math.random();'],
      ['date-now', '\nconst mutation = Date.now();'],
      ['rng-import', "\nimport { mulberry32 } from '@cf/domain-rand';"],
    ] as const;
    for (const [rule, mutation] of mutants) {
      const sources = [{ sourceId: `combat-cues-${rule}.ts`, sourceText: sourceText + mutation }];
      expect(inspectAudioStaticPurity(sources)).toMatchObject([{ rule }]);
      expect(() => auditAudioStaticPurity(sources)).toThrow(rule);
    }
    expect(sourceText).not.toContain('runDuel');
  });
});
