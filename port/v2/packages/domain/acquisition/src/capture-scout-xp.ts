/* Capture-only Arc 5 Field Scout XP join.

   The capture planner's registered, value-free scenario set remains the sole
   first-species authority. This internal bridge selects one exact scenario
   by index and applies its Scout lesson while reminting the Arc 4 source into
   the same V2 +1. It is intentionally absent from the public package root. */
import {
  isCaptureCapacityScenariosV1,
  type CaptureCapacityScenariosV1,
} from './capture-planner.js';
import {
  createOwnershipCaptureSourceProjectionSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  type OwnershipStateV2,
} from './model-v2.js';
import { ownershipStateDigestV1 } from './model.js';

export function createCaptureOwnershipSourceProjectionSuccessorV2(
  parent: OwnershipStateV2,
  scenarios: CaptureCapacityScenariosV1,
  scenarioIndex: number,
): OwnershipStateV2 {
  if (!isOwnershipStateV2(parent) || parent.mode !== 'current') {
    throw new TypeError('capture Scout XP requires a registered current V2 parent');
  }
  if (!isCaptureCapacityScenariosV1(scenarios)) {
    throw new TypeError('capture Scout XP requires the registered scenario authority');
  }
  if (!Number.isSafeInteger(scenarioIndex) || scenarioIndex < 0) {
    throw new RangeError('capture Scout XP scenario index is invalid');
  }
  if (scenarios.ownershipDigest !== ownershipStateDigestV1(ownershipSourceStateV1(parent))) {
    throw new TypeError('capture Scout XP scenario authority belongs to another source');
  }
  const scenario = scenarios.scenarios[scenarioIndex];
  if (scenario === undefined) throw new RangeError('capture Scout XP scenario index is out of range');
  return createOwnershipCaptureSourceProjectionSuccessorV2(
    parent,
    scenario.successor,
    scenario.firstForSpecies,
  );
}
