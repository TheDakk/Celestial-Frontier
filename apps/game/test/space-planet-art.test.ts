import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { PLANET_TYPES, fittedWidth, parseInterfaceSheet } from '@cf/art-interface';
import type { Gaps, SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { systemScene } from '@cf/scene';
import { cosSin } from '../src/space/model';
import { PLANET_BANDS, mapItems, mapPicture, planetBands } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { SOL, kindOf, systemNav } from './space-support';

/** A round drawing `w` wide in values 1 to 4, ringed by rows. */
const round = (w: number): string[] => Array.from({ length: w }, (_, y) => Array.from({ length: w }, (_, x) => {
  const d = (2 * x + 1 - w) * (2 * x + 1 - w) + (2 * y + 1 - w) * (2 * y + 1 - w);
  return d > w * w ? '.' : `${1 + ((x + y) & 3)}`;
}).join(''));
const placeholder = parseInterfaceSheet(testInterfaceSheetText());
/** The placeholder sheet with a gas planet drawn 8 wide and again 16 and 32 wide. No other type is drawn. */
const withGas = parseInterfaceSheet([testInterfaceSheetText(), 'element planet/gas anchor=4,4', ...round(8), '', 'element planet/gas/x16 anchor=8,8', ...round(16), '',
  'element planet/gas/x32 anchor=16,16', ...round(32)].join('\n'));

const planets = systemScene(SOL.seed).planets;
// Jupiter, about which the camera stands close.
const jupiter = planets.find((p) => p.type === 'gas')!;
const frame = (over: Partial<MapFrame> = {}): MapFrame => ({
  nav: systemNav(SOL), cam: { x: jupiter.orb, y: 0, z: 2 }, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: true,
  passes: { effects: true, motion: true }, sized: true, ...over });
const GRID = { w: 640, h: 360 };
const discs = (items: readonly SpaceItem[]) => kindOf(items, 'disc').filter((item) => item.bands.length > 1);
const noGaps = (): Gaps => ({ glyphs: [], icons: [], elements: [] });

describe('planets the sheet draws', () => {
  it('the planet types are the eight the game makes, each with its bands', () => {
    expect([...PLANET_TYPES].sort()).toEqual(Object.keys(PLANET_BANDS).sort());
    expect(PLANET_TYPES).toHaveLength(8);
    expect(planets.every((p) => PLANET_TYPES.includes(p.type))).toBe(true);
  });

  it('a planet of a type the sheet draws is that element, as wide as the sheet draws it; every other planet keeps its bands', () => {
    const drawn = discs(mapItems(frame(), GRID, 2, withGas));
    const plain = discs(mapItems(frame(), GRID, 2, placeholder));
    expect(plain.length).toBeGreaterThan(1);
    expect(plain.every((disc) => disc.element === undefined)).toBe(true);
    expect(drawn).toHaveLength(plain.length);
    const gas = drawn.filter((disc) => disc.element !== undefined);
    expect(gas.length).toBeGreaterThan(0);
    for (const disc of gas) {
      const game = plain.find((other) => other.x === disc.x && other.y === disc.y)!;
      expect(disc).toEqual({ ...game, element: 'planet/gas', r: fittedWidth(withGas, 'planet/gas', 2 * game.r + 1)! >> 1 });
      expect(game.bands).toEqual(planetBands(planets.find((p) => p.type === 'gas' && planetBands(p).join() === game.bands.join())!));
    }
    expect(drawn.filter((disc) => disc.element === undefined)).toEqual(plain.filter((disc) => !gas.some((g) => g.x === disc.x && g.y === disc.y)));
  });

  it('its night is cut to the width it is drawn at, and it takes no light: the drawing is painted lit', () => {
    const items = mapItems(frame(), GRID, 2, withGas);
    const at = items.findIndex((item) => item.kind === 'disc' && item.element !== undefined);
    const disc = items[at] as Extract<SpaceItem, { kind: 'disc' }>;
    expect(disc.r).toBeGreaterThanOrEqual(3);
    for (const veil of [items[at + 1], items[at + 2]]) expect(veil).toMatchObject({ kind: 'veil', colour: 0x00000c, clip: { x: disc.x, y: disc.y, r: disc.r } });
    expect(items.filter((item) => item.kind === 'veil' && item.clip?.x === disc.x && item.clip.y === disc.y)).toHaveLength(2);
    // The same planet banded by code has its light as well.
    const banded = mapItems(frame(), GRID, 2, placeholder);
    expect(banded.filter((item) => item.kind === 'veil' && item.clip?.x === disc.x && item.clip.y === disc.y)).toHaveLength(3);
  });

  it('a sheet without planet drawings, or no sheet, gives the map its banded planets exactly as before', () => {
    expect(mapItems(frame(), GRID, 2, placeholder)).toEqual(mapItems(frame(), GRID, 2));
  });

  it('a planet narrower than its smallest drawing keeps its bands', () => {
    const far = frame({ cam: { x: jupiter.orb, y: 0, z: 0.3 } });
    expect(discs(mapItems(far, GRID, 2, withGas)).some((disc) => disc.element !== undefined)).toBe(false);
    expect(mapItems(far, GRID, 2, withGas)).toEqual(mapItems(far, GRID, 2, placeholder));
  });

  it('the picture changes with the sheet, leaves no gap, and is the same picture twice', () => {
    const gaps = noGaps();
    const first = hashBuffer(mapPicture(frame(), withGas, gaps));
    expect(gaps.elements).toEqual([]);
    expect(hashBuffer(mapPicture(frame(), withGas, noGaps()))).toBe(first);
    expect(hashBuffer(mapPicture(frame(), placeholder, noGaps()))).not.toBe(first);
  });
});

describe('a planet in solid pixels', () => {
  /** The picture of the frame and of the same frame with nothing dressing its planets, as palette indices. */
  const pictures = (sheet: typeof placeholder, over: Partial<MapFrame>) => {
    const { passes: _passes, ...bare } = frame(over);
    return { lit: mapPicture(bare, sheet, noGaps()), dressed: mapPicture(frame(over), sheet, noGaps()) };
  };
  /** For each colour of the lit planet's disc, how many pixels took each colour once dressed. */
  function taken(sheet: typeof placeholder, over: Partial<MapFrame>): Map<number, Map<number, number>> {
    const items = mapItems(frame(over), GRID, 2, sheet);
    const disc = items.find((item) => item.kind === 'disc' && item.x === GRID.w / 2 && item.r > 20) as Extract<SpaceItem, { kind: 'disc' }>;
    const { lit, dressed } = pictures(sheet, over);
    const out = new Map<number, Map<number, number>>();
    for (let y = disc.y - disc.r; y <= disc.y + disc.r; y++) for (let x = disc.x - disc.r; x <= disc.x + disc.r; x++) {
      if ((x - disc.x) ** 2 + (y - disc.y) ** 2 > (disc.r - 1) ** 2) continue;
      const [from, to] = [lit.pixels[y * lit.w + x]!, dressed.pixels[y * lit.w + x]!];
      out.set(from, new Map(out.get(from)).set(to, (out.get(from)?.get(to) ?? 0) + 1));
    }
    return out;
  }
  /** A pixel of the dressed picture that differs from all four of its neighbours while they agree: a dot. */
  function dots(sheet: typeof placeholder, over: Partial<MapFrame>): number {
    const items = mapItems(frame(over), GRID, 2, sheet);
    const disc = items.find((item) => item.kind === 'disc' && item.x === GRID.w / 2 && item.r > 20) as Extract<SpaceItem, { kind: 'disc' }>;
    const { lit, dressed } = pictures(sheet, over);
    const at = (picture: typeof lit, x: number, y: number): number => picture.pixels[y * picture.w + x]!;
    let found = 0;
    for (let y = disc.y - disc.r + 2; y <= disc.y + disc.r - 2; y++) for (let x = disc.x - disc.r + 2; x <= disc.x + disc.r - 2; x++) {
      if ((x - disc.x) ** 2 + (y - disc.y) ** 2 > (disc.r - 3) ** 2) continue;
      const around = [at(dressed, x - 1, y), at(dressed, x + 1, y), at(dressed, x, y - 1), at(dressed, x, y + 1)];
      const litAround = [at(lit, x - 1, y), at(lit, x + 1, y), at(lit, x, y - 1), at(lit, x, y + 1)];
      // Only where the lit picture is one flat colour: a dot there was put by the dressing.
      if (litAround.every((value) => value === at(lit, x, y)) && around.every((value) => value === around[0]) && at(dressed, x, y) !== around[0]) found++;
    }
    return found;
  }
  // Jupiter where it stands as a game starts, in the middle of the view; the Sun is off to its left.
  const [cos, sin] = cosSin(jupiter.orb * 0.13);
  const near = { cam: { x: cos * jupiter.orb, y: sin * jupiter.orb, z: 4 } };
  expect(cos).toBeGreaterThan(0.5);

  for (const [name, sheet] of [['banded by code', placeholder], ['drawn from the sheet', withGas]] as const) {
    it(`${name}: asked for, its night and its light are whole pixels: each colour of the globe takes at most three (lit, half shade, night) and no dot stands alone`, () => {
      const solid = taken(sheet, { ...near, solid: true });
      expect(solid.size).toBeGreaterThan(1);
      for (const [from, to] of solid) expect([...to.keys()].length, `colour ${from}`).toBeLessThanOrEqual(name === 'banded by code' ? 4 : 3);
      expect(dots(sheet, { ...near, solid: true })).toBe(0);
      // Some of it is in the night and some is not.
      const changed = [...solid].reduce((n, [from, to]) => n + [...to].filter(([value]) => value !== from).reduce((sum, [, count]) => sum + count, 0), 0);
      const all = [...solid].reduce((n, [, to]) => n + [...to.values()].reduce((sum, count) => sum + count, 0), 0);
      expect(changed / all).toBeGreaterThan(0.25);
      expect(changed / all).toBeLessThan(0.75);
      // Without the asking the night is the dither it was: on the flat bands of a planet banded by code, dots stand
      // alone all over it.
      if (sheet === placeholder) expect(dots(sheet, near)).toBeGreaterThan(50);
    });
  }

  it('asked for, a planet takes no veil at all: a half shade along the terminator and the night beyond it, on the side away from the star', () => {
    for (const sheet of [placeholder, withGas]) {
      const items = mapItems(frame({ ...near, solid: true }), GRID, 2, sheet);
      const at = items.findIndex((item) => item.kind === 'disc' && item.x === GRID.w / 2 && item.r > 20);
      const disc = items[at] as Extract<SpaceItem, { kind: 'disc' }>;
      const clip = { x: disc.x, y: disc.y, r: disc.r };
      expect(items.filter((item) => item.kind === 'veil' && item.clip !== undefined)).toEqual([]);
      const shades = kindOf(items, 'shade').filter((item) => item.clip?.x === disc.x && item.clip.y === disc.y);
      const [band, night] = shades;
      expect(band).toMatchObject({ clip, inner: night!.r });
      expect(night).toMatchObject({ clip, x: band!.x, y: band!.y });
      expect(night!.share).toBeLessThan(band!.share);
      expect(band!.share).toBeLessThan(16);
      // The Sun is to the left of Jupiter here: the night is centred to its right, and the band is about a tenth of the disc wide.
      expect(night!.x).toBeGreaterThan(disc.x + disc.r);
      expect((band!.r - night!.r) / (2 * disc.r + 1)).toBeCloseTo(0.1, 1);
      // A planet banded by code has the star's light as one more whole-pixel step on the side facing it; a drawn one none.
      expect(shades.slice(2).map((light) => [light.share > 16, light.x < disc.x])).toEqual(sheet === placeholder ? [[true, true]] : []);
    }
  });
});
