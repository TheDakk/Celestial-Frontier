/** @module fabrication-batch [app] — the Fabricator's ×5 press (v1.8.9 parity, D16; v1 `data-craft5`: "Craft up to five in
 * one press"). v1 looped `craftItem` while `_canCraft` held; v2 keeps every fabrication its own audited receipt, so the batch
 * is a sequence of ordinary single fabrications that stops at the first press that does not commit. A converging outcome
 * (stale / publication-reload / lost authority) stops the batch AND is returned as-is, so the caller keeps its pending latch
 * until the reload settles; a plain refusal after at least one commit (the materials ran out) returns the last COMMIT, since
 * the durable record is exactly what was crafted. Nothing here touches durable state itself. */

export interface FabricationBatchOutcome {
  readonly kind: 'committed' | 'unavailable' | 'refused';
  readonly detail: string;
}

/** The committed detail a batch of N > 1 reports (the toast and the tests read it). */
export const FABRICATION_BATCH_DETAIL_PREFIX = 'fabricated-batch:' as const;

export async function runFabricationBatchV1<O extends FabricationBatchOutcome>(input: Readonly<{
  repeat: number;
  fabricate: () => Promise<O>;
  converges: (outcome: O) => boolean;
  /** True once the panel owner is released (the page is going away): stop between presses. */
  released: () => boolean;
}>): Promise<Readonly<{ outcome: O; committed: number }>> {
  if (!Number.isInteger(input.repeat) || input.repeat < 1) throw new RangeError('fabrication batch repeat must be a positive integer');
  let committed = 0;
  let lastCommitted: O | null = null;
  let outcome = await input.fabricate();
  for (;;) {
    if (outcome.kind !== 'committed' || input.converges(outcome)) break;
    committed++;
    lastCommitted = outcome;
    if (committed >= input.repeat || input.released()) break;
    outcome = await input.fabricate();
  }
  if (outcome.kind === 'committed' || input.converges(outcome) || lastCommitted === null) {
    return Object.freeze({ outcome: committed > 1 && outcome.kind === 'committed' && !input.converges(outcome) ? withBatchDetail(outcome, committed) : outcome, committed });
  }
  return Object.freeze({ outcome: committed > 1 ? withBatchDetail(lastCommitted, committed) : lastCommitted, committed });
}

function withBatchDetail<O extends FabricationBatchOutcome>(outcome: O, committed: number): O {
  return Object.freeze({ ...outcome, detail: `${FABRICATION_BATCH_DETAIL_PREFIX}${committed}` });
}

/** The committed toast's body: a batch names how many were crafted (v1: "<name> ×n — in your Cargo hold"). */
export function engineeringCommittedCopy(detail: string): string {
  if (detail.startsWith(FABRICATION_BATCH_DETAIL_PREFIX)) {
    const n = Number(detail.slice(FABRICATION_BATCH_DETAIL_PREFIX.length));
    if (Number.isInteger(n) && n > 1) return `Fabricated ×${n}. Each one is its own durable record.`;
  }
  return 'The durable expedition record now reflects this action.';
}
