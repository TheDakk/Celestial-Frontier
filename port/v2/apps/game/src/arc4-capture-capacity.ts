/* Arc 4 capture capacity transaction preparation.

   This app-owned helper joins the registered acquisition snapshot, current
   Arc 2/F4/ownership extensions, the complete v4 compatibility mirror, and
   the bounded v5 writer without exposing a mutation. It enumerates the miss
   plus every eligible hit before SessionRNG values exist. The settlement
   callback bound by that certificate must mint exactly one selected scenario
   authorization byte-for-byte. */
import {
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  OWNERSHIP_DATA_BUDGET,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  canonicalizeData,
  isCaptureCapacityScenariosV1,
  isCapturePreflightReadyV1,
  ownershipStateDigestV1,
  planCaptureV1,
  projectCaptureCapacityScenariosV1,
  sha256Hex,
  type CaptureAttemptPlanV1,
  type CaptureCapacityScenarioV1,
  type CaptureCapacityScenariosV1,
  type CapturePreflightReadyV1,
  type CanonicalJson,
} from '@cf/domain-acquisition';
import {
  DOMAINS,
} from '@cf/domain-sessionrng';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  V5_MAX_EXTENSION_NAMESPACES,
  V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  isF4MultiOutcomePreDrawSettlementAuthorizerForCodec,
  prepareArc4OwnershipWrite,
  prepareF4AuthorityUpdate,
  projectF4MultiOutcomeDrawAdvance,
  projectLegacyOwnershipMirror,
  readArc2AcquisitionCapabilities,
  readArc4Ownership,
  readF4Authority,
  type F4MultiOutcomePreDrawDeriveInput,
  type F4MultiOutcomePreDrawInput,
  type F4MultiOutcomePreDrawAuthorizedSettlement,
  type F4MultiOutcomePreDrawSaveCodec,
  type F4MultiOutcomePreDrawSettlementAuthorizer,
  type F4OutcomeDerivation,
  type PreparedV5SaveWrite,
  type ProjectedLegacyOwnershipMirrorV1,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { composeCaptureDrawBundleFromPlanV1 } from './acquisition-snapshot.js';

export const ARC4_CAPTURE_DOMAINS = Object.freeze([
  DOMAINS.captureCandidate,
  DOMAINS.captureSuccess,
] as const);
export const ARC4_FIRST_SPECIES_STARDUST_TIER_MIN = 5 as const;
export const ARC4_MAX_STARDUST_COUNTER = 1_000_000_000 as const;
export const ARC4_CAPTURE_RECEIPT_KIND = 'capture-attempt' as const;

export type Arc4CaptureCapacityRefusalReason =
  | 'preflight-unregistered'
  | 'input-invalid'
  | 'domain-order-mismatch'
  | 'snapshot-ownership-mismatch'
  | 'snapshot-capability-mismatch'
  | 'snapshot-authority-mismatch'
  | 'extensions-corrupt'
  | 'scenario-projection-failed'
  | 'ownership-write-unrepresentable'
  | 'legacy-mirror-unrepresentable'
  | 'stardust-overflow'
  | 'v4-round-trip-failed'
  | 'extension-capacity-exceeded'
  | 'complete-save-unrepresentable';

export interface Arc4CaptureCertifiedScenarioV1 {
  readonly kind: 'miss' | 'hit';
  readonly candidateSpeciesId: string | null;
  readonly sourceOrdinal: number | null;
  readonly firstForSpecies: boolean;
  readonly tier: number | null;
  readonly stardustReward: number;
  readonly successorDigest: string;
  readonly ownershipWritesDigest: string;
  readonly legacyV4Digest: string;
  readonly completeSaveDigest: string;
}

export interface Arc4CaptureCapacityCertificateV1 {
  readonly schema: 'cf-v2-arc4-capture-capacity-certificate/v1';
  readonly fingerprint: string;
  readonly snapshotFingerprint: string;
  readonly ownershipDigest: string;
  readonly extensionsDigest: string;
  readonly f4AuthorityDigest: string;
  readonly receiptOrdinal: number;
  readonly activePlayMs: number;
  readonly receiptKind: typeof ARC4_CAPTURE_RECEIPT_KIND;
  readonly candidateOrder: readonly string[];
  readonly scenarios: readonly Arc4CaptureCertifiedScenarioV1[];
}

export interface Arc4CaptureCapacityCertificationInput {
  readonly preflight: unknown;
  /** Exact value-free callback input minted by the F4 pre-draw owner. */
  readonly preDraw: F4MultiOutcomePreDrawInput;
}

export type Arc4CaptureCapacityCertificationOutcome =
  | Readonly<{ kind: 'certified'; certificate: Arc4CaptureCapacityCertificateV1 }>
  | Readonly<{
    kind: 'refused';
    reason: Arc4CaptureCapacityRefusalReason;
    scenario?: Readonly<{
      kind: 'miss' | 'hit';
      candidateSpeciesId: string | null;
      sourceOrdinal: number | null;
    }>;
  }>;

