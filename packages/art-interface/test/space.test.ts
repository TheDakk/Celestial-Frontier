import { describe, expect, it } from 'vitest';
import { hashBuffer, toAscii } from '@cf/art-compose';
import { MAX_RADIUS, ditherRank, fittedWidth, nearestColour, nearestRamp, paintSpace, parseInterfaceSheet, type Gaps, type SpaceItem } from '../src/index';

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

/** The first sheet, its arrow drawn again 8 and 16 wide, each with its own anchor; and a tier of a name with no plain drawing. */
const TIERED = parseInterfaceSheet([
  'interface 1',
  'palette',
  'colour 0 000000', 'colour 1 ffffff', 'colour 2 808080', 'colour 5 0000ff', 'colour 6 000080',
  'ramp ink 1 2 2 2',
  'ramp accent 5 6 6 6',
  'font display line=1 base=1 gap=0 space=1',
  'glyph U+FFFD', '1', '',
  'icon missing size=1', '5', '',
  'element arrow anchor=1,0', '.125', '',
  'element arrow/x16 anchor=4,1', '....1.....2.....', '....12121212125.', '....1.....2.....', '',
  'element arrow/x8 anchor=2,0', '..12125.', '',
  'element comet/x8 anchor=0,0', '11111111',
].join('\n'));
const PLAIN_ONLY = { ...TIERED, elements: new Map([...TIERED.elements].filter(([name]) => name === 'arrow')) };
const paintTiered = (w: number, h: number, items: readonly SpaceItem[], sheet = TIERED, gaps: Gaps = noGaps()) => toAscii(paintSpace(w, h, items, sheet, gaps)).split('\n');
const arrowAt = (span: number | undefined, more: { flip?: boolean } = {}): SpaceItem => ({ kind: 'element', name: 'arrow', x: 20, y: 2, ramp: WHITE, ...(span === undefined ? {} : { span }), ...more });
/** How many times the colour changes along the rows of a picture: what a block-scaled drawing has few of. */
const changes = (rows: readonly string[]): number => rows.reduce((n, row) => n + [...row].filter((c, i) => i > 0 && c !== row[i - 1]).length, 0);

describe('a colour numbered above 255', () => {
  const FAR_TEXT = [
    'interface 1',
    'palette',
    'colour 0 000000', 'colour 1 ffffff', 'colour 5000 ff0000', 'colour 5001 800000', 'colour 70000 0000ff', 'colour 70001 00ff00',
    'ramp ink 1 1 1 1',
    'ramp far 5000 5001 70000 70001',
    'font display line=1 base=1 gap=0 space=1',
    'glyph U+FFFD', '1', '',
    'icon missing size=1', '1', '',
    'element flag anchor=0,0 ramps=far', '1234',
  ].join('\n');
  const FAR = parseInterfaceSheet(FAR_TEXT);
  const rowOf = (items: readonly SpaceItem[]): number[] => Array.from(paintSpace(4, 1, items, FAR, noGaps()).pixels);

  it('is drawn as itself: a ramp naming colour 5000 draws 5000, and one past two bytes draws as itself too', () => {
    expect(rowOf([{ kind: 'element', name: 'flag', x: 0, y: 0, ramp: WHITE }])).toEqual([5000, 5001, 70000, 70001]);
  });
  it('is found as the nearest colour by a dot, a ring, a disc, a veil and a shade', () => {
    expect(rowOf([{ kind: 'dot', x: 0, y: 0, colour: RED }, { kind: 'ring', x: 1, y: 0, r: 0, colour: BLUE },
      { kind: 'disc', x: 2, y: 0, r: 0, bands: [0x00ff00] }, { kind: 'veil', x: 3, y: 0, r: 0, colour: 0x800000, level: 16 }])).toEqual([5000, 70000, 70001, 5001]);
    // Half of red is nearest the dark red, colour 5001.
    expect(rowOf([{ kind: 'dot', x: 0, y: 0, colour: RED }, { kind: 'shade', x: 0, y: 0, r: 0, share: 8 }])).toEqual([5001, 0, 0, 0]);
  });
  it('a number the sheet leaves out between two it defines is never drawn, though nothing is nearer black than a gap', () => {
    const gapped = parseInterfaceSheet(FAR_TEXT.replace('colour 0 000000', 'colour 0 404040').replace('colour 1 ffffff', 'colour 1 ffffff\ncolour 9 101010'));
    const row = (items: readonly SpaceItem[]): number[] => Array.from(paintSpace(2, 1, items, gapped, noGaps()).pixels);
    expect(nearestColour(gapped, 0x000000)).toBe(9);
    expect(row([{ kind: 'dot', x: 0, y: 0, colour: 0x000000 }, { kind: 'veil', x: 1, y: 0, r: 0, colour: 0x010101, level: 16 }])).toEqual([9, 9]);
    // White shaded to nothing is black: the darkest colour the sheet defines, not a gap.
    expect(row([{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'shade', x: 0, y: 0, r: 0, share: 0 }])).toEqual([9, 0]);
    // A light veil leaves what is brighter than itself and covers what is darker, read by its number.
    expect(row([{ kind: 'dot', x: 0, y: 0, colour: RED }, { kind: 'dot', x: 1, y: 0, colour: 0x101010 }, { kind: 'veil', x: 0, y: 0, r: 1, colour: 0x800000, level: 16, light: true }])).toEqual([5000, 5001]);
  });
});

