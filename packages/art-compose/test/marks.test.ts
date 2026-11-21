import { describe, expect, it } from 'vitest';
import { PATTERN_NAMES, PIXEL_CHARS, type LayerName, type PartFrame, type PatternName } from '@cf/art-format';
import { PATTERN_TABLE, PHASE_SPREAD, STRENGTH_KEEP, paintMarks } from '@cf/art-compose';

/** Rows of pixel characters ('.' is 0) as one row-major array. */
const grid = (rows: readonly string[]): Uint8Array => Uint8Array.from(rows.join('').split('').map((c) => PIXEL_CHARS.indexOf(c)));
const frameOf = (rows: readonly string[], layers: Partial<Record<LayerName, readonly string[]>> = {}): PartFrame => {
  const out: Partial<Record<LayerName, Uint8Array>> = {};
  for (const [name, l] of Object.entries(layers)) out[name as LayerName] = grid(l as readonly string[]);
  return { w: (rows[0] as string).length, h: rows.length, pixels: grid(rows), anchor: [0, 0], attach: {}, layers: out };
};
/** A painted array as rows of pixel characters. */
const rowsOf = (frame: PartFrame, pixels: Uint8Array | null): string[] => {
  if (pixels === null) throw new Error('painted nothing');
  const out: string[] = [];
  for (let y = 0; y < frame.h; y++) out.push(Array.from(pixels.subarray(y * frame.w, (y + 1) * frame.w), (v) => PIXEL_CHARS[v] ?? '?').join(''));
  return out;
};
const ZERO: readonly number[] = new Array(15).fill(0);
const ALL99: readonly number[] = new Array(15).fill(99);
const rollsWith = (...first: number[]): number[] => [...first, ...ZERO].slice(0, 15);
/** Indices whose pixel the painter changed. */
const changed = (frame: PartFrame, pixels: Uint8Array | null): number[] => {
  if (pixels === null) throw new Error('painted nothing');
  const out: number[] = [];
  for (let i = 0; i < pixels.length; i++) if (pixels[i] !== frame.pixels[i]) out.push(i);
  return out;
};
const MARKED: readonly Exclude<PatternName, 'plain'>[] = ['striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted'];

const FLOW15 = '123456789abcdef';
const line = frameOf(['222222222222222'], { flow: [FLOW15] });
const blobs = frameOf(['333333', '333333', '333333'], { spots: ['111.22', '111.22', '111.22'] });

describe('paintMarks: lines', () => {
  it('striped paints two lines in five', () => {
    expect(rowsOf(line, paintMarks(line, 'striped', 2, 0, ZERO))).toEqual(['552225522255222']);
    expect(rowsOf(line, paintMarks(line, 'striped', 2, 3, ZERO))).toEqual(['225522255222552']);
  });

  it('banded paints six lines in fifteen', () => {
    expect(rowsOf(line, paintMarks(line, 'banded', 2, 0, ZERO))).toEqual(['555555222222222']);
  });

  it('the mark is accent 5, or 6 on the lightest shade of any ramp', () => {
    const mark = (host: number): number => {
      const f = frameOf([PIXEL_CHARS[host] as string], { flow: ['1'] });
      return (paintMarks(f, 'striped', 2, 0, ZERO) as Uint8Array)[0] as number;
    };
    expect([mark(4), mark(12), mark(9), mark(1)]).toEqual([6, 6, 5, 5]);
    expect([mark(8), mark(2), mark(7)]).toEqual([6, 5, 5]);
  });
});

describe('paintMarks: spots', () => {
  it('spotted fills the chosen blobs', () => {
    expect(rowsOf(blobs, paintMarks(blobs, 'spotted', 2, 0, rollsWith(54, 55)))).toEqual(['555333', '555333', '555333']);
    expect(rowsOf(blobs, paintMarks(blobs, 'spotted', 2, 0, rollsWith(55, 54)))).toEqual(['333355', '333355', '333355']);
  });

  it('eye-spotted draws a rim and an underside centre', () => {
    expect(rowsOf(blobs, paintMarks(blobs, 'eye-spotted', 2, 0, rollsWith(0, 99)))).toEqual(['555333', '5b5333', '555333']);
  });
});

