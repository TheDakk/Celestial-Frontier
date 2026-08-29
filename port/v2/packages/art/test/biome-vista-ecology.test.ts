import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@cf/domain-rand';
import {
  BIOME_VISUAL_KEYS_V1,
  BIOME_VISUAL_PROFILES_V1,
} from '@cf/art/biome-visual-profile';
import { createVisualTreatmentV1 } from '@cf/art/visual-treatment';
import { applyBiomeVistaEcologyV1 } from '@cf/art/biome-vista-ecology';
import { readTrackedV1Source } from '../../../test-support/tracked-v1-source.js';
import {
  applyPreservedBiomeVistaEcologyV1,
  PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256,
} from '../src/biomevista.worker.verbatim.js';

type Trace = readonly unknown[];

function traceContext(): { context: Record<string, unknown>; trace: unknown[] } {
  const trace: unknown[] = [];
  let gradientId = 0;
  const gradient = (kind: string, args: unknown[]) => {
    const id = ++gradientId;
    trace.push(['gradient', id, kind, ...args]);
    return { addColorStop: (...stop: unknown[]) => trace.push(['stop', id, ...stop]) };
  };
  const methods = new Set(['save', 'restore', 'beginPath', 'ellipse', 'fill', 'fillRect', 'translate', 'rotate']);
  const target: Record<string, unknown> = {
    createLinearGradient: (...args: unknown[]) => gradient('linear', args),
    createRadialGradient: (...args: unknown[]) => gradient('radial', args),
  };
  return {
    trace,
    context: new Proxy(target, {
      get(object, key) {
        if (typeof key === 'string' && methods.has(key)) {
          return (...args: unknown[]) => trace.push(['call', key, ...args]);
        }
        return Reflect.get(object, key);
      },
      set(object, key, value) {
        trace.push(['set', String(key), value]);
        return Reflect.set(object, key, value);
      },
    }),
  };
}

function countedRandomFactory(counter: { draws: number }) {
  return (seed: number) => {
    const random = mulberry32(seed);
    return () => { counter.draws += 1; return random(); };
  };
}

function adapterRun(key: typeof BIOME_VISUAL_KEYS_V1[number]): { trace: Trace; draws: number } {
  const rendered = traceContext();
  const counter = { draws: 0 };
  applyBiomeVistaEcologyV1({
    context: rendered.context,
    width: 960,
    height: 430,
    horizon: 214.25,
    seed: 0x1020_3040,
    biomeKey: key,
    profile: BIOME_VISUAL_PROFILES_V1[key],
    treatment: createVisualTreatmentV1({ scope: 'biome', key }),
    palette: key === 'abyssal' ? 'night' : 'day',
    nightize: false,
    randomFactory: countedRandomFactory(counter),
  });
  return { trace: rendered.trace, draws: counter.draws };
}

function directRun(key: typeof BIOME_VISUAL_KEYS_V1[number]): { trace: Trace; draws: number } {
  const rendered = traceContext();
  const counter = { draws: 0 };
  applyPreservedBiomeVistaEcologyV1(
    rendered.context, 960, 430, 214.25,
    { wb: key, pal: key === 'abyssal' ? 'night' : 'day', nightize: false },
    0x1020_3040, BIOME_VISUAL_PROFILES_V1, countedRandomFactory(counter),
  );
  return { trace: rendered.trace, draws: counter.draws };
}

describe('Biome vista ecology adapter', () => {
  it('routes the exact 43-key authority with identical draw commands and RNG chronology', () => {
    expect(BIOME_VISUAL_KEYS_V1).toHaveLength(43);
    const routed: string[] = [];
    for (const key of BIOME_VISUAL_KEYS_V1) {
      const adapted = adapterRun(key);
      const direct = directRun(key);
      /* JSON command equivalence intentionally normalizes signed zero: a 2D
         context observes -0 and 0 as the same coordinate/pixel. */
      expect(JSON.stringify(adapted.trace), key).toBe(JSON.stringify(direct.trace));
      expect(adapted.draws, key).toBe(direct.draws);
      routed.push(key);
    }
    expect(routed).toEqual([...BIOME_VISUAL_KEYS_V1]);
  });

  it('retains a seal over the exact preserved source function', () => {
    const main = readTrackedV1Source().script;
    const start = main.indexOf('function _hdVistaEco(g, W, H, hz, opts, seed){');
    const end = main.indexOf('\nfunction hdVista(opts){', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const seal = createHash('sha256').update(main.slice(start, end)).digest('hex');
    expect(seal).toBe(PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256);
  });

  it('rejects wrong or missing authority inputs before drawing or consuming RNG', () => {
    const rendered = traceContext();
    const counter = { draws: 0 };
    const base = {
      context: rendered.context, width: 960, height: 430, horizon: 200, seed: 7,
      biomeKey: 'temperate' as const, profile: BIOME_VISUAL_PROFILES_V1.temperate,
      treatment: createVisualTreatmentV1({ scope: 'biome', key: 'temperate' }),
      palette: 'day' as const, nightize: false, randomFactory: countedRandomFactory(counter),
    };
    expect(() => applyBiomeVistaEcologyV1({ ...base, profile: BIOME_VISUAL_PROFILES_V1.savanna })).toThrow(/canonical/);
    expect(() => applyBiomeVistaEcologyV1({ ...base, profile: undefined as never })).toThrow(/canonical/);
    expect(() => applyBiomeVistaEcologyV1({
      ...base,
      treatment: createVisualTreatmentV1({ scope: 'biome', key: 'temperate' }, { atmosphere: 'polished' }),
    })).toThrow(/identity treatment/);
    expect(rendered.trace).toEqual([]);
    expect(counter.draws).toBe(0);
  });

  it('contains no browser, audio, app-state, clock, global-random, or effect-policy ownership', () => {
    const files = [
      new URL('../src/biome-vista-ecology.ts', import.meta.url),
      new URL('../src/biomevista.worker.verbatim.js', import.meta.url),
    ];
    const forbidden = /\b(?:document|window|globalThis|AudioContext|webkitAudioContext|localStorage|vistaBox|performance|Date|OffscreenCanvas|CameraShakePolicyV1|VisualEffectPolicyV1)\b|Math\.random\s*\(|createElement\s*\(/u;
    for (const file of files) expect(readFileSync(fileURLToPath(file), 'utf8')).not.toMatch(forbidden);
    for (const mutant of ['document', 'AudioContext', 'localStorage', 'Date', 'Math.random(', 'CameraShakePolicyV1']) {
      expect(forbidden.test(mutant), mutant).toBe(true);
    }
  });
});
