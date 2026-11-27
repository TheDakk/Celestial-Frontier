import { describe, expect, it } from 'vitest';
import { EYE_COUNTS, LIMB_COUNTS, MARK_SLOTS, TIER_SIZE, fallbackKey, type Catalogue, type Part, type Scaffold, type SizeTier } from '@cf/art-format';
import { buildRecipe, EYELESS_HEAD, type Recipe } from '@cf/art-recipe';
import { assemble, compose, type PixelBuffer } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { gapIsInfo } from '../../../tools/check-pack.mjs';
import { makeGenome } from '@cf/domain-genome';
import { poseSweepBudget } from '../../../tests/support/budget';

// A pose-sweep file: it composes every gene combination and every shift of the placeholder parts. Its tests take the pose-sweep budget, for the reason written at POSE_SWEEP_BUDGET_MS.
poseSweepBudget();

const cat = testCatalogue();
const POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
// The ten four-legged torso types, by body gene: sturdy, stilt, shelled, membranous, crystalline, tusked, horned, spindly,
// squat, fourwinged (on land: grazers in the deep forest canopy).
const QUADRUPED_BODIES = [0, 2, 6, 7, 8, 10, 11, 12, 13, 14];
const BAD_GAP = /^(missing|attach|frame|scaffold|fallback):/;

