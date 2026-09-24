/** Test fixtures for the parts rig: loads Codex's REAL source paint-skin fits (crab-fits-03 × 5, the
 * candidate-10 Civet) exactly as the study does — record, binding, keyed alpha, painter master, atlas —
 * with a synthetic texture decoder (no GPU). Not a test file itself (shared by two suites). */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Texture, TextureSource } from 'pixi.js';
import { loadCreatureRigV1, type CreaturePartsBindingV1, type CreatureRigRecordV1 } from '../creature-rig.js';
import { compileBodyCard, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import type { PixelBox } from './fixture-rig.js';
import { createPartsRig, type PartsRig } from './parts-rig.js';
import { repoRelativeSource } from '../../../../tools/creature-animation/record-source.mjs';

const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Uint8Array } } } };
/** Repository root (apps/game/src/battle2 → six levels up). */
export const REPO_ROOT = new URL('../../../../../../', import.meta.url);
export const FITS = Object.freeze({
  crab: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/', 'coconut-crab': 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/',
  'freshwater-crab': 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/', 'mud-crab': 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/',
  'vent-crab': 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/', civet: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/',
});
export type FitName = keyof typeof FITS;
export type FitRecord = CreatureRigRecordV1 & ResolvedAnatomyRecord & { readonly source: string; readonly genome?: MotionGenomeFields };
export const repoJson = <T,>(rel: string): T => JSON.parse(readFileSync(new URL(rel, REPO_ROOT), 'utf8')) as T;
export function alphaBoxOf(rgba: Uint8Array, w: number, h: number): PixelBox {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((rgba[(y * w + x) * 4 + 3] ?? 0) > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error('empty alpha'); return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
export async function loadFit(name: FitName, contact?: 'family' | 'quadruped-compat' | 'auto'): Promise<{ rig: PartsRig; record: FitRecord; binding: CreaturePartsBindingV1; card: BodyCard }> {
  return loadFitDir(FITS[name], contact);
}
/** A fit by directory (repo-relative, e.g. the Brown Bear guardian fit `audits/VISION_D2_GUARDIAN_20260921/fit-01/`). */
export async function loadFitDir(dirIn: string, contact?: 'family' | 'quadruped-compat' | 'auto', contactSupports?: 'rest' | 'observed', jointScale?: Readonly<Record<string, number>>): Promise<{ rig: PartsRig; record: FitRecord; binding: CreaturePartsBindingV1; card: BodyCard }> {
  const dir = dirIn.endsWith('/') ? dirIn : dirIn + '/';
  const record = repoJson<FitRecord>(dir + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(dir + 'binding.json'), manifest = repoJson<{ creatureId: string }>(dir + 'parts/manifest.json');
  const keyed = PNG.sync.read(readFileSync(new URL(dir + 'parts/keyed.png', REPO_ROOT)));
  const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.data[i * 4 + 3] ?? 0;
  const master = new Uint8Array(readFileSync(new URL(repoRelativeSource(record.source), REPO_ROOT))), atlas = new Uint8Array(readFileSync(new URL(dir + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT)));
  const decoder = (): Promise<Texture> => Promise.resolve(new Texture({ source: new TextureSource({ width: binding.atlasSize.width, height: binding.atlasSize.height }) }));
  const paintRig = await loadCreatureRigV1(record, binding, master, alpha, atlas, decoder, jointScale ? { jointScale } : {});
  const card = compileBodyCard(record, record.genome);
  return { rig: createPartsRig({ record, rig: paintRig, card, alphaBox: alphaBoxOf(keyed.data, keyed.width, keyed.height), binding, ...(contact ? { contact } : {}), ...(contactSupports ? { contactSupports } : {}), ...(jointScale ? { jointScale } : {}) }), record, binding, card };
}
