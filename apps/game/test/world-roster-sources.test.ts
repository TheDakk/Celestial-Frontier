import { describe, expect, it } from 'vitest';
import { MAX_ECOLOGY_EPOCH } from '@cf/domain-ecology';
import { BIOME_PROFILE_AUTHORITY_V1 } from '@cf/domain-biome-profile';
import { MAX_COSMIC_EPOCH } from '@cf/domain-progression';
import { systemFor } from '@cf/domain-worldgen';
import { systemScene } from '@cf/scene';
import {
  CANONICAL_BIOSPHERE_KEYS,
  canonicalWorldRosterForDiagnostics,
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
  type WorldRosterSources,
} from '../src/world';
import { HOME_GALAXY, SOL, addressOf, independentFullRosterFingerprint } from './world-roster-support';

// Ported from SOURCE tests/world-roster.test.ts:341-733: the roster built from injected sources.
describe('the world roster built from injected sources', () => {
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

  it('fails closed for unsupported climate bands and hostile biome-classifier output', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const realSystem = systemFor(SOL.seed) as unknown as Record<string, unknown>;
    const sources: WorldRosterSources = {
      systemFor: () => realSystem,
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'earth' }),
      planetSpecies: () => [{ seed: 85, kingdom: 'fauna' }],
      nameEarth: (rows) => {
        for (const row of rows) row._earthName = 'Controlled Earth species';
      },
      biomeFor: () => null,
    };
    const reject = (overrides: Partial<WorldRosterSources>, message: RegExp): void => {
      const result = canonicalWorldRosterForDiagnostics(earth, 0, { ...sources, ...overrides });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toBe('source-error');
      expect(result.message).toMatch(message);
    };

    const fallback = canonicalWorldRosterForDiagnostics(earth, 0, sources);
    expect(fallback.ok).toBe(true);
    if (fallback.ok) {
      expect(fallback.roster.climateBand).toBe('temperate');
      expect(fallback.roster.biomeProfileSchema).toBe(BIOME_PROFILE_AUTHORITY_V1.schema);
      expect(fallback.roster.biomeProfileDigest).toBe(BIOME_PROFILE_AUTHORITY_V1.digest);
      expect(fallback.roster.biomeProfileKey).toBe('temperate');
      expect(fallback.roster.biomeProfile).toBe(BIOME_PROFILE_AUTHORITY_V1.profiles.temperate);
    }

    reject({ climateBand: () => 'humid' }, /unsupported climate band/u);
    reject({ biomeFor: () => ({ k: 'retired-biome' }) }, /unsupported biome profile key/u);
    reject({
      biomeFor: (() => []) as unknown as NonNullable<WorldRosterSources['biomeFor']>,
    }, /malformed biome profile selection/u);

    let keyReads = 0;
    const accessorSelection = Object.defineProperty({}, 'k', {
      enumerable: true,
      get() { keyReads++; return 'temperate'; },
    }) as { readonly k?: unknown };
    reject({ biomeFor: () => accessorSelection }, /biome selection without a data key/u);
    expect(keyReads).toBe(0);
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
});
