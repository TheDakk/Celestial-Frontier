import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, MARK_SLOTS, parseCatalogueText } from '@cf/art-format';
import type { SlotName } from '@cf/art-format';
import { buildRecipe, type Recipe, type RecipePart } from '@cf/art-recipe';
import { assemble, compose, frameNameFor, poseEntryFor, type PixelBuffer } from '@cf/art-compose';

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

part quadruped/torso/legged/small/v0
frame rest anchor=0,0 attach=near0:1,5,near0_2:4,5,far0:0,5
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

scaffold quadruped/legged/small origin=10,10
pose rest
entry torso 0 rest 0 0
pose both
entry nearLimbs 0 rest 0 0
entry nearLimbs 0 rest 3 0 legs=2
pose other
entry nearLimbs 0 brace 3 0 legs=4

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
  legged: 'quadruped/torso/legged/small/v0',
};

type Spec = readonly [SlotName, number, string];
function recipeOf(parts: readonly Spec[], over: Partial<Recipe> = {}): Recipe {
  return {
    version: 1, identity: 'test', family: 'quadruped', tier: 'small', scaffoldId: 'quadruped/sturdy/small',
    parts: parts.map(([slot, index, key]) => ({ slot, index, partId: ID[key] ?? key, source: 'own' as const })),
    ramps: { primary: 'c0', accent: 'c1', underside: 'c0-under', iris: 'iris0' },
    marking: { pattern: 0, strength: 2, phase: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    legs: 4, glow: false, gaps: [],
    opacity: 100, airborne: false, theme: null, rim: 0, skin: null,
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

describe('the frame-choice rule the composer and the checker share', () => {
  const legged = catalogue.scaffolds.get('quadruped/legged/small')!;
  const near = catalogue.parts.get(ID['near']!)!;
  const torso = catalogue.parts.get(ID['torso']!)!;

  it('poseEntryFor: the entry for this leg count wins, then the one with no leg count, then none', () => {
    const both = legged.poses['both']!.entries;
    // both: `entry nearLimbs 0 rest 0 0`, then `entry nearLimbs 0 rest 3 0 legs=2`.
    expect(poseEntryFor(both, 'nearLimbs', 0, 2)).toBe(both[1]);
    expect(poseEntryFor(both, 'nearLimbs', 0, 4)).toBe(both[0]);
    expect(poseEntryFor(both, 'nearLimbs', 1, 2)).toBeUndefined();
    expect(poseEntryFor(legged.poses['other']!.entries, 'nearLimbs', 0, 2)).toBeUndefined();
  });

  it('frameNameFor: the entry\'s frame when the part has it, else rest; rest with no entry', () => {
    expect(frameNameFor(torso, { slot: 'torso', index: 0, frame: 'hop', dx: 0, dy: 0 })).toBe('hop');
    expect(frameNameFor(near, { slot: 'nearLimbs', index: 0, frame: 'brace', dx: 3, dy: 0, legs: 4 })).toBe('rest');
    expect(frameNameFor(near, undefined)).toBe('rest');
  });
});

describe('assemble: iris', () => {
  const irisCatalogue = parseCatalogueText(HEADER + `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:4,0
2222
2222

part quadruped/head/h5/small/v0
frame rest anchor=0,0 attach=eye0:1,0
555

part quadruped/head/h6/small/v0
frame rest anchor=0,0 attach=eye0:1,0
5d8

part quadruped/eyes/iris/small/v0
frame rest anchor=0,0
5d8

part quadruped/eyes/pit/small/v0
frame rest anchor=0,0
6

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
`);
  it('an eye part drawn 5 d 8 lands as 17 13 20', () => {
    const r = assemble(recipeOf([['torso', 0, 'quadruped/torso/sturdy/small/v0'], ['head', 0, 'quadruped/head/h5/small/v0'], ['eyes', 0, 'quadruped/eyes/iris/small/v0']]), 'rest', irisCatalogue);
    expect([at(r.buffer, 15, 10), at(r.buffer, 16, 10), at(r.buffer, 17, 10)]).toEqual([17, 13, 20]);
  });
  it('a sensory pit is an eye part: drawn 6, it lands as 18', () => {
    const r = assemble(recipeOf([['torso', 0, 'quadruped/torso/sturdy/small/v0'], ['head', 0, 'quadruped/head/h5/small/v0'], ['eyes', 0, 'quadruped/eyes/pit/small/v0']]), 'rest', irisCatalogue);
    expect(at(r.buffer, 15, 10)).toBe(18);
  });
  it('a head drawn with 5 stays 5', () => {
    const r = assemble(recipeOf([['torso', 0, 'quadruped/torso/sturdy/small/v0'], ['head', 0, 'quadruped/head/h6/small/v0']]), 'rest', irisCatalogue);
    expect([at(r.buffer, 14, 10), at(r.buffer, 15, 10), at(r.buffer, 16, 10)]).toEqual([5, 13, 8]);
  });
  it('an eye over an accent-valued head pixel shows 17-20, never 5-8', () => {
    const r = assemble(recipeOf([['torso', 0, 'quadruped/torso/sturdy/small/v0'], ['head', 0, 'quadruped/head/h5/small/v0'], ['eyes', 0, 'quadruped/eyes/iris/small/v0']]), 'rest', irisCatalogue);
    expect([at(r.buffer, 14, 10)]).toEqual([5]);
    expect(count(r.buffer, 17) + count(r.buffer, 20)).toBe(2);
    expect(r.buffer.pixels.filter((p) => p === 6 || p === 7 || p === 8).length).toBe(0);
  });
});

describe('assemble: stance by leg count', () => {
  // The legged torso (origin 10,10) hangs its near legs from y 5 of the frame: each leg's top pixel lands on canvas row 15.
  const LEG_ROW = 15;
  const stance = (legs: number, pose: string, extra: readonly Spec[] = []): { x: number; gaps: readonly string[] } => {
    const r = assemble(recipeOf([['torso', 0, 'legged'], ['nearLimbs', 0, 'near'], ...extra], { scaffoldId: 'quadruped/legged/small', legs }), pose, catalogue);
    let x = -1;
    for (let i = 0; i < r.buffer.w; i++) if (at(r.buffer, i, LEG_ROW) === 6) { x = i; break; }
    return { x, gaps: r.gaps };
  };

  it('a two-legged creature hangs its near leg from near0_2', () => {
    expect(stance(2, 'rest').x).toBe(14);
  });
  it('a four-legged creature uses near0', () => {
    expect(stance(4, 'rest').x).toBe(11);
  });
  it('the most specific entry wins', () => {
    expect(stance(2, 'both').x).toBe(14 + 3);
    expect(stance(4, 'both').x).toBe(11);
  });
  it('an entry for another leg count alone does not apply', () => {
    const r = stance(2, 'other');
    expect(r.x).toBe(14);
    expect(r.gaps).toEqual([]);
  });
  it('an attach name for another leg count alone is not used', () => {
    const only = parseCatalogueText(HEADER + `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=near0:1,1,near0_4:3,1
2222
2222

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
6
6

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
`);
    const r = assemble(recipeOf([['torso', 0, 'torso'], ['nearLimbs', 0, 'near']], { legs: 2 }), 'rest', only);
    expect(at(r.buffer, 11, 11)).toBe(6);
    expect(r.gaps).toEqual([]);
  });
  it('only a limb takes a leg-count attach name: at two legs the head, an eye and the head feature land on their plain points', () => {
    // head_2, eye0_2 and feature_2 each sit somewhere else; none of them is ever used.
    const named = parseCatalogueText(HEADER + `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:4,0,head_2:4,3
2222
2222

part quadruped/head/h1/small/v0
frame rest anchor=0,0 attach=eye0:1,0,eye0_2:2,0,feature:0,-1,feature_2:2,-1
333

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
d

part quadruped/headFeature/horn/small/v0
frame rest anchor=0,0
c

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
`);
    const parts: Spec[] = [['torso', 0, 'torso'], ['head', 0, 'head'], ['headFeature', 0, 'horn'], ['eyes', 0, 'eye']];
    // The head at the plain head point (14,10), the eye at its eye0 (15,10), the feature at its plain feature point (14,9).
    const plain = ['14,9=12', ...TORSO.slice(0, 4), '14,10=3', '15,10=13', '16,10=3', ...TORSO.slice(4)];
    for (const legs of [2, 4]) {
      const r = assemble(recipeOf(parts, { legs }), 'rest', named);
      expect(drawn(r.buffer), `legs ${legs}`).toEqual(plain);
      expect(r.gaps).toEqual([]);
    }
  });
});

describe('assemble: a jelly\'s organelles', () => {
  // The torso's top row holds the accent ramp 5 6 7 8 (organelles), its bottom row the body 2; a flow line covers both.
  const jellyCatalogue = parseCatalogueText(HEADER + `
part gelatinous/torso/body/small/v0
frame rest anchor=0,0
5678
2222
layer flow
1111
1111

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
`);
  const row = (b: PixelBuffer, y: number): number[] => [at(b, 10, y), at(b, 11, y), at(b, 12, y), at(b, 13, y)];
  const torso = (family: string, pattern: number): Recipe => recipeOf([], {
    family,
    parts: [{ slot: 'torso', index: 0, partId: 'gelatinous/torso/body/small/v0', source: 'own', mark: { offset: 0, rolls: new Array<number>(15).fill(0) } }],
    marking: { pattern, strength: 2, phase: 0 },
  });

  it('a jelly\'s torso drawn 5 6 7 8 lands as 17 18 19 20 and a striped mark never covers it', () => {
    const plain = assemble(torso('gelatinous', 0), 'rest', jellyCatalogue);
    expect(row(plain.buffer, 10)).toEqual([17, 18, 19, 20]);
    expect(row(plain.buffer, 11)).toEqual([2, 2, 2, 2]);
    const striped = assemble(torso('gelatinous', 1), 'rest', jellyCatalogue);
    expect(row(striped.buffer, 10)).toEqual([17, 18, 19, 20]);
    // The mark is painted on the body row, so the stripe did reach the frame.
    expect(row(striped.buffer, 11)).toEqual([5, 5, 5, 5]);
    expect(striped.gaps).toEqual([]);
    // The catalogue's frame is never changed.
    expect([...jellyCatalogue.parts.get('gelatinous/torso/body/small/v0')!.frames['rest']!.pixels]).toEqual([5, 6, 7, 8, 2, 2, 2, 2]);
  });

  it('a quadruped torso drawn 5 stays 5', () => {
    const plain = assemble(torso('quadruped', 0), 'rest', jellyCatalogue);
    expect(row(plain.buffer, 10)).toEqual([5, 6, 7, 8]);
    // Without the rewrite, the same stripe paints over the organelle row (the jelly test's planted-fault twin).
    const striped = assemble(torso('quadruped', 1), 'rest', jellyCatalogue);
    expect(row(striped.buffer, 10)).not.toEqual([5, 6, 7, 8]);
  });

  it('only the torso of a jelly is rewritten: its other parts keep 5 to 8', () => {
    const cat = parseCatalogueText(HEADER + `
part gelatinous/torso/body/small/v0
frame rest anchor=0,0 attach=tail:-1,0
2222

part gelatinous/tail/t2/small/v0
frame rest anchor=0,0
5

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
`);
    const r = assemble(recipeOf([['torso', 0, 'gelatinous/torso/body/small/v0'], ['tail', 0, 'gelatinous/tail/t2/small/v0']], { family: 'gelatinous' }), 'rest', cat);
    expect(at(r.buffer, 9, 10)).toBe(5);
  });
});

describe('assemble: marks', () => {
  // The torso's rest frame has flow lines 1-4 along its length; its lunge frame has none.
  // Its spots-only twin serves spotted but not striped. Each leg is a 1x2 spot.
  const MARK_TEXT = HEADER + `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=near0:1,1,near1:2,1,head:4,0,back:1,-1
2222
2222
layer flow
1234
1234

frame lunge anchor=0,0 attach=near0:1,1,near1:2,1
2222
2222

part quadruped/torso/spotty/small/v0
frame rest anchor=0,0
2222
2222
layer spots
11..
11..

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
6
6
layer spots
1
1

part quadruped/head/h1/small/v0
frame rest anchor=0,0 attach=eye0:1,0
333

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
5d8
layer flow
111

part quadruped/back/fin/small/v0
frame rest anchor=0,0
2
layer flow
1

part quadruped/back/bare/small/v0
frame rest anchor=0,0
2

scaffold quadruped/sturdy/small origin=10,10
pose rest
entry torso 0 rest 0 0
pose lunge
entry torso 0 lunge 0 0
pose hop
entry torso 0 hop 0 0
`;
  const marked = parseCatalogueText(MARK_TEXT);
  const TORSO_ID = 'quadruped/torso/sturdy/small/v0';
  const SPOTTY_ID = 'quadruped/torso/spotty/small/v0';
  const LEG_ID = 'quadruped/nearLimbs/leg/small/v0';
  const ZERO = new Array<number>(15).fill(0);
  type MarkedSpec = readonly [SlotName, number, string, { offset: number; rolls: readonly number[] } | undefined];
  const markedRecipe = (parts: readonly MarkedSpec[], pattern: number, phase = 0): Recipe => recipeOf([], {
    parts: parts.map(([slot, index, partId, mark]) => (mark === undefined ? { slot, index, partId, source: 'own' as const } : { slot, index, partId, source: 'own' as const, mark })),
    marking: { pattern, strength: 2, phase },
  });
  const torsoRow = (b: PixelBuffer, y: number): number[] => [at(b, 10, y), at(b, 11, y), at(b, 12, y), at(b, 13, y)];

  it('paints a part that carries a mark before stacking it', () => {
    const r = assemble(markedRecipe([['torso', 0, TORSO_ID, { offset: 0, rolls: ZERO }]], 1), 'rest', marked);
    expect(torsoRow(r.buffer, 10)).toEqual([5, 5, 2, 2]);
    expect(torsoRow(r.buffer, 11)).toEqual([5, 5, 2, 2]);
    expect(r.gaps).toEqual([]);
  });

  it('moves the stripes by the creature phase plus the part offset modulo the spread', () => {
    // phase 13 + (4 % 3) = 14: flow 1 -> 14 % 5 = 4 (off), flow 2 -> 0 (on), flow 3 -> 1 (on), flow 4 -> 2 (off).
    const r = assemble(markedRecipe([['torso', 0, TORSO_ID, { offset: 4, rolls: ZERO }]], 1, 13), 'rest', marked);
    expect(torsoRow(r.buffer, 10)).toEqual([2, 5, 5, 2]);
    // phase 14 + (2 % 3) = 16, which wraps to 1: flow 1 -> 1 (on), flow 2 -> 2 (off), flow 4 -> 4 (off).
    const w = assemble(markedRecipe([['torso', 0, TORSO_ID, { offset: 2, rolls: ZERO }]], 1, 14), 'rest', marked);
    expect(torsoRow(w.buffer, 10)).toEqual([5, 2, 2, 2]);
  });

  it('the same recipe with pattern 0 is unpainted', () => {
    const r = assemble(markedRecipe([['torso', 0, TORSO_ID, { offset: 0, rolls: ZERO }]], 0), 'rest', marked);
    expect(drawn(r.buffer)).toEqual(TORSO);
    expect(r.gaps).toEqual([]);
  });

  it('a part without a mark is unpainted whatever the pattern', () => {
    for (let pattern = 0; pattern < 8; pattern++) {
      const r = assemble(markedRecipe([['torso', 0, TORSO_ID, undefined]], pattern), 'rest', marked);
      expect(drawn(r.buffer)).toEqual(TORSO);
      expect(r.gaps).toEqual([]);
    }
  });

  it('buildRecipe gives a mark to every part in a mark slot of a patterned creature, and none to a plain one', () => {
    const base = { kingdom: 'fauna', body: 0, loco: 0, size: 0, head: 1, tail: 0, eyes: 0, limbs: 1, color: 0, accent: 0, lumin: false };
    for (let pattern = 0; pattern < 8; pattern++) {
      const recipe = buildRecipe({ ...base, pattern }, [], catalogue);
      expect(recipe.parts.length).toBeGreaterThan(0);
      const marked = recipe.parts.filter((p) => p.mark !== undefined);
      if (pattern === 0) expect(marked).toEqual([]);
      else expect(marked.map((p) => p.slot)).toEqual(recipe.parts.filter((p) => MARK_SLOTS.includes(p.slot)).map((p) => p.slot));
    }
  });

  it('marks are covered by whatever covers the part', () => {
    const r = assemble(markedRecipe([['torso', 0, TORSO_ID, { offset: 0, rolls: ZERO }], ['nearLimbs', 0, LEG_ID, undefined]], 1), 'rest', marked);
    expect(at(r.buffer, 10, 11)).toBe(5);
    expect(at(r.buffer, 11, 11)).toBe(6); // the leg over a stripe pixel
    expect(at(r.buffer, 11, 12)).toBe(6);
  });

  it('two parts sharing one part id are painted from their own marks', () => {
    const r = assemble(markedRecipe([
      ['torso', 0, TORSO_ID, undefined],
      ['nearLimbs', 0, LEG_ID, { offset: 0, rolls: [0, ...ZERO.slice(1)] }],
      ['nearLimbs', 1, LEG_ID, { offset: 0, rolls: [99, ...ZERO.slice(1)] }],
    ], 2), 'rest', marked);
    expect([at(r.buffer, 11, 11), at(r.buffer, 11, 12)]).toEqual([5, 5]);
    expect([at(r.buffer, 12, 11), at(r.buffer, 12, 12)]).toEqual([6, 6]);
  });

  it('a frame with no serving layer adds marks:<part id>:<frame> and is drawn unpainted', () => {
    const r = assemble(markedRecipe([['torso', 0, SPOTTY_ID, { offset: 0, rolls: ZERO }]], 1), 'rest', marked);
    expect(drawn(r.buffer)).toEqual(TORSO);
    expect(r.gaps).toEqual([`marks:${SPOTTY_ID}:rest`]);
    // the same part serves spotted
    const s = assemble(markedRecipe([['torso', 0, SPOTTY_ID, { offset: 0, rolls: ZERO }]], 2), 'rest', marked);
    expect(torsoRow(s.buffer, 10)).toEqual([5, 5, 2, 2]);
    expect(s.gaps).toEqual([]);
  });

  it('the gap names the frame actually drawn when a pose frame falls back to rest', () => {
    const r = assemble(markedRecipe([['torso', 0, SPOTTY_ID, { offset: 0, rolls: ZERO }]], 1), 'hop', marked);
    expect(r.gaps).toEqual([`frame:${SPOTTY_ID}:hop`, `marks:${SPOTTY_ID}:rest`]);
  });

  it('a pose frame without layers gets the gap and no marks from another frame (Review Focus 1)', () => {
    const recipe = markedRecipe([['torso', 0, TORSO_ID, { offset: 0, rolls: ZERO }]], 1);
    const r = assemble(recipe, 'lunge', marked);
    expect(r.gaps).toEqual([`marks:${TORSO_ID}:lunge`]);
    expect(drawn(r.buffer)).toEqual(TORSO);
    // rest, on the same recipe, does paint: the lunge result is not a painter that never paints.
    expect(torsoRow(assemble(recipe, 'rest', marked).buffer, 10)).toEqual([5, 5, 2, 2]);
  });

  it('an eye part carrying a mark is never painted and gets no gap', () => {
    const r = assemble(markedRecipe([
      ['torso', 0, TORSO_ID, undefined],
      ['head', 0, 'quadruped/head/h1/small/v0', undefined],
      ['eyes', 0, 'quadruped/eyes/eye/small/v0', { offset: 0, rolls: ZERO }],
    ], 1), 'rest', marked);
    // the eye's own 5 d 8, with 5 and 8 written as iris 17 and 20; a painted eye would turn its 8 into a stripe 6, shown as 18.
    expect([at(r.buffer, 15, 10), at(r.buffer, 16, 10), at(r.buffer, 17, 10)]).toEqual([17, 13, 20]);
    expect(r.gaps).toEqual([]);
  });

  it('a back part carrying a mark is never painted and gets no gap', () => {
    const r = assemble(markedRecipe([
      ['torso', 0, TORSO_ID, undefined],
      ['back', 0, 'quadruped/back/fin/small/v0', { offset: 0, rolls: ZERO }],
    ], 1), 'rest', marked);
    expect(at(r.buffer, 11, 9)).toBe(2);
    expect(r.gaps).toEqual([]);
    const bare = assemble(markedRecipe([
      ['torso', 0, TORSO_ID, undefined],
      ['back', 0, 'quadruped/back/bare/small/v0', { offset: 0, rolls: ZERO }],
    ], 1), 'rest', marked);
    expect(at(bare.buffer, 11, 9)).toBe(2);
    expect(bare.gaps).toEqual([]);
  });

  it('the catalogue\'s frames are unchanged by composing a marked creature', () => {
    const fresh = parseCatalogueText(MARK_TEXT); // its own catalogue: no earlier test can have touched it
    const snapshot = (): unknown => [...fresh.parts.values()].map((p) => Object.entries(p.frames).map(([n, f]) => [n, Array.from(f.pixels), Object.entries(f.layers ?? {}).map(([k, v]) => [k, Array.from(v)])]));
    const before = snapshot();
    const recipe = markedRecipe([['torso', 0, TORSO_ID, { offset: 1, rolls: ZERO }], ['nearLimbs', 0, LEG_ID, { offset: 0, rolls: ZERO }]], 1);
    for (const pose of ['rest', 'lunge', 'hop']) {
      assemble(recipe, pose, fresh);
      compose(recipe, pose, fresh);
    }
    assemble({ ...recipe, marking: { pattern: 2, strength: 2, phase: 0 } }, 'rest', fresh);
    expect(snapshot()).toEqual(before);
  });
});

describe('assemble: wings and body features', () => {
  // Small tier, torso 4x2 of value 2 at origin (10,10): x 10-13, y 10-11. Its points land on the canvas at:
  // wing (11,9), wing1 (13,9), back (11,10), far0 and near0 (11,12), eye0 (13,10), head (14,10).
  // Each wing is a column of four pixels from its anchor down; far wing 4, near wing 9, far leg 3, near leg 6,
  // back part 8, body feature 5 (two pixels wide), eye 13.
  const WING_PARTS = `
part quadruped/torso/winged/small/v0
frame rest anchor=0,0 attach=wing:1,-1,wing1:3,-1,back:1,0,far0:1,2,near0:1,2,eye0:3,0,head:4,0
2222
2222

part quadruped/farWings/w/small/v0
frame rest anchor=0,0
4
4
4
4

part quadruped/nearWings/w/small/v0
frame rest anchor=0,0
9
9
9
9

part quadruped/farLimbs/leg/small/v0
frame rest anchor=0,0
3

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
6

part quadruped/back/fin/small/v0
frame rest anchor=0,0
8

part quadruped/bodyFeature/plate/small/v0
frame rest anchor=0,0
55

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
d

scaffold quadruped/winged/small origin=10,10
pose rest
entry torso 0 rest 0 0
`;
  const wingCat = parseCatalogueText(HEADER + WING_PARTS);
  const W: Record<string, string> = {
    torso: 'quadruped/torso/winged/small/v0', farWing: 'quadruped/farWings/w/small/v0', nearWing: 'quadruped/nearWings/w/small/v0',
    far: 'quadruped/farLimbs/leg/small/v0', near: 'quadruped/nearLimbs/leg/small/v0', fin: 'quadruped/back/fin/small/v0',
    plate: 'quadruped/bodyFeature/plate/small/v0', eye: 'quadruped/eyes/eye/small/v0',
  };
  type WingSpec = readonly [SlotName, number, string, RecipePart['at']?];
  /** A recipe with its parts in DRAW_ORDER then index, as the recipe builders give them, so the picture follows DRAW_ORDER. */
  const wingRecipe = (specs: readonly WingSpec[]): Recipe => {
    const sorted = [...specs].sort((a, b) => DRAW_ORDER.indexOf(a[0]) - DRAW_ORDER.indexOf(b[0]) || a[1] - b[1]);
    const base = recipeOf([], { scaffoldId: 'quadruped/winged/small' });
    return { ...base, parts: sorted.map(([slot, index, key, at]) => ({ slot, index, partId: W[key] ?? key, source: 'own' as const, ...(at === undefined ? {} : { at }) })) };
  };
  const column = (b: PixelBuffer, x: number, y0: number, y1: number): number[] => Array.from({ length: y1 - y0 + 1 }, (_, i) => at(b, x, y0 + i));

  it('wing index 0 hangs from wing and index 1 from wing1', () => {
    for (const [slot, key, v] of [['farWings', 'farWing', 4], ['nearWings', 'nearWing', 9]] as const) {
      const r = assemble(wingRecipe([['torso', 0, 'torso'], [slot, 0, key], [slot, 1, key]]), 'rest', wingCat);
      expect(r.gaps).toEqual([]);
      // Above the torso only the wings show: index 0 at x 11, index 1 at x 13, both from y 9.
      expect([at(r.buffer, 11, 9), at(r.buffer, 12, 9), at(r.buffer, 13, 9)]).toEqual([v, 0, v]);
      expect(count(r.buffer, v)).toBe(slot === 'farWings' ? 4 : 8); // a far wing is under the torso; a near wing over it
    }
  });

  it('a body feature hangs from back, over the torso and under the back part', () => {
    const r = assemble(wingRecipe([['torso', 0, 'torso'], ['bodyFeature', 0, 'plate'], ['back', 0, 'fin']]), 'rest', wingCat);
    expect(r.gaps).toEqual([]);
    // The plate covers (11,10) and (12,10) on the torso; the fin covers (11,10).
    expect([at(r.buffer, 10, 10), at(r.buffer, 11, 10), at(r.buffer, 12, 10), at(r.buffer, 13, 10)]).toEqual([2, 8, 5, 2]);
  });

  it('a near wing is drawn over the back part and under a near leg', () => {
    const r = assemble(wingRecipe([['torso', 0, 'torso'], ['back', 0, 'fin'], ['nearWings', 0, 'nearWing'], ['nearLimbs', 0, 'near']]), 'rest', wingCat);
    expect(r.gaps).toEqual([]);
    // The wing column x 11, y 9-12: wing, wing over the fin, wing over the torso, the near leg over the wing.
    expect(column(r.buffer, 11, 9, 12)).toEqual([9, 9, 9, 6]);
  });

  it('a far wing is drawn under the far legs', () => {
    const r = assemble(wingRecipe([['torso', 0, 'torso'], ['farWings', 0, 'farWing'], ['farLimbs', 0, 'far']]), 'rest', wingCat);
    expect(r.gaps).toEqual([]);
    // x 11, y 9-12: wing, torso over the wing twice, the far leg over the wing.
    expect(column(r.buffer, 11, 9, 12)).toEqual([4, 2, 2, 3]);
  });

  it('a part with at hangs from that point', () => {
    // An eye hung from the torso's eye0, with no head part: it lands at (13,10) with no attach gap.
    const hung = assemble(wingRecipe([['torso', 0, 'torso'], ['eyes', 0, 'eye', { host: 'torso', point: 'eye0' }]]), 'rest', wingCat);
    expect(hung.gaps).toEqual([]);
    expect(at(hung.buffer, 13, 10)).toBe(13);
    expect(count(hung.buffer, 13)).toBe(1);
    // Without at the same eye looks for a head and is skipped.
    const plain = assemble(wingRecipe([['torso', 0, 'torso'], ['eyes', 0, 'eye']]), 'rest', wingCat);
    expect(plain.gaps).toEqual(['attach:eye0']);
    expect(count(plain.buffer, 13)).toBe(0);
    // Whatever its slot: a far wing at index 0 sent to wing1 lands at x 13, not x 11.
    const moved = assemble(wingRecipe([['torso', 0, 'torso'], ['farWings', 0, 'farWing', { host: 'torso', point: 'wing1' }]]), 'rest', wingCat);
    expect(moved.gaps).toEqual([]);
    expect([at(moved.buffer, 11, 9), at(moved.buffer, 13, 9)]).toEqual([0, 4]);
    // A point the host lacks is reported by its own name.
    const lost = assemble(wingRecipe([['torso', 0, 'torso'], ['eyes', 0, 'eye', { host: 'torso', point: 'nowhere' }]]), 'rest', wingCat);
    expect(lost.gaps).toEqual(['attach:nowhere']);
  });
});
