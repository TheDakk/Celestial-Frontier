/* Arc 5 compact ownership delta persistence.

   Arc 4 remains the persisted source of catalogue, world-address, biology,
   and legacy compatibility truth. Arc 5 persists only a strict manifest and
   four fixed generic delta shards. Every current write replaces all five
   namespaces, including canonical empty tails, so shrinkage cannot retain
   stale rows. A valid legacy v1 digest certificate is read losslessly and is
   upgraded to the zero-delta v2 representation without advancing ownership,
   consuming an F4 ordinal, or inventing a receipt. */
import {
  MAX_OWNERSHIP_REVISION,
  OWNERSHIP_DATA_BUDGET,
  OWNERSHIP_STATE_SCHEMA,
  OWNERSHIP_STATE_SCHEMA_V2,
  OWNERSHIP_STATE_VERSION,
  OWNERSHIP_STATE_VERSION_V2,
  canonicalJson,
  canonicalizeData,
  isCaptureCapacityScenariosV1,
  isOwnershipStateV2,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  sha256Hex,
  utf8ByteLength,
  type CanonicalJson,
  type CaptureCapacityScenariosV1,
  type OwnershipAddressResolver,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  MAX_OWNERSHIP_DELTA_ROWS_V2,
  OWNERSHIP_DELTA_SCHEMA_V2,
  OWNERSHIP_DELTA_VERSION_V2,
  applyOwnershipDeltaV2,
  createCaptureOwnershipSourceProjectionSuccessorV2,
  createOwnershipSourceProjectionSuccessorV2,
  decodeOwnershipDeltaV2,
  deriveOwnershipDeltaSuccessorV2,
  deriveOwnershipDeltaV2,
  encodeOwnershipDeltaV2,
  ownershipDeltaDigestV2,
  ownershipDeltaMirrorV2,
  isOwnershipSuccessorV2,
  type OwnershipDeltaRowV2,
  type OwnershipDeltaV2,
} from '@cf/domain-acquisition/ownership-v2-internal';
import {
  prepareArc4OwnershipWrite,
  readArc4Ownership,
} from './arc4-ownership.js';
import {
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
  type V5Segment,
} from './migration-v5.js';

const LEGACY_ARC5_OWNERSHIP_MIGRATION_VERSION = 1 as const;
const LEGACY_ARC5_OWNERSHIP_MIGRATION_SCHEMA = 'cf-v2-ownership-v1-to-v2/v1' as const;

export const ARC5_OWNERSHIP_MIGRATION_VERSION = 2 as const;
export const ARC5_OWNERSHIP_FIXED_SHARDS = 4 as const;
export const ARC5_OWNERSHIP_MIGRATION_PREFIX = 'arc5.ownership.' as const;
export const ARC5_OWNERSHIP_MIGRATION_NAMESPACE = 'arc5.ownership.migration' as const;
export const ARC5_OWNERSHIP_DELTA_PREFIX = 'arc5.ownership.delta.' as const;
export const ARC5_OWNERSHIP_MIGRATION_SCHEMA = 'cf-v2-ownership-v1-to-v2/v2' as const;
export const ARC5_OWNERSHIP_DELTA_SHARD_SCHEMA = 'cf-v2-ownership-delta-shard/v1' as const;
export const ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET = Object.freeze({
  segment: 'player' as const,
  namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
});

export interface Arc5OwnershipExtensionTargetV2 {
  readonly segment: V5Segment;
  readonly namespace: string;
}

export const ARC5_OWNERSHIP_EXTENSION_TARGETS = Object.freeze([
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  ...Array.from({ length: ARC5_OWNERSHIP_FIXED_SHARDS }, (_, index) => Object.freeze({
    segment: 'creatures' as const,
    namespace: `${ARC5_OWNERSHIP_DELTA_PREFIX}${index}`,
  })),
]) as readonly [
  Arc5OwnershipExtensionTargetV2,
  Arc5OwnershipExtensionTargetV2,
  Arc5OwnershipExtensionTargetV2,
  Arc5OwnershipExtensionTargetV2,
  Arc5OwnershipExtensionTargetV2,
];

const TARGET_IDENTITIES = new Set(ARC5_OWNERSHIP_EXTENSION_TARGETS.map(
  ({ segment, namespace }) => `${segment}\u0000${namespace}`,
));

interface Arc5OwnershipMigrationCertificateV1 {
  readonly schema: typeof LEGACY_ARC5_OWNERSHIP_MIGRATION_SCHEMA;
  readonly version: typeof LEGACY_ARC5_OWNERSHIP_MIGRATION_VERSION;
  readonly sourceSchema: typeof OWNERSHIP_STATE_SCHEMA;
  readonly sourceVersion: typeof OWNERSHIP_STATE_VERSION;
  readonly sourceRevision: number;
  readonly sourceMode: OwnershipStateV1['mode'];
  readonly sourceDigest: string;
  readonly targetSchema: typeof OWNERSHIP_STATE_SCHEMA_V2;
  readonly targetVersion: typeof OWNERSHIP_STATE_VERSION_V2;
  readonly targetRevision: number;
  readonly targetMode: OwnershipStateV2['mode'];
  readonly targetDigest: string;
}

export interface Arc5OwnershipMigrationManifestV2 {
  readonly schema: typeof ARC5_OWNERSHIP_MIGRATION_SCHEMA;
  readonly version: typeof ARC5_OWNERSHIP_MIGRATION_VERSION;
  readonly sourceSchema: typeof OWNERSHIP_STATE_SCHEMA;
  readonly sourceVersion: typeof OWNERSHIP_STATE_VERSION;
  readonly sourceRevision: number;
  readonly sourceMode: OwnershipStateV1['mode'];
  readonly sourceDigest: string;
  readonly targetSchema: typeof OWNERSHIP_STATE_SCHEMA_V2;
  readonly targetVersion: typeof OWNERSHIP_STATE_VERSION_V2;
  readonly targetRevision: number;
  readonly targetMode: OwnershipStateV2['mode'];
  readonly targetDigest: string;
  readonly deltaSchema: typeof OWNERSHIP_DELTA_SCHEMA_V2;
  readonly deltaVersion: typeof OWNERSHIP_DELTA_VERSION_V2;
  readonly deltaDigest: string;
  readonly deltaRowCount: number;
  readonly fixedShardCount: typeof ARC5_OWNERSHIP_FIXED_SHARDS;
  readonly shardDigests: readonly [string, string, string, string];
}

export interface Arc5OwnershipMigrationEvidenceV1 {
  readonly representationVersion: 1;
  readonly sourceDigest: string;
  readonly targetDigest: string;
}

export interface Arc5OwnershipMigrationEvidenceV2 {
  readonly representationVersion: typeof ARC5_OWNERSHIP_MIGRATION_VERSION;
  readonly sourceDigest: string;
  readonly targetDigest: string;
  readonly deltaDigest: string;
  readonly deltaRowCount: number;
  readonly shardCount: typeof ARC5_OWNERSHIP_FIXED_SHARDS;
  readonly shardDigests: readonly [string, string, string, string];
}

export type Arc5OwnershipMigrationEvidence =
  | Arc5OwnershipMigrationEvidenceV1
  | Arc5OwnershipMigrationEvidenceV2;

export type Arc5OwnershipMigrationReadOutcome =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'loaded';
      readonly state: OwnershipStateV2;
      readonly evidence: Arc5OwnershipMigrationEvidence;
    }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export type Arc5OwnershipMigrationProtectionReason =
  | 'extensions-corrupt'
  | 'source-absent'
  | 'source-corrupt'
  | 'source-future'
  | 'target-corrupt'
  | 'target-future'
  | 'source-drift'
  | 'extension-bounds';

export type Arc5OwnershipWriteTupleV2 = readonly [
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
  V5ExtensionWrite,
];

export interface PreparedArc5OwnershipMigrationV2 {
  readonly kind: 'prepared';
  readonly state: OwnershipStateV2;
  readonly evidence: Arc5OwnershipMigrationEvidenceV2;
  readonly writes: Arc5OwnershipWriteTupleV2;
  readonly extensions: V5Extensions;
  readonly representationUpgrade?: 'legacy-v1';
}