export type Arc4CaptureSettlementRefusalReason =
  | 'certificate-unregistered'
  | 'preflight-mismatch'
  | 'certificate-input-mismatch'
  | 'draw-plan-mismatch'
  | 'capture-plan-refused'
  | 'selected-scenario-uncertified'
  | 'settlement-authorization-failed';

export interface Arc4CaptureSettlementInput {
  readonly preflight: unknown;
  readonly draw: F4MultiOutcomePreDrawDeriveInput<Arc4CaptureCapacityCertificateV1>;
  readonly authorizer: F4MultiOutcomePreDrawSettlementAuthorizer;
}

export type Arc4CaptureSettlementOutcome =
  | Readonly<{
    kind: 'derived';
    plan: CaptureAttemptPlanV1;
    stardustReward: number;
    derivation: F4OutcomeDerivation;
    prepared: PreparedV5SaveWrite;
    authorization: F4MultiOutcomePreDrawAuthorizedSettlement;
  }>
  | Readonly<{ kind: 'refused'; reason: Arc4CaptureSettlementRefusalReason }>;

interface PreparedScenarioV1 {
  readonly publicRow: Arc4CaptureCertifiedScenarioV1;
  readonly state: SaveStateV2;
  readonly ownershipWrites: readonly V5ExtensionWrite[];
  readonly prepared: PreparedV5SaveWrite;
}

interface CertificatePayloadV1 {
  readonly preflight: CapturePreflightReadyV1;
  readonly codecIdentity: F4MultiOutcomePreDrawSaveCodec;
  readonly sourceDraftDigest: string;
  readonly sourceExtensionsDigest: string;
  readonly scenarios: CaptureCapacityScenariosV1;
  readonly preparedScenarios: readonly PreparedScenarioV1[];
  readonly rows: readonly Arc4CaptureCertifiedScenarioV1[];
  readonly currentAuthorityDigest: string;
  readonly nextSessionRngDigest: string;
  readonly activePlayMs: number;
  readonly receiptOrdinal: number;
}

const CERTIFICATES = new WeakMap<object, CertificatePayloadV1>();

const CERTIFICATION_FIELDS = Object.freeze(['preflight', 'preDraw'] as const);
const PRE_DRAW_FIELDS = Object.freeze([
  'domains', 'counters', 'receiptOrdinal', 'activePlayMs', 'currentAuthority',
  'nextSessionRng', 'codec', 'draft', 'extensions',
] as const);
const SETTLEMENT_FIELDS = Object.freeze(['preflight', 'draw', 'authorizer'] as const);
const DERIVE_FIELDS = Object.freeze([
  'draws', 'receiptOrdinal', 'activePlayMs', 'draft', 'extensions', 'plan',
  'currentAuthority', 'nextSessionRng', 'codec', 'proof',
] as const);
const CODEC_FIELDS = Object.freeze([
  'now', 'receiptKind', 'prepare', 'importLegacy', 'exportLegacy',
] as const);

class CapacityRefusal extends Error {
  readonly reason: Arc4CaptureCapacityRefusalReason;

  constructor(reason: Arc4CaptureCapacityRefusalReason, message: string) {
    super(message);
    this.name = 'CapacityRefusal';
    this.reason = reason;
  }
}

