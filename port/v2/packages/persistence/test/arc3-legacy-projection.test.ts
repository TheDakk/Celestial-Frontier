import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  ENGINEERING_STATE_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  decodeEngineeringState,
  type EngineeringStateV2,
  type ResearchId,
} from '@cf/domain-opportunity';
import {
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  ARC3_LEGACY_PROJECTION_SCHEMA,
  MAX_ARC3_LEGACY_COMPATIBILITY_COUNT,
  projectArc3EngineeringLegacyCompatibility,
  type Arc3LegacyEngineeringPriorV4,
  type Arc3LegacyMinedTimestampIntent,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

const NOW = 1_753_900_060_000;
const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};
const TIER_10_WORLD = {
  galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 },
  star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 },
  planet: { seed: 3303620273 },
};
/* These are source-derived, real address collisions found by enumerating the
   deterministic universe. They pin the exact case a seed-only v4 carrier
   cannot represent instead of simulating it with cloned addresses. */
const COLLISION_WORLD_A = {
  galaxy: { seed: 2168115821, x: -1104.3939002789557, y: -1400.6738864816725 },
  star: { seed: 2404948836, x: 79.28673347271979, y: 172.30901278089732 },
  planet: { seed: 2525295284 },
};
const COLLISION_WORLD_B = {
  galaxy: { seed: 742431365, x: 357.33832279220223, y: 1882.66924303025 },
  star: { seed: 134687484, x: 219.1186681254767, y: -157.20003835111856 },
  planet: { seed: 2525295284 },
};
const COLLISION_STAR_A = {
  galaxy: { seed: 561051502, x: -1574.8095157761647, y: -1700.8175460314728 },
  star: { seed: 2441410401, x: -5.201387053355575, y: 209.4129129028879 },
};
const COLLISION_STAR_B = {
  galaxy: { seed: 1830565895, x: -1099.7482299027633, y: -2373.957283091542 },
  star: { seed: 2441410401, x: -151.8645452382043, y: -300.3498039753176 },
};

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress(candidate);
  if (!resolved.ok) throw new Error(`world fixture did not resolve: ${resolved.reason}`);
  return resolved.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const resolved = resolveCF1StarAddress(candidate);
  if (!resolved.ok) throw new Error(`star fixture did not resolve: ${resolved.reason}`);
  return resolved.address;
}

function galaxyMirror(address: CanonicalCF1WorldAddress | CanonicalCF1StarAddress) {
  return {
    seed: address.galaxy.seed,
    x: address.galaxy.x,
    y: address.galaxy.y,
    size: address.galaxy.size,
    sp: address.galaxy.sp,
    tilt: address.galaxy.tilt,
    rot: address.galaxy.rot,
    home: address.galaxy.home,
    quasar: address.galaxy.quasar,
    dwarf: address.galaxy.dwarf,
    parentCell: { x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y },
  };
}

function starMirror(address: CanonicalCF1WorldAddress | CanonicalCF1StarAddress) {
  return {
    seed: address.star.seed,
    x: address.star.x,
    y: address.star.y,
    layer: address.star.layer,
    parentCell: { x: address.star.parentCell.x, y: address.star.parentCell.y },
  };
}

function state(input: Readonly<{
  worlds?: readonly Readonly<{ address: CanonicalCF1WorldAddress; count: number }>[];
  stars?: readonly Readonly<{ address: CanonicalCF1StarAddress; count: number }>[];
  research?: readonly ResearchId[];
}> = {}): EngineeringStateV2 {
  const worlds = (input.worlds ?? []).map(({ address, count }) => ({
    key: address.key,
    address: {
      format: 'CF1',
      key: address.key,
      galaxy: galaxyMirror(address),
      star: starMirror(address),
      planet: { seed: address.planet.seed, ordinal: address.planet.ordinal },
    },
    extractionsTaken: count,
    autoExtractorCursor: null,
  })).sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
  const stars = (input.stars ?? []).map(({ address, count }) => ({
    key: address.key,
    address: {
      format: 'CF1',
      key: address.key,
      galaxy: galaxyMirror(address),
      star: starMirror(address),
    },
    extractionsTaken: count,
  })).sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
  return decodeEngineeringState(JSON.stringify({
    schema: ENGINEERING_STATE_SCHEMA,
    revision: 7,
    worlds,
    stars,
    research: input.research ?? [],
  }), SCENE_ENGINEERING_ADDRESS_RESOLVER);
}

function prior(input: Partial<Arc3LegacyEngineeringPriorV4> = {}): Arc3LegacyEngineeringPriorV4 {
  return {
    mineX: input.mineX ?? [],
    mined: input.mined ?? [],
    skimX: input.skimX ?? [],
  };
}

