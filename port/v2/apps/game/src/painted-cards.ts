// App wiring for the painted individual on the card (morph system; Nick 2026-09-22 option 3: every device). The six
// archetypes' sealed card masters, labels, receipts and records are SHIPPED as app assets (`?url` imports — a production
// build carries them; nothing here depends on the dev-only proof-asset fetch), so the painted card works wherever the
// app runs. The species-art loader asks this source first; the painter tier answers for every other species.
import a0_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/card/card.json?url';
import a0_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json?url';
import a0_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/card/master-512.png?url';
import a0_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/card/labels-512.png?url';
import a1_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/card/card.json?url';
import a1_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/record.json?url';
import a1_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/card/master-512.png?url';
import a1_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/card/labels-512.png?url';
import a2_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/card/card.json?url';
import a2_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/record.json?url';
import a2_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/card/master-512.png?url';
import a2_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/card/labels-512.png?url';
import a3_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/card/card.json?url';
import a3_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/record.json?url';
import a3_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/card/master-512.png?url';
import a3_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/card/labels-512.png?url';
import a4_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/card/card.json?url';
import a4_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/record.json?url';
import a4_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/card/master-512.png?url';
import a4_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/card/labels-512.png?url';
import a5_cardJson from '../../../../../audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/card/card.json?url';
import a5_record from '../../../../../audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/record.json?url';
import a5_master from '../../../../../audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/card/master-512.png?url';
import a5_labels from '../../../../../audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/card/labels-512.png?url';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { PaintedCardSource, type PaintedCardAssets } from './morph/painted-card-source.js';
/** Repo-relative fit dir → its shipped asset URLs by file. Keys are the paths `PaintedCardSource` asks for. */
export const CARD_ASSET_URLS: ReadonlyMap<string, Readonly<Record<string, string>>> = new Map([
  ['audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/', { 'card/card.json': a0_cardJson, 'record.json': a0_record, 'card/master-512.png': a0_master, 'card/labels-512.png': a0_labels }],
  ['audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/', { 'card/card.json': a1_cardJson, 'record.json': a1_record, 'card/master-512.png': a1_master, 'card/labels-512.png': a1_labels }],
  ['audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/', { 'card/card.json': a2_cardJson, 'record.json': a2_record, 'card/master-512.png': a2_master, 'card/labels-512.png': a2_labels }],
  ['audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/', { 'card/card.json': a3_cardJson, 'record.json': a3_record, 'card/master-512.png': a3_master, 'card/labels-512.png': a3_labels }],
  ['audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/', { 'card/card.json': a4_cardJson, 'record.json': a4_record, 'card/master-512.png': a4_master, 'card/labels-512.png': a4_labels }],
  ['audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/', { 'card/card.json': a5_cardJson, 'record.json': a5_record, 'card/master-512.png': a5_master, 'card/labels-512.png': a5_labels }],
]);
export function cardAssetUrl(repoRelative: string): string {
  for (const [dir, files] of CARD_ASSET_URLS) if (repoRelative.startsWith(dir)) { const u = files[repoRelative.slice(dir.length)]; if (u) return u; }
  throw new Error('painted cards: no shipped asset for ' + repoRelative);
}
export const shippedCardAssets = (fetchImpl: typeof fetch = fetch): PaintedCardAssets => ({
  json: async (p) => { const r = await fetchImpl(cardAssetUrl(p)); if (!r.ok) throw new Error(`painted card asset ${p}: HTTP ${r.status}`); return r.json(); },
  bytes: async (p) => { const r = await fetchImpl(cardAssetUrl(p)); if (!r.ok) throw new Error(`painted card asset ${p}: HTTP ${r.status}`); return new Uint8Array(await r.arrayBuffer()); },
});
export function createPaintedCardsForApp(fetchImpl: typeof fetch = fetch): PaintedCardSource {
  for (const a of CARD_ARCHETYPES) if (!CARD_ASSET_URLS.has(a.dir)) throw new Error('painted cards: archetype without shipped assets: ' + a.earthName);
  return new PaintedCardSource({ assets: shippedCardAssets(fetchImpl), registry: CARD_ARCHETYPES });
}
