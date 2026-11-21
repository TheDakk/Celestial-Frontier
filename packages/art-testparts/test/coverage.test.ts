import { describe, expect, it } from 'vitest';
import { EYE_COUNTS, TIER_SIZE, fallbackKey, type SizeTier } from '@cf/art-format';
import { buildRecipe, EYELESS_HEAD, type Recipe } from '@cf/art-recipe';
import { assemble, compose, type PixelBuffer } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { makeGenome } from '@cf/domain-genome';

const cat = testCatalogue();
const POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
const QUADRUPED_BODIES = [0, 1, 2, 10, 11, 13]; // sturdy, armored, stilt, tusked, horned, squat
const BAD_GAP = /^(missing|attach|frame|scaffold|fallback):/;

const genome = (body: number, head: number, tail: number, limbs: number, eyes: number) =>
  ({ kingdom: 'fauna', body, head, tail, limbs, eyes, size: 2, loco: 0, color: 3, accent: 5, pattern: 0, skin: 0 });
const hashOf = (g: ReturnType<typeof genome>, pose = 'rest') => compose(buildRecipe(g, [], cat), pose, cat).hash;

describe('quadruped test catalogue', () => {
  it('composes every body, head, tail, limbs and eyes combination without a real gap', () => {
    let count = 0;
    for (let body = 0; body < 16; body++) {
      for (let head = 0; head < 10; head++) {
        for (let tail = 0; tail < 7; tail++) {
          for (let limbs = 0; limbs < 6; limbs++) {
            for (let eyes = 0; eyes < 6; eyes++) {
              const g = genome(body, head, tail, limbs, eyes);
              const recipe = buildRecipe(g, [], cat);
              const out = compose(recipe, 'rest', cat);
              count++;
              if (!out.buffer.pixels.some((p) => p !== 0)) expect.fail(`empty buffer for ${JSON.stringify(g)}`);
              if (recipe.family === 'quadruped') {
                const eyePixel = out.buffer.pixels.includes(13);
                if (head === EYELESS_HEAD ? eyePixel : EYE_COUNTS[eyes] !== 0 && !eyePixel) expect.fail(`eye pixel wrong for ${JSON.stringify(g)}`);
                if (!out.buffer.pixels.includes(16)) expect.fail(`no outline pixel for ${JSON.stringify(g)}`);
                const bad = out.gaps.filter((gap) => BAD_GAP.test(gap));
                if (bad.length > 0) expect.fail(`gaps ${bad.join(' ')} for ${JSON.stringify(g)}`);
              } else {
                if (!out.gaps.includes(`fallback:${recipe.family}`)) expect.fail(`no fallback gap for ${JSON.stringify(g)}`);
              }
            }
          }
        }
      }
    }
    expect(count).toBe(40320);
  });

  it('composes all seven poses for each torso type with no gaps but variant', () => {
    for (const body of QUADRUPED_BODIES) {
      const recipe = buildRecipe(genome(body, 3, 4, 1, 1), [], cat);
      for (const pose of POSES) {
        const out = compose(recipe, pose, cat);
        expect(out.gaps.filter((gap) => !gap.startsWith('variant:')), `${recipe.scaffoldId} ${pose}`).toEqual([]);
      }
      expect(compose(recipe, 'strike', cat).contact).not.toBeNull();
    }
  });

  it('never touches the canvas edge in any pose', () => {
    for (const body of QUADRUPED_BODIES) {
      for (let head = 0; head < 10; head++) {
        for (let tail = 0; tail < 7; tail++) {
          for (let limbs = 0; limbs < 6; limbs++) {
            const recipe = buildRecipe(genome(body, head, tail, limbs, 3), [], cat);
            for (const pose of POSES) {
              const { w, h, pixels } = compose(recipe, pose, cat).buffer;
              for (let x = 0; x < w; x++) {
                if (pixels[x] !== 0 || pixels[(h - 1) * w + x] !== 0) expect.fail(`edge touched ${recipe.scaffoldId} head ${head} tail ${tail} limbs ${limbs} ${pose}`);
              }
              for (let y = 0; y < h; y++) {
                if (pixels[y * w] !== 0 || pixels[y * w + w - 1] !== 0) expect.fail(`edge touched ${recipe.scaffoldId} head ${head} tail ${tail} limbs ${limbs} ${pose}`);
              }
            }
          }
        }
      }
    }
  });

  it('makes different heads, tails and torso types give pairwise different hashes', () => {
    const allDifferent = (make: (v: number) => ReturnType<typeof genome>, values: number[]) =>
      expect(new Set(values.map((v) => hashOf(make(v)))).size).toBe(values.length);
    allDifferent((v) => genome(0, v, 3, 1, 1), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    allDifferent((v) => genome(0, 3, v, 1, 1), [1, 2, 3, 4, 5, 6]);
    allDifferent((v) => genome(v, 3, 3, 1, 1), QUADRUPED_BODIES);
  });

  it('composes movement genes 4 and 13 as a fish fallback', () => {
    for (const loco of [4, 13]) {
      const g = { ...genome(0, 3, 3, 1, 1), loco };
      const recipe = buildRecipe(g, [], cat);
      expect(recipe.family, `loco ${loco}`).toBe('fish');
      expect(compose(recipe, 'rest', cat).gaps, `loco ${loco}`).toContain('fallback:fish');
    }
  });

  it('makes different poses look different', () => {
    const recipe = buildRecipe(genome(0, 3, 3, 1, 1), [], cat);
    expect(new Set(POSES.map((p) => compose(recipe, p, cat).hash)).size).toBe(POSES.length);
  });

  it('holds no part with the outline value 16', () => {
    for (const part of cat.parts.values()) {
      for (const frame of Object.values(part.frames)) expect(frame.pixels.includes(16), part.id).toBe(false);
    }
  });
});

describe('every kingdom composes', () => {
  it('composes a non-empty picture for all four kingdoms, seeds 1-50, every size gene, with and without the Guardian marker', () => {
    let count = 0;
    for (const kingdom of ['fauna', 'flora', 'fungi', 'microbe']) {
      for (let seed = 1; seed <= 50; seed++) {
        for (let size = 0; size < 6; size++) {
          for (const guardian of [false, true]) {
            const g = { ...makeGenome(seed, kingdom, 1), size, ...(guardian ? { apex: 12 } : {}) };
            const recipe = buildRecipe(g, [], cat);
            if ((recipe.tier === 'guardian') !== guardian) expect.fail(`tier ${recipe.tier} for ${kingdom} seed ${seed} size ${size} guardian ${guardian}`);
            const out = compose(recipe, 'rest', cat);
            count++;
            const where = `${kingdom} seed ${seed} size ${size} guardian ${guardian}`;
            if (!out.buffer.pixels.some((p) => p !== 0)) expect.fail(`empty buffer for ${where}`);
            if (kingdom !== 'fauna') {
              if (recipe.parts.length !== 0) expect.fail(`parts requested for ${where}`);
              if (!out.gaps.includes(`fallback:${recipe.family}`)) expect.fail(`no fallback gap for ${where}: ${out.gaps.join(' ')}`);
              if (out.gaps.some((gap) => gap.startsWith('missing:'))) expect.fail(`missing gap for ${where}: ${out.gaps.join(' ')}`);
            }
          }
        }
      }
    }
    expect(count).toBe(2400);
  });

  it('names, in every fallback line, a part that exists and has a rest frame', () => {
    for (const [key, id] of cat.fallbacks) {
      const part = cat.parts.get(id);
      expect(part, `${key} -> ${id}`).toBeDefined();
      expect(Object.hasOwn(part!.frames, 'rest'), `${key} -> ${id}`).toBe(true);
      expect(key, id).toBe(`${part!.family}/${part!.tier}`);
    }
  });
});

describe('fallback silhouettes', () => {
  const FAMILIES = ['quadruped', 'tentacled', 'serpent', 'myriapod', 'gastropod', 'membranous', 'crystalline', 'gelatinous', 'arachnid', 'insect', 'radial', 'fish', 'flora', 'fungi', 'microbe'];
  const TIERS = ['small', 'medium', 'large', 'guardian'] as const;
  const frameOf = (family: string, tier: SizeTier) => cat.parts.get(cat.fallbacks.get(fallbackKey(family, tier))!)!.frames['rest']!;

  it('has one for each of the fifteen families at all four tiers, and no other', () => {
    expect([...cat.fallbacks.keys()].sort()).toEqual(FAMILIES.flatMap((f) => TIERS.map((t) => fallbackKey(f, t))).sort());
  });

  it('spans about half its tier canvas each way and fits inside it, with room for the outline, when centred', () => {
    for (const family of FAMILIES) {
      for (const tier of TIERS) {
        const [cw, ch] = TIER_SIZE[tier];
        const f = frameOf(family, tier);
        let [x0, y0, x1, y1] = [f.w, f.h, -1, -1];
        for (let i = 0; i < f.pixels.length; i++) {
          if (f.pixels[i] === 0) continue;
          const x = i % f.w;
          const y = (i - x) / f.w;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
        const where = `${family} ${tier}`;
        // Drawn extent between a third and two thirds of the canvas on each axis.
        expect((x1 - x0 + 1) * 3, where).toBeGreaterThanOrEqual(cw);
        expect((x1 - x0 + 1) * 3, where).toBeLessThanOrEqual(cw * 2);
        expect((y1 - y0 + 1) * 3, where).toBeGreaterThanOrEqual(ch);
        expect((y1 - y0 + 1) * 3, where).toBeLessThanOrEqual(ch * 2);
        const left = (cw >> 1) - f.anchor[0];
        const top = (ch >> 1) - f.anchor[1];
        expect(left + x0 >= 1 && left + x1 <= cw - 2 && top + y0 >= 1 && top + y1 <= ch - 2, where).toBe(true);
      }
    }
  });

  it('gives every family a different silhouette at each tier', () => {
    for (const tier of TIERS) {
      const pictures = FAMILIES.map((family) => { const f = frameOf(family, tier); return `${f.w}x${f.h}:${f.pixels.map((v) => (v === 0 ? 0 : 1)).join('')}`; });
      expect(new Set(pictures).size, tier).toBe(FAMILIES.length);
    }
  });
});

/** How many 4-connected regions the drawn (non-zero) pixels of an unfinished picture form. */
function regions({ w, h, pixels }: PixelBuffer): number {
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  let count = 0;
  for (let start = 0; start < pixels.length; start++) {
    if (pixels[start] === 0 || seen[start] === 1) continue;
    count++;
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const i = stack.pop()!;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < pixels.length && seen[j] === 0 && pixels[j] !== 0) { seen[j] = 1; stack.push(j); }
      }
    }
  }
  return count;
}

