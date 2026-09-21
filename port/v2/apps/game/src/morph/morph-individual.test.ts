// Step 4 outcome: an individual (archetype + genome) loads through the REAL paint-skin loader on the node path the
// browser will take (exact JS PNG decode → remap → seam guard → buffer texture), with the joint scales in the rig.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FITS, REPO_ROOT, alphaBoxOf, repoJson, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import { createPartsRig } from '../battle2/parts-rig.js';
import { loadCreatureRigV1, type CreaturePartsBindingV1 } from '../creature-rig.js';
import { compileBodyCard } from '../motion/body-card.js';
import { individualFromGenomeV1, paletteFramesV1 } from './morph-individual.js';
import { PROPORTION_ENVELOPE } from './morph-params.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const crab = () => { const dir = FITS.crab, record = repoJson<FitRecord>(dir + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(dir + 'binding.json'), manifest = repoJson<{ creatureId: string }>(dir + 'parts/manifest.json');
  const keyed = PNG.sync.read(readFileSync(new URL(dir + 'parts/keyed.png', REPO_ROOT))); const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.data[i * 4 + 3] ?? 0;
  const master = new Uint8Array(readFileSync(new URL(record.source, REPO_ROOT))), atlas = new Uint8Array(readFileSync(new URL(dir + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT)));
  return { record, binding, card: compileBodyCard(record, record.genome), keyed, alpha, master, atlas }; };
describe('morph individual — archetype + genome through the real loader', () => {
  it('identity genome: no joint scale, no atlas remap (the archetype\'s own path); frames cover base and accent roles', () => {
    const f = crab(); const id = individualFromGenomeV1({ record: f.record, binding: f.binding, card: f.card, genome: { seed: 4, size: 2 } });
    expect(id.params.identity).toBe(true); expect(id.jointScale).toBeUndefined(); expect(id.atlasPixels).toBeUndefined();
    const frames = paletteFramesV1(f.binding, f.card); expect(frames.some((x) => x.role === 'base') && frames.some((x) => x.role === 'accent')).toBe(true); expect(id.frames).toEqual(frames);
  });
  it('a crimson, big-headed crab loads through loadCreatureRigV1 on the JS-decode path: texture at the atlas size, seam-guard receipt present, same part count as the archetype; the parts rig reads the eye stalks scaled; the individual is deterministic', async () => {
    const f = crab(); const genome = { seed: 77, color: 1, accent: 4, head: 7 };
    const morph = individualFromGenomeV1({ record: f.record, binding: f.binding, card: f.card, genome });
    expect(morph.atlasPixels).toBeDefined(); expect(morph.jointScale).toEqual({ eyeFarRoot: 1 + (PROPORTION_ENVELOPE.antennae[1] - 1) * 0.6, eyeNearRoot: 1 + (PROPORTION_ENVELOPE.antennae[1] - 1) * 0.6 });
    const paint = await loadCreatureRigV1(f.record, f.binding, f.master, f.alpha, f.atlas, undefined, { jointScale: morph.jointScale!, atlasPixels: morph.atlasPixels! });
    const rig = createPartsRig({ record: f.record, rig: paint, card: f.card, alphaBox: alphaBoxOf(f.keyed.data, f.keyed.width, f.keyed.height), binding: f.binding, jointScale: morph.jointScale! });
    rig.applyPose({}); expect(rig.refusals()).toBe(0);
    const plain = await loadCreatureRigV1(f.record, f.binding, f.master, f.alpha, f.atlas, undefined, { atlasPixels: (rgba) => new Uint8Array(rgba) }); // same decode path, no remap, no scale
    const plainRig = createPartsRig({ record: f.record, rig: plain, card: f.card, alphaBox: alphaBoxOf(f.keyed.data, f.keyed.width, f.keyed.height), binding: f.binding });
    plainRig.applyPose({});
    expect(paint.parts.length).toBe(plain.parts.length);
    const d = (r: typeof rig, a: string, b: string) => { const pa = r.jointPosition(a)!, pb = r.jointPosition(b)!; return Math.hypot(pa.x - pb.x, pa.y - pb.y); };
    const pivot = f.card.parts.find((p) => p.joint === 'eyeNearRoot')!.parent;
    expect(d(rig, 'eyeNearTip', pivot) / d(plainRig, 'eyeNearTip', pivot)).toBeCloseTo(morph.jointScale!.eyeNearRoot!, 6);
    for (const p of f.card.parts) if (p.group === 'legs') { const a = rig.jointPosition(p.joint)!, b = plainRig.jointPosition(p.joint)!; expect(Math.hypot(a.x - b.x, a.y - b.y), p.joint).toBeLessThan(1e-12); }
    const again = individualFromGenomeV1({ record: f.record, binding: f.binding, card: f.card, genome }); expect(JSON.stringify(again.params)).toBe(JSON.stringify(morph.params));
    rig.dispose(); plainRig.dispose();
  });
  it('NEGATIVE CONTROL: a remap that touches alpha is refused by the loader', async () => {
    const f = crab();
    await expect(loadCreatureRigV1(f.record, f.binding, f.master, f.alpha, f.atlas, undefined, { atlasPixels: (rgba) => { const o = new Uint8Array(rgba); o[3] = (o[3]! + 1) & 255; return o; } })).rejects.toThrow(/keep alpha/);
    await expect(loadCreatureRigV1(f.record, f.binding, f.master, f.alpha, f.atlas, undefined, { atlasPixels: (rgba) => rgba.subarray(0, rgba.length - 4) })).rejects.toThrow(/pixels size/);
  });
});
