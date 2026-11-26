import { describe, expect, it } from 'vitest';
import { colourTable, parseCatalogueText, partId, PIXEL_EYE_HIGHLIGHT } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { boneRampOf, buildRecipe, buildSpeciesRecipe, eyeHighlightOf, RENDERER_VERSION, speciesBoneRamp } from '../src/recipe';
import type { Recipe } from '../src/recipe';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLDS = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n\nscaffold quadruped/civet/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';
const CIVET = 'species civet quadruped medium legs=4 eyes=2 iris=3 tail=1';

const q = (slot: SlotName, kind: string, variant = 0): string => partId('quadruped', slot, kind, 'medium', variant);
const catalogueOf = (ids: readonly string[], lines: readonly string[] = [CIVET]): Catalogue =>
  parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLDS + '\n' + lines.join('\n') + '\n');

/** The species' own torso, head and tail, the shared fore, hind and mid legs and the eye, all at v0, for each key. */
const ownParts = (key: string): string[] => [q('torso', key), q('head', key), q('tail', key)];
const SHARED = [...(['farLimbs', 'nearLimbs'] as const).flatMap((slot) => ['fore', 'hind', 'mid', 'leg'].map((kind) => q(slot, kind))), q('eyes', 'eye')];
const full = (): Catalogue => catalogueOf([...ownParts('civet'), ...SHARED]);
const ids = (r: { parts: readonly { slot: SlotName; index: number; partId: string }[] }): string[] => r.parts.map((p) => `${p.slot}${p.index} ${p.partId}`);

