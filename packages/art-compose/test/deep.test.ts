import { describe, expect, it } from 'vitest';
import { colourTable, parseCatalogueText, PIXEL_CHARS, SKIN_NAMES, THEME_COLOURS, type LayerName, type PartFrame, type PatternName } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';
import { applyFinish, blit, compose, createBuffer, finish, paintMarks, paintSkin, rimPixels, showColours, SKIN_TABLE, toAscii, type PixelBuffer } from '@cf/art-compose';

// Deep (25 to 28, written p to s): the hide's own colour, much darker (a mask, a socket, a crease). Lit and shaded
// inside its own ramp; never marked, skinned or given the rarity finish; shown as the primary ramp at 55 hundredths.

/** Rows of pixel characters ('.' is 0) as one row-major array. */
const grid = (rows: readonly string[]): Uint8Array => Uint8Array.from(rows.join('').split('').map((c) => PIXEL_CHARS.indexOf(c)));
const frameOf = (rows: readonly string[], layers: Partial<Record<LayerName, readonly string[]>> = {}): PartFrame => {
  const out: Partial<Record<LayerName, Uint8Array>> = {};
  for (const [name, l] of Object.entries(layers)) out[name as LayerName] = grid(l as readonly string[]);
  return { w: (rows[0] as string).length, h: rows.length, pixels: grid(rows), anchor: [0, 0], attach: {}, layers: out };
};
const rowsOf = (frame: PartFrame, pixels: Uint8Array | null): string[] => {
  if (pixels === null) throw new Error('painted nothing');
  return Array.from({ length: frame.h }, (_, y) => Array.from(pixels.subarray(y * frame.w, (y + 1) * frame.w), (v) => PIXEL_CHARS[v] ?? '?').join(''));
};
/** The w x h window of the text form whose top-left corner is (x, y). */
const crop = (b: PixelBuffer, x: number, y: number, w: number, h: number): string[] =>
  toAscii(b).split('\n').slice(y, y + h).map((line) => line.slice(x, x + w));
const ZERO: readonly number[] = new Array(15).fill(0);
const MARKED: readonly Exclude<PatternName, 'plain'>[] = ['striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted'];
const isDeep = (v: number): boolean => v >= 25 && v <= 28;

describe('finish: deep', () => {
  it('lights and shades a deep block inside the deep ramp, exactly as a hide block', () => {
    const finished = (c: string): string[] => {
      const b = createBuffer('small');
      blit(b, frameOf([c.repeat(3), c.repeat(3), c.repeat(3)]), 10, 10);
      finish(b);
      return crop(b, 9, 9, 5, 5);
    };
    // 26 ('q'): the top-left pixel one lighter, the bottom row one darker, the rest as drawn; the outline round it.
    expect(finished('q')).toEqual(['.ggg.', 'grqqg', 'gqqqg', 'gpppg', '.ggg.']);
    expect(finished('2')).toEqual(['.ggg.', 'g322g', 'g222g', 'g111g', '.ggg.']);
  });

  it('holds deep at the ends of its ramp: the lightest is never lit past 28, the darkest never shaded below 25', () => {
    // Each column is two pixels tall: the top pixel is lit only, the bottom pixel shaded only.
    const b = createBuffer('small');
    const tops = [25, 26, 27, 28];
    tops.forEach((v, i) => blit(b, { w: 1, h: 2, pixels: Uint8Array.from([v, v]), anchor: [0, 0], attach: {} }, 2 + 3 * i, 5));
    finish(b);
    expect(tops.map((_, i) => b.pixels[5 * b.w + 2 + 3 * i])).toEqual([26, 27, 28, 28]);
    expect(tops.map((_, i) => b.pixels[6 * b.w + 2 + 3 * i])).toEqual([25, 25, 26, 27]);
  });

  it('deep beside hide and beside bone is solid: none lights another, and a value above 28 is never changed', () => {
    const b = createBuffer('small');
    blit(b, frameOf(['22qqmm', '22qqmm']), 10, 10);
    // A column of 29 over 30: were they a ramp, the top would be lit and the bottom shaded.
    blit(b, { w: 1, h: 2, pixels: Uint8Array.from([29, 30]), anchor: [0, 0], attach: {} }, 30, 10);
    finish(b);
    // Only the block's own top-left pixel is lit; the deep's top-left pixel has hide to its left, the bone's has deep. The bottom row is shaded.
    expect(crop(b, 10, 10, 6, 2)).toEqual(['32qqmm', '11ppll']);
    expect([b.pixels[10 * b.w + 30], b.pixels[11 * b.w + 30]]).toEqual([29, 30]);
  });
});