describe('paintMarks: strength', () => {
  // A 15x3 frame: flow along the length, five 3x3 spots, and a hand-drawn striped layer of eight separate marks.
  const host = ['222222222222222', '333333333333333', '222222222222222'];
  const rich = frameOf(host, {
    flow: [FLOW15, FLOW15, FLOW15],
    spots: ['111222333444555', '111222333444555', '111222333444555'],
  });
  const hand = frameOf(host, { striped: ['1.2.3.4.5.6.7.8', '1.2.3.4.5.6.7.8', '...............'] });
  // 30 fixed roll sets from a small whole-number generator.
  const sets: number[][] = [];
  let seed = 12345;
  for (let s = 0; s < 30; s++) {
    const rolls: number[] = [];
    for (let i = 0; i < 15; i++) { seed = (seed * 1103515245 + 12345) % 2147483648; rolls.push(seed % 100); }
    sets.push(rolls);
  }
  const subset = (a: readonly number[], b: readonly number[]): boolean => a.every((i) => b.includes(i));
  const cases: readonly (readonly [PartFrame, PatternName])[] = [[rich, 'striped'], [rich, 'spotted'], [hand, 'striped']];

  it('hint and clear keep a nested part of full', () => {
    let strictSomewhere = 0;
    for (const [f, p] of cases) {
      for (const rolls of sets) {
        const hint = changed(f, paintMarks(f, p, 0, 4, rolls));
        const clear = changed(f, paintMarks(f, p, 1, 4, rolls));
        const full = changed(f, paintMarks(f, p, 2, 4, rolls));
        expect(subset(hint, clear)).toBe(true);
        expect(subset(clear, full)).toBe(true);
        if (hint.length < clear.length && clear.length < full.length) strictSomewhere++;
      }
    }
    expect(strictSomewhere).toBeGreaterThan(0);
  });

  it('with every roll 99, striped and a hand-drawn layer paint nothing at hint and clear, and at full exactly what every roll 0 paints', () => {
    for (const [f, p] of [[rich, 'striped'], [hand, 'striped']] as const) {
      expect(changed(f, paintMarks(f, p, 0, 0, ALL99))).toEqual([]);
      expect(changed(f, paintMarks(f, p, 1, 0, ALL99))).toEqual([]);
      const full = paintMarks(f, p, 2, 0, ALL99);
      expect(full).toEqual(paintMarks(f, p, 2, 0, ZERO));
      expect(changed(f, full).length).toBeGreaterThan(0);
    }
  });

  it('a hand-drawn mark n, numbered in row order of its first pixel, is kept when rolls[n % 15] is under the strength', () => {
    // Marks: 0 at x0 (rows 0-1), 1 at x2, 2 at x4.
    const f = frameOf(['44444', '44444'], { spotted: ['1.2.3', '1....'] });
    const rolls = rollsWith(0, 50, 32);
    expect(rowsOf(f, paintMarks(f, 'spotted', 0, 0, rolls))).toEqual(['14443', '14444']);
    expect(rowsOf(f, paintMarks(f, 'spotted', 1, 0, rolls))).toEqual(['14243', '14444']);
    // Mark 15 and beyond wrap to rolls[n % 15]: sixteen dots, rolls[0] = 99 drops marks 0 and 15 at clear.
    const sixteen = frameOf(['4'.repeat(31)], { spotted: ['1.'.repeat(15) + '1'] });
    const out = rowsOf(sixteen, paintMarks(sixteen, 'spotted', 1, 0, rollsWith(99)))[0] as string;
    expect(out[0]).toBe('4');
    expect(out[2]).toBe('1');
    expect(out[30]).toBe('4');
  });
});