/** Historical type name retained for source compatibility; its shape is now
 * the exact five-write v2 representation. */
export type PreparedArc5OwnershipMigrationV1 = PreparedArc5OwnershipMigrationV2;

export type Arc5OwnershipMigrationSuccessorProtectionReason =
  | 'base-absent'
  | 'base-corrupt'
  | 'base-future'
  | 'base-source-drift'
  | 'successor-absent'
  | 'successor-corrupt'
  | 'successor-future'
  | 'successor-conflict'
  | 'target-corrupt'
  | 'extension-bounds';

export interface PreparedArc5OwnershipMigrationSuccessorV2 {
  readonly kind: 'prepared';
  readonly previousState: OwnershipStateV2;
  readonly state: OwnershipStateV2;
  readonly evidence: Arc5OwnershipMigrationEvidenceV2;
  readonly writes: Arc5OwnershipWriteTupleV2;
  readonly extensions: V5Extensions;
}

export type PreparedArc5OwnershipMigrationSuccessorV1 =
  PreparedArc5OwnershipMigrationSuccessorV2;

export type Arc5OwnershipMigrationSuccessorPreparation =
  | PreparedArc5OwnershipMigrationSuccessorV2
  | {
      readonly kind: 'protected';
      readonly reason: Arc5OwnershipMigrationSuccessorProtectionReason;
      readonly version?: number;
      readonly expectedRevision?: number;
      readonly actualRevision?: number;
    };

export type Arc5OwnershipV2SuccessorProtectionReason =
  | 'base-absent'
  | 'base-corrupt'
  | 'base-future'
  | 'base-source-drift'
  | 'successor-conflict'
  | 'target-corrupt'
  | 'extension-bounds';

export type Arc5OwnershipV2SuccessorPreparation =
  | PreparedArc5OwnershipMigrationSuccessorV2
  | {
      readonly kind: 'protected';
      readonly reason: Arc5OwnershipV2SuccessorProtectionReason;
      readonly version?: number;
      readonly expectedRevision?: number;
      readonly actualRevision?: number;
    };

export type Arc5OwnershipMigrationPreparation =
  | PreparedArc5OwnershipMigrationV2
  | {
      readonly kind: 'already-loaded';
      readonly state: OwnershipStateV2;
      readonly evidence: Arc5OwnershipMigrationEvidenceV2;
      readonly writes: readonly [];
      readonly extensions: V5Extensions;
    }
  | {
      readonly kind: 'protected';
      readonly reason: Arc5OwnershipMigrationProtectionReason;
      readonly version?: number;
    };

export interface CommittedArc5OwnershipStateV2 {
  readonly state: OwnershipStateV2;
  readonly evidence: Arc5OwnershipMigrationEvidenceV2;
}

const EXTENSION_DATA_BUDGET = Object.freeze({
  ...OWNERSHIP_DATA_BUDGET,
  maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
  maxCharacters: 1_200_000,
});
const EMPTY_WRITES = Object.freeze([]) as readonly [];

type Inventory =
  | { readonly kind: 'absent' }
  | { readonly kind: 'legacy'; readonly manifest: V5ExtensionCarrier }
  | { readonly kind: 'current' }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'corrupt' };

type CertificateParse =
  | { readonly kind: 'current'; readonly certificate: Arc5OwnershipMigrationCertificateV1 }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'corrupt' };

type SourceRead =
  | { readonly kind: 'loaded'; readonly state: OwnershipStateV1 }
  | { readonly kind: 'absent' }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'corrupt' };

type PresentInspection =
  | {
      readonly kind: 'loaded';
      readonly state: OwnershipStateV2;
      readonly evidence: Arc5OwnershipMigrationEvidence;
    }
  | { readonly kind: 'target-future'; readonly version: number }
  | { readonly kind: 'target-corrupt' }
  | { readonly kind: 'source-absent' }
  | { readonly kind: 'source-future'; readonly version: number }
  | { readonly kind: 'source-corrupt' }
  | { readonly kind: 'source-drift' };

interface EncodedShard {
  readonly write: V5ExtensionWrite;
  readonly digest: string;
  readonly start: number;
  readonly end: number;
}

interface EncodedCurrentV2 {
  readonly state: OwnershipStateV2;
  readonly delta: OwnershipDeltaV2;
  readonly evidence: Arc5OwnershipMigrationEvidenceV2;
  readonly writes: Arc5OwnershipWriteTupleV2;
}

interface CapturedPreparationInput {
  readonly extensions: unknown;
  readonly resolver: OwnershipAddressResolver;
}

interface CapturedSuccessorPreparationInput {
  readonly baseExtensions: unknown;
  readonly parent: OwnershipStateV2;
  readonly successorExtensions: unknown;
  readonly successor: OwnershipStateV1;
  readonly resolver: OwnershipAddressResolver;
}

interface CapturedCaptureSuccessorPreparationInput {
  readonly baseExtensions: unknown;
  readonly parent: OwnershipStateV2;
  readonly successorExtensions: unknown;
  readonly scenarios: CaptureCapacityScenariosV1;
  readonly scenarioIndex: number;
  readonly resolver: OwnershipAddressResolver;
}

interface CapturedCompositeSuccessorPreparationInput extends CapturedSuccessorPreparationInput {
  readonly successorV2: OwnershipStateV2;
}

interface CapturedV2SuccessorPreparationInput {
  readonly baseExtensions: unknown;
  readonly parent: OwnershipStateV2;
  readonly successor: OwnershipStateV2;
  readonly resolver: OwnershipAddressResolver;
}

class Arc5CarrierError extends Error {
  readonly code: 'bounds' | 'corrupt' | 'future';
  readonly version: number | null;

  constructor(code: Arc5CarrierError['code'], message: string, version: number | null = null) {
    super(message);
    this.name = 'Arc5CarrierError';
    this.code = code;
    this.version = version;
  }
}

function capturePlainInput(
  value: unknown,
  fields: readonly string[],
): Readonly<Record<string, unknown>> | null {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key === 'symbol')) return null;
    const actual = (keys as string[]).sort();
    const expected = [...fields].sort();
    if (actual.length !== expected.length
      || actual.some((key, index) => key !== expected[index])) return null;
    const captured: Record<string, unknown> = {};
    for (const field of fields) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
        || descriptor.get !== undefined || descriptor.set !== undefined) return null;
      captured[field] = descriptor.value;
    }
    return Object.freeze(captured);
  } catch {
    return null;
  }
}

function capturePreparationInput(value: unknown): CapturedPreparationInput | null {
  const captured = capturePlainInput(value, ['extensions', 'resolver']);
  if (captured === null || captured.resolver === null || typeof captured.resolver !== 'object') return null;
  return Object.freeze({
    extensions: captured.extensions,
    resolver: captured.resolver as OwnershipAddressResolver,
  });
}

function captureSuccessorPreparationInput(value: unknown): CapturedSuccessorPreparationInput | null {
  const captured = capturePlainInput(value, [
    'baseExtensions', 'parent', 'successorExtensions', 'successor', 'resolver',
  ]);
  if (captured === null || captured.parent === null || typeof captured.parent !== 'object'
    || captured.successor === null || typeof captured.successor !== 'object'
    || captured.resolver === null || typeof captured.resolver !== 'object') return null;
  return Object.freeze({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent as OwnershipStateV2,
    successorExtensions: captured.successorExtensions,
    successor: captured.successor as OwnershipStateV1,
    resolver: captured.resolver as OwnershipAddressResolver,
  });
}

function captureCaptureSuccessorPreparationInput(
  value: unknown,
): CapturedCaptureSuccessorPreparationInput | null {
  const captured = capturePlainInput(value, [
    'baseExtensions', 'parent', 'successorExtensions', 'scenarios', 'scenarioIndex', 'resolver',
  ]);
  if (captured === null || !isOwnershipStateV2(captured.parent)
    || !isCaptureCapacityScenariosV1(captured.scenarios)
    || !Number.isSafeInteger(captured.scenarioIndex) || (captured.scenarioIndex as number) < 0
    || captured.resolver === null || typeof captured.resolver !== 'object') return null;
  return Object.freeze({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent as OwnershipStateV2,
    successorExtensions: captured.successorExtensions,
    scenarios: captured.scenarios,
    scenarioIndex: captured.scenarioIndex as number,
    resolver: captured.resolver as OwnershipAddressResolver,
  });
}

