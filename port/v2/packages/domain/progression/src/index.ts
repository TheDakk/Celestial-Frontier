/* @cf/domain-progression — PHASE 2: COSMIC_EPOCH + conquest harvest state.

   THE CLOCK LAW (v1.8.8, "Paid for Playing"): an offline game cannot verify
   Date.now(). Three rounds of wall-clock mitigations failed before the
   untrustworthy clock was REMOVED instead of defended. COSMIC_EPOCH is the
   capped ecology/world-presentation epoch and retained legacy-harvest clock:
       COSMIC_EPOCH = constructionBase + floor(elapsedSeconds / EPOCH_TICK)
   It never reads the OS wall clock. The app injects one monotonic elapsed
   session segment; visibility/answerability policy belongs to F4 and is not
   implied by this domain API. Future missions, Recovery, and Auto-Extractor
   readiness use the separate persisted activePlayMs authority.

   PERSISTENCE RECIPE — the distinction base() versus current() is material:
   1. On boot, construct once from the saved epoch and a fresh elapsed segment
      whose origin is zero.
   2. During that session, persist current(), never base(). Saving does not
      reconstruct or rebase the live clock.
   3. On the next boot, construct a new clock from the last serialized current()
      snapshot and another fresh zero-origin elapsed segment.
   Persisting base() freezes all progress made in the session. Rebasing while
   reusing the old elapsed segment double-counts it.

   Constants and predicate bodies mirror v1.8.9 exactly (main.js ~12198,
   ~18291, ~14243). The time source remains injected so the domain stays
   clock-free and winding the device clock grants nothing by construction. */

export * from './readiness.js';
export * from './auto-extractor.js';

/** Injected elapsed seconds per epoch — v1.7 balance: 240→1200 ("slow evolution, not
    a 4-min farm"). ⚠ SHARED knob: drives biosphere recovery AND harvest
    income — retune with both in view (ECONOMY_LOOT_CRAFTING.md). */
export const EPOCH_TICK = 1200;
/** Epochs before the retained settled-world harvest predicate becomes ready. */
export const HARVEST_EPOCHS = 2;
/** Algorithmic safety ceiling. One epoch is 20 injected elapsed minutes, so
    10,000 represents more than 138 continuous days. Ecology's
    verbatim evolution walks once per epoch; an unbounded imported value can
    otherwise lock the main thread for minutes or effectively forever. */
export const MAX_COSMIC_EPOCH = 10_000;

export function sanitizeEpoch(value: unknown): number {
  const epoch = +(value as number);
  return Number.isSafeInteger(epoch) && epoch >= 0 ? Math.min(epoch, MAX_COSMIC_EPOCH) : 0;
}

/** A conquest ledger row: `t` is a DISPLAY stamp (gates nothing since
    v1.8.8); `e` is the epoch at last harvest — ABSENT means READY (a
    pre-v1.8.8 empire pays one cycle per world on first load, deliberate). */
export interface ConquestRow { t?: number; tier?: number; e?: number | null; }

export interface EpochClock {
  /** Advancing snapshot for ordinary persistence and epoch-aware consumers. */
  current(): number;
  /** Immutable sanitized construction origin. Never use as the current save snapshot. */
  base(): number;
}

/**
 * `elapsedSeconds` is one app-owned monotonic segment, starting at zero for
 * each construction/rebase. Persist `current()`; rebuild only on a later boot
 * from that serialized snapshot and a new zero-origin segment.
 */
export function createEpochClock(epochBase: number, elapsedSeconds: () => number, tick: number = EPOCH_TICK): EpochClock {
  const base = sanitizeEpoch(epochBase);
  const safeTick = Number.isFinite(tick) && tick > 0 ? tick : EPOCH_TICK;
  return {
    current(): number {
      const elapsed = +elapsedSeconds();
      const steps = Number.isFinite(elapsed) && elapsed > 0 ? Math.floor(elapsed / safeTick) : 0;
      return Math.min(MAX_COSMIC_EPOCH, base + steps);
    },
    base(): number { return base; },
  };
}

