/* Hostile bioscan policy, lifted without changing the legacy ruler.

   This module owns arithmetic only. The app action must supply the strongest
   fauna Power from its canonical full roster, exact world identity and
   registered loadout capabilities; it owns no RNG, save write, injury or UI. */
import { regionAt } from '@cf/domain-strays';
import { battleStats } from '@cf/domain-combatcore';
import {
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export const BIOSCAN_HAZARD_DOMAIN_V1 = 'survey.hazard' as const;
export const BIOSCAN_DEPTH_TAX_V1 = Object.freeze([1, 1.3, 1.6, 1.9, 2.2, 2.5] as const);
export const BIOSCAN_FIELD_WOUND_REDUCTION_CAP_V1 = 0.7;
export const BIOSCAN_REINFORCED_HULL_FACTOR_V1 = 0.75;
const HOME_GALAXY_SEED = 999;
const HAZARD_POLICIES = new WeakSet<object>();

export interface BioscanHazardPolicyInputV1 {
  readonly address: CanonicalCF1WorldAddress;
  readonly planetType: string;
  readonly strongestFaunaPower: number;
  readonly settled: boolean;
  readonly reinforcedHull: boolean;
  readonly fieldWoundReduction: number;
}

export interface BioscanHazardPolicyV1 {
  readonly probability: number;
  readonly strongestFaunaPower: number;
  readonly depthTax: number;
  readonly baseDamage: number;
  readonly hullAdjustedDamage: number;
  readonly finalDamage: number;
  readonly safeReason: 'no-fauna' | 'settled' | null;
}

export type BioscanHazardOutcomeV1 = Readonly<{
  kind: 'safe' | 'clear' | 'hostile';
  policy: BioscanHazardPolicyV1;
  damage: number;
}>;

/** The full production roster is the only Power source. The eight-row visual
 * preview and diagnostic clones cannot omit a stronger offscreen creature. */
export function strongestFaunaPowerForBioscanV1(roster: CanonicalWorldRoster): number {
  if (!isCanonicalWorldRoster(roster)) {
    throw new TypeError('bioscan hazard requires the canonical full world roster');
  }
  let strongest = 0;
  for (const row of roster.view.all) {
    if (row.kingdom !== 'fauna') continue;
    const total = battleStats(row).total;
    if (!Number.isSafeInteger(total) || total < 0) {
      throw new TypeError('bioscan fauna Power must be a non-negative safe integer');
    }
    strongest = Math.max(strongest, total);
  }
  return strongest;
}

function capture(value: BioscanHazardPolicyInputV1): BioscanHazardPolicyInputV1 | null {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const expected = [
      'address', 'fieldWoundReduction', 'planetType', 'reinforcedHull', 'settled',
      'strongestFaunaPower',
    ];
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== 'string')
      || (keys as string[]).sort().some((key, index) => key !== expected[index])
      || keys.length !== expected.length) return null;
    const data: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of expected) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      data[key] = descriptor.value;
    }
    if (!isCanonicalCF1Address(data.address) || !('planet' in data.address)
      || typeof data.planetType !== 'string' || data.planetType.length === 0
      || data.planetType.length > 32
      || typeof data.strongestFaunaPower !== 'number'
      || !Number.isSafeInteger(data.strongestFaunaPower) || data.strongestFaunaPower < 0
      || typeof data.settled !== 'boolean' || typeof data.reinforcedHull !== 'boolean'
      || typeof data.fieldWoundReduction !== 'number'
      || !Number.isFinite(data.fieldWoundReduction)
      || data.fieldWoundReduction < 0
      || data.fieldWoundReduction > BIOSCAN_FIELD_WOUND_REDUCTION_CAP_V1) return null;
    return Object.freeze(data) as unknown as BioscanHazardPolicyInputV1;
  } catch {
    return null;
  }
}

/** Exact legacy dangerOf → Hull → scut arithmetic. A zero strongest Power is
 * the explicit no-fauna sentinel; settled worlds remain scan-safe. */
export function projectBioscanHazardPolicyV1(
  value: BioscanHazardPolicyInputV1,
): BioscanHazardPolicyV1 {
  const input = capture(value);
  if (input === null) throw new TypeError('bioscan hazard policy requires exact canonical inputs');
  const noFauna = input.strongestFaunaPower === 0;
  const depthTax = input.address.galaxy.seed === HOME_GALAXY_SEED
    ? 0.8
    : BIOSCAN_DEPTH_TAX_V1[Math.min(
      regionAt(input.address.galaxy.x, input.address.galaxy.y),
      BIOSCAN_DEPTH_TAX_V1.length - 1,
    )]!;
  let probability = noFauna ? 0 : Math.min(0.5, Math.max(0,
    (input.strongestFaunaPower - 170) / 520,
  ));
  if (!noFauna && (input.planetType === 'lava' || input.planetType === 'venus')) {
    probability = Math.min(0.65, probability + 0.12);
  }
  if (input.settled) probability = 0;
  const baseDamage = noFauna ? 0 : Math.max(1, Math.round(
    (10 + input.strongestFaunaPower / 22) * depthTax,
  ));
  const hullAdjustedDamage = input.reinforcedHull && baseDamage > 0
    ? Math.max(1, Math.round(baseDamage * BIOSCAN_REINFORCED_HULL_FACTOR_V1))
    : baseDamage;
  const finalDamage = hullAdjustedDamage > 0
    ? Math.max(1, Math.round(hullAdjustedDamage * (1 - input.fieldWoundReduction)))
    : 0;
  const policy: BioscanHazardPolicyV1 = Object.freeze({
    probability,
    strongestFaunaPower: input.strongestFaunaPower,
    depthTax,
    baseDamage,
    hullAdjustedDamage,
    finalDamage,
    safeReason: noFauna ? 'no-fauna' : input.settled ? 'settled' : null,
  });
  HAZARD_POLICIES.add(policy);
  return policy;
}

/** Resolve one SessionRNG survey.hazard draw. Injury and scan-ledger policy
 * remain the caller's atomic settlement concern. */
export function resolveBioscanHazardV1(
  policy: BioscanHazardPolicyV1,
  draw: number,
): BioscanHazardOutcomeV1 {
  if (!policy || typeof policy !== 'object' || !HAZARD_POLICIES.has(policy)
    || typeof draw !== 'number' || !Number.isFinite(draw) || draw < 0 || draw >= 1) {
    throw new TypeError('bioscan hazard resolution requires an owner policy and unit draw');
  }
  if (policy.probability === 0) {
    return Object.freeze({ kind: 'safe', policy, damage: 0 });
  }
  if (draw >= policy.probability) {
    return Object.freeze({ kind: 'clear', policy, damage: 0 });
  }
  return Object.freeze({ kind: 'hostile', policy, damage: policy.finalDamage });
}
