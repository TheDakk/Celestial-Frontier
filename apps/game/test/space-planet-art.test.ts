import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { PLANET_TYPES, fittedWidth, parseInterfaceSheet } from '@cf/art-interface';
import type { Gaps, SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { systemScene } from '@cf/scene';
import { cosSin } from '../src/space/model';
import { placedLabels } from '../src/space/labels';
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

describe('the name of a planet the sheet draws', () => {
  it('hangs from the foot of the drawing, which in whole steps may be wider than the game sizes the planet', () => {
    const [cos, sin] = cosSin(jupiter.orb * 0.13);
    let checked = 0;
    for (const z of [3, 3.5, 4, 5, 6.5]) {
      const shown = frame({ cam: { x: cos * jupiter.orb, y: sin * jupiter.orb, z }, placement: { keepOut: [] } });
      const disc = mapItems(shown, GRID, 2, withGas).find((item) => item.kind === 'disc' && item.x === GRID.w / 2 && item.element !== undefined) as Extract<SpaceItem, { kind: 'disc' }>;
      const name = (sheet?: typeof withGas) => placedLabels(shown, 'the Solar Reach', withGas.font, sheet).find((label) => label.text === jupiter.name)!;
      // With the sheet the words begin below the last row of the drawing; they are never moved off their side for it.
      expect([name(withGas).side, name(withGas).y > disc.y + disc.r], `zoom ${z}`).toEqual(['below', true]);
      expect(name(withGas).y - (disc.y + disc.r), `zoom ${z}`).toBeLessThanOrEqual(Math.max(2, name().y - (disc.y + disc.r)));
      // Where the drawing is wider than the game's size, the game's own place for the words is on the drawing.
      const own = Math.round(6 * (jupiter.P.sizeMul as number) * z / 2);
      if (disc.r > own) { checked++; expect(name().y, `zoom ${z}`).toBeLessThanOrEqual(disc.y + disc.r); }
    }
    expect(checked).toBeGreaterThanOrEqual(2);
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
    it(`${name}: asked for, its night and its light are whole pixels: each colour of the globe takes at most four (lit, two half shades, night) and no dot stands alone`, () => {
      const solid = taken(sheet, { ...near, solid: true });
      expect(solid.size).toBeGreaterThan(1);
      for (const [from, to] of solid) expect([...to.keys()].length, `colour ${from}`).toBeLessThanOrEqual(name === 'banded by code' ? 5 : 4);
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

  /** The planet's disc in the frame, and how far past the globe's middle, going straight away from the star, the night
   *  first changes a pixel: asked on the line that runs `across` pixels to the side of the line from the star. */
  function nightEdge(sheet: typeof placeholder, over: Partial<MapFrame>) {
    const items = mapItems(frame(over), GRID, 2, sheet);
    const disc = items.find((item) => item.kind === 'disc' && item.x === GRID.w / 2 && item.r > 20) as Extract<SpaceItem, { kind: 'disc' }>;
    const { lit, dressed } = pictures(sheet, over);
    const edge = (across: number): number => {
      for (let t = -disc.r; t <= disc.r; t++) {
        const at = (disc.y + Math.round(sin * t + cos * across)) * lit.w + disc.x + Math.round(cos * t - sin * across);
        if (lit.pixels[at] !== 0 && dressed.pixels[at] !== lit.pixels[at]) return t;
      }
      return disc.r + 1;
    };
    return { disc, edge, lit, dressed };
  }

  it('asked for, a planet takes no veil at all, and the edge of its night is an arc from pole to pole that bows away from the star', () => {
    const items = mapItems(frame({ ...near, solid: true }), GRID, 2, withGas);
    expect(items.filter((item) => item.kind === 'veil' && item.clip !== undefined)).toEqual([]);
    // The Sun is to the left of Jupiter here: the night is on the right.
    const { disc, edge } = nightEdge(withGas, { ...near, solid: true });
    const r = disc.r;
    const across = [-0.92, -0.6, 0, 0.6, 0.92].map((part) => edge(Math.round(part * r)));
    // Past the middle on the line to the star: the day is the larger part.
    expect(across[2]).toBeGreaterThan(r * 0.15);
    expect(across[2]).toBeLessThan(r * 0.45);
    // Toward each pole the edge comes back to the globe's middle line, and reaches the limb there, not short of it.
    expect(across[1]).toBeLessThan(across[2]!);
    expect(across[3]).toBeLessThan(across[2]!);
    expect(across[0]).toBeLessThan(across[1]!);
    expect(across[4]).toBeLessThan(across[3]!);
    for (const at of [across[0]!, across[4]!]) expect(Math.abs(at)).toBeLessThan(r * 0.25);
    // Day and night both reach each pole: nine tenths of the way out to one there is lit globe and dark globe.
    for (const end of [-0.9, 0.9]) {
      const side = Math.round(end * r);
      const half = Math.floor(Math.sqrt(r * r - side * side));
      expect(edge(side), `${side} to the side`).toBeGreaterThan(-half + 2);
      expect(edge(side), `${side} to the side`).toBeLessThan(half - 2);
    }
  });

  it('the night falls in steps, each darker than the last toward the far limb, and the half shades are narrow beside the night', () => {
    // A planet banded by code: along a row inside one flat band every change of colour is a step of the night.
    const { disc, lit, dressed } = nightEdge(placeholder, { ...near, solid: true });
    const colours = placeholder.palette.colours;
    const luma = (value: number): number => { const c = colours[value]!; return (c >> 16) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114; };
    const y = disc.y + Math.round(disc.r * 0.07);
    const row = Array.from({ length: disc.r }, (_, i) => ({ lit: lit.pixels[y * lit.w + disc.x + i]!, now: dressed.pixels[y * lit.w + disc.x + i]! }));
    expect(new Set(row.map((pixel) => pixel.lit)).size).toBe(1);
    const lumas = row.map((pixel) => luma(pixel.now));
    for (let i = 1; i < lumas.length; i++) expect(lumas[i], `pixel ${i}`).toBeLessThanOrEqual(lumas[i - 1]!);
    expect(new Set(lumas).size).toBeGreaterThanOrEqual(3);
    // From the first step to the full night is under half of the radius, and the full night is a quarter of it or more.
    const first = lumas.findIndex((value) => value < lumas[0]!);
    const last = lumas.indexOf(Math.min(...lumas));
    expect(last - first).toBeLessThan(disc.r / 2);
    expect(disc.r - last).toBeGreaterThan(disc.r / 4);
    // A planet banded by code has the star's light as one more whole-pixel step on the side facing it; a drawn one none.
    const lights = (sheet: typeof placeholder): number => kindOf(mapItems(frame({ ...near, solid: true }), GRID, 2, sheet), 'shade').filter((item) => item.share > 16 && item.clip?.x === disc.x && item.clip.y === disc.y).length;
    expect([lights(placeholder), lights(withGas)]).toEqual([1, 0]);
  });

  it('a surface keeps its own hue in the night: sand goes to a dark sand, not to the slate that is as dark', () => {
    // A gas planet drawn all in sand, in a palette that also holds a dark sand and a slate of the same brightness.
    const sandy = parseInterfaceSheet([testInterfaceSheetText().replace('ramp ink 1 2 3 4', 'colour 9 e3c98b\ncolour 10 3a3020\ncolour 11 30333f\nramp sand 9 9 9 9\nramp ink 1 2 3 4'),
      'element planet/gas anchor=16,16 ramps=sand', ...round(32)].join('\n'));
    const { disc, lit, dressed } = nightEdge(sandy, { ...near, solid: true });
    const farLimb = disc.y * lit.w + disc.x + disc.r - 3;
    expect([lit.pixels[farLimb], dressed.pixels[farLimb]]).toEqual([9, 10]);
    // The slate is no farther from black than the dark sand is: only its hue sets them apart.
    const luma = (c: number): number => (c >> 16) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114;
    expect(Math.abs(luma(0x30333f) - luma(0x3a3020))).toBeLessThan(luma(0x3a3020) / 10);
  });
});
