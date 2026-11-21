/* Pure distant-ecology seam. It accepts only an already-surfaced projection;
   roster generation, discovery, rewards, and save mutation remain outside the
   audio package. */
import {
  AUDIO_RESOLVER_VERSION,
  audioHash32,
  boundedAudioKey,
  deserializeAudioSignature,
  serializeAudioSignature,
  type AudioSignature,
  type CanonicalAudioOwner,
  type SerializedAudioSignature,
} from './identity.js';
import {
  AUDIO_PALETTE_POLICY,
  type AudioKingdom,
  type AudioPalettePolicy,
} from './taxonomy.js';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  BIOME_PROFILE_KEYS_V1,
  type BiomeProfileDigestV1,
  type BiomeProfileHazardV1,
  type BiomeProfileKeyV1,
  type BiomeProfileWeatherV1,
} from '@cf/domain-biome-profile';

export type SurfacedEcologySource = 'approach-lead' | 'survey-roster';
export type EcologyHintGranularity = 'biosphere' | 'kingdom' | 'family' | 'species';

export type SurfacedEcologyProjection =
  | Readonly<{
    source: SurfacedEcologySource;
    evidenceKey: string;
    granularity: 'biosphere';
  }>
  | Readonly<{
    source: SurfacedEcologySource;
    evidenceKey: string;
    granularity: 'kingdom';
    kingdom: AudioKingdom;
  }>
  | Readonly<{
    source: SurfacedEcologySource;
    evidenceKey: string;
    granularity: 'family';
    kingdom: AudioKingdom;
    familyKey: string;
  }>
  | Readonly<{
    source: SurfacedEcologySource;
    evidenceKey: string;
    granularity: 'species';
    owner: CanonicalAudioOwner;
    signature: AudioSignature;
  }>;

export interface DistantEcologyHintInput {
  readonly canonicalWorldKey: string;
  readonly biomeProfile: Readonly<{
    readonly schema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
    readonly digest: BiomeProfileDigestV1;
    readonly key: BiomeProfileKeyV1;
  }>;
  readonly surfaced: SurfacedEcologyProjection;
}

export interface DistantEcologyHintPlan {
  readonly version: typeof AUDIO_RESOLVER_VERSION;
  readonly planId: string;
  readonly canonicalWorldKey: string;
  readonly biomeProfileSchema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  readonly biomeProfileDigest: BiomeProfileDigestV1;
  readonly biomeProfileKey: BiomeProfileKeyV1;
  readonly biomeWeather: BiomeProfileWeatherV1;
  readonly biomeHazard: BiomeProfileHazardV1 | null;
  readonly evidenceKey: string;
  readonly source: SurfacedEcologySource;
  readonly granularity: EcologyHintGranularity;
  readonly kingdom: AudioKingdom | null;
  readonly palettePolicy: AudioPalettePolicy | 'generic-ecology';
  readonly route: 'ambience' | 'creature';
  readonly familyKey: string | null;
  readonly identityKey: SerializedAudioSignature | null;
}

function hex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function exactOwner(left: CanonicalAudioOwner, right: CanonicalAudioOwner): boolean {
  return left.route === right.route && left.kingdom === right.kingdom && left.name === right.name;
}

function source(value: unknown): SurfacedEcologySource {
  if (value !== 'approach-lead' && value !== 'survey-roster') {
    throw new TypeError('distant ecology source is not already-surfaced evidence');
  }
  return value;
}

function kingdom(value: unknown): AudioKingdom {
  if (value !== 'fauna' && value !== 'flora' && value !== 'fungi' && value !== 'microbe') {
    throw new TypeError('distant ecology kingdom is invalid');
  }
  return value;
}

function canonicalBiomeProfile(
  value: DistantEcologyHintInput['biomeProfile'],
): Readonly<{
  schema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  digest: BiomeProfileDigestV1;
  key: BiomeProfileKeyV1;
  weather: BiomeProfileWeatherV1;
  hazard: BiomeProfileHazardV1 | null;
}> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || !hasExactKeys(value, ['schema', 'digest', 'key'])
    || value.schema !== BIOME_PROFILE_AUTHORITY_V1.schema
    || value.digest !== BIOME_PROFILE_AUTHORITY_V1.digest
    || !BIOME_PROFILE_KEYS_V1.includes(value.key as BiomeProfileKeyV1)) {
    throw new TypeError('distant ecology biome profile authority is stale or invalid');
  }
  const key = value.key as BiomeProfileKeyV1;
  const profile = BIOME_PROFILE_AUTHORITY_V1.profiles[key];
  return Object.freeze({
    schema: BIOME_PROFILE_AUTHORITY_V1.schema,
    digest: BIOME_PROFILE_AUTHORITY_V1.digest,
    key,
    weather: profile.weather,
    hazard: profile.hazard,
  });
}

