import { describe, expect, it } from 'vitest';
import type { SpaceItem } from '@cf/art-interface';
import { systemFor } from '@cf/domain-worldgen';
import { NAV_HOME, systemScene } from '@cf/scene';
import type { GalaxyNode } from '@cf/scene';
import type { MapBody } from '../src/space/model';
import { artGrid, artScale, mapItems, projectMap, projectScenery, type MapFrame } from '../src/space/project';
import { pickRadius } from '../src/space/sizes';
import { hazeItems } from '../src/space/passes-galaxy';
import { MAGNETAR, SOL, galaxyNav, kindOf, passView, systemNav } from './space-support';

const GRID = { w: 400, h: 300 };
/** Art pixels per screen pixel on a desktop window, where each art pixel covers 2. */
const SIZED = { perCss: 0.5 };
const galaxy = (over: Partial<GalaxyNode>): MapBody => {
  const ref: GalaxyNode = { seed: 8, x: 0, y: 0, size: 40, sp: 0, tilt: 1, rot: 0, home: false, quasar: false, dwarf: false, radio: false, blazar: false, bridge: null, ...over };
  return { kind: 'galaxy', key: 'g', label: 'g', priority: 1, wx: 0, wy: 0, ref };
};
const star = (s: number, over: Partial<MapBody> = {}, sol = false): MapBody =>
  ({ kind: 'star', key: 's', label: 's', priority: 1, wx: 0, wy: 0, ref: { x: 0, y: 0, c: '#ff9a6a', s, seed: 3, ...(sol ? { sol: true } : {}) }, ...over } as MapBody);
const spans = (items: readonly SpaceItem[]): Record<string, number | undefined> => Object.fromEntries(kindOf(items, 'element').map((item) => [item.name.replace(/\/v\d$/, ''), item.span]));
const at = (z: number) => ({ x: 0, y: 0, z });

