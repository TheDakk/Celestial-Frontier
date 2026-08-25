/* Arc 5 ownership migration certificate.

   Arc 4 remains the persisted ownership authority. This owner adds one
   digest-only certificate proving the exact deterministic V1 -> V2 lift; it
   does not persist a second ownership mirror or expose a public/Arc5-only
   mutation writer. Its sole internal successor bridge advances the V2
   projection only beside an already-authorized Arc 4 source successor. Every
   target state is derived from a freshly decoded Arc 4 fixed point. */
import {
  MAX_OWNERSHIP_REVISION,
  OWNERSHIP_DATA_BUDGET,
  OWNERSHIP_STATE_SCHEMA,
  OWNERSHIP_STATE_SCHEMA_V2,
  OWNERSHIP_STATE_VERSION,
  OWNERSHIP_STATE_VERSION_V2,
  canonicalJson,
  canonicalizeData,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  type CanonicalJson,
  type OwnershipAddressResolver,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  createOwnershipSourceProjectionSuccessorV2,
} from '@cf/domain-acquisition/ownership-v2-internal';
import {
  prepareArc4OwnershipWrite,
  readArc4Ownership,
} from './arc4-ownership.js';
import {
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';

export const ARC5_OWNERSHIP_MIGRATION_VERSION = 1 as const;
export const ARC5_OWNERSHIP_MIGRATION_PREFIX = 'arc5.ownership.' as const;
export const ARC5_OWNERSHIP_MIGRATION_NAMESPACE = 'arc5.ownership.migration' as const;
export const ARC5_OWNERSHIP_MIGRATION_SCHEMA = 'cf-v2-ownership-v1-to-v2/v1' as const;
export const ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET = Object.freeze({
  segment: 'player' as const,
  namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
});

export interface Arc5OwnershipMigrationCertificateV1 {
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
}

export type Arc5OwnershipMigrationReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly state: OwnershipStateV2 }
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

export interface PreparedArc5OwnershipMigrationV1 {
  readonly kind: 'prepared';
  readonly state: OwnershipStateV2;
  readonly writes: readonly V5ExtensionWrite[];
  readonly extensions: V5Extensions;
}

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

export interface PreparedArc5OwnershipMigrationSuccessorV1 {
  readonly kind: 'prepared';
  readonly previousState: OwnershipStateV2;
  readonly state: OwnershipStateV2;
  readonly write: V5ExtensionWrite;
  readonly writes: readonly [V5ExtensionWrite];
  readonly extensions: V5Extensions;
}

export type Arc5OwnershipMigrationSuccessorPreparation =
  | PreparedArc5OwnershipMigrationSuccessorV1
  | {
      readonly kind: 'protected';
      readonly reason: Arc5OwnershipMigrationSuccessorProtectionReason;
      readonly version?: number;
      readonly expectedRevision?: number;
      readonly actualRevision?: number;
    };

export type Arc5OwnershipMigrationPreparation =
  | PreparedArc5OwnershipMigrationV1
  | {
      readonly kind: 'already-loaded';
      readonly state: OwnershipStateV2;
      readonly writes: readonly [];
      readonly extensions: V5Extensions;
    }
  | {
      readonly kind: 'protected';
      readonly reason: Arc5OwnershipMigrationProtectionReason;
      readonly version?: number;
    };

const EXTENSION_DATA_BUDGET = Object.freeze({
  ...OWNERSHIP_DATA_BUDGET,
  maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
  maxCharacters: 1_200_000,
});
const EMPTY_WRITES = Object.freeze([]) as readonly [];

type TargetLocation =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly carrier: V5ExtensionCarrier }
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
  | { readonly kind: 'loaded'; readonly state: OwnershipStateV2 }
  | { readonly kind: 'target-future'; readonly version: number }
  | { readonly kind: 'target-corrupt' }
  | { readonly kind: 'source-absent' }
  | { readonly kind: 'source-future'; readonly version: number }
  | { readonly kind: 'source-corrupt' }
  | { readonly kind: 'source-drift' };

interface CapturedPreparationInput {
  readonly extensions: unknown;
  readonly resolver: OwnershipAddressResolver;
}

interface CapturedSuccessorPreparationInput {
  readonly baseExtensions: unknown;
  readonly successorExtensions: unknown;
  readonly successor: OwnershipStateV1;
  readonly resolver: OwnershipAddressResolver;
}

