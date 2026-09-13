import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTimeline, compileBodyCard, createGsapPlayer, EASE_FN, EASES, hitstopMs, idlePeriodMs, QUADRUPED_ACTION_IDS, QUADRUPED_ACTIONS,
  sampleTimeline, scaleMs, type BodyCard, type Keyframe, type PoseTarget } from '../apps/game/src/motion/index.js';
import { civetRecord, foxRecord, proceduralGenome, proceduralRecord } from '../tools/motion-proof/fixtures.js';

const civet = (): BodyCard => compileBodyCard(civetRecord());
const SEED = 3212817920;

describe('timing (kit §5)', () => {
  it('scales by mass inside 0.6x..2.0x and caps hitstop at 140', () => {
    expect(scaleMs(100, 1.2)).toBe(120); expect(scaleMs(100, 0.5)).toBe(60); expect(scaleMs(100, 3)).toBe(200);
    expect(hitstopMs(0.85)).toBeCloseTo(59.5); expect(hitstopMs(1.6)).toBe(112); expect(hitstopMs(2.5)).toBe(140);
  });
  it('seeds a non-integer idle period per creature; two seeds never share an integer ratio', () => {
    const a = idlePeriodMs(SEED, 1), b = idlePeriodMs(1597751321, 1), c = idlePeriodMs(SEED, 1);
    expect(a).toBe(c); expect(a).not.toBe(b);
    for (const p of [a, b]) { expect(p).toBeGreaterThanOrEqual(2600); expect(p).toBeLessThanOrEqual(3400); expect(Number.isInteger(p)).toBe(false); }
    const ratio = a / b; expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(1e-6);
    expect(idlePeriodMs(SEED, 0.7)).toBeCloseTo(a * 0.7, 9);
  });
});

describe('buildTimeline', () => {
  afterEach(() => vi.restoreAllMocks());
  it('is deterministic and hashes every recipe', () => {
    const a = buildTimeline(civet(), 'melee', SEED), b = buildTimeline(civet(), 'melee:bite', SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)); expect(a.hash).toBe(b.hash);
    expect(JSON.stringify(buildTimeline(civet(), 'melee', SEED + 1).tracks)).toBe(JSON.stringify(a.tracks)); // seed moves only idle
    expect(buildTimeline(civet(), 'idle', SEED).hash).not.toBe(buildTimeline(civet(), 'idle', SEED + 1).hash);
  });
  it('never reads the clock while building or sampling', () => {
    const d = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); });
    vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock'); });
    const tl = buildTimeline(civet(), 'idle', SEED);
    expect(() => sampleTimeline(tl, 1234.5)).not.toThrow(); expect(d).not.toHaveBeenCalled();
  });
  it('builds every quadruped action with the mass-scaled phase table', () => {
    const card = civet();
    for (const id of QUADRUPED_ACTION_IDS) {
      const tl = buildTimeline(card, id, SEED);
      expect(tl.bodyMs).toBeCloseTo(tl.phases.reduce((s, [, ms]) => s + ms, 0), 9);
      expect(tl.durationMs).toBeGreaterThanOrEqual(tl.bodyMs);
      expect(Object.keys(tl.tracks)).toHaveLength(31);
    }
    const melee = buildTimeline(card, 'melee', SEED);
    expect(melee.actionId).toBe('melee:bite'); expect(melee.phases.map(([n]) => n)).toEqual(['anticipation', 'strike', 'smear', 'recovery']);
    expect(melee.bodyMs).toBeCloseTo((140 + 90 + 1000 / 60 + 260) * 0.85, 9); expect(melee.hitstopMs).toBeCloseTo(59.5);
    expect(buildTimeline(compileBodyCard(foxRecord()), 'approach', SEED).actionId).toBe('approach:trot');
    expect(buildTimeline(compileBodyCard(proceduralRecord(), proceduralGenome()), 'melee', SEED).actionId).toBe('melee:gore');
  });
  it('keeps every authored key pose inside the joint limits (and flags one that is not)', () => {
    const card = civet();
    for (const id of QUADRUPED_ACTION_IDS) {
      const tl = buildTimeline(card, id, SEED);
      expect(tl.clamped, id).toEqual([]);
      for (const [joint, keys] of Object.entries(tl.tracks)) {
        const lim = card.bounds.limitsDeg[joint]!;
        for (const k of keys) { const deg = k.value * 180 / Math.PI; expect(deg, `${id}/${joint}`).toBeGreaterThanOrEqual(lim.min - 1e-9); expect(deg).toBeLessThanOrEqual(lim.max + 1e-9); }
      }
      for (const pose of QUADRUPED_ACTIONS[id]!.poses) expect(EASES).toContain(pose.ease);
    }
    const tight: BodyCard = { ...card, bounds: { ...card.bounds, limitsDeg: { ...card.bounds.limitsDeg, head: { min: -5, max: 5 } } } };
    const tl = buildTimeline(tight, 'hit', SEED);
    expect(tl.clamped[0]).toMatch(/^hit\/head@/);
    expect(Math.max(...tl.tracks.head!.map((k) => Math.abs(k.value)))).toBeCloseTo(5 * Math.PI / 180, 12);
  });
  it('strong melee poses: crouch, launch 0.36 body length, jaw 25 open, swipe 40', () => {
    const tl = buildTimeline(civet(), 'melee:bite', SEED), rad = (d: number): number => d * Math.PI / 180;
    const at = (keys: readonly Keyframe[], i: number): number => keys[i]!.value;
    expect(at(tl.tracks.spine!, 1)).toBeCloseTo(rad(12)); expect(at(tl.tracks.head!, 1)).toBeCloseTo(rad(10));
    expect(at(tl.root.dx, 2)).toBe(0.36); expect(at(tl.tracks.jaw!, 3)).toBeCloseTo(rad(-25)); expect(at(tl.tracks.foreNearKnee!, 3)).toBeCloseTo(rad(-40));
    const hit = buildTimeline(civet(), 'hit', SEED);
    expect(at(hit.tracks.head!, 1)).toBeCloseTo(rad(-20)); expect(at(hit.root.dx, 2)).toBe(-0.14);
  });
  it('secondary parts lag their driver by material and finish after the body', () => {
    const tl = buildTimeline(civet(), 'hit', SEED);
    const tail = tl.secondary.filter((s) => s.partId === 'tail');
    expect(tail.map((s) => s.lagMs)).toEqual([80, 160, 240, 320]);
    expect(tail[0]!.overshoot).toBeCloseTo(0.2); expect(tl.durationMs).toBeCloseTo(tl.bodyMs + 320 * 1.6);
    const body = sampleTimeline(tl, tl.bodyMs), late = sampleTimeline(tl, tl.bodyMs + 100);
    expect(body.joints.head).toBeCloseTo(0, 9); expect(Math.abs(body.joints.tail0!)).toBeGreaterThan(1e-4);
    expect(Math.abs(late.joints.tail3!), 'tail tip inherits the chain, attenuated and lagged').toBeGreaterThan(1e-4); expect(Math.abs(late.joints.tail3!)).toBeLessThan(Math.abs(sampleTimeline(tl, tl.bodyMs - 120).joints.tail0!));
    const plated = compileBodyCard({ ...civetRecord(), materials: { surface: 'plated' } });
    expect(buildTimeline(plated, 'hit', SEED).secondary.every((s) => s.rigid && s.lagMs === 0)).toBe(true);
    const slick = buildTimeline(compileBodyCard({ ...civetRecord(), materials: { surface: 'slick and wet' } }), 'melee', SEED);
    expect(slick.deform).toEqual({ squash: 0.06, stretch: 0.04 });
    const launch = sampleTimeline(slick, slick.phases[0]![1] + 20);
    expect(launch.scale.x).toBeGreaterThan(1); expect(launch.scale.y).toBeLessThan(1);
  });
});

