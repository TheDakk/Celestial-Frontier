/** D55: the library battery is its own check profile, and production runs it (develop does not), so no delivered creature ships
 * without the full per-creature battery. Roster rules: apps/game/src/test-roster.test.ts. */
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable profile policy intentionally has no declaration shim (as in tracked-input-preflight.test.ts).
import { CHECK_PROFILE_COMMANDS } from '../tools/check-profile.mjs';
import { LIBRARY_BATTERY_PARTS } from '../tools/library-battery.mjs';

describe('D55 library profile', () => {
  it('library and production run all three parts; develop runs none', () => {
    const json = (p: 'library' | 'production' | 'develop') => JSON.stringify(CHECK_PROFILE_COMMANDS[p]);
    expect(Object.keys(LIBRARY_BATTERY_PARTS).sort()).toEqual(['arena', 'matchup', 'sweep']);
    for (const part of Object.keys(LIBRARY_BATTERY_PARTS)) {
      expect(json('library')).toContain('--part=' + part); expect(json('production')).toContain('--part=' + part); expect(json('develop')).not.toContain('--part=' + part);
    }
    // the sweep and the rest of the arena split one file without overlap or gap
    expect(LIBRARY_BATTERY_PARTS.sweep.at(-1)).toBe('SCALE SWEEP'); expect(new RegExp(LIBRARY_BATTERY_PARTS.arena.at(-1)!).test('SCALE SWEEP: every archetype')).toBe(false);
    expect(new RegExp(LIBRARY_BATTERY_PARTS.arena.at(-1)!).test('every archetype stands INSIDE the frame')).toBe(true);
  });
});
