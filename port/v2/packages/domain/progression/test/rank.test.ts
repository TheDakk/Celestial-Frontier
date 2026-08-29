import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_SCORE_CREDIT,
  EXPLORER_PRESTIGE_STEP,
  EXPLORER_RANKS,
  EXPLORER_RANK_SCORE_WEIGHTS,
  expeditionScore,
  projectExplorerNameplate,
  prepareExplorerNameplateChoice,
  projectExplorerRank,
  projectExplorerRankRewards,
  type ExplorerRankRecordProjection,
} from '@cf/domain-progression';

const recordForScore = (score: number): ExplorerRankRecordProjection => ({
  surveyedLivingWorldCount: 0,
  cataloguedSpeciesCount: 0,
  bestRawRarityTier: 0,
  unlockedAchievementCount: 0,
  hybridCount: score,
  galaxyCount: 0,
});

describe('@cf/domain-progression — Arc 9A explorer ranks', () => {
  it('preserves the exact ten thresholds, titles, permanent nameplate hues, and summit foil', () => {
    expect(EXPLORER_RANKS).toEqual([
      { index: 0, threshold: 0, name: 'Cadet', nameplateHue: '#9fb6d6', iridescent: false },
      { index: 1, threshold: 30, name: 'Scout', nameplateHue: '#7fe6a0', iridescent: false },
      { index: 2, threshold: 90, name: 'Pathfinder', nameplateHue: '#7fd0ff', iridescent: false },
      { index: 3, threshold: 220, name: 'Voyager', nameplateHue: '#5b8cf0', iridescent: false },
      { index: 4, threshold: 460, name: 'Pioneer', nameplateHue: '#46c2b2', iridescent: false },
      { index: 5, threshold: 900, name: 'Star Cartographer', nameplateHue: '#ffd96a', iridescent: false },
      { index: 6, threshold: 1_700, name: 'Mythic Wayfarer', nameplateHue: '#b06cff', iridescent: false },
      { index: 7, threshold: 3_000, name: 'Void Sovereign', nameplateHue: '#7a6af0', iridescent: false },
      { index: 8, threshold: 5_200, name: 'Cosmic Luminary', nameplateHue: '#ffe9b8', iridescent: false },
      { index: 9, threshold: 8_200, name: 'Eternal Frontier', nameplateHue: 'irid', iridescent: true },
    ]);
    expect(Object.isFrozen(EXPLORER_RANKS)).toBe(true);
    expect(EXPLORER_RANKS.every(Object.isFrozen)).toBe(true);
  });

  it('uses the exact lifetime-score weights', () => {
    const record: ExplorerRankRecordProjection = {
      surveyedLivingWorldCount: 7,
      cataloguedSpeciesCount: 11,
      bestRawRarityTier: 5,
      unlockedAchievementCount: 3,
      hybridCount: 13,
      galaxyCount: 17,
    };
    expect(EXPLORER_RANK_SCORE_WEIGHTS).toEqual({
      surveyedLivingWorld: 4,
      cataloguedSpecies: 2,
      bestRawRarityTier: 12,
      unlockedAchievement: 6,
      hybrid: 1,
      galaxyVisited: 3,
    });
    expect(ACHIEVEMENT_SCORE_CREDIT).toBe(6);
    expect(expeditionScore(record)).toBe(7 * 4 + 11 * 2 + 5 * 12 + 3 * 6 + 13 + 17 * 3);
  });

  it('changes rank at every exact authored boundary and exposes the correct next rung', () => {
    for (let index = 0; index < EXPLORER_RANKS.length; index++) {
      const definition = EXPLORER_RANKS[index]!;
      const at = projectExplorerRank(recordForScore(definition.threshold));
      expect(at.index, definition.name).toBe(index);
      expect(at.name, definition.name).toBe(definition.name);
      expect(at.floor, definition.name).toBe(definition.threshold);
      if (index > 0) {
        const before = projectExplorerRank(recordForScore(definition.threshold - 1));
        expect(before.index, definition.name).toBe(index - 1);
        expect(before.next).toEqual({ threshold: definition.threshold, name: definition.name });
      }
    }
  });

  it('continues forever in exact 3,000-point Eternal Frontier prestige steps', () => {
    expect(EXPLORER_PRESTIGE_STEP).toBe(3_000);
    expect(projectExplorerRank(recordForScore(8_200))).toMatchObject({
      name: 'Eternal Frontier', prestigeLevel: 0, floor: 8_200,
      next: { threshold: 11_200, name: 'Eternal Frontier ✦1' },
    });
    expect(projectExplorerRank(recordForScore(11_199))).toMatchObject({
      name: 'Eternal Frontier', prestigeLevel: 0, floor: 8_200,
    });
    expect(projectExplorerRank(recordForScore(11_200))).toMatchObject({
      name: 'Eternal Frontier ✦1', prestigeLevel: 1, floor: 11_200,
      next: { threshold: 14_200, name: 'Eternal Frontier ✦2' },
    });
    expect(projectExplorerRank(recordForScore(17_200))).toMatchObject({
      name: 'Eternal Frontier ✦3', prestigeLevel: 3, floor: 17_200,
    });
  });

  it('projects permanent nameplate rewards without demotion and grants foil only at the summit', () => {
    const scout = projectExplorerRank(recordForScore(30));
    const priorPioneer = projectExplorerRankRewards(scout, 4);
    expect(priorPioneer.bestRankIndex).toBe(4);
    expect(priorPioneer.unlockedNameplates).toHaveLength(5);
    expect(priorPioneer.unlockedNameplates.at(-1)).toMatchObject({ rankName: 'Pioneer', iridescent: false });

    const summit = projectExplorerRankRewards(projectExplorerRank(recordForScore(8_200)), 4);
    expect(summit.bestRankIndex).toBe(9);
    expect(summit.unlockedNameplates).toHaveLength(10);
    expect(summit.unlockedNameplates.at(-1)).toEqual({
      rankIndex: 9, rankName: 'Eternal Frontier', hue: 'irid', iridescent: true,
    });
  });

  it('honors an unlocked saved plate and falls back to the current rank for auto/locked choices', () => {
    const voyager = projectExplorerRank(recordForScore(220));
    expect(projectExplorerNameplate(voyager, 5, 1)).toEqual({
      rankIndex: 1, hue: '#7fe6a0', iridescent: false, usedSavedChoice: true,
    });
    expect(projectExplorerNameplate(voyager, 2, 5)).toEqual({
      rankIndex: 3, hue: '#5b8cf0', iridescent: false, usedSavedChoice: false,
    });
    expect(projectExplorerNameplate(voyager, 5, -1)).toEqual({
      rankIndex: 3, hue: '#5b8cf0', iridescent: false, usedSavedChoice: false,
    });
  });

  it('admits only Auto or a permanently earned nameplate choice on the write boundary', () => {
    const voyager = projectExplorerRank(recordForScore(220));
    expect(prepareExplorerNameplateChoice(voyager, 5, -1)).toMatchObject({
      kind: 'allowed', choiceIndex: -1,
      nameplate: { rankIndex: 3, usedSavedChoice: false },
    });
    expect(prepareExplorerNameplateChoice(voyager, 5, 2)).toMatchObject({
      kind: 'allowed', choiceIndex: 2,
      nameplate: { rankIndex: 2, usedSavedChoice: true },
    });
    expect(prepareExplorerNameplateChoice(voyager, 2, 3)).toEqual({
      kind: 'rejected', reason: 'choice-locked',
    });
    for (const malformed of [-2, 10, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2', null]) {
      expect(prepareExplorerNameplateChoice(voyager, 5, malformed)).toEqual({
        kind: 'rejected', reason: 'choice-malformed',
      });
    }
  });

  it('fails closed on fractional, negative, or save-bound-exceeding inputs', () => {
    expect(() => expeditionScore({ ...recordForScore(0), hybridCount: -1 })).toThrow(/hybridCount/);
    expect(() => expeditionScore({ ...recordForScore(0), cataloguedSpeciesCount: 1_501 })).toThrow(/cataloguedSpeciesCount/);
    expect(() => expeditionScore({ ...recordForScore(0), unlockedAchievementCount: 147 })).toThrow(/unlockedAchievementCount/);
    expect(() => expeditionScore({ ...recordForScore(0), galaxyCount: 0.5 })).toThrow(/galaxyCount/);
    expect(() => projectExplorerRankRewards(projectExplorerRank(recordForScore(0)), 10)).toThrow(/best rank/);
    expect(() => projectExplorerNameplate(projectExplorerRank(recordForScore(0)), 0, -2)).toThrow(/choice/);
  });

  it('contains no hidden entropy or clock input', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/rank.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/Math\.random\s*\(/u);
    expect(source).not.toMatch(/Date\.now\s*\(/u);
    expect(source).not.toMatch(/performance\.now\s*\(/u);
  });
});
