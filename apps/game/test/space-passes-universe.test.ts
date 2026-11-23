import { describe, expect, it } from 'vitest';
import type { SpaceItem } from '@cf/art-interface';
import { HOME_POS, OBS_R, UCELL } from '@cf/domain-worldconfig';
import { galaxiesInCell } from '@cf/domain-worldgen';
import { NAV_HOME } from '@cf/scene';
import type { GalaxyNode } from '@cf/scene';
import { place } from '../src/space/draw';
import { passCaptions } from '../src/space/passes';
import { bridgeItems, charterShown, edgeItems, fogItems, turnGalaxy, veilItems, webItems, webZoom } from '../src/space/passes-universe';
import { mapItems } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { COLLIDING, kindOf, namesOf, passView, placed } from './space-support';

const HOME = { x: HOME_POS.x, y: HOME_POS.y };
const at = (z: number, over = {}) => passView(NAV_HOME, { ...HOME, z }, over);
const centres = (items: readonly SpaceItem[]): string[] => [...new Set(placed(items).map((item) => `${item.x},${item.y}`))];
const frame = (z: number, over: Partial<MapFrame> = {}): MapFrame =>
  ({ nav: NAV_HOME, cam: { ...HOME, z }, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: true, passes: { effects: true, motion: true }, ...over });
const items = (f: MapFrame): SpaceItem[] => mapItems(f, { w: 640, h: 360 }, 2);

describe('the cosmic web', () => {
  it("the game's cut for a 1280 by 720 window is a zoom of 0.04", () => {
    expect(webZoom({ w: 1280, h: 720 })).toBeCloseTo(0.04, 12);
  });

  it('glows over the cells dense with galaxies once the zoom passes the cut, and not below it', () => {
    const v = at(0.05);
    const web = webItems(v);
    expect(web.length).toBeGreaterThan(0);
    const dense: string[] = [];
    let densest = { web: 0, key: '' };
    for (let cx = -3; cx <= 3; cx++) for (let cy = -4; cy <= 2; cy++) {
      const density = galaxiesInCell(cx, cy).web;
      const p = place(v.cam, v.grid, (cx + 0.5) * UCELL, (cy + 0.5) * UCELL);
      if (density > 0.5) dense.push(`${p.x},${p.y}`);
      if (density > densest.web) densest = { web: density, key: `${p.x},${p.y}` };
    }
    expect(dense).toHaveLength(6);
    for (const centre of centres(web)) expect(dense).toContain(centre);
    expect(centres(web)).toContain(densest.key);
    // The light is soft: stronger toward the middle of a cell, never more than a faint dither.
    const one = kindOf(web, 'veil').filter((item) => `${item.x},${item.y}` === densest.key);
    expect(one.map((item) => item.r)).toEqual([...one.map((item) => item.r)].sort((a, b) => b - a));
    expect(one.every((item) => item.level >= 1 && item.level <= 5)).toBe(true);
    expect(webItems(at(0.04))).toEqual([]);
    expect(webItems(at(0.039))).toEqual([]);
  });

  it('its captions are offered between the cut and a zoom of a half', () => {
    expect(passCaptions(at(0.05))).toEqual([{ text: 'cosmic void', wx: 200, wy: 200 }]);
    expect(passCaptions(at(0.04))).toEqual([]);
    expect(passCaptions(at(0.5))).toEqual([]);
    expect(passCaptions(at(0.49))).toHaveLength(1);
  });
});

