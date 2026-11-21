import { describe, expect, it } from 'vitest';
import { parseCatalogueText } from '@cf/art-format';
import type { SlotName } from '@cf/art-format';
import { buildRecipe, type Recipe } from '@cf/art-recipe';
import { assemble, type PixelBuffer } from '@cf/art-compose';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';

// Small tier (48x32). The torso is a 4x2 block of 2 with its anchor at its top-left pixel; at
// origin (10,10) it covers x 10-13, y 10-11. Its attach points land on the canvas at:
// head (14,10), tail (9,10), back (11,9), far0 (10,11), near0 (11,11), near1 (12,11), glow (13,10).
// Every other frame has its anchor on its top-left pixel, so its anchor pixel is where it lands.
const PARTS = `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:4,0,tail:-1,0,back:1,-1,far0:0,1,near0:1,1,near1:2,1,glow:3,0
2222
2222

frame hop anchor=0,0 attach=head:4,1
2222
2222

part quadruped/farLimbs/leg/small/v0
frame rest anchor=0,0
5
5

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
6
6

part quadruped/head/h1/small/v0
frame rest anchor=0,0 attach=eye0:1,0,eye1:2,0,feature:0,-1
333

frame bite anchor=0,0 attach=eye0:0,0
33

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
d

part quadruped/headFeature/horn/small/v0
frame rest anchor=0,0
c

part quadruped/tail/t1/small/v0
frame rest anchor=0,0
7

part quadruped/back/fin/small/v0
frame rest anchor=0,0
8

part quadruped/back/norest/small/v0
frame wave anchor=0,0
8

part quadruped/glow/orb/small/v0
frame rest anchor=0,0
f

part quadruped/torso/offset/small/v0
frame rest anchor=1,1 attach=head:4,0
2222
2222

part quadruped/torso/wide/small/v0
frame rest anchor=0,0
22222
`;

const SCAFFOLDS = `
scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
pose step
entry head 0 rest 2 0
pose shove
entry torso 0 rest 1 0
pose strike contact=20,12
entry torso 0 rest 0 0
pose bite
entry head 0 bite 0 0
pose odd
entry torso 0 hop 0 0
entry back 0 flap 0 0
pose limbs
entry farLimbs 0 rest 0 1
entry nearLimbs 1 rest 0 1
pose eyes
entry eyes 1 rest 0 1

scaffold quadruped/edge/small origin=45,20
pose rest
entry torso 0 rest 0 0

scaffold quadruped/bottom/small origin=-2,31
pose rest
entry torso 0 rest 0 0

scaffold quadruped/norest/small origin=10,10
pose step
entry torso 0 rest 3 0

scaffold quadruped/movedrest/small origin=10,10
pose rest
entry torso 0 rest 2 1
`;

const catalogue = parseCatalogueText(HEADER + PARTS + SCAFFOLDS);

const ID: Record<string, string> = {
  torso: 'quadruped/torso/sturdy/small/v0',
  wide: 'quadruped/torso/wide/small/v0',
  offset: 'quadruped/torso/offset/small/v0',
  far: 'quadruped/farLimbs/leg/small/v0',
  near: 'quadruped/nearLimbs/leg/small/v0',
  head: 'quadruped/head/h1/small/v0',
  eye: 'quadruped/eyes/eye/small/v0',
  horn: 'quadruped/headFeature/horn/small/v0',
  tail: 'quadruped/tail/t1/small/v0',
  fin: 'quadruped/back/fin/small/v0',
  norest: 'quadruped/back/norest/small/v0',
  orb: 'quadruped/glow/orb/small/v0',
};

