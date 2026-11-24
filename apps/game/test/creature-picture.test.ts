import { describe, expect, it } from 'vitest';
import { TIER_SIZE } from '@cf/art-format';
import { bodyOf } from '@cf/art-recipe';
import { testPartsText } from '@cf/art-testparts';
import rosters from '../../../fixtures/current/rosters.json' with { type: 'json' };
import { buildCatalogue, createCreaturePictures } from '../src/creature';

type Genome = Record<string, unknown>;
const earth = (rosters as unknown as { earth: Genome[][] }).earth[0]!;
const everyone = (rosters as unknown as Record<string, Genome[][]>);
/** Every recorded genome, each once (the rosters repeat some). */
const all = [...new Map(Object.values(everyone).flat(2).map((g) => [JSON.stringify(g), g])).values()];

/** The Civet: the second fauna genome of Earth's recorded roster, with the name the game's name pass writes on it. */
const civet = (): Genome => ({ ...earth.find((g) => g.seed === 3212817920)!, _earthName: 'Civet' });
/** A small Civet pack, read after the placeholder pack: its ramps, its line, its own parts and its scaffold. */
const CIVET_PACK = `palette
ramp civet 1 2 3 4
ramp civet-accent 1 2 3 4
ramp civet-under 1 2 3 4

species civet quadruped small legs=4 eyes=2 iris=2 tail=1

part quadruped/torso/civet/small/v0
frame rest anchor=0,0 attach=head:10,1,tail:1,1,far0:0,5,far1:3,5,near0:1,5,near1:4,5
222222222222
222222222222
222222222222

part quadruped/head/civet/small/v0
frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1
666666
666666
666666

part quadruped/tail/civet/small/v0
frame rest anchor=4,0
aaaaa

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
6
${['farLimbs', 'nearLimbs'].map((slot) => `
part quadruped/${slot}/fore/small/v0
frame rest anchor=0,0
66
66

part quadruped/${slot}/hind/small/v0
frame rest anchor=0,0
aa
aa
`).join('')}
scaffold quadruped/civet/small origin=16,12
pose rest
`;

const placeholder = () => buildCatalogue([testPartsText()]).catalogue;
const mediumFauna = all.filter((g) => g.kingdom === 'fauna' && bodyOf(g).tier === 'medium' && bodyOf(g).family === 'quadruped');
const plant = all.find((g) => g.kingdom === 'flora' && bodyOf(g).tier === 'medium')!;
const MEDIUM_BYTES = TIER_SIZE.medium[0] * TIER_SIZE.medium[1];

