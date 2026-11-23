/* The reach answers recorded from the current game's travel gate (tools/record-fixtures.mjs, `reach`),
   checked against the scene package's own rules. */
import { describe, it, expect } from 'vitest';
import {
  ascAllowsCanonicalStar,
  navFromCanonicalCF1Address,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  shipVisualStateOf,
  withinReachOf,
} from '@cf/scene';
import reach from '../../fixtures/current/reach.json' with { type: 'json' };

type Answer = null | 'prime-reach' | 'charter-reach';
interface Place { seed: number; x: number; y: number }
interface ReachCase {
  label: string;
  save: { primeFill: Record<string, unknown>; items: [string, number][]; ascCh: number };
  target: { mode: string; galaxy: Place; star: Place | null };
  expected: string | null;
}
const cases = reach.cases as ReachCase[];

function answerOf(c: ReachCase): Answer {
  const stage = shipVisualStateOf({ items: c.save.items, ascCh: c.save.ascCh, liverySeed: reach.liverySeed }).chassisStage;
  if (!withinReachOf(Object.keys(c.save.primeFill).length, c.target.galaxy.x, c.target.galaxy.y)) return 'prime-reach';
  if (c.target.star !== null && !ascAllowsCanonicalStar(stage, c.target.galaxy, c.target.star)) return 'charter-reach';
  return null;
}
const mismatches = (rows: readonly ReachCase[]): string[] => rows.filter((c) => answerOf(c) !== c.expected).map((c) => c.label);
const saveOf = (c: ReachCase): string => c.label.slice(0, c.label.indexOf(': '));

describe('the recorded reach answers', () => {
  it('the fixture holds at least one case of each answer a save can get, for each save', () => {
    const answers = new Map<string, Set<string | null>>();
    for (const c of cases) answers.set(saveOf(c), (answers.get(saveOf(c)) ?? new Set()).add(c.expected));
    expect(answers.size).toBe(24);
    for (const [save, seen] of answers) {
      // The Intergalactic Drive dives to every star, so its saves can never be refused by the charter.
      const possible = save.startsWith('igdrive') ? [null, 'prime-reach'] : [null, 'prime-reach', 'charter-reach'];
      expect([...seen].sort(), save).toEqual([...possible].sort());
    }
  });

  it('every label is used once', () => {
    expect(new Set(cases.map((c) => c.label)).size).toBe(cases.length);
  });

  it("the scene package's own rules agree with every recorded row", () => {
    expect(mismatches(cases)).toEqual([]);
  });

  it('a copy of one row with its answer changed is reported as a mismatch', () => {
    const row = cases.find((c) => c.expected === 'charter-reach')!;
    expect(mismatches([row])).toEqual([]);
    expect(mismatches([{ ...row, expected: null }])).toEqual([row.label]);
    expect(mismatches([{ ...row, expected: 'prime-reach' }])).toEqual([row.label]);
  });

  it('every recorded target is a real place the scene package can prove', () => {
    const seen = new Set<string>();
    for (const { target, label } of cases) {
      const key = JSON.stringify(target);
      if (seen.has(key)) continue;
      seen.add(key);
      const address = target.star === null
        ? resolveCF1GalaxyAddress({ galaxy: target.galaxy })
        : resolveCF1StarAddress({ galaxy: target.galaxy, star: target.star });
      expect(address.ok, label).toBe(true);
      const nav = address.ok ? navFromCanonicalCF1Address(address.address) : null;
      expect(nav?.ok && nav.state.mode, label).toBe(target.mode);
    }
    expect(seen.size).toBe(19);
  });
});
