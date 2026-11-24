import { describe, expect, it } from 'vitest';
import { parseCatalogueText, type PartFrame, type SlotName } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';
import { blit, compose, createBuffer, finish, hashBuffer, toAscii, type PixelBuffer } from '@cf/art-compose';

const frameOf = (w: number, h: number, values: number[]): PartFrame => ({ w, h, pixels: Uint8Array.from(values), anchor: [0, 0], attach: {} });
const solid = (w: number, h: number, v: number): PartFrame => frameOf(w, h, new Array<number>(w * h).fill(v));
const at = (b: PixelBuffer, x: number, y: number): number => b.pixels[y * b.w + x] ?? -1;
const count = (b: PixelBuffer, v?: number): number => b.pixels.filter((p) => (v === undefined ? p !== 0 : p === v)).length;
/** The w x h window of the text form whose top-left corner is (x, y). */
const crop = (b: PixelBuffer, x: number, y: number, w: number, h: number): string =>
  toAscii(b).split('\n').slice(y, y + h).map((line) => line.slice(x, x + w)).join('\n');

describe('finish: iris values', () => {
  it('never changes 17 to 20, but outlines them', () => {
    const b = createBuffer('medium');
    blit(b, frameOf(4, 1, [17, 18, 19, 20]), 10, 10);
    finish(b);
    expect(crop(b, 9, 9, 6, 3)).toBe(['.gggg.', 'ghijkg', '.gggg.'].join('\n'));
  });

  it('a ramp pixel with an iris pixel above it and to its left is not lit, as beside any solid pixel', () => {
    // The ramp pixel 2 at (11,11) has `beside` above it and to its left, and a ramp pixel 3 below it, so it is never shaded.
    const litWith = (beside: number): number => {
      const b = createBuffer('small');
      blit(b, frameOf(2, 3, [0, beside, beside, 2, 0, 3]), 10, 10);
      finish(b);
      return at(b, 11, 11);
    };
    expect(litWith(17)).toBe(2);
    expect(litWith(20)).toBe(2);
    expect(litWith(4)).toBe(2); // beside ramp pixels: the same
    expect(litWith(0)).toBe(3); // with nothing there it is lit
  });
});