describe('a creature picture', () => {
  it("the Civet's genome with the test species pack loaded composes with no gap; without it, one gap species:civet", () => {
    const loaded = buildCatalogue([testPartsText(), CIVET_PACK]);
    expect(loaded.problems).toEqual([]);
    const withPack = createCreaturePictures(loaded.catalogue);
    const drawn = withPack.picture(civet(), [], 'rest');
    expect(drawn.gaps).toEqual([]);
    expect([drawn.buffer.w, drawn.buffer.h]).toEqual([...TIER_SIZE.small]);
    expect(drawn.buffer.pixels.some((p) => p !== 0)).toBe(true);
    expect([...withPack.gaps()]).toEqual([]);

    const told: Array<{ key: string; gap: string }> = [];
    const without = createCreaturePictures(placeholder(), undefined, (event) => told.push(event));
    const fallen = without.picture(civet(), [], 'rest');
    expect(fallen.gaps.filter((gap) => gap.startsWith('species:'))).toEqual(['species:civet']);
    expect(without.gaps().get('species:civet')).toBe(1);
    // Asked again, and in another pose: still one creature showing the gap, and the gap is told once.
    without.picture(civet(), [], 'rest');
    without.picture(civet(), [], 'hit');
    expect(without.gaps().get('species:civet')).toBe(1);
    expect(told.filter((event) => event.gap === 'species:civet')).toHaveLength(1);
    expect(told.map((event) => event.gap).sort()).toEqual([...without.gaps().keys()].sort());
    // A second creature with the same gap is counted, and not told again.
    without.picture({ ...civet(), seed: 7 }, [], 'rest');
    expect(without.gaps().get('species:civet')).toBe(2);
    expect(told.filter((event) => event.gap === 'species:civet')).toHaveLength(1);
  });

  it("a species whose pack lacks its head is drawn as its family's stand-in for its size, and both gaps are counted; lacking only an optional part of its own it is drawn", () => {
    const start = CIVET_PACK.indexOf('part quadruped/head/civet/small/v0');
    const headless = CIVET_PACK.slice(0, start) + CIVET_PACK.slice(CIVET_PACK.indexOf('part quadruped/tail/civet/small/v0'));
    const loaded = buildCatalogue([testPartsText(), headless]);
    expect(loaded.problems).toEqual([]);
    const pictures = createCreaturePictures(loaded.catalogue);
    const shown = pictures.picture(civet(), [], 'rest');
    expect(shown.gaps).toEqual(['missing:quadruped/head/civet/small/v0', 'fallback:quadruped']);
    expect([...pictures.gaps()]).toEqual([['missing:quadruped/head/civet/small/v0', 1], ['fallback:quadruped', 1]]);
    // The stand-in alone: what a small quadruped with no scaffold in the placeholder pack is drawn as, moved to this scaffold's origin.
    const standIn = loaded.catalogue.parts.get(loaded.catalogue.fallbacks.get('quadruped/small')!)!.frames['rest']!;
    const solid = (pixels: Uint8Array): number => pixels.filter((p) => p !== 0 && p !== 16).length;
    expect(solid(shown.buffer.pixels)).toBe(solid(standIn.pixels));
    const whole = createCreaturePictures(buildCatalogue([testPartsText(), CIVET_PACK]).catalogue).picture(civet(), [], 'rest');
    expect(shown.buffer.pixels).not.toEqual(whole.buffer.pixels);
  });

  it('a plant with no flora stand-in in the catalogue gives a marked tile and the gap fallback:flora/medium, and does not throw', () => {
    expect(plant).toBeDefined();
    const text = testPartsText();
    const bare = buildCatalogue([text.split('\n').filter((line) => !line.startsWith('fallback flora ')).join('\n')]);
    expect(bare.problems).toEqual([]);
    const pictures = createCreaturePictures(bare.catalogue);
    const marked = pictures.picture(plant, [], 'rest');
    expect(marked.gaps).toContain('fallback:flora/medium');
    expect(pictures.gaps().get('fallback:flora/medium')).toBe(1);
    const { w, h, pixels } = marked.buffer;
    expect([w, h]).toEqual([...TIER_SIZE.medium]);
    // The mark: a 12 by 12 block of the outline value about the middle, an 8 by 8 block of the glow value inside it.
    const at = (x: number, y: number): number => pixels[y * w + x]!;
    const count = (value: number): number => pixels.filter((p) => p === value).length;
    expect([count(16), count(15), count(0)]).toEqual([144 - 64, 64, w * h - 144]);
    expect([at(42, 26), at(53, 37), at(41, 26), at(54, 37), at(44, 28), at(51, 35), at(43, 28)]).toEqual([16, 16, 0, 0, 15, 15, 16]);

    // With the stand-in in the catalogue the same plant is drawn as the stand-in, with no such gap.
    const whole = createCreaturePictures(placeholder()).picture(plant, [], 'rest');
    expect(whole.gaps).not.toContain('fallback:flora/medium');
    expect(whole.gaps).toContain('fallback:flora');
    expect(whole.buffer.pixels).not.toEqual(pixels);
  });

  it('a genome no recipe can be made of gives a marked tile and a counted gap, and does not throw', () => {
    const loop: Genome = { kingdom: 'fauna' };
    loop.self = loop;
    const pictures = createCreaturePictures(placeholder());
    const marked = pictures.picture(loop, [], 'rest');
    expect(marked.gaps).toEqual(['recipe:unreadable']);
    expect(marked.buffer.pixels.filter((p) => p === 16)).toHaveLength(80);
    expect(pictures.gaps().get('recipe:unreadable')).toBe(1);
  });

  it('the cache drops the least recently used picture when over its budget; a dropped picture recomposes to the same pixels', () => {
    const [a, b, c] = mediumFauna as [Genome, Genome, Genome];
    expect(c).toBeDefined();
    const pictures = createCreaturePictures(placeholder(), 2 * MEDIUM_BYTES + 100);
    const firstA = pictures.picture(a, [], 'rest').buffer;
    const firstB = pictures.picture(b, [], 'rest').buffer;
    expect(pictures.bytesHeld()).toBe(2 * MEDIUM_BYTES);
    // A is used again, so B is the least recently used when C arrives.
    expect(pictures.picture(a, [], 'rest').buffer).toBe(firstA);
    pictures.picture(c, [], 'rest');
    expect(pictures.bytesHeld()).toBe(2 * MEDIUM_BYTES);
    expect(pictures.picture(a, [], 'rest').buffer).toBe(firstA);
    const kept = Uint8Array.from(firstB.pixels);
    const againB = pictures.picture(b, [], 'rest').buffer;
    expect(againB).not.toBe(firstB);
    expect(againB.pixels).toEqual(kept);
    expect(pictures.bytesHeld()).toBe(2 * MEDIUM_BYTES);
    // Another pose is another picture.
    expect(pictures.picture(b, [], 'hit').buffer).not.toBe(againB);
    // A budget smaller than one picture holds none, and the picture is still given.
    const none = createCreaturePictures(placeholder(), MEDIUM_BYTES - 1);
    expect(none.picture(a, [], 'rest').buffer.pixels).toEqual(firstA.pixels);
    expect(none.bytesHeld()).toBe(0);
    // A picture larger than the whole budget is given and not held, and costs no held picture its place.
    const tight = createCreaturePictures(placeholder(), MEDIUM_BYTES + 100);
    const heldA = tight.picture(a, [], 'rest').buffer;
    const large = tight.picture(civet(), [], 'rest').buffer;
    expect(large.pixels.byteLength).toBe(TIER_SIZE.large[0] * TIER_SIZE.large[1]);
    expect(tight.picture(a, [], 'rest').buffer).toBe(heldA);
    expect(tight.bytesHeld()).toBe(MEDIUM_BYTES);
  });

  it('the same genome gives the same pixels on a second catalogue built from the same texts', () => {
    const [a, b] = mediumFauna as [Genome, Genome];
    const first = createCreaturePictures(placeholder());
    const second = createCreaturePictures(placeholder());
    for (const pose of ['rest', 'strike', 'faint']) {
      const one = first.picture(a, ['x'], pose);
      const two = second.picture(a, ['x'], pose);
      expect(two.buffer).not.toBe(one.buffer);
      expect(two.buffer.pixels).toEqual(one.buffer.pixels);
      expect(two.gaps).toEqual(one.gaps);
    }
    expect(first.picture(b, [], 'rest').buffer.pixels).not.toEqual(first.picture(a, [], 'rest').buffer.pixels);
    expect(first.picture(a, [], 'rest').buffer.pixels.some((p) => p !== 0)).toBe(true);
  });
});
