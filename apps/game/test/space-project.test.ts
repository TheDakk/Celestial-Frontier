import { describe, expect, it } from 'vitest';
import type { SpaceItem } from '@cf/art-interface';
import { mulberry32 } from '@cf/domain-rand';
import { NAV_HOME, systemScene } from '@cf/scene';
import type { GalaxyNode } from '@cf/scene';
import { galaxyContent, supernovaBodies, visibleBodies } from '../src/space/model';
import type { MapBody } from '../src/space/model';
import { artCamera, artGrid, artScale, planetBands, projectBackdrop, projectMap, projectScenery } from '../src/space/project';
import { HOME, KAUM, OSUM, SOL, WORMHOLE_GALAXY, galaxyNav, systemNav } from './space-support';

const GRID = { w: 200, h: 100 };
const CAM = { x: 0, y: 0, z: 1 };
const OPTIONS = { reach: 500, charts: true };
const galaxy = (over: Partial<GalaxyNode>): MapBody => {
  const ref: GalaxyNode = { seed: 8, x: 10, y: -20, size: 40, sp: 0, tilt: 1, rot: 0, home: false, quasar: false, dwarf: false, radio: false, blazar: false, bridge: null, ...over };
  return { kind: 'galaxy', key: 'g', label: 'g', priority: 1, wx: ref.x, wy: ref.y, ref };
};
const star = (s: number, sol = false): MapBody =>
  ({ kind: 'star', key: 's', label: 's', priority: 1, wx: 5, wy: 5, ref: { x: 5, y: 5, c: '#ff9a6a', s, seed: 3, ...(sol ? { sol: true } : {}) } });
const elements = (items: readonly SpaceItem[]): string[] => items.flatMap((item) => item.kind === 'element' ? [item.name] : []);
const of = <K extends SpaceItem['kind']>(items: readonly SpaceItem[], kind: K) => items.filter((item): item is Extract<SpaceItem, { kind: K }> => item.kind === kind);

describe('the art scale and the picture', () => {
  it('the scale is a whole number of screen pixels, at least 1, that keeps the shorter side near 270 art pixels', () => {
    expect(artScale(1920, 1080, 1)).toBe(4);
    expect(artScale(390, 844, 3)).toBe(4);
    expect(artScale(844, 390, 2)).toBe(2);
    expect(artScale(539, 2000, 1)).toBe(1);
    expect(artScale(540, 2000, 1)).toBe(2);
    expect(artScale(100, 100, 1)).toBe(1);
    expect(artScale(0, 0, 1)).toBe(1);
    expect(artScale(412, 915, 2.625)).toBe(4);
  });

  it('the picture is extended to cover the whole view at that scale, never stretched and never a pixel more than needed', () => {
    for (const [w, h, dpr] of [[1920, 1080, 1], [390, 844, 3], [412, 915, 2.625], [1101, 733, 1.5], [1, 1, 1]] as const) {
      const scale = artScale(w, h, dpr);
      const grid = artGrid(w, h, dpr, scale);
      for (const [cells, screen] of [[grid.w, w * dpr], [grid.h, h * dpr]] as const) {
        expect(Number.isInteger(cells)).toBe(true);
        expect(cells * scale).toBeGreaterThanOrEqual(screen);
        expect((cells - 1) * scale).toBeLessThan(screen);
      }
    }
    expect(artGrid(1920, 1080, 1, 4)).toEqual({ w: 480, h: 270 });
    expect(artGrid(0, 0, 1, 1)).toEqual({ w: 1, h: 1 });
  });

  it('the camera keeps its place and counts art pixels', () => {
    expect(artCamera({ x: 3, y: -4, z: 2 }, 3, 4)).toEqual({ x: 3, y: -4, z: 1.5 });
  });
});

