/* Pure operational policy for the live visual-effect consumers. It chooses only
   permissions and ceilings; it owns no palette, treatment, renderer, or
   product state and deliberately performs no visual allocation. */
import {
  checkedVisualPolicyBooleanV1,
  checkedVisualPolicyDeviceTierV1,
  checkedVisualPolicyInputV1,
  checkedVisualPolicyMotionStateV1,
  recursivelyFreezeVisualPolicyV1,
  type VisualPolicyDeviceTierV1,
  type VisualPolicyMotionStateV1,
} from './visual-policy-contract.js';

export interface VisualEffectPolicyInputV1 {
  readonly effectsOn: boolean;
  readonly motion: VisualPolicyMotionStateV1;
  readonly deviceTier: VisualPolicyDeviceTierV1;
}

export type VisualParticlePolicyV1 =
  | Readonly<{ mode: 'off'; maximumCount: 0 }>
  | Readonly<{ mode: 'static' | 'animated'; maximumCount: number }>;

export type VisualBloomPolicyV1 = Readonly<{
  mode: 'off' | 'static' | 'animated';
}>;

export interface VisualEffectPolicyV1 {
  readonly schema: 'cf.app.visual-effect-policy.v1';
  readonly input: VisualEffectPolicyInputV1;
  readonly particles: VisualParticlePolicyV1;
  readonly bloom: VisualBloomPolicyV1;
}

const VISUAL_EFFECT_TIER_BUDGETS_V1 = recursivelyFreezeVisualPolicyV1({
  low: { staticParticles: 4, animatedParticles: 0 },
  medium: { staticParticles: 6, animatedParticles: 12 },
  high: { staticParticles: 10, animatedParticles: 24 },
} satisfies Readonly<Record<VisualPolicyDeviceTierV1, Readonly<{
  staticParticles: number;
  animatedParticles: number;
}>>>);

const EXPECTED_FIELDS = Object.freeze(['effectsOn', 'motion', 'deviceTier'] as const);

/** Resolve one allocation-free effect policy from exact caller-owned inputs.
 * Low-tier and reduced-motion paths retain bounded static decoration only. */
export function resolveVisualEffectPolicyV1(input: VisualEffectPolicyInputV1): VisualEffectPolicyV1 {
  const source = checkedVisualPolicyInputV1(input, EXPECTED_FIELDS, 'visual effect policy');
  const effectsOn = checkedVisualPolicyBooleanV1(source.effectsOn, 'visual effect policy effectsOn');
  const motion = checkedVisualPolicyMotionStateV1(source.motion);
  const deviceTier = checkedVisualPolicyDeviceTierV1(source.deviceTier);
  const budget = VISUAL_EFFECT_TIER_BUDGETS_V1[deviceTier];
  const animated = effectsOn && motion === 'full' && budget.animatedParticles > 0;

  return recursivelyFreezeVisualPolicyV1({
    schema: 'cf.app.visual-effect-policy.v1' as const,
    input: { effectsOn, motion, deviceTier },
    particles: !effectsOn
      ? { mode: 'off' as const, maximumCount: 0 as const }
      : animated
        ? { mode: 'animated' as const, maximumCount: budget.animatedParticles }
        : { mode: 'static' as const, maximumCount: budget.staticParticles },
    bloom: {
      mode: !effectsOn ? 'off' as const
        : animated ? 'animated' as const : 'static' as const,
    },
  });
}
