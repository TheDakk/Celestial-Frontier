/* §20 relay beats on the painted stage: one captioned beat per earlier party fighter, re-derived from the settled plan (the same
   engine run as the Chronicle prelude), and the stage holds them before the decisive leg's first turn. */
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  autoEncounterDecisionV1,
  planCombatPartySettlementV1,
  projectGuardianPrimeEncounterV1,
  runEncounterV1,
  type CombatSettlementPlanV1,
  type EncounterDecisionV1,
} from '@cf/domain-combatcore';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { resolveCF1WorldAddress } from '@cf/scene';
import { battle2SwapBeatsV1 } from './swap-beats.js';

installCaptureHooks();
const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } });
if (!resolved.ok) throw new Error(resolved.reason);
const OPPORTUNITY = projectWorldOpportunity(resolved.address);
const ENCOUNTER = projectGuardianPrimeEncounterV1({ world: resolved.address, descriptor: { worldType: OPPORTUNITY.source.planetType }, regionIndex: 0,
  faunaRoster: [{ speciesId: 'beats-native', genome: makeGenome(1, 'fauna', 0.5) }], claimedSignatureIds: [], conquered: false })!;
const champion = (seed: number) => ({ kind: 'owned-fauna' as const, creatureId: `beats-${seed}`, name: `Fighter ${seed}`,
  genome: { ...makeGenome(seed, 'fauna', 0.5), xp: 0, hurt: 0 }, legacyBredLineage: false });

function plan(seeds: readonly number[], mode: 'auto' | 'command', decisions: readonly EncounterDecisionV1[] = []): CombatSettlementPlanV1 {
  const planned = planCombatPartySettlementV1({ battleId: `beats-${seeds.join('-')}-${decisions.join('')}`, receiptOrdinal: 0, encounter: ENCOUNTER,
    worldTier: OPPORTUNITY.effectiveTier, mode, decisions, party: seeds.map((seed) => ({ champion: champion(seed), stance: 'balanced' as const })),
    authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: 1 } });
  if (planned.status !== 'planned') throw new Error(planned.reason);
  return planned;
}
const defender = { name: ENCOUNTER.defender.name, battleGenome: ENCOUNTER.defender.battleGenome as Record<string, unknown> };
function commandSwapFixture(): { seeds: number[]; decisions: EncounterDecisionV1[] } {
  for (let base = 5; base < 6_000; base += 11) {
    const seeds = [base, base + 1_000, base + 2_000];
    const decisions: EncounterDecisionV1[] = [];
    try {
      for (let g = 0; g < 16; g++) {
        const r = runEncounterV1({ mode: 'command', defender: { name: defender.name, genome: defender.battleGenome as never },
          party: seeds.map((s) => ({ name: `Fighter ${s}`, genome: champion(s).genome as never, stance: 'balanced' as const })) }, decisions);
        if (r.status === 'finished') break;
        // a player who swaps at every low-HP Break they can
        decisions.push(r.pendingBreak.options.includes('swap') ? 'swap' : autoEncounterDecisionV1(r.pendingBreak));
      }
      if (decisions.includes('swap')) return { seeds, decisions };
    } catch { /* next */ }
  }
  throw new Error('no swap fixture');
}

describe('§20 battle2 relay beats', () => {
  it('a lone fighter has no beats; a party has one per earlier fighter, in order, naming the next fighter and the Guardian\'s health', () => {
    expect(battle2SwapBeatsV1(undefined, defender)).toEqual([]);
    const { seeds, decisions } = commandSwapFixture();
    const settled = plan(seeds, 'command', decisions);
    const beats = battle2SwapBeatsV1(settled.party, defender);
    const earlier = settled.party!.members.filter((m) => m.legEnd !== 'decisive' && m.legEnd !== 'not-fought');
    expect(beats).toHaveLength(earlier.length);
    expect(beats.some((b) => b.how === 'swapped'), 'the swapping player sees a swap beat').toBe(true);
    for (const [i, beat] of beats.entries()) {
      expect(beat.fighterName).toBe(earlier[i]!.champion.name);
      expect(beat.text).toContain(beat.fighterName);
      expect(beat.defenderPercent).toBeGreaterThanOrEqual(0);
      expect(beat.defenderPercent).toBeLessThanOrEqual(100);
    }
    expect(beats[beats.length - 1]!.nextName).toBe(settled.champion.name);   // the last beat hands over to the decisive fighter
  });

  it('negative control: a tampered decision list (another fight) no longer resolves and is refused, never staged', () => {
    const { seeds, decisions } = commandSwapFixture();
    const settled = plan(seeds, 'command', decisions);
    const forged = { ...settled.party!, decisions: [] as EncounterDecisionV1[] };
    expect(() => battle2SwapBeatsV1(forged, defender)).toThrow(/does not resolve/);
  });
});