describe('marks and skin: deep', () => {
  // Hide on the left, deep on the right; the guide layers cover both.
  const half = frameOf(['2222qqqq', '2222qqqq', '2222qqqq'], { flow: ['12345678', '12345678', '12345678'], spots: ['11112222', '11112222', '11112222'] });

  it('no pattern rule paints a deep pixel, and each paints the hide beside it', () => {
    for (const pattern of MARKED) {
      for (let phase = 0; phase < 15; phase++) {
        const out = rowsOf(half, paintMarks(half, pattern, 2, phase, ZERO));
        expect(out.map((row) => row.slice(4)), `${pattern} ${phase}`).toEqual(['qqqq', 'qqqq', 'qqqq']);
      }
    }
    // Control: on the same frame drawn all in hide, striped does paint the right half.
    const hide = { ...half, pixels: grid(['22222222', '22222222', '22222222']) };
    expect(rowsOf(hide, paintMarks(hide, 'striped', 2, 0, ZERO))[0]!.slice(4)).not.toBe('2222');
    expect(rowsOf(half, paintMarks(half, 'striped', 2, 0, ZERO))[0]!.slice(0, 4)).not.toBe('2222');
  });

  it('a hand-drawn pattern layer never replaces a deep pixel, and may draw deep on hide but not on bone', () => {
    const f = frameOf(['22qqmm'], { striped: ['5s5sps'] });
    expect(rowsOf(f, paintMarks(f, 'striped', 2, 0, ZERO))).toEqual(['5sqqmm']);
  });

  it('no skin rule steps a deep pixel, and each steps the hide beside it', () => {
    const wide = frameOf(new Array<string>(16).fill('222222222222222222222222qqqqqq'));
    const ruled = SKIN_NAMES.filter((s) => SKIN_TABLE[s].mode !== 'none');
    expect(ruled.length).toBe(8);
    for (const skin of ruled) {
      const out = rowsOf(wide, paintSkin(wide, wide.pixels, skin, 'medium', 0));
      expect(out.map((row) => row.slice(24)), skin).toEqual(new Array<string>(16).fill('qqqqqq'));
      expect(out.map((row) => row.slice(0, 24)), skin).not.toEqual(new Array<string>(16).fill('222222222222222222222222'));
    }
  });

  it('a hand-drawn skin layer never replaces a deep pixel, and may draw deep on hide but not on bone', () => {
    const f = frameOf(['22qqmm'], { furred: ['1p1ppl'] });
    expect(rowsOf(f, paintSkin(f, f.pixels, 'furred', 'medium', 0))).toEqual(['1pqqmm']);
  });
});

describe('the rarity finish and the rim: deep', () => {
  it('no finish level changes a deep pixel, and every level above 0 changes the hide beside it', () => {
    for (const level of [1, 2, 3] as const) {
      const b = createBuffer('small');
      for (let i = 0; i < b.pixels.length; i++) b.pixels[i] = (i % b.w) < b.w / 2 ? 2 : 27;
      applyFinish(b, level);
      const left = b.pixels.filter((_, i) => (i % b.w) < b.w / 2);
      const right = b.pixels.filter((_, i) => (i % b.w) >= b.w / 2);
      expect(right.every((v) => v === 27), `level ${level}`).toBe(true);
      expect(left.some((v) => v !== 2), `level ${level}`).toBe(true);
    }
  });

  it('the luminous rim runs along deep as along hide, and stops above 28', () => {
    const rim = (rows: readonly string[]): string[] => {
      const b: PixelBuffer = { w: rows[0]!.length, h: rows.length, pixels: grid(rows) };
      const m = rimPixels(b);
      return Array.from({ length: b.h }, (_, y) => Array.from(m.subarray(y * b.w, (y + 1) * b.w), (v) => (v === 1 ? '#' : '.')).join(''));
    };
    expect(rim(['.gggg.', 'gqqrsg', 'gp22qg', '.gggg.'])).toEqual(['......', '.####.', '.#....', '......']);
    // An eye value in the same place is never rim: the control.
    expect(rim(['.gggg.', 'gddddg', 'gd22dg', '.gggg.'])).toEqual(['......', '......', '......', '......']);
    // Nor is a value above the deep ramp.
    expect(Array.from(rimPixels({ w: 3, h: 1, pixels: Uint8Array.from([28, 29, 30]) }))).toEqual([1, 0, 0]);
  });
});

