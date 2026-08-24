/* Pure Arc 7 audible identity. This module deliberately knows nothing about
   AudioContext, app state, saves, or gameplay RNG. The caller projects a
   creature into the bounded immutable fields below; everything else is
   ignored by construction. */
import {
  AUDIO_PALETTE_POLICY,
  AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION,
  audioRouteManifestRow,
  type AudioKingdom,
  type AudioPalettePolicy,
} from './taxonomy.js';

export const AUDIO_RESOLVER_VERSION = AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION;
const AUDIO_SIGNATURE_SCHEMA = 'cf.audio.signature' as const;
const MAX_OWNER_NAME = 128;
const MAX_SERIALIZED_SIGNATURE = 4_096;
const MAX_GENE = 0xFFFF;

export type AudioOwnerRoute = 'catalogue' | 'lineage' | 'procedural';

export interface CanonicalAudioOwner {
  readonly route: AudioOwnerRoute;
  /** Exact catalogue set for catalogue/lineage identities. */
  readonly kingdom: AudioKingdom;
  /** Exact catalogue name; procedural identities carry null. */
  readonly name: string | null;
}

/** Canonical, already-normalized genes selected for audible identity. */
export interface ImmutableAudioPhenotype {
  readonly seed: number;
  readonly kingdom: AudioKingdom;
  readonly color: number;
  readonly accent: number;
  readonly form: number;
  readonly body: number;
  readonly loco: number;
  readonly trait: number;
  readonly size: number;
  readonly diet: number;
  readonly head: number;
  readonly limbs: number;
  readonly skin: number;
  readonly tail: number;
  readonly pattern: number;
  readonly behavior: number;
  readonly habitat: number;
  readonly temper: number;
  readonly sense: number;
  readonly metab: number;
  readonly lumin: boolean;
  readonly heatBand: 0 | 1 | 2;
}

export type OrderedParentSeeds = readonly [number, number];

export interface SurvivingAudioLineage {
  /** Null for unbred/legacy identities; when present, order is significant. */
  readonly parentSeeds: OrderedParentSeeds | null;
  /** Quantized `_anchorVal`; required only for an Earth-lineage owner. */
  readonly anchorBasisPoints: number | null;
}

export interface AudioIdentityInput {
  readonly owner: CanonicalAudioOwner;
  readonly phenotype: ImmutableAudioPhenotype;
  readonly lineage: SurvivingAudioLineage;
}

export interface AudioSignature {
  readonly schema: typeof AUDIO_SIGNATURE_SCHEMA;
  readonly version: typeof AUDIO_RESOLVER_VERSION;
  readonly owner: CanonicalAudioOwner;
  readonly phenotype: ImmutableAudioPhenotype;
  readonly lineage: SurvivingAudioLineage;
}

declare const serializedAudioSignatureBrand: unique symbol;
export type SerializedAudioSignature = string & {
  readonly [serializedAudioSignatureBrand]: true;
};

export type AudioSignatureDecodeResult =
  | { readonly kind: 'ok'; readonly signature: AudioSignature }
  | { readonly kind: 'unsupported-version'; readonly version: number }
  | { readonly kind: 'malformed' };

export interface AudioIdentityProfile {
  readonly version: typeof AUDIO_RESOLVER_VERSION;
  /** Canonical signature bytes are the collision-free cache/ownership key. */
  readonly identityKey: SerializedAudioSignature;
  /** Compact diagnostic label only; never substitutes for identityKey. */
  readonly identityId: string;
  readonly kingdom: AudioKingdom;
  readonly palettePolicy: AudioPalettePolicy;
  readonly paletteId: string;
  readonly register: Readonly<{
    centerHz: number;
    spanCents: number;
  }>;
  readonly phraseGrammar: string;
  readonly rhythm: string;
  readonly articulation: string;
}

export type CreaturePhrasePurpose =
  | 'contact'
  | 'contented'
  | 'subdued'
  | 'greeting'
  | 'celebration';

export interface CreaturePhrasePlan {
  readonly purpose: CreaturePhrasePurpose;
  readonly phraseId: string;
  readonly intervalsSemitones: readonly number[];
  readonly durationsMs: readonly number[];
  readonly intensityPermille: number;
}

