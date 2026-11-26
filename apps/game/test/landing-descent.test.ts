// The rolled descent inside the landing's receipt: the two draws, the wave-off and what it costs, the storm of
// the moment, the Reinforced Hull, and the region counter.
// LEGACY celestial-frontier.html, v1.8.9: `_descRoll` 13438-13462, `descentFor` 13421-13434, `_descWx` 13402-13420.
import { describe, expect, it } from 'vitest';
import { descentOdds, descentStormActive, waveOffDamage, createLandingViews, landingRegion } from '../src/landing';
import { SOL, landingPage, solWorld, waveOffSession, worldFacts, type LandingPage } from './landing-support';

/** A session whose first press on Venus is a wave-off. */
const WAVE_OFF = { sessionSeed: waveOffSession() };

type Press = Awaited<ReturnType<LandingPage['land']>>;
const committed = (outcome: Press): Extract<Press, { readonly kind: 'committed' }> => {
  if (outcome.kind !== 'committed') throw new Error(`landing was ${outcome.kind}`);
  return outcome;
};
/** The two values the receipt drew, in order. */
const drawsOf = (outcome: Extract<Press, { readonly kind: 'committed' }>): number[] =>
  'draws' in outcome.transaction.plan ? outcome.transaction.plan.draws.map(({ value }) => value) : [];

describe('a descent to a world never stood on is rolled inside the landing\'s receipt', () => {
  it('each press draws success then damage; it lands when the first draw, as a percent, is below the odds', async () => {
    const page = await landingPage(WAVE_OFF);
    const venus = solWorld(SOL.venus);
    const presses = (await page.landUntilDown(venus)).map(committed);
    expect(presses.length).toBeGreaterThan(1);
    let waveOffs = 0;
    for (const press of presses) {
      const [success, damage] = drawsOf(press);
      expect(press.transaction.plan).toMatchObject({ draws: [{ domain: 'descent.success' }, { domain: 'descent.damage' }] });
      const { descent } = press.facts;
      const odds = descentOdds({
        ...worldFacts(venus), stormActive: descent.stormActive, waveOffCount: waveOffs,
        gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
      });
      expect(descent.successPercent).toBe(odds.successPercent);
      expect(descent.kind).toBe(success! * 100 < odds.successPercent ? 'landed' : 'wave-off');
      expect(descent.waveOffsBefore).toBe(waveOffs);
      if (descent.kind === 'wave-off') {
        waveOffs++;
        const cost = waveOffDamage({ damageMin: odds.damageMin, damageMax: odds.damageMax, draw: damage!, reinforcedHull: false, strutReduction: 0, hp: descent.hpBefore });
        expect(descent).toMatchObject({ damage: cost.damage, hpAfter: descent.hpBefore - cost.damage, waveOffsAfter: waveOffs });
        // The approach is learned: 20 more next time (13431, 13456).
        expect(descent.nextSuccessPercent).toBe(Math.min(100, odds.successPercent + 20));
        expect(press.facts.landed).toBeNull();
      }
    }
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'descent.success': presses.length, 'descent.damage': presses.length });
    expect(await page.receipts()).toHaveLength(presses.length);
  });

  it('a wave-off costs health, is remembered for that world, and marks nothing as landed', async () => {
    const page = await landingPage(WAVE_OFF);
    const venus = solWorld(SOL.venus);
    const before = page.durable();
    const outcome = committed(await page.land(venus));
    expect(outcome.facts.descent.kind).toBe('wave-off');
    const { damage } = outcome.facts.descent;
    expect(damage).toBeGreaterThan(0);
    // Only health and the wave-off count move.
    expect({ ...outcome.state, hp: before.hp, waveOffs: before.waveOffs }).toEqual(before);
    expect(outcome.state.hp).toBe(before.hp - damage);
    expect(outcome.state.waveOffs).toEqual([[SOL.venus, 1]]);
    expect(page.waveOffs(venus)).toBe(1);
    expect(page.identityLanded(venus)).toBe(false);
    expect(page.live.hp).toBe(before.hp - damage);
    // No landing view was composed: the counter stands, and nothing arrived.
    expect(page.views.count).toBe(0);
    expect(page.arrived).toEqual([]);
    expect(page.outcomes.committed).toHaveLength(1);
  });

  it('a wave-off never takes the last point of health', async () => {
    const page = await landingPage({ ...WAVE_OFF, change: (state) => { state.hp = 1; } });
    const outcome = committed(await page.land(solWorld(SOL.venus)));
    expect(outcome.facts.descent).toMatchObject({ kind: 'wave-off', damage: 0, hpAfter: 1 });
    expect(outcome.state.hp).toBe(1);
    expect(page.waveOffs(solWorld(SOL.venus))).toBe(1);
  });

  it('the Reinforced Hull takes 1 off a scrape above 1', async () => {
    // LEGACY 13451. The same session, so the same two draws, with and without the research.
    const bare = committed(await (await landingPage(WAVE_OFF)).land(solWorld(SOL.venus)));
    const hulled = committed(await (await landingPage({ ...WAVE_OFF, change: (state) => { state.techOwned = ['hull1']; } })).land(solWorld(SOL.venus)));
    expect(drawsOf(hulled)).toEqual(drawsOf(bare));
    expect(bare.facts.descent.kind).toBe('wave-off');
    expect(bare.facts.descent.damage).toBeGreaterThan(1);
    expect(hulled.facts.descent.damage).toBe(bare.facts.descent.damage - 1);
    expect(hulled.state.hp).toBe(bare.state.hp + 1);
  });

  it('a rolled landing clears the world\'s wave-offs, and the next visit is not rolled', async () => {
    const page = await landingPage(WAVE_OFF);
    const venus = solWorld(SOL.venus);
    const presses = (await page.landUntilDown(venus)).map(committed);
    expect(page.waveOffs(venus)).toBe(0);
    expect(presses.at(-1)!.state.waveOffs).toEqual([]);
    const draws = page.runtime.diagnostics().sessionDraws;
    expect(committed(await page.land(venus)).facts.descent).toMatchObject({ kind: 'landed', safeReason: 'revisit', draws: 0 });
    expect(page.runtime.diagnostics().sessionDraws).toEqual(draws);
  });

  it('a hostile world let in by the roll is Through the Fire, and only on that first landing', async () => {
    // LEGACY 13443-13444: the biome lands at 30 or less.
    const page = await landingPage();
    const venus = solWorld(SOL.venus);
    const landed = committed((await page.landUntilDown(venus)).at(-1)!);
    expect(descentOdds({ ...worldFacts(venus), stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false }).biomeLanding).toBeLessThanOrEqual(30);
    expect(landed.facts.descent.throughTheFire).toBe(true);
    expect(committed(await page.land(venus)).facts.descent.throughTheFire).toBe(false);
  });
});

