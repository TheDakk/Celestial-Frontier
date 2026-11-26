import { describe, expect, it } from 'vitest';
import {
  colourTable, parseCatalogueText, PIXEL_ACCENT, PIXEL_CHARS, PIXEL_EYE, PIXEL_EYE_HIGHLIGHT, PIXEL_GLOW, PIXEL_OUTLINE,
  PIXEL_PRIMARY, PIXEL_TRANSPARENT, PIXEL_UNDERSIDE, PIXEL_IRIS, PIXEL_BONE, PIXEL_DEEP, IRIS_RAMP_COUNT,
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
  it('has one text character per value 0-28', () => {
    expect(PIXEL_CHARS).toBe('.123456789abcdefghijklmnopqrs');
    expect(PIXEL_BONE).toBe(21);
    expect([PIXEL_CHARS[PIXEL_BONE], PIXEL_CHARS[PIXEL_BONE + 3]]).toEqual(['l', 'o']);
    expect(PIXEL_DEEP).toBe(25);
    expect([PIXEL_CHARS[PIXEL_DEEP], PIXEL_CHARS[PIXEL_DEEP + 3]]).toEqual(['p', 's']);
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
    expect(table).toHaveLength(29);
    expect(table.slice(PIXEL_IRIS, PIXEL_IRIS + 4)).toEqual([0x000040, 0x000041, 0x000042, 0x000022]);
  });
  it('reports an unknown iris ramp with four zeros, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'nope' });
    expect(unknown).toEqual(['nope']);
    expect(table.slice(PIXEL_IRIS, PIXEL_BONE)).toEqual([0, 0, 0, 0]);
    expect(table).toHaveLength(29);
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
      0x000009, 0x00000a, 0x00000a, 0x00000b, // 25-28 deep: the primary ramp at 55 hundredths
    ]);
    expect(unknown).toEqual([]);
  });
  it('reports an unknown ramp name, including an inherited one, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'nope', underside: 'toString', iris: 'ring' });
    expect(unknown).toEqual(['nope', 'toString']);
    expect(table).toHaveLength(29);
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
      0x000009, 0x00000a, 0x00000a, 0x00000b,
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
      expect(table.slice(13, PIXEL_DEEP), t.toString(16)).toEqual(plain.slice(13, PIXEL_DEEP));
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
    expect(plain.table.slice(PIXEL_BONE, PIXEL_DEEP)).toEqual([0x000014, 0x000013, 0x000012, 0x000011]);
    expect(plain.unknown).toEqual([]);
    const own = colourTable(boned, { ...RAMPS, bone: 'civet-bone' });
    expect(own.table.slice(PIXEL_BONE, PIXEL_DEEP)).toEqual([0x000020, 0x000021, 0x000022, 0x000023]);
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
      expect(table.slice(PIXEL_BONE, PIXEL_DEEP), String(tint)).toEqual([0, 0, 0, 0]);
      expect(unknown).toEqual([]);
    }
  });

  it('a named bone ramp the palette lacks is unknown, as any ramp: four zeros, listed, never tinted', () => {
    for (const tint of [undefined, 0xff7a4a]) {
      for (const [pal, name] of [[palette, 'bone'], [boned, 'otter-bone'], [boned, 'toString']] as const) {
        const { table, unknown } = colourTable(pal, { ...RAMPS, bone: name }, tint);
        expect(table.slice(PIXEL_BONE, PIXEL_DEEP), `${name} ${String(tint)}`).toEqual([0, 0, 0, 0]);
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
    expect(table.slice(PIXEL_BONE, PIXEL_DEEP)).toEqual(p.colours.map(mix));
    expect(table.slice(PIXEL_BONE, PIXEL_DEEP)).not.toEqual(plain.slice(PIXEL_BONE, PIXEL_DEEP));
    // The same colours on the primary ramp take the hide's stronger mix: a different result.
    expect(table.slice(PIXEL_BONE, PIXEL_DEEP)).not.toEqual(table.slice(1, 5));
    expect([table[0], ...table.slice(13, PIXEL_BONE)]).toEqual([plain[0], ...plain.slice(13, PIXEL_BONE)]);
  });
});

