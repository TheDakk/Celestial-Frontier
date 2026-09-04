/* Dependency-neutral canonical biome-presentation authority. The authored
   values mirror the live v1.8.9 BIOME_PROFILES table exactly. Visual,
   ecological, and audio adapters consume this versioned/digested identity;
   biome selection and gameplay generation remain outside this package. */

export const BIOME_PROFILE_SCHEMA_V1 = 'cf.domain.biome-profile.v1' as const;

export const BIOME_PROFILE_KEYS_V1 = Object.freeze([
  'temperate', 'savanna', 'jungle', 'marsh', 'swamp', 'mangrove', 'tundra',
  'karst', 'saltflat', 'fungal', 'crystalsteppe',
  'opensea', 'archipelago', 'coral', 'stormsea', 'volcisle', 'abyssal', 'milksea',
  'glacier', 'packice', 'cryogeyser', 'blueice',
  'dunesea', 'canyon', 'saltpan', 'oxide', 'glass',
  'cratered', 'boulder', 'graben', 'geode', 'carbon',
  'sulfurdeck', 'acidhaze', 'abyssgreen',
  'ashwaste', 'emberfield', 'obsidian', 'magmasea',
  'banded', 'ammonia', 'stormeye', 'hotglow',
] as const);

export type BiomeProfileKeyV1 = typeof BIOME_PROFILE_KEYS_V1[number];
export type BiomeProfileFaunaFamilyV1 =
  | 'mammal' | 'bird' | 'insect' | 'amphibian' | 'primate' | 'reptile'
  | 'fish' | 'crust' | 'arachnid' | 'gastropod' | 'marine' | 'jelly'
  | 'ceph' | 'sessile';
export type BiomeProfileFloraFamilyV1 =
  | 'tree' | 'shrub' | 'flower' | 'grass' | 'fern' | 'vine' | 'palm'
  | 'moss' | 'cactus' | 'herb' | 'seaweed';
export type BiomeProfileHazardV1 =
  | 'drought' | 'mire' | 'cold' | 'sinkhole' | 'salt-glare' | 'spore'
  | 'shard' | 'storm' | 'ashfall' | 'pressure' | 'cryo-jet' | 'crevasse'
  | 'sandstorm' | 'flash-flood' | 'dust-devil' | 'glass-shard' | 'meteor'
  | 'rockfall' | 'fault' | 'soot' | 'acid' | 'heat' | 'ember' | 'magma'
  | 'megastorm';
export type BiomeProfileWeatherV1 =
  | 'mild' | 'dry-heat' | 'humid' | 'mist' | 'wind-cold' | 'still' | 'wind'
  | 'swell' | 'trade-wind' | 'calm' | 'squall' | 'lightless' | 'glow-calm'
  | 'steam-cold' | 'still-cold' | 'dry' | 'mirage-heat' | 'airless'
  | 'sulfur-storm' | 'acid-haze' | 'greenhouse' | 'ash' | 'ember-wind'
  | 'still-heat' | 'heat-shimmer' | 'band-wind' | 'pastel-cloud'
  | 'cyclone' | 'ember-cloud';

export interface BiomeProfileV1 {
  readonly sig: `#${string}`;
  readonly fauna: readonly BiomeProfileFaunaFamilyV1[];
  readonly flora: readonly BiomeProfileFloraFamilyV1[];
  readonly hazard: BiomeProfileHazardV1 | null;
  readonly weather: BiomeProfileWeatherV1;
}

export type BiomeProfileDigestV1 = `bpd1-${string}`;

export interface BiomeProfileAuthorityV1 {
  readonly schema: typeof BIOME_PROFILE_SCHEMA_V1;
  readonly digest: BiomeProfileDigestV1;
  readonly keys: readonly BiomeProfileKeyV1[];
  readonly profiles: Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>>;
}

