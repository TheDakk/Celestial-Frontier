/* The renderer's species key against the game's own names (the art packages may not import the descriptors package). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { speciesKeyOf } from '@cf/art-recipe';
import { _EARTH_NAMES, _earthNamePass } from '@cf/domain-descriptors';

type Genome = Record<string, unknown>;

describe('the species key over the game\'s Earth names', () => {
  it('no two of the 1,010 names in _EARTH_NAMES map to the same key', () => {
    const names = Object.values(_EARTH_NAMES).flat();
    expect(names).toHaveLength(1010);
    const byKey = new Map<string, string[]>();
    for (const name of names) {
      const key = speciesKeyOf({ _earthName: name });
      expect(key, name).toMatch(/^[a-z0-9]+$/);
      byKey.set(key!, [...(byKey.get(key!) ?? []), name]);
    }
    expect([...byKey.values()].filter((sharing) => sharing.length > 1)).toEqual([]);
    expect(byKey.size).toBe(1010);
  });

  it("the game's name pass gives Earth's recorded roster the 19 starters' keys, the Civet second of the fauna", () => {
    const rosters = JSON.parse(readFileSync(new URL('../../fixtures/current/rosters.json', import.meta.url), 'utf8')) as { earth: Genome[][] };
    const roster = rosters.earth[0]!.map((g) => ({ ...g }));
    _earthNamePass(roster);
    expect(roster.map((g) => speciesKeyOf(g))).toEqual([
      'persimmon', 'devilsclub', 'cranberry', 'rambutan', 'wildguava', 'barrelcactusfruit', 'mildew', 'giantpuffball',
      'redtidealgae', 'halophile', 'euglena', 'platypus', 'civet', 'brittlestar', 'frog', 'pheasant', 'oryx', 'seaurchin', 'prawn',
    ]);
    expect(roster[12]).toMatchObject({ seed: 3212817920, _earthName: 'Civet' });
  });
});
