import { describe, expect, it } from 'vitest';
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
    const literal = '["object",[["body",["number","0"]],["kingdom",["string","fauna"]],["list",["array",[["number","1"],["string","x"]]]],["lumin",["boolean",true]],["name",["string","a|b"]],["neg",["number","-3"]],["nothing",["null"]],["seed",["number","1"]],["zero",["number","-0"]]]]|["p1","p2"]';
    expect(identityKey(genome, ['p1', 'p2'])).toBe(literal);
    // Top-level life-state keys leave no trace in the key.
    expect(identityKey({ ...genome, xp: 40, hurt: 0.5, bond: { level: 2 }, _wf: 'ice' }, ['p1', 'p2'])).toBe(literal);
  });
  it('pins the seed fold for renderer version 1', () => {
    const s = artStream('k', 'head', 1);
    expect([pick(s, 1000000), pick(s, 1000000)]).toEqual([300315, 112488]);
  });
});
