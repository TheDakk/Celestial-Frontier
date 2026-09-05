import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { battleStats } from '@cf/domain-combatcore';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  BIOSCAN_DEPTH_TAX_V1,
  projectBioscanHazardPolicyV1,
  resolveBioscanHazardV1,
  strongestFaunaPowerForBioscanV1,
} from '../apps/game/src/bioscan-hazard.js';
import {
  canonicalWorldRoster,
} from '../apps/game/src/world-roster.js';

beforeAll(() => installCaptureHooks());

function address(galaxy = { seed: 999, x: 90, y: -60 }) {
  const result = resolveCF1WorldAddress({
    galaxy,
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: 133 },
  });
  if (!result.ok) throw new Error(`fixture address refused: ${result.reason}`);
  return result.address;
}

function policy(overrides: Partial<Parameters<typeof projectBioscanHazardPolicyV1>[0]> = {}) {
  return projectBioscanHazardPolicyV1({
    address: address(), planetType: 'terran', strongestFaunaPower: 440,
    settled: false, reinforcedHull: false, fieldWoundReduction: 0,
    ...overrides,
  });
}

describe('hostile bioscan policy', () => {
  it('preserves danger probability, lava/venus surcharge, settled safety, and home depth tax', () => {
    expect(policy()).toMatchObject({
      probability: 0.5, depthTax: 0.8, baseDamage: 24,
      hullAdjustedDamage: 24, finalDamage: 24, safeReason: null,
    });
    expect(policy({ strongestFaunaPower: 170 }).probability).toBe(0);
    expect(policy({ strongestFaunaPower: 690 }).probability).toBe(0.5);
    expect(policy({ strongestFaunaPower: 690, planetType: 'lava' }).probability).toBe(0.62);
    /* dangerOf caps the base at .5 before adding .12, so its later .65 guard
       is unreachable; preserve the actual .62 result rather than the comment. */
    expect(policy({ strongestFaunaPower: 1_000, planetType: 'venus' }).probability).toBe(0.62);
    expect(policy({ settled: true })).toMatchObject({ probability: 0, safeReason: 'settled' });
    expect(policy({ strongestFaunaPower: 0 })).toMatchObject({
      probability: 0, baseDamage: 0, finalDamage: 0, safeReason: 'no-fauna',
    });
  });

  it('preserves the six-rung distance ruler and rounds Hull before the capped scut reduction', () => {
    expect(BIOSCAN_DEPTH_TAX_V1).toEqual([1, 1.3, 1.6, 1.9, 2.2, 2.5]);
    expect(policy({ reinforcedHull: true, fieldWoundReduction: 0.7 })).toMatchObject({
      baseDamage: 24, hullAdjustedDamage: 18, finalDamage: 5,
    });
  });

  it('uses one caller-supplied unit draw with an exact strict threshold', () => {
    const projected = policy();
    expect(resolveBioscanHazardV1(projected, projected.probability - Number.EPSILON).kind)
      .toBe('hostile');
    expect(resolveBioscanHazardV1(projected, projected.probability)).toEqual({
      kind: 'clear', policy: projected, damage: 0,
    });
    expect(resolveBioscanHazardV1(policy({ settled: true }), 0).kind).toBe('safe');
    expect(() => resolveBioscanHazardV1(projected, 1)).toThrow(/unit draw/u);
    expect(() => resolveBioscanHazardV1(structuredClone(projected), 0))
      .toThrow(/owner policy/u);
  });

  it('derives Power from the canonical full roster and refuses structural clones', () => {
    const earth = address();
    const canonical = canonicalWorldRoster(earth, 0);
    if (!canonical.ok) throw new Error(`canonical roster refused: ${canonical.reason}`);
    const expected = canonical.roster.view.all.reduce((strongest, row) => row.kingdom === 'fauna'
      ? Math.max(strongest, battleStats(row).total) : strongest, 0);
    expect(strongestFaunaPowerForBioscanV1(canonical.roster)).toBe(expected);
    expect(() => strongestFaunaPowerForBioscanV1(structuredClone(canonical.roster)))
      .toThrow(/canonical full/u);
  });

  it('rejects unregistered addresses, malformed exact fields, accessors, and unsupported reductions', () => {
    expect(() => policy({ fieldWoundReduction: 0.700_001 })).toThrow(/exact canonical/u);
    expect(() => policy({ strongestFaunaPower: 2.5 })).toThrow(/exact canonical/u);
    expect(() => policy({ address: structuredClone(address()) })).toThrow(/exact canonical/u);
    const input = {
      address: address(), planetType: 'terran', strongestFaunaPower: 440,
      settled: false, reinforcedHull: false,
      get fieldWoundReduction() { return 0; },
    };
    expect(() => projectBioscanHazardPolicyV1(input)).toThrow(/exact canonical/u);
  });
});
