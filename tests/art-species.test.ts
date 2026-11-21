import { colourTable, parseCatalogueText, TIER_SIZE } from '@cf/art-format';
import { buildSpeciesRecipe } from '@cf/art-recipe';
import { compose } from '@cf/art-compose';
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
