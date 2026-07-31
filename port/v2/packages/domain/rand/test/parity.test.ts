/* Gate B parity: @cf/domain-rand vs the v1.8.9 golden corpus.
   30,000 cases (3 generators × 10,000 seeds), per-seed FNV hashes + rollups.

   The generator wrappers below MUST mirror tools/goldenseeds-probe.js exactly —
   same call shapes, same seed masking. They are part of the fixture contract. */
import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, fnvHash } from '../../../../tests/parity.js';
import { mulberry32, hashInt, cellRng, makeNoise } from '../src/index.js';

const fx = loadFixture();

const GENS: Record<string, (s: number) => unknown> = {
  hashInt: (s) => [hashInt(s, 1, 2), hashInt(s, 0, 0), hashInt(s, 0xFFFF, 7)],
  mulberry32: (s) => { const r = mulberry32(s >>> 0); return [r(), r(), r(), r(), r()]; },
  cellRng: (s) => { const r = cellRng(s & 0xFFFF, (s >>> 16) & 0xFFFF, 3); return [r(), r(), r()]; },
  /* ★ 2026-07-31: the gap recorded in src/index.ts since module 1 CLOSES —
     the corpus was extended (addition-only, diff-verified) with makeNoise. */
  makeNoise: (s) => { const n = makeNoise(s >>> 0); return [n(0.3, 0.7), n(12.5, -4.2), n(100, 100), n((s % 89) * 0.13, (s % 71) * -0.29, 3)]; },
};

describe('parity spec self-check', () => {
  it('fixture samples hash to their recorded per-seed values (validates canon+fnv against the fixture itself)', () => {
    const ours = new Set(Object.keys(GENS));
    const relevant = fx.samples.filter((s) => ours.has(s.gen));
    expect(relevant.length).toBeGreaterThan(0);
    for (const s of relevant) {
      expect(fnvHash(s.canonical), `sample ${s.gen}[${s.i}] seed ${s.seed}`).toBe(fx.generators[s.gen]!.perSeed[s.i]);
    }
  });
});

describe('@cf/domain-rand — 40,000-case golden parity (Gate B)', () => {
  for (const name of Object.keys(GENS)) {
    it(`${name}: 10,000 seeds, per-seed + rollup`, () => {
      const r = checkGenerator(fx, name, GENS[name]!);
      expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}: ${m.want} -> ${m.got}`).join('\n')).toEqual([]);
      expect(r.rollupOk, `${name} rollup`).toBe(true);
      expect(r.cases).toBe(10000);
    });
  }
});
