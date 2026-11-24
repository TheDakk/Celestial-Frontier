/* First Arrival (v1.8.9, main.js:13282-13292): the first time the expedition reaches a star system outside Sol,
   the record pays a pinch of Stardust. The cap is a hard stop, tested before the system is added.

   Pure: the caller owns the seen list, the balance and the notice. A paid answer carries the new seen list and
   the amount; the caller adds the amount to the Stardust balance and to the Stardust-earned total, and counts
   one arrival. */

export const FIRST_ARRIVAL_STARDUST = 2;
export const FIRST_ARRIVAL_SYSTEM_CAP = 900;
/** The seed of Sol (main.js:1251). The same value as SOL_SEED of @cf/domain-worldconfig, which this package does
    not depend on; the test holds the two equal. */
export const SOL_SEED = 424242;

export type FirstArrival =
  | { readonly kind: 'paid'; readonly stardust: typeof FIRST_ARRIVAL_STARDUST; readonly seen: readonly number[] }
  | { readonly kind: 'none'; readonly reason: 'loading' | 'training' | 'no-system' | 'sol' | 'seen' | 'cap' };

export interface FirstArrivalInput {
  /** The seed of the star arrived at, or null when there is none. */
  readonly starSeed: number | null;
  /** The seeds of the star systems already arrived at. Never changed here. */
  readonly seen: readonly number[];
  readonly loading: boolean;
  readonly trainingDone: boolean;
}

const none = (reason: Extract<FirstArrival, { kind: 'none' }>['reason']): FirstArrival => ({ kind: 'none', reason });

export function firstArrival(input: FirstArrivalInput): FirstArrival {
  const { starSeed, seen } = input;
  if (input.loading) return none('loading');
  if (!input.trainingDone) return none('training');
  if (starSeed == null) return none('no-system');
  if (starSeed === SOL_SEED) return none('sol');
  if (seen.includes(starSeed)) return none('seen');
  if (seen.length >= FIRST_ARRIVAL_SYSTEM_CAP) return none('cap');
  return { kind: 'paid', stardust: FIRST_ARRIVAL_STARDUST, seen: [...seen, starSeed] };
}
