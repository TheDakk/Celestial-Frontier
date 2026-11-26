import { describe, expect, it } from 'vitest';
import { PIXEL_CHARS, SKIN_NAMES, TIER_SIZE, type LayerName, type PartFrame, type SizeTier, type SkinName } from '@cf/art-format';
import { SKIN_TABLE, STAMP_MOST, paintSkin, type Stamp } from '@cf/art-compose';
import { alternations, checkers, coverage, COVER_MOST, lonePixels, repeat, REPEAT_MOST, type Picture } from './texture-measures';

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
const PLAIN = frameOf(block(24, 16, '2'));
const RULED: readonly SkinName[] = SKIN_NAMES.filter((s) => SKIN_TABLE[s].mode !== 'none');
/** The skins whose rule draws a texture over the hide; slick (an edge light) and translucent (nothing) are the plain ones. */
const TEXTURED: readonly SkinName[] = SKIN_NAMES.filter((s) => SKIN_TABLE[s].mode !== 'none' && SKIN_TABLE[s].mode !== 'edge');
const TIERS: readonly SizeTier[] = ['small', 'medium', 'large', 'guardian'];
const SEEDS = [0, 1, 2, 7, 14, 29, 44];

/**
 * A body the size a creature of the tier is drawn at: an oval three fifths of the tier's canvas, lit from above in four
 * bands of the body ramp (4 lightest at the top), with an underside-ramp belly and an accent-ramp band across the back.
 */
function body(tier: SizeTier): PartFrame {
  const w = Math.floor(TIER_SIZE[tier][0] * 3 / 5);
  const h = Math.floor(TIER_SIZE[tier][1] * 3 / 5);
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (2 * x + 1 - w) / w;
      const dy = (2 * y + 1 - h) / h;
      if (dx * dx + dy * dy > 1) continue;
      const lit = 4 - Math.min(3, Math.floor((y + Math.floor(x / 6)) * 4 / h));
      const belly = y > h * 0.7 && Math.abs(dx) < 0.5;
      const band = x > w * 0.4 && x < w * 0.5 && y < h * 0.6;
      pixels[y * w + x] = band ? 4 + lit : belly ? 8 + lit : lit;
    }
  }
  return { w, h, pixels, anchor: [0, 0], attach: {}, layers: {} };
}
/** A limb the size the tier's creature has: a tall bar an eighth of the canvas wide, lit down its front. */
function limb(tier: SizeTier): PartFrame {
  const w = Math.max(3, TIER_SIZE[tier][0] >> 3);
  const h = TIER_SIZE[tier][1] >> 1;
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pixels[y * w + x] = x * 3 < w ? 2 : 3;
  return { w, h, pixels, anchor: [0, 0], attach: {}, layers: {} };
}

const pictureOf = (rows: readonly string[], painted: readonly string[]): Picture => ({ w: (rows[0] as string).length, h: rows.length, before: grid(rows), after: grid(painted) });
const painted = (frame: PartFrame, skin: SkinName, tier: SizeTier, seed: number): Picture => ({ w: frame.w, h: frame.h, before: frame.pixels, after: paintSkin(frame, frame.pixels, skin, tier, seed)! });

