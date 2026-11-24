import { describe, expect, it } from 'vitest';
import { paintSpace, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import type { Gaps, SpaceItem, SpacePicture } from '@cf/art-interface';
import { HOME_POS, OBS_R, SOL_POS, UCELL } from '@cf/domain-worldconfig';
import { galaxiesInCell } from '@cf/domain-worldgen';
import { GR, NAV_HOME, systemScene } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { descentCamera } from '../src/space/camera';
import type { Camera } from '../src/space/camera';
import { place, stroke } from '../src/space/draw';
import { hazeItems } from '../src/space/passes-galaxy';
import { cometItems, visitorItems, zoneItems } from '../src/space/passes-system';
import { bridgeItems, edgeItems, fogItems, veilItems, webItems } from '../src/space/passes-universe';
import { mapPicture } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { starLight } from '../src/space/sizes';
import { COLLIDING, SHADES, SOL, VISITED, galaxyNav, kindOf, meshDots, passView, shadedSheet, systemNav } from './space-support';

const sheet = shadedSheet();
const colours = sheet.palette.colours;
const noGaps = (): Gaps => ({ glyphs: [], icons: [], elements: [] });
const paint = (items: readonly SpaceItem[]): SpacePicture => paintSpace(640, 360, items, sheet, noGaps());
/** How bright a palette colour is to the eye. */
const bright = (value: number): number => {
  const rgb = colours[value] ?? 0;
  return (rgb >> 16) * 299 + ((rgb >> 8) & 255) * 587 + (rgb & 255) * 114;
};
const at = (picture: SpacePicture, p: { x: number; y: number }): number => picture.pixels[p.y * picture.w + p.x] ?? 0;
const home = galaxyNav();
const sol = systemNav(SOL);
const visited = systemNav(VISITED);
const solid = (nav: NavState, cam: Camera, over = {}) => passView(nav, cam, { solid: true, sizing: { perCss: 0.5, solid: true }, ...over });
const HOME = { x: HOME_POS.x, y: HOME_POS.y };
/** Where the web is dense: seven cells east and six north of the origin. */
const DENSE = { x: 2600, y: -2200, z: 0.25 };

describe('the whole map in solid pixels', () => {
  const earth = systemScene(SOL.seed).planets.find((p) => p.seed === 133)!;
  const frame = (nav: NavState, cam: Camera, over: Partial<MapFrame> = {}): MapFrame =>
    ({ nav, cam, view: { w: 1280, h: 720 }, dpr: 1, time: 3, epoch: 0, reach: 880, charts: true, passes: { effects: true, motion: true }, sized: true, ...over });
  const SCENES: Array<[string, NavState, Camera]> = [
    ['the charter, its veil and its fog', NAV_HOME, { ...HOME, z: 0.33 }],
    ['fog beyond the charter', NAV_HOME, { x: HOME.x + 1150, y: HOME.y, z: 0.7 }],
    ['the web where it is dense', NAV_HOME, DENSE],
    ['the edge of the observable universe', NAV_HOME, { x: 0, y: -OBS_R, z: 0.48 }],
    ['a colliding pair', NAV_HOME, { x: -2184, y: 1739, z: 3.3 }],
    ['the home galaxy', home, descentCamera('galaxy', 720).to],
    ['the home galaxy near its core', home, { x: 60, y: 30, z: 1.8 }],
    ['deep in the core', home, { x: 20, y: 10, z: 12 }],
    ['about the Sun', home, { x: SOL_POS.x, y: SOL_POS.y, z: 20 }],
    ['the Sol system', sol, descentCamera('system', 720).to],
    ['Earth up close', sol, { x: Math.cos(earth.orb * 0.13) * earth.orb, y: Math.sin(earth.orb * 0.13) * earth.orb, z: 12 }],
    ['a system with a visitor', visited, { x: 0, y: 0, z: 2.4 }],
  ];

  it('no dot mesh lies anywhere on any map: not on the haze, the fog, the web, the veil, the zone, the edge, the bridge or a glow', () => {
    for (const [name, nav, cam] of SCENES) {
      const picture = mapPicture(frame(nav, cam, { solid: true, marks: true }), sheet, noGaps());
      expect(meshDots(picture), name).toBe(0);
      // The picture is not empty of what it shows: more than the star field and space are in it.
      expect(new Set(picture.pixels).size, name).toBeGreaterThan(4);
    }
  });

  it('the same maps without the asking are the dithered ones: the instrument sees their mesh', () => {
    const meshed = SCENES.map(([, nav, cam]) => meshDots(mapPicture(frame(nav, cam), sheet, noGaps())));
    expect(meshed.filter((count) => count > 100).length).toBeGreaterThanOrEqual(9);
    expect(Math.max(...meshed)).toBeGreaterThan(5000);
  });
});

describe('the galaxy haze in solid steps', () => {
  const entry = solid(home, descentCamera('galaxy', 720).to);
  const haze = hazeItems(entry);
  const field = kindOf(haze, 'field')[0]!;
  const glow = paint([field]);
  const centre = place(entry.cam, entry.grid, 0, 0);

  it('is one field under the knots and the grain, brightest at the core and gone before the rim', () => {
    expect(haze[0]).toBe(field);
    expect(kindOf(haze, 'field')).toHaveLength(1);
    const rim = Math.round(GR * entry.cam.z);
    const along = Array.from({ length: rim + 10 }, (_, i) => at(glow, { x: centre.x + i, y: centre.y }));
    expect(bright(along[0]!)).toBe(Math.max(...[...new Set(glow.pixels)].map(bright)));
    // The last tenth of the radius, and what lies beyond, is space.
    expect(along.slice(Math.round(rim * 0.9))).toEqual(along.slice(Math.round(rim * 0.9)).map(() => 0));
    expect(new Set(glow.pixels).size).toBeGreaterThanOrEqual(6);
  });

  it('no step is a strong light, and each step is a little brighter than the one outside it', () => {
    const steps = [...new Set(glow.pixels)].filter((value) => value !== 0).sort((a, b) => bright(a) - bright(b));
    // Whatever is drawn in front is brighter: the faintest star of the galaxy is the placeholder's colour 3.
    for (const value of steps) expect(bright(value)).toBeLessThan(bright(3));
    const jumps = steps.map((value, i) => bright(value) - bright(i === 0 ? 0 : steps[i - 1]!));
    expect(Math.max(...jumps)).toBeLessThan(bright(1) / 8);
    // Outward along any line from the core the glow never takes a step up by more than one: no edge is hard.
    const order = new Map([0, ...steps].map((value, i) => [value, i]));
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1]] as const) {
      for (let i = 1; i < 170; i++) {
        const [a, b] = [at(glow, { x: centre.x + dx * (i - 1), y: centre.y + dy * (i - 1) }), at(glow, { x: centre.x + dx * i, y: centre.y + dy * i })];
        expect(Math.abs(order.get(a)! - order.get(b)!), `${dx},${dy} at ${i}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('follows the arms: at one distance from the core it is brighter on an arm than between two', () => {
    const ring = Array.from({ length: 360 }, (_, i) => at(glow, { x: centre.x + Math.round(Math.cos(i * Math.PI / 180) * 70), y: centre.y + Math.round(Math.sin(i * Math.PI / 180) * 70) }));
    expect(new Set(ring).size).toBeGreaterThanOrEqual(2);
  });

  it('is fixed to the galaxy: a view moved by a few pixels shows the same shapes moved with it', () => {
    const cam = { x: 300, y: 100, z: 1 };
    const base = paint([kindOf(hazeItems(solid(home, cam)), 'field')[0]!]);
    // 20 world units at half an art pixel a unit: 10 art pixels to the left.
    const moved = paint([kindOf(hazeItems(solid(home, { ...cam, x: cam.x + 20 })), 'field')[0]!]);
    let same = 0;
    for (let y = 0; y < 360; y++) for (let x = 0; x < 630; x++) if (moved.pixels[y * 640 + x] === base.pixels[y * 640 + x + 10]) same++;
    expect(same / (360 * 630)).toBeGreaterThan(0.995);
    expect(new Set(base.pixels).size).toBeGreaterThan(2);
  });

  it('its grain is the same suns wherever the view stands: a view moved by one pixel shows the same grain moved with it', () => {
    const grain = (x: number): string[] => kindOf(hazeItems(solid(home, { x, y: 30, z: 1.2 })), 'dot').map((dot) => `${dot.x + Math.round((x - 60) * 0.6)},${dot.y}`);
    // One art pixel is a world unit and two thirds here.
    const [here, moved] = [grain(60), grain(60 + 5 / 3)];
    expect(here.length).toBeGreaterThan(300);
    const kept = moved.filter((spot) => here.includes(spot)).length;
    expect(kept / here.length).toBeGreaterThan(0.97);
  });

  it('is the same each time, differs from galaxy to galaxy, and belongs to the galaxy map alone', () => {
    expect(hazeItems(solid(home, descentCamera('galaxy', 720).to))).toEqual(haze);
    expect(hazeItems(solid(NAV_HOME, descentCamera('galaxy', 720).to))).toEqual([]);
  });

  it('a star up close has a solid halo: a dim disc, a brighter one inside it, its disc and its heart', () => {
    const star = starLight(100, 100, 60, 0xcfe4ff, true);
    expect(star.map((item) => item.kind)).toEqual(['veil', 'veil', 'disc', 'disc']);
    expect(kindOf(star, 'veil').map((item) => [item.r, item.level, item.light])).toEqual([[18, 16, true], [12, 16, true]]);
    const picture = paint(star);
    const row = Array.from({ length: 22 }, (_, i) => bright(at(picture, { x: 100 + i, y: 100 })));
    for (let i = 1; i < row.length; i++) expect(row[i], `at ${i}`).toBeLessThanOrEqual(row[i - 1]!);
    expect(new Set(row).size).toBeGreaterThanOrEqual(4);
    expect(meshDots(picture)).toBe(0);
    // From afar it is the single pixel it was.
    expect(starLight(5, 5, 4, 0xcfe4ff, true)).toEqual(starLight(5, 5, 4, 0xcfe4ff));
  });
});

describe('the cosmic web in threads', () => {
  const v = solid(NAV_HOME, DENSE);
  const web = webItems(v);
  const knot = (cx: number, cy: number): { x: number; y: number } => {
    const first = (galaxiesInCell(cx, cy) as unknown as { x: number; y: number }[])[0]!;
    return place(v.cam, v.grid, first.x, first.y);
  };

  it('is lines one pixel wide and nothing else, each fainter than any galaxy', () => {
    expect(web.length).toBeGreaterThan(200);
    expect(web.every((item) => item.kind === 'dot')).toBe(true);
    const picture = paint(web);
    const used = [...new Set(picture.pixels)].filter((value) => value !== 0);
    expect(used.length).toBeGreaterThanOrEqual(1);
    for (const value of used) expect(bright(value)).toBeLessThan(bright(3));
    // A thread is thin: a pixel of one does not have all four of its neighbours on a thread too.
    let thick = 0;
    for (let y = 1; y < 359; y++) for (let x = 1; x < 639; x++) {
      if (at(picture, { x, y }) !== 0 && at(picture, { x: x - 1, y }) !== 0 && at(picture, { x: x + 1, y }) !== 0 && at(picture, { x, y: y - 1 }) !== 0 && at(picture, { x, y: y + 1 }) !== 0) thick++;
    }
    // Only where threads meet on a knot.
    expect(thick).toBeLessThan(web.length / 100);
  });

  it('a thread runs unbroken from a dense cell to the denser of its neighbours, and a cell that is not dense starts none', () => {
    const [cx, cy] = [Math.floor(DENSE.x / UCELL), Math.floor(DENSE.y / UCELL)];
    const dots = kindOf(web, 'dot');
    const starts = new Set<string>();
    let threads = 0;
    for (let x = cx - 3; x <= cx + 3; x++) for (let y = cy - 3; y <= cy + 3; y++) {
      const own = galaxiesInCell(x, y).web;
      let best = { web: own, x, y };
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const near = galaxiesInCell(x + dx, y + dy).web;
        if (near > best.web) best = { web: near, x: x + dx, y: y + dy };
      }
      if (!(own > 0.5) || best.web === own || galaxiesInCell(x, y).length === 0 || galaxiesInCell(best.x, best.y).length === 0) continue;
      const [from, to] = [knot(x, y), knot(best.x, best.y)];
      const inside = (p: { x: number; y: number }): boolean => p.x >= 0 && p.y >= 0 && p.x < 640 && p.y < 360;
      if (!inside(from) || !inside(to)) continue;
      threads++;
      starts.add(`${from.x},${from.y}`);
      // Walk from each pixel drawn on this knot, each next pixel beside the last: one walk ends on the denser cell's knot.
      const ends = dots.flatMap((dot, first) => {
        if (dot.x !== from.x || dot.y !== from.y) return [];
        let i = first;
        while (i + 1 < dots.length && (dots[i]!.x !== to.x || dots[i]!.y !== to.y) && Math.max(Math.abs(dots[i + 1]!.x - dots[i]!.x), Math.abs(dots[i + 1]!.y - dots[i]!.y)) <= 1) i++;
        return [`${dots[i]!.x},${dots[i]!.y}`];
      });
      expect(ends, `thread from cell ${x},${y}`).toContain(`${to.x},${to.y}`);
    }
    expect(threads).toBeGreaterThanOrEqual(5);
    // About home the web is thin: no cell there is dense, and nothing is drawn.
    expect(webItems(solid(NAV_HOME, { ...HOME, z: 0.9 }))).toEqual([]);
  });

  it('shows from the zoom the game shows its web at, and not below it', () => {
    expect(webItems(solid(NAV_HOME, { ...DENSE, z: 0.039 }))).toEqual([]);
    expect(webItems(solid(NAV_HOME, { ...DENSE, z: 0.05 })).length).toBeGreaterThan(0);
  });

  it('a line is only walked where it is on the picture, however long it is', () => {
    const grid = { w: 40, h: 30 };
    const long = stroke([{ x: -4_000_000, y: -3_000_000 }, { x: 4_000_040, y: 3_000_030 }], 0xffffff, grid);
    expect(long.length).toBeGreaterThanOrEqual(30);
    expect(long.length).toBeLessThanOrEqual(80);
    for (const dot of kindOf(long, 'dot')) expect(dot.x >= 0 && dot.x < 40 && dot.y >= 0 && dot.y < 30).toBe(true);
    // A line that is partly on the picture is the part of the whole line that is on it.
    const whole = kindOf(stroke([{ x: -20, y: 5 }, { x: 70, y: 41 }], 1, { w: 1000, h: 1000 }), 'dot');
    const cut = kindOf(stroke([{ x: -20, y: 5 }, { x: 70, y: 41 }], 1, grid), 'dot');
    expect(cut).toEqual(whole.filter((dot) => dot.x >= 0 && dot.x < 40 && dot.y >= 0 && dot.y < 30));
    expect(cut.length).toBeGreaterThan(20);
    // A corner is drawn once, and a line that misses the picture not at all.
    expect(kindOf(stroke([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }], 1, grid), 'dot')).toHaveLength(11);
    expect(stroke([{ x: -5, y: 50 }, { x: 90, y: 50 }], 1, grid)).toEqual([]);
  });
});

describe('the tidal bridge as an arc of stars', () => {
  const near = solid(NAV_HOME, { x: -2184, y: 1739, z: 3.3 });
  const stars = kindOf(bridgeItems(near), 'dot');
  /** How far a picture place lies from the game's curve between the two galaxies, in art pixels. */
  const offCurve = (p: { x: number; y: number }): number => {
    const { x, y, x2, y2, size } = COLLIDING;
    const bend = { x: (x + x2) / 2 + size * 0.4, y: (y + y2) / 2 - size * 0.4 };
    let least = Infinity;
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const on = place(near.cam, near.grid, (1 - t) * (1 - t) * x + 2 * (1 - t) * t * bend.x + t * t * x2, (1 - t) * (1 - t) * y + 2 * (1 - t) * t * bend.y + t * t * y2);
      least = Math.min(least, Math.hypot(on.x - p.x, on.y - p.y));
    }
    return least;
  };

  it('is single stars and nothing else, strewn along the curve the game draws and no wider than the game draws it', () => {
    expect(bridgeItems(near).every((item) => item.kind === 'dot')).toBe(true);
    expect(stars.length).toBeGreaterThan(80);
    // 0.14 of the galaxy's size across: 7 world units, 11.5 art pixels here; half of that to either side.
    for (const star of stars) expect(offCurve(star)).toBeLessThanOrEqual(COLLIDING.size * 0.07 * near.cam.z + 1.5);
    // Thickest on its centre line: two thirds lie within a quarter of the width of it, where an even band has half.
    expect(stars.filter((star) => offCurve(star) <= COLLIDING.size * 0.035 * near.cam.z).length / stars.length).toBeGreaterThan(0.65);
    // It spans the gap: stars stand in each fifth of the way from one galaxy to the other.
    const [a, b] = [place(near.cam, near.grid, COLLIDING.x, COLLIDING.y), place(near.cam, near.grid, COLLIDING.x2, COLLIDING.y2)];
    const fifths = new Set(stars.map((star) => Math.floor(5 * ((star.x - a.x) * (b.x - a.x) + (star.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2))));
    expect([0, 1, 2, 3, 4].every((fifth) => fifths.has(fifth))).toBe(true);
  });

  it('has bright stars among faint ones, is the same each time, and is not drawn while the galaxy is a dot', () => {
    const tones = new Set(stars.map((star) => star.colour));
    expect(tones.size).toBe(2);
    const [faint, lit] = [...tones].sort((x, y) => x - y);
    expect(stars.filter((star) => star.colour === lit).length).toBeLessThan(stars.filter((star) => star.colour === faint).length);
    expect(bridgeItems(solid(NAV_HOME, { x: -2184, y: 1739, z: 3.3 }))).toEqual(bridgeItems(near));
    expect(bridgeItems(solid(NAV_HOME, { x: -2184, y: 1739, z: 0.1 }))).toEqual([]);
  });
});

describe('the charter in solid pixels: veil and fog', () => {
  const v = solid(NAV_HOME, { ...HOME, z: 0.2 });
  const centre = place(v.cam, v.grid, HOME.x, HOME.y);
  /** A white star `reaches` of the charter's radius to the right of home. */
  const starAt = (reaches: number): SpaceItem => ({ kind: 'dot', x: centre.x + Math.round(880 * reaches * v.cam.z), y: centre.y, colour: 0xffffff });

  it('the veil dims every star beyond the charter, more from one and a half of its radius, without end; space stays space', () => {
    const stars = [0.5, 0.98, 1.2, 1.7, 2.5, 3.4].map(starAt);
    const picture = paint([...stars, ...veilItems(v)]);
    const seen = stars.map((star) => bright(at(picture, star as { x: number; y: number })));
    expect(seen[0]).toBe(bright(1));
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBeLessThan(seen[1]!);
    expect(seen[3]).toBeLessThanOrEqual(seen[2]!);
    // The outer step keeps less of a light than the inner one, and each keeps most of it.
    const shares = kindOf(veilItems(v), 'shade').map((item) => item.share);
    expect(shares).toHaveLength(2);
    expect(shares[1]).toBeLessThan(shares[0]!);
    expect(shares[1]).toBeGreaterThanOrEqual(8);
    expect(shares[0]).toBeLessThan(16);
    // The game's veil ends at twice the radius; this one does not: what is out of reach never looks open.
    expect([seen[4], seen[5]]).toEqual([seen[3], seen[3]]);
    expect(picture.pixels.filter((value) => value !== 0)).toHaveLength(stars.length);
    expect(meshDots(paint([{ kind: 'disc', x: 320, y: 180, r: 400, bands: [0xffffff] }, ...veilItems(v)]))).toBe(0);
  });

  it('fog is banks of the darkest colour, seen over empty space, only beyond the charter', () => {
    const fog = fogItems(v);
    expect(fog.map((item) => item.kind)).toEqual(['field']);
    const picture = paint(fog);
    const dark = 9;
    expect(colours[dark]).toBe(SHADES[0]);
    expect([...new Set(picture.pixels)].sort()).toEqual([0, dark]);
    let [inside, banked, beyond] = [0, 0, 0];
    for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) {
      const out = Math.hypot(x - centre.x, y - centre.y) / (880 * v.cam.z);
      if (out < 1.04 && at(picture, { x, y }) !== 0) inside++;
      if (out > 1.1) { beyond++; if (at(picture, { x, y }) !== 0) banked++; }
    }
    expect(inside).toBe(0);
    // Banks, not a sheet: some of what lies beyond is fogged and most is not.
    expect(banked / beyond).toBeGreaterThan(0.03);
    expect(banked / beyond).toBeLessThan(0.5);
  });

  it('with a sheet that has three colours darker than space, a bank falls in three steps, the deepest the darkest', () => {
    const deep = parseInterfaceSheet(testInterfaceSheetText().replace('ramp ink 1 2 3 4', 'colour 40 090e1e\ncolour 41 070a19\ncolour 42 050713\nramp ink 1 2 3 4'));
    const picture = paintSpace(640, 360, fogItems(v), deep, noGaps());
    const count = (value: number): number => picture.pixels.reduce((n, pixel) => n + (pixel === value ? 1 : 0), 0);
    expect([...new Set(picture.pixels)].sort((a, b) => a - b)).toEqual([0, 40, 41, 42]);
    // Each deeper step lies inside the one before it, so it covers less.
    expect(count(40)).toBeGreaterThan(0);
    expect(count(41)).toBeGreaterThan(0);
    expect(count(42)).toBeGreaterThan(0);
    expect(count(42)).toBeLessThan(count(40) + count(41));
  });

  it('a bank dims what it covers, a star never to nothing', () => {
    const fog = fogItems(v);
    const banks = paint(fog);
    const spots: { x: number; y: number }[] = [];
    for (let y = 4; y < 360 && spots.length < 12; y += 9) for (let x = 4; x < 640 && spots.length < 12; x += 9) if (at(banks, { x, y }) !== 0) spots.push({ x, y });
    expect(spots).toHaveLength(12);
    const picture = paint([...spots.map((spot): SpaceItem => ({ kind: 'dot', ...spot, colour: 0xffffff })), ...fog]);
    for (const spot of spots) {
      expect(bright(at(picture, spot))).toBeLessThan(bright(1));
      expect(bright(at(picture, spot))).toBeGreaterThan(bright(at(banks, spot)));
    }
  });

  it('drifts with time; with motion reduced it stands still and is thinner; with effects off there is none', () => {
    const values = (items: readonly SpaceItem[]): number[] => [...kindOf(items, 'field')[0]!.values as ArrayLike<number> as number[]];
    expect(values(fogItems({ ...v, time: 40 }))).not.toEqual(values(fogItems(v)));
    expect(values(fogItems({ ...v, time: 40, motion: false }))).toEqual(values(fogItems({ ...v, motion: false })));
    // The game shows fewer banks with motion reduced: here less of the picture is fogged, and nothing that was clear is.
    const fogged = (items: readonly SpaceItem[]): boolean[] => [...paint(items).pixels].map((value) => value !== 0);
    const [moving, held] = [fogged(fogItems(v)), fogged(fogItems({ ...v, motion: false }))];
    expect(held.filter(Boolean).length).toBeLessThan(moving.filter(Boolean).length * 0.9);
    expect(held.filter(Boolean).length).toBeGreaterThan(moving.filter(Boolean).length * 0.2);
    expect(held.every((on, i) => !on || moving[i])).toBe(true);
    expect(fogItems({ ...v, effects: false })).toEqual([]);
    expect(values(fogItems({ ...v, reach: 1e6 })).every((value) => value === 0)).toBe(true);
  });
});

describe('the edge of the observable universe in solid steps', () => {
  it('is the orange ring in two solid bands, the nearer the warmer, with no mesh', () => {
    const v = solid(NAV_HOME, { x: 0, y: -OBS_R, z: 0.48 });
    const edge = edgeItems(v);
    expect(edge[edge.length - 1]).toMatchObject({ kind: 'ring', colour: 0x805523 });
    const picture = paint(edge);
    expect(meshDots(picture)).toBe(0);
    // Straight down from above the ring through it, at the middle of the view: space, the wide band, the near band,
    // the ring, and back out again.
    const column = Array.from({ length: 360 }, (_, y) => at(picture, { x: 320, y }));
    const runs = column.filter((value, i) => i === 0 || value !== column[i - 1]);
    expect(runs).toEqual([...runs].reverse());
    expect(runs[0]).toBe(0);
    expect(runs.length).toBeGreaterThanOrEqual(5);
    const rise = runs.slice(0, (runs.length + 1) >> 1).map(bright);
    expect(rise).toEqual([...rise].sort((a, b) => a - b));
    // The two bands: the nearer narrower, and a stronger light of the same orange.
    const [wide, close] = kindOf(edge, 'veil');
    expect([wide!.level, wide!.light, close!.level, close!.light]).toEqual([16, true, 16, true]);
    expect(close!.r - close!.inner!).toBeLessThan(wide!.r - wide!.inner!);
    expect(close!.colour >> 16).toBeGreaterThan(wide!.colour >> 16);
    // From so far that the band is under a pixel wide, the ring alone.
    expect(edgeItems(solid(NAV_HOME, { x: 0, y: 0, z: 0.004 }))).toHaveLength(1);
  });
});

describe('a system in solid pixels', () => {
  const CAM = { x: 0, y: 0, z: 1 };

  it('the habitable zone is one flat band of a green hardly lighter than space, between its two radii', () => {
    const v = solid(sol, CAM);
    const picture = paint(zoneItems(v));
    const star = place(v.cam, v.grid, 0, 0);
    const row = Array.from({ length: 100 }, (_, i) => at(picture, { x: star.x + i, y: star.y }));
    // The game's radii for Sol at this zoom: 46 and 70 art pixels.
    expect(row.slice(0, 46).every((value) => value === 0)).toBe(true);
    expect(new Set(row.slice(47, 70)).size).toBe(1);
    expect(colours[row[50]!]).toBe(0x062027);
    expect(row.slice(72).every((value) => value === 0)).toBe(true);
    expect(meshDots(picture)).toBe(0);
    expect(zoneItems({ ...v, charts: false })).toEqual([]);
  });

  it('the habitable zone is its two edges alone once the band is wider than the view, so it never fills the screen', () => {
    const drawnAt = (cam: Camera) => {
      const v = solid(sol, cam);
      const picture = paint(zoneItems(v));
      return { picture, filled: picture.pixels.reduce((n, value) => n + (value === 0 ? 0 : 1), 0), middle: at(picture, place(v.cam, v.grid, 116, 0)) };
    };
    // Mid-band (116 units from the star; the band runs from 92 to 140), still narrower than the view: it is filled.
    const narrow = drawnAt({ x: 116, y: 0, z: 10 });
    expect(colours[narrow.middle]).toBe(0x062027);
    // The same place from closer: 48 units of band are 480 pixels, wider than the 360 of the view. Nothing fills it.
    const inside = drawnAt({ x: 116, y: 0, z: 20 });
    expect(inside.middle).toBe(0);
    // Both edges cross the view (it is 640 wide) as lines a pixel thick: under a hundredth of the picture.
    expect(inside.filled).toBeLessThan(640 * 360 / 100);
    // On the inner edge at that zoom: the edge crosses the view as a thin line, and nothing else is drawn.
    const edge = drawnAt({ x: 92, y: 0, z: 20 });
    expect(edge.filled).toBeGreaterThan(300);
    expect(edge.filled).toBeLessThan(640 * 360 / 100);
    expect(meshDots(edge.picture)).toBe(0);
  });

  describe('the habitable zone from where it would cover most of the view', () => {
    const GREEN = 0x062027;
    /** The share of the picture's pixels in the zone's fill colour, and how many pixels are drawn at all. */
    const drawn = (cam: Camera) => {
      const picture = paint(zoneItems(solid(sol, cam)));
      let [green, any] = [0, 0];
      for (const value of picture.pixels) { if (colours[value] === GREEN) green++; if (value !== 0) any++; }
      return { green: green / picture.pixels.length, any };
    };
    /** The share of the picture's pixels whose middle lies in the band, by the game's radii for Sol (92 and 140). */
    const inBand = (cam: Camera): number => {
      const v = solid(sol, cam);
      const star = place(v.cam, v.grid, 0, 0);
      const [inner, outer] = [92 * v.cam.z, 140 * v.cam.z];
      let n = 0;
      for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) {
        const d2 = (x - star.x) * (x - star.x) + (y - star.y) * (y - star.y);
        if (d2 >= inner * inner && d2 <= outer * outer) n++;
      }
      return n / (640 * 360);
    };

    it('is not filled when the band is a little narrower than the view is tall: 355 pixels of band on a picture 640 by 360', () => {
      // Mid-band below the star at 7.4 art pixels a unit: the band is 355 pixels from edge to edge and lies across
      // the picture, over nearly all of it.
      const cam = { x: 0, y: 116, z: 14.8 };
      expect(inBand(cam)).toBeGreaterThan(0.9);
      const shown = drawn(cam);
      expect(shown.green).toBeLessThan(0.5);
      expect(shown.green).toBe(0);
    });

    it('is filled while the band lies over just under half of the view, and is its two edges from just over half', () => {
      const [under, over] = [{ x: 0, y: 116, z: 6.8 }, { x: 0, y: 116, z: 7.2 }];
      expect(inBand(under)).toBeGreaterThan(0.47);
      expect(inBand(under)).toBeLessThan(0.5);
      expect(inBand(over)).toBeGreaterThan(0.5);
      expect(inBand(over)).toBeLessThan(0.53);
      // Under: the fill, the whole band of it.
      expect(Math.abs(drawn(under).green - inBand(under))).toBeLessThan(0.01);
      // Over: no fill. The outer edge crosses the picture from side to side and the inner one its top, as thin lines.
      expect(drawn(over).green).toBe(0);
      expect(drawn(over).any).toBeGreaterThan(640);
      expect(drawn(over).any).toBeLessThan(640 * 360 / 100);
    });
  });

  it("a comet's coma is a dim disc with a brighter one inside it and a white head", () => {
    const v = solid(sol, { x: 12, y: 24, z: 8 });
    const comet = cometItems(v);
    const head = kindOf(comet, 'dot').at(-1)!;
    expect(head.colour).toBe(0xffffff);
    expect(kindOf(comet, 'veil').map((item) => [item.level, item.light, item.x, item.y])).toEqual([[16, true, head.x, head.y], [16, true, head.x, head.y]]);
    const [outer, inner] = kindOf(comet, 'veil');
    expect(inner!.r).toBeLessThan(outer!.r);
    expect(meshDots(paint(comet))).toBe(0);
  });

  describe('the interstellar visitor', () => {
    const VISITOR = { ang: 5.8391988075083265, off: 212.43221927434206, speed: 22.479097047820687, b: 62.736525751650326 };
    const world = (time: number): { x: number; y: number } => {
      const along = ((time * VISITOR.speed + VISITOR.off) % 832) - 416;
      return { x: -Math.sin(VISITOR.ang) * VISITOR.b + Math.cos(VISITOR.ang) * along, y: Math.cos(VISITOR.ang) * VISITOR.b + Math.sin(VISITOR.ang) * along };
    };
    const ROCK = [0x8a6f58, 0xd9bc9a];
    const parts = (v: ReturnType<typeof solid>) => {
      const dots = kindOf(visitorItems(v), 'dot');
      return { rock: dots.filter((dot) => ROCK.includes(dot.colour)), wake: dots.filter((dot) => !ROCK.includes(dot.colour)), here: place(v.cam, v.grid, world(v.time).x, world(v.time).y) };
    };

    it('is never too small to see: from the far zoom of a system a rock some 4 pixels long with a wake of some 6 behind it', () => {
      const far = parts(solid(visited, { x: 0, y: 0, z: 0.3 }));
      expect(far.rock.length).toBeGreaterThanOrEqual(3);
      expect(far.rock.length).toBeLessThanOrEqual(5);
      expect(far.wake.length).toBeGreaterThanOrEqual(5);
      expect(far.wake.length).toBeLessThanOrEqual(7);
      expect(far.rock.some((dot) => dot.x === far.here.x && dot.y === far.here.y)).toBe(true);
      // The wake lies behind it, against its travel, and fades from the rock outward.
      const ahead = (p: { x: number; y: number }): number => (p.x - far.here.x) * Math.cos(VISITOR.ang) + (p.y - far.here.y) * Math.sin(VISITOR.ang);
      for (const dot of far.wake) expect(ahead(dot)).toBeLessThan(0);
      const fade = [...far.wake].sort((a, b) => ahead(b) - ahead(a)).map((dot) => dot.colour >> 16);
      expect(fade).toEqual([...fade].sort((a, b) => b - a));
      expect(new Set(fade).size).toBe(3);
    });

    it('up close is the shape the game gives it: 10 units long and 3.8 thick, lit on one flank, its wake 15 long and narrowing', () => {
      const v = solid(visited, { ...world(0), z: 16 });
      const near = parts(v);
      const span = (dots: readonly { x: number; y: number }[], angle: number): number => {
        const along = dots.map((dot) => dot.x * Math.cos(angle) + dot.y * Math.sin(angle));
        return Math.max(...along) - Math.min(...along) + 1;
      };
      // 8 art pixels a unit.
      expect(span(near.rock, VISITOR.ang)).toBeGreaterThan(75);
      expect(span(near.rock, VISITOR.ang)).toBeLessThan(85);
      expect(span(near.rock, VISITOR.ang + Math.PI / 2)).toBeGreaterThan(27);
      expect(span(near.rock, VISITOR.ang + Math.PI / 2)).toBeLessThan(34);
      // Both tones, the lit one the more.
      const lit = near.rock.filter((dot) => dot.colour === ROCK[1]).length;
      expect(lit).toBeGreaterThan(near.rock.length / 2);
      expect(lit).toBeLessThan(near.rock.length);
      expect(span(near.wake, VISITOR.ang)).toBeGreaterThan(110);
      expect(span(near.wake, VISITOR.ang)).toBeLessThan(124);
      // Solid: every pixel of the rock's box that is inside its outline is filled, none left out in a pattern.
      expect(meshDots(paint([...near.wake, ...near.rock]))).toBe(0);
    });

    it('tumbles as it goes, crosses the system again, and a system without one draws none', () => {
      const v = solid(visited, { ...world(0), z: 16 });
      const lean = (time: number): string => {
        const { rock } = parts({ ...v, time, cam: { ...v.cam, ...world(time) } });
        const xs = rock.map((dot) => dot.x);
        const ys = rock.map((dot) => dot.y);
        return `${Math.max(...xs) - Math.min(...xs)},${Math.max(...ys) - Math.min(...ys)}`;
      };
      expect(new Set([0, 2, 4, 6].map(lean)).size).toBeGreaterThan(2);
      // After 832 world units it is back where it began.
      expect(parts({ ...v, time: 832 / VISITOR.speed }).here).toEqual(parts(v).here);
      expect(parts({ ...v, time: 3 }).here).not.toEqual(parts(v).here);
      expect(visitorItems(solid(sol, CAM))).toEqual([]);
    });
  });
});
