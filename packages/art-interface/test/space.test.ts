import { describe, expect, it } from 'vitest';
import { hashBuffer, toAscii } from '@cf/art-compose';
import { MAX_RADIUS, ditherRank, nearestColour, nearestRamp, paintSpace, parseInterfaceSheet, type Gaps, type SpaceItem } from '../src/index';

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

/** A sheet of nebulae with their own ramps: magenta 3 4, teal 5 6, dust 7 8, and the ramps a tint can fall on. */
const NEBULAE = parseInterfaceSheet([
  'interface 1',
  'palette',
  'colour 0 000000', 'colour 1 ffffff', 'colour 2 808080', 'colour 3 ff40c0', 'colour 4 802060', 'colour 5 40e0d0', 'colour 6 207068', 'colour 7 a08060', 'colour 8 504030',
  'colour 9 ff0000', 'colour 10 800000',
  'ramp ink 1 2 2 2',
  'ramp accent 2 2 2 2',
  'ramp red 9 10 10 10',
  'ramp magenta 3 3 4 4',
  'ramp teal 5 5 6 6',
  'ramp dust 7 7 8 8',
  'font display line=1 base=1 gap=0 space=1',
  'glyph U+FFFD', '1', '',
  'icon missing size=1', '1', '',
  'element deco/h2 anchor=0,0 ramps=magenta,dust', '1458', '',
  'element deco/plan anchor=0,0 ramps=teal,magenta,dust', '158c', '',
  'element deco/five anchor=0,0 ramps=tint,magenta,teal,dust,ink', '159dh', '48cgk', '',
  'element deco/plain anchor=0,0', '15',
].join('\n'));
const paintNebulae = (w: number, h: number, items: readonly SpaceItem[]) => toAscii(paintSpace(w, h, items, NEBULAE, noGaps())).split('\n');

