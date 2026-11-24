import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../tools/check-pack.mjs';
import { errorsOf, planted, PLACEHOLDER_TEXT } from './support/placeholder-check';

// The checker on the placeholder named species (packages/art-testparts/src/species.txt, read after the placeholder
// pack as testSpeciesCatalogue reads it): a bird with wings and a crest, a headless urchin with spines, a snail with a
// shell and five poses, a plant with four. Each rule is shown both ways: the pack as written passes, and the same text
// with that one rule broken is refused by name.
const SPECIES_TEXT = `${PLACEHOLDER_TEXT}\n${readFileSync(new URL('../packages/art-testparts/src/species.txt', import.meta.url), 'utf8')}`;

/** The whole-pack checks and the named species (always composed); no generated scaffold sampled, one coverage seed. */
const check = (text: string): PackReport => checkPack(text, { sample: () => false, coverage: { first: 1, last: 1 } });
/** The text without one part: its block from the `part` line to the blank line after it. */
const withoutPart = (text: string, id: string): string => {
  const blocks = text.split('\n\n');
  const kept = blocks.filter((block) => !block.trimStart().startsWith(`part ${id}\n`));
  expect(kept).toHaveLength(blocks.length - 1);
  return kept.join('\n\n');
};
/** The text with one pose (its line and its entries) taken out of one scaffold. */
const withoutPose = (text: string, scaffoldId: string, pose: string): string => {
  const blocks = text.split('\n\n');
  const at = blocks.findIndex((b) => b.trimStart().startsWith(`scaffold ${scaffoldId} `));
  const lines = blocks[at]!.split('\n');
  const from = lines.findIndex((l) => l === `pose ${pose}` || l.startsWith(`pose ${pose} `));
  expect(from).toBeGreaterThan(0);
  const next = lines.findIndex((l, i) => i > from && l.startsWith('pose '));
  lines.splice(from, (next === -1 ? lines.length : next) - from);
  blocks[at] = lines.join('\n');
  return blocks.join('\n\n');
};
/** A plain block of a part, eight by eight, with no attach point. */
const block = (id: string): string => `\npart ${id}\nframe rest anchor=0,0\n${'33333333\n'.repeat(8)}`;

const BIRD_TORSO = 'frame rest anchor=0,0 attach=head:17,2,tail:2,4,wing:9,3,far0:8,12,near0:11,12\n';
const URCHIN_TORSO = 'frame rest anchor=0,0 attach=eye0:12,6,back:9,-1\n';
const SNAIL_TORSO = 'frame rest anchor=0,0 attach=head:22,1,back:10,-1\n';
const SNAIL_POSES = 'rest, approach, recover, hit, faint';
const PLANT_POSES = 'rest, disturb, harvest, grow';
const SEVEN = 'rest, approach, windup, strike, recover, hit, faint';

