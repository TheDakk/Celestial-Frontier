import { fallbackKey, type Catalogue } from '@cf/art-format';
import { lacksEssentialPart, type Recipe } from '@cf/art-recipe';
import { assembleWithScaffold } from './assemble';
import { blit, hashBuffer, type PixelBuffer } from './buffer';
import { finish } from './finish';
import { applyFinish, checkFinishLevel } from './finishes';

export interface Composed {
  buffer: PixelBuffer;
  contact: readonly [number, number] | null;
  gaps: readonly string[];
  hash: string;
}

/**
 * Assembles, finishes and hashes one pose. When there is nothing to draw (no parts, no scaffold,
 * or every part failed), or the pack lacks a torso, a head or a limb the creature asks for (lacksEssentialPart: no part
 * of it is then drawn, and the gaps are the recipe's, the pose's and each such missing part's), the `rest` frame of the fallback for the recipe's family and tier is drawn instead, its anchor at the
 * scaffold origin (or the canvas centre when there is no scaffold), and `fallback:<family>` is noted. A missing fallback throws.
 * The rarity finish at `finishLevel` (the caller's choice; finishes.ts) goes on last; level 0, the default, draws none;
 * any level but 0 to 3 throws a RangeError before anything is read.
 */
export function compose(recipe: Recipe, poseId: string, catalogue: Catalogue, finishLevel: 0 | 1 | 2 | 3 = 0): Composed {
  checkFinishLevel(finishLevel);
  // A part the recipe still lists and the catalogue does not hold is missing as much as one the recipe's gaps name.
  const unheld = recipe.parts.filter((p) => !catalogue.parts.has(p.partId)).map((p) => `missing:${p.partId}`).filter(lacksEssentialPart);
  const standIn = unheld.length > 0 || recipe.gaps.some(lacksEssentialPart);
  const drawn = standIn ? { ...recipe, parts: [] } : recipe;
  const { buffer, contact, gaps, scaffold } = assembleWithScaffold(drawn, poseId, catalogue);
  const out = standIn ? [...gaps, ...unheld] : [...gaps];
  if (drawn.parts.length === 0 || scaffold === undefined || buffer.pixels.every((p) => p === 0)) {
    const id = catalogue.fallbacks.get(fallbackKey(recipe.family, recipe.tier));
    const part = id === undefined ? undefined : catalogue.parts.get(id);
    const frame = part !== undefined && Object.hasOwn(part.frames, 'rest') ? part.frames['rest'] : undefined;
    if (frame === undefined) throw new Error(`no fallback for family ${recipe.family} at ${recipe.tier}`);
    const [x, y] = scaffold === undefined ? [buffer.w >> 1, buffer.h >> 1] : scaffold.origin;
    blit(buffer, frame, x, y);
    out.push(`fallback:${recipe.family}`);
  }
  finish(buffer);
  applyFinish(buffer, finishLevel);
  return { buffer, contact, gaps: out, hash: hashBuffer(buffer) };
}