describe('tidal bridges', () => {
  const near = passView(NAV_HOME, { x: COLLIDING.x + 40, y: COLLIDING.y, z: 2 });

  it('a colliding galaxy is joined to its companion by an unbroken curved line as wide as the game draws it', () => {
    const bridge = placed(bridgeItems(near));
    expect(bridge.length).toBeGreaterThan(10);
    expect(bridge[0]).toMatchObject(place(near.cam, near.grid, COLLIDING.x, COLLIDING.y));
    expect(bridge[bridge.length - 1]).toMatchObject(place(near.cam, near.grid, COLLIDING.x2, COLLIDING.y2));
    for (let i = 1; i < bridge.length; i++) {
      expect(Math.max(Math.abs(bridge[i]!.x - bridge[i - 1]!.x), Math.abs(bridge[i]!.y - bridge[i - 1]!.y)), `step ${i}`).toBe(1);
    }
    // 0.14 of the galaxy's size across: 7 art pixels here, so soft discs of radius 3 that never cover a star.
    expect(kindOf(bridge, 'veil').map((item) => [item.r, item.light, item.level])).toEqual(bridge.map(() => [3, true, 13]));
    // It bows away from the straight line between the two.
    const straightY = (bridge[0]!.y + bridge[bridge.length - 1]!.y) / 2;
    expect(bridge[bridge.length >> 1]!.y).toBeLessThan(straightY - 5);
  });

  it('is a line one pixel wide when the galaxy is small, and not drawn while the galaxy is a dot', () => {
    const small = bridgeItems(passView(NAV_HOME, { x: COLLIDING.x + 40, y: COLLIDING.y, z: 0.25 }));
    expect(small.length).toBeGreaterThan(3);
    expect(small.every((item) => item.kind === 'dot')).toBe(true);
    expect(bridgeItems(passView(NAV_HOME, { x: COLLIDING.x + 40, y: COLLIDING.y, z: 0.1 }))).toEqual([]);
    // No galaxy near home is colliding.
    expect(bridgeItems(passView(NAV_HOME, { ...HOME, z: 2 }))).toEqual([]);
  });
});

describe('the charter: veil and fog', () => {
  it('the veil darkens what lies beyond the charter, out to twice its radius, deeper in the outer half', () => {
    const v = at(0.1);
    const home = place(v.cam, v.grid, HOME.x, HOME.y);
    expect(veilItems(v)).toEqual([
      { kind: 'veil', ...home, r: 66, inner: 44, colour: 0x05070f, level: 2 },
      { kind: 'veil', ...home, r: 88, inner: 66, colour: 0x05070f, level: 4 },
    ]);
    expect(veilItems({ ...v, reach: 1760 }).map((item) => item.kind === 'veil' && item.r)).toEqual([132, 176]);
  });

  it("the ring, the veil and the fog show from 0.7 of the web's cut, and are painted over the galaxies", () => {
    expect(charterShown(at(0.0281))).toBe(true);
    expect(charterShown(at(0.0279))).toBe(false);
    const shown = items(frame(0.05));
    const veil = shown.findIndex((item) => item.kind === 'veil' && item.inner !== undefined && item.colour === 0x05070f);
    const lastGalaxy = shown.map((item) => item.kind === 'dot' && item.colour === 0xcfe4ff).lastIndexOf(true);
    expect(veil).toBeGreaterThan(lastGalaxy);
    expect(lastGalaxy).toBeGreaterThan(900);
    expect(kindOf(shown, 'ring').some((ring) => ring.colour === 0x96beff)).toBe(true);
    const hidden = items(frame(0.02));
    expect(kindOf(hidden, 'ring').some((ring) => ring.colour === 0x96beff)).toBe(false);
    // Only the band of the observable universe's edge is left of the veils.
    expect(kindOf(hidden, 'veil').map((item) => item.colour)).toEqual([0x402b12]);
  });

  it('fog banks lie only beyond the charter, at most 24 of them, and drift with time', () => {
    const v = at(0.05);
    const fog = fogItems(v);
    const banks = centres(fog);
    expect(banks.length).toBeGreaterThan(5);
    expect(banks.length).toBeLessThanOrEqual(24);
    const home = place(v.cam, v.grid, HOME.x, HOME.y);
    for (const item of kindOf(fog, 'veil')) {
      expect(item.colour).toBe(0x060814);
      expect(Math.hypot(item.x - home.x, item.y - home.y)).toBeGreaterThan(880 * 1.04 * v.cam.z - 1);
    }
    expect(fogItems({ ...v, reach: 1e6 })).toEqual([]);
    expect(fogItems({ ...v, time: 100 })).not.toEqual(fog);
    expect(fogItems({ ...v, time: 0 })).toEqual(fog);
  });

  it('with motion reduced the fog stands still and has at most 10 banks; with effects off there is none', () => {
    const still = fogItems(at(0.05, { motion: false }));
    expect(centres(still).length).toBeGreaterThan(3);
    expect(centres(still).length).toBeLessThanOrEqual(10);
    const reduced = { effects: true, motion: false };
    expect(items(frame(0.05, { time: 100, passes: reduced }))).toEqual(items(frame(0.05, { time: 0, passes: reduced })));
    expect(fogItems(at(0.05, { effects: false }))).toEqual([]);
    expect(kindOf(items(frame(0.05, { passes: { effects: false, motion: true } })), 'veil').filter((item) => item.colour === 0x060814)).toEqual([]);
  });
});