describe('checkPack on the placeholder named species', () => {
  it('the pack as written checks OK: no error, no warning, each species composed in each of its poses', () => {
    const r = check(SPECIES_TEXT);
    expect(errorsOf(r)).toEqual([]);
    expect(r.structure).toEqual([]);
    expect(r.unreachable).toEqual([]);
    expect(r.ok).toBe(true);
    expect(formatReport(r).split('\n').filter((l) => l.startsWith('warning:'))).toEqual([]);
    expect(r.summary).toMatchObject({ species: 4, scaffolds: 34 });
    // bird 7 poses, urchin 7, snail 5, plant 4
    expect(r.composed).toBe(23);
  });

  describe('a wing, shell, crest or back part named for a species', () => {
    it('a wing or shell whose kind is the key of no species of its family and tier is reported', () => {
      const wing = check(planted('part avian/farWings/testbird/medium/v0', 'part avian/farWings/testbirb/medium/v0', SPECIES_TEXT));
      expect(wing.unreachable).toEqual(["part avian/farWings/testbirb/medium/v0: no creature asks for a farWings part named 'testbirb'"]);
      const shell = check(planted('part gastropod/bodyFeature/testsnail/medium/v0', 'part gastropod/bodyFeature/shell/medium/v0', SPECIES_TEXT));
      expect(shell.unreachable).toEqual(["part gastropod/bodyFeature/shell/medium/v0: no creature asks for a bodyFeature part named 'shell'"]);
      // the key of a species of another family is not this family's species
      const other = check(planted('part avian/nearWings/testbird/medium/v0', 'part avian/nearWings/testsnail/medium/v0', SPECIES_TEXT));
      expect(other.unreachable).toEqual(["part avian/nearWings/testsnail/medium/v0: no creature asks for a nearWings part named 'testsnail'"]);
      expect(other.ok).toBe(false);
    });

    it('a head or a crest named for a species with no head is reported: nothing asks for it', () => {
      const head = check(SPECIES_TEXT + block('radial/head/testurchin/medium/v0'));
      expect(head.unreachable).toEqual(['part radial/head/testurchin/medium/v0: no creature asks for it: species testurchin has no head (head=0)']);
      expect(head.structure).toEqual([]);
      const crest = check(SPECIES_TEXT + block('radial/headFeature/testurchin/medium/v0'));
      expect(crest.unreachable).toEqual(['part radial/headFeature/testurchin/medium/v0: no creature asks for it: species testurchin has no head (head=0)']);
      expect(crest.ok).toBe(false);
      // the same two parts on a species with a head are asked for
      expect(check(SPECIES_TEXT).unreachable).toEqual([]);
    });
  });

  describe('the attach points of a species torso and head', () => {
    const missing = (part: string, point: string): string[] => [`part ${part} frame rest: missing attach point ${point}`];

    it('a torso with wings of its own must declare wing', () => {
      const r = check(planted(BIRD_TORSO, BIRD_TORSO.replace('wing:9,3,', ''), SPECIES_TEXT));
      expect(r.structure).toEqual(missing('avian/torso/testbird/medium/v0', 'wing'));
      // one wing is enough to need it; with neither wing the point is not asked for
      const far = withoutPart(planted(BIRD_TORSO, BIRD_TORSO.replace('wing:9,3,', ''), SPECIES_TEXT), 'avian/farWings/testbird/medium/v0');
      expect(check(far).structure).toEqual(missing('avian/torso/testbird/medium/v0', 'wing'));
      expect(check(withoutPart(far, 'avian/nearWings/testbird/medium/v0')).structure).toEqual([]);
    });

    it('a torso with a back part or a shell of its own must declare back', () => {
      const spines = planted(URCHIN_TORSO, URCHIN_TORSO.replace(',back:9,-1', ''), SPECIES_TEXT);
      expect(check(spines).structure).toEqual(missing('radial/torso/testurchin/medium/v0', 'back'));
      expect(check(withoutPart(spines, 'radial/back/testurchin/medium/v0')).structure).toEqual([]);
      const shell = planted(SNAIL_TORSO, SNAIL_TORSO.replace(',back:10,-1', ''), SPECIES_TEXT);
      expect(check(shell).structure).toEqual(missing('gastropod/torso/testsnail/medium/v0', 'back'));
      expect(check(withoutPart(shell, 'gastropod/bodyFeature/testsnail/medium/v0')).structure).toEqual([]);
    });

    it('a head with a crest of its own must declare feature', () => {
      const r = planted('attach=eye0:4,2,feature:3,-1\n', 'attach=eye0:4,2\n', SPECIES_TEXT);
      expect(check(r).structure).toEqual(missing('avian/head/testbird/medium/v0', 'feature'));
      expect(check(withoutPart(r, 'avian/headFeature/testbird/medium/v0')).structure).toEqual([]);
    });

    it('a torso with no head carries the eyes: it must declare eye0 and up, and needs no head point', () => {
      const r = check(planted(URCHIN_TORSO, URCHIN_TORSO.replace('eye0:12,6,', ''), SPECIES_TEXT));
      expect(r.structure).toEqual(missing('radial/torso/testurchin/medium/v0', 'eye0'));
      const two = check(planted('species testurchin radial medium legs=0 eyes=1', 'species testurchin radial medium legs=0 eyes=2', SPECIES_TEXT));
      expect(two.structure).toEqual(missing('radial/torso/testurchin/medium/v0', 'eye1'));
      // a species with a head still needs the head point, and its torso no eye point
      const snail = check(planted(SNAIL_TORSO, SNAIL_TORSO.replace('head:22,1,', ''), SPECIES_TEXT));
      expect(snail.structure).toEqual(missing('gastropod/torso/testsnail/medium/v0', 'head'));
    });
  });

  describe('the poses a species scaffold needs, by its template', () => {
    it('a gastropod needs rest, approach, recover, hit and faint, and no windup or strike', () => {
      const r = check(withoutPose(SPECIES_TEXT, 'gastropod/testsnail/medium', 'recover'));
      expect(r.structure).toEqual([`scaffold gastropod/testsnail/medium: missing pose recover (species testsnail, template gastropod, needs ${SNAIL_POSES})`]);
      expect(r.ok).toBe(false);
    });

    it('a plant needs rest, disturb, harvest and grow', () => {
      const r = check(withoutPose(SPECIES_TEXT, 'flora/testplant/medium', 'grow'));
      expect(r.structure).toEqual([`scaffold flora/testplant/medium: missing pose grow (species testplant, template plant, needs ${PLANT_POSES})`]);
    });

    it('every other template needs the seven, and a strike its contact point', () => {
      const bird = check(withoutPose(SPECIES_TEXT, 'avian/testbird/medium', 'windup'));
      expect(bird.structure).toEqual([`scaffold avian/testbird/medium: missing pose windup (species testbird, template biped-bird, needs ${SEVEN})`]);
      const urchin = check(withoutPose(SPECIES_TEXT, 'radial/testurchin/medium', 'strike'));
      expect(urchin.structure).toEqual([`scaffold radial/testurchin/medium: missing pose strike (species testurchin, template radial, needs ${SEVEN})`]);
      const contact = check(planted('entry head 0 rest -1 1\npose strike contact=62,25\n', 'entry head 0 rest -1 1\npose strike\n', SPECIES_TEXT));
      expect(contact.structure).toEqual(['scaffold avian/testbird/medium: pose strike has no contact point']);
    });

    it('the template decides, not the family: the same scaffolds under another template are held to its poses', () => {
      const snail = check(planted('species testsnail gastropod medium legs=0 eyes=1 iris=2 tail=0', 'species testsnail gastropod medium legs=0 eyes=1 iris=2 tail=0 template=slug', SPECIES_TEXT));
      expect(snail.structure).toEqual([`scaffold gastropod/testsnail/medium: missing pose windup, strike (species testsnail, template slug, needs ${SEVEN})`]);
      const plant = check(planted(' head=0 template=plant', ' head=0', SPECIES_TEXT));
      expect(plant.structure).toEqual([`scaffold flora/testplant/medium: missing pose approach, windup, strike, recover, hit, faint (species testplant, template flora, needs ${SEVEN})`]);
      const urchin = check(planted('eyes=1 iris=1 tail=0 head=0', 'eyes=1 iris=1 tail=0 head=0 template=gastropod', SPECIES_TEXT));
      expect(urchin.structure).toEqual([]);
    });
  });

  describe('the stand-ins of a family that holds only species', () => {
    const noStandIn = (text: string, family: string): string =>
      planted(`fallback ${family} ${family}/torso/fallback/medium/v0\n`, '', withoutPart(text, `${family}/torso/fallback/medium/v0`));

    it('it needs one at each size its species use, and none at the sizes other families use', () => {
      // avian and gastropod hold a stand-in at medium only, beside families that fill all four sizes: the pack passes
      // (the first test); without that one it is refused
      const r = check(noStandIn(SPECIES_TEXT, 'avian'));
      expect(r.structure).toEqual(['family avian has no fallback at medium (it holds only species, and needs one stand-in at each size it uses; at this one: testbird)']);
      expect(r.ok).toBe(false);
      // a part its species share (an eye of the family) does not make it a family of generated bodies
      expect(check(SPECIES_TEXT + block('avian/eyes/eye/medium/v0')).structure).toEqual([]);
      // a part of its own at another size is a size it uses
      const large = check(SPECIES_TEXT + block('avian/eyes/eye/large/v0'));
      expect(large.structure).toEqual(['family avian has no fallback at large (it holds only species, and needs one stand-in at each size it uses; at this one: no species, only parts)']);
    });

    it('a family with generated bodies still needs one at every size the pack has', () => {
      const text = planted('fallback radial radial/torso/fallback/small/v0\n', '', withoutPart(SPECIES_TEXT, 'radial/torso/fallback/small/v0'));
      expect(check(text).structure).toEqual(['family radial has no fallback at small']);
    });
  });
});
