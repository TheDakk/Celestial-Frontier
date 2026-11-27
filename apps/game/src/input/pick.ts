/** A body on the map, in CSS pixels. */
export interface Pickable { key: string; x: number; y: number; priority: number }

/** Keys in code-unit order, the same on every device. */
export const compareKeys = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The body a press at (x, y) selects, as in the legacy game (celestial-frontier.html 5604-5608): a body is under the
 * press when the press is nearer its middle than its radius, and of the bodies under the press the one whose middle
 * is nearest is selected. `radiusOf` gives each body's radius: the legacy game's differs by the kind of body. Of two
 * exactly as near, the one listed first is selected, as the legacy game keeps the pick it made first (5607): the map
 * lists a system's bodies in the legacy order (space/small-bodies.ts). Null when none is under the press.
 */
export function pick<T extends Pickable>(bodies: readonly T[], x: number, y: number, radiusOf: (body: T) => number): T | null {
  let best: T | null = null;
  let bestSquared = Infinity;
  for (const body of bodies) {
    const [dx, dy] = [body.x - x, body.y - y];
    const squared = dx * dx + dy * dy;
    const radius = radiusOf(body);
    if (squared < radius * radius && squared < bestSquared) {
      best = body;
      bestSquared = squared;
    }
  }
  return best;
}