/** Build a presentation-only plan from the exact evidence the visual owner has
 * already surfaced. Species granularity requires the matching signature. */
export function createDistantEcologyHintPlan(input: DistantEcologyHintInput): DistantEcologyHintPlan {
  if (input === null || typeof input !== 'object' || input.surfaced === null
    || typeof input.surfaced !== 'object'
    || !hasExactKeys(input, ['canonicalWorldKey', 'biomeProfile', 'surfaced'])) {
    throw new TypeError('distant ecology input is required');
  }
  const canonicalWorldKey = boundedAudioKey(input.canonicalWorldKey, 'canonical world key', 192);
  const biome = canonicalBiomeProfile(input.biomeProfile);
  const evidenceKey = boundedAudioKey(input.surfaced.evidenceKey, 'surfaced evidence key', 192);
  const surfacedSource = source(input.surfaced.source);
  const granularity = input.surfaced.granularity;

  let resolvedKingdom: AudioKingdom | null = null;
  let familyKey: string | null = null;
  let identityKey: SerializedAudioSignature | null = null;

  if (granularity === 'biosphere') {
    if (!hasExactKeys(input.surfaced, ['source', 'evidenceKey', 'granularity'])) {
      throw new TypeError('biosphere evidence must not carry hidden ecology detail');
    }
    // Generic life-level evidence carries no hidden kingdom or species data.
  } else if (granularity === 'kingdom') {
    if (!hasExactKeys(input.surfaced, ['source', 'evidenceKey', 'granularity', 'kingdom'])) {
      throw new TypeError('kingdom evidence must not carry hidden ecology detail');
    }
    resolvedKingdom = kingdom(input.surfaced.kingdom);
  } else if (granularity === 'family') {
    if (!hasExactKeys(input.surfaced, ['source', 'evidenceKey', 'granularity', 'kingdom', 'familyKey'])) {
      throw new TypeError('family evidence must not carry hidden species detail');
    }
    resolvedKingdom = kingdom(input.surfaced.kingdom);
    familyKey = boundedAudioKey(input.surfaced.familyKey, 'surfaced ecology family', 96);
  } else if (granularity === 'species') {
    if (!hasExactKeys(input.surfaced, ['source', 'evidenceKey', 'granularity', 'owner', 'signature'])) {
      throw new TypeError('species evidence shape is invalid');
    }
    const owner = input.surfaced.owner;
    if (owner === null || typeof owner !== 'object'
      || !hasExactKeys(owner, ['route', 'kingdom', 'name'])) {
      throw new TypeError('surfaced species owner shape is invalid');
    }
    identityKey = serializeAudioSignature(input.surfaced.signature);
    const decoded = deserializeAudioSignature(identityKey);
    if (decoded.kind !== 'ok' || !exactOwner(owner, decoded.signature.owner)) {
      throw new TypeError('surfaced species owner does not match its audio signature');
    }
    resolvedKingdom = decoded.signature.phenotype.kingdom;
  } else {
    throw new TypeError('distant ecology granularity is invalid');
  }

  const palettePolicy = resolvedKingdom === null
    ? 'generic-ecology' as const
    : AUDIO_PALETTE_POLICY[resolvedKingdom];
  const route = resolvedKingdom === 'fauna'
      && (granularity === 'family' || granularity === 'species')
    ? 'creature' as const
    : 'ambience' as const;
  const key = JSON.stringify([
    AUDIO_RESOLVER_VERSION, canonicalWorldKey,
    biome.schema, biome.digest, biome.key, biome.weather, biome.hazard,
    evidenceKey, surfacedSource,
    granularity, resolvedKingdom, familyKey, identityKey,
  ]);
  return Object.freeze({
    version: AUDIO_RESOLVER_VERSION,
    planId: `deh1-${hex32(audioHash32(key, 0xEC010))}${hex32(audioHash32(key, 0xEC011))}`,
    canonicalWorldKey,
    biomeProfileSchema: biome.schema,
    biomeProfileDigest: biome.digest,
    biomeProfileKey: biome.key,
    biomeWeather: biome.weather,
    biomeHazard: biome.hazard,
    evidenceKey,
    source: surfacedSource,
    granularity,
    kingdom: resolvedKingdom,
    palettePolicy,
    route,
    familyKey,
    identityKey,
  });
}
