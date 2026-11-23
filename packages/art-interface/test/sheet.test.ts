import { describe, expect, it } from 'vitest';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { ELEMENT_NAMES, ICON_NAMES, parseInterfaceSheet, REQUIRED_GLYPHS, REQUIRED_RAMPS } from '../src/index';

/** The smallest sheet the parser accepts, as lines; tests change one thing in it. */
const SMALL = [
  'interface 1',            // 1
  '# a comment',            // 2
  'palette',                // 3
  'colour 0 101018',        // 4
  'colour 1 e9edff',        // 5
  'ramp ink 1 1 1 0',       // 6
  'font display line=6 base=5 gap=1 space=3', // 7
  'glyph U+0041',           // 8
  '.11.',                   // 9
  '1..1',                   // 10
  '1111',                   // 11
  '1..1',                   // 12
  '',                       // 13
  'glyph U+FFFD',           // 14
  '111',                    // 15
  '1.1',                    // 16
  '111',                    // 17
  '',                       // 18
  'icon missing size=3',    // 19
  '5.5',                    // 20
  '.6.',                    // 21
  '7.8',                    // 22
  '',                       // 23
  'element star/small anchor=1,1', // 24
  '.1.',                    // 25
  '121',                    // 26
  '.1.',                    // 27
];
const sheetOf = (lines: readonly string[]): string => lines.join('\n');
/** SMALL with line `n` (counted from 1) replaced by `text`. */
const withLine = (n: number, text: string): string => sheetOf(SMALL.map((l, i) => (i === n - 1 ? text : l)));
/** SMALL with `extra` put after line `n`. */
const withAfter = (n: number, ...extra: string[]): string => sheetOf([...SMALL.slice(0, n), ...extra, ...SMALL.slice(n)]);

