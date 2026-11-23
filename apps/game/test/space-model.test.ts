import { describe, expect, it } from 'vitest';
import { GR, NAV_HOME, enterGalaxy, enterSystem, resolveCF1Galaxy, resolveCF1Star, systemScene } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { entryZoom } from '../src/space/camera';
import { diveIntent, galaxyContent, keyboardOrder, parkBelowTrigger, supernovaBodies, visibleBodies } from '../src/space/model';
import type { MapBody } from '../src/space/model';
import galaxyCells from '../../../fixtures/current/galaxies.json' with { type: 'json' };

const HOME = { seed: 999, x: 90, y: -60 };
const SOL = { seed: 424242, x: 560, y: 170 };
const VIEW = { w: 800, h: 600 };
const MIN = 600;

function homeGalaxyNav(): Extract<NavState, { mode: 'galaxy' }> {
  const galaxy = resolveCF1Galaxy(HOME);
  if (!galaxy.ok) throw new Error('the home galaxy did not resolve');
  const nav = enterGalaxy(NAV_HOME, galaxy.galaxy);
  if (!nav.ok) throw new Error('the home galaxy was not entered');
  return nav.state;
}
function solNav(): NavState {
  const galaxy = homeGalaxyNav();
  const star = resolveCF1Star(galaxy.gal, SOL);
  if (!star.ok) throw new Error('Sol did not resolve');
  const nav = enterSystem(galaxy, star.star);
  if (!nav.ok) throw new Error('Sol was not entered');
  return nav.state;
}
const body = (kind: MapBody['kind'], key: string, priority: number, wx: number, wy: number): MapBody =>
  ({ kind, key, label: key, priority, wx, wy, ref: null } as unknown as MapBody);

