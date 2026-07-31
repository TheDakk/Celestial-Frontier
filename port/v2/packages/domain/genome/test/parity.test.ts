import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import {
  makeGenome, speciesGrade, sapienceTier, classifyRealm, realmBiome, ecologyRole,
  describeSpecies, faunaDesc, guardianFor, GUARDIAN_EPITHETS,
} from '@cf/domain-genome';
import { GRADE_TIERS } from '@cf/domain-speciestraits';

const fx = loadFixture();

describe('@cf/domain-genome — golden ×71,000', () => {
  it('makeGenome fauna: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'makeGenome_fauna', (s) => makeGenome(s, 'fauna', 0.5));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('makeGenome flora: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'makeGenome_flora', (s) => makeGenome(s, 'flora', 0.3));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('makeGenome fungi: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'makeGenome_fungi', (s) => makeGenome(s, 'fungi', 0.7));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('makeGenome microbe: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'makeGenome_microbe', (s) => makeGenome(s, 'microbe', 0.1));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('speciesGrade: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'speciesGrade', (s) => speciesGrade(makeGenome(s, 'fauna', 0.5)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('sapienceTier: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'sapienceTier', (s) => sapienceTier(makeGenome(s, 'fauna', 0.5)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('classifyRealm + realmBiome: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'classifyRealm', (s) => [classifyRealm(makeGenome(s, 'fauna', 0.5)), realmBiome(makeGenome(s, 'fauna', 0.5))]);
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('guardianFor: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'guardianFor', (s) => guardianFor(s));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('describeSpecies: 1,000 seeds (heavy tier)', () => {
    const r = checkGenerator(fx, 'describeSpecies', (s) => describeSpecies(makeGenome(s, 'fauna', 0.5)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes (recipes mirror tools/probe.js exactly)', () => {
  const G1 = () => makeGenome(1234, 'fauna', 0.5);
  const G2 = () => makeGenome(5678, 'fauna', 0.2);
  it('makeGenome probe (4 kingdoms)', () => {
    expect(canon(['fauna', 'flora', 'fungi', 'microbe'].map((k, i) => makeGenome(1000 + i, k, 0.3 * i)))).toBe(probeRaw('makeGenome'));
  });
  it('describeSpecies probe', () => {
    expect(canon([G1(), G2(), makeGenome(9, 'flora', 0.8)].map((g) => describeSpecies(g)))).toBe(probeRaw('describeSpecies'));
  });
  it('faunaDesc probe', () => {
    expect(canon(faunaDesc(G1()))).toBe(probeRaw('faunaDesc'));
  });
  it('speciesGrade probe', () => {
    expect(canon([G1(), G2()].map((g) => speciesGrade(g)))).toBe(probeRaw('speciesGrade'));
  });
  it('sapience probe', () => {
    expect(canon([G1(), G2()].map((g) => sapienceTier(g)))).toBe(probeRaw('sapience'));
  });
  it('realm probe', () => {
    expect(canon([G1(), G2()].map((g) => [realmBiome(g), classifyRealm(g), ecologyRole(g)]))).toBe(probeRaw('realm'));
  });
  it('guardians probe: which of the first 2000 world seeds are guarded', () => {
    const ruled: Array<[number, number, string]> = [];
    for (let s = 1; s <= 2000; s++) { const g = guardianFor(s); if (g) ruled.push([s, g.tier, g.name]); }
    expect(canon({ count: ruled.length, first: ruled.slice(0, 8) })).toBe(probeRaw('guardians'));
  });
});

describe('★ ROADMAP 9g, part 2 — the collapse holds END-TO-END through speciesGrade', () => {
  /* Module 8 pinned the GRADE_TIERS DATA. This suite pins the conversion the
     player actually sees: a creature whose RAW tier is deep-spectrum (9–14)
     must SURFACE as Transcendent, including the forced apex/paragon paths
     that bypass the boost arithmetic entirely. */
  it('apex guardians (forced raw 12–14) all surface as Transcendent', () => {
    let seen = 0;
    for (let s = 1; s <= 2000 && seen < 20; s++) {
      const gd = guardianFor(s);
      if (!gd) continue;
      seen++;
      expect(gd.tier).toBeGreaterThanOrEqual(12);
      expect(gd.tier).toBeLessThanOrEqual(14);
      const grade = speciesGrade(gd.genome);
      expect(grade.name, `guardian seed ${s} (raw tier ${gd.tier})`).toBe('Transcendent');
    }
    expect(seen).toBeGreaterThan(0);   /* the loop must have actually tested something */
  });
  it('speciesGrade.name always equals GRADE_TIERS[tier].name (grade cannot drift from the ladder)', () => {
    for (let s = 1; s <= 500; s++) {
      const g = speciesGrade(makeGenome(s, 'fauna', 0.5));
      expect(g.name).toBe(GRADE_TIERS[g.tier]!.name);
    }
  });
  it('guardian names carry an epithet from GUARDIAN_EPITHETS', () => {
    const gd = (() => { for (let s = 1; s <= 2000; s++) { const g = guardianFor(s); if (g) return g; } return null; })();
    expect(gd).not.toBeNull();
    expect(GUARDIAN_EPITHETS.some((e) => gd!.name.endsWith(e))).toBe(true);
  });
});
