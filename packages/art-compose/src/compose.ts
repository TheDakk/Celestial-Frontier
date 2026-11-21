import { fallbackKey, type Catalogue } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';
import { assembleWithScaffold } from './assemble';
import { blit, hashBuffer, type PixelBuffer } from './buffer';
import { finish } from './finish';

export interface Composed {
  buffer: PixelBuffer;
  contact: readonly [number, number] | null;
  gaps: readonly string[];
  hash: string;
}

/**
 * Assembles, finishes and hashes one pose. When there is nothing to draw (no parts, no scaffold,
 * or every part failed), the `rest` frame of the fallback for the recipe's family and tier is drawn instead, its anchor at the
 * scaffold origin (or the canvas centre when there is no scaffold), and `fallback:<family>` is noted. A missing fallback throws.
 */
export function compose(recipe: Recipe, poseId: string, catalogue: Catalogue): Composed {
  const { buffer, contact, gaps, scaffold } = assembleWithScaffold(recipe, poseId, catalogue);
  const out = [...gaps];
  if (recipe.parts.length === 0 || scaffold === undefined || buffer.pixels.every((p) => p === 0)) {
    const id = catalogue.fallbacks.get(fallbackKey(recipe.family, recipe.tier));
    const part = id === undefined ? undefined : catalogue.parts.get(id);
    const frame = part !== undefined && Object.hasOwn(part.frames, 'rest') ? part.frames['rest'] : undefined;
    if (frame === undefined) throw new Error(`no fallback for family ${recipe.family} at ${recipe.tier}`);
    const [x, y] = scaffold === undefined ? [buffer.w >> 1, buffer.h >> 1] : scaffold.origin;
    blit(buffer, frame, x, y);
    out.push(`fallback:${recipe.family}`);
  }
  finish(buffer);
  return { buffer, contact, gaps: out, hash: hashBuffer(buffer) };
}