function captureCompositeSuccessorPreparationInput(
  value: unknown,
): CapturedCompositeSuccessorPreparationInput | null {
  const captured = capturePlainInput(value, [
    'baseExtensions', 'parent', 'successorExtensions', 'successor', 'successorV2', 'resolver',
  ]);
  if (captured === null || !isOwnershipStateV2(captured.parent)
    || !isOwnershipStateV2(captured.successorV2)
    || captured.successor === null || typeof captured.successor !== 'object'
    || captured.resolver === null || typeof captured.resolver !== 'object') return null;
  return Object.freeze({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent,
    successorExtensions: captured.successorExtensions,
    successor: captured.successor as OwnershipStateV1,
    successorV2: captured.successorV2,
    resolver: captured.resolver as OwnershipAddressResolver,
  });
}

function captureV2SuccessorPreparationInput(value: unknown): CapturedV2SuccessorPreparationInput | null {
  const captured = capturePlainInput(value, ['baseExtensions', 'parent', 'successor', 'resolver']);
  if (captured === null || captured.parent === null || typeof captured.parent !== 'object'
    || captured.successor === null || typeof captured.successor !== 'object'
    || captured.resolver === null || typeof captured.resolver !== 'object') return null;
  return Object.freeze({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent as OwnershipStateV2,
    successor: captured.successor as OwnershipStateV2,
    resolver: captured.resolver as OwnershipAddressResolver,
  });
}

function strictExtensions(value: unknown): V5Extensions | null {
  try {
    return canonicalizeV5Extensions(canonicalizeData(value, EXTENSION_DATA_BUDGET));
  } catch {
    return null;
  }
}

function locateInventory(extensions: V5Extensions): Inventory {
  const owned: Array<Readonly<{ segment: V5Segment; namespace: string; carrier: V5ExtensionCarrier }>> = [];
  for (const segment of V5_SEGMENTS) {
    for (const [namespace, carrier] of Object.entries(extensions[segment] ?? {})) {
      if (!namespace.startsWith(ARC5_OWNERSHIP_MIGRATION_PREFIX)) continue;
      if (!TARGET_IDENTITIES.has(`${segment}\u0000${namespace}`)) {
        return Object.freeze({ kind: 'corrupt' });
      }
      owned.push(Object.freeze({ segment, namespace, carrier }));
    }
  }
  if (owned.length === 0) return Object.freeze({ kind: 'absent' });
  const manifest = extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE];
  if (owned.length === 1 && manifest !== undefined) {
    if (manifest.version === LEGACY_ARC5_OWNERSHIP_MIGRATION_VERSION) {
      return Object.freeze({ kind: 'legacy', manifest });
    }
    if (manifest.version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
      return Object.freeze({ kind: 'future', version: manifest.version });
    }
    return Object.freeze({ kind: 'corrupt' });
  }
  if (owned.length !== ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    || ARC5_OWNERSHIP_EXTENSION_TARGETS.some(({ segment, namespace }) => (
      extensions[segment]?.[namespace] === undefined
    ))) return Object.freeze({ kind: 'corrupt' });
  let future = 0;
  for (const { segment, namespace } of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
    const version = extensions[segment]![namespace]!.version;
    if (version > future) future = version;
    if (version < ARC5_OWNERSHIP_MIGRATION_VERSION) return Object.freeze({ kind: 'corrupt' });
  }
  if (future > ARC5_OWNERSHIP_MIGRATION_VERSION) {
    return Object.freeze({ kind: 'future', version: future });
  }
  return Object.freeze({ kind: 'current' });
}

function record(value: CanonicalJson, label: string): Readonly<Record<string, CanonicalJson>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Arc5CarrierError('corrupt', `${label} must be an object`);
  }
  return value as Readonly<Record<string, CanonicalJson>>;
}

function exactKeys(
  value: Readonly<Record<string, CanonicalJson>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) {
    throw new Arc5CarrierError('corrupt', `${label} has unknown or missing fields`);
  }
}

function integer(value: CanonicalJson | undefined, maximum: number, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Arc5CarrierError('corrupt', `${label} is invalid`);
  }
  return value;
}

function digest(value: CanonicalJson | undefined, label: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/u.test(value)) {
    throw new Arc5CarrierError('corrupt', `${label} is invalid`);
  }
  return value;
}

function parsedCanonicalJson(raw: string, label: string): Readonly<Record<string, CanonicalJson>> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch {
    throw new Arc5CarrierError('corrupt', `${label} JSON is invalid`);
  }
  let canonical: CanonicalJson;
  try { canonical = canonicalizeData(parsed); } catch {
    throw new Arc5CarrierError('corrupt', `${label} data is invalid`);
  }
  if (canonicalJson(canonical) !== raw) {
    throw new Arc5CarrierError('corrupt', `${label} is not a canonical fixed point`);
  }
  return record(canonical, label);
}

function readSource(extensions: V5Extensions, resolver: OwnershipAddressResolver): SourceRead {
  const source = readArc4Ownership(extensions, resolver);
  if (source.kind === 'loaded') return Object.freeze({ kind: 'loaded', state: source.state });
  if (source.kind === 'future-version') {
    return Object.freeze({ kind: 'future', version: source.version });
  }
  return Object.freeze({ kind: source.kind });
}

