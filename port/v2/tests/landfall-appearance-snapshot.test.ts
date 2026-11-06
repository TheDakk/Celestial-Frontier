import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { EARTH_RESIDENT_LAYER_PLAN_V1 } from '@cf/art/earth-resident-plan';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import { buildEarthLayeredRecipeV1 } from '../apps/game/src/earth-layered-recipe.js';
import { canonicalWorldRoster, isCanonicalWorldRoster, type CanonicalWorldRoster } from '../apps/game/src/world-roster.js';
import {
  buildLandfallAppearanceSnapshotV1,
  type LandfallAppearanceSnapshotResultV1,
} from '../apps/game/src/landfall-appearance-snapshot.js';

beforeAll(() => installCaptureHooks());

function fixture(planetSeed = 133, epoch = 0) {
  const star = { seed: 424242, x: 560, y: 170 };
  const address = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
    star, planet: { seed: planetSeed } });
  const planet = systemScene(star.seed).planets.find(row => row.seed === planetSeed);
  if (!address.ok || !planet) throw new Error('Canonical test world unavailable');
  const built = canonicalWorldRoster(address.address, epoch);
  if (!built.ok) throw new Error('Canonical test roster unavailable');
  const request = buildBiomeVistaRenderRequestV1(planet, star.seed, built.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, built.roster);
  return { request, roster: built.roster };
}

function accepted(result: LandfallAppearanceSnapshotResultV1) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`Snapshot refused: ${result.reason}`);
  return result;
}

