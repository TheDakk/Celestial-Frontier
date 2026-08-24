import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  resolveCF1WorldAddress,
  systemScene,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import { systemFor } from '@cf/domain-worldgen';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  CANONICAL_BIOSPHERE_KEYS,
  PLANETSIDE_PREVIEW_LIMIT,
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  worldRosterView,
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
    const result = canonicalWorldRoster(earth);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.address).toBe(earth);
    expect(result.roster.worldKey).toBe('CF1|g:999@90,-60|s:424242@560,170|p:133#2');
    expect(result.roster.biosphereKey).toBe('earth');
    expect(result.roster.view.total).toBeGreaterThan(8);
    expect(result.roster.view.preview).toHaveLength(8);
    expect(result.roster.view.all.every((row) => typeof row._earthName === 'string')).toBe(true);
    expect(Object.isFrozen(result.roster.view.all[0])).toBe(true);
    const nested = Object.values(result.roster.view.all[0]!).find((value) => value && typeof value === 'object');
    if (nested) expect(Object.isFrozen(nested)).toBe(true);
  });

  it('accepts a real proven barren world as canonical none with an empty roster', () => {
    const barren = systemScene(SOL.seed).planets.find((planet) => planet.seed !== 133);
    expect(barren).toBeDefined();
    const address = addressOf(HOME_GALAXY, SOL, barren!.seed);
    const result = canonicalWorldRoster(address);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.biosphereKey).toBe('none');
    expect(result.roster.view).toEqual({
      all: [], preview: [], total: 0, hiddenFromPreview: 0,
    });
  });

  it('uses the canonical ecology source for a real procedural system', () => {
    const scene = systemScene(FOREIGN_STAR.seed);
    const results = scene.planets.map((planet) => canonicalWorldRoster(
      addressOf(FOREIGN_GALAXY, FOREIGN_STAR, planet.seed),
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
    const built = canonicalWorldRosterForDiagnostics(earth, sources);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.roster.view.total).toBe(13);
    expect(built.roster.view.hiddenFromPreview).toBe(5);
    expect(() => { (built.roster.view.all[0]!.nested as { limbs: number }).limbs = 9; }).toThrow();
    expect(producerRow).toEqual({ seed: 5, kingdom: 'fauna', nested: { limbs: 4 } });

    const failed = canonicalWorldRosterForDiagnostics(earth, {
      ...sources,
      systemFor: () => { throw new Error('injected ecology source failure'); },
    });
    expect(failed).toEqual({ ok: false, reason: 'source-error', message: 'injected ecology source failure' });

    const planets = (realSystem.planets as Array<Record<string, unknown>>).map((entry, ordinal) =>
      ordinal === earth.planet.ordinal
        ? { ...entry, P: { ...(entry.P as Record<string, unknown>), seed: 999_999 } }
        : entry);
    const mismatched = canonicalWorldRosterForDiagnostics(earth, {
      ...sources,
      systemFor: () => ({ ...realSystem, planets }),
    });
    expect(mismatched).toEqual({
      ok: false,
      reason: 'address-mismatch',
      message: `canonical world ${earth.key} does not match its source planet ordinal`,
    });

    const cloned = canonicalWorldRosterForDiagnostics({ ...earth }, sources);
    expect(cloned).toEqual({
      ok: false,
      reason: 'unproven-address',
      message: 'world roster requires a proven canonical CF1 world address',
    });
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

    expect(canonicalWorldRosterForDiagnostics(earth, {
      ...sources,
      biosphere: () => ({ key: 'bogus' }),
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere source returned unsupported key "bogus"',
    });
    expect(canonicalWorldRosterForDiagnostics(earth, {
      ...sources,
      biosphere: () => ({ key: 'complex' }),
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'planet seed 133 requires biosphere key "earth"',
    });
    expect(canonicalWorldRosterForDiagnostics(barren, sources)).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere key "earth" is only valid for planet seed 133',
    });

    const inhabitedKeys = CANONICAL_BIOSPHERE_KEYS.filter((key) => key !== 'earth' && key !== 'none');
    for (const key of inhabitedKeys) {
      expect(canonicalWorldRosterForDiagnostics(barren, {
        ...sources,
        biosphere: () => ({ key }),
        planetSpecies: () => [],
      }), key).toEqual({
        ok: false,
        reason: 'source-error',
        message: `biosphere key "${key}" returned an empty inhabited roster`,
      });
    }
    expect(canonicalWorldRosterForDiagnostics(earth, {
      ...sources,
      planetSpecies: () => [],
    })).toEqual({
      ok: false,
      reason: 'source-error',
      message: 'biosphere key "earth" returned an empty inhabited roster',
    });

    let noneSpeciesCalls = 0;
    const none = canonicalWorldRosterForDiagnostics(barren, {
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
