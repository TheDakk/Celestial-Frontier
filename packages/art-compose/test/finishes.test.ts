import { describe, expect, it } from 'vitest';
import { buildRecipe } from '@cf/art-recipe';
import { FINISH, FINISH_TIERS, applyFinish, assemble, blit, compose, createBuffer, finish, finishLevelFor, hashBuffer, type PixelBuffer } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';

type Level = 0 | 1 | 2 | 3;
const LEVELS: readonly Level[] = [0, 1, 2, 3];
const cat = testCatalogue();
const genome = (body: number, head: number, tail: number) =>
  ({ kingdom: 'fauna', body, head, tail, limbs: 1, eyes: 1, size: 2, loco: 0, color: 3, accent: 5, pattern: 0, skin: 0 });
/** One real placeholder quadruped (sturdy, head 3, tail 3), composed in `pose` at `level`. */
const creature = (level?: Level, pose = 'rest') => {
  const recipe = buildRecipe(genome(0, 3, 3), [], cat);
  return level === undefined ? compose(recipe, pose, cat) : compose(recipe, pose, cat, level);
};
const rampOf = (v: number): number => (v - 1) >> 2;
const isRamp = (v: number): boolean => v >= 1 && v <= 12;
/** A buffer filled column by column from `column(x, y)`, with nothing else drawn. */
function bufferOf(column: (x: number, y: number) => number): PixelBuffer {
  const b = createBuffer('small');
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) b.pixels[y * b.w + x] = column(x, y);
  return b;
}
const finished = (b: PixelBuffer, level: Level): PixelBuffer => {
  const out = { ...b, pixels: Uint8Array.from(b.pixels) };
  applyFinish(out, level);
  return out;
};

describe('the rarity finish: level 0', () => {
  it('finish level 0 is today\'s picture: every body, head and tail of the placeholder at rest and strike', () => {
    let real = 0;
    let count = 0;
    for (let body = 0; body < 16; body++) {
      for (let head = 0; head < 10; head++) {
        for (let tail = 0; tail < 7; tail++) {
          const recipe = buildRecipe(genome(body, head, tail), [], cat);
          for (const pose of ['rest', 'strike']) {
            const today = compose(recipe, pose, cat);
            const zero = compose(recipe, pose, cat, 0);
            count++;
            if (zero.hash !== today.hash) expect.fail(`level 0 differs: body ${body} head ${head} tail ${tail} ${pose}`);
            expect(zero.gaps).toEqual(today.gaps);
            expect(zero.contact).toEqual(today.contact);
            // assemble then finish alone is compose when no fallback is drawn (compose adds the fallback itself).
            if (today.gaps.some((g) => g.startsWith('fallback:'))) continue;
            real++;
            const { buffer } = assemble(recipe, pose, cat);
            finish(buffer);
            if (hashBuffer(buffer) !== zero.hash) expect.fail(`level 0 is not assemble then finish: body ${body} head ${head} tail ${tail} ${pose}`);
          }
        }
      }
    }
    expect(count).toBe(16 * 10 * 7 * 2);
    expect(real).toBeGreaterThan(400);
  });

  it('applyFinish at level 0 changes nothing', () => {
    const b = bufferOf((x, y) => (x * 7 + y * 3) % 21);
    expect(finished(b, 0).pixels).toEqual(b.pixels);
  });
});

