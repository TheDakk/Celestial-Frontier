import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  ENGINEERING_STATE_SCHEMA,
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  MAX_ENGINEERING_REVISION,
  MAX_ENGINEERING_STATE_JSON_BYTES,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  createEngineeringState,
  createLegacyEngineeringSeedResolver,
  decodeEngineeringState,
  encodeEngineeringState,
  isEngineeringRevisionExhausted,
  isEngineeringState,
  isStarOpportunitySnapshot,
  isWorldOpportunitySnapshot,
  migrateLegacyEngineeringState,
  projectStarOpportunity,
  projectWorldOpportunity,
  type EngineeringAddressResolver,
  type LegacyEngineeringSeedResolver,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};

const TIER_10_WORLD = {
  galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 },
  star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 },
  planet: { seed: 3303620273 },
};

const TIER_14_WORLD = {
  galaxy: { seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 },
  star: { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 },
  planet: { seed: 3533877330 },
};

const BIOME_VEIN_WORLD = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 },
  planet: { seed: 171668249 },
};

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`world fixture did not resolve: ${result.reason}`);
  return result.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const result = resolveCF1StarAddress(candidate);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`star fixture did not resolve: ${result.reason}`);
  return result.address;
}

function legacyState(
  worlds: readonly { readonly seed: number; readonly extractionsTaken: number }[] = [],
  stars: readonly { readonly seed: number; readonly extractionsTaken: number }[] = [],
  research: readonly unknown[] = [],
  revision = 7,
): unknown {
  return {
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision,
    worlds,
    stars,
    research,
  };
}

function mutateJson(encoded: string, mutate: (value: Record<string, unknown>) => void): string {
  const value = JSON.parse(encoded) as Record<string, unknown>;
  mutate(value);
  return JSON.stringify(value);
}

describe('@cf/domain-opportunity — canonical source snapshots', () => {
  it('derives registered CF1 world facts and keeps raw tiers 10 and 14 distinct from display rarity', () => {
    const tier10Address = world(TIER_10_WORLD);
    const tier14Address = world(TIER_14_WORLD);
    const tier10 = projectWorldOpportunity(tier10Address);
    const tier14 = projectWorldOpportunity(tier14Address);

    expect(tier10.key).toBe(tier10Address.key);
    expect(tier10.source).toMatchObject({
      planetSeed: 3303620273,
      planetType: 'venus',
      biosphereKey: 'none',
    });
    expect(tier10.rawTier).toBe(10);
    expect(tier14.rawTier).toBe(14);
    expect(tier10.displayRarity).toMatchObject({ tier: 9, name: 'Transcendent' });
    expect(tier14.displayRarity).toMatchObject({ tier: 9, name: 'Transcendent' });
    expect(tier14.source.biosphereKey).not.toBe('none');
    expect(tier10).toMatchObject({
      depositProfile: 'venus',
      deposits: ['P', 'CO2', 'Zn', 'Pb'],
      biomeVein: null,
      cosmicVein: 'Voe',
      exceptionalVein: 'P',
      reservePulls: 2_714,
    });
    expect(tier14).toMatchObject({
      depositProfile: 'rocky',
      deposits: ['Ca', 'Ni', 'Al', 'Ti', 'Cu', 'Nd'],
      biomeVein: null,
      cosmicVein: 'Pro',
      exceptionalVein: 'Ti',
      reservePulls: 3_923,
    });
    expect(Object.isFrozen(tier10)).toBe(true);
    expect(Object.isFrozen(tier10.source)).toBe(true);
    expect(Object.isFrozen(tier10.displayRarity)).toBe(true);
    expect(Object.isFrozen(tier10.deposits)).toBe(true);
    expect(isWorldOpportunitySnapshot(tier10)).toBe(true);
    expect(isWorldOpportunitySnapshot({ ...tier10 })).toBe(false);
  });

  it('derives Earth and star snapshots but never treats address clones as authority', () => {
    const earthAddress = world({ ...SOL, planet: { seed: 133 } });
    const marsAddress = world({ ...SOL, planet: { seed: 134 } });
    const solAddress = star(SOL);
    const earth = projectWorldOpportunity(earthAddress);
    const mars = projectWorldOpportunity(marsAddress);
    const sol = projectStarOpportunity(solAddress);

    expect(earth.rawTier).toBe(5);
    expect(earth.source.biosphereKey).not.toBe('none');
    expect(earth).toMatchObject({
      deposits: ['Si', 'Cu', 'Mg', 'Ni', 'Ti'],
      cosmicVein: null,
      exceptionalVein: null,
      reservePulls: 1_873,
    });
    expect(mars.rawTier).toBe(0);
    expect(mars.source.biosphereKey).toBe('none');
    expect(mars).toMatchObject({
      depositProfile: 'desert',
      deposits: ['Cl', 'Si', 'Ca'],
      cosmicVein: null,
      exceptionalVein: null,
      reservePulls: 570,
    });
    expect(sol).toMatchObject({
      key: solAddress.key,
      rawTier: 3,
      material: 'Pls',
      baseReservePasses: 43,
      remnantHazard: false,
      requiresJumpDrive: true,
    });
    expect(isStarOpportunitySnapshot(sol)).toBe(true);
    expect(isStarOpportunitySnapshot({ ...sol })).toBe(false);

    expect(() => projectWorldOpportunity({ ...marsAddress } as CanonicalCF1WorldAddress))
      .toThrow(/registered canonical CF1 world address/);
    expect(() => projectStarOpportunity({ ...solAddress } as CanonicalCF1StarAddress))
      .toThrow(/registered canonical CF1 star address/);
  });

  it('pins the positive biome-vein path independently of ordinary and rare veins', () => {
    const address = world(BIOME_VEIN_WORLD);
    const snapshot = projectWorldOpportunity(address);
    expect(snapshot).toMatchObject({
      key: address.key,
      source: { biomeKey: 'carbon', biosphereKey: 'none' },
      rawTier: 1,
      depositProfile: 'rocky',
      deposits: ['Cr', 'Fe', 'Ca', 'Al', 'Mg'],
      biomeVein: 'Pm',
      cosmicVein: null,
      exceptionalVein: null,
      reservePulls: 791,
    });
  });
});