describe('the storm of the moment', () => {
  const venus = solWorld(SOL.venus);
  const { planet, band } = worldFacts(venus);
  /** The first weather spell, in seconds, whose storm is as asked. */
  const spell = (storm: boolean): number => {
    for (let seconds = 45; seconds < 90 * 400; seconds += 90) if (descentStormActive(planet, band, seconds) === storm) return seconds;
    throw new Error(`Venus has no spell with storm ${storm}`);
  };

  it('the odds are those of the weather at the receipt\'s own active play: a storm takes 5 off', async () => {
    const calm = committed(await (await landingPage({ activePlayMs: spell(false) * 1000 })).land(venus));
    const stormy = committed(await (await landingPage({ activePlayMs: spell(true) * 1000 })).land(venus));
    expect(calm.facts.descent.stormActive).toBe(false);
    expect(stormy.facts.descent.stormActive).toBe(true);
    const base = descentOdds({ planet, band, stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false }).successPercent;
    expect(calm.facts.descent.successPercent).toBe(base);
    expect(stormy.facts.descent.successPercent).toBe(base - 5);
  });
});

describe('the region counter', () => {
  it('three openings of the same Earth landing in one session use salts that differ by 131', async () => {
    const page = await landingPage();
    const earth = solWorld(SOL.earth);
    const salts: number[] = [];
    for (let opening = 0; opening < 3; opening++) {
      const outcome = committed(await page.land(earth));
      salts.push(outcome.facts.landed!.region.salt);
    }
    expect(salts[1]! - salts[0]!).toBe(131);
    expect(salts[2]! - salts[1]!).toBe(131);
    expect(page.views.count).toBe(3);
  });

  it('a look back at a landing rolls again, and a new page starts from the first view', () => {
    const earth = solWorld(SOL.earth);
    const { band } = worldFacts(earth);
    const views = createLandingViews();
    const first = landingRegion({ address: earth, band, epoch: 2, landings: 3, view: views.next() });
    const second = landingRegion({ address: earth, band, epoch: 2, landings: 3, view: views.next() });
    expect([first.salt, second.salt]).toEqual([2 * 997 + 3 + 131, 2 * 997 + 3 + 262]);
    // Landing regions restart on reload, as in the legacy game (12974: the counter is not saved).
    const reloaded = createLandingViews();
    expect(reloaded.count).toBe(0);
    expect(landingRegion({ address: earth, band, epoch: 2, landings: 3, view: reloaded.next() })).toEqual(first);
  });
});
