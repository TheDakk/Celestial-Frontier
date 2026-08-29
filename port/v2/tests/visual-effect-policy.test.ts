import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  resolveVisualEffectPolicyV1,
  type VisualEffectPolicyV1,
} from '../apps/game/src/visual-effect-policy.js';
import {
  VISUAL_POLICY_DEVICE_TIERS_V1,
  VISUAL_POLICY_MOTION_STATES_V1,
} from '../apps/game/src/visual-policy-contract.js';

const EFFECT_SOURCE = fs.readFileSync(fileURLToPath(
  new URL('../apps/game/src/visual-effect-policy.ts', import.meta.url),
), 'utf8');
const SHAKE_SOURCE = fs.readFileSync(fileURLToPath(
  new URL('../apps/game/src/camera-shake-policy.ts', import.meta.url),
), 'utf8');
const CONTRACT_SOURCE = fs.readFileSync(fileURLToPath(
  new URL('../apps/game/src/visual-policy-contract.ts', import.meta.url),
), 'utf8');

const ENABLED_EFFECTS = Object.freeze({
  low: Object.freeze({
    full: Object.freeze({ particles: { mode: 'static', maximumCount: 4 }, bloom: { mode: 'static' } }),
    reduced: Object.freeze({ particles: { mode: 'static', maximumCount: 4 }, bloom: { mode: 'static' } }),
  }),
  medium: Object.freeze({
    full: Object.freeze({ particles: { mode: 'animated', maximumCount: 12 }, bloom: { mode: 'animated' } }),
    reduced: Object.freeze({ particles: { mode: 'static', maximumCount: 6 }, bloom: { mode: 'static' } }),
  }),
  high: Object.freeze({
    full: Object.freeze({ particles: { mode: 'animated', maximumCount: 24 }, bloom: { mode: 'animated' } }),
    reduced: Object.freeze({ particles: { mode: 'static', maximumCount: 10 }, bloom: { mode: 'static' } }),
  }),
} as const);

function effectSafetyErrors(policy: VisualEffectPolicyV1): string[] {
  const errors: string[] = [];
  if (!policy.input.effectsOn
    && (policy.particles.mode !== 'off' || policy.particles.maximumCount !== 0
      || policy.bloom.mode !== 'off')) errors.push('effects-disabled-output');
  if (policy.input.motion === 'reduced'
    && (policy.particles.mode === 'animated' || policy.bloom.mode === 'animated')) {
    errors.push('reduced-motion-animation');
  }
  if (policy.input.deviceTier === 'low'
    && (policy.particles.mode === 'animated' || policy.bloom.mode === 'animated'
      || policy.particles.maximumCount > 4)) errors.push('low-tier-boundary');
  return errors;
}