function parseLegacyCertificate(raw: string): CertificateParse {
  let certificate: Readonly<Record<string, CanonicalJson>>;
  try { certificate = parsedCanonicalJson(raw, 'Arc 5 legacy certificate'); }
  catch { return Object.freeze({ kind: 'corrupt' }); }
  try {
    exactKeys(certificate, [
      'schema', 'version', 'sourceSchema', 'sourceVersion', 'sourceRevision',
      'sourceMode', 'sourceDigest', 'targetSchema', 'targetVersion',
      'targetRevision', 'targetMode', 'targetDigest',
    ], 'Arc 5 legacy certificate');
    const version = integer(certificate.version, Number.MAX_SAFE_INTEGER, 'legacy certificate version');
    if (version < 1) return Object.freeze({ kind: 'corrupt' });
    if (version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
      return Object.freeze({ kind: 'future', version });
    }
    const sourceRevision = integer(
      certificate.sourceRevision, MAX_OWNERSHIP_REVISION, 'legacy source revision',
    );
    const targetRevision = integer(
      certificate.targetRevision, MAX_OWNERSHIP_REVISION, 'legacy target revision',
    );
    const sourceDigest = digest(certificate.sourceDigest, 'legacy source digest');
    const targetDigest = digest(certificate.targetDigest, 'legacy target digest');
    if (certificate.schema !== LEGACY_ARC5_OWNERSHIP_MIGRATION_SCHEMA
      || version !== LEGACY_ARC5_OWNERSHIP_MIGRATION_VERSION
      || certificate.sourceSchema !== OWNERSHIP_STATE_SCHEMA
      || certificate.sourceVersion !== OWNERSHIP_STATE_VERSION
      || (certificate.sourceMode !== 'current' && certificate.sourceMode !== 'legacy-protected')
      || certificate.targetSchema !== OWNERSHIP_STATE_SCHEMA_V2
      || certificate.targetVersion !== OWNERSHIP_STATE_VERSION_V2
      || targetRevision !== sourceRevision
      || (certificate.targetMode !== 'current' && certificate.targetMode !== 'legacy-protected')) {
      return Object.freeze({ kind: 'corrupt' });
    }
    return Object.freeze({
      kind: 'current',
      certificate: Object.freeze({
        schema: LEGACY_ARC5_OWNERSHIP_MIGRATION_SCHEMA,
        version: LEGACY_ARC5_OWNERSHIP_MIGRATION_VERSION,
        sourceSchema: OWNERSHIP_STATE_SCHEMA,
        sourceVersion: OWNERSHIP_STATE_VERSION,
        sourceRevision,
        sourceMode: certificate.sourceMode,
        sourceDigest,
        targetSchema: OWNERSHIP_STATE_SCHEMA_V2,
        targetVersion: OWNERSHIP_STATE_VERSION_V2,
        targetRevision,
        targetMode: certificate.targetMode,
        targetDigest,
      }),
    });
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
}

function inspectLegacy(
  extensions: V5Extensions,
  carrier: V5ExtensionCarrier,
  resolver: OwnershipAddressResolver,
): PresentInspection {
  const parsed = parseLegacyCertificate(carrier.json);
  if (parsed.kind === 'future') {
    return Object.freeze({ kind: 'target-future', version: parsed.version });
  }
  if (parsed.kind === 'corrupt') return Object.freeze({ kind: 'target-corrupt' });
  const source = readSource(extensions, resolver);
  if (source.kind === 'absent') return Object.freeze({ kind: 'source-absent' });
  if (source.kind === 'future') return Object.freeze({ kind: 'source-future', version: source.version });
  if (source.kind === 'corrupt') return Object.freeze({ kind: 'source-corrupt' });
  let state: OwnershipStateV2;
  let sourceDigest: string;
  let targetDigest: string;
  try {
    state = migrateOwnershipStateV1ToV2(source.state);
    sourceDigest = ownershipStateDigestV1(source.state);
    targetDigest = ownershipStateDigestV2(state);
  } catch {
    return Object.freeze({ kind: 'target-corrupt' });
  }
  const certificate = parsed.certificate;
  if (certificate.sourceRevision !== source.state.revision
    || certificate.sourceMode !== source.state.mode
    || certificate.sourceDigest !== sourceDigest) return Object.freeze({ kind: 'source-drift' });
  if (certificate.targetRevision !== state.revision
    || certificate.targetMode !== state.mode
    || certificate.targetDigest !== targetDigest) return Object.freeze({ kind: 'target-corrupt' });
  return Object.freeze({
    kind: 'loaded',
    state,
    evidence: Object.freeze({
      representationVersion: 1,
      sourceDigest,
      targetDigest,
    }),
  });
}

function carrierJson(value: unknown): string {
  const json = canonicalJson(value);
  if (json.length > V5_MAX_EXTENSION_JSON_BYTES
    || utf8ByteLength(json) > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new Arc5CarrierError('bounds', 'Arc 5 ownership carrier exceeds its byte bound');
  }
  return json;
}

function makeCarrier(value: unknown): V5ExtensionCarrier {
  return Object.freeze({ version: ARC5_OWNERSHIP_MIGRATION_VERSION, json: carrierJson(value) });
}

function shardValue(
  index: number,
  start: number,
  end: number,
  total: number,
  rows: readonly OwnershipDeltaRowV2[],
): Readonly<Record<string, unknown>> {
  const slice = Object.freeze(rows.slice(start, end));
  return Object.freeze({
    schema: ARC5_OWNERSHIP_DELTA_SHARD_SCHEMA,
    version: ARC5_OWNERSHIP_MIGRATION_VERSION,
    index,
    count: ARC5_OWNERSHIP_FIXED_SHARDS,
    start,
    end,
    total,
    digest: sha256Hex(canonicalJson(slice)),
    rows: slice,
  });
}

function encodedShard(
  index: number,
  start: number,
  end: number,
  rows: readonly OwnershipDeltaRowV2[],
): EncodedShard {
  const value = shardValue(index, start, end, rows.length, rows);
  return Object.freeze({
    write: Object.freeze({
      segment: 'creatures',
      namespace: `${ARC5_OWNERSHIP_DELTA_PREFIX}${index}`,
      carrier: makeCarrier(value),
    }),
    digest: value.digest as string,
    start,
    end,
  });
}

function encodeShards(rows: readonly OwnershipDeltaRowV2[]): readonly EncodedShard[] {
  const result: EncodedShard[] = [];
  let start = 0;
  for (let index = 0; index < ARC5_OWNERSHIP_FIXED_SHARDS; index++) {
    let end = rows.length;
    if (index < ARC5_OWNERSHIP_FIXED_SHARDS - 1 && start < rows.length) {
      let low = start;
      let high = rows.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        try {
          encodedShard(index, start, middle, rows);
          low = middle;
        } catch (error) {
          if (!(error instanceof Arc5CarrierError) || error.code !== 'bounds') throw error;
          high = middle - 1;
        }
      }
      end = low;
      if (end === start) {
        throw new Arc5CarrierError('bounds', 'one Arc 5 delta row exceeds one carrier');
      }
    }
    const shard = encodedShard(index, start, end, rows);
    result.push(shard);
    start = end;
  }
  if (start !== rows.length) {
    throw new Arc5CarrierError('bounds', 'Arc 5 delta exceeds the fixed four-shard inventory');
  }
  return Object.freeze(result);
}

function exactWriteTuple(writes: readonly V5ExtensionWrite[]): Arc5OwnershipWriteTupleV2 {
  if (writes.length !== ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    || writes.some((write, index) => (
      write.segment !== ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      || write.namespace !== ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ))) throw new Arc5CarrierError('corrupt', 'Arc 5 fixed replacement inventory changed');
  return Object.freeze([...writes]) as unknown as Arc5OwnershipWriteTupleV2;
}

function ensureOwnedAggregate(writes: Arc5OwnershipWriteTupleV2): void {
  const owned: Partial<Record<V5Segment, Record<string, V5ExtensionCarrier>>> = {};
  let bytes = 0;
  for (const write of writes) {
    (owned[write.segment] ??= {})[write.namespace] = write.carrier;
    bytes += utf8ByteLength(write.carrier.json);
  }
  if (bytes > V5_MAX_EXTENSION_TOTAL_BYTES) {
    throw new Arc5CarrierError('bounds', 'Arc 5 ownership aggregate exceeds its byte bound');
  }
  try { canonicalizeV5Extensions(owned); } catch {
    throw new Arc5CarrierError('bounds', 'Arc 5 ownership aggregate exceeds v5 bounds');
  }
}

function encodeCurrent(source: OwnershipStateV1, state: OwnershipStateV2): EncodedCurrentV2 {
  let delta: OwnershipDeltaV2;
  try { delta = deriveOwnershipDeltaV2(source, state); }
  catch { throw new Arc5CarrierError('corrupt', 'Arc 5 target cannot be represented as a source delta'); }
  const mirror = ownershipDeltaMirrorV2(delta);
  const deltaRaw = encodeOwnershipDeltaV2(delta);
  if (canonicalJson(mirror) !== deltaRaw || mirror.rows.length > MAX_OWNERSHIP_DELTA_ROWS_V2) {
    throw new Arc5CarrierError('corrupt', 'Arc 5 delta is not its canonical fixed point');
  }
  const shards = encodeShards(mirror.rows);
  const shardDigests = Object.freeze(shards.map((shard) => shard.digest)) as readonly [
    string, string, string, string,
  ];
  const sourceDigest = ownershipStateDigestV1(source);
  const targetDigest = ownershipStateDigestV2(state);
  const deltaDigest = ownershipDeltaDigestV2(delta);
  const evidence: Arc5OwnershipMigrationEvidenceV2 = Object.freeze({
    representationVersion: ARC5_OWNERSHIP_MIGRATION_VERSION,
    sourceDigest,
    targetDigest,
    deltaDigest,
    deltaRowCount: mirror.rows.length,
    shardCount: ARC5_OWNERSHIP_FIXED_SHARDS,
    shardDigests,
  });
  const manifest: Arc5OwnershipMigrationManifestV2 = Object.freeze({
    schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
    version: ARC5_OWNERSHIP_MIGRATION_VERSION,
    sourceSchema: OWNERSHIP_STATE_SCHEMA,
    sourceVersion: OWNERSHIP_STATE_VERSION,
    sourceRevision: source.revision,
    sourceMode: source.mode,
    sourceDigest,
    targetSchema: OWNERSHIP_STATE_SCHEMA_V2,
    targetVersion: OWNERSHIP_STATE_VERSION_V2,
    targetRevision: state.revision,
    targetMode: state.mode,
    targetDigest,
    deltaSchema: OWNERSHIP_DELTA_SCHEMA_V2,
    deltaVersion: OWNERSHIP_DELTA_VERSION_V2,
    deltaDigest,
    deltaRowCount: mirror.rows.length,
    fixedShardCount: ARC5_OWNERSHIP_FIXED_SHARDS,
    shardDigests,
  });
  const manifestWrite: V5ExtensionWrite = Object.freeze({
    ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
    carrier: makeCarrier(manifest),
  });
  const writes = exactWriteTuple([manifestWrite, ...shards.map((shard) => shard.write)]);
  ensureOwnedAggregate(writes);
  return Object.freeze({ state, delta, evidence, writes });
}

