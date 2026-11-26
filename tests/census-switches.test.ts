// No switch moves a world outside its slice. With every new-type switch off and with every one on, the legacy
// layer of every seeded world is the recorded legacy fingerprint, and the effective layer is the legacy record
// outside a slice. No type has rules yet, so today the effective layer is the legacy record inside a slice too.
import { describe, expect, it } from 'vitest';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';
import {
  SWITCHES_OFF, SWITCHES_ON, WORLD_TYPE_KEYS, effectiveWorld,
  type CensusSystem, type LegacyWorldFacts, type WorldRules, type WorldSwitches, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { resolveCF1WorldAddress } from '@cf/scene';
import { canonicalWorldRoster } from '../apps/game/src/world/roster';
import { WORLD_SWITCHES } from '../apps/game/src/world/switches';
import { censusCount, firstLanding, loadCensusFixture } from './support/census';
import { switchCensus } from './support/census-switches';

const fixture = loadCensusFixture();
const want = censusCount(fixture);
const SMALL = 5000;

const RULES: WorldRules = {
  key: 'iceGiant',
  label: 'Test giant',
  biomes: [
    { k: 'testcalm', n: 'Calm test giant', w: 3, land: 70, f: 'calm' },
    { k: 'testwild', n: 'Wild test giant', w: 1, land: 20, f: 'wild' },
  ],
  biomeSalt: [0x7E57, 3],
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

/** Reads enough other systems to push every system a faulty type wrote to out of the generator's memory. */
function forgetSystems(): void {
  for (let i = 0; i < 300; i++) systemFor(hashInt(0xF1A5, i, 0));
}

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

  it('each switch alone leaves every world as it was', () => {
    for (const key of [...WORLD_TYPE_KEYS, 'kindRow'] as const) {
      const one = switchCensus(1000, { ...SWITCHES_OFF, [key]: true } as WorldSwitches);
      expect(one.legacy.perThousand, key).toEqual(fixture.perThousand.slice(0, 1));
      expect(one, key).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0 });
    }
  });

  it('the game\'s own switches are that census: no world is of a new type', () => {
    const game = switchCensus(SMALL, WORLD_SWITCHES);
    expect(game.legacy.perThousand).toEqual(fixture.perThousand.slice(0, SMALL / 1000));
    expect(game).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0, inside: {} });
  });

  it('counts the three slices of planets among the first 20,000 worlds', () => {
    expect(switchCensus(20000, SWITCHES_ON).inside).toEqual({ iceGiant: 338, hycean: 184, megaEarth: 171 });
  });
});

describe('proved both ways with types that exist only here', () => {
  it('a type with rules changes the worlds inside its slice while its switch is on, and no other world', () => {
    const on = switchCensus(SMALL, SWITCHES_ON, [TEST_TYPE]);
    expect(on.legacy.perThousand).toEqual(fixture.perThousand.slice(0, SMALL / 1000));
    expect(on.inside.iceGiant).toBeGreaterThan(200);
    expect(on.changedInside).toBe(on.inside.iceGiant);
    expect(on).toMatchObject({ changedOutside: 0, movedWhenOff: 0 });
    const off = switchCensus(SMALL, SWITCHES_OFF, [TEST_TYPE]);
    expect(off).toMatchObject({ changedInside: 0, changedOutside: 0, movedWhenOff: 0, inside: {} });
    expect(switchCensus(SMALL, { ...SWITCHES_OFF, hycean: true }, [TEST_TYPE])).toMatchObject({ changedInside: 0, changedOutside: 0 });
  });

  it('a type that places its body with one draw of the system\'s own stream is caught: the legacy layer moves', () => {
    // As the legacy generator adds a dwarf planet (4062-4069), but from the stream the system itself was made with.
    const faulty: WorldTypeDefinition = {
      ...TEST_TYPE,
      key: 'trojan',
      slice: null,
      rules: null,
      bodies: (starSeed, system) => {
        if (system.sol === true || system.planets.length === 0) return [];
        const orb = 320 * (0.76 + mulberry32(starSeed)() * 0.18);
        const dwarfs = (system as { dwarfs?: unknown[] }).dwarfs ??= [];
        dwarfs.push({ name: 'Faulty', orb, seed: starSeed });
        return [];
      },
    };
    try {
      const on = switchCensus(SMALL, SWITCHES_ON, [faulty]);
      expect(on.legacy.perThousand).not.toEqual(fixture.perThousand.slice(0, SMALL / 1000));
      // The planets themselves are as they were; it is the system's own record that moved.
      expect(on.legacy.shares.types).toEqual(switchCensus(SMALL, SWITCHES_OFF).legacy.shares.types);
      expect(on.legacy.shares.systemsWithDwarfs).toBe(on.legacy.shares.systemsWithPlanets);
    } finally {
      forgetSystems();
    }
    // Off, the same type touches nothing.
    expect(switchCensus(SMALL, SWITCHES_OFF, [faulty]).legacy.perThousand).toEqual(fixture.perThousand.slice(0, SMALL / 1000));
  });

  it('a type that writes a planet\'s numbers while it is asked is caught: the legacy layer moves', () => {
    const faulty: WorldTypeDefinition = {
      ...TEST_TYPE,
      rules: null,
      // Sol's planets are one authored list that is never made again, so the fault is kept to seeded systems.
      slice: [{ name: 'writes', test: (P, _band, sol) => { if (!sol && P.type === 'gas') (P as { hue?: number }).hue = 200; return false; } }],
    };
    try {
      expect(switchCensus(SMALL, SWITCHES_ON, [faulty]).legacy.perThousand).not.toEqual(fixture.perThousand.slice(0, SMALL / 1000));
    } finally {
      forgetSystems();
    }
  });

  it('a biome rerolled outside the type\'s slice is caught: a world outside the slice changes', () => {
    // The type says its slice is the small giants; its rules are laid over every giant.
    const wide = [{ ...TEST_TYPE, slice: [GAS] }];
    const on = switchCensus(SMALL, SWITCHES_ON, [TEST_TYPE], (world, sys, switches) => effectiveWorld(world, sys, switches, wide));
    expect(on.changedOutside).toBeGreaterThan(500);
    expect(on.legacy.perThousand).toEqual(fixture.perThousand.slice(0, SMALL / 1000));
  });

  it('a seam that moves a world with every switch off is caught', () => {
    const on = switchCensus(1000, SWITCHES_OFF, [TEST_TYPE], (world, sys, switches, registry) => ({ ...effectiveWorld(world, sys, switches, registry), reserve: world.reserve + 1 }));
    expect(on.movedWhenOff).toBe(1000);
  });
});

