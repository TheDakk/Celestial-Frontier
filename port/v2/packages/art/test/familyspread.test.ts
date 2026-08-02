/* familyspread.test.ts — WAVE 20.
   The Platinum audit's verdict on the procedural fungi and microbes was that
   all 60 outputs of each were one template in different colours. This test is
   what keeps that from coming back, and it exists because the first cut of the
   fix was ALSO broken: `h ^= h >>> 16` is an int32 XOR, so the mixed hash came
   back negative for half the seeds, `-3 % 13` is -3, and 22 of 60 procedural
   fungi resolved to an `undefined` painter and rendered an EMPTY FRAME. The
   contact strip caught it; no gate would have.

   It calls procFamilyIndex — THE FUNCTION THE RENDERER CALLS. A test that
   re-implemented the hash would have re-implemented the sign bug with it and
   passed on the exact case it was written for. */
import { describe, it, expect } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { hashInt } from '@cf/domain-rand';
import { procFamilyIndex, FAMILY_COUNT } from '../src/proceduralfamilies.js';

/** the audit harness's own seed fan, so this tests the shipped spread */
function auditSeeds(kingdomIndex: number): Array<{ seed: number; heat: number }> {
  const out: Array<{ seed: number; heat: number }> = [];
  for (let heat = 0; heat <= 2; heat++) {
    for (let s = 0; s < 20; s++) out.push({ seed: hashInt(0xF00D, kingdomIndex * 100 + heat * 25 + s, 7) >>> 0, heat });
  }
  return out;
}

describe('procedural family spread', () => {
  /* kingdom index matches the audit harness's own ['fauna','flora','fungi','microbe'] */
  const KINGDOMS: Array<[number, string]> = [[2, 'fungi'], [3, 'microbe']];
  for (const [ki, kingdom] of KINGDOMS) {
    it(`${kingdom}: every one of the audit's 60 seeds picks a REAL family`, () => {
      const n = FAMILY_COUNT[kingdom]!;
      for (const { seed, heat } of auditSeeds(ki)) {
        const g = makeGenome(seed, kingdom, heat) as unknown as Record<string, unknown>;
        const i = procFamilyIndex(g, kingdom);
        expect(Number.isInteger(i), `seed ${seed} gave a non-integer index`).toBe(true);
        expect(i, `seed ${seed} indexed outside the table — this is the sign bug`).toBeGreaterThanOrEqual(0);
        expect(i, `seed ${seed} indexed past the table`).toBeLessThan(n);
      }
    });

    it(`${kingdom}: the spread reaches EVERY family and no family owns a third of it`, () => {
      const n = FAMILY_COUNT[kingdom]!;
      const hits = new Array<number>(n).fill(0);
      for (const { seed, heat } of auditSeeds(ki)) {
        const g = makeGenome(seed, kingdom, heat) as unknown as Record<string, unknown>;
        hits[procFamilyIndex(g, kingdom)]!++;
      }
      const missing = hits.map((h, i) => (h === 0 ? i : -1)).filter((i) => i >= 0);
      expect(missing, `families never reached by any of 60 seeds: ${missing.join(',')}`).toEqual([]);
      /* the pre-wave-20 selector put ~50% of fungi on one family; 20 of 60 is
         the line between "varied" and "a mono-template with extra steps" */
      expect(Math.max(...hits), 'one family dominates the spread').toBeLessThan(20);
    });
  }

  it('CONTROL: a selector that forgets to unsign its last mix DOES fail this test', () => {
    /* the exact bug, reproduced — if this control ever stops producing a
       negative index, the test above has stopped guarding anything */
    const bugged = (g: Record<string, unknown>, kingdom: string): number => {
      let h = (((g.seed as number) >>> 0) ^ ((((g.form as number) || 0) >>> 0) * 0x9E3779B1)) >>> 0;
      h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x85ebca6b) >>> 0;
      h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 0xc2b2ae35) >>> 0;
      h ^= h >>> 16;                                   /* ← the missing >>> 0 */
      return h % (FAMILY_COUNT[kingdom] || 1);
    };
    let negatives = 0;
    for (const { seed, heat } of auditSeeds(2)) {
      const g = makeGenome(seed, 'fungi', heat) as unknown as Record<string, unknown>;
      if (bugged(g, 'fungi') < 0) negatives++;
    }
    expect(negatives, 'the control no longer reproduces the sign bug').toBeGreaterThan(0);
  });
});
