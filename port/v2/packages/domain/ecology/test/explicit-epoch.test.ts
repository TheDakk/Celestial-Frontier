import { describe, expect, it } from 'vitest';
import {
  MAX_ECOLOGY_EPOCH,
  checkedEcologyEpoch,
  planetSpecies,
  planetSpeciesAtEcologyEpoch,
} from '@cf/domain-ecology';

const AMBIENT_KEY = 'COSMIC_EPOCH';

function withLegacyEpoch<T>(epoch: number, action: () => T): T {
  const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_KEY);
  if (!Reflect.defineProperty(globalThis, AMBIENT_KEY, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: epoch,
  })) throw new Error('could not install legacy epoch oracle');
  try {
    return action();
  } finally {
    if (previous) Reflect.defineProperty(globalThis, AMBIENT_KEY, previous);
    else Reflect.deleteProperty(globalThis, AMBIENT_KEY);
  }
}

describe('@cf/domain-ecology — explicit ecology epoch owner', () => {
  it('matches the independent verbatim oracle across every level, band, and representative epoch', () => {
    const levels: ReadonlyArray<string | number> = [
      'complex', 'flora', 'aquatic', 'sparse', 'microbial',
      'subsurface', 'aerial', 'xfauna', 'none', 'earth', 2,
    ];
    const bands = ['temperate', 'hot', 'cold', 'frozen'] as const;
    /* Seed 16 is a required positive control: rich > 1 and the keyed hybrid
       predicate is true, so the wild-cross branch cannot remain vacuous. */
    const seeds = [1, 16, 50, 133, 4_242, 424_242, 0xFFFF_FFFE];
    const epochs = [0, 1, 3, 17];

    for (const epoch of epochs) withLegacyEpoch(epoch, () => {
      for (const seed of seeds) for (const band of bands) for (const level of levels) {
        const label = `seed=${seed} band=${band} level=${String(level)} epoch=${epoch}`;
        const legacy = structuredClone(planetSpecies({ seed }, { ignored: true }, band, level));
        const explicit = structuredClone(planetSpeciesAtEcologyEpoch(
          { seed },
          { deliberately: 'different' },
          band,
          level,
          epoch,
        ));
        expect(explicit, label).toEqual(legacy);
      }
    });

    const hybrid = planetSpeciesAtEcologyEpoch(
      { seed: 16 }, null, 'temperate', 'complex', 3,
    );
    expect(hybrid.filter((row) => (row.wild as unknown) === true)).toHaveLength(1);
    const aquatic = planetSpeciesAtEcologyEpoch(
      { seed: 16 }, null, 'temperate', 'aquatic', 3,
    );
    expect(aquatic.filter((row) => row.aq === 1 && row.kingdom === 'flora')).toHaveLength(2);
    const aerial = planetSpeciesAtEcologyEpoch(
      { seed: 1 }, null, 'temperate', 'aerial', 3,
    );
    expect(aerial.filter((row) => row.af === 1 && row.kingdom === 'flora')).toHaveLength(1);
    const extremophile = planetSpeciesAtEcologyEpoch(
      { seed: 16 }, null, 'temperate', 'xfauna', 3,
    );
    expect(extremophile.filter((row) => row.kingdom === 'fauna' && !row.wild)
      .every((row) => row.x === 1)).toBe(true);
  });

  it('pins legacy memo identity, exact 49-entry steady state, epoch separation, and system omission', () => {
    const seed = 0x5100_0001;
    const explicit = planetSpeciesAtEcologyEpoch({ seed }, { id: 'a' }, 'temperate', 2, 7);
    expect(planetSpeciesAtEcologyEpoch({ seed }, { id: 'b' }, 'temperate', 2, 7)).toBe(explicit);

    const legacy = withLegacyEpoch(7, () => planetSpecies({ seed }, { id: 'a' }, 'temperate', 2));
    expect(withLegacyEpoch(7, () => planetSpecies({ seed }, { id: 'b' }, 'temperate', 2))).toBe(legacy);

    /* `size > 48` is checked before insertion. The first row therefore
       survives 48 later misses (49 live entries) and is evicted by miss 49. */
    for (let index = 1; index <= 48; index++) {
      planetSpeciesAtEcologyEpoch({ seed: seed + index }, null, 'temperate', 2, 7);
      withLegacyEpoch(7, () => planetSpecies({ seed: seed + index }, null, 'temperate', 2));
    }
    expect(planetSpeciesAtEcologyEpoch({ seed }, null, 'temperate', 2, 7)).toBe(explicit);
    expect(withLegacyEpoch(7, () => planetSpecies({ seed }, null, 'temperate', 2))).toBe(legacy);

    planetSpeciesAtEcologyEpoch({ seed: seed + 49 }, null, 'temperate', 2, 7);
    withLegacyEpoch(7, () => planetSpecies({ seed: seed + 49 }, null, 'temperate', 2));
    const explicitAfterEviction = planetSpeciesAtEcologyEpoch({ seed }, null, 'temperate', 2, 7);
    const legacyAfterEviction = withLegacyEpoch(
      7,
      () => planetSpecies({ seed }, null, 'temperate', 2),
    );
    expect(explicitAfterEviction).not.toBe(explicit);
    expect(legacyAfterEviction).not.toBe(legacy);
    expect(explicitAfterEviction).toEqual(legacyAfterEviction);
    expect(planetSpeciesAtEcologyEpoch({ seed }, null, 'temperate', 2, 8))
      .not.toBe(explicitAfterEviction);
    expect(withLegacyEpoch(8, () => planetSpecies({ seed }, null, 'temperate', 2)))
      .not.toBe(legacyAfterEviction);
  });

  it('rejects the historical wrong-epoch shape and a changed canonical row', () => {
    const planet = { seed: 0x5100_2001 };
    const explicit = structuredClone(planetSpeciesAtEcologyEpoch(
      planet,
      null,
      'temperate',
      'complex',
      3,
    ));
    const correct = withLegacyEpoch(
      3,
      () => structuredClone(planetSpecies(planet, null, 'temperate', 'complex')),
    );
    const ambientLeak = withLegacyEpoch(
      4,
      () => structuredClone(planetSpecies(planet, null, 'temperate', 'complex')),
    );
    expect(explicit).toEqual(correct);
    expect(ambientLeak).not.toEqual(correct);

    const changedRow = structuredClone(explicit);
    changedRow[0]!.seed = (changedRow[0]!.seed + 1) >>> 0;
    expect(changedRow).not.toEqual(correct);
  });

  it('accepts only the shared bounded integer epoch range without coercion', () => {
    expect(MAX_ECOLOGY_EPOCH).toBe(10_000);
    expect(checkedEcologyEpoch(0)).toBe(0);
    expect(checkedEcologyEpoch(MAX_ECOLOGY_EPOCH)).toBe(MAX_ECOLOGY_EPOCH);
    for (const invalid of [-1, MAX_ECOLOGY_EPOCH + 1, 1.5, NaN, Infinity, '1', null, undefined]) {
      expect(() => checkedEcologyEpoch(invalid), String(invalid)).toThrow(
        'ecology epoch must be an integer from 0 through 10000',
      );
      expect(() => planetSpeciesAtEcologyEpoch(
        { seed: 133 },
        null,
        'temperate',
        2,
        invalid as never,
      ), String(invalid)).toThrow('ecology epoch must be an integer from 0 through 10000');
    }
  });

  it('neither reads nor writes a reflected ambient epoch', () => {
    const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_KEY);
    let reads = 0;
    let writes = 0;
    if (!Reflect.defineProperty(globalThis, AMBIENT_KEY, {
      configurable: true,
      enumerable: false,
      get: () => { reads++; throw new Error('ambient epoch read'); },
      set: () => { writes++; throw new Error('ambient epoch write'); },
    })) throw new Error('could not install ambient-epoch tripwire');
    try {
      const roster = planetSpeciesAtEcologyEpoch(
        { seed: 0x5100_1001 },
        null,
        'temperate',
        'complex',
        3,
      );
      expect(roster.length).toBeGreaterThan(0);
      expect(reads).toBe(0);
      expect(writes).toBe(0);
    } finally {
      if (previous) Reflect.defineProperty(globalThis, AMBIENT_KEY, previous);
      else Reflect.deleteProperty(globalThis, AMBIENT_KEY);
    }
  });
});