describe('sizes that follow the camera', () => {
  it('without the sizing nothing is given a span: the picture is the one recorded before', () => {
    expect(spans(projectMap([galaxy({}), galaxy({ quasar: true }), star(2)], at(3), GRID, 0))).toEqual({ 'galaxy/spiral': undefined, quasar: undefined, 'star/giant': undefined });
  });

  it('a galaxy spans twice its size, a radio galaxy six tenths of that inside lobes 6.6 sizes wide, a quasar 5.6 sizes', () => {
    for (const z of [0.5, 1, 3]) {
      expect(spans(projectMap([galaxy({})], at(z), GRID, 0, SIZED)), `${z}`).toEqual({ 'galaxy/spiral': Math.round(80 * z) });
      expect(spans(projectMap([galaxy({ radio: true })], at(z), GRID, 0, SIZED)), `${z}`).toEqual({ 'radio-lobes': Math.round(264 * z), 'galaxy/spiral': Math.round(48 * z) });
      expect(spans(projectMap([galaxy({ quasar: true })], at(z), GRID, 0, SIZED)), `${z}`).toEqual({ quasar: Math.round(224 * z) });
    }
  });

  it('a star keeps its size on the screen until the zoom passes 0.7 / 0.55 screen pixels a unit, then grows with the zoom', () => {
    // A giant of size 2: 16 units of the base wide, six tenths of it lit. On the screen 0.7 * 16 * 0.6 = 6.72 pixels: 3 art pixels.
    for (const z of [0.01, 0.1, 0.6]) expect(spans(projectMap([star(2)], at(z), GRID, 0, SIZED)), `${z}`).toEqual({ 'star/giant': 3 });
    expect(spans(projectMap([star(2)], at(5), GRID, 0, SIZED))).toEqual({ 'star/giant': Math.round(2 * 0.55 * 8 * 0.6 * 5) });
    expect(spans(projectMap([star(2)], at(10), GRID, 0, SIZED))).toEqual({ 'star/giant': Math.round(2 * 0.55 * 8 * 0.6 * 10) });
    // An ordinary star is a dot from afar and a lit disc in a halo up close; a fine star is drawn 6.5 wide to a coarse one's 8.
    expect(projectMap([star(1)], at(0.5), GRID, 0, SIZED)).toEqual([{ kind: 'dot', x: 200, y: 150, colour: 0xff9a6a }]);
    const near = projectMap([star(1)], at(10), GRID, 0, SIZED);
    expect(near.map((item) => item.kind)).toEqual(['veil', 'disc', 'disc']);
    expect(kindOf(near, 'disc').map((disc) => disc.r)).toEqual([Math.round(44 * 0.1), Math.round(44 * 0.04)]);
    expect(kindOf(near, 'veil')[0]).toMatchObject({ r: Math.round(44 * 0.3), light: true });
    const fine = projectMap([star(1, { priority: 2 })], at(10), GRID, 0, SIZED);
    expect(kindOf(fine, 'disc')[0]!.r).toBe(Math.round(0.55 * 6.5 * 10 * 0.1));
  });

  it('the mark about the Sun is 9 screen pixels in radius whatever the zoom', () => {
    for (const z of [0.5, 4]) expect(kindOf(projectMap([star(1, {}, true)], at(z), GRID, 0, SIZED), 'ring').map((ring) => ring.r), `${z}`).toEqual([5]);
    expect(kindOf(projectMap([star(1, {}, true)], at(4), GRID, 0, { perCss: 0.75 }), 'ring').map((ring) => ring.r)).toEqual([7]);
  });

  it('the scenery of a galaxy takes the game\'s sizes: by its radius, or its own width in world units', () => {
    const deco = (k: string, rr?: number): MapBody => ({ kind: 'deco', key: k, label: k, priority: 3, wx: 0, wy: 0, ref: { k, x: 0, y: 0, ...(rr === undefined ? {} : { rr }) } });
    const z = 4;
    const all: MapBody[] = [deco('h2', 10), deco('neb', 10), deco('mol', 10), deco('plan', 10), deco('rem', 10), deco('rogue'), deco('fbd'),
      { kind: 'worm', key: 'w', label: 'w', priority: 3, wx: 0, wy: 0, ref: { x: 0, y: 0 } },
      { kind: 'snova', key: 'n', label: 'n', priority: 3, wx: 0, wy: 0, ref: { remnant: 'SHELL' } as never },
      { kind: 'protostar', key: 'p', label: 'p', priority: 3, wx: 0, wy: 0, ref: {} as never }];
    expect(spans(projectMap(all, at(z), GRID, 0, SIZED))).toEqual({ 'deco/h2': 92, 'deco/neb': 92, 'deco/mol': 92, 'deco/plan': 96, 'deco/rem': 104,
      'deco/rogue': Math.round(2.1 * z), 'deco/fbd': Math.round(3.2 * z), wormhole: 120, 'supernova/shell': 192, protostar: Math.round(6.8 * z) });
    // A rogue planet is a dot until it is 4 art pixels wide.
    expect(projectMap([deco('rogue')], at(1.5), GRID, 0, SIZED)).toMatchObject([{ kind: 'dot' }]);
    const scenery = projectScenery(galaxyNav(), at(z), GRID, 0, { reach: 500, charts: true, sizing: SIZED });
    expect(spans(scenery)).toEqual({ 'black-hole': 240 });
  });

  it('the heart of a system takes the game\'s sizes, and its rocks, dwarfs and moons become discs up close', () => {
    const z = 3;
    const sol = projectScenery(systemNav(), at(z), GRID, 0, { reach: 500, charts: false, sizing: SIZED });
    const starR = Math.max(systemScene(SOL.seed).starR, 8);
    expect(spans(sol)).toEqual({ 'primary/star': Math.round(starR * 4.8 * 0.6 * z) });
    expect(spans(projectScenery(systemNav(MAGNETAR), at(z), GRID, 0, { reach: 500, charts: false, sizing: SIZED }))).toEqual({ 'primary/mag': 540 });
    // A rock of the belt is 2.6 of its size across (2.4 in the outer belt) and a dwarf planet 4.84 units: a disc from 3 art pixels.
    const scene = systemScene(SOL.seed);
    const rocks = (belt: unknown, width: number): number[] => ((belt as { rocks: { s: number }[] } | null)?.rocks ?? []).map((rock) => rock.s * width * z);
    const dwarfs = ((systemFor(SOL.seed) as { dwarfs?: unknown[] }).dwarfs ?? []).map(() => 4.84 * z);
    const widths = [...rocks(scene.belt, 2.6), ...rocks(scene.kuiper, 2.4), ...dwarfs];
    expect(dwarfs.length).toBeGreaterThan(0);
    expect(widths.length).toBeGreaterThan(20);
    expect(kindOf(sol, 'disc').map((disc) => disc.r)).toEqual(widths.filter((width) => width >= 3).map((width) => Math.round(width / 2)));
    expect(kindOf(sol, 'dot')).toHaveLength(widths.filter((width) => width < 3).length);
    const far = projectScenery(systemNav(), at(0.4), GRID, 0, { reach: 500, charts: false, sizing: SIZED });
    expect(kindOf(far, 'disc')).toEqual([]);
    // A moon is 0.108 of its planet's radius, 2.18 of that across.
    const planets = (zoom: number) => projectMap([{ kind: 'planet', key: 'p', label: 'p', priority: 1, wx: 0, wy: 0, ref: systemScene(SOL.seed).planets.find((p) => p.moons > 0 && p.type === 'gas')! }], at(zoom), GRID, 0, SIZED);
    const giant = systemScene(SOL.seed).planets.find((p) => p.moons > 0 && p.type === 'gas')!;
    const pr = 6 * (Number(giant.P.sizeMul) || 1);
    expect(kindOf(planets(20), 'disc').slice(1).map((disc) => disc.r)).toEqual(Array.from({ length: giant.moons }, () => Math.round(Math.max(0.5, pr * 0.108) * 2.18 * 20 / 2)));
    expect(kindOf(planets(0.5), 'disc')).toHaveLength(1);
    expect(kindOf(planets(0.5), 'dot')).toHaveLength(giant.moons);
  });

  it('the grain of the haze grows with the camera: a single sun is a soft light as wide as the game draws it', () => {
    const nav = galaxyNav();
    const cam = { x: 300, y: 200, z: 30 };
    const plain = hazeItems(passView(nav, cam));
    const sized = hazeItems(passView(nav, cam, { sizing: SIZED }));
    const grainColours = new Set([0xffeed6, 0xcedbff, 0xffc4a0]);
    const lights = (items: readonly SpaceItem[]) => kindOf(items, 'veil').filter((veil) => veil.r <= 20 && veil.r >= 2);
    expect(kindOf(plain, 'dot').length).toBeGreaterThan(0);
    expect(kindOf(sized, 'dot')).toEqual([]);
    expect(lights(sized).length).toBeGreaterThan(lights(plain).length);
    // One grain of the game's picture is 2400 / 2048 units; a sun is half to one and a half grains across.
    for (const light of lights(sized).filter((veil) => !lights(plain).some((other) => other.x === veil.x && other.y === veil.y && other.r === veil.r))) {
      expect(light.r * 2).toBeGreaterThanOrEqual(Math.floor(0.5 * (2400 / 2048) * 15));
      expect(light.r * 2).toBeLessThanOrEqual(Math.ceil(1.5 * (2400 / 2048) * 15) + 1);
    }
    expect(grainColours.size).toBe(3);
  });

  it('the map frame turns the sizing on for the whole picture, and only when asked', () => {
    const frame: MapFrame = { nav: NAV_HOME, cam: { x: 90, y: -60, z: 6 }, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: false, passes: { effects: true, motion: true } };
    const scale = artScale(1280, 720, 1);
    const grid = artGrid(1280, 720, 1, scale);
    const home = (f: MapFrame) => kindOf(mapItems(f, grid, scale), 'element').find((item) => item.x === grid.w / 2 && item.y === grid.h / 2);
    expect(home(frame)?.span).toBeUndefined();
    expect(home({ ...frame, sized: true })?.span).toBeGreaterThan(100);
  });
});