const FAUNA = Object.freeze([
  'mammal', 'bird', 'insect', 'amphibian', 'primate', 'reptile', 'fish',
  'crust', 'arachnid', 'gastropod', 'marine', 'jelly', 'ceph', 'sessile',
] as const);
const FLORA = Object.freeze([
  'tree', 'shrub', 'flower', 'grass', 'fern', 'vine', 'palm', 'moss',
  'cactus', 'herb', 'seaweed',
] as const);
const HAZARDS = Object.freeze([
  'drought', 'mire', 'cold', 'sinkhole', 'salt-glare', 'spore', 'shard',
  'storm', 'ashfall', 'pressure', 'cryo-jet', 'crevasse', 'sandstorm',
  'flash-flood', 'dust-devil', 'glass-shard', 'meteor', 'rockfall', 'fault',
  'soot', 'acid', 'heat', 'ember', 'magma', 'megastorm',
] as const);
const WEATHER = Object.freeze([
  'mild', 'dry-heat', 'humid', 'mist', 'wind-cold', 'still', 'wind', 'swell',
  'trade-wind', 'calm', 'squall', 'lightless', 'glow-calm', 'steam-cold',
  'still-cold', 'dry', 'mirage-heat', 'airless', 'sulfur-storm', 'acid-haze',
  'greenhouse', 'ash', 'ember-wind', 'still-heat', 'heat-shimmer', 'band-wind',
  'pastel-cloud', 'cyclone', 'ember-cloud',
] as const);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new TypeError(`biome profile: invalid ${label}`);
  }
  return value as T;
}

function checkedProfile(value: unknown, key: string): BiomeProfileV1 {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`biome profile: ${key} is not a profile object`);
  }
  const source = value as Record<string, unknown>;
  const fields = Object.keys(source).sort();
  if (JSON.stringify(fields) !== JSON.stringify(['fauna', 'flora', 'hazard', 'sig', 'weather'])) {
    throw new TypeError(`biome profile: ${key} has the wrong fields`);
  }
  if (typeof source.sig !== 'string' || !/^#[0-9a-f]{6}$/u.test(source.sig)) {
    throw new TypeError(`biome profile: ${key} has an invalid signature color`);
  }
  if (!Array.isArray(source.fauna) || !Array.isArray(source.flora)) {
    throw new TypeError(`biome profile: ${key} families are not arrays`);
  }
  const hazard = source.hazard === null ? null : oneOf(source.hazard, HAZARDS, `${key} hazard`);
  return deepFreeze({
    sig: source.sig as `#${string}`,
    fauna: source.fauna.map((family) => oneOf(family, FAUNA, `${key} fauna`)),
    flora: source.flora.map((family) => oneOf(family, FLORA, `${key} flora`)),
    hazard,
    weather: oneOf(source.weather, WEATHER, `${key} weather`),
  });
}

/** Build a canonical exact-set authority. Input order cannot affect output;
 * duplicate, missing, and unknown biome identities are rejected separately. */
export function createBiomeProfileSetV1(
  entries: readonly (readonly [string, unknown])[],
): Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>> {
  const expected = new Set<string>(BIOME_PROFILE_KEYS_V1);
  const supplied = new Map<string, BiomeProfileV1>();
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') {
      throw new TypeError('biome profile: malformed authority entry');
    }
    const [key, value] = entry;
    if (!expected.has(key)) throw new TypeError(`biome profile: unexpected key ${key}`);
    if (supplied.has(key)) throw new TypeError(`biome profile: duplicate key ${key}`);
    supplied.set(key, checkedProfile(value, key));
  }
  const missing = BIOME_PROFILE_KEYS_V1.filter((key) => !supplied.has(key));
  if (missing.length > 0) throw new TypeError(`biome profile: missing keys ${missing.join(',')}`);
  const authority = Object.fromEntries(BIOME_PROFILE_KEYS_V1.map((key) => [key, supplied.get(key)!]));
  return deepFreeze(authority) as Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>>;
}

