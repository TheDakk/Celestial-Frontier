// What the game plays of every seeded world, read through the paths that take the switches (the descent odds and
// the veins, each handed the rules the switches give that world), is that world's legacy record: for every world
// with the game's own switches, and for every world outside a slice with any switches. The legacy record itself is
// held against the recorded legacy fingerprint in tests/census.test.ts and tests/census-switches.test.ts.
import { describe, expect, it } from 'vitest';
import {
  SWITCHES_OFF, SWITCHES_ON, declareStream, playRulesFor,
  type WorldRules, type WorldSwitches, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { WORLD_SWITCHES } from '../apps/game/src/world/switches';
import { loadCensusFixture } from './support/census';
import { playedCensus } from './support/census-played';

const GATE = loadCensusFixture().gate.planets;
const SMALL = 2000;

const RULES: WorldRules = {
  key: 'iceGiant',
  label: 'Test giant',
  biomes: [
    { k: 'testcalm', n: 'Calm test giant', w: 3, land: 70, f: 'calm' },
    { k: 'testwild', n: 'Wild test giant', w: 1, land: 20, f: 'wild' },
  ],
  biomeStream: declareStream('played test giant', 0x7E59, 3),
  landing: null,
  weather: 'none',
  landFamily: 'gas',
  life: 'none',
  deposits: ['H', 'He', 'CH4', 'NH3', 'He3', 'H2O', 'N'],
  trickle: { material: 'C', chance: 0.25, ownsStrike: false },
  reserveMul: 0.5,
  tierFixed: 0,
  card: { rows: [], replace: [] },
};
/** A type that exists only here: the small gas giants, with rules for everything a rule set can change. */
const TEST_TYPE: WorldTypeDefinition = {
  key: 'iceGiant',
  label: 'Test giant',
  slice: [{ name: 'gas', test: (P) => P.type === 'gas' }, { name: 'small', test: (P) => (P.sizeMul as number) < 1.9 }],
  source: null,
  bodies: null,
  rogue: null,
  rules: RULES,
};

describe('what the game plays of every seeded world, through the paths that take the switches', () => {
  it('with the game\'s own switches, and with every switch off, is the legacy record of every world: no world has rules', () => {
    expect(playedCensus(GATE, WORLD_SWITCHES)).toEqual({ worlds: GATE, ruled: 0, changedInside: 0, changedOutside: 0 });
    expect(playedCensus(SMALL, SWITCHES_OFF, [TEST_TYPE])).toEqual({ worlds: SMALL, ruled: 0, changedInside: 0, changedOutside: 0 });
  });

  it('with every switch on is still the legacy record of every world: no type has rules yet', () => {
    expect(GATE).toBe(20000);
    expect(playedCensus(GATE, SWITCHES_ON)).toEqual({ worlds: GATE, ruled: 0, changedInside: 0, changedOutside: 0 });
  });

  it('a type with rules changes what its own worlds play while its switch is on, and no other world', () => {
    const on = playedCensus(SMALL, SWITCHES_ON, [TEST_TYPE]);
    expect(on.ruled).toBeGreaterThan(80);
    expect(on).toMatchObject({ changedInside: on.ruled, changedOutside: 0 });
    expect(playedCensus(SMALL, { ...SWITCHES_OFF, hycean: true } as WorldSwitches, [TEST_TYPE])).toMatchObject({ ruled: 0, changedInside: 0, changedOutside: 0 });
  });

  it('proved the other way: rules handed to a world outside the slice are seen', () => {
    // A faulty seam that hands the type's rules to every gas giant, large ones too.
    const faulty: typeof playRulesFor = (world, switches, registry) =>
      playRulesFor(world.P.type === 'gas' ? { ...world, P: { ...world.P, sizeMul: 1.7 } } : world, switches, registry);
    expect(playedCensus(SMALL, SWITCHES_ON, [TEST_TYPE], faulty).changedOutside).toBeGreaterThan(200);
  });
});