interface DecodedManifest {
  readonly sourceRevision: number;
  readonly sourceMode: OwnershipStateV1['mode'];
  readonly sourceDigest: string;
  readonly targetRevision: number;
  readonly targetMode: OwnershipStateV2['mode'];
  readonly targetDigest: string;
  readonly deltaDigest: string;
  readonly deltaRowCount: number;
  readonly shardDigests: readonly [string, string, string, string];
}

function decodeManifest(carrier: V5ExtensionCarrier): DecodedManifest {
  const manifest = parsedCanonicalJson(carrier.json, 'Arc 5 ownership manifest');
  exactKeys(manifest, [
    'schema', 'version', 'sourceSchema', 'sourceVersion', 'sourceRevision',
    'sourceMode', 'sourceDigest', 'targetSchema', 'targetVersion', 'targetRevision',
    'targetMode', 'targetDigest', 'deltaSchema', 'deltaVersion', 'deltaDigest',
    'deltaRowCount', 'fixedShardCount', 'shardDigests',
  ], 'Arc 5 ownership manifest');
  const version = integer(manifest.version, Number.MAX_SAFE_INTEGER, 'Arc 5 manifest version');
  if (version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
    throw new Arc5CarrierError('future', 'Arc 5 manifest is future', version);
  }
  const sourceRevision = integer(
    manifest.sourceRevision, MAX_OWNERSHIP_REVISION, 'Arc 5 source revision',
  );
  const targetRevision = integer(
    manifest.targetRevision, MAX_OWNERSHIP_REVISION, 'Arc 5 target revision',
  );
  const deltaRowCount = integer(
    manifest.deltaRowCount, MAX_OWNERSHIP_DELTA_ROWS_V2, 'Arc 5 delta row count',
  );
  if (manifest.schema !== ARC5_OWNERSHIP_MIGRATION_SCHEMA
    || version !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || manifest.sourceSchema !== OWNERSHIP_STATE_SCHEMA
    || manifest.sourceVersion !== OWNERSHIP_STATE_VERSION
    || (manifest.sourceMode !== 'current' && manifest.sourceMode !== 'legacy-protected')
    || manifest.targetSchema !== OWNERSHIP_STATE_SCHEMA_V2
    || manifest.targetVersion !== OWNERSHIP_STATE_VERSION_V2
    || (manifest.targetMode !== 'current' && manifest.targetMode !== 'legacy-protected')
    || manifest.targetMode !== manifest.sourceMode
    || manifest.deltaSchema !== OWNERSHIP_DELTA_SCHEMA_V2
    || manifest.deltaVersion !== OWNERSHIP_DELTA_VERSION_V2
    || manifest.fixedShardCount !== ARC5_OWNERSHIP_FIXED_SHARDS
    || !Array.isArray(manifest.shardDigests)
    || manifest.shardDigests.length !== ARC5_OWNERSHIP_FIXED_SHARDS) {
    throw new Arc5CarrierError('corrupt', 'Arc 5 manifest identity is invalid');
  }
  const shardDigests = Object.freeze(manifest.shardDigests.map(
    (value) => digest(value, 'Arc 5 manifest shard digest'),
  )) as readonly [string, string, string, string];
  return Object.freeze({
    sourceRevision,
    sourceMode: manifest.sourceMode,
    sourceDigest: digest(manifest.sourceDigest, 'Arc 5 manifest source digest'),
    targetRevision,
    targetMode: manifest.targetMode,
    targetDigest: digest(manifest.targetDigest, 'Arc 5 manifest target digest'),
    deltaDigest: digest(manifest.deltaDigest, 'Arc 5 manifest delta digest'),
    deltaRowCount,
    shardDigests,
  });
}

function decodeDelta(
  extensions: V5Extensions,
  manifest: DecodedManifest,
): OwnershipDeltaV2 {
  const rows: CanonicalJson[] = [];
  let expectedStart = 0;
  for (let index = 0; index < ARC5_OWNERSHIP_FIXED_SHARDS; index++) {
    const namespace = `${ARC5_OWNERSHIP_DELTA_PREFIX}${index}`;
    const shard = parsedCanonicalJson(
      extensions.creatures![namespace]!.json,
      `Arc 5 delta shard ${index}`,
    );
    exactKeys(shard, [
      'schema', 'version', 'index', 'count', 'start', 'end', 'total', 'digest', 'rows',
    ], `Arc 5 delta shard ${index}`);
    const version = integer(shard.version, Number.MAX_SAFE_INTEGER, 'Arc 5 shard version');
    if (version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
      throw new Arc5CarrierError('future', 'Arc 5 delta shard is future', version);
    }
    if (shard.schema !== ARC5_OWNERSHIP_DELTA_SHARD_SCHEMA
      || version !== ARC5_OWNERSHIP_MIGRATION_VERSION
      || shard.index !== index
      || shard.count !== ARC5_OWNERSHIP_FIXED_SHARDS
      || shard.total !== manifest.deltaRowCount) {
      throw new Arc5CarrierError('corrupt', 'Arc 5 delta shard descriptor is invalid');
    }
    const start = integer(shard.start, manifest.deltaRowCount, 'Arc 5 shard start');
    const end = integer(shard.end, manifest.deltaRowCount, 'Arc 5 shard end');
    if (start !== expectedStart || end < start || !Array.isArray(shard.rows)
      || shard.rows.length !== end - start) {
      throw new Arc5CarrierError('corrupt', 'Arc 5 delta shard range is invalid');
    }
    const actualDigest = sha256Hex(canonicalJson(shard.rows));
    if (digest(shard.digest, 'Arc 5 shard digest') !== actualDigest
      || actualDigest !== manifest.shardDigests[index]) {
      throw new Arc5CarrierError('corrupt', 'Arc 5 delta shard digest is invalid');
    }
    rows.push(...shard.rows);
    expectedStart = end;
  }
  if (expectedStart !== manifest.deltaRowCount || rows.length !== manifest.deltaRowCount) {
    throw new Arc5CarrierError('corrupt', 'Arc 5 delta shard inventory is incomplete');
  }
  const raw = canonicalJson({
    schema: OWNERSHIP_DELTA_SCHEMA_V2,
    version: OWNERSHIP_DELTA_VERSION_V2,
    rows,
  });
  let delta: OwnershipDeltaV2;
  try { delta = decodeOwnershipDeltaV2(raw); }
  catch { throw new Arc5CarrierError('corrupt', 'Arc 5 ownership delta is invalid'); }
  if (encodeOwnershipDeltaV2(delta) !== raw
    || ownershipDeltaDigestV2(delta) !== manifest.deltaDigest) {
    throw new Arc5CarrierError('corrupt', 'Arc 5 ownership delta digest is invalid');
  }
  return delta;
}

function currentEvidence(manifest: DecodedManifest): Arc5OwnershipMigrationEvidenceV2 {
  return Object.freeze({
    representationVersion: ARC5_OWNERSHIP_MIGRATION_VERSION,
    sourceDigest: manifest.sourceDigest,
    targetDigest: manifest.targetDigest,
    deltaDigest: manifest.deltaDigest,
    deltaRowCount: manifest.deltaRowCount,
    shardCount: ARC5_OWNERSHIP_FIXED_SHARDS,
    shardDigests: manifest.shardDigests,
  });
}

