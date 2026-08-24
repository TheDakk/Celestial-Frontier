/* Arc 4 app authority compositor.

   This is the sole production importer of acquisition `snapshot-internal`.
   It joins live registered SurfaceNav, a separately supplied canonical CF1
   address, the production-branded full roster (never its preview/diagnostic
   projection), fresh Arc 2 + F4 extension reads, and registered current
   ownership. It plans no transaction and exposes no writer. */
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  canonicalCF1WorldAddressFromNav,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  DOMAINS,
} from '@cf/domain-sessionrng';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  OWNERSHIP_DATA_BUDGET,
  canonicalizeData,
  isOwnershipStateV1,
  isCapturePreflightReadyV1,
  ownershipStateDigestV1,
  type AcquisitionSnapshotV1,
  type CaptureDrawBundleV1,
  type CapturePreflightReadyV1,
} from '@cf/domain-acquisition';
import {
  registerAcquisitionSnapshotV1,
  registerCaptureDrawBundleV1,
} from '@cf/domain-acquisition/snapshot-internal';
import {
  canonicalizeV5Extensions,
  V5_MAX_EXTENSION_JSON_BYTES,
  planF4MultiOutcomeDraws,
  readArc4Ownership,
  readArc2AcquisitionCapabilities,
  readF4Authority,
  type F4MultiOutcomePlanProtection,
  type V5Extensions,
} from '@cf/persistence';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export interface AcquisitionSnapshotCompositionInput {
  readonly nav: unknown;
  readonly address: unknown;
  readonly roster: unknown;
  readonly ecologyEpoch: unknown;
  readonly fullRosterFingerprint: unknown;
  readonly extensions: unknown;
}

export type AcquisitionSnapshotProtectionReason =
  | 'composition-input-invalid'
  | 'extensions-corrupt'
  | 'surface-nav-required'
  | 'canonical-address-required'
  | 'navigation-address-mismatch'
  | 'production-full-roster-required'
  | 'roster-address-mismatch'
  | 'ecology-epoch-mismatch'
  | 'full-roster-fingerprint-mismatch'
  | 'ownership-absent'
  | 'ownership-corrupt'
  | 'ownership-future'
  | 'ownership-protected'
  | 'arc2-capability-absent'
  | 'arc2-capability-corrupt'
  | 'arc2-capability-future'
  | 'arc2-capability-legacy-protected'
  | 'f4-authority-absent'
  | 'f4-authority-corrupt'
  | 'f4-authority-future';

export type AcquisitionSnapshotCompositionOutcome =
  | Readonly<{ kind: 'ready'; snapshot: AcquisitionSnapshotV1 }>
  | Readonly<{ kind: 'protected'; reason: AcquisitionSnapshotProtectionReason }>;

function protectedSnapshot(
  reason: AcquisitionSnapshotProtectionReason,
): AcquisitionSnapshotCompositionOutcome {
  return Object.freeze({ kind: 'protected', reason });
}

const SNAPSHOT_COMPOSITION_FIELDS = Object.freeze([
  'nav',
  'address',
  'roster',
  'ecologyEpoch',
  'fullRosterFingerprint',
  'extensions',
] as const);

/** Capture every caller field exactly once without invoking accessors. A
 * transparent Proxy may emulate plain data, but it still has to hand over the
 * exact registered authorities in these captured descriptors; it cannot pass
 * a roster check and substitute different rows on a later property read. */
function captureCompositionInput(value: unknown): AcquisitionSnapshotCompositionInput | null {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== 'string')) return null;
    const names = (keys as string[]).sort();
    const expected = [...SNAPSHOT_COMPOSITION_FIELDS].sort();
    if (names.length !== expected.length
      || names.some((key, index) => key !== expected[index])) return null;
    const captured: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of SNAPSHOT_COMPOSITION_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')
        || descriptor.enumerable !== true) return null;
      captured[key] = descriptor.value;
    }
    return Object.freeze(captured) as unknown as AcquisitionSnapshotCompositionInput;
  } catch {
    return null;
  }
}

const EXTENSION_SNAPSHOT_BUDGET = Object.freeze({
  ...OWNERSHIP_DATA_BUDGET,
  maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
  maxCharacters: 1_200_000,
});

function canonicalExtensions(value: unknown): V5Extensions | null {
  try {
    return canonicalizeV5Extensions(canonicalizeData(value, EXTENSION_SNAPSHOT_BUDGET));
  } catch {
    return null;
  }
}