export interface CreatureCallPlan {
  readonly version: typeof AUDIO_RESOLVER_VERSION;
  readonly identityKey: SerializedAudioSignature;
  readonly identityId: string;
  readonly paletteId: string;
  readonly phraseGrammar: string;
  readonly cooldownGroup: string;
  readonly cooldownMs: number;
  readonly phrases: readonly CreaturePhrasePlan[];
}

const PALETTES: Readonly<Record<AudioKingdom, readonly string[]>> = Object.freeze({
  fauna: Object.freeze(['fauna-resonant', 'fauna-breathy', 'fauna-percussive', 'fauna-chitter']),
  flora: Object.freeze(['flora-canopy', 'flora-stem-resonance', 'flora-seed-rattle', 'flora-pollen-shimmer']),
  fungi: Object.freeze(['fungi-spore-hush', 'fungi-gill-pulse', 'fungi-mycelial-click', 'fungi-fruiting-resonance']),
  microbe: Object.freeze(['microbe-colony-pulse', 'microbe-vesicle-tick', 'microbe-bloom-shimmer', 'microbe-cilia-rhythm']),
});

const GRAMMARS: Readonly<Record<AudioKingdom, readonly string[]>> = Object.freeze({
  fauna: Object.freeze(['call-response', 'rising-motif', 'broken-pulse', 'descending-motif']),
  flora: Object.freeze(['growth-cycle', 'branching-chime', 'wind-response', 'seed-cycle']),
  fungi: Object.freeze(['spore-cycle', 'network-pulse', 'gill-rhythm', 'decay-bloom']),
  microbe: Object.freeze(['colony-cycle', 'division-pulse', 'cilia-pattern', 'bloom-cycle']),
});

const RHYTHMS = Object.freeze(['even', 'syncopated', 'clustered', 'spaced'] as const);
const ARTICULATIONS = Object.freeze(['smooth', 'breathy', 'granular', 'plucked'] as const);
const PURPOSES = Object.freeze([
  'contact', 'contented', 'subdued', 'greeting', 'celebration',
] as const satisfies readonly CreaturePhrasePurpose[]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function boundedInteger(value: unknown, label: string, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > max) {
    throw new TypeError(`${label} must be an integer in [0, ${max}]`);
  }
  return value as number;
}

function audioKingdom(value: unknown, label: string): AudioKingdom {
  if (value !== 'fauna' && value !== 'flora' && value !== 'fungi' && value !== 'microbe') {
    throw new TypeError(`${label} is not an audio kingdom`);
  }
  return value;
}

