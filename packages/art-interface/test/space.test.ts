import { describe, expect, it } from 'vitest';
import { hashBuffer, toAscii } from '@cf/art-compose';
import { MAX_RADIUS, nearestColour, nearestRamp, paintSpace, parseInterfaceSheet, type Gaps, type SpaceItem } from '../src/index';

const SHEET = parseInterfaceSheet([
  'interface 1',
  'palette',
  'colour 0 000000',
  'colour 1 ffffff',
  'colour 2 808080',
  'colour 3 ff0000',
  'colour 4 800000',
  'colour 5 0000ff',
  'colour 6 000080',
  'ramp ink 1 2 2 2',
  'ramp red 3 4 4 5',
  'ramp accent 5 6 6 6',
  'font display line=1 base=1 gap=0 space=1',
  'glyph U+FFFD',
  '1',
  '',
  'icon missing size=3',
  '1.1',
  '.5.',
  '1.1',
  '',
  'element arrow anchor=1,0',
  '.1..',
  '.125',
  '.1..',
].join('\n'));
const { palette } = SHEET;
const noGaps = (): Gaps => ({ glyphs: [], icons: [], elements: [] });
const paint = (w: number, h: number, items: readonly SpaceItem[], gaps: Gaps = noGaps()) => toAscii(paintSpace(w, h, items, SHEET, gaps)).split('\n');
const WHITE = 0xffffff, RED = 0xff0000, BLUE = 0x0000ff;

describe('nearest colour and ramp', () => {
  it('the nearest palette colour is chosen, and a tie goes to the lower index', () => {
    expect(nearestColour(palette, 0xfefefe)).toBe(1);
    expect(nearestColour(palette, 0x7a0505)).toBe(4);
    expect(nearestColour(palette, 0x000001)).toBe(0);
    // Halfway between colour 0 (000000) and colour 6 (000080) on the blue channel alone.
    expect(nearestColour(palette, 0x000040)).toBe(0);
    // Halfway between colour 4 (800000) and colour 3 (ff0000) is not a whole step; 0xc0 is one step nearer ff.
    expect(nearestColour(palette, 0xbf0000)).toBe(4);
    expect(nearestColour(palette, 0xc00000)).toBe(3);
  });

  it('the nearest ramp is the one whose first colour is nearest', () => {
    expect(nearestRamp(palette, 0xffeeee)).toBe('ink');
    expect(nearestRamp(palette, 0xee2010)).toBe('red');
    expect(nearestRamp(palette, 0x2010ee)).toBe('accent');
    expect(nearestRamp({ ...palette, ramps: {} }, RED)).toBeUndefined();
  });
});

