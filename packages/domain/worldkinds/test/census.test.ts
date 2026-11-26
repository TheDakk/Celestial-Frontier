// The census line and fingerprint, read through this game's own world generation. The descent reader belongs to the
// app, so here it is a stand-in; tests/census.test.ts reads the real one and holds the legacy game's fingerprint.
import { describe, expect, it } from 'vitest';
import {
  CENSUS_SOL_SEED,
  CensusDigest,
  censusDigest,
  censusFingerprint,
  censusRow,
  censusStarSeed,
  censusSystem,
  censusSystemDigest,
  censusSystems,
  censusWorld,
  gameCensusSources,
  stableText,
  type CensusSources,
  type CensusSystem,
} from '../src/index.js';

const NO_DESCENT = (): { percent: number; damageMin: number; damageMax: number } => ({ percent: 0, damageMin: 0, damageMax: 0 });
const game = gameCensusSources(NO_DESCENT);

/** The game's readers, with one planet's parameters replaced. */
function withPlanet(starSeed: number, ordinal: number, change: (P: Record<string, unknown>) => Record<string, unknown>): CensusSources {
  return {
    ...game,
    system: (seed) => {
      const system = game.system(seed);
      if (seed !== starSeed) return system;
      const planets = system.planets.map((planet, i) => (i === ordinal ? { ...planet, P: change({ ...planet.P }) as typeof planet.P } : planet));
      return { ...system, planets } as CensusSystem;
    },
  };
}

/** The first world of each of the eight types among the census's seeded systems. */
function oneOfEachType(): { starSeed: number; ordinal: number; type: string }[] {
  const found = new Map<string, { starSeed: number; ordinal: number; type: string }>();
  for (const entry of censusSystems(game, 400)) {
    if (entry.starSeed === CENSUS_SOL_SEED) continue;
    for (const world of entry.worlds) {
      const type = world.planet.P.type;
      if (!found.has(type)) found.set(type, { starSeed: entry.starSeed, ordinal: world.ordinal, type });
    }
  }
  return [...found.values()];
}

