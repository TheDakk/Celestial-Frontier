/* The targeted cases of a world's tier, veins and reserve: every tier with every planet type, and seeds whose own
   rarity roll is each tier from 0 through 14, read at places of every depth and under every ring cap.
   The legacy game's answers are in fixtures/v1/recorded/census-veins.json (tools/census.mjs wrote it); the test and
   the recorder share this list of cases and this way of writing an answer, and nothing else. */
import { hashInt } from '@cf/domain-rand';

export const VEIN_TYPES = ['gas', 'rocky', 'desert', 'ice', 'terran', 'ocean', 'venus', 'lava'] as const;
export const VEIN_TIERS = 15;
export const GRID_SEEDS = 200;

/** The seeds of one cell of the grid: a tier and a planet type. */
export function gridSeeds(tier: number, type: string): number[] {
  const column = VEIN_TYPES.indexOf(type as (typeof VEIN_TYPES)[number]);
  return Array.from({ length: GRID_SEEDS }, (_, i) => hashInt(0x7E1D, tier * 8 + column, i));
}

export interface VeinPlace {
  readonly name: string;
  readonly gal: { readonly seed: number; readonly x: number; readonly y: number };
  readonly star: { readonly seed: number; readonly x: number; readonly y: number };
}

const away = (name: string, distance: number): VeinPlace =>
  ({ name, gal: { seed: 7001 + distance, x: 90 + distance, y: -60 }, star: { seed: 1, x: 0, y: 0 } });

/** One place under each ring cap and at each depth (LEGACY 14677-14695, 24409-24421): the Neighborhood and the
    rest of the home galaxy, then a galaxy inside each of the six regions. */
export const VEIN_PLACES: readonly VeinPlace[] = Object.freeze([
  { name: 'the Neighborhood', gal: { seed: 999, x: 90, y: -60 }, star: { seed: 1, x: 560, y: 170 } },
  { name: 'the home galaxy', gal: { seed: 999, x: 90, y: -60 }, star: { seed: 1, x: -600, y: 170 } },
  away('the Solar Reach', 400),
  away('the Local Cluster', 1200),
  away('the Near Field', 2400),
  away('the Deep Field', 3600),
  away('the Outer Dark', 4800),
  away('the Frontier', 7200),
]);

/** A life level for each boost the designation takes from life (LEGACY 5161): none, 1 and 2. */
export const VEIN_LIFE = Object.freeze(['No known life', 'Aquatic ecosystems', 'Abundant — flora and fauna'] as const);

export interface VeinAnswer {
  readonly rawTier: number;
  readonly tier: number;
  readonly deposits: readonly string[];
  readonly cosmicVein: string | null;
  readonly exceptionalVein: string | null;
  readonly reserve: number;
}

/** One answer as text. */
export function veinLine(seed: number, type: string, answer: VeinAnswer): string {
  return [seed, type, `${answer.rawTier}/${answer.tier}`, answer.deposits.join(','), answer.cosmicVein ?? '~', answer.exceptionalVein ?? '~', answer.reserve].join('|');
}

/** Counts what the answers hit: each tier, each rare-vein entry (a deposit its type's own list does not hold),
    each cosmic vein, each entry of each type's list. */
export class VeinHits {
  private readonly tables: Record<string, Record<string, number>> = {};

  private readonly profiles: Readonly<Record<string, readonly string[]>>;
  private readonly rareVein: readonly string[];

  constructor(profiles: Readonly<Record<string, readonly string[]>>, rareVein: readonly string[]) {
    this.profiles = profiles;
    this.rareVein = rareVein;
  }

  hit(table: string, entry: string): void {
    const counts = this.tables[table] ??= {};
    counts[entry] = (counts[entry] ?? 0) + 1;
  }

  answer(type: string, answer: VeinAnswer): void {
    this.hit('tier', String(answer.tier));
    this.hit('tier before the ring cap', String(answer.rawTier));
    this.hit('reserve at a tier', String(answer.tier));
    this.hit('exceptional vein', answer.exceptionalVein === null ? 'none' : 'held');
    this.hit('cosmic vein', answer.cosmicVein ?? 'none');
    if (answer.cosmicVein !== null) this.hit('cosmic vein at a tier', `tier ${answer.tier}: ${answer.cosmicVein}`);
    const own = this.profiles[type] ?? this.profiles.rocky!;
    for (const symbol of answer.deposits) {
      if (own.includes(symbol)) this.hit('deposit of a type', `${type}: ${symbol}`);
      else this.hit('rare vein', `${this.rareVein.indexOf(symbol)} ${symbol}`);
    }
  }

  hits(): Record<string, Record<string, number>> {
    const sorted = (counts: Record<string, number>): Record<string, number> =>
      Object.fromEntries(Object.keys(counts).sort().map((key) => [key, counts[key]!]));
    return Object.fromEntries(Object.keys(this.tables).sort().map((table) => [table, sorted(this.tables[table]!)]));
  }
}
