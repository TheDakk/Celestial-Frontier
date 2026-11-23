import { describe, expect, it } from 'vitest';
import { paintSpace, parseInterfaceSheet } from '@cf/art-interface';
import type { SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { NAV_HOME, systemScene } from '@cf/scene';
import type { PlanetNode } from '@cf/scene';
import { place } from '../src/space/draw';
import { passCaptions } from '../src/space/passes';
import { cometItems, dressPlanet, turnBeams, visitorItems, zoneItems } from '../src/space/passes-system';
import { mapCaptions, mapItems, projectScenery } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { MAGNETAR, PULSAR, SOL, VISITED, kindOf, namesOf, passView, placed, systemNav } from './space-support';

const sol = systemNav(SOL);
const pulsar = systemNav(PULSAR);
const visited = systemNav(VISITED);
const CAM = { x: 0, y: 0, z: 1 };
const frame = (over: Partial<MapFrame> = {}): MapFrame =>
  ({ nav: sol, cam: CAM, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: true, passes: { effects: true, motion: true }, ...over });
const items = (f: MapFrame): SpaceItem[] => mapItems(f, { w: 640, h: 360 }, 2);
const planets = systemScene(SOL.seed).planets;
const earth = planets.find((p) => p.seed === 133)!;
const sheet = parseInterfaceSheet(testInterfaceSheetText());

describe('the habitable zone', () => {
  it('is a faint green band between its two radii, shown with the star charts', () => {
    const v = passView(sol, CAM);
    expect(zoneItems(v)).toEqual([{ kind: 'veil', ...place(v.cam, v.grid, 0, 0), r: 70, inner: 46, colour: 0x143521, level: 4, light: true }]);
    expect(zoneItems({ ...v, charts: false })).toEqual([]);
    expect(kindOf(items(frame({ charts: false })), 'veil').filter((item) => item.inner !== undefined)).toEqual([]);
  });

  it('a system whose star has no such zone has no band, and no other map has one', () => {
    expect(zoneItems(passView(pulsar, CAM))).toEqual([]);
    expect(zoneItems(passView(NAV_HOME, CAM))).toEqual([]);
  });

  it('lies under the orbit lines', () => {
    const all = items(frame());
    const band = all.findIndex((item) => item.kind === 'veil');
    expect(band).toBe(900);
    expect(all[901]).toMatchObject({ kind: 'ring', colour: 0x2a3a55 });
  });
});

describe('day and night on a planet', () => {
  /** A planet up and to the right of the star at the middle of a 640 by 360 picture. */
  const disc = (r: number): SpaceItem[] => [{ kind: 'disc', x: 420, y: 80, r, bands: [0xffffff] }, { kind: 'dot', x: 430, y: 80, colour: 0xc8c8d0 }];
  const v = passView(sol, CAM);

  it('night is dithered over the half away from the star, deeper at the far limb, and never outside the disc', () => {
    const dressed = dressPlanet(earth, disc(20), v);
    expect(dressed[0]).toEqual(disc(20)[0]);
    expect(dressed[dressed.length - 1]).toEqual(disc(20)[1]);
    const picture = paintSpace(640, 360, dressed.slice(0, -1), sheet, { glyphs: [], icons: [], elements: [] });
    const lit = paintSpace(640, 360, disc(20).slice(0, 1), sheet, { glyphs: [], icons: [], elements: [] });
    const white = lit.pixels[80 * 640 + 420]!;
    let [near, far, limb, outside] = [0, 0, 0, 0];
    for (let y = 50; y <= 110; y++) for (let x = 390; x <= 450; x++) {
      const changed = picture.pixels[y * 640 + x] !== lit.pixels[y * 640 + x];
      if (lit.pixels[y * 640 + x] !== white) { if (changed) outside++; continue; }
      if (picture.pixels[y * 640 + x] !== 0) continue;
      // The star is down and to the left: (-1, 1) points at it.
      const toward = (-(x - 420) + (y - 80)) / Math.SQRT2;
      if (toward > 0) near++; else if (toward > -12) far++; else limb++;
    }
    expect(outside).toBe(0);
    expect(near).toBeLessThan(15);
    expect(far).toBeGreaterThan(40);
    expect(limb).toBeGreaterThan(40);
    // About 2 pixels in 16 are night across the far half and 4 in 16 at the limb.
    const nights = kindOf(dressed, 'veil').filter((item) => item.colour === 0x00000c);
    expect(nights.map((item) => item.level)).toEqual([2, 4]);
    expect(nights.every((item) => item.x > 420 && item.y < 80 && item.clip?.r === 20)).toBe(true);
  });

  it("the star's light falls on the side facing it, in the star's colour washed toward white", () => {
    const light = kindOf(dressPlanet(earth, disc(20), v), 'veil').find((item) => item.colour !== 0x00000c)!;
    expect(light).toMatchObject({ x: 413, y: 87, r: 12, level: 2, clip: { x: 420, y: 80, r: 20 } });
    const star = parseInt(systemScene(SOL.seed).starCol.slice(1), 16);
    const washed = (shift: number, white: number): number => Math.round(((star >> shift) & 255) * 0.55 + white * 0.45);
    expect(light.colour).toBe((washed(16, 255) << 16) | (washed(8, 250) << 8) | washed(0, 230));
    expect(light.colour).not.toBe(star);
  });

  it('a planet drawn from the sheet is lit by its own drawing: it takes the night, clipped to the drawn radius, and no light', () => {
    const banded = dressPlanet(earth, disc(20), v);
    const drawn = dressPlanet(earth, [{ kind: 'disc', x: 420, y: 80, r: 16, bands: [0xffffff], element: 'planet/terran' }, { kind: 'dot', x: 430, y: 80, colour: 0xc8c8d0 }], v);
    const veils = kindOf(drawn, 'veil');
    expect(veils.map((item) => [item.colour, item.level, item.clip])).toEqual([[0x00000c, 2, { x: 420, y: 80, r: 16 }], [0x00000c, 4, { x: 420, y: 80, r: 16 }]]);
    // The night is where a banded planet of that radius has it, and the moon is still drawn over it.
    const same = kindOf(dressPlanet(earth, disc(16), v), 'veil');
    expect(veils).toEqual(same.slice(0, 2));
    expect(same).toHaveLength(3);
    expect(drawn[drawn.length - 1]).toEqual({ kind: 'dot', x: 430, y: 80, colour: 0xc8c8d0 });
    // A banded planet keeps both.
    expect(kindOf(banded, 'veil').map((item) => item.colour === 0x00000c)).toEqual([true, true, false]);
  });

  it('follows the planet round the star, and a planet under 3 pixels in radius has no day or night', () => {
    const left: SpaceItem[] = [{ kind: 'disc', x: 100, y: 180, r: 20, bands: [0xffffff] }];
    expect(kindOf(dressPlanet(earth, left, v), 'veil').filter((item) => item.colour === 0x00000c).every((item) => item.x < 100 && item.y === 180)).toBe(true);
    expect(dressPlanet(earth, disc(2), v)).toEqual(disc(2));
    expect(dressPlanet(earth, [{ kind: 'dot', x: 1, y: 1, colour: 0 }], v)).toEqual([{ kind: 'dot', x: 1, y: 1, colour: 0 }]);
  });
});

describe('cloud decks', () => {
  const disc: SpaceItem[] = [{ kind: 'disc', x: 420, y: 80, r: 24, bands: [0x3060a0] }];
  /** Earth is 5.1 world units in radius: its deck shows once that is over 22 screen pixels. */
  const close = passView(sol, { x: 0, y: 0, z: 4.4 });
  const clouds = (planet: PlanetNode, v = close): Extract<SpaceItem, { kind: 'dot' }>[] => kindOf(dressPlanet(planet, disc, v), 'dot');

  it('a living world seen close wears white cloud, inside its disc and thinning before the limb', () => {
    const deck = clouds(earth);
    expect(deck.length).toBeGreaterThan(15);
    expect(deck.length).toBeLessThan(700);
    for (const dot of deck) {
      expect(dot.colour).toBe(0xfafcff);
      expect((dot.x - 420) ** 2 + (dot.y - 80) ** 2).toBeLessThan(24 * 24);
    }
    // Under the night: the clouds come before the day and night veils.
    const dressed = dressPlanet(earth, disc, close);
    expect(dressed.map((item) => item.kind).lastIndexOf('dot')).toBeLessThan(dressed.findIndex((item) => item.kind === 'veil'));
  });

  it('the deck is not shown from afar, nor on a world that is not living or ocean', () => {
    expect(clouds(earth, passView(sol, { x: 0, y: 0, z: 4.3 }))).toEqual([]);
    expect(clouds(planets.find((p) => p.type === 'gas')!)).toEqual([]);
    expect(clouds(planets.find((p) => p.type === 'rocky')!)).toEqual([]);
    expect(clouds({ ...earth, type: 'ocean' }).length).toBeGreaterThan(15);
  });

  it('drifts sideways with time, wrapping round, and is the same deck for the same world', () => {
    const start = clouds(earth);
    expect(clouds(earth)).toEqual(start);
    const later = clouds(earth, { ...close, time: 2 });
    expect(later).not.toEqual(start);
    // The deck is as wide as the world (10.2 world units) and moves 1.6 a second: after one width it is back.
    expect(clouds(earth, { ...close, time: 10.2 / 1.6 + 1e-9 })).toEqual(start);
    expect(clouds({ ...earth, seed: earth.seed + 1 })).not.toEqual(start);
  });
});

describe('cloud decks in solid pixels', () => {
  const R = 48;
  const disc: SpaceItem[] = [{ kind: 'disc', x: 320, y: 180, r: R, bands: [0x3060a0] }];
  /** Earth near: 5.1 world units in radius, 48 art pixels here. The star is off to the left of the view. */
  const close = { ...passView(sol, { x: 30, y: 0, z: 18.8 }), solid: true };
  const clouds = (planet: PlanetNode, v: typeof close = close): Extract<SpaceItem, { kind: 'dot' }>[] => kindOf(dressPlanet(planet, disc, v), 'dot');
  const keyOf = (x: number, y: number): number => y * 4096 + x;
  const WHITE = 0xfafcff;

  it('asked for, the deck is whole shapes: every cloud pixel is part of a block at least 2 by 2, inside the disc and clear of the limb', () => {
    const deck = clouds(earth);
    expect(deck.length).toBeGreaterThan(200);
    expect(deck.length).toBeLessThan(R * R * 2);
    const at = new Set(deck.map((dot) => keyOf(dot.x, dot.y)));
    expect(at.size).toBe(deck.length);
    const has = (x: number, y: number): boolean => at.has(keyOf(x, y));
    for (const { x, y } of deck) {
      const blocks = [[0, 0], [-1, 0], [0, -1], [-1, -1]].filter(([dx, dy]) => has(x + dx!, y + dy!) && has(x + dx! + 1, y + dy!) && has(x + dx!, y + dy! + 1) && has(x + dx! + 1, y + dy! + 1));
      expect(blocks.length, `${x},${y}`).toBeGreaterThan(0);
      expect((x - 320) ** 2 + (y - 180) ** 2).toBeLessThan(R * R);
    }
    // The game's own deck, thinned by nothing but its lone pixels: the pattern laid over every pixel is gone.
    const game = clouds(earth, { ...close, solid: false } as typeof close);
    expect(game.some(({ x, y }) => !has(x, y))).toBe(true);
    expect(game.every((dot) => dot.colour === WHITE)).toBe(true);
  });

  it('a cloud three or more pixels tall has one darker row along its underside, and nothing else is darker', () => {
    const deck = clouds(earth);
    const colourAt = new Map(deck.map((dot) => [keyOf(dot.x, dot.y), dot.colour]));
    const colours = new Set(colourAt.values());
    expect(colours.size).toBe(2);
    const under = [...colours].find((colour) => colour !== WHITE)!;
    expect(colours.has(WHITE) && under < WHITE).toBe(true);
    let dark = 0;
    for (const { x, y, colour } of deck) {
      const foot = !colourAt.has(keyOf(x, y + 1)) && colourAt.has(keyOf(x, y - 1)) && colourAt.has(keyOf(x, y - 2));
      expect(colour === under, `${x},${y}`).toBe(foot);
      if (foot) dark++;
    }
    expect(dark).toBeGreaterThan(10);
  });

  it('drifts sideways with time in whole pixels, wrapping round; it lies under the night, which shades it', () => {
    const start = clouds(earth);
    expect(clouds(earth)).toEqual(start);
    expect(clouds(earth, { ...close, time: 2 })).not.toEqual(start);
    expect(clouds(earth, { ...close, time: 10.2 / 1.6 + 1e-9 })).toEqual(start);
    const dressed = dressPlanet(earth, disc, close);
    expect(dressed.map((item) => item.kind).lastIndexOf('dot')).toBeLessThan(dressed.findIndex((item) => item.kind === 'shade'));
    expect(kindOf(dressed, 'veil')).toEqual([]);
    // Not from afar, and not on a world without weather.
    expect(clouds(earth, { ...passView(sol, { x: 0, y: 0, z: 4.3 }), solid: true })).toEqual([]);
    expect(clouds(planets.find((p) => p.type === 'gas')!)).toEqual([]);
  });

  it('where the sheet draws the clouds of the planet at the width the planet is drawn, they are that drawing, kept to the disc and drifting; else the deck is the game\'s', () => {
    const drawn = { ...close, sizing: { perCss: 0.5, drawn: (name: string, span: number) => (name === 'planet/terran/clouds' || name === 'planet/terran' ? span : undefined) } };
    const sheetDisc: SpaceItem[] = [{ kind: 'disc', x: 320, y: 180, r: R, bands: [0x3060a0], element: 'planet/terran' }];
    const dressed = dressPlanet(earth, sheetDisc, drawn);
    expect(kindOf(dressed, 'dot')).toEqual([]);
    const clip = { x: 320, y: 180, r: R };
    expect(kindOf(dressed, 'element')).toEqual([
      { kind: 'element', name: 'planet/terran/clouds', x: 320, y: 180, ramp: WHITE, span: 2 * R + 1, clip },
      { kind: 'element', name: 'planet/terran/clouds', x: 320 - (2 * R + 1), y: 180, ramp: WHITE, span: 2 * R + 1, clip },
    ]);
    // Two seconds on it has slid 1.6 world units a second: 30 art pixels at this zoom, the second copy coming in behind.
    expect(kindOf(dressPlanet(earth, sheetDisc, { ...drawn, time: 2 }), 'element').map((item) => item.x)).toEqual([350, 350 - (2 * R + 1)]);
    // A drawing at another width than the planet's is not used: the clouds would not sit on the globe.
    const other = { ...drawn, sizing: { perCss: 0.5, drawn: (name: string, span: number) => (name === 'planet/terran/clouds' ? span - 2 : span) } };
    expect(kindOf(dressPlanet(earth, sheetDisc, other), 'element')).toEqual([]);
    expect(kindOf(dressPlanet(earth, sheetDisc, other), 'dot').length).toBeGreaterThan(200);
    // Without the asking the sheet's clouds are not drawn either.
    expect(kindOf(dressPlanet(earth, sheetDisc, { ...drawn, solid: false } as typeof drawn), 'element')).toEqual([]);
  });
});

describe('comets', () => {
  const v = passView(sol, CAM);

  it("Sol's comet starts at its nearest to the Sun, its head bright in a coma, its tail pointing straight away", () => {
    const comet = cometItems(v);
    // 27 world units out along its tilt of 1.1 radians.
    const head = place(v.cam, v.grid, 27 * Math.cos(1.1), 27 * Math.sin(1.1));
    expect(comet.slice(-2)).toEqual([{ kind: 'veil', ...head, r: 2, colour: 0xcfe6ff, level: 8 }, { kind: 'dot', ...head, colour: 0xffffff }]);
    const tail = kindOf(comet, 'dot').slice(0, -1);
    // (320 * 0.55 - 27) / 2 + 8 world units long.
    expect(tail).toHaveLength(Math.round(82.5 * 0.5));
    const star = place(v.cam, v.grid, 0, 0);
    const out = (p: { x: number; y: number }): number => Math.hypot(p.x - star.x, p.y - star.y);
    for (let i = 0; i < tail.length; i++) expect(out(tail[i]!), `tail ${i}`).toBeGreaterThanOrEqual(i === 0 ? out(head) + 0.5 : out(tail[i - 1]!));
    expect(tail[tail.length - 1]!.x - head.x).toBeCloseTo(41 * Math.cos(1.1), -1);
    // It fades in three steps.
    expect([...new Set(tail.map((dot) => dot.colour))]).toEqual([0xa0b8cc, 0x647380, 0x323a40]);
  });

  it('moves along its orbit, its tail shorter the farther from the star, and returns after its period of 45 seconds', () => {
    const start = cometItems(v);
    const far = cometItems({ ...v, time: 22.5 });
    expect(far).not.toEqual(start);
    // At its farthest, 273 world units out, the tail is the 8 world units every comet keeps.
    expect(kindOf(far, 'dot')).toHaveLength(4 + 1);
    expect(cometItems({ ...v, time: 45 })).toEqual(start);
  });

  it('a system with no comet draws none; with motion reduced the comet stays where it starts', () => {
    expect(cometItems(passView(visited, CAM))).toEqual([]);
    expect(cometItems(passView(NAV_HOME, CAM))).toEqual([]);
    const reduced = { effects: true, motion: false };
    expect(items(frame({ time: 20, passes: reduced }))).toEqual(items(frame({ time: 0, passes: reduced })));
    expect(items(frame({ time: 20 }))).not.toEqual(items(frame({ time: 0 })));
    // The comet is drawn whatever the effects switch says.
    expect(items(frame({ passes: { effects: false, motion: true } }))).toEqual(items(frame()));
  });
});

describe('the interstellar visitor', () => {
  const v = passView(visited, CAM);
  const VISITOR = { ang: 5.8391988075083265, off: 212.43221927434206, speed: 22.479097047820687, b: 62.736525751650326 };
  const at = (time: number): { x: number; y: number } => {
    const along = ((time * VISITOR.speed + VISITOR.off) % 832) - 416;
    return place(v.cam, v.grid, -Math.sin(VISITOR.ang) * VISITOR.b + Math.cos(VISITOR.ang) * along, Math.cos(VISITOR.ang) * VISITOR.b + Math.sin(VISITOR.ang) * along);
  };
  const body = (list: readonly SpaceItem[]) => placed(list).filter((item) => item.kind === 'dot' && item.colour === 0x8a6f58);

  it('is a sliver of rock on its straight path, trailing a short wake behind it', () => {
    const drawn = placed(visitorItems(v));
    const sliver = body(drawn);
    // Ten world units long: five art pixels, centred on its place.
    expect(sliver).toHaveLength(5);
    expect(sliver[2]).toMatchObject(at(0));
    const wake = drawn.filter((item) => !sliver.includes(item));
    expect(wake).toHaveLength(6);
    // The wake lies behind: against the direction of travel.
    const ahead = (p: { x: number; y: number }): number => (p.x - at(0).x) * Math.cos(VISITOR.ang) + (p.y - at(0).y) * Math.sin(VISITOR.ang);
    for (const dot of wake) expect(ahead(dot)).toBeLessThan(0);
    expect(drawn.indexOf(wake[0]!)).toBeLessThan(drawn.indexOf(sliver[0]!));
  });

  it('moves with time, tumbling as it goes, and comes round again when it has crossed the system', () => {
    expect(body(visitorItems({ ...v, time: 3 }))[2]).toMatchObject(at(3));
    expect(at(3)).not.toEqual(at(0));
    const lean = (time: number): string => {
      const sliver = body(visitorItems({ ...v, time }));
      return `${sliver[4]!.x - sliver[0]!.x},${sliver[4]!.y - sliver[0]!.y}`;
    };
    expect(new Set([0, 2, 4, 6].map(lean)).size).toBeGreaterThan(2);
    expect(body(visitorItems({ ...v, time: 832 / VISITOR.speed }))[2]).toMatchObject(at(0));
  });

  it('a system without one draws none; with motion reduced it stays where it starts', () => {
    expect(visitorItems(passView(sol, CAM))).toEqual([]);
    const reduced = { effects: true, motion: false };
    expect(items(frame({ nav: visited, time: 9, passes: reduced }))).toEqual(items(frame({ nav: visited, time: 0, passes: reduced })));
  });
});

describe('the beams of a pulsar and a magnetar', () => {
  const scenery = (nav: typeof sol): SpaceItem[] => projectScenery(nav, CAM, { w: 640, h: 360 }, 0, { reach: 880, charts: true });
  const half = Math.PI / 3;

  it('turn through four frames a half turn; an ordinary star is left alone', () => {
    for (const [nav, name] of [[pulsar, 'primary/ns'], [systemNav(MAGNETAR), 'primary/mag']] as const) {
      const base = scenery(nav);
      expect(namesOf(base)).toEqual([name]);
      expect([0.1, 0.3, 0.6, 0.8, 1.1].map((part) => namesOf(turnBeams(base, passView(nav, CAM, { time: part * half })))[0]))
        .toEqual([name, `${name}/t1`, `${name}/t2`, `${name}/t3`, name]);
    }
    expect(turnBeams(scenery(sol), passView(sol, CAM, { time: 0.6 * half }))).toEqual(scenery(sol));
  });

  it('with motion reduced the beams hold their first frame', () => {
    const turned = items(frame({ nav: pulsar, time: 0.6 * half }));
    expect(namesOf(turned)).toContain('primary/ns/t2');
    expect(namesOf(items(frame({ nav: pulsar, time: 0.6 * half, passes: { effects: true, motion: false } })))).toContain('primary/ns');
  });
});

describe('captions of the system passes', () => {
  it('the habitable zone with the charts; the comet by name and the visitor once the view is near', () => {
    expect(passCaptions(passView(sol, CAM))).toEqual([{ text: 'habitable zone', wx: 0, wy: -116 }]);
    expect(passCaptions(passView(sol, CAM, { charts: false }))).toEqual([]);
    const near = passCaptions(passView(sol, { x: 0, y: 0, z: 1.4 }));
    expect(near).toHaveLength(2);
    expect(near[1]!.text).toMatch(/^Comet [A-Z]/);
    expect(near[1]!.wx).toBeCloseTo(27 * Math.cos(1.1), 9);
    expect(near[1]!.wy).toBeCloseTo(27 * Math.sin(1.1) - 2, 9);
    // 720 / 650 is 1.108 and 720 / 520 is 1.385.
    expect(passCaptions(passView(visited, { x: 0, y: 0, z: 1.1 })).map((c) => c.text)).toEqual(['habitable zone']);
    expect(passCaptions(passView(visited, { x: 0, y: 0, z: 1.12 })).map((c) => c.text)).toEqual(['habitable zone', 'interstellar object']);
    // From a frame: none without the passes, and with motion reduced the comet is captioned where it starts.
    const near10 = frame({ cam: { x: 0, y: 0, z: 1.4 }, time: 10 });
    const { passes: _, ...without } = near10;
    expect(mapCaptions(without)).toEqual([]);
    expect(mapCaptions(near10)[1]!.wx).not.toBeCloseTo(27 * Math.cos(1.1), 3);
    expect(mapCaptions({ ...near10, passes: { effects: true, motion: false } })).toEqual(near);
  });
});