type Spec = readonly [SlotName, number, string];
function recipeOf(parts: readonly Spec[], over: Partial<Recipe> = {}): Recipe {
  return {
    version: 1, identity: 'test', family: 'quadruped', tier: 'small', scaffoldId: 'quadruped/sturdy/small',
    parts: parts.map(([slot, index, key]) => ({ slot, index, partId: ID[key] ?? key, source: 'own' as const })),
    ramps: { primary: 'c0', accent: 'c1', underside: 'c0-under' },
    marking: { pattern: 0, flip: false, dx: 0, dy: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    glow: false, gaps: [],
    ...over,
  };
}

const at = (b: PixelBuffer, x: number, y: number): number => b.pixels[y * b.w + x] ?? -1;
const count = (b: PixelBuffer, v?: number): number => b.pixels.filter((p) => (v === undefined ? p !== 0 : p === v)).length;
/** Every non-zero pixel as "x,y=v", in row-major order. */
const drawn = (b: PixelBuffer): string[] => {
  const out: string[] = [];
  for (let i = 0; i < b.pixels.length; i++) if (b.pixels[i] !== 0) out.push(`${i % b.w},${Math.floor(i / b.w)}=${b.pixels[i]}`);
  return out;
};
const TORSO = ['10,10=2', '11,10=2', '12,10=2', '13,10=2', '10,11=2', '11,11=2', '12,11=2', '13,11=2'];

describe('assemble: placement', () => {
  it('(a) places the torso anchor pixel at the scaffold origin and draws nothing else', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso']]), 'rest', catalogue);
    expect([r.buffer.w, r.buffer.h]).toEqual([48, 32]);
    expect(drawn(r.buffer)).toEqual(TORSO);
    expect(r.gaps).toEqual([]);
  });

  it('adds the torso pose offset to the origin, and attached parts follow the torso', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head']]), 'shove', catalogue);
    expect(at(r.buffer, 10, 10)).toBe(0);
    expect(at(r.buffer, 11, 10)).toBe(2);
    expect([at(r.buffer, 15, 10), at(r.buffer, 16, 10), at(r.buffer, 17, 10)]).toEqual([3, 3, 3]);
    expect(count(r.buffer)).toBe(11);
  });

  it('(b) lands the head anchor on the torso head attach point', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head']]), 'rest', catalogue);
    expect(drawn(r.buffer)).toEqual([...TORSO.slice(0, 4), '14,10=3', '15,10=3', '16,10=3', ...TORSO.slice(4)]);
  });

  it('reads attach points relative to the host frame anchor, not its top-left corner', () => {
    // anchor (1,1) at origin (10,10): the torso covers x 9-12, y 9-10; head point (4,0) lands at (13,9).
    const r = assemble(recipeOf([['torso', 0, 'offset'], ['head', 0, 'head']]), 'rest', catalogue);
    expect(drawn(r.buffer)).toEqual(['9,9=2', '10,9=2', '11,9=2', '12,9=2', '13,9=3', '14,9=3', '15,9=3', '9,10=2', '10,10=2', '11,10=2', '12,10=2']);
  });

  it('(c) a pose offset of dx 2 moves that part two pixels and nothing else', () => {
    const recipe = recipeOf([['torso', 0, 'torso'], ['head', 0, 'head']]);
    const rest = assemble(recipe, 'rest', catalogue).buffer;
    const step = assemble(recipe, 'step', catalogue).buffer;
    const headOf = (b: PixelBuffer): string[] => drawn(b).filter((s) => s.endsWith('=3'));
    expect(headOf(rest)).toEqual(['14,10=3', '15,10=3', '16,10=3']);
    expect(headOf(step)).toEqual(['16,10=3', '17,10=3', '18,10=3']);
    expect(drawn(step).filter((s) => !s.endsWith('=3'))).toEqual(TORSO);
  });

  it('adds the recipe head shift to the head and the tail shift to the tail, and to nothing else', () => {
    const recipe = recipeOf([['tail', 0, 'tail'], ['torso', 0, 'torso'], ['head', 0, 'head']], { shift: { head: [1, -1], tail: [-1, 1] } });
    const r = assemble(recipe, 'rest', catalogue);
    expect(drawn(r.buffer)).toEqual(['15,9=3', '16,9=3', '17,9=3', ...TORSO.slice(0, 4), '8,11=7', ...TORSO.slice(4)]);
  });

  it('places tail, back and glow on their torso attach points', () => {
    const r = assemble(recipeOf([['tail', 0, 'tail'], ['torso', 0, 'torso'], ['back', 0, 'fin'], ['glow', 0, 'orb']]), 'rest', catalogue);
    expect(at(r.buffer, 9, 10)).toBe(7);
    expect(at(r.buffer, 11, 9)).toBe(8);
    expect(at(r.buffer, 13, 10)).toBe(15);
    expect(count(r.buffer)).toBe(10);
  });

  it('places eyes on the head eye<i> points and the head feature on the head feature point', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head'], ['headFeature', 0, 'horn'], ['eyes', 0, 'eye'], ['eyes', 1, 'eye']]), 'rest', catalogue);
    expect(drawn(r.buffer).filter((s) => !TORSO.includes(s))).toEqual(['14,9=12', '14,10=3', '15,10=13', '16,10=13']);
  });

  it('places head-relative parts from where the head actually landed: pose offset and head shift included', () => {
    const recipe = recipeOf([['torso', 0, 'torso'], ['head', 0, 'head'], ['headFeature', 0, 'horn'], ['eyes', 0, 'eye']], { shift: { head: [0, 1], tail: [0, 0] } });
    const r = assemble(recipe, 'step', catalogue);
    // head anchor (14,10) + step dx 2 + shift (0,1) = (16,11); eye0 one to the right; feature one above.
    expect(drawn(r.buffer).filter((s) => !TORSO.includes(s))).toEqual(['16,10=12', '16,11=3', '17,11=13', '18,11=3']);
  });

  it('an eye pose entry offsets that eye only, matched by slot and index', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head'], ['eyes', 0, 'eye'], ['eyes', 1, 'eye']]), 'eyes', catalogue);
    expect(at(r.buffer, 15, 10)).toBe(13);
    expect(at(r.buffer, 16, 10)).toBe(3);
    expect(at(r.buffer, 16, 11)).toBe(13);
  });

  it('takes attach points from the frame actually used in the pose', () => {
    // bite has only eye0, at its own anchor pixel; rest has eye0 one pixel right.
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head'], ['eyes', 0, 'eye'], ['eyes', 1, 'eye']]), 'bite', catalogue);
    expect(drawn(r.buffer).filter((s) => !TORSO.includes(s))).toEqual(['14,10=13', '15,10=3']);
    expect(r.gaps).toEqual(['attach:eye1']);
    // the torso hop frame moves the head point down one row; its rest-frame points are not used.
    const hop = assemble(recipeOf([['torso', 0, 'torso'], ['head', 0, 'head'], ['back', 0, 'fin']]), 'odd', catalogue);
    expect(at(hop.buffer, 14, 11)).toBe(3);
    expect(at(hop.buffer, 14, 10)).toBe(0);
    expect(hop.gaps).toEqual([`frame:${ID['fin']}:flap`, 'attach:back']);
  });

  it('(d) a near limb draws over the torso and a far limb under it', () => {
    const r = assemble(recipeOf([['farLimbs', 0, 'far'], ['torso', 0, 'torso'], ['nearLimbs', 0, 'near']]), 'rest', catalogue);
    expect(at(r.buffer, 10, 11)).toBe(2); // far limb top pixel hidden by the torso
    expect(at(r.buffer, 10, 12)).toBe(5);
    expect(at(r.buffer, 11, 11)).toBe(6); // near limb top pixel over the torso
    expect(at(r.buffer, 11, 12)).toBe(6);
  });

  it('draws parts in recipe order, not slot order', () => {
    const before = assemble(recipeOf([['torso', 0, 'torso'], ['glow', 0, 'orb']]), 'rest', catalogue);
    const after = assemble(recipeOf([['glow', 0, 'orb'], ['torso', 0, 'torso']]), 'rest', catalogue);
    expect(at(before.buffer, 13, 10)).toBe(15);
    expect(at(after.buffer, 13, 10)).toBe(2);
  });

  it('limb pose entries apply by slot and index', () => {
    const r = assemble(recipeOf([['farLimbs', 0, 'far'], ['torso', 0, 'torso'], ['nearLimbs', 0, 'near'], ['nearLimbs', 1, 'near']]), 'limbs', catalogue);
    expect([at(r.buffer, 10, 12), at(r.buffer, 10, 13)]).toEqual([5, 5]);
    expect([at(r.buffer, 11, 11), at(r.buffer, 11, 12), at(r.buffer, 11, 13)]).toEqual([6, 6, 0]);
    expect([at(r.buffer, 12, 11), at(r.buffer, 12, 12), at(r.buffer, 12, 13)]).toEqual([2, 6, 6]);
  });
});

