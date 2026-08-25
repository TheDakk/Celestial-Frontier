import { describe, expect, it } from 'vitest';
import {
  bootRouteProjectionFingerprint,
  classifyBootRouteRepair,
  type BootRouteProjection,
  type BootRouteRepairGuards,
} from '../apps/game/src/boot-route-repair.js';

const GALAXY = Object.freeze({
  x: 90, y: -60, size: 86, sp: 12, tilt: 0.4, rot: 0.8, seed: 999,
  home: false, quasar: false, dwarf: false,
});
const STORED_GALAXY = Object.freeze({
  seed: 999, rot: 0.8, tilt: 0.4, sp: 12, size: 86, y: -60, x: 90,
});
const STAR = Object.freeze({ x: 560, y: 170, seed: 424242 });
const SYSTEM = Object.freeze({ type: 'star', gal: GALAXY, star: STAR });
const STORED_SYSTEM = Object.freeze({ star: STAR, gal: STORED_GALAXY, type: 'star' });
const HOME: BootRouteProjection = Object.freeze({ savedView: null, atlas: Object.freeze([]) });
const ALIGNED_EXPLICIT: BootRouteProjection = Object.freeze({
  savedView: SYSTEM,
  atlas: Object.freeze([Object.freeze(['sol', SYSTEM] as const)]),
});
const ALIGNED_FIXED_POINT: BootRouteProjection = Object.freeze({
  savedView: STORED_SYSTEM,
  atlas: Object.freeze([Object.freeze(['sol', STORED_SYSTEM] as const)]),
});
const ATLAS_LEGACY: BootRouteProjection = Object.freeze({
  savedView: SYSTEM,
  atlas: Object.freeze([Object.freeze(['sol', Object.freeze({ ...STORED_SYSTEM, orb: 4 })] as const)]),
});
const CLEAR_GUARDS: BootRouteRepairGuards = Object.freeze({
  persistenceHeld: false,
  savedRouteWriteHeld: false,
  trainingCheckpointWriteHeld: false,
  trainingBootRouteBlocked: false,
  trainingBootRuntimeOnlySeat: false,
});

type Fingerprint = (projection: BootRouteProjection) => string;

function fingerprintContractErrors(fingerprint: Fingerprint): string[] {
  const errors: string[] = [];
  if (fingerprint(ALIGNED_EXPLICIT) !== fingerprint(ALIGNED_FIXED_POINT)) {
    errors.push('fixed-point-false-flags');
  }
  if (fingerprint(HOME) === fingerprint(Object.freeze({ savedView: SYSTEM, atlas: HOME.atlas }))) {
    errors.push('saved-view-delta');
  }
  if (fingerprint(ALIGNED_FIXED_POINT) === fingerprint(ATLAS_LEGACY)) {
    errors.push('atlas-delta');
  }
  return errors;
}

describe('boot route repair intent', () => {
  it('treats explicit false galaxy flags and the fixed-point Atlas omission as aligned', () => {
    expect(fingerprintContractErrors(bootRouteProjectionFingerprint)).toEqual([]);
    expect(classifyBootRouteRepair({
      before: ALIGNED_FIXED_POINT,
      after: ALIGNED_EXPLICIT,
      guards: CLEAR_GUARDS,
    })).toEqual({ changed: false, pending: false });
  });

  it('detects saved-view-only and Atlas-only canonicalization independently', () => {
    expect(classifyBootRouteRepair({
      before: HOME,
      after: Object.freeze({ savedView: SYSTEM, atlas: HOME.atlas }),
      guards: CLEAR_GUARDS,
    })).toEqual({ changed: true, pending: true });
    expect(classifyBootRouteRepair({
      before: ATLAS_LEGACY,
      after: ALIGNED_FIXED_POINT,
      guards: CLEAR_GUARDS,
    })).toEqual({ changed: true, pending: true });
  });

  it('keeps an unchanged source-error route inert and suppresses every held path', () => {
    expect(classifyBootRouteRepair({
      before: ALIGNED_FIXED_POINT,
      after: ALIGNED_FIXED_POINT,
      guards: { ...CLEAR_GUARDS, savedRouteWriteHeld: true },
    })).toEqual({ changed: false, pending: false });

    for (const guard of Object.keys(CLEAR_GUARDS) as Array<keyof BootRouteRepairGuards>) {
      expect(classifyBootRouteRepair({
        before: HOME,
        after: Object.freeze({ savedView: SYSTEM, atlas: HOME.atlas }),
        guards: { ...CLEAR_GUARDS, [guard]: true },
      }), guard).toEqual({ changed: true, pending: false });
    }
  });

  it('negative-controls constant and Atlas-blind fingerprints', () => {
    const constantFingerprint: Fingerprint = () => 'constant';
    const atlasBlindFingerprint: Fingerprint = (projection) =>
      bootRouteProjectionFingerprint({ savedView: projection.savedView, atlas: [] });
    expect(fingerprintContractErrors(constantFingerprint)).toEqual([
      'saved-view-delta', 'atlas-delta',
    ]);
    expect(fingerprintContractErrors(atlasBlindFingerprint)).toEqual(['atlas-delta']);
  });
});
