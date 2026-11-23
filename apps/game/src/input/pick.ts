export interface Pickable { key: string; x: number; y: number; priority: number }

/** Keys in code-unit order, the same on every device. */
export const compareKeys = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The body a tap at (x, y) selects: the nearest one whose position is within `radius` (the radius itself
 * included). Equal distance goes to the lower priority, then the smaller key. Null when none is that near.
 */
export function pick<T extends Pickable>(bodies: readonly T[], x: number, y: number, radius: number): T | null {
  let best: T | null = null;
  let bestSquared = radius * radius;
  for (const body of bodies) {
    const squared = (body.x - x) * (body.x - x) + (body.y - y) * (body.y - y);
    if (squared > bestSquared) continue;
    if (best === null || squared < bestSquared || body.priority < best.priority
      || (body.priority === best.priority && compareKeys(body.key, best.key) < 0)) {
      best = body;
      bestSquared = squared;
    }
  }
  return best;
}
