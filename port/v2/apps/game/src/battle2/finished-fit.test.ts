// R9 rebind control (offline half): every finished crab fit loads through the REAL rig loader on its own
// finished atlas; its binding differs from the painter fit only by atlasSha256/bindingHash; and the painter
// binding with the finished atlas (or vice versa) is refused. The native numeric rows on Codex's harness are
// the other half and run at the R3 re-merge.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Texture, TextureSource } from 'pixi.js';
import { loadCreatureRigV1, type CreaturePartsBindingV1 } from '../creature-rig.js';
import { FITS, REPO_ROOT, repoJson, type FitRecord, type FitName } from './parts-rig.fixtures.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Uint8Array } } } };
const CRABS = ['crab', 'coconut-crab', 'freshwater-crab', 'mud-crab', 'vent-crab'] as const;
const finishedDir = (id: string) => `audits/ANATOMY_COMPLETION_20260917/crab-fits-finished-01/${id}/`;
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const strip = (b: CreaturePartsBindingV1) => { const { atlasSha256, bindingHash, ...rest } = b as CreaturePartsBindingV1 & { atlasSha256: string; bindingHash: string }; return JSON.stringify(rest); };
async function load(dir: string) {
  const record = repoJson<FitRecord>(dir + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(dir + 'binding.json'), manifest = repoJson<{ creatureId: string }>(dir + 'parts/manifest.json');
  const keyed = PNG.sync.read(readFileSync(new URL(dir + 'parts/keyed.png', REPO_ROOT)));
  const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.data[i * 4 + 3] ?? 0;
  const master = new Uint8Array(readFileSync(new URL(record.source, REPO_ROOT))), atlas = new Uint8Array(readFileSync(new URL(dir + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT)));
  const decoder = (): Promise<Texture> => Promise.resolve(new Texture({ source: new TextureSource({ width: binding.atlasSize.width, height: binding.atlasSize.height }) }));
  return { record, binding, master, alpha, atlas, decoder };
}
describe('R9 finished crab fits', () => {
  for (const id of CRABS) it(`${id}: finished fit loads on its finished atlas; geometry identical to the painter fit; swapped atlases refused`, async () => {
    const painter = await load(FITS[id as FitName]), finished = await load(finishedDir(id));
    expect(strip(finished.binding)).toBe(strip(painter.binding));
    expect(finished.binding.atlasSha256).not.toBe(painter.binding.atlasSha256);
    expect(sha(finished.atlas)).toBe(finished.binding.atlasSha256);
    expect(finished.record).toEqual(painter.record);
    const rig = await loadCreatureRigV1(finished.record, finished.binding, finished.master, finished.alpha, finished.atlas, finished.decoder);
    expect(rig.parts.length).toBe((await loadCreatureRigV1(painter.record, painter.binding, painter.master, painter.alpha, painter.atlas, painter.decoder)).parts.length);
    rig.applyPose({}); rig.dispose();
    await expect(loadCreatureRigV1(painter.record, painter.binding, painter.master, painter.alpha, finished.atlas, painter.decoder)).rejects.toThrow(/atlas hash/);
    await expect(loadCreatureRigV1(finished.record, finished.binding, finished.master, finished.alpha, painter.atlas, finished.decoder)).rejects.toThrow(/atlas hash/);
    // The finished texture's alpha plane is the painter's: every keyed pixel row matches.
    const keyedP = PNG.sync.read(readFileSync(new URL(FITS[id as FitName] + 'parts/keyed.png', REPO_ROOT))), keyedF = PNG.sync.read(readFileSync(new URL(finishedDir(id) + 'parts/keyed.png', REPO_ROOT)));
    let differingAlpha = 0; for (let i = 3; i < keyedP.data.length; i += 4) if (keyedP.data[i] !== keyedF.data[i]) differingAlpha++;
    expect(differingAlpha).toBe(0);
  });
});