describe('the census line', () => {
  it('holds Earth as the legacy game makes it', () => {
    const earth = censusWorld(game, CENSUS_SOL_SEED, 2);
    expect(earth.planet.name).toBe('Earth');
    expect(earth.survey.band).toBe('temperate');
    expect(earth.survey.life.key).toBe('earth');
    expect(earth.survey.civ.name).toBe('Humanity');
    expect(earth.biomeKey).toBeNull();
    expect(earth.veins.tier).toBe(5);
    expect(earth.moons).toEqual([{ type: 'Earth’s moon', name: 'The Moon' }]);
    expect(earth.row).toContain('|name="Earth"|orb=112|band=temperate|life=earth/');
    expect(earth.row).toContain('|kind="G"|planets=8|belt=166|dwarfs=2|comets=1|visitor=0|');
  });

  it('holds a barren Sol: Mars has no life though the legacy game calls it possibly microbial outside Sol', () => {
    expect(censusWorld(game, CENSUS_SOL_SEED, 3).survey.life.key).toBe('none');
  });

  it('is the same on a second reading', () => {
    for (let index = 0; index < 40; index++) {
      const starSeed = censusStarSeed(index);
      for (let ordinal = 0; ordinal < game.system(starSeed).planets.length; ordinal++) {
        expect(censusRow(game, starSeed, ordinal)).toBe(censusRow(game, starSeed, ordinal));
      }
    }
  });

  it('refuses a planet the star does not have', () => {
    expect(() => censusRow(game, CENSUS_SOL_SEED, 8)).toThrow(RangeError);
  });

  it('changes when any one key of a planet changes, for a world of each type', () => {
    const worlds = oneOfEachType();
    expect(worlds.map((w) => w.type).sort()).toEqual(['desert', 'gas', 'ice', 'lava', 'ocean', 'rocky', 'terran', 'venus']);
    const seen = new Set<string>();
    for (const { starSeed, ordinal } of worlds) {
      const plain = censusRow(game, starSeed, ordinal);
      const P = game.system(starSeed).planets[ordinal]!.P;
      for (const key of Object.keys(P)) {
        seen.add(key);
        const value = P[key];
        const planted = typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : `${String(value)}x`;
        expect(censusRow(withPlanet(starSeed, ordinal, (copy) => ({ ...copy, [key]: planted })), starSeed, ordinal), key).not.toBe(plain);
      }
      // What the renderer keeps on a planet once it is drawn is not the planet's numbers.
      expect(censusRow(withPlanet(starSeed, ordinal, (copy) => ({ ...copy, _pal: [[1, 2, 3]] })), starSeed, ordinal)).toBe(plain);
      // A key the legacy game never wrote is seen too.
      expect(censusRow(withPlanet(starSeed, ordinal, (copy) => ({ ...copy, added: 1 })), starSeed, ordinal)).not.toBe(plain);
    }
    expect([...seen].sort()).toEqual(['hue', 'iceAmt', 'landHue', 'moons', 'ring', 'seaHue', 'seed', 'sizeMul', 'spot', 'spotHue', 'type']);
  });

  it('changes when any reader answers differently', () => {
    const starSeed = censusStarSeed(1);
    const plain = censusRow(game, starSeed, 0);
    const changed = (over: Partial<CensusSources>): string => censusRow({ ...game, ...over }, starSeed, 0);
    expect(changed({})).toBe(plain);
    expect(changed({ survey: (p, s) => ({ ...game.survey(p, s), band: 'elsewhere' }) })).not.toBe(plain);
    expect(changed({ survey: (p, s) => ({ ...game.survey(p, s), life: { key: 'none', level: 'changed' } }) })).not.toBe(plain);
    expect(changed({ survey: (p, s) => ({ ...game.survey(p, s), civ: { civ: true, year: 7 } }) })).not.toBe(plain);
    expect(changed({ biome: () => 'changed' })).not.toBe(plain);
    expect(changed({ descent: () => ({ percent: 1, damageMin: 0, damageMax: 0 }) })).not.toBe(plain);
    expect(changed({ descent: () => ({ percent: 0, damageMin: 1, damageMax: 0 }) })).not.toBe(plain);
    expect(changed({ descent: () => ({ percent: 0, damageMin: 0, damageMax: 1 }) })).not.toBe(plain);
    for (const key of ['tier', 'reserve'] as const) {
      expect(changed({ veins: (p, s, v, b) => { const read = game.veins(p, s, v, b); return { ...read, [key]: read[key] + 1 }; } }), key).not.toBe(plain);
    }
    for (const key of ['biomeVein', 'cosmicVein', 'exceptionalVein'] as const) {
      expect(changed({ veins: (p, s, v, b) => ({ ...game.veins(p, s, v, b), [key]: 'Zz' }) }), key).not.toBe(plain);
    }
    expect(changed({ veins: (p, s, v, b) => { const read = game.veins(p, s, v, b); return { ...read, deposits: [...read.deposits].reverse() }; } })).not.toBe(plain);
    expect(changed({ system: (seed) => ({ ...game.system(seed), visitor: { ang: 1 } }) })).not.toBe(plain);
    expect(changed({ system: (seed) => ({ ...game.system(seed), added: 1 }) })).not.toBe(plain);
  });

  it('changes when a moon changes', () => {
    const jupiter = censusRow(game, CENSUS_SOL_SEED, 4);
    expect(jupiter).toContain('|moons=[["Volcanic moon","Io"],["Icy moon","Europa"],');
    expect(censusRow({ ...game, moon: (p, m) => (m === 7 ? { type: 'x', name: 'y' } : game.moon(p, m)) }, CENSUS_SOL_SEED, 4)).not.toBe(jupiter);
  });
});

