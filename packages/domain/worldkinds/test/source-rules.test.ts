// The new types' own source rules, as outcomes: how often each rule holds over a seeded sample, against the rate its
// design states, and where it never holds. Each roll is the type's own declared stream on a seed, so the sample is
// the seeds 1, 2, 3 and on: the same on every run. A count must lie within four standard deviations of the stated
// rate (the spread of that many fair draws), and it is pinned as well, so any change of a chance or a stream shows.
// 200,000 draws tell 4% (8,000, give or take 351) from 5% (10,000) and from 3.8% (7,600).
import { describe, expect, it } from 'vitest';
import {
  WORLD_TYPES, censusStarSeed, censusSystem, gameCensusSources, inSlice, sourceCounts,
  type CensusPlanet, type CensusSystem, type WorldTypeKey,
} from '../src/index.js';

const typeOf = (key: WorldTypeKey) => WORLD_TYPES.find((type) => type.key === key)!;
const made = (fields: Record<string, unknown>): CensusSystem => ({ kind: 'G', planets: [], ...fields }) as CensusSystem;
const planet = (seed: number, type: string, sizeMul: number, moons = 0): CensusPlanet => ({ orb: 300, P: { seed, type, sizeMul, moons } });

/** The sum of one step of a type's source rule over the star seeds 1 to `sample`, each with the system made for it. */
function counted(key: WorldTypeKey, step: number, sample: number, system: (seed: number) => CensusSystem): number {
  const type = typeOf(key);
  let total = 0;
  for (let seed = 1; seed <= sample; seed++) total += sourceCounts(type, seed, system(seed))[step]!;
  return total;
}

/** Four standard deviations of `sample` fair draws at `rate`. */
const spread = (sample: number, rate: number): number => 4 * Math.sqrt(sample * rate * (1 - rate));

function expectRate(count: number, sample: number, rate: number): void {
  expect(count, `${count} of ${sample} at a stated ${rate}`).toBeGreaterThanOrEqual(sample * rate - spread(sample, rate));
  expect(count, `${count} of ${sample} at a stated ${rate}`).toBeLessThanOrEqual(sample * rate + spread(sample, rate));
}

const PIN_TROJAN = 7947;
const PIN_PROTO = [60099, 83821, 50476, 5604];
const PIN_SHATTERED = 5971;
const PIN_ASTEROID = 59889;
const PIN_ARTEFACT = 509;
const PIN_ECCENTRIC = 10040;
const PIN_HALVES = [49948, 50190];
/** The first 5,000 systems of the seeded census (Sol and 4,999 seeded): each step of each rule, in its file's order. */
const PIN_CENSUS = {
  dwarf: [2553],
  double: [1325],
  trojan: [4207, 2639, 106],
  protoplanet: [121, 92, 140],
  shattered: [1380, 45],
  smallBody: [3621, 803, 408],
  artefact: [1651, 0],
  eccentric: [4999, 66],
};

const BELT = made({ kind: 'K', belt: { r: 200 } });

