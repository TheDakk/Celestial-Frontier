import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  CREATURE_XP_MAX_V1,
  battleStats,
  levelOf,
  projectCreatureClassProgressionV1,
  projectCreatureInnateArts,
  projectCreatureLevelProgressV1,
} from '../src/index.js';

describe('@cf/domain-combatcore — creature level progress', () => {
  it('derives every displayed span from the lifted level owner', () => {
    for (let xp = 0; xp <= CREATURE_XP_MAX_V1; xp++) {
      const progress = projectCreatureLevelProgressV1(xp);
      expect(progress.level).toBe(levelOf({ xp }));
      expect(levelOf({ xp: progress.levelFloorXp })).toBe(progress.level);
      if (progress.levelFloorXp > 0) {
        expect(levelOf({ xp: progress.levelFloorXp - 1 })).toBeLessThan(progress.level);
      }
      if (progress.nextLevelXp === null) {
        expect(progress.level).toBe(progress.maximumLevel);
        expect(progress.levelProgressPercent).toBe(100);
      } else {
        expect(levelOf({ xp: progress.nextLevelXp })).toBeGreaterThan(progress.level);
        expect(progress.levelProgressXp).toBe(xp - progress.levelFloorXp);
        expect(progress.levelProgressSpanXp)
          .toBe(progress.nextLevelXp - progress.levelFloorXp);
      }
    }
  });

  it('keeps the established innate awakenings at levels 3 and 6', () => {
    expect(projectCreatureLevelProgressV1(24)).toMatchObject({
      level: 2, awakenedInnateSlots: 1, nextInnateLevel: 3,
    });
    expect(projectCreatureLevelProgressV1(54)).toMatchObject({
      level: 3, awakenedInnateSlots: 2, nextInnateLevel: 6,
    });
    expect(projectCreatureLevelProgressV1(216)).toMatchObject({
      level: 6, awakenedInnateSlots: 3, nextInnateLevel: null,
    });
  });

  it('projects each awakened art from CombatCore canonical class and archetype owners', () => {
    const genome = makeGenome(81_811, 'fauna', 0.44);
    const expectedByXp = [
      [0, [{
        id: 'roulette', label: 'Roulette',
        description: 'swings wild — a gambler’s ceiling',
        slot: 1, effects: { gambit: 0.34 },
      }]],
      [54, [
        {
          id: 'roulette', label: 'Roulette',
          description: 'swings wild — a gambler’s ceiling',
          slot: 1, effects: { gambit: 0.34 },
        },
        {
          id: 'dot', label: 'Affliction',
          description: 'sears the foe for a share of vitality each round',
          slot: 2, effects: { burn: 0.027 },
        },
      ]],
      [216, [
        {
          id: 'roulette', label: 'Roulette',
          description: 'swings wild — a gambler’s ceiling',
          slot: 1, effects: { gambit: 0.34 },
        },
        {
          id: 'dot', label: 'Affliction',
          description: 'sears the foe for a share of vitality each round',
          slot: 2, effects: { burn: 0.027 },
        },
        {
          id: 'fury', label: 'Fury',
          description: 'builds ferocity every round',
          slot: 3, effects: { ramp: 0.0434 },
        },
      ]],
    ] as const;

    for (const [xp, expectedArts] of expectedByXp) {
      const projected = projectCreatureClassProgressionV1(genome, xp);
      expect(projected.className).toBe('Sorcerer');
      expect(projected.classGroup).toBe('Caster');
      expect(projected.className).toBe(battleStats({ ...genome, xp }).cls);
      expect(projected.innateArts).toEqual(expectedArts);
      expect(projected.innateArts).toHaveLength(projected.awakenedInnateSlots);
    }
  });

  it('returns a deeply frozen read projection without exposing the private tables', () => {
    const genome = makeGenome(81_811, 'fauna', 0.44);
    const projected = projectCreatureClassProgressionV1(genome, 216);
    const generated = projectCreatureInnateArts({ ...genome, xp: 216 });
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.innateArts)).toBe(true);
    expect(projected.innateArts.every((art) => (
      Object.isFrozen(art) && Object.isFrozen(art.effects)
    ))).toBe(true);
    expect(Object.isFrozen(generated)).toBe(true);
    expect(Object.isFrozen(generated.arts)).toBe(true);
    expect(generated.arts.every((art) => (
      Object.isFrozen(art) && Object.isFrozen(art.effects)
    ))).toBe(true);

    expect(() => {
      (projected.innateArts[0]!.effects as Record<string, number>).gambit = 99;
    }).toThrow(TypeError);
    expect(projectCreatureClassProgressionV1(genome, 216).innateArts[0]!.effects)
      .toEqual({ gambit: 0.34 });
  });

  it('rejects non-plain, accessor and symbol-bearing genome projections', () => {
    const genome = makeGenome(81_811, 'fauna', 0.44);
    const inherited = Object.create(genome) as Record<string, unknown>;
    expect(() => projectCreatureClassProgressionV1(inherited, 54)).toThrow(/plain prototype/);

    const accessor = { ...genome } as Record<string, unknown>;
    Object.defineProperty(accessor, 'seed', { enumerable: true, get: () => genome.seed });
    expect(() => projectCreatureClassProgressionV1(accessor, 54)).toThrow(/accessors/);

    const symbolBearing = { ...genome, [Symbol('forged')]: 1 } as Record<string, unknown>;
    expect(() => projectCreatureClassProgressionV1(symbolBearing, 54)).toThrow(/symbols/);
  });

  it('rejects XP outside the canonical exact-instance carrier', () => {
    for (const value of [-1, 1.5, CREATURE_XP_MAX_V1 + 1, Number.NaN, '54']) {
      expect(() => projectCreatureLevelProgressV1(value)).toThrow(/creature XP/);
    }
  });
});