export function boundedAudioKey(value: unknown, label: string, maxLength = 192): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength
    || value.trim() !== value || value.normalize('NFC') !== value || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} is not a bounded canonical key`);
  }
  return value;
}

function canonicalOwner(value: unknown): CanonicalAudioOwner {
  if (!isRecord(value)) throw new TypeError('audio owner is required');
  const route = value.route;
  if (route !== 'catalogue' && route !== 'lineage' && route !== 'procedural') {
    throw new TypeError('audio owner route is invalid');
  }
  const kingdom = audioKingdom(value.kingdom, 'audio owner kingdom');
  const name = route === 'procedural'
    ? (value.name === null ? null : (() => { throw new TypeError('procedural owner name must be null'); })())
    : boundedAudioKey(value.name, 'audio owner name', MAX_OWNER_NAME);
  if (name !== null && !audioRouteManifestRow(kingdom, name)) {
    throw new RangeError('audio owner is not an approved set-qualified catalogue route');
  }
  return Object.freeze({ route, kingdom, name });
}

function canonicalPhenotype(value: unknown): ImmutableAudioPhenotype {
  if (!isRecord(value)) throw new TypeError('audio phenotype is required');
  const gene = (name: string): number => boundedInteger(value[name], `audio phenotype ${name}`, MAX_GENE);
  const heatBand = boundedInteger(value.heatBand, 'audio phenotype heatBand', 2) as 0 | 1 | 2;
  if (typeof value.lumin !== 'boolean') throw new TypeError('audio phenotype lumin must be boolean');
  return Object.freeze({
    seed: boundedInteger(value.seed, 'audio phenotype seed', 0xFFFF_FFFF),
    kingdom: audioKingdom(value.kingdom, 'audio phenotype kingdom'),
    color: gene('color'), accent: gene('accent'), form: gene('form'), body: gene('body'),
    loco: gene('loco'), trait: gene('trait'), size: gene('size'), diet: gene('diet'),
    head: gene('head'), limbs: gene('limbs'), skin: gene('skin'), tail: gene('tail'),
    pattern: gene('pattern'), behavior: gene('behavior'), habitat: gene('habitat'),
    temper: gene('temper'), sense: gene('sense'), metab: gene('metab'),
    lumin: value.lumin,
    heatBand,
  });
}

function canonicalLineage(value: unknown, route: AudioOwnerRoute): SurvivingAudioLineage {
  if (!isRecord(value)) throw new TypeError('audio lineage is required');
  let parentSeeds: OrderedParentSeeds | null = null;
  if (value.parentSeeds !== null) {
    if (!Array.isArray(value.parentSeeds) || value.parentSeeds.length !== 2) {
      throw new TypeError('audio lineage parentSeeds must be null or an ordered pair');
    }
    parentSeeds = Object.freeze([
      boundedInteger(value.parentSeeds[0], 'audio lineage first parent', 0xFFFF_FFFF),
      boundedInteger(value.parentSeeds[1], 'audio lineage second parent', 0xFFFF_FFFF),
    ] as const);
  }
  const anchorBasisPoints = value.anchorBasisPoints === null
    ? null
    : boundedInteger(value.anchorBasisPoints, 'audio lineage anchorBasisPoints', 10_000);
  if ((route === 'lineage') !== (anchorBasisPoints !== null)) {
    throw new TypeError('only an Earth-lineage owner carries an anchor');
  }
  return Object.freeze({ parentSeeds, anchorBasisPoints });
}

/** Project a richer creature record into the only fields allowed to own sound.
 * Unknown/mutable fields are intentionally ignored rather than copied. */
export function createAudioSignature(input: AudioIdentityInput): AudioSignature {
  if (!isRecord(input)) throw new TypeError('audio identity input is required');
  const owner = canonicalOwner(input.owner);
  const phenotype = canonicalPhenotype(input.phenotype);
  const lineage = canonicalLineage(input.lineage, owner.route);
  if (owner.route !== 'lineage' && owner.kingdom !== phenotype.kingdom) {
    throw new TypeError('non-lineage owner kingdom must match the phenotype kingdom');
  }
  return Object.freeze({
    schema: AUDIO_SIGNATURE_SCHEMA,
    version: AUDIO_RESOLVER_VERSION,
    owner,
    phenotype,
    lineage,
  });
}

function requireCurrentSignature(value: unknown): AudioSignature {
  if (!isRecord(value) || value.schema !== AUDIO_SIGNATURE_SCHEMA
    || value.version !== AUDIO_RESOLVER_VERSION) {
    throw new TypeError('current audio signature is required');
  }
  return createAudioSignature(value as unknown as AudioIdentityInput);
}

/** Canonical bytes used for cache keys and deterministic vectors. */
export function serializeAudioSignature(signature: AudioSignature): SerializedAudioSignature {
  const current = requireCurrentSignature(signature);
  return JSON.stringify({
    schema: current.schema,
    version: current.version,
    owner: current.owner,
    phenotype: current.phenotype,
    lineage: current.lineage,
  }) as SerializedAudioSignature;
}

export function deserializeAudioSignature(raw: string): AudioSignatureDecodeResult {
  if (typeof raw !== 'string' || raw.length < 1 || raw.length > MAX_SERIALIZED_SIGNATURE) {
    return { kind: 'malformed' };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.schema !== AUDIO_SIGNATURE_SCHEMA) return { kind: 'malformed' };
    if (Number.isSafeInteger(parsed.version) && (parsed.version as number) > AUDIO_RESOLVER_VERSION) {
      return { kind: 'unsupported-version', version: parsed.version as number };
    }
    if (parsed.version !== AUDIO_RESOLVER_VERSION
      || !hasExactKeys(parsed, ['schema', 'version', 'owner', 'phenotype', 'lineage'])
      || !isRecord(parsed.owner)
      || !hasExactKeys(parsed.owner, ['route', 'kingdom', 'name'])
      || !isRecord(parsed.phenotype)
      || !hasExactKeys(parsed.phenotype, [
        'seed', 'kingdom', 'color', 'accent', 'form', 'body', 'loco', 'trait', 'size',
        'diet', 'head', 'limbs', 'skin', 'tail', 'pattern', 'behavior', 'habitat',
        'temper', 'sense', 'metab', 'lumin', 'heatBand',
      ])
      || !isRecord(parsed.lineage)
      || !hasExactKeys(parsed.lineage, ['parentSeeds', 'anchorBasisPoints'])) {
      return { kind: 'malformed' };
    }
    return { kind: 'ok', signature: createAudioSignature(parsed as unknown as AudioIdentityInput) };
  } catch {
    return { kind: 'malformed' };
  }
}

/** Stable UTF-16 hash for plan selection only. identityKey remains authoritative. */
export function audioHash32(value: string, salt: number): number {
  let hash = (0x811C9DC5 ^ salt) >>> 0;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  return Math.imul(hash, 0x85EBCA6B) >>> 0;
}

function hex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

function pick<T>(values: readonly T[], hash: number): T {
  return values[hash % values.length]!;
}

export function createAudioIdentityProfile(signature: AudioSignature): AudioIdentityProfile {
  const identityKey = serializeAudioSignature(signature);
  const current = deserializeAudioSignature(identityKey);
  if (current.kind !== 'ok') throw new TypeError('current audio signature is required');
  const kingdom = current.signature.phenotype.kingdom;
  const base = audioHash32(identityKey, 0xA7D10);
  const second = audioHash32(identityKey, 0xA7D11);
  const palettePolicy = AUDIO_PALETTE_POLICY[kingdom];
  return Object.freeze({
    version: AUDIO_RESOLVER_VERSION,
    identityKey,
    identityId: `aip1-${hex32(base)}${hex32(second)}`,
    kingdom,
    palettePolicy,
    paletteId: pick(PALETTES[kingdom], base),
    register: Object.freeze({
      centerHz: 110 + (second % 1_091),
      spanCents: 500 + (audioHash32(identityKey, 0xA7D12) % 1_301),
    }),
    phraseGrammar: pick(GRAMMARS[kingdom], audioHash32(identityKey, 0xA7D13)),
    rhythm: pick(RHYTHMS, audioHash32(identityKey, 0xA7D14)),
    articulation: pick(ARTICULATIONS, audioHash32(identityKey, 0xA7D15)),
  });
}

function currentProfile(profile: AudioIdentityProfile): AudioIdentityProfile {
  if (!isRecord(profile) || profile.version !== AUDIO_RESOLVER_VERSION
    || typeof profile.identityKey !== 'string') throw new TypeError('current audio identity profile is required');
  const decoded = deserializeAudioSignature(profile.identityKey);
  if (decoded.kind !== 'ok') throw new TypeError('current audio identity profile is required');
  const expected = createAudioIdentityProfile(decoded.signature);
  if (JSON.stringify(profile) !== JSON.stringify(expected)) {
    throw new TypeError('audio identity profile does not match its signature');
  }
  return expected;
}

function phrase(identityKey: string, purpose: CreaturePhrasePurpose, ordinal: number): CreaturePhrasePlan {
  const hash = audioHash32(identityKey, 0xCA110 + ordinal);
  const count = 2 + (hash % 3);
  const intervals: number[] = [];
  const durations: number[] = [];
  for (let index = 0; index < count; index++) {
    const step = audioHash32(identityKey, 0xCA200 + ordinal * 8 + index);
    intervals.push((step % 15) - 7);
    durations.push(90 + (step >>> 8) % 281);
  }
  return Object.freeze({
    purpose,
    phraseId: `phrase-${ordinal}-${hex32(hash)}`,
    intervalsSemitones: Object.freeze(intervals),
    durationsMs: Object.freeze(durations),
    intensityPermille: 560 + (audioHash32(identityKey, 0xCA300 + ordinal) % 361),
  });
}

export function createCreatureCallPlan(profile: AudioIdentityProfile): CreatureCallPlan {
  const current = currentProfile(profile);
  return Object.freeze({
    version: AUDIO_RESOLVER_VERSION,
    identityKey: current.identityKey,
    identityId: current.identityId,
    paletteId: current.paletteId,
    phraseGrammar: current.phraseGrammar,
    cooldownGroup: current.palettePolicy,
    cooldownMs: 1_200 + (audioHash32(current.identityKey, 0xC001D) % 2_401),
    phrases: Object.freeze(PURPOSES.map((purpose, ordinal) => phrase(current.identityKey, purpose, ordinal))),
  });
}
