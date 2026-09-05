/* Mature Star Atlas read model and semantic renderer.

   This restores the shipped List/Chart views and All/Favorites/Visited/
   Conquered/Life lenses over the existing v4-compatible Atlas carrier. It is
   presentation only: routes remain in Main's WeakMap sidecar, while Home,
   Favorite and Remove writes remain separate F4 actions. */
import type { SaveStateV2 } from '@cf/persistence';
import {
  CF1_WORLD_ATLAS_ID_PREFIX,
  resolveCF1WorldAtlasId,
  resolveCF1WorldKey,
} from '@cf/scene';
import {
  detachStarAtlasDataV1,
  exactStarAtlasIdV1,
  inspectStarAtlasStateV1,
  starAtlasDataValueV1,
  starAtlasPlainRecordV1,
  STAR_ATLAS_MAX_ROWS_V1,
  StarAtlasStateProtectionV1,
  type StarAtlasStateProtectionReasonV1,
} from './star-atlas-state.js';

export const STAR_ATLAS_MODEL_SCHEMA_V1 = 'cf-v2-star-atlas-model/v1' as const;
export const STAR_ATLAS_VIEWS_V1 = Object.freeze(['list', 'chart'] as const);
export const STAR_ATLAS_FILTERS_V1 = Object.freeze([
  'all', 'favorites', 'visited', 'conquered', 'life',
] as const);

export type StarAtlasViewV1 = (typeof STAR_ATLAS_VIEWS_V1)[number];
export type StarAtlasFilterV1 = (typeof STAR_ATLAS_FILTERS_V1)[number];
export type StarAtlasProjectionProtectionReasonV1 =
  | StarAtlasStateProtectionReasonV1
  | 'view-shape'
  | 'filter-shape'
  | 'travel-authority-shape'
  | 'landed-shape'
  | 'conquered-shape'
  | 'landed-world-authority-shape'
  | 'conquered-world-authority-shape'
  | 'current-position-shape'
  | 'atlas-row-display-shape';

export interface StarAtlasRowV1 {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly favorite: boolean;
  readonly home: boolean;
  readonly visited: boolean;
  readonly conquered: boolean;
  readonly life: boolean;
  readonly timestamp: number;
  readonly sourceIndex: number;
  readonly travelable: boolean;
  readonly planetSeed: number | null;
  readonly worldKey: string | null;
  readonly galaxy: Readonly<{ x: number; y: number }> | null;
}

export interface StarAtlasChartPointV1 {
  readonly id: string;
  readonly title: string;
  readonly favorite: boolean;
  readonly home: boolean;
  readonly travelable: boolean;
  readonly xPercent: number | null;
  readonly yPercent: number | null;
  readonly clusterKey: string | null;
}

/* Presentation-space grouping, independent of phone/browser measurements.
   The existing Chart has a 220px minimum extent. A 22% separation gives
   48.4px there for each 44px native target, and 12% edge padding contains it.
   The source points and canonical routes remain unchanged. Recheck group
   centers after every merge so a merged target cannot cover another target. */
export interface StarAtlasChartTargetV1 {
  readonly id: string;
  readonly memberIds: readonly string[];
  readonly xPercent: number;
  readonly yPercent: number;
}

export function clusterStarAtlasPointsV1(
  points: readonly StarAtlasChartPointV1[],
): readonly StarAtlasChartTargetV1[] {
  if (points.length > STAR_ATLAS_MAX_ROWS_V1
    || new Set(points.map((point) => point.id)).size !== points.length) {
    throw new TypeError('Atlas targets require the bounded exact point list');
  }
  type MappedPoint = StarAtlasChartPointV1 & { xPercent: number; yPercent: number };
  const groups: MappedPoint[][] = [];
  for (const point of points) {
    if (point.xPercent === null && point.yPercent === null) continue;
    if (!Number.isFinite(point.xPercent) || !Number.isFinite(point.yPercent)
      || point.xPercent === null || point.yPercent === null
      || point.xPercent < 0 || point.xPercent > 100
      || point.yPercent < 0 || point.yPercent > 100) {
      throw new TypeError('Atlas targets require finite normalized source points');
    }
    groups.push([point as MappedPoint]);
  }
  const center = (members: readonly MappedPoint[]): Readonly<{ x: number; y: number }> => ({
    x: Math.max(12, Math.min(88, members.reduce((sum, point) => sum + point.xPercent, 0) / members.length)),
    y: Math.max(12, Math.min(88, members.reduce((sum, point) => sum + point.yPercent, 0) / members.length)),
  });
  let merged = true;
  while (merged) {
    merged = false;
    for (let first = 0; first < groups.length && !merged; first++) {
      const a = center(groups[first]!);
      for (let second = first + 1; second < groups.length; second++) {
        const b = center(groups[second]!);
        if (Math.abs(a.x - b.x) <= 22 && Math.abs(a.y - b.y) <= 22) {
          groups[first]!.push(...groups[second]!);
          groups.splice(second, 1);
          merged = true;
          break;
        }
      }
    }
  }
  return Object.freeze(groups.map((members) => {
    const position = center(members);
    return Object.freeze({
      id: members[0]!.id,
      memberIds: Object.freeze(members.map((point) => point.id)),
      xPercent: position.x,
      yPercent: position.y,
    });
  }));
}

