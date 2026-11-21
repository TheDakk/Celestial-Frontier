import { describe, expect, it } from 'vitest';
import { tierForSize } from '@cf/art-format';
import * as traits from '@cf/domain-speciestraits';
import { EX_HABITAT_STATE, EX_LOCO_STATE, HABITAT_STATE, LOCO_STATE, SIZE_TIER_BY_GENE, stateOf, type StateRow } from '../src/states';

// The original's two name tests, verbatim: a movement name and a habitat name each make a creature aquatic or airborne.
const MOVE_AQUA = /swim|filter|jet|brine-crawl/;
const HAB_AQUA = /ocean|shallows|reef|vent|trench|lakeshore|sea/;
const MOVE_AIR = /glider|floater|drifter|soarer|storm-rider|winged/;
const HAB_AIR = /cloud deck|updraft/;

const TABLES = [
  ['LOCO_STATE', LOCO_STATE, traits.FA_LOCO, MOVE_AQUA, MOVE_AIR],
  ['EX_LOCO_STATE', EX_LOCO_STATE, traits.EX_LOCO, MOVE_AQUA, MOVE_AIR],
  ['HABITAT_STATE', HABITAT_STATE, traits.FA_HABITAT, HAB_AQUA, HAB_AIR],
  ['EX_HABITAT_STATE', EX_HABITAT_STATE, traits.EX_HABITAT, HAB_AQUA, HAB_AIR],
] as const;

/** The rows whose flags differ from the original's tests on the game's name for that row. */
function drift(rows: readonly StateRow[], names: readonly string[], aqua: RegExp, air: RegExp): number[] {
  return names.flatMap((name, i) => {
    const row = rows[i];
    return row !== undefined && row[1] === aqua.test(name) && row[2] === air.test(name) ? [] : [i];
  });
}

const indices = (rows: readonly StateRow[], flag: 1 | 2): number[] => rows.flatMap((row, i) => (row[flag] ? [i] : []));

describe('aquatic and airborne tables', () => {
  it('names every row as the game\'s table does', () => {
    for (const [label, rows, names] of TABLES) {
      expect(rows, label).toHaveLength(names.length);
      rows.forEach(([name], i) => expect(name, `${label} row ${i}`).toBe(names[i]));
    }
  });

  it('every row equals the original\'s two name tests on the game\'s names', () => {
    for (const [label, rows, names, aqua, air] of TABLES) expect(drift(rows, names, aqua, air), label).toEqual([]);
    // Planted fault: current-drifters (movement 17) made aquatic is caught.
    const planted = LOCO_STATE.map((row, i): StateRow => (i === 17 ? [row[0], true, row[2]] : row));
    expect(drift(planted, traits.FA_LOCO, MOVE_AQUA, MOVE_AIR)).toEqual([17]);
  });

  it('the aquatic and airborne genes are exactly the plan\'s table', () => {
    expect([indices(LOCO_STATE, 1), indices(LOCO_STATE, 2)]).toEqual([[4, 9, 13], [3, 5, 11, 17]]);
    expect([indices(EX_LOCO_STATE, 1), indices(EX_LOCO_STATE, 2)]).toEqual([[1, 8], [2, 4, 5, 6, 7]]);
    expect([indices(HABITAT_STATE, 1), indices(HABITAT_STATE, 2)]).toEqual([[3, 8, 10, 12, 13, 15], [14]]);
    expect([indices(EX_HABITAT_STATE, 1), indices(EX_HABITAT_STATE, 2)]).toEqual([[0, 3], [5]]);
  });
});

describe('stateOf', () => {
  const neither = { aquatic: false, airborne: false };
  it('stateOf reads the extremophile tables only with the marker', () => {
    expect(stateOf({ loco: 2, habitat: 1 })).toEqual(neither);
    expect(stateOf({ loco: 2, habitat: 1, x: 1 })).toEqual({ aquatic: false, airborne: true }); // under-ice drifters
    expect(stateOf({ loco: 0, habitat: 8 })).toEqual({ aquatic: true, airborne: false }); // floating reef colonies
    expect(stateOf({ loco: 0, habitat: 8, x: 1 })).toEqual(neither); // the crushing lower decks
    expect(stateOf({ x: 1, loco: 0, habitat: 9 })).toEqual({ aquatic: true, airborne: false }); // wraps to hydrothermal vent fields
    for (const x of [0, NaN, null]) {
      expect(stateOf({ x, loco: 2, habitat: 1 }), String(x)).toEqual(neither);
      expect(stateOf({ x, loco: 0, habitat: 8 }), String(x)).toEqual({ aquatic: true, airborne: false });
    }
  });

  it('either gene is enough', () => {
    expect(stateOf({ loco: 3, habitat: 10 })).toEqual({ aquatic: true, airborne: true });
    expect(stateOf({ loco: 4, habitat: 0 })).toEqual({ aquatic: true, airborne: false });
    expect(stateOf({ loco: 0, habitat: 14 })).toEqual({ aquatic: false, airborne: true });
  });

  it('wraps drifted genes by each table\'s length', () => {
    expect(stateOf({ loco: 22, habitat: -1 })).toEqual({ aquatic: true, airborne: false }); // swimmers, crystal caverns
    expect(stateOf({})).toEqual(neither);
  });
});

describe('size tiers', () => {
  it('size gene 0 takes size 2\'s tier, as the original\'s (g.size||2)', () => {
    expect([...SIZE_TIER_BY_GENE]).toEqual(['medium', 'small', 'medium', 'medium', 'large', 'large']);
    expect(SIZE_TIER_BY_GENE[0]).toBe(SIZE_TIER_BY_GENE[2]);
    for (let gene = 1; gene <= 5; gene++) expect(SIZE_TIER_BY_GENE[gene], String(gene)).toBe(tierForSize(gene));
  });
});
