/* The census read through the whole game: the domain's world generation and the app's own descent odds.
   fixtures/current/census-v1.json holds the legacy game's fingerprint; tools/census.mjs wrote it. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameCensusSources, type CensusDescent, type CensusPlanet, type CensusShares, type CensusSources } from '@cf/domain-worldkinds';
import { descentOdds } from '../../apps/game/src/landing/descent-policy';

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
  readonly schema: 'cf-census/v1';
  readonly source: string;
  readonly taken: string;
  /** The whole recorded census. */
  readonly full: CensusFixturePart;
  /** Its first worlds, the count the gate reads. */
  readonly gate: CensusFixturePart;
  readonly perThousand: readonly string[];
}

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'current', 'census-v1.json');

/** Strict: a missing file, another schema or a list of digests that does not cover the census throws. */
export function loadCensusFixture(): CensusFixture {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as CensusFixture;
  if (fixture.schema !== 'cf-census/v1') throw new Error('the census fixture has another schema');
  if (!/^celestial-frontier\.html sha256:[0-9a-f]{64} bytes:\d+$/.test(fixture.source)) throw new Error('the census fixture does not name the legacy file it was taken from');
  if (!Array.isArray(fixture.perThousand) || fixture.perThousand.length !== Math.ceil(fixture.full.planets / 1000)
    || fixture.perThousand.some((digest) => !/^[0-9a-f]{16}$/.test(digest))) {
    throw new Error('the census fixture does not hold one digest for each thousand worlds');
  }
  if (fixture.gate.planets % 1000 !== 0 || fixture.gate.planets > fixture.full.planets) throw new Error('the census fixture has no whole-thousand gate count');
  return fixture;
}

/** How many worlds this run reads: the gate's count, or the whole recorded census when CF_CENSUS=full. */
export function censusCount(fixture: CensusFixture): CensusFixturePart {
  return process.env.CF_CENSUS === 'full' ? fixture.full : fixture.gate;
}