function capturePreparationInput(value: unknown): CapturedPreparationInput | null {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || keys.some((key) => typeof key === 'symbol')) return null;
    const names = (keys as string[]).sort();
    if (names[0] !== 'extensions' || names[1] !== 'resolver') return null;
    const extensions = Reflect.getOwnPropertyDescriptor(value, 'extensions');
    const resolver = Reflect.getOwnPropertyDescriptor(value, 'resolver');
    if (!extensions || !resolver
      || !('value' in extensions) || !('value' in resolver)
      || extensions.enumerable !== true || resolver.enumerable !== true
      || resolver.value === null || typeof resolver.value !== 'object') return null;
    return Object.freeze({
      extensions: extensions.value,
      resolver: resolver.value as OwnershipAddressResolver,
    });
  } catch {
    return null;
  }
}

function captureSuccessorPreparationInput(value: unknown): CapturedSuccessorPreparationInput | null {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 4 || keys.some((key) => typeof key === 'symbol')) return null;
    const names = (keys as string[]).sort();
    if (names[0] !== 'baseExtensions' || names[1] !== 'resolver'
      || names[2] !== 'successor' || names[3] !== 'successorExtensions') return null;
    const baseExtensions = Reflect.getOwnPropertyDescriptor(value, 'baseExtensions');
    const successorExtensions = Reflect.getOwnPropertyDescriptor(value, 'successorExtensions');
    const successor = Reflect.getOwnPropertyDescriptor(value, 'successor');
    const resolver = Reflect.getOwnPropertyDescriptor(value, 'resolver');
    const descriptors = [baseExtensions, successorExtensions, successor, resolver];
    if (descriptors.some((descriptor) => !descriptor || !('value' in descriptor)
      || descriptor.enumerable !== true)) return null;
    if (successor!.value === null || typeof successor!.value !== 'object'
      || resolver!.value === null || typeof resolver!.value !== 'object') return null;
    return Object.freeze({
      baseExtensions: baseExtensions!.value,
      successorExtensions: successorExtensions!.value,
      successor: successor!.value as OwnershipStateV1,
      resolver: resolver!.value as OwnershipAddressResolver,
    });
  } catch {
    return null;
  }
}

function strictExtensions(value: unknown): V5Extensions | null {
  try {
    /* Reject accessors, symbols, cycles, custom prototypes, and descriptor
       surprises before the shared v5 validator can observe property values. */
    return canonicalizeV5Extensions(canonicalizeData(value, EXTENSION_DATA_BUDGET));
  } catch {
    return null;
  }
}

function locateTarget(extensions: V5Extensions): TargetLocation {
  let target: V5ExtensionCarrier | undefined;
  for (const segment of V5_SEGMENTS) {
    for (const [namespace, carrier] of Object.entries(extensions[segment] ?? {})) {
      if (!namespace.startsWith(ARC5_OWNERSHIP_MIGRATION_PREFIX)) continue;
      if (segment !== ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.segment
        || namespace !== ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
        || target !== undefined) return Object.freeze({ kind: 'corrupt' });
      target = carrier;
    }
  }
  return target === undefined
    ? Object.freeze({ kind: 'absent' })
    : Object.freeze({ kind: 'present', carrier: target });
}

function record(value: CanonicalJson): Readonly<Record<string, CanonicalJson>> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Readonly<Record<string, CanonicalJson>>
    : null;
}

function hasExactKeys(
  value: Readonly<Record<string, CanonicalJson>>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length
    && actual.every((key, index) => key === wanted[index]);
}

function integer(value: CanonicalJson | undefined, maximum: number): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum
    ? value
    : null;
}

function digest(value: CanonicalJson | undefined): string | null {
  return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) ? value : null;
}