describe('paintMarks: hand-drawn layers', () => {
  const host = ['22222', '22222'];
  it('a hand-drawn layer wins over the guide layers and is applied as drawn', () => {
    const f = frameOf(host, { flow: ['12345', '12345'], striped: ['9..c.', '.1...'] });
    expect(rowsOf(f, paintMarks(f, 'striped', 2, 0, ZERO))).toEqual(['922c2', '21222']);
  });

  it('a hand-drawn layer for another pattern is ignored', () => {
    const withOther = frameOf(host, { flow: ['12345', '12345'], spotted: ['99999', '99999'] });
    const without = frameOf(host, { flow: ['12345', '12345'] });
    expect(paintMarks(withOther, 'striped', 2, 0, ZERO)).toEqual(paintMarks(without, 'striped', 2, 0, ZERO));
    expect(rowsOf(withOther, paintMarks(withOther, 'striped', 2, 0, ZERO))).toEqual(['55222', '55222']);
  });
});

describe('paintMarks: untuned patterns', () => {
  // 15x6, hosts on every shade of the primary and underside ramps, flow along the length, six 5x3 spots.
  const host = ['123412341234123', '9abc9abc9abc9ab', '432143214321432', 'cba9cba9cba9cba', '234123412341234', 'abc9abc9abc9abc'];
  const f = frameOf(host, {
    flow: [FLOW15, FLOW15, FLOW15, FLOW15, FLOW15, FLOW15],
    spots: ['111112222233333', '111112222233333', '111112222233333', '444445555566666', '444445555566666', '444445555566666'],
  });
  const rolls = rollsWith(10, 90, 30, 70, 20, 60);
  const paint = (p: PatternName, phase = 0, r: readonly number[] = rolls): string => (paintMarks(f, p, 2, phase, r) as Uint8Array).join(',');

  it('mottled, marbled and iridescent each paint something, differ from each other and from striped and spotted, and change with the phase or the rolls', () => {
    const untuned = ['mottled', 'marbled', 'iridescent'] as const;
    const pictures = new Set<string>();
    for (const p of [...untuned, 'striped', 'spotted'] as const) pictures.add(paint(p));
    expect(pictures.size).toBe(5);
    for (const p of untuned) {
      expect(changed(f, paintMarks(f, p, 2, 0, rolls)).length).toBeGreaterThan(0);
      const moved = paint(p, 1) !== paint(p, 0) || paint(p, 0, rollsWith(90, 10, 70, 30, 60, 20)) !== paint(p, 0);
      expect(moved).toBe(true);
    }
  });

  it('iridescent writes only 7 and 8, and only on shades 2 and 3', () => {
    for (const phase of [0, 1, 2]) {
      const out = paintMarks(f, 'iridescent', 2, phase, rolls) as Uint8Array;
      const idx = changed(f, out);
      expect(idx.length).toBeGreaterThan(0);
      for (const i of idx) {
        expect([7, 8]).toContain(out[i]);
        expect([2, 3]).toContain(((f.pixels[i] as number) - 1) % 4);
      }
    }
  });
});

describe('paintMarks: the table', () => {
  it('untuned is true for exactly mottled, marbled and iridescent', () => {
    const untuned = Object.entries(PATTERN_TABLE).filter(([, r]) => r.untuned).map(([n]) => n).sort();
    expect(untuned).toEqual(['iridescent', 'marbled', 'mottled']);
    expect(Object.keys(PATTERN_TABLE).sort()).toEqual([...MARKED].sort());
    expect(PATTERN_NAMES.filter((n) => n !== 'plain').sort()).toEqual([...MARKED].sort());
  });

  it('every period divides 15; every shade and centre value is 0 or 1 to 12', () => {
    for (const rule of Object.values(PATTERN_TABLE)) {
      expect(15 % rule.period).toBe(0);
      for (const v of [...rule.shade, rule.centre]) expect(v >= 0 && v <= 12 && Number.isInteger(v)).toBe(true);
    }
    expect(STRENGTH_KEEP).toEqual([33, 67, 100]);
    expect(PHASE_SPREAD).toBe(3);
  });
});

