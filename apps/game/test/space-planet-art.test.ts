import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { PLANET_TYPES, fittedWidth, parseInterfaceSheet } from '@cf/art-interface';
import type { Gaps, SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { systemScene } from '@cf/scene';
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