describe('the measures of a texture, each proved on a picture that must fail it and one that must pass', () => {
  const flat = block(48, 36, '2');
  // The pictures the first skin rules drew on a flat hide: a dot on every cell, a line on every cell row, a brick mesh.
  const dots = flat.map((row, y) => (y % 3 !== 0 ? row : row.split('').map((c, x) => ((x + (y % 6 === 0 ? 0 : 1)) % 2 === 0 ? '1' : c)).join('')));
  const lines = flat.map((row, y) => (y % 3 === 0 ? '1'.repeat(48) : row));
  const mesh = flat.map((row, y) => (y % 4 === 0 ? '1'.repeat(48) : row.split('').map((c, x) => ((x + (y % 8 < 4 ? 0 : 2)) % 5 === 0 ? '1' : c)).join('')));
  // Solid clusters placed unevenly: what a texture should be.
  const clusters = [...flat];
  for (const [x, y] of [[1, 1], [9, 2], [16, 1], [4, 5], [12, 6], [20, 5], [2, 9], [8, 9], [17, 9], [30, 3], [41, 2], [27, 8], [36, 9], [43, 7], [5, 14], [14, 15], [24, 13], [33, 16], [42, 13], [1, 20], [11, 21], [19, 19], [28, 22], [38, 20], [6, 26], [16, 27], [25, 26], [34, 28], [43, 25], [2, 31], [12, 33], [21, 31], [31, 33], [40, 31]] as const) {
    for (const [dx, dy] of [[0, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]] as const) {
      const row = (clusters[y + dy] as string).split('');
      row[x + dx] = '1';
      clusters[y + dy] = row.join('');
    }
  }

  it('a lone pixel is counted; a pixel beside one of its own value is not', () => {
    expect(lonePixels(pictureOf(flat, dots))).toBeGreaterThan(40);
    expect(lonePixels(pictureOf(['222', '222', '222'], ['222', '212', '222']))).toBe(1);
    expect(lonePixels(pictureOf(['222', '222', '222'], ['222', '211', '222']))).toBe(0);
    // An untouched pixel the texture walls in counts; one that stood alone before does not.
    expect(lonePixels(pictureOf(block(5, 5, '2'), ['22222', '21112', '21212', '21112', '22222']))).toBe(1);
    expect(lonePixels(pictureOf(['222', '232', '222'], ['222', '232', '222']))).toBe(0);
    expect(lonePixels(pictureOf(flat, clusters))).toBe(0);
  });

  it('a checker window is counted only where the texture made it', () => {
    expect(checkers(pictureOf(['22', '22'], ['12', '21']))).toBe(1);
    expect(checkers(pictureOf(['12', '21'], ['12', '21']))).toBe(0);
    expect(checkers(pictureOf(['22', '22'], ['11', '21']))).toBe(0);
    expect(checkers(pictureOf(flat, clusters))).toBe(0);
  });

  it('a run of every other pixel is counted along a row and along a column', () => {
    expect(alternations(pictureOf(['22222'], ['12121']))).toBe(2);
    expect(alternations(pictureOf(['2', '2', '2', '2'], ['1', '2', '1', '2']))).toBe(1);
    expect(alternations(pictureOf(['22222'], ['11211']))).toBe(0);
    expect(alternations(pictureOf(flat, dots))).toBeGreaterThan(40);
    expect(alternations(pictureOf(flat, clusters))).toBe(0);
  });

  it('coverage and repeat tell a grid from scattered clusters', () => {
    expect(coverage(pictureOf(flat, lines))).toBeGreaterThan(COVER_MOST);
    expect(coverage(pictureOf(flat, mesh))).toBeGreaterThan(COVER_MOST);
    for (const gridded of [dots, lines, mesh]) expect(repeat(pictureOf(flat, gridded))).toBe(1);
    expect(coverage(pictureOf(flat, clusters))).toBeLessThanOrEqual(COVER_MOST);
    expect(repeat(pictureOf(flat, clusters))).toBeLessThanOrEqual(REPEAT_MOST);
  });
});

