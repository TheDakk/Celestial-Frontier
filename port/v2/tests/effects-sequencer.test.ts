import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEffectSequenceAnchors, placeEffectSequence, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import {
  MOTION_KIT_TIMING, buildEffectSchedule, hitstopFor, sampleSchedule, type EffectDelivery, type EffectSchedule,
} from '../apps/game/src/effects/sequencer.js';

const WILD_PATH = fileURLToPath(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url));
const wildAnchors = (): EffectSequenceAnchors => {
  const parsed = parseEffectSequenceAnchors(JSON.parse(readFileSync(WILD_PATH, 'utf8')));
  if (!parsed.ok) throw new Error(parsed.reason);
  return parsed.anchors;
};
const STANDS = { attacker: { x: 0.3, y: 0.78 }, target: { x: 0.7, y: 0.78 } };
const build = (delivery: EffectDelivery, mass: number): EffectSchedule => {
  const anchors = wildAnchors();
  return buildEffectSchedule(anchors, { delivery, attackerMassClass: mass }, placeEffectSequence(anchors, STANDS));
};

describe('effects sequencer: Motion Kit section 5 schedule', () => {
  afterEach(() => vi.restoreAllMocks());

  it('orders melee as launch through anticipation 140 -> strike 90 as travel -> impact on the hitstop frame', () => {
    const s = build('melee', 1);
    expect(s.launchAt).toBe(0);
    expect(s.travelStart).toBe(140);
    expect(s.travelEnd).toBe(230);
    expect(s.tracks[0]!.endMs).toBe(185);
    expect(s.impactAt).toBe(230);
    expect(s.hitstopAt).toBe(s.impactAt);
    expect(s.hitstopMs).toBe(70);
    expect(s.impactEnd).toBe(230 + 70 + MOTION_KIT_TIMING.flashFade);
    expect(s.durationMs).toBe(s.impactEnd);
    expect(s.launchAt <= s.travelStart && s.travelStart < s.travelEnd && s.travelEnd <= s.impactAt && s.impactAt < s.impactEnd).toBe(true);
    expect(s.tracks.map((t) => t.phase)).toEqual(['launch', 'travel', 'impact']);
  });

  it('orders cast as rise 180 + hold 120 -> release 90 -> impact', () => {
    const s = build('cast', 1);
    expect(s.launchAt).toBe(0);
    expect(s.travelStart).toBe(300);
    expect(s.travelEnd).toBe(390);
    expect(s.impactAt).toBe(390);
    expect(s.tracks[0]!.endMs).toBe(345);
  });

  it('scales by the attacker mass class, clamps the class, and caps hitstop at 140', () => {
    expect(hitstopFor(1)).toBe(70);
    expect(hitstopFor(1.6)).toBe(112);
    expect(hitstopFor(2)).toBe(140);
    expect(hitstopFor(9)).toBe(140);
    expect(hitstopFor(0.1)).toBeCloseTo(42, 12);
    const big = build('melee', 1.6);
    expect(big.travelStart).toBeCloseTo(224, 12);
    expect(big.travelEnd).toBeCloseTo(224 + 144, 12);
    expect(big.hitstopMs).toBe(112);
    expect(build('melee', 3).massClass).toBe(2);
    expect(() => build('melee', 0)).toThrow(/attackerMassClass/);
    expect(() => build('slash' as never, 1)).toThrow(/delivery/);
  });

  it('refuses a placement from another sequence', () => {
    const anchors = wildAnchors();
    const foreign = { ...placeEffectSequence(anchors, STANDS), sequenceId: 'other' };
    expect(() => buildEffectSchedule(anchors, { delivery: 'melee', attackerMassClass: 1 }, foreign)).toThrow(/does not belong/);
  });

  it('samples continuously: launch at the attacker, travel to the target, impact at the target contact', () => {
    const s = build('melee', 1);
    expect(sampleSchedule(s, -5).phase).toBe('before');
    expect(sampleSchedule(s, -5).transform.alpha).toBe(0);
    const launch = sampleSchedule(s, 100);
    expect(launch.phase).toBe('launch');
    expect(launch.emitterPhase).toBe('launch');
    expect(launch.transform.x).toBe(0.3);
    expect(launch.transform.alpha).toBe(1);
    const mid = sampleSchedule(s, 185);
    expect(mid.phase).toBe('travel');
    expect(mid.transform.x).toBeCloseTo(0.5, 12);
    expect(mid.transform.y).toBe(0.78);
    const beforeImpact = sampleSchedule(s, 230 - 1e-6), impact = sampleSchedule(s, 230);
    expect(beforeImpact.phase).toBe('travel');
    expect(impact.phase).toBe('impact');
    expect(Math.abs(beforeImpact.transform.x - impact.transform.x)).toBeLessThan(1e-5);
    expect(impact.transform.x).toBe(0.7);
    expect(impact.transform.y).toBe(0.78);
    expect(impact.transform.alpha).toBe(1);
    expect(sampleSchedule(s, 230 + 70).transform.alpha).toBe(1);
    expect(sampleSchedule(s, 230 + 70 + 60).transform.alpha).toBeCloseTo(0.5, 12);
    const after = sampleSchedule(s, s.durationMs);
    expect(after.phase).toBe('after');
    expect(after.emitterPhase).toBe('none');
    expect(after.tracks.every((t) => !t.visible)).toBe(true);
    let prev = sampleSchedule(s, 0);
    for (let ms = 1; ms <= s.durationMs; ms += 1) {
      const cur = sampleSchedule(s, ms);
      expect(Math.abs(cur.transform.x - prev.transform.x)).toBeLessThan(0.01);
      expect(cur.transform.scale).toBeGreaterThan(0);
      prev = cur;
    }
    expect(prev.transform.scale).toBeCloseTo(s.scale, 12);
    expect(() => sampleSchedule(s, Number.NaN)).toThrow(/finite/);
  });

  it('never reads a clock while building or sampling (negative control)', () => {
    const date = vi.spyOn(Date, 'now'), perf = vi.spyOn(performance, 'now');
    const s = build('cast', 1.2);
    for (let ms = 0; ms < s.durationMs; ms += 7) sampleSchedule(s, ms);
    expect(date).not.toHaveBeenCalled();
    expect(perf).not.toHaveBeenCalled();
    expect(JSON.stringify(build('cast', 1.2))).toBe(JSON.stringify(s));
  });
});