function parseCertificate(raw: string): CertificateParse {
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch { return Object.freeze({ kind: 'corrupt' }); }
  let canonical: CanonicalJson;
  try { canonical = canonicalizeData(parsed); } catch { return Object.freeze({ kind: 'corrupt' }); }
  if (canonicalJson(canonical) !== raw) return Object.freeze({ kind: 'corrupt' });
  const source = record(canonical);
  if (source === null || !hasExactKeys(source, [
    'schema', 'version', 'sourceSchema', 'sourceVersion', 'sourceRevision',
    'sourceMode', 'sourceDigest', 'targetSchema', 'targetVersion',
    'targetRevision', 'targetMode', 'targetDigest',
  ])) return Object.freeze({ kind: 'corrupt' });
  const version = integer(source.version, Number.MAX_SAFE_INTEGER);
  if (version === null || version < 1) return Object.freeze({ kind: 'corrupt' });
  if (version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
    return Object.freeze({ kind: 'future', version });
  }
  const sourceRevision = integer(source.sourceRevision, MAX_OWNERSHIP_REVISION);
  const targetRevision = integer(source.targetRevision, MAX_OWNERSHIP_REVISION);
  const sourceDigest = digest(source.sourceDigest);
  const targetDigest = digest(source.targetDigest);
  if (source.schema !== ARC5_OWNERSHIP_MIGRATION_SCHEMA
    || version !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || source.sourceSchema !== OWNERSHIP_STATE_SCHEMA
    || source.sourceVersion !== OWNERSHIP_STATE_VERSION
    || sourceRevision === null
    || (source.sourceMode !== 'current' && source.sourceMode !== 'legacy-protected')
    || sourceDigest === null
    || source.targetSchema !== OWNERSHIP_STATE_SCHEMA_V2
    || source.targetVersion !== OWNERSHIP_STATE_VERSION_V2
    || targetRevision === null
    || targetRevision !== sourceRevision
    || (source.targetMode !== 'current' && source.targetMode !== 'legacy-protected')
    || targetDigest === null) return Object.freeze({ kind: 'corrupt' });
  return Object.freeze({
    kind: 'current',
    certificate: Object.freeze({
      schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
      version: ARC5_OWNERSHIP_MIGRATION_VERSION,
      sourceSchema: OWNERSHIP_STATE_SCHEMA,
      sourceVersion: OWNERSHIP_STATE_VERSION,
      sourceRevision,
      sourceMode: source.sourceMode,
      sourceDigest,
      targetSchema: OWNERSHIP_STATE_SCHEMA_V2,
      targetVersion: OWNERSHIP_STATE_VERSION_V2,
      targetRevision,
      targetMode: source.targetMode,
      targetDigest,
    }),
  });
}

function readSource(extensions: V5Extensions, resolver: OwnershipAddressResolver): SourceRead {
  const source = readArc4Ownership(extensions, resolver);
  if (source.kind === 'loaded') return Object.freeze({ kind: 'loaded', state: source.state });
  if (source.kind === 'future-version') {
    return Object.freeze({ kind: 'future', version: source.version });
  }
  return Object.freeze({ kind: source.kind });
}

function deriveTarget(source: OwnershipStateV1): Readonly<{
  state: OwnershipStateV2;
  certificate: Arc5OwnershipMigrationCertificateV1;
}> | null {
  try {
    const state = migrateOwnershipStateV1ToV2(source);
    return Object.freeze({
      state,
      certificate: Object.freeze({
        schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
        version: ARC5_OWNERSHIP_MIGRATION_VERSION,
        sourceSchema: OWNERSHIP_STATE_SCHEMA,
        sourceVersion: OWNERSHIP_STATE_VERSION,
        sourceRevision: source.revision,
        sourceMode: source.mode,
        sourceDigest: ownershipStateDigestV1(source),
        targetSchema: OWNERSHIP_STATE_SCHEMA_V2,
        targetVersion: OWNERSHIP_STATE_VERSION_V2,
        targetRevision: state.revision,
        targetMode: state.mode,
        targetDigest: ownershipStateDigestV2(state),
      }),
    });
  } catch {
    return null;
  }
}

function inspectPresent(
  extensions: V5Extensions,
  carrier: V5ExtensionCarrier,
  resolver: OwnershipAddressResolver,
): PresentInspection {
  if (carrier.version > ARC5_OWNERSHIP_MIGRATION_VERSION) {
    return Object.freeze({ kind: 'target-future', version: carrier.version });
  }
  if (carrier.version !== ARC5_OWNERSHIP_MIGRATION_VERSION) {
    return Object.freeze({ kind: 'target-corrupt' });
  }
  const parsed = parseCertificate(carrier.json);
  if (parsed.kind === 'future') {
    return Object.freeze({ kind: 'target-future', version: parsed.version });
  }
  if (parsed.kind === 'corrupt') return Object.freeze({ kind: 'target-corrupt' });
  const source = readSource(extensions, resolver);
  if (source.kind === 'absent') return Object.freeze({ kind: 'source-absent' });
  if (source.kind === 'future') {
    return Object.freeze({ kind: 'source-future', version: source.version });
  }
  if (source.kind === 'corrupt') return Object.freeze({ kind: 'source-corrupt' });
  const expected = deriveTarget(source.state);
  if (expected === null) return Object.freeze({ kind: 'target-corrupt' });
  const certificate = parsed.certificate;
  if (certificate.sourceRevision !== source.state.revision
    || certificate.sourceMode !== source.state.mode
    || certificate.sourceDigest !== expected.certificate.sourceDigest) {
    return Object.freeze({ kind: 'source-drift' });
  }
  if (certificate.targetRevision !== expected.state.revision
    || certificate.targetMode !== expected.state.mode
    || certificate.targetDigest !== expected.certificate.targetDigest) {
    return Object.freeze({ kind: 'target-corrupt' });
  }
  return Object.freeze({ kind: 'loaded', state: expected.state });
}