describe('finish', () => {
  it('outlines a 3x3 block of 2 on four sides, lights its top-left pixel and shades its bottom row', () => {
    const b = createBuffer('medium');
    blit(b, solid(3, 3, 2), 10, 10);
    finish(b);
    expect(crop(b, 8, 8, 7, 7)).toBe([
      '.......',
      '..ggg..',
      '.g322g.',
      '.g222g.',
      '.g111g.',
      '..ggg..',
      '.......',
    ].join('\n'));
    expect(count(b)).toBe(9 + 12);
  });

  it('lights only a ramp pixel whose up and left neighbours were both transparent, staying inside its ramp', () => {
    // Each column is two pixels tall: the top pixel qualifies for light only, the bottom pixel (value 1) for shade only.
    const b = createBuffer('small');
    const tops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    tops.forEach((v, i) => blit(b, frameOf(1, 2, [v, 1]), 2 + 3 * i, 5));
    finish(b);
    expect(tops.map((_, i) => at(b, 2 + 3 * i, 5))).toEqual([2, 3, 4, 4, 6, 7, 8, 8, 10, 11, 12, 12]);
  });

  it('shades only a ramp pixel whose down neighbour was transparent, staying inside its ramp', () => {
    // The top pixel of each column (value 3) shields the bottom one from light.
    const b = createBuffer('small');
    const bottoms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    bottoms.forEach((v, i) => blit(b, frameOf(1, 2, [3, v]), 2 + 3 * i, 5));
    finish(b);
    expect(bottoms.map((_, i) => at(b, 2 + 3 * i, 6))).toEqual([1, 1, 2, 3, 5, 5, 6, 7, 9, 9, 10, 11]);
  });

  it('a pixel that qualifies for both never changes, whatever its starting shade', () => {
    const b = createBuffer('small');
    const singles = [1, 2, 3, 4, 5, 8, 9, 12];
    singles.forEach((v, i) => blit(b, frameOf(1, 1, [v]), 2 + 3 * i, 5));
    finish(b);
    expect(singles.map((_, i) => at(b, 2 + 3 * i, 5))).toEqual(singles);
  });

  it('never changes 13, 14 or 15, but outlines them', () => {
    const b = createBuffer('small');
    blit(b, frameOf(1, 1, [13]), 2, 2);
    blit(b, frameOf(1, 1, [14]), 6, 2);
    blit(b, frameOf(1, 1, [15]), 10, 2);
    blit(b, frameOf(3, 1, [13, 14, 15]), 2, 8);
    finish(b);
    expect([at(b, 2, 2), at(b, 6, 2), at(b, 10, 2), at(b, 2, 8), at(b, 3, 8), at(b, 4, 8)]).toEqual([13, 14, 15, 13, 14, 15]);
    expect([at(b, 1, 2), at(b, 3, 2), at(b, 2, 1), at(b, 2, 3)]).toEqual([16, 16, 16, 16]);
  });

  it('decides from the buffer as it was before the outline: the outline is one pixel thick', () => {
    const b = createBuffer('small');
    blit(b, frameOf(1, 1, [2]), 5, 5);
    finish(b);
    expect(crop(b, 3, 3, 5, 5)).toBe(['.....', '..g..', '.g2g.', '..g..', '.....'].join('\n'));
  });

  it('treats neighbours outside the canvas as transparent and never writes outside it', () => {
    const b = createBuffer('small');
    blit(b, frameOf(1, 2, [2, 2]), 0, 0);
    blit(b, frameOf(1, 2, [2, 2]), 47, 30);
    finish(b);
    expect(crop(b, 0, 0, 2, 3)).toBe(['3g', '1g', 'g.'].join('\n'));
    expect(crop(b, 46, 29, 2, 3)).toBe(['.g', 'g3', 'g1'].join('\n'));
    expect(count(b)).toBe(10);
  });

  it('leaves a 16 already in the input alone and treats it as non-transparent', () => {
    const b = createBuffer('small');
    blit(b, frameOf(1, 2, [16, 2]), 5, 5);
    finish(b);
    expect(at(b, 5, 5)).toBe(16);
    expect(at(b, 5, 6)).toBe(1); // up was 16 (not transparent): no light; down transparent: shade
    expect(at(b, 5, 4)).toBe(16);
    expect(at(b, 4, 5)).toBe(16);
  });

  it('two separately drawn adjacent parts get no outline between them', () => {
    const b = createBuffer('small');
    blit(b, solid(2, 2, 2), 10, 10);
    blit(b, solid(2, 2, 6), 12, 10);
    finish(b);
    expect(crop(b, 9, 9, 6, 4)).toBe(['.gggg.', 'g3266g', 'g1155g', '.gggg.'].join('\n'));
  });
});

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const parsed = parseCatalogueText(`${HEADER}
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:2,0
22
22

part quadruped/head/h1/small/v0
frame rest anchor=0,0
6

part quadruped/torso/blob/small/v0
frame rest anchor=1,0
a6
66

part quadruped/torso/blob/medium/v0
frame rest anchor=0,0
a

part serpent/torso/coil/small/v0
frame wave anchor=0,0
6

frame wiggle anchor=0,0
a

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
pose strike contact=20,12

fallback quadruped quadruped/torso/blob/small/v0
fallback quadruped quadruped/torso/blob/medium/v0
`);
// The parser refuses a fallback to a missing part or one without a rest frame; compose still guards against a
// catalogue built in code, so these two are added after parsing.
const catalogue = { ...parsed, fallbacks: new Map([...parsed.fallbacks, ['serpent/medium', 'serpent/torso/coil/small/v0'], ['ghost/small', 'ghost/torso/none/small/v0']]) };

