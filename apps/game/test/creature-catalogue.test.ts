import { describe, expect, it } from 'vitest';
import { testPartsText, testSpeciesPackText } from '@cf/art-testparts';
import { buildCatalogue } from '../src/creature';

const PALETTE = 'palette\ncolour 0 000000\ncolour 1 ffffff\nramp r 0 1 1 0\noutline 0\neye 1\neyeHighlight 1\nglow 1\n';
const part = (id: string, pixel: string): string => `part ${id}\nframe rest anchor=0,0\n${pixel}\n`;
const TORSO = 'quadruped/torso/sturdy/medium/v0';
const HEAD = 'quadruped/head/h0/medium/v0';
const TAIL = 'quadruped/tail/t1/medium/v0';
const pixelOf = (catalogue: ReturnType<typeof buildCatalogue>['catalogue'], id: string): number | undefined =>
  catalogue.parts.get(id)?.frames['rest']?.pixels[0];

describe('the catalogue of the loaded parts packs', () => {
  it('two pack texts join into one catalogue; a second definition of the same part is a problem, not a silent override', () => {
    const joined = buildCatalogue([PALETTE, part(TORSO, '1'), part(HEAD, '2')]);
    expect(joined.problems).toEqual([]);
    expect([...joined.catalogue.parts.keys()]).toEqual([TORSO, HEAD]);
    expect(joined.catalogue.palette.ramps['r']).toEqual([0, 1, 1, 0]);

    // The third text defines the torso again: it is reported and left out whole; the packs before and after it stay.
    const twice = buildCatalogue([PALETTE, part(TORSO, '1'), `${part(TAIL, '4')}\n${part(TORSO, '3')}`, part(HEAD, '2')]);
    expect(twice.problems).toEqual([`pack 3 of 4: line 5: duplicate id ${TORSO}`]);
    expect([...twice.catalogue.parts.keys()]).toEqual([TORSO, HEAD]);
    expect(pixelOf(twice.catalogue, TORSO)).toBe(1);
  });

  it('a pack that does not parse is a problem and the other packs still form the catalogue', () => {
    const built = buildCatalogue([PALETTE, 'part nonsense\n', part(HEAD, '2')]);
    expect(built.problems).toEqual(['pack 2 of 3: part nonsense: bad id']);
    expect([...built.catalogue.parts.keys()]).toEqual([HEAD]);
    expect(buildCatalogue([]).catalogue.parts.size).toBe(0);
  });

  it('the placeholder pack and the species pack read after it join, and the species pack alone is a problem', () => {
    const both = buildCatalogue([testPartsText(), testSpeciesPackText()]);
    expect(both.problems).toEqual([]);
    expect([...both.catalogue.species.keys()]).toEqual(['testbird', 'testurchin', 'testsnail', 'testplant']);
    expect(both.catalogue.parts.has(TORSO)).toBe(true);
    const alone = buildCatalogue([testSpeciesPackText()]);
    expect(alone.problems).toHaveLength(1);
    expect(alone.catalogue.species.size).toBe(0);
  });
});
