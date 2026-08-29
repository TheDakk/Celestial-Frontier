/* Canonical world/star opportunity snapshots.

   A seed is generator input, not identity. Public projection accepts only a
   production-registered CF1 scene address and carries that exact address/key
   through the result. Structural clones consequently cannot become authority.
 */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { biosphere } from '@cf/domain-ecology';
import { displayRarity, rarityRoll } from '@cf/domain-speciestraits';
import { starClass } from '@cf/domain-starcatalog';
import { biomeFor, gradeCapAt, regionAt } from '@cf/domain-strays';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type CF1StarKey,
  type CF1WorldKey,
} from '@cf/scene';

export const WORLD_OPPORTUNITY_SCHEMA = 'cf-v2-world-opportunity/v3' as const;
export const STAR_OPPORTUNITY_SCHEMA = 'cf-v2-star-opportunity/v2' as const;

export type EngineeringRawTier =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type EngineeringDisplayTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface EngineeringDisplayRarity {
  readonly tier: EngineeringDisplayTier;
  readonly id: string;
  readonly name: string;
  readonly hex: string;
}

export const DEPOSIT_PROFILES = Object.freeze({
  rocky: Object.freeze(['Fe', 'Si', 'Mg', 'Al', 'Ni', 'Ti', 'Cu', 'Cr', 'Mn', 'Ca']),
  metal: Object.freeze(['Fe', 'Ni', 'Cu', 'Ag', 'Au', 'Pt', 'Ir', 'W', 'Co', 'Zn']),
  lava: Object.freeze(['S', 'Fe', 'W', 'Ti', 'U', 'Th', 'Cr', 'Mn']),
  ice: Object.freeze(['H2O', 'CH4', 'NH3', 'CO2', 'He3', 'N', 'O']),
  desert: Object.freeze(['Si', 'Fe', 'Al', 'Na', 'Cl', 'Li', 'Sn', 'Ca']),
  gas: Object.freeze(['H', 'He', 'CH4', 'NH3', 'He3']),
  venus: Object.freeze(['S', 'CO2', 'Cl', 'P', 'Pb', 'Zn']),
  dwarf: Object.freeze(['Si', 'Ni', 'Fe', 'C', 'H2O', 'Sn']),
  moon: Object.freeze(['Si', 'Al', 'Ti', 'Fe', 'He3', 'Mg']),
} as const);

export type DepositProfileKey = keyof typeof DEPOSIT_PROFILES;
export type MaterialSymbol = string;

export const RARE_VEIN = Object.freeze([
  'Ag', 'Au', 'Pt', 'Ir', 'U', 'Nd', 'Pm', 'Vg', 'Pz',
] as const);

export const BIOME_VEIN = Object.freeze({
  geode: 'Nd',
  carbon: 'Pm',
  glass: 'Vg',
  magmasea: 'Pz',
} as const);

const COSMIC_FOUND = Object.freeze(['Pro', 'Pri'] as const);
const COSMIC_BREAK = Object.freeze(['Voe', 'Chr', 'Dkm'] as const);
const STELLAR_YIELD: Readonly<Record<string, 'Pls' | 'Crn'>> = Object.freeze({
  B: 'Pls',
  A: 'Pls',
  G: 'Pls',
  RG: 'Pls',
  SG: 'Pls',
  WD: 'Crn',
  NS: 'Crn',
  MAG: 'Crn',
  BH: 'Crn',
});
const REMNANT_KINDS = new Set(['WD', 'NS', 'MAG', 'BH']);

export interface WorldOpportunitySourceFacts {
  readonly planetSeed: number;
  readonly planetType: string;
  readonly orbitalDistance: number;
  readonly climateBand: string;
  readonly biosphereKey: string;
  readonly biosphereLevel: string;
  readonly biomeKey: string | null;
}