describe('size tiers', () => {
  const pad = (row: string): string => row.padEnd(40, '.');
  const rows = (...at: string[]): string[] => [...at, ...Array.from({ length: 6 - at.length }, () => '')].map(pad);
  const PLAIN = rows('', '', `${'.'.repeat(20)}125`);
  // A doubled drawing keeps the middle of its anchor block on its place: it starts one pixel up and to the left.
  const PLAIN_TWICE = rows('', `${'.'.repeat(19)}112255`, `${'.'.repeat(19)}112255`);
  const X8 = rows('', '', `${'.'.repeat(20)}12125`);
  const X8_TWICE = rows('', `${'.'.repeat(19)}1122112255`, `${'.'.repeat(19)}1122112255`);
  const X16 = rows('', `${'.'.repeat(20)}1.....2`, `${'.'.repeat(20)}12121212125`, `${'.'.repeat(20)}1.....2`);

  it('the widest drawing no wider than the span is taken, the plain one when none is; then it is scaled in whole steps as ever', () => {
    for (const span of [undefined, 0, 3, 4, 5]) expect(paintTiered(40, 6, [arrowAt(span)]), `${span}`).toEqual(PLAIN);
    // Just under the 8 tier the plain arrow (4 wide) is doubled; from 8 the tier is drawn as it is.
    for (const span of [6, 7]) expect(paintTiered(40, 6, [arrowAt(span)]), `${span}`).toEqual(PLAIN_TWICE);
    for (const span of [8, 9, 11]) expect(paintTiered(40, 6, [arrowAt(span)]), `${span}`).toEqual(X8);
    // Just under the 16 tier the 8 tier is doubled; from 16 the 16 tier is drawn as it is, on its own anchor.
    for (const span of [12, 15]) expect(paintTiered(40, 6, [arrowAt(span)]), `${span}`).toEqual(X8_TWICE);
    for (const span of [16, 17, 23]) expect(paintTiered(40, 6, [arrowAt(span)]), `${span}`).toEqual(X16);
  });

  it('a tier is mirrored about its own anchor column', () => {
    expect(paintTiered(40, 6, [arrowAt(8, { flip: true })])).toEqual(rows('', '', `${'.'.repeat(16)}52121`));
  });

  it('a sheet with tiers draws more detail at a large span than the scaled plain drawing, and the same without a span', () => {
    const wide = [arrowAt(16)];
    expect(paintTiered(40, 6, wide, PLAIN_ONLY)).toEqual(rows(...Array.from({ length: 4 }, () => `${'.'.repeat(18)}111122225555`)));
    expect(changes(paintTiered(40, 6, wide))).toBeGreaterThan(changes(paintTiered(40, 6, wide, PLAIN_ONLY)));
    expect(paintTiered(40, 6, [arrowAt(undefined)])).toEqual(paintTiered(40, 6, [arrowAt(undefined)], PLAIN_ONLY));
  });

  it('a tier of a name the sheet has no plain drawing for is not drawn: the stand-in is, and it is counted', () => {
    const gaps = noGaps();
    expect(paintTiered(3, 1, [{ kind: 'element', name: 'comet', x: 1, y: 0, ramp: WHITE, span: 8 }], TIERED, gaps)).toEqual(['5'.repeat(3)]);
    expect(gaps.elements).toEqual(['comet']);
  });

  it('a tier is asked for by its own name like any drawing', () => {
    expect(paintTiered(40, 6, [{ ...arrowAt(undefined), name: 'arrow/x8' } as SpaceItem])).toEqual(X8);
  });

  it('the same items and sheet give the same picture twice', () => {
    const items = [arrowAt(15), arrowAt(16, { flip: true })];
    expect(hashBuffer(paintSpace(40, 6, items, TIERED, noGaps()))).toBe(hashBuffer(paintSpace(40, 6, items.map((item) => ({ ...item })), TIERED, noGaps())));
  });
});

