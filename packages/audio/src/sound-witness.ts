/* Canonical proof of the fields that can change generated sound or call
   scheduling. Signature bytes and identity labels are deliberately absent:
   two routes are audibly distinct only when these output fields differ. */
import {
  createAudioIdentityProfile,
  createCreatureCallPlan,
  deserializeAudioSignature,
  type AudioSignature,
  type CreaturePhrasePurpose,
} from './identity.js';
import {
  AUDIO_LEGACY_FALLBACK,
  AUDIO_PALETTE_POLICY,
  AUDIO_ROUTE_MANIFEST,
  type AudioCatalogueRouteKey,
  type AudioPalettePolicy,
} from './taxonomy.js';

export interface AudioSoundOutputWitness {
  readonly profile: Readonly<{
    palettePolicy: AudioPalettePolicy;
    paletteId: string;
    register: Readonly<{ centerHz: number; spanCents: number }>;
    phraseGrammar: string;
    rhythm: string;
    articulation: string;
  }>;
  readonly call: Readonly<{
    paletteId: string;
    phraseGrammar: string;
    cooldownGroup: string;
    cooldownMs: number;
    phrases: readonly Readonly<{
      purpose: CreaturePhrasePurpose;
      intervalsSemitones: readonly number[];
      durationsMs: readonly number[];
      intensityPermille: number;
    }>[];
  }>;
}

declare const serializedAudioSoundOutputWitnessBrand: unique symbol;
export type SerializedAudioSoundOutputWitness = string & {
  readonly [serializedAudioSoundOutputWitnessBrand]: true;
};

export interface AudioRouteSoundOutputRow {
  readonly routeKey: AudioCatalogueRouteKey;
  readonly signature: AudioSignature;
  readonly witness: AudioSoundOutputWitness;
}

export interface AudioRouteSoundOutputAudit {
  readonly routeCount: 1_014;
  readonly uniqueWitnessCount: 1_014;
  readonly legacyOrdinarySelectionCount: 0;
  readonly nonFaunaFaunaSelectionCount: 0;
}

const PURPOSES = Object.freeze([
  'contact', 'contented', 'subdued', 'greeting', 'celebration',
] as const satisfies readonly CreaturePhrasePurpose[]);
const EXPECTED_ROUTES = 1_014;
const ROUTE_BY_KEY = new Map(AUDIO_ROUTE_MANIFEST.map((row) => [row.routeKey as string, row]));
const SIGNATURE_KEYS = Object.freeze(['schema', 'version', 'owner', 'phenotype', 'lineage'] as const);
const OWNER_KEYS = Object.freeze(['route', 'kingdom', 'name'] as const);
const PHENOTYPE_KEYS = Object.freeze([
  'seed', 'kingdom', 'color', 'accent', 'form', 'body', 'loco', 'trait', 'size',
  'diet', 'head', 'limbs', 'skin', 'tail', 'pattern', 'behavior', 'habitat',
  'temper', 'sense', 'metab', 'lumin', 'heatBand',
] as const);
const PHENOTYPE_NUMBER_KEYS = Object.freeze(PHENOTYPE_KEYS.filter((key) =>
  key !== 'kingdom' && key !== 'lumin'));
const LINEAGE_KEYS = Object.freeze(['parentSeeds', 'anchorBasisPoints'] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && actual.every((key) => expected.includes(key));
}

function boundedString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 192
    || value.trim() !== value || value.normalize('NFC') !== value
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} is not a bounded canonical key`);
  }
  return value;
}

function integerInRange(value: unknown, label: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new TypeError(`${label} must be an integer in [${minimum}, ${maximum}]`);
  }
  return value as number;
}

function exactPlainDataValues(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be an exact plain data object`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== expectedKeys.length
    || ownKeys.some((key) => typeof key !== 'string' || !expectedKeys.includes(key))) {
    throw new TypeError(`${label} has unexpected own keys`);
  }
  const values: Record<string, unknown> = {};
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`${label}.${key} must be an enumerable data property`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function primitive(
  value: unknown,
  type: 'string' | 'number' | 'boolean',
  label: string,
): string | number | boolean {
  if (typeof value !== type) throw new TypeError(`${label} must be a ${type}`);
  return value as string | number | boolean;
}

