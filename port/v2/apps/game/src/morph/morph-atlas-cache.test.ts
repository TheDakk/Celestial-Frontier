import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { Texture } from 'pixi.js';
import { FITS, REPO_ROOT, repoJson, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import { decodeMorphedAtlas, loadCreatureRigV1, type CreaturePartsBindingV1 } from '../creature-rig.js';
import { compileBodyCard } from '../motion/body-card.js';
import { MorphAtlasCache, morphAtlasKey } from './morph-atlas-cache.js';
import { individualFromGenomeV1 } from './morph-individual.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const fake = (w = 4, h = 4) => { const t = { width: w, height: h, destroyed: false, destroy() { this.destroyed = true; } }; return t as unknown as Texture & { destroyed: boolean }; };
describe('morph atlas cache — one texture per individual, borrowed by rigs, evicted only when unreferenced', () => {
  it('produces once per key, shares concurrent acquires, ref-counts releases, evicts LRU unreferenced entries beyond the cap and never a borrowed one', async () => {
    const made: (Texture & { destroyed: boolean })[] = []; const cache = new MorphAtlasCache({ maxEntries: 2, destroy: (t) => { (t as unknown as { destroy(): void }).destroy(); } });
    const produce = () => async () => { const t = fake(); made.push(t); return t; };
    const [a1, a2] = await Promise.all([cache.acquire('A', produce()), cache.acquire('A', produce())]); expect(a1.texture).toBe(a2.texture); expect(cache.stats().produces).toBe(1); expect(cache.stats().borrowed).toBe(1);
    const b = await cache.acquire('B', produce()), c = await cache.acquire('C', produce()); expect(cache.stats().entries).toBe(3); // over the cap but everything is borrowed: nothing evicted
    expect(made.every((t) => !t.destroyed)).toBe(true);
    a1.release(); a1.release(); expect(cache.stats().entries).toBe(3); a2.release(); // A now unreferenced → evicted (cap 2)
    expect(cache.has('A')).toBe(false); expect(made[0]!.destroyed).toBe(true); expect(made[1]!.destroyed).toBe(false);
    b.release(); c.release(); expect(cache.stats().entries).toBe(2); cache.clearUnreferenced(); expect(cache.stats().entries).toBe(0); expect(made.every((t) => t.destroyed)).toBe(true);
    expect(morphAtlasKey('r', 'k', null)).toBe('r|k|'); expect(morphAtlasKey('r', 'k', 'striped')).not.toBe(morphAtlasKey('r', 'k', null));
  });
  it('through the real loader: two crab rigs borrow ONE morphed texture (decoded + remapped once); disposing both leaves it alive; releasing and evicting destroys it', async () => {
    const dir = FITS.crab, record = repoJson<FitRecord>(dir + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(dir + 'binding.json'), manifest = repoJson<{ creatureId: string }>(dir + 'parts/manifest.json'), card = compileBodyCard(record, record.genome);
    const keyed = PNG.sync.read(readFileSync(new URL(dir + 'parts/keyed.png', REPO_ROOT))); const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.data[i * 4 + 3] ?? 0;
    const master = new Uint8Array(readFileSync(new URL(record.source, REPO_ROOT))), atlas = new Uint8Array(readFileSync(new URL(dir + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT)));
    const morph = individualFromGenomeV1({ record, binding, card, genome: { seed: 77, color: 1, accent: 4 } }); expect(morph.atlasPixels).toBeDefined();
    const cache = new MorphAtlasCache({ maxEntries: 1 }); let decodes = 0;
    const lease = async () => cache.acquire(morphAtlasKey(record.recipeHash, 'crimson', morph.marking), async () => { decodes++; return (await decodeMorphedAtlas(atlas, record, binding, morph.atlasPixels!)).texture; });
    const [l1, l2] = await Promise.all([lease(), lease()]); expect(decodes).toBe(1); expect(l1.texture).toBe(l2.texture);
    const r1 = await loadCreatureRigV1(record, binding, master, alpha, atlas, async () => l1.texture, { borrowedAtlas: true }), r2 = await loadCreatureRigV1(record, binding, master, alpha, atlas, async () => l2.texture, { borrowedAtlas: true });
    r1.applyPose({}); r2.applyPose({}); r1.dispose(); r2.dispose();
    expect(l1.texture.destroyed).toBe(false); expect(cache.stats().borrowed).toBe(1);
    l1.release(); l2.release(); expect(cache.stats().entries).toBe(1); // still cached (cap 1), unreferenced, ready for the next battle
    const other = await cache.acquire('other', async () => (await decodeMorphedAtlas(atlas, record, binding, (rgba) => new Uint8Array(rgba))).texture); // a second individual evicts the first
    expect(l1.texture.destroyed).toBe(true); expect(cache.stats().evictions).toBe(1); other.release();
  });
});
