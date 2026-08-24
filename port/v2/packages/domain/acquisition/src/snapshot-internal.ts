/* Internal Arc 4 authority mint.

   Repository law permits exactly one production importer:
   apps/game/src/acquisition-snapshot.ts. That compositor proves live scene,
   production roster, Arc 2 capability, ownership, and F4 carrier authority
   before calling here. This module rechecks every domain-owned fact and
   canonical F4 transition before registering either public value. */
import {
  isAcquisitionCapabilitySnapshot,
  type AcquisitionCapabilitySnapshot,
} from '@cf/domain-loot';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  createSessionRNG,
  DOMAINS,
  planSessionRNGDraws,
} from '@cf/domain-sessionrng';
import { ASC_RING_R, regionAt } from '@cf/domain-strays';
import { HOME_GAL_SEED, SOL_POS } from '@cf/domain-worldconfig';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';
import {
  canonicalJson,
  sha256Hex,
} from './canonical.js';
import {
  canonicalGenomeIdentityV1,
  isOwnershipStateV1,
  ownershipStateDigestV1,
  type OwnershipStateV1,
} from './model.js';
import {
  registerAcquisitionSnapshotAuthority,
  registerCaptureDrawBundleAuthority,
} from './_snapshot-registry.js';
import {
  ACQUISITION_SNAPSHOT_SCHEMA,
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  CAPTURE_DRAW_BUNDLE_SCHEMA,
  isAcquisitionSnapshotV1,
  type AcquisitionCandidateV1,
  type AcquisitionSnapshotV1,
  type CaptureDrawBundleV1,
  type CaptureRingV1,
} from './snapshot.js';

const MAX_ROSTER_ROWS = 64;
const CAPTURE_DOMAINS = Object.freeze([
  DOMAINS.captureCandidate,
  DOMAINS.captureSuccess,
] as const);

interface SessionRngInput {
  readonly seed: number;
  readonly ordinal: number;
  readonly draws: Readonly<Record<string, number>>;
}

interface F4AuthorityInput {
  readonly activePlayMs: number;
  readonly sessionRng: SessionRngInput;
}

interface CaptureF4DrawPlanInput {
  readonly draws: readonly Readonly<{ domain: string; value: number }>[];
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityInput;
  readonly nextSessionRng: SessionRngInput;
}

export interface CaptureDrawBundleMintInput {
  readonly snapshot: AcquisitionSnapshotV1;
  readonly plan: CaptureF4DrawPlanInput;
}

export interface AcquisitionSnapshotMintInput {
  readonly address: CanonicalCF1WorldAddress;
  readonly worldKey: string;
  readonly ecologyEpoch: number;
  readonly fullRosterFingerprint: string;
  readonly biosphereKey: string;
  readonly rosterRows: readonly Readonly<Record<string, unknown>>[];
  readonly capabilities: AcquisitionCapabilitySnapshot;
  readonly ownership: OwnershipStateV1;
  readonly f4Authority: F4AuthorityInput;
}

function checkedUint32(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 0xFFFF_FFFF) {
    throw new RangeError(`${label} must be a uint32`);
  }
  return value as number;
}

function checkedActivePlayMs(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError(`activePlayMs must be an integer from 0 through ${MAX_ACTIVE_PLAY_MS}`);
  }
  return value as number;
}

function checkedSessionRng(value: SessionRngInput): SessionRngInput {
  const canonical = createSessionRNG(value.seed, { ...value.draws }, value.ordinal).state();
  const draws = Object.freeze(Object.fromEntries(
    Object.entries(canonical.draws)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  ));
  return Object.freeze({ seed: canonical.seed, ordinal: canonical.ordinal, draws });
}

function sameSessionRng(left: SessionRngInput, right: SessionRngInput): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function authorityFingerprint(authority: F4AuthorityInput): string {
  const activePlayMs = checkedActivePlayMs(authority.activePlayMs);
  const sessionRng = checkedSessionRng(authority.sessionRng);
  return `f4a1:${sha256Hex(canonicalJson({ activePlayMs, sessionRng }))}`;
}

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new RangeError(`${label} is invalid`);
  }
  return value;
}