function exactParentSeeds(value: unknown): readonly [number, number] | null {
  if (value === null) return null;
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError('audio route signature parentSeeds must be a plain pair');
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== 3 || !ownKeys.includes('0') || !ownKeys.includes('1')
    || !ownKeys.includes('length')) {
    throw new TypeError('audio route signature parentSeeds has unexpected own keys');
  }
  const left = Object.getOwnPropertyDescriptor(value, '0');
  const right = Object.getOwnPropertyDescriptor(value, '1');
  if (!left || !right || !Object.hasOwn(left, 'value') || !Object.hasOwn(right, 'value')
    || left.enumerable !== true || right.enumerable !== true
    || typeof left.value !== 'number' || typeof right.value !== 'number') {
    throw new TypeError('audio route signature parentSeeds must contain two data numbers');
  }
  return Object.freeze([left.value, right.value] as const);
}

/** Inspect the complete signature without invoking getters or toJSON, then
 * rebuild a plain value safe to stringify for the existing canonical decoder. */
function plainCanonicalSignatureSource(value: unknown): unknown {
  const signature = exactPlainDataValues(value, SIGNATURE_KEYS, 'audio route signature');
  const owner = exactPlainDataValues(signature.owner, OWNER_KEYS, 'audio route signature owner');
  const phenotype = exactPlainDataValues(
    signature.phenotype, PHENOTYPE_KEYS, 'audio route signature phenotype',
  );
  const lineage = exactPlainDataValues(
    signature.lineage, LINEAGE_KEYS, 'audio route signature lineage',
  );
  for (const key of PHENOTYPE_NUMBER_KEYS) {
    primitive(phenotype[key], 'number', `audio route signature phenotype.${key}`);
  }
  const ownerName = owner.name === null
    ? null
    : primitive(owner.name, 'string', 'audio route signature owner.name');
  const anchorBasisPoints = lineage.anchorBasisPoints === null
    ? null
    : primitive(lineage.anchorBasisPoints, 'number', 'audio route signature lineage.anchorBasisPoints');
  return {
    schema: primitive(signature.schema, 'string', 'audio route signature schema'),
    version: primitive(signature.version, 'number', 'audio route signature version'),
    owner: {
      route: primitive(owner.route, 'string', 'audio route signature owner.route'),
      kingdom: primitive(owner.kingdom, 'string', 'audio route signature owner.kingdom'),
      name: ownerName,
    },
    phenotype: {
      ...Object.fromEntries(PHENOTYPE_NUMBER_KEYS.map((key) => [key, phenotype[key]])),
      kingdom: primitive(phenotype.kingdom, 'string', 'audio route signature phenotype.kingdom'),
      lumin: primitive(phenotype.lumin, 'boolean', 'audio route signature phenotype.lumin'),
    },
    lineage: {
      parentSeeds: exactParentSeeds(lineage.parentSeeds),
      anchorBasisPoints,
    },
  };
}

function audioPalettePolicy(value: unknown): AudioPalettePolicy {
  const policy = boundedString(value, 'audio sound-output palette policy');
  if (!(Object.values(AUDIO_PALETTE_POLICY) as readonly string[]).includes(policy)) {
    throw new TypeError('audio sound-output palette policy is invalid');
  }
  return policy as AudioPalettePolicy;
}