export interface StarAtlasChartCurrentPositionV1 {
  readonly xPercent: number;
  readonly yPercent: number;
}

export interface StarAtlasModelV1 {
  readonly schema: typeof STAR_ATLAS_MODEL_SCHEMA_V1;
  readonly kind: 'ready';
  readonly view: StarAtlasViewV1;
  readonly filter: StarAtlasFilterV1;
  readonly homeId: string | null;
  readonly home: Readonly<{ id: string; title: string; travelable: boolean }> | null;
  readonly stateSeal: string;
  readonly counts: Readonly<Record<StarAtlasFilterV1, number>>;
  readonly rows: readonly StarAtlasRowV1[];
  readonly chartPoints: readonly StarAtlasChartPointV1[];
  readonly chartCurrentPosition: StarAtlasChartCurrentPositionV1 | null;
}

export type StarAtlasProjectionV1 = StarAtlasModelV1 | Readonly<{
  schema: typeof STAR_ATLAS_MODEL_SCHEMA_V1;
  kind: 'protected';
  reason: StarAtlasProjectionProtectionReasonV1;
}>;

function protectedModel(reason: StarAtlasProjectionProtectionReasonV1): StarAtlasProjectionV1 {
  return Object.freeze({ schema: STAR_ATLAS_MODEL_SCHEMA_V1, kind: 'protected', reason });
}

function oneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === 'string' && choices.includes(value as T);
}

function exactDenseArray(value: unknown, reason: StarAtlasProjectionProtectionReasonV1): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Reflect.ownKeys(value).length !== value.length + 1) throw new Error(reason);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new Error(reason);
    }
  }
  return value;
}

function detachedAuthority(
  value: unknown,
  reason: StarAtlasProjectionProtectionReasonV1,
): unknown {
  try { return detachStarAtlasDataV1(value); } catch { throw new Error(reason); }
}

function ownData(record: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor && descriptor.enumerable === true
    ? descriptor.value : undefined;
}

