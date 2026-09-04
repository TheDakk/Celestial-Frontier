/* Truthful, presentation-only Landing copy.

   The transaction-owned descent projector remains the sole source of chance,
   learned-route and damage math. This adapter only compresses that already
   projected policy for the planet card; it consumes no RNG and writes no
   state. */
import {
  isDescentApproachPolicyV1,
  type DescentApproachPolicyV1,
} from '@cf/domain-opportunity';

export const LANDING_CARD_PRESENTATION_SCHEMA_V1 =
  'cf-v2-landing-card-presentation/v1' as const;

export interface LandingCardPresentationV1 {
  readonly schema: typeof LANDING_CARD_PRESENTATION_SCHEMA_V1;
  readonly worldKey: string;
  readonly label: string;
  readonly title: string;
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
  readonly safeReason: DescentApproachPolicyV1['safeReason'];
  readonly learnedApproachBonus: number;
}

function checkedHp(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new RangeError('Landing card requires current positive explorer HP');
  }
  return value as number;
}

function effectiveDamage(
  raw: number,
  policy: DescentApproachPolicyV1,
  hp: number,
): number {
  const hullAdjusted = policy.reinforcedHull && raw > 1 ? raw - 1 : raw;
  return Math.min(
    Math.max(0, hullAdjusted - policy.waveOffDamageReduction),
    Math.max(0, hp - 1),
  );
}

/** Compress one owner-minted descent policy without reproducing its rules. */
export function projectLandingCardPresentationV1(
  policy: DescentApproachPolicyV1,
  explorerHpValue: number,
): LandingCardPresentationV1 {
  if (!isDescentApproachPolicyV1(policy)) {
    throw new TypeError('Landing card requires an owner-projected descent policy');
  }
  const hp = checkedHp(explorerHpValue);
  const damageMin = policy.safeReason === null
    ? effectiveDamage(policy.damageMin, policy, hp) : 0;
  const damageMax = policy.safeReason === null
    ? effectiveDamage(policy.damageMax, policy, hp) : 0;
  const learned = policy.learnedApproachBonus > 0
    ? ` Learned exact-world approach +${policy.learnedApproachBonus}%.` : '';
  const gear = policy.landingGuaranteed
    ? ' Equipped landing gear guarantees arrival.'
    : policy.globalGearBonus + policy.familyGearBonus > 0
      ? ` Equipped landing gear +${policy.globalGearBonus + policy.familyGearBonus}%.`
      : '';
  const weather = policy.stormActive ? ' Active weather is included.' : '';
  const safeCopy = policy.safeReason === 'training'
    ? 'Training landing is a safe route-only exercise.'
    : policy.safeReason === 'earth'
      ? 'Earth landing is guaranteed.'
      : 'This known-world return is guaranteed.';
  return Object.freeze({
    schema: LANDING_CARD_PRESENTATION_SCHEMA_V1,
    worldKey: policy.key,
    label: policy.safeReason === 'revisit'
      ? '⛳ Return safely'
      : policy.safeReason !== null
        ? '⛳ Land safely'
        : `⛳ Land · ${policy.successPercent}%`,
    title: policy.safeReason !== null
      ? safeCopy
      : `Landing chance ${policy.successPercent}%. A safe wave-off may cost ${damageMin}–${damageMax} HP; it cannot defeat the explorer.${learned}${gear}${weather}`,
    successPercent: policy.successPercent,
    damageMin,
    damageMax,
    safeReason: policy.safeReason,
    learnedApproachBonus: policy.learnedApproachBonus,
  });
}
