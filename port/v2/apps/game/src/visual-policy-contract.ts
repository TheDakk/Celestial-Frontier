/* Shared app-owned input vocabulary for visual runtime policies. Appearance
   identity and treatment grades remain owned by @cf/art; this contract only
   validates explicit capability inputs and freezes policy projections. */

export const VISUAL_POLICY_MOTION_STATES_V1 = Object.freeze([
  'full', 'reduced',
] as const);
export type VisualPolicyMotionStateV1 = typeof VISUAL_POLICY_MOTION_STATES_V1[number];

export const VISUAL_POLICY_DEVICE_TIERS_V1 = Object.freeze([
  'low', 'medium', 'high',
] as const);
export type VisualPolicyDeviceTierV1 = typeof VISUAL_POLICY_DEVICE_TIERS_V1[number];

export function recursivelyFreezeVisualPolicyV1<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      recursivelyFreezeVisualPolicyV1(child);
    }
    Object.freeze(value);
  }
  return value;
}

export function checkedVisualPolicyInputV1(
  input: unknown,
  expectedFields: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(`${label}: input must be an object`);
  }
  const fields = Object.keys(input).sort();
  const expected = [...expectedFields].sort();
  if (fields.length !== expected.length
    || fields.some((field, index) => field !== expected[index])) {
    throw new TypeError(`${label}: input has the wrong fields`);
  }
  return input as Readonly<Record<string, unknown>>;
}

export function checkedVisualPolicyBooleanV1(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean`);
  return value;
}

export function checkedVisualPolicyMotionStateV1(value: unknown): VisualPolicyMotionStateV1 {
  if (typeof value !== 'string'
    || !VISUAL_POLICY_MOTION_STATES_V1.includes(value as VisualPolicyMotionStateV1)) {
    throw new TypeError('visual policy motion must be full or reduced');
  }
  return value as VisualPolicyMotionStateV1;
}

export function checkedVisualPolicyDeviceTierV1(value: unknown): VisualPolicyDeviceTierV1 {
  if (typeof value !== 'string'
    || !VISUAL_POLICY_DEVICE_TIERS_V1.includes(value as VisualPolicyDeviceTierV1)) {
    throw new TypeError('visual policy deviceTier must be low, medium, or high');
  }
  return value as VisualPolicyDeviceTierV1;
}