const genome = (body: number, head: number, tail: number, limbs: number, eyes: number) =>
  ({ kingdom: 'fauna', body, head, tail, limbs, eyes, size: 2, loco: 0, habitat: 0, color: 3, accent: 5, pattern: 0, skin: 0 });
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
              if (!out.buffer.pixels.includes(16)) expect.fail(`no outline pixel for ${JSON.stringify(g)}`);
              // Every family draws on its own medium scaffold: no error gap (a missing back part is information).
              const bad = out.gaps.filter((gap) => BAD_GAP.test(gap) && !gapIsInfo(gap));
              if (bad.length > 0) expect.fail(`gaps ${bad.join(' ')} for ${JSON.stringify(g)}`);
              if (recipe.family === 'quadruped') {
                // An eye shows its highlight (14); the eyeless head and no eyes show two pits (13, no highlight).
                const pits = head === EYELESS_HEAD || EYE_COUNTS[eyes] === 0;
                if (!out.buffer.pixels.includes(13) || out.buffer.pixels.includes(14) === pits) expect.fail(`eye pixel wrong for ${JSON.stringify(g)}`);
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
      expect(recipe.family, `body ${body}`).toBe('quadruped');
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
    allDifferent((v) => genome(0, 3, v, 1, 1), [0, 1, 2, 3, 4, 5, 6]);
    allDifferent((v) => genome(v, 3, 3, 1, 1), QUADRUPED_BODIES);
  });

  it('composes movement genes 4 and 13 (swimmers) as a fish on its own scaffold, not a fallback', () => {
    for (const loco of [4, 13]) {
      const g = { ...genome(0, 3, 3, 1, 1), loco };
      const recipe = buildRecipe(g, [], cat);
      expect(recipe.family, `loco ${loco}`).toBe('fish');
      expect(cat.scaffolds.has(recipe.scaffoldId), `loco ${loco}`).toBe(true);
      expect(compose(recipe, 'rest', cat).gaps.filter((gap) => !gapIsInfo(gap)), `loco ${loco}`).toEqual([]);
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
  // The eight fauna families a generated creature can be, then the other three kingdoms.
  const FAMILIES = ['quadruped', 'fish', 'insect', 'serpent', 'tentacled', 'gelatinous', 'radial', 'crustacean', 'flora', 'fungi', 'microbe'];
  const TIERS = ['small', 'medium', 'large', 'guardian'] as const;
  const frameOf = (family: string, tier: SizeTier) => cat.parts.get(cat.fallbacks.get(fallbackKey(family, tier))!)!.frames['rest']!;

  it('has one for each of the eleven families at all four tiers, and no other', () => {
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

describe('format 2 placeholder parts', () => {
  type G = ReturnType<typeof genome> & { pattern: number; skin: number };
  const full = (body: number, head: number, tail: number, limbs: number, skin: number, pattern: number): G =>
    ({ ...genome(body, head, tail, limbs, 3), skin, pattern });
  const fallbackIds = new Set(cat.fallbacks.values());
  const markParts = [...cat.parts.values()].filter((p) => p.family === 'quadruped' && MARK_SLOTS.includes(p.slot) && !fallbackIds.has(p.id));
  /** The catalogue with `edit` applied to every part: a copy, the shared catalogue is never changed. */
  const editParts = (edit: (part: Part) => Part): Catalogue => ({ ...cat, parts: new Map([...cat.parts].map(([id, p]) => [id, edit(p)])) });
  const withoutLayers = editParts((p) => ({ ...p, frames: Object.fromEntries(Object.entries(p.frames).map(([n, { layers: _drop, ...f }]) => [n, f])) }));

  it('every frame of every four-legged part in a mark slot has flow and spots layers', () => {
    // 10 torsos, 10 heads, 7 tails (t0 to t6), the shared leg and three roles on each side, the flippers of membranous
    // and the shared flipper, 2 x 3 wings (wing-membranous, wing-fourwinged, hindwing-fourwinged), the shared sails and sails-stilt.
    expect(markParts.length).toBe(10 + 10 + 7 + 8 + 2 + 6 + 2);
    for (const part of markParts) {
      for (const [name, frame] of Object.entries(part.frames)) {
        for (const layer of ['flow', 'spots'] as const) {
          const grid = frame.layers?.[layer];
          expect(grid?.some((v) => v !== 0), `${part.id} ${name} ${layer}`).toBe(true);
        }
      }
    }
  });

  it('buildRecipe finds every part with no gap but variant:', () => {
    let count = 0;
    for (const body of QUADRUPED_BODIES) for (let skin = 0; skin < 9; skin++) for (let limbs = 0; limbs < 6; limbs++) for (const pattern of [0, 1]) for (let head = 0; head < 10; head++) {
      const g = full(body, head, 1 + (head % 6), limbs, skin, pattern);
      // A translucent creature on a torso without a translucent layer meets a skin: gap only when composed.
      const bad = buildRecipe(g, [], cat).gaps.filter((gap) => !gap.startsWith('variant:'));
      count++;
      if (bad.length > 0) expect.fail(`gaps ${bad.join(' ')} for ${JSON.stringify(g)}`);
    }
    expect(count).toBe(10 * 9 * 6 * 2 * 10);
  });

  it('a creature built by buildRecipe composes every pattern with no marks: gap, and each of the seven differs from plain', () => {
    for (const body of QUADRUPED_BODIES) for (const limbs of [0, 3, 4]) {
      const plain = buildRecipe(full(body, 3, 1, limbs, 4, 0), [], cat);
      for (const pose of POSES) {
        const plainHash = compose(plain, pose, cat).hash;
        const hashes = new Set<string>();
        for (let pattern = 1; pattern < 8; pattern++) {
          const recipe = buildRecipe(full(body, 3, 1, limbs, 4, pattern), [], cat);
          const where = `body ${body} limbs ${limbs} pattern ${pattern} ${pose}`;
          expect(recipe.parts.filter((p) => p.mark !== undefined).length, where).toBeGreaterThan(0);
          const out = compose(recipe, pose, cat);
          expect(out.gaps.filter((gap) => gap.startsWith('marks:')), where).toEqual([]);
          hashes.add(out.hash);
          // The same creature unpainted: the marks themselves change the picture, not only the pattern gene's other streams.
          expect(out.hash, where).not.toBe(compose({ ...recipe, marking: { ...recipe.marking, pattern: 0 } }, pose, cat).hash);
          // Negative control: with every layer removed the painter has nothing to paint, says so, and draws the unpainted picture.
          const bare = compose(recipe, pose, withoutLayers);
          expect(bare.gaps.some((gap) => gap.startsWith('marks:')), where).toBe(true);
          expect(bare.hash, where).toBe(compose({ ...recipe, marking: { ...recipe.marking, pattern: 0 } }, pose, withoutLayers).hash);
        }
        expect(hashes.has(plainHash), `body ${body} limbs ${limbs} ${pose}`).toBe(false);
        expect(hashes.size, `body ${body} limbs ${limbs} ${pose}`).toBe(7);
      }
    }
  });

  it('the hand-drawn striped tail differs from the same tail painted from its guide layers', () => {
    const T1 = 'quadruped/tail/t1/medium/v0';
    expect(cat.parts.get(T1)!.frames['rest']!.layers?.striped).toBeDefined();
    const guided = editParts((p) => {
      if (p.id !== T1) return p;
      const { striped: _drop, ...guides } = p.frames['rest']!.layers ?? {};
      return { ...p, frames: { rest: { ...p.frames['rest']!, layers: guides } } };
    });
    expect(guided.parts.get(T1)!.frames['rest']!.layers?.striped).toBeUndefined();
    for (const body of QUADRUPED_BODIES) {
      const striped = buildRecipe(full(body, 3, 1, 3, 4, 1), [], cat);
      expect(striped.parts.some((p) => p.partId === T1)).toBe(true);
      for (const pose of POSES) expect(compose(striped, pose, guided).hash, `body ${body} ${pose}`).not.toBe(compose(striped, pose, cat).hash);
      // Control: a banded tail reads only the guide layers, so removing the striped layer changes nothing.
      const banded = buildRecipe(full(body, 3, 1, 3, 4, 3), [], cat);
      expect(compose(banded, 'rest', guided).hash, `body ${body}`).toBe(compose(banded, 'rest', cat).hash);
    }
  });

  it('back parts, head features and role legs stay inside the canvas in every pose', () => {
    const inside = (recipe: Recipe, where: string): void => {
      for (const pose of POSES) {
        const { w, h, pixels } = compose(recipe, pose, cat).buffer;
        for (let x = 0; x < w; x++) if (pixels[x] !== 0 || pixels[(h - 1) * w + x] !== 0) expect.fail(`edge touched ${where} ${pose}`);
        for (let y = 0; y < h; y++) if (pixels[y * w] !== 0 || pixels[y * w + w - 1] !== 0) expect.fail(`edge touched ${where} ${pose}`);
      }
    };
    const slots = new Set<string>();
    for (const body of QUADRUPED_BODIES) {
      for (let skin = 0; skin < 9; skin++) for (const head of [6, 7, 8]) {
        const recipe = buildRecipe(full(body, head, 6, 3, skin, 0), [], cat);
        for (const p of recipe.parts) slots.add(p.slot);
        inside(recipe, `body ${body} skin ${skin} head ${head}`);
      }
      for (let head = 0; head < 10; head++) for (let limbs = 0; limbs < 6; limbs++) {
        const recipe = buildRecipe(full(body, head, 4, limbs, 0, 0), [], cat);
        inside(recipe, `body ${body} head ${head} limbs ${limbs}`);
      }
    }
    expect([...slots].sort()).toEqual(['back', 'bodyFeature', 'eyes', 'farLimbs', 'farWings', 'head', 'headFeature', 'nearLimbs', 'nearWings', 'tail', 'torso']);
  });
});

describe('format 2 placeholder stance and iris', () => {
  const STURDY = 'quadruped/torso/sturdy/medium/v0';
  const twoLegs = LIMB_COUNTS.indexOf(2);
  const eightLegs = LIMB_COUNTS.indexOf(8);
  const g = (limbs: number, eyes = 3) => ({ ...genome(0, 3, 4, limbs, eyes), skin: 3 });
  /** The catalogue with the sturdy torso's leg-count attach points removed: a copy. */
  const noLegCountPoints = (): Catalogue => {
    const parts = new Map(cat.parts);
    const torso = cat.parts.get(STURDY)!;
    const frames = Object.fromEntries(Object.entries(torso.frames).map(([n, f]) =>
      [n, { ...f, attach: Object.fromEntries(Object.entries(f.attach).filter(([name]) => !/_\d+$/.test(name))) }]));
    parts.set(STURDY, { ...torso, frames });
    return { ...cat, parts };
  };
  /** The catalogue with every legs= entry removed from every scaffold: a copy. */
  const noLegCountEntries = (): Catalogue => ({
    ...cat,
    scaffolds: new Map([...cat.scaffolds].map(([id, sc]): [string, Scaffold] => [id, {
      ...sc,
      poses: Object.fromEntries(Object.entries(sc.poses).map(([name, pose]) => [name, { ...pose, entries: pose.entries.filter((e) => e.legs === undefined) }])),
    }])),
  });

  it('a two-legged sturdy creature stands on near0_2', () => {
    const torso = cat.parts.get(STURDY)!;
    for (const frame of Object.values(torso.frames)) {
      expect(frame.attach['near0_2']).toBeDefined();
      expect(frame.attach['far0_2']).toBeDefined();
    }
    const without = noLegCountPoints();
    expect(without.parts.get(STURDY)!.frames['rest']!.attach['near0_2']).toBeUndefined();
    const recipe = buildRecipe(g(twoLegs), [], cat);
    expect(recipe.legs).toBe(2);
    for (const pose of POSES) {
      expect(compose(recipe, pose, cat).hash, pose).not.toBe(compose(recipe, pose, without).hash);
      // Control: a four-legged creature never reads a _2 point.
      const four = buildRecipe(g(LIMB_COUNTS.indexOf(4)), [], cat);
      expect(compose(four, pose, cat).hash, pose).toBe(compose(four, pose, without).hash);
    }
  });

  it('the sturdy scaffold has a legs=2 and a legs=8 entry, and each changes its creature\'s picture', () => {
    const entries = Object.values(cat.scaffolds.get('quadruped/sturdy/medium')!.poses).flatMap((p) => p.entries);
    expect(entries.some((e) => e.legs === 2)).toBe(true);
    expect(entries.some((e) => e.legs === 8)).toBe(true);
    const bare = noLegCountEntries();
    for (const [limbs, legs] of [[twoLegs, 2], [eightLegs, 8]] as const) {
      const recipe = buildRecipe(g(limbs), [], cat);
      const poses = new Set(Object.entries(cat.scaffolds.get('quadruped/sturdy/medium')!.poses).filter(([, p]) => p.entries.some((e) => e.legs === legs)).map(([name]) => name));
      expect(poses.size, `legs ${legs}`).toBeGreaterThan(0);
      for (const pose of POSES) {
        const same = compose(recipe, pose, cat).hash === compose(recipe, pose, bare).hash;
        expect(same, `legs ${legs} ${pose}`).toBe(!poses.has(pose));
      }
    }
    // Control: a four-legged creature is drawn the same with or without the entries.
    const four = buildRecipe(g(LIMB_COUNTS.indexOf(4)), [], cat);
    for (const pose of POSES) expect(compose(four, pose, cat).hash, pose).toBe(compose(four, pose, bare).hash);
  });

  it('every eye shows an iris pixel 17-20', () => {
    const eye = cat.parts.get('quadruped/eyes/eye/medium/v0')!.frames['rest']!;
    expect([...eye.pixels].some((v) => v >= 5 && v <= 8)).toBe(true);
    for (const body of QUADRUPED_BODIES) for (let head = 0; head < 10; head++) for (let eyes = 0; eyes < 6; eyes++) {
      const recipe = buildRecipe({ ...genome(body, head, 3, 1, eyes) }, [], cat);
      const count = recipe.parts.filter((p) => p.slot === 'eyes').length;
      const { pixels } = compose(recipe, 'rest', cat).buffer;
      const iris = pixels.filter((v) => v >= 17 && v <= 20).length;
      const where = `body ${body} head ${head} eyes ${eyes}`;
      if (count === 0 ? iris !== 0 : iris < count) expect.fail(`${where}: ${count} eyes, ${iris} iris pixels`);
    }
    // Control: with the eye's iris pixels made plain body pixels, no picture holds 17-20.
    const plainEye = { ...cat, parts: new Map(cat.parts) };
    plainEye.parts.set('quadruped/eyes/eye/medium/v0', { ...cat.parts.get('quadruped/eyes/eye/medium/v0')!, frames: { rest: { ...eye, pixels: eye.pixels.map((v) => (v >= 5 && v <= 8 ? 2 : v)) } } });
    const recipe = buildRecipe(genome(0, 3, 3, 1, 3), [], plainEye);
    expect(compose(recipe, 'rest', plainEye).buffer.pixels.some((v) => v >= 17 && v <= 20)).toBe(false);
  });
});