function exactDisplayText(
  value: unknown,
  maximum: number,
  allowEmpty: boolean,
): value is string {
  return typeof value === 'string' && value.length <= maximum
    && (allowEmpty || value.length > 0)
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

function uint32(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 0xFFFF_FFFF;
}

function identityFor(id: string): Readonly<{
  planetSeed: number | null;
  worldKey: string | null;
}> {
  if (id.startsWith(CF1_WORLD_ATLAS_ID_PREFIX)) {
    const resolved = resolveCF1WorldAtlasId(id);
    if (!resolved.ok || !('planet' in resolved.address)) {
      throw new Error('atlas-row-display-shape');
    }
    return Object.freeze({
      planetSeed: resolved.address.planet.seed,
      worldKey: resolved.address.key,
    });
  }
  const legacy = /^p(0|[1-9][0-9]*)$/u.exec(id);
  if (legacy === null) return Object.freeze({ planetSeed: null, worldKey: null });
  const seed = Number(legacy[1]);
  return Object.freeze({
    planetSeed: uint32(seed) ? seed : null,
    worldKey: null,
  });
}

function readPlanetSet(value: unknown, reason: 'landed-shape' | 'conquered-shape'): Set<number> {
  const array = exactDenseArray(value, reason);
  const result = new Set<number>();
  if (reason === 'landed-shape') {
    if (array.length > 60_000) throw new Error(reason);
    for (const candidate of array) {
      if (!uint32(candidate)) throw new Error(reason);
      result.add(candidate);
    }
    return result;
  }
  if (array.length > 20_000) throw new Error(reason);
  for (const candidate of array) {
    if (!Array.isArray(candidate) || Object.getPrototypeOf(candidate) !== Array.prototype
      || candidate.length !== 2 || Reflect.ownKeys(candidate).length !== 3) throw new Error(reason);
    const key = Object.getOwnPropertyDescriptor(candidate, '0');
    if (!key || !('value' in key) || key.enumerable !== true) throw new Error(reason);
    if (!uint32(key.value)) throw new Error(reason);
    result.add(key.value);
  }
  return result;
}

function readCanonicalWorldKeySet(
  value: unknown,
  reason: 'landed-world-authority-shape' | 'conquered-world-authority-shape',
): Set<string> {
  const array = exactDenseArray(detachedAuthority(value, reason), reason);
  const maximum = reason === 'landed-world-authority-shape' ? 9_000 : 20_000;
  if (array.length > maximum) throw new Error(reason);
  const result = new Set<string>();
  let previous: string | null = null;
  for (const candidate of array) {
    const resolved = resolveCF1WorldKey(candidate);
    if (typeof candidate !== 'string' || !resolved.ok
      || (previous !== null && previous >= candidate)) throw new Error(reason);
    result.add(candidate);
    previous = candidate;
  }
  return result;
}

function readCurrentGalaxy(
  value: unknown,
): Readonly<{ x: number; y: number }> | null {
  const detached = detachedAuthority(value, 'current-position-shape');
  if (detached === null) return null;
  if (!detached || typeof detached !== 'object' || Array.isArray(detached)
    || Object.getPrototypeOf(detached) !== Object.prototype
    || Reflect.ownKeys(detached).length !== 2) throw new Error('current-position-shape');
  const record = detached as Record<string, unknown>;
  const x = ownData(record, 'x');
  const y = ownData(record, 'y');
  if (typeof x !== 'number' || !Number.isFinite(x)
    || typeof y !== 'number' || !Number.isFinite(y)) throw new Error('current-position-shape');
  return Object.freeze({ x, y });
}

function chartProjection(
  rows: readonly StarAtlasRowV1[],
  currentGalaxy: Readonly<{ x: number; y: number }> | null,
): Readonly<{
  points: readonly StarAtlasChartPointV1[];
  current: StarAtlasChartCurrentPositionV1 | null;
}> {
  const mapped = rows.filter((row) => row.galaxy !== null);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const row of mapped) {
    minX = Math.min(minX, row.galaxy!.x);
    maxX = Math.max(maxX, row.galaxy!.x);
    minY = Math.min(minY, row.galaxy!.y);
    maxY = Math.max(maxY, row.galaxy!.y);
  }
  if (mapped.length > 0 && currentGalaxy !== null) {
    minX = Math.min(minX, currentGalaxy.x);
    maxX = Math.max(maxX, currentGalaxy.x);
    minY = Math.min(minY, currentGalaxy.y);
    maxY = Math.max(maxY, currentGalaxy.y);
  }
  const span = mapped.length === 0 ? 24 : Math.max(maxX - minX, maxY - minY, 24);
  const scale = 84 / span;
  const offsetX = mapped.length === 0 ? 50 : (100 - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = mapped.length === 0 ? 50 : (100 - (maxY - minY) * scale) / 2 - minY * scale;
  const clusterOrdinals = new Map<string, number>();
  const points = Object.freeze(rows.map((row) => {
    if (row.galaxy === null) {
      return Object.freeze({
        id: row.id,
        title: row.title,
        favorite: row.favorite,
        home: row.home,
        travelable: row.travelable,
        xPercent: null,
        yPercent: null,
        clusterKey: null,
      });
    }
    const clusterKey = `${Math.round(row.galaxy.x * 10)}|${Math.round(row.galaxy.y * 10)}`;
    const ordinal = clusterOrdinals.get(clusterKey) ?? 0;
    clusterOrdinals.set(clusterKey, ordinal + 1);
    const angle = ordinal * 2.399963;
    const radius = ordinal === 0 ? 0 : 2.4 + (ordinal % 3) * 0.55;
    const clampPercent = (value: number): number => Math.max(2, Math.min(98, value));
    return Object.freeze({
      id: row.id,
      title: row.title,
      favorite: row.favorite,
      home: row.home,
      travelable: row.travelable,
      xPercent: clampPercent(row.galaxy.x * scale + offsetX + Math.cos(angle) * radius),
      yPercent: clampPercent(row.galaxy.y * scale + offsetY + Math.sin(angle) * radius),
      clusterKey,
    });
  }));
  const clampPercent = (value: number): number => Math.max(2, Math.min(98, value));
  const current = mapped.length === 0 || currentGalaxy === null ? null : Object.freeze({
    xPercent: clampPercent(currentGalaxy.x * scale + offsetX),
    yPercent: clampPercent(currentGalaxy.y * scale + offsetY),
  });
  return Object.freeze({ points, current });
}

/** Project the exact compatibility rows. `routeDestinations` is a read-only
 * `[atlasId, galaxyX, galaxyY]` snapshot produced by Main from its route
 * WeakMap; the model never accepts/reconstructs route objects or trusts the
 * compatibility `where` carrier for chart position. Canonical filters use
 * exact
 * full-world-key snapshots from their registered owners. Leaf-seed mirrors
 * are consulted only for legacy `p<seed>` rows. */
export function projectStarAtlasV1(input: Readonly<{
  readonly state: SaveStateV2;
  readonly view: StarAtlasViewV1;
  readonly filter: StarAtlasFilterV1;
  readonly routeDestinations: readonly (readonly [string, number, number])[];
  readonly landedWorldKeys: readonly string[];
  readonly conqueredWorldKeys: readonly string[];
  readonly currentGalaxy: Readonly<{ x: number; y: number }> | null;
}>): StarAtlasProjectionV1 {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return protectedModel('state-shape');
    }
    const inputPrototype = Object.getPrototypeOf(input);
    if (inputPrototype !== Object.prototype && inputPrototype !== null) {
      return protectedModel('state-shape');
    }
    const inputRecord = input as unknown as Record<string, unknown>;
    const stateValue = ownData(inputRecord, 'state');
    const view = ownData(inputRecord, 'view');
    const filter = ownData(inputRecord, 'filter');
    const routeDestinationsValue = ownData(inputRecord, 'routeDestinations');
    const landedWorldValue = ownData(inputRecord, 'landedWorldKeys');
    const conqueredWorldValue = ownData(inputRecord, 'conqueredWorldKeys');
    const currentGalaxyValue = ownData(inputRecord, 'currentGalaxy');
    if (!oneOf(view, STAR_ATLAS_VIEWS_V1)) return protectedModel('view-shape');
    if (!oneOf(filter, STAR_ATLAS_FILTERS_V1)) return protectedModel('filter-shape');
    if (!stateValue || typeof stateValue !== 'object' || Array.isArray(stateValue)) {
      return protectedModel('state-shape');
    }
    const stateRoot = starAtlasPlainRecordV1(stateValue, 'state-shape');
    const landedValue = ownData(stateRoot, 'landed');
    const conqueredValue = ownData(stateRoot, 'conquered');
    if (landedValue === undefined) return protectedModel('landed-shape');
    if (conqueredValue === undefined) return protectedModel('conquered-shape');
    const relevant = detachStarAtlasDataV1({
      logMap: starAtlasDataValueV1(stateRoot, 'logMap', 'atlas-shape'),
      homeId: starAtlasDataValueV1(stateRoot, 'homeId', 'atlas-home-shape'),
      landed: landedValue,
      conquered: conqueredValue,
    });
    const checked = inspectStarAtlasStateV1(relevant as SaveStateV2);
    const landed = readPlanetSet(relevant.landed, 'landed-shape');
    const conquered = readPlanetSet(relevant.conquered, 'conquered-shape');
    const landedWorldKeys = readCanonicalWorldKeySet(
      landedWorldValue,
      'landed-world-authority-shape',
    );
    const conqueredWorldKeys = readCanonicalWorldKeySet(
      conqueredWorldValue,
      'conquered-world-authority-shape',
    );
    const currentGalaxy = readCurrentGalaxy(currentGalaxyValue);

    const routeArray = exactDenseArray(
      detachedAuthority(routeDestinationsValue, 'travel-authority-shape'),
      'travel-authority-shape',
    );
    if (routeArray.length > checked.rows.length) return protectedModel('travel-authority-shape');
    const routeDestinations = new Map<string, Readonly<{ x: number; y: number }>>();
    for (const route of routeArray) {
      if (!Array.isArray(route) || Object.getPrototypeOf(route) !== Array.prototype
        || route.length !== 3 || Reflect.ownKeys(route).length !== 4) {
        return protectedModel('travel-authority-shape');
      }
      const id = route[0];
      const x = route[1];
      const y = route[2];
      if (!exactStarAtlasIdV1(id) || !checked.byId.has(id)
        || routeDestinations.has(id)
        || typeof x !== 'number' || !Number.isFinite(x)
        || typeof y !== 'number' || !Number.isFinite(y)) {
        return protectedModel('travel-authority-shape');
      }
      routeDestinations.set(id, Object.freeze({ x, y }));
    }

    const allRows = checked.rows.map(([id, entry], sourceIndex): StarAtlasRowV1 => {
      const title = ownData(entry, 'title');
      const subtitle = ownData(entry, 'sub');
      const badge = ownData(entry, 'badge');
      const favorite = ownData(entry, 'fav');
      const timestamp = ownData(entry, 't');
      if (!exactDisplayText(title, 60, false)
        || !exactDisplayText(subtitle, 120, true)
        || !exactDisplayText(badge, 18, true)
        || typeof favorite !== 'boolean'
        || !Number.isSafeInteger(timestamp) || (timestamp as number) < 0
        || (timestamp as number) > 4_102_444_800_000) {
        throw new Error('atlas-row-display-shape');
      }
      const identity = identityFor(id);
      return Object.freeze({
        id,
        title,
        subtitle,
        badge,
        favorite,
        home: checked.homeId === id,
        visited: identity.worldKey !== null
          ? landedWorldKeys.has(identity.worldKey)
          : identity.planetSeed !== null && landed.has(identity.planetSeed),
        conquered: identity.worldKey !== null
          ? conqueredWorldKeys.has(identity.worldKey)
          : identity.planetSeed !== null && conquered.has(identity.planetSeed),
        life: badge.length > 0,
        timestamp: timestamp as number,
        sourceIndex,
        travelable: routeDestinations.has(id),
        planetSeed: identity.planetSeed,
        worldKey: identity.worldKey,
        galaxy: routeDestinations.get(id) ?? null,
      });
    });
    const counts = Object.freeze({
      all: allRows.length,
      /* Matches V1's star count even though the Favorites lens keeps Home
         reachable when it is not separately starred. */
      favorites: allRows.filter((row) => row.favorite).length,
      visited: allRows.filter((row) => row.visited).length,
      conquered: allRows.filter((row) => row.conquered).length,
      life: allRows.filter((row) => row.life).length,
    });
    const selected = allRows.filter((row) => (
      filter === 'all'
      || (filter === 'favorites' && (row.favorite || row.home))
      || (filter === 'visited' && row.visited)
      || (filter === 'conquered' && row.conquered)
      || (filter === 'life' && row.life)
    ));
    selected.sort((left, right) => {
      const leftRank = left.home ? 2 : left.favorite ? 1 : 0;
      const rightRank = right.home ? 2 : right.favorite ? 1 : 0;
      if (leftRank !== rightRank) return rightRank - leftRank;
      if (left.timestamp !== right.timestamp) return right.timestamp - left.timestamp;
      return left.sourceIndex - right.sourceIndex;
    });
    const rows = Object.freeze(selected);
    const chart = chartProjection(rows, currentGalaxy);
    return Object.freeze({
      schema: STAR_ATLAS_MODEL_SCHEMA_V1,
      kind: 'ready',
      view,
      filter,
      homeId: checked.homeId,
      home: checked.homeId === null ? null : (() => {
        const row = allRows.find((candidate) => candidate.home)!;
        return Object.freeze({ id: row.id, title: row.title, travelable: row.travelable });
      })(),
      stateSeal: checked.stateSeal,
      counts,
      rows,
      chartPoints: chart.points,
      chartCurrentPosition: chart.current,
    });
  } catch (error) {
    if (error instanceof StarAtlasStateProtectionV1) return protectedModel(error.reason);
    const reason = error instanceof Error ? error.message : '';
    return protectedModel(oneOf(reason, [
      'travel-authority-shape', 'landed-shape', 'conquered-shape',
      'landed-world-authority-shape', 'conquered-world-authority-shape',
      'current-position-shape',
      'atlas-row-display-shape',
    ] as const) ? reason : 'state-shape');
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/gu, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

const FILTER_LABELS: Readonly<Record<StarAtlasFilterV1, string>> = Object.freeze({
  all: 'All', favorites: 'Favorites', visited: 'Visited', conquered: 'Conquered', life: 'Life',
});

export interface StarAtlasRenderOptionsV1 {
  readonly clusterId?: string | null;
  readonly mutationsAvailable: boolean;
  readonly pending: Readonly<{
    readonly kind: 'favorite' | 'home' | 'remove';
    readonly atlasId: string;
  }> | null;
  readonly undo: Readonly<{ readonly atlasId: string; readonly title: string }> | null;
  readonly status: string | null;
}

function disabled(value: boolean): string {
  return value ? ' disabled aria-disabled="true"' : '';
}

function emptyMessage(filter: StarAtlasFilterV1): string {
  if (filter === 'favorites') return 'No Favorites or Home are charted in this view.';
  if (filter === 'visited') return 'No visited worlds are charted in this view.';
  if (filter === 'conquered') return 'No conquered worlds are charted in this view.';
  if (filter === 'life') return 'No living, signaled, or civilized finds are charted in this view.';
  return 'Nothing charted yet — add a place from its Survey card.';
}

export function renderStarAtlasV1(
  projection: StarAtlasProjectionV1,
  options: StarAtlasRenderOptionsV1,
): string {
  if (projection.kind === 'protected') {
    return '<section data-star-atlas-protected role="status"><h3>Star Atlas</h3>'
      + '<p>Atlas history is protected until its saved authority can be verified.</p></section>';
  }
  const pending = options.pending;
  const mutationDisabled = (id: string): boolean => !options.mutationsAvailable
    || pending !== null && pending.atlasId === id;
  const renderRows = (rows: readonly StarAtlasRowV1[]): string => `<div class="atlas-list" role="list">${rows.map((row) => {
      const unavailable = mutationDisabled(row.id);
      return `<div class="centry atlas-entry${row.home ? ' is-home' : ''}" role="listitem" data-sel="atlas-entry" data-aid="${escapeHtml(row.id)}" data-atlas-id="${escapeHtml(row.id)}">`
        + `<div class="atlas-entry-copy"><b>${row.home ? '<span aria-hidden="true">⌂ </span>' : ''}${escapeHtml(row.title)}</b>`
        + `${row.badge ? ` <span class="badge">${escapeHtml(row.badge)}</span>` : ''}`
        + `<span class="sub" style="display:block">${escapeHtml(row.subtitle)}</span>`
        + (row.travelable ? '' : '<span class="sub" data-atlas-route-unavailable>Route unavailable</span>')
        + '</div>'
        + '<div class="atlas-entry-actions">'
        + `<button type="button" data-atlas-travel="${escapeHtml(row.id)}"${disabled(!row.travelable)} aria-label="Travel to ${escapeHtml(row.title)}">Travel</button>`
        + `<button type="button" data-atlas-favorite="${escapeHtml(row.id)}" aria-pressed="${String(row.favorite)}"${disabled(unavailable)} aria-label="${row.favorite ? 'Remove Favorite from' : 'Mark Favorite'} ${escapeHtml(row.title)}">${row.favorite ? '★' : '☆'} Favorite</button>`
        + `<button type="button" data-atlas-home="${escapeHtml(row.id)}" aria-pressed="${String(row.home)}"${disabled(unavailable)} aria-label="${row.home ? 'Clear Home from' : 'Set Home to'} ${escapeHtml(row.title)}">⌂ Home</button>`
        + `<button type="button" data-atlas-remove="${escapeHtml(row.id)}"${disabled(unavailable)} aria-label="Remove ${escapeHtml(row.title)} from Star Atlas">Remove</button>`
        + '</div></div>';
    }).join('')}</div>`;
  const targets = projection.view === 'chart' ? clusterStarAtlasPointsV1(projection.chartPoints) : [];
  const selectedCluster = projection.view === 'chart'
    ? targets.find((target) => target.memberIds.length > 1 && target.id === options.clusterId)
    : undefined;
  const viewTabs = STAR_ATLAS_VIEWS_V1.map((view) => (
    `<button type="button" data-atlas-view="${view}" aria-pressed="${String(projection.view === view)}">`
    + `${view === 'list' ? 'List' : 'Chart'}</button>`
  )).join('');
  const filters = STAR_ATLAS_FILTERS_V1.map((filter) => (
    `<button type="button" data-atlas-filter="${filter}" aria-pressed="${String(projection.filter === filter)}">`
    + `${FILTER_LABELS[filter]} <span aria-hidden="true">${projection.counts[filter]}</span>`
    + `<span class="sr-only">, ${projection.counts[filter]} places</span></button>`
  )).join('');
  const home = projection.home === null ? ''
    : `<button type="button" data-atlas-travel-home="${escapeHtml(projection.home.id)}"${
      disabled(!projection.home.travelable)
    } aria-label="Travel Home to ${escapeHtml(projection.home.title)}">Travel Home</button>`;
  const undo = options.undo === null ? ''
    : `<button type="button" class="atlas-undo" data-atlas-undo="${escapeHtml(options.undo.atlasId)}"${
      disabled(!options.mutationsAvailable || pending !== null)
    }>Undo removal of ${escapeHtml(options.undo.title)}</button>`;
  let body: string;
  if (projection.rows.length === 0) {
    body = `<p class="empty" data-atlas-empty>${escapeHtml(emptyMessage(projection.filter))}</p>`;
  } else if (projection.view === 'list') {
    body = renderRows(projection.rows);
  } else if (selectedCluster !== undefined) {
    const members = new Set(selectedCluster.memberIds);
    body = '<section data-atlas-cluster-candidates aria-label="Chart destinations">'
      + '<button type="button" class="atlas-cluster-back" data-atlas-cluster-back>Return to Chart</button>'
      + `<p>${selectedCluster.memberIds.length} nearby places. Choose an exact destination.</p>`
      + renderRows(projection.rows.filter((row) => members.has(row.id))) + '</section>';
  } else {
    const positioned = targets;
    const unmapped = projection.chartPoints.filter((point) => point.xPercent === null);
    body = '<div class="atlas-chart" role="group" aria-label="Charted places">'
      + (projection.chartCurrentPosition === null ? ''
        : `<span class="atlas-chart-current" role="img" aria-label="Your current view" style="--atlas-x:${projection.chartCurrentPosition.xPercent.toFixed(3)}%;--atlas-y:${projection.chartCurrentPosition.yPercent.toFixed(3)}%"><span aria-hidden="true">＋</span></span>`)
      + positioned.map((target) => {
        const members = projection.chartPoints.filter((point) => target.memberIds.includes(point.id));
        const first = members[0]!;
        const home = members.some((point) => point.home);
        const favorite = members.some((point) => point.favorite);
        const multiple = members.length > 1;
        const action = multiple
          ? `data-atlas-cluster="${escapeHtml(target.id)}"`
          : `data-atlas-travel="${escapeHtml(first.id)}"`;
        const label = multiple ? `Choose among ${members.length} nearby places near ${first.title}`
          : `${home ? 'Home, ' : ''}${favorite ? 'Favorite, ' : ''}${first.title}`;
        return `<button type="button" class="atlas-chart-point${home ? ' is-home' : ''}${favorite ? ' is-favorite' : ''}" ${action} data-atlas-chart-point style="--atlas-x:${target.xPercent.toFixed(3)}%;--atlas-y:${target.yPercent.toFixed(3)}%"${disabled(!multiple && !first.travelable)} aria-label="${escapeHtml(label)}">`
          + `<span aria-hidden="true">${multiple ? members.length : home ? '⌂' : favorite ? '★' : '·'}</span></button>`;
      }).join('')
      + '</div>'
      + (unmapped.length === 0 ? ''
        : `<div class="atlas-chart-unmapped" role="list" aria-label="Charted places without map coordinates">${unmapped.map((point) => (
          `<div role="listitem"><button type="button" data-atlas-travel="${escapeHtml(point.id)}" data-atlas-chart-point${disabled(!point.travelable)}>Travel to ${escapeHtml(point.title)}${point.travelable ? '' : ' — Route unavailable'}</button></div>`
        )).join('')}</div>`);
  }
  return '<section data-star-atlas-body aria-label="Star Atlas">'
    + `<h3>Star Atlas <span data-atlas-count data-sel="atlas-count">${projection.counts.all}</span></h3>`
    + `<div class="atlas-view-tabs" role="group" aria-label="Atlas view">${viewTabs}</div>`
    + `<div class="atlas-filters" role="group" aria-label="Atlas filter">${filters}</div>`
    + home + undo + body
    + (options.status === null ? ''
      : `<p data-atlas-status role="status" aria-live="polite" aria-atomic="true">${escapeHtml(options.status)}</p>`)
    + '</section>';
}
