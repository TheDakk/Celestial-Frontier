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

  it('preserves fractional XP while using integer level thresholds and exact remaining XP', () => {
    const cases = [
      { xp: 0.5, level: 0, floor: 0, next: 6, elapsed: 0.5, span: 6, remaining: 5.5, percent: 8, slots: 1 },
      { xp: 24.5, level: 2, floor: 24, next: 54, elapsed: 0.5, span: 30, remaining: 29.5, percent: 1, slots: 1 },
      { xp: 53.75, level: 2, floor: 24, next: 54, elapsed: 29.75, span: 30, remaining: 0.25, percent: 99, slots: 1 },
      { xp: 54.25, level: 3, floor: 54, next: 96, elapsed: 0.25, span: 42, remaining: 41.75, percent: 0, slots: 2 },
      { xp: 149.99999999999997, level: 5, floor: 150, next: 216, elapsed: 0, span: 66, remaining: 66.00000000000003, percent: 0, slots: 2 },
      { xp: 215.75, level: 5, floor: 150, next: 216, elapsed: 65.75, span: 66, remaining: 0.25, percent: 99, slots: 2 },
      { xp: 216.125, level: 6, floor: 216, next: 294, elapsed: 0.125, span: 78, remaining: 77.875, percent: 0, slots: 3 },
      { xp: 485.5, level: 8, floor: 384, next: 486, elapsed: 101.5, span: 102, remaining: 0.5, percent: 99, slots: 3 },
      { xp: 486, level: 9, floor: 486, next: null, elapsed: 0, span: 0, remaining: null, percent: 100, slots: 3 },
    ] as const;
    for (const value of cases) {
      const progress = projectCreatureLevelProgressV1(value.xp);
      expect(progress, `XP ${value.xp}`).toMatchObject({
        xp: value.xp,
        level: value.level,
        maximumLevel: 9,
        levelFloorXp: value.floor,
        nextLevelXp: value.next,
        levelProgressXp: value.elapsed,
        levelProgressSpanXp: value.span,
        levelProgressPercent: value.percent,
        awakenedInnateSlots: value.slots,
      });
      expect(progress.nextLevelXp === null ? null : progress.nextLevelXp - progress.xp)
        .toBe(value.remaining);
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
    for (const value of [-1, -0.25, CREATURE_XP_MAX_V1 + 0.25, Number.NaN,
      Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '54', null, undefined, true]) {
      expect(() => projectCreatureLevelProgressV1(value)).toThrow(/creature XP/);
    }
  });
});