describe('what the maps hold', () => {
  it('every galaxy the galaxies fixture lists for the cells around home appears once, with its seed and position', () => {
    // The universe map streams the 7 by 7 cells around the camera's cell; home is in cell 0, -1.
    const expected = galaxyCells
      .filter((cell) => Math.abs(cell.cx) <= 3 && Math.abs(cell.cy + 1) <= 3)
      .flatMap((cell) => cell.galaxies.map((g) => ({ seed: g.seed, x: g.x, y: g.y })));
    expect(expected.length).toBeGreaterThan(10);
    const bodies = visibleBodies(NAV_HOME, { x: HOME.x, y: HOME.y, z: 0.1 }, { w: 4000, h: 4000 }, 0);
    expect(bodies.every((b) => b.kind === 'galaxy')).toBe(true);
    const seen = bodies.map((b) => ({ seed: (b.ref as { seed: number }).seed, x: b.wx, y: b.wy }));
    const order = (a: { seed: number }, b: { seed: number }): number => a.seed - b.seed;
    expect(seen.sort(order)).toEqual(expected.sort(order));
    expect(new Set(bodies.map((b) => b.key)).size).toBe(bodies.length);
    const home = bodies.find((b) => b.key === 'galaxy:999:90:-60')!;
    expect(home).toMatchObject({ label: 'Milky Way — you are here', priority: 0, wx: 90, wy: -60 });
    expect(bodies.filter((b) => b.priority === 0)).toEqual([home]);
  });

  it('only bodies on the screen are listed; when none is, all of them are', () => {
    const all = visibleBodies(NAV_HOME, { x: HOME.x, y: HOME.y, z: 0.1 }, { w: 4000, h: 4000 }, 0);
    const near = visibleBodies(NAV_HOME, { x: HOME.x, y: HOME.y, z: 1 }, VIEW, 0);
    expect(near.length).toBeGreaterThan(0);
    expect(near.length).toBeLessThan(all.length);
    for (const b of near) {
      expect(Math.abs(b.wx - HOME.x)).toBeLessThanOrEqual(VIEW.w / 2 - 12);
      expect(Math.abs(b.wy - HOME.y)).toBeLessThanOrEqual(VIEW.h / 2 - 12);
    }
    // A view too small to hold any body off its 12 px edge.
    expect(visibleBodies(NAV_HOME, { x: HOME.x, y: HOME.y, z: 1 }, { w: 20, h: 20 }, 0).length).toBe(all.length);
  });

  it("the home galaxy holds the Sun, marked as Sol, at the game's Sol position", () => {
    const bodies = visibleBodies(homeGalaxyNav(), { x: SOL.x, y: SOL.y, z: 1 }, VIEW, 0);
    expect(bodies.length).toBeGreaterThan(10);
    expect(bodies.every((b) => b.kind === 'star' || b.kind === 'deco')).toBe(true);
    const sun = bodies.filter((b) => b.priority === 0);
    expect(sun).toHaveLength(1);
    expect(sun[0]).toMatchObject({ key: 'star:424242:560:170', label: 'Sun — our star', wx: 560, wy: 170 });
    expect(sun[0]!.ref).toMatchObject({ seed: 424242, sol: true });
    expect(new Set(bodies.map((b) => b.label)).size).toBeGreaterThan(10);
  });

  it('a galaxy lists its nebulae, remnants, rogue planets and failed stars after its stars, and never its star knots', () => {
    const nav = homeGalaxyNav();
    const whole = { w: 4 * GR, h: 4 * GR };
    const bodies = visibleBodies(nav, { x: 0, y: 0, z: 1 }, whole, 0);
    const scenery = bodies.filter((b) => b.kind === 'deco');
    const listed = galaxyContent(nav.gal).deco;
    const knots = listed.filter((d) => d.k === 'open' || d.k === 'glob');
    expect(knots.length).toBeGreaterThan(10);
    expect(scenery.map((b) => b.ref)).toEqual(listed.filter((d) => !knots.includes(d)));
    expect(new Set(scenery.map((b) => b.kind === 'deco' && b.ref.k))).toEqual(new Set(['h2', 'neb', 'mol', 'plan', 'rem', 'rogue', 'fbd']));
    for (const b of scenery) expect(b).toMatchObject({ wx: b.ref.x, wy: b.ref.y, priority: 3 });
    expect(new Set(scenery.map((b) => b.key)).size).toBe(scenery.length);
    expect(scenery.every((b) => b.label.length > 0)).toBe(true);
    expect(keyboardOrder(bodies).findIndex((b) => b.kind === 'deco')).toBe(bodies.length - scenery.length);
  });

  it('the supernova sites of a galaxy and their protostars are those of the epoch asked for', () => {
    const nav = homeGalaxyNav();
    const atStart = supernovaBodies(nav, 0);
    expect(atStart.filter((b) => b.kind === 'snova').map((b) => b.key)).toEqual(['snova:1192668714', 'snova:3166234542', 'snova:3135350794']);
    expect(atStart.filter((b) => b.kind === 'protostar')).toHaveLength(3);
    expect(atStart[0]).toMatchObject({ kind: 'snova', priority: 3, ref: { remnant: 'shell' } });
    expect(atStart[0]!.wx).toBe((atStart[0]!.ref as { x: number }).x);
    expect(atStart[1]).toMatchObject({ kind: 'protostar', key: 'protostar:2414393848' });
    expect(supernovaBodies(nav, 0)).toEqual(atStart);
    expect(supernovaBodies(nav, 12).map((b) => b.key)).not.toEqual(atStart.map((b) => b.key));
    expect(supernovaBodies(NAV_HOME, 0)).toEqual([]);
    expect(supernovaBodies(solNav(), 0)).toEqual([]);
    // The epoch moves nothing else: the galaxy's other bodies do not take it.
    expect(visibleBodies(nav, { x: 0, y: 0, z: 1 }, VIEW, 0).some((b) => b.kind === 'snova' || b.kind === 'protostar')).toBe(false);
  });

  it('zoomed in, a galaxy lists its fine stars too, each star once', () => {
    const nav = homeGalaxyNav();
    const at = { x: 300, y: 100 };
    const far = visibleBodies(nav, { ...at, z: MIN / 260 }, VIEW, 0);
    const near = visibleBodies(nav, { ...at, z: MIN / 259.9 }, VIEW, 0);
    expect(far.every((b) => b.priority <= 1)).toBe(true);
    expect(near.filter((b) => b.priority === 2).length).toBeGreaterThan(0);
    expect(far.length).toBeGreaterThan(10);
    expect(near.filter((b) => b.priority <= 1).map((b) => b.key)).toEqual(far.map((b) => b.key));
    expect(new Set(near.map((b) => b.key)).size).toBe(near.length);
  });

  it('the Sol system lists its planets in orbit order and includes Earth (seed 133)', () => {
    const planets = systemScene(SOL.seed).planets;
    const bodies = visibleBodies(solNav(), { x: 0, y: 0, z: entryZoom('system', MIN) }, VIEW, 0);
    expect(bodies.map((b) => b.label)).toEqual(planets.map((p) => p.name));
    expect(bodies.map((b) => b.key)).toEqual(planets.map((p) => `planet:424242:${p.seed}:${p.ordinal}`));
    expect(bodies.map((b) => b.priority)).toEqual(planets.map((p) => (p.seed === 133 ? 0 : 1)));
    expect(bodies.filter((b) => b.priority === 0).map((b) => b.label)).toEqual(['Earth']);
  });

  it('a planet stands on its orbit at the angle the game gives it for the time', () => {
    const planets = systemScene(SOL.seed).planets;
    for (const time of [0, 12.5, 4000, 90000]) {
      const bodies = visibleBodies(solNav(), { x: 0, y: 0, z: 0.5 }, VIEW, time);
      expect(bodies).toHaveLength(planets.length);
      bodies.forEach((b, i) => {
        const orb = planets[i]!.orb;
        const angle = orb * 0.13 + time * 0.05 / (orb * 0.012);
        expect(b.wx).toBeCloseTo(Math.cos(angle) * orb, 6);
        expect(b.wy).toBeCloseTo(Math.sin(angle) * orb, 6);
      });
    }
  });

  it('the keyboard order is priority, then top to bottom, then left to right, then key', () => {
    const listed = [
      body('star', 'b', 1, 5, 5), body('star', 'a', 1, 5, 5), body('star', 'left', 1, 1, 5),
      body('star', 'top', 1, 9, 2), body('star', 'first', 0, 9, 9), body('star', 'fine', 2, 0, 0),
    ];
    const before = listed.map((b) => b.key);
    expect(keyboardOrder(listed).map((b) => b.key)).toEqual(['first', 'top', 'left', 'a', 'b', 'fine']);
    expect(listed.map((b) => b.key)).toEqual(before);
  });
});

