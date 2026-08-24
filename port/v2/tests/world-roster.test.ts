import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  MAX_ECOLOGY_EPOCH,
  planetSpecies,
} from '@cf/domain-ecology';
import { _earthNamePass, installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { evolveGenome } from '@cf/domain-genetics';
import { MAX_COSMIC_EPOCH } from '@cf/domain-progression';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import {
  resolveCF1WorldAddress,
  systemScene,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  CANONICAL_BIOSPHERE_KEYS,
  PLANETSIDE_PREVIEW_LIMIT,
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  isCanonicalWorldRoster,
  worldRosterView,
  type CanonicalWorldRoster,
  type WorldRosterSources,
} from '../apps/game/src/world-roster.js';

const HOME_GALAXY = { seed: 999, x: 90, y: -60 };
const SOL = { seed: 424242, x: 560, y: 170 };
const FOREIGN_GALAXY = { seed: 394332036, x: -300.95, y: 175.47 };
const FOREIGN_STAR = { seed: 676840317, x: 27.3, y: -24.6 };
const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);

beforeAll(() => installCaptureHooks());

function addressOf(
  galaxy: { seed: number; x: number; y: number },
  star: { seed: number; x: number; y: number },
  planetSeed: number,
): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planetSeed } });
  expect(resolved.ok).toBe(true);
  if (!resolved.ok) throw new Error(`world fixture did not prove: ${resolved.reason}`);
  return resolved.address;
}

const AMBIENT_EPOCH_KEY = 'COSMIC_EPOCH';

function withLegacyEpoch<T>(epoch: number, action: () => T): T {
  const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_EPOCH_KEY);
  if (!Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: epoch,
  })) throw new Error('could not install legacy Earth-roster oracle');
  try {
    return action();
  } finally {
    if (previous) Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, previous);
    else Reflect.deleteProperty(globalThis, AMBIENT_EPOCH_KEY);
  }
}

function legacyEarthVagrants(ecologyEpoch: number): Array<Record<string, unknown>> {
  const random = mulberry32(hashInt(133, ecologyEpoch, 0x7A9E) >>> 0);
  const count = ecologyEpoch > 0 ? 1 + (random() < 0.5 ? 1 : 0) : 0;
  const vagrants: Array<Record<string, unknown>> = [];
  for (let index = 0; index < count; index++) {
    const kingdom = random() < 0.7 ? 'fauna' : 'flora';
    const genome = evolveGenome(makeGenome(
      hashInt(133, ecologyEpoch * 163 + index + 1, 0xEA271) >>> 0,
      kingdom,
      1,
    ), 0);
    genome._cradle = 1;
    genome._rare = 1;
    vagrants.push(genome);
  }
  _earthNamePass(vagrants);
  return vagrants;
}

function legacyEarthRosterOracle(ecologyEpoch: number): Array<Record<string, unknown>> {
  const system = systemFor(SOL.seed);
  const earth = systemScene(SOL.seed).planets.find((planet) => planet.seed === 133);
  if (!earth) throw new Error('legacy Earth oracle could not find Earth');
  const band = climateBand(earth.P, system, earth.orb);
  const starters = withLegacyEpoch(ecologyEpoch, () => structuredClone(
    planetSpecies(earth.P as { seed: number }, system, band, 'complex'),
  )) as Array<Record<string, unknown>>;
  _earthNamePass(starters);
  const rows = starters.concat(legacyEarthVagrants(ecologyEpoch));
  for (const row of rows) row._cradle = 1;
  return rows;
}

function canonicalFingerprintValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (Array.isArray(value)) return `[${value.map(canonicalFingerprintValue).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalFingerprintValue(record[key])}`).join(',')}}`;
}

function independentFullRosterFingerprint(
  worldKey: string,
  ecologyEpoch: number,
  rows: readonly Readonly<Record<string, unknown>>[],
): string {
  const canonical = canonicalFingerprintValue([worldKey, ecologyEpoch, rows]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `cwr1:${rows.length}:${canonical.length}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function mainWorldRosterAuthorityErrors(source: string): string[] {
  const errors: string[] = [];
  if (!source.includes("import { canonicalWorldRoster } from './world-roster.js';")) {
    errors.push('canonical roster import missing');
  }
  if (!source.includes('canonicalCF1WorldAddressFromNav(state)')) {
    errors.push('surface NavState is not converted to a canonical CF1 address');
  }
  if (!source.includes('const roster = rosterResult.roster.view.preview;')) {
    errors.push('Planetside does not consume the canonical preview');
  }
  if (!source.includes('showPlanetsideRosterFailure(`${rosterResult.reason}:${rosterResult.message}`)')) {
    errors.push('source failure is not kept distinct from a valid empty roster');
  }
  if (/from ['"]@cf\/domain-ecology['"]/.test(source)
    || /\bplanetSpecies\s*\(/.test(source)
    || /\bfunction\s+(?:biosphereReplica|fullWorldRoster)\b/.test(source)
    || /\bclimateBand\s*\(/.test(source)) {
    errors.push('main reconstructs ecology outside the canonical roster owner');
  }
  return errors;
}

describe('MAIN-3 — full world roster vs Planetside preview', () => {
  it('pins the complete canonical biosphere key vocabulary', () => {
    expect(CANONICAL_BIOSPHERE_KEYS).toEqual([
      'earth', 'none', 'complex', 'flora', 'aquatic',
      'sparse', 'microbial', 'subsurface', 'aerial', 'xfauna',
    ]);
    expect(new Set(CANONICAL_BIOSPHERE_KEYS).size).toBe(CANONICAL_BIOSPHERE_KEYS.length);
    expect(Object.isFrozen(CANONICAL_BIOSPHERE_KEYS)).toBe(true);
  });

  it('preserves every canonical row while bounding only the thumbnail view', () => {
    const source = Array.from({ length: 13 }, (_, index) => ({ id: `species-${index}` }));
    const view = worldRosterView(source);
    expect(view.all.map((row) => row.id)).toEqual(source.map((row) => row.id));
    expect(view.preview.map((row) => row.id)).toEqual(source.slice(0, 8).map((row) => row.id));
    expect(view.total).toBe(13);
    expect(view.hiddenFromPreview).toBe(5);
    expect(PLANETSIDE_PREVIEW_LIMIT).toBe(8);
  });

  it('does not let caller or preview-array mutation rewrite the canonical roster snapshot', () => {
    const source = [{ id: 'a' }, { id: 'b' }];
    const view = worldRosterView(source);
    source.push({ id: 'c' });
    expect(view.all.map((row) => row.id)).toEqual(['a', 'b']);
    expect(Object.isFrozen(view.all)).toBe(true);
    expect(Object.isFrozen(view.preview)).toBe(true);
  });

  it('keeps short/empty rosters exact and rejects non-arrays', () => {
    expect(worldRosterView([])).toEqual({ all: [], preview: [], total: 0, hiddenFromPreview: 0 });
    expect(worldRosterView([{ id: 1 }]).preview).toEqual([{ id: 1 }]);
    expect(() => worldRosterView(null as never)).toThrow('world roster must be an array');
  });

  it('builds the real Earth roster with detached, deeply frozen names', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const result = canonicalWorldRoster(earth, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.address).toBe(earth);
    expect(result.roster.worldKey).toBe('CF1|g:999@90,-60|s:424242@560,170|p:133#2');
    expect(result.roster.biosphereKey).toBe('earth');
    expect(result.roster.ecologyEpoch).toBe(0);
    expect(result.roster.view.total).toBeGreaterThan(8);
    expect(result.roster.view.preview).toHaveLength(8);
    expect(result.roster.view.all.every((row) => typeof row._earthName === 'string')).toBe(true);
    expect(result.roster.view.all.every((row) => row._cradle === 1)).toBe(true);
    expect(result.roster.view.all.some((row) => row._rare === 1)).toBe(false);
    expect(result.roster.view.all.map((row) => row._earthName)).toEqual([
      'Persimmon', 'Devil\'s Club', 'Cranberry', 'Rambutan', 'Wild Guava',
      'Barrel Cactus Fruit', 'Mildew', 'Giant Puffball', 'Red-Tide Algae',
      'Halophile', 'Euglena', 'Platypus', 'Civet', 'Brittle Star', 'Frog',
      'Pheasant', 'Oryx', 'Sea Urchin', 'Prawn',
    ]);
    expect(result.roster.fullRosterFingerprint).toBe('cwr1:19:6305:58e079f2');
    expect(result.roster.fullRosterFingerprint).toBe(independentFullRosterFingerprint(
      result.roster.worldKey,
      result.roster.ecologyEpoch,
      result.roster.view.all,
    ));
    expect(isCanonicalWorldRoster(result.roster)).toBe(true);
    expect(isCanonicalWorldRoster({ ...result.roster })).toBe(false);
    expect(Object.isFrozen(result.roster)).toBe(true);
    expect(Object.isFrozen(result.roster.view.all[0])).toBe(true);
    const nested = Object.values(result.roster.view.all[0]!).find((value) => value && typeof value === 'object');
    if (nested) expect(Object.isFrozen(nested)).toBe(true);
  });

  it('matches the independent legacy Earth oracle at epoch 0 and positive epochs', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    // @ts-expect-error The production owner requires an explicit F4 epoch.
    const omitted = canonicalWorldRoster(earth);
    expect(omitted).toEqual({
      ok: false,
      reason: 'invalid-epoch',
      message: 'ecology epoch must be an integer from 0 through 10000',
    });

    for (const ecologyEpoch of [0, 1, 3, 7, 10_000]) {
      const result = canonicalWorldRoster(earth, ecologyEpoch);
      expect(result.ok, `epoch ${ecologyEpoch}`).toBe(true);
      if (!result.ok) continue;
      expect(result.roster.ecologyEpoch).toBe(ecologyEpoch);
      expect(result.roster.view.all, `epoch ${ecologyEpoch}`).toEqual(
        legacyEarthRosterOracle(ecologyEpoch),
      );
      expect(result.roster.view.preview).toHaveLength(PLANETSIDE_PREVIEW_LIMIT);
      expect(result.roster.view.all.every((row) => row._cradle === 1)).toBe(true);
    }
  });

  it('pins exact Earth vagrant count, order, seed, kingdom, and flags', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const starterCount = legacyEarthRosterOracle(0).length;
    const expected = new Map<number, Readonly<{
      fingerprint: string;
      vagrants: ReadonlyArray<Readonly<{ seed: number; kingdom: string; name: string }>>;
    }>>([
      [1, {
        fingerprint: 'cwr1:20:6649:4475e0c7',
        vagrants: [{ seed: 1_469_879_140, kingdom: 'fauna', name: 'Harpy Eagle' }],
      }],
      [3, {
        fingerprint: 'cwr1:21:6991:474178d9',
        vagrants: [
          { seed: 3_987_089_485, kingdom: 'fauna', name: 'Polychaete Worm' },
          { seed: 102_922_185, kingdom: 'fauna', name: 'Sea Snail' },
        ],
      }],
      [7, {
        fingerprint: 'cwr1:21:6984:6c39657c',
        vagrants: [
          { seed: 3_720_706_363, kingdom: 'fauna', name: 'Stonefly' },
          { seed: 411_549_083, kingdom: 'flora', name: 'Alpine Sorrel' },
        ],
      }],
      [10_000, {
        fingerprint: 'cwr1:20:6648:215ecee2',
        vagrants: [{ seed: 1_967_467_694, kingdom: 'flora', name: 'Wild Chive' }],
      }],
    ]);

    for (const [ecologyEpoch, expectation] of expected) {
      const result = canonicalWorldRoster(earth, ecologyEpoch);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const vagrants = result.roster.view.all.slice(starterCount);
      expect(vagrants).toHaveLength(expectation.vagrants.length);
      expect(vagrants.map((row) => ({
        seed: row.seed,
        kingdom: row.kingdom,
        name: row._earthName,
      }))).toEqual(
        expectation.vagrants,
      );
      expect(result.roster.fullRosterFingerprint).toBe(expectation.fingerprint);
      expect(vagrants.every((row) => row._cradle === 1 && row._rare === 1)).toBe(true);
    }
  });

  it('accepts a real proven barren world as canonical none with an empty roster', () => {
    const barren = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barren).toBeDefined();
    const address = addressOf(HOME_GALAXY, SOL, barren!.seed);
    const result = canonicalWorldRoster(address, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.biosphereKey).toBe('none');
    expect(result.roster.ecologyEpoch).toBe(0);
    expect(result.roster.view).toEqual({
      all: [], preview: [], total: 0, hiddenFromPreview: 0,
    });
    const later = canonicalWorldRoster(address, 9);
    expect(later.ok).toBe(true);
    if (later.ok) {
      expect(later.roster.view).toEqual(result.roster.view);
      expect(later.roster.ecologyEpoch).toBe(9);
      expect(later.roster.fullRosterFingerprint).not.toBe(result.roster.fullRosterFingerprint);
    }
  });

  it('uses the canonical ecology source for a real procedural system', () => {
    const scene = systemScene(FOREIGN_STAR.seed);
    const results = scene.planets.map((planet) => canonicalWorldRoster(
      addressOf(FOREIGN_GALAXY, FOREIGN_STAR, planet.seed),
      0,
    ));
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.some((result) => result.ok && result.roster.biosphereKey !== 'earth')).toBe(true);
    for (const result of results) if (result.ok) {
      expect(result.roster.view.total === 0).toBe(result.roster.biosphereKey === 'none');
    }
  });

  it('detaches memoized producer rows and distinguishes address mismatch/source failure from empty', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    const producerRow = { seed: 5, kingdom: 'fauna', nested: { limbs: 4 } };
    const sources: WorldRosterSources = {
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'earth' }),
      planetSpecies: () => Array.from({ length: 13 }, (_, index) => ({ ...producerRow, seed: index })),
      nameEarth: (rows) => { rows.forEach((row, index) => { row._earthName = `Earth ${index}`; }); },
    };
    const built = canonicalWorldRosterForDiagnostics(earth, 0, sources);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.roster.authority).toBe('diagnostic');
    expect(isCanonicalWorldRoster(built.roster)).toBe(false);
    // @ts-expect-error A diagnostic roster cannot become acquisition authority.
    const cannotPromote: CanonicalWorldRoster = built.roster;
    expect(isCanonicalWorldRoster(cannotPromote)).toBe(false);
    expect(built.roster.view.total).toBe(13);
    expect(built.roster.view.hiddenFromPreview).toBe(5);
    expect(() => { (built.roster.view.all[0]!.nested as { limbs: number }).limbs = 9; }).toThrow();
    expect(producerRow).toEqual({ seed: 5, kingdom: 'fauna', nested: { limbs: 4 } });

    const failed = canonicalWorldRosterForDiagnostics(earth, 0, {
      ...sources,
      systemFor: () => { throw new Error('injected ecology source failure'); },
    });
    expect(failed).toEqual({ ok: false, reason: 'source-error', message: 'injected ecology source failure' });

    const planets = (realSystem.planets as Array<Record<string, unknown>>).map((entry, ordinal) =>
      ordinal === earth.planet.ordinal
        ? { ...entry, P: { ...(entry.P as Record<string, unknown>), seed: 999_999 } }
        : entry);
    const mismatched = canonicalWorldRosterForDiagnostics(earth, 0, {
      ...sources,
      systemFor: () => ({ ...realSystem, planets }),
    });
    expect(mismatched).toEqual({
      ok: false,
      reason: 'address-mismatch',
      message: `canonical world ${earth.key} does not match its source planet ordinal`,
    });

    const cloned = canonicalWorldRosterForDiagnostics({ ...earth }, 0, sources);
    expect(cloned).toEqual({
      ok: false,
      reason: 'unproven-address',
      message: 'world roster requires a proven canonical CF1 world address',
    });
  });

  it('rejects hostile or non-canonical source rows without invoking accessors or toJSON', () => {
    const barrenNode = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barrenNode).toBeDefined();
    const address = addressOf(HOME_GALAXY, SOL, barrenNode!.seed);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    const sourcesFor = (rows: unknown): WorldRosterSources => ({
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'complex' }),
      planetSpecies: () => rows as Array<Record<string, unknown>>,
      nameEarth: () => {},
    });
    const reject = (rows: unknown, message: RegExp): void => {
      const result = canonicalWorldRosterForDiagnostics(address, 0, sourcesFor(rows));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toBe('source-error');
      expect(result.message).toMatch(message);
    };

    let seedReads = 0;
    const accessorRow: Record<string, unknown> = { kingdom: 'fauna' };
    Object.defineProperty(accessorRow, 'seed', {
      enumerable: true,
      get() { seedReads++; return 77; },
    });
    reject([accessorRow], /seed must be an enumerable data property/);
    expect(seedReads).toBe(0);

    let toJSONReads = 0;
    const toJSONRow: Record<string, unknown> = { seed: 78, kingdom: 'fauna' };
    Object.defineProperty(toJSONRow, 'toJSON', {
      enumerable: true,
      get() { toJSONReads++; return () => 'forged'; },
    });
    reject([toJSONRow], /toJSON must be an enumerable data property/);
    expect(toJSONReads).toBe(0);

    let rowReads = 0;
    const accessorRows: unknown[] = [];
    Object.defineProperty(accessorRows, '0', {
      configurable: true,
      enumerable: true,
      get() { rowReads++; return { seed: 79, kingdom: 'fauna' }; },
    });
    accessorRows.length = 1;
    reject(accessorRows, /\[0\] must be an enumerable data property/);
    expect(rowReads).toBe(0);

    const symbolRow: Record<string | symbol, unknown> = { seed: 80, kingdom: 'fauna' };
    symbolRow[Symbol('hidden')] = 1;
    reject([symbolRow], /has a symbol key/);

    const nonEnumerableRow: Record<string, unknown> = { seed: 81, kingdom: 'fauna' };
    Object.defineProperty(nonEnumerableRow, 'hidden', { enumerable: false, value: 1 });
    reject([nonEnumerableRow], /hidden must be an enumerable data property/);

    const customPrototype = Object.assign(Object.create({ inherited: true }), {
      seed: 82,
      kingdom: 'fauna',
    });
    reject([customPrototype], /must be an exact plain data object/);
    reject([null], /must be an exact plain data object/);

    const cyclic: Record<string, unknown> = { seed: 83, kingdom: 'fauna' };
    cyclic.self = cyclic;
    reject([cyclic], /contains a cyclic row/);

    const deep: Record<string, unknown> = { seed: 84, kingdom: 'fauna' };
    let cursor = deep;
    for (let depth = 0; depth < 10; depth++) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    reject([deep], /exceeds its canonical depth budget/);
    reject(
      Array.from({ length: 65 }, (_, seed) => ({ seed, kingdom: 'fauna' })),
      /exceeds its canonical length budget/,
    );

    const earth = addressOf(HOME_GALAXY, SOL, 133);
    let namedGetterReads = 0;
    const hostileNaming = canonicalWorldRosterForDiagnostics(earth, 0, {
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'earth' }),
      planetSpecies: () => [{ seed: 85, kingdom: 'fauna' }],
      nameEarth: (rows) => {
        if (!rows[0]) return;
        Object.defineProperty(rows[0], '_earthName', {
          enumerable: true,
          get() { namedGetterReads++; return 'forged'; },
        });
      },
    });
    expect(hostileNaming.ok).toBe(false);
    if (!hostileNaming.ok) {
      expect(hostileNaming.reason).toBe('source-error');
      expect(hostileNaming.message).toMatch(/_earthName must be an enumerable data property/);
    }
    expect(namedGetterReads).toBe(0);
  });

  it('fingerprints the ordered detached full roster, including rows hidden from preview', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    const baseRows = Array.from({ length: 13 }, (_, index) => ({
      id: `row-${index}`,
      seed: 10_000 + index,
      kingdom: 'fauna',
      nested: { trait: index },
    }));
    const sourcesFor = (rows: Array<Record<string, unknown>>): WorldRosterSources => ({
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'earth' }),
      planetSpecies: () => rows,
      nameEarth: (named) => {
        for (const row of named) row._earthName = `Named ${String(row.id)}`;
      },
    });

    const original = canonicalWorldRosterForDiagnostics(earth, 0, sourcesFor(baseRows));
    expect(original.ok).toBe(true);
    if (!original.ok) return;
    expect(original.roster.fullRosterFingerprint).toBe(independentFullRosterFingerprint(
      original.roster.worldKey,
      original.roster.ecologyEpoch,
      original.roster.view.all,
    ));
    expect(original.roster.fullRosterFingerprint).not.toBe(independentFullRosterFingerprint(
      original.roster.worldKey,
      original.roster.ecologyEpoch,
      original.roster.view.preview,
    ));

    const hiddenMutationRows = structuredClone(baseRows);
    hiddenMutationRows[12]!.nested.trait = 999;
    const hiddenMutation = canonicalWorldRosterForDiagnostics(
      earth,
      0,
      sourcesFor(hiddenMutationRows),
    );
    expect(hiddenMutation.ok).toBe(true);
    if (hiddenMutation.ok) {
      expect(hiddenMutation.roster.view.preview).toEqual(original.roster.view.preview);
      expect(hiddenMutation.roster.fullRosterFingerprint).not.toBe(
        original.roster.fullRosterFingerprint,
      );
    }

    const reorderedRows = structuredClone(baseRows);
    [reorderedRows[10], reorderedRows[11]] = [reorderedRows[11]!, reorderedRows[10]!];
    const reordered = canonicalWorldRosterForDiagnostics(earth, 0, sourcesFor(reorderedRows));
    expect(reordered.ok).toBe(true);
    if (reordered.ok) {
      expect(reordered.roster.view.preview).toEqual(original.roster.view.preview);
      expect(reordered.roster.fullRosterFingerprint).not.toBe(original.roster.fullRosterFingerprint);
    }

    const fingerprintBefore = original.roster.fullRosterFingerprint;
    expect(() => {
      (original.roster.view.all[12]!.nested as { trait: number }).trait = 404;
    }).toThrow();
    baseRows[12]!.nested.trait = 505;
    expect((original.roster.view.all[12]!.nested as { trait: number }).trait).toBe(12);
    expect(original.roster.fullRosterFingerprint).toBe(fingerprintBefore);
  });

  it('threads the explicit epoch through non-Earth ecology without adding Earth flags or names', () => {
    const barrenNode = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barrenNode).toBeDefined();
    const address = addressOf(HOME_GALAXY, SOL, barrenNode!.seed);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    let receivedEpoch = -1;
    let earthNameCalls = 0;
    const result = canonicalWorldRosterForDiagnostics(address, 37, {
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'complex' }),
      planetSpecies: (_planet, _system, _band, _level, ecologyEpoch) => {
        receivedEpoch = ecologyEpoch;
        return [{ seed: 77, kingdom: 'fauna' }];
      },
      nameEarth: () => { earthNameCalls++; },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(receivedEpoch).toBe(37);
    expect(earthNameCalls).toBe(0);
    expect(result.roster.ecologyEpoch).toBe(37);
    expect(result.roster.view.all).toEqual([{ seed: 77, kingdom: 'fauna' }]);
  });

  it('rejects bogus/contradictory keys and empty inhabited producers without laundering source errors', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const barrenNode = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barrenNode).toBeDefined();
    const barren = addressOf(HOME_GALAXY, SOL, barrenNode!.seed);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    const inhabitedRow = { seed: 5, kingdom: 'fauna' };
    const sources: WorldRosterSources = {
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'earth' }),
      planetSpecies: () => [inhabitedRow],
      nameEarth: () => {},
    };

    expect(canonicalWorldRosterForDiagnostics(earth, 0, {
      ...sources,
      biosphere: () => ({ key: 'bogus' }),
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere source returned unsupported key "bogus"',
    });
    expect(canonicalWorldRosterForDiagnostics(earth, 0, {
      ...sources,
      biosphere: () => ({ key: 'complex' }),
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'planet seed 133 requires biosphere key "earth"',
    });
    expect(canonicalWorldRosterForDiagnostics(barren, 0, sources)).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere key "earth" is only valid for planet seed 133',
    });

    const inhabitedKeys = CANONICAL_BIOSPHERE_KEYS.filter((key) => key !== 'earth' && key !== 'none');
    for (const key of inhabitedKeys) {
      expect(canonicalWorldRosterForDiagnostics(barren, 0, {
        ...sources,
        biosphere: () => ({ key }),
        planetSpecies: () => [],
      }), key).toEqual({
        ok: false,
        reason: 'source-error',
        message: `biosphere key "${key}" returned an empty inhabited roster`,
      });
    }
    expect(canonicalWorldRosterForDiagnostics(earth, 0, {
      ...sources,
      planetSpecies: () => [],
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere key "earth" returned an empty inhabited roster',
    });

    let noneSpeciesCalls = 0;
    const none = canonicalWorldRosterForDiagnostics(barren, 0, {
      ...sources,
      biosphere: () => ({ key: 'none' }),
      planetSpecies: () => {
        noneSpeciesCalls++;
        throw new Error('none must not query species');
      },
    });
    expect(none.ok).toBe(true);
    if (none.ok) expect(none.roster.view.total).toBe(0);
    expect(noneSpeciesCalls).toBe(0);
  });

  it('refuses invalid or coercible epoch input before consulting any source', () => {
    expect(MAX_ECOLOGY_EPOCH).toBe(MAX_COSMIC_EPOCH);
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    let sourceCalls = 0;
    const sources: WorldRosterSources = {
      systemFor: () => { sourceCalls++; throw new Error('must not run'); },
      climateBand: () => { throw new Error('must not run'); },
      biosphere: () => { throw new Error('must not run'); },
      planetSpecies: () => { throw new Error('must not run'); },
      nameEarth: () => { throw new Error('must not run'); },
    };
    for (const invalid of [-1, MAX_ECOLOGY_EPOCH + 1, 0.5, NaN, Infinity, '4', null, undefined]) {
      expect(canonicalWorldRosterForDiagnostics(earth, invalid, sources), String(invalid)).toEqual({
        ok: false,
        reason: 'invalid-epoch',
        message: 'ecology epoch must be an integer from 0 through 10000',
      });
    }
    let coercions = 0;
    const reflected = { valueOf: () => { coercions++; return 4; } };
    expect(canonicalWorldRosterForDiagnostics(earth, reflected, sources)).toEqual({
      ok: false,
      reason: 'invalid-epoch',
      message: 'ecology epoch must be an integer from 0 through 10000',
    });
    expect(coercions).toBe(0);
    expect(sourceCalls).toBe(0);
  });

  it('does not read or write a reflected ambient epoch while building the production roster', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_EPOCH_KEY);
    let reads = 0;
    let writes = 0;
    if (!Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, {
      configurable: true,
      enumerable: false,
      get: () => { reads++; throw new Error('ambient epoch read'); },
      set: () => { writes++; throw new Error('ambient epoch write'); },
    })) throw new Error('could not install roster ambient-epoch tripwire');
    try {
      const result = canonicalWorldRoster(earth, 7);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.roster.ecologyEpoch).toBe(7);
      expect(reads).toBe(0);
      expect(writes).toBe(0);
    } finally {
      if (previous) Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, previous);
      else Reflect.deleteProperty(globalThis, AMBIENT_EPOCH_KEY);
    }
  });

  it('statically keeps main on MAIN-3 and rejects a direct duplicate ecology constructor', () => {
    expect(mainWorldRosterAuthorityErrors(mainSource)).toEqual([]);

    const duplicate = `${mainSource}\nfunction fullWorldRoster() { return planetSpecies(); }`;
    expect(mainWorldRosterAuthorityErrors(duplicate)).toContain(
      'main reconstructs ecology outside the canonical roster owner',
    );

    const bypass = mainSource.replace(
      'const roster = rosterResult.roster.view.preview;',
      'const roster = [] as readonly Record<string, unknown>[];',
    );
    expect(bypass).not.toBe(mainSource);
    expect(mainWorldRosterAuthorityErrors(bypass)).toContain(
      'Planetside does not consume the canonical preview',
    );
  });
});
