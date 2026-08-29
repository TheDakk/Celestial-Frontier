import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyCanvasVisualTreatmentV1 } from '../src/canvas-treatment.js';
import { createVisualTreatmentV1 } from '../src/visual-treatment.js';

function traceSurface(width = 440, height = 440): {
  surface: HTMLCanvasElement;
  trace: unknown[];
  contextReads: { count: number };
} {
  const trace: unknown[] = [];
  const contextReads = { count: 0 };
  let gradientId = 0;
  const contextTarget: Record<PropertyKey, unknown> = {};
  const context = new Proxy(contextTarget, {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return (...args: unknown[]) => {
          const id = ++gradientId;
          trace.push(['gradient', String(key), id, ...args]);
          return { addColorStop: (...stop: unknown[]) => trace.push(['stop', id, ...stop]) };
        };
      }
      return (...args: unknown[]) => trace.push(['call', String(key), ...args]);
    },
    set(target, key, value) {
      trace.push(['set', String(key), value && typeof value === 'object' ? 'gradient' : value]);
      return Reflect.set(target, key, value);
    },
  });
  const surface = {
    width,
    height,
    getContext(kind: string) {
      contextReads.count++;
      return kind === '2d' ? context : null;
    },
  } as unknown as HTMLCanvasElement;
  return { surface, trace, contextReads };
}

describe('Canvas VisualTreatmentV1 finishing pass', () => {
  it('makes identity treatment an exact allocation/context/draw no-op', () => {
    const fixture = traceSurface();
    const treatment = createVisualTreatmentV1({ scope: 'species', key: 'fixture' });
    expect(applyCanvasVisualTreatmentV1(fixture.surface, treatment)).toBe(fixture.surface);
    expect(fixture.contextReads.count).toBe(0);
    expect(fixture.trace).toEqual([]);
  });

  it('applies only requested axes under one alpha-preserving source-atop scope', () => {
    const fixture = traceSurface(320, 180);
    applyCanvasVisualTreatmentV1(
      fixture.surface,
      createVisualTreatmentV1(
        { scope: 'planet', key: 'fixture' },
        { color: 'polished', lighting: 'polished', atmosphere: 'polished' },
      ),
    );
    expect(fixture.contextReads.count).toBe(1);
    expect(fixture.trace.filter((entry) => (entry as unknown[])[0] === 'gradient')).toHaveLength(3);
    expect(fixture.trace.filter((entry) => (
      (entry as unknown[])[0] === 'call' && (entry as unknown[])[1] === 'fillRect'
    ))).toHaveLength(3);
    expect(fixture.trace).toContainEqual(['set', 'globalAlpha', 1]);
    expect(fixture.trace).toContainEqual(['set', 'globalCompositeOperation', 'source-atop']);
    expect(fixture.trace[0]).toEqual(['call', 'save']);
    expect(fixture.trace[1]).toEqual(['call', 'setTransform', 1, 0, 0, 1, 0, 0]);
    expect(fixture.trace.at(-1)).toEqual(['call', 'restore']);
  });

  it('grades the full surface even when the producer leaves a nonidentity transform', () => {
    const fixture = traceSurface(512, 512);
    fixture.trace.push(['producer-transform', 256, 256]);
    applyCanvasVisualTreatmentV1(
      fixture.surface,
      createVisualTreatmentV1({ scope: 'galaxy', key: 'translated-painter' }, { color: 'polished' }),
    );
    const resetIndex = fixture.trace.findIndex((entry) => (
      JSON.stringify(entry) === JSON.stringify(['call', 'setTransform', 1, 0, 0, 1, 0, 0])
    ));
    const fillIndex = fixture.trace.findIndex((entry) => (
      (entry as unknown[])[0] === 'call' && (entry as unknown[])[1] === 'fillRect'
    ));
    expect(resetIndex).toBeGreaterThan(0);
    expect(fillIndex).toBeGreaterThan(resetIndex);
    expect(fixture.trace[fillIndex]).toEqual(['call', 'fillRect', 0, 0, 512, 512]);
    expect(fixture.trace.at(-1)).toEqual(['call', 'restore']);
  });

  it('is deterministic and compiles the all-polished preset into one bounded pass', () => {
    const treatment = createVisualTreatmentV1(
      { scope: 'biome', key: 'temperate' },
      {
        color: 'polished', contrast: 'polished', lighting: 'polished',
        material: 'polished', atmosphere: 'polished',
      },
    );
    const first = traceSurface();
    const second = traceSurface();
    applyCanvasVisualTreatmentV1(first.surface, treatment);
    applyCanvasVisualTreatmentV1(second.surface, treatment);
    expect(second.trace).toEqual(first.trace);
    expect(first.trace.filter((entry) => (entry as unknown[])[0] === 'gradient')).toHaveLength(1);
    expect(first.trace.filter((entry) => (
      (entry as unknown[])[0] === 'call' && (entry as unknown[])[1] === 'fillRect'
    ))).toHaveLength(1);
  });

  it('fails before drawing for invalid surfaces or forged treatment records', () => {
    const valid = createVisualTreatmentV1({ scope: 'ship', key: 'fixture' }, { color: 'polished' });
    expect(() => applyCanvasVisualTreatmentV1(
      { width: 0, height: 440, getContext: () => null } as unknown as HTMLCanvasElement,
      valid,
    )).toThrow(/positive canvas/u);
    const fixture = traceSurface();
    expect(() => applyCanvasVisualTreatmentV1(fixture.surface, {
      ...valid,
      grade: { ...valid.grade, geometry: 'polished' },
    } as never)).toThrow(/wrong axes/u);
    expect(fixture.contextReads.count).toBe(0);
    expect(fixture.trace).toEqual([]);
  });

  it('contains no allocation, pixel read, filter, image copy, path, geometry, RNG, or ambient owner', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/canvas-treatment.ts', import.meta.url)), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//gu, ' ').replace(/(^|[^:\\])\/\/.*$/gmu, '$1');
    expect(code).not.toMatch(/\b(?:document|window|globalThis|Date|performance|Math\.random|RenderTexture|Filter|Graphics|getImageData|putImageData|drawImage|clearRect|beginPath|arc|ellipse|moveTo|lineTo)\b|createElement\s*\(/u);
    for (const mutant of [
      'document.createElement()', 'getImageData()', 'drawImage()', 'beginPath()',
      'Math.random()', 'new RenderTexture()',
    ]) expect(mutant).toMatch(/\b(?:document|Math\.random|RenderTexture|getImageData|drawImage|beginPath)\b/u);
  });
});