export interface WorldOpportunitySnapshot {
  readonly schema: typeof WORLD_OPPORTUNITY_SCHEMA;
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly source: WorldOpportunitySourceFacts;
  /** Unfolded legacy designation score. Values 10..14 stay distinct. */
  readonly rawTier: EngineeringRawTier;
  /** Legacy designation score after its canonical region/ring cap. */
  readonly effectiveTier: EngineeringRawTier;
  /** Player-facing rarity is a separate 0..9 projection of effectiveTier. */
  readonly displayRarity: EngineeringDisplayRarity;
  readonly depositProfile: DepositProfileKey;
  readonly deposits: readonly MaterialSymbol[];
  readonly biomeVein: MaterialSymbol | null;
  readonly cosmicVein: MaterialSymbol | null;
  readonly exceptionalVein: MaterialSymbol | null;
  readonly reservePulls: number;
}

export interface StarOpportunitySourceFacts {
  readonly starSeed: number;
  readonly starKind: string;
}

export interface StarOpportunitySnapshot {
  readonly schema: typeof STAR_OPPORTUNITY_SCHEMA;
  readonly key: CF1StarKey;
  readonly address: CanonicalCF1StarAddress;
  readonly source: StarOpportunitySourceFacts;
  readonly rawTier: EngineeringRawTier;
  readonly displayRarity: EngineeringDisplayRarity;
  readonly material: 'Pls' | 'Crn' | null;
  readonly baseReservePasses: number;
  readonly remnantHazard: boolean;
  readonly requiresJumpDrive: true;
}

const WORLD_SNAPSHOTS = new WeakSet<object>();
const STAR_SNAPSHOTS = new WeakSet<object>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkedWorldAddress(value: unknown): CanonicalCF1WorldAddress {
  if (!isCanonicalCF1Address(value) || !('planet' in value)) {
    throw new TypeError('world opportunity requires a registered canonical CF1 world address');
  }
  return value;
}

function checkedStarAddress(value: unknown): CanonicalCF1StarAddress {
  if (!isCanonicalCF1Address(value) || !('star' in value) || 'planet' in value) {
    throw new TypeError('star opportunity requires a registered canonical CF1 star address');
  }
  return value;
}

function asRawTier(value: number): EngineeringRawTier {
  if (!Number.isInteger(value) || value < 0 || value > 14) {
    throw new RangeError('engineering raw tier must be an integer from 0 through 14');
  }
  return value as EngineeringRawTier;
}

function frozenDisplayRarity(rawTier: EngineeringRawTier): EngineeringDisplayRarity {
  const display = displayRarity(rawTier);
  if (!Number.isInteger(display.t) || display.t < 0 || display.t > 9) {
    throw new Error('source display rarity is outside the supported 0..9 range');
  }
  return Object.freeze({
    tier: display.t as EngineeringDisplayTier,
    id: display.id,
    name: display.name,
    hex: display.hex,
  });
}

function profileFor(planetType: string): DepositProfileKey {
  return Object.prototype.hasOwnProperty.call(DEPOSIT_PROFILES, planetType)
    ? planetType as DepositProfileKey
    : 'rocky';
}

/* Exact v1.8.9 `depositsFor` body: main.js:18814-18831 (source pin).
   Kept private so no public seed-only authority escapes this package. */
function depositsFor(seed: number, planetType: string, tier: EngineeringRawTier): readonly MaterialSymbol[] {
  const pool: string[] = [...DEPOSIT_PROFILES[profileFor(planetType)]];
  const random = mulberry32(hashInt(seed >>> 0, 0xE1E, 9) >>> 0);
  const count = 3 + ((random() * 3) | 0);
  const picks: string[] = [];
  for (let index = 0; index < count && pool.length; index++) {
    picks.push(pool.splice((random() * pool.length) | 0, 1)[0]!);
  }
  if (random() < 0.10 + tier * 0.05) {
    const rare = RARE_VEIN[Math.min(RARE_VEIN.length - 1, (random() * (1 + tier)) | 0)]!;
    if (!picks.includes(rare)) picks.push(rare);
  }
  return Object.freeze(picks);
}

/* Exact v1.8.9 reserve formula: main.js:18949-18953 (source pin). */
function reserveFor(seed: number, tier: EngineeringRawTier): number {
  const random = mulberry32(hashInt(seed >>> 0, 0x2E5, 3) >>> 0);
  return Math.round((420 + ((random() * 380) | 0)) * (1 + tier * 0.35));
}