function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, ' ')
    .replace(/(^|[^:\\])\/\/.*$/gmu, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/gu, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/gu, '""')
    .replace(/`(?:[^`\\]|\\.)*`/gu, '``');
}

const FORBIDDEN_POLICY_SOURCE = Object.freeze([
  ['clock-or-nondeterminism', /\b(?:Date|performance)\b|\bMath\s*\.\s*random\s*\(/u],
  ['ambient-global-state', /\b(?:globalThis|window|document|navigator|screen|devicePixelRatio|matchMedia)\b/u],
  ['renderer-allocation', /\b(?:CanvasRenderingContext2D|HTMLCanvasElement|OffscreenCanvas|RenderTexture|Filter|Graphics)\b/u],
  ['geometry', /\b(?:getBoundingClientRect|getClientRects|offsetWidth|offsetHeight|clientWidth|clientHeight)\b/u],
  ['product-write', /\b(?:repository|localStorage|indexedDB)\b|\.\s*(?:mutate|commit|replace|apply)\s*\(/u],
  ['treatment-duplication', /\b(?:palette|color|contrast|lighting|material|atmosphere)\b/u],
] as const);

function policySourceErrors(source: string, expectedImports: readonly string[]): string[] {
  const errors: string[] = [];
  const imports = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/gu)]
    .map((match) => match[1]!)
    .sort();
  if (JSON.stringify(imports) !== JSON.stringify([...expectedImports].sort())) {
    errors.push(`imports:${imports.join(',')}`);
  }
  const executable = codeOnly(source);
  for (const [label, pattern] of FORBIDDEN_POLICY_SOURCE) {
    if (pattern.test(executable)) errors.push(label);
  }
  return errors;
}

describe('VisualEffectPolicyV1', () => {
  it('turns every particle and bloom path off when effects are disabled', () => {
    for (const motion of VISUAL_POLICY_MOTION_STATES_V1) {
      for (const deviceTier of VISUAL_POLICY_DEVICE_TIERS_V1) {
        expect(resolveVisualEffectPolicyV1({ effectsOn: false, motion, deviceTier })).toEqual({
          schema: 'cf.app.visual-effect-policy.v1',
          input: { effectsOn: false, motion, deviceTier },
          particles: { mode: 'off', maximumCount: 0 },
          bloom: { mode: 'off' },
        });
      }
    }
  });

  it('preserves the exact low/medium/high and full/reduced policy boundaries', () => {
    for (const deviceTier of VISUAL_POLICY_DEVICE_TIERS_V1) {
      for (const motion of VISUAL_POLICY_MOTION_STATES_V1) {
        const expected = ENABLED_EFFECTS[deviceTier][motion];
        expect(resolveVisualEffectPolicyV1({ effectsOn: true, motion, deviceTier })).toEqual({
          schema: 'cf.app.visual-effect-policy.v1',
          input: { effectsOn: true, motion, deviceTier },
          particles: expected.particles,
          bloom: expected.bloom,
        });
      }
    }
  });

  it('is deterministic for every exact input tuple and never retains caller identity', () => {
    for (const effectsOn of [false, true]) {
      for (const motion of VISUAL_POLICY_MOTION_STATES_V1) {
        for (const deviceTier of VISUAL_POLICY_DEVICE_TIERS_V1) {
          const input = { effectsOn, motion, deviceTier } as const;
          const first = resolveVisualEffectPolicyV1(input);
          const second = resolveVisualEffectPolicyV1({ ...input });
          expect(second).toEqual(first);
          expect(second).not.toBe(first);
          expect(first.input).not.toBe(input);
        }
      }
    }
  });

  it('recursively freezes the result and every nested policy record', () => {
    const policy = resolveVisualEffectPolicyV1({
      effectsOn: true, motion: 'full', deviceTier: 'high',
    });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.input)).toBe(true);
    expect(Object.isFrozen(policy.particles)).toBe(true);
    expect(Object.isFrozen(policy.bloom)).toBe(true);
    expect(() => {
      (policy.particles as { maximumCount: number }).maximumCount = 999;
    }).toThrow(TypeError);
    expect(policy.particles.maximumCount).toBe(24);
  });

  it('rejects missing, extra, coercible, and non-finite-tier inputs instead of enabling effects', () => {
    const invalid: readonly unknown[] = [
      null, undefined, [], {},
      { effectsOn: 1, motion: 'full', deviceTier: 'high' },
      { effectsOn: true, motion: true, deviceTier: 'high' },
      { effectsOn: true, motion: 'auto', deviceTier: 'high' },
      { effectsOn: true, motion: 'full', deviceTier: 1 },
      { effectsOn: true, motion: 'full', deviceTier: 'ultra' },
      { effectsOn: true, motion: 'full', deviceTier: 'high', particleCount: 999 },
    ];
    for (const input of invalid) {
      expect(() => resolveVisualEffectPolicyV1(
        input as Parameters<typeof resolveVisualEffectPolicyV1>[0],
      )).toThrow(TypeError);
    }
  });

  it('negative-controls each fail-closed outcome independently', () => {
    const disabled = resolveVisualEffectPolicyV1({
      effectsOn: false, motion: 'full', deviceTier: 'high',
    });
    const disabledMutant: VisualEffectPolicyV1 = {
      ...disabled, bloom: { mode: 'animated' },
    };
    expect(effectSafetyErrors(disabled)).toEqual([]);
    expect(effectSafetyErrors(disabledMutant)).toEqual(['effects-disabled-output']);

    const reduced = resolveVisualEffectPolicyV1({
      effectsOn: true, motion: 'reduced', deviceTier: 'medium',
    });
    const reducedMutant: VisualEffectPolicyV1 = {
      ...reduced, particles: { mode: 'animated', maximumCount: 6 },
    };
    expect(effectSafetyErrors(reduced)).toEqual([]);
    expect(effectSafetyErrors(reducedMutant)).toEqual(['reduced-motion-animation']);

    const low = resolveVisualEffectPolicyV1({
      effectsOn: true, motion: 'full', deviceTier: 'low',
    });
    const lowMutant: VisualEffectPolicyV1 = {
      ...low, particles: { mode: 'static', maximumCount: 5 },
    };
    expect(effectSafetyErrors(low)).toEqual([]);
    expect(effectSafetyErrors(lowMutant)).toEqual(['low-tier-boundary']);
  });

  it('contains only the separate app-policy dependency and no ambient or visual-allocation authority', () => {
    expect(policySourceErrors(CONTRACT_SOURCE, [])).toEqual([]);
    expect(policySourceErrors(EFFECT_SOURCE, ['./visual-policy-contract.js'])).toEqual([]);
    expect(policySourceErrors(SHAKE_SOURCE, ['./visual-policy-contract.js'])).toEqual([]);
  });

  it('negative-controls every source-purity exclusion', () => {
    const mutations: ReadonlyArray<readonly [string, string]> = [
      ['clock-or-nondeterminism', 'void Date.now();'],
      ['ambient-global-state', 'void globalThis;'],
      ['renderer-allocation', 'void new RenderTexture();'],
      ['geometry', 'void getBoundingClientRect();'],
      ['product-write', 'void repository.mutate();'],
      ['treatment-duplication', 'void palette;'],
    ];
    for (const [expected, injection] of mutations) {
      expect(policySourceErrors(`${EFFECT_SOURCE}\n${injection}`, ['./visual-policy-contract.js']))
        .toEqual([expected]);
    }
  });
});
