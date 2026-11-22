import { describe, expect, it } from 'vitest';
import {
  colourTable, parseCatalogueText, PIXEL_ACCENT, PIXEL_CHARS, PIXEL_EYE, PIXEL_EYE_HIGHLIGHT, PIXEL_GLOW, PIXEL_OUTLINE,
  PIXEL_PRIMARY, PIXEL_TRANSPARENT, PIXEL_UNDERSIDE, PIXEL_IRIS, PIXEL_BONE, IRIS_RAMP_COUNT,
} from '@cf/art-format';

// Every colour is distinct, so a value mapped to the wrong palette entry shows as a wrong number.
const { palette } = parseCatalogueText(`palette
colour 0 000010
colour 1 000011
colour 2 000012
colour 3 000013
colour 4 000014
colour 10 000020
colour 11 000021
colour 12 000022
colour 13 000023
colour 20 000030
colour 21 000031
colour 22 000032
colour 23 000033
colour 30 000040
colour 31 000041
colour 32 000042
ramp body 1 2 3 4
ramp spots 10 11 12 13
ramp belly 20 21 22 23
ramp ring 30 31 32 12
outline 30
eye 31
eyeHighlight 32
glow 0
`);

describe('pixel values', () => {
  it('names the fixed values from the spec', () => {
    expect([PIXEL_TRANSPARENT, PIXEL_PRIMARY, PIXEL_ACCENT, PIXEL_UNDERSIDE, PIXEL_EYE, PIXEL_EYE_HIGHLIGHT, PIXEL_GLOW, PIXEL_OUTLINE])
      .toEqual([0, 1, 5, 9, 13, 14, 15, 16]);
  });
  it('has one text character per value 0-24', () => {
    expect(PIXEL_CHARS).toBe('.123456789abcdefghijklmno');
    expect(PIXEL_BONE).toBe(21);
    expect([PIXEL_CHARS[PIXEL_BONE], PIXEL_CHARS[PIXEL_BONE + 3]]).toEqual(['l', 'o']);
    expect(PIXEL_CHARS[PIXEL_OUTLINE]).toBe('g');
    expect(PIXEL_CHARS[PIXEL_IRIS]).toBe('h');
    expect(PIXEL_CHARS[PIXEL_IRIS + 3]).toBe('k');
  });
  it('fixes the iris value and the ramp count', () => {
    expect(PIXEL_IRIS).toBe(17);
    expect(IRIS_RAMP_COUNT).toBe(11);
  });
});

describe('colourTable', () => {
  it('maps 17-20 to the iris ramp', () => {
    const { table } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' });
    expect(table).toHaveLength(25);
    expect(table.slice(PIXEL_IRIS, PIXEL_IRIS + 4)).toEqual([0x000040, 0x000041, 0x000042, 0x000022]);
  });
  it('reports an unknown iris ramp with four zeros, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'nope' });
    expect(unknown).toEqual(['nope']);
    expect(table.slice(PIXEL_IRIS, PIXEL_BONE)).toEqual([0, 0, 0, 0]);
    expect(table).toHaveLength(25);
  });
  it('maps values 1-16 to the right palette entries and keeps 0 transparent', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' });
    expect(table).toEqual([
      0,
      0x000011, 0x000012, 0x000013, 0x000014, // 1-4 primary ramp
      0x000020, 0x000021, 0x000022, 0x000023, // 5-8 accent ramp
      0x000030, 0x000031, 0x000032, 0x000033, // 9-12 underside ramp
      0x000041, 0x000042, 0x000010, 0x000040, // 13 eye, 14 highlight, 15 glow, 16 outline
      0x000040, 0x000041, 0x000042, 0x000022, // 17-20 iris ramp
      0, 0, 0, 0,                             // 21-24 bone: this palette has no bone ramp and none was named
    ]);
    expect(unknown).toEqual([]);
  });
  it('reports an unknown ramp name, including an inherited one, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'nope', underside: 'toString', iris: 'ring' });
    expect(unknown).toEqual(['nope', 'toString']);
    expect(table).toHaveLength(25);
    expect(table.slice(PIXEL_ACCENT, PIXEL_EYE)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(table[PIXEL_PRIMARY]).toBe(0x000011);
  });
  it('reports an inherited name even when the ramps record has a prototype', () => {
    const plain = { ...palette, ramps: { body: [1, 2, 3, 4] as const } };
    expect(colourTable(plain, { primary: 'body', accent: 'constructor', underside: 'body', iris: 'body' }).unknown).toEqual(['constructor']);
  });
});

