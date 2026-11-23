/** A body on the map, in CSS pixels. `reach` is half the width of the game's own picture of it, where it has one. */
export interface Pickable { key: string; x: number; y: number; priority: number; reach?: number }

/** Keys in code-unit order, the same on every device. */
export const compareKeys = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The body a press at (x, y) selects. A body is under the press when the press is on its picture (the square `reach`
 * each way from its middle, as the game's sprite is) or within `radius` of its middle (the radius itself included),
 * which keeps a body drawn small easy to press. Of the bodies under it the one whose middle is nearest is selected;
 * equal distance goes to the lower priority, then the smaller key. Null when none is under it.
 */
export function pick<T extends Pickable>(bodies: readonly T[], x: number, y: number, radius: number): T | null {
  let best: T | null = null;
  let bestSquared = Infinity;
  for (const body of bodies) {
    const [dx, dy] = [Math.abs(body.x - x), Math.abs(body.y - y)];
    const squared = dx * dx + dy * dy;
    const reach = body.reach ?? 0;
    if (squared > radius * radius && (dx > reach || dy > reach)) continue;
    if (best === null || squared < bestSquared || (squared === bestSquared && (body.priority < best.priority
      || (body.priority === best.priority && compareKeys(body.key, best.key) < 0)))) {
      best = body;
      bestSquared = squared;
    }
  }
  return best;
}
