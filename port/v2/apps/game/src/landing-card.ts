/* Truthful, presentation-only Landing copy.

   The transaction-owned descent projector remains the sole source of chance,
   learned-route and damage math. This adapter only compresses that already
   projected policy for the planet card; it consumes no RNG and writes no
   state. */
import {
  isDescentApproachPolicyV1,
  type DescentApproachPolicyV1,
} from './descent-policy.js';

export const LANDING_CARD_PRESENTATION_SCHEMA_V1 =
  'cf-v2-landing-card-presentation/v1' as const;

export interface LandingCardPresentationV1 {
  readonly schema: typeof LANDING_CARD_PRESENTATION_SCHEMA_V1;
  readonly worldKey: string;
  readonly label: string;
  readonly title: string;
  /** Visible beside the action on touch as well as described to assistive technology. */
  readonly disclosure: string;
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
  readonly safeReason: DescentApproachPolicyV1['safeReason'];
  readonly learnedApproachBonus: number;
}

export type LandingCardStateV1 =
  | Readonly<{
    readonly kind: 'ready';
    readonly worldKey: string;
    readonly label: string;
    readonly title: string;
    readonly disclosure: string;
    readonly successPercent: number;
    readonly damageMin: number;
    readonly damageMax: number;
  }>
  | Readonly<{ readonly kind: 'unavailable' }>;

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
  return Math.min(
    Math.max(0, raw - policy.waveOffDamageReduction),
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
  const guaranteed = policy.successPercent === 100;
  const damageMin = guaranteed ? 0 : effectiveDamage(policy.damageMin, policy, hp);
  const damageMax = guaranteed ? 0 : effectiveDamage(policy.damageMax, policy, hp);
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
  const disclosure = guaranteed
    ? `Guaranteed arrival · 0 HP descent risk.${learned}${gear}`
    : `Wave-off: ${damageMin}–${damageMax} HP; at least 1 HP remains.${learned}${gear}${weather}`;
  return Object.freeze({
    schema: LANDING_CARD_PRESENTATION_SCHEMA_V1,
    worldKey: policy.key,
    label: policy.safeReason === 'revisit'
      ? '⛳ Return safely'
      : guaranteed
        ? '⛳ Land safely'
        : `⛳ Land · ${policy.successPercent}%`,
    title: policy.safeReason !== null
      ? `${safeCopy} ${disclosure}`
      : guaranteed
        ? disclosure
        : `Landing chance ${policy.successPercent}%. ${disclosure}`,
    disclosure,
    successPercent: policy.successPercent,
    damageMin,
    damageMax,
    safeReason: policy.safeReason,
    learnedApproachBonus: policy.learnedApproachBonus,
  });
}

export function landingCardActionHtml(
  state: LandingCardStateV1,
  esc: (value: unknown) => string,
): string {
  if (state.kind === 'unavailable') {
    return '<button type="button" data-act="landcta" disabled title="Landing is unavailable until expedition authority is ready" style="background:rgba(202,162,79,0.08);color:var(--dim);border:1px solid rgba(202,162,79,0.35);border-radius:999px;padding:8px 16px;min-height:44px;font:12px system-ui">⛳ Landing unavailable</button>';
  }
  return `<span style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:100%"><button type="button" data-act="landcta" data-landing-world="${esc(state.worldKey)}" data-landing-success="${state.successPercent}" data-landing-damage-min="${state.damageMin}" data-landing-damage-max="${state.damageMax}" title="${esc(state.title)}" aria-label="${esc(state.label)}" aria-describedby="landing-approach-disclosure" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">${esc(state.label)}</button><span id="landing-approach-disclosure" data-landing-disclosure style="max-width:32ch;color:var(--text);font:12px/1.4 system-ui">${esc(state.disclosure)}</span></span>`;
}
