/* ═══ GATE B DELIVERABLE: the full 25-generator sweep from TypeScript ═══
   Every generator in port/baseline-v1.8.9/golden-seeds.json runs here from
   the ported packages, in ONE place, with the recipe table mirrored from
   tools/goldenseeds-probe.js. The per-module suites remain the diagnostic
   view; THIS file is the completeness claim — if a generator is added to the
   fixture and not here, the coverage assertion at the bottom fails. */
import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator } from './parity.js';
import { mulberry32, hashInt, cellRng, makeNoise } from '@cf/domain-rand';
import { starClass } from '@cf/domain-starcatalog';
import { planetParams } from '@cf/domain-planetgen';
import { systemFor } from '@cf/domain-worldgen';
import { climateBand } from '@cf/domain-surveyphrases';
import { rarityRoll, colorGrade, spectral } from '@cf/domain-speciestraits';
import { makeGenome, speciesGrade, sapienceTier, classifyRealm, realmBiome, guardianFor, describeSpecies } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { battleStats } from '@cf/domain-combatcore';
import { planetDescriptor, starDescriptor, installCaptureHooks } from '@cf/domain-descriptors';
import { biomeFor, hdGenesFor } from '@cf/domain-strays';

installCaptureHooks();
const fx = loadFixture();

const firstPlanet = (s: number) => {
  const sys = systemFor(s); const pl = (sys.planets || [])[0] as { P: { seed: number }; orb?: number } | undefined;
  return { sys, pl };
};

/* recipe per generator — mirrors tools/goldenseeds-probe.js EXACTLY */
const RECIPES: Record<string, (s: number) => unknown> = {
  hashInt: (s) => [hashInt(s, 1, 2), hashInt(s, 0, 0), hashInt(s, 0xFFFF, 7)],
  mulberry32: (s) => { const r = mulberry32(s >>> 0); return [r(), r(), r(), r(), r()]; },
  cellRng: (s) => { const r = cellRng(s & 0xFFFF, (s >>> 16) & 0xFFFF, 3); return [r(), r(), r()]; },
  starClass: (s) => starClass(s),
  planetParams: (s) => planetParams(s),
  rarityRoll: (s) => [rarityRoll(s, 1), rarityRoll(s, 3), rarityRoll(s, 0x10F)],
  colorGrade: (s) => colorGrade(s % 360, s, null),
  spectral: (s) => spectral('nebula', s, null),
  makeGenome_fauna: (s) => makeGenome(s, 'fauna', 0.5),
  makeGenome_flora: (s) => makeGenome(s, 'flora', 0.3),
  makeGenome_fungi: (s) => makeGenome(s, 'fungi', 0.7),
  makeGenome_microbe: (s) => makeGenome(s, 'microbe', 0.1),
  speciesGrade: (s) => speciesGrade(makeGenome(s, 'fauna', 0.5)),
  sapienceTier: (s) => sapienceTier(makeGenome(s, 'fauna', 0.5)),
  classifyRealm: (s) => [classifyRealm(makeGenome(s, 'fauna', 0.5)), realmBiome(makeGenome(s, 'fauna', 0.5))],
  guardianFor: (s) => guardianFor(s),
  crossGenome: (s) => crossGenome(makeGenome(s, 'fauna', 0.4), makeGenome(s + 1, 'fauna', 0.6)),
  crossGenome_uncorrelated: (s) => crossGenome(makeGenome(hashInt(s, 12345, 1) >>> 0, 'fauna', 0.4), makeGenome(hashInt(s, 54321, 2) >>> 0, 'fauna', 0.6)),
  makeNoise: (s) => { const n = makeNoise(s >>> 0); return [n(0.3, 0.7), n(12.5, -4.2), n(100, 100), n((s % 89) * 0.13, (s % 71) * -0.29, 3)]; },
  describeSpecies: (s) => describeSpecies(makeGenome(s, 'fauna', 0.5)),
  battleStats: (s) => battleStats(makeGenome(s, 'fauna', 0.5)),
  hdGenesFor: (s) => hdGenesFor(makeGenome(s, 'fauna', 0.5)),
  systemFor: (s) => { const sys = systemFor(s); return { n: (sys.planets || []).length, p: (sys.planets || []).slice(0, 3).map((q: { P: unknown }) => q.P) }; },
  starDescriptor: (s) => starDescriptor(s),
  planetDescriptor: (s) => { const { sys, pl } = firstPlanet(s); return pl ? planetDescriptor(pl.P, sys, pl) : 'no-planet'; },
  climateBand: (s) => { const { sys, pl } = firstPlanet(s); return pl ? climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2) : 'no-planet'; },
  biomeFor: (s) => {
    const { sys, pl } = firstPlanet(s);
    if (!pl) return 'no-planet';
    const b = climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2);
    const r = biomeFor(pl.P, b) as { k?: unknown } | null;
    return r ? (r.k || r) : null;
  },
};

describe('★ GATE B — full generator sweep from TS', () => {
  const names = Object.keys(fx.generators).sort();
  it(`every fixture generator has a recipe (${names.length} generators)`, () => {
    const missing = names.filter((n) => !RECIPES[n]);
    expect(missing, 'fixture generators with NO TS recipe').toEqual([]);
  });
  for (const name of Object.keys(fx.generators).sort()) {
    it(`${name}: ${fx.generators[name]!.cases} cases`, () => {
      const r = checkGenerator(fx, name, RECIPES[name]!);
      expect(r.mismatches).toEqual([]);
      expect(r.rollupOk).toBe(true);
    });
  }
});
