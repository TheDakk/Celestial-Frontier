import { describe, expect, it } from 'vitest';
import { EYE_COUNTS } from '@cf/art-format';
import { buildRecipe } from '@cf/art-recipe';
import { compose } from '@cf/art-compose';
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
                if (EYE_COUNTS[eyes] !== 0 && !out.buffer.pixels.includes(13)) expect.fail(`no eye pixel for ${JSON.stringify(g)}`);
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
  it('composes a non-empty picture for all four kingdoms, seeds 1-50, every size gene, guardian on and off', () => {
    let count = 0;
    for (const kingdom of ['fauna', 'flora', 'fungi', 'microbe']) {
      for (let seed = 1; seed <= 50; seed++) {
        for (let size = 0; size < 6; size++) {
          for (const guardian of [false, true]) {
            const g = { ...makeGenome(seed, kingdom, 1), size };
            const recipe = buildRecipe(g, [], cat, { guardian });
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
    expect(cat.fallbacks.size).toBeGreaterThanOrEqual(15);
    for (const family of ['flora', 'fungi', 'microbe']) expect(cat.fallbacks.has(family), family).toBe(true);
    for (const [family, id] of cat.fallbacks) {
      const part = cat.parts.get(id);
      expect(part, `${family} -> ${id}`).toBeDefined();
      expect(Object.hasOwn(part!.frames, 'rest'), `${family} -> ${id}`).toBe(true);
    }
  });
});
