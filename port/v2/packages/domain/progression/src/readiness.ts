/* F4 active-play readiness primitives.

   These functions receive the persisted visible/answerable active-play clock.
   They never read device time, visibility, or a random source. Product owners
   store the cursor/deadline beside their own canonical target identity. */

export const ACTIVE_PLAY_DEADLINE_SCHEMA = 'cf-v2-active-play-deadline/v1' as const;
export const RECURRING_ACCRUAL_CURSOR_SCHEMA = 'cf-v2-recurring-accrual-cursor/v1' as const;
export const MAX_READINESS_MS = 10_000_000_000_000;
export const MAX_RECURRING_BATCH = 10_000;

export interface ActivePlayDeadline {
  readonly schema: typeof ACTIVE_PLAY_DEADLINE_SCHEMA;
  readonly readyAtActivePlayMs: number;
}

export interface ActivePlayDeadlineStatus {
  readonly ready: boolean;
  readonly remainingMs: number;
}

export interface RecurringAccrualCursor {
  readonly schema: typeof RECURRING_ACCRUAL_CURSOR_SCHEMA;
  readonly collectedThroughActivePlayMs: number;
}

export interface RecurringAccrualPolicy {
  readonly cadenceMs: number;
  readonly maxBatch: number;
}

export interface RecurringAccrualSettlement {
  readonly due: number;
  readonly matured: number;
  readonly discarded: number;
  readonly capped: boolean;
  readonly next: RecurringAccrualCursor;
}

function checkedActivePlayMs(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_READINESS_MS) {
    throw new RangeError(`${label} must be a bounded non-negative active-play millisecond value`);
  }
  return value as number;
}

function checkedDurationMs(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > MAX_READINESS_MS) {
    throw new RangeError('active-play duration must be a positive bounded integer');
  }
  return value as number;
}

function frozenCursor(collectedThroughActivePlayMs: number): RecurringAccrualCursor {
  return Object.freeze({
    schema: RECURRING_ACCRUAL_CURSOR_SCHEMA,
    collectedThroughActivePlayMs,
  });
}

export function createActivePlayDeadline(
  activePlayMs: number,
  durationMs: number,
): ActivePlayDeadline {
  const start = checkedActivePlayMs(activePlayMs, 'activePlayMs');
  const duration = checkedDurationMs(durationMs);
  const readyAt = start + duration;
  if (!Number.isSafeInteger(readyAt) || readyAt > MAX_READINESS_MS) {
    throw new RangeError('active-play deadline exceeds the supported range');
  }
  return Object.freeze({ schema: ACTIVE_PLAY_DEADLINE_SCHEMA, readyAtActivePlayMs: readyAt });
}

export function activePlayDeadlineStatus(
  deadline: ActivePlayDeadline,
  activePlayMs: number,
): ActivePlayDeadlineStatus {
  if (!deadline || deadline.schema !== ACTIVE_PLAY_DEADLINE_SCHEMA) {
    throw new TypeError('active-play deadline schema is unsupported');
  }
  const readyAt = checkedActivePlayMs(deadline.readyAtActivePlayMs, 'readyAtActivePlayMs');
  const current = checkedActivePlayMs(activePlayMs, 'activePlayMs');
  return Object.freeze({
    ready: current >= readyAt,
    remainingMs: Math.max(0, readyAt - current),
  });
}

/** An absent legacy cursor begins now and earns no retroactive grant. */
export function initializeRecurringAccrual(activePlayMs: number): RecurringAccrualCursor {
  return frozenCursor(checkedActivePlayMs(activePlayMs, 'activePlayMs'));
}

/**
 * Settle all matured intervals once. If backlog exceeds maxBatch, only the
 * bounded reward is granted and the rest is explicitly discarded while the
 * cursor advances through the complete matured window. Repeated clicks at the
 * same active-play snapshot therefore cannot drain multiple capped batches.
 */
export function settleRecurringAccrual(
  cursor: RecurringAccrualCursor,
  activePlayMs: number,
  policy: RecurringAccrualPolicy,
): RecurringAccrualSettlement {
  if (!cursor || cursor.schema !== RECURRING_ACCRUAL_CURSOR_SCHEMA) {
    throw new TypeError('recurring accrual cursor schema is unsupported');
  }
  const through = checkedActivePlayMs(cursor.collectedThroughActivePlayMs, 'collectedThroughActivePlayMs');
  const current = checkedActivePlayMs(activePlayMs, 'activePlayMs');
  if (current < through) throw new RangeError('active-play cursor is ahead of the current authority');
  const cadenceMs = checkedDurationMs(policy?.cadenceMs);
  if (!Number.isSafeInteger(policy?.maxBatch) || policy.maxBatch < 1 || policy.maxBatch > MAX_RECURRING_BATCH) {
    throw new RangeError('recurring accrual maxBatch must be a bounded positive integer');
  }
  const elapsed = current - through;
  const matured = Math.floor(elapsed / cadenceMs);
  const due = Math.min(matured, policy.maxBatch);
  const discarded = matured - due;
  const nextThrough = through + matured * cadenceMs;
  return Object.freeze({
    due,
    matured,
    discarded,
    capped: discarded > 0,
    next: frozenCursor(nextThrough),
  });
}