describe('assemble: limb counts from a genome', () => {
  // Genome: quadruped/sturdy (body 0), small (size 0), no tail, head h1, no eyes (eyes gene 5).
  const base = { kingdom: 'fauna', body: 0, loco: 0, size: 0, head: 1, tail: 0, eyes: 5, color: 0, accent: 0, pattern: 0, lumin: false };

  it('(e) three limbs compose as one far at far0 and two near at near0 and near1', () => {
    const recipe = buildRecipe({ ...base, limbs: 4 }, [], catalogue);
    expect(recipe.parts.map((p) => `${p.slot}${p.index}`)).toEqual(['farLimbs0', 'torso0', 'nearLimbs0', 'nearLimbs1', 'head0']);
    const r = assemble(recipe, 'rest', catalogue);
    expect(at(r.buffer, 10, 12)).toBe(5);
    expect(count(r.buffer, 5)).toBe(1);
    expect([at(r.buffer, 11, 11), at(r.buffer, 11, 12), at(r.buffer, 12, 11), at(r.buffer, 12, 12)]).toEqual([6, 6, 6, 6]);
    expect(count(r.buffer, 6)).toBe(4);
  });

  it('(f) zero limbs compose a torso with no limb slots filled', () => {
    const recipe = buildRecipe({ ...base, limbs: 5 }, [], catalogue);
    const r = assemble(recipe, 'rest', catalogue);
    expect(recipe.parts.map((p) => p.slot)).toEqual(['torso', 'head']);
    expect(at(r.buffer, 10, 10)).toBe(2);
    expect(count(r.buffer, 5) + count(r.buffer, 6)).toBe(0);
    expect(count(r.buffer, 3)).toBe(3);
  });
});