/** The first sheet's colours, with a planet drawn 5 wide and again 9 wide. */
const PLANETS = parseInterfaceSheet([
  'interface 1',
  'palette',
  'colour 0 000000', 'colour 1 ffffff', 'colour 2 808080', 'colour 3 ff0000', 'colour 4 800000', 'colour 5 0000ff', 'colour 6 000080',
  'ramp ink 1 2 2 2',
  'ramp red 3 4 4 3',
  'ramp accent 5 6 6 6',
  'font display line=1 base=1 gap=0 space=1',
  'glyph U+FFFD', '1', '',
  'icon missing size=1', '5', '',
  'element planet/gas anchor=2,2', '.121.', '15551', '24142', '15551', '.121.', '',
  'element planet/gas/x9 anchor=4,4', '...121...', '.1155511.', '.5141415.', '151414151', '254444452', '151414151', '.5141415.', '.1155511.', '...121...',
].join('\n'));
const paintPlanet = (r: number, bands: readonly number[], element?: string, gaps: Gaps = noGaps()): string[] =>
  toAscii(paintSpace(11, 11, [{ kind: 'disc', x: 5, y: 5, r, bands, ...(element === undefined ? {} : { element }) }], PLANETS, gaps)).split('\n');

describe('a disc that the sheet may draw', () => {
  it('is the element of that name when the sheet has it, in the ramp nearest its middle band; the bands when it has not, and that is no gap', () => {
    const banded = paintPlanet(2, [BLUE, RED, BLUE]);
    expect(banded).toEqual(['...........', '...........', '...........', '....555....', '...55555...', '...33333...', '...33333...', '....555....', '...........', '...........', '...........']);
    expect(paintPlanet(2, [BLUE, RED, BLUE], 'planet/gas')).toEqual(['...........', '...........', '...........', '....343....', '...35553...', '...43334...', '...35553...', '....343....', '...........', '...........', '...........']);
    expect(paintPlanet(2, [BLUE, WHITE, BLUE], 'planet/gas')[5]).toBe('...22122...');
    const gaps = noGaps();
    expect(paintPlanet(2, [BLUE, RED, BLUE], 'planet/ice', gaps)).toEqual(banded);
    expect(gaps.elements).toEqual([]);
  });

  it('is drawn to the width of the disc: a size tier when one fits, in whole steps beyond', () => {
    expect(paintPlanet(4, [RED], 'planet/gas')).toEqual(['...........', '....343....', '..3355533..', '..5333335..', '.353333353.', '.453333354.', '.353333353.', '..5333335..', '..3355533..', '....343....', '...........']);
    // Radius 3 is 7 wide: under the 9 tier, and under one and a half times the 5 wide drawing.
    expect(paintPlanet(3, [RED], 'planet/gas')).toEqual(paintPlanet(2, [RED], 'planet/gas'));
  });

  it('keeps its bands while it is narrower than the smallest drawing', () => {
    expect(paintPlanet(1, [RED], 'planet/gas')).toEqual(paintPlanet(1, [RED]));
    expect(paintPlanet(1, [RED])[5]).toBe('....333....');
  });

  it('fittedWidth is the width an element is drawn at for a span it fits in', () => {
    expect([5, 7, 8, 9, 13, 14, 22, 23].map((span) => fittedWidth(PLANETS, 'planet/gas', span))).toEqual([5, 5, 10, 9, 9, 18, 18, 27]);
    expect(fittedWidth(PLANETS, 'planet/gas', 4)).toBeUndefined();
    expect(fittedWidth(PLANETS, 'planet/ice', 40)).toBeUndefined();
  });
});

