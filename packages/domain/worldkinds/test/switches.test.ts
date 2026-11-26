// The switches, the registry of the thirteen types and the seam a world is read through. No type has rules yet,
// so the rule set is tried with types that exist only here.
import { describe, expect, it } from 'vitest';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  CENSUS_SOL_SEED,
  SWITCHES_OFF,
  SWITCHES_ON,
  WORLD_TYPES,
  WORLD_TYPE_KEYS,
  censusSystems,
  censusWorld,
  declareStream,
  effectiveWorld,
  extraBodies,
  gameCensusSources,
  legacyFactsOf,
  rogueBody,
  rulesFor,
  sliceOf,
  type BodyRecord,
  type CensusWorld,
  type WorldRules,
  type WorldSwitches,
  type WorldTypeDefinition,
} from '../src/index.js';

const game = gameCensusSources(() => ({ percent: 50, damageMin: 4, damageMax: 6 }));
const sol = (ordinal: number): CensusWorld => censusWorld(game, CENSUS_SOL_SEED, ordinal);
const worlds = (count: number): CensusWorld[] => [...censusSystems(game, count)].flatMap((entry) => entry.worlds);
const only = (key: keyof WorldSwitches): WorldSwitches => ({ ...SWITCHES_OFF, [key]: true });
const slice = (world: CensusWorld, switches: WorldSwitches, registry?: readonly WorldTypeDefinition[]): string | null =>
  sliceOf(world.planet.P, world.survey.band, world.starSeed === CENSUS_SOL_SEED, switches, registry);

/** What a stream of these salts gives a seed, worked out apart from the package. */
const drawOf = (seed: number, a: number, b: number): number => mulberry32(hashInt(seed >>> 0, a, b) >>> 0)();
const TEST_STREAM = declareStream('test giant', 0x7E57, 3);

const RULES: WorldRules = {
  key: 'iceGiant',
  label: 'Test giant',
  biomes: [
    { k: 'testcalm', n: 'Calm test giant', w: 3, land: 70, f: 'calm' },
    { k: 'testwild', n: 'Wild test giant', w: 1, land: 20, f: 'wild' },
  ],
  biomeStream: TEST_STREAM,
  landing: null,
  weather: 'parent',
  landFamily: 'gas',
  hazard: 'gas',
  life: 'parent',
  deposits: 'parent',
  reserveMul: 1,
  card: { rows: [], replace: [] },
};
/** A type that exists only here: every small gas giant, with a biome set of its own. */
const TEST_TYPE: WorldTypeDefinition = {
  key: 'iceGiant',
  label: 'Test giant',
  slice: [
    { name: 'gas', test: (P) => P.type === 'gas' },
    { name: 'small', test: (P) => (P.sizeMul as number) < 1.9 },
  ],
  source: null,
  bodies: null,
  rogue: null,
  rules: RULES,
};

describe('the switches', () => {
  it('are thirteen types and the kind row, all off, and cannot be written', () => {
    expect(WORLD_TYPE_KEYS).toEqual(['iceGiant', 'hycean', 'megaEarth', 'dwarf', 'rogue', 'double', 'greatMoon',
      'trojan', 'protoplanet', 'shattered', 'smallBody', 'artefact', 'eccentric']);
    expect(Object.keys(SWITCHES_OFF).sort()).toEqual([...WORLD_TYPE_KEYS, 'kindRow'].sort());
    expect(Object.values(SWITCHES_OFF).every((on) => on === false)).toBe(true);
    expect(Object.values(SWITCHES_ON).every((on) => on === true)).toBe(true);
    expect(Object.isFrozen(SWITCHES_OFF) && Object.isFrozen(SWITCHES_ON)).toBe(true);
  });
});

describe('the registry', () => {
  it('holds each of the thirteen types once, in the order of the keys, and none has rules or bodies yet', () => {
    expect(WORLD_TYPES.map((type) => type.key)).toEqual(WORLD_TYPE_KEYS);
    for (const type of WORLD_TYPES) {
      expect(type.rules, type.key).toBeNull();
      expect(type.bodies, type.key).toBeNull();
      expect(type.rogue, type.key).toBeNull();
      expect(type.label.length, type.key).toBeGreaterThan(0);
    }
    expect(WORLD_TYPES.filter((type) => type.slice !== null).map((type) => type.key)).toEqual(['iceGiant', 'hycean', 'megaEarth']);
  });
});