describe('assemble: canvas edge, contact, pose', () => {
  it('(g) clips a part that overhangs the canvas instead of wrapping it', () => {
    // origin (45,20): the 4x2 torso would cover x 45-48 on a 48-wide canvas; column 48 must not wrap to x 0.
    const r = assemble(recipeOf([['torso', 0, 'torso']], { scaffoldId: 'quadruped/edge/small' }), 'rest', catalogue);
    expect(drawn(r.buffer)).toEqual(['45,20=2', '46,20=2', '47,20=2', '45,21=2', '46,21=2', '47,21=2']);
    // origin (-2,31): the torso would cover x -2..1, y 31-32; only x 0-1 of the last row survive.
    const corner = assemble(recipeOf([['torso', 0, 'torso']], { scaffoldId: 'quadruped/bottom/small' }), 'rest', catalogue);
    expect(drawn(corner.buffer)).toEqual(['0,31=2', '1,31=2']);
  });

  it('(h) the strike pose returns its contact point and rest returns null', () => {
    const recipe = recipeOf([['torso', 0, 'torso']]);
    expect(assemble(recipe, 'strike', catalogue).contact).toEqual([20, 12]);
    expect(assemble(recipe, 'rest', catalogue).contact).toBeNull();
  });

  it('(j) a pose the scaffold lacks, including names an object would inherit, uses the rest pose and records pose:<poseId>', () => {
    const recipe = recipeOf([['torso', 0, 'torso']], { gaps: ['variant:a'] });
    const rest = assemble(recipe, 'rest', catalogue);
    for (const poseId of ['nope', 'toString', '__proto__']) {
      const r = assemble(recipe, poseId, catalogue);
      expect(r.buffer.pixels).toEqual(rest.buffer.pixels);
      expect(r.contact).toBeNull();
      expect(r.gaps).toEqual(['variant:a', `pose:${poseId}`]);
    }
  });

  it('(j) a lacking pose takes the rest pose offsets', () => {
    const recipe = recipeOf([['torso', 0, 'torso']], { scaffoldId: 'quadruped/movedrest/small' });
    const r = assemble(recipe, 'strike', catalogue);
    expect(drawn(r.buffer)).toEqual(['12,11=2', '13,11=2', '14,11=2', '15,11=2', '12,12=2', '13,12=2', '14,12=2', '15,12=2']);
    expect(r.gaps).toEqual(['pose:strike']);
  });

  it('(j) a lacking pose on a scaffold with no rest pose uses no offsets and records the same gap', () => {
    const recipe = recipeOf([['torso', 0, 'torso']], { scaffoldId: 'quadruped/norest/small' });
    const r = assemble(recipe, 'strike', catalogue);
    expect(drawn(r.buffer)).toEqual(TORSO);
    expect(r.contact).toBeNull();
    expect(r.gaps).toEqual(['pose:strike']);
    expect(assemble(recipe, 'rest', catalogue).gaps).toEqual(['pose:rest']);
  });

  it('a part with no pose entry uses its rest frame with no offset', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['back', 0, 'fin']]), 'shove', catalogue);
    // shove offsets only the torso; the fin follows the torso back point (12,9) with no offset of its own.
    expect(at(r.buffer, 12, 9)).toBe(8);
    expect(r.gaps).toEqual([]);
  });
});