function inspectCurrent(
  extensions: V5Extensions,
  resolver: OwnershipAddressResolver,
): PresentInspection {
  let manifest: DecodedManifest;
  try {
    manifest = decodeManifest(extensions.player![ARC5_OWNERSHIP_MIGRATION_NAMESPACE]!);
  } catch (error) {
    if (error instanceof Arc5CarrierError && error.code === 'future' && error.version !== null) {
      return Object.freeze({ kind: 'target-future', version: error.version });
    }
    return Object.freeze({ kind: 'target-corrupt' });
  }
  const source = readSource(extensions, resolver);
  if (source.kind === 'absent') return Object.freeze({ kind: 'source-absent' });
  if (source.kind === 'future') return Object.freeze({ kind: 'source-future', version: source.version });
  if (source.kind === 'corrupt') return Object.freeze({ kind: 'source-corrupt' });
  let sourceDigest: string;
  try { sourceDigest = ownershipStateDigestV1(source.state); }
  catch { return Object.freeze({ kind: 'source-corrupt' }); }
  if (manifest.sourceRevision !== source.state.revision
    || manifest.sourceMode !== source.state.mode
    || manifest.sourceDigest !== sourceDigest) return Object.freeze({ kind: 'source-drift' });

  let delta: OwnershipDeltaV2;
  try { delta = decodeDelta(extensions, manifest); }
  catch (error) {
    if (error instanceof Arc5CarrierError && error.code === 'future' && error.version !== null) {
      return Object.freeze({ kind: 'target-future', version: error.version });
    }
    return Object.freeze({ kind: 'target-corrupt' });
  }
  let state: OwnershipStateV2;
  try { state = applyOwnershipDeltaV2(source.state, manifest.targetRevision, delta); }
  catch { return Object.freeze({ kind: 'target-corrupt' }); }
  try {
    if (state.mode !== manifest.targetMode
      || ownershipStateDigestV2(state) !== manifest.targetDigest) {
      return Object.freeze({ kind: 'target-corrupt' });
    }
    const fixedDelta = deriveOwnershipDeltaV2(source.state, state);
    if (encodeOwnershipDeltaV2(fixedDelta) !== encodeOwnershipDeltaV2(delta)
      || ownershipDeltaDigestV2(fixedDelta) !== manifest.deltaDigest) {
      return Object.freeze({ kind: 'target-corrupt' });
    }
    const fixed = encodeCurrent(source.state, state);
    for (const write of fixed.writes) {
      const carrier = extensions[write.segment]?.[write.namespace];
      if (carrier?.version !== write.carrier.version || carrier.json !== write.carrier.json) {
        return Object.freeze({ kind: 'target-corrupt' });
      }
    }
  } catch {
    return Object.freeze({ kind: 'target-corrupt' });
  }
  return Object.freeze({ kind: 'loaded', state, evidence: currentEvidence(manifest) });
}

function inspectInventory(
  extensions: V5Extensions,
  inventory: Inventory,
  resolver: OwnershipAddressResolver,
): PresentInspection {
  if (inventory.kind === 'legacy') return inspectLegacy(extensions, inventory.manifest, resolver);
  if (inventory.kind === 'current') return inspectCurrent(extensions, resolver);
  if (inventory.kind === 'future') {
    return Object.freeze({ kind: 'target-future', version: inventory.version });
  }
  return Object.freeze({ kind: 'target-corrupt' });
}

/** Read an aligned legacy certificate or the complete compact v2 carrier.
 * V2 is always reconstructed from the exact current Arc 4 source plus the
 * canonical delta; no second full ownership mirror is stored. */
export function readArc5OwnershipMigration(
  value: unknown,
  resolver: OwnershipAddressResolver,
): Arc5OwnershipMigrationReadOutcome {
  const extensions = strictExtensions(value);
  if (extensions === null) return Object.freeze({ kind: 'corrupt' });
  const inventory = locateInventory(extensions);
  if (inventory.kind === 'absent') return Object.freeze({ kind: 'absent' });
  if (inventory.kind === 'corrupt') return Object.freeze({ kind: 'corrupt' });
  if (inventory.kind === 'future') {
    return Object.freeze({ kind: 'future-version', version: inventory.version });
  }
  const inspected = inspectInventory(extensions, inventory, resolver);
  if (inspected.kind === 'loaded') {
    return Object.freeze({ kind: 'loaded', state: inspected.state, evidence: inspected.evidence });
  }
  if (inspected.kind === 'target-future' || inspected.kind === 'source-future') {
    return Object.freeze({ kind: 'future-version', version: inspected.version });
  }
  return Object.freeze({ kind: 'corrupt' });
}

function protectedOutcome(
  reason: Arc5OwnershipMigrationProtectionReason,
  version?: number,
): Arc5OwnershipMigrationPreparation {
  return Object.freeze({
    kind: 'protected',
    reason,
    ...(version === undefined ? {} : { version }),
  });
}

function successorProtected(
  reason: Arc5OwnershipMigrationSuccessorProtectionReason,
  details: Readonly<{
    version?: number;
    expectedRevision?: number;
    actualRevision?: number;
  }> = {},
): Arc5OwnershipMigrationSuccessorPreparation {
  return Object.freeze({
    kind: 'protected',
    reason,
    ...(details.version === undefined ? {} : { version: details.version }),
    ...(details.expectedRevision === undefined ? {} : { expectedRevision: details.expectedRevision }),
    ...(details.actualRevision === undefined ? {} : { actualRevision: details.actualRevision }),
  });
}

function v2SuccessorProtected(
  reason: Arc5OwnershipV2SuccessorProtectionReason,
  details: Readonly<{
    version?: number;
    expectedRevision?: number;
    actualRevision?: number;
  }> = {},
): Arc5OwnershipV2SuccessorPreparation {
  return Object.freeze({
    kind: 'protected',
    reason,
    ...(details.version === undefined ? {} : { version: details.version }),
    ...(details.expectedRevision === undefined ? {} : { expectedRevision: details.expectedRevision }),
    ...(details.actualRevision === undefined ? {} : { actualRevision: details.actualRevision }),
  });
}

function parentMatchesCurrentCarrier(
  parent: OwnershipStateV2,
  inspected: Extract<PresentInspection, { readonly kind: 'loaded' }>,
): boolean {
  if (inspected.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) return false;
  try {
    const source = ownershipSourceStateV1(parent);
    const inspectedSource = ownershipSourceStateV1(inspected.state);
    return parent.revision === inspected.state.revision
      && parent.mode === inspected.state.mode
      && source.revision === inspectedSource.revision
      && source.mode === inspectedSource.mode
      && ownershipStateDigestV1(source) === inspected.evidence.sourceDigest
      && ownershipStateDigestV2(parent) === inspected.evidence.targetDigest;
  } catch {
    return false;
  }
}

function applyEncoded(
  base: V5Extensions,
  encoded: EncodedCurrentV2,
): Readonly<{ writes: Arc5OwnershipWriteTupleV2; extensions: V5Extensions }> {
  let applied: ReturnType<typeof applyV5ExtensionWrites>;
  try { applied = applyV5ExtensionWrites(base, encoded.writes); }
  catch { throw new Arc5CarrierError('bounds', 'Arc 5 replacement exceeds v5 extension bounds'); }
  const writes = exactWriteTuple(applied.writes);
  for (let index = 0; index < writes.length; index++) {
    if (writes[index]!.carrier.version !== encoded.writes[index]!.carrier.version
      || writes[index]!.carrier.json !== encoded.writes[index]!.carrier.json) {
      throw new Arc5CarrierError('corrupt', 'Arc 5 applied replacement changed bytes');
    }
  }
  return Object.freeze({ writes, extensions: applied.extensions });
}

/** Replace a current compact Arc 5 carrier beside an already-staged exact
 * Arc 4 +1. The four delta shards are re-derived against the new source, so a
 * source row that absorbs a former delta row clears its old tail bytes. */
