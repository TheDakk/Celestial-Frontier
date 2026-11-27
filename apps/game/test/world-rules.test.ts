// A new world type's rules, plugged into the descent, the weather, the snapshot, the mining planner and the roster.
// With no rules every answer is the one given today; the recorded legacy answers (landing-descent, opportunity,
// census) hold that and are not touched. Here: a rule set gives exactly what it says, and nothing else moves.
import { describe, expect, it } from 'vitest';
import { biosphere } from '@cf/domain-ecology';
import {
  DEPOSIT_PROFILES, createEngineeringState, planWorldMining, projectWorldOpportunity,
  type EngineeringQuantity, type EngineeringStateV2, type WorldOpportunityRules,
} from '@cf/domain-opportunity';
import { mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import {
  SWITCHES_OFF, SWITCHES_ON, censusStarSeed, declareStream, playRulesFor,
  type PlanetNumbers, type WorldRules, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { navFromCanonicalCF1Address } from '@cf/scene';
import { descentOdds, descentWeather, projectDescentApproachV1 } from '../src/landing';
import { loadDescentWaveOffAuthorityV1 } from '@cf/persistence';
import { canonicalWorldRoster, worldRulesAt } from '../src/world';
import { wearing, world } from './descent-support';

const [VENUS, EARTH, MARS, JUPITER] = [132, 133, 134, 135] as const;

/** A rule set that changes nothing. */
const PARENT: WorldOpportunityRules = { biome: 'parent', landing: null, landFamily: 'parent', lifeKey: 'parent', deposits: 'parent', reserveMul: 1 };
const rules = (over: Partial<WorldOpportunityRules>): WorldOpportunityRules => ({ ...PARENT, ...over });

const odds = (seed: number, type: string, band: string, ruled?: WorldOpportunityRules) => descentOdds({
  planet: { seed, type }, band, stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
  ...(ruled === undefined ? {} : { rules: ruled }),
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
      const [bare, kept] = [projectWorldOpportunity(world(seed)), projectWorldOpportunity(world(seed), PARENT)];
      expect({ ...kept, descentRules: null }).toEqual(bare);
      expect(bare).toMatchObject({ trickle: null, descentRules: null });
      const { planetType, climateBand: band } = bare.source;
      expect(odds(seed, planetType, band, PARENT)).toEqual(odds(seed, planetType, band));
      expect(descentWeather({ seed, type: planetType }, band, 45, 'repaired', { weather: 'parent', biome: 'parent' })).toEqual(descentWeather({ seed, type: planetType }, band, 45));
    }
    expect(pulls(MARS, PARENT, 40)).toEqual(pulls(MARS, null, 40));
    expect(canonicalWorldRoster(world(EARTH), 0, { lifeKey: 'parent' })).toEqual(canonicalWorldRoster(world(EARTH), 0));
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
    const legacy = projectWorldOpportunity(world(MARS));
    const three = projectWorldOpportunity(world(MARS), rules({ deposits: ['Xa', 'Xb', 'Xc'], depositCount: 3, reserveMul: 0.5 }));
    expect([...three.deposits].filter((symbol) => symbol.startsWith('X')).sort()).toEqual(['Xa', 'Xb', 'Xc']);
    expect(three.reservePulls).toBe(Math.round(legacy.reservePulls * 0.5));
    expect(three).toMatchObject({ rawTier: legacy.rawTier, effectiveTier: legacy.effectiveTier, cosmicVein: legacy.cosmicVein });
    // The same places of the same stream: a list as long as the parent's, picked from at the legacy positions.
    const parent: readonly string[] = DEPOSIT_PROFILES[legacy.depositProfile];
    const renamed = projectWorldOpportunity(world(MARS), rules({ deposits: parent.map((symbol) => `X${symbol}`) }));
    expect(renamed.deposits).toEqual(legacy.deposits.map((symbol) => (parent.includes(symbol) ? `X${symbol}` : symbol)));
    expect(renamed.reservePulls).toBe(legacy.reservePulls);
    // A fixed count equal to the count the legacy game rolled changes nothing: the rolls after it stand where they did.
    const rolled = legacy.deposits.filter((symbol) => parent.includes(symbol)).length;
    expect(projectWorldOpportunity(world(MARS), rules({ depositCount: rolled })).deposits).toEqual(legacy.deposits);
    for (const seed of [VENUS, JUPITER, 131, 136]) {
      const own = projectWorldOpportunity(world(seed));
      const count = own.deposits.filter((symbol) => (DEPOSIT_PROFILES[own.depositProfile] as readonly string[]).includes(symbol)).length;
      expect(projectWorldOpportunity(world(seed), rules({ depositCount: count })).deposits, String(seed)).toEqual(own.deposits);
    }
  });

  it('a tier fixed at 0 is tier 0 for the veins and the reserve, whatever the world rolled', () => {
    const flat = projectWorldOpportunity(world(EARTH), rules({ tierFixed: 0 }));
    expect(projectWorldOpportunity(world(EARTH))).toMatchObject({ rawTier: 5, effectiveTier: 5 });
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
    const living = canonicalWorldRoster(world(EARTH), 0);
    if (!living.ok) throw new Error(living.message);
    expect(living.roster.view.total).toBeGreaterThan(0);
    // A living world of the seeded stars, off Sol.
    const none = projectWorldOpportunity(world(MARS), rules({ lifeKey: 'microbial' }));
    expect(projectWorldOpportunity(world(MARS)).source.biosphereKey).toBe('none');
    expect(none.source.biosphereKey).toBe('microbial');
    expect(none.rawTier).toBe(projectWorldOpportunity(world(MARS)).rawTier);
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

describe('the rules of one world, worked out from its type\'s', () => {
  const STREAM = declareStream('world-rules test', 0x7E58, 5);
  const BASE: WorldRules = {
    key: 'hycean', label: 'Test sea', biomes: [{ k: 'testsea', n: 'Test sea', w: 1, land: 60, f: 'sea' }], biomeStream: STREAM,
    landing: null, weather: 'parent', landFamily: 'gas', hazard: 'ocean', life: 'parent', deposits: 'parent', reserveMul: 1, card: { rows: [], replace: [] },
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
