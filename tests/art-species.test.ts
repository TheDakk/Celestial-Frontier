import { colourTable, parseCatalogueText, TIER_SIZE } from '@cf/art-format';
import { buildSpeciesRecipe } from '@cf/art-recipe';
import { compose } from '@cf/art-compose';
import { testSpeciesCatalogue } from '@cf/art-testparts';
import { describe, expect, it } from 'vitest';

// A small named species, end to end: the torso is primary (1-4), the head and its own fore legs accent (5-8), the
// tail and the shared hind legs underside (9-12), the eyes accent, which the composer writes as iris (17-20).
const PACK = `palette
colour 0 000000
colour 1 445566
colour 2 778899
ramp civet 0 1 1 2
ramp civet-accent 1 1 2 2
ramp civet-under 2 2 1 0
ramp iris2 0 2 2 1
outline 0
eye 1
eyeHighlight 2
glow 1

species civet quadruped small legs=4 eyes=2 iris=2 tail=1

part quadruped/torso/civet/small/v0
frame rest anchor=0,0 attach=head:10,1,tail:1,1,far0:0,5,far1:3,5,near0:1,5,near1:4,5
222222222222
222222222222
222222222222
222222222222
222222222222
222222222222

part quadruped/head/civet/small/v0
frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1
666666
666666
666666
666666
666666

part quadruped/tail/civet/small/v0
frame rest anchor=4,0
aaaaa
aaaaa

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
6
${['farLimbs', 'nearLimbs'].map((slot) => `
part quadruped/${slot}/fore-civet/small/v0
frame rest anchor=0,0
66
66
66
66
66
66

part quadruped/${slot}/hind/small/v0
frame rest anchor=0,0
aa
aa
aa
aa
aa
aa
`).join('')}
scaffold quadruped/civet/small origin=16,12
pose rest
`;

const inRamp = (base: number) => (v: number): boolean => v >= base && v < base + 4;

describe('a named species composed end to end', () => {
  it('draws its own torso, head, tail, legs and eyes where the scaffold and attach points put them, in its own colours', () => {
    const catalogue = parseCatalogueText(PACK);
    const recipe = buildSpeciesRecipe('civet', catalogue);
    const out = compose(recipe, 'rest', catalogue);
    expect(out.gaps).toEqual([]);
    const { w, h, pixels } = out.buffer;
    expect([w, h]).toEqual([...TIER_SIZE.small]);

    // Each part's anchor lands on its host's attach point (the torso's anchor on the scaffold origin); a part pixel
    // (fx, fy) of a frame anchored at 0,0 lands at anchor + (fx, fy).
    const frame = (id: string) => catalogue.parts.get(id)!.frames['rest']!;
    const torso = frame('quadruped/torso/civet/small/v0');
    const head = frame('quadruped/head/civet/small/v0');
    const tail = frame('quadruped/tail/civet/small/v0');
    const [ox, oy] = catalogue.scaffolds.get('quadruped/civet/small')!.origin;
    const on = (host: readonly [number, number], hostFrame: typeof torso, point: string, anchor: readonly [number, number]): [number, number] =>
      [host[0] + hostFrame.attach[point]![0] - hostFrame.anchor[0] - anchor[0], host[1] + hostFrame.attach[point]![1] - hostFrame.anchor[1] - anchor[1]];
    const torsoAt: [number, number] = [ox, oy];
    const headAt = on(torsoAt, torso, 'head', [0, 0]);
    const value = ([x, y]: readonly [number, number], dx = 0, dy = 0): number => pixels[(y + dy) * w + x + dx]!;

    // The torso's middle, the head's far corner (beyond the torso), the tail's tip (left of the torso).
    expect(inRamp(1)(value(torsoAt, 4, 2))).toBe(true);
    expect(inRamp(5)(value(headAt, 4, 3))).toBe(true);
    const tailTip = on(torsoAt, torso, 'tail', tail.anchor);
    expect(inRamp(9)(value(tailTip, 1, 0))).toBe(true);
    // Legs below the torso: far0 and near0 are its own fore legs (accent), far1 and near1 the shared hind legs (underside).
    // Near legs are drawn over far ones, so each is read in a column no later leg covers.
    expect(inRamp(5)(value(on(torsoAt, torso, 'far0', [0, 0]), 0, 3))).toBe(true);
    expect(inRamp(5)(value(on(torsoAt, torso, 'near0', [0, 0]), 1, 3))).toBe(true);
    expect(inRamp(9)(value(on(torsoAt, torso, 'far1', [0, 0]), 0, 3))).toBe(true);
    expect(inRamp(9)(value(on(torsoAt, torso, 'near1', [0, 0]), 1, 3))).toBe(true);
    // Both eyes on the head's eye points, written as the iris ramp.
    for (const point of ['eye0', 'eye1']) expect(inRamp(17)(value(on(headAt, head, point, [0, 0])))).toBe(true);
    // Outside the creature the canvas is clear; beside it is the outline.
    expect(value([2, 2])).toBe(0);
    expect(value(tailTip, -1, 0)).toBe(16);

    // Every ramp the recipe names is in the palette, and the iris maps to iris2.
    const { table, unknown } = colourTable(catalogue.palette, recipe.ramps);
    expect(unknown).toEqual([]);
    expect(table.slice(17, 21)).toEqual([0x000000, 0x778899, 0x778899, 0x445566]);
  });
});

