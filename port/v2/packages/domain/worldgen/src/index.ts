/* @cf/domain-worldgen — MODULE 6 of 14 (typed facade over the auto-lift). */
export * from './worldgen.verbatim.js';

/* slimGal lives OUTSIDE the WorldGen module in main.js (line 3014, app section)
   but the baseline `galaxiesInCell` probe depends on it, so the port carries it
   here — body VERBATIM — until its own layer exists. Recorded relocation. */
import type { Gal } from './worldgen.verbatim.js';
export function slimGal(g: Gal | null | undefined): Record<string, unknown> | null {
  if (!g) return null;
  return { x: g.x, y: g.y, size: g.size, sp: g.sp, tilt: g.tilt, rot: g.rot, seed: g.seed,
    home: g.home || false, quasar: g.quasar || false, dwarf: g.dwarf || false };
}
