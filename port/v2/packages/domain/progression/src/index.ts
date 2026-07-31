/* @cf/domain-progression — PHASE 2: COSMIC_EPOCH + conquest harvest state.

   THE CLOCK LAW (v1.8.8, "Paid for Playing"): an offline game cannot verify
   Date.now(). Three rounds of wall-clock mitigations failed before the
   untrustworthy clock was REMOVED instead of defended. COSMIC_EPOCH is a
   persisted, monotonic PLAY-TIME accumulator:
       COSMIC_EPOCH = EPOCH_BASE + floor(playSeconds / EPOCH_TICK)
   It never reads the OS clock, survives reloads (EPOCH_BASE saved as
   `epoch`), and cannot be wound. The reviewer's own correction elevates it:
   "the port's single time authority" for EVERY cooldown.

   Constants and predicate bodies mirror v1.8.9 exactly (main.js ~12198,
   ~18291, ~14243). The ONE deliberate difference: the time source is
   INJECTED (seconds of play), so the domain stays clock-free and the
   harvestclock invariant — wind the wall clock, gain nothing — holds BY
   CONSTRUCTION, not by discipline. The app layer owns the real source
   (performance.now()-based, as v1.8.9's perfTime). */

/** Seconds of play per epoch — v1.7 balance: 240→1200 ("slow evolution, not
    a 4-min farm"). ⚠ SHARED knob: drives biosphere recovery AND harvest
    income — retune with both in view (ECONOMY_LOOT_CRAFTING.md). */
export const EPOCH_TICK = 1200;
/** Epochs of play before a settled world pays again (~40 min of exploring). */
export const HARVEST_EPOCHS = 2;

/** A conquest ledger row: `t` is a DISPLAY stamp (gates nothing since
    v1.8.8); `e` is the epoch at last harvest — ABSENT means READY (a
    pre-v1.8.8 empire pays one cycle per world on first load, deliberate). */
export interface ConquestRow { t?: number; tier?: number; e?: number | null; }

export interface EpochClock {
  /** COSMIC_EPOCH now: epochBase + floor(playSeconds()/EPOCH_TICK). */
  current(): number;
  /** The persisted base — write this to the save as `epoch`. */
  base(): number;
}

/** playSeconds: monotonic seconds of PLAY this session (not wall time). */
export function createEpochClock(epochBase: number, playSeconds: () => number, tick: number = EPOCH_TICK): EpochClock {
  const base = Number.isFinite(+epochBase) ? Math.max(0, +epochBase) : 0;
  return {
    current(): number { return base + Math.floor(playSeconds() / tick); },
    base(): number { return base; },
  };
}

/** v1.8.9 body, verbatim semantics (main.js:18297):
    absent `e` ⇒ ready; otherwise ready after HARVEST_EPOCHS of play. */
export function harvestReady(c: ConquestRow | null | undefined, cosmicEpoch: number): boolean {
  return !!c && (c.e == null || (cosmicEpoch - (+c.e! || 0)) >= HARVEST_EPOCHS);
}

/** The v1.8.8 LOAD CLAMP (main.js:14243): a saved harvest epoch is bounded
    to the epoch clock's own range — a future epoch would hold a world
    hostage forever; a wildly negative one would grant free harvests beyond
    the deliberate single ready cycle. */
export function clampHarvestEpoch(e: unknown, epochBase: number): number {
  const x = +(e as number); const v = Number.isFinite(x) ? x : 0;
  return Math.max(0, Math.min(epochBase, v));
}

/** Record a harvest: readiness restarts from the CURRENT epoch. */
export function markHarvested(c: ConquestRow, cosmicEpoch: number): ConquestRow {
  return { ...c, e: cosmicEpoch };
}