describe('buildSpeciesRecipe', () => {
  it('builds the whole recipe of a four-legged, two-eyed species with a tail', () => {
    const r = buildSpeciesRecipe('civet', full());
    expect(r).toEqual({
      version: RENDERER_VERSION, identity: 'species:civet', family: 'quadruped', tier: 'medium', scaffoldId: 'quadruped/civet/medium', legs: 4, eyes: 2,
      parts: [
        { slot: 'farLimbs', index: 0, partId: q('farLimbs', 'fore'), source: 'own' },
        { slot: 'farLimbs', index: 1, partId: q('farLimbs', 'hind'), source: 'own' },
        { slot: 'tail', index: 0, partId: q('tail', 'civet'), source: 'own' },
        { slot: 'torso', index: 0, partId: q('torso', 'civet'), source: 'own' },
        { slot: 'nearLimbs', index: 0, partId: q('nearLimbs', 'fore'), source: 'own' },
        { slot: 'nearLimbs', index: 1, partId: q('nearLimbs', 'hind'), source: 'own' },
        { slot: 'head', index: 0, partId: q('head', 'civet'), source: 'own' },
        { slot: 'eyes', index: 0, partId: q('eyes', 'eye'), source: 'own' },
        { slot: 'eyes', index: 1, partId: q('eyes', 'eye'), source: 'own' },
      ],
      ramps: { primary: 'civet', accent: 'civet-accent', underside: 'civet-under', iris: 'iris3' },
      marking: { pattern: 0, strength: 2, phase: 0 },
      shift: { head: [0, 0], tail: [0, 0] },
      glow: false,
      gaps: [],
      opacity: 100, airborne: false, theme: null, rim: 0, skin: null,
      template: 'quadruped',
    });
    for (const p of r.parts) expect('mark' in p).toBe(false);
  });

  it('takes its own iris ramp <key>-iris when the palette holds one, else iris<n> (a theme colour)', () => {
    const withOwn = (ramps: string): Catalogue =>
      parseCatalogueText(HEADER + ramps + [...ownParts('civet'), ...SHARED].map(partText).join('\n') + '\n' + SCAFFOLDS + '\n' + CIVET + '\n');
    expect(buildSpeciesRecipe('civet', full()).ramps.iris).toBe('iris3');
    expect(buildSpeciesRecipe('civet', withOwn('ramp civet-iris 1 2 3 4\n')).ramps.iris).toBe('civet-iris');
    // another species' own iris ramp is not this one's
    expect(buildSpeciesRecipe('civet', withOwn('ramp otter-iris 1 2 3 4\n')).ramps.iris).toBe('iris3');
    // everything else is the same recipe
    const { ramps: a, ...restA } = buildSpeciesRecipe('civet', withOwn('ramp civet-iris 1 2 3 4\n'));
    const { ramps: b, ...restB } = buildSpeciesRecipe('civet', full());
    expect(restA).toEqual(restB);
    expect({ ...a, iris: '' }).toEqual({ ...b, iris: '' });
  });

  it('tail=0 asks for no tail and gives no gap', () => {
    const r = buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet'), ...SHARED], [CIVET.replace('tail=1', 'tail=0')]));
    expect(r.parts.some((p) => p.slot === 'tail')).toBe(false);
    expect(r.gaps).toEqual([]);
  });

  it('carries the eye count of its species line and asks for that many eyes', () => {
    for (const eyes of [0, 1, 2, 4, 6, 8]) {
      const r = buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet'), ...SHARED], [CIVET.replace('eyes=2', `eyes=${eyes}`)]));
      expect(r.eyes, `eyes=${eyes}`).toBe(eyes);
      expect(r.parts.filter((p) => p.slot === 'eyes'), `eyes=${eyes}`).toHaveLength(eyes);
    }
  });

  it('asks for the leg roles of 0, 2, 3 and 6 legs; both legs of two are hind', () => {
    const roles = (legs: number): string[] => {
      const r = buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet'), ...SHARED], [CIVET.replace('legs=4', `legs=${legs}`)]));
      expect(r.legs).toBe(legs);
      expect(r.gaps).toEqual([]);
      return r.parts.filter((p) => p.slot === 'farLimbs' || p.slot === 'nearLimbs').map((p) => `${p.slot}${p.index} ${p.partId.split('/')[2]}`);
    };
    expect(roles(0)).toEqual([]);
    expect(roles(2)).toEqual(['farLimbs0 hind', 'nearLimbs0 hind']);
    expect(roles(3)).toEqual(['farLimbs0 fore', 'nearLimbs0 fore', 'nearLimbs1 hind']);
    expect(roles(6)).toEqual(['farLimbs0 fore', 'farLimbs1 hind', 'farLimbs2 mid', 'nearLimbs0 fore', 'nearLimbs1 hind', 'nearLimbs2 mid']);
  });

  it('tries its own leg, then the shared role, then the shared leg, each at v0, with their gaps', () => {
    // Two legs: the far and near leg both ask for hind.
    const two = (legIds: readonly string[]) =>
      buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet'), q('eyes', 'eye'), ...legIds], [CIVET.replace('legs=4', 'legs=2')]));
    const legsOf = (r: ReturnType<typeof two>): string[] => r.parts.filter((p) => p.slot === 'farLimbs' || p.slot === 'nearLimbs').map((p) => p.partId);
    const sides = (kind: string, variant = 0): string[] => [q('farLimbs', kind, variant), q('nearLimbs', kind, variant)];

    const own = two([...sides('hind-civet'), ...sides('hind'), ...sides('leg')]);
    expect(legsOf(own)).toEqual(sides('hind-civet'));
    expect(own.gaps).toEqual([]);

    const role = two([...sides('hind'), ...sides('leg')]);
    expect(legsOf(role)).toEqual(sides('hind'));
    expect(role.gaps).toEqual([]);

    // Variants other than v0 are never drawn: its own leg and the role at v1 are passed over.
    const shared = two([...sides('hind-civet', 1), ...sides('hind', 1), ...sides('leg')]);
    expect(legsOf(shared)).toEqual(sides('leg'));
    expect(shared.gaps).toEqual([`role:${q('farLimbs', 'hind')}`, `role:${q('nearLimbs', 'hind')}`]);

    const none = two(sides('leg', 1));
    expect(legsOf(none)).toEqual([]);
    expect(none.gaps).toEqual([`missing:${q('farLimbs', 'leg')}`, `missing:${q('nearLimbs', 'leg')}`]);
  });

  it('draws its own eye where the pack holds one, at every eye, with no gap; another species keeps the shared eye', () => {
    const OTTER = 'species otter quadruped medium legs=4 eyes=2 iris=1 tail=1';
    const cat = catalogueOf([...ownParts('civet'), ...ownParts('otter'), ...SHARED, q('eyes', 'civet')], [CIVET, OTTER]);
    const eyesOf = (key: string): string[] => buildSpeciesRecipe(key, cat).parts.filter((p) => p.slot === 'eyes').map((p) => p.partId);
    expect(eyesOf('civet')).toEqual([q('eyes', 'civet'), q('eyes', 'civet')]);
    expect(eyesOf('otter')).toEqual([q('eyes', 'eye'), q('eyes', 'eye')]);
    expect(buildSpeciesRecipe('civet', cat).gaps).toEqual([]);
    // with its own eye, the shared eye is not needed
    const alone = catalogueOf([...ownParts('civet'), ...SHARED.filter((id) => id !== q('eyes', 'eye')), q('eyes', 'civet')], [CIVET]);
    expect(buildSpeciesRecipe('civet', alone).gaps).toEqual([]);
  });

  it('a missing torso, head, tail or eye gives missing: and leaves the rest unchanged', () => {
    const whole = ids(buildSpeciesRecipe('civet', full()));
    for (const lost of [q('torso', 'civet'), q('head', 'civet'), q('tail', 'civet'), q('eyes', 'eye')]) {
      const r = buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet'), ...SHARED].filter((id) => id !== lost)));
      const eyes = lost.includes('/eyes/') ? 2 : 1;
      expect(r.gaps, lost).toEqual(Array.from({ length: eyes }, () => `missing:${lost}`));
      expect(ids(r), lost).toEqual(whole.filter((line) => !line.endsWith(` ${lost}`)));
    }
  });

  it('draws only parts of its own kind at v0: other variants and generated kinds are never asked for', () => {
    const r = buildSpeciesRecipe('civet', catalogueOf([...ownParts('civet').map((id) => id.replace('/v0', '/v1')), q('torso', 'sturdy'), q('head', 'h3'), q('tail', 't2'), ...SHARED]));
    expect(r.gaps).toEqual([`missing:${q('tail', 'civet')}`, `missing:${q('torso', 'civet')}`, `missing:${q('head', 'civet')}`]);
    expect(r.parts.some((p) => /\/(sturdy|h3|t2)\//.test(p.partId) || p.partId.endsWith('/v1'))).toBe(false);
  });

  it('throws on an unknown key', () => {
    expect(() => buildSpeciesRecipe('genet', full())).toThrow("unknown species 'genet'");
    expect(() => buildSpeciesRecipe('toString', full())).toThrow("unknown species 'toString'");
  });

  it('is frozen all the way down, and two calls are deeply equal', () => {
    const r = buildSpeciesRecipe('civet', full());
    for (const value of [r, r.parts, r.parts[0], r.ramps, r.marking, r.shift, r.shift.head, r.shift.tail, r.gaps]) expect(Object.isFrozen(value)).toBe(true);
    expect(buildSpeciesRecipe('civet', full())).toEqual(r);
  });
});

describe('a species line and parts beside generated creatures', () => {
  it('leaves every generated recipe unchanged, and none holds a species part', () => {
    const generated = [q('torso', 'sturdy'), q('head', 'h3'), q('tail', 't2'), ...SHARED];
    const without = catalogueOf(generated, []);
    // A species named like nothing generated, with its own legs: none of it is ever asked for by a generated creature.
    const withSpecies = catalogueOf([...generated, ...ownParts('civet'), q('farLimbs', 'fore-civet'), q('nearLimbs', 'fore-civet')]);
    for (const limbs of [0, 1, 2, 3, 4, 5]) for (const pattern of [0, 2]) for (const tail of [0, 2]) {
      const genome = { kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail, limbs, eyes: 0, skin: 3, color: 3, accent: 5, pattern, seed: limbs };
      const r = buildRecipe(genome, [], withSpecies);
      expect(r).toEqual(buildRecipe(genome, [], without));
      expect(r.parts.some((p) => p.partId.includes('civet'))).toBe(false);
    }
  });
});

describe('the bone ramp of a recipe', () => {
  const PACK = `palette
colour 0 000000
ramp bone 0 0 0 0
RAMPS
species civet quadruped small legs=4 eyes=2 iris=3 tail=1
`;
  const withRamps = (ramps: string): Catalogue => parseCatalogueText(PACK.replace('RAMPS\n', ramps));

  it('a species takes its own <key>-bone when the palette holds it, else bone; another species\' ramp is not its own', () => {
    expect(speciesBoneRamp('civet', withRamps(''))).toBe('bone');
    expect(speciesBoneRamp('civet', withRamps('ramp civet-bone 0 0 0 0\n'))).toBe('civet-bone');
    expect(speciesBoneRamp('civet', withRamps('ramp otter-bone 0 0 0 0\n'))).toBe('bone');
    // The name is `bone` whether or not the palette holds that ramp: a missing ramp is the palette's fault to report.
    expect(speciesBoneRamp('civet', parseCatalogueText('palette\ncolour 0 000000\n'))).toBe('bone');
  });

  it('boneRampOf reads the species from the recipe; a generated creature always takes bone', () => {
    const own = withRamps('ramp civet-bone 0 0 0 0\n');
    expect(boneRampOf(buildSpeciesRecipe('civet', own), own)).toBe('civet-bone');
    expect(boneRampOf(buildSpeciesRecipe('civet', withRamps('')), withRamps(''))).toBe('bone');
    // A generated creature, in a palette that holds ramps named after every part of its identity and its colours.
    const generated = buildRecipe({ kingdom: 'fauna', seed: 1, color: 3 }, [], own);
    const tempting = withRamps(`ramp civet-bone 0 0 0 0\nramp ${generated.ramps.primary}-bone 0 0 0 0\n`);
    expect(boneRampOf(generated, tempting)).toBe('bone');
    expect(generated.identity.startsWith('species:')).toBe(false);
  });

  it('the bone ramp is no field of a recipe\'s ramps', () => {
    const own = withRamps('ramp civet-bone 0 0 0 0\n');
    expect(Object.keys(buildSpeciesRecipe('civet', own).ramps)).toEqual(['primary', 'accent', 'underside', 'iris']);
  });
});

describe('the eye highlight of a recipe', () => {
  const PACK = `palette
colour 0 000000
colour 5 fff0bf
colour 9 fff1cf
ramp civet 0 0 0 0
ramp civet-accent 0 0 0 0
ramp civet-under 0 0 0 0
ramp iris3 0 0 0 0
eyeHighlight 5
species civet quadruped small legs=4 eyes=2 iris=3 tail=1 OWN
species otter quadruped small legs=4 eyes=2 iris=3 tail=1
`;
  const own = parseCatalogueText(PACK.replace('OWN', 'eyeHighlight=9'));
  const shared = parseCatalogueText(PACK.replace(' OWN', ''));
  const shown = (recipe: Recipe, catalogue: Catalogue): number =>
    colourTable(catalogue.palette, { ...recipe.ramps, eyeHighlight: eyeHighlightOf(recipe, catalogue) }).table[PIXEL_EYE_HIGHLIGHT]!;

  it('a species with eyeHighlight= on its line is shown with that colour; any other species with the palette\'s', () => {
    expect(eyeHighlightOf(buildSpeciesRecipe('civet', own), own)).toBe(9);
    expect(shown(buildSpeciesRecipe('civet', own), own)).toBe(0xfff1cf);
    // Another species of the same catalogue, and the same species without the field.
    expect(eyeHighlightOf(buildSpeciesRecipe('otter', own), own)).toBe(5);
    expect(shown(buildSpeciesRecipe('otter', own), own)).toBe(0xfff0bf);
    expect(shown(buildSpeciesRecipe('civet', shared), shared)).toBe(0xfff0bf);
  });

  it('a generated creature always takes the palette\'s, and its colour table is the one made without the argument', () => {
    for (const seed of [1, 2, 3]) {
      const generated = buildRecipe({ kingdom: 'fauna', seed, color: 3 }, [], own);
      expect(eyeHighlightOf(generated, own)).toBe(5);
      expect(colourTable(own.palette, { ...generated.ramps, eyeHighlight: eyeHighlightOf(generated, own) })).toEqual(colourTable(own.palette, generated.ramps));
    }
  });

  it('the eye highlight is no field of a recipe: the species\' recipe is the same with the field and without', () => {
    expect(buildSpeciesRecipe('civet', own)).toEqual(buildSpeciesRecipe('civet', shared));
  });
});