describe('bodies as things to paint', () => {
  it('a body lands on the whole art pixel nearest its place', () => {
    expect(projectMap([star(1)], { x: 1.2, y: 0.2, z: 2 }, GRID, 0)).toEqual([{ kind: 'dot', x: 108, y: 60, colour: 0xff9a6a }]);
    expect(projectMap([star(1)], { x: 5, y: 5, z: 7 }, { w: 201, h: 101 }, 0)).toMatchObject([{ x: 101, y: 51 }]);
  });

  it('a far galaxy is a dot; a near one is the element of its kind, in the orientation and facing its seed chooses', () => {
    expect(projectMap([galaxy({ size: 40 })], { ...CAM, z: 0.07 }, GRID, 0)).toEqual([{ kind: 'dot', x: 101, y: 49, colour: 0xcfe4ff }]);
    expect(projectMap([galaxy({ sp: 0, seed: 8 })], CAM, GRID, 0)).toEqual([{ kind: 'element', name: 'galaxy/spiral/v0', x: 110, y: 30, ramp: 0xcfe4ff, flip: false }]);
    expect(projectMap([galaxy({ sp: 6, seed: 7 })], CAM, GRID, 0)).toMatchObject([{ name: 'galaxy/barred/v3', flip: true }]);
    expect(projectMap([galaxy({ sp: 9, seed: 1 })], CAM, GRID, 0)).toMatchObject([{ name: 'galaxy/lenticular/v1', flip: false }]);
    expect(projectMap([galaxy({ sp: 13, seed: 6 })], CAM, GRID, 0)).toMatchObject([{ name: 'galaxy/elliptical/v2', flip: true }]);
    expect(projectMap([galaxy({ sp: 15, seed: 4026531843 })], CAM, GRID, 0)).toMatchObject([{ name: 'galaxy/irregular/v3', flip: false }]);
  });

  it('a radio galaxy lies inside its lobes, and a quasar outshines its galaxy', () => {
    expect(elements(projectMap([galaxy({ radio: true, seed: 5 })], CAM, GRID, 0))).toEqual(['radio-lobes/v1', 'galaxy/spiral/v1']);
    expect(elements(projectMap([galaxy({ quasar: true, radio: true })], CAM, GRID, 0))).toEqual(['quasar']);
  });

  it('a star is a dot in its own colour, a giant an element; the Sun is ringed once the galaxy is close', () => {
    expect(projectMap([star(1.49)], CAM, GRID, 0)).toEqual([{ kind: 'dot', x: 105, y: 55, colour: 0xff9a6a }]);
    expect(projectMap([star(1.5)], CAM, GRID, 0)).toEqual([{ kind: 'element', name: 'star/giant', x: 105, y: 55, ramp: 0xff9a6a }]);
    expect(of(projectMap([star(1, true)], { ...CAM, z: 100 / 899 }, GRID, 0), 'ring')).toEqual([{ kind: 'ring', x: 101, y: 51, r: 6, colour: 0xffd9a0 }]);
    expect(of(projectMap([star(1, true)], { ...CAM, z: 100 / 900 }, GRID, 0), 'ring')).toEqual([]);
    expect(of(projectMap([star(1)], CAM, GRID, 0), 'ring')).toEqual([]);
  });

  it('a planet is a banded disc of its size, ringed when it has rings, with its moons about it', () => {
    const nav = systemNav();
    const bodies = visibleBodies(nav, CAM, { w: 4000, h: 4000 }, 0);
    const [earth, saturn] = [bodies.find((b) => b.label === 'Earth')!, bodies.find((b) => b.label === 'Saturn')!];
    const far = projectMap([earth], { ...CAM, z: 0.09 }, GRID, 0);
    expect(far).toMatchObject([{ kind: 'dot' }]);
    const near = projectMap([earth, saturn], { ...CAM, z: 2 }, GRID, 0);
    // Earth: 6 world units by its size of 0.85, at 2 art pixels a unit; one moon and no ring.
    expect(of(near, 'disc').map((d) => d.r)).toEqual([10, 24]);
    expect(of(near, 'ring')).toEqual([{ kind: 'ring', x: of(near, 'disc')[1]!.x, y: of(near, 'disc')[1]!.y, r: 50, colour: 0xe0cea6 }]);
    expect(of(near, 'dot')).toHaveLength(1 + 7);
    expect(near.findIndex((i) => i.kind === 'ring')).toBeLessThan(near.findIndex((i) => i.kind === 'disc' && i.r === 24));
    // Under two pixels of radius the moons are left out.
    expect(projectMap([earth], { ...CAM, z: 0.25 }, GRID, 0).map((i) => i.kind)).toEqual(['disc']);
  });

  it('time turns the moons and nothing else of a planet', () => {
    const earth = visibleBodies(systemNav(), CAM, { w: 4000, h: 4000 }, 0).find((b) => b.label === 'Earth')!;
    const [start, later] = [projectMap([earth], { ...CAM, z: 4 }, GRID, 0), projectMap([earth], { ...CAM, z: 4 }, GRID, 40)];
    expect(of(later, 'disc')).toEqual(of(start, 'disc'));
    expect(of(later, 'dot')).not.toEqual(of(start, 'dot'));
    // The Moon starts at the angle 0, 1.7 planet radii out: 6 x 0.85 x 1.7 x 4 art pixels to the right.
    expect(of(start, 'dot')[0]).toMatchObject({ x: of(start, 'disc')[0]!.x + 35, y: of(start, 'disc')[0]!.y });
    // A quarter turn on, it is below the planet, on an orbit seen at a slant: 0.4 of that distance.
    const quarter = (Math.PI / 2) / (0.55 / (1.7 * Math.sqrt(1.7)));
    expect(of(projectMap([earth], { ...CAM, z: 4 }, GRID, quarter), 'dot')[0]).toMatchObject({ x: of(start, 'disc')[0]!.x, y: of(start, 'disc')[0]!.y + 14 });
  });

  it('two planets of different type draw different bands; the same planet draws the same picture', () => {
    const planets = systemScene(SOL.seed).planets;
    const bands = new Map(planets.map((p) => [p.name, planetBands(p)]));
    for (const p of planets) expect(planetBands(p), p.name).toEqual(bands.get(p.name));
    expect(new Set([...bands.values()].map((b) => b.join())).size).toBe(planets.length);
    expect(bands.get('Earth')).toHaveLength(7);
    expect([bands.get('Earth')![0], bands.get('Earth')![6]]).toEqual([0xeef4ff, 0xeef4ff]);
    // Under the caps Earth alternates sea (blue strongest) and land (green strongest).
    const strongest = (c: number): string => { const v = [(c >> 16) & 255, (c >> 8) & 255, c & 255]; return 'rgb'[v.indexOf(Math.max(...v))]!; };
    expect(bands.get('Earth')!.slice(1, 6).map(strongest).join('')).toBe('bgbgb');
    expect(bands.get('Jupiter')).toHaveLength(7);
    // Mars is banded in its own hue (20 degrees): red over green over blue in every band.
    for (const c of bands.get('Mars')!) expect([(c >> 16) & 255, (c >> 8) & 255].every((v, i, a) => v > (i === 0 ? a[1]! : c & 255))).toBe(true);
    // A type the table lacks is banded as rock, and still by its seed.
    const odd = { ...planets[0]!, type: 'plasma' };
    expect(planetBands(odd)).toEqual(planetBands(planets[0]!));
  });

  it('galaxy scenery is a dot from afar and its own element up close; a nebula takes its hue', () => {
    const nav = galaxyNav();
    const bodies = visibleBodies(nav, CAM, { w: 9000, h: 9000 }, 0).filter((b) => b.kind === 'deco');
    const near = projectMap(bodies, CAM, GRID, 0);
    expect(new Set(elements(near))).toEqual(new Set(['deco/h2', 'deco/neb', 'deco/mol', 'deco/plan', 'deco/rem', 'deco/rogue', 'deco/fbd']));
    const far = projectMap(bodies, { ...CAM, z: 0.01 }, GRID, 0);
    expect(far.every((i) => i.kind === 'dot')).toBe(true);
    const tints = new Map(near.flatMap((i) => i.kind === 'element' ? [[i.name, i.ramp] as const] : []));
    // An emission nebula's hue is 332 degrees (pink), a reflection nebula's 202 (blue).
    expect([tints.get('deco/h2'), tints.get('deco/neb'), tints.get('deco/rem')]).toEqual([0xed4593, 0x45afed, 0xff9a6a]);
    expect(new Set(near.flatMap((i) => i.kind === 'element' ? [i.flip] : []))).toEqual(new Set([true, false]));
  });

  it('a wormhole, a supernova site by what it left, and a protostar each have their element', () => {
    const worm = visibleBodies(galaxyNav(WORMHOLE_GALAXY), CAM, { w: 9000, h: 9000 }, 0).filter((b) => b.kind === 'worm');
    expect(worm).toMatchObject([{ key: `worm:${WORMHOLE_GALAXY.seed}`, label: 'wormhole', priority: 3, wx: -653.7602982538154, wy: -591.381953445504 }]);
    expect(elements(projectMap(worm, CAM, GRID, 0))).toEqual(['wormhole']);
    expect(elements(projectMap(supernovaBodies(galaxyNav(), 0), CAM, GRID, 0)))
      .toEqual(['supernova/shell', 'protostar', 'supernova/ns', 'protostar', 'supernova/shell', 'protostar']);
  });
});