describe('placeholder joins hold under every head and tail shift', () => {
  const SHIFTS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y] as const));
  const NO_LIMBS = 5;
  const attached = (recipe: Recipe, head: readonly [number, number], tail: readonly [number, number], pose: string): boolean =>
    regions(assemble({ ...recipe, shift: { head, tail } }, pose, cat).buffer) === 1;

  it('keeps every head on its torso at each of its nine shifts, with no tail and no legs, in all seven poses, on every torso type', () => {
    for (const body of QUADRUPED_BODIES) for (let head = 0; head < 10; head++) for (const pose of POSES) for (const s of SHIFTS) {
      if (!attached(buildRecipe(genome(body, head, 0, NO_LIMBS, 3), [], cat), s, [0, 0], pose)) expect.fail(`body ${body} head ${head} ${pose} head shift ${s}`);
    }
  });

  it('keeps every tail on its torso at each of its nine shifts with the head at each of its nine, independently and in opposite directions', () => {
    for (const body of QUADRUPED_BODIES) for (let tail = 1; tail < 7; tail++) for (const head of [tail - 1, tail + 3]) for (const pose of POSES) {
      const recipe = buildRecipe(genome(body, head, tail, NO_LIMBS, 3), [], cat);
      for (const hs of SHIFTS) for (const ts of SHIFTS) {
        if (!attached(recipe, hs, ts, pose)) expect.fail(`body ${body} head ${head} tail ${tail} ${pose} head shift ${hs} tail shift ${ts}`);
      }
    }
  });
});