describe('nearest colour and ramp', () => {
  it('the nearest palette colour is chosen, and a tie goes to the lower index', () => {
    expect(nearestColour(SHEET, 0xfefefe)).toBe(1);
    expect(nearestColour(SHEET, 0x7a0505)).toBe(4);
    expect(nearestColour(SHEET, 0x000001)).toBe(0);
    // Halfway between colour 0 (000000) and colour 6 (000080) on the blue channel alone.
    expect(nearestColour(SHEET, 0x000040)).toBe(0);
    // Halfway between colour 4 (800000) and colour 3 (ff0000) is not a whole step; 0xc0 is one step nearer ff.
    expect(nearestColour(SHEET, 0xbf0000)).toBe(4);
    expect(nearestColour(SHEET, 0xc00000)).toBe(3);
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

  it('a shade redraws each pixel under it in the palette colour nearest its own at a share of its brightness: solid, no pattern', () => {
    const under: SpaceItem[] = [{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'dot', x: 1, y: 0, colour: RED }, { kind: 'dot', x: 2, y: 0, colour: BLUE }, { kind: 'dot', x: 3, y: 0, colour: 0x800000 }];
    const shade = (share: number): SpaceItem => ({ kind: 'shade', x: 0, y: 0, r: 9, share });
    expect(paint(5, 1, under)).toEqual(['1354.']);
    // Half: white to grey, red to dark red, blue to dark blue. The background stays the background.
    expect(paint(5, 1, [...under, shade(8)])).toEqual(['2464.']);
    // All of it kept changes nothing; a share over the whole brightens, each channel stopping at its top.
    expect(paint(5, 1, [...under, shade(16)])).toEqual(['1354.']);
    expect(paint(5, 1, [...under, shade(32)])).toEqual(['1353.']);
    // A pixel is never shaded away to the background, however dark: it takes the darkest colour that is one.
    expect(paint(5, 1, [...under, shade(1)])).toEqual(['4464.']);
    // Every pixel of a disc under a shade changes alike: there is no pixel left out in a pattern.
    const lit = paint(9, 9, [{ kind: 'disc', x: 4, y: 4, r: 4, bands: [WHITE] }]);
    const dark = paint(9, 9, [{ kind: 'disc', x: 4, y: 4, r: 4, bands: [WHITE] }, { kind: 'shade', x: 4, y: 4, r: 60, share: 8 }]);
    expect(dark).toEqual(lit.map((line) => line.replaceAll('1', '2')));
  });

  it('a shade can draw toward a colour: what it does not keep of a pixel it takes from that colour', () => {
    const under: SpaceItem[] = [{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'dot', x: 1, y: 0, colour: RED }, { kind: 'dot', x: 2, y: 0, colour: BLUE }, { kind: 'dot', x: 3, y: 0, colour: 0x800000 }];
    const night = (share: number): SpaceItem => ({ kind: 'shade', x: 0, y: 0, r: 9, share, toward: 0x000080 });
    // Nothing kept: every pixel is the night's own colour. All kept: nothing changes.
    expect(paint(5, 1, [...under, night(0)])).toEqual(['6666.']);
    expect(paint(5, 1, [...under, night(16)])).toEqual(['1354.']);
    // A quarter kept and three quarters night: in this palette still the night's dark blue.
    expect(paint(5, 1, [...under, night(4)])).toEqual(['6666.']);
    // Half kept: white is a pale blue grey, nearest the grey; red and the night's blue meet nearest dark red.
    expect(paint(5, 1, [...under, night(8)])).toEqual(paint(5, 1, [...under, { kind: 'shade', x: 0, y: 0, r: 9, share: 8 }]).map((line) => line.replace(/^./, '2')));
  });

  it('a shaded colour is matched by a darker colour of its own hue before a grey of its own brightness', () => {
    const sheet = parseInterfaceSheet(['interface 1', 'palette', 'colour 0 000000', 'colour 1 4060ff', 'colour 2 464646', 'colour 3 0a0f32', 'ramp ink 1 2 2 2', 'ramp accent 1 2 2 2',
      'font display line=1 base=1 gap=0 space=1', 'glyph U+FFFD', '1', '', 'icon missing size=1', '1'].join('\n'));
    // Half of the blue is 20307f: by plain distance the grey 464646 is nearer it than the navy 0a0f32.
    const far = (a: number, b: number): number => ((a >> 16) - (b >> 16)) ** 2 + (((a >> 8) & 255) - ((b >> 8) & 255)) ** 2 + ((a & 255) - (b & 255)) ** 2;
    expect(far(0x20307f, 0x464646)).toBeLessThan(far(0x20307f, 0x0a0f32));
    const picture = paintSpace(1, 1, [{ kind: 'dot', x: 0, y: 0, colour: 0x4060ff }, { kind: 'shade', x: 0, y: 0, r: 2, share: 8 }], sheet, noGaps());
    expect([...picture.pixels]).toEqual([3]);
  });

  it('a shade with an inner radius is the band outside that disc; with a clip only what lies inside the clip', () => {
    const globe: SpaceItem = { kind: 'disc', x: 3, y: 3, r: 3, bands: [WHITE] };
    expect(paint(7, 7, [globe, { kind: 'shade', x: 3, y: 3, r: 3, inner: 1, share: 8 }])).toEqual([
      '..222..',
      '.22222.',
      '2211122',
      '2211122',
      '2211122',
      '.22222.',
      '..222..',
    ]);
    // The night of a globe: a disc from one side, kept to the globe.
    expect(paint(7, 7, [globe, { kind: 'shade', x: 7, y: 3, r: 4, share: 8, clip: { x: 3, y: 3, r: 3 } }])).toEqual([
      '..112..',
      '.11222.',
      '1112222',
      '1112222',
      '1112222',
      '.11222.',
      '..112..',
    ]);
    // A band and the disc inside it shade every pixel once: the same as two shades laid side by side.
    const twice = paint(9, 9, [{ kind: 'disc', x: 4, y: 4, r: 4, bands: [RED] }, { kind: 'shade', x: 4, y: 4, r: 9, inner: 2, share: 8 }, { kind: 'shade', x: 4, y: 4, r: 2, share: 8 }]);
    expect(twice).toEqual(paint(9, 9, [{ kind: 'disc', x: 4, y: 4, r: 4, bands: [0x800000] }]));
    expect(paint(2, 2, [{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'shade', x: 0, y: 0, r: MAX_RADIUS + 1, share: 8 }, { kind: 'shade', x: 0, y: 0, r: -1, share: 8 }])).toEqual(['1.', '..']);
  });

  it('a shade with `out` leaves the disc named, wherever that disc is centred: what is shaded is a crescent', () => {
    const globe: SpaceItem = { kind: 'disc', x: 4, y: 3, r: 3, bands: [WHITE] };
    // The night of a globe lit from the left: all of it but a disc of radius 3 about a point two pixels to the left.
    expect(paint(9, 7, [globe, { kind: 'shade', x: 4, y: 3, r: 3, share: 8, out: { x: 2, y: 3, r: 3 } }])).toEqual([
      '...122...',
      '..11122..',
      '.1111122.',
      '.1111122.',
      '.1111122.',
      '..11122..',
      '...122...',
    ]);
    // Without it the whole globe is shaded; a disc that holds the whole globe leaves it all; one of no size leaves nothing.
    const all = paint(9, 7, [globe, { kind: 'shade', x: 4, y: 3, r: 3, share: 8 }]);
    expect(all.join('')).not.toContain('1');
    expect(paint(9, 7, [globe, { kind: 'shade', x: 4, y: 3, r: 3, share: 8, out: { x: 4, y: 3, r: 9 } }]).join('')).not.toContain('2');
    expect(paint(9, 7, [globe, { kind: 'shade', x: 4, y: 3, r: 3, share: 8, out: { x: 4, y: 3, r: -1 } }])).toEqual(all);
  });

  describe('a field', () => {
    const STEPS = [{ at: 40, colour: 0x800000 }, { at: 120, colour: RED }];
    /** A field over a picture `w` wide that rises evenly from 0 at its left edge to `top` at its right. */
    const rising = (w: number, top: number, steps = STEPS): SpaceItem => ({ kind: 'field', cols: 2, rows: 2, values: [0, top, 0, top], u: 0, v: 0, du: 65536 / w, steps });

    it('is solid steps: each pixel takes the last step its value has reached, and none is left out in a pattern', () => {
      // 16 pixels across a rise of 160: the pixel at px holds 10 times px. Dark red from 40, red from 120.
      expect(paint(16, 2, [rising(16, 160)])).toEqual(['....444444443333', '....444444443333']);
      // No step is reached below the first; a field with no step paints nothing.
      expect(paint(16, 1, [rising(16, 30)])).toEqual(['................']);
      expect(paint(16, 1, [rising(16, 160, [])])).toEqual(['................']);
    });

    it('runs evenly between its points, so the edge of a step is a stair across a slope', () => {
      // From 0 at the top left to 200 at the bottom right: the pixel at (px, py) holds 12.5 times px + py.
      const slope: SpaceItem = { kind: 'field', cols: 2, rows: 2, values: [0, 100, 100, 200], u: 0, v: 0, du: 8192, steps: [{ at: 50, colour: WHITE }] };
      expect(paint(8, 8, [slope])).toEqual(['....1111', '...11111', '..111111', '.1111111', '11111111', '11111111', '11111111', '11111111']);
    });

    it('a cell whose points all stand on one step is that step throughout, and joins its neighbour without a seam', () => {
      const flat: SpaceItem = { kind: 'field', cols: 3, rows: 2, values: [0, 160, 160, 0, 160, 160], u: 0, v: 0, du: 8192, steps: STEPS };
      expect(paint(16, 1, [flat])).toEqual(['..44443333333333']);
    });

    it('a light step leaves every pixel as bright as it or brighter; a shadow step fills the background and shades the rest', () => {
      const under: SpaceItem[] = [{ kind: 'dot', x: 0, y: 0, colour: WHITE }, { kind: 'dot', x: 1, y: 0, colour: 0x800000 }, { kind: 'dot', x: 2, y: 0, colour: 0x000080 }, { kind: 'dot', x: 3, y: 0, colour: RED }];
      const all = (step: { colour: number; share?: number }): SpaceItem => ({ kind: 'field', cols: 2, rows: 2, values: [9, 9, 9, 9], u: 0, v: 0, du: 8192, steps: [{ at: 1, ...step }] });
      expect(paint(6, 1, under)).toEqual(['1463..']);
      expect(paint(6, 1, [...under, all({ colour: 0x800000 })])).toEqual(['144344']);
      // A shadow of dark blue at a half: white to grey, the reds to dark red, and the background takes the dark blue.
      expect(paint(6, 1, [...under, all({ colour: 0x000080, share: 8 })])).toEqual(['246466']);
      // The same shadow is the same shade a `shade` item gives, pixel for pixel.
      expect(paint(4, 1, [...under, all({ colour: 0x000080, share: 8 })])).toEqual(paint(4, 1, [...under, { kind: 'shade', x: 0, y: 0, r: 9, share: 8, toward: 0x000080 }]));
    });

    it('a step is matched by a colour of its own hue before a grey of its own brightness, and is never the background', () => {
      const sheet = parseInterfaceSheet(['interface 1', 'palette', 'colour 0 000000', 'colour 1 4060ff', 'colour 2 464646', 'colour 3 0a0f32', 'ramp ink 1 2 2 2', 'ramp accent 1 2 2 2',
        'font display line=1 base=1 gap=0 space=1', 'glyph U+FFFD', '1', '', 'icon missing size=1', '1'].join('\n'));
      const all = (colour: number): SpaceItem => ({ kind: 'field', cols: 2, rows: 2, values: [9, 9, 9, 9], u: 0, v: 0, du: 8192, steps: [{ at: 1, colour }] });
      // 20307f is nearer the grey by plain distance (the shade's own test shows it) and takes the navy; a dot takes the grey.
      expect([...paintSpace(1, 1, [all(0x20307f)], sheet, noGaps()).pixels]).toEqual([3]);
      expect([...paintSpace(1, 1, [{ kind: 'dot', x: 0, y: 0, colour: 0x20307f }], sheet, noGaps()).pixels]).toEqual([2]);
      // A light all but black is nearest the background: it is drawn in the darkest colour that is not.
      expect([...paintSpace(1, 1, [all(0x010101)], sheet, noGaps()).pixels]).toEqual([3]);
    });

    it('is fixed to its grid: a view moved by k pixels shows the same shapes moved by k', () => {
      const values = [0, 30, 200, 90, 10, 160, 40, 220, 120, 20, 80, 250, 60, 140, 0, 180];
      const at = (k: number, l: number): SpaceItem => ({ kind: 'field', cols: 4, rows: 4, values, u: k * 12000, v: l * 12000, du: 12000, steps: STEPS });
      const base = paint(12, 12, [at(0, 0)]);
      expect(new Set(base.join('')).size).toBe(3);
      const moved = paint(12, 12, [at(3, 2)]);
      for (let y = 0; y < 10; y++) expect(moved[y]!.slice(0, 9), `row ${y}`).toBe(base[y + 2]!.slice(3));
    });

    it('leaves what lies off its grid, and is not drawn with fewer than two points either way or a step of nothing', () => {
      // The grid begins twelve pixels in, a cell and a half, and ends four pixels before the right edge.
      expect(paint(24, 1, [{ kind: 'field', cols: 2, rows: 2, values: [200, 200, 200, 200], u: -12 * 8192, v: 0, du: 8192, steps: STEPS }])).toEqual(['............33333333....']);
      expect(paint(2, 24, [{ kind: 'field', cols: 2, rows: 2, values: [200, 200, 200, 200], u: 0, v: -12 * 8192, du: 8192, steps: STEPS }]).map((line) => line[0]).join('')).toBe('............33333333....');
      for (const broken of [{ cols: 1, rows: 2 }, { cols: 2, rows: 1 }, { du: 0 }]) {
        expect(paint(4, 1, [{ kind: 'field', cols: 2, rows: 2, values: [200, 200, 200, 200], u: 0, v: 0, du: 8192, steps: STEPS, ...broken }])).toEqual(['....']);
      }
    });
  });

  it('an element with a clip shows only what lies inside that disc', () => {
    const arrow = (clip?: { x: number; y: number; r: number }): SpaceItem => ({ kind: 'element', name: 'arrow', x: 2, y: 1, ramp: WHITE, ...(clip === undefined ? {} : { clip }) });
    expect(paint(6, 4, [arrow()])).toEqual(['......', '..1...', '..125.', '..1...']);
    expect(paint(6, 4, [arrow({ x: 2, y: 2, r: 1 })])).toEqual(['......', '..1...', '..12..', '..1...']);
    expect(paint(6, 4, [arrow({ x: 9, y: 9, r: 1 })])).toEqual(['......', '......', '......', '......']);
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
      const moved = paintSpace(48, 48, SCENE.map((item) => (item.kind === 'field' ? item : { ...item, x: item.x + kx, y: item.y + ky })), SHEET, noGaps());
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
