// The landing action plays a world by the rules its port hands it: the snapshot, the odds and the storm of the
// committed landing are the rules', not the legacy game's. The game's own port (`worldRulesAt`) hands every world
// none today; here a port hands real rules, so the one consumer of the port is held to them.
import { describe, expect, it } from 'vitest';
import type { WorldOpportunityRules } from '@cf/domain-opportunity';
import type { WeatherToken } from '@cf/domain-landing';
import { descentOdds, descentStormActive, type LandingWorldRulesV1, type WeatherRules } from '../src/landing';
import { SOL, landingPage, solWorld, waveOffSession, worldFacts } from './landing-support';

type Rules = WorldOpportunityRules & WeatherRules;
const PARENT: Rules = { biome: 'parent', landing: null, landFamily: 'parent', lifeKey: 'parent', deposits: 'parent', reserveMul: 1, weather: 'parent' };
/** A port that hands these rules to one world and none to the rest. */
const portFor = (seed: number, rules: Rules): LandingWorldRulesV1 => (address) => (address.planet.seed === seed ? rules : null);
/** A session whose first press waves off at any odds up to 90. */
const WAVE_OFF = { sessionSeed: waveOffSession(0.9) };

async function firstPress(seed: number, rules: Rules | null) {
  const page = await (rules === null ? landingPage(WAVE_OFF) : landingPage(WAVE_OFF, portFor(seed, rules)));
  const outcome = await page.land(solWorld(seed));
  if (outcome.kind !== 'committed') throw new Error(`landing was ${outcome.kind}`);
  return outcome.facts.descent;
}

describe('the landing action plays a world by the rules it is handed', () => {
  it('a fixed landing of 60 with a scrape of 1 is the committed press\'s odds and its wave-off\'s cost, where the legacy world lands at its own', async () => {
    const legacy = await firstPress(SOL.venus, null);
    const ruled = await firstPress(SOL.venus, { ...PARENT, weather: 'none', landing: { fixed: { p: 60, lo: 1, hi: 1 } } });
    expect(legacy.successPercent).toBeLessThanOrEqual(30);
    expect(ruled).toMatchObject({ kind: 'wave-off', successPercent: 60, stormActive: false });
    expect(ruled.damage).toBe(1);
    // The legacy scrape on Venus is 5 or more.
    expect(legacy.kind).toBe('wave-off');
    expect(legacy.damage).toBeGreaterThanOrEqual(5);
  });

  it('the storm of the press is the rules\' weather: a world with none of its own storms under a named weather, and a stormy world is clear under "none"', async () => {
    // A world, a weather and the legacy answer that differ at the moment of the first press.
    const cases = [SOL.mercury, SOL.venus, SOL.mars, SOL.jupiter].flatMap((seed) => (['none', 'rain', 'snow', 'dust', 'ash', 'haze'] as const).map((weather) => ({ seed, weather })));
    const facts = (seed: number) => worldFacts(solWorld(seed));
    let proved = 0;
    for (const { seed, weather } of cases) {
      const { planet, band } = facts(seed);
      const legacy = (await firstPress(seed, null)).stormActive;
      const expected = descentStormActive(planet, band, 0, { weather: weather as 'none' | WeatherToken, biome: 'parent' });
      if (expected === legacy) continue;
      const ruled = await firstPress(seed, { ...PARENT, weather });
      expect(ruled.stormActive, `${seed} ${weather}`).toBe(expected);
      // The storm's 5 is in the odds of the press.
      const odds = descentOdds({ planet, band, stormActive: expected, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false, rules: null });
      expect(ruled.successPercent, `${seed} ${weather}`).toBe(odds.successPercent);
      proved++;
      if (proved >= 2) break;
    }
    expect(proved).toBeGreaterThanOrEqual(1);
  });

  it('the world\'s own list is the first landing\'s sample', async () => {
    const page = await landingPage({ sessionSeed: 1 }, portFor(SOL.mars, { ...PARENT, landing: { fixed: { p: 100, lo: 2, hi: 2 } }, deposits: ['C', 'Sn'], depositCount: 2 }));
    const outcome = await page.land(solWorld(SOL.mars));
    if (outcome.kind !== 'committed' || outcome.facts.landed === null) throw new Error('the landing did not land');
    expect([...outcome.facts.landed.sample!.materials].sort()).toEqual(['C', 'Sn']);
  });
});