const AUTHORED_BIOME_PROFILE_ENTRIES_V1 = [
  ['temperate', { sig: '#6f9a52', fauna: ['mammal', 'bird', 'insect', 'amphibian'], flora: ['tree', 'shrub', 'flower', 'grass', 'fern'], hazard: null, weather: 'mild' }],
  ['savanna', { sig: '#c9a24a', fauna: ['mammal', 'bird', 'insect'], flora: ['grass', 'tree', 'shrub'], hazard: 'drought', weather: 'dry-heat' }],
  ['jungle', { sig: '#2f7d4f', fauna: ['primate', 'bird', 'reptile', 'insect', 'amphibian'], flora: ['tree', 'vine', 'fern', 'flower', 'palm'], hazard: null, weather: 'humid' }],
  ['marsh', { sig: '#7f8a45', fauna: ['bird', 'amphibian', 'insect', 'fish'], flora: ['grass', 'herb', 'flower'], hazard: 'mire', weather: 'mist' }],
  ['swamp', { sig: '#4a5940', fauna: ['reptile', 'amphibian', 'insect', 'fish'], flora: ['tree', 'moss', 'vine'], hazard: 'mire', weather: 'mist' }],
  ['mangrove', { sig: '#5c7a4a', fauna: ['crust', 'fish', 'bird', 'reptile'], flora: ['tree', 'palm', 'grass'], hazard: null, weather: 'humid' }],
  ['tundra', { sig: '#9fb0a0', fauna: ['mammal', 'bird'], flora: ['moss', 'shrub', 'grass'], hazard: 'cold', weather: 'wind-cold' }],
  ['karst', { sig: '#b8b0a0', fauna: ['mammal', 'arachnid', 'insect'], flora: ['fern', 'moss', 'shrub'], hazard: 'sinkhole', weather: 'mild' }],
  ['saltflat', { sig: '#e8e6dc', fauna: ['insect', 'arachnid', 'bird'], flora: ['cactus', 'herb'], hazard: 'salt-glare', weather: 'dry-heat' }],
  ['fungal', { sig: '#9a6fb0', fauna: ['insect', 'gastropod', 'amphibian'], flora: ['moss', 'fern'], hazard: 'spore', weather: 'still' }],
  ['crystalsteppe', { sig: '#7fb0c0', fauna: ['insect', 'arachnid', 'mammal'], flora: ['grass', 'cactus'], hazard: 'shard', weather: 'wind' }],
  ['opensea', { sig: '#2a5a8a', fauna: ['fish', 'marine', 'jelly', 'ceph'], flora: ['seaweed'], hazard: null, weather: 'swell' }],
  ['archipelago', { sig: '#3a8a80', fauna: ['bird', 'crust', 'fish', 'reptile'], flora: ['palm', 'tree', 'grass'], hazard: null, weather: 'trade-wind' }],
  ['coral', { sig: '#40c0b0', fauna: ['fish', 'sessile', 'crust', 'ceph', 'gastropod'], flora: ['seaweed'], hazard: null, weather: 'calm' }],
  ['stormsea', { sig: '#4a5a70', fauna: ['fish', 'marine', 'bird'], flora: ['seaweed'], hazard: 'storm', weather: 'squall' }],
  ['volcisle', { sig: '#2a6a6a', fauna: ['crust', 'fish', 'bird'], flora: ['palm', 'fern'], hazard: 'ashfall', weather: 'humid' }],
  ['abyssal', { sig: '#16283e', fauna: ['fish', 'ceph', 'jelly', 'sessile'], flora: [], hazard: 'pressure', weather: 'lightless' }],
  ['milksea', { sig: '#a0d0d0', fauna: ['jelly', 'ceph', 'fish'], flora: ['seaweed'], hazard: null, weather: 'glow-calm' }],
  ['glacier', { sig: '#cfe0ea', fauna: ['marine', 'bird', 'mammal'], flora: ['moss'], hazard: 'cold', weather: 'wind-cold' }],
  ['packice', { sig: '#a0b8c8', fauna: ['marine', 'bird', 'fish'], flora: [], hazard: 'cold', weather: 'wind-cold' }],
  ['cryogeyser', { sig: '#b0d0d8', fauna: ['crust', 'fish'], flora: ['moss'], hazard: 'cryo-jet', weather: 'steam-cold' }],
  ['blueice', { sig: '#6fa8d0', fauna: ['marine', 'fish'], flora: [], hazard: 'crevasse', weather: 'still-cold' }],
  ['dunesea', { sig: '#d8b878', fauna: ['reptile', 'arachnid', 'insect', 'mammal'], flora: ['cactus', 'shrub'], hazard: 'sandstorm', weather: 'dry-heat' }],
  ['canyon', { sig: '#b06a48', fauna: ['reptile', 'bird', 'mammal'], flora: ['shrub', 'cactus'], hazard: 'flash-flood', weather: 'dry' }],
  ['saltpan', { sig: '#ded8c8', fauna: ['insect', 'bird'], flora: ['herb'], hazard: 'salt-glare', weather: 'mirage-heat' }],
  ['oxide', { sig: '#b0603a', fauna: ['arachnid', 'insect', 'reptile'], flora: ['cactus'], hazard: 'dust-devil', weather: 'dry' }],
  ['glass', { sig: '#c8b0a0', fauna: ['arachnid', 'insect'], flora: [], hazard: 'glass-shard', weather: 'dry-heat' }],
  ['cratered', { sig: '#9a9a94', fauna: ['arachnid', 'insect'], flora: ['moss'], hazard: 'meteor', weather: 'airless' }],
  ['boulder', { sig: '#a8a090', fauna: ['reptile', 'arachnid', 'mammal'], flora: ['moss', 'shrub'], hazard: 'rockfall', weather: 'dry' }],
  ['graben', { sig: '#78787a', fauna: ['arachnid', 'reptile'], flora: ['moss'], hazard: 'fault', weather: 'still' }],
  ['geode', { sig: '#9a6fc0', fauna: ['insect', 'arachnid'], flora: [], hazard: 'shard', weather: 'still' }],
  ['carbon', { sig: '#2a2a2e', fauna: ['arachnid', 'insect'], flora: [], hazard: 'soot', weather: 'still' }],
  ['sulfurdeck', { sig: '#b0a040', fauna: ['insect'], flora: [], hazard: 'acid', weather: 'sulfur-storm' }],
  ['acidhaze', { sig: '#b8a850', fauna: [], flora: [], hazard: 'acid', weather: 'acid-haze' }],
  ['abyssgreen', { sig: '#6a6030', fauna: [], flora: [], hazard: 'heat', weather: 'greenhouse' }],
  ['ashwaste', { sig: '#7a7570', fauna: ['arachnid', 'insect'], flora: [], hazard: 'ashfall', weather: 'ash' }],
  ['emberfield', { sig: '#c05028', fauna: ['insect'], flora: [], hazard: 'ember', weather: 'ember-wind' }],
  ['obsidian', { sig: '#2a2428', fauna: ['arachnid'], flora: [], hazard: 'glass-shard', weather: 'still-heat' }],
  ['magmasea', { sig: '#e06020', fauna: [], flora: [], hazard: 'magma', weather: 'heat-shimmer' }],
  ['banded', { sig: '#c8b090', fauna: ['jelly', 'ceph'], flora: [], hazard: 'storm', weather: 'band-wind' }],
  ['ammonia', { sig: '#d0c8d8', fauna: ['jelly'], flora: [], hazard: 'cold', weather: 'pastel-cloud' }],
  ['stormeye', { sig: '#a0604a', fauna: ['jelly', 'ceph'], flora: [], hazard: 'megastorm', weather: 'cyclone' }],
  ['hotglow', { sig: '#b04030', fauna: [], flora: [], hazard: 'heat', weather: 'ember-cloud' }],
] as const;