describe('the effective world of 1,000 worlds of the home galaxy', () => {
  const HOME = { seed: 999, x: 90, y: -60 };

  /** What the game says of a world today: its snapshot, its descent and its roster. */
  function today(): { facts: LegacyWorldFacts; system: CensusSystem }[] {
    const out: { facts: LegacyWorldFacts; system: CensusSystem }[] = [];
    const profile = galaxyProfile(HOME.seed);
    for (let ring = 0; out.length < 1000; ring++) {
      for (let cy = -ring; cy <= ring; cy++) for (let cx = -ring; cx <= ring; cx++) {
        if (Math.max(Math.abs(cx), Math.abs(cy)) !== ring) continue;
        for (const star of starsInCell(HOME.seed, profile, 13 + cx, 4 + cy).stars) {
          const system = systemFor(star.seed) as unknown as CensusSystem;
          for (const planet of system.planets) {
            const resolved = resolveCF1WorldAddress({ galaxy: HOME, star: { seed: star.seed, x: star.x, y: star.y }, planet: { seed: planet.P.seed } });
            if (!resolved.ok) throw new Error(`a world did not resolve: ${resolved.reason}`);
            const snapshot = projectWorldOpportunity(resolved.address);
            const roster = canonicalWorldRoster(resolved.address, 0);
            if (!roster.ok) throw new Error(`a roster was refused: ${roster.message}`);
            out.push({
              system,
              facts: {
                P: planet.P,
                band: roster.roster.climateBand,
                sol: system.sol === true,
                biomeKey: snapshot.source.biomeKey,
                landing: firstLanding(planet, snapshot.source.climateBand),
                lifeKey: roster.roster.biosphereKey,
                tier: snapshot.effectiveTier,
                deposits: snapshot.deposits,
                biomeVein: snapshot.biomeVein,
                cosmicVein: snapshot.cosmicVein,
                exceptionalVein: snapshot.exceptionalVein,
                reserve: snapshot.reservePulls,
              },
            });
          }
        }
      }
    }
    return out.slice(0, 1000);
  }

  it('is what the descent, the snapshot and the roster say today, with every switch off and with every switch on', () => {
    const worlds = today();
    expect(worlds).toHaveLength(1000);
    expect(worlds.some(({ facts }) => facts.sol)).toBe(true);
    let sliced = 0;
    for (const { facts, system } of worlds) {
      expect(effectiveWorld(facts, system, SWITCHES_OFF)).toEqual({ ...facts, type: null, label: null });
      const on = effectiveWorld(facts, system, SWITCHES_ON);
      expect({ ...on, type: null }).toEqual({ ...facts, type: null, label: null });
      if (on.type !== null) sliced++;
    }
    // Neptune is among them, so the slices were asked.
    expect(sliced).toBeGreaterThan(0);
  });
});
