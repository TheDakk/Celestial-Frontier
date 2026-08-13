import { beforeAll, describe, expect, it } from 'vitest';
import {
  normalizeCF1Coordinate,
  resolveCF1WorldAddress,
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

function success(result: ReturnType<typeof resolveCF1WorldAddress>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('expected a canonical address, received ' + result.reason);
  return result.address;
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
  });

  it('resolves a planet-bearing fine-layer star through its own generated parent cell', () => {
    const fine = firstFineWorld();
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
    expect(address.planet.ordinal).toBeGreaterThanOrEqual(0);
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
    const address = success(resolveCF1WorldAddress({
      galaxy: { seed: rawGalaxy.seed, x: 400, y: 0 },
      star: { seed: rawStar.seed, x: 42, y: 0 },
      planet: { seed: 9 },
    }, sources));
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
    expect(resolveCF1WorldAddress(HOME_CANDIDATE, sources)).toEqual({
      ok: false,
      reason: 'galaxy-ambiguous',
    });
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
    expect(resolveCF1WorldAddress(HOME_CANDIDATE, sources)).toEqual({
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