describe('the placeholder species with shapes of their own, composed end to end', () => {
  const catalogue = testSpeciesCatalogue();
  const POSES: Readonly<Record<string, readonly string[]>> = {
    testbird: ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'],
    testurchin: ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'],
    testsnail: ['rest', 'approach', 'recover', 'hit', 'faint'],
    testplant: ['rest', 'disturb', 'harvest', 'grow'],
  };
  /** Where a part's top left lands at rest: its anchor on the host's attach point; the host's top left is given. */
  const frame = (id: string) => catalogue.parts.get(id)!.frames['rest']!;
  const hung = (hostAt: readonly [number, number], hostId: string, point: string, id: string): [number, number] => {
    const host = frame(hostId);
    const part = frame(id);
    return [hostAt[0] + host.attach[point]![0] - part.anchor[0], hostAt[1] + host.attach[point]![1] - part.anchor[1]];
  };
  const torsoAt = (key: string, family: string): [number, number] => {
    const [ox, oy] = catalogue.scaffolds.get(`${family}/${key}/medium`)!.origin;
    const anchor = frame(`${family}/torso/${key}/medium/v0`).anchor;
    return [ox - anchor[0], oy - anchor[1]];
  };

  it('each composes in every pose of its own scaffold with no gap, and its scaffold holds exactly those poses', () => {
    for (const [key, poses] of Object.entries(POSES)) {
      const recipe = buildSpeciesRecipe(key, catalogue);
      expect(Object.keys(catalogue.scaffolds.get(recipe.scaffoldId)!.poses), key).toEqual(poses);
      for (const pose of poses) {
        const out = compose(recipe, pose, catalogue);
        expect(out.gaps, `${key} ${pose}`).toEqual([]);
        expect(out.buffer.pixels.some((v) => v >= 1 && v <= 12), `${key} ${pose}`).toBe(true);
      }
      const { unknown } = colourTable(catalogue.palette, recipe.ramps);
      expect(unknown, key).toEqual([]);
    }
    // Only a pose with a strike carries a contact point.
    expect(compose(buildSpeciesRecipe('testbird', catalogue), 'strike', catalogue).contact).toEqual([62, 25]);
    expect(compose(buildSpeciesRecipe('testsnail', catalogue), 'rest', catalogue).contact).toBeNull();
  });

  it('the test bird\'s wings rise from its torso\'s wing point, its crest sits on its head\'s feature point, its eye on its head', () => {
    const { w, pixels } = compose(buildSpeciesRecipe('testbird', catalogue), 'rest', catalogue).buffer;
    const value = ([x, y]: readonly [number, number], dx = 0, dy = 0): number => pixels[(y + dy) * w + x + dx]!;
    const id = (slot: string): string => `avian/${slot}/testbird/medium/v0`;
    const torso = torsoAt('testbird', 'avian');
    // The far wing's top row stands above the near wing's, and both above the torso: accent (5-8).
    const far = hung(torso, id('torso'), 'wing', id('farWings'));
    const near = hung(torso, id('torso'), 'wing', id('nearWings'));
    expect(far[1]).toBeLessThan(near[1]);
    expect(near[1]).toBeLessThan(torso[1]);
    expect(inRamp(5)(value(far, 1, 0))).toBe(true);
    expect(inRamp(5)(value(near, 8, 0))).toBe(true);
    // The near wing is drawn over the torso, the far wing under it: below the torso's top row the near wing's columns
    // are wing, the far wing's own columns torso (primary, 1-4).
    expect(inRamp(5)(value(near, 8, torso[1] - near[1] + 1))).toBe(true);
    expect(inRamp(1)(value(far, 1, torso[1] - far[1] + 1))).toBe(true);
    const head = hung(torso, id('torso'), 'head', id('head'));
    const crest = hung(head, id('head'), 'feature', id('headFeature'));
    expect(crest[1]).toBeLessThan(head[1]);
    expect(inRamp(5)(value(crest, 1, 0))).toBe(true);
    expect(inRamp(17)(value(hung(head, id('head'), 'eye0', id('eyes'))))).toBe(true);
    // Its two legs hang below the torso, its tail behind it: underside (9-12).
    for (const [slot, point] of [['farLimbs', 'far0'], ['nearLimbs', 'near0']] as const) {
      expect(inRamp(9)(value(hung(torso, id('torso'), point, `avian/${slot}/hind-testbird/medium/v0`), 0, 6)), slot).toBe(true);
    }
    expect(inRamp(9)(value(hung(torso, id('torso'), 'tail', id('tail')), 1, 1))).toBe(true);
  });

  it('the test urchin, with no head, has its eye on its torso\'s eye point and its spines on its back; the test snail carries its shell', () => {
    const urchin = compose(buildSpeciesRecipe('testurchin', catalogue), 'rest', catalogue).buffer;
    const at = (buffer: typeof urchin, [x, y]: readonly [number, number], dx = 0, dy = 0): number => buffer.pixels[(y + dy) * buffer.w + x + dx]!;
    const torso = torsoAt('testurchin', 'radial');
    const eye = hung(torso, 'radial/torso/testurchin/medium/v0', 'eye0', 'radial/eyes/testurchin/medium/v0');
    expect(inRamp(17)(at(urchin, eye))).toBe(true);
    // Beside the eye the torso shows: the eye is drawn on it, inside its outline.
    expect(inRamp(1)(at(urchin, eye, -1, 0))).toBe(true);
    const spines = hung(torso, 'radial/torso/testurchin/medium/v0', 'back', 'radial/back/testurchin/medium/v0');
    expect(spines[1]).toBeLessThan(torso[1]);
    expect(inRamp(1)(at(urchin, spines, 1, 0))).toBe(true);

    const snail = compose(buildSpeciesRecipe('testsnail', catalogue), 'rest', catalogue).buffer;
    const foot = torsoAt('testsnail', 'gastropod');
    const shell = hung(foot, 'gastropod/torso/testsnail/medium/v0', 'back', 'gastropod/bodyFeature/testsnail/medium/v0');
    expect(shell[1]).toBeLessThan(foot[1]);
    expect(inRamp(5)(at(snail, shell, 1, 1))).toBe(true);
  });

  it('a headless species whose torso has no eye point is told so: the eye is left out with an attach gap', () => {
    const text = PACK.replace('tail=1', 'tail=1 head=0');
    const out = compose(buildSpeciesRecipe('civet', parseCatalogueText(text)), 'rest', parseCatalogueText(text));
    expect(out.gaps).toEqual(['attach:eye0', 'attach:eye1']);
    const eyed = parseCatalogueText(text.replace('attach=head:10,1,', 'attach=eye0:9,1,eye1:10,1,head:10,1,'));
    const drawn = compose(buildSpeciesRecipe('civet', eyed), 'rest', eyed);
    expect(drawn.gaps).toEqual([]);
    const [ox, oy] = eyed.scaffolds.get('quadruped/civet/small')!.origin;
    for (const dx of [9, 10]) expect(inRamp(17)(drawn.buffer.pixels[(oy + 1) * drawn.buffer.w + ox + dx]!)).toBe(true);
    // No head is drawn: where the head's far corner was, the canvas is clear.
    expect(drawn.buffer.pixels[(oy + 1 + 3) * drawn.buffer.w + ox + 10 + 5]).toBe(0);
  });
});