describe('a textured skin is drawn as solid clusters, never a grid of dots, dashes or lines', () => {
  it('seven skins are textured; slick and translucent are plain', () => {
    expect(TEXTURED).toEqual(['scaled', 'furred', 'chitinous', 'plated', 'warty', 'feathered', 'crystalline']);
  });

  for (const tier of TIERS) {
    it(`${tier}: on a body and on a limb no texture pixel stands alone, none makes a checker or a run of every other pixel`, () => {
      for (const skin of TEXTURED) {
        let drawn = 0;
        for (const seed of SEEDS) {
          for (const frame of [body(tier), limb(tier)]) {
            const p = painted(frame, skin, tier, seed);
            const label = `${skin} ${tier} seed ${seed} ${frame.w}x${frame.h}`;
            expect(lonePixels(p), `lone pixels: ${label}`).toBe(0);
            expect(checkers(p), `checkers: ${label}`).toBe(0);
            expect(alternations(p), `runs of every other pixel: ${label}`).toBe(0);
            if (p.after.some((v, i) => v !== p.before[i])) drawn++;
          }
        }
        // The body takes the texture at every seed (so the measures above measured something); a limb may be too thin for it.
        expect(drawn, `${skin} ${tier}`).toBeGreaterThanOrEqual(SEEDS.length);
      }
    });

    it(`${tier}: the texture on a body covers at most three tenths of the hide and does not repeat as a grid`, () => {
      for (const skin of TEXTURED) {
        for (const seed of SEEDS) {
          const p = painted(body(tier), skin, tier, seed);
          expect(coverage(p), `${skin} ${tier} seed ${seed}`).toBeGreaterThan(0.02);
          expect(coverage(p), `${skin} ${tier} seed ${seed}`).toBeLessThanOrEqual(COVER_MOST);
          expect(repeat(p), `${skin} ${tier} seed ${seed}`).toBeLessThanOrEqual(REPEAT_MOST);
        }
      }
    });
  }

  it('a scattered cluster is drawn whole: every piece of texture on a flat hide is one stamp\'s darker or lighter part', () => {
    const partsOf = (stamp: Stamp, c: string): string => stamp.map((row) => row.split('').map((ch) => (ch === c ? '#' : '.')).join('')).join('/');
    const trim = (rows: string[]): string => {
      const used = rows.filter((r) => r.includes('#'));
      const from = Math.min(...used.map((r) => r.indexOf('#')));
      const to = Math.max(...used.map((r) => r.lastIndexOf('#')));
      return used.map((r) => r.slice(from, to + 1)).join('/');
    };
    for (const skin of TEXTURED) {
      const rule = SKIN_TABLE[skin];
      if (rule.mode !== 'scatter') continue;
      for (const tier of TIERS) {
        if (rule.tiers[tier].loose) continue;
        const allowed = new Set(rule.tiers[tier].stamps.flatMap((s) => ['D', 'L'].map((c) => partsOf(s, c)).filter((t) => t.includes('#')).map((t) => trim(t.split('/')))));
        const frame = frameOf(block(60, 40, '2'));
        const out = paintSkin(frame, frame.pixels, skin, tier, 3)!;
        // Each connected piece of one value, cut out and compared.
        const seen = new Uint8Array(out.length);
        let pieces = 0;
        for (let i = 0; i < out.length; i++) {
          if (out[i] === 2 || seen[i] === 1) continue;
          const members: number[] = [];
          const queue = [i];
          seen[i] = 1;
          while (queue.length > 0) {
            const k = queue.pop()!;
            members.push(k);
            for (const n of [k - frame.w, k + frame.w, k % frame.w === 0 ? -1 : k - 1, k % frame.w === frame.w - 1 ? -1 : k + 1]) {
              if (n >= 0 && n < out.length && seen[n] === 0 && out[n] === out[i]) { seen[n] = 1; queue.push(n); }
            }
          }
          const ys = members.map((k) => Math.floor(k / frame.w)); const xs = members.map((k) => k % frame.w);
          const rows: string[] = [];
          for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
            let row = '';
            for (let x = Math.min(...xs); x <= Math.max(...xs); x++) row += members.includes(y * frame.w + x) ? '#' : '.';
            rows.push(row);
          }
          expect(allowed.has(rows.join('/')), `${skin} ${tier}: ${rows.join('/')}`).toBe(true);
          pieces++;
        }
        expect(pieces, `${skin} ${tier}`).toBeGreaterThan(10);
      }
    }
  });

  it('a cluster never straddles two shades of the hide, so the edge of a shadow stays as drawn', () => {
    // Two flat shades side by side. Two clusters are never side by side, so texture on both sides of the edge in one row is one cluster across it.
    const rows = new Array<string>(30).fill('2'.repeat(25) + '3'.repeat(25));
    const frame = frameOf(rows);
    for (const skin of ['scaled', 'furred', 'warty', 'feathered'] as const) {
      for (const seed of SEEDS) {
        const out = paintSkin(frame, frame.pixels, skin, 'large', seed)!;
        for (let y = 0; y < frame.h; y++) expect(out[y * frame.w + 24] !== 2 && out[y * frame.w + 25] !== 3, `${skin} seed ${seed} row ${y}`).toBe(false);
        expect(out.some((v, i) => v !== frame.pixels[i]), skin).toBe(true);
      }
    }
    // Control: a facet may cross (crystalline is loose), and at some seed one does.
    expect(SEEDS.some((seed) => {
      const out = paintSkin(frame, frame.pixels, 'crystalline', 'large', seed)!;
      return rows.some((_, y) => out[y * frame.w + 24] !== 2 && out[y * frame.w + 25] !== 3);
    })).toBe(true);
  });

  it('the same frame, pixels, skin, tier and seed give the same picture; the seed and the tier each change it', () => {
    const frame = body('large');
    for (const skin of TEXTURED) {
      const a = paintSkin(frame, frame.pixels, skin, 'large', 4)!;
      expect(Array.from(paintSkin(frame, frame.pixels, skin, 'large', 4)!), skin).toEqual(Array.from(a));
      expect(Array.from(paintSkin(frame, frame.pixels, skin, 'large', 5)!), skin).not.toEqual(Array.from(a));
      expect(Array.from(paintSkin(frame, frame.pixels, skin, 'small', 4)!), skin).not.toEqual(Array.from(a));
      // A Guardian is drawn with the large tier's rule.
      expect(Array.from(paintSkin(frame, frame.pixels, skin, 'guardian', 4)!), skin).toEqual(Array.from(a));
    }
  });
});

