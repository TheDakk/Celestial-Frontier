import { describe, expect, it } from 'vitest';
import { pick } from '../src/input';
import type { Pickable } from '../src/input/pick';

const body = (key: string, x: number, y: number, priority = 1): Pickable => ({ key, x, y, priority });

describe('pick', () => {
  it('a tap within the pick radius selects the nearest body; equal distance goes to the lower priority, then the key', () => {
    const near = body('near', 104, 100);
    const far = body('far', 90, 100);
    expect(pick([far, near], 100, 100, 22)).toBe(near);
    expect(pick([near, far], 100, 100, 22)).toBe(near);
    // Equal distance: the lower priority wins, whatever the order given.
    const home = body('z-home', 110, 100, 0);
    const other = body('a-other', 90, 100, 1);
    expect(pick([other, home], 100, 100, 22)).toBe(home);
    expect(pick([home, other], 100, 100, 22)).toBe(home);
    // Equal distance and priority: the smaller key wins.
    const b = body('b', 100, 110);
    const a = body('a', 100, 90);
    expect(pick([b, a], 100, 100, 22)).toBe(a);
    expect(pick([a, b], 100, 100, 22)).toBe(a);
    // Nearness comes before priority.
    expect(pick([body('home', 120, 100, 0), near], 100, 100, 22)).toBe(near);
  });
  it('a body exactly at the radius is picked; one beyond it, or no body at all, gives null', () => {
    expect(pick([body('edge', 122, 100)], 100, 100, 22)?.key).toBe('edge');
    expect(pick([body('out', 122.5, 100)], 100, 100, 22)).toBeNull();
    expect(pick([body('diag', 116, 116)], 100, 100, 22)).toBeNull();
    expect(pick([], 100, 100, 22)).toBeNull();
  });
  it('the radius is the caller\'s: a body 15 px away is picked under touch and missed under mouse', () => {
    const bodies = [body('moon', 115, 100)];
    expect(pick(bodies, 100, 100, 22)?.key).toBe('moon');
    expect(pick(bodies, 100, 100, 10)).toBeNull();
  });
});
