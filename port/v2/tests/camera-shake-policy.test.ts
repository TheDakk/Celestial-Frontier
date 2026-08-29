import { describe, expect, it } from 'vitest';
import {
  resolveCameraShakePolicyV1,
  type CameraShakePolicyV1,
} from '../apps/game/src/camera-shake-policy.js';
import {
  VISUAL_POLICY_DEVICE_TIERS_V1,
  VISUAL_POLICY_MOTION_STATES_V1,
} from '../apps/game/src/visual-policy-contract.js';

const ENABLED_SHAKE = Object.freeze({
  low: Object.freeze({ mode: 'subtle', maximumConcurrentImpulses: 1 }),
  medium: Object.freeze({ mode: 'standard', maximumConcurrentImpulses: 1 }),
  high: Object.freeze({ mode: 'standard', maximumConcurrentImpulses: 2 }),
} as const);

function shakeSafetyErrors(policy: CameraShakePolicyV1): string[] {
  const errors: string[] = [];
  if (!policy.input.effectsOn && policy.shake.mode !== 'off') errors.push('shake-without-effects');
  if (!policy.input.shakeOn && policy.shake.mode !== 'off') errors.push('shake-without-setting');
  if (policy.input.motion === 'reduced' && policy.shake.mode !== 'off') {
    errors.push('shake-with-reduced-motion');
  }
  if (policy.shake.mode === 'off' && policy.shake.maximumConcurrentImpulses !== 0) {
    errors.push('disabled-shake-budget');
  }
  return errors;
}

describe('CameraShakePolicyV1', () => {
  it('requires effects, shake consent, and full motion at every device tier', () => {
    for (const effectsOn of [false, true]) {
      for (const shakeOn of [false, true]) {
        for (const motion of VISUAL_POLICY_MOTION_STATES_V1) {
          for (const deviceTier of VISUAL_POLICY_DEVICE_TIERS_V1) {
            const policy = resolveCameraShakePolicyV1({
              effectsOn, shakeOn, motion, deviceTier,
            });
            const expected = effectsOn && shakeOn && motion === 'full'
              ? ENABLED_SHAKE[deviceTier]
              : { mode: 'off', maximumConcurrentImpulses: 0 };
            expect(policy).toEqual({
              schema: 'cf.app.camera-shake-policy.v1',
              input: { effectsOn, shakeOn, motion, deviceTier },
              shake: expected,
            });
          }
        }
      }
    }
  });

  it('keeps the exact low/subtle, medium/standard, and high/two-impulse boundaries', () => {
    for (const deviceTier of VISUAL_POLICY_DEVICE_TIERS_V1) {
      expect(resolveCameraShakePolicyV1({
        effectsOn: true, shakeOn: true, motion: 'full', deviceTier,
      }).shake).toEqual(ENABLED_SHAKE[deviceTier]);
    }
  });

  it('is deterministic and recursively freezes its detached projection', () => {
    const input = {
      effectsOn: true, shakeOn: true, motion: 'full', deviceTier: 'high',
    } as const;
    const first = resolveCameraShakePolicyV1(input);
    const second = resolveCameraShakePolicyV1({ ...input });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(first.input).not.toBe(input);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.input)).toBe(true);
    expect(Object.isFrozen(first.shake)).toBe(true);
    expect(() => {
      (first.shake as { maximumConcurrentImpulses: number }).maximumConcurrentImpulses = 99;
    }).toThrow(TypeError);
    expect(first.shake.maximumConcurrentImpulses).toBe(2);
  });

  it('rejects missing, extra, coercible, and unknown inputs instead of enabling shake', () => {
    const invalid: readonly unknown[] = [
      null, undefined, [], {},
      { effectsOn: true, shakeOn: true, motion: 'full' },
      { effectsOn: 'true', shakeOn: true, motion: 'full', deviceTier: 'high' },
      { effectsOn: true, shakeOn: 1, motion: 'full', deviceTier: 'high' },
      { effectsOn: true, shakeOn: true, motion: 'auto', deviceTier: 'high' },
      { effectsOn: true, shakeOn: true, motion: 'full', deviceTier: 'ultra' },
      { effectsOn: true, shakeOn: true, motion: 'full', deviceTier: 'high', amplitude: 99 },
    ];
    for (const input of invalid) {
      expect(() => resolveCameraShakePolicyV1(
        input as Parameters<typeof resolveCameraShakePolicyV1>[0],
      )).toThrow(TypeError);
    }
  });

  it('negative-controls every independent shake gate and the disabled zero budget', () => {
    const withoutEffects = resolveCameraShakePolicyV1({
      effectsOn: false, shakeOn: true, motion: 'full', deviceTier: 'medium',
    });
    expect(shakeSafetyErrors(withoutEffects)).toEqual([]);
    expect(shakeSafetyErrors({
      ...withoutEffects, shake: { mode: 'standard', maximumConcurrentImpulses: 1 },
    })).toEqual(['shake-without-effects']);

    const withoutSetting = resolveCameraShakePolicyV1({
      effectsOn: true, shakeOn: false, motion: 'full', deviceTier: 'medium',
    });
    expect(shakeSafetyErrors(withoutSetting)).toEqual([]);
    expect(shakeSafetyErrors({
      ...withoutSetting, shake: { mode: 'standard', maximumConcurrentImpulses: 1 },
    })).toEqual(['shake-without-setting']);

    const reduced = resolveCameraShakePolicyV1({
      effectsOn: true, shakeOn: true, motion: 'reduced', deviceTier: 'medium',
    });
    expect(shakeSafetyErrors(reduced)).toEqual([]);
    expect(shakeSafetyErrors({
      ...reduced, shake: { mode: 'standard', maximumConcurrentImpulses: 1 },
    })).toEqual(['shake-with-reduced-motion']);

    expect(shakeSafetyErrors({
      ...reduced, shake: { mode: 'off', maximumConcurrentImpulses: 1 },
    })).toEqual(['disabled-shake-budget']);
  });
});
