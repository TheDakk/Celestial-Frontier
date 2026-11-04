import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FITS, REPO_ROOT, repoJson, type FitName, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import type { CreaturePartsBindingV1 } from '../creature-rig.js';
import { compileBodyCard } from '../motion/body-card.js';
import { morphParamsV1 } from './morph-params.js';
import { GREY_SATURATION, dominantHue, paletteConservationV1, paletteRoleOfGroup, remapAtlasPaletteV1, type PaletteFrame } from './morph-palette.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
// JSON + PNG only (no rig): six atlases in one worker must not build six Pixi rigs (the first draft went OOM on the Civet)
const atlasOf = async (name: FitName) => { const record = repoJson<FitRecord>(FITS[name] + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(FITS[name] + 'binding.json'), card = compileBodyCard(record, record.genome); const manifest = JSON.parse(readFileSync(new URL(FITS[name] + 'parts/manifest.json', REPO_ROOT), 'utf8')) as { creatureId: string };
  const png = PNG.sync.read(readFileSync(new URL(FITS[name] + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT)));
  const groupOf = new Map(card.parts.map((p) => [p.joint, p.group] as const));
  const frames: PaletteFrame[] = binding.parts.filter((p) => p.kind === 'part').map((p) => ({ x: p.frame.x, y: p.frame.y, width: p.frame.width, height: p.frame.height, role: paletteRoleOfGroup(groupOf.get(p.joint)) }));
  return { rgba: new Uint8Array(png.data), width: png.width, height: png.height, frames, binding, record }; };
describe('morph palette — luminance-preserving atlas remap (M2) on the real fits', () => {
  for (const name of Object.keys(FITS) as FitName[]) it(`${name}: identity is byte-identical; a colour remap changes only hue/chroma inside the frames (alpha 0 changed, outside 0 changed, luminance ≤ 2/255); deterministic; different colour → different bytes`, async () => {
    const { rgba, width, height, frames, record } = await atlasOf(name);
    expect(frames.some((f) => f.role === 'base')).toBe(true); expect(frames.some((f) => f.role === 'accent')).toBe(true);
    const id = remapAtlasPaletteV1(rgba, width, height, frames, morphParamsV1({}, record.recipeHash)); expect(sha(id)).toBe(sha(rgba)); expect(id === rgba).toBe(false); // never `toBe` a 16 MB typed array: vitest pretty-prints both eagerly and the worker dies at the 4 GB heap (found on the Civet, 2026-09-22)
    const p1 = morphParamsV1({ seed: 11, color: 1, accent: 4 }, record.recipeHash), out1 = remapAtlasPaletteV1(rgba, width, height, frames, p1);
    const c = paletteConservationV1(rgba, out1, width, height, frames);
    expect(c.alphaChanged).toBe(0); expect(c.outsideChanged).toBe(0); expect(c.luminanceMaxDelta).toBeLessThanOrEqual(2); expect(c.changed).toBeGreaterThan(1000);
    expect(sha(remapAtlasPaletteV1(rgba, width, height, frames, p1))).toBe(sha(out1));
    const out2 = remapAtlasPaletteV1(rgba, width, height, frames, morphParamsV1({ seed: 11, color: 9, accent: 4 }, record.recipeHash)); expect(sha(out2)).not.toBe(sha(out1));
    // the base coat's dominant hue moved to the target band; the accent set's to its own
    const hb = dominantHue(out1, width, frames, 'base')!, ha = dominantHue(out1, width, frames, 'accent')!;
    const near = (h: number, t: number) => Math.abs((((h - t) % 360) + 540) % 360 - 180);
    expect(near(hb, p1.base.hue!)).toBeLessThan(25); expect(near(ha, p1.accent.hue!)).toBeLessThan(25);
  });
  it('NEGATIVE CONTROL: a remap that touched alpha or a pixel outside the frames is caught by the conservation check', async () => {
    const { rgba, width, height, frames } = await atlasOf('crab'); const bad = new Uint8Array(rgba);
    let outside = -1; for (let i = 0; i < width * height && outside < 0; i++) { const x = i % width, y = (i / width) | 0; if (!frames.some((f) => x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height)) outside = i; }
    expect(outside).toBeGreaterThanOrEqual(0); bad[outside * 4] = (bad[outside * 4]! + 40) & 255; bad[3] = (bad[3]! + 1) & 255;
    const c = paletteConservationV1(rgba, bad, width, height, frames); expect(c.outsideChanged).toBeGreaterThanOrEqual(1); expect(c.alphaChanged).toBe(1);
  });
  it('grey pixels (saturation below the floor) keep their colour under any remap', () => {
    const w = 4, h = 1, rgba = new Uint8Array([120, 120, 120, 255, 200, 40, 40, 255, 20, 20, 22, 255, 0, 0, 0, 0]); const frames: PaletteFrame[] = [{ x: 0, y: 0, width: 4, height: 1, role: 'base' }];
    const out = remapAtlasPaletteV1(rgba, w, h, frames, morphParamsV1({ seed: 1, color: 4 }, 'x'));
    expect([...out.slice(0, 4)]).toEqual([120, 120, 120, 255]); expect([...out.slice(8, 12)]).toEqual([20, 20, 22, 255]); expect([...out.slice(12)]).toEqual([0, 0, 0, 0]); expect([...out.slice(4, 8)]).not.toEqual([200, 40, 40, 255]);
    expect(GREY_SATURATION).toBeLessThan(0.2);
  });
});
