import { beforeAll, describe, expect, it } from 'vitest';
import {
  getCanonicalCF1AddressKey,
  getProvenGalaxyKey,
  getProvenPlanetKey,
  getProvenStarKey,
  isCanonicalCF1Address,
  isProvenGalaxy,
  isProvenPlanet,
  isProvenPlanetFor,
  isProvenStar,
  isProvenStarFor,
  normalizeCF1Coordinate,
  resolveCF1Galaxy,
  resolveCF1GalaxyAddress,
  resolveCF1Star,
  resolveCF1StarAddress,
  resolveCF1World,
  resolveCF1WorldAddress,
  resolveCF1WorldAddressForDiagnostics,
  type CF1GalaxyKey,
  type CF1StarKey,
  type CF1WorldKey,
  type CF1WorldAddressSourceOverrides,
} from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { fineStarsInCell, galaxiesInCell, galaxyProfile, systemFor } from '@cf/domain-worldgen';
import { FCELL } from '@cf/domain-worldgen';
import { GCELL, HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED, UCELL } from '@cf/domain-worldconfig';

beforeAll(() => installCaptureHooks());

const HOME_CANDIDATE = {
  galaxy: { seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y },
  star: { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y },
  planet: { seed: 133 },
};

const FOREIGN_GALAXY = {
  seed: 394332036,
  x: -300.95,
  y: 175.47,
};
const FOREIGN_STAR = { seed: 676840317, x: 27.3, y: -24.6 };
const FOREIGN_WORLD = { seed: 127909732 };

function success(result: ReturnType<typeof resolveCF1WorldAddress>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a canonical address, received ' + result.reason);
  return result.address;
}

function galaxySuccess(result: ReturnType<typeof resolveCF1Galaxy>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a proven galaxy, received ' + result.reason);
  return result.galaxy;
}

function starSuccess(result: ReturnType<typeof resolveCF1Star>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a proven star, received ' + result.reason);
  return result.star;
}

function worldSuccess(result: ReturnType<typeof resolveCF1World>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a proven planet, received ' + result.reason);
  return result.planet;
}

function firstFineWorld(): { star: { seed: number; x: number; y: number }; planetSeed: number; cellX: number; cellY: number } {
  const profile = galaxyProfile(HOME_GAL_SEED);
  /* The fine layer is deliberately a separate CF1 source. Find a real,
     planet-bearing fine star rather than manufacturing a convenient child. */
  for (let cellX = -12; cellX <= 12; cellX++) {
    for (let cellY = -12; cellY <= 12; cellY++) {
      const stars = fineStarsInCell(HOME_GAL_SEED, profile, cellX, cellY) as Array<{ seed: number; x: number; y: number }>;
      for (const star of stars) {
        for (const planet of systemFor(star.seed).planets) {
          const planetSeed = planet.P.seed;
          if (typeof planetSeed === 'number' && Number.isInteger(planetSeed)) return {
            star,
            planetSeed,
            cellX,
            cellY,
          };
        }
      }
    }
  }
  throw new Error('fixture search found no planet-bearing fine star');
}

