import { describe, expect, it } from 'vitest';
import { PIXEL_CHARS, SKIN_NAMES, type LayerName, type PartFrame, type SkinName } from '@cf/art-format';
import { SKIN_TABLE, paintSkin } from '@cf/art-compose';

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
/** A w by h block of one character. */
const block = (w: number, h: number, c: string): string[] => new Array<string>(h).fill(c.repeat(w));
const PLAIN = frameOf(block(12, 8, '2'));
const RULED: readonly SkinName[] = SKIN_NAMES.filter((s) => SKIN_TABLE[s].mode !== 'none');

describe('paintSkin', () => {
  it('each rule skin changes some pixel, and the eight differ pairwise', () => {
    expect(RULED.length).toBe(8);
    const seen = new Set<string>();
    for (const skin of RULED) {
      const out = paintSkin(PLAIN, PLAIN.pixels, skin);
      expect(out, skin).not.toBeNull();
      expect(Array.from(out!), skin).not.toEqual(Array.from(PLAIN.pixels));
      seen.add(rowsOf(PLAIN, out).join('/'));
    }
    expect(seen.size).toBe(8);
  });

  it('translucent paints nothing and returns null without its layer', () => {
    expect(SKIN_TABLE.translucent.mode).toBe('none');
    expect(paintSkin(PLAIN, PLAIN.pixels, 'translucent')).toBeNull();
    expect(paintSkin(frameOf(block(12, 8, '2'), { scaled: block(12, 8, '3') }), PLAIN.pixels, 'translucent')).toBeNull();
  });

  it('scaled marks every third column and every second row', () => {
    // Cells 3 across and 2 down; every other row of cells moves one column right. Texture pixels step 2 down to 1.
    expect(rowsOf(PLAIN, paintSkin(PLAIN, PLAIN.pixels, 'scaled'))).toEqual([
      '111111111111',
      '122122122122',
      '111111111111',
      '212212212212',
      '111111111111',
      '122122122122',
      '111111111111',
      '212212212212',
    ]);
  });

  it('rows, dots and edge put their texture pixels where the table says', () => {
    // chitinous: the top row of each 3-high cell.
    expect(rowsOf(PLAIN, paintSkin(PLAIN, PLAIN.pixels, 'chitinous'))).toEqual(['111111111111', ...block(12, 2, '2'), '111111111111', ...block(12, 2, '2'), '111111111111', '222222222222']);
    // furred: the top-left pixel of each 2 by 3 cell, every other row of cells one column right.
    expect(rowsOf(PLAIN, paintSkin(PLAIN, PLAIN.pixels, 'furred'))).toEqual(['121212121212', ...block(12, 2, '2'), '212121212121', ...block(12, 2, '2'), '121212121212', '222222222222']);
    // slick: a pixel whose upper neighbour is empty or outside the frame steps one lighter; an eye above is drawn.
    const holed = frameOf(['2222', '2.d2', '2222']);
    expect(rowsOf(holed, paintSkin(holed, holed.pixels, 'slick'))).toEqual(['3333', '2.d2', '2322']);
  });

  it("never leaves a pixel's ramp", () => {
    const hosts = frameOf(['14589c', '14589c', '14589c', '14589c', '14589c', '14589c', '14589c', '14589c']);
    const ramp = (v: number): number => (v - 1) >> 2;
    for (const skin of SKIN_NAMES) {
      // The rule, then a hand-drawn layer holding a value of every ramp.
      const handed = frameOf(block(6, 8, '1'), { [skin]: ['159c15', '26a26a', '37b37b', '48c48c', '159c15', '26a26a', '37b37b', '48c48c'] });
      for (const frame of [hosts, { ...handed, pixels: hosts.pixels }]) {
        const out = paintSkin(frame, frame.pixels, skin);
        if (out === null) continue;
        for (let i = 0; i < out.length; i++) expect(ramp(out[i]!), `${skin} ${i}`).toBe(ramp(frame.pixels[i]!));
      }
    }
    const ones = frameOf(block(12, 8, '1'));
    const fours = frameOf(block(12, 8, '4'));
    for (const skin of RULED) {
      const host = SKIN_TABLE[skin].step === -1 ? ones : fours;
      expect(Array.from(paintSkin(host, host.pixels, skin)!), skin).toEqual(Array.from(host.pixels));
    }
    // Both steps are used, so both clamps above were reached.
    expect(RULED.some((s) => SKIN_TABLE[s].step === -1) && RULED.some((s) => SKIN_TABLE[s].step === 1)).toBe(true);
  });

  it('never writes where the frame is 0, 13, 14, 15 or 17 to 20', () => {
    const rows = ['.def', 'hijk', '.def', 'hijk', '.def', 'hijk', '.def', 'hijk'];
    for (const skin of SKIN_NAMES) {
      // A frame built in code may hold any value in a layer, an eye or iris value among them.
      const layered = ['c', '1', 'd', 'h'].map((c) => frameOf(rows, { [skin]: block(4, 8, c) }));
      for (const frame of [frameOf(rows), ...layered]) {
        const out = paintSkin(frame, frame.pixels, skin);
        if (out !== null) expect(Array.from(out), skin).toEqual(Array.from(frame.pixels));
      }
    }
  });

  it('a hand-drawn skin layer wins and is applied as drawn', () => {
    const f = frameOf(['2222', '2222', '2222'], { scaled: ['3.1.', '....', '.4..'] });
    expect(rowsOf(f, paintSkin(f, f.pixels, 'scaled'))).toEqual(['3212', '2222', '2422']);
    const t = frameOf(['2222', '2.22', '6666'], { translucent: ['1...', '.3..', '...7'] });
    expect(rowsOf(t, paintSkin(t, t.pixels, 'translucent'))).toEqual(['1222', '2.22', '6667']);
  });

  it('a layer for another skin is ignored', () => {
    const bare = frameOf(block(12, 8, '2'));
    const other = frameOf(block(12, 8, '2'), { furred: block(12, 8, '4'), striped: block(12, 8, '6'), flow: block(12, 8, '1') });
    for (const skin of RULED) {
      if (skin === 'furred') continue;
      expect(Array.from(paintSkin(other, other.pixels, skin)!), skin).toEqual(Array.from(paintSkin(bare, bare.pixels, skin)!));
    }
  });

  it('paints the pixels it is given, so marks painted first keep their ramp', () => {
    const f = frameOf(block(12, 8, '2'));
    const marked = Uint8Array.from(f.pixels).fill(7, 0, 12);
    const out = paintSkin(f, marked, 'scaled')!;
    expect(rowsOf(f, out)[0]).toBe('666666666666');
    expect(rowsOf(f, out)[1]).toBe('122122122122');
  });

  it('never changes the frame it is given', () => {
    const snapshot = (fr: PartFrame, px: Uint8Array): unknown => ({ px: Array.from(px), pixels: Array.from(fr.pixels), layers: Object.fromEntries(Object.entries(fr.layers ?? {}).map(([k, v]) => [k, Array.from(v)])) });
    for (const skin of SKIN_NAMES) {
      for (const f of [frameOf(block(12, 8, '6')), frameOf(block(12, 8, '6'), { [skin]: block(12, 8, '5') })]) {
        const px = Uint8Array.from(f.pixels);
        const before = snapshot(f, px);
        const out = paintSkin(f, px, skin);
        expect(snapshot(f, px), skin).toEqual(before);
        if (out !== null) {
          expect(out).not.toBe(px);
          expect(out).not.toBe(f.pixels);
        }
      }
    }
  });
});

describe('the table', () => {
  it('holds every skin; untuned is true for every skin; across and down are 1 to 6', () => {
    expect(Object.keys(SKIN_TABLE)).toEqual([...SKIN_NAMES]);
    for (const skin of SKIN_NAMES) {
      const rule = SKIN_TABLE[skin];
      expect(rule.untuned, skin).toBe(true);
      expect(rule.across >= 1 && rule.across <= 6, skin).toBe(true);
      expect(rule.down >= 1 && rule.down <= 6, skin).toBe(true);
    }
  });
});