describe('placeholder heads and tails can be seen', () => {
  const SHIFTS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y] as const));
  const FULL_LIMBS = 3; // eight legs: the most parts that could cover a tail
  /** Pixels of the composed picture that change when the recipe's `slot` part is removed, at that slot's shift. */
  const showing = (recipe: Recipe, slot: 'head' | 'tail', s: readonly [number, number], pose: string): number => {
    const shifted = { ...recipe, shift: { ...recipe.shift, [slot]: s } };
    const a = compose(shifted, pose, cat).buffer.pixels;
    const b = compose({ ...shifted, parts: shifted.parts.filter((p) => p.slot !== slot) }, pose, cat).buffer.pixels;
    let d = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
  };

  it('shows every tail kind by at least 6 pixels in every pose at each of its nine shifts, on every torso type', () => {
    for (const body of QUADRUPED_BODIES) for (let tail = 1; tail < 7; tail++) {
      const recipe = buildRecipe(genome(body, 3, tail, FULL_LIMBS, 3), [], cat);
      expect(recipe.parts.filter((p) => p.slot === 'tail')).toHaveLength(1);
      for (const pose of POSES) for (const s of SHIFTS) {
        const d = showing(recipe, 'tail', s, pose);
        if (d < 6) expect.fail(`body ${body} tail ${tail} ${pose} tail shift ${s}: ${d} pixels`);
      }
    }
  });

  it('shows every head kind by at least 6 pixels in every pose at each of its nine shifts, on every torso type', () => {
    for (const body of QUADRUPED_BODIES) for (let head = 0; head < 10; head++) {
      const recipe = buildRecipe(genome(body, head, 4, FULL_LIMBS, 3), [], cat);
      expect(recipe.parts.filter((p) => p.slot === 'head')).toHaveLength(1);
      for (const pose of POSES) for (const s of SHIFTS) {
        const d = showing(recipe, 'head', s, pose);
        if (d < 6) expect.fail(`body ${body} head ${head} ${pose} head shift ${s}: ${d} pixels`);
      }
    }
  });
});
