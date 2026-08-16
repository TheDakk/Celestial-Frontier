import { describe, it, expect } from 'vitest';
import { createEpochClock, harvestReady, clampHarvestEpoch, markHarvested, sanitizeEpoch, EPOCH_TICK, HARVEST_EPOCHS, MAX_COSMIC_EPOCH } from '@cf/domain-progression';

/* These mirror tools/harvestclock-check.js's five invariants (the CLOCK
   GUARD born of CF1805-05: three failed wall-clock defences, then the clock
   itself was removed) — restated against the ported API. */

describe('@cf/domain-progression — the epoch clock', () => {
  it('constants match v1.8.9 (EPOCH_TICK 1200 · HARVEST_EPOCHS 2)', () => {
    expect(EPOCH_TICK).toBe(1200);
    expect(HARVEST_EPOCHS).toBe(2);
  });
  it('advances only with injected elapsed seconds: epochBase + floor(elapsed/tick)', () => {
    let elapsed = 0;
    const clock = createEpochClock(7, () => elapsed);
    expect(clock.current()).toBe(7);
    elapsed = 1199; expect(clock.current()).toBe(7);
    elapsed = 1200; expect(clock.current()).toBe(8);
    elapsed = 2 * 1200 + 5; expect(clock.current()).toBe(9);
  });
  it('keeps one session origin and reconstructs from the latest current() snapshot', () => {
    let firstElapsed = 0;
    const firstSession = createEpochClock(7, () => firstElapsed);
    expect(firstSession.base()).toBe(7);
    expect(firstSession.current()).toBe(7);

    firstElapsed = EPOCH_TICK;
    const firstSnapshot = firstSession.current();
    expect(firstSnapshot).toBe(8);
    expect(firstSession.base()).toBe(7);
    expect(firstSession.base()).not.toBe(firstSnapshot);

    firstElapsed = 2 * EPOCH_TICK;
    const latestSnapshot = firstSession.current();
    expect(latestSnapshot).toBe(9);
    expect(firstSession.base()).toBe(7);

    let secondElapsed = 0;
    const secondSession = createEpochClock(latestSnapshot, () => secondElapsed);
    expect(secondSession.base()).toBe(9);
    expect(secondSession.current()).toBe(9);
    secondElapsed = EPOCH_TICK;
    expect(secondSession.current()).toBe(10);
    expect(secondSession.base()).toBe(9);
  });
  it('★ THE HARVESTCLOCK INVARIANT: a wound wall clock grants NOTHING — by construction there is no wall-clock input at all', () => {
    /* v1.8.8's whole point, executable: the only input is injected elapsed seconds.
       Simulate "wind the device clock a day forward": elapsed input unchanged. */
    let elapsed = 100;
    const clock = createEpochClock(3, () => elapsed);
    const world = markHarvested({ tier: 2 }, clock.current());
    expect(harvestReady(world, clock.current())).toBe(false);
    /* a day of WALL time passes; zero injected elapsed change — nothing moves */
    expect(harvestReady(world, clock.current())).toBe(false);
    /* two injected elapsed epochs pass — readiness arrives */
    elapsed += 2 * EPOCH_TICK;
    expect(harvestReady(world, clock.current())).toBe(true);
  });
  it('readiness arrives at exactly HARVEST_EPOCHS, not before', () => {
    expect(harvestReady({ e: 5 }, 5 + HARVEST_EPOCHS - 1)).toBe(false);
    expect(harvestReady({ e: 5 }, 5 + HARVEST_EPOCHS)).toBe(true);
  });
  it('absent/null e ⇒ READY (the deliberate one-time pre-v1.8.8 migration cycle)', () => {
    expect(harvestReady({ tier: 1 }, 0)).toBe(true);
    expect(harvestReady({ e: null }, 0)).toBe(true);
    expect(harvestReady(null, 99)).toBe(false);   /* no row — not a world you hold */
  });
  it('the load clamp: future epochs cannot hold a world hostage; negatives cannot mint free cycles', () => {
    expect(clampHarvestEpoch(1e9, 10)).toBe(10);   /* future ⇒ bounded to base */
    expect(clampHarvestEpoch(-5, 10)).toBe(0);
    expect(clampHarvestEpoch('nonsense', 10)).toBe(0);
    expect(clampHarvestEpoch(7, 10)).toBe(7);      /* honest values untouched */
  });
  it('a clamped future-epoch save pays after the normal wait, never never', () => {
    const base = 10;
    const clock = (() => { let play = 0; const c = createEpochClock(base, () => play); return { c, advance: (s: number) => { play += s; } }; })();
    const row = { e: clampHarvestEpoch(999999, base) };   /* tampered future stamp */
    expect(harvestReady(row, clock.c.current())).toBe(false);
    clock.advance(HARVEST_EPOCHS * EPOCH_TICK);
    expect(harvestReady(row, clock.c.current())).toBe(true);
  });
  it('markHarvested restarts the cycle from NOW and does not mutate its input', () => {
    const before = { tier: 3, e: 1 };
    const after = markHarvested(before, 6);
    expect(after.e).toBe(6);
    expect(before.e).toBe(1);
    expect(harvestReady(after, 6)).toBe(false);
    expect(harvestReady(after, 6 + HARVEST_EPOCHS)).toBe(true);
  });
  it('hostile/fractional epochs cannot create an unbounded ecology loop', () => {
    expect(sanitizeEpoch(12)).toBe(12);
    expect(sanitizeEpoch('12')).toBe(12);
    expect(sanitizeEpoch(1.1)).toBe(0);
    expect(sanitizeEpoch(-1)).toBe(0);
    expect(sanitizeEpoch(1e12)).toBe(MAX_COSMIC_EPOCH);
    let play = 0;
    const clock = createEpochClock(1e12, () => play);
    expect(clock.current()).toBe(MAX_COSMIC_EPOCH);
    play = 1e9;
    expect(clock.current()).toBe(MAX_COSMIC_EPOCH);
  });
});
