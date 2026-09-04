/* Modules 2–4 parity: WorldConfig / Naming / StarCatalog.
   One file — the three are tiny and their fixtures interlock (Naming needs
   WorldConfig's anchors; starClass needs both fixture sources). */
import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw, probeParsed } from '../../../../tests/baseline.js';
import {
  UCELL, OBS_R, GR, GCELL, SYS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED, SOL_POS,
} from '@cf/domain-worldconfig';
import { properName, galaxyName, starName } from '@cf/domain-naming';
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

describe('@cf/domain-naming — baseline `names` probe', () => {
  it('properName/galaxyName/starName match all 7 fingerprint seed groups (speciesName slot deferred to Genome)', () => {
    const stored = probeParsed('names') as string[];
    const seeds = [1, 7, 133, 999, 424242, 31337, 270549077];
    seeds.forEach((s, g) => {
      expect(properName(s, 3), `properName(${s},3)`).toBe(stored[g * 4]);
      expect(galaxyName(s), `galaxyName(${s})`).toBe(stored[g * 4 + 1]);
      expect(starName(s), `starName(${s})`).toBe(stored[g * 4 + 2]);
    });
  });
  it('home anchors resolve to their canonical names', () => {
    expect(galaxyName(999)).toBe('Milky Way');
    expect(starName(424242)).toBe('Sun (Sol)');
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