describe('the census fingerprint', () => {
  it('agrees with itself on a second run', () => {
    expect(censusFingerprint(game, 2500)).toEqual(censusFingerprint(game, 2500));
  });

  it('starts at Sol and counts exactly the planets asked for', () => {
    const entries = [...censusSystems(game, 1000)];
    expect(entries[0]!.starSeed).toBe(CENSUS_SOL_SEED);
    expect(entries.reduce((n, entry) => n + entry.worlds.length, 0)).toBe(1000);
    const print = censusFingerprint(game, 2500);
    expect(print.planets).toBe(2500);
    expect(print.perThousand).toHaveLength(3);
    expect(Object.values(print.shares.types).reduce((a, b) => a + b, 0)).toBe(2500);
    expect(Object.values(print.shares.bands).reduce((a, b) => a + b, 0)).toBe(2500);
    expect(Object.values(print.shares.starKinds).reduce((a, b) => a + b, 0)).toBe(print.shares.systems);
  });

  it('a smaller census is the start of a larger one', () => {
    const small = censusFingerprint(game, 2000);
    const large = censusFingerprint(game, 3000);
    expect(large.perThousand.slice(0, 2)).toEqual(small.perThousand);
    expect(large.total).not.toBe(small.total);
  });

  it('one changed world changes its thousand and the total, and no other thousand', () => {
    const plain = censusFingerprint(game, 3000);
    const target = [...censusSystems(game, 1500)].at(-1)!;
    const print = censusFingerprint(withPlanet(target.starSeed, 0, (P) => ({ ...P, moons: 0 })), 3000);
    expect(print.total).not.toBe(plain.total);
    expect(print.perThousand[0]).toBe(plain.perThousand[0]);
    expect(print.perThousand[1]).not.toBe(plain.perThousand[1]);
    expect(print.perThousand[2]).toBe(plain.perThousand[2]);
  });

  it('a change in a system with no planets is seen', () => {
    const empty = [...censusSystems(game, 1000)].find((entry) => entry.system.planets.length === 0)!;
    expect(empty).toBeDefined();
    const plain = censusFingerprint(game, 1000);
    const print = censusFingerprint({ ...game, system: (seed) => (seed === empty.starSeed ? { ...game.system(seed), comets: [] } : game.system(seed)) }, 1000);
    expect(print.total).not.toBe(plain.total);
  });

  it('shows every system to the visitor, once, in order', () => {
    const seen: number[] = [];
    const print = censusFingerprint(game, 500, (entry) => { seen.push(entry.starSeed); });
    expect(seen).toHaveLength(print.shares.systems);
    expect(seen.slice(0, 3)).toEqual([censusStarSeed(0), censusStarSeed(1), censusStarSeed(2)]);
  });

  it('refuses a count that is not a whole number of planets', () => {
    expect(() => censusFingerprint(game, 0)).toThrow(RangeError);
    expect(() => censusFingerprint(game, 1.5)).toThrow(RangeError);
  });
});