function checkedCaptureRing(address: CanonicalCF1WorldAddress): CaptureRingV1 {
  if (address.galaxy.seed === HOME_GAL_SEED) {
    return (Math.hypot(address.star.x - SOL_POS.x, address.star.y - SOL_POS.y) <= ASC_RING_R
      ? 0 : 1) as CaptureRingV1;
  }
  return (2 + Math.max(0, Math.min(3, regionAt(address.galaxy.x, address.galaxy.y)))) as CaptureRingV1;
}

function checkedRosterRows(
  value: readonly Readonly<Record<string, unknown>>[],
): readonly AcquisitionCandidateV1[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > MAX_ROSTER_ROWS) {
    throw new RangeError('acquisition snapshot requires the bounded full canonical roster');
  }
  const candidates: AcquisitionCandidateV1[] = [];
  for (let sourceOrdinal = 0; sourceOrdinal < value.length; sourceOrdinal++) {
    const identity = canonicalGenomeIdentityV1(value[sourceOrdinal]);
    const seed = identity.genome.seed;
    if (!Number.isSafeInteger(seed) || (seed as number) < 0 || (seed as number) > 0xFFFF_FFFF) {
      throw new TypeError('canonical roster genome seed is invalid');
    }
    candidates.push(Object.freeze({
      sourceOrdinal,
      legacyCatalogueId: `s${seed}`,
      identity,
    }));
  }
  return Object.freeze(candidates);
}

function biosphereYield(planetSeed: number, rosterSize: number): number {
  if (rosterSize === 0) return 0;
  const random = mulberry32(hashInt(planetSeed >>> 0, 0xB105, 5) >>> 0);
  return Math.max(3, Math.min(16,
    3 + Math.round(rosterSize * 1.2) + Math.round((random() - 0.5) * 4),
  ));
}

export function registerAcquisitionSnapshotV1(
  input: AcquisitionSnapshotMintInput,
): AcquisitionSnapshotV1 {
  const address = input.address;
  if (!isCanonicalCF1Address(address) || !('planet' in address)) {
    throw new TypeError('acquisition snapshot requires a registered canonical CF1 world address');
  }
  const worldKey = getCanonicalCF1AddressKey(address);
  if (worldKey === null || input.worldKey !== worldKey) {
    throw new TypeError('acquisition snapshot world key does not match its canonical address');
  }
  if (!Number.isSafeInteger(input.ecologyEpoch) || input.ecologyEpoch < 0 || input.ecologyEpoch > 10_000) {
    throw new RangeError('acquisition snapshot ecology epoch is invalid');
  }
  const fullRosterFingerprint = checkedText(
    input.fullRosterFingerprint,
    'full roster fingerprint',
    160,
  );
  const biosphereKey = checkedText(input.biosphereKey, 'biosphere key', 32);
  if (!isAcquisitionCapabilitySnapshot(input.capabilities)) {
    throw new TypeError('acquisition snapshot requires registered Arc 2 capabilities');
  }
  if (!Number.isSafeInteger(input.capabilities.contactCaptureBonus)
    || input.capabilities.contactCaptureBonus < 0) {
    throw new TypeError('capture contact points must be a whole non-negative number');
  }
  if (!isOwnershipStateV1(input.ownership)) {
    throw new TypeError('acquisition snapshot requires registered ownership');
  }
  if (input.ownership.mode !== 'current') {
    throw new TypeError('legacy-protected ownership cannot become acquisition authority');
  }
  const activePlayMs = checkedActivePlayMs(input.f4Authority.activePlayMs);
  const sessionRng = checkedSessionRng(input.f4Authority.sessionRng);
  const f4AuthorityFingerprint = authorityFingerprint({ activePlayMs, sessionRng });
  const candidates = checkedRosterRows(input.rosterRows);
  const ownershipDigest = ownershipStateDigestV1(input.ownership);
  const cycle = Math.floor(activePlayMs / ACTIVE_PLAY_CAPTURE_CYCLE_MS);
  const captureRing = checkedCaptureRing(address);
  const fingerprint = `acs1:${sha256Hex(canonicalJson({
    worldKey,
    ecologyEpoch: input.ecologyEpoch,
    fullRosterFingerprint,
    biosphereKey,
    candidates: candidates.map((row) => ({
      sourceOrdinal: row.sourceOrdinal,
      legacyCatalogueId: row.legacyCatalogueId,
      speciesId: row.identity.speciesId,
      genomeIdentity: row.identity.genomeIdentity,
    })),
    capabilityFingerprint: input.capabilities.fingerprint,
    inventoryRevision: input.capabilities.inventoryRevision,
    contactCapturePoints: input.capabilities.contactCaptureBonus,
    ownershipDigest,
    f4AuthorityFingerprint,
    activePlayMs,
    cycle,
    captureRing,
  }))}`;
  const snapshot: AcquisitionSnapshotV1 = Object.freeze({
    schema: ACQUISITION_SNAPSHOT_SCHEMA,
    fingerprint,
    address,
    worldKey: worldKey as CF1WorldKey,
    planetSeed: checkedUint32(address.planet.seed, 'planet seed'),
    ecologyEpoch: input.ecologyEpoch,
    fullRosterFingerprint,
    biosphereKey,
    candidates,
    biosphereYield: biosphereYield(address.planet.seed, candidates.length),
    captureRing,
    capabilityFingerprint: input.capabilities.fingerprint,
    inventoryRevision: input.capabilities.inventoryRevision,
    contactCapturePoints: input.capabilities.contactCaptureBonus,
    ownership: input.ownership,
    ownershipDigest,
    f4AuthorityFingerprint,
    activePlayMs,
    cycle,
  });
  registerAcquisitionSnapshotAuthority(snapshot);
  return snapshot;
}