describe('paintSkin', () => {
  it('each rule skin changes some pixel, and the eight differ pairwise', () => {
    expect(RULED.length).toBe(8);
    const seen = new Set<string>();
    for (const skin of RULED) {
      const out = paintSkin(PLAIN, PLAIN.pixels, skin, 'medium', 0);
      expect(out, skin).not.toBeNull();
      expect(Array.from(out!), skin).not.toEqual(Array.from(PLAIN.pixels));
      seen.add(rowsOf(PLAIN, out).join('/'));
    }
    expect(seen.size).toBe(8);
  });

  it('translucent paints nothing and returns null without its layer', () => {
    expect(SKIN_TABLE.translucent.mode).toBe('none');
    expect(paintSkin(PLAIN, PLAIN.pixels, 'translucent', 'medium', 0)).toBeNull();
    expect(paintSkin(frameOf(block(24, 16, '2'), { scaled: block(24, 16, '3') }), PLAIN.pixels, 'translucent', 'medium', 0)).toBeNull();
  });

  it('slick is as it was: a pixel under an empty one steps one lighter, whatever the tier and the seed', () => {
    // A pixel whose upper neighbour is empty or outside the frame steps one lighter; an eye above is drawn.
    const holed = frameOf(['2222', '2.d2', '2222']);
    for (const tier of TIERS) for (const seed of SEEDS) expect(rowsOf(holed, paintSkin(holed, holed.pixels, 'slick', tier, seed))).toEqual(['3333', '2.d2', '2322']);
    // The lightest shade of each ramp stays; no pixel but one under an empty pixel changes.
    const lit = frameOf(['4812c', '22222']);
    expect(rowsOf(lit, paintSkin(lit, lit.pixels, 'slick', 'medium', 0))).toEqual(['4823c', '22222']);
  });

  it("the rule never leaves a pixel's ramp", () => {
    const hosts = frameOf(new Array<string>(24).fill('111144445555888899999cccc'));
    const ramp = (v: number): number => (v - 1) >> 2;
    for (const skin of RULED) {
      for (const tier of TIERS) {
        const out = paintSkin(hosts, hosts.pixels, skin, tier, 1)!;
        for (let i = 0; i < out.length; i++) expect(ramp(out[i]!), `${skin} ${tier} ${i}`).toBe(ramp(hosts.pixels[i]!));
      }
    }
    // On the darkest shade nothing can get darker and on the lightest nothing lighter: only the other part of a cluster is drawn.
    const ones = frameOf(block(24, 16, '1'));
    const fours = frameOf(block(24, 16, '4'));
    for (const skin of RULED) {
      expect(paintSkin(ones, ones.pixels, skin, 'medium', 0)!.every((v) => v === 1 || v === 2), skin).toBe(true);
      expect(paintSkin(fours, fours.pixels, skin, 'medium', 0)!.every((v) => v === 4 || v === 3), skin).toBe(true);
    }
    // Both changes are used on a middle shade, so both clamps above were reached.
    for (const step of [1, 3]) expect(TEXTURED.some((s) => paintSkin(PLAIN, PLAIN.pixels, s, 'medium', 0)!.includes(step)), String(step)).toBe(true);
  });

  it('never writes where the frame is 0, 13, 14, 15, 16 or 17 to 20, nor writes those values', () => {
    const rows = ['.defg', 'hijk.', '.defg', 'hijk.', '.defg', 'hijk.', '.defg', 'hijk.'];
    for (const skin of SKIN_NAMES) {
      // A frame built in code may hold any value in a layer, an eye or iris value among them.
      const layered = ['c', '1', 'd', 'g', 'h'].map((c) => frameOf(rows, { [skin]: block(5, 8, c) }));
      for (const frame of [frameOf(rows), ...layered]) {
        const out = paintSkin(frame, frame.pixels, skin, 'small', 0);
        if (out !== null) expect(Array.from(out), skin).toEqual(Array.from(frame.pixels));
      }
      // Nor writes a reserved value over a drawn pixel, though a hand layer built in code holds one.
      const drawn = frameOf(block(9, 2, '2'), { [skin]: ['defghijk.', 'defghijk.'] });
      expect(Array.from(paintSkin(drawn, drawn.pixels, skin, 'small', 0)!), skin).toEqual(Array.from(drawn.pixels));
    }
    // A rule paints the hide round an eye and a hole and leaves both.
    const eyed = frameOf(block(24, 16, '2').map((row, y) => (y === 6 ? row.slice(0, 10) + 'de.' + row.slice(13) : row)));
    for (const skin of TEXTURED) {
      const out = rowsOf(eyed, paintSkin(eyed, eyed.pixels, skin, 'medium', 2));
      expect(out[6]!.slice(10, 13), skin).toBe('de.');
    }
  });

  it('refuses pixels that are not the frame\'s size, by rule and by hand layer', () => {
    const f = frameOf(block(4, 3, '2'), { scaled: block(4, 3, '3') });
    for (const skin of ['plated', 'scaled'] as const) {
      expect(() => paintSkin(f, new Uint8Array(11), skin, 'medium', 0), skin).toThrow(RangeError);
      expect(() => paintSkin(f, new Uint8Array(13), skin, 'medium', 0), skin).toThrow('13 pixels for a 4x3 frame');
      expect(paintSkin(f, f.pixels, skin, 'medium', 0), skin).not.toBeNull();
    }
  });

  it('a hand-drawn skin layer wins and is applied as drawn, whatever the tier and the seed', () => {
    const f = frameOf(['2222', '2222', '2222'], { scaled: ['3.1.', '....', '.4..'] });
    for (const tier of TIERS) for (const seed of SEEDS) expect(rowsOf(f, paintSkin(f, f.pixels, 'scaled', tier, seed))).toEqual(['3212', '2222', '2422']);
    const t = frameOf(['2222', '2.22', '6666'], { translucent: ['1...', '.3..', '...7'] });
    expect(rowsOf(t, paintSkin(t, t.pixels, 'translucent', 'medium', 0))).toEqual(['1222', '2.22', '6667']);
    // On a frame the rule would texture, the drawn layer alone is seen.
    const big = frameOf(block(24, 16, '2'), { scaled: ['1'.repeat(24), ...block(24, 15, '.')] });
    expect(rowsOf(big, paintSkin(big, big.pixels, 'scaled', 'medium', 0))).toEqual(['1'.repeat(24), ...block(24, 15, '2')]);
  });

  it('a hand-drawn value from another ramp replaces the pixel, as a hand-drawn marks layer does', () => {
    // Organs drawn in contrasting ramps over a primary-ramp body: accent and underside values replace the pixel.
    const t = frameOf(['2222', '6666', 'aaaa'], { translucent: ['5.9.', '.1.c', '8..4'] });
    expect(rowsOf(t, paintSkin(t, t.pixels, 'translucent', 'medium', 0))).toEqual(['5292', '616c', '8aa4']);
    const f = frameOf(['14589c', '14589c'], { scaled: ['c95841', '......'] });
    expect(rowsOf(f, paintSkin(f, f.pixels, 'scaled', 'medium', 0))).toEqual(['c95841', '14589c']);
  });

  it('a layer for another skin is ignored', () => {
    const other = frameOf(block(24, 16, '2'), { furred: block(24, 16, '4'), striped: block(24, 16, '6'), flow: block(24, 16, '1') });
    for (const skin of RULED) {
      if (skin === 'furred') continue;
      expect(Array.from(paintSkin(other, other.pixels, skin, 'medium', 0)!), skin).toEqual(Array.from(paintSkin(PLAIN, PLAIN.pixels, skin, 'medium', 0)!));
    }
  });

  it('paints the pixels it is given, so marks painted first keep their ramp', () => {
    // The top half is a mark in the accent ramp: the texture on it stays in the accent ramp, and on the hide in the hide's.
    const marked = Uint8Array.from(PLAIN.pixels).fill(7, 0, 24 * 8);
    for (const skin of TEXTURED) {
      const out = paintSkin(PLAIN, marked, skin, 'medium', 0)!;
      expect(out.subarray(0, 24 * 8).every((v) => v >= 6 && v <= 8), skin).toBe(true);
      expect(out.subarray(24 * 8).every((v) => v >= 1 && v <= 3), skin).toBe(true);
      expect(out.subarray(0, 24 * 8).some((v) => v !== 7) || out.subarray(24 * 8).some((v) => v !== 2), skin).toBe(true);
    }
  });

  it('never changes the frame it is given', () => {
    const snapshot = (fr: PartFrame, px: Uint8Array): unknown => ({ px: Array.from(px), pixels: Array.from(fr.pixels), layers: Object.fromEntries(Object.entries(fr.layers ?? {}).map(([k, v]) => [k, Array.from(v)])) });
    for (const skin of SKIN_NAMES) {
      for (const f of [frameOf(block(24, 16, '6')), frameOf(block(24, 16, '6'), { [skin]: block(24, 16, '5') })]) {
        const px = Uint8Array.from(f.pixels);
        const before = snapshot(f, px);
        const out = paintSkin(f, px, skin, 'medium', 0);
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
  it('holds every skin; untuned is true for every skin', () => {
    expect(Object.keys(SKIN_TABLE)).toEqual([...SKIN_NAMES]);
    for (const skin of SKIN_NAMES) expect(SKIN_TABLE[skin].untuned, skin).toBe(true);
  });

  it('every stamp is a rectangle of D, L and dots, and each of its two parts is one solid piece with no checker', () => {
    for (const skin of SKIN_NAMES) {
      const rule = SKIN_TABLE[skin];
      if (rule.mode !== 'scatter') continue;
      for (const tier of TIERS) {
        const t = rule.tiers[tier];
        expect(t.across >= 2 && t.down >= 2 && t.stagger >= 0 && t.stagger < t.across && t.keep >= 1 && t.keep <= 100, `${skin} ${tier}`).toBe(true);
        expect(t.stamps.length, `${skin} ${tier}`).toBeGreaterThan(0);
        for (const stamp of t.stamps) {
          const w = stamp[0]!.length;
          expect(stamp.every((row) => row.length === w && /^[DL.]+$/.test(row)), `${skin} ${tier} ${stamp.join('/')}`).toBe(true);
          expect(w <= STAMP_MOST && stamp.length <= STAMP_MOST, `${skin} ${tier} ${stamp.join('/')}`).toBe(true);
          for (const part of ['D', 'L']) {
            if (!stamp.some((row) => row.includes(part))) continue;
            // Drawn alone on a flat hide, the part leaves no lone pixel and no checker.
            const flat = block(w + 2, stamp.length + 2, '2');
            const drawn = flat.map((row, y) => row.split('').map((c, x) => (stamp[y - 1]?.[x - 1] === part ? '1' : c)).join(''));
            const p = pictureOf(flat, drawn);
            expect(lonePixels(p) + checkers(p) + alternations(p), `${skin} ${tier} ${stamp.join('/')} ${part}`).toBe(0);
          }
        }
      }
    }
  });

  it('lines are at least four pixels apart', () => {
    for (const skin of SKIN_NAMES) {
      const rule = SKIN_TABLE[skin];
      if (rule.mode !== 'seams' && rule.mode !== 'plates') continue;
      for (const tier of TIERS) expect(rule.tiers[tier].gap >= 4 && rule.tiers[tier].jitter >= 1, `${skin} ${tier}`).toBe(true);
    }
  });

  it('is frozen, and so is each rule, each tier and each stamp: a picture changes only through a change to this file', () => {
    const frozen = (value: unknown): boolean => typeof value !== 'object' || value === null || (Object.isFrozen(value) && Object.values(value).every(frozen));
    expect(frozen(SKIN_TABLE)).toBe(true);
    expect(Object.isFrozen(SKIN_TABLE.scaled)).toBe(true);
  });
});