describe('@cf/scene — canonical CF1 world-address proof', () => {
  it('★ re-derives the full Sol → Earth hierarchy and its source-derived key', () => {
    const address = success(resolveCF1WorldAddress(HOME_CANDIDATE));
    expect(address.galaxy).toEqual({
      seed: HOME_GAL_SEED,
      x: HOME_POS.x,
      y: HOME_POS.y,
      size: 78,
      sp: 0,
      tilt: 0.62,
      rot: 0.5,
      home: true,
      quasar: false,
      dwarf: false,
      parentCell: { x: Math.floor(HOME_POS.x / UCELL), y: Math.floor(HOME_POS.y / UCELL) },
    });
    expect(address.star).toEqual({
      seed: SOL_SEED,
      x: SOL_POS.x,
      y: SOL_POS.y,
      layer: 'coarse',
      parentCell: { x: Math.floor(SOL_POS.x / GCELL), y: Math.floor(SOL_POS.y / GCELL) },
    });
    expect(address.planet).toEqual({ seed: 133, ordinal: 2 });
    expect(address.key).toBe('CF1|g:999@90,-60|s:424242@560,170|p:133#2');
    expect(isProvenGalaxy(address.galaxy)).toBe(true);
    expect(isProvenStarFor(address.star, address.galaxy)).toBe(true);
    expect(isProvenPlanetFor(address.planet, address.star)).toBe(true);
    expect(isCanonicalCF1Address(address)).toBe(true);
    const galaxyKey: CF1GalaxyKey = getProvenGalaxyKey(address.galaxy)!;
    const starKey: CF1StarKey = getProvenStarKey(address.star)!;
    const worldKey: CF1WorldKey = getProvenPlanetKey(address.planet)!;
    expect(galaxyKey).toBe('CF1|g:999@90,-60');
    expect(starKey).toBe('CF1|g:999@90,-60|s:424242@560,170');
    expect(worldKey).toBe(address.key);
    expect(getCanonicalCF1AddressKey(address)).toBe(worldKey);
  });

  it('publishes canonical galaxy, star, and world address tiers without weakening the world shape', () => {
    const galaxy = resolveCF1GalaxyAddress({ galaxy: HOME_CANDIDATE.galaxy });
    expect(galaxy.ok).toBe(true);
    if (!galaxy.ok) throw new Error(galaxy.reason);
    expect(galaxy.address.key).toBe('CF1|g:999@90,-60');
    expect(isCanonicalCF1Address(galaxy.address)).toBe(true);
    expect('star' in galaxy.address).toBe(false);

    const star = resolveCF1StarAddress({
      galaxy: HOME_CANDIDATE.galaxy,
      star: HOME_CANDIDATE.star,
    });
    expect(star.ok).toBe(true);
    if (!star.ok) throw new Error(star.reason);
    expect(star.address.key).toBe('CF1|g:999@90,-60|s:424242@560,170');
    expect(isProvenStarFor(star.address.star, star.address.galaxy)).toBe(true);
    expect(isCanonicalCF1Address(star.address)).toBe(true);
    expect('planet' in star.address).toBe(false);

    const world = success(resolveCF1WorldAddress(HOME_CANDIDATE));
    expect(Object.keys(world).sort()).toEqual(['format', 'galaxy', 'key', 'planet', 'star']);
  });

  it('accepts an independently re-proven equivalent parent but rejects structural clones', () => {
    const galaxyA = galaxySuccess(resolveCF1Galaxy(HOME_CANDIDATE.galaxy));
    const galaxyB = galaxySuccess(resolveCF1Galaxy({ ...HOME_CANDIDATE.galaxy }));
    expect(galaxyA).not.toBe(galaxyB);
    expect(getProvenGalaxyKey(galaxyA)).toBe(getProvenGalaxyKey(galaxyB));

    const starA = starSuccess(resolveCF1Star(galaxyA, HOME_CANDIDATE.star));
    const starB = starSuccess(resolveCF1Star(galaxyB, { ...HOME_CANDIDATE.star }));
    expect(isProvenStarFor(starA, galaxyB)).toBe(true);
    expect(isProvenStarFor(starB, galaxyA)).toBe(true);
    expect(getProvenStarKey(starA)).toBe(getProvenStarKey(starB));

    const planet = worldSuccess(resolveCF1World(starA, HOME_CANDIDATE.planet));
    expect(isProvenPlanetFor(planet, starB)).toBe(true);

    const galaxyClone = { ...galaxyA, parentCell: { ...galaxyA.parentCell } };
    expect(isProvenGalaxy(galaxyClone)).toBe(false);
    expect(getProvenGalaxyKey(galaxyClone)).toBeNull();
    expect(resolveCF1Star(galaxyClone, HOME_CANDIDATE.star)).toEqual({
      ok: false,
      reason: 'unproven-parent',
    });

    const starClone = { ...starA, parentCell: { ...starA.parentCell } };
    expect(isProvenStar(starClone)).toBe(false);
    expect(getProvenStarKey(starClone)).toBeNull();
    expect(resolveCF1World(starClone, HOME_CANDIDATE.planet)).toEqual({
      ok: false,
      reason: 'unproven-parent',
    });
  });

  it('deep-freezes trusted nodes and addresses, and rejects an address clone', () => {
    const address = success(resolveCF1WorldAddress(HOME_CANDIDATE));
    for (const value of [
      address,
      address.galaxy,
      address.galaxy.parentCell,
      address.star,
      address.star.parentCell,
      address.planet,
    ]) expect(Object.isFrozen(value)).toBe(true);

    expect(() => {
      (address.galaxy as unknown as { x: number }).x = 9999;
    }).toThrow(TypeError);
    expect(address.galaxy.x).toBe(HOME_POS.x);

    const addressClone = { ...address };
    expect(isCanonicalCF1Address(addressClone)).toBe(false);
    expect(getCanonicalCF1AddressKey(addressClone)).toBeNull();
  });

  it('proves a foreign hierarchy and rejects real children under the wrong proven parent', () => {
    const home = galaxySuccess(resolveCF1Galaxy(HOME_CANDIDATE.galaxy));
    const homeStar = starSuccess(resolveCF1Star(home, HOME_CANDIDATE.star));
    const foreign = galaxySuccess(resolveCF1Galaxy(FOREIGN_GALAXY));
    const foreignStar = starSuccess(resolveCF1Star(foreign, FOREIGN_STAR));
    const foreignPlanet = worldSuccess(resolveCF1World(foreignStar, FOREIGN_WORLD));
    expect(getProvenPlanetKey(foreignPlanet)).toBe(
      'CF1|g:394332036@-300.95,175.47|s:676840317@27.3,-24.6|p:127909732#0',
    );
    expect(isProvenStarFor(foreignStar, home)).toBe(false);
    expect(isProvenPlanetFor(foreignPlanet, homeStar)).toBe(false);
    expect(resolveCF1Star(home, FOREIGN_STAR)).toEqual({ ok: false, reason: 'star-not-found' });
    expect(resolveCF1Star(foreign, HOME_CANDIDATE.star)).toEqual({ ok: false, reason: 'star-not-found' });
    expect(resolveCF1World(homeStar, FOREIGN_WORLD)).toEqual({ ok: false, reason: 'planet-not-found' });
    expect(resolveCF1World(foreignStar, HOME_CANDIDATE.planet)).toEqual({ ok: false, reason: 'planet-not-found' });
  });

  it('resolves a planet-bearing fine-layer star through its own generated parent cell', () => {
    const fine = firstFineWorld();
    expect(fine).toMatchObject({
      star: { seed: 1664319693, x: -164.45360307302326, y: -117.94395204260945 },
      planetSeed: 227704593,
      cellX: -12,
      cellY: -9,
    });
    const address = success(resolveCF1WorldAddress({
      galaxy: HOME_CANDIDATE.galaxy,
      star: fine.star,
      planet: { seed: fine.planetSeed },
    }));
    expect(address.star).toMatchObject({
      seed: fine.star.seed,
      layer: 'fine',
      parentCell: { x: fine.cellX, y: fine.cellY },
    });
    expect(address.planet.seed).toBe(fine.planetSeed);
    expect(address.planet.ordinal).toBe(0);
    expect(address.key).toBe('CF1|g:999@90,-60|s:1664319693@-164.45,-117.94|p:227704593#0');
    expect(isProvenStarFor(address.star, address.galaxy)).toBe(true);
    expect(isProvenPlanetFor(address.planet, address.star)).toBe(true);
  });

  it('normalizes the public two-decimal CF1 coordinates from source data, not caller precision', () => {
    /* Both parents sit just inside their lower generator cells while the
       public two-decimal address rounds onto the next cell boundary. */
    const rawGalaxy = { seed: 7, x: 399.999, y: -0.001, size: 31, sp: 5, tilt: 0.4, rot: 0.3 };
    const rawStar = { seed: 8, x: 41.999, y: -0.001 };
    const sources: CF1WorldAddressSourceOverrides = {
      galaxiesInCell: (cellX, cellY) => (
        cellX === Math.floor(rawGalaxy.x / UCELL) && cellY === Math.floor(rawGalaxy.y / UCELL)
          ? [rawGalaxy]
          : []
      ),
      galaxyProfile: () => ({}),
      starsInCell: (_seed, _profile, cellX, cellY) => ({
        stars: cellX === Math.floor(rawStar.x / GCELL) && cellY === Math.floor(rawStar.y / GCELL)
          ? [rawStar]
          : [],
      }),
      fineStarsInCell: () => [],
      systemFor: () => ({ planets: [{ P: { seed: 9 } }] }),
    };
    const diagnostic = resolveCF1WorldAddressForDiagnostics({
      galaxy: { seed: rawGalaxy.seed, x: 400, y: 0 },
      star: { seed: rawStar.seed, x: 42, y: 0 },
      planet: { seed: 9 },
    }, sources);
    expect(diagnostic.ok).toBe(true);
    if (!diagnostic.ok) throw new Error('expected diagnostic address, received ' + diagnostic.reason);
    const address = diagnostic.address;
    expect(address.galaxy).toMatchObject({
      x: 400,
      y: 0,
      size: 31,
      sp: 5,
      tilt: 0.4,
      rot: 0.3,
      home: false,
      quasar: false,
      dwarf: false,
      parentCell: { x: 0, y: -1 },
    });
    expect(address.star).toMatchObject({
      x: 42,
      y: 0,
      layer: 'coarse',
      parentCell: { x: 0, y: -1 },
    });
    expect(address.key).toBe('CF1|g:7@400,0|s:8@42,0|p:9#0');
    expect(normalizeCF1Coordinate(-0.001)).toBe(0);
    expect(isProvenGalaxy(address.galaxy)).toBe(false);
    expect(isProvenStar(address.star)).toBe(false);
    expect(isProvenPlanet(address.planet)).toBe(false);
    expect(isCanonicalCF1Address(address)).toBe(false);
    expect(getProvenGalaxyKey(address.galaxy)).toBeNull();
  });

  it('rejects a forged parent, a wrong child, and malformed public bytes before any receipt could exist', () => {
    const forgedParent = resolveCF1WorldAddress({
      ...HOME_CANDIDATE,
      galaxy: { ...HOME_CANDIDATE.galaxy, x: HOME_POS.x + 0.01 },
    });
    expect(forgedParent).toEqual({ ok: false, reason: 'galaxy-not-found' });

    const forgedStar = resolveCF1WorldAddress({
      ...HOME_CANDIDATE,
      star: { ...HOME_CANDIDATE.star, y: SOL_POS.y + 0.01 },
    });
    expect(forgedStar).toEqual({ ok: false, reason: 'star-not-found' });

    const wrongPlanet = resolveCF1WorldAddress({
      ...HOME_CANDIDATE,
      planet: { seed: 0 },
    });
    expect(wrongPlanet).toEqual({ ok: false, reason: 'planet-not-found' });

    for (const malformed of [
      null,
      { galaxy: { ...HOME_CANDIDATE.galaxy, seed: 1.5 }, star: HOME_CANDIDATE.star, planet: HOME_CANDIDATE.planet },
      { galaxy: { ...HOME_CANDIDATE.galaxy, x: Infinity }, star: HOME_CANDIDATE.star, planet: HOME_CANDIDATE.planet },
      { galaxy: HOME_CANDIDATE.galaxy, star: { ...HOME_CANDIDATE.star, seed: '424242' }, planet: HOME_CANDIDATE.planet },
      { galaxy: HOME_CANDIDATE.galaxy, star: HOME_CANDIDATE.star, planet: { seed: 0x1_0000_0000 } },
    ]) {
      expect(resolveCF1WorldAddress(malformed)).toEqual({ ok: false, reason: 'malformed-address' });
    }

    expect(resolveCF1Galaxy({ seed: -1, x: 0, y: 0 })).toEqual({
      ok: false,
      reason: 'malformed-address',
    });
    const galaxy = galaxySuccess(resolveCF1Galaxy(HOME_CANDIDATE.galaxy));
    expect(resolveCF1Star(galaxy, { seed: SOL_SEED, x: NaN, y: SOL_POS.y })).toEqual({
      ok: false,
      reason: 'malformed-address',
    });
    const star = starSuccess(resolveCF1Star(galaxy, HOME_CANDIDATE.star));
    expect(resolveCF1World(star, { seed: '133' })).toEqual({
      ok: false,
      reason: 'malformed-address',
    });
  });

  it('bounds public and legacy raw coordinates before generator resolution', () => {
    expect(normalizeCF1Coordinate(10_000_000)).toBe(10_000_000);
    expect(normalizeCF1Coordinate(-10_000_000)).toBe(-10_000_000);
    /* These first two would round back onto the accepted boundary if the cap
       were applied only after legacy two-decimal normalization. */
    for (const outside of [
      10_000_000.001,
      -10_000_000.001,
      Number.MAX_SAFE_INTEGER,
      -1e100,
    ]) expect(normalizeCF1Coordinate(outside)).toBeNull();

    const hugePersistedGalaxy = {
      ...HOME_CANDIDATE,
      galaxy: { ...HOME_CANDIDATE.galaxy, x: Number.MAX_SAFE_INTEGER },
    };
    const hugePersistedStar = {
      ...HOME_CANDIDATE,
      star: { ...HOME_CANDIDATE.star, y: -1e100 },
    };
    expect(resolveCF1WorldAddress(hugePersistedGalaxy)).toEqual({
      ok: false,
      reason: 'malformed-address',
    });
    expect(resolveCF1WorldAddress(hugePersistedStar)).toEqual({
      ok: false,
      reason: 'malformed-address',
    });
    expect(resolveCF1Galaxy(hugePersistedGalaxy.galaxy)).toEqual({
      ok: false,
      reason: 'malformed-address',
    });

    const home = galaxySuccess(resolveCF1Galaxy(HOME_CANDIDATE.galaxy));
    expect(resolveCF1Star(home, hugePersistedStar.star)).toEqual({
      ok: false,
      reason: 'malformed-address',
    });

    let sourceCalls = 0;
    expect(resolveCF1WorldAddressForDiagnostics(hugePersistedGalaxy, {
      galaxiesInCell: () => {
        sourceCalls++;
        return [];
      },
    })).toEqual({ ok: false, reason: 'malformed-address' });
    expect(sourceCalls).toBe(0);
  });

  it('★ fails closed rather than choosing the first duplicate source match (injectable resolver control)', () => {
    const homeCellX = Math.floor(HOME_POS.x / UCELL);
    const homeCellY = Math.floor(HOME_POS.y / UCELL);
    const sources: CF1WorldAddressSourceOverrides = {
      galaxiesInCell: (cellX, cellY) => {
        const generated = galaxiesInCell(cellX, cellY);
        if (cellX !== homeCellX || cellY !== homeCellY) return generated;
        const home = generated.find((galaxy) => galaxy.seed === HOME_GAL_SEED);
        if (!home) throw new Error('home fixture missing from its generated parent');
        return [...generated, { ...home }];
      },
    };
    expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
      ok: false,
      reason: 'galaxy-ambiguous',
    });
  });

  it('rejects a star duplicated across the coarse and fine source layers', () => {
    const fineCellX = Math.floor(SOL_POS.x / FCELL);
    const fineCellY = Math.floor(SOL_POS.y / FCELL);
    const sources: CF1WorldAddressSourceOverrides = {
      fineStarsInCell: (_seed, _profile, cellX, cellY) => (
        cellX === fineCellX && cellY === fineCellY
          ? [{ seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y }]
          : []
      ),
    };
    expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
      ok: false,
      reason: 'star-ambiguous',
    });
  });

  it('rejects duplicate planet seeds instead of choosing the first source ordinal', () => {
    const sources: CF1WorldAddressSourceOverrides = {
      systemFor: () => ({
        planets: [
          { name: 'First', orb: 60, P: { seed: 133 } },
          { name: 'Second', orb: 220, P: { seed: 133 } },
        ],
      }),
    };
    expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
      ok: false,
      reason: 'planet-ambiguous',
    });
  });

  it('fails closed when any hierarchy source throws', () => {
    const throwingSources: CF1WorldAddressSourceOverrides[] = [
      { galaxiesInCell: () => { throw new Error('galaxy source'); } },
      { galaxyProfile: () => { throw new Error('profile source'); } },
      { starsInCell: () => { throw new Error('coarse source'); } },
      { fineStarsInCell: () => { throw new Error('fine source'); } },
      { systemFor: () => { throw new Error('system source'); } },
    ];
    for (const sources of throwingSources) {
      expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
        ok: false,
        reason: 'source-error',
      });
    }
  });

  it('fails closed when any inspected hierarchy source entry is malformed', () => {
    const malformedSources: CF1WorldAddressSourceOverrides[] = [
      { galaxiesInCell: () => [null] },
      { starsInCell: () => ({ stars: [null] }) },
      { fineStarsInCell: () => [null] },
      { systemFor: () => ({ planets: [{ name: 'Earth', orb: 100, P: { seed: 133 } }, null] }) },
    ];
    for (const sources of malformedSources) {
      expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
        ok: false,
        reason: 'source-error',
      });
    }
  });

  it('captures source ordinal before any presentation sort', () => {
    const rawGalaxy = { seed: 7, x: 10, y: 10, size: 31, sp: 5, tilt: 0.4, rot: 0.3 };
    const rawStar = { seed: 8, x: 20, y: 20 };
    const planets = [
      { name: 'Outer', orb: 220, P: { seed: 9001 } },
      { name: 'Inner', orb: 60, P: { seed: 9002 } },
      { name: 'Middle', orb: 140, P: { seed: 9003 } },
    ];
    const sources: CF1WorldAddressSourceOverrides = {
      galaxiesInCell: (cellX, cellY) => cellX === 0 && cellY === 0 ? [rawGalaxy] : [],
      galaxyProfile: () => ({}),
      starsInCell: (_seed, _profile, cellX, cellY) => ({
        stars: cellX === 0 && cellY === 0 ? [rawStar] : [],
      }),
      fineStarsInCell: () => [],
      systemFor: () => ({ planets }),
    };
    const candidate = {
      galaxy: { seed: 7, x: 10, y: 10 },
      star: { seed: 8, x: 20, y: 20 },
      planet: { seed: 9001 },
    };
    const outer = resolveCF1WorldAddressForDiagnostics(candidate, sources);
    expect(outer.ok).toBe(true);
    if (!outer.ok) throw new Error(outer.reason);
    expect(outer.address.planet).toEqual({ seed: 9001, ordinal: 0 });
    expect(outer.address.key).toBe('CF1|g:7@10,10|s:8@20,20|p:9001#0');

    const inner = resolveCF1WorldAddressForDiagnostics({
      ...candidate,
      planet: { seed: 9002 },
    }, sources);
    expect(inner.ok).toBe(true);
    if (!inner.ok) throw new Error(inner.reason);
    expect(inner.address.planet).toEqual({ seed: 9002, ordinal: 1 });
    expect([...planets].sort((a, b) => a.orb - b.orb).map((planet) => planet.P.seed)).toEqual([
      9002,
      9003,
      9001,
    ]);
  });

  it('★ derives Earth’s presentation from source, never an attacker-controlled share tuple', () => {
    const address = success(resolveCF1WorldAddress({
      ...HOME_CANDIDATE,
      /* Candidate has no presentation fields by type. These extra raw fields
         model a legacy decoder’s tolerated CF1 tuple and must be ignored. */
      galaxy: { ...HOME_CANDIDATE.galaxy, size: 3999, sp: 300000, tilt: -7, rot: -7, home: false },
    }));
    expect(address.galaxy).toMatchObject({
      size: 78,
      sp: 0,
      tilt: 0.62,
      rot: 0.5,
      home: true,
    });
    /* Negative control: a predicate that would bless the injected size must
       fail, proving the assertion observes the returned outcome. */
    expect(() => expect(address.galaxy).toMatchObject({ size: 3999 })).toThrow();
  });

  it('fails closed when a matching generator entry lacks strict source display metadata', () => {
    const homeCellX = Math.floor(HOME_POS.x / UCELL);
    const homeCellY = Math.floor(HOME_POS.y / UCELL);
    const sources: CF1WorldAddressSourceOverrides = {
      galaxiesInCell: (cellX, cellY) => {
        const generated = galaxiesInCell(cellX, cellY);
        if (cellX !== homeCellX || cellY !== homeCellY) return generated;
        return generated.map((galaxy) => galaxy.seed === HOME_GAL_SEED
          ? { ...galaxy, size: Infinity }
          : galaxy);
      },
    };
    expect(resolveCF1WorldAddressForDiagnostics(HOME_CANDIDATE, sources)).toEqual({
      ok: false,
      reason: 'source-error',
    });
  });

  it('the fine source uses FCELL rather than borrowing the coarse parent convention', () => {
    const fine = firstFineWorld();
    expect(fine.cellX).toBe(Math.floor(fine.star.x / FCELL));
    expect(fine.cellY).toBe(Math.floor(fine.star.y / FCELL));
  });
});
