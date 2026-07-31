import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { crossGenome, evolveGenome } from '@cf/domain-genetics';
import { makeGenome } from '@cf/domain-genome';
import { hashInt } from '@cf/domain-rand';

const fx = loadFixture();

describe('@cf/domain-genetics — golden ×10,000', () => {
  it('crossGenome: 10,000 seed pairs', () => {
    const r = checkGenerator(fx, 'crossGenome', (s) => crossGenome(makeGenome(s, 'fauna', 0.4), makeGenome(s + 1, 'fauna', 0.6)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes (recipes mirror tools/probe.js exactly)', () => {
  const G1 = () => makeGenome(1234, 'fauna', 0.5);
  const G2 = () => makeGenome(5678, 'fauna', 0.2);
  it('crossGenome probe', () => {
    expect(canon(crossGenome(G1(), G2()))).toBe(probeRaw('crossGenome'));
  });
  it('evolveGenome probe (4 epochs)', () => {
    expect(canon(evolveGenome(G1(), 4))).toBe(probeRaw('evolveGenome'));
  });
});

describe('audited invariants (PROCESS_LAWS: assert the outcome)', () => {
  /* ⚠ FIXTURE BLIND SPOT, found 2026-07-31 while writing this suite: the golden
     crossGenome recipe pairs CONSECUTIVE seeds (s, s+1), and that input
     correlation makes mulberry32(hashInt(s^0xA5A5, s+1, 7))'s draw at the
     mutation-index position wildly non-uniform — measured over the corpus's
     4,000+ pairs the mutation picks color 80%, trait 12.5%, loco 7%, and
     'size' NEVER. So all 10,000 golden cases leave the size-mutation branch
     unexecuted; a port bug there would pass them all. With uncorrelated
     parent seeds (the real-game shape — bred/child seeds are hash outputs)
     the pick is uniform. Remedy queued for Gate B close-out: extend the
     corpus with an uncorrelated-pair crossGenome generator (an ADDITION —
     never re-capture the existing one). The test below covers the branch
     with realistic pairs until then. */
  it('bred size is UNWRAPPED in the genome — the v1.8.7 lesson: readers wrap, storage must not', () => {
    /* uncorrelated parents (hashed seeds) so the mutation branch actually
       exercises size; assert the raw overflowed value survives — a "helpful"
       clamp in the port would repeat v1.8.6 */
    let sawOverflow = false;
    for (let s = 1; s < 4000 && !sawOverflow; s++) {
      const child = crossGenome(
        makeGenome(hashInt(s, 12345, 1), 'fauna', 0.4),
        makeGenome(hashInt(s, 54321, 2), 'fauna', 0.6));
      if (child.size > 5) sawOverflow = true;
    }
    expect(sawOverflow, 'no size>5 child in 4,000 uncorrelated pairs — mutation path changed?').toBe(true);
  });
  it('extremophile markers require BOTH parents (the hardy line dilutes)', () => {
    const a = makeGenome(11, 'fauna', 0.5), b = makeGenome(12, 'fauna', 0.5);
    const ax = { ...makeGenome(11, 'fauna', 0.5), x: 1 };
    expect(crossGenome(ax, b).x).toBeUndefined();
    expect(crossGenome({ ...a, x: 1 }, { ...b, x: 1 }).x).toBe(1);
  });
  it('evolveGenome(g, 0) returns the genome untouched', () => {
    const g = makeGenome(99, 'fauna', 0.5);
    expect(evolveGenome(g, 0)).toBe(g);
  });
});
