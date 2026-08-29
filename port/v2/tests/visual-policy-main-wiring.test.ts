import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(
  new URL('../apps/game/src/main.ts', import.meta.url),
), 'utf8');

function productionWiringErrors(value: string): string[] {
  const errors: string[] = [];
  const required: readonly (readonly [string, number])[] = [
    ["from './visual-effect-policy.js'", 1],
    ["from './camera-shake-policy.js'", 1],
    ['resolveVisualEffectPolicyV1({', 1],
    ['resolveCameraShakePolicyV1({', 1],
    ['id="setfx" data-sel="set-effects"', 1],
    ['id="setshake" data-sel="set-shake"', 1],
    ['save.fxOn = !save.fxOn;', 1],
    ['save.shakeOn = !save.shakeOn;', 1],
    ['for (const candidate of selectFogParticleCandidatesV1(', 1],
    ['if (a <= 0.03) continue;', 1],
    ["effectPolicy.particles.mode === 'animated'", 1],
    ["effectPolicy.bloom.mode === 'animated'", 2],
    ['buildCurrentSceneTransaction(); triggerCameraShake();', 1],
    ['activeCameraShakes.size >= policy.shake.maximumConcurrentImpulses', 1],
    ['visualEffectPolicy: currentVisualEffectPolicy()', 1],
    ['cameraShakePolicy: currentCameraShakePolicy()', 1],
  ];
  for (const [token, minimum] of required) {
    if (value.split(token).length - 1 < minimum) errors.push(token);
  }
  return errors;
}

function protostarBloomPolicyErrors(value: string): string[] {
  const branch = /else if \(ga\.kind === 'proto'\) \{\s*ga\.spr\.alpha = effectPolicy\.bloom\.mode === 'animated'\s*\? 0\.7 \+ 0\.3 \* Math\.sin\(t \* 3 \+ \(ga\.seed % 7\)\)\s*: effectPolicy\.bloom\.mode === 'static' \? 0\.85 : 1;\s*\}/u;
  return branch.test(value) ? [] : ['protostar full/static/off bloom branch'];
}

describe('live visual policy wiring', () => {
  it('connects saved preferences to bounded scene owners, planetfall shake, and diagnostics', () => {
    expect(productionWiringErrors(source)).toEqual([]);
  });

  it('negative-controls every production boundary token', () => {
    for (const token of [
      'save.fxOn = !save.fxOn;',
      'save.shakeOn = !save.shakeOn;',
      'for (const candidate of selectFogParticleCandidatesV1(',
      'if (a <= 0.03) continue;',
      "effectPolicy.particles.mode === 'animated'",
      "effectPolicy.bloom.mode === 'animated'",
      'buildCurrentSceneTransaction(); triggerCameraShake();',
      'activeCameraShakes.size >= policy.shake.maximumConcurrentImpulses',
    ]) {
      expect(productionWiringErrors(source.replaceAll(token, '/* removed */')), token).toContain(token);
    }
  });

  it('negative-controls the protostar full/static/off branch independently', () => {
    expect(protostarBloomPolicyErrors(source)).toEqual([]);
    for (const mutant of [
      source.replace(
        "ga.spr.alpha = effectPolicy.bloom.mode === 'animated'",
        'ga.spr.alpha = true',
      ),
      source.replace(
        "effectPolicy.bloom.mode === 'static' ? 0.85",
        'true ? 0.85',
      ),
      source.replace(
        '? 0.85 : 1;',
        '? 0.85 : 0.85;',
      ),
    ]) {
      /* The older aggregate token counter remains green because blazars and
         bright stars still use the bloom policy. This branch-specific oracle
         must independently catch a protostar-only bypass. */
      expect(productionWiringErrors(mutant)).toEqual([]);
      expect(protostarBloomPolicyErrors(mutant))
        .toContain('protostar full/static/off bloom branch');
    }
  });
});
