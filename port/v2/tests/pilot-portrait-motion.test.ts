import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  projectPilotPortraitMotionV1, type PilotPortraitMotionInputV1,
} from '../apps/game/src/pilot-portrait-motion.js';

const active = Object.freeze({
  requestedMode: 'animated', effectsOn: true, motion: 'full', deviceTier: 'high',
  elapsedMs: 3000, visible: true,
} satisfies PilotPortraitMotionInputV1);

describe('pilot presentation-only portrait motion', () => {
  it('changes only an external accent and repeats from explicit elapsed time', () => {
    const projected = projectPilotPortraitMotionV1(active);
    expect(projected).toMatchObject({
      mode: 'animated', motionScope: 'outside-portrait-frame', accentAngleDeg: 90, accentOpacity: 0.3,
      portraitTransform: 'none', portraitFilter: 'none', portraitOpacity: 1,
      anatomicalAnimation: 'incomplete', staticPortraitRetained: true,
    });
    expect(projected.label).toContain('Presentation-only');
    expect(projected.label).toContain('anatomical animation incomplete');
    expect(projectPilotPortraitMotionV1({ ...active, elapsedMs: 15000 })).toEqual(projected);
    expect(projectPilotPortraitMotionV1({ ...active, elapsedMs: 6000 }).accentAngleDeg).toBe(180);
    expect(Object.isFrozen(projected)).toBe(true);
  });

  it('permits the allocation-free external CSS marker on low tier', () => {
    expect(projectPilotPortraitMotionV1({ ...active, deviceTier: 'low' })).toEqual(projectPilotPortraitMotionV1(active));
  });

  it.each([
    [{ requestedMode: 'static' }, 'static', 0.3],
    [{ motion: 'reduced' }, 'static', 0.3],
    [{ effectsOn: false }, 'off', 0],
    [{ visible: false }, 'off', 0],
  ] as const)('quiets motion for %j while retaining the exact static portrait', (override, mode, opacity) => {
    const state = { ...active, ...override };
    const start = projectPilotPortraitMotionV1(state);
    expect(start).toMatchObject({
      mode, accentAngleDeg: 0, accentOpacity: opacity,
      portraitTransform: 'none', portraitFilter: 'none', portraitOpacity: 1,
      anatomicalAnimation: 'incomplete', staticPortraitRetained: true,
    });
    expect(projectPilotPortraitMotionV1({ ...state, elapsedMs: 99999 })).toEqual(start);
  });

  it.each([
    { elapsedMs: -1 }, { elapsedMs: NaN }, { elapsedMs: Infinity }, { elapsedMs: '3000' },
    { requestedMode: 'anatomical' }, { motion: 'unknown' }, { deviceTier: 'unknown' },
    { effectsOn: 1 }, { visible: 1 }, { extra: true },
  ])('refuses invalid input rather than inventing a motion permission: %j', (override) => {
    expect(() => projectPilotPortraitMotionV1({ ...active, ...override } as PilotPortraitMotionInputV1)).toThrow(TypeError);
  });

  it('owns no painter, timer, display or persistence operation', () => {
    const source = readFileSync(new URL('../apps/game/src/pilot-portrait-motion.ts', import.meta.url), 'utf8');
    const executable = source.replace(/\/\*[\s\S]*?\*\//gu, ' ');
    expect(executable).not.toMatch(/\b(?:Date|performance|window|document|navigator|requestAnimationFrame|setTimeout|setInterval)\b/u);
    expect(executable).not.toMatch(/Math\.random|drawImage|renderSpecies|createElement|save\.|persist\(/u);
  });
});
