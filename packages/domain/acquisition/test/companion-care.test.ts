/* D13 stage 1a: tastes (verbatim v1 parity), the meal outcome table, the taste projection, bond levels and Rest duration. */
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { floraStat } from '@cf/domain-strays';
import { loadRecorded } from '../../../../tests/support/v1-recorded.js';
import {
  COMPANION_BOND_LEVELS_V1, companionBondLevelV1, companionMealOutcomeV2, companionRestDurationMsV1, companionRestMissionIdV1,
  companionRestReadyAtV1, faunaTastesV1, projectCompanionBondV1, projectCompanionTastesV1, withCompanionBondMemoriesV1,
} from '../src/companion-care.js';
import { scoutStandsV1 } from '../src/companion-availability.js';
import type { CompanionBondV1 } from '../src/model.js';

/** v1's own `faunaTastes` answers, recorded from the v1 game file (fixtures/v1/recorded/acquisition-companion-care.json). */
type RecordedTastes = { seed: number; likes: string[]; dislikes: string[] };
const recordedTastes = (): RecordedTastes[] => loadRecorded('acquisition-companion-care').cases as RecordedTastes[];

const flora = (flavour: string, tierSeedStart = 1): Record<string, unknown> => {
  for (let s = tierSeedStart; s < 200_000; s++) { const g = makeGenome(s, 'flora', 0.5) as unknown as Record<string, unknown>; if (floraStat(g as never) === flavour) return g; }
  throw new Error('no flora for ' + flavour);
};