function canonicalSoundOutputWitness(value: unknown): AudioSoundOutputWitness {
  if (!isRecord(value) || !hasExactKeys(value, ['profile', 'call'])
    || !isRecord(value.profile) || !hasExactKeys(value.profile, [
      'palettePolicy', 'paletteId', 'register', 'phraseGrammar', 'rhythm', 'articulation',
    ]) || !isRecord(value.call) || !hasExactKeys(value.call, [
      'paletteId', 'phraseGrammar', 'cooldownGroup', 'cooldownMs', 'phrases',
    ])) throw new TypeError('audio sound-output witness shape is invalid');

  const profile = value.profile;
  const palettePolicy = audioPalettePolicy(profile.palettePolicy);
  if (!isRecord(profile.register) || !hasExactKeys(profile.register, ['centerHz', 'spanCents'])) {
    throw new TypeError('audio sound-output register shape is invalid');
  }
  const profileOutput = Object.freeze({
    palettePolicy,
    paletteId: boundedString(profile.paletteId, 'audio sound-output palette'),
    register: Object.freeze({
      centerHz: integerInRange(profile.register.centerHz, 'audio register center', 1, 24_000),
      spanCents: integerInRange(profile.register.spanCents, 'audio register span', 1, 24_000),
    }),
    phraseGrammar: boundedString(profile.phraseGrammar, 'audio phrase grammar'),
    rhythm: boundedString(profile.rhythm, 'audio rhythm'),
    articulation: boundedString(profile.articulation, 'audio articulation'),
  });

  const call = value.call;
  const callPalette = boundedString(call.paletteId, 'audio call palette');
  const callGrammar = boundedString(call.phraseGrammar, 'audio call grammar');
  const cooldownGroup = boundedString(call.cooldownGroup, 'audio call cooldown group');
  if (callPalette !== profileOutput.paletteId || callGrammar !== profileOutput.phraseGrammar
    || cooldownGroup !== profileOutput.palettePolicy) {
    throw new TypeError('audio call output does not match its profile output');
  }
  if (!Array.isArray(call.phrases) || call.phrases.length !== PURPOSES.length) {
    throw new TypeError('audio call output requires the complete phrase set');
  }
  const phrases = call.phrases.map((candidate, index) => {
    const purpose = PURPOSES[index]!;
    if (!isRecord(candidate) || !hasExactKeys(candidate, [
      'purpose', 'intervalsSemitones', 'durationsMs', 'intensityPermille',
    ]) || candidate.purpose !== purpose
      || !Array.isArray(candidate.intervalsSemitones)
      || !Array.isArray(candidate.durationsMs)
      || candidate.intervalsSemitones.length < 1
      || candidate.intervalsSemitones.length !== candidate.durationsMs.length) {
      throw new TypeError(`audio sound-output phrase ${index} shape is invalid`);
    }
    return Object.freeze({
      purpose,
      intervalsSemitones: Object.freeze(candidate.intervalsSemitones.map((interval) =>
        integerInRange(interval, `audio phrase ${index} interval`, -128, 127))),
      durationsMs: Object.freeze(candidate.durationsMs.map((duration) =>
        integerInRange(duration, `audio phrase ${index} duration`, 1, 60_000))),
      intensityPermille: integerInRange(
        candidate.intensityPermille, `audio phrase ${index} intensity`, 0, 1_000,
      ),
    });
  });
  return Object.freeze({
    profile: profileOutput,
    call: Object.freeze({
      paletteId: callPalette,
      phraseGrammar: callGrammar,
      cooldownGroup,
      cooldownMs: integerInRange(call.cooldownMs, 'audio call cooldown', 0, 60_000),
      phrases: Object.freeze(phrases),
    }),
  });
}

export function createAudioSoundOutputWitness(signature: AudioSignature): AudioSoundOutputWitness {
  const profile = createAudioIdentityProfile(signature);
  const call = createCreatureCallPlan(profile);
  return canonicalSoundOutputWitness({
    profile: {
      palettePolicy: profile.palettePolicy,
      paletteId: profile.paletteId,
      register: profile.register,
      phraseGrammar: profile.phraseGrammar,
      rhythm: profile.rhythm,
      articulation: profile.articulation,
    },
    call: {
      paletteId: call.paletteId,
      phraseGrammar: call.phraseGrammar,
      cooldownGroup: call.cooldownGroup,
      cooldownMs: call.cooldownMs,
      phrases: call.phrases.map((phrase) => ({
        purpose: phrase.purpose,
        intervalsSemitones: phrase.intervalsSemitones,
        durationsMs: phrase.durationsMs,
        intensityPermille: phrase.intensityPermille,
      })),
    },
  });
}

