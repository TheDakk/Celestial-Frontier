// A new world type's rules, plugged into the descent, the weather, the snapshot, the mining planner and the roster.
// With no rules every answer is the one given today; the recorded legacy answers (landing-descent, opportunity,
// census) hold that and are not touched. Here: a rule set gives exactly what it says, and nothing else moves.
import { describe, expect, it } from 'vitest';
import { biosphere } from '@cf/domain-ecology';
import {
  DEPOSIT_PROFILES, NO_WORLD_RULES, WORLD_OPPORTUNITY_SCHEMA, WORLD_RULES_RESERVE_MAX, WorldRulesRefused, createEngineeringState, planWorldMining,
  projectWorldOpportunity, worldVeinsAt, worldVeinsBySeed,
  type EngineeringQuantity, type EngineeringStateV2, type WorldOpportunityRules,
} from '@cf/domain-opportunity';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import {
  SWITCHES_OFF, SWITCHES_ON, censusStarSeed, declareStream, playRulesFor,
  type PlanetNumbers, type WorldRules, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { navFromCanonicalCF1Address, resolveCF1WorldAddress } from '@cf/scene';
import { descentOdds, descentWeather, projectDescentApproachV1, type WeatherRules } from '../src/landing';
import { loadDescentWaveOffAuthorityV1 } from '@cf/persistence';
import { canonicalWorldRoster, worldRulesAt } from '../src/world';
import { wearing, world } from './descent-support';

const [VENUS, EARTH, MARS, JUPITER] = [132, 133, 134, 135] as const;

/** A rule set that changes nothing. */
const PARENT: WorldOpportunityRules = { biome: 'parent', landing: null, landFamily: 'parent', lifeKey: 'parent', deposits: 'parent', reserveMul: 1 };
const rules = (over: Partial<WorldOpportunityRules>): WorldOpportunityRules => ({ ...PARENT, ...over });

const odds = (seed: number, type: string, band: string, ruled?: WorldOpportunityRules) => descentOdds({
  planet: { seed, type }, band, stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
  rules: ruled ?? null,
});

/** The materials of each of the first `pulls` pulls of a world, mined one press at a time with bare hands. */
function pulls(seed: number, ruled: WorldOpportunityRules | null, count: number): { materials: readonly EngineeringQuantity[]; richStrikes: number }[] {
  const address = world(seed);
  const nav = navFromCanonicalCF1Address(address);
  if (!nav.ok || nav.state.mode !== 'surface') throw new Error('the world has no surface');
  const opportunity = projectWorldOpportunity(address, ruled);
  let state: EngineeringStateV2 = createEngineeringState();
  const out: { materials: readonly EngineeringQuantity[]; richStrikes: number }[] = [];
  for (let n = 1; n <= count; n++) {
    const plan = planWorldMining({ state, opportunity, currentSurface: nav.state, capabilities: wearing(), activePlay: { activePlayMs: 0 }, receiptOrdinal: n });
    if (plan.status !== 'planned') throw new Error(plan.reason);
    out.push({ materials: plan.result.materials, richStrikes: plan.result.richStrikes });
    state = plan.nextState;
  }
  return out;
}
const tally = (materials: readonly EngineeringQuantity[]): Record<string, number> => Object.fromEntries(materials.map((q) => [q.id, q.quantity]));
/** What the second haul holds over the first, material by material; nothing where they are equal. */
function over(first: Record<string, number>, second: Record<string, number>): Record<string, number> {
  const diff: Record<string, number> = {};
  for (const key of new Set([...Object.keys(first), ...Object.keys(second)])) {
    const d = (second[key] ?? 0) - (first[key] ?? 0);
    if (d !== 0) diff[key] = d;
  }
  return diff;
}

describe('a world with no rules plays as before', () => {
  it('the game\'s own switches give no world of Sol any rules', () => {
    for (const seed of [VENUS, EARTH, MARS, JUPITER]) expect(worldRulesAt(world(seed))).toBeNull();
  });

  it('rules that keep the parent\'s everything give the snapshot, the odds and the pulls of no rules at all', () => {
    for (const seed of [VENUS, MARS, JUPITER]) {
      const [bare, kept] = [projectWorldOpportunity(world(seed), null), projectWorldOpportunity(world(seed), PARENT)];
      expect({ ...kept, descentRules: null }).toEqual(bare);
      expect(bare).toMatchObject({ trickle: null, descentRules: null });
      const { planetType, climateBand: band } = bare.source;
      expect(odds(seed, planetType, band, PARENT)).toEqual(odds(seed, planetType, band));
      expect(descentWeather({ seed, type: planetType }, band, 45, 'repaired', { weather: 'parent', biome: 'parent' })).toEqual(descentWeather({ seed, type: planetType }, band, 45, 'repaired', null));
    }
    expect(pulls(MARS, PARENT, 40)).toEqual(pulls(MARS, null, 40));
    expect(canonicalWorldRoster(world(EARTH), 0, { lifeKey: 'parent' })).toEqual(canonicalWorldRoster(world(EARTH), 0, null));
  });
});

describe('a rule set gives exactly what it says', () => {
  it('a fixed landing of 60 with a scrape of 4 to 5 is that landing, on any world; gear and a learned approach still add to it', () => {
    const fixed = rules({ landing: { fixed: { p: 60, lo: 4, hi: 5 } } });
    for (const [seed, type] of [[VENUS, 'venus'], [MARS, 'rocky'], [JUPITER, 'gas']] as const) {
      expect(odds(seed, type, 'hot', fixed)).toMatchObject({ baseSuccessPercent: 60, successPercent: 60, damageMin: 4, damageMax: 5 });
    }
    expect(descentOdds({ planet: { seed: MARS, type: 'rocky' }, band: 'cold', stormActive: true, waveOffCount: 1, gearBonus: 3, familyGearBonus: 0, landingGuaranteed: false, rules: fixed }))
      .toMatchObject({ baseSuccessPercent: 60, stormAdjustedPercent: 55, successPercent: 78, damageMin: 4, damageMax: 5 });
  });

  it('a landing 25 lower with a floor of 5 is the legacy landing less 25, never under 5, and its scrape is the rung of the new odds', () => {
    const heavy = rules({ landing: { delta: -25, floor: 5 } });
    for (const [seed, type, band] of [[VENUS, 'venus', 'hot'], [MARS, 'rocky', 'cold'], [JUPITER, 'gas', 'cold']] as const) {
      const legacy = odds(seed, type, band);
      const ruled = odds(seed, type, band, heavy);
      expect(ruled.baseSuccessPercent).toBe(Math.max(5, legacy.baseSuccessPercent - 25));
      expect(ruled.biomeKey).toBe(legacy.biomeKey);
    }
    // Venus lands at 30 or less: the floor holds it at 5, the lowest rung.
    expect(odds(VENUS, 'venus', 'hot').baseSuccessPercent).toBeLessThanOrEqual(30);
    expect(odds(VENUS, 'venus', 'hot', heavy)).toMatchObject({ baseSuccessPercent: 5, damageMin: 6, damageMax: 8 });
    expect(odds(MARS, 'rocky', 'cold', heavy)).toMatchObject({ damageMin: 4, damageMax: 6 });
    // A step far past the bottom is still held at the floor; with no floor it stops at 0.
    expect(odds(MARS, 'rocky', 'cold', rules({ landing: { delta: -200, floor: 5 } })).baseSuccessPercent).toBe(5);
    expect(odds(MARS, 'rocky', 'cold', rules({ landing: { delta: -200 } })).baseSuccessPercent).toBe(0);
    expect(odds(MARS, 'rocky', 'cold', rules({ landing: { delta: 200 } })).baseSuccessPercent).toBe(100);
  });

  it('a biome of the type\'s own is the one landed on: its name and its landing', () => {
    const own = rules({ biome: { k: 'stillblue', n: 'Still-Blue giant', land: 75 } });
    expect(odds(JUPITER, 'gas', 'cold', own)).toMatchObject({ biomeKey: 'stillblue', biomeName: 'Still-Blue giant', biomeLanding: 75, baseSuccessPercent: 75, damageMin: 3, damageMax: 4 });
    expect(projectWorldOpportunity(world(JUPITER), own).source.biomeKey).toBe('stillblue');
    // No biome at all: the ladder of the parent type.
    expect(odds(JUPITER, 'gas', 'cold', rules({ biome: null }))).toMatchObject({ biomeKey: null, biomeLanding: null, baseSuccessPercent: 65 });
  });

  it('the worn gear tuned to a world is the family the rules name', () => {
    const suit = wearing({ suit: 'presshull' });
    expect(suit.landingFamilyBonus.gas).toBeGreaterThan(0);
    const waveOffs = loadDescentWaveOffAuthorityV1({ extensions: {}, legacyWaveOffs: [] });
    if (waveOffs.kind !== 'loaded') throw new Error('no wave-off state');
    const approach = (ruled: WorldOpportunityRules | null) => projectDescentApproachV1({
      address: world(MARS), opportunity: projectWorldOpportunity(world(MARS), ruled), capabilities: suit, waveOffs: waveOffs.state,
      stormActive: false, reinforcedHull: false, trainingActive: false, alreadyLanded: false,
    });
    expect(approach(null).familyGearBonus).toBe(0);
    expect(approach(PARENT).familyGearBonus).toBe(0);
    expect(approach(rules({ landFamily: 'gas' })).familyGearBonus).toBe(suit.landingFamilyBonus.gas);
    expect(approach(rules({ landFamily: 'gas', landing: { fixed: { p: 40, lo: 5, hi: 7 } } })).successPercent).toBe(40 + suit.landingSuccessBonus + suit.landingFamilyBonus.gas);
  });

  it('a list of three with three picked is those three; a longer list is picked from by the legacy picker; half the reserve is half, rounded', () => {
    const legacy = projectWorldOpportunity(world(MARS), null);
    // Three materials Mars's own list does not hold.
    const three = projectWorldOpportunity(world(MARS), rules({ deposits: ['C', 'He3', 'W'], depositCount: 3, reserveMul: 0.5 }));
    expect([...three.deposits].filter((symbol) => symbol !== 'Ag').sort()).toEqual(['C', 'He3', 'W']);
    expect(three.reservePulls).toBe(Math.round(legacy.reservePulls * 0.5));
    expect(three).toMatchObject({ rawTier: legacy.rawTier, effectiveTier: legacy.effectiveTier, cosmicVein: legacy.cosmicVein });
    // The same places of the same stream: a list as long as the parent's, picked from at the legacy positions.
    const parent: readonly string[] = DEPOSIT_PROFILES[legacy.depositProfile];
    const other: readonly string[] = DEPOSIT_PROFILES.lava;
    expect([legacy.depositProfile, parent.length, other.length]).toEqual(['desert', 8, 8]);
    const renamed = projectWorldOpportunity(world(MARS), rules({ deposits: other }));
    expect(renamed.deposits).toEqual(legacy.deposits.map((symbol) => (parent.includes(symbol) ? other[parent.indexOf(symbol)] : symbol)));
    expect(renamed.reservePulls).toBe(legacy.reservePulls);
    // A fixed count equal to the count the legacy game rolled changes nothing: the rolls after it stand where they did.
    const rolled = legacy.deposits.filter((symbol) => parent.includes(symbol)).length;
    expect(projectWorldOpportunity(world(MARS), rules({ depositCount: rolled })).deposits).toEqual(legacy.deposits);
    for (const seed of [VENUS, JUPITER, 131, 136]) {
      const own = projectWorldOpportunity(world(seed), null);
      const count = own.deposits.filter((symbol) => (DEPOSIT_PROFILES[own.depositProfile] as readonly string[]).includes(symbol)).length;
      expect(projectWorldOpportunity(world(seed), rules({ depositCount: count })).deposits, String(seed)).toEqual(own.deposits);
    }
  });

  it('a tier fixed at 0 is tier 0 for the veins and the reserve, whatever the world rolled', () => {
    const flat = projectWorldOpportunity(world(EARTH), rules({ tierFixed: 0 }));
    expect(projectWorldOpportunity(world(EARTH), null)).toMatchObject({ rawTier: 5, effectiveTier: 5 });
    expect(flat).toMatchObject({ rawTier: 0, effectiveTier: 0 });
    expect(flat.reservePulls).toBeLessThan(800);
  });

  it('a trickle pays one unit on its share of pulls and leaves every pull\'s haul and rich strike as the legacy game\'s', () => {
    const legacy = pulls(MARS, null, 400);
    const ruled = pulls(MARS, rules({ trickle: { material: 'C', chance: 0.25, ownsStrike: false } }), 400);
    const paid = ruled.filter((pull, n) => {
      const more = over(tally(legacy[n]!.materials), tally(pull.materials));
      expect(more.C === undefined ? more : { C: more.C }, `pull ${n + 1}`).toEqual(more);
      expect(more.C ?? 0, `pull ${n + 1}`).toBeLessThanOrEqual(1);
      expect(pull.richStrikes).toBe(legacy[n]!.richStrikes);
      return more.C === 1;
    }).length;
    expect(legacy.reduce((sum, pull) => sum + pull.richStrikes, 0)).toBeGreaterThan(5);
    // 25% of 400 pulls, within four standard deviations.
    expect(paid).toBeGreaterThan(65);
    expect(paid).toBeLessThan(135);
    expect(pulls(MARS, rules({ trickle: { material: 'C', chance: 0, ownsStrike: false } }), 60)).toEqual(legacy.slice(0, 60));
  });

  it('a trickle that owns the strike makes every rich strike its own material, on the pulls the legacy game strikes', () => {
    const legacy = pulls(MARS, null, 400);
    const ruled = pulls(MARS, rules({ trickle: { material: 'Au', chance: 0, ownsStrike: true } }), 400);
    let strikes = 0;
    let turned = 0;
    ruled.forEach((pull, n) => {
      expect(pull.richStrikes).toBe(legacy[n]!.richStrikes);
      const more = over(tally(legacy[n]!.materials), tally(pull.materials));
      if (pull.richStrikes === 0) expect(more).toEqual({});
      else {
        strikes++;
        // The legacy pocket's unit is gone and one of gold is there, unless the legacy pocket was gold itself.
        expect(Object.values(more).reduce((sum, d) => sum + d, 0)).toBe(0);
        expect(tally(pull.materials).Au ?? 0).toBeGreaterThanOrEqual(1);
        if (more.Au === 1) turned++;
      }
    });
    expect(strikes).toBeGreaterThan(5);
    expect(turned).toBeGreaterThan(5);
  });

  it('a life key of the rules is the world\'s life: none empties a living world, and the snapshot says the same', () => {
    const living = canonicalWorldRoster(world(EARTH), 0, null);
    if (!living.ok) throw new Error(living.message);
    expect(living.roster.view.total).toBeGreaterThan(0);
    // A living world of the seeded stars, off Sol.
    const none = projectWorldOpportunity(world(MARS), rules({ lifeKey: 'microbial' }));
    expect(projectWorldOpportunity(world(MARS), null).source.biosphereKey).toBe('none');
    expect(none.source.biosphereKey).toBe('microbial');
    expect(none.rawTier).toBe(projectWorldOpportunity(world(MARS), null).rawTier);
    const seeded = canonicalWorldRoster(world(MARS), 0, { lifeKey: 'microbial' });
    if (!seeded.ok) throw new Error(seeded.message);
    expect(seeded.roster.biosphereKey).toBe('microbial');
    expect(seeded.roster.view.total).toBeGreaterThan(0);
    const bare = canonicalWorldRoster(world(MARS), 0, { lifeKey: 'none' });
    if (!bare.ok) throw new Error(bare.message);
    expect(bare.roster).toMatchObject({ biosphereKey: 'none', view: { total: 0 } });
  });

  it('weather of the rules: none is never a storm; a named weather storms on a world that has none of its own', () => {
    const times = Array.from({ length: 400 }, (_, i) => i * 37);
    const storms = (seed: number, type: string, band: string, weather?: 'none' | 'rain') =>
      times.filter((t) => descentWeather({ seed, type }, band, t, 'repaired', weather === undefined ? null : { weather, biome: 'parent' }).stormActive).length;
    expect(storms(VENUS, 'venus', 'hot')).toBeGreaterThan(20);
    expect(storms(VENUS, 'venus', 'hot', 'none')).toBe(0);
    expect(storms(MARS, 'rocky', 'cold')).toBe(0);
    expect(storms(MARS, 'rocky', 'cold', 'rain')).toBeGreaterThan(20);
    expect(descentWeather({ seed: MARS, type: 'rocky' }, 'cold', times.find((t) => descentWeather({ seed: MARS, type: 'rocky' }, 'cold', t, 'repaired', { weather: 'rain', biome: 'parent' }).stormActive)!, 'repaired', { weather: 'rain', biome: 'parent' }).token).toBe('rain');
  });
});

describe('what a rule set changes is read the same by every reader', () => {
  const seeds = Array.from({ length: 3000 }, (_, i) => hashInt(0x5EED, i, 7));
  const veins = (planetSeed: number, ruled: WorldOpportunityRules | null, biomeKey: string | null = null) => worldVeinsBySeed({
    planetSeed, planetType: 'rocky', biosphereLevel: 'No known life', biomeKey, earth: false, depthBoost: 0, tierCap: 14, rules: ruled,
  });

  it('the snapshot is schema v4, which carries the trickle and the descent rules', () => {
    expect(WORLD_OPPORTUNITY_SCHEMA).toBe('cf-v2-world-opportunity/v4');
    expect(Object.keys(projectWorldOpportunity(world(MARS), null))).toEqual(expect.arrayContaining(['schema', 'trickle', 'descentRules']));
    expect(projectWorldOpportunity(world(MARS), null).schema).toBe('cf-v2-world-opportunity/v4');
  });

  it('a type\'s own biome has no vein of the parent biome\'s: the veins by seed and the snapshot say the same', () => {
    const own = rules({ biome: { k: 'stillblue', n: 'Still-Blue giant', land: 75 } });
    expect([veins(1, null, 'geode').biomeVein, veins(1, PARENT, 'geode').biomeVein, veins(1, own, 'geode').biomeVein, veins(1, rules({ biome: null }), 'geode').biomeVein])
      .toEqual(['Nd', 'Nd', null, null]);
    // A real world whose legacy biome has a vein.
    const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 }, planet: { seed: 171668249 } });
    if (!resolved.ok) throw new Error(resolved.reason);
    const legacy = projectWorldOpportunity(resolved.address, null);
    expect(legacy.biomeVein).not.toBeNull();
    const ruled = projectWorldOpportunity(resolved.address, own);
    expect(ruled.biomeVein).toBeNull();
    const bySeed = worldVeinsAt(resolved.address, { ...legacy.source, earth: false, rules: own });
    expect({ ...bySeed }).toEqual({
      rawTier: ruled.rawTier, effectiveTier: ruled.effectiveTier, depositProfile: ruled.depositProfile, deposits: ruled.deposits,
      biomeVein: ruled.biomeVein, cosmicVein: ruled.cosmicVein, exceptionalVein: ruled.exceptionalVein, trickle: ruled.trickle, reservePulls: ruled.reservePulls,
    });
  });

  it('a typed world\'s exceptional vein is one of its own deposits, never a material of the parent\'s list', () => {
    const own = rules({ deposits: ['H', 'He', 'CH4', 'NH3', 'He3', 'H2O', 'N'] });
    const held = seeds.map((seed) => veins(seed, own)).filter((read) => read.exceptionalVein !== null);
    expect(held.length).toBeGreaterThan(300);
    for (const read of held) expect(read.deposits).toContain(read.exceptionalVein);
  });

  it('a reserve times a half is rounded, not cut: odd reserves round up', () => {
    const half = rules({ reserveMul: 0.5 });
    const odd = seeds.filter((seed) => veins(seed, null).reservePulls % 2 === 1);
    expect(odd.length).toBeGreaterThan(500);
    for (const seed of odd.slice(0, 200)) expect(veins(seed, half).reservePulls).toBe((veins(seed, null).reservePulls + 1) / 2);
    const third = rules({ reserveMul: 0.35 });
    for (const seed of seeds.slice(0, 200)) expect(veins(seed, third).reservePulls).toBe(Math.round(veins(seed, null).reservePulls * 0.35));
  });

  it('a world with a trickle and the same world without one are two worlds to a mining receipt, even where the trickle never pays', () => {
    const plan = (ruled: WorldOpportunityRules | null) => {
      const nav = navFromCanonicalCF1Address(world(MARS));
      if (!nav.ok || nav.state.mode !== 'surface') throw new Error('no surface');
      const made = planWorldMining({ state: createEngineeringState(), opportunity: projectWorldOpportunity(world(MARS), ruled), currentSurface: nav.state, capabilities: wearing(), activePlay: { activePlayMs: 0 }, receiptOrdinal: 1 });
      if (made.status !== 'planned') throw new Error(made.reason);
      return made;
    };
    const [bare, kept, silent] = [plan(null), plan(PARENT), plan(rules({ trickle: { material: 'C', chance: 0, ownsStrike: false } }))];
    expect(silent.result).toEqual(bare.result);
    expect(kept.witness).toBe(bare.witness);
    expect(silent.witness).not.toBe(bare.witness);
  });

  it('the weather event of a descent is asked over the type\'s own biome: iron rain falls on a gas giant only where its biome is the hot glow', () => {
    const jupiter = { seed: JUPITER, type: 'gas' };
    const event = (t: number, biome: WeatherRules['biome'] | undefined) => descentWeather(jupiter, 'cold', t, 'repaired', biome === undefined ? null : { weather: 'parent', biome }).event;
    const times = Array.from({ length: 400 }, (_, i) => i * 90);
    expect(times.filter((t) => event(t, undefined) === 'ironrain')).toEqual([]);
    expect(times.filter((t) => event(t, 'parent') === 'ironrain')).toEqual([]);
    expect(times.filter((t) => event(t, { k: 'hotglow' }) === 'ironrain').length).toBeGreaterThan(20);
    expect(times.filter((t) => event(t, null) !== event(t, undefined))).toEqual([]);
  });
});

