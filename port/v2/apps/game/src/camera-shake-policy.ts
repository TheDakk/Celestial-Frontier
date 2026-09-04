/* Pure permission/budget policy for the live camera-shake owner. It does not
   sample runtime state, calculate geometry, or create renderer resources. */
import {
  checkedVisualPolicyBooleanV1,
  checkedVisualPolicyDeviceTierV1,
  checkedVisualPolicyInputV1,
  checkedVisualPolicyMotionStateV1,
  recursivelyFreezeVisualPolicyV1,
  type VisualPolicyDeviceTierV1,
  type VisualPolicyMotionStateV1,
} from './visual-policy-contract.js';

export interface CameraShakePolicyInputV1 {
  readonly effectsOn: boolean;
  readonly shakeOn: boolean;
  readonly motion: VisualPolicyMotionStateV1;
  readonly deviceTier: VisualPolicyDeviceTierV1;
}

export type CameraShakeModeV1 = 'off' | 'subtle' | 'standard';

export interface CameraShakePolicyV1 {
  readonly schema: 'cf.app.camera-shake-policy.v1';
  readonly input: CameraShakePolicyInputV1;
  readonly shake: Readonly<{
    mode: CameraShakeModeV1;
    maximumConcurrentImpulses: number;
  }>;
}

const CAMERA_SHAKE_TIER_BUDGETS_V1 = recursivelyFreezeVisualPolicyV1({
  low: { mode: 'subtle', maximumConcurrentImpulses: 1 },
  medium: { mode: 'standard', maximumConcurrentImpulses: 1 },
  high: { mode: 'standard', maximumConcurrentImpulses: 2 },
} as const satisfies Readonly<Record<VisualPolicyDeviceTierV1, Readonly<{
  mode: Exclude<CameraShakeModeV1, 'off'>;
  maximumConcurrentImpulses: number;
}>>>);

const EXPECTED_FIELDS = Object.freeze([
  'effectsOn', 'shakeOn', 'motion', 'deviceTier',
] as const);

/** Shake is available only at the conjunction of all three explicit consent
 * gates. Device tier may lower the enabled profile but can never enable it. */
export function resolveCameraShakePolicyV1(input: CameraShakePolicyInputV1): CameraShakePolicyV1 {
  const source = checkedVisualPolicyInputV1(input, EXPECTED_FIELDS, 'camera shake policy');
  const effectsOn = checkedVisualPolicyBooleanV1(source.effectsOn, 'camera shake policy effectsOn');
  const shakeOn = checkedVisualPolicyBooleanV1(source.shakeOn, 'camera shake policy shakeOn');
  const motion = checkedVisualPolicyMotionStateV1(source.motion);
  const deviceTier = checkedVisualPolicyDeviceTierV1(source.deviceTier);
  const enabled = effectsOn && shakeOn && motion === 'full';
  const budget = CAMERA_SHAKE_TIER_BUDGETS_V1[deviceTier];

  return recursivelyFreezeVisualPolicyV1({
    schema: 'cf.app.camera-shake-policy.v1' as const,
    input: { effectsOn, shakeOn, motion, deviceTier },
    shake: enabled
      ? { mode: budget.mode, maximumConcurrentImpulses: budget.maximumConcurrentImpulses }
      : { mode: 'off' as const, maximumConcurrentImpulses: 0 },
  });
}
