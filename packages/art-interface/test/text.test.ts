import { describe, expect, it } from 'vitest';
import { hashBuffer, toAscii } from '@cf/art-compose';
import { drawText, iconOrStandIn, measureText, parseInterfaceSheet, type Gaps } from '../src/index';

const SHEET = parseInterfaceSheet([
  'interface 1',
  'palette',
  'colour 1 e9edff',
  'ramp ink 1 1 1 1',
  'font display line=7 base=6 gap=1 space=2',
  'glyph U+0041',
  '.....',
  '.111.',
  '1...1',
  '11111',
  '1...1',
  '1...1',
  '',
  'glyph U+0042',
  '....',
  '222.',
  '2..2',
  '222.',
  '2..2',
  '222.',
  '',
  'glyph U+0067',
  '...',
  '...',
  '.33',
  '3.3',
  '.33',
  '..3',
  '33.',
  '',
  'glyph U+FFFD',
  '444',
  '4.4',
  '444',
  '',
  'icon missing size=2',
  '12',
  '34',
  '',
  'icon settings size=2',
  '56',
  '78',
].join('\n'));
const FONT = SHEET.font;
const noGaps = (): Gaps => ({ glyphs: [], icons: [], elements: [] });

describe('measureText', () => {
  it('is the glyph widths plus one gap between neighbours, one line high', () => {
    expect(measureText(FONT, 'A')).toEqual({ w: 5, h: 7 });
    expect(measureText(FONT, 'AB')).toEqual({ w: 10, h: 7 });
    expect(measureText(FONT, 'A B')).toEqual({ w: 13, h: 7 });
    expect(measureText(FONT, '')).toEqual({ w: 0, h: 7 });
  });
  it('measures a character with no glyph as the box', () => {
    expect(measureText(FONT, 'AZ')).toEqual({ w: 9, h: 7 });
  });
});

describe('drawText', () => {
  it('the same text draws the same picture twice', () => {
    const first = drawText(FONT, 'AB g', noGaps());
    const second = drawText(FONT, 'AB g', noGaps());
    expect(hashBuffer(second)).toBe(hashBuffer(first));
    expect(hashBuffer(drawText(FONT, 'AB', noGaps()))).not.toBe(hashBuffer(first));
  });
  it('draws AB from the top of the line box, one gap apart', () => {
    const gaps = noGaps();
    expect(toAscii(drawText(FONT, 'AB', gaps))).toBe([
      '..........',
      '.111..222.',
      '1...1.2..2',
      '11111.222.',
      '1...1.2..2',
      '1...1.222.',
      '..........',
    ].join('\n'));
    expect(gaps).toEqual(noGaps());
  });
  it('a glyph that reaches the last row of the line is drawn whole, and a space leaves its width blank', () => {
    expect(toAscii(drawText(FONT, 'g A', noGaps()))).toBe([
      '............',
      '........111.',
      '.33....1...1',
      '3.3....11111',
      '.33....1...1',
      '..3....1...1',
      '33..........',
    ].join('\n'));
  });
  it('the picture is exactly as large as measureText says', () => {
    for (const text of ['', 'A', 'AB g', 'ZZ']) {
      const drawn = drawText(FONT, text, noGaps());
      expect({ w: drawn.w, h: drawn.h }).toEqual(measureText(FONT, text));
      expect(drawn.pixels.length).toBe(drawn.w * drawn.h);
    }
  });
  it('a character with no glyph draws the box and is counted once per use', () => {
    const gaps = noGaps();
    expect(toAscii(drawText(FONT, 'ZAZ\u{1F600}', gaps))).toBe([
      '444.......444.444',
      '4.4..111..4.4.4.4',
      '444.1...1.444.444',
      '....11111........',
      '....1...1........',
      '....1...1........',
      '.................',
    ].join('\n'));
    expect(gaps).toEqual({ glyphs: [0x5a, 0x5a, 0x1f600], icons: [], elements: [] });
  });
});

describe('iconOrStandIn', () => {
  it('gives the named icon and counts nothing', () => {
    const gaps = noGaps();
    expect(iconOrStandIn(SHEET, 'settings', gaps)).toBe(SHEET.icons.get('settings'));
    expect(gaps).toEqual(noGaps());
  });
  it('a missing icon draws the icon named missing and is counted once per use', () => {
    const gaps = noGaps();
    expect(iconOrStandIn(SHEET, 'rocket', gaps)).toBe(SHEET.icons.get('missing'));
    expect(iconOrStandIn(SHEET, 'rocket', gaps)).toBe(SHEET.icons.get('missing'));
    expect(iconOrStandIn(SHEET, 'toString', gaps)).toBe(SHEET.icons.get('missing'));
    expect(gaps).toEqual({ glyphs: [], icons: ['rocket', 'rocket', 'toString'], elements: [] });
  });
});