describe('the census text', () => {
  it('writes equal values alike whatever the order of their keys', () => {
    expect(stableText({ b: 1, a: [true, null, 'x'] })).toBe('{a:[true,~,"x"],b:1}');
    expect(stableText({ a: [true, null, 'x'], b: 1 })).toBe('{a:[true,~,"x"],b:1}');
    expect(() => stableText(() => 1)).toThrow(TypeError);
  });

  it('writes null, a missing value, zero and minus zero each apart', () => {
    expect(new Set([null, undefined, 0, -0, '', '~', '?', false].map(stableText)).size).toBe(8);
    expect(stableText({ a: undefined })).not.toBe(stableText({ a: null }));
    expect(stableText({ a: undefined })).not.toBe(stableText({}));
  });

  it('tells apart texts that differ, where they are cut, and their order', () => {
    const digests = new Set(['', 'a', 'b', 'ab', 'ba', 'a|b', 'abc'].map(censusDigest));
    expect(digests.size).toBe(7);
    expect(new CensusDigest().add('ab').add('c').hex()).not.toBe(new CensusDigest().add('a').add('bc').hex());
    expect(new CensusDigest().add('ab').add('c').hex()).toBe(new CensusDigest().add('ab').add('c').hex());
    expect(censusDigest('a')).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('what else a line holds', () => {
  const starSeed = censusStarSeed(1);
  const plain = censusRow(game, starSeed, 0);
  const changed = (over: Partial<CensusSources>): string => censusRow({ ...game, ...over }, starSeed, 0);

  it('the rarity roll, the tier before the ring cap and the mix of landing regions', () => {
    expect(changed({ rarity: (p) => game.rarity(p) + 1 })).not.toBe(plain);
    expect(changed({ veins: (p, s, v, b) => { const read = game.veins(p, s, v, b); return { ...read, rawTier: read.rawTier + 1 }; } })).not.toBe(plain);
    expect(changed({ mix: () => null })).not.toBe(plain);
    expect(changed({ mix: (p, band) => game.mix(p, band)!.map(([key, part], i) => [key, i === 0 ? part + 1e-8 : part] as const) })).not.toBe(plain);
    expect(changed({ mix: (p, band) => [...game.mix(p, band)!].reverse() })).not.toBe(plain);
    const world = censusWorld(game, starSeed, 0);
    expect(world.mix!.reduce((sum, [, part]) => sum + part, 0)).toBeCloseTo(1, 9);
    expect(plain).toContain(`|roll=${world.rarity}|tier=${world.veins.rawTier}/${world.veins.tier}|`);
  });

  it('whatever more its reader gives, each fact by name', () => {
    const more = changed({ extras: () => [['card', ['Life', 'None']], ['title', 'A world']] });
    expect(more).toContain('|card=["Life","None"]|title="A world"|star=');
    expect(changed({ extras: () => [['card', ['Life', 'Some']], ['title', 'A world']] })).not.toBe(more);
    expect(changed({ extras: () => [] })).toBe(plain);
  });

  it('a moon whose name holds the line\'s own marks cannot pass for two moons', () => {
    const one = censusRow({ ...game, moon: () => ({ type: 'a', name: 'b;c:d' }) }, CENSUS_SOL_SEED, 2);
    const other = censusRow({ ...game, moon: () => ({ type: 'a', name: 'b"],["c' }) }, CENSUS_SOL_SEED, 2);
    expect(one).toContain('|moons=[["a","b;c:d"]]|');
    expect(other).not.toContain('["a","b"],["c"');
    expect(censusRow({ ...game, moon: () => ({ type: 'a|b', name: 'c' }) }, CENSUS_SOL_SEED, 2)).toContain('[["a|b","c"]]');
  });
});

describe('one system', () => {
  it('is its own line and every world of it, and its digest moves with any of them', () => {
    const sol = censusSystem(game, CENSUS_SOL_SEED);
    expect(sol.worlds.map((world) => world.planet.name)).toEqual(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    expect(sol.worlds[2]!.row).toBe(censusRow(game, CENSUS_SOL_SEED, 2));
    const digest = censusSystemDigest(sol);
    expect(censusSystemDigest(censusSystem(game, CENSUS_SOL_SEED))).toBe(digest);
    expect(censusSystemDigest(censusSystem(withPlanet(CENSUS_SOL_SEED, 7, (P) => ({ ...P, hue: 221 })), CENSUS_SOL_SEED))).not.toBe(digest);
    expect(censusSystemDigest(censusSystem({ ...game, system: (seed) => ({ ...game.system(seed), visitor: { ang: 1 } }) }, CENSUS_SOL_SEED))).not.toBe(digest);
  });
});

describe('the count of what was hit', () => {
  it('names, table by table, every entry the worlds read touched', () => {
    const { hits, shares } = censusFingerprint(game, 3000);
    expect(hits['planet type']).toEqual(shares.types);
    expect(hits['climate band']).toEqual(shares.bands);
    expect(hits['star kind']).toEqual(shares.starKinds);
    expect(Object.values(hits.tier!).reduce((a, b) => a + b, 0)).toBe(3000);
    expect(Object.values(hits['moon type']!).reduce((a, b) => a + b, 0)).toBe(shares.moons);
    expect(Object.keys(hits['exceptional vein']!).sort()).toEqual(['held', 'none']);
    expect(hits.biome!['gas: banded']).toBeGreaterThan(300);
    expect(hits['deposit of a type']!['gas: He3']).toBeGreaterThan(300);
    expect(hits.biome!['terran: none']).toBe(1);
    expect(Object.keys(hits)).toEqual([...Object.keys(hits)].sort());
  });
});