describe('a planet\'s slice', () => {
  it('is none while the switches are off', () => {
    for (const world of worlds(2000)) expect(slice(world, SWITCHES_OFF)).toBeNull();
  });

  it('makes Neptune an ice giant by the rule alone, and not Jupiter, Saturn or Uranus', () => {
    expect(slice(sol(7), SWITCHES_ON)).toBe('iceGiant');
    expect(slice(sol(7), only('iceGiant'))).toBe('iceGiant');
    expect(slice(sol(7), only('hycean'))).toBeNull();
    for (const ordinal of [4, 5, 6]) expect(slice(sol(ordinal), SWITCHES_ON)).toBeNull();
    for (let ordinal = 0; ordinal < 7; ordinal++) expect(slice(sol(ordinal), SWITCHES_ON)).toBeNull();
  });

  it('is of the parent type the design names, and of one type only', () => {
    const parents: Record<string, string> = { iceGiant: 'gas', hycean: 'ocean', megaEarth: 'terran' };
    const seen = new Set<string>();
    for (const world of worlds(6000)) {
      const key = slice(world, SWITCHES_ON);
      if (key === null) continue;
      seen.add(key);
      expect(world.planet.P.type).toBe(parents[key]);
      expect(slice(world, only(key as keyof WorldSwitches))).toBe(key);
    }
    expect([...seen].sort()).toEqual(['hycean', 'iceGiant', 'megaEarth']);
  });

  it('an ice giant is small, blue and cold; a hycean or mega-Earth is large and passed its own stream', () => {
    for (const world of worlds(6000)) {
      const { P } = world.planet;
      const key = slice(world, SWITCHES_ON);
      if (key === 'iceGiant') {
        expect(P.sizeMul as number).toBeLessThan(1.9);
        expect(P.hue as number).toBeGreaterThanOrEqual(185);
        expect(P.hue as number).toBeLessThanOrEqual(225);
        expect(['cold', 'frozen']).toContain(world.survey.band);
      }
      if (key === 'hycean') {
        expect(P.sizeMul as number).toBeGreaterThan(1.15);
        expect(drawOf(P.seed, 0x4C3A, 13)).toBeLessThan(0.5);
      }
      if (key === 'megaEarth') {
        expect(P.sizeMul as number).toBeGreaterThan(1.2);
        expect(drawOf(P.seed, 0x3E6A, 17)).toBeLessThan(0.5);
      }
      if (P.type === 'ocean' && (P.sizeMul as number) > 1.15 && key === null) expect(drawOf(P.seed, 0x4C3A, 13)).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe('the rules of a world', () => {
  it('are the legacy game\'s for every world, with the switches off and on: no type has rules yet', () => {
    for (const world of worlds(3000)) {
      const read = { P: world.planet.P, band: world.survey.band, sol: world.starSeed === CENSUS_SOL_SEED };
      expect(rulesFor(read, SWITCHES_OFF)).toBeNull();
      expect(rulesFor(read, SWITCHES_ON)).toBeNull();
    }
  });

  it('are a type\'s own inside its slice while its switch is on, and at no other time', () => {
    const registry = [TEST_TYPE];
    let inside = 0;
    for (const world of worlds(1500)) {
      const read = { P: world.planet.P, band: world.survey.band, sol: false };
      const member = world.planet.P.type === 'gas' && (world.planet.P.sizeMul as number) < 1.9;
      if (member) inside++;
      expect(rulesFor(read, SWITCHES_ON, registry)).toBe(member ? RULES : null);
      expect(rulesFor(read, only('hycean'), registry)).toBeNull();
      expect(rulesFor(read, SWITCHES_OFF, registry)).toBeNull();
    }
    expect(inside).toBeGreaterThan(50);
  });
});

describe('the effective world', () => {
  it('is the legacy world, untouched, with the switches off and on', () => {
    for (const world of worlds(3000)) {
      const facts = legacyFactsOf(world, world.starSeed === CENSUS_SOL_SEED);
      const system = game.system(world.starSeed);
      expect(effectiveWorld(facts, system, SWITCHES_OFF)).toEqual({ ...facts, type: null, label: null });
      const on = effectiveWorld(facts, system, SWITCHES_ON);
      expect({ ...on, type: null }).toEqual({ ...facts, type: null, label: null });
      expect(on.type).toBe(slice(world, SWITCHES_ON));
    }
  });

  it('carries what the census read', () => {
    const neptune = sol(7);
    expect(legacyFactsOf(neptune, true)).toEqual({
      P: neptune.planet.P, band: 'cold', sol: true, biomeKey: neptune.biomeKey, landing: { percent: 50, damageMin: 4, damageMax: 6 },
      lifeKey: 'none', tier: neptune.veins.tier, deposits: neptune.veins.deposits, biomeVein: neptune.veins.biomeVein,
      cosmicVein: neptune.veins.cosmicVein, exceptionalVein: neptune.veins.exceptionalVein, reserve: neptune.veins.reserve,
    });
  });

  it('takes a type\'s own biome from the type\'s own stream, inside its slice, while its switch is on', () => {
    const registry = [TEST_TYPE];
    const picked: Record<string, number> = {};
    for (const world of worlds(4000)) {
      const facts = legacyFactsOf(world, false);
      const system = game.system(world.starSeed);
      const on = effectiveWorld(facts, system, SWITCHES_ON, registry);
      expect(effectiveWorld(facts, system, SWITCHES_OFF, registry)).toEqual({ ...facts, type: null, label: null });
      if (on.type === null) {
        expect(on).toEqual({ ...facts, type: null, label: null });
        continue;
      }
      expect(on).toEqual({ ...facts, type: 'iceGiant', label: 'Test giant', biomeKey: on.biomeKey });
      expect(on.biomeKey).toBe(drawOf(world.planet.P.seed, 0x7E57, 3) * 4 < 3 ? 'testcalm' : 'testwild');
      picked[on.biomeKey!] = (picked[on.biomeKey!] ?? 0) + 1;
    }
    // Three to one, by the weights.
    expect(picked.testcalm! / picked.testwild!).toBeGreaterThan(2.2);
    expect(picked.testcalm! / picked.testwild!).toBeLessThan(4);
  });

  it('gives no biome and a fixed landing where the rules say so', () => {
    const registry = [{ ...TEST_TYPE, rules: { ...RULES, biomes: null, landing: { fixed: { p: 60, lo: 4, hi: 5 } } } }];
    const world = worlds(4000).find((w) => slice(w, SWITCHES_ON, registry) !== null)!;
    const facts = legacyFactsOf(world, false);
    expect(effectiveWorld(facts, game.system(world.starSeed), SWITCHES_ON, registry)).toEqual({
      ...facts, type: 'iceGiant', label: 'Test giant', biomeKey: null, landing: { percent: 60, damageMin: 4, damageMax: 5 },
    });
  });

  it('refuses a biome set with no stream of its own', () => {
    const { biomeStream: _none, ...noSalt } = RULES;
    const registry = [{ ...TEST_TYPE, rules: noSalt }];
    const world = worlds(4000).find((w) => slice(w, SWITCHES_ON, registry) !== null)!;
    expect(() => effectiveWorld(legacyFactsOf(world, false), game.system(world.starSeed), SWITCHES_ON, registry)).toThrow(/own stream/);
  });
});

describe('the bodies a type adds', () => {
  const body: BodyRecord = { cls: 'trojan', seed: 7, parent: 1, index: 0, name: 'Test', orb: 100, P: { type: 'rocky', seed: 7, sizeMul: 0.5, ring: false, moons: 0 } };
  const WITH_BODY: WorldTypeDefinition = { ...TEST_TYPE, key: 'trojan', slice: null, rules: null, bodies: () => [body], rogue: () => body };

  it('are none in any system, and no starless world, with the switches off and on: no type makes one yet', () => {
    for (const entry of censusSystems(game, 500)) {
      expect(extraBodies(entry.starSeed, entry.system, SWITCHES_OFF)).toEqual([]);
      expect(extraBodies(entry.starSeed, entry.system, SWITCHES_ON)).toEqual([]);
    }
    expect(rogueBody(999, { k: 'rogue', x: 1, y: 2 }, SWITCHES_ON)).toBeNull();
  });

  it('are a type\'s own while its switch is on, and none while it is off', () => {
    const system = game.system(CENSUS_SOL_SEED);
    expect(extraBodies(CENSUS_SOL_SEED, system, only('trojan'), [WITH_BODY])).toEqual([body]);
    expect(extraBodies(CENSUS_SOL_SEED, system, only('dwarf'), [WITH_BODY])).toEqual([]);
    expect(extraBodies(CENSUS_SOL_SEED, system, SWITCHES_OFF, [WITH_BODY])).toEqual([]);
    expect(rogueBody(999, { k: 'rogue' }, only('trojan'), [WITH_BODY])).toBe(body);
    expect(rogueBody(999, { k: 'rogue' }, SWITCHES_OFF, [WITH_BODY])).toBeNull();
  });
});