function prepareArc5OwnershipMigrationSuccessorChecked(input: Readonly<{
  baseExtensions: unknown;
  parent: OwnershipStateV2;
  successorExtensions: unknown;
  successor: OwnershipStateV1;
  resolver: OwnershipAddressResolver;
}>, capture: Readonly<{
  scenarios: CaptureCapacityScenariosV1;
  scenarioIndex: number;
}> | null, composite: Readonly<{
  successor: OwnershipStateV2;
}> | null): Arc5OwnershipMigrationSuccessorPreparation {
  const captured = captureSuccessorPreparationInput(input);
  if (captured === null) return successorProtected('base-corrupt');
  const base = strictExtensions(captured.baseExtensions);
  if (base === null) return successorProtected('base-corrupt');
  const baseInventory = locateInventory(base);
  if (baseInventory.kind === 'absent') return successorProtected('base-absent');
  if (baseInventory.kind === 'future') {
    return successorProtected('base-future', { version: baseInventory.version });
  }
  if (baseInventory.kind !== 'current') return successorProtected('base-corrupt');
  const baseInspection = inspectCurrent(base, captured.resolver);
  if (baseInspection.kind === 'target-future' || baseInspection.kind === 'source-future') {
    return successorProtected('base-future', { version: baseInspection.version });
  }
  if (baseInspection.kind === 'source-drift') return successorProtected('base-source-drift');
  if (baseInspection.kind !== 'loaded') return successorProtected('base-corrupt');
  if (!parentMatchesCurrentCarrier(captured.parent, baseInspection)) {
    return successorProtected('successor-conflict');
  }
  const expectedSourceRevision = ownershipSourceStateV1(captured.parent).revision + 1;

  const staged = strictExtensions(captured.successorExtensions);
  if (staged === null) return successorProtected('successor-corrupt');
  const stagedSource = readArc4Ownership(staged, captured.resolver);
  if (stagedSource.kind === 'absent') return successorProtected('successor-absent');
  if (stagedSource.kind === 'future-version') {
    return successorProtected('successor-future', { version: stagedSource.version });
  }
  if (stagedSource.kind === 'corrupt') return successorProtected('successor-corrupt');
  let stagedDigest: string;
  let suppliedDigest: string;
  try {
    stagedDigest = ownershipStateDigestV1(stagedSource.state);
    suppliedDigest = ownershipStateDigestV1(captured.successor);
  } catch {
    return successorProtected('successor-conflict');
  }
  if (stagedDigest !== suppliedDigest) {
    return successorProtected('successor-conflict', {
      expectedRevision: stagedSource.state.revision,
      actualRevision: captured.successor.revision,
    });
  }
  const arc4 = prepareArc4OwnershipWrite({
    extensions: base,
    state: captured.successor,
    resolver: captured.resolver,
  });
  if (arc4.kind !== 'prepared') {
    if (arc4.reason === 'target-absent') return successorProtected('successor-absent');
    if (arc4.reason === 'target-future') {
      return successorProtected('successor-future', arc4.version === undefined
        ? {} : { version: arc4.version });
    }
    if (arc4.reason === 'target-corrupt' || arc4.reason === 'extensions-corrupt') {
      return successorProtected('successor-corrupt');
    }
    if (arc4.reason === 'extension-bounds') return successorProtected('extension-bounds');
    return successorProtected('successor-conflict', {
      ...(arc4.expectedRevision === undefined ? {} : { expectedRevision: arc4.expectedRevision }),
      ...(arc4.actualRevision === undefined ? {} : { actualRevision: arc4.actualRevision }),
    });
  }
  if (JSON.stringify(staged) !== JSON.stringify(arc4.extensions)) {
    return successorProtected('successor-conflict', {
      expectedRevision: expectedSourceRevision,
      actualRevision: captured.successor.revision,
    });
  }

  let directState: OwnershipStateV2;
  let encoded: EncodedCurrentV2;
  try {
    if (composite !== null) {
      if (!isOwnershipSuccessorV2(composite.successor, captured.parent)
        || ownershipSourceStateV1(composite.successor) !== captured.successor) {
        return successorProtected('successor-conflict', {
          expectedRevision: expectedSourceRevision,
          actualRevision: captured.successor.revision,
        });
      }
      directState = composite.successor;
    } else if (capture === null) {
      directState = createOwnershipSourceProjectionSuccessorV2(
        captured.parent,
        captured.successor,
      );
    } else {
      directState = createCaptureOwnershipSourceProjectionSuccessorV2(
        captured.parent,
        capture.scenarios,
        capture.scenarioIndex,
      );
    }
    const directSource = ownershipSourceStateV1(directState);
    if (ownershipStateDigestV1(directSource) !== stagedDigest
      || directState.revision !== captured.parent.revision + 1) {
      return successorProtected('target-corrupt');
    }
    encoded = encodeCurrent(directSource, directState);
  } catch (error) {
    if (error instanceof Arc5CarrierError && error.code === 'bounds') {
      return successorProtected('extension-bounds');
    }
    return successorProtected('successor-conflict', {
      expectedRevision: expectedSourceRevision,
      actualRevision: captured.successor.revision,
    });
  }
  let applied: ReturnType<typeof applyEncoded>;
  try { applied = applyEncoded(staged, encoded); }
  catch (error) {
    return successorProtected(
      error instanceof Arc5CarrierError && error.code === 'bounds'
        ? 'extension-bounds' : 'target-corrupt',
    );
  }
  const verified = inspectCurrent(applied.extensions, captured.resolver);
  if (verified.kind !== 'loaded'
    || verified.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || ownershipStateDigestV2(verified.state) !== ownershipStateDigestV2(directState)) {
    return successorProtected('target-corrupt');
  }
  return Object.freeze({
    kind: 'prepared',
    previousState: captured.parent,
    state: directState,
    evidence: verified.evidence,
    writes: applied.writes,
    extensions: applied.extensions,
  });
}