/** Read the migration certificate only when its exact Arc 4 source is still
 * current. The returned V2 state is rebuilt from that source, never from
 * caller-provided or duplicated V2 bytes. */
export function readArc5OwnershipMigration(
  value: unknown,
  resolver: OwnershipAddressResolver,
): Arc5OwnershipMigrationReadOutcome {
  const extensions = strictExtensions(value);
  if (extensions === null) return Object.freeze({ kind: 'corrupt' });
  const target = locateTarget(extensions);
  if (target.kind === 'absent') return Object.freeze({ kind: 'absent' });
  if (target.kind === 'corrupt') return Object.freeze({ kind: 'corrupt' });
  const inspected = inspectPresent(extensions, target.carrier, resolver);
  if (inspected.kind === 'loaded') return Object.freeze({ kind: 'loaded', state: inspected.state });
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
    ...(details.expectedRevision === undefined
      ? {} : { expectedRevision: details.expectedRevision }),
    ...(details.actualRevision === undefined
      ? {} : { actualRevision: details.actualRevision }),
  });
}

/** Replace one aligned Arc 5 certificate alongside an already-staged exact
 * Arc 4 +1. The base certificate must still match its base source; the staged
 * extensions must be byte-for-byte the result of applying only that registered
 * Arc 4 successor. The internal V2 bridge then proves the paired direct source
 * transition before this helper replaces exactly one certificate. */
export function prepareArc5OwnershipMigrationSuccessor(input: Readonly<{
  baseExtensions: unknown;
  successorExtensions: unknown;
  successor: OwnershipStateV1;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationSuccessorPreparation {
  const captured = captureSuccessorPreparationInput(input);
  if (captured === null) return successorProtected('base-corrupt');
  const base = strictExtensions(captured.baseExtensions);
  if (base === null) return successorProtected('base-corrupt');
  const baseTarget = locateTarget(base);
  if (baseTarget.kind === 'absent') return successorProtected('base-absent');
  if (baseTarget.kind === 'corrupt') return successorProtected('base-corrupt');
  const baseInspection = inspectPresent(base, baseTarget.carrier, captured.resolver);
  if (baseInspection.kind === 'target-future' || baseInspection.kind === 'source-future') {
    return successorProtected('base-future', { version: baseInspection.version });
  }
  if (baseInspection.kind === 'source-drift') return successorProtected('base-source-drift');
  if (baseInspection.kind !== 'loaded') return successorProtected('base-corrupt');

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
      ...(arc4.expectedRevision === undefined
        ? {} : { expectedRevision: arc4.expectedRevision }),
      ...(arc4.actualRevision === undefined
        ? {} : { actualRevision: arc4.actualRevision }),
    });
  }
  if (JSON.stringify(staged) !== JSON.stringify(arc4.extensions)) {
    return successorProtected('successor-conflict', {
      expectedRevision: baseInspection.state.revision + 1,
      actualRevision: captured.successor.revision,
    });
  }

  const derived = deriveTarget(captured.successor);
  if (derived === null) return successorProtected('target-corrupt');
  let directState: OwnershipStateV2;
  try {
    directState = createOwnershipSourceProjectionSuccessorV2(
      baseInspection.state,
      captured.successor,
    );
    if (ownershipSourceStateV1(directState) === captured.successor
      || ownershipStateDigestV1(ownershipSourceStateV1(directState))
        !== derived.certificate.sourceDigest
      || ownershipStateDigestV2(directState) !== derived.certificate.targetDigest) {
      return successorProtected('target-corrupt');
    }
  } catch {
    return successorProtected('successor-conflict', {
      expectedRevision: baseInspection.state.revision + 1,
      actualRevision: captured.successor.revision,
    });
  }

  const write: V5ExtensionWrite = Object.freeze({
    ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
    carrier: Object.freeze({
      version: ARC5_OWNERSHIP_MIGRATION_VERSION,
      json: canonicalJson(derived.certificate),
    }),
  });
  let applied: ReturnType<typeof applyV5ExtensionWrites>;
  try { applied = applyV5ExtensionWrites(staged, [write]); }
  catch { return successorProtected('extension-bounds'); }
  if (applied.writes.length !== 1
    || applied.writes[0]?.segment !== write.segment
    || applied.writes[0]?.namespace !== write.namespace
    || applied.writes[0]?.carrier.version !== write.carrier.version
    || applied.writes[0]?.carrier.json !== write.carrier.json) {
    return successorProtected('target-corrupt');
  }
  const verifiedTarget = locateTarget(applied.extensions);
  if (verifiedTarget.kind !== 'present') return successorProtected('target-corrupt');
  const verified = inspectPresent(applied.extensions, verifiedTarget.carrier, captured.resolver);
  if (verified.kind !== 'loaded'
    || ownershipStateDigestV2(verified.state) !== ownershipStateDigestV2(directState)) {
    return successorProtected('target-corrupt');
  }
  return Object.freeze({
    kind: 'prepared',
    previousState: baseInspection.state,
    state: directState,
    write,
    writes: Object.freeze([write]) as readonly [V5ExtensionWrite],
    extensions: applied.extensions,
  });
}