export function serializeAudioSoundOutputWitness(
  witness: AudioSoundOutputWitness,
): SerializedAudioSoundOutputWitness {
  return JSON.stringify(canonicalSoundOutputWitness(witness)) as SerializedAudioSoundOutputWitness;
}

/** Validate exact route coverage against actual sound-producing outputs. The
 * legacy and non-fauna counts are derived here rather than asserted by the
 * taxonomy manifest, which cannot observe resolver selection. */
export function auditAudioRouteSoundOutputs(
  rows: readonly unknown[],
): AudioRouteSoundOutputAudit {
  if (!Array.isArray(rows) || rows.length !== EXPECTED_ROUTES) {
    throw new RangeError(`audio route sound audit requires exactly ${EXPECTED_ROUTES} routes`);
  }
  const routeKeys = new Set<string>();
  const witnessOwners = new Map<string, string>();
  let legacyOrdinarySelectionCount = 0;
  let nonFaunaFaunaSelectionCount = 0;
  for (const [index, value] of rows.entries()) {
    if (!isRecord(value) || !hasExactKeys(value, ['routeKey', 'signature', 'witness'])
      || typeof value.routeKey !== 'string') {
      throw new TypeError(`audio route sound row ${index} has an invalid shape`);
    }
    const expected = ROUTE_BY_KEY.get(value.routeKey);
    if (!expected || routeKeys.has(value.routeKey)) {
      throw new RangeError(`audio route sound row ${index} has an unapproved or duplicate route`);
    }
    routeKeys.add(value.routeKey);
    let signature: AudioSignature;
    try {
      const serializedSignature = JSON.stringify(plainCanonicalSignatureSource(value.signature));
      if (typeof serializedSignature !== 'string') {
        throw new TypeError('current audio signature is required');
      }
      const decoded = deserializeAudioSignature(serializedSignature);
      if (decoded.kind !== 'ok') throw new TypeError('current audio signature is required');
      signature = decoded.signature;
    } catch {
      throw new TypeError(`audio route sound row ${index} has an invalid canonical signature`);
    }
    if (signature.owner.route !== 'catalogue'
      || signature.owner.kingdom !== expected.kingdom
      || signature.owner.name !== expected.name) {
      throw new RangeError(`audio route sound row ${index} signature does not own its exact route`);
    }
    const witness = canonicalSoundOutputWitness(value.witness);
    const serialized = serializeAudioSoundOutputWitness(witness);
    const expectedWitness = serializeAudioSoundOutputWitness(
      createAudioSoundOutputWitness(signature),
    );
    if (serialized !== expectedWitness) {
      throw new RangeError(`audio route sound row ${index} witness does not match its signature`);
    }
    const priorOwner = witnessOwners.get(serialized);
    if (priorOwner) {
      throw new RangeError(`audio sound-output witness collision between ${priorOwner} and ${value.routeKey}`);
    }
    witnessOwners.set(serialized, value.routeKey);
    if (witness.profile.paletteId === AUDIO_LEGACY_FALLBACK.paletteId) {
      legacyOrdinarySelectionCount++;
    }
    if (expected.kingdom !== 'fauna'
      && (witness.profile.palettePolicy === AUDIO_PALETTE_POLICY.fauna
        || witness.profile.paletteId.startsWith('fauna-'))) {
      nonFaunaFaunaSelectionCount++;
    }
  }
  if (routeKeys.size !== ROUTE_BY_KEY.size) {
    throw new RangeError('audio route sound audit omitted an approved route');
  }
  if (legacyOrdinarySelectionCount !== 0) {
    throw new RangeError('ordinary audio route selected the legacy fallback');
  }
  if (nonFaunaFaunaSelectionCount !== 0) {
    throw new RangeError('non-fauna audio route selected a fauna output');
  }
  return Object.freeze({
    routeCount: EXPECTED_ROUTES,
    uniqueWitnessCount: witnessOwners.size as 1_014,
    legacyOrdinarySelectionCount,
    nonFaunaFaunaSelectionCount,
  });
}
