import { describe, expect, it } from 'vitest';
import type {
  CanvasVisualContextV1,
  CanvasVisualGradientV1,
  CanvasVisualSurfaceV1,
} from '../src/canvas-treatment.js';
import {
  polishBiomeCanvasV1,
  polishGalaxyCanvasV1,
  polishPlanetCanvasV1,
  polishSpeciesCanvasV1,
  polishSystemCanvasV1,
} from '../src/surface-polish.js';

function tracedSurface(): { surface: CanvasVisualSurfaceV1; trace: string[] } {
  const trace: string[] = [];
  const gradient: CanvasVisualGradientV1 = {
    addColorStop: () => trace.push('stop'),
  };
  const context: CanvasVisualContextV1 = {
    globalAlpha: 0,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    save: () => trace.push('save'),
    restore: () => trace.push('restore'),
    setTransform: () => trace.push('identity-transform'),
    fillRect: () => trace.push('fill'),
    createLinearGradient: () => {
      trace.push('linear');
      return gradient;
    },
    createRadialGradient: () => {
      trace.push('radial');
      return gradient;
    },
  };
  return {
    surface: {
      width: 64,
      height: 64,
      getContext: () => {
        trace.push('context');
        return context;
      },
    },
    trace,
  };
}

describe('universe-wide painter finishing owners', () => {
  it.each([
    ['galaxy', polishGalaxyCanvasV1],
    ['system', polishSystemCanvasV1],
    ['planet', polishPlanetCanvasV1],
    ['biome', polishBiomeCanvasV1],
    ['species', polishSpeciesCanvasV1],
  ] as const)('%s compiles all five finite axes into one pass exactly once per surface', (_scope, polish) => {
    const fixture = tracedSurface();
    expect(polish(fixture.surface)).toBe(fixture.surface);
    expect(fixture.trace.filter((entry) => entry === 'context')).toHaveLength(1);
    expect(fixture.trace.filter((entry) => entry === 'fill')).toHaveLength(1);
    const firstTrace = [...fixture.trace];
    expect(polish(fixture.surface)).toBe(fixture.surface);
    expect(fixture.trace).toEqual(firstTrace);

    const other = tracedSurface();
    polish(other.surface);
    expect(other.trace.filter((entry) => entry === 'fill')).toHaveLength(1);
  });

  it('keeps each scope owner independent when one canvas legitimately crosses scopes', () => {
    const fixture = tracedSurface();
    polishGalaxyCanvasV1(fixture.surface);
    polishSystemCanvasV1(fixture.surface);
    polishPlanetCanvasV1(fixture.surface);
    polishBiomeCanvasV1(fixture.surface);
    polishSpeciesCanvasV1(fixture.surface);
    expect(fixture.trace.filter((entry) => entry === 'context')).toHaveLength(5);
    expect(fixture.trace.filter((entry) => entry === 'fill')).toHaveLength(5);
  });
});