describe('@cf/domain-opportunity — canonical engineering codec', () => {
  it('migrates to address-keyed rows and round-trips a sparse recognized veteran subset', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const sol = star(SOL);
    const migrationResolver = createLegacyEngineeringSeedResolver({ worlds: [mars], stars: [sol] });
    const migrated = migrateLegacyEngineeringState(legacyState(
      [{ seed: 134, extractionsTaken: 23 }],
      [{ seed: 424242, extractionsTaken: 4 }],
      ['drive2', 'unknown-veteran-row', 'scan1', 'drive2'],
    ), migrationResolver);

    expect(migrated.schema).toBe(ENGINEERING_STATE_SCHEMA);
    expect(migrated.worlds[0]).toMatchObject({
      key: mars.key,
      address: mars,
      extractionsTaken: 23,
      autoExtractorCursor: null,
    });
    expect(migrated.stars[0]).toMatchObject({ key: sol.key, address: sol, extractionsTaken: 4 });
    expect(migrated.research).toEqual(['scan1', 'drive2']);
    expect(migrated.research).not.toContain('drive1');
    expect(Object.isFrozen(migrated)).toBe(true);
    expect(Object.isFrozen(migrated.worlds)).toBe(true);
    expect(Object.isFrozen(migrated.worlds[0])).toBe(true);
    expect(isEngineeringState(migrated)).toBe(true);

    const encoded = encodeEngineeringState(migrated);
    const raw = JSON.parse(encoded) as {
      worlds: Array<{ key: string; address: Record<string, unknown> }>;
      stars: Array<{ key: string; address: Record<string, unknown> }>;
    };
    expect(raw.worlds[0]!.address).toEqual({
      format: 'CF1',
      key: mars.key,
      galaxy: {
        seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
        home: true, quasar: false, dwarf: false, parentCell: { x: 0, y: -1 },
      },
      star: {
        seed: 424242, x: 560, y: 170, layer: 'coarse', parentCell: { x: 13, y: 4 },
      },
      planet: { seed: 134, ordinal: 3 },
    });
    expect(raw.stars[0]!.address).toEqual({
      format: 'CF1',
      key: sol.key,
      galaxy: {
        seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
        home: true, quasar: false, dwarf: false, parentCell: { x: 0, y: -1 },
      },
      star: {
        seed: 424242, x: 560, y: 170, layer: 'coarse', parentCell: { x: 13, y: 4 },
      },
    });

    const resolveWorldAddress = vi.fn(SCENE_ENGINEERING_ADDRESS_RESOLVER.resolveWorldAddress);
    const resolveStarAddress = vi.fn(SCENE_ENGINEERING_ADDRESS_RESOLVER.resolveStarAddress);
    const decoded = decodeEngineeringState(encoded, { resolveWorldAddress, resolveStarAddress });
    expect(resolveWorldAddress).toHaveBeenCalledOnce();
    expect(resolveStarAddress).toHaveBeenCalledOnce();
    expect(decoded.worlds[0]!.address).not.toBe(mars);
    expect(decoded.worlds[0]!.address.key).toBe(mars.key);
    expect(decoded.research).toEqual(['scan1', 'drive2']);
    expect(encodeEngineeringState(decoded)).toBe(encoded);
    expect(() => encodeEngineeringState({ ...decoded })).toThrow(/registered by this package/);
  });

  it('accepts sparse drive2 alone as veteran data without prerequisite closure', () => {
    const migrated = migrateLegacyEngineeringState(
      legacyState([], [], ['drive2']),
      createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    );
    expect(migrated.research).toEqual(['drive2']);
    const encoded = encodeEngineeringState(migrated);
    expect(decodeEngineeringState(encoded, SCENE_ENGINEERING_ADDRESS_RESOLVER).research)
      .toEqual(['drive2']);
    expect(encodeEngineeringState(decodeEngineeringState(encoded, SCENE_ENGINEERING_ADDRESS_RESOLVER)))
      .toBe(encoded);
  });

  it('orders canonical persistence keys by code units without consulting ambient locale collation', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const tier10 = world(TIER_10_WORLD);
    const resolver = createLegacyEngineeringSeedResolver({ worlds: [mars, tier10], stars: [] });
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare')
      .mockImplementation(() => { throw new Error('ambient locale collation consulted'); });
    try {
      const migrated = migrateLegacyEngineeringState(legacyState([
        { seed: 134, extractionsTaken: 1 },
        { seed: 3303620273, extractionsTaken: 2 },
      ]), resolver);
      expect(migrated.worlds.map(({ key }) => key)).toEqual(
        [mars.key, tier10.key].sort((left, right) => left < right ? -1 : left > right ? 1 : 0),
      );
    } finally {
      localeCompare.mockRestore();
    }
  });

  it('is strict about schema, canonical bytes, keys, ordering, and forged parent mirrors', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const state = migrateLegacyEngineeringState(
      legacyState([{ seed: 134, extractionsTaken: 1 }], [], ['scan1']),
      createLegacyEngineeringSeedResolver({ worlds: [mars], stars: [] }),
    );
    const encoded = encodeEngineeringState(state);
    const decode = (value: string, resolver = SCENE_ENGINEERING_ADDRESS_RESOLVER) =>
      decodeEngineeringState(value, resolver);

    expect(() => decode(` ${encoded}`)).toThrow(/not canonical/);
    expect(() => decode('{')).toThrow(/malformed/);
    expect(() => decode(mutateJson(encoded, (raw) => { raw.schema = 'cf-v2-engineering-state/v3'; })))
      .toThrow(/unsupported/);
    expect(() => decode(mutateJson(encoded, (raw) => { raw.extra = true; })))
      .toThrow(/unknown or missing/);
    expect(() => decode(mutateJson(encoded, (raw) => {
      const rows = raw.worlds as Array<Record<string, unknown>>;
      rows[0]!.key = 'CF1|forged';
    }))).toThrow(/key/);
    expect(() => decode(mutateJson(encoded, (raw) => {
      const rows = raw.worlds as Array<{ address: { galaxy: { x: number } } }>;
      rows[0]!.address.galaxy.x += 0.01;
    }))).toThrow(/rebound/);
    expect(() => decode(mutateJson(encoded, (raw) => {
      const rows = raw.worlds as unknown[];
      rows.push(structuredClone(rows[0]));
    }))).toThrow(/unique ascending/);
    expect(() => decode(mutateJson(encoded, (raw) => { raw.research = ['drive2', 'scan1']; })))
      .toThrow(/canonical catalogue order/);
    expect(() => decode(mutateJson(encoded, (raw) => { raw.research = ['future']; })))
      .toThrow(/unrecognized/);

    const reboundMars = world({ ...SOL, planet: { seed: 134 } });
    const lyingResolver: EngineeringAddressResolver = {
      resolveWorldAddress: () => reboundMars,
      resolveStarAddress: () => null,
    };
    expect(() => decode(mutateJson(encoded, (raw) => {
      const rows = raw.worlds as Array<{ address: { galaxy: { x: number } } }>;
      rows[0]!.address.galaxy.x += 0.01;
    }), lyingResolver)).toThrow(/does not match rebound provenance/);
  });

  it('enforces the UTF-8 byte bound, empty-state fixed point, and explicit revision exhaustion', () => {
    const empty = createEngineeringState();
    const encoded = encodeEngineeringState(empty);
    expect(encodeEngineeringState(decodeEngineeringState(encoded, SCENE_ENGINEERING_ADDRESS_RESOLVER)))
      .toBe(encoded);
    expect(() => decodeEngineeringState(
      'é'.repeat(Math.floor(MAX_ENGINEERING_STATE_JSON_BYTES / 2) + 1),
      SCENE_ENGINEERING_ADDRESS_RESOLVER,
    )).toThrow(/compatibility bound/);

    const exhausted = migrateLegacyEngineeringState(
      legacyState([], [], [], MAX_ENGINEERING_REVISION),
      createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    );
    expect(isEngineeringRevisionExhausted(exhausted)).toBe(true);
  });
});