describe('the rarity finish: levels 1 to 3', () => {
  it('each level changes the picture, and each adds to the one below', () => {
    for (const pose of ['rest', 'strike']) {
      const at = LEVELS.map((level) => creature(level, pose));
      expect(new Set(at.map((c) => c.hash)).size, pose).toBe(4);
      for (const c of at) expect(c.hash).toBe(hashBuffer(c.buffer));
      const base = at[0]!.buffer.pixels;
      const changedAt = (level: Level): number[] =>
        [...base.keys()].filter((i) => at[level]!.buffer.pixels[i] !== base[i]);
      const one = changedAt(1);
      expect(one.length, pose).toBeGreaterThan(0);
      for (const level of [2, 3] as const) {
        const now = new Set(changedAt(level));
        for (const i of one) if (!now.has(i)) expect.fail(`${pose}: pixel ${i} changed at level 1 but not at level ${level}`);
      }
      // The finish never moves the contact point or adds a gap.
      for (const c of at) {
        expect(c.contact).toEqual(at[0]!.contact);
        expect(c.gaps).toEqual(at[0]!.gaps);
      }
    }
  });

  it('never touches 0, 13 to 20', () => {
    // Every value 0 to 20 on every row and column phase of the swirl and pearl, and in and out of the sheen band.
    const b = bufferOf((x, y) => (x + y * 5) % 21);
    for (const level of LEVELS) {
      const out = finished(b, level);
      b.pixels.forEach((v, i) => {
        if (v === 0 || v >= 13) expect(out.pixels[i], `level ${level} pixel ${i}`).toBe(v);
        else expect(isRamp(out.pixels[i]!), `level ${level} pixel ${i}`).toBe(true);
      });
    }
    // And on the placeholder creature: the outline, eye, highlight, glow and iris pixels are where they were, with their values.
    const today = creature().buffer.pixels;
    for (const level of [1, 2, 3] as const) {
      const now = creature(level).buffer.pixels;
      today.forEach((v, i) => {
        if (v === 0 || v >= 13 || now[i] === 0 || now[i]! >= 13) expect(now[i], `level ${level} pixel ${i}`).toBe(v);
      });
    }
  });

  it('draws the same pixels at every level: the drawn mask (non-zero pixels) is the level 0 mask, in every pose', () => {
    const mask = (pixels: Uint8Array): string => Array.from(pixels, (v) => (v === 0 ? '0' : '1')).join('');
    for (const pose of ['rest', 'strike']) {
      const zero = mask(creature(0, pose).buffer.pixels);
      expect(zero.includes('1')).toBe(true);
      for (const level of [1, 2, 3] as const) expect(mask(creature(level, pose).buffer.pixels) === zero, `level ${level} ${pose}`).toBe(true);
    }
  });

  it('sheen and pearl stay in each pixel\'s ramp; swirl writes only 7 and 8', () => {
    for (const make of [() => bufferOf((x, y) => (x + y * 5) % 21), () => creature().buffer]) {
      const b = make();
      const [l0, l1, l2, l3] = LEVELS.map((level) => finished(b, level).pixels);
      let sheen = 0, swirl = 0, pearl = 0;
      l0!.forEach((v, i) => {
        // Level 1 against 0: the sheen only, one shade up inside the ramp.
        if (l1![i] !== v) { sheen++; expect([rampOf(l1![i]!), l1![i]! - v]).toEqual([rampOf(v), 1]); }
        // Level 2 against 1: the swirl only, to 7 or 8.
        if (l2![i] !== l1![i]) { swirl++; expect([7, 8]).toContain(l2![i]); }
        // Level 3 against 2: the pearl only, one shade up inside the ramp.
        if (l3![i] !== l2![i]) { pearl++; expect([rampOf(l3![i]!), l3![i]! - l2![i]!]).toEqual([rampOf(l2![i]!), 1]); }
      });
      expect([sheen > 0, swirl > 0, pearl > 0]).toEqual([true, true, true]);
    }
  });

  it('the sheen lifts the ramp pixels in rows 15 to 45 percent of the drawn height, counted from its top row', () => {
    // A column of 1s, 20 rows tall, from row 5: drawn rows 5-24. Rows d with 15*20 <= 100*d < 45*20 (d = 3..8) lift.
    const b = createBuffer('small');
    blit(b, { w: 1, h: 20, pixels: new Uint8Array(20).fill(1), anchor: [0, 0], attach: {} }, 30, 5);
    const out = finished(b, 1);
    const column = Array.from({ length: 20 }, (_, d) => out.pixels[(5 + d) * b.w + 30]);
    expect(column).toEqual(Array.from({ length: 20 }, (_, d) => (d >= 3 && d <= 8 ? 2 : 1)));
    // A top shade stays where it is.
    const top = createBuffer('small');
    blit(top, { w: 1, h: 20, pixels: new Uint8Array(20).fill(4), anchor: [0, 0], attach: {} }, 30, 5);
    expect(finished(top, 1).pixels).toEqual(top.pixels);
  });

  it('the swirl turns shades 2 and 3 on (x + y) % 7 < 2 to accent 7 and 8, and nothing else', () => {
    // One row, far below the sheen band: a tall column of 4s from row 0 puts row 31 out of the band.
    const b = createBuffer('small');
    for (let y = 0; y < b.h; y++) b.pixels[y * b.w] = 4;
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const y = 31;
    for (let x = 1; x < b.w; x++) b.pixels[y * b.w + x] = values[(x - 1) % 12]!;
    const two = finished(b, 2);
    for (let x = 1; x < b.w; x++) {
      const v = b.pixels[y * b.w + x]!;
      const shade = (v - 1) & 3;
      const want = (x + y) % FINISH.swirl.period < FINISH.swirl.on && shade >= 2 ? 5 + shade : v;
      expect(two.pixels[y * b.w + x], `x ${x} value ${v}`).toBe(want);
    }
  });

  it('the pearl lifts ramp pixels on (x - y) mod 9 < 2, both sides of the diagonal', () => {
    const b = bufferOf((x, y) => (x === 0 ? 4 : y === 31 || y === 30 ? 9 : 0));
    const three = finished(b, 3);
    for (const y of [30, 31]) {
      for (let x = 1; x < b.w; x++) {
        const lifted = (((x - y) % 9) + 9) % 9 < 2;
        expect(three.pixels[y * b.w + x], `x ${x} y ${y}`).toBe(lifted ? 10 : 9);
      }
    }
    // Before the diagonal (x < y) as well as after it.
    expect(three.pixels[31 * b.w + 13]).toBe(10); // 13 - 31 = -18, mod 9 = 0
    expect(three.pixels[31 * b.w + 14]).toBe(10); // -17 mod 9 = 1
    expect(three.pixels[31 * b.w + 15]).toBe(9);  // -16 mod 9 = 2
  });

  it('an empty buffer stays empty at every level', () => {
    for (const level of LEVELS) expect(finished(createBuffer('small'), level).pixels.every((p) => p === 0)).toBe(true);
  });

  it('gives the same picture twice at every level, and leaves the recipe unchanged', () => {
    const recipe = Object.freeze(buildRecipe(genome(0, 3, 3), [], cat));
    const json = JSON.stringify(recipe);
    for (const level of LEVELS) expect(compose(recipe, 'rest', cat, level).hash).toBe(compose(recipe, 'rest', cat, level).hash);
    expect(JSON.stringify(recipe)).toBe(json);
  });
});