function mutableRequest(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function ownedObjects(value: unknown, found = new Set<object>()): Set<object> {
  if (value !== null && typeof value === 'object' && !found.has(value)) {
    found.add(value);
    for (const child of Object.values(value)) ownedObjects(child, found);
  }
  return found;
}

describe('canonical landfall appearance snapshot, first Earth-only adapter', () => {
  it('captures all 19 ordered full genomes and environment authority against retained source data', () => {
    const source = fixture();
    const retained = JSON.parse(readFileSync(new URL(
      '../../../audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json', import.meta.url,
    ), 'utf8')) as { request: unknown; roster: Record<string, unknown> };
    const { snapshot, canonicalJson } = accepted(buildLandfallAppearanceSnapshotV1(source.request, source.roster));
    const parsed = JSON.parse(canonicalJson) as typeof snapshot;
    const view = retained.roster.view as { all: unknown[]; total: number };
    const expectedRoster = { ...retained.roster, view: { all: view.all, total: view.total } };
    expect(parsed).toMatchObject({ schema: 'cf.art.landfall-snapshot.v1',
      recipeId: 'canonical-earth-epoch0-six-residents-v1', qualityAccepted: false });
    expect(parsed.request).toEqual(retained.request);
    expect(parsed.roster).toEqual(expectedRoster);
    expect(parsed.roster.view.all).toHaveLength(19);
    expect(parsed.roster.view.total).toBe(19);
    expect(Object.keys(parsed.roster.view)).toEqual(['all', 'total']);
    expect(parsed.request.options).toMatchObject({ seed: 133, wx: 'rain',
      pal: 'rain', nightize: false, duskize: false });
    expect(isCanonicalWorldRoster(snapshot.roster)).toBe(false);
    expect(isCanonicalWorldRoster(parsed.roster)).toBe(false);
    // The exported mirror must also lack the compile-time provenance brand.
    // @ts-expect-error A data mirror cannot satisfy CanonicalWorldRoster.
    const notLiveAuthority: CanonicalWorldRoster = snapshot.roster;
    expect(isCanonicalWorldRoster(notLiveAuthority)).toBe(false);
  });

  it('preserves the six complete display identities, families and accepted composition anchors', () => {
    const source = fixture();
    const { snapshot } = accepted(buildLandfallAppearanceSnapshotV1(source.request, source.roster));
    expect(Array.from(snapshot.displayPlan.residents, row =>
      [row.name, row.kingdom, row.family, row.x, row.groundY, row.width, row.flip])).toEqual([
      ['Civet', 'fauna', 'mammal', .72, .77, .15, false],
      ['Persimmon', 'flora', 'tree', .13, .78, .21, false],
      ['Platypus', 'fauna', 'mammal', .43, .86, .20, true],
      ['Frog', 'fauna', 'amphibian', .25, .87, .07, false],
      ["Devil's Club", 'flora', 'shrub', .87, .88, .16, false],
      ['Cranberry', 'flora', 'shrub', .34, .90, .11, false],
    ]);
    for (const resident of Array.from(snapshot.displayPlan.residents)) {
      const original = source.roster.view.all.find(row => row._earthName === resident.name);
      expect(original, resident.name).toBeDefined();
      expect(resident.genome, resident.name).toEqual(original);
      expect(resident.genome).not.toBe(original);
    }
    expect(snapshot.displayPlan.width).toBe(960);
    expect(snapshot.displayPlan.height).toBe(430);
    expect(source.roster.view.preview.some(row => row._earthName === 'Platypus')).toBe(false);
    expect(Array.from(snapshot.displayPlan.residents).some(row => row.name === 'Platypus')).toBe(true);
  });

  it('deeply freezes detached graphs and never rewrites source or shared plan objects', () => {
    const source = fixture();
    const before = JSON.stringify([source.request, source.roster, EARTH_RESIDENT_LAYER_PLAN_V1]);
    const originals = ownedObjects([source.request, source.roster, EARTH_RESIDENT_LAYER_PLAN_V1]);
    const result = accepted(buildLandfallAppearanceSnapshotV1(source.request, source.roster));
    for (const object of ownedObjects(result.snapshot)) {
      expect(Object.isFrozen(object)).toBe(true);
      expect(originals.has(object)).toBe(false);
    }
    expect(Object.isFrozen(result)).toBe(true);
    expect(Reflect.set(result.snapshot.roster.view.all[18]!, 'color', 0)).toBe(false);
    expect(Reflect.set(result.snapshot, 'qualityAccepted', true)).toBe(false);
    expect(JSON.stringify(result.snapshot)).toBe(result.canonicalJson);
    expect(JSON.stringify([source.request, source.roster, EARTH_RESIDENT_LAYER_PLAN_V1])).toBe(before);
  });

  it('produces identical bytes from independently rebuilt canonical inputs', () => {
    const first = fixture(), second = fixture();
    expect(first.roster).not.toBe(second.roster);
    const a = accepted(buildLandfallAppearanceSnapshotV1(first.request, first.roster));
    const b = accepted(buildLandfallAppearanceSnapshotV1(second.request, second.roster));
    expect(a.canonicalJson).toBe(b.canonicalJson);
    expect(a.snapshot).not.toBe(b.snapshot);
    expect(Object.keys(JSON.parse(a.canonicalJson))).toEqual([
      'schema', 'recipeId', 'qualityAccepted', 'request', 'roster', 'displayPlan',
    ]);
  });

  it('rejects exact serialized clones, spreads and wrappers that the older data-only gate can admit', () => {
    const { request, roster } = fixture();
    const copy = JSON.parse(JSON.stringify(roster)) as unknown;
    expect(buildEarthLayeredRecipeV1(request, copy)).not.toBeNull();
    for (const value of [copy, structuredClone(roster), { ...roster }, new Proxy(roster, {})]) {
      expect(buildLandfallAppearanceSnapshotV1(request, value)).toEqual({ ok: false, reason: 'unproven-roster' });
    }
    const exported = accepted(buildLandfallAppearanceSnapshotV1(request, roster));
    const parsed = JSON.parse(exported.canonicalJson) as typeof exported.snapshot;
    expect(buildLandfallAppearanceSnapshotV1(parsed.request, parsed.roster))
      .toEqual({ ok: false, reason: 'unproven-roster' });
  });

  it('refuses genuine canonical unsupported epochs and worlds without projecting substitute identities', () => {
    for (const source of [fixture(133, 1), fixture(134, 0)]) {
      expect(isCanonicalWorldRoster(source.roster)).toBe(true);
      const before = JSON.stringify(source);
      const result = buildLandfallAppearanceSnapshotV1(source.request, source.roster);
      expect(result).toEqual({ ok: false, reason: 'unsupported-recipe' });
      expect(Object.isFrozen(result)).toBe(true);
      expect(JSON.stringify(source)).toBe(before);
    }
  });

  it('rejects full request changes even while live roster and copied request fingerprints remain unchanged', () => {
    const { request, roster } = fixture();
    const mutate: Array<(data: Record<string, unknown>) => void> = [
      data => { data.worldKey = String(data.worldKey).replace('g:999', 'g:998'); },
      data => { data.profileDigest = `${String(data.profileDigest)}-wrong`; },
      data => { data.biomeKey = 'coral'; },
      data => { (data.options as Record<string, unknown>).wx = null; },
      data => {
        const genes = (data.options as Record<string, unknown>).genes as Record<string, unknown>[];
        genes[0]!.bulk = Number(genes[0]!.bulk) + .01;
      },
      data => { data.unadmitted = 'extra'; },
    ];
    for (const change of mutate) {
      const data = mutableRequest(request);
      change(data);
      expect(data.environmentFingerprint).toBe(request.environmentFingerprint);
      expect(buildLandfallAppearanceSnapshotV1(data, roster))
        .toEqual({ ok: false, reason: 'unsupported-recipe' });
    }
    const other = fixture(134, 0);
    expect(buildLandfallAppearanceSnapshotV1(other.request, roster))
      .toEqual({ ok: false, reason: 'unsupported-recipe' });
  });

  it('takes one caller request snapshot and exports exactly the admitted descriptors', () => {
    const { request, roster } = fixture();
    let worldKeyReads = 0;
    // A mutable target makes a changed later descriptor legal Proxy behavior,
    // not an invariant exception masquerading as a successful boundary test.
    const mutableProxy = new Proxy(mutableRequest(request), {
      getOwnPropertyDescriptor(target, key) {
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        if (key !== 'worldKey' || !descriptor) return descriptor;
        worldKeyReads++;
        return { ...descriptor, value: worldKeyReads === 1 ? request.worldKey : 'wrong-later-world' };
      },
    });
    const result = accepted(buildLandfallAppearanceSnapshotV1(mutableProxy, roster));
    expect(worldKeyReads).toBe(1);
    expect(result.snapshot.request.worldKey).toBe(request.worldKey);
    expect(JSON.parse(result.canonicalJson).request.worldKey).toBe(request.worldKey);
  });

  it('refuses accessors, serialization hooks and revoked requests without escaping or invoking hooks', () => {
    const { request, roster } = fixture();
    const getter = vi.fn(() => request.worldKey), toJSON = vi.fn(() => request);
    const accessor = mutableRequest(request), hooked = mutableRequest(request);
    Object.defineProperty(accessor, 'worldKey', { enumerable: true, get: getter });
    hooked.toJSON = toJSON;
    const revoked = Proxy.revocable(mutableRequest(request), {}); revoked.revoke();
    for (const value of [accessor, hooked, revoked.proxy, null, undefined]) {
      expect(buildLandfallAppearanceSnapshotV1(value, roster))
        .toEqual({ ok: false, reason: 'unsupported-recipe' });
    }
    expect(getter).not.toHaveBeenCalled(); expect(toJSON).not.toHaveBeenCalled();
    const readRoster = vi.fn(() => roster.worldKey);
    const falseRoster = Object.defineProperty({}, 'worldKey', { get: readRoster });
    expect(buildLandfallAppearanceSnapshotV1(request, falseRoster))
      .toEqual({ ok: false, reason: 'unproven-roster' });
    expect(readRoster).not.toHaveBeenCalled();
  });
});