describe('assemble: gaps (i)', () => {
  it('a missing named frame falls back to rest and records frame:<partId>:<frame>', () => {
    const r = assemble(recipeOf([['torso', 0, 'wide']]), 'odd', catalogue);
    expect(drawn(r.buffer)).toEqual(['10,10=2', '11,10=2', '12,10=2', '13,10=2', '14,10=2']);
    expect(r.gaps).toEqual([`frame:${ID['wide']}:hop`]);
  });

  it('a part with neither the named frame nor rest is skipped with frame:<partId>:<frame>', () => {
    const named = assemble(recipeOf([['torso', 0, 'torso'], ['back', 0, 'norest']]), 'odd', catalogue);
    expect(named.gaps).toContain(`frame:${ID['norest']}:flap`);
    const unnamed = assemble(recipeOf([['torso', 0, 'torso'], ['back', 0, 'norest']]), 'rest', catalogue);
    expect(unnamed.gaps).toEqual([`frame:${ID['norest']}:rest`]);
    expect(drawn(unnamed.buffer)).toEqual(TORSO);
  });

  it('an attach point the torso does not define records attach:<name> and skips the part', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['nearLimbs', 0, 'near'], ['nearLimbs', 2, 'near']]), 'rest', catalogue);
    expect(r.gaps).toEqual(['attach:near2']);
    expect(count(r.buffer, 6)).toBe(2);
  });

  it('head-relative parts with no head in the recipe are skipped with attach:<name>', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['headFeature', 0, 'horn'], ['eyes', 0, 'eye']]), 'rest', catalogue);
    expect(r.gaps).toEqual(['attach:feature', 'attach:eye0']);
    expect(drawn(r.buffer)).toEqual(TORSO);
  });

  it('a part id the catalogue does not hold is skipped with missing:<partId>', () => {
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['tail', 0, 'quadruped/tail/t6/small/v0']]), 'rest', catalogue);
    expect(r.gaps).toEqual(['missing:quadruped/tail/t6/small/v0']);
    expect(drawn(r.buffer)).toEqual(TORSO);
  });

  it('returns the recipe gaps first, then assembly gaps in the order met', () => {
    const recipe = recipeOf([['tail', 0, 'quadruped/tail/t6/small/v0'], ['torso', 0, 'torso'], ['nearLimbs', 3, 'near'], ['eyes', 0, 'eye']], { gaps: ['variant:a', 'missing:b'] });
    expect(assemble(recipe, 'rest', catalogue).gaps).toEqual(['variant:a', 'missing:b', 'missing:quadruped/tail/t6/small/v0', 'attach:near3', 'attach:eye0']);
  });

  it('a missing scaffold returns an empty buffer of the tier, null contact and scaffold:<id>, without throwing', () => {
    const recipe = recipeOf([['torso', 0, 'torso']], { tier: 'medium', scaffoldId: 'quadruped/none/medium', gaps: ['variant:a'] });
    const r = assemble(recipe, 'nope', catalogue);
    expect([r.buffer.w, r.buffer.h]).toEqual([96, 64]);
    expect(count(r.buffer)).toBe(0);
    expect(r.contact).toBeNull();
    expect(r.gaps).toEqual(['variant:a', 'scaffold:quadruped/none/medium']);
  });

  it('without a torso, every torso-attached part is skipped with attach:<name>', () => {
    const r = assemble(recipeOf([['tail', 0, 'tail'], ['head', 0, 'head']]), 'rest', catalogue);
    expect(r.gaps).toEqual(['attach:tail', 'attach:head']);
    expect(count(r.buffer)).toBe(0);
  });
});
