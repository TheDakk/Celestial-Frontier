/* Arc 7/8 recorded-audio rights authority. Batch C supplies eight original
   pilot cues and an explicit measured technical policy. This pure validator
   retains the empty-bundle behavior for callers, but the current authority is
   non-empty. Filesystem intake independently hashes optimized media and public
   evidence; private masters are retained source hashes, not public files. */
import {
  PILOT_AUDIO_REFERENCED_IDS, PILOT_AUDIO_RIGHTS_EVIDENCE,
  PILOT_AUDIO_RIGHTS_OBSERVATIONS, PILOT_AUDIO_RIGHTS_ROWS,
  PILOT_AUDIO_TECHNICAL_POLICY,
} from './pilot-rights-data.js';

export const AUDIO_ASSET_RIGHTS_MANIFEST_VERSION = 1 as const;

export const AUDIO_ASSET_ROLES = Object.freeze([
  'creature', 'foley', 'combat', 'guardian', 'ship', 'biome', 'music', 'ui',
] as const);

export type AudioAssetRole = typeof AUDIO_ASSET_ROLES[number];

export interface AudioAssetRightsRow {
  readonly id: string;
  readonly file: string;
  readonly role: AudioAssetRole;
  readonly sourceUrl: string;
  readonly creator: string;
  readonly licenseId: string;
  readonly licenseSnapshot: string;
  readonly commercialUse: true;
  readonly derivatives: true;
  readonly redistribution: true;
  readonly attribution: string | null;
  readonly acquiredOn: string;
  readonly proofFile: string;
  readonly processing: readonly string[];
  readonly originalSha256: string;
  readonly derivativeSha256: string;
  readonly version: number;
  readonly codec: string;
  readonly durationMs: number;
  readonly sampleRate: number;
  readonly channels: 1 | 2;
  readonly loopStartMs: number | null;
  readonly loopEndMs: number | null;
  readonly integratedLufs: number;
  readonly truePeakDb: number;
  readonly tags: readonly string[];
}

/** Facts measured by a filesystem/media inspector; never trusted filenames. */
export interface AudioAssetObservation {
  readonly id: string;
  readonly file: string;
  readonly originalSha256: string;
  readonly derivativeSha256: string;
  readonly codec: string;
  readonly durationMs: number;
  readonly sampleRate: number;
  readonly channels: 1 | 2;
  readonly loopStartMs: number | null;
  readonly loopEndMs: number | null;
  readonly integratedLufs: number;
  readonly truePeakDb: number;
}

/** Hash facts for retained licence snapshots and proof files. Their hashes are
 * included in the pinned bundle digest so a changed proof cannot pass merely
 * because the path still exists. */
export interface AudioRightsEvidenceObservation {
  readonly file: string;
  readonly sha256: string;
}

/** Every non-empty intake supplies its measured media policy. Complete-pack
 * byte and decoded-cache ceilings remain separate asset/runtime owners. */
export interface AudioAssetTechnicalPolicy {
  readonly allowedCodecs: readonly string[];
  readonly allowedSampleRates: readonly number[];
  readonly minDurationMs: number;
  readonly maxDurationMs: number;
  readonly minIntegratedLufs: number;
  readonly maxIntegratedLufs: number;
  readonly maxTruePeakDb: number;
  readonly allowedTags: readonly string[];
}

export interface AudioAssetRightsBundle {
  readonly rows: readonly unknown[];
  readonly observations: readonly unknown[];
  readonly evidence: readonly unknown[];
  readonly referencedAssetIds: readonly unknown[];
  readonly technicalPolicy: AudioAssetTechnicalPolicy | null;
}

export interface AudioAssetRightsAuditInput extends AudioAssetRightsBundle {
  readonly expectedDigest: string;
}

export interface AudioAssetRightsAudit {
  readonly version: typeof AUDIO_ASSET_RIGHTS_MANIFEST_VERSION;
  readonly rowCount: number;
  readonly observedAssetCount: number;
  readonly evidenceFileCount: number;
  readonly referencedAssetCount: number;
  readonly digest: string;
  readonly technicalPolicy: 'not-required-empty' | 'provided';
}