function project(
  authority: EngineeringStateV2,
  priorFields: Arc3LegacyEngineeringPriorV4 = prior(),
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent = { kind: 'preserve' },
) {
  return projectArc3EngineeringLegacyCompatibility({
    state: authority,
    prior: priorFields,
    codecNow: NOW,
    minedTimestampIntent,
  });
}

describe('@cf/persistence — bounded Arc 3 legacy-v4 projection', () => {
  it('projects every unique canonical leaf and sparse research exactly while dropping stale prior rows', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const tier10 = world(TIER_10_WORLD);
    const sol = star(SOL);
    const authority = state({
      worlds: [{ address: tier10, count: 91 }, { address: mars, count: 7 }],
      stars: [{ address: sol, count: 4 }],
      research: ['scan1', 'drive2'],
    });
    const before = JSON.stringify(authority);
    const output = project(authority, prior({
      mineX: [[134, 999], [123, 11]],
      mined: [[134, 100], [3303620273, 200], [123, 300]],
      skimX: [[424242, 999], [123, 22]],
    }), { kind: 'touched-world', worldKey: mars.key });

    expect(output.schema).toBe(ARC3_LEGACY_PROJECTION_SCHEMA);
    expect(output.legacy).toEqual({
      mineX: [[134, 7], [3303620273, 91]],
      mined: [[134, NOW], [3303620273, 200]],
      skimX: [[424242, 4]],
      techOwned: ['scan1', 'drive2'],
    });
    expect(output.diagnostics).toEqual([
      {
        source: 'star', leafSeed: 424242, disposition: 'exact',
        canonicalKeys: [sol.key], carriers: { skimX: 'exact' },
      },
      {
        source: 'world', leafSeed: 134, disposition: 'exact',
        canonicalKeys: [mars.key], carriers: { mineX: 'exact', mined: 'present' },
      },
      {
        source: 'world', leafSeed: 3303620273, disposition: 'exact',
        canonicalKeys: [tier10.key], carriers: { mineX: 'exact', mined: 'present' },
      },
    ]);
    expect(JSON.stringify(authority)).toBe(before);
  });

  it('holds real same-leaf world and star collisions without summing, selecting, or refreshing them', () => {
    const worldA = world(COLLISION_WORLD_A);
    const worldB = world(COLLISION_WORLD_B);
    const starA = star(COLLISION_STAR_A);
    const starB = star(COLLISION_STAR_B);
    expect(worldA.key).not.toBe(worldB.key);
    expect(starA.key).not.toBe(starB.key);
    const authority = state({
      worlds: [{ address: worldA, count: 3 }, { address: worldB, count: 88 }],
      stars: [{ address: starA, count: 5 }, { address: starB, count: 77 }],
      research: ['drive2'],
    });
    const output = project(authority, prior({
      mineX: [[2525295284, 41]],
      mined: [[2525295284, 444]],
      skimX: [[2441410401, 42]],
    }), { kind: 'refresh-all' });

    expect(output.legacy).toEqual({
      mineX: [[2525295284, 41]],
      mined: [[2525295284, 444]],
      skimX: [[2441410401, 42]],
      techOwned: ['drive2'],
    });
    expect(output.diagnostics).toEqual([
      {
        source: 'star', leafSeed: 2441410401, disposition: 'collision-held',
        canonicalKeys: [starA.key, starB.key].sort(), carriers: { skimX: 'held' },
      },
      {
        source: 'world', leafSeed: 2525295284, disposition: 'collision-held',
        canonicalKeys: [worldA.key, worldB.key].sort(),
        carriers: { mineX: 'held', mined: 'held' },
      },
    ]);

    const absent = project(authority, prior(), { kind: 'touched-world', worldKey: worldA.key });
    expect(absent.legacy).toEqual({ mineX: [], mined: [], skimX: [], techOwned: ['drive2'] });
    expect(absent.diagnostics.map(({ disposition }) => disposition))
      .toEqual(['collision-held', 'collision-held']);
  });

  it('applies one collision policy to asymmetric world carriers without rejecting or fabricating a counterpart', () => {
    const worldA = world(COLLISION_WORLD_A);
    const worldB = world(COLLISION_WORLD_B);
    const authority = state({
      worlds: [{ address: worldA, count: 3 }, { address: worldB, count: 88 }],
      research: ['scan1'],
    });

    const countOnly = project(authority, prior({ mineX: [[2525295284, 17]] }), { kind: 'refresh-all' });
    expect(countOnly.legacy).toEqual({
      mineX: [[2525295284, 17]], mined: [], skimX: [], techOwned: ['scan1'],
    });
    expect(countOnly.diagnostics[0]).toMatchObject({
      disposition: 'collision-held', carriers: { mineX: 'held', mined: 'absent' },
    });

    const timestampOnly = project(
      authority,
      prior({ mined: [[2525295284, 1234]] }),
      { kind: 'touched-world', worldKey: worldB.key },
    );
    expect(timestampOnly.legacy).toEqual({
      mineX: [], mined: [[2525295284, 1234]], skimX: [], techOwned: ['scan1'],
    });
    expect(timestampOnly.diagnostics[0]).toMatchObject({
      disposition: 'collision-held', carriers: { mineX: 'absent', mined: 'held' },
    });
  });

  it('refreshes only the requested unique world, refreshes all only explicitly, and leaves absent anchors absent', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const tier10 = world(TIER_10_WORLD);
    const authority = state({
      worlds: [{ address: mars, count: 1 }, { address: tier10, count: 2 }],
    });
    const priorFields = prior({ mined: [[134, 100], [3303620273, 200]] });

    expect(project(authority, priorFields).legacy.mined).toEqual([[134, 100], [3303620273, 200]]);
    expect(project(authority, priorFields, { kind: 'touched-world', worldKey: mars.key }).legacy.mined)
      .toEqual([[134, NOW], [3303620273, 200]]);
    expect(project(authority, priorFields, { kind: 'refresh-all' }).legacy.mined)
      .toEqual([[134, NOW], [3303620273, NOW]]);
    expect(project(authority).legacy).toMatchObject({ mineX: [[134, 1], [3303620273, 2]], mined: [] });
    expect(project(authority, prior(), { kind: 'touched-world', worldKey: mars.key }).legacy.mined)
      .toEqual([[134, NOW]]);
    expect(() => project(authority, prior(), {
      kind: 'touched-world', worldKey: `${mars.key}|not-current`,
    })).toThrow(/must exist/);
  });

  it('uses code-unit ordering only and returns a deeply frozen field fixed point', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const tier10 = world(TIER_10_WORLD);
    const sol = star(SOL);
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare')
      .mockImplementation(() => { throw new Error('ambient collation consulted'); });
    try {
      const authority = state({
        worlds: [{ address: tier10, count: 2 }, { address: mars, count: 1 }],
        stars: [{ address: sol, count: 3 }],
        research: ['scan1'],
      });
      const first = project(authority, prior(), { kind: 'refresh-all' });
      const second = project(authority, prior(first.legacy));
      expect(second).toEqual(first);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.legacy)).toBe(true);
      expect(Object.isFrozen(first.legacy.mineX)).toBe(true);
      expect(Object.isFrozen(first.legacy.mineX[0])).toBe(true);
      expect(Object.isFrozen(first.legacy.techOwned)).toBe(true);
      expect(Object.isFrozen(first.diagnostics)).toBe(true);
      expect(Object.isFrozen(first.diagnostics[0])).toBe(true);
      expect(Object.isFrozen(first.diagnostics[0]!.canonicalKeys)).toBe(true);
      expect(Object.isFrozen(first.diagnostics[0]!.carriers)).toBe(true);
    } finally {
      localeCompare.mockRestore();
    }
  });

  it('rejects every malformed or over-bound value instead of coercing, clamping, or saturating it', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const ordinary = state({ worlds: [{ address: mars, count: 1 }] });
    const overBound = state({
      worlds: [{ address: mars, count: MAX_ARC3_LEGACY_COMPATIBILITY_COUNT + 1 }],
    });
    expect(() => project(overBound)).toThrow(/0 through 1000000/);
    expect(() => project({ ...ordinary } as EngineeringStateV2)).toThrow(/registered/);
    expect(() => project(ordinary, prior({ mineX: [[134, 1_000_001]] }))).toThrow(/0 through 1000000/);
    expect(() => project(ordinary, prior({ mineX: [[-0, 1]] }))).toThrow(/uint32/);
    expect(() => project(ordinary, prior({ mineX: [[134, 1], [134, 2]] }))).toThrow(/repeats/);
    expect(() => project(ordinary, prior({ mined: [[134, Number.MAX_SAFE_INTEGER + 1]] })))
      .toThrow(/safe integer/);
    expect(() => projectArc3EngineeringLegacyCompatibility({
      state: ordinary, prior: prior(), codecNow: 1.5, minedTimestampIntent: { kind: 'preserve' },
    })).toThrow(/safe integer/);
    expect(() => project(ordinary, prior({ skimX: [[134, Number.NaN]] }))).toThrow(/0 through 1000000/);
    expect(() => project(ordinary, { mineX: [[134, 1, 2] as unknown as [number, number]], mined: [], skimX: [] }))
      .toThrow(/exact pair/);
    expect(() => project(ordinary, prior(), { kind: 'future' } as unknown as Arc3LegacyMinedTimestampIntent))
      .toThrow(/unsupported/);
  });

  it('contains no ambient time, entropy, or browser dependency', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/arc3-legacy-projection.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/\bDate\s*\.|\bMath\s*\.\s*random\s*\(|\bperformance\s*\.|\bdocument\s*\.|\bwindow\s*\./);
    expect(source).not.toMatch(/sessionrng|progression|auto-extractor/i);
  });
});