describe('how near its middle a press selects a body: its own disc, or its floor where that is wider (the legacy game\'s numbers)', () => {
  const deco = (k: string, rr?: number): MapBody => ({ kind: 'deco', key: k, label: k, priority: 3, wx: 0, wy: 0, ref: { k, x: 0, y: 0, ...(rr === undefined ? {} : { rr }) } } as MapBody);
  /** The disc alone: no padding, so no floor. */
  const disc = (body: MapBody, zoom: number): number => pickRadius(body, zoom, 600, 0);
  it('a galaxy its size (6151); a grain of light none, so its floor of 9 alone (6146)', () => {
    expect([galaxy({}), galaxy({ radio: true }), galaxy({ quasar: true })].map((body) => disc(body, 1))).toEqual([40, 40, 40]);
    expect(disc(galaxy({}), 0.06)).toBe(0);
    expect(pickRadius(galaxy({}), 0.06, 600, 1.2)).toBeCloseTo(10.8, 9);
    expect(pickRadius(galaxy({}), 0.2, 600, 1.2)).toBeCloseTo(19.2, 9);
  });
  it('a star of a galaxy 1.6 of its size times the star base (6628), a fine star 1.5 (6651): constant on the screen from afar, growing up close', () => {
    expect(disc(star(2), 0.5)).toBeCloseTo(2 * 0.7 * 1.6, 9);
    expect(disc(star(2), 1)).toBeCloseTo(2 * 0.7 * 1.6, 9);
    expect(disc(star(2), 4)).toBeCloseTo(2 * 0.55 * 1.6 * 4, 9);
    expect(disc(star(2, { priority: 2 }), 4)).toBeCloseTo(2 * 0.55 * 1.5 * 4, 9);
  });
  it('a planet its radius (7673); the star of a system its own, 20 where it has none (7527); scenery 0.8 of its radius, of 16.8 where it has none (6620); a wormhole 12, a supernova site 16, a protostar 3.4', () => {
    const jupiter = systemScene(SOL.seed).planets.find((p) => p.name === 'Jupiter')!;
    expect(disc({ kind: 'planet', key: 'p', label: 'p', priority: 1, wx: 0, wy: 0, ref: jupiter }, 2)).toBeCloseTo(2 * 6 * Number(jupiter.P.sizeMul), 9);
    const sun = (starR?: number): MapBody => ({ kind: 'starsys', key: 's', label: 's', priority: 3, wx: 0, wy: 0, ref: { seed: 1, sys: starR === undefined ? {} : { starR } } });
    expect([disc(sun(26), 2), disc(sun(), 2), pickRadius(sun(4), 1, 600, 1.2), pickRadius(sun(4), 1, 600, 1.4)]).toEqual([52, 40, 18 * 1.2, 18 * 1.4]);
    expect([deco('neb', 10), deco('rem', 10), deco('plan'), deco('rogue', 5), deco('fbd', 5)].map((body) => disc(body, 1))).toEqual([8, 8, 42 * 0.4 * 0.8, 4, 4]);
    const site = (kind: 'worm' | 'snova' | 'protostar'): MapBody => ({ kind, key: kind, label: kind, priority: 3, wx: 0, wy: 0, ref: {} } as MapBody);
    expect([site('worm'), site('snova'), site('protostar')].map((body) => disc(body, 1))).toEqual([12, 16, 3.4]);
  });
  it('a small body of a system its own disc once that is wider than its floor: a dwarf planet 2.2 units (7806), the visitor 4 (7825), a comet 2.2 (7842), a moon 0.108 of its planet and never under half a unit (7762)', () => {
    const small = (kind: 'dwarf' | 'visitor' | 'comet'): MapBody => ({ kind, key: kind, label: kind, priority: 3, wx: 0, wy: 0, ref: {} } as MapBody);
    expect([small('dwarf'), small('visitor'), small('comet')].map((body) => pickRadius(body, 10, 600, 1.2))).toEqual([22, 40, 22]);
    expect([small('dwarf'), small('visitor'), small('comet')].map((body) => pickRadius(body, 1, 600, 1.2))).toEqual([11 * 1.2, 12 * 1.2, 13 * 1.2]);
    const [jupiter, mercury] = ['Jupiter', 'Mercury'].map((name) => systemScene(SOL.seed).planets.find((p) => p.name === name)!);
    const moon = (pl: typeof jupiter): MapBody => ({ kind: 'moon', key: 'm', label: 'm', priority: 3, wx: 0, wy: 0, ref: { pl: pl!, m: 0 } });
    expect(pickRadius(moon(jupiter), 40, 600, 1.2)).toBeCloseTo(6 * Number(jupiter!.P.sizeMul) * 0.108 * 40, 9);
    expect(6 * Number(mercury!.P.sizeMul) * 0.108).toBeLessThan(0.5);
    expect(pickRadius(moon(mercury), 40, 600, 1.2)).toBe(20);
    // Farther out than names are drawn a moon has no floor: its true disc, under a pixel here.
    expect(pickRadius(moon(jupiter), 1, 600, 1.4)).toBeCloseTo(6 * Number(jupiter!.P.sizeMul) * 0.108, 9);
  });
});
