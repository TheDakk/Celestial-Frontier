/* Arc 4 acquisition authority DTOs.

   Public structure is evidence, not authority. The only production mint is
   app-owned behind a sealed subpath; private WeakSet membership prevents a
   clone, preview roster, diagnostic roster, or caller-authored draw row from
   reaching the pure capture planner. */
import type { CanonicalCF1WorldAddress, CF1WorldKey } from '@cf/scene';
import type {
  CanonicalGenomeIdentityV1,
  OwnershipStateV1,
} from './model.js';
import {
  hasAcquisitionSnapshotAuthority,
  hasCaptureDrawBundleAuthority,
} from './_snapshot-registry.js';

export const ACQUISITION_SNAPSHOT_SCHEMA = 'cf-v2-acquisition-snapshot/v1' as const;
export const CAPTURE_DRAW_BUNDLE_SCHEMA = 'cf-v2-capture-draw-bundle/v1' as const;
export const ACTIVE_PLAY_CAPTURE_CYCLE_MS = 1_200_000;

export type CaptureRingV1 = 0 | 1 | 2 | 3 | 4 | 5;
export type CaptureTierV1 =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface AcquisitionCandidateV1 {
  readonly sourceOrdinal: number;
  /** Exact v1.8.9 Compendium continuity key. It is deliberately seed-based
   * only until Arc 4 receives an explicit reacquisition policy. */
  readonly legacyCatalogueId: string;
  readonly identity: CanonicalGenomeIdentityV1;
}

export interface AcquisitionSnapshotV1 {
  readonly schema: typeof ACQUISITION_SNAPSHOT_SCHEMA;
  readonly fingerprint: string;
  readonly address: CanonicalCF1WorldAddress;
  readonly worldKey: CF1WorldKey;
  readonly planetSeed: number;
  readonly ecologyEpoch: number;
  readonly fullRosterFingerprint: string;
  readonly biosphereKey: string;
  readonly candidates: readonly AcquisitionCandidateV1[];
  readonly biosphereYield: number;
  readonly captureRing: CaptureRingV1;
  readonly capabilityFingerprint: string;
  readonly inventoryRevision: number;
  readonly contactCapturePoints: number;
  readonly ownership: OwnershipStateV1;
  readonly ownershipDigest: string;
  readonly f4AuthorityFingerprint: string;
  readonly activePlayMs: number;
  readonly cycle: number;
}

export interface CaptureDrawV1 {
  readonly domain: 'capture.candidate' | 'capture.success';
  readonly value: number;
}

export interface CaptureDrawBundleV1 {
  readonly schema: typeof CAPTURE_DRAW_BUNDLE_SCHEMA;
  /** Exact registered acquisition snapshot that was current before F4 was
   * asked for either draw. A bundle cannot be replayed against another world,
   * roster epoch, capability loadout, or ownership parent merely because the
   * same SessionRNG authority was still current there. */
  readonly snapshotFingerprint: string;
  readonly f4AuthorityFingerprint: string;
  readonly activePlayMs: number;
  readonly receiptOrdinal: number;
  readonly draws: readonly [CaptureDrawV1, CaptureDrawV1];
  readonly nextSessionRng: Readonly<{
    seed: number;
    ordinal: number;
    draws: Readonly<Record<string, number>>;
  }>;
}

export function isAcquisitionSnapshotV1(value: unknown): value is AcquisitionSnapshotV1 {
  return typeof value === 'object'
    && value !== null
    && hasAcquisitionSnapshotAuthority(value)
    && (value as AcquisitionSnapshotV1).schema === ACQUISITION_SNAPSHOT_SCHEMA;
}

export function isCaptureDrawBundleV1(value: unknown): value is CaptureDrawBundleV1 {
  return typeof value === 'object'
    && value !== null
    && hasCaptureDrawBundleAuthority(value)
    && (value as CaptureDrawBundleV1).schema === CAPTURE_DRAW_BUNDLE_SCHEMA;
}
