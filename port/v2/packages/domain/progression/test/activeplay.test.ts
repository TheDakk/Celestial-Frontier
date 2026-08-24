import { describe, expect, it } from 'vitest';
import {
  MAX_ACTIVE_PLAY_MS,
  createActivePlayClock,
  sanitizeActivePlayMs,
} from '@cf/domain-progression';

const active = Object.freeze({ visible: true, answerable: true, leaseOwned: true });

describe('@cf/domain-progression — F4 active-play clock', () => {
  it('accrues only while visible, answerable, and the lease owner', () => {
    const clock = createActivePlayClock(1_000, active, 100);
    expect(clock.current(350)).toEqual({ activePlayMs: 1_250, eligible: true });
    expect(clock.setEligibility({ ...active, visible: false }, 400)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.current(9_000)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.setEligibility({ ...active, visible: true, answerable: false }, 9_100)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.current(20_000)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.setEligibility({ visible: true, answerable: true, leaseOwned: false }, 20_100)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.current(30_000)).toEqual({ activePlayMs: 1_300, eligible: false });
    expect(clock.setEligibility(active, 30_100)).toEqual({ activePlayMs: 1_300, eligible: true });
    expect(clock.current(30_600)).toEqual({ activePlayMs: 1_800, eligible: true });
  });

  it('rebuilds from a persisted snapshot without counting time outside this monotonic segment', () => {
    const first = createActivePlayClock(2_000, active, 0);
    const persisted = first.current(750).activePlayMs;
    const reloaded = createActivePlayClock(persisted, active, 0);
    expect(reloaded.current(250).activePlayMs).toBe(3_000);
  });

  it('device-wall-clock winding cannot affect a clock that has no wall-clock input', () => {
    const clock = createActivePlayClock(0, active, 5);
    const originalDateNow = Date.now;
    Date.now = () => 9_999_999_999_999;
    try {
      expect(clock.current(105).activePlayMs).toBe(100);
    } finally {
      Date.now = originalDateNow;
    }
  });

  it('rejects a backwards or invalid monotonic source instead of minting progress', () => {
    const clock = createActivePlayClock(0, active, 10);
    expect(() => clock.current(9)).toThrow('moved backwards');
    expect(() => clock.current(Number.NaN)).toThrow('finite and non-negative');
    expect(clock.current(10).activePlayMs).toBe(0);
  });

  it('sanitizes imported state and caps accumulation exactly', () => {
    expect(sanitizeActivePlayMs(-1)).toBe(0);
    expect(sanitizeActivePlayMs('not-time')).toBe(0);
    expect(sanitizeActivePlayMs(MAX_ACTIVE_PLAY_MS + 1)).toBe(MAX_ACTIVE_PLAY_MS);
    const clock = createActivePlayClock(MAX_ACTIVE_PLAY_MS - 10, active, 0);
    expect(clock.current(50)).toEqual({ activePlayMs: MAX_ACTIVE_PLAY_MS, eligible: true });
  });
});