describe('the rarity finish: a bad level is refused', () => {
  const BAD: readonly unknown[] = [4, -1, 1.5, NaN, '2', null];
  const real = buildRecipe(genome(0, 3, 3), [], cat);
  // A large creature: the placeholder pack draws every body at medium only, so this one is drawn as its family's fallback.
  const fallback = buildRecipe({ ...genome(3, 3, 3), size: 4 }, [], cat);
  // A family with no fallback: compose would throw its own error, so the level must be refused before anything is read.
  const nothing = { ...real, parts: [], family: 'ghost' };

  it('compose throws the RangeError for every bad level, on the parts path and the fallback path, before anything is read', () => {
    expect(compose(fallback, 'rest', cat).gaps.some((g) => g.startsWith('fallback:'))).toBe(true);
    for (const level of BAD) {
      for (const recipe of [real, fallback, nothing]) {
        expect(() => compose(recipe, 'rest', cat, level as Level), `${String(level)} ${recipe.family}`)
          .toThrow(new RangeError(`bad finish level ${String(level)}`));
      }
      expect(() => compose(real, 'rest', cat, level as Level)).toThrow(RangeError);
    }
  });

  it('applyFinish throws the RangeError for every bad level and leaves the buffer as it was', () => {
    for (const level of BAD) {
      const b = bufferOf((x, y) => (x + y * 5) % 21);
      const before = Uint8Array.from(b.pixels);
      expect(() => applyFinish(b, level as Level), String(level)).toThrow(new RangeError(`bad finish level ${String(level)}`));
      expect(b.pixels).toEqual(before);
    }
  });

  it('0 and an omitted level give today\'s picture; 1, 2 and 3 still draw', () => {
    for (const recipe of [real, fallback]) {
      const today = compose(recipe, 'rest', cat);
      expect(compose(recipe, 'rest', cat, 0).hash).toBe(today.hash);
      const { buffer } = assemble(recipe, 'rest', cat);
      if (recipe === real) {
        finish(buffer);
        expect(hashBuffer(buffer)).toBe(today.hash);
      }
      for (const level of [1, 2, 3] as const) expect(compose(recipe, 'rest', cat, level).hash).not.toBe(today.hash);
    }
  });
});

describe('the rarity finish: tables', () => {
  it('finishLevelFor follows the original\'s thresholds', () => {
    expect(Array.from({ length: 15 }, (_, tier) => finishLevelFor(tier))).toEqual([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3]);
    // hdart.verbatim.js:244, the original's rule, for every tier 0 to 40.
    const original = (tier: number) => (tier >= 8 ? 3 : tier >= 6 ? 2 : tier >= 4 ? 1 : 0);
    for (let tier = 0; tier <= 40; tier++) expect(finishLevelFor(tier), `tier ${tier}`).toBe(original(tier));
  });

  it('FINISH is marked untuned', () => {
    expect(FINISH.untuned).toBe(true);
    expect(FINISH).toEqual({ untuned: true, sheen: { from: 15, to: 45 }, swirl: { period: 7, on: 2 }, pearl: { period: 9, on: 2 } });
  });

  it('FINISH, each of its rules and FINISH_TIERS are frozen', () => {
    expect(Object.isFrozen(FINISH)).toBe(true);
    for (const rule of [FINISH.sheen, FINISH.swirl, FINISH.pearl]) expect(Object.isFrozen(rule)).toBe(true);
    expect(Object.isFrozen(FINISH_TIERS)).toBe(true);
  });
});
