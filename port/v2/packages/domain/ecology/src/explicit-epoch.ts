/* Hand-owned explicit-epoch ecology boundary.

   The auto-lifted v1.8.9 body remains the historical parity oracle, but its
   free global clock is not action authority. This owner preserves the exact
   roster formula and memo policy while requiring the caller to supply the
   bounded ecology epoch that selected the roster. */
import { makeGenome, type Genome } from '@cf/domain-genome';
import { crossGenome, evolveGenome } from '@cf/domain-genetics';
import { hashInt, mulberry32 } from '@cf/domain-rand';

export const MAX_ECOLOGY_EPOCH = 10_000;

export function checkedEcologyEpoch(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_ECOLOGY_EPOCH) {
    throw new RangeError(`ecology epoch must be an integer from 0 through ${MAX_ECOLOGY_EPOCH}`);
  }
  return value as number;
}

const speciesMemo = new Map<string, Genome[]>();

/** Exact v1.8.9 planet-species formula with one deliberate ownership repair:
 * the epoch is a required, validated argument instead of a free global read.
 * The memo remains identity-observable and uses the legacy 49-entry steady
 * state (`size > 48` before insertion), so callers must not mutate its rows. */
export function planetSpeciesAtEcologyEpoch(
  planet: { seed: number },
  system: unknown,
  band: string,
  level: string | number,
  ecologyEpoch: number,
): Genome[] {
  const epoch = checkedEcologyEpoch(ecologyEpoch);
  const memoKey = `${planet.seed}_${band}_${level}_${epoch}`;
  const memoized = speciesMemo.get(memoKey);
  if (memoized) return memoized;

  /* Retain the legacy signature and cache identity: `system` is deliberately
     not part of the formula or memo key. */
  void system;
  const random = mulberry32((planet.seed ^ 0xB105) >>> 0);
  const heat = band === 'hot' ? 2 : (band === 'frozen' || band === 'cold' ? 0 : 1);
  const baseAge = hashInt(planet.seed, 3, 9) % 5;
  const epochs = planet.seed === 133 ? 0 : baseAge + epoch;
  const list: Genome[] = [];
  let slot = 1;

  const add = (kingdom: string, speciesSlot: number): void => {
    list.push(evolveGenome(
      makeGenome(hashInt(planet.seed, kingdom.charCodeAt(0), speciesSlot * 131 + 7), kingdom, heat),
      epochs,
    ));
  };
  const rich = 0.55 + random() * 0.9;
  const probability = (value: number): number => Math.min(value * rich, 0.97);
  const many = (kingdom: string, base: number, extra: number, chance: number): void => {
    let count = base;
    for (let index = 0; index < extra; index++) if (random() < chance) count++;
    for (let index = 0; index < count; index++) add(kingdom, slot++);
  };

  if (level === 'complex') {
    many('flora', 3, 5, probability(0.62));
    many('fungi', 1, 3, probability(0.55));
    many('microbe', 2, 2, probability(0.5));
    many('fauna', 5, 7, probability(0.6));
  } else if (level === 'flora') {
    many('flora', 2, 4, probability(0.55));
    many('fungi', 1, 2, probability(0.45));
    many('microbe', 1, 2, probability(0.5));
  } else if (level === 'aquatic') {
    many('flora', 2, 3, probability(0.55));
    many('fauna', 4, 6, probability(0.6));
    many('microbe', 2, 2, probability(0.5));
  } else if (level === 'sparse') {
    many('flora', 1, 3, probability(0.5));
    many('fauna', 1, 4, probability(0.45));
    many('microbe', 1, 2, probability(0.5));
  } else if (level === 'microbial' || level === 'subsurface' || level === 'aerial') {
    many('microbe', 2, 4, probability(0.55));
    if (level === 'subsurface' && random() < 0.4 * rich) {
      many('fauna', 1, 2, probability(0.35));
    }
  } else if (level === 'xfauna') {
    many('fauna', 1, 1, probability(0.4));
    many('microbe', 2, 2, probability(0.55));
    for (const genome of list) if (genome.kingdom === 'fauna') genome.x = 1;
  }

  if (list.length >= 2 && rich > 1.0) {
    const hybridRandom = mulberry32((planet.seed ^ 0x471B) >>> 0);
    const hybridCount = (hashInt(planet.seed, 9, 4) % 100) < (rich - 1.0) * 60 ? 1 : 0;
    for (let index = 0; index < hybridCount; index++) {
      const left = list[(hybridRandom() * list.length) | 0]!;
      const right = list[(hybridRandom() * list.length) | 0]!;
      if (left !== right) {
        const wild = crossGenome(left, right);
        wild.wild = true as never;
        list.push(wild);
      }
    }
  }

  if (level === 'aquatic') {
    const aquaticRandom = mulberry32((planet.seed ^ 0xA0F10) >>> 0);
    const aquaticCount = 1 + (aquaticRandom() < 0.5 ? 1 : 0);
    for (let index = 0; index < aquaticCount; index++) {
      add('flora', 900 + index);
      list[list.length - 1]!.aq = 1;
    }
  } else if (level === 'aerial') {
    const aerialRandom = mulberry32((planet.seed ^ 0xA1F10) >>> 0);
    if (aerialRandom() < 0.35) {
      add('flora', 920);
      list[list.length - 1]!.af = 1;
    }
  }

  if (speciesMemo.size > 48) {
    const oldest = speciesMemo.keys().next().value as string;
    speciesMemo.delete(oldest);
  }
  speciesMemo.set(memoKey, list);
  return list;
}