describe('sampleTimeline', () => {
  it('passes exactly through every key and stays continuous and monotonic between keys', () => {
    const tl = buildTimeline(civet(), 'melee:bite', SEED);
    for (const [joint, keys] of Object.entries(tl.tracks)) {
      if (tl.secondary.some((s) => s.joint === joint)) continue;
      for (const k of keys) expect(sampleTimeline(tl, k.ms).joints[joint], `${joint}@${k.ms}`).toBeCloseTo(k.value, 9);
      for (let i = 1; i < keys.length; i++) {
        const a = keys[i - 1]!, b = keys[i]!, dir = Math.sign(b.value - a.value);
        let prev = a.value;
        for (let ms = a.ms; ms <= b.ms; ms += 0.5) {
          const v = sampleTimeline(tl, ms).joints[joint]!;
          expect(Math.abs(v - prev), `${joint} jump @${ms}`).toBeLessThan(0.06);
          if (b.ease !== 'back-out') expect((v - prev) * dir, `${joint} monotonic @${ms}`).toBeGreaterThanOrEqual(-1e-12);
          prev = v;
        }
      }
    }
    for (const e of EASES) { expect(EASE_FN[e](0)).toBeCloseTo(0, 12); expect(EASE_FN[e](1)).toBeCloseTo(1, 12); }
  });
  it('loops idle and clamps one-shots', () => {
    const idle = buildTimeline(civet(), 'idle', SEED);
    expect(sampleTimeline(idle, idle.bodyMs * 2.25).joints.tail0).toBeCloseTo(sampleTimeline(idle, idle.bodyMs * 0.25).joints.tail0!, 9);
    const hit = buildTimeline(civet(), 'hit', SEED);
    expect(sampleTimeline(hit, hit.durationMs + 500).ms).toBe(hit.durationMs); expect(sampleTimeline(hit, -5).ms).toBe(0);
  });
});

describe('gsap adapter', () => {
  it('plays through gsap with an injected clock and agrees with the pure sampler', () => {
    const tl = buildTimeline(civet(), 'melee:bite', SEED);
    const seen = new Map<string, [number, number, number]>();
    const target: PoseTarget = { setJoint: (n, r, dx, dy) => { seen.set(n, [r, dx, dy]); } };
    let clock = 5000;
    const player = createGsapPlayer(tl, target, { now: () => clock });
    player.start();
    for (const offset of [0, 60, 119, 150, 200, 280, 400, tl.bodyMs, tl.durationMs]) {
      clock = 5000 + offset; player.tick();
      const pure = sampleTimeline(tl, offset);
      for (const [joint, [rot, dx, dy]] of seen) {
        expect(rot, `${joint}@${offset}`).toBeCloseTo(pure.joints[joint]!, 4);
        expect(dx).toBeCloseTo(pure.root.dx, 5); expect(dy).toBeCloseTo(pure.root.dy, 5);
      }
    }
    expect(seen.size).toBe(31);
    const idle = createGsapPlayer(buildTimeline(civet(), 'idle', SEED), target, { now: () => clock });
    idle.start(); clock += 7000; const progress = idle.tick();
    expect(progress).toBeGreaterThan(0); expect(progress).toBeLessThan(1);
    idle.stop(); player.stop();
  });
});
