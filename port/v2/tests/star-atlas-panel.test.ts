import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  canonicalCF1WorldAtlasId,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  importSaveV2,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  clusterStarAtlasPointsV1,
  projectStarAtlasV1,
  renderStarAtlasV1,
  type StarAtlasChartPointV1,
  type StarAtlasFilterV1,
  type StarAtlasModelV1,
  type StarAtlasViewV1,
} from '../apps/game/src/star-atlas-panel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const COLLISION_SEED = 488_332_735;
const COLLIDING_WORLD_CANDIDATES = Object.freeze([
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_594_395_733, x: -5_501.81, y: -11_753.64 }),
    star: Object.freeze({ seed: 4_077_594_722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_336_287_406, x: -2_657.91, y: -11_817.01 }),
    star: Object.freeze({ seed: 1_391_422_746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
]);

let FIRST_WORLD: CanonicalCF1WorldAddress;
let SECOND_WORLD: CanonicalCF1WorldAddress;

beforeAll(() => {
  installCaptureHooks();
  const first = resolveCF1WorldAddress(COLLIDING_WORLD_CANDIDATES[0]);
  const second = resolveCF1WorldAddress(COLLIDING_WORLD_CANDIDATES[1]);
  if (!first.ok || !second.ok) throw new Error('Star Atlas collision fixtures must resolve');
  FIRST_WORLD = first.address;
  SECOND_WORLD = second.address;
});

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Star Atlas base save failed: ${imported.reason}`);
  return imported.state;
}

function entry(
  id: string,
  options: Readonly<{
    title: string;
    favorite?: boolean;
    badge?: string;
    timestamp: number;
    galaxy?: Readonly<{ x: number; y: number }>;
  }>,
): [string, Record<string, unknown>] {
  const where = options.galaxy === undefined ? null : {
    gal: { ...options.galaxy, seed: 999, size: 1_500 },
  };
  return [id, {
    id,
    title: options.title,
    sub: `Survey of ${options.title}`,
    thumb: null,
    sq: false,
    badge: options.badge ?? '',
    where,
    fav: options.favorite ?? false,
    t: options.timestamp,
    retained: { nested: ['exact', id] },
  }];
}

function fixtureState(): Readonly<{
  state: SaveStateV2;
  firstId: string;
  secondId: string;
  legacyId: string;
}> {
  const state = baseState();
  const firstId = canonicalCF1WorldAtlasId(FIRST_WORLD);
  const secondId = canonicalCF1WorldAtlasId(SECOND_WORLD);
  const legacyId = 'p134';
  state.logMap = [
    entry(firstId, {
      title: 'Amber Reach', favorite: true, badge: 'Life', timestamp: NOW - 30,
      galaxy: { x: -5_501.81, y: -11_753.64 },
    }),
    entry(secondId, {
      title: 'Violet Haven', timestamp: NOW - 20,
      galaxy: { x: -2_657.91, y: -11_817.01 },
    }),
    entry(legacyId, {
      title: 'Legacy Mars', badge: 'Signal', timestamp: NOW - 10,
    }),
    entry('s424242', {
      title: 'Sol', timestamp: NOW,
      galaxy: { x: 90, y: -60 },
    }),
  ];
  state.homeId = secondId;
  state.landed = [COLLISION_SEED, 134];
  state.conquered = [
    [COLLISION_SEED, { t: NOW - 2, tier: 3 }],
    [134, { t: NOW - 1, tier: 2 }],
  ];
  return Object.freeze({ state, firstId, secondId, legacyId });
}

function codeUnitSorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}

function project(
  state: SaveStateV2,
  view: StarAtlasViewV1,
  filter: StarAtlasFilterV1,
  travelableAtlasIds: readonly string[],
  landedWorldKeys: readonly string[],
  conqueredWorldKeys: readonly string[],
) {
  return projectStarAtlasV1({
    state, view, filter,
    routeDestinations: travelableAtlasIds.map(
      (id, index) => [id, 100 + index * 7, -50 - index * 3] as const,
    ),
    landedWorldKeys: codeUnitSorted(landedWorldKeys),
    conqueredWorldKeys: codeUnitSorted(conqueredWorldKeys),
    currentGalaxy: { x: 91, y: -61 },
  });
}

function ready(result: ReturnType<typeof projectStarAtlasV1>): StarAtlasModelV1 {
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error(`Star Atlas projection was ${result.reason}`);
  return result;
}

describe('mature Star Atlas projection', () => {
  it('restores exact List filters and ordering without aliasing canonical same-seed worlds', () => {
    const { state, firstId, secondId, legacyId } = fixtureState();
    const before = JSON.stringify(state);
    const common = {
      travelable: [firstId, secondId, legacyId],
      landed: [FIRST_WORLD.key],
      conquered: [SECOND_WORLD.key],
    };
    const all = ready(project(
      state, 'list', 'all', common.travelable, common.landed, common.conquered,
    ));
    expect(all.rows.map(({ id }) => id)).toEqual([
      secondId, firstId, 's424242', legacyId,
    ]);
    expect(all.home).toEqual({ id: secondId, title: 'Violet Haven', travelable: true });
    expect(all.counts).toEqual({
      all: 4, favorites: 1, visited: 2, conquered: 2, life: 2,
    });

    const byId = new Map(all.rows.map((row) => [row.id, row]));
    expect(byId.get(firstId)).toMatchObject({
      planetSeed: COLLISION_SEED,
      worldKey: FIRST_WORLD.key,
      visited: true,
      conquered: false,
    });
    expect(byId.get(secondId)).toMatchObject({
      planetSeed: COLLISION_SEED,
      worldKey: SECOND_WORLD.key,
      visited: false,
      conquered: true,
    });
    /* The lossy leaf carriers still serve only their legacy row. They cannot
       mark both canonical collision worlds visited or conquered. */
    expect(byId.get(legacyId)).toMatchObject({
      planetSeed: 134, worldKey: null, visited: true, conquered: true,
    });

    const ids = (filter: StarAtlasFilterV1): string[] => ready(project(
      state, 'list', filter, common.travelable, common.landed, common.conquered,
    )).rows.map(({ id }) => id);
    expect(ids('favorites')).toEqual([secondId, firstId]);
    expect(ids('visited')).toEqual([firstId, legacyId]);
    expect(ids('conquered')).toEqual([secondId, legacyId]);
    expect(ids('life')).toEqual([firstId, legacyId]);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('uses the same filtered rows in deterministic Chart and List models', () => {
    const { state, firstId, secondId, legacyId } = fixtureState();
    const input = [firstId, secondId];
    const list = ready(project(
      state, 'list', 'visited', input, [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    const chart = ready(project(
      state, 'chart', 'visited', input, [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    const repeated = ready(project(
      state, 'chart', 'visited', input, [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    expect(chart.rows.map(({ id }) => id)).toEqual(list.rows.map(({ id }) => id));
    expect(chart.chartPoints.map(({ id }) => id)).toEqual(list.rows.map(({ id }) => id));
    expect(chart.rows.find(({ id }) => id === firstId)?.galaxy).toEqual({ x: 100, y: -50 });
    expect(chart.chartPoints.find(({ id }) => id === legacyId)).toMatchObject({
      xPercent: null, yPercent: null, clusterKey: null,
    });
    expect(chart.chartCurrentPosition).toEqual(expect.objectContaining({
      xPercent: expect.any(Number), yPercent: expect.any(Number),
    }));
    expect(JSON.stringify(chart)).toBe(JSON.stringify(repeated));
    expect(Object.isFrozen(chart.rows)).toBe(true);
    expect(Object.isFrozen(chart.chartPoints)).toBe(true);
  });

  it('renders every List/Chart destination and control as a keyboard-native button', () => {
    const { state, firstId, secondId, legacyId } = fixtureState();
    const common = [firstId, secondId];
    const list = ready(project(
      state, 'list', 'all', common, [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    const listHtml = renderStarAtlasV1(list, {
      mutationsAvailable: true,
      pending: { kind: 'remove', atlasId: legacyId },
      undo: { atlasId: firstId, title: 'Amber Reach' },
      status: 'Saving one exact Atlas change…',
    });
    expect(listHtml.match(/<button\b/gu)?.length).toBe(25);
    expect(listHtml).toContain('data-atlas-view="list" aria-pressed="true"');
    expect(listHtml).toContain('data-atlas-filter="all" aria-pressed="true"');
    expect(listHtml).toContain(`data-atlas-travel-home="${secondId}"`);
    expect(listHtml).toContain(`data-atlas-remove="${legacyId}" disabled aria-disabled="true"`);
    expect(listHtml).toContain(`data-atlas-undo="${firstId}" disabled aria-disabled="true"`);
    expect(listHtml).not.toMatch(/role="button"|tabindex=/u);

    const chart = ready(project(
      state, 'chart', 'visited', common, [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    const chartHtml = renderStarAtlasV1(chart, {
      mutationsAvailable: true, pending: null, undo: null, status: null,
    });
    expect(chartHtml).toContain(`data-atlas-travel="${firstId}" data-atlas-chart-point`);
    expect(chartHtml).toContain(`data-atlas-travel="${legacyId}" data-atlas-chart-point`);
    expect(chartHtml).not.toContain(`data-atlas-travel="${secondId}"`);
    expect(chartHtml).toContain('class="atlas-chart-current" role="img" aria-label="Your current view"');
    expect(chartHtml).toContain('role="listitem"><button type="button"');
    const chartUndo = renderStarAtlasV1(chart, {
      mutationsAvailable: true, pending: null,
      undo: { atlasId: firstId, title: 'Amber Reach' }, status: null,
    });
    expect(chartUndo).toContain(`data-atlas-undo="${firstId}"`);
    expect(chartHtml).not.toContain('data-atlas-undo=');
  });

  it('escapes saved display text at every HTML sink and protects malformed authorities', () => {
    const { state, firstId } = fixtureState();
    state.logMap[0]![1].title = '<img src=x onerror=alert(1)>';
    state.logMap[0]![1].sub = '" onclick="attack()';
    state.logMap[0]![1].badge = 'Life&';
    const safe = ready(project(
      state, 'list', 'all', [firstId], [FIRST_WORLD.key], [SECOND_WORLD.key],
    ));
    const html = renderStarAtlasV1(safe, {
      mutationsAvailable: true, pending: null, undo: null, status: '<b>unsafe</b>',
    });
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('onclick="attack()');
    expect(html).not.toContain('<b>unsafe</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;unsafe&lt;/b&gt;');

    const valid = fixtureState();
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [], conqueredWorldKeys: [], currentGalaxy: null,
    })).toMatchObject({ kind: 'ready' });
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [FIRST_WORLD.key, SECOND_WORLD.key], conqueredWorldKeys: [],
      currentGalaxy: null,
    })).toEqual({
      schema: 'cf-v2-star-atlas-model/v1',
      kind: 'protected', reason: 'landed-world-authority-shape',
    });
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [FIRST_WORLD.key, FIRST_WORLD.key], conqueredWorldKeys: [],
      currentGalaxy: null,
    })).toMatchObject({ kind: 'protected', reason: 'landed-world-authority-shape' });
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [], conqueredWorldKeys: ['CF1|forged'], currentGalaxy: null,
    })).toMatchObject({ kind: 'protected', reason: 'conquered-world-authority-shape' });
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all',
      routeDestinations: [[valid.firstId, Number.NaN, 0]],
      landedWorldKeys: [], conqueredWorldKeys: [], currentGalaxy: null,
    })).toMatchObject({ kind: 'protected', reason: 'travel-authority-shape' });
    expect(projectStarAtlasV1({
      state: valid.state, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [], conqueredWorldKeys: [], currentGalaxy: { x: 0, y: Infinity },
    })).toMatchObject({ kind: 'protected', reason: 'current-position-shape' });

    const duplicate = fixtureState().state;
    duplicate.logMap.push(duplicate.logMap[0]!);
    expect(projectStarAtlasV1({
      state: duplicate, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [], conqueredWorldKeys: [], currentGalaxy: null,
    })).toMatchObject({ kind: 'protected', reason: 'atlas-id-duplicate' });
    const overCapacity = fixtureState().state;
    overCapacity.logMap = Array.from({ length: 121 }, (_, index) => entry(
      `legacy:${index}`, { title: String(index), timestamp: index },
    ));
    overCapacity.homeId = null;
    expect(projectStarAtlasV1({
      state: overCapacity, view: 'list', filter: 'all', routeDestinations: [],
      landedWorldKeys: [], conqueredWorldKeys: [], currentGalaxy: null,
    })).toMatchObject({ kind: 'protected', reason: 'atlas-capacity' });
  });
});

describe('mature Star Atlas dependency sentinel', () => {
  it('stays browser-state-free, mutation-free, clock-free, and entropy-free', () => {
    const source = fs.readFileSync(path.join(
      here, '..', 'apps', 'game', 'src', 'star-atlas-panel.ts',
    ), 'utf8');
    expect(source).not.toMatch(/from ['"]\.\/main\.js['"]/u);
    expect(source).not.toMatch(/\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b/u);
    expect(source).not.toMatch(/\bMath\s*\.\s*random\s*\(|\bDate\s*\.\s*now\s*\(/u);
    expect(source).not.toMatch(/commitAction|queueSave|saveNow|atlasRouteStates/u);
  });
});

describe('bounded Chart collision selection', () => {
  const point = (id: string, xPercent: number, yPercent: number): StarAtlasChartPointV1 => ({
    id, title: id, favorite: false, home: false, travelable: true,
    xPercent, yPercent, clusterKey: 'canonical-galaxy',
  });
  function touchTargetsOverlap(targets: ReturnType<typeof clusterStarAtlasPointsV1>, size: number): boolean {
    return targets.some((a, index) => targets.slice(index + 1).some((b) =>
      Math.abs(a.xPercent - b.xPercent) * size / 100 < 44
      && Math.abs(a.yPercent - b.yPercent) * size / 100 < 44));
  }
  it('partitions exact IDs once, contains edges and separates 44px targets at the minimum extent', () => {
    const points = Array.from({ length: 120 }, (_, index) => point(
      `exact:${index}`, (index % 12) * 9, Math.floor(index / 12) * 11,
    ));
    const before = JSON.stringify(points);
    const targets = clusterStarAtlasPointsV1(points);
    expect(targets.length).toBeLessThan(points.length);
    expect(targets.flatMap((target) => target.memberIds).sort())
      .toEqual(points.map(({ id }) => id).sort());
    expect(JSON.stringify(points)).toBe(before);
    expect(clusterStarAtlasPointsV1(points)).toEqual(targets);
    expect(Object.isFrozen(targets)).toBe(true);
    for (const size of [220, 240, 300, 440]) {
      expect(touchTargetsOverlap(targets, size)).toBe(false);
      for (const target of targets) {
        expect(target.xPercent * size / 100 - 22).toBeGreaterThanOrEqual(0);
        expect(target.yPercent * size / 100 - 22).toBeGreaterThanOrEqual(0);
        expect(target.xPercent * size / 100 + 22).toBeLessThanOrEqual(size);
        expect(target.yPercent * size / 100 + 22).toBeLessThanOrEqual(size);
      }
    }
    const overlaps = [
      { id: 'a', memberIds: ['a'], xPercent: 50, yPercent: 50 },
      { id: 'b', memberIds: ['b'], xPercent: 51, yPercent: 51 },
    ];
    expect(touchTargetsOverlap(overlaps, 220)).toBe(true);
    expect(() => clusterStarAtlasPointsV1([...points, point('overflow', 0, 0)]))
      .toThrow('bounded exact point list');
    expect(() => clusterStarAtlasPointsV1([point('same', 0, 0), point('same', 50, 50)]))
      .toThrow('bounded exact point list');
  });

  it('opens only exact collision candidates through the existing List controls and returns safely', () => {
    const { state, firstId, secondId } = fixtureState();
    const projected = ready(project(state, 'chart', 'all', [firstId, secondId], [], []));
    const chart: StarAtlasModelV1 = {
      ...projected,
      chartPoints: projected.chartPoints.map((entry) => entry.id === firstId || entry.id === secondId
        ? { ...entry, xPercent: 50, yPercent: 50 } : entry),
    };
    const targets = clusterStarAtlasPointsV1(chart.chartPoints);
    const target = targets.find((entry) => entry.memberIds.includes(firstId))!;
    expect(target.memberIds).toContain(secondId);
    const options = { mutationsAvailable: true, pending: null, undo: null, status: null } as const;
    const overview = renderStarAtlasV1(chart, options);
    expect(overview).toContain(`data-atlas-cluster="${target.id}"`);
    expect(overview).not.toContain(`data-atlas-travel="${firstId}"`);
    const selected = renderStarAtlasV1(chart, { ...options, clusterId: target.id });
    expect(selected).toContain('data-atlas-cluster-back>Return to Chart');
    expect(selected).toContain('data-atlas-cluster-candidates aria-label="Chart destinations"');
    for (const id of target.memberIds) {
      for (const action of ['travel', 'favorite', 'home', 'remove']) {
        expect(selected.split(`data-atlas-${action}="${id}"`).length - 1).toBe(1);
      }
    }
    for (const row of chart.rows.filter(({ id }) => !target.memberIds.includes(id))) {
      expect(selected).not.toContain(`data-atlas-travel="${row.id}"`);
    }
    const protectedRows = { ...chart, rows: chart.rows.map((row) => ({ ...row, travelable: false })) };
    expect(renderStarAtlasV1(protectedRows, { ...options, clusterId: target.id }))
      .toContain(`data-atlas-travel="${firstId}" disabled aria-disabled="true"`);
    expect(renderStarAtlasV1(chart, { ...options, clusterId: 'absent-cluster' }))
      .not.toContain('data-atlas-cluster-back');
    expect(renderStarAtlasV1(chart, { ...options, clusterId: null })).toBe(overview);
  });
});