function recipeOf(parts: readonly (readonly [SlotName, number, string])[], over: Partial<Recipe> = {}): Recipe {
  return {
    version: 1, identity: 'test', family: 'quadruped', tier: 'small', scaffoldId: 'quadruped/sturdy/small',
    parts: parts.map(([slot, index, partId]) => ({ slot, index, partId, source: 'own' as const })),
    ramps: { primary: 'c0', accent: 'c1', underside: 'c0-under', iris: 'iris0' },
    marking: { pattern: 0, strength: 2, phase: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    legs: 4, eyes: 2, glow: false, gaps: [],
    opacity: 100, airborne: false, theme: null, rim: 0, skin: null,
    ...over,
  };
}
const TORSO = 'quadruped/torso/sturdy/small/v0';
// The quadruped fallback (anchor at its top-right pixel) placed at (10,10), finished: x 9-10, y 10-11.
const FALLBACK_AT_ORIGIN = ['.gg.', 'gb6g', 'g55g', '.gg.'].join('\n');

describe('compose', () => {
  it('assembles, finishes and hashes a recipe with parts', () => {
    const r = compose(recipeOf([['torso', 0, TORSO], ['head', 0, 'quadruped/head/h1/small/v0']]), 'strike', catalogue);
    expect(crop(r.buffer, 9, 9, 5, 4)).toBe(['.ggg.', 'g325g', 'g11g.', '.gg..'].join('\n'));
    expect(r.contact).toEqual([20, 12]);
    expect(r.gaps).toEqual([]);
    expect(r.hash).toBe(hashBuffer(r.buffer));
  });

  it('an empty recipe composes the family fallback at the scaffold origin, finished, with fallback:<family>', () => {
    const r = compose(recipeOf([], { gaps: ['missing:x'] }), 'rest', catalogue);
    expect(crop(r.buffer, 8, 9, 4, 4)).toBe(FALLBACK_AT_ORIGIN);
    expect(count(r.buffer)).toBe(12);
    expect(r.gaps).toEqual(['missing:x', 'fallback:quadruped']);
    expect(r.hash).toBe(hashBuffer(r.buffer));
  });

  it('a recipe naming a part the catalogue does not hold never throws and is never empty when a fallback exists', () => {
    const only = compose(recipeOf([['torso', 0, 'quadruped/torso/gone/small/v0']]), 'rest', catalogue);
    expect(crop(only.buffer, 8, 9, 4, 4)).toBe(FALLBACK_AT_ORIGIN);
    expect(only.gaps).toEqual(['missing:quadruped/torso/gone/small/v0', 'fallback:quadruped']);
  });

  // The picture of the fallback drawn alone at the scaffold origin: what an empty recipe composes.
  const fallbackAlone = (): Uint8Array => compose(recipeOf([]), 'rest', catalogue).buffer.pixels;
  const HEAD = 'quadruped/head/h1/small/v0';

  it('a creature whose pack lacks the head it asks for is drawn as the fallback alone, and the gap names the head', () => {
    // The head is missing whether the recipe still lists it or the planner already left it out with its gap.
    const listed = compose(recipeOf([['torso', 0, TORSO], ['head', 0, 'quadruped/head/gone/small/v0']]), 'strike', catalogue);
    expect(listed.buffer.pixels).toEqual(fallbackAlone());
    expect(listed.gaps).toEqual(['missing:quadruped/head/gone/small/v0', 'fallback:quadruped']);
    expect(listed.contact).toEqual([20, 12]);
    const leftOut = compose(recipeOf([['torso', 0, TORSO]], { gaps: ['missing:quadruped/head/h9/small/v0'] }), 'rest', catalogue);
    expect(leftOut.buffer.pixels).toEqual(fallbackAlone());
    expect(leftOut.gaps).toEqual(['missing:quadruped/head/h9/small/v0', 'fallback:quadruped']);
  });

  it('a creature whose pack lacks a leg it asks for, far or near, is drawn as the fallback alone', () => {
    for (const leg of ['quadruped/farLimbs/fore/small/v1', 'quadruped/nearLimbs/hind-sturdy/small/v0']) {
      const r = compose(recipeOf([['torso', 0, TORSO], ['head', 0, HEAD]], { gaps: [`missing:${leg}`] }), 'rest', catalogue);
      expect(r.buffer.pixels).toEqual(fallbackAlone());
      expect(r.gaps).toEqual([`missing:${leg}`, 'fallback:quadruped']);
    }
  });

  it('a creature whose pack lacks an optional part is drawn with its head and without that part, and the gap is kept', () => {
    const whole = compose(recipeOf([['torso', 0, TORSO], ['head', 0, HEAD]]), 'rest', catalogue);
    expect(crop(whole.buffer, 9, 9, 5, 4)).toBe(['.ggg.', 'g325g', 'g11g.', '.gg..'].join('\n'));
    for (const optional of ['back/ridge-sturdy', 'headFeature/horns-h1', 'tail/t2', 'bodyFeature/shell-shelled', 'nearWings/sails', 'farWings/wing-membranous', 'eyes/eye', 'nearLimbs/flipper', 'nearLimbs/flipper-membranous']) {
      const gap = `missing:quadruped/${optional}/small/v0`;
      const r = compose(recipeOf([['torso', 0, TORSO], ['head', 0, HEAD]], { gaps: [gap] }), 'rest', catalogue);
      expect(r.buffer.pixels, optional).toEqual(whole.buffer.pixels);
      expect(r.gaps).toEqual([gap]);
    }
  });

  it('a body that asks for no head is drawn as it is: no head is missing', () => {
    const r = compose(recipeOf([['torso', 0, TORSO]]), 'rest', catalogue);
    expect(crop(r.buffer, 9, 9, 4, 4)).toBe(['.gg.', 'g32g', 'g11g', '.gg.'].join('\n'));
    expect(r.gaps).toEqual([]);
  });

  it('a recipe whose parts all fail to place composes the fallback', () => {
    const r = compose(recipeOf([['head', 0, 'quadruped/head/h1/small/v0']]), 'rest', catalogue);
    expect(crop(r.buffer, 8, 9, 4, 4)).toBe(FALLBACK_AT_ORIGIN);
    expect(r.gaps).toEqual(['attach:head', 'fallback:quadruped']);
  });

  it('a pose the scaffold lacks composes like rest with pose:<poseId>, whether or not the fallback is drawn', () => {
    const drawnParts = compose(recipeOf([['torso', 0, TORSO]]), 'nope', catalogue);
    expect(drawnParts.hash).toBe(compose(recipeOf([['torso', 0, TORSO]]), 'rest', catalogue).hash);
    expect(drawnParts.gaps).toEqual(['pose:nope']);
    const fallback = compose(recipeOf([]), 'nope', catalogue);
    expect(crop(fallback.buffer, 8, 9, 4, 4)).toBe(FALLBACK_AT_ORIGIN);
    expect(fallback.gaps).toEqual(['pose:nope', 'fallback:quadruped']);
  });

  it('a missing scaffold composes the fallback for the family and tier at the canvas centre', () => {
    const r = compose(recipeOf([['torso', 0, TORSO]], { tier: 'medium', scaffoldId: 'quadruped/sturdy/medium' }), 'rest', catalogue);
    expect([r.buffer.w, r.buffer.h]).toEqual([96, 64]);
    // The medium quadruped fallback (one pixel, its anchor) at (48,32), finished: not the small one.
    expect(crop(r.buffer, 47, 31, 3, 3)).toBe(['.g.', 'gag', '.g.'].join('\n'));
    expect(count(r.buffer)).toBe(5);
    expect(r.contact).toBeNull();
    expect(r.gaps).toEqual(['scaffold:quadruped/sturdy/medium', 'fallback:quadruped']);
  });

  it('throws when the fallback part has no rest frame, like a missing entry or part', () => {
    expect(() => compose(recipeOf([['torso', 0, 'serpent/torso/coil/small/v0']], { family: 'serpent', tier: 'medium', scaffoldId: 'serpent/body/medium' }), 'rest', catalogue))
      .toThrow(new Error('no fallback for family serpent at medium'));
  });

  it('throws the exact message when the family has no fallback, or its fallback part is not in the catalogue', () => {
    expect(() => compose(recipeOf([], { family: 'radial' }), 'rest', catalogue)).toThrow(new Error('no fallback for family radial at small'));
    expect(() => compose(recipeOf([], { family: 'ghost' }), 'rest', catalogue)).toThrow(new Error('no fallback for family ghost at small'));
  });

  it('uses only the fallback for the recipe\'s own tier: a family with a fallback at one tier throws at another', () => {
    expect(() => compose(recipeOf([], { tier: 'large', scaffoldId: 'quadruped/sturdy/large' }), 'rest', catalogue))
      .toThrow(new Error('no fallback for family quadruped at large'));
    expect(() => compose(recipeOf([], { family: 'serpent', scaffoldId: 'serpent/body/small' }), 'rest', catalogue))
      .toThrow(new Error('no fallback for family serpent at small'));
  });

  it('gives the same hash twice and leaves the recipe unchanged', () => {
    const recipe = Object.freeze(recipeOf([['torso', 0, TORSO]]));
    const a = compose(recipe, 'rest', catalogue);
    const b = compose(recipe, 'rest', catalogue);
    expect(a.hash).toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(a.buffer.pixels).toEqual(b.buffer.pixels);
  });
});
