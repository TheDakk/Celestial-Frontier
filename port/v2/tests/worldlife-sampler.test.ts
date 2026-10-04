import { afterEach, describe, expect, it, vi } from 'vitest';
import { compileWorldLife, sampleWorldLife, WorldLifeRefusal, type WorldLifeCardV1 } from '../apps/game/src/worldlife/index.js';

const TEMPERATE: WorldLifeCardV1 = { biome: 'temperate', weather: 'rain', water: 'liquid', timeOfDay: 'day' };
const SEED = 593405465;
const replay = (seed: number, frames = 300): string => {
  const spec = compileWorldLife(TEMPERATE, seed, 'landfall');
  let out = '';
  for (let i = 0; i < frames; i++) out += JSON.stringify(sampleWorldLife(spec, i * 33));
  return out;
};

describe('worldlife sampler: determinism', () => {
  afterEach(() => vi.restoreAllMocks());
  it('replays byte-identically for the same seed across 300 samples', () => {
    expect(replay(SEED)).toBe(replay(SEED));
  });
  it('differs for a different seed', () => {
    expect(replay(SEED, 3)).not.toBe(replay(SEED + 1, 3));
  });
  it('never reads a clock during compile or sampling (negative control)', () => {
    const now = vi.spyOn(Date, 'now'), perf = vi.spyOn(performance, 'now');
    const spec = compileWorldLife(TEMPERATE, SEED, 'arena');
    for (let i = 0; i < 50; i++) sampleWorldLife(spec, i * 16);
    expect(now).not.toHaveBeenCalled(); expect(perf).not.toHaveBeenCalled();
    // The control itself is live: a real clock read is seen.
    Date.now(); expect(now).toHaveBeenCalledTimes(1);
  });
  it('refuses a non-finite or negative time with a named reason', () => {
    const spec = compileWorldLife(TEMPERATE, SEED, 'landfall');
    for (const ms of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
      try { sampleWorldLife(spec, ms); throw new Error('accepted'); } catch (e) { expect(e).toBeInstanceOf(WorldLifeRefusal); expect((e as WorldLifeRefusal).reason).toBe('time-invalid'); }
    }
  });
});

describe('worldlife sampler: layers', () => {
  const spec = compileWorldLife(TEMPERATE, SEED, 'landfall');
  it('streak field stays inside the wrapped frame and moves between frames', () => {
    const a = sampleWorldLife(spec, 0), b = sampleWorldLife(spec, 500);
    expect(a.streaks.length).toBe(spec.precipitation!.count * 5);
    for (let i = 0; i < a.streaks.length; i += 5) {
      expect(a.streaks[i]).toBeGreaterThanOrEqual(0); expect(a.streaks[i]).toBeLessThan(1);
      expect(a.streaks[i + 1]).toBeGreaterThanOrEqual(-spec.precipitation!.length[1]); expect(a.streaks[i + 1]).toBeLessThan(1 + spec.precipitation!.length[1]);
      expect(a.streaks[i + 4]).toBeGreaterThan(0);
    }
    expect(a.streaks).not.toEqual(b.streaks);
    expect(b.driftOffsets).not.toEqual(a.driftOffsets);
    expect(b.shimmerPhase).not.toBe(a.shimmerPhase);
    expect(b.swayAngles).not.toEqual(a.swayAngles);
  });
  it('sway angles stay inside the amplitude bound per band', () => {
    for (let ms = 0; ms < 20000; ms += 90) {
      const s = sampleWorldLife(spec, ms);
      s.swayAngles.forEach((angle, i) => expect(Math.abs(angle)).toBeLessThanOrEqual(0.06 * spec.sway.bands[i]!.amplitude + 1e-12));
    }
  });
  it('water none yields no shimmer phase; no fliers yields an empty list', () => {
    const dry = sampleWorldLife(compileWorldLife({ biome: 'geode', weather: null, water: 'none', timeOfDay: 'day' }, SEED, 'landfall'), 700);
    expect(dry.shimmerPhase).toBeNull(); expect(dry.shimmerBandPhases).toEqual([]); expect(dry.fliers).toEqual([]);
    expect(dry.flicker.length).toBe(6);
    for (const [, , k] of dry.flicker) { expect(k).toBeGreaterThanOrEqual(0.55); expect(k).toBeLessThanOrEqual(1); }
  });
  it('reduced motion returns the t=0 state for any ms', () => {
    const zero = JSON.stringify(sampleWorldLife(spec, 0));
    for (const ms of [1, 250, 4000, 123456]) expect(JSON.stringify(sampleWorldLife(spec, ms, { reducedMotion: true }))).toBe(zero);
    expect(JSON.stringify(sampleWorldLife(spec, 250))).not.toBe(zero); // negative control: without the flag, time moves
  });
});
