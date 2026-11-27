import { describe, expect, it } from 'vitest';
import { pick } from '../src/input';
import type { Pickable } from '../src/input/pick';

const body = (key: string, x: number, y: number, priority = 1): Pickable => ({ key, x, y, priority });

describe('pick', () => {
  it('a tap within the pick radius selects the nearest body; equal distance goes to the lower priority, then the key', () => {
    const near = body('near', 104, 100);
    const far = body('far', 90, 100);
    expect(pick([far, near], 100, 100, () => 22)).toBe(near);
    expect(pick([near, far], 100, 100, () => 22)).toBe(near);
    // Equal distance: the lower priority wins, whatever the order given.
    const home = body('z-home', 110, 100, 0);
    const other = body('a-other', 90, 100, 1);
    expect(pick([other, home], 100, 100, () => 22)).toBe(home);
    expect(pick([home, other], 100, 100, () => 22)).toBe(home);
    // Equal distance and priority: the smaller key wins.
    const b = body('b', 100, 110);
    const a = body('a', 100, 90);
    expect(pick([b, a], 100, 100, () => 22)).toBe(a);
    expect(pick([a, b], 100, 100, () => 22)).toBe(a);
    // Nearness comes before priority.
    expect(pick([body('home', 120, 100, 0), near], 100, 100, () => 22)).toBe(near);
  });
  it('a body nearer than its radius is picked; one exactly at it or beyond, or no body at all, gives null, as in the legacy game (5607)', () => {
    expect(pick([body('in', 121.9, 100)], 100, 100, () => 22)?.key).toBe('in');
    expect(pick([body('edge', 122, 100)], 100, 100, () => 22)).toBeNull();
    expect(pick([body('out', 122.5, 100)], 100, 100, () => 22)).toBeNull();
    expect(pick([body('diag', 116, 116)], 100, 100, () => 22)).toBeNull();
    expect(pick([], 100, 100, () => 22)).toBeNull();
  });
  it('the radius is each body\'s own: of two bodies 15 px from the press, only the one with the wider radius is under it', () => {
    const wide = body('planet', 115, 100);
    const narrow = body('faint star', 85, 100);
    const radius = (b: Pickable): number => (b === wide ? 19.2 : 10.8);
    expect(pick([narrow, wide], 100, 100, radius)).toBe(wide);
    expect(pick([narrow], 100, 100, radius)).toBeNull();
    // Under both, the nearer middle still wins, whatever the radii.
    expect(pick([wide, body('near', 104, 100)], 100, 100, (b) => (b === wide ? 19.2 : 5))?.key).toBe('near');
  });
  it('a body\'s target is a disc: a press at the corner of the square about it is not on it', () => {
    const sun = body('sun', 100, 100);
    expect(pick([sun], 129, 100, () => 30)).toBe(sun);
    expect(pick([sun], 121, 121, () => 30)).toBe(sun);
    expect(pick([sun], 122, 122, () => 30)).toBeNull();
    expect(pick([sun], 129, 129, () => 30)).toBeNull();
  });
});