describe('colourTable: deep', () => {
  const RAMPS = { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' };
  /** round(55c / 100), halves up, in exact whole numbers, for the test only. */
  const dark = (c: number): number => Math.floor((55 * c + 50) / 100);
  /** The hide mix of one channel, round((62a + 38t) / 100), halves up, for the test only. */
  const hide = (a: number, t: number): number => Math.floor((62 * a + 38 * t + 50) / 100);
  const each = (c: number, channel: (v: number, s: number) => number): number => [16, 8, 0].reduce((out, s) => out | (channel((c >> s) & 255, s) << s), 0);
  /** A palette whose primary ramp `body` is the four colours; every other ramp is the same four. */
  const withPrimary = (colours: readonly number[]) => ({ ...palette, colours: [...colours], ramps: { body: [0, 1, 2, 3], spots: [0, 1, 2, 3], belly: [0, 1, 2, 3], ring: [0, 1, 2, 3] } as const });
  const PRIMARIES: readonly (readonly number[])[] = [
    [0x203040, 0x405060, 0x607080, 0x8090a0],
    [0x000000, 0xffffff, 0xff0000, 0x0000ff],
    [0x0a1e32, 0x6e2a5a, 0xc8c0a8, 0xf8f0d8], // 0x0a, 0x1e, 0x32, 0x6e, 0x5a: 55 x c ends in 50, a half that rounds up
    [0x010203, 0x7f8081, 0xfdfeff, 0x646464],
  ];

  it('maps 25-28 to the primary ramp as shown, each channel at 55 hundredths, when there is no tint', () => {
    for (const colours of PRIMARIES) {
      const { table, unknown } = colourTable(withPrimary(colours), RAMPS);
      expect(table).toHaveLength(29);
      expect(table.slice(1, 5)).toEqual(colours);
      expect(table.slice(PIXEL_DEEP), colours.map((c) => c.toString(16)).join(' ')).toEqual(colours.map((c) => each(c, dark)));
      expect(unknown).toEqual([]);
    }
    // By hand: 20 30 40 gives round(17.6) round(26.4) round(35.2) = 12 1a 23; ff gives round(140.25) = 8c; 0a gives round(5.5) = 06.
    expect(colourTable(withPrimary(PRIMARIES[0]!), RAMPS).table[PIXEL_DEEP]).toBe(0x121a23);
    expect(colourTable(withPrimary(PRIMARIES[1]!), RAMPS).table.slice(PIXEL_DEEP)).toEqual([0, 0x8c8c8c, 0x8c0000, 0x00008c]);
    expect(colourTable(withPrimary(PRIMARIES[2]!), RAMPS).table[PIXEL_DEEP]).toBe(0x06111c);
  });

  it('with a tint, deep is 55 hundredths of the tinted primary: the hide as shown, not the palette colour', () => {
    for (const colours of PRIMARIES) {
      for (const tint of [0, 0xffffff, 0xff7a4a, 0x8fd6ff]) {
        const { table } = colourTable(withPrimary(colours), RAMPS, tint);
        const shown = colours.map((c) => each(c, (v, s) => hide(v, (tint >> s) & 255)));
        expect(table.slice(1, 5)).toEqual(shown);
        expect(table.slice(PIXEL_DEEP), `${colours.map((c) => c.toString(16)).join(' ')} tint ${tint.toString(16)}`).toEqual(shown.map((c) => each(c, dark)));
      }
    }
    // By hand: 40 50 60 under fire ff 7a 4a shows 89 60 58 (137 96 88); 55 hundredths of that is round(75.35) round(52.8) round(48.4) = 4b 35 30.
    const fire = colourTable(withPrimary(PRIMARIES[0]!), RAMPS, 0xff7a4a).table;
    expect([fire[2], fire[PIXEL_DEEP + 1]]).toEqual([0x896058, 0x4b3530]);
    // Not 55 hundredths of the plain colour, and not the plain deep tinted.
    expect(fire[PIXEL_DEEP + 1]).not.toBe(colourTable(withPrimary(PRIMARIES[0]!), RAMPS).table[PIXEL_DEEP + 1]);
  });

  it('deep is 55 hundredths, halves up, for every channel value, and for every hide and theme channel pair', () => {
    // The 256 channel values on the four primary entries, in R, G and B at once: untinted, then under each tint channel t.
    let checked = 0;
    for (let t = -1; t < 256; t++) {
      for (let a0 = 0; a0 < 256; a0 += 4) {
        const { table } = colourTable(withPrimary([a0, a0 + 1, a0 + 2, a0 + 3].map((a) => a * 0x010101)), RAMPS, t < 0 ? undefined : t * 0x010101);
        for (let k = 0; k < 4; k++) {
          const want = dark(t < 0 ? a0 + k : hide(a0 + k, t)) * 0x010101;
          if (table[PIXEL_DEEP + k] !== want) throw new Error(`a=${a0 + k} t=${t}: ${table[PIXEL_DEEP + k]!.toString(16)}`);
          checked++;
        }
      }
    }
    expect(checked).toBe(257 * 256);
    // The whole-number reference is the rounded scaling: the ends, halves that round up (55 x 10 = 550, 55 x 30 = 1650), and it is always darker.
    expect([dark(0), dark(1), dark(2), dark(10), dark(30), dark(100), dark(255)]).toEqual([0, 1, 1, 6, 17, 55, 140]);
    for (let c = 2; c < 256; c++) if (!(dark(c) < c)) throw new Error(`not darker at ${c}`);
  });

  it('a primary ramp the palette lacks gives four zeros for deep and lists nothing more, tinted or not', () => {
    for (const tint of [undefined, 0xff7a4a]) {
      for (const name of ['nope', 'toString']) {
        const { table, unknown } = colourTable(palette, { ...RAMPS, primary: name }, tint);
        expect(table.slice(1, 5)).toEqual([0, 0, 0, 0]);
        expect(table.slice(PIXEL_DEEP), `${name} ${String(tint)}`).toEqual([0, 0, 0, 0]);
        expect(unknown).toEqual([name]);
        expect(table).toHaveLength(29);
      }
    }
  });

  it('deep reads the primary ramp alone: no other ramp, colour or bone name moves it, and no palette ramp named deep is read', () => {
    const base = colourTable(palette, RAMPS, 0x8fd6ff).table.slice(PIXEL_DEEP);
    expect(base).toEqual([0x1e2d3b, 0x1e2d3b, 0x1e2d3c, 0x1e2d3c]);
    const others = { ...palette, outline: 1, eye: 2, eyeHighlight: 3, glow: 4, ramps: { ...palette.ramps, bone: [4, 3, 2, 1], deep: [30, 31, 32, 12], 'body-deep': [30, 31, 32, 12] } as const };
    for (const ramps of [RAMPS, { ...RAMPS, accent: 'belly', underside: 'ring', iris: 'spots' }, { ...RAMPS, accent: 'nope' }, { ...RAMPS, bone: 'bone' }, { ...RAMPS, bone: 'nope' }]) {
      expect(colourTable(others, ramps, 0x8fd6ff).table.slice(PIXEL_DEEP), JSON.stringify(ramps)).toEqual(base);
    }
    // Control: another primary ramp does move it.
    expect(colourTable(others, { ...RAMPS, primary: 'spots' }, 0x8fd6ff).table.slice(PIXEL_DEEP)).not.toEqual(base);
  });
});

describe('colourTable: a named eye highlight', () => {
  const RAMPS = { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' };
  const but14 = (table: readonly number[]): number[] => table.filter((_, v) => v !== PIXEL_EYE_HIGHLIGHT);

  it('entry 14 is the palette colour of the index given and every other entry is as without it, with a tint or without', () => {
    for (const tint of [undefined, 0, 0xffffff, 0xff7a4a]) {
      const plain = colourTable(palette, RAMPS, tint);
      expect(plain.table[PIXEL_EYE_HIGHLIGHT]).toBe(0x000042);
      const own = colourTable(palette, { ...RAMPS, eyeHighlight: 13 }, tint);
      expect(own.table[PIXEL_EYE_HIGHLIGHT], String(tint)).toBe(0x000023);
      expect(but14(own.table)).toEqual(but14(plain.table));
      expect(but14(own.table)).toHaveLength(28);
      expect(own.unknown).toEqual(plain.unknown);
    }
  });

  it('without one, or with the palette\'s own index, the table is today\'s', () => {
    const today = colourTable(palette, RAMPS);
    expect(colourTable(palette, { ...RAMPS, eyeHighlight: undefined })).toEqual(today);
    expect(colourTable(palette, { ...RAMPS, eyeHighlight: palette.eyeHighlight })).toEqual(today);
    // Index 0 is a colour like any other, not "none".
    expect(colourTable(palette, { ...RAMPS, eyeHighlight: 0 }).table[PIXEL_EYE_HIGHLIGHT]).toBe(0x000010);
  });

  it('an index the palette does not hold gives 0, as every colour index does, and lists nothing', () => {
    const { table, unknown } = colourTable(palette, { ...RAMPS, eyeHighlight: 9999 });
    expect(table[PIXEL_EYE_HIGHLIGHT]).toBe(0);
    expect(unknown).toEqual([]);
  });
});