describe('parseInterfaceSheet', () => {
  it('reads the palette, the font, its glyphs, the icons and the elements', () => {
    const sheet = parseInterfaceSheet(sheetOf(SMALL));
    expect(sheet.version).toBe(1);
    expect(sheet.palette.colours).toEqual([0x101018, 0xe9edff]);
    expect({ ...sheet.palette.ramps }).toEqual({ ink: [1, 1, 1, 0] });
    const { glyphs, ...metrics } = sheet.font;
    expect(metrics).toEqual({ line: 6, base: 5, gap: 1, space: 3 });
    expect([...glyphs.keys()].sort((a, b) => a - b)).toEqual([0x20, 0x41, 0xfffd]);
    expect(glyphs.get(0x41)).toEqual({ w: 4, h: 4, pixels: Uint8Array.from([0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1]) });
    expect([...sheet.icons.keys()]).toEqual(['missing']);
    expect(sheet.icons.get('missing')).toEqual({ w: 3, h: 3, pixels: Uint8Array.from([5, 0, 5, 0, 6, 0, 7, 0, 8]), anchor: [0, 0] });
    expect([...sheet.elements.keys()]).toEqual(['star/small']);
    expect(sheet.elements.get('star/small')).toEqual({ w: 3, h: 3, pixels: Uint8Array.from([0, 1, 0, 1, 2, 1, 0, 1, 0]), anchor: [1, 1] });
  });
  it('the space is a blank glyph as wide as the font line says, one row high', () => {
    const sheet = parseInterfaceSheet(sheetOf(SMALL));
    expect(sheet.font.glyphs.get(0x20)).toEqual({ w: 3, h: 1, pixels: new Uint8Array(3) });
  });
  it('line endings with a carriage return and a final blank line change nothing', () => {
    expect(parseInterfaceSheet(SMALL.join('\r\n') + '\r\n\r\n')).toEqual(parseInterfaceSheet(sheetOf(SMALL)));
  });
  it('a ragged row, an unknown pixel character and a glyph taller than the line are each refused with their line number', () => {
    expect(() => parseInterfaceSheet(withLine(10, '1..'))).toThrow(/^line 10: row width 3 differs from 4$/);
    expect(() => parseInterfaceSheet(withLine(26, '1x1'))).toThrow(/^line 26: unknown pixel character 'x'$/);
    expect(() => parseInterfaceSheet(withAfter(12, '1..1', '1..1', '1..1'))).toThrow(/^line 15: glyph U\+0041 is taller than the line \(6\)$/);
  });
  it('a colour and a ramp may name any colour a map picture can hold in its one byte a pixel: up to 255', () => {
    const sheet = parseInterfaceSheet(withAfter(6, 'colour 255 123456', 'ramp far 255 255 255 255'));
    expect(sheet.palette.colours[255]).toBe(0x123456);
    expect(sheet.palette.ramps['far']).toEqual([255, 255, 255, 255]);
  });
  it('an element may name its own ramps, up to five, for its values in fours; tint is the ramp its place on the map gives it', () => {
    const sheet = parseInterfaceSheet(withAfter(27, '', 'element nebula anchor=0,0 ramps=ink,tint,ink,ink,ink', '159dh', '48cgk'));
    expect(sheet.elements.get('nebula')).toEqual({ w: 5, h: 2, pixels: Uint8Array.from([1, 5, 9, 13, 17, 4, 8, 12, 16, 20]), anchor: [0, 0], ramps: ['ink', 'tint', 'ink', 'ink', 'ink'] });
    // A ramp may be declared after the element that names it.
    expect(parseInterfaceSheet(sheetOf([...SMALL.slice(0, 2), ...SMALL.slice(6), '', 'element nebula anchor=0,0 ramps=late', '4', '', 'palette', 'colour 0 101018', 'colour 1 e9edff', 'ramp ink 1 1 1 0', 'ramp late 1 1 1 1']))
      .elements.get('nebula')?.ramps).toEqual(['late']);
    expect(sheet.elements.get('star/small')).not.toHaveProperty('ramps');
  });
  it.each([
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=ink,rose', '1'), 'line 29: element nebula names the ramp rose, which is not defined'],
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=ink,ink,ink,ink,ink,ink', '1'), 'line 29: an element names one to five ramps'],
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=', '1'), 'line 29: bad name '],
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=ink,Ink', '1'), 'line 29: bad name Ink'],
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=ink', '15'), "line 30: pixel value '5' is above 4"],
    [withAfter(27, '', 'element nebula anchor=0,0 ramps=ink,ink,ink,ink,ink', '1l'), "line 30: pixel value 'l' is above 20"],
    [withAfter(6, 'ramp tint 1 1 1 1'), "line 7: the ramp name tint is kept for an element's tint"],
    [withAfter(6, 'colour 256 ffffff'), 'line 7: bad colour index 256'],
    [withAfter(6, 'colour 16777216 ffffff'), 'line 7: bad colour index 16777216'],
    [withAfter(6, 'colour -1 ffffff'), 'line 7: bad colour index -1'],
    [withAfter(6, 'ramp far 1 1 1 256'), 'line 7: bad colour index 256'],
    [withAfter(6, 'ramp far 1 1 1 -1'), 'line 7: bad colour index -1'],
    [withLine(1, 'interface 2'), 'line 1: expected interface 1'],
    [sheetOf(SMALL.slice(2)), 'line 1: expected interface 1'],
    [withLine(9, '.19.'), "line 9: pixel value '9' is above 8"],
    [withLine(9, '.15.'), "line 9: glyph value '5' is above 4"],
    [withAfter(2, '.1.'), 'line 3: pixel row outside a drawing'],
    [withAfter(2, 'sprite a'), "line 3: unknown directive 'sprite'"],
    [withLine(5, 'colour 1 e9edf'), 'line 5: bad colour'],
    [withLine(5, 'colour 0 e9edff'), 'line 5: duplicate colour 0'],
    [withLine(6, 'ramp ink 1 1 1 2'), 'line 6: ramp ink uses colour 2, which is not defined'],
    [withAfter(6, 'ramp ink 1 1 1 1'), 'line 7: duplicate ramp ink'],
    [withAfter(6, 'outline 1'), "line 7: unknown directive 'outline'"],
    [sheetOf([...SMALL.slice(0, 2), ...SMALL.slice(3)]), 'line 3: colour outside a palette'],
    [withLine(7, 'font display line=6 base=7 gap=1 space=3'), 'line 7: bad font base 7'],
    [withLine(7, 'font display line=6 base=5 gap=1'), 'line 7: font needs line, base, gap and space'],
    [withLine(7, 'font body line=6 base=5 gap=1 space=3'), 'line 7: the font is named display'],
    [withAfter(7, 'font display line=6 base=5 gap=1 space=3'), 'line 8: duplicate font'],
    [sheetOf([...SMALL.slice(0, 6), ...SMALL.slice(7)]), 'line 7: glyph before the font'],
    [withLine(8, 'glyph 0041'), 'line 8: bad glyph code point 0041'],
    [withLine(8, 'glyph U+D800'), 'line 8: bad glyph code point U+D800'],
    [withLine(8, 'glyph U+0020'), 'line 8: the space comes from the font line'],
    [withLine(14, 'glyph U+0041'), 'line 14: duplicate glyph U+0041'],
    [withLine(8, 'glyph U+0041\n'), 'line 8: glyph U+0041 has no rows'],
    [withLine(19, 'icon missing size=4'), 'line 19: icon missing is 3 by 3, not 4 by 4'],
    [withLine(19, 'icon missing'), 'line 19: icon needs a size'],
    [withLine(19, 'icon Missing size=3'), 'line 19: bad name Missing'],
    [withAfter(23, 'icon missing size=1', '1', ''), 'line 24: duplicate icon missing'],
    [withLine(24, 'element star/small'), 'line 24: element needs an anchor'],
    [withLine(24, 'element star//small anchor=1,1'), 'line 24: bad name star//small'],
    [withLine(24, 'element star/small anchor=1'), 'line 24: expected x,y'],
    [withAfter(27, '', 'element star/small anchor=0,0', '1'), 'line 29: duplicate element star/small'],
    [sheetOf([...SMALL.slice(0, 13), ...SMALL.slice(18)]), 'line 22: no glyph U+FFFD'],
    [sheetOf([...SMALL.slice(0, 18), ...SMALL.slice(23)]), 'line 22: no icon named missing'],
    [sheetOf(SMALL.slice(0, 6)), 'line 6: no font'],
  ])('refuses a faulty sheet (%#)', (text, message) => {
    expect(() => parseInterfaceSheet(text)).toThrow(new Error(message));
  });
});