describe('how often a new type\'s source rule holds, against the rate its design states', () => {
  it('a trojan world: 4% of 200,000 large seeded gas giants', () => {
    const count = counted('trojan', 2, 200000, (seed) => made({ planets: [planet(seed, 'gas', 2.4)] }));
    // 8,000, give or take 351: 5% would be 10,000 and 3% 6,000.
    expectRate(count, 200000, 0.04);
    expect(count).toBe(PIN_TROJAN);
  });

  it('a protoplanet: 70% of 200,000 protostars hold one, 40% of those a second, 10% of those a third', () => {
    const type = typeOf('protoplanet');
    const disk = made({ kind: 'PROTO' });
    const holding = [0, 0, 0, 0];
    let total = 0;
    let odd = 0;
    for (let seed = 1; seed <= 200000; seed++) {
      const [stars, held, protoplanets] = sourceCounts(type, seed, disk) as [number, number, number];
      if (stars !== 1 || held !== (protoplanets > 0 ? 1 : 0)) odd++;
      holding[protoplanets]!++;
      total += protoplanets;
    }
    // Each is a protostar, and one that holds any protoplanet is counted as holding one.
    expect(odd).toBe(0);
    const [none, one, two, three] = holding as [number, number, number, number];
    expect(total).toBe(one + 2 * two + 3 * three);
    const first = one + two + three;
    const second = two + three;
    expectRate(first, 200000, 0.7);
    expectRate(second, first, 0.4);
    expectRate(three, second, 0.1);
    expect([none, one, two, three]).toEqual(PIN_PROTO);
  });

  it('a shattered world: 3% of 200,000 seeded belts', () => {
    const count = counted('shattered', 1, 200000, () => BELT);
    expectRate(count, 200000, 0.03);
    expect(count).toBe(PIN_SHATTERED);
  });

  it('a large asteroid: 30% of 200,000 seeded belts', () => {
    const count = counted('smallBody', 2, 200000, () => BELT);
    expectRate(count, 200000, 0.3);
    expect(count).toBe(PIN_ASTEROID);
  });

  it('an artefact world: 1 in 3,000 of 1,500,000 orange, yellow and white stars', () => {
    const kinds = [made({ kind: 'K' }), made({ kind: 'G' }), made({ kind: 'A' })];
    const count = counted('artefact', 1, 1500000, (seed) => kinds[seed % 3]!);
    // 500, give or take 89: 1 in 2,400 would be 625 and 1 in 4,000 would be 375.
    expectRate(count, 1500000, 1 / 3000);
    expect(count).toBe(PIN_ARTEFACT);
  });

  it('an eccentric world: 1 in 60 of 600,000 seeded systems', () => {
    const count = counted('eccentric', 1, 600000, () => BELT);
    expectRate(count, 600000, 1 / 60);
    expect(count).toBe(PIN_ECCENTRIC);
  });

  it('a hycean world and a mega-Earth: half of 100,000 large ocean and large terran worlds', () => {
    let hycean = 0;
    let mega = 0;
    for (let seed = 1; seed <= 100000; seed++) {
      if (inSlice(typeOf('hycean'), planet(seed, 'ocean', 1.3).P, 'temperate', false)) hycean++;
      if (inSlice(typeOf('megaEarth'), planet(seed, 'terran', 1.3).P, 'temperate', false)) mega++;
    }
    expectRate(hycean, 100000, 0.5);
    expectRate(mega, 100000, 0.5);
    expect([hycean, mega]).toEqual(PIN_HALVES);
  });
});

describe('where a new type\'s source rule never holds', () => {
  const none = (key: WorldTypeKey, step: number, system: (seed: number) => CensusSystem): void => {
    expect(counted(key, step, 20000, system), key).toBe(0);
  };

  it('a trojan world: at no small giant, at no world that is not a gas giant, and nowhere in Sol', () => {
    none('trojan', 2, (seed) => made({ planets: [planet(seed, 'gas', 1.99)] }));
    none('trojan', 2, (seed) => made({ planets: [planet(seed, 'ocean', 2.4)] }));
    none('trojan', 2, (seed) => made({ sol: true, planets: [planet(seed, 'gas', 2.4)] }));
    // A giant of exactly 2.0 is large; two large giants of one system are rolled apart, each on its own seed.
    expect(counted('trojan', 1, 100, (seed) => made({ planets: [planet(seed, 'gas', 2.0), planet(seed, 'gas', 1.99)] }))).toBe(100);
    expect(counted('trojan', 2, 20000, (seed) => made({ planets: [planet(seed, 'gas', 2.4), planet(seed + 20000, 'gas', 2.4)] })))
      .toBe(counted('trojan', 2, 40000, (seed) => made({ planets: [planet(seed, 'gas', 2.4)] })));
  });

  it('a protoplanet: at no star but a protostar', () => {
    for (const kind of ['M', 'K', 'G', 'A', 'B', 'BD', 'RG', 'WD', 'SG', 'NS', 'BH', 'MAG']) none('protoplanet', 2, () => made({ kind }));
  });

  it('a shattered world and a large asteroid: in no system without a belt, and not in Sol\'s', () => {
    for (const [key, step] of [['shattered', 1], ['smallBody', 2]] as const) {
      none(key, step, () => made({ kind: 'K' }));
      none(key, step, () => made({ kind: 'K', belt: null }));
      none(key, step, () => made({ kind: 'G', sol: true, belt: { r: 200 } }));
    }
  });

  it('an artefact world: at no star but an orange, a yellow or a white one, and not at Sol', () => {
    const held: number[] = [];
    for (let seed = 1; held.length < 40; seed++) if (sourceCounts(typeOf('artefact'), seed, made({ kind: 'G' }))[1] === 1) held.push(seed);
    for (const seed of held) {
      for (const kind of ['K', 'G', 'A']) expect(sourceCounts(typeOf('artefact'), seed, made({ kind }))).toEqual([1, 1]);
      for (const kind of ['M', 'B', 'BD', 'RG', 'PROTO', 'WD', 'SG', 'NS', 'BH', 'MAG']) expect(sourceCounts(typeOf('artefact'), seed, made({ kind })), kind).toEqual([0, 0]);
      expect(sourceCounts(typeOf('artefact'), seed, made({ kind: 'G', sol: true }))).toEqual([0, 0]);
    }
  });

  it('an eccentric world: not in Sol', () => {
    none('eccentric', 1, () => made({ kind: 'G', sol: true }));
  });
});