export function composeAcquisitionSnapshotV1(
  inputValue: AcquisitionSnapshotCompositionInput,
): AcquisitionSnapshotCompositionOutcome {
  const input = captureCompositionInput(inputValue);
  if (input === null) return protectedSnapshot('composition-input-invalid');
  const extensions = canonicalExtensions(input.extensions);
  if (extensions === null) return protectedSnapshot('extensions-corrupt');
  const fromNav = canonicalCF1WorldAddressFromNav(input.nav);
  if (!fromNav.ok) return protectedSnapshot('surface-nav-required');
  if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)) {
    return protectedSnapshot('canonical-address-required');
  }
  const address = input.address as CanonicalCF1WorldAddress;
  const addressKey = getCanonicalCF1AddressKey(address);
  if (addressKey === null || fromNav.address.key !== addressKey) {
    return protectedSnapshot('navigation-address-mismatch');
  }
  if (!isCanonicalWorldRoster(input.roster)) {
    return protectedSnapshot('production-full-roster-required');
  }
  const roster = input.roster as CanonicalWorldRoster;
  if (roster.worldKey !== addressKey
    || getCanonicalCF1AddressKey(roster.address) !== addressKey) {
    return protectedSnapshot('roster-address-mismatch');
  }
  if (input.ecologyEpoch !== roster.ecologyEpoch) {
    return protectedSnapshot('ecology-epoch-mismatch');
  }
  if (input.fullRosterFingerprint !== roster.fullRosterFingerprint) {
    return protectedSnapshot('full-roster-fingerprint-mismatch');
  }
  const ownershipRead = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownershipRead.kind === 'absent') return protectedSnapshot('ownership-absent');
  if (ownershipRead.kind === 'corrupt') return protectedSnapshot('ownership-corrupt');
  if (ownershipRead.kind === 'future-version') return protectedSnapshot('ownership-future');
  const ownership = ownershipRead.state;
  if (!isOwnershipStateV1(ownership)) return protectedSnapshot('ownership-corrupt');
  if (ownership.mode !== 'current') return protectedSnapshot('ownership-protected');
  const capabilities = readArc2AcquisitionCapabilities(extensions);
  if (capabilities.kind !== 'loaded') {
    if (capabilities.kind === 'absent') return protectedSnapshot('arc2-capability-absent');
    if (capabilities.kind === 'corrupt') return protectedSnapshot('arc2-capability-corrupt');
    if (capabilities.kind === 'future-version') return protectedSnapshot('arc2-capability-future');
    return protectedSnapshot('arc2-capability-legacy-protected');
  }
  const f4 = readF4Authority(extensions);
  if (f4.kind !== 'loaded') {
    if (f4.kind === 'absent') return protectedSnapshot('f4-authority-absent');
    if (f4.kind === 'corrupt') return protectedSnapshot('f4-authority-corrupt');
    return protectedSnapshot('f4-authority-future');
  }
  const snapshot = registerAcquisitionSnapshotV1({
    address,
    worldKey: addressKey,
    ecologyEpoch: roster.ecologyEpoch,
    fullRosterFingerprint: roster.fullRosterFingerprint,
    biosphereKey: roster.biosphereKey,
    rosterRows: roster.view.all,
    capabilities: capabilities.capabilities,
    ownership,
    f4Authority: f4.authority,
  });
  return Object.freeze({ kind: 'ready', snapshot });
}

export type CaptureDrawCompositionOutcome =
  | F4MultiOutcomePlanProtection
  | Readonly<{
    kind: 'protected';
    reason:
      | 'preflight-unregistered'
      | 'extensions-corrupt'
      | 'snapshot-ownership-protected'
      | 'snapshot-ownership-mismatch'
      | 'snapshot-capability-protected'
      | 'snapshot-capability-mismatch'
      | 'snapshot-authority-mismatch';
  }>
  | Readonly<{ kind: 'planned'; bundle: CaptureDrawBundleV1 }>;

/** The ready preflight is mandatory: empty/depleted/protected/capacity
 * outcomes cannot even request the two F4 values through this app surface. */
export function composeCaptureDrawBundleV1(
  preflightValue: unknown,
  extensionsValue: unknown,
): CaptureDrawCompositionOutcome {
  if (!isCapturePreflightReadyV1(preflightValue)) {
    return Object.freeze({ kind: 'protected', reason: 'preflight-unregistered' });
  }
  const preflight = preflightValue as CapturePreflightReadyV1;
  const extensions = canonicalExtensions(extensionsValue);
  if (extensions === null) {
    return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  }
  const ownership = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded' || ownership.state.mode !== 'current') {
    return Object.freeze({ kind: 'protected', reason: 'snapshot-ownership-protected' });
  }
  if (ownershipStateDigestV1(ownership.state) !== preflight.snapshot.ownershipDigest) {
    return Object.freeze({ kind: 'protected', reason: 'snapshot-ownership-mismatch' });
  }
  const capabilities = readArc2AcquisitionCapabilities(extensions);
  if (capabilities.kind !== 'loaded') {
    return Object.freeze({ kind: 'protected', reason: 'snapshot-capability-protected' });
  }
  if (capabilities.capabilities.fingerprint !== preflight.snapshot.capabilityFingerprint
    || capabilities.capabilities.inventoryRevision !== preflight.snapshot.inventoryRevision
    || capabilities.capabilities.contactCaptureBonus !== preflight.snapshot.contactCapturePoints) {
    return Object.freeze({ kind: 'protected', reason: 'snapshot-capability-mismatch' });
  }
  const planned = planF4MultiOutcomeDraws(extensions, Object.freeze([
    DOMAINS.captureCandidate,
    DOMAINS.captureSuccess,
  ]));
  if (planned.kind !== 'planned') return planned;
  const bundle = registerCaptureDrawBundleV1({
    snapshot: preflight.snapshot,
    plan: planned.plan,
  });
  if (bundle.snapshotFingerprint !== preflight.snapshot.fingerprint
    || bundle.f4AuthorityFingerprint !== preflight.snapshot.f4AuthorityFingerprint
    || bundle.activePlayMs !== preflight.snapshot.activePlayMs) {
    return Object.freeze({ kind: 'protected', reason: 'snapshot-authority-mismatch' });
  }
  return Object.freeze({ kind: 'planned', bundle });
}