describe('zooming into and out of a map', () => {
  const homeBody = (cam: { x: number; y: number; z: number }): { bodies: MapBody[]; home: MapBody } => {
    const bodies = visibleBodies(NAV_HOME, cam, VIEW, 0);
    return { bodies, home: bodies.find((b) => b.key === 'galaxy:999:90:-60')! };
  };

  it('zooming past the trigger over a galaxy yields a dive for it; parking stops just below the trigger', () => {
    // The home galaxy's size is 78: it fills 0.55 of the shorter side at z = 0.55 * 600 / 78.
    const trigger = 0.55 * MIN / 78;
    const over = { x: HOME.x, y: HOME.y, z: trigger * 1.001 };
    const { bodies, home } = homeBody(over);
    expect(diveIntent(NAV_HOME, over, bodies, MIN)).toEqual({ kind: 'dive', body: home });
    expect(diveIntent(NAV_HOME, { ...over, z: trigger * 0.999 }, bodies, MIN)).toEqual({ kind: 'none' });
    const parked = parkBelowTrigger(home as Extract<MapBody, { kind: 'galaxy' }>, MIN);
    expect(parked).toBeCloseTo(trigger * 0.97, 12);
    expect(diveIntent(NAV_HOME, { ...over, z: parked }, bodies, MIN)).toEqual({ kind: 'none' });
  });

  it('a galaxy is dived into only when it is within 0.4 of the shorter side of the centre', () => {
    const z = (0.55 * MIN / 78) * 1.5;
    const reach = 0.4 * MIN / z;
    const inside = { x: HOME.x + reach * 0.99, y: HOME.y, z };
    const outside = { x: HOME.x + reach * 1.01, y: HOME.y, z };
    expect(diveIntent(NAV_HOME, inside, homeBody(inside).bodies, MIN).kind).toBe('dive');
    expect(diveIntent(NAV_HOME, outside, homeBody(outside).bodies, MIN)).toEqual({ kind: 'none' });
  });

  it('zooming past the trigger over a star yields a dive for it; parking stops just below the trigger', () => {
    const nav = homeGalaxyNav();
    const trigger = MIN / 34;
    const over = { x: SOL.x, y: SOL.y, z: trigger * 1.001 };
    const bodies = visibleBodies(nav, over, VIEW, 0);
    const sun = bodies.find((b) => b.key === 'star:424242:560:170')!;
    expect(diveIntent(nav, over, bodies, MIN)).toEqual({ kind: 'dive', body: sun });
    expect(diveIntent(nav, { ...over, z: trigger * 0.999 }, bodies, MIN)).toEqual({ kind: 'none' });
    const parked = parkBelowTrigger(sun as Extract<MapBody, { kind: 'star' }>, MIN);
    expect(parked).toBeCloseTo(trigger * 0.97, 12);
    expect(diveIntent(nav, { ...over, z: parked }, bodies, MIN)).toEqual({ kind: 'none' });
    // 130 screen pixels is as far from the centre as a star may be.
    const near = { ...over, x: SOL.x + 129 / over.z };
    expect(diveIntent(nav, near, [sun], MIN)).toEqual({ kind: 'dive', body: sun });
    const far = { ...over, x: SOL.x + 131 / over.z };
    expect(diveIntent(nav, far, [sun], MIN).kind).not.toBe('dive');
  });

  it('zooming in over empty space holds the zoom at 1.6 times the star trigger', () => {
    const nav = homeGalaxyNav();
    const trigger = MIN / 34;
    // No star lies at the core of a galaxy.
    const deep = { x: 0, y: 0, z: trigger * 2 };
    expect(diveIntent(nav, deep, visibleBodies(nav, deep, VIEW, 0), MIN)).toEqual({ kind: 'park', z: trigger * 1.6 });
    const shallow = { x: 0, y: 0, z: trigger * 1.5 };
    expect(diveIntent(nav, shallow, visibleBodies(nav, shallow, VIEW, 0), MIN)).toEqual({ kind: 'none' });
  });

  it('zooming out past 0.62 of the entry zoom leaves a galaxy or a system; the universe is never left', () => {
    const galaxy = homeGalaxyNav();
    const gz = entryZoom('galaxy', MIN);
    expect(diveIntent(galaxy, { x: 0, y: 0, z: gz * 0.61 }, [], MIN)).toEqual({ kind: 'ascend' });
    expect(diveIntent(galaxy, { x: 0, y: 0, z: gz * 0.63 }, [], MIN)).toEqual({ kind: 'none' });
    const system = solNav();
    const sz = entryZoom('system', MIN);
    expect(diveIntent(system, { x: 0, y: 0, z: sz * 0.61 }, [], MIN)).toEqual({ kind: 'ascend' });
    expect(diveIntent(system, { x: 0, y: 0, z: sz * 0.63 }, [], MIN)).toEqual({ kind: 'none' });
    expect(diveIntent(system, { x: 0, y: 0, z: 1000 }, visibleBodies(system, { x: 0, y: 0, z: 1 }, VIEW, 0), MIN)).toEqual({ kind: 'none' });
    expect(diveIntent(NAV_HOME, { x: 0, y: 0, z: 0.0024 }, [], MIN)).toEqual({ kind: 'none' });
  });
});