/** v1.8.9 body, verbatim semantics (main.js:18297):
    absent `e` ⇒ ready; otherwise ready after HARVEST_EPOCHS. */
export function harvestReady(c: ConquestRow | null | undefined, cosmicEpoch: number): boolean {
  return !!c && (c.e == null || (cosmicEpoch - (+c.e! || 0)) >= HARVEST_EPOCHS);
}

/** The v1.8.8 LOAD CLAMP (main.js:14243): a saved harvest epoch is bounded
    to the epoch clock's own range — a future epoch would hold a world
    hostage forever; a wildly negative one would grant free harvests beyond
    the deliberate single ready cycle. */
export function clampHarvestEpoch(e: unknown, epochBase: number): number {
  const x = +(e as number); const v = Number.isFinite(x) ? x : 0;
  return Math.max(0, Math.min(sanitizeEpoch(epochBase), v));
}

/** Record a harvest: readiness restarts from the CURRENT epoch. */
export function markHarvested(c: ConquestRow, cosmicEpoch: number): ConquestRow {
  return { ...c, e: cosmicEpoch };
}

/* ---------- F4 visible/answerable active-play clock ---------- */

/** This is deliberately much larger than any practical expedition while
 * remaining exactly representable. It is an integrity cap, not game pacing. */
export const MAX_ACTIVE_PLAY_MS = 10_000_000_000_000;

export interface ActivePlayEligibility {
  readonly visible: boolean;
  readonly answerable: boolean;
  readonly leaseOwned: boolean;
}

export interface ActivePlaySnapshot {
  readonly activePlayMs: number;
  readonly eligible: boolean;
}

export interface ActivePlayClock {
  /** Accrue through `nowMs`, then change the eligibility of later time. */
  setEligibility(eligibility: ActivePlayEligibility, nowMs: number): ActivePlaySnapshot;
  /** Read an advancing snapshot without rebasing the clock. */
  current(nowMs: number): ActivePlaySnapshot;
}

function checkedMonotonicMs(value: number, prior: number): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('active-play monotonic time must be finite and non-negative');
  if (value < prior) throw new RangeError('active-play monotonic time moved backwards');
  return value;
}

export function sanitizeActivePlayMs(value: unknown): number {
  const candidate = Number(value);
  return Number.isSafeInteger(candidate) && candidate >= 0
    ? Math.min(candidate, MAX_ACTIVE_PLAY_MS)
    : 0;
}

function isEligible(value: ActivePlayEligibility): boolean {
  return value.visible === true && value.answerable === true && value.leaseOwned === true;
}

/**
 * Create the F4 readiness clock from one persisted snapshot and an injected
 * monotonic segment. Device wall time is intentionally absent. Eligibility
 * requires all three authorities at once: visible document, answerable app,
 * and the F3 tab lease. A hidden, frozen, or losing tab accrues zero.
 */
export function createActivePlayClock(
  persistedActivePlayMs: unknown,
  initialEligibility: ActivePlayEligibility,
  initialNowMs = 0,
): ActivePlayClock {
  let accumulated = sanitizeActivePlayMs(persistedActivePlayMs);
  let eligible = isEligible(initialEligibility);
  let anchor = checkedMonotonicMs(initialNowMs, 0);

  const accrue = (nowMs: number): ActivePlaySnapshot => {
    const now = checkedMonotonicMs(nowMs, anchor);
    if (eligible && now > anchor) {
      accumulated = Math.min(MAX_ACTIVE_PLAY_MS, accumulated + (now - anchor));
    }
    anchor = now;
    return Object.freeze({ activePlayMs: Math.trunc(accumulated), eligible });
  };

  return {
    setEligibility(next, nowMs) {
      accrue(nowMs);
      eligible = isEligible(next);
      return Object.freeze({ activePlayMs: Math.trunc(accumulated), eligible });
    },
    current(nowMs) { return accrue(nowMs); },
  };
}