describe('an element with its own ramps', () => {
  it('an emission nebula in magenta and a planetary nebula in teal are drawn from one sheet, whatever tint the map gives them', () => {
    for (const ramp of [WHITE, RED, 0x40e0d0]) {
      expect(paintNebulae(4, 2, [{ kind: 'element', name: 'deco/h2', x: 0, y: 0, ramp }, { kind: 'element', name: 'deco/plan', x: 0, y: 1, ramp }]), `${ramp}`).toEqual(['3478', '5348']);
    }
  });
  it('values in fours take the ramps in the order named, to twenty; tint is the ramp nearest the colour the map gives', () => {
    expect(paintNebulae(5, 2, [{ kind: 'element', name: 'deco/five', x: 0, y: 0, ramp: WHITE }])).toEqual(['13571', '24682']);
    expect(paintNebulae(5, 2, [{ kind: 'element', name: 'deco/five', x: 0, y: 0, ramp: RED }])).toEqual(['93571', 'a4682']);
  });
  it('an element that names no ramp keeps the tint for its values 1 to 4 and the accent ramp for 5 to 8', () => {
    expect(paintNebulae(2, 1, [{ kind: 'element', name: 'deco/plain', x: 0, y: 0, ramp: RED }])).toEqual(['92']);
  });
});

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

  it('an element given a span is drawn in whole steps: each of its pixels a square block, the anchor block on its place', () => {
    const big = ['..11......', '..11......', '..112255..', '..112255..', '..11......', '..11......', '..........'];
    // The arrow is 4 wide: 8 is twice its width, and so is anything from one and a half widths up to under two and a half.
    for (const span of [6, 8, 9]) expect(paint(10, 7, [{ kind: 'element', name: 'arrow', x: 3, y: 1, ramp: WHITE, span }]), `${span}`).toEqual(big);
    expect(paint(13, 10, [{ kind: 'element', name: 'arrow', x: 4, y: 1, ramp: WHITE, span: 10 }])).toEqual([
      '...111.......', '...111.......', '...111.......', '...111222555.', '...111222555.', '...111222555.', '...111.......', '...111.......', '...111.......', '.............']);
    expect(paint(10, 7, [{ kind: 'element', name: 'arrow', x: 5, y: 1, ramp: WHITE, span: 8, flip: true }]))
      .toEqual(['....11....', '....11....', '552211....', '552211....', '....11....', '....11....', '..........']);
  });

  it('a span of less than one and a half widths, or none, leaves the element as it is drawn', () => {
    const plain = paint(5, 4, [{ kind: 'element', name: 'arrow', x: 1, y: 1, ramp: WHITE }]);
    for (const span of [-3, 0, 1, 4, 5]) expect(paint(5, 4, [{ kind: 'element', name: 'arrow', x: 1, y: 1, ramp: WHITE, span }]), `${span}`).toEqual(plain);
  });

  it('a scaled element is cut at the edges of the picture, and a missing one scales its stand-in', () => {
    expect(paint(4, 3, [{ kind: 'element', name: 'arrow', x: 1, y: 0, ramp: WHITE, span: 8 }])).toEqual(['11..', '1122', '1122']);
    expect(paint(3, 2, [{ kind: 'element', name: 'arrow', x: -40, y: 900, ramp: WHITE, span: 4000 }])).toEqual(['...', '...']);
    // A span so wide that one pixel of the arrow covers the whole picture.
    expect(paint(3, 2, [{ kind: 'element', name: 'arrow', x: 1, y: 1, ramp: WHITE, span: 4000 }])).toEqual(['111', '111']);
    const gaps = noGaps();
    expect(paint(7, 6, [{ kind: 'element', name: 'comet', x: 3, y: 3, ramp: WHITE, span: 6 }], gaps)).toEqual(['11..11.', '11..11.', '..55...', '..55...', '11..11.', '11..11.']);
    expect(gaps.elements).toEqual(['comet']);
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

  it('a veil is a disc in an ordered dither: its level of every 16 pixels, in a pattern fixed to the picture', () => {
    const veil = (level: number, x = 4, y = 4): SpaceItem => ({ kind: 'veil', x, y, r: 60, colour: WHITE, level });
    const count = (lines: readonly string[]): number => lines.join('').split('1').length - 1;
    expect(paint(8, 8, [veil(0)])).toEqual(Array.from({ length: 8 }, () => '........'));
    expect(paint(8, 8, [veil(16)])).toEqual(Array.from({ length: 8 }, () => '11111111'));
    expect(paint(8, 4, [veil(1)])).toEqual(['1...1...', '........', '........', '........']);
    expect(paint(8, 4, [veil(4)])).toEqual(['1.1.1.1.', '........', '1.1.1.1.', '........']);
    expect(paint(8, 4, [veil(8)])).toEqual(['1.1.1.1.', '.1.1.1.1', '1.1.1.1.', '.1.1.1.1']);
    for (let level = 0; level <= 16; level++) {
      expect(count(paint(8, 8, [veil(level)])), `level ${level}`).toBe(level * 4);
      // A higher level keeps every pixel of the lower ones, and moving the veil does not move its pattern.
      if (level > 0) expect(paint(8, 8, [veil(level - 1), veil(level)])).toEqual(paint(8, 8, [veil(level)]));
      expect(paint(8, 8, [veil(level, 5, 7)])).toEqual(paint(8, 8, [veil(level)]));
    }
    // The rank of a pixel says at which level it joins: every rank from 0 to 15 once in each 4 by 4 block.
    for (let level = 1; level <= 16; level++) {
      const lines = paint(8, 8, [veil(level)]);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) expect(lines[y]![x] === '1', `${x},${y} at ${level}`).toBe(ditherRank(x, y) < level);
    }
    expect(Array.from({ length: 16 }, (_, i) => ditherRank(i & 3, i >> 2)).sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(ditherRank(-3, 6)).toBe(ditherRank(1, 2));
    // Its edge is the disc's edge.
    expect(paint(7, 7, [{ kind: 'veil', x: 3, y: 3, r: 3, colour: WHITE, level: 16 }])).toEqual(paint(7, 7, [{ kind: 'disc', x: 3, y: 3, r: 3, bands: [WHITE] }]));
    expect(paint(7, 7, [{ kind: 'veil', x: 3, y: 3, r: 3, colour: RED, level: 8 }])).toEqual([
      '..3.3..',
      '.3.3.3.',
      '3.3.3.3',
      '.3.3.3.',
      '3.3.3.3',
      '.3.3.3.',
      '..3.3..',
    ]);
  });

  it('a veil with an inner radius is the band outside that disc; with a clip only what lies inside the clip', () => {
    expect(paint(7, 7, [{ kind: 'veil', x: 3, y: 3, r: 3, inner: 1, colour: WHITE, level: 16 }])).toEqual([
      '..111..',
      '.11111.',
      '11...11',
      '11...11',
      '11...11',
      '.11111.',
      '..111..',
    ]);
    // The band and the disc it leaves out make the whole disc, with no pixel painted twice.
    for (const [r, inner] of [[9, 4], [6, 6], [12, 0]] as const) {
      const band = paint(25, 25, [{ kind: 'veil', x: 12, y: 12, r, inner, colour: WHITE, level: 16 }]);
      const hole = paint(25, 25, [{ kind: 'disc', x: 12, y: 12, r: inner, bands: [RED] }]);
      const whole = paint(25, 25, [{ kind: 'disc', x: 12, y: 12, r, bands: [WHITE] }]);
      for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
        expect((band[y]![x] === '1' ? 1 : 0) + (hole[y]![x] === '3' ? 1 : 0), `${r},${inner} at ${x},${y}`).toBe(whole[y]![x] === '1' ? 1 : 0);
      }
    }
    expect(paint(7, 7, [{ kind: 'veil', x: 5, y: 3, r: 3, colour: WHITE, level: 16, clip: { x: 3, y: 3, r: 2 } }])).toEqual([
      '.......',
      '...11..',
      '..1111.',
      '..1111.',
      '..1111.',
      '...11..',
      '.......',
    ]);
    // It is painted over what lies under it and leaves the rest showing.
    expect(paint(3, 3, [{ kind: 'disc', x: 1, y: 1, r: 1, bands: [RED] }, { kind: 'veil', x: 1, y: 1, r: 9, colour: 0x000001, level: 8 }])).toEqual(['.3.', '3.3', '.3.']);
    expect(paint(2, 2, [{ kind: 'veil', x: 0, y: 0, r: MAX_RADIUS + 1, colour: WHITE, level: 16 }, { kind: 'veil', x: 0, y: 0, r: -1, colour: WHITE, level: 16 }])).toEqual(['..', '..']);
    expect(paint(3, 1, [{ kind: 'veil', x: 1 - MAX_RADIUS, y: 0, r: MAX_RADIUS, colour: WHITE, level: 16 }])).toEqual(['11.']);
  });

  it('a veil that is a light leaves every pixel already brighter than it, and one as bright; a plain veil covers them', () => {
    const under: SpaceItem[] = [{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'dot', x: 1, y: 0, colour: 0x808080 }, { kind: 'dot', x: 2, y: 0, colour: 0x800000 }, { kind: 'dot', x: 3, y: 0, colour: 0x000080 }];
    const veil = (colour: number, light: boolean): SpaceItem => ({ kind: 'veil', x: 0, y: 0, r: 9, colour, level: 16, ...(light ? { light: true } : {}) });
    expect(paint(5, 1, under)).toEqual(['1246.']);
    expect(paint(5, 1, [...under, veil(0x808080, true)])).toEqual(['12222']);
    expect(paint(5, 1, [...under, veil(0x808080, false)])).toEqual(['22222']);
    // Red is brighter to the eye than blue of the same strength: a dark red light is laid over dark blue, not the other way.
    expect(paint(5, 1, [...under, veil(0x800000, true)])).toEqual(['12444']);
    expect(paint(5, 1, [...under, veil(0x000080, true)])).toEqual(['12466']);
    expect(paint(5, 1, [...under, veil(0x000001, true)])).toEqual(['1246.']);
  });

  const SCENE: readonly SpaceItem[] = [
    { kind: 'disc', x: 20, y: 18, r: 6, bands: [RED, BLUE, WHITE] },
    { kind: 'ring', x: 20, y: 18, r: 9, colour: WHITE },
    { kind: 'element', name: 'arrow', x: 12, y: 30, ramp: RED, flip: true },
    { kind: 'element', name: 'comet', x: 30, y: 30, ramp: WHITE },
    { kind: 'dot', x: 11, y: 11, colour: BLUE },
  ];
  const VEILED: readonly SpaceItem[] = [...SCENE, { kind: 'veil', x: 22, y: 20, r: 12, inner: 3, colour: WHITE, level: 5, clip: { x: 20, y: 18, r: 10 } }];

  it('the same items give the same picture hash twice', () => {
    const first = hashBuffer(paintSpace(40, 40, SCENE, SHEET, noGaps()));
    expect(hashBuffer(paintSpace(40, 40, SCENE.map((item) => ({ ...item })), SHEET, noGaps()))).toBe(first);
    expect(hashBuffer(paintSpace(40, 40, SCENE.slice(1), SHEET, noGaps()))).not.toBe(first);
    const veiled = hashBuffer(paintSpace(40, 40, VEILED, SHEET, noGaps()));
    expect(veiled).not.toBe(first);
    expect(hashBuffer(paintSpace(40, 40, VEILED.map((item) => ({ ...item })), SHEET, noGaps()))).toBe(veiled);
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