function capturedExactDataObject<T>(
  value: unknown,
  fields: readonly string[],
  label: string,
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CapacityRefusal('input-invalid', `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CapacityRefusal('input-invalid', `${label} must use a plain prototype`);
  }
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...fields].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((key, index) => key !== expected[index])) {
    throw new CapacityRefusal('input-invalid', `${label} has unknown or missing fields`);
  }
  const captured: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new CapacityRefusal('input-invalid', `${label} contains an accessor or hidden field`);
    }
    captured[key] = descriptor.value;
  }
  return Object.freeze(captured) as T;
}

function capturedCertificationInput(
  value: Arc4CaptureCapacityCertificationInput,
): Arc4CaptureCapacityCertificationInput {
  const input = capturedExactDataObject<Arc4CaptureCapacityCertificationInput>(
    value,
    CERTIFICATION_FIELDS,
    'capture certification input',
  );
  const preDraw = capturedExactDataObject<F4MultiOutcomePreDrawInput>(
    input.preDraw,
    PRE_DRAW_FIELDS,
    'capture pre-draw input',
  );
  return Object.freeze({ ...input, preDraw });
}

function capturedSettlementInput(
  value: Arc4CaptureSettlementInput,
): Arc4CaptureSettlementInput {
  const input = capturedExactDataObject<Arc4CaptureSettlementInput>(
    value,
    SETTLEMENT_FIELDS,
    'capture settlement input',
  );
  const draw = capturedExactDataObject<
    F4MultiOutcomePreDrawDeriveInput<Arc4CaptureCapacityCertificateV1>
  >(input.draw, DERIVE_FIELDS, 'capture settlement draw input');
  return Object.freeze({ ...input, draw });
}

function checkedCodec(value: unknown): Readonly<{
  identity: F4MultiOutcomePreDrawSaveCodec;
  codec: F4MultiOutcomePreDrawSaveCodec;
}> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype || !Object.isFrozen(value)) {
    throw new CapacityRefusal('input-invalid', 'capture codec must be an owner-frozen object');
  }
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...CODEC_FIELDS].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((key, index) => key !== expected[index])) {
    throw new CapacityRefusal('input-invalid', 'capture codec shape changed');
  }
  const captured: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of CODEC_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new CapacityRefusal('input-invalid', 'capture codec contains an accessor');
    }
    captured[key] = descriptor.value;
  }
  const codec = Object.freeze({
    now: captured.now,
    receiptKind: captured.receiptKind,
    prepare: captured.prepare,
    importLegacy: captured.importLegacy,
    exportLegacy: captured.exportLegacy,
  }) as unknown as F4MultiOutcomePreDrawSaveCodec;
  if (!Number.isSafeInteger(codec.now) || codec.now < 0
    || codec.receiptKind !== ARC4_CAPTURE_RECEIPT_KIND
    || typeof codec.prepare !== 'function'
    || typeof codec.importLegacy !== 'function'
    || typeof codec.exportLegacy !== 'function') {
    throw new CapacityRefusal('input-invalid', 'capture codec context is invalid');
  }
  return Object.freeze({ identity: value as F4MultiOutcomePreDrawSaveCodec, codec });
}

function checkedSettlementAuthorizer(
  value: unknown,
): F4MultiOutcomePreDrawSettlementAuthorizer {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype || !Object.isFrozen(value)) {
    throw new TypeError('capture settlement authorizer must be an owner-frozen object');
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 1 || keys[0] !== 'authorize') {
    throw new TypeError('capture settlement authorizer shape changed');
  }
  const descriptor = Object.getOwnPropertyDescriptor(value, 'authorize');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
    || typeof descriptor.value !== 'function') {
    throw new TypeError('capture settlement authorizer contains an accessor');
  }
  return Object.freeze({
    authorize: descriptor.value as F4MultiOutcomePreDrawSettlementAuthorizer['authorize'],
  });
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function sameCanonicalData(left: unknown, right: unknown): boolean {
  try { return canonicalJson(canonicalizeData(left)) === canonicalJson(canonicalizeData(right)); } catch {
    return false;
  }
}

function jsonDigest(value: unknown): string {
  const raw = JSON.stringify(value);
  if (raw === undefined) throw new TypeError('capacity evidence is not JSON data');
  return sha256Hex(raw);
}

function extensionDigest(extensions: V5Extensions): string {
  return jsonDigest(extensions);
}

function authorityFingerprint(activePlayMs: number, sessionRng: unknown): string {
  return `f4a1:${sha256Hex(canonicalJson({
    activePlayMs,
    sessionRng: sessionRng as CanonicalJson,
  }))}`;
}

function checkedExtensions(value: unknown): V5Extensions {
  try {
    return canonicalizeV5Extensions(canonicalizeData(value, Object.freeze({
      ...OWNERSHIP_DATA_BUDGET,
      maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
      maxCharacters: 1_200_000,
    })));
  } catch {
    throw new CapacityRefusal('extensions-corrupt', 'capture extensions are not canonical v5 data');
  }
}

function assertExactF4Projection(
  preflight: CapturePreflightReadyV1,
  preDraw: F4MultiOutcomePreDrawInput,
  extensions: V5Extensions,
): void {
  if (!sameJson(preDraw.domains, ARC4_CAPTURE_DOMAINS)) {
    throw new CapacityRefusal('domain-order-mismatch', 'capture requires its exact ordered F4 domains');
  }
  const projected = projectF4MultiOutcomeDrawAdvance(extensions, ARC4_CAPTURE_DOMAINS);
  if (projected.kind !== 'projected'
    || projected.plan.receiptOrdinal !== preDraw.receiptOrdinal
    || !sameJson(projected.plan.counters, preDraw.counters)
    || !sameJson(projected.plan.currentAuthority, preDraw.currentAuthority)
    || !sameJson(projected.plan.nextSessionRng, preDraw.nextSessionRng)) {
    throw new CapacityRefusal('snapshot-authority-mismatch', 'capture F4 projection changed');
  }
  if (preDraw.currentAuthority.activePlayMs !== preflight.snapshot.activePlayMs
    || preDraw.activePlayMs < preDraw.currentAuthority.activePlayMs
    || Math.floor(preDraw.activePlayMs / ACTIVE_PLAY_CAPTURE_CYCLE_MS) !== preflight.snapshot.cycle
    || authorityFingerprint(
      preDraw.currentAuthority.activePlayMs,
      preDraw.currentAuthority.sessionRng,
    )
      !== preflight.snapshot.f4AuthorityFingerprint) {
    throw new CapacityRefusal('snapshot-authority-mismatch', 'capture snapshot F4 authority changed');
  }
  const read = readF4Authority(extensions);
  if (read.kind !== 'loaded' || !sameJson(read.authority, preDraw.currentAuthority)) {
    throw new CapacityRefusal('snapshot-authority-mismatch', 'capture extension F4 authority changed');
  }
}

function assertSnapshotExtensionAuthority(
  preflight: CapturePreflightReadyV1,
  extensions: V5Extensions,
): void {
  const ownership = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded' || ownership.state.mode !== 'current'
    || ownershipStateDigestV1(ownership.state) !== preflight.snapshot.ownershipDigest) {
    throw new CapacityRefusal('snapshot-ownership-mismatch', 'capture ownership authority changed');
  }
  const capabilities = readArc2AcquisitionCapabilities(extensions);
  if (capabilities.kind !== 'loaded'
    || capabilities.capabilities.fingerprint !== preflight.snapshot.capabilityFingerprint
    || capabilities.capabilities.inventoryRevision !== preflight.snapshot.inventoryRevision
    || capabilities.capabilities.contactCaptureBonus !== preflight.snapshot.contactCapturePoints) {
    throw new CapacityRefusal('snapshot-capability-mismatch', 'capture capability authority changed');
  }
}

function checkedBaseSave(
  draft: SaveStateV2,
  extensions: V5Extensions,
  codec: F4MultiOutcomePreDrawSaveCodec,
): PreparedV5SaveWrite {
  try { return codec.prepare({ state: draft, extensions }); } catch {
    throw new CapacityRefusal('complete-save-unrepresentable', 'capture source save is not writable');
  }
}

function assertCurrentV4MirrorParity(
  state: SaveStateV2,
  mirror: ProjectedLegacyOwnershipMirrorV1,
): void {
  const actualCodex = state.codex.map(([legacyCodexId, entry]) => ({
    legacyCodexId,
    g: entry.g,
    f: entry.from,
    w: entry.where,
  }));
  const ownedKeys = ownedCustomNameKeys(mirror);
  const expectedNames = new Map(mirror.customNames);
  const actualNames = new Map(state.customNames.filter(([key]) => ownedKeys.has(key)));
  if (!sameCanonicalData(actualCodex, mirror.codex)
    || !sameJson([...actualNames.entries()], [...expectedNames.entries()])
    || !sameJson(state.bioX, mirror.bioX)
    || state.scoutId !== mirror.scoutId) {
    throw new CapacityRefusal('v4-round-trip-failed', 'current v4 ownership mirror is stale');
  }
}

function stardustRewardForScenario(scenario: CaptureCapacityScenarioV1): number {
  if (scenario.kind !== 'hit' || !scenario.firstForSpecies || scenario.tier === null
    || scenario.tier < ARC4_FIRST_SPECIES_STARDUST_TIER_MIN) return 0;
  /* Exact v1.8.9 rare-find award: tier 5 starts at two Stardust and every
     higher tier adds one. Repeats never enter this branch. */
  return scenario.tier - 3;
}

function ownedCustomNameKeys(mirror: ProjectedLegacyOwnershipMirrorV1): ReadonlySet<string> {
  return new Set(mirror.codex.map((row) => `c${row.legacyCodexId}`));
}

function stagedV4Mirror(
  baseRaw: string,
  mirror: ProjectedLegacyOwnershipMirrorV1,
  stardustReward: number,
  codec: F4MultiOutcomePreDrawSaveCodec,
): Readonly<{ state: SaveStateV2; raw: string }> {
  let envelope: Record<string, unknown>;
  try {
    const parsed = JSON.parse(baseRaw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    envelope = parsed as Record<string, unknown>;
  } catch {
    throw new CapacityRefusal('v4-round-trip-failed', 'canonical v4 source did not parse');
  }
  const baseNames = Array.isArray(envelope.names) ? envelope.names : [];
  const ownedNameKeys = ownedCustomNameKeys(mirror);
  const retainedNames = baseNames.filter((row): boolean => (
    Array.isArray(row) && typeof row[0] === 'string' && !ownedNameKeys.has(row[0])
  ));
  envelope.codex = mirror.codex.map((row) => ({ g: row.g, f: row.f, w: row.w }));
  envelope.names = [
    ...retainedNames,
    ...mirror.customNames.map(([key, value]) => [key, value]),
  ];
  envelope.bx = mirror.bioX.map(([seed, progress]) => [seed, [...progress]]);
  envelope.scout = mirror.scoutId;
  const essence = envelope.essence;
  const essenceEarned = envelope.essenceEarned;
  if (!Number.isSafeInteger(essence) || (essence as number) < 0
    || !Number.isSafeInteger(essenceEarned) || (essenceEarned as number) < 0
    || (essence as number) > ARC4_MAX_STARDUST_COUNTER - stardustReward
    || (essenceEarned as number) > ARC4_MAX_STARDUST_COUNTER - stardustReward) {
    throw new CapacityRefusal('stardust-overflow', 'capture Stardust counters cannot advance exactly');
  }
  envelope.essence = (essence as number) + stardustReward;
  envelope.essenceEarned = (essenceEarned as number) + stardustReward;
  const stagedRaw = JSON.stringify(envelope);
  const firstImport = codec.importLegacy(stagedRaw);
  if (!firstImport.ok) {
    throw new CapacityRefusal('v4-round-trip-failed', 'capture v4 mirror did not import');
  }
  /* The ownership projector emits canonical object-key order while the v4
     view sanitizer owns its historical key order. Normalize once through the
     supported writer, then require the ordinary fixed point exactly. */
  const normalizedRaw = codec.exportLegacy(firstImport.state);
  const imported = codec.importLegacy(normalizedRaw);
  if (!imported.ok || codec.exportLegacy(imported.state) !== normalizedRaw) {
    throw new CapacityRefusal('v4-round-trip-failed', 'capture v4 mirror did not reach its fixed point');
  }
  const actualCodex = imported.state.codex.map(([legacyCodexId, entry]) => ({
    legacyCodexId,
    g: entry.g,
    f: entry.from,
    w: entry.where,
  }));
  const actualOwnedNames = imported.state.customNames.filter(([key]) => ownedNameKeys.has(key));
  const actualUnrelatedNames = imported.state.customNames.filter(([key]) => !ownedNameKeys.has(key));
  if (!sameCanonicalData(actualCodex, mirror.codex)
    || !sameCanonicalData(actualOwnedNames, mirror.customNames)
    || !sameCanonicalData(actualUnrelatedNames, retainedNames)
    || !sameJson(imported.state.customNames, firstImport.state.customNames)
    || !sameJson(imported.state.bioX, mirror.bioX)
    || imported.state.scoutId !== mirror.scoutId
    || imported.state.essence !== envelope.essence
    || imported.state.stats.essenceEarned !== envelope.essenceEarned) {
    throw new CapacityRefusal('v4-round-trip-failed', 'capture v4 mirror lost authoritative facts');
  }
  return Object.freeze({ state: imported.state, raw: normalizedRaw });
}

function assertExactOwnershipWrites(
  base: V5Extensions,
  scenario: CaptureCapacityScenarioV1,
): Readonly<{ writes: readonly V5ExtensionWrite[]; extensions: V5Extensions }> {
  const prepared = prepareArc4OwnershipWrite({
    extensions: base,
    state: scenario.successor,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (prepared.kind !== 'prepared'
    || prepared.writes.length !== ARC4_OWNERSHIP_EXTENSION_TARGETS.length
    || prepared.writes.some((write, index) => (
      write.segment !== ARC4_OWNERSHIP_EXTENSION_TARGETS[index]?.segment
        || write.namespace !== ARC4_OWNERSHIP_EXTENSION_TARGETS[index]?.namespace
    ))) {
    throw new CapacityRefusal(
      prepared.kind === 'protected' && prepared.reason === 'extension-bounds'
        ? 'extension-capacity-exceeded' : 'ownership-write-unrepresentable',
      'capture ownership replacement is not exact',
    );
  }
  let reapplied: ReturnType<typeof applyV5ExtensionWrites>;
  try { reapplied = applyV5ExtensionWrites(base, prepared.writes); } catch {
    throw new CapacityRefusal('extension-capacity-exceeded', 'capture ownership writes exceed v5 bounds');
  }
  const readBack = readArc4Ownership(prepared.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (!sameJson(reapplied.extensions, prepared.extensions)
    || readBack.kind !== 'loaded'
    || ownershipStateDigestV1(readBack.state) !== scenario.successorDigest) {
    throw new CapacityRefusal('ownership-write-unrepresentable', 'capture ownership write did not round-trip');
  }
  return Object.freeze({ writes: prepared.writes, extensions: prepared.extensions });
}

function assertExtensionBounds(extensions: V5Extensions): void {
  let global = 0;
  for (const segment of V5_SEGMENTS) {
    const count = Object.keys(extensions[segment] ?? {}).length;
    if (count > V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT) {
      throw new CapacityRefusal('extension-capacity-exceeded', 'capture segment namespace bound exceeded');
    }
    global += count;
  }
  if (global > V5_MAX_EXTENSION_NAMESPACES) {
    throw new CapacityRefusal('extension-capacity-exceeded', 'capture global namespace bound exceeded');
  }
  try { canonicalizeV5Extensions(extensions); } catch {
    throw new CapacityRefusal('extension-capacity-exceeded', 'capture extension byte bound exceeded');
  }
}

function assertCompleteSave(prepared: PreparedV5SaveWrite, stagedRaw: string): void {
  const expected = Object.freeze([
    ['player', 'v5:player'],
    ['creatures', 'v5:creatures'],
    ['catalog', 'v5:catalog'],
    ['inventory', 'v5:inventory'],
    ['settings', 'v5:settings'],
    ['meta', 'save'],
  ] as const);
  if (prepared.legacyV4Raw !== stagedRaw
    || prepared.operations.length !== expected.length
    || prepared.operations.some((operation, index) => (
      operation.store !== expected[index]?.[0]
        || operation.key !== expected[index]?.[1]
        || typeof operation.value !== 'string'
    ))
    || prepared.operations[5]?.value !== stagedRaw) {
    throw new CapacityRefusal('complete-save-unrepresentable', 'capture complete save inventory changed');
  }
}

function scenarioIdentity(scenario: CaptureCapacityScenarioV1): Readonly<{
  kind: 'miss' | 'hit';
  candidateSpeciesId: string | null;
  sourceOrdinal: number | null;
}> {
  return Object.freeze({
    kind: scenario.kind,
    candidateSpeciesId: scenario.candidate?.identity.speciesId ?? null,
    sourceOrdinal: scenario.candidate?.sourceOrdinal ?? null,
  });
}

function prepareScenario(
  scenario: CaptureCapacityScenarioV1,
  sourceLegacyV4Raw: string,
  sourceExtensions: V5Extensions,
  preDraw: Pick<F4MultiOutcomePreDrawInput, 'activePlayMs' | 'nextSessionRng'>,
  codec: F4MultiOutcomePreDrawSaveCodec,
): PreparedScenarioV1 {
  const ownership = assertExactOwnershipWrites(sourceExtensions, scenario);
  const mirror = projectLegacyOwnershipMirror(scenario.successor);
  if (mirror.kind !== 'projected') {
    throw new CapacityRefusal(
      mirror.kind === 'unrepresentable'
        ? 'legacy-mirror-unrepresentable' : 'ownership-write-unrepresentable',
      'capture successor has no exact v4 ownership mirror',
    );
  }
  const stardustReward = stardustRewardForScenario(scenario);
  const staged = stagedV4Mirror(sourceLegacyV4Raw, mirror, stardustReward, codec);
  let f4: ReturnType<typeof prepareF4AuthorityUpdate>;
  try {
    f4 = prepareF4AuthorityUpdate(
      ownership.extensions,
      Object.freeze({ activePlayMs: preDraw.activePlayMs }),
      preDraw.nextSessionRng,
    );
  } catch {
    throw new CapacityRefusal('extension-capacity-exceeded', 'capture F4 successor cannot fit');
  }
  assertExtensionBounds(f4.extensions);
  let prepared: PreparedV5SaveWrite;
  try {
    prepared = codec.prepare({ state: staged.state, extensions: f4.extensions });
  } catch {
    throw new CapacityRefusal('complete-save-unrepresentable', 'capture complete save cannot be prepared');
  }
  assertCompleteSave(prepared, staged.raw);
  if (!sameJson(prepared.extensions, f4.extensions)) {
    throw new CapacityRefusal('complete-save-unrepresentable', 'capture complete save changed extensions');
  }
  const ownershipRead = readArc4Ownership(prepared.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  const f4Read = readF4Authority(prepared.extensions);
  if (ownershipRead.kind !== 'loaded'
    || ownershipStateDigestV1(ownershipRead.state) !== scenario.successorDigest
    || f4Read.kind !== 'loaded'
    || f4Read.authority.activePlayMs !== preDraw.activePlayMs
    || !sameJson(f4Read.authority.sessionRng, preDraw.nextSessionRng)) {
    throw new CapacityRefusal('complete-save-unrepresentable', 'capture prepared save lost authority');
  }
  const publicRow: Arc4CaptureCertifiedScenarioV1 = Object.freeze({
    ...scenarioIdentity(scenario),
    firstForSpecies: scenario.firstForSpecies,
    tier: scenario.tier,
    stardustReward,
    successorDigest: scenario.successorDigest,
    ownershipWritesDigest: jsonDigest(ownership.writes),
    legacyV4Digest: sha256Hex(staged.raw),
    completeSaveDigest: jsonDigest({
      extensions: prepared.extensions,
      operations: prepared.operations,
    }),
  });
  return Object.freeze({
    publicRow,
    state: staged.state,
    ownershipWrites: ownership.writes,
    prepared,
  });
}

function refused(
  reason: Arc4CaptureCapacityRefusalReason,
  scenario?: CaptureCapacityScenarioV1,
): Arc4CaptureCapacityCertificationOutcome {
  return Object.freeze({
    kind: 'refused',
    reason,
    ...(scenario === undefined ? {} : { scenario: scenarioIdentity(scenario) }),
  });
}

/** Enumerate and fully prepare the miss plus every candidate hit. No draw
 * values are present in this API or evaluated by any function it calls. */
export function certifyArc4CaptureCapacityV1(
  input: Arc4CaptureCapacityCertificationInput,
): Arc4CaptureCapacityCertificationOutcome {
  let captured: Arc4CaptureCapacityCertificationInput;
  try { captured = capturedCertificationInput(input); } catch {
    return refused('input-invalid');
  }
  if (!isCapturePreflightReadyV1(captured.preflight)) return refused('preflight-unregistered');
  const preflight = captured.preflight;
  let codecIdentity: F4MultiOutcomePreDrawSaveCodec;
  let codec: F4MultiOutcomePreDrawSaveCodec;
  let extensions: V5Extensions;
  let base: PreparedV5SaveWrite;
  let scenarios: CaptureCapacityScenariosV1;
  try {
    ({ identity: codecIdentity, codec } = checkedCodec(captured.preDraw.codec));
    extensions = checkedExtensions(captured.preDraw.extensions);
    assertSnapshotExtensionAuthority(preflight, extensions);
    assertExactF4Projection(preflight, captured.preDraw, extensions);
    base = checkedBaseSave(captured.preDraw.draft, extensions, codec);
    const currentMirror = projectLegacyOwnershipMirror(preflight.snapshot.ownership);
    if (currentMirror.kind !== 'projected') {
      throw new CapacityRefusal(
        currentMirror.kind === 'unrepresentable'
          ? 'legacy-mirror-unrepresentable' : 'ownership-write-unrepresentable',
        'current ownership has no exact v4 mirror',
      );
    }
    assertCurrentV4MirrorParity(base.canonicalState, currentMirror);
    scenarios = projectCaptureCapacityScenariosV1(preflight, captured.preDraw.receiptOrdinal);
    if (!isCaptureCapacityScenariosV1(scenarios)
      || !sameJson(scenarios.candidateOrder, preflight.pool.map((row) => row.identity.speciesId))) {
      throw new CapacityRefusal('scenario-projection-failed', 'capture scenario order changed');
    }
  } catch (error) {
    return refused(error instanceof CapacityRefusal ? error.reason : 'input-invalid');
  }
  const rows: Arc4CaptureCertifiedScenarioV1[] = [];
  const preparedScenarios: PreparedScenarioV1[] = [];
  for (const scenario of scenarios.scenarios) {
    try {
      const prepared = prepareScenario(
        scenario,
        base.legacyV4Raw,
        extensions,
        captured.preDraw,
        codec,
      );
      preparedScenarios.push(prepared);
      rows.push(prepared.publicRow);
    } catch (error) {
      return refused(
        error instanceof CapacityRefusal ? error.reason : 'complete-save-unrepresentable',
        scenario,
      );
    }
  }
  const extensionsDigest = extensionDigest(extensions);
  const currentAuthorityDigest = jsonDigest(captured.preDraw.currentAuthority);
  const nextSessionRngDigest = jsonDigest(captured.preDraw.nextSessionRng);
  const publicRows = Object.freeze(rows);
  const fingerprint = `arc4cap1:${sha256Hex(canonicalJson({
    snapshotFingerprint: preflight.snapshot.fingerprint,
    ownershipDigest: preflight.snapshot.ownershipDigest,
    extensionsDigest,
    currentAuthorityDigest,
    nextSessionRngDigest,
    activePlayMs: captured.preDraw.activePlayMs,
    receiptOrdinal: captured.preDraw.receiptOrdinal,
    codecNow: codec.now,
    receiptKind: codec.receiptKind,
    candidateOrder: scenarios.candidateOrder,
    scenarios: publicRows as unknown as CanonicalJson,
  }))}`;
  const certificate: Arc4CaptureCapacityCertificateV1 = Object.freeze({
    schema: 'cf-v2-arc4-capture-capacity-certificate/v1',
    fingerprint,
    snapshotFingerprint: preflight.snapshot.fingerprint,
    ownershipDigest: preflight.snapshot.ownershipDigest,
    extensionsDigest,
    f4AuthorityDigest: currentAuthorityDigest,
    receiptOrdinal: captured.preDraw.receiptOrdinal,
    activePlayMs: captured.preDraw.activePlayMs,
    receiptKind: ARC4_CAPTURE_RECEIPT_KIND,
    candidateOrder: scenarios.candidateOrder,
    scenarios: publicRows,
  });
  CERTIFICATES.set(certificate, Object.freeze({
    preflight,
    codecIdentity,
    sourceDraftDigest: jsonDigest(captured.preDraw.draft),
    sourceExtensionsDigest: extensionsDigest,
    scenarios,
    preparedScenarios: Object.freeze(preparedScenarios),
    rows: publicRows,
    currentAuthorityDigest,
    nextSessionRngDigest,
    activePlayMs: captured.preDraw.activePlayMs,
    receiptOrdinal: captured.preDraw.receiptOrdinal,
  }));
  return Object.freeze({ kind: 'certified', certificate });
}

function selectedScenario(
  scenarios: CaptureCapacityScenariosV1,
  plan: CaptureAttemptPlanV1,
): CaptureCapacityScenarioV1 | null {
  if (!plan.hit) return scenarios.scenarios[0] ?? null;
  return scenarios.scenarios.find((scenario) => (
    scenario.kind === 'hit'
      && scenario.candidate === plan.candidate
      && scenario.candidate.sourceOrdinal === plan.candidate.sourceOrdinal
      && scenario.candidate.identity.speciesId === plan.candidate.identity.speciesId
  )) ?? null;
}

/** Match the real once-evaluated plan to one certified scenario and return
 * the exact derivation the F4 owner may commit. Any clone, stale snapshot,
 * changed extension carrier, candidate reorder, or re-preparation drift is a
 * refusal rather than a second roll. */
export function settleCertifiedArc4CaptureV1(
  input: Arc4CaptureSettlementInput,
): Arc4CaptureSettlementOutcome {
  let captured: Arc4CaptureSettlementInput;
  try { captured = capturedSettlementInput(input); } catch {
    return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
  }
  const certificate = captured.draw.proof;
  const payload = certificate && typeof certificate === 'object'
    ? CERTIFICATES.get(certificate) : undefined;
  if (payload === undefined) {
    return Object.freeze({ kind: 'refused', reason: 'certificate-unregistered' });
  }
  if (!isCapturePreflightReadyV1(captured.preflight)
    || captured.preflight !== payload.preflight) {
    return Object.freeze({ kind: 'refused', reason: 'preflight-mismatch' });
  }
  let drawExtensions: V5Extensions;
  try {
    drawExtensions = checkedExtensions(captured.draw.extensions);
    if (captured.draw.codec !== payload.codecIdentity
      || captured.draw.receiptOrdinal !== payload.receiptOrdinal
      || captured.draw.activePlayMs !== payload.activePlayMs
      || captured.draw.draws !== captured.draw.plan.draws
      || jsonDigest(captured.draw.currentAuthority) !== payload.currentAuthorityDigest
      || jsonDigest(captured.draw.nextSessionRng) !== payload.nextSessionRngDigest
      || extensionDigest(drawExtensions) !== payload.sourceExtensionsDigest) {
      return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
    }
  } catch {
    return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
  }
  try {
    if (jsonDigest(captured.draw.draft) !== payload.sourceDraftDigest) {
      return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
    }
  } catch {
    return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
  }
  let composed: ReturnType<typeof composeCaptureDrawBundleFromPlanV1>;
  try {
    composed = composeCaptureDrawBundleFromPlanV1(
      payload.preflight,
      drawExtensions,
      captured.draw.plan,
    );
  } catch {
    return Object.freeze({ kind: 'refused', reason: 'draw-plan-mismatch' });
  }
  if (composed.kind !== 'planned') {
    return Object.freeze({ kind: 'refused', reason: 'draw-plan-mismatch' });
  }
  const planned = planCaptureV1(payload.preflight, composed.bundle);
  if (planned.kind !== 'planned') {
    return Object.freeze({ kind: 'refused', reason: 'capture-plan-refused' });
  }
  const scenario = selectedScenario(payload.scenarios, planned.plan);
  if (scenario === null
    || scenario.successorDigest !== ownershipStateDigestV1(planned.plan.successor)
    || scenario.firstForSpecies !== planned.plan.firstForSpecies
    || (scenario.kind === 'hit' && scenario.tier !== planned.plan.tier)) {
    return Object.freeze({ kind: 'refused', reason: 'selected-scenario-uncertified' });
  }
  /* Authenticate the exact owner/codec capability before selecting or passing
     the private prepared scenario. A structural wrapper must never become an
     oracle for a prepared save that could later be paired with a new witness. */
  if (!isF4MultiOutcomePreDrawSettlementAuthorizerForCodec(
    captured.authorizer,
    captured.draw.codec,
  )) {
    return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
  }
  let settlementAuthorizer: F4MultiOutcomePreDrawSettlementAuthorizer;
  try { settlementAuthorizer = checkedSettlementAuthorizer(captured.authorizer); } catch {
    return Object.freeze({ kind: 'refused', reason: 'certificate-input-mismatch' });
  }
  const rowIndex = payload.scenarios.scenarios.indexOf(scenario);
  const certifiedRow = payload.rows[rowIndex];
  const selected = payload.preparedScenarios[rowIndex];
  if (certifiedRow === undefined || selected === undefined
    || selected.publicRow !== certifiedRow) {
    return Object.freeze({ kind: 'refused', reason: 'selected-scenario-uncertified' });
  }
  const derivation: F4OutcomeDerivation = Object.freeze({
    state: selected.state,
    extensionWrites: selected.ownershipWrites,
    witness: planned.plan.witness,
  });
  let authorization: F4MultiOutcomePreDrawAuthorizedSettlement;
  try {
    authorization = settlementAuthorizer.authorize(derivation, selected.prepared);
  } catch {
    return Object.freeze({ kind: 'refused', reason: 'settlement-authorization-failed' });
  }
  return Object.freeze({
    kind: 'derived',
    plan: planned.plan,
    stardustReward: selected.publicRow.stardustReward,
    derivation: authorization.derivation,
    prepared: authorization.prepared,
    authorization,
  });
}

export function isArc4CaptureCapacityCertificateV1(
  value: unknown,
): value is Arc4CaptureCapacityCertificateV1 {
  return typeof value === 'object'
    && value !== null
    && CERTIFICATES.has(value)
    && (value as Arc4CaptureCapacityCertificateV1).schema
      === 'cf-v2-arc4-capture-capacity-certificate/v1';
}
