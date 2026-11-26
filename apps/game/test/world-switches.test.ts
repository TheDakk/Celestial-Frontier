// The game's switches for the new world types: every one is off.
import { describe, expect, it } from 'vitest';
import { SWITCHES_OFF, WORLD_TYPE_KEYS } from '@cf/domain-worldkinds';
import { WORLD_SWITCHES } from '../src/world';

describe('the game\'s world switches', () => {
  it('are all off, one for each new type and one for the kind row, and cannot be written', () => {
    expect(WORLD_SWITCHES).toEqual(SWITCHES_OFF);
    expect(Object.keys(WORLD_SWITCHES).sort()).toEqual([...WORLD_TYPE_KEYS, 'kindRow'].sort());
    expect(Object.values(WORLD_SWITCHES).some((on) => on !== false)).toBe(false);
    expect(Object.isFrozen(WORLD_SWITCHES)).toBe(true);
  });
});
