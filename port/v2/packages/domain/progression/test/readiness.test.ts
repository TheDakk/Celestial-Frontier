import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_PLAY_DEADLINE_SCHEMA,
  RECURRING_ACCRUAL_CURSOR_SCHEMA,
  activePlayDeadlineStatus,
  createActivePlayDeadline,
  initializeRecurringAccrual,
  settleRecurringAccrual,
} from '@cf/domain-progression';

describe('@cf/domain-progression — active-play readiness', () => {
  it('settles deadlines at the exact active-play boundary', () => {
    const deadline = createActivePlayDeadline(4_000, 2_500);
    expect(deadline).toEqual({ schema: ACTIVE_PLAY_DEADLINE_SCHEMA, readyAtActivePlayMs: 6_500 });
    expect(activePlayDeadlineStatus(deadline, 6_499)).toEqual({ ready: false, remainingMs: 1 });
    expect(activePlayDeadlineStatus(deadline, 6_500)).toEqual({ ready: true, remainingMs: 0 });
    expect(activePlayDeadlineStatus(deadline, 9_000)).toEqual({ ready: true, remainingMs: 0 });
  });

  it('starts an absent recurring cursor now with no wall-clock backlog', () => {
    const cursor = initializeRecurringAccrual(50_000);
    expect(cursor).toEqual({
      schema: RECURRING_ACCRUAL_CURSOR_SCHEMA,
      collectedThroughActivePlayMs: 50_000,
    });
    expect(settleRecurringAccrual(cursor, 50_000, { cadenceMs: 1_000, maxBatch: 3 }))
      .toMatchObject({ due: 0, matured: 0, discarded: 0, capped: false, next: cursor });
  });

  it('preserves fractional cadence and grants each completed interval exactly once', () => {
    const cursor = initializeRecurringAccrual(100);
    const before = settleRecurringAccrual(cursor, 1_099, { cadenceMs: 1_000, maxBatch: 5 });
    expect(before).toMatchObject({ due: 0, matured: 0 });
    const first = settleRecurringAccrual(cursor, 1_100, { cadenceMs: 1_000, maxBatch: 5 });
    expect(first).toMatchObject({ due: 1, matured: 1, discarded: 0 });
    expect(first.next.collectedThroughActivePlayMs).toBe(1_100);
    const remainder = settleRecurringAccrual(first.next, 2_099, { cadenceMs: 1_000, maxBatch: 5 });
    expect(remainder).toMatchObject({ due: 0, matured: 0 });
  });

  it('caps once and consumes the full mature backlog so repeated collection mints nothing', () => {
    const cursor = initializeRecurringAccrual(0);
    const capped = settleRecurringAccrual(cursor, 10_500, { cadenceMs: 1_000, maxBatch: 3 });
    expect(capped).toMatchObject({ due: 3, matured: 10, discarded: 7, capped: true });
    expect(capped.next.collectedThroughActivePlayMs).toBe(10_000);
    expect(settleRecurringAccrual(capped.next, 10_500, { cadenceMs: 1_000, maxBatch: 3 }))
      .toMatchObject({ due: 0, matured: 0, discarded: 0 });
  });

  it('fails closed on future/corrupt cursors and invalid policies', () => {
    const cursor = initializeRecurringAccrual(100);
    expect(() => settleRecurringAccrual(cursor, 99, { cadenceMs: 10, maxBatch: 2 })).toThrow(/ahead/);
    expect(() => settleRecurringAccrual({ ...cursor, schema: 'future' as never }, 100, { cadenceMs: 10, maxBatch: 2 }))
      .toThrow(/schema/);
    expect(() => settleRecurringAccrual(cursor, 100, { cadenceMs: 0, maxBatch: 2 })).toThrow(/duration/);
    expect(() => settleRecurringAccrual(cursor, 100, { cadenceMs: 10, maxBatch: 0 })).toThrow(/maxBatch/);
    expect(() => createActivePlayDeadline(0, 0)).toThrow(/duration/);
  });

  it('contains no device-clock or entropy source', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/readiness.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/Date\.now\s*\(/);
    expect(source).not.toMatch(/Math\.random\s*\(/);
    expect(source).not.toMatch(/performance\.now\s*\(/);
  });
});