describe('the edge of the observable universe', () => {
  it('is an orange ring about the origin with a faint band to either side, at every zoom', () => {
    for (const z of [0.01, 0.05, 2]) {
      const v = at(z);
      const edge = edgeItems(v);
      const origin = place(v.cam, v.grid, 0, 0);
      const r = Math.round(OBS_R * v.cam.z);
      expect(edge[edge.length - 1], `zoom ${z}`).toEqual({ kind: 'ring', ...origin, r, colour: 0x805523 });
      expect(items(frame(z)).slice(-edge.length)).toEqual(edge);
    }
    expect(edgeItems(at(0.05))[0]).toEqual({ kind: 'veil', x: 318, y: 182, r: 134, inner: 125, colour: 0x402b12, level: 14, light: true });
    // A band under a pixel wide is the ring alone.
    expect(edgeItems(at(0.004))).toHaveLength(1);
  });
});

describe('galaxies in time', () => {
  const galaxy = (over: Partial<GalaxyNode> = {}): GalaxyNode =>
    ({ seed: 9, x: 0, y: 0, size: 40, sp: 0, tilt: 1, rot: 1.5, home: false, quasar: false, dwarf: false, radio: false, blazar: false, bridge: null, ...over });
  const element = (name: string): SpaceItem[] => [{ kind: 'element', name, x: 5, y: 5, ramp: 0xffffff, flip: true }];
  const v = at(1);

  it('a galaxy turns a quarter at a time, as slowly as the game turns it; a radio galaxy does not turn', () => {
    const spiral = element('galaxy/spiral/v1');
    expect(turnGalaxy(galaxy(), spiral, v)).toEqual(spiral);
    // From 1.5 radians the next quarter turn is 0.0708 radians on: 59 seconds at 0.0012 a second.
    expect(namesOf(turnGalaxy(galaxy(), spiral, { ...v, time: 58 }))).toEqual(['galaxy/spiral/v1']);
    expect(turnGalaxy(galaxy(), spiral, { ...v, time: 60 })).toEqual([{ ...spiral[0], name: 'galaxy/spiral/v2' }]);
    expect(namesOf(turnGalaxy(galaxy(), element('galaxy/barred/v3'), { ...v, time: 60 }))).toEqual(['galaxy/barred/v0']);
    expect(namesOf(turnGalaxy(galaxy(), spiral, { ...v, time: 60 + 3 * 1309 }))).toEqual(['galaxy/spiral/v1']);
    expect(namesOf(turnGalaxy(galaxy({ radio: true }), [...element('radio-lobes/v1'), ...spiral], { ...v, time: 60 }))).toEqual(['radio-lobes/v1', 'galaxy/spiral/v1']);
  });

  it('a blazar dims in the low part of its pulse; not with motion reduced, not with effects off, and a plain quasar never', () => {
    const quasar = element('quasar');
    const blazar = galaxy({ quasar: true, blazar: true, seed: 20 });
    // sin(6t) is 0 at t = 0 and 1 at t = pi / 12.
    expect(namesOf(turnGalaxy(blazar, quasar, v))).toEqual(['quasar/dim']);
    expect(namesOf(turnGalaxy(blazar, quasar, { ...v, time: Math.PI / 12 }))).toEqual(['quasar']);
    const seen = new Set(Array.from({ length: 40 }, (_, i) => namesOf(turnGalaxy(blazar, quasar, { ...v, time: i * 0.05 }))[0]));
    expect([...seen].sort()).toEqual(['quasar', 'quasar/dim']);
    expect(namesOf(turnGalaxy(blazar, quasar, { ...v, motion: false }))).toEqual(['quasar']);
    expect(namesOf(turnGalaxy(blazar, quasar, { ...v, effects: false }))).toEqual(['quasar']);
    expect(namesOf(turnGalaxy(galaxy({ quasar: true }), quasar, v))).toEqual(['quasar']);
  });
});

describe('the universe map with and without its passes', () => {
  it('without the passes field the map is as it was; the same frame gives the same items', () => {
    const { passes: _, ...without } = frame(0.05);
    const plain = items(without);
    expect(kindOf(plain, 'veil')).toEqual([]);
    expect(items(frame(0.05))).toEqual(items(frame(0.05)));
    expect(items(frame(0.05)).length).toBeGreaterThan(plain.length);
  });
});
