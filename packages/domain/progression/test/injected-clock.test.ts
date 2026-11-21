import { describe, expect, it, vi } from 'vitest';
import {
  activateAutoExtractor,
  activePlayDeadlineStatus,
  createActivePlayClock,
  createActivePlayDeadline,
  createEpochClock,
  initializeRecurringAccrual,
  loadAutoExtractorCursors,
  migrateLegacyAutoExtractorCursors,
  settleRecurringAccrual,
} from '@cf/domain-progression';

/* The game's clocks take their time from the app: elapsed seconds for the epoch clock,
   a monotonic millisecond reading for active play, and an active-play total for readiness
   and the Auto-Extractor. Handed no time, each throws; none reads the device clock. */
const active = Object.freeze({ visible: true, answerable: true, leaseOwned: true });
const none = undefined as unknown as number;

describe('@cf/domain-progression — clocks need an injected time source', () => {
  it('refuses a missing time source and never reads the device clock', () => {
    const dateNow = vi.spyOn(Date, 'now');
    const perfNow = vi.spyOn(performance, 'now');
    try {
      const noElapsed = createEpochClock(3, undefined as unknown as () => number);
      expect(() => noElapsed.current()).toThrow(TypeError);

      const play = createActivePlayClock(0, active, 10);
      expect(() => play.current(none)).toThrow('finite and non-negative');
      expect(() => play.setEligibility(active, none)).toThrow('finite and non-negative');

      expect(() => createActivePlayDeadline(none, 10)).toThrow(/activePlayMs/);
      expect(() => activePlayDeadlineStatus(createActivePlayDeadline(0, 10), none)).toThrow(/activePlayMs/);
      expect(() => initializeRecurringAccrual(none)).toThrow(/activePlayMs/);
      expect(() => settleRecurringAccrual(initializeRecurringAccrual(0), none, { cadenceMs: 10, maxBatch: 2 }))
        .toThrow(/activePlayMs/);

      expect(() => migrateLegacyAutoExtractorCursors([[133, 0]], none)).toThrow(/active-play/);
      expect(() => loadAutoExtractorCursors(undefined, [], none)).toThrow(/active-play/);
      expect(() => activateAutoExtractor(migrateLegacyAutoExtractorCursors([], 0), none)).toThrow(/active-play/);

      expect(createEpochClock(3, () => 2_400).current()).toBe(5);
      expect(play.current(20).activePlayMs).toBe(10);
      expect(dateNow).not.toHaveBeenCalled();
      expect(perfNow).not.toHaveBeenCalled();
    } finally {
      dateNow.mockRestore();
      perfNow.mockRestore();
    }
  });
});
