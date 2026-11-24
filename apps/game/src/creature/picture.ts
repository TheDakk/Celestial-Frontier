import { PIXEL_GLOW, PIXEL_OUTLINE, TIER_SIZE, fallbackKey } from '@cf/art-format';
import type { Catalogue, SizeTier } from '@cf/art-format';
import { compose } from '@cf/art-compose';
import type { PixelBuffer } from '@cf/art-compose';
import { recipeFor } from '@cf/art-recipe';
import type { Recipe } from '@cf/art-recipe';
import type { GameEvents } from '../events';
import { createByteCache } from './cache';

export interface CreaturePicture {
  /** The picture in pixel values, shared with every other asker of it: never written to. */
  readonly buffer: PixelBuffer;
  readonly gaps: readonly string[];
}
export interface CreaturePictures {
  /** The composed picture, from the cache or composed now. Never throws: a kingdom with no stand-in gives a plain marked tile and a counted gap. */
  picture(genome: Readonly<Record<string, unknown>>, lineage: readonly string[], pose: string): CreaturePicture;
  /** Every gap met so far, with the number of different creatures whose pictures showed it. */
  gaps(): ReadonlyMap<string, number>;
  /** The bytes of the pixel buffers the cache holds. */
  bytesHeld(): number;
}

export const PICTURE_BUDGET_BYTES = 24 * 1024 * 1024;
/** The gap of a creature whose family has no stand-in at its size: `fallback:<family>/<size>`. */
const NO_STAND_IN = 'fallback:';
/** The gap of a genome no recipe can be made of, and the gap of a picture the composer could not make for any other cause. */
const UNREADABLE = 'recipe:unreadable';
const FAILED = 'compose:failed';
/** The mark's two solid blocks, one inside the other, about the middle of the canvas: sides in pixels. */
const MARK_OUTER = 12;
const MARK_INNER = 8;

/** A plain marked tile of the tier's size: a block of the outline value with a block of the glow value inside it. Not art: it says a picture is missing. */
function markedTile(tier: SizeTier): PixelBuffer {
  const [w, h] = TIER_SIZE[tier];
  const pixels = new Uint8Array(w * h);
  const block = (side: number, value: number): void => {
    const left = (w - side) >> 1;
    const top = (h - side) >> 1;
    for (let y = top; y < top + side; y++) pixels.fill(value, y * w + left, y * w + left + side);
  };
  block(MARK_OUTER, PIXEL_OUTLINE);
  block(MARK_INNER, PIXEL_GLOW);
  return { w, h, pixels };
}

function hasStandIn(recipe: Recipe, catalogue: Catalogue): boolean {
  const id = catalogue.fallbacks.get(fallbackKey(recipe.family, recipe.tier));
  const part = id === undefined ? undefined : catalogue.parts.get(id);
  return part !== undefined && Object.hasOwn(part.frames, 'rest');
}

/**
 * The one place a screen asks for a creature's picture. A genome is drawn from its recipe (recipeFor: its species pack
 * when the catalogue holds one) in the pose named; pictures are kept up to `budgetBytes` of pixel buffers, the least
 * recently used dropped first. `onGap` is told each gap the first time any picture shows it, with the creature's key.
 */
export function createCreaturePictures(
  catalogue: Catalogue,
  budgetBytes: number = PICTURE_BUDGET_BYTES,
  onGap: (event: GameEvents['creature:gap']) => void = () => {},
): CreaturePictures {
  const cache = createByteCache<CreaturePicture>(budgetBytes);
  const shownBy = new Map<string, Set<string>>();

  const noted = (key: string, picture: CreaturePicture): CreaturePicture => {
    for (const gap of picture.gaps) {
      let creatures = shownBy.get(gap);
      if (creatures === undefined) {
        creatures = new Set();
        shownBy.set(gap, creatures);
        try { onGap({ key, gap }); } catch { /* a listener's failure costs no picture */ }
      }
      creatures.add(key);
    }
    return picture;
  };
  const made = (buffer: PixelBuffer, gaps: readonly string[]): CreaturePicture => ({ buffer, gaps: Object.freeze([...gaps]) });

  return {
    picture(genome, lineage, pose) {
      let recipe: Recipe;
      try {
        recipe = recipeFor(genome, lineage, catalogue);
      } catch {
        return noted(UNREADABLE, made(markedTile('medium'), [UNREADABLE]));
      }
      // An identity is JSON, or `species:` and a key: neither holds the character that parts it from the pose.
      const cacheKey = `${recipe.identity}\u0000${pose}`;
      const held = cache.get(cacheKey);
      if (held !== undefined) return held;
      let picture: CreaturePicture;
      try {
        const composed = compose(recipe, pose, catalogue);
        picture = made(composed.buffer, composed.gaps);
      } catch {
        const gap = hasStandIn(recipe, catalogue) ? FAILED : `${NO_STAND_IN}${fallbackKey(recipe.family, recipe.tier)}`;
        picture = made(markedTile(recipe.tier), [...recipe.gaps, gap]);
      }
      cache.put(cacheKey, picture, picture.buffer.pixels.byteLength);
      return noted(recipe.identity, picture);
    },
    gaps: () => new Map([...shownBy].map(([gap, creatures]) => [gap, creatures.size])),
    bytesHeld: () => cache.bytesHeld(),
  };
}