/** Add the single certificate only when Arc 4 loads exactly. Existing valid
 * certificates are a zero-write fixed point; any ambiguity leaves every
 * namespace untouched. */
export function prepareArc5OwnershipMigration(input: Readonly<{
  extensions: unknown;
  resolver: OwnershipAddressResolver;
}>): Arc5OwnershipMigrationPreparation {
  const captured = capturePreparationInput(input);
  if (captured === null) return protectedOutcome('extensions-corrupt');
  const { extensions, resolver } = captured;
  const base = strictExtensions(extensions);
  if (base === null) return protectedOutcome('extensions-corrupt');
  const target = locateTarget(base);
  if (target.kind === 'corrupt') return protectedOutcome('target-corrupt');
  if (target.kind === 'present') {
    const inspected = inspectPresent(base, target.carrier, resolver);
    if (inspected.kind === 'loaded') {
      return Object.freeze({
        kind: 'already-loaded', state: inspected.state,
        writes: EMPTY_WRITES, extensions: base,
      });
    }
    if (inspected.kind === 'target-future' || inspected.kind === 'source-future') {
      return protectedOutcome(inspected.kind, inspected.version);
    }
    return protectedOutcome(inspected.kind);
  }
  const source = readSource(base, resolver);
  if (source.kind === 'absent') return protectedOutcome('source-absent');
  if (source.kind === 'future') return protectedOutcome('source-future', source.version);
  if (source.kind === 'corrupt') return protectedOutcome('source-corrupt');
  const derived = deriveTarget(source.state);
  if (derived === null) return protectedOutcome('target-corrupt');
  const write: V5ExtensionWrite = Object.freeze({
    ...ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
    carrier: Object.freeze({
      version: ARC5_OWNERSHIP_MIGRATION_VERSION,
      json: canonicalJson(derived.certificate),
    }),
  });
  let applied: ReturnType<typeof applyV5ExtensionWrites>;
  try { applied = applyV5ExtensionWrites(base, [write]); }
  catch { return protectedOutcome('extension-bounds'); }
  if (applied.writes.length !== 1
    || applied.writes[0]?.segment !== ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.segment
    || applied.writes[0]?.namespace !== ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace) {
    return protectedOutcome('target-corrupt');
  }
  const verifiedTarget = locateTarget(applied.extensions);
  if (verifiedTarget.kind !== 'present') return protectedOutcome('target-corrupt');
  const verified = inspectPresent(applied.extensions, verifiedTarget.carrier, resolver);
  if (verified.kind !== 'loaded'
    || ownershipStateDigestV2(verified.state) !== derived.certificate.targetDigest) {
    return protectedOutcome('target-corrupt');
  }
  return Object.freeze({
    kind: 'prepared', state: verified.state,
    writes: applied.writes, extensions: applied.extensions,
  });
}