describe('companion tastes and care (D13 stage 1a)', () => {
  it('PARITY: faunaTastesV1 equals v1.8.9 faunaTastes for 5,000 seeds (control: altered answers disagree)', () => {
    const recorded = recordedTastes();
    expect(recorded).toHaveLength(5_000);
    recorded.forEach((row, s) => {
      expect(row.seed).toBe((s * 2654435761) >>> 0);
      expect(faunaTastesV1({ seed: row.seed })).toEqual({ likes: row.likes, dislikes: row.dislikes });
    });
    // Control: alter 150 of the first 200 recorded answers in memory; the port must then disagree on more than 100.
    const altered = recorded.slice(0, 200).map((row, s) => (s % 4 === 0 ? row : { ...row, likes: [...row.likes].reverse() }));
    let differs = 0;
    for (const row of altered) if (JSON.stringify(faunaTastesV1({ seed: row.seed })) !== JSON.stringify({ likes: row.likes, dislikes: row.dislikes })) differs++;
    expect(differs).toBeGreaterThan(100);
  });

  it('the meal table: loved +2 and mends 0.25; neutral +1 and 0.10; disliked 0 and harmless; firsts pay XP once', () => {
    const genome = makeGenome(424242, 'fauna', 0.5) as never, t = faunaTastesV1(genome as { seed: number });
    const neutral = (['vit', 'fer', 'res', 'agi', 'ins'] as const).find((k) => !t.likes.includes(k) && !t.dislikes.includes(k))!;
    const base = { genome, hurt: 0.5, bond: null as CompanionBondV1 | null };
    const loved = companionMealOutcomeV2(base, flora(t.likes[0]));
    expect(loved.taste.preference).toBe('loved'); expect([2, 3]).toContain(loved.fedGain); expect(loved.hurtAfter).toBe(0.25);
    expect(loved.xpGain).toBe(3); expect(loved.newMemories.map((m) => m.id)).toEqual(['meal:first', `taste:${t.likes[0]}`]);
    const plain = companionMealOutcomeV2(base, flora(neutral)); expect(plain.taste.preference).toBe('neutral'); expect(plain.fedGain).toBe(1); expect(plain.hurtAfter).toBe(0.4);
    const bad = companionMealOutcomeV2(base, flora(t.dislikes[0])); expect(bad.taste.preference).toBe('disliked'); expect(bad.fedGain).toBe(0); expect(bad.hurtAfter).toBe(0.5); // harmless: no worse
    // a second meal of a known flavour pays nothing more
    const bond = withCompanionBondMemoriesV1(null, loved.newMemories, 1_000)!;
    const again = companionMealOutcomeV2({ ...base, bond }, flora(t.likes[0])); expect(again.xpGain).toBe(0); expect(again.newMemories).toEqual([]);
  });

  it('tastes stay hidden until eaten; bond levels come from distinct memories and never decay', () => {
    const genome = makeGenome(99, 'fauna', 0.5) as never, t = faunaTastesV1(genome as { seed: number });
    const hidden = projectCompanionTastesV1({ genome, bond: null });
    expect(hidden.likes.every((s) => !s.known && s.flavour === null)).toBe(true); expect(hidden.tasted).toEqual([]);
    const bond = withCompanionBondMemoriesV1(null, [{ id: `taste:${t.likes[1]}`, kind: 'taste' }], 5)!;
    const one = projectCompanionTastesV1({ genome, bond }); expect(one.likes.filter((s) => s.known).map((s) => s.flavour)).toEqual([t.likes[1]]);
    expect(companionBondLevelV1(0)).toBe(0); expect(companionBondLevelV1(3)).toBe(1); expect(companionBondLevelV1(39)).toBe(4); expect(companionBondLevelV1(40)).toBe(5);
    expect(COMPANION_BOND_LEVELS_V1.every((r) => r.unlock === null || !/attack|defen|stat|damage|power/iu.test(r.unlock))).toBe(true); // sidegrades only
    const dup = withCompanionBondMemoriesV1(bond, [{ id: `taste:${t.likes[1]}`, kind: 'taste' }, { id: 'meal:first', kind: 'meal' }], 9)!;
    expect(dup.memories.map((m) => m.id)).toEqual([`taste:${t.likes[1]}`, 'meal:first']); expect(dup.memories[0]!.atActivePlayMs).toBe(5);
    expect(projectCompanionBondV1(null)).toMatchObject({ level: 0, name: 'Wary', memories: 0, next: { level: 1, remaining: 3 } });
    expect(withCompanionBondMemoriesV1(null, [], 1)).toBeNull(); // no memory, no bond object
  });

  it('Rest: 2 active minutes per 0.1 hurt, rounded up, at most 20; the mission id round-trips', () => {
    expect(companionRestDurationMsV1(0)).toBe(0); expect(companionRestDurationMsV1(null)).toBe(0);
    expect(companionRestDurationMsV1(0.35)).toBe(8 * 60_000); expect(companionRestDurationMsV1(0.95)).toBe(20 * 60_000); expect(companionRestDurationMsV1(0.1)).toBe(2 * 60_000);
    expect(companionRestReadyAtV1(companionRestMissionIdV1(123_456))).toBe(123_456); expect(companionRestReadyAtV1('mission:abc')).toBeNull(); expect(companionRestReadyAtV1('rest:1e3')).toBeNull();
  });

  // Dakk, 2026-11-27: "a resting companion steps down from the scout's post until it is ready".
  it('a named scout stands at its post unless it rests: from the boundary of its Rest it stands again', () => {
    const resting = { assignment: { kind: 'mission', missionId: companionRestMissionIdV1(600_000) } } as const;
    expect(scoutStandsV1(resting, 0)).toBe(false);
    expect(scoutStandsV1(resting, 599_999)).toBe(false);
    expect(scoutStandsV1(resting, 600_000)).toBe(true);
    expect(scoutStandsV1(resting, 600_001)).toBe(true);
    // Only a Rest takes it from the post: a field mission and a recovery after a union do not.
    expect(scoutStandsV1({ assignment: { kind: 'mission', missionId: 'mission:4' } }, 0)).toBe(true);
    expect(scoutStandsV1({ assignment: { kind: 'recovery', readyAtActivePlayMs: 600_000 } }, 0)).toBe(true);
    expect(scoutStandsV1({ assignment: null }, 0)).toBe(true);
  });
});
