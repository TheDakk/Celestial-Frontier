import { describe, expect, it } from 'vitest';
import { kitGrid, kitTable, loneRises, loneRuns, parsePlanetKit, squareMend, thinPixels } from '../src/index';
import { testGasKitText } from './planet-kit-support';

const row = (text: string): Uint8Array => Uint8Array.from(text, (c) => Number(c));
const kitOf = (...grids: string[]): string => ['kit 1 gas', 'table bright ice linen', 'tier 8', ...grids].join('\n');
const SQUARE = ['grid a 8 4', '11112222', '11112222', '33..2222', '33..2222'].join('\n');

describe('a planet kit read from text', () => {
  it('the test kit parses: its tables in the artist\'s order and both tiers\' drawings, none with a thin pixel', () => {
    const kit = parsePlanetKit(testGasKitText());
    expect(kit.type).toBe('gas');
    expect(kitTable(kit, 'bright')).toEqual(['ice', 'linen', 'sail']);
    expect([...kit.tiers.keys()]).toEqual([384, 192]);
    for (const [width, tier] of kit.tiers) {
      expect(tier.size).toBe(20);
      for (const grid of tier.values()) {
        expect(grid.values.length).toBe(grid.w * grid.h);
        expect(grid.thin).toBe(0);
        expect(Math.max(...grid.values)).toBeLessThanOrEqual(16);
      }
      expect(kitGrid(kit, width, 'wide/silk').w).toBe(width);
    }
  });
  it('a grid\'s values are its keys\' places: clear is 0, 1 to 9 then a to g are 1 to 16', () => {
    const kit = parsePlanetKit(kitOf(['grid a 4 2', '..gg', '..gg'].join('\n'), ['grid b 2 2', '9a', '9a'].join('\n')));
    expect([...kitGrid(kit, 8, 'a').values]).toEqual([0, 0, 16, 16, 0, 0, 16, 16]);
    expect([...kitGrid(kit, 8, 'b').values]).toEqual([9, 10, 9, 10]);
    const terran = parsePlanetKit(['kit 1 terran', 'tier 8', 'grid a 2 2', 'aL', 'aL'].join('\n'));
    expect([...kitGrid(terran, 8, 'a').values]).toEqual([1, 36, 1, 36]);
  });
  it('a name drawn twice in a tier is the later drawing, and each tier keeps its own', () => {
    const kit = parsePlanetKit(kitOf('grid a 2 2\n11\n11', 'grid a 2 2\n22\n22', 'tier 4', 'grid a 2 2\n33\n33'));
    expect(kitGrid(kit, 8, 'a').values[0]).toBe(2);
    expect(kitGrid(kit, 4, 'a').values[0]).toBe(3);
  });
  it('refuses, in one line naming the fault: a row short or long, a row missing, a key its type lacks, a grid before a tier, a line of no kind', () => {
    expect(() => parsePlanetKit(kitOf('grid a 4 2\n1111\n111'))).toThrow(/row 2 of the grid a is 3 wide: the grid is 4 by 2/);
    expect(() => parsePlanetKit(kitOf('grid a 4 2\n1111\n11111'))).toThrow(/row 2 of the grid a is 5 wide/);
    expect(() => parsePlanetKit(kitOf('grid a 4 2\n1111'))).toThrow(/row 2 of the grid a is missing/);
    expect(() => parsePlanetKit(kitOf('grid a 4 2\n11hh\n11hh'))).toThrow(/the grid a uses the key "h", which a gas kit does not have/);
    expect(() => parsePlanetKit('kit 1 gas\ngrid a 2 2\n11\n11')).toThrow(/the grid a comes before any tier/);
    expect(() => parsePlanetKit(kitOf('piece a 2 2'))).toThrow(/line 4: not a table, a tier or a grid/);
    expect(() => parsePlanetKit(kitOf('table ')).tables.size).toThrow(/line 4: not a table, a tier or a grid/);
    for (const text of [kitOf('grid a 4 2\n1111\n111'), kitOf('grid a 4 2\n11hh\n11hh')]) {
      let message = '';
      try { parsePlanetKit(text); } catch (error) { message = (error as Error).message; }
      expect(message).not.toBe('');
      expect(message).not.toContain('\n');
    }
    expect(() => kitTable(parsePlanetKit(kitOf(SQUARE)), 'belt')).toThrow(/no table "belt"/);
    expect(() => kitGrid(parsePlanetKit(kitOf(SQUARE)), 8, 'b')).toThrow(/no drawing "b" in tier 8/);
  });
  it('refuses a first line that is not "kit 1" and a type there is, in one line naming it: another version, an unknown type, a name every object has', () => {
    for (const first of ['kit 1 marsh', 'kit 2 gas', 'kit gas', 'kit 1 gas extra', 'set 1 gas', '', 'kit 1 constructor', 'kit 1 toString', 'kit 1 __proto__', 'kit 1 hasOwnProperty', 'kit 1 gas\r']) {
      expect(() => parsePlanetKit([first, 'tier 8', 'grid a 2 2', '11', '11'].join('\n'))).toThrow(/^a kit begins "kit 1" and its type \(gas, terran\), not "/);
    }
    expect(parsePlanetKit('kit 1 gas').type).toBe('gas');
    expect(parsePlanetKit('kit 1 terran').type).toBe('terran');
  });
  it('reads a drawing with a feature one pixel wide or tall and reports its thin pixels: a measure for the artist, no refusal', () => {
    const thin = (text: string, tier = 8): number => kitGrid(parsePlanetKit(['kit 1 gas', `tier ${tier}`, text].join('\n')), tier, 'a').thin;
    expect(thin(SQUARE)).toBe(0);
    // A stripe one pixel wide; a stripe one pixel tall; one lone pixel, which also leaves three beside it in no square.
    expect(thin(['grid a 8 4', '11132222', '11132222', '33..2222', '33..2222'].join('\n'))).toBe(2);
    expect(thin(['grid a 8 4', '11112222', '11113322', '33..2222', '33..2222'].join('\n'))).toBe(4);
    expect(thin(['grid a 8 4', '11112222', '11112242', '33..2222', '33..2222'].join('\n'))).toBe(4);
    expect(thin(['grid a 8 4', '11332222', '11332222', '33..2222', '33..2222'].join('\n'))).toBe(0);
  });
  it('a drawing as wide as its tier wraps: a column pair split by the seam is whole; a narrower drawing does not wrap', () => {
    const seam = ['grid a 8 2', '12222221', '12222221'].join('\n');
    expect(kitGrid(parsePlanetKit(['kit 1 gas', 'tier 8', seam].join('\n')), 8, 'a').thin).toBe(0);
    expect(kitGrid(parsePlanetKit(['kit 1 gas', 'tier 16', seam].join('\n')), 16, 'a').thin).toBe(4);
  });
});

describe('the two-pixel rule on a map', () => {
  it('counts the pixels in no like 2 by 2 square, across the seam when wrapped and never across a pole', () => {
    expect(thinPixels(row('1122'.concat('1122')), 4, 2, true)).toBe(0);
    expect(thinPixels(row('1221'.concat('1221')), 4, 2, true)).toBe(0);
    expect(thinPixels(row('1221'.concat('1221')), 4, 2, false)).toBe(4);
    expect(thinPixels(row('1111'.concat('2222', '1111', '1111')), 4, 4, true)).toBe(8);
    expect(thinPixels(row('1111'), 4, 1, true)).toBe(4);
  });
  it('a pixel alone in its column is counted along columns, as one alone in its row is along rows', () => {
    const map = row('1111'.concat('2222', '1111', '1111'));
    // The second row, and the first, which has only the second beside it.
    expect(loneRises(map, 4, 4)).toBe(8);
    expect(loneRuns(map, 4, 4)).toBe(0);
    expect(loneRises(row('12'.concat('12', '12')), 2, 3)).toBe(0);
    // A pixel at a pole stands alone when the one pixel beside it in its column differs.
    expect(loneRises(row('12'.concat('22', '22')), 2, 3)).toBe(1);
  });
  it('mended, any map has every pixel in a like square: no run of one in any row or column', () => {
    let seed = 7;
    const next = (): number => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8;
    for (const [w, h, most] of [[384, 128, 16], [192, 64, 3], [8, 6, 2], [2, 2, 4]] as const) {
      const values = Uint8Array.from({ length: w * h }, () => 1 + (next() % most));
      const before = values.slice();
      expect(thinPixels(values, w, h, true)).toBeGreaterThan(0);
      const rewritten = squareMend(values, w, h);
      expect(thinPixels(values, w, h, true)).toBe(0);
      expect(loneRuns(values, w, h)).toBe(0);
      expect(loneRises(values, w, h)).toBe(0);
      expect(rewritten).toBeGreaterThanOrEqual(values.reduce((sum, value, i) => sum + (value === before[i] ? 0 : 1), 0));
    }
  });
  it('mending leaves a map that keeps the rule as it is, and paints a tile its most common value, the first when two are as common', () => {
    const good = row('1122'.concat('1122', '3322', '3322'));
    expect(squareMend(good, 4, 4)).toBe(0);
    expect([...good]).toEqual([...row('1122'.concat('1122', '3322', '3322'))]);
    const map = row('1211'.concat('2211', '1111', '1111'));
    squareMend(map, 4, 4);
    expect([...map]).toEqual([...row('2211'.concat('2211', '1111', '1111'))]);
    // Two values as common: the first in reading order wins, whichever it is.
    for (const [before, after] of [['1133'.concat('2233'), '1133'.concat('1133')], ['2233'.concat('1133'), '2233'.concat('2233')], ['1233'.concat('1233'), '1133'.concat('1133')], ['2133'.concat('2133'), '2233'.concat('2233')]] as const) {
      const tie = row(before.replace(/3/g, '4').concat('4444', '4444').replace(/^(..)44(..)44/, '$1' + '44' + '$2' + '44'));
      squareMend(tie, 4, 4);
      expect([...tie.slice(0, 8)].join('')).toBe(after.replace(/3/g, '4'));
    }
    // A map whose only like squares lie across the seam keeps the rule already: nothing is rewritten.
    const seam = row('1221'.concat('1221'));
    expect(squareMend(seam, 4, 2)).toBe(0);
    expect([...seam].join('')).toBe('12211221');
    expect(() => squareMend(new Uint8Array(9), 3, 3)).toThrow(/even number of pixels each way/);
  });
});