describe('the scenery of a map', () => {
  it('the backdrop is the same 900 seeded stars, spread over the picture', () => {
    const stars = projectBackdrop(GRID);
    expect(stars).toHaveLength(900);
    expect(stars.every((s) => s.kind === 'dot' && s.x >= 0 && s.x < GRID.w && s.y >= 0 && s.y < GRID.h)).toBe(true);
    expect(projectBackdrop(GRID)).toEqual(stars);
    // The first star of the game's seeded field: mulberry32(5) gives x, y, a size (not drawn) and a brightness.
    const random = mulberry32(5);
    const [x, y, , brightness] = [random(), random(), random(), random()];
    const light = Math.round((brightness * 0.5 + 0.15) * 255);
    expect(stars[0]).toEqual({ kind: 'dot', x: Math.floor(x * 200), y: Math.floor(y * 100), colour: light * 0x010101 });
    expect(projectBackdrop({ w: 400, h: 300 })[0]).toMatchObject({ x: Math.floor(x * 400), y: Math.floor(y * 300) });
    expect(stars[1]).toMatchObject({ x: Math.floor(random() * 200), y: Math.floor(random() * 100) });
    expect(new Set(stars.map((s) => s.kind === 'dot' && s.colour)).size).toBeGreaterThan(50);
  });

  it('the universe shows the ring of the charter about home', () => {
    expect(projectScenery(NAV_HOME, { x: HOME.x, y: HOME.y, z: 0.1 }, GRID, 0, OPTIONS)).toEqual([{ kind: 'ring', x: 100, y: 50, r: 50, colour: 0x96beff }]);
    expect(projectScenery(NAV_HOME, { x: 0, y: 0, z: 0.1 }, GRID, 0, { ...OPTIONS, reach: 1000 })).toEqual([{ kind: 'ring', x: 109, y: 44, r: 100, colour: 0x96beff }]);
  });

  it('a galaxy shows its star knots, and the black hole at its centre once it is close', () => {
    const nav = galaxyNav();
    const knots = galaxyContent(nav.gal).deco.filter((d) => d.k === 'open' || d.k === 'glob');
    const points = knots.reduce((n, k) => n + (k.pts as unknown[]).length, 0);
    const far = projectScenery(nav, { ...CAM, z: 100 / 700 }, GRID, 0, OPTIONS);
    expect(far).toHaveLength(points);
    expect(new Set(far.map((i) => i.kind === 'dot' && i.colour))).toEqual(new Set([0xf0dcb0, 0xcfe4ff]));
    const near = projectScenery(nav, { ...CAM, z: 100 / 699 }, GRID, 0, OPTIONS);
    expect(near).toHaveLength(points + 1);
    expect(near.at(-1)).toEqual({ kind: 'element', name: 'black-hole', x: 100, y: 50, ramp: 0xffffff });
    const first = knots[0]!;
    const [dx, dy] = (first.pts as [number, number][])[0]!;
    expect(projectScenery(nav, { x: first.x + dx, y: first.y + dy, z: 1 }, GRID, 0, OPTIONS)[0]).toMatchObject({ x: 100, y: 50 });
  });

  it('a system shows its star, and with the charts on its orbits; belts and dwarf planets ride their orbits', () => {
    const nav = systemNav();
    const scene = systemScene(SOL.seed);
    const items = projectScenery(nav, CAM, GRID, 0, OPTIONS);
    expect(of(items, 'ring').map((r) => r.r)).toEqual(scene.planets.map((p) => Math.round(p.orb)));
    expect(of(items, 'ring').every((r) => r.x === 100 && r.y === 50)).toBe(true);
    expect(of(projectScenery(nav, CAM, GRID, 0, { ...OPTIONS, charts: false }), 'ring')).toEqual([]);
    expect(of(items, 'element')).toEqual([{ kind: 'element', name: 'primary/star', x: 100, y: 50, ramp: 0xfff4d8 }]);
    const rocks = (scene.belt as { rocks: unknown[] }).rocks.length + (scene.kuiper as { rocks: unknown[] }).rocks.length;
    expect(of(items, 'dot')).toHaveLength(rocks + 2);
    expect(new Set(of(items, 'dot').map((d) => d.colour))).toEqual(new Set([0x9a8f80, 0xbcd4e8, 0xb0a898]));
    // Everything that orbits has moved after a while, and the star and the orbit lines have not.
    const later = projectScenery(nav, { ...CAM, z: 3 }, GRID, 500, OPTIONS);
    const start = projectScenery(nav, { ...CAM, z: 3 }, GRID, 0, OPTIONS);
    expect(of(later, 'dot')).not.toEqual(of(start, 'dot'));
    expect([of(later, 'ring'), of(later, 'element')]).toEqual([of(start, 'ring'), of(start, 'element')]);
    // Each rock starts at its own angle and distance and drifts at its own speed; the outer belt at 0.4 of it.
    type Rock = { a: number; rr: number; sp: number };
    const inner = (scene.belt as { rocks: Rock[] }).rocks;
    const outer = (scene.kuiper as { rocks: Rock[] }).rocks;
    const where = (rock: Rock, angle: number) => ({ x: 100 + Math.round(Math.cos(angle) * rock.rr * 3), y: 50 + Math.round(Math.sin(angle) * rock.rr * 3) });
    expect(of(start, 'dot')[0]).toMatchObject(where(inner[0]!, inner[0]!.a));
    expect(of(later, 'dot')[0]).toMatchObject(where(inner[0]!, inner[0]!.a + 500 * inner[0]!.sp));
    expect(of(later, 'dot')[inner.length]).toMatchObject(where(outer[0]!, outer[0]!.a + 500 * outer[0]!.sp * 0.4));
    expect(of(later, 'dot')[inner.length]).not.toMatchObject(where(outer[0]!, outer[0]!.a + 500 * outer[0]!.sp));
    // A dwarf planet keeps the planets' own law: Ceres, 166 out.
    expect(of(later, 'dot')[inner.length + outer.length]).toMatchObject(where({ a: 0, rr: 166, sp: 0 }, 166 * 0.13 + 500 * 0.05 / (166 * 0.012)));
  });

  it('a double star shows its companion, in its own colour, circling the star', () => {
    const nav = systemNav(OSUM);
    const start = of(projectScenery(nav, { ...CAM, z: 2 }, GRID, 0, OPTIONS), 'element');
    expect(start.map((e) => [e.name, e.ramp])).toEqual([['primary/star', 0xff9a6a], ['companion', 0xffd9a0]]);
    // The companion is 44.537 world units out, starting at the angle 0.
    expect(start[1]).toMatchObject({ x: 100 + 89, y: 50 });
    const later = of(projectScenery(nav, { ...CAM, z: 2 }, GRID, 3, OPTIONS), 'element');
    expect(later[1]).not.toMatchObject({ x: 189, y: 50 });
    expect(elements(projectScenery(systemNav(KAUM), CAM, GRID, 0, OPTIONS))).toEqual(['primary/star']);
  });
});