/** Generic Arc 4 source advancement retains every V2-only delta unchanged. */
export function prepareArc5OwnershipMigrationSuccessor(input: Readonly<{
  baseExtensions: unknown;
  parent: OwnershipStateV2;
  successorExtensions: unknown;
  successor: OwnershipStateV1;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationSuccessorPreparation {
  return prepareArc5OwnershipMigrationSuccessorChecked(input, null, null);
}

/** Source-changing Arc 4 + V2 consequence in one exact +1. The supplied V2
 * successor must be the registered direct child of `parent` and own the exact
 * registered Arc 4 successor supplied beside it. */
export function prepareArc5CompositeOwnershipMigrationSuccessor(input: Readonly<{
  baseExtensions: unknown;
  parent: OwnershipStateV2;
  successorExtensions: unknown;
  successor: OwnershipStateV1;
  successorV2: OwnershipStateV2;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationSuccessorPreparation {
  const captured = captureCompositeSuccessorPreparationInput(input);
  if (captured === null) return successorProtected('base-corrupt');
  return prepareArc5OwnershipMigrationSuccessorChecked({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent,
    successorExtensions: captured.successorExtensions,
    successor: captured.successor,
    resolver: captured.resolver,
  }, null, Object.freeze({ successor: captured.successorV2 }));
}

/** Capture-only source advancement binds the planner's registered
 * first-species decision to the same-revision Field Scout XP projection. */
export function prepareArc5CaptureOwnershipMigrationSuccessor(input: Readonly<{
  baseExtensions: unknown;
  parent: OwnershipStateV2;
  successorExtensions: unknown;
  scenarios: CaptureCapacityScenariosV1;
  scenarioIndex: number;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationSuccessorPreparation {
  const captured = captureCaptureSuccessorPreparationInput(input);
  if (captured === null) return successorProtected('base-corrupt');
  const scenario = captured.scenarios.scenarios[captured.scenarioIndex];
  if (scenario === undefined
    || captured.scenarios.ownershipDigest
      !== ownershipStateDigestV1(ownershipSourceStateV1(captured.parent))) {
    return successorProtected('successor-conflict');
  }
  return prepareArc5OwnershipMigrationSuccessorChecked({
    baseExtensions: captured.baseExtensions,
    parent: captured.parent,
    successorExtensions: captured.successorExtensions,
    successor: scenario.successor,
    resolver: captured.resolver,
  }, Object.freeze({
    scenarios: captured.scenarios,
    scenarioIndex: captured.scenarioIndex,
  }), null);
}

/** Prepare one exact V2-only +1. The domain boundary proves `successor` is
 * the registered direct child of the supplied carrier-aligned parent; this path rejects
 * a source-changing child because no Arc 4 replacement was staged. */
export function prepareArc5OwnershipV2Successor(input: Readonly<{
  baseExtensions: unknown;
  parent: OwnershipStateV2;
  successor: OwnershipStateV2;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipV2SuccessorPreparation {
  const captured = captureV2SuccessorPreparationInput(input);
  if (captured === null) return v2SuccessorProtected('base-corrupt');
  const base = strictExtensions(captured.baseExtensions);
  if (base === null) return v2SuccessorProtected('base-corrupt');
  const inventory = locateInventory(base);
  if (inventory.kind === 'absent') return v2SuccessorProtected('base-absent');
  if (inventory.kind === 'future') {
    return v2SuccessorProtected('base-future', { version: inventory.version });
  }
  if (inventory.kind !== 'current') return v2SuccessorProtected('base-corrupt');
  const inspected = inspectCurrent(base, captured.resolver);
  if (inspected.kind === 'target-future' || inspected.kind === 'source-future') {
    return v2SuccessorProtected('base-future', { version: inspected.version });
  }
  if (inspected.kind === 'source-drift') return v2SuccessorProtected('base-source-drift');
  if (inspected.kind !== 'loaded') return v2SuccessorProtected('base-corrupt');
  if (!parentMatchesCurrentCarrier(captured.parent, inspected)) {
    return v2SuccessorProtected('successor-conflict');
  }

  let encoded: EncodedCurrentV2;
  try {
    const delta = deriveOwnershipDeltaSuccessorV2(captured.parent, captured.successor);
    const priorSource = ownershipSourceStateV1(captured.parent);
    const nextSource = ownershipSourceStateV1(captured.successor);
    if (nextSource !== priorSource
      || captured.successor.revision !== captured.parent.revision + 1
      || encodeOwnershipDeltaV2(delta)
        !== encodeOwnershipDeltaV2(deriveOwnershipDeltaV2(nextSource, captured.successor))) {
      return v2SuccessorProtected('successor-conflict', {
        expectedRevision: inspected.state.revision + 1,
        actualRevision: captured.successor.revision,
      });
    }
    encoded = encodeCurrent(nextSource, captured.successor);
  } catch (error) {
    if (error instanceof Arc5CarrierError && error.code === 'bounds') {
      return v2SuccessorProtected('extension-bounds');
    }
    return v2SuccessorProtected('successor-conflict', {
      expectedRevision: inspected.state.revision + 1,
    });
  }
  let applied: ReturnType<typeof applyEncoded>;
  try { applied = applyEncoded(base, encoded); }
  catch (error) {
    return v2SuccessorProtected(
      error instanceof Arc5CarrierError && error.code === 'bounds'
        ? 'extension-bounds' : 'target-corrupt',
    );
  }
  const verified = inspectCurrent(applied.extensions, captured.resolver);
  if (verified.kind !== 'loaded'
    || verified.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || ownershipStateDigestV2(verified.state) !== ownershipStateDigestV2(captured.successor)) {
    return v2SuccessorProtected('target-corrupt');
  }
  return Object.freeze({
    kind: 'prepared',
    previousState: captured.parent,
    state: captured.successor,
    evidence: verified.evidence,
    writes: applied.writes,
    extensions: applied.extensions,
  });
}

/** Add or upgrade the compact carrier only when Arc 4 loads exactly. A valid
 * current v2 carrier is a zero-write fixed point; any ambiguity preserves all
 * namespaces byte-for-byte. */
export function prepareArc5OwnershipMigration(input: Readonly<{
  extensions: unknown;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationPreparation {
  const captured = capturePreparationInput(input);
  if (captured === null) return protectedOutcome('extensions-corrupt');
  const base = strictExtensions(captured.extensions);
  if (base === null) return protectedOutcome('extensions-corrupt');
  const inventory = locateInventory(base);
  if (inventory.kind === 'corrupt') return protectedOutcome('target-corrupt');
  if (inventory.kind === 'future') return protectedOutcome('target-future', inventory.version);
  if (inventory.kind === 'current') {
    const inspected = inspectCurrent(base, captured.resolver);
    if (inspected.kind === 'loaded') {
      if (inspected.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) {
        return protectedOutcome('target-corrupt');
      }
      return Object.freeze({
        kind: 'already-loaded',
        state: inspected.state,
        evidence: inspected.evidence,
        writes: EMPTY_WRITES,
        extensions: base,
      });
    }
    if (inspected.kind === 'target-future' || inspected.kind === 'source-future') {
      return protectedOutcome(inspected.kind, inspected.version);
    }
    return protectedOutcome(inspected.kind);
  }

  let source: OwnershipStateV1;
  let state: OwnershipStateV2;
  let representationUpgrade: 'legacy-v1' | undefined;
  if (inventory.kind === 'legacy') {
    const inspected = inspectLegacy(base, inventory.manifest, captured.resolver);
    if (inspected.kind === 'target-future' || inspected.kind === 'source-future') {
      return protectedOutcome(inspected.kind, inspected.version);
    }
    if (inspected.kind !== 'loaded') return protectedOutcome(inspected.kind);
    state = inspected.state;
    source = ownershipSourceStateV1(state);
    representationUpgrade = 'legacy-v1';
  } else {
    const sourceRead = readSource(base, captured.resolver);
    if (sourceRead.kind === 'absent') return protectedOutcome('source-absent');
    if (sourceRead.kind === 'future') return protectedOutcome('source-future', sourceRead.version);
    if (sourceRead.kind === 'corrupt') return protectedOutcome('source-corrupt');
    source = sourceRead.state;
    try { state = migrateOwnershipStateV1ToV2(source); }
    catch { return protectedOutcome('target-corrupt'); }
  }

  let encoded: EncodedCurrentV2;
  let applied: ReturnType<typeof applyEncoded>;
  try {
    encoded = encodeCurrent(source, state);
    applied = applyEncoded(base, encoded);
  } catch (error) {
    return protectedOutcome(
      error instanceof Arc5CarrierError && error.code === 'bounds'
        ? 'extension-bounds' : 'target-corrupt',
    );
  }
  const verified = inspectCurrent(applied.extensions, captured.resolver);
  if (verified.kind !== 'loaded'
    || verified.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || ownershipStateDigestV2(verified.state) !== ownershipStateDigestV2(state)
    || verified.state.revision !== state.revision) return protectedOutcome('target-corrupt');
  return Object.freeze({
    kind: 'prepared',
    state: verified.state,
    evidence: verified.evidence,
    writes: applied.writes,
    extensions: applied.extensions,
    ...(representationUpgrade === undefined ? {} : { representationUpgrade }),
  });
}

/** Verify postcommit bytes against one prepared exact five-target replacement
 * and return only a strict current-v2 fixed point. This rejects a still-valid
 * legacy certificate even though it reconstructs the same ownership state. */
export function committedArc5OwnershipState(
  prepared: Readonly<{
    state: OwnershipStateV2;
    evidence: Arc5OwnershipMigrationEvidenceV2;
    writes: readonly V5ExtensionWrite[];
  }>,
  value: unknown,
  resolver: OwnershipAddressResolver,
): CommittedArc5OwnershipStateV2 | null {
  let expected: Arc5OwnershipWriteTupleV2;
  try { expected = exactWriteTuple(prepared.writes); }
  catch { return null; }
  const extensions = strictExtensions(value);
  if (extensions === null || locateInventory(extensions).kind !== 'current') return null;
  for (const write of expected) {
    const carrier = extensions[write.segment]?.[write.namespace];
    if (carrier?.version !== write.carrier.version || carrier.json !== write.carrier.json) return null;
  }
  const inspected = inspectCurrent(extensions, resolver);
  if (inspected.kind !== 'loaded'
    || inspected.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) return null;
  try {
    if (ownershipStateDigestV2(inspected.state) !== ownershipStateDigestV2(prepared.state)
      || canonicalJson(inspected.evidence) !== canonicalJson(prepared.evidence)) return null;
  } catch {
    return null;
  }
  return Object.freeze({ state: inspected.state, evidence: inspected.evidence });
}