describe('colourTable: the theme tint', () => {
  const RAMPS = { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' };
  /** The original's hide mix (hdart.verbatim.js:205), in floating point, for the test only. */
  const game = (a: number, t: number): number => Math.round(Math.min(255, a * 0.62 + t * 0.38));
  /**
   * The only channel pairs where the renderer's whole-number mix (halves rounded up) differs from the original's float
   * mix. The exact value there is a half (12550 and 14250 hundredths), which the original's floats land just below
   * (125.49999999999999, 142.49999999999997), because 0.62 and 0.38 are not exact in floating point: that is float
   * noise, not a rule. The difference is one step in 255 on one channel; the renderer's rule is the same result on every
   * device from whole-number maths, so the noise is not copied.
   */
  const KNOWN = [[228, 3, 143], [192, 17, 126]]; // [a, t, renderer's value], in the test's order (by t)

  it('the tint equals the game\'s mix for every channel pair, except the two known float-noise pairs', () => {
    // For each tint channel t, put the 256 hide channels a on the twelve ramp entries, in R, G and B at once.
    const diffs: number[][] = [];
    for (let t = 0; t < 256; t++) {
      for (let a0 = 0; a0 < 256; a0 += 12) {
        const as = Array.from({ length: 12 }, (_, k) => (a0 + k) & 255);
        const colours = as.map((a) => a * 0x010101);
        const p = { ...palette, colours, ramps: { body: [0, 1, 2, 3], spots: [4, 5, 6, 7], belly: [8, 9, 10, 11], ring: [0, 1, 2, 3] } as const };
        const { table } = colourTable(p, RAMPS, t * 0x010101);
        for (let k = 0; k < 12; k++) {
          const a = as[k]!;
          const v = table[k + 1]!;
          expect(v, `a=${a} t=${t}`).toBe((v & 255) * 0x010101);
          if (a0 + k < 256 && (v & 255) !== game(a, t)) diffs.push([a, t, v & 255]);
        }
      }
    }
    expect(diffs).toEqual(KNOWN);
    for (const [a, t] of KNOWN) expect(game(a!, t!), `${a},${t}`).toBe(KNOWN.find((x) => x[0] === a)![2]! - 1);
  });

  it('the tint mixes each channel apart', () => {
    const p = { ...palette, colours: [0x102030, 0xff0080, 0x00ff00, 0x0000ff], ramps: { body: [0, 1, 2, 3], spots: [0, 1, 2, 3], belly: [0, 1, 2, 3], ring: [0, 1, 2, 3] } as const };
    const t = 0x8fd6ff;
    const { table } = colourTable(p, RAMPS, t);
    const mix = (c: number): number => [16, 8, 0].reduce((out, s) => out | (game((c >> s) & 255, (t >> s) & 255) << s), 0);
    expect(table.slice(1, 5)).toEqual(p.colours.map(mix));
  });

  it('without a tint the table is today\'s', () => {
    const today = colourTable(palette, RAMPS);
    expect(today.table).toEqual([
      0, 0x000011, 0x000012, 0x000013, 0x000014, 0x000020, 0x000021, 0x000022, 0x000023, 0x000030, 0x000031, 0x000032, 0x000033,
      0x000041, 0x000042, 0x000010, 0x000040, 0x000040, 0x000041, 0x000042, 0x000022, 0, 0, 0, 0,
    ]);
    expect(colourTable(palette, RAMPS, undefined)).toEqual(today);
  });

  it('refuses a tint that is not a whole number 0 to 0xffffff, naming it', () => {
    for (const bad of [-1, 0x1000000, 1.5, NaN, Infinity, '0xff7a4a', null]) {
      expect(() => colourTable(palette, RAMPS, bad as number), String(bad)).toThrow(new RangeError(`bad tint ${String(bad)}`));
    }
    for (const good of [0, 0xffffff, 0x8fd6ff]) expect(() => colourTable(palette, RAMPS, good)).not.toThrow();
  });

  it('an unknown ramp stays black (four zeros), tinted or not; the known ramps are tinted', () => {
    const plain = colourTable(palette, { ...RAMPS, accent: 'nosuch' });
    const tinted = colourTable(palette, { ...RAMPS, accent: 'nosuch' }, 0xff7a4a);
    expect(tinted.unknown).toEqual(['nosuch']);
    expect(plain.table.slice(5, 9)).toEqual([0, 0, 0, 0]);
    expect(tinted.table.slice(5, 9)).toEqual([0, 0, 0, 0]);
    expect(tinted.table.slice(1, 5)).toEqual(colourTable(palette, RAMPS, 0xff7a4a).table.slice(1, 5));
    expect(tinted.table.slice(1, 5)).not.toEqual(plain.table.slice(1, 5));
  });

  it('the tint leaves 0 and 13 to 20', () => {
    const plain = colourTable(palette, RAMPS).table;
    for (const t of [0, 0xffffff, 0xff7a4a]) {
      const { table, unknown } = colourTable(palette, RAMPS, t);
      expect(unknown).toEqual([]);
      expect(table[0]).toBe(0);
      expect(table.slice(13), t.toString(16)).toEqual(plain.slice(13));
      expect(table.slice(1, 13), t.toString(16)).not.toEqual(plain.slice(1, 13));
    }
  });
});

describe('colourTable: bone', () => {
  const RAMPS = { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' };
  /** The palette above with two more ramps: `bone` and a species' own `civet-bone`. */
  const boned = { ...palette, ramps: { ...palette.ramps, bone: [4, 3, 2, 1], 'civet-bone': [10, 11, 12, 13] } as const };
  /** round((85a + 15t) / 100), halves up, in exact whole numbers, for the test only. */
  const weak = (a: number, t: number): number => Math.floor((85 * a + 15 * t + 50) / 100);

  it('maps 21-24 to the palette\'s bone ramp, and to a named bone ramp instead', () => {
    const plain = colourTable(boned, RAMPS);
    expect(plain.table.slice(PIXEL_BONE)).toEqual([0x000014, 0x000013, 0x000012, 0x000011]);
    expect(plain.unknown).toEqual([]);
    const own = colourTable(boned, { ...RAMPS, bone: 'civet-bone' });
    expect(own.table.slice(PIXEL_BONE)).toEqual([0x000020, 0x000021, 0x000022, 0x000023]);
    expect(own.unknown).toEqual([]);
    expect(colourTable(boned, { ...RAMPS, bone: 'bone' })).toEqual(plain);
  });

  it('a bone ramp changes no entry 0 to 20, with a tint or without', () => {
    for (const tint of [undefined, 0, 0xffffff, 0xff7a4a]) {
      const without = colourTable(palette, RAMPS, tint);
      const withBone = colourTable(boned, RAMPS, tint);
      expect(withBone.table.slice(0, PIXEL_BONE), String(tint)).toEqual(without.table.slice(0, PIXEL_BONE));
      expect(withBone.table.slice(0, PIXEL_BONE)).toHaveLength(21);
      expect(withBone.unknown).toEqual(without.unknown);
    }
  });

  it('a palette with no bone ramp gives four zeros and lists nothing when none was named, tinted or not', () => {
    for (const tint of [undefined, 0xff7a4a]) {
      const { table, unknown } = colourTable(palette, RAMPS, tint);
      expect(table.slice(PIXEL_BONE), String(tint)).toEqual([0, 0, 0, 0]);
      expect(unknown).toEqual([]);
    }
  });

  it('a named bone ramp the palette lacks is unknown, as any ramp: four zeros, listed, never tinted', () => {
    for (const tint of [undefined, 0xff7a4a]) {
      for (const [pal, name] of [[palette, 'bone'], [boned, 'otter-bone'], [boned, 'toString']] as const) {
        const { table, unknown } = colourTable(pal, { ...RAMPS, bone: name }, tint);
        expect(table.slice(PIXEL_BONE), `${name} ${String(tint)}`).toEqual([0, 0, 0, 0]);
        expect(unknown, name).toEqual([name]);
      }
    }
  });

  it('the bone tint is 85 parts bone and 15 parts theme for every channel pair, halves up', () => {
    // For each tint channel t, put the 256 bone channels a on the four bone entries, in R, G and B at once.
    let checked = 0;
    for (let t = 0; t < 256; t++) {
      for (let a0 = 0; a0 < 256; a0 += 4) {
        const colours = [a0, a0 + 1, a0 + 2, a0 + 3].map((a) => a * 0x010101);
        const p = { ...palette, colours, ramps: { body: [0, 1, 2, 3], spots: [0, 1, 2, 3], belly: [0, 1, 2, 3], ring: [0, 1, 2, 3], bone: [0, 1, 2, 3] } as const };
        const { table } = colourTable(p, RAMPS, t * 0x010101);
        for (let k = 0; k < 4; k++) {
          if (table[PIXEL_BONE + k] !== weak(a0 + k, t) * 0x010101) throw new Error(`a=${a0 + k} t=${t}: ${table[PIXEL_BONE + k]!.toString(16)}`);
          checked++;
        }
      }
    }
    expect(checked).toBe(256 * 256);
    // The whole-number reference is the rounded mix: the ends, a half that rounds up (85 x 10 + 15 x 20 = 1150), and no value passes 255.
    expect([weak(0, 0), weak(255, 255), weak(255, 0), weak(0, 255), weak(10, 20)]).toEqual([0, 255, 217, 38, 12]);
  });

  it('the bone tint mixes each channel apart, is weaker than the hide\'s, and leaves 0 and 13 to 20', () => {
    const p = { ...palette, colours: [0xf0e8d0, 0x102030, 0xff0080, 0x00ff00], ramps: { body: [0, 1, 2, 3], spots: [0, 1, 2, 3], belly: [0, 1, 2, 3], ring: [0, 1, 2, 3], bone: [0, 1, 2, 3] } as const };
    const t = 0x8fd6ff;
    const plain = colourTable(p, RAMPS).table;
    const { table } = colourTable(p, RAMPS, t);
    const mix = (c: number): number => [16, 8, 0].reduce((out, s) => out | (weak((c >> s) & 255, (t >> s) & 255) << s), 0);
    expect(table.slice(PIXEL_BONE)).toEqual(p.colours.map(mix));
    expect(table.slice(PIXEL_BONE)).not.toEqual(plain.slice(PIXEL_BONE));
    // The same colours on the primary ramp take the hide's stronger mix: a different result.
    expect(table.slice(PIXEL_BONE)).not.toEqual(table.slice(1, 5));
    expect([table[0], ...table.slice(13, PIXEL_BONE)]).toEqual([plain[0], ...plain.slice(13, PIXEL_BONE)]);
  });
});
