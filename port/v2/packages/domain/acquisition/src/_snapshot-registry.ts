import type {
  AcquisitionSnapshotV1,
  CaptureDrawBundleV1,
} from './snapshot.js';

const ACQUISITION_SNAPSHOTS = new WeakSet<object>();
const CAPTURE_DRAW_BUNDLES = new WeakSet<object>();

export function registerAcquisitionSnapshotAuthority(value: AcquisitionSnapshotV1): void {
  ACQUISITION_SNAPSHOTS.add(value);
}

export function hasAcquisitionSnapshotAuthority(value: object): boolean {
  return ACQUISITION_SNAPSHOTS.has(value);
}

export function registerCaptureDrawBundleAuthority(value: CaptureDrawBundleV1): void {
  CAPTURE_DRAW_BUNDLES.add(value);
}

export function hasCaptureDrawBundleAuthority(value: object): boolean {
  return CAPTURE_DRAW_BUNDLES.has(value);
}