describe('a rule set is checked as it enters, and refused by name', () => {
  const refusal = (over: Partial<WorldOpportunityRules>): string => {
    try { projectWorldOpportunity(world(MARS), rules(over)); } catch (error) { return error instanceof WorldRulesRefused ? error.refusal : `other: ${String(error)}`; }
    return 'accepted';
  };
  it.each([
    ['a reserve a thousand times over', { reserveMul: 1000 }, 'reserve'],
    ['a reserve past the margin', { reserveMul: 1.16 }, 'reserve'],
    ['a reserve of nothing', { reserveMul: 0 }, 'reserve'],
    ['a material the game does not have, in a list', { deposits: ['Fe', 'NotAMaterial'] }, 'material'],
    ['a material the game does not have, as a trickle', { trickle: { material: 'NotAMaterial', chance: 0.2, ownsStrike: false } }, 'material'],
    ['a trickle on five pulls in one', { trickle: { material: 'C', chance: 5, ownsStrike: false } }, 'trickle'],
    ['a landing of 250%', { landing: { fixed: { p: 250, lo: 4, hi: 5 } } }, 'landing'],
    ['a scrape below nothing', { landing: { fixed: { p: 60, lo: -2, hi: 5 } } }, 'landing'],
    ['a scrape whose most is under its least', { landing: { fixed: { p: 60, lo: 5, hi: 4 } } }, 'landing'],
    ['a floor past 100', { landing: { delta: -5, floor: 120 } }, 'landing'],
    ['a biome that lands at 130', { biome: { k: 'x', n: 'X', land: 130 } }, 'biome'],
    ['an empty list', { deposits: [] }, 'deposits'],
    ['a list of one', { deposits: ['Fe'] }, 'deposits'],
    ['a list that names a material twice', { deposits: ['Fe', 'Fe', 'Ni'] }, 'deposits'],
    ['a count over the list', { deposits: ['Fe', 'Ni'], depositCount: 3 }, 'deposit-count'],
    ['a count of one', { depositCount: 1 }, 'deposit-count'],
    ['a family no gear is tuned to', { landFamily: 'ocean' as never }, 'land-family'],
    ['a life key of nothing', { lifeKey: '' }, 'life'],
    ['a tier fixed above 0', { tierFixed: 3 as never }, 'tier'],
  ] as const)('%s is refused: %o → %s', (_name, over, named) => {
    expect(refusal(over as Partial<WorldOpportunityRules>)).toBe(named);
  });

  it('the bounds themselves are accepted: a reserve at the margin, a landing of 0 and of 100, a list of two, a trickle on every pull', () => {
    expect([refusal({ reserveMul: 1.15 }), refusal({ landing: { fixed: { p: 0, lo: 0, hi: 0 } } }), refusal({ landing: { fixed: { p: 100, lo: 6, hi: 8 } } }),
      refusal({ deposits: ['Fe', 'C'], depositCount: 2 }), refusal({ trickle: { material: 'Au', chance: 1, ownsStrike: true } })]).toEqual(Array(5).fill('accepted'));
    expect(WORLD_RULES_RESERVE_MAX).toBe(1.15);
  });

  it('the veins by seed, the type\'s own rules for a world and a snapshot asked with no answer at all refuse too', () => {
    expect(() => worldVeinsBySeed({ planetSeed: 1, planetType: 'rocky', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14, rules: rules({ reserveMul: 9 }) })).toThrow(WorldRulesRefused);
    expect(() => (projectWorldOpportunity as (address: unknown) => unknown)(world(MARS))).toThrow(/NO_WORLD_RULES/);
    expect(() => (worldVeinsBySeed as (input: unknown) => unknown)({ planetSeed: 1, planetType: 'rocky', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14 })).toThrow(/NO_WORLD_RULES/);
    expect(NO_WORLD_RULES).toBeNull();
    const greedy: WorldTypeDefinition = {
      key: 'megaEarth', label: 'Greedy', slice: [{ name: 'any', test: () => true }], source: null, bodies: null, rogue: null,
      rules: { key: 'megaEarth', label: 'Greedy', biomes: 'parent', landing: null, weather: 'parent', landFamily: 'parent', life: 'parent', deposits: 'parent', reserveMul: 9, card: { rows: [], replace: [] } },
    };
    expect(() => playRulesFor({ P: { seed: 7, type: 'terran' }, band: 'temperate', sol: false }, SWITCHES_ON, [greedy])).toThrow(WorldRulesRefused);
  });
});