describe('paintMarks: safety (Review Focus 4)', () => {
  it('never writes where the frame pixel is 0, 13, 14 or 15', () => {
    const f = frameOf(['.def', 'fed.', 'd.fe'], {
      flow: ['1234', '5678', '9abc'], spots: ['1111', '1111', '1111'], striped: ['cccc', 'cccc', 'cccc'],
      spotted: ['cccc', 'cccc', 'cccc'], banded: ['cccc', 'cccc', 'cccc'], mottled: ['cccc', 'cccc', 'cccc'],
      iridescent: ['cccc', 'cccc', 'cccc'], marbled: ['cccc', 'cccc', 'cccc'], 'eye-spotted': ['cccc', 'cccc', 'cccc'],
    });
    const guideOnly = frameOf(['.def', 'fed.', 'd.fe'], { flow: ['1234', '5678', '9abc'], spots: ['1111', '1111', '1111'] });
    for (const p of MARKED) {
      for (const strength of [0, 1, 2] as const) {
        expect(paintMarks(f, p, strength, 0, ZERO)).toEqual(f.pixels);
        expect(paintMarks(guideOnly, p, strength, 0, ZERO)).toEqual(guideOnly.pixels);
      }
    }
  });

  it('beside drawn pixels, the eye, glow and empty pixels are still left as they are', () => {
    const f = frameOf(['2d2e', 'f2.2'], { flow: ['1111', '1111'], spots: ['1111', '1111'] });
    for (const p of MARKED) {
      const out = paintMarks(f, p, 2, 0, ZERO) as Uint8Array;
      expect([out[1], out[3], out[4], out[6]]).toEqual([13, 14, 15, 0]);
    }
  });

  it('returns null when no layer serves the pattern', () => {
    const none = frameOf(['2222']);
    for (const p of MARKED) expect(paintMarks(none, p, 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { flow: ['1234'] }), 'spotted', 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { flow: ['1234'] }), 'eye-spotted', 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { spots: ['1122'] }), 'mottled', 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { spots: ['1122'] }), 'marbled', 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { spots: ['1122'] }), 'striped', 2, 0, ZERO)).toBeNull();
    expect(paintMarks(frameOf(['2222'], { flow: ['1234'] }), 'mottled', 2, 0, ZERO)).toBeNull();
  });

  it('plain paints nothing and needs no layer', () => {
    const f = frameOf(['2222'], { flow: ['1234'] });
    expect(paintMarks(f, 'plain', 2, 0, ZERO)).toEqual(f.pixels);
    expect(paintMarks(frameOf(['2222']), 'plain', 2, 0, ZERO)).toEqual(Uint8Array.from([2, 2, 2, 2]));
  });

  it('never changes the frame it is given, and returns a new array', () => {
    const f = frameOf(['2222', '3333'], { flow: ['1234', '1234'], spots: ['1122', '1122'], striped: ['1...', '....'] });
    const snapshot = (fr: PartFrame): unknown => ({ pixels: Array.from(fr.pixels), layers: Object.fromEntries(Object.entries(fr.layers ?? {}).map(([k, v]) => [k, Array.from(v)])) });
    const before = snapshot(f);
    for (const p of [...MARKED, 'plain'] as const) {
      for (const strength of [0, 1, 2] as const) {
        const out = paintMarks(f, p, strength, 7, ALL99.map((_, i) => i * 6));
        expect(out).not.toBe(f.pixels);
      }
    }
    expect(snapshot(f)).toEqual(before);
  });

  it('gives the same pixels on every call', () => {
    const f = frameOf(['2222', '3333'], { flow: ['1234', '1234'], spots: ['1122', '1122'] });
    for (const p of MARKED) expect(paintMarks(f, p, 1, 5, rollsWith(40, 20))).toEqual(paintMarks(f, p, 1, 5, rollsWith(40, 20)));
  });
});
