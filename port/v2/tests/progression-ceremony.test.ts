import { describe, expect, it } from 'vitest';
import {
  PROGRESSION_CEREMONY_GOLD_COLORS_V1,
  planProgressionCeremonyV1,
  type ProgressionCeremonyInputV1,
} from '../apps/game/src/progression-ceremony.js';

function input(
  overrides: Partial<ProgressionCeremonyInputV1> = {},
): ProgressionCeremonyInputV1 {
  return {
    disposition: 'committed-publication',
    priorUnlockedIds: ['compat:retained'],
    nextUnlockedIds: ['compat:retained', 'home'],
    addedAchievementIds: ['home'],
    priorBestRankIndex: 0,
    nextBestRankIndex: 1,
    ...overrides,
  };
}

describe('Arc 9 postcommit progression ceremony planner', () => {
  it('maps only an exact durable append and promotion to legacy copy/audio/FX semantics', () => {
    expect(planProgressionCeremonyV1(input())).toEqual({
      kind: 'present',
      schema: 'cf-v2-progression-ceremony/v1',
      achievements: [{
        kind: 'achievement',
        achievementId: 'home',
        title: 'Achievement · Homecoming',
        detail: 'Stand on Earth',
        stingTier: 3,
      }],
      rankPromotion: {
        kind: 'rank-promotion',
        rankIndex: 1,
        rankName: 'Scout',
        title: 'Rank Up — Scout',
        detail: 'Your expedition record speaks for itself, explorer.',
        stingTier: 5,
        goldBurst: {
          colors: PROGRESSION_CEREMONY_GOLD_COLORS_V1,
          maximumParticleCount: 40,
        },
      },
    });
  });

  it('retains exact manifest order for a multi-achievement transaction and decodes text copy only', () => {
    const outcome = planProgressionCeremonyV1(input({
      priorUnlockedIds: [],
      nextUnlockedIds: ['richstrike', 'skimmer'],
      addedAchievementIds: ['richstrike', 'skimmer'],
      priorBestRankIndex: 4,
      nextBestRankIndex: 4,
    }));
    expect(outcome).toMatchObject({
      kind: 'present',
      achievements: [
        { achievementId: 'richstrike', detail: 'Mine 250 loads of ore' },
        { achievementId: 'skimmer', detail: 'Skim a star’s corona for its stellar cosmic' },
      ],
      rankPromotion: null,
    });
  });

  it.each([
    'boot-catch-up',
    'replay',
    'already-durable',
    'committed-convergence',
    'training-sandbox',
    'refused',
  ] as const)('is silent for %s even when supplied celebratory-looking deltas', (disposition) => {
    expect(planProgressionCeremonyV1(input({ disposition }))).toEqual({
      kind: 'silent', reason: disposition,
    });
  });

  it('is silent for a genuine committed publication with no new durable fact', () => {
    expect(planProgressionCeremonyV1(input({
      priorUnlockedIds: ['home'],
      nextUnlockedIds: ['home'],
      addedAchievementIds: [],
      priorBestRankIndex: 2,
      nextBestRankIndex: 2,
    }))).toEqual({ kind: 'silent', reason: 'no-new-ceremony' });
  });

  it('rejects forged/reordered/unknown achievement rewards all-or-nothing', () => {
    expect(planProgressionCeremonyV1(input({
      nextUnlockedIds: ['home', 'compat:retained'],
    }))).toEqual({ kind: 'protected', reason: 'achievement-delta-mismatch' });
    expect(planProgressionCeremonyV1(input({
      nextUnlockedIds: ['compat:retained', 'home'],
      addedAchievementIds: [],
    }))).toEqual({ kind: 'protected', reason: 'achievement-delta-mismatch' });
    expect(planProgressionCeremonyV1(input({
      nextUnlockedIds: ['compat:retained', 'compat:invented'],
      addedAchievementIds: ['compat:invented'],
    }))).toEqual({ kind: 'protected', reason: 'achievement-unsupported' });
  });

  it('rejects duplicate/sparse IDs and malformed or demoting rank transitions', () => {
    expect(planProgressionCeremonyV1(input({
      nextUnlockedIds: ['compat:retained', 'home', 'home'],
      addedAchievementIds: ['home', 'home'],
    }))).toEqual({ kind: 'protected', reason: 'achievement-id-shape' });
    expect(planProgressionCeremonyV1(input({
      priorUnlockedIds: Array(1) as string[],
    }))).toEqual({ kind: 'protected', reason: 'achievement-id-shape' });
    expect(planProgressionCeremonyV1(input({
      priorBestRankIndex: 2,
      nextBestRankIndex: 1,
    }))).toEqual({ kind: 'protected', reason: 'rank-demotion' });
    expect(planProgressionCeremonyV1(input({
      nextBestRankIndex: 10,
    }))).toEqual({ kind: 'protected', reason: 'rank-index-shape' });
  });
});
