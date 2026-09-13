/* Presentation comparison only. The portrait never moves, fades, deforms or
   receives a filter. The caller may rotate one separate frame accent outside
   the portrait bounds; this is not evidence of living/anatomical animation. */
import { resolveVisualEffectPolicyV1 } from './visual-effect-policy.js';
import {
  checkedVisualPolicyBooleanV1,
  checkedVisualPolicyInputV1,
  recursivelyFreezeVisualPolicyV1,
  type VisualPolicyDeviceTierV1,
  type VisualPolicyMotionStateV1,
} from './visual-policy-contract.js';

export type PilotPortraitComparisonModeV1 = 'static' | 'animated';
export interface PilotPortraitMotionInputV1 {
  readonly requestedMode: PilotPortraitComparisonModeV1;
  readonly effectsOn: boolean;
  readonly motion: VisualPolicyMotionStateV1;
  readonly deviceTier: VisualPolicyDeviceTierV1;
  readonly elapsedMs: number;
  readonly visible: boolean;
}
export interface PilotPortraitMotionV1 {
  readonly schema: 'cf.app.pilot-portrait-motion.v1';
  readonly mode: 'off' | 'static' | 'animated';
  readonly motionScope: 'outside-portrait-frame';
  readonly accentAngleDeg: number;
  readonly accentOpacity: number;
  readonly portraitTransform: 'none';
  readonly portraitFilter: 'none';
  readonly portraitOpacity: 1;
  readonly anatomicalAnimation: 'incomplete';
  readonly staticPortraitRetained: true;
  readonly label: string;
}

const INPUT_FIELDS = Object.freeze([
  'requestedMode', 'effectsOn', 'motion', 'deviceTier', 'elapsedMs', 'visible',
] as const);

export function projectPilotPortraitMotionV1(input: PilotPortraitMotionInputV1): PilotPortraitMotionV1 {
  const fields = checkedVisualPolicyInputV1(input, INPUT_FIELDS, 'pilot portrait motion');
  if (fields.requestedMode !== 'static' && fields.requestedMode !== 'animated') {
    throw new TypeError('pilot portrait comparison must be static or animated');
  }
  if (typeof fields.elapsedMs !== 'number' || !Number.isFinite(fields.elapsedMs) || fields.elapsedMs < 0) {
    throw new TypeError('pilot portrait elapsedMs must be finite and nonnegative');
  }
  const visible = checkedVisualPolicyBooleanV1(fields.visible, 'pilot portrait visible');
  const effects = resolveVisualEffectPolicyV1({
    effectsOn: input.effectsOn, motion: input.motion, deviceTier: input.deviceTier,
  });
  // This tiny external CSS marker needs no bloom, painter work or frame loop,
  // so low-tier devices may animate it while the portrait stays untouched.
  const mode = !visible || effects.bloom.mode === 'off' ? 'off'
    : fields.requestedMode === 'animated' && fields.motion === 'full' ? 'animated' : 'static';
  return recursivelyFreezeVisualPolicyV1({
    schema: 'cf.app.pilot-portrait-motion.v1' as const,
    mode,
    motionScope: 'outside-portrait-frame' as const,
    accentAngleDeg: mode === 'animated' ? (fields.elapsedMs % 12_000) / 12_000 * 360 : 0,
    accentOpacity: mode === 'off' ? 0 : 0.3,
    portraitTransform: 'none' as const,
    portraitFilter: 'none' as const,
    portraitOpacity: 1 as const,
    anatomicalAnimation: 'incomplete' as const,
    staticPortraitRetained: true as const,
    label: mode === 'animated'
      ? 'Presentation-only frame motion · anatomical animation incomplete'
      : 'Static portrait retained · anatomical animation incomplete',
  });
}
