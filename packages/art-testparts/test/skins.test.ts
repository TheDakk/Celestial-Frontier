import { describe, expect, it } from 'vitest';
import { SKIN_NAMES } from '@cf/art-format';
import { buildRecipe } from '@cf/art-recipe';
import { assemble, SKIN_TABLE } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { alternations, checkers, coverage, COVER_MOST, lonePixels, type Picture } from '../../art-compose/test/texture-measures';

const cat = testCatalogue();
const POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
// The ten four-legged torso types, by body gene, and one body of each other family the catalogue draws with a skin.
const BODIES = [0, 2, 6, 7, 8, 10, 11, 12, 13, 14, 1, 3, 4, 5, 9];
const TEXTURED = SKIN_NAMES.map((name, gene) => ({ name, gene })).filter(({ name }) => SKIN_TABLE[name].mode !== 'none' && SKIN_TABLE[name].mode !== 'edge');
const genome = (body: number, skin: number, seed: number, pattern: number) =>
  ({ kingdom: 'fauna', body, head: seed % 10, tail: 1 + (seed % 6), limbs: seed % 6, eyes: seed % 6, size: 2, loco: 0, habitat: 0, color: 3, accent: 5, pattern, skin, seed });

describe('a textured skin on a whole creature', () => {
  it('seven skins are textured', () => {
    expect(TEXTURED.map((s) => s.name)).toEqual(['scaled', 'furred', 'chitinous', 'plated', 'warty', 'feathered', 'crystalline']);
  });

  for (const { name, gene } of TEXTURED) {
    it(`${name}: stacked, posed and patterned, no texture pixel stands alone, none makes a checker or a run of every other pixel, and the texture stays sparse`, () => {
      let textured = 0;
      for (const body of BODIES) {
        for (let seed = 1; seed <= 6; seed++) {
          const recipe = buildRecipe(genome(body, gene, seed, seed % 3 === 0 ? 2 : 0), [], cat);
          if (recipe.skin === null) continue; // a body with no skin gene (a radial)
          expect(recipe.skin, `body ${body}`).toBe(gene);
          for (const pose of POSES) {
            // The same creature with no skin is the picture the texture is measured against.
            const before = assemble({ ...recipe, skin: null }, pose, cat).buffer;
            const after = assemble(recipe, pose, cat).buffer;
            const p: Picture = { w: after.w, h: after.h, before: before.pixels, after: after.pixels };
            const label = `${name} body ${body} seed ${seed} ${pose}`;
            expect(lonePixels(p), `lone pixels: ${label}`).toBe(0);
            expect(checkers(p), `checkers: ${label}`).toBe(0);
            expect(alternations(p), `runs of every other pixel: ${label}`).toBe(0);
            expect(coverage(p), `coverage: ${label}`).toBeLessThanOrEqual(COVER_MOST);
            if (after.pixels.some((v, i) => v !== before.pixels[i])) textured++;
          }
        }
      }
      // Most pictures hold texture, so the measures measured something.
      expect(textured).toBeGreaterThan(300);
    });
  }

  it('a plain skin is not settled: slick lights every top edge, lone pixels and all', () => {
    // Slick is an edge light, not a texture: the composer leaves it exactly as the part painter drew it.
    const recipe = buildRecipe(genome(0, SKIN_NAMES.indexOf('slick'), 1, 0), [], cat);
    const before = assemble({ ...recipe, skin: null }, 'rest', cat).buffer;
    const after = assemble(recipe, 'rest', cat).buffer;
    expect(after.pixels.some((v, i) => v !== before.pixels[i])).toBe(true);
    expect(after.pixels.every((v, i) => v === before.pixels[i] || v === (before.pixels[i] ?? 0) + 1)).toBe(true);
  });
});
