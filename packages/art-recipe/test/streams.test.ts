import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { testCatalogue } from '@cf/art-testparts';
import { buildRecipe } from '../src/recipe';
import { artStream, identityKey, pick } from '../src/streams';

const id = identityKey({ seed: 1, body: 0 }, []);

describe('art streams', () => {
  it('is repeatable', () => { expect(artStream(id, 'head', 1)()).toBe(artStream(id, 'head', 1)()); });
  it('separates streams by name', () => { expect(artStream(id, 'head', 1)()).not.toBe(artStream(id, 'tail', 1)()); });
  it('separates streams by version', () => { expect(artStream(id, 'head', 1)()).not.toBe(artStream(id, 'head', 2)()); });
  it('separates identities that share a seed', () => { expect(identityKey({ seed: 1, body: 0 }, [])).not.toBe(identityKey({ seed: 1, body: 1 }, [])); });
  it('separates parent order', () => { expect(identityKey({ seed: 1 }, ['a', 'b'])).not.toBe(identityKey({ seed: 1 }, ['b', 'a'])); });
  it('separates an empty lineage from one empty parent', () => { expect(identityKey({ seed: 1 }, [])).not.toBe(identityKey({ seed: 1 }, [''])); });
  it('separates a parent containing the old separator from two parents', () => { expect(identityKey({ seed: 1 }, ['a>b'])).not.toBe(identityKey({ seed: 1 }, ['a', 'b'])); });
  it('ignores key order', () => { expect(identityKey({ a: 1, b: 2 }, [])).toBe(identityKey({ b: 2, a: 1 }, [])); });
  it('drawing from one stream does not move another', () => {
    const tail = artStream(id, 'tail', 1); const first = tail();
    const head = artStream(id, 'head', 1); head(); head(); head();
    expect(artStream(id, 'tail', 1)()).toBe(first);
  });
  it('picks inside the range', () => { const s = artStream(id, 'x', 1); for (let i = 0; i < 200; i++) expect(pick(s, 3)).toBeLessThan(3); });
  it('reaches every value in the range', () => {
    const s = artStream(id, 'y', 1); const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(pick(s, 3));
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });
  it('serialises a fixed genome to the key the source function produces', () => {
    const genome = { seed: 1, body: 0, kingdom: 'fauna', lumin: true, name: 'a|b', nothing: null, list: [1, 'x'], neg: -3, zero: -0 };
    const literal = '["object",[["body",["number","0"]],["kingdom",["string","fauna"]],["list",["array",[["number","1"],["string","x"]]]],["lumin",["boolean",true]],["name",["string","a|b"]],["neg",["number","-3"]],["nothing",["null"]],["seed",["number","1"]],["zero",["number","0"]]]]|["p1","p2"]';
    expect(identityKey(genome, ['p1', 'p2'])).toBe(literal);
    // Top-level life-state keys leave no trace in the key.
    expect(identityKey({ ...genome, xp: 40, hurt: 0.5, bond: { level: 2 }, _wf: 'ice' }, ['p1', 'p2'])).toBe(literal);
  });
  it('pins the seed fold for renderer version 1', () => {
    const s = artStream('k', 'head', 1);
    expect([pick(s, 1000000), pick(s, 1000000)]).toEqual([300315, 112488]);
  });
});

/** makeGenome called the way a caller that forgets the heat argument would call it. */
const withoutHeat = (seed: number): Record<string, unknown> =>
  (makeGenome as unknown as (seed: number, kingdom: string) => Record<string, unknown>)(seed, 'fauna');

describe('identity survives a save round trip', () => {
  const base = { ...makeGenome(7, 'fauna', 1) } as Record<string, unknown>;
  const cases: [string, Record<string, unknown>][] = [
    ['a key set to undefined', { ...base, extra: undefined }],
    ['a NaN gene', { ...base, head: NaN }],
    ['an Infinity gene', { ...base, tail: Infinity }],
    ['a -Infinity gene', { ...base, tail: -Infinity }],
    ['a -0 gene', { ...base, limbs: -0 }],
    ['an array with an undefined item', { ...base, parents: ['a', undefined, 'b'] }],
    ['makeGenome with the heat argument omitted', withoutHeat(7)],
  ];
  const catalogue = testCatalogue();
  it.each(cases)('%s: same key and same recipe after JSON.stringify and JSON.parse', (_label, genome) => {
    const loaded = JSON.parse(JSON.stringify(genome)) as Record<string, unknown>;
    expect(identityKey(genome, ['p'])).toBe(identityKey(loaded, ['p']));
    expect(buildRecipe(genome, ['p'], catalogue)).toEqual(buildRecipe(loaded, ['p'], catalogue));
  });
  it('encodes each JSON-lossy value exactly as JSON carries it', () => {
    expect(identityKey({ a: undefined, b: 1 }, [])).toBe(identityKey({ b: 1 }, []));
    for (const v of [NaN, Infinity, -Infinity]) expect(identityKey({ a: v }, [])).toBe(identityKey({ a: null }, []));
    expect(identityKey({ a: -0 }, [])).toBe(identityKey({ a: 0 }, []));
    expect(identityKey({ a: [undefined] }, [])).toBe(identityKey({ a: [null] }, []));
  });
  it('the heat-omitted genome really holds a key set to undefined', () => {
    const g = withoutHeat(7);
    expect(Object.hasOwn(g, 'heat') && g['heat'] === undefined).toBe(true);
  });
});
