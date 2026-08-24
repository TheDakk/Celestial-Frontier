import { describe, expect, it } from 'vitest';
import { systemScene } from '@cf/scene';
import {
  PLANETSIDE_PREVIEW_LIMIT,
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  worldRosterView,
  type WorldRosterSources,
} from '../apps/game/src/world-roster.js';

describe('MAIN-3 — full world roster vs Planetside preview', () => {
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
    const earth = systemScene(424242).planets.find((planet) => planet.seed === 133);
    expect(earth).toBeDefined();
    const result = canonicalWorldRoster(earth!, 424242);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.roster.biosphereKey).toBe('earth');
    expect(result.roster.view.total).toBeGreaterThan(8);
    expect(result.roster.view.preview).toHaveLength(8);
    expect(result.roster.view.all.every((row) => typeof row._earthName === 'string')).toBe(true);
    expect(Object.isFrozen(result.roster.view.all[0])).toBe(true);
    const nested = Object.values(result.roster.view.all[0]!).find((value) => value && typeof value === 'object');
    if (nested) expect(Object.isFrozen(nested)).toBe(true);
  });

  it('uses the canonical ecology source for a real procedural system', () => {
    const scene = systemScene(1_664_319_693);
    const results = scene.planets.map((planet) => canonicalWorldRoster(planet, scene.starSeed));
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.some((result) => result.ok && result.roster.biosphereKey !== 'earth')).toBe(true);
  });

  it('detaches memoized producer rows and reports source failure instead of laundering it as empty', () => {
    const node = systemScene(424242).planets.find((planet) => planet.seed === 133)!;
    const producerRow = { seed: 5, kingdom: 'fauna', nested: { limbs: 4 } };
    const sources: WorldRosterSources = {
      systemFor: () => ({ sol: false }),
      climateBand: () => 'temperate',
      biosphere: () => ({ key: 'complex' }),
      planetSpecies: () => Array.from({ length: 13 }, (_, index) => ({ ...producerRow, seed: index })),
      nameEarth: (rows) => { rows.forEach((row, index) => { row._earthName = `Earth ${index}`; }); },
    };
    const built = canonicalWorldRosterForDiagnostics(node, 424242, sources);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.roster.view.total).toBe(13);
    expect(built.roster.view.hiddenFromPreview).toBe(5);
    expect(() => { (built.roster.view.all[0]!.nested as { limbs: number }).limbs = 9; }).toThrow();
    expect(producerRow).toEqual({ seed: 5, kingdom: 'fauna', nested: { limbs: 4 } });

    const failed = canonicalWorldRosterForDiagnostics(node, 424242, {
      ...sources,
      systemFor: () => { throw new Error('injected ecology source failure'); },
    });
    expect(failed).toEqual({ ok: false, reason: 'source-error', message: 'injected ecology source failure' });
  });
});
