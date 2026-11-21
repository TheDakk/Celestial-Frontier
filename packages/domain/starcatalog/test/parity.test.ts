/* Modules 2–4 parity: WorldConfig / Naming / StarCatalog.
   One file — the three are tiny and their fixtures interlock (Naming needs
   WorldConfig's anchors; starClass needs both fixture sources). */
import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/support/parity.js';
import { probeRaw, probeParsed } from '../../../../tests/support/baseline.js';
import {
  UCELL, OBS_R, GR, GCELL, SYS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED, SOL_POS,
} from '@cf/domain-worldconfig';
import { starClass, SOL_PLANETS } from '@cf/domain-starcatalog';

describe('@cf/domain-worldconfig — baseline `constants` probe', () => {
  it('anchors match the fingerprint (indices 0–6; 7–9 are app-layer constants, later module)', () => {
    const c = probeParsed('constants') as unknown[];
    expect(canon([UCELL, OBS_R, GR, SYS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED])).toBe(canon(c.slice(0, 7)));
  });
  it('pins the remaining grid/Sol anchors and immutable coordinate records directly', () => {
    expect(GCELL).toBe(42);
    expect(SOL_POS).toEqual({ x: 560, y: 170 });
    expect([HOME_POS, SOL_POS].every(Object.isFrozen)).toBe(true);
  });
});

describe('@cf/domain-starcatalog — golden ×10,000 + baseline probe', () => {
  it('starClass: 10,000 golden seeds, per-seed + rollup', () => {
    const r = checkGenerator(loadFixture(), 'starClass', (s) => starClass(s));
    expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}`).join(', ')).toEqual([]);
    expect(r.rollupOk).toBe(true);
  });
  it('starClass: the baseline fingerprint 10-seed probe', () => {
    const SEEDS = [133, 1, 2, 3, 42, 1000, 31337, 99999, 123456, 7777777];
    expect(canon(SEEDS.map((s) => starClass(s)))).toBe(probeRaw('starClass'));
  });
  it('Sol is hand-authored: seed 424242 is a G star; Earth is seed 133 at orbit 112', () => {
    expect(starClass(424242)).toEqual({ kind: 'G', col: '#fff4d8', r: 26 });
    const earth = SOL_PLANETS[2]!;
    expect(earth.name).toBe('Earth');
    expect(earth.P['seed']).toBe(133);
    expect(earth.orb).toBe(112);
  });
});
