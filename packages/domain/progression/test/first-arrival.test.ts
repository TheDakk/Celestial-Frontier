/* First Arrival: the first time the expedition reaches a star system outside Sol, the record pays 2 Stardust.
   There is no fixture; every expectation is the rule itself, cited by line:

   LEGACY main.js:13284  if(_loading || !tutDone || seed==null || seed===SOL_SEED || sysSeen.has(seed)) return;
   LEGACY main.js:13285  if(sysSeen.size>=900) return;      (the test comes BEFORE the add)
   LEGACY main.js:13286  sysSeen.add(seed);
   LEGACY main.js:13287  essence+=2; stats.essenceEarned=(stats.essenceEarned||0)+2;
   LEGACY main.js:1251   const SOL_SEED=424242; */

import { describe, expect, it } from 'vitest';
import { SOL_SEED as WORLD_SOL_SEED } from '@cf/domain-worldconfig';
import {
  FIRST_ARRIVAL_STARDUST,
  FIRST_ARRIVAL_SYSTEM_CAP,
  SOL_SEED,
  firstArrival,
} from '@cf/domain-progression';

const STAR = 77_001;
const arriving = { starSeed: STAR, seen: [] as readonly number[], loading: false, trainingDone: true };
/** `count` distinct seen systems, none of them STAR or Sol. */
const seenSystems = (count: number): number[] => Array.from({ length: count }, (_, i) => 1_000_000 + i);

describe('first arrival', () => {
  it('the values are the legacy ones', () => {
    expect(FIRST_ARRIVAL_STARDUST).toBe(2); // LEGACY main.js:13287
    expect(FIRST_ARRIVAL_SYSTEM_CAP).toBe(900); // LEGACY main.js:13285
    expect(SOL_SEED).toBe(424242); // LEGACY main.js:1251
    expect(SOL_SEED).toBe(WORLD_SOL_SEED); // one Sol: the copy here never drifts from the world's
  });

  it('a first arrival at a star pays 2 and adds the star to the seen list', () => {
    const seen = Object.freeze([5, 9]);
    // LEGACY main.js:13286-13287
    expect(firstArrival({ ...arriving, seen })).toEqual({ kind: 'paid', stardust: 2, seen: [5, 9, STAR] });
    expect(seen).toEqual([5, 9]);
  });

  it('a second arrival at the same star pays nothing (seen)', () => {
    const first = firstArrival(arriving);
    if (first.kind !== 'paid') throw new Error('the first arrival did not pay');
    // LEGACY main.js:13284 (sysSeen.has(seed))
    expect(firstArrival({ ...arriving, seen: first.seen })).toEqual({ kind: 'none', reason: 'seen' });
  });

  it('Sol never pays', () => {
    // LEGACY main.js:13284 (seed===SOL_SEED)
    expect(firstArrival({ ...arriving, starSeed: 424242 })).toEqual({ kind: 'none', reason: 'sol' });
  });

  it('nothing pays while loading', () => {
    // LEGACY main.js:13284 (_loading)
    expect(firstArrival({ ...arriving, loading: true })).toEqual({ kind: 'none', reason: 'loading' });
  });

  it('nothing pays during training', () => {
    // LEGACY main.js:13284 (!tutDone)
    expect(firstArrival({ ...arriving, trainingDone: false })).toEqual({ kind: 'none', reason: 'training' });
  });

  it('a null star pays nothing', () => {
    // LEGACY main.js:13284 (seed==null)
    expect(firstArrival({ ...arriving, starSeed: null })).toEqual({ kind: 'none', reason: 'no-system' });
  });

  it('a star whose seed is 0 is a star, and pays', () => {
    // LEGACY main.js:13284 tests seed==null, not falsiness
    expect(firstArrival({ ...arriving, starSeed: 0 })).toEqual({ kind: 'paid', stardust: 2, seen: [0] });
  });

  it('with 899 systems seen the next one pays; with 900 it does not, and the list is unchanged', () => {
    // LEGACY main.js:13285 (sysSeen.size>=900, tested before the add)
    const at899 = firstArrival({ ...arriving, seen: seenSystems(899) });
    expect(at899.kind).toBe('paid');
    if (at899.kind !== 'paid') return;
    expect(at899.seen).toHaveLength(900);
    expect(at899.seen[899]).toBe(STAR);

    const full = Object.freeze(seenSystems(900));
    const at900 = firstArrival({ ...arriving, seen: full });
    expect(at900).toEqual({ kind: 'none', reason: 'cap' });
    expect('seen' in at900).toBe(false);
    expect(full).toEqual(seenSystems(900));
  });

  it('a star already seen answers seen, not cap, when the list is full', () => {
    // LEGACY main.js:13284 comes before 13285
    const full = seenSystems(900);
    expect(firstArrival({ ...arriving, starSeed: full[0]!, seen: full })).toEqual({ kind: 'none', reason: 'seen' });
  });

  it('the reasons are tested in the order: loading, training, no-system, sol, seen, cap', () => {
    // LEGACY main.js:13284 left to right, then 13285. Each row holds every later condition too.
    const full = [...seenSystems(899), SOL_SEED];
    const reasonOf = (input: Parameters<typeof firstArrival>[0]): string => {
      const result = firstArrival(input);
      return result.kind === 'none' ? result.reason : 'paid';
    };
    expect(reasonOf({ starSeed: null, seen: full, loading: true, trainingDone: false })).toBe('loading');
    expect(reasonOf({ starSeed: null, seen: full, loading: false, trainingDone: false })).toBe('training');
    expect(reasonOf({ starSeed: null, seen: full, loading: false, trainingDone: true })).toBe('no-system');
    expect(reasonOf({ starSeed: SOL_SEED, seen: full, loading: false, trainingDone: true })).toBe('sol');
    expect(reasonOf({ starSeed: full[0]!, seen: full, loading: false, trainingDone: true })).toBe('seen');
    expect(reasonOf({ starSeed: STAR, seen: full, loading: false, trainingDone: true })).toBe('cap');
  });
});
