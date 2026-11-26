// Every tier, every rare-vein entry, the cosmic veins, the depth boost and every ring cap, against the legacy game's
// own answers (LEGACY celestial-frontier.html: depositsFor 21260-21275, cosmicVeinFor 21308-21316, exVeinFor
// 21335-21341, reserveFor 21407-21411, rarityRoll 4240-4260, the designation 5158-5163, regionAt 24421, gradeCapAt
// 14685-14695, ringDesignation 14733-14747). fixtures/v1/recorded/census-veins.json holds them; tools/census.mjs
// wrote it. The seeded census reaches tier 9 once in 100,000 worlds; these cases are aimed at what it cannot reach.
// The places are read through worldVeinsAt, the one rule a world's snapshot is built by: the depth boost and the ring
// cap are worked out there and nowhere in this test. Of every real star under a capped ring the legacy game cuts
// five worlds (four in the Neighborhood, one in the Local Cluster: apps/game/test/census-addressed.test.ts holds
// them); the other caps cut no real world, so made places are the only way to see them bite.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { rarityRoll } from '@cf/domain-speciestraits';
import { loadRecorded } from '../../../../tests/support/v1-recorded.js';
import {
  GRID_SEEDS, VEIN_LIFE, VEIN_PLACES, VEIN_TIERS, VEIN_TYPES, VeinHits, gridSeeds, veinLine, type VeinAnswer,
} from '../../../../tests/support/census-veins.js';
import { DEPOSIT_PROFILES, RARE_VEIN, worldVeinsAt, worldVeinsBySeed, type WorldVeins } from '../src/index.js';

interface GridCase { group: 'grid'; input: { tier: number; type: string; seeds: number }; output: string }
interface RollCase { group: 'roll'; input: { roll: number; seeds: number[] }; output: string }
interface HitsCase { group: 'hits'; output: Record<string, Record<string, number>> }

const recorded = loadRecorded('census-veins').cases as (GridCase | RollCase | HitsCase)[];
const grid = recorded.filter((c): c is GridCase => c.group === 'grid');
const rolls = recorded.filter((c): c is RollCase => c.group === 'roll');
const recordedHits = recorded.find((c): c is HitsCase => c.group === 'hits')!.output;

const digestOf = (lines: readonly string[]): string => createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);

function answerOf(veins: WorldVeins): VeinAnswer {
  return {
    rawTier: veins.rawTier, tier: veins.effectiveTier, deposits: veins.deposits,
    cosmicVein: veins.cosmicVein, exceptionalVein: veins.exceptionalVein, reserve: veins.reservePulls,
  };
}

describe('a world\'s veins against the legacy game\'s, where the seeded census cannot reach', () => {
  const hits = new VeinHits(DEPOSIT_PROFILES, RARE_VEIN);
  const failures: string[] = [];

  it('every tier with every planet type: deposits, cosmic vein, exceptional vein and reserve', () => {
    expect(grid).toHaveLength(VEIN_TIERS * VEIN_TYPES.length);
    for (const { input, output } of grid) {
      expect(input.seeds).toBe(GRID_SEEDS);
      // A depth boost of 14 lifts any roll to the summit; the cap then sets the tier asked for.
      const lines = gridSeeds(input.tier, input.type).map((seed) => {
        const answer = answerOf(worldVeinsBySeed({
          planetSeed: seed, planetType: input.type, biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 14, tierCap: input.tier,
        }));
        hits.answer(input.type, { ...answer, rawTier: input.tier });
        return veinLine(seed, input.type, { ...answer, rawTier: input.tier });
      });
      if (digestOf(lines) !== output) failures.push(`tier ${input.tier} ${input.type}`);
    }
    expect(failures, 'the cells of tier and type whose answers differ from the legacy game\'s').toEqual([]);
  });

  it('seeds of every rarity roll, at every depth and under every ring cap, with each boost from life', () => {
    expect(rolls.map((c) => c.input.roll)).toEqual(Array.from({ length: VEIN_TIERS }, (_, tier) => tier));
    const differing: string[] = [];
    for (const { input, output } of rolls) {
      const lines: string[] = [];
      expect(input.seeds.length, `seeds of roll ${input.roll}`).toBeGreaterThanOrEqual(6);
      input.seeds.forEach((seed, i) => {
        expect(rarityRoll(seed, 3), `the roll of seed ${seed}`).toBe(input.roll);
        const type = VEIN_TYPES[i % VEIN_TYPES.length]!;
        for (const place of VEIN_PLACES) for (const level of VEIN_LIFE) {
          const answer = answerOf(worldVeinsAt(
            { galaxy: place.gal, star: place.star },
            { planetSeed: seed, planetType: type, biosphereLevel: level, biomeKey: null, earth: false },
          ));
          hits.answer(type, answer);
          hits.hit('place', `${place.name}: ${answer.tier < answer.rawTier ? 'capped' : 'not capped'}`);
          hits.hit('rarity roll', String(input.roll));
          lines.push(`${place.name}|${level}|${veinLine(seed, type, answer)}`);
        }
      });
      if (digestOf(lines) !== output) differing.push(`roll ${input.roll}`);
    }
    expect(differing, 'the rarity rolls whose answers differ from the legacy game\'s').toEqual([]);
  });

  it('hit what the legacy game\'s answers hit, and no entry of any table is left out', () => {
    expect(hits.hits()).toEqual(recordedHits);
    const entries = (table: string): string[] => Object.keys(recordedHits[table]!);
    const fewest = (table: string): number => Math.min(...Object.values(recordedHits[table]!));
    // Each of the fifteen tiers, as the tier itself, as the tier before the cap and as the roll.
    for (const table of ['tier', 'tier before the ring cap', 'reserve at a tier', 'rarity roll']) {
      expect(entries(table).map(Number).sort((a, b) => a - b), table).toEqual(Array.from({ length: VEIN_TIERS }, (_, tier) => tier));
      expect(fewest(table), table).toBeGreaterThanOrEqual(100);
    }
    // Each of the nine rare veins, by its place in the list.
    expect(entries('rare vein').sort()).toEqual(RARE_VEIN.map((symbol, i) => `${i} ${symbol}`));
    expect(fewest('rare vein')).toBeGreaterThanOrEqual(500);
    // Each of the five cosmic veins, and each of them at each tier that can hold it (two at tier 8, five above).
    expect(entries('cosmic vein').sort()).toEqual(['Chr', 'Dkm', 'Pri', 'Pro', 'Voe', 'none']);
    expect(entries('cosmic vein at a tier')).toHaveLength(2 + 5 * 6);
    expect(fewest('cosmic vein at a tier')).toBeGreaterThanOrEqual(50);
    // Each entry of each planet type's own list.
    const own = VEIN_TYPES.flatMap((type) => (DEPOSIT_PROFILES[type as keyof typeof DEPOSIT_PROFILES] ?? DEPOSIT_PROFILES.rocky).map((symbol) => `${type}: ${symbol}`));
    expect(entries('deposit of a type').sort()).toEqual(own.sort());
    expect(fewest('deposit of a type')).toBeGreaterThanOrEqual(500);
    // Each of the eight places, and a tier the ring cut under each of the five caps below the summit.
    expect(entries('place').sort()).toEqual([
      ...VEIN_PLACES.map((place) => `${place.name}: not capped`),
      ...VEIN_PLACES.slice(0, 5).map((place) => `${place.name}: capped`),
    ].sort());
    expect(fewest('place')).toBeGreaterThanOrEqual(100);
    expect(entries('exceptional vein').sort()).toEqual(['held', 'none']);
  });
});