const RIGHTS_ROW_KEYS = Object.freeze([
  'id', 'file', 'role', 'sourceUrl', 'creator', 'licenseId', 'licenseSnapshot',
  'commercialUse', 'derivatives', 'redistribution', 'attribution', 'acquiredOn',
  'proofFile', 'processing', 'originalSha256', 'derivativeSha256', 'version',
  'codec', 'durationMs', 'sampleRate', 'channels', 'loopStartMs', 'loopEndMs',
  'integratedLufs', 'truePeakDb', 'tags',
] as const);
const OBSERVATION_KEYS = Object.freeze([
  'id', 'file', 'originalSha256', 'derivativeSha256', 'codec', 'durationMs',
  'sampleRate', 'channels', 'loopStartMs', 'loopEndMs', 'integratedLufs', 'truePeakDb',
] as const);
const EVIDENCE_KEYS = Object.freeze(['file', 'sha256'] as const);
const POLICY_KEYS = Object.freeze([
  'allowedCodecs', 'allowedSampleRates', 'minDurationMs', 'maxDurationMs',
  'minIntegratedLufs', 'maxIntegratedLufs', 'maxTruePeakDb', 'allowedTags',
] as const);
const BUNDLE_KEYS = Object.freeze([
  'rows', 'observations', 'evidence', 'referencedAssetIds', 'technicalPolicy',
] as const);
const AUDIT_INPUT_KEYS = Object.freeze([...BUNDLE_KEYS, 'expectedDigest'] as const);
const DIGEST_SEEDS = Object.freeze([
  0x811C9DC5, 0x9E3779B9, 0x85EBCA6B, 0xC2B2AE35,
] as const);

type CanonicalBundle = Readonly<{
  rows: readonly AudioAssetRightsRow[];
  observations: readonly AudioAssetObservation[];
  evidence: readonly AudioRightsEvidenceObservation[];
  referencedAssetIds: readonly string[];
  technicalPolicy: AudioAssetTechnicalPolicy | null;
}>;

function exactPlainData(
  value: unknown,
  expected: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(`${label} must be an exact plain data object`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length !== expected.length
      || keys.some((key) => typeof key !== 'string' || !expected.includes(key))) {
      throw new TypeError(`${label} has unexpected fields`);
    }
    const output: Record<string, unknown> = {};
    for (const key of expected) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
        throw new TypeError(`${label}.${key} must be an enumerable data property`);
      }
      output[key] = descriptor.value;
    }
    return output;
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`${label} could not be inspected`);
  }
}

function arrayValues(value: unknown, label: string): readonly unknown[] {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
      throw new TypeError(`${label} must be a plain array`);
    }
    const keys = Reflect.ownKeys(value);
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, 'value')
      || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
      throw new TypeError(`${label} must have a data length`);
    }
    const expected = Array.from({ length: lengthDescriptor.value }, (_, index) => String(index));
    if (keys.length !== expected.length + 1 || !keys.includes('length')
      || expected.some((key) => !keys.includes(key))) {
      throw new TypeError(`${label} must be a dense plain array`);
    }
    return expected.map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
        throw new TypeError(`${label}[${key}] must be an enumerable data property`);
      }
      return descriptor.value;
    });
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`${label} could not be inspected`);
  }
}