/** Bind only the exact canonical result of F4's ordered multi-outcome owner.
 * The sole production caller obtains `plan` directly from
 * `planF4MultiOutcomeDraws`; this mint independently re-derives every value,
 * counter, and the one shared receipt ordinal before branding it. */
export function registerCaptureDrawBundleV1(
  input: CaptureDrawBundleMintInput,
): CaptureDrawBundleV1 {
  const snapshot = input.snapshot;
  if (!isAcquisitionSnapshotV1(snapshot)) {
    throw new TypeError('capture draws require the exact registered acquisition snapshot');
  }
  const plan = input.plan;
  const currentSessionRng = checkedSessionRng(plan.currentAuthority.sessionRng);
  const expected = planSessionRNGDraws(currentSessionRng, CAPTURE_DOMAINS);
  if (!Array.isArray(plan.draws) || plan.draws.length !== 2
    || plan.receiptOrdinal !== expected.receiptOrdinal
    || plan.draws[0]?.domain !== CAPTURE_DOMAINS[0]
    || plan.draws[1]?.domain !== CAPTURE_DOMAINS[1]
    || plan.draws[0]?.value !== expected.draws[0]?.value
    || plan.draws[1]?.value !== expected.draws[1]?.value) {
    throw new TypeError('capture draws do not match the canonical ordered F4 plan');
  }
  const nextSessionRng = checkedSessionRng(plan.nextSessionRng);
  if (!sameSessionRng(nextSessionRng, expected.nextState)) {
    throw new TypeError('capture draw next authority does not match the canonical F4 transition');
  }
  const activePlayMs = checkedActivePlayMs(plan.currentAuthority.activePlayMs);
  const f4AuthorityFingerprint = authorityFingerprint({
    activePlayMs,
    sessionRng: currentSessionRng,
  });
  const draws: CaptureDrawBundleV1['draws'] = Object.freeze([
    Object.freeze({ domain: CAPTURE_DOMAINS[0], value: expected.draws[0]!.value }),
    Object.freeze({ domain: CAPTURE_DOMAINS[1], value: expected.draws[1]!.value }),
  ]);
  const bundle: CaptureDrawBundleV1 = Object.freeze({
    schema: CAPTURE_DRAW_BUNDLE_SCHEMA,
    snapshotFingerprint: snapshot.fingerprint,
    f4AuthorityFingerprint,
    activePlayMs,
    receiptOrdinal: expected.receiptOrdinal,
    draws,
    nextSessionRng,
  });
  registerCaptureDrawBundleAuthority(bundle);
  return bundle;
}
