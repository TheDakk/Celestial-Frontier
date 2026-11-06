/** The Guardian card's plan forecast memo (Codex's S20 finding, audits/S20_BALANCE_20260925/forecast-review.*): the memo keyed the defender by
 * its SEED only, so the same Guardian met in a stronger region reused the weaker region's odds (44.375 % shown, 10.625 % true). The key is now
 * the complete combat identity. OUTCOME: after warming the memo on region 0, region 1 equals a fresh computation; control: region 0 and 1
 * really differ (the defender genomes share a seed but not their stats), so the test cannot pass vacuously. */
import { describe, expect, it } from 'vitest';
import { battleStats } from '@cf/domain-combatcore';
import { projectGuardianPrimeEncounterV1 } from '../../../packages/domain/combatcore/src/guardian-prime.js';
import { makeGenome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { clearCombatPlanForecastMemoV1, projectCombatPlanForecastV1 } from './combat-card.js';

describe('plan forecast memo (S20 finding)', () => {
  it('the same Guardian in a stronger region never reuses the weaker region\'s odds', () => {
    installCaptureHooks();
    const world = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } } as never) as { address: unknown };
    const encounter = (regionIndex: number) => projectGuardianPrimeEncounterV1({ world: world.address, descriptor: { worldType: 'airless' }, regionIndex, faunaRoster: [{ speciesId: 'native', genome: makeGenome(1, 'fauna', 0.5) }], claimedSignatureIds: [], conquered: false } as never)!;
    const first = encounter(0), next = encounter(1);
    expect(next.defender.battleGenome.seed).toBe(first.defender.battleGenome.seed); // the collision the old key had
    const stats = battleStats(first.defender.battleGenome as never);
    expect(battleStats(next.defender.battleGenome as never).total).toBeGreaterThan(stats.total); // control: a real difference
    const members = [{ champion: { kind: 'player', explorerId: 'review', name: 'review', genomeSeed: 1234, currentHp: stats.vit * 3, stats }, stance: 'press' }] as never;
    clearCombatPlanForecastMemoV1();
    const fresh = projectCombatPlanForecastV1(members, next);
    clearCombatPlanForecastMemoV1();
    projectCombatPlanForecastV1(members, first); // warm the memo on region 0
    const cached = projectCombatPlanForecastV1(members, next);
    expect(cached).toEqual(fresh);
    expect(fresh.percent).not.toBe(projectCombatPlanForecastV1(members, first).percent); // control: the two regions forecast differently
    expect(projectCombatPlanForecastV1(members, next)).toBe(cached); // and a genuine repeat still hits the memo
  });
});
