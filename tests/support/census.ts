/* The seeded census read through the game: the domain's world generation and the app's own descent odds.
   fixtures/v1/recorded/census.json holds the legacy game's fingerprint; tools/census.mjs wrote it. */
import { gameCensusSources, type CensusDescent, type CensusHits, type CensusPlanet, type CensusShares, type CensusSources } from '@cf/domain-worldkinds';
import { descentOdds } from '../../apps/game/src/landing/descent-policy';
import { loadRecorded } from './v1-recorded';

/** A first landing as the game works it out: no storm, no wave-off, no gear. */
export function firstLanding(planet: CensusPlanet, band: string): CensusDescent {
  const odds = descentOdds({ planet: planet.P, band, stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false });
  return { percent: odds.successPercent, damageMin: odds.damageMin, damageMax: odds.damageMax };
}

export function gameSources(): CensusSources {
  return gameCensusSources((planet, _system, band) => firstLanding(planet, band));
}

export interface CensusFixturePart {
  readonly planets: number;
  readonly total: string;
  readonly shares: CensusShares;
}

export interface CensusFixture {
  readonly source: string;
  /** The whole recorded census, and how many of its worlds hit each entry of each table. */
  readonly full: CensusFixturePart & { readonly hits: CensusHits };
  /** Its first worlds: the count the census of switches reads. */
  readonly gate: CensusFixturePart;
  /** One digest for each thousand worlds of the whole census. */
  readonly perThousand: readonly string[];
}

/** Strict: a missing file, a missing case or a list of digests that does not cover the census throws. */
export function loadCensusFixture(): CensusFixture {
  const recorded = loadRecorded('census');
  const cases = recorded.cases as { group: string }[];
  const one = <T>(group: string): T => {
    const found = cases.filter((c) => c.group === group);
    if (found.length !== 1) throw new Error(`the census fixture holds ${found.length} ${group} cases, not one`);
    return found[0] as unknown as T;
  };
  const full = one<CensusFixture['full']>('full');
  const gate = one<CensusFixturePart>('gate');
  const perThousand = one<{ digests: string[] }>('thousands').digests;
  if (!/^celestial-frontier\.html sha256:[0-9a-f]{64} bytes:\d+$/.test(recorded.source)) throw new Error('the census fixture does not name the legacy file it was taken from');
  if (!Array.isArray(perThousand) || perThousand.length !== Math.ceil(full.planets / 1000) || perThousand.some((digest) => !/^[0-9a-f]{16}$/.test(digest))) {
    throw new Error('the census fixture does not hold one digest for each thousand worlds');
  }
  if (gate.planets % 1000 !== 0 || gate.planets > full.planets) throw new Error('the census fixture has no whole-thousand gate count');
  return { source: recorded.source, full, gate, perThousand };
}