const DIGEST_SEEDS = Object.freeze([
  0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35,
] as const);

function hashContent32(source: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

function canonicalProfileContent(
  profiles: Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>>,
): string {
  return JSON.stringify([
    BIOME_PROFILE_SCHEMA_V1,
    ...BIOME_PROFILE_KEYS_V1.map((key) => {
      const profile = profiles[key];
      return [key, profile.sig, profile.fauna, profile.flora, profile.hazard, profile.weather];
    }),
  ]);
}

function digestCanonicalProfiles(
  profiles: Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>>,
): BiomeProfileDigestV1 {
  const source = canonicalProfileContent(profiles);
  const hex = DIGEST_SEEDS
    .map((seed) => hashContent32(source, seed).toString(16).padStart(8, '0'))
    .join('');
  return `bpd1-${hex}`;
}

/** Compute the digest only after canonical exact-set validation. */
export function biomeProfileDigestV1(
  profiles: Readonly<Record<BiomeProfileKeyV1, BiomeProfileV1>>,
): BiomeProfileDigestV1 {
  const canonical = createBiomeProfileSetV1(Object.entries(profiles));
  return digestCanonicalProfiles(canonical);
}

/** Build a detached, recursively frozen authority whose digest binds schema,
 * key order, and every profile field. Input entry order is not identity. */
export function createBiomeProfileAuthorityV1(
  entries: readonly (readonly [string, unknown])[],
): BiomeProfileAuthorityV1 {
  const profiles = createBiomeProfileSetV1(entries);
  return deepFreeze({
    schema: BIOME_PROFILE_SCHEMA_V1,
    digest: digestCanonicalProfiles(profiles),
    keys: BIOME_PROFILE_KEYS_V1,
    profiles,
  });
}

export const BIOME_PROFILE_AUTHORITY_V1 = createBiomeProfileAuthorityV1(
  AUTHORED_BIOME_PROFILE_ENTRIES_V1,
);

export const BIOME_PROFILES_V1 = BIOME_PROFILE_AUTHORITY_V1.profiles;