describe('a composed creature with a deep mask', () => {
  // A torso of hide (2) with a mask of deep (q) on its back, and guide layers over the whole part.
  const TORSO = 'quadruped/torso/sturdy/small/v0';
  const catalogue = parseCatalogueText(`palette
colour 0 000000
colour 1 203040
colour 2 405060
colour 3 607080
colour 4 8090a0
ramp c0 1 2 3 4
ramp c1 4 3 2 1
ramp c0-under 1 2 3 4
ramp iris0 0 0 0 0
outline 0
eye 0
eyeHighlight 0
glow 0

part ${TORSO}
frame rest anchor=0,0
..qqqqqq....
..qqqqqq....
222222222222
222222222222
222222222222
222222222222
layer flow
..123456....
..123456....
123456789abc
123456789abc
123456789abc
123456789abc
layer spots
..111222....
..111222....
111122223333
111122223333
111122223333
111122223333

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0

fallback quadruped ${TORSO}
`);
  const recipeOf = (over: Partial<Recipe> = {}): Recipe => ({
    version: 1, identity: 'test', family: 'quadruped', tier: 'small', scaffoldId: 'quadruped/sturdy/small',
    parts: [{ slot: 'torso', index: 0, partId: TORSO, source: 'own', mark: { offset: 0, rolls: ZERO } }],
    ramps: { primary: 'c0', accent: 'c1', underside: 'c0-under', iris: 'iris0' },
    marking: { pattern: 0, strength: 2, phase: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    legs: 4, eyes: 2, glow: false, gaps: [],
    opacity: 100, airborne: false, theme: null, rim: 0, skin: null,
    ...over,
  });
  const plain = compose(recipeOf(), 'rest', catalogue);

  it('draws the mask in deep, lit and shaded inside the deep ramp', () => {
    expect(plain.gaps).toEqual([]);
    expect(crop(plain.buffer, 9, 9, 14, 8)).toEqual([
      '...gggggg.....',
      '..grqqqqqg....',
      '.ggqqqqqqgggg.',
      'g322222222222g',
      'g222222222222g',
      'g222222222222g',
      'g111111111111g',
      '.gggggggggggg.',
    ]);
  });

  it('takes no mark, no skin and no rarity finish on the mask, whatever the hide takes', () => {
    const mask = plain.buffer.pixels.map((v) => (isDeep(v) ? v : 0));
    expect(mask.filter((v) => v !== 0).length).toBe(12);
    let checked = 0;
    for (let pattern = 0; pattern < 8; pattern++) {
      for (const skin of [null, 0, 1, 2, 3, 4, 5, 6, 8]) {
        for (const level of [0, 3] as const) {
          const out = compose(recipeOf({ marking: { pattern, strength: 2, phase: 3 }, skin }), 'rest', catalogue, level);
          expect(out.gaps, `pattern ${pattern} skin ${skin}`).toEqual([]);
          expect(out.buffer.pixels.map((v) => (isDeep(v) ? v : 0)), `pattern ${pattern} skin ${skin} level ${level}`).toEqual(mask);
          checked++;
        }
      }
    }
    expect(checked).toBe(8 * 9 * 2);
    // Control: the hide does change with a pattern, with a skin and with the finish.
    for (const over of [{ marking: { pattern: 1, strength: 2 as const, phase: 3 } }, { skin: 0 }]) expect(compose(recipeOf(over), 'rest', catalogue).hash).not.toBe(plain.hash);
    expect(compose(recipeOf(), 'rest', catalogue, 3).hash).not.toBe(plain.hash);
  });

  it('shows the mask as the hide\'s own colours at 55 hundredths, and under a theme as the tinted hide at 55 hundredths', () => {
    const at = (colours: Uint32Array, x: number, y: number): number => colours[y * plain.buffer.w + x]!;
    const bare = showColours(plain.buffer, colourTable(catalogue.palette, recipeOf().ramps).table, { colour: 0, percent: 0 });
    // (12,10) is the mask's lit corner (27), (13,10) the mask as drawn (26); (10,12) lit hide (3), (11,12) hide (2).
    // 60 70 80 at 55 hundredths: round(52.8) round(61.6) round(70.4) = 35 3e 46; 40 50 60: round(35.2) 44 round(52.8) = 23 2c 35.
    expect([at(bare, 12, 10), at(bare, 13, 10), at(bare, 10, 12), at(bare, 11, 12)]).toEqual([0x353e46, 0x232c35, 0x607080, 0x405060]);
    const fire = THEME_COLOURS.fire; // 0xff7a4a
    const themed = showColours(plain.buffer, colourTable(catalogue.palette, recipeOf().ramps, fire).table, { colour: fire, percent: 0 });
    // Hide 40 50 60 takes 38 parts of ff 7a 4a: 137, 96, 88. The mask is 55 hundredths of that: round(75.35) round(52.8) round(48.4) = 4b 35 30.
    expect([at(themed, 13, 10), at(themed, 11, 12)]).toEqual([0x4b3530, 0x896058]);
    // Under every theme the mask is darker than the hide beside it, in every channel.
    for (const theme of Object.values(THEME_COLOURS)) {
      const shown = showColours(plain.buffer, colourTable(catalogue.palette, recipeOf().ramps, theme).table, { colour: theme, percent: 0 });
      for (const s of [16, 8, 0]) expect((at(shown, 13, 10) >> s) & 255, theme.toString(16)).toBeLessThan((at(shown, 11, 12) >> s) & 255);
    }
  });
});
