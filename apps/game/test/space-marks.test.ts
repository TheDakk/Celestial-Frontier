import { describe, expect, it } from 'vitest';
import { fittedWidth, parseInterfaceSheet } from '@cf/art-interface';
import type { SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { descentCamera } from '../src/space/camera';
import { mapItems, mapPicture } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { SOL, galaxyNav, kindOf, systemNav } from './space-support';

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const home = galaxyNav();
const frame = (over: Partial<MapFrame> = {}): MapFrame => ({
  nav: home, cam: descentCamera('galaxy', 720).to, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: true,
  passes: { effects: true, motion: true }, sized: true, solid: true, ...over });
const GRID = { w: 640, h: 360 };
const items = (over: Partial<MapFrame> = {}, from = sheet): SpaceItem[] => mapItems(frame(over), GRID, 2, from);
const key = (item: { x: number; y: number }): string => `${item.x},${item.y}`;

describe('a thing smaller than its smallest drawing', () => {
  const plain = items();
  const marked = items({ marks: true });
  const small = kindOf(plain, 'element').filter((item) => item.span !== undefined && fittedWidth(sheet, item.name, item.span) === undefined);
  const fits = kindOf(plain, 'element').filter((item) => item.span === undefined || fittedWidth(sheet, item.name, item.span) !== undefined);

  it('without the asking is drawn at its smallest drawing, wider than the game sizes it: the home galaxy is crowded', () => {
    expect(small.length).toBeGreaterThan(100);
    for (const item of small) expect(sheet.elements.get(item.name)!.w, item.name).toBeGreaterThan(item.span!);
    expect(new Set(small.map((item) => item.name.split('/')[0])).size).toBeGreaterThanOrEqual(2);
  });

  it('asked for, is a mark of its own size and colour where it stood: one pixel, or a cross from a span of 3', () => {
    const left = kindOf(marked, 'element');
    expect(left).toEqual(fits);
    const dots = new Map<string, number[]>();
    for (const dot of kindOf(marked, 'dot')) dots.set(key(dot), [...(dots.get(key(dot)) ?? []), dot.colour]);
    for (const item of small) {
      expect(dots.get(key(item)), `${item.name} at ${key(item)}`).toContain(item.ramp);
      const arms = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => dots.get(key({ x: item.x + dx!, y: item.y + dy! }))?.includes(item.ramp)).length;
      if (item.span! >= 3) expect(arms, `${item.name} spanning ${item.span}`).toBe(4);
    }
    // Nothing else of the map changes: the marks stand in the places of the drawings, in their order.
    expect(marked.length - plain.length).toBe(small.reduce((n, item) => n + (item.span! >= 3 ? 4 : 0), 0));
    expect(small.some((item) => item.span! < 3)).toBe(true);
    expect(small.some((item) => item.span! >= 3)).toBe(true);
  });

  it('no mark is wider than 3 pixels, so the picture holds less of the scenery than the crowded one', () => {
    const count = (list: readonly SpaceItem[]): number => mapPicture({ ...frame(), marks: list === marked }, sheet, { glyphs: [], icons: [], elements: [] }).pixels.filter((value) => value !== 0).length;
    expect(count(marked)).toBeLessThan(count(plain));
  });

  it('every kind of thing is held to it: scenery, a giant star, a site, the hole at the core, a system\'s star and its companion', () => {
    // Each element the far galaxy and the far Sol system ask for at a span, and whether its smallest drawing fits.
    const far = { ...descentCamera('system', 720).to, z: descentCamera('system', 720).to.z * 0.6 };
    for (const over of [{}, { cam: { ...frame().cam, z: frame().cam.z * 0.65 } }, { nav: systemNav(SOL), cam: far }, { nav: systemNav(SOL), cam: { x: 0, y: 0, z: 6 } }]) {
      const [before, after] = [items(over), items({ ...over, marks: true })];
      const spanned = kindOf(before, 'element').filter((item) => item.span !== undefined && item.clip === undefined);
      expect(spanned.length).toBeGreaterThan(0);
      expect(kindOf(after, 'element')).toEqual(kindOf(before, 'element').filter((item) => !spanned.includes(item) || fittedWidth(sheet, item.name, item.span!) !== undefined));
    }
  });

  it('a drawing as wide as its span or narrower is drawn; a name the sheet lacks is still asked for, to be counted as a gap', () => {
    const near = { cam: { x: 60, y: 30, z: 3 } };
    expect(kindOf(items({ ...near, marks: true }), 'element').length).toBeGreaterThan(10);
    expect(items({ ...near, marks: true })).toEqual(items(near));
    // A sheet without the nebula: it is asked for at every size, and the picture counts it missing.
    const text = testInterfaceSheetText();
    const from = text.indexOf('element deco/h2 ');
    const without = parseInterfaceSheet(text.slice(0, from) + text.slice(text.indexOf('element deco/neb ')));
    const asked = (list: readonly SpaceItem[]): number => kindOf(list, 'element').filter((item) => item.name === 'deco/h2').length;
    expect(asked(items({ marks: true }, without))).toBe(asked(items({}, without)));
    expect(asked(items({ marks: true }, without))).toBeGreaterThan(10);
    const gaps = { glyphs: [], icons: [], elements: [] as string[] };
    mapPicture(frame({ marks: true }), without, gaps);
    expect(gaps.elements).toContain('deco/h2');
  });

  it('is asked for with the sizing: a picture that is not sized by the camera has no spans and no marks', () => {
    const { sized: _sized, ...unsized } = frame({ marks: true });
    const { marks: _marks, ...neither } = unsized;
    expect(mapItems(unsized, GRID, 2, sheet)).toEqual(mapItems(neither, GRID, 2, sheet));
  });
});