describe('painting space items', () => {
  it('a dot is one pixel in the nearest palette colour', () => {
    expect(paint(3, 2, [{ kind: 'dot', x: 2, y: 1, colour: 0xf00000 }])).toEqual(['...', '..3']);
  });

  it('an element lands its anchor on its place, in the ramp nearest its tint and the accent ramp', () => {
    expect(paint(5, 4, [{ kind: 'element', name: 'arrow', x: 1, y: 1, ramp: WHITE }])).toEqual(['.....', '.1...', '.125.', '.1...']);
    expect(paint(5, 4, [{ kind: 'element', name: 'arrow', x: 1, y: 1, ramp: RED }])).toEqual(['.....', '.3...', '.345.', '.3...']);
  });

  it('a flipped element is mirrored about its anchor column', () => {
    expect(paint(5, 3, [{ kind: 'element', name: 'arrow', x: 3, y: 0, ramp: WHITE, flip: true }])).toEqual(['...1.', '.521.', '...1.']);
  });

  it('a missing element draws the stand-in centred on its place and is counted', () => {
    const gaps = noGaps();
    expect(paint(5, 4, [{ kind: 'element', name: 'comet', x: 2, y: 2, ramp: WHITE }, { kind: 'element', name: 'arrow', x: 0, y: 0, ramp: WHITE }], gaps))
      .toEqual(['1....', '1251.', '1.5..', '.1.1.']);
    expect(gaps).toEqual({ glyphs: [], icons: [], elements: ['comet'] });
  });

  it('a ring is an unbroken outline one pixel wide', () => {
    expect(paint(9, 9, [{ kind: 'ring', x: 4, y: 4, r: 4, colour: WHITE }])).toEqual([
      '..11111..',
      '.1.....1.',
      '1.......1',
      '1.......1',
      '1.......1',
      '1.......1',
      '1.......1',
      '.1.....1.',
      '..11111..',
    ]);
    expect(paint(3, 3, [{ kind: 'ring', x: 1, y: 1, r: 0, colour: WHITE }])).toEqual(['...', '.1.', '...']);
    // A ring is the edge of the disc of the same radius.
    for (const r of [1, 2, 5, 9, 14]) {
      const size = 2 * r + 1;
      const disc = paint(size, size, [{ kind: 'disc', x: r, y: r, r, bands: [WHITE] }]);
      const ring = paint(size, size, [{ kind: 'ring', x: r, y: r, r, colour: WHITE }]);
      const edge = disc.map((line, y) => [...line].map((c, x) =>
        c === '1' && (disc[y - 1]?.[x] !== '1' || disc[y + 1]?.[x] !== '1' || line[x - 1] !== '1' || line[x + 1] !== '1') ? '1' : '.').join(''));
      expect(ring, `radius ${r}`).toEqual(edge);
    }
  });

  it('a disc is filled, in level bands of equal height from the top', () => {
    expect(paint(7, 7, [{ kind: 'disc', x: 3, y: 3, r: 3, bands: [WHITE, RED, BLUE, 0x800000, 0x808080, 0x000080, WHITE] }])).toEqual([
      '..111..',
      '.33333.',
      '5555555',
      '4444444',
      '2222222',
      '.66666.',
      '..111..',
    ]);
    expect(paint(5, 5, [{ kind: 'disc', x: 2, y: 2, r: 2, bands: [RED, BLUE] }])).toEqual(['.333.', '33333', '33333', '55555', '.555.']);
    expect(paint(3, 3, [{ kind: 'disc', x: 1, y: 1, r: 1, bands: [] }])).toEqual(['...', '...', '...']);
  });

  it('what falls outside the picture is dropped, never wrapped onto another row', () => {
    expect(paint(3, 3, [{ kind: 'disc', x: 0, y: 1, r: 1, bands: [WHITE] }])).toEqual(['11.', '11.', '11.']);
    expect(paint(3, 3, [{ kind: 'disc', x: 2, y: 1, r: 1, bands: [WHITE] }])).toEqual(['.11', '.11', '.11']);
    expect(paint(3, 3, [{ kind: 'dot', x: -1, y: 2, colour: WHITE }, { kind: 'dot', x: 3, y: 1, colour: WHITE },
      { kind: 'dot', x: 1, y: 3, colour: WHITE }, { kind: 'element', name: 'arrow', x: -1, y: 2, ramp: WHITE }])).toEqual(['...', '...', '...']);
  });

  it('later items are painted over earlier ones', () => {
    const disc: SpaceItem = { kind: 'disc', x: 1, y: 1, r: 1, bands: [RED] };
    const dot: SpaceItem = { kind: 'dot', x: 1, y: 1, colour: WHITE };
    expect(paint(3, 3, [disc, dot])).toEqual(['333', '313', '333']);
    expect(paint(3, 3, [dot, disc])).toEqual(['333', '333', '333']);
  });

  it('a circle too large or with a radius below nothing is not drawn; a very large one is drawn where it crosses', () => {
    expect(paint(2, 2, [{ kind: 'ring', x: -MAX_RADIUS - 1, y: 0, r: MAX_RADIUS + 1, colour: WHITE }, { kind: 'disc', x: 0, y: 0, r: -1, bands: [WHITE] }])).toEqual(['..', '..']);
    expect(paint(3, 3, [{ kind: 'ring', x: 1 - MAX_RADIUS, y: 1, r: MAX_RADIUS, colour: WHITE }])).toEqual(['.1.', '.1.', '.1.']);
  });

  const SCENE: readonly SpaceItem[] = [
    { kind: 'disc', x: 20, y: 18, r: 6, bands: [RED, BLUE, WHITE] },
    { kind: 'ring', x: 20, y: 18, r: 9, colour: WHITE },
    { kind: 'element', name: 'arrow', x: 12, y: 30, ramp: RED, flip: true },
    { kind: 'element', name: 'comet', x: 30, y: 30, ramp: WHITE },
    { kind: 'dot', x: 11, y: 11, colour: BLUE },
  ];

  it('the same items give the same picture hash twice', () => {
    const first = hashBuffer(paintSpace(40, 40, SCENE, SHEET, noGaps()));
    expect(hashBuffer(paintSpace(40, 40, SCENE.map((item) => ({ ...item })), SHEET, noGaps()))).toBe(first);
    expect(hashBuffer(paintSpace(40, 40, SCENE.slice(1), SHEET, noGaps()))).not.toBe(first);
  });

  it('moving every item by k art pixels moves the picture by k', () => {
    const base = paintSpace(48, 48, SCENE, SHEET, noGaps());
    for (const [kx, ky] of [[5, 0], [0, 7], [-3, 4], [-40, 2]] as const) {
      const moved = paintSpace(48, 48, SCENE.map((item) => ({ ...item, x: item.x + kx, y: item.y + ky })), SHEET, noGaps());
      let compared = 0;
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
        const fromX = x - kx, fromY = y - ky;
        const expected = fromX < 0 || fromX >= 48 || fromY < 0 || fromY >= 48 ? null : base.pixels[fromY * 48 + fromX];
        // A pixel that came from outside the first picture may hold anything the scene draws there; only the shared part is compared.
        if (expected === null) continue;
        expect(moved.pixels[y * 48 + x], `${kx},${ky} at ${x},${y}`).toBe(expected);
        compared++;
      }
      expect(compared).toBe((48 - Math.abs(kx)) * (48 - Math.abs(ky)));
    }
  });
});