describe('the placeholder sheet', () => {
  const sheet = parseInterfaceSheet(testInterfaceSheetText());
  it('the placeholder sheet has a glyph for every required code point and a drawing for every icon name', () => {
    expect(REQUIRED_GLYPHS.filter((cp) => !sheet.font.glyphs.has(cp))).toEqual([]);
    expect(ICON_NAMES.filter((name) => !sheet.icons.has(name))).toEqual([]);
    expect(ELEMENT_NAMES.filter((name) => !sheet.elements.has(name))).toEqual([]);
    expect(REQUIRED_RAMPS.filter((name) => !Object.hasOwn(sheet.palette.ramps, name))).toEqual([]);
  });
  it('has a display line of 12 art pixels and icons of 16 by 16', () => {
    expect(sheet.font.line).toBe(12);
    for (const [name, icon] of sheet.icons) expect([name, icon.w, icon.h]).toEqual([name, 16, 16]);
  });
  it('no two required characters share a drawing, and every one but the space draws something', () => {
    const seen = new Map<string, number>();
    for (const cp of REQUIRED_GLYPHS) {
      const g = sheet.font.glyphs.get(cp)!;
      const key = `${g.w}x${g.h}:${g.pixels.join('')}`;
      expect([cp, seen.get(key)]).toEqual([cp, undefined]);
      seen.set(key, cp);
      if (cp !== 0x20) expect(g.pixels.some((v) => v !== 0)).toBe(true);
    }
  });
});

describe('names', () => {
  it('the required glyphs are printable Basic Latin, the em dash and the box, each once', () => {
    expect(REQUIRED_GLYPHS.slice(0, 95)).toEqual(Array.from({ length: 95 }, (_, i) => 0x20 + i));
    expect(REQUIRED_GLYPHS.slice(95)).toEqual([0x2014, 0xfffd]);
    expect(new Set(REQUIRED_GLYPHS).size).toBe(REQUIRED_GLYPHS.length);
  });
  it('the stand-in icon is always a required name, and no name repeats', () => {
    expect(ICON_NAMES).toContain('missing');
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
    expect(new Set(ELEMENT_NAMES).size).toBe(ELEMENT_NAMES.length);
  });
});