/* Exact v1.8.9 world-cosmic vein formula: main.js:18850-18861. */
function cosmicVeinFor(seed: number, tier: EngineeringRawTier): MaterialSymbol | null {
  if (tier < 8) return null;
  const random = mulberry32(hashInt(seed >>> 0, 0xC05, 7) >>> 0);
  if (random() >= 0.18 + Math.min(0.22, (tier - 8) * 0.05)) return null;
  const pool: readonly MaterialSymbol[] = tier >= 9
    ? [...COSMIC_FOUND, ...COSMIC_BREAK]
    : COSMIC_FOUND;
  return pool[(random() * pool.length) | 0]!;
}

/* Exact v1.8.9 exceptional-vein formula: main.js:18874-18880. */
function exceptionalVeinFor(
  seed: number,
  planetType: string,
  tier: EngineeringRawTier,
): MaterialSymbol | null {
  const random = mulberry32(hashInt(seed >>> 0, 0xE8C, 5) >>> 0);
  if (random() >= 0.15) return null;
  const deposits = depositsFor(seed, planetType, tier);
  return deposits.length === 0 ? null : deposits[(random() * deposits.length) | 0]!;
}

/* Exact v1.8.9 stellar reserve formula: main.js:18898 (source pin). */
function skimReserveFor(seed: number): number {
  const random = mulberry32(hashInt(seed >>> 0, 0x5C1, 4) >>> 0);
  return 24 + ((random() * 24) | 0);
}

function worldSourceFacts(address: CanonicalCF1WorldAddress): WorldOpportunitySourceFacts {
  const system = systemFor(address.star.seed);
  const planetEntry = system.planets[address.planet.ordinal];
  if (!planetEntry || planetEntry.P.seed !== address.planet.seed) {
    throw new Error('canonical world address no longer matches its source system');
  }
  const planet = planetEntry.P as { seed: number; type?: string; [key: string]: unknown };
  const planetType = typeof planet.type === 'string' && planet.type.length > 0
    ? planet.type
    : 'rocky';
  const band = climateBand(planet, system, planetEntry.orb);
  const random = mulberry32((address.planet.seed ^ 0x1234567) >>> 0);
  const bio = biosphere(planet, system as { sol?: boolean }, band, random);
  const biome = biomeFor(planet, band);
  const biomeKey = isRecord(biome) && typeof biome.k === 'string' ? biome.k : null;
  return Object.freeze({
    planetSeed: address.planet.seed,
    planetType,
    orbitalDistance: planetEntry.orb,
    climateBand: band,
    biosphereKey: bio.key,
    biosphereLevel: bio.level,
    biomeKey,
  });
}

function worldRawTier(address: CanonicalCF1WorldAddress, source: WorldOpportunitySourceFacts): EngineeringRawTier {
  if (isCanonicalEarthWorldAddress(address)) return 5;
  const lifey = /Abundant|Aquatic|flora|Sparse/i.test(source.biosphereLevel);
  const lifeBoost = /Abundant/i.test(source.biosphereLevel) ? 2 : (lifey ? 1 : 0);
  const depthBoost = Math.floor(regionAt(address.galaxy.x, address.galaxy.y) / 2);
  return asRawTier(Math.min(14, rarityRoll(source.planetSeed, 3) + lifeBoost + depthBoost));
}

function worldEffectiveTier(
  address: CanonicalCF1WorldAddress,
  rawTier: EngineeringRawTier,
): EngineeringRawTier {
  const cap = gradeCapAt({ gal: address.galaxy, star: address.star });
  if (!Number.isInteger(cap) || cap < 0 || cap > 14) {
    throw new Error('legacy designation ring returned an invalid tier cap');
  }
  return asRawTier(Math.min(rawTier, cap));
}

/** Exact Earth identity. A foreign canonical world whose leaf seed happens to
 * be 133 is not the Sol cradle and must not inherit Earth-only policy. */