describe('@cf/domain-opportunity — explicit legacy seed migration', () => {
  it('refuses missing, ambiguous, cloned, and wrong-leaf resolutions', () => {
    const marsA = world({ ...SOL, planet: { seed: 134 } });
    const marsB = world({ ...SOL, planet: { seed: 134 } });
    const earth = world({ ...SOL, planet: { seed: 133 } });
    const legacy = legacyState([{ seed: 134, extractionsTaken: 1 }]);

    const missing: LegacyEngineeringSeedResolver = {
      resolveWorldSeed: () => [],
      resolveStarSeed: () => [],
    };
    expect(() => migrateLegacyEngineeringState(legacy, missing)).toThrow(/no canonical address/);

    const collision = createLegacyEngineeringSeedResolver({ worlds: [marsA, marsB], stars: [] });
    expect(() => migrateLegacyEngineeringState(legacy, collision)).toThrow(/ambiguous/);

    const cloned: LegacyEngineeringSeedResolver = {
      resolveWorldSeed: () => [{ ...marsA } as CanonicalCF1WorldAddress],
      resolveStarSeed: () => [],
    };
    expect(() => migrateLegacyEngineeringState(legacy, cloned)).toThrow(/unregistered/);

    const wrongLeaf: LegacyEngineeringSeedResolver = {
      resolveWorldSeed: () => [earth],
      resolveStarSeed: () => [],
    };
    expect(() => migrateLegacyEngineeringState(legacy, wrongLeaf)).toThrow(/wrong leaf/);
  });

  it('rejects forged-parent inventory addresses before migration', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const forgedParent = {
      ...mars,
      galaxy: { ...mars.galaxy, x: mars.galaxy.x + 0.01 },
    } as CanonicalCF1WorldAddress;
    expect(() => createLegacyEngineeringSeedResolver({ worlds: [forgedParent], stars: [] }))
      .toThrow(/unregistered/);
  });
});

describe('@cf/domain-opportunity — purity boundary', () => {
  it('contains no DOM, clock, ambient random, or timer access', () => {
    const sourceDirectory = fileURLToPath(new URL('../src/', import.meta.url));
    const source = readdirSync(sourceDirectory)
      .filter((name) => name.endsWith('.ts'))
      .map((name) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8'))
      .join('\n');
    expect(source).not.toMatch(/\bMath\.random\s*\(/);
    expect(source).not.toMatch(/\bDate\.now\s*\(/);
    expect(source).not.toMatch(/\b(?:document|window|globalThis|performance|setTimeout|setInterval)\b/);
  });
});