describe('the app\'s seam asks the game\'s own switches, and they are all off', () => {
  it('types with rules for every world rule none of Sol while the game\'s switches are off', () => {
    const everywhere: WorldTypeDefinition[] = (['iceGiant', 'hycean', 'megaEarth', 'dwarf', 'rogue', 'double', 'greatMoon', 'trojan', 'protoplanet', 'shattered', 'smallBody', 'artefact', 'eccentric'] as const).map((key) => ({
      key, label: 'Everywhere', slice: [{ name: 'any', test: () => true }], source: null, bodies: null, rogue: null,
      rules: { key, label: 'Everywhere', biomes: 'parent', landing: { fixed: { p: 60, lo: 4, hi: 5 } }, weather: 'none', landFamily: 'parent', life: 'parent', deposits: 'parent', reserveMul: 1, card: { rows: [], replace: [] } },
    }));
    for (const seed of [131, VENUS, EARTH, MARS, JUPITER, 136, 137, 138]) expect(worldRulesAt(world(seed), everywhere), String(seed)).toBeNull();
    // The same types answer when their switches are on: the registry is read.
    const system = systemFor(424242);
    expect(playRulesFor({ P: system.planets[0]!.P as PlanetNumbers, band: 'hot', sol: true }, SWITCHES_ON, everywhere)?.landing).toEqual({ fixed: { p: 60, lo: 4, hi: 5 } });
  });
});

