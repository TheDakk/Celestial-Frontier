/* D13 stage 1a: tastes (verbatim v1 parity), the meal outcome table, the taste projection, bond levels and Rest duration. */
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { floraStat } from '@cf/domain-strays';
import { readTrackedV1Source } from '../../../../test-support/tracked-v1-source.js';
import {
  COMPANION_BOND_LEVELS_V1, companionBondLevelV1, companionMealOutcomeV2, companionRestDurationMsV1, companionRestMissionIdV1,
  companionRestReadyAtV1, faunaTastesV1, projectCompanionBondV1, projectCompanionTastesV1, withCompanionBondMemoriesV1,
} from '../src/companion-care.js';
import type { CompanionBondV1 } from '../src/model.js';

/** v1's own `faunaTastes` (with its `mulberry32` and `STAT_KEYS`), cut exactly from the tracked legacy script. */
function legacyFaunaTastes(mutate: (src: string) => string = (x) => x): (g: { seed: number }) => { likes: string[]; dislikes: string[] } {
  const { script } = readTrackedV1Source();
  const cut = (start: string, end: string): string => { const i = script.indexOf(start); expect(i, start).toBeGreaterThanOrEqual(0); expect(script.indexOf(start, i + 1), `${start} is unique`).toBe(-1); return script.slice(i, script.indexOf(end, i) + end.length); };
  const mulberry = cut('function mulberry32(a){', '/4294967296}}');
  const keys = cut("const STAT_KEYS=['vit'", '];');
  const tastes = cut('function faunaTastes(g){', 'dislikes:[ks[4]]};\n}');
  return new Function(`${mulberry}\n${keys}\n${mutate(tastes)}\nreturn faunaTastes;`)() as never;
}

const flora = (flavour: string, tierSeedStart = 1): Record<string, unknown> => {
  for (let s = tierSeedStart; s < 200_000; s++) { const g = makeGenome(s, 'flora', 0.5) as unknown as Record<string, unknown>; if (floraStat(g as never) === flavour) return g; }
  throw new Error('no flora for ' + flavour);
};

describe('companion tastes and care (D13 stage 1a)', () => {
  it('PARITY: faunaTastesV1 equals v1.8.9 faunaTastes for 5,000 seeds (control: a wrong salt disagrees)', () => {
    const legacy = legacyFaunaTastes();
    for (let s = 0; s < 5_000; s++) { const seed = (s * 2654435761) >>> 0; expect(faunaTastesV1({ seed })).toEqual(legacy({ seed })); }
    const mutant = legacyFaunaTastes((src) => src.replace('0xFEED', '0xFEEE'));
    let differs = 0; for (let s = 0; s < 200; s++) if (JSON.stringify(mutant({ seed: s })) !== JSON.stringify(faunaTastesV1({ seed: s }))) differs++;
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
});
