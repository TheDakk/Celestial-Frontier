import { describe, it, expect } from 'vitest';
import { canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { biosphere, civilization, planetSpecies } from '@cf/domain-ecology';
import { systemFor } from '@cf/domain-worldgen';
import { climateBand } from '@cf/domain-surveyphrases';
import { mulberry32 } from '@cf/domain-rand';

/* ⚠ FIXTURE COVERAGE, recorded not silent: no golden generator samples
   Ecology directly, and the one fingerprint probe (planetSpecies) is VACUOUS
   BY CAPTURE — probe.js passes level=2 where the code branches on level
   STRINGS ('complex', 'aquatic', …), so the stored value is literally "[]"
   and has been since v1.0. We reproduce it exactly (the recipe is the
   contract, vacuous or not — never re-capture), and cover the real behavior
   with outcome invariants below. REAL volume pinning arrives transitively
   with module 13: planetDescriptor ×1,000 drives biosphere/civilization/
   planetSpecies with live levels over real systems.
   ★ NEGATIVE-CONTROL RESULT, measured 2026-07-31: perturbing the roster salt
   0xB105 passed ALL 7 tests here (every roster in the universe shifted,
   nothing failed) — the gap above is REAL, not theoretical. The Earth-year
   control (2026→2027) fails as it must, so the suite is not inert. Module 13
   is what closes the salt hole; do not call Ecology "pinned" until it lands. */

describe('@cf/domain-ecology — baseline probe (vacuous by capture, reproduced exactly)', () => {
  it('planetSpecies probe: systemFor(424242) planet 2, level literal 2 → the stored []', () => {
    const sys = systemFor(424242);
    const pl = (sys.planets || [])[2] as { P: { seed: number }; orb?: number } | undefined;
    const got = pl ? planetSpecies(pl.P, sys, climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2), 2) : 'no-planet';
    expect(canon(got)).toBe(probeRaw('planetSpecies'));
  });
});

describe('outcome invariants (until planetDescriptor ×1k pins these transitively)', () => {
  it('Earth (seed 133) is hand-authored: abundant biosphere, Humanity at year 2026', () => {
    const bio = biosphere({ seed: 133, type: 'terran' }, null, 'temperate', mulberry32(1));
    expect(bio.key).toBe('earth');
    const civ = civilization({ seed: 133 }, null, 'temperate', bio, mulberry32(1));
    expect(civ.civ).toBe(true);
    expect(civ.name).toBe('Humanity');
    expect(civ.year).toBe(2026);
    expect(civ.pop).toBe('~8 billion');
  });
  it('the rest of Sol is barren by design', () => {
    const bio = biosphere({ seed: 999, type: 'terran' }, { sol: true }, 'temperate', mulberry32(1));
    expect(bio.key).toBe('none');
  });
  it('civilization only arises on Abundant worlds (the /Abundant/ gate)', () => {
    const civ = civilization({ seed: 555 }, null, 'temperate', { level: 'Plant-like flora only', key: 'flora' }, mulberry32(2));
    expect(civ.civ).toBe(false);
    expect(civ.wild).toBeUndefined();
  });
  it('a complex roster is deterministic, non-empty, and spans the food web', () => {
    const P = { seed: 424242 };
    const a = planetSpecies(P, null, 'temperate', 'complex');
    expect(a.length).toBeGreaterThanOrEqual(11);   /* base 3+1+2+5 guaranteed */
    const kingdoms = new Set(a.map((g) => g.kingdom));
    for (const k of ['flora', 'fungi', 'microbe', 'fauna']) expect(kingdoms.has(k), k).toBe(true);
    /* memo: same key returns the SAME array (identity), not a rebuild */
    expect(planetSpecies(P, null, 'temperate', 'complex')).toBe(a);
    /* every species is a distinct genome seed (unique slots) */
    expect(new Set(a.map((g) => g.seed)).size).toBe(a.length);
  });
  it('xfauna worlds mark their fauna as extremophile (x=1 reads the EX pools)', () => {
    /* seed chosen so the roster contains fauna; every fauna must carry x=1 */
    for (let s = 50; s < 60; s++) {
      const list = planetSpecies({ seed: s }, null, 'hot', 'xfauna');
      for (const g of list) if (g.kingdom === 'fauna' && !g.wild) expect(g.x, `seed ${s}`).toBe(1);
    }
  });
  it('aquatic worlds grow sea flora (aq=1) after the wild-hybrid roll', () => {
    let sawAq = false;
    for (let s = 1; s < 30 && !sawAq; s++) {
      const list = planetSpecies({ seed: s }, null, 'temperate', 'aquatic');
      if (list.some((g) => g.aq === 1 && g.kingdom === 'flora')) sawAq = true;
    }
    expect(sawAq).toBe(true);
  });
});