export function isCanonicalEarthWorldAddress(
  value: unknown,
): boolean {
  return isCanonicalCF1Address(value)
    && 'planet' in value
    && value.galaxy.seed === 999
    && value.galaxy.x === 90
    && value.galaxy.y === -60
    && value.star.seed === 424242
    && value.star.x === 560
    && value.star.y === 170
    && value.planet.seed === 133
    && value.planet.ordinal === 2;
}

function starRawTier(starSeed: number, kind: string): EngineeringRawTier {
  if (starSeed === 424242) return 3;
  const boost = kind === 'BH' || kind === 'MAG' || kind === 'SG'
    ? 2
    : (kind === 'NS' || kind === 'WD' ? 1 : 0);
  return asRawTier(Math.min(14, rarityRoll(starSeed, 5) + boost));
}

/** Build a detached, frozen snapshot from source facts behind a trusted world address. */
export function projectWorldOpportunity(addressValue: CanonicalCF1WorldAddress): WorldOpportunitySnapshot {
  const address = checkedWorldAddress(addressValue);
  const source = worldSourceFacts(address);
  const rawTier = worldRawTier(address, source);
  const effectiveTier = worldEffectiveTier(address, rawTier);
  const biomeVein = source.biomeKey !== null
    && Object.prototype.hasOwnProperty.call(BIOME_VEIN, source.biomeKey)
    ? BIOME_VEIN[source.biomeKey as keyof typeof BIOME_VEIN]
    : null;
  const snapshot: WorldOpportunitySnapshot = Object.freeze({
    schema: WORLD_OPPORTUNITY_SCHEMA,
    key: address.key,
    address,
    source,
    rawTier,
    effectiveTier,
    displayRarity: frozenDisplayRarity(effectiveTier),
    depositProfile: profileFor(source.planetType),
    deposits: depositsFor(source.planetSeed, source.planetType, effectiveTier),
    biomeVein,
    cosmicVein: cosmicVeinFor(source.planetSeed, effectiveTier),
    exceptionalVein: exceptionalVeinFor(source.planetSeed, source.planetType, effectiveTier),
    reservePulls: reserveFor(source.planetSeed, effectiveTier),
  });
  WORLD_SNAPSHOTS.add(snapshot);
  return snapshot;
}

/** Build a detached, frozen snapshot from source facts behind a trusted star address. */
export function projectStarOpportunity(addressValue: CanonicalCF1StarAddress): StarOpportunitySnapshot {
  const address = checkedStarAddress(addressValue);
  const starSeed = address.star.seed;
  const kind = starClass(starSeed).kind;
  const rawTier = starRawTier(starSeed, kind);
  const source = Object.freeze({ starSeed, starKind: kind });
  const snapshot: StarOpportunitySnapshot = Object.freeze({
    schema: STAR_OPPORTUNITY_SCHEMA,
    key: address.key,
    address,
    source,
    rawTier,
    displayRarity: frozenDisplayRarity(rawTier),
    material: STELLAR_YIELD[kind] ?? null,
    baseReservePasses: skimReserveFor(starSeed),
    remnantHazard: REMNANT_KINDS.has(kind),
    requiresJumpDrive: true,
  });
  STAR_SNAPSHOTS.add(snapshot);
  return snapshot;
}

export function isWorldOpportunitySnapshot(value: unknown): value is WorldOpportunitySnapshot {
  return typeof value === 'object'
    && value !== null
    && WORLD_SNAPSHOTS.has(value)
    && (value as WorldOpportunitySnapshot).schema === WORLD_OPPORTUNITY_SCHEMA
    && getCanonicalCF1AddressKey((value as WorldOpportunitySnapshot).address)
      === (value as WorldOpportunitySnapshot).key;
}

export function isStarOpportunitySnapshot(value: unknown): value is StarOpportunitySnapshot {
  return typeof value === 'object'
    && value !== null
    && STAR_SNAPSHOTS.has(value)
    && (value as StarOpportunitySnapshot).schema === STAR_OPPORTUNITY_SCHEMA
    && getCanonicalCF1AddressKey((value as StarOpportunitySnapshot).address)
      === (value as StarOpportunitySnapshot).key;
}
