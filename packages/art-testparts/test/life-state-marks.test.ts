import { describe, expect, it } from 'vitest';
import { compose } from '@cf/art-compose';
import { buildRecipe } from '@cf/art-recipe';
import { testCatalogue } from '@cf/art-testparts';

// A bred creature as the current game stores it: genes plus set-once lineage metadata (as in art-recipe's life-state test).
const genome: Readonly<Record<string, unknown>> = {
  seed: 912345, kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail: 2, limbs: 4, eyes: 0, color: 3, accent: 5,
  pattern: 2, lumin: false, gen: 2, parents: [11, 22], _earthBlend: 'Tiger', _anchorVal: 0.63,
};
const lineage = ['11', '22'];

// Review Focus 5: a creature that is saved, loaded, fed or levelled keeps the same marks, pixel for pixel. The placeholder
// catalogue has flow and spots layers on every torso, head, tail and limb frame, so the creature below is painted.
describe('marks survive a save, a load and a change of life state', () => {
  const layered = testCatalogue();
  const marksOf = (g: Readonly<Record<string, unknown>>) => buildRecipe(g, lineage, layered).parts.map((p) => [p.partId, p.mark]);
  const hashes = (g: Readonly<Record<string, unknown>>) => {
    const r = buildRecipe(g, lineage, layered);
    return ['rest', 'strike'].map((pose) => compose(r, pose, layered).hash);
  };

  it('the creature is real and painted: it has marks, and they change its picture', () => {
    const r = buildRecipe(genome, lineage, layered);
    expect(r.parts.filter((p) => p.mark !== undefined).length).toBeGreaterThan(3);
    const plain = { ...r, marking: { ...r.marking, pattern: 0 } };
    for (const pose of ['rest', 'strike']) {
      const out = compose(r, pose, layered);
      expect(out.gaps.filter((g) => !g.startsWith('variant:'))).toEqual([]);
      expect(out.hash).not.toBe(compose(plain, pose, layered).hash);
    }
  });

  it('a saved and reloaded patterned creature has the same marks', () => {
    const reloaded = JSON.parse(JSON.stringify(genome)) as Record<string, unknown>;
    expect(buildRecipe(reloaded, lineage, layered)).toEqual(buildRecipe(genome, lineage, layered));
    expect(marksOf(reloaded)).toEqual(marksOf(genome));
    expect(hashes(reloaded)).toEqual(hashes(genome));
    // Planted fault: a genome differing in its seed (part of the identity) gives different rolls and a different picture.
    const other = { ...genome, seed: (genome['seed'] as number) + 1 };
    expect(marksOf(other)).not.toEqual(marksOf(genome));
    expect(hashes(other)).not.toEqual(hashes(genome));
  });

  it('changing xp, hurt or fed leaves every mark and the composed hash unchanged in rest and strike', () => {
    const before = hashes(genome);
    for (const [key, value] of [['xp', 486], ['hurt', 0.35], ['fed', 120]] as const) {
      const changed = { ...genome, [key]: value };
      expect(marksOf(changed), key).toEqual(marksOf(genome));
      expect(hashes(changed), key).toEqual(before);
    }
    const all = { ...genome, xp: 9000, hurt: 1, fed: 3 };
    expect(marksOf(all)).toEqual(marksOf(genome));
    expect(hashes(all)).toEqual(before);
    // Planted fault: the same change to the seed instead does change the marks and the picture.
    const reseeded = { ...genome, seed: 912346 };
    expect(marksOf(reseeded)).not.toEqual(marksOf(genome));
    expect(hashes(reseeded)).not.toEqual(before);
  });
});
