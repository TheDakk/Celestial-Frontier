import type { Catalogue } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';
import { assemble } from './assemble';
import { blit, hashBuffer, type PixelBuffer } from './buffer';

const OUTLINE = 16;

/**
 * The finishing pass, in place: outline, then light, then shade. Every decision is read from a
 * copy taken before the outline, so the outline is one pixel thick and light and shade see the
 * shape, not its outline. Neighbours outside the canvas count as transparent.
 */
export function finish(buffer: PixelBuffer): void {
  const { w, h, pixels } = buffer;
  const before = pixels.slice();
  const clear = (x: number, y: number): boolean => x < 0 || y < 0 || x >= w || y >= h || before[y * w + x] === 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = before[i] ?? 0;
      if (v === 0) {
        if (!clear(x - 1, y) || !clear(x + 1, y) || !clear(x, y - 1) || !clear(x, y + 1)) pixels[i] = OUTLINE;
        continue;
      }
      if (v > 12) continue; // 13 eye, 14 highlight, 15 glow, 16 outline: never changed
      // Ramps are 1-4, 5-8 and 9-12: shade is the position 0-3 inside the ramp.
      const base = v - ((v - 1) & 3);
      let shade = v - base;
      if (clear(x, y - 1) && clear(x - 1, y) && shade < 3) shade++;
      if (clear(x, y + 1) && shade > 0) shade--;
      pixels[i] = base + shade;
    }
  }
}

export interface Composed {
  buffer: PixelBuffer;
  contact: readonly [number, number] | null;
  gaps: readonly string[];
  hash: string;
}

/**
 * Assembles, finishes and hashes one pose. When there is nothing to draw (no parts, no scaffold,
 * or every part failed), the family's fallback part is drawn instead and `fallback:<family>` is noted.
 */
export function compose(recipe: Recipe, poseId: string, catalogue: Catalogue): Composed {
  const { buffer, contact, gaps } = assemble(recipe, poseId, catalogue);
  const out = [...gaps];
  const scaffold = catalogue.scaffolds.get(recipe.scaffoldId);
  if (recipe.parts.length === 0 || scaffold === undefined || buffer.pixels.every((p) => p === 0)) {
    const id = catalogue.fallbacks.get(recipe.family);
    const part = id === undefined ? undefined : catalogue.parts.get(id);
    const names = part === undefined ? [] : Object.keys(part.frames);
    const name = names.includes('rest') ? 'rest' : names[0];
    const frame = part === undefined || name === undefined ? undefined : part.frames[name];
    if (frame === undefined) throw new Error(`no fallback for family ${recipe.family}`);
    const [x, y] = scaffold === undefined ? [buffer.w >> 1, buffer.h >> 1] : scaffold.origin;
    blit(buffer, frame, x, y);
    out.push(`fallback:${recipe.family}`);
  }
  finish(buffer);
  return { buffer, contact, gaps: out, hash: hashBuffer(buffer) };
}
