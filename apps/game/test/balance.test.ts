// The balance simulation: what worlds pay, by the game's own mining planner, descent odds, roster and first-landing
// sample, on real addressed worlds with bare hands. The legacy baselines are the figures the accepted designs of the
// new world types argue from; a new type's measure is held within 15% of the best existing world's.
import { describe, expect, it } from 'vitest';
import type { WorldOpportunityRules } from '@cf/domain-opportunity';
import { BALANCE_MARGIN, bestExisting, simulate, withinMargin, type WorldMeasure } from '@cf/domain-worldkinds';
import { addressedWorlds, balanceSources, lifelessOf } from './balance-support';
import { wearing } from './descent-support';

const PRECIOUS = ['Ag', 'Au', 'Pt', 'Ir'];
/** Units of silver, gold, platinum and iridium a pull. */
const precious = (world: WorldMeasure): number => PRECIOUS.reduce((sum, id) => sum + (world.unitsAPull.get(id) ?? 0), 0);
/** Like worlds: as many deposit lines, as many of them precious. */
const linesOf = (world: WorldMeasure): string => `${world.snapshot.deposits.length} lines, ${world.snapshot.deposits.filter((id) => PRECIOUS.includes(id)).length} precious`;

// Bare hands, read the way the game reads worn gear: from the loot carrier of a save with nothing worn.
const sources = balanceSources(wearing());
const all = addressedWorlds();
const TYPES = ['gas', 'ice', 'rocky', 'desert', 'lava', 'venus', 'terran', 'ocean'];
/** Every lifeless world of tier 0, 40 pulls each. */
const tierZero = (rules: WorldOpportunityRules | null = null) => TYPES.map((type) => simulate({ worlds: lifelessOf(all, type, rules), tier: 0, pulls: 40 }, sources));
const baseline = tierZero();
const of = (type: string) => baseline[TYPES.indexOf(type)]!;
const measured = baseline.flatMap((result) => result.measured);
/** The best existing class for precious metal at tier 0, and its worlds mined 400 pulls each for a close figure. */
const bestClass = bestExisting(measured, precious, linesOf)!;
const bestWorlds = measured.filter((world) => linesOf(world) === bestClass.cls).map((world) => world.world);
const bestAt = (rules: WorldOpportunityRules | null): number => {
  const result = simulate({ worlds: bestWorlds.map((world) => ({ ...world, rules })), tier: 0, pulls: 400 }, sources);
  return result.measured.reduce((sum, world) => sum + precious(world), 0) / result.measured.length;
};
const PARENT: WorldOpportunityRules = { biome: 'parent', landing: null, landFamily: 'parent', lifeKey: 'parent', deposits: 'parent', reserveMul: 1 };

describe('the legacy baselines are the designs\' figures', () => {
  it('bare hands are no gear: no yield bonus and no strike bonus', () => {
    expect(sources.capabilities).toMatchObject({ miningYieldBonus: 0, richStrikeChanceBonus: 0 });
  });

  it('reads enough worlds: over 2,000 addressed worlds, over 200 lifeless ones at tier 0', () => {
    expect(all.length).toBeGreaterThan(2000);
    expect(measured.length).toBeGreaterThan(200);
    expect(measured.every((world) => world.pulls === 40 && world.snapshot.effectiveTier === 0)).toBe(true);
  });

  it('a gas giant pays 1.00 of helium-3 a pull, and each of its five gases the same, within 0.10 (design A, N1)', () => {
    expect(of('gas').mined).toBeGreaterThan(100);
    for (const id of ['H', 'He', 'CH4', 'NH3', 'He3']) expect(Math.abs(of('gas').unitsAPull.get(id)! - 1), id).toBeLessThan(0.10);
  });

  it('a rocky world pays 0.50 of each of its ten a pull, within 0.13 (design A)', () => {
    expect(of('rocky').mined).toBeGreaterThan(50);
    for (const id of ['Fe', 'Si', 'Mg', 'Al', 'Ni', 'Ti', 'Cu', 'Cr', 'Mn', 'Ca']) expect(Math.abs(of('rocky').unitsAPull.get(id)! - 0.5), id).toBeLessThan(0.13);
  });

  it('the best existing world for precious metal has three lines and a silver vein and pays 1.30 a pull, within 0.08 (design C)', () => {
    expect(bestClass.cls).toBe('4 lines, 1 precious');
    expect(bestWorlds.length).toBeGreaterThanOrEqual(5);
    expect(Math.abs(bestAt(null) - 1.30)).toBeLessThan(0.08);
  });

  it('a gas giant lands at 58 in the mean, within 2; a tier 0 reserve is 420 to 799 pulls; a first landing there samples 3 Stardust', () => {
    expect(Math.abs(of('gas').landingPercent - 58)).toBeLessThan(2);
    for (const world of measured) {
      expect(world.snapshot.reservePulls).toBeGreaterThanOrEqual(420);
      expect(world.snapshot.reservePulls).toBeLessThanOrEqual(799);
      expect(world.stardustFirst).toBe(3);
      expect(world.fauna).toBe(0);
    }
  });
});

describe('a new type is held within 15% of the best existing world', () => {
  it('1.15 times the best passes and 1.16 times fails', () => {
    expect(BALANCE_MARGIN).toBe(1.15);
    expect(withinMargin(1.30 * 1.15, 1.30)).toBe(true);
    expect(withinMargin(1.30 * 1.16, 1.30)).toBe(false);
    expect(withinMargin(1.30, 1.30)).toBe(true);
  });

  it('rules that change nothing pay what the legacy world pays, to the unit', () => {
    expect(bestAt(PARENT)).toBe(bestAt(null));
  });

  it('a silver trickle of 15% on the best world is inside the margin, and one of 40% is outside (design C, N10)', () => {
    const best = bestAt(null);
    const trickle = (chance: number) => bestAt({ ...PARENT, trickle: { material: 'Ag', chance, ownsStrike: true } });
    const [fair, rich] = [trickle(0.15), trickle(0.40)];
    // One unit on that share of pulls, and nothing else moves: the strike on these worlds is silver already.
    expect(Math.abs(fair - best - 0.15)).toBeLessThan(0.04);
    expect(Math.abs(rich - best - 0.40)).toBeLessThan(0.05);
    expect(withinMargin(fair, best)).toBe(true);
    expect(withinMargin(rich, best)).toBe(false);
  });

  it('half the reserve is half the units of a world', () => {
    const [whole, half] = [of('gas'), simulate({ worlds: lifelessOf(all, 'gas', { ...PARENT, reserveMul: 0.5 }), tier: 0, pulls: 40 }, sources)];
    expect(half.unitsAPull).toEqual(whole.unitsAPull);
    expect(Math.abs(half.reserveUnits / whole.reserveUnits - 0.5)).toBeLessThan(0.002);
  });
});
