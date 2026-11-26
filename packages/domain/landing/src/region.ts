/* The region a landing touches down in (LEGACY celestial-frontier.html, v1.8.9):
   - a world's mix of regions, from its biome set, climate band and three seeded dials: `biomeComposition` 13294-13322;
   - Earth's own table of 14 regions: `_EARTH_LANDING` and `_earthLandingComp` 13330-13343;
   - the roll of one landing: `biomeForLanding` 13344-13356;
   - the salt that makes each landing view roll again: `_descSeq` and `_vistaSalt` 12974-12978, raised at 13507.

   The region is the view of a landing: its scenery and the residents met there. The world's anchor biome
   (`biomeFor` of @cf/domain-strays), which sets veins, odds and generation, is not changed by it.

   The arithmetic keeps the legacy game's order of operations, so the shares are the same numbers to the last bit.

   Four of the legacy game's lines are kept though today's biome sets never reach them, so no test holds them: the
   land cover of 90 when a region names none (13312; every region names one), the whole set when no region fits the
   band (13304; every type has a region for every band), the floor of 0.001 under a weight (13317), and a draw that
   lands exactly on a boundary (13354).
   Pure: no clock, no entropy. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { BIOME_SETS, biomeFor } from '@cf/domain-strays';

/** One region of a world type's biome set, as far as a landing reads it. The set's entries carry more fields. */
export interface BiomeSetEntry {
  /** The region's key, for example `temperate`. */
  readonly k: string;
  /** Its name, for example `Temperate world`. */
  readonly n: string;
  /** Its base weight in the set. */
  readonly w: number;
  /** Land cover in parts of 100; 90 when left out. */
  readonly land?: number;
  /** The climate bands it can occur in; any band when left out. */
  readonly bands?: readonly string[];
}

export interface LandingPlanet {
  readonly seed: number;
  readonly type: string;
  /** The world's ice cover, 0 to 1. Null or left out: 0.7 in a cold band, 0.2 otherwise. */
  readonly iceAmt?: number | null;
}

export interface BiomeShare {
  readonly biome: BiomeSetEntry;
  /** The share of landings, 0 to 1. */
  readonly pct: number;
}

/** Earth's seed (LEGACY 13283, 13350, 13513). */
export const EARTH_SEED = 133;

const SETS = BIOME_SETS as unknown as Readonly<Record<string, readonly BiomeSetEntry[]>>;

/** The world's regions as shares that sum to 1, largest first. Null when the type has no biome set. */
export function biomeComposition(planet: LandingPlanet, band: string): readonly BiomeShare[] | null {
  const set = SETS[planet.type];
  if (!set) return null;
  const bd = band === 'frozen' ? 'cold' : band;
  const cands = set.filter((b) => !b.bands || b.bands.includes(bd));
  const pool = cands.length ? cands : set;
  const r = mulberry32(hashInt(planet.seed, 0xC0FF, 3) >>> 0);
  const wet = 0.5 + r() * 1.4;      // the world's water bias
  const relief = 0.6 + r() * 0.8;   // its roughness
  const gamma = 0.65 + r() * 1.15;  // one dominant region, or many
  const ice = planet.iceAmt != null ? planet.iceAmt : (bd === 'cold' ? 0.7 : 0.2);
  let total = 0;
  const weighted = pool.map((b) => {
    let w = b.w;
    const landF = b.land != null ? b.land / 100 : 0.9;
    w *= (1 + (1 - landF) * wet * 2.2);                           // water regions rise on wet worlds
    if (b.bands && b.bands.includes('cold')) w *= (0.5 + ice * 1.5);
    if (b.bands && b.bands.includes('hot')) w *= (1.3 - ice * 0.7);
    w *= (0.8 + relief * 0.4);
    w = Math.pow(Math.max(w, 0.001), gamma);
    total += w;
    return { biome: b, w };
  });
  if (total <= 0) return pool.map((b) => ({ biome: b, pct: 1 / pool.length }));
  return weighted.map((x) => ({ biome: x.biome, pct: x.w / total })).sort((a, b) => b.pct - a.pct);
}

/** Earth's landing weights (LEGACY 13330-13333): about 71 parts water, 29 land. They sum to 99.5. */
const EARTH_LANDING: ReadonlyArray<readonly [string, number]> = [
  ['opensea', 58], ['coral', 4], ['archipelago', 5], ['stormsea', 3], ['volcisle', 1],
  ['temperate', 7], ['jungle', 4.5], ['savanna', 4.5], ['tundra', 4],
  ['saltflat', 2], ['karst', 2], ['marsh', 1.5], ['swamp', 1.5], ['mangrove', 1.5],
];

let earthComposition: readonly BiomeShare[] | null = null;

/** Earth's own table, in table order (not sorted): 14 regions, shares summing to 1. A key is looked up in the
    terran set first, then the ocean set; a key in neither is left out. Built once, as in the legacy game. */
export function earthLandingComposition(): readonly BiomeShare[] {
  if (earthComposition) return earthComposition;
  const byKey = new Map<string, BiomeSetEntry>();
  for (const b of SETS.terran ?? []) byKey.set(b.k, b);
  for (const b of SETS.ocean ?? []) if (!byKey.has(b.k)) byKey.set(b.k, b);
  let total = 0;
  const out: Array<{ biome: BiomeSetEntry; w: number }> = [];
  for (const [k, w] of EARTH_LANDING) {
    const biome = byKey.get(k);
    if (biome) { out.push({ biome, w }); total += w; }
  }
  earthComposition = out.map((x) => ({ biome: x.biome, pct: x.w / total }));
  return earthComposition;
}

/** The region of one landing: a draw weighted by the world's mix, seeded by the world and the salt. Earth
    (seed 133) draws from its own table; a world with no mix falls back to its anchor biome. */
export function biomeForLanding(planet: LandingPlanet, band: string, salt: number): BiomeSetEntry | null {
  const comp = planet.seed === EARTH_SEED ? earthLandingComposition() : biomeComposition(planet, band);
  if (!comp || !comp.length) return biomeFor(planet, band) as BiomeSetEntry | null;
  let v = mulberry32(hashInt(planet.seed, 0x1A2D, (salt | 0) + 1) >>> 0)();
  for (const c of comp) { v -= c.pct; if (v <= 0) return c.biome; }
  return comp[comp.length - 1]!.biome;
}

/** The salt of a landing view: epoch * 997 + landings + views * 131.
    `landings` is the expedition's count of worlds first landed on. `viewsThisSession` is raised once each time the
    landing view is composed, before the roll (13507), this time included. The legacy game composes it from two
    places: a real landing (13476), and the survey card's view button when no composed view is held (14253), so a
    look back at a world can roll a new region too; showing the held picture again (`reshowVista`, 14250) composes
    nothing and raises nothing. The count is not saved: after a reload the regions start again from the first view.
    One composition reads the one salt three times: for the region (13558), for the shuffle of the residents as
    salt + 7 (13571), and for the scene (13087). */
export function landingSalt(epoch: number, landings: number, viewsThisSession: number): number {
  return epoch * 997 + landings + viewsThisSession * 131;
}