describe('the rules of one world, worked out from its type\'s', () => {
  const STREAM = declareStream('world-rules test', 0x7E58, 5);
  const BASE: WorldRules = {
    key: 'hycean', label: 'Test sea', biomes: [{ k: 'testsea', n: 'Test sea', w: 1, land: 60, f: 'sea' }], biomeStream: STREAM,
    landing: null, weather: 'parent', landFamily: 'gas', life: 'parent', deposits: 'parent', reserveMul: 1, card: { rows: [], replace: [] },
  };
  const type = (over: Partial<WorldRules>): WorldTypeDefinition => ({
    key: 'hycean', label: 'Test sea', slice: [{ name: 'ocean', test: (P) => P.type === 'ocean' }], source: null, bodies: null, rogue: null, rules: { ...BASE, ...over },
  });
  /** The hot ocean worlds of the first seeded systems, with the legacy game's own life key for each. */
  const hotOceans = (() => {
    const found: { P: PlanetNumbers; legacy: string }[] = [];
    for (let i = 0; found.length < 60; i++) {
      const system = systemFor(censusStarSeed(i));
      for (const planet of system.planets) {
        const band = climateBand(planet.P, system, planet.orb);
        if (planet.P.type !== 'ocean' || band !== 'hot') continue;
        found.push({ P: planet.P as PlanetNumbers, legacy: biosphere(planet.P as PlanetNumbers, system as { sol?: boolean }, band, mulberry32(((planet.P as PlanetNumbers).seed ^ 0x1234567) >>> 0)).key });
      }
    }
    return found;
  })();

  it('a life rule is handed the one value the legacy life roll reads: the legacy thresholds on it give the legacy life of every hot ocean world', () => {
    // LEGACY 4962: under 0.01 creatures, under 0.35 microbial, else none.
    const asLegacy = type({ life: (v) => (v < 0.01 ? 'xfauna' : v < 0.35 ? 'microbial' : 'none') });
    const keys = new Set<string>();
    for (const { P, legacy } of hotOceans) {
      const key = playRulesFor({ P, band: 'hot', sol: false }, SWITCHES_ON, [asLegacy])!.lifeKey;
      expect(key, String(P.seed)).toBe(legacy);
      keys.add(key);
    }
    expect([...keys]).toEqual(expect.arrayContaining(['microbial', 'none']));
  });

  it('a life rule is handed the world\'s own band', () => {
    const byBand = type({ life: (_v, band) => (band === 'hot' ? 'aquatic' : band === 'cold' ? 'subsurface' : 'none') });
    const P = hotOceans[0]!.P;
    expect(['hot', 'cold', 'temperate'].map((band) => playRulesFor({ P, band, sol: false }, SWITCHES_ON, [byBand])!.lifeKey)).toEqual(['aquatic', 'subsurface', 'none']);
  });

  it('Sol, Earth and seed 134 keep the legacy life whatever the rule; a switch that is off gives no rules', () => {
    const sea = type({ life: () => 'aquatic' });
    const P = hotOceans[0]!.P;
    expect(playRulesFor({ P, band: 'hot', sol: false }, SWITCHES_ON, [sea])).toMatchObject({ lifeKey: 'aquatic', label: 'Test sea', biome: { k: 'testsea', land: 60 }, landFamily: 'gas' });
    expect(playRulesFor({ P, band: 'hot', sol: true }, SWITCHES_ON, [sea])!.lifeKey).toBe('parent');
    for (const seed of [133, 134]) expect(playRulesFor({ P: { ...P, seed }, band: 'hot', sol: false }, SWITCHES_ON, [sea])!.lifeKey).toBe('parent');
    expect(playRulesFor({ P, band: 'hot', sol: false }, SWITCHES_ON, [type({ life: 'none' })])!.lifeKey).toBe('none');
    expect(playRulesFor({ P, band: 'hot', sol: false }, SWITCHES_OFF, [sea])).toBeNull();
    expect(playRulesFor({ P: { ...P, type: 'rocky' }, band: 'hot', sol: false }, SWITCHES_ON, [sea])).toBeNull();
  });
});
