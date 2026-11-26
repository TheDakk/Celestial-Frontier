// No switch moves a world outside its slice. With every new-type switch off and with every one on, the legacy
// layer of every seeded world is the recorded legacy fingerprint, and the effective layer is the legacy record
// outside a slice. No type has rules yet, so today the effective layer is the legacy record inside a slice too.
// What the game's own production paths say of a world is held in apps/game/test/census-addressed.test.ts.
import { describe, expect, it } from 'vitest';
import {
  SWITCHES_OFF, SWITCHES_ON, WORLD_TYPE_KEYS, declareStream, effectiveWorld,
  type WorldRules, type WorldSwitches, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { WORLD_SWITCHES } from '../apps/game/src/world/switches';
import { loadCensusFixture } from './support/census';
import { switchCensus } from './support/census-switches';

const fixture = loadCensusFixture();
const want = fixture.gate;
const SMALL = 5000;
const small = fixture.perThousand.slice(0, SMALL / 1000);

const RULES: WorldRules = {
  key: 'iceGiant',
  label: 'Test giant',
  biomes: [
    { k: 'testcalm', n: 'Calm test giant', w: 3, land: 70, f: 'calm' },
    { k: 'testwild', n: 'Wild test giant', w: 1, land: 20, f: 'wild' },
  ],
  biomeStream: declareStream('test giant', 0x7E57, 3),
  landing: null,
  weather: 'parent',
  landFamily: 'gas',
  hazard: 'gas',
  life: 'parent',
  deposits: 'parent',
  reserveMul: 1,
  card: { rows: [], replace: [] },
};
const GAS = { name: 'gas', test: (P: { type: string }) => P.type === 'gas' };
/** A type that exists only here: the small gas giants, with a biome set of its own. */
const TEST_TYPE: WorldTypeDefinition = {
  key: 'iceGiant',
  label: 'Test giant',
  slice: [GAS, { name: 'small', test: (P) => (P.sizeMul as number) < 1.9 }],
  source: null,
  bodies: null,
  rogue: null,
  rules: RULES,
};

describe('the census with every switch off and with every switch on', () => {
  const off = switchCensus(want.planets, SWITCHES_OFF);
  const on = switchCensus(want.planets, SWITCHES_ON);

  it('the legacy layer is the recorded legacy fingerprint either way', () => {
    expect(off.legacy.total).toBe(want.total);
    expect(on.legacy.total).toBe(want.total);
    expect(on.legacy.perThousand).toEqual(fixture.perThousand.slice(0, want.planets / 1000));
    expect(on.legacy).toEqual(off.legacy);
  });

  it('the effective layer is the legacy record for every world, inside a slice and outside: no type has rules yet', () => {
    expect(off).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0, inside: {} });
    expect(on).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0 });
  });

  it('counts the three slices of planets among the first 20,000 worlds', () => {
    expect(want.planets).toBe(20000);
    expect(on.inside).toEqual({ iceGiant: 338, hycean: 184, megaEarth: 171 });
  });

  it('each switch alone leaves every world as it was', () => {
    for (const key of [...WORLD_TYPE_KEYS, 'kindRow'] as const) {
      const one = switchCensus(1000, { ...SWITCHES_OFF, [key]: true } as WorldSwitches);
      expect(one.legacy.perThousand, key).toEqual(fixture.perThousand.slice(0, 1));
      expect(one, key).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0 });
    }
  });

  it('the game\'s own switches are that census: no world is of a new type', () => {
    const game = switchCensus(SMALL, WORLD_SWITCHES);
    expect(game.legacy.perThousand).toEqual(small);
    expect(game).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0, inside: {} });
  });
});

describe('proved both ways with types that exist only here', () => {
  it('a type with rules changes the worlds inside its slice while its switch is on, and no other world', () => {
    const on = switchCensus(SMALL, SWITCHES_ON, [TEST_TYPE]);
    expect(on.legacy.perThousand).toEqual(small);
    expect(on.inside.iceGiant).toBeGreaterThan(200);
    expect(on.changedInside).toBe(on.inside.iceGiant);
    expect(on).toMatchObject({ changedOutside: 0, movedWhenOff: 0 });
    const off = switchCensus(SMALL, SWITCHES_OFF, [TEST_TYPE]);
    expect(off).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, inside: {} });
    expect(switchCensus(SMALL, { ...SWITCHES_OFF, hycean: true }, [TEST_TYPE])).toMatchObject({ changedInside: 0, changedOutside: 0 });
  });

  it('a type that would roll on a stream the legacy game draws from cannot be made', () => {
    // The legacy biome's own stream (13289), the deposits' (21262), the reserve's (21409).
    for (const [a, b] of [[0xB10E, 7], [0xE1E, 9], [0x2E5, 3]] as const) {
      expect(() => ({ ...RULES, biomeStream: declareStream('faulty', a, b) })).toThrow(/the legacy game draws there/);
    }
    // And the stream another type holds.
    expect(() => declareStream('faulty', 0x7E57, 3)).toThrow(/already test giant's/);
  });

  it('a type that writes to the system it is shown is refused, and the census after it is the legacy game\'s', () => {
    // As the legacy generator adds a dwarf planet (4062-4069): into the system's own record.
    const faulty: WorldTypeDefinition = {
      ...TEST_TYPE,
      key: 'trojan',
      slice: null,
      rules: null,
      bodies: (starSeed, system) => {
        const dwarfs = (system as { dwarfs?: unknown[] }).dwarfs ??= [];
        dwarfs.push({ name: 'Faulty', orb: 300, seed: starSeed });
        return [];
      },
    };
    expect(() => switchCensus(SMALL, SWITCHES_ON, [faulty])).toThrow(TypeError);
    expect(switchCensus(SMALL, SWITCHES_OFF, [faulty]).legacy.perThousand).toEqual(small);
  });

  it('a type that writes a planet\'s numbers while it is asked is refused, and Sol is as it was', () => {
    const faulty: WorldTypeDefinition = {
      ...TEST_TYPE,
      rules: null,
      slice: [{ name: 'writes', test: (P) => { (P as { hue?: number }).hue = 200; return false; } }],
    };
    expect(() => switchCensus(SMALL, SWITCHES_ON, [faulty])).toThrow(TypeError);
    expect(switchCensus(SMALL, SWITCHES_OFF).legacy.perThousand).toEqual(small);
  });

  it('a biome rerolled outside the type\'s slice is caught: a world outside the slice changes', () => {
    // The type says its slice is the small giants; its rules are laid over every giant.
    const wide = [{ ...TEST_TYPE, slice: [GAS] }];
    const on = switchCensus(SMALL, SWITCHES_ON, [TEST_TYPE], (world, sys, switches) => effectiveWorld(world, sys, switches, wide));
    expect(on.changedOutside).toBeGreaterThan(500);
    expect(on.legacy.perThousand).toEqual(small);
  });

  it('a seam that moves a world with every switch off is caught', () => {
    const on = switchCensus(1000, SWITCHES_OFF, [TEST_TYPE], (world, sys, switches, registry) => ({ ...effectiveWorld(world, sys, switches, registry), reserve: world.reserve + 1 }));
    expect(on.movedWhenOff).toBe(1000);
  });
});