describe('what a new type\'s source rule counts of what the legacy game already made', () => {
  it('dwarf planets, comets, a visitor, and the planets that could be a double\'s primary', () => {
    const system = made({
      dwarfs: [{}, {}, {}], comets: [{}, {}], visitor: {},
      planets: [planet(1, 'rocky', 1, 0), planet(2, 'gas', 2, 0), planet(3, 'ocean', 1, 2), planet(4, 'ice', 1, 0)],
    });
    expect(sourceCounts(typeOf('dwarf'), 9, system)).toEqual([3]);
    expect(sourceCounts(typeOf('smallBody'), 9, system).slice(0, 2)).toEqual([2, 1]);
    expect(sourceCounts(typeOf('double'), 9, system)).toEqual([2]);
    expect(sourceCounts(typeOf('double'), 9, { ...system, sol: true })).toEqual([0]);
    expect(sourceCounts(typeOf('dwarf'), 9, made({}))).toEqual([0]);
    expect(sourceCounts(typeOf('smallBody'), 9, made({})).slice(0, 2)).toEqual([0, 0]);
    expect(sourceCounts(typeOf('rogue'), 9, system)).toEqual([]);
  });

  it('moons that could be great: every moon the census reads but a captured asteroid, for 300 systems of the census', () => {
    const game = gameCensusSources(() => ({ percent: 0, damageMin: 0, damageMax: 0 }));
    const total = [0, 0, 0];
    for (let index = 0; index < 300; index++) {
      const entry = censusSystem(game, censusStarSeed(index));
      const moons = entry.worlds.map((world) => world.moons.filter((moon) => moon.type !== 'Captured asteroid').length);
      const want = [
        entry.worlds.reduce((n, world) => n + world.moons.length, 0),
        moons.reduce((n, eligible) => n + eligible, 0),
        moons.filter((eligible) => eligible > 0).length,
      ];
      expect(sourceCounts(typeOf('greatMoon'), entry.starSeed, entry.system), `star ${entry.starSeed}`).toEqual(want);
      want.forEach((n, i) => { total[i]! += n; });
    }
    // Sol is the first: Earth's moon is none of the four seeded types, and is counted as one that could be great.
    expect(total[0]).toBeGreaterThan(2500);
    expect(total[1]! / total[0]!).toBeGreaterThan(0.7);
    expect(total[1]! / total[0]!).toBeLessThan(0.8);
  });

  it('is pinned for the first 5,000 systems of the seeded census, switches aside', () => {
    const game = gameCensusSources(() => ({ percent: 0, damageMin: 0, damageMax: 0 }));
    const counts: Record<string, number[]> = {};
    for (const type of WORLD_TYPES) if (type.source !== null && type.key !== 'greatMoon') counts[type.key] = type.source.map(() => 0);
    for (let index = 0; index < 5000; index++) {
      const starSeed = censusStarSeed(index);
      const system = game.system(starSeed);
      for (const type of WORLD_TYPES) {
        const into = counts[type.key];
        if (into !== undefined) sourceCounts(type, starSeed, system).forEach((n, i) => { into[i]! += n; });
      }
    }
    expect(counts).toEqual(PIN_CENSUS);
  });
});
