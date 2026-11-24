import { describe, expect, it } from 'vitest';
import { parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { testCatalogue, testSpeciesCatalogue } from '@cf/art-testparts';
import { buildRecipe, buildSpeciesRecipe } from '../src/recipe';
import { planSpeciesParts } from '../src/requests';

const asked = (r: { parts: readonly { slot: SlotName; index: number; partId: string }[] }): string[] => r.parts.map((p) => `${p.slot}${p.index} ${p.partId}`);

describe('a species with a shape of its own (the placeholder species)', () => {
  const catalogue = testSpeciesCatalogue();

  it('the test bird asks for torso, head, two legs, tail, near and far wings, eye; nothing is missing', () => {
    const r = buildSpeciesRecipe('testbird', catalogue);
    expect(asked(r)).toEqual([
      'farWings0 avian/farWings/testbird/medium/v0',
      'farLimbs0 avian/farLimbs/hind-testbird/medium/v0',
      'tail0 avian/tail/testbird/medium/v0',
      'torso0 avian/torso/testbird/medium/v0',
      'nearWings0 avian/nearWings/testbird/medium/v0',
      'nearLimbs0 avian/nearLimbs/hind-testbird/medium/v0',
      'head0 avian/head/testbird/medium/v0',
      'headFeature0 avian/headFeature/testbird/medium/v0',
      'eyes0 avian/eyes/testbird/medium/v0',
    ]);
    expect(r.gaps).toEqual([]);
    expect(r.scaffoldId).toBe('avian/testbird/medium');
    // No part hangs anywhere but its slot's own point, and none is marked.
    for (const p of r.parts) expect(Object.keys(p).sort(), p.partId).toEqual(['index', 'partId', 'slot', 'source']);
  });

  it('the test urchin asks for no head and reports no missing head; its eye hangs from the torso', () => {
    const r = buildSpeciesRecipe('testurchin', catalogue);
    expect(r.parts).toEqual([
      { slot: 'torso', index: 0, partId: 'radial/torso/testurchin/medium/v0', source: 'own' },
      { slot: 'back', index: 0, partId: 'radial/back/testurchin/medium/v0', source: 'own' },
      { slot: 'eyes', index: 0, partId: 'radial/eyes/testurchin/medium/v0', source: 'own', at: { host: 'torso', point: 'eye0' } },
    ]);
    expect(r.gaps).toEqual([]);
  });

  it('the test snail asks for its foot, shell, head and eye; the test plant for its one part', () => {
    const snail = buildSpeciesRecipe('testsnail', catalogue);
    expect(asked(snail)).toEqual([
      'torso0 gastropod/torso/testsnail/medium/v0',
      'bodyFeature0 gastropod/bodyFeature/testsnail/medium/v0',
      'head0 gastropod/head/testsnail/medium/v0',
      'eyes0 gastropod/eyes/testsnail/medium/v0',
    ]);
    const plant = buildSpeciesRecipe('testplant', catalogue);
    expect(plant.parts).toEqual([{ slot: 'torso', index: 0, partId: 'flora/torso/testplant/medium/v0', source: 'own' }]);
    expect([...snail.gaps, ...plant.gaps]).toEqual([]);
  });

  it('a species recipe carries the template of its species line; a generated recipe carries none', () => {
    expect(['testbird', 'testurchin', 'testsnail', 'testplant'].map((key) => buildSpeciesRecipe(key, catalogue).template)).toEqual(['biped-bird', 'radial', 'gastropod', 'plant']);
    expect('template' in buildRecipe({ kingdom: 'fauna', seed: 1 }, [], catalogue)).toBe(false);
  });

  it('the placeholder catalogue itself holds no species', () => {
    expect(testCatalogue().species.size).toBe(0);
    expect([...catalogue.species.keys()]).toEqual(['testbird', 'testurchin', 'testsnail', 'testplant']);
  });
});

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\nramp r 0 1 1 0\noutline 0\neye 1\neyeHighlight 1\nglow 1\n';
const q = (slot: SlotName, kind: string, variant = 0): string => partId('quadruped', slot, kind, 'medium', variant);
const pack = (ids: readonly string[], line: string): Catalogue => parseCatalogueText(`${HEADER}${ids.map((id) => `part ${id}\nframe rest anchor=0,0\n1\n`).join('\n')}\n${line}\n`);
const CIVET = 'species civet quadruped medium legs=4 eyes=1 iris=0 tail=1';
/** The parts of the Civet's pack: its own torso, head, tail, eye and four legs. */
const CIVET_PARTS = [
  q('torso', 'civet'), q('head', 'civet'), q('tail', 'civet'), q('eyes', 'civet'),
  ...(['farLimbs', 'nearLimbs'] as const).flatMap((slot) => [q(slot, 'fore-civet'), q(slot, 'hind-civet')]),
];
const OPTIONAL: readonly SlotName[] = ['farWings', 'nearWings', 'bodyFeature', 'back', 'headFeature'];

describe('the optional own parts of a species', () => {
  it('the Civet\'s recipe is unchanged, part for part', () => {
    // The list recorded from the code before a species could bring a part of its own (one line a part).
    const r = buildSpeciesRecipe('civet', pack(CIVET_PARTS, CIVET));
    expect(r.parts).toEqual([
      { slot: 'farLimbs', index: 0, partId: 'quadruped/farLimbs/fore-civet/medium/v0', source: 'own' },
      { slot: 'farLimbs', index: 1, partId: 'quadruped/farLimbs/hind-civet/medium/v0', source: 'own' },
      { slot: 'tail', index: 0, partId: 'quadruped/tail/civet/medium/v0', source: 'own' },
      { slot: 'torso', index: 0, partId: 'quadruped/torso/civet/medium/v0', source: 'own' },
      { slot: 'nearLimbs', index: 0, partId: 'quadruped/nearLimbs/fore-civet/medium/v0', source: 'own' },
      { slot: 'nearLimbs', index: 1, partId: 'quadruped/nearLimbs/hind-civet/medium/v0', source: 'own' },
      { slot: 'head', index: 0, partId: 'quadruped/head/civet/medium/v0', source: 'own' },
      { slot: 'eyes', index: 0, partId: 'quadruped/eyes/civet/medium/v0', source: 'own' },
    ]);
    expect(r.gaps).toEqual([]);
    // Every other field as before; the one new field is its template, the family's.
    const { parts: _parts, template, ...rest } = r;
    expect(template).toBe('quadruped');
    expect(rest).toEqual({
      version: 1, identity: 'species:civet', family: 'quadruped', tier: 'medium', scaffoldId: 'quadruped/civet/medium', legs: 4, eyes: 1,
      ramps: { primary: 'civet', accent: 'civet-accent', underside: 'civet-under', iris: 'iris0' },
      marking: { pattern: 0, strength: 2, phase: 0 }, shift: { head: [0, 0], tail: [0, 0] }, glow: false, gaps: [],
      opacity: 100, airborne: false, theme: null, rim: 0, skin: null,
    });
  });

  it('each optional part the pack holds is asked for, at index 0 and v0, in drawing order; one it lacks is no gap', () => {
    for (const slot of OPTIONAL) {
      const r = buildSpeciesRecipe('civet', pack([...CIVET_PARTS, q(slot, 'civet')], CIVET));
      expect(r.parts.filter((p) => OPTIONAL.includes(p.slot)), slot).toEqual([{ slot, index: 0, partId: q(slot, 'civet'), source: 'own' }]);
      expect(r.gaps, slot).toEqual([]);
    }
    const all = buildSpeciesRecipe('civet', pack([...CIVET_PARTS, ...OPTIONAL.map((slot) => q(slot, 'civet'))], CIVET));
    expect(all.parts.map((p) => p.slot)).toEqual(['farWings', 'farLimbs', 'farLimbs', 'tail', 'torso', 'bodyFeature', 'back', 'nearWings', 'nearLimbs', 'nearLimbs', 'head', 'headFeature', 'eyes']);
    expect(all.gaps).toEqual([]);
  });

  it('an optional part of another kind, another variant, another tier or another family is not asked for', () => {
    const others = OPTIONAL.flatMap((slot) => [q(slot, 'otter'), q(slot, 'civet', 1), partId('quadruped', slot, 'civet', 'small', 0), partId('avian', slot, 'civet', 'medium', 0), q(slot, 'wing-civet')]);
    const r = buildSpeciesRecipe('civet', pack([...CIVET_PARTS, ...others], CIVET));
    expect(r.parts.filter((p) => OPTIONAL.includes(p.slot))).toEqual([]);
    expect(r.gaps).toEqual([]);
  });

  it('with head=0: no head is asked for or missed, every eye hangs from the torso\'s eye<i>, and no head feature is asked for', () => {
    const line = CIVET.replace('eyes=1', 'eyes=4') + ' head=0';
    const r = buildSpeciesRecipe('civet', pack([...CIVET_PARTS, q('headFeature', 'civet'), q('back', 'civet')], line));
    expect(r.parts.some((p) => p.slot === 'head' || p.slot === 'headFeature')).toBe(false);
    expect(r.parts.filter((p) => p.slot === 'eyes')).toEqual([0, 1, 2, 3].map((i) => ({ slot: 'eyes', index: i, partId: q('eyes', 'civet'), source: 'own', at: { host: 'torso', point: `eye${i}` } })));
    expect(r.parts.some((p) => p.slot === 'back')).toBe(true);
    expect(r.gaps).toEqual([]);
    // The pack need not hold a head at all.
    const bare = buildSpeciesRecipe('civet', pack(CIVET_PARTS.filter((id) => id !== q('head', 'civet')), line));
    expect(bare.gaps).toEqual([]);
    // With a head (the default) the same pack misses it.
    expect(buildSpeciesRecipe('civet', pack(CIVET_PARTS.filter((id) => id !== q('head', 'civet')), CIVET)).gaps).toEqual([`missing:${q('head', 'civet')}`]);
  });

  it('planSpeciesParts reads the species it is given', () => {
    const catalogue = pack([...CIVET_PARTS, q('back', 'civet')], CIVET);
    const species = catalogue.species.get('civet')!;
    expect(planSpeciesParts({ ...species, head: false }, catalogue).parts.some((p) => p.slot === 'head')).toBe(false);
    expect(planSpeciesParts(species, catalogue).parts.some((p) => p.slot === 'head')).toBe(true);
  });
});