function canonicalString(value: unknown, label: string, maximum = 512): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || value.trim() !== value || value.normalize('NFC') !== value
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} is not a bounded canonical string`);
  }
  return value;
}

function localPath(value: unknown, label: string): string {
  const path = canonicalString(value, label, 384);
  const segments = path.split('/');
  if (path.startsWith('/') || path.includes('\\') || path.includes('://')
    || segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new TypeError(`${label} must be a local relative path`);
  }
  return path;
}

function sha256(value: unknown, label: string): string {
  const hash = canonicalString(value, label, 64);
  if (!/^[0-9a-f]{64}$/u.test(hash)) throw new TypeError(`${label} must be lowercase SHA-256`);
  return hash;
}

function calendarDate(value: unknown, label: string): string {
  const date = canonicalString(value, label, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(date);
  if (!match) throw new TypeError(`${label} is invalid`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]!) {
    throw new TypeError(`${label} is invalid`);
  }
  return date;
}

function finite(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || value < minimum || value > maximum) {
    throw new TypeError(`${label} is outside its finite range`);
  }
  return value;
}

function integer(value: unknown, label: string, minimum: number, maximum: number): number {
  const number = finite(value, label, minimum, maximum);
  if (!Number.isSafeInteger(number)) throw new TypeError(`${label} must be a safe integer`);
  return number;
}

function nullableInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number | null {
  return value === null ? null : integer(value, label, minimum, maximum);
}

function uniqueStrings(value: unknown, label: string): readonly string[] {
  const output = arrayValues(value, label).map((entry, index) =>
    canonicalString(entry, `${label}[${index}]`, 128));
  if (new Set(output).size !== output.length) throw new RangeError(`${label} contains duplicates`);
  return Object.freeze(output);
}

function uniqueIntegers(value: unknown, label: string): readonly number[] {
  const output = arrayValues(value, label).map((entry, index) =>
    integer(entry, `${label}[${index}]`, 1, 384_000));
  if (new Set(output).size !== output.length) throw new RangeError(`${label} contains duplicates`);
  return Object.freeze(output);
}

function canonicalPolicy(value: unknown): AudioAssetTechnicalPolicy | null {
  if (value === null) return null;
  const input = exactPlainData(value, POLICY_KEYS, 'audio asset technical policy');
  const allowedCodecs = uniqueStrings(input.allowedCodecs, 'allowed audio codecs');
  const allowedSampleRates = uniqueIntegers(input.allowedSampleRates, 'allowed audio sample rates');
  const allowedTags = uniqueStrings(input.allowedTags, 'allowed audio tags');
  if (allowedCodecs.length < 1 || allowedSampleRates.length < 1 || allowedTags.length < 1) {
    throw new RangeError('non-empty audio technical policy sets are required');
  }
  const minDurationMs = integer(input.minDurationMs, 'minimum audio duration', 1, 86_400_000);
  const maxDurationMs = integer(input.maxDurationMs, 'maximum audio duration', 1, 86_400_000);
  const minIntegratedLufs = finite(input.minIntegratedLufs, 'minimum integrated LUFS', -120, 0);
  const maxIntegratedLufs = finite(input.maxIntegratedLufs, 'maximum integrated LUFS', -120, 0);
  const maxTruePeakDb = finite(input.maxTruePeakDb, 'maximum true peak', -120, 12);
  if (minDurationMs > maxDurationMs || minIntegratedLufs > maxIntegratedLufs) {
    throw new RangeError('audio technical policy minimum exceeds maximum');
  }
  return Object.freeze({
    allowedCodecs,
    allowedSampleRates,
    minDurationMs,
    maxDurationMs,
    minIntegratedLufs,
    maxIntegratedLufs,
    maxTruePeakDb,
    allowedTags,
  });
}

function canonicalSourceUrl(value: unknown, label: string): string {
  const source = canonicalString(value, label, 1_024);
  try {
    const parsed = new URL(source);
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== ''
      || parsed.hostname === '' || parsed.href !== source) {
      throw new TypeError(`${label} must be a canonical absolute HTTPS URL`);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes(label)) throw error;
    throw new TypeError(`${label} must be a canonical absolute HTTPS URL`);
  }
  return source;
}

function canonicalLoops(
  startValue: unknown,
  endValue: unknown,
  durationMs: number,
  label: string,
): readonly [number | null, number | null] {
  const start = nullableInteger(startValue, `${label} loop start`, 0, durationMs);
  const end = nullableInteger(endValue, `${label} loop end`, 0, durationMs);
  if ((start === null) !== (end === null)
    || (start !== null && end !== null && start >= end)) {
    throw new RangeError(`${label} loop points must be a valid pair`);
  }
  return Object.freeze([start, end] as const);
}

function canonicalRow(
  value: unknown,
  policy: AudioAssetTechnicalPolicy,
  index: number,
): AudioAssetRightsRow {
  const input = exactPlainData(value, RIGHTS_ROW_KEYS, `audio rights row ${index}`);
  const id = canonicalString(input.id, `audio rights row ${index} id`, 128);
  const file = localPath(input.file, `audio rights row ${index} file`);
  if (!(AUDIO_ASSET_ROLES as readonly unknown[]).includes(input.role)) {
    throw new TypeError(`audio rights row ${index} role is invalid`);
  }
  const role = input.role as AudioAssetRole;
  const sourceUrl = canonicalSourceUrl(input.sourceUrl, `audio rights row ${index} source URL`);
  const creator = canonicalString(input.creator, `audio rights row ${index} creator`, 256);
  const licenseId = canonicalString(input.licenseId, `audio rights row ${index} license`, 128);
  const licenseSnapshot = localPath(
    input.licenseSnapshot,
    `audio rights row ${index} license snapshot`,
  );
  if (input.commercialUse !== true || input.derivatives !== true || input.redistribution !== true) {
    throw new RangeError(`audio rights row ${index} has incompatible rights flags`);
  }
  const attribution = input.attribution === null
    ? null
    : canonicalString(input.attribution, `audio rights row ${index} attribution`, 1_024);
  const acquiredOn = calendarDate(input.acquiredOn, `audio rights row ${index} acquisition date`);
  const proofFile = localPath(input.proofFile, `audio rights row ${index} proof file`);
  const processing = uniqueStrings(input.processing, `audio rights row ${index} processing`);
  const originalSha256 = sha256(input.originalSha256, `audio rights row ${index} original hash`);
  const derivativeSha256 = sha256(
    input.derivativeSha256,
    `audio rights row ${index} derivative hash`,
  );
  const version = integer(input.version, `audio rights row ${index} version`, 1, 1_000_000);
  const codec = canonicalString(input.codec, `audio rights row ${index} codec`, 64);
  if (!policy.allowedCodecs.includes(codec)) {
    throw new RangeError(`audio rights row ${index} codec is outside the supplied policy`);
  }
  const durationMs = integer(
    input.durationMs,
    `audio rights row ${index} duration`,
    policy.minDurationMs,
    policy.maxDurationMs,
  );
  const sampleRate = integer(input.sampleRate, `audio rights row ${index} sample rate`, 1, 384_000);
  if (!policy.allowedSampleRates.includes(sampleRate)) {
    throw new RangeError(`audio rights row ${index} sample rate is outside the supplied policy`);
  }
  if (input.channels !== 1 && input.channels !== 2) {
    throw new RangeError(`audio rights row ${index} channel count is invalid`);
  }
  const channels = input.channels;
  const [loopStartMs, loopEndMs] = canonicalLoops(
    input.loopStartMs,
    input.loopEndMs,
    durationMs,
    `audio rights row ${index}`,
  );
  const integratedLufs = finite(
    input.integratedLufs,
    `audio rights row ${index} integrated LUFS`,
    policy.minIntegratedLufs,
    policy.maxIntegratedLufs,
  );
  const truePeakDb = finite(
    input.truePeakDb,
    `audio rights row ${index} true peak`,
    -120,
    policy.maxTruePeakDb,
  );
  const tags = uniqueStrings(input.tags, `audio rights row ${index} tags`);
  if (tags.some((tag) => !policy.allowedTags.includes(tag))) {
    throw new RangeError(`audio rights row ${index} tag is outside the supplied policy`);
  }
  return Object.freeze({
    id, file, role, sourceUrl, creator, licenseId, licenseSnapshot,
    commercialUse: true, derivatives: true, redistribution: true, attribution,
    acquiredOn, proofFile, processing, originalSha256, derivativeSha256, version,
    codec, durationMs, sampleRate, channels, loopStartMs, loopEndMs,
    integratedLufs, truePeakDb, tags,
  });
}

function canonicalObservation(value: unknown, index: number): AudioAssetObservation {
  const input = exactPlainData(value, OBSERVATION_KEYS, `audio asset observation ${index}`);
  const durationMs = integer(input.durationMs, `audio observation ${index} duration`, 1, 86_400_000);
  const [loopStartMs, loopEndMs] = canonicalLoops(
    input.loopStartMs,
    input.loopEndMs,
    durationMs,
    `audio observation ${index}`,
  );
  if (input.channels !== 1 && input.channels !== 2) {
    throw new RangeError(`audio observation ${index} channel count is invalid`);
  }
  return Object.freeze({
    id: canonicalString(input.id, `audio observation ${index} id`, 128),
    file: localPath(input.file, `audio observation ${index} file`),
    originalSha256: sha256(input.originalSha256, `audio observation ${index} original hash`),
    derivativeSha256: sha256(input.derivativeSha256, `audio observation ${index} derivative hash`),
    codec: canonicalString(input.codec, `audio observation ${index} codec`, 64),
    durationMs,
    sampleRate: integer(input.sampleRate, `audio observation ${index} sample rate`, 1, 384_000),
    channels: input.channels,
    loopStartMs,
    loopEndMs,
    integratedLufs: finite(input.integratedLufs, `audio observation ${index} LUFS`, -120, 0),
    truePeakDb: finite(input.truePeakDb, `audio observation ${index} true peak`, -120, 12),
  });
}

function canonicalEvidence(value: unknown, index: number): AudioRightsEvidenceObservation {
  const input = exactPlainData(value, EVIDENCE_KEYS, `audio rights evidence ${index}`);
  return Object.freeze({
    file: localPath(input.file, `audio rights evidence ${index} file`),
    sha256: sha256(input.sha256, `audio rights evidence ${index} hash`),
  });
}

function sameObservation(row: AudioAssetRightsRow, observed: AudioAssetObservation): boolean {
  return row.id === observed.id && row.file === observed.file
    && row.originalSha256 === observed.originalSha256
    && row.derivativeSha256 === observed.derivativeSha256
    && row.codec === observed.codec && row.durationMs === observed.durationMs
    && row.sampleRate === observed.sampleRate && row.channels === observed.channels
    && row.loopStartMs === observed.loopStartMs && row.loopEndMs === observed.loopEndMs
    && row.integratedLufs === observed.integratedLufs && row.truePeakDb === observed.truePeakDb;
}

function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalBundle(input: AudioAssetRightsBundle): CanonicalBundle {
  const bundleInput = exactPlainData(input, BUNDLE_KEYS, 'audio rights bundle');
  const rawRows = arrayValues(bundleInput.rows, 'audio rights rows');
  const policy = canonicalPolicy(bundleInput.technicalPolicy);
  if (rawRows.length > 0 && policy === null) {
    throw new RangeError('recorded audio intake requires an explicit measured technical policy');
  }
  const rows = policy === null
    ? Object.freeze([] as AudioAssetRightsRow[])
    : Object.freeze(rawRows.map((row, index) => canonicalRow(row, policy, index)));
  const observations = Object.freeze(arrayValues(bundleInput.observations, 'audio observations')
    .map(canonicalObservation));
  const evidence = Object.freeze(arrayValues(bundleInput.evidence, 'audio rights evidence')
    .map(canonicalEvidence));
  const referencedAssetIds = Object.freeze(arrayValues(
    bundleInput.referencedAssetIds,
    'referenced audio asset ids',
  ).map((id, index) => canonicalString(id, `referenced audio asset id ${index}`, 128)));

  const unique = (values: readonly string[], label: string): void => {
    if (new Set(values).size !== values.length) throw new RangeError(`${label} contains duplicates`);
  };
  unique(rows.map((row) => row.id), 'audio rights ids');
  unique(rows.map((row) => row.file), 'audio rights files');
  unique(observations.map((row) => row.id), 'audio observation ids');
  unique(observations.map((row) => row.file), 'audio observation files');
  unique(evidence.map((row) => row.file), 'audio rights evidence files');
  unique(referencedAssetIds, 'referenced audio asset ids');

  if (rows.length !== observations.length || rows.length !== referencedAssetIds.length) {
    throw new RangeError('audio rights rows, observed files, and reachable asset ids must match exactly');
  }
  const observationById = new Map(observations.map((row) => [row.id, row]));
  const referenced = new Set(referencedAssetIds);
  for (const row of rows) {
    const observed = observationById.get(row.id);
    if (!observed || !sameObservation(row, observed)) {
      throw new RangeError(`audio asset ${row.id} observation does not match its rights row`);
    }
    if (!referenced.has(row.id)) throw new RangeError(`audio asset ${row.id} is orphaned`);
  }

  const expectedEvidence = new Set(rows.flatMap((row) => [row.licenseSnapshot, row.proofFile]));
  const observedEvidence = new Set(evidence.map((row) => row.file));
  if (expectedEvidence.size !== observedEvidence.size
    || [...expectedEvidence].some((file) => !observedEvidence.has(file))) {
    throw new RangeError('audio licence snapshots and proof files must be observed exactly');
  }

  return Object.freeze({
    rows: Object.freeze([...rows].sort((left, right) => lexicalCompare(left.id, right.id))),
    observations: Object.freeze(
      [...observations].sort((left, right) => lexicalCompare(left.id, right.id)),
    ),
    evidence: Object.freeze(
      [...evidence].sort((left, right) => lexicalCompare(left.file, right.file)),
    ),
    referencedAssetIds: Object.freeze([...referencedAssetIds].sort()),
    technicalPolicy: policy,
  });
}

function digestHash(source: string, seed: number): string {
  let hash = seed >>> 0;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85EBCA6B) >>> 0;
  hash ^= hash >>> 13;
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function audioAssetRightsManifestDigest(input: AudioAssetRightsBundle): string {
  const bundle = canonicalBundle(input);
  const source = JSON.stringify({
    version: AUDIO_ASSET_RIGHTS_MANIFEST_VERSION,
    rows: bundle.rows,
    observations: bundle.observations,
    evidence: bundle.evidence,
    referencedAssetIds: bundle.referencedAssetIds,
    technicalPolicy: bundle.technicalPolicy,
  });
  return `arm${AUDIO_ASSET_RIGHTS_MANIFEST_VERSION}-${DIGEST_SEEDS
    .map((seed) => digestHash(source, seed)).join('')}`;
}

export function auditAudioAssetRightsManifest(
  input: AudioAssetRightsAuditInput,
): AudioAssetRightsAudit {
  const auditInput = exactPlainData(input, AUDIT_INPUT_KEYS, 'audio rights audit input');
  const expectedDigest = canonicalString(
    auditInput.expectedDigest,
    'expected audio rights digest',
    96,
  );
  const bundle = canonicalBundle(Object.freeze({
    rows: auditInput.rows as readonly unknown[],
    observations: auditInput.observations as readonly unknown[],
    evidence: auditInput.evidence as readonly unknown[],
    referencedAssetIds: auditInput.referencedAssetIds as readonly unknown[],
    technicalPolicy: auditInput.technicalPolicy as AudioAssetTechnicalPolicy | null,
  }));
  const digest = audioAssetRightsManifestDigest(bundle);
  if (digest !== expectedDigest) {
    throw new RangeError(`audio rights manifest digest changed: ${digest}`);
  }
  return Object.freeze({
    version: AUDIO_ASSET_RIGHTS_MANIFEST_VERSION,
    rowCount: bundle.rows.length,
    observedAssetCount: bundle.observations.length,
    evidenceFileCount: bundle.evidence.length,
    referencedAssetCount: bundle.referencedAssetIds.length,
    digest,
    technicalPolicy: bundle.technicalPolicy === null ? 'not-required-empty' : 'provided',
  });
}

export const AUDIO_ASSET_RIGHTS_MANIFEST: readonly AudioAssetRightsRow[] = PILOT_AUDIO_RIGHTS_ROWS;

const CURRENT_RIGHTS_BUNDLE: AudioAssetRightsBundle = Object.freeze({
  rows: AUDIO_ASSET_RIGHTS_MANIFEST,
  observations: PILOT_AUDIO_RIGHTS_OBSERVATIONS,
  evidence: PILOT_AUDIO_RIGHTS_EVIDENCE,
  referencedAssetIds: PILOT_AUDIO_REFERENCED_IDS,
  technicalPolicy: PILOT_AUDIO_TECHNICAL_POLICY,
});

/** Literal intake pin binds rows, independent render observations, optimized
 * media hashes, both public evidence hashes and the explicit technical policy.
 * Changing that authority requires a deliberate evidence-backed intake update. */
export const AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST =
  'arm1-d8353ea7165fd424a6c58e3eb71a2a50' as const;

export const AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT = auditAudioAssetRightsManifest({
  ...CURRENT_RIGHTS_BUNDLE,
  expectedDigest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
});
